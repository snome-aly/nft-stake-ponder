# Suspense 流式渲染完整指南

## 什么是流式渲染（Streaming SSR）

流式渲染允许服务器**分批次**发送 HTML，而不是等待所有内容准备好才发送。

### 核心思想

**传统 SSR：** 等待所有数据 → 生成完整 HTML → 一次性发送
**流式 SSR：** 立即发送快速部分 → 继续生成慢速部分 → 陆续发送

---

## 实现原理

### 1. HTTP 流式传输基础

流式渲染基于 **HTTP/1.1 的分块传输编码**（Chunked Transfer Encoding）：

```
客户端请求：
GET /page HTTP/1.1

服务器响应：
HTTP/1.1 200 OK
Content-Type: text/html
Transfer-Encoding: chunked  ← 关键！

<!-- 第一块：立即发送 -->
<html>
  <body>
    <h1>快速内容</h1>
    <div id="B:0"><skeleton /></div>

<!-- 连接保持打开... -->

<!-- 第二块：5秒后发送 -->
    <template id="B:0-content">
      <div>慢速内容</div>
    </template>
    <script>replace('B:0')</script>
  </body>
</html>
```

**关键特性：**
- 服务器不关闭连接
- 浏览器边接收边渲染
- 可以发送多个块（chunks）

### 2. 服务器端完整流程

```
┌────────────────────────────────────────────────────────────┐
│ 1. 接收请求                                                │
└────────────────┬───────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────┐
│ 2. 开始渲染页面                                            │
├────────────────────────────────────────────────────────────┤
│  ├─ 渲染 Header（同步，立即完成）                          │
│  ├─ 渲染 UserProfile（async，0.1秒完成）                   │
│  └─ 遇到 <Suspense>                                        │
│      ├─ 不等待 Comments 加载                               │
│      ├─ 立即渲染 fallback（CommentsSkeleton）              │
│      └─ 在后台启动异步任务：加载 Comments                   │
└────────────────┬───────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────┐
│ 3. 发送第一批 HTML（0.3秒）                                │
├────────────────────────────────────────────────────────────┤
│ HTTP/1.1 200 OK                                            │
│ Transfer-Encoding: chunked                                 │
│                                                            │
│ <html>                                                     │
│   <head>                                                   │
│     <script>                                               │
│       // Suspense 替换逻辑                                 │
│       function $RC(id, html) {                             │
│         document.getElementById(id).innerHTML = html       │
│       }                                                    │
│     </script>                                              │
│   </head>                                                  │
│   <body>                                                   │
│     <header>Header Content</header>                        │
│     <div class="user">John Doe</div>                       │
│                                                            │
│     <!-- Suspense boundary -->                             │
│     <div id="B:0">                                         │
│       <div class="skeleton">Loading...</div>               │
│     </div>                                                 │
│                                                            │
│ <!-- 连接保持打开，不发送 </body></html> -->                │
└────────────────┬───────────────────────────────────────────┘
                 │
                 │ 浏览器立即渲染这部分 ✨
                 │
                 ▼
┌────────────────────────────────────────────────────────────┐
│ 4. 等待异步任务完成                                         │
├────────────────────────────────────────────────────────────┤
│  后台任务：                                                │
│    fetchComments() → 5秒后完成                             │
│    渲染 <Comments> 组件                                    │
│    序列化成 HTML                                           │
└────────────────┬───────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────┐
│ 5. 发送第二批 HTML（5秒后）                                │
├────────────────────────────────────────────────────────────┤
│     <!-- 继续之前的 HTML 流 -->                            │
│                                                            │
│     <template id="B:0-content" hidden>                     │
│       <div class="comments">                               │
│         <div>Comment 1</div>                               │
│         <div>Comment 2</div>                               │
│         <div>Comment 3</div>                               │
│       </div>                                               │
│     </template>                                            │
│                                                            │
│     <script>                                               │
│       $RC('B:0', document.getElementById('B:0-content').innerHTML)│
│     </script>                                              │
│                                                            │
│   </body>                                                  │
│ </html>                                                    │
│                                                            │
│ <!-- 现在才关闭连接 -->                                     │
└────────────────────────────────────────────────────────────┘
```

### 3. 浏览器端完整流程

