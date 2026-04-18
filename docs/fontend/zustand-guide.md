# Zustand 状态管理完全指南

Zustand 是一个轻量级的 React 状态管理库，API 简洁，性能出色。

## 目录

- [核心概念](#核心概念)
- [基础用法](#基础用法)
- [高级特性](#高级特性)
- [TypeScript 支持](#typescript-支持)
- [最佳实践](#最佳实践)
- [性能优化](#性能优化)
- [常见模式](#常见模式)

---

## 核心概念

### 什么是 Zustand?

- **极简 API**: 不需要 Provider、Context 或样板代码
- **基于 Hooks**: 使用 React Hooks 的方式访问状态
- **TypeScript 友好**: 完整的类型推导支持
- **无渲染优化**: 自动优化组件重渲染
- **中间件支持**: 内置持久化、DevTools 等中间件

### 核心原理

```typescript
import { create } from 'zustand'

// 创建 store
const useStore = create((set) => ({
  // 状态
  count: 0,
  // 更新函数
  increment: () => set((state) => ({ count: state.count + 1 }))
}))

// 在组件中使用
function Counter() {
  const count = useStore((state) => state.count)
  const increment = useStore((state) => state.increment)
  return <button onClick={increment}>{count}</button>
}
```

---

## 基础用法

### 1. 安装

```bash
yarn add zustand
# 或
npm install zustand
```

### 2. 创建 Store

```typescript
import { create } from 'zustand'

const useStore = create((set) => ({
  // 状态字段
  bears: 0,
  // 同步更新
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  // 直接设置
  removeAllBears: () => set({ bears: 0 }),
}))
```

### 3. 在组件中使用

```typescript
// 读取状态
function BearCounter() {
  const bears = useStore((state) => state.bears)
  return <h1>{bears} bears</h1>
}

// 调用 actions
function Controls() {
  const increasePopulation = useStore((state) => state.increasePopulation)
  return <button onClick={increasePopulation}>+1</button>
}
```

### 4. 选择器 (Selector)

```typescript
// ✅ 推荐：只选择需要的状态
const bears = useStore((state) => state.bears)

// ❌ 避免：选择整个 store (会导致不必要的重渲染)
const state = useStore()

// ✅ 选择多个字段
const { bears, increasePopulation } = useStore((state) => ({
  bears: state.bears,
  increasePopulation: state.increasePopulation,
}))

// ✅ 使用自定义选择器
const totalValue = useStore((state) => state.price * state.quantity)
```

---

## 高级特性

### 1. 异步 Actions

```typescript
const useStore = create((set) => ({
  fishies: {},

  // 异步获取数据
  fetchFish: async (pond) => {
    const response = await fetch(pond)
    const fishies = await response.json()
    set({ fishies })
  },
}))
```

### 2. 嵌套状态更新

```typescript
const useStore = create((set) => ({
  user: {
    name: 'Alice',
    age: 25,
    settings: {
      theme: 'dark'
    }
  },

  // ❌ 错误：会覆盖整个 user 对象
  updateAge: (age) => set({ user: { age } }),

  // ✅ 正确：使用展开运算符保留其他字段
  updateAge: (age) => set((state) => ({
    user: { ...state.user, age }
  })),

  // ✅ 深层嵌套更新
  updateTheme: (theme) => set((state) => ({
    user: {
      ...state.user,
      settings: {
        ...state.user.settings,
        theme
      }
    }
  })),
}))
```

### 3. Immer 中间件 (简化嵌套更新)

```typescript
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

const useStore = create(
  immer((set) => ({
    user: {
      name: 'Alice',
      settings: { theme: 'dark' }
    },

    // 使用 Immer 可以直接修改
    updateTheme: (theme) => set((state) => {
      state.user.settings.theme = theme
    }),
  }))
)
```

### 4. 计算属性

```typescript
const useStore = create((set, get) => ({
  price: 10,
  quantity: 5,

  // 使用 get() 访问当前状态
  getTotal: () => get().price * get().quantity,

  // 在 action 中使用 get()
  doubleTotal: () => {
    const total = get().getTotal()
    set({ price: total })
  },
}))

// 在组件中使用
function Total() {
  const total = useStore((state) => state.getTotal())
  return <div>Total: {total}</div>
}
```

### 5. 订阅外部变化

```typescript
// 在 React 组件外订阅状态
const unsubscribe = useStore.subscribe(
  (state) => state.bears,
  (bears, prevBears) => {
    console.log('Bears changed:', prevBears, '->', bears)
  }
)

// 取消订阅
unsubscribe()
```

### 6. 手动获取状态

```typescript
// 在组件外获取状态
const currentBears = useStore.getState().bears

// 在组件外调用 action
useStore.getState().increasePopulation()
```

---

## TypeScript 支持

### 1. 基础类型定义

```typescript
interface BearState {
  bears: number
  increasePopulation: () => void
  removeAllBears: () => void
}

const useStore = create<BearState>((set) => ({
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
}))
```

### 2. 分离状态和 Actions

```typescript
interface BearState {
  bears: number
}

interface BearActions {
  increasePopulation: () => void
  removeAllBears: () => void
}

type BearStore = BearState & BearActions

const useStore = create<BearStore>((set) => ({
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
}))
```

### 3. 项目实例 (Scaffold-ETH 2)

```typescript
import { create } from "zustand"
import { ChainWithAttributes } from "~~/utils/scaffold-eth"

type GlobalState = {
  // 状态字段
  nativeCurrency: {
    price: number
    isFetching: boolean
  }
  targetNetwork: ChainWithAttributes

  // Action 函数
  setNativeCurrencyPrice: (newPrice: number) => void
  setIsNativeCurrencyFetching: (isFetching: boolean) => void
  setTargetNetwork: (network: ChainWithAttributes) => void
}

export const useGlobalState = create<GlobalState>((set) => ({
  // 初始状态
  nativeCurrency: {
    price: 0,
    isFetching: true,
  },
  targetNetwork: defaultNetwork,

  // Actions
  setNativeCurrencyPrice: (newPrice) =>
    set((state) => ({
      nativeCurrency: { ...state.nativeCurrency, price: newPrice }
    })),

  setIsNativeCurrencyFetching: (isFetching) =>
    set((state) => ({
      nativeCurrency: { ...state.nativeCurrency, isFetching }
    })),

  setTargetNetwork: (network) => set({ targetNetwork: network }),
}))
```

---

## 最佳实践

### 1. Store 组织结构

```typescript
// ✅ 推荐：单一职责，按功能拆分 store
const useUserStore = create(...)
const useCartStore = create(...)
const useThemeStore = create(...)

// ❌ 避免：所有状态放在一个巨大的 store
const useStore = create(...)  // 包含 user, cart, theme, etc.
```

### 2. Actions 命名规范

```typescript
const useStore = create((set) => ({
  // 状态
  count: 0,
  isLoading: false,

  // ✅ 动词开头的 action 名称
  increment: () => set((state) => ({ count: state.count + 1 })),
  setLoading: (value) => set({ isLoading: value }),
  fetchData: async () => { /* ... */ },

  // ❌ 避免模糊的命名
  update: () => { /* ... */ },
  data: () => { /* ... */ },
}))
```

### 3. 避免状态冗余

```typescript
// ❌ 避免：派生状态存储在 store 中
const useStore = create((set) => ({
  price: 10,
  quantity: 5,
  total: 50,  // 冗余！可以从 price * quantity 计算得出
}))

// ✅ 推荐：在选择器或组件中计算
const useStore = create((set) => ({
  price: 10,
  quantity: 5,
}))

function Component() {
  const total = useStore((state) => state.price * state.quantity)
}
```

### 4. 使用浅比较优化

```typescript
import { create } from 'zustand'
import { shallow } from 'zustand/shallow'

// ❌ 每次都会重新渲染（新对象引用）
const { nuts, honey } = useStore((state) => ({
  nuts: state.nuts,
  honey: state.honey,
}))

// ✅ 使用 shallow 比较
const { nuts, honey } = useStore(
  (state) => ({ nuts: state.nuts, honey: state.honey }),
  shallow
)
```

---

## 性能优化

### 1. 选择器优化

```typescript
// ❌ 会导致不必要的重渲染
function Component() {
  const store = useStore()  // 任何状态变化都会触发重渲染
  return <div>{store.count}</div>
}

// ✅ 只订阅需要的状态
function Component() {
  const count = useStore((state) => state.count)
  return <div>{count}</div>
}
```

### 2. 原子化选择器

```typescript
// ✅ 将选择器提取为独立函数
const selectBears = (state) => state.bears
const selectIncrease = (state) => state.increasePopulation

function Component() {
  const bears = useStore(selectBears)
  const increase = useStore(selectIncrease)
}
```

### 3. 使用 useShallow Hook (Zustand v4.5+)

```typescript
import { useShallow } from 'zustand/react/shallow'

function Component() {
  const { nuts, honey } = useStore(
    useShallow((state) => ({ nuts: state.nuts, honey: state.honey }))
  )
}
```

---

## 常见模式

### 1. 持久化存储

```typescript
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

const useStore = create(
  persist(
    (set) => ({
      bears: 0,
      increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
    }),
    {
      name: 'bear-storage',  // localStorage key
      storage: createJSONStorage(() => localStorage),
    }
  )
)
```

### 2. DevTools 集成

```typescript
import { devtools } from 'zustand/middleware'

const useStore = create(
  devtools(
    (set) => ({
      bears: 0,
      increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
    }),
    { name: 'BearStore' }
  )
)
```

### 3. 中间件组合

```typescript
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

const useStore = create(
  devtools(
    persist(
      immer((set) => ({
        user: { name: 'Alice' },
        updateName: (name) => set((state) => {
          state.user.name = name
        }),
      })),
      { name: 'user-storage' }
    ),
    { name: 'UserStore' }
  )
)
```

### 4. Slices 模式 (拆分大型 Store)

```typescript
// userSlice.ts
export const createUserSlice = (set) => ({
  user: null,
  setUser: (user) => set({ user }),
})

// cartSlice.ts
export const createCartSlice = (set) => ({
  items: [],
  addItem: (item) => set((state) => ({
    items: [...state.items, item]
  })),
})

// store.ts
import { create } from 'zustand'
import { createUserSlice } from './userSlice'
import { createCartSlice } from './cartSlice'

const useStore = create((...args) => ({
  ...createUserSlice(...args),
  ...createCartSlice(...args),
}))
```

### 5. 重置状态

```typescript
const initialState = {
  bears: 0,
  fish: 0,
}

const useStore = create((set) => ({
  ...initialState,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  // 重置到初始状态
  reset: () => set(initialState),
}))
```

### 6. 条件订阅

```typescript
const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}))

// 只在 count > 10 时订阅
const unsubscribe = useStore.subscribe(
  (state) => state.count,
  (count) => {
    if (count > 10) {
      console.log('Count exceeded 10!')
    }
  }
)
```

---

## 与其他状态管理库对比

| 特性 | Zustand | Redux | Recoil | Context API |
|------|---------|-------|--------|-------------|
| 包大小 | ~1KB | ~6KB | ~14KB | 0 (内置) |
| 学习曲线 | 低 | 高 | 中 | 低 |
| TypeScript | 优秀 | 良好 | 良好 | 一般 |
| 性能 | 优秀 | 良好 | 优秀 | 一般 |
| DevTools | 支持 | 原生支持 | 支持 | 不支持 |
| 样板代码 | 极少 | 多 | 中等 | 少 |

---

## 常见问题

### Q: 如何在组件外使用 store?

```typescript
// 直接调用 getState()
const currentState = useStore.getState()
const bears = currentState.bears
currentState.increasePopulation()
```

### Q: 如何监听特定字段变化?

```typescript
useStore.subscribe(
  (state) => state.bears,
  (newBears, oldBears) => {
    console.log('Bears changed:', oldBears, '->', newBears)
  }
)
```

### Q: 如何测试 Zustand store?

```typescript
import { renderHook, act } from '@testing-library/react'
import { useStore } from './store'

test('increments count', () => {
  const { result } = renderHook(() => useStore())

  act(() => {
    result.current.increment()
  })

  expect(result.current.count).toBe(1)
})
```

### Q: 如何避免状态更新时的闪烁?

使用 `transient updates` (临时更新):

```typescript
const useStore = create((set) => ({
  count: 0,
  // 不触发订阅的临时更新
  tempUpdate: () => set({ count: 100 }, true),  // 第二个参数为 true
}))
```

---

## 参考资源

- [官方文档](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [GitHub 仓库](https://github.com/pmndrs/zustand)
- [TypeScript 指南](https://docs.pmnd.rs/zustand/guides/typescript)
- [中间件列表](https://docs.pmnd.rs/zustand/integrations/third-party-libraries)

---

## 总结

Zustand 的优势：
- ✅ API 简洁，上手快
- ✅ 无需 Provider 包裹
- ✅ 性能优秀，自动优化渲染
- ✅ TypeScript 支持完善
- ✅ 包体积小 (~1KB)
- ✅ 灵活的中间件系统

适用场景：
- 中小型应用的全局状态管理
- 替代 Redux 的轻量级方案
- 需要在组件外访问状态的场景
- 追求极简 API 的项目
