# Next.js 渲染机制学习文档

本目录包含 Next.js App Router 渲染流程的完整学习资料。

## 📚 文档列表

### 1. [完整指南](./nextjs-rendering-flow.md)
**推荐：首次学习时阅读**

详细说明整个渲染流程，包括：
- 服务端渲染（SSR）
- 客户端渲染
- Hydration 过程
- 客户端导航
- 关键细节和最佳实践

**适合：** 需要深入理解原理的开发者

---

### 2. [速查表](./nextjs-rendering-cheatsheet.md)
**推荐：复习时快速查阅**

一页纸快速参考：
- 核心概念速记
- 常见模式代码
- 错误避免清单
- 优化检查清单

**适合：** 快速回顾关键概念

---

### 3. [可视化流程](./nextjs-rendering-visual.md)
**推荐：理解流程时参考**

包含详细的 ASCII 流程图：
- 首次访问完整流程
- 客户端导航流程
- SwitchTheme 组件生命周期
- 时间轴对比

**适合：** 视觉学习者，需要看图理解流程

---

## 🎯 快速开始

### 如果你是第一次学习：
1. 先读 [完整指南](./nextjs-rendering-flow.md) 的前两章（核心概念 + 首次访问流程）
2. 看 [可视化流程](./nextjs-rendering-visual.md) 中的流程图
3. 回到完整指南继续阅读

### 如果你需要复习：
1. 直接看 [速查表](./nextjs-rendering-cheatsheet.md)
2. 有疑问时查阅完整指南的对应章节

### 如果你在调试问题：
1. 查看速查表的"常见错误"部分
2. 参考完整指南的"调试技巧"章节

---

## 🔑 核心要点

无论阅读哪份文档，请记住这 3 个最重要的概念：

### 1. "use client" 组件仍会在服务端预渲染
```typescript
"use client"  // ≠ 只在客户端渲染
              // = 可以使用客户端特性，但仍会 SSR
```

### 2. Hydration 是"激活"，不是"重新渲染"
```
Hydration = 给已有的 HTML 添加交互能力
         ≠ 重新渲染一遍页面
```

### 3. useEffect 在 Hydration 完成后执行
```typescript
useEffect(() => {
  // 这里的代码在 Hydration 完成后执行
  // 可以安全地触发状态更新
  setMounted(true)
}, [])
```

---

## 📖 文档内容对比

| 特性 | 完整指南 | 速查表 | 可视化流程 |
|------|---------|-------|-----------|
| 篇幅 | 长 (~200行) | 短 (~80行) | 中 (~150行) |
| 详细程度 | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| 代码示例 | 丰富 | 精简 | 适中 |
| 流程图 | 简单 | 无 | 详细 |
| 最佳实践 | 完整 | 精华 | 无 |
| 常见错误 | 详细 | 精简 | 无 |
| 适合场景 | 深入学习 | 快速复习 | 理解流程 |

---

## 🛠️ 相关资源

### 项目文件
- **实际示例：** `/packages/nextjs/components/SwitchTheme.tsx`
  - 展示了如何使用 mounted 守卫避免 Hydration mismatch
  - 演示了 useEffect 在 Hydration 后执行的实际应用

- **主题系统：** `/packages/nextjs/components/ThemeProvider.tsx`
  - next-themes 的集成
  - 阻塞脚本的使用

### 官方文档
- [Next.js App Router](https://nextjs.org/docs/app)
- [React Server Components](https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023#react-server-components)
- [React Hydration](https://react.dev/reference/react-dom/client/hydrateRoot)

---

## ❓ 常见问题

### Q1: 为什么 SwitchTheme 初次渲染看不到？
A: 因为使用了 `mounted` 守卫，初次（服务端和客户端 Hydration）都返回 `null`，只有 useEffect 执行后才显示。这是为了避免 Hydration mismatch。

详见：[完整指南 - 关键细节 - Hydration Mismatch](./nextjs-rendering-flow.md#2-hydration-mismatch-的原因)

### Q2: Link 点击后真的不请求服务器吗？
A: 会请求，但只请求 RSC Payload（5-10KB），不请求完整 HTML（200KB）。如果在缓存中则完全不请求。

详见：[完整指南 - 客户端导航流程](./nextjs-rendering-flow.md#客户端导航流程)

### Q3: 什么时候用 Server Component，什么时候用 Client Component？
A: 默认用 Server Component。只在需要以下功能时用 Client Component：
- useState、useEffect 等 Hooks
- onClick、onChange 等事件处理器
- 浏览器 API（localStorage、window 等）

详见：[速查表 - Server vs Client Components](./nextjs-rendering-cheatsheet.md#server-vs-client-components)

---

## 🔄 文档更新记录

- **v1.0** (2025-01-07)
  - 初始版本
  - 包含完整指南、速查表、可视化流程

---

## 📝 反馈

如果有疑问或发现错误，请在项目中提出。

**文档位置：** `/docs/`
**维护者：** 项目团队
