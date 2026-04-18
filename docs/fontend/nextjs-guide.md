# Next.js 完全指南

Next.js 是一个基于 React 的生产级全栈框架，提供服务端渲染、静态生成、API 路由等强大功能。

## 目录

- [核心概念](#核心概念)
- [项目结构](#项目结构)
- [路由系统](#路由系统)
- [数据获取](#数据获取)
- [渲染模式](#渲染模式)
- [API 路由](#api-路由)
- [样式方案](#样式方案)
- [优化功能](#优化功能)
- [部署方案](#部署方案)
- [最佳实践](#最佳实践)

---

## 核心概念

### 什么是 Next.js?

- **React 框架**: 基于 React，提供开箱即用的功能
- **全栈能力**: 前端 + 后端 API 一体化
- **零配置**: 约定优于配置，开箱即用
- **生产优化**: 自动代码分割、图片优化、字体优化等

### 主要特性

1. **App Router (Next.js 13+)**: 新一代路由系统
2. **Server Components**: React 服务端组件
3. **Server Actions**: 服务端表单处理
4. **Streaming**: 流式渲染，渐进式加载
5. **Static & Dynamic Rendering**: 灵活的渲染策略
6. **API Routes**: 内置 API 端点
7. **Image Optimization**: 自动图片优化
8. **Font Optimization**: 字体优化和自托管

---

## 项目结构

### App Router 目录结构 (Next.js 13+)

```
my-app/
├── app/                    # 应用目录（新）
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 首页
│   ├── loading.tsx        # 加载状态
│   ├── error.tsx          # 错误处理
│   ├── not-found.tsx      # 404 页面
│   ├── globals.css        # 全局样式
│   │
│   ├── about/             # /about 路由
│   │   └── page.tsx
│   │
│   ├── blog/              # /blog 路由
│   │   ├── page.tsx       # 列表页
│   │   ├── [slug]/        # 动态路由
│   │   │   └── page.tsx   # /blog/[slug]
│   │   └── layout.tsx     # 博客布局
│   │
│   ├── dashboard/         # /dashboard 路由组
│   │   ├── layout.tsx     # 仪表盘布局
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   └── profile/
│   │       └── page.tsx
│   │
│   ├── api/               # API 路由
│   │   └── users/
│   │       └── route.ts   # /api/users
│   │
│   └── (marketing)/       # 路由组（不影响 URL）
│       ├── about/
│       └── contact/
│
├── public/                # 静态资源
│   ├── images/
│   ├── favicon.ico
│   └── robots.txt
│
├── components/            # 可复用组件
│   ├── ui/
│   └── shared/
│
├── lib/                   # 工具函数
│   └── utils.ts
│
├── types/                 # TypeScript 类型
│   └── index.ts
│
├── next.config.js         # Next.js 配置
├── tsconfig.json          # TypeScript 配置
├── tailwind.config.js     # Tailwind CSS 配置
└── package.json
```

### 特殊文件说明

| 文件 | 作用 | 必需 |
|------|------|------|
| `layout.tsx` | 共享布局 | ✅ (根布局) |
| `page.tsx` | 页面内容 | ✅ |
| `loading.tsx` | 加载状态 UI | ❌ |
| `error.tsx` | 错误处理 UI | ❌ |
| `not-found.tsx` | 404 页面 | ❌ |
| `route.ts` | API 端点 | ❌ |
| `template.tsx` | 每次导航时重新渲染的布局 | ❌ |
| `default.tsx` | 并行路由的回退页面 | ❌ |

---

## 路由系统

### 1. 基础路由

```typescript
// app/page.tsx - 首页 (/)
export default function HomePage() {
  return <h1>Home</h1>
}

// app/about/page.tsx - 关于页 (/about)
export default function AboutPage() {
  return <h1>About</h1>
}

// app/blog/posts/page.tsx - 博客文章列表 (/blog/posts)
export default function PostsPage() {
  return <h1>Posts</h1>
}
```

### 2. 动态路由

```typescript
// app/blog/[slug]/page.tsx - /blog/hello-world
interface PageProps {
  params: { slug: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export default function BlogPost({ params, searchParams }: PageProps) {
  return <h1>Post: {params.slug}</h1>
}

// app/shop/[category]/[id]/page.tsx - /shop/shoes/123
export default function Product({ params }: { params: { category: string, id: string } }) {
  return <h1>{params.category} - {params.id}</h1>
}
```

### 3. 捕获所有路由

```typescript
// app/docs/[...slug]/page.tsx - 匹配 /docs/a, /docs/a/b, /docs/a/b/c
export default function DocsPage({ params }: { params: { slug: string[] } }) {
  return <h1>Docs: {params.slug.join('/')}</h1>
}

// app/shop/[[...slug]]/page.tsx - 可选捕获（包括 /shop）
export default function ShopPage({ params }: { params: { slug?: string[] } }) {
  return <h1>Shop: {params.slug?.join('/') || 'All'}</h1>
}
```

### 4. 路由组

```typescript
// 路由组不影响 URL 路径，用于组织代码

// app/(marketing)/about/page.tsx    -> /about
// app/(marketing)/contact/page.tsx  -> /contact
// app/(shop)/products/page.tsx      -> /products
// app/(shop)/cart/page.tsx          -> /cart

// 每个组可以有自己的 layout.tsx
// app/(marketing)/layout.tsx
// app/(shop)/layout.tsx
```

### 5. 并行路由

```typescript
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
  analytics,
  team,
}: {
  children: React.ReactNode
  analytics: React.ReactNode
  team: React.ReactNode
}) {
  return (
    <>
      {children}
      {analytics}
      {team}
    </>
  )
}

// app/dashboard/@analytics/page.tsx
// app/dashboard/@team/page.tsx
```

### 6. 拦截路由

```typescript
// 拦截其他路由的渲染
// app/feed/(..)photo/[id]/page.tsx - 拦截 /photo/[id]
// (.) 同级, (..) 上一级, (...) 根目录
```

### 7. 导航

```typescript
import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

// Link 组件
<Link href="/about">About</Link>
<Link href="/blog/hello-world">Blog Post</Link>
<Link href={{ pathname: '/blog/[slug]', query: { slug: 'hello' } }}>Post</Link>

// useRouter Hook (客户端导航)
'use client'
function MyComponent() {
  const router = useRouter()

  router.push('/dashboard')         // 导航
  router.replace('/login')          // 替换历史记录
  router.refresh()                  // 刷新当前路由
  router.back()                     // 后退
  router.forward()                  // 前进
  router.prefetch('/dashboard')     // 预获取
}

// usePathname Hook (获取当前路径)
const pathname = usePathname() // '/dashboard/settings'

// useSearchParams Hook (获取查询参数)
const searchParams = useSearchParams()
const search = searchParams.get('search') // ?search=test
```

---

## 数据获取

### 1. Server Components (默认)

```typescript
// app/posts/page.tsx
async function getPosts() {
  const res = await fetch('https://api.example.com/posts', {
    // 缓存策略
    cache: 'force-cache',    // 默认，永久缓存
    // cache: 'no-store',    // 不缓存，每次请求
    // next: { revalidate: 60 } // ISR，60秒后重新验证
  })

  if (!res.ok) throw new Error('Failed to fetch')

  return res.json()
}

export default async function PostsPage() {
  const posts = await getPosts()

  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
```

### 2. 并行数据获取

```typescript
async function getUser() {
  const res = await fetch('https://api.example.com/user')
  return res.json()
}

async function getPosts() {
  const res = await fetch('https://api.example.com/posts')
  return res.json()
}

export default async function Dashboard() {
  // 并行获取
  const [user, posts] = await Promise.all([
    getUser(),
    getPosts(),
  ])

  return (
    <div>
      <h1>{user.name}</h1>
      <ul>
        {posts.map((post) => <li key={post.id}>{post.title}</li>)}
      </ul>
    </div>
  )
}
```

### 3. 流式渲染 (Streaming)

```typescript
import { Suspense } from 'react'

// app/dashboard/page.tsx
export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>

      {/* 立即显示 */}
      <UserGreeting />

      {/* 异步加载，显示 loading */}
      <Suspense fallback={<div>Loading posts...</div>}>
        <Posts />
      </Suspense>

      <Suspense fallback={<div>Loading comments...</div>}>
        <Comments />
      </Suspense>
    </div>
  )
}

// 异步组件
async function Posts() {
  const posts = await fetch('https://api.example.com/posts')
  const data = await posts.json()
  return <ul>{data.map(...)}</ul>
}
```

### 4. Client Components 数据获取

```typescript
'use client'

import { useState, useEffect } from 'react'

export default function ClientComponent() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(data => {
        setData(data)
        setLoading(false)
      })
  }, [])

  if (loading) return <div>Loading...</div>

  return <div>{data.title}</div>
}
```

### 5. SWR / React Query (推荐)

```typescript
'use client'

import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function Profile() {
  const { data, error, isLoading } = useSWR('/api/user', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  })

  if (error) return <div>Failed to load</div>
  if (isLoading) return <div>Loading...</div>

  return <div>Hello {data.name}!</div>
}
```

### 6. Server Actions (表单处理)

```typescript
// app/actions.ts
'use server'

export async function createPost(formData: FormData) {
  const title = formData.get('title')
  const content = formData.get('content')

  // 数据库操作
  await db.post.create({
    data: { title, content }
  })

  // 重新验证缓存
  revalidatePath('/posts')

  // 重定向
  redirect('/posts')
}

// app/new-post/page.tsx
import { createPost } from './actions'

export default function NewPost() {
  return (
    <form action={createPost}>
      <input name="title" />
      <textarea name="content" />
      <button type="submit">Submit</button>
    </form>
  )
}
```

---

## 渲染模式

### 1. 静态渲染 (Static Rendering) - 默认

```typescript
// 构建时生成 HTML
export default async function Page() {
  const data = await fetch('https://api.example.com/data', {
    cache: 'force-cache' // 默认
  })

  return <div>{data.title}</div>
}
```

### 2. 动态渲染 (Dynamic Rendering)

```typescript
// 请求时渲染（自动检测）
// 触发条件：
// 1. 使用动态函数（cookies(), headers(), searchParams）
// 2. 使用 cache: 'no-store'
// 3. 使用 dynamic = 'force-dynamic'

import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = cookies()
  const token = cookieStore.get('token')

  return <div>User token: {token}</div>
}

// 强制动态
export const dynamic = 'force-dynamic'
```

### 3. 增量静态再生 (ISR)

```typescript
// 静态生成 + 定时重新验证
export default async function Page() {
  const data = await fetch('https://api.example.com/posts', {
    next: { revalidate: 3600 } // 每小时重新验证
  })

  return <div>{data.title}</div>
}

// 或在页面级别设置
export const revalidate = 3600
```

### 4. 服务端组件 vs 客户端组件

```typescript
// ✅ Server Component (默认)
// - 在服务器上渲染
// - 可以直接访问数据库、文件系统
// - 不能使用 useState, useEffect, onClick 等
// - 包体积小（不包含在客户端 bundle）

async function ServerComponent() {
  const data = await db.query()
  return <div>{data}</div>
}

// ✅ Client Component (需要声明)
// - 在客户端渲染
// - 可以使用 Hooks、事件处理
// - 需要 'use client' 指令
// - 包含在客户端 bundle

'use client'

import { useState } from 'react'

function ClientComponent() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

### 何时使用哪种组件？

| 需求 | 组件类型 |
|------|---------|
| 数据获取 | Server Component |
| 访问后端资源（数据库、文件系统） | Server Component |
| 敏感信息（API keys、tokens） | Server Component |
| 大型依赖库 | Server Component |
| 交互性（onClick、onChange） | Client Component |
| 状态管理（useState、useReducer） | Client Component |
| 生命周期（useEffect） | Client Component |
| 浏览器 API（localStorage、window） | Client Component |
| 自定义 Hooks | Client Component |

---

## API 路由

### 1. 基础 API 路由

```typescript
// app/api/hello/route.ts
export async function GET(request: Request) {
  return Response.json({ message: 'Hello World' })
}

export async function POST(request: Request) {
  const body = await request.json()

  return Response.json({
    message: 'Created',
    data: body
  }, {
    status: 201
  })
}

export async function PUT(request: Request) {
  return Response.json({ message: 'Updated' })
}

export async function DELETE(request: Request) {
  return Response.json({ message: 'Deleted' })
}

export async function PATCH(request: Request) {
  return Response.json({ message: 'Patched' })
}
```

### 2. 动态 API 路由

```typescript
// app/api/posts/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const post = await db.post.findUnique({
    where: { id: params.id }
  })

  if (!post) {
    return Response.json(
      { error: 'Post not found' },
      { status: 404 }
    )
  }

  return Response.json(post)
}
```

### 3. 请求对象

```typescript
export async function GET(request: Request) {
  // URL 和查询参数
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  // Headers
  const token = request.headers.get('authorization')

  // Cookies
  const cookie = request.cookies.get('name')

  // 请求体
  const body = await request.json()
  // 或 const formData = await request.formData()

  return Response.json({ id, token })
}
```

### 4. 响应对象

```typescript
export async function GET() {
  // JSON 响应
  return Response.json({ message: 'Success' })

  // 自定义状态码
  return Response.json({ error: 'Not found' }, { status: 404 })

  // 设置 Headers
  return Response.json(
    { data: 'value' },
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30'
      }
    }
  )

  // 重定向
  return Response.redirect('https://example.com')

  // 流式响应
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode('Hello '))
      controller.enqueue(encoder.encode('World'))
      controller.close()
    }
  })

  return new Response(stream)
}
```

### 5. 中间件

```typescript
// middleware.ts (项目根目录)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 检查认证
  const token = request.cookies.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 添加自定义 header
  const response = NextResponse.next()
  response.headers.set('x-custom-header', 'value')

  return response
}

