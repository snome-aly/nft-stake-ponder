# Sepolia 手动发布上线教程

本教程用于把当前 NFT staking dApp 手动发布到 Sepolia 测试网，并上线 Ponder 索引器和 Next.js 前端。

目标：

- 合约部署到 Sepolia。
- Ponder 索引 Sepolia 合约事件，并提供 GraphQL API。
- 前端部署到 Vercel 或其他 Next.js 托管平台。
- 你亲手执行每一步，教程只提供操作顺序和检查点。

适用项目结构：

```text
packages/hardhat   合约、部署脚本、部署账户
packages/ponder    Ponder 索引器
packages/nextjs    Next.js 前端
```

## 0. 发布前原则

1. 不要使用有真实资产的钱包作为部署账户。
2. 不要把 `.env`、私钥、API key 提交到 Git。
3. Sepolia 合约部署后地址不可变。如果重新部署，需要重新发布 Ponder 和前端。
4. 前端和 Ponder 都依赖 `packages/nextjs/contracts/deployedContracts.ts`，它会在 `yarn deploy --network sepolia` 后自动更新。
5. 这个项目的 Ponder 会读取 `packages/nextjs/scaffold.config.ts` 里的第一个 `targetNetworks`，上线前必须确保第一个网络是 Sepolia。

## 1. 本地环境准备

确认 Node 和 Yarn：

```bash
node -v
yarn -v
```

要求：

- Node.js >= 20.18.3
- Yarn 3.2.3

如果没有启用 Corepack：

```bash
corepack enable
```

安装依赖：

```bash
yarn install
```

建议先新建一个发布分支：

```bash
git checkout -b deploy/sepolia
```

确认不要把本地密钥文件提交：

```bash
cat >> .git/info/exclude <<'EOF'
packages/hardhat/.env
packages/ponder/.env.local
packages/nextjs/.env.local
EOF
```

检查工作区：

```bash
git status
```

发布前最好把 UI 和功能改动先提交干净，再开始部署。

## 2. 获取需要的外部账号和密钥

你需要准备：

