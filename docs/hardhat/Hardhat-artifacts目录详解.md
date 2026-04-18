# Hardhat artifacts 目录详解

## 📁 目录结构

```
packages/hardhat/artifacts/
├── build-info/
│   └── 03a3d151dcf5337c1dacb85ba57c5726.json  (2.3MB)
├── contracts/
│   └── YourContract.sol/
│       ├── YourContract.json
│       └── YourContract.dbg.json
└── hardhat/
    └── console.sol/
        ├── console.json
        └── console.dbg.json
```

## 🎯 artifacts 目录的作用

**artifacts/ 是 Solidity 编译后的产物目录，包含了部署、测试、与合约交互所需的所有信息。**

### 核心内容

| 内容 | 作用 |
|------|------|
| **字节码（bytecode）** | 部署合约到区块链 |
| **ABI** | 与合约交互的接口定义 |
| **编译元数据** | 源码、编译器配置、优化信息 |
| **调试信息** | 源码映射、错误追踪 |

## 📂 三个子目录详解

### 1. contracts/ - 你的合约编译产物

**结构：**

```
contracts/
└── YourContract.sol/          ← 源文件名
    ├── YourContract.json      ← 主要产物（ABI + bytecode）
    └── YourContract.dbg.json  ← 调试信息（指向 build-info）
```

#### YourContract.json（主要产物）

**包含的内容：**

```json
{
  "_format": "hh-sol-artifact-1",        // Hardhat 产物格式版本
  "contractName": "YourContract",        // 合约名称
  "sourceName": "contracts/YourContract.sol",  // 源文件路径

  // 🔑 最重要：ABI（应用程序二进制接口）
  "abi": [
    {
      "type": "constructor",
      "inputs": [{"name": "_owner", "type": "address"}]
    },
    {
      "type": "event",
      "name": "GreetingChange",
      "inputs": [...]
    },
    {
      "type": "function",
      "name": "setGreeting",
      "inputs": [{"name": "_newGreeting", "type": "string"}],
      "outputs": [],
      "stateMutability": "payable"
    },
    // ... 所有公开的函数、事件、错误定义
  ],

  // 🔑 最重要：字节码（部署时使用）
  "bytecode": "0x608060405234801561001057600080fd5b50...",  // 创建字节码

  // 🔑 重要：运行时字节码（实际存储在链上）
  "deployedBytecode": "0x608060405234801561001057600080fd5b50...",

  // 链接信息（如果有外部库）
  "linkReferences": {},
  "deployedLinkReferences": {}
}
```

**用途：**

```typescript
// 1. 部署合约
const artifact = require("./artifacts/contracts/YourContract.sol/YourContract.json");
const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);
const contract = await factory.deploy(owner);

// 2. 与已部署的合约交互
const contract = new ethers.Contract(contractAddress, artifact.abi, signer);
await contract.setGreeting("Hello");

// 3. 前端交互（通过 ethers 或 viem）
import YourContractArtifact from "../artifacts/contracts/YourContract.sol/YourContract.json";
const contract = new ethers.Contract(address, YourContractArtifact.abi, provider);
```

#### YourContract.dbg.json（调试信息）

**内容：**

```json
{
  "_format": "hh-sol-dbg-1",
  "buildInfo": "../../build-info/03a3d151dcf5337c1dacb85ba57c5726.json"
}
```

**作用：**

```
指向详细的编译信息（build-info）
    ↓
用于错误追踪和调试
    ↓
Hardhat 可以显示准确的错误行号
```

**实际效果：**

```solidity
// YourContract.sol:45
require(msg.sender == owner, "Not the Owner");
```

没有调试信息：

```
Error: execution reverted: Not the Owner
```

有调试信息：

```
Error: VM Exception while processing transaction: reverted with reason string 'Not the Owner'
    at YourContract.withdraw (contracts/YourContract.sol:45)
    ↑ 准确定位到源码行号
```

### 2. hardhat/ - Hardhat 内置库

**结构：**

```
hardhat/
└── console.sol/
    ├── console.json       ← console 库的 ABI
    └── console.dbg.json   ← 调试信息
```

