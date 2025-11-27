/**
 * ============================================
 * 区块和交易相关类型定义
 * ============================================
 *
 * 📌 核心功能：
 * 1. 扩展交易类型，添加函数调用信息
 * 2. 定义交易收据映射类型
 * 3. 为交易表格组件提供类型支持
 *
 * 🎯 主要用途：
 * - 在交易历史中显示函数名称和参数
 * - 提供类型安全的交易表格组件
 */
import { Block, Transaction, TransactionReceipt } from "viem";

/**
 * 带函数信息的交易类型
 * 扩展了 viem 的 Transaction 类型，添加了解码后的函数调用信息
 */
export type TransactionWithFunction = Transaction & {
  functionName?: string; // 调用的函数名称（如 "transfer"）
  functionArgs?: any[]; // 函数参数值（如 [address, amount]）
  functionArgNames?: string[]; // 参数名称列表（如 ["to", "amount"]）
  functionArgTypes?: string[]; // 参数类型列表（如 ["address", "uint256"]）
};

/**
 * 交易收据映射
 * 键：交易哈希（0x...）
 * 值：交易收据对象
 *
 * 用于快速查找交易的执行结果（成功/失败、Gas 消耗等）
 */
type TransactionReceipts = {
  [key: string]: TransactionReceipt;
};

/**
 * 交易表格组件的 Props 类型
 *
 * @property blocks - 区块列表，包含区块信息和交易
 * @property transactionReceipts - 交易收据映射，用于显示交易状态
 *
 * 📌 使用场景：
 * - 区块浏览器页面
 * - 交易历史记录组件
 * - Debug 页面的交易列表
 */
export type TransactionsTableProps = {
  blocks: Block[]; // 区块数组
  transactionReceipts: TransactionReceipts; // 交易收据哈希映射
};
