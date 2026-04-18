# Next.js Layout vs Page 详解

## 目录
- [基础概念](#基础概念)
- [关系与区别](#关系与区别)
- [为什么需要 Layout](#为什么需要-layout)
- [实际使用场景](#实际使用场景)
- [嵌套布局](#嵌套布局)
- [性能优化](#性能优化)
- [最佳实践](#最佳实践)

---

## 基础概念

### Page（页面）

**定义：** 路由的具体内容，每个路由独有的 UI。

```typescript
// app/about/page.tsx
export default function AboutPage() {
  return (
    <div>
      <h1>关于我们</h1>
      <p>这是关于页面的内容</p>
    </div>
  )
}
```

**特点：**
- ✅ 定义路由的主要内容
- ✅ 每次路由切换都会重新渲染
- ✅ 可以访问路由参数
- ✅ 可以是服务端组件或客户端组件

### Layout（布局）

**定义：** 多个页面共享的 UI 包装器。

```typescript
// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <body>
        <header>网站头部</header>
        <nav>导航栏</nav>
        <main>{children}</main>  {/* 这里渲染 page.tsx */}
        <footer>网站底部</footer>
      </body>
    </html>
  )
}
```

**特点：**
- ✅ 包裹多个页面
- ✅ 路由切换时**不会重新渲染**
- ✅ 保持状态（如滚动位置、表单输入）
- ✅ 可以嵌套
- ✅ 必须接收 `children` prop

---

## 关系与区别

### 渲染关系

```
Layout（外层）
  └─> children = Page（内层）
```

**实际渲染结构：**

```typescript
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Header />
        {children}  {/* ← 这里会渲染 page.tsx */}
        <Footer />
      </body>
    </html>
  )
}

// app/page.tsx
export default function HomePage() {
  return <h1>首页内容</h1>
}

// 最终渲染结果：
<html>
  <body>
    <Header />
    <h1>首页内容</h1>  {/* ← 来自 page.tsx */}
    <Footer />
  </body>
</html>
```

### 对比表格

| 特性 | Layout | Page |
|------|--------|------|
| **作用** | 共享的 UI 包装 | 路由的具体内容 |
| **重新渲染** | 路由切换时**不**重新渲染 | 每次切换**都**重新渲染 |
| **必需性** | 可选（根 layout 除外） | 必需（否则路由不存在） |
| **children prop** | 必须接收 | 不接收 |
| **嵌套** | 可以嵌套多层 | 不嵌套 |
| **状态保持** | 保持状态 | 状态丢失 |
| **适用场景** | Header、Footer、侧边栏 | 页面主要内容 |

---

## 为什么需要 Layout

### 场景 1: 避免重复代码

**❌ 不使用 Layout（代码重复）**

```typescript
// app/page.tsx
export default function HomePage() {
  return (
    <div>
      <header>
        <nav>
          <Link href="/">首页</Link>
          <Link href="/about">关于</Link>
          <Link href="/contact">联系</Link>
        </nav>
      </header>

      <main>
        <h1>首页内容</h1>
        <p>欢迎访问</p>
      </main>

      <footer>© 2024 我的网站</footer>
    </div>
  )
}

// app/about/page.tsx
export default function AboutPage() {
  return (
    <div>
      {/* 😩 完全相同的 header */}
      <header>
        <nav>
          <Link href="/">首页</Link>
          <Link href="/about">关于</Link>
          <Link href="/contact">联系</Link>
        </nav>
      </header>

      <main>
        <h1>关于页面</h1>
        <p>关于我们的信息</p>
      </main>

      {/* 😩 完全相同的 footer */}
      <footer>© 2024 我的网站</footer>
    </div>
  )
}

// app/contact/page.tsx - 又是重复的代码...
```

**问题：**
- 每个页面都要写一遍 header 和 footer
- 修改导航需要改所有文件
- 代码冗余，维护困难

**✅ 使用 Layout（代码复用）**

```typescript
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <header>
          <nav>
            <Link href="/">首页</Link>
            <Link href="/about">关于</Link>
            <Link href="/contact">联系</Link>
          </nav>
        </header>

        <main>{children}</main>

        <footer>© 2024 我的网站</footer>
      </body>
    </html>
  )
}

// app/page.tsx - 只需写页面内容
export default function HomePage() {
  return (
    <>
      <h1>首页内容</h1>
      <p>欢迎访问</p>
    </>
  )
}

// app/about/page.tsx - 只需写页面内容
export default function AboutPage() {
  return (
    <>
      <h1>关于页面</h1>
      <p>关于我们的信息</p>
    </>
  )
}
```

**优势：**
- ✅ Header 和 Footer 只写一次
- ✅ 修改导航只需改一个文件
- ✅ 代码简洁，易于维护

---

### 场景 2: 保持组件状态

**❌ 不使用 Layout（状态丢失）**

```typescript
// app/page.tsx
'use client'
import { useState } from 'react'

export default function HomePage() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <header>
        <button onClick={() => setCount(count + 1)}>
          点击次数: {count}
        </button>
        <nav>
          <Link href="/">首页</Link>
          <Link href="/about">关于</Link>
        </nav>
      </header>

      <main>
        <h1>首页内容</h1>
      </main>
    </div>
  )
}

// app/about/page.tsx
'use client'
import { useState } from 'react'

export default function AboutPage() {
  const [count, setCount] = useState(0)  // 😩 又要重新定义

  return (
    <div>
      <header>
        {/* 😩 点击计数器又从 0 开始 */}
        <button onClick={() => setCount(count + 1)}>
          点击次数: {count}
        </button>
        <nav>
          <Link href="/">首页</Link>
          <Link href="/about">关于</Link>
        </nav>
      </header>

      <main>
        <h1>关于页面</h1>
      </main>
    </div>
  )
}
```

**问题：**
- 从首页点到 10，跳转到关于页，又变成 0
- 每个页面的状态互相独立
- 无法保持跨页面的状态

**✅ 使用 Layout（状态保持）**

```typescript
// app/layout.tsx
'use client'
import { useState } from 'react'

export default function RootLayout({ children }) {
  const [count, setCount] = useState(0)

  return (
    <html>
      <body>
        <header>
          {/* ✅ 状态在 Layout 中，不会重置 */}
          <button onClick={() => setCount(count + 1)}>
            点击次数: {count}
          </button>
          <nav>
            <Link href="/">首页</Link>
            <Link href="/about">关于</Link>
          </nav>
        </header>

        <main>{children}</main>
      </body>
    </html>
  )
}

// app/page.tsx
export default function HomePage() {
  return <h1>首页内容</h1>
}

// app/about/page.tsx
export default function AboutPage() {
  return <h1>关于页面</h1>
}
```

**效果：**
- ✅ 从首页切换到关于页，计数器保持
- ✅ 路由切换时，header 不重新渲染
- ✅ 用户体验更好

---

### 场景 3: 性能优化

**渲染对比：**

**不使用 Layout:**
```
用户从首页 → 关于页

重新渲染：
├─ Header（完全重新渲染）
├─ Nav（完全重新渲染）
├─ Page 内容（重新渲染）
└─ Footer（完全重新渲染）

耗时：~100ms
```

**使用 Layout:**
```
用户从首页 → 关于页

重新渲染：
└─ Page 内容（只渲染这部分）

Layout 不渲染：
├─ Header（保持不变）✅
├─ Nav（保持不变）✅
└─ Footer（保持不变）✅

耗时：~20ms（快 5 倍！）
```

**实际性能测试：**

```typescript
// 测试代码
'use client'
import { useEffect } from 'react'

// 在 Layout 中
export default function RootLayout({ children }) {
  useEffect(() => {
    console.log('Layout 渲染')  // 只在首次渲染时打印
  }, [])

  return <html><body>{children}</body></html>
}

// 在 Page 中
export default function HomePage() {
  useEffect(() => {
    console.log('Page 渲染')  // 每次路由切换都打印
  }, [])

  return <h1>首页</h1>
}
```

**控制台输出：**
```
首次访问首页：
  Layout 渲染
  Page 渲染

切换到关于页：
  Page 渲染  ← 只有 Page 重新渲染

切换回首页：
  Page 渲染  ← Layout 依然没有重新渲染
```

---

## 实际使用场景

### 场景 1: 基础网站布局

```typescript
// app/layout.tsx
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function RootLayout({ children }) {
  return (
    <html lang="zh">
      <body>
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}

// app/page.tsx
export default function HomePage() {
  return (
    <div>
      <h1>欢迎来到我的网站</h1>
      <p>这是首页内容</p>
    </div>
  )
}

// app/blog/page.tsx
export default function BlogPage() {
  return (
    <div>
      <h1>博客列表</h1>
      <ul>
        <li>文章 1</li>
        <li>文章 2</li>
      </ul>
    </div>
  )
}
```

**结果：**
- Header 和 Footer 在所有页面显示
- 页面切换时只有主内容区域更新

---

### 场景 2: 后台管理系统

```typescript
// app/(dashboard)/layout.tsx
export default function DashboardLayout({ children }) {
  return (
    <div className="flex">
      {/* 侧边栏 */}
      <aside className="w-64 bg-gray-800 text-white">
        <nav>
          <Link href="/dashboard">仪表板</Link>
          <Link href="/dashboard/users">用户管理</Link>
          <Link href="/dashboard/posts">文章管理</Link>
          <Link href="/dashboard/settings">设置</Link>
        </nav>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  )
}

// app/(dashboard)/dashboard/page.tsx
export default function DashboardPage() {
  return (
    <div>
      <h1>仪表板</h1>
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="用户数" value="1,234" />
        <StatCard title="文章数" value="567" />
        <StatCard title="评论数" value="8,901" />
      </div>
    </div>
  )
}

// app/(dashboard)/dashboard/users/page.tsx
export default function UsersPage() {
  return (
    <div>
      <h1>用户管理</h1>
      <UserTable />
    </div>
  )
}
```

**效果：**
- 侧边栏在所有后台页面显示
- 切换页面时侧边栏不重新渲染
- 侧边栏的状态（如展开/收起）会保持

---

### 场景 3: 认证状态管理

```typescript
// app/layout.tsx
'use client'
import { SessionProvider } from 'next-auth/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {/* ✅ SessionProvider 只初始化一次 */}
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}

// app/page.tsx
'use client'
import { useSession } from 'next-auth/react'

export default function HomePage() {
  const { data: session } = useSession()

  return (
    <div>
      <h1>首页</h1>
      {session ? (
        <p>欢迎, {session.user.name}!</p>
      ) : (
        <p>请登录</p>
      )}
    </div>
  )
}

// app/profile/page.tsx
'use client'
import { useSession } from 'next-auth/react'

export default function ProfilePage() {
  const { data: session } = useSession()

  return (
    <div>
      <h1>个人资料</h1>
      <p>{session?.user.email}</p>
    </div>
  )
}
```

**优势：**
- SessionProvider 在 Layout 中，只初始化一次
- 所有页面共享同一个 session 状态
- 页面切换时不会重新获取 session

---

### 场景 4: Web3 Provider

```typescript
// app/layout.tsx
'use client'
import { WagmiConfig } from 'wagmi'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { wagmiConfig } from '@/config/wagmi'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {/* ✅ Web3 Providers 只初始化一次 */}
        <WagmiConfig config={wagmiConfig}>
          <RainbowKitProvider>
            {children}
          </RainbowKitProvider>
        </WagmiConfig>
      </body>
    </html>
  )
}

// app/page.tsx
'use client'
import { useAccount } from 'wagmi'

export default function HomePage() {
  const { address } = useAccount()

  return (
    <div>
      <h1>首页</h1>
      {address ? (
        <p>钱包地址: {address}</p>
      ) : (
        <p>请连接钱包</p>
      )}
    </div>
  )
}
```

**重要性：**
- Web3 Provider 必须在 Layout 中
- 否则每次路由切换都会重新初始化钱包连接
- 用户体验会很差（不断断开重连）

---

## 嵌套布局

### 多层 Layout 结构

```
app/
├── layout.tsx          # 根 Layout（全局）
├── page.tsx            # 首页
├── blog/
│   ├── layout.tsx      # 博客 Layout（博客专用）
│   ├── page.tsx        # 博客列表
│   └── [slug]/
│       └── page.tsx    # 博客详情
└── dashboard/
    ├── layout.tsx      # 后台 Layout（后台专用）
    ├── page.tsx        # 后台首页
    └── users/
        └── page.tsx    # 用户管理
```

**渲染层级：**

```
访问 /blog/my-post 时的渲染结构：

RootLayout (app/layout.tsx)
  └─> BlogLayout (app/blog/layout.tsx)
        └─> PostPage (app/blog/[slug]/page.tsx)
```

**实际代码：**

```typescript
// app/layout.tsx（根布局）
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Header />
        {children}  {/* ← 这里会渲染 BlogLayout */}
        <Footer />
      </body>
    </html>
  )
}

// app/blog/layout.tsx（博客布局）
export default function BlogLayout({ children }) {
  return (
    <div className="blog-container">
      <aside className="blog-sidebar">
        <h3>分类</h3>
        <ul>
          <li>技术</li>
          <li>生活</li>
        </ul>
      </aside>
      <main className="blog-content">
        {children}  {/* ← 这里会渲染 PostPage */}
      </main>
    </div>
  )
}

// app/blog/[slug]/page.tsx（博客文章）
export default function PostPage({ params }) {
  return (
    <article>
      <h1>{params.slug}</h1>
      <p>文章内容...</p>
    </article>
  )
}
```

**最终渲染结果：**

```html
<html>
  <body>
    <!-- 来自 RootLayout -->
    <header>网站头部</header>

    <!-- 来自 BlogLayout -->
    <div class="blog-container">
      <aside class="blog-sidebar">
        <h3>分类</h3>
        <ul>
          <li>技术</li>
          <li>生活</li>
        </ul>
      </aside>

      <!-- 来自 PostPage -->
      <main class="blog-content">
        <article>
          <h1>my-post</h1>
          <p>文章内容...</p>
        </article>
      </main>
    </div>

    <!-- 来自 RootLayout -->
    <footer>网站底部</footer>
  </body>
</html>
```

---

### 路由组（Route Groups）

使用 `(folder)` 语法创建不影响 URL 的布局。

```
app/
├── layout.tsx          # 根布局
├── (marketing)/
│   ├── layout.tsx      # 营销页面布局
│   ├── page.tsx        # / （首页）
│   └── about/
│       └── page.tsx    # /about
└── (dashboard)/
    ├── layout.tsx      # 后台布局
    └── dashboard/
        └── page.tsx    # /dashboard
```

**特点：**
- `(marketing)` 和 `(dashboard)` 不会出现在 URL 中
- 可以为不同的页面组应用不同的布局

```typescript
// app/(marketing)/layout.tsx
export default function MarketingLayout({ children }) {
  return (
    <div>
      <nav>营销导航</nav>
      {children}
    </div>
  )
}

// app/(dashboard)/layout.tsx
export default function DashboardLayout({ children }) {
  return (
    <div>
      <aside>后台侧边栏</aside>
      {children}
    </div>
  )
}
```

**URL 映射：**
```
/ → 使用 (marketing)/layout.tsx
/about → 使用 (marketing)/layout.tsx
/dashboard → 使用 (dashboard)/layout.tsx
```

---

## 性能优化

### 1. 避免在 Layout 中使用客户端状态

**❌ 不好的做法：**

```typescript
// app/layout.tsx
'use client'
import { useState } from 'react'

export default function RootLayout({ children }) {
  // ❌ 每个页面都会触发这个 useState
  const [theme, setTheme] = useState('light')

  return (
    <html data-theme={theme}>
      <body>{children}</body>
    </html>
  )
}
```

**✅ 好的做法：**

```typescript
// app/layout.tsx
import { ThemeProvider } from '@/components/ThemeProvider'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

// components/ThemeProvider.tsx
'use client'
import { useState, createContext } from 'react'

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light')

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
```

### 2. Loading UI

```typescript
// app/blog/layout.tsx
export default function BlogLayout({ children }) {
  return (
    <div>
      <Suspense fallback={<BlogSidebar.Skeleton />}>
        <BlogSidebar />
      </Suspense>
      <main>
        {children}
      </main>
    </div>
  )
}
```

---

## 最佳实践

### 1. 根 Layout 必须包含 `<html>` 和 `<body>`

```typescript
// ✅ 正确
export default function RootLayout({ children }) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  )
}

// ❌ 错误
export default function RootLayout({ children }) {
  return <div>{children}</div>  // 缺少 html 和 body
}
```

### 2. Layout 不能访问路由参数

```typescript
// ❌ 不行
export default function Layout({ params }) {  // Layout 没有 params
  return <div>{params.id}</div>
}

// ✅ 可以
export default function Page({ params }) {  // Page 可以访问 params
  return <div>{params.id}</div>
}
```

### 3. Layout 之间共享数据

```typescript
// ❌ 不好
// app/layout.tsx
const user = await fetchUser()  // 每次都获取

// app/blog/layout.tsx
const user = await fetchUser()  // 又获取一次

// ✅ 好的做法：使用 React cache
import { cache } from 'react'

const getUser = cache(async () => {
  return await fetchUser()  // 只获取一次
})

// app/layout.tsx
const user = await getUser()

// app/blog/layout.tsx
const user = await getUser()  // 使用缓存的结果
```

### 4. 决策流程

```
需要在多个页面显示相同的 UI？
├─ 是 → 使用 Layout
│   └─ 需要保持状态？
│       ├─ 是 → 客户端组件 Layout
│       └─ 否 → 服务端组件 Layout
│
└─ 否 → 只在 Page 中实现
    └─ 需要复用组件？
        └─ 提取为独立组件
```

### 5. 常见 Layout 模式

```typescript
// 1. 全局 Provider Layout
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>  {/* 全局状态管理 */}
          {children}
        </Providers>
      </body>
    </html>
  )
}

// 2. 导航 Layout
export default function NavLayout({ children }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  )
}

// 3. 侧边栏 Layout
export default function SidebarLayout({ children }) {
  return (
    <div className="flex">
      <Sidebar />
      <main>{children}</main>
    </div>
  )
}

// 4. 居中容器 Layout
export default function CenteredLayout({ children }) {
  return (
    <div className="max-w-4xl mx-auto px-4">
      {children}
    </div>
  )
}
```

---

## 总结

### 核心要点

**Layout 的作用：**
1. ✅ 避免代码重复
2. ✅ 保持组件状态
3. ✅ 提升性能（减少重新渲染）
4. ✅ 共享数据和上下文

**什么时候用 Layout：**
- Header、Footer、导航栏
- 侧边栏
- Provider（状态管理、主题、认证）
- 需要在多个页面保持状态的组件

**什么时候只用 Page：**
- 单独的页面，不需要共享 UI
- 页面独有的内容
- 需要访问路由参数的组件

### 快速参考

```typescript
// 最简单的例子
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <nav>导航</nav>
        {children}        {/* 这里渲染 page.tsx */}
        <footer>底部</footer>
      </body>
    </html>
  )
}

// app/page.tsx
export default function Page() {
  return <h1>页面内容</h1>
}

// 渲染结果：
// <nav>导航</nav>
// <h1>页面内容</h1>
// <footer>底部</footer>
```

**记住：**
- Layout = 包装器（多个页面共享）
- Page = 内容（每个路由独有）
- Layout 不重新渲染，Page 每次都渲染
- 可以没有 Layout，但必须有 Page

你说的对，确实可以不用 Layout 直接写 Page，但使用 Layout 可以让代码更简洁、性能更好、维护更容易！