**console.sol 是什么？**

```solidity
// 在你的合约中
import "hardhat/console.sol";

contract YourContract {
    function setGreeting(string memory _newGreeting) public {
        console.log("New greeting:", _newGreeting);  // ← 调试输出
    }
}
```

**编译后：**

```
artifacts/
├── contracts/
│   └── YourContract.sol/YourContract.json  ← 你的合约
└── hardhat/
    └── console.sol/console.json             ← console 库
```

**为什么需要编译 console.sol？**

```
console.log 不是原生 Solidity 功能
    ↓
Hardhat 提供的调试库
    ↓
需要编译成 bytecode 注入到你的合约
    ↓
部署时包含调试功能
    ↓
运行时可以在终端看到 log 输出
```

### 3. build-info/ - 完整的编译信息

**结构：**

```
build-info/
└── 03a3d151dcf5337c1dacb85ba57c5726.json  (2.3MB)
    ↑ 随机生成的哈希值（每次编译可能不同）
```

**文件名规则：**

```
哈希值 = keccak256(编译输入 + 编译器版本 + 配置)

相同的：
├─ 源码
├─ Solidity 版本
└─ 编译器配置
→ 生成相同的哈希值（确定性）

任何变化 → 新的哈希值 → 新的 build-info 文件
```

**文件内容（2.3MB）：**

```json
{
  "id": "03a3d151dcf5337c1dacb85ba57c5726",
  "_format": "hh-sol-build-info-1",

  // 编译器版本
  "solcVersion": "0.8.20",
  "solcLongVersion": "0.8.20+commit.a1b79de6",

  // 编译输入（包含所有源码）
  "input": {
    "language": "Solidity",
    "sources": {
      "contracts/YourContract.sol": {
        "content": "//SPDX-License-Identifier: MIT\npragma solidity >=0.8.0 <0.9.0;\n..."
      },
      "hardhat/console.sol": {
        "content": "// SPDX-License-Identifier: MIT\npragma solidity >=0.4.22 <0.9.0;\n..."
      }
    },
    "settings": {
      "optimizer": {
        "enabled": true,
        "runs": 200
      },
      "evmVersion": "paris",
      "outputSelection": {
        "*": {
          "*": [
            "abi",
            "evm.bytecode",
            "evm.deployedBytecode",
            "evm.methodIdentifiers",
            "metadata",
            "storageLayout",
            "evm.gasEstimates"
          ]
        }
      }
    }
  },

  // 编译输出（详细信息）
  "output": {
    "contracts": {
      "contracts/YourContract.sol": {
        "YourContract": {
          "abi": [...],
          "evm": {
            "bytecode": {
              "object": "0x608060405234801561001057...",
              "sourceMap": "58:1234:0:-:0;;;...",      // ← 源码映射
              "linkReferences": {},
              "opcodes": "PUSH1 0x80 PUSH1 0x40 ..."   // ← EVM 操作码
            },
            "deployedBytecode": {...},
            "methodIdentifiers": {
              "greeting()": "ef690cc0",                 // ← 函数选择器
              "setGreeting(string)": "a4136862",
              "withdraw()": "3ccfd60b"
            },
            "gasEstimates": {                          // ← Gas 估算
              "creation": {
                "codeDepositCost": "450000",
                "executionCost": "500000"
              },
              "external": {
                "setGreeting(string)": "infinite",
                "withdraw()": "30000"
              }
            }
          },
          "metadata": "{...}",                          // ← 元数据（JSON）
          "storageLayout": {                           // ← 存储布局
            "storage": [
              {
                "astId": 10,
                "contract": "contracts/YourContract.sol:YourContract",
                "label": "owner",
                "offset": 0,
                "slot": "0",
                "type": "t_address"
              },
              {
                "label": "greeting",
                "slot": "1",
                "type": "t_string_storage"
              }
            ]
          },
          "userdoc": {...},                            // ← 用户文档
          "devdoc": {...}                              // ← 开发者文档
        }
      }
    },
    "sources": {
      "contracts/YourContract.sol": {
        "id": 0,
        "ast": {...}                                   // ← 抽象语法树（AST）
      }
    }
  }
}
```