// 配置匹配路径
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/:path*',
  ]
}
```

---

## 样式方案

### 1. CSS Modules

```typescript
// app/components/Button.module.css
.button {
  background-color: blue;
  color: white;
  padding: 10px 20px;
}

.button:hover {
  background-color: darkblue;
}

// app/components/Button.tsx
import styles from './Button.module.css'

export function Button({ children }) {
  return <button className={styles.button}>{children}</button>
}
```

### 2. Tailwind CSS (推荐)

```typescript
// tailwind.config.js
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0070f3',
      },
    },
  },
  plugins: [],
}

// app/globals.css
@tailwind base;
@tailwind components;
@tailwind utilities;

// 使用
export function Button() {
  return (
    <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
      Click me
    </button>
  )
}
```

### 3. CSS-in-JS (Styled Components)

```typescript
// app/registry.tsx (需要配置)
'use client'

import { useState } from 'react'
import { useServerInsertedHTML } from 'next/navigation'
import { ServerStyleSheet, StyleSheetManager } from 'styled-components'

export default function StyledComponentsRegistry({
  children,
}: {
  children: React.ReactNode
}) {
  const [styledComponentsStyleSheet] = useState(() => new ServerStyleSheet())

  useServerInsertedHTML(() => {
    const styles = styledComponentsStyleSheet.getStyleElement()
    styledComponentsStyleSheet.instance.clearTag()
    return <>{styles}</>
  })

  return (
    <StyleSheetManager sheet={styledComponentsStyleSheet.instance}>
      {children}
    </StyleSheetManager>
  )
}

