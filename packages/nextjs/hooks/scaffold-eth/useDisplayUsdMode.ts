import { useCallback, useEffect, useState } from "react";
import { useGlobalState } from "~~/services/store/store";

/**
 * USD 显示模式 Hook
 *
 * 该 Hook 用于管理金额显示模式的切换（ETH ⇄ USD）
 * 只有在成功获取到代币价格后才允许切换显示模式
 *
 * @param config - 配置对象
 * @param config.defaultUsdMode - 默认是否使用 USD 显示模式，默认为 false（显示 ETH）
 * @returns {Object} 返回显示模式状态和切换函数
 * @returns {boolean} displayUsdMode - 当前是否使用 USD 显示模式
 * @returns {Function} toggleDisplayUsdMode - 切换显示模式的函数
 *
 * @example
 * ```tsx
 * const { displayUsdMode, toggleDisplayUsdMode } = useDisplayUsdMode({ defaultUsdMode: false });
 *
 * return (
 *   <button onClick={toggleDisplayUsdMode}>
 *     当前显示: {displayUsdMode ? "USD" : "ETH"}
 *   </button>
 * );
 * ```
 */
export const useDisplayUsdMode = ({ defaultUsdMode = false }: { defaultUsdMode?: boolean }) => {
  // 从全局状态获取原生代币价格
  const nativeCurrencyPrice = useGlobalState(state => state.nativeCurrency.price);
  // 检查是否已成功获取价格（价格大于 0）
  const isPriceFetched = nativeCurrencyPrice > 0;
  // 预定义的 USD 模式：只有在价格已获取时才使用默认的 USD 模式
  const predefinedUsdMode = isPriceFetched ? Boolean(defaultUsdMode) : false;
  // 当前显示模式状态
  const [displayUsdMode, setDisplayUsdMode] = useState(predefinedUsdMode);

  // 当预定义模式变化时，更新显示模式
  useEffect(() => {
    setDisplayUsdMode(predefinedUsdMode);
  }, [predefinedUsdMode]);

  /**
   * 切换显示模式函数
   * 只有在价格已获取的情况下才允许切换
   */
  const toggleDisplayUsdMode = useCallback(() => {
    if (isPriceFetched) {
      setDisplayUsdMode(!displayUsdMode);
    }
  }, [displayUsdMode, isPriceFetched]);

  return { displayUsdMode, toggleDisplayUsdMode };
};
