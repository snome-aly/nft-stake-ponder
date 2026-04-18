# Next.js 渲染流程速查表

> 一页纸快速参考指南

## 首次访问流程（5步）

```
1. 服务端渲染（SSR）
   ├─ 执行所有组件（包括 "use client"）
   ├─ 不执行 useEffect 回调
   └─ 生成 HTML + 嵌入 <script>

2. 浏览器渲染
   ├─ 解析 HTML
   ├─ 显示内容（用户可见）✨
   └─ 并行下载 JavaScript

3. React Hydration
   ├─ 生成虚拟 DOM
   ├─ 对比真实 DOM
   └─ 添加事件监听器

4. useEffect 执行
   ├─ Hydration 完成后执行
   └─ 可能触发状态更新 → DOM 更新

5. 变成 SPA
   └─ Link 导航不刷新页面
```

## 客户端导航流程（3步）

```
点击 <Link href="/debug">
  ↓
1. 请求 RSC Payload（5-10KB，不是完整 HTML）
  ↓
2. 客户端解码 + 生成虚拟 DOM
  ↓
3. 更新 DOM（只更新变化部分）✨
```

## 核心概念速记

### Server vs Client Components

```typescript
// Server Component（默认）
✅ async/await
✅ 直接访问数据库
❌ useState/useEffect
❌ onClick/onChange

// Client Component（"use client"）
✅ useState/useEffect
✅ onClick/onChange
❌ async/await（组件本身）
⚠️ 仍会 SSR
```

### 组件嵌套规则

```
Server Component
  ├─ Server Component  ✅
  └─ Client Component  ✅

Client Component
  ├─ Client Component  ✅
  ├─ Server Component（直接导入）❌
  └─ Server Component（通过 children）✅
```

### Hydration 流程

```
服务端 HTML: <div>Hello</div>
    ↓
客户端生成虚拟 DOM: <div>Hello</div>
    ↓
对比：一致 ✅
    ↓
不修改 DOM，只添加事件监听器
    ↓
<div onclick={handler}>Hello</div>
```

## 常见模式

### 1. 避免 Hydration Mismatch

```typescript
"use client"
export default function SafeComponent() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null  // 服务端和客户端都返回 null

  // 只在客户端渲染
  return <div>{window.innerWidth}px</div>
}
```

### 2. Server → Client 数据传递

```typescript
// page.tsx (Server)
export default async function Page() {
  const data = await fetchData()
  return <ClientComponent data={data} />  // 通过 props
}

// ClientComponent.tsx
"use client"
export default function ClientComponent({ data }) {
  return <div>{data.title}</div>
}
```

### 3. Client 嵌套 Server（通过 children）

```typescript
// ClientWrapper.tsx
"use client"
export default function ClientWrapper({ children }) {
  return <div>{children}</div>
}

// page.tsx
<ClientWrapper>
  <ServerComponent />  {/* ✅ 可以 */}
</ClientWrapper>
```

## 关键时间点

```
T = 0ms     用户请求
T = 50ms    服务器返回 HTML
T = 50ms    浏览器显示内容（TTFB）✨
T = 100ms   React JS 下载完成
T = 150ms   Hydration 开始
T = 200ms   Hydration 完成
T = 201ms   useEffect 执行
T = 210ms   页面完全可交互 ✨
```

## 请求类型对比

| 操作 | 请求内容 | 大小 | 刷新页面 |
|------|---------|------|---------|
| 输入 URL | 完整 HTML | 200KB | ✅ |
| F5 刷新 | 完整 HTML | 200KB | ✅ |
| <Link> | RSC Payload | 10KB | ❌ |
| <a> 标签 | 完整 HTML | 200KB | ✅ |

## Hook 执行时机

| Hook | 服务端 | 客户端（首次） | 客户端（更新） |
|------|-------|------------|------------|
| useState | ✅ 初始化 | ✅ 初始化 | ✅ 当前值 |
| useEffect | ❌ 不执行 | ✅ 执行 | ✅ 按依赖 |
| useContext | ✅ 读取 | ✅ 读取 | ✅ 读取 |

## 常见错误

```typescript
// ❌ 会导致 Hydration Mismatch
<div>{Math.random()}</div>
<div>{Date.now()}</div>
<div>{localStorage.getItem('key')}</div>

// ✅ 正确做法
const [value, setValue] = useState()
useEffect(() => {
  setValue(localStorage.getItem('key'))
}, [])
if (!value) return null
return <div>{value}</div>
```

## 优化清单

- [ ] 默认使用 Server Components
- [ ] 只在需要交互的地方用 "use client"
- [ ] 使用 Suspense 实现流式渲染
- [ ] 合理设置 Link 的 prefetch
- [ ] 避免不必要的 Hydration Mismatch
- [ ] 使用 loading.tsx 提升用户体验
- [ ] 将交互组件拆分得更小

## 调试命令

```typescript
// 检查运行环境
console.log(typeof window === 'undefined' ? 'server' : 'client')

// 强制刷新路由缓存
router.refresh()

// 禁用预取
<Link href="/page" prefetch={false}>Page</Link>
```

## 关键要记住的 3 点

1. **"use client" 仍会 SSR** - 只是允许使用客户端特性
2. **Hydration 是激活，不是重新渲染** - 只添加事件监听器
3. **useEffect 在 Hydration 完成后执行** - 可以安全地触发状态更新

---

完整文档：[nextjs-rendering-flow.md](./nextjs-rendering-flow.md)
