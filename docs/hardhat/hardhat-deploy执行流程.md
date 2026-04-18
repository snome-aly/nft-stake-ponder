# hardhat deploy 子进程执行流程详解

## ❓ 问题

在 `runHardhatDeployWithPK.ts` 中启动的子进程：

```typescript
const hardhat = spawn("hardhat", ["deploy", ...process.argv.slice(2)], {
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32"
});
```

这个子进程具体执行的是什么？是去执行 `packages/hardhat/deploy` 下对应的 ts 脚本吗？

## ✅ 答案：是的！

**子进程执行 `hardhat deploy` 命令，该命令会自动运行 `deploy/` 目录下的所有部署脚本。**

## 🔄 完整执行流程

### 1. 用户执行命令

```bash
yarn deploy --network sepolia
```

### 2. package.json 中的脚本定义

```json
{
  "scripts": {
    "deploy": "tsx scripts/runHardhatDeployWithPK.ts"
  }
}
```

### 3. runHardhatDeployWithPK.ts 执行

```typescript
// 1. 解析命令行参数
const networkName = "--network sepolia";

// 2. 解密私钥
const wallet = await Wallet.fromEncryptedJson(encryptedKey, pass);

// 3. 设置环境变量
process.env.__RUNTIME_DEPLOYER_PRIVATE_KEY = wallet.privateKey;

// 4. 启动子进程执行 hardhat deploy
const hardhat = spawn("hardhat", ["deploy", "--network", "sepolia"], {
  stdio: "inherit",
  env: process.env  // 包含解密后的私钥
});
```

### 4. hardhat deploy 命令执行

```
hardhat deploy 命令由 hardhat-deploy 插件提供
    ↓
自动扫描 packages/hardhat/deploy/ 目录
    ↓
按文件名顺序执行所有 .ts 和 .js 文件
```

### 5. deploy/ 目录结构

```
packages/hardhat/deploy/
├── 00_deploy_your_contract.ts    ← 首先执行（00 开头）
├── 01_deploy_nft_staking.ts      ← 然后执行（01 开头）
└── 02_setup_contracts.ts         ← 最后执行（02 开头）
```

**文件名的数字前缀决定执行顺序！**

### 6. 单个部署脚本的执行

以 `00_deploy_your_contract.ts` 为例：

```typescript
// 1. 导出一个 DeployFunction
const deployYourContract: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {

  // 2. 获取部署账户（从 hardhat.config.ts 中读取）
  const { deployer } = await hre.getNamedAccounts();
  // deployer 地址来自：解密后的私钥 → 钱包地址

  // 3. 获取 deploy 函数
  const { deploy } = hre.deployments;

  // 4. 部署合约
  await deploy("YourContract", {
    from: deployer,           // 使用解密后的账户
    args: [deployer],         // 构造函数参数
    log: true,                // 打印日志
    autoMine: true,           // 本地网络自动挖矿
  });

  // 5. 获取已部署的合约实例
  const yourContract = await hre.ethers.getContract("YourContract", deployer);

  // 6. 与合约交互（可选）
  console.log("👋 Initial greeting:", await yourContract.greeting());
};

export default deployYourContract;

// 7. 标签（可选，用于选择性部署）
deployYourContract.tags = ["YourContract"];
```

### 7. hardhat-deploy 插件的工作

```typescript
// hardhat-deploy 插件会：

// 1. 读取所有部署脚本
const scripts = [
  "00_deploy_your_contract.ts",
  "01_deploy_nft_staking.ts",
  // ...
];

// 2. 按顺序执行
for (const script of scripts) {
  const deployFunction = require(script).default;
  await deployFunction(hre); // 传入 HardhatRuntimeEnvironment
}

// 3. 保存部署信息
// 每个合约部署后，会生成一个 JSON 文件：
// deployments/sepolia/YourContract.json
```

### 8. 部署信息保存

```
deployments/
├── sepolia/
│   ├── .chainId              ← 链 ID（11155111）
│   ├── YourContract.json     ← 合约地址、ABI、部署信息
│   └── NFTStaking.json
└── hardhat/
    ├── .chainId              ← 链 ID（31337）
    └── YourContract.json
```

