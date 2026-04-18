# Ponder vs The Graph 对比指南

## 目录
- [概述](#概述)
- [核心区别](#核心区别)
- [功能对比表](#功能对比表)
- [技术架构对比](#技术架构对比)
- [开发体验对比](#开发体验对比)
- [性能与成本对比](#性能与成本对比)
- [优缺点分析](#优缺点分析)
- [使用场景](#使用场景)
- [如何选择](#如何选择)
- [代码示例对比](#代码示例对比)
- [迁移指南](#迁移指南)

---

## 概述

### Ponder

**官网：** https://ponder.sh/

Ponder 是一个**开源的、自托管的**区块链数据索引框架，专注于提供：
- 类型安全的 TypeScript 开发体验
- 本地优先的开发流程
- 自动生成的 GraphQL API
- 零配置的数据库管理
- 快速的热重载开发

**核心理念：** 简化区块链数据索引，让开发者专注于业务逻辑。

### The Graph

**官网：** https://thegraph.com/

The Graph 是一个**去中心化的索引协议**，提供：
- 分布式的子图（Subgraph）托管网络
- 去中心化的查询网络
- 经济激励机制（GRT 代币）
- 企业级的可靠性和可用性

**核心理念：** 构建 Web3 的去中心化索引和查询层。

---

## 核心区别

| 维度 | Ponder | The Graph |
|------|--------|-----------|
| **架构** | 中心化，自托管 | 去中心化网络 |
| **部署方式** | 自己部署和维护 | 部署到去中心化网络 |
| **成本** | 服务器成本 | 查询费用（GRT 代币） |
| **开发语言** | TypeScript | AssemblyScript |
| **类型安全** | 原生 TypeScript | 有限的类型支持 |
| **开发工具** | 现代 TypeScript 工具链 | Graph CLI + 专用工具 |
| **本地开发** | 快速热重载，秒级更新 | 需要编译、部署、同步 |
| **数据库** | 自动管理（SQLite/Postgres） | 隐藏实现细节 |
| **GraphQL API** | 自动生成 | 需要手动定义 Schema |
| **实时性** | 实时索引 | 近实时（有延迟） |
| **可用性** | 取决于自己的基础设施 | 高可用（分布式网络） |
| **学习曲线** | 较低（熟悉 TypeScript 即可） | 较高（需学习 AssemblyScript） |
| **社区规模** | 较小，新兴项目 | 大型生态系统 |

---

## 功能对比表

### 基础功能

| 功能 | Ponder | The Graph |
|------|--------|-----------|
| 多链支持 | ✅ | ✅ |
| 事件索引 | ✅ | ✅ |
| 合约调用 | ✅ | ✅ |
| 区块处理 | ✅ | ✅ |
| GraphQL API | ✅ 自动生成 | ✅ 手动定义 |
| 全文搜索 | ✅ | ✅ |
| 时间旅行查询 | ⚠️ 有限支持 | ✅ |
| IPFS 集成 | ❌ | ✅ |

### 开发体验

| 功能 | Ponder | The Graph |
|------|--------|-----------|
| 热重载 | ✅ 极快 | ❌ |
| TypeScript | ✅ 原生支持 | ⚠️ 通过 codegen |
| 本地调试 | ✅ 标准工具 | ⚠️ 受限 |
| 类型推断 | ✅ 完整 | ⚠️ 有限 |
| IDE 支持 | ✅ 完整 | ⚠️ 中等 |
| 错误提示 | ✅ TypeScript 原生 | ⚠️ 编译时 |
| 测试支持 | ✅ 标准测试框架 | ⚠️ 有限 |

### 部署与运维

| 功能 | Ponder | The Graph |
|------|--------|-----------|
| 本地部署 | ✅ 简单 | ✅ 复杂 |
| 云部署 | ✅ 任意平台 | ⚠️ 需要 Graph Node |
| 托管服务 | ❌ 自己管理 | ✅ Studio/Network |
| 监控 | ⚠️ 自己实现 | ✅ 内置 |
| 扩展性 | ⚠️ 手动扩展 | ✅ 自动扩展 |
| 高可用 | ⚠️ 自己配置 | ✅ 网络保证 |

---

## 技术架构对比

### Ponder 架构

```
┌─────────────────────────────────────────────┐
│           Ponder 应用                        │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐      ┌─────────────────┐ │
│  │  Schema      │      │  Event Handlers │ │
│  │  (TS Types)  │ ───> │  (TypeScript)   │ │
│  └──────────────┘      └─────────────────┘ │
│         │                      │            │
│         ▼                      ▼            │
│  ┌──────────────────────────────────────┐  │
│  │       Ponder Core Engine             │  │
│  │  - 事件监听                           │  │
│  │  - 数据处理                           │  │
│  │  - GraphQL 生成                       │  │
│  └──────────────────────────────────────┘  │
│         │                      │            │
│         ▼                      ▼            │
│  ┌──────────────┐      ┌─────────────────┐ │
│  │  Database    │      │  GraphQL API    │ │
│  │ SQLite/PG    │      │  (Auto-gen)     │ │
│  └──────────────┘      └─────────────────┘ │
└─────────────────────────────────────────────┘
         │                      │
         ▼                      ▼
  持久化存储              客户端查询
```

**特点：**
- 单体架构，易于理解和部署
- 本地数据库，快速查询
- 自动生成 API，无需额外配置

### The Graph 架构

```
┌─────────────────────────────────────────────┐
│           Subgraph                          │
├─────────────────────────────────────────────┤
│  ┌──────────────┐      ┌─────────────────┐ │
│  │  Schema      │      │  Mappings       │ │
│  │  (GraphQL)   │      │ (AssemblyScript)│ │
│  └──────────────┘      └─────────────────┘ │
└─────────────────────────────────────────────┘
         │                      │
         ▼                      ▼
┌─────────────────────────────────────────────┐
│           Graph Node                        │
├─────────────────────────────────────────────┤
│  ┌──────────────┐      ┌─────────────────┐ │
│  │  Indexer     │      │  Query Engine   │ │
│  │              │      │                 │ │
│  └──────────────┘      └─────────────────┘ │
│         │                      │            │
│         ▼                      ▼            │
│  ┌──────────────┐      ┌─────────────────┐ │
│  │  PostgreSQL  │      │  GraphQL API    │ │
│  └──────────────┘      └─────────────────┘ │
└─────────────────────────────────────────────┘
         │                      │
         ▼                      ▼
┌─────────────────────────────────────────────┐
│     The Graph Network (去中心化)            │
├─────────────────────────────────────────────┤
│  Indexers | Curators | Delegators          │
└─────────────────────────────────────────────┘
         │
         ▼
    分布式查询
```

**特点：**
- 分层架构，职责分离
- 去中心化网络，高可用
- 经济激励机制

---

## 开发体验对比

### Schema 定义

**Ponder - TypeScript Schema:**
```typescript
// ponder.schema.ts
import { onchainTable } from "@ponder/core";

export const user = onchainTable("user", (t) => ({
  address: t.hex().primaryKey(),
  balance: t.bigint().notNull(),
  createdAt: t.bigint().notNull(),
}));

export const transfer = onchainTable("transfer", (t) => ({
  id: t.text().primaryKey(),
  from: t.hex().notNull(),
  to: t.hex().notNull(),
  amount: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
}));
```

**优点：**
- 类型安全
- IDE 自动补全
- 编译时错误检查
- 熟悉的 TypeScript 语法

**The Graph - GraphQL Schema:**
```graphql
# schema.graphql
type User @entity {
  id: Bytes!
  balance: BigInt!
  createdAt: BigInt!
}

type Transfer @entity {
  id: ID!
  from: Bytes!
  to: Bytes!
  amount: BigInt!
  timestamp: BigInt!
}
```

**优点：**
- GraphQL 原生
- 清晰的数据结构
- 标准化定义

**缺点：**
- 需要学习 GraphQL Schema 语法
- 类型检查较弱

### 事件处理

**Ponder - TypeScript Handlers:**
```typescript
// src/index.ts
import { ponder } from "@/generated";

ponder.on("ERC20:Transfer", async ({ event, context }) => {
  const { User, Transfer } = context.db;

  // 完整的 TypeScript 支持
  await User.upsert({
    id: event.args.to,
    create: {
      address: event.args.to,
      balance: event.args.value,
      createdAt: event.block.timestamp,
    },
    update: ({ current }) => ({
      balance: current.balance + event.args.value,
    }),
  });

  await Transfer.create({
    id: `${event.transaction.hash}-${event.logIndex}`,
    data: {
      from: event.args.from,
      to: event.args.to,
      amount: event.args.value,
      timestamp: event.block.timestamp,
    },
  });
});
```

**优点：**
- 原生 TypeScript
- async/await 支持
- 完整的类型推断
- 丰富的 npm 生态

**The Graph - AssemblyScript Mappings:**
```typescript
// src/mapping.ts
import { Transfer as TransferEvent } from "../generated/ERC20/ERC20"
import { User, Transfer } from "../generated/schema"
import { BigInt } from "@graphprotocol/graph-ts"

export function handleTransfer(event: TransferEvent): void {
  // AssemblyScript 语法
  let user = User.load(event.params.to.toHex())

  if (user == null) {
    user = new User(event.params.to.toHex())
    user.balance = BigInt.fromI32(0)
    user.createdAt = event.block.timestamp
  }

  user.balance = user.balance.plus(event.params.value)
  user.save()

  let transfer = new Transfer(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  transfer.from = event.params.from
  transfer.to = event.params.to
  transfer.amount = event.params.value
  transfer.timestamp = event.block.timestamp
  transfer.save()
}
```

**特点：**
- AssemblyScript（TypeScript 子集）
- 受限的语言特性
- 需要显式类型转换
- 无法使用大部分 npm 包

### 本地开发流程

**Ponder:**
```bash
# 1. 启动开发服务器（秒级启动）
yarn ponder:dev

# 2. 修改代码，自动热重载（1-2秒）
# 3. 立即在 http://localhost:42069 测试
# 4. 看到实时日志和错误提示
```

**优点：**
- 极快的反馈循环
- 真实的区块链数据
- 标准的开发工具

**The Graph:**
```bash
# 1. 修改 schema
vim schema.graphql

# 2. 生成代码（编译 AssemblyScript）
graph codegen

# 3. 构建 subgraph
graph build

# 4. 部署到本地节点
graph create test/my-subgraph --node http://localhost:8020
graph deploy test/my-subgraph --ipfs http://localhost:5001 --node http://localhost:8020

# 5. 等待索引完成（可能需要几分钟）
# 6. 测试查询
```

**缺点：**
- 反馈循环较慢（5-10分钟）
- 需要运行 Graph Node（Docker）
- 部署流程复杂

---

## 性能与成本对比

### 性能

| 指标 | Ponder | The Graph |
|------|--------|-----------|
| **索引速度** | 快（直接写入本地DB） | 中（分布式处理） |
| **查询延迟** | 低（本地查询） | 中（网络延迟） |
| **实时性** | 高（秒级更新） | 中（可能有延迟） |
| **历史数据** | 优秀（本地全量数据） | 优秀（分布式存储） |
| **并发查询** | 取决于服务器 | 高（分布式负载均衡） |

### 成本

**Ponder:**
- **开发成本：** 免费（开源）
- **运行成本：**
  - 小型项目：$5-20/月（VPS）
  - 中型项目：$50-200/月（云服务器）
  - 大型项目：$500+/月（专用服务器）
- **维护成本：** 需要人工监控和维护

**The Graph:**
- **开发成本：** 免费（开源）
- **托管服务（Hosted Service，已弃用）：** 曾经免费
- **去中心化网络（The Graph Network）：**
  - 查询费用：基于查询量付费（GRT 代币）
  - 典型成本：$100-1000/月（取决于查询量）
  - 需要抵押 GRT（门槛高）
- **自托管 Graph Node：**
  - 服务器成本：$100-500/月
  - 维护成本高

**成本对比示例（每月 100 万次查询）：**
- Ponder（自托管）：~$50（服务器）
- The Graph Network：~$200-500（查询费用）
- Graph Node（自托管）：~$200（服务器 + 维护）

---

## 优缺点分析

### Ponder

**优点 ✅**

1. **开发体验极佳**
   - 原生 TypeScript，无需学习新语言
   - 热重载，秒级反馈
   - 完整的 IDE 支持和类型安全

2. **简单易用**
   - 零配置数据库
   - 自动生成 GraphQL API
   - 快速上手，学习曲线平缓

3. **性能优秀**
   - 本地数据库，低延迟
   - 实时索引
   - 高效的数据处理

4. **灵活性高**
   - 可以使用任何 npm 包
   - 自由的数据库访问
   - 完全控制基础设施

5. **成本可控**
   - 无查询费用
   - 自主部署，成本透明
   - 适合预算有限的项目

**缺点 ❌**

1. **中心化风险**
   - 依赖单点服务
   - 需要自己保证可用性
   - 无去中心化保证

2. **运维负担**
   - 需要自己部署和维护
   - 监控、备份、扩展都要自己处理
   - 需要 DevOps 能力

3. **生态系统小**
   - 社区规模小
   - 学习资源有限
   - 第三方工具少

4. **高可用性挑战**
   - 需要自己配置负载均衡
   - 故障恢复依赖自己
   - 多区域部署复杂

### The Graph

**优点 ✅**

1. **去中心化**
   - 无单点故障
   - 抗审查
   - 符合 Web3 精神

2. **高可用性**
   - 分布式网络
   - 自动故障转移
   - 全球 CDN

3. **成熟生态**
   - 大型社区
   - 丰富的文档和教程
   - 众多成功案例

4. **企业级特性**
   - 监控和告警
   - 性能分析
   - 专业支持

5. **无需运维**
   - 托管在网络上
   - 自动扩展
   - 省心省力

**缺点 ❌**

1. **开发体验较差**
   - AssemblyScript 学习成本
   - 缓慢的反馈循环
   - 受限的语言特性

2. **成本较高**
   - 查询费用累积
   - 需要持有 GRT 代币
   - 不适合低预算项目

3. **灵活性受限**
   - 无法访问底层数据库
   - 受限的计算能力
   - 无法使用大部分 npm 包

4. **延迟较高**
   - 网络传输延迟
   - 索引可能有延迟
   - 不适合实时场景

5. **复杂的经济模型**
   - GRT 代币价格波动
   - Curation 机制复杂
   - 需要了解代币经济学

---

## 使用场景

### 推荐使用 Ponder

#### 1. 快速原型和 MVP
```
场景：快速验证想法，迭代产品
理由：
- 开发速度快
- 成本低
- 易于修改和调整
```

#### 2. 内部工具和仪表板
```
场景：团队内部使用的数据看板
理由：
- 不需要高可用性
- 查询量可控
- 完全控制基础设施
```

#### 3. 预算有限的项目
```
场景：个人项目、小团队、初创公司
理由：
- 低成本运行
- 无查询费用
- 可预测的开支
```

#### 4. 需要实时数据
```
场景：交易监控、实时通知、游戏状态
理由：
- 低延迟
- 实时索引
- 快速响应
```

#### 5. 复杂的数据处理
```
场景：需要复杂计算、外部 API 调用
理由：
- 完整的 TypeScript/Node.js 生态
- 可以使用任何 npm 包
- 灵活的数据处理
```

#### 6. 多链聚合
```
场景：需要跨多条链聚合数据
理由：
- 灵活的数据模型
- 统一的数据库
- 易于实现跨链查询
```

### 推荐使用 The Graph

#### 1. 生产级 dApp
```
场景：面向公众的去中心化应用
理由：
- 高可用性保证
- 去中心化
- 企业级可靠性
```

#### 2. DeFi 协议
```
场景：Uniswap、Aave、Compound 等
理由：
- 已有成熟案例
- 社区支持
- 审计和安全
```

#### 3. NFT 市场和平台
```
场景：OpenSea、Rarible 类型的平台
理由：
- 高并发查询
- 全球用户访问
- 标准化 API
```

#### 4. 数据分析平台
```
场景：Dune Analytics、Nansen 类型
理由：
- 历史数据完整
- 时间旅行查询
- 数据质量保证
```

#### 5. 跨项目数据共享
```
场景：多个项目使用同一份数据
理由：
- 公共基础设施
- 数据复用
- 降低重复工作
```

#### 6. 需要去中心化保证
```
场景：治理投票、DAO、公共产品
理由：
- 抗审查
- 无单点故障
- 符合去中心化理念
```

---

## 如何选择

### 决策树

```
开始
  │
  ▼
是否需要去中心化？
  │
  ├─ 是 ──────────────────────> The Graph
  │
  ▼
预算是否充足（>$500/月）？
  │
  ├─ 否 ──────────────────────> Ponder
  │
  ▼
是否有 DevOps 能力？
  │
  ├─ 否 ──────────────────────> The Graph
  │
  ▼
是否需要复杂的数据处理？
  │
  ├─ 是 ──────────────────────> Ponder
  │
  ▼
是否需要快速迭代？
  │
  ├─ 是 ──────────────────────> Ponder
  │
  ▼
是否需要企业级可用性？
  │
  ├─ 是 ──────────────────────> The Graph
  │
  ▼
默认推荐 ─────────────────────> Ponder (开发阶段)
                              The Graph (生产阶段)
```

### 混合方案

**推荐策略：Ponder 开发，The Graph 生产**

```
阶段 1: 开发和测试
├─ 使用 Ponder
├─ 快速迭代
├─ 验证逻辑
└─ 确定 Schema

阶段 2: 公开测试
├─ 继续使用 Ponder
├─ 小规模用户
└─ 收集反馈

阶段 3: 生产部署
├─ 迁移到 The Graph
├─ 或者升级 Ponder 基础设施
└─ 根据实际需求决定
```

### 评估清单

在做决定前，回答这些问题：

**技术评估：**
- [ ] 团队是否熟悉 TypeScript？
- [ ] 团队是否有 DevOps 经验？
- [ ] 是否需要复杂的数据处理？
- [ ] 是否需要使用外部 API？
- [ ] 数据量预期有多大？

**业务评估：**
- [ ] 月预算是多少？
- [ ] 预期查询量是多少？
- [ ] 对可用性的要求（99%、99.9%、99.99%）？
- [ ] 是否需要去中心化？
- [ ] 项目阶段（原型、测试、生产）？

**运维评估：**
- [ ] 是否有专人负责运维？
- [ ] 是否需要 24/7 监控？
- [ ] 能否接受偶尔的停机？
- [ ] 是否需要多区域部署？

---

## 代码示例对比

### 完整示例：ERC20 代币索引

#### Ponder 实现

**1. Schema 定义 (ponder.schema.ts)**
```typescript
import { onchainTable, index } from "@ponder/core";

export const account = onchainTable("account", (t) => ({
  address: t.hex().primaryKey(),
  balance: t.bigint().notNull(),
  transferCount: t.integer().notNull().default(0),
}));

export const transfer = onchainTable("transfer", (t) => ({
  id: t.text().primaryKey(),
  from: t.hex().notNull(),
  to: t.hex().notNull(),
  amount: t.bigint().notNull(),
  blockNumber: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
}));

// 索引优化
export const transferFromIndex = index("transfer_from_idx").on(transfer.from);
export const transferToIndex = index("transfer_to_idx").on(transfer.to);
```

**2. 事件处理器 (src/index.ts)**
```typescript
import { ponder } from "@/generated";

ponder.on("ERC20:Transfer", async ({ event, context }) => {
  const { Account, Transfer } = context.db;

  // 更新发送者
  if (event.args.from !== "0x0000000000000000000000000000000000000000") {
    await Account.upsert({
      id: event.args.from,
      update: ({ current }) => ({
        balance: current.balance - event.args.value,
        transferCount: current.transferCount + 1,
      }),
    });
  }

  // 更新接收者
  await Account.upsert({
    id: event.args.to,
    create: {
      address: event.args.to,
      balance: event.args.value,
      transferCount: 1,
    },
    update: ({ current }) => ({
      balance: current.balance + event.args.value,
      transferCount: current.transferCount + 1,
    }),
  });

  // 记录转账
  await Transfer.create({
    id: `${event.transaction.hash}-${event.logIndex}`,
    data: {
      from: event.args.from,
      to: event.args.to,
      amount: event.args.value,
      blockNumber: event.block.number,
      timestamp: event.block.timestamp,
    },
  });
});
```

**3. 查询 (前端)**
```typescript
import { useQuery } from '@tanstack/react-query';
import { request, gql } from 'graphql-request';

const GET_ACCOUNT = gql`
  query GetAccount($address: String!) {
    account(address: $address) {
      balance
      transferCount
    }
  }
`;

function useAccount(address: string) {
  return useQuery({
    queryKey: ['account', address],
    queryFn: () => request('http://localhost:42069', GET_ACCOUNT, { address }),
  });
}
```

#### The Graph 实现

**1. Schema 定义 (schema.graphql)**
```graphql
type Account @entity {
  id: Bytes!
  balance: BigInt!
  transferCount: Int!
}

type Transfer @entity {
  id: ID!
  from: Bytes!
  to: Bytes!
  amount: BigInt!
  blockNumber: BigInt!
  timestamp: BigInt!
}
```

**2. 事件处理器 (src/mapping.ts)**
```typescript
import { Transfer as TransferEvent } from "../generated/ERC20/ERC20"
import { Account, Transfer } from "../generated/schema"
import { BigInt, Address } from "@graphprotocol/graph-ts"

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

export function handleTransfer(event: TransferEvent): void {
  // 更新发送者
  if (event.params.from.toHex() != ZERO_ADDRESS) {
    let fromAccount = Account.load(event.params.from.toHex())
    if (fromAccount != null) {
      fromAccount.balance = fromAccount.balance.minus(event.params.value)
      fromAccount.transferCount = fromAccount.transferCount + 1
      fromAccount.save()
    }
  }

  // 更新接收者
  let toAccount = Account.load(event.params.to.toHex())
  if (toAccount == null) {
    toAccount = new Account(event.params.to.toHex())
    toAccount.balance = BigInt.fromI32(0)
    toAccount.transferCount = 0
  }
  toAccount.balance = toAccount.balance.plus(event.params.value)
  toAccount.transferCount = toAccount.transferCount + 1
  toAccount.save()

  // 记录转账
  let transfer = new Transfer(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  transfer.from = event.params.from
  transfer.to = event.params.to
  transfer.amount = event.params.value
  transfer.blockNumber = event.block.number
  transfer.timestamp = event.block.timestamp
  transfer.save()
}
```

**3. 配置文件 (subgraph.yaml)**
```yaml
specVersion: 0.0.5
schema:
  file: ./schema.graphql
dataSources:
  - kind: ethereum
    name: ERC20
    network: mainnet
    source:
      address: "0x..." # 合约地址
      abi: ERC20
      startBlock: 12345678
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities:
        - Account
        - Transfer
      abis:
        - name: ERC20
          file: ./abis/ERC20.json
      eventHandlers:
        - event: Transfer(indexed address,indexed address,uint256)
          handler: handleTransfer
      file: ./src/mapping.ts
```

**4. 查询（前端）**
```typescript
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';

const GET_ACCOUNT = gql`
  query GetAccount($address: Bytes!) {
    account(id: $address) {
      balance
      transferCount
    }
  }
`;

function useAccount(address: string) {
  return useQuery(GET_ACCOUNT, {
    variables: { address },
  });
}
```

### 代码对比总结

| 方面 | Ponder | The Graph |
|------|--------|-----------|
| **Schema** | TypeScript 函数 | GraphQL SDL |
| **类型安全** | 完整（编译时） | 中等（codegen） |
| **处理器** | async/await | 同步函数 |
| **数据操作** | upsert/create/update | load/save |
| **代码量** | 较少 | 较多 |
| **可读性** | 高 | 中等 |

---

## 迁移指南

### 从 The Graph 迁移到 Ponder

**步骤 1: 安装 Ponder**
```bash
yarn add @ponder/core
```

**步骤 2: 转换 Schema**

**The Graph:**
```graphql
type User @entity {
  id: Bytes!
  name: String!
  balance: BigInt!
}
```

**Ponder:**
```typescript
export const user = onchainTable("user", (t) => ({
  id: t.hex().primaryKey(),
  name: t.text().notNull(),
  balance: t.bigint().notNull(),
}));
```

**步骤 3: 转换事件处理器**

**The Graph:**
```typescript
export function handleEvent(event: EventType): void {
  let entity = Entity.load(event.params.id.toHex())
  if (entity == null) {
    entity = new Entity(event.params.id.toHex())
  }
  entity.field = event.params.value
  entity.save()
}
```

**Ponder:**
```typescript
ponder.on("Contract:Event", async ({ event, context }) => {
  await context.db.Entity.upsert({
    id: event.args.id,
    create: {
      field: event.args.value,
    },
    update: {
      field: event.args.value,
    },
  });
});
```

**步骤 4: 更新配置**

**The Graph (subgraph.yaml):**
```yaml
dataSources:
  - name: Contract
    source:
      address: "0x..."
      abi: Contract
```

**Ponder (ponder.config.ts):**
```typescript
export default createConfig({
  networks: {
    mainnet: {
      chainId: 1,
      transport: http(process.env.PONDER_RPC_URL_1),
    },
  },
  contracts: {
    Contract: {
      network: "mainnet",
      abi: contractAbi,
      address: "0x...",
      startBlock: 12345678,
    },
  },
});
```

### 从 Ponder 迁移到 The Graph

类似步骤，反向操作即可。

**主要注意事项：**
1. AssemblyScript 语法限制
2. 无法使用 async/await
3. 需要显式的类型转换
4. load/save 模式替代 upsert

---

## 实际项目案例

### 使用 Ponder 的项目

1. **小型 NFT 项目**
   - 成本：$10/月（Render.com）
   - 查询量：~10K/月
   - 原因：预算有限，快速开发

2. **DeFi 仪表板**
   - 成本：$50/月（DigitalOcean）
   - 查询量：~100K/月
   - 原因：实时数据，复杂计算

3. **多链聚合器**
   - 成本：$200/月（AWS）
   - 查询量：~1M/月
   - 原因：跨链查询，灵活性

### 使用 The Graph 的项目

1. **Uniswap**
   - 查询量：数十亿/月
   - 原因：高可用性，去中心化

2. **Aave**
   - 查询量：数亿/月
   - 原因：企业级可靠性

3. **OpenSea**
   - 查询量：数亿/月
   - 原因：全球用户，高并发

---

## 总结

### 快速决策指南

**选择 Ponder，如果你：**
- ✅ 正在开发 MVP 或原型
- ✅ 预算有限（<$500/月）
- ✅ 团队熟悉 TypeScript
- ✅ 需要快速迭代
- ✅ 需要复杂的数据处理
- ✅ 可以自己运维

**选择 The Graph，如果你：**
- ✅ 构建生产级 dApp
- ✅ 需要去中心化保证
- ✅ 预算充足
- ✅ 需要企业级可用性
- ✅ 不想管理基础设施
- ✅ 已有成熟的产品

### 最佳实践

**推荐路径：**
```
1. 使用 Ponder 快速开发和验证
2. 在测试网使用 Ponder 进行测试
3. 根据实际需求决定：
   - 继续使用 Ponder + 升级基础设施
   - 或迁移到 The Graph
```

**混合使用：**
- 内部工具用 Ponder
- 公开 API 用 The Graph
- 实时数据用 Ponder
- 历史数据用 The Graph

### 未来趋势

1. **Ponder** 可能会：
   - 增加更多企业级功能
   - 改善运维工具
   - 扩大社区

2. **The Graph** 可能会：
   - 降低成本
   - 改善开发体验
   - 增强去中心化

**结论：** 两者都是优秀的工具，选择取决于你的具体需求。对于大多数新项目，推荐从 Ponder 开始，根据发展需要再决定是否迁移到 The Graph。
