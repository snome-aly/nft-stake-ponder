# Web3 技术栈完整架构文档

全面解析 Wagmi、RainbowKit、钱包连接器、Provider、Transport 等核心概念及其在 dApp 中的交互流程。

---

## 目录
1. [整体架构图](#整体架构图)
2. [核心概念详解](#核心概念详解)
3. [交互流程详解](#交互流程详解)
4. [实际代码示例](#实际代码示例)
5. [常见场景分析](#常见场景分析)

---

## 整体架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                           你的 dApp (React)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                      RainbowKit                               │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │  UI 组件：连接按钮、钱包选择弹窗、账户信息            │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  │  功能：提供美观的钱包连接 UI，简化用户体验                  │  │
│  └────────────────┬─────────────────────────────────────────────┘  │
│                   │ 调用                                             │
│  ┌────────────────▼─────────────────────────────────────────────┐  │
│  │                         Wagmi                                 │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │  React Hooks API:                                      │  │  │
│  │  │  - useAccount()     获取连接的账户                     │  │  │
│  │  │  - useConnect()     连接钱包                           │  │  │
│  │  │  - useReadContract() 读取合约数据                      │  │  │
│  │  │  - useWriteContract() 写入合约                         │  │  │
│  │  │  - useBalance()     查询余额                           │  │  │
│  │  │  - useTransaction() 查询交易                           │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  │                                                                │  │
│  │  功能：状态管理、缓存、自动重连、类型安全                    │  │
│  └────────────────┬─────────────────────────────────────────────┘  │
│                   │ 依赖                                             │
│  ┌────────────────▼─────────────────────────────────────────────┐  │
│  │                    Wagmi Config                               │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │  配置项：                                              │  │  │
│  │  │  - chains: 支持的区块链列表                           │  │  │
│  │  │  - connectors: 钱包连接器列表                         │  │  │
│  │  │  - transports: 每条链的 RPC 传输配置                  │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  └────────────────┬─────────────────────────────────────────────┘  │
│                   │                                                  │
└───────────────────┼──────────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┬──────────────────┐
        │                       │                  │
        ▼                       ▼                  ▼
┌───────────────┐      ┌────────────────┐  ┌──────────────┐
│  Connectors   │      │   Transports   │  │    Chains    │
│  (连接器)     │      │   (传输层)     │  │   (链配置)   │
├───────────────┤      ├────────────────┤  ├──────────────┤
│ - injected    │      │ - http()       │  │ - mainnet    │
│ - walletConnect│     │ - webSocket()  │  │ - sepolia    │
│ - coinbase    │      │ - fallback()   │  │ - hardhat    │
│ - safe        │      │ - custom()     │  │ - polygon    │
└───────┬───────┘      └────────┬───────┘  └──────┬───────┘
        │                       │                  │
        │        ┌──────────────┴──────────────────┘
        │        │
        ▼        ▼
┌─────────────────────────────────────────────────┐
│              Viem (底层库)                       │
├─────────────────────────────────────────────────┤
│  提供两种客户端：                                │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │  Public Client (publicClient)             │ │
│  │  - 只读操作                                │ │
│  │  - 查询余额、合约状态、交易记录            │ │
│  │  - 估算 Gas                                │ │
│  │  - 监听事件                                │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │  Wallet Client (walletClient)             │ │
│  │  - 需要私钥/账户                           │ │
│  │  - 签名交易                                │ │
│  │  - 发送交易                                │ │
│  │  - 签名消息                                │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  功能：底层以太坊交互、类型安全、性能优化       │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
        ┌────────────────┐
        │  JSON-RPC API  │
        └────────┬───────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
    ▼            ▼            ▼
┌─────────┐  ┌──────┐  ┌──────────┐
│ MetaMask│  │ RPC  │  │ 其他钱包 │
│         │  │ 节点 │  │          │
└────┬────┘  └───┬──┘  └────┬─────┘
     │           │          │
     └───────────┼──────────┘
                 │
                 ▼
        ┌────────────────┐
        │  以太坊网络    │
        │  (区块链)      │
        └────────────────┘
```

---

## 核心概念详解

### 1. Chains (链配置)

**定义：** 区块链网络的配置对象

```typescript
// 示例：以太坊主网配置
const mainnet = {
  id: 1,                                    // Chain ID
  name: 'Ethereum',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrls: {
    default: { http: ['https://eth.llamarpc.com'] },
    public: { http: ['https://eth.llamarpc.com'] }
  },
  blockExplorers: {
    default: {
      name: 'Etherscan',
      url: 'https://etherscan.io'
    }
  },
  contracts: {
    ensRegistry: { address: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e' },
    // ... 其他常用合约
  }
}
```

**作用：**
- 定义网络基本信息（ID、名称、货币）
- 配置 RPC 端点（默认和备用）
- 配置区块浏览器
- 预定义常用合约地址

**位置：** 在 `wagmiConfig` 中注册，供整个应用使用

---

### 2. Transport (传输层)

**定义：** 连接到区块链节点的通信方式

```typescript
import { http, webSocket, fallback } from 'viem'

// HTTP 传输（最常用）
const httpTransport = http('https://eth-mainnet.g.alchemy.com/v2/YOUR-KEY')

// WebSocket 传输（实时监听）
const wsTransport = webSocket('wss://eth-mainnet.g.alchemy.com/v2/YOUR-KEY')

// 回退传输（多个 RPC 备份）
const fallbackTransport = fallback([
  http('https://eth-mainnet.g.alchemy.com/v2/YOUR-KEY'),
  http('https://mainnet.infura.io/v3/YOUR-KEY'),
  http('https://cloudflare-eth.com')
])
```

**类型对比：**

| 类型 | 优点 | 缺点 | 使用场景 |
|------|------|------|----------|
| `http()` | 简单、稳定、广泛支持 | 不支持实时订阅 | 普通读写操作 |
| `webSocket()` | 实时推送、低延迟 | 连接可能断开 | 监听区块、事件 |
| `fallback()` | 高可用性、自动切换 | 配置复杂 | 生产环境 |
| `custom()` | 完全自定义 | 需要自己实现 | 特殊需求 |

**作用：**
- 与 RPC 节点通信
- 发送 JSON-RPC 请求
- 处理网络错误和重试
- 管理连接池

**位置：** 在 `wagmiConfig` 的 `transports` 中，为每条链配置

---

### 3. Connectors (连接器)

**定义：** 连接不同钱包的适配器

```typescript
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors'

// 浏览器注入钱包（MetaMask、Rabby 等）
const injectedConnector = injected({
  target: 'metaMask',  // 可选：指定特定钱包
})

// WalletConnect（移动端钱包）
const walletConnectConnector = walletConnect({
  projectId: 'YOUR_PROJECT_ID',
  metadata: {
    name: 'My dApp',
    description: 'My dApp description',
    url: 'https://myapp.com',
    icons: ['https://myapp.com/icon.png']
  }
})

// Coinbase Wallet
const coinbaseConnector = coinbaseWallet({
  appName: 'My dApp',
})
```

**常见连接器：**

| 连接器 | 支持的钱包 | 使用场景 |
|--------|-----------|----------|
| `injected` | MetaMask、Rabby、Brave Wallet 等 | 桌面浏览器 |
| `walletConnect` | Trust Wallet、Rainbow、Argent 等 200+ | 移动端 |
| `coinbaseWallet` | Coinbase Wallet | Coinbase 生态 |
| `safe` | Gnosis Safe 多签钱包 | 团队/DAO |
| `ledger` | Ledger 硬件钱包 | 高安全需求 |

**作用：**
- 抽象不同钱包的连接方式
- 统一接口处理账户、签名、发送交易
- 管理连接状态

**位置：** 在 `wagmiConfig` 的 `connectors` 数组中

---

### 4. Viem Clients (客户端)

Viem 提供两种客户端，分别用于不同场景：

#### 4.1 Public Client (公共客户端)

```typescript
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http()
})
```

**功能：只读操作**
- `getBalance()` - 查询余额
- `getBlockNumber()` - 获取最新区块
- `readContract()` - 读取合约状态
- `getTransaction()` - 查询交易
- `estimateGas()` - 估算 gas
- `watchBlockNumber()` - 监听新区块
- `watchContractEvent()` - 监听合约事件

**特点：**
- 不需要私钥
- 不能签名或发送交易
- 可以用公共 RPC 节点

#### 4.2 Wallet Client (钱包客户端)

```typescript
import { createWalletClient, custom } from 'viem'
import { mainnet } from 'viem/chains'

const walletClient = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum)  // 使用浏览器钱包
})
```

**功能：需要私钥的操作**
- `signMessage()` - 签名消息
- `signTypedData()` - 签名结构化数据（EIP-712）
- `sendTransaction()` - 发送交易
- `writeContract()` - 调用合约写入方法
- `deployContract()` - 部署合约

**特点：**
- 需要账户/私钥
- 通过钱包签名
- 可以改变区块链状态

---

### 5. Provider (提供者)

**历史概念：** 在旧的 Web3 库（ethers.js v5、web3.js）中使用

```typescript
// 旧方式 (ethers.js v5)
const provider = new ethers.providers.Web3Provider(window.ethereum)
```

**现代方式：** Viem 和 Wagmi 使用 `publicClient` 和 `walletClient` 替代

```typescript
// 新方式 (viem + wagmi)
const publicClient = usePublicClient()  // 等同于旧的 provider
const walletClient = useWalletClient()  // 等同于旧的 signer
```

**对比：**

| 概念 | 旧库 (ethers v5) | 新库 (viem/wagmi) |
|------|-----------------|------------------|
| 只读操作 | Provider | Public Client |
| 签名发送 | Signer | Wallet Client |
| 获取方式 | `new Provider()` | `usePublicClient()` |

---

### 6. Wagmi

**定义：** React Hooks for Ethereum

```typescript
import { useAccount, useConnect, useReadContract } from 'wagmi'

function MyComponent() {
  // 获取连接状态
  const { address, isConnected } = useAccount()

  // 连接钱包
  const { connect, connectors } = useConnect()

  // 读取合约
  const { data } = useReadContract({
    address: '0x...',
    abi: contractABI,
    functionName: 'balanceOf',
    args: [address]
  })
}
```

**核心 Hooks：**

| Hook | 用途 | 返回值 |
|------|------|--------|
| `useAccount()` | 获取当前账户 | `address`, `isConnected`, `chain` |
| `useConnect()` | 连接钱包 | `connect()`, `connectors`, `status` |
| `useDisconnect()` | 断开连接 | `disconnect()` |
| `useBalance()` | 查询余额 | `data`, `isLoading` |
| `useReadContract()` | 读取合约 | `data`, `refetch()` |
| `useWriteContract()` | 写入合约 | `writeContract()`, `data` |
| `useWaitForTransactionReceipt()` | 等待交易确认 | `data`, `isLoading` |
| `useWatchContractEvent()` | 监听合约事件 | 实时事件 |
| `useSignMessage()` | 签名消息 | `signMessage()` |
| `useSignTypedData()` | 签名结构化数据 | `signTypedData()` |

**作用：**
- 提供 React 友好的 API
- 自动管理状态和缓存
- 处理重连和网络切换
- TypeScript 类型安全

---

### 7. RainbowKit

**定义：** 美观的钱包连接 UI 库

```typescript
import { ConnectButton } from '@rainbow-me/rainbowkit'

function App() {
  return <ConnectButton />
}
```

**功能：**
- 钱包选择弹窗（支持 MetaMask、WalletConnect 等）
- 连接按钮组件
- 账户信息展示
- 网络切换 UI
- 主题定制

**内置组件：**

```typescript
// 完整连接按钮（推荐）
<ConnectButton />

// 只显示账户信息
<ConnectButton.Custom>
  {({ account, chain, openAccountModal, openChainModal, openConnectModal }) => {
    return (
      <div>
        {account ? (
          <button onClick={openAccountModal}>{account.displayName}</button>
        ) : (
          <button onClick={openConnectModal}>Connect</button>
        )}
      </div>
    )
  }}
</ConnectButton.Custom>
```

**作用：**
- 简化钱包连接 UI 开发
- 提供一致的用户体验
- 自动处理多链切换
- 响应式设计

---

## 交互流程详解

### 场景 1：用户连接钱包

```
用户点击 "Connect Wallet"
         │
         ▼
┌─────────────────────────────────────────┐
│ RainbowKit 显示钱包选择弹窗              │
│ - MetaMask                               │
│ - WalletConnect                          │
│ - Coinbase Wallet                        │
└─────────────────┬───────────────────────┘
                  │ 用户选择 MetaMask
                  ▼
┌─────────────────────────────────────────┐
│ Wagmi 调用 injected connector            │
│ connector.connect()                      │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ Connector 通过 window.ethereum 与钱包通信│
│ ethereum.request({                       │
│   method: 'eth_requestAccounts'          │
│ })                                       │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ MetaMask 弹出授权窗口                    │
│ "允许此网站访问您的账户？"               │
└─────────────────┬───────────────────────┘
                  │ 用户点击"连接"
                  ▼
┌─────────────────────────────────────────┐
│ MetaMask 返回账户地址                    │
│ ['0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'] │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ Wagmi 更新全局状态                       │
│ - address: '0x742d...'                   │
│ - isConnected: true                      │
│ - connector: injected                    │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ React 组件重新渲染                       │
│ useAccount() 返回新状态                  │
└─────────────────────────────────────────┘
```

**代码示例：**

```typescript
// RainbowKit + Wagmi
function MyApp() {
  const { address, isConnected } = useAccount()

  return (
    <div>
      <ConnectButton />
      {isConnected && <p>Connected: {address}</p>}
    </div>
  )
}
```

---

### 场景 2：读取合约数据（只读操作）

```
React 组件挂载
         │
         ▼
┌─────────────────────────────────────────┐
│ useReadContract() 被调用                 │
│ {                                        │
│   address: '0xNFT...',                   │
│   abi: stakableNFTABI,                   │
│   functionName: 'balanceOf',             │
│   args: ['0x742d...']                    │
│ }                                        │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ Wagmi 检查缓存                           │
│ - 如果有缓存且未过期，直接返回            │
│ - 如果无缓存或过期，继续请求              │
└─────────────────┬───────────────────────┘
                  │ 无缓存，发起请求
                  ▼
┌─────────────────────────────────────────┐
│ Wagmi 通过 Public Client 发送请求        │
│ publicClient.readContract({...})         │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ Viem 构造 JSON-RPC 请求                  │
│ {                                        │
│   jsonrpc: '2.0',                        │
│   method: 'eth_call',                    │
│   params: [{                             │
│     to: '0xNFT...',                      │
│     data: '0x70a08231...' // 编码的函数调用 │
│   }, 'latest']                           │
│ }                                        │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ Transport 层发送 HTTP 请求               │
│ POST https://eth-mainnet.g.alchemy.com   │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ RPC 节点（Alchemy）处理请求              │
│ - 读取区块链状态                         │
│ - 执行合约只读函数                       │
│ - 返回结果                               │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ Viem 解析返回值                          │
│ 根据 ABI 解码返回数据                    │
│ '0x0000...0003' → BigInt(3)              │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ Wagmi 缓存结果并更新状态                 │
│ - data: 3n                               │
│ - isLoading: false                       │
│ - isSuccess: true                        │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ React 组件重新渲染                       │
│ 显示 "You have 3 NFTs"                   │
└─────────────────────────────────────────┘
```

**关键点：**
- 不需要钱包连接（可以在未连接状态下读取）
- 使用 Public Client
- 通过 RPC 节点读取，不消耗 gas
- Wagmi 自动缓存和重新验证

**代码示例：**

```typescript
function NFTBalance({ address }: { address: Address }) {
  const { data: balance, isLoading } = useReadContract({
    address: '0xNFTContractAddress',
    abi: stakableNFTABI,
    functionName: 'balanceOf',
    args: [address],
  })

  if (isLoading) return <div>Loading...</div>
  return <div>Balance: {balance?.toString()}</div>
}
```

---

### 场景 3：发送交易（写入操作）

```
用户点击 "Stake NFT" 按钮
         │
         ▼
┌─────────────────────────────────────────┐
│ useWriteContract() 的 writeContract()    │
│ 被调用                                   │
│ {                                        │
│   address: '0xNFT...',                   │
│   abi: stakableNFTABI,                   │
│   functionName: 'stake',                 │
│   args: [tokenId],                       │
│   value: parseEther('0.01') // 可选      │
│ }                                        │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ Wagmi 获取 Wallet Client                 │
│ const walletClient = getWalletClient()   │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ Viem 构造交易对象                        │
│ {                                        │
│   from: '0x742d...',                     │
│   to: '0xNFT...',                        │
│   data: '0xa694fc3a...', // 编码的函数   │
│   value: 10000000000000000n, // wei      │
│   gas: ?,  // 待估算                     │
│   gasPrice: ?, // 待估算                 │
│ }                                        │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ Viem 估算 Gas（通过 Public Client）      │
│ publicClient.estimateGas({...})          │
│ → gas: 150000                            │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ Viem 获取当前 Gas Price                  │
│ publicClient.getGasPrice()               │
│ → gasPrice: 20000000000 (20 Gwei)        │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ Wallet Client 请求钱包签名               │
│ walletClient.writeContract({...})        │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ Connector 通过 window.ethereum 请求签名  │
│ ethereum.request({                       │
│   method: 'eth_sendTransaction',         │
│   params: [{ from, to, data, value, gas, gasPrice }] │
│ })                                       │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ MetaMask 弹出确认窗口                    │
│ ┌─────────────────────────────────────┐ │
│ │ Stake NFT                            │ │
│ │ Contract: 0xNFT...                   │ │
│ │ Function: stake(1)                   │ │
│ │ Value: 0.01 ETH                      │ │
│ │ Gas: 150000 × 20 Gwei = 0.003 ETH    │ │
│ │ Total: 0.013 ETH                     │ │
│ │                                      │ │
│ │ [拒绝]  [确认]                        │ │
│ └─────────────────────────────────────┘ │
└─────────────────┬───────────────────────┘
                  │ 用户点击"确认"
                  ▼
┌─────────────────────────────────────────┐
│ MetaMask 用私钥签名交易                  │
│ - 签名是在本地完成，私钥不离开钱包        │
│ → 签名结果: { r, s, v }                 │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ MetaMask 通过自己的 RPC 发送交易         │
│ (注意：是 MetaMask 发送，不是 dApp)       │
│ POST https://mainnet.infura.io/...       │
│ {                                        │
│   method: 'eth_sendRawTransaction',      │
│   params: ['0x签名后的完整交易']          │
│ }                                        │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ RPC 节点验证并广播交易到以太坊网络        │
│ - 验证签名                               │
│ - 检查 nonce                             │
│ - 广播到矿工/验证者                      │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ 返回交易哈希                             │
│ txHash: '0x123abc...'                    │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ Wagmi 更新状态                           │
│ - data: '0x123abc...'                    │
│ - isPending: false                       │
│ - isSuccess: true                        │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ React 组件可以使用                       │
│ useWaitForTransactionReceipt()           │
│ 等待交易被矿工打包确认                    │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ 交易被打包进区块                         │
│ - 状态从 pending 变为 success/reverted    │
│ - 可以获取 TransactionReceipt            │
└─────────────────────────────────────────┘
```

**代码示例：**

```typescript
function StakeButton({ tokenId }: { tokenId: bigint }) {
  const { writeContract, data: hash, isPending } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } =
    useWaitForTransactionReceipt({ hash })

  const handleStake = async () => {
    writeContract({
      address: '0xNFTContractAddress',
      abi: stakableNFTABI,
      functionName: 'stake',
      args: [tokenId],
    })
  }

  return (
    <div>
      <button onClick={handleStake} disabled={isPending}>
        {isPending ? 'Waiting for approval...' : 'Stake NFT'}
      </button>
      {hash && <div>Transaction Hash: {hash}</div>}
      {isConfirming && <div>Waiting for confirmation...</div>}
      {isSuccess && <div>Staked successfully!</div>}
    </div>
  )
}
```

---

### 场景 4：监听合约事件（实时数据）

```
组件挂载，开始监听事件
         │
         ▼
