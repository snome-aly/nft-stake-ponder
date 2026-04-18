# Scripts 源码学习指南

## 📚 概述

现在所有脚本都已添加详细的中文注释，方便你深入学习源码实现。

## 📂 脚本列表

### 1. **generateAccount.ts** - 生成新钱包
**核心技术点：**
- `ethers.Wallet.createRandom()` - 生成随机钱包
- `wallet.encrypt(password)` - 使用 AES-128-CTR 加密私钥
- `envfile.stringify()` - 生成 .env 文件格式
- 密码确认循环机制

**学习要点：**
```typescript
// 1. 生成随机钱包
const randomWallet = ethers.Wallet.createRandom();
// 包含：privateKey, publicKey, address

// 2. 加密私钥
const encryptedJson = await randomWallet.encrypt(password);
// 返回加密的 JSON 字符串（Web3 Secret Storage 格式）

// 3. 保存到 .env
DEPLOYER_PRIVATE_KEY_ENCRYPTED={"address":"...","crypto":{...}}
```

---

### 2. **importAccount.ts** - 导入已有钱包
**核心技术点：**
- `new ethers.Wallet(privateKey)` - 从私钥创建钱包
- 私钥格式验证（try-catch）
- 循环输入直到成功

**学习要点：**
```typescript
// 1. 私钥验证
try {
  const wallet = new ethers.Wallet(privateKey);
  // 私钥格式正确
} catch (e) {
  // 私钥格式错误，重新输入
}

// 2. 私钥格式
// 0x 开头的 64 位十六进制字符串
// 例如：0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

---

### 3. **listAccount.ts** - 查看账户信息
**核心技术点：**
- `Wallet.fromEncryptedJson()` - 解密私钥恢复钱包
- `QRCode.toString()` - 生成终端二维码
- `ethers.JsonRpcProvider` - 连接 RPC 节点
- `provider.getBalance()` - 查询余额
- `provider.getTransactionCount()` - 查询 nonce

**学习要点：**
```typescript
// 1. 解密钱包
const wallet = await Wallet.fromEncryptedJson(encryptedKey, password);

// 2. 生成二维码
await QRCode.toString(address, {
  type: "terminal",  // 终端显示
  small: true        // 小尺寸
});

// 3. 查询余额
const provider = new ethers.JsonRpcProvider(rpcUrl);
const balance = await provider.getBalance(address);
const balanceInEth = ethers.formatEther(balance); // wei -> ETH

// 4. 查询 nonce（交易计数）
const nonce = await provider.getTransactionCount(address);
```

---

### 4. **revealPK.ts** - 显示私钥
**核心技术点：**
- 简单的解密和显示
- 安全警告实践

**学习要点：**
```typescript
// 解密后直接访问 privateKey 属性
const wallet = await Wallet.fromEncryptedJson(encryptedKey, password);
console.log(wallet.privateKey); // 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

// ⚠️ 危险操作，注意安全
```

---

### 5. **runHardhatDeployWithPK.ts** - 安全部署
**核心技术点：**
- `process.argv` - 解析命令行参数
- `spawn()` - 启动子进程
- 环境变量传递
- 临时私钥管理

**学习要点：**
```typescript
// 1. 解析命令行参数
const networkIndex = process.argv.indexOf("--network");
const networkName = networkIndex !== -1 ? process.argv[networkIndex + 1] : "localhost";

// 2. 本地网络 vs 远程网络
if (networkName === "localhost" || networkName === "hardhat") {
  // 本地：无需密码，直接部署
} else {
  // 远程：需要解密私钥
  const wallet = await Wallet.fromEncryptedJson(encryptedKey, password);
  process.env.__RUNTIME_DEPLOYER_PRIVATE_KEY = wallet.privateKey;
}

// 3. 启动子进程
const hardhat = spawn("hardhat", ["deploy", ...process.argv.slice(2)], {
  stdio: "inherit",      // 继承父进程的输入/输出
  env: process.env,      // 传递环境变量（包含临时私钥）
  shell: process.platform === "win32"  // Windows 需要 shell
});

// 4. 监听子进程退出
hardhat.on("exit", code => {
  process.exit(code || 0);  // 使用子进程的退出码
});
```

**安全机制：**
```
用户运行: yarn deploy --network sepolia
    ↓
runHardhatDeployWithPK.ts 解密私钥
    ↓
设置到进程环境变量: process.env.__RUNTIME_DEPLOYER_PRIVATE_KEY
    ↓
启动子进程: hardhat deploy
    ↓
子进程读取环境变量: hardhat.config.ts
    ↓
部署完成，进程退出
    ↓
