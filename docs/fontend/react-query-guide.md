# TanStack React Query 学习指南

## 目录
1. [核心概念](#核心概念)
2. [基础使用](#基础使用)
3. [查询（Queries）](#查询queries)
4. [变更（Mutations）](#变更mutations)
5. [缓存机制](#缓存机制)
6. [查询失效与重新获取](#查询失效与重新获取)
7. [高级特性](#高级特性)
8. [最佳实践](#最佳实践)

---

## 核心概念

### 什么是 React Query？

**TanStack Query（原名 React Query）** 是一个强大的**异步状态管理库**，专门用于处理服务器状态（server state）。

### 为什么需要 React Query？

```typescript
// ❌ 传统方式：手动管理异步状态
function UserProfile() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    fetch('/api/user')
      .then(res => res.json())
      .then(data => {
        setUser(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err)
        setLoading(false)
      })
  }, [])

  // 问题：
  // 1. 需要手动管理 loading、error、data
  // 2. 没有缓存
  // 3. 没有重试机制
  // 4. 没有自动刷新
  // 5. 多个组件重复请求
}

// ✅ React Query 方式
function UserProfile() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['user'],
    queryFn: () => fetch('/api/user').then(res => res.json())
  })

  // 自动处理：缓存、重试、刷新、重复请求去重等
}
```

### 核心原理

```
┌─────────────────────────────────────────────────┐
│           TanStack Query 架构                    │
├─────────────────────────────────────────────────┤
│                                                 │
│  Component A   Component B   Component C        │
│      ↓              ↓             ↓             │
│  useQuery      useQuery      useQuery           │
│      ↓              ↓             ↓             │
│  ┌─────────────────────────────────────────┐   │
│  │      Query Client（中心缓存）            │   │
│  │  ┌──────────────────────────────────┐   │   │
│  │  │  Cache Entry: ['user']           │   │   │
│  │  │  - data: { name: 'Alice' }       │   │   │
│  │  │  - status: 'success'             │   │   │
│  │  │  - lastUpdated: timestamp        │   │   │
│  │  └──────────────────────────────────┘   │   │
│  │  ┌──────────────────────────────────┐   │   │
│  │  │  Cache Entry: ['posts']          │   │   │
│  │  └──────────────────────────────────┘   │   │
│  └─────────────────────────────────────────┘   │
│                    ↓                           │
│            Network Requests                     │
│                    ↓                           │
│              API Server                         │
└─────────────────────────────────────────────────┘
```

---

## 基础使用

### 1. 安装

```bash
yarn add @tanstack/react-query
# 开发工具（可选）
yarn add @tanstack/react-query-devtools
```

### 2. 配置 QueryClient

```typescript
// app/providers.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  // 在组件内创建 QueryClient，避免多个请求共享状态
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,        // 数据保持新鲜的时间（1分钟）
        gcTime: 5 * 60 * 1000,       // 缓存保留时间（5分钟）
        retry: 3,                     // 失败重试次数
        refetchOnWindowFocus: false,  // 窗口聚焦时不自动重新获取
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

```typescript
// app/layout.tsx
import { Providers } from './providers'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

---

## 查询（Queries）

### 基础查询

```typescript
import { useQuery } from '@tanstack/react-query'

function Posts() {
  const { data, isLoading, error, isError, isFetching, status } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const res = await fetch('/api/posts')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    }
  })

  if (isLoading) return <div>加载中...</div>
  if (isError) return <div>错误: {error.message}</div>

  return (
    <div>
      {isFetching && <div>刷新中...</div>}
      {data.map(post => <div key={post.id}>{post.title}</div>)}
    </div>
  )
}
```

### 状态说明

| 状态 | 说明 |
|-----|------|
| `isLoading` | 首次加载中（无缓存数据） |
| `isFetching` | 正在请求中（可能有缓存数据） |
| `isError` | 请求失败 |
| `isSuccess` | 请求成功 |
| `status` | `'pending'` \| `'error'` \| `'success'` |

### Query Key（查询键）

**Query Key 是查询的唯一标识**，用于缓存和去重。

```typescript
// 1. 简单字符串
useQuery({ queryKey: ['todos'], queryFn: fetchTodos })

// 2. 数组（推荐）
useQuery({ queryKey: ['todos', 'list'], queryFn: fetchTodos })

// 3. 带参数（重要！）
useQuery({
  queryKey: ['todo', todoId],  // todoId 变化会触发新请求
  queryFn: () => fetchTodo(todoId)
})

// 4. 复杂参数
useQuery({
  queryKey: ['todos', { status: 'done', page: 1 }],
  queryFn: () => fetchTodos({ status: 'done', page: 1 })
})

// 5. 对象形式（推荐用于复杂场景）
useQuery({
  queryKey: ['todos', { filter: 'all', sortBy: 'date' }],
  queryFn: ({ queryKey }) => {
    const [_key, params] = queryKey
    return fetchTodos(params)
  }
})
```

### 依赖查询（Dependent Queries）

```typescript
// 场景：先获取用户，再获取用户的文章
function UserPosts({ userId }) {
  // 1. 先查询用户
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId)
  })

  // 2. 有用户后再查询文章
  const { data: posts } = useQuery({
    queryKey: ['posts', user?.id],
    queryFn: () => fetchPosts(user.id),
    enabled: !!user  // 关键：只有 user 存在时才执行
  })

  return <div>{posts?.map(...)}</div>
}
```

### 并行查询

```typescript
// 方式 1：多个 useQuery
function Dashboard() {
  const { data: user } = useQuery({ queryKey: ['user'], queryFn: fetchUser })
  const { data: posts } = useQuery({ queryKey: ['posts'], queryFn: fetchPosts })
  const { data: stats } = useQuery({ queryKey: ['stats'], queryFn: fetchStats })

  // 三个请求并行执行
}

// 方式 2：useQueries（动态数量）
function MultipleUsers({ userIds }) {
  const userQueries = useQueries({
    queries: userIds.map(id => ({
      queryKey: ['user', id],
      queryFn: () => fetchUser(id)
    }))
  })

  // userQueries 是一个数组，每个元素是一个查询结果
  const isLoading = userQueries.some(q => q.isLoading)
  const users = userQueries.map(q => q.data)
}
```

### 分页查询

```typescript
function Posts() {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['posts', page],  // page 变化会触发新请求
    queryFn: () => fetchPosts(page),
    placeholderData: keepPreviousData  // 保持上一页数据，避免闪烁
  })

  return (
    <div>
      {data?.posts.map(post => <div key={post.id}>{post.title}</div>)}
      <button onClick={() => setPage(p => p - 1)} disabled={page === 1}>
        上一页
      </button>
      <button onClick={() => setPage(p => p + 1)} disabled={!data?.hasMore}>
        下一页
      </button>
    </div>
  )
}
```

### 无限滚动查询

```typescript
import { useInfiniteQuery } from '@tanstack/react-query'

function InfinitePosts() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['posts'],
    queryFn: ({ pageParam }) => fetchPosts(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length + 1 : undefined
    },
  })

  return (
    <div>
      {data?.pages.map((page, i) => (
        <div key={i}>
          {page.posts.map(post => <div key={post.id}>{post.title}</div>)}
        </div>
      ))}

      <button
        onClick={() => fetchNextPage()}
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage ? '加载中...' : '加载更多'}
      </button>
    </div>
  )
}
```

---

## 变更（Mutations）

**Mutations 用于创建/更新/删除数据**。

### 基础 Mutation

```typescript
import { useMutation } from '@tanstack/react-query'

function CreatePost() {
  const mutation = useMutation({
    mutationFn: (newPost) => {
      return fetch('/api/posts', {
        method: 'POST',
        body: JSON.stringify(newPost)
      })
    },
    onSuccess: (data) => {
      console.log('创建成功:', data)
    },
    onError: (error) => {
      console.error('创建失败:', error)
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    mutation.mutate({ title: 'New Post', content: '...' })
  }

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? '提交中...' : '提交'}
      </button>
      {mutation.isError && <div>错误: {mutation.error.message}</div>}
      {mutation.isSuccess && <div>创建成功！</div>}
    </form>
  )
}
```

### Mutation 状态

| 状态 | 说明 |
|-----|------|
| `isPending` | 提交中 |
| `isError` | 提交失败 |
| `isSuccess` | 提交成功 |
| `data` | 返回的数据 |
| `error` | 错误信息 |

### 更新缓存（重要！）

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'

function CreatePost() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (newPost) => createPost(newPost),

    // 方式 1：失效查询（推荐）
    onSuccess: () => {
      // 让 'posts' 查询失效，自动重新获取
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    }
  })

  return <button onClick={() => mutation.mutate(data)}>创建</button>
}
```

### 乐观更新（Optimistic Updates）

```typescript
function UpdatePost() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: updatePost,

    // 1. 提交前：乐观更新 UI
    onMutate: async (newPost) => {
      // 取消正在进行的查询
      await queryClient.cancelQueries({ queryKey: ['posts', newPost.id] })

      // 保存旧数据（用于回滚）
      const previousPost = queryClient.getQueryData(['posts', newPost.id])

      // 乐观更新缓存
      queryClient.setQueryData(['posts', newPost.id], newPost)

      // 返回上下文（用于回滚）
      return { previousPost }
    },

    // 2. 失败时：回滚
    onError: (err, newPost, context) => {
      queryClient.setQueryData(
        ['posts', newPost.id],
        context.previousPost
      )
    },

    // 3. 完成后：确保数据最新
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['posts', variables.id] })
    }
  })

  return <button onClick={() => mutation.mutate(updatedData)}>更新</button>
}
```

---

## 缓存机制

### 缓存生命周期

```
用户访问页面
    ↓
