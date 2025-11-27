/**
 * ============================================
 * Scaffold-ETH 工具函数导出
 * ============================================
 *
 * 📌 核心功能：
 * 统一导出 scaffold-eth 目录下的所有工具函数和类型
 *
 * 🎯 主要用途：
 * - 简化导入语句
 * - 提供统一的导入入口
 * - 便于模块管理和维护
 *
 * 💡 使用方法：
 * ```typescript
 * // ✅ 推荐：从统一入口导入
 * import {
 *   fetchPriceFromUniswap,
 *   getBlockExplorerTxLink,
 *   notification,
 *   decodeTransactionData
 * } from "~~/utils/scaffold-eth";
 *
 * // ❌ 不推荐：从各个文件单独导入
 * import { fetchPriceFromUniswap } from "~~/utils/scaffold-eth/fetchPriceFromUniswap";
 * import { getBlockExplorerTxLink } from "~~/utils/scaffold-eth/networks";
 * ```
 *
 * 📦 导出的模块：
 * 1. fetchPriceFromUniswap - Uniswap 价格获取
 * 2. networks - 网络配置和区块浏览器链接
 * 3. notification - 通知系统
 * 4. block - 区块和交易类型
 * 5. decodeTxData - 交易数据解码
 * 6. getParsedError - 错误解析
 */

// 导出 Uniswap 价格获取相关
export * from "./fetchPriceFromUniswap";

// 导出网络配置相关
export * from "./networks";

// 导出通知系统
export * from "./notification";

// 导出区块和交易类型
export * from "./block";

// 导出交易解码工具
export * from "./decodeTxData";

// 导出错误解析工具
export * from "./getParsedError";
