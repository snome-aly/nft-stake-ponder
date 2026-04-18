# Web3 前端开发注意事项与最佳实践

本文档总结 Web3 前端开发的核心要点、与 Web2 的区别、常见陷阱和最佳实践。

---

## 📋 目录

- [1. Web3 vs Web2 核心区别](#1-web3-vs-web2-核心区别)
- [2. 钱包连接与账户管理](#2-钱包连接与账户管理)
- [3. 网络切换与多链支持](#3-网络切换与多链支持)
- [4. 数据类型与处理](#4-数据类型与处理)
- [5. 异步操作与状态管理](#5-异步操作与状态管理)
- [6. 交易流程与用户体验](#6-交易流程与用户体验)
- [7. 错误处理](#7-错误处理)
- [8. 安全注意事项](#8-安全注意事项)
- [9. 性能优化](#9-性能优化)
- [10. 用户体验设计](#10-用户体验设计)
- [11. 测试策略](#11-测试策略)
- [12. 常见陷阱](#12-常见陷阱)
- [13. 实战 Checklist](#13-实战-checklist)

---

## 1. Web3 vs Web2 核心区别

### 1.1 认证机制

**Web2:**
```typescript
// 传统登录
const login = async (username: string, password: string) => {
  const response = await fetch('/api/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
  const { token } = await response.json()
  localStorage.setItem('token', token)
}
```

**Web3:**
```typescript
// 钱包连接即认证
import { useAccount, useConnect } from 'wagmi'

function Auth() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()

  // 地址即身份
  if (isConnected) {
    console.log('User:', address)
  }
}
```

**关键区别：**
- ❌ **Web2**: 用户名/密码 → 服务器验证 → Session/Token
- ✅ **Web3**: 钱包地址 → 签名验证 → 去中心化身份
- 用户**完全控制**自己的身份和资产
- 无需注册、无需密码管理

---

### 1.2 数据存储

**Web2:**
```typescript
// 数据存储在中心化数据库
await fetch('/api/users', {
  method: 'POST',
  body: JSON.stringify({ name: 'Alice', age: 30 }),
})
```

**Web3:**
```typescript
// 数据存储在区块链
const { writeContract } = useWriteContract()

await writeContract({
  address: contractAddress,
  abi: contractAbi,
  functionName: 'setUserData',
  args: ['Alice', 30],
})
```

**关键区别：**
- ❌ **Web2**: 中心化数据库（可修改、可删除）
- ✅ **Web3**: 区块链（不可篡改、永久存储）
- 需要支付 **gas 费用**
- 写入操作需要**等待确认**（10 秒 - 数分钟）

---

### 1.3 状态管理

**Web2:**
```typescript
// 即时响应
const [data, setData] = useState(null)

const updateData = async () => {
  const response = await fetch('/api/data')
  const result = await response.json()
  setData(result)  // ✅ 立即更新
}
```

**Web3:**
```typescript
// 需要等待区块链确认
const [txHash, setTxHash] = useState<Hash>()

const { writeContract } = useWriteContract()
const { isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

const updateData = async () => {
  const hash = await writeContract({...})
  setTxHash(hash)
  // ⏳ 等待确认（10-30 秒）
}

useEffect(() => {
  if (isSuccess) {
    // ✅ 确认后更新 UI
    refetchData()
  }
}, [isSuccess])
```

**关键区别：**
- ❌ **Web2**: 同步操作，即时响应
- ✅ **Web3**: 异步操作，需要等待区块确认
- 需要管理**多个状态**（待确认、确认中、已确认）
- 需要**乐观 UI 更新**提升体验

---

### 1.4 数据类型

**Web2:**
```typescript
// 标准 JavaScript 数据类型
const price = 19.99        // number
const total = price * 2    // 39.98
```

**Web3:**
```typescript
// 使用 BigInt 处理大数
import { parseEther, formatEther } from 'viem'

const price = parseEther('1.5')     // 1500000000000000000n (bigint)
const total = price * 2n            // 3000000000000000000n
const formatted = formatEther(total) // "3.0"
```

**关键区别：**
- ❌ **Web2**: `number` 类型（精度限制）
- ✅ **Web3**: `bigint` 类型（无限精度）
- 所有金额计算必须使用 `BigInt`
- 需要在 wei 和 ETH 之间转换

---

### 1.5 用户交互成本

**Web2:**
```typescript
// 免费操作
<button onClick={saveData}>
  Save
</button>
```

**Web3:**
```typescript
// 需要支付 gas
<button onClick={saveData}>
  Save (Gas: ~$2.50)
</button>
```

**关键区别：**
- ❌ **Web2**: 操作免费
- ✅ **Web3**: 每次写入需要支付 gas
- 需要向用户**明确显示成本**
- 需要**批量操作**减少 gas 消耗

---

## 2. 钱包连接与账户管理

### 2.1 连接状态管理

**必须处理的状态：**

```typescript
import { useAccount } from 'wagmi'

function App() {
  const {
    address,           // 用户地址
    isConnected,       // 是否已连接
    isConnecting,      // 是否正在连接
    isDisconnected,    // 是否已断开
    isReconnecting,    // 是否正在重连
  } = useAccount()

  // ⚠️ 必须处理所有状态
  if (isConnecting || isReconnecting) {
    return <LoadingSpinner />
  }

  if (isDisconnected) {
    return <ConnectWalletButton />
  }

  if (isConnected) {
    return <Dashboard address={address} />
  }
}
```

---

### 2.2 钱包未安装处理

```typescript
import { useConnect } from 'wagmi'

function ConnectButton() {
  const { connectors, connect } = useConnect()

  const injectedConnector = connectors.find(c => c.id === 'injected')

  return (
    <div>
      {injectedConnector ? (
        <button onClick={() => connect({ connector: injectedConnector })}>
          Connect MetaMask
        </button>
      ) : (
        <div>
          <p>⚠️ Please install MetaMask</p>
          <a href="https://metamask.io/download" target="_blank">
            Download MetaMask
          </a>
        </div>
      )}
    </div>
  )
}
```

---

### 2.3 账户切换监听

```typescript
import { useAccount } from 'wagmi'
import { useEffect } from 'react'

function Component() {
  const { address } = useAccount()

  useEffect(() => {
    // ⚠️ 用户切换账户时重置状态
    console.log('Account changed:', address)
    resetUserData()
    refetchData()
  }, [address])
}
```

---

### 2.4 自动重连

```typescript
// wagmi config 中启用自动重连
import { createConfig } from 'wagmi'

const config = createConfig({
  chains: [mainnet],
  connectors: [...],
  ssr: true,  // ✅ SSR 支持
})

// React 组件中
function App() {
  const { isReconnecting } = useAccount()

  if (isReconnecting) {
    return <p>Reconnecting to wallet...</p>
  }
}
```

---

## 3. 网络切换与多链支持

### 3.1 检测错误网络

```typescript
import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { mainnet } from 'wagmi/chains'

function NetworkGuard() {
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()

  const isWrongNetwork = chainId !== mainnet.id

  if (isWrongNetwork) {
    return (
      <div className="alert alert-error">
        <p>⚠️ Wrong Network</p>
        <button onClick={() => switchChain({ chainId: mainnet.id })}>
          Switch to Mainnet
        </button>
      </div>
    )
  }

  return <YourApp />
}
```

---

### 3.2 多链部署处理

```typescript
import { useChainId } from 'wagmi'

function getContractAddress(chainId: number) {
  const addresses = {
    1: '0xMainnetAddress',
    11155111: '0xSepoliaAddress',
    137: '0xPolygonAddress',
  }
  return addresses[chainId] || null
}

function Component() {
  const chainId = useChainId()
  const contractAddress = getContractAddress(chainId)

  if (!contractAddress) {
    return <p>Contract not deployed on this network</p>
  }

  // 使用 contractAddress...
}
```

---

### 3.3 网络切换确认

```typescript
import { useSwitchChain } from 'wagmi'

function SwitchNetworkButton() {
  const { switchChain, isPending, error } = useSwitchChain()

  const handleSwitch = async () => {
    try {
      await switchChain({ chainId: 1 })
      // ✅ 切换成功
    } catch (error) {
      // ❌ 用户拒绝或失败
      console.error('Failed to switch network:', error)
    }
  }

  return (
    <button onClick={handleSwitch} disabled={isPending}>
      {isPending ? 'Switching...' : 'Switch to Mainnet'}
    </button>
  )
}
```

---

## 4. 数据类型与处理

### 4.1 BigInt 处理

```typescript
import { parseEther, formatEther } from 'viem'

// ✅ 正确：使用 BigInt
const amount = parseEther('1.5')           // 1500000000000000000n
const doubled = amount * 2n                // 3000000000000000000n
const formatted = formatEther(doubled)     // "3.0"

// ❌ 错误：使用 Number
const amount = 1.5 * 10 ** 18              // 精度丢失
const doubled = amount * 2                 // 不安全

// ⚠️ BigInt 不能直接序列化
JSON.stringify({ amount: 1n })  // ❌ TypeError

// ✅ 需要转换
JSON.stringify({ amount: amount.toString() })
```

---

### 4.2 地址验证

```typescript
import { isAddress, getAddress } from 'viem'
import type { Address } from 'viem'

// ✅ 验证地址
function validateAddress(input: string): Address | null {
  if (!isAddress(input)) {
    return null
  }
  return getAddress(input)  // 返回 checksum 格式
}

// 使用示例
const userInput = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045'
const validAddress = validateAddress(userInput)

if (!validAddress) {
  alert('Invalid address')
}
```

---

### 4.3 地址显示

```typescript
// ✅ 使用 Scaffold-ETH 的 Address 组件
import { Address } from '~~/components/scaffold-eth'

<Address address={userAddress} />

// 或手动截断
function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

<p>{shortenAddress(address)}</p>  // "0x1234...5678"
```

---

### 4.4 单位转换

```typescript
import { parseEther, formatEther, parseUnits, formatUnits } from 'viem'

// ETH
const eth = parseEther('1.5')              // → wei (bigint)
const formatted = formatEther(eth)         // → "1.5"

// ERC20 代币（6 decimals，如 USDC）
const usdc = parseUnits('100', 6)          // → 100000000n
const formatted = formatUnits(usdc, 6)     // → "100"

// Gwei（gas 价格）
const gwei = parseGwei('20')               // → 20000000000n
const formatted = formatGwei(gwei)         // → "20"
```

---

## 5. 异步操作与状态管理

### 5.1 交易流程的多个状态

```typescript
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useState } from 'react'

function MintButton() {
  const [txHash, setTxHash] = useState<Hash>()

  // 1. 写入合约
  const { writeContract, isPending: isWriting } = useWriteContract()

  // 2. 等待确认
  const {
    isLoading: isConfirming,
    isSuccess,
    error: confirmError,
  } = useWaitForTransactionReceipt({ hash: txHash })

  const handleMint = async () => {
    try {
      const hash = await writeContract({...})
      setTxHash(hash)
    } catch (error) {
      // 用户拒绝或失败
    }
  }

  // UI 状态
  if (isWriting) return <button disabled>Waiting for approval...</button>
  if (isConfirming) return <button disabled>Confirming transaction...</button>
  if (isSuccess) return <p>✅ Minted successfully!</p>

  return <button onClick={handleMint}>Mint NFT</button>
}
```

---

### 5.2 乐观 UI 更新

```typescript
import { useQueryClient } from '@tanstack/react-query'

function TransferButton() {
  const queryClient = useQueryClient()
  const { writeContract } = useWriteContract()

  const handleTransfer = async () => {
    // 1. 乐观更新 UI
    queryClient.setQueryData(['balance'], (old: bigint) => old - parseEther('1'))

    try {
      const hash = await writeContract({...})
      await waitForTransactionReceipt({ hash })

      // 2. 确认后刷新真实数据
      queryClient.invalidateQueries({ queryKey: ['balance'] })
    } catch (error) {
      // 3. 失败时回滚
      queryClient.invalidateQueries({ queryKey: ['balance'] })
    }
  }
}
```

---

### 5.3 轮询与实时更新

```typescript
import { useReadContract } from 'wagmi'

function TokenBalance() {
  const { data: balance } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [userAddress],
    query: {
      refetchInterval: 10000,  // ✅ 每 10 秒刷新
    },
  })

  return <p>Balance: {formatEther(balance || 0n)}</p>
}
```

---

### 5.4 条件查询

```typescript
import { useReadContract } from 'wagmi'

function NFTMetadata({ tokenId }: { tokenId?: bigint }) {
  const { data: tokenURI } = useReadContract({
    address: nftAddress,
    abi: nftAbi,
    functionName: 'tokenURI',
    args: tokenId ? [tokenId] : undefined,
    query: {
      enabled: tokenId !== undefined,  // ✅ 仅在有 tokenId 时查询
    },
  })
}
```

---

## 6. 交易流程与用户体验

### 6.1 完整的交易流程

```typescript
function CompleteTransactionFlow() {
  const [status, setStatus] = useState<'idle' | 'approving' | 'pending' | 'confirming' | 'success' | 'error'>('idle')
  const [txHash, setTxHash] = useState<Hash>()
  const [error, setError] = useState<string>()

  const { writeContract } = useWriteContract()
  const { isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  useEffect(() => {
    if (isSuccess) {
      setStatus('success')
    }
  }, [isSuccess])

  const handleTransaction = async () => {
    try {
      // 1. 用户批准
      setStatus('approving')

      const hash = await writeContract({...})

      // 2. 交易发送
      setStatus('pending')
      setTxHash(hash)

      // 3. 等待确认
      setStatus('confirming')

    } catch (error: any) {
      setStatus('error')
      setError(error.message)
    }
  }

  return (
    <div>
      {status === 'idle' && (
        <button onClick={handleTransaction}>Send Transaction</button>
      )}

      {status === 'approving' && (
        <p>👛 Please approve the transaction in your wallet...</p>
      )}

      {status === 'pending' && (
        <p>📤 Transaction sent: {txHash}</p>
      )}

      {status === 'confirming' && (
        <div>
          <p>⏳ Waiting for confirmation...</p>
          <a href={`https://etherscan.io/tx/${txHash}`} target="_blank">
            View on Etherscan
          </a>
        </div>
      )}

      {status === 'success' && (
        <p>✅ Transaction confirmed!</p>
      )}

      {status === 'error' && (
        <p>❌ Error: {error}</p>
      )}
    </div>
  )
}
```

---

### 6.2 显示 Gas 估算

```typescript
import { useEstimateGas, useGasPrice } from 'wagmi'
import { formatGwei } from 'viem'

function GasEstimate() {
  const { data: gasPrice } = useGasPrice()
  const { data: gasEstimate } = useEstimateGas({
    to: contractAddress,
    data: encodedData,
  })

  const totalCost = gasPrice && gasEstimate
    ? gasPrice * gasEstimate
    : null

  return (
    <div>
      <p>Estimated Gas: {gasEstimate?.toString()}</p>
      <p>Gas Price: {gasPrice ? formatGwei(gasPrice) : 'Loading...'} Gwei</p>
      <p>Total Cost: {totalCost ? formatEther(totalCost) : 'Calculating...'} ETH</p>
    </div>
  )
}
```

---

### 6.3 交易加速/取消

```typescript
function TransactionActions({ hash }: { hash: Hash }) {
  const { data: tx } = useTransaction({ hash })
  const { sendTransaction } = useSendTransaction()

  const speedUp = async () => {
    if (!tx) return

    // 发送相同 nonce 的交易，但 gas 更高
    await sendTransaction({
      to: tx.to,
      value: tx.value,
      data: tx.input,
      nonce: tx.nonce,
      maxFeePerGas: tx.maxFeePerGas! * 120n / 100n,  // +20% gas
    })
  }

  const cancel = async () => {
    if (!tx) return

    // 发送给自己 0 ETH，使用相同 nonce
    await sendTransaction({
      to: tx.from,
      value: 0n,
      nonce: tx.nonce,
      maxFeePerGas: tx.maxFeePerGas! * 120n / 100n,
    })
  }

  return (
    <div>
      <button onClick={speedUp}>Speed Up</button>
      <button onClick={cancel}>Cancel</button>
    </div>
  )
}
```

---

## 7. 错误处理

### 7.1 常见错误类型

```typescript
import { BaseError, UserRejectedRequestError, ContractFunctionRevertedError } from 'viem'

function handleError(error: any) {
  if (error instanceof UserRejectedRequestError) {
    // 用户拒绝交易
    notification.info('Transaction cancelled')
    return
  }

  if (error instanceof ContractFunctionRevertedError) {
    // 合约 revert
    const revertReason = error.data?.errorName || error.shortMessage
    notification.error(`Transaction failed: ${revertReason}`)
    return
  }

  if (error instanceof BaseError) {
    // 其他 viem 错误
    notification.error(error.shortMessage)
    return
  }

  // 未知错误
  console.error('Unknown error:', error)
  notification.error('An unexpected error occurred')
}
```

---

### 7.2 余额检查

```typescript
import { useBalance } from 'wagmi'

function TransferButton() {
  const { data: balance } = useBalance({ address: userAddress })
  const amount = parseEther('1')

  const handleTransfer = async () => {
    // ⚠️ 检查余额
    if (!balance || balance.value < amount) {
      alert('Insufficient balance')
      return
    }

    // 执行交易...
  }
}
```

---

### 7.3 合约调用前模拟

```typescript
import { useSimulateContract } from 'wagmi'

function SafeButton() {
  // 1. 模拟调用
  const { data: simulateData, error } = useSimulateContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: 'transfer',
    args: [recipient, amount],
  })

  const { writeContract } = useWriteContract()

  const handleTransfer = async () => {
    if (error) {
      // ⚠️ 模拟失败，显示错误
      alert(`Transaction will fail: ${error.message}`)
      return
    }

    // 2. 执行真实交易
    await writeContract(simulateData!.request)
  }
}
```

---

## 8. 安全注意事项

### 8.1 输入验证

```typescript
import { isAddress, parseEther } from 'viem'

function TransferForm() {
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')

  const handleSubmit = async () => {
    // ⚠️ 验证地址
    if (!isAddress(recipient)) {
      alert('Invalid recipient address')
      return
    }

    // ⚠️ 验证金额
    try {
      const amountWei = parseEther(amount)
      if (amountWei <= 0n) {
        alert('Amount must be greater than 0')
        return
      }
    } catch {
      alert('Invalid amount')
      return
    }

    // 执行转账...
  }
}
```

---

### 8.2 显示交易详情

```typescript
function ConfirmTransactionModal({ to, value, data }: TransactionRequest) {
  return (
    <div className="modal">
      <h2>⚠️ Confirm Transaction</h2>
      <div>
        <p><strong>To:</strong> {to}</p>
        <p><strong>Value:</strong> {formatEther(value)} ETH</p>
        <p><strong>Data:</strong> {data}</p>
      </div>
      <button onClick={confirm}>Confirm</button>
      <button onClick={cancel}>Cancel</button>
    </div>
  )
}
```

---

### 8.3 避免硬编码私钥

```typescript
// ❌ 绝对不要这样做
const PRIVATE_KEY = '0x1234567890abcdef...'
const account = privateKeyToAccount(PRIVATE_KEY)

// ✅ 使用环境变量（仅限后端）
const PRIVATE_KEY = process.env.PRIVATE_KEY!

// ✅ 前端使用钱包连接
const { address } = useAccount()
```

---

### 8.4 合约地址验证

```typescript
// ✅ 使用环境变量
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as Address

// ✅ 验证地址
if (!isAddress(CONTRACT_ADDRESS)) {
  throw new Error('Invalid contract address in environment variables')
}

// ✅ 显示给用户确认
<p>
  Contract: <Address address={CONTRACT_ADDRESS} />
</p>
```

---

## 9. 性能优化

### 9.1 减少 RPC 调用

```typescript
// ❌ 多次单独调用
const balance1 = await publicClient.readContract({...})
const balance2 = await publicClient.readContract({...})
const balance3 = await publicClient.readContract({...})

// ✅ 使用 multicall
const results = await publicClient.multicall({
  contracts: [
    { address: token1, abi, functionName: 'balanceOf', args: [user] },
    { address: token2, abi, functionName: 'balanceOf', args: [user] },
    { address: token3, abi, functionName: 'balanceOf', args: [user] },
  ],
})
```

---

### 9.2 缓存配置

```typescript
import { useReadContract } from 'wagmi'

function OptimizedComponent() {
  const { data } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: 'getData',
    query: {
      staleTime: 30000,        // 30 秒内数据不过期
      cacheTime: 300000,       // 缓存 5 分钟
      refetchInterval: false,  // 不自动刷新
    },
  })
}
```

---

### 9.3 条件渲染

```typescript
function Component() {
  const { isConnected } = useAccount()

  // ✅ 仅在连接后加载数据
  if (!isConnected) {
    return <ConnectWallet />
  }

  return <DataComponent />
}
```

---

### 9.4 懒加载组件

```typescript
import { lazy, Suspense } from 'react'

// 懒加载重量级组件
const Dashboard = lazy(() => import('./Dashboard'))

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Dashboard />
    </Suspense>
  )
}
```

---

## 10. 用户体验设计

### 10.1 加载状态

```typescript
function Component() {
  const { data, isLoading } = useReadContract({...})

  if (isLoading) {
    return (
      <div className="skeleton">
        <div className="skeleton-line"></div>
        <div className="skeleton-line"></div>
      </div>
    )
  }

  return <div>{data}</div>
}
```

---

### 10.2 交易反馈

```typescript
import { notification } from '~~/utils/scaffold-eth'

function TransactionButton() {
  const handleTransaction = async () => {
    const loadingId = notification.loading('Waiting for approval...')

    try {
      const hash = await writeContract({...})
      notification.remove(loadingId)
      notification.info('Transaction sent!')

      await waitForReceipt({ hash })
      notification.success('Transaction confirmed!')

    } catch (error) {
      notification.remove(loadingId)
      notification.error('Transaction failed')
    }
  }
}
```

---

### 10.3 引导新用户

```typescript
function WalletGuard() {
  const { isConnected } = useAccount()
  const [showHelp, setShowHelp] = useState(false)

  if (!isConnected) {
    return (
      <div>
        <h2>Connect Your Wallet</h2>
        <p>To use this app, you need a Web3 wallet like MetaMask.</p>

        {!showHelp && (
          <button onClick={() => setShowHelp(true)}>
            What's a wallet?
          </button>
        )}

        {showHelp && (
          <div className="help-box">
            <h3>What's a Web3 Wallet?</h3>
            <p>A Web3 wallet is like a digital keychain that holds your crypto assets.</p>
            <ol>
              <li>Install MetaMask extension</li>
              <li>Create a new wallet</li>
              <li>Save your secret phrase</li>
              <li>Connect to this app</li>
            </ol>
            <a href="https://metamask.io/download" target="_blank">
              Download MetaMask
            </a>
          </div>
        )}

        <ConnectButton />
      </div>
    )
  }

  return <YourApp />
}
```

---

### 10.4 错误信息本地化

```typescript
function getErrorMessage(error: any): string {
  const errorMessages: Record<string, string> = {
    'UserRejectedRequestError': '您取消了交易',
    'InsufficientFundsError': '余额不足',
    'NetworkError': '网络错误，请检查连接',
    'ContractFunctionRevertedError': '交易失败：合约拒绝',
  }

  const errorName = error.name || error.constructor.name
  return errorMessages[errorName] || '发生未知错误'
}
```

---

## 11. 测试策略

### 11.1 本地测试

```bash
# 启动本地链
yarn chain

# 部署合约
yarn deploy

# 启动前端
yarn start
```

---

### 11.2 测试网测试

```typescript
// scaffold.config.ts
import { sepolia } from 'wagmi/chains'

export const scaffoldConfig = {
  targetNetworks: [sepolia],  // 使用测试网
}
```

**测试网 ETH 水龙头：**
- Sepolia: https://sepoliafaucet.com
- Goerli: https://goerlifaucet.com

---

### 11.3 Mock 数据测试

```typescript
import { mock } from 'wagmi/connectors'

// 测试环境使用 mock 连接器
const config = createConfig({
  connectors: [
    mock({
      accounts: ['0xTest1', '0xTest2'],
      chainId: 1,
    }),
  ],
})
```

---

## 12. 常见陷阱

### 12.1 ❌ 忘记处理 BigInt

```typescript
// ❌ 错误
const total = 1.5 * 10 ** 18  // Number 精度丢失

// ✅ 正确
const total = parseEther('1.5')
```

---

### 12.2 ❌ 不等待交易确认

```typescript
// ❌ 错误：交易可能未确认
const hash = await writeContract({...})
refetchData()  // 数据可能还未更新

// ✅ 正确：等待确认
const hash = await writeContract({...})
await waitForTransactionReceipt({ hash })
refetchData()
```

---

### 12.3 ❌ 忘记检查网络

```typescript
// ❌ 错误：在错误的网络调用合约
const { data } = useReadContract({
  address: mainnetContractAddress,
  abi,
  functionName: 'getData',
})

// ✅ 正确：检查网络
const chainId = useChainId()
if (chainId !== mainnet.id) {
  return <WrongNetworkError />
}
```

---

### 12.4 ❌ 硬编码 gas 限制

```typescript
// ❌ 错误
await writeContract({
  ...params,
  gas: 100000n,  // 可能不够
})

// ✅ 正确：让钱包自动估算
await writeContract({
  ...params,
  // 不指定 gas，让钱包估算
})
```

---

### 12.5 ❌ 不处理用户拒绝

```typescript
// ❌ 错误：没有捕获用户拒绝
const handleTransaction = async () => {
  const hash = await writeContract({...})
  // 用户拒绝时会抛出错误，但没有处理
}

// ✅ 正确
const handleTransaction = async () => {
  try {
    const hash = await writeContract({...})
  } catch (error) {
    if (error instanceof UserRejectedRequestError) {
      notification.info('Transaction cancelled')
    }
  }
}
```

---

## 13. 实战 Checklist

### 13.1 开发前

- [ ] 理解合约功能和 ABI
- [ ] 确定支持的网络
- [ ] 准备测试网 ETH
- [ ] 配置 RPC 端点

---

### 13.2 钱包集成

- [ ] 处理未连接状态
- [ ] 处理连接中状态
- [ ] 处理账户切换
- [ ] 提示用户安装钱包
- [ ] 支持断开连接

---

### 13.3 网络管理

- [ ] 检测错误网络
- [ ] 提供切换网络按钮
- [ ] 处理多链部署
- [ ] 显示当前网络名称

---

### 13.4 合约交互

- [ ] 验证所有输入
- [ ] 使用 BigInt 处理金额
- [ ] 模拟交易（可选）
- [ ] 显示 gas 估算
- [ ] 处理用户拒绝
- [ ] 等待交易确认
- [ ] 刷新数据

---

### 13.5 用户体验

- [ ] 显示加载状态
- [ ] 显示交易进度
- [ ] 提供交易链接
- [ ] 错误信息清晰
- [ ] 成功/失败反馈
- [ ] 新手引导

---

### 13.6 性能优化

- [ ] 使用 multicall
- [ ] 配置缓存策略
- [ ] 条件查询
- [ ] 懒加载组件

---

### 13.7 安全检查

- [ ] 不在前端存储私钥
- [ ] 验证合约地址
- [ ] 显示交易详情
- [ ] 输入验证
- [ ] 使用环境变量

---

### 13.8 测试

- [ ] 本地链测试
- [ ] 测试网测试
- [ ] 测试所有错误场景
- [ ] 测试网络切换
- [ ] 测试账户切换

---

## 总结

### Web3 前端开发的核心要点

1. **认证方式不同**
   - Web2: 用户名/密码
   - Web3: 钱包连接

2. **数据类型不同**
   - Web2: Number
   - Web3: BigInt

3. **操作成本不同**
   - Web2: 免费
   - Web3: 需要 gas

4. **状态管理不同**
   - Web2: 同步
   - Web3: 异步（等待确认）

5. **错误处理更复杂**
   - 用户拒绝
   - 余额不足
   - 网络错误
   - 合约 revert

### 最重要的三个原则

1. **始终验证输入** - 地址、金额、网络
2. **完整的状态管理** - 连接、确认、错误
3. **优秀的用户体验** - 反馈、引导、错误提示

### 推荐工具

- **Scaffold-ETH 2** - 完整的 dApp 框架
- **wagmi** - React Hooks for Ethereum
- **viem** - 底层以太坊库
- **RainbowKit** - 钱包连接 UI

---

**祝你开发顺利！** 🚀

如有疑问，参考：
- Scaffold-ETH 2: https://scaffoldeth.io
- wagmi: https://wagmi.sh
- viem: https://viem.sh