┌─────────────────────────────────────────┐
│ useWatchContractEvent() 被调用           │
│ {                                        │
│   address: '0xNFT...',                   │
│   abi: stakableNFTABI,                   │
│   eventName: 'Staked',                   │
│   onLogs: (logs) => { ... }              │
│ }                                        │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ Wagmi 通过 Public Client 创建监听        │
│ publicClient.watchContractEvent({...})   │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ 如果 Transport 是 HTTP                   │
│ - 使用轮询方式 (polling)                 │
│ - 每隔 N 秒查询一次新事件                 │
│ - publicClient.getLogs() 每 4 秒          │
└─────────────────┬───────────────────────┘
        或         │
┌─────────────────────────────────────────┐
│ 如果 Transport 是 WebSocket              │
│ - 使用订阅方式 (subscription)            │
│ - 实时接收事件推送                       │
│ - ws.send({ method: 'eth_subscribe' })   │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ 区块链上发生 Staked 事件                 │
│ emit Staked(user, tokenId, timestamp);   │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ RPC 节点检测到事件                       │
│ - HTTP: 在下次轮询时返回                 │
│ - WebSocket: 立即推送                    │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ Viem 解析事件日志                        │
│ {                                        │
│   eventName: 'Staked',                   │
│   args: {                                │
│     user: '0x742d...',                   │
│     tokenId: 1n,                         │
│     timestamp: 1699999999n               │
│   },                                     │
│   blockNumber: 18500000n,                │
│   transactionHash: '0xabc...'            │
│ }                                        │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ Wagmi 调用 onLogs 回调                   │
│ onLogs([parsedLog])                      │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ React 组件更新                           │
│ - 添加新事件到列表                       │
│ - 显示通知                               │
│ - 刷新相关数据                           │
└─────────────────────────────────────────┘
```

**代码示例：**

```typescript
function StakeEventList() {
  const [events, setEvents] = useState<any[]>([])

  useWatchContractEvent({
    address: '0xNFTContractAddress',
    abi: stakableNFTABI,
    eventName: 'Staked',
    onLogs(logs) {
      console.log('New stake events:', logs)
      setEvents(prev => [...prev, ...logs])
    },
  })

  return (
    <div>
      <h3>Recent Stake Events</h3>
      {events.map((event, i) => (
        <div key={i}>
          User {event.args.user} staked token #{event.args.tokenId.toString()}
        </div>
      ))}
    </div>
  )
}
```

---

### 场景 5：切换网络

```
用户点击切换到 Polygon
         │
         ▼
