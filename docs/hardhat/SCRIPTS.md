# 脚本命令说明文档

本文档详细说明了项目中所有可用的 npm/yarn 脚本命令。

## 目录

- [快速开始命令](#快速开始命令)
- [账户管理命令](#账户管理命令)
- [智能合约开发命令 (Hardhat)](#智能合约开发命令-hardhat)
- [前端开发命令 (Next.js)](#前端开发命令-nextjs)
- [事件索引命令 (Ponder)](#事件索引命令-ponder)
- [部署和发布命令](#部署和发布命令)
- [Git Hooks 命令](#git-hooks-命令)

---

## 快速开始命令

这些是最常用的快捷命令，适合日常开发。

### `yarn start`
**说明**：启动 Next.js 前端开发服务器
**端口**：http://localhost:3000
**等同于**：`yarn next:dev`
**使用场景**：前端开发、UI 调试、合约交互测试

```bash
yarn start
```

### `yarn chain`
**说明**：启动本地 Hardhat 区块链节点
**端口**：http://localhost:8545
**等同于**：`yarn hardhat:chain`
**使用场景**：本地开发、合约测试
**注意**：必须保持运行状态，部署合约前需要先启动

```bash
yarn chain
```

### `yarn deploy`
**说明**：部署智能合约到当前网络
**等同于**：`yarn hardhat:deploy`
**使用场景**：
- 本地部署：`yarn deploy`（需要先运行 `yarn chain`）
- 测试网部署：`yarn deploy --network sepolia`
- 主网部署：`yarn deploy --network mainnet`

```bash
# 部署到本地网络
yarn deploy

# 部署到 Sepolia 测试网
yarn deploy --network sepolia
```

### `yarn compile`
**说明**：编译所有 Solidity 智能合约
**等同于**：`yarn hardhat:compile`
**使用场景**：修改合约代码后需要重新编译
**输出**：生成 ABI、字节码到 `artifacts/` 目录

```bash
yarn compile
```

### `yarn test`
**说明**：运行所有智能合约测试用例
**等同于**：`yarn hardhat:test`
**使用场景**：验证合约逻辑、回归测试
**输出**：测试结果 + Gas 消耗报告

```bash
yarn test
```

---

## 账户管理命令

用于管理部署账户的私钥和查看账户信息。

### `yarn generate` / `yarn account:generate`
**说明**：生成一个新的随机部署账户
**功能**：
- 创建随机以太坊钱包
- 使用密码加密私钥
- 保存到 `packages/hardhat/.env` 文件

**使用流程**：
```bash
yarn generate
# 1. 输入密码
# 2. 确认密码
# 3. 生成地址并保存
```

**输出**：
```
👛 Generating new Wallet
📄 Encrypted Private Key saved to packages/hardhat/.env file
🪄 Generated wallet address: 0x...
⚠️ Make sure to remember your password!
```

### `yarn account:import`
**说明**：导入已有的私钥（例如从 MetaMask 导出的）
**功能**：
- 导入现有私钥
- 加密后保存到 `.env`

**使用流程**：
```bash
yarn account:import
# 1. 粘贴私钥
# 2. 输入加密密码
# 3. 确认密码
```

### `yarn account` / `yarn hardhat:account`
**说明**：查看部署账户信息
**功能**：
- 显示账户地址二维码
- 查询所有网络的余额
- 显示 nonce（交易计数）

**使用流程**：
```bash
yarn account
# 输入密码后显示：
# - 地址二维码
# - 各网络余额
# - 各网络 nonce
```

**输出示例**：
```
Public address: 0x...
-- sepolia -- 📡
   balance: 0.5
   nonce: 10
```

### `yarn account:reveal-pk`
**说明**：⚠️ 在终端显示明文私钥（危险操作）
**用途**：导出私钥到其他工具、备份
**安全警告**：
- 私钥一旦泄露，资产可能被盗
- 不要在公共场所使用
- 使用后应运行 `clear` 清空终端

```bash
yarn account:reveal-pk
# 输入密码后显示明文私钥
```

---

## 智能合约开发命令 (Hardhat)

所有以 `hardhat:` 开头的命令都在 `packages/hardhat/` 工作区执行。

### 核心开发命令

#### `yarn hardhat:chain`
**说明**：启动本地 Hardhat 网络
**等同于**：`yarn chain`
**配置**：生成 10 个测试账户，每个账户 10000 ETH
**端口**：RPC 在 8545，区块浏览器可能在其他端口

#### `yarn hardhat:compile`
**说明**：编译 Solidity 合约
**输出目录**：`packages/hardhat/artifacts/`
**生成内容**：ABI、字节码、元数据
**触发时机**：修改 `.sol` 文件后

#### `yarn hardhat:deploy`
**说明**：执行部署脚本
**脚本位置**：`packages/hardhat/deploy/`
**执行顺序**：按文件名数字前缀排序（如 `00_deploy_your_contract.ts`）
**自动操作**：
- 部署完成后自动生成 `deployedContracts.ts`
- 更新 Ponder 配置

**参数示例**：
```bash
# 重新运行所有部署脚本
yarn hardhat:deploy --reset

# 部署到指定网络
yarn hardhat:deploy --network sepolia

# 仅运行特定标签的部署脚本
yarn hardhat:deploy --tags YourContract
```

#### `yarn hardhat:test`
**说明**：运行测试套件
**测试目录**：`packages/hardhat/test/`
**框架**：Mocha + Chai + Hardhat
**输出**：测试结果 + Gas 报告

**参数示例**：
```bash
# 运行所有测试
yarn hardhat:test

# 运行特定测试文件
yarn hardhat:test test/YourContract.ts

# 查看详细日志
yarn hardhat:test --verbose
```

### 验证和安全命令

#### `yarn hardhat:verify` / `yarn verify`
**说明**：在区块链浏览器上验证合约源码
**支持平台**：Etherscan、Blockscout 等
**前置条件**：
- 需要在 `.env` 中配置 `ETHERSCAN_API_KEY`
- 合约已部署

**使用示例**：
```bash
# 自动验证所有已部署合约
yarn verify --network sepolia

# 手动验证指定合约
yarn hardhat:hardhat-verify --network sepolia
```

#### `yarn hardhat:flatten`
**说明**：将合约及其依赖合并为单个文件
**用途**：
- 手动提交到 Etherscan 验证
- 代码审计
- 分析依赖关系

```bash
yarn hardhat:flatten contracts/YourContract.sol > flattened.sol
```

### 代码质量命令

#### `yarn hardhat:lint`
**说明**：使用 ESLint 检查 TypeScript 代码 + Solhint 检查 Solidity 代码
**检查内容**：
- 代码风格
- 潜在的安全问题
- 最佳实践

```bash
yarn hardhat:lint

```

#### `yarn hardhat:format`
**说明**：使用 Prettier 格式化代码
**格式化范围**：
- Solidity 合约（`.sol`）
- TypeScript 脚本（`.ts`）
- 配置文件

```bash
yarn hardhat:format
```

#### `yarn hardhat:check-types`
**说明**：TypeScript 类型检查（不生成输出文件）
**用途**：CI/CD 流程、提交前检查

```bash
yarn hardhat:check-types
```

#### `yarn hardhat:lint-staged`
**说明**：仅检查 Git 暂存区的文件
**触发时机**：Git pre-commit hook
**用途**：提交前自动检查

### 其他 Hardhat 命令

#### `yarn hardhat:fork`
**说明**：Fork 主网或测试网到本地
**用途**：
- 在本地测试与主网合约的交互
- 调试复杂的 DeFi 协议集成

**配置**：需要在 `hardhat.config.ts` 中配置 fork URL

```bash
yarn hardhat:fork
```

#### `yarn hardhat:clean`
**说明**：清理编译产物
**删除目录**：
- `artifacts/`
- `cache/`
- `typechain-types/`

**使用场景**：解决编译缓存问题

```bash
yarn hardhat:clean
```

#### `yarn hardhat:generate`
**说明**：生成新的部署账户（工作区内部命令）
**等同于**：`yarn account:generate`

---

## 前端开发命令 (Next.js)

所有以 `next:` 开头的命令都在 `packages/nextjs/` 工作区执行。

### `yarn start` / `yarn next:dev`
**说明**：启动 Next.js 开发服务器
**端口**：http://localhost:3000
**特性**：
- 热重载（Hot Reload）
- 快速刷新（Fast Refresh）
- 开发环境错误提示

```bash
yarn start
```

### `yarn next:build`
**说明**：构建生产版本
**输出目录**：`.next/`
**优化内容**：
- 代码压缩
- Tree Shaking
- 图片优化
- 静态页面生成

```bash
yarn next:build
```

### `yarn next:serve`
**说明**：运行生产构建的预览服务器
**前置条件**：需要先运行 `yarn next:build`
**用途**：测试生产环境表现

```bash
yarn next:build
yarn next:serve
```

### `yarn next:lint`
**说明**：使用 ESLint 检查 Next.js 代码
**检查范围**：
- React 组件
- TypeScript 代码
- Next.js 特定规则

```bash
yarn next:lint
```

### `yarn next:format`
**说明**：格式化 Next.js 代码
**格式化范围**：
- `.ts` / `.tsx` 文件
- `.css` / `.scss` 文件
- `.json` 配置文件

```bash
yarn next:format
```

### `yarn next:check-types`
**说明**：TypeScript 类型检查
**用途**：CI/CD、提交前检查

```bash
yarn next:check-types
```

---

## 事件索引命令 (Ponder)

所有以 `ponder:` 开头的命令都在 `packages/ponder/` 工作区执行。

### `yarn ponder:dev`
**说明**：启动 Ponder 开发模式
**功能**：
- 索引区块链事件
- 启动 GraphQL API 服务器
- 热重载索引器代码

**端口**：http://localhost:42069
**GraphQL Playground**：http://localhost:42069/graphql

```bash
yarn ponder:dev
```

### `yarn ponder:codegen`
**说明**：从 `ponder.schema.ts` 生成 TypeScript 类型
**生成内容**：
- 数据库表类型
- GraphQL 查询类型
- 索引器上下文类型

**触发时机**：修改 `ponder.schema.ts` 后

```bash
yarn ponder:codegen
```

### `yarn ponder:start`
**说明**：生产模式下运行索引器
**用途**：在服务器上持续索引事件
**区别**：不启动 GraphQL API（需要单独运行 `ponder:serve`）

```bash
yarn ponder:start
```

### `yarn ponder:serve`
**说明**：生产模式下运行 GraphQL API 服务器
**前置条件**：需要先运行 `ponder:start` 索引数据
**用途**：为前端提供查询接口

```bash
yarn ponder:serve
```

### `yarn ponder:lint`
**说明**：检查 Ponder 代码质量

```bash
yarn ponder:lint
```

### `yarn ponder:typecheck`
**说明**：TypeScript 类型检查

```bash
yarn ponder:typecheck
```

---

## 部署和发布命令

### Vercel 部署命令

#### `yarn vercel`
**说明**：部署前端到 Vercel 平台
**前置条件**：
- 需要先运行 `yarn vercel:login`
- 需要配置 Vercel 项目

```bash
yarn vercel
```

#### `yarn vercel:login`
**说明**：登录 Vercel 账户

```bash
yarn vercel:login
```

#### `yarn vercel:yolo`
**说明**：快速部署到 Vercel（跳过确认）
**用途**：CI/CD 自动部署

```bash
yarn vercel:yolo
```

### IPFS 部署命令

#### `yarn ipfs`
**说明**：将前端构建产物部署到 IPFS
**用途**：去中心化托管前端

```bash
yarn ipfs
```

---

## Git Hooks 命令

### `yarn postinstall`
**说明**：安装依赖后自动执行
**功能**：初始化 Husky Git Hooks
**触发时机**：`yarn install` 完成后

### `yarn precommit`
**说明**：Git pre-commit hook 执行的命令
**功能**：运行 `lint-staged` 检查暂存文件
**触发时机**：`git commit` 之前

---

## 组合命令

### `yarn format`
**说明**：格式化所有代码
**等同于**：`yarn next:format && yarn hardhat:format`
**格式化范围**：前端 + 合约

```bash
yarn format
```

### `yarn lint`
**说明**：检查所有代码质量
**等同于**：`yarn next:lint && yarn hardhat:lint`
**检查范围**：前端 + 合约

```bash
yarn lint
```

---

## 常见开发工作流

### 1. 首次启动项目

```bash
# 安装依赖
yarn install

# 生成部署账户
yarn generate

# 启动本地区块链
yarn chain

# 新开终端：部署合约
yarn deploy

# 新开终端：启动前端
yarn start

# （可选）新开终端：启动 Ponder
yarn ponder:dev
```

### 2. 修改智能合约

```bash
# 1. 修改合约代码
# 2. 重新编译
yarn compile

# 3. 运行测试
yarn test

# 4. 重新部署
yarn deploy --reset

# 5. 前端会自动读取新的 ABI
```

### 3. 部署到测试网

```bash
# 1. 确保有部署账户
yarn account

# 2. 确保账户有测试币（从水龙头获取）

# 3. 部署到 Sepolia
yarn deploy --network sepolia

# 4. 验证合约
yarn verify --network sepolia

# 5. 更新前端配置（scaffold.config.ts）
# 6. 重新部署前端
yarn vercel
```

### 4. 提交代码前

```bash
# 格式化代码
yarn format

# 检查代码质量
yarn lint

# 类型检查
yarn hardhat:check-types
yarn next:check-types

# 运行测试
yarn test

# Git 提交（会自动运行 lint-staged）
git add .
git commit -m "Your message"
```

---

## 故障排查

### 合约部署失败

```bash
# 1. 清理缓存
yarn hardhat:clean

# 2. 重新编译
yarn compile

# 3. 检查账户余额
yarn account

# 4. 重新部署
yarn deploy --reset
```

### 前端类型错误

```bash
# 1. 重新生成 ABI 类型
yarn deploy

# 2. 类型检查
yarn next:check-types

# 3. 重启开发服务器
# Ctrl+C 然后 yarn start
```

### Ponder 索引问题

```bash
# 1. 重新生成类型
yarn ponder:codegen

# 2. 清理数据库（删除 packages/ponder/.ponder 目录）
rm -rf packages/ponder/.ponder

# 3. 重新启动
yarn ponder:dev
```

---

## 环境变量配置

相关环境变量应配置在对应的 `.env` 文件中：

### Hardhat (packages/hardhat/.env)
```env
DEPLOYER_PRIVATE_KEY_ENCRYPTED={"crypto":...}  # 加密的私钥
ETHERSCAN_API_KEY=your_api_key                 # Etherscan 验证用
ALCHEMY_API_KEY=your_api_key                   # RPC 提供商
```

### Next.js (packages/nextjs/.env)
```env
NEXT_PUBLIC_ALCHEMY_API_KEY=your_api_key              # 前端 RPC
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id # WalletConnect
NEXT_PUBLIC_PONDER_URL=https://your-ponder-api.com    # Ponder API (生产)
```

### Ponder (packages/ponder/.env)
```env
PONDER_RPC_URL_1=https://mainnet.infura.io/v3/...     # 主网 RPC
PONDER_RPC_URL_11155111=https://sepolia.infura.io/... # Sepolia RPC
```

---

## 相关文档

- [Scaffold-ETH 2 官方文档](https://docs.scaffoldeth.io)
- [Hardhat 文档](https://hardhat.org/docs)
- [Next.js 文档](https://nextjs.org/docs)
- [Ponder 文档](https://ponder.sh)
- [项目 CLAUDE.md 说明](../CLAUDE.md)

---

**最后更新**：2025-10-29
