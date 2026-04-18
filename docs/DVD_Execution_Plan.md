# Damn Vulnerable DeFi (V4) 实战执行计划

**目标**: 这是一个为期 4 周的特训计划。不仅是为了通关，更是为了掌握**Foundry**这一安全研究领域的标配工具，并培养**黑客思维**。

---

## 🟢 Week 1: 环境搭建与热身 (Foundry & Basics)

### 1.1 拥抱 Foundry
DVD V4 是完全基于 Foundry 构建的。这是你从 "Hardhat Developer" 转型为 "Security Researcher" 的第一步。
*   **安装**: `curl -L https://foundry.paradigm.xyz | bash` 然后运行 `foundryup`。
*   **核心指令**:
    *   `forge test`: 运行测试（主要工作流）。
    *   `cast`: 命令行瑞士军刀（转换数据、调用 RPC）。
    *   `chisel`: Solidity REPL 环境（极其好用，可以在命令行里写一行代码算 hash 或验证逻辑）。

### 1.2 搭建靶场
```bash
git clone https://github.com/theredguild/damn-vulnerable-defi.git
cd damn-vulnerable-defi
git checkout v4.0.0 # 确保是 V4 版本
yarn install # 安装依赖
```

### 1.3 破冰挑战 (Basics)
*   **Unstoppable**:
    *   *知识点*: 闪电贷与会计逻辑不一致。
    *   *任务*: 让一个 Vault 停止工作 (DoS)。
    *   *提示*: 仔细看 `totalAssets()` 和 `totalSupply` 的计算方式。
*   **Naive Receiver**:
    *   *知识点*: 闪电贷手续费收割。
    *   *任务*: 把受害者的钱抽干。
    *   *提示*: 谁在付手续费？能不能帮他借？借多少次？

---

## 🟡 Week 2: 闪电贷与重入 (The Classics)

### 2.1 闪电贷花式利用
*   **Truster**:
    *   *知识点*: 闪电贷回调中的授权漏洞 (ERC20 approve)。
    *   *任务*: 一次交易把池子搬空。
    *   *提示*: `functionCall` 的 target 是谁？data 是什么？
*   **Side Entrance**:
    *   *知识点*: 存取款逻辑与闪电贷的跨函数状态。
    *   *任务*: 此时借的钱，彼时存进去。
    *   *提示*: `deposit` 和 `repay` 的资金流向。

### 2.2 治理攻击 (Governance)
*   **The Rewarder**:
    *   *知识点*: 快照机制漏洞。
    *   *任务*: 利用闪电贷在那一瞬间获得巨额奖励。
*   **Selfie**:
    *   *知识点*: 治理提案的 `Action` 执行。
    *   *任务*: 提案也是一种代码执行。能不能提一个案子把自己变成 Admin？

---

## 🔴 Week 3: 高级漏洞与 Oracle (Advanced)

### 3.1 价格操纵
*   **Puppet V1 / V2 / V3**:
    *   *知识点*: 千万不要用 Uniswap 的现货价格做预言机！
    *   *任务*: 利用闪电贷砸盘 Uniswap，导致借贷协议认为抵押物归零，然后低价清算。
    *   *提示*: 理解 `calculateDepositRequired` 这种函数对外部价格的依赖。

### 3.2 复杂机制
*   **Compromised**:
    *   *知识点*: Web2 泄露导致 Web3 受损。
    *   *任务*: 它是关于私钥泄露和预言机操控的结合。
*   **Free Rider**:
    *   *知识点*: NFT 市场的 Bug (先买后付?) + 闪电贷。

---

## 🟣 Week 4: 终局之战 (Mastery)

*   **Curvey** (New in V4): 涉及 Curve 类似的数学曲线漏洞。
*   **Shards** (New in V4): NFT 分片化协议的漏洞。

---

## ⚔️ 黑客方法论 (The Methodology)

在做每一题时，请严格遵守以下 SOP (标准作业程序)：

1.  **侦查 (Recon)**:
    *   通读合约。不要急着写代码。
    *   画出资金流向图。钱在哪？谁能动钱？
    *   寻找 `external` / `public` 函数作为入口点。
2.  **假设 (Hypothesis)**:
    *   "如果我能在回调里调用 `approve`..."
    *   "如果我能让价格跌 99%..."
    *   用 `chisel` 快速验证你的猜想（比如计算一些奇怪的数学边界）。
3.  **PoC (Proof of Concept)**:
    *   在 `test/` 目录下创建一个新的攻击合约。
    *   编写 `attack()` 函数。
    *   运行 `forge test --match-test test_exploit`。
4.  **复盘 (Review)**:
    *   这一关为什么会存在漏洞？开发者应该怎么修？(Diff check)

**Ready? Start your engine.** 🕵️‍♂️
