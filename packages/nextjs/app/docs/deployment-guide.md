# 测试网部署指南 (Sepolia)

本文档详细介绍如何将项目部署到 Sepolia 测试网。

## 环境准备

### 1. 安装 Node.js 和 pnpm

```bash
# 推荐使用 nvm 安装 Node.js 20+
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install 20
nvm use 20

# 安装 pnpm
npm install -g pnpm
```

### 2. 克隆项目

```bash
git clone <your-repo-url>
cd nft-stake-ponder
pnpm install
```

### 3. 获取测试网 ETH

你需要 Sepolia 测试 ETH：
- **Alchemy Sepolia Faucet**: https://sepoliafaucet.com/
- **Chainlink Sepolia Faucet**: https://faucets.chain.link/sepolia
- 或者在 MetaMask 中切换到 Sepolia 网络，去 https://sepoliafaucet.com/ 水龙头领取

## 第一部分：部署合约

### 1. 配置环境变量

```bash
# 复制环境变量文件
cp packages/hardhat/.env.example packages/hardhat/.env
```

编辑 `packages/hardhat/.env`：

```env
# Sepolia RPC URL (从 Alchemy 或 Infura 获取)
DEPLOYER_PRIVATE_KEY=你的部署账户私钥 (不要用有真实资产的账户!)
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# Etherscan 验证 (可选)
ETHERSCAN_API_KEY=你的 Etherscan API Key
```

### 2. 部署合约到 Sepolia

```bash
# 编译合约
yarn hardhat:compile

# 部署到 Sepolia
yarn deploy --network sepolia
```

部署成功后会看到类似输出：
```
deploying "NFTStakingPool" (tx: 0x...)...: 0x1234...5678
deploying "RewardToken" (tx: 0x...)...: 0xabcd...efgh
```

**重要：记录这些合约地址，后续配置需要用到。**

### 3. 验证合约 (可选)

```bash
yarn hardhat:verify --network sepolia
```

## 第二部分：配置 Ponder 索引器

### 1. 配置 Ponder 环境变量

编辑 `packages/ponder/.env`：

```env
# Sepolia RPC URL
PONDER_RPC_URL_11155111=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
```

### 2. 启动 Ponder

```bash
yarn ponder:dev
```

Ponder 会在 http://localhost:42069 运行，并自动同步合约事件。

## 第三部分：部署前端

### 1. 配置前端环境变量

创建/编辑 `packages/nextjs/.env.production`：

```env
# Sepolia RPC
NEXT_PUBLIC_ALCHEMY_API_KEY=你的 Alchemy API Key

# WalletConnect (如果使用 WalletConnect)
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=你的 WalletConnect Project ID

# Ponder API (部署后)
NEXT_PUBLIC_PONDER_URL=https://your-ponder-app.railway.app (后续填写)
```

### 2. 更新 Scaffold 配置

编辑 `packages/nextjs/scaffold.config.ts`：

```typescript
const config: ScaffoldConfig = {
  targetNetworks: [sepolia],  // 确保是 sepolia 而不是 localhost
  // ...
};
```

### 3. 构建前端

```bash
yarn next:build
```

### 4. 部署到 Vercel (推荐)

```bash
# 全局安装 Vercel CLI
npm i -g vercel

# 登录 Vercel
vercel login

# 进入前端目录
cd packages/nextjs

# 部署到测试网预览
vercel --env-file .env.production

# 部署到生产 (测试网)
vercel --prod --env-file .env.production
```

或者通过 Vercel Dashboard：
1. 访问 https://vercel.com/dashboard
2. Import Project
3. 选择 `packages/nextjs` 目录
4. 配置环境变量
5. Deploy

### 5. 手动部署到 Railway (推荐用于 Ponder)

1. 注册 Railway: https://railway.app
2. New Project → Deploy from GitHub
3. 选择仓库
4. 配置：
   - **Build Command**: `yarn ponder:start`
   - **Start Command**: `yarn ponder:start`
   - **Environment Variables**:
     - `PONDER_RPC_URL_11155111` = 你的 Sepolia RPC URL

部署成功后，获得 Ponder 的 URL，填入前端的 `NEXT_PUBLIC_PONDER_URL`。

## 第四部分：更新合约配置

### 1. 更新前端合约地址

合约部署后，编辑 `packages/nextjs/contracts/deployedContracts.ts`（如果不存在，创建）：

```typescript
export const deployedContracts = {
  11155111: { // Sepolia Chain ID
    RewardToken: {
      address: "0x...",
      abi: [...],
    },
    NFTStakingPool: {
      address: "0x...",
      abi: [...],
    },
    MyGovernor: {
      address: "0x...",
      abi: [...],
    },
  },
};
```

### 2. 更新外部合约配置

编辑 `packages/nextjs/contracts/externalContracts.ts`：

```typescript
export const externalContracts = {
  sepolia: [
    {
      chainId: 11155111,
      name: "RewardToken",
      address: "0x...",
      abi: [...],
    },
    // 其他外部合约
  ],
};
```

## 第五部分：验证部署

### 1. 检查前端

访问你部署的 Vercel URL，确认：
- ✅ 页面正常加载
- ✅ 钱包连接正常
- ✅ 显示正确的网络 (Sepolia)
- ✅ 合约数据正常读取

### 2. 检查 Ponder

访问 Ponder GraphQL Playground (通常在 `/graphql`)：
- 确认提案数据已同步
- 尝试查询提案列表

### 3. 测试完整流程

1. 连接钱包 (确保在 Sepolia 网络)
2. 铸造 NFT
3. 质押 NFT
4. 创建治理提案
5. 投票
6. 执行提案

## 常见问题

### Q: 部署失败 "insufficient funds"
A: 确保钱包有足够的 Sepolia ETH，去水龙头领取。

### Q: 合约验证失败
A: 确保 Etherscan API Key 正确，且在 24 小时后可验证。

### Q: 前端无法读取合约数据
A: 检查：
1. `deployedContracts.ts` 地址是否正确
2. Ponder 是否正常运行
3. `NEXT_PUBLIC_PONDER_URL` 是否正确配置

### Q: 交易失败
A: 检查：
1. 是否在正确的网络 (Sepolia)
2. 合约方法是否有权限限制
3. 参数是否正确

## 快速检查清单

- [ ] Sepolia ETH (水龙头领取)
- [ ] Alchemy API Key (Sepolia RPC)
- [ ] WalletConnect Project ID (如果需要)
- [ ] Etherscan API Key (可选，用于验证)
- [ ] 合约部署成功，记录地址
- [ ] Ponder 索引正常
- [ ] 前端环境变量配置
- [ ] Vercel 部署成功
- [ ] 全流程测试通过

## 生产环境部署

如果需要部署到主网 (Mainnet)：

1. 将所有 `sepolia` 配置改为 `mainnet` (chainId: 1)
2. 使用真实的 RPC URL 和 API Key
3. 确保合约已经过完整审计
4. 准备足够的 ETH 用于 Gas

---

**注意**: 永远不要将包含私钥的 `.env` 文件提交到版本控制！
