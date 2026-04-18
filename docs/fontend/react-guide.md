# React 完全指南（面试版）

深入理解 React 的核心概念、原理和最佳实践。

## 目录

- [核心概念](#核心概念)
- [组件基础](#组件基础)
- [Hooks 深入](#hooks-深入)
- [状态管理](#状态管理)
- [性能优化](#性能优化)
- [虚拟 DOM 与 Diff 算法](#虚拟-dom-与-diff-算法)
- [React 18 新特性](#react-18-新特性)
- [面试高频问题](#面试高频问题)
- [设计模式](#设计模式)
- [最佳实践](#最佳实践)

---

## 核心概念

### 1. React 是什么？

React 是一个用于构建用户界面的 JavaScript 库，核心特点：

- **声明式**: 描述 UI 应该是什么样子，React 负责如何实现
- **组件化**: 将 UI 拆分为独立、可复用的组件
- **一次学习，随处编写**: React Native、React VR 等

### 2. JSX 本质

```typescript
// JSX 语法
const element = <h1 className="title">Hello, {name}</h1>

// 编译后（Babel）
const element = React.createElement(
  'h1',
  { className: 'title' },
  'Hello, ',
  name
)

// React.createElement 返回的对象结构
{
  type: 'h1',
  props: {
    className: 'title',
    children: ['Hello, ', name]
  },
  key: null,
  ref: null,
  $$typeof: Symbol(react.element)
}
```

**面试要点**:
- JSX 是 `React.createElement` 的语法糖
- JSX 会被编译成 JavaScript 对象（虚拟 DOM）
- `$$typeof` 用于防止 XSS 攻击

### 3. 虚拟 DOM (Virtual DOM)

```typescript
// 真实 DOM 更新（慢）
document.getElementById('app').innerHTML = '<h1>Hello</h1>'

// React 虚拟 DOM 更新（快）
// 1. 创建新的虚拟 DOM 树
// 2. 与旧的虚拟 DOM 树进行 diff
// 3. 计算最小变更
// 4. 批量更新真实 DOM
```

**为什么快？**

1. **JavaScript 对象操作比 DOM 操作快得多**
2. **批量更新**: 多次 setState 会合并成一次 DOM 更新
3. **精准更新**: Diff 算法只更新变化的部分

**虚拟 DOM 优势**:
- ✅ 跨平台（React Native）
- ✅ 开发体验好（声明式）
- ✅ 性能优化（批量更新、Diff）

**虚拟 DOM 劣势**:
- ❌ 内存占用（维护两棵树）
- ❌ 首次渲染慢（需要创建虚拟 DOM）

---

## 组件基础

### 1. 函数组件 vs 类组件

```typescript
// 函数组件（推荐）
function Welcome(props) {
  return <h1>Hello, {props.name}</h1>
}

// 类组件
class Welcome extends React.Component {
  render() {
    return <h1>Hello, {this.props.name}</h1>
  }
}
```

**面试对比**:

| 特性 | 函数组件 | 类组件 |
|------|---------|--------|
| 语法 | 简洁 | 复杂 |
| this | 无 | 有 |
| 生命周期 | Hooks | 生命周期方法 |
| 性能 | 略好 | 略差 |
| 未来方向 | ✅ 推荐 | ❌ 不推荐 |

### 2. Props 与 State

```typescript
// Props（只读，由父组件传入）
function Child({ name, age }) {
  // props.name = 'new' // ❌ 错误：不能修改 props
  return <div>{name} - {age}</div>
}

// State（可变，组件内部维护）
function Counter() {
  const [count, setCount] = useState(0)

  return (
    <button onClick={() => setCount(count + 1)}>
      {count}
    </button>
  )
}
```

**面试要点**:
- Props 是单向数据流（父 → 子）
- State 是组件内部状态
- Props 不可变，State 可变
- Props 变化会触发重新渲染

### 3. 受控组件 vs 非受控组件

```typescript
// 受控组件（推荐）
function ControlledInput() {
  const [value, setValue] = useState('')

  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  )
}

// 非受控组件
function UncontrolledInput() {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = () => {
    console.log(inputRef.current?.value)
  }

  return <input ref={inputRef} />
}
```

**何时使用非受控组件**:
- 文件上传 (`<input type="file" />`)
- 与第三方库集成
- 性能优化（避免频繁渲染）

---

## Hooks 深入

### 1. useState

```typescript
// 基础用法
const [count, setCount] = useState(0)

// 函数式更新（基于旧值）
setCount(prevCount => prevCount + 1)

// 惰性初始化（性能优化）
const [state, setState] = useState(() => {
  const initialState = computeExpensiveValue()
  return initialState
})

// 对象状态
const [user, setUser] = useState({ name: '', age: 0 })
setUser(prev => ({ ...prev, name: 'John' })) // ✅ 展开旧值
setUser({ name: 'John' }) // ❌ 丢失 age
```

**面试要点**:
- `setState` 是异步的（批量更新）
- 函数式更新避免闭包陷阱
- 对象/数组状态需要创建新引用

### 2. useEffect

```typescript
// 基础用法
useEffect(() => {
  // 副作用代码
  document.title = `Count: ${count}`
}, [count]) // 依赖数组

// 清理函数
useEffect(() => {
  const timer = setInterval(() => {
    console.log('tick')
  }, 1000)

  // 清理函数（组件卸载或依赖变化时执行）
  return () => {
    clearInterval(timer)
  }
}, [])

// 依赖数组的三种情况
useEffect(() => { }, [])        // 仅首次执行
useEffect(() => { }, [count])   // count 变化时执行
useEffect(() => { })            // 每次渲染都执行（慎用）
```

**执行时机**:
1. 组件渲染完成后（DOM 更新后）
2. 浏览器绘制完成后（异步）
3. 清理函数在下次 effect 执行前或组件卸载时执行

**useEffect vs useLayoutEffect**:

```typescript
// useEffect: 异步执行，不阻塞渲染
useEffect(() => {
  // DOM 更新后执行
})

// useLayoutEffect: 同步执行，阻塞渲染
useLayoutEffect(() => {
  // DOM 更新后、浏览器绘制前执行
  // 用于读取 DOM 布局并同步重新渲染
})
```

**何时使用 useLayoutEffect**:
- 需要读取 DOM 布局（offsetWidth、scrollTop 等）
- 需要同步更新 DOM，避免闪烁

### 3. useRef

```typescript
// DOM 引用
const inputRef = useRef<HTMLInputElement>(null)
inputRef.current?.focus()

// 存储可变值（不触发重新渲染）
const countRef = useRef(0)

useEffect(() => {
  countRef.current += 1
  console.log('Render count:', countRef.current)
})

// 保存上一次的值
function usePrevious(value) {
  const ref = useRef()

  useEffect(() => {
    ref.current = value
  })

  return ref.current
}

const prevCount = usePrevious(count)
```

**useRef vs useState**:

| 特性 | useRef | useState |
|------|--------|---------|
| 更新触发渲染 | ❌ | ✅ |
| 适用场景 | DOM 引用、缓存值 | UI 状态 |
| 更新时机 | 立即 | 异步批量 |

### 4. useMemo 与 useCallback

```typescript
// useMemo: 缓存计算结果
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(a, b)
}, [a, b])

// useCallback: 缓存函数引用
const memoizedCallback = useCallback(() => {
  doSomething(a, b)
}, [a, b])

// 等价于
const memoizedCallback = useMemo(() => {
  return () => doSomething(a, b)
}, [a, b])
```

**何时使用**:

```typescript
// ✅ 需要使用
function Parent() {
  const [count, setCount] = useState(0)

  // 子组件用 React.memo 包裹，需要缓存函数
  const handleClick = useCallback(() => {
    console.log(count)
  }, [count])

  return <Child onClick={handleClick} />
}

const Child = React.memo(({ onClick }) => {
  console.log('Child render')
  return <button onClick={onClick}>Click</button>
})

// ❌ 不需要使用（过度优化）
const value = useMemo(() => 1 + 1, []) // 简单计算，无需缓存
```

**面试陷阱**:

```typescript
// 闭包陷阱
function Example() {
  const [count, setCount] = useState(0)

  const handleClick = useCallback(() => {
    console.log(count) // 永远打印 0（闭包）
  }, []) // ❌ 缺少依赖

  // 解决方案 1: 添加依赖
  const handleClick = useCallback(() => {
    console.log(count)
  }, [count]) // ✅

  // 解决方案 2: 函数式更新
  const handleIncrement = useCallback(() => {
    setCount(c => c + 1) // ✅ 不依赖 count
  }, [])
}
```

### 5. useReducer

```typescript
// 适合复杂状态逻辑
type State = { count: number, loading: boolean }
type Action =
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'setLoading', payload: boolean }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'increment':
      return { ...state, count: state.count + 1 }
    case 'decrement':
      return { ...state, count: state.count - 1 }
    case 'setLoading':
      return { ...state, loading: action.payload }
    default:
      return state
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, { count: 0, loading: false })

  return (
    <>
      <p>{state.count}</p>
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
    </>
  )
}
```

**useReducer vs useState**:

| 特性 | useReducer | useState |
|------|-----------|---------|
| 适用场景 | 复杂状态逻辑 | 简单状态 |
| 状态更新 | 集中管理 | 分散管理 |
| 类型安全 | 更好 | 一般 |
| 测试 | 更容易（纯函数） | 一般 |

### 6. useContext

```typescript
// 创建 Context
const ThemeContext = createContext<'light' | 'dark'>('light')

// Provider
function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  return (
    <ThemeContext.Provider value={theme}>
      <Toolbar />
    </ThemeContext.Provider>
  )
}

// 消费 Context
function Toolbar() {
  const theme = useContext(ThemeContext)
  return <div className={theme}>Toolbar</div>
}
```

**Context 性能问题**:

```typescript
// ❌ 问题：value 每次渲染都是新对象，导致所有消费者重新渲染
function App() {
  const [user, setUser] = useState({ name: 'John' })

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <Child />
    </UserContext.Provider>
  )
}

// ✅ 解决方案 1: useMemo
const value = useMemo(() => ({ user, setUser }), [user])

// ✅ 解决方案 2: 拆分 Context
const UserContext = createContext(null)
const UserDispatchContext = createContext(null)

function App() {
  const [user, setUser] = useState({ name: 'John' })

  return (
    <UserContext.Provider value={user}>
      <UserDispatchContext.Provider value={setUser}>
        <Child />
      </UserDispatchContext.Provider>
    </UserContext.Provider>
  )
}
```

### 7. 自定义 Hooks

```typescript
// useDebounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

// useLocalStorage
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      return initialValue
    }
  })

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(error)
    }
  }

  return [storedValue, setValue] as const
}

// useFetch
function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetchData = async () => {
      try {
        const response = await fetch(url)
        const json = await response.json()

        if (!cancelled) {
          setData(json)
          setLoading(false)
        }
      } catch (e) {
        if (!cancelled) {
          setError(e as Error)
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      cancelled = true
    }
  }, [url])

  return { data, loading, error }
}

// useMount / useUnmount
function useMount(fn: () => void) {
  useEffect(() => {
    fn()
  }, [])
}

function useUnmount(fn: () => void) {
  useEffect(() => {
    return fn
  }, [])
}
```

**自定义 Hook 规则**:
- ✅ 必须以 `use` 开头
- ✅ 只能在函数组件或自定义 Hook 中调用
- ✅ 可以调用其他 Hooks
- ✅ 应该返回值或函数

---

## 状态管理

### 1. 状态提升 (Lifting State Up)

```typescript
// 问题：兄弟组件如何共享状态？
// 解决：将状态提升到共同的父组件

function Parent() {
  const [count, setCount] = useState(0)

  return (
    <>
      <ChildA count={count} />
      <ChildB count={count} setCount={setCount} />
    </>
  )
}
```

### 2. Context + useReducer (轻量级状态管理)

```typescript
// store.tsx
type State = {
  user: { name: string } | null
  theme: 'light' | 'dark'
}

type Action =
  | { type: 'SET_USER', payload: { name: string } }
  | { type: 'SET_THEME', payload: 'light' | 'dark' }

const initialState: State = {
  user: null,
  theme: 'light',
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload }
    case 'SET_THEME':
      return { ...state, theme: action.payload }
    default:
      return state
  }
}

const StoreContext = createContext<{
  state: State
  dispatch: React.Dispatch<Action>
} | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const context = useContext(StoreContext)
  if (!context) throw new Error('useStore must be used within StoreProvider')
  return context
}

// 使用
function Component() {
  const { state, dispatch } = useStore()

  return (
    <div>
      <p>{state.user?.name}</p>
      <button onClick={() => dispatch({ type: 'SET_USER', payload: { name: 'John' } })}>
        Set User
      </button>
    </div>
  )
}
```

### 3. Zustand (推荐)

```typescript
import { create } from 'zustand'

// 定义 store
interface BearState {
  bears: number
  increase: () => void
  reset: () => void
}

const useBearStore = create<BearState>((set) => ({
  bears: 0,
  increase: () => set((state) => ({ bears: state.bears + 1 })),
  reset: () => set({ bears: 0 }),
}))

// 使用
function BearCounter() {
  const bears = useBearStore((state) => state.bears)
  return <h1>{bears} bears</h1>
}

function Controls() {
  const increase = useBearStore((state) => state.increase)
  return <button onClick={increase}>+1</button>
}
```

### 4. Redux Toolkit (复杂应用)

```typescript
import { createSlice, configureStore } from '@reduxjs/toolkit'

// Slice
const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    increment: (state) => {
      state.value += 1 // Immer 支持可变更新
    },
    decrement: (state) => {
      state.value -= 1
    },
  },
})

// Store
const store = configureStore({
  reducer: {
    counter: counterSlice.reducer,
  },
})

// Hooks
import { useSelector, useDispatch } from 'react-redux'

function Counter() {
  const count = useSelector((state: RootState) => state.counter.value)
  const dispatch = useDispatch()

  return (
    <>
      <p>{count}</p>
      <button onClick={() => dispatch(counterSlice.actions.increment())}>+</button>
    </>
  )
}
```

**状态管理方案选择**:

| 方案 | 适用场景 | 优点 | 缺点 |
|------|---------|------|------|
| useState + Props | 简单应用 | 简单 | Props 钻取 |
| Context + useReducer | 中小型应用 | 无需第三方库 | 性能问题 |
| Zustand | 中型应用 | 简单、性能好 | 生态较小 |
| Redux Toolkit | 大型应用 | 生态丰富、DevTools | 样板代码多 |

---

## 性能优化

### 1. React.memo (组件级缓存)

```typescript
// 问题：父组件更新导致子组件不必要的重新渲染
function Parent() {
  const [count, setCount] = useState(0)
  const [text, setText] = useState('')

  return (
    <>
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <ExpensiveChild count={count} />
    </>
  )
}

// 解决：使用 React.memo
const ExpensiveChild = React.memo(({ count }: { count: number }) => {
  console.log('ExpensiveChild render')
  return <div>{count}</div>
})

// 自定义比较函数
const ExpensiveChild = React.memo(
  ({ count }: { count: number }) => {
    return <div>{count}</div>
  },
  (prevProps, nextProps) => {
    // 返回 true 表示不重新渲染
    return prevProps.count === nextProps.count
  }
)
```

### 2. useMemo 与 useCallback

```typescript
// useMemo: 缓存计算结果
function Component({ items }) {
  // ❌ 每次渲染都计算
  const total = items.reduce((sum, item) => sum + item.price, 0)

  // ✅ 只在 items 变化时计算
  const total = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price, 0)
  }, [items])

  return <div>{total}</div>
}

// useCallback: 缓存函数
function Parent() {
  const [count, setCount] = useState(0)

  // ❌ 每次渲染都创建新函数
  const handleClick = () => {
    console.log(count)
  }

  // ✅ 缓存函数引用
  const handleClick = useCallback(() => {
    console.log(count)
  }, [count])

  return <Child onClick={handleClick} />
}
```

### 3. 列表优化

```typescript
// ✅ 使用 key（唯一且稳定）
function List({ items }) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  )
}

// ❌ 使用 index 作为 key（可能导致性能问题和 bug）
{items.map((item, index) => (
  <li key={index}>{item.name}</li>
))}

// 虚拟列表（大量数据）
import { FixedSizeList } from 'react-window'

function VirtualList({ items }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>{items[index].name}</div>
      )}
    </FixedSizeList>
  )
}
```

### 4. 代码分割 (Code Splitting)

```typescript
// 路由级别分割
import { lazy, Suspense } from 'react'

const Home = lazy(() => import('./pages/Home'))
const About = lazy(() => import('./pages/About'))

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </Suspense>
  )
}

// 组件级别分割
const HeavyComponent = lazy(() => import('./HeavyComponent'))

function Page() {
  const [show, setShow] = useState(false)

  return (
    <>
      <button onClick={() => setShow(true)}>Show</button>
      {show && (
        <Suspense fallback={<div>Loading...</div>}>
          <HeavyComponent />
        </Suspense>
      )}
    </>
  )
}
```

### 5. 批量更新

```typescript
// React 18 之前：只在事件处理函数中批量更新
setTimeout(() => {
  setCount(c => c + 1) // 触发一次渲染
  setFlag(f => !f)     // 触发一次渲染
}, 1000)

// React 18：自动批量更新（Automatic Batching）
setTimeout(() => {
  setCount(c => c + 1) // 批量更新
  setFlag(f => !f)     // 批量更新
}, 1000) // 只触发一次渲染

// 退出批量更新
import { flushSync } from 'react-dom'

flushSync(() => {
  setCount(c => c + 1) // 立即触发渲染
})
setFlag(f => !f) // 触发新的渲染
```

### 6. 性能分析工具

```typescript
// React DevTools Profiler
import { Profiler } from 'react'

function onRenderCallback(
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime,
) {
  console.log(`${id} (${phase}) took ${actualDuration}ms`)
}

function App() {
  return (
    <Profiler id="App" onRender={onRenderCallback}>
      <Component />
    </Profiler>
  )
}
```

---

## 虚拟 DOM 与 Diff 算法

### 1. Diff 算法原理

**三大策略**:

1. **Tree Diff**: 只对同层级节点进行比较
2. **Component Diff**: 同类型组件才进行比较
3. **Element Diff**: 使用 key 优化列表比较

```typescript
// Tree Diff (层级比较)
// 只比较同层级节点，不跨层级比较
<div>          <div>
  <A />    vs    <B />
  <B />          <A />
</div>         </div>
// 结果：删除 A、B，创建 B、A（性能损失）

// Component Diff (组件比较)
<div>          <div>
  <A />    vs    <B />
</div>         </div>
// 结果：type 不同，直接替换整个组件

// Element Diff (元素比较)
// 无 key
[A, B, C, D] => [B, A, D, C]
// 移动：A、B、C、D 全部重新渲染

// 有 key
[A, B, C, D] => [B, A, D, C]
// 移动：B 移动到前面，C 移动到后面（只移动，不重新渲染）
```

### 2. Key 的作用

```typescript
// ❌ 错误：使用 index 作为 key
{items.map((item, index) => (
  <div key={index}>{item.name}</div>
))}

// 问题：删除第一项时
// 原数组：[{id:1, name:'A'}, {id:2, name:'B'}, {id:3, name:'C'}]
// 新数组：[{id:2, name:'B'}, {id:3, name:'C'}]
// React 认为：第 0 项从 A 变成 B，第 1 项从 B 变成 C，删除第 2 项
// 导致：重新渲染所有项

// ✅ 正确：使用唯一 ID 作为 key
{items.map((item) => (
  <div key={item.id}>{item.name}</div>
))}

// React 认为：删除 id=1 的项，保留 id=2 和 id=3
// 结果：只删除一个 DOM 节点，不重新渲染其他项
```

### 3. Fiber 架构（React 16+）

**为什么需要 Fiber？**

- 旧架构（Stack Reconciler）：递归遍历，无法中断，长时间占用主线程
- 新架构（Fiber Reconciler）：可中断、可恢复、优先级调度

**Fiber 核心概念**:

```typescript
// Fiber 节点结构
{
  type: 'div',
  key: null,
  props: { children: [...] },
  stateNode: DOM节点,
  return: 父Fiber,
  child: 第一个子Fiber,
  sibling: 下一个兄弟Fiber,
  effectTag: 'PLACEMENT' | 'UPDATE' | 'DELETION',
}
```

**工作流程**:

1. **Reconciliation 阶段（可中断）**
   - 构建 Fiber 树
   - 标记需要更新的节点（effectTag）
   - 可被高优先级任务打断

2. **Commit 阶段（不可中断）**
   - 同步执行 DOM 更新
   - 调用生命周期方法

**时间切片 (Time Slicing)**:

```typescript
// React 将长任务拆分成多个小任务
function workLoop(deadline) {
  while (nextUnitOfWork && deadline.timeRemaining() > 1) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
  }

  if (nextUnitOfWork) {
    requestIdleCallback(workLoop) // 浏览器空闲时继续
  }
}

requestIdleCallback(workLoop)
```

---

## React 18 新特性

### 1. 并发渲染 (Concurrent Rendering)

```typescript
// createRoot 替代 render
import { createRoot } from 'react-dom/client'

const root = createRoot(document.getElementById('root'))
root.render(<App />)
```

### 2. useTransition (低优先级更新)

```typescript
import { useState, useTransition } from 'react'

function SearchPage() {
  const [query, setQuery] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleChange = (e) => {
    // 高优先级：立即更新输入框
    setQuery(e.target.value)

    // 低优先级：延迟更新搜索结果
    startTransition(() => {
      setSearchResults(search(e.target.value))
    })
  }

  return (
    <>
      <input value={query} onChange={handleChange} />
      {isPending && <div>Loading...</div>}
      <SearchResults />
    </>
  )
}
```

### 3. useDeferredValue (延迟值)

```typescript
import { useState, useDeferredValue } from 'react'

function SearchPage() {
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)

  // query: 立即更新
  // deferredQuery: 延迟更新（低优先级）

  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <SearchResults query={deferredQuery} />
    </>
  )
}
```

### 4. Suspense (数据获取)

```typescript
// React 18 支持 Suspense 数据获取
const resource = fetchData('/api/user')

function User() {
  const user = resource.read() // 如果未完成，抛出 Promise

  return <div>{user.name}</div>
}

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <User />
    </Suspense>
  )
}

// 配合 use (React 19)
function User() {
  const user = use(fetchUser()) // 新 Hook
  return <div>{user.name}</div>
}
```

### 5. Automatic Batching (自动批量更新)

```typescript
// React 17: 只在事件处理函数中批量更新
function handleClick() {
  setCount(c => c + 1) // 批量
  setFlag(f => !f)     // 批量
} // 触发一次渲染

setTimeout(() => {
  setCount(c => c + 1) // 触发一次渲染
  setFlag(f => !f)     // 触发一次渲染
}, 1000)

// React 18: 所有更新都批量处理
setTimeout(() => {
  setCount(c => c + 1) // 批量
  setFlag(f => !f)     // 批量
}, 1000) // 只触发一次渲染
```

---

## 面试高频问题

### 1. React 生命周期

**类组件生命周期**:

```typescript
class Component extends React.Component {
  // 挂载阶段
  constructor(props)                    // 初始化 state
  static getDerivedStateFromProps()     // props 变化时同步 state（少用）
  render()                              // 渲染
  componentDidMount()                   // 首次渲染后（副作用）

  // 更新阶段
  static getDerivedStateFromProps()     // props 变化
  shouldComponentUpdate()               // 是否需要更新（性能优化）
  render()                              // 重新渲染
  getSnapshotBeforeUpdate()             // DOM 更新前（读取 DOM）
  componentDidUpdate()                  // DOM 更新后（副作用）

  // 卸载阶段
  componentWillUnmount()                // 清理副作用

  // 错误处理
  static getDerivedStateFromError()     // 捕获子组件错误
  componentDidCatch()                   // 记录错误信息
}
```

**函数组件生命周期（Hooks）**:

```typescript
// componentDidMount
useEffect(() => {
  // 挂载后执行
}, [])

// componentDidUpdate
useEffect(() => {
  // 每次渲染后执行
})

// componentDidUpdate (仅监听特定值)
useEffect(() => {
  // count 变化后执行
}, [count])

// componentWillUnmount
useEffect(() => {
  return () => {
    // 卸载前执行
  }
}, [])

// shouldComponentUpdate
const MemoComponent = React.memo(Component)
```

### 2. setState 是同步还是异步？

**回答**:

- **React 18 之前**: 在事件处理函数中是异步（批量更新），在 setTimeout/Promise 中是同步
- **React 18 之后**: 所有情况都是异步（自动批量更新）

```typescript
function Component() {
  const [count, setCount] = useState(0)

  const handleClick = () => {
    setCount(count + 1)
    console.log(count) // 0（异步）

    setCount(count + 1) // 仍然是 0 + 1 = 1
    console.log(count) // 0

    // 解决方案：函数式更新
    setCount(c => c + 1) // 基于最新值
    setCount(c => c + 1) // 基于最新值
    // 结果：2
  }

  return <button onClick={handleClick}>{count}</button>
}
```

### 3. React 事件机制（合成事件）

**为什么需要合成事件？**

在原生事件系统中存在以下问题：
1. **浏览器兼容性问题**：不同浏览器对同一事件的实现存在差异
2. **性能问题**：每个元素都需要单独绑定事件监听器，造成内存浪费
3. **API 不一致**：事件对象、事件处理方式在不同浏览器中表现不同
4. **内存泄漏风险**：需要手动管理事件监听器的添加和移除

React 合成事件正是为了解决这些问题而设计的。

```typescript
// 原生事件
<div onClick={(e) => {
  e.stopPropagation() // 阻止原生事件冒泡
}}>

// React 合成事件
<div onClick={(e) => {
  e.stopPropagation() // 阻止合成事件冒泡（在 React 事件系统内）
  e.nativeEvent.stopImmediatePropagation() // 阻止原生事件冒泡
}}>
```

**合成事件解决的核心问题**:

1. **跨浏览器兼容**: 统一事件 API，消除浏览器差异
2. **性能优化**: 事件委托（所有事件绑定到根节点），减少内存占用
3. **事件池**: 事件对象复用（React 17 之前），减少垃圾回收
4. **自动内存管理**: 组件卸载时自动清理事件监听器
5. **更好的开发体验**: 提供统一的事件接口和一致的API

**面试要点**:

- React 事件不是原生事件，是合成事件（SyntheticEvent）
- 事件委托到根节点（React 17 之前是 document，React 17+ 是 root）
- 事件顺序：原生事件 → React 事件
- 合成事件是对原生事件的包装，旨在解决兼容性、性能和开发体验问题

### 4. React 如何避免 XSS 攻击？

```typescript
// ✅ 自动转义
const name = '<script>alert("xss")</script>'
return <div>{name}</div>
// 渲染为文本，不执行脚本

// ❌ dangerouslySetInnerHTML（危险）
return <div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ 使用 DOMPurify 清理
import DOMPurify from 'dompurify'
const clean = DOMPurify.sanitize(userInput)
return <div dangerouslySetInnerHTML={{ __html: clean }} />
```

### 5. React 与 Vue 对比

| 特性 | React | Vue |
|------|-------|-----|
| 核心理念 | JavaScript-centric | HTML-centric |
| 模板语法 | JSX | Template |
| 状态管理 | 灵活（多方案） | Vuex/Pinia |
| 学习曲线 | 陡峭 | 平缓 |
| TypeScript | 更好 | 良好 |
| 生态 | 更丰富 | 官方集成 |
| 性能 | 优秀 | 优秀 |

---

## 设计模式

### 1. 高阶组件 (HOC)

**使用场景**:
- **横切关注点**: 将通用逻辑（如加载状态、权限控制、路由信息）从组件中抽离
- **代码复用**: 多个组件需要相同的增强功能
- **条件渲染**: 根据某些条件决定是否渲染组件或渲染不同的组件
- **Props 增强**: 为组件注入额外的 props

**目的**: 实现组件逻辑的横向复用，避免代码重复，保持组件的纯净性。

```typescript
// 高阶组件：接收组件，返回新组件
function withLoading<P extends object>(
  Component: React.ComponentType<P>
) {
  return function WithLoadingComponent({ isLoading, ...props }: P & { isLoading: boolean }) {
    if (isLoading) return <div>Loading...</div>
    return <Component {...props as P} />
  }
}

// 使用
const UserListWithLoading = withLoading(UserList)
<UserListWithLoading isLoading={loading} users={users} />

// 多个 HOC 组合
const enhance = compose(
  withLoading,
  withAuth,
  withRouter
)
const EnhancedComponent = enhance(MyComponent)
```

**常见 HOC 示例**:
```typescript
// 权限控制
function withAuth<P>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated } = useAuth()
    if (!isAuthenticated) return <div>请先登录</div>
    return <Component {...props} />
  }
}

// 错误边界
function withErrorBoundary<P>(Component: React.ComponentType<P>) {
  return function ComponentWithErrorBoundary(props: P) {
    return (
      <ErrorBoundary>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}
```

### 2. Render Props

**使用场景**:
- **状态逻辑复用**: 将组件的状态和行为逻辑复用给其他组件
- **灵活的内容渲染**: 父组件提供逻辑，子组件决定如何渲染
- **动态渲染**: 根据状态动态决定渲染什么内容
- **组件组合**: 实现组件间的逻辑组合而非继承

**目的**: 在组件间共享状态逻辑，提供最大的渲染灵活性，让父组件负责逻辑，子组件负责展示。

```typescript
// Render Props 模式
interface MouseTrackerProps {
  render: (state: { x: number, y: number }) => React.ReactNode
}

function MouseTracker({ render }: MouseTrackerProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: MouseEvent) => {
    setPosition({ x: e.clientX, y: e.clientY })
  }

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return <>{render(position)}</>
}

// 使用
<MouseTracker
  render={({ x, y }) => (
    <div>Mouse position: {x}, {y}</div>
  )}
/>
```

**现代替代方案**: children 作为函数

```typescript
// 使用 children 替代 render prop
<MouseTracker>
  {({ x, y }) => <div>Mouse: {x}, {y}</div>}
</MouseTracker>

// 实现方式
function MouseTracker({ children }: { children: (state: { x: number, y: number }) => React.ReactNode }) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  // ... 逻辑代码
  return <>{children(position)}</>
}

// 实际应用：数据获取
function DataFetcher<T>({ url, children }: { url: string; children: (data: T | null, loading: boolean) => React.ReactNode }) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setData(data)
        setLoading(false)
      })
  }, [url])

  return <>{children(data, loading)}</>
}

// 使用
<DataFetcher url="/api/users">
  {(users, loading) => {
    if (loading) return <div>Loading...</div>
    return <div>Found {users?.length} users</div>
  }}
</DataFetcher>
```

### 3. Compound Components (复合组件)

**使用场景**:

- **复杂UI组件**: 需要多个子组件协同工作的UI组件（如标签页、菜单、对话框）
- **状态共享**: 一组相关组件需要共享内部状态
- **灵活组合**: 允许用户自由组合组件的各个部分
- **API 设计**: 创建直观、易用的组件API

**目的**: 将复杂组件拆分为多个简单、可组合的子组件，通过Context共享状态，提供灵活而直观的API。

```typescript
// 复合组件模式
const TabsContext = createContext<{
  activeTab: string
  setActiveTab: (tab: string) => void
} | null>(null)

function Tabs({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState('tab1')

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div>{children}</div>
    </TabsContext.Provider>
  )
}

function TabList({ children }: { children: React.ReactNode }) {
  return <div className="tab-list">{children}</div>
}

function Tab({ id, children }: { id: string, children: React.ReactNode }) {
  const context = useContext(TabsContext)
  if (!context) throw new Error('Tab must be used within Tabs')

  const { activeTab, setActiveTab } = context

  return (
    <button
      className={activeTab === id ? 'active' : ''}
      onClick={() => setActiveTab(id)}
    >
      {children}
    </button>
  )
}

function TabPanel({ id, children }: { id: string, children: React.ReactNode }) {
  const context = useContext(TabsContext)
  if (!context) throw new Error('TabPanel must be used within Tabs')

  if (context.activeTab !== id) return null
  return <div>{children}</div>
}

// 使用
<Tabs>
  <TabList>
    <Tab id="tab1">Tab 1</Tab>
    <Tab id="tab2">Tab 2</Tab>
  </TabList>
  <TabPanel id="tab1">Content 1</TabPanel>
  <TabPanel id="tab2">Content 2</TabPanel>
</Tabs>
```

**更多示例**:
```typescript
// 菜单组件
const MenuContext = createContext<{
  isOpen: boolean
  setIsOpen: (open: boolean) => void
} | null>(null)

function Menu({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <MenuContext.Provider value={{ isOpen, setIsOpen }}>
      <div className="menu">{children}</div>
    </MenuContext.Provider>
  )
}

function MenuTrigger({ children }: { children: React.ReactNode }) {
  const { setIsOpen } = useContext(MenuContext)!
  return <div onClick={() => setIsOpen(true)}>{children}</div>
}

function MenuContent({ children }: { children: React.ReactNode }) {
  const { isOpen, setIsOpen } = useContext(MenuContext)!
  if (!isOpen) return null
  return (
    <div className="menu-content">
      {children}
      <div onClick={() => setIsOpen(false)}>Close</div>
    </div>
  )
}

// 使用
<Menu>
  <MenuTrigger>Open Menu</MenuTrigger>
  <MenuContent>
    <div>Item 1</div>
    <div>Item 2</div>
  </MenuContent>
</Menu>
```

**优点**:
- API直观，符合HTML思维
- 组件间状态自动同步
- 灵活组合，可选择性使用子组件
- 易于扩展和维护

### 4. Container/Presentational 模式

**使用场景**:
- **关注点分离**: 将业务逻辑与UI展示分离
- **逻辑复用**: 多个展示组件可以复用相同的容器逻辑
- **测试友好**: 展示组件和容器组件可以独立测试
- **组件复用**: 展示组件可以在不同的数据场景下复用

**目的**: 分离组件的"如何做"（容器组件）和"展示什么"（展示组件），提高代码的可维护性、可测试性和可复用性。

**现代替代方案**: 自定义 Hooks + 组件组合

```typescript
// 现代实现方式：使用自定义 Hook
function useUsers() {
  const { data: users, isLoading } = useFetch<User[]>('/api/users')

  const handleDelete = async (id: string) => {
    await fetch(`/api/users/${id}`, { method: 'DELETE' })
  }

  return { users, isLoading, handleDelete }
}

// 然后在组件中使用
function UserListPage() {
  const { users, isLoading, handleDelete } = useUsers()

  if (isLoading) return <div>Loading...</div>
  return <UserList users={users} onDelete={handleDelete} />
}
```

```typescript
// Presentational Component (展示组件)
interface UserListProps {
  users: User[]
  onDelete: (id: string) => void
}

function UserList({ users, onDelete }: UserListProps) {
  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>
          {user.name}
          <button onClick={() => onDelete(user.id)}>Delete</button>
        </li>
      ))}
    </ul>
  )
}

// Container Component (容器组件)
function UserListContainer() {
  const { data: users, isLoading } = useFetch<User[]>('/api/users')

  const handleDelete = async (id: string) => {
    await fetch(`/api/users/${id}`, { method: 'DELETE' })
  }

  if (isLoading) return <div>Loading...</div>

  return <UserList users={users} onDelete={handleDelete} />
}
```

**对比分析**:

| 特性 | 展示组件 | 容器组件 |
|------|---------|---------|
| 关注点 | 如何显示 | 如何工作 |
| 数据来源 | 通过 props 获取 | 自己获取和处理 |
| 状态管理 | 很少或没有 | 管理复杂状态 |
| 副作用 | 无 | 处理API调用、定时器等 |
| 测试 | 容易（只测渲染） | 需要mock数据和服务 |

**实际应用**:
```typescript
// 展示组件：纯函数，易于测试和复用
export function ProductCard({
  product,
  onAddToCart,
  className
}: {
  product: Product;
  onAddToCart: (id: string) => void;
  className?: string
}) {
  return (
    <div className={className}>
      <h3>{product.name}</h3>
      <p>{product.price}</p>
      <button onClick={() => onAddToCart(product.id)}>
        Add to Cart
      </button>
    </div>
  )
}

// 容器组件：处理业务逻辑
function ProductCardContainer({ productId }: { productId: string }) {
  const { data: product, isLoading } = useProduct(productId)
  const { mutate: addToCart } = useAddToCart()

  if (isLoading) return <ProductCardSkeleton />
  if (!product) return <div>Product not found</div>

  return (
    <ProductCard
      product={product}
      onAddToCart={addToCart}
      className="product-card"
    />
  )
}
```

---

## 最佳实践

### 1. 组件设计原则

```typescript
// ✅ 单一职责
function UserProfile() {
  return (
    <>
      <UserAvatar />
      <UserInfo />
      <UserActions />
    </>
  )
}

// ❌ 职责过多
function UserProfile() {
  return (
    <div>
      {/* 头像、信息、操作都在一个组件 */}
    </div>
  )
}

// ✅ 可组合
<Button size="large" variant="primary">Submit</Button>
<Button size="small" variant="secondary">Cancel</Button>

// ✅ 可测试
export function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0)
}

// 测试
test('calculateTotal', () => {
  const items = [{ price: 10 }, { price: 20 }]
  expect(calculateTotal(items)).toBe(30)
})
```

### 2. TypeScript 最佳实践

```typescript
// ✅ Props 类型定义
interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary'
  disabled?: boolean
}

function Button({ children, onClick, variant = 'primary', disabled }: ButtonProps) {
  return (
    <button className={variant} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}

// ✅ 泛型组件
interface ListProps<T> {
  items: T[]
  renderItem: (item: T) => React.ReactNode
}

function List<T>({ items, renderItem }: ListProps<T>) {
  return <ul>{items.map(renderItem)}</ul>
}

// 使用
<List
  items={users}
  renderItem={(user) => <li key={user.id}>{user.name}</li>}
/>

// ✅ 事件类型
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  console.log(e.target.value)
}

const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  console.log('clicked')
}
```

### 3. 错误边界

```typescript
// 错误边界组件
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>
    }

    return this.props.children
  }
}

// 使用
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### 4. 代码组织

```
src/
├── components/          # 可复用组件
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx
│   │   └── Button.module.css
│   └── Input/
├── pages/              # 页面组件
│   ├── Home/
│   └── About/
├── hooks/              # 自定义 Hooks
│   ├── useAuth.ts
│   └── useFetch.ts
├── store/              # 状态管理
│   └── userStore.ts
├── utils/              # 工具函数
│   └── formatDate.ts
├── types/              # TypeScript 类型
│   └── user.ts
└── App.tsx
```

---

## 总结

### React 核心要点

1. **虚拟 DOM**: 性能优化的关键
2. **组件化**: UI 拆分和复用
3. **单向数据流**: Props 向下传递
4. **Hooks**: 函数组件的状态和副作用
5. **Fiber**: 可中断的渲染架构

### 面试必备

- ✅ 生命周期和 Hooks
- ✅ 虚拟 DOM 和 Diff 算法
- ✅ 性能优化（memo、useMemo、useCallback）
- ✅ 状态管理（Context、Redux、Zustand）
- ✅ React 18 新特性（并发渲染、Suspense）

### 学习资源

- [React 官方文档](https://react.dev/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Patterns.dev](https://www.patterns.dev/)
