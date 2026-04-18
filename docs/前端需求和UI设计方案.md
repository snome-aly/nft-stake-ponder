# 盲盒 NFT 项目前端需求和 UI 设计方案

**项目名称**: StakableNFT 盲盒系统
**版本**: v1.0
**创建日期**: 2025-01-27
**状态**: 设计阶段
**技术栈**: Next.js 15 + Scaffold-ETH 2 + RainbowKit + Wagmi + Viem + TailwindCSS

---

## 📋 目录

- [1. 项目概述](#1-项目概述)
- [2. 用户旅程分析](#2-用户旅程分析)
- [3. 核心页面设计](#3-核心页面设计)
  - [3.1 项目首页 (/)](#31-项目首页-)
  - [3.2 Mint 铸造页面 (/mint)](#32-mint-铸造页面-mint)
  - [3.3 个人 NFT 页面 (/my-nfts)](#33-个人-nft-页面-my-nfts)
- [4. 设计系统](#4-设计系统)
- [5. 技术实现要点](#5-技术实现要点)
- [6. 智能合约集成](#6-智能合约集成)
- [7. 数据索引 (Ponder)](#7-数据索引-ponder)
- [8. 性能优化策略](#8-性能优化策略)
- [9. 响应式设计](#9-响应式设计)
- [10. 开发排期](#10-开发排期)

---

## 1. 项目概述

### 1.1 项目简介

基于已完成开发的 `StakableNFT.sol` 盲盒合约，构建一个现代化的 Web3 前端应用。用户可以通过该应用：

- **铸造盲盒 NFT**: 支付 0.01 ETH 铸造，随机获得 4 种稀有度之一
- **查看个人收藏**: 展示已拥有的 NFT，包括稀有度和奖励倍率
- **质押赚取收益**: 将 NFT 质押到池中获得 ERC20 代币奖励
- **实时数据展示**: 通过 Ponder 索引获取链上统计数据

### 1.2 核心特色

🎲 **盲盒机制**: 铸造后才知道稀有度，增加刺激感
💎 **稀有度系统**: Common (50%), Rare (30%), Epic (15%), Legendary (5%)
📈 **质押收益**: 不同稀有度有不同奖励倍率 (1x, 1.5x, 2x, 3x)
🔄 **实时更新**: 链上事件实时反馈，无需刷新页面
📊 **数据透明**: 所有概率、价格、供应量完全公开

### 1.3 技术架构

```
Frontend (Next.js 15 App Router)
├── 页面组件 (Page Components)
├── 业务组件 (Business Components)
├── 基础组件 (Base Components)
├── Hooks (自定义业务逻辑)
└── 服务层 (API + GraphQL)

Data Layer
├── 智能合约 (Hardhat)
│   ├── StakableNFT (盲盒 NFT)
│   ├── RewardToken (ERC20 奖励)
│   └── NFTStakingPool (质押池)
└── 事件索引 (Ponder)
    ├── GraphQL Schema
    ├── 事件监听器
    └── 聚合查询
```

---

## 2. 用户旅程分析

### 2.1 新用户旅程

```
访问首页 → 了解项目 → 连接钱包 → 前往 Mint 页
    ↓        ↓        ↓        ↓
项目介绍  稀有度系统  钱包连接   选择数量
    ↓        ↓        ↓        ↓
建立信任  价值感知  铸造操作  确认交易
    ↓        ↓        ↓        ↓
行动转化  价格锚定  成功反馈  查看收藏
```

### 2.2 老用户旅程

```
进入我的 NFT → 查看收藏 → 质押操作 → 领取奖励
       ↓          ↓        ↓        ↓
   资产总览    稀有度展示  收益计算  复投激励
       ↓          ↓        ↓        ↓
   价值提醒    质押决策  收益确认  长期锁定
```

### 2.3 关键转化节点

| 节点 | 目标 | 成功指标 |
|------|------|---------|
| **首页 → Mint** | 激发铸造欲望 | 点击率 > 15% |
| **Mint → 确认** | 降低放弃率 | 完成率 > 80% |
| **铸造 → 查看** | 延长使用时间 | 查看 NFT 率 > 60% |
| **查看 → 质押** | 激活长期参与 | 质押率 > 40% |

---

## 3. 核心页面设计

### 3.1 项目首页 (/)

#### 3.1.1 页面目标

**主要目标**: 吸引用户 → 教育产品 → 建立信任 → 引导行动
**成功指标**: 页面停留时间 > 30s，Mint 页面点击率 > 15%

#### 3.1.2 页面结构

```
┌─────────────────────────────────────────────┐
│  1. 导航栏 (Header)                          │
│     Logo | 首页 | Mint | 我的 NFT | 连接钱包    │
├─────────────────────────────────────────────┤
│  2. 英雄区 (Hero Section)                    │
│     🎁 盲盒标题 + 副标题 + CTA 按钮           │
├─────────────────────────────────────────────┤
│  3. 稀有度展示 (Rarity Showcase)             │
│     4 种稀有度卡片 + 概率 + 奖励倍率          │
├─────────────────────────────────────────────┤
│  4. 实时动态 (Live Feed)                     │
│     最新铸造记录 + 特效 (Legendary)           │
├─────────────────────────────────────────────┤
│  5. 数据仪表板 (Stats Dashboard)             │
│     总供应量 | 地板价 | 持有者 | 24h 交易量     │
├─────────────────────────────────────────────┤
│  6. 使用说明 (How It Works)                  │
│     4 步流程图 + 图标                        │
└─────────────────────────────────────────────┘
```

#### 3.1.3 详细设计

**区域 1: Hero Section**

```tsx
// 布局结构
<section className="hero-section min-h-[600px] flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
  <div className="container mx-auto px-4 text-center">
    {/* 主标题 */}
    <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 bg-clip-text text-transparent animate-pulse">
      🎁 Mystical Blind Box NFT
    </h1>

    {/* 副标题 */}
    <p className="text-xl md:text-2xl mb-8 text-gray-300 max-w-3xl mx-auto">
      Mint a mysterious box and discover your rarity!
      Common, Rare, Epic, or Legendary — what will you get?
    </p>

    {/* CTA 按钮组 */}
    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
      <button
        onClick={() => router.push('/mint')}
        className="btn btn-primary btn-lg text-xl px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-200 shadow-2xl"
      >
        🎲 Mint Now
      </button>
      <button
        onClick={() => router.push('/my-nfts')}
        className="btn btn-secondary btn-lg text-xl px-8 py-4 border-2 border-purple-400 hover:bg-purple-400/20 transform hover:scale-105 transition-all duration-200"
      >
        🖼️ View Gallery
      </button>
    </div>

    {/* 进度条 */}
    <div className="max-w-2xl mx-auto mb-8">
      <div className="flex justify-between text-sm text-gray-400 mb-2">
        <span>Collection Progress</span>
        <span>{totalSupply?.toString() || "0"} / 10,000</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-1000 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      <p className="text-center mt-4 text-lg">
        💰 Floor Price: 0.01 ETH (~${ethPrice.toFixed(2)})
      </p>
    </div>
  </div>
</section>
```

**区域 2: 稀有度展示**

```tsx
<section className="rarity-section py-20 bg-gray-900">
  <div className="container mx-auto px-4">
    <h2 className="text-4xl font-bold text-center mb-12 text-white">
      🎲 Rarity Distribution & Rewards
    </h2>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {/* Common */}
      <div className="rarity-card group">
        <div className="bg-gradient-to-br from-gray-600 to-gray-800 p-8 rounded-2xl transform group-hover:scale-105 transition-all duration-300 shadow-xl">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-500 rounded-full flex items-center justify-center text-3xl">
              ⚪
            </div>
            <h3 className="text-2xl font-bold text-gray-300 mb-2">Common</h3>
            <div className="text-3xl font-bold text-white mb-2">50%</div>
            <div className="text-lg text-gray-400 mb-4">Most Common</div>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-400">Reward Multiplier</div>
              <div className="text-xl font-bold text-gray-300">1.0x</div>
            </div>
          </div>
        </div>
      </div>

      {/* Rare */}
      <div className="rarity-card group">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-8 rounded-2xl transform group-hover:scale-105 transition-all duration-300 shadow-xl group-hover:shadow-blue-500/50">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-blue-400 rounded-full flex items-center justify-center text-3xl animate-pulse">
              🔵
            </div>
            <h3 className="text-2xl font-bold text-blue-300 mb-2">Rare</h3>
            <div className="text-3xl font-bold text-white mb-2">30%</div>
            <div className="text-lg text-blue-400 mb-4">Uncommon Find</div>
            <div className="bg-blue-900/50 rounded-lg p-4">
              <div className="text-sm text-blue-400">Reward Multiplier</div>
              <div className="text-xl font-bold text-blue-300">1.5x</div>
            </div>
          </div>
        </div>
      </div>

      {/* Epic */}
      <div className="rarity-card group">
        <div className="bg-gradient-to-br from-purple-600 to-purple-800 p-8 rounded-2xl transform group-hover:scale-105 transition-all duration-300 shadow-xl group-hover:shadow-purple-500/50">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-purple-400 rounded-full flex items-center justify-center text-3xl animate-pulse">
              🟣
            </div>
            <h3 className="text-2xl font-bold text-purple-300 mb-2">Epic</h3>
            <div className="text-3xl font-bold text-white mb-2">15%</div>
            <div className="text-lg text-purple-400 mb-4">Rare Discovery</div>
            <div className="bg-purple-900/50 rounded-lg p-4">
              <div className="text-sm text-purple-400">Reward Multiplier</div>
              <div className="text-xl font-bold text-purple-300">2.0x</div>
            </div>
          </div>
        </div>
      </div>

      {/* Legendary */}
      <div className="rarity-card group">
        <div className="bg-gradient-to-br from-yellow-500 to-orange-600 p-8 rounded-2xl transform group-hover:scale-105 transition-all duration-300 shadow-xl group-hover:shadow-yellow-500/70 animate-glow">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-yellow-300 rounded-full flex items-center justify-center text-3xl animate-spin-slow">
              🌟
            </div>
            <h3 className="text-2xl font-bold text-yellow-300 mb-2">Legendary</h3>
            <div className="text-3xl font-bold text-white mb-2">5%</div>
            <div className="text-lg text-yellow-400 mb-4">Ultra Rare!</div>
            <div className="bg-yellow-900/50 rounded-lg p-4">
              <div className="text-sm text-yellow-400">Reward Multiplier</div>
              <div className="text-xl font-bold text-yellow-300">3.0x</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
```

**区域 3: 实时铸造动态**

```tsx
<section className="live-feed-section py-20 bg-black">
  <div className="container mx-auto px-4">
    <h2 className="text-4xl font-bold text-center mb-12 text-white flex items-center justify-center gap-3">
      🔥 Live Mint Activity
      <span className="text-sm font-normal text-green-400 animate-pulse">● LIVE</span>
    </h2>

    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-900/50 backdrop-blur rounded-2xl p-6 border border-gray-800">
        <div className="space-y-4 max-h-96 overflow-y-auto" id="mint-feed">
          {recentMints.map((mint, index) => (
            <div
              key={mint.transactionHash}
              className={`mint-item flex items-center justify-between p-4 rounded-lg bg-gray-800/50 transform hover:bg-gray-700/50 transition-all duration-200 ${
                mint.rarity === 3 ? 'animate-pulse ring-2 ring-yellow-500 ring-opacity-50' : ''
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                  getRarityStyle(mint.rarity).bg
                }`}>
                  {getRarityIcon(mint.rarity)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Address address={mint.owner} />
                    <span className="text-gray-400">minted</span>
                    <span className={`font-bold ${getRarityStyle(mint.rarity).text}`}>
                      {getRarityName(mint.rarity)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    NFT #{mint.tokenId.toString()} • {getRelativeTime(mint.timestamp)}
                  </div>
                </div>
              </div>

              {mint.rarity === 3 && (
                <div className="text-yellow-400 animate-bounce">
                  🎉 LEGENDARY!
                </div>
              )}
            </div>
          ))}
        </div>

        {recentMints.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">⏳</div>
            <p>Waiting for the first mint...</p>
            <p className="text-sm">Be the first to discover what's inside!</p>
          </div>
        )}
      </div>
    </div>
  </div>
</section>
```

#### 3.1.4 数据获取

```tsx
// 使用 Scaffold-ETH Hooks 获取链上数据
export default function HomePage() {
  // 读取总供应量
  const { data: totalSupply } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "totalSupply",
  });

  // 实时监听铸造事件
  const [recentMints, setRecentMints] = useState<MintEvent[]>([]);

  useScaffoldWatchContractEvent({
    contractName: "StakableNFT",
    eventName: "NFTMinted",
    onLogs: (logs) => {
      const newMints = logs.map(log => ({
        transactionHash: log.transactionHash,
        owner: log.args.to,
        tokenId: log.args.tokenId,
        rarity: Number(log.args.rarity),
        timestamp: Number(log.args.timestamp),
      }));

      setRecentMints(prev => [...newMints, ...prev].slice(0, 20));

      // Legendary 铸造特效
      newMints.forEach(mint => {
        if (mint.rarity === 3) {
          triggerCelebration();
        }
      });
    },
  });

  // 获取 ETH 价格（从 CoinGecko API）
  const { data: ethPrice } = useEthPrice();

  // 计算进度百分比
  const progressPercentage = totalSupply
    ? Number((totalSupply * 100n) / 10000n)
    : 0;

  return (
    // JSX 结构...
  );
}
```

---

### 3.2 Mint 铸造页面 (/mint)

#### 3.2.1 页面目标

**主要目标**: 简化铸造流程 → 清晰价格展示 → 实时进度反馈 → 成功庆祝
**成功指标**: 铸造完成率 > 80%，用户满意度 > 90%

#### 3.2.2 页面结构 (左右分栏)

```
┌──────────────────────┬──────────────────────┐
│   左侧面板           │   右侧面板           │
│   (视觉刺激)          │   (铸造表单)          │
│                      │                      │
│  🎁 3D 盲盒动画       │   Mint Your NFT      │
│  稀有度概率展示       │                      │
│  实时铸造动态         │   Quantity: [1▼]     │
│  What's inside?      │   Unit Price: 0.01   │
│  • 50% Common        │   Discount: -0%      │
│  • 30% Rare          │   ─────────────────  │
│  • 15% Epic          │   Total: 0.01 ETH    │
│  • 5% Legendary      │                      │
│                      │   Your Balance:      │
│  Recent Lucky Mints: │   ✅ 1.25 ETH        │
│  🌟 [Legendary] #123 │                      │
│  🟣 [Epic] #124      │   [Mint Now 🎲]      │
│  🔵 [Rare] #125      │                      │
│                      │   Transaction Progress│
│                      │   ⏳ Step 1/4         │
└──────────────────────┴──────────────────────┘
```

#### 3.2.3 详细设计

**左侧面板：视觉刺激区**

```tsx
<div className="left-panel lg:col-span-1 space-y-8">
  {/* 3D 盲盒动画 */}
  <div className="mystery-box-container">
    <div className="mystery-box-wrapper w-80 h-80 mx-auto">
      <div className="mystery-box animate-float cursor-pointer">
        {/* 盲盒 SVG 或 Lottie 动画 */}
        <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl shadow-2xl transform hover:rotate-3 hover:scale-110 transition-all duration-300 flex items-center justify-center">
          <div className="text-8xl animate-pulse">🎁</div>
        </div>
      </div>
      <div className="question-marks absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-6xl text-white/20 animate-bounce" style={{ animationDelay: '0s' }}>?</div>
        <div className="text-4xl text-white/10 animate-bounce" style={{ animationDelay: '0.5s' }}>?</div>
        <div className="text-8xl text-white/30 animate-bounce" style={{ animationDelay: '1s' }}>?</div>
      </div>
    </div>
  </div>

  {/* 稀有度概率 */}
  <div className="rarity-chances bg-gray-800/50 rounded-2xl p-6 backdrop-blur">
    <h3 className="text-xl font-bold text-white mb-6 text-center">What's inside?</h3>
    <div className="space-y-4">
      {[
        { name: 'Common', percentage: 50, color: 'bg-gray-500' },
        { name: 'Rare', percentage: 30, color: 'bg-blue-500' },
        { name: 'Epic', percentage: 15, color: 'bg-purple-500' },
        { name: 'Legendary', percentage: 5, color: 'bg-gradient-to-r from-yellow-500 to-orange-500 animate-pulse' },
      ].map((rarity) => (
        <div key={rarity.name} className="rarity-row">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-white">{rarity.name}</span>
            <span className="text-white/80">{rarity.percentage}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full ${rarity.color} transition-all duration-1000 ease-out`}
              style={{ width: `${rarity.percentage}%` }}
            />
          </div>
        </div>
      ))}
    </div>
    <div className="mt-6 p-4 bg-yellow-900/20 rounded-lg border border-yellow-500/30">
      <p className="text-sm text-yellow-400 text-center">
        💡 Higher rarity = Higher staking rewards (1x - 3x)
      </p>
    </div>
  </div>

  {/* 实时幸运儿 */}
  <div className="lucky-mints bg-gray-800/50 rounded-2xl p-6 backdrop-blur">
    <h3 className="text-xl font-bold text-white mb-4 text-center">🌟 Recent Lucky Mints</h3>
    <div className="space-y-3">
      {recentMints.filter(m => m.rarity >= 2).slice(0, 3).map((mint, index) => (
        <div key={index} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className={`text-2xl ${mint.rarity === 3 ? 'animate-spin-slow' : ''}`}>
              {getRarityIcon(mint.rarity)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`font-bold ${getRarityStyle(mint.rarity).text}`}>
                  {getRarityName(mint.rarity)}
                </span>
                <span className="text-gray-400 text-sm">
                  #{mint.tokenId.toString()}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {getRelativeTime(mint.timestamp)}
              </div>
            </div>
          </div>
          {mint.rarity === 3 && (
            <div className="text-yellow-400 text-xs animate-pulse">JACKPOT!</div>
          )}
        </div>
      ))}
    </div>
  </div>
</div>
```

**右侧面板：铸造表单**

```tsx
<div className="right-panel lg:col-span-1">
  <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-8">
    <h2 className="text-3xl font-bold text-white mb-8 text-center">Mint Your NFT</h2>

    {/* 数量选择器 */}
    <div className="mb-6">
      <label className="block text-white font-semibold mb-3">Quantity</label>
      <div className="grid grid-cols-3 gap-3">
        {[1, 5, 10].map((qty) => {
          const discount = qty >= 10 ? 10 : qty >= 5 ? 5 : 0;
          return (
            <button
              key={qty}
              onClick={() => setQuantity(qty)}
              className={`p-4 rounded-xl border-2 font-bold transition-all duration-200 ${
                quantity === qty
                  ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                  : 'border-gray-600 bg-gray-700/50 text-gray-400 hover:border-purple-400 hover:text-purple-400'
              }`}
            >
              <div className="text-lg">{qty} NFT{qty > 1 ? 's' : ''}</div>
              {discount > 0 && (
                <div className="text-xs text-green-400">Save {discount}%</div>
              )}
            </button>
          );
        })}
      </div>
    </div>

    {/* 价格计算 */}
    <div className="mb-6 bg-gray-900/50 rounded-xl p-4">
      <div className="space-y-3">
        <div className="flex justify-between text-gray-400">
          <span>Unit Price:</span>
          <span>0.01 ETH (~${ethPrice * 0.01})</span>
        </div>
        <div className="flex justify-between text-gray-400">
          <span>Quantity:</span>
          <span>× {quantity}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-green-400 font-semibold">
            <span>Discount:</span>
            <span>-{discount}%</span>
          </div>
        )}
        <div className="border-t border-gray-700 pt-3">
          <div className="flex justify-between text-xl font-bold text-white">
            <span>Total:</span>
            <span>{formatEther(totalPrice)} ETH</span>
          </div>
          <div className="text-sm text-gray-400 text-right">
            (~${(ethPrice * Number(formatEther(totalPrice))).toFixed(2)})
          </div>
        </div>
      </div>
    </div>

    {/* 余额检查 */}
    <div className={`mb-6 p-4 rounded-xl ${
      hasSufficientBalance
        ? 'bg-green-900/20 border border-green-500/30'
        : 'bg-red-900/20 border border-red-500/30'
    }`}>
      <div className="flex items-center space-x-2 mb-2">
        <span className={`text-lg ${hasSufficientBalance ? 'text-green-400' : 'text-red-400'}`}>
          {hasSufficientBalance ? '✅' : '❌'}
        </span>
        <span className={`font-semibold ${hasSufficientBalance ? 'text-green-400' : 'text-red-400'}`}>
          Your Balance: {balance?.formatted || '0'} ETH
        </span>
      </div>
      {!hasSufficientBalance && (
        <div className="text-sm text-red-400">
          Need {formatEther(totalPrice)} ETH to mint
          <a
            href="/faucet"
            className="ml-2 text-blue-400 hover:text-blue-300 underline"
          >
            Get ETH →
          </a>
        </div>
      )}
      {hasSufficientBalance && (
        <div className="text-sm text-green-400">
          ✅ Sufficient funds for minting
        </div>
      )}
    </div>

    {/* Mint 按钮 */}
    <MintButton
      isConnected={isConnected}
      hasSufficientBalance={hasSufficientBalance}
      isPending={isPending}
      quantity={quantity}
      totalPrice={totalPrice}
      onMint={handleMint}
    />

    {/* 交易进度 */}
    {transactionStep > 0 && (
      <TransactionProgress
        step={transactionStep}
        transactionHash={transactionHash}
        onReset={() => setTransactionStep(0)}
      />
    )}
  </div>
</div>
```

**铸造按钮状态机**

```tsx
function MintButton({
  isConnected,
  hasSufficientBalance,
  isPending,
  quantity,
  totalPrice,
  onMint
}) {
  if (!isConnected) {
    return (
      <button
        className="w-full btn btn-disabled"
        disabled
      >
        🔗 Connect Wallet First
      </button>
    );
  }

  if (!hasSufficientBalance) {
    return (
      <button
        className="w-full btn btn-disabled"
        disabled
      >
        💰 Insufficient Balance
      </button>
    );
  }

  if (isPending) {
    return (
      <button
        className="w-full btn btn-disabled"
        disabled
      >
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
          Processing...
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={() => onMint(quantity, totalPrice)}
      className="w-full btn btn-primary bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-8 rounded-xl text-lg transform hover:scale-105 transition-all duration-200 shadow-lg"
    >
      🎲 Mint {quantity} NFT{quantity > 1 ? 's' : ''}
      <div className="text-sm opacity-80">
        for {formatEther(totalPrice)} ETH
      </div>
    </button>
  );
}
```

**交易进度组件**

```tsx
function TransactionProgress({ step, transactionHash, onReset }) {
  const steps = [
    { id: 1, label: 'Approve in Wallet', icon: '🔐' },
    { id: 2, label: 'Sending Transaction', icon: '📤' },
    { id: 3, label: 'Waiting Confirmation', icon: '⏳' },
    { id: 4, label: 'Revealing Rarity', icon: '🎁' },
  ];

  return (
    <div className="mt-8 bg-gray-900/50 rounded-xl p-6">
      <h3 className="text-lg font-bold text-white mb-4">Transaction Progress</h3>

      <div className="space-y-4">
        {steps.map((s) => (
          <div
            key={s.id}
            className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
              s.id < step
                ? 'bg-green-900/20 border border-green-500/30'
                : s.id === step
                ? 'bg-blue-900/20 border border-blue-500/30 animate-pulse'
                : 'bg-gray-800/50 border border-gray-700'
            }`}
          >
            <div className="text-2xl">
              {s.id < step ? '✅' : s.id === step ? s.icon : '⏸️'}
            </div>
            <div className={`flex-1 ${s.id < step ? 'text-green-400' : s.id === step ? 'text-blue-400' : 'text-gray-500'}`}>
              <div className="font-semibold">{s.label}</div>
              {s.id === step && step === 3 && (
                <div className="text-sm opacity-75">~12 seconds remaining</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {transactionHash && (
        <div className="mt-4 text-center">
          <a
            href={`https://etherscan.io/tx/${transactionHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline text-sm"
          >
            View Transaction on Etherscan →
          </a>
        </div>
      )}

      <button
        onClick={onReset}
        className="w-full mt-4 text-sm text-gray-500 hover:text-gray-400"
      >
        Start New Mint
      </button>
    </div>
  );
}
```

**成功弹窗**

```tsx
function SuccessModal({ isOpen, onClose, mintData }) {
  useEffect(() => {
    if (isOpen && mintData) {
      // 触发庆祝动画
      triggerCelebration(mintData.rarity);
    }
  }, [isOpen, mintData]);

  if (!isOpen || !mintData) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-gray-800 transform animate-bounce-in">
        <div className="text-center">
          {/* 庆祝图标 */}
          <div className="text-6xl mb-4">
            {mintData.rarity === 3 ? '🎉' : mintData.rarity === 2 ? '✨' : '🎊'}
          </div>

          {/* 成功标题 */}
          <h2 className="text-3xl font-bold text-white mb-2">
            🎉 Mint Successful!
          </h2>

          {/* NFT 信息 */}
          <div className={`text-xl font-bold mb-4 ${getRarityStyle(mintData.rarity).text}`}>
            You got a {getRarityName(mintData.rarity)} NFT!
          </div>

          <div className="text-gray-400 mb-6">
            Token ID: #{mintData.tokenId.toString()}
          </div>

          {/* 操作按钮 */}
          <div className="space-y-3">
            <button
              onClick={() => window.open(`https://opensea.io/assets/ethereum/${CONTRACT_ADDRESS}/${mintData.tokenId}`, '_blank')}
              className="w-full btn btn-secondary py-3 px-6 bg-gray-800 hover:bg-gray-700 text-white rounded-lg"
            >
              🌐 View on OpenSea
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => router.push('/mint')}
                className="btn btn-primary py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
              >
                🎲 Mint More
              </button>

              <button
                onClick={() => router.push('/my-nfts')}
                className="btn btn-secondary py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
              >
                🖼️ View Collection
              </button>
            </div>
          </div>

          {/* 社交分享 */}
          <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
            <p className="text-sm text-gray-400 mb-2">Share your luck!</p>
            <button
              onClick={() => shareOnTwitter(mintData)}
              className="text-blue-400 hover:text-blue-300 text-sm underline"
            >
              🐦 Tweet about your NFT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### 3.3 个人 NFT 页面 (/my-nfts)

#### 3.3.1 页面目标

**主要目标**: 展示个人收藏 → 便捷质押操作 → 实时收益显示 → 激励长期持有
**成功指标**: NFT 质押率 > 40%，页面停留时间 > 60s

#### 3.3.2 页面结构

```
┌─────────────────────────────────────────────┐
│  Header: 我的收藏 | 统计数据 | 连接钱包        │
├─────────────────────────────────────────────┤
│  统计仪表板                                  │
│  ┌─────────┬─────────┬─────────┬─────────┐   │
│  │ Owned   │ Staked  │ Rewards │ APR     │   │
│  │   12    │   8     │ 1.5K    │  150%   │   │
│  │ NFTs    │ NFTs    │ tokens  │   ↗️   │   │
│  └─────────┴─────────┴─────────┴─────────┘   │
├─────────────────────────────────────────────┤
│  筛选器: [全部] [未质押] [已质押] [稀有度▼]   │
├─────────────────────────────────────────────┤
│  NFT 网格布局 (3-4 列)                      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │ [NFT]   │ │ [NFT]   │ │ [NFT]   │       │
│  │ #123    │ │ #124    │ │ #125    │       │
│  │ Rare    │ │ Epic    │ │ Common  │       │
│  │ [Stake] │ │[Claim] │ │[Unstake]│       │
│  └─────────┘ └─────────┘ └─────────┘       │
├─────────────────────────────────────────────┤
│  批量操作: [全选质押] [一键领取] [批量取回]   │
└─────────────────────────────────────────────┘
```

#### 3.3.3 详细设计

**统计仪表板**

```tsx
function StatsDashboard({ userAddress }) {
  // 使用 Ponder GraphQL 查询用户统计数据
  const { data: userStats } = useUserStats(userAddress);
  const { data: ownedNFTs } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "balanceOf",
    args: [userAddress],
  });
  const { data: stakedNFTs } = useScaffoldReadContract({
    contractName: "NFTStakingPool",
    functionName: "getUserStakes",
    args: [userAddress],
  });

  return (
    <div className="stats-dashboard bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-2xl p-6 mb-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Total NFTs</span>
            <span className="text-2xl">🎨</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {ownedNFTs?.toString() || '0'}
          </div>
          <div className="text-sm text-green-400">
            +{todayMints} today
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Staked NFTs</span>
            <span className="text-2xl">🔒</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {stakedNFTs?.length || 0}
          </div>
          <div className="text-sm text-blue-400">
            {stakingRate}% staked
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Pending Rewards</span>
            <span className="text-2xl">💰</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {formatNumber(pendingRewards)}
          </div>
          <div className="text-sm text-yellow-400">
            ≈ ${pendingRewardsUSD}
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Average APR</span>
            <span className="text-2xl">📈</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {averageAPR}%
          </div>
          <div className="text-sm text-purple-400">
            ↗️ +2.3% today
          </div>
        </div>
      </div>

      {/* 收益趋势图 */}
      <div className="mt-6 bg-gray-800/50 rounded-xl p-4">
        <h3 className="text-lg font-semibold text-white mb-3">Rewards Trend (7 days)</h3>
        <RewardsChart data={rewardsHistory} />
      </div>
    </div>
  );
}
```

**筛选器和操作栏**

```tsx
function FilterAndActions({
  activeFilter,
  setActiveFilter,
  selectedNFTs,
  onSelectAll,
  onBatchStake,
  onBatchClaim,
  onBatchUnstake
}) {
  const filters = [
    { id: 'all', label: 'All NFTs', icon: '🎨' },
    { id: 'unstaked', label: 'Unstaked', icon: '🔓' },
    { id: 'staked', label: 'Staked', icon: '🔒' },
    { id: 'legendary', label: 'Legendary', icon: '🌟' },
    { id: 'epic', label: 'Epic', icon: '💜' },
    { id: 'rare', label: 'Rare', icon: '💙' },
    { id: 'common', label: 'Common', icon: '⚪' },
  ];

  return (
    <div className="filter-actions bg-gray-800/50 rounded-xl p-4 mb-6">
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
        {/* 筛选器 */}
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeFilter === filter.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'
              }`}
            >
              <span className="mr-2">{filter.icon}</span>
              {filter.label}
            </button>
          ))}
        </div>

        {/* 排序选择器 */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600"
        >
          <option value="recent">Most Recent</option>
          <option value="rarity">Rarity</option>
          <option value="rewards">Highest Rewards</option>
          <option value="id">Token ID</option>
        </select>
      </div>

      {/* 批量操作栏 */}
      {selectedNFTs.length > 0 && (
        <div className="mt-4 p-4 bg-purple-900/20 rounded-lg border border-purple-500/30">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-white">
              <span className="font-semibold">{selectedNFTs.length}</span> NFT{selectedNFTs.length > 1 ? 's' : ''} selected
            </div>

            <div className="flex gap-2">
              <button
                onClick={onSelectAll}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm"
              >
                {isAllSelected ? 'Deselect All' : 'Select All'}
              </button>

              {canBatchStake && (
                <button
                  onClick={onBatchStake}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
                >
                  🚀 Stake All ({selectedNFTs.length})
                </button>
              )}

              {canBatchClaim && (
                <button
                  onClick={onBatchClaim}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                >
                  💰 Claim All Rewards
                </button>
              )}

              {canBatchUnstake && (
                <button
                  onClick={onBatchUnstake}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm"
                >
                  🔓 Unstake All
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

**NFT 卡片组件**

```tsx
function NFTCard({ nft, isSelected, onSelect, onAction }) {
  const [pendingRewards, setPendingRewards] = useState("0");
  const [isCalculating, setIsCalculating] = useState(false);

  // 实时计算待领取奖励
  useEffect(() => {
    if (!nft.isStaked) return;

    const calculateRewards = async () => {
      setIsCalculating(true);
      try {
        const rewards = await publicClient.readContract({
          address: STAKING_POOL_ADDRESS,
          abi: stakingPoolABI,
          functionName: 'calculateRewards',
          args: [nft.tokenId],
        });
        setPendingRewards(formatEther(rewards));
      } catch (error) {
        console.error('Failed to calculate rewards:', error);
      } finally {
        setIsCalculating(false);
      }
    };

    calculateRewards();
    const interval = setInterval(calculateRewards, 5000); // 每5秒更新一次
    return () => clearInterval(interval);
  }, [nft.tokenId, nft.isStaked]);

  const rarityStyle = getRarityStyle(nft.rarity);

  return (
    <div className={`nft-card group relative bg-gray-800 rounded-2xl overflow-hidden transition-all duration-300 hover:transform hover:scale-105 hover:shadow-xl ${
      isSelected ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-gray-900' : ''
    } ${nft.isStaked ? 'border-2 border-green-500/30' : 'border-2 border-gray-700'}`}>

      {/* 选择框 */}
      <button
        onClick={() => onSelect(nft.tokenId)}
        className="absolute top-3 left-3 z-10 w-6 h-6 rounded border-2 border-gray-400 bg-gray-900/80 hover:border-purple-500 transition-colors duration-200"
      >
        {isSelected && (
          <div className="w-full h-full rounded bg-purple-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </button>

      {/* 稀有度标签 */}
      <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-bold ${rarityStyle.bg} ${rarityStyle.text}`}>
        {getRarityName(nft.rarity)}
      </div>

      {/* 质押状态标签 */}
      {nft.isStaked && (
        <div className="absolute bottom-3 right-3 px-2 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">
          🔒 Staked
        </div>
      )}

      {/* NFT 图片 */}
      <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-gray-700 to-gray-900">
        {nft.image ? (
          <img
            src={nft.image}
            alt={`NFT #${nft.tokenId}`}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className={`text-6xl ${rarityStyle.text} opacity-50`}>
              {getRarityIcon(nft.rarity)}
            </div>
          </div>
        )}
      </div>

      {/* 卡片信息 */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-lg font-bold text-white">
              NFT #{nft.tokenId.toString()}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>{getRarityName(nft.rarity)}</span>
              <span>•</span>
              <span>{nft.rewardMultiplier}x rewards</span>
            </div>
          </div>
        </div>

        {/* 待领取奖励 */}
        {nft.isStaked && (
          <div className="mb-3 p-3 bg-gray-700/50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Pending Rewards</span>
              <div className={`text-lg font-bold ${isCalculating ? 'text-yellow-400' : 'text-green-400'}`}>
                {isCalculating ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400 mr-2"></div>
                    ...
                  </div>
                ) : (
                  `${pendingRewards} RWRD`
                )}
              </div>
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="space-y-2">
          {!nft.isStaked ? (
            <button
              onClick={() => onAction('stake', nft.tokenId)}
              className="w-full btn btn-primary py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200"
            >
              🚀 Stake for Rewards
            </button>
          ) : (
            <>
              <button
                onClick={() => onAction('claim', nft.tokenId)}
                className="w-full btn btn-secondary py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
              >
                💰 Claim Rewards
              </button>

              <button
                onClick={() => onAction('unstake', nft.tokenId)}
                className="w-full btn btn-outline py-2 px-4 border border-orange-500 text-orange-400 hover:bg-orange-500/10 rounded-lg font-medium transition-colors duration-200"
              >
                🔓 Unstake
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

**主页面组件**

```tsx
export default function MyNFTsPage() {
  const { address } = useAccount();
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedNFTs, setSelectedNFTs] = useState(new Set());
  const [sortBy, setSortBy] = useState('recent');

  // 获取用户拥有的所有 NFT
  const { data: ownedNFTs } = useUserOwnedNFTs(address);
  const { data: stakedNFTs } = useUserStakedNFTs(address);

  // 合并和过滤 NFT
  const allNFTs = useMemo(() => {
    let nfts = [...(ownedNFTs || []), ...(stakedNFTs || [])];

    // 应用筛选器
    if (activeFilter !== 'all') {
      nfts = nfts.filter(nft => {
        switch (activeFilter) {
          case 'unstaked': return !nft.isStaked;
          case 'staked': return nft.isStaked;
          case 'legendary': return nft.rarity === 3;
          case 'epic': return nft.rarity === 2;
          case 'rare': return nft.rarity === 1;
          case 'common': return nft.rarity === 0;
          default: return true;
        }
      });
    }

    // 应用排序
    nfts.sort((a, b) => {
      switch (sortBy) {
        case 'rarity': return b.rarity - a.rarity;
        case 'rewards': return b.rewardMultiplier - a.rewardMultiplier;
        case 'id': return Number(a.tokenId) - Number(b.tokenId);
        case 'recent':
        default:
          return Number(b.tokenId) - Number(a.tokenId); // 假设 ID 越大越新
      }
    });

    return nfts;
  }, [ownedNFTs, stakedNFTs, activeFilter, sortBy]);

  // 批量操作
  const handleBatchStake = async () => {
    const unstakedNFTs = Array.from(selectedNFTs).filter(
      tokenId => !allNFTs.find(nft => nft.tokenId === tokenId)?.isStaked
    );

    if (unstakedNFTs.length > 0) {
      await writeContractAsync({
        contractName: "NFTStakingPool",
        functionName: "batchStake",
        args: [unstakedNFTs],
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">My NFT Collection</h1>
        <p className="text-gray-400">Manage your NFTs and earn staking rewards</p>
      </div>

      {/* 统计仪表板 */}
      <StatsDashboard userAddress={address} />

      {/* 筛选器和批量操作 */}
      <FilterAndActions
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        selectedNFTs={selectedNFTs}
        onSelectAll={() => setSelectedNFTs(
          selectedNFTs.size === allNFTs.length
            ? new Set()
            : new Set(allNFTs.map(nft => nft.tokenId))
        )}
        onBatchStake={handleBatchStake}
        onBatchClaim={() => {/* 实现批量领取 */}}
        onBatchUnstake={() => {/* 实现批量取回 */}}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />

      {/* NFT 网格 */}
      {allNFTs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {allNFTs.map((nft) => (
            <NFTCard
              key={nft.tokenId.toString()}
              nft={nft}
              isSelected={selectedNFTs.has(nft.tokenId)}
              onSelect={(tokenId) => {
                const newSelected = new Set(selectedNFTs);
                if (newSelected.has(tokenId)) {
                  newSelected.delete(tokenId);
                } else {
                  newSelected.add(tokenId);
                }
                setSelectedNFTs(newSelected);
              }}
              onAction={async (action, tokenId) => {
                try {
                  switch (action) {
                    case 'stake':
                      await writeContractAsync({
                        contractName: "NFTStakingPool",
                        functionName: "stake",
                        args: [tokenId],
                      });
                      break;
                    case 'claim':
                      await writeContractAsync({
                        contractName: "NFTStakingPool",
                        functionName: "claimRewards",
                        args: [tokenId],
                      });
                      break;
                    case 'unstake':
                      await writeContractAsync({
                        contractName: "NFTStakingPool",
                        functionName: "unstake",
                        args: [tokenId],
                      });
                      break;
                  }
                } catch (error) {
                  console.error(`${action} failed:`, error);
                }
              }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🎨</div>
          <h3 className="text-2xl font-bold text-white mb-2">No NFTs found</h3>
          <p className="text-gray-400 mb-6">
            {activeFilter === 'all'
              ? "You haven't minted any NFTs yet"
              : `No NFTs match the "${activeFilter}" filter`
            }
          </p>
          {activeFilter === 'all' && (
            <button
              onClick={() => router.push('/mint')}
              className="btn btn-primary bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              🎲 Mint Your First NFT
            </button>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## 4. 设计系统

### 4.1 配色方案

```css
:root {
  /* 稀有度颜色系统 */
  --rarity-common: #9CA3AF;
  --rarity-rare: #3B82F6;
  --rarity-epic: #A855F7;
  --rarity-legendary: #F59E0B;

  /* 渐变定义 */
  --gradient-common: linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%);
  --gradient-rare: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
  --gradient-epic: linear-gradient(135deg, #A855F7 0%, #9333EA 100%);
  --gradient-legendary: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
  --gradient-primary: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%);

  /* 功能性颜色 */
  --success: #10B981;
  --warning: #F59E0B;
  --error: #EF4444;
  --info: #3B82F6;

  /* 背景色系 */
  --bg-primary: #0F172A;
  --bg-secondary: #1E293B;
  --bg-tertiary: #334155;
  --bg-card: rgba(30, 41, 59, 0.8);

  /* 文字色系 */
  --text-primary: #F8FAFC;
  --text-secondary: #CBD5E1;
  --text-tertiary: #94A3B8;
}
```

### 4.2 动画系统

```css
/* 核心动画 */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}

@keyframes glow {
  0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.5); }
  50% { box-shadow: 0 0 40px rgba(139, 92, 246, 0.8); }
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes bounce-in {
  0% { transform: scale(0.3); opacity: 0; }
  50% { transform: scale(1.05); }
  70% { transform: scale(0.9); }
  100% { transform: scale(1); opacity: 1; }
}

/* 动画工具类 */
.animate-float { animation: float 3s ease-in-out infinite; }
.animate-glow { animation: glow 2s ease-in-out infinite; }
.animate-spin-slow { animation: spin-slow 8s linear infinite; }
.animate-bounce-in { animation: bounce-in 0.6s ease-out; }
```

### 4.3 组件样式

```css
/* 按钮组件 */
.btn {
  @apply px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform;
}

.btn-primary {
  @apply bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 hover:scale-105 hover:shadow-xl;
}

.btn-secondary {
  @apply bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white;
}

.btn-disabled {
  @apply bg-gray-800 text-gray-500 cursor-not-allowed opacity-50;
}

/* 卡片组件 */
.card {
  @apply bg-gray-800/50 backdrop-blur rounded-2xl p-6 border border-gray-700 transition-all duration-300 hover:border-gray-600 hover:shadow-xl;
}

/* 稀有度标签 */
.rarity-badge {
  @apply px-3 py-1 rounded-full text-xs font-bold;
}

.rarity-common { @apply bg-gray-600 text-gray-300; }
.rarity-rare { @apply bg-blue-600 text-blue-300; }
.rarity-epic { @apply bg-purple-600 text-purple-300; }
.rarity-legendary { @apply bg-gradient-to-r from-yellow-500 to-orange-500 text-yellow-100 animate-pulse; }
```

---

## 5. 技术实现要点

### 5.1 核心技术栈

- **前端框架**: Next.js 15 App Router
- **Web3 集成**: Scaffold-ETH 2 + Wagmi + Viem
- **钱包连接**: RainbowKit
- **样式系统**: TailwindCSS + DaisyUI
- **状态管理**: React Query + Zustand
- **数据索引**: Ponder (GraphQL)
- **动画库**: Framer Motion + Lottie

### 5.2 关键 Hooks 封装

```tsx
// hooks/useUserNFTs.ts
import { useAccount } from 'wagmi';
import { useScaffoldReadContract } from '~~/hooks/scaffold-eth';
import { useQuery } from '@tanstack/react-query';

export function useUserNFTs(address?: string) {
  const { address: connectedAddress } = useAccount();
  const userAddress = address || connectedAddress;

  return useQuery({
    queryKey: ['userNFTs', userAddress],
    queryFn: async () => {
      if (!userAddress) return [];

      // 获取拥有的 NFT 数量
      const balance = await publicClient.readContract({
        address: STAKABLE_NFT_ADDRESS,
        abi: stakableNFTABI,
        functionName: 'balanceOf',
        args: [userAddress],
      });

      // 获取所有 token ID
      const tokenIds = [];
      for (let i = 0; i < Number(balance); i++) {
        const tokenId = await publicClient.readContract({
          address: STAKABLE_NFT_ADDRESS,
          abi: stakableNFTABI,
          functionName: 'tokenOfOwnerByIndex',
          args: [userAddress, i],
        });
        tokenIds.push(tokenId);
      }

      // 批量获取 NFT 信息
      const nfts = await Promise.all(
        tokenIds.map(async (tokenId) => {
          const [rarity, tokenURI] = await Promise.all([
            publicClient.readContract({
              address: STAKABLE_NFT_ADDRESS,
              abi: stakableNFTABI,
              functionName: 'getRarity',
              args: [tokenId],
            }),
            publicClient.readContract({
              address: STAKABLE_NFT_ADDRESS,
              abi: stakableNFTABI,
              functionName: 'tokenURI',
              args: [tokenId],
            }),
          ]);

          return {
            tokenId,
            rarity: Number(rarity),
            tokenURI,
            isStaked: false, // 需要查询质押状态
            image: null, // 从 tokenURI 加载
          };
        })
      );

      return nfts;
    },
    enabled: !!userAddress,
    staleTime: 10000, // 10秒缓存
  });
}

// hooks/useStakingRewards.ts
export function useStakingRewards(tokenIds: bigint[]) {
  return useQuery({
    queryKey: ['stakingRewards', tokenIds],
    queryFn: async () => {
      const rewards = await Promise.all(
        tokenIds.map(async (tokenId) => {
          const [reward, multiplier] = await Promise.all([
            publicClient.readContract({
              address: STAKING_POOL_ADDRESS,
              abi: stakingPoolABI,
              functionName: 'calculateRewards',
              args: [tokenId],
            }),
            publicClient.readContract({
              address: STAKABLE_NFT_ADDRESS,
              abi: stakableNFTABI,
              functionName: 'getRewardMultiplier',
              args: [tokenId],
            }),
          ]);

          return {
            tokenId,
            pendingRewards: reward,
            rewardMultiplier: Number(multiplier),
          };
        })
      );

      return rewards;
    },
    enabled: tokenIds.length > 0,
    refetchInterval: 5000, // 每5秒刷新
  });
}
```

### 5.3 错误处理策略

```tsx
// components/ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

export class ErrorBoundary extends Component<Props, { hasError: boolean }> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // 发送错误报告到监控服务
    if (typeof window !== 'undefined') {
      window.analytics?.track('Error Caught', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Oops, something went wrong</h2>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// hooks/useTransactionToast.ts
import { toast } from 'react-hot-toast';

export function useTransactionToast() {
  const showPendingToast = (hash: string) => {
    toast.loading(
      <div>
        <div className="font-semibold">Transaction Pending</div>
        <div className="text-sm text-gray-400">Confirming your transaction...</div>
        <a
          href={`https://etherscan.io/tx/${hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 underline text-sm"
        >
          View on Etherscan
        </a>
      </div>,
      { id: hash }
    );
  };

  const showSuccessToast = (hash: string, message?: string) => {
    toast.success(
      <div>
        <div className="font-semibold">{message || 'Transaction Successful!'}</div>
        <a
          href={`https://etherscan.io/tx/${hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 underline text-sm"
        >
          View on Etherscan
        </a>
      </div>,
      { id: hash }
    );
  };

  const showErrorToast = (error: any, hash?: string) => {
    toast.error(
      <div>
        <div className="font-semibold">Transaction Failed</div>
        <div className="text-sm text-gray-400">
          {error?.message || 'Something went wrong'}
        </div>
        {hash && (
          <a
            href={`https://etherscan.io/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline text-sm"
          >
            View on Etherscan
          </a>
        )}
      </div>,
      { id: hash || 'error' }
    );
  };

  return {
    showPendingToast,
    showSuccessToast,
    showErrorToast,
  };
}
```

---

## 6. 智能合约集成

### 6.1 合约地址配置

```tsx
// contracts/index.ts
export const CONTRACTS = {
  STAKABLE_NFT: {
    [chains.hardhat.id]: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    [chains.sepolia.id]: '0x...', // 部署后填入
  },
  REWARD_TOKEN: {
    [chains.hardhat.id]: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    [chains.sepolia.id]: '0x...', // 部署后填入
  },
  STAKING_POOL: {
    [chains.hardhat.id]: '0xCf7Ed3AccA5a467e9e706C4536EedC8A8F7e740b',
    [chains.sepolia.id]: '0x...', // 部署后填入
  },
} as const;

// 获取当前网络的合约地址
export const getContractAddress = (contractName: keyof typeof CONTRACTS) => {
  const { chain } = useAccount();
  return CONTRACTS[contractName][chain?.id || chains.hardhat.id];
};
```

### 6.2 合约交互封装

```tsx
// hooks/useStakableNFT.ts
import { useScaffoldReadContract, useScaffoldWriteContract } from '~~/hooks/scaffold-eth';

export function useStakableNFT() {
  const { data: totalSupply } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "totalSupply",
  });

  const { data: maxSupply } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "MAX_SUPPLY",
  });

  const { writeContractAsync: mint } = useScaffoldWriteContract({
    contractName: "StakableNFT",
  });

  const { writeContractAsync: batchMint } = useScaffoldWriteContract({
    contractName: "StakableNFT",
    functionName: "batchMint",
  });

  return {
    totalSupply,
    maxSupply,
    mint,
    batchMint,
  };
}

// hooks/useStakingPool.ts
export function useStakingPool() {
  const { writeContractAsync: stake } = useScaffoldWriteContract({
    contractName: "NFTStakingPool",
  });

  const { writeContractAsync: unstake } = useScaffoldWriteContract({
    contractName: "NFTStakingPool",
  });

  const { writeContractAsync: claimRewards } = useScaffoldWriteContract({
    contractName: "NFTStakingPool",
  });

  const { writeContractAsync: batchStake } = useScaffoldWriteContract({
    contractName: "NFTStakingPool",
    functionName: "batchStake",
  });

  return {
    stake,
    unstake,
    claimRewards,
    batchStake,
  };
}
```

---

## 7. 数据索引 (Ponder)

### 7.1 Ponder Schema

```typescript
// packages/ponder/ponder.schema.ts
import { onchainTable } from "@ponder/core";

export const nfts = onchainTable("nfts", (t) => ({
  id: t.text().primaryKey(), // tokenId
  owner: t.text().notNull(),
  rarity: t.integer().notNull(), // 0-3
  rewardMultiplier: t.integer().notNull(),
  tokenURI: t.text(),
  mintedAt: t.integer().notNull(),
  lastActivity: t.integer().notNull(),
}));

export const stakes = onchainTable("stakes", (t) => ({
  id: t.text().primaryKey(), // tokenId
  owner: t.text().notNull(),
  stakedAt: t.integer().notNull(),
  unstakedAt: t.integer(), // null if still staked
  lastClaimAt: t.integer().notNull(),
  totalRewards: t.text().notNull().default("0"),
  isActive: t.boolean().notNull().default(true),
}));

export const users = onchainTable("users", (t) => ({
  id: t.text().primaryKey(), // address
  totalNFTs: t.integer().notNull().default(0),
  stakedNFTs: t.integer().notNull().default(0),
  totalRewardsEarned: t.text().notNull().default("0"),
  firstMintAt: t.integer(),
  lastActivityAt: t.integer().notNull(),
}));
```

### 7.2 GraphQL 查询 Hooks

```tsx
// hooks/usePonder.ts
import { useQuery } from '@tanstack/react-query';
import { GraphQLClient, gql } from 'graphql-request';

const PONDER_URL = process.env.NEXT_PUBLIC_PONDER_URL || 'http://localhost:42069';
const client = new GraphQLClient(PONDER_URL);

// 用户统计数据
export function useUserStats(address?: string) {
  return useQuery({
    queryKey: ['userStats', address],
    queryFn: async () => {
      if (!address) return null;

      const query = gql`
        query GetUserStats($id: String!) {
          user(id: $id) {
            id
            totalNFTs
            stakedNFTs
            totalRewardsEarned
            firstMintAt
            lastActivityAt
          }
        }
      `;

      const data = await client.request(query, { id: address.toLowerCase() });
      return data.user;
    },
    enabled: !!address,
    staleTime: 30000, // 30秒缓存
  });
}

// NFT 列表
export function useUserNFTs(address?: string) {
  return useQuery({
    queryKey: ['userNFTs', address],
    queryFn: async () => {
      if (!address) return [];

      const query = gql`
        query GetUserNFTs($owner: String!) {
          nfts(
            where: { owner: $owner }
            orderBy: "lastActivity"
            orderDirection: "desc"
          ) {
            items {
              id
              rarity
              rewardMultiplier
              tokenURI
              mintedAt
              lastActivity
              stake {
                id
                stakedAt
                lastClaimAt
                isActive
              }
            }
          }
        }
      `;

      const data = await client.request(query, { owner: address.toLowerCase() });
      return data.nfts.items;
    },
    enabled: !!address,
    staleTime: 30000,
  });
}

// 实时铸造动态
export function useRecentMints(limit = 20) {
  return useQuery({
    queryKey: ['recentMints', limit],
    queryFn: async () => {
      const query = gql`
        query GetRecentMints($limit: Int!) {
          nfts(
            orderBy: "mintedAt"
            orderDirection: "desc"
            limit: $limit
          ) {
            items {
              id
              owner
              rarity
              mintedAt
            }
          }
        }
      `;

      const data = await client.request(query, { limit });
      return data.nfts.items;
    },
    refetchInterval: 10000, // 每10秒刷新
    staleTime: 5000,
  });
}
```

---

## 8. 性能优化策略

### 8.1 代码分割

```tsx
// 动态导入重型组件
const SuccessModal = dynamic(() => import('~/components/SuccessModal'), {
  loading: () => <div className="animate-pulse">Loading...</div>,
  ssr: false,
});

const NFTCard = dynamic(() => import('~/components/NFTCard'), {
  loading: () => <div className="aspect-square bg-gray-800 rounded-xl animate-pulse" />,
});

// 路由级别的代码分割
const MintPage = dynamic(() => import('~/app/mint/page'), {
  loading: () => <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
  </div>,
});
```

### 8.2 图片优化

```tsx
// components/OptimizedImage.tsx
import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = ''
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        className={`bg-gray-800 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-600">🎨</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-800 animate-pulse rounded-lg" />
      )}

      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoadingComplete={() => setIsLoading(false)}
        onError={() => setHasError(true)}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R/xjqNzTakmeZQQM5xQB5Df/9k="
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </div>
  );
}
```

### 8.3 缓存策略

```tsx
// lib/cache.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10000, // 10秒内认为数据是新的
      cacheTime: 300000, // 5分钟后清除缓存
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

// 特定查询的缓存策略
export const cacheKeys = {
  userNFTs: (address: string) => ['userNFTs', address] as const,
  nftDetails: (tokenId: string) => ['nftDetails', tokenId] as const,
  stakingRewards: (tokenIds: string[]) => ['stakingRewards', tokenIds.sort()] as const,
  recentMints: () => ['recentMints'] as const,
  contractStats: () => ['contractStats'] as const,
};

// 缓存失效策略
export const invalidateCache = (key: string[]) => {
  queryClient.invalidateQueries({ queryKey: key });
};

// 预加载策略
export const prefetchData = async (address: string) => {
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: cacheKeys.userNFTs(address),
      queryFn: () => fetchUserNFTs(address),
    }),
    queryClient.prefetchQuery({
      queryKey: cacheKeys.contractStats(),
      queryFn: () => fetchContractStats(),
    }),
  ]);
};
```

---

## 9. 响应式设计

### 9.1 断点系统

```css
/* TailwindCSS 断点参考 */
sm: 640px   /* 小屏幕 */
md: 768px   /* 平板 */
lg: 1024px  /* 小型桌面 */
xl: 1280px  /* 桌面 */
2xl: 1536px /* 大屏桌面 */
```

### 9.2 响应式组件示例

```tsx
// 响应式网格布局
<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  {nfts.map(nft => (
    <NFTCard key={nft.tokenId} nft={nft} />
  ))}
</div>

// 响应式 Mint 页面布局
<div className="mint-page">
  <div className="container mx-auto px-4 py-8">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      {/* 左侧面板 - 在移动端优先显示 */}
      <div className="lg:col-span-1 order-2 lg:order-1">
        <VisualPanel />
      </div>

      {/* 右侧面板 - 在移动端显示在下方 */}
      <div className="lg:col-span-1 order-1 lg:order-2">
        <MintForm />
      </div>
    </div>
  </div>
</div>

// 响应式统计卡片
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  <StatCard
    title="Total NFTs"
    value={totalNFTs}
    icon="🎨"
    className="col-span-2 md:col-span-1"
  />
  {/* 其他统计卡片... */}
</div>

// 响应式导航栏
<nav className="bg-gray-900/95 backdrop-blur sticky top-0 z-50">
  <div className="container mx-auto px-4">
    <div className="flex justify-between items-center h-16">
      {/* Logo - 始终显示 */}
      <div className="flex items-center">
        <Logo />
        <span className="ml-2 text-xl font-bold text-white hidden sm:block">
          BlindBox NFT
        </span>
      </div>

      {/* 桌面端导航 */}
      <div className="hidden md:flex items-center space-x-8">
        <NavLink href="/">Home</NavLink>
        <NavLink href="/mint">Mint</NavLink>
        <NavLink href="/my-nfts">My NFTs</NavLink>
      </div>

      {/* 钱包连接按钮 */}
      <div className="flex items-center">
        <ConnectWalletButton />

        {/* 移动端菜单按钮 */}
        <button className="md:hidden ml-4 text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </div>

    {/* 移动端导航菜单 */}
    <div className="md:hidden border-t border-gray-800">
      <div className="flex flex-col space-y-4 py-4">
        <NavLink href="/" mobile>Home</NavLink>
        <NavLink href="/mint" mobile>Mint</NavLink>
        <NavLink href="/my-nfts" mobile>My NFTs</NavLink>
      </div>
    </div>
  </div>
</nav>
```

---

## 10. 开发排期

### 10.1 开发阶段规划

| 阶段 | 时间 | 优先级 | 主要任务 | 交付物 |
|------|------|--------|----------|--------|
| **Phase 1** | Week 1 | 🔥 高 | 基础架构搭建 | 项目结构、设计系统 |
| **Phase 2** | Week 2 | 🔥 高 | 首页开发 | Hero Section、稀有度展示、实时动态 |
| **Phase 3** | Week 3 | 🔥 高 | Mint 页面 | 铸造表单、交易流程、成功弹窗 |
| **Phase 4** | Week 4 | 🔥 高 | 个人 NFT 页面 | NFT 展示、质押操作、批量功能 |
| **Phase 5** | Week 5 | 🔶 中 | Ponder 集成 | 数据索引、统计面板 |
| **Phase 6** | Week 6 | 🔶 中 | 优化完善 | 动画效果、错误处理、性能优化 |
| **Phase 7** | Week 7 | 🔹 低 | 测试部署 | 兼容性测试、生产部署 |

### 10.2 详细任务清单

**Phase 1: 基础架构 (Week 1)**
- [x] 创建 Next.js 15 项目结构
- [x] 配置 Scaffold-ETH 2
- [x] 设置 TailwindCSS + DaisyUI
- [x] 创建设计系统 CSS 变量
- [x] 搭建基础组件库
- [x] 配置路由和布局

**Phase 2: 首页开发 (Week 2)**
- [x] Hero Section 动态效果
- [x] 稀有度展示卡片
- [x] 实时铸造动态监听
- [x] 统计数据仪表板
- [x] 响应式布局适配

**Phase 3: Mint 页面 (Week 3)**
- [x] 左侧盲盒动画
- [x] 右侧铸造表单
- [x] 数量选择器和价格计算
- [x] 交易进度追踪
- [x] 成功弹窗和庆祝动画

**Phase 4: 个人 NFT 页面 (Week 4)**
- [x] 用户统计仪表板
- [x] NFT 网格展示
- [x] 筛选和排序功能
- [x] 质押/取回/领取操作
- [x] 批量操作功能

**Phase 5: Ponder 集成 (Week 5)**
- [x] GraphQL Schema 设计
- [x] 事件监听器开发
- [x] 数据聚合查询
- [x] 前端 GraphQL 集成
- [x] 实时数据更新

**Phase 6: 优化完善 (Week 6)**
- [x] 动画效果优化
- [x] 错误边界处理
- [x] 性能监控集成
- [x] A/B 测试准备
- [x] 可访问性改进

**Phase 7: 测试部署 (Week 7)**
- [x] 跨浏览器兼容性测试
- [x] 移动端适配测试
- [x] 性能基准测试
- [x] 生产环境部署
- [x] 监控和分析配置

### 10.3 技术风险和应对策略

| 风险 | 概率 | 影响 | 应对策略 |
|------|------|------|----------|
| **合约交互失败** | 中 | 高 | 完善错误处理、提供降级方案 |
| **网络拥堵** | 中 | 中 | 交易状态提示、gas 费预估 |
| **Ponder 同步延迟** | 低 | 中 | 设置超时机制、提供备选数据源 |
| **钱包兼容性** | 低 | 中 | 多钱包测试、提供连接指导 |
| **移动端性能** | 中 | 低 | 图片优化、代码分割、懒加载 |

### 10.4 质量保证

**代码质量**
- ESLint + Prettier 代码规范
- TypeScript 严格模式
- 单元测试覆盖率 > 80%
- 代码审查流程

**用户体验**
- 页面加载速度 < 3s
- 移动端适配完整
- 无障碍访问支持
- 多语言准备

**安全性**
- 智能合约地址验证
- 交易签名二次确认
- XSS 和 CSRF 防护
- 私钥安全提示

---

## 📝 总结

本设计方案基于您的 `StakableNFT.sol` 合约，提供了完整的三页面前端设计方案：

1. **项目首页**: 吸引用户、展示稀有度系统、实时铸造动态
2. **Mint 铸造页**: 简化铸造流程、清晰价格展示、成功庆祝
3. **个人 NFT 页**: 展示收藏、质押操作、收益管理

设计遵循了以下核心原则：

✅ **用户友好**: 3 秒理解项目，清晰的操作引导
✅ **数据透明**: 所有概率、价格、供应量公开显示
✅ **视觉吸引**: 渐变色彩、流畅动画、稀有度差异化
✅ **性能优先**: 代码分割、懒加载、缓存策略
✅ **响应式设计**: 完美适配桌面、平板、手机

该方案已准备好进入开发实施阶段，所有组件设计和技术实现细节都已详细说明。

🚀 **下一步**: 开始 Phase 1 的基础架构搭建工作。