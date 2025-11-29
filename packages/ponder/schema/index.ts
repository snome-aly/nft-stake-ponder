/**
 * Schema 统一导出
 *
 * 结构说明：
 * - entities.ts: 核心业务实体（可能被多个合约更新）
 * - xxxEvents.ts: 各合约的事件记录表
 *
 * 未来扩展时添加新文件并在此导出
 */

// 核心实体
export * from "./entities";

// StakableNFT 合约事件
export * from "./stakableNFTEvents";

// 未来扩展示例：
// export * from "./stakingEvents";
// export * from "./rewardEvents";
