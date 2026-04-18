# Ponder 学习指南

## 目录
1. [什么是 Ponder？](#什么是-ponder)
2. [核心概念](#核心概念)
3. [工作原理](#工作原理)
4. [配置详解](#配置详解)
5. [Schema 设计](#schema-设计)
6. [事件索引器](#事件索引器)
7. [GraphQL API](#graphql-api)
8. [实际应用](#实际应用)
9. [最佳实践](#最佳实践)

---

## 什么是 Ponder？

**Ponder 是一个区块链事件索引框架**，用于构建高性能的链上数据 API。

### 解决的问题

```typescript
// ❌ 传统方式：直接查询链上数据
// 问题：慢、贵、受限
const nfts = []
for (let i = 0; i < 10000; i++) {
  const owner = await contract.ownerOf(i)  // 10000 次 RPC 调用！
  const uri = await contract.tokenURI(i)   // 又 10000 次！
  nfts.push({ tokenId: i, owner, uri })
}
// 耗时：几分钟，成本：可能超出 RPC 限制

// ✅ Ponder 方式：查询索引数据库
const nfts = await fetch('http://localhost:42069/graphql', {
  method: 'POST',
  body: JSON.stringify({
    query: `{ nfts { tokenId owner uri } }`
  })
})
// 耗时：毫秒级，成本：几乎为零
```

### 核心价值

- **快速查询**：毫秒级响应，替代慢速 RPC 调用
- **复杂查询**：支持过滤、排序、分页、聚合
- **历史数据**：轻松访问链上历史事件
- **实时更新**：自动监听新事件并更新数据库
- **GraphQL API**：自动生成强类型 API

---

## 核心概念

### 1. 事件索引（Event Indexing）

```
区块链事件流 → Ponder 索引器 → 数据库 → GraphQL API
```

**工作流程：**
1. 监听智能合约事件
2. 提取事件数据
3. 转换并存储到数据库
4. 通过 GraphQL 暴露数据

### 2. 三大核心文件

```
ponder/
├── ponder.config.ts      # 配置：监听哪些合约
├── ponder.schema.ts      # Schema：定义数据结构
└── src/
    └── YourContract.ts   # 索引器：处理事件逻辑
```

### 3. 架构图

```
┌─────────────────────────────────────────────────┐
│                 区块链网络                        │
│            (Ethereum, Sepolia, etc.)            │
└────────────────┬────────────────────────────────┘
                 │ 事件流 (Events)
                 ↓
┌─────────────────────────────────────────────────┐
│               Ponder 索引器                      │
│  ┌─────────────────────────────────────────┐   │
│  │   ponder.config.ts                      │   │
│  │   - 监听哪些合约                         │   │
│  │   - 从哪个区块开始                       │   │
│  └─────────────────────────────────────────┘   │
│                      ↓                          │
│  ┌─────────────────────────────────────────┐   │
│  │   src/YourContract.ts                   │   │
│  │   - 处理 Transfer 事件                   │   │
│  │   - 处理 Mint 事件                       │   │
│  │   - 更新数据库                           │   │
│  └─────────────────────────────────────────┘   │
│                      ↓                          │
│  ┌─────────────────────────────────────────┐   │
│  │   ponder.schema.ts                      │   │
│  │   - 定义 NFT 表                          │   │
│  │   - 定义 User 表                         │   │
│  └─────────────────────────────────────────┘   │
└────────────────┬────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────┐
│            数据库 (SQLite/Postgres)             │
│  ┌────────────┬────────────┬─────────────┐     │
│  │ NFT 表     │ User 表    │ Event 表    │     │
│  └────────────┴────────────┴─────────────┘     │
└────────────────┬────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────┐
│          GraphQL API (Port 42069)               │
│  Query {                                        │
│    nfts { id owner tokenId }                    │
│    users { address balance }                    │
│  }                                              │
└────────────────┬────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────┐
│              Next.js 前端                        │
│  使用 React Query 查询 GraphQL API              │
└─────────────────────────────────────────────────┘
```

---

## 工作原理

### 生命周期

```typescript
// 1. 启动 Ponder
yarn ponder:dev

// 2. Ponder 读取配置
// ponder.config.ts → 知道要监听哪些合约
// ponder.schema.ts → 知道数据结构

// 3. 历史数据同步（冷启动）
// 从 startBlock 开始扫描所有历史事件
// 例如：扫描 block 1000-5000 的所有 Transfer 事件

// 4. 实时监听（热同步）
// 监听新区块的事件
// 新区块产生 → 提取事件 → 更新数据库

// 5. 提供 GraphQL API
// http://localhost:42069
```

### 示例：NFT Transfer 的完整流程

```typescript
// 1. 链上发生事件
// 用户调用：nft.transferFrom(alice, bob, tokenId: 1)

// 2. 区块链记录事件
event Transfer(address from, address to, uint256 tokenId)
// emit Transfer(alice, bob, 1)

// 3. Ponder 捕获事件（src/NFT.ts）
ponder.on("NFT:Transfer", async ({ event, context }) => {
  const { from, to, tokenId } = event.args

  // 4. 更新数据库
  await context.db.update(nft, { id: tokenId.toString() })
    .set({ owner: to })

  // 5. 更新用户统计
  await context.db.update(user, { id: to })
    .set({ balance: sql`${user.balance} + 1` })
})

// 6. 前端查询最新数据
const { data } = useQuery({
  queryKey: ['nft', tokenId],
  queryFn: async () => {
    const res = await fetch('http://localhost:42069/graphql', {
      method: 'POST',
      body: JSON.stringify({
        query: `{ nft(id: "${tokenId}") { owner } }`
      })
    })
    return res.json()
  }
})
```

---

## 配置详解

### ponder.config.ts

```typescript
import { createConfig } from "ponder"
import { http } from "viem"

export default createConfig({
  // ==================== 网络配置 ====================
  networks: {
    // 网络名称（自定义）
    mainnet: {
      chainId: 1,  // 以太坊主网
      transport: http(process.env.PONDER_RPC_URL_1),

      // 可选配置
      maxRequestsPerSecond: 50,    // 限制 RPC 请求频率
      pollingInterval: 1000,       // 轮询新区块间隔（ms）
    },

    sepolia: {
      chainId: 11155111,  // Sepolia 测试网
      transport: http(process.env.PONDER_RPC_URL_11155111),
    },

    hardhat: {
      chainId: 31337,  // 本地 Hardhat 网络
      transport: http("http://127.0.0.1:8545"),
    },
  },

  // ==================== 合约配置 ====================
  contracts: {
    // 合约名称（用于索引器文件命名）
    NFT: {
      network: "mainnet",  // 部署的网络
      abi: nftABI,         // 合约 ABI（包含事件定义）
      address: "0x1234...", // 合约地址
      startBlock: 15000000, // 开始索引的区块号

      // 可选配置
      endBlock: 16000000,        // 结束区块（可选）
      maxBlockRange: 10000,      // 单次查询最大区块范围
      includeTransactionReceipts: false, // 是否包含交易回执

      // 工厂合约配置
      factory: {
        address: "0xFactory...",
        event: "NFTCreated",        // 创建子合约的事件
        parameter: "nftAddress",    // 事件中子合约地址的参数名
      },

      // 事件过滤器
      filter: {
        event: "Transfer",
        args: {
          from: "0x0000...",  // 只索引从零地址的转账（Mint）
        },
      },
    },

    // 多个合约
    Staking: {
      network: "mainnet",
      abi: stakingABI,
      address: "0x5678...",
      startBlock: 15500000,
    },
  },

  // ==================== 数据库配置 ====================
  database: {
    kind: "postgres",  // 或 "sqlite"
    connectionString: process.env.DATABASE_URL,
    poolConfig: {
      max: 20,  // 最大连接数
    },
  },
})
```

### 环境变量

```bash
# .env
# RPC URLs（格式：PONDER_RPC_URL_{CHAIN_ID}）
PONDER_RPC_URL_1=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
PONDER_RPC_URL_11155111=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
PONDER_RPC_URL_31337=http://127.0.0.1:8545

# 数据库
DATABASE_URL=postgresql://user:password@localhost:5432/ponder

# Ponder GraphQL 端点（生产环境）
NEXT_PUBLIC_PONDER_URL=https://your-ponder-api.com
```

---

## Schema 设计

### ponder.schema.ts

```typescript
import { onchainTable, index } from "ponder"

// ==================== 定义表 ====================

/**
 * NFT 表
 */
export const nft = onchainTable("nft", (t) => ({
  // 主键（必需）
  id: t.text().primaryKey(),  // tokenId

  // 基础字段
  owner: t.hex().notNull(),           // 所有者地址
  tokenId: t.integer().notNull(),     // Token ID（数字）
  tokenURI: t.text(),                 // 元数据 URI
  rarity: t.integer(),                // 稀有度（0-3）

  // 布尔值
  isRevealed: t.boolean().default(false),
  isStaked: t.boolean().default(false),

  // 时间戳
  mintedAt: t.integer().notNull(),
  stakedAt: t.integer(),

  // 其他
  metadata: t.json(),  // JSON 数据（存储元数据）
}))

/**
 * 用户统计表
 */
export const userStats = onchainTable("user_stats", (t) => ({
  id: t.hex().primaryKey(),           // 用户地址
  totalMinted: t.integer().default(0),
  totalStaked: t.integer().default(0),
  totalRewards: t.bigint().default(0n), // 大数字用 bigint
  firstMintAt: t.integer(),
  lastActivityAt: t.integer(),
}))

/**
 * 事件记录表
 */
export const transferEvent = onchainTable("transfer_event", (t) => ({
  id: t.text().primaryKey(),          // txHash-logIndex
  from: t.hex().notNull(),
  to: t.hex().notNull(),
  tokenId: t.integer().notNull(),
  timestamp: t.integer().notNull(),
  blockNumber: t.integer().notNull(),
  transactionHash: t.hex().notNull(),
}))

// ==================== 定义索引 ====================
// 索引可以加速查询

export const nftOwnerIndex = index("nft_owner_idx")
  .on(nft.owner)

export const nftRarityIndex = index("nft_rarity_idx")
  .on(nft.rarity)

// 复合索引
export const transferFromToIndex = index("transfer_from_to_idx")
  .on(transferEvent.from, transferEvent.to)
```

### 字段类型对照表

| Ponder 类型 | TypeScript 类型 | SQL 类型 | 说明 |
|------------|----------------|----------|------|
| `t.text()` | `string` | `TEXT` | 字符串 |
| `t.integer()` | `number` | `INTEGER` | 整数 |
| `t.bigint()` | `bigint` | `BIGINT` | 大整数（用于 Wei） |
| `t.hex()` | `0x${string}` | `BYTEA` | 十六进制（地址、哈希） |
| `t.boolean()` | `boolean` | `BOOLEAN` | 布尔值 |
| `t.json()` | `object` | `JSONB` | JSON 对象 |

### 修饰符

```typescript
t.text()
  .primaryKey()       // 主键
  .notNull()          // 不能为空
  .default("value")   // 默认值
  .unique()           // 唯一
```

---

## 事件索引器

### src/YourContract.ts

```typescript
import { ponder } from "ponder:registry"
import { nft, userStats, transferEvent } from "ponder:schema"

// ==================== 监听 Transfer 事件 ====================
ponder.on("NFT:Transfer", async ({ event, context }) => {
  const { from, to, tokenId } = event.args

  // 判断是否为 Mint（from == 0x0）
  const isMint = from === "0x0000000000000000000000000000000000000000"

  if (isMint) {
    // 创建新 NFT 记录
    await context.db.insert(nft).values({
      id: tokenId.toString(),
      owner: to,
      tokenId: Number(tokenId),
      mintedAt: Number(event.block.timestamp),
      isRevealed: false,
    })

    // 更新用户统计
    await context.db
      .insert(userStats)
      .values({
        id: to,
        totalMinted: 1,
        firstMintAt: Number(event.block.timestamp),
      })
      .onConflictDoUpdate({
        totalMinted: sql`${userStats.totalMinted} + 1`,
      })
  } else {
    // 更新 NFT 所有者
    await context.db
      .update(nft, { id: tokenId.toString() })
      .set({ owner: to })
  }

  // 记录 Transfer 事件
  await context.db.insert(transferEvent).values({
    id: `${event.log.transactionHash}-${event.log.logIndex}`,
    from,
    to,
    tokenId: Number(tokenId),
    timestamp: Number(event.block.timestamp),
    blockNumber: Number(event.block.number),
    transactionHash: event.log.transactionHash,
  })
})

// ==================== 监听 Stake 事件 ====================
ponder.on("Staking:Staked", async ({ event, context }) => {
  const { user, tokenId } = event.args

  // 更新 NFT 状态
  await context.db
    .update(nft, { id: tokenId.toString() })
    .set({
      isStaked: true,
      stakedAt: Number(event.block.timestamp),
    })

  // 更新用户统计
  await context.db
    .update(userStats, { id: user })
    .set({
      totalStaked: sql`${userStats.totalStaked} + 1`,
    })
})

// ==================== 监听 Unstake 事件 ====================
ponder.on("Staking:Unstaked", async ({ event, context }) => {
  const { user, tokenId, reward } = event.args

  // 更新 NFT 状态
  await context.db
    .update(nft, { id: tokenId.toString() })
    .set({
      isStaked: false,
      stakedAt: null,
    })

  // 更新用户奖励
  await context.db
    .update(userStats, { id: user })
    .set({
      totalStaked: sql`${userStats.totalStaked} - 1`,
      totalRewards: sql`${userStats.totalRewards} + ${reward}`,
    })
})
```

### event 对象结构

```typescript
ponder.on("NFT:Transfer", async ({ event, context }) => {
  // event.args - 事件参数
  event.args.from      // address
  event.args.to        // address
  event.args.tokenId   // bigint

  // event.log - 日志信息
  event.log.address           // 合约地址
  event.log.transactionHash   // 交易哈希
  event.log.logIndex          // 日志索引
  event.log.id                // 唯一 ID（txHash-logIndex）

  // event.block - 区块信息
  event.block.number      // 区块号
  event.block.timestamp   // 时间戳
  event.block.hash        // 区块哈希

  // event.transaction - 交易信息
  event.transaction.from  // 交易发起者
  event.transaction.to    // 交易接收者
  event.transaction.hash  // 交易哈希
})
```

### context 对象

```typescript
ponder.on("NFT:Transfer", async ({ event, context }) => {
  // context.db - 数据库操作
  await context.db.insert(nft).values({ ... })
  await context.db.update(nft, { id: "1" }).set({ ... })
  await context.db.delete(nft, { id: "1" })
  const result = await context.db.find(nft, { id: "1" })
  const results = await context.db.findMany(nft, { owner: "0x..." })

  // context.client - RPC 客户端（读取链上数据）
  const balance = await context.client.getBalance({
    address: "0x...",
  })

  const tokenURI = await context.client.readContract({
    address: nftAddress,
    abi: nftABI,
    functionName: "tokenURI",
    args: [tokenId],
  })

  // context.network - 当前网络信息
  context.network.name    // "mainnet"
  context.network.chainId // 1
})
```

### 数据库操作（CRUD）

```typescript
// ==================== Create（创建）====================
await context.db.insert(nft).values({
  id: "1",
  owner: "0x123...",
  tokenId: 1,
  mintedAt: 1234567890,
})

// 批量插入
await context.db.insert(nft).values([
  { id: "1", owner: "0x123...", tokenId: 1 },
  { id: "2", owner: "0x456...", tokenId: 2 },
])

// 冲突处理（Upsert）
await context.db
  .insert(userStats)
  .values({ id: user, totalMinted: 1 })
  .onConflictDoUpdate({
    totalMinted: sql`${userStats.totalMinted} + 1`,
  })

// ==================== Read（读取）====================
// 查找单个
const nftData = await context.db.find(nft, { id: "1" })

// 查找多个
const nfts = await context.db.findMany(nft, {
  owner: "0x123...",
  isStaked: true,
})

// ==================== Update（更新）====================
await context.db
  .update(nft, { id: "1" })
  .set({ owner: "0x456..." })

// 使用 SQL 表达式
await context.db
  .update(userStats, { id: user })
  .set({
    totalMinted: sql`${userStats.totalMinted} + 1`,
  })

// ==================== Delete（删除）====================
await context.db.delete(nft, { id: "1" })
```

---

## GraphQL API

### 自动生成的 API

Ponder 根据 schema 自动生成 GraphQL API。

#### 查询单个记录

```graphql
query {
  nft(id: "1") {
    id
    owner
    tokenId
    isStaked
    mintedAt
  }
}
```

#### 查询列表

```graphql
query {
  nfts(
    where: {
      owner: "0x123...",
      isStaked: true
    }
    orderBy: "mintedAt"
    orderDirection: "desc"
    limit: 10
    offset: 0
  ) {
    items {
      id
      owner
      tokenId
    }
    totalCount
  }
}
```

#### 过滤条件

```graphql
query {
  nfts(where: {
    # 相等
    owner: "0x123..."

    # 大于/小于
    tokenId_gt: 100
    tokenId_lt: 200

    # 包含
    owner_in: ["0x123...", "0x456..."]

    # 布尔值
    isStaked: true

    # 组合条件
    AND: [
      { rarity_gte: 2 }
      { isRevealed: true }
    ]
  }) {
    items { id }
  }
}
```

### 在 Next.js 中使用

```typescript
// hooks/usePonderNFTs.ts
import { useQuery } from '@tanstack/react-query'
import { graphql } from 'graphql-request'

const PONDER_URL = process.env.NEXT_PUBLIC_PONDER_URL || 'http://localhost:42069'

// GraphQL 查询
const GET_NFTS_QUERY = graphql`
  query GetNFTs($owner: String!, $limit: Int!) {
    nfts(
      where: { owner: $owner }
      orderBy: "mintedAt"
      orderDirection: "desc"
      limit: $limit
    ) {
      items {
        id
        tokenId
        owner
        isStaked
        mintedAt
      }
      totalCount
    }
  }
`

export function usePonderNFTs(owner: string, limit: number = 10) {
  return useQuery({
    queryKey: ['ponder-nfts', owner, limit],
    queryFn: async () => {
      const res = await fetch(PONDER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: GET_NFTS_QUERY,
          variables: { owner, limit },
        }),
      })

      const json = await res.json()
      return json.data.nfts
    },
    enabled: !!owner,
  })
}

// 使用
function MyNFTs() {
  const { address } = useAccount()
  const { data, isLoading } = usePonderNFTs(address, 20)

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      <h2>我的 NFT（共 {data.totalCount} 个）</h2>
      {data.items.map(nft => (
        <NFTCard key={nft.id} {...nft} />
      ))}
    </div>
  )
}
```

---

## 实际应用

### 示例 1：NFT 稀有度排行榜

```typescript
// ponder.schema.ts
export const nft = onchainTable("nft", (t) => ({
  id: t.text().primaryKey(),
  tokenId: t.integer().notNull(),
  owner: t.hex().notNull(),
  rarity: t.integer(),  // 0=Common, 1=Rare, 2=Epic, 3=Legendary
  rarityScore: t.integer(), // 稀有度分数（基于属性计算）
}))

// src/NFT.ts
ponder.on("NFT:MetadataUpdate", async ({ event, context }) => {
  const { tokenId } = event.args

  // 从链上读取 tokenURI
  const tokenURI = await context.client.readContract({
    address: nftAddress,
    abi: nftABI,
    functionName: "tokenURI",
    args: [tokenId],
  })

  // 获取元数据
  const metadata = await fetch(tokenURI).then(r => r.json())

  // 计算稀有度分数
  const rarityScore = calculateRarityScore(metadata.attributes)

  // 更新数据库
  await context.db
    .update(nft, { id: tokenId.toString() })
    .set({
      rarity: metadata.rarity,
      rarityScore,
    })
})

// GraphQL 查询
query {
  nfts(
    orderBy: "rarityScore"
    orderDirection: "desc"
    limit: 100
  ) {
    items {
      tokenId
      rarity
      rarityScore
    }
  }
}
```

### 示例 2：用户活动统计

```typescript
// ponder.schema.ts
export const userDailyStats = onchainTable("user_daily_stats", (t) => ({
  id: t.text().primaryKey(),  // address-date
  user: t.hex().notNull(),
  date: t.text().notNull(),
  mintsCount: t.integer().default(0),
  transfersCount: t.integer().default(0),
  stakesCount: t.integer().default(0),
}))

// src/NFT.ts
ponder.on("NFT:Transfer", async ({ event, context }) => {
  const { to } = event.args
  const date = new Date(Number(event.block.timestamp) * 1000)
    .toISOString()
    .split('T')[0]  // "2024-01-15"

  const id = `${to}-${date}`

  await context.db
    .insert(userDailyStats)
    .values({
      id,
      user: to,
      date,
      mintsCount: 1,
    })
    .onConflictDoUpdate({
      mintsCount: sql`${userDailyStats.mintsCount} + 1`,
    })
})

// GraphQL 查询：用户最近 30 天活动
query {
  userDailyStats(
    where: {
      user: "0x123..."
      date_gte: "2024-01-01"
    }
    orderBy: "date"
    orderDirection: "desc"
  ) {
    items {
      date
      mintsCount
      transfersCount
      stakesCount
    }
  }
}
```

### 示例 3：实时 Leaderboard

```typescript
// ponder.schema.ts
export const leaderboard = onchainTable("leaderboard", (t) => ({
  id: t.hex().primaryKey(),  // 用户地址
  totalPoints: t.integer().default(0),
  mintsPoints: t.integer().default(0),
  stakingPoints: t.integer().default(0),
  rank: t.integer(),
  lastUpdated: t.integer(),
}))

// src/NFT.ts
async function updateLeaderboard(
  context: any,
  user: string,
  pointsType: 'mints' | 'staking',
  points: number
) {
  await context.db
    .insert(leaderboard)
    .values({
      id: user,
      [`${pointsType}Points`]: points,
      totalPoints: points,
      lastUpdated: Math.floor(Date.now() / 1000),
    })
    .onConflictDoUpdate({
      [`${pointsType}Points`]: sql`${leaderboard[`${pointsType}Points`]} + ${points}`,
      totalPoints: sql`${leaderboard.totalPoints} + ${points}`,
      lastUpdated: Math.floor(Date.now() / 1000),
    })
}

ponder.on("NFT:Transfer", async ({ event, context }) => {
  const isMint = event.args.from === "0x0000000000000000000000000000000000000000"
  if (isMint) {
    await updateLeaderboard(context, event.args.to, 'mints', 10)
  }
})

ponder.on("Staking:Staked", async ({ event, context }) => {
  await updateLeaderboard(context, event.args.user, 'staking', 5)
})

// GraphQL 查询
query {
  leaderboard(
    orderBy: "totalPoints"
    orderDirection: "desc"
    limit: 100
  ) {
    items {
      id
      totalPoints
      mintsPoints
      stakingPoints
    }
  }
}
```

---

## 最佳实践

### 1. Schema 设计建议

```typescript
// ✅ 好的做法
export const nft = onchainTable("nft", (t) => ({
  // 1. 使用有意义的主键
  id: t.text().primaryKey(),  // tokenId 或 address-tokenId

  // 2. 必填字段用 notNull()
  owner: t.hex().notNull(),
  tokenId: t.integer().notNull(),

  // 3. 可选字段不加 notNull()
  rarity: t.integer(),

  // 4. 使用默认值
  isStaked: t.boolean().default(false),

  // 5. 时间戳存储为 integer（Unix timestamp）
  mintedAt: t.integer().notNull(),

  // 6. 大数字用 bigint（Wei 等）
  stakedAmount: t.bigint().default(0n),
}))

// ❌ 不好的做法
export const nft = onchainTable("nft", (t) => ({
  // 没有主键
  tokenId: t.integer(),

  // 所有字段都可为空（难以查询）
  owner: t.hex(),

  // 时间存储为字符串（难以排序）
  mintedAt: t.text(),
}))
```

### 2. 索引优化

```typescript
// 为常用查询字段创建索引
export const nftOwnerIndex = index("nft_owner_idx").on(nft.owner)
export const nftRarityIndex = index("nft_rarity_idx").on(nft.rarity)

// 复合索引（用于组合查询）
export const nftOwnerStakedIndex = index("nft_owner_staked_idx")
  .on(nft.owner, nft.isStaked)
```

### 3. 事件处理最佳实践

```typescript
ponder.on("NFT:Transfer", async ({ event, context }) => {
  // ✅ 1. 使用唯一 ID
  const eventId = `${event.log.transactionHash}-${event.log.logIndex}`

  // ✅ 2. 使用 try-catch 处理错误
  try {
    // ✅ 3. 先检查再操作
    const existing = await context.db.find(nft, { id: tokenId.toString() })

    if (!existing) {
      await context.db.insert(nft).values({ ... })
    } else {
      await context.db.update(nft, { id: tokenId.toString() }).set({ ... })
    }
  } catch (error) {
    console.error(`Failed to process Transfer event: ${eventId}`, error)
    // Ponder 会自动重试失败的事件
  }

  // ✅ 4. 使用 upsert（onConflictDoUpdate）
  await context.db
    .insert(userStats)
    .values({ id: user, totalMinted: 1 })
    .onConflictDoUpdate({
      totalMinted: sql`${userStats.totalMinted} + 1`,
    })
})
```

### 4. 性能优化

```typescript
// ✅ 批量操作
const transfers = []
ponder.on("NFT:Transfer", async ({ event, context }) => {
  transfers.push({ ... })

  // 每 100 个事件批量插入
  if (transfers.length >= 100) {
    await context.db.insert(transferEvent).values(transfers)
    transfers.length = 0
  }
})

// ✅ 使用 startBlock 跳过无关区块
contracts: {
  NFT: {
    startBlock: 15000000,  // 从部署区块开始
  }
}

// ✅ 避免在索引器中执行重查询
ponder.on("NFT:Transfer", async ({ event, context }) => {
  // ❌ 不要这样
  const allNFTs = await context.db.findMany(nft, {})

  // ✅ 只查询需要的数据
  const nft = await context.db.find(nft, { id: tokenId.toString() })
})
```

### 5. 开发工作流

```bash
# 1. 定义 Schema
vim ponder.schema.ts

# 2. 运行 Ponder（自动生成类型）
yarn ponder:dev

# 3. 编写索引器
vim src/NFT.ts

# 4. 测试 GraphQL 查询
# 打开 http://localhost:42069

# 5. 集成到前端
# 使用 React Query + GraphQL
```

### 6. 常见错误处理

```typescript
// 错误 1: 主键冲突
// 解决：使用 onConflictDoUpdate
await context.db
  .insert(nft)
  .values({ ... })
  .onConflictDoUpdate({ ... })

// 错误 2: 类型不匹配
// BigInt 需要转换
const tokenId = Number(event.args.tokenId)  // bigint → number
const timestamp = Number(event.block.timestamp)

// 错误 3: RPC 限制
// 解决：在 config 中设置 maxRequestsPerSecond
networks: {
  mainnet: {
    transport: http(RPC_URL),
    maxRequestsPerSecond: 50,
  }
}
```

---

## 总结

### Ponder 三件套

1. **ponder.config.ts** - 监听哪些合约
2. **ponder.schema.ts** - 数据存储结构
3. **src/*.ts** - 事件处理逻辑

### 开发流程

```
1. 设计 Schema → 定义数据结构
2. 配置合约 → 指定要索引的合约
3. 编写索引器 → 处理事件并存储数据
4. 测试查询 → 在 GraphiQL 中测试
5. 前端集成 → 使用 React Query 查询数据
```

### 何时使用 Ponder

✅ **适合：**
- 需要查询历史事件
- 需要聚合/统计数据
- 需要复杂查询（过滤、排序、分页）
- 需要高性能 API
- 构建 Dashboard/Analytics

❌ **不适合：**
- 只需要当前状态（直接用 wagmi）
- 实时交易（延迟约 1-2 个区块）
- 简单查询（直接读取合约）

### 参考资源

- 官方文档：https://ponder.sh
- GitHub：https://github.com/ponder-sh/ponder
- Discord：https://ponder.sh/discord