**为什么这么大（2.3MB）？**

```
包含内容：
├─ 完整的源码（所有 .sol 文件）
├─ AST（抽象语法树）- 详细的语法结构
├─ 源码映射（source maps）- 字节码到源码的映射
├─ 操作码（opcodes）- EVM 指令
├─ Gas 估算
├─ 存储布局
├─ 文档（NatSpec）
└─ 元数据

→ 包含了编译的所有信息
```

**用途：**

```
1. 调试和错误追踪
   ├─ 源码映射：字节码错误 → 源码行号
   └─ 堆栈跟踪：准确定位错误位置

2. 合约验证（Etherscan）
   ├─ 提供完整的源码
   ├─ 编译器版本
   └─ 编译设置
   → 证明链上字节码与源码匹配

3. Gas 优化
   ├─ gasEstimates：每个函数的 gas 消耗
   └─ 优化建议

4. 存储分析
   ├─ storageLayout：状态变量的存储位置
   └─ 存储优化

5. 生成文档
   ├─ userdoc：用户文档
   └─ devdoc：开发者文档
```

## 🔄 编译流程

### 完整流程

```
yarn hardhat compile
    ↓
1️⃣ Solidity 编译器启动
    ├─ 读取所有 .sol 文件
    ├─ 解析语法生成 AST
    ├─ 语义分析
    └─ 生成 EVM 字节码
    ↓
2️⃣ 生成 contracts/ 目录
    ├─ 为每个合约创建子目录
    ├─ 生成 ContractName.json（ABI + bytecode）
    └─ 生成 ContractName.dbg.json（调试信息）
    ↓
3️⃣ 生成 hardhat/ 目录
    └─ 编译导入的 Hardhat 库（console.sol）
    ↓
4️⃣ 生成 build-info/ 目录
    ├─ 计算编译输入的哈希值
    ├─ 保存完整的编译信息
    └─ 用于调试和合约验证
    ↓
5️⃣ 更新 cache/
    └─ 保存文件哈希，用于增量编译
```

### 增量编译

```
第二次编译（未修改文件）:

检查 cache/solidity-files-cache.json
    ↓
文件哈希未变化
    ↓
跳过编译 ⚡
    ↓
artifacts/ 保持不变
```

## 📊 文件大小对比

