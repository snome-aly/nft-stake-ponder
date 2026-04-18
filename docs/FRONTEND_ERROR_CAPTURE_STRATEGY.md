# 前端错误捕获策略 - 实现方案

## 📋 方案概述

将链上错误监控从 Ponder 索引器改为前端主动捕获模式。在用户发起交易时,前端捕获失败信息并存储到数据库,供监控页面查询展示。

## 🏗️ 新架构

```
┌─────────────┐
│   用户操作   │
└──────┬──────┘
       │ 交易失败
       ↓
┌─────────────┐
│  前端捕获   │ ← wagmi onError / try-catch
└──────┬──────┘
       │ API 调用
       ↓
┌─────────────┐
│  Ponder API │ ← 新增: 写入端点
│  Handler    │
└──────┬──────┘
       │ 直接写入
       ↓
┌─────────────┐
│  数据库     │ ← 复用现有 schema
│  (PGlite)   │
└──────┬──────┘
       │ GraphQL 查询
       ↓
┌─────────────┐
│  监控页面   │ ← 复用现有组件
└─────────────┘
```

## 🎯 核心组件

### 1. 前端错误捕获器 (新增)

**文件**: `packages/nextjs/hooks/useTransactionErrorCapture.ts`

```typescript
/**
 * 交易错误捕获 Hook
 *
 * 功能:
 * - 自动捕获所有合约交互的错误
 * - 解析错误类型和消息
 * - 上报到 Ponder API
 */

import { useEffect } from "react";
import { useAccount } from "wagmi";

export function useTransactionErrorCapture() {
  const { address } = useAccount();

  // 捕获错误并上报
  const captureError = async (error: any, context: {
    contractName: string;
    functionName: string;
    args?: any[];
    value?: bigint;
  }) => {
    // 解析错误信息
    const errorInfo = parseTransactionError(error);

    // 构建错误记录
    const errorRecord = {
      userAddress: address,
      contractName: context.contractName,
      functionName: context.functionName,
      errorType: errorInfo.type,
      errorMessage: errorInfo.message,
      errorData: JSON.stringify(errorInfo.data),
      args: JSON.stringify(context.args),
      value: context.value?.toString() || "0",
      timestamp: Date.now(),
    };

    // 上报到 Ponder API
    await reportError(errorRecord);
  };

  return { captureError };
}

// 解析错误类型
function parseTransactionError(error: any) {
  // 用户拒绝
  if (error.code === 4001 || error.message?.includes("User rejected")) {
    return {
      type: "UserRejected",
      message: "User rejected the transaction",
      data: null,
    };
  }

  // Revert 错误
  if (error.message?.includes("execution reverted")) {
    const match = error.message.match(/execution reverted: (.+)/);
    return {
      type: "RequireError",
      message: match ? match[1] : "Transaction reverted",
      data: error.data,
    };
  }

  // Custom Error
  if (error.data?.errorName) {
    return {
      type: "CustomError",
      message: error.data.errorName,
      data: error.data.args,
    };
  }

  // 余额不足
  if (error.message?.includes("insufficient funds")) {
    return {
      type: "InsufficientFunds",
      message: "Insufficient funds for transaction",
      data: null,
    };
  }

  // Gas 估算失败
  if (error.message?.includes("cannot estimate gas")) {
    return {
      type: "GasEstimationFailed",
      message: "Gas estimation failed - transaction would fail",
      data: null,
    };
  }

  // 未知错误
  return {
    type: "UnknownError",
    message: error.message?.slice(0, 200) || "Unknown error",
    data: error,
  };
}

// 上报错误到 Ponder
async function reportError(errorRecord: any) {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_PONDER_URL}/api/errors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(errorRecord),
    });
  } catch (err) {
    console.error("Failed to report error:", err);
  }
}
```

### 2. Scaffold-ETH Hooks 包装器 (新增)

**文件**: `packages/nextjs/hooks/useMonitoredWriteContract.ts`

