# Mint 页面设计文档

## 概述

Mint 页面是用户铸造 Blind Box NFT 的核心交互页面。用户可以选择数量、支付 ETH 来铸造神秘盲盒 NFT。所有 NFT 在售罄后将统一揭示稀有度。

---

## 合约参数

| 参数 | 值 | 说明 |
|------|-----|------|
| MAX_SUPPLY | 100 | 总供应量 |
| MAX_PER_ADDRESS | 20 | 每地址最多铸造数量 |
| MINT_PRICE | 1 ETH | 每个 NFT 的价格 |

### 稀有度分布

| 稀有度 | 数量 | 概率 | 奖励倍率 |
|--------|------|------|----------|
| Common | 50 | 50% | 1.0x |
| Rare | 30 | 30% | 1.5x |
| Epic | 15 | 15% | 2.0x |
| Legendary | 5 | 5% | 3.0x |

---

## 页面结构

```
┌─────────────────────────────────────────────────────────────┐
│                      Header (导航栏)                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              MintHero (标题+描述)                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────┐  ┌──────────────────────────┐   │
│  │                      │  │                          │   │
│  │    MintCard          │  │    NFTCarousel           │   │
│  │    (主交互区域)       │  │    (稀有度轮播展示)       │   │
│  │                      │  │                          │   │
│  └──────────────────────┘  └──────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              MintProgress (Mint 进度)                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              RarityInfo (稀有度信息卡片)             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              RecentMints (最近 Mint 记录)            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 组件说明

### 1. MintHero
标题区域，包含主标题、副标题和状态徽章。

### 2. MintCard
核心交互卡片，包含：
- 价格信息 (1 ETH per NFT)
- 剩余数量 (如 75/100)
- 用户已铸造数量 (如 2/20)
- 数量选择器 (+-按钮)
- 总价计算
- Mint 按钮

### 3. NFTCarousel
四种稀有度 NFT 的轮播展示：
- 自动播放 (3秒间隔)
- 显示稀有度名称、概率、奖励倍率
- 对应颜色主题边框

### 4. MintProgress
全局 Mint 进度展示：
- 渐变进度条
- 百分比显示
- 里程碑标记

### 5. RarityInfo
稀有度信息卡片，横向展示四种稀有度的详细信息。

### 6. RecentMints
最近 Mint 记录的实时动态列表。

---

## 状态处理

### 页面状态
- `not_connected` - 未连接钱包
- `minting` - 可以 Mint
- `sold_out` - 已售罄
- `revealed` - 已揭示

### 按钮状态
- `connect` - 显示"连接钱包"
- `mint` - 显示"Mint Now"
- `minting` - 显示 Loading
- `sold_out` - 显示"Sold Out"
- `max_reached` - 显示"已达上限"

---

## 技术实现

### Hooks 使用
```typescript
// 读取合约状态
useScaffoldReadContract({ contractName: "StakableNFT", functionName: "totalMinted" })
useScaffoldReadContract({ contractName: "StakableNFT", functionName: "mintedCount", args: [address] })
useScaffoldReadContract({ contractName: "StakableNFT", functionName: "isRevealed" })

// 执行 Mint
useScaffoldWriteContract("StakableNFT")
```

### 合约函数
- `mint(quantity)` - 铸造 NFT (payable)
- `totalMinted()` - 已铸造总量
- `mintedCount(address)` - 用户已铸造数量
- `isRevealed()` - 是否已揭示
- `MAX_SUPPLY` - 总供应量
- `MAX_PER_ADDRESS` - 每地址上限
- `MINT_PRICE` - 价格

---

## UI 风格

与 Home 页保持一致的深色主题 + 霓虹渐变风格：
- 主色调：紫色、粉色、青色、金色
- 样式类：`glass-card`, `terminal-glow`, `border-neon-*`, `text-gradient-*`
- 动画：`animate-float`, `animate-glow`, `animate-slide-in`, `animate-shimmer`

---

## 文件结构

```
packages/nextjs/app/mint/
├── page.tsx
└── _components/
    ├── MintHero.tsx
    ├── MintCard.tsx
    ├── NFTCarousel.tsx
    ├── MintProgress.tsx
    ├── RarityInfo.tsx
    └── RecentMints.tsx
```