```
┌────────────────────────────────────────────────────────────┐
│ T = 0ms: 发送请求                                          │
└────────────────┬───────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────┐
│ T = 300ms: 接收第一批 HTML                                 │
├────────────────────────────────────────────────────────────┤
│  ├─ 解析 HTML                                              │
│  ├─ 构建 DOM 树（部分）                                     │
│  ├─ 执行 <script> 中的替换函数                             │
│  └─ 开始渲染                                               │
│                                                            │
│  渲染结果：                                                │
│    ✅ Header 显示                                          │
│    ✅ UserProfile 显示                                     │
│    ⏳ CommentsSkeleton 显示（占位符）                       │
│                                                            │
│  ⚠️ 注意：浏览器还在等待更多数据（连接未关闭）               │
└────────────────┬───────────────────────────────────────────┘
                 │
                 │ 用户可以看到内容并开始交互 ✨
                 │
                 ▼
┌────────────────────────────────────────────────────────────┐
│ T = 300ms - 5000ms: 等待中                                 │
├────────────────────────────────────────────────────────────┤
│  ├─ 用户可以滚动页面                                       │
│  ├─ 可以点击链接                                           │
│  ├─ 可以阅读已显示的内容                                   │
│  └─ skeleton 提供视觉反馈                                  │
└────────────────┬───────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────┐
│ T = 5000ms: 接收第二批 HTML                                │
├────────────────────────────────────────────────────────────┤
│  ├─ 解析新的 HTML 片段                                     │
│  ├─ 发现 <template id="B:0-content">                      │
│  ├─ 执行 <script> 替换逻辑：                               │
│  │   $RC('B:0', ...)                                      │
│  │     ↓                                                  │
│  │   找到 id="B:0" 的元素                                 │
│  │     ↓                                                  │
│  │   替换 innerHTML                                       │
│  │     ↓                                                  │
│  │   CommentsSkeleton → Comments 真实内容                 │
│  └─ 重新渲染该区域                                         │
│                                                            │
│  ⚠️ 注意：只更新 #B:0 区域，其他部分不变                    │
└────────────────┬───────────────────────────────────────────┘
                 │
                 ▼
              ╔════════════╗
              ║ 页面完整 ✨ ║
              ╚════════════╝
```

### 4. 实际 HTML 输出示例

#### 第一批 HTML（0.3秒发送）

```html
<!DOCTYPE html>
<html>
<head>
  <title>Blog Post</title>
  <script>
    // Next.js 注入的 Suspense 替换逻辑（简化版）
    function $RC(id, html) {
      const el = document.getElementById(id)
      if (el) {
        el.innerHTML = html
        // 触发 React hydration（如果需要）
        if (window.__NEXT_DATA__) {
          // ... hydration logic
        }
      }
    }
  </script>
</head>
<body>
  <!-- 快速内容：立即显示 -->
  <header>
    <nav>Blog Navigation</nav>
  </header>

  <main>
    <article>
      <h1>Article Title</h1>
      <p>Article content...</p>
    </article>

    <!-- Suspense boundary: 显示 fallback -->
    <div id="B:0">
      <div class="animate-pulse space-y-4">
        <div class="h-4 bg-gray-200 rounded w-1/4"></div>
        <div class="h-4 bg-gray-200 rounded"></div>
        <div class="h-4 bg-gray-200 rounded"></div>
      </div>
    </div>
  </main>

  <footer>Footer Content</footer>

<!-- ⚠️ 注意：没有 </body></html>，连接保持打开 -->
```

**关键点：**
1. 页面结构完整，用户可以看到内容
2. `#B:0` 显示骨架屏（fallback）
3. 没有关闭 `</body></html>` 标签
4. HTTP 连接保持打开

#### 第二批 HTML（5秒后继续发送）

```html
<!-- 继续上面的 HTML 流 -->

<!-- 真实的 Comments 内容（隐藏在 template 中） -->
<template id="B:0-content" hidden>
  <section class="comments">
    <h3 class="text-xl font-bold mb-4">Comments (3)</h3>

    <div class="comment mb-4">
      <div class="flex items-start">
        <img src="/avatar1.jpg" class="w-10 h-10 rounded-full" />
        <div class="ml-3">
          <strong class="text-blue-600">Alice</strong>
          <p class="text-gray-700">Great article! Very helpful.</p>
          <span class="text-sm text-gray-500">2 hours ago</span>
        </div>
      </div>
    </div>

    <div class="comment mb-4">
      <div class="flex items-start">
        <img src="/avatar2.jpg" class="w-10 h-10 rounded-full" />
        <div class="ml-3">
          <strong class="text-blue-600">Bob</strong>
          <p class="text-gray-700">Thanks for sharing!</p>
          <span class="text-sm text-gray-500">1 hour ago</span>
        </div>
      </div>
    </div>

    <div class="comment">
      <div class="flex items-start">
        <img src="/avatar3.jpg" class="w-10 h-10 rounded-full" />
        <div class="ml-3">
          <strong class="text-blue-600">Charlie</strong>
          <p class="text-gray-700">Looking forward to more posts.</p>
          <span class="text-sm text-gray-500">30 minutes ago</span>
        </div>
      </div>
    </div>
  </section>
</template>

<!-- 替换脚本：立即执行 -->
<script>
  (function() {
    const template = document.getElementById('B:0-content')
    if (template) {
      $RC('B:0', template.innerHTML)
      template.remove()  // 清理 template 标签
    }
  })()
</script>

  </body>
</html>
<!-- 现在才关闭连接 -->
```

