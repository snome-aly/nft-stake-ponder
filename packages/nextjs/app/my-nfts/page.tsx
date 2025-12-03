"use client";

import { useEffect, useMemo, useState } from "react";
import { BatchModeControls } from "./_components/BatchModeControls";
import { EnhancedStatsBar } from "./_components/EnhancedStatsBar";
import { NFTGrid } from "./_components/NFTGrid";
import { useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { ConnectWalletPrompt } from "~~/components/ConnectWalletPrompt";
import { EmptyState } from "~~/components/EmptyState";
import { FullPageLoading } from "~~/components/LoadingComponents";
import { usePonderUserAllNFTs } from "~~/hooks/usePonder";
import { useBatchStake } from "~~/hooks/useStaking";

function PageContent() {
  const [isMounted, setIsMounted] = useState(false);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedNFTs, setSelectedNFTs] = useState<number[]>([]);

  const { address, isConnected, status } = useAccount();
  const { handleBatchStake, isProcessing: isBatchProcessing } = useBatchStake();
  const queryClient = useQueryClient();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data: allNFTs, isLoading, queryKey: userAllNFTs } = usePonderUserAllNFTs(address);

  const availableNFTs = useMemo(() => {
    return (allNFTs || []).filter(nft => !nft.isStaked && nft.isRevealed);
  }, [allNFTs]);

  const handleStakeSuccess = (tokenId: number) => {
    // 乐观更新：交易已确认，立即更新本地缓存
    // 不需要 invalidateQueries，因为数据已经是正确的
    // 依赖 refetchInterval 自动更新（15秒后）
    queryClient.setQueryData(userAllNFTs, (oldData: typeof allNFTs) => {
      if (!oldData) return oldData;

      return oldData.map(nft =>
        nft.tokenId === tokenId ? { ...nft, isStaked: true, stakedAt: Math.floor(Date.now() / 1000) } : nft,
      );
    });
  };

  const handleSelectNFT = (tokenId: number) => {
    setSelectedNFTs(prev => (prev.includes(tokenId) ? prev.filter(id => id !== tokenId) : [...prev, tokenId]));
  };

  const handleBatchStakeClick = async () => {
    if (selectedNFTs.length === 0 || !address) return;

    try {
      await handleBatchStake(selectedNFTs, address as `0x${string}`);

      // 乐观更新：立即更新所有选中的 NFT
      queryClient.setQueryData(userAllNFTs, (oldData: typeof allNFTs) => {
        if (!oldData) return oldData;

        const now = Math.floor(Date.now() / 1000);
        return oldData.map(nft =>
          selectedNFTs.includes(nft.tokenId) ? { ...nft, isStaked: true, stakedAt: now } : nft,
        );
      });

      setSelectedNFTs([]);
      setIsBatchMode(false);

      // 不需要手动刷新，依赖 refetchInterval 自动更新
    } catch (error) {
      console.error("Batch stake failed:", error);
      // 如果失败，立即刷新数据以恢复正确状态
      queryClient.invalidateQueries({ queryKey: userAllNFTs });
    }
  };

  // Loading states
  if (!isMounted || status === "connecting" || status === "reconnecting") {
    return <FullPageLoading message="Loading your collection..." />;
  }

  if (!isConnected) {
    return <ConnectWalletPrompt message="Please connect your wallet to view your NFT collection." />;
  }

  if (isLoading) {
    return <FullPageLoading message="Fetching your NFTs..." />;
  }

  if (!allNFTs || allNFTs.length === 0) {
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
      <EnhancedStatsBar nfts={allNFTs} />

      <BatchModeControls
        isBatchMode={isBatchMode}
        setIsBatchMode={setIsBatchMode}
        selectedCount={selectedNFTs.length}
        availableCount={availableNFTs.length}
        onBatchStake={handleBatchStakeClick}
        isProcessing={isBatchProcessing}
      />

      <NFTGrid
        nfts={allNFTs}
        isBatchMode={isBatchMode}
        selectedNFTs={selectedNFTs}
        onSelectNFT={handleSelectNFT}
        onStakeSuccess={handleStakeSuccess}
      />
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
