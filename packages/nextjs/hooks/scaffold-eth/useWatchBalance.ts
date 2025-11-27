import { useEffect } from "react";
import { useTargetNetwork } from "./useTargetNetwork";
import { useQueryClient } from "@tanstack/react-query";
import { UseBalanceParameters, useBalance, useBlockNumber } from "wagmi";

/**
 * 监听余额变化 Hook
 *
 * 这是 wagmi useBalance 的封装版本
 * 会在每个新区块产生时自动更新余额数据
 *
 * 用于实时跟踪地址的 ETH 或 ERC20 代币余额
 *
 * @param useBalanceParameters - wagmi useBalance 的参数
 * @param useBalanceParameters.address - 要查询余额的地址
 * @param useBalanceParameters.token - 可选，ERC20 代币地址。如果不提供，查询 ETH 余额
 * @param useBalanceParameters.chainId - 可选，指定链 ID
 * @returns 返回 wagmi useBalance 的返回值（不包括 queryKey）
 *
 * @example
 * ```tsx
 * import { useAccount } from "wagmi";
 * import { useWatchBalance } from "~~/hooks/scaffold-eth";
 *
 * function BalanceDisplay() {
 *   const { address } = useAccount();
 *
 *   // 查询 ETH 余额
 *   const { data: balance, isLoading } = useWatchBalance({
 *     address: address,
 *   });
 *
 *   // 查询 ERC20 代币余额
 *   const { data: tokenBalance } = useWatchBalance({
 *     address: address,
 *     token: "0x1234...5678", // 代币合约地址
 *   });
 *
 *   if (isLoading) return <div>加载中...</div>;
 *
 *   return (
 *     <div>
 *       <p>ETH 余额: {balance?.formatted} {balance?.symbol}</p>
 *       <p>代币余额: {tokenBalance?.formatted} {tokenBalance?.symbol}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export const useWatchBalance = (useBalanceParameters: UseBalanceParameters) => {
  // 获取目标网络
  const { targetNetwork } = useTargetNetwork();
  // 获取 query client，用于刷新查询数据
  const queryClient = useQueryClient();
  // 监听区块号变化，每个新区块都会触发更新
  const { data: blockNumber } = useBlockNumber({ watch: true, chainId: targetNetwork.id });
  // 调用 wagmi 的 useBalance Hook
  const { queryKey, ...restUseBalanceReturn } = useBalance(useBalanceParameters);

  // 当有新区块时，刷新余额数据
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockNumber]);

  return restUseBalanceReturn;
};
