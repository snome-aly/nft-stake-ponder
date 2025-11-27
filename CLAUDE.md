# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在处理本仓库代码时提供指导。

## 项目概述

这是一个 **Scaffold-ETH 2** (SE-2) 项目——一个用于以太坊的全栈 dApp 开发工具包。它是一个包含三个主包的 Yarn workspaces 单体仓库：

1. **hardhat** (`packages/hardhat/`) - Solidity 智能合约开发、测试与部署
2. **nextjs** (`packages/nextjs/`) - 使用 Next.js App Router（非 Pages Router）的 React 前端
3. **ponder** (`packages/ponder/`) - 区块链数据的事件索引与 GraphQL API

**技术栈：** Next.js、RainbowKit、Wagmi、Viem、Hardhat、Ponder、TypeScript

## 常用命令

### 开发流程
```bash
# 启动本地区块链
yarn chain

# 部署合约（需先启动链）
yarn deploy

# 启动前端 (http://localhost:3000)
yarn start

# 启动 Ponder 索引器 (http://localhost:42069)
yarn ponder:dev
```

### Hardhat 命令
```bash
# 编译合约
yarn hardhat:compile

# 运行带气体报告的测试
yarn hardhat:test

# 类型检查
yarn hardhat:check-types

# 格式化 Solidity 和 TypeScript 代码
yarn hardhat:format

# 代码规范检查（Lint）
yarn hardhat:lint

# 清理构建产物
yarn hardhat:clean

# 在 Etherscan 上验证合约
yarn hardhat:verify
```

### Next.js 命令
```bash
# 开发服务器
yarn next:dev  # 或 yarn start

# 生产构建
yarn next:build

# 类型检查
yarn next:check-types

# 格式化
yarn next:format

# 代码规范检查（Lint）
yarn next:lint
```

### Ponder 命令
```bash
# 开发模式（索引 + GraphQL 服务器）
yarn ponder:dev

# 从 schema 生成 TypeScript 类型
yarn ponder:codegen

# 生产索引
yarn ponder:start

# 仅生产 API 服务器
yarn ponder:serve

# 类型检查
yarn ponder:typecheck
```

### 账户管理
```bash
# 生成新的部署账户
yarn account:generate

# 导入已有账户
yarn account:import

# 查看账户详情
yarn account
```

## 架构

### 智能合约开发 (Hardhat)

- **合约代码：** `packages/hardhat/contracts/`
- **部署脚本：** `packages/hardhat/deploy/` - 使用 hardhat-deploy 插件，文件按编号排序（例如 `00_deploy_your_contract.ts`）
- **测试代码：** `packages/hardhat/test/`
- **配置文件：** `packages/hardhat/hardhat.config.ts`

修改部署脚本时，确保导出的 deploy 函数包含标签以保证正确的部署顺序。

### 前端 (Next.js)

- **App Router：** `packages/nextjs/app/` - 使用 Next.js 15 App Router 架构
- **脚手架配置：** `packages/nextjs/scaffold.config.ts` - 配置目标网络、RPC 端点和钱包设置
- **合约定义：**
  - `packages/nextjs/contracts/deployedContracts.ts` - 从部署自动生成
  - `packages/nextjs/contracts/externalContracts.ts` - 手动定义外部合约
- **Hooks：** `packages/nextjs/hooks/scaffold-eth/` - 用于合约交互的自定义 React hooks
- **组件：** `packages/nextjs/components/scaffold-eth/` - 可复用的 Web3 组件

**重要提示：** 前端使用 **App Router**，非 Pages Router。所有路由和页面组件应遵循 App Router 规范。

### Ponder 事件索引

- **配置文件：** `packages/ponder/ponder.config.ts` - 自动与 `scaffold.config.ts` 中的已部署合约和目标网络同步
- **Schema 定义：** `packages/ponder/ponder.schema.ts` - 使用 Ponder 的 onchainTable API 定义数据库 schema
- **索引器代码：** `packages/ponder/src/` - 事件处理程序，文件名对应合约名（例如 `YourContract.ts`）
- **GraphQL API：** 开发模式下运行于 http://localhost:42069

