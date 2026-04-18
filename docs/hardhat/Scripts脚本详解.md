# Hardhat Scripts 脚本详解

## 📂 目录结构

```
packages/hardhat/scripts/
├── generateAccount.ts          # 生成新钱包
├── importAccount.ts            # 导入已有钱包
├── listAccount.ts             # 查看账户信息
├── revealPK.ts                # 显示私钥
├── runHardhatDeployWithPK.ts  # 安全部署脚本
└── generateTsAbis.ts          # 生成前端 ABI 类型
```

## 🔐 账户管理脚本

### 1. **generateAccount.ts** - 生成新钱包

#### 📝 作用
生成一个全新的随机钱包，并加密存储私钥到 `.env` 文件。

#### 🔍 工作流程
```
1. 生成随机钱包（ethers.Wallet.createRandom()）
   ↓
2. 提示输入密码（两次确认）
   ↓
3. 使用密码加密私钥
   ↓
4. 保存加密后的私钥到 .env 文件
   - DEPLOYER_PRIVATE_KEY_ENCRYPTED="加密的JSON"
   ↓
5. 显示钱包地址
```

#### 💻 使用方法
```bash
# 方式 1: 通过 package.json 快捷命令
yarn generate

# 方式 2: 通过 hardhat 命令
yarn hardhat account:generate
```

#### 📤 输出示例
```
👛 Generating new Wallet

Enter a password to encrypt your private key: ********
Confirm password: ********

📄 Encrypted Private Key saved to packages/hardhat/.env file
🪄 Generated wallet address: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

⚠️ Make sure to remember your password! You'll need it to decrypt the private key.
```

#### ⚠️ 注意事项
- 如果已存在账户，会提示不能重复生成
- 密码只存在于你的记忆中，**丢失密码无法恢复**
- 生成的地址需要充值才能用于部署

#### 🎯 使用场景
- 首次设置项目时
- 需要一个全新的部署账户
- 测试环境需要新账户

---

### 2. **importAccount.ts** - 导入已有钱包

#### 📝 作用
导入你已有的钱包私钥，加密后存储到 `.env` 文件。

#### 🔍 工作流程
```
1. 提示粘贴私钥
   ↓
2. 验证私钥格式是否正确
   ↓
3. 提示输入密码（两次确认）
   ↓
4. 使用密码加密私钥
   ↓
5. 保存加密后的私钥到 .env 文件
   ↓
6. 显示导入的钱包地址
```

#### 💻 使用方法
```bash
# 方式 1: 通过 package.json 快捷命令
yarn account:import

# 方式 2: 通过 hardhat 命令
yarn hardhat account:import
```

#### 📤 输出示例
```
👛 Importing Wallet

Paste your private key: ********************************
Enter a password to encrypt your private key: ********
Confirm password: ********

📄 Encrypted Private Key saved to packages/hardhat/.env file
🪄 Imported wallet address: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

⚠️ Make sure to remember your password! You'll need it to decrypt the private key.
```

#### ⚠️ 注意事项
- 私钥格式：`0x` 开头的 64 位十六进制字符串
- 私钥会被加密存储，原始私钥不会保存
- 如果已存在账户，会提示不能重复导入

#### 🎯 使用场景
- 使用 MetaMask 或其他钱包的账户
- 迁移现有的部署账户
- 团队成员共享部署账户（不推荐）

#### 🔑 如何获取私钥？

**MetaMask:**
```
1. 打开 MetaMask
2. 点击账户菜单
3. 选择 "账户详情"
4. 点击 "导出私钥"
5. 输入 MetaMask 密码
6. 复制私钥
```

---

### 3. **listAccount.ts** - 查看账户信息

#### 📝 作用
显示部署账户的地址、余额和 nonce（所有已配置网络）。

#### 🔍 工作流程
```
1. 读取加密的私钥
   ↓
2. 提示输入密码解密
   ↓
3. 生成地址的二维码
   ↓
4. 遍历所有配置的网络
   ↓
5. 查询每个网络上的余额和 nonce
```

#### 💻 使用方法
```bash
# 方式 1: 通过 package.json 快捷命令
yarn account

# 方式 2: 通过 hardhat 命令
yarn hardhat account
```

