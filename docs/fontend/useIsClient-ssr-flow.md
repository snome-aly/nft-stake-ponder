# useIsClient 在 Next.js SSR 场景下的执行流程详解

## 示例代码

```typescript
import { useIsClient } from 'usehooks-ts'

function ClientOnlyComponent() {
  const isClient = useIsClient()

  if (!isClient) {
    return <div>服务端渲染中...</div>
  }

  // 仅在客户端执行
  return (
    <div>
      <p>当前 URL: {window.location.href}</p>
      <p>浏览器: {navigator.userAgent}</p>
    </div>
  )
}
```

---

## 完整执行流程

### 阶段 1️⃣：服务端渲染 (SSR)

#### 时间点：用户请求页面时

**执行环境：** Node.js 服务器

```
1. 用户浏览器发起请求
   ↓
2. Next.js 服务器接收请求
   ↓
3. 服务器开始执行 React 组件渲染
```

**代码执行过程：**

```typescript
function ClientOnlyComponent() {
  // 步骤 1: 调用 useIsClient()
  const isClient = useIsClient()
  // 在服务端，isClient = false（因为没有 window 对象）

  // 步骤 2: 判断条件
  if (!isClient) {  // 条件为 true
    // 步骤 3: 返回服务端内容
    return <div>服务端渲染中...</div>  // ✅ 这个会被渲染
  }

  // ⚠️ 这部分代码在服务端不会执行
  return (
    <div>
      <p>当前 URL: {window.location.href}</p>  // ❌ 如果执行会报错（window 不存在）
      <p>浏览器: {navigator.userAgent}</p>
    </div>
  )
}
```

**useIsClient 内部实现（服务端）：**

```typescript
function useIsClient() {
  const [isClient, setIsClient] = useState(false)  // 初始值为 false

  useEffect(() => {
    // ⚠️ useEffect 在服务端不执行
    setIsClient(true)
  }, [])

  return isClient  // 返回 false
}
```

**服务端输出的 HTML：**

```html
<div>服务端渲染中...</div>
```

**这个 HTML 会被发送给浏览器**

---

### 阶段 2️⃣：客户端 Hydration（水合）

#### 时间点：浏览器接收到 HTML 后

**执行环境：** 浏览器

```
1. 浏览器接收 HTML
   ↓
2. 浏览器解析并显示 HTML（用户看到"服务端渲染中..."）
   ↓
3. 浏览器下载并执行 JavaScript bundle
   ↓
4. React 开始 Hydration 过程
```

**第一次渲染（Hydration 初始阶段）：**

```typescript
function ClientOnlyComponent() {
  // 步骤 1: 再次调用 useIsClient()
  const isClient = useIsClient()
  // ⚠️ 注意：这时 isClient 仍然是 false
  // 因为 useState 的初始值是 false，useEffect 还没执行

  // 步骤 2: 判断条件
  if (!isClient) {  // 条件仍为 true
    // 步骤 3: 返回相同的服务端内容
    return <div>服务端渲染中...</div>  // ✅ 与服务端 HTML 一致，Hydration 成功
  }

  return (
    <div>
      <p>当前 URL: {window.location.href}</p>
      <p>浏览器: {navigator.userAgent}</p>
    </div>
  )
}
```

**useIsClient 内部（Hydration 阶段）：**

```typescript
function useIsClient() {
  const [isClient, setIsClient] = useState(false)  // 仍然是 false

  useEffect(() => {
    // ⚠️ useEffect 被注册，但还没执行
    setIsClient(true)
  }, [])

  return isClient  // 返回 false
}
```

**关键点：** 这次渲染必须与服务端渲染的结果完全一致，否则会出现 Hydration 错误。

---

### 阶段 3️⃣：useEffect 执行

#### 时间点：Hydration 完成后

**执行环境：** 浏览器

```
1. React 完成 Hydration
   ↓
2. 执行所有 useEffect 回调
   ↓
3. useIsClient 的 useEffect 被触发
```

**useEffect 执行：**

```typescript
function useIsClient() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // ✅ 现在执行了！
    setIsClient(true)  // 状态更新：false → true
  }, [])

  return isClient  // 目前还是 false，但即将触发重新渲染
}
```

**状态更新触发重新渲染**

---

### 阶段 4️⃣：客户端重新渲染

#### 时间点：setIsClient(true) 触发更新后

**执行环境：** 浏览器

```typescript
function ClientOnlyComponent() {
  // 步骤 1: 再次调用 useIsClient()
  const isClient = useIsClient()
  // ✅ 现在 isClient = true

  // 步骤 2: 判断条件
  if (!isClient) {  // 条件为 false
    return <div>服务端渲染中...</div>
  }

  // 步骤 3: 执行客户端逻辑
  // ✅ 现在可以安全访问 window 和 navigator
  return (
    <div>
      <p>当前 URL: {window.location.href}</p>  // ✅ 正常执行
      <p>浏览器: {navigator.userAgent}</p>      // ✅ 正常执行
    </div>
  )
}
```

**DOM 更新：**

