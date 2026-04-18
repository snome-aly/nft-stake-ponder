# Subgraph 开发指南

## 目录结构

```
packages/subgraph/
├── abis/                          # 智能合约 ABI 文件
│   └── localhost_YourContract.json
├── graph-node/                    # 本地 Graph Node Docker 配置
│   ├── docker-compose.yml         # Docker 编排文件
│   ├── data/                      # 数据持久化目录
│   └── matchstick/                # Matchstick 测试工具配置
├── scripts/                       # 工具脚本
│   └── abi_copy.ts                # ABI 复制脚本
├── src/                           # 子图源代码
│   ├── schema.graphql             # GraphQL Schema 定义
│   └── mapping.ts                 # 事件处理映射逻辑
├── tests/                         # 单元测试
│   └── asserts.test.ts            # Matchstick 测试文件
├── subgraph.yaml                  # 子图配置清单
├── networks.json                  # 网络和合约地址配置
├── package.json                   # 包依赖和脚本
└── tsconfig.json                  # TypeScript 配置
```

## 核心文件详解

### 1. subgraph.yaml - 子图配置清单

这是子图的核心配置文件，定义了数据源、事件处理器和 Schema。

```yaml
specVersion: 0.0.4              # Graph 协议规范版本
description: Greetings          # 子图描述
schema:
  file: ./src/schema.graphql    # Schema 文件路径
dataSources:
  - kind: ethereum/contract      # 数据源类型
    name: YourContract           # 数据源名称
    network: localhost           # 网络名称（localhost/sepolia/mainnet等）
    source:
      abi: YourContract          # ABI 名称
      address: "0x5Fb..."        # 合约地址
    mapping:
      kind: ethereum/events      # 映射类型
      apiVersion: 0.0.6          # API 版本
      language: wasm/assemblyscript  # 使用 AssemblyScript
      entities:                  # 关联的实体
        - Greeting
        - Sender
      abis:
        - name: YourContract
          file: ./abis/localhost_YourContract.json
      eventHandlers:             # 事件处理器
        - event: GreetingChange(indexed address,string,bool,uint256)
          handler: handleGreetingChange
      file: ./src/mapping.ts     # 映射文件路径
```

**关键配置项：**
- `network`: 目标区块链网络
- `address`: 要索引的智能合约地址
- `eventHandlers`: 定义要监听的事件和处理函数

### 2. schema.graphql - 数据模型定义

定义了子图存储和查询的数据结构。

```graphql
type Greeting @entity(immutable:true) {
  id: ID!                        # 唯一标识符（必需）
  sender: Sender!                # 关联到 Sender 实体
  greeting: String!              # 问候消息
  premium: Boolean               # 是否为高级问候
  value: BigInt                  # 交易金额
  createdAt: BigInt!             # 创建时间戳
  transactionHash: String!       # 交易哈希
}

type Sender @entity(immutable:true) {
  id: ID!                        # 唯一标识符
  address: Bytes!                # 发送者地址
  greetings: [Greeting!] @derivedFrom(field: "sender")  # 反向关联
  createdAt: BigInt!             # 创建时间戳
  greetingCount: BigInt!         # 问候次数统计
}
```

**重要概念：**
- `@entity`: 标记为可查询的实体
- `@entity(immutable:true)`: 不可变实体（性能优化）
- `@derivedFrom`: 反向关系，自动维护
- **类型**：`ID!`, `String`, `BigInt`, `Bytes`, `Boolean` 等
- `!`: 表示字段不可为空

### 3. mapping.ts - 事件处理逻辑

这是子图的核心业务逻辑，处理智能合约事件并转换为 GraphQL 实体。

```typescript
import { BigInt, Address } from "@graphprotocol/graph-ts";
import { GreetingChange } from "../generated/YourContract/YourContract";
import { Greeting, Sender } from "../generated/schema";

export function handleGreetingChange(event: GreetingChange): void {
  // 1. 获取发送者地址的字符串形式
  let senderString = event.params.greetingSetter.toHexString();

  // 2. 尝试加载已存在的 Sender
  let sender = Sender.load(senderString);

  // 3. 如果 Sender 不存在，创建新的
  if (sender === null) {
    sender = new Sender(senderString);
    sender.address = event.params.greetingSetter;
    sender.createdAt = event.block.timestamp;
    sender.greetingCount = BigInt.fromI32(1);
  } else {
    // 4. 如果存在，增加计数
    sender.greetingCount = sender.greetingCount.plus(BigInt.fromI32(1));
  }

  // 5. 创建新的 Greeting 实体（使用唯一 ID）
  let greeting = new Greeting(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );

  // 6. 填充 Greeting 字段
  greeting.greeting = event.params.newGreeting;
  greeting.sender = senderString;
  greeting.premium = event.params.premium;
  greeting.value = event.params.value;
  greeting.createdAt = event.block.timestamp;
  greeting.transactionHash = event.transaction.hash.toHex();

  // 7. 保存实体到数据库
  greeting.save();
  sender.save();
}
```

