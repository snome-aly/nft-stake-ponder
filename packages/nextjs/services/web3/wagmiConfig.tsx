import { wagmiConnectors } from "./wagmiConnectors";
import { Chain, createClient, fallback, http } from "viem";
import { hardhat, mainnet } from "viem/chains";
import { cookieStorage, createConfig, createStorage } from "wagmi";
import scaffoldConfig, { DEFAULT_ALCHEMY_API_KEY, ScaffoldConfig } from "~~/scaffold.config";
import { getAlchemyHttpUrl } from "~~/utils/scaffold-eth";

/**
 * Wagmi 配置文件
 *
 * 该文件创建了 Wagmi 的主配置对象，是整个 Web3 功能的核心
 * Wagmi 是一个 React Hooks 库，用于与以太坊进行交互
 *
 * 配置包括：
 * - 支持的区块链网络
 * - 钱包连接器
 * - RPC 端点配置
 * - 服务端渲染（SSR）支持
 */

// 从配置文件中获取目标网络
const { targetNetworks } = scaffoldConfig;

/**
 * 启用的区块链网络列表
 *
 * 为了支持 ENS 解析、ETH 价格查询等功能，我们总是需要启用以太坊主网
 * 即使应用主要在其他网络（如测试网或 L2）上运行
 *
 * 逻辑：
 * - 如果 targetNetworks 中已经包含主网（chain id = 1），则直接使用
 * - 如果不包含，则自动添加主网到列表中
 */
export const enabledChains = targetNetworks.find((network: Chain) => network.id === 1)
  ? targetNetworks
  : ([...targetNetworks, mainnet] as const);

/**
 * Wagmi 主配置对象
 *
 * 这是应用的核心 Web3 配置，提供给 WagmiProvider 使用
 * 所有使用 wagmi hooks 的组件都依赖这个配置
 *
 * @example
 * ```tsx
 * // 在 _app.tsx 或 RootLayout.tsx 中使用
 * import { WagmiProvider } from "wagmi";
 * import { wagmiConfig } from "~~/services/web3/wagmiConfig";
 *
 * function App({ children }) {
 *   return (
 *     <WagmiProvider config={wagmiConfig}>
 *       {children}
 *     </WagmiProvider>
 *   );
 * }
 * ```
 */
export const wagmiConfig = createConfig({
  /**
   * 支持的区块链网络列表
   * 包含用户在 scaffold.config.ts 中配置的网络 + 以太坊主网
   */
  chains: enabledChains,

  /**
   * 钱包连接器
   * 从 wagmiConnectors.tsx 导入，包含所有支持的钱包
   */
  connectors: wagmiConnectors(),

  /**
   * 启用服务端渲染（SSR）支持
   * 对于 Next.js 应用这是必需的
   */
  ssr: true,

  /**
   * 使用 cookie 存储连接状态
   * 这样服务端也能读取到连接状态，避免 hydration 闪烁
   */
  storage: createStorage({
    storage: cookieStorage,
  }),

  /**
   * 客户端配置函数
   *
   * 为每个链创建独立的 viem 客户端
   * 配置 RPC 端点和回退策略
   *
   * @param chain - 当前要配置的区块链网络
   * @returns 返回配置好的 viem 客户端
   */
  client: ({ chain }) => {
    /**
     * RPC 回退列表
     *
     * 使用 fallback 策略确保连接的稳定性
     * 如果第一个 RPC 失败，会自动尝试下一个
     *
     * 默认使用公共 RPC（http()）
     */
    let rpcFallbacks = [http()];

    /**
     * 检查是否有自定义 RPC 覆盖配置
     *
     * 用户可以在 scaffold.config.ts 中为特定链配置自定义 RPC URL
     * 例如：使用自己的节点或第三方 RPC 服务
     */
    const rpcOverrideUrl = (scaffoldConfig.rpcOverrides as ScaffoldConfig["rpcOverrides"])?.[chain.id];

    if (rpcOverrideUrl) {
      /**
       * 使用自定义 RPC
       * 优先使用自定义 RPC，公共 RPC 作为备用
       */
      rpcFallbacks = [http(rpcOverrideUrl), http()];
    } else {
      /**
       * 尝试使用 Alchemy RPC
       *
       * Alchemy 是一个可靠的区块链 API 服务
       * 提供比公共 RPC 更稳定和快速的连接
       */
      const alchemyHttpUrl = getAlchemyHttpUrl(chain.id);

      if (alchemyHttpUrl) {
        /**
         * 检查是否使用默认的 Alchemy API Key
         *
         * 如果使用默认 key（示例 key）：
         *   - 先尝试公共 RPC（避免达到默认 key 的限制）
         *   - 再使用 Alchemy 作为备用
         *
         * 如果使用自己的 Alchemy key：
         *   - 优先使用 Alchemy（性能更好）
         *   - 公共 RPC 作为备用
         */
        const isUsingDefaultKey = scaffoldConfig.alchemyApiKey === DEFAULT_ALCHEMY_API_KEY;
        rpcFallbacks = isUsingDefaultKey ? [http(), http(alchemyHttpUrl)] : [http(alchemyHttpUrl), http()];
      }
    }

    /**
     * 创建并返回 viem 客户端
     */
    return createClient({
      chain, // 区块链网络配置
      transport: fallback(rpcFallbacks), // 使用 fallback 传输层，支持 RPC 回退

      /**
       * 轮询间隔配置
       *
       * 只对非 Hardhat 网络设置轮询间隔
       * Hardhat 本地网络使用默认的即时更新机制
       *
       * pollingInterval：客户端检查新区块的频率（毫秒）
       * 在 scaffold.config.ts 中配置
       */
      ...(chain.id !== (hardhat as Chain).id ? { pollingInterval: scaffoldConfig.pollingInterval } : {}),
    });
  },
});
