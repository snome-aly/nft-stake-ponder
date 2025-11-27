import { create } from "zustand";
import scaffoldConfig from "~~/scaffold.config";
import { ChainWithAttributes, NETWORKS_EXTRA_DATA } from "~~/utils/scaffold-eth";

/**
 * 全局状态管理 Store (Zustand)
 *
 * 这是使用 Zustand 库创建的全局状态管理器
 * 可以在应用的任何地方使用 useGlobalState 来获取和设置全局状态
 *
 * 相当于一个全局的 useState，但可以跨组件共享状态
 *
 * @example
 * ```tsx
 * import { useGlobalState } from "~~/services/store/store";
 *
 * function MyComponent() {
 *   // 读取原生币价格
 *   const price = useGlobalState(state => state.nativeCurrency.price);
 *
 *   // 获取设置价格的函数
 *   const setPrice = useGlobalState(state => state.setNativeCurrencyPrice);
 *
 *   // 更新价格
 *   const updatePrice = () => {
 *     setPrice(2000);
 *   };
 *
 *   return <div>当前 ETH 价格: ${price}</div>;
 * }
 * ```
 */

/**
 * 全局状态类型定义
 */
type GlobalState = {
  // 原生代币（ETH 或其他链的原生币）状态
  nativeCurrency: {
    price: number; // 原生币的 USD 价格
    isFetching: boolean; // 是否正在获取价格
  };

  /**
   * 设置原生币价格
   * @param newNativeCurrencyPriceState - 新的价格值（USD）
   */
  setNativeCurrencyPrice: (newNativeCurrencyPriceState: number) => void;

  /**
   * 设置价格获取状态
   * @param newIsNativeCurrencyFetching - 是否正在获取价格
   */
  setIsNativeCurrencyFetching: (newIsNativeCurrencyFetching: boolean) => void;

  /**
   * 目标网络配置
   * 存储当前应用使用的目标区块链网络
   */
  targetNetwork: ChainWithAttributes;

  /**
   * 设置目标网络
   * @param newTargetNetwork - 新的目标网络配置
   */
  setTargetNetwork: (newTargetNetwork: ChainWithAttributes) => void;
};

/**
 * 全局状态 Hook
 *
 * 使用 Zustand 创建的全局状态管理器
 * 可以在任何组件中使用此 Hook 来访问和修改全局状态
 */
export const useGlobalState = create<GlobalState>(set => ({
  // 原生币状态初始值
  nativeCurrency: {
    price: 0, // 初始价格为 0
    isFetching: true, // 初始时标记为正在获取
  },

  /**
   * 设置原生币价格
   * 使用函数式更新，保持其他字段不变
   */
  setNativeCurrencyPrice: (newValue: number): void =>
    set(state => ({ nativeCurrency: { ...state.nativeCurrency, price: newValue } })),

  /**
   * 设置价格获取状态
   * 使用函数式更新，保持其他字段不变
   */
  setIsNativeCurrencyFetching: (newValue: boolean): void =>
    set(state => ({ nativeCurrency: { ...state.nativeCurrency, isFetching: newValue } })),

  /**
   * 目标网络初始值
   * 默认使用 scaffold.config.ts 中配置的第一个网络
   * 并合并额外的网络数据（如颜色、图标等）
   */
  targetNetwork: {
    ...scaffoldConfig.targetNetworks[0],
    ...NETWORKS_EXTRA_DATA[scaffoldConfig.targetNetworks[0].id],
  },

  /**
   * 设置目标网络
   * 当用户切换钱包连接到不同网络时会调用此函数
   */
  setTargetNetwork: (newTargetNetwork: ChainWithAttributes) => set(() => ({ targetNetwork: newTargetNetwork })),
}));
