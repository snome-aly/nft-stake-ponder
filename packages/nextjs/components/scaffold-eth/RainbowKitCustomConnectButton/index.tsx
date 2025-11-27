"use client";

// @refresh reset - 强制热更新时完全刷新组件
import { Balance } from "../Balance";
import { AddressInfoDropdown } from "./AddressInfoDropdown";
import { AddressQRCodeModal } from "./AddressQRCodeModal";
import { RevealBurnerPKModal } from "./RevealBurnerPKModal";
import { WrongNetworkDropdown } from "./WrongNetworkDropdown";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Address } from "viem";
import { useNetworkColor } from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { getBlockExplorerAddressLink } from "~~/utils/scaffold-eth";

/**
 * RainbowKitCustomConnectButton - 自定义钱包连接按钮
 *
 * 核心功能：
 * 1. 未连接时显示 "Connect Wallet" 按钮
 * 2. 连接错误网络时显示网络切换下拉菜单
 * 3. 正常连接时显示：
 *    - 账户余额
 *    - 当前网络名称（带主题色）
 *    - 地址信息下拉菜单（复制地址、二维码、区块浏览器等）
 *    - 地址二维码弹窗
 *    - Burner 钱包私钥查看弹窗（仅开发模式）
 *
 * 基于 RainbowKit 的 ConnectButton.Custom 实现，提供完全自定义的 UI
 */
export const RainbowKitCustomConnectButton = () => {
  // 获取当前网络的主题色（用于网络名称显示）
  const networkColor = useNetworkColor();
  // 获取目标网络配置
  const { targetNetwork } = useTargetNetwork();

  return (
    <ConnectButton.Custom>
      {({ account, chain, openConnectModal, mounted }) => {
        // ==================== 连接状态判断 ====================
        // mounted: 组件已挂载到 DOM
        // account: 已连接的账户信息
        // chain: 当前连接的链信息
        const connected = mounted && account && chain;

        // 生成区块浏览器地址链接
        const blockExplorerAddressLink = account
          ? getBlockExplorerAddressLink(targetNetwork, account.address)
          : undefined;

        return (
          <>
            {(() => {
              // ==================== 场景一：未连接钱包 ====================
              if (!connected) {
                return (
                  <button className="btn btn-primary btn-sm" onClick={openConnectModal} type="button">
                    Connect Wallet
                  </button>
                );
              }

              // ==================== 场景二：连接了错误的网络 ====================
              // 条件：链不支持 或 链 ID 与目标网络不匹配
              if (chain.unsupported || chain.id !== targetNetwork.id) {
                return <WrongNetworkDropdown />;
              }

              // ==================== 场景三：正常连接 ====================
              return (
                <>
                  {/* 左侧：余额与网络名称 */}
                  <div className="flex flex-col items-center mr-1">
                    {/* 显示账户余额 */}
                    <Balance address={account.address as Address} className="min-h-0 h-auto" />
                    {/* 显示网络名称，使用网络主题色 */}
                    <span className="text-xs" style={{ color: networkColor }}>
                      {chain.name}
                    </span>
                  </div>

                  {/* 地址信息下拉菜单 */}
                  <AddressInfoDropdown
                    address={account.address as Address}
                    displayName={account.displayName} // 显示名称（ENS 或短地址）
                    ensAvatar={account.ensAvatar} // ENS 头像
                    blockExplorerAddressLink={blockExplorerAddressLink}
                  />

                  {/* 地址二维码弹窗（隐藏，通过 label 触发） */}
                  <AddressQRCodeModal address={account.address as Address} modalId="qrcode-modal" />

                  {/* Burner 钱包私钥查看弹窗（仅开发模式，隐藏） */}
                  <RevealBurnerPKModal />
                </>
              );
            })()}
          </>
        );
      }}
    </ConnectButton.Custom>
  );
};
