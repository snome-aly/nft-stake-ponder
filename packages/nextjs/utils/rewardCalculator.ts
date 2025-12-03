/**
 * 前端奖励计算工具
 *
 * 复现合约的 calculatePendingReward 逻辑，实现前端实时计算
 */

// 合约常量：BASE_REWARD_PER_SECOND = 1e18 / 86400 ≈ 11574074074074
export const BASE_REWARD_PER_SECOND = 11574074074074n;

// 稀有度对应的奖励倍率（基数 10000）
export const RARITY_MULTIPLIERS = {
  0: 10000, // Common: 1x
  1: 15000, // Rare: 1.5x
  2: 20000, // Epic: 2x
  3: 30000, // Legendary: 3x
} as const;

/**
 * 计算单个 NFT 的待领取奖励
 *
 * @param lastClaimTime - 最后领取时间（秒级时间戳）
 * @param rarity - NFT 稀有度（0-3）
 * @param currentTime - 当前时间（秒级时间戳，可选，默认为 Date.now()）
 * @returns 待领取奖励（bigint，单位 wei）
 */
export function calculatePendingReward(lastClaimTime: number, rarity: number | null, currentTime?: number): bigint {
  // 未揭示或稀有度无效，返回 0
  if (rarity === null || rarity < 0 || rarity > 3) {
    return 0n;
  }

  const now = currentTime ?? Math.floor(Date.now() / 1000);

  // 计算质押时长（秒）- 添加保护避免负数
  const timeDiff = now - lastClaimTime;
  if (timeDiff < 0) {
    console.warn(`[rewardCalculator] 时间异常: now=${now}, lastClaimTime=${lastClaimTime}`);
    return 0n; // 时间异常时返回 0
  }
  const timeStaked = BigInt(timeDiff);

  // 获取稀有度倍率
  const multiplier = BigInt(RARITY_MULTIPLIERS[rarity as keyof typeof RARITY_MULTIPLIERS]);

  // 公式：时长 × 基础速率 × 倍率 / 10000
  return (timeStaked * BASE_REWARD_PER_SECOND * multiplier) / 10000n;
}

/**
 * 批量计算待领取奖励
 *
 * @param nfts - NFT 数组，每个包含 lastClaimTime 和 rarity
 * @param currentTime - 当前时间（秒级时间戳，可选）
 * @returns 奖励数组
 */
export function batchCalculatePendingReward(
  nfts: Array<{ lastClaimTime: number; rarity: number | null }>,
  currentTime?: number,
): bigint[] {
  const now = currentTime ?? Math.floor(Date.now() / 1000);
  return nfts.map(nft => calculatePendingReward(nft.lastClaimTime, nft.rarity, now));
}

/**
 * 计算总待领取奖励
 *
 * @param nfts - NFT 数组
 * @param currentTime - 当前时间（可选）
 * @returns 总奖励（bigint）
 */
export function calculateTotalPendingReward(
  nfts: Array<{ lastClaimTime: number; rarity: number | null }>,
  currentTime?: number,
): bigint {
  const rewards = batchCalculatePendingReward(nfts, currentTime);
  return rewards.reduce((sum, reward) => sum + reward, 0n);
}

/**
 * 格式化奖励为 RWRD（带4位小数）
 *
 * @param reward - 奖励金额（bigint，wei 单位）
 * @returns 格式化后的字符串，如 "1.2345"
 */
export function formatReward(reward: bigint): string {
  return (Number(reward) / 1e18).toFixed(4);
}

/**
 * 调试工具：验证计算结果
 *
 * 用于对比前端计算和预期结果
 */
export function debugCalculation(lastClaimTime: number, rarity: number, stakedSeconds: number) {
  const multiplier = RARITY_MULTIPLIERS[rarity as keyof typeof RARITY_MULTIPLIERS];
  const rawReward = BigInt(stakedSeconds) * BASE_REWARD_PER_SECOND * BigInt(multiplier);
  const finalReward = rawReward / 10000n;

  console.log("[rewardCalculator] 调试信息:", {
    lastClaimTime,
    rarity,
    stakedSeconds,
    multiplier,
    BASE_REWARD_PER_SECOND: BASE_REWARD_PER_SECOND.toString(),
    rawReward: rawReward.toString(),
    finalReward: finalReward.toString(),
    finalRewardRWRD: formatReward(finalReward),
    expectedPerDay: formatReward((BigInt(86400) * BASE_REWARD_PER_SECOND * BigInt(multiplier)) / 10000n),
  });

  return finalReward;
}