┌─────────────────────────────────────────┐
│ useSwitchChain() 的 switchChain()        │
│ switchChain({ chainId: 137 })            │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ Wagmi 检查目标链是否已配置               │
│ - 在 wagmiConfig.chains 中查找            │
│ - 找到 polygon 配置                      │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ Connector 请求钱包切换网络               │
│ ethereum.request({                       │
│   method: 'wallet_switchEthereumChain',  │
│   params: [{ chainId: '0x89' }] // 137   │
│ })                                       │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ MetaMask 检查是否已添加该网络            │
│ - 如果已添加，直接切换                   │
│ - 如果未添加，返回错误                   │
└─────────────────┬───────────────────────┘
        │          │
        │ 已添加    │ 未添加（错误 4902）
        ▼          ▼
   直接切换  ┌──────────────────────────┐
        │    │ 需要先添加网络            │
        │    │ ethereum.request({        │
        │    │   method: 'wallet_addEthereumChain', │
        │    │   params: [{              │
        │    │     chainId: '0x89',      │
        │    │     chainName: 'Polygon', │
        │    │     rpcUrls: ['https://polygon-rpc.com'], │
        │    │     nativeCurrency: { name: 'MATIC', ... } │
        │    │   }]                      │
        │    │ })                        │
        │    └──────────┬────────────────┘
        │               │
        └───────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ MetaMask 弹出确认窗口                    │
