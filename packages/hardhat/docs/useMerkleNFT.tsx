/**
 * useMerkleNFT Hook
 *
 * 这是一个完整的 React Hook，用于与 MerkleStakableNFT 合约交互
 *
 * 功能：
 * 1. 铸造 NFT
 * 2. 领取稀有度
 * 3. 查询用户的 NFT
 * 4. 批量领取
 *
 * 使用方式：
 * const { mint, claimRarity, userNFTs, loading } = useMerkleNFT();
 */

import { useState, useEffect, useCallback } from "react";
import { useScaffoldContract, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useAccount } from "wagmi";
import { notification } from "~~/utils/scaffold-eth";

// ========== 类型定义 ==========

interface NFTWithRarity {
  tokenId: number;
  rarity: number | null;
  rarityName: string;
  hasClaimed: boolean;
  multiplier?: number;
}

interface ProofData {
  tokenId: number;
  rarity: number;
  rarityName: string;
  multiplier: number;
  proof: string[];
}

// ========== API 配置 ==========

// Merkle Proof API 地址（需要先启动 API 服务）
const API_BASE_URL = process.env.NEXT_PUBLIC_MERKLE_API_URL || "http://localhost:3001";

// ========== Hook ==========

export function useMerkleNFT() {
  const { address: userAddress } = useAccount();

  // 状态
  const [userNFTs, setUserNFTs] = useState<NFTWithRarity[]>([]);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);

  // 合约实例
  const { data: contract } = useScaffoldContract({
    contractName: "MerkleStakableNFT",
  });

  // 写入函数
  const { writeContractAsync: writeMint } = useScaffoldWriteContract("MerkleStakableNFT");
  const { writeContractAsync: writeClaimRarity } = useScaffoldWriteContract("MerkleStakableNFT");
  const { writeContractAsync: writeClaimRarityBatch } = useScaffoldWriteContract("MerkleStakableNFT");

  // 读取用户拥有的 tokenId
  const { data: tokensOfOwner, refetch: refetchTokens } = useScaffoldReadContract({
    contractName: "MerkleStakableNFT",
    functionName: "tokensOfOwner",
    args: [userAddress],
  });

  // ========== 辅助函数 ==========

  /**
   * 从 API 获取 Merkle Proof
   */
  const fetchProof = async (tokenId: number): Promise<ProofData> => {
    try {
      const response = await fetch(`${API_BASE_URL}/proof/${tokenId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch proof for tokenId ${tokenId}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching proof:", error);
      throw error;
    }
  };

  /**
   * 批量获取 Merkle Proof
   */
  const fetchProofBatch = async (tokenIds: number[]): Promise<ProofData[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/proof/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tokenIds }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch batch proofs");
      }

      const data = await response.json();
      return data.proofs;
    } catch (error) {
      console.error("Error fetching batch proofs:", error);
      throw error;
    }
  };

  /**
   * 检查 NFT 是否已领取稀有度
   */
  const checkIfClaimed = async (tokenId: number): Promise<boolean> => {
    if (!contract) return false;

    try {
      return await contract.read.rarityClaimed([BigInt(tokenId)]);
    } catch (error) {
      console.error(`Error checking claim status for tokenId ${tokenId}:`, error);
      return false;
    }
  };

  /**
   * 获取 NFT 的稀有度
   */
  const getRarity = async (tokenId: number): Promise<number | null> => {
    if (!contract) return null;

    try {
      const claimed = await checkIfClaimed(tokenId);
      if (!claimed) return null;

      const rarity = await contract.read.getRarity([BigInt(tokenId)]);
      return Number(rarity);
    } catch (error) {
      console.error(`Error getting rarity for tokenId ${tokenId}:`, error);
      return null;
    }
  };

  // ========== 公开函数 ==========

  /**
   * 铸造 NFT
   *
   * @param quantity 铸造数量
   */
  const mint = async (quantity: number) => {
    if (!writeMint) {
      notification.error("合约未加载");
      return;
    }

    setLoading(true);

    try {
      const mintPrice = 0.01; // 0.01 ETH
      const totalPrice = (mintPrice * quantity).toString();

      console.log(`🎨 铸造 ${quantity} 个 NFT...`);

      await writeMint({
        functionName: "mint",
        args: [BigInt(quantity)],
        value: parseEther(totalPrice),
      });

      notification.success(`成功铸造 ${quantity} 个 NFT！`);

      // 刷新用户的 NFT 列表
      setTimeout(() => {
        refetchTokens();
      }, 2000);
    } catch (error: any) {
      console.error("Mint error:", error);
      notification.error("铸造失败：" + error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 领取单个 NFT 的稀有度
   *
   * @param tokenId NFT ID
   */
  const claimRarity = async (tokenId: number) => {
    if (!writeClaimRarity) {
      notification.error("合约未加载");
      return;
    }

    setClaiming(true);

    try {
      console.log(`🎁 领取 tokenId ${tokenId} 的稀有度...`);

      // 1. 从 API 获取 Proof
      console.log("  → 获取 Merkle Proof...");
      const proofData = await fetchProof(tokenId);

      console.log(`  → 稀有度: ${proofData.rarityName} (${proofData.rarity})`);
      console.log(`  → 倍率: ${proofData.multiplier / 100}x`);
      console.log(`  → Proof 长度: ${proofData.proof.length}`);

      // 2. 调用合约
      console.log("  → 提交到链上...");
      await writeClaimRarity({
        functionName: "claimRarity",
        args: [BigInt(tokenId), proofData.rarity, proofData.proof],
      });

      notification.success(`成功领取！稀有度: ${proofData.rarityName} (${proofData.multiplier / 100}x)`);

      // 3. 刷新 NFT 列表
      await loadUserNFTs();
    } catch (error: any) {
      console.error("Claim error:", error);
      notification.error("领取失败：" + error.message);
    } finally {
      setClaiming(false);
    }
  };

  /**
   * 批量领取多个 NFT 的稀有度
   *
   * @param tokenIds NFT ID 数组
   */
  const claimRarityBatch = async (tokenIds: number[]) => {
    if (!writeClaimRarityBatch) {
      notification.error("合约未加载");
      return;
    }

    if (tokenIds.length === 0) {
      notification.warning("没有可领取的 NFT");
      return;
    }

    setClaiming(true);

    try {
      console.log(`🎁 批量领取 ${tokenIds.length} 个 NFT 的稀有度...`);

      // 1. 批量获取 Proof
      console.log("  → 获取 Merkle Proofs...");
      const proofsData = await fetchProofBatch(tokenIds);

      const rarities = proofsData.map(p => p.rarity);
      const proofs = proofsData.map(p => p.proof);

      console.log(`  → 获取了 ${proofsData.length} 个 Proof`);

      // 2. 调用合约
      console.log("  → 提交到链上...");
      await writeClaimRarityBatch({
        functionName: "claimRarityBatch",
        args: [tokenIds.map(BigInt), rarities, proofs],
      });

      notification.success(`成功领取 ${tokenIds.length} 个 NFT 的稀有度！`);

      // 3. 刷新 NFT 列表
      await loadUserNFTs();
    } catch (error: any) {
      console.error("Batch claim error:", error);
      notification.error("批量领取失败：" + error.message);
    } finally {
      setClaiming(false);
    }
  };

  /**
   * 加载用户的所有 NFT
   */
  const loadUserNFTs = useCallback(async () => {
    if (!contract || !tokensOfOwner || tokensOfOwner.length === 0) {
      setUserNFTs([]);
      return;
    }

    setLoading(true);

    try {
      const rarityNames = ["Common", "Rare", "Epic", "Legendary"];

      const nfts: NFTWithRarity[] = await Promise.all(
        tokensOfOwner.map(async tokenId => {
          const id = Number(tokenId);
          const hasClaimed = await checkIfClaimed(id);

          if (!hasClaimed) {
            return {
              tokenId: id,
              rarity: null,
              rarityName: "未领取",
              hasClaimed: false,
            };
          }

          const rarity = await getRarity(id);
          const multiplier = [100, 150, 200, 300][rarity || 0];

          return {
            tokenId: id,
            rarity,
            rarityName: rarityNames[rarity || 0],
            hasClaimed: true,
            multiplier,
          };
        }),
      );

      setUserNFTs(nfts);
    } catch (error) {
      console.error("Error loading NFTs:", error);
      notification.error("加载 NFT 失败");
    } finally {
      setLoading(false);
    }
  }, [contract, tokensOfOwner]);

  // ========== Effects ==========

  // 当用户地址或 tokenIds 变化时，重新加载 NFT
  useEffect(() => {
    if (userAddress && tokensOfOwner) {
      loadUserNFTs();
    }
  }, [userAddress, tokensOfOwner, loadUserNFTs]);

  // ========== 返回 ==========

  return {
    // 数据
    userNFTs,
    loading,
    claiming,

    // 函数
    mint,
    claimRarity,
    claimRarityBatch,
    refetchTokens,
    loadUserNFTs,
  };
}

// ========== 辅助函数 ==========

function parseEther(value: string): bigint {
  return BigInt(Math.floor(parseFloat(value) * 1e18));
}
