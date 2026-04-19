# 技术栈详解 | Tech Stack

## 项目概览

这是一个基于 **Scaffold-ETH 2** 构建的全栈 Web3 dApp 项目，采用 Monorepo 架构。

---

## 技术架构 | Architecture

```
nft-stake-ponder/
├── packages/
│   ├── hardhat/          # 智能合约开发、测试、部署
│   ├── nextjs/           # React 前端 (Next.js App Router)
│   └── ponder/            # 区块链事件索引 & GraphQL API
├── docs/                  # 文档
└── package.json          # Workspace 根配置
```

---

## 智能合约层 | Smart Contracts (`packages/hardhat`)

### 核心框架

| 技术 | 版本 | 用途 |
|------|------|------|
| **Hardhat** | ^2.22.10 | 本地开发网络、编译、部署、任务运行 |
| **Ethers.js** | ^6.13.2 | 合约交互、ABI 编解码 |
| **TypeScript** | ^5.8.2 | 类型安全的合约调用 |

### 合约库

| 库 | 用途 |
|-----|------|
| **OpenZeppelin Contracts** | ERC20、ERC721、Governor、Timelock 等标准实现 |
| **hardhat-deploy** | 声明式部署脚本管理 |
| **hardhat-verify** | Etherscan 自动化验证 |
| **TypeChain** | 自动生成合约类型定义 |

### 开发工具

| 工具 | 用途 |
|------|------|
| **solidity-coverage** | 合约测试覆盖率 |
| **hardhat-gas-reporter** | Gas 消耗报告 |
| **Prettier + solhint** | Solidity 代码格式化与规范检查 |

---

## 前端层 | Frontend (`packages/nextjs`)

### 核心框架

| 技术 | 版本 | 用途 |
|------|------|------|
| **Next.js** | ^15.2.3 | React 全栈框架 (App Router) |
| **React** | ^19.0.0 | UI 组件库 |
| **TypeScript** | ^5.8.2 | 类型安全 |

### Web3 交互

| 技术 | 版本 | 用途 |
|------|------|------|
| **Wagmi** | ^2.16.4 | React Hooks for Ethereum |
| **Viem** | ^2.34.0 | 低层级的以太坊交互库 |
| **RainbowKit** | ^2.2.8 | Web3 钱包连接 UI |
| **@tanstack/react-query** | ^5.59.15 | 数据获取、缓存、状态管理 |

### UI 样式

| 技术 | 版本 | 用途 |
|------|------|------|
| **Tailwind CSS** | ^4.1.3 | 原子化 CSS 框架 |
| **DaisyUI** | ^5.0.9 | Tailwind 组件库 |
| **Framer Motion** | ^12.38.0 | 页面过渡动画 |
| **next-themes** | ^0.3.0 | 主题切换 |

### 图表与可视化

| 技术 | 用途 |
|------|------|
| **Recharts** | 质押统计图表 |
| **@uniswap/sdk-core** | 流动性相关计算 |

### 其他工具

| 技术 | 版本 | 用途 |
|------|------|------|
| **graphql-request** | ^7.1.0 | Ponder GraphQL 查询 |
| **react-hot-toast** | ^2.4.0 | 全局通知提示 |
| **Zustand** | ^5.0.0 | 轻量状态管理 |
| **usehooks-ts** | ^3.1.0 | React Hooks 工具库 |
| **Heroicons** | ^2.1.5 | 图标库 |

### 字体

| 字体 | 用途 |
|------|------|
| **Syne** | Display/标题字体 |
| **DM Sans** | 正文字体 |
| **JetBrains Mono** | 代码/地址显示 |

---

## 索引层 | Indexer (`packages/ponder`)

### 核心框架

| 技术 | 版本 | 用途 |
|------|------|------|
| **Ponder** | ^0.8.15 | 区块链事件索引服务 |
| **Hono** | ^4.5.0 | 轻量级 Web 框架 (GraphQL API) |
| **Viem** | ^2.21.3 | 事件解码 |