发起查询（queryKey: ['posts']）
    ↓
┌─────────────────────────────────────┐
│  Cache Status: fresh                │  ← staleTime 内
│  自动使用缓存，不发请求               │
└─────────────────────────────────────┘
    ↓ (staleTime 过期)
┌─────────────────────────────────────┐
│  Cache Status: stale                │  ← 数据"过期"
│  显示缓存，后台重新获取               │
└─────────────────────────────────────┘
    ↓ (组件卸载)
┌─────────────────────────────────────┐
│  Cache Status: inactive             │  ← 没有组件使用
│  保留缓存，开始倒计时                │
└─────────────────────────────────────┘
    ↓ (gcTime 后)
┌─────────────────────────────────────┐
│  Cache: deleted                     │  ← 缓存被删除
│  下次查询会重新获取                  │
└─────────────────────────────────────┘
```

### 关键配置

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // staleTime: 数据保持"新鲜"的时间
      // 在此期间不会重新获取数据
      staleTime: 60 * 1000,  // 1分钟

      // gcTime（原名 cacheTime）: 缓存保留时间
      // 组件卸载后，缓存保留多久
      gcTime: 5 * 60 * 1000,  // 5分钟

      // 重试次数
      retry: 3,

      // 窗口聚焦时重新获取
      refetchOnWindowFocus: true,

      // 组件挂载时重新获取
      refetchOnMount: true,

      // 网络重连时重新获取
      refetchOnReconnect: true,
    },
  },
})
```

