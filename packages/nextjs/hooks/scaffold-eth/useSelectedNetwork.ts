import scaffoldConfig from "~~/scaffold.config";
import { useGlobalState } from "~~/services/store/store";
import { AllowedChainIds } from "~~/utils/scaffold-eth";
import { ChainWithAttributes, NETWORKS_EXTRA_DATA } from "~~/utils/scaffold-eth/networks";

/**
 * 选定网络 Hook
 *
 * 该 Hook 根据指定的 chainId 获取对应的网络配置
 * 如果没有提供 chainId 或找不到匹配的网络，则返回全局目标网络
 *
 * 与 useTargetNetwork 的区别：
 * - useTargetNetwork：返回当前钱包连接的网络或默认网络
 * - useSelectedNetwork：根据指定的 chainId 返回对应网络，用于多链交互
 *
 * @param chainId - 可选的链 ID
 * @returns {ChainWithAttributes} 返回匹配的网络配置或全局目标网络
 *
 * @example
 * ```tsx
 * // 获取特定链的网络配置
 * const network = useSelectedNetwork(1); // 以太坊主网
 * console.log(network.name); // "Ethereum"
 *
 * // 用于多链合约读取
 * const { data } = useScaffoldReadContract({
 *   contractName: "YourContract",
 *   functionName: "getValue",
 *   chainId: 1, // 指定在以太坊主网上读取
 * });
 *
 * // 如果不提供 chainId，返回当前目标网络
 * const currentNetwork = useSelectedNetwork();
 * ```
 */
export function useSelectedNetwork(chainId?: AllowedChainIds): ChainWithAttributes {
  // 从全局状态获取当前目标网络
  const globalTargetNetwork = useGlobalState(({ targetNetwork }) => targetNetwork);

  // 在 scaffold.config.ts 的 targetNetworks 列表中查找匹配的网络
  const targetNetwork = scaffoldConfig.targetNetworks.find(targetNetwork => targetNetwork.id === chainId);

  // 如果找到匹配的网络，返回合并了额外数据的网络配置
  if (targetNetwork) {
    return { ...targetNetwork, ...NETWORKS_EXTRA_DATA[targetNetwork.id] };
  }

  // 如果没有找到，返回全局目标网络
  return globalTargetNetwork;
}