```html
<!-- 之前 -->
<div>服务端渲染中...</div>

<!-- 现在 -->
<div>
  <p>当前 URL: http://localhost:3000/page</p>
  <p>浏览器: Mozilla/5.0 ...</p>
</div>
```

**用户看到内容从 "服务端渲染中..." 切换到实际的客户端信息**

---

## 时间线总结

```
时间轴：
─────────────────────────────────────────────────────────────────

服务端：
  T0: 用户请求
  T1: useIsClient() 返回 false
  T2: 渲染 <div>服务端渲染中...</div>
  T3: 发送 HTML 给浏览器
       ↓
       ↓ (网络传输)
       ↓
客户端：
  T4: 浏览器接收 HTML
  T5: 显示 "服务端渲染中..."（首屏内容可见 - FCP）
  T6: 下载 JS bundle
  T7: 开始 Hydration
  T8: useIsClient() 返回 false（保持一致性）
  T9: 渲染 <div>服务端渲染中...</div>（与服务端一致）
  T10: Hydration 完成
  T11: 执行 useEffect，setIsClient(true)
  T12: 触发重新渲染
  T13: useIsClient() 返回 true
  T14: 渲染客户端内容
  T15: DOM 更新，用户看到最终内容
```

---

## 详细流程图

```
┌─────────────────────────────────────────────────────────────┐
│                     服务端渲染阶段                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Next.js 接收请求                                         │
│     ↓                                                        │
│  2. 执行 ClientOnlyComponent()                              │
│     ↓                                                        │
│  3. useState(false) → isClient = false                      │
│     ↓                                                        │
│  4. if (!isClient) → true                                   │
│     ↓                                                        │
│  5. return <div>服务端渲染中...</div>                        │
│     ↓                                                        │
│  6. 生成 HTML 字符串                                         │
│     ↓                                                        │
│  7. 发送给浏览器                                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                          ↓
                    (网络传输)
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                   客户端 Hydration 阶段                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. 浏览器显示 HTML                                          │
│     用户看到：<div>服务端渲染中...</div>                     │
│     ↓                                                        │
│  2. 加载 React 和组件代码                                    │
│     ↓                                                        │
│  3. React 开始 Hydration                                     │
│     ↓                                                        │
│  4. 再次执行 ClientOnlyComponent()                          │
│     ↓                                                        │
│  5. useState(false) → isClient = false                      │
│     ⚠️ 必须与服务端保持一致                                  │
│     ↓                                                        │
│  6. if (!isClient) → true                                   │
│     ↓                                                        │
│  7. return <div>服务端渲染中...</div>                        │
│     ✅ 与服务端 HTML 一致，Hydration 成功                    │
│     ↓                                                        │
│  8. 注册 useEffect 回调（但不执行）                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    useEffect 执行阶段                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Hydration 完成                                           │
│     ↓                                                        │
│  2. 浏览器执行 useEffect 回调                                │
│     ↓                                                        │
│  3. setIsClient(true)                                       │
│     ↓                                                        │
│  4. 状态更新：false → true                                   │
│     ↓                                                        │
│  5. 触发组件重新渲染                                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    客户端重新渲染阶段                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. 执行 ClientOnlyComponent()                              │
│     ↓                                                        │
│  2. useIsClient() → isClient = true                         │
│     ↓                                                        │
│  3. if (!isClient) → false                                  │
│     ↓                                                        │
│  4. 跳过第一个 return                                        │
│     ↓                                                        │
│  5. 执行第二个 return                                        │
│     return (                                                │
│       <div>                                                 │
│         <p>当前 URL: {window.location.href}</p>             │
│         <p>浏览器: {navigator.userAgent}</p>                │
│       </div>                                                │
│     )                                                       │
│     ↓                                                        │
│  6. React 更新 DOM                                           │
│     ↓                                                        │
│  7. 用户看到最终内容                                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 关键技术点

### 1. 为什么需要 useIsClient？

**问题：** 如果直接访问 window 对象：

```typescript
// ❌ 错误示例
function BadComponent() {
  return <div>{window.location.href}</div>  // 服务端会报错！
}
```

**错误信息：**
```
ReferenceError: window is not defined
```

**原因：** 服务端（Node.js）没有 window 对象。

---

### 2. Hydration 一致性原则

**核心规则：** 客户端第一次渲染必须与服务端渲染的 HTML 完全一致。

**useIsClient 如何保证一致性：**

```typescript
// 服务端
useState(false) → isClient = false → 渲染 A

// 客户端第一次（Hydration）
useState(false) → isClient = false → 渲染 A  ✅ 一致

// 客户端第二次（useEffect 后）
isClient = true → 渲染 B  ✅ 安全切换
```

**如果不一致会怎样？**

```typescript
// ❌ 错误示例
function BadComponent() {
  const isClient = typeof window !== 'undefined'  // 直接判断

  if (!isClient) {
    return <div>服务端</div>
  }
  return <div>客户端</div>
}

// 服务端: typeof window !== 'undefined' → false → 渲染 <div>服务端</div>
// 客户端第一次: typeof window !== 'undefined' → true → 渲染 <div>客户端</div>
// ❌ 不一致！Hydration 错误！
```

**错误信息：**
```
Warning: Text content did not match. Server: "服务端" Client: "客户端"
```

---

### 3. useIsClient 源码分析

```typescript
import { useEffect, useState } from 'react'

