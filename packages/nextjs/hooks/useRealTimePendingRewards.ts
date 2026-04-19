/**
 * useRealTimePendingRewards Hook
 *
 * 从 Ponder 获取质押数据，在前端实时计算 pending rewards
 * 每秒自动更新，无需频繁的链上查询
 */
import { useEffect, useMemo, useState } from "react";
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

const getCurrentUnixTime = () => Math.floor(Date.now() / 1000);

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
  const [rewardTime, setRewardTime] = useState<number>(() => getCurrentUnixTime());
  const [isClockSynced, setIsClockSynced] = useState(false);

  const publicClient = usePublicClient();

  // 用最新区块时间校准一次，再用本机时钟持续推进展示时间。
  // 本地开发链在没有新交易时 block.timestamp 不会自动前进，纯用最新区块时间会导致页面重进后奖励显示从 0 重新开始。
  useEffect(() => {
    if (!enabled) {
      setIsClockSynced(false);
      return;
    }

    let cancelled = false;

    const syncRewardClock = async () => {
      const systemTime = getCurrentUnixTime();
      try {
        if (!publicClient) {
          setRewardTime(systemTime);
          setIsClockSynced(true);
          return;
        }

        const block = await publicClient.getBlock();
        const blockTime = Number(block.timestamp);
        if (cancelled) return;

        setRewardTime(Math.max(blockTime, systemTime));
        setIsClockSynced(true);
      } catch (error) {
        console.error("[useRealTimePendingRewards] 获取区块时间失败:", error);
        if (cancelled) return;

        setRewardTime(systemTime);
        setIsClockSynced(true);
      }
    };

    syncRewardClock();

    const interval = setInterval(() => {
      setRewardTime(previous => Math.max(previous + 1, getCurrentUnixTime()));
    }, 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [enabled, publicClient]);

  const nftsWithRewards = useMemo(() => {
    if (!enabled || !stakedNFTs || stakedNFTs.length === 0) {
      return [];
    }

    return stakedNFTs.map(nft => ({
      ...nft,
      stakedAt: BigInt(nft.stakedAt), // 转换为 bigint
      lastClaimTime: BigInt(nft.lastClaimTime), // 转换为 bigint
      pendingReward: calculatePendingReward(nft.lastClaimTime, nft.rarity, rewardTime),
      rewardMultiplier: getRewardMultiplier(nft.rarity),
    }));
  }, [stakedNFTs, enabled, rewardTime]);

  const totalPendingReward = useMemo(() => {
    if (!enabled || !stakedNFTs || stakedNFTs.length === 0) {
      return 0n;
    }

    return calculateTotalPendingReward(stakedNFTs, rewardTime);
  }, [stakedNFTs, enabled, rewardTime]);

  return {
    nftsWithRewards,
    totalPendingReward,
    isCalculating: !isClockSynced,
  };
}