```typescript
/**
 * 带监控的合约写入 Hook
 *
 * 包装 useScaffoldWriteContract,自动捕获错误
 */

import { useScaffoldWriteContract } from "./scaffold-eth";
import { useTransactionErrorCapture } from "./useTransactionErrorCapture";

export function useMonitoredWriteContract(contractName: string) {
  const { writeContractAsync, ...rest } = useScaffoldWriteContract(contractName);
  const { captureError } = useTransactionErrorCapture();

  const monitoredWrite = async (config: any) => {
    try {
      return await writeContractAsync(config);
    } catch (error) {
      // 捕获错误
      await captureError(error, {
        contractName,
        functionName: config.functionName,
        args: config.args,
        value: config.value,
      });

      // 重新抛出错误,让调用方处理
      throw error;
    }
  };

  return {
    writeContractAsync: monitoredWrite,
    ...rest,
  };
}
```

### 3. Ponder API 端点 (新增)

**文件**: `packages/ponder/src/api/errors.ts`

```typescript
/**
 * 错误上报 API 端点
 *
 * 接收前端上报的错误并写入数据库
 */

import { ponder } from "ponder:registry";

// 注册 API 路由
ponder.use("/api/errors", async (req, res, { db }) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const errorData = await req.json();

    // 验证必需字段
    if (!errorData.userAddress || !errorData.errorType) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 生成唯一 ID
    const id = `${errorData.userAddress}-${Date.now()}`;
    const timestamp = BigInt(Math.floor(Date.now() / 1000));

    // 写入 transaction_errors 表
    await db.insert(transactionErrors).values({
      id,
      blockNumber: 0n, // 前端捕获无区块号
      blockTimestamp: timestamp,
      transactionHash: errorData.txHash || "",
      transactionIndex: 0,
      from: errorData.userAddress,
      to: null,
      contractName: errorData.contractName,
      functionName: errorData.functionName,
      errorType: errorData.errorType,
      errorMessage: errorData.errorMessage,
      errorSignature: null,
      errorData: errorData.errorData,
      gasLimit: 0n,
      gasUsed: 0n,
      gasPrice: null,
      maxFeePerGas: null,
      maxPriorityFeePerGas: null,
      gasCostInWei: 0n,
      value: BigInt(errorData.value || 0),
      createdAt: timestamp,
    });

    // 更新统计表
    await updateErrorStats(db, {
      userAddress: errorData.userAddress,
      contractName: errorData.contractName,
      errorType: errorData.errorType,
      errorMessage: errorData.errorMessage,
      timestamp,
    });

    return res.status(200).json({ success: true, id });
  } catch (error) {
    console.error("Error saving error report:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// 更新统计数据
async function updateErrorStats(db: any, data: any) {
  // 更新用户统计
  const userId = data.userAddress.toLowerCase();
  const existing = await db.find(userErrorStats, { id: userId });

  if (existing) {
    await db.update(userErrorStats, { id: userId }).set({
      totalErrors: existing.totalErrors + 1n,
      lastErrorTime: data.timestamp,
      totalGasWasted: existing.totalGasWasted, // 前端捕获无 gas 数据
      lastErrorTransaction: "",
      lastErrorMessage: data.errorMessage,
    });
  } else {
    await db.insert(userErrorStats).values({
      id: userId,
      userAddress: data.userAddress,
      totalErrors: 1n,
      lastErrorTime: data.timestamp,
      firstErrorTime: data.timestamp,
      totalGasWasted: 0n,
      lastErrorTransaction: "",
      lastErrorMessage: data.errorMessage,
    });
  }

  // 更新每日统计
  const date = new Date(Number(data.timestamp) * 1000).toISOString().split("T")[0];
  const dailyStats = await db.find(dailyErrorStats, { id: date });

  if (dailyStats) {
    await db.update(dailyErrorStats, { id: date }).set({
      totalErrors: dailyStats.totalErrors + 1n,
      uniqueUsers: dailyStats.uniqueUsers + 1n,
      totalGasWasted: dailyStats.totalGasWasted,
    });
  } else {
    await db.insert(dailyErrorStats).values({
      id: date,
      date,
      timestamp: BigInt(Math.floor(new Date(date).getTime() / 1000)),
      totalErrors: 1n,
      uniqueUsers: 1n,
      totalGasWasted: 0n,
      topErrorMessage: data.errorMessage,
      topErrorCount: 1n,
    });
  }
}
```

### 4. 使用示例

**在组件中使用监控的合约调用**:

