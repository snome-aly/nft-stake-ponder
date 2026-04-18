# Solidity ABI 编码完全指南

## 目录
1. [ABI 编码基础](#abi-编码基础)
2. [abi.encode vs abi.encodePacked](#abiEncode-vs-abiencodepacked)
3. [类型系统与编码](#类型系统与编码)
4. [bytes 和 string 的区别](#bytes-和-string-的区别)
5. [keccak256 哈希函数](#keccak256-哈希函数)
6. [实战应用场景](#实战应用场景)
7. [安全注意事项](#安全注意事项)

---

## ABI 编码基础

### 什么是 ABI 编码？

ABI (Application Binary Interface) 编码是 Solidity 将数据序列化为字节的标准方式，用于：
- 合约间通信
- 函数调用编码
- 事件日志
- 数据存储

### 为什么需要 ABI 编码？

1. **标准化数据格式** - 合约间通信需要统一的编码标准
2. **类型安全** - 保留类型信息，可以正确解码
3. **计算哈希** - 将多个参数组合成单一字节序列
4. **节省 gas** - `encodePacked` 在某些场景下更经济

---

## abi.encode vs abi.encodePacked

### 1. 核心区别

| 特性 | abi.encode | abi.encodePacked |
|------|-----------|------------------|
| **编码方式** | 32字节对齐填充 | 紧密打包，无填充 |
| **编码长度** | 较长 | 较短 |
| **可解码性** | ✅ 可用 `abi.decode()` | ❌ 无法解码 |
| **Gas 消耗** | 较高 | 较低 |
| **类型边界** | ✅ 保留 | ❌ 丢失 |
| **动态类型** | ✅ 包含长度信息 | ❌ 无长度信息 |

### 2. 编码方式对比

#### abi.encode - 标准 ABI 编码

```solidity
uint8 a = 1;
uint8 b = 2;

bytes memory encoded = abi.encode(a, b);
// 结果: 64 字节
// 0x0000000000000000000000000000000000000000000000000000000000000001  (32字节)
//   0000000000000000000000000000000000000000000000000000000000000002  (32字节)
```

**特点：**
- 每个参数填充到 32 字节
- 保留类型边界
- 可以用 `abi.decode()` 解码

#### abi.encodePacked - 紧密打包

```solidity
uint8 a = 1;
uint8 b = 2;

bytes memory packed = abi.encodePacked(a, b);
// 结果: 2 字节
// 0x0102
```

**特点：**
- 最小字节表示，无填充
- 丢失类型边界
- 无法解码

### 3. 解码能力对比

#### abi.encode 可以解码

```solidity
// 编码
bytes memory encoded = abi.encode(uint256(100), address(0x1234...));

// ✅ 解码 - 提供类型签名
(uint256 num, address addr) = abi.decode(encoded, (uint256, address));
```

#### abi.encodePacked 无法解码

```solidity
// 编码
bytes memory packed = abi.encodePacked(uint8(1), uint8(2));
// 结果: 0x0102

// ❌ Solidity 没有 abi.decodePacked 函数！
// 无法知道这是:
// - 两个 uint8: (1, 2)
// - 一个 uint16: 258
// - 两个 bytes1: (0x01, 0x02)
```

### 4. 动态类型编码

#### abi.encode - 包含完整结构信息

```solidity
string memory str1 = "hello";
string memory str2 = "world";

bytes memory encoded = abi.encode(str1, str2);
```

**编码结果结构：**
```
偏移量     内容                             说明
---------------------------------------------------------------
0x00      0x0000...0040                    str1 的数据位置（偏移 64字节）
0x20      0x0000...0080                    str2 的数据位置（偏移 128字节）
0x40      0x0000...0005                    str1 的长度（5）
0x60      0x68656c6c6f...                  str1 的内容 "hello"
0x80      0x0000...0005                    str2 的长度（5）
0xa0      0x776f726c64...                  str2 的内容 "world"
```

#### abi.encodePacked - 仅连接内容

```solidity
string memory str1 = "hello";
string memory str2 = "world";

bytes memory packed = abi.encodePacked(str1, str2);
// 结果: 0x68656c6c6f776f726c64 ("helloworld")

// ❌ 无法知道原始边界
```

### 5. 使用场景

#### ✅ abi.encode 适用场景

```solidity
// 1. 跨合约调用
bytes memory callData = abi.encodeWithSignature(
    "transfer(address,uint256)",
    recipient,
    amount
);
(bool success, ) = token.call(callData);

// 2. 存储和读取数据
bytes memory stored = abi.encode(user, amount, timestamp);
(address u, uint256 a, uint256 t) = abi.decode(stored, (address, uint256, uint256));

// 3. 需要解码的场景
function storeData(uint256 a, address b) public {
    storedData = abi.encode(a, b);
}

function retrieveData() public view returns (uint256, address) {
    return abi.decode(storedData, (uint256, address));
}
```

#### ✅ abi.encodePacked 适用场景

```solidity
// 1. 计算哈希（最常用）
bytes32 hash = keccak256(abi.encodePacked(user, amount, nonce));

// 2. 拼接字符串
string memory fullName = string(abi.encodePacked(firstName, " ", lastName));

// 3. 生成签名消息
bytes32 messageHash = keccak256(abi.encodePacked(
    "\x19Ethereum Signed Message:\n32",
    keccak256(abi.encodePacked(data))
));

// 4. 生成唯一ID
function generateId(address user, uint256 nonce) public pure returns (bytes32) {
    return keccak256(abi.encodePacked(user, nonce));
}
```

---

## 类型系统与编码

### 1. abi.encode 如何保留类型信息？

**关键点：通过固定的编码规则保留，而不是在编码结果中存储类型名称**

```solidity
uint256 a = 100;
address b = 0x1234567890123456789012345678901234567890;

bytes memory encoded = abi.encode(a, b);
```

**编码结果：**
```
0x0000000000000000000000000000000000000000000000000000000000000064  // uint256: 100 (32字节)
  0000000000000000000000001234567890123456789012345678901234567890  // address (填充到32字节)
```

**类型信息保留方式：**
- ✅ 32字节对齐（每个值占据固定空间）
- ✅ 偏移量指针（动态类型）
- ✅ 长度字段（动态类型）
- ✅ 结构化的数据布局

**解码时必须提供类型签名：**

```solidity
// ✅ 正确解码 - 提供了正确的类型
(uint256 decoded_a, address decoded_b) = abi.decode(encoded, (uint256, address));

// ❌ 错误解码 - 类型不匹配会导致错误结果
(uint128 wrong_a, uint128 wrong_b) = abi.decode(encoded, (uint128, uint128));
```

### 2. abi.encodePacked 为什么丢失类型信息？

```solidity
uint8 a = 1;
uint8 b = 2;

bytes memory packed = abi.encodePacked(a, b);
// 结果: 0x0102 (仅2字节)

// ❌ 无法从 0x0102 判断这是:
// - 两个 uint8: (1, 2)
// - 一个 uint16: 258
// - 两个 bytes1
// - 部分 uint32
```

**类型边界完全消失：**
- ❌ 没有填充对齐
- ❌ 没有长度信息
- ❌ 无法确定边界

### 3. 固定长度类型的"手动"解析

如果**事先知道编码的类型和顺序**，可以手动切片：

```solidity
contract UnpackExample {
    // 编码固定长度类型
    function pack() public pure returns (bytes memory) {
        uint256 a = 100;
        address b = 0x1234567890123456789012345678901234567890;
        return abi.encodePacked(a, b);
        // 结果: 52 字节 (32 + 20)
    }

    // ✅ 手动解析（知道结构的情况下）
    function unpack(bytes memory data) public pure returns (uint256, address) {
        require(data.length == 52, "Invalid length");

        uint256 a;
        address b;

        // 使用汇编手动切片
        assembly {
            a := mload(add(data, 32))              // 前32字节
            b := mload(add(data, 52))              // 后20字节
        }

        return (a, b);
    }
}
```

**缺点：**
- ❌ 不通用，每个编码格式都要写专门的解析代码
- ❌ 容易出错
- ❌ Gas 效率不一定高
- ❌ 动态类型完全无法解析

---

## bytes 和 string 的区别

### 1. 核心区别

**重要：abi.encode 和 abi.encodePacked 返回的是 bytes，不是 string！**

```solidity
// ✅ 正确 - 返回 bytes
bytes memory encoded = abi.encode(123, "hello");

// ❌ 错误 - 编译错误
string memory encoded = abi.encode(123, "hello");
```

### 2. bytes vs string

| 特性 | bytes | string |
|------|-------|--------|
| **本质** | 任意二进制数据 | UTF-8 文本 |
| **内容** | 0x00-0xFF 任意字节 | 有效的 UTF-8 字符 |
| **可包含 0x00** | ✅ 可以 | ⚠️ 不应该（终止符） |
| **用于哈希** | ✅ 直接使用 | ✅ 需转 bytes |
| **显示友好** | ❌ 十六进制显示 | ✅ 文本显示 |
| **abi.encode 返回** | ✅ 是 | ❌ 不是 |

### 3. 类型转换

#### bytes → string（仅当 bytes 是有效的 UTF-8 时）

```solidity
// ✅ 安全：文本数据
bytes memory data1 = abi.encodePacked("hello", "world");
string memory text = string(data1);  // "helloworld"

// ❌ 危险：非文本的 bytes 转成 string
bytes memory data2 = abi.encode(uint256(123), address(0x0));
string memory invalid = string(data2);  // 包含不可打印字符！
```

#### string → bytes（总是安全）

```solidity
string memory str = "test";
bytes memory b = bytes(str);  // ✅ 总是安全
```

### 4. 实际例子

```solidity
contract BytesVsString {
    // ✅ 例1：纯文本编码 → 可转 string
    function textPacked() public pure returns (string memory) {
        bytes memory packed = abi.encodePacked("hello", " ", "world");
        // packed = 0x68656c6c6f20776f726c64 (ASCII 编码)
        return string(packed);  // "hello world"
    }

    // ❌ 例2：数字编码 → 不应转 string
    function numberPacked() public pure returns (bytes memory) {
        bytes memory packed = abi.encodePacked(uint256(123));
        // packed = 0x000000000000000000000000000000000000000000000000000000000000007b
        // string(packed) 会产生乱码（包含很多 0x00）
        return packed;  // 返回 bytes
    }

    // ✅ 例3：用于哈希
    function hashExample() public pure returns (bytes32) {
        bytes memory packed = abi.encodePacked(
            uint256(100),
            address(0x1234567890123456789012345678901234567890)
        );
        return keccak256(packed);  // 直接哈希 bytes
    }
}
```

### 5. 何时可以安全转换

#### ✅ 安全：bytes → string

```solidity
// 1. 拼接文本
string memory result = string(abi.encodePacked("Hello", " ", "World"));

// 2. Base64 编码（产生的是文本）
string memory encoded = Base64.encode(data);

// 3. JSON 字符串构建
string memory json = string(abi.encodePacked(
    '{"name":"', name, '","value":', value, '}'
));
```

#### ❌ 危险：bytes → string

```solidity
// 1. 编码数字
bytes memory data = abi.encode(uint256(123));
string memory bad = string(data);  // 包含 0x00 等不可打印字符

// 2. 哈希结果
bytes32 hash = keccak256("test");
string memory bad2 = string(abi.encodePacked(hash));  // 乱码

// 3. 地址编码
bytes memory data3 = abi.encodePacked(address(0x123...));
string memory bad3 = string(data3);  // 20字节的二进制数据，不是文本
```

---

## keccak256 哈希函数

### 1. 函数签名

```solidity
function keccak256(bytes memory) returns (bytes32);
```

**关键点：**
- ✅ **只接受 `bytes memory` 类型**
- ✅ 返回 `bytes32`（32字节的哈希值）
- ❌ 不接受其他类型（需要先转换）

### 2. 类型转换示例

```solidity
contract Keccak256Example {
    // ❌ 直接传数字 - 编译错误
    function wrong1() public pure returns (bytes32) {
        return keccak256(123);  // 编译错误！
    }

    // ❌ 直接传地址 - 编译错误
    function wrong2() public pure returns (bytes32) {
        return keccak256(msg.sender);  // 编译错误！
    }

    // ✅ 正确：使用 abi.encode 转成 bytes
    function correct1() public pure returns (bytes32) {
        return keccak256(abi.encode(123));
    }

    // ✅ 正确：使用 abi.encodePacked 转成 bytes
    function correct2() public pure returns (bytes32) {
        return keccak256(abi.encodePacked(msg.sender, 123));
    }

    // ✅ 正确：string 可以直接转 bytes
    function correct3() public pure returns (bytes32) {
        return keccak256(bytes("hello"));
    }

    // ✅ 正确：字符串字面量会自动转换
    function correct4() public pure returns (bytes32) {
        return keccak256("hello");  // 自动转成 bytes
    }
}
```

### 3. 为什么只接受 bytes？

因为哈希函数需要处理**任意长度的字节序列**：

```solidity
// keccak256 可以哈希任意长度的数据
keccak256(bytes("a"));                    // 1 字节
keccak256(abi.encodePacked(uint256(1)));  // 32 字节
keccak256(abi.encode(1, 2, 3, 4, 5));     // 160 字节
```

如果接受 `uint256`、`address` 等具体类型，就需要为每种类型定义重载函数，不灵活。

### 4. 编码方式的选择

```solidity
contract HashComparison {
    uint256 num = 123;
    address addr = 0x1234567890123456789012345678901234567890;

    // 方式1：abi.encodePacked（紧密打包，gas 更少）
    function hash1() public view returns (bytes32) {
        return keccak256(abi.encodePacked(num, addr));
        // bytes: 52字节（32 + 20）
    }

    // 方式2：abi.encode（标准编码，可解码）
    function hash2() public view returns (bytes32) {
        return keccak256(abi.encode(num, addr));
        // bytes: 64字节（32 + 32，address 填充到 32）
    }

    // ⚠️ 注意：两种方式产生不同的哈希值！
    // hash1() ≠ hash2()
}
```

**推荐：**
- ✅ 仅用于哈希 → 使用 `abi.encodePacked`（节省 gas）
- ✅ 需要标准格式 → 使用 `abi.encode`

### 5. 特殊情况：string 字面量

```solidity
// ✅ 字符串字面量可以直接传（自动转 bytes）
bytes32 hash1 = keccak256("hello");

// 等价于
bytes32 hash2 = keccak256(bytes("hello"));

// 但变量必须显式转换
string memory str = "hello";
bytes32 hash3 = keccak256(bytes(str));  // 必须显式转换
```

### 6. 类型转换流程图

```
任意类型 → bytes → keccak256 → bytes32
   ↓
abi.encode()         → bytes (标准编码，64字节)
abi.encodePacked()   → bytes (紧密打包，52字节)
bytes(string)        → bytes (字符串转字节)
```

---

## 实战应用场景

### 1. 生成唯一ID

```solidity
// 方式1：用户 + nonce
function generateUserId(address user, uint256 nonce) public pure returns (bytes32) {
    return keccak256(abi.encodePacked(user, nonce));
}

// 方式2：多个参数组合
function generateOrderId(
    address buyer,
    address seller,
    uint256 amount,
    uint256 timestamp
) public pure returns (bytes32) {
    return keccak256(abi.encodePacked(buyer, seller, amount, timestamp));
}
```

### 2. 签名验证

```solidity
function verifySignature(
    address signer,
    uint256 amount,
    uint256 nonce,
    bytes memory signature
) public pure returns (bool) {
    // 生成消息哈希
    bytes32 messageHash = keccak256(abi.encodePacked(signer, amount, nonce));

    // 添加以太坊签名前缀
    bytes32 ethSignedMessageHash = keccak256(abi.encodePacked(
        "\x19Ethereum Signed Message:\n32",
        messageHash
    ));

    // ... 恢复签名者地址并验证
}
```

### 3. Merkle 树

```solidity
function hashPair(bytes32 a, bytes32 b) public pure returns (bytes32) {
    // 排序后哈希，避免顺序影响
    return a < b
        ? keccak256(abi.encodePacked(a, b))
        : keccak256(abi.encodePacked(b, a));
}

function verifyProof(
    bytes32[] memory proof,
    bytes32 root,
    bytes32 leaf
) public pure returns (bool) {
    bytes32 computedHash = leaf;

    for (uint256 i = 0; i < proof.length; i++) {
        computedHash = hashPair(computedHash, proof[i]);
    }

    return computedHash == root;
}
```

### 4. 字符串拼接

```solidity
// 拼接简单字符串
function concatStrings(string memory a, string memory b) public pure returns (string memory) {
    return string(abi.encodePacked(a, b));
}

// 拼接多个元素
function buildFullName(
    string memory firstName,
    string memory middleName,
    string memory lastName
) public pure returns (string memory) {
    return string(abi.encodePacked(firstName, " ", middleName, " ", lastName));
}

// 构建 JSON metadata
function buildMetadata(
    uint256 tokenId,
    string memory name,
    string memory image
) public pure returns (string memory) {
    return string(abi.encodePacked(
        '{"tokenId":', Strings.toString(tokenId), ',',
        '"name":"', name, '",',
        '"image":"', image, '"}'
    ));
}
```

### 5. 随机数生成（伪随机）

```solidity
// ⚠️ 注意：这不是真正的随机数，生产环境应使用 Chainlink VRF
function pseudoRandom(uint256 nonce) public view returns (uint256) {
    return uint256(keccak256(abi.encodePacked(
        block.timestamp,
        block.prevrandao,
        msg.sender,
        nonce
    )));
}
```

### 6. 访问控制角色

```solidity
// 生成角色哈希
bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

// 自定义角色
function createRole(string memory roleName) public pure returns (bytes32) {
    return keccak256(bytes(roleName));
}
```

### 7. 跨合约调用编码

```solidity
// 编码函数调用
function callTransfer(
    address token,
    address recipient,
    uint256 amount
) public returns (bool) {
    bytes memory callData = abi.encodeWithSignature(
        "transfer(address,uint256)",
        recipient,
        amount
    );

    (bool success, bytes memory result) = token.call(callData);
    require(success, "Transfer failed");

    // 解码返回值
    return abi.decode(result, (bool));
}

// 编码带选择器的调用
function encodeCall(address to, uint256 value) public pure returns (bytes memory) {
    return abi.encodeWithSelector(
        bytes4(keccak256("someFunction(address,uint256)")),
        to,
        value
    );
}
```

---

## 安全注意事项

### 1. abi.encodePacked 哈希碰撞风险

**问题：动态类型的边界消失可能导致碰撞**

```solidity
// ❌ 危险：可能产生相同的哈希
keccak256(abi.encodePacked("aa", "bb"))    // "aabb"
keccak256(abi.encodePacked("a", "abb"))    // "aabb" (相同!)
keccak256(abi.encodePacked("aab", "b"))    // "aabb" (相同!)

// ✅ 安全：使用 abi.encode
keccak256(abi.encode("aa", "bb"))          // 包含长度信息，不同
keccak256(abi.encode("a", "abb"))          // 不同
```

**安全实践：**

```solidity
// ✅ 方案1：使用 abi.encode（最安全）
function safeHash1(string memory a, string memory b) public pure returns (bytes32) {
    return keccak256(abi.encode(a, b));
}

// ✅ 方案2：添加分隔符
function safeHash2(string memory a, string memory b) public pure returns (bytes32) {
    return keccak256(abi.encodePacked(a, "|", b));
}

// ✅ 方案3：固定长度类型无碰撞风险
function safeHash3(uint256 a, address b) public pure returns (bytes32) {
    return keccak256(abi.encodePacked(a, b));  // 安全
}
```

### 2. 类型转换安全

```solidity
// ❌ 危险：bytes 转 string 可能包含不可打印字符
bytes memory data = abi.encode(123);
string memory dangerous = string(data);  // 包含 0x00

// ✅ 安全：只转换纯文本
bytes memory text = abi.encodePacked("hello");
string memory safe = string(text);
```

### 3. 签名验证最佳实践

```solidity
function properSignatureVerification(
    address signer,
    uint256 amount,
    bytes memory signature
) public view returns (bool) {
    // ✅ 使用 abi.encode 避免碰撞
    bytes32 messageHash = keccak256(abi.encode(
        address(this),  // 合约地址
        block.chainid,  // 链ID
        signer,
        amount,
        nonce[signer]   // 防重放
    ));

    // 添加以太坊签名前缀
    bytes32 ethSignedMessageHash = keccak256(abi.encodePacked(
        "\x19Ethereum Signed Message:\n32",
        messageHash
    ));

    // ... 验证签名
}
```

### 4. 随机数生成

```solidity
// ❌ 不安全：可预测的伪随机数
function badRandom() public view returns (uint256) {
    return uint256(keccak256(abi.encodePacked(block.timestamp)));
}

// ⚠️ 稍好但仍不安全：多个来源组合
function betterButStillBad() public view returns (uint256) {
    return uint256(keccak256(abi.encodePacked(
        block.timestamp,
        block.prevrandao,
        msg.sender
    )));
}

// ✅ 推荐：使用 Chainlink VRF
// 参考: https://docs.chain.link/vrf/v2/introduction
```

### 5. 整数溢出（Solidity < 0.8.0）

```solidity
// Solidity >= 0.8.0 自动检查溢出
// Solidity < 0.8.0 需要使用 SafeMath

// ✅ 0.8.0+ 无需担心
function safeAdd(uint256 a, uint256 b) public pure returns (uint256) {
    return a + b;  // 自动检查溢出
}
```

---

## StakableNFT 合约中的实际应用

### 1. 字符串拼接构建 JSON metadata

```solidity
// packages/hardhat/contracts/StakableNFT.sol:187
function _buildBlindBoxMetadata(uint256 tokenId) private pure returns (string memory) {
    string memory json = string(abi.encodePacked(
        '{',
            '"name": "Stakable NFT #', Strings.toString(tokenId), '",',
            '"description": "A mysterious blind box NFT...",',
            '"image": "', BLINDBOX_IMAGE, '",',
            '"attributes": [',
                '{',
                    '"trait_type": "Status",',
                    '"value": "Unrevealed"',
                '}',
            ']',
        '}'
    ));

    return string(abi.encodePacked(
        'data:application/json;base64,',
        Base64.encode(bytes(json))
    ));
}
```

**为什么使用 abi.encodePacked？**
- ✅ 拼接字符串，需要紧密连接
- ✅ 不需要 ABI 标准格式
- ✅ 节省 gas
- ✅ 最终转换成 string 是安全的（纯文本）

### 2. 生成伪随机数

```solidity
// packages/hardhat/contracts/StakableNFT.sol:301
function reveal() external onlyRole(DEFAULT_ADMIN_ROLE) {
    // ...

    uint256 randomNumber = uint256(keccak256(abi.encodePacked(
        block.timestamp,
        block.prevrandao,
        msg.sender,
        totalMinted
    )));

    revealOffset = randomNumber % MAX_SUPPLY;

    // ...
}
```

**为什么使用 abi.encodePacked？**
- ✅ 仅用于生成哈希，不需要解码
- ✅ 输入都是固定长度类型（uint256, address），无碰撞风险
- ✅ 节省 gas
- ⚠️ 注释中提到生产环境应使用 Chainlink VRF

---

## 快速参考表

### 编码函数选择

| 使用场景 | 推荐函数 | 原因 |
|---------|---------|------|
| **拼接字符串** | `abi.encodePacked` | 紧密连接，节省 gas |
| **计算哈希（固定长度类型）** | `abi.encodePacked` | 更短，节省 gas |
| **计算哈希（动态类型）** | `abi.encode` | 避免碰撞 |
| **函数调用编码** | `abi.encodeWithSignature` | 标准格式 |
| **跨合约数据传递** | `abi.encode` | 可解码，类型安全 |
| **签名验证** | `abi.encode` 或 `abi.encodePacked` | 根据情况选择 |
| **存储数据** | `abi.encode` | 可解码 |

### 类型转换速查

```solidity
// 编码
bytes memory b1 = abi.encode(data);              // 标准编码
bytes memory b2 = abi.encodePacked(data);        // 紧密打包

// 解码
(type1 a, type2 b) = abi.decode(data, (type1, type2));  // 仅 abi.encode 可用

// bytes ↔ string
string memory s = string(bytesData);             // bytes → string (仅文本安全)
bytes memory b = bytes(stringData);              // string → bytes (总是安全)

// 哈希
bytes32 hash = keccak256(bytesData);             // 只接受 bytes
bytes32 hash2 = keccak256(bytes(stringData));    // string 需转 bytes
```

### 常见错误速查

| 错误代码 | 问题 | 解决方案 |
|---------|------|---------|
| `keccak256(123)` | ❌ 类型错误 | ✅ `keccak256(abi.encodePacked(123))` |
| `abi.decode(abi.encodePacked(...))` | ❌ 无法解码 | ✅ 使用 `abi.encode` |
| `string(abi.encode(123))` | ❌ 包含不可打印字符 | ✅ 仅转换文本数据 |
| `keccak256(abi.encodePacked(str1, str2))` | ⚠️ 可能碰撞 | ✅ 使用 `abi.encode` 或添加分隔符 |

---

## 总结

### 核心要点

1. **abi.encode**
   - ✅ 32字节对齐，保留类型边界
   - ✅ 可用 `abi.decode()` 解码
   - ✅ 适用于需要解码的场景
   - ❌ Gas 消耗较高

2. **abi.encodePacked**
   - ✅ 紧密打包，节省 gas
   - ✅ 适用于哈希和字符串拼接
   - ❌ 无法解码
   - ⚠️ 动态类型有碰撞风险

3. **bytes vs string**
   - `bytes` 是任意二进制数据
   - `string` 是 UTF-8 文本
   - 编码函数返回 `bytes`，不是 `string`

4. **keccak256**
   - 只接受 `bytes memory` 类型
   - 其他类型需要先编码
   - 返回 `bytes32` 哈希值

5. **安全实践**
   - 固定长度类型使用 `abi.encodePacked` 安全
   - 动态类型（string, bytes）使用 `abi.encode` 更安全
   - 重要的随机数使用 Chainlink VRF
   - 签名验证包含合约地址、链ID、nonce

### 学习资源

- [Solidity 官方文档 - ABI Specification](https://docs.soliditylang.org/en/latest/abi-spec.html)
- [OpenZeppelin - Cryptography Utils](https://docs.openzeppelin.com/contracts/4.x/api/utils#cryptography)
- [Chainlink VRF Documentation](https://docs.chain.link/vrf/v2/introduction)

---

**文档版本：** v1.0
**最后更新：** 2025-11-03
**适用 Solidity 版本：** 0.8.0+
