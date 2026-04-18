# Hardhat 任务系统详解

## 🎯 什么是 Hardhat 任务？

Hardhat 任务（Task）是可以通过命令行调用的脚本，类似于 npm scripts，但更强大。

## 📊 任务触发方式对比

### 方式 1: 手动调用（最常见）

```bash
# 格式
yarn hardhat <taskName> [参数] [选项]

# 实际例子
yarn hardhat balance --account 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
yarn hardhat deploy --network sepolia
yarn hardhat test
```

### 方式 2: 在代码中调用

```typescript
// 在其他任务或脚本中调用
await hre.run("balance", {
  account: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
});
```

### 方式 3: 扩展现有任务（自动触发）

```typescript
// 在 hardhat.config.ts 中
task("deploy").setAction(async (args, hre, runSuper) => {
  await runSuper(args);  // 先执行原始 deploy
  // 👆 当你运行 yarn deploy 时，这里的代码会自动执行
  await generateTsAbis(hre);
});
```

## 🔍 详细示例解析

### 示例 1: 简单的账户余额查询

```typescript
// hardhat.config.ts

task("balance", "Prints an account's balance")
  .addParam("account", "The account's address")
  .setAction(async (taskArgs, hre) => {
    const balance = await hre.ethers.provider.getBalance(taskArgs.account);
    console.log(hre.ethers.formatEther(balance), "ETH");
  });
```

**触发方式：**
```bash
yarn hardhat balance --account 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

# 输出：
# 10.5 ETH
```

**执行流程：**
```
1. 用户输入命令
   ↓
2. Hardhat 解析命令行参数
   - taskName = "balance"
   - account = "0x742d35..."
   ↓
3. 查找名为 "balance" 的任务
   ↓
4. 执行 setAction 中的函数
   - taskArgs.account = "0x742d35..."
   - hre = Hardhat Runtime Environment
   ↓
5. 输出结果
```

### 示例 2: 带可选参数的任务

```typescript
task("deploy-all", "Deploy all contracts")
  .addOptionalParam("reset", "Reset deployments", false, types.boolean)
  .setAction(async (taskArgs, hre) => {
    if (taskArgs.reset) {
      console.log("🔄 Resetting deployments...");
      // 清理旧部署
    }
    await hre.run("deploy");
  });
```

**触发方式：**
```bash
# 不重置
yarn hardhat deploy-all

# 重置后部署
yarn hardhat deploy-all --reset
```

### 示例 3: 不需要参数的任务

```typescript
task("network-info", "Show network information")
  .setAction(async (_, hre) => {
    const network = await hre.ethers.provider.getNetwork();
    const blockNumber = await hre.ethers.provider.getBlockNumber();

    console.log("Network:", network.name);
    console.log("Chain ID:", network.chainId);
    console.log("Block Number:", blockNumber);
  });
```

**触发方式：**
```bash
yarn hardhat network-info

# 输出：
# Network: sepolia
# Chain ID: 11155111
# Block Number: 4567890
```

### 示例 4: 扩展现有任务

```typescript
// 在原有的 compile 任务后添加额外处理
task("compile").setAction(async (args, hre, runSuper) => {
  // 先执行原始的 compile 任务
  await runSuper(args);

  // 👇 这部分会在每次编译后自动执行
  console.log("✅ Compilation complete!");

  // 可以添加自定义的编译后处理
  const contractNames = await hre.artifacts.getAllFullyQualifiedNames();
  console.log(`📝 Compiled ${contractNames.length} contracts`);
});
```

**触发方式：**
```bash
yarn hardhat compile

# 原有的编译过程
# Compiling 1 file with 0.8.20
# Compilation finished successfully
# ✅ Compilation complete!  👈 新增的输出
# 📝 Compiled 3 contracts
```

## 🆚 任务类型对比

| 任务类型 | 触发方式 | 使用场景 | 示例 |
|---------|---------|---------|------|
| **新建任务** | 手动调用 | 自定义工具、查询 | `balance`, `network-info` |
| **扩展任务** | 原任务触发时自动执行 | 在现有流程中添加步骤 | 扩展 `deploy`, `compile` |
| **内置任务** | 手动调用 | Hardhat 提供的基础功能 | `compile`, `test`, `node` |

## 🎨 参数类型

### 必需参数（Required）
```typescript
task("balance")
  .addParam("account", "The account's address")
  // 👆 必须提供，否则报错
```

调用：
```bash
yarn hardhat balance --account 0x123...  ✅
yarn hardhat balance                      ❌ 报错
```

### 可选参数（Optional）
```typescript
task("deploy-all")
  .addOptionalParam("reset", "Reset deployments", false, types.boolean)
  // 👆 可以不提供，使用默认值 false
```

调用：
```bash
yarn hardhat deploy-all              ✅ reset = false
yarn hardhat deploy-all --reset      ✅ reset = true
```

### 参数类型

```typescript
import { types } from "hardhat/config";

task("example")
  .addParam("str", "String param", undefined, types.string)
  .addParam("num", "Number param", undefined, types.int)
  .addParam("bool", "Boolean param", undefined, types.boolean)
  .addParam("file", "File param", undefined, types.inputFile)
  .addOptionalParam("optional", "Optional param", "default", types.string)
```

## 🔄 任务调用任务

