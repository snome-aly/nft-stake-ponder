# Web3 周边生态集成指南

**项目**：NFT 质押学习项目
**版本**：v1.0
**目标**：通过实际集成学习 Web3 生态工具链

---

## 📋 目录

1. [核心基础设施](#1-核心基础设施)
2. [开发与调试工具](#2-开发与调试工具)
3. [安全与审计](#3-安全与审计)
4. [存储方案](#4-存储方案)
5. [索引与查询](#5-索引与查询)
6. [自动化与运维](#6-自动化与运维)
7. [身份与钱包](#7-身份与钱包)
8. [预言机与链外数据](#8-预言机与链外数据)
9. [治理与DAO工具](#9-治理与dao工具)
10. [NFT 生态](#10-nft-生态)
11. [监控与分析](#11-监控与分析)
12. [测试网资源](#12-测试网资源)

---

## 1. 核心基础设施

### 1.1 RPC 节点服务

#### Alchemy（推荐用于本项目）

**用途**：提供以太坊节点访问、增强 API、NFT API

**集成步骤**：
```bash
# 1. 注册账号：https://www.alchemy.com/
# 2. 创建 App（选择 Sepolia 测试网）
# 3. 获取 API Key

# 4. 配置环境变量
echo "NEXT_PUBLIC_ALCHEMY_API_KEY=your_key_here" >> packages/nextjs/.env.local
echo "ALCHEMY_API_KEY=your_key_here" >> packages/hardhat/.env
```

**核心功能使用**：
```typescript
// packages/nextjs/lib/alchemy.ts
import { Alchemy, Network } from "alchemy-sdk";

const config = {
  apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
  network: Network.ETH_SEPOLIA,
};

export const alchemy = new Alchemy(config);

// 使用示例：获取 NFT 元数据（增强功能）
export async function getNFTMetadata(contractAddress: string, tokenId: string) {
  return await alchemy.nft.getNftMetadata(contractAddress, tokenId);
}

// 获取用户所有 NFT（无需遍历 tokenId）
export async function getUserNFTs(ownerAddress: string) {
  return await alchemy.nft.getNftsForOwner(ownerAddress, {
    contractAddresses: [YOUR_NFT_CONTRACT],
  });
}

// 监听新区块（实时更新奖励）
alchemy.ws.on("block", (blockNumber) => {
  console.log("New block:", blockNumber);
  // 触发奖励重新计算
});
```

**学习要点**：
- ✅ 理解 RPC vs 增强 API
- ✅ NFT API 的优势（无需自己索引）
- ✅ WebSocket 实时订阅
- ✅ 请求速率限制与优化

---

#### Infura（备选方案）

**对比 Alchemy**：
- Alchemy：更好的开发者体验、NFT API、调试工具
- Infura：ConsenSys 产品、IPFS 集成、老牌稳定

**集成示例**：
```typescript
// packages/nextjs/scaffold.config.ts
const scaffoldConfig = {
  targetNetworks: [chains.sepolia],
  pollingInterval: 30000,
  rpcProviderUrl: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
  // ...
};
```

---

### 1.2 区块浏览器与验证

#### Etherscan

**用途**：合约验证、链上数据查询、API 服务

**自动验证合约**（已内置在 Scaffold-ETH）：
```bash
# packages/hardhat/.env
ETHERSCAN_API_KEY=your_etherscan_key

# 部署后自动验证
yarn deploy --network sepolia

# 手动验证
yarn hardhat:verify --network sepolia
```

**使用 Etherscan API**：
```typescript
// packages/nextjs/lib/etherscan.ts
const ETHERSCAN_API = "https://api-sepolia.etherscan.io/api";
const API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY;

// 获取合约 ABI（如果未验证）
export async function getContractABI(address: string) {
  const response = await fetch(
    `${ETHERSCAN_API}?module=contract&action=getabi&address=${address}&apikey=${API_KEY}`
  );
  const data = await response.json();
  return JSON.parse(data.result);
}

// 获取历史交易（用于用户活动时间线）
export async function getUserTransactions(address: string, contractAddress: string) {
  const response = await fetch(
    `${ETHERSCAN_API}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=100&sort=desc&apikey=${API_KEY}`
  );
  const data = await response.json();

  // 过滤与我们合约的交互
  return data.result.filter((tx: any) => tx.to.toLowerCase() === contractAddress.toLowerCase());
}

// 获取 Gas 价格（优化交易费用）
export async function getGasPrice() {
  const response = await fetch(
    `${ETHERSCAN_API}?module=gastracker&action=gasoracle&apikey=${API_KEY}`
  );
  const data = await response.json();
  return data.result; // { SafeGasPrice, ProposeGasPrice, FastGasPrice }
}
```

**学习要点**：
- ✅ 合约验证的重要性（开源、可信、可交互）
- ✅ Etherscan API 的多种用途
- ✅ Gas 价格优化策略

---

### 1.3 Tenderly（合约调试与监控）

**用途**：交易模拟、调试、监控、Gas 分析

**集成步骤**：
```bash
# 1. 安装 Tenderly CLI
npm install -g @tenderly/cli

# 2. 登录
tenderly login

# 3. 初始化项目
tenderly init

# 4. 配置 hardhat
# packages/hardhat/hardhat.config.ts
import * as tdly from "@tenderly/hardhat-tenderly";
tdly.setup({ automaticVerifications: true });

export default {
  tenderly: {
    project: "your-project",
    username: "your-username",
  },
  networks: {
    sepolia: {
      url: "...",
      verify: {
        etherscan: { apiKey: "..." },
        tenderly: true, // 自动在 Tenderly 验证
      },
    },
  },
};
```

**核心功能**：

1. **交易模拟（在发送前测试）**：
```typescript
// packages/nextjs/hooks/useSimulateTransaction.ts
import { useMutation } from "@tanstack/react-query";

export function useSimulateTransaction() {
  return useMutation({
    mutationFn: async (tx: { from: string; to: string; data: string; value: string }) => {
      const response = await fetch("https://api.tenderly.co/api/v1/account/me/project/YOUR_PROJECT/simulate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Access-Key": process.env.NEXT_PUBLIC_TENDERLY_ACCESS_KEY!,
        },
        body: JSON.stringify({
          network_id: "11155111", // Sepolia
          from: tx.from,
          to: tx.to,
          input: tx.data,
          value: tx.value,
          save: true, // 保存模拟结果
        }),
      });
      return response.json();
    },
  });
}

// 使用示例
function StakeButton() {
  const { mutateAsync: simulate } = useSimulateTransaction();
  const { writeContractAsync } = useScaffoldWriteContract("NFTStakingPool");

  const handleStake = async () => {
    // 1. 先模拟交易
    const simulation = await simulate({
      from: address,
      to: stakingPoolAddress,
      data: encodeFunctionData({ functionName: "stake", args: [tokenId] }),
      value: "0",
    });

    // 2. 检查是否会失败
    if (!simulation.transaction.status) {
      alert(`Transaction would fail: ${simulation.transaction.error_message}`);
      return;
    }

    // 3. 显示预估 Gas
    console.log("Estimated gas:", simulation.transaction.gas_used);

    // 4. 执行真实交易
    await writeContractAsync({ functionName: "stake", args: [tokenId] });
  };
}
```

2. **监控（Alerts）**：
```yaml
# 在 Tenderly Dashboard 设置 Alerts
# 示例：当质押池 TVL 超过阈值时通知

Alert: High TVL Reached
- Event: NFTStakingPool.Staked
- Condition: totalStaked > 100
- Action: Send webhook to Discord/Telegram
```

**学习要点**：
- ✅ 交易模拟的价值（避免失败交易浪费 Gas）
- ✅ 调试智能合约执行过程
- ✅ Gas Profiler（找出高耗 Gas 的代码行）
- ✅ 实时监控与告警

---

## 2. 开发与调试工具

### 2.1 Hardhat 插件生态

#### hardhat-gas-reporter（Gas 优化）

**用途**：测试时自动生成 Gas 报告

**集成**：
```bash
yarn add --dev hardhat-gas-reporter
```

```typescript
// packages/hardhat/hardhat.config.ts
import "hardhat-gas-reporter";

export default {
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY, // 获取实时价格
    outputFile: "gas-report.txt",
    noColors: true,
  },
};
```

**使用**：
```bash
REPORT_GAS=true yarn hardhat:test

# 输出示例：
# ·--------------------------------|----------------------------|-------------|
# |  Methods                       ·           Gas           ·  Cost (USD) |
# ·--------------|-----------------|----------|----------|------|-----------|
# |  Contract    |  Method         |  Min     |  Max     |  Avg |  # calls  |
# ·--------------|-----------------|----------|----------|------|-----------|
# |  StakingPool |  stake          |  120000  |  145000  |  132500 | 50     |
# |  StakingPool |  unstake        |   95000  |  105000  |  100000 | 30     |
```

**学习要点**：
- ✅ 识别高 Gas 函数
- ✅ 对比优化前后的差异
- ✅ 批量操作的 Gas 节省

---

#### hardhat-contract-sizer（合约大小检查）

**用途**：检查合约是否超过 24KB 限制

```bash
yarn add --dev hardhat-contract-sizer
```

```typescript
// packages/hardhat/hardhat.config.ts
import "hardhat-contract-sizer";

export default {
  contractSizer: {
    alphaSort: true,
    runOnCompile: true,
    disambiguatePaths: false,
  },
};
```

```bash
yarn hardhat:compile

# 输出：
# ·-----------------------|---------------|
# |  Contract             |  Size (KB)    |
# ·-----------------------|---------------|
# |  NFTStakingPool       |  18.5         |
# |  AchievementNFT       |  22.1         |
# |  AchievementGovernor  |  23.8  ⚠️     |
```

---

#### @nomicfoundation/hardhat-verify（多链验证）

**用途**：支持多个区块浏览器的合约验证

```typescript
// packages/hardhat/hardhat.config.ts
export default {
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY,
      polygon: process.env.POLYGONSCAN_API_KEY,
      arbitrum: process.env.ARBISCAN_API_KEY,
    },
  },
};
```

---

### 2.2 Remix IDE（快速原型）

**用途**：在线测试 Solidity 代码片段

**集成工作流**：
1. 在 Remix 编写合约原型
2. 使用 Remixd 连接本地文件系统
3. 快速测试后移植到 Hardhat

```bash
# 安装 Remixd
npm install -g @remix-project/remixd

# 连接本地文件夹
remixd -s packages/hardhat/contracts -u https://remix.ethereum.org
```

**学习要点**：
- ✅ 快速验证 Solidity 语法
- ✅ 使用内置的静态分析器
- ✅ 可视化合约调用

---

### 2.3 Foundry（可选高级工具）

**用途**：用 Solidity 编写测试、极快的编译速度

**对比 Hardhat**：
- Hardhat：JavaScript/TypeScript 测试、更好的生态集成
- Foundry：Solidity 测试、Fuzz 测试、快 10-50 倍

**快速体验**：
```bash
# 安装
curl -L https://foundry.paradigm.xyz | bash
foundryup

# 初始化项目（可选）
forge init foundry-tests

# 编写 Solidity 测试
# test/StakingPool.t.sol
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/NFTStakingPool.sol";

contract StakingPoolTest is Test {
    NFTStakingPool pool;

    function setUp() public {
        pool = new NFTStakingPool(address(nft), address(token));
    }

    function testStake() public {
        // ...
    }

    // Fuzz 测试：自动生成随机输入
    function testFuzzRewardCalculation(uint256 duration) public {
        vm.assume(duration > 0 && duration < 365 days);
        // 测试不同时长的奖励计算
    }
}
```

**学习要点**：
- ✅ Fuzz 测试（发现边界情况 Bug）
- ✅ Cheatcodes（vm.prank, vm.warp 等）
- ✅ Gas 快照对比

---

## 3. 安全与审计

### 3.1 Slither（静态分析）

**用途**：自动检测常见漏洞

**安装与使用**：
```bash
# 安装 Slither
pip3 install slither-analyzer

# 分析合约
cd packages/hardhat
slither contracts/staking/NFTStakingPool.sol

# 输出示例：
# NFTStakingPool.unstake(uint256) (contracts/NFTStakingPool.sol#45-60) ignores return value by rewardToken.transfer(msg.sender,rewards) (contracts/NFTStakingPool.sol#52)
# Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#unchecked-transfer
```

**集成到 CI/CD**：
```yaml
# .github/workflows/security.yml
name: Security Audit

on: [push, pull_request]

jobs:
  slither:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: crytic/slither-action@v0.3.0
        with:
          target: 'packages/hardhat/contracts'
          fail-on: high
```

**常见检测项**：
- ✅ 重入攻击
- ✅ 未检查的外部调用返回值
- ✅ 整数溢出（Solidity 0.8+ 已内置）
- ✅ 访问控制问题
- ✅ 时间戳依赖

---

### 3.2 MythX（深度审计）

**用途**：ConsenSys 的商业级审计服务

**集成**：
```bash
yarn add --dev truffle-security

# 分析
npx truffle run verify StakingPool --network sepolia
```

**学习要点**：
- ✅ 静态分析 vs 符号执行 vs 模糊测试
- ✅ 审计报告解读

---

### 3.3 OpenZeppelin Defender（运行时保护）

**用途**：监控合约、自动化操作、安全管理

**功能模块**：

1. **Defender Admin（权限管理）**：
```typescript
// 使用 Defender Admin 管理 Ownable 合约
// 避免直接使用 EOA 私钥

// 步骤：
// 1. 在 Defender 创建 Relayer（中继器）
// 2. 将合约 Ownership 转移到 Defender Admin
await stakingPool.transferOwnership(DEFENDER_ADMIN_ADDRESS);

// 3. 通过 Defender UI 执行管理操作
// 支持多签、时间锁、审批流程
```

2. **Defender Sentinel（监控）**：
```javascript
// 在 Defender Dashboard 设置监控

// 示例：检测大额质押
{
  "name": "Large Stake Alert",
  "type": "BLOCK",
  "network": "sepolia",
  "addresses": ["YOUR_STAKING_POOL"],
  "abi": [...],
  "conditions": {
    "event": "Staked",
    "expression": "multiplier >= 300" // 传说级 NFT
  },
  "notification": {
    "channels": ["telegram", "email"]
  }
}
```

3. **Defender Autotasks（自动化）**：
```javascript
// 自动执行定期任务（如奖励发放）

// autotask.js
exports.handler = async function(credentials, context) {
  const { ethers } = require('ethers');
  const provider = new ethers.providers.JsonRpcProvider(credentials.rpcUrl);
  const signer = new ethers.Wallet(credentials.secrets.privateKey, provider);

  const stakingPool = new ethers.Contract(STAKING_POOL_ADDRESS, ABI, signer);

  // 获取所有活跃质押
  const events = await stakingPool.queryFilter('Staked');

  for (const event of events) {
    const rewards = await stakingPool.calculateRewards(event.args.tokenId);

    // 如果奖励超过阈值，自动发放
    if (rewards.gt(ethers.utils.parseEther('100'))) {
      await stakingPool.claimRewards(event.args.tokenId);
    }
  }
};

// 在 Defender 设置 Cron: 0 0 * * * (每天午夜执行)
```

**学习要点**：
- ✅ 运行时安全监控
- ✅ 事件驱动的自动化
- ✅ 私钥管理最佳实践
- ✅ 多签治理

---

## 4. 存储方案

### 4.1 IPFS 深度集成

#### Pinata（推荐）

**用途**：IPFS 固定服务（确保文件持久可用）

**集成步骤**：
```bash
yarn add pinata

# packages/hardhat/.env
PINATA_API_KEY=your_key
PINATA_SECRET_KEY=your_secret
```

**上传 NFT 元数据**：
```typescript
// packages/hardhat/scripts/uploadToPinata.ts
import pinataSDK from "@pinata/sdk";
import fs from "fs";
import path from "path";

const pinata = new pinataSDK({
  pinataApiKey: process.env.PINATA_API_KEY,
  pinataSecretApiKey: process.env.PINATA_SECRET_KEY,
});

async function uploadNFTMetadata() {
  // 1. 先上传图片
  const imagePath = path.join(__dirname, "../assets/nft-common.png");
  const imageStream = fs.createReadStream(imagePath);

  const imageResult = await pinata.pinFileToIPFS(imageStream, {
    pinataMetadata: { name: "NFT Common Rarity Image" },
  });

  console.log("Image CID:", imageResult.IpfsHash);

  // 2. 创建元数据 JSON
  const metadata = {
    name: "Stakable NFT #1",
    description: "A stakable NFT with Common rarity",
    image: `ipfs://${imageResult.IpfsHash}`,
    attributes: [
      { trait_type: "Rarity", value: "Common" },
      { trait_type: "Reward Multiplier", value: "1.0x" },
    ],
  };

  // 3. 上传元数据
  const metadataResult = await pinata.pinJSONToIPFS(metadata, {
    pinataMetadata: { name: "NFT #1 Metadata" },
  });

  console.log("Metadata URI:", `ipfs://${metadataResult.IpfsHash}`);
  return `ipfs://${metadataResult.IpfsHash}`;
}

// 运行
uploadNFTMetadata().then((uri) => {
  console.log("\nUse this URI when minting:");
  console.log(uri);
});
```

**批量上传**：
```typescript
// 上传整个目录（包含所有成就图片和元数据）
async function uploadAchievementAssets() {
  const sourcePath = path.join(__dirname, "../assets/achievements");

  const result = await pinata.pinFromFS(sourcePath, {
    pinataMetadata: { name: "Achievement NFT Assets" },
  });

  console.log("Folder CID:", result.IpfsHash);
  // 访问单个文件：ipfs://QmXXX/first-stake.png
}
```

**IPFS 网关配置**：
```typescript
// packages/nextjs/utils/ipfs.ts

const IPFS_GATEWAYS = [
  "https://gateway.pinata.cloud/ipfs/",
  "https://ipfs.io/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
  "https://dweb.link/ipfs/",
];

export function resolveIPFS(uri: string, gatewayIndex = 0): string {
  if (!uri.startsWith("ipfs://")) return uri;

  const cid = uri.replace("ipfs://", "");
  return `${IPFS_GATEWAYS[gatewayIndex]}${cid}`;
}

// 使用重试机制（避免网关故障）
export async function fetchIPFSWithFallback(uri: string) {
  for (let i = 0; i < IPFS_GATEWAYS.length; i++) {
    try {
      const response = await fetch(resolveIPFS(uri, i));
      if (response.ok) return await response.json();
    } catch (error) {
      console.log(`Gateway ${i} failed, trying next...`);
    }
  }
  throw new Error("All IPFS gateways failed");
}
```

**学习要点**：
- ✅ CID（内容标识符）原理
- ✅ IPFS 固定（Pinning）的重要性
- ✅ 网关的作用与局限
- ✅ 元数据标准（ERC721 Metadata Standard）

---

#### Web3.Storage（备选，免费）

**优势**：Filecoin 支持、免费、长期存储

```bash
yarn add web3.storage
```

```typescript
import { Web3Storage } from "web3.storage";

const client = new Web3Storage({ token: process.env.WEB3_STORAGE_TOKEN });

async function uploadToWeb3Storage(files: File[]) {
  const cid = await client.put(files);
  console.log("Stored with CID:", cid);
  return `ipfs://${cid}`;
}
```

---

### 4.2 Arweave（永久存储）

**用途**：一次付费、永久存储（适合重要 NFT）

**集成**：
```bash
yarn add arweave
```

```typescript
import Arweave from "arweave";

const arweave = Arweave.init({
  host: "arweave.net",
  port: 443,
  protocol: "https",
});

async function uploadToArweave(data: any) {
  const transaction = await arweave.createTransaction({ data: JSON.stringify(data) });

  transaction.addTag("Content-Type", "application/json");
  transaction.addTag("App-Name", "NFT-Staking");

  await arweave.transactions.sign(transaction, jwk); // 需要 Arweave 钱包
  await arweave.transactions.post(transaction);

  console.log("Arweave TX:", transaction.id);
  return `https://arweave.net/${transaction.id}`;
}
```

**对比 IPFS**：
- IPFS：需要持续固定、依赖网关、免费/低成本
- Arweave：一次付费永久存储、去中心化、更贵

---

### 4.3 IPNS（可变 IPFS 地址）

**用途**：更新 NFT 元数据而不改变地址

**示例**：
```typescript
// 创建 IPNS 名称
const { id } = await pinata.keyManager.create({ keyName: "achievement-metadata" });

// 初始发布
await pinata.pinning.hashPinPolicy(initialCID, {
  keyvalues: { ipnsName: id },
});

// 后续更新（升级成就时）
async function updateAchievementMetadata(newCID: string) {
  await pinata.pinning.hashPinPolicy(newCID, {
    keyvalues: { ipnsName: id },
  });
  // NFT 的 tokenURI 始终指向 ipns://QmIPNSHash
  // 但内容会自动指向最新的 CID
}
```

**学习要点**：
- ✅ IPFS 的不可变性
- ✅ IPNS 如何解决元数据更新问题
- ✅ 动态 NFT 的实现方式

---

## 5. 索引与查询

### 5.1 The Graph（行业标准）

**对比 Ponder**：
- **Ponder**：更现代、内置 TypeScript、更快的本地开发
- **The Graph**：成熟生态、去中心化网络、更多第三方服务支持

**迁移到 The Graph（可选学习）**：

```bash
# 安装 Graph CLI
yarn global add @graphprotocol/graph-cli

# 初始化
graph init --from-contract YOUR_CONTRACT_ADDRESS

# 项目结构
subgraph/
├── schema.graphql          # 对应 Ponder 的 ponder.schema.ts
├── subgraph.yaml           # 对应 ponder.config.ts
└── src/
    └── mapping.ts          # 对应 ponder/src/*.ts
```

**Schema 定义**：
```graphql
# schema.graphql
type User @entity {
  id: ID!
  totalStaked: Int!
  currentStaked: Int!
  totalRewardsEarned: BigInt!
  stakes: [Stake!]! @derivedFrom(field: "owner")
  achievements: [Achievement!]! @derivedFrom(field: "owner")
}

type Stake @entity {
  id: ID!
  owner: User!
  tokenId: BigInt!
  stakedAt: BigInt!
  unstakedAt: BigInt
  rewardsEarned: BigInt!
  isActive: Boolean!
}

type Achievement @entity {
  id: ID!
  owner: User!
  achievementType: Int!
  level: Int!
  unlockedAt: BigInt!
  votingPower: Int!
}
```

**映射函数**：
```typescript
// src/mapping.ts
import { Staked } from "../generated/NFTStakingPool/NFTStakingPool";
import { User, Stake } from "../generated/schema";

export function handleStaked(event: Staked): void {
  // 加载或创建用户
  let user = User.load(event.params.user.toHex());
  if (user == null) {
    user = new User(event.params.user.toHex());
    user.totalStaked = 0;
    user.currentStaked = 0;
    user.totalRewardsEarned = BigInt.zero();
  }

  user.totalStaked += 1;
  user.currentStaked += 1;
  user.save();

  // 创建质押记录
  let stake = new Stake(event.params.tokenId.toString());
  stake.owner = user.id;
  stake.tokenId = event.params.tokenId;
  stake.stakedAt = event.block.timestamp;
  stake.isActive = true;
  stake.rewardsEarned = BigInt.zero();
  stake.save();
}
```

**部署到 Graph Network**：
```bash
# 构建
graph codegen && graph build

# 部署到 Subgraph Studio
graph deploy --studio nft-staking

# 获取查询端点
# https://api.studio.thegraph.com/query/{id}/nft-staking/v0.0.1
```

**学习要点**：
- ✅ GraphQL Schema 设计
- ✅ Entity 关系（@derivedFrom）
- ✅ 去中心化索引网络
- ✅ 查询优化与成本

---

### 5.2 Covalent API（无代码索引）

**用途**：现成的 API，无需部署索引器

```typescript
// packages/nextjs/lib/covalent.ts
const COVALENT_API = "https://api.covalenthq.com/v1";
const API_KEY = process.env.NEXT_PUBLIC_COVALENT_API_KEY;

// 获取用户所有 NFT（跨合约）
export async function getUserNFTs(address: string, chainId: number = 11155111) {
  const response = await fetch(
    `${COVALENT_API}/${chainId}/address/${address}/balances_nft/?key=${API_KEY}`
  );
  const data = await response.json();
  return data.data.items;
}

// 获取合约的所有 Holders
export async function getNFTHolders(contractAddress: string) {
  const response = await fetch(
    `${COVALENT_API}/11155111/tokens/${contractAddress}/token_holders/?key=${API_KEY}`
  );
  return response.json();
}

// 获取交易历史（带解码）
export async function getTransactionHistory(address: string) {
  const response = await fetch(
    `${COVALENT_API}/11155111/address/${address}/transactions_v2/?key=${API_KEY}`
  );
  const data = await response.json();

  // Covalent 自动解码 logs
  return data.data.items.map((tx: any) => ({
    hash: tx.tx_hash,
    method: tx.log_events[0]?.decoded?.name,
    params: tx.log_events[0]?.decoded?.params,
  }));
}
```

**学习要点**：
- ✅ 托管 API vs 自建索引器
- ✅ 成本与灵活性的权衡
- ✅ 多链支持

---

## 6. 自动化与运维

### 6.1 Gelato Network（链上自动化）

**用途**：无需服务器的自动化任务执行

**场景**：自动触发成就检查

```typescript
// packages/hardhat/contracts/automation/AchievementChecker.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../achievements/AchievementTrigger.sol";

// Gelato 兼容合约
contract AchievementChecker {
    AchievementTrigger public trigger;

    constructor(address _trigger) {
        trigger = AchievementTrigger(_trigger);
    }

    // Gelato 会定期调用此函数检查是否需要执行
    function checker(address user) external view returns (bool canExec, bytes memory execPayload) {
        // 检查用户是否有新的成就可解锁
        UserProgress memory progress = trigger.userProgress(user);

        if (progress.totalStakedCount >= 10 && !hasWhaleAchievement(user)) {
            return (true, abi.encodeWithSelector(this.executeCheck.selector, user));
        }

        return (false, bytes("No achievement to unlock"));
    }

    function executeCheck(address user) external {
        trigger.checkAchievements(user);
    }
}
```

**注册 Gelato 任务**（在前端）：
```typescript
import { GelatoRelay } from "@gelatonetwork/relay-sdk";

const relay = new GelatoRelay();

async function createAutoTask() {
  const taskId = await relay.sponsoredCall(
    {
      chainId: 11155111,
      target: ACHIEVEMENT_CHECKER_ADDRESS,
      data: encodeFunctionData({
        abi: AchievementCheckerABI,
        functionName: "executeCheck",
        args: [userAddress],
      }),
    },
    process.env.NEXT_PUBLIC_GELATO_API_KEY
  );

  console.log("Task created:", taskId);
}
```

**学习要点**：
- ✅ 链上自动化 vs 链外 Cron
- ✅ Keeper 网络原理
- ✅ Gas 费用赞助

---

### 6.2 Chainlink Automation（原 Keepers）

**对比 Gelato**：
- Chainlink：更去中心化、Chainlink 生态
- Gelato：更灵活、更多链支持

**集成示例**：
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";

contract DiamondHandChecker is AutomationCompatibleInterface {
    AchievementTrigger public trigger;
    mapping(address => uint256) public lastCheckTime;

    function checkUpkeep(bytes calldata checkData)
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        address user = abi.decode(checkData, (address));

        // 检查用户是否持续质押 30 天
        UserProgress memory progress = trigger.userProgress(user);
        if (block.timestamp - progress.firstStakeTime >= 30 days) {
            return (true, checkData);
        }

        return (false, "");
    }

    function performUpkeep(bytes calldata performData) external override {
        address user = abi.decode(performData, (address));
        trigger.checkAchievements(user);
    }
}
```

---

## 7. 身份与钱包

### 7.1 ENS（以太坊域名服务）

**用途**：用户友好的地址展示

**集成**：
```typescript
// packages/nextjs/hooks/useENS.ts
import { useEnsName, useEnsAvatar } from "wagmi";

export function useENSProfile(address: string | undefined) {
  const { data: ensName } = useEnsName({ address });
  const { data: ensAvatar } = useEnsAvatar({ name: ensName });

  return {
    name: ensName || address,
    avatar: ensAvatar || "/default-avatar.png",
  };
}

// 使用
function UserProfile({ address }: { address: string }) {
  const { name, avatar } = useENSProfile(address);

  return (
    <div>
      <img src={avatar} alt={name} />
      <span>{name}</span> {/* 显示 "vitalik.eth" 而非 "0x..." */}
    </div>
  );
}
```

**反向解析（地址 → ENS）**：
```typescript
// 在排行榜中显示 ENS 名称
function Leaderboard() {
  const { data: leaderboard } = useLeaderboard();

  return (
    <table>
      {leaderboard?.map((user) => (
        <tr key={user.id}>
          <td><ENSOrAddress address={user.id} /></td>
        </tr>
      ))}
    </table>
  );
}

function ENSOrAddress({ address }: { address: string }) {
  const { data: ensName } = useEnsName({ address });
  return <span>{ensName || `${address.slice(0, 6)}...`}</span>;
}
```

**学习要点**：
- ✅ ENS 原理（NameWrapper, Resolver）
- ✅ 正向/反向解析
- ✅ 子域名（achievements.your-project.eth）

---

### 7.2 Web3Auth（社交登录）

**用途**：用户无需安装 MetaMask，使用 Google/Twitter 登录

```bash
yarn add @web3auth/modal @web3auth/ethereum-provider
```

```typescript
// packages/nextjs/components/Web3AuthButton.tsx
import { Web3Auth } from "@web3auth/modal";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";

const web3auth = new Web3Auth({
  clientId: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID,
  chainConfig: {
    chainNamespace: "eip155",
    chainId: "0xaa36a7", // Sepolia
  },
});

export function Web3AuthButton() {
  const login = async () => {
    await web3auth.initModal();
    const provider = await web3auth.connect();
    // provider 可以与 Wagmi 集成
  };

  return <button onClick={login}>Login with Google</button>;
}
```

**学习要点**：
- ✅ 账户抽象（AA）
- ✅ MPC（多方计算）钱包
- ✅ 用户体验 vs 去中心化权衡

---

### 7.3 Safe{Wallet}（多签钱包）

**用途**：项目金库、治理执行

**集成场景**：将质押池的 Ownership 转移到 Safe

```typescript
// 创建 Safe（在 https://app.safe.global/ ）
// 添加多个签名者（如团队成员）

// 在合约中
await stakingPool.transferOwnership(SAFE_ADDRESS);

// 执行管理操作需要多签批准
// 1. 提议交易：setBaseRewardPerSecond(2e15)
// 2. 其他签名者批准
// 3. 达到阈值后执行
```

**学习要点**：
- ✅ 多签治理的必要性
- ✅ Safe 的模块化架构
- ✅ 与 DAO 的集成

---

## 8. 预言机与链外数据

### 8.1 Chainlink Price Feeds

**用途**：获取实时代币价格（如显示 USD 价值）

**集成**：
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract StakingPoolWithUSD is NFTStakingPool {
    AggregatorV3Interface internal priceFeed;

    constructor(address _priceFeed) {
        priceFeed = AggregatorV3Interface(_priceFeed);
    }

    // 获取奖励的 USD 价值
    function getRewardsInUSD(uint256 tokenId) public view returns (uint256) {
        uint256 rewardTokens = calculateRewards(tokenId);

        (, int256 price, , , ) = priceFeed.latestRoundData();
        // price 精度为 8 位小数

        return (rewardTokens * uint256(price)) / 1e8;
    }
}
```

**前端显示**：
```typescript
// 实时显示 USD 价值
function RewardDisplay({ tokenId }: { tokenId: bigint }) {
  const { data: rewardsInToken } = useScaffoldReadContract({
    contractName: "NFTStakingPool",
    functionName: "calculateRewards",
    args: [tokenId],
  });

  const { data: rewardsInUSD } = useScaffoldReadContract({
    contractName: "NFTStakingPool",
    functionName: "getRewardsInUSD",
    args: [tokenId],
  });

  return (
    <div>
      <p>{formatEther(rewardsInToken)} RWRD</p>
      <p className="text-sm text-gray-500">${formatUnits(rewardsInUSD, 8)} USD</p>
    </div>
  );
}
```

**学习要点**：
- ✅ 预言机的作用
- ✅ 数据精度（decimals）
- ✅ 安全考虑（价格操纵）

---

### 8.2 Chainlink VRF（可验证随机数）

**用途**：公平的稀有度抽取（铸造时随机分配）

```solidity
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";

contract RandomStakableNFT is VRFConsumerBaseV2 {
    VRFCoordinatorV2Interface COORDINATOR;
    uint64 s_subscriptionId;

    mapping(uint256 => address) public requestIdToSender;

    function mintRandom(address to, string memory uri) external {
        // 请求随机数
        uint256 requestId = COORDINATOR.requestRandomWords(
            keyHash,
            s_subscriptionId,
            3, // confirmations
            100000, // callbackGasLimit
            1 // numWords
        );

        requestIdToSender[requestId] = to;
    }

    // Chainlink 回调
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        address to = requestIdToSender[requestId];

        // 根据随机数分配稀有度
        uint256 roll = randomWords[0] % 100;
        Rarity rarity;

        if (roll < 50) rarity = Rarity.Common;      // 50%
        else if (roll < 80) rarity = Rarity.Rare;   // 30%
        else if (roll < 95) rarity = Rarity.Epic;   // 15%
        else rarity = Rarity.Legendary;             // 5%

        _mint(to, rarity);
    }
}
```

**学习要点**：
- ✅ 链上随机数的挑战
- ✅ VRF 的可验证性
- ✅ 请求-回调模式

---

## 9. 治理与 DAO 工具

### 9.1 Snapshot（链外投票）

**用途**：节省 Gas 的链外投票（投票结果链上执行）

**集成流程**：
1. 在 Snapshot.org 创建空间
2. 设置投票策略（基于成就 NFT 余额）
3. 发起提案

**自定义投票策略**：
```javascript
// snapshot-strategy.js
export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  // 读取每个地址的成就 NFT 投票权
  const multi = new Multicaller(network, provider, AchievementNFTABI, { blockTag });

  addresses.forEach((address) => {
    multi.call(address, options.address, 'getVotingPower', [address]);
  });

  const result = await multi.execute();

  return Object.fromEntries(
    Object.entries(result).map(([address, votingPower]) => [
      address,
      parseFloat(votingPower.toString()),
    ])
  );
}
```

**学习要点**：
- ✅ 链上 vs 链外投票
- ✅ Snapshot 的安全性
- ✅ 自定义投票策略

---

### 9.2 Tally（DAO 治理界面）

**用途**：为 Governor 合约提供 UI

**集成步骤**：
1. 部署 Governor 合约后在 Tally 注册
2. 用户可在 Tally.xyz 上：
   - 创建提案
   - 投票
   - 查看提案历史

**深度集成（API）**：
```typescript
// 获取提案列表
const TALLY_API = "https://api.tally.xyz/query";

async function getProposals(governorAddress: string) {
  const query = `
    query Proposals($governor: Address!) {
      proposals(governorId: $governor) {
        id
        title
        description
        status
        votes {
          for
          against
          abstain
        }
      }
    }
  `;

  const response = await fetch(TALLY_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      variables: { governor: governorAddress },
    }),
  });

  return response.json();
}
```

---

## 10. NFT 生态

### 10.1 OpenSea（市场集成）

**用途**：让你的 NFT 在 OpenSea 可见

**要求**：
1. 合约实现 ERC721 标准 ✅
2. tokenURI 返回符合标准的 JSON ✅
3. 合约在 Etherscan 验证 ✅

**元数据增强**（OpenSea 特定字段）：
```json
{
  "name": "Stakable NFT #1",
  "description": "...",
  "image": "ipfs://...",
  "external_url": "https://your-app.com/nft/1",
  "attributes": [...],
  "background_color": "000000",
  "animation_url": "ipfs://animation.mp4"
}
```

**OpenSea API**（读取 Listing 信息）：
```typescript
const OPENSEA_API = "https://api.opensea.io/api/v2";

async function getNFTListings(contractAddress: string, tokenId: string) {
  const response = await fetch(
    `${OPENSEA_API}/chain/sepolia/contract/${contractAddress}/nfts/${tokenId}/listings`,
    {
      headers: {
        "X-API-KEY": process.env.OPENSEA_API_KEY,
      },
    }
  );
  return response.json();
}
```

**学习要点**：
- ✅ NFT 市场标准
- ✅ 版税（EIP-2981）
- ✅ Collection 元数据

---

### 10.2 Reservoir（聚合市场数据）

**用途**：一个 API 查询多个 NFT 市场

```typescript
import { createClient } from "@reservoir0x/reservoir-sdk";

const client = createClient({
  chains: [{ id: 11155111, baseApiUrl: "https://api-sepolia.reservoir.tools" }],
  apiKey: process.env.RESERVOIR_API_KEY,
});

// 获取地板价
async function getFloorPrice(contractAddress: string) {
  const collection = await client.actions.getCollection({
    collection: contractAddress,
  });
  return collection.floorAsk?.price?.amount?.native;
}

// 获取 NFT 活动（所有市场）
async function getNFTActivity(contractAddress: string, tokenId: string) {
  const activities = await client.actions.getTokenActivity({
    contract: contractAddress,
    tokenId,
  });
  return activities; // 包含 OpenSea, Blur, LooksRare 等交易
}
```

---

## 11. 监控与分析

### 11.1 Dune Analytics（数据看板）

**用途**：创建公开的数据看板

**创建查询**：
```sql
-- 质押池 TVL 历史
SELECT
    DATE_TRUNC('day', evt_block_time) as date,
    COUNT(*) as total_staked
FROM nft_staking_pool_sepolia.NFTStakingPool_evt_Staked
GROUP BY date
ORDER BY date DESC
```

**嵌入到前端**：
```tsx
function DuneEmbedDashboard() {
  return (
    <iframe
      src="https://dune.com/embeds/your-dashboard-id"
      width="100%"
      height="600"
    />
  );
}
```

---

### 11.2 Blocknative（Mempool 监控）

**用途**：实时监控待处理交易

```typescript
import Blocknative from "bnc-sdk";

const blocknative = new Blocknative({
  dappId: process.env.NEXT_PUBLIC_BLOCKNATIVE_KEY,
  networkId: 11155111,
});

// 监控用户交易
const { emitter } = blocknative.transaction({
  hash: txHash,
});

emitter.on("txSpeedUp", (tx) => {
  console.log("Transaction sped up:", tx);
});

emitter.on("txConfirmed", (tx) => {
  console.log("Transaction confirmed:", tx);
});
```

---

## 12. 测试网资源

### 12.1 Faucets（获取测试币）

**Sepolia ETH**：
- Alchemy Faucet: https://sepoliafaucet.com/
- Infura Faucet: https://www.infura.io/faucet/sepolia
- Chainlink Faucet: https://faucets.chain.link/sepolia

**多链水龙头**：
- Paradigm MultiFaucet: https://faucet.paradigm.xyz/

### 12.2 测试网 NFT 市场

- **OpenSea Testnet**: https://testnets.opensea.io/
- **Rarible Testnet**: https://testnet.rarible.com/

---

## 📊 集成优先级建议

根据学习价值与项目实用性，推荐集成顺序：

### 第一优先级（必须）
1. ✅ **Alchemy** - RPC + NFT API
2. ✅ **Etherscan** - 合约验证
3. ✅ **Pinata/Web3.Storage** - IPFS 固定
4. ✅ **Hardhat Gas Reporter** - Gas 优化

### 第二优先级（强烈推荐）
5. ✅ **Tenderly** - 调试与监控
6. ✅ **Slither** - 安全审计
7. ✅ **ENS** - 用户体验
8. ✅ **OpenSea** - NFT 可见性

### 第三优先级（提升项）
9. ✅ **OpenZeppelin Defender** - 运行时安全
10. ✅ **Chainlink Price Feeds** - USD 价格
11. ✅ **The Graph** - 去中心化索引
12. ✅ **Snapshot** - 链外投票

### 第四优先级（高级特性）
13. ✅ **Gelato/Chainlink Automation** - 自动化
14. ✅ **Chainlink VRF** - 随机性
15. ✅ **Web3Auth** - 社交登录
16. ✅ **Arweave** - 永久存储

---

## 🎓 学习路径

### Week 1-2（基础设施）
- 配置 Alchemy RPC
- 使用 Etherscan 验证合约
- 上传文件到 Pinata
- 集成 Hardhat Gas Reporter

### Week 3-4（开发工具）
- 使用 Tenderly 调试交易
- 运行 Slither 审计
- 添加 ENS 显示

### Week 5-6（高级特性）
- 集成 Chainlink Price Feeds
- 尝试 The Graph（对比 Ponder）
- 设置 Snapshot 空间

### Week 7（自动化与优化）
- 配置 OpenZeppelin Defender
- 实现 Gelato 自动化
- 创建 Dune 分析看板

---

## 📚 相关文档链接

### 官方文档
- [Alchemy Docs](https://docs.alchemy.com/)
- [Tenderly Docs](https://docs.tenderly.co/)
- [Chainlink Docs](https://docs.chain.link/)
- [The Graph Docs](https://thegraph.com/docs/)
- [OpenZeppelin Defender](https://docs.openzeppelin.com/defender/)
- [Pinata Docs](https://docs.pinata.cloud/)
- [ENS Docs](https://docs.ens.domains/)

### 教程
- [Alchemy University](https://university.alchemy.com/)
- [Chainlink Learning Path](https://chain.link/education-hub)
- [Patrick Collins YouTube](https://www.youtube.com/c/PatrickCollins)

---

**总结**：通过逐步集成这些工具，你将获得全面的 Web3 生态经验，从基础设施到高级自动化，从安全审计到用户体验优化。建议先完成核心功能，再逐个添加周边工具，每个工具都提供独特的学习价值。

**下一步**：选择 3-5 个你最感兴趣的工具，我可以帮你制定详细的集成计划！
