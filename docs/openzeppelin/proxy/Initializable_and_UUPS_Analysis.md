# Initializable & UUPS: 构建安全的逻辑合约

前文我们讨论了 Proxy 侧的原理，现在我们将视角切换到**逻辑合约 (Implementation)** 侧。
为了配合代理模式，逻辑合约必须遵守两项铁律：
1.  **禁欲主义**: 不能使用 `constructor`（构造函数），必须用 `Initializable`。
2.  **自我管理**: (UUPS模式下) 必须自带升级逻辑 `UUPSUpgradeable`。

本文将深度解析 OpenZeppelin 提供的这两个标准模块。

## 1. `Initializable.sol`: 构造函数的替身

### 1.1 为什么不能用构造函数？

*   **执行时机**: `constructor` 只在合约部署时执行一次。
*   **上下文**: 部署逻辑合约时，上下文是逻辑合约自己。
*   **数据存储**: 构造函数初始化的变量会写入**逻辑合约的 Storage**。
*   **问题**: 用户真正交互的是 Proxy 合约。Proxy 的 Storage 是空的！逻辑合约里初始化的值根本没写到 Proxy 里去。

**结论**: 我们需要一个普通的函数（通常叫 `initialize`），让 Proxy 在部署由于 `delegatecall` 去调用它，从而把状态写入 Proxy 的 Storage。

### 1.2 `initializer` 修饰符原理

既然是普通函数，就可能被多次调用。为了模拟构造函数“只运行一次”的特性，OpenZeppelin 发明了 `initializer` 修饰符。

**源码精髓**:
```solidity
abstract contract Initializable {
    struct InitializableStorage {
        uint64 _initialized; // 版本号
        bool _initializing;  // 是否正在初始化中
    }

    modifier initializer() {
        // ... (省略复杂的版本检查逻辑)
        if ($._initializing || $._initialized < 1) {
            $._initializing = true; // 上锁
            $._initialized = 1;     // 标记为版本 1
            _;                      // 执行函数体
            $._initializing = false; // 解锁
            emit Initialized(1);
        } else {
            revert InvalidInitialization();
        }
    }
}
```

### 1.3 `_disableInitializers()`：逻辑合约的“贞操带”

你经常会在构造函数里看到这句话：

```solidity
/// @custom:oz-upgrades-unsafe-allow constructor
constructor() {
    _disableInitializers();
}
```

**为什么？**:
*   逻辑合约本身也是一个合约，它也有自己的 Storage。
*   如果逻辑合约本身没有初始化，攻击者可以直接调用逻辑合约的 `initialize()`，把自己设为 Owner，然后（如果合约有自毁逻辑）摧毁逻辑合约。
*   这会导致所有指向它的 Proxy 全部瘫痪！
*   **_disableInitializers()** 会将逻辑合约的 `_initialized` 版本号直接设为 `type(uint64).max`，确保它在“肉身”状态下永远无法被初始化。

---

## 2. `UUPSUpgradeable.sol`: 赋予升级的能力

UUPS (Universal Upgradeable Proxy Standard) 是目前最主流的升级标准。它的核心思想是：**Logic Contract 定义升级规则**。

### 2.1 继承关系
你的合约 `MyContract` 继承 `UUPSUpgradeable`。而 `UUPSUpgradeable` 继承 `IERC1822Proxiable`。

### 2.2 核心函数：`upgradeToAndCall`

这个函数负责执行升级。但最关键的是，它包含了一个**钩子 (Hook)**：

```solidity
function upgradeToAndCall(address newImplementation, bytes memory data) public payable virtual onlyProxy {
    _authorizeUpgrade(newImplementation); // <--- 关键钩子
    _upgradeToAndCallUUPS(newImplementation, data);
}
```

### 2.3 必须重写的 `_authorizeUpgrade`

`UUPSUpgradeable` 是一个抽象合约，它强制你实现 `_authorizeUpgrade` 函数。这是你控制**谁有权升级合约**的唯一关口。

**典型实现**:
```solidity
import {OwnableUpgradeable} from "./OwnableUpgradeable.sol";

contract MyContract is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    function initialize() public initializer {
        __Ownable_init(msg.sender); // 初始化 Owner
        __UUPSUpgradeable_init();
    }

    // 只有 Owner 才能授权升级！
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
```
如果你忘了加 `onlyOwner`，那么**任何人**都可以调用 `upgradeTo` 把你的合约升级成一个恶意合约，盗走所有资产！

### 2.4 防止自毁机制 (Proxiable UUID)

UUPS 有一个安全检查：
*   在升级前，会检查 `newImplementation` 是否包含 `proxiableUUID()` 函数。
*   如果新合约忘了继承 `UUPSUpgradeable`，这个检查就会失败，升级回滚。
*   **目的**: 防止你升级到一个“不具备升级能力”的死合约，导致项目以后再也无法升级（把自己锁死了）。

---

## 3. 最佳实践清单

1.  **显式初始化父合约**:
    ```solidity
    function initialize() public initializer {
        __ERC20_init("Name", "Symbol");
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
    }
    ```
    不要漏掉任何一个父合约的 `__Init` 函数。

2.  **构造函数保护**:
    始终在 `constructor` 中调用 `_disableInitializers()`。

3.  **存储间隔 (Storage Gaps)**:
    在合约末尾保留 `uint256[50] __gap;`。
    (注意：OpenZeppelin v5 使用了 Namespace Storage，对 Gap 的依赖降低了，但对于传统布局仍然是必须要理解的概念)。

4.  **不可变量 (Immutable)**:
    尽量少用于逻辑合约，因为它们的值存在于逻辑合约的字节码中，而不是 Proxy 的 Storage 中。升级后，新逻辑合约里的 Immutable 变量可能会改变（这是特性也是风险）。
