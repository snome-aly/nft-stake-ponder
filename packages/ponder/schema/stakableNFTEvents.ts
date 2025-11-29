import { onchainTable, index } from "ponder";

/**
 * StakableNFT 合约事件表
 *
 * 记录来自 StakableNFT 合约的事件历史
 */

// ============================================
// 铸造事件表
// ============================================
export const mintEvent = onchainTable(
  "mint_event",
  (t) => ({
    id: t.text().primaryKey(), // txHash-logIndex
    to: t.hex().notNull(),
    startTokenId: t.integer().notNull(),
    quantity: t.integer().notNull(),
    timestamp: t.integer().notNull(),
    blockNumber: t.integer().notNull(),
    transactionHash: t.hex().notNull(),
  }),
  (table) => ({
    toIdx: index("mint_event_to_idx").on(table.to),
  })
);

// ============================================
// 揭示事件表
// ============================================
export const revealEvent = onchainTable("reveal_event", (t) => ({
  id: t.text().primaryKey(), // txHash
  offset: t.integer().notNull(),
  timestamp: t.integer().notNull(),
  blockNumber: t.integer().notNull(),
  transactionHash: t.hex().notNull(),
}));

// ============================================
// 角色授予/撤销事件表
// ============================================
export const roleEvent = onchainTable(
  "role_event",
  (t) => ({
    id: t.text().primaryKey(), // txHash-logIndex
    eventType: t.text().notNull(), // "GRANTED" | "REVOKED"
    role: t.hex().notNull(),
    account: t.hex().notNull(),
    sender: t.hex().notNull(),
    timestamp: t.integer().notNull(),
    blockNumber: t.integer().notNull(),
    transactionHash: t.hex().notNull(),
  }),
  (table) => ({
    accountIdx: index("role_event_account_idx").on(table.account),
  })
);
