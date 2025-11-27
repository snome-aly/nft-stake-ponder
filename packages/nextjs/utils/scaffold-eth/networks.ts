/**
 * ============================================
 * 网络配置和工具函数
 * ============================================
 *
 * 📌 核心功能：
 * 1. 定义链属性类型（颜色、原生代币地址等）
 * 2. 提供 RPC 端点映射（Alchemy/Infura 格式）
 * 3. 生成区块浏览器链接
 * 4. 管理目标网络配置
 *
 * 🎯 主要用途：
 * - 为不同链配置 UI 主题颜色
 * - 获取 Alchemy RPC URL
 * - 生成 Etherscan/Blockscout 等浏览器链接
 * - 统一管理支持的网络
 */
import * as chains from "viem/chains";
import scaffoldConfig from "~~/scaffold.config";

/**
 * 链属性扩展
 * 为标准的 Chain 对象添加额外的 UI 和配置属性
 */
type ChainAttributes = {
  /**
   * 链的主题颜色
   * - 单一颜色：string（所有主题使用同一颜色）
   * - 双色数组：[浅色主题颜色, 深色主题颜色]
   *
   * 示例：
   * - color: "#ff8b9e"  // 主网使用粉色
   * - color: ["#5f4bb6", "#87ff65"]  // Sepolia 浅色用紫色，深色用绿色
   */
  color: string | [string, string];

  /**
   * 原生代币的主网代币地址（可选）
   * 用于获取非 ETH 原生代币的价格
   *
   * 示例：
   * - Polygon 的 MATIC 代币地址: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0"
   */
  nativeCurrencyTokenAddress?: string;
};

/**
 * 带额外属性的链类型
 * 合并 viem 的 Chain 类型和自定义的 ChainAttributes
 */
export type ChainWithAttributes = chains.Chain & Partial<ChainAttributes>;

/**
 * 允许的链 ID 类型
 * 从 scaffold.config.ts 的 targetNetworks 配置中提取
 * 确保类型安全，只允许配置的链 ID
 */
export type AllowedChainIds = (typeof scaffoldConfig.targetNetworks)[number]["id"];

/**
 * RPC 链名称映射
 * 键：chainId
 * 值：Alchemy/Infura 格式的链名称
 *
 * 📌 用途：
 * - 构建 Alchemy RPC URL
 * - 构建 Infura RPC URL
 *
 * 💡 格式说明：
 * - 主网：eth-mainnet
 * - 测试网：eth-sepolia, opt-sepolia 等
 * - L2 主网：opt-mainnet, arb-mainnet, base-mainnet 等
 */
export const RPC_CHAIN_NAMES: Record<number, string> = {
  [chains.mainnet.id]: "eth-mainnet", // 以太坊主网
  [chains.goerli.id]: "eth-goerli", // Goerli 测试网（已废弃）
  [chains.sepolia.id]: "eth-sepolia", // Sepolia 测试网
  [chains.optimism.id]: "opt-mainnet", // Optimism 主网
  [chains.optimismGoerli.id]: "opt-goerli", // Optimism Goerli 测试网
  [chains.optimismSepolia.id]: "opt-sepolia", // Optimism Sepolia 测试网
  [chains.arbitrum.id]: "arb-mainnet", // Arbitrum 主网
  [chains.arbitrumGoerli.id]: "arb-goerli", // Arbitrum Goerli 测试网
  [chains.arbitrumSepolia.id]: "arb-sepolia", // Arbitrum Sepolia 测试网
  [chains.polygon.id]: "polygon-mainnet", // Polygon 主网
  [chains.polygonMumbai.id]: "polygon-mumbai", // Polygon Mumbai 测试网（已废弃）
  [chains.polygonAmoy.id]: "polygon-amoy", // Polygon Amoy 测试网
  [chains.astar.id]: "astar-mainnet", // Astar 主网
  [chains.polygonZkEvm.id]: "polygonzkevm-mainnet", // Polygon zkEVM 主网
  [chains.polygonZkEvmTestnet.id]: "polygonzkevm-testnet", // Polygon zkEVM 测试网
  [chains.base.id]: "base-mainnet", // Base 主网
  [chains.baseGoerli.id]: "base-goerli", // Base Goerli 测试网
  [chains.baseSepolia.id]: "base-sepolia", // Base Sepolia 测试网
  [chains.celo.id]: "celo-mainnet", // Celo 主网
  [chains.celoSepolia.id]: "celo-sepolia", // Celo Sepolia 测试网
};

