import { useEffect } from "react";
import { QueryObserverResult, RefetchOptions, useQueryClient } from "@tanstack/react-query";
import type { ExtractAbiFunctionNames } from "abitype";
import { ReadContractErrorType } from "viem";
import { useBlockNumber, useReadContract } from "wagmi";
import { useSelectedNetwork } from "~~/hooks/scaffold-eth";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { AllowedChainIds } from "~~/utils/scaffold-eth";
import {
  AbiFunctionReturnType,
  ContractAbi,
  ContractName,
  UseScaffoldReadConfig,
} from "~~/utils/scaffold-eth/contract";

/**
 * Scaffold 读取合约 Hook
 *
 * 这是 wagmi useReadContract 的封装版本
 * 自动加载 deployedContracts.ts 和 externalContracts.ts 中的合约 ABI 和地址
 * 默认启用实时监听，每个新区块都会自动刷新数据
 *
 * 用于调用合约的只读函数（view/pure 函数）
 *
 * @param config - 配置对象
 * @param config.contractName - 合约名称
 * @param config.functionName - 要调用的函数名称
 * @param config.args - 传递给函数的参数数组
 * @param config.chainId - 可选的链 ID，用于多链交互
 * @param config.watch - 是否监听区块变化自动更新，默认为 true
 * @param config.query - react-query 的额外配置选项
 * @returns 返回 wagmi useReadContract 的返回值，包含数据、加载状态、错误等
 *
 * @example
 * ```tsx
 * // 读取合约的 greeting 函数
 * const { data: greeting } = useScaffoldReadContract({
 *   contractName: "YourContract",
 *   functionName: "greeting",
 * });
 *
 * // 带参数的读取
 * const { data: balance } = useScaffoldReadContract({
 *   contractName: "YourContract",
 *   functionName: "balanceOf",
 *   args: ["0x1234...5678"],
 * });
 *
 * // 禁用自动监听
 * const { data, refetch } = useScaffoldReadContract({
 *   contractName: "YourContract",
 *   functionName: "totalSupply",
 *   watch: false,
 * });
 * ```
 */
export const useScaffoldReadContract = <
  TContractName extends ContractName,
  TFunctionName extends ExtractAbiFunctionNames<ContractAbi<TContractName>, "pure" | "view">,
>({
  contractName,
  functionName,
  args,
  chainId,
  ...readConfig
}: UseScaffoldReadConfig<TContractName, TFunctionName>) => {
  // 获取选定的网络
  const selectedNetwork = useSelectedNetwork(chainId);
  // 获取已部署的合约信息（地址和 ABI）
  const { data: deployedContract } = useDeployedContractInfo({
    contractName,
    chainId: selectedNetwork.id as AllowedChainIds,
  });

  // 从配置中提取 query 选项和 watch 选项
  const { query: queryOptions, watch, ...readContractConfig } = readConfig;
  // 默认启用 watch 模式（实时监听）
  const defaultWatch = watch ?? false;

  // 调用 wagmi 的 useReadContract Hook
  const readContractHookRes = useReadContract({
    chainId: selectedNetwork.id,
    functionName,
    address: deployedContract?.address,
    abi: deployedContract?.abi,
    args,
    ...(readContractConfig as any),
    query: {
      // 如果参数包含 undefined，则禁用查询
      enabled: !Array.isArray(args) || !args.some(arg => arg === undefined),
      ...queryOptions,
    },
  }) as Omit<ReturnType<typeof useReadContract>, "data" | "refetch"> & {
    data: AbiFunctionReturnType<ContractAbi, TFunctionName> | undefined;
    refetch: (
      options?: RefetchOptions | undefined,
    ) => Promise<QueryObserverResult<AbiFunctionReturnType<ContractAbi, TFunctionName>, ReadContractErrorType>>;
  };

  // 获取 query client，用于手动触发数据刷新
  const queryClient = useQueryClient();
  // 监听区块号变化
  const { data: blockNumber } = useBlockNumber({
    watch: defaultWatch, // 只在 watch 模式下监听
    chainId: selectedNetwork.id,
    query: {
      enabled: defaultWatch,
    },
  });

  // 当有新区块时，刷新合约数据
  useEffect(() => {
    if (defaultWatch) {
      queryClient.invalidateQueries({ queryKey: readContractHookRes.queryKey });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockNumber]);

  return readContractHookRes;
};