// app/components/Button.tsx
'use client'

import styled from 'styled-components'

const StyledButton = styled.button`
  background-color: blue;
  color: white;
  padding: 10px 20px;

  &:hover {
    background-color: darkblue;
  }
`

export function Button({ children }) {
  return <StyledButton>{children}</StyledButton>
}
```

### 4. Sass/SCSS

```scss
// app/components/Button.module.scss
.button {
  background-color: blue;
  color: white;
  padding: 10px 20px;

  &:hover {
    background-color: darken(blue, 10%);
  }

  &.large {
    padding: 15px 30px;
    font-size: 1.2em;
  }
}

// 使用
import styles from './Button.module.scss'

export function Button({ size = 'normal' }) {
  return (
    <button className={`${styles.button} ${size === 'large' ? styles.large : ''}`}>
      Click me
    </button>
  )
}
```

---

## 优化功能

### 1. 图片优化

```typescript
import Image from 'next/image'

// 本地图片（自动优化）
import profilePic from '../public/me.png'

export default function Page() {
  return (
    <Image
      src={profilePic}
      alt="Picture of the author"
      // width={500} 自动从导入获取
      // height={500}
      // blurDataURL="data:..." 自动生成
      placeholder="blur" // 可选的模糊占位符
    />
  )
}

// 远程图片（需要配置域名）
export default function Page() {
  return (
    <Image
      src="https://example.com/profile.png"
      alt="Profile"
      width={500}
      height={500}
      priority // 优先加载（LCP 图片）
      quality={75} // 1-100，默认 75
    />
  )
}

