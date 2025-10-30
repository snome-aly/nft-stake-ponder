# 🏗 Scaffold-ETH 2

<h4 align="center">
  <a href="https://docs.scaffoldeth.io">文档</a> |
  <a href="https://scaffoldeth.io">官网</a>
</h4>

🧪 一个开源、紧跟前沿的工具集，用于在以太坊区块链上构建去中心化应用（dapp）。它旨在让开发者更轻松地创建和部署智能合约，并构建与这些合约交互的用户界面。

⚙️ 基于 NextJS、RainbowKit、Hardhat、Wagmi、Viem 和 TypeScript 构建。

- ✅ **合约热重载**：在你编辑智能合约时，前端会自动适配最新的合约。
- 🪝 **[自定义 hooks](https://docs.scaffoldeth.io/hooks/)**：一组基于 [wagmi](https://wagmi.sh/) 的 React hooks 封装，简化与智能合约的交互，并支持 TypeScript 自动补全。
- 🧱 [**组件库**](https://docs.scaffoldeth.io/components/): 提供常用 web3 组件，帮助你快速搭建前端。
- 🔥 **Burner 钱包 & 本地水龙头**：可通过临时钱包和本地水龙头快速测试你的应用。
- 🔐 **钱包服务商集成**：支持连接不同的钱包服务商，与以太坊网络交互。

![Debug Contracts tab](https://github.com/scaffold-eth/scaffold-eth-2/assets/55535804/b237af0c-5027-4849-a5c1-2e31495cccb1)

## 环境要求

在开始之前，你需要安装以下工具：

- [Node (>= v20.18.3)](https://nodejs.org/en/download/)
- Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) 或 [v2+](https://yarnpkg.com/getting-started/install))
- [Git](https://git-scm.com/downloads)

## 快速开始

要快速体验 Scaffold-ETH 2，请按照以下步骤操作：

1. 如果在 CLI 中跳过了依赖安装，请先安装依赖：

```
cd my-dapp-example
yarn install
```

2. 在第一个终端窗口运行本地区块链网络：

```
yarn chain
```

此命令会使用 Hardhat 启动一个本地以太坊网络。该网络在你的本地机器上运行，可用于测试和开发。你可以在 `packages/hardhat/hardhat.config.ts` 中自定义网络配置。

3. 在第二个终端窗口部署测试合约：

```
yarn deploy
```

此命令会将测试智能合约部署到本地网络。合约位于 `packages/hardhat/contracts`，你可以根据需要进行修改。`yarn deploy` 命令会使用 `packages/hardhat/deploy` 下的部署脚本。你也可以自定义该脚本。

4. 在第三个终端窗口启动 NextJS 应用：

```
yarn start
```

访问你的应用：`http://localhost:3000`。你可以在 `Debug Contracts` 页面与智能合约交互。应用配置可在 `packages/nextjs/scaffold.config.ts` 中调整。

运行智能合约测试：`yarn hardhat:test`

- 在 `packages/hardhat/contracts` 编辑你的智能合约
- 在 `packages/nextjs/app/page.tsx` 编辑前端首页。有关 [路由](https://nextjs.org/docs/app/building-your-application/routing/defining-routes) 和 [页面/布局](https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts) 的更多指导，请查阅 Next.js 官方文档。
- 在 `packages/hardhat/deploy` 编辑你的部署脚本

## 🚀 配置 Ponder 扩展

该扩展允许你在 SE-2 dapp 中使用 Ponder (https://ponder.sh/) 进行事件索引。

Ponder 是一个开源的区块链应用后端框架。通过 Ponder，你可以快速构建和部署 API，从任意 EVM 区块链的智能合约中获取并服务自定义数据。

### 配置

Ponder 的配置文件（```packages/ponder/ponder.config.ts```）会根据已部署的合约和在 ```packages/nextjs/scaffold.config.ts``` 中设置的第一个区块链网络自动生成。

### 设计数据 schema

你可以在 ```packages/ponder/ponder.schema.ts``` 文件中定义你的 Ponder 数据 schema，具体格式请参考 Ponder 官方文档（https://ponder.sh/docs/schema）。

### 数据索引

你可以通过在 ```packages/ponder/src/``` 目录下添加文件来索引事件（https://ponder.sh/docs/indexing/write-to-the-database）。

### 启动开发服务器

运行 ```yarn ponder:dev``` 启动 Ponder 开发服务器，用于事件索引并在 http://localhost:42069 提供 GraphQL API 接口。

### 查询 GraphQL API

开发服务器启动后，打开 http://localhost:42069 可使用 GraphiQL 界面。GraphiQL 是一个非常实用的工具，可以在开发期间探索 schema 并测试查询。（https://ponder.sh/docs/query/graphql）

你可以在页面中通过 ```@tanstack/react-query``` 查询数据。具体示例可参考 ```packages/nextjs/app/greetings/page.ts```，用于获取并展示 greetings 的更新数据。

### 部署

如需部署 Ponder indexer，请参考官方部署文档：https://ponder.sh/docs/production/deploy

在 **Settings** -> **Deploy** 中，需设置 **Custom Start Command** 为 ```yarn ponder:start```。

随后，你需要在 SE-2 dapp 中配置环境变量 ```NEXT_PUBLIC_PONDER_URL```，以使用已部署的 ponder indexer。


## 文档

访问我们的[文档](https://docs.scaffoldeth.io)来了解如何使用 Scaffold-ETH 2 开发。

想了解更多功能，请访问我们的[官网](https://scaffoldeth.io)。

## 参与贡献 Scaffold-ETH 2

我们欢迎你为 Scaffold-ETH 2 做出贡献！

请参阅 [CONTRIBUTING.MD](https://github.com/scaffold-eth/scaffold-eth-2/blob/main/CONTRIBUTING.md) 获取更多关于贡献流程和规范的信息。