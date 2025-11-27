"use client";

import { useState } from "react";
import {
  Address,
  AddressInput,
  Balance,
  BlockieAvatar,
  Bytes32Input,
  BytesInput,
  EtherInput,
  FaucetButton,
  InputBase,
  IntegerInput,
  RainbowKitCustomConnectButton,
} from "~~/components/scaffold-eth";

/**
 * Scaffold-ETH 组件展示页面
 * 展示所有可用组件及其基本用法
 */
export default function ComponentShowcase() {
  // 示例地址
  const exampleAddress = "0x34aA3F359A9D614239015126635CE7732c18fDF3";

  // 输入组件的状态
  const [addressInput, setAddressInput] = useState<string>("");
  const [bytes32Input, setBytes32Input] = useState<string>("");
  const [bytesInput, setBytesInput] = useState<string>("");
  const [etherInput, setEtherInput] = useState<string>("");
  const [integerInput, setIntegerInput] = useState<string>("");
  const [inputBaseValue, setInputBaseValue] = useState<string>("");

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8 text-center">Scaffold-ETH 组件展示</h1>

      {/* 连接按钮 */}
      <Section title="1. RainbowKitCustomConnectButton" description="钱包连接按钮，支持多种钱包">
        <RainbowKitCustomConnectButton />
      </Section>

      {/* Address 组件 */}
      <Section
        title="2. Address"
        description="显示以太坊地址，支持复制、区块浏览器跳转、ENS 解析"
        props="address: string, disableAddressLink?: boolean, format?: 'short' | 'long'"
      >
        <div className="space-y-2">
          <div>
            <span className="text-sm text-gray-500">默认格式：</span>
            <Address address={"0x34aA3F359A9D614239015126635CE7732c18fDF"} />
          </div>
          <div>
            <span className="text-sm text-gray-500">长格式：</span>
            <Address address={exampleAddress} format="long" />
          </div>
          <div>
            <span className="text-sm text-gray-500">禁用链接：</span>
            <Address address={exampleAddress} disableAddressLink />
          </div>
        </div>
      </Section>

      {/* Balance 组件 */}
      <Section
        title="3. Balance"
        description="显示地址的余额，支持 ETH 和 USDC"
        props="address: string, className?: string, usdMode?: boolean"
      >
        <div className="space-y-2">
          <div>
            <span className="text-sm text-gray-500">ETH 余额：</span>
            <Balance address={exampleAddress} />
          </div>
          <div>
            <span className="text-sm text-gray-500">USD 模式：</span>
            <Balance address={exampleAddress} usdMode />
          </div>
        </div>
      </Section>

      {/* BlockieAvatar 组件 */}
      <Section title="4. BlockieAvatar" description="根据地址生成唯一的像素头像" props="address: string, size?: number">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <BlockieAvatar address={exampleAddress} size={32} />
            <p className="text-xs text-gray-500 mt-1">32px</p>
          </div>
          <div className="text-center">
            <BlockieAvatar address={exampleAddress} size={48} />
            <p className="text-xs text-gray-500 mt-1">48px</p>
          </div>
          <div className="text-center">
            <BlockieAvatar address={exampleAddress} size={64} />
            <p className="text-xs text-gray-500 mt-1">64px</p>
          </div>
        </div>
      </Section>

      {/* FaucetButton 组件 */}
      <Section title="5. FaucetButton" description="本地测试网络水龙头按钮" props="无">
        <FaucetButton />
        <p className="text-xs text-gray-500 mt-2">⚠️ 仅在本地网络（Hardhat）可用</p>
      </Section>

      <div className="my-8 border-t-2 border-primary"></div>

      <h2 className="text-3xl font-bold mb-6">输入组件系列</h2>

      {/* AddressInput 组件 */}
      <Section
        title="6. AddressInput"
        description="地址输入框，支持 ENS 解析和验证"
        props="value: string, onChange: (value: string) => void, placeholder?: string"
      >
        <AddressInput value={addressInput} onChange={setAddressInput} placeholder="输入以太坊地址或 ENS" />
        <p className="text-xs text-gray-500 mt-2">当前值: {addressInput || "未输入"}</p>
      </Section>

      {/* EtherInput 组件 */}
      <Section
        title="7. EtherInput"
        description="ETH 数量输入框，支持 USD 转换"
        props="value: string, onChange: (value: string) => void, placeholder?: string, usdMode?: boolean"
      >
        <EtherInput value={etherInput} onChange={setEtherInput} placeholder="输入 ETH 数量" />
        <p className="text-xs text-gray-500 mt-2">当前值: {etherInput || "0"} ETH</p>
      </Section>

      {/* IntegerInput 组件 */}
      <Section
        title="8. IntegerInput"
        description="整数输入框（支持 bigint）"
        props="value: string, onChange: (value: string) => void, placeholder?: string"
      >
        <IntegerInput value={integerInput} onChange={setIntegerInput} placeholder="输入整数" />
        <p className="text-xs text-gray-500 mt-2">当前值: {integerInput || "0"}</p>
      </Section>

      {/* Bytes32Input 组件 */}
      <Section
        title="9. Bytes32Input"
        description="Bytes32 类型输入框（固定 32 字节）"
        props="value: string, onChange: (value: string) => void, placeholder?: string"
      >
        <Bytes32Input value={bytes32Input} onChange={setBytes32Input} placeholder="输入 bytes32 (0x...)" />
        <p className="text-xs text-gray-500 mt-2">当前值: {bytes32Input || "未输入"}</p>
      </Section>

      {/* BytesInput 组件 */}
      <Section
        title="10. BytesInput"
        description="Bytes 类型输入框（可变长度）"
        props="value: string, onChange: (value: string) => void, placeholder?: string"
      >
        <BytesInput value={bytesInput} onChange={setBytesInput} placeholder="输入 bytes (0x...)" />
        <p className="text-xs text-gray-500 mt-2">当前值: {bytesInput || "未输入"}</p>
      </Section>

      {/* InputBase 组件 */}
      <Section
        title="11. InputBase"
        description="基础输入框组件（其他输入组件的基础）"
        props="value: string, onChange: (value: string) => void, placeholder?: string, error?: boolean"
      >
        <InputBase value={inputBaseValue} onChange={setInputBaseValue} placeholder="基础输入框" />
        <p className="text-xs text-gray-500 mt-2">当前值: {inputBaseValue || "未输入"}</p>
      </Section>

      {/* 总结 */}
      <div className="mt-12 p-6 bg-base-200 rounded-lg">
        <h3 className="text-xl font-bold mb-3">📚 使用说明</h3>
        <ul className="space-y-2 text-sm">
          <li>
            <strong>Address：</strong>用于显示地址，自动集成复制、区块浏览器链接等功能
          </li>
          <li>
            <strong>Balance：</strong>显示地址余额，自动从链上获取最新数据
          </li>
          <li>
            <strong>BlockieAvatar：</strong>根据地址生成独特的像素头像
          </li>
          <li>
            <strong>Input 系列：</strong>专门为以太坊数据类型设计的输入框，带验证和格式化
          </li>
          <li>
            <strong>RainbowKitCustomConnectButton：</strong>集成 RainbowKit 的连接按钮
          </li>
        </ul>

        <div className="mt-4 p-3 bg-warning/20 rounded">
          <p className="text-xs">
            💡 <strong>提示：</strong>所有组件都经过优化，可直接在你的 dApp 中使用。查看{" "}
            <code className="bg-base-300 px-1 rounded">components/scaffold-eth</code> 目录查看完整源码。
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * 组件展示区域
 */
function Section({
  title,
  description,
  props,
  children,
}: {
  title: string;
  description: string;
  props?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8 p-6 border border-base-300 rounded-lg bg-base-100 shadow-sm hover:shadow-md transition-shadow">
      <h2 className="text-2xl font-bold mb-2 text-primary">{title}</h2>
      <p className="text-sm text-gray-600 mb-3">{description}</p>
      {props && (
        <div className="mb-4 p-2 bg-base-200 rounded text-xs font-mono">
          <span className="text-accent font-bold">Props: </span>
          {props}
        </div>
      )}
      <div className="mt-4">{children}</div>
    </div>
  );
}