/**
 * 获取 Alchemy HTTP RPC URL
 *
 * @param chainId - 链 ID
 * @returns Alchemy RPC URL，如果不支持则返回 undefined
 *
 * 📌 前置条件：
 * - scaffold.config.ts 中配置了 alchemyApiKey
 * - 链 ID 在 RPC_CHAIN_NAMES 中有映射
 *
 * 💡 URL 格式：
 * https://{chain-name}.g.alchemy.com/v2/{api-key}
 *
 * 示例：
 * ```typescript
 * getAlchemyHttpUrl(1)  // 主网
 * // => "https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY"
 * ```
 */
export const getAlchemyHttpUrl = (chainId: number) => {
  return scaffoldConfig.alchemyApiKey && RPC_CHAIN_NAMES[chainId]
    ? `https://${RPC_CHAIN_NAMES[chainId]}.g.alchemy.com/v2/${scaffoldConfig.alchemyApiKey}`
    : undefined;
};

/**
 * 网络额外数据配置
 * 为每个支持的链定义 UI 颜色和代币地址
 *
 * 📌 配置说明：
 * - color: UI 主题颜色（单色或双色）
 * - nativeCurrencyTokenAddress: 用于获取价格的主网代币地址
 */
export const NETWORKS_EXTRA_DATA: Record<string, ChainAttributes> = {
  // 本地开发链
  [chains.hardhat.id]: {
    color: "#b8af0c", // 黄褐色
  },

  // 以太坊主网
  [chains.mainnet.id]: {
    color: "#ff8b9e", // 粉色
  },

  // Sepolia 测试网
  [chains.sepolia.id]: {
    color: ["#5f4bb6", "#87ff65"], // 浅色紫色，深色绿色
  },

  // Gnosis Chain
  [chains.gnosis.id]: {
    color: "#48a9a6", // 蓝绿色
  },

  // Polygon 主网
  [chains.polygon.id]: {
    color: "#2bbdf7", // 亮蓝色
    nativeCurrencyTokenAddress: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0", // MATIC 在主网的地址
  },

  // Polygon Mumbai 测试网
  [chains.polygonMumbai.id]: {
    color: "#92D9FA", // 浅蓝色
    nativeCurrencyTokenAddress: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0", // MATIC 在主网的地址
  },

  // Optimism Sepolia 测试网
  [chains.optimismSepolia.id]: {
    color: "#f01a37", // 红色
  },

  // Optimism 主网
  [chains.optimism.id]: {
    color: "#f01a37", // 红色
  },

  // Arbitrum Sepolia 测试网
  [chains.arbitrumSepolia.id]: {
    color: "#28a0f0", // 蓝色
  },

  // Arbitrum 主网
  [chains.arbitrum.id]: {
    color: "#28a0f0", // 蓝色
  },

  // Fantom 主网
  [chains.fantom.id]: {
    color: "#1969ff", // 深蓝色
  },

  // Fantom 测试网
  [chains.fantomTestnet.id]: {
    color: "#1969ff", // 深蓝色
  },

  // Scroll Sepolia 测试网
  [chains.scrollSepolia.id]: {
    color: "#fbebd4", // 米黄色
  },

  // Celo 主网
  [chains.celo.id]: {
    color: "#FCFF52", // 黄色
  },

  // Celo Sepolia 测试网
  [chains.celoSepolia.id]: {
    color: "#476520", // 橄榄绿
  },
};

/**
 * 获取交易的区块浏览器链接
 *
 * @param chainId - 链 ID
 * @param txnHash - 交易哈希
 * @returns 区块浏览器交易链接，本地链返回空字符串
 *
 * 📌 功能：
 * 1. 根据 chainId 查找对应的 Chain 对象
 * 2. 获取该链的默认区块浏览器 URL
 * 3. 拼接交易哈希生成完整链接
 *
 * 💡 示例：
 * ```typescript
 * getBlockExplorerTxLink(1, "0x123...")
 * // => "https://etherscan.io/tx/0x123..."
 *
 * getBlockExplorerTxLink(10, "0xabc...")
 * // => "https://optimistic.etherscan.io/tx/0xabc..."
 *
 * getBlockExplorerTxLink(31337, "0x456...")  // Hardhat 本地链
 * // => ""
 * ```
 *
 * ⚠️ 注意：
 * - 本地链（如 Hardhat）返回空字符串
 * - 如果链未配置区块浏览器，返回空字符串
 */