**关键点：**
1. 内容放在 `<template>` 中（不会显示）
2. 立即执行 `<script>` 替换内容
3. `$RC('B:0', ...)` 将真实内容替换骨架屏
4. 完成后关闭 `</body></html>` 和 HTTP 连接

### 5. 替换过程的 DOM 变化

```
替换前（T = 0.3s）：
─────────────────────────────────────
<div id="B:0">
  <div class="animate-pulse">
    <div class="h-4 bg-gray-200"></div>  ← skeleton
    <div class="h-4 bg-gray-200"></div>
    <div class="h-4 bg-gray-200"></div>
  </div>
</div>

替换后（T = 5s）：
─────────────────────────────────────
<div id="B:0">
  <section class="comments">           ← 真实内容
    <h3>Comments (3)</h3>
    <div class="comment">...</div>
    <div class="comment">...</div>
    <div class="comment">...</div>
  </section>
</div>
```

浏览器只更新 `#B:0` 内部的 HTML，页面其他部分保持不变！

---

## 传统 SSR vs 流式 SSR

#### 传统 SSR（全部或无）

```typescript
// app/page.tsx
export default async function Page() {
  const user = await fetchUser()        // 0.1秒
  const posts = await fetchPosts()      // 0.2秒
  const comments = await fetchComments() // 5秒 ← 阻塞整个页面！

  return (
    <div>
      <UserProfile user={user} />
      <Posts posts={posts} />
      <Comments comments={comments} />
    </div>
  )
}
```

**时间线：**
```
T=0s    用户请求
T=5.3s  服务器返回完整 HTML（等待最慢的 fetchComments）
T=5.3s  用户看到页面 😞
```

#### 流式 SSR（使用 Suspense）

```typescript
// app/page.tsx
import { Suspense } from 'react'

export default function Page() {
  return (
    <div>
      {/* 这部分立即渲染 */}
      <UserProfileWrapper />
      <PostsWrapper />

      {/* 慢速部分用 Suspense 包裹 */}
      <Suspense fallback={<CommentsSkeleton />}>
        <Comments />
      </Suspense>
    </div>
  )
}

// 快速组件
async function UserProfileWrapper() {
  const user = await fetchUser()  // 0.1秒
  return <UserProfile user={user} />
}

async function PostsWrapper() {
  const posts = await fetchPosts()  // 0.2秒
  return <Posts posts={posts} />
}

// 慢速组件
async function Comments() {
  const comments = await fetchComments()  // 5秒
  return <CommentsList comments={comments} />
}

// 占位符组件
function CommentsSkeleton() {
  return <div className="animate-pulse">Loading comments...</div>
}
```

**时间线：**
```
T=0s    用户请求
T=0.3s  服务器返回第一批 HTML（UserProfile + Posts + CommentsSkeleton）
T=0.3s  用户看到页面框架 ✨
T=5s    服务器返回第二批 HTML（真实的 Comments）
T=5s    浏览器替换 CommentsSkeleton → CommentsList
```

---

## 嵌套 Suspense

```typescript
export default function Page() {
  return (
    <div>
      <Header />

      <Suspense fallback={<PageSkeleton />}>
        <MainContent />
      </Suspense>
    </div>
  )
}

async function MainContent() {
  const data = await fetchMainData()  // 1秒

  return (
    <div>
      <h1>{data.title}</h1>

      {/* 嵌套的 Suspense */}
      <Suspense fallback={<SidebarSkeleton />}>
        <Sidebar />
      </Suspense>

      <Suspense fallback={<CommentsSkeleton />}>
        <Comments />
      </Suspense>
    </div>
  )
}

async function Sidebar() {
  const sidebar = await fetchSidebar()  // 2秒
  return <aside>{sidebar.content}</aside>
}

async function Comments() {
  const comments = await fetchComments()  // 5秒
  return <CommentsList comments={comments} />
}
```

