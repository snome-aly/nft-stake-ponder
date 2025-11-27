import { Abi, ExtractAbiEventNames } from "abitype";
import { Log } from "viem";
import { useWatchContractEvent } from "wagmi";
import { useSelectedNetwork } from "~~/hooks/scaffold-eth";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { AllowedChainIds } from "~~/utils/scaffold-eth";
import { ContractAbi, ContractName, UseScaffoldEventConfig } from "~~/utils/scaffold-eth/contract";

/**
 * Scaffold 监听合约事件 Hook
 *
 * 这是 wagmi useWatchContractEvent 的封装版本
 * 自动加载 deployedContracts.ts 和 externalContracts.ts 中的合约 ABI 和地址
 * 用于实时监听合约事件的触发
 *
 * 与 useScaffoldEventHistory 不同：
 * - useScaffoldEventHistory：读取历史事件（已发生的事件）
 * - useScaffoldWatchContractEvent：实时监听新事件（正在发生的事件）
 *
 * @param config - 配置对象
 * @param config.contractName - 合约名称
 * @param config.eventName - 要监听的事件名称
 * @param config.chainId - 可选的链 ID，用于多链交互
 * @param config.onLogs - 事件回调函数，当事件触发时会调用此函数
 *
 * @example
 * ```tsx
 * // 监听 Transfer 事件
 * useScaffoldWatchContractEvent({
 *   contractName: "YourContract",
 *   eventName: "Transfer",
 *   onLogs: (logs) => {
 *     logs.forEach((log) => {
 *       console.log("Transfer 事件:", log.args);
 *       // log.args 包含事件参数，例如 from, to, value
 *     });
 *   },
 * });
 *
 * // 监听自定义事件
 * useScaffoldWatchContractEvent({
 *   contractName: "YourContract",
 *   eventName: "GreetingChange",
 *   onLogs: (logs) => {
 *     const latestLog = logs[0];
 *     console.log("新的问候语:", latestLog.args.newGreeting);
 *   },
 * });
 * ```
 */
export const useScaffoldWatchContractEvent = <
  TContractName extends ContractName,
  TEventName extends ExtractAbiEventNames<ContractAbi<TContractName>>,
>({
  contractName,
  eventName,
  chainId,
  onLogs,
}: UseScaffoldEventConfig<TContractName, TEventName>) => {
  // 获取选定的网络
  const selectedNetwork = useSelectedNetwork(chainId);
  // 获取已部署的合约信息（地址和 ABI）
  const { data: deployedContractData } = useDeployedContractInfo({
    contractName,
    chainId: selectedNetwork.id as AllowedChainIds,
  });

  // 调用 wagmi 的 useWatchContractEvent
  return useWatchContractEvent({
    address: deployedContractData?.address,
    abi: deployedContractData?.abi as Abi,
    chainId: selectedNetwork.id,
    // 当事件触发时调用回调函数，并将日志数据传递给用户
    onLogs: (logs: Log[]) => onLogs(logs as Parameters<typeof onLogs>[0]),
    eventName,
  });
};
