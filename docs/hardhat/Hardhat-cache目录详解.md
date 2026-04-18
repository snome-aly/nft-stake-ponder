# Hardhat Cache 目录详解

## 📁 目录位置

```
packages/hardhat/
├── cache/
│   └── solidity-files-cache.json
├── artifacts/
├── contracts/
└── hardhat.config.ts
```

## ⏰ 什么时候生成？

### 生成时机

**第一次运行任何需要编译的命令时自动生成：**

```bash
# 这些命令会触发编译，生成 cache 目录
yarn hardhat compile
yarn hardhat test
yarn hardhat node
yarn deploy

# 第一次执行时：
1. Hardhat 读取合约文件
2. 计算文件哈希
3. 创建 cache/solidity-files-cache.json
4. 执行编译
5. 生成 artifacts/
```

### 生成流程

```
用户执行 yarn hardhat compile
    ↓
Hardhat 启动
    ↓
检查 cache/ 是否存在
    ↓ 不存在
创建 cache/ 目录
    ↓
扫描 contracts/ 目录
    ↓
为每个 .sol 文件计算元数据：
├─ lastModificationDate: 文件最后修改时间
├─ contentHash: 文件内容的 MD5 哈希
├─ imports: 导入的其他合约
├─ versionPragmas: Solidity 版本要求
└─ solcConfig: 编译器配置
    ↓
保存到 solidity-files-cache.json
    ↓
执行编译
```

## 🎯 主要作用

### 作用 1：增量编译（最重要）

**问题：** 每次编译所有合约太慢

```bash
# 没有缓存
yarn hardhat compile
# → 编译所有 10 个合约，耗时 30 秒

# 修改一个合约
# → 再次编译所有 10 个合约，耗时 30 秒

# 再修改一个合约
# → 又编译所有 10 个合约，耗时 30 秒
```

**解决：** 使用缓存跳过未修改的文件

```bash
# 第一次编译
yarn hardhat compile
# → 编译所有 10 个合约，耗时 30 秒
# → 保存每个文件的 contentHash 到 cache

# 修改 YourContract.sol
yarn hardhat compile
# → 检查 cache，发现只有 YourContract.sol 的哈希变了
# → 只编译 YourContract.sol，耗时 3 秒 ⚡

# 没有修改任何文件
yarn hardhat compile
# → 检查 cache，所有文件的哈希都没变
# → 跳过编译，耗时 < 1 秒 🚀
```

### 作用 2：依赖追踪

**追踪合约间的导入关系：**

```solidity
// YourContract.sol
import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// cache 会记录
{
  "imports": [
    "hardhat/console.sol",
    "@openzeppelin/contracts/access/Ownable.sol"
  ]
}
```

**智能重编译：**

```bash
# 修改 Ownable.sol（OpenZeppelin 合约）
yarn hardhat compile

# Hardhat 会：
1. 检测到 Ownable.sol 变化
2. 查找所有导入 Ownable.sol 的合约
3. 重新编译 YourContract.sol（因为它依赖 Ownable）
4. 跳过其他不相关的合约
```

### 作用 3：版本兼容性检查

**记录编译器配置：**

```json
{
  "solcConfig": {
    "version": "0.8.20",
    "settings": {
      "optimizer": {
        "enabled": true,
        "runs": 200
      }
    }
  }
}
```

**检测配置变化：**

```bash
# 场景：你修改了 hardhat.config.ts 中的编译器版本
solidity: {
  version: "0.8.20"  // 改为 "0.8.21"
}

# 下次编译时
yarn hardhat compile
# → Hardhat 检测到编译器版本变化
# → 自动清除缓存
# → 重新编译所有合约（因为不同版本可能产生不同字节码）
```

### 作用 4：节省开发时间

**实际开发场景：**

```
项目有 20 个合约，每个编译需要 2 秒
总编译时间：40 秒

开发过程中：
├─ 修改合约 → 测试 → 修改 → 测试（重复 100 次）
├─ 没有缓存：100 × 40秒 = 4000秒 ≈ 1小时
└─ 有缓存：100 × 2秒 = 200秒 ≈ 3分钟

节省：57分钟 ⏱️
```

## 📊 Cache 文件结构详解

### solidity-files-cache.json 结构

```json
{
  "_format": "hh-sol-cache-2",  // 缓存格式版本
  "files": {
    "/绝对路径/contracts/YourContract.sol": {
      // 1️⃣ 文件修改时间（Unix 时间戳）
      "lastModificationDate": 1761625405293,

      // 2️⃣ 文件内容的 MD5 哈希（检测内容是否变化）
      "contentHash": "fd06d4791aa5d282a28da26b6efe2c57",

      // 3️⃣ 源文件的相对路径
      "sourceName": "contracts/YourContract.sol",

      // 4️⃣ 编译器配置（用于检测配置变化）
      "solcConfig": {
        "version": "0.8.20",
        "settings": {
          "optimizer": { "enabled": true, "runs": 200 },
          "evmVersion": "paris",
          "outputSelection": { /* 输出选项 */ }
        }
      },

      // 5️⃣ 导入的其他合约（依赖追踪）
      "imports": [
        "hardhat/console.sol"
      ],

      // 6️⃣ Solidity 版本要求（pragma 声明）
      "versionPragmas": [
        ">=0.8.0 <0.9.0"
      ],

      // 7️⃣ 生成的编译产物名称
      "artifacts": [
        "YourContract"
      ]
    }
  }
}
```

