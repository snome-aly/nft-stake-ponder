# 以太坊签名技术精华总结 (Signature Essentials)

本文档总结了 Web3 开发中关于签名的核心概念、类型及安全机制。

## 1. 签名的本质
在以太坊中，签名的核心作用是**身份证明**与**授权**。
*   **私钥 (Private Key)**: 生成签名。
*   **公钥 (Public Key)**: 通过 `ecrecover` 从“签名 + 原始消息”中恢复出来。
*   **验证逻辑**: `恢复出的地址 == 期望的地址` 即为有效。

---

## 2. 三大签名类型

### 2.1 交易签名 (Transaction Signature)
*   **对象**: 签的是一笔由 RLP 编码的以太坊交易 (`to`, `value`, `nonce`, `data`...)。
*   **作用**: **唯一能改变链上状态**的签名。
*   **特点**: 必须广播上链，消耗 Gas。

### 2.2 个人消息签名 (Personal Sign / EIP-191)
*   **对象**: 签的是一段任意文本或哈希。
*   **格式**: `keccak256("\x19Ethereum Signed Message:\n" + len(msg) + msg)`。
*   **作用**: **链下身份认证**。
    *   **登录 DApp**: 证明我是这个地址的主人。
    *   **白名单**: 项目方签发 `Hash(User, Amount)`，用户拿着去合约领奖。
*   **缺点**: **盲签 (Blind Signing)**。用户在钱包里只看到一串乱码，不知道具体签了什么。

### 2.3 结构化数据签名 (EIP-712) ✨ *黄金标准*
*   **对象**: 签的是一个**JSON 对象** (Typed Data)。
*   **格式**: 包含 `Domain Separator` (防止跨链/跨合约重放) 和自定义 `Types`。
*   **作用**: **复杂的链下授权**。
    *   **Permit (ERC-2612)**: 链下签名授权代币，无需 Approve 交易。
    *   **OpenSea 挂单**: 签名授权出售 NFT。
*   **优点**: **所见即所得**。用户在钱包里能清晰看到 `To: Bob`, `Amount: 100`。

| 类型 | 用户看到的内容 | 安全性 | 典型场景 |
| :--- | :--- | :--- | :--- |
| **Personal Sign** | 乱码 Hex String | 低 (易被钓鱼) | 登录, 简单白名单 |
| **EIP-712** | 清晰的 JSON 表格 | 高 (域隔离) | Permit, 挂单, DAO 投票 |

---

## 3. 关键安全机制

### 3.1 前缀保护 (Prefix Protection)与 "0x19" 叹息之墙
*   **原理**: 所有的 Personal Sign (EIP-191) 和 EIP-712 都会在哈希前加特定的前缀 `0x19`。
    *   EIP-191: `0x19` + `Ethereum Signed Message:\n` + ...
    *   EIP-712: `0x19` + `0x01` + ...
*   **目的**: **防止签名混淆**。确保你的“消息签名”永远无法被攻击者伪装成“交易签名”去广播转账。
*   **为什么 `0x19` 能防混淆？**:
    *   以太坊**老式交易 (Legacy)**: 使用 RLP 编码，起始字节通常是 `0xF8` 或更大，绝不可能是 `0x19`。
    *   **新式交易 (EIP-2718)**: 格式为 `Type || Payload`。Type 可以是 `0x01` (EIP-2930), `0x02` (EIP-1559), `0x03` (EIP-4844 Blob)。
    *   **禁区**: EIP-2718 明确保留了 `0x19`，禁止未来的交易类型使用这个字节。这构成了数学上的绝对隔离。
*   **代码实现**:
    *   链下: 钱包自动加前缀。
    *   链上: 必须使用 OpenZeppelin 的 `MessageHashUtils.toEthSignedMessageHash()` 手动还原前缀。

### 3.2 补充：以太坊交易类型进化史
*   **Legacy (Type 0) [2015 Genesis]**: 经典的 `GasPrice` 竞价模式。
*   **EIP-2930 (Type 1) [2021 Berlin]**: 引入 `Access List`，提前声明访问的存储槽以节省 Gas。
*   **EIP-1559 (Type 2) [2021 London]**: 当前主流。把 `GasPrice` 拆分为 `BaseFee` (基础费，燃烧掉) + `PriorityFee` (小费，给矿工)。
*   **EIP-4844 (Type 3) [2024 Dencun]**: 为 Layer 2 设计的 Blob 交易，携带大量临时数据，极大降低 L2 费用。
*   **EIP-7702 (Type 4) [2025 Pectra]**: 赋予 EOA 临时代码执行能力的 AA 交易。

### 3.3 未来展望：Pectra 升级与 EIP-7702 🚀
*   **状态**: 计划于 2025 年 Pectra 升级中激活。
*   **核心痛点**: 现在的 EOA (普通钱包) 很笨，无法实现批量交易、代付 Gas 等 AA 功能。
*   **解决方案**: 引入 **Transaction Type 4**。
*   **机制 (Temporary Code Mounting)**:
    *   allow EOA 在**单笔交易期间**，临时将自己的代码指针指向一个智能合约（如 BatchExecutor）。
    *   **非部署**: 这不是部署合约，而是 EVM 层面的临时内存映射。交易结束后，EOA 立刻变回空地址。
*   **与 ERC-4337 的区别**:
    *   **ERC-4337 (应用层)**: `UserOp -> Bundler -> EntryPoint -> Account`。完全依赖合约模拟，路径长，Gas 略高。
    *   **EIP-7702 (协议层)**: `Transaction -> EVM Core -> Account`。EVM 原生支持，不需要 Bundler/EntryPoint（除非代码逻辑里主动去兼容）。它是更底层的、原生的 AA 捷径。
*   **意义**: 让现在的 MetaMask 用户不需要迁移资产，就能瞬间拥有智能合约钱包的所有超能力。这是通往**全面账户抽象**的最重要一步。

### 3.2 可塑性防御 (Malleability)
*   **原理**: ECDSA 算法本身是对称的，一个签名 `(r, s)` 可以变形成 `(r, -s)`。
*   **后果**: 如果通过“签名唯一性”来防重放，攻击者可以用变形签名再次攻击。
*   **防御**: OpenZeppelin 的 `ECDSA.recover` 强制要求 `s` 值在曲线下半区，否则 Revert。

### 3.3 重放防御 (Replay Protection)
*   **Nonce**: 业务逻辑必须包含 `nonce`（计数器），用过一次就作废。
*   **ChainID**: EIP-712 的 Domain 中包含 ChainID，防止测试网签名被拿到主网用。
*   **VerifyingContract**: EIP-712 绑定合约地址，防止 A 合约的签名被拿到 B 合约用。

---

## 4. 特殊补充

### 4.1 合约签名 (EIP-1271)
*   **背景**: 智能合约没有私钥，无法生成 ECDSA 签名。
*   **机制**: 既然签不了，就**验**。合约实现 `isValidSignature` 接口。
*   **场景**: 多签钱包 (Gnosis Safe)、Account Abstraction 钱包登录 DApp。

### 4.2 Permit 模式 (Gasless Approve)
*   **流程**:
    1.  User 链下 EIP-712 签名: "我授权 Router 动用我 100 USDT"。
    2.  User 把签名给 Router。
    3.  Router 调用 Token 合约的 `permit()`，带上签名。
    4.  Token 合约验证签名，**直接修改 Allowance**。
    5.  Router 随后直接 `transferFrom` 转走代币。
*   **价值**: 省去一笔 Approve 交易的 Gas 和时间。
