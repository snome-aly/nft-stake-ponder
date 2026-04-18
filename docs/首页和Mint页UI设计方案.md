# 首页和 Mint 页 UI 设计方案

本文档详细说明 StakableNFT 盲盒项目的首页和 Mint 页面的 UI/UX 设计思路、设计理由及技术实现要点。

---

## 📋 目录

- [1. 设计目标](#1-设计目标)
- [2. 首页设计](#2-首页设计)
- [3. Mint 页面设计](#3-mint-页面设计)
- [4. 设计系统](#4-设计系统)
- [5. 技术实现](#5-技术实现)
- [6. 转化率优化](#6-转化率优化)
- [7. 实施计划](#7-实施计划)

---

## 1. 设计目标

### 1.1 首页目标

**用户旅程：** 吸引 → 教育 → 信任 → 行动

| 目标 | 实现方式 | 成功指标 |
|------|---------|---------|
| **吸引新用户** | Hero Section + 动画 | 跳出率 < 60% |
| **教育用户** | 稀有度系统展示 | 页面停留时间 > 30s |
| **建立信任** | 实时数据 + 链上证明 | 社交分享率 > 5% |
| **引导铸造** | 清晰的 CTA 按钮 | 点击率 > 15% |

---

### 1.2 Mint 页面目标

**用户旅程：** 刺激 → 简化 → 反馈 → 庆祝

| 目标 | 实现方式 | 成功指标 |
|------|---------|---------|
| **刺激购买欲** | 盲盒动画 + 实时动态 | 加购率 > 40% |
| **简化流程** | 一键铸造 | 完成率 > 80% |
| **清晰反馈** | 4 步进度条 | 中途退出率 < 5% |
| **激励复购** | 成功弹窗 + 分享 | 复购率 > 20% |

---

## 2. 首页设计

### 2.1 整体结构（5 个区域）

```
┌─────────────────────────────────────┐
│  1. Hero Section                    │  吸引注意
├─────────────────────────────────────┤
│  2. Rarity System                   │  教育用户
├─────────────────────────────────────┤
│  3. Live Mint Feed                  │  社交证明
├─────────────────────────────────────┤
│  4. How It Works                    │  降低门槛
├─────────────────────────────────────┤
│  5. Stats Dashboard                 │  建立信任
└─────────────────────────────────────┘
```

---

### 2.2 区域 1: Hero Section（英雄区）

#### 布局设计

```
┌────────────────────────────────────────┐
│   Header (Logo + Connect Wallet)       │
├────────────────────────────────────────┤
│                                        │
│     🎁 Your Mystical NFT Collection    │
│                                        │
│   Mint a blind box and discover your  │
│   rarity: Common, Rare, Epic, or      │
│   Legendary!                           │
│                                        │
│   [Mint Now] [View Gallery]           │
│                                        │
│   Progress: [████████░░] 1,234/10,000 │
│   Floor Price: 0.01 ETH (~$25.50)     │
│                                        │
└────────────────────────────────────────┘
```

#### 关键元素

1. **大标题**
   - 文案：简洁有力，突出"盲盒"和"稀有度"
   - 字体：大号粗体（48-64px）
   - 颜色：渐变色（紫色→金色）

2. **副标题**
   - 一句话说明核心玩法
   - 突出 4 种稀有度
   - 字体：中号（18-24px）

3. **主 CTA 按钮**
   - 文案："Mint Now" 🎲
   - 尺寸：大（180×60px）
   - 颜色：高对比度（紫色/橙色）
   - 动效：悬停时放大、发光

4. **次要 CTA**
   - 文案："View Gallery"
   - 样式：边框按钮（outline）
   - 引导用户探索已铸造的 NFT

5. **进度条**
   - 显示：已铸造 / 总供应量
   - 视觉：渐变填充（蓝→紫→金）
   - 效果：营造稀缺感和 FOMO

6. **实时数据**
   - Floor Price（最低价格）
   - USD 换算（降低认知负担）
   - 自动更新（每 10 秒）

#### 设计理由

✅ **3 秒规则**
- 用户 3 秒内明白项目是什么
- 清晰的价值主张（Value Proposition）

✅ **FOMO 效应**
- 进度条制造紧迫感
- "Only X left" 提示

✅ **视觉焦点**
- CTA 按钮使用对比色
- Z 型视觉流：标题 → 描述 → 按钮

✅ **降低门槛**
- 显示 USD 价格
- 明确告知铸造流程

---

### 2.3 区域 2: Rarity System（稀有度系统）

#### 布局设计

```
┌──────────────────────────────────────────┐
│         🎲 Rarity Distribution           │
├──────────┬──────────┬──────────┬─────────┤
│ Common   │ Rare     │ Epic     │Legendary│
│ 50%      │ 30%      │ 15%      │ 5%      │
│          │          │          │         │
│  [Icon]  │  [Icon]  │  [Icon]  │ [Icon]  │
│  灰色     │  蓝色     │  紫色     │  金色   │
│          │          │          │         │
│ Floor:   │ Floor:   │ Floor:   │ Floor:  │
│ 0.01 ETH │ 0.05 ETH │ 0.2 ETH  │ 1.0 ETH │
│ ~$25     │ ~$127    │ ~$510    │ ~$2550  │
└──────────┴──────────┴──────────┴─────────┘
```

#### 关键元素

1. **4 个卡片**
   - 每个卡片代表一种稀有度
   - 卡片背景：渐变色（对应稀有度）
   - 悬停效果：放大 + 发光

2. **稀有度图标**
   - Common: 灰色宝石
   - Rare: 蓝色宝石
   - Epic: 紫色宝石（发光）
   - Legendary: 金色宝石（强烈发光 + 粒子特效）

3. **概率显示**
   - 大号百分比（32px）
   - 进度条可视化

4. **Floor Price**
   - ETH + USD 双显示
   - 从 Ponder 或链上读取（如果有二级市场）
   - 如无二级市场，显示预估价值

#### 设计理由

✅ **透明度**
- 公开概率建立信任
- 符合 Web3 去中心化精神
- 避免"开盲盒诈骗"嫌疑

✅ **价值锚定**
- Legendary 的高价格（1 ETH）
- 衬托其他稀有度"很划算"
- 心理学：对比效应

✅ **游戏化**
- 概率展示激发"赌一把"心理
- 彩票效应：小成本，高回报预期

✅ **视觉吸引**
- 渐变色和发光效果
- 增强稀有度的价值感知

---

### 2.4 区域 3: Live Mint Feed（实时铸造动态）

#### 布局设计

```
┌──────────────────────────────────────────┐
│     🔥 Recent Mints (Live Updates)       │
├──────────────────────────────────────────┤
│ 🟡 0x1234...5678 minted [Legendary] #123│
│    2 minutes ago                         │
├──────────────────────────────────────────┤
│ 🟣 0xabcd...ef01 minted [Epic] #124     │
│    5 minutes ago                         │
├──────────────────────────────────────────┤
│ 🔵 0x9876...5432 minted [Rare] #125     │
│    8 minutes ago                         │
├──────────────────────────────────────────┤
│ ⚪ 0x1111...2222 minted [Common] #126   │
│    10 minutes ago                        │
└──────────────────────────────────────────┘
```

#### 关键元素

1. **实时滚动列表**
   - 使用 `useScaffoldWatchContractEvent` 监听 `NFTMinted` 事件
   - 新事件从顶部插入
   - 保留最近 10-20 条记录
   - 自动滚动动画

2. **地址显示**
   - 使用 SE-2 的 `<Address>` 组件
   - 自动 ENS 解析（如 vitalik.eth）
   - 默认显示简短格式（0x1234...5678）
   - 点击复制地址

3. **稀有度高亮**
   - Common: 灰色
   - Rare: 蓝色
   - Epic: 紫色
   - Legendary: 金色 + 闪烁动画

4. **时间戳**
   - 相对时间："2 minutes ago"
   - 使用 `date-fns` 库格式化

5. **特殊效果**
   - Legendary 铸造时：
     - 全屏金色闪光特效
     - 音效（可选）
     - 弹窗庆祝

#### 设计理由

✅ **社交证明（Social Proof）**
- 展示其他人正在铸造
- 营造活跃氛围
- 心理学：从众效应

✅ **FOMO 放大**
- 看到 Legendary 被铸造
- 激发用户"下一个就是我"的心理
- 实时性增强紧迫感

✅ **透明度**
- 实时链上数据，不可伪造
- 增强项目可信度
- 区块链的核心价值展示

✅ **互动性**
- 动态内容增加页面活力
- 用户会停留更久观察

---

### 2.5 区域 4: How It Works（使用说明）

#### 布局设计

```
┌──────────────────────────────────────────┐
│           🎯 How It Works                │
├──────────┬──────────┬──────────┬─────────┤
│  Step 1  │  Step 2  │  Step 3  │ Step 4  │
│    🔗    │    🎁    │    🎲    │   💎    │
│ Connect  │   Mint   │  Reveal  │  Stake  │
│  Wallet  │Blind Box │  Rarity  │ & Earn  │
│          │          │          │         │
│ Connect  │ Pay 0.01 │ Discover │ Stake   │
│  your    │ ETH per  │ if you   │ to earn │
│ MetaMask │   NFT    │ got a    │ rewards │
│          │          │Legendary │         │
└──────────┴──────────┴──────────┴─────────┘
```

#### 关键元素

1. **4 步流程**
   - 每步一个卡片
   - 数字标号（1、2、3、4）
   - 箭头连接表示流程

2. **图标 + 文字**
   - 大图标（64×64px）
   - 简短标题（2-3 个词）
   - 详细说明（1-2 句话）

3. **视觉引导**
   - 左→右的阅读顺序
   - 使用渐变连接线
   - 当前步骤高亮

#### 设计理由

✅ **降低门槛**
- Web3 新手需要清晰指引
- 减少"不知道怎么开始"的困惑

✅ **突出特色**
- 强调"盲盒"机制
- 提及"质押"功能（增加长期价值）

✅ **预期管理**
- 明确告知：铸造后才知道稀有度
- 避免用户误解

✅ **增强信心**
- 流程简单（只需 4 步）
- 可视化降低认知负担

---

### 2.6 区域 5: Stats Dashboard（数据仪表板）

#### 布局设计

```
┌──────────────────────────────────────────┐
│            📊 Collection Stats           │
├──────────┬──────────┬──────────┬─────────┤
│  Total   │  Floor   │  24h Vol │ Holders │
│  Minted  │  Price   │          │         │
│          │          │          │         │
│  1,234   │ 0.01 ETH │  12 ETH  │   456   │
│ /10,000  │  ~$25.50 │  ~$30.6K │  users  │
│  12.3%   │          │          │         │
└──────────┴──────────┴──────────┴─────────┘
```

#### 关键元素

1. **总供应量（Total Minted）**
   - 已铸造数量 / 总供应量
   - 百分比进度
   - 来源：`totalSupply()` 合约调用

2. **Floor Price（地板价）**
   - 最低挂单价格
   - ETH + USD 双显示
   - 如无二级市场，显示铸造价格（0.01 ETH）

3. **24h Volume（24小时交易量）**
   - 如有二级市场，从 Ponder 查询
   - 如无，可隐藏或显示"Coming Soon"

4. **Holders（持有者数量）**
   - 唯一持有者地址数
   - 从 Ponder GraphQL 查询：
     ```graphql
     query {
       transfers {
         to
       }
     }
     ```
   - 去重统计

#### 设计理由

✅ **建立信任**
- 透明的链上数据
- 实时更新（无法篡改）

✅ **投资参考**
- Floor Price 帮助用户判断价值
- 24h Volume 反映市场热度

✅ **社区展示**
- Holders 数量体现社区规模
- 数字越大越有说服力

✅ **数据可视化**
- 大号数字（突出重点）
- 辅助文字（提供上下文）

---

## 3. Mint 页面设计

### 3.1 整体布局（左右分栏）

```
┌──────────────────────┬──────────────────────┐
│   Left Panel         │   Right Panel        │
│   (视觉刺激)          │   (铸造表单)          │
│                      │                      │
│       🎁             │   Mint Your NFT      │
│   Mystery Box        │                      │
│   (3D 动画)          │   Quantity: [1] ▼    │
│                      │                      │
│   What's inside?     │   Unit Price:        │
│                      │   0.01 ETH (~$25.50) │
│   Rarity Chances:    │                      │
│   • 50% Common       │   Discount: -0%      │
│   • 30% Rare         │   ─────────────────  │
│   • 15% Epic         │   Total: 0.01 ETH    │
│   • 5% Legendary     │                      │
│                      │   Your Balance:      │
│   Recent Mints:      │   1.25 ETH ✅        │
│   🟡 Lucky user got  │                      │
│      [Legendary]!    │   [Mint Now 🎲]      │
│   🟣 [Epic] #124     │                      │
│   🔵 [Rare] #125     │   Status:            │
│                      │   ⏳ Waiting...      │
└──────────────────────┴──────────────────────┘
```

#### 响应式布局

- **桌面端（>1024px）**：左右分栏（50%-50%）
- **平板端（768-1024px）**：左右分栏（40%-60%）
- **移动端（<768px）**：上下布局（盲盒在上，表单在下）

---

### 3.2 左侧面板：视觉刺激

#### 核心元素

1. **3D 盲盒动画**
   - 3D 模型或 Lottie 动画
   - 悬浮旋转效果（CSS `@keyframes`）
   - 鼠标悬停时：
     - 放大 1.1 倍
     - 增强发光效果
     - 金色粒子飘散

2. **稀有度概率展示**
   - 4 个彩色进度条
   - 对应颜色：灰、蓝、紫、金
   - 动态填充动画

3. **实时铸造动态**
   - 显示最近 3-5 条记录
   - Legendary 铸造时：
     - 条目闪烁金色
     - 可选：音效提示
   - 每条记录显示：
     - 稀有度图标
     - Token ID
     - 相对时间

#### 技术实现

```typescript
// 3D 盲盒动画（使用 Lottie）
import Lottie from "react-lottie-player";
import mysteryBoxAnimation from "~/public/animations/mystery-box.json";

<Lottie
  loop
  animationData={mysteryBoxAnimation}
  play
  style={{ width: 300, height: 300 }}
/>
```

```typescript
// 实时监听铸造事件
import { useScaffoldWatchContractEvent } from "~~/hooks/scaffold-eth";

const [recentMints, setRecentMints] = useState<any[]>([]);

useScaffoldWatchContractEvent({
  contractName: "StakableNFT",
  eventName: "NFTMinted",
  onLogs: (logs) => {
    setRecentMints(prev => [...logs, ...prev].slice(0, 5));

    // 如果是 Legendary，触发特效
    logs.forEach(log => {
      if (log.args.rarity === 3) { // Legendary
        triggerLegendaryEffect();
      }
    });
  },
});
```

#### 设计理由

✅ **视觉吸引力**
- 动画增加页面趣味性
- 降低等待时的焦虑感

✅ **期待感**
- 盲盒视觉强化"未知"的刺激
- "薛定谔的 Legendary"

✅ **社交证明**
- 看到别人铸造成功
- FOMO 效应放大

---

### 3.3 右侧面板：铸造表单

#### 组件 1: 数量选择器（Quantity Selector）

```
┌─────────────────────────────────┐
│ Quantity                        │
│                                 │
│ ┌──────────────────────────┐   │
│ │  1 NFT               ▼   │   │
│ └──────────────────────────┘   │
│                                 │
│ Options:                        │
│ • 1 NFT - 0.01 ETH              │
│ • 5 NFTs - 0.0475 ETH (Save 5%) │
│ • 10 NFTs - 0.09 ETH (Save 10%) │
└─────────────────────────────────┘
```

**关键特性：**
- 下拉菜单或按钮组
- 批量购买有折扣提示
- 实时计算总价

**设计理由：**
✅ 批量激励：多买有折扣，提高客单价
✅ 价格锚定：先看到 10 个的价格，1 个显得便宜

---

#### 组件 2: 价格展示（Price Display）

```
┌─────────────────────────────────┐
│ Price Breakdown                 │
├─────────────────────────────────┤
│ Unit Price:    0.01 ETH         │
│                ~$25.50           │
│                                 │
│ Quantity:      × 5              │
│                                 │
│ Discount:      -5%              │
│                -0.0025 ETH      │
│ ─────────────────────────────── │
│ Total:         0.0475 ETH       │
│                ~$121.13         │
└─────────────────────────────────┘
```

**关键特性：**
1. **ETH + USD 双显示**
   - 使用全局 ETH 价格（从 CoinGecko API 或 Chainlink Price Feed）
   - 实时转换

2. **折扣高亮**
   - 绿色显示节省金额
   - 心理学：强化"划算"感

3. **计算透明**
   - 逐项列出（单价、数量、折扣）
   - 避免用户困惑

**技术实现：**

```typescript
const UNIT_PRICE = parseEther("0.01");

const calculateTotal = (quantity: number): bigint => {
  const subtotal = UNIT_PRICE * BigInt(quantity);

  // 批量折扣
  let discount = 0n;
  if (quantity >= 10) {
    discount = subtotal * 10n / 100n; // 10% off
  } else if (quantity >= 5) {
    discount = subtotal * 5n / 100n;  // 5% off
  }

  return subtotal - discount;
};
```

**设计理由：**
✅ **价格透明**：避免用户质疑
✅ **USD 参考**：Web3 新手不熟悉 ETH 价值
✅ **折扣可视化**：强化"多买省钱"

---

#### 组件 3: 余额检查（Wallet Check）

```
// 场景 1: 余额充足
┌─────────────────────────────────┐
│ Your Balance                    │
├─────────────────────────────────┤
│ ✅ 1.25 ETH (~$3,187.50)        │
│ ✅ Sufficient funds             │
└─────────────────────────────────┘

// 场景 2: 余额不足
┌─────────────────────────────────┐
│ Your Balance                    │
├─────────────────────────────────┤
│ ❌ 0.005 ETH (~$12.75)          │
│ ⚠️ Need 0.0475 ETH to mint      │
│                                 │
│ [Get ETH from Faucet]           │
└─────────────────────────────────┘
```

**关键特性：**
1. **前置验证**
   - 读取用户余额：`useBalance({ address })`
   - 比较总价 vs 余额
   - 禁用按钮（余额不足时）

2. **引导充值**
   - 链接到水龙头（测试网）
   - 链接到交易所（主网）

3. **色彩语义**
   - 绿色 = 成功
   - 红色 = 错误
   - 黄色 = 警告

**技术实现：**

```typescript
import { useBalance } from "wagmi";

const { data: balance } = useBalance({ address });
const total = calculateTotal(quantity);

const isSufficient = balance && balance.value >= total;
```

**设计理由：**
✅ **避免交易失败**：前置检查节省 gas
✅ **用户体验**：提前告知问题
✅ **引导行动**：提供解决方案

---

#### 组件 4: 铸造按钮（Mint Button）

**状态机设计：**

```typescript
type MintStatus =
  | "disconnected"     // 未连接钱包
  | "wrong-network"    // 网络错误
  | "insufficient"     // 余额不足
  | "ready"            // 准备就绪
  | "approving"        // 等待用户批准
  | "minting"          // 交易发送中
  | "confirming"       // 等待确认
  | "success"          // 成功
  | "error";           // 错误
```

**各状态的按钮样式：**

```tsx
// 1. 未连接钱包
<button disabled className="btn-disabled">
  Connect Wallet First
</button>

// 2. 网络错误
<button
  onClick={switchToHardhat}
  className="btn-error"
>
  ⚠️ Wrong Network (Click to Switch)
</button>

// 3. 余额不足
<button disabled className="btn-disabled">
  ❌ Insufficient Balance
</button>

// 4. 准备就绪
<button
  onClick={handleMint}
  className="btn-primary btn-lg"
>
  Mint Now 🎲
</button>

// 5. 等待批准
<button disabled className="btn-loading">
  <Spinner /> Approve in wallet...
</button>

// 6. 交易发送中
<button disabled className="btn-loading">
  <Spinner /> Minting...
</button>

// 7. 等待确认
<button disabled className="btn-loading">
  <Spinner /> Confirming... (12s)
</button>
```

**设计理由：**
✅ **状态清晰**：每个阶段都有明确反馈
✅ **防误操作**：loading 状态禁用按钮
✅ **预估时间**：显示预计等待时间

---

#### 组件 5: 交易进度（Transaction Progress）

```
┌─────────────────────────────────────┐
│  Transaction Progress               │
├─────────────────────────────────────┤
│  ✅ 1. Approve in Wallet            │
│  ⏳ 2. Sending Transaction (5s)     │
│  ⏸️ 3. Waiting Confirmation         │
│  ⏸️ 4. Revealing Rarity             │
└─────────────────────────────────────┘
```

**4 步进度：**

1. **用户批准**
   - 等待用户在钱包点击"确认"
   - 状态：`isPending`

2. **发送交易**
   - 交易广播到网络
   - 返回交易哈希
   - 显示 Etherscan 链接

3. **等待确认**
   - 等待区块确认
   - 显示倒计时（预估 12-15 秒）
   - 使用 `useWaitForTransactionReceipt`

4. **揭示稀有度**
   - 读取 `tokenURI()` 或链上稀有度
   - 显示 NFT 图片和稀有度
   - 触发成功动画

**技术实现：**

```typescript
const [step, setStep] = useState(0);
const [txHash, setTxHash] = useState<Hash>();

const { writeContractAsync } = useScaffoldWriteContract({
  contractName: "StakableNFT",
});

const { isLoading, isSuccess } = useWaitForTransactionReceipt({
  hash: txHash,
});

const handleMint = async () => {
  try {
    setStep(1); // Approve in Wallet

    const hash = await writeContractAsync({
      functionName: "mint",
      args: [BigInt(quantity)],
      value: calculateTotal(quantity),
    });

    setStep(2); // Sending Transaction
    setTxHash(hash);
    setStep(3); // Waiting Confirmation
  } catch (error) {
    // Error handling
  }
};

useEffect(() => {
  if (isSuccess) {
    setStep(4); // Revealing Rarity
    fetchNFTMetadata();
  }
}, [isSuccess]);
```

**设计理由：**
✅ **降低焦虑**：用户知道进度
✅ **教育作用**：理解 Web3 交易流程
✅ **防止误操作**：告知不要关闭页面

---

#### 组件 6: 成功弹窗（Success Modal）

```
┌─────────────────────────────────────┐
│         🎉 Mint Successful!         │
├─────────────────────────────────────┤
│                                     │
│      [NFT Image Placeholder]        │
│                                     │
│      You minted a [Epic] NFT!       │
│      Token ID: #1234                │
│      Rarity: Epic (15% chance)      │
│                                     │
│  [View on Explorer]  [Mint More]   │
│  [View My Collection]               │
│                                     │
│  Share your luck on Twitter:        │
│  "I just minted an Epic NFT! 🎁"    │
│  [Tweet 🐦]                         │
└─────────────────────────────────────┘
```

**关键元素：**

1. **庆祝动画**
   - 五彩纸屑特效（confetti.js）
   - Legendary: 金色烟花
   - Epic: 紫色闪光
   - Rare: 蓝色涟漪
   - Common: 简单闪烁

2. **NFT 预览**
   - 显示图片（从 IPFS/Arweave 加载）
   - 如图片未就绪，显示占位符

3. **稀有度信息**
   - 大号文字显示稀有度
   - 对应颜色高亮
   - 显示概率（"You were lucky!"）

4. **3 个 CTA 按钮**
   - **View on Explorer**：链接到区块链浏览器
   - **Mint More**：关闭弹窗，继续铸造
   - **View My Collection**：跳转到"我的收藏"页面

5. **社交分享**
   - 预填充推文内容
   - 包含项目标签和链接
   - 一键发推（打开 Twitter intent URL）

**技术实现：**

```typescript
import confetti from "canvas-confetti";

const triggerSuccessAnimation = (rarity: number) => {
  if (rarity === 3) { // Legendary
    confetti({
      particleCount: 200,
      spread: 100,
      colors: ['#FFD700', '#FFA500'],
    });
  } else if (rarity === 2) { // Epic
    confetti({
      particleCount: 100,
      spread: 70,
      colors: ['#A855F7', '#C084FC'],
    });
  }
  // ... 其他稀有度
};

const shareOnTwitter = (tokenId: number, rarity: string) => {
  const text = encodeURIComponent(
    `I just minted a ${rarity} NFT #${tokenId}! 🎁\n\n@YourProject #NFT #Web3`
  );
  const url = `https://twitter.com/intent/tweet?text=${text}`;
  window.open(url, '_blank');
};
```

**设计理由：**
✅ **正向反馈**：成功体验激励复购
✅ **引导深度使用**：查看收藏 → 探索质押
✅ **病毒传播**：社交分享带来新用户
✅ **降低后悔**：立即显示价值，避免买家悔恨

---

## 4. 设计系统

### 4.1 配色方案

#### 稀有度颜色

```css
:root {
  /* 稀有度主题色 */
  --color-common: #9CA3AF;      /* 灰色 */
  --color-rare: #3B82F6;        /* 蓝色 */
  --color-epic: #A855F7;        /* 紫色 */
  --color-legendary: #F59E0B;   /* 金色 */

  /* 稀有度渐变 */
  --gradient-common: linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%);
  --gradient-rare: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
  --gradient-epic: linear-gradient(135deg, #A855F7 0%, #9333EA 100%);
  --gradient-legendary: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
}
```

#### 功能颜色

```css
:root {
  /* 主题色 */
  --color-primary: #8B5CF6;     /* 紫色（主按钮） */
  --color-secondary: #EC4899;   /* 粉色（次要按钮） */

  /* 状态颜色 */
  --color-success: #10B981;     /* 绿色（成功） */
  --color-warning: #F59E0B;     /* 橙色（警告） */
  --color-error: #EF4444;       /* 红色（错误） */
  --color-info: #3B82F6;        /* 蓝色（信息） */

  /* 背景 */
  --bg-primary: #0F172A;        /* 深蓝黑（主背景） */
  --bg-secondary: #1E293B;      /* 深灰蓝（卡片背景） */
  --bg-tertiary: #334155;       /* 中灰（输入框背景） */

  /* 文字 */
  --text-primary: #F8FAFC;      /* 白色（主文字） */
  --text-secondary: #CBD5E1;    /* 浅灰（次要文字） */
  --text-tertiary: #94A3B8;     /* 中灰（辅助文字） */

  /* 边框 */
  --border-color: #334155;      /* 边框颜色 */

  /* 阴影 */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);

  /* 发光效果 */
  --glow-rare: 0 0 20px rgba(59, 130, 246, 0.5);
  --glow-epic: 0 0 30px rgba(168, 85, 247, 0.6);
  --glow-legendary: 0 0 40px rgba(245, 158, 11, 0.8);
}
```

---

### 4.2 字体系统

```css
:root {
  /* 字体族 */
  --font-sans: 'Inter', 'Helvetica Neue', Arial, sans-serif;
  --font-mono: 'Fira Code', 'Courier New', monospace;

  /* 字体大小 */
  --text-xs: 0.75rem;      /* 12px */
  --text-sm: 0.875rem;     /* 14px */
  --text-base: 1rem;       /* 16px */
  --text-lg: 1.125rem;     /* 18px */
  --text-xl: 1.25rem;      /* 20px */
  --text-2xl: 1.5rem;      /* 24px */
  --text-3xl: 1.875rem;    /* 30px */
  --text-4xl: 2.25rem;     /* 36px */
  --text-5xl: 3rem;        /* 48px */
  --text-6xl: 3.75rem;     /* 60px */

  /* 字重 */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  --font-extrabold: 800;
}
```

---

### 4.3 间距系统

```css
:root {
  /* 间距 */
  --space-1: 0.25rem;    /* 4px */
  --space-2: 0.5rem;     /* 8px */
  --space-3: 0.75rem;    /* 12px */
  --space-4: 1rem;       /* 16px */
  --space-5: 1.25rem;    /* 20px */
  --space-6: 1.5rem;     /* 24px */
  --space-8: 2rem;       /* 32px */
  --space-10: 2.5rem;    /* 40px */
  --space-12: 3rem;      /* 48px */
  --space-16: 4rem;      /* 64px */
  --space-20: 5rem;      /* 80px */

  /* 容器宽度 */
  --container-sm: 640px;
  --container-md: 768px;
  --container-lg: 1024px;
  --container-xl: 1280px;
  --container-2xl: 1536px;
}
```

---

### 4.4 动画系统

```css
/* 动画时长 */
:root {
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
}

/* 缓动函数 */
:root {
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

/* 常用动画 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes glow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(139, 92, 246, 0.4);
  }
  50% {
    box-shadow: 0 0 40px rgba(139, 92, 246, 0.8);
  }
}
```

---

### 4.5 组件样式示例

#### 按钮样式

```css
/* 主按钮 */
.btn-primary {
  background: var(--gradient-primary);
  color: var(--text-primary);
  padding: var(--space-3) var(--space-6);
  border-radius: 0.5rem;
  font-weight: var(--font-semibold);
  transition: all var(--duration-normal) var(--ease-out);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg), var(--glow-epic);
}

.btn-primary:active {
  transform: translateY(0);
}

/* 加载按钮 */
.btn-loading {
  position: relative;
  pointer-events: none;
  opacity: 0.7;
}

.btn-loading::before {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
```

#### 卡片样式

```css
.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  padding: var(--space-6);
  box-shadow: var(--shadow-md);
  transition: all var(--duration-normal) var(--ease-out);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
}

/* 稀有度卡片 */
.card-legendary {
  background: var(--gradient-legendary);
  border-color: var(--color-legendary);
  box-shadow: var(--shadow-lg), var(--glow-legendary);
  animation: glow 2s ease-in-out infinite;
}
```

---

## 5. 技术实现

### 5.1 首页核心代码

```typescript
// app/page.tsx
"use client";

import { useState } from "react";
import { useScaffoldReadContract, useScaffoldWatchContractEvent } from "~~/hooks/scaffold-eth";
import { Address } from "~~/components/scaffold-eth";
import { formatEther } from "viem";

export default function HomePage() {
  // 1. 读取总供应量
  const { data: totalSupply } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "totalSupply",
  });

  // 2. 读取最大供应量
  const { data: maxSupply } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "MAX_SUPPLY",
  });

  // 3. 实时监听铸造事件
  const [recentMints, setRecentMints] = useState<any[]>([]);

  useScaffoldWatchContractEvent({
    contractName: "StakableNFT",
    eventName: "NFTMinted",
    onLogs: (logs) => {
      setRecentMints(prev => [...logs, ...prev].slice(0, 10));
    },
  });

  // 4. 计算进度百分比
  const progress = totalSupply && maxSupply
    ? Number((totalSupply * 100n) / maxSupply)
    : 0;

  return (
    <div className="container mx-auto px-4">
      {/* Hero Section */}
      <section className="hero-section">
        <h1 className="text-6xl font-bold gradient-text">
          🎁 Your Mystical NFT Collection
        </h1>
        <p className="text-xl text-secondary mt-4">
          Mint a blind box and discover your rarity: Common, Rare, Epic, or Legendary!
        </p>

        <div className="cta-buttons mt-8">
          <button className="btn-primary btn-lg">
            Mint Now 🎲
          </button>
          <button className="btn-secondary btn-lg">
            View Gallery
          </button>
        </div>

        {/* 进度条 */}
        <div className="progress-bar mt-8">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
          <span className="progress-text">
            {totalSupply?.toString()} / {maxSupply?.toString()}
          </span>
        </div>

        <div className="stats mt-4">
          <span>Floor Price: 0.01 ETH (~$25.50)</span>
        </div>
      </section>

      {/* Rarity System */}
      <section className="rarity-section mt-20">
        <h2 className="text-4xl font-bold text-center">🎲 Rarity Distribution</h2>
        <div className="rarity-grid mt-8">
          <RarityCard
            name="Common"
            percentage={50}
            color="gray"
            floorPrice="0.01"
          />
          <RarityCard
            name="Rare"
            percentage={30}
            color="blue"
            floorPrice="0.05"
          />
          <RarityCard
            name="Epic"
            percentage={15}
            color="purple"
            floorPrice="0.2"
          />
          <RarityCard
            name="Legendary"
            percentage={5}
            color="gold"
            floorPrice="1.0"
          />
        </div>
      </section>

      {/* Live Mint Feed */}
      <section className="live-feed-section mt-20">
        <h2 className="text-4xl font-bold text-center">🔥 Recent Mints</h2>
        <div className="mint-feed mt-8">
          {recentMints.map((mint, idx) => (
            <div key={idx} className="mint-item">
              <Address address={mint.args.to} />
              <span>minted</span>
              <span className={`rarity-${mint.args.rarity}`}>
                [{getRarityName(mint.args.rarity)}]
              </span>
              <span>NFT #{mint.args.tokenId.toString()}</span>
              <span className="time">{getRelativeTime(mint.blockNumber)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works-section mt-20">
        <h2 className="text-4xl font-bold text-center">🎯 How It Works</h2>
        <div className="steps-grid mt-8">
          <StepCard number={1} icon="🔗" title="Connect Wallet" />
          <StepCard number={2} icon="🎁" title="Mint Blind Box" />
          <StepCard number={3} icon="🎲" title="Reveal Rarity" />
          <StepCard number={4} icon="💎" title="Stake & Earn" />
        </div>
      </section>

      {/* Stats Dashboard */}
      <section className="stats-dashboard mt-20">
        <h2 className="text-4xl font-bold text-center">📊 Collection Stats</h2>
        <div className="stats-grid mt-8">
          <StatCard
            label="Total Minted"
            value={`${totalSupply?.toString()} / ${maxSupply?.toString()}`}
          />
          <StatCard
            label="Floor Price"
            value="0.01 ETH"
          />
          <StatCard
            label="24h Volume"
            value="12 ETH"
          />
          <StatCard
            label="Holders"
            value="456"
          />
        </div>
      </section>
    </div>
  );
}

// 辅助函数
const getRarityName = (rarity: number): string => {
  const names = ["Common", "Rare", "Epic", "Legendary"];
  return names[rarity] || "Unknown";
};

const getRelativeTime = (blockNumber: bigint): string => {
  // 实现相对时间计算
  return "2 minutes ago";
};
```

---

### 5.2 Mint 页面核心代码

```typescript
// app/mint/page.tsx
"use client";

import { useState } from "react";
import { useAccount, useBalance } from "wagmi";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { parseEther, formatEther } from "viem";
import type { Hash } from "viem";

export default function MintPage() {
  const { address, isConnected } = useAccount();
  const [quantity, setQuantity] = useState(1);
  const [txHash, setTxHash] = useState<Hash>();
  const [step, setStep] = useState(0);

  // 读取余额
  const { data: balance } = useBalance({ address });

  // 写入合约
  const { writeContractAsync, isPending } = useScaffoldWriteContract({
    contractName: "StakableNFT",
  });

  // 计算价格
  const UNIT_PRICE = parseEther("0.01");
  const calculateTotal = (qty: number): bigint => {
    const subtotal = UNIT_PRICE * BigInt(qty);
    let discount = 0n;

    if (qty >= 10) {
      discount = subtotal * 10n / 100n;
    } else if (qty >= 5) {
      discount = subtotal * 5n / 100n;
    }

    return subtotal - discount;
  };

  const total = calculateTotal(quantity);
  const isSufficient = balance && balance.value >= total;

  // 铸造函数
  const handleMint = async () => {
    if (!isConnected || !isSufficient) return;

    try {
      setStep(1); // Approve in Wallet

      const hash = await writeContractAsync(
        {
          functionName: "mint",
          args: [BigInt(quantity)],
          value: total,
        },
        {
          blockConfirmations: 1,
          onBlockConfirmation: (receipt) => {
            setStep(4); // Success
            setTxHash(receipt.transactionHash);
            showSuccessModal(receipt);
          },
        }
      );

      setStep(2); // Sending Transaction
      setTxHash(hash);
      setStep(3); // Waiting Confirmation
    } catch (error: any) {
      setStep(0);
      console.error("Mint failed:", error);
    }
  };

  return (
    <div className="mint-page">
      <div className="mint-container">
        {/* Left Panel: Visual */}
        <div className="left-panel">
          <MysteryBoxAnimation />

          <div className="rarity-chances">
            <h3>What's inside?</h3>
            <RarityProgress name="Common" percentage={50} color="gray" />
            <RarityProgress name="Rare" percentage={30} color="blue" />
            <RarityProgress name="Epic" percentage={15} color="purple" />
            <RarityProgress name="Legendary" percentage={5} color="gold" />
          </div>

          <LiveMintFeed />
        </div>

        {/* Right Panel: Form */}
        <div className="right-panel">
          <h2>Mint Your NFT</h2>

          {/* Quantity Selector */}
          <div className="form-group">
            <label>Quantity</label>
            <select
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            >
              <option value={1}>1 NFT</option>
              <option value={5}>5 NFTs (Save 5%)</option>
              <option value={10}>10 NFTs (Save 10%)</option>
            </select>
          </div>

          {/* Price Display */}
          <div className="price-breakdown">
            <div className="price-row">
              <span>Unit Price:</span>
              <span>0.01 ETH (~$25.50)</span>
            </div>
            <div className="price-row">
              <span>Quantity:</span>
              <span>× {quantity}</span>
            </div>
            {quantity >= 5 && (
              <div className="price-row discount">
                <span>Discount:</span>
                <span>-{quantity >= 10 ? 10 : 5}%</span>
              </div>
            )}
            <div className="price-row total">
              <span>Total:</span>
              <span>{formatEther(total)} ETH</span>
            </div>
          </div>

          {/* Balance Check */}
          <div className={`balance-check ${isSufficient ? 'success' : 'error'}`}>
            {isSufficient ? (
              <>
                <span>✅ Your Balance: {balance?.formatted} {balance?.symbol}</span>
                <span>✅ Sufficient funds</span>
              </>
            ) : (
              <>
                <span>❌ Your Balance: {balance?.formatted || "0"} {balance?.symbol || "ETH"}</span>
                <span>⚠️ Need {formatEther(total)} ETH to mint</span>
                <a href="/faucet">Get ETH from Faucet</a>
              </>
            )}
          </div>

          {/* Mint Button */}
          <button
            onClick={handleMint}
            disabled={!isConnected || !isSufficient || isPending}
            className={`btn-mint ${isPending ? 'loading' : ''}`}
          >
            {!isConnected && "Connect Wallet First"}
            {isConnected && !isSufficient && "Insufficient Balance"}
            {isConnected && isSufficient && !isPending && "Mint Now 🎲"}
            {isPending && "Minting..."}
          </button>

          {/* Transaction Progress */}
          {step > 0 && (
            <TransactionProgress
              step={step}
              txHash={txHash}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// 组件：交易进度
function TransactionProgress({ step, txHash }: { step: number; txHash?: Hash }) {
  const steps = [
    "Approve in Wallet",
    "Sending Transaction",
    "Waiting Confirmation",
    "Revealing Rarity",
  ];

  return (
    <div className="transaction-progress">
      <h3>Transaction Progress</h3>
      {steps.map((label, idx) => (
        <div key={idx} className={`progress-step ${idx < step ? 'done' : idx === step ? 'active' : 'pending'}`}>
          <span className="step-number">{idx + 1}</span>
          <span className="step-label">{label}</span>
          {idx < step && <span className="step-status">✅</span>}
          {idx === step && <span className="step-status">⏳</span>}
        </div>
      ))}

      {txHash && (
        <a
          href={`https://etherscan.io/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          View on Explorer
        </a>
      )}
    </div>
  );
}
```

---

## 6. 转化率优化（CRO）

### 6.1 减少摩擦

| 问题 | 解决方案 | 预期提升 |
|------|---------|---------|
| 不知道怎么开始 | "How It Works" 区域 | +15% |
| 担心价格太高 | 显示 USD 价格 + 批量折扣 | +20% |
| 不信任项目 | 实时数据 + 链上证明 | +25% |
| 交易流程不清 | 4 步进度条 | +10% |

---

### 6.2 制造稀缺感

- **进度条**："1,234 / 10,000 minted"
- **倒计时**："Sale ends in 24h"（如适用）
- **限购**："Max 10 per wallet"
- **实时动态**："3 people are minting now"

---

### 6.3 社交证明

- **实时铸造动态**：展示他人行为
- **持有者数量**：456 holders
- **交易量**：24h Volume: 12 ETH
- **名人效应**：如有 KOL 铸造，特别标注

---

### 6.4 价格锚定

| 技巧 | 实现 | 效果 |
|------|------|------|
| **高价锚点** | Legendary Floor: 1 ETH | 0.01 ETH 显得便宜 |
| **批量折扣** | 10 个省 10% | 提高客单价 |
| **对比展示** | 显示"节省 $X" | 强化划算感 |

---

### 6.5 A/B 测试建议

**测试 1: CTA 文案**
- 版本 A："Mint Now 🎲"
- 版本 B："Get Your NFT"
- 版本 C："Try Your Luck"

**测试 2: 数量默认值**
- 版本 A：默认 1 个
- 版本 B：默认 5 个
- 版本 C：默认 10 个

**测试 3: 价格显示**
- 版本 A：仅 ETH
- 版本 B：ETH + USD
- 版本 C：USD 主显，ETH 次显

---

## 7. 实施计划

### 7.1 开发优先级

**阶段 1: MVP（1-2 周）**
- ✅ Mint 页面核心功能
  - 数量选择器
  - 价格计算
  - 铸造按钮
  - 交易进度
- ✅ 基础样式（无动画）

**阶段 2: 完善（1 周）**
- ✅ 首页核心区域
  - Hero Section
  - Rarity System
  - Stats Dashboard
- ✅ 实时数据集成

**阶段 3: 优化（1 周）**
- ✅ 动画和特效
  - 盲盒动画
  - 成功弹窗
  - 庆祝特效
- ✅ 实时铸造动态

**阶段 4: 打磨（1 周）**
- ✅ 响应式设计
- ✅ 可访问性优化
- ✅ 性能优化
- ✅ A/B 测试准备

---

### 7.2 技术债务管理

**需要注意的点：**
1. **图片优化**
   - 使用 Next.js `<Image>` 组件
   - 懒加载非首屏图片
   - 使用 WebP 格式

2. **代码分割**
   - 动画库按需加载
   - 重组件懒加载（Mint 成功弹窗）

3. **缓存策略**
   - 静态资源 CDN
   - API 响应缓存
   - 链上数据缓存（React Query）

4. **错误边界**
   - 页面级错误处理
   - 组件级降级
   - 网络错误重试

---

### 7.3 性能指标

**目标：**
- ✅ First Contentful Paint (FCP) < 1.5s
- ✅ Largest Contentful Paint (LCP) < 2.5s
- ✅ Time to Interactive (TTI) < 3.5s
- ✅ Cumulative Layout Shift (CLS) < 0.1

---

## 总结

### 设计理念

```
首页：漏斗顶部
吸引 → 教育 → 信任 → 行动
  ↓      ↓      ↓      ↓
Hero  Rarity  Stats   CTA

Mint 页：转化页
刺激 → 简化 → 反馈 → 庆祝
  ↓      ↓      ↓      ↓
动画   表单   进度   分享
```

### 核心原则

1. **3 秒规则**：用户 3 秒内理解项目
2. **透明度**：公开所有数据（概率、价格、供应量）
3. **降低门槛**：USD 价格、清晰引导、友好错误提示
4. **正向反馈**：成功动画、社交分享、激励复购
5. **性能优先**：快速加载、流畅交互

### 下一步

现在设计方案已完成，可以开始实施：

1. **创建页面文件**：
   - `app/page.tsx`（首页）
   - `app/mint/page.tsx`（Mint 页）

2. **创建可复用组件**：
   - `components/RarityCard.tsx`
   - `components/MintForm.tsx`
   - `components/TransactionProgress.tsx`

3. **样式实现**：
   - 创建设计系统（CSS 变量）
   - 实现组件样式

4. **功能集成**：
   - 合约交互
   - Ponder 数据查询
   - 实时事件监听

准备好开始实施了吗？🚀
