"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useAccount } from "wagmi";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { gql, request } from "graphql-request";
import { useScaffoldReadContract, useScaffoldEventHistory } from "~~/hooks/scaffold-eth";
import { useClaimReward, useBatchClaimReward, useUnstake } from "~~/hooks/useStaking";
import { FullPageLoading } from "~~/components/LoadingComponents";
import { EmptyState } from "~~/components/EmptyState";
import deployedContracts from "~~/contracts/deployedContracts";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { getContract } from "viem";
import { usePublicClient } from "wagmi";
import Link from "next/link";
import { useNFTMetadata } from "~~/hooks/useNFTMetadata";
import { convertIpfsToHttp } from "~~/utils/staking";

const PONDER_URL = process.env.NEXT_PUBLIC_PONDER_URL || "http://localhost:42069";

type StakedNFT = {
  tokenId: number;
  owner: `0x${string}`;
  stakedAt: bigint;
  lastClaimTime: bigint;
  pendingReward: bigint;
  rarity: number | null;
  rewardMultiplier: number;
};

function ConnectWalletPrompt() {
  return (
    <EmptyState
      icon="🔐"
      title="Connect Your Wallet"
      message="Please connect your wallet to view your staked NFTs and manage rewards."
    />
  );
}

function NoStakedNFTs() {
  return (
    <EmptyState
      icon="🎴"
      title="No Staked NFTs"
      message="You don't have any staked NFTs yet. Stake your NFTs to start earning rewards!"
      actionLabel="Go to My NFTs"
      actionHref="/my-nfts"
    />
  );
}