Ponder 会自动读取 `deployedContracts.ts` 和 `scaffoldConfig.targetNetworks` 中的第一个网络。当合约部署后，Ponder 配置会自动更新。

### 合约交互模式

**关键：始终使用 Scaffold-ETH hooks 进行合约交互。切勿直接使用 wagmi/viem 调用。**

#### 读取合约数据
```typescript
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

const { data } = useScaffoldReadContract({
  contractName: "YourContract",
  functionName: "greeting",
  args: [], // 可选
});
```

#### 写入合约
```typescript
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const { writeContractAsync } = useScaffoldWriteContract("YourContract");

// 稍后调用
await writeContractAsync({
  functionName: "setGreeting",
  args: ["Hello World"],
  value: parseEther("0.1"), // 可选，针对支付函数
});
```

#### 读取事件
```typescript
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth";

const { data: events } = useScaffoldEventHistory({
  contractName: "YourContract",
  eventName: "GreetingChange",
  watch: true, // 可选 - 实时更新
});
```

### 显示组件

务必使用 Scaffold-ETH 组件展示区块链数据：
- `Address` - 显示以太坊地址
- `AddressInput` - 支持 ENS 的地址输入框
- `Balance` - 显示 ETH/USDC 余额
- `EtherInput` - 带 ETH/USD 转换的数字输入框

组件位于 `packages/nextjs/components/scaffold-eth/`

## 开发流程

1. 在 `packages/hardhat/contracts/` 编写智能合约
2. 如有需要，更新 `packages/hardhat/deploy/` 中的部署脚本
3. 执行部署：`yarn deploy`
4. 访问 `http://localhost:3000/debug` 通过自动生成的 UI 交互合约
5. 在 `packages/hardhat/test/` 编写测试
6. 在 `packages/ponder/ponder.schema.ts` 定义 Ponder schema
7. 在 `packages/ponder/src/` 创建事件索引器
8. 使用 SE-2 hooks 和组件构建自定义 UI
9. 通过 GraphQL (`@tanstack/react-query` + `graphql-request`) 查询索引数据

## 环境变量

- `NEXT_PUBLIC_ALCHEMY_API_KEY` - Alchemy API 密钥，用于 RPC
- `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` - WalletConnect 项目 ID
- `NEXT_PUBLIC_PONDER_URL` - 生产环境 Ponder API 端点
- `PONDER_RPC_URL_{CHAIN_ID}` - Ponder 索引用 RPC URL

## 测试

- **Hardhat 测试：** `yarn hardhat:test` - 使用带气体报告的 Chai 匹配器
- 测试文件必须位于 `packages/hardhat/test/` 并以 `.ts` 结尾
- 使用 `@nomicfoundation/hardhat-chai-matchers` 进行合约断言

## 部署

### 智能合约
```bash
# 部署到线上网络（配置于 hardhat.config.ts）
yarn deploy --network sepolia

# 在 Etherscan 上验证合约
yarn verify --network sepolia
```

### 前端
```bash
# 部署到 Vercel
yarn vercel

# 部署到 IPFS
yarn ipfs
```

### Ponder
在托管平台设置自定义启动命令为 `yarn ponder:start`，然后配置前端的 `NEXT_PUBLIC_PONDER_URL`。

## 关键约束

- Node 版本：>= 20.18.3
- 包管理器：Yarn (v3.2.3)
- 前端路由：仅使用 Next.js App Router（不使用 Pages Router）
- 合约交互：必须使用 Scaffold-ETH hooks (`useScaffoldReadContract`, `useScaffoldWriteContract`, `useScaffoldEventHistory`)
- 有 SE-2 hooks 时，切勿直接使用原生 `wagmi`/`viem` 调用
