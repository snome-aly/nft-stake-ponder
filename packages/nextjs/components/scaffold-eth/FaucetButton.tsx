"use client";

import { useState } from "react";
import { createWalletClient, http, parseEther } from "viem";
import { hardhat } from "viem/chains";
import { useAccount } from "wagmi";
import { BanknotesIcon } from "@heroicons/react/24/outline";
import { useTransactor } from "~~/hooks/scaffold-eth";
import { useWatchBalance } from "~~/hooks/scaffold-eth/useWatchBalance";

// 每次水龙头发送的固定 ETH 数量
const NUM_OF_ETH = "1";

// 水龙头账户地址（Hardhat 默认第一个账户）
// 地址: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
// 私钥在 Hardhat 文档中公开，仅用于本地测试
const FAUCET_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

// 创建本地 Hardhat 网络的钱包客户端
const localWalletClient = createWalletClient({
  chain: hardhat,
  transport: http(),
});

/**
 * FaucetButton - 快速水龙头按钮组件
 *
 * 核心功能：
 * 1. 仅在本地 Hardhat 网络上可见
 * 2. 一键快速领取固定金额的测试 ETH（默认 1 ETH）
 * 3. 当用户余额为 0 时，显示提示工具提示（tooltip）
 * 4. 无需输入，直接发送到当前连接的钱包地址
 *
 * 与 Faucet 组件的区别：
 * - Faucet: 完整弹窗，可自定义地址和金额（适合开发者）
 * - FaucetButton: 快速按钮，固定金额，发送到当前钱包（适合快速测试）
 *
 * 使用场景：
 * - 显示在 Header 中，用户余额为 0 时快速充值
 * - 新钱包首次连接时获取测试 ETH
 * - 测试过程中快速补充余额
 *
 * 用户体验：
 * - 余额为 0 时：显示醒目的 tooltip 提示 "从水龙头获取资金"
 * - 点击后：显示加载动画，等待交易确认
 * - 交易成功：自动刷新余额显示
 *
 * 注意事项：
 * - 仅在 Hardhat 网络（chainId: 31337）上显示
 * - 需要本地节点运行（yarn chain）
 * - 固定发送 1 ETH（可通过 NUM_OF_ETH 常量修改）
 *
 * @example
 * // 在 Header 组件中使用
 * <FaucetButton />
 */
export const FaucetButton = () => {
  // ==================== 状态管理 ====================
  // 获取当前连接的钱包地址和网络信息
  const { address, chain: ConnectedChain } = useAccount();

  // 监听当前地址的余额变化（用于判断是否显示 tooltip）
  const { data: balance } = useWatchBalance({ address });

  // 发送交易的加载状态
  const [loading, setLoading] = useState(false);

  // 使用 Transactor Hook 处理交易发送和通知
  const faucetTxn = useTransactor(localWalletClient);

  // ==================== 发送 ETH 的核心逻辑 ====================
  const sendETH = async () => {
    // 校验：必须有连接的钱包地址
    if (!address) return;

    try {
      setLoading(true);

      // 使用 faucetTxn 发送固定金额的 ETH
      // - from: FAUCET_ADDRESS (Hardhat 第一个账户)
      // - to: address (当前连接的钱包地址)
      // - value: 固定 1 ETH
      await faucetTxn({
        account: FAUCET_ADDRESS,
        to: address,
        value: parseEther(NUM_OF_ETH), // "1" -> 1000000000000000000n (1 ETH in Wei)
      });

      setLoading(false);
    } catch (error) {
      console.error("⚡️ ~ file: FaucetButton.tsx:sendETH ~ error", error);
      setLoading(false);
    }
  };

  // ==================== 渲染控制 ====================
  // 仅在本地 Hardhat 网络（chainId: 31337）上显示
  if (ConnectedChain?.id !== hardhat.id) {
    return null;
  }

  // 判断余额是否为 0（使用 BigInt 比较）
  // 0n 是 BigInt 零值表示法
  const isBalanceZero = balance && balance.value === 0n;

  return (
    <div
      className={
        !isBalanceZero
          ? "ml-1" // 余额不为 0：正常显示
          : // 余额为 0：显示醒目的提示工具提示
            "ml-1 tooltip tooltip-bottom tooltip-primary tooltip-open font-bold before:left-auto before:transform-none before:content-[attr(data-tip)] before:-translate-x-2/5"
      }
      data-tip="从水龙头获取资金" // Tooltip 提示文本
    >
      {/* ========== 水龙头按钮 ========== */}
      <button
        className="btn btn-secondary btn-sm px-2 rounded-full"
        onClick={sendETH}
        disabled={loading} // 加载时禁用按钮，防止重复点击
      >
        {!loading ? (
          // 正常状态：显示钞票图标
          <BanknotesIcon className="h-4 w-4" />
        ) : (
          // 加载状态：显示旋转动画
          <span className="loading loading-spinner loading-xs"></span>
        )}
      </button>
    </div>
  );
};