function PageContent() {
  const [isMounted, setIsMounted] = useState(false);
  const [selectedNFTs, setSelectedNFTs] = useState<number[]>([]);

  const { address, isConnected, status } = useAccount();
  const queryClient = useQueryClient();
  const { targetNetwork } = useTargetNetwork();
  const publicClient = usePublicClient({ chainId: targetNetwork.id });

  const { handleClaim, isProcessing: isClaimProcessing } = useClaimReward();
  const { handleBatchClaim, isProcessing: isBatchClaimProcessing } = useBatchClaimReward();
  const { handleUnstake, isProcessing: isUnstakeProcessing } = useUnstake();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Get contract addresses
  const chainId = targetNetwork.id;
  const contracts = deployedContracts[chainId as keyof typeof deployedContracts];
  const stakingPoolAddress = contracts?.NFTStakingPool?.address;
  const nftAddress = contracts?.StakableNFT?.address;

  // Step 1: Get user's staked NFTs with stakedAt from Ponder activeStake table
  const { data: activeStakesData, isLoading: isLoadingActiveStakes } = useQuery({
    queryKey: ["userActiveStakes", address],
    queryFn: async () => {
      if (!address) return [];

      const query = gql`
        query UserActiveStakes($user: String!) {
          activeStakes(where: { user: $user }, orderBy: "stakedAt", orderDirection: "desc") {
            items {
              tokenId
              stakedAt
            }
          }
        }
      `;

      const data = await request<any>(PONDER_URL, query, {
        user: address.toLowerCase(),
      });

      return data.activeStakes.items;
    },
    enabled: !!address && isConnected,
    refetchInterval: 10000,
  });

  const tokenIds = (activeStakesData || []).map((stake: any) => stake.tokenId);

  // Step 2: Get NFT metadata (rarity) from Ponder nfts table
  const { data: nftsMetadata, isLoading: isLoadingMetadata } = useQuery({
    queryKey: ["stakedNFTsMetadata", tokenIds],
    queryFn: async () => {
      if (!tokenIds || tokenIds.length === 0) return [];

      const query = gql`
        query NFTsByTokenIds($tokenIds: [Int!]!) {
          nfts(where: { tokenId_in: $tokenIds }) {
            items {
              tokenId
              rarity
            }
          }
        }
      `;

      const data = await request<any>(PONDER_URL, query, { tokenIds });
      return data.nfts.items;
    },
    enabled: tokenIds.length > 0,
    refetchInterval: 10000,
  });

  // Step 3: Get real-time data from contract (pendingReward, rewardMultiplier)
  const { data: stakedNFTs, isLoading: isLoadingContractData } = useQuery({
    queryKey: ["stakedNFTsContract", tokenIds],
    queryFn: async () => {
      if (!publicClient || !stakingPoolAddress || !nftAddress || !tokenIds || tokenIds.length === 0) {
        return [];
      }

      const stakingPool = getContract({
        address: stakingPoolAddress as `0x${string}`,
        abi: contracts.NFTStakingPool.abi,
        client: publicClient,
      });

      const nftContract = getContract({
        address: nftAddress as `0x${string}`,
        abi: contracts.StakableNFT.abi,
        client: publicClient,
      });

      // Create lookup maps for efficient access
      const stakeTimeMap = new Map(
        (activeStakesData || []).map((stake: any) => [stake.tokenId, stake.stakedAt])
      );
      const rarityMap = new Map(
        (nftsMetadata || []).map((nft: any) => [nft.tokenId, nft.rarity])
      );

      const results = await Promise.all(
        tokenIds.map(async (tokenId: number) => {
          const [stakeInfo, pendingReward, multiplier] = await Promise.all([
            stakingPool.read.getStakeInfo([BigInt(tokenId)]),
            stakingPool.read.calculatePendingReward([BigInt(tokenId)]),
            nftContract.read.getTokenRewardMultiplier([BigInt(tokenId)]),
          ]);

          // Type assertion for stakeInfo tuple
          const [owner, _stakedAt, lastClaimTime] = stakeInfo as readonly [string, bigint, bigint];

          return {
            tokenId,
            owner: owner as `0x${string}`,
            stakedAt: BigInt(stakeTimeMap.get(tokenId) || Number(_stakedAt)),
            lastClaimTime,
            pendingReward,
            rarity: rarityMap.get(tokenId) ?? null,
            rewardMultiplier: Number(multiplier),
          } as StakedNFT;
        }),
      );

      return results;
    },
    enabled:
      !!publicClient &&
      !!stakingPoolAddress &&
      !!nftAddress &&
      tokenIds.length > 0 &&
      !!activeStakesData &&
      !!nftsMetadata,
    refetchInterval: 2000, // Update pending rewards every 2 seconds
  });

  // Listen for events
  const { data: claimEvents } = useScaffoldEventHistory({
    contractName: "NFTStakingPool",
    eventName: "RewardClaimed",
    watch: true,
    filters: { user: address },
  });

  const { data: unstakeEvents } = useScaffoldEventHistory({
    contractName: "NFTStakingPool",
    eventName: "Unstaked",
    watch: true,
    filters: { user: address },
  });

  // Auto-refresh on events
  useEffect(() => {
    if (claimEvents && claimEvents.length > 0) {
      queryClient.invalidateQueries({ queryKey: ["stakedNFTsContract"] });
    }
  }, [claimEvents, queryClient]);

  useEffect(() => {
    if (unstakeEvents && unstakeEvents.length > 0) {
      queryClient.invalidateQueries({ queryKey: ["userActiveStakes"] });
      queryClient.invalidateQueries({ queryKey: ["stakedNFTsMetadata"] });
      queryClient.invalidateQueries({ queryKey: ["stakedNFTsContract"] });
    }
  }, [unstakeEvents, queryClient]);

  // Calculate totals
  const totalPendingReward = stakedNFTs?.reduce((sum, nft) => sum + nft.pendingReward, 0n) || 0n;
  const totalStaked = stakedNFTs?.length || 0;

  // Combine loading states
  const isLoading = isLoadingActiveStakes || isLoadingMetadata || isLoadingContractData;

  // Selection handlers
  const handleSelectNFT = (tokenId: number) => {
    setSelectedNFTs(prev => (prev.includes(tokenId) ? prev.filter(id => id !== tokenId) : [...prev, tokenId]));
  };

  const handleSelectAll = () => {
    if (selectedNFTs.length === totalStaked) {
      setSelectedNFTs([]);
    } else {
      setSelectedNFTs(stakedNFTs?.map(nft => nft.tokenId) || []);
    }
  };

  const handleBatchClaimClick = async () => {
    if (selectedNFTs.length === 0) return;
    try {
      await handleBatchClaim(selectedNFTs);
      setSelectedNFTs([]);
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ["stakedNFTsContract"] }), 2000);
    } catch (error) {
      console.error("Batch claim failed:", error);
    }
  };

  // Loading states
  if (!isMounted || status === "connecting" || status === "reconnecting") {
    return <FullPageLoading message="Loading staking dashboard..." />;
  }

  if (!isConnected) {
    return <ConnectWalletPrompt />;
  }

  if (isLoading) {
    return <FullPageLoading message="Loading staked NFTs..." />;
  }

  if (totalStaked === 0) {
    return <NoStakedNFTs />;
  }

  return (
    <>
      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Total Staked */}
        <div className="glass-card rounded-2xl p-6 border border-cyan-500/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-sm font-medium">Total Staked NFTs</h3>
            <span className="text-3xl">🔒</span>
          </div>
          <div className="text-4xl font-bold text-white">{totalStaked}</div>
          <p className="text-gray-500 text-sm mt-2">Currently earning rewards</p>
        </div>

        {/* Pending Rewards */}
        <div className="glass-card rounded-2xl p-6 border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-purple-500/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-sm font-medium">Total Pending Rewards</h3>
            <span className="text-3xl">💰</span>
          </div>
          <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
            {(Number(totalPendingReward) / 1e18).toFixed(4)} RWRD
          </div>
          <p className="text-gray-500 text-sm mt-2">Updating in real-time</p>
        </div>
      </div>

      {/* Batch Actions */}
      {totalStaked > 1 && (
        <div className="glass-card rounded-xl p-4 mb-6 border border-cyan-500/30">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedNFTs.length === totalStaked}
                onChange={handleSelectAll}
                className="w-5 h-5 cursor-pointer accent-cyan-500"
              />
              <span className="text-white font-medium">
                {selectedNFTs.length > 0 ? `${selectedNFTs.length} NFTs selected` : "Select all"}
              </span>
            </div>

            {selectedNFTs.length > 0 && (
              <button
                onClick={handleBatchClaimClick}
                disabled={isBatchClaimProcessing}
                className="btn-primary flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
              >
                <span>💰</span>
                <span>{isBatchClaimProcessing ? "Claiming..." : `Claim Selected (${selectedNFTs.length})`}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Staked NFTs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {stakedNFTs?.map(nft => (
          <StakedNFTCard
            key={nft.tokenId}
            nft={nft}
            isSelected={selectedNFTs.includes(nft.tokenId)}
            onSelect={() => handleSelectNFT(nft.tokenId)}
            onClaim={async () => {
              await handleClaim(nft.tokenId);
              setTimeout(() => queryClient.invalidateQueries({ queryKey: ["stakedNFTsContract"] }), 2000);
            }}
            onUnstake={async () => {
              await handleUnstake(nft.tokenId);
              setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ["userActiveStakes"] });
                queryClient.invalidateQueries({ queryKey: ["stakedNFTsMetadata"] });
                queryClient.invalidateQueries({ queryKey: ["stakedNFTsContract"] });
              }, 2000);
            }}
            isProcessing={isClaimProcessing || isUnstakeProcessing}
          />
        ))}
      </div>

      {/* Back to My NFTs */}
      <div className="text-center mt-12">
        <Link href="/my-nfts" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition">
          <span>←</span>
          <span>Back to My NFT Collection</span>
        </Link>
      </div>
    </>
  );
}

