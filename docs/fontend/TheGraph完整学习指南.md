# The Graph 完整学习指南

## 目录
- [什么是 The Graph](#什么是-the-graph)
- [核心概念](#核心概念)
- [架构与组件](#架构与组件)
- [Subgraph 开发完整流程](#subgraph-开发完整流程)
- [GraphQL Schema 设计](#graphql-schema-设计)
- [Mapping 映射编写](#mapping-映射编写)
- [AssemblyScript 语法指南](#assemblyscript-语法指南)
- [查询 API 使用](#查询-api-使用)
- [部署与发布](#部署与发布)
- [The Graph Network](#the-graph-network)
- [高级特性](#高级特性)
- [性能优化](#性能优化)
- [最佳实践](#最佳实践)
- [实战项目](#实战项目)
- [常见问题](#常见问题)
- [学习资源](#学习资源)

---

## 什么是 The Graph

### 简介

The Graph 是一个**去中心化的区块链数据索引协议**，被称为"Web3 的 Google"。

**核心功能：**
- 从区块链中提取、处理和存储数据
- 提供 GraphQL API 供 dApp 查询
- 去中心化的索引器网络
- 基于经济激励的数据服务

**官方网站：** https://thegraph.com/

### 为什么需要 The Graph？

**问题：直接从区块链读取数据的挑战**

```typescript
// ❌ 直接从链上读取效率低下
async function getUserNFTs(address: string) {
  const contract = new Contract(NFT_ADDRESS, abi, provider);

  // 需要遍历所有 Transfer 事件
  const events = await contract.queryFilter(
    contract.filters.Transfer(null, address),
    0, // 从创世块开始
    'latest'
  );

  // 问题：
  // 1. 查询慢（可能需要几分钟）
  // 2. RPC 限制（请求量限制）
  // 3. 无法聚合和计算
  // 4. 每次都要重新查询

  return events; // 效率极低
}
```

**解决方案：The Graph 索引数据**

```typescript
// ✅ 使用 The Graph 查询，毫秒级响应
const query = gql`
  query GetUserNFTs($owner: Bytes!) {
    nfts(where: { owner: $owner }) {
      tokenId
      uri
      metadata {
        name
        image
      }
    }
  }
`;

const { nfts } = await request(GRAPH_URL, query, { owner: address });
// 快速、高效、实时
```

### The Graph 的价值

1. **性能提升** - 查询速度从分钟级降到毫秒级
2. **降低成本** - 减少 RPC 调用，降低费用
3. **复杂查询** - 支持过滤、排序、聚合、分页
4. **实时更新** - 自动索引新数据
5. **去中心化** - 无单点故障，抗审查

---

## 核心概念

### 1. Subgraph（子图）

Subgraph 是 The Graph 的核心概念，类似于传统的 API 服务。

**定义：**
```
Subgraph = Schema + Data Sources + Mappings
```

**组成部分：**

```
my-subgraph/
├── schema.graphql          # GraphQL Schema 定义
├── subgraph.yaml          # 配置文件
├── src/
│   └── mapping.ts         # 事件处理逻辑
├── abis/
│   └── Contract.json      # 合约 ABI
└── package.json
```

### 2. GraphQL Schema

定义数据模型和查询 API。

```graphql
# schema.graphql
type Token @entity {
  id: ID!
  name: String!
  symbol: String!
  decimals: Int!
  totalSupply: BigInt!
}

type Transfer @entity {
  id: ID!
  from: Bytes!
  to: Bytes!
  value: BigInt!
  timestamp: BigInt!
}
```

### 3. Data Sources（数据源）

指定要监听的智能合约。

```yaml
# subgraph.yaml
dataSources:
  - kind: ethereum
    name: ERC20Token
    network: mainnet
    source:
      address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984" # UNI
      abi: ERC20
      startBlock: 10861674
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities:
        - Token
        - Transfer
      abis:
        - name: ERC20
          file: ./abis/ERC20.json
      eventHandlers:
        - event: Transfer(indexed address,indexed address,uint256)
          handler: handleTransfer
      file: ./src/mapping.ts
```

### 4. Mappings（映射）

处理区块链事件，转换为可查询的数据。

```typescript
// src/mapping.ts
import { Transfer as TransferEvent } from "../generated/ERC20Token/ERC20"
import { Transfer } from "../generated/schema"

export function handleTransfer(event: TransferEvent): void {
  let transfer = new Transfer(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )

  transfer.from = event.params.from
  transfer.to = event.params.to
  transfer.value = event.params.value
  transfer.timestamp = event.block.timestamp

  transfer.save()
}
```

### 5. Graph Node

运行 subgraph 的服务器软件。

**职责：**
- 监听区块链事件
- 执行 mapping 代码
- 存储数据到 PostgreSQL
- 提供 GraphQL API

### 6. The Graph Network

去中心化的索引器网络。

**参与角色：**
- **Indexers（索引器）** - 运行 Graph Node，索引数据
- **Curators（策展人）** - 标记高质量 subgraph
- **Delegators（委托人）** - 质押 GRT 给索引器
- **Consumers（消费者）** - 支付查询费用

---

## 架构与组件

### 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                   dApp Frontend                         │
│                 (React, Vue, etc.)                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ GraphQL Query
                     ▼
┌─────────────────────────────────────────────────────────┐
│              The Graph Network                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐       │
│  │  Indexer 1 │  │  Indexer 2 │  │  Indexer N │       │
│  │ (Graph Node)  │ (Graph Node)  │ (Graph Node)       │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘       │
└────────┼────────────────┼────────────────┼──────────────┘
         │                │                │
         │                │                │
         ▼                ▼                ▼
┌─────────────────────────────────────────────────────────┐
│               Ethereum Network                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐       │
│  │  Contract  │  │  Contract  │  │  Contract  │       │
│  │     A      │  │     B      │  │     C      │       │
│  └────────────┘  └────────────┘  └────────────┘       │
└─────────────────────────────────────────────────────────┘
```

### Graph Node 工作流程

```
1. 区块链事件发生
   ↓
2. Graph Node 监听到事件
   ↓
3. 调用对应的 handler 函数
   ↓
4. Handler 创建/更新实体
   ↓
5. 实体保存到 PostgreSQL
   ↓
6. GraphQL API 可查询新数据
```

### 数据流

```
Smart Contract Event
         ↓
    Event Handler (Mapping)
         ↓
    Entity (Schema)
         ↓
    PostgreSQL Database
         ↓
    GraphQL API
         ↓
    dApp Query
```

---

## Subgraph 开发完整流程

### 环境准备

**1. 安装 Graph CLI**
```bash
npm install -g @graphprotocol/graph-cli
# 或
yarn global add @graphprotocol/graph-cli
```

**2. 验证安装**
```bash
graph --version
```

### 创建 Subgraph

**方法 1: 从模板创建**
```bash
graph init --product hosted-service <GITHUB_USERNAME>/<SUBGRAPH_NAME>

# 示例
graph init --product hosted-service myuser/my-first-subgraph
```

**交互式选项：**
```
✔ Protocol: ethereum
✔ Subgraph slug: my-first-subgraph
✔ Directory: my-first-subgraph
✔ Ethereum network: mainnet
✔ Contract address: 0x...
✔ Fetching ABI from Etherscan
✔ Contract name: MyContract
✔ Index contract events as entities: true
```

**方法 2: 从现有合约创建**
```bash
graph init \
  --product hosted-service \
  --from-contract 0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984 \
  --network mainnet \
  --contract-name UNI \
  myuser/uniswap-token
```

**方法 3: 从示例创建**
```bash
graph init --from-example myuser/example-subgraph
```

### 项目结构

```
my-subgraph/
├── abis/
│   └── MyContract.json        # 自动获取或手动添加
├── src/
│   └── mapping.ts             # 事件处理代码
├── generated/                 # 自动生成，不要手动修改
│   ├── schema.ts
│   └── MyContract/
│       └── MyContract.ts
├── schema.graphql             # 数据模型定义
├── subgraph.yaml             # 配置文件
├── package.json
└── tsconfig.json
```

### 开发步骤

#### 步骤 1: 定义 Schema

```graphql
# schema.graphql
type User @entity {
  id: Bytes!                   # 用户地址
  totalDeposits: BigInt!       # 总存款
  totalWithdrawals: BigInt!    # 总提款
  balance: BigInt!             # 当前余额
  depositCount: Int!           # 存款次数
  firstDepositAt: BigInt       # 首次存款时间
  lastActivityAt: BigInt!      # 最后活动时间
  deposits: [Deposit!]! @derivedFrom(field: "user")
}

type Deposit @entity {
  id: ID!                      # tx_hash-log_index
  user: User!                  # 关联用户
  amount: BigInt!              # 存款金额
  timestamp: BigInt!           # 时间戳
  blockNumber: BigInt!         # 区块号
  transactionHash: Bytes!      # 交易哈希
}

type Withdrawal @entity {
  id: ID!
  user: User!
  amount: BigInt!
  timestamp: BigInt!
  blockNumber: BigInt!
  transactionHash: Bytes!
}

# 全局统计
type GlobalStats @entity {
  id: ID!                      # 固定为 "1"
  totalUsers: Int!
  totalDeposits: BigInt!
  totalWithdrawals: BigInt!
  totalVolume: BigInt!
}
```

#### 步骤 2: 配置 subgraph.yaml

```yaml
specVersion: 0.0.5
schema:
  file: ./schema.graphql
dataSources:
  - kind: ethereum
    name: MyContract
    network: mainnet
    source:
      address: "0x..." # 合约地址
      abi: MyContract
      startBlock: 12345678 # 合约部署块高
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities:
        - User
        - Deposit
        - Withdrawal
        - GlobalStats
      abis:
        - name: MyContract
          file: ./abis/MyContract.json
      eventHandlers:
        - event: Deposit(indexed address,uint256)
          handler: handleDeposit
        - event: Withdrawal(indexed address,uint256)
          handler: handleWithdrawal
      file: ./src/mapping.ts
```

#### 步骤 3: 生成代码

```bash
graph codegen
```

**生成的文件：**
- `generated/schema.ts` - Schema 类型
- `generated/MyContract/MyContract.ts` - 合约类型

#### 步骤 4: 编写 Mapping

```typescript
// src/mapping.ts
import { BigInt, Bytes } from "@graphprotocol/graph-ts"
import {
  Deposit as DepositEvent,
  Withdrawal as WithdrawalEvent
} from "../generated/MyContract/MyContract"
import { User, Deposit, Withdrawal, GlobalStats } from "../generated/schema"

export function handleDeposit(event: DepositEvent): void {
  // 1. 加载或创建用户
  let user = User.load(event.params.user.toHex())
  if (user == null) {
    user = new User(event.params.user.toHex())
    user.totalDeposits = BigInt.fromI32(0)
    user.totalWithdrawals = BigInt.fromI32(0)
    user.balance = BigInt.fromI32(0)
    user.depositCount = 0
    user.firstDepositAt = event.block.timestamp
  }

  // 2. 更新用户数据
  user.totalDeposits = user.totalDeposits.plus(event.params.amount)
  user.balance = user.balance.plus(event.params.amount)
  user.depositCount = user.depositCount + 1
  user.lastActivityAt = event.block.timestamp
  user.save()

  // 3. 创建存款记录
  let deposit = new Deposit(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  deposit.user = user.id
  deposit.amount = event.params.amount
  deposit.timestamp = event.block.timestamp
  deposit.blockNumber = event.block.number
  deposit.transactionHash = event.transaction.hash
  deposit.save()

  // 4. 更新全局统计
  let stats = GlobalStats.load("1")
  if (stats == null) {
    stats = new GlobalStats("1")
    stats.totalUsers = 0
    stats.totalDeposits = BigInt.fromI32(0)
    stats.totalWithdrawals = BigInt.fromI32(0)
    stats.totalVolume = BigInt.fromI32(0)
  }

  // 如果是新用户，增加用户计数
  if (user.depositCount == 1) {
    stats.totalUsers = stats.totalUsers + 1
  }

  stats.totalDeposits = stats.totalDeposits.plus(event.params.amount)
  stats.totalVolume = stats.totalVolume.plus(event.params.amount)
  stats.save()
}

export function handleWithdrawal(event: WithdrawalEvent): void {
  // 类似的逻辑
  let user = User.load(event.params.user.toHex())!

  user.totalWithdrawals = user.totalWithdrawals.plus(event.params.amount)
  user.balance = user.balance.minus(event.params.amount)
  user.lastActivityAt = event.block.timestamp
  user.save()

  let withdrawal = new Withdrawal(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  withdrawal.user = user.id
  withdrawal.amount = event.params.amount
  withdrawal.timestamp = event.block.timestamp
  withdrawal.blockNumber = event.block.number
  withdrawal.transactionHash = event.transaction.hash
  withdrawal.save()

  // 更新全局统计
  let stats = GlobalStats.load("1")!
  stats.totalWithdrawals = stats.totalWithdrawals.plus(event.params.amount)
  stats.totalVolume = stats.totalVolume.plus(event.params.amount)
  stats.save()
}
```

#### 步骤 5: 构建 Subgraph

```bash
graph build
```

**输出：**
```
✔ Apply migrations
✔ Load subgraph from subgraph.yaml
  Compile data source: MyContract => build/MyContract/MyContract.wasm
✔ Compile subgraph
  Copy schema file build/schema.graphql
  Write subgraph file build/MyContract/abis/MyContract.json
  Write subgraph manifest build/subgraph.yaml
✔ Write compiled subgraph to build/
Build completed: build/subgraph.yaml
```

#### 步骤 6: 测试（可选）

**使用 Matchstick 进行单元测试：**

```bash
# 安装
npm install --save-dev matchstick-as

# 创建测试
mkdir tests
```

```typescript
// tests/mycontract.test.ts
import { assert, test, clearStore } from "matchstick-as"
import { BigInt, Address } from "@graphprotocol/graph-ts"
import { handleDeposit } from "../src/mapping"
import { createDepositEvent } from "./utils"

test("Deposit creates user and deposit entities", () => {
  let userAddress = Address.fromString("0x0000000000000000000000000000000000000001")
  let amount = BigInt.fromI32(100)

  let depositEvent = createDepositEvent(userAddress, amount)
  handleDeposit(depositEvent)

  // 断言用户被创建
  assert.entityCount("User", 1)
  assert.fieldEquals("User", userAddress.toHex(), "totalDeposits", "100")

  // 断言存款被记录
  assert.entityCount("Deposit", 1)

  clearStore()
})
```

```bash
# 运行测试
graph test
```

---

## GraphQL Schema 设计

### 基本类型

```graphql
type Example @entity {
  # 标量类型
  id: ID!                    # 唯一标识符
  string: String!            # 字符串
  int: Int!                  # 32位整数
  bigInt: BigInt!            # 大整数（256位）
  bytes: Bytes!              # 字节数组
  boolean: Boolean!          # 布尔值
  bigDecimal: BigDecimal!    # 高精度小数

  # 可选字段
  optionalField: String      # 可以为 null

  # 数组
  tags: [String!]!           # 字符串数组

  # 枚举
  status: Status!
}

enum Status {
  PENDING
  ACTIVE
  COMPLETED
}
```

### 实体关系

#### 一对一关系

```graphql
type User @entity {
  id: Bytes!
  profile: Profile           # 一对一
}

type Profile @entity {
  id: ID!
  user: User!
  bio: String
  avatar: String
}
```

#### 一对多关系

```graphql
type User @entity {
  id: Bytes!
  posts: [Post!]! @derivedFrom(field: "author")  # 一对多
}

type Post @entity {
  id: ID!
  author: User!              # 多对一
  title: String!
  content: String!
}
```

#### 多对多关系

```graphql
type User @entity {
  id: Bytes!
  groups: [UserGroup!]! @derivedFrom(field: "user")
}

type Group @entity {
  id: ID!
  members: [UserGroup!]! @derivedFrom(field: "group")
}

# 中间表
type UserGroup @entity {
  id: ID!                    # user.id + "-" + group.id
  user: User!
  group: Group!
  joinedAt: BigInt!
}
```

### 时间序列数据

```graphql
# 每日统计
type DailyStats @entity {
  id: ID!                    # 格式: YYYY-MM-DD
  date: Int!                 # Unix timestamp
  volume: BigInt!
  transactions: Int!
  uniqueUsers: Int!
}

# 每小时统计
type HourlyStats @entity {
  id: ID!                    # 格式: YYYY-MM-DD-HH
  timestamp: Int!
  volume: BigInt!
}
```

### 全文搜索

```graphql
type Article @entity {
  id: ID!
  title: String! @fulltext(name: "articleSearch", language: en)
  content: String! @fulltext(name: "articleSearch", language: en)
  tags: [String!]!
}
```

### 最佳实践

**1. ID 设计**
```graphql
# ✅ 好的 ID 设计
type Transfer @entity {
  id: ID!  # tx_hash-log_index (唯一)
}

# ❌ 不好的 ID
type Transfer @entity {
  id: ID!  # 使用递增数字（容易冲突）
}
```

**2. 索引优化**
```graphql
# 频繁查询的字段建议创建索引实体
type TokenDailyData @entity {
  id: ID!  # token_address-day_id
  token: Token!
  date: Int!
  volume: BigInt!
}
```

**3. 避免深层嵌套**
```graphql
# ✅ 扁平化设计
type Post @entity {
  id: ID!
  authorId: Bytes!
  categoryId: String!
}

# ❌ 过度嵌套
type Post @entity {
  id: ID!
  author: User!
  category: Category!
}
# 查询时会有性能问题
```

---

## Mapping 映射编写

### Event Handler 模式

```typescript
import { Transfer as TransferEvent } from "../generated/Contract/Contract"
import { Transfer } from "../generated/schema"

export function handleTransfer(event: TransferEvent): void {
  // 1. 访问事件参数
  let from = event.params.from
  let to = event.params.to
  let amount = event.params.value

  // 2. 访问区块信息
  let blockNumber = event.block.number
  let blockTimestamp = event.block.timestamp
  let blockHash = event.block.hash

  // 3. 访问交易信息
  let txHash = event.transaction.hash
  let txFrom = event.transaction.from
  let txTo = event.transaction.to
  let gasUsed = event.transaction.gasUsed

  // 4. 创建实体
  let transfer = new Transfer(txHash.toHex() + "-" + event.logIndex.toString())
  transfer.from = from
  transfer.to = to
  transfer.amount = amount
  transfer.timestamp = blockTimestamp
  transfer.save()
}
```

### Call Handler（合约调用）

```yaml
# subgraph.yaml
callHandlers:
  - function: swap(uint256,uint256,address,bytes)
    handler: handleSwap
```

```typescript
import { Swap } from "../generated/Contract/Contract"

export function handleSwap(call: Swap): void {
  // 访问输入参数
  let amount0In = call.inputs.amount0In
  let amount1In = call.inputs.amount1In

  // 访问输出（如果有）
  // let result = call.outputs.result

  // 创建实体...
}
```

### Block Handler（每个块）

```yaml
# subgraph.yaml
blockHandlers:
  - handler: handleBlock
    filter:
      kind: call
```

```typescript
import { ethereum } from "@graphprotocol/graph-ts"

export function handleBlock(block: ethereum.Block): void {
  // 每个新块都会调用
  let blockNumber = block.number
  let timestamp = block.timestamp

  // 例如：记录块统计
}
```

### 实体操作

#### 创建实体

```typescript
import { User } from "../generated/schema"
import { BigInt } from "@graphprotocol/graph-ts"

let user = new User("0x123...")
user.balance = BigInt.fromI32(0)
user.name = "Alice"
user.save()
```

#### 加载实体

```typescript
let user = User.load("0x123...")

if (user == null) {
  // 实体不存在
  user = new User("0x123...")
}

// 使用 user
user.balance = user.balance.plus(amount)
user.save()
```

#### 更新实体

```typescript
let user = User.load(userId)!  // ! 表示确定存在

user.balance = user.balance.plus(amount)
user.lastUpdate = event.block.timestamp
user.save()
```

#### 删除实体

```typescript
import { store } from "@graphprotocol/graph-ts"

// 方法 1
store.remove("User", userId)

// 方法 2（如果有实体引用）
let user = User.load(userId)
if (user != null) {
  store.remove("User", userId)
}
```

### 合约调用

```typescript
import { Contract } from "../generated/Contract/Contract"

export function handleEvent(event: SomeEvent): void {
  // 创建合约实例
  let contract = Contract.bind(event.address)

  // 调用 view 函数
  let name = contract.name()
  let symbol = contract.symbol()
  let totalSupply = contract.totalSupply()

  // 处理可能失败的调用
  let balanceResult = contract.try_balanceOf(userAddress)
  if (balanceResult.reverted) {
    log.warning("balanceOf call reverted for {}", [userAddress.toHex()])
  } else {
    let balance = balanceResult.value
    // 使用 balance
  }
}
```

### IPFS 数据

```typescript
import { ipfs, json, JSONValue } from "@graphprotocol/graph-ts"

export function handleMetadata(event: MetadataEvent): void {
  let hash = event.params.ipfsHash

  // 从 IPFS 获取数据
  let data = ipfs.cat(hash)

  if (data != null) {
    let value = json.fromBytes(data).toObject()

    if (value != null) {
      let name = value.get("name")
      let description = value.get("description")

      // 使用数据...
    }
  }
}
```

---

## AssemblyScript 语法指南

### 类型系统

```typescript
// 基本类型
let num: i32 = 42              // 32位整数
let bigNum: i64 = 999999999    // 64位整数
let flag: bool = true          // 布尔值
let text: string = "hello"     // 字符串
let decimal: f64 = 3.14        // 64位浮点数

// The Graph 特殊类型
import { BigInt, BigDecimal, Bytes, Address } from "@graphprotocol/graph-ts"

let amount: BigInt = BigInt.fromI32(100)
let price: BigDecimal = BigDecimal.fromString("1.5")
let hash: Bytes = Bytes.fromHexString("0x...")
let addr: Address = Address.fromString("0x...")
```

### BigInt 操作

```typescript
import { BigInt } from "@graphprotocol/graph-ts"

// 创建
let a = BigInt.fromI32(100)
let b = BigInt.fromString("1000000000000000000")  // 1 ETH in wei

// 算术运算
let sum = a.plus(b)           // 加法
let diff = a.minus(b)         // 减法
let product = a.times(b)      // 乘法
let quotient = a.div(b)       // 除法
let remainder = a.mod(b)      // 取模

// 比较
if (a.gt(b)) { }              // 大于
if (a.lt(b)) { }              // 小于
if (a.equals(b)) { }          // 等于
if (a.ge(b)) { }              // 大于等于
if (a.le(b)) { }              // 小于等于

// 转换
let str = a.toString()        // 转字符串
let i32 = a.toI32()          // 转 32位整数（小心溢出）
```

### 字符串操作

```typescript
// 拼接
let hello = "Hello"
let world = "World"
let message = hello + " " + world

// 不支持模板字符串！
// ❌ let msg = `Hello ${name}`  // 不支持

// ✅ 正确做法
let msg = "Hello " + name

// 转换
let num = "123"
// ❌ parseInt(num)  // 不支持
// ✅ 使用自定义逻辑或 BigInt
```

### 数组操作

```typescript
// 创建数组
let arr: string[] = []
arr.push("item1")
arr.push("item2")

// 访问
let first = arr[0]
let length = arr.length

// 遍历
for (let i = 0; i < arr.length; i++) {
  let item = arr[i]
  // 处理 item
}

// ❌ 不支持的操作
// arr.map()
// arr.filter()
// arr.reduce()

// ✅ 需要手动实现
let filtered: string[] = []
for (let i = 0; i < arr.length; i++) {
  if (condition) {
    filtered.push(arr[i])
  }
}
```

### 类型转换

```typescript
import { BigInt, Bytes, Address } from "@graphprotocol/graph-ts"

// Bytes <-> Address
let addr: Address = Address.fromString("0x...")
let bytes: Bytes = addr as Bytes

// String <-> Bytes
let str = "0x123abc"
let bytes = Bytes.fromHexString(str)
let backToStr = bytes.toHexString()

// BigInt 转换
let big = BigInt.fromI32(42)
let i32 = big.toI32()
let str = big.toString()
```

### 注意事项

**❌ AssemblyScript 不支持：**
```typescript
// 1. async/await
async function fetchData() { }  // ❌

// 2. Promise
let promise = new Promise()     // ❌

// 3. 正则表达式
let regex = /pattern/           // ❌

// 4. 大部分 Array 方法
arr.map()                       // ❌
arr.filter()                    // ❌
arr.reduce()                    // ❌

// 5. 对象解构
let { a, b } = obj              // ❌

// 6. 展开运算符
let arr2 = [...arr1]            // ❌

// 7. 可选链
obj?.property                   // ❌

// 8. 空值合并
let val = a ?? b                // ❌
```

**✅ 替代方案：**
```typescript
// 1. 使用同步代码
function processData(): void { }

// 2. 使用循环替代 map/filter
let result: string[] = []
for (let i = 0; i < arr.length; i++) {
  result.push(transform(arr[i]))
}

// 3. 使用完整的 if 语句
if (obj != null) {
  let val = obj.property
}

// 4. 使用三元运算符
let val = a != null ? a : b
```

---

## 查询 API 使用

### 基础查询

```graphql
# 查询单个实体
query {
  user(id: "0x123...") {
    id
    balance
    depositCount
  }
}

# 查询列表
query {
  users {
    id
    balance
  }
}

# 带参数的查询
query {
  users(first: 10, skip: 20) {
    id
    balance
  }
}
```

### 过滤查询

```graphql
# where 过滤
query {
  users(where: { balance_gt: "1000000000000000000" }) {
    id
    balance
  }
}

# 多条件
query {
  deposits(
    where: {
      amount_gt: "1000000000000000000"
      timestamp_gt: 1640000000
      user: "0x123..."
    }
  ) {
    id
    amount
    timestamp
  }
}
```

### 过滤运算符

```graphql
# 字符串
field: "value"              # 等于
field_not: "value"          # 不等于
field_contains: "val"       # 包含
field_not_contains: "val"   # 不包含
field_starts_with: "val"    # 开头
field_ends_with: "val"      # 结尾
field_in: ["a", "b"]        # 在列表中
field_not_in: ["a", "b"]    # 不在列表中

# 数字/BigInt
field_gt: 100               # 大于
field_gte: 100              # 大于等于
field_lt: 100               # 小于
field_lte: 100              # 小于等于

# 关系
field: "id"                 # 关联实体ID
field_: { subfield: value } # 嵌套过滤
```

### 排序

```graphql
# 单字段排序
query {
  users(orderBy: balance, orderDirection: desc) {
    id
    balance
  }
}

# 可用字段：任何实体字段
# 方向：asc (升序) 或 desc (降序)
```

### 分页

```graphql
# 偏移分页
query {
  users(first: 10, skip: 20) {
    id
  }
}

# first: 返回数量（最大 1000）
# skip: 跳过数量

# 游标分页（推荐）
query {
  users(
    first: 10
    where: { id_gt: "0x123..." }  # 上一页最后一个ID
    orderBy: id
  ) {
    id
  }
}
```

### 关系查询

```graphql
# 一对多
query {
  user(id: "0x123...") {
    id
    deposits {
      amount
      timestamp
    }
  }
}

# 反向查询
query {
  deposit(id: "tx-0") {
    id
    user {
      id
      balance
    }
  }
}

# 嵌套过滤
query {
  users(where: { deposits_: { amount_gt: "1000000" } }) {
    id
  }
}
```

### 聚合查询

The Graph 不直接支持聚合，需要在 Mapping 中预计算。

```graphql
# ❌ 不支持
query {
  deposits {
    count
    sum(field: "amount")
  }
}

# ✅ 预计算方案
type GlobalStats @entity {
  id: ID!
  totalDeposits: BigInt!
  depositCount: Int!
}

query {
  globalStats(id: "1") {
    totalDeposits
    depositCount
  }
}
```

### 全文搜索

```graphql
# Schema 中启用全文搜索
type Article @entity {
  id: ID!
  title: String! @fulltext(name: "search", language: en)
  content: String! @fulltext(name: "search", language: en)
}

# 查询
query {
  search(text: "graphql tutorial", first: 10) {
    id
    title
    content
  }
}
```

### 时间旅行查询

```graphql
# 查询特定区块的数据
query {
  users(block: { number: 15000000 }) {
    id
    balance
  }
}

# 查询特定哈希区块的数据
query {
  users(block: { hash: "0x..." }) {
    id
    balance
  }
}
```

### 前端集成示例

```typescript
import { useQuery } from '@apollo/client'
import { gql } from '@apollo/client'

// 定义查询
const GET_USER = gql`
  query GetUser($id: ID!, $first: Int!) {
    user(id: $id) {
      id
      balance
      deposits(first: $first, orderBy: timestamp, orderDirection: desc) {
        id
        amount
        timestamp
      }
    }
  }
`

// 使用查询
function UserProfile({ address }) {
  const { loading, error, data } = useQuery(GET_USER, {
    variables: {
      id: address,
      first: 10
    },
  })

  if (loading) return <p>Loading...</p>
  if (error) return <p>Error: {error.message}</p>

  return (
    <div>
      <h1>Balance: {data.user.balance}</h1>
      <ul>
        {data.user.deposits.map(deposit => (
          <li key={deposit.id}>
            {deposit.amount} at {new Date(deposit.timestamp * 1000).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

---

## 部署与发布

### 本地开发

**1. 运行本地 Graph Node（Docker）**

```yaml
# docker-compose.yml
version: '3'
services:
  graph-node:
    image: graphprotocol/graph-node
    ports:
      - '8000:8000'
      - '8001:8001'
      - '8020:8020'
      - '8030:8030'
      - '8040:8040'
    depends_on:
      - ipfs
      - postgres
    environment:
      postgres_host: postgres
      postgres_user: graph-node
      postgres_pass: let-me-in
      postgres_db: graph-node
      ipfs: 'ipfs:5001'
      ethereum: 'mainnet:https://eth-mainnet.g.alchemy.com/v2/YOUR-API-KEY'
  ipfs:
    image: ipfs/go-ipfs:v0.10.0
    ports:
      - '5001:5001'
  postgres:
    image: postgres:14
    ports:
      - '5432:5432'
    environment:
      POSTGRES_USER: graph-node
      POSTGRES_PASSWORD: let-me-in
      POSTGRES_DB: graph-node
```

```bash
docker-compose up -d
```

**2. 创建本地 Subgraph**

```bash
graph create --node http://localhost:8020/ myuser/mysubgraph
```

**3. 部署到本地节点**

```bash
graph deploy --node http://localhost:8020/ --ipfs http://localhost:5001 myuser/mysubgraph
```

**4. 查询**

```
GraphQL Endpoint: http://localhost:8000/subgraphs/name/myuser/mysubgraph
```

### Subgraph Studio 部署

**1. 创建 Subgraph**

访问 https://thegraph.com/studio/ 并连接钱包。

**2. 初始化**

```bash
graph init --studio <SUBGRAPH_SLUG>
```

**3. 认证**

```bash
graph auth --studio <DEPLOY_KEY>
```

**4. 构建**

```bash
cd my-subgraph
graph codegen && graph build
```

**5. 部署**

```bash
graph deploy --studio <SUBGRAPH_SLUG>
```

**6. 发布到网络**

在 Studio 界面点击 "Publish" 按钮。

### 托管服务部署（已弃用）

```bash
# 认证
graph auth --product hosted-service <ACCESS_TOKEN>

# 部署
graph deploy --product hosted-service <GITHUB_USER>/<SUBGRAPH_NAME>
```

### 多网络部署

```yaml
# subgraph.yaml
dataSources:
  - kind: ethereum
    name: MainnetContract
    network: mainnet
    source:
      address: "0x..."
      abi: Contract
    # ...

  - kind: ethereum
    name: PolygonContract
    network: matic
    source:
      address: "0x..."
      abi: Contract
    # ...
```

---

## The Graph Network

### 经济模型

#### GRT 代币

**用途：**
1. **查询费用** - 消费者支付查询
2. **索引奖励** - 索引器获得奖励
3. **Curation** - 策展人标记优质 subgraph
4. **Delegation** - 委托给索引器

#### 参与角色

**1. Indexers（索引器）**
- 运行 Graph Node
- 索引 subgraph
- 处理查询
- 质押 GRT（最少 100,000 GRT）
- 获得索引奖励和查询费用

**2. Curators（策展人）**
- 标记高质量 subgraph
- 质押 GRT 到 subgraph
- 获得查询费用分成
- 风险：选错 subgraph 可能损失

**3. Delegators（委托人）**
- 委托 GRT 给索引器
- 分享索引奖励
- 无需运行节点
- 风险：索引器表现不佳

**4. Consumers（消费者）**
- 使用 subgraph 查询
- 支付查询费用（GRT）
- 可以使用 API key

### 查询费用

**定价模型：**
```
查询费用 = 基础费用 × 查询复杂度 × 网络定价
```

**成本优化：**
1. 使用缓存
2. 减少查询复杂度
3. 批量查询
4. 选择性能好的索引器

### 使用 API Key

**1. 创建 API Key**
- 访问 Subgraph Studio
- 生成 API key

**2. 充值**
```
最低充值：1 GRT
```

**3. 使用**
```typescript
const SUBGRAPH_URL = `https://gateway.thegraph.com/api/${API_KEY}/subgraphs/id/${SUBGRAPH_ID}`

const { data } = await request(SUBGRAPH_URL, query)
```

**4. 监控使用**
- 在 Studio 查看查询量
- 设置预算限制
- 接收告警

---

## 高级特性

### Templates（动态数据源）

用于索引动态创建的合约。

**场景：工厂模式**
```solidity
// Factory 创建多个 Token 合约
contract TokenFactory {
    event TokenCreated(address indexed token);

    function createToken() external {
        Token newToken = new Token();
        emit TokenCreated(address(newToken));
    }
}
```

**Schema:**
```graphql
type Token @entity {
  id: Bytes!
  name: String!
  symbol: String!
  totalSupply: BigInt!
}
```

**subgraph.yaml:**
```yaml
dataSources:
  - kind: ethereum
    name: Factory
    network: mainnet
    source:
      address: "0xFactoryAddress"
      abi: Factory
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities:
        - Token
      abis:
        - name: Factory
          file: ./abis/Factory.json
        - name: ERC20
          file: ./abis/ERC20.json
      eventHandlers:
        - event: TokenCreated(indexed address)
          handler: handleTokenCreated
      file: ./src/factory.ts

templates:
  - kind: ethereum/contract
    name: Token
    network: mainnet
    source:
      abi: ERC20
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      file: ./src/token.ts
      entities:
        - Token
      abis:
        - name: ERC20
          file: ./abis/ERC20.json
      eventHandlers:
        - event: Transfer(indexed address,indexed address,uint256)
          handler: handleTransfer
```

**Mapping:**
```typescript
// src/factory.ts
import { TokenCreated } from "../generated/Factory/Factory"
import { Token as TokenTemplate } from "../generated/templates"
import { Token } from "../generated/schema"
import { ERC20 } from "../generated/Factory/ERC20"

export function handleTokenCreated(event: TokenCreated): void {
  // 创建 token 实体
  let token = new Token(event.params.token.toHex())

  // 绑定合约获取信息
  let contract = ERC20.bind(event.params.token)
  token.name = contract.name()
  token.symbol = contract.symbol()
  token.totalSupply = contract.totalSupply()
  token.save()

  // 开始监听新 token 的事件
  TokenTemplate.create(event.params.token)
}

// src/token.ts
import { Transfer } from "../generated/templates/Token/ERC20"

export function handleTransfer(event: Transfer): void {
  // 处理每个 token 的 Transfer 事件
}
```

### File Data Sources（文件数据源）

索引 IPFS 上的文件。

```yaml
# subgraph.yaml
dataSources:
  - kind: ethereum
    # ... 普通数据源

templates:
  - kind: file/ipfs
    name: Metadata
    mapping:
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      file: ./src/metadata.ts
      handler: handleMetadata
      entities:
        - NFT
      abis:
        - name: NFT
          file: ./abis/NFT.json
```

```typescript
// src/metadata.ts
import { json, Bytes, dataSource } from "@graphprotocol/graph-ts"
import { NFT } from "../generated/schema"

export function handleMetadata(content: Bytes): void {
  let nft = new NFT(dataSource.stringParam())

  let value = json.fromBytes(content).toObject()
  if (value) {
    let name = value.get("name")
    let description = value.get("description")
    let image = value.get("image")

    if (name) nft.name = name.toString()
    if (description) nft.description = description.toString()
    if (image) nft.image = image.toString()

    nft.save()
  }
}
```

**触发文件数据源：**
```typescript
import { Metadata as MetadataTemplate } from "../generated/templates"

export function handleMint(event: Mint): void {
  let nft = new NFT(event.params.tokenId.toString())
  let uri = contract.tokenURI(event.params.tokenId)

  // 假设 URI 是 "ipfs://QmXxx..."
  let ipfsHash = uri.replace("ipfs://", "")

  nft.uri = uri
  nft.save()

  // 触发 IPFS 文件索引
  MetadataTemplate.create(ipfsHash)
}
```

### Grafting（移植）

从现有 subgraph 复制数据，加快新版本索引速度。

```yaml
# subgraph.yaml
graft:
  base: QmBase... # 基础 subgraph 的 IPFS 哈希
  block: 15000000  # 从此区块开始
```

**使用场景：**
- 修复 bug后重新索引
- 添加新功能但保留历史数据
- 更改 schema 但保留部分数据

**注意：**
- 只能在开发时使用
- 不能发布到网络

---

## 性能优化

### Schema 优化

**1. 合理设计 ID**
```graphql
# ✅ 复合 ID，避免冲突
type DailyVolume @entity {
  id: ID!  # token-YYYYMMDD
  token: Token!
  date: Int!
  volume: BigInt!
}

# ❌ 简单 ID，可能冲突
type DailyVolume @entity {
  id: ID!  # 只用日期
  volume: BigInt!
}
```

**2. 避免大数组**
```graphql
# ❌ 数组可能无限增长
type User @entity {
  id: Bytes!
  allTransfers: [Transfer!]!  # 可能有几千条
}

# ✅ 使用反向关系
type User @entity {
  id: Bytes!
  transfers: [Transfer!]! @derivedFrom(field: "user")
}

# 查询时使用分页
query {
  user(id: "0x...") {
    transfers(first: 10, skip: 0) {
      id
    }
  }
}
```

**3. 预聚合数据**
```graphql
# 在 mapping 中计算统计数据
type TokenDayData @entity {
  id: ID!
  date: Int!
  dailyVolumeToken: BigDecimal!
  dailyVolumeETH: BigDecimal!
  dailyTxns: BigInt!
}
```

### Mapping 优化

**1. 批量操作**
```typescript
// ❌ 多次加载和保存
for (let i = 0; i < users.length; i++) {
  let user = User.load(users[i])
  user.balance = newBalances[i]
  user.save()
}

// ✅ 优化后（如果可能）
let updates: User[] = []
for (let i = 0; i < users.length; i++) {
  let user = User.load(users[i])
  user.balance = newBalances[i]
  updates.push(user)
}
// 批量保存（如果 API 支持）
```

**2. 避免不必要的合约调用**
```typescript
// ❌ 每次都调用合约
export function handleTransfer(event: TransferEvent): void {
  let contract = ERC20.bind(event.address)
  let name = contract.name()  // 每次transfer都调用
  // ...
}

// ✅ 只在需要时调用
export function handleTransfer(event: TransferEvent): void {
  let token = Token.load(event.address.toHex())
  if (token == null) {
    token = new Token(event.address.toHex())
    let contract = ERC20.bind(event.address)
    token.name = contract.name()  // 只调用一次
    token.save()
  }
  // ...
}
```

**3. 使用 try_call**
```typescript
// ✅ 处理可能失败的调用
let balanceResult = contract.try_balanceOf(address)
if (!balanceResult.reverted) {
  user.balance = balanceResult.value
}
```

### 查询优化

**1. 限制查询深度**
```graphql
# ❌ 过深嵌套
query {
  users {
    posts {
      comments {
        replies {
          author {
            posts {
              # ...
            }
          }
        }
      }
    }
  }
}

# ✅ 扁平化查询
query {
  users {
    id
  }
  posts(where: { author_in: $userIds }) {
    id
  }
}
```

**2. 使用分页**
```graphql
# ✅ 始终使用 first
query {
  users(first: 100, skip: 0) {
    id
  }
}
```

**3. 选择必要字段**
```graphql
# ❌ 查询所有字段
query {
  users {
    id
    balance
    name
    email
    address
    createdAt
    updatedAt
    # ... 很多字段
  }
}

# ✅ 只查询需要的
query {
  users {
    id
    balance
  }
}
```

### 索引优化

**使用 startBlock**
```yaml
# 从合约部署块开始，而不是从0开始
dataSources:
  - kind: ethereum
    source:
      address: "0x..."
      abi: Contract
      startBlock: 12345678  # ✅ 节省索引时间
```

---

## 最佳实践

### 开发流程

```
1. 设计 Schema
   ↓
2. 编写测试用例
   ↓
3. 实现 Mapping
   ↓
4. 本地测试
   ↓
5. 部署到测试网
   ↓
6. 验证数据正确性
   ↓
7. 部署到主网
   ↓
8. 监控和维护
```

### Schema 设计原则

1. **扁平化优于嵌套**
2. **使用有意义的 ID**
3. **预计算聚合数据**
4. **避免无限增长的数组**
5. **合理使用关系**

### Mapping 编码规范

```typescript
// ✅ 好的实践
export function handleEvent(event: EventType): void {
  // 1. 防御性编程
  let entity = Entity.load(id)
  if (entity == null) {
    entity = new Entity(id)
    entity.field = defaultValue
  }

  // 2. 错误处理
  let result = contract.try_method()
  if (result.reverted) {
    log.warning("Contract call reverted", [])
    return
  }

  // 3. 数据验证
  if (amount.gt(BigInt.fromI32(0))) {
    entity.amount = amount
  }

  // 4. 最后保存
  entity.save()
}
```

### 版本管理

```bash
# 使用语义化版本
v0.1.0 - 初始版本
v0.2.0 - 添加新功能
v0.2.1 - 修复 bug
v1.0.0 - 生产版本
```

### 监控和告警

1. **监控索引状态**
   - 当前区块
   - 索引延迟
   - 错误率

2. **数据质量检查**
   - 定期验证关键指标
   - 对比链上数据
   - 监控异常值

3. **查询性能**
   - 慢查询日志
   - 查询频率统计
   - 优化热点查询

---

## 实战项目

### 项目 1: ERC20 代币追踪器

**目标：** 追踪 ERC20 代币的转账和持有者。

**Schema:**
```graphql
type Token @entity {
  id: Bytes!
  name: String!
  symbol: String!
  decimals: Int!
  totalSupply: BigInt!
  holderCount: Int!
}

type Account @entity {
  id: Bytes!
  balance: BigInt!
}

type Transfer @entity {
  id: ID!
  token: Token!
  from: Account!
  to: Account!
  value: BigInt!
  timestamp: BigInt!
  blockNumber: BigInt!
}
```

**完整代码：** https://github.com/graphprotocol/example-subgraph

### 项目 2: Uniswap V2 分析

**目标：** 追踪交易对、流动性、交易量。

**Schema:**
```graphql
type Pair @entity {
  id: Bytes!
  token0: Token!
  token1: Token!
  reserve0: BigDecimal!
  reserve1: BigDecimal!
  totalSupply: BigDecimal!
  volumeToken0: BigDecimal!
  volumeToken1: BigDecimal!
  txCount: BigInt!
}

type Swap @entity {
  id: ID!
  pair: Pair!
  amount0In: BigDecimal!
  amount1In: BigDecimal!
  amount0Out: BigDecimal!
  amount1Out: BigDecimal!
  timestamp: BigInt!
}
```

**官方仓库：** https://github.com/Uniswap/v2-subgraph

### 项目 3: NFT 市场

**目标：** 追踪 NFT 铸造、转移、销售。

**Schema:**
```graphql
type NFT @entity {
  id: ID!
  tokenID: BigInt!
  owner: User!
  uri: String
  metadata: NFTMetadata
  sales: [Sale!]! @derivedFrom(field: "nft")
}

type User @entity {
  id: Bytes!
  nfts: [NFT!]! @derivedFrom(field: "owner")
  totalSpent: BigInt!
  totalEarned: BigInt!
}

type Sale @entity {
  id: ID!
  nft: NFT!
  seller: User!
  buyer: User!
  price: BigInt!
  timestamp: BigInt!
}

type NFTMetadata @entity {
  id: ID!
  name: String
  description: String
  image: String
  attributes: [Attribute!]!
}

type Attribute @entity {
  id: ID!
  trait_type: String!
  value: String!
}
```

---

## 常见问题

### 1. 索引失败怎么办？

**检查清单：**
- [ ] ABI 是否正确
- [ ] 合约地址是否正确
- [ ] startBlock 是否正确
- [ ] RPC endpoint 是否可用
- [ ] Mapping 代码是否有错误

**调试方法：**
```bash
# 查看日志
graph deploy ... --debug

# 检查特定块
graph query ... --block-number 12345678
```

### 2. 数据不一致怎么办？

**原因：**
- 链重组
- Mapping 逻辑错误
- 并发更新问题

**解决方案：**
```typescript
// 使用事务保证原子性
// 在一个 handler 中完成所有更新

export function handleEvent(event: Event): void {
  // ✅ 所有更新在一个函数中
  let entity1 = Entity1.load(id1)!
  let entity2 = Entity2.load(id2)!

  entity1.value = newValue1
  entity2.value = newValue2

  entity1.save()
  entity2.save()
}
```

### 3. 查询太慢怎么办？

**优化策略：**
1. 添加索引
2. 减少嵌套
3. 使用分页
4. 预聚合数据
5. 缓存结果

### 4. 如何处理合约升级？

**方案 1: 多数据源**
```yaml
dataSources:
  - name: ContractV1
    source:
      address: "0xOldAddress"
  - name: ContractV2
    source:
      address: "0xNewAddress"
```

**方案 2: 动态数据源**
使用 templates 处理代理合约

### 5. 如何测试 Subgraph？

```bash
# 使用 Matchstick
npm install --save-dev matchstick-as

# 编写测试
# tests/mycontract.test.ts

# 运行测试
graph test
```

### 6. 数据迁移怎么做？

```yaml
# 使用 grafting
graft:
  base: QmOldSubgraph
  block: 15000000
```

---

## 学习资源

### 官方资源

- **官方文档** - https://thegraph.com/docs/
- **开发者指南** - https://thegraph.com/docs/developer/
- **GraphQL API** - https://thegraph.com/docs/querying/graphql-api

### 示例项目

- **Uniswap V2** - https://github.com/Uniswap/v2-subgraph
- **Aave** - https://github.com/aave/protocol-subgraphs
- **Compound** - https://github.com/compound-finance/compound-v2-subgraph
- **ENS** - https://github.com/ensdomains/ens-subgraph

### 工具

- **Graph Explorer** - https://thegraph.com/explorer
- **Subgraph Studio** - https://thegraph.com/studio/
- **The Graph CLI** - https://github.com/graphprotocol/graph-cli
- **Matchstick** - https://github.com/LimeChain/matchstick

### 社区

- **Discord** - https://discord.gg/graphprotocol
- **Forum** - https://forum.thegraph.com/
- **GitHub** - https://github.com/graphprotocol
- **Twitter** - https://twitter.com/graphprotocol

### 教程

- **官方教程** - https://thegraph.academy/
- **视频教程** - https://www.youtube.com/c/TheGraphProtocol
- **博客** - https://thegraph.com/blog/

### AssemblyScript

- **官方文档** - https://www.assemblyscript.org/
- **Graph 特定 API** - https://thegraph.com/docs/assemblyscript-api

---

## 总结

### 核心要点

**1. The Graph 三要素**
```
Schema (定义数据) + Mapping (处理事件) + Queries (查询 API)
```

**2. 开发流程**
```
设计 → 编码 → 测试 → 部署 → 监控
```

**3. 关键概念**
- Subgraph：索引单元
- Entity：数据模型
- Handler：事件处理器
- Template：动态数据源

### 最佳实践总结

1. **Schema 设计**
   - 扁平化结构
   - 合理的 ID
   - 预聚合统计

2. **Mapping 编写**
   - 防御性编程
   - 错误处理
   - 性能优化

3. **查询优化**
   - 使用分页
   - 限制嵌套
   - 选择必要字段

4. **运维监控**
   - 索引状态
   - 数据质量
   - 查询性能

### 下一步学习

1. **实践项目**
   - 部署简单的 ERC20 追踪器
   - 索引 NFT 合约
   - 构建 DeFi 数据仪表板

2. **深入研究**
   - 研究 Uniswap subgraph
   - 学习高级特性（templates, grafting）
   - 了解 The Graph Network 经济模型

3. **参与社区**
   - 加入 Discord
   - 贡献开源项目
   - 分享经验

### 快速参考

```typescript
// 创建实体
let entity = new Entity(id)
entity.field = value
entity.save()

// 加载实体
let entity = Entity.load(id)
if (entity == null) { }

// 更新实体
let entity = Entity.load(id)!
entity.field = newValue
entity.save()

// 删除实体
store.remove("Entity", id)

// 合约调用
let contract = Contract.bind(address)
let result = contract.try_method()
if (!result.reverted) { }

// 大数运算
let sum = a.plus(b)
let diff = a.minus(b)
if (a.gt(b)) { }

// IPFS
let data = ipfs.cat(hash)
let json = json.fromBytes(data)
```

祝学习愉快！🚀
