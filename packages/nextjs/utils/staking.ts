/**
 * 质押相关的工具函数
 */

import { formatEther } from "viem";

/**
 * 格式化奖励数值
 * @param amount 奖励金额 (wei 单位)
 * @returns 格式化后的字符串，保留 4 位小数
 */
export function formatReward(amount: bigint | string): string {
  const value = typeof amount === "string" ? BigInt(amount) : amount;
  const formatted = formatEther(value);
  return parseFloat(formatted).toFixed(4);
}

/**
 * 格式化奖励（带单位）
 * @param amount 奖励金额 (wei 单位)
 * @returns 格式化后的字符串，带 RWRD 单位
 */
export function formatRewardWithUnit(amount: bigint): string {
  const value = Number(formatEther(amount));
  if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M RWRD`;
  if (value >= 1000) return `${(value / 1000).toFixed(2)}K RWRD`;
  return `${value.toFixed(4)} RWRD`;
}

/**
 * 计算日收益
 * @param multiplier 奖励倍率 (基数 10000)
 * @returns 日收益 (RWRD)
 */
export function calculateDailyReward(multiplier: number): number {
  const BASE_DAILY = 1; // 1 RWRD/天
  return BASE_DAILY * (multiplier / 10000);
}

/**
 * 格式化质押时长
 * @param stakedAt 质押时间戳 (秒)
 * @returns 格式化后的时长字符串 (例如: "3d 5h")
 */
export function formatStakingDuration(stakedAt: number): string {
  const now = Math.floor(Date.now() / 1000);
  const duration = now - stakedAt;

  const days = Math.floor(duration / 86400);
  const hours = Math.floor((duration % 86400) / 3600);
  const minutes = Math.floor((duration % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * 计算预计收益
 * @param multiplier 奖励倍率 (基数 10000)
 * @param days 质押天数
 * @returns 预计收益 (RWRD)
 */
export function calculateEstimatedReward(multiplier: number, days: number): number {
  const dailyReward = calculateDailyReward(multiplier);
  return dailyReward * days;
}

/**
 * 计算 APY
 * @param dailyReward 日收益 (RWRD)
 * @param nftValue NFT 估值 (USD)
 * @returns APY 百分比
 */
export function calculateAPY(dailyReward: number, nftValue: number): number {
  if (nftValue === 0) return 0;
  const annualReward = dailyReward * 365;
  return (annualReward / nftValue) * 100;
}

/**
 * 格式化时间戳为可读日期
 * @param timestamp 时间戳 (秒)
 * @returns 格式化后的日期字符串
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * 格式化相对时间 (例如: "3 days ago")
 * @param timestamp 时间戳 (秒)
 * @returns 相对时间字符串
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} days ago`;
  return formatTimestamp(timestamp);
}

/**
 * IPFS URI 转 HTTP 网关 URL
 * @param uri IPFS URI (ipfs://...) 或普通 URL
 * @returns HTTP 网关 URL
 */
export function convertIpfsToHttp(uri: string): string {
  if (!uri) return "";

  if (uri.startsWith("ipfs://")) {
    const cid = uri.replace("ipfs://", "");
    return `https://gateway.pinata.cloud/ipfs/${cid}`;
  }

  if (uri.startsWith("http://") || uri.startsWith("https://")) {
    return uri;
  }

  return uri;
}

/**
 * 获取稀有度配置
 */
export const RARITY_CONFIG = {
  0: {
    name: "Common",
    color: "from-gray-400 to-gray-600",
    textColor: "text-gray-400",
    bg: "bg-gray-500/20",
    multiplier: 10000, // 1x
  },
  1: {
    name: "Rare",
    color: "from-blue-400 to-blue-600",
    textColor: "text-blue-400",
    bg: "bg-blue-500/20",
    multiplier: 15000, // 1.5x
  },
  2: {
    name: "Epic",
    color: "from-purple-400 to-purple-600",
    textColor: "text-purple-400",
    bg: "bg-purple-500/20",
    multiplier: 20000, // 2x
  },
  3: {
    name: "Legendary",
    color: "from-yellow-400 to-orange-500",
    textColor: "text-yellow-400",
    bg: "bg-yellow-500/20",
    multiplier: 30000, // 3x
  },
} as const;

/**
 * 获取稀有度名称
 * @param rarity 稀有度值 (0-3)
 * @returns 稀有度名称
 */
export function getRarityName(rarity: number | null): string {
  if (rarity === null) return "Unknown";
  return RARITY_CONFIG[rarity as keyof typeof RARITY_CONFIG]?.name || "Unknown";
}

/**
 * 获取稀有度颜色类名
 * @param rarity 稀有度值 (0-3)
 * @returns Tailwind CSS 类名
 */
export function getRarityColor(rarity: number | null): string {
  if (rarity === null) return "text-gray-400";
  return RARITY_CONFIG[rarity as keyof typeof RARITY_CONFIG]?.textColor || "text-gray-400";
}

/**
 * 合约地址（从部署配置读取）
 */
export const CONTRACT_ADDRESSES = {
  // 这些地址会在运行时从 deployedContracts 读取
  // 此处仅作为类型定义
  STAKING_POOL: "" as `0x${string}`,
  STAKABLE_NFT: "" as `0x${string}`,
  REWARD_TOKEN: "" as `0x${string}`,
};