// next.config.js - 配置远程图片域名
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'example.com',
        port: '',
        pathname: '/images/**',
      },
    ],
  },
}

// 响应式图片
<Image
  src="/hero.png"
  alt="Hero"
  fill // 填充父容器
  style={{ objectFit: 'cover' }}
/>
```

### 2. 字体优化

```typescript
// app/layout.tsx
import { Inter, Roboto_Mono } from 'next/font/google'

// Google 字体
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
})

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <body>{children}</body>
    </html>
  )
}

// 本地字体
import localFont from 'next/font/local'

const myFont = localFont({
  src: './my-font.woff2',
  display: 'swap',
})

// 多个字重
const roboto = localFont({
  src: [
    {
      path: './Roboto-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: './Roboto-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
})
```

### 3. Script 优化

```typescript
import Script from 'next/script'

export default function Page() {
  return (
    <>
      {/* 第三方脚本 */}
      <Script
        src="https://www.google-analytics.com/analytics.js"
        strategy="afterInteractive" // 页面交互后加载
      />

      {/* 内联脚本 */}
      <Script id="show-banner" strategy="lazyOnload">
        {`console.log('Hello')`}
      </Script>

      {/* 事件处理 */}
      <Script
        src="https://example.com/script.js"
        onLoad={() => {
          console.log('Script loaded')
        }}
        onError={(e) => {
          console.error('Script failed to load', e)
        }}
      />
    </>
  )
}

// strategy 选项：
// - beforeInteractive: 页面交互前加载（关键脚本）
// - afterInteractive: 页面交互后加载（默认）
// - lazyOnload: 浏览器空闲时加载
// - worker: Web Worker 中加载（实验性）
```

### 4. Metadata (SEO)

```typescript
// app/layout.tsx - 静态 metadata
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My App',
  description: 'My App Description',
  keywords: ['Next.js', 'React', 'JavaScript'],
  authors: [{ name: 'John Doe' }],
  openGraph: {
    title: 'My App',
    description: 'My App Description',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'My App',
    description: 'My App Description',
    images: ['/twitter-image.jpg'],
  },
}

// app/blog/[slug]/page.tsx - 动态 metadata
export async function generateMetadata({ params }): Promise<Metadata> {
  const post = await getPost(params.slug)

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      images: [post.coverImage],
    },
  }
}

