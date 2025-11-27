import { NetworkOptions } from "./NetworkOptions";
import { useDisconnect } from "wagmi";
import { ArrowLeftOnRectangleIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

/**
 * WrongNetworkDropdown - 错误网络提示下拉菜单组件
 *
 * 核心功能：
 * 1. 当用户连接到不支持的网络时显示此组件
 * 2. 显示红色 "Wrong network" 按钮提示用户网络错误
 * 3. 提供以下操作选项：
 *    - 切换到支持的网络（显示所有可用网络列表）
 *    - 断开钱包连接
 *
 * 触发条件（在父组件 RainbowKitCustomConnectButton 中判断）：
 * - chain.unsupported === true（链不被 wagmi 支持）
 * - chain.id !== targetNetwork.id（链 ID 与配置的目标网络不匹配）
 *
 * 用户体验：
 * - 红色按钮醒目提示错误状态
 * - 点击后展开下拉菜单，提供解决方案
 * - 可快速切换到正确网络或断开连接
 *
 * @example
 * // 自动在父组件中根据网络状态显示
 * {chain.unsupported ? <WrongNetworkDropdown /> : <NormalView />}
 */
export const WrongNetworkDropdown = () => {
  // 获取断开连接的方法
  const { disconnect } = useDisconnect();

  return (
    <div className="dropdown dropdown-end mr-2">
      {/* ==================== 下拉菜单触发按钮 ==================== */}
      {/* 红色错误样式按钮，显示 "Wrong network" */}
      <label tabIndex={0} className="btn btn-error btn-sm dropdown-toggle gap-1">
        <span>Wrong network</span>
        {/* 下拉箭头 */}
        <ChevronDownIcon className="h-6 w-4 ml-2 sm:ml-0" />
      </label>

      {/* ==================== 下拉菜单内容 ==================== */}
      <ul
        tabIndex={0}
        className="dropdown-content menu p-2 mt-1 shadow-center shadow-accent bg-base-200 rounded-box gap-1"
      >
        {/* 网络切换选项列表（显示所有可用网络） */}
        <NetworkOptions />

        {/* 断开连接选项 */}
        <li>
          <button
            className="menu-item text-error btn-sm rounded-xl! flex gap-3 py-3"
            type="button"
            onClick={() => disconnect()}
          >
            <ArrowLeftOnRectangleIcon className="h-6 w-4 ml-2 sm:ml-0" />
            <span>Disconnect</span>
          </button>
        </li>
      </ul>
    </div>
  );
};