### staleTime vs gcTime

```typescript
// 场景示例
useQuery({
  queryKey: ['posts'],
  queryFn: fetchPosts,
  staleTime: 30 * 1000,   // 30秒
  gcTime: 5 * 60 * 1000,  // 5分钟
})

// 时间线：
// 0s:   首次请求，获取数据，缓存状态 = fresh
// 10s:  用户离开页面（组件卸载）
// 20s:  用户返回页面
//       → 缓存还是 fresh（未超过 30s）
//       → 直接使用缓存，不发请求
// 35s:  用户再次离开
//       → 缓存变 stale（超过 30s）
// 40s:  用户返回
//       → 先显示缓存，同时后台重新获取
// 6分钟: 如果一直没人用
//       → 缓存被删除（超过 5分钟 gcTime）
```

---

## 查询失效与重新获取

### invalidateQueries（失效查询）

```typescript
const queryClient = useQueryClient()

// 1. 失效所有查询
queryClient.invalidateQueries()

// 2. 失效特定查询
queryClient.invalidateQueries({ queryKey: ['posts'] })

// 3. 失效匹配的查询
queryClient.invalidateQueries({ queryKey: ['posts', 1] })  // 只失效 ['posts', 1]
queryClient.invalidateQueries({ queryKey: ['posts'] })     // 失效所有 ['posts', ...]

// 4. 精确匹配
queryClient.invalidateQueries({
  queryKey: ['posts', { status: 'done' }],
  exact: true  // 只匹配完全相同的 key
})
```

### setQueryData（手动设置缓存）

```typescript
// 直接更新缓存
queryClient.setQueryData(['posts', 1], (oldData) => {
  return { ...oldData, title: 'New Title' }
})

// 添加新数据到列表
queryClient.setQueryData(['posts'], (oldData) => {
  return [...oldData, newPost]
})
```

### refetch（手动重新获取）

```typescript
function Posts() {
  const { data, refetch } = useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts
  })

  return (
    <div>
      {data?.map(...)}
      <button onClick={() => refetch()}>刷新</button>
    </div>
  )
}
```

---

## 高级特性

### 1. Query Filters（c）

