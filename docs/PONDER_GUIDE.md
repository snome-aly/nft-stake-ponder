# Ponder 索引器实操指南

> 本指南帮助你快速理解并实现 StakableNFT 合约的 Ponder 索引。

---

## 目录

1. [为什么需要 Ponder](#1-为什么需要-ponder原理篇)
2. [项目配置](#2-项目配置架构篇)
3. [三步实现索引](#3-三步实现索引实操篇)
4. [StakableNFT 完整实现](#4-stakablenft-完整实现代码篇)
5. [调试和常见问题](#5-调试和常见问题排错篇)

---

## 1. 为什么需要 Ponder（原理篇）

### 1.1 问题背景

直接从区块链读取数据有以下局限性：

| 问题 | 说明 |
|------|------|
| **速度慢** | 每次查询都要访问 RPC 节点，响应时间长 |
| **查询能力有限** | 无法做复杂查询，如"查询某用户的所有 NFT" |
| **无法聚合统计** | 无法直接获取"总铸造量"、"各稀有度分布"等 |
| **历史数据难追踪** | 查询历史状态需要遍历大量区块 |

**解决方案**：监听链上事件，将数据索引到数据库中。

### 1.2 Ponder 数据流

```
┌─────────────────────────────────────────────────────────────────────┐
│                           数据流                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   区块链                Ponder 索引器              前端应用          │
│                                                                     │
│   ┌─────────┐          ┌─────────────┐          ┌─────────┐        │
│   │  合约   │  事件    │   事件      │  写入    │ SQLite/ │        │
│   │ 交易   ├─────────→│   处理器    ├─────────→│ Postgres│        │
│   │  执行   │          │             │          │         │        │
│   └─────────┘          └─────────────┘          └────┬────┘        │
│                                                      │              │
│                                                      │ 查询         │
│                                                      ▼              │
│                                               ┌─────────────┐       │
│   ┌─────────┐          GraphQL 查询           │  GraphQL    │       │
│   │  React  │←────────────────────────────────│    API      │       │
│   │  前端   │                                 │ (自动生成)   │       │
│   └─────────┘                                 └─────────────┘       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.3 与 The Graph 对比

| 特性 | Ponder | The Graph |
|------|--------|-----------|
| 本地开发 | 原生支持，无需部署 | 需要本地节点或托管服务 |
| 学习曲线 | 简单，纯 TypeScript | 需要学习 AssemblyScript |
| 部署方式 | 自托管或云服务 | 托管网络或自托管 |
| 适用场景 | 中小型项目、快速原型 | 大规模生产环境 |

### 1.4 核心概念

```
┌────────────────────────────────────────────────────────────────┐
│                        Ponder 三要素                            │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐       │
│  │   Schema     │   │  事件处理器   │   │  GraphQL API │       │
│  │              │   │              │   │              │       │
│  │ 定义数据结构  │   │ 监听事件     │   │  自动生成    │       │
│  │ (数据库表)   │   │ 写入数据库   │   │  无需编写    │       │
│  │              │   │              │   │              │       │
│  │ ponder.      │   │ src/         │   │ localhost:   │       │
│  │ schema.ts    │   │ Contract.ts  │   │ 42069        │       │
│  └──────────────┘   └──────────────┘   └──────────────┘       │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 2. 项目配置（架构篇）

### 2.1 文件结构

```
packages/ponder/
├── ponder.config.ts      # 网络和合约配置（自动从部署读取）
├── ponder.schema.ts      # 数据库表定义
├── src/                  # 事件处理器目录
│   └── StakableNFT.ts    # StakableNFT 合约的事件处理
├── ponder-env.d.ts       # TypeScript 类型定义
├── .env                  # 环境变量（RPC URL 等）
└── package.json          # 依赖配置
```

### 2.2 自动化配置机制

本项目已配置自动化，**你不需要手动配置合约地址和 ABI**：

```typescript
// ponder.config.ts 核心逻辑

// 1. 从 Scaffold-ETH 配置读取目标网络
const targetNetwork = scaffoldConfig.targetNetworks[0];

// 2. 从部署文件读取合约信息
import deployedContracts from "../nextjs/contracts/deployedContracts";

// 3. 自动生成配置
const contracts = {
  StakableNFT: {
    network: targetNetwork.name,
    abi: deployedContracts[chainId].StakableNFT.abi,      // 自动读取 ABI
    address: deployedContracts[chainId].StakableNFT.address, // 自动读取地址
    startBlock: deployedContracts[chainId].StakableNFT.deployedOnBlock,
  }
};
```

**工作流程**：
```
yarn deploy  →  生成 deployedContracts.ts  →  Ponder 自动读取  →  开始索引
```

### 2.3 环境变量配置

创建 `packages/ponder/.env` 文件：

```bash
# 本地开发（Hardhat 网络）
PONDER_RPC_URL_31337=http://127.0.0.1:8545

# Sepolia 测试网
PONDER_RPC_URL_11155111=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY

# 主网
PONDER_RPC_URL_1=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
```

---

## 3. 三步实现索引（实操篇）

### Step 1: 定义 Schema

在 `ponder.schema.ts` 中定义数据表：

```typescript
import { onchainTable, index } from "ponder";

// 定义 NFT 表
export const nft = onchainTable("nft", (t) => ({
  id: t.text().primaryKey(),           // tokenId 作为主键
  owner: t.hex().notNull(),             // 当前所有者地址
  tokenId: t.integer().notNull(),       // Token ID
  rarity: t.integer(),                  // 稀有度 (0-3)
  isRevealed: t.boolean().default(false), // 是否已揭示
  mintedAt: t.integer().notNull(),      // 铸造时间戳
  mintedBy: t.hex().notNull(),          // 铸造者地址
}));

// 为常用查询字段添加索引
export const nftOwnerIndex = index("nft_owner_idx").on(nft.owner);
```

**数据类型对照表**：

| Solidity 类型 | Ponder 类型 | 说明 |
|--------------|-------------|------|
| `address` | `t.hex()` | 16进制地址 |
| `uint256` | `t.integer()` 或 `t.bigint()` | 数值（小数用 bigint） |
| `string` | `t.text()` | 文本 |
| `bool` | `t.boolean()` | 布尔值 |
| `bytes32` | `t.hex()` | 16进制数据 |

### Step 2: 编写事件处理器

在 `src/StakableNFT.ts` 中监听事件：

```typescript
import { ponder } from "ponder:registry";
import { nft, userStats, globalStats, mintEvent } from "ponder:schema";

// 监听 NFTMinted 事件
ponder.on("StakableNFT:NFTMinted", async ({ event, context }) => {
  const { to, startTokenId, quantity } = event.args;

  // 1. 为每个铸造的 NFT 创建记录
  for (let i = 0; i < Number(quantity); i++) {
    const tokenId = Number(startTokenId) + i;

    await context.db.insert(nft).values({
      id: tokenId.toString(),
      owner: to,
      tokenId: tokenId,
      rarity: null,  // 未揭示
      isRevealed: false,
      mintedAt: Number(event.block.timestamp),
      mintedBy: to,
    });
  }

  // 2. 记录铸造事件
  await context.db.insert(mintEvent).values({
    id: `${event.log.transactionHash}-${event.log.logIndex}`,
    to: to,
    startTokenId: Number(startTokenId),
    quantity: Number(quantity),
    timestamp: Number(event.block.timestamp),
    blockNumber: Number(event.block.number),
    transactionHash: event.log.transactionHash,
  });
});
```

**event 对象结构**：

```typescript
event = {
  args: {                    // 事件参数（从合约事件解析）
    to: "0x...",
    startTokenId: 1n,
    quantity: 5n,
  },
  log: {
    id: "...",               // 唯一标识
    transactionHash: "0x...",
    logIndex: 0,
  },
  block: {
    number: 12345n,
    timestamp: 1699999999n,
  },
  transaction: {
    hash: "0x...",
    from: "0x...",
  }
}
```

### Step 3: 启动和验证

```bash
# 1. 确保区块链在运行
yarn chain

# 2. 部署合约（如果还没部署）
yarn deploy

# 3. 启动 Ponder 开发服务器
yarn ponder:dev
```

打开 http://localhost:42069 访问 GraphQL Playground：

```graphql
# 测试查询
query {
  nfts {
    items {
      id
      tokenId
      owner
      rarity
      isRevealed
    }
  }
}
```

---

## 4. StakableNFT 完整实现（代码篇）

### 4.1 需要索引的事件

| 事件 | 触发时机 | 要更新的表 |
|------|----------|-----------|
| `NFTMinted` | 用户铸造 NFT | nft, mintEvent, userStats, globalStats |
| `Transfer` | NFT 转移 | nft, userStats |
| `RevealCompleted` | 稀有度揭示 | nft, revealEvent, globalStats |
| `RoleGranted` | 授予角色 | roleEvent |
| `RoleRevoked` | 撤销角色 | roleEvent |

### 4.2 完整事件处理器代码

创建 `packages/ponder/src/StakableNFT.ts`：

```typescript
import { ponder } from "ponder:registry";
import { eq } from "ponder";
import {
  nft,
  userStats,
  globalStats,
  mintEvent,
  revealEvent,
  roleEvent
} from "ponder:schema";

// ============================================
// NFTMinted 事件处理
// ============================================
ponder.on("StakableNFT:NFTMinted", async ({ event, context }) => {
  const { to, startTokenId, quantity } = event.args;
  const qty = Number(quantity);

  // 1. 创建每个 NFT 记录
  for (let i = 0; i < qty; i++) {
    const tokenId = Number(startTokenId) + i;

    await context.db.insert(nft).values({
      id: tokenId.toString(),
      owner: to,
      tokenId: tokenId,
      rarity: null,
      isRevealed: false,
      mintedAt: Number(event.block.timestamp),
      mintedBy: to,
    });
  }

  // 2. 记录铸造事件
  await context.db.insert(mintEvent).values({
    id: `${event.log.transactionHash}-${event.log.logIndex}`,
    to: to,
    startTokenId: Number(startTokenId),
    quantity: qty,
    timestamp: Number(event.block.timestamp),
    blockNumber: Number(event.block.number),
    transactionHash: event.log.transactionHash,
  });

  // 3. 更新用户统计
  await context.db
    .insert(userStats)
    .values({
      id: to,
      totalMinted: qty,
      currentBalance: qty,
      totalTransferred: 0,
    })
    .onConflictDoUpdate((row) => ({
      totalMinted: row.totalMinted + qty,
      currentBalance: row.currentBalance + qty,
    }));

  // 4. 更新全局统计
  await context.db
    .insert(globalStats)
    .values({
      id: "global",
      totalMinted: qty,
      totalRevealed: false,
      revealOffset: 0,
      rarityPoolSet: false,
      commonCount: 0,
      rareCount: 0,
      epicCount: 0,
      legendaryCount: 0,
    })
    .onConflictDoUpdate((row) => ({
      totalMinted: row.totalMinted + qty,
    }));
});

// ============================================
// Transfer 事件处理（追踪 NFT 所有权变化）
// ============================================
ponder.on("StakableNFT:Transfer", async ({ event, context }) => {
  const { from, to, tokenId } = event.args;
  const tokenIdStr = tokenId.toString();

  // 跳过铸造事件（from 是零地址）
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
  if (from === ZERO_ADDRESS) return;

  // 1. 更新 NFT 所有者
  await context.db
    .update(nft, { id: tokenIdStr })
    .set({ owner: to });

  // 2. 更新转出方统计
  await context.db
    .update(userStats, { id: from })
    .set((row) => ({
      currentBalance: row.currentBalance - 1,
      totalTransferred: row.totalTransferred + 1,
    }));

  // 3. 更新接收方统计
  await context.db
    .insert(userStats)
    .values({
      id: to,
      totalMinted: 0,
      currentBalance: 1,
      totalTransferred: 0,
    })
    .onConflictDoUpdate((row) => ({
      currentBalance: row.currentBalance + 1,
    }));
});

// ============================================
// RevealCompleted 事件处理（揭示稀有度）
// ============================================
ponder.on("StakableNFT:RevealCompleted", async ({ event, context }) => {
  const { offset } = event.args;

  // 1. 记录揭示事件
  await context.db.insert(revealEvent).values({
    id: event.log.transactionHash,
    offset: Number(offset),
    timestamp: Number(event.block.timestamp),
    blockNumber: Number(event.block.number),
    transactionHash: event.log.transactionHash,
  });

  // 2. 更新全局状态
  await context.db
    .update(globalStats, { id: "global" })
    .set({
      totalRevealed: true,
      revealOffset: Number(offset),
    });

  // 注意：每个 NFT 的具体稀有度需要通过合约查询
  // 可以在前端展示时调用 getRarity(tokenId)
});

// ============================================
// RoleGranted 事件处理
// ============================================
ponder.on("StakableNFT:RoleGranted", async ({ event, context }) => {
  const { role, account, sender } = event.args;

  await context.db.insert(roleEvent).values({
    id: `${event.log.transactionHash}-${event.log.logIndex}`,
    eventType: "GRANTED",
    role: role,
    account: account,
    sender: sender,
    timestamp: Number(event.block.timestamp),
    blockNumber: Number(event.block.number),
    transactionHash: event.log.transactionHash,
  });
});

// ============================================
// RoleRevoked 事件处理
// ============================================
ponder.on("StakableNFT:RoleRevoked", async ({ event, context }) => {
  const { role, account, sender } = event.args;

  await context.db.insert(roleEvent).values({
    id: `${event.log.transactionHash}-${event.log.logIndex}`,
    eventType: "REVOKED",
    role: role,
    account: account,
    sender: sender,
    timestamp: Number(event.block.timestamp),
    blockNumber: Number(event.block.number),
    transactionHash: event.log.transactionHash,
  });
});
```

### 4.3 GraphQL 查询示例

**查询用户的 NFT 列表**：

```graphql
query UserNFTs($owner: String!) {
  nfts(where: { owner: $owner }, orderBy: "tokenId", orderDirection: "asc") {
    items {
      id
      tokenId
      owner
      rarity
      isRevealed
      mintedAt
      mintedBy
    }
  }
}
```

**查询全局统计**：

```graphql
query GlobalStats {
  globalStatss {
    items {
      totalMinted
      totalRevealed
      revealOffset
      commonCount
      rareCount
      epicCount
      legendaryCount
    }
  }
}
```

**查询最近铸造记录**：

```graphql
query RecentMints {
  mintEvents(orderBy: "timestamp", orderDirection: "desc", limit: 10) {
    items {
      to
      startTokenId
      quantity
      timestamp
      transactionHash
    }
  }
}
```

**查询用户统计**：

```graphql
query UserStats($address: String!) {
  userStats(id: $address) {
    totalMinted
    currentBalance
    totalTransferred
  }
}
```

---

## 5. 调试和常见问题（排错篇）

### 5.1 常见错误

#### 错误 1：Schema 类型错误

```
Error: Invalid type for column "tokenId"
```

**原因**：Solidity `uint256` 转换为 JavaScript `bigint`，需要用 `Number()` 转换。

**解决**：
```typescript
// 错误
tokenId: event.args.tokenId,

// 正确
tokenId: Number(event.args.tokenId),
```

#### 错误 2：主键冲突

```
Error: UNIQUE constraint failed: nft.id
```

**原因**：尝试插入已存在的记录。

**解决**：使用 `onConflictDoUpdate` 或先检查是否存在。

```typescript
await context.db
  .insert(nft)
  .values({ id: "1", ... })
  .onConflictDoUpdate((row) => ({
    owner: newOwner,
  }));
```

#### 错误 3：找不到合约

```
Error: Contract "StakableNFT" not found
```

**原因**：合约未部署或 deployedContracts.ts 未更新。

**解决**：
```bash
yarn deploy  # 重新部署合约
```

### 5.2 调试技巧

**1. 查看 Ponder 日志**

启动时观察控制台输出：
```bash
yarn ponder:dev
```

正常输出：
```
✓ Loaded 1 contract(s)
✓ Synced to block 12345
✓ GraphQL server running at http://localhost:42069
```

**2. 使用 GraphQL Playground**

访问 http://localhost:42069，可以：
- 查看所有可用的查询
- 测试查询语句
- 查看返回的数据结构

**3. 添加调试日志**

```typescript
ponder.on("StakableNFT:NFTMinted", async ({ event, context }) => {
  console.log("NFTMinted event:", {
    to: event.args.to,
    startTokenId: event.args.startTokenId,
    quantity: event.args.quantity,
    block: event.block.number,
  });

  // ... 处理逻辑
});
```

### 5.3 性能优化

**1. 使用 startBlock 跳过历史**

在 `ponder.config.ts` 中设置：
```typescript
StakableNFT: {
  startBlock: 12345678,  // 从合约部署区块开始
}
```

**2. 合理设置索引**

在 `ponder.schema.ts` 中为常用查询字段添加索引：
```typescript
export const nftOwnerIndex = index("nft_owner_idx").on(nft.owner);
export const nftRarityIndex = index("nft_rarity_idx").on(nft.rarity);
```

**3. 批量操作优化**

如果需要批量更新，可以使用事务：
```typescript
// 批量插入
const values = [];
for (let i = 0; i < quantity; i++) {
  values.push({ id: i.toString(), ... });
}
await context.db.insert(nft).values(values);
```

---

## 快速参考卡片

### 常用命令

| 命令 | 说明 |
|------|------|
| `yarn ponder:dev` | 启动开发服务器 |
| `yarn ponder:codegen` | 生成 TypeScript 类型 |
| `yarn ponder:start` | 生产模式启动 |

### 数据库操作

| 操作 | 代码 |
|------|------|
| 插入 | `context.db.insert(table).values({...})` |
| 更新 | `context.db.update(table, {id}).set({...})` |
| Upsert | `context.db.insert(table).values({...}).onConflictDoUpdate(...)` |

### 事件监听格式

```typescript
ponder.on("ContractName:EventName", async ({ event, context }) => {
  // event.args    - 事件参数
  // event.log     - 日志信息
  // event.block   - 区块信息
  // context.db    - 数据库操作
});
```

---

## 下一步

1. 运行 `yarn ponder:dev` 启动索引服务
2. 在浏览器中打开 http://localhost:42069
3. 测试 GraphQL 查询
4. 铸造一个 NFT，观察数据是否被正确索引