```typescript
// 任务可以调用其他任务
task("deploy-and-verify", "Deploy and verify contracts")
  .setAction(async (_, hre) => {
    // 1. 先部署
    await hre.run("deploy");

    // 2. 等待一会儿
    console.log("Waiting for Etherscan to index...");
    await new Promise(resolve => setTimeout(resolve, 30000));

    // 3. 再验证
    await hre.run("verify");

    console.log("✅ Deploy and verify complete!");
  });
```

## 🎯 实际应用场景

### 场景 1: 批量账户余额查询

```typescript
task("check-balances", "Check multiple account balances")
  .setAction(async (_, hre) => {
    const accounts = await hre.ethers.getSigners();

    console.log("💰 Account Balances:");
    for (let i = 0; i < accounts.length; i++) {
      const balance = await hre.ethers.provider.getBalance(accounts[i].address);
      console.log(`Account ${i}: ${hre.ethers.formatEther(balance)} ETH`);
    }
  });
```

**使用：**
```bash
yarn hardhat check-balances
```

### 场景 2: 合约交互工具

```typescript
task("set-greeting", "Set greeting on YourContract")
  .addParam("message", "The greeting message")
  .setAction(async (taskArgs, hre) => {
    const [signer] = await hre.ethers.getSigners();
    const contract = await hre.ethers.getContract("YourContract", signer);

    console.log(`Setting greeting to: "${taskArgs.message}"`);
    const tx = await contract.setGreeting(taskArgs.message);
    await tx.wait();

    const newGreeting = await contract.greeting();
    console.log(`✅ New greeting: "${newGreeting}"`);
  });
```

**使用：**
```bash
yarn hardhat set-greeting --message "Hello, World!" --network sepolia
```

### 场景 3: 环境检查

```typescript
task("env-check", "Check environment setup")
  .setAction(async (_, hre) => {
    console.log("🔍 Environment Check:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━");

    // 检查网络
    const network = await hre.ethers.provider.getNetwork();
    console.log(`✓ Network: ${network.name} (${network.chainId})`);

    // 检查账户
    const [signer] = await hre.ethers.getSigners();
    const balance = await hre.ethers.provider.getBalance(signer.address);
    console.log(`✓ Deployer: ${signer.address}`);
    console.log(`✓ Balance: ${hre.ethers.formatEther(balance)} ETH`);

    // 检查 API Keys
    console.log(`✓ Alchemy Key: ${process.env.ALCHEMY_API_KEY ? "✓ Set" : "✗ Not Set"}`);
    console.log(`✓ Etherscan Key: ${process.env.ETHERSCAN_V2_API_KEY ? "✓ Set" : "✗ Not Set"}`);
  });
```

**使用：**
```bash
yarn hardhat env-check --network sepolia
```

### 场景 4: 自动化测试 + 部署 + 验证

```typescript
task("full-deploy", "Test, deploy, and verify")
  .addOptionalParam("skip-tests", "Skip tests", false, types.boolean)
  .setAction(async (taskArgs, hre) => {
    // 1. 运行测试
    if (!taskArgs.skipTests) {
      console.log("🧪 Running tests...");
      await hre.run("test");
    }

    // 2. 部署合约
    console.log("🚀 Deploying contracts...");
    await hre.run("deploy");

    // 3. 等待区块确认
    console.log("⏳ Waiting for confirmations...");
    await new Promise(resolve => setTimeout(resolve, 30000));

    // 4. 验证合约
    console.log("✅ Verifying contracts...");
    await hre.run("verify");

    console.log("🎉 Full deployment complete!");
  });
```

**使用：**
```bash
# 完整流程
yarn hardhat full-deploy --network sepolia

# 跳过测试
yarn hardhat full-deploy --network sepolia --skip-tests
```

## 📋 HRE (Hardhat Runtime Environment)

所有任务都能访问 `hre` 对象：

```typescript
task("example").setAction(async (_, hre) => {
  // 访问 ethers.js
  const provider = hre.ethers.provider;
  const signers = await hre.ethers.getSigners();

  // 访问网络配置
  const networkName = hre.network.name;
  const chainId = hre.network.config.chainId;

  // 访问 artifacts
  const artifact = await hre.artifacts.readArtifact("YourContract");

  // 访问部署信息（hardhat-deploy）
  const deployment = await hre.deployments.get("YourContract");

  // 获取已部署的合约
  const contract = await hre.ethers.getContract("YourContract");

  // 运行其他任务
  await hre.run("compile");
});
```

## 🎓 总结

### 任务的三种使用模式：

1. **创建新任务** - 手动触发的自定义工具
   ```typescript
   task("my-task").setAction(async () => { ... });
   ```
   触发：`yarn hardhat my-task`

2. **扩展现有任务** - 在现有任务基础上添加功能
   ```typescript
   task("deploy").setAction(async (args, hre, runSuper) => {
     await runSuper(args);
     // 额外处理
   });
   ```
   触发：`yarn deploy`（自动执行额外代码）

3. **任务调用任务** - 编排多个任务
   ```typescript
   task("workflow").setAction(async (_, hre) => {
     await hre.run("compile");
     await hre.run("test");
     await hre.run("deploy");
   });
   ```
   触发：`yarn hardhat workflow`

### 关键要点：

✅ 任务**不会自动执行**，除非是扩展现有任务
✅ 通过 `yarn hardhat <taskName>` 触发
✅ 可以添加参数和选项
✅ 可以访问完整的 HRE 对象
✅ 可以调用其他任务
✅ 适合创建自动化工具和工作流

现在你应该完全理解任务的触发机制了！🎉