### 关键字段说明

| 字段 | 作用 | 示例 |
|------|------|------|
| **lastModificationDate** | 文件最后修改时间 | 1761625405293 |
| **contentHash** | 内容哈希（MD5） | fd06d4791aa5d282a28da26b6efe2c57 |
| **imports** | 依赖的合约列表 | ["hardhat/console.sol"] |
| **versionPragmas** | 版本声明 | [">=0.8.0 <0.9.0"] |
| **solcConfig** | 编译器配置 | version, optimizer, etc. |
| **artifacts** | 生成的产物名称 | ["YourContract"] |

## 🔄 增量编译工作流程

### 完整流程

```
1. yarn hardhat compile
    ↓
2. Hardhat 读取 cache/solidity-files-cache.json
    ↓
3. 遍历 contracts/ 目录下的所有 .sol 文件
    ↓
4. 对每个文件：
    ├─ 计算当前的 contentHash
    ├─ 读取缓存中的 contentHash
    └─ 比较两者
    ↓
5. 分类文件：
    ├─ 未变化的文件 → 跳过编译
    ├─ 已变化的文件 → 需要编译
    └─ 新增的文件 → 需要编译
    ↓
6. 检查依赖关系：
    ├─ 如果 A.sol 变化
    ├─ 查找所有导入 A.sol 的文件
    └─ 将这些文件也标记为需要编译
    ↓
7. 只编译需要编译的文件
    ↓
8. 更新 cache/solidity-files-cache.json
    └─ 保存新的 contentHash 和 lastModificationDate
```

### 示例：三个合约的编译

```solidity
// A.sol
contract A {
    uint256 public value;
}

// B.sol
import "./A.sol";
contract B is A {
    // ...
}

// C.sol（独立，不依赖 A 或 B）
contract C {
    // ...
}
```

**场景 1：修改 A.sol**

```bash
yarn hardhat compile

# Hardhat 的决策：
# ✅ 编译 A.sol（文件变化）
# ✅ 编译 B.sol（依赖 A.sol）
# ❌ 跳过 C.sol（独立，无关）
```

**场景 2：修改 C.sol**

```bash
yarn hardhat compile

# Hardhat 的决策：
# ❌ 跳过 A.sol（未变化）
# ❌ 跳过 B.sol（未变化）
# ✅ 编译 C.sol（文件变化）
```

**场景 3：没有修改任何文件**

```bash
yarn hardhat compile

# Hardhat 的决策：
# ❌ 跳过 A.sol（未变化）
# ❌ 跳过 B.sol（未变化）
# ❌ 跳过 C.sol（未变化）
# 输出：Nothing to compile
```

## 🧹 清除缓存

### 什么时候需要清除缓存？

```bash
# 场景 1：编译出现奇怪的错误
yarn hardhat clean

# 场景 2：修改了编译器配置但没有生效
yarn hardhat clean

# 场景 3：想要强制重新编译所有合约
yarn hardhat clean && yarn hardhat compile

# 场景 4：切换了 Git 分支
git checkout feature-branch
yarn hardhat clean
```

### clean 命令做了什么？

```bash
yarn hardhat clean

# 删除的内容：
rm -rf cache/
rm -rf artifacts/
rm -rf typechain-types/

# 保留的内容：
✅ contracts/（源码）
✅ deployments/（部署记录）
✅ test/（测试文件）
✅ hardhat.config.ts（配置文件）
```

### 手动清除

```bash
# 只清除缓存
rm -rf packages/hardhat/cache

# 清除缓存和编译产物
rm -rf packages/hardhat/cache packages/hardhat/artifacts

# 下次编译时会自动重建
yarn hardhat compile
```

## 📁 相关目录对比

### cache/ vs artifacts/ vs typechain-types/

| 目录 | 内容 | 作用 | 何时生成 | 可否删除 |
|------|------|------|----------|---------|
| **cache/** | solidity-files-cache.json | 编译缓存，加速重编译 | compile | ✅ 可删除 |
| **artifacts/** | 编译产物（bytecode + ABI） | 部署和测试使用 | compile | ✅ 可删除 |
| **typechain-types/** | TypeScript 类型定义 | 开发时类型检查 | compile | ✅ 可删除 |
| **deployments/** | 部署记录 | 保存链上合约地址 | deploy | ⚠️ 不建议删除 |

### 生成顺序

```
1. yarn hardhat compile
    ↓
├─ 生成 cache/solidity-files-cache.json
├─ 生成 artifacts/**/*.json
└─ 生成 typechain-types/**/*.ts
    ↓
