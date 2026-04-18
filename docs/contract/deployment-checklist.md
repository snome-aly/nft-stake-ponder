# 部署脚本编写检查清单

> 在编写完部署脚本后，使用此清单确保代码质量

---

## ✅ 代码质量检查

### 基础结构
- [ ] 导入了正确的类型 (`DeployFunction`, `HardhatRuntimeEnvironment`)
- [ ] 使用 `async function` 声明部署函数
- [ ] 正确导出：`export default deployFunc`
- [ ] 设置了 tags：`deployFunc.tags = ["ContractName"]`
- [ ] 如有依赖，设置了 dependencies：`deployFunc.dependencies = ["OtherContract"]`

### 部署配置
- [ ] 使用 `getNamedAccounts()` 而非 `getSigners()`
- [ ] `deploy()` 函数包含必要参数：
  - [ ] `from: deployer`
  - [ ] `args: [...]` （构造参数）
  - [ ] `log: true`
- [ ] 在开发环境使用 `autoMine: true`

### 幂等性保护 ⚠️ 关键
- [ ] 所有 `deploy()` 之后的操作都有状态检查
- [ ] 一次性操作使用了防重复检查（如 `if (!rarityPoolSet)`）
- [ ] 可重复操作也添加了检查（避免浪费 gas）
- [ ] 使用了清晰的日志输出（✅ 完成 / ⏭️  跳过）

---

## 🔍 具体操作检查

### 对于 setRarityPool()
```typescript
// ✅ 正确
const rarityPoolSet = await nft.rarityPoolSet();
if (!rarityPoolSet) {
  await nft.setRarityPool(pool);
  console.log("✅ 稀有度池设置完成");
} else {
  console.log("⏭️  稀有度池已设置");
}

// ❌ 错误
await nft.setRarityPool(pool);  // 第二次会报错
```
- [ ] 已添加状态检查

### 对于 grantRoleTo()
```typescript
// ✅ 正确
const hasRole = await nft.hasRole(OPERATOR_ROLE, operator);
if (!hasRole) {
  await nft.grantRoleTo(OPERATOR_ROLE, operator);
  console.log("✅ 角色授予完成");
} else {
  console.log("⏭️  角色已存在");
}

// ⚠️ 可行但不推荐
await nft.grantRoleTo(OPERATOR_ROLE, operator);  // 浪费 gas
```
- [ ] 已添加状态检查

### 对于其他配置操作
- [ ] 所有可能重复执行的操作都有状态检查
- [ ] 检查逻辑正确（例如：`!` 取反的位置）

---

## 📝 日志输出检查

### 结构化日志
- [ ] 使用了清晰的分隔线
- [ ] 使用了表情符号提高可读性
- [ ] 区分了不同类型的日志：
  - 🚀 开始
  - 📦 部署
  - 🔧 配置
  - ✅ 成功
  - ⏭️  跳过
  - ❌ 错误

### 示例
```typescript
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("🚀 部署 StakableNFT");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

console.log("\n📦 1. 部署合约");
console.log("  ✅ 新部署: 0x123...");
console.log("  ⏭️  重用现有部署");

console.log("\n✅ 所有设置完成");
```
- [ ] 日志格式正确
- [ ] 日志信息清晰

---

## 🛡️ 错误处理

- [ ] 关键操作包含 try-catch（如果需要）
- [ ] 错误信息清晰易懂
- [ ] 失败时有明确的提示

```typescript
try {
  await riskyOperation();
} catch (error: any) {
  console.error("❌ 操作失败:", error.message);
  throw error;  // 或者处理后继续
}
```

---

## 🌐 环境适配

- [ ] 考虑了不同网络的配置差异
- [ ] 开发环境和生产环境的处理不同（如果需要）

```typescript
const isDev = hre.network.name === "localhost" || hre.network.name === "hardhat";
const isProd = hre.network.name === "mainnet";

if (isDev) {
  // 开发环境特殊处理
}
```

---

## 📂 文件组织

- [ ] 文件命名正确（数字前缀 + 描述性名称）
- [ ] 放在了正确的目录：
  - [ ] 部署 + 一次性初始化 → `deploy/`
  - [ ] 可重复 + 管理操作 → `scripts/`
- [ ] 如果是多文件策略，dependencies 设置正确

---

## 🧪 测试检查

### 本地测试
- [ ] 在本地网络测试过（`yarn chain` + `yarn deploy`）
- [ ] 第一次部署成功
- [ ] 第二次部署（无修改）正确跳过
- [ ] 修改代码后能正确重新部署

### 测试网验证
- [ ] 在测试网（如 Sepolia）部署成功
- [ ] 验证了合约功能正常
- [ ] 检查了 gas 消耗合理

### 清理测试
```bash
# 清理部署记录
rm -rf deployments/localhost/

# 重新部署
yarn deploy

# 验证幂等性
yarn deploy  # 应该跳过部署
```
- [ ] 清理后重新部署成功
- [ ] 重复部署正确跳过

---

## 📋 代码审查清单

### 代码质量
- [ ] 变量命名清晰
- [ ] 没有硬编码的值（使用配置或环境变量）
- [ ] 代码格式符合项目规范
- [ ] 删除了调试用的 console.log

### 安全检查
- [ ] 敏感信息（私钥等）不在代码中
- [ ] 使用了 `namedAccounts` 而非硬编码地址
- [ ] 关键操作有权限检查

### 性能优化
- [ ] 避免不必要的链上查询
- [ ] 批量操作合并执行（如果可能）
- [ ] 等待交易确认：`await tx.wait()`

---

## 📚 文档检查

- [ ] 添加了必要的注释
- [ ] 复杂逻辑有说明
- [ ] 使用说明清晰（如果是 scripts/）

```typescript
/**
 * 授予角色
 *
 * 用法:
 * ADDRESS=0x123... ROLE=OPERATOR yarn hardhat run scripts/management/grantRole.ts --network sepolia
 */
```

---

## 🎯 最终检查

部署到生产环境前：
- [ ] 所有测试通过
- [ ] 在测试网验证成功
- [ ] 团队成员代码审查通过
- [ ] 备份了重要的部署脚本
- [ ] 准备好回滚方案（如果需要）

---

## ✅ 完成标志

当你可以回答"是"时，部署脚本就准备好了：

1. **重复执行安全吗？**
   - 执行 `yarn deploy` 多次不会出错或浪费 gas

2. **状态管理正确吗？**
   - 所有初始化操作都有状态检查

3. **日志清晰吗？**
   - 从日志可以清楚了解执行了什么、跳过了什么

4. **可维护吗？**
   - 代码结构清晰，易于理解和修改

5. **已测试吗？**
   - 在本地和测试网都验证过

---

## 📝 使用建议

1. **编写时**：逐项检查基础结构和幂等性保护
2. **完成后**：运行本清单的所有检查项
3. **提交前**：确保所有 ✅ 都已勾选
4. **部署前**：再次复查最终检查部分

---

**记住：** 良好的部署脚本应该是幂等的、可重复的、可维护的！