// Staked NFT Card Component
function StakedNFTCard({
  nft,
  isSelected,
  onSelect,
  onClaim,
  onUnstake,
  isProcessing,
}: {
  nft: StakedNFT;
  isSelected: boolean;
  onSelect: () => void;
  onClaim: () => Promise<void>;
  onUnstake: () => Promise<void>;
  isProcessing: boolean;
}) {
  const RARITY_NAMES = ["Common", "Rare", "Epic", "Legendary"];
  const RARITY_COLORS = ["text-gray-400", "text-blue-400", "text-purple-400", "text-yellow-400"];
  const RARITY_GRADIENTS = [
    "from-gray-400 to-gray-600",
    "from-blue-400 to-blue-600",
    "from-purple-400 to-purple-600",
    "from-yellow-400 to-orange-500",
  ];

  // Get tokenURI from contract
  const { data: tokenURI } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "tokenURI",
    args: [BigInt(nft.tokenId)],
  });

  // Get image URL from metadata
  const { imageUrl } = useNFTMetadata(tokenURI);

  const rarityIndex = nft.rarity ?? 0;

  return (
    <div
      className={`glass-card rounded-2xl overflow-hidden border transition-all group ${
        isSelected ? "ring-2 ring-cyan-500 border-cyan-500" : "border-cyan-500/30"
      }`}
    >
      <div
        className={`aspect-square bg-gradient-to-br ${RARITY_GRADIENTS[rarityIndex]} relative overflow-hidden`}
      >
        {imageUrl ? (
          <>
            <Image
              src={convertIpfsToHttp(imageUrl)}
              alt={`StakableNFT #${nft.tokenId}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <span className="text-6xl block mb-2">
                {nft.rarity === 3 ? "👑" : nft.rarity === 2 ? "💎" : nft.rarity === 1 ? "⭐" : "🎴"}
              </span>
              <span className={`text-sm font-bold ${RARITY_COLORS[rarityIndex]}`}>{RARITY_NAMES[rarityIndex]}</span>
            </div>
          </div>
        )}

        <div className="absolute top-3 left-3 px-2 py-1 glass-dark rounded-lg backdrop-blur-md z-10">
          <span className="text-white text-sm font-bold">#{nft.tokenId}</span>
        </div>

        <div className="absolute top-3 right-3 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="w-5 h-5 cursor-pointer accent-cyan-500"
          />
        </div>
      </div>

      <div className="p-4">
        <div className="glass-dark rounded-lg p-3 mb-3 border border-cyan-500/20">
          <p className="text-xs text-gray-400 mb-1">Pending Reward</p>
          <p className="text-cyan-400 font-bold text-xl">{(Number(nft.pendingReward) / 1e18).toFixed(4)} RWRD</p>
          <p className="text-xs text-gray-500 mt-1">~{(nft.rewardMultiplier / 10000).toFixed(1)} RWRD/day</p>
        </div>

        <div className="flex gap-2">
          <button onClick={onClaim} disabled={isProcessing} className="btn-primary flex-1 py-2 text-sm rounded-lg">
            Claim
          </button>
          <button onClick={onUnstake} disabled={isProcessing} className="btn-secondary flex-1 py-2 text-sm rounded-lg">
            Unstake
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StakePage() {
  return (
    <div className="min-h-screen bg-black">
      <section className="relative py-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-transparent" />
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-4">
              Staking Dashboard
            </h1>
            <p className="text-gray-400">Manage your staked NFTs and claim rewards</p>
          </div>

          <PageContent />
        </div>
      </section>
    </div>
  );
}
