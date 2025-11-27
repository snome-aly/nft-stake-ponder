/**
 * ============================================
 * 交易数据解码工具
 * ============================================
 *
 * 📌 核心功能：
 * 1. 解码交易的 input 数据，提取函数调用信息
 * 2. 获取函数名称、参数名、参数类型和参数值
 * 3. 格式化函数调用详情，便于在 UI 中展示
 *
 * 🎯 主要用途：
 * - 在区块浏览器中显示可读的交易信息
 * - Debug 页面展示交易详情
 * - 交易历史记录中显示函数调用
 *
 * 🔧 工作原理：
 * 1. 从已部署合约中提取所有 ABI
 * 2. 尝试用每个 ABI 解码交易数据
 * 3. 匹配成功后提取函数签名和参数
 */
import { TransactionWithFunction } from "./block";
import { GenericContractsDeclaration } from "./contract";
import { Abi, AbiFunction, decodeFunctionData, getAbiItem } from "viem";
import { hardhat } from "viem/chains";
import contractData from "~~/contracts/deployedContracts";

/**
 * 合约接口映射
 * 键：合约名称
 * 值：合约 ABI
 */
type ContractsInterfaces = Record<string, Abi>;

/**
 * 交易类型（可能为 null）
 */
type TransactionType = TransactionWithFunction | null;

// 获取已部署的合约数据
const deployedContracts = contractData as GenericContractsDeclaration | null;

// 获取 Hardhat 本地链的合约元数据
const chainMetaData = deployedContracts?.[hardhat.id];

/**
 * 合约接口集合
 * 从已部署合约中提取所有 ABI，用于解码交易
 *
 * 格式：{ "ContractName": ABI }
 */
const interfaces = chainMetaData
  ? Object.entries(chainMetaData).reduce((finalInterfacesObj, [contractName, contract]) => {
      finalInterfacesObj[contractName] = contract.abi;
      return finalInterfacesObj;
    }, {} as ContractsInterfaces)
  : {};

/**
 * 解码交易数据
 *
 * @param tx - 待解码的交易对象
 * @returns 解码后的交易对象（包含函数信息）
 *
 * 📌 功能：
 * 1. 检查交易 input 是否包含函数调用数据
 * 2. 尝试用所有已知合约的 ABI 解码
 * 3. 提取函数名称、参数名、参数类型和参数值
 * 4. 如果无法解码，标记为 "⚠️ Unknown"
 *
 * 🔍 工作流程：
 * 1. 验证 input 长度 >= 10（4 字节 selector + 至少 6 字节数据）
 * 2. 排除合约部署交易（以 0x60e06040 开头）
 * 3. 遍历所有合约 ABI，尝试解码
 * 4. 解码成功后提取函数签名和参数信息
 * 5. 解码失败则标记为未知函数
 *
 * 💡 注意事项：
 * - 只适用于已部署合约的函数调用
 * - 外部合约调用可能无法解码
 * - 合约创建交易不会被解码
 */
export const decodeTransactionData = (tx: TransactionWithFunction) => {
  // 检查是否有足够的 input 数据 && 不是合约创建交易
  // 0x60e06040 是 Solidity 合约字节码的常见前缀
  if (tx.input.length >= 10 && !tx.input.startsWith("0x60e06040")) {
    let foundInterface = false;

    // 遍历所有合约 ABI，尝试解码
    for (const [, contractAbi] of Object.entries(interfaces)) {
      try {
        // 使用 viem 的 decodeFunctionData 解码
        const { functionName, args } = decodeFunctionData({
          abi: contractAbi,
          data: tx.input,
        });

        // 提取函数名称
        tx.functionName = functionName;

        // 提取参数值
        tx.functionArgs = args as any[];

        // 提取参数名称列表
        // 例如：["to", "amount"]
        tx.functionArgNames = getAbiItem<AbiFunction[], string>({
          abi: contractAbi as AbiFunction[],
          name: functionName,
        })?.inputs?.map((input: any) => input.name);

        // 提取参数类型列表
        // 例如：["address", "uint256"]
        tx.functionArgTypes = getAbiItem<AbiFunction[], string>({
          abi: contractAbi as AbiFunction[],
          name: functionName,
        })?.inputs.map((input: any) => input.type);

        // 解码成功，跳出循环
        foundInterface = true;
        break;
      } catch {
        // 解码失败，尝试下一个 ABI
        // 不做任何操作，继续循环
      }
    }

    // 如果所有 ABI 都无法解码，标记为未知函数
    if (!foundInterface) {
      tx.functionName = "⚠️ Unknown";
    }
  }

  return tx;
};

/**
 * 获取函数调用详情（格式化字符串）
 *
 * @param transaction - 已解码的交易对象
 * @returns 格式化的函数调用字符串
 *
 * 📌 功能：
 * 将交易的函数调用信息格式化为可读的字符串
 *
 * 🔍 返回格式：
 * ```
 * functionName(type1 name1 = value1, type2 name2 = value2, ...)
 * ```
 *
 * 💡 示例：
 * ```
 * transfer(address to = 0x123..., uint256 amount = 1000000000000000000)
 * ```
 *
 * ⚠️ 注意：
 * - 如果交易未解码或缺少函数信息，返回空字符串
 * - 适用于在 UI 中展示交易详情
 */
export const getFunctionDetails = (transaction: TransactionType) => {
  // 检查交易是否包含完整的函数信息
  if (
    transaction &&
    transaction.functionName &&
    transaction.functionArgNames &&
    transaction.functionArgTypes &&
    transaction.functionArgs
  ) {
    // 格式化每个参数：type name = value
    const details = transaction.functionArgNames.map(
      (name, i) => `${transaction.functionArgTypes?.[i] || ""} ${name} = ${transaction.functionArgs?.[i] ?? ""}`,
    );

    // 返回完整的函数签名
    return `${transaction.functionName}(${details.join(", ")})`;
  }

  // 如果函数信息不完整，返回空字符串
  return "";
};