│ "允许此网站切换到 Polygon 网络？"         │
└─────────────────┬───────────────────────┘
                  │ 用户确认
                  ▼
┌─────────────────────────────────────────┐
│ 钱包切换到新网络                         │
│ - 触发 chainChanged 事件                 │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ Connector 监听到网络变化                 │
│ ethereum.on('chainChanged', (chainId))   │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ Wagmi 更新全局状态                       │
│ - chain: polygon                         │
│ - chainId: 137                           │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ 所有 hooks 重新获取数据                  │
│ - useReadContract() 使用新链的 RPC       │
│ - useBalance() 查询新链余额              │
│ - 合约地址可能不同                       │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ React 组件重新渲染                       │
│ - 显示新的网络名称                       │
│ - 更新相关数据                           │
└─────────────────────────────────────────┘
```

**代码示例：**

```typescript
import { useSwitchChain, useChainId } from 'wagmi'
import { polygon, mainnet } from 'wagmi/chains'

function NetworkSwitcher() {
  const chainId = useChainId()
  const { switchChain, chains } = useSwitchChain()

  return (
    <div>
      <p>Current: {chainId}</p>
      {chains.map(chain => (
        <button
          key={chain.id}
          onClick={() => switchChain({ chainId: chain.id })}
          disabled={chainId === chain.id}
        >
          {chain.name}
        </button>
      ))}
    </div>
  )
}
```

---

## 实际代码示例

### 完整配置示例

```typescript
// wagmiConfig.ts
import { http, createConfig } from 'wagmi'
import { mainnet, sepolia, hardhat } from 'wagmi/chains'
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors'