#### 📤 输出示例
```
Enter your password to decrypt the private key: ********

 ████████████████████████████████████████
 ████████████████████████████████████████
 ████  ██  ██████████████  ██  ██  ██████
 ████████  ██    ██    ██████  ██████████
 ████████  ████  ██████  ████  ████  ████
 ████  ████  ██  ████  ████  ██████████████

Public address: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

-- mainnet -- 📡
   balance: 0.5
   nonce: 42

-- sepolia -- 📡
   balance: 2.3
   nonce: 15

-- arbitrum -- 📡
   balance: 0.0
   nonce: 0

Can't connect to network polygon
```

#### 📊 显示信息说明
- **balance**: 账户在该网络的 ETH 余额
- **nonce**: 交易计数（已发送的交易数）
- **二维码**: 可以扫码获取地址

#### 🎯 使用场景
- 检查部署账户是否有足够余额
- 确认账户地址是否正确
- 查看账户在各个网络的状态
- 充值前获取地址二维码

---

### 4. **revealPK.ts** - 显示私钥

#### 📝 作用
解密并显示账户的原始私钥（明文）。

#### 🔍 工作流程
```
1. 读取加密的私钥
   ↓
2. 警告：将在控制台显示私钥
   ↓
3. 提示输入密码解密
   ↓
4. 在控制台显示明文私钥
```

#### 💻 使用方法
```bash
# 方式 1: 通过 package.json 快捷命令
yarn account:reveal-pk

# 方式 2: 通过 hardhat 命令
yarn hardhat account:reveal-pk
```

#### 📤 输出示例
```
👀 This will reveal your private key on the console.

Enter your password to decrypt the private key: ********

🔑 Private key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

#### ⚠️ 安全警告
- ⚠️ **极度危险**：私钥一旦泄露，资产可能被盗
- 🚫 不要在公共场所使用
- 🚫 不要截图或录屏
- 🚫 使用后清空终端历史
- 🚫 确保没有人在旁边

#### 🎯 使用场景
- 需要导入私钥到其他工具
- 备份私钥（建议离线保存）
- 迁移到其他开发环境
- 应急恢复场景

#### 💡 安全建议
```bash
# 使用后立即清空终端
clear

# 或关闭终端窗口
```

---

## 🚀 部署脚本

### 5. **runHardhatDeployWithPK.ts** - 安全部署

#### 📝 作用
这是 `yarn deploy` 的底层实现，负责解密私钥并执行部署。

#### 🔍 工作流程
```
1. 解析命令行参数（--network 等）
   ↓
2. 判断目标网络
   ├─ localhost/hardhat：直接部署（无需密码）
   └─ 其他网络：需要解密私钥
       ↓
3. 如果需要解密：
   - 读取加密的私钥
   - 提示输入密码
   - 解密私钥
   - 设置临时环境变量 __RUNTIME_DEPLOYER_PRIVATE_KEY
   ↓
4. 调用 hardhat deploy 命令
   ↓
5. 部署完成后清理临时私钥
```

#### 💻 使用方法
```bash
# 这个脚本通常不直接调用，而是通过 package.json 的快捷命令

# 部署到本地网络（无需密码）
yarn deploy

# 部署到测试网/主网（需要密码）
yarn deploy --network sepolia
yarn deploy --network mainnet
```

#### 📤 输出示例
```bash
# 部署到 sepolia
$ yarn deploy --network sepolia

Enter password to decrypt private key: ********

Deploying to sepolia network...
👛 Deploying YourContract with account: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
⛽ Estimated gas: 1234567
💰 Gas price: 20 gwei
📝 Deploying...
✅ YourContract deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
📄 Updated TypeScript contract definition file
```

#### 🔐 安全机制
1. **密码保护**:
   - 私钥加密存储
   - 每次部署需要输入密码

2. **临时解密**:
   - 私钥仅在部署期间解密
   - 存储在进程环境变量中
   - 部署完成后自动清理

3. **本地网络例外**:
   - `localhost` 和 `hardhat` 网络无需密码
   - 使用 Hardhat 默认账户

#### 🎯 使用场景
- 所有的合约部署操作
- 通过 `yarn deploy` 自动调用
- 支持所有配置的网络

#### ⚙️ 与 hardhat.config.ts 的关联
```typescript
// hardhat.config.ts
const deployerPrivateKey =
  process.env.__RUNTIME_DEPLOYER_PRIVATE_KEY  // 👈 由此脚本设置
  ?? "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
