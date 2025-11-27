import { useCallback, useEffect } from "react";
import { useTargetNetwork } from "./useTargetNetwork";
import { useInterval } from "usehooks-ts";
import scaffoldConfig from "~~/scaffold.config";
import { useGlobalState } from "~~/services/store/store";
import { fetchPriceFromUniswap } from "~~/utils/scaffold-eth";

/**
 * 是否启用价格轮询
 * 设为 false 可禁用定期价格更新，减少 API 调用
 */
const enablePolling = false;

/**
 * 初始化原生代币价格 Hook
 *
 * 该 Hook 用于从 Uniswap 获取原生代币（ETH 或其他链的原生币）的 USD 价格
 * 会在组件挂载时获取一次价格，并可选地定期轮询更新
 *
 * 价格数据会存储在全局状态中，供整个应用使用
 * 主要用于在 UI 中显示 ETH ⇄ USD 的转换
 *
 * @example
 * ```tsx
 * // 通常在应用的根组件中调用
 * function App() {
 *   useInitializeNativeCurrencyPrice();
 *
 *   return <YourApp />;
 * }
 *
 * // 在其他组件中使用价格数据
 * function PriceDisplay() {
 *   const price = useGlobalState(state => state.nativeCurrency.price);
 *   const isFetching = useGlobalState(state => state.nativeCurrency.isFetching);
 *
 *   if (isFetching) return <div>获取价格中...</div>;
 *
 *   return <div>当前 ETH 价格: ${price}</div>;
 * }
 * ```
 */
export const useInitializeNativeCurrencyPrice = () => {
  // 从全局状态获取设置价格的函数
  const setNativeCurrencyPrice = useGlobalState(state => state.setNativeCurrencyPrice);
  // 从全局状态获取设置获取状态的函数
  const setIsNativeCurrencyFetching = useGlobalState(state => state.setIsNativeCurrencyFetching);
  // 获取目标网络
  const { targetNetwork } = useTargetNetwork();

  /**
   * 从 Uniswap 获取价格
   * 使用 useCallback 优化，避免不必要的函数重新创建
   */
  const fetchPrice = useCallback(async () => {
    // 开始获取，设置加载状态
    setIsNativeCurrencyFetching(true);
    // 调用 Uniswap SDK 获取价格
    const price = await fetchPriceFromUniswap(targetNetwork);
    // 将价格保存到全局状态
    setNativeCurrencyPrice(price);
    // 获取完成，取消加载状态
    setIsNativeCurrencyFetching(false);
  }, [setIsNativeCurrencyFetching, setNativeCurrencyPrice, targetNetwork]);

  // 在组件挂载时获取一次价格
  useEffect(() => {
    fetchPrice();
  }, [fetchPrice]);

  // 定期轮询获取价格（如果启用）
  // pollingInterval 在 scaffold.config.ts 中配置
  useInterval(fetchPrice, enablePolling ? scaffoldConfig.pollingInterval : null);
};
