# Hardhat 部署脚本学习笔记

> 本笔记总结了 Hardhat Deploy 的核心概念、工作原理和最佳实践

---

## 📚 目录

1. [部署脚本的三种方式](#1-部署脚本的三种方式)
2. [Hardhat Deploy 的核心机制](#2-hardhat-deploy-的核心机制)
3. [状态保存与幂等性](#3-状态保存与幂等性)
4. [幂等性陷阱与解决方案](#4-幂等性陷阱与解决方案)
5. [deploy/ vs scripts/ 目录规划](#5-deploy-vs-scripts-目录规划)
6. [实战：单文件 vs 多文件策略](#6-实战单文件-vs-多文件策略)
7. [代码示例](#7-代码示例)
8. [常用命令](#8-常用命令)

---

## 1. 部署脚本的三种方式

### 1.1 Hardhat Deploy（本项目使用 ✅）

```typescript
// deploy/00_deploy_contract.ts
import { DeployFunction } from "hardhat-deploy/types";

const deployFunc: DeployFunction = async (hre) => {
  const { deploy } = hre.deployments;
  const { deployer } = await hre.getNamedAccounts();

  await deploy("MyContract", {
    from: deployer,
    args: [arg1, arg2],
    log: true,
  });
};

export default deployFunc;
deployFunc.tags = ["MyContract"];
```

**特点：**
- ✅ 自动幂等性检查
- ✅ 自动状态管理
- ✅ 支持多网络部署
- ✅ 自动生成前端类型

### 1.2 Hardhat Scripts（传统方式）

```typescript
// scripts/deploy.ts
async function main() {
  const Contract = await ethers.getContractFactory("MyContract");
  const contract = await Contract.deploy(arg1, arg2);
  console.log("Deployed to:", await contract.getAddress());
}

main().catch(console.error);
```

**特点：**
- ⚠️ 无自动幂等性
- ⚠️ 需手动管理状态
- ✅ 完全灵活

### 1.3 Hardhat Ignition（新推出）

- 模块化部署
- 更强类型安全
- 适合复杂部署流程

---

## 2. Hardhat Deploy 的核心机制

### 2.1 工作流程

```
执行 yarn deploy
    ↓
遍历 deploy/ 目录（按文件名排序）
    ↓
对每个部署脚本：
    ├─ 检查 deployments/{network}/Contract.json
    ├─ 对比参数和代码哈希
    ├─ 相同 → 跳过部署
    └─ 不同 → 执行部署 → 保存记录
```

### 2.2 文件命名规则

```
deploy/
├── 00_deploy_libraries.ts      # 先执行
├── 01_deploy_token.ts          # 其次
├── 10_deploy_nft.ts            # 核心合约
├── 50_setup_config.ts          # 配置
└── 99_verify.ts                # 最后执行
```

**规则：** 按数字前缀排序执行

### 2.3 依赖管理

```typescript
deployFunc.tags = ["NFT"];
deployFunc.dependencies = ["Token"];  // 必须先部署 Token
```

---

## 3. 状态保存与幂等性

### 3.1 部署记录文件

```
deployments/
├── localhost/
│   ├── .chainId              # 31337
│   └── StakableNFT.json      # 部署记录
├── sepolia/
│   ├── .chainId              # 11155111
│   └── StakableNFT.json
└── mainnet/
    └── StakableNFT.json
```

### 3.2 部署记录内容

```json
{
  "address": "0x5FbDB2...",              // 合约地址
  "args": ["Stakable NFT", "SNFT"],      // 🔑 构造参数
  "solcInputHash": "ea5e765f...",        // 🔑 代码哈希
  "transactionHash": "0x8ec9ba16...",
  "numDeployments": 1,
  "abi": [ /* ... */ ]
}
```

### 3.3 幂等性检查

```typescript
// hardhat-deploy 内部逻辑
if (existingDeployment) {
  const argsChanged = !isEqual(存储的 args, 当前 args);
  const codeChanged = 存储的哈希 !== 当前哈希;

  if (!argsChanged && !codeChanged) {
    return existingDeployment;  // ✅ 跳过部署
  }
}

// 执行新部署
const newDeployment = await actuallyDeploy();
await saveDeploymentFile(newDeployment);
```

### 3.4 实际效果

```bash
# 第一次
$ yarn deploy
📦 部署 StakableNFT...
✅ 部署在 0x5FbDB2... (Gas: 532743)

# 第二次（无修改）
$ yarn deploy
⏭️  重用现有部署 at 0x5FbDB2...
```

---

## 4. 幂等性陷阱与解决方案

### 4.1 核心问题 ⚠️

> **hardhat-deploy 的幂等性只针对 `deploy()` 函数，不包括之后的代码！**

### 4.2 问题演示

```typescript
const deployFunc: DeployFunction = async (hre) => {
  // ✅ 这部分有幂等性（会自动跳过）
  await deploy("StakableNFT", {
    from: deployer,
    args: ["NFT", "NFT"],
  });

  // ❌ 问题：这部分每次都执行！
  const nft = await ethers.getContract("StakableNFT");
  await nft.setRarityPool(pool);        // 第二次执行会报错
  await nft.grantRoleTo(ROLE, address); // 第二次执行浪费 gas
};
```

### 4.3 解决方案

#### ✅ 方案 1：手动检查状态（推荐）

```typescript
const deployFunc: DeployFunction = async (hre) => {
  await deploy("StakableNFT", { ... });

  const nft = await ethers.getContract("StakableNFT");

  // ✅ 检查状态后再执行
  const rarityPoolSet = await nft.rarityPoolSet();
  if (!rarityPoolSet) {
    await nft.setRarityPool(pool);
    console.log("✅ 稀有度池设置完成");
  } else {
    console.log("⏭️  稀有度池已设置");
  }

  // ✅ 检查角色
  const hasRole = await nft.hasRole(OPERATOR_ROLE, operator);
  if (!hasRole) {
    await nft.grantRoleTo(OPERATOR_ROLE, operator);
    console.log("✅ 角色授予完成");
  } else {
    console.log("⏭️  角色已存在");
  }
};
```

#### ⚡ 方案 2：使用 newlyDeployed 标志

```typescript
const deployment = await deploy("StakableNFT", { ... });

if (deployment.newlyDeployed) {
  // ✅ 只在新部署时执行
  const nft = await ethers.getContract("StakableNFT");
  await nft.setRarityPool(pool);
  await nft.grantRoleTo(ROLE, address);
} else {
  console.log("⏭️  使用现有部署，跳过初始化");
}
```

**注意：** 如果删除 `deployments/` 文件夹但链上合约仍存在，方案 2 会出问题。

#### 🎯 方案 3：拆分到独立文件

```
deploy/
├── 00_deploy_nft.ts       # 只负责部署
├── 01_setup_rarity.ts     # 设置稀有度池（带检查）
└── 02_setup_roles.ts      # 设置角色（带检查）
```

---

## 5. deploy/ vs scripts/ 目录规划

### 5.1 核心原则

```
操作性质？
    ↓
一次性 + 部署必需 → deploy/
    ↓
可重复 + 管理运营 → scripts/
```

### 5.2 详细对比

| 特性 | deploy/ | scripts/ |
|------|---------|----------|
| **执行方式** | `yarn deploy` | `yarn hardhat run` |
| **幂等性** | ✅ `deploy()` 自动 | ❌ 需手动实现 |
| **状态保存** | ✅ 自动 | ❌ 无 |
| **依赖管理** | ✅ 支持 | ❌ 无 |
| **灵活性** | ⚠️ 有限 | ✅ 完全自由 |
| **传参** | 环境变量 | 命令行/代码 |

### 5.3 适用场景

#### ✅ deploy/ 目录

**放这里的操作：**
- 部署合约
- 一次性初始化（如 setRarityPool）
- 初始角色配置
- 部署时必需的配置

**特征：**
- 只执行一次
- 部署后立即需要
- 有合约级别的防重复保护

#### ✅ scripts/ 目录

**放这里的操作：**
- 授予/撤销角色（运营中可能多次）
- 更新参数（可能调整）
- 暂停/恢复（应急操作）
- 定期提现
- 数据查询工具

**特征：**
- 可重复执行
- 需要传参
- 管理和运营性质

### 5.4 决策流程图

```
这个操作...
    ↓
只执行一次？
    ├─ 是 → 是部署必需的吗？
    │         ├─ 是 → deploy/ 同一文件
    │         └─ 否 → deploy/ 独立文件
    │
    └─ 否 → scripts/
```

---

## 6. 实战：单文件 vs 多文件策略

### 6.1 策略 A：单文件（推荐简单项目）✨

```
deploy/
└── 00_deploy_stakable_nft.ts  (部署 + 所有初始化)
```

**适合：**
- 初始化步骤 < 5 个
- 快速开发
- 团队规模小

**示例：**
```typescript
const deployFunc: DeployFunction = async (hre) => {
  // 1. 部署
  await deploy("StakableNFT", { ... });

  const nft = await ethers.getContract("StakableNFT");

  // 2. 设置稀有度池
  if (!(await nft.rarityPoolSet())) {
    await nft.setRarityPool(generateRarityPool(10));
  }

  // 3. 配置角色
  if (!(await nft.hasRole(OPERATOR_ROLE, operator))) {
    await nft.grantRoleTo(OPERATOR_ROLE, operator);
  }
};
```

### 6.2 策略 B：多文件（推荐复杂项目）🚀

```
deploy/
├── 00_deploy_stakable_nft.ts
├── 01_setup_rarity_pool.ts
└── 02_setup_initial_roles.ts
```

**适合：**
- 初始化步骤 > 5 个
- 生产环境
- 团队协作

**优点：**
- 关注点分离
- 可选择性执行：`yarn deploy --tags SetupRoles`
- 易于测试

---

## 7. 代码示例

### 7.1 完整的单文件部署脚本

```typescript
// deploy/00_deploy_stakable_nft.ts
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployFunc: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployer, operator, pauser } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🚀 部署 StakableNFT");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // ============ 1. 部署合约 ============
  console.log("\n📦 1. 部署合约");
  const deployment = await deploy("StakableNFT", {
    from: deployer,
    args: ["Stakable NFT", "SNFT"],
    log: true,
    autoMine: true,
  });

  if (deployment.newlyDeployed) {
    console.log(`  ✅ 新部署: ${deployment.address}`);
    console.log(`  Gas: ${deployment.receipt?.gasUsed}`);
  } else {
    console.log(`  ⏭️  重用: ${deployment.address}`);
  }

  const nft = await hre.ethers.getContract("StakableNFT", deployer);

  // ============ 2. 设置稀有度池 ============
  console.log("\n📦 2. 设置稀有度池");
  const rarityPoolSet = await nft.rarityPoolSet();

  if (!rarityPoolSet) {
    console.log("  🔧 生成并设置稀有度池...");
    const rarityPool = generateRarityPool(10);
    const tx = await nft.setRarityPool(rarityPool);
    await tx.wait();
    console.log("  ✅ 完成");
  } else {
    console.log("  ⏭️  已设置，跳过");
  }

  // ============ 3. 配置角色 ============
  console.log("\n🔑 3. 配置角色");
  const OPERATOR_ROLE = await nft.OPERATOR_ROLE();
  const PAUSER_ROLE = await nft.PAUSER_ROLE();

  // OPERATOR
  const hasOperator = await nft.hasRole(OPERATOR_ROLE, operator);
  if (!hasOperator) {
    console.log(`  🔧 授予 OPERATOR → ${operator}`);
    await (await nft.grantRoleTo(OPERATOR_ROLE, operator)).wait();
    console.log("  ✅ 完成");
  } else {
    console.log(`  ⏭️  OPERATOR 已配置`);
  }

  // PAUSER
  const hasPauser = await nft.hasRole(PAUSER_ROLE, pauser);
  if (!hasPauser) {
    console.log(`  🔧 授予 PAUSER → ${pauser}`);
    await (await nft.grantRoleTo(PAUSER_ROLE, pauser)).wait();
    console.log("  ✅ 完成");
  } else {
    console.log(`  ⏭️  PAUSER 已配置`);
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅ 所有设置完成");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
};

export default deployFunc;
deployFunc.tags = ["StakableNFT"];

// 工具函数
function generateRarityPool(maxSupply: number): number[] {
  // 实现稀有度池生成逻辑
  return [];
}
```

### 7.2 管理脚本示例

```typescript
// scripts/management/grantRole.ts
import { ethers } from "hardhat";

/**
 * 授予角色
 *
 * 用法:
 * ADDRESS=0x123... ROLE=OPERATOR yarn hardhat run scripts/management/grantRole.ts --network sepolia
 */
async function main() {
  const address = process.env.ADDRESS;
  const roleName = process.env.ROLE || "OPERATOR";

  if (!address) {
    throw new Error("❌ 请提供 ADDRESS 环境变量");
  }

  console.log(`🔑 授予 ${roleName} 角色给 ${address}...`);

  const nft = await ethers.getContract("StakableNFT");
  const role = await nft[`${roleName}_ROLE`]();

  // 检查是否已有角色
  const hasRole = await nft.hasRole(role, address);
  if (hasRole) {
    console.log("⏭️  角色已存在");
    return;
  }

  // 授予角色
  const tx = await nft.grantRoleTo(role, address);
  console.log(`⏳ 交易已发送: ${tx.hash}`);

  await tx.wait();
  console.log("✅ 角色授予完成");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

### 7.3 hardhat.config.ts 命名账户配置

```typescript
// hardhat.config.ts
export default {
  // ...其他配置

  namedAccounts: {
    deployer: {
      default: 0,                          // 默认使用账户 0
      mainnet: "0x742d35Cc663...",        // 主网使用特定地址
    },
    operator: {
      default: 1,                          // 默认使用账户 1
      mainnet: "0x123...",
    },
    pauser: {
      default: 2,
      mainnet: "0x456...",
    },
  },
};
```

---

## 8. 常用命令

### 8.1 部署相关

```bash
# 部署到 localhost（默认）
yarn deploy

# 部署到 sepolia 测试网
yarn deploy --network sepolia

# 只执行特定标签
yarn deploy --tags StakableNFT

# 强制重新部署（删除状态后部署）
rm -rf deployments/localhost/ && yarn deploy

# 查看已部署的合约
yarn hardhat deployments
```

### 8.2 Scripts 执行

```bash
# 运行脚本
yarn hardhat run scripts/management/grantRole.ts --network sepolia

# 带参数运行
ADDRESS=0x123... ROLE=OPERATOR yarn hardhat run scripts/management/grantRole.ts

# 本地测试脚本
yarn hardhat run scripts/queryInfo.ts
```

### 8.3 状态管理

```bash
# 查看部署地址
cat deployments/localhost/StakableNFT.json | grep '"address"'

# 查看构造参数
cat deployments/localhost/StakableNFT.json | grep '"args"'

# 清理本地部署
rm -rf deployments/localhost/

# 清理所有网络部署
rm -rf deployments/
```

### 8.4 验证合约

```bash
# Etherscan 验证
yarn hardhat:verify --network sepolia

# 使用 hardhat-deploy 验证
yarn deploy --network sepolia --tags StakableNFT
yarn hardhat etherscan-verify --network sepolia
```

---

## 💡 最佳实践总结

### 1. 幂等性检查 ✅
```typescript
// ✅ 正确
if (!(await nft.rarityPoolSet())) {
  await nft.setRarityPool(pool);
}

// ❌ 错误
await nft.setRarityPool(pool);  // 第二次会报错
```

### 2. 合理组织文件 ✅
```
deploy/
└── 00_deploy_stakable_nft.ts    # 简单项目：一个文件
    或
├── 00_deploy_stakable_nft.ts    # 复杂项目：拆分文件
├── 01_setup_rarity_pool.ts
└── 02_setup_initial_roles.ts

scripts/
├── management/                  # 管理操作
└── operations/                  # 运营操作
```

### 3. 使用依赖管理 ✅
```typescript
deployFunc.tags = ["StakableNFT"];
deployFunc.dependencies = ["Token"];  // 确保顺序
```

### 4. 日志清晰 ✅
```typescript
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("🚀 部署 StakableNFT");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

console.log("\n📦 1. 部署合约");
console.log("  ✅ 新部署: 0x123...");
console.log("  ⏭️  重用现有部署");
```

### 5. 环境隔离 ✅
```typescript
const isDev = hre.network.name === "localhost";
const isProd = hre.network.name === "mainnet";

if (isDev) {
  // 开发环境特殊处理
}
```

---

## 🎯 核心要点速记

1. **幂等性原则**
   > `deploy()` 有幂等性，其他代码需要自己实现

2. **目录规划**
   > 一次性 + 必需 → deploy/
   > 可重复 + 管理 → scripts/

3. **状态检查**
   > 初始化操作前必须检查状态

4. **单文件 vs 多文件**
   > 简单项目 → 单文件
   > 复杂项目 → 多文件

5. **命名账户**
   > 使用 namedAccounts 替代 accounts[0]

---

## 📚 相关文档

- [Hardhat Deploy 官方文档](https://github.com/wighawag/hardhat-deploy)
- [Hardhat 部署教程](https://hardhat.org/hardhat-runner/docs/guides/deploying)
- 项目中的其他文档：
  - `HOW_DEPLOY_WORKS.md` - 详细工作原理
  - `DEPLOY_IDEMPOTENCY_TRAP.md` - 幂等性陷阱详解
  - `DEPLOY_ORGANIZATION_STRATEGY.md` - 组织策略详解

---

**最后更新：** 2025-01-05
**适用项目：** Scaffold-ETH 2 + Hardhat Deploy
