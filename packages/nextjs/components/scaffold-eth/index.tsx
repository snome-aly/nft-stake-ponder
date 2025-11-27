/**
 * Scaffold-ETH 组件库统一导出文件
 *
 * 这个文件集中导出所有 Scaffold-ETH 2 的可复用组件，
 * 允许从一个入口导入所有组件，简化导入语句。
 *
 * 包含的组件模块：
 * - Address: 以太坊地址显示组件（支持 ENS、头像、复制、链接）
 * - Balance: 余额显示组件（支持 ETH/USD 切换）
 * - BlockieAvatar: Blockie 头像生成组件
 * - Faucet: 水龙头组件（本地开发时为账户充值）
 * - FaucetButton: 快速水龙头按钮
 * - Input: 各种输入组件（AddressInput、EtherInput、IntegerInput 等）
 * - RainbowKitCustomConnectButton: 自定义的钱包连接按钮（框架默认）
 * - CustomConnectButton: 自定义钱包连接按钮（优化余额显示）
 *
 * @example
 * // 使用示例
 * import { Address, Balance, AddressInput, CustomConnectButton } from "~~/components/scaffold-eth";
 *
 * function MyComponent() {
 *   return (
 *     <>
 *       <Address address="0x..." />
 *       <Balance address="0x..." />
 *       <AddressInput value={addr} onChange={setAddr} />
 *       <CustomConnectButton />
 *     </>
 *   );
 * }
 */

export * from "./Address/Address";
export * from "./Balance";
export * from "./BlockieAvatar";
export * from "./Faucet";
export * from "./FaucetButton";
export * from "./Input";
export * from "./RainbowKitCustomConnectButton";
export * from "../Header/CustomConnectButton";