每个 JSON 文件包含：

```json
{
  "address": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  "abi": [ /* 完整的 ABI */ ],
  "transactionHash": "0x...",
  "receipt": {
    "blockNumber": 1,
    "gasUsed": "123456"
  },
  "metadata": "{ /* 编译元数据 */ }",
  "args": ["0x..."],  // 构造函数参数
  "bytecode": "0x...",
  "deployedBytecode": "0x..."
}
```

### 9. 部署后自动执行 generateTsAbis

在 `hardhat.config.ts` 中配置：

```typescript
import generateTsAbis from "./scripts/generateTsAbis";

// 扩展 deploy 任务
subtask("deploy:after").setAction(async (_, hre) => {
  await generateTsAbis(hre);
});
```

执行流程：

```
hardhat deploy 完成
    ↓
触发 deploy:after 钩子
    ↓
执行 generateTsAbis.ts
    ↓
读取 deployments/sepolia/*.json
    ↓
生成 packages/nextjs/contracts/deployedContracts.ts
```

## 📊 完整流程图

```
用户执行: yarn deploy --network sepolia
    ↓
运行: tsx scripts/runHardhatDeployWithPK.ts
    ↓
1. 解析参数: --network sepolia
    ↓
2. 提示输入密码
    ↓
3. 解密私钥: Wallet.fromEncryptedJson()
    ↓
4. 设置环境变量: process.env.__RUNTIME_DEPLOYER_PRIVATE_KEY
    ↓
5. 启动子进程: spawn("hardhat", ["deploy", "--network", "sepolia"])
    ↓
6. hardhat-deploy 插件扫描 deploy/ 目录
    ↓
7. 按顺序执行部署脚本:
    ├── 00_deploy_your_contract.ts
    │     ↓
    │   部署 YourContract
    │     ↓
    │   保存到 deployments/sepolia/YourContract.json
    │
    ├── 01_deploy_nft_staking.ts（如果有）
    │     ↓
    │   部署 NFTStaking
    │     ↓
    │   保存到 deployments/sepolia/NFTStaking.json
    │
    └── ... 更多脚本
    ↓
8. 触发 deploy:after 钩子
    ↓
9. 执行 generateTsAbis.ts
    ↓
10. 读取 deployments/sepolia/*.json
    ↓
11. 生成 packages/nextjs/contracts/deployedContracts.ts
    ↓
12. 子进程退出
    ↓
13. runHardhatDeployWithPK.ts 检测到退出
    ↓
14. 打印 "✅ Deployment completed" 或 "❌ Deployment failed"
    ↓
15. 父进程退出（环境变量自动清理）
```

## 💡 关键要点

### 1. deploy/ 目录是约定位置

```typescript
// hardhat-deploy 插件会自动查找：
packages/hardhat/deploy/

// 可以在 hardhat.config.ts 中自定义：
paths: {
  deploy: "./custom-deploy-scripts"
}
```

### 2. 文件名顺序很重要

```
00_deploy_token.ts      ← 先部署 Token
01_deploy_staking.ts    ← 再部署 Staking（可能依赖 Token）
02_setup_roles.ts       ← 最后设置权限
```

### 3. DeployFunction 类型

```typescript
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployFunc: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  // hre 包含：
  // - hre.deployments.deploy()  - 部署合约
  // - hre.ethers.getContract()  - 获取合约实例
  // - hre.getNamedAccounts()    - 获取命名账户
  // - hre.network               - 当前网络信息
};

export default deployFunc;
```

### 4. 选择性部署（使用 tags）

```typescript
// 在部署脚本中定义标签
deployYourContract.tags = ["YourContract", "core"];

// 只部署特定标签
yarn deploy --tags YourContract
yarn deploy --tags core

// 排除特定标签
yarn deploy --tags-exclude test
```

### 5. 部署依赖关系

```typescript
// 在 01_deploy_staking.ts 中
const deployStaking: DeployFunction = async function (hre) {
  // 等待 YourContract 部署完成
  const yourContract = await hre.deployments.get("YourContract");

  await deploy("Staking", {
    from: deployer,
    args: [yourContract.address],  // 使用已部署合约的地址
  });
};

// 声明依赖关系
deployStaking.dependencies = ["YourContract"];  // 必须先执行 00_deploy_your_contract.ts
```

