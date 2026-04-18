# OpenZeppelin Utils 工具库学习指南

> 完整的 OpenZeppelin Contracts Utils 工具库功能分类、使用方法和实战示例

## 📚 目录

- [1. 概述](#1-概述)
- [2. 功能分类总览](#2-功能分类总览)
- [3. 安全防护类](#3-安全防护类)
- [4. 密码学工具类](#4-密码学工具类)
- [5. 数学运算类](#5-数学运算类)
- [6. 数据结构类](#6-数据结构类)
- [7. 字符串处理类](#7-字符串处理类)
- [8. 地址工具类](#8-地址工具类)
- [9. 合约部署类](#9-合约部署类)
- [10. 其他工具类](#10-其他工具类)
- [11. 学习路径建议](#11-学习路径建议)

---

## 1. 概述

OpenZeppelin Utils 提供了 30+ 个工具库,涵盖安全防护、密码学、数学运算、数据结构等多个方面,是智能合约开发的瑞士军刀。

**核心优势**:
- ✅ 经过严格审计,安全可靠
- ✅ Gas 优化,性能卓越
- ✅ 模块化设计,按需导入
- ✅ 完整的测试覆盖

---

## 2. 功能分类总览

```
utils/
├── 安全防护类 (3 个)
│   ├── ReentrancyGuard.sol       # 防重入攻击
│   ├── Pausable.sol              # 合约暂停
│   └── Nonces.sol                # Nonce 管理
│
├── 密码学工具类 (5 个)
│   ├── ECDSA.sol                 # 签名验证
│   ├── EIP712.sol                # 结构化签名
│   ├── MerkleProof.sol           # Merkle 树证明
│   ├── MessageHashUtils.sol      # 消息哈希
│   └── SignatureChecker.sol      # 签名检查
│
├── 数学运算类 (3 个)
│   ├── Math.sol                  # 数学函数
│   ├── SafeCast.sol              # 安全类型转换
│   └── SignedMath.sol            # 有符号数运算
│
├── 数据结构类 (5 个)
│   ├── EnumerableSet.sol         # 可枚举集合
│   ├── EnumerableMap.sol         # 可枚举映射
│   ├── BitMaps.sol               # 位图
│   ├── Checkpoints.sol           # 历史检查点
│   └── DoubleEndedQueue.sol      # 双端队列
│
├── 字符串处理类 (3 个)
│   ├── Strings.sol               # 字符串工具
│   ├── Base64.sol                # Base64 编解码
│   └── ShortStrings.sol          # 短字符串优化
│
├── 地址工具类 (1 个)
│   └── Address.sol               # 地址工具
│
├── 合约部署类 (2 个)
│   ├── Create2.sol               # CREATE2 部署
│   └── Clones.sol                # 最小代理克隆
│
└── 其他工具类 (5 个)
    ├── Context.sol               # 上下文抽象
    ├── Multicall.sol             # 批量调用
    ├── StorageSlot.sol           # 存储槽
    ├── Arrays.sol                # 数组工具
    └── introspection/            # 接口检测
```

---

## 3. 安全防护类

### 3.1 ReentrancyGuard.sol - 防重入攻击

**核心功能**: 防止递归调用导致的重入攻击

**提供的修饰器**:
- `nonReentrant` - 防止重入

**适用场景**:
- DeFi 协议(借贷、DEX、质押)
- 涉及 ETH 转账的合约
- 外部调用不可信合约

**使用示例**:
```solidity
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Vault is ReentrancyGuard {
    mapping(address => uint256) public balances;

    // 存款
    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    // 提款 - 防止重入攻击
    function withdraw(uint256 amount) external nonReentrant {
        require(balances[msg.sender] >= amount, "Insufficient balance");

        balances[msg.sender] -= amount;
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    }
}
```

**工作原理**:
```
第一次调用 withdraw()
  ├─> _status = ENTERED (锁定)
  ├─> 执行函数逻辑
  ├─> 如果 msg.sender.call 触发重入
  │     └─> 再次调用 withdraw()
  │           └─> 检查 _status == ENTERED
  │                 └─> revert "ReentrancyGuard: reentrant call"
  └─> _status = NOT_ENTERED (解锁)
```

---

### 3.2 Pausable.sol - 合约暂停

**核心功能**: 紧急情况下暂停合约功能

**提供的功能**:
- `whenNotPaused` 修饰器
- `whenPaused` 修饰器
- `_pause()` 内部函数
- `_unpause()` 内部函数
- `paused()` 查询状态

**适用场景**:
- 发现安全漏洞时紧急暂停
- 合约升级期间暂停操作
- 应急响应机制

**使用示例**:
```solidity
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PausableToken is Pausable, Ownable {
    mapping(address => uint256) public balances;

    constructor() Ownable(msg.sender) {}

    // 转账 - 暂停期间禁止
    function transfer(address to, uint256 amount) external whenNotPaused {
        balances[msg.sender] -= amount;
        balances[to] += amount;
    }

    // 紧急暂停
    function pause() external onlyOwner {
        _pause();
    }

    // 恢复运行
    function unpause() external onlyOwner {
        _unpause();
    }
}
```

---

### 3.3 Nonces.sol - Nonce 管理

**核心功能**: 管理账户的 nonce,防止重放攻击

**提供的功能**:
- `nonces(address)` - 查询 nonce
- `_useNonce(address)` - 使用并递增 nonce
- `_useCheckedNonce(address, uint256)` - 验证并使用指定 nonce

**适用场景**:
- ERC20 Permit (链下授权)
- 元交易 (Meta Transaction)
- 签名验证

**使用示例**:
```solidity
import "@openzeppelin/contracts/utils/Nonces.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract MetaTx is Nonces {
    function executeMetaTx(
        address from,
        address to,
        uint256 value,
        uint256 nonce,
        bytes memory signature
    ) external {
        // 验证 nonce
        _useCheckedNonce(from, nonce);

        // 验证签名
        bytes32 hash = keccak256(abi.encodePacked(from, to, value, nonce));
        address signer = ECDSA.recover(hash, signature);
        require(signer == from, "Invalid signature");

        // 执行交易
        _transfer(from, to, value);
    }

    function _transfer(address from, address to, uint256 value) internal {
        // 转账逻辑
    }
}
```

---

## 4. 密码学工具类

### 4.1 ECDSA.sol - 签名验证

**核心功能**: ECDSA 签名的生成和验证

**提供的函数**:
- `recover(bytes32 hash, bytes signature)` - 恢复签名者地址
- `toEthSignedMessageHash(bytes32 hash)` - 添加 ETH 前缀

**适用场景**:
- 链下授权验证
- 元交易签名
- 白名单验证

**使用示例**:
```solidity
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract SignatureVerifier {
    using ECDSA for bytes32;

    address public owner;

    constructor() {
        owner = msg.sender;
    }

    // 验证白名单签名
    function claimWithSignature(
        address account,
        uint256 amount,
        bytes memory signature
    ) external {
        // 构建消息哈希
        bytes32 hash = keccak256(abi.encodePacked(account, amount));

        // 添加 ETH 签名前缀
        bytes32 ethHash = hash.toEthSignedMessageHash();

        // 恢复签名者
        address signer = ethHash.recover(signature);

        // 验证签名者是所有者
        require(signer == owner, "Invalid signature");

        // 执行空投
        _mint(account, amount);
    }

    function _mint(address to, uint256 amount) internal {
        // 铸造逻辑
    }
}
```

**前端签名示例**:
```javascript
// 使用 ethers.js 生成签名
const account = "0x123...";
const amount = 100;

const hash = ethers.utils.solidityKeccak256(
  ["address", "uint256"],
  [account, amount]
);

const signature = await signer.signMessage(ethers.utils.arrayify(hash));
```

---

### 4.2 MerkleProof.sol - Merkle 树证明

**核心功能**: 验证 Merkle 树成员资格

**提供的函数**:
- `verify(bytes32[] proof, bytes32 root, bytes32 leaf)` - 验证单个证明
- `verifyMultiProof(...)` - 验证多个证明

**适用场景**:
- 白名单空投
- 压缩存储大量数据
- 链下计算,链上验证

**使用示例**:
```solidity
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract MerkleAirdrop {
    bytes32 public merkleRoot;
    mapping(address => bool) public claimed;

    constructor(bytes32 _root) {
        merkleRoot = _root;
    }

    // 领取空投
    function claim(bytes32[] calldata proof, uint256 amount) external {
        require(!claimed[msg.sender], "Already claimed");

        // 构建叶子节点
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, amount));

        // 验证 Merkle 证明
        require(
            MerkleProof.verify(proof, merkleRoot, leaf),
            "Invalid proof"
        );

        claimed[msg.sender] = true;
        _mint(msg.sender, amount);
    }

    function _mint(address to, uint256 amount) internal {
        // 铸造逻辑
    }
}
```

**生成 Merkle 树 (JavaScript)**:
```javascript
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');

// 白名单数据
const whitelist = [
  { address: "0xAbc...", amount: 100 },
  { address: "0xDef...", amount: 200 },
];

// 生成叶子节点
const leaves = whitelist.map(x =>
  keccak256(ethers.utils.solidityPack(["address", "uint256"], [x.address, x.amount]))
);

// 构建 Merkle 树
const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
const root = tree.getHexRoot();

// 生成证明
const leaf = leaves[0];
const proof = tree.getHexProof(leaf);
```

---

### 4.3 EIP712.sol - 结构化签名

**核心功能**: EIP-712 结构化数据签名

**提供的功能**:
- `_domainSeparatorV4()` - 获取域分隔符
- `_hashTypedDataV4(bytes32)` - 哈希类型化数据

**适用场景**:
- ERC20 Permit
- 元交易
- DAO 投票签名

**使用示例**:
```solidity
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract VoteWithSignature is EIP712 {
    using ECDSA for bytes32;

    mapping(address => uint256) public votes;

    bytes32 private constant VOTE_TYPEHASH =
        keccak256("Vote(address voter,uint256 proposalId,bool support)");

    constructor() EIP712("MyDAO", "1") {}

    // 链下签名,链上执行投票
    function voteWithSig(
        address voter,
        uint256 proposalId,
        bool support,
        bytes memory signature
    ) external {
        // 构建结构化哈希
        bytes32 structHash = keccak256(
            abi.encode(VOTE_TYPEHASH, voter, proposalId, support)
        );

        // 生成 EIP712 哈希
        bytes32 hash = _hashTypedDataV4(structHash);

        // 验证签名
        address signer = hash.recover(signature);
        require(signer == voter, "Invalid signature");

        // 执行投票
        votes[voter] = support ? 1 : 0;
    }
}
```

---

## 5. 数学运算类

### 5.1 Math.sol - 数学函数

**提供的函数**:
- `max(uint256 a, uint256 b)` - 最大值
- `min(uint256 a, uint256 b)` - 最小值
- `average(uint256 a, uint256 b)` - 平均值
- `sqrt(uint256 a)` - 平方根
- `log2(uint256 value)` - 对数
- `mulDiv(uint256 x, uint256 y, uint256 denominator)` - 乘除法(防溢出)

**使用示例**:
```solidity
import "@openzeppelin/contracts/utils/math/Math.sol";

contract PriceCalculator {
    using Math for uint256;

    // 计算平均价格
    function averagePrice(uint256 price1, uint256 price2)
        external
        pure
        returns (uint256)
    {
        return Math.average(price1, price2);
    }

    // 计算份额(防溢出)
    function calculateShare(
        uint256 totalReward,
        uint256 userStake,
        uint256 totalStake
    ) external pure returns (uint256) {
        // (totalReward * userStake) / totalStake
        return Math.mulDiv(totalReward, userStake, totalStake);
    }

    // 计算平方根
    function calculateSqrt(uint256 value) external pure returns (uint256) {
        return Math.sqrt(value);
    }
}
```

---

### 5.2 SafeCast.sol - 安全类型转换

**核心功能**: 安全地在不同整数类型间转换

**提供的函数**:
- `toUint256(int256)` - int256 → uint256
- `toUint128(uint256)` - uint256 → uint128
- `toInt256(uint256)` - uint256 → int256
- ... 等多个转换函数

**使用示例**:
```solidity
import "@openzeppelin/contracts/utils/math/SafeCast.sol";

contract TimeCalculator {
    using SafeCast for uint256;

    // 安全转换为 uint32 (时间戳)
    function setDeadline(uint256 timestamp) external {
        // 如果 timestamp 超过 uint32 最大值,会 revert
        uint32 deadline = timestamp.toUint32();
        // 使用 deadline...
    }

    // 安全转换为 int256
    function calculateDelta(uint256 a, uint256 b)
        external
        pure
        returns (int256)
    {
        if (a > b) {
            return (a - b).toInt256();
        } else {
            return -(b - a).toInt256();
        }
    }
}
```

---

## 6. 数据结构类

### 6.1 EnumerableSet.sol - 可枚举集合

**核心功能**: O(1) 添加/删除/查询,支持遍历

**提供的集合类型**:
- `AddressSet` - 地址集合
- `Bytes32Set` - bytes32 集合
- `UintSet` - uint256 集合

**主要函数**:
- `add(value)` - 添加元素
- `remove(value)` - 移除元素
- `contains(value)` - 检查是否存在
- `length()` - 集合大小
- `at(index)` - 获取索引处的元素
- `values()` - 返回所有值

**使用示例**:
```solidity
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract Whitelist {
    using EnumerableSet for EnumerableSet.AddressSet;

    EnumerableSet.AddressSet private _whitelist;

    // 添加到白名单
    function addToWhitelist(address account) external {
        _whitelist.add(account);
    }

    // 从白名单移除
    function removeFromWhitelist(address account) external {
        _whitelist.remove(account);
    }

    // 检查是否在白名单
    function isWhitelisted(address account) external view returns (bool) {
        return _whitelist.contains(account);
    }

    // 获取白名单数量
    function whitelistCount() external view returns (uint256) {
        return _whitelist.length();
    }

    // 获取所有白名单地址
    function getAllWhitelisted() external view returns (address[] memory) {
        return _whitelist.values();
    }

    // 获取指定索引的地址
    function getWhitelistedAt(uint256 index)
        external
        view
        returns (address)
    {
        return _whitelist.at(index);
    }
}
```

---

### 6.2 EnumerableMap.sol - 可枚举映射

**核心功能**: 可遍历的键值对映射

**提供的映射类型**:
- `AddressToUintMap`
- `Bytes32ToUintMap`
- `UintToAddressMap`
- `UintToUintMap`

**使用示例**:
```solidity
import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";

contract TokenRegistry {
    using EnumerableMap for EnumerableMap.UintToAddressMap;

    // tokenId => tokenAddress
    EnumerableMap.UintToAddressMap private _tokens;

    // 注册代币
    function registerToken(uint256 tokenId, address tokenAddress) external {
        _tokens.set(tokenId, tokenAddress);
    }

    // 获取代币地址
    function getToken(uint256 tokenId) external view returns (address) {
        return _tokens.get(tokenId);
    }

    // 获取所有代币 ID
    function getAllTokenIds() external view returns (uint256[] memory) {
        uint256 length = _tokens.length();
        uint256[] memory ids = new uint256[](length);

        for (uint256 i = 0; i < length; i++) {
            (ids[i], ) = _tokens.at(i);
        }

        return ids;
    }
}
```

---

### 6.3 BitMaps.sol - 位图

**核心功能**: 使用位图高效存储布尔值

**适用场景**:
- 大量布尔标记(如已领取空投)
- 节省存储成本

**使用示例**:
```solidity
import "@openzeppelin/contracts/utils/structs/BitMaps.sol";

contract AirdropClaim {
    using BitMaps for BitMaps.BitMap;

    BitMaps.BitMap private _claimed;

    // 领取空投
    function claim(uint256 index) external {
        require(!_claimed.get(index), "Already claimed");

        _claimed.set(index);
        // 发放奖励...
    }

    // 检查是否已领取
    function hasClaimed(uint256 index) external view returns (bool) {
        return _claimed.get(index);
    }
}
```

**Gas 对比**:
```
存储 1000 个布尔值:
- mapping(uint256 => bool): ~20,000,000 gas
- BitMaps: ~1,000,000 gas
节省 95% gas!
```

---

## 7. 字符串处理类

### 7.1 Strings.sol - 字符串工具

**提供的函数**:
- `toString(uint256)` - 数字转字符串
- `toHexString(uint256)` - 转十六进制字符串
- `toHexString(address)` - 地址转字符串
- `equal(string, string)` - 字符串比较

**使用示例**:
```solidity
import "@openzeppelin/contracts/utils/Strings.sol";

contract NFTMetadata {
    using Strings for uint256;
    using Strings for address;

    string public baseURI = "https://api.example.com/token/";

    // 生成 tokenURI
    function tokenURI(uint256 tokenId) external view returns (string memory) {
        return string(abi.encodePacked(baseURI, tokenId.toString()));
        // 返回: "https://api.example.com/token/123"
    }

    // 地址转字符串
    function addressToString(address account)
        external
        pure
        returns (string memory)
    {
        return account.toHexString();
        // 返回: "0xabc..."
    }
}
```

---

### 7.2 Base64.sol - Base64 编解码

**核心功能**: Base64 编码(链上生成 JSON/SVG)

**使用示例**:
```solidity
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract OnChainNFT {
    using Strings for uint256;

    // 生成 Base64 编码的 JSON 元数据
    function tokenURI(uint256 tokenId) external pure returns (string memory) {
        string memory json = string(
            abi.encodePacked(
                '{"name": "Token #',
                tokenId.toString(),
                '", "description": "On-chain NFT"}'
            )
        );

        string memory base64Json = Base64.encode(bytes(json));

        return
            string(
                abi.encodePacked("data:application/json;base64,", base64Json)
            );
    }

    // 生成 SVG 图片
    function generateSVG(uint256 tokenId)
        external
        pure
        returns (string memory)
    {
        string memory svg = string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg">',
                '<text x="10" y="20">Token #',
                tokenId.toString(),
                "</text>",
                "</svg>"
            )
        );

        string memory base64Svg = Base64.encode(bytes(svg));

        return string(abi.encodePacked("data:image/svg+xml;base64,", base64Svg));
    }
}
```

---

## 8. 地址工具类

### 8.1 Address.sol - 地址工具

**提供的函数**:
- `isContract(address)` - 判断是否为合约
- `sendValue(address payable, uint256)` - 安全发送 ETH
- `functionCall(address, bytes)` - 调用合约函数
- `functionStaticCall(address, bytes)` - 静态调用
- `functionDelegateCall(address, bytes)` - 委托调用

**使用示例**:
```solidity
import "@openzeppelin/contracts/utils/Address.sol";

contract Payment {
    using Address for address;
    using Address for address payable;

    // 检查地址类型
    function checkAddress(address account) external view returns (string memory) {
        if (account.isContract()) {
            return "Contract";
        } else {
            return "EOA";
        }
    }

    // 安全发送 ETH
    function sendEther(address payable recipient, uint256 amount) external {
        recipient.sendValue(amount);
    }

    // 调用其他合约
    function callContract(address target, bytes memory data)
        external
        returns (bytes memory)
    {
        return target.functionCall(data);
    }
}
```

---

## 9. 合约部署类

### 9.1 Create2.sol - CREATE2 部署

**核心功能**: 可预测地址的合约部署

**提供的函数**:
- `deploy(uint256 amount, bytes32 salt, bytes bytecode)` - 部署合约
- `computeAddress(bytes32 salt, bytes32 bytecodeHash)` - 计算地址

**使用示例**:
```solidity
import "@openzeppelin/contracts/utils/Create2.sol";

contract Factory {
    // 部署合约
    function deploy(bytes32 salt, bytes memory bytecode)
        external
        returns (address)
    {
        address addr = Create2.deploy(0, salt, bytecode);
        return addr;
    }

    // 预测地址
    function computeAddress(bytes32 salt, bytes memory bytecode)
        external
        view
        returns (address)
    {
        bytes32 hash = keccak256(bytecode);
        return Create2.computeAddress(salt, hash);
    }
}
```

---

## 10. 其他工具类

### 10.1 Context.sol - 上下文抽象

**核心功能**: 提供 `_msgSender()` 和 `_msgData()`

**为什么使用?**
- 支持元交易 (ERC-2771)
- 便于测试和扩展

**使用示例**:
```solidity
import "@openzeppelin/contracts/utils/Context.sol";

contract MyContract is Context {
    function doSomething() external {
        address sender = _msgSender(); // 而非 msg.sender
        bytes memory data = _msgData(); // 而非 msg.data
    }
}
```

---

### 10.2 Multicall.sol - 批量调用

**核心功能**: 一次交易执行多个函数调用

**使用示例**:
```solidity
import "@openzeppelin/contracts/utils/Multicall.sol";

contract Token is Multicall {
    mapping(address => uint256) public balances;

    function mint(address to, uint256 amount) external {
        balances[to] += amount;
    }

    function burn(address from, uint256 amount) external {
        balances[from] -= amount;
    }
}

// 前端批量调用
const calls = [
  contract.interface.encodeFunctionData("mint", [user1, 100]),
  contract.interface.encodeFunctionData("mint", [user2, 200]),
  contract.interface.encodeFunctionData("burn", [user3, 50])
];

await contract.multicall(calls);
```

---

## 11. 学习路径建议

### 初级 (1-2 周)
1. ✅ **ReentrancyGuard** - 防重入攻击(必学)
2. ✅ **Ownable** + **Pausable** - 访问控制和紧急暂停
3. ✅ **Strings** - 字符串处理
4. ✅ **Address** - 地址工具

### 中级 (3-4 周)
1. ✅ **ECDSA** + **MerkleProof** - 签名和 Merkle 树
2. ✅ **EnumerableSet** - 可枚举集合
3. ✅ **Math** + **SafeCast** - 数学运算
4. ✅ **Nonces** - Nonce 管理

### 高级 (5-8 周)
1. ✅ **EIP712** - 结构化签名
2. ✅ **BitMaps** - 位图优化
3. ✅ **Checkpoints** - 历史数据
4. ✅ **Create2** - 可预测部署

---

## 12. 快速参考表

| 工具 | 主要用途 | Gas 效率 | 难度 |
|------|---------|---------|------|
| ReentrancyGuard | 防重入 | 中 | ⭐ |
| Pausable | 紧急暂停 | 低 | ⭐ |
| ECDSA | 签名验证 | 中 | ⭐⭐ |
| MerkleProof | 白名单 | 高 | ⭐⭐ |
| EnumerableSet | 集合 | 中 | ⭐⭐ |
| BitMaps | 位图 | 高 | ⭐⭐⭐ |
| EIP712 | 结构化签名 | 中 | ⭐⭐⭐ |
| Create2 | 部署 | 中 | ⭐⭐⭐ |

---

## 13. 实战项目示例

### 完整的 NFT 空投合约
```solidity
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

contract AdvancedNFT is
    ERC721,
    Ownable,
    Pausable,
    ReentrancyGuard
{
    using Strings for uint256;

    bytes32 public merkleRoot;
    mapping(address => bool) public claimed;
    uint256 private _tokenIdCounter;

    constructor(bytes32 _root)
        ERC721("Advanced NFT", "ANFT")
        Ownable(msg.sender)
    {
        merkleRoot = _root;
    }

    // Merkle 白名单铸造
    function claimNFT(bytes32[] calldata proof)
        external
        nonReentrant
        whenNotPaused
    {
        require(!claimed[msg.sender], "Already claimed");

        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        require(MerkleProof.verify(proof, merkleRoot, leaf), "Not whitelisted");

        claimed[msg.sender] = true;
        _safeMint(msg.sender, _tokenIdCounter++);
    }

    // 链上生成 tokenURI
    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        require(_ownerOf(tokenId) != address(0), "Nonexistent token");

        string memory json = string(
            abi.encodePacked(
                '{"name": "NFT #',
                tokenId.toString(),
                '", "description": "Advanced on-chain NFT"}'
            )
        );

        return
            string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    Base64.encode(bytes(json))
                )
            );
    }

    // 紧急暂停
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
```

---

## 总结

OpenZeppelin Utils 提供了丰富的工具库,掌握这些工具可以:
- ✅ 显著提高开发效率
- ✅ 避免常见安全陷阱
- ✅ 优化 Gas 成本
- ✅ 编写更专业的代码

建议按照学习路径循序渐进,结合实战项目巩固知识!

---

**文档版本**: v1.0
**最后更新**: 2025-11-10
**作者**: Claude Code
