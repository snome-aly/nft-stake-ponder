import { onchainTable, index } from "ponder";

/**
 * NFTStakingPool 合约事件表
 *
 * 记录来自 NFTStakingPool 合约的质押相关事件
 */

// ============================================
// 质押事件表（历史记录）
// ============================================
export const stakingEvent = onchainTable(
  "staking_event",
  (t) => ({
    id: t.text().primaryKey(), // txHash-logIndex
    type: t.text().notNull(), // "STAKE" | "UNSTAKE" | "CLAIM"
    user: t.hex().notNull(),
    tokenId: t.integer().notNull(),
    amount: t.bigint(), // 奖励金额（仅 UNSTAKE 和 CLAIM 有值）
    timestamp: t.integer().notNull(),
    blockNumber: t.integer().notNull(),
    transactionHash: t.hex().notNull(),
  }),
  (table) => ({
    userIdx: index("staking_event_user_idx").on(table.user),
    typeIdx: index("staking_event_type_idx").on(table.type),
    timestampIdx: index("staking_event_timestamp_idx").on(table.timestamp),
    userTypeIdx: index("staking_event_user_type_idx").on(table.user, table.type),
  })
);

// ============================================
// 当前活跃质押表（实时状态）
// ============================================
export const activeStake = onchainTable(
  "active_stake",
  (t) => ({
    id: t.text().primaryKey(), // user-tokenId
    user: t.hex().notNull(),
    tokenId: t.integer().notNull(),
    stakedAt: t.integer().notNull(), // 质押时间戳
    lastClaimTime: t.integer().notNull(), // 最后领取奖励时间（用于计算 pending reward）
    rarity: t.integer(), // NFT 稀有度（0-3，用于计算奖励倍率）
    transactionHash: t.hex().notNull(), // 质押交易哈希
  }),
  (table) => ({
    userIdx: index("active_stake_user_idx").on(table.user),
    tokenIdIdx: index("active_stake_token_idx").on(table.tokenId),
  })
);

// ============================================
// 用户质押统计表
// ============================================
export const stakingStats = onchainTable("staking_stats", (t) => ({
  id: t.hex().primaryKey(), // 用户地址
  totalStaked: t.integer().notNull().default(0), // 当前质押数量
  totalClaimed: t.bigint().notNull().default(0n), // 累计已领取奖励（包括 claim 和 unstake 时的奖励）
  totalEarned: t.bigint().notNull().default(0n), // 累计已领取奖励（与 totalClaimed 相同，保留用于兼容）
  lastUpdated: t.integer().notNull(), // 最后更新时间
}));
