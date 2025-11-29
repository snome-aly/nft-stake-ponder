import { onchainTable, index } from "ponder";

/**
 * 核心业务实体
 *
 * 这些表可能被多个合约的事件更新
 * 例如：userStats 会被 StakableNFT 和 Staking 合约同时更新
 */

// ============================================
// NFT 实体表
// ============================================
export const nft = onchainTable(
  "nft",
  (t) => ({
    id: t.text().primaryKey(), // tokenId
    owner: t.hex().notNull(),
    tokenId: t.integer().notNull(),
    rarity: t.integer(), // 0=Common, 1=Rare, 2=Epic, 3=Legendary (揭示后更新)
    isRevealed: t.boolean().notNull().default(false),
    mintedAt: t.integer().notNull(),
    mintedBy: t.hex().notNull(),
  }),
  (table) => ({
    ownerIdx: index("nft_owner_idx").on(table.owner),
    rarityIdx: index("nft_rarity_idx").on(table.rarity),
  })
);

// ============================================
// 用户统计表
// ============================================
export const userStats = onchainTable("user_stats", (t) => ({
  id: t.hex().primaryKey(), // 用户地址
  totalMinted: t.integer().notNull().default(0),
  currentBalance: t.integer().notNull().default(0),
  totalTransferred: t.integer().notNull().default(0),
  // 未来扩展：质押相关统计
  // totalStaked: t.integer().notNull().default(0),
  // totalRewardsClaimed: t.bigint().notNull().default(0n),
}));

// ============================================
// 全局统计表
// ============================================
export const globalStats = onchainTable("global_stats", (t) => ({
  id: t.text().primaryKey(), // "global"
  totalMinted: t.integer().notNull().default(0),
  totalRevealed: t.boolean().notNull().default(false),
  revealOffset: t.integer().notNull().default(0),
  rarityPoolSet: t.boolean().notNull().default(false),
  // 稀有度分布
  commonCount: t.integer().notNull().default(0),
  rareCount: t.integer().notNull().default(0),
  epicCount: t.integer().notNull().default(0),
  legendaryCount: t.integer().notNull().default(0),
  // 未来扩展：质押相关统计
  // totalStakedNFTs: t.integer().notNull().default(0),
  // totalRewardsDistributed: t.bigint().notNull().default(0n),
}));