// 1. 定义支持的链
const chains = [mainnet, sepolia, hardhat] as const

// 2. 配置连接器
const connectors = [
  injected({
    target: 'metaMask'
  }),
  walletConnect({
    projectId: 'YOUR_WALLETCONNECT_PROJECT_ID'
  }),
  coinbaseWallet({
    appName: 'My NFT Staking dApp'
  }),
]

// 3. 配置 Transports（每条链的 RPC）
const transports = {
  [mainnet.id]: http('https://eth-mainnet.g.alchemy.com/v2/YOUR-KEY'),
  [sepolia.id]: http('https://eth-sepolia.g.alchemy.com/v2/YOUR-KEY'),
  [hardhat.id]: http('http://127.0.0.1:8545'),
}

// 4. 创建 Wagmi Config
export const config = createConfig({
  chains,
  connectors,
  transports,
})
```

```typescript
// App.tsx
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { config } from './wagmiConfig'

const queryClient = new QueryClient()

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <YourDApp />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
```

### Scaffold-ETH 2 推荐方式

在你的项目中，应该使用 Scaffold-ETH 的 hooks：

```typescript
// 读取合约
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth"

const { data: totalStaked } = useScaffoldReadContract({
  contractName: "StakableNFT",  // 自动从 deployedContracts.ts 获取地址
  functionName: "totalStaked",
})

