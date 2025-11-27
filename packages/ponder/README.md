# SE-2 Ponder 扩展

此扩展允许在 SE-2 dApp 中使用 Ponder (https://ponder.sh/) 进行事件索引。

Ponder 是一个用于区块链应用后端的开源框架。使用 Ponder，您可以快速构建和部署 API，从任何 EVM 区块链上的智能合约中提供自定义数据。

## 配置

Ponder 配置文件 (`packages/ponder/ponder.config.ts`) 会自动从已部署的合约中设置，并使用 `packages/nextjs/scaffold.config.ts` 中配置的第一个区块链网络。

## 设计您的数据模型（Schema）

您可以在 `packages/ponder/ponder.schema.ts` 文件中定义 Ponder 数据模型，请参考 Ponder 官方文档 (https://ponder.sh/docs/schema)。

## 索引数据

您可以通过在 `packages/ponder/src/` 目录中添加文件来索引事件 (https://ponder.sh/docs/indexing/write-to-the-database)。

## 启动开发服务器

运行 `yarn ponder:dev` 来启动 Ponder 开发服务器，用于索引数据并在 http://localhost:42069 提供 GraphQL API 端点服务。

## 查询 GraphQL API

在开发服务器运行时，在浏览器中打开 http://localhost:42069 以使用 GraphiQL 界面。GraphiQL 是一个有用的工具，可以在开发过程中探索您的数据模型和测试查询 (https://ponder.sh/docs/query/graphql)。

您可以使用 `@tanstack/react-query` 在页面中查询数据。请查看 `packages/nextjs/app/greetings/page.ts` 中的代码示例，了解如何获取和显示问候语更新数据。

## 部署

要部署 Ponder 索引器，请参考 Ponder 部署文档 https://ponder.sh/docs/production/deploy

在 **Settings（设置）** -> **Deploy（部署）** -> 您必须将 **Custom Start Command（自定义启动命令）** 设置为 `yarn ponder:start`。

然后，您需要在 SE-2 dApp 中设置 `NEXT_PUBLIC_PONDER_URL` 环境变量，以使用已部署的 Ponder 索引器。
