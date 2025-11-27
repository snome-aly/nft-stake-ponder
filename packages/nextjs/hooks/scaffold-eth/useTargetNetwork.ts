import { useEffect, useMemo } from "react";
import { useAccount } from "wagmi";
import scaffoldConfig from "~~/scaffold.config";
import { useGlobalState } from "~~/services/store/store";
import { ChainWithAttributes } from "~~/utils/scaffold-eth";
import { NETWORKS_EXTRA_DATA } from "~~/utils/scaffold-eth";

/**
 * 目标网络 Hook
 *
 * 该 Hook 用于获取当前连接钱包的目标网络配置
 * 如果钱包未连接，则默认使用 scaffold.config.ts 中配置的第一个网络
 *
 * 工作原理：
 * 1. 监听钱包连接的网络变化
 * 2. 如果连接的网络在 targetNetworks 列表中，则使用该网络
 * 3. 如果未连接或网络不在列表中，使用默认网络（列表中的第一个）
 *
 * @returns {Object} 返回目标网络信息
 * @returns {ChainWithAttributes} targetNetwork - 目标网络配置，包含链 ID、名称、RPC 等信息
 *
 * @example
 * ```tsx
 * const { targetNetwork } = useTargetNetwork();
 *
 * return (
 *   <div>
 *     <h3>当前网络: {targetNetwork.name}</h3>
 *     <p>链 ID: {targetNetwork.id}</p>
 *     <p>区块浏览器: {targetNetwork.blockExplorers?.default.url}</p>
 *   </div>
 * );
 * ```
 */
export function useTargetNetwork(): { targetNetwork: ChainWithAttributes } {
  // 获取当前钱包连接的链信息
  const { chain } = useAccount();
  // 从全局状态获取目标网络
  const targetNetwork = useGlobalState(({ targetNetwork }) => targetNetwork);
  // 获取设置目标网络的函数
  const setTargetNetwork = useGlobalState(({ setTargetNetwork }) => setTargetNetwork);

  useEffect(() => {
    // 在 scaffold.config.ts 的 targetNetworks 列表中查找与当前连接链匹配的网络
    const newSelectedNetwork = scaffoldConfig.targetNetworks.find(targetNetwork => targetNetwork.id === chain?.id);

    // 如果找到匹配的网络且与当前目标网络不同，则更新目标网络
    if (newSelectedNetwork && newSelectedNetwork.id !== targetNetwork.id) {
      // 合并网络基本信息和额外数据（如颜色、图标等）
      setTargetNetwork({ ...newSelectedNetwork, ...NETWORKS_EXTRA_DATA[newSelectedNetwork.id] });
    }
  }, [chain?.id, setTargetNetwork, targetNetwork.id]);

  // 使用 useMemo 优化性能，避免不必要的重新渲染
  return useMemo(() => ({ targetNetwork }), [targetNetwork]);
}