| 用途 | 变量名 | 说明 |
| --- | --- | --- |
| Hardhat RPC | `ALCHEMY_API_KEY` | 用于合约部署和验证读取链数据 |
| 前端 RPC | `NEXT_PUBLIC_ALCHEMY_API_KEY` | 前端连接 Sepolia |
| WalletConnect | `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | RainbowKit 移动端钱包连接 |
| Etherscan 验证 | `ETHERSCAN_V2_API_KEY` | 合约源码验证 |
| Ponder RPC | `PONDER_RPC_URL_11155111` | Ponder 索引 Sepolia |
| 前端读取 Ponder | `NEXT_PUBLIC_PONDER_URL` | 前端 GraphQL 请求地址 |

Sepolia chain id 是 `11155111`。

## 3. 配置部署账户

进入项目根目录执行。

如果要生成新的测试网部署账户：

```bash
yarn account:generate
```

如果要导入已有测试钱包私钥：

```bash
yarn account:import
```

这两个命令会把加密后的私钥保存到：

```text
packages/hardhat/.env
```

然后编辑 `packages/hardhat/.env`，补充：

```env
ALCHEMY_API_KEY=你的_Alchemy_API_Key
ETHERSCAN_V2_API_KEY=你的_Etherscan_V2_API_Key
```

检查部署账户地址和 Sepolia 余额：

```bash
yarn account
```

命令会要求输入你加密私钥时设置的密码。

部署账户需要有 Sepolia ETH。建议至少准备 `0.1 ETH` 以上，方便多次部署、验证、测试 mint。

## 4. 检查远程网络角色配置

本项目部署脚本会用三个 named accounts：

- `deployer`
- `operator`
- `pauser`

本地 Hardhat 有多个默认账户，但 Sepolia 默认只会加载一个部署私钥。因此上线测试网前，建议先把 `operator` 和 `pauser` 在 Sepolia 上临时指向部署账户。

打开：

```text
packages/hardhat/hardhat.config.ts
```

确认 `namedAccounts` 类似这样：

```ts
namedAccounts: {
  deployer: {
    default: 0,
  },
  operator: {
    default: 1,
    sepolia: 0,
  },
  pauser: {
    default: 2,
    sepolia: 0,
  },
},
```

说明：

- `sepolia: 0` 表示 Sepolia 上使用部署账户作为 operator/pauser。
- 这是作品集测试网上线的简化做法。
- 如果你想更真实地分离权限，可以导入并配置多个账户地址，但每个账户都需要有 Sepolia ETH。

## 5. 切换前端和 Ponder 到 Sepolia

打开：

```text
packages/nextjs/scaffold.config.ts
```

上线 Sepolia 时建议改成：

```ts
targetNetworks: [chains.sepolia],
```

保留：

```ts
onlyLocalBurnerWallet: true,
```

原因：

- 前端默认网络会变成 Sepolia。
- Ponder 配置会读取第一个 `targetNetworks`，因此也会索引 Sepolia。
- 如果仍然是 `[chains.hardhat, chains.sepolia, chains.mainnet]`，Ponder 上线后会尝试索引 Hardhat 本地链，这是错误的。

## 6. 发布前本地检查

合约编译：

```bash
yarn hardhat:compile
```

前端类型检查：

```bash
yarn next:check-types
```

Ponder 类型检查：

```bash
yarn ponder:typecheck
```

前端构建：

```bash
yarn next:build
```

说明：

- `yarn hardhat:check-types` 当前仓库可能会因为旧的 docs/scripts/tests 类型问题失败，和合约部署不一定直接相关。
- 真正部署前至少要保证 `yarn hardhat:compile` 通过。

## 7. 部署合约到 Sepolia

普通真实数据部署：

```bash
yarn deploy --network sepolia
```

执行时会要求输入部署账户密码。

部署完成后会自动：

1. 执行 `packages/hardhat/deploy/*.ts`。
2. 保存部署记录到 `packages/hardhat/deployments/sepolia/`。
3. 更新 `packages/nextjs/contracts/deployedContracts.ts`。

你需要重点看输出里的合约地址：

- `StakableNFT`
- `RewardToken`
- `NFTStakingPool`
- `Timelock`
- `MyGovernor`

检查生成文件：

```bash
ls packages/hardhat/deployments/sepolia
git diff -- packages/nextjs/contracts/deployedContracts.ts
```

### 可选：治理演示票权

当前部署脚本默认不会在 Sepolia 给部署者预铸 `100000 RWRD`，避免作品集数据失真。

如果你只是为了演示 Governance 流程，并且接受测试网上出现演示票权，可以在部署前设置：

```bash
BOOTSTRAP_GOVERNANCE_VOTES=true yarn deploy --network sepolia
```

不建议默认这么做。更真实的流程是：

1. 用户 mint NFT。
2. 全部 100 个 NFT mint 完。
3. Admin 调用 `reveal()`。
4. 用户 stake NFT。
5. 用户 claim RWRD。
6. 用户 delegate 后获得治理投票权。

注意：本项目 `reveal()` 要求 `totalMinted == 100`，未 reveal 前不能 stake。

## 8. 验证合约源码

部署后等待几十秒，让 Etherscan 索引交易，再执行：

```bash
yarn verify --network sepolia
```

如果第一次失败，常见原因是 Etherscan 还没同步合约。等 1 到 3 分钟后重试。

验证后打开：

```text
https://sepolia.etherscan.io/address/你的合约地址
```

检查 `Contract` tab 是否显示源码。

## 9. 提交部署产物

部署成功后，至少要提交这些文件：

```text
packages/hardhat/deployments/sepolia/*
packages/nextjs/contracts/deployedContracts.ts
packages/nextjs/scaffold.config.ts
```

如果你修改了 `hardhat.config.ts` 的 Sepolia named accounts，也一起提交：

```text
packages/hardhat/hardhat.config.ts
```

检查不要提交密钥：

```bash
git status --short
```

确认没有这些文件：

```text
packages/hardhat/.env
packages/ponder/.env.local
packages/nextjs/.env.local
```

提交：

```bash
git add packages/hardhat/deployments/sepolia \
  packages/nextjs/contracts/deployedContracts.ts \
  packages/nextjs/scaffold.config.ts \
  packages/hardhat/hardhat.config.ts

git commit -m "deploy contracts to sepolia"
```

推送到 GitHub：

```bash
git push origin deploy/sepolia
```

## 10. 本地跑 Sepolia Ponder 做一次检查

创建本地 Ponder 环境变量：

```bash
cat > packages/ponder/.env.local <<'EOF'
PONDER_RPC_URL_11155111=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
EOF
```

启动：

```bash
yarn ponder:dev
```

看到 Ponder 开始 indexing 后，打开：

```text
http://localhost:42069
```

测试一个简单 GraphQL 查询：

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

如果没有 proposal，返回空数组是正常的。关键是服务可访问且没有配置错误。

## 11. 部署 Ponder

Ponder 是一个长时间运行的索引服务，不建议部署到纯静态平台。建议用 Railway、Render、Fly.io、VPS 等能运行 Node 服务的平台。

### 方案 A：Railway 或 Render

创建一个 Web Service，连接你的 GitHub 仓库。

建议配置：

```text
Root Directory: 仓库根目录
Build Command: corepack enable && yarn install --immutable
Start Command: yarn ponder:start
```

环境变量：

```env
PONDER_RPC_URL_11155111=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
```

说明：

- 当前 `ponder.config.ts` 里 PostgreSQL 配置是注释状态。
- 不配置数据库时，Ponder 会使用默认存储方式。对 Sepolia 小型作品集 demo 通常可以接受。
- 如果你希望重启后不用重新索引，应后续接 PostgreSQL，并在 `ponder.config.ts` 打开 `database` 配置。

部署成功后得到一个 URL，例如：

```text
https://your-ponder-app.example.com
```

用这个 URL 测试 GraphQL 查询。确认能查后，记录它，后面填给前端：

```env
NEXT_PUBLIC_PONDER_URL=https://your-ponder-app.example.com
```

### 方案 B：VPS + PM2

如果你用自己的服务器：

```bash
git clone <your-repo-url>
cd nft-stake-ponder
corepack enable
yarn install

cat > packages/ponder/.env.local <<'EOF'
PONDER_RPC_URL_11155111=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
EOF

npm install -g pm2
pm2 start "yarn ponder:start" --name nft-stake-ponder
pm2 save
```

然后用 Nginx 或平台反代暴露 Ponder 的 HTTP 端口。

## 12. 前端本地连接线上 Ponder 测试

创建：

```bash
cat > packages/nextjs/.env.local <<'EOF'
NEXT_PUBLIC_ALCHEMY_API_KEY=YOUR_ALCHEMY_KEY
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=YOUR_WALLET_CONNECT_PROJECT_ID
NEXT_PUBLIC_PONDER_URL=https://your-ponder-app.example.com
EOF
```

启动前端：

```bash
yarn start
```

打开：

```text
http://localhost:3000
```

手动检查：

1. 钱包能连接。
2. 网络能切到 Sepolia。
3. Mint 页面显示 Sepolia 合约数据。
4. Governance 页面不会请求 `localhost:42069`。
5. Ponder 相关数据能加载。如果没有事件，显示空状态也可以。

## 13. 部署前端到 Vercel

推荐用 Vercel 部署 `packages/nextjs`。

### 方式 A：Vercel Dashboard

导入 GitHub 仓库后，建议配置：

```text
Framework Preset: Next.js
Root Directory: packages/nextjs
Build Command: yarn build
```

环境变量：

```env
NEXT_PUBLIC_ALCHEMY_API_KEY=YOUR_ALCHEMY_KEY
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=YOUR_WALLET_CONNECT_PROJECT_ID
NEXT_PUBLIC_PONDER_URL=https://your-ponder-app.example.com
```

如果 Vercel 无法正确识别 Yarn workspace，改用仓库根目录作为 Root Directory，并设置：

```text
Build Command: yarn next:build
```

### 方式 B：Vercel CLI

先登录：

```bash
yarn vercel:login
```

从仓库根目录执行：

```bash
yarn vercel
```

第一次执行时按提示选择项目。部署成功后，在 Vercel 项目设置里补齐环境变量，再重新 deploy 一次。

不要在正式作品集部署里长期使用：

```env
NEXT_PUBLIC_IGNORE_BUILD_ERROR=true
```

这个变量只适合临时排查，不适合最终展示。

## 14. 上线后手工验收清单

打开线上前端 URL 后检查：

### 钱包和网络

- 能连接 MetaMask。
- 能切换到 Sepolia。
- Header 钱包余额和地址显示正常。

### Mint

- Mint price 是 `0.001 ETH`。
- 能 mint 1 个 NFT。
- 交易能在 Sepolia Etherscan 查到。
- `totalMinted` 会更新。

### Collection

- 已 mint 的 NFT 能显示。
- 未 reveal 前显示 blind box 状态。

### Admin

- 用部署账户连接时能看到 Admin 页面。
- 非管理员账户会显示权限不足。
- `totalMinted`、contract balance、reveal status 正常。

### Reveal 和 Stake

- `reveal()` 只有在 100 个 NFT 全部 mint 后才能调用。
- 未 reveal 前不能 stake，这是合约设计。
- reveal 后 NFT 有 rarity。
- stake 后 Pending Reward 会增长。
- claim 后 RWRD 余额增加。

### Governance

- Voting Power 卡片显示正常。
- Token Balance 和 Delegated Votes 区分清楚。
- Create Proposal 不溢出。
- Proposal list 能从 Ponder 读取。
- 如果没有治理数据，空状态要正常。

### Ponder

- Ponder 服务 URL 可访问。
- GraphQL 查询不报错。
- 前端 `NEXT_PUBLIC_PONDER_URL` 指向线上 Ponder，不是 localhost。

## 15. 常见问题

### 1. Ponder 仍然在索引 hardhat

检查：

```text
packages/nextjs/scaffold.config.ts
```

确保：

```ts
targetNetworks: [chains.sepolia],
```

然后重新部署 Ponder。

### 2. 前端找不到 Sepolia 合约

检查 `deployedContracts.ts` 是否包含 `11155111`：

```bash
rg "11155111" packages/nextjs/contracts/deployedContracts.ts
```

如果没有，说明你还没有成功执行：

```bash
yarn deploy --network sepolia
```

### 3. 部署时 operator 或 pauser 报错

通常是远程网络只配置了一个账户，但 `namedAccounts.operator.default = 1`、`pauser.default = 2`。

解决方式见第 4 节，把 Sepolia 上的 operator/pauser 指向账户 0：

```ts
operator: { default: 1, sepolia: 0 },
pauser: { default: 2, sepolia: 0 },
```

### 4. Etherscan 验证失败

检查：

- `ETHERSCAN_V2_API_KEY` 是否正确。
- 部署后是否等待了 1 到 3 分钟。
- 当前网络是否是 `sepolia`。

重试：

```bash
yarn verify --network sepolia
```

### 5. Governance 投票权是 0

这是正常的。`RewardToken` 初始供应量为 0，用户需要：

1. stake 已 reveal 的 NFT。
2. claim RWRD。
3. delegate 给自己或其他地址。

之后 `Delegated Votes` 才会增加。

如果你只是想演示治理 UI，可以用 `BOOTSTRAP_GOVERNANCE_VOTES=true` 重新部署，但这会产生演示用的 100k RWRD 票权，不适合真实数据展示。

### 6. Stake 页面不能质押

检查 NFT 是否已经 reveal。

合约要求：

```text
totalMinted == 100
```

只有全部 mint 完并调用 `reveal()` 后，NFT 才有 reward multiplier，才能 stake。

### 7. 前端线上仍请求 localhost Ponder

检查 Vercel 环境变量：

```env
NEXT_PUBLIC_PONDER_URL=https://your-ponder-app.example.com
```

修改后必须重新部署前端。

## 16. 推荐发布顺序总结

按这个顺序执行最稳：

```text
1. 新建 deploy/sepolia 分支
2. 配置部署账户和 .env
3. 配置 hardhat namedAccounts 的 sepolia operator/pauser
4. 配置 scaffold.config.ts 的 targetNetworks 为 [chains.sepolia]
5. yarn hardhat:compile
6. yarn next:check-types
7. yarn next:build
8. yarn deploy --network sepolia
9. yarn verify --network sepolia
10. 提交 deployments/sepolia、deployedContracts.ts、配置改动
11. 部署 Ponder
12. 本地前端连接线上 Ponder 测试
13. 部署 Vercel 前端
14. 线上手工验收 mint、collection、admin、governance、stake
```

## 17. 最终提交检查

发布相关提交建议包含：

```text
packages/hardhat/deployments/sepolia/*
packages/nextjs/contracts/deployedContracts.ts
packages/nextjs/scaffold.config.ts
packages/hardhat/hardhat.config.ts
```

不要包含：

```text
packages/hardhat/.env
packages/ponder/.env.local
packages/nextjs/.env.local
```

最后检查：

```bash
git status --short
git log --oneline -5
```

如果线上有问题，优先不要急着改合约。先确认：

1. 前端环境变量。
2. Ponder 是否在线。
3. `targetNetworks` 是否是 Sepolia。
4. `deployedContracts.ts` 是否包含 Sepolia 合约地址。
5. 钱包是否连接 Sepolia。
