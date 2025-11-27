import { useTheme } from "next-themes";
import { useSelectedNetwork } from "~~/hooks/scaffold-eth";
import { AllowedChainIds, ChainWithAttributes } from "~~/utils/scaffold-eth";

/**
 * 默认网络颜色
 * [亮色模式颜色, 暗色模式颜色]
 */
export const DEFAULT_NETWORK_COLOR: [string, string] = ["#666666", "#bbbbbb"];

/**
 * 获取网络颜色
 *
 * 根据当前主题（亮色/暗色）返回对应的网络颜色
 *
 * @param network - 网络配置对象
 * @param isDarkMode - 是否为暗色模式
 * @returns 返回对应主题的颜色值（十六进制字符串）
 */
export function getNetworkColor(network: ChainWithAttributes, isDarkMode: boolean) {
  // 获取网络的颜色配置，如果没有则使用默认颜色
  const colorConfig = network.color ?? DEFAULT_NETWORK_COLOR;
  // 如果颜色配置是数组，根据主题选择对应颜色；否则直接返回单一颜色
  return Array.isArray(colorConfig) ? (isDarkMode ? colorConfig[1] : colorConfig[0]) : colorConfig;
}

/**
 * 网络颜色 Hook
 *
 * 该 Hook 用于获取指定网络在当前主题下的颜色
 * 可用于在 UI 中显示不同网络的主题色（如网络徽章、边框等）
 *
 * 颜色配置在 utils/scaffold-eth/networks.ts 的 NETWORKS_EXTRA_DATA 中定义
 *
 * @param chainId - 可选的链 ID，如果不提供则使用当前目标网络
 * @returns 返回对应主题的网络颜色（十六进制字符串）
 *
 * @example
 * ```tsx
 * function NetworkBadge() {
 *   const networkColor = useNetworkColor();
 *
 *   return (
 *     <div
 *       style={{
 *         backgroundColor: networkColor,
 *         padding: "8px 16px",
 *         borderRadius: "8px",
 *       }}
 *     >
 *       当前网络
 *     </div>
 *   );
 * }
 *
 * // 获取特定网络的颜色
 * function EthereumBadge() {
 *   const ethereumColor = useNetworkColor(1); // 以太坊主网
 *
 *   return (
 *     <div style={{ color: ethereumColor }}>
 *       Ethereum
 *     </div>
 *   );
 * }
 * ```
 */
export const useNetworkColor = (chainId?: AllowedChainIds) => {
  // 获取当前主题（亮色/暗色）
  const { resolvedTheme } = useTheme();
  // 获取指定链 ID 的网络配置
  const chain = useSelectedNetwork(chainId);
  // 判断是否为暗色模式
  const isDarkMode = resolvedTheme === "dark";

  // 返回对应主题的网络颜色
  return getNetworkColor(chain, isDarkMode);
};