// 写入合约
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth"

const { writeContractAsync } = useScaffoldWriteContract("StakableNFT")

await writeContractAsync({
  functionName: "stake",
  args: [tokenId],
})

// 监听事件
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth"

const { data: stakeEvents } = useScaffoldEventHistory({
  contractName: "StakableNFT",
  eventName: "Staked",
  fromBlock: 0n,
  watch: true,  // 实时更新
})
```

---

## 常见场景分析

### 场景对比表

| 场景 | 需要连接钱包？ | 使用的 Client | 消耗 Gas？ | RPC 调用 |
|------|---------------|--------------|-----------|---------|
| 查询合约状态 | ❌ 否 | Public Client | ❌ 否 | `eth_call` |
| 查询余额 | ❌ 否 | Public Client | ❌ 否 | `eth_getBalance` |
| 查询交易记录 | ❌ 否 | Public Client | ❌ 否 | `eth_getTransactionReceipt` |
| 估算 Gas | ❌ 否 | Public Client | ❌ 否 | `eth_estimateGas` |
| 监听事件 | ❌ 否 | Public Client | ❌ 否 | `eth_getLogs` 或 `eth_subscribe` |
| 发送交易 | ✅ 是 | Wallet Client | ✅ 是 | `eth_sendTransaction` |
| 签名消息 | ✅ 是 | Wallet Client | ❌ 否 | `personal_sign` |
| 签名结构化数据 | ✅ 是 | Wallet Client | ❌ 否 | `eth_signTypedData_v4` |
| 部署合约 | ✅ 是 | Wallet Client | ✅ 是 | `eth_sendTransaction` |

### 数据流向图

```
只读操作（不需要钱包）：
dApp → Wagmi → Viem Public Client → Transport → RPC 节点 → 区块链
                                                    ↓
                                              返回数据
                                                    ↓
