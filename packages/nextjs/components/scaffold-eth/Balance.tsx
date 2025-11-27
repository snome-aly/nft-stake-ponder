"use client";

import { Address, formatEther } from "viem";
import { useDisplayUsdMode } from "~~/hooks/scaffold-eth/useDisplayUsdMode";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { useWatchBalance } from "~~/hooks/scaffold-eth/useWatchBalance";
import { useGlobalState } from "~~/services/store/store";

/**
 * Balance 组件的 Props 类型
 */
type BalanceProps = {
  address?: Address; // 要查询余额的以太坊地址
  className?: string; // 自定义 CSS 类名
  usdMode?: boolean; // 是否默认显示 USD 模式
};

/**
 * Balance 余额显示组件
 *
 * 核心功能：
 * 1. 实时显示指定地址的原生代币余额（如 ETH）
 * 2. 支持 ETH/USD 切换显示（点击切换）
 * 3. 自动从 Zustand store 获取 USD 价格
 * 4. 实时监听余额变化（通过 useWatchBalance）
 * 5. 加载和错误状态的优雅处理
 *
 * 显示模式：
 * - ETH 模式：显示 "1.2345 ETH"
 * - USD 模式：显示 "$2,468.90"
 *
 * 状态：
 * - 加载中：显示骨架屏动画
 * - 错误：显示 "Error" 提示
 * - 正常：显示余额（可点击切换 ETH/USD）
 *
 * @example
 * <Balance address="0x1234..." usdMode={false} />
 */
export const Balance = ({ address, className = "", usdMode }: BalanceProps) => {
  // 获取当前目标网络信息（用于显示代币符号，如 ETH、MATIC）
  const { targetNetwork } = useTargetNetwork();

  // 从全局 store 获取原生代币的 USD 价格和加载状态
  // 使用 selector 模式优化性能：仅订阅 nativeCurrency 部分
  const nativeCurrencyPrice = useGlobalState(state => state.nativeCurrency.price);
  const isNativeCurrencyPriceFetching = useGlobalState(state => state.nativeCurrency.isFetching);

  // 监听地址余额变化（实时更新）
  const {
    data: balance, // 余额数据（BigInt 格式）
    isError, // 是否发生错误
    isLoading, // 是否正在加载
  } = useWatchBalance({
    address,
  });

  // 管理 ETH/USD 显示模式的切换
  const { displayUsdMode, toggleDisplayUsdMode } = useDisplayUsdMode({ defaultUsdMode: usdMode });

  // ==================== 加载状态 ====================
  // 满足以下任一条件显示骨架屏：
  // 1. 地址不存在
  // 2. 余额正在加载
  // 3. 余额为 null
  // 4. USD 价格正在加载且价格为 0（避免显示错误的 $0.00）
  if (!address || isLoading || balance === null || (isNativeCurrencyPriceFetching && nativeCurrencyPrice === 0)) {
    return (
      <div className="animate-pulse flex space-x-4">
        {/* 圆形占位符 */}
        <div className="rounded-md bg-slate-300 h-6 w-6"></div>
        {/* 文本占位符 */}
        <div className="flex items-center space-y-6">
          <div className="h-2 w-28 bg-slate-300 rounded-sm"></div>
        </div>
      </div>
    );
  }

  // ==================== 错误状态 ====================
  if (isError) {
    return (
      <div className="border-2 border-base-content/30 rounded-md px-2 flex flex-col items-center max-w-fit cursor-pointer">
        <div className="text-warning">Error</div>
      </div>
    );
  }

  // ==================== 格式化余额 ====================
  // 将 Wei (BigInt) 转换为 Ether (Number)
  // 示例：1000000000000000000n -> 1.0
  const formattedBalance = balance ? Number(formatEther(balance.value)) : 0;

  return (
    // 点击按钮切换 ETH/USD 显示模式
    <button
      className={`btn btn-sm btn-ghost flex flex-col font-normal items-center hover:bg-transparent ${className}`}
      onClick={toggleDisplayUsdMode}
      type="button"
    >
      <div className="w-full flex items-center justify-center">
        {displayUsdMode ? (
          // USD 模式：显示 "$123.45"
          <>
            <span className="text-[0.8em] font-bold mr-1">$</span>
            <span>{(formattedBalance * nativeCurrencyPrice).toFixed(2)}</span>
          </>
        ) : (
          // ETH 模式：显示 "1.2345 ETH"
          <>
            <span>{formattedBalance.toFixed(4)}</span>
            <span className="text-[0.8em] font-bold ml-1">{targetNetwork.nativeCurrency.symbol}</span>
          </>
        )}
      </div>
    </button>
  );
};
