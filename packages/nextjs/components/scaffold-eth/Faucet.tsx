"use client";

import { useEffect, useState } from "react";
import { Address as AddressType, createWalletClient, http, parseEther } from "viem";
import { hardhat } from "viem/chains";
import { useAccount } from "wagmi";
import { BanknotesIcon } from "@heroicons/react/24/outline";
import { Address, AddressInput, Balance, EtherInput } from "~~/components/scaffold-eth";
import { useTransactor } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

// 使用 Hardhat 生成的账户索引（默认使用第一个账户作为水龙头资金来源）
const FAUCET_ACCOUNT_INDEX = 0;

// 创建本地 Hardhat 网络的钱包客户端
// 用于在本地开发环境中发送测试 ETH
const localWalletClient = createWalletClient({
  chain: hardhat,
  transport: http(),
});

/**
 * Faucet - 水龙头弹窗组件
 *
 * 核心功能：
 * 1. 仅在本地 Hardhat 网络上可见
 * 2. 允许开发者向任意地址发送测试 ETH
 * 3. 使用 Hardhat 预生成的测试账户作为资金来源
 * 4. 提供可视化的发送界面（输入地址 + 金额）
 *
 * 工作流程：
 * 1. 组件加载时自动获取水龙头账户地址
 * 2. 用户输入目标地址和金额
 * 3. 点击发送按钮触发交易
 * 4. 显示交易状态（加载/成功/失败）
 *
 * 使用场景：
 * - 本地开发测试（yarn chain）
 * - 快速为测试账户充值
 * - 避免手动导入私钥转账
 *
 * 注意事项：
 * - 仅在 Hardhat 网络（chainId: 31337）上显示
 * - 需要本地节点运行（yarn chain）
 * - 使用第一个 Hardhat 测试账户作为发送方
 *
 * @example
 * // 在 Header 组件中使用
 * <Faucet />
 */
export const Faucet = () => {
  // ==================== 状态管理 ====================
  const [loading, setLoading] = useState(false); // 发送交易的加载状态
  const [inputAddress, setInputAddress] = useState<AddressType>(); // 用户输入的目标地址
  const [faucetAddress, setFaucetAddress] = useState<AddressType>(); // 水龙头账户地址（资金来源）
  const [sendValue, setSendValue] = useState(""); // 用户输入的发送金额（字符串格式）

  // 获取当前连接的区块链网络信息
  const { chain: ConnectedChain } = useAccount();

  // 使用 Transactor Hook 处理交易发送和通知
  // 自动处理交易确认、错误提示等逻辑
  const faucetTxn = useTransactor(localWalletClient);

  // ==================== 初始化：获取水龙头账户地址 ====================
  useEffect(() => {
    const getFaucetAddress = async () => {
      try {
        // 从本地 Hardhat 节点获取所有预生成的测试账户
        const accounts = await localWalletClient.getAddresses();
        // 使用第一个账户（通常余额为 10000 ETH）
        setFaucetAddress(accounts[FAUCET_ACCOUNT_INDEX]);
      } catch (error) {
        // 连接失败时显示详细的错误提示和解决方案
        notification.error(
          <>
            <p className="font-bold mt-0 mb-1">无法连接到本地节点</p>
            <p className="m-0">
              - 是否忘记运行 <code className="italic bg-base-300 text-base font-bold">yarn chain</code> ?
            </p>
            <p className="mt-1 break-normal">
              - 或者修改 <code className="italic bg-base-300 text-base font-bold">scaffold.config.ts</code> 中的{" "}
              <code className="italic bg-base-300 text-base font-bold">targetNetwork</code>
            </p>
          </>,
        );
        console.error("⚡️ ~ file: Faucet.tsx:getFaucetAddress ~ error", error);
      }
    };
    getFaucetAddress();
  }, []);

  // ==================== 发送 ETH 的核心逻辑 ====================
  const sendETH = async () => {
    // 校验：必须有水龙头地址和目标地址
    if (!faucetAddress || !inputAddress) {
      return;
    }
    try {
      setLoading(true);

      // 使用 faucetTxn 发送交易
      // - from: faucetAddress (Hardhat 第一个账户)
      // - to: inputAddress (用户输入的目标地址)
      // - value: 将字符串金额转换为 Wei (BigInt)
      await faucetTxn({
        to: inputAddress,
        value: parseEther(sendValue as `${number}`), // "1.5" -> 1500000000000000000n
        account: faucetAddress,
      });

      // 交易成功后重置表单状态
      setLoading(false);
      setInputAddress(undefined);
      setSendValue("");
    } catch (error) {
      console.error("⚡️ ~ file: Faucet.tsx:sendETH ~ error", error);
      setLoading(false);
    }
  };

  // ==================== 渲染控制 ====================
  // 仅在本地 Hardhat 网络（chainId: 31337）上显示
  // 其他网络（主网、测试网等）返回 null 隐藏组件
  if (ConnectedChain?.id !== hardhat.id) {
    return null;
  }

  return (
    <div>
      {/* ========== 触发按钮：打开弹窗 ========== */}
      <label htmlFor="faucet-modal" className="btn btn-primary btn-sm font-normal gap-1">
        <BanknotesIcon className="h-4 w-4" />
        <span>Faucet</span>
      </label>

      {/* ========== DaisyUI 模态框组件 ========== */}
      {/* 使用 checkbox + label 实现模态框的打开/关闭 */}
      <input type="checkbox" id="faucet-modal" className="modal-toggle" />
      <label htmlFor="faucet-modal" className="modal cursor-pointer">
        <label className="modal-box relative">
          {/* 隐藏的 input：用于捕获点击事件，防止点击弹窗内容时关闭 */}
          <input className="h-0 w-0 absolute top-0 left-0" />

          {/* ========== 弹窗标题 ========== */}
          <h3 className="text-xl font-bold mb-3">本地水龙头</h3>

          {/* ========== 关闭按钮 ========== */}
          <label htmlFor="faucet-modal" className="btn btn-ghost btn-sm btn-circle absolute right-3 top-3">
            ✕
          </label>

          {/* ========== 弹窗内容区域 ========== */}
          <div className="space-y-3">
            {/* 显示水龙头账户信息：地址 + 可用余额 */}
            <div className="flex space-x-4">
              <div>
                <span className="text-sm font-bold">发送方:</span>
                <Address address={faucetAddress} onlyEnsOrAddress />
              </div>
              <div>
                <span className="text-sm font-bold pl-3">可用余额:</span>
                <Balance address={faucetAddress} />
              </div>
            </div>

            {/* 输入区域：目标地址 + 发送金额 + 发送按钮 */}
            <div className="flex flex-col space-y-3">
              {/* 目标地址输入框（支持 ENS 域名解析） */}
              <AddressInput
                placeholder="目标地址"
                value={inputAddress ?? ""}
                onChange={value => setInputAddress(value as AddressType)}
              />

              {/* ETH 金额输入框（支持 ETH/USD 转换） */}
              <EtherInput placeholder="发送金额" value={sendValue} onChange={value => setSendValue(value)} />

              {/* 发送按钮：显示加载状态 */}
              <button className="h-10 btn btn-primary btn-sm px-2 rounded-full" onClick={sendETH} disabled={loading}>
                {!loading ? (
                  <BanknotesIcon className="h-6 w-6" />
                ) : (
                  <span className="loading loading-spinner loading-sm"></span>
                )}
                <span>发送</span>
              </button>
            </div>
          </div>
        </label>
      </label>
    </div>
  );
};