### 数据库

| 技术 | 用途 |
|------|------|
| **SQLite (内置)** | Ponder 默认使用 SQLite 存储索引数据 |
| **Drizzle ORM** | 数据库 ORM (可选) |

---

## 基础设施 | Infrastructure

### 部署平台

| 平台 | 用途 |
|------|------|
| **Vercel** | Next.js 前端部署 |
| **Railway / Fly.io** | Ponder 索引器部署 |
| **Alchemy / Infura** | Sepolia RPC 节点 |

### 开发工具

| 工具 | 用途 |
|------|------|
| **Yarn Workspaces** | Monorepo 依赖管理 |
| **Husky + lint-staged** | Git Hooks 自动化 |
| **ESLint + Prettier** | 代码规范 |

---

## 核心功能模块

### NFT 质押系统

```
StakableNFT (ERC721)
    │
    ├── mint() - 铸造 NFT
    ├── stake() - 质押 NFT
    ├── unstake() - 解除质押
    └── getRewards() - 领取奖励

RewardToken (ERC20)
    │
    ├── mint() - 铸造奖励代币
    ├── delegate() - 投票委托
    └── getVotes() - 查询投票权重

NFTStakingPool
    │
    ├── stake() - 质押NFT记录
    ├── claimRewards() - 领取奖励
    └── setBaseReward() - 设置基础奖励率
```

### DAO 治理系统

```
MyGovernor (OpenZeppelin Governor)
    │
    ├── propose() - 创建提案
    ├── castVote() - 投票
    ├── queue() - 进入时间锁
    └── execute() - 执行提案

Timelock
    │
    └── 提案时间锁延迟执行

RewardToken
    │
    ├── delegate() - 委托投票权
    └── getVotes() - 查询投票权重
```

### 数据流

```
用户操作 (前端)
    │
    ├─→ 合约写入 (Wagmi/Viem) ─→ 交易签名 (钱包)
    │
    └─→ Ponder 索引 (事件监听)
           │
           └─→ GraphQL API
                    │
                    └─→ 前端展示 (React Query)
```

---

## 项目命令

```bash
# 安装依赖
yarn install

# 合约
yarn hardhat:compile    # 编译合约
yarn hardhat:deploy     # 部署到本地网络
yarn deploy --network sepolia  # 部署到 Sepolia

# 前端
yarn start             # 启动开发服务器 (http://localhost:3000)
yarn next:build        # 构建生产版本

# 索引器
yarn ponder:dev        # 启动 Ponder 开发模式
yarn ponder:start       # 生产模式启动

# 全流程
yarn chain             # 启动本地 Hardhat 节点
yarn deploy            # 部署合约
yarn start             # 启动前端
yarn ponder:dev        # 启动索引器
```

---

## 面试亮点

### 1. 架构设计
- **Monorepo**: Yarn Workspaces 管理三个独立 package
- **Scaffold-ETH 2**: 标准的 Web3 开发脚手架，减少样板代码
- **职责分离**: 合约/前端/索引器独立开发部署

### 2. 前端工程化
- **Next.js 15 App Router**: 服务端组件、流式渲染
- **TanStack Query**: 缓存、乐观更新、后台刷新
- **状态管理**: Zustand 轻量级状态
- **主题系统**: CSS Variables + next-themes

### 3. Web3 最佳实践
- **Hook 封装**: useScaffoldReadContract / useScaffoldWriteContract
- **错误处理**: 交易失败 toast 通知
- **事件索引**: Ponder 实现链上数据持久化

### 4. 安全考量
- **OpenZeppelin**: 经验证的标准合约库
- **TimeLock**: 治理提案延迟执行
- **权限控制**: 角色-based AccessControl

### 5. 开发者体验
- **TypeScript**: 端到端类型安全
- **Prettier + ESLint**: 统一代码风格
- **Husky**: 提交前自动检查
