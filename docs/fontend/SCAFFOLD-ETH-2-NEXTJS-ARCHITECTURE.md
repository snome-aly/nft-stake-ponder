# Scaffold-ETH 2 Next.js 架构深度分析报告

本文档深入分析 Scaffold-ETH 2 框架中 Next.js 的定制和功能，帮助开发者快速掌握框架全貌。

---

## 📋 目录

- [1. 项目结构概览](#1-项目结构概览)
- [2. 自定义组件详解](#2-自定义组件详解)
- [3. 自定义 Hooks 深入](#3-自定义-hooks-深入)
- [4. 工具函数库](#4-工具函数库)
- [5. 合约集成机制](#5-合约集成机制)
- [6. 提供者架构](#6-提供者架构)
- [7. 开发工作流](#7-开发工作流)
- [8. 最佳实践](#8-最佳实践)
- [9. 常见场景代码示例](#9-常见场景代码示例)
- [10. 性能优化建议](#10-性能优化建议)
- [11. 故障排查](#11-故障排查)
- [12. 总结](#12-总结)

---

## 1. 项目结构概览

packages/nextjs 的核心目录结构：

```
packages/nextjs/
├── app/                          # Next.js 15 App Router 路由
│   ├── layout.tsx                # 根布局（提供者包装）
│   ├── page.tsx                  # 首页
│   ├── debug/                    # 合约调试页面
│   ├── blockexplorer/            # 区块浏览器
│   └── ponder-greetings/         # Ponder 示例页面
├── components/
│   ├── scaffold-eth/             # SE-2 专用组件
│   ├── Header.tsx                # 顶部导航
│   └── Footer.tsx                # 底部
├── hooks/scaffold-eth/           # 自定义 React Hooks
├── utils/scaffold-eth/           # 工具函数
├── services/                     # 服务层（状态管理、Web3配置）
├── contracts/
│   ├── deployedContracts.ts      # 自动生成的部署合约
│   └── externalContracts.ts      # 手动定义的外部合约
└── scaffold.config.ts            # SE-2 核心配置
```

### 1.1 核心配置文件

**scaffold.config.ts** 是 SE-2 的中央配置文件：

```typescript
export const scaffoldConfig = {
  // 目标网络列表（支持多链）
  targetNetworks: [chains.hardhat],

  // RPC 轮询间隔（毫秒）
  pollingInterval: 30000,

  // Alchemy API Key
  alchemyApiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,

  // 自定义 RPC 覆盖
  rpcOverrides: {},

  // WalletConnect 项目 ID
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,

  // 是否仅使用本地 Burner Wallet
  onlyLocalBurnerWallet: true,
};
```

### 1.2 App Router 路由结构

| 路由 | 功能 |
|------|------|
| `/` | 首页，显示欢迎信息和快速链接 |
| `/debug` | 合约调试界面，自动生成 UI |
| `/blockexplorer` | 本地区块浏览器 |
| `/blockexplorer/address/[address]` | 地址详情页 |
| `/blockexplorer/transaction/[txHash]` | 交易详情页 |
| `/ponder-greetings` | Ponder 示例页面 |

---

## 2. 自定义组件详解

### 2.1 核心展示组件

#### Address 组件

**功能：** 智能显示以太坊地址，支持 ENS 解析、头像、复制功能。

**Props：**
```typescript
type AddressProps = {
  address?: Address;
  disableAddressLink?: boolean;      // 禁用区块浏览器链接
  format?: "short" | "long";         // 短格式或长格式
  size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl";
  onlyEnsOrAddress?: boolean;        // 仅显示 ENS 或地址
};
```

**使用示例：**
```typescript
import { Address } from "~~/components/scaffold-eth";

<Address address={connectedAddress} />
<Address address={userAddress} format="long" size="lg" />
```

**特性：**
- 自动解析 ENS 名称和头像
- 生成 Blockie 头像（基于地址哈希）
- 一键复制地址
- 响应式尺寸调整
- 加载状态骨架屏

---

#### Balance 组件

**功能：** 显示地址的 ETH 余额，支持 ETH/USD 切换。

**使用示例：**
```typescript
import { Balance } from "~~/components/scaffold-eth";

<Balance address={account.address} />
<Balance address={recipient} usdMode={true} />
```

**特性：**
- 自动监听余额变化
- ETH/USD 一键切换
- 实时价格转换
- 加载和错误状态处理

---

### 2.2 输入组件

#### AddressInput 组件

**功能：** 智能地址输入框，支持 ENS 解析和验证。

**使用示例：**
```typescript
import { AddressInput } from "~~/components/scaffold-eth";

const [recipient, setRecipient] = useState<Address>("");

<AddressInput
  value={recipient}
  onChange={setRecipient}
  placeholder="输入地址或 ENS 名称"
/>
```

**特性：**
- 自动 ENS 解析（vitalik.eth → 0x地址）
- 反向 ENS 查询
- 实时验证（红色边框表示无效）
- Blockie 头像显示
- 防抖输入（500ms）

---

#### EtherInput 组件

**功能：** ETH 金额输入，支持 ETH/USD 转换。

**使用示例：**
```typescript
import { EtherInput } from "~~/components/scaffold-eth";

const [ethAmount, setEthAmount] = useState("");

<EtherInput
  value={ethAmount}
  onChange={setEthAmount}
  placeholder="0.0"
/>
```

**特性：**
- ETH/USD 一键切换
- 自动汇率转换
- 数字验证
- 支持小数点输入

---

#### IntegerInput 组件

**功能：** 整数输入，支持各种 Solidity 整数类型。

**使用示例：**
```typescript
import { IntegerInput, IntegerVariant } from "~~/components/scaffold-eth";

<IntegerInput
  value={tokenAmount}
  onChange={setTokenAmount}
  variant={IntegerVariant.UINT256}
/>
```

**特性：**
- 自动范围验证
- "∗" 按钮：快速乘以 1e18（wei 转换）
- 支持 signed/unsigned 整数
- 实时错误提示

---

#### 其他输入组件

| 组件 | 用途 |
|------|------|
| `BytesInput` | bytes 类型输入（十六进制） |
| `Bytes32Input` | bytes32 固定长度输入 |
| `InputBase` | 基础输入框（其他组件的基类） |

---

### 2.3 连接组件

#### RainbowKitCustomConnectButton

**功能：** 自定义的 RainbowKit 连接按钮，集成余额显示、网络切换等。

**特性：**
- 未连接时显示 "Connect Wallet" 按钮
- 已连接时显示余额、网络名称、地址头像
- 自动检测错误网络
- 集成本地 Burner Wallet

---

### 2.4 其他组件

| 组件 | 功能 |
|------|------|
| `BlockieAvatar` | 根据地址生成唯一的像素头像 |
| `Faucet` | 本地测试网水龙头 |
| `FaucetButton` | 水龙头按钮组件 |

---

## 3. 自定义 Hooks 深入

### 3.1 useScaffoldReadContract

**功能：** 从部署的合约读取数据，自动加载 ABI 和地址。

**使用示例：**
```typescript
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

// 示例 1: 读取简单值
const { data: greeting } = useScaffoldReadContract({
  contractName: "YourContract",
  functionName: "greeting",
});

// 示例 2: 带参数的读取
const { data: balance } = useScaffoldReadContract({
  contractName: "StakableNFT",
  functionName: "balanceOf",
  args: [userAddress],
});

// 示例 3: 禁用自动监听
const { data: totalSupply, refetch } = useScaffoldReadContract({
  contractName: "StakableNFT",
  functionName: "totalSupply",
  watch: false,
});
```

**关键特性：**
1. **自动类型推导**：函数名和参数都有完整的 TypeScript 类型提示
2. **自动监听**：默认监听每个新区块并自动更新数据
3. **多链支持**：通过 `chainId` 参数支持多链读取
4. **条件启用**：参数中有 `undefined` 时自动禁用查询

---

### 3.2 useScaffoldWriteContract

**功能：** 向部署的合约写入数据，包含完整的交易流程管理。

**使用示例：**

```typescript
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { parseEther } from "viem";

// 示例 1: 基础写入
const { writeContractAsync } = useScaffoldWriteContract({
  contractName: "YourContract",
});

const handleSetGreeting = async () => {
  try {
    await writeContractAsync({
      functionName: "setGreeting",
      args: ["Hello, Scaffold-ETH 2!"],
    });
  } catch (error) {
    console.error(error);
  }
};

// 示例 2: 支付函数（带 value）
const { writeContractAsync: mint, isMining } = useScaffoldWriteContract({
  contractName: "StakableNFT",
});

const handleMint = async (quantity: number) => {
  try {
    await mint({
      functionName: "mint",
      args: [BigInt(quantity)],
      value: parseEther("0.01") * BigInt(quantity),
    });
  } catch (error) {
    // 错误已通过 notification 显示
  }
};

// 示例 3: 监听交易确认
await writeContractAsync(
  {
    functionName: "mint",
    args: [1n],
  },
  {
    blockConfirmations: 3,
    onBlockConfirmation: (receipt) => {
      console.log("交易已确认！", receipt.transactionHash);
    },
  }
);
```

**关键特性：**
1. **自动网络检查**：检查钱包连接和网络
2. **交易前模拟**：使用 `simulateContract` 预检查交易
3. **增强的错误处理**：自动解析 revert 原因
4. **交易状态管理**：`isMining` 标志跟踪交易状态
5. **类型安全**：函数名自动补全和参数类型检查

---

### 3.3 useScaffoldEventHistory

**功能：** 读取合约的历史事件（使用 getLogs），支持分页、过滤、实时监听。

**⚠️ 警告：** 仅推荐用于本地链，生产环境应使用 Ponder 等索引器。

**使用示例：**

```typescript
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth";

// 示例 1: 基础事件历史
const { data: mintEvents } = useScaffoldEventHistory({
  contractName: "StakableNFT",
  eventName: "NFTMinted",
});

// 示例 2: 带过滤器的查询
const { data: userMints } = useScaffoldEventHistory({
  contractName: "StakableNFT",
  eventName: "NFTMinted",
  filters: { to: userAddress },
});

// 示例 3: 实时监听新事件
const { data: liveTransfers } = useScaffoldEventHistory({
  contractName: "StakableNFT",
  eventName: "Transfer",
  watch: true,
});

// 示例 4: 获取完整的区块和交易数据
const { data: detailedEvents } = useScaffoldEventHistory({
  contractName: "YourContract",
  eventName: "GreetingChange",
  blockData: true,
  transactionData: true,
  receiptData: true,
});
```

**关键特性：**
1. **自动分页查询**：使用 `useInfiniteQuery` 分批获取事件
2. **实时监听模式**：`watch: true` 启用实时监听
3. **过滤器支持**：只能过滤 `indexed` 参数
4. **性能优化**：分批获取避免 RPC 超时

**注意事项：**
- 不推荐用于生产：`getLogs` 会给 RPC 端点带来压力
- 区块范围限制：某些 RPC 提供商限制单次查询的区块范围
- 性能考虑：获取额外数据会显著增加请求数

---

### 3.4 useScaffoldWatchContractEvent

**功能：** 实时监听合约事件（使用 WebSocket），比 `useScaffoldEventHistory` 更轻量。

**使用示例：**

```typescript
import { useScaffoldWatchContractEvent } from "~~/hooks/scaffold-eth";
import { useState } from "react";

// 示例 1: 监听新的铸造事件
const [latestMints, setLatestMints] = useState([]);

useScaffoldWatchContractEvent({
  contractName: "StakableNFT",
  eventName: "NFTMinted",
  onLogs: (logs) => {
    logs.forEach((log) => {
      console.log("新铸造:", log.args);
    });
    setLatestMints((prev) => [...logs, ...prev]);
  },
});

// 示例 2: 监听转账并更新余额
useScaffoldWatchContractEvent({
  contractName: "StakableNFT",
  eventName: "Transfer",
  onLogs: (logs) => {
    logs.forEach((log) => {
      const { from, to, tokenId } = log.args;
      if (to === currentUserAddress || from === currentUserAddress) {
        refetchBalance();
      }
    });
  },
});
```

**与 useScaffoldEventHistory 的区别：**

| 特性 | useScaffoldWatchContractEvent | useScaffoldEventHistory |
|------|------------------------------|-------------------------|
| 用途 | 实时监听新事件 | 查询历史事件 + 可选实时监听 |
| 连接方式 | WebSocket | HTTP (getLogs) |
| 历史事件 | ❌ 不支持 | ✅ 支持 |
| 性能 | 🟢 轻量 | 🟡 较重 |
| 生产适用性 | ✅ 适用 | ❌ 不推荐 |

---

### 3.5 其他关键 Hooks

| Hook | 用途 | 常用度 |
|------|------|--------|
| `useScaffoldReadContract` | 读取合约数据 | ⭐⭐⭐⭐⭐ |
| `useScaffoldWriteContract` | 写入合约数据 | ⭐⭐⭐⭐⭐ |
| `useScaffoldEventHistory` | 查询历史事件 | ⭐⭐⭐⭐ |
| `useScaffoldWatchContractEvent` | 实时监听事件 | ⭐⭐⭐⭐ |
| `useDeployedContractInfo` | 获取合约信息 | ⭐⭐⭐ |
| `useScaffoldContract` | 获取 viem Contract 实例 | ⭐⭐ |
| `useTransactor` | 交易包装器 | ⭐⭐⭐⭐ |
| `useTargetNetwork` | 获取目标网络 | ⭐⭐⭐⭐ |
| `useWatchBalance` | 监听余额 | ⭐⭐⭐⭐ |

---

## 4. 工具函数库

### 4.1 核心工具

#### contract.ts

**关键函数：**

```typescript
// 增强的错误解析（查找所有已部署合约的错误签名）
export const getParsedErrorWithAllAbis = (error: any, chainId: AllowedChainIds): string

// 模拟合约写入并显示错误通知
export const simulateContractWriteAndNotifyError = async ({
  wagmiConfig,
  writeContractParams,
  chainId,
})
```

---

#### networks.ts

**关键函数：**

```typescript
// 获取 Alchemy HTTP RPC URL
export const getAlchemyHttpUrl = (chainId: number)

// 获取区块浏览器交易链接
export function getBlockExplorerTxLink(chainId: number, txnHash: string)

// 获取区块浏览器地址链接
export function getBlockExplorerAddressLink(network: Chain, address: string)
```

---

#### notification.tsx

**API：**

```typescript
export const notification = {
  success: (content: React.ReactNode, options?: NotificationOptions) => string,
  info: (content: React.ReactNode, options?: NotificationOptions) => string,
  warning: (content: React.ReactNode, options?: NotificationOptions) => string,
  error: (content: React.ReactNode, options?: NotificationOptions) => string,
  loading: (content: React.ReactNode, options?: NotificationOptions) => string,
  remove: (toastId: string) => void,
};
```

**使用示例：**

```typescript
import { notification } from "~~/utils/scaffold-eth";

// 成功通知
notification.success("交易成功！");

// 错误通知
notification.error("交易失败: 余额不足");

// 加载通知
const loadingId = notification.loading("正在处理...");
notification.remove(loadingId);
```

---

## 5. 合约集成机制

### 5.1 deployedContracts.ts

**自动生成：** 此文件由 Hardhat 部署脚本自动生成，**不应手动编辑**。

**结构：**

```typescript
const deployedContracts = {
  31337: {  // Chain ID
    StakableNFT: {
      address: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      abi: [...],
      inheritedFunctions: {...},
      deployedOnBlock: 1,
    },
  },
} as const;
```

**类型安全：**
- `as const` 确保类型完全推导
- 所有 hooks 的 `contractName` 参数都基于此文件进行自动补全

---

### 5.2 externalContracts.ts

**手动定义：** 用于添加外部合约（未在本项目部署的合约）。

**使用示例：**

```typescript
const externalContracts = {
  1: {  // Mainnet
    DAI: {
      address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      abi: [...],
    },
    USDC: {
      address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      abi: [...],
    },
  },
} as const;
```

**使用方式：**

```typescript
// 与外部合约交互（与内部合约完全一致）
const { data: daiBalance } = useScaffoldReadContract({
  contractName: "DAI",
  functionName: "balanceOf",
  args: [userAddress],
  chainId: 1,
});
```

---

## 6. 提供者架构

### 6.1 ScaffoldEthAppWithProviders

**提供者层次结构：**

```typescript
<WagmiProvider config={wagmiConfig}>
  <QueryClientProvider client={queryClient}>
    <RainbowKitProvider>
      <ProgressBar />
      <ScaffoldEthApp>
        <Header />
        <main>{children}</main>
        <Footer />
        <Toaster />
      </ScaffoldEthApp>
    </RainbowKitProvider>
  </QueryClientProvider>
</WagmiProvider>
```

**关键组件：**
1. **WagmiProvider**：提供 Web3 连接和钱包状态
2. **QueryClientProvider**：TanStack Query 客户端
3. **RainbowKitProvider**：钱包连接 UI
4. **Toaster**：全局通知容器

---

### 6.2 全局状态管理

**使用 Zustand：**

```typescript
import { useGlobalState } from "~~/services/store/store";

// 读取状态
const nativeCurrencyPrice = useGlobalState(state => state.nativeCurrency.price);

// 更新状态
const setNativeCurrencyPrice = useGlobalState(state => state.setNativeCurrencyPrice);
setNativeCurrencyPrice(2500);
```

---

## 7. 开发工作流

### 7.1 添加新合约

1. **在 Hardhat 中创建合约**
2. **部署合约**：`yarn deploy`
3. **在前端使用**：自动可用，直接使用 hooks

---

### 7.2 创建新页面

1. **创建 App Router 页面**：
   ```bash
   mkdir packages/nextjs/app/my-page
   touch packages/nextjs/app/my-page/page.tsx
   ```

2. **实现页面组件**
3. **添加到导航**（可选）

---

### 7.3 调试合约

使用 `/debug` 页面：

1. 访问 `http://localhost:3000/debug`
2. 自动生成所有已部署合约的 UI
3. 查看变量、调用函数、执行交易

---

## 8. 最佳实践

### 8.1 合约交互

**✅ DO：始终使用 Scaffold-ETH hooks**

```typescript
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

const { data: greeting } = useScaffoldReadContract({
  contractName: "YourContract",
  functionName: "greeting",
});
```

**❌ DON'T：不要直接使用 wagmi/viem**

---

### 8.2 组件使用

**✅ DO：使用 SE-2 展示组件**

```typescript
import { Address, Balance } from "~~/components/scaffold-eth";

<Address address={userAddress} />
<Balance address={userAddress} />
```

---

### 8.3 事件监听

**✅ DO：生产环境使用 Ponder + useScaffoldWatchContractEvent**

**❌ DON'T：生产环境不要使用 useScaffoldEventHistory**

---

## 9. 常见场景代码示例

### 9.1 读取和显示合约数据

```typescript
"use client";

import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { Address } from "~~/components/scaffold-eth";

export default function ContractInfo() {
  const { data: totalSupply } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "totalSupply",
  });

  return <p>Total Supply: {totalSupply?.toString()}</p>;
}
```

---

### 9.2 铸造 NFT

```typescript
"use client";

import { useState } from "react";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { parseEther } from "viem";

export default function MintNFT() {
  const [quantity, setQuantity] = useState("1");

  const { writeContractAsync: mint, isMining } = useScaffoldWriteContract({
    contractName: "StakableNFT",
  });

  const handleMint = async () => {
    try {
      const qty = BigInt(quantity);
      await mint({
        functionName: "mint",
        args: [qty],
        value: parseEther("0.01") * qty,
      });
    } catch (error) {
      // 错误已通过 notification 显示
    }
  };

  return (
    <button onClick={handleMint} disabled={isMining}>
      {isMining ? "Minting..." : "Mint NFT"}
    </button>
  );
}
```

---

### 9.3 实时监听事件

```typescript
"use client";

import { useState } from "react";
import { useScaffoldWatchContractEvent } from "~~/hooks/scaffold-eth";
import { Address } from "~~/components/scaffold-eth";

export default function LiveMints() {
  const [recentMints, setRecentMints] = useState<any[]>([]);

  useScaffoldWatchContractEvent({
    contractName: "StakableNFT",
    eventName: "NFTMinted",
    onLogs: (logs) => {
      setRecentMints((prev) => [...logs, ...prev].slice(0, 10));
    },
  });

  return (
    <div>
      <h2>Recent Mints (Live)</h2>
      <ul>
        {recentMints.map((mint, i) => (
          <li key={i}>
            <Address address={mint.args.to} /> minted {mint.args.quantity.toString()} NFTs
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 10. 性能优化建议

### 10.1 合约读取优化

**使用 `watch: false` 禁用不必要的监听：**

```typescript
const { data: name } = useScaffoldReadContract({
  contractName: "StakableNFT",
  functionName: "name",
  watch: false,
});
```

---

### 10.2 条件查询

**使用 `enabled` 延迟查询：**

```typescript
const { data: rarity } = useScaffoldReadContract({
  contractName: "StakableNFT",
  functionName: "getRarity",
  args: [tokenId!],
  query: {
    enabled: tokenId !== undefined,
  },
});
```

---

## 11. 故障排查

### 11.1 "Contract not deployed" 错误

**解决方案：**
```bash
yarn deploy
```

---

### 11.2 类型错误

**解决方案：**
```bash
yarn deploy
# 重启 TypeScript 服务器（VSCode）
Cmd/Ctrl + Shift + P -> TypeScript: Restart TS Server
```

---

### 11.3 RPC 错误 (Too Many Requests)

**解决方案：**
- 使用 Ponder 代替 `useScaffoldEventHistory`
- 增加 `pollingInterval`
- 使用付费 RPC 提供商

---

### 11.4 交易模拟失败但实际可以执行

**解决方案：**
```typescript
const { writeContractAsync } = useScaffoldWriteContract({
  contractName: "YourContract",
  disableSimulate: true,
});
```

---

## 12. 总结

Scaffold-ETH 2 的 Next.js 架构提供了一套完整、类型安全、开发者友好的 Web3 前端框架。

**核心优势：**
1. ✅ **类型安全**：端到端类型推导
2. ✅ **开箱即用**：无需配置
3. ✅ **丰富组件**：完整的 Web3 UI 组件库
4. ✅ **强大 Hooks**：封装所有常见交互模式
5. ✅ **最佳实践**：内置错误处理、通知、交易流程
6. ✅ **可扩展**：易于添加自定义功能

**推荐学习路径：**
1. 阅读本报告前 6 章
2. 运行 `yarn start` 启动项目
3. 访问 `/debug` 页面探索合约交互
4. 修改 `app/page.tsx` 创建自定义 UI
5. 参考代码示例章节

**重要提醒：**
- ⚠️ 始终使用 SE-2 hooks，不直接使用 wagmi/viem
- ⚠️ 生产环境使用 Ponder 索引事件
- ⚠️ 充分利用 TypeScript 类型系统
- ⚠️ 参考 `/debug` 页面了解合约 ABI

---

**祝你在 Scaffold-ETH 2 上构建出色的 dApp！** 🚀
