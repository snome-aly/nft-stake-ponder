import { useTheme } from "next-themes";
import { useAccount, useSwitchChain } from "wagmi";
import { ArrowsRightLeftIcon } from "@heroicons/react/24/solid";
import { getNetworkColor } from "~~/hooks/scaffold-eth";
import { getTargetNetworks } from "~~/utils/scaffold-eth";

// 获取所有允许的目标网络列表（来自 scaffold.config.ts）
const allowedNetworks = getTargetNetworks();

/**
 * NetworkOptions 组件的 Props 类型定义
 */
type NetworkOptionsProps = {
  hidden?: boolean; // 是否隐藏整个网络选项列表
};

/**
 * NetworkOptions - 网络切换选项列表组件
 *
 * 核心功能：
 * 1. 显示所有可切换的网络选项（排除当前网络）
 * 2. 点击网络名称即可切换到该网络
 * 3. 网络名称使用对应的主题色高亮显示
 * 4. 支持响应式主题（自动适配深色/浅色模式）
 *
 * 使用场景：
 * - 在 AddressInfoDropdown 中作为子菜单
 * - 在 WrongNetworkDropdown 中提供网络切换
 *
 * @example
 * <NetworkOptions hidden={!showNetworkOptions} />
 */
export const NetworkOptions = ({ hidden = false }: NetworkOptionsProps) => {
  // ==================== Hooks ====================
  const { switchChain } = useSwitchChain(); // 切换链的方法
  const { chain } = useAccount(); // 当前连接的链
  const { resolvedTheme } = useTheme(); // 当前主题（light/dark）
  const isDarkMode = resolvedTheme === "dark";

  return (
    <>
      {/* 过滤掉当前网络，仅显示其他可切换的网络 */}
      {allowedNetworks
        .filter(allowedNetwork => allowedNetwork.id !== chain?.id)
        .map(allowedNetwork => (
          <li key={allowedNetwork.id} className={hidden ? "hidden" : ""}>
            <button
              className="menu-item btn-sm rounded-xl! flex gap-3 py-3 whitespace-nowrap"
              type="button"
              onClick={() => {
                // 调用 wagmi 的 switchChain 方法切换网络
                switchChain?.({ chainId: allowedNetwork.id });
              }}
            >
              {/* 左侧图标 */}
              <ArrowsRightLeftIcon className="h-6 w-4 ml-2 sm:ml-0" />

              {/* 文本："Switch to <网络名称>" */}
              <span>
                Switch to {/* 网络名称使用对应的主题色 */}
                <span
                  style={{
                    color: getNetworkColor(allowedNetwork, isDarkMode),
                  }}
                >
                  {allowedNetwork.name}
                </span>
              </span>
            </button>
          </li>
        ))}
    </>
  );
};