| 文件 | 大小 | 内容 |
|------|------|------|
| **YourContract.json** | ~50KB | ABI + bytecode |
| **YourContract.dbg.json** | ~100B | 指向 build-info 的链接 |
| **build-info/*.json** | ~2.3MB | 完整的编译信息 |
| **总计** | ~2.4MB | 单个合约的所有产物 |

### 为什么 build-info 这么大？

```
build-info（2.3MB）包含：
├─ 完整源码（10KB）
├─ AST（500KB）- 详细的语法树
├─ 源码映射（500KB）- 字节码到源码的映射
├─ 操作码（300KB）- EVM 指令序列
├─ 存储布局（100KB）
├─ Gas 估算（50KB）
├─ 文档和元数据（100KB）
└─ console.sol 的所有信息（700KB）

大部分是 AST 和源码映射
→ 用于精确的调试和错误追踪
```

## 🧹 清理 artifacts

### 为什么要清理？

```
场景 1：修改了编译器配置
├─ 改变 optimizer 设置
├─ 改变 Solidity 版本
└─ 旧的 artifacts 可能不匹配

场景 2：切换 Git 分支
├─ 不同分支可能有不同的合约
└─ 避免使用错误的 artifacts

场景 3：调试编译错误
└─ 清除缓存，重新开始
```

### 清理命令

```bash
# 完全清理
yarn hardhat clean

# 删除的内容：
rm -rf artifacts/
rm -rf cache/
rm -rf typechain-types/

# 保留的内容：
✅ contracts/（源码）
✅ test/（测试）
✅ deployments/（部署记录）

# 下次编译会重新生成所有 artifacts
yarn hardhat compile
```

## 💡 实际使用场景

### 场景 1：部署合约

```typescript
// deploy/00_deploy_your_contract.ts
import { HardhatRuntimeEnvironment } from "hardhat/types";

async function main(hre: HardhatRuntimeEnvironment) {
  // Hardhat 自动读取 artifacts
  const YourContract = await hre.ethers.getContractFactory("YourContract");

  // 内部读取：
  // - artifacts/contracts/YourContract.sol/YourContract.json
  // - 获取 abi 和 bytecode

  const contract = await YourContract.deploy(deployer);
  // 使用 bytecode 部署合约
}
```

### 场景 2：测试合约

```typescript
// test/YourContract.ts
import { ethers } from "hardhat";

describe("YourContract", function () {
  it("Should set greeting", async function () {
    // Hardhat 读取 artifacts
    const YourContract = await ethers.getContractFactory("YourContract");
    const contract = await YourContract.deploy(owner.address);

    await contract.setGreeting("Hello");
    expect(await contract.greeting()).to.equal("Hello");
  });
});
```

### 场景 3：前端交互

```typescript
// 前端代码
import YourContractArtifact from "../artifacts/contracts/YourContract.sol/YourContract.json";
import { ethers } from "ethers";

// 使用 ABI 创建合约实例
const contract = new ethers.Contract(
  contractAddress,
  YourContractArtifact.abi,  // ← 从 artifacts 读取 ABI
  provider
);

// 调用合约函数
const greeting = await contract.greeting();
await contract.setGreeting("New greeting");
```

### 场景 4：合约验证

```bash
# Etherscan 验证需要 build-info
yarn hardhat verify --network sepolia 0x1234... "constructor args"

# Hardhat 会：
1. 读取 build-info/*.json
2. 提取完整的源码和编译配置
3. 上传到 Etherscan
4. Etherscan 重新编译
5. 比对字节码
6. 验证通过 ✅
```

## 📁 .gitignore 配置

### 推荐配置

```gitignore
# artifacts/ - 不提交
artifacts/

# 原因：
1. ✅ 自动生成的文件
2. ✅ 文件很大（2.3MB+ per contract）
3. ✅ 每个开发者可以本地重新编译
4. ✅ 减小仓库体积

# build-info/ 特别大
artifacts/build-info/  # 2.3MB+ per compile

# 但可以选择保留（用于合约验证）
!artifacts/contracts/**/*.json  # 保留 ABI + bytecode（如果需要）
```

### 是否提交 artifacts?

```
不提交（推荐）：
✅ 减小仓库体积
✅ 避免合并冲突
✅ 每个开发者编译最新版本

提交：
⚠️ 仓库很大
⚠️ 频繁的合并冲突
✅ CI/CD 可以跳过编译（稍快）
✅ 包含历史编译记录
```

## 🎓 总结

### artifacts/ 目录结构

| 目录/文件 | 大小 | 作用 | 谁使用 |
|----------|------|------|--------|
| **contracts/[Contract].json** | ~50KB | ABI + bytecode | 部署、测试、前端 |
| **contracts/[Contract].dbg.json** | ~100B | 调试信息链接 | Hardhat 调试器 |
| **hardhat/console.sol/console.json** | ~10KB | 调试库 | console.log |
| **build-info/*.json** | ~2.3MB | 完整编译信息 | 调试、验证、分析 |

### 关键要点

1. **ABI** - 与合约交互的接口
2. **bytecode** - 部署到区块链的代码
3. **源码映射** - 错误追踪到源码行号
4. **完整性** - build-info 包含所有编译信息

### 使用流程

```
编译 → 生成 artifacts
    ↓
部署：读取 bytecode
测试：读取 ABI + bytecode
前端：读取 ABI
调试：读取 source maps
验证：读取 build-info
```

### 与其他目录的关系

```
contracts/         ← 源码
    ↓ 编译
artifacts/         ← 编译产物（ABI + bytecode）
    ↓ 类型生成
typechain-types/   ← TypeScript 类型
    ↓ 部署
deployments/       ← 部署记录（地址）
    ↓ 同步
packages/nextjs/contracts/deployedContracts.ts  ← 前端配置
```

artifacts/ 是智能合约开发的核心产物，包含了部署、测试、交互所需的所有信息！