```typescript
// 匹配所有激活的查询
queryClient.invalidateQueries({
  predicate: (query) => query.state.status === 'success'
})

// 匹配特定类型
queryClient.invalidateQueries({
  queryKey: ['posts'],
  type: 'active'  // 'active' | 'inactive' | 'all'
})
```

### 2. prefetchQuery（预取）

```typescript
// 鼠标悬停时预取数据
function PostLink({ postId }) {
  const queryClient = useQueryClient()

  const handleMouseEnter = () => {
    queryClient.prefetchQuery({
      queryKey: ['post', postId],
      queryFn: () => fetchPost(postId),
      staleTime: 10 * 1000,
    })
  }

  return (
    <Link
      to={`/post/${postId}`}
      onMouseEnter={handleMouseEnter}
    >
      查看文章
    </Link>
  )
}
```

### 3. initialData（初始数据）

```typescript
// 从列表缓存中提取初始数据
function PostDetail({ postId }) {
  const { data } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => fetchPost(postId),
    initialData: () => {
      // 从 posts 列表缓存中查找
      return queryClient
        .getQueryData(['posts'])
        ?.find(post => post.id === postId)
    },
    staleTime: 5 * 1000,
  })
}
```

### 4. select（数据转换）

```typescript
// 只订阅部分数据
function UserName({ userId }) {
  const { data: userName } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    select: (user) => user.name,  // 只返回 name
  })

  // 组件只在 name 变化时重新渲染
  return <div>{userName}</div>
}
```

### 5. 持久化缓存

```typescript
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24小时
    },
  },
})

const persister = createSyncStoragePersister({
  storage: window.localStorage,
})

function App() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
      <YourApp />
    </PersistQueryClientProvider>
  )
}
```

### 6. 错误处理

```typescript
// 全局错误处理
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error.status === 404) return false  // 404 不重试
        return failureCount < 3
      },
      onError: (error) => {
        console.error('Query error:', error)
      }
    },
    mutations: {
      onError: (error) => {
        toast.error(error.message)
      }
    }
  }
})

// 单个查询错误处理
useQuery({
  queryKey: ['posts'],
  queryFn: fetchPosts,
  retry: 1,
  retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
})
```

---

## 最佳实践

### 1. Query Key 组织

```typescript
// ❌ 不好的方式
useQuery({ queryKey: ['data'], queryFn: fetchData })
useQuery({ queryKey: ['user-data'], queryFn: fetchUserData })

// ✅ 好的方式（分层结构）
const queryKeys = {
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.users.lists(), { filters }] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.users.details(), id] as const,
  },
  posts: {
    all: ['posts'] as const,
    detail: (id: number) => [...queryKeys.posts.all, id] as const,
  }
}

// 使用
useQuery({ queryKey: queryKeys.users.detail(1), queryFn: () => fetchUser(1) })
useQuery({ queryKey: queryKeys.posts.all, queryFn: fetchPosts })

// 失效时更精确
queryClient.invalidateQueries({ queryKey: queryKeys.users.all })  // 所有用户相关
queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })  // 只失效列表
```

### 2. 自定义 Hook 封装

```typescript
// hooks/useUser.ts
export function useUser(userId: number) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    staleTime: 5 * 60 * 1000,  // 5分钟
    enabled: !!userId,
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateUserDto) => updateUser(data),
    onSuccess: (data) => {
      // 更新缓存
      queryClient.setQueryData(['user', data.id], data)
      // 失效列表
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

// 使用
function UserProfile({ userId }) {
  const { data: user, isLoading } = useUser(userId)
  const updateMutation = useUpdateUser()

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      <h1>{user.name}</h1>
      <button onClick={() => updateMutation.mutate({ id: userId, name: 'New Name' })}>
        更新
      </button>
    </div>
  )
}
```

### 3. 与 Web3 集成（你的项目）

```typescript
// hooks/useStakableNFT.ts
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

// 读取 NFT 列表（结合 Scaffold-ETH 和 React Query）
export function useNFTList(owner: string) {
  const { data: tokenIds } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "tokensOfOwner",
    args: [owner],
  })

  // 使用 React Query 获取元数据
  return useQuery({
    queryKey: ['nft-metadata', owner, tokenIds],
    queryFn: async () => {
      if (!tokenIds) return []

      return Promise.all(
        tokenIds.map(async (tokenId) => {
          const uri = await getTokenURI(tokenId)
          const metadata = await fetch(uri).then(r => r.json())
          return { tokenId, ...metadata }
        })
      )
    },
    enabled: !!tokenIds && tokenIds.length > 0,
    staleTime: 10 * 60 * 1000,  // NFT 元数据不常变
  })
}

// Stake NFT
export function useStakeNFT() {
  const queryClient = useQueryClient()
  const { writeContractAsync } = useScaffoldWriteContract("StakableNFT")

  return useMutation({
    mutationFn: async (tokenId: bigint) => {
      return await writeContractAsync({
        functionName: "stake",
        args: [tokenId],
      })
    },
    onSuccess: (data, tokenId) => {
      // 失效相关查询
      queryClient.invalidateQueries({ queryKey: ['nft-metadata'] })
      queryClient.invalidateQueries({ queryKey: ['staking-info', tokenId] })
    },
  })
}
```

