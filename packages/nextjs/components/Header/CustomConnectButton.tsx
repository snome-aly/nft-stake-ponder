"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useBalance, useAccount } from "wagmi";

/**
 * 格式化余额显示
 * 避免显示科学计数法（如 1e-14 ETH）
 */
const formatBalance = (balance: string | undefined): string => {
  if (!balance) return "0";
  const num = parseFloat(balance);
  if (num === 0) return "0";
  if (num < 0.0001) return "< 0.0001";
  if (num < 1) return num.toFixed(4);
  if (num < 10) return num.toFixed(3);
  return num.toFixed(2);
};

/**
 * 自定义钱包连接按钮组件
 *
 * 功能：
 * - 解决 RainbowKit 原生按钮余额显示科学计数法的问题
 * - 集成 RainbowKit 的网络切换功能（openChainModal）
 * - 显示格式化后的余额
 * - 提供账户管理功能（openAccountModal）
 *
 * 桌面端显示（横向排列）：
 * - 网络选择按钮（带图标和名称）
 * - 余额显示卡片
 * - 账户按钮（地址缩写）
 *
 * 移动端显示（纵向排列，带标签）：
 * - 网络选择按钮（带 "Network:" 标签）
 * - 余额显示卡片（带 "Balance:" 标签）
 * - 账户按钮（带 "Account:" 标签）
 */
export const CustomConnectButton = () => {
  const { address } = useAccount();

  // 使用 wagmi 的 useBalance hook 获取余额
  // React Query 会自动管理缓存和更新
  const { data: balanceData } = useBalance({
    address: address,
    query: {
      enabled: !!address,
    },
  });

  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {(() => {
              // 未连接状态
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    Connect Wallet
                  </button>
                );
              }

              // 不支持的网络
              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    Wrong network
                  </button>
                );
              }

              // 已连接状态
              return (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                  {/* 网络选择按钮 - 集成 RainbowKit 的网络切换 */}
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="flex items-center justify-between sm:justify-start space-x-2 px-3 py-2 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 hover:border-gray-600 rounded-lg transition-all duration-200"
                  >
                    <div className="flex items-center space-x-2">
                      {chain.hasIcon && (
                        <div className="w-5 h-5">
                          {chain.iconUrl && (
                            <img
                              alt={chain.name ?? "Chain icon"}
                              src={chain.iconUrl}
                              className="w-5 h-5 rounded-full"
                            />
                          )}
                        </div>
                      )}
                      <span className="text-white text-sm font-medium">{chain.name}</span>
                    </div>
                    <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                  </button>

                  {/* 余额显示 */}
                  <div className="flex items-center justify-between sm:justify-start space-x-2 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg">
                    <span className="text-gray-400 text-sm sm:hidden">Balance:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-medium">
                        {balanceData ? formatBalance(
                          (Number(balanceData.value) / Math.pow(10, balanceData.decimals)).toString()
                        ) : "0"}
                      </span>
                      <span className="text-gray-400 text-sm">{balanceData?.symbol || "ETH"}</span>
                    </div>
                  </div>

                  {/* 账户按钮 */}
                  <button
                    onClick={openAccountModal}
                    type="button"
                    className="flex items-center justify-between sm:justify-start space-x-2 px-3 py-2 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 hover:border-gray-600 rounded-lg transition-all duration-200"
                  >
                    <span className="text-gray-400 text-sm sm:hidden">Account:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-medium">{account.displayName}</span>
                      <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                    </div>
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};
