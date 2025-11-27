/**
 * ============================================
 * Viem/Wagmi 错误解析工具
 * ============================================
 *
 * 📌 核心功能：
 * 将 viem/wagmi 抛出的错误对象解析为用户友好的字符串
 *
 * 🎯 主要用途：
 * - 在 UI 中显示可读的错误信息
 * - 提取合约 revert 原因
 * - 统一错误处理格式
 *
 * 🔧 支持的错误类型：
 * - BaseViemError（viem 基础错误）
 * - ContractFunctionRevertedError（合约函数回退错误）
 * - 自定义错误（Custom Errors）
 * - 通用错误对象
 */
import { BaseError as BaseViemError, ContractFunctionRevertedError } from "viem";

/**
 * 解析 viem/wagmi 错误对象
 *
 * @param error - 错误对象（可以是任何类型）
 * @returns 格式化的错误字符串
 *
 * 📌 解析优先级：
 * 1. 如果错误有 walk() 方法，使用 walk() 遍历错误链
 * 2. 检查是否是 BaseViemError 类型
 * 3. 提取 details、shortMessage 或 message
 * 4. 特殊处理 ContractFunctionRevertedError
 * 5. 回退到通用错误信息
 *
 * 🔍 错误链处理：
 * viem 错误通常包含嵌套的错误信息
 * walk() 方法会遍历错误链，找到最底层的原因
 *
 * 💡 示例：
 * ```typescript
 * // 通用 viem 错误
 * getParsedError(error)
 * // => "User rejected the request"
 *
 * // 合约函数回退错误
 * getParsedError(contractError)
 * // => "Contract function execution reverted with the following reason:
 * //     InsufficientBalance(1000000000000000000)"
 *
 * // 自定义错误（Custom Error）
 * getParsedError(customError)
 * // => "Contract function execution reverted with the following reason:
 * //     Unauthorized(0x123...)"
 * ```
 */
export const getParsedError = (error: any): string => {
  // 1. 尝试遍历错误链，找到根本原因
  // walk() 方法会递归查找错误的 cause 属性
  const parsedError = error?.walk ? error.walk() : error;

  // 2. 检查是否是 viem 的 BaseError
  if (parsedError instanceof BaseViemError) {
    // 2.1 优先使用 details（最详细的错误信息）
    if (parsedError.details) {
      return parsedError.details;
    }

    // 2.2 使用 shortMessage（简短的错误描述）
    if (parsedError.shortMessage) {
      // 特殊处理：合约函数回退错误
      if (
        parsedError instanceof ContractFunctionRevertedError &&
        parsedError.data &&
        parsedError.data.errorName !== "Error" // 排除通用 Error
      ) {
        // 提取自定义错误的参数
        const customErrorArgs = parsedError.data.args?.toString() ?? "";

        // 格式化输出：
        // "Contract function execution reverted with the following reason:
        //  ErrorName(arg1, arg2, ...)"
        return `${parsedError.shortMessage.replace(/reverted\.$/, "reverted with the following reason:")}\n${
          parsedError.data.errorName
        }(${customErrorArgs})`;
      }

      // 返回简短消息
      return parsedError.shortMessage;
    }

    // 2.3 回退到 message 或 name
    return parsedError.message ?? parsedError.name ?? "An unknown error occurred";
  }

  // 3. 处理非 viem 错误
  return parsedError?.message ?? "An unknown error occurred";
};