```

---

## 🔧 工具脚本

### 6. **generateTsAbis.ts** - 生成前端类型

#### 📝 作用
从部署信息生成 TypeScript ABI 定义，同步到 Next.js 前端。

#### 🔍 工作流程
```
1. 读取 deployments/ 目录下的所有部署信息
   ↓
2. 提取每个合约的：
   - 地址 (address)
   - ABI (abi)
   - 继承的函数 (inheritedFunctions)
   - 部署区块号 (deployedOnBlock)
   ↓
3. 按 chainId 组织数据
   ↓
4. 生成 TypeScript 代码
   ↓
5. 使用 Prettier 格式化
   ↓
6. 写入到 packages/nextjs/contracts/deployedContracts.ts
```

#### 💻 使用方法
```bash
# 通常不需要手动调用，会自动触发

# 自动触发场景：
# 1. 运行 yarn deploy 时自动执行
# 2. hardhat.config.ts 中的 task("deploy") 扩展

# 手动调用（如果需要）：
yarn hardhat run scripts/generateTsAbis.ts
```

#### 📤 生成的文件示例
```typescript
// packages/nextjs/contracts/deployedContracts.ts

/**
 * This file is autogenerated by Scaffold-ETH.
 * You should not edit it manually or your changes might be overwritten.
 */
import { GenericContractsDeclaration } from "~~/utils/scaffold-eth/contract";

const deployedContracts = {
  31337: {
    YourContract: {
      address: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      abi: [
        {
          inputs: [],
          name: "greeting",
          outputs: [{ internalType: "string", name: "", type: "string" }],
          stateMutability: "view",
          type: "function",
        },
        // ... 更多 ABI
      ],
      inheritedFunctions: {},
      deployedOnBlock: 1,
    },
  },
} as const;

export default deployedContracts satisfies GenericContractsDeclaration;
```

#### 🔄 自动触发配置
```typescript
// hardhat.config.ts

task("deploy").setAction(async (args, hre, runSuper) => {
  await runSuper(args);
  await generateTsAbis(hre);  // 👈 自动调用
});
```

#### 🎯 使用场景
- 每次部署后自动同步
- 前端需要最新的合约接口
- 确保前端类型与合约一致

#### 📊 数据流
```
Solidity 合约
    ↓ (编译)
artifacts/
    ↓ (部署)
deployments/
    ↓ (generateTsAbis)
packages/nextjs/contracts/deployedContracts.ts
    ↓ (abitype 推导)
前端 Scaffold-ETH hooks 的类型提示
```

---

## 📋 完整工作流示例

### 场景 1: 首次设置项目

```bash
# 1. 生成新账户
yarn generate
# 输入密码: ********
# 获得地址: 0x742d35Cc663...

# 2. 查看账户信息
yarn account
# 输入密码: ********
# 查看各网络余额（都是 0）

# 3. 充值（使用水龙头或转账）
# Sepolia 水龙头: https://sepoliafaucet.com/

# 4. 再次查看余额
yarn account
# sepolia balance: 0.5 ETH ✅

# 5. 部署到测试网
yarn deploy --network sepolia
# 输入密码: ********
# 部署成功！
```

### 场景 2: 导入现有账户

```bash
# 1. 导入 MetaMask 账户
yarn account:import
# 粘贴私钥: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
# 设置密码: ********

# 2. 验证导入成功
yarn account
# 查看地址和余额

# 3. 开始部署
yarn deploy --network mainnet
```

### 场景 3: 日常开发部署

```bash
# 本地开发（无需密码）
yarn chain          # 终端 1: 启动本地链
yarn deploy         # 终端 2: 部署（自动同步到前端）
yarn start          # 终端 3: 启动前端

