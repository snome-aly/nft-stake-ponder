"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BatchClaimControls } from "./_components/BatchClaimControls";
import { NoStakedNFTs } from "./_components/NoStakedNFTs";
import { StakedNFTGrid } from "./_components/StakedNFTGrid";
import { StakingStatsBar } from "./_components/StakingStatsBar";
import { useAccount } from "wagmi";
import { ConnectWalletPrompt } from "~~/components/ConnectWalletPrompt";
import { FullPageLoading } from "~~/components/LoadingComponents";
import { FadeInUp } from "~~/components/ui/AnimatedCard";
import { usePonderStakedNFTs, usePonderStakingStats, useRefreshPonderData } from "~~/hooks/usePonder";
import { useRealTimePendingRewards } from "~~/hooks/useRealTimePendingRewards";
import { useBatchClaimReward, useClaimReward, useUnstake } from "~~/hooks/useStaking";

function PageContent() {
  const [isMounted, setIsMounted] = useState(false);
  const [selectedNFTs, setSelectedNFTs] = useState<number[]>([]);

  const { address, isConnected, status } = useAccount();

  const { handleClaim, isProcessing: isClaimProcessing } = useClaimReward();
  const { handleBatchClaim, isProcessing: isBatchClaimProcessing } = useBatchClaimReward();
  const { handleUnstake, isProcessing: isUnstakeProcessing } = useUnstake();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data: stakedNFTsFromPonder, isLoading: isPonderLoading } = usePonderStakedNFTs(address);
  const { data: stakingStats } = usePonderStakingStats(address);
  const refreshPonderData = useRefreshPonderData(address);

  const { nftsWithRewards: stakedNFTs, totalPendingReward } = useRealTimePendingRewards(
    stakedNFTsFromPonder,
    isConnected,
  );

  const totalStaked = stakedNFTs.length;
  const totalClaimed = stakingStats?.totalClaimed ? BigInt(stakingStats.totalClaimed) : 0n;
  const totalEarned = totalClaimed + totalPendingReward;

  const isLoading = isPonderLoading;

  const handleSelectNFT = (tokenId: number) => {
    setSelectedNFTs(prev => (prev.includes(tokenId) ? prev.filter(id => id !== tokenId) : [...prev, tokenId]));
  };

  const handleSelectAll = () => {
    if (selectedNFTs.length === totalStaked) {
      setSelectedNFTs([]);
    } else {
      setSelectedNFTs(stakedNFTs.map(nft => nft.tokenId));
    }
  };

  const handleBatchClaimClick = async () => {
    if (selectedNFTs.length === 0) return;
    try {
      await handleBatchClaim(selectedNFTs);
      setSelectedNFTs([]);
      setTimeout(() => {
        refreshPonderData();
      }, 2000);
    } catch (error) {
      console.error("Batch claim failed:", error);
    }
  };

  const handleClaimSuccess = async (tokenId: number) => {
    await handleClaim(tokenId);
    setTimeout(() => {
      refreshPonderData();
    }, 2000);
  };

  const handleUnstakeSuccess = async (tokenId: number) => {
    await handleUnstake(tokenId);
    setTimeout(() => {
      refreshPonderData();
    }, 2000);
  };

  if (!isMounted || status === "connecting" || status === "reconnecting") {
    return <FullPageLoading message="Loading staking dashboard..." />;
  }

  if (!isConnected) {
    return <ConnectWalletPrompt message="Please connect your wallet to view your staked NFTs and manage rewards." />;
  }

  if (isLoading) {
    return <FullPageLoading message="Loading staked NFTs..." />;
  }

  if (totalStaked === 0) {
    return <NoStakedNFTs />;
  }

  return (
    <>
      <StakingStatsBar
        totalStaked={totalStaked}
        totalPendingReward={totalPendingReward}
        totalClaimed={totalClaimed}
        totalEarned={totalEarned}
      />

      <BatchClaimControls
        totalStaked={totalStaked}
        selectedCount={selectedNFTs.length}
        isAllSelected={selectedNFTs.length === totalStaked}
        onSelectAll={handleSelectAll}
        onBatchClaim={handleBatchClaimClick}
        isProcessing={isBatchClaimProcessing}
      />

      <StakedNFTGrid
        stakedNFTs={stakedNFTs}
        selectedNFTs={selectedNFTs}
        onSelectNFT={handleSelectNFT}
        onClaim={handleClaimSuccess}
        onUnstake={handleUnstakeSuccess}
        isProcessing={isClaimProcessing || isUnstakeProcessing}
      />

      <div className="text-center mt-12">
        <Link href="/my-nfts" className="btn btn-ghost">
          ← Back to My NFT Collection
        </Link>
      </div>
    </>
  );
}

export default function StakePage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-base)" }}>
      <section className="py-12">
        <div className="container-premium">
          <FadeInUp className="text-center mb-12">
            <h1
              className="text-4xl font-bold mb-4"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em", color: "var(--text-primary)" }}
            >
              Staking Dashboard
            </h1>
            <p
              className="text-base max-w-xl mx-auto"
              style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)", lineHeight: 1.7 }}
            >
              Manage your staked NFTs and claim rewards
            </p>
          </FadeInUp>

          <PageContent />
        </div>
      </section>
    </div>
  );
}
