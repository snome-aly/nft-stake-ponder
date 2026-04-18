# Web3 协议架构师进阶路线图 (Revised Strategy)

**当前策略**: **DeFi 优先** -> **MEV 攻防** -> **Infra 扩展**
**核心目标**: 先掌握“钱怎么流转”（DeFi），再掌握“如何从中获利与防御”（MEV），最后掌握“如何扩展边界”（Infra）。

---

## 🟢 第一阶段：DeFi 核心架构与算法 (The Engine)
*耗时预计: 4-6 周*
*目标: 能手写 AMM 和借贷协议的核心逻辑。*

### 1.1 AMM 进化论 (Uniswap 系列)
这是 DeFi 的圣经。必须按照 **V2 -> V3** 的顺序学。
*   **Uniswap V2 (入门)**:
    *   **数学**: $x * y = k$ (恒定乘积公式)。
    *   **源码**: `UniswapV2Pair.sol`。
    *   **关键点**: `mint`, `burn`, `swap`。理解“闪电贷”是如何在 V2 的 swap 函数回调中实现的。
*   **Uniswap V3 (进阶 - 难点)**:
    *   **数学**: 集中流动性 (Concentrated Liquidity)。理解做市区间 $[P_a, P_b]$。
    *   **源码**: `UniswapV3Pool.sol`, `TickBitmap.sol` (位图管理), `SwapMath.sol`。
    *   **挑战**: 理解为什么 V3 用 NFT (ERC721) 来管理 LP Position。
*   **Curve (StableSwap)**:
    *   **数学**: 理解从 $x+y=k$ (恒定和) 到 $x*y=k$ 的混合曲线设计，实现低滑点稳定币兑换。

### 1.2 借贷协议 (Lending)
*   **Aave / Compound**:
    *   **核心逻辑**: 资金池模式 (Pooled Model)。
    *   **数学**: **利率曲线 (Interest Rate Model)**。为什么利用率 (Utilization) 越高，利率越高？
    *   **关键结构**: `aToken` (生息代币) 的实现原理。
    *   **清算 (Liquidation)**: 只有理解了清算逻辑，才能进入下一阶段的 MEV 学习。

### 1.3 衍生品与合成资产 (Synthetics)
*   **Synthetix / GMX**:
    *   **Oracle 依赖**: 这里的核心不是 AMM，而是如何安全地读取 Oracle 价格来做零滑点交易。

---

## 🟡 第二阶段：MEV 与黑暗森林 (The Battlefield)
*耗时预计: 3-4 周*
*目标: 理解链上博弈，学会保护协议免受套利者攻击。*

### 2.1 理论基础
*   **Mempool**: 交易在上链之前的“等待区”。这是 MEV 的发生地。
*   **三明治攻击 (Sandwich Attack)**:
    *   侦测到大额买单 -> 抢先买入 (Front-run) -> 等受害者买入抬高价格 -> 卖出获利 (Back-run)。
    *   *结合第一阶段*: 这就是为什么你需要理解 AMM 的滑点机制。

### 2.2 防御与实战
*   **Flashbots**:
    *   学习如何发送 Bundle 交易（绕过 Mempool，直接通过私有通道打包）。
*   **原子化套利 (Atomic Arbitrage)**:
    *   利用你学的 `Multicall` 和 `FlashLoan`，在同一个交易里完成 借->买->卖->还 的闭环。

---

## 🔴 第三阶段：L2 与 跨链基础设施 (The Horizon)
*耗时预计: 3-4 周*
*目标: 跳出单链思维，构建多链互操作应用。*

### 3.1 Layer 2 架构
*   **Rollup 原理**:
    *   **Optimistic**: 理解欺诈证明 (Fraud Proof) 的时间窗口。
    *   **ZK-Rollup**: 只需要知道 Validity Proof 的概念。
*   **数据可用性 (DA)**: EIP-4844 (Blob) 到底把数据存在了哪里。

### 3.2 跨链互操作 (Interoperability)
*   **Messaging Protocols**: LayerZero, Chainlink CCIP。
    *   源码分析: 如何在 A 链调用 B 链合约的函数？
    *   重点: **信任模型**。是信任预言机，还是信任轻节点？

---

## � 执行建议 (Action Plan)

**本周任务 (Week 1)**: **彻底吃透 Uniswap V2**。
1.  下载 V2 Core 源码。
2.  在纸上推导 $x*y=k$ 在有手续费情况下的变化。
3.  搞懂 `cpke` (Constant Product Market Maker) 的基本定价原理。

**下一步**: 当您觉得 V2 已经没有秘密了，我们再启动 V3 的研读（那将是一场硬仗）。