```typescript
// 之前: 直接使用 useScaffoldWriteContract
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

function MintComponent() {
  const { writeContractAsync } = useScaffoldWriteContract("StakableNFT");

  const handleMint = async () => {
    try {
      await writeContractAsync({
        functionName: "mint",
        args: [1n],
        value: parseEther("1"),
      });
    } catch (error) {
      // 错误不会被记录
      console.error(error);
    }
  };
}

// 之后: 使用带监控的 Hook
import { useMonitoredWriteContract } from "~~/hooks/useMonitoredWriteContract";

function MintComponent() {
  const { writeContractAsync } = useMonitoredWriteContract("StakableNFT");

  const handleMint = async () => {
    try {
      await writeContractAsync({
        functionName: "mint",
        args: [1n],
        value: parseEther("1"),
      });
    } catch (error) {
      // 错误自动被捕获并上报
      console.error(error);
      toast.error("Mint failed: " + error.message);
    }
  };
}
```

## 🔄 迁移步骤

### 阶段 1: 删除/禁用 Ponder 区块监听器

1. 删除 `packages/ponder/src/ErrorMonitor.ts`
2. 从 `ponder.config.ts` 移除 `blocks` 配置
3. 保留所有 schema 定义 (复用)

### 阶段 2: 实现前端捕获

1. 创建 `useTransactionErrorCapture.ts` Hook
2. 创建 `useMonitoredWriteContract.ts` 包装器
3. 在关键操作中替换 Hook 使用

### 阶段 3: 实现 Ponder API

1. 创建 `packages/ponder/src/api/errors.ts`
2. 实现 POST /api/errors 端点
3. 实现统计更新逻辑

### 阶段 4: 测试

1. 触发各种类型的错误 (用户拒绝、余额不足、revert 等)
2. 验证错误是否正确记录到数据库
3. 检查监控页面是否正常显示

## 📊 捕获的错误类型

| 错误类型 | 说明 | 示例 |
|---------|------|------|
| UserRejected | 用户拒绝签名 | MetaMask 弹窗点击 "拒绝" |
| RequireError | require 语句失败 | "Exceeds max supply" |
| CustomError | 合约自定义错误 | InvalidRarityDistribution |
| InsufficientFunds | 余额不足 | ETH 余额 < gas + value |
| GasEstimationFailed | Gas 估算失败 | 交易会 revert |
| UnknownError | 其他未知错误 | 网络问题等 |

## ✅ 优点

1. **准确性高**: 捕获所有前端发起的交易错误
2. **性能好**: 无需扫描每个区块
3. **上下文丰富**: 可以记录用户输入、页面状态等
4. **实时性强**: 立即捕获,无延迟
5. **易于调试**: 前端有完整的错误堆栈

## ⚠️ 限制

1. **仅捕获前端发起的交易**: 无法捕获其他用户/合约的失败交易
2. **无 gas 数据**: 交易未上链,无法获取实际 gas 消耗
3. **无区块信息**: 没有 blockNumber、transactionHash 等
4. **依赖前端正常运行**: 如果前端崩溃,错误可能丢失

## 🎯 适用场景

✅ **适合**:
- 监控自己 dApp 用户的交易失败情况
- 分析用户操作问题和优化用户体验
- 快速响应和修复前端交互问题

❌ **不适合**:
- 监控整个网络的失败交易
- 需要完整链上数据的分析
- 合规审计和安全监控

## 📝 与原方案对比

| 特性 | Ponder 区块扫描 | 前端捕获 |
|-----|----------------|---------|
| 实现难度 | 高 | 中 |
| 性能开销 | 高 (扫描所有区块) | 低 (仅上报错误) |
| 数据完整性 | 完整 (区块/gas/hash) | 部分 (无链上数据) |
| 覆盖范围 | 所有交易 | 仅前端发起 |
| 实时性 | 延迟 (区块确认) | 即时 |
| 维护成本 | 高 | 低 |

## 🚀 后续优化

1. **批量上报**: 累积多个错误后批量提交,减少 API 调用
2. **离线缓存**: 使用 localStorage 缓存,网络恢复后上报
3. **去重**: 避免重复上报同一个错误
4. **采样**: 只上报一定比例的错误,降低存储成本
5. **告警**: 特定错误类型自动发送通知 (Email/Slack)

## 📚 参考资料

- [Wagmi Error Handling](https://wagmi.sh/react/guides/error-handling)
- [Viem Error Types](https://viem.sh/docs/error-handling)
- [Ponder Custom API Routes](https://ponder.sh/docs/api-reference/ponder/custom-routes)
