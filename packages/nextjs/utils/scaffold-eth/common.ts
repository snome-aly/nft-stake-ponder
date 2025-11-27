/**
 * ============================================
 * 通用工具函数
 * ============================================
 *
 * 📌 核心功能：
 * 1. BigInt 序列化工具 - 用于 JSON.stringify
 * 2. 零地址常量和检查函数
 *
 * 🎯 主要用途：
 * - 解决 BigInt 在 JSON 序列化时的兼容性问题
 * - 提供零地址常量，避免硬编码
 * - 快速检查地址是否为零地址
 */

/**
 * BigInt 替换函数
 * 用于 JSON.stringify 的 replacer 参数
 *
 * @param _key - 对象的键（未使用）
 * @param value - 对象的值
 * @returns 如果值是 BigInt，转换为字符串；否则返回原值
 *
 * 📌 问题背景：
 * JavaScript 的 JSON.stringify 不支持 BigInt 类型
 * 直接序列化会抛出错误：TypeError: Do not know how to serialize a BigInt
 *
 * 💡 使用方法：
 * ```typescript
 * const data = { balance: 1000000000000000000n }; // BigInt
 * JSON.stringify(data, replacer); // "{"balance":"1000000000000000000"}"
 * ```
 *
 * 🔗 参考：
 * https://wagmi.sh/react/faq#bigint-serialization
 */
export const replacer = (_key: string, value: unknown) => (typeof value === "bigint" ? value.toString() : value);

/**
 * 零地址常量
 * 以太坊中的零地址（null address）
 *
 * 📌 用途：
 * - 表示未设置的地址
 * - 销毁代币的目标地址
 * - 合约中的默认地址值
 *
 * 💡 注意：
 * - 零地址没有私钥，无法签名交易
 * - 发送到零地址的 ETH 和代币将永久丢失
 */
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

/**
 * 检查地址是否为零地址
 *
 * @param address - 要检查的地址字符串
 * @returns 如果是零地址返回 true，否则返回 false
 *
 * 💡 使用场景：
 * ```typescript
 * if (isZeroAddress(owner)) {
 *   console.log("没有所有者");
 * }
 *
 * if (!isZeroAddress(recipient)) {
 *   // 执行转账
 * }
 * ```
 */
export const isZeroAddress = (address: string) => address === ZERO_ADDRESS;
