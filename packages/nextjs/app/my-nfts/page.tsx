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
import { FadeInUp } from "~~/components/ui/AnimatedCard";
import { usePonderUserAllNFTs } from "~~/hooks/usePonder";
import { useBatchStake } from "~~/hooks/useStaking";

function PageContent() {
  const [isMounted, setIsMounted] = useState(false);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedNFTs, setSelectedNFTs] = useState<number[]>([]);

  const { address, status } = useAccount();
  const { handleBatchStake, isProcessing: isBatchProcessing } = useBatchStake();
  const queryClient = useQueryClient();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data: allNFTs, isLoading, queryKey: userAllNFTs } = usePonderUserAllNFTs(address);

  const availableNFTs = useMemo(() => {
    return (allNFTs || []).filter(nft => !nft.isStaked && nft.isRevealed);
  }, [allNFTs]);

  const handleSelectNFT = (tokenId: number) => {
    setSelectedNFTs(prev => (prev.includes(tokenId) ? prev.filter(id => id !== tokenId) : [...prev, tokenId]));
  };

  const handleBatchStakeClick = async () => {
    if (selectedNFTs.length === 0 || !address) return;

    try {
      await handleBatchStake(selectedNFTs, address as `0x${string}`);

      queryClient.setQueryData(userAllNFTs, (oldData: typeof allNFTs) => {
        if (!oldData) return oldData;
        const now = Math.floor(Date.now() / 1000);
        return oldData.map(nft =>
          selectedNFTs.includes(nft.tokenId) ? { ...nft, isStaked: true, stakedAt: now } : nft,
        );
      });

      setSelectedNFTs([]);
      setIsBatchMode(false);
    } catch (error) {
      console.error("Batch stake failed:", error);
      queryClient.invalidateQueries({ queryKey: userAllNFTs });
    }
  };

  if (!isMounted || status === "connecting" || status === "reconnecting") {
    return <FullPageLoading message="Loading your collection..." />;
  }

  if (!address) {
    return <ConnectWalletPrompt message="Please connect your wallet to view your NFT collection." />;
  }

  if (isLoading) {
    return <FullPageLoading message="Fetching your NFTs..." />;
  }

  if (!allNFTs || allNFTs.length === 0) {
    return (
      <EmptyState
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

      <NFTGrid nfts={allNFTs} isBatchMode={isBatchMode} selectedNFTs={selectedNFTs} onSelectNFT={handleSelectNFT} />
    </>
  );
}

export default function MyNFTsPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-base)" }}>
      <section className="py-12">
        <div className="container-premium">
          <FadeInUp className="text-center mb-12">
            <h1
              className="text-4xl font-bold mb-4"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em", color: "var(--text-primary)" }}
            >
              My NFT Collection
            </h1>
            <p
              className="text-base max-w-xl mx-auto"
              style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)", lineHeight: 1.7 }}
            >
              View and stake your StakableNFT collection. Each NFT earns rewards based on its rarity.
            </p>
          </FadeInUp>

          <PageContent />
        </div>
      </section>
    </div>
  );
}