环境变量自动清理（随进程销毁）
```

---

### 6. **generateTsAbis.ts** - 生成前端类型
**核心技术点：**
- 文件系统操作（读取目录、文件）
- 正则表达式解析 Solidity 继承
- JSON 数据转换
- Prettier 代码格式化
- 复杂的数据结构处理

**学习要点：**

#### 核心函数 1: `getDirectories()`
```typescript
function getDirectories(path: string) {
  return fs.readdirSync(path, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
}

// 用途：获取 deployments/ 下的网络目录
// 返回：["hardhat", "sepolia", "mainnet"]
```

#### 核心函数 2: `getActualSourcesForContract()`
```typescript
// 解析 Solidity 继承关系
const regex = /contract\s+(\w+)\s+is\s+([^{}]+)\{/;
// 匹配：contract YourContract is Ownable, Pausable {

const match = contractContent.match(regex);
if (match) {
  const inheritancePart = match[2];  // "Ownable, Pausable"
  const inheritedContracts = inheritancePart.split(",").map(c => `${c.trim()}.sol`);
  // 返回：["Ownable.sol", "Pausable.sol"]
}
```

#### 核心函数 3: `getInheritedFunctions()`
```typescript
// 遍历父合约，提取所有函数
for (const sourceContractName of actualSources) {
  const { abi } = JSON.parse(fs.readFileSync(artifactPath).toString());
  for (const functionAbi of abi) {
    if (functionAbi.type === "function") {
      inheritedFunctions[functionAbi.name] = sourcePath;
    }
  }
}

// 返回：{ "owner": "contracts/Ownable.sol", ... }
```

#### 核心函数 4: `getContractDataFromDeployments()`
```typescript
// 读取所有部署信息，按 chainId 组织
const output = {
  "31337": {  // Hardhat 本地网络
    "YourContract": {
      address: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      abi: [...],
      inheritedFunctions: {},
      deployedOnBlock: 1
    }
  },
  "11155111": {  // Sepolia 测试网
    "YourContract": { ... }
  }
};
```

#### 主函数：生成 TypeScript 文件
```typescript
const generateTsAbis = async function () {
  // 1. 读取部署数据
  const allContractsData = getContractDataFromDeployments();

  // 2. 生成对象字面量
  const fileContent = Object.entries(allContractsData)
    .reduce((content, [chainId, chainConfig]) => {
      return `${content}${chainId}:${JSON.stringify(chainConfig)},`;
    }, "");

  // 3. 生成完整的 TypeScript 代码
  const tsCode = `
    import { GenericContractsDeclaration } from "~~/utils/scaffold-eth/contract";

    const deployedContracts = {${fileContent}} as const;

    export default deployedContracts satisfies GenericContractsDeclaration;
  `;

  // 4. 使用 Prettier 格式化
  const formatted = await prettier.format(tsCode, { parser: "typescript" });

  // 5. 写入文件
  fs.writeFileSync("../nextjs/contracts/deployedContracts.ts", formatted);
};
```

---

## 🔄 完整工作流程

### 场景：首次设置并部署

```
1. yarn generate
   → generateAccount.ts 执行
   → 用户输入密码
   → 生成随机钱包
   → 加密私钥并保存到 .env

2. yarn account
   → listAccount.ts 执行
   → 用户输入密码
   → 解密钱包
   → 显示地址和余额

3. 充值账户（使用水龙头或转账）

4. yarn deploy --network sepolia
   → runHardhatDeployWithPK.ts 执行
   → 解析命令行参数：--network sepolia
   → 用户输入密码
   → 解密私钥，设置到 process.env.__RUNTIME_DEPLOYER_PRIVATE_KEY
   → 启动子进程：hardhat deploy --network sepolia
   → hardhat.config.ts 读取 __RUNTIME_DEPLOYER_PRIVATE_KEY
   → 执行部署脚本（deploy/*.ts）
   → 部署完成后，hardhat.config.ts 调用 generateTsAbis()
   → generateTsAbis.ts 执行
   → 读取 deployments/sepolia/*.json
   → 生成 packages/nextjs/contracts/deployedContracts.ts
   → 前端自动获得最新的合约类型
```

---

## 💡 关键技术学习

### 1. **加密机制**
```typescript
// Web3 Secret Storage Definition
// https://github.com/ethereum/wiki/wiki/Web3-Secret-Storage-Definition

const encryptedJson = {
  address: "5e97870f263700f46aa00d967821199b9bc5a120",
  crypto: {
    cipher: "aes-128-ctr",
    ciphertext: "...",
    cipherparams: { iv: "..." },
    kdf: "scrypt",
    kdfparams: {
      dklen: 32,
      n: 262144,
      p: 1,
      r: 8,
      salt: "..."
    },
    mac: "..."
  },
  id: "...",
  version: 3
};

// 使用密码加密私钥
const encrypted = await wallet.encrypt(password);

// 使用密码解密私钥
const wallet = await Wallet.fromEncryptedJson(encrypted, password);
```

### 2. **进程管理**
```typescript
// spawn vs exec vs fork
// spawn: 流式输出，适合长时间运行的进程
// exec: 缓冲输出，适合短命令
// fork: Node.js 进程专用

const child = spawn("command", ["arg1", "arg2"], {
  stdio: "inherit",  // 继承父进程的 stdin, stdout, stderr
  env: process.env,  // 环境变量
  cwd: "/path",      // 工作目录
  shell: true        // 是否通过 shell 执行
});

child.on("exit", code => {
  console.log(`Child exited with code ${code}`);
});
```

### 3. **环境变量管理**
```typescript
// .env 文件
DEPLOYER_PRIVATE_KEY_ENCRYPTED={"address":"..."}
ALCHEMY_API_KEY=your_key_here

// 读取
import * as dotenv from "dotenv";
dotenv.config(); // 加载 .env 到 process.env

const encrypted = process.env.DEPLOYER_PRIVATE_KEY_ENCRYPTED;

// 写入（临时，仅进程内）
process.env.__RUNTIME_DEPLOYER_PRIVATE_KEY = wallet.privateKey;
```

### 4. **文件系统操作**
```typescript
// 检查文件/目录是否存在
fs.existsSync(path);

// 读取文件
const content = fs.readFileSync(path, "utf8");
const json = JSON.parse(content);

// 写入文件
fs.writeFileSync(path, content);

// 创建目录
fs.mkdirSync(path);

// 读取目录
const dirs = fs.readdirSync(path, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);
```

### 5. **正则表达式应用**
```typescript
// 匹配 Solidity 合约继承
const regex = /contract\s+(\w+)\s+is\s+([^{}]+)\{/;
//              ^^^^^^^ ^^^    ^^     ^^^^^^^
//              关键字  名称  is   继承列表

const match = "contract MyContract is Ownable, Pausable {".match(regex);
// match[0]: 完整匹配
// match[1]: 合约名 "MyContract"
// match[2]: 继承列表 "Ownable, Pausable"
```

---

## 🎓 学习建议

### 1. **按依赖顺序学习**
```
基础脚本（不依赖其他脚本）:
1. generateAccount.ts    - 学习加密和文件操作
2. importAccount.ts      - 学习私钥验证
3. listAccount.ts        - 学习 RPC 查询
4. revealPK.ts          - 学习解密

高级脚本（依赖基础脚本）:
5. runHardhatDeployWithPK.ts - 学习进程管理
6. generateTsAbis.ts         - 学习复杂数据处理
```

### 2. **动手实践**
```bash
# 1. 生成账户
yarn generate

# 2. 查看 .env 文件
cat packages/hardhat/.env

# 3. 查看账户
yarn account

# 4. 部署（观察整个流程）
yarn deploy

# 5. 查看生成的文件
cat packages/nextjs/contracts/deployedContracts.ts
```

### 3. **调试技巧**
```typescript
// 在脚本中添加 console.log
console.log("🔍 Debug:", variableName);
console.log("📊 Data:", JSON.stringify(data, null, 2));

// 查看进程参数
console.log("⚙️ Args:", process.argv);

// 查看环境变量
console.log("🌍 Env:", process.env.DEPLOYER_PRIVATE_KEY_ENCRYPTED);
```

### 4. **扩展练习**
```typescript
// 练习 1: 添加多账户支持
// 修改脚本支持多个部署账户

// 练习 2: 添加备份功能
// 创建脚本备份加密的私钥

// 练习 3: 添加余额警告
// 当余额低于阈值时发出警告

// 练习 4: 生成部署报告
// 部署后生成详细的报告（gas 消耗、合约大小等）
```

---

## 📚 相关资源

- [Ethers.js 文档](https://docs.ethers.org/v6/)
- [Node.js fs 模块](https://nodejs.org/api/fs.html)
- [Node.js child_process 模块](https://nodejs.org/api/child_process.html)
- [Web3 Secret Storage](https://github.com/ethereum/wiki/wiki/Web3-Secret-Storage-Definition)
- [Hardhat Deploy 文档](https://github.com/wighawag/hardhat-deploy)

---

## 🎯 总结

所有脚本都围绕着两个核心任务：

1. **账户管理** - 安全地管理部署账户的私钥
2. **类型同步** - 将合约信息同步到前端

现在每个脚本都有详细的中文注释，建议你：
1. 按顺序阅读源码
2. 理解每个函数的作用
3. 动手运行并观察输出
4. 尝试修改和扩展功能

祝学习愉快！🚀
