# OpenZeppelin 合约库进阶学习路线图 🚀

恭喜你已经完成了 Token 标准（ERC20 / ERC721 / ERC1155）的学习！这意味着你已经掌握了地基。为了构建生产级（Production-Ready）的去中心化应用（DApp），接下来的学习将从 **“怎么管”** 到 **“怎么用”**，再到 **“怎么升级”** 和 **“怎么治理”**。

---

## 📅 第一阶段：权限控制 (Access Control) —— 给合约加锁 🔒

**核心目标**：学会如何管理合约的管理员权限，防止恶意调用。

### 1. 基础权限：Ownable
* **源码路径**：`contracts/access/Ownable.sol`
* **学习重点**：
    * 理解 `onlyOwner` 修饰符的实现原理。
    * **进阶**：查看 `contracts/access/Ownable2Step.sol`，理解为什么权限转移需要两步确认（防止误转）。

### 2. 角色权限：AccessControl (RBAC)
* **源码路径**：`contracts/access/AccessControl.sol`
* **学习重点**：
    * 基于角色的权限控制（Role-Based Access Control）。
    * `_roles` 映射的数据结构设计。
    * 为什么使用 `bytes32` 定义角色（例如 `keccak256("MINTER_ROLE")`）。
    * 如何实现一个账户拥有多个角色。

**🎯 实战场景**：给你的 ERC1155 合约添加一个 `MINTER_ROLE`，限制只有拥有该角色的地址才能铸造新装备。

---

## 🛠️ 第二阶段：实用工具与安全 (Utils) —— 瑞士军刀 🛡️

**核心目标**：学会防黑客攻击、节省 Gas 以及处理复杂的链下验证。

### 1. 防重入攻击：ReentrancyGuard (必学)
* **源码路径**：`contracts/utils/ReentrancyGuard.sol`
* **学习重点**：
    * 理解重入攻击（Reentrancy Attack）的原理。
    * 查看 `nonReentrant` 修饰符是如何利用 `_status` 状态锁死函数的。

### 2. 紧急开关：Pausable
* **源码路径**：`contracts/utils/Pausable.sol`
* **学习重点**：
    * 当合约发现 Bug 时，如何通过 `whenNotPaused` 暂停核心功能。

### 3. 签名验证与白名单：ECDSA & MerkleProof
* **源码路径**：
    * `contracts/utils/cryptography/ECDSA.sol`
    * `contracts/utils/cryptography/MerkleProof.sol`
* **学习重点**：
    * **省 Gas 神器**：如何不将白名单存储在链上（Storage），而是通过验证签名或 Merkle Tree 来确认用户资格。

### 4. 结构化数据签名：EIP712
* **源码路径**：`contracts/utils/cryptography/EIP712.sol`
* **学习重点**：
    * 如何让用户签名的内容在钱包中是可读的结构化数据，而不是一串乱码。

---

## 🆙 第三阶段：代理与升级 (Proxy) —— 进阶高地 🏗️

**核心目标**：学会编写可升级合约（Upgradable Contracts），解决区块链代码不可篡改的痛点。

### 1. 代理基石：ERC1967Proxy
* **源码路径**：`contracts/proxy/ERC1967/ERC1967Proxy.sol`
* **学习重点**：
    * 理解 `delegatecall` 的工作机制。
    * **存储槽冲突（Storage Collision）**：数据是如何存储在代理合约中的？

### 2. 透明代理：TransparentUpgradeableProxy
* **源码路径**：`contracts/proxy/transparent/TransparentUpgradeableProxy.sol`
* **学习重点**：
    * 管理员和普通用户调用合约时，为什么路由逻辑不一样？

### 3. UUPS 模式：UUPSUpgradeable (主流推荐)
* **源码路径**：`contracts/proxy/utils/UUPSUpgradeable.sol`
* **学习重点**：
    * 为什么升级逻辑被放在了逻辑合约（Implementation）里，而不是代理合约里？
    * 这种模式为什么比透明代理更省 Gas？

---

## 🏛️ 第四阶段：去中心化治理 (Governance) —— 终极形态 ⚖️

**核心目标**：将控制权移交给社区 DAO，实现代码自动化治理。

### 1. 治理核心：Governor
* **源码路径**：`contracts/governance/Governor.sol`
* **学习重点**：
    * 提案（Proposal）的完整生命周期：`提议` -> `投票` -> `排队` -> `执行`。
    * `Quorum`（法定人数）和 `VoteThreshold`（通过门槛）的设置。

### 2. 时间锁：TimelockController
* **源码路径**：`contracts/governance/TimelockController.sol`
* **学习重点**：
    * 为什么提案通过后不能立即执行？（给社区反应时间，防止恶意提案）。
    * 如何防止治理攻击。

### 3. 投票代币：ERC20Votes
* **源码路径**：`contracts/token/ERC20/extensions/ERC20Votes.sol`
* **学习重点**：
    * **快照（Snapshot）机制**：如何防止用户投完票立刻把币卖了，或者重复投票？（Checkpoints 的应用）。

---

## 📝 总结：推荐学习顺序

1.  ✅ **Access** (立刻开始，难度低，实用性高)
2.  🔄 **Utils** (穿插学习，作为工具库随时查阅)
3.  ⚠️ **Proxy** (专门预留时间攻克，难度较高，需理解 EVM 底层)
4.  🗳️ **Governance** (项目后期需求，可最后学习)

祝源码阅读愉快！Happy Coding! 💻