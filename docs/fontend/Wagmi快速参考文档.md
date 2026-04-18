# Wagmi 快速参考文档

wagmi 是 React 的以太坊开发库，提供了 Hooks、工具和类型系统，用于与以太坊交互。

---

## 📋 目录

- [1. Wagmi 概述](#1-wagmi-概述)
- [2. 核心概念](#2-核心概念)
- [3. 配置与提供者](#3-配置与提供者)
- [4. 钱包连接 Hooks](#4-钱包连接-hooks)
- [5. 合约交互 Hooks](#5-合约交互-hooks)
- [6. 账户与网络 Hooks](#6-账户与网络-hooks)
- [7. 交易 Hooks](#7-交易-hooks)
- [8. ENS Hooks](#8-ens-hooks)
- [9. 实用工具 Hooks](#9-实用工具-hooks)
- [10. Viem 集成](#10-viem-集成)
- [11. 在 Scaffold-ETH 2 中的使用](#11-在-scaffold-eth-2-中的使用)
- [12. 最佳实践](#12-最佳实践)
- [13. 常见模式](#13-常见模式)
- [14. 故障排查](#14-故障排查)

---

## 1. Wagmi 概述

### 什么是 Wagmi？

**wagmi** 是一个用于以太坊的 React Hooks 库，它：
- 基于 **viem**（新一代以太坊库，ethers.js 的替代品）
- 提供 20+ React Hooks 用于钱包、ENS、合约、交易等
- 完全类型安全（TypeScript）
- 支持多链
- 内置缓存和请求去重
- 与 TanStack Query（React Query）集成

### 技术栈

```
应用层          wagmi (React Hooks)
               ↓
缓存层          TanStack Query (缓存、重试、自动刷新)
               ↓
以太坊层        viem (以太坊交互)
               ↓
网络层          JSON-RPC (以太坊节点)
```

### 核心依赖

```json
{
  "wagmi": "^2.x",           // 核心库
  "viem": "^2.x",            // 以太坊工具库
  "@tanstack/react-query": "^5.x"  // 缓存和状态管理
}
```

---

## 2. 核心概念

### 2.1 Config（配置）

wagmi 的所有功能都基于一个中央配置对象：

```typescript
import { createConfig, http } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'

const config = createConfig({
  chains: [mainnet, sepolia],  // 支持的链
  transports: {
    [mainnet.id]: http(),      // RPC 传输层
    [sepolia.id]: http(),
  },
})
```

**关键点：**
- Config 定义了支持的链和 RPC 端点
- 所有 Hooks 都需要包裹在 `WagmiProvider` 中
- Config 是单例，整个应用共享

---

### 2.2 Connectors（连接器）

Connectors 是钱包连接的抽象：

```typescript
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors'

const config = createConfig({
  chains: [mainnet],
  connectors: [
    injected(),                    // MetaMask, Brave Wallet 等
    walletConnect({ projectId }), // WalletConnect
    coinbaseWallet({ appName }),  // Coinbase Wallet
  ],
  transports: {
    [mainnet.id]: http(),
  },
})
```

**常用 Connectors：**
- `injected()` - 浏览器注入钱包（MetaMask）
- `walletConnect()` - WalletConnect 协议
- `coinbaseWallet()` - Coinbase Wallet
- `safe()` - Gnosis Safe
- `mock()` - 测试用 mock 连接器

---

### 2.3 Chains（链）

wagmi 提供了预配置的链定义：

```typescript
import { mainnet, goerli, sepolia, polygon, arbitrum, optimism, base } from 'wagmi/chains'

// 或自定义链
import { defineChain } from 'viem'

const myCustomChain = defineChain({
  id: 1234,
  name: 'My Custom Chain',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.example.com'] },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://explorer.example.com' },
  },
})
```

---

## 3. 配置与提供者

### 3.1 基础配置

```typescript
// wagmiConfig.ts
import { createConfig, http } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

export const config = createConfig({
  chains: [mainnet, sepolia],
  connectors: [
    injected(),
    walletConnect({ projectId: 'YOUR_PROJECT_ID' }),
  ],
  transports: {
    [mainnet.id]: http('https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY'),
    [sepolia.id]: http('https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY'),
  },
})
```

---

### 3.2 提供者设置

```typescript
// App.tsx
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from './wagmiConfig'

const queryClient = new QueryClient()

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <YourApp />
      </QueryClientProvider>
    </WagmiProvider>
  )
}
```

**重要：**
- `WagmiProvider` 必须在外层
- `QueryClientProvider` 用于缓存和状态管理
- 所有 wagmi hooks 必须在这两个 Provider 内部使用

---

## 4. 钱包连接 Hooks

### 4.1 useAccount

获取当前连接的账户信息。

```typescript
import { useAccount } from 'wagmi'

function Component() {
  const {
    address,           // 当前地址 "0x..."
    isConnected,       // 是否已连接
    isConnecting,      // 是否正在连接
    isDisconnected,    // 是否已断开
    isReconnecting,    // 是否正在重连
    connector,         // 当前使用的连接器
    chain,             // 当前链
    chainId,           // 当前链 ID
    status,            // "connected" | "disconnected" | "connecting" | "reconnecting"
  } = useAccount()

  return (
    <div>
      {isConnected ? (
        <p>Connected to {address}</p>
      ) : (
        <p>Not connected</p>
      )}
    </div>
  )
}
```

**使用场景：**
- 显示用户地址
- 条件渲染（已连接 vs 未连接）
- 获取当前网络

---

### 4.2 useConnect

连接钱包。

```typescript
import { useConnect } from 'wagmi'

function ConnectButton() {
  const { connect, connectors, isPending, error } = useConnect()

  return (
    <div>
      {connectors.map((connector) => (
        <button
          key={connector.id}
          onClick={() => connect({ connector })}
          disabled={isPending}
        >
          {connector.name}
        </button>
      ))}
      {error && <p>Error: {error.message}</p>}
    </div>
  )
}
```

**返回值：**
- `connect()` - 连接函数
- `connectors` - 可用的连接器列表
- `isPending` - 是否正在连接
- `error` - 连接错误

---

### 4.3 useDisconnect

断开钱包连接。

```typescript
import { useDisconnect } from 'wagmi'

function DisconnectButton() {
  const { disconnect } = useDisconnect()

  return (
    <button onClick={() => disconnect()}>
      Disconnect
    </button>
  )
}
```

---

### 4.4 useSwitchChain

切换网络。

```typescript
import { useSwitchChain } from 'wagmi'

function SwitchNetworkButton() {
  const { chains, switchChain, isPending } = useSwitchChain()

  return (
    <div>
      {chains.map((chain) => (
        <button
          key={chain.id}
          onClick={() => switchChain({ chainId: chain.id })}
          disabled={isPending}
        >
          Switch to {chain.name}
        </button>
      ))}
    </div>
  )
}
```

---

## 5. 合约交互 Hooks

### 5.1 useReadContract

读取合约数据（view/pure 函数）。

```typescript
import { useReadContract } from 'wagmi'
import { erc20Abi } from 'viem'

function TokenBalance() {
  const { data, isLoading, error, refetch } = useReadContract({
    address: '0x...', // 合约地址
    abi: erc20Abi,    // 合约 ABI
    functionName: 'balanceOf',
    args: ['0x...'],  // 函数参数
    // 可选配置
    chainId: 1,       // 指定链
    query: {
      enabled: true,  // 是否启用查询
      refetchInterval: 10000, // 自动刷新间隔（毫秒）
    },
  })

  if (isLoading) return <p>Loading...</p>
  if (error) return <p>Error: {error.message}</p>

  return <p>Balance: {data?.toString()}</p>
}
```

**关键参数：**
- `address` - 合约地址
- `abi` - 合约 ABI
- `functionName` - 函数名（类型安全）
- `args` - 函数参数数组
- `chainId` - 可选，指定链 ID

**返回值：**
- `data` - 返回值（类型安全）
- `isLoading` - 是否加载中
- `error` - 错误信息
- `refetch()` - 手动刷新

---

### 5.2 useReadContracts

批量读取多个合约。

```typescript
import { useReadContracts } from 'wagmi'

function MultiRead() {
  const { data, isLoading } = useReadContracts({
    contracts: [
      {
        address: '0x...',
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: ['0x...'],
      },
      {
        address: '0x...',
        abi: erc20Abi,
        functionName: 'totalSupply',
      },
      {
        address: '0x...',
        abi: erc20Abi,
        functionName: 'decimals',
      },
    ],
  })

  // data 是数组: [result1, result2, result3]
  return (
    <div>
      <p>Balance: {data?.[0]?.result?.toString()}</p>
      <p>Supply: {data?.[1]?.result?.toString()}</p>
      <p>Decimals: {data?.[2]?.result?.toString()}</p>
    </div>
  )
}
```

**优势：**
- 一次请求获取多个数据
- 减少 RPC 调用次数
- 自动并行处理

---

### 5.3 useWriteContract

写入合约（执行交易）。

```typescript
import { useWriteContract } from 'wagmi'
import { erc20Abi, parseEther } from 'viem'

function TransferButton() {
  const {
    writeContract,
    data: hash,      // 交易哈希
    isPending,       // 是否等待用户确认
    isSuccess,       // 是否成功
    error,
  } = useWriteContract()

  const handleTransfer = () => {
    writeContract({
      address: '0x...',
      abi: erc20Abi,
      functionName: 'transfer',
      args: ['0xRecipient', parseEther('1')],
      // 可选：支付 ETH（payable 函数）
      value: parseEther('0.01'),
    })
  }

  return (
    <div>
      <button onClick={handleTransfer} disabled={isPending}>
        {isPending ? 'Confirming...' : 'Transfer'}
      </button>
      {isSuccess && <p>Transaction: {hash}</p>}
      {error && <p>Error: {error.message}</p>}
    </div>
  )
}
```

**流程：**
1. 用户点击按钮
2. `isPending = true`（等待钱包确认）
3. 用户在钱包中确认
4. 交易发送到区块链
5. 返回交易哈希 `hash`
6. `isSuccess = true`

**注意：**
- `writeContract` 仅发送交易，不等待确认
- 需要配合 `useWaitForTransactionReceipt` 等待确认

---

### 5.4 useSimulateContract

模拟合约调用（交易前验证）。

```typescript
import { useSimulateContract, useWriteContract } from 'wagmi'

function SafeTransfer() {
  // 1. 先模拟交易
  const { data: simulateData } = useSimulateContract({
    address: '0x...',
    abi: erc20Abi,
    functionName: 'transfer',
    args: ['0xRecipient', parseEther('1')],
  })

  // 2. 使用模拟结果执行交易
  const { writeContract } = useWriteContract()

  const handleTransfer = () => {
    if (simulateData?.request) {
      writeContract(simulateData.request)
    }
  }

  return <button onClick={handleTransfer}>Transfer</button>
}
```

**优势：**
- 提前发现错误（余额不足、权限问题等）
- 预估 gas 费用
- 避免失败的交易

---

### 5.5 useWatchContractEvent

监听合约事件（实时）。

```typescript
import { useWatchContractEvent } from 'wagmi'

function EventListener() {
  useWatchContractEvent({
    address: '0x...',
    abi: erc20Abi,
    eventName: 'Transfer',
    onLogs(logs) {
      console.log('New transfer:', logs)
    },
    // 可选：过滤参数
    args: {
      from: '0xSenderAddress',  // 只监听特定发送者
    },
  })

  return <p>Listening for Transfer events...</p>
}
```

**使用场景：**
- 实时更新 UI（新交易、新铸造等）
- 监听特定地址的活动
- 触发通知

---

## 6. 账户与网络 Hooks

### 6.1 useBalance

获取账户余额。

```typescript
import { useBalance } from 'wagmi'

function Balance() {
  const { data, isLoading } = useBalance({
    address: '0x...',
    // 可选：查询代币余额
    token: '0xTokenAddress',
    // 可选：指定链
    chainId: 1,
  })

  return (
    <p>
      Balance: {data?.formatted} {data?.symbol}
    </p>
  )
}
```

**返回值：**
- `data.value` - 余额（bigint，wei）
- `data.formatted` - 格式化余额（字符串）
- `data.symbol` - 代币符号（ETH、USDC 等）
- `data.decimals` - 小数位数

---

### 6.2 useChainId

获取当前链 ID。

```typescript
import { useChainId } from 'wagmi'

function CurrentChain() {
  const chainId = useChainId()
  return <p>Current chain ID: {chainId}</p>
}
```

---

### 6.3 useChains

获取配置的链列表。

```typescript
import { useChains } from 'wagmi'

function SupportedChains() {
  const chains = useChains()
  return (
    <ul>
      {chains.map(chain => (
        <li key={chain.id}>{chain.name}</li>
      ))}
    </ul>
  )
}
```

---

## 7. 交易 Hooks

### 7.1 useSendTransaction

发送原生代币（ETH）。

```typescript
import { useSendTransaction } from 'wagmi'
import { parseEther } from 'viem'

function SendETH() {
  const { sendTransaction, data: hash, isPending } = useSendTransaction()

  const handleSend = () => {
    sendTransaction({
      to: '0xRecipient',
      value: parseEther('0.1'),
      // 可选
      data: '0x...', // 附加数据
      gas: 21000n,   // gas limit
    })
  }

  return (
    <button onClick={handleSend} disabled={isPending}>
      Send 0.1 ETH
    </button>
  )
}
```

---

### 7.2 useWaitForTransactionReceipt

等待交易确认。

```typescript
import { useWaitForTransactionReceipt } from 'wagmi'

function TransactionStatus({ hash }: { hash: `0x${string}` }) {
  const {
    data: receipt,
    isLoading,
    isSuccess
  } = useWaitForTransactionReceipt({
    hash,
    confirmations: 2, // 等待 2 个区块确认
  })

  if (isLoading) return <p>Waiting for confirmation...</p>
  if (isSuccess) return <p>Confirmed in block {receipt.blockNumber}</p>
  return null
}
```

**返回值：**
- `receipt.status` - "success" | "reverted"
- `receipt.blockNumber` - 确认的区块号
- `receipt.gasUsed` - 实际使用的 gas
- `receipt.logs` - 事件日志

---

### 7.3 useTransaction

获取交易详情。

```typescript
import { useTransaction } from 'wagmi'

function TransactionDetails({ hash }: { hash: `0x${string}` }) {
  const { data: tx } = useTransaction({ hash })

  return (
    <div>
      <p>From: {tx?.from}</p>
      <p>To: {tx?.to}</p>
      <p>Value: {tx?.value?.toString()}</p>
    </div>
  )
}
```

---

## 8. ENS Hooks

### 8.1 useEnsName

地址 → ENS 名称（反向解析）。

```typescript
import { useEnsName } from 'wagmi'

function ENSName({ address }: { address: `0x${string}` }) {
  const { data: ensName } = useEnsName({ address })
  return <p>{ensName || address}</p>
}
```

---

### 8.2 useEnsAddress

ENS 名称 → 地址。

```typescript
import { useEnsAddress } from 'wagmi'

function ResolveENS({ name }: { name: string }) {
  const { data: address } = useEnsAddress({ name })
  return <p>{address}</p>
}
```

---

### 8.3 useEnsAvatar

获取 ENS 头像。

```typescript
import { useEnsAvatar } from 'wagmi'

function Avatar({ name }: { name: string }) {
  const { data: avatarUrl } = useEnsAvatar({ name })
  return avatarUrl ? <img src={avatarUrl} /> : null
}
```

---

## 9. 实用工具 Hooks

### 9.1 useBlockNumber

获取最新区块号。

```typescript
import { useBlockNumber } from 'wagmi'

function LatestBlock() {
  const { data: blockNumber } = useBlockNumber({
    watch: true, // 自动更新
  })
  return <p>Block: {blockNumber?.toString()}</p>
}
```

---

### 9.2 useBlock

获取区块信息。

```typescript
import { useBlock } from 'wagmi'

function BlockInfo() {
  const { data: block } = useBlock({
    blockNumber: 12345678n,
    // 或使用 blockHash
  })

  return (
    <div>
      <p>Timestamp: {block?.timestamp}</p>
      <p>Transactions: {block?.transactions.length}</p>
    </div>
  )
}
```

---

### 9.3 usePublicClient

获取 viem Public Client（底层 API）。

```typescript
import { usePublicClient } from 'wagmi'

function Component() {
  const publicClient = usePublicClient()

  const fetchData = async () => {
    // 使用 viem 的底层 API
    const balance = await publicClient?.getBalance({ address: '0x...' })
    const blockNumber = await publicClient?.getBlockNumber()
  }

  return <button onClick={fetchData}>Fetch</button>
}
```

---

### 9.4 useWalletClient

获取 viem Wallet Client（签名、交易）。

```typescript
import { useWalletClient } from 'wagmi'

function SignMessage() {
  const { data: walletClient } = useWalletClient()

  const sign = async () => {
    if (!walletClient) return
    const signature = await walletClient.signMessage({
      message: 'Hello, wagmi!',
    })
    console.log(signature)
  }

  return <button onClick={sign}>Sign Message</button>
}
```

---

## 10. Viem 集成

### 10.1 Wagmi 与 Viem 的关系

```
wagmi = React Hooks + 缓存 + 状态管理
viem  = 底层以太坊交互库（类似 ethers.js）
```

**wagmi 内部使用 viem：**
- 所有类型来自 viem（`Address`、`Hash`、`Abi` 等）
- 所有工具函数来自 viem（`parseEther`、`formatEther` 等）
- 需要底层操作时可直接使用 viem

---

### 10.2 常用 Viem 工具

```typescript
import {
  // 类型
  Address,
  Hash,
  Abi,

  // 单位转换
  parseEther,    // "1.0" → 1000000000000000000n
  formatEther,   // 1000000000000000000n → "1.0"
  parseGwei,
  formatGwei,

  // 地址工具
  isAddress,     // 验证地址
  getAddress,    // 校验和格式化

  // 编码工具
  encodeAbiParameters,
  decodeAbiParameters,
  encodeFunctionData,
  decodeFunctionData,

  // 哈希工具
  keccak256,
  toHex,
  fromHex,
} from 'viem'

// 示例
const amount = parseEther('1.5')        // 1.5 ETH in wei
const formatted = formatEther(amount)   // "1.5"
const valid = isAddress('0x...')        // true/false
```

---

### 10.3 何时使用 viem 直接调用

**使用 wagmi hooks（推荐）：**
- 需要 React 状态管理和缓存
- 需要自动刷新
- 标准的合约读写

**使用 viem 直接调用：**
- 一次性操作（不需要缓存）
- 批量操作（multicall）
- 高级用例（自定义编码/解码）

```typescript
import { usePublicClient } from 'wagmi'

function AdvancedComponent() {
  const publicClient = usePublicClient()

  const fetchData = async () => {
    // 使用 viem 的 multicall
    const results = await publicClient?.multicall({
      contracts: [
        { address: '0x...', abi, functionName: 'balanceOf', args: ['0x...'] },
        { address: '0x...', abi, functionName: 'totalSupply' },
      ],
    })
  }
}
```

---

## 11. 在 Scaffold-ETH 2 中的使用

### 11.1 SE-2 对 wagmi 的封装

Scaffold-ETH 2 提供了 **更高层** 的封装：

```typescript
// ❌ 不推荐：直接使用 wagmi
import { useReadContract } from 'wagmi'

const { data } = useReadContract({
  address: '0x...',  // 需要手动填写地址
  abi: contractAbi,  // 需要手动导入 ABI
  functionName: 'greeting',
})

// ✅ 推荐：使用 SE-2 的封装
import { useScaffoldReadContract } from '~~/hooks/scaffold-eth'

const { data } = useScaffoldReadContract({
  contractName: 'YourContract',  // 自动获取地址和 ABI
  functionName: 'greeting',      // 类型安全的函数名
})
```

**SE-2 的优势：**
1. 自动加载合约地址和 ABI
2. 更好的错误处理
3. 自动网络检查
4. 类型安全的函数名和参数
5. 集成通知系统

---

### 11.2 何时使用原生 wagmi

**使用 SE-2 hooks：**
- 与已部署的合约交互（`deployedContracts.ts`）
- 标准的读写操作
- 99% 的常见场景

**使用原生 wagmi hooks：**
- 与未配置的外部合约交互
- 需要 wagmi 的高级特性
- SE-2 没有封装的功能（如 `useSignMessage`）

```typescript
// 示例：签名消息（SE-2 未封装）
import { useSignMessage } from 'wagmi'

const { signMessage } = useSignMessage()

await signMessage({ message: 'Hello!' })
```

---

## 12. 最佳实践

### 12.1 条件查询

避免不必要的请求：

```typescript
// ✅ 好的做法
const { data } = useReadContract({
  address: '0x...',
  abi,
  functionName: 'balanceOf',
  args: [userAddress],
  query: {
    enabled: !!userAddress,  // 只在有地址时查询
  },
})

// ❌ 不好的做法
const { data } = useReadContract({
  address: '0x...',
  abi,
  functionName: 'balanceOf',
  args: [userAddress || '0x0'],  // 会发送无效请求
})
```

---

### 12.2 错误处理

```typescript
const { data, error, isError } = useReadContract({
  address: '0x...',
  abi,
  functionName: 'balanceOf',
  args: [address],
})

if (isError) {
  console.error('Failed to fetch balance:', error)
  return <p>Error: {error.message}</p>
}
```

---

### 12.3 缓存控制

```typescript
const { data, refetch } = useReadContract({
  address: '0x...',
  abi,
  functionName: 'totalSupply',
  query: {
    refetchInterval: 10000,     // 每 10 秒自动刷新
    staleTime: 5000,            // 5 秒内认为数据是新的
    cacheTime: 60000,           // 缓存 1 分钟
  },
})

// 手动刷新
<button onClick={() => refetch()}>Refresh</button>
```

---

### 12.4 类型安全

利用 TypeScript 的类型推导：

```typescript
import { erc20Abi } from 'viem'

// 返回值自动推导类型
const { data: balance } = useReadContract({
  address: '0x...',
  abi: erc20Abi,
  functionName: 'balanceOf',  // 自动补全
  args: ['0x...'],            // 类型检查
})

// balance 的类型自动推导为 bigint
console.log(balance?.toString())
```

---

## 13. 常见模式

### 13.1 连接钱包 + 读取余额

```typescript
import { useAccount, useBalance } from 'wagmi'

function WalletInfo() {
  const { address, isConnected } = useAccount()
  const { data: balance } = useBalance({
    address,
    query: { enabled: !!address },
  })

  if (!isConnected) return <ConnectButton />

  return (
    <div>
      <p>Address: {address}</p>
      <p>Balance: {balance?.formatted} {balance?.symbol}</p>
    </div>
  )
}
```

---

### 13.2 交易流程（写入 + 等待确认）

```typescript
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useState } from 'react'

function MintNFT() {
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>()

  // 1. 写入合约
  const { writeContract, isPending } = useWriteContract()

  // 2. 等待确认
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  const handleMint = async () => {
    const hash = await writeContract({
      address: '0x...',
      abi,
      functionName: 'mint',
      args: [1n],
    })
    setTxHash(hash)
  }

  return (
    <div>
      <button onClick={handleMint} disabled={isPending || isConfirming}>
        {isPending ? 'Waiting for approval...' :
         isConfirming ? 'Confirming...' :
         'Mint NFT'}
      </button>
      {isSuccess && <p>Minted successfully!</p>}
    </div>
  )
}
```

---

### 13.3 多链支持

```typescript
import { useAccount, useSwitchChain } from 'wagmi'
import { mainnet, polygon } from 'wagmi/chains'

function MultiChain() {
  const { chainId } = useAccount()
  const { switchChain } = useSwitchChain()

  const isWrongNetwork = chainId !== mainnet.id

  if (isWrongNetwork) {
    return (
      <button onClick={() => switchChain({ chainId: mainnet.id })}>
        Switch to Mainnet
      </button>
    )
  }

  return <YourApp />
}
```

---

### 13.4 条件渲染（已连接/未连接）

```typescript
import { useAccount } from 'wagmi'

function ProtectedComponent() {
  const { isConnected } = useAccount()

  if (!isConnected) {
    return (
      <div>
        <h2>Please connect your wallet</h2>
        <ConnectButton />
      </div>
    )
  }

  return <YourProtectedContent />
}
```

---

## 14. 故障排查

### 14.1 "Connector not found"

**原因：** 用户没有安装 MetaMask 或钱包插件。

**解决：**
```typescript
import { useConnect } from 'wagmi'

const { connectors } = useConnect()
const hasInjected = connectors.some(c => c.id === 'injected')

if (!hasInjected) {
  return <p>Please install MetaMask</p>
}
```

---

### 14.2 "Chain not configured"

**原因：** 尝试访问未在 config 中配置的链。

**解决：**
```typescript
// 确保链已添加到 config
const config = createConfig({
  chains: [mainnet, sepolia, polygon],  // 添加所需的链
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [polygon.id]: http(),
  },
})
```

---

### 14.3 读取合约失败

**原因：**
- 合约地址错误
- ABI 不匹配
- 网络错误
- 函数不存在

**调试：**
```typescript
const { data, error, isError } = useReadContract({
  address: '0x...',
  abi,
  functionName: 'myFunction',
})

console.log('Error:', error)  // 查看具体错误信息
```

---

### 14.4 交易失败

**常见原因：**
- Gas 不足
- 余额不足
- 合约 revert（业务逻辑错误）
- Nonce 错误

**调试：**
```typescript
import { useWriteContract } from 'wagmi'

const { writeContract, error } = useWriteContract()

try {
  await writeContract({...})
} catch (error) {
  console.error('Transaction failed:', error)
  // 检查 error.shortMessage 或 error.message
}
```

---

## 15. 常用代码片段

### 15.1 完整的连接流程

```typescript
import { useAccount, useConnect, useDisconnect } from 'wagmi'

function WalletButton() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  if (isConnected) {
    return (
      <div>
        <p>Connected: {address}</p>
        <button onClick={() => disconnect()}>Disconnect</button>
      </div>
    )
  }

  return (
    <div>
      {connectors.map((connector) => (
        <button key={connector.id} onClick={() => connect({ connector })}>
          Connect {connector.name}
        </button>
      ))}
    </div>
  )
}
```

---

### 15.2 ERC20 代币转账

```typescript
import { useWriteContract } from 'wagmi'
import { erc20Abi, parseUnits } from 'viem'

function TransferToken() {
  const { writeContract } = useWriteContract()

  const transfer = async () => {
    await writeContract({
      address: '0xTokenAddress',
      abi: erc20Abi,
      functionName: 'transfer',
      args: [
        '0xRecipient',
        parseUnits('100', 18),  // 100 tokens with 18 decimals
      ],
    })
  }

  return <button onClick={transfer}>Transfer 100 Tokens</button>
}
```

---

### 15.3 读取 NFT metadata

```typescript
import { useReadContract } from 'wagmi'

function NFTMetadata({ tokenId }: { tokenId: bigint }) {
  const { data: tokenURI } = useReadContract({
    address: '0xNFTAddress',
    abi: [
      {
        name: 'tokenURI',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        outputs: [{ name: '', type: 'string' }],
      },
    ],
    functionName: 'tokenURI',
    args: [tokenId],
  })

  return <p>Token URI: {tokenURI}</p>
}
```

---

## 16. 学习资源

### 官方文档
- **wagmi**: https://wagmi.sh
- **viem**: https://viem.sh
- **TanStack Query**: https://tanstack.com/query

### 推荐阅读顺序
1. wagmi 快速开始（Getting Started）
2. wagmi Hooks API（重点：useAccount, useReadContract, useWriteContract）
3. viem 工具函数（parseEther, formatEther 等）
4. SE-2 文档（了解封装层）

---

## 总结

**wagmi 核心概念：**
1. ✅ Config + Connectors + Chains = 配置层
2. ✅ WagmiProvider + QueryClientProvider = 提供者层
3. ✅ Hooks = 功能层（钱包、合约、交易、ENS 等）
4. ✅ viem = 底层工具库

**最常用的 5 个 Hooks：**
1. `useAccount()` - 获取账户信息
2. `useConnect()` - 连接钱包
3. `useReadContract()` - 读取合约
4. `useWriteContract()` - 写入合约
5. `useWaitForTransactionReceipt()` - 等待交易确认

**在 SE-2 中的建议：**
- ⚠️ 优先使用 SE-2 的 `useScaffoldXxx` hooks
- ⚠️ 仅在 SE-2 未封装时使用原生 wagmi hooks
- ⚠️ 始终利用 TypeScript 类型安全

---

**准备好开始开发了吗？** 🚀

如有疑问，随时参考本文档或查阅官方文档！
