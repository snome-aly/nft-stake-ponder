# Solhint 安装与配置指南

> 5分钟为项目添加 Solidity 代码检查工具

---

## 📋 安装步骤

### Step 1: 安装 solhint 包（2分钟）

```bash
# 进入 hardhat 目录
cd packages/hardhat

# 安装 solhint（Solidity linter）
yarn add -D solhint

# 可选：安装 prettier 插件（保持代码格式一致）
yarn add -D solhint-plugin-prettier
```

**预期结果**：
- ✅ `package.json` 的 `devDependencies` 中出现 `solhint`
- ✅ 安装过程没有报错

---

### Step 2: 创建 solhint 配置文件（2分钟）

在 `packages/hardhat` 目录下创建文件 `.solhint.json`：

```bash
# 创建配置文件（在 packages/hardhat 目录下）
touch .solhint.json
```

然后编辑 `.solhint.json`，粘贴以下内容：

```json
{
  "extends": "solhint:recommended",
  "plugins": [],
  "rules": {
    "compiler-version": ["error", "^0.8.20"],
    "func-visibility": ["warn", { "ignoreConstructors": true }],
    "no-console": "warn",
    "no-empty-blocks": "warn",
    "no-unused-vars": "warn",
    "avoid-low-level-calls": "warn",
    "reason-string": ["warn", { "maxLength": 64 }]
  }
}
```

**配置说明**：
- `"extends": "solhint:recommended"` - 使用推荐的基础规则集
- `"no-console": "warn"` - 检查 console.sol 的使用（警告级别）
- `"compiler-version"` - 确保使用正确的编译器版本
- `"func-visibility"` - 检查函数可见性声明

---

### Step 3: 添加 npm 脚本（1分钟）

编辑 `packages/hardhat/package.json`，在 `scripts` 部分添加：

```json
{
  "scripts": {
    "account": "hardhat run scripts/listAccount.ts",
    "account:generate": "hardhat run scripts/generateAccount.ts",
    "account:import": "hardhat run scripts/importAccount.ts",
    "account:reveal-pk": "hardhat run scripts/revealPK.ts",
    "chain": "hardhat node --network hardhat --no-deploy",
    "check-types": "tsc --noEmit --incremental",
    "clean": "hardhat clean",
    "compile": "hardhat compile",
    "deploy": "ts-node scripts/runHardhatDeployWithPK.ts",
    "flatten": "hardhat flatten",
    "fork": "MAINNET_FORKING_ENABLED=true hardhat node --network hardhat --no-deploy",
    "format": "prettier --write './**/*.(ts|sol)'",
    "generate": "yarn account:generate",
    "hardhat-verify": "hardhat verify",
    "lint": "eslint",
    "lint:sol": "solhint 'contracts/**/*.sol'",
    "lint-staged": "eslint",
    "test": "REPORT_GAS=true hardhat test --network hardhat",
    "verify": "hardhat etherscan-verify"
  }
}
```

**关键改动**：
添加了这一行：
```json
"lint:sol": "solhint 'contracts/**/*.sol'",
```

⚠️ **注意**：引号必须正确，`'contracts/**/*.sol'` 使用单引号

---

### Step 4: 更新根目录的 lint 脚本（可选）

如果想让 `yarn lint` 同时检查 TS 和 Sol 文件，编辑根目录的 `package.json`：

找到第 38 行：
```json
"lint": "yarn next:lint && yarn hardhat:lint",
```

改为：
```json
"lint": "yarn next:lint && yarn hardhat:lint && yarn workspace @se-2/hardhat lint:sol",
```

**或者**保持原样，手动运行 `yarn hardhat:lint:sol`（更灵活）

---

### Step 5: 验证安装（1分钟）

#### 5.1 测试 solhint 命令

```bash
# 在 packages/hardhat 目录下
yarn lint:sol
```

**预期结果**：

如果没有 `.sol` 文件或文件都符合规范：
```
✨  Done in 0.5s.
```

如果有问题（比如 `YourContract.sol` 用了 console）：
```
/path/to/YourContract.sol
  3:1  warning  Import of "hardhat/console.sol" is not recommended  no-console

✖ 1 problem (0 errors, 1 warning)
```

#### 5.2 测试是否能检测到 console

```bash
# 检查现有合约是否使用了 console
grep -n "hardhat/console" contracts/*.sol
```

如果找到了，再运行 `yarn lint:sol` 应该会看到警告。

---

## ✅ 安装完成检查清单

安装成功后，确认以下几点：

- [ ] `packages/hardhat/package.json` 的 `devDependencies` 包含 `solhint`
- [ ] `packages/hardhat/.solhint.json` 文件存在且内容正确
- [ ] `packages/hardhat/package.json` 的 `scripts` 包含 `"lint:sol"`
- [ ] 运行 `yarn hardhat:lint:sol` 能正常执行（无论有无警告）
- [ ] 可以看到 console.sol 的警告（如果代码中有的话）