**发送批次：**
```
批次 1 (0ms):
  <Header />
  <PageSkeleton />  ← MainContent 的 fallback

批次 2 (1000ms):
  <h1>...</h1>
  <SidebarSkeleton />   ← Sidebar 的 fallback
  <CommentsSkeleton />  ← Comments 的 fallback

批次 3 (2000ms):
  <aside>...</aside>    ← 替换 SidebarSkeleton

批次 4 (5000ms):
  <CommentsList>...</CommentsList>  ← 替换 CommentsSkeleton
```

---

## 完整示例：博客页面

```typescript
// app/blog/[id]/page.tsx
import { Suspense } from 'react'

export default function BlogPost({ params }: { params: { id: string } }) {
  return (
    <div className="container">
      {/* 1. 立即显示 - 无需等待 */}
      <Header />
      <Navigation />

      {/* 2. 快速内容 - 0.1秒 */}
      <Suspense fallback={<ArticleSkeleton />}>
        <Article id={params.id} />
      </Suspense>

      {/* 3. 中速内容 - 1秒 */}
      <Suspense fallback={<RelatedPostsSkeleton />}>
        <RelatedPosts id={params.id} />
      </Suspense>

      {/* 4. 慢速内容 - 5秒 */}
      <Suspense fallback={<CommentsSkeleton />}>
        <Comments id={params.id} />
      </Suspense>

      {/* 5. 立即显示 */}
      <Footer />
    </div>
  )
}

// 快速组件（0.1秒）
async function Article({ id }: { id: string }) {
  const article = await fetch(`/api/articles/${id}`).then(r => r.json())

  return (
    <article>
      <h1>{article.title}</h1>
      <p>{article.author}</p>
      <div dangerouslySetInnerHTML={{ __html: article.content }} />
    </article>
  )
}

// 中速组件（1秒）
async function RelatedPosts({ id }: { id: string }) {
  await new Promise(resolve => setTimeout(resolve, 1000))  // 模拟延迟
  const posts = await fetch(`/api/articles/${id}/related`).then(r => r.json())

  return (
    <aside>
      <h3>Related Posts</h3>
      {posts.map(post => (
        <a key={post.id} href={`/blog/${post.id}`}>
          {post.title}
        </a>
      ))}
    </aside>
  )
}

// 慢速组件（5秒）
async function Comments({ id }: { id: string }) {
  await new Promise(resolve => setTimeout(resolve, 5000))  // 模拟延迟
  const comments = await fetch(`/api/articles/${id}/comments`).then(r => r.json())

  return (
    <div className="comments">
      <h3>Comments ({comments.length})</h3>
      {comments.map(comment => (
        <div key={comment.id} className="comment">
          <strong>{comment.author}:</strong>
          <p>{comment.content}</p>
        </div>
      ))}
    </div>
  )
}

// Skeleton 组件
function ArticleSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
      <div className="h-4 bg-gray-200 rounded mb-2"></div>
      <div className="h-4 bg-gray-200 rounded mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
    </div>
  )
}

function RelatedPostsSkeleton() {
  return (
    <aside className="animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded mb-1"></div>
      <div className="h-4 bg-gray-200 rounded mb-1"></div>
      <div className="h-4 bg-gray-200 rounded"></div>
    </aside>
  )
}

function CommentsSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
      {[1, 2, 3].map(i => (
        <div key={i} className="mb-4">
          <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
        </div>
      ))}
    </div>
  )
}
```

---

## 用户体验对比

### 传统 SSR

```
时间轴：
0s    ┃ 用户请求
      ┃
      ┃ 等待中...（白屏）
      ┃
      ┃ 等待中...（白屏）
      ┃
      ┃ 等待中...（白屏）
      ┃
5s    ┃ 页面突然出现 ✨
      ┃
用户感受：😞 等待时间长，没有反馈
```

### 流式 SSR

```
时间轴：
0s    ┃ 用户请求
      ┃
0.1s  ┃ Header + Navigation 出现 ✨
      ┃ Article Skeleton 出现
      ┃ Related Posts Skeleton 出现
      ┃ Comments Skeleton 出现
      ┃
0.2s  ┃ Article 内容替换 Skeleton ✨
      ┃
1s    ┃ Related Posts 出现 ✨
      ┃
5s    ┃ Comments 出现 ✨
      ┃
用户感受：😊 立即看到反馈，渐进式加载
```

---

## 性能指标改善

### 关键指标

| 指标 | 传统 SSR | 流式 SSR | 改善 |
|------|---------|---------|------|
| **TTFB** (首字节时间) | 5秒 | 0.1秒 | ⬇️ 98% |
| **FCP** (首次内容绘制) | 5秒 | 0.1秒 | ⬇️ 98% |
| **LCP** (最大内容绘制) | 5秒 | 0.2秒 | ⬇️ 96% |
| **用户可交互时间** | 5秒 | 0.1秒 | ⬇️ 98% |

