# Web3 DApp 错误监控最佳实践

> 本文档总结了区块链 DApp 项目中错误监控的业内最佳实践，包括方案对比、工具选型和实施建议。

## 目录

- [错误类型分类](#错误类型分类)
- [业内主流方案](#业内主流方案)
- [方案对比](#方案对比)
- [推荐方案](#推荐方案)
- [真实案例](#真实案例)
- [快速开始](#快速开始)

---

## 错误类型分类

### 前端错误

发生在用户交互层面，无需链上验证：

| 错误类型 | 描述 | 示例 |
|---------|------|------|
| UserRejected | 用户拒绝签名/交易 | 用户点击 MetaMask 的"拒绝"按钮 |
| InsufficientFunds | 余额不足 | 钱包 ETH 余额不足支付 gas |
| NetworkError | 网络连接问题 | RPC 节点超时、无法连接 |
| GasEstimationFailed | Gas 估算失败 | 合约方法会 revert，无法估算 gas |

### 链上错误

交易已上链但执行失败（Receipt.status = 0）：

| 错误类型 | 描述 | 特点 |
|---------|------|------|
| Revert | 合约执行失败回滚 | 需要解析 revert 原因 |
| OutOfGas | Gas 不足 | gasUsed = gasLimit |
| InvalidOpcode | 非法操作码 | 罕见，通常是合约 bug |

### 对比

| 维度 | 前端错误 | 链上错误 |
|------|---------|---------|
| 发生频率 | 高（80%+） | 低（20%-） |
| 影响程度 | 用户体验 | Gas 消耗 + 用户体验 |
| 监控难度 | 简单 | 复杂 |
| 数据关联 | 不需要 | 需要关联链上数据 |
| 实时性要求 | 高 | 中 |

---

## 业内主流方案

### 1. Dune Analytics / Flipside Crypto 模式

**定位：** 专业数据分析平台

```
Archive Node → 索引器 → PostgreSQL/ClickHouse → SQL/GraphQL
```

**特点：**
- ✅ 索引所有交易（包括失败的）
- ✅ 数据完全可审计
- ✅ 提供 SQL 查询接口
- ❌ 成本极高，需要专业团队

**适用场景：** 数据分析公司、研究机构

---

### 2. Uniswap / Aave 模式

**定位：** 头部 DeFi 协议

```
The Graph → Subgraph → GraphQL API → 前端
```

**特点：**
- ✅ 使用 The Graph（去中心化索引器）
- ✅ 只索引成功的交易
- ❌ 不主动监控错误交易
- ⚠️ 依赖 Etherscan/Tenderly 分析错误

**核心理念：**
> "成功的交易才是业务核心，错误交易相对较少"

---

### 3. OpenSea / Blur 模式

**定位：** NFT 交易平台

```
自建索引器 (Go/Rust) → PostgreSQL + Redis → API 服务 → 前端
```

**特点：**
- ✅ 完全自建，全栈可控
- ✅ 混合存储（PostgreSQL + MongoDB）
- ✅ 会监控错误，但非实时
- 📊 每日批量分析失败交易

**错误监控策略：**
- 批量导出失败交易
- 统计 Top 错误类型
- 优化合约/前端体验

---

### 4. 1inch / Paraswap 模式

**定位：** DEX 聚合器

```
前端 → Sentry (前端监控)
后端 → Datadog (后端监控)
链上 → The Graph + 自建索引
```

**特点：**
- ✅ 使用专业监控工具
- ✅ Sentry 监控前端错误
- ✅ 链上错误批量分析

**关键洞察：**
> "使用专业工具而非自建，前端错误比链上错误更重要"

---

### 5. Etherscan / Tenderly 模式

**定位：** 区块链浏览器/开发工具

```
Archive Node → 索引所有交易 → PostgreSQL + Elasticsearch → Web UI
```

**特点：**
- ✅ 索引所有交易（包括失败的）
- ✅ 提供交易模拟和错误分析
- ✅ 使用专业基础设施

**成本：** 💰💰💰💰 极高

---

## 方案对比

### 方案 A: Next.js API Route 直接操作数据库

```typescript
// packages/nextjs/app/api/errors/route.ts
import { sql } from '@vercel/postgres';

export async function POST(request: Request) {
  const error = await request.json();

  await sql`
    INSERT INTO errors (type, message, user, timestamp)
    VALUES (${error.type}, ${error.message}, ${error.user}, NOW())
  `;

  return Response.json({ success: true });
}
```

| 维度 | 评价 | 说明 |
|------|------|------|
| 架构复杂度 | ⭐⭐ 简单 | 前端自己管理，不依赖其他服务 |
| 部署难度 | ⭐ 很简单 | Vercel 一键部署 |
| 数据统一性 | ❌ 分散 | 错误数据和链上数据分离 |
| 关联查询 | ❌ 不支持 | 无法 JOIN Ponder 的表 |
| 可靠性 | ✅ 高 | 不依赖 Ponder |
| 性能 | ✅ 快 | Edge Functions 全球部署 |
| 成本 | 💰 低 | Vercel 免费额度够用 |

---

### 方案 B: 通过 Ponder API 写入

```typescript
// 前端上报
await fetch('http://localhost:42069/api/errors', {
  method: 'POST',
  body: JSON.stringify(errorData),
});

// Ponder 接收
app.post("/api/errors", async (c) => {
  const { db } = ponder;
  await db.transactionErrors.create({ ... });
});
```

| 维度 | 评价 | 说明 |
|------|------|------|
| 架构复杂度 | ⭐⭐⭐ 中等 | 需要 Ponder 配置 API |
| 部署难度 | ⭐⭐⭐ 较难 | 需要独立部署 Ponder |
| 数据统一性 | ✅ 统一 | 所有数据在一个数据库 |
| 关联查询 | ✅ 原生支持 | 可以 JOIN NFT/Staking 数据 |
| 可靠性 | ⚠️ 中等 | 依赖 Ponder 服务 |
| 性能 | ⚠️ 中等 | 相比 Edge Functions 慢 |
| 成本 | 💰💰 中等 | 需要独立服务器 |

---

### 方案 C: 混合方案（推荐）

```
前端错误 → Next.js API → Vercel Postgres
链上错误 → Ponder API → PGLite
```

| 维度 | 评价 | 说明 |
|------|------|------|
| 架构复杂度 | ⭐⭐⭐⭐ 较复杂 | 两套系统 |
| 部署难度 | ⭐⭐ 中等 | Next.js 简单，Ponder 较难 |
| 数据统一性 | ⚠️ 部分统一 | 链上错误统一 |
| 关联查询 | ⚠️ 部分支持 | 链上错误可以关联 |
| 可靠性 | ✅ 高 | 前端错误不受 Ponder 影响 |
| 性能 | ✅ 好 | 各司其职 |
| 成本 | 💰 低 | 前端免费，Ponder 可选 |

**优势：**
- ✅ 前端错误（80%）用轻量方案
- ✅ 链上错误（20%）用专业方案
- ✅ 渐进式实现，先简单后复杂

---

## 推荐方案

### 🥇 方案 1: 标准实践（强烈推荐）

**架构：**
```
前端错误 → Sentry (专业工具)
链上数据 → Ponder (索引成功事件)
链上错误 → Etherscan + 手动分析
```

**优点：**
- ✅ 使用成熟工具，稳定可靠
- ✅ 开发成本最低（2 小时配置）
- ✅ 免费额度够用（Sentry 5000 errors/月）
- ✅ 自动分组、统计、告警

**适用场景：**
- MVP 阶段
- 小团队
- 预算有限

**成本：** $0（免费版）

---

### 🥈 方案 2: 轻量自建

**架构：**
```
前端错误 → Next.js API + Vercel Postgres
链上数据 → Ponder
链上错误 → 前端上报到 Next.js API
```

**优点：**
- ✅ 完全自主可控
- ✅ 适合学习和定制
- ✅ 不依赖第三方

**缺点：**
- ❌ 需要自己实现分组、统计
- ❌ 没有自动告警
- ❌ 维护成本高

**适用场景：**
- 学习项目
- 有特殊需求
- 不想依赖第三方

**成本：** $0（Vercel 免费版）

---

### 🥉 方案 3: 混合方案（中大型）

**架构：**
```
前端错误 → Sentry
后端错误 → Datadog / CloudWatch
链上数据 → The Graph / Ponder
链上错误 → Dune Analytics (批量分析)
```

**优点：**
- ✅ 全方位覆盖
- ✅ 专业工具，功能强大
- ✅ 适合生产环境

**缺点：**
- ❌ 成本较高
- ❌ 配置复杂

**适用场景：**
- 已有用户的产品
- 需要深度分析
- 有预算

**成本：** $50-200/月

---

## 真实案例

### Uniswap V3

```
监控方案: The Graph (链上索引)
错误监控: 无
依赖: 用户反馈 + Etherscan
```

**核心理念：** 专注成功交易，错误依赖外部工具

---

### Aave V3

```
监控方案: The Graph + 自建 API
前端错误: Sentry
链上错误: Tenderly 分析
```

**核心理念：** 混合方案，前端用专业工具

---

### Curve Finance

```
监控方案: 自建索引器
前端错误: Sentry
链上错误: 批量导出到 PostgreSQL 分析
```

**核心理念：** 自建核心，辅以专业工具

---

### OpenSea

```
监控方案: 完全自建
前端: Sentry + Datadog
后端: 自建监控系统
链上: 自建索引器 + 每日错误分析
```

**核心理念：** 全栈自建，完全可控

---

## 快速开始

### MVP 阶段推荐（5 分钟配置）

#### 1. 安装 Sentry

```bash
# 安装依赖
yarn add @sentry/nextjs

# 自动配置
npx @sentry/wizard@latest -i nextjs
```

#### 2. 配置环境变量

```bash
# .env.local
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

#### 3. 集成到错误监控 Hook

```typescript
// hooks/scaffold-eth/useMonitoredWriteContract.ts
import * as Sentry from "@sentry/nextjs";

export const useMonitoredWriteContract = (contractName: string) => {
  const { writeContractAsync } = useScaffoldWriteContract(contractName);

  const monitoredWriteAsync = async (config: any) => {
    try {
      const hash = await writeContractAsync(config);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      if (receipt.status === "reverted") {
        // 上报到 Sentry
        Sentry.captureMessage("Transaction reverted", {
          level: "warning",
          tags: {
            contract: contractName,
            function: config.functionName,
          },
          extra: {
            txHash: hash,
            args: config.args,
          },
        });
      }

      return hash;
    } catch (error: any) {
      // 捕获所有错误
      Sentry.captureException(error, {
        tags: {
          contract: contractName,
          function: config.functionName,
          errorType: error.name || "Unknown",
        },
        extra: {
          args: config.args,
          value: config.value,
          errorMessage: error.message,
        },
      });

      throw error;
    }
  };

  return { writeContractAsync: monitoredWriteAsync };
};
```

#### 4. 使用示例

```typescript
// 原有代码
const { writeContractAsync } = useScaffoldWriteContract("StakableNFT");

// 改为
const { writeContractAsync } = useMonitoredWriteContract("StakableNFT");

// 使用方式不变
await writeContractAsync({
  functionName: "mint",
  args: [address],
});
```

#### 5. 查看结果

访问 Sentry Dashboard：
- 自动分组错误类型
- 统计错误频率
- 邮件/Slack 告警
- 查看堆栈信息

---

## 业内共识

### 核心原则

1. **使用专业工具，不要重复造轮**
   - Sentry 比自建前端监控好 100 倍
   - The Graph/Ponder 比自建索引器靠谱

2. **区分实时需求和分析需求**
   - 实时: 用户体验、关键业务指标
   - 分析: 错误趋势、优化方向

3. **成本优先**
   - 实时监控所有交易成本极高
   - 批量分析足够满足需求

### 通用实践

| 数据类型 | 存储位置 | 工具 |
|---------|---------|------|
| 前端错误 | 专业监控工具 | Sentry / LogRocket / Datadog |
| 后端错误 | 日志服务 | Datadog / CloudWatch / ELK |
| 链上数据 | 索引器 | The Graph / Ponder / 自建 |
| 链上错误 | 不实时监控 或 批量分析 | Etherscan / Tenderly |

---

## 参考资源

### 工具官网

- [Sentry](https://sentry.io/) - 前端错误监控
- [The Graph](https://thegraph.com/) - 去中心化索引器
- [Ponder](https://ponder.sh/) - 区块链数据索引
- [Tenderly](https://tenderly.co/) - 智能合约监控
- [Dune Analytics](https://dune.com/) - 链上数据分析

### 相关文档

- [Sentry Next.js 集成](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [The Graph Subgraph 开发](https://thegraph.com/docs/en/developing/creating-a-subgraph/)
- [Ponder 官方文档](https://ponder.sh/docs)
- [Etherscan API](https://docs.etherscan.io/)

---

## 总结

### 快速决策

**如果你是：**

- ✅ MVP 阶段 → 用 **Sentry**（5 分钟配置，免费）
- ✅ 学习项目 → 用 **Next.js API + Vercel Postgres**（轻量自建）
- ✅ 生产环境 → 用 **Sentry + Ponder + Etherscan**（混合方案）
- ✅ 大型项目 → 用 **Sentry + Datadog + The Graph**（专业方案）

### 关键建议

> **80% 的项目只需要 Sentry + 基础索引器即可满足需求。**

> **不要过早优化，先用简单方案跑起来，有问题再升级。**

---

*最后更新: 2025-12-05*
