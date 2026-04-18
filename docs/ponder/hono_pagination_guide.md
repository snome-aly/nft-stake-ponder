# Ponder 进阶指南：使用 Hono 实现自定义 API 与真正分页

## 1. 背景与问题
默认情况下，Ponder 会根据您的 `schema.ts` 自动生成标准的 GraphQL API。
- **局限性**：自动生成的 Schema 主要支持 **游标分页 (Cursor-based Pagination)** (`before`, `after`, `first`, `last`)，通常不支持 **偏移量分页 (Offset-based Pagination)** (`skip`, `limit`)，也难以在一个查询中实现复杂的聚合（如同带过滤条件的“总数统计”）。
- **目标**：实现类似“第 5 页，共 50 页”的高效分页 UI。

## 2. 解决方案：使用 Hono 自定义 API
Ponder (v0.8+) 原生支持 **Hono**（一个超轻量级的 Web 框架）来扩展服务器功能。
您可以在 GraphQL API 旁边挂载自定义的 REST 或 RPC 接口。这些接口拥有 **Ponder 数据库** (Drizzle ORM) 和 **Replica** 上下文的完整访问权限。

### 2.1 架构对比
- **标准模式**：客户端 -> GraphQL -> 数据库
- **自定义模式**：客户端 -> Hono (REST) -> Drizzle ORM -> 数据库

## 3. 实现步骤

### 第一步：创建 API 入口文件
在 `packages/ponder/src/api/index.ts` 创建文件。Ponder会自动识别并挂载路由。

```typescript
// packages/ponder/src/api/index.ts
import { Hono } from "hono";
import { db } from "ponder:db"; // 引入 Ponder 的 Drizzle DB 实例
import { proposal } from "ponder:schema"; // 引入您的 Schema 定义
import { count, desc, eq, sql } from "drizzle-orm";

const app = new Hono();

// GET /api/proposals?page=1&limit=6&status=Active
app.get("/proposals", async (c) => {
  // 解析查询参数
  const page = Number(c.req.query("page") || "1");
  const limit = Number(c.req.query("limit") || "6");
  const offset = (page - 1) * limit;
  const statusFilter = c.req.query("status");

  // 1. 构建过滤条件 (SQL)
  let whereClause = undefined;
  
  // 注意：复杂的状态逻辑（如根据区块号判断 Pending/Active）需要编写原生 SQL 
  // 或者使用 Drizzle 的 helper，类似前端的逻辑，但需要针对数据库列操作。
  
  // 简单示例（过滤 Canceled 状态）：
  if (statusFilter === "Canceled") {
      whereClause = eq(proposal.canceled, true);
  }

  // 2. 获取当页数据 (Offset Pagination)
  const items = await db
    .select()
    .from(proposal)
    .where(whereClause)
    .orderBy(desc(proposal.createdAt))
    .limit(limit)
    .offset(offset);

  // 3. 获取总数 (高效聚合)
  // 这是 GraphQL 难以做到的：只查询 Count，不查具体数据
  const totalResult = await db
    .select({ count: count() })
    .from(proposal)
    .where(whereClause);
    
  const totalItems = totalResult[0].count;
  const totalPages = Math.ceil(totalItems / limit);

  // 返回标准 JSON 结构
  return c.json({
    items,
    meta: {
      totalItems,
      totalPages,
      currentPage: page,
      limit
    }
  });
});

export default app;
```

### 第二步：前端调用 (Next.js)
不再使用 `useQuery` 请求 GraphQL，而是用 `fetch` 请求这个 REST 接口。

```typescript
// packages/nextjs/app/governance/page.tsx

// 定义 fetcher
const fetchProposalsAPI = async (page, status) => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_PONDER_URL}/api/proposals?page=${page}&status=${status}`
  );
  return res.json();
};

// 使用 React Query
const { data } = useQuery({
  queryKey: ['proposals_api', page, status],
  queryFn: () => fetchProposalsAPI(page, status)
});

// data.items 就是数据列表
// data.meta.totalPages 就是总页数
```

## 4. 行业方案深度对比

在行业内，关于“如何获取分页数据”，主要有三种主流流派。我们需要根据项目阶段进行选择。

### 方案一：标准 GraphQL (The Graph/Ponder 默认) 📜
**目前的方案**。只使用游标分页 (`hasNextPage`, `endCursor`)。
*   ✅ **优点**：最标准、去中心化最友好。前端逻辑简单。
*   ❌ **缺点**：无法做“跳转到第 5 页”这种 Web2 式功能。无法直接显示总数。
*   **适用场景**：绝大多数 DeFi Dashboard，只提供“上一页/下一页”。

### 方案二：Ponder Hono 自定义 API 🚀 【全栈推荐】
在 Indexer 内部扩展 REST 接口。
*   ✅ **优点**：**同一个进程、同一份 Schema**。性能极致，可直接读写数据库。是 Web2 体验与 Web3 数据的最佳结合点。
*   ❌ **缺点**：需要写额外的后端代码。
*   **适用场景**：对用户体验有极高要求的 Web3 产品（如 Uniswap, Aave）。

### 方案三：Next.js 直连数据库 (Direct SQL) 🏗️
在 Next.js 的 API Routes 里，直接连接 Ponder 的 Postgres 数据库。
*   ✅ **优点**：前端工程师最熟悉，不用学 Ponder/Hono。
*   ❌ **缺点 (致命)**：**Schema 紧耦合**。如果 Ponder 升级导致表名变更，Next.js 会直接崩溃。维护两份 Schema 定义（一份在 Ponder，一份在 Next.js）是架构大忌。
*   **适用场景**：单兵作战的快速原型，**不推荐**用于生产环境。

---

## 5. 建议路径

1.  **第一阶段 (MVP)**：保持使用 **标准 GraphQL (游标分页)**。这是最稳健、最符合加密原生习惯的做法。
2.  **第二阶段 (增长期)**：如果用户强烈要求“跳转页码”或“复杂统计”，请引入 **Ponder Hono** 并在 `src/api` 下编写接口。
3.  **避坑指南**：尽量避免使用 Next.js 直连数据库的方式，维护成本极其高昂。
