/**
 * useRealTimePendingRewards Hook
 *
 * 从 Ponder 获取质押数据，在前端实时计算 pending rewards
 * 每秒自动更新，无需频繁的链上查询
 */
import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { calculatePendingReward, calculateTotalPendingReward } from "~~/utils/rewardCalculator";

export type StakedNFTWithReward = {
  tokenId: number;
  owner: `0x${string}`;
  stakedAt: bigint; // 转换为 bigint 以匹配页面类型
  lastClaimTime: bigint; // 转换为 bigint 以匹配页面类型
  rarity: number | null;
  pendingReward: bigint; // 前端实时计算
  rewardMultiplier: number; // 基于 rarity 计算
};

/**
 * 根据稀有度获取奖励倍率
 */
function getRewardMultiplier(rarity: number | null): number {
  if (rarity === null) return 0;
  const multipliers = [10000, 15000, 20000, 30000]; // Common, Rare, Epic, Legendary
  return multipliers[rarity] ?? 0;
}

/**
 * Hook: 实时计算质押NFT的pending rewards
 *
 * 使用区块链时间而不是系统时间，避免时间不同步导致的计算错误
 *
 * @param stakedNFTs - 从 Ponder 获取的质押 NFT 数据（包含 lastClaimTime 和 rarity）
 * @param enabled - 是否启用实时更新
 * @returns 包含实时计算的 pending reward 的 NFT 数据
 */
export function useRealTimePendingRewards(
  stakedNFTs?: Array<{
    tokenId: number;
    owner: `0x${string}`;
    stakedAt: number;
    lastClaimTime: number;
    rarity: number | null;
  }>,
  enabled = true,
): {
  nftsWithRewards: StakedNFTWithReward[];
  totalPendingReward: bigint;
  isCalculating: boolean;
} {
  const [nftsWithRewards, setNftsWithRewards] = useState<StakedNFTWithReward[]>([]);
  const [totalPendingReward, setTotalPendingReward] = useState<bigint>(0n);
  const [blockchainTime, setBlockchainTime] = useState<number>(0);
  const [baseTime, setBaseTime] = useState<number>(0);

  const publicClient = usePublicClient();

  // 获取区块链当前时间作为基准
  useEffect(() => {
    if (!enabled || !publicClient) return;

    const fetchBlockTime = async () => {
      try {
        const block = await publicClient.getBlock();
        const blockTime = Number(block.timestamp);
        setBlockchainTime(blockTime);
        setBaseTime(Date.now());

        console.log("[useRealTimePendingRewards] 区块链时间:", {
          blockTime,
          blockTimeISO: new Date(blockTime * 1000).toISOString(),
          systemTime: Math.floor(Date.now() / 1000),
          systemTimeISO: new Date().toISOString(),
        });
      } catch (error) {
        console.error("[useRealTimePendingRewards] 获取区块时间失败:", error);
        // 如果获取失败，使用系统时间作为后备
        setBlockchainTime(Math.floor(Date.now() / 1000));
        setBaseTime(Date.now());
      }
    };

    fetchBlockTime();
  }, [enabled, publicClient]);

  useEffect(() => {
    if (!enabled || !stakedNFTs || stakedNFTs.length === 0 || blockchainTime === 0) {
      setNftsWithRewards([]);
      setTotalPendingReward(0n);
      return;
    }

    // 立即计算一次
    const calculate = () => {
      // 使用区块链时间 + 经过的秒数
      const elapsedSeconds = Math.floor((Date.now() - baseTime) / 1000);
      const now = blockchainTime + elapsedSeconds;

      const updated = stakedNFTs.map(nft => ({
        ...nft,
        stakedAt: BigInt(nft.stakedAt), // 转换为 bigint
        lastClaimTime: BigInt(nft.lastClaimTime), // 转换为 bigint
        pendingReward: calculatePendingReward(nft.lastClaimTime, nft.rarity, now),
        rewardMultiplier: getRewardMultiplier(nft.rarity),
      }));

      setNftsWithRewards(updated);
      setTotalPendingReward(calculateTotalPendingReward(stakedNFTs, now));
    };

    calculate();

    // 每秒更新一次
    const interval = setInterval(calculate, 1000);

    return () => clearInterval(interval);
  }, [stakedNFTs, enabled, blockchainTime, baseTime]);

  return {
    nftsWithRewards,
    totalPendingReward,
    isCalculating: blockchainTime === 0,
  };
}