### 6. 环境变量的传递

```typescript
// runHardhatDeployWithPK.ts (父进程)
process.env.__RUNTIME_DEPLOYER_PRIVATE_KEY = wallet.privateKey;

spawn("hardhat", ["deploy"], {
  env: process.env  // ← 将环境变量传递给子进程
});

// hardhat.config.ts (子进程)
const deployerPrivateKey = process.env.__RUNTIME_DEPLOYER_PRIVATE_KEY;
// ↑ 子进程可以读取父进程设置的环境变量

// 部署脚本 (在子进程中运行)
const { deployer } = await hre.getNamedAccounts();
// ↑ deployer 地址来自 deployerPrivateKey 对应的钱包
```

## 🎓 实际示例

### 示例 1：部署单个合约

```typescript
// deploy/00_deploy_your_contract.ts
const deployYourContract: DeployFunction = async function (hre) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("YourContract", {
    from: deployer,
    args: [deployer],
    log: true,
  });
};

export default deployYourContract;
```

执行：
```bash
yarn deploy
# 输出：
# 📍 Deploying to localhost network...
# deploying "YourContract" (tx: 0x...)
# ✅ YourContract deployed at 0x5FbDB...
# 👋 Initial greeting: Building Unstoppable Apps!!!
```

### 示例 2：部署多个合约（有依赖）

```typescript
// deploy/01_deploy_staking.ts
const deployStaking: DeployFunction = async function (hre) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // 获取已部署的 YourContract 地址
  const yourContract = await hre.deployments.get("YourContract");

  await deploy("NFTStaking", {
    from: deployer,
    args: [yourContract.address],  // 传入依赖合约的地址
    log: true,
  });
};

export default deployStaking;
deployStaking.tags = ["NFTStaking"];
deployStaking.dependencies = ["YourContract"];  // 声明依赖
```

### 示例 3：部署后初始化

```typescript
// deploy/02_initialize.ts
const initialize: DeployFunction = async function (hre) {
  const { deployer } = await hre.getNamedAccounts();

  // 获取已部署的合约
  const staking = await hre.ethers.getContract("NFTStaking", deployer);

  // 执行初始化操作
  const tx = await staking.setRewardRate(100);
  await tx.wait();

  console.log("✅ Initialized with reward rate: 100");
};

export default initialize;
initialize.tags = ["Initialize"];
initialize.dependencies = ["NFTStaking"];
```

## 📚 总结

### 子进程执行的是什么？

| 步骤 | 内容 |
|------|------|
| 1️⃣ | 执行 `hardhat deploy` 命令 |
| 2️⃣ | hardhat-deploy 插件扫描 `deploy/` 目录 |
| 3️⃣ | 按文件名顺序（00, 01, 02...）执行所有 `.ts` 脚本 |
| 4️⃣ | 每个脚本部署一个或多个合约 |
| 5️⃣ | 部署信息保存到 `deployments/网络名/*.json` |
| 6️⃣ | 触发 `deploy:after` 钩子 |
| 7️⃣ | 执行 `generateTsAbis.ts` 生成前端类型 |
| 8️⃣ | 子进程退出，环境变量自动清理 |

### 为什么要用子进程？

1. **安全性**：私钥只在子进程生命周期内存在
2. **隔离性**：部署逻辑独立，不影响父进程
3. **灵活性**：可以传递任意命令行参数
4. **标准化**：使用 hardhat-deploy 的标准流程

### 相关文件

```
packages/hardhat/
├── scripts/
│   ├── runHardhatDeployWithPK.ts    ← 启动子进程
│   └── generateTsAbis.ts            ← 生成前端类型
├── deploy/
│   └── 00_deploy_your_contract.ts   ← 部署脚本（子进程执行）
├── deployments/
│   ├── sepolia/
│   │   └── YourContract.json        ← 部署结果
│   └── hardhat/
│       └── YourContract.json
└── hardhat.config.ts                ← 配置文件（定义 deploy:after 钩子）
```