export function getBlockExplorerTxLink(chainId: number, txnHash: string) {
  // 获取所有链的名称
  const chainNames = Object.keys(chains);

  // 查找匹配 chainId 的链
  const targetChainArr = chainNames.filter(chainName => {
    const wagmiChain = chains[chainName as keyof typeof chains];
    return wagmiChain.id === chainId;
  });

  // 如果没找到匹配的链，返回空字符串
  if (targetChainArr.length === 0) {
    return "";
  }

  // 获取目标链
  const targetChain = targetChainArr[0] as keyof typeof chains;

  // 获取区块浏览器 URL
  const blockExplorerTxURL = chains[targetChain]?.blockExplorers?.default?.url;

  // 如果没有配置区块浏览器，返回空字符串
  if (!blockExplorerTxURL) {
    return "";
  }

  // 返回完整的交易链接
  return `${blockExplorerTxURL}/tx/${txnHash}`;
}

/**
 * 获取地址的区块浏览器链接
 *
 * @param network - 链对象
 * @param address - 以太坊地址
 * @returns 区块浏览器地址链接
 *
 * 📌 功能：
 * 1. Hardhat 本地链：返回内置区块浏览器路径
 * 2. 有配置浏览器的链：使用配置的浏览器 URL
 * 3. 无配置浏览器的链：默认使用 Etherscan
 *
 * 💡 示例：
 * ```typescript
 * // 主网地址
 * getBlockExplorerAddressLink(mainnet, "0x123...")
 * // => "https://etherscan.io/address/0x123..."
 *
 * // Hardhat 本地链
 * getBlockExplorerAddressLink(hardhat, "0xabc...")
 * // => "/blockexplorer/address/0xabc..."
 *
 * // Optimism 主网
 * getBlockExplorerAddressLink(optimism, "0x456...")
 * // => "https://optimistic.etherscan.io/address/0x456..."
 * ```
 *
 * ⚠️ 注意：
 * - Hardhat 本地链使用内置的区块浏览器（/blockexplorer）
 * - 其他链默认回退到 Etherscan（兼容 EVM 链）
 */
export function getBlockExplorerAddressLink(network: chains.Chain, address: string) {
  const blockExplorerBaseURL = network.blockExplorers?.default?.url;

  // Hardhat 本地链：使用内置浏览器
  if (network.id === chains.hardhat.id) {
    return `/blockexplorer/address/${address}`;
  }

  // 无配置浏览器：默认使用 Etherscan
  if (!blockExplorerBaseURL) {
    return `https://etherscan.io/address/${address}`;
  }

  // 使用配置的浏览器
  return `${blockExplorerBaseURL}/address/${address}`;
}

/**
 * 获取目标网络列表（带额外元数据）
 *
 * @returns 目标网络数组，包含链的基本信息和额外属性（颜色、代币地址等）
 *
 * 📌 功能：
 * 将 scaffold.config.ts 中配置的 targetNetworks 与 NETWORKS_EXTRA_DATA 合并
 *
 * 💡 使用场景：
 * ```typescript
 * const networks = getTargetNetworks();
 * // networks 包含完整的链信息：id, name, rpcUrls, blockExplorers, color, nativeCurrencyTokenAddress 等
 *
 * networks.forEach(network => {
 *   console.log(`${network.name}: ${network.color}`);
 * });
 * ```
 *
 * 🔧 合并逻辑：
 * ```typescript
 * {
 *   ...targetNetwork,  // viem 的 Chain 对象（id, name, rpcUrls 等）
 *   ...NETWORKS_EXTRA_DATA[targetNetwork.id],  // 额外属性（color, nativeCurrencyTokenAddress）
 * }
 * ```
 */
export function getTargetNetworks(): ChainWithAttributes[] {
  return scaffoldConfig.targetNetworks.map(targetNetwork => ({
    ...targetNetwork,
    ...NETWORKS_EXTRA_DATA[targetNetwork.id],
  }));
}