dApp ← Wagmi ← Viem ← Transport ← RPC 节点 ←─────┘


写入操作（需要钱包）：
dApp → Wagmi → Viem Wallet Client → Connector → MetaMask
                                                    ↓ (签名)
                                                    ↓
                                            MetaMask RPC 节点
                                                    ↓
                                                区块链网络
                                                    ↓
                                            交易被打包确认
                                                    ↓
dApp ← Wagmi ← 监听交易状态 ← RPC 节点 ←──────────┘
```

---

## 关键要点总结

### 1. 层次关系

```
UI 层:         RainbowKit (UI 组件)
               ↓
抽象层:        Wagmi (React Hooks + 状态管理)
               ↓
核心层:        Viem (以太坊交互库)
               ↓
传输层:        Transport (HTTP/WebSocket)
               ↓
节点层:        RPC 节点 (Alchemy/Infura)
               ↓
区块链:        Ethereum/Polygon 等
```

### 2. 职责分工

- **RainbowKit**: 只管 UI，不处理逻辑
- **Wagmi**: 状态管理、缓存、React 集成
- **Viem**: 底层以太坊交互、类型安全
- **Connector**: 连接不同钱包的桥梁
- **Transport**: 与 RPC 节点通信
- **Chains**: 网络配置信息

### 3. 两种 Client 的使用场景

**Public Client (只读):**
- 查询数据（余额、合约状态）
- 估算 Gas
- 监听事件
- 不需要私钥

**Wallet Client (读写):**
- 发送交易
- 签名消息
- 需要用户授权
- 需要支付 Gas

### 4. MetaMask 的三重角色

1. **账户管理器**: 保管私钥
2. **签名工具**: 签名交易和消息
3. **交易广播器**: 通过自己的 RPC 发送交易

### 5. 配置的重要性

正确配置 `wagmiConfig` 是一切的基础：
- `chains`: 决定支持哪些网络
- `connectors`: 决定支持哪些钱包
- `transports`: 决定使用哪些 RPC 节点

### 6. Scaffold-ETH 2 的优势

在你的项目中：
- `useScaffoldReadContract` 自动处理合约地址
- `useScaffoldWriteContract` 自动处理网络切换
- `useScaffoldEventHistory` 简化事件监听
- 所有配置在 `scaffold.config.ts` 统一管理

---

## 最佳实践

### 1. 始终使用 Scaffold-ETH Hooks

```typescript
// ❌ 不推荐
import { useReadContract } from 'wagmi'
const { data } = useReadContract({
  address: '0x123...',  // 硬编码地址
  abi: myABI,
  functionName: 'balanceOf'
})

