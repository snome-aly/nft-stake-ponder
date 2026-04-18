# Viem 快速参考文档

viem 是一个轻量、快速、类型安全的以太坊库，是 ethers.js 的现代化替代品。

---

## 📋 目录

- [1. Viem 概述](#1-viem-概述)
- [2. 核心概念](#2-核心概念)
- [3. 类型系统](#3-类型系统)
- [4. Public Client（读取区块链）](#4-public-client读取区块链)
- [5. Wallet Client（签名和交易）](#5-wallet-client签名和交易)
- [6. 合约交互](#6-合约交互)
- [7. 单位转换](#7-单位转换)
- [8. 地址工具](#8-地址工具)
- [9. 编码与解码](#9-编码与解码)
- [10. ABI 工具](#10-abi-工具)
- [11. 签名与验证](#11-签名与验证)
- [12. 工具函数](#12-工具函数)
- [13. 与 wagmi 的关系](#13-与-wagmi-的关系)
- [14. 常见用例](#14-常见用例)
- [15. Viem vs Ethers.js](#15-viem-vs-ethersjs)
- [16. 最佳实践](#16-最佳实践)

---

## 1. Viem 概述

### 什么是 Viem？

**viem** 是一个 TypeScript 以太坊库，提供：
- ⚡ 更小的包体积（比 ethers.js 小 ~3x）
- 🔒 完全的类型安全（零 `any` 类型）
- 🚀 更快的性能
- 🎯 模块化设计
- 📦 Tree-shakable（按需加载）
- 🧩 低级 API（灵活性高）

### 为什么选择 Viem？

**与 ethers.js 对比：**

| 特性 | viem | ethers.js |
|------|------|-----------|
| 包体积 | 📦 小 (~50kb) | 📦 大 (~150kb) |
| 类型安全 | ✅ 完全类型推导 | ⚠️ 部分使用 `any` |
| 性能 | ⚡ 快 | 🐢 较慢 |
| 模块化 | ✅ 完全模块化 | ⚠️ 单体结构 |
| API 设计 | 🎯 低级、灵活 | 🎨 高级、便捷 |
| BigInt | ✅ 原生 BigInt | ⚠️ 自定义 BigNumber |

### 安装

```bash
npm install viem
# 或
yarn add viem
# 或
pnpm add viem
```

---

## 2. 核心概念

### 2.1 Client（客户端）

Client 是与区块链交互的核心对象。

**两种类型：**
1. **Public Client** - 读取区块链数据（不需要私钥）
2. **Wallet Client** - 签名和发送交易（需要账户）

```typescript
import { createPublicClient, createWalletClient, http } from 'viem'
import { mainnet } from 'viem/chains'

// Public Client（读取）
const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
})

// Wallet Client（签名、交易）
const walletClient = createWalletClient({
  chain: mainnet,
  transport: http(),
})
```

---

### 2.2 Transport（传输层）

Transport 定义了如何与以太坊节点通信。

**常用 Transport：**

```typescript
import { http, webSocket, fallback } from 'viem'

// HTTP
const httpTransport = http('https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY')

// WebSocket
const wsTransport = webSocket('wss://eth-mainnet.g.alchemy.com/v2/YOUR_KEY')

// Fallback（多个 RPC 备份）
const fallbackTransport = fallback([
  http('https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY'),
  http('https://cloudflare-eth.com'),
  http('https://rpc.ankr.com/eth'),
])

// 自定义配置
const customHttp = http('https://rpc.example.com', {
  timeout: 10_000,     // 超时时间
  retryCount: 3,       // 重试次数
  retryDelay: 1000,    // 重试延迟
})
```

---

### 2.3 Chain（链）

Chain 定义了区块链的元数据。

```typescript
import { mainnet, sepolia, polygon, arbitrum, optimism, base } from 'viem/chains'

// 使用预定义的链
const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})

// 自定义链
import { defineChain } from 'viem'

const myChain = defineChain({
  id: 1234,
  name: 'My Chain',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://rpc.example.com'] },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://explorer.example.com' },
  },
})
```

---

### 2.4 Account（账户）

Account 代表一个以太坊账户。

```typescript
import { privateKeyToAccount } from 'viem/accounts'

// 从私钥创建账户
const account = privateKeyToAccount('0x...')

// 使用账户
const walletClient = createWalletClient({
  account,
  chain: mainnet,
  transport: http(),
})
```

---

## 3. 类型系统

### 3.1 核心类型

```typescript
import type {
  Address,      // 以太坊地址 "0x${string}"
  Hash,         // 交易哈希 "0x${string}"
  Hex,          // 十六进制字符串 "0x${string}"
  Abi,          // 合约 ABI
  Log,          // 事件日志
  Transaction,  // 交易对象
  Block,        // 区块对象
} from 'viem'

// 示例
const address: Address = '0x...'
const txHash: Hash = '0x...'
const data: Hex = '0x1234'
```

---

### 3.2 类型推导

viem 的类型系统会自动推导：

```typescript
// ABI 定义
const abi = [
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const  // ⚠️ 必须使用 as const

// 函数名自动补全
const data = await publicClient.readContract({
  address: '0x...',
  abi,
  functionName: 'balanceOf',  // ✅ 自动补全
  args: ['0x...'],             // ✅ 类型检查
})

// data 的类型自动推导为 bigint
console.log(data.toString())
```

---

## 4. Public Client（读取区块链）

Public Client 用于读取区块链数据，不需要私钥。

### 4.1 创建 Public Client

```typescript
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http('https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY'),
})
```

---

### 4.2 读取区块数据

```typescript
// 获取最新区块号
const blockNumber = await publicClient.getBlockNumber()
console.log(blockNumber)  // 18123456n

// 获取区块信息
const block = await publicClient.getBlock({
  blockNumber: 18123456n,
  // 或使用 blockHash
  // blockHash: '0x...',
})

console.log(block.timestamp)      // 区块时间戳
console.log(block.transactions)   // 交易列表
console.log(block.baseFeePerGas)  // base fee (EIP-1559)
```

---

### 4.3 读取账户余额

```typescript
// 获取 ETH 余额
const balance = await publicClient.getBalance({
  address: '0x...',
  // 可选：指定区块
  blockNumber: 18123456n,
})

console.log(balance)  // 1000000000000000000n (1 ETH in wei)

// 格式化余额
import { formatEther } from 'viem'
console.log(formatEther(balance))  // "1.0"
```

---

### 4.4 读取合约

```typescript
// 读取合约的 view/pure 函数
const result = await publicClient.readContract({
  address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',  // DAI
  abi: [
    {
      name: 'balanceOf',
      type: 'function',
      inputs: [{ name: 'account', type: 'address' }],
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
    },
  ],
  functionName: 'balanceOf',
  args: ['0xUserAddress'],
})

console.log(result)  // bigint
```

---

### 4.5 批量读取（Multicall）

```typescript
// 一次请求读取多个合约调用
const results = await publicClient.multicall({
  contracts: [
    {
      address: '0xTokenA',
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: ['0xUser'],
    },
    {
      address: '0xTokenB',
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: ['0xUser'],
    },
    {
      address: '0xTokenC',
      abi: erc20Abi,
      functionName: 'totalSupply',
    },
  ],
})

console.log(results[0].result)  // Token A 余额
console.log(results[1].result)  // Token B 余额
console.log(results[2].result)  // Token C 总供应量
```

---

### 4.6 读取事件日志

```typescript
// 获取合约事件
const logs = await publicClient.getLogs({
  address: '0xContractAddress',
  event: {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
  },
  fromBlock: 18000000n,
  toBlock: 18123456n,
  // 可选：过滤 indexed 参数
  args: {
    from: '0xSenderAddress',
  },
})

logs.forEach(log => {
  console.log('Transfer:', log.args)
})
```

---

### 4.7 监听新区块

```typescript
// 监听每个新区块
const unwatch = publicClient.watchBlockNumber({
  onBlockNumber: (blockNumber) => {
    console.log('New block:', blockNumber)
  },
  pollingInterval: 1000,  // 1 秒轮询一次
})

// 停止监听
unwatch()
```

---

### 4.8 监听事件

```typescript
// 实时监听合约事件
const unwatch = publicClient.watchEvent({
  address: '0xContractAddress',
  event: {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
  },
  onLogs: (logs) => {
    logs.forEach(log => {
      console.log('New transfer:', log.args)
    })
  },
})

// 停止监听
unwatch()
```

---

### 4.9 获取交易详情

```typescript
// 获取交易信息
const transaction = await publicClient.getTransaction({
  hash: '0x...',
})

console.log(transaction.from)
console.log(transaction.to)
console.log(transaction.value)
console.log(transaction.input)  // 交易数据
```

---

### 4.10 获取交易收据

```typescript
// 获取交易收据（确认后）
const receipt = await publicClient.getTransactionReceipt({
  hash: '0x...',
})

console.log(receipt.status)        // "success" | "reverted"
console.log(receipt.blockNumber)   // 确认的区块号
console.log(receipt.gasUsed)       // 实际使用的 gas
console.log(receipt.logs)          // 事件日志
```

---

### 4.11 等待交易确认

```typescript
// 发送交易后等待确认
const hash = await walletClient.sendTransaction({...})

const receipt = await publicClient.waitForTransactionReceipt({
  hash,
  confirmations: 2,  // 等待 2 个区块确认
})

console.log('Transaction confirmed!', receipt)
```

---

### 4.12 估算 Gas

```typescript
// 估算交易的 gas 消耗
const gas = await publicClient.estimateGas({
  account: '0xSender',
  to: '0xRecipient',
  value: parseEther('1'),
  data: '0x...',
})

console.log(gas)  // 21000n (标准转账)
```

---

### 4.13 获取 Gas 价格

```typescript
// 获取当前 gas 价格
const gasPrice = await publicClient.getGasPrice()
console.log(gasPrice)  // 单位: wei

// EIP-1559: 获取 fee 数据
const feeData = await publicClient.estimateFeesPerGas()
console.log(feeData.maxFeePerGas)
console.log(feeData.maxPriorityFeePerGas)
```

---

## 5. Wallet Client（签名和交易）

Wallet Client 用于签名消息和发送交易。

### 5.1 创建 Wallet Client

```typescript
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { mainnet } from 'viem/chains'

// 方法 1: 从私钥创建
const account = privateKeyToAccount('0xPrivateKey')

const walletClient = createWalletClient({
  account,
  chain: mainnet,
  transport: http(),
})

// 方法 2: 使用浏览器钱包（MetaMask）
const [address] = await window.ethereum.request({
  method: 'eth_requestAccounts',
})

const walletClient = createWalletClient({
  account: address,
  chain: mainnet,
  transport: custom(window.ethereum),
})
```

---

### 5.2 发送 ETH

```typescript
import { parseEther } from 'viem'

// 发送 ETH
const hash = await walletClient.sendTransaction({
  to: '0xRecipient',
  value: parseEther('1.5'),  // 1.5 ETH
  // 可选
  data: '0x...',
  gas: 21000n,
  maxFeePerGas: parseGwei('20'),
  maxPriorityFeePerGas: parseGwei('2'),
})

console.log('Transaction hash:', hash)
```

---

### 5.3 写入合约

```typescript
// 调用合约的 nonpayable/payable 函数
const hash = await walletClient.writeContract({
  address: '0xContractAddress',
  abi: [
    {
      name: 'transfer',
      type: 'function',
      inputs: [
        { name: 'to', type: 'address' },
        { name: 'amount', type: 'uint256' },
      ],
      outputs: [{ name: '', type: 'bool' }],
      stateMutability: 'nonpayable',
    },
  ],
  functionName: 'transfer',
  args: ['0xRecipient', parseEther('100')],
  // 可选：支付 ETH（payable 函数）
  value: parseEther('0.01'),
})

console.log('Transaction hash:', hash)
```

---

### 5.4 签名消息

```typescript
// 签名文本消息
const signature = await walletClient.signMessage({
  message: 'Hello, viem!',
})

console.log(signature)  // "0x..."

// 签名十六进制数据
const signature = await walletClient.signMessage({
  message: { raw: '0x1234...' },
})
```

---

### 5.5 签名类型化数据（EIP-712）

```typescript
// 签名 EIP-712 结构化数据
const signature = await walletClient.signTypedData({
  domain: {
    name: 'MyDApp',
    version: '1',
    chainId: 1,
    verifyingContract: '0x...',
  },
  types: {
    Person: [
      { name: 'name', type: 'string' },
      { name: 'age', type: 'uint256' },
    ],
  },
  primaryType: 'Person',
  message: {
    name: 'Alice',
    age: 30n,
  },
})
```

---

### 5.6 部署合约

```typescript
// 部署新合约
const hash = await walletClient.deployContract({
  abi: [
    // 构造函数 ABI
    {
      type: 'constructor',
      inputs: [{ name: 'initialSupply', type: 'uint256' }],
      stateMutability: 'nonpayable',
    },
  ],
  bytecode: '0x608060405234801561001057600080fd5b50...',
  args: [parseEther('1000000')],  // 构造函数参数
})

// 等待部署完成
const receipt = await publicClient.waitForTransactionReceipt({ hash })
console.log('Contract deployed at:', receipt.contractAddress)
```

---

## 6. 合约交互

### 6.1 使用 getContract

创建合约实例，简化多次调用：

```typescript
import { getContract } from 'viem'

// 创建合约实例
const contract = getContract({
  address: '0xContractAddress',
  abi: [
    {
      name: 'balanceOf',
      type: 'function',
      inputs: [{ name: 'owner', type: 'address' }],
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
    },
    {
      name: 'transfer',
      type: 'function',
      inputs: [
        { name: 'to', type: 'address' },
        { name: 'amount', type: 'uint256' },
      ],
      outputs: [{ name: '', type: 'bool' }],
      stateMutability: 'nonpayable',
    },
  ],
  client: { public: publicClient, wallet: walletClient },
})

// 读取
const balance = await contract.read.balanceOf(['0xUser'])

// 写入
const hash = await contract.write.transfer(['0xRecipient', parseEther('100')])

// 监听事件
const unwatch = contract.watchEvent.Transfer({
  from: '0xSender',
}, {
  onLogs: (logs) => console.log(logs),
})
```

---

### 6.2 模拟合约调用

```typescript
// 模拟交易执行（不发送交易）
const { result } = await publicClient.simulateContract({
  address: '0xContractAddress',
  abi: [
    {
      name: 'transfer',
      type: 'function',
      inputs: [
        { name: 'to', type: 'address' },
        { name: 'amount', type: 'uint256' },
      ],
      outputs: [{ name: '', type: 'bool' }],
      stateMutability: 'nonpayable',
    },
  ],
  functionName: 'transfer',
  args: ['0xRecipient', parseEther('100')],
  account: '0xSender',
})

console.log('Simulation result:', result)  // true/false

// 如果模拟成功，可以执行真实交易
const hash = await walletClient.writeContract({
  address: '0xContractAddress',
  abi: [...],
  functionName: 'transfer',
  args: ['0xRecipient', parseEther('100')],
})
```

---

## 7. 单位转换

### 7.1 ETH 单位转换

```typescript
import { parseEther, formatEther, parseGwei, formatGwei } from 'viem'

// String → Wei (bigint)
const wei = parseEther('1.5')
console.log(wei)  // 1500000000000000000n

// Wei → String
const eth = formatEther(1500000000000000000n)
console.log(eth)  // "1.5"

// Gwei 转换
const gwei = parseGwei('20')
console.log(gwei)  // 20000000000n

const gweiFormatted = formatGwei(20000000000n)
console.log(gweiFormatted)  // "20"
```

---

### 7.2 自定义单位转换

```typescript
import { parseUnits, formatUnits } from 'viem'

// USDC (6 decimals)
const usdc = parseUnits('100', 6)
console.log(usdc)  // 100000000n

const usdcFormatted = formatUnits(100000000n, 6)
console.log(usdcFormatted)  // "100"

// 代币转换通用函数
function parseToken(amount: string, decimals: number): bigint {
  return parseUnits(amount, decimals)
}

function formatToken(amount: bigint, decimals: number): string {
  return formatUnits(amount, decimals)
}
```

---

## 8. 地址工具

### 8.1 地址验证

```typescript
import { isAddress, getAddress } from 'viem'

// 验证地址格式
console.log(isAddress('0x...'))  // true/false
console.log(isAddress('invalid'))  // false

// 校验和格式化（Checksum）
const checksumAddress = getAddress('0xd8da6bf26964af9d7eed9e03e53415d37aa96045')
console.log(checksumAddress)  // "0xD8dA6BF26964aF9D7eEd9e03E53415D37aA96045"

// 自动抛出错误（无效地址）
try {
  getAddress('invalid')
} catch (error) {
  console.error(error)  // InvalidAddressError
}
```

---

### 8.2 地址相等比较

```typescript
import { isAddressEqual } from 'viem'

// 比较两个地址（忽略大小写）
const equal = isAddressEqual(
  '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
  '0xD8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
)
console.log(equal)  // true
```

---

## 9. 编码与解码

### 9.1 十六进制转换

```typescript
import {
  toHex,
  fromHex,
  hexToString,
  stringToHex,
  hexToNumber,
  numberToHex,
  hexToBigInt,
  toBytes,
  fromBytes,
} from 'viem'

// String ↔ Hex
const hex = stringToHex('Hello')
console.log(hex)  // "0x48656c6c6f"

const str = hexToString('0x48656c6c6f')
console.log(str)  // "Hello"

// Number ↔ Hex
const numHex = numberToHex(42)
console.log(numHex)  // "0x2a"

const num = hexToNumber('0x2a')
console.log(num)  // 42

// BigInt ↔ Hex
const bigint = hexToBigInt('0x1234567890abcdef')
console.log(bigint)  // 1311768467294899695n

// Bytes ↔ Hex
const bytes = toBytes('0x1234')
console.log(bytes)  // Uint8Array [18, 52]

const hexFromBytes = fromBytes(bytes, 'hex')
console.log(hexFromBytes)  // "0x1234"
```

---

### 9.2 哈希函数

```typescript
import { keccak256, toHex } from 'viem'

// Keccak256 哈希
const hash = keccak256(toHex('Hello'))
console.log(hash)  // "0x..."

// 常用于生成合约函数选择器
const selector = keccak256(toHex('transfer(address,uint256)')).slice(0, 10)
console.log(selector)  // "0xa9059cbb"
```

---

## 10. ABI 工具

### 10.1 编码函数数据

```typescript
import { encodeFunctionData } from 'viem'

// 编码函数调用数据
const data = encodeFunctionData({
  abi: [
    {
      name: 'transfer',
      type: 'function',
      inputs: [
        { name: 'to', type: 'address' },
        { name: 'amount', type: 'uint256' },
      ],
      outputs: [{ name: '', type: 'bool' }],
      stateMutability: 'nonpayable',
    },
  ],
  functionName: 'transfer',
  args: ['0xRecipient', parseEther('100')],
})

console.log(data)  // "0xa9059cbb000000000000000000000000..."

// 可用于 sendTransaction
await walletClient.sendTransaction({
  to: '0xContractAddress',
  data,
})
```

---

### 10.2 解码函数数据

```typescript
import { decodeFunctionData } from 'viem'

// 解码函数调用数据
const decoded = decodeFunctionData({
  abi: [
    {
      name: 'transfer',
      type: 'function',
      inputs: [
        { name: 'to', type: 'address' },
        { name: 'amount', type: 'uint256' },
      ],
      outputs: [{ name: '', type: 'bool' }],
      stateMutability: 'nonpayable',
    },
  ],
  data: '0xa9059cbb000000000000000000000000...',
})

console.log(decoded.functionName)  // "transfer"
console.log(decoded.args)          // ["0xRecipient", 100000000000000000000n]
```

---

### 10.3 编码/解码事件日志

```typescript
import { encodeEventTopics, decodeEventLog } from 'viem'

// 编码事件 topic（用于过滤）
const topics = encodeEventTopics({
  abi: [
    {
      type: 'event',
      name: 'Transfer',
      inputs: [
        { name: 'from', type: 'address', indexed: true },
        { name: 'to', type: 'address', indexed: true },
        { name: 'value', type: 'uint256', indexed: false },
      ],
    },
  ],
  eventName: 'Transfer',
  args: {
    from: '0xSender',
  },
})

// 解码事件日志
const decodedLog = decodeEventLog({
  abi: [
    {
      type: 'event',
      name: 'Transfer',
      inputs: [
        { name: 'from', type: 'address', indexed: true },
        { name: 'to', type: 'address', indexed: true },
        { name: 'value', type: 'uint256', indexed: false },
      ],
    },
  ],
  data: '0x...',
  topics: ['0x...', '0x...', '0x...'],
})

console.log(decodedLog.eventName)  // "Transfer"
console.log(decodedLog.args)       // { from, to, value }
```

---

### 10.4 编码/解码 ABI 参数

```typescript
import { encodeAbiParameters, decodeAbiParameters } from 'viem'

// 编码参数
const encoded = encodeAbiParameters(
  [
    { name: 'x', type: 'uint256' },
    { name: 'y', type: 'string' },
  ],
  [42n, 'Hello']
)

console.log(encoded)  // "0x..."

// 解码参数
const decoded = decodeAbiParameters(
  [
    { name: 'x', type: 'uint256' },
    { name: 'y', type: 'string' },
  ],
  encoded
)

console.log(decoded)  // [42n, "Hello"]
```

---

## 11. 签名与验证

### 11.1 签名消息

```typescript
import { hashMessage, signMessage } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

const account = privateKeyToAccount('0xPrivateKey')

// 生成消息哈希
const message = 'Hello, viem!'
const messageHash = hashMessage(message)

// 签名
const signature = await account.signMessage({ message })
console.log(signature)  // "0x..."
```

---

### 11.2 验证签名

```typescript
import { verifyMessage } from 'viem'

// 验证签名
const valid = await verifyMessage({
  address: '0xSignerAddress',
  message: 'Hello, viem!',
  signature: '0x...',
})

console.log(valid)  // true/false
```

---

### 11.3 恢复签名者地址

```typescript
import { recoverMessageAddress } from 'viem'

// 从签名恢复地址
const address = await recoverMessageAddress({
  message: 'Hello, viem!',
  signature: '0x...',
})

console.log(address)  // "0xSignerAddress"
```

---

## 12. 工具函数

### 12.1 延迟/等待

```typescript
import { wait } from 'viem'

// 等待 1 秒
await wait(1000)
```

---

### 12.2 轮询

```typescript
import { poll } from 'viem'

// 轮询直到条件满足
const result = await poll(
  async () => {
    const balance = await publicClient.getBalance({ address: '0x...' })
    return balance > parseEther('1') ? balance : undefined
  },
  {
    interval: 1000,  // 1 秒检查一次
    timeout: 30000,  // 30 秒超时
  }
)

console.log('Balance reached 1 ETH:', result)
```

---

### 12.3 Concat（拼接）

```typescript
import { concat } from 'viem'

// 拼接多个 Hex 字符串
const combined = concat(['0x1234', '0x5678', '0xabcd'])
console.log(combined)  // "0x12345678abcd"
```

---

### 12.4 Slice（切片）

```typescript
import { slice } from 'viem'

// 切片 Hex 字符串
const sliced = slice('0x0123456789', 2, 5)
console.log(sliced)  // "0x234567"
```

---

### 12.5 Pad（填充）

```typescript
import { pad, padHex } from 'viem'

// 左填充（补零）
const padded = padHex('0x1234', { size: 32 })
console.log(padded)  // "0x0000000000000000000000000000000000000000000000000000000000001234"
```

---

## 13. 与 wagmi 的关系

### 13.1 架构层次

```
应用层          React 组件
               ↓
Hooks 层       wagmi (useReadContract, useWriteContract, ...)
               ↓
缓存层          TanStack Query
               ↓
以太坊层        viem (publicClient, walletClient, ...)
               ↓
网络层          JSON-RPC
```

---

### 13.2 wagmi 如何使用 viem

**wagmi 内部使用 viem：**

```typescript
// wagmi hook 内部实现（简化版）
export function useReadContract({ address, abi, functionName, args }) {
  const publicClient = usePublicClient()

  return useQuery({
    queryKey: ['readContract', address, functionName, args],
    queryFn: async () => {
      // 调用 viem 的 publicClient
      return publicClient.readContract({
        address,
        abi,
        functionName,
        args,
      })
    },
  })
}
```

**所有 wagmi 的类型都来自 viem：**
- `Address` from viem
- `Hash` from viem
- `Abi` from viem
- `parseEther` from viem
- 等等...

---

### 13.3 何时直接使用 viem

**使用 wagmi hooks（推荐）：**
- 在 React 组件中
- 需要缓存和自动刷新
- 标准的合约读写

**直接使用 viem：**
- 非 React 环境（Node.js 脚本、服务器）
- 不需要缓存的一次性操作
- 高级用例（自定义编码、批量操作）
- 需要更细粒度的控制

---

### 13.4 在 wagmi 中使用 viem 客户端

```typescript
import { usePublicClient, useWalletClient } from 'wagmi'

function Component() {
  // 获取 viem client
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const doSomething = async () => {
    // 直接使用 viem API
    const balance = await publicClient.getBalance({ address: '0x...' })
    const hash = await walletClient.sendTransaction({ to: '0x...', value: 1n })
  }
}
```

---

## 14. 常见用例

### 14.1 查询 ERC20 代币余额

```typescript
import { erc20Abi } from 'viem'

const balance = await publicClient.readContract({
  address: '0xTokenAddress',
  abi: erc20Abi,
  functionName: 'balanceOf',
  args: ['0xUserAddress'],
})

const decimals = await publicClient.readContract({
  address: '0xTokenAddress',
  abi: erc20Abi,
  functionName: 'decimals',
})

console.log(`Balance: ${formatUnits(balance, decimals)}`)
```

---

### 14.2 转账 ERC20 代币

```typescript
import { erc20Abi, parseUnits } from 'viem'

// 1. 检查余额
const balance = await publicClient.readContract({
  address: '0xTokenAddress',
  abi: erc20Abi,
  functionName: 'balanceOf',
  args: [account.address],
})

if (balance < parseUnits('100', 18)) {
  throw new Error('Insufficient balance')
}

// 2. 发送转账
const hash = await walletClient.writeContract({
  address: '0xTokenAddress',
  abi: erc20Abi,
  functionName: 'transfer',
  args: ['0xRecipient', parseUnits('100', 18)],
})

// 3. 等待确认
const receipt = await publicClient.waitForTransactionReceipt({ hash })
console.log('Transfer confirmed:', receipt.status)
```

---

### 14.3 批量查询（节省 RPC 调用）

```typescript
// 一次请求获取多个代币余额
const balances = await publicClient.multicall({
  contracts: [
    {
      address: '0xDAI',
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [userAddress],
    },
    {
      address: '0xUSDC',
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [userAddress],
    },
    {
      address: '0xUSDT',
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [userAddress],
    },
  ],
})

console.log('DAI:', balances[0].result)
console.log('USDC:', balances[1].result)
console.log('USDT:', balances[2].result)
```

---

### 14.4 监听合约事件并更新 UI

```typescript
// 实时监听 Transfer 事件
const unwatch = publicClient.watchEvent({
  address: '0xTokenAddress',
  event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
  args: {
    to: userAddress,  // 只监听发给用户的转账
  },
  onLogs: (logs) => {
    logs.forEach(log => {
      console.log(`Received ${formatEther(log.args.value)} tokens`)
      // 更新 UI
      updateBalance()
    })
  },
})
```

---

### 14.5 发送带数据的交易

```typescript
// 调用合约的低级方式
const data = encodeFunctionData({
  abi: erc20Abi,
  functionName: 'transfer',
  args: ['0xRecipient', parseEther('100')],
})

const hash = await walletClient.sendTransaction({
  to: '0xTokenAddress',
  data,
  gas: 50000n,
})
```

---

## 15. Viem vs Ethers.js

### 15.1 API 对比

| 功能 | viem | ethers.js v6 |
|------|------|--------------|
| 创建 Provider | `createPublicClient()` | `new JsonRpcProvider()` |
| 创建 Signer | `createWalletClient()` | `new Wallet()` |
| 获取余额 | `getBalance()` | `provider.getBalance()` |
| 读取合约 | `readContract()` | `contract.functionName()` |
| 写入合约 | `writeContract()` | `contract.functionName()` |
| 发送交易 | `sendTransaction()` | `signer.sendTransaction()` |
| 监听事件 | `watchEvent()` | `contract.on()` |
| 单位转换 | `parseEther()` / `formatEther()` | `parseEther()` / `formatEther()` |
| BigInt | 原生 `bigint` | 自定义 `BigNumber` |

---

### 15.2 代码示例对比

**Ethers.js:**
```typescript
import { ethers } from 'ethers'

const provider = new ethers.JsonRpcProvider('https://...')
const signer = new ethers.Wallet(privateKey, provider)

const balance = await provider.getBalance('0x...')
console.log(ethers.formatEther(balance))

const contract = new ethers.Contract(address, abi, signer)
const result = await contract.transfer('0x...', ethers.parseEther('1'))
await result.wait()
```

**Viem:**
```typescript
import { createPublicClient, createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

const publicClient = createPublicClient({ chain, transport: http() })
const account = privateKeyToAccount(privateKey)
const walletClient = createWalletClient({ account, chain, transport: http() })

const balance = await publicClient.getBalance({ address: '0x...' })
console.log(formatEther(balance))

const hash = await walletClient.writeContract({
  address,
  abi,
  functionName: 'transfer',
  args: ['0x...', parseEther('1')],
})
await publicClient.waitForTransactionReceipt({ hash })
```

---

## 16. 最佳实践

### 16.1 使用 TypeScript

```typescript
// ✅ 使用 as const 让 ABI 完全类型推导
const abi = [
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const  // ⚠️ 必须

// ✅ 导入预定义的 ABI
import { erc20Abi, erc721Abi } from 'viem'
```

---

### 16.2 复用 Client

```typescript
// ✅ 在应用启动时创建 client，全局复用
export const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
})

// ❌ 不要在每次调用时创建新的 client
function getBalance() {
  const client = createPublicClient({ ... })  // 浪费资源
  return client.getBalance({ ... })
}
```

---

### 16.3 错误处理

```typescript
import { BaseError, ContractFunctionRevertedError } from 'viem'

try {
  await walletClient.writeContract({ ... })
} catch (error) {
  if (error instanceof BaseError) {
    // viem 的错误
    const revertError = error.walk(err => err instanceof ContractFunctionRevertedError)
    if (revertError instanceof ContractFunctionRevertedError) {
      const errorName = revertError.data?.errorName ?? ''
      console.log('Contract reverted:', errorName)
    }
  }
}
```

---

### 16.4 使用 Fallback Transport

```typescript
import { fallback, http } from 'viem'

// 多个 RPC 备份，自动切换
const transport = fallback([
  http('https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY'),
  http('https://cloudflare-eth.com'),
  http('https://rpc.ankr.com/eth'),
])

const publicClient = createPublicClient({
  chain: mainnet,
  transport,
})
```

---

### 16.5 性能优化

```typescript
// ✅ 使用 multicall 减少请求
const results = await publicClient.multicall({
  contracts: [/* ... */],
})

// ❌ 多次单独请求
const balance1 = await publicClient.readContract({ ... })
const balance2 = await publicClient.readContract({ ... })
const balance3 = await publicClient.readContract({ ... })
```

---

## 总结

**Viem 核心概念：**
1. ✅ **Public Client** - 读取区块链（不需要私钥）
2. ✅ **Wallet Client** - 签名和发送交易（需要账户）
3. ✅ **Transport** - 如何连接节点（HTTP、WebSocket）
4. ✅ **Chain** - 区块链定义
5. ✅ **完全类型安全** - 使用 `as const` 和 TypeScript

**最常用的功能：**
1. `createPublicClient()` + `createWalletClient()` - 创建客户端
2. `getBalance()` - 获取余额
3. `readContract()` / `writeContract()` - 合约交互
4. `sendTransaction()` - 发送交易
5. `parseEther()` / `formatEther()` - 单位转换
6. `waitForTransactionReceipt()` - 等待交易确认
7. `multicall()` - 批量查询

**与 wagmi 的关系：**
- wagmi = React Hooks + 缓存 + 状态管理
- viem = 底层以太坊交互库
- wagmi 内部使用 viem
- 所有类型和工具函数来自 viem

**何时使用 viem：**
- 非 React 环境（Node.js 脚本）
- 不需要缓存的一次性操作
- 高级用例和自定义编码

---

**准备好使用 viem 开发了吗？** 🚀

参考资源：
- 官方文档：https://viem.sh
- GitHub：https://github.com/wevm/viem
- 示例：https://viem.sh/docs/getting-started