// Template metadata
export const metadata = {
  title: {
    template: '%s | My App',
    default: 'My App',
  },
}
// 子页面: title: 'About' => 'About | My App'
```

### 5. 代码分割

```typescript
// 动态导入组件
import dynamic from 'next/dynamic'

// 客户端组件懒加载
const DynamicComponent = dynamic(() => import('../components/Heavy'), {
  loading: () => <p>Loading...</p>,
  ssr: false, // 禁用 SSR
})

export default function Page() {
  return <DynamicComponent />
}

// 命名导出
const DynamicHeader = dynamic(
  () => import('../components/Header').then(mod => mod.Header),
  { ssr: false }
)

// 根据条件加载
export default function Page({ showModal }) {
  return (
    <>
      {showModal && <DynamicComponent />}
    </>
  )
}
```

---

## 部署方案

### 1. Vercel (推荐)

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel

# 生产部署
vercel --prod
```

### 2. 自托管 (Node.js)

```bash
# 构建
npm run build

# 启动生产服务器
npm run start

# 使用 PM2
pm2 start npm --name "my-app" -- start

# Docker
# Dockerfile
FROM node:18-alpine AS base

# 依赖
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# 构建
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 运行
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

### 3. 静态导出

```typescript
// next.config.js
module.exports = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true, // 禁用图片优化
  },
}

