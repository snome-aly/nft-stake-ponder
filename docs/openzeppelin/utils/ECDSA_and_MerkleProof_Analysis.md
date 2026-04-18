# OpenZeppelin Cryptography: ECDSA & MerkleProof 深度解析

这两个库是 Web3 安全开发的基石。掌握它们不仅关乎功能实现，更关乎**资金安全**。

## 1. ECDSA (椭圆曲线数字签名算法)

`ECDSA.sol` 主要是为了解决 EVM 原生 `ecrecover` 函数难用的问题，并提供额外的安全检查。

### 1.1 核心原理
*   **私钥签名**: 用户（Off-chain）使用私钥对消息的 Hash 进行签名，生成 `(v, r, s)`。
*   **公钥恢复**: 合约（On-chain）拿到 `(v, r, s)` 和原始消息 Hash，可以反推出签名者的**公钥地址**。
*   **验证**: 比较 `recover(hash, signature) == expectedSigner`。

### 1.2 为什么不用原生的 `ecrecover`?
EVM 的 `ecrecover` 有几个坑：
1.  **返回 0**: 如果签名无效，它不会 revert，而是返回 `address(0)`。如果你不小心写了 `require(ecrecover(...) == owner)`，而 owner 恰好没设置（是 0），攻击者随便传个垃圾签名就能通过验证。
2.  **签名可塑性 (Malleability)**: 对同一个有效签名，可以通过数学变换生成另一个有效的 `(v, r, s')`。这会导致**签名重放攻击**。
3.  **格式繁琐**: 需要手动拆解 `r, s, v`。

### 1.3 `ECDSA.sol` 的改进
*   **`tryRecover`**: 安全的版本，返回错误码而不是 0 地址。
*   **`recover`**: 如果签名无效直接 Revert，防止误判。
*   **防可塑性**: 严格检查 `s` 值必须在曲线的一半阶数以下（EIP-2 草案标准），杜绝了大部分重放攻击。

### 1.4 最佳实践：以太坊签名消息 (Ethereum Signed Message)
永远不要直接签名为 `keccak256(data)`，因为这可能被诱导签署一笔以太坊交易。
必须加上前缀：`\x19Ethereum Signed Message:\n32`。

OpenZeppelin 提供了 `MessageHashUtils` (以前在 ECDSA 里) 来处理这个：
```solidity
using MessageHashUtils for bytes32;
bytes32 digest = keccak256(abi.encode(param1, param2)).toEthSignedMessageHash();
address signer = ECDSA.recover(digest, signature);
```

---

## 2. MerkleProof (默克尔证明)

`MerkleProof.sol` 实现了**无需存储大量数据**即可验证“某元素属于某集合”的算法。

### 2.1 核心场景：空投 (Airdrop)
假设你要给 100,000 个地址发白名单。
*   **笨办法**: 在合约里写 `mapping(address => bool) whitelist`。把 10 万个地址写进 Storage。
    *   **成本**: 几万刀 Gas 费。
*   **Merkle 办法**:
    1.  Off-chain: 把 10 万个地址构建成一棵 Merkle Tree。算出根节点 Hash (`Root`)。
    2.  On-chain: 合约里只存一个 `bytes32 public root`。
    3.  Claim: 用户领奖时，自己提供一条“证据路径” (`Proof`)。
    4.  Verify: 合约验证 `Proof + UserAddr` 算出来的根是否等于 `root`。

### 2.2 技术原理
*   **Proof**: 一个 `bytes32[]` 数组，包含了从叶子节点到根节点路径上所有的“兄弟节点” Hash。
*   **Verify**: 不断把当 Hash 和 Proof 里的 Hash 进行配对、排序（小的在前大了在后）、再 Hash，层层向上，最后算出的结果应该等于 `Root`。

### 2.3 `MerkleProof.sol` 源码解析
```solidity
function verify(bytes32[] memory proof, bytes32 root, bytes32 leaf) internal pure returns (bool) {
    return processProof(proof, leaf) == root;
}
```
它利用了汇编优化来循环计算 Hash，比手动写 `keccak256` 循环更省 Gas。

### 2.4 安全陷阱 (Second Preimage Attack)
*   **问题**: 如果叶子节点是 `64 bytes` 数据，攻击者可能构造一个中间节点当做叶子节点来欺骗验证。
*   **解法 (Double Hash)**: 永远不要直接把用户输入的数据当做叶子节点。
*   **正确做法**: `leaf = keccak256(bytes.concat(keccak256(abi.encode(account, amount))));`
    *   OpenZeppelin 的标准做法是要求用户传入数据的 Hash，而不是原始数据，从而避免这个问题。

## 3. 总结

| 工具 | 核心作用 | 关键安全点 |
| :--- | :--- | :--- |
| **ECDSA** | 验证签名 (身份认证) | 必须防重放 (Nonce)，必须防可塑性 (使用 OZ 库)，必须加前缀 (toEthSigned) |
| **MerkleProof** | 验证成员资格 (白名单) | 不需要存数据 (省 Gas)，叶子节点必须先 Hash (防伪造) |

如果您需要实现白名单功能：
*   如果人数少 (< 50): 用 `ECDSA` 签名验签（Server 签发）。
*   如果人数多 (> 1000): 用 `MerkleProof`。
