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

  // === 从 Ponder 获取质押 NFT 数据（包含 lastClaimTime 和 rarity）===
  const { data: stakedNFTsFromPonder, isLoading: isPonderLoading } = usePonderStakedNFTs(address);
  const { data: stakingStats } = usePonderStakingStats(address);
  const refreshPonderData = useRefreshPonderData(address);

  // === 前端实时计算 pending rewards（每秒更新）===
  // Hook 已经返回正确格式的数据，包含 bigint 类型转换
  const { nftsWithRewards: stakedNFTs, totalPendingReward } = useRealTimePendingRewards(
    stakedNFTsFromPonder,
    isConnected,
  );

  // Calculate totals
  const totalStaked = stakedNFTs.length;
  const totalClaimed = stakingStats?.totalClaimed ? BigInt(stakingStats.totalClaimed) : 0n;
  // Total Earned = Total Claimed + Pending Rewards (总收益 = 已领取 + 待领取)
  const totalEarned = totalClaimed + totalPendingReward;

  // Loading states
  const isLoading = isPonderLoading;

  // Selection handlers
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

  // Loading states
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
      {/* Stats Dashboard */}
      <StakingStatsBar
        totalStaked={totalStaked}
        totalPendingReward={totalPendingReward}
        totalClaimed={totalClaimed}
        totalEarned={totalEarned}
      />

      {/* Batch Actions */}
      <BatchClaimControls
        totalStaked={totalStaked}
        selectedCount={selectedNFTs.length}
        isAllSelected={selectedNFTs.length === totalStaked}
        onSelectAll={handleSelectAll}
        onBatchClaim={handleBatchClaimClick}
        isProcessing={isBatchClaimProcessing}
      />

      {/* Staked NFTs Grid */}
      <StakedNFTGrid
        stakedNFTs={stakedNFTs}
        selectedNFTs={selectedNFTs}
        onSelectNFT={handleSelectNFT}
        onClaim={handleClaimSuccess}
        onUnstake={handleUnstakeSuccess}
        isProcessing={isClaimProcessing || isUnstakeProcessing}
      />

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

export default function StakePage() {
  return (
    <div className="min-h-screen bg-black">
      <section className="relative py-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-transparent" />
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl -mt-5 font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-4">
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