// 构建
npm run build
// 生成 out/ 目录，部署到任何静态托管服务
```

### 4. 环境变量

```bash
# .env.local (本地开发，不提交到 Git)
DATABASE_URL=postgresql://...
NEXT_PUBLIC_API_URL=https://api.example.com

# .env.production (生产环境)
DATABASE_URL=postgresql://prod...
NEXT_PUBLIC_API_URL=https://api.production.com
```

```typescript
// 使用环境变量
// 服务端
const dbUrl = process.env.DATABASE_URL

// 客户端（必须以 NEXT_PUBLIC_ 开头）
const apiUrl = process.env.NEXT_PUBLIC_API_URL
```

---

## 最佳实践

### 1. 性能优化

```typescript
// ✅ 使用 Server Components（默认）
async function Posts() {
  const posts = await getPosts()
  return <PostList posts={posts} />
}

// ✅ 并行数据获取
const [user, posts] = await Promise.all([getUser(), getPosts()])

// ✅ 流式渲染
<Suspense fallback={<Loading />}>
  <AsyncComponent />
</Suspense>

// ✅ 图片优化
<Image src="/hero.jpg" alt="Hero" width={1200} height={600} priority />

// ✅ 代码分割
const Heavy = dynamic(() => import('./Heavy'), { ssr: false })

// ✅ 缓存策略
fetch(url, {
  next: { revalidate: 3600 } // ISR
})

// ❌ 避免在服务端组件中使用客户端状态
// 错误示例
async function ServerComponent() {
  const [state, setState] = useState(0) // ❌ 不能在服务端组件使用
  return <div>{state}</div>
}

// 正确示例：拆分为客户端组件
async function ServerComponent() {
  const data = await getData()
  return <ClientComponent data={data} />
}

'use client'
function ClientComponent({ data }) {
  const [state, setState] = useState(0) // ✅
  return <div>{state}</div>
}
```

### 2. SEO 优化

```typescript
// ✅ 设置 Metadata
export const metadata = {
  title: 'Page Title',
  description: 'Page description',
  openGraph: {
    images: ['/og-image.jpg'],
  },
}

// ✅ 生成 sitemap
// app/sitemap.ts
export default function sitemap() {
  return [
    {
      url: 'https://example.com',
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1,
    },
    {
      url: 'https://example.com/about',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]
}

// ✅ 生成 robots.txt
// app/robots.ts
export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/private/',
    },
    sitemap: 'https://example.com/sitemap.xml',
  }
}
```

### 3. 错误处理

```typescript
// app/error.tsx - 错误边界
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}

// app/global-error.tsx - 根错误
'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <h2>Something went wrong!</h2>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  )
}

