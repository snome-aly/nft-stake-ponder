# 链上错误监控系统使用指南

## 📋 概述

本系统通过 Ponder 索引器监听并记录链上交易失败事件,提供完整的错误追踪、统计和告警功能,方便运维人员及时发现和处理问题。

## 🏗️ 架构

```
┌─────────────┐
│ 区块链网络  │
└──────┬──────┘
       │ 失败交易
       ↓
┌─────────────┐
│   Ponder    │ ← 监听所有区块,捕获失败交易
│  索引器     │
└──────┬──────┘
       │ 存储
       ↓
┌─────────────┐
│  数据库     │ ← 错误日志 + 统计数据
│  (SQLite)   │
└──────┬──────┘
       │ GraphQL
       ↓
┌─────────────┐
│  前端页面   │ ← 查询展示 + 告警提示
└─────────────┘
```

## 📦 文件结构

```
packages/ponder/
├── schema/
│   └── errorEvents.ts          # 错误数据表定义
├── src/
│   └── ErrorMonitor.ts         # 错误监听索引器
└── ponder.config.ts

packages/nextjs/
├── hooks/
│   └── useErrorMonitoring.ts   # 错误查询 Hooks
└── app/
    └── monitoring/
        └── page.tsx            # 错误监控仪表板
```

## 🚀 快速开始

### 1. 启动 Ponder 索引器

```bash
# 在项目根目录
yarn ponder:dev
```

索引器会自动:
- 扫描每个区块的交易
- 识别失败的交易 (status === 0)
- 解析错误原因和类型
- 存储到数据库并更新统计

### 2. 访问监控页面

**方式一: 通过导航栏图标 (推荐)**
- 启动前端后,以 Admin 角色连接钱包
- 在顶部导航栏可以看到 Admin 图标 (🔧) 旁边的监控图标 (⚠️)
- 点击监控图标即可访问错误监控页面

**方式二: 直接访问 URL**
```
http://localhost:3000/monitoring
```

**权限要求**:
- ✅ 必须连接钱包
- ✅ 必须拥有 `Admin` 角色 (DEFAULT_ADMIN_ROLE)
- ❌ Operator 和 Pauser 角色**无法**访问监控页面

**界面说明**:
- 桌面端: 监控图标只显示图标,鼠标悬停显示 "Monitoring" 提示
- 移动端: 在下拉菜单中显示完整的 "Monitoring" 文字链接

## 📊 数据表说明

### 1. `transaction_errors` - 交易失败记录表

记录每一笔失败交易的详细信息:

| 字段 | 说明 |
|------|------|
| `transactionHash` | 交易哈希 |
| `from` | 交易发起者 |
| `to` | 目标合约地址 |
| `contractName` | 合约名称 |
| `functionName` | 调用的函数名 |
| `errorType` | 错误类型 (RequireError/CustomError/UnknownError) |
| `errorMessage` | 错误消息 |
| `gasCostInWei` | 消耗的 Gas (wei) |
| `blockTimestamp` | 区块时间戳 |

### 2. `contract_error_stats` - 合约错误统计表

按合约和错误类型聚合统计:

| 字段 | 说明 |
|------|------|
| `contractAddress` | 合约地址 |
| `errorMessage` | 错误消息 |
| `errorCount` | 发生次数 |
| `totalGasWasted` | 总浪费的 Gas |
| `averageGasWasted` | 平均浪费的 Gas |
| `lastOccurrence` | 最后发生时间 |

### 3. `user_error_stats` - 用户错误统计表

追踪特定用户的失败交易:

| 字段 | 说明 |
|------|------|
| `userAddress` | 用户地址 |
| `totalErrors` | 总失败次数 |
| `totalGasWasted` | 总浪费的 Gas |
| `lastErrorTime` | 最后失败时间 |

### 4. `daily_error_stats` - 每日错误统计表

按天聚合错误数据,用于趋势分析:

| 字段 | 说明 |
|------|------|
| `date` | 日期 (YYYY-MM-DD) |
| `totalErrors` | 当天总错误数 |
| `uniqueUsers` | 受影响的用户数 |
| `totalGasWasted` | 当天浪费的总 Gas |
| `topErrorMessage` | 最常见的错误 |

## 🔍 使用示例

### 前端查询错误日志

```typescript
import { useRecentErrors } from "~~/hooks/useErrorMonitoring";

function MyComponent() {
  // 查询最近 50 条错误
  const { data: errors, isLoading } = useRecentErrors({
    limit: 50,
    contractName: "StakableNFT", // 可选: 过滤特定合约
  });

  return (
    <div>
      {errors?.map(error => (
        <div key={error.id}>
          <p>错误: {error.errorMessage}</p>
          <p>Gas 消耗: {formatEther(error.gasCostInWei)} ETH</p>
        </div>
      ))}
    </div>
  );
}
```

### 查询合约错误统计

```typescript
import { useContractErrorStats } from "~~/hooks/useErrorMonitoring";

function ContractStats() {
  const { data: stats } = useContractErrorStats();

  return (
    <div>
      {stats?.map(stat => (
        <div key={stat.id}>
          <p>{stat.contractName}: {stat.errorCount.toString()} 次错误</p>
          <p>平均 Gas: {formatEther(stat.averageGasWasted)} ETH</p>
        </div>
      ))}
    </div>
  );
}
```

