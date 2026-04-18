# Hardhat 配置完整说明

## 📋 配置文件概览

`hardhat.config.ts` 是 Hardhat 项目的核心配置文件，控制着编译、测试、部署、验证等所有方面。

## 🎯 已启用的配置

### 1. **Solidity 编译器**
```typescript
solidity: {
  compilers: [
    {
      version: "0.8.20",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    },
  ],
}
```
- **版本**: 0.8.20
- **优化器**: 启用，200次运行（适合频繁调用的合约）

### 2. **网络配置**
已配置 20+ 个网络：
- **Ethereum**: mainnet, sepolia
- **Layer 2**: Arbitrum, Optimism, Base, Scroll
- **侧链**: Polygon, Gnosis, Celo
- 每个网络都配置了对应的测试网

### 3. **合约验证**
- **Etherscan 验证**: 已配置
- **Sourcify 验证**: 已禁用（可启用）

### 4. **自定义任务**
- **deploy 任务扩展**: 部署后自动同步 ABI 到前端

## 📦 可用的高级配置（已注释）

### 1. **编译器高级设置**

#### viaIR 编译
```typescript
// viaIR: false
```
- 通过 Yul IR 编译
- 实验性功能，可能减少字节码大小
- 编译时间更长

#### EVM 版本
```typescript
// evmVersion: "paris"
```
可选值：
- `homestead`, `tangerineWhistle`, `spuriousDragon`
- `byzantium`, `constantinople`, `petersburg`
- `istanbul`, `berlin`, `london`, `paris`, `shanghai`

#### 元数据配置
```typescript
// metadata: {
//   bytecodeHash: "ipfs", // 或 "bzzr1"
//   useLiteralContent: true,
// }
```

#### 多编译器版本
```typescript
// solidity: {
//   compilers: [
//     { version: "0.8.20", ... },
//     { version: "0.8.17", ... },
//   ],
//   overrides: {
//     "contracts/OldContract.sol": {
//       version: "0.7.6",
//     }
//   }
// }
```

### 2. **路径自定义**

```typescript
// paths: {
//   sources: "./contracts",
//   tests: "./test",
//   cache: "./cache",
//   artifacts: "./artifacts",
//   deploy: "./deploy",
//   deployments: "./deployments",
// }
```

**使用场景：**
- 重组项目结构
- 多包项目
- 自定义构建流程

### 3. **测试框架配置（Mocha）**

```typescript
// mocha: {
//   timeout: 40000,        // 测试超时
//   bail: false,           // 首个失败后停止
//   grep: "",              // 过滤测试
//   reporter: "spec",      // 报告格式
// }
```

**Reporter 选项：**
- `spec` - 默认，详细输出
- `dot` - 点状输出
- `nyan` - 彩虹猫 🐱
- `json` - JSON 格式
- `tap` - TAP 格式

### 4. **Gas Reporter 配置**

```typescript
// gasReporter: {
//   enabled: process.env.REPORT_GAS === "true",
//   currency: "USD",
//   coinmarketcap: process.env.COINMARKETCAP_API_KEY,
//   token: "ETH",
//   outputFile: "gas-report.txt",
// }
```

**功能：**
- 每个函数的 gas 消耗
- USD 成本估算
- 不同网络的 gas 对比

**启用方法：**
```bash
REPORT_GAS=true yarn test
```

### 5. **TypeChain 配置**

```typescript
// typechain: {
//   outDir: "typechain-types",
//   target: "ethers-v6",
//   alwaysGenerateOverloads: false,
// }
```

**Target 选项：**
- `ethers-v5` - ethers.js v5
- `ethers-v6` - ethers.js v6
- `web3-v1` - web3.js v1
- `truffle-v5` - Truffle

### 6. **合约大小检查**

```typescript
// contractSizer: {
//   alphaSort: true,
//   runOnCompile: true,
//   strict: true,
// }
```

**作用：**
- 检查合约字节码大小
- 以太坊合约限制：24KB
- `strict: true` 超限时报错

### 7. **命名账户高级配置**

```typescript
// namedAccounts: {
//   deployer: {
//     default: 0,
//     mainnet: "0x742d...", // 主网用特定地址
//     1: 0,                 // chainId 1 用账户 0
//   },
//   tokenOwner: { default: 1 },
//   feeCollector: { default: 2 },
// }
```

### 8. **网络高级配置**

#### Hardhat 本地网络
```typescript
// hardhat: {
//   chainId: 31337,
//   gas: "auto",
//   accounts: {
//     mnemonic: "test test test...",
//     count: 20,
//     accountsBalance: "10000000000000000000000",
//   },
//   mining: {
//     auto: true,
//     interval: 0,
//   },
//   allowUnlimitedContractSize: false,
//   blockGasLimit: 30000000,
// }
```

#### 外部网络配置
```typescript
// mainnet: {
//   url: "...",
//   accounts: [...],
//   chainId: 1,
//   gas: "auto",
//   gasPrice: "auto",
//   gasMultiplier: 1,
//   timeout: 20000,
//   httpHeaders: {},
// }
```

### 9. **主网分叉配置**

```typescript
// hardhat: {
//   forking: {
//     url: "https://eth-mainnet.alchemyapi.io/v2/...",
//     enabled: true,
//     blockNumber: 14390000, // 从特定区块分叉
//   },
// }
```

