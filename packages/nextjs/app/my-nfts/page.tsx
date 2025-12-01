"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { gql, request } from "graphql-request";
import { useAccount } from "wagmi";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth";
import { useBatchStake } from "~~/hooks/useStaking";
import { EnhancedNFTCard } from "./_components/EnhancedNFTCard";
import { BatchModeControls } from "./_components/BatchModeControls";
import { EnhancedStatsBar } from "./_components/EnhancedStatsBar";
import { FullPageLoading } from "~~/components/LoadingComponents";
import { EmptyState } from "~~/components/EmptyState";
import deployedContracts from "~~/contracts/deployedContracts";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { getContract } from "viem";
import { usePublicClient } from "wagmi";

type NFT = {
  id: string;
  tokenId: number;
  owner: `0x${string}`;
  rarity: number | null;
  isRevealed: boolean;
  mintedAt: number;
  mintedBy: `0x${string}`;
};

type EnhancedNFT = NFT & {
  isStaked: boolean;
  pendingReward?: bigint;
  stakedAt?: bigint;
};

type NFTsData = { nfts: { items: NFT[]; totalCount: number } };

const PONDER_URL = process.env.NEXT_PUBLIC_PONDER_URL || "http://localhost:42069";

// Query user's owned NFTs (in wallet) from Ponder
const fetchOwnedNFTs = async (address: string) => {
  const query = gql`
    query UserOwnedNFTs($owner: String!) {
      nfts(where: { owner: $owner }, orderBy: "tokenId", orderDirection: "asc") {
        items {
          id
          tokenId
          owner
          rarity
          isRevealed
          mintedAt
          mintedBy
        }
      }
    }
  `;
  const data = await request<NFTsData>(PONDER_URL, query, {
    owner: address.toLowerCase(),
  });
  return data.nfts.items;
};

// Query user's staked NFTs from activeStake table
const fetchStakedNFTsWithDetails = async (address: string) => {
  const query = gql`
    query UserStakedNFTs($user: String!) {
      activeStakes(where: { user: $user }, orderBy: "stakedAt", orderDirection: "desc") {
        items {
          tokenId
          stakedAt
          transactionHash
        }
      }
    }
  `;
  const data = await request<any>(PONDER_URL, query, {
    user: address.toLowerCase(),
  });

  if (!data.activeStakes?.items?.length) return [];

  // Get NFT details for staked tokens
  const tokenIds = data.activeStakes.items.map((stake: any) => stake.tokenId);
  const nftsQuery = gql`
    query NFTsByTokenIds($tokenIds: [Int!]!) {
      nfts(where: { tokenId_in: $tokenIds }, orderBy: "tokenId", orderDirection: "asc") {
        items {
          id
          tokenId
          owner
          rarity
          isRevealed
          mintedAt
          mintedBy
        }
      }
    }
  `;
  const nftsData = await request<NFTsData>(PONDER_URL, nftsQuery, { tokenIds });

  // Merge NFT details with stake info
  return nftsData.nfts.items.map(nft => ({
    ...nft,
    stakedAt: data.activeStakes.items.find((s: any) => s.tokenId === nft.tokenId)?.stakedAt,
  }));
};

function ConnectWalletPrompt() {
  return (
    <div className="text-center py-16">
      <div className="text-8xl mb-6">🔐</div>
      <h3 className="text-2xl font-bold text-white mb-3">Connect Your Wallet</h3>
      <p className="text-gray-400 mb-6 max-w-md mx-auto">Please connect your wallet to view your NFT collection.</p>
    </div>
  );
}

