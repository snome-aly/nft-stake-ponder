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

---

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
deploying "MyGovernor" (tx: 0x...)...: 0x9999...0000
```

**重要：记录这些合约地址，后续配置需要用到。**

### 3. 验证合约 (可选)

```bash
yarn hardhat:verify --network sepolia
```

---

## 第二部分：配置 Ponder 索引器

### 1. 本地测试 Ponder

先在本地确认 Ponder 配置正确：

```bash
# 配置环境变量
cp packages/ponder/.env.example packages/ponder/.env
```

编辑 `packages/ponder/.env`：

```env
# Sepolia RPC URL
PONDER_RPC_URL_11155111=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
```

启动 Ponder 开发模式：

```bash
yarn ponder:dev
```

访问 http://localhost:42069/graphql 测试查询。

### 2. 生产环境部署 Ponder

Ponder 需要持久运行，建议部署到 Railway 或 Fly.io。

#### 方式一：Railway 部署 (推荐)

1. **注册 Railway**: https://railway.app
2. **创建新项目**: New Project → Empty Project

3. **配置变量** (Project → Variables):
   ```
   PONDER_RPC_URL_11155111=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
   ```

4. **设置构建命令** (Project → Settings → Start Command):
   ```
   yarn ponder:start
   ```

5. **部署**:
   - 连接 GitHub 仓库
   - 选择分支
   - Railway 会自动 `yarn install` → `yarn ponder:build` → `yarn ponder:start`

6. **等待部署完成**，访问 Railway 分配的域名 (如 `xxx.railway.app`)

#### 方式二：Fly.io 部署 (免费)

1. **安装 Fly CLI**:
   ```bash
   curl -L https://fly.io/install.sh | sh
   fly auth login
   ```

2. **创建 Fly 应用**:
   ```bash
   cd packages/ponder
   fly launch
   ```

3. **配置 secrets**:
   ```bash
   fly secrets set PONDER_RPC_URL_11155111=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
   ```

4. **部署**:
   ```bash
   fly deploy
   ```

5. **查看状态**:
   ```bash
   fly status
   fly logs
   ```

#### 方式三：Docker 部署

1. **构建镜像**:
   ```bash
   cd packages/ponder
   docker build -t my-ponder .
   ```

2. **运行容器**:
   ```bash
   docker run -d \
     -e PONDER_RPC_URL_11155111=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY \
     -p 42069:42069 \
     my-ponder
   ```

3. **访问** `http://localhost:42069`

#### 方式四：直接部署到 VPS

```bash
# 安装 Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 PM2
sudo npm install -g pm2

# 克隆并配置
git clone <repo>
cd packages/ponder
npm install
echo "PONDER_RPC_URL_11155111=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY" > .env

# 使用 PM2 启动
pm2 start yarn --name ponder -- start
pm2 save
pm2 startup
```

### 3. 验证 Ponder 部署

访问部署的 Ponder URL，确认 GraphQL 可用：

```graphql
query {
  proposals(limit: 5) {
    items {
      id
      description
      state
    }
  }
}
```

---

## 第三部分：部署前端

### 1. 配置前端环境变量

创建/编辑 `packages/nextjs/.env.production`：

```env
# Sepolia RPC
NEXT_PUBLIC_ALCHEMY_API_KEY=你的 Alchemy API Key

# WalletConnect (如果使用)
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=你的 WalletConnect Project ID

# Ponder API (你部署的 Ponder 地址)
NEXT_PUBLIC_PONDER_URL=https://your-ponder-app.railway.app
```

### 2. 部署到 Vercel

```bash
# 全局安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 进入前端目录
cd packages/nextjs

# 部署预览
vercel

# 部署生产
vercel --prod
```

或通过 Vercel Dashboard 导入：

1. 访问 https://vercel.com/dashboard
2. Import Project
3. Root Directory: `packages/nextjs`
4. Build Command: `yarn next:build`
5. Environment Variables 添加上述变量
6. Deploy

---

## 第四部分：更新合约配置

### 1. 更新前端合约地址

编辑 `packages/nextjs/contracts/deployedContracts.ts`：

```typescript
import { sepolia } from "viem/chains";
import { optimismSepolia } from "wagmi";
import { NFTStakingPool, RewardToken, MyGovernor } from "~~/contracts/hardhat_contracts";

export default {
  [sepolia.id]: {
    ...RewardToken,
    ...NFTStakingPool,
    ...MyGovernor,
  },
};
```

### 2. 更新 Ponder 配置

编辑 `packages/ponder/ponder.config.ts`：

```typescript
import { sepolia } from "@ponder  chains";

export default {
  networks: [sepolia],
  contracts: [
    {
      name: "RewardToken",
      address: "0x...", // 你部署的地址
      startBlock: 12345678, // 部署交易的区块号
    },
    {
      name: "NFTStakingPool",
      address: "0x...",
      startBlock: 12345678,
    },
    {
      name: "MyGovernor",
      address: "0x...",
      startBlock: 12345678,
    },
  ],
};
```

### 3. 重新构建并部署 Ponder

```bash
cd packages/ponder
yarn ponder:build
# Railway/Fly 会自动重新部署
```

---

## 第五部分：验证部署

### 检查清单

- [ ] 合约已部署到 Sepolia，地址正确
- [ ] Ponder 已部署，可访问 GraphQL
- [ ] 前端已部署到 Vercel
- [ ] 前端环境变量 `NEXT_PUBLIC_PONDER_URL` 指向正确
- [ ] 页面加载正常
- [ ] 钱包连接正常
- [ ] 显示正确的网络 (Sepolia)

### 完整流程测试

1. 连接钱包 (确保在 Sepolia 网络)
2. 铸造/购买 NFT
3. 质押 NFT
4. 创建治理提案
5. 投票
6. 提案通过后执行

---

## 快速检查清单

- [ ] Sepolia 测试 ETH (水龙头领取)
- [ ] Alchemy API Key (Sepolia RPC)
- [ ] WalletConnect Project ID (如果需要)
- [ ] Etherscan API Key (可选)
- [ ] 合约部署成功，记录地址
- [ ] Ponder 部署成功，GraphQL 可用
- [ ] 前端配置 NEXT_PUBLIC_PONDER_URL
- [ ] Vercel 部署成功
- [ ] 全流程测试通过

---

## 常见问题

### Q: 部署失败 "insufficient funds"
A: 确保钱包有足够的 Sepolia ETH，去水龙头领取。

### Q: 合约验证失败
A: 确保 Etherscan API Key 正确，部署后 24 小时才可验证。

### Q: 前端无法读取合约数据
A: 检查：
1. Ponder 是否正常运行
2. `NEXT_PUBLIC_PONDER_URL` 是否正确配置
3. Ponder GraphQL 是否可访问

### Q: Ponder 同步慢
A: 首次同步需要从部署区块开始，可能需要几分钟到几小时。可以设置 `startBlock` 减少历史数据量。

### Q: 交易失败
A: 检查：
1. 是否在正确的网络 (Sepolia)
2. 合约方法是否有权限限制
3. 参数是否正确

---

## 生产环境部署

如果需要部署到主网 (Mainnet)：

1. 将所有 `sepolia` 配置改为 `mainnet` (chainId: 1)
2. 使用真实的 RPC URL 和 API Key
3. 确保合约已经过完整审计
4. 准备足够的 ETH 用于 Gas
5. Ponder 改为使用主网 RPC

---

**注意**: 永远不要将包含私钥的 `.env` 文件提交到版本控制！
