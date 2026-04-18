# Safe 钱包完整使用指南

Safe (原 Gnosis Safe) 是以太坊上最流行的**多签钱包**（Multi-Signature Wallet），适用于团队资产管理、DAO 资金管理、高价值资产保护等场景。

---

## 目录

1. [什么是 Safe 钱包](#什么是-safe-钱包)
2. [Safe 底层原理详解](#safe-底层原理详解)
3. [创建 Safe 钱包](#创建-safe-钱包)
4. [Safe 钱包基本使用](#safe-钱包基本使用)
5. [在 dApp 中集成 Safe](#在-dapp-中集成-safe)
6. [高级功能](#高级功能)
7. [最佳实践](#最佳实践)

---

## 什么是 Safe 钱包

### 核心特点

**Safe 是一个智能合约钱包，不是浏览器扩展。**

| 特性 | 普通钱包 (MetaMask) | Safe 多签钱包 |
|------|-------------------|--------------|
| 钱包类型 | EOA (外部拥有账户) | 智能合约账户 |
| 私钥控制 | 单个私钥控制 | 多个签名者共同控制 |
| 安全性 | 私钥丢失 = 资产丢失 | 即使丢失一个私钥，资产仍安全 |
| 适用场景 | 个人使用 | 团队、DAO、企业 |
| 交易确认 | 单人即可 | 需要 M/N 签名者确认 |
| 成本 | 无部署成本 | 需要部署合约（一次性成本）|

### 工作原理

```
传统钱包流程：
私钥 → 签名 → 交易 → 链上执行 ✅

Safe 多签流程：
签名者 1 → 签名（1/3）
签名者 2 → 签名（2/3）  ← 达到阈值
签名者 3 → (可选)
         ↓
       交易 → 链上执行 ✅
```

### 使用场景

1. **团队资产管理** - 公司/团队共同管理资金，避免单点风险
2. **DAO 金库** - 去中心化组织的资金管理
3. **个人高价值资产** - 多设备保护，防止单一私钥丢失
4. **项目方资金管理** - 提高透明度和安全性
5. **智能合约交互** - 批量操作、定时任务等高级功能

---

## Safe 底层原理详解

### 架构概览

Safe 由多个智能合约组成，采用模块化设计：

```
┌─────────────────────────────────────────────────────┐
│                Safe 智能合约架构                     │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │         Safe Proxy (你的 Safe 实例)        │    │
│  │  - 持有资产 (ETH, ERC20, NFT)              │    │
│  │  - 存储签名者列表                          │    │
│  │  - 存储阈值配置                            │    │
│  │  - 管理 nonce                              │    │
│  └──────────────────┬─────────────────────────┘    │
│                     │ delegatecall                  │
│                     ▼                                │
│  ┌────────────────────────────────────────────┐    │
│  │     Safe Singleton (共享逻辑合约)          │    │
│  │  - execTransaction() 核心执行逻辑          │    │
│  │  - checkSignatures() 签名验证              │    │
│  │  - addOwner() / removeOwner()              │    │
│  │  - changeThreshold()                       │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │     Safe Proxy Factory (工厂合约)          │    │
│  │  - 部署新的 Safe Proxy                      │    │
│  │  - CREATE2 确定性部署                       │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │     Fallback Handler (回退处理器)          │    │
│  │  - ERC1155 / ERC721 接收                    │    │
│  │  - ERC165 接口支持                          │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │     Modules (可选模块)                      │    │
│  │  - Allowance Module                         │    │
│  │  - Social Recovery Module                   │    │
│  │  - 自定义模块                               │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 核心概念

#### 1. Proxy 模式（代理模式）

Safe 使用 **Minimal Proxy Pattern (EIP-1167)** 节省部署成本：

```solidity
// 每个 Safe 都是一个轻量级代理合约
contract SafeProxy {
    // 仅存储数据，不包含逻辑
    address internal singleton;  // 指向 Safe Singleton

    // 所有调用都转发到 Singleton
    fallback() external payable {
        address _singleton = singleton;
        assembly {
            // delegatecall 到 Singleton
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(gas(), _singleton, 0, calldatasize(), 0, 0)
            returndatacopy(0, 0, returndatasize())
            switch result
            case 0 { revert(0, returndatasize()) }
            default { return(0, returndatasize()) }
        }
    }
}

// 好处
✅ 每个 Safe 部署成本极低 (~$10-30，只是 Proxy）
✅ 所有 Safe 共享同一套逻辑（Singleton）
✅ 升级友好：可以切换到新的 Singleton
✅ 节省链上空间

// 成本对比
普通合约部署: ~5000 gas * 合约大小
Safe Proxy:   ~50,000 gas (固定，非常小)
```

#### 2. 签名验证机制

Safe 支持多种签名类型：

```solidity
// Safe 的签名验证核心函数
function checkSignatures(
    bytes32 dataHash,        // 交易数据哈希
    bytes memory data,       // 原始交易数据
    bytes memory signatures  // 签名数据（拼接的）
) public view {
    uint256 _threshold = threshold;
    require(_threshold > 0, "Threshold not set");

    // 验证至少有 threshold 个有效签名
    checkNSignatures(dataHash, data, signatures, _threshold);
}
```

**支持的签名类型：**

| 签名类型 | 说明 | v 值 | 使用场景 |
|---------|------|------|---------|
| **EOA 签名** | 标准 ECDSA 签名 | 27/28 | 普通钱包（MetaMask） |
| **合约签名** | EIP-1271 签名验证 | 0 | Safe 作为签名者（嵌套 Safe）|
| **预验证签名** | 链上已批准 | 1 | Gas 优化 |
| **eth_sign** | 旧式签名格式 | 30/31 | 兼容性 |

**签名数据结构：**

```solidity
// 签名按签名者地址排序拼接
// 每个签名占 65 字节 (r: 32, s: 32, v: 1)
bytes memory signatures = abi.encodePacked(
    r1, s1, v1,  // 签名者 1 (地址最小)
    r2, s2, v2,  // 签名者 2
    r3, s3, v3   // 签名者 3 (地址最大)
);

// 为什么要排序？
// 确保签名顺序唯一，防止重复计数
```

#### 3. 交易哈希计算

Safe 使用 **EIP-712** 结构化数据哈希：

```solidity
// Safe 交易结构
struct SafeTx {
    address to;              // 目标地址
    uint256 value;           // 发送的 ETH 数量
    bytes data;              // 调用数据
    Enum.Operation operation; // CALL(0) 或 DELEGATECALL(1)
    uint256 safeTxGas;       // Safe 执行的 gas
    uint256 baseGas;         // 基础 gas（签名验证等）
    uint256 gasPrice;        // Gas 价格
    address gasToken;        // 用于支付 gas 的代币（0x0 = ETH）
    address refundReceiver;  // Gas 退款接收者
    uint256 nonce;           // 防重放攻击
}

// 计算交易哈希
bytes32 txHash = keccak256(
    abi.encodePacked(
        bytes1(0x19),
        bytes1(0x01),
        domainSeparator,
        keccak256(abi.encode(
            SAFE_TX_TYPEHASH,
            to,
            value,
            keccak256(data),
            operation,
            safeTxGas,
            baseGas,
            gasPrice,
            gasToken,
            refundReceiver,
            nonce
        ))
    )
);

// domainSeparator 确保签名只对特定 Safe 和链有效
bytes32 domainSeparator = keccak256(
    abi.encode(
        DOMAIN_SEPARATOR_TYPEHASH,
        chainId,
        address(this)  // Safe 地址
    )
);
```

**为什么使用 EIP-712？**
```
✅ 类型安全：签名者知道自己在签什么
✅ 防止跨链重放：包含 chainId
✅ 防止跨 Safe 重放：包含 Safe 地址
✅ 钱包友好：MetaMask 等钱包可以展示易读格式
```

#### 4. 执行交易流程

```solidity
// Safe 的核心执行函数
function execTransaction(
    address to,
    uint256 value,
    bytes calldata data,
    Enum.Operation operation,
    uint256 safeTxGas,
    uint256 baseGas,
    uint256 gasPrice,
    address gasToken,
    address payable refundReceiver,
    bytes memory signatures
) public payable virtual returns (bool success) {
    bytes32 txHash;
    {
        // 1️⃣ 计算交易哈希
        bytes memory txHashData = encodeTransactionData(
            to, value, data, operation, safeTxGas,
            baseGas, gasPrice, gasToken, refundReceiver, nonce
        );
        txHash = keccak256(txHashData);

        // 2️⃣ 验证签名
        checkSignatures(txHash, txHashData, signatures);
    }

    // 3️⃣ 增加 nonce（防止重放）
    nonce++;

    // 4️⃣ 执行交易
    uint256 gasUsed = gasleft();
    success = execute(to, value, data, operation, safeTxGas);
    gasUsed = gasUsed.sub(gasleft());

    // 5️⃣ 处理 Gas 退款
    if (gasPrice > 0) {
        handlePayment(gasUsed, baseGas, gasPrice, gasToken, refundReceiver);
    }

    // 6️⃣ 触发事件
    if (success) {
        emit ExecutionSuccess(txHash, 0);
    } else {
        emit ExecutionFailure(txHash, 0);
    }
}
```

**执行流程图：**

```
用户发起交易
    ↓
┌───────────────────────────────────┐
│ 1. 收集签名 (链下)                 │
│ - 签名者 1: 签名 txHash            │
│ - 签名者 2: 签名 txHash            │
│ - 达到阈值 (2/3)                   │
└─────────────┬─────────────────────┘
              ↓
┌───────────────────────────────────┐
│ 2. 提交到链上                      │
│ execTransaction(                   │
│   to, value, data, ..., signatures │
│ )                                  │
└─────────────┬─────────────────────┘
              ↓
┌───────────────────────────────────┐
│ 3. Safe 合约验证                   │
│ - 计算 txHash                      │
│ - 验证签名数量 >= threshold        │
│ - 验证每个签名是有效 owner         │
│ - 验证签名顺序正确                 │
│ - 检查 nonce（防止重放）           │
└─────────────┬─────────────────────┘
              ↓
         验证通过？
         ├─ NO → 回滚交易 ❌
         └─ YES ↓
┌───────────────────────────────────┐
│ 4. 执行交易                        │
│ if (operation == CALL) {           │
│   success = to.call{value}(data)   │
│ } else {                           │
│   success = to.delegatecall(data)  │
│ }                                  │
└─────────────┬─────────────────────┘
              ↓
┌───────────────────────────────────┐
│ 5. 增加 nonce                      │
│ nonce++ (防止重放攻击)             │
└─────────────┬─────────────────────┘
              ↓
┌───────────────────────────────────┐
│ 6. 处理 Gas 退款                   │
│ - 计算实际消耗的 Gas               │
│ - 从 Safe 余额支付给执行者         │
│ - 可用 ETH 或 ERC20 支付           │
└─────────────┬─────────────────────┘
              ↓
┌───────────────────────────────────┐
│ 7. 触发事件                        │
│ emit ExecutionSuccess(txHash)      │
└───────────────────────────────────┘
              ↓
          完成 ✅
```

#### 5. Nonce 机制

Safe 使用 nonce 防止重放攻击：

```solidity
// Safe 存储
uint256 public nonce;  // 从 0 开始递增

// 每次执行交易时
function execTransaction(...) public {
    // 验证签名使用当前 nonce
    bytes32 txHash = getTransactionHash(..., nonce);
    checkSignatures(txHash, ...);

    // 执行后立即增加
    nonce++;  // 旧签名立即失效

    // 执行交易
    execute(...);
}

// 安全性保证
✅ 每个交易都有唯一的 nonce
✅ 签名与特定 nonce 绑定
✅ 无法重放已执行的交易
✅ 必须按顺序执行（nonce 递增）
```

#### 6. 模块系统

Safe 支持插件式扩展：

```solidity
// Safe 存储
mapping(address => address) internal modules;

// 启用模块
function enableModule(address module) public authorized {
    require(module != address(0) && module != SENTINEL_MODULES);
    require(modules[module] == address(0));
    modules[module] = modules[SENTINEL_MODULES];
    modules[SENTINEL_MODULES] = module;
    emit EnabledModule(module);
}

// 模块可以直接执行交易（无需多签）
function execTransactionFromModule(
    address to,
    uint256 value,
    bytes memory data,
    Enum.Operation operation
) public virtual returns (bool success) {
    // 只有启用的模块可以调用
    require(msg.sender != SENTINEL_MODULES && modules[msg.sender] != address(0));
    success = execute(to, value, data, operation, gasleft());
}
```

**模块示例：**

```solidity
// Allowance Module - 设置支出限额
contract AllowanceModule {
    // 给特定地址设置每日限额
    function setAllowance(
        address delegate,
        address token,
        uint96 allowanceAmount,
        uint16 resetTimeMin
    ) public {
        // 存储限额配置
        allowances[msg.sender][delegate][token] = Allowance({
            amount: allowanceAmount,
            spent: 0,
            resetTimeMin: resetTimeMin,
            lastResetMin: uint32(block.timestamp / 60)
        });
    }

    // Delegate 可以在限额内消费（无需多签）
    function executeAllowanceTransfer(
        Safe safe,
        address token,
        address payable to,
        uint96 amount
    ) public {
        // 检查限额
        require(amount <= remainingAllowance(safe, msg.sender, token));

        // 直接从 Safe 转账（无需多签！）
        safe.execTransactionFromModule(
            token,
            0,
            abi.encodeWithSignature("transfer(address,uint256)", to, amount),
            Enum.Operation.Call
        );

        // 更新已使用额度
        allowances[safe][msg.sender][token].spent += amount;
    }
}
```

### 关键技术细节

#### 1. CREATE2 确定性部署

Safe 可以预测部署地址：

```solidity
// Safe Proxy Factory 使用 CREATE2
function createProxyWithNonce(
    address _singleton,
    bytes memory initializer,
    uint256 saltNonce
) public returns (SafeProxy proxy) {
    bytes32 salt = keccak256(abi.encodePacked(
        keccak256(initializer),
        saltNonce
    ));

    bytes memory deploymentData = abi.encodePacked(
        type(SafeProxy).creationCode,
        uint256(uint160(_singleton))
    );

    // CREATE2 部署
    assembly {
        proxy := create2(0x0, add(0x20, deploymentData), mload(deploymentData), salt)
    }
}

// 好处
✅ 可以在部署前知道地址
✅ 多链相同地址（如果使用相同参数）
✅ 便于跨链协调
```

#### 2. Gas 抽象

Safe 支持用任何代币支付 Gas：

```solidity
function handlePayment(
    uint256 gasUsed,
    uint256 baseGas,
    uint256 gasPrice,
    address gasToken,
    address payable refundReceiver
) private {
    // 计算总 Gas 成本
    uint256 payment = (gasUsed + baseGas) * gasPrice;

    if (gasToken == address(0)) {
        // 使用 ETH 支付
        require(refundReceiver.send(payment));
    } else {
        // 使用 ERC20 代币支付
        require(transferToken(gasToken, refundReceiver, payment));
    }
}

// 使用场景
✅ 用户无需持有 ETH
✅ 可以用 USDC、DAI 等支付 Gas
✅ Relayer 服务可以代付 Gas
```

#### 3. 签名聚合优化

Safe v1.3.0+ 支持签名聚合：

```solidity
// 传统方式：每个签名者单独签名（65 字节 × 3 = 195 字节）
bytes memory signatures = abi.encodePacked(sig1, sig2, sig3);

// 优化方式：使用合约签名（EIP-1271）
// 如果签名者本身是 Safe，可以避免收集多个签名
contract SafeAsSigner {
    function isValidSignature(bytes32 hash, bytes memory signature)
        public
        view
        returns (bytes4 magic)
    {
        // 检查是否已批准该哈希
        if (approvedHashes[hash] != 0) {
            return EIP1271_MAGIC_VALUE;
        }
        return 0xffffffff;
    }
}
```

#### 4. 批量执行（MultiSend）

```solidity
// MultiSend 合约允许批量执行
contract MultiSend {
    function multiSend(bytes memory transactions) public payable {
        // transactions 格式:
        // [operation, to, value, dataLength, data] 重复 N 次

        assembly {
            let length := mload(transactions)
            let i := 0x20
            for { } lt(i, add(0x20, length)) { } {
                // 解析每个交易
                let operation := shr(248, mload(add(transactions, i)))
                let to := shr(96, mload(add(transactions, add(i, 0x01))))
                let value := mload(add(transactions, add(i, 0x15)))
                let dataLength := mload(add(transactions, add(i, 0x35)))

                // 执行交易
                let success := 0
                switch operation
                case 0 {
                    success := call(gas(), to, value, add(transactions, add(i, 0x55)), dataLength, 0, 0)
                }
                case 1 {
                    success := delegatecall(gas(), to, add(transactions, add(i, 0x55)), dataLength, 0, 0)
                }

                if eq(success, 0) {
                    revert(0, 0)
                }

                i := add(i, add(0x55, dataLength))
            }
        }
    }
}

// 使用示例
safe.execTransaction(
    multiSendAddress,
    0,
    abi.encodeWithSignature("multiSend(bytes)", encodedTransactions),
    Enum.Operation.DelegateCall,  // 使用 delegatecall
    ...
)
```

### 安全性分析

#### 1. 已知攻击面

| 攻击向量 | 防护措施 | 风险等级 |
|---------|---------|---------|
| **重放攻击** | Nonce + EIP-712 | ✅ 已防护 |
| **跨链重放** | domainSeparator 包含 chainId | ✅ 已防护 |
| **签名伪造** | ECDSA + 签名者验证 | ✅ 已防护 |
| **重入攻击** | Checks-Effects-Interactions 模式 | ✅ 已防护 |
| **签名者权限滥用** | 需要达到阈值 | ⚠️ 取决于配置 |
| **模块恶意行为** | 需要 Safe 授权启用 | ⚠️ 需要审计模块 |
| **Proxy 升级** | 需要多签批准 | ✅ 已防护 |

#### 2. 审计历史

Safe 经过多次安全审计：

```
✅ Consensys Diligence (2018, 2019, 2020)
✅ G0 Group (2020)
✅ OpenZeppelin (2021)
✅ Ackee Blockchain (2022)
✅ Formal Verification by Certora (2022)

总锁仓价值 (TVL): $100B+
运行时间: 5+ 年
已部署 Safe 数量: 100万+
```

#### 3. 升级机制

```solidity
// Safe 可以通过 DELEGATECALL 升级到新版本
function changeMasterCopy(address _masterCopy) public authorized {
    require(_masterCopy != address(0));
    require(_masterCopy != address(this));

    // 验证新的 master copy 是有效的 Safe 合约
    require(
        ISignatureValidator(_masterCopy).getThreshold() >= 1,
        "Invalid master copy"
    );

    masterCopy = _masterCopy;
    emit ChangedMasterCopy(_masterCopy);
}

// 升级需要
✅ 达到阈值的签名者同意
✅ 新合约必须是有效的 Safe 实现
✅ 存储布局兼容（防止数据损坏）
```

### 性能与成本

#### Gas 消耗对比

```
操作类型                    普通钱包      Safe (2/3)    增加比例
═══════════════════════════════════════════════════════════
ETH 转账                    21,000       ~100,000      +376%
ERC20 转账                  ~65,000      ~150,000      +131%
NFT 转移                    ~85,000      ~170,000      +100%
复杂合约交互                ~150,000     ~250,000      +67%
批量交易 (5 个操作)         ~500,000     ~350,000      -30% ✅

说明：
- Safe 的基础开销 ~80,000 gas (签名验证 + 执行逻辑)
- 签名者越多，验证成本越高
- 批量交易可以分摊基础开销，反而更便宜
```

#### 存储成本

```solidity
// Safe 主要存储
slot 0: singleton (address)           - 20 bytes
slot 1: threshold (uint256)           - 32 bytes
slot 2: nonce (uint256)               - 32 bytes
slot 3-N: owners (linked list)        - 32 bytes × owners
slot M: modules (linked list)         - 32 bytes × modules
slot X: approved hashes (mapping)     - 按需分配

// 部署成本
Proxy 部署: ~50,000 gas (~$10-30)
初始化 (3 owners): ~150,000 gas (~$30-90)
总计: ~$40-120 (取决于 Gas 价格)
```

### 与其他方案对比

| 方案 | 类型 | 安全性 | Gas 成本 | 灵活性 | 生态 |
|------|------|--------|---------|--------|------|
| **Safe** | 智能合约 | ⭐⭐⭐⭐⭐ | 中 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **MultiSigWallet** | 智能合约 | ⭐⭐⭐⭐ | 低 | ⭐⭐⭐ | ⭐⭐ |
| **Timelock** | 智能合约 | ⭐⭐⭐ | 低 | ⭐⭐ | ⭐⭐⭐ |
| **Account Abstraction** | ERC-4337 | ⭐⭐⭐⭐ | 高 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **MPC 钱包** | 链下 | ⭐⭐⭐⭐ | 低 | ⭐⭐⭐ | ⭐⭐ |

### 未来发展：Safe{Core} Protocol

Safe 正在向 **账户抽象 (Account Abstraction)** 方向发展：

```solidity
// Safe{Core} AA Stack
Safe Account (ERC-4337)
    ↓
UserOperation
    ↓
Bundler
    ↓
EntryPoint
    ↓
On-chain Execution

// 新特性
✅ 无需 ETH 的交易 (Paymaster)
✅ 批量交易原生支持
✅ 社交恢复内置
✅ 会话密钥 (Session Keys)
✅ 更低的 Gas 成本
```

---

## 创建 Safe 钱包

### 步骤 1：访问 Safe 官网

访问：**https://app.safe.global**

支持的网络：
- Ethereum 主网
- Sepolia 测试网
- Polygon
- Arbitrum
- Optimism
- Base
- 等 15+ 条链

### 步骤 2：连接钱包

使用你的**个人钱包**（如 MetaMask）连接 Safe：

```
1. 点击 "Connect Wallet"
2. 选择 MetaMask（或其他钱包）
3. 授权连接
```

**注意：** 你连接的这个钱包将成为 Safe 的**第一个签名者（Owner）**。

### 步骤 3：创建新 Safe

#### 选择网络

```
1. 点击右上角网络选择器
2. 选择你要部署的网络（建议先用测试网 Sepolia）
```

#### 配置 Safe 参数

**3.1 输入 Safe 名称**
```
例如：Team Treasury（仅本地显示，不上链）
```

**3.2 添加签名者（Owners）**

```typescript
// 示例配置
签名者 1: 0x1234...（你的 MetaMask 地址）
签名者 2: 0x5678...（团队成员 A 的地址）
签名者 3: 0x9abc...（团队成员 B 的地址）
```

**如何添加：**
```
1. 点击 "Add another owner"
2. 输入签名者地址
3. 为每个签名者设置名称（方便识别）
```

**3.3 设置确认阈值（Threshold）**

```
阈值 = 需要多少个签名者确认才能执行交易

常见配置：
- 2/3: 三个签名者中需要两个确认（推荐）
- 3/5: 五个签名者中需要三个确认
- 1/1: 单签（失去多签优势，不推荐）
- 5/5: 所有人必须确认（太严格，不推荐）

推荐配置：
- 小团队（2-3人）: 2/2 或 2/3
- 中等团队（4-7人）: 3/5 或 4/7
- 大型组织（8+人）: 过半数或 60%
```

**3.4 审核和创建**

```
Gas 费用预估：
- Ethereum 主网: ~$50-150（取决于 Gas 价格）
- Sepolia 测试网: 免费（测试 ETH）
- Polygon: ~$0.01-0.1
```

点击 **"Create"** 并确认交易。

### 步骤 4：部署完成

部署成功后，你会看到：

```
✅ Safe 已创建！

Safe 地址: 0xabcd...1234
网络: Ethereum Sepolia
签名者: 3 个
阈值: 2/3
```

**重要：** 这个 Safe 地址是一个**智能合约地址**，可以像普通地址一样接收资产。

---

## Safe 钱包基本使用

### 接收资产

Safe 地址可以像普通地址一样接收：

```typescript
// 发送 ETH 到 Safe
const safeAddress = "0xYourSafeAddress..."

// 任何人都可以向 Safe 转账
await sendETH(safeAddress, "1.0 ETH")

// 支持的资产类型
✅ ETH
✅ ERC20 代币（USDC、DAI、WETH 等）
✅ ERC721 NFT
✅ ERC1155 多重代币
```

### 发起交易

**场景：从 Safe 向外转账**

#### 1. 创建交易提案

```
1. 进入 Safe 界面
2. 点击 "New Transaction" → "Send tokens"
3. 填写接收地址和金额
4. 点击 "Create"
```

此时交易状态：**等待签名 (1/2)**

#### 2. 第一个签名

```
作为发起人，你会自动签名
状态更新为: 1/2 签名完成
```

#### 3. 其他签名者确认

```
其他签名者需要：
1. 访问 https://app.safe.global
2. 连接他们的钱包
3. 选择对应的 Safe
4. 在 "Transactions" 中看到待处理交易
5. 点击 "Confirm" 并签名
```

#### 4. 执行交易

```
当达到阈值（例如 2/2）时：
- 最后一个签名者可以选择 "Execute"
- 支付 Gas 费用
- 交易上链执行 ✅
```

### 交易队列（Queue）

Safe 支持**批量交易队列**：

```
待处理交易：
├── Transaction #1: 发送 100 USDC (1/3 签名)
├── Transaction #2: 发送 0.5 ETH  (2/3 签名) ✅ 可执行
└── Transaction #3: 调用合约     (0/3 签名)

优点：
- 可以同时发起多个交易
- 按顺序执行（通过 nonce 控制）
- 提高效率
```

### 交易历史

```
https://app.safe.global → Transactions → History

可以查看：
✅ 已执行的交易
✅ 失败的交易
✅ 签名者是谁
✅ 执行时间
✅ Gas 消耗
```

---

## 在 dApp 中集成 Safe

### 方案 1：Safe App（推荐）

**将你的 dApp 作为 Safe App 运行**

#### 1. 添加 Safe Apps SDK

```bash
cd packages/nextjs
yarn add @safe-global/safe-apps-sdk @safe-global/safe-apps-react-sdk
```

#### 2. 检测 Safe 环境

```typescript
// hooks/useSafeApp.ts
import { useSafeAppsSDK } from '@safe-global/safe-apps-react-sdk'

export function useSafeApp() {
  const { safe, sdk } = useSafeAppsSDK()

  return {
    isSafeApp: !!safe,
    safeAddress: safe?.safeAddress,
    chainId: safe?.chainId,
    sdk,
  }
}
```

#### 3. 在 dApp 中使用

```typescript
// components/StakeButton.tsx
import { useSafeApp } from '~~/hooks/useSafeApp'
import { useScaffoldWriteContract } from '~~/hooks/scaffold-eth'

export function StakeButton() {
  const { isSafeApp, safeAddress } = useSafeApp()
  const { writeContractAsync } = useScaffoldWriteContract("StakableNFT")

  const handleStake = async () => {
    if (isSafeApp) {
      // 在 Safe 环境中，交易会被发送到 Safe 进行多签
      console.log('发起 Safe 多签交易')
    }

    await writeContractAsync({
      functionName: "stake",
      args: [tokenId],
    })
  }

  return (
    <button onClick={handleStake}>
      {isSafeApp ? 'Propose Stake (需要多签)' : 'Stake NFT'}
    </button>
  )
}
```

#### 4. 部署并添加到 Safe

```bash
# 部署 dApp
yarn vercel

# 获得 URL，例如: https://my-nft-stake.vercel.app
```

**在 Safe 中添加：**
```
1. 访问 https://app.safe.global
2. Apps → Add custom app
3. 输入: https://my-nft-stake.vercel.app
4. 名称: NFT Staking
5. 添加

现在你的 dApp 运行在 Safe iframe 中！
用户在 dApp 中发起的交易会自动变成多签交易。
```

### 方案 2：WalletConnect + Safe

Safe 支持通过 WalletConnect 连接：

```typescript
// 用户流程
1. 在你的 dApp 中点击 "Connect Wallet"
2. 选择 "WalletConnect"
3. 扫码 → 在 Safe Mobile App 中确认
4. 连接成功！

// 优点
✅ 移动端友好
✅ 无需部署为 Safe App
✅ 支持所有 dApp

// 缺点
❌ 需要安装 Safe Mobile App
❌ 体验不如 Safe App 流畅
```

### 方案 3：Safe SDK（高级）

直接使用 Safe SDK 构建自定义功能：

```typescript
import Safe, { SafeFactory } from '@safe-global/protocol-kit'
import { ethers } from 'ethers'

// 连接到现有 Safe
const safe = await Safe.create({
  ethAdapter,
  safeAddress: '0xYourSafeAddress',
})

// 创建交易
const safeTransaction = await safe.createTransaction({
  transactions: [
    {
      to: '0xRecipient',
      value: ethers.utils.parseEther('0.1').toString(),
      data: '0x',
    }
  ]
})

// 签名
const signedTx = await safe.signTransaction(safeTransaction)

// 提交给其他签名者
const txHash = await safe.getTransactionHash(signedTx)
```

---

## 高级功能

### 1. 批量交易（Transaction Batching）

一次性执行多个操作：

```typescript
// 场景：一次性质押 3 个 NFT
const transactions = [
  {
    to: nftContractAddress,
    data: encodeStake(tokenId1),
    value: '0',
  },
  {
    to: nftContractAddress,
    data: encodeStake(tokenId2),
    value: '0',
  },
  {
    to: nftContractAddress,
    data: encodeStake(tokenId3),
    value: '0',
  },
]

// Safe 会原子化执行（全部成功或全部失败）
await safe.createTransaction({ transactions })
```

**优点：**
- 节省 Gas（只需一次确认）
- 原子性（全有或全无）
- 提高效率

### 2. 模块系统（Modules）

扩展 Safe 功能：

```typescript
// 常用模块
1. Allowance Module - 给特定地址设置支出限额
2. Spending Limit Module - 每日/每周支出限制
3. Social Recovery Module - 通过朋友恢复访问权限
4. Zodiac Suite - 高级 DAO 治理工具

// 示例：设置每日支出限额
await safe.enableModule(allowanceModuleAddress)
await allowanceModule.setAllowance(
  delegate: '0xTeamMemberAddress',
  token: USDC_ADDRESS,
  amount: parseUnits('1000', 6), // 每日 1000 USDC
  resetTimeMin: 1440, // 24 小时
)
```

### 3. Safe Guards

在交易执行前/后添加检查：

```typescript
// 示例：限制只能与特定合约交互
const guard = new TransactionGuard({
  allowedTargets: [
    UNISWAP_ROUTER,
    AAVE_POOL,
    YOUR_NFT_CONTRACT,
  ]
})

await safe.setGuard(guard.address)

// 现在 Safe 只能与这些合约交互
// 其他交易会被自动拒绝
```

### 4. 离线签名（Gasless）

签名者无需持有 ETH：

```
签名者 1: 签名交易 (无需 Gas)
签名者 2: 签名交易 (无需 Gas)
执行者:   最后执行并支付 Gas

优点：
- 签名者不需要 ETH
- 灵活的 Gas 支付策略
- 可以用代币支付 Gas（通过 Relayer）
```

### 5. Safe{Wallet} API

查询 Safe 数据：

```typescript
// 获取 Safe 信息
GET https://safe-transaction-mainnet.safe.global/api/v1/safes/{address}/

// 获取待处理交易
GET https://safe-transaction-mainnet.safe.global/api/v1/safes/{address}/multisig-transactions/

// 示例响应
{
  "address": "0xYourSafe",
  "nonce": 5,
  "threshold": 2,
  "owners": ["0x123...", "0x456..."],
  "balance": "1000000000000000000" // 1 ETH
}
```

---

## 最佳实践

### 1. 签名者选择

```
❌ 不好的配置
- 所有签名者都是同一个人的不同钱包
- 签名者之间没有信任关系
- 阈值设置为 1（失去多签优势）

✅ 好的配置
- 签名者是不同的人
- 至少 2/3 或更高阈值
- 考虑地理分布（避免同一地点）
- 使用硬件钱包作为签名者
```

### 2. 阈值设置

```typescript
// 根据风险等级调整
const thresholdRecommendations = {
  低风险: {
    owners: 3,
    threshold: 2, // 2/3
    example: "小额测试资金"
  },
  中风险: {
    owners: 5,
    threshold: 3, // 3/5
    example: "团队运营资金"
  },
  高风险: {
    owners: 7,
    threshold: 5, // 5/7
    example: "大额项目金库"
  }
}
```

### 3. 安全检查清单

```
部署前：
☑ 确认所有签名者地址正确
☑ 测试网先部署测试
☑ 阈值设置合理
☑ 文档化签名者身份

部署后：
☑ 发送小额资金测试
☑ 测试完整的多签流程
☑ 确保所有签名者能访问
☑ 备份 Safe 地址

日常使用：
☑ 大额交易前通知所有签名者
☑ 定期审计交易历史
☑ 及时更新签名者（如有人离职）
☑ 考虑使用 Safe Guards 限制权限
```

### 4. 应急预案

```typescript
// 场景 1: 签名者私钥丢失
解决方案：
- 如果剩余签名者 >= 阈值，可以移除丢失者
- 添加新签名者替换

步骤：
1. 发起 "Settings" → "Owners" → "Remove owner"
2. 达到阈值后执行
3. 添加新签名者

// 场景 2: 需要紧急资金访问
准备：
- 设置较低阈值的"应急 Safe"
- 使用模块系统设置每日限额
- 至少保持 2 个高可用签名者

// 场景 3: 签名者不响应
预防：
- 设置明确的响应时间要求
- 建立签名者沟通渠道
- 考虑使用时间锁模块
```

### 5. Gas 优化

```typescript
// Safe 交易比普通交易消耗更多 Gas
普通转账:   ~21,000 gas
Safe 转账:   ~100,000 gas

优化策略：
1. 批量交易 - 合并多个操作
2. 在 L2 使用 Safe（Polygon、Arbitrum）
3. Gas 价格低时执行
4. 使用 Relayer 服务（无 Gas 交易）
5. 考虑使用代币支付 Gas
```

---

## 实战示例：团队 NFT 质押管理

### 场景描述

你的团队有 3 个成员，共同管理 NFT 质押项目的资金。

### 步骤

#### 1. 创建 Safe

```
网络: Sepolia 测试网
签名者:
  - 0xAlice (团队负责人)
  - 0xBob   (开发者)
  - 0xCarol (运营)
阈值: 2/3
```

#### 2. 部署你的 dApp

```bash
# 部署到 Vercel
yarn vercel

# 获得 URL
https://nft-stake.vercel.app
```

#### 3. 在 Safe 中添加 dApp

```
Safe → Apps → Add custom app
URL: https://nft-stake.vercel.app
名称: Team NFT Staking
```

#### 4. 团队工作流

```typescript
// Day 1: Alice 发起质押
Alice 在 Safe App 中质押 NFT #123
→ 创建交易提案 (1/3 签名)

// Day 1: Bob 确认
Bob 登录 Safe 确认交易
→ 交易状态 (2/3 签名) ✅ 可执行

// Day 1: Bob 执行
Bob 点击 "Execute"
→ 交易上链 ✅

// Day 2: 查看收益
所有人可以在 Safe 界面查看：
- 质押的 NFT 列表
- 赚取的奖励
- 交易历史
```

---

## 常见问题

### Q1: Safe 钱包要收费吗？

```
创建 Safe: 一次性 Gas 费（$10-50 在主网）
使用 Safe: 每笔交易需要 Gas（比普通钱包略高）
服务费:   完全免费，无隐藏费用
```

### Q2: 可以修改签名者吗？

```
✅ 可以
- 添加新签名者
- 移除现有签名者
- 修改阈值

需要：
- 达到当前阈值的签名者同意
- 支付 Gas 费用
```

### Q3: Safe 会被黑客攻击吗？

```
Safe 已经审计多次，管理超过 $100B 资产

风险点：
❌ 签名者私钥泄露（需要多个才能盗取资金）
❌ 钓鱼网站（确保使用 app.safe.global）
✅ 智能合约漏洞（极低风险，已审计）
```

### Q4: 如何导出 Safe？

```
Safe 是智能合约，不能像 MetaMask 那样导出私钥

访问方式：
- 任何签名者用自己的钱包连接 app.safe.global
- 通过 Safe 地址即可访问
- 签名者控制权限，而非"拥有" Safe
```

### Q5: Safe 支持哪些链？

```
当前支持 15+ 条链：
✅ Ethereum (主网 + 测试网)
✅ Polygon
✅ Arbitrum
✅ Optimism
✅ Base
✅ Gnosis Chain
✅ BNB Chain
✅ Avalanche
✅ zkSync Era
... 等更多

完整列表: https://safe.global/supported-chains
```

---

## 资源链接

### 官方资源

- **Safe 官网**: https://safe.global
- **Safe App**: https://app.safe.global
- **文档**: https://docs.safe.global
- **GitHub**: https://github.com/safe-global

### 开发者资源

- **Safe SDK**: https://github.com/safe-global/safe-core-sdk
- **Safe Apps SDK**: https://docs.safe.global/safe-apps/overview
- **API 文档**: https://docs.safe.global/api-overview

### 社区

- **Discord**: https://discord.gg/safe
- **Twitter**: @safe
- **论坛**: https://forum.safe.global

---

## 总结

Safe 钱包是企业级的多签解决方案：

**适合场景：**
✅ 团队资金管理
✅ DAO 金库
✅ 项目方资金
✅ 高价值资产保护
✅ 需要审计追踪的场景

**不适合场景：**
❌ 个人日常小额交易（Gas 成本高）
❌ 需要快速执行的交易（需要等待多签）
❌ 单人使用（失去多签优势）

**下一步行动：**
1. 在 Sepolia 测试网创建你的第一个 Safe
2. 添加团队成员作为签名者
3. 测试完整的多签流程
4. 将你的 dApp 集成为 Safe App
5. 在主网部署生产环境的 Safe

开始使用 Safe，让你的团队资产管理更安全、更透明！