// app/not-found.tsx - 404 页面
export default function NotFound() {
  return (
    <div>
      <h2>Not Found</h2>
      <p>Could not find requested resource</p>
    </div>
  )
}
```

### 4. 类型安全

```typescript
// 使用 TypeScript
interface Post {
  id: string
  title: string
  content: string
}

// 类型化 params 和 searchParams
interface PageProps {
  params: { slug: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function Page({ params, searchParams }: PageProps) {
  const post: Post = await getPost(params.slug)
  return <div>{post.title}</div>
}

// 类型化 API 路由
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
): Promise<Response> {
  const post = await db.post.findUnique({
    where: { id: params.id }
  })

  return Response.json(post)
}
```

### 5. 安全性

```typescript
// ✅ 使用环境变量存储敏感信息
const apiKey = process.env.API_KEY // 服务端

// ✅ 验证用户输入
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export async function POST(request: Request) {
  const body = await request.json()
  const result = schema.safeParse(body)

  if (!result.success) {
    return Response.json(
      { error: result.error },
      { status: 400 }
    )
  }

  // 处理有效数据
}

// ✅ 使用 CSRF 保护
// 使用 middleware 验证 token

// ✅ 设置安全 Headers
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}
```

---

## 常见问题

### Q: Server Component vs Client Component 如何选择？

**使用 Server Component (默认)：**
- 数据获取
- 访问后端资源
- 保护敏感信息
- 减少客户端 JavaScript

**使用 Client Component ('use client')：**
- 交互性（onClick、onChange）
- 状态管理（useState、useReducer）
- 生命周期（useEffect）
- 浏览器 API
- 自定义 Hooks

### Q: 如何优化大型应用的性能？

1. **代码分割**: 使用 `dynamic()` 懒加载组件
2. **流式渲染**: 使用 `<Suspense>` 渐进式加载
3. **图片优化**: 使用 `next/image`
4. **缓存策略**: 合理使用 `revalidate`
5. **并行数据获取**: 使用 `Promise.all()`

### Q: Pages Router vs App Router?

**App Router (推荐)：**
- Next.js 13+ 新特性
- Server Components
- 流式渲染
- 更好的性能
- 更灵活的布局

**Pages Router (旧版)：**
- Next.js 12 及以下
- 更成熟的生态
- 兼容旧项目

### Q: 如何处理认证？

```typescript
// 使用 middleware
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')

  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/dashboard/:path*',
}

// 或使用 NextAuth.js
import NextAuth from 'next-auth'
import GithubProvider from 'next-auth/providers/github'

export const authOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  ],
}

export default NextAuth(authOptions)
```

---

## 学习资源

### 官方文档
- [Next.js 官方文档](https://nextjs.org/docs)
- [Next.js 示例](https://github.com/vercel/next.js/tree/canary/examples)
- [App Router 指南](https://nextjs.org/docs/app)

### 推荐教程
- [Next.js 官方教程](https://nextjs.org/learn)
- [Vercel 博客](https://vercel.com/blog)

### 常用库
- **状态管理**: Zustand, Jotai, Redux Toolkit
- **数据获取**: SWR, React Query
- **表单**: React Hook Form, Formik
- **样式**: Tailwind CSS, Styled Components
- **UI 组件**: shadcn/ui, Radix UI, Headless UI
- **认证**: NextAuth.js, Clerk
- **数据库 ORM**: Prisma, Drizzle
- **验证**: Zod, Yup

---

## 总结

Next.js 的核心优势：

✅ **零配置** - 开箱即用
✅ **全栈能力** - 前端 + 后端一体化
✅ **性能优化** - 自动代码分割、图片优化
✅ **SEO 友好** - 服务端渲染
✅ **开发体验** - 快速刷新、TypeScript 支持
✅ **生产就绪** - Vercel 一键部署

记住：**先使用 Server Components，需要交互时再使用 Client Components！**