function PageContent() {
  const [isMounted, setIsMounted] = useState(false);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedNFTs, setSelectedNFTs] = useState<number[]>([]);

  const { address, isConnected, status } = useAccount();
  const queryClient = useQueryClient();
  const { targetNetwork } = useTargetNetwork();
  const publicClient = usePublicClient({ chainId: targetNetwork.id });
  const { handleBatchStake, isProcessing: isBatchProcessing } = useBatchStake();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Get contract addresses
  const chainId = targetNetwork.id;
  const contracts = deployedContracts[chainId as keyof typeof deployedContracts];
  const stakingPoolAddress = contracts?.NFTStakingPool?.address;

  // Query 1: Get owned NFTs from Ponder (in wallet)
  const { data: ownedNFTs, isLoading: isOwnedLoading } = useQuery({
    queryKey: ["ownedNFTs", address],
    queryFn: () => fetchOwnedNFTs(address!),
    enabled: !!address && isConnected,
    refetchInterval: 10000,
  });

  // Query 2: Get staked NFTs from Ponder (with stakedAt)
  const { data: stakedNFTsWithStakeTime, isLoading: isStakedLoading } = useQuery({
    queryKey: ["stakedNFTs", address],
    queryFn: () => fetchStakedNFTsWithDetails(address!),
    enabled: !!address && isConnected,
    refetchInterval: 10000,
  });

  // Merge owned and staked NFTs (avoid duplicates)
  const allNFTsMap = new Map<number, NFT>();
  (ownedNFTs || []).forEach(nft => allNFTsMap.set(nft.tokenId, nft));
  (stakedNFTsWithStakeTime || []).forEach(nft => allNFTsMap.set(nft.tokenId, nft));
  const allNFTs = Array.from(allNFTsMap.values()).sort((a, b) => a.tokenId - b.tokenId);

  // Create a map of staked token IDs for quick lookup
  const stakedTokenIdsSet = new Set((stakedNFTsWithStakeTime || []).map(nft => nft.tokenId));
  const stakedTokenIdsArray = Array.from(stakedTokenIdsSet);
  const stakedTokenIdsBigInt = stakedTokenIdsArray.map(id => BigInt(id));

  // Query: Get pending rewards for staked NFTs
  const { data: pendingRewards } = useQuery({
    queryKey: ["pendingRewards", Array.from(stakedTokenIdsSet)],
    queryFn: async () => {
      if (!publicClient || !stakingPoolAddress) return [];

      const stakingPool = getContract({
        address: stakingPoolAddress as `0x${string}`,
        abi: contracts.NFTStakingPool.abi,
        client: publicClient,
      });

      return Promise.all(stakedTokenIdsBigInt.map(id => stakingPool.read.calculatePendingReward([id])));
    },
    enabled: stakedTokenIdsBigInt.length > 0 && !!publicClient && !!stakingPoolAddress,
    refetchInterval: 2000, // Update every 2 seconds
  });

  // Listen for staking events
  const { data: stakeEvents } = useScaffoldEventHistory({
    contractName: "NFTStakingPool",
    eventName: "Staked",
    watch: true,
    filters: {
      user: address,
    },
  });

  const { data: unstakeEvents } = useScaffoldEventHistory({
    contractName: "NFTStakingPool",
    eventName: "Unstaked",
    watch: true,
    filters: {
      user: address,
    },
  });

  // Auto-refresh on events
  useEffect(() => {
    if (stakeEvents && stakeEvents.length > 0) {
      queryClient.invalidateQueries({ queryKey: ["ownedNFTs"] });
      queryClient.invalidateQueries({ queryKey: ["stakedNFTs"] });
      queryClient.invalidateQueries({ queryKey: ["stakeInfos"] });
      queryClient.invalidateQueries({ queryKey: ["pendingRewards"] });
    }
  }, [stakeEvents, queryClient]);

  useEffect(() => {
    if (unstakeEvents && unstakeEvents.length > 0) {
      queryClient.invalidateQueries({ queryKey: ["ownedNFTs"] });
      queryClient.invalidateQueries({ queryKey: ["stakedNFTs"] });
      queryClient.invalidateQueries({ queryKey: ["stakeInfos"] });
      queryClient.invalidateQueries({ queryKey: ["pendingRewards"] });
    }
  }, [unstakeEvents, queryClient]);

  // Merge NFT data with staking status and rewards
  const enhancedNFTs: EnhancedNFT[] = allNFTs.map(nft => {
    const isStaked = stakedTokenIdsSet.has(nft.tokenId);
    const stakedNFT = (stakedNFTsWithStakeTime || []).find(s => s.tokenId === nft.tokenId);
    const stakedIndex = stakedTokenIdsArray.indexOf(nft.tokenId);

    return {
      ...nft,
      isStaked,
      pendingReward: stakedIndex >= 0 ? pendingRewards?.[stakedIndex] : undefined,
      stakedAt: stakedNFT?.stakedAt ? BigInt(stakedNFT.stakedAt) : undefined,
    };
  });

  // Batch selection handlers
  const handleSelectNFT = (tokenId: number) => {
    setSelectedNFTs(prev =>
      prev.includes(tokenId) ? prev.filter(id => id !== tokenId) : [...prev, tokenId],
    );
  };

  const handleBatchStakeClick = async () => {
    if (selectedNFTs.length === 0 || !address) return;

    try {
      await handleBatchStake(selectedNFTs, address as `0x${string}`);
      setSelectedNFTs([]);
      setIsBatchMode(false);

      // Refresh data
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["ownedNFTs"] });
        queryClient.invalidateQueries({ queryKey: ["stakedNFTs"] });
        queryClient.invalidateQueries({ queryKey: ["stakeInfos"] });
      }, 2000);
    } catch (error) {
      console.error("Batch stake failed:", error);
    }
  };

  const handleStakeSuccess = () => {
    // Refresh data after single stake
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ["ownedNFTs"] });
      queryClient.invalidateQueries({ queryKey: ["stakedNFTs"] });
      queryClient.invalidateQueries({ queryKey: ["stakeInfos"] });
    }, 2000);
  };

  const availableNFTs = enhancedNFTs.filter(nft => !nft.isStaked && nft.isRevealed);
  const isLoading = isOwnedLoading || isStakedLoading;

  // Loading states
  if (!isMounted || status === "connecting" || status === "reconnecting") {
    return <FullPageLoading message="Loading your collection..." />;
  }

  if (!isConnected) {
    return <ConnectWalletPrompt />;
  }

  if (isLoading) {
    return <FullPageLoading message="Fetching your NFTs..." />;
  }

  if (allNFTs.length === 0) {
    return (
      <EmptyState
        icon="🎴"
        title="No NFTs Found"
        message="You don't own any StakableNFTs yet. Mint your first NFT to start your collection!"
        actionLabel="Mint NFT"
        actionHref="/mint"
      />
    );
  }

  return (
    <>
      <EnhancedStatsBar nfts={enhancedNFTs} />

      <BatchModeControls
        isBatchMode={isBatchMode}
        setIsBatchMode={setIsBatchMode}
        selectedCount={selectedNFTs.length}
        availableCount={availableNFTs.length}
        onBatchStake={handleBatchStakeClick}
        isProcessing={isBatchProcessing}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {enhancedNFTs.map((nft, index) => (
          <EnhancedNFTCard
            key={nft.id}
            nft={nft}
            priority={index < 4}
            isSelectable={isBatchMode && !nft.isStaked && nft.isRevealed}
            isSelected={selectedNFTs.includes(nft.tokenId)}
            onSelect={() => handleSelectNFT(nft.tokenId)}
            onStakeSuccess={handleStakeSuccess}
          />
        ))}
      </div>
    </>
  );
}

export default function MyNFTsPage() {
  return (
    <div className="min-h-screen bg-black">
      <section className="relative py-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-transparent" />
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-4">
              My NFT Collection
            </h1>
            <p className="text-gray-400">
              View and stake your StakableNFT collection. Each NFT earns rewards based on its rarity.
            </p>
          </div>

          <PageContent />
        </div>
      </section>
    </div>
  );
}
