/**
 * ============================================
 * Scaffold-ETH 合约类型和工具函数
 * ============================================
 *
 * 📌 核心功能：
 * 1. 合约类型定义 - 提供类型安全的合约交互
 * 2. 合并本地和外部合约 - 支持多合约源
 * 3. 错误解析 - 增强的错误信息显示
 * 4. 合约模拟执行 - 在发送交易前预检查
 *
 * 🎯 主要用途：
 * - 为 useScaffoldReadContract/useScaffoldWriteContract hooks 提供类型支持
 * - 统一管理已部署合约和外部合约的 ABI 和地址
 * - 提供友好的错误提示和交易模拟
 */
import { getParsedError } from "./getParsedError";
import { AllowedChainIds } from "./networks";
import { notification } from "./notification";
import { MutateOptions } from "@tanstack/react-query";
import {
  Abi,
  AbiParameter,
  AbiParameterToPrimitiveType,
  AbiParametersToPrimitiveTypes,
  ExtractAbiEvent,
  ExtractAbiEventNames,
  ExtractAbiFunction,
} from "abitype";
import type { ExtractAbiFunctionNames } from "abitype";
import type { Simplify } from "type-fest";
import type { MergeDeepRecord } from "type-fest/source/merge-deep";
import {
  Address,
  Block,
  GetEventArgs,
  GetTransactionReceiptReturnType,
  GetTransactionReturnType,
  Log,
  TransactionReceipt,
  WriteContractErrorType,
  keccak256,
  toHex,
} from "viem";
import { Config, UseReadContractParameters, UseWatchContractEventParameters, UseWriteContractParameters } from "wagmi";
import { WriteContractParameters, WriteContractReturnType, simulateContract } from "wagmi/actions";
import { WriteContractVariables } from "wagmi/query";
import deployedContractsData from "~~/contracts/deployedContracts";
import externalContractsData from "~~/contracts/externalContracts";
import scaffoldConfig from "~~/scaffold.config";

/**
 * 为合约声明添加 external 标记
 * 用于区分本地部署的合约和外部引入的合约
 */
type AddExternalFlag<T> = {
  [ChainId in keyof T]: {
    [ContractName in keyof T[ChainId]]: T[ChainId][ContractName] & { external?: true };
  };
};

/**
 * 深度合并本地合约和外部合约
 *
 * @param local - 本地部署的合约数据（来自 deployedContracts.ts）
 * @param external - 外部合约数据（来自 externalContracts.ts）
 * @returns 合并后的合约数据，外部合约会被标记 external: true
 *
 * 📌 合并规则：
 * 1. 本地合约优先（如果 chainId 只存在于本地）
 * 2. 外部合约添加 external: true 标记
 * 3. 同一 chainId 下的合约会合并到一起
 */
const deepMergeContracts = <L extends Record<PropertyKey, any>, E extends Record<PropertyKey, any>>(
  local: L,
  external: E,
) => {
  const result: Record<PropertyKey, any> = {};
  // 获取所有 chainId（本地 + 外部）
  const allKeys = Array.from(new Set([...Object.keys(external), ...Object.keys(local)]));

  for (const key of allKeys) {
    // 如果外部合约中没有这个 chainId，直接使用本地合约
    if (!external[key]) {
      result[key] = local[key];
      continue;
    }

    // 为外部合约添加 external: true 标记
    const amendedExternal = Object.fromEntries(
      Object.entries(external[key] as Record<string, Record<string, unknown>>).map(([contractName, declaration]) => [
        contractName,
        { ...declaration, external: true },
      ]),
    );

    // 合并本地和外部合约
    result[key] = { ...local[key], ...amendedExternal };
  }

  return result as MergeDeepRecord<AddExternalFlag<L>, AddExternalFlag<E>, { arrayMergeMode: "replace" }>;
};

// 合并后的合约数据（包含本地部署 + 外部合约）
const contractsData = deepMergeContracts(deployedContractsData, externalContractsData);

/**
 * 继承函数映射
 * 格式：{ "functionSignature": "ContractName" }
 * 用于记录哪些函数是从其他合约继承而来
 */
export type InheritedFunctions = { readonly [key: string]: string };

/**
 * 通用合约声明
 * 包含合约的所有必要信息
 */
export type GenericContract = {
  address: Address; // 合约地址
  abi: Abi; // 合约 ABI
  inheritedFunctions?: InheritedFunctions; // 继承的函数（可选）
  external?: true; // 是否为外部合约（可选）
  deployedOnBlock?: number; // 部署区块号（可选）
};

