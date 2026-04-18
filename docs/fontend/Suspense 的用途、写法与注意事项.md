# ⚙️ React Suspense 使用规范与最佳实践

> 简洁总结 React Suspense 的用途、写法与注意事项，帮助你在 Next.js 与 React 应用中正确使用。

---

## 🎯 一、Suspense 是什么

`React.Suspense` 用于处理**异步组件加载或数据获取**，  
在等待期间显示 `fallback` 占位 UI，等 Promise 解析后再渲染真实内容。

原理一句话：
> 当组件渲染时抛出 Promise，React 暂停渲染 → 显示 fallback → Promise 结束后重新渲染。

---

## 🧩 二、常见使用场景

### 1️⃣ 懒加载组件（React.lazy）

```tsx
import React, { Suspense } from 'react'
const Chart = React.lazy(() => import('./Chart'))

function Dashboard() {
  return (
    <Suspense fallback={<p>Loading chart...</p>}>
      <Chart />
    </Suspense>
  )
}
```

💡 适用于：按需加载大型组件，减少首屏包体。

---

### 2️⃣ 异步数据加载（Next.js App Router）

```tsx
import { Suspense } from 'react'

async function User() {
  const res = await fetch('/api/user')
  const user = await res.json()
  return <div>{user.name}</div>
}

export default function Page() {
  return (
    <Suspense fallback={<p>Loading user...</p>}>
      <User />
    </Suspense>
  )
}
```

💡 Next.js 会在服务端流式渲染，fallback 优先展示，数据加载完成后再补齐内容。

---

### 3️⃣ Resource Pattern（自定义数据读取器）

```tsx
const userResource = wrapPromise(fetchUser())

function User() {
  const user = userResource.read() // 未准备好时抛出 Promise
  return <div>{user.name}</div>
}

<Suspense fallback={<p>Loading...</p>}>
  <User />
</Suspense>
```

💡 可用于纯 React 环境中的 Suspense for Data Fetching 实验性特性。

---

## ⚠️ 三、使用注意事项

| 项 | 建议 | 说明 |
|----|------|------|
| ✅ fallback 必须提供 | 用于显示加载状态 |
| ✅ 仅捕获渲染时的 Promise | useEffect 中的异步不会触发 Suspense |
| ✅ 可多层嵌套 | 各自 fallback 独立显示 |
| ⚠️ 不捕获错误 | 需配合 `<ErrorBoundary>` |
| ⚠️ 客户端与服务端用法不同 | 客户端配合 `lazy()`，服务端支持 `async` |
| ⚙️ SSR 支持 | Next.js 结合流式渲染（Streaming）更自然 |

---

## 🧠 四、最佳实践

### ✅ 局部懒加载
```tsx
<Suspense fallback={<ChartSkeleton />}>
  <Chart />
</Suspense>
```

### ✅ 并行加载
```tsx
<Suspense fallback={<UsersSkeleton />}>
  <Users />
</Suspense>
<Suspense fallback={<PostsSkeleton />}>
  <Posts />
</Suspense>
```

### ✅ 结合错误边界
```tsx
<ErrorBoundary fallback={<p>加载出错</p>}>
  <Suspense fallback={<p>加载中...</p>}>
    <UserInfo />
  </Suspense>
</ErrorBoundary>
```

---

## 🧩 五、总结一句话

> Suspense 让异步加载变得“像同步一样写”：  
> 抛 Promise → 显示 fallback → Promise 解析后恢复渲染。  
> 用于懒加载组件、异步数据加载、流式渲染，是现代 React/Next.js 的核心机制之一。