### GraphQL 直接查询

```graphql
query {
  transactionErrors(
    limit: 10
    orderBy: "blockTimestamp"
    orderDirection: "desc"
  ) {
    items {
      transactionHash
      errorMessage
      gasCostInWei
      from
    }
  }
}
```

GraphQL Playground: `http://localhost:42069`

## ⚠️ 告警策略

系统会自动检测以下异常情况:

1. **错误激增**: 今日错误数超过过去 7 天平均值的 2 倍
2. **高频错误**: 同一错误发生次数 > 10 次
3. **Gas 浪费**: 单日浪费 Gas 超过阈值

可以根据需要自定义告警规则,例如:

```typescript
// 自定义告警检查
function checkAlerts(stats: ContractErrorStat[]) {
  const criticalErrors = stats.filter(stat => {
    return (
      stat.errorCount > 50n || // 高频错误
      stat.totalGasWasted > parseEther("1") // Gas 浪费过多
    );
  });

  if (criticalErrors.length > 0) {
    // 发送告警 (邮件/Slack/Discord)
    notifyAdmin(criticalErrors);
  }
}
```

## 🔧 自定义配置

### 1. 修改错误选择器映射

在 `ErrorMonitor.ts` 中更新 `getCustomErrorName()`:

```typescript
function getCustomErrorName(selector: string): string | null {
  const knownErrors: Record<string, string> = {
    "0x12345678": "InvalidRarityDistribution",
    "0x87654321": "NotRevealedYet",
    // 添加你的 custom errors
  };
  return knownErrors[selector] || null;
}
```

### 2. 修改函数选择器映射

更新 `parseFunctionCall()` 中的映射:

```typescript
const knownSelectors: Record<string, string> = {
  "0x40c10f19": "mint",
  "0xa0712d68": "stake",
  // 添加更多函数
};
```

### 3. 过滤特定合约

在 `ErrorMonitor.ts` 的 `getContractName()` 中添加:

```typescript
const contracts = {
  "0x5FbDB2315678afecb367f032d93F642f64180aa3": "StakableNFT",
  "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512": "NFTStakingPool",
  // 添加你的合约地址
};
```

## 📈 性能优化建议

### 1. 减少区块扫描范围

如果只关心最近的错误,可以在 `ponder.config.ts` 设置 `startBlock`:

```typescript
contracts: {
  StakableNFT: {
    // 只索引最近 10000 个区块
    startBlock: currentBlock - 10000,
  }
}
```

### 2. 使用生产数据库

开发环境使用 SQLite,生产环境建议使用 PostgreSQL:

```typescript
// ponder.config.ts
export default createConfig({
  database: {
    kind: "postgres",
    connectionString: process.env.DATABASE_URL,
  },
  // ...
});
```

### 3. 限制检查的交易

只检查与你合约相关的交易,减少 RPC 调用:

```typescript
// 在 ErrorMonitor.ts 中
const receipts = await Promise.all(
  block.transactions
    .filter(tx => isOurContract(tx.to)) // 只检查相关合约
    .map(tx => client.getTransactionReceipt({ hash: tx.hash }))
);
```

## 🚨 生产环境建议

1. **使用专业监控服务**:
   - [Tenderly](https://tenderly.co/) - 完整的交易监控和调试
   - [Blocknative](https://www.blocknative.com/) - 实时交易监控
   - [Alchemy Notify](https://www.alchemy.com/notify) - 交易告警

2. **前端错误捕获**:
   ```typescript
   // 在 wagmi 配置中捕获错误
   try {
     await writeContract({...});
   } catch (error) {
     // 上报到监控系统
     logErrorToBackend(error);
   }
   ```

3. **设置告警通知**:
   - Email 告警
   - Slack/Discord webhook
   - PagerDuty 集成

4. **定期清理旧数据**:
   ```sql
   DELETE FROM transaction_errors
   WHERE block_timestamp < NOW() - INTERVAL '30 days';
   ```

## 🐛 故障排查

### Ponder 索引器没有捕获错误

1. 检查 Ponder 是否正常运行: `yarn ponder:dev`
2. 检查 RPC 端点配置: 环境变量 `PONDER_RPC_URL_{CHAIN_ID}`
3. 查看 Ponder 日志输出是否有错误

### GraphQL 查询返回空数据

1. 确认数据库中有数据: 检查 `.ponder/` 目录
2. 检查 schema 是否正确导出
3. 重新生成类型: `yarn ponder:codegen`

### 前端页面报错

1. 确认 Ponder 服务正在运行
2. 检查 `NEXT_PUBLIC_PONDER_URL` 环境变量
3. 检查浏览器控制台的网络请求

## 📚 相关资源

- [Ponder 官方文档](https://ponder.sh)
- [Viem 文档](https://viem.sh)
- [GraphQL 查询语法](https://graphql.org/learn/)
- [Scaffold-ETH 2 文档](https://docs.scaffoldeth.io)

## 🤝 支持

遇到问题?
1. 查看 Ponder 日志: `packages/ponder/.ponder/logs/`
2. 检查 GraphQL Playground: `http://localhost:42069`
3. 查看本项目的 Issue 或提交新 Issue

---

**注意**: 本系统目前使用区块扫描方式监听错误,适合开发和测试环境。生产环境建议结合前端错误捕获和专业监控服务使用。