// ✅ 推荐
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth"
const { data } = useScaffoldReadContract({
  contractName: "StakableNFT",  // 自动处理地址和多链
  functionName: "balanceOf"
})
```

### 2. 配置 Fallback Transport

```typescript
import { fallback, http } from 'wagmi'

const transports = {
  [mainnet.id]: fallback([
    http('https://eth-mainnet.g.alchemy.com/v2/YOUR-KEY'),
    http('https://mainnet.infura.io/v3/YOUR-KEY'),
    http('https://cloudflare-eth.com'),  // 公共节点作为最后备用
  ]),
}
```

### 3. 处理交易状态

```typescript
const { writeContract, data: hash, isPending, error } = useWriteContract()
const { isLoading: isConfirming, isSuccess, isError } =
  useWaitForTransactionReceipt({ hash })

// 完整的状态处理
if (isPending) return <div>等待钱包确认...</div>
if (isConfirming) return <div>交易确认中...</div>
if (isSuccess) return <div>交易成功！</div>
if (isError || error) return <div>交易失败: {error?.message}</div>
```

### 4. 使用 WebSocket 监听实时事件

```typescript
// wagmiConfig.ts
import { webSocket } from 'wagmi'

const transports = {
  [mainnet.id]: webSocket('wss://eth-mainnet.g.alchemy.com/v2/YOUR-KEY'),
}
```

### 5. 错误处理

```typescript
try {
  await writeContractAsync({
    functionName: "stake",
    args: [tokenId],
  })
} catch (error: any) {
  if (error.code === 4001) {
    // 用户拒绝交易
    console.log('用户取消了交易')
  } else if (error.message.includes('insufficient funds')) {
    // 余额不足
    console.log('余额不足')
  } else {
    // 其他错误
    console.error('交易失败:', error)
  }
}
```

---

## 调试技巧

### 1. 查看当前连接状态

```typescript
import { useAccount, useChainId, useConnections } from 'wagmi'

function DebugInfo() {
  const { address, isConnected, connector } = useAccount()
  const chainId = useChainId()
  const connections = useConnections()

  return (
    <pre>
      {JSON.stringify({
        address,
        isConnected,
        connectorName: connector?.name,
        chainId,
        connections: connections.length
      }, null, 2)}
    </pre>
  )
}
```

### 2. 监听所有 Wagmi 事件

```typescript
import { useConfig } from 'wagmi'

const config = useConfig()

config.subscribe(state => console.log('Wagmi state:', state))
```

### 3. 查看 RPC 请求

在浏览器开发者工具中：
- Network 标签 → 筛选 XHR/Fetch
- 查看发送到 RPC 节点的请求
- 检查 `eth_call`, `eth_sendTransaction` 等调用

---

## 总结

这个技术栈的设计哲学是**层次分明、职责单一**：

1. **RainbowKit** 只管美观的 UI
2. **Wagmi** 提供 React 友好的 API 和状态管理
3. **Viem** 处理底层以太坊交互
4. **Connectors** 适配不同钱包
5. **Transports** 处理网络通信
6. **Chains** 定义网络配置

每一层都可以独立替换，比如：
- 不喜欢 RainbowKit？用自己的 UI
- 不用 Wagmi？直接用 Viem
- 不用 HTTP？改用 WebSocket

但在 Scaffold-ETH 2 项目中，**强烈推荐使用完整的技术栈**，因为它们已经深度集成并优化过了。

希望这份文档能帮你彻底理解 Web3 前端技术栈！
