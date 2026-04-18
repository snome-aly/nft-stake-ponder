# usehooks-ts 完整学习指南

本文档详细介绍了 usehooks-ts 库中所有常用 hooks 的功能、使用场景和代码示例。

---

## 目录

- [1. 状态管理类](#1-状态管理类)
- [2. 存储类](#2-存储类)
- [3. 主题/样式类](#3-主题样式类)
- [4. 事件监听类](#4-事件监听类)
- [5. DOM/浏览器 API 类](#5-dom浏览器-api-类)
- [6. 性能优化类](#6-性能优化类)
- [7. 定时器类](#7-定时器类)
- [8. 生命周期/工具类](#8-生命周期工具类)

---

## 1. 状态管理类

### useBoolean

**功能说明：** 管理布尔值状态，提供便捷的 toggle、setTrue、setFalse 方法。

**使用场景：** 模态框开关、菜单展开/收起、加载状态等。

```typescript
import { useBoolean } from 'usehooks-ts'

function ModalExample() {
  // 初始化为 false
  const { value: isOpen, setTrue: open, setFalse: close, toggle } = useBoolean(false)

  return (
    <div>
      <button onClick={open}>打开模态框</button>
      <button onClick={toggle}>切换模态框</button>

      {isOpen && (
        <div className="modal">
          <h2>这是一个模态框</h2>
          <button onClick={close}>关闭</button>
        </div>
      )}
    </div>
  )
}
```

---

### useCounter

**功能说明：** 管理数字计数器，提供增加、减少、设置、重置等方法。

**使用场景：** 购物车数量、点赞数、分页等。

```typescript
import { useCounter } from 'usehooks-ts'

function CounterExample() {
  // 初始值为 0
  const { count, increment, decrement, reset, setCount } = useCounter(0)

  return (
    <div>
      <p>当前计数: {count}</p>
      <button onClick={increment}>+1</button>
      <button onClick={decrement}>-1</button>
      <button onClick={() => setCount(10)}>设置为 10</button>
      <button onClick={reset}>重置</button>
    </div>
  )
}
```

---

### useToggle

**功能说明：** 在两个值之间切换（默认 true/false），支持自定义值。

**使用场景：** 主题切换、语言切换、视图切换等。

```typescript
import { useToggle } from 'usehooks-ts'

function ThemeToggle() {
  // 在 'light' 和 'dark' 之间切换
  const [theme, toggleTheme] = useToggle('light', 'dark')

  return (
    <div>
      <p>当前主题: {theme}</p>
      <button onClick={toggleTheme}>切换主题</button>
    </div>
  )
}
```

---

### useStep

**功能说明：** 管理步骤/向导流程，提供前进、后退、跳转等功能。

**使用场景：** 多步骤表单、引导流程、轮播图等。

```typescript
import { useStep } from 'usehooks-ts'

function WizardForm() {
  // 总共 4 步，当前在第 1 步（索引 0）
  const [currentStep, helpers] = useStep(4)
  const { goToNextStep, goToPrevStep, canGoToNextStep, canGoToPrevStep, setStep } = helpers

  return (
    <div>
      <p>当前步骤: {currentStep + 1} / 4</p>

      <div>
        {currentStep === 0 && <div>步骤 1: 填写基本信息</div>}
        {currentStep === 1 && <div>步骤 2: 上传文件</div>}
        {currentStep === 2 && <div>步骤 3: 确认信息</div>}
        {currentStep === 3 && <div>步骤 4: 完成</div>}
      </div>

      <button onClick={goToPrevStep} disabled={!canGoToPrevStep}>
        上一步
      </button>
      <button onClick={goToNextStep} disabled={!canGoToNextStep}>
        下一步
      </button>
    </div>
  )
}
```

---

### useMap

**功能说明：** 管理 Map 数据结构，提供 set、remove、reset 等方法。

**使用场景：** 管理键值对数据、表单字段、选中项等。

```typescript
import { useMap } from 'usehooks-ts'

function FormFieldsExample() {
  const [fields, actions] = useMap<string, string>([
    ['username', ''],
    ['email', '']
  ])

  return (
    <div>
      <input
        value={fields.get('username') || ''}
        onChange={e => actions.set('username', e.target.value)}
        placeholder="用户名"
      />
      <input
        value={fields.get('email') || ''}
        onChange={e => actions.set('email', e.target.value)}
        placeholder="邮箱"
      />

      <button onClick={() => actions.reset()}>重置表单</button>

      <pre>{JSON.stringify(Object.fromEntries(fields), null, 2)}</pre>
    </div>
  )
}
```

---

## 2. 存储类

### useLocalStorage

**功能说明：** 在 localStorage 中存储和读取数据，自动同步状态。

**使用场景：** 用户偏好设置、主题、语言、表单草稿等持久化数据。

```typescript
import { useLocalStorage } from 'usehooks-ts'

function UserPreferences() {
  // 存储用户偏好，默认值为 'zh-CN'
  const [language, setLanguage] = useLocalStorage('user-language', 'zh-CN')

  return (
    <div>
      <p>当前语言: {language}</p>
      <select value={language} onChange={e => setLanguage(e.target.value)}>
        <option value="zh-CN">简体中文</option>
        <option value="en-US">English</option>
      </select>
    </div>
  )
}
```

---

### useSessionStorage

**功能说明：** 在 sessionStorage 中存储和读取数据，会话结束后清除。

**使用场景：** 临时表单数据、单次会话状态、购物流程等。

```typescript
import { useSessionStorage } from 'usehooks-ts'

function CheckoutFlow() {
  // 存储购物流程中的临时数据
  const [cartItems, setCartItems] = useSessionStorage('cart-items', [])

  const addItem = (item: string) => {
    setCartItems([...cartItems, item])
  }

  return (
    <div>
      <p>购物车 (仅本次会话): {cartItems.length} 件商品</p>
      <button onClick={() => addItem('商品A')}>添加商品A</button>
      <ul>
        {cartItems.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    </div>
  )
}
```

---

### useReadLocalStorage

**功能说明：** 只读方式获取 localStorage 数据，不提供修改功能。

**使用场景：** 读取其他组件设置的配置、检查用户登录状态等。

```typescript
import { useReadLocalStorage } from 'usehooks-ts'

function WelcomeMessage() {
  // 只读取，不修改
  const username = useReadLocalStorage<string>('username')

  return (
    <div>
      {username ? (
        <h1>欢迎回来, {username}!</h1>
      ) : (
        <h1>请先登录</h1>
      )}
    </div>
  )
}
```

---

## 3. 主题/样式类

### useDarkMode

**功能说明：** 管理暗黑模式，自动处理 localStorage 持久化和 CSS 类名切换。

**使用场景：** 应用主题切换、夜间模式等。

```typescript
import { useDarkMode } from 'usehooks-ts'

function ThemeSwitcher() {
  const { isDarkMode, toggle, enable, disable } = useDarkMode()

  return (
    <div className={isDarkMode ? 'dark' : 'light'}>
      <p>当前模式: {isDarkMode ? '暗黑' : '明亮'}</p>
      <button onClick={toggle}>切换模式</button>
      <button onClick={enable}>启用暗黑模式</button>
      <button onClick={disable}>启用明亮模式</button>
    </div>
  )
}
```

---

### useTernaryDarkMode

**功能说明：** 三态暗黑模式（light/dark/system），支持跟随系统设置。

**使用场景：** 更灵活的主题控制，允许用户选择"跟随系统"选项。

```typescript
import { useTernaryDarkMode } from 'usehooks-ts'

function AdvancedThemeSwitcher() {
  const { isDarkMode, ternaryDarkMode, setTernaryDarkMode } = useTernaryDarkMode()

  return (
    <div>
      <p>当前模式: {isDarkMode ? '暗黑' : '明亮'}</p>
      <p>用户设置: {ternaryDarkMode}</p>

      <select
        value={ternaryDarkMode}
        onChange={e => setTernaryDarkMode(e.target.value as any)}
      >
        <option value="light">明亮</option>
        <option value="dark">暗黑</option>
        <option value="system">跟随系统</option>
      </select>
    </div>
  )
}
```

---

## 4. 事件监听类

### useEventListener

**功能说明：** 通用事件监听器，自动处理添加/移除监听器。

**使用场景：** 监听键盘、鼠标、窗口事件等。

```typescript
import { useEventListener } from 'usehooks-ts'

function KeyboardShortcut() {
  // 监听全局按键事件
  useEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      console.log('ESC 键被按下')
    }
  })

  return <div>按下 ESC 键试试看</div>
}
```

---

### useClickAnyWhere

**功能说明：** 监听页面任意位置的点击事件。

**使用场景：** 关闭弹窗、隐藏下拉菜单、记录用户行为等。

```typescript
import { useClickAnyWhere } from 'usehooks-ts'
import { useState } from 'react'

function ClickTracker() {
  const [clickCount, setClickCount] = useState(0)

  // 监听页面任意位置点击
  useClickAnyWhere(() => {
    setClickCount(prev => prev + 1)
  })

  return <div>页面点击次数: {clickCount}</div>
}
```

---

### useOnClickOutside

**功能说明：** 检测元素外部的点击事件。

**使用场景：** 关闭下拉菜单、模态框、弹出层等。

```typescript
import { useOnClickOutside } from 'usehooks-ts'
import { useRef, useState } from 'react'

function Dropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // 点击外部时关闭下拉菜单
  useOnClickOutside(dropdownRef, () => {
    setIsOpen(false)
  })

  return (
    <div ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)}>
        切换菜单
      </button>
      {isOpen && (
        <ul className="dropdown-menu">
          <li>选项 1</li>
          <li>选项 2</li>
          <li>选项 3</li>
        </ul>
      )}
    </div>
  )
}
```

---

### useHover

**功能说明：** 检测鼠标是否悬停在元素上。

**使用场景：** 悬停提示、预览、高亮效果等。

```typescript
import { useHover } from 'usehooks-ts'
import { useRef } from 'react'

function HoverCard() {
  const hoverRef = useRef(null)
  const isHovering = useHover(hoverRef)

  return (
    <div
      ref={hoverRef}
      style={{
        padding: '20px',
        backgroundColor: isHovering ? 'lightblue' : 'lightgray'
      }}
    >
      {isHovering ? '鼠标悬停中 🎯' : '将鼠标移到这里'}
    </div>
  )
}
```

---

## 5. DOM/浏览器 API 类

### useDocumentTitle

**功能说明：** 动态设置网页标题。

**使用场景：** 页面标题、通知提醒、动态内容展示等。

```typescript
import { useDocumentTitle } from 'usehooks-ts'
import { useState } from 'react'

function ChatRoom() {
  const [unreadCount, setUnreadCount] = useState(0)

  // 动态更新标题
  useDocumentTitle(
    unreadCount > 0 ? `(${unreadCount}) 新消息` : '聊天室'
  )

  return (
    <div>
      <button onClick={() => setUnreadCount(prev => prev + 1)}>
        收到新消息
      </button>
    </div>
  )
}
```

---

### useWindowSize

**功能说明：** 获取窗口尺寸，自动响应窗口大小变化。

**使用场景：** 响应式布局、移动端适配、动态计算等。

```typescript
import { useWindowSize } from 'usehooks-ts'

function ResponsiveLayout() {
  const { width, height } = useWindowSize()

  return (
    <div>
      <p>窗口宽度: {width}px</p>
      <p>窗口高度: {height}px</p>
      {width < 768 ? (
        <div>移动端布局</div>
      ) : (
        <div>桌面端布局</div>
      )}
    </div>
  )
}
```

---

### useScreen

**功能说明：** 获取屏幕信息（分辨率、方向等）。

**使用场景：** 设备检测、屏幕适配、统计分析等。

```typescript
import { useScreen } from 'usehooks-ts'

function ScreenInfo() {
  const screen = useScreen()

  return (
    <div>
      <p>屏幕宽度: {screen?.width}px</p>
      <p>屏幕高度: {screen?.height}px</p>
      <p>色彩深度: {screen?.colorDepth} bits</p>
      <p>屏幕方向: {screen?.orientation?.type}</p>
    </div>
  )
}
```

---

### useMediaQuery

**功能说明：** 检测 CSS 媒体查询匹配状态。

**使用场景：** 响应式设计、主题切换、设备类型检测等。

```typescript
import { useMediaQuery } from 'usehooks-ts'

function AdaptiveComponent() {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')
  const isPortrait = useMediaQuery('(orientation: portrait)')

  return (
    <div>
      <p>设备类型: {isMobile ? '移动端' : '桌面端'}</p>
      <p>系统主题: {prefersDark ? '暗黑' : '明亮'}</p>
      <p>屏幕方向: {isPortrait ? '竖屏' : '横屏'}</p>
    </div>
  )
}
```

---

### useIntersectionObserver

**功能说明：** 监听元素是否进入视口（Intersection Observer API）。

**使用场景：** 懒加载图片、无限滚动、曝光统计、动画触发等。

```typescript
import { useIntersectionObserver } from 'usehooks-ts'
import { useRef } from 'react'

function LazyImage({ src }: { src: string }) {
  const imgRef = useRef<HTMLDivElement>(null)
  const entry = useIntersectionObserver(imgRef, {
    threshold: 0.5, // 50% 可见时触发
    freezeOnceVisible: true // 一旦可见就停止观察
  })

  const isVisible = !!entry?.isIntersecting

  return (
    <div ref={imgRef} style={{ minHeight: '200px' }}>
      {isVisible ? (
        <img src={src} alt="懒加载图片" />
      ) : (
        <div>加载中...</div>
      )}
    </div>
  )
}
```

---

### useResizeObserver

**功能说明：** 监听元素尺寸变化（Resize Observer API）。

**使用场景：** 响应式组件、图表自适应、布局计算等。

```typescript
import { useResizeObserver } from 'usehooks-ts'
import { useRef } from 'react'

function ResizableBox() {
  const boxRef = useRef<HTMLDivElement>(null)
  const { width = 0, height = 0 } = useResizeObserver({
    ref: boxRef
  })

  return (
    <div>
      <div
        ref={boxRef}
        style={{
          resize: 'both',
          overflow: 'auto',
          border: '1px solid',
          minWidth: '100px',
          minHeight: '100px'
        }}
      >
        拖动右下角调整大小
      </div>
      <p>当前尺寸: {Math.round(width)} x {Math.round(height)}</p>
    </div>
  )
}
```

---

### useScrollLock

**功能说明：** 锁定/解锁页面滚动。

**使用场景：** 模态框打开时禁止背景滚动、侧边栏菜单等。

```typescript
import { useScrollLock } from 'usehooks-ts'
import { useState } from 'react'

function Modal() {
  const [isOpen, setIsOpen] = useState(false)
  const { lock, unlock } = useScrollLock()

  const openModal = () => {
    setIsOpen(true)
    lock() // 禁止页面滚动
  }

  const closeModal = () => {
    setIsOpen(false)
    unlock() // 恢复页面滚动
  }

  return (
    <div>
      <button onClick={openModal}>打开模态框</button>

      {isOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>模态框内容</h2>
            <p>背景已禁止滚动</p>
            <button onClick={closeModal}>关闭</button>
          </div>
        </div>
      )}
    </div>
  )
}
```

---

### useScript

**功能说明：** 动态加载外部脚本，跟踪加载状态。

**使用场景：** 按需加载第三方库、地图 API、支付 SDK 等。

```typescript
import { useScript } from 'usehooks-ts'

function GoogleMapsComponent() {
  const status = useScript(
    `https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY`,
    {
      removeOnUnmount: false // 组件卸载时不移除脚本
    }
  )

  return (
    <div>
      {status === 'loading' && <div>加载地图中...</div>}
      {status === 'ready' && <div>地图已就绪，可以初始化了</div>}
      {status === 'error' && <div>地图加载失败</div>}
    </div>
  )
}
```

---

## 6. 性能优化类

### useDebounceCallback

**功能说明：** 创建防抖回调函数，在指定时间内只执行最后一次。

**使用场景：** 搜索输入、窗口 resize、滚动事件等高频操作。

```typescript
import { useDebounceCallback } from 'usehooks-ts'
import { useState } from 'react'

function SearchInput() {
  const [searchResults, setSearchResults] = useState([])

  // 防抖搜索函数，500ms 内只执行最后一次
  const debouncedSearch = useDebounceCallback((query: string) => {
    console.log('执行搜索:', query)
    // 实际搜索逻辑
    fetch(`/api/search?q=${query}`)
      .then(res => res.json())
      .then(setSearchResults)
  }, 500)

  return (
    <input
      type="text"
      placeholder="输入搜索内容..."
      onChange={e => debouncedSearch(e.target.value)}
    />
  )
}
```

---

### useDebounceValue

**功能说明：** 创建防抖值，延迟更新状态值。

**使用场景：** 搜索关键词、表单验证、实时预览等。

```typescript
import { useDebounceValue } from 'usehooks-ts'
import { useState } from 'react'

function LiveSearch() {
  const [inputValue, setInputValue] = useState('')
  // 防抖后的值，延迟 300ms 更新
  const [debouncedValue] = useDebounceValue(inputValue, 300)

  // 仅在 debouncedValue 变化时触发搜索
  useEffect(() => {
    if (debouncedValue) {
      console.log('搜索:', debouncedValue)
      // 执行搜索
    }
  }, [debouncedValue])

  return (
    <div>
      <input
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        placeholder="输入搜索..."
      />
      <p>输入值: {inputValue}</p>
      <p>防抖值: {debouncedValue}</p>
    </div>
  )
}
```

---

### useEventCallback

**功能说明：** 创建稳定引用的事件回调，避免不必要的重渲染。

**使用场景：** 传递给子组件的回调函数、依赖优化等。

```typescript
import { useEventCallback } from 'usehooks-ts'
import { useState } from 'react'

function ParentComponent() {
  const [count, setCount] = useState(0)

  // 即使 count 变化，handleClick 引用保持不变
  const handleClick = useEventCallback(() => {
    console.log('当前 count:', count)
    setCount(count + 1)
  })

  return (
    <div>
      <p>Count: {count}</p>
      {/* 子组件不会因为 handleClick 引用变化而重渲染 */}
      <ChildComponent onClick={handleClick} />
    </div>
  )
}

const ChildComponent = React.memo(({ onClick }: { onClick: () => void }) => {
  console.log('ChildComponent 渲染')
  return <button onClick={onClick}>点击</button>
})
```

---

### useIsomorphicLayoutEffect

**功能说明：** 同构的 useLayoutEffect，服务端渲染时使用 useEffect。

**使用场景：** SSR 应用、Next.js 项目、需要 DOM 测量的场景。

```typescript
import { useIsomorphicLayoutEffect } from 'usehooks-ts'
import { useRef, useState } from 'react'

function MeasureElement() {
  const elementRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  // 在服务端安全使用，客户端等同于 useLayoutEffect
  useIsomorphicLayoutEffect(() => {
    if (elementRef.current) {
      setWidth(elementRef.current.offsetWidth)
    }
  }, [])

  return (
    <div ref={elementRef}>
      元素宽度: {width}px
    </div>
  )
}
```

---

## 7. 定时器类

### useInterval

**功能说明：** 创建定时器（setInterval），自动清理。

**使用场景：** 轮询数据、倒计时、动画等。

```typescript
import { useInterval } from 'usehooks-ts'
import { useState } from 'react'

function DataPolling() {
  const [data, setData] = useState(null)

  // 每 5 秒轮询一次数据
  useInterval(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(setData)
  }, 5000)

  return <div>最新数据: {JSON.stringify(data)}</div>
}

// 可暂停的定时器示例
function PausableTimer() {
  const [count, setCount] = useState(0)
  const [delay, setDelay] = useState(1000)

  useInterval(() => {
    setCount(count + 1)
  }, delay) // delay 为 null 时暂停

  return (
    <div>
      <p>计数: {count}</p>
      <button onClick={() => setDelay(delay ? null : 1000)}>
        {delay ? '暂停' : '继续'}
      </button>
    </div>
  )
}
```

---

### useTimeout

**功能说明：** 创建延时器（setTimeout），自动清理。

**使用场景：** 延迟执行、自动关闭提示、防抖等。

```typescript
import { useTimeout } from 'usehooks-ts'
import { useState } from 'react'

function AutoCloseNotification() {
  const [isVisible, setIsVisible] = useState(true)

  // 3 秒后自动隐藏
  useTimeout(() => {
    setIsVisible(false)
  }, 3000)

  if (!isVisible) return null

  return (
    <div className="notification">
      这条消息将在 3 秒后自动关闭
    </div>
  )
}
```

---

### useCountdown

**功能说明：** 倒计时功能，提供开始、停止、重置等控制。

**使用场景：** 验证码倒计时、活动倒计时、限时优惠等。

```typescript
import { useCountdown } from 'usehooks-ts'

function CountdownTimer() {
  const [count, { startCountdown, stopCountdown, resetCountdown }] = useCountdown({
    countStart: 60,
    intervalMs: 1000
  })

  return (
    <div>
      <p>倒计时: {count} 秒</p>
      <button onClick={startCountdown}>开始</button>
      <button onClick={stopCountdown}>停止</button>
      <button onClick={resetCountdown}>重置</button>
    </div>
  )
}

// 验证码倒计时示例
function SmsCodeButton() {
  const [count, { startCountdown, resetCountdown }] = useCountdown({
    countStart: 60,
    intervalMs: 1000,
    countStop: 0
  })

  const sendSms = () => {
    // 发送验证码逻辑
    console.log('发送验证码')
    startCountdown()
  }

  return (
    <button onClick={sendSms} disabled={count > 0 && count < 60}>
      {count > 0 && count < 60 ? `${count}秒后重试` : '获取验证码'}
    </button>
  )
}
```

---

## 8. 生命周期/工具类

### useIsClient

**功能说明：** 检测是否在客户端环境（非 SSR）。

**使用场景：** Next.js SSR、条件渲染客户端专属功能等。

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

### useIsMounted

**功能说明：** 检测组件是否已挂载。

**使用场景：** 避免在组件卸载后更新状态、异步操作安全检查等。

```typescript
import { useIsMounted } from 'usehooks-ts'
import { useState } from 'react'

function AsyncDataFetch() {
  const [data, setData] = useState(null)
  const isMounted = useIsMounted()

  const fetchData = async () => {
    const response = await fetch('/api/data')
    const result = await response.json()

    // 仅在组件仍然挂载时更新状态
    if (isMounted()) {
      setData(result)
    }
  }

  return (
    <div>
      <button onClick={fetchData}>加载数据</button>
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  )
}
```

---

### useUnmount

**功能说明：** 组件卸载时执行清理操作。

**使用场景：** 取消订阅、清理定时器、断开连接等。

```typescript
import { useUnmount } from 'usehooks-ts'
import { useEffect } from 'react'

function WebSocketComponent() {
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080')

    ws.onmessage = (event) => {
      console.log('收到消息:', event.data)
    }

    // 组件卸载时关闭连接
    return () => {
      ws.close()
    }
  }, [])

  // 或使用 useUnmount
  useUnmount(() => {
    console.log('组件卸载，执行清理操作')
    // 清理逻辑
  })

  return <div>WebSocket 连接中...</div>
}
```

---

### useCopyToClipboard

**功能说明：** 复制文本到剪贴板，返回复制状态。

**使用场景：** 复制链接、分享文本、代码复制等。

```typescript
import { useCopyToClipboard } from 'usehooks-ts'
import { useState } from 'react'

function CopyButton() {
  const [copiedText, copy] = useCopyToClipboard()
  const [showTip, setShowTip] = useState(false)

  const handleCopy = async (text: string) => {
    const success = await copy(text)
    if (success) {
      setShowTip(true)
      setTimeout(() => setShowTip(false), 2000)
    }
  }

  return (
    <div>
      <input type="text" defaultValue="这是要复制的文本" id="copy-input" />
      <button onClick={() => {
        const input = document.getElementById('copy-input') as HTMLInputElement
        handleCopy(input.value)
      }}>
        复制
      </button>

      {showTip && <span>✅ 已复制!</span>}
      {copiedText && <p>最后复制: {copiedText}</p>}
    </div>
  )
}
```

---

## 总结

这 30 个 hooks 涵盖了前端开发的各个方面：

- **状态管理**: 简化常见状态逻辑（布尔、计数、切换等）
- **存储**: 轻松实现数据持久化
- **主题**: 优雅处理主题切换
- **事件**: 简化事件监听和管理
- **DOM/浏览器**: 响应式设计和浏览器 API 集成
- **性能**: 防抖、优化渲染
- **定时器**: 安全的定时器管理
- **工具**: 实用的辅助功能

建议学习顺序：
1. 先掌握状态管理类（useBoolean, useToggle, useCounter）
2. 学习存储类（useLocalStorage）
3. 掌握事件监听类（useEventListener, useOnClickOutside）
4. 学习性能优化类（useDebounce 系列）
5. 最后深入 DOM/浏览器 API 类

**最佳实践：**
- 根据实际需求选择合适的 hook
- 注意性能优化，避免过度使用
- SSR 项目注意使用 useIsClient 和 useIsomorphicLayoutEffect
- 复杂场景可以组合多个 hooks 使用