### 4. 配置建议

```typescript
// 不同数据类型的配置
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 默认配置
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
})

// 特定查询覆盖
useQuery({
  queryKey: ['static-data'],
  queryFn: fetchStaticData,
  staleTime: Infinity,  // 静态数据永不过期
})

useQuery({
  queryKey: ['real-time-price'],
  queryFn: fetchPrice,
  staleTime: 0,  // 实时数据立即过期
  refetchInterval: 5000,  // 每5秒轮询
})

useQuery({
  queryKey: ['nft-metadata', tokenId],
  queryFn: () => fetchMetadata(tokenId),
  staleTime: 30 * 60 * 1000,  // NFT 元数据 30分钟
  gcTime: 60 * 60 * 1000,     // 缓存保留 1小时
})
```

### 5. DevTools 使用

```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
      {/* 开发环境显示 */}
      <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
    </QueryClientProvider>
  )
}
```

---

## 常见场景速查

### 场景 1：列表 + 详情

```typescript
// 列表页
function PostsList() {
  const { data: posts } = useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
  })

  return posts?.map(post => <PostCard key={post.id} post={post} />)
}

// 详情页（复用列表缓存）
function PostDetail({ id }) {
  const { data: post } = useQuery({
    queryKey: ['post', id],
    queryFn: () => fetchPost(id),
    initialData: () => {
      return queryClient.getQueryData(['posts'])?.find(p => p.id === id)
    },
  })
}
```

### 场景 2：搜索 + 防抖

```typescript
function Search() {
  const [keyword, setKeyword] = useState('')
  const debouncedKeyword = useDebounce(keyword, 500)

  const { data: results } = useQuery({
    queryKey: ['search', debouncedKeyword],
    queryFn: () => searchPosts(debouncedKeyword),
    enabled: debouncedKeyword.length > 0,
  })
}
```

### 场景 3：轮询

```typescript
// 自动轮询
useQuery({
  queryKey: ['price'],
  queryFn: fetchPrice,
  refetchInterval: 10 * 1000,  // 每10秒
})

// 条件轮询
useQuery({
  queryKey: ['order', orderId],
  queryFn: () => fetchOrder(orderId),
  refetchInterval: (data) => {
    // 订单完成后停止轮询
    return data?.status === 'completed' ? false : 5000
  },
})
```

### 场景 4：批量操作

```typescript
function BulkDelete({ selectedIds }) {
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: (ids: number[]) => bulkDeletePosts(ids),
    onSuccess: () => {
      // 乐观更新：从缓存中移除
      queryClient.setQueryData(['posts'], (old) =>
        old.filter(post => !selectedIds.includes(post.id))
      )
    },
  })

  return (
    <button onClick={() => deleteMutation.mutate(selectedIds)}>
      删除选中
    </button>
  )
}
```

---

## 总结对比

### React Query vs 传统状态管理

| 特性 | 传统方式 | React Query |
|-----|---------|------------|
| 加载状态 | 手动管理 | 自动管理 |
| 错误处理 | 手动捕获 | 自动处理 + 重试 |
| 缓存 | 需要 Redux/Zustand | 内置智能缓存 |
| 重复请求 | 需要手动去重 | 自动去重 |
| 数据同步 | 需要手动刷新 | 自动后台刷新 |
| 代码量 | 多 | 少 |

### 何时使用 React Query

✅ **适合：**
- API 数据获取
- 服务器状态管理
- 需要缓存的数据
- 需要自动刷新的数据
- 分页/无限滚动
- 乐观更新

❌ **不适合：**
- 纯客户端状态（UI 状态、表单状态）→ 用 useState/Zustand
- 全局配置 → 用 Context/Zustand
- 不需要缓存的一次性请求

---

## 参考资源

- 官方文档：https://tanstack.com/query/latest
- 示例代码：https://tanstack.com/query/latest/docs/examples/react/simple
- DevTools：https://tanstack.com/query/latest/docs/devtools