# 部署到测试网（需要密码）
yarn deploy --network sepolia
# 输入密码: ********
```

---

## 🔐 安全最佳实践

### 1. 密码管理
```
✅ 使用强密码（大小写+数字+符号）
✅ 不要在代码中硬编码密码
✅ 使用密码管理器存储密码
❌ 不要将密码告诉他人
❌ 不要在公共场所输入密码
```

### 2. 私钥保护
```
✅ 私钥加密存储在 .env 文件
✅ .env 文件已在 .gitignore 中
✅ 使用 reveal-pk 时确保安全
❌ 不要将私钥提交到 Git
❌ 不要截图或录屏私钥
❌ 不要通过聊天工具发送私钥
```

### 3. 账户使用
```
✅ 开发/测试用专用账户
✅ 主网部署前检查余额
✅ 定期备份加密的私钥
❌ 不要使用个人主账户
❌ 不要在测试网存放大量资金
```

### 4. .env 文件示例
```bash
# .env（加密存储，可以提交）
DEPLOYER_PRIVATE_KEY_ENCRYPTED={"address":"...","crypto":{...}}
ALCHEMY_API_KEY=your_api_key_here
ETHERSCAN_V2_API_KEY=your_api_key_here
```

---

## 🎯 命令速查表

| 命令 | 作用 | 需要密码 |
|------|------|---------|
| `yarn generate` | 生成新钱包 | ✅ 设置密码 |
| `yarn account:import` | 导入已有钱包 | ✅ 设置密码 |
| `yarn account` | 查看账户信息 | ✅ 解密查看 |
| `yarn account:reveal-pk` | 显示私钥 | ✅ 解密显示 |
| `yarn deploy` | 本地部署 | ❌ 无需密码 |
| `yarn deploy --network sepolia` | 测试网部署 | ✅ 每次输入 |
| `yarn deploy --network mainnet` | 主网部署 | ✅ 每次输入 |

---

## 🆘 常见问题

### Q1: 忘记密码怎么办？
```
❌ 无法恢复！密码只存在于你的记忆中。
解决方案：
1. 如果有私钥备份：使用 yarn account:import 重新导入
2. 如果没有备份：需要生成新账户
```

### Q2: 部署时提示 "Failed to decrypt private key"
```
原因：密码错误
解决：
1. 检查密码是否正确
2. 检查键盘布局（中英文输入法）
3. 如果确认密码正确，可能是加密数据损坏
```

### Q3: 账户余额为 0 无法部署
```
解决方案：
1. 测试网：使用水龙头充值
   - Sepolia: https://sepoliafaucet.com/
   - Goerli: https://goerlifaucet.com/
2. 主网：从其他钱包转入 ETH
```

### Q4: 如何在多台电脑使用同一个账户？
```
方法 1: 复制 .env 文件（推荐）
1. 从电脑 A 复制 packages/hardhat/.env
2. 粘贴到电脑 B 的相同位置
3. 使用相同的密码

方法 2: 重新导入私钥
1. 在电脑 A 运行 yarn account:reveal-pk
2. 复制私钥
3. 在电脑 B 运行 yarn account:import
4. 粘贴私钥
```

### Q5: 可以不使用密码保护吗？
```
⚠️ 不推荐！但可以：
1. 直接在 .env 文件中设置明文私钥：
   DEPLOYER_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

2. 修改 hardhat.config.ts：
   const deployerPrivateKey =
     process.env.DEPLOYER_PRIVATE_KEY  // 明文私钥
     || process.env.__RUNTIME_DEPLOYER_PRIVATE_KEY
     || "0xac0974...";

⚠️ 风险：私钥以明文存储，任何能访问你电脑的人都能看到
```

---

## 📚 相关资源

- [ethers.js 文档 - Wallet](https://docs.ethers.org/v6/api/wallet/)
- [Hardhat 部署文档](https://hardhat.org/hardhat-runner/docs/guides/deploying)
- [Scaffold-ETH 文档](https://docs.scaffoldeth.io/)

---

## 💡 总结

scripts 目录下的脚本主要分为两类：

1. **账户管理** (generateAccount, importAccount, listAccount, revealPK)
   - 管理部署账户的生命周期
   - 所有私钥都加密存储
   - 通过密码保护确保安全

2. **部署工具** (runHardhatDeployWithPK, generateTsAbis)
   - 安全的部署流程
   - 自动同步合约信息到前端
   - 与 Scaffold-ETH 生态集成

这套脚本体系确保了：
- 🔐 **安全性** - 私钥加密存储，密码保护
- 🚀 **便捷性** - 一键生成、导入、部署
- 🔄 **自动化** - 部署后自动同步类型到前端
- 💡 **用户友好** - 清晰的提示和错误信息