---

## 最佳实践

### 1. 合理划分边界

```typescript
// ✅ 好：按速度划分
<Suspense fallback={<Fast />}>
  <SlowComponent />
</Suspense>

// ❌ 坏：把所有东西都包在一个 Suspense 里
<Suspense fallback={<AllSkeleton />}>
  <FastComponent />
  <SlowComponent />
</Suspense>
```

### 2. 提供有意义的 fallback

```typescript
// ✅ 好：模拟真实内容的 Skeleton
function CommentsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  )
}

// ❌ 坏：简单的 Loading 文字
function CommentsSkeleton() {
  return <div>Loading...</div>
}
```

### 3. 考虑网络速度

```typescript
// 对于快速 API（< 200ms），可以不用 Suspense
async function FastComponent() {
  const data = await fetch('/api/fast')  // 50ms
  return <div>{data}</div>
}

// 对于慢速 API（> 500ms），一定要用 Suspense
<Suspense fallback={<Skeleton />}>
  <SlowComponent />  {/* 5秒 */}
</Suspense>
```

### 4. 避免布局偏移（Layout Shift）

```typescript
// ✅ 好：Skeleton 和真实内容尺寸一致
function CommentsSkeleton() {
  return (
    <div className="h-96">  {/* 固定高度 */}
      {/* skeleton content */}
    </div>
  )
}

function Comments() {
  return (
    <div className="h-96">  {/* 相同高度 */}
      {/* real content */}
    </div>
  )
}

// ❌ 坏：尺寸不一致，导致布局跳动
function CommentsSkeleton() {
  return <div className="h-20">...</div>
}

function Comments() {
  return <div className="h-96">...</div>  // 突然变高！
}
```

---

## 与 loading.tsx 的关系

```typescript
// app/dashboard/loading.tsx
export default function Loading() {
  return <DashboardSkeleton />
}

// app/dashboard/page.tsx
export default async function Dashboard() {
  const data = await fetchDashboardData()  // 慢
  return <DashboardContent data={data} />
}
```

**等价于：**
```typescript
// app/dashboard/page.tsx
<Suspense fallback={<DashboardSkeleton />}>
  <DashboardContent />
</Suspense>
```

**区别：**
- `loading.tsx` - 自动包裹整个页面（粗粒度）
- `<Suspense>` - 手动控制，可以多个（细粒度）

---

## 注意事项

### 1. 不能在 Client Component 中使用

```typescript
// ❌ 错误：Client Component 不能 async
"use client"
export default async function ClientComponent() {
  const data = await fetch('/api/data')  // 报错！
  return <div>{data}</div>
}

// ✅ 正确：Server Component 才能 async
export default async function ServerComponent() {
  const data = await fetch('/api/data')  // ✅
  return <div>{data}</div>
}
```

### 2. SEO 考虑

流式渲染对 SEO 友好，因为：
- 搜索引擎爬虫会等待完整 HTML
- 慢速内容最终会被渲染和索引

### 3. 并行数据获取

```typescript
// ❌ 串行：总时间 = 1s + 2s + 3s = 6s
async function BadComponent() {
  const user = await fetchUser()      // 1秒
  const posts = await fetchPosts()    // 2秒
  const comments = await fetchComments() // 3秒
  return <div>...</div>
}

// ✅ 并行：总时间 = max(1s, 2s, 3s) = 3s
async function GoodComponent() {
  const [user, posts, comments] = await Promise.all([
    fetchUser(),      // 1秒 ┐
    fetchPosts(),     // 2秒 ├─ 并行执行
    fetchComments(),  // 3秒 ┘
  ])
  return <div>...</div>
}
```

---

## 总结

### 核心优势

1. **更快的 TTFB** - 用户立即看到内容
2. **更好的 UX** - 渐进式加载，有反馈
3. **不阻塞快速内容** - 慢速部分不影响快速部分
4. **更好的感知性能** - 用户觉得更快

### 何时使用

✅ **应该用**：
- 页面有慢速数据源（> 500ms）
- 不同部分加载速度差异大
- 需要改善首屏加载体验

❌ **不需要用**：
- 所有数据都很快（< 200ms）
- 数据加载速度相近
- 简单页面

### 关键要点

1. Suspense 允许**分批发送 HTML**
2. 浏览器**边接收边渲染**
3. 用户**更快看到内容**
4. **渐进式增强**体验

---

**文档版本：** 1.0
**适用于：** Next.js 13+ (App Router)