/**
 * 通用合约声明集合
 * 格式：{ [chainId]: { [contractName]: GenericContract } }
 */
export type GenericContractsDeclaration = {
  [chainId: number]: {
    [contractName: string]: GenericContract;
  };
};

// 导出合并后的合约数据
export const contracts = contractsData as GenericContractsDeclaration | null;

// ============================================
// 类型推导和辅助类型
// ============================================

// 获取配置的 chainId
type ConfiguredChainId = (typeof scaffoldConfig)["targetNetworks"][0]["id"];

/**
 * 检查合约声明是否缺失
 * 如果缺失，使用 TYes 类型；否则使用 TNo 类型
 */
type IsContractDeclarationMissing<TYes, TNo> = typeof contractsData extends { [key in ConfiguredChainId]: any }
  ? TNo
  : TYes;

// 合约声明类型（如果缺失则使用通用类型）
type ContractsDeclaration = IsContractDeclarationMissing<GenericContractsDeclaration, typeof contractsData>;

// 当前链的合约集合
type Contracts = ContractsDeclaration[ConfiguredChainId];

/**
 * 合约名称类型
 * 所有可用合约的名称联合类型
 */
export type ContractName = keyof Contracts;

/**
 * 获取特定合约的类型
 */
export type Contract<TContractName extends ContractName> = Contracts[TContractName];

/**
 * 从合约中推导 ABI 类型
 */
type InferContractAbi<TContract> = TContract extends { abi: infer TAbi } ? TAbi : never;

/**
 * 获取合约的 ABI 类型
 */
export type ContractAbi<TContractName extends ContractName = ContractName> = InferContractAbi<Contract<TContractName>>;

// ============================================
// ABI 函数相关类型
// ============================================

/**
 * 提取 ABI 函数的输入参数类型
 */
export type AbiFunctionInputs<TAbi extends Abi, TFunctionName extends string> = ExtractAbiFunction<
  TAbi,
  TFunctionName
>["inputs"];

/**
 * 将 ABI 函数输入参数转换为原始类型
 * 例如：[{ type: "uint256" }] => [bigint]
 */
export type AbiFunctionArguments<TAbi extends Abi, TFunctionName extends string> = AbiParametersToPrimitiveTypes<
  AbiFunctionInputs<TAbi, TFunctionName>
>;

/**
 * 提取 ABI 函数的输出参数类型
 */
export type AbiFunctionOutputs<TAbi extends Abi, TFunctionName extends string> = ExtractAbiFunction<
  TAbi,
  TFunctionName
>["outputs"];

/**
 * 获取 ABI 函数的返回值类型
 * 如果只有一个返回值，直接返回该类型
 * 如果有多个返回值，返回元组类型
 */
export type AbiFunctionReturnType<TAbi extends Abi, TFunctionName extends string> = IsContractDeclarationMissing<
  any,
  AbiParametersToPrimitiveTypes<AbiFunctionOutputs<TAbi, TFunctionName>> extends readonly [any]
    ? AbiParametersToPrimitiveTypes<AbiFunctionOutputs<TAbi, TFunctionName>>[0]
    : AbiParametersToPrimitiveTypes<AbiFunctionOutputs<TAbi, TFunctionName>>
>;

// ============================================
// ABI 事件相关类型
// ============================================

/**
 * 提取 ABI 事件的输入参数类型
 */
export type AbiEventInputs<TAbi extends Abi, TEventName extends ExtractAbiEventNames<TAbi>> = ExtractAbiEvent<
  TAbi,
  TEventName
>["inputs"];

// ============================================
// 合约代码状态枚举
// ============================================

/**
 * 合约代码状态
 * - LOADING: 正在加载
 * - DEPLOYED: 已部署（合约代码存在）
 * - NOT_FOUND: 未找到（地址上没有合约代码）
 */
export enum ContractCodeStatus {
  "LOADING",
  "DEPLOYED",
  "NOT_FOUND",
}

// ============================================
// ABI 状态可变性类型
// ============================================

type AbiStateMutability = "pure" | "view" | "nonpayable" | "payable";
export type ReadAbiStateMutability = "view" | "pure"; // 只读函数
export type WriteAbiStateMutability = "nonpayable" | "payable"; // 写入函数

/**
 * 获取带有输入参数的函数名称
 * 排除无参数的函数
 */
export type FunctionNamesWithInputs<
  TContractName extends ContractName,
  TAbiStateMutability extends AbiStateMutability = AbiStateMutability,