**关键 API：**
- `Entity.load(id)`: 从数据库加载实体
- `new Entity(id)`: 创建新实体
- `entity.save()`: 保存实体到数据库
- `event.params.*`: 访问事件参数
- `event.block.*`: 访问区块信息
- `event.transaction.*`: 访问交易信息

### 4. networks.json - 网络配置

存储不同网络的合约地址，由 `abi_copy.ts` 脚本自动生成。

```json
{
  "localhost": {
    "YourContract": {
      "address": "0x5FbDB2315678afecb367f032d93F642f64180aa3"
    }
  }
}
```

### 5. graph-node/docker-compose.yml - 本地开发环境

定义了本地 Graph Node 的完整基础设施。

```yaml
services:
  graph-node:                    # Graph 索引节点
    image: graphprotocol/graph-node:v0.37.0
    ports:
      - "8000:8000"              # GraphQL HTTP 查询
      - "8001:8001"              # GraphQL WebSocket
      - "8020:8020"              # 管理 RPC
      - "8030:8030"              # 索引状态
      - "8040:8040"              # Metrics
    environment:
      ethereum: "localhost:http://host.docker.internal:8545"  # 连接到本地 Hardhat

  ipfs:                          # IPFS 存储
    image: ipfs/go-ipfs:v0.34.1
    ports:
      - "5001:5001"

  postgres:                      # PostgreSQL 数据库
    image: postgres
    ports:
      - "5432:5432"
```

**端口说明：**
- `8000`: GraphQL 查询端点
- `8545`: Hardhat 本地区块链
- `5001`: IPFS API
- `5432`: PostgreSQL

## 工作原理

### The Graph 架构

```
┌─────────────────┐
│ 智能合约事件    │
│  (Ethereum)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Graph Node     │  监听区块链事件
│  (索引器)       │  ←─── 通过 RPC (8545)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Mapping.ts     │  处理事件 → 转换数据
│  (事件处理器)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  PostgreSQL     │  存储索引数据
│  (数据库)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  GraphQL API    │  提供查询接口 (8000)
│  (查询层)       │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  Frontend       │  查询和显示数据
│  (Next.js)      │
└─────────────────┘
```

### 数据流程

1. **事件发射**：智能合约发出事件（如 `GreetingChange`）
2. **事件监听**：Graph Node 监听区块链并捕获事件
3. **事件处理**：调用 `mapping.ts` 中的处理函数
4. **数据转换**：将事件数据转换为 GraphQL 实体
5. **数据存储**：将实体保存到 PostgreSQL
6. **数据查询**：前端通过 GraphQL API 查询数据

## 开发流程

### 完整开发流程

```bash
# 1. 启动本地区块链（终端 1）
yarn chain

# 2. 部署智能合约（终端 2）
yarn deploy

# 3. 启动 Graph Node（终端 3，需要 Docker）
yarn subgraph:run-node

# 4. 创建本地子图（仅首次，终端 4）
yarn subgraph:create-local

# 5. 部署子图（终端 4）
yarn subgraph:local-ship  # 会提示输入版本号，如 0.0.1

# 6. 启动前端（终端 5）
yarn start

# 7. 构建 GraphQL Client（终端 4）
yarn graphclient:build
```

### 修改子图流程

当你修改智能合约或想要索引新的事件时：

```bash
# 1. 修改智能合约后重新部署
yarn deploy

# 2. 更新子图配置
# - 编辑 src/schema.graphql（如果需要新的数据模型）
# - 编辑 src/mapping.ts（添加/修改事件处理逻辑）
# - 编辑 subgraph.yaml（添加新的事件处理器）

# 3. 复制新的 ABI
yarn subgraph:abi-copy

# 4. 生成类型
yarn subgraph:codegen

# 5. 构建子图
yarn subgraph:build

# 6. 重新部署
yarn subgraph:deploy-local

# 或者一键完成 3-6 步
yarn subgraph:local-ship

# 7. 重新构建 GraphQL Client
yarn graphclient:build
```

### 测试流程

```bash
# 运行 Matchstick 单元测试
yarn subgraph:test

# 在 Docker 中运行测试
yarn subgraph:test -d
```

## 实战示例：添加新事件索引

假设你想索引一个新的 `Transfer` 事件：

### 步骤 1：更新 Schema

在 `src/schema.graphql` 中添加：

```graphql
type Transfer @entity {
  id: ID!
  from: Bytes!
  to: Bytes!
  amount: BigInt!
  timestamp: BigInt!
  transactionHash: String!
}
```

### 步骤 2：更新 subgraph.yaml

在 `eventHandlers` 中添加：