**使用场景：**
- 测试与主网合约的交互
- 在本地重现主网状态
- 调试主网交易

**启用方法：**
```bash
MAINNET_FORKING_ENABLED=true yarn fork
```

### 10. **外部合约集成**

```typescript
// external: {
//   contracts: [
//     {
//       artifacts: "node_modules/@openzeppelin/contracts/build/contracts",
//     },
//   ],
//   deployments: {
//     sepolia: ["node_modules/@project/deployments/sepolia"],
//   },
// }
```

### 11. **OpenZeppelin Defender**

```typescript
// defender: {
//   apiKey: process.env.DEFENDER_API_KEY,
//   apiSecret: process.env.DEFENDER_API_SECRET,
// }
```

**功能：**
- 自动化运维
- 安全监控
- 交易管理

### 12. **自定义链配置**

```typescript
// networks: {
//   customChain: {
//     url: "http://localhost:8545",
//     chainId: 1337,
//     accounts: [deployerPrivateKey],
//     gasPrice: 0,
//     timeout: 1800000,
//     allowUnlimitedContractSize: true,
//   },
// }
```

## 🛠️ 自定义任务示例

### 1. 账户余额查询
```typescript
task("balance", "Prints an account's balance")
  .addParam("account", "The account's address")
  .setAction(async (taskArgs, hre) => {
    const balance = await hre.ethers.provider.getBalance(taskArgs.account);
    console.log(hre.ethers.formatEther(balance), "ETH");
  });
```

**使用：**
```bash
yarn hardhat balance --account 0x742d35Cc663...
```

### 2. 合约信息查询
```typescript
task("contract-info", "Get contract information")
  .addParam("address", "The contract address")
  .setAction(async (taskArgs, hre) => {
    const code = await hre.ethers.provider.getCode(taskArgs.address);
    console.log("Contract bytecode length:", code.length);
  });
```

### 3. 网络信息查询
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

### 4. 扩展现有任务
```typescript
task("compile").setAction(async (args, hre, runSuper) => {
  await runSuper(args);
  console.log("✅ Compilation complete!");
  // 添加自定义后处理逻辑
});
```

## 📊 配置优先级

1. **命令行参数** > 2. **环境变量** > 3. **配置文件**

示例：
```bash
# 命令行参数优先级最高
yarn deploy --network sepolia

# 环境变量次之
MAINNET_FORKING_ENABLED=true yarn fork

# 配置文件默认值
defaultNetwork: "localhost"
```

## 🎯 常见配置场景

### 场景 1: 开发测试（本地）
```typescript
defaultNetwork: "localhost"
solidity: {
  optimizer: { enabled: false } // 快速编译
}
```

### 场景 2: 生产部署（主网）
```typescript
defaultNetwork: "mainnet"
solidity: {
  optimizer: { enabled: true, runs: 200 }
}
gasReporter: { enabled: true }
```

### 场景 3: 主网分叉测试
```typescript
hardhat: {
  forking: {
    url: "...",
    enabled: true,
    blockNumber: 14390000,
  },
}
```

### 场景 4: 多版本合约项目
```typescript
solidity: {
  compilers: [
    { version: "0.8.20" },
    { version: "0.8.17" },
    { version: "0.7.6" },
  ],
  overrides: {
    "contracts/legacy/*.sol": {
      version: "0.7.6"
    }
  }
}
```

## 🔐 安全最佳实践

### 1. 使用环境变量
```bash
# .env
ALCHEMY_API_KEY=your_key_here
DEPLOYER_PRIVATE_KEY=your_key_here
ETHERSCAN_API_KEY=your_key_here
```

### 2. 不要提交私钥
```bash
# .gitignore
.env
.env.local
*.key
```

### 3. 使用不同账户
```typescript
namedAccounts: {
  deployer: { default: 0 },      // 部署用
  owner: { default: 1 },         // 所有权管理
  operator: { default: 2 },      // 日常操作
}
```

## 📚 相关资源

- [Hardhat 官方文档](https://hardhat.org/docs)
- [Hardhat 配置参考](https://hardhat.org/config/)
- [hardhat-deploy 文档](https://github.com/wighawag/hardhat-deploy)
- [TypeChain 文档](https://github.com/dethcrypto/TypeChain)

## 💡 快速查找

需要配置 | 查找关键词
---|---
编译器版本 | `solidity.compilers`
优化器 | `optimizer`
网络 RPC | `networks.<network>.url`
账户私钥 | `accounts`
Gas 报告 | `gasReporter`
合约验证 | `etherscan`
测试超时 | `mocha.timeout`
路径自定义 | `paths`
主网分叉 | `forking`
自定义任务 | `task(...)`

## 🎓 总结

`hardhat.config.ts` 是一个功能强大的配置文件，提供了：

✅ **灵活的编译选项** - 支持多版本、优化、自定义输出
✅ **丰富的网络支持** - 20+ 预配置网络
✅ **强大的测试工具** - Gas 报告、覆盖率、自定义任务
✅ **无缝的部署流程** - hardhat-deploy 集成
✅ **完整的验证支持** - Etherscan、Sourcify
✅ **高度可扩展** - 自定义任务、插件系统

通过合理配置，可以大大提升开发效率和代码质量！
