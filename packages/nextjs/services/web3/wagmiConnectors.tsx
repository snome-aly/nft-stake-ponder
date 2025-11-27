import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  coinbaseWallet,
  ledgerWallet,
  metaMaskWallet,
  rainbowWallet,
  safeWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { rainbowkitBurnerWallet } from "burner-connector";
import * as chains from "viem/chains";
import scaffoldConfig from "~~/scaffold.config";

/**
 * Wagmi 钱包连接器配置
 *
 * 该文件配置了应用支持的所有钱包连接器
 * 使用 RainbowKit 库来管理钱包连接
 */

// 从配置文件中获取设置
const { onlyLocalBurnerWallet, targetNetworks } = scaffoldConfig;

/**
 * 支持的钱包列表
 *
 * 包含了常用的 Web3 钱包：
 * - MetaMask: 最流行的浏览器钱包
 * - WalletConnect: 支持移动端钱包连接
 * - Ledger: 硬件钱包
 * - Coinbase Wallet: Coinbase 官方钱包
 * - Rainbow: Rainbow 钱包
 * - Safe: Gnosis Safe 多签钱包
 * - Burner Wallet: 临时钱包（仅用于开发/测试）
 */
const wallets = [
  metaMaskWallet,
  walletConnectWallet,
  ledgerWallet,
  coinbaseWallet,
  rainbowWallet,
  safeWallet,
  /**
   * Burner Wallet 条件添加
   *
   * 只在以下情况下添加 Burner Wallet：
   * 1. 目标网络中包含非 Hardhat 网络（即有真实网络）
   * 2. 或者配置了 onlyLocalBurnerWallet 为 false
   *
   * Burner Wallet 是一个临时钱包，用于快速测试
   * 不需要安装浏览器扩展，密钥存储在浏览器本地
   * ⚠️ 警告：不要在 Burner Wallet 中存储真实资产！
   */
  ...(!targetNetworks.some(network => network.id !== (chains.hardhat as chains.Chain).id) || !onlyLocalBurnerWallet
    ? [rainbowkitBurnerWallet]
    : []),
];

/**
 * 创建 Wagmi 连接器
 *
 * 该函数创建并返回 RainbowKit 钱包连接器配置
 * 用于 Wagmi 上下文，使应用能够连接各种 Web3 钱包
 *
 * @returns 返回 RainbowKit 连接器数组，如果在服务端则返回空数组
 *
 * @example
 * ```tsx
 * // 在 wagmiConfig.tsx 中使用
 * import { wagmiConnectors } from "./wagmiConnectors";
 *
 * export const wagmiConfig = createConfig({
 *   chains: enabledChains,
 *   connectors: wagmiConnectors(),
 *   // ...其他配置
 * });
 * ```
 */
export const wagmiConnectors = () => {
  /**
   * 服务端渲染（SSR）处理
   *
   * 在服务端不创建连接器，避免 SSR 相关问题
   * window 对象只在浏览器环境中存在
   *
   * TODO: 等待 RainbowKit issue #2476 解决后更新
   * 参考：https://github.com/rainbow-me/rainbowkit/issues/2476
   */
  if (typeof window === "undefined") {
    return [];
  }

  /**
   * 创建钱包连接器
   *
   * 使用 RainbowKit 的 connectorsForWallets 函数
   * 将钱包分组显示在连接界面中
   */
  return connectorsForWallets(
    [
      {
        groupName: "Supported Wallets", // 钱包组名称，显示在 UI 中
        wallets, // 上面配置的钱包列表
      },
    ],

    {
      appName: "scaffold-eth-2", // 应用名称，显示在钱包连接界面
      projectId: scaffoldConfig.walletConnectProjectId, // WalletConnect 项目 ID（必需）
    },
  );
};