2. yarn deploy
    ↓
└─ 生成 deployments/**/*.json
```

## ⚙️ .gitignore 配置

### 推荐配置

```gitignore
# Hardhat
cache/              # ✅ 不提交缓存
artifacts/          # ✅ 不提交编译产物
typechain-types/    # ✅ 不提交生成的类型

# 保留源码和配置
contracts/          # ❌ 提交源码
hardhat.config.ts   # ❌ 提交配置
deploy/             # ❌ 提交部署脚本

# 部署记录（根据需求）
deployments/localhost/  # ✅ 不提交本地部署
deployments/sepolia/    # ⚠️ 可以提交（团队共享）
deployments/mainnet/    # ⚠️ 可以提交（重要记录）
```

### 为什么不提交 cache/?

```
原因：
1. ✅ 每次 clone 后重新生成（很快）
2. ✅ 包含绝对路径（每个开发者不同）
3. ✅ 自动生成的文件（不是源码）
4. ✅ 减小仓库体积
```

## 🔍 调试和查看

### 查看缓存信息

```bash
# 查看缓存文件
cat packages/hardhat/cache/solidity-files-cache.json | jq

# 查看某个合约的缓存
cat packages/hardhat/cache/solidity-files-cache.json | jq '.files."contracts/YourContract.sol"'

# 查看所有合约的 contentHash
cat packages/hardhat/cache/solidity-files-cache.json | jq '.files | to_entries[] | {name: .key, hash: .value.contentHash}'
```

### 强制重新编译

```bash
# 方法 1：清除缓存后编译
yarn hardhat clean && yarn hardhat compile

# 方法 2：使用 --force 标志
yarn hardhat compile --force

# 方法 3：只清除缓存
rm -rf cache && yarn hardhat compile
```

### 调试编译问题

```bash
# 查看详细的编译日志
yarn hardhat compile --verbose

# 查看 Hardhat 使用的配置
yarn hardhat config

# 检查 Solidity 编译器版本
yarn hardhat compile --show-stack-traces
```

## 💡 最佳实践

### 1. 定期清理

```bash
# 在 package.json 中添加清理脚本
{
  "scripts": {
    "clean": "hardhat clean",
    "rebuild": "hardhat clean && hardhat compile"
  }
}

# 使用
yarn clean        # 清理
yarn rebuild      # 重新构建
```

### 2. CI/CD 中不使用缓存

```yaml
# .github/workflows/test.yml
- name: Install dependencies
  run: yarn install

- name: Compile contracts (no cache)
  run: yarn hardhat clean && yarn hardhat compile

- name: Run tests
  run: yarn hardhat test
```

**原因：** CI 环境是临时的，每次都是全新环境，缓存没有意义。

### 3. 开发时保留缓存

```bash
# ✅ 正常开发流程
yarn hardhat compile  # 使用缓存，快速编译

# ❌ 不要每次都清理
yarn hardhat clean && yarn hardhat compile  # 太慢
```

### 4. 遇到问题时清理

```bash
# 如果出现：
# - 奇怪的编译错误
# - 修改没有生效
# - Type 错误

# 解决：
yarn hardhat clean
yarn hardhat compile
```

## 🎓 总结

### cache/ 目录的作用

| 作用 | 说明 | 效果 |
|------|------|------|
| **增量编译** | 只编译变化的文件 | 编译速度提升 10-100 倍 |
| **依赖追踪** | 追踪合约导入关系 | 智能重编译依赖 |
| **版本检查** | 检测编译器配置变化 | 避免不一致问题 |
| **开发体验** | 快速反馈 | 节省大量时间 |

### 何时生成？

```
第一次执行以下命令时：
- yarn hardhat compile
- yarn hardhat test
- yarn hardhat node
- yarn deploy
```

### 何时清除？

```
出现问题时：
- 编译错误
- 修改未生效
- 切换分支

自动清除：
- yarn hardhat clean
- 修改编译器配置
```

### 关键要点

1. ✅ **自动生成**：无需手动创建
2. ✅ **可以删除**：删除后会自动重建
3. ✅ **不提交 Git**：每个开发者独立生成
4. ✅ **加速编译**：只编译变化的文件
5. ✅ **智能追踪**：自动处理依赖关系

### 类比

```
cache/ = 工厂的生产记录

没有记录：
├─ 每次都要检查所有零件
├─ 重新制造所有产品
└─ 耗时很长

有记录：
├─ 只检查变化的零件
├─ 只制造需要更新的产品
└─ 效率提升 10 倍+
```

cache/ 目录是 Hardhat 的核心优化功能，让智能合约开发更加高效！⚡