> = Exclude<
  Extract<
    ContractAbi<TContractName>[number],
    {
      type: "function";
      stateMutability: TAbiStateMutability;
    }
  >,
  {
    inputs: readonly [];
  }
>["name"];

// ============================================
// 类型工具函数
// ============================================

/**
 * 展开对象类型（用于更好的类型显示）
 */
type Expand<T> = T extends object ? (T extends infer O ? { [K in keyof O]: O[K] } : never) : T;

/**
 * 将联合类型转换为交叉类型
 * 用于合并多个类型
 */
type UnionToIntersection<U> = Expand<(U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never>;

/**
 * 将元组中的所有元素变为可选
 * 例如：[string, number] => [string | undefined, number | undefined]
 */
type OptionalTuple<T> = T extends readonly [infer H, ...infer R] ? readonly [H | undefined, ...OptionalTuple<R>] : T;

/**
 * useScaffold hooks 的参数类型
 * 如果函数有输入参数，则需要提供 args
 * 如果函数是 payable，则可以提供 value
 */
type UseScaffoldArgsParam<
  TContractName extends ContractName,
  TFunctionName extends ExtractAbiFunctionNames<ContractAbi<TContractName>>,
> =
  TFunctionName extends FunctionNamesWithInputs<TContractName>
    ? {
        args: OptionalTuple<UnionToIntersection<AbiFunctionArguments<ContractAbi<TContractName>, TFunctionName>>>;
        value?: ExtractAbiFunction<ContractAbi<TContractName>, TFunctionName>["stateMutability"] extends "payable"
          ? bigint | undefined
          : undefined;
      }
    : {
        args?: never;
      };

// ============================================
// Hook 配置类型
// ============================================

/**
 * useDeployedContract hook 配置
 */
export type UseDeployedContractConfig<TContractName extends ContractName> = {
  contractName: TContractName; // 合约名称
  chainId?: AllowedChainIds; // 链 ID（可选，默认使用配置的链）
};

/**
 * useScaffoldWrite hook 配置
 */
export type UseScaffoldWriteConfig<TContractName extends ContractName> = {
  contractName: TContractName; // 合约名称
  chainId?: AllowedChainIds; // 链 ID（可选）
  disableSimulate?: boolean; // 是否禁用模拟执行（可选）
  writeContractParams?: UseWriteContractParameters; // wagmi 的写入参数（可选）
};

/**
 * useScaffoldRead hook 配置
 */
export type UseScaffoldReadConfig<
  TContractName extends ContractName,
  TFunctionName extends ExtractAbiFunctionNames<ContractAbi<TContractName>, ReadAbiStateMutability>,
> = {
  contractName: TContractName; // 合约名称
  chainId?: AllowedChainIds; // 链 ID（可选）
  watch?: boolean; // 是否监听变化（可选）
} & IsContractDeclarationMissing<
  Partial<UseReadContractParameters>,
  {
    functionName: TFunctionName; // 函数名称
  } & UseScaffoldArgsParam<TContractName, TFunctionName> &
    Omit<UseReadContractParameters, "chainId" | "abi" | "address" | "functionName" | "args">
>;

/**
 * ScaffoldWriteContract 变量类型
 */
export type ScaffoldWriteContractVariables<
  TContractName extends ContractName,
  TFunctionName extends ExtractAbiFunctionNames<ContractAbi<TContractName>, WriteAbiStateMutability>,
> = IsContractDeclarationMissing<
  Partial<WriteContractParameters>,
  {
    functionName: TFunctionName; // 函数名称
  } & UseScaffoldArgsParam<TContractName, TFunctionName> &
    Omit<WriteContractParameters, "chainId" | "abi" | "address" | "functionName" | "args">
>;

type WriteVariables = WriteContractVariables<Abi, string, any[], Config, number>;

/**
 * Transactor 函数选项
 */
export type TransactorFuncOptions = {
  onBlockConfirmation?: (txnReceipt: TransactionReceipt) => void; // 区块确认回调
  blockConfirmations?: number; // 需要等待的确认数
};

/**
 * ScaffoldWriteContract 选项
 * 包含 React Query 的 mutation 选项 + Transactor 选项
 */
export type ScaffoldWriteContractOptions = MutateOptions<
  WriteContractReturnType,
  WriteContractErrorType,
  WriteVariables,
  unknown
> &
  TransactorFuncOptions;

// ============================================
// 事件相关类型
// ============================================

/**
 * useScaffoldEvent hook 配置
 */
export type UseScaffoldEventConfig<
  TContractName extends ContractName,
  TEventName extends ExtractAbiEventNames<ContractAbi<TContractName>>,
  TEvent extends ExtractAbiEvent<ContractAbi<TContractName>, TEventName> = ExtractAbiEvent<
    ContractAbi<TContractName>,
    TEventName
  >,
> = {
  contractName: TContractName; // 合约名称
  eventName: TEventName; // 事件名称
  chainId?: AllowedChainIds; // 链 ID（可选）
} & IsContractDeclarationMissing<
  Omit<UseWatchContractEventParameters, "onLogs" | "address" | "abi" | "eventName"> & {
    onLogs: (
      logs: Simplify<
        Omit<Log<bigint, number, any>, "args" | "eventName"> & {
          args: Record<string, unknown>;
          eventName: string;
        }
      >[],
    ) => void;
  },
  Omit<UseWatchContractEventParameters<ContractAbi<TContractName>>, "onLogs" | "address" | "abi" | "eventName"> & {
    onLogs: (
      logs: Simplify<
        Omit<Log<bigint, number, false, TEvent, false, [TEvent], TEventName>, "args"> & {
          args: AbiParametersToPrimitiveTypes<TEvent["inputs"]> &
            GetEventArgs<
              ContractAbi<TContractName>,
              TEventName,
              {
                IndexedOnly: false;
              }
            >;
        }
      >[],
    ) => void;
  }
>;

/**
 * 获取事件的索引参数
 * 只返回标记为 indexed 的参数
 */
type IndexedEventInputs<
  TContractName extends ContractName,
  TEventName extends ExtractAbiEventNames<ContractAbi<TContractName>>,
> = Extract<AbiEventInputs<ContractAbi<TContractName>, TEventName>[number], { indexed: true }>;

/**
 * 事件过滤器类型
 * 用于按索引参数过滤事件
 */
export type EventFilters<
  TContractName extends ContractName,
  TEventName extends ExtractAbiEventNames<ContractAbi<TContractName>>,
> = IsContractDeclarationMissing<
  any,
  IndexedEventInputs<TContractName, TEventName> extends never
    ? never
    : {
        [Key in IsContractDeclarationMissing<
          any,
          IndexedEventInputs<TContractName, TEventName>["name"]
        >]?: AbiParameterToPrimitiveType<Extract<IndexedEventInputs<TContractName, TEventName>, { name: Key }>>;
      }
>;

/**
 * useScaffoldEventHistory hook 配置
 */
export type UseScaffoldEventHistoryConfig<
  TContractName extends ContractName,
  TEventName extends ExtractAbiEventNames<ContractAbi<TContractName>>,
  TBlockData extends boolean = false,
  TTransactionData extends boolean = false,
  TReceiptData extends boolean = false,
> = {
  contractName: TContractName; // 合约名称
  eventName: IsContractDeclarationMissing<string, TEventName>; // 事件名称
  fromBlock?: bigint; // 起始区块（可选）
  toBlock?: bigint; // 结束区块（可选）
  chainId?: AllowedChainIds; // 链 ID（可选）
  filters?: EventFilters<TContractName, TEventName>; // 事件过滤器（可选）
  blockData?: TBlockData; // 是否包含区块数据
  transactionData?: TTransactionData; // 是否包含交易数据
  receiptData?: TReceiptData; // 是否包含收据数据
  watch?: boolean; // 是否监听新事件
  enabled?: boolean; // 是否启用查询
  blocksBatchSize?: number; // 每批查询的区块数
};

/**
 * useScaffoldEventHistory 返回的数据类型
 */
export type UseScaffoldEventHistoryData<
  TContractName extends ContractName,
  TEventName extends ExtractAbiEventNames<ContractAbi<TContractName>>,
  TBlockData extends boolean = false,
  TTransactionData extends boolean = false,
  TReceiptData extends boolean = false,
  TEvent extends ExtractAbiEvent<ContractAbi<TContractName>, TEventName> = ExtractAbiEvent<
    ContractAbi<TContractName>,
    TEventName
  >,
> =
  | IsContractDeclarationMissing<
      any[],
      {
        args: AbiParametersToPrimitiveTypes<TEvent["inputs"]> &
          GetEventArgs<
            ContractAbi<TContractName>,
            TEventName,
            {
              IndexedOnly: false;
            }
          >;
        blockData: TBlockData extends true ? Block<bigint, true> : null;
        receiptData: TReceiptData extends true ? GetTransactionReturnType : null;
        transactionData: TTransactionData extends true ? GetTransactionReceiptReturnType : null;
      } & Log<bigint, number, false, TEvent, false, [TEvent], TEventName>[]
    >
  | undefined;

/**
 * ABI 参数元组类型
 * 用于处理复杂的结构化参数
 */
export type AbiParameterTuple = Extract<AbiParameter, { type: "tuple" | `tuple[${string}]` }>;

// ============================================
// 错误处理函数
// ============================================

/**
 * 增强的错误解析函数
 * 从所有已部署合约的 ABI 中查找错误签名
 *
 * @param error - 原始错误对象
 * @param chainId - 链 ID
 * @returns 解析后的错误信息
 *
 * 📌 功能：
 * 1. 如果错误是未识别的错误签名，尝试从所有合约 ABI 中查找
 * 2. 创建错误签名查找表（errorSelector => 错误信息）
 * 3. 提供更友好的错误提示
 *
 * 🔍 工作原理：
 * 1. 提取错误签名（0x12345678 格式）
 * 2. 遍历所有合约的 ABI，找到所有 error 定义
 * 3. 计算每个 error 的 selector（keccak256 前 4 字节）
 * 4. 在查找表中匹配错误签名
 */
export const getParsedErrorWithAllAbis = (error: any, chainId: AllowedChainIds): string => {
  const originalParsedError = getParsedError(error);

  // 检查是否是未识别的错误签名
  if (/Encoded error signature.*not found on ABI/i.test(originalParsedError)) {
    const signatureMatch = originalParsedError.match(/0x[a-fA-F0-9]{8}/);
    const signature = signatureMatch ? signatureMatch[0] : "";

    if (!signature) {
      return originalParsedError;
    }

    try {
      // 获取当前链的所有已部署合约
      const chainContracts = deployedContractsData[chainId as keyof typeof deployedContractsData];

      if (!chainContracts) {
        return originalParsedError;
      }

      // 构建错误签名查找表
      const errorLookup: Record<string, { name: string; contract: string; signature: string }> = {};

      Object.entries(chainContracts).forEach(([contractName, contract]: [string, any]) => {
        if (contract.abi) {
          contract.abi.forEach((item: any) => {
            if (item.type === "error") {
              // 创建 Solidity 风格的错误签名
              const errorName = item.name;
              const inputs = item.inputs || [];
              const inputTypes = inputs.map((input: any) => input.type).join(",");
              const errorSignature = `${errorName}(${inputTypes})`;

              // 计算错误选择器（hash 的前 4 字节）
              const hash = keccak256(toHex(errorSignature));
              const errorSelector = hash.slice(0, 10); // 0x + 8 hex chars = 10 total

              errorLookup[errorSelector] = {
                name: errorName,
                contract: contractName,
                signature: errorSignature,
              };
            }
          });
        }
      });

      // 在查找表中匹配错误
      const errorInfo = errorLookup[signature];
      if (errorInfo) {
        return `Contract function execution reverted with the following reason:\n${errorInfo.signature} from ${errorInfo.contract} contract`;
      }

      // 如果未找到，提供有用的提示信息
      return `${originalParsedError}\n\nThis error occurred when calling a function that internally calls another contract. Check the contract that your function calls internally for more details.`;
    } catch (lookupError) {
      console.log("Failed to create error lookup table:", lookupError);
    }
  }

  return originalParsedError;
};

/**
 * 模拟合约写入并通知错误
 *
 * @param wagmiConfig - Wagmi 配置对象
 * @param writeContractParams - 写入合约的参数
 * @param chainId - 链 ID
 *
 * 📌 功能：
 * 1. 在实际发送交易前模拟执行
 * 2. 如果模拟失败，解析错误并显示通知
 * 3. 抛出错误以中止交易
 *
 * 💡 作用：
 * - 提前发现会失败的交易，避免浪费 gas
 * - 提供友好的错误提示
 */
export const simulateContractWriteAndNotifyError = async ({
  wagmiConfig,
  writeContractParams: params,
  chainId,
}: {
  wagmiConfig: Config;
  writeContractParams: WriteContractVariables<Abi, string, any[], Config, number>;
  chainId: AllowedChainIds;
}) => {
  try {
    // 模拟合约执行
    await simulateContract(wagmiConfig, params);
  } catch (error) {
    // 解析错误信息
    const parsedError = getParsedErrorWithAllAbis(error, chainId);

    // 显示错误通知
    notification.error(parsedError);

    // 抛出错误，中止交易
    throw error;
  }
};
