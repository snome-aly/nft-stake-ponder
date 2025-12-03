/**
 * 质押 NFT 的自定义 Hook
 * 处理 approve + stake 的完整流程
 */
import { useState } from "react";
import { getContract } from "viem";
import { usePublicClient } from "wagmi";
import deployedContracts from "~~/contracts/deployedContracts";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { notification } from "~~/utils/scaffold-eth";

export function useStakeNFT() {
  const [isProcessing, setIsProcessing] = useState(false);

  const { targetNetwork } = useTargetNetwork();
  const publicClient = usePublicClient({ chainId: targetNetwork.id });

  const { writeContractAsync: approveNFT } = useScaffoldWriteContract({
    contractName: "StakableNFT",
  });

  const { writeContractAsync: stakeNFT } = useScaffoldWriteContract({
    contractName: "NFTStakingPool",
  });

  const handleStake = async (tokenId: number) => {
    try {
      setIsProcessing(true);

      // 获取合约地址
      const chainId = targetNetwork.id;
      const contracts = deployedContracts[chainId as keyof typeof deployedContracts];
      const stakingPoolAddress = contracts?.NFTStakingPool?.address;
      const nftAddress = contracts?.StakableNFT?.address;

      if (!stakingPoolAddress || !nftAddress || !publicClient) {
        throw new Error("Contract addresses or public client not found");
      }

      // Step 1: Check approval status
      const nftContract = getContract({
        address: nftAddress as `0x${string}`,
        abi: contracts.StakableNFT.abi,
        client: publicClient,
      });

      const approved = await nftContract.read.getApproved([BigInt(tokenId)]);
      const isApprovedForStaking = approved === stakingPoolAddress;

      // Step 2: Approve if needed
      if (!isApprovedForStaking) {
        notification.info("Step 1/2: Approving NFT...");

        const approveHash = await approveNFT({
          functionName: "approve",
          args: [stakingPoolAddress as `0x${string}`, BigInt(tokenId)],
        });

        if (!approveHash) {
          throw new Error("Failed to get approval transaction hash");
        }

        // Wait for approval confirmation
        await publicClient.waitForTransactionReceipt({ hash: approveHash });

        notification.success("NFT approved successfully!");
      }

      // Step 3: Stake NFT
      notification.info("Step 2/2: Staking NFT...");

      const stakeHash = await stakeNFT({
        functionName: "stake",
        args: [BigInt(tokenId)],
      });

      if (!stakeHash) {
        throw new Error("Failed to get stake transaction hash");
      }

      // Wait for stake confirmation
      await publicClient.waitForTransactionReceipt({ hash: stakeHash });

      notification.success(`Successfully staked NFT #${tokenId}!`);

      return stakeHash;
    } catch (error: any) {
      console.error("Stake failed:", error);

      // 友好的错误提示
      if (error.message?.includes("Not NFT owner")) {
        notification.error("You don't own this NFT");
      } else if (error.message?.includes("Already staked")) {
        notification.error("This NFT is already staked");
      } else if (error.message?.includes("NFT not revealed yet")) {
        notification.error("This NFT has not been revealed yet. Only revealed NFTs can be staked.");
      } else if (error.message?.includes("User rejected")) {
        notification.error("Transaction cancelled");
      } else {
        notification.error("Staking failed. Please try again.");
      }

      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    handleStake,
    isProcessing,
  };
}

/**
 * 批量质押 NFT 的自定义 Hook
 * 使用 setApprovalForAll + batchStake
 */
export function useBatchStake() {
  const [isProcessing, setIsProcessing] = useState(false);

  const { targetNetwork } = useTargetNetwork();
  const publicClient = usePublicClient({ chainId: targetNetwork.id });

  const { writeContractAsync: approveAll } = useScaffoldWriteContract({
    contractName: "StakableNFT",
  });

  const { writeContractAsync: batchStake } = useScaffoldWriteContract({
    contractName: "NFTStakingPool",
  });

  const handleBatchStake = async (tokenIds: number[], userAddress: `0x${string}`) => {
    try {
      if (tokenIds.length === 0) {
        notification.error("No NFTs selected");
        return;
      }

      setIsProcessing(true);

      // 获取合约地址
      const chainId = targetNetwork.id;
      const contracts = deployedContracts[chainId as keyof typeof deployedContracts];
      const stakingPoolAddress = contracts?.NFTStakingPool?.address;
      const nftAddress = contracts?.StakableNFT?.address;

      if (!stakingPoolAddress || !nftAddress || !publicClient) {
        throw new Error("Contract addresses or public client not found");
      }

      // Step 1: Check if approved for all
      const nftContract = getContract({
        address: nftAddress as `0x${string}`,
        abi: contracts.StakableNFT.abi,
        client: publicClient,
      });

      const isApprovedForAll = await nftContract.read.isApprovedForAll([
        userAddress,
        stakingPoolAddress as `0x${string}`,
      ]);

      // Step 2: Set approval for all if needed
      if (!isApprovedForAll) {
        notification.info("Step 1/2: Approving all NFTs...");

        const approvalHash = await approveAll({
          functionName: "setApprovalForAll",
          args: [stakingPoolAddress as `0x${string}`, true],
        });

        if (!approvalHash) {
          throw new Error("Failed to get approval transaction hash");
        }

        await publicClient.waitForTransactionReceipt({ hash: approvalHash });

        notification.success("All NFTs approved!");
      }

      // Step 3: Batch stake
      notification.info(`Step 2/2: Staking ${tokenIds.length} NFTs...`);

      const batchStakeHash = await batchStake({
        functionName: "batchStake",
        args: [tokenIds.map(id => BigInt(id))],
      });

      if (!batchStakeHash) {
        throw new Error("Failed to get batch stake transaction hash");
      }

      await publicClient.waitForTransactionReceipt({ hash: batchStakeHash });

      notification.success(`Successfully staked ${tokenIds.length} NFTs!`);

      return batchStakeHash;
    } catch (error: any) {
      console.error("Batch stake failed:", error);
      notification.error("Batch staking failed. Please try again.");
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    handleBatchStake,
    isProcessing,
  };
}

/**
 * 领取奖励的自定义 Hook
 */
export function useClaimReward() {
  const [isProcessing, setIsProcessing] = useState(false);

  const { targetNetwork } = useTargetNetwork();
  const publicClient = usePublicClient({ chainId: targetNetwork.id });

  const { writeContractAsync: claimReward } = useScaffoldWriteContract({
    contractName: "NFTStakingPool",
  });

  const handleClaim = async (tokenId: number) => {
    try {
      setIsProcessing(true);

      if (!publicClient) {
        throw new Error("Public client not found");
      }

      notification.info("Claiming reward...");

      const claimHash = await claimReward({
        functionName: "claimReward",
        args: [BigInt(tokenId)],
      });

      if (!claimHash) {
        throw new Error("Failed to get claim transaction hash");
      }

      await publicClient.waitForTransactionReceipt({ hash: claimHash });

      notification.success(`Successfully claimed reward for NFT #${tokenId}!`);

      return claimHash;
    } catch (error: any) {
      console.error("Claim failed:", error);

      if (error.message?.includes("Not staker")) {
        notification.error("You are not the staker of this NFT");
      } else if (error.message?.includes("No reward to claim")) {
        notification.error("No reward to claim yet");
      } else {
        notification.error("Claim failed. Please try again.");
      }

      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    handleClaim,
    isProcessing,
  };
}

/**
 * 批量领取奖励的自定义 Hook
 */
export function useBatchClaimReward() {
  const [isProcessing, setIsProcessing] = useState(false);

  const { targetNetwork } = useTargetNetwork();
  const publicClient = usePublicClient({ chainId: targetNetwork.id });

  const { writeContractAsync: batchClaimReward } = useScaffoldWriteContract({
    contractName: "NFTStakingPool",
  });

  const handleBatchClaim = async (tokenIds: number[]) => {
    try {
      if (tokenIds.length === 0) {
        notification.error("No NFTs selected");
        return;
      }

      setIsProcessing(true);

      if (!publicClient) {
        throw new Error("Public client not found");
      }

      notification.info(`Claiming rewards for ${tokenIds.length} NFTs...`);

      const batchClaimHash = await batchClaimReward({
        functionName: "batchClaimReward",
        args: [tokenIds.map(id => BigInt(id))],
      });

      if (!batchClaimHash) {
        throw new Error("Failed to get batch claim transaction hash");
      }

      await publicClient.waitForTransactionReceipt({ hash: batchClaimHash });

      notification.success(`Successfully claimed rewards from ${tokenIds.length} NFTs!`);

      return batchClaimHash;
    } catch (error: any) {
      console.error("Batch claim failed:", error);
      notification.error("Batch claim failed. Please try again.");
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    handleBatchClaim,
    isProcessing,
  };
}

/**
 * 解押 NFT 的自定义 Hook
 */
export function useUnstake() {
  const [isProcessing, setIsProcessing] = useState(false);

  const { targetNetwork } = useTargetNetwork();
  const publicClient = usePublicClient({ chainId: targetNetwork.id });

  const { writeContractAsync: unstake } = useScaffoldWriteContract({
    contractName: "NFTStakingPool",
  });

  const handleUnstake = async (tokenId: number) => {
    try {
      setIsProcessing(true);

      if (!publicClient) {
        throw new Error("Public client not found");
      }

      notification.info("Unstaking NFT...");

      const unstakeHash = await unstake({
        functionName: "unstake",
        args: [BigInt(tokenId)],
      });

      if (!unstakeHash) {
        throw new Error("Failed to get unstake transaction hash");
      }

      await publicClient.waitForTransactionReceipt({ hash: unstakeHash });

      notification.success(`Successfully unstaked NFT #${tokenId} and claimed rewards!`);

      return unstakeHash;
    } catch (error: any) {
      console.error("Unstake failed:", error);

      if (error.message?.includes("Not staker")) {
        notification.error("You are not the staker of this NFT");
      } else {
        notification.error("Unstake failed. Please try again.");
      }

      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    handleUnstake,
    isProcessing,
  };
}
