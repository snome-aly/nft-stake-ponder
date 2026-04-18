# 部署脚本快速参考卡

> 一页纸速查手册 - 5 分钟掌握核心要点

---

## 🎯 核心原则 (3 句话记住)

1. **`deploy()` 有幂等性，其他代码需要自己实现**
2. **一次性+必需 → deploy/ | 可重复+管理 → scripts/**
3. **所有初始化操作前必须检查状态**

---

## ⚡ 快速决策树

```
这个操作...
├─ 只执行一次？
│  ├─ 是，且部署必需 → deploy/ 同一文件
│  └─ 是，但可延后 → deploy/ 独立文件
└─ 可重复执行？
   └─ 是 → scripts/
```

---

## 📋 对比速查表

| 特性 | deploy/ | scripts/ |
|------|---------|----------|
| 执行 | `yarn deploy` | `yarn hardhat run` |
| 幂等性 | ✅ 自动（仅 deploy） | ❌ 需手动 |
| 状态 | ✅ 自动保存 | ❌ 无 |
| 依赖 | ✅ 支持 | ❌ 无 |

---

## 📂 目录结构模板

```
deploy/
└── 00_deploy_stakable_nft.ts   # 部署 + 初始化

scripts/
├── management/
│   ├── grantRole.ts            # 授予角色
│   └── updateMultipliers.ts    # 更新参数
└── operations/
    ├── pause.ts                # 暂停
    └── withdraw.ts             # 提现
```

---

## 💻 代码模板

### Deploy 脚本

```typescript
const deployFunc: DeployFunction = async (hre) => {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // 1. 部署（自动幂等）
  await deploy("MyContract", {
    from: deployer,
    args: [arg1, arg2],
    log: true,
  });

  // 2. 初始化（手动幂等）
  const contract = await hre.ethers.getContract("MyContract");

  if (!(await contract.isInitialized())) {
    await contract.initialize();
  }
};

export default deployFunc;
deployFunc.tags = ["MyContract"];
```

### Script 脚本

```typescript
async function main() {
  const param = process.env.PARAM;
  const contract = await ethers.getContract("MyContract");

  await contract.doSomething(param);
  console.log("✅ 完成");
}

main().catch(console.error);
```

---

## 🛡️ 幂等性检查模板

```typescript
// ✅ 一次性操作
if (!(await nft.rarityPoolSet())) {
  await nft.setRarityPool(pool);
}

// ✅ 可重复操作
if (!(await nft.hasRole(ROLE, address))) {
  await nft.grantRoleTo(ROLE, address);
}
```

---

## 🔧 常用命令

```bash
# 部署
yarn deploy                              # 本地
yarn deploy --network sepolia            # 测试网
yarn deploy --tags MyContract            # 指定标签

# 运行脚本
yarn hardhat run scripts/xxx.ts
ADDRESS=0x... yarn hardhat run scripts/xxx.ts

# 状态管理
cat deployments/localhost/MyContract.json | grep address
rm -rf deployments/localhost/            # 清理
```

---

## ⚠️ 常见陷阱

### ❌ 错误
```typescript
await deploy("NFT", { ... });
await nft.setRarityPool(pool);  // 每次都执行！
```

### ✅ 正确
```typescript
await deploy("NFT", { ... });
if (!(await nft.rarityPoolSet())) {  // 检查状态
  await nft.setRarityPool(pool);
}
```

---

## 📝 检查清单

部署脚本完成后检查：

- [ ] 所有 `deploy()` 之后的代码都有状态检查？
- [ ] 使用了 `deployment.newlyDeployed` 或手动检查？
- [ ] 日志清晰（成功/跳过/失败）？
- [ ] 配置了 tags 和 dependencies？
- [ ] 可重复执行操作放在 scripts/？

---

## 🎓 学习路径

1. 阅读 `docs/deployment-guide.md` - 完整学习笔记
2. 查看 `packages/hardhat/DEPLOY_*.md` - 详细原理
3. 参考 `deploy/00_deploy_your_contract.ts` - 示例代码

---

**快速链接：**
- 📚 [完整学习笔记](./deployment-guide.md)
- 🔗 [Hardhat Deploy 文档](https://github.com/wighawag/hardhat-deploy)