---

## 🧪 测试 solhint 功能

### 测试 1: 检查现有合约

```bash
cd packages/hardhat
yarn lint:sol
```

如果 `YourContract.sol` 使用了 console，应该看到警告。

### 测试 2: 手动制造一个错误

在任意 `.sol` 文件中临时添加：

```solidity
// 故意写错：使用已弃用的语法
function test() {  // 缺少 visibility
    // ...
}
```

运行：
```bash
yarn lint:sol
```

应该看到警告：
```
warning  Explicitly mark visibility of function  func-visibility
```

改正后：
```solidity
function test() public {
    // ...
}
```

警告消失。

---

## 🎯 日常使用

### 开发时检查代码

```bash
# 只检查 Solidity
yarn lint:sol

# 只检查 TypeScript
yarn lint

# 全部检查（如果你修改了根目录的 lint 脚本）
yarn lint
```

### 自动修复（部分问题）

solhint 不像 prettier 那样能自动修复所有格式问题，但可以尝试：

```bash
yarn lint:sol --fix
```

大部分问题还是需要手动修复。

---

## 📊 Solhint 规则说明

### 当前配置的规则

| 规则名 | 级别 | 说明 | 示例 |
|--------|------|------|------|
| `compiler-version` | error | 检查编译器版本 | `pragma solidity ^0.8.20;` ✅ |
| `no-console` | warn | 检查 console.sol 使用 | `import "hardhat/console.sol";` ⚠️ |
| `func-visibility` | warn | 检查函数可见性 | `function test() public` ✅ |
| `no-empty-blocks` | warn | 检查空代码块 | `function test() { }` ⚠️ |
| `avoid-low-level-calls` | warn | 避免低级调用 | `.call()` `.delegatecall()` ⚠️ |

### 级别说明

- **error** (错误): 必须修复，否则 CI/CD 会失败
- **warn** (警告): 建议修复，但不会阻止编译
- **off** (关闭): 不检查

---

## 🔧 修改规则（可选）

### 开发阶段（宽松）

如果你觉得警告太多，可以暂时放松：

编辑 `.solhint.json`：
```json
{
  "rules": {
    "no-console": "off",
    "no-empty-blocks": "off"
  }
}
```

### 部署前（严格）

准备部署测试网前，改为严格模式：

```json
{
  "rules": {
    "no-console": "error",
    "no-empty-blocks": "error",
    "func-visibility": "error"
  }
}
```

---

## 💡 进阶配置

### 忽略特定文件

创建 `.solhintignore` 文件（在 `packages/hardhat` 目录）：

```
node_modules/
artifacts/
cache/
contracts/test/**
```

### 忽略特定行

在代码中添加注释：

```solidity
// solhint-disable-next-line no-console
import "hardhat/console.sol";

function test() public {
    // solhint-disable-next-line avoid-low-level-calls
    (bool success, ) = address(target).call(data);
}
```

---

## 🐛 常见问题

### 问题 1: 找不到 solhint 命令

**错误信息**：
```
command not found: solhint
```

**解决**：
```bash
# 确保在 packages/hardhat 目录
cd packages/hardhat

# 重新安装
yarn add -D solhint
```

### 问题 2: 配置文件不生效

**检查**：
- 文件名是 `.solhint.json`（注意开头的点）
- JSON 格式正确（没有多余的逗号）
- 文件位置：`packages/hardhat/.solhint.json`

### 问题 3: 没有检测到 console

**检查**：
- 配置中有 `"no-console": "warn"` 或 `"error"`
- 运行的是 `yarn lint:sol` 而不是 `yarn lint`
- 确保 `YourContract.sol` 确实 import 了 console.sol

---

## 🎓 学习资源

### Solhint 官方文档
https://github.com/protofire/solhint

### 所有可用规则
https://github.com/protofire/solhint/blob/master/docs/rules.md

### Solidity 风格指南
https://docs.soliditylang.org/en/latest/style-guide.html

---

## ✅ 完成标准

安装成功的标志：

1. ✅ 运行 `yarn lint:sol` 不报错（可以有警告）
2. ✅ 能检测到 `console.sol` 的使用
3. ✅ 能检测到缺少 visibility 的函数
4. ✅ 理解如何修改规则严格程度

---

## 🚀 下一步

安装完成后：

1. **运行一次** `yarn lint:sol` 看看现有代码有什么问题
2. **开始写 StakableNFT**，边写边用 lint 检查
3. **养成习惯**：写完一个函数就跑一次 `yarn lint:sol`

**祝你安装顺利！** 🎉

遇到问题随时告诉我。