```yaml
eventHandlers:
  - event: GreetingChange(indexed address,string,bool,uint256)
    handler: handleGreetingChange
  - event: Transfer(indexed address,indexed address,uint256)
    handler: handleTransfer
```

### 步骤 3：编写处理函数

在 `src/mapping.ts` 中添加：

```typescript
import { Transfer as TransferEvent } from "../generated/YourContract/YourContract";
import { Transfer } from "../generated/schema";

export function handleTransfer(event: TransferEvent): void {
  let transfer = new Transfer(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );

  transfer.from = event.params.from;
  transfer.to = event.params.to;
  transfer.amount = event.params.amount;
  transfer.timestamp = event.block.timestamp;
  transfer.transactionHash = event.transaction.hash.toHex();

  transfer.save();
}
```

### 步骤 4：部署更新

```bash
yarn subgraph:local-ship
```

## 查询数据

### 在 GraphQL Playground 中测试

访问 `http://localhost:8000/subgraphs/name/scaffold-eth/your-contract/graphql`

```graphql
{
  greetings(first: 10, orderBy: createdAt, orderDirection: desc) {
    id
    greeting
    premium
    value
    createdAt
    sender {
      address
      greetingCount
    }
  }

  senders(first: 5) {
    address
    greetingCount
    greetings {
      greeting
      createdAt
    }
  }
}
```

### 在前端中使用

在 `packages/nextjs/graphql/` 创建查询文件 `GetGreetings.gql`：

```graphql
query GetGreetings {
  greetings(first: 25, orderBy: createdAt, orderDirection: desc) {
    id
    greeting
    premium
    value
    createdAt
    sender {
      address
      greetingCount
    }
  }
}
```

然后在组件中使用（参考 `packages/nextjs/app/subgraph/_components/GreetingsTable.tsx`）。

## 部署到生产环境

### 部署到 Subgraph Studio

```bash
# 1. 更新 subgraph.yaml 为生产网络
# network: sepolia (或 mainnet)
# address: "您的合约地址"
# startBlock: 5889410 (合约部署的区块号)

# 2. 在 Subgraph Studio 创建子图
# 访问 https://thegraph.com/studio

# 3. 认证
yarn graph auth --studio <DEPLOY_KEY>

# 4. 部署
yarn graph deploy --studio <SUBGRAPH_SLUG>

# 5. 更新前端配置
# 在 packages/nextjs/.graphclientrc.yml 中:
# endpoint: https://api.studio.thegraph.com/query/<ID>/<SUBGRAPH_NAME>/<VERSION>

# 6. 重新构建 GraphQL Client
yarn graphclient:build
```

## 调试技巧

### 查看 Graph Node 日志

```bash
# Graph Node 日志会在运行 yarn subgraph:run-node 的终端显示
# 查看错误信息：
INFO  Resolved block ...
DEBUG Handling event ...
ERROR Failed to process trigger ...
```

### 常见问题

1. **子图部署失败**
   - 检查 `subgraph.yaml` 配置是否正确
   - 确保合约地址正确
   - 检查事件签名是否匹配

2. **事件未被索引**
   - 确认合约确实发出了事件
   - 检查 `startBlock` 配置
   - 查看 Graph Node 日志

3. **查询返回空数据**
   - 确认子图已完成同步
   - 检查实体是否正确保存（查看日志）
   - 在 GraphQL Playground 测试查询

### 清理和重置

```bash
# 停止 Graph Node
yarn subgraph:stop-node

# 清理所有数据
yarn subgraph:clean-node

# 重新启动
yarn subgraph:run-node
yarn subgraph:create-local
yarn subgraph:local-ship
```

## 最佳实践

1. **实体设计**
   - 使用有意义的 ID（如 `txHash-logIndex`）
   - 合理使用 `immutable` 优化性能
   - 使用 `@derivedFrom` 建立关系

2. **映射函数**
   - 保持处理函数简单快速
   - 避免复杂的计算逻辑
   - 使用 `BigInt` 处理大数字

3. **测试**
   - 为每个事件处理器编写测试
   - 使用 Matchstick 框架
   - 测试边界情况

4. **部署**
   - 使用语义化版本号
   - 在测试网充分测试
   - 记录 `startBlock` 以提高同步速度

## 学习资源

- [The Graph 官方文档](https://thegraph.com/docs/)
- [AssemblyScript 文档](https://www.assemblyscript.org/)
- [Scaffold-ETH 2 文档](https://docs.scaffoldeth.io/)
- [GraphQL 查询语法](https://graphql.org/learn/)

## 总结

Subgraph 是将区块链数据转换为易于查询的 GraphQL API 的强大工具。通过理解其架构和工作流程，你可以：

- 高效索引智能合约事件
- 构建复杂的数据关系
- 为 dApp 提供快速的数据查询
- 实现链下数据聚合和分析

掌握 Subgraph 开发将大大提升你的 Web3 全栈开发能力！