# 📚 项目文档索引

> 本目录包含项目的学习笔记和参考文档

---

## 📖 部署相关文档

### 1. 快速参考 ⚡
- **[deployment-quick-reference.md](./deployment-quick-reference.md)**
  - 一页纸速查手册
  - 5 分钟掌握核心要点
  - 包含代码模板和命令速查

### 2. 完整学习笔记 📚
- **[deployment-guide.md](./deployment-guide.md)**
  - Hardhat Deploy 完整指南
  - 核心概念和工作原理
  - 最佳实践和代码示例
  - 适合系统学习和复习

### 3. 可视化流程图 📊
- **[deployment-flowcharts.md](./deployment-flowcharts.md)**
  - 部署流程可视化
  - 幂等性检查流程图
  - 决策树和时间线
  - 直观理解工作原理

### 4. 编写检查清单 ✅
- **[deployment-checklist.md](./deployment-checklist.md)**
  - 部署脚本质量检查清单
  - 逐项检查确保代码质量
  - 避免常见错误
  - 适合编写完成后使用

---

## 🔧 Hardhat 包详细文档

位于 `packages/hardhat/` 目录：

### 原理解析
- **HOW_DEPLOY_WORKS.md** - 部署状态保存机制详解
- **DEPLOY_IDEMPOTENCY_TRAP.md** - 幂等性陷阱完全指南
- **DEPLOY_ORGANIZATION_STRATEGY.md** - 文件组织策略详解

### 示例代码
- **DEMO_DEPLOY_PROBLEM.ts** - 问题演示代码
- **deploy/00_deploy_your_contract.ts** - 实际部署脚本示例

---

## 🎯 学习路径建议

### 快速入门（15 分钟）⚡
1. 阅读 [deployment-quick-reference.md](./deployment-quick-reference.md) - 快速掌握核心要点
2. 查看 [deployment-flowcharts.md](./deployment-flowcharts.md) - 可视化理解流程
3. 查看 `deploy/00_deploy_your_contract.ts` - 参考示例代码

### 深入学习（1 小时）📚
1. 阅读 [deployment-guide.md](./deployment-guide.md) - 系统学习完整知识
2. 查看 `packages/hardhat/DEPLOY_*.md` 系列文档 - 理解原理细节
3. 实践编写自己的部署脚本

### 编写脚本时 ✍️
1. 参考 [deployment-quick-reference.md](./deployment-quick-reference.md) 的代码模板
2. 使用 [deployment-checklist.md](./deployment-checklist.md) 检查代码质量

### 问题排查 🔧
- 遇到重复执行问题 → `DEPLOY_IDEMPOTENCY_TRAP.md`
- 不确定文件放哪里 → `DEPLOY_ORGANIZATION_STRATEGY.md`
- 想了解工作原理 → `HOW_DEPLOY_WORKS.md`
- 需要可视化理解 → [deployment-flowcharts.md](./deployment-flowcharts.md)

---

## 📝 文档结构

```
docs/
├── README.md                           # 📍 本文件（索引）
├── deployment-quick-reference.md       # ⚡ 快速参考（5 分钟）
├── deployment-guide.md                 # 📚 完整指南（系统学习）
├── deployment-flowcharts.md            # 📊 可视化流程图
└── deployment-checklist.md             # ✅ 编写检查清单

packages/hardhat/
├── HOW_DEPLOY_WORKS.md                 # 🔍 工作原理详解
├── DEPLOY_IDEMPOTENCY_TRAP.md          # ⚠️ 幂等性陷阱
├── DEPLOY_ORGANIZATION_STRATEGY.md     # 📂 组织策略
└── DEMO_DEPLOY_PROBLEM.ts              # 💻 问题示例代码
```

---

## 🆘 常见问题快速导航

| 问题 | 查看文档 |
|------|---------|
| 部署脚本重复执行怎么办？ | `deployment-guide.md` § 4 |
| deploy/ 和 scripts/ 有什么区别？ | `deployment-guide.md` § 5 |
| 如何实现幂等性？ | `DEPLOY_IDEMPOTENCY_TRAP.md` |
| 初始化代码放哪里？ | `DEPLOY_ORGANIZATION_STRATEGY.md` |
| hardhat-deploy 如何工作的？ | `HOW_DEPLOY_WORKS.md` |
| 需要代码模板 | `deployment-quick-reference.md` |

---

## 🔗 外部资源

- [Hardhat Deploy 官方文档](https://github.com/wighawag/hardhat-deploy)
- [Hardhat 官方文档](https://hardhat.org/docs)
- [Scaffold-ETH 2 文档](https://docs.scaffoldeth.io/)

---

**最后更新：** 2025-01-05
