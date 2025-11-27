import { onchainTable, index } from "ponder";

/**
 * NFT 信息表
 */
export const nft = onchainTable("nft", (t) => ({
  id: t.text().primaryKey(), // tokenId
  owner: t.hex().notNull(),
  tokenId: t.integer().notNull(),
  rarity: t.integer(), // 0=Common, 1=Rare, 2=Epic, 3=Legendary (揭示后更新)
  isRevealed: t.boolean().notNull().default(false),
  mintedAt: t.integer().notNull(),
  mintedBy: t.hex().notNull(),
}));

/**
 * 用户统计表
 */
export const userStats = onchainTable("user_stats", (t) => ({
  id: t.hex().primaryKey(), // 用户地址
  totalMinted: t.integer().notNull().default(0),
  currentBalance: t.integer().notNull().default(0),
  totalTransferred: t.integer().notNull().default(0),
}));

/**
 * 全局统计表
 */
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
}));

/**
 * 铸造事件表
 */
export const mintEvent = onchainTable("mint_event", (t) => ({
  id: t.text().primaryKey(), // txHash-logIndex
  to: t.hex().notNull(),
  startTokenId: t.integer().notNull(),
  quantity: t.integer().notNull(),
  timestamp: t.integer().notNull(),
  blockNumber: t.integer().notNull(),
  transactionHash: t.hex().notNull(),
}));

/**
 * 揭示事件表
 */
export const revealEvent = onchainTable("reveal_event", (t) => ({
  id: t.text().primaryKey(), // txHash
  offset: t.integer().notNull(),
  timestamp: t.integer().notNull(),
  blockNumber: t.integer().notNull(),
  transactionHash: t.hex().notNull(),
}));

/**
 * 角色授予/撤销事件表
 */
export const roleEvent = onchainTable("role_event", (t) => ({
  id: t.text().primaryKey(), // txHash-logIndex
  eventType: t.text().notNull(), // "GRANTED" | "REVOKED"
  role: t.hex().notNull(),
  account: t.hex().notNull(),
  sender: t.hex().notNull(),
  timestamp: t.integer().notNull(),
  blockNumber: t.integer().notNull(),
  transactionHash: t.hex().notNull(),
}));

// 索引定义
export const nftOwnerIndex = index("nft_owner_idx").on(nft.owner);
export const nftRarityIndex = index("nft_rarity_idx").on(nft.rarity);
export const mintEventToIndex = index("mint_event_to_idx").on(mintEvent.to);
export const roleEventAccountIndex = index("role_event_account_idx").on(roleEvent.account);