export function useIsClient() {
  // 1. 初始值必须是 false（与服务端保持一致）
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // 2. useEffect 只在客户端执行
    // 3. Hydration 完成后才执行
    // 4. 更新状态触发重新渲染
    setIsClient(true)
  }, [])  // 空依赖数组，只执行一次

  return isClient
}
```

**关键点：**
- `useState(false)` - 确保服务端和客户端首次渲染一致
- `useEffect` - 只在客户端且 Hydration 后执行
- 空依赖数组 - 只执行一次，避免重复触发

---

## 性能影响分析

### 渲染次数统计

```typescript
function ClientOnlyComponent() {
  console.log('渲染')  // 用于追踪渲染次数
  const isClient = useIsClient()

  // ...
}
```

**执行次数：**
- 服务端：1 次
- 客户端：2 次（Hydration + useEffect 触发的重渲染）
- **总计：3 次**

### 用户体验时间线

```
T0: 用户请求
     ↓
T1: 接收 HTML（首屏内容可见 - FCP）
    显示："服务端渲染中..."
     ↓
T2: JS 加载并 Hydration（页面可交互 - TTI）
    仍显示："服务端渲染中..."
     ↓
T3: useEffect 执行，重新渲染
    显示："当前 URL: ..." 和 "浏览器: ..."
```

**闪烁问题：** 用户可能会看到从 "服务端渲染中..." 到实际内容的切换。

---

## 最佳实践

### 1. 使用骨架屏替代文字提示

```typescript
function ClientOnlyComponent() {
  const isClient = useIsClient()

  if (!isClient) {
    // ✅ 使用骨架屏，用户体验更好
    return (
      <div className="skeleton">
        <div className="skeleton-line" />
        <div className="skeleton-line" />
      </div>
    )
  }

  return (
    <div>
      <p>当前 URL: {window.location.href}</p>
      <p>浏览器: {navigator.userAgent}</p>
    </div>
  )
}
```

### 2. 避免不必要的客户端专属渲染

```typescript
// ❌ 不好的做法
function UserAgent() {
  const isClient = useIsClient()
  if (!isClient) return null
  return <div>{navigator.userAgent}</div>
}

// ✅ 更好的做法：使用 Next.js headers
import { headers } from 'next/headers'

function UserAgent() {
  const headersList = headers()
  const userAgent = headersList.get('user-agent')
  return <div>{userAgent}</div>  // 服务端就能渲染
}
```

### 3. 延迟加载客户端组件

```typescript
import dynamic from 'next/dynamic'

// ✅ 使用 Next.js 的 dynamic import
const ClientOnlyMap = dynamic(
  () => import('./Map'),
  {
    ssr: false,  // 完全禁用 SSR
    loading: () => <div>地图加载中...</div>
  }
)

function Page() {
  return (
    <div>
      <h1>地图页面</h1>
      <ClientOnlyMap />
    </div>
  )
}
```

---

## 常见问题 FAQ

### Q1: 为什么不直接用 `typeof window !== 'undefined'`？

**A:** 会导致 Hydration 不一致错误。

```typescript
// ❌ 错误
const isClient = typeof window !== 'undefined'

// 服务端: false
// 客户端第一次: true  ← 不一致！
```

### Q2: useIsClient 会导致两次渲染，影响性能吗？

**A:** 影响很小，因为：
1. 第一次渲染是轻量级的（Hydration）
2. 第二次只更新必要的 DOM
3. 只在组件挂载时发生一次

### Q3: 能否在 useEffect 外使用 window？

**A:** 可以，但需配合 useIsClient：

```typescript
function Component() {
  const isClient = useIsClient()

  // ✅ 安全
  const url = isClient ? window.location.href : ''

  return <div>{url}</div>
}
```

### Q4: Next.js App Router 下有什么变化？

**A:** App Router 默认是服务端组件，需要明确标记客户端组件：

```typescript
'use client'  // 必须添加

import { useIsClient } from 'usehooks-ts'

export default function ClientOnlyComponent() {
  const isClient = useIsClient()
  // ...
}
```

---

## 总结

**执行流程核心要点：**

1. **服务端**：`isClient = false` → 渲染服务端内容
2. **客户端 Hydration**：`isClient = false` → 渲染相同内容（保持一致）
3. **useEffect 执行**：`setIsClient(true)` → 触发重新渲染
4. **客户端重渲染**：`isClient = true` → 渲染客户端内容

**关键原则：**
- ✅ 确保 Hydration 一致性
- ✅ 延迟到 useEffect 再访问浏览器 API
- ✅ 使用 useState + useEffect 而非直接判断

**适用场景：**
- 访问浏览器专属 API（window, navigator, localStorage）
- 第三方库需要在客户端初始化
- 客户端专属功能（如地图、图表、编辑器）

这个机制确保了 Next.js SSR 应用能够同时享受服务端渲染的 SEO 优势和客户端交互的完整功能！
