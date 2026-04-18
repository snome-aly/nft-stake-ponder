# NFT 盲盒与 Merkle Tree 学习笔记

> 本文档整理了 NFT 盲盒开发中的核心问题、真实项目案例和技术原理

---

## 目录

- [1. NFT 铸造机制设计](#1-nft-铸造机制设计)
- [2. 真实项目案例](#2-真实项目案例)
- [3. mint 函数参数设计](#3-mint-函数参数设计)
- [4. 盲盒随机数方案对比](#4-盲盒随机数方案对比)
- [5. VRF 可验证性原理](#5-vrf-可验证性原理)
- [6. Merkle Tree 映射问题](#6-merkle-tree-映射问题)
- [7. 批量铸造公平性问题](#7-批量铸造公平性问题)
- [8. Merkle Tree 完整方案](#8-merkle-tree-完整方案)
- [9. 核心技术细节](#9-核心技术细节)
- [10. Chainlink Automation 原理](#10-chainlink-automation-原理)
- [11. Gas 消耗的本质](#11-gas-消耗的本质)

---

## 1. NFT 铸造机制设计

### 1.1 谁可以铸造？

#### 方案 A：仅合约所有者（Owner-Only）
```solidity
function mint(address to, uint8 rarity) public onlyOwner {
    _safeMint(to, nextTokenId++);
}
```

**适用场景**：
- ✅ 项目方控制的限量 NFT
- ✅ 需要人工审核的场景
- ✅ 学习和测试阶段

**缺点**：
- ❌ 用户无法自己铸造
- ❌ 需要管理员手动操作

---

#### 方案 B：公开铸造（Public Mint）
```solidity
function mint(uint256 quantity) external payable {
    require(msg.value >= MINT_PRICE * quantity);
    for (uint i = 0; i < quantity; i++) {
        _safeMint(msg.sender, nextTokenId++);
    }
}
```

**适用场景**：
- ✅ 公开 NFT 项目
- ✅ 收取铸造费用
- ✅ 用户体验好

**控制机制**：
- 收费（过滤羊毛党）
- 限量（总供应量上限）
- 限速（每地址铸造上限）

---

#### 方案 C：基于角色（Role-Based）
```solidity
bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

function mint(address to) external onlyRole(MINTER_ROLE) {
    _safeMint(to, nextTokenId++);
}
```

**适用场景**：
- ✅ 多个合作方需要铸造权限
- ✅ 可能接入第三方服务

---

## 2. 真实项目案例

### 2.1 CryptoKitties - 混合模式

**铸造方式**：
- Gen0 猫：项目方铸造并拍卖
- 繁殖猫：用户自己繁殖

**代码特点**：
```solidity
// 只有 COO 角色可以创建 Gen0
function createPromoKitty() external onlyCOO { ... }

// 任何猫主人可以繁殖
function breedWithAuto(uint256 _matronId, uint256 _sireId)
    external payable { ... }
```

**设计原因**：
- 项目方控制稀有猫的供应
- 用户繁殖增加游戏性
- 繁殖费用创造持续收入

---

### 2.2 Bored Ape Yacht Club (BAYC) - 公开铸造

**铸造方式**：
- 任何人都可以铸造
- 价格：0.08 ETH
- 每钱包最多 20 个
- 总量：10,000 个

**代码实现**：
```solidity
function mintApe(uint numberOfTokens) public payable {
    require(saleIsActive, "Sale must be active");
    require(numberOfTokens <= MAX_APES_PER_PURCHASE, "Too many");
    require(totalSupply() + numberOfTokens <= MAX_APES, "Exceeds max");
    require(APES_PRICE * numberOfTokens <= msg.value, "Incorrect value");

    for(uint i = 0; i < numberOfTokens; i++) {
        _safeMint(msg.sender, totalSupply());
    }
}
```

**设计原因**：
- 公平发售（FCFS）
- 收费过滤羊毛党
- 限量创造稀缺性

---

### 2.3 Azuki - 白名单 + 公开

**铸造方式**：
- 阶段 1：白名单铸造（Merkle Tree 验证）
- 阶段 2：公开铸造

**代码实现**：
```solidity
// 白名单铸造
function allowlistMint(uint256 quantity, bytes32[] calldata proof)
    external payable
{
    require(isAllowlisted(msg.sender, proof), "Not on allowlist");
    _safeMint(msg.sender, quantity);
}

// 公开铸造
function publicMint(uint256 quantity) external payable {
    require(publicSaleActive);
    _safeMint(msg.sender, quantity);
}
```

**设计原因**：
- 奖励早期支持者
- 分阶段避免 Gas War
- Merkle Tree 验证节省 Gas

---

### 2.4 Uniswap V3 NFT - 功能型

**铸造方式**：
- 用户提供流动性时自动铸造
- NFT 代表 LP 头寸

**代码实现**：
```solidity
function mint(MintParams calldata params)
    external payable
    returns (uint256 tokenId, ...)
{
    // 添加流动性
    (liquidity, amount0, amount1) = addLiquidity(params);

    // 铸造 NFT 作为凭证
    _mint(params.recipient, (tokenId = _nextId++));

    // 存储头寸信息
    _positions[tokenId] = Position({...});
}
```

**设计原因**：
- NFT 作为凭证，非收藏品
- 铸造是功能性的
- 无总量限制（工具型）

---

## 3. mint 函数参数设计

### 3.1 最简参数（BAYC 模式）

```solidity
function mint(uint256 quantity) public payable
```

**自动处理**：
- 接收者 = msg.sender
- tokenId = 自动递增
- 属性 = 链下随机或链上伪随机

**优缺点**：
- ✅ 简单、Gas 低
- ❌ 不支持给别人铸造

---

### 3.2 带接收者参数

```solidity
function mint(address to, uint256 tokenId) public onlyOwner
```

**使用场景**：
- 项目方空投
- 支持作为礼物铸造

---

### 3.3 带稀有度参数（推荐）

```solidity
enum Rarity { Common, Rare, Epic, Legendary }

function mint(address to, Rarity rarity) public onlyOwner {
    _safeMint(to, nextTokenId);
    _tokenData[nextTokenId] = TokenData({
        rarity: rarity,
        mintedAt: block.timestamp
    });
    nextTokenId++;
}
```

**优点**：
- ✅ 精确控制稀有度分配
- ✅ 类型安全（enum）

---

### 3.4 带元数据 URI

```solidity
function mint(address to, string memory tokenURI) public onlyOwner {
    uint256 tokenId = nextTokenId++;
    _safeMint(to, tokenId);
    _setTokenURI(tokenId, uri);
}
```

**使用场景**：
- 每个 NFT 图片完全不同
- 元数据在链下已准备好

---

## 4. 盲盒随机数方案对比

### 4.1 方案 A：链上伪随机（简单但不安全）

```solidity
function reveal() external onlyOwner {
    revealSeed = uint256(keccak256(abi.encodePacked(
        block.timestamp,
        block.prevrandao,
        block.number
    )));
    revealed = true;
}

function getRarity(uint256 tokenId) public view returns (Rarity) {
    uint256 rand = uint256(keccak256(abi.encodePacked(
        revealSeed,
        tokenId
    ))) % 100;

    if (rand < 1) return Rarity.Legendary;
    if (rand < 11) return Rarity.Epic;
    if (rand < 36) return Rarity.Rare;
    return Rarity.Common;
}
```

**优点**：
- ✅ 实现简单
- ✅ Gas 成本低

**缺点**：
- ❌ 矿工可操纵
- ❌ Owner 可选择有利的区块
- ❌ 不够公平

---

### 4.2 方案 B：Chainlink VRF（最安全）

```solidity
function requestRandomness() external onlyOwner {
    requestId = COORDINATOR.requestRandomWords(
        keyHash,
        subscriptionId,
        requestConfirmations,
        callbackGasLimit,
        numWords
    );
}

function fulfillRandomWords(uint256, uint256[] memory randomWords)
    internal override
{
    revealSeed = randomWords[0];
    revealed = true;
}
```

**优点**：
- ✅ 真随机
- ✅ 可验证（VRF 算法）
- ✅ 无法操纵
- ✅ 行业标准

**缺点**：
- ❌ 需要 LINK 代币
- ❌ 每次 $5-20 成本
- ❌ 需要等待回调

---

### 4.3 方案 C：Commit-Reveal（平衡方案）

```solidity
bytes32 public commitHash;
uint256 public commitBlock;

// 阶段 1：Owner 提交哈希
function commitReveal(bytes32 _commitHash) external onlyOwner {
    commitHash = _commitHash;
    commitBlock = block.number;
    mintingClosed = true;
}

// 阶段 2：10 个区块后公开 secret
function reveal(uint256 secret) external onlyOwner {
    require(block.number > commitBlock + 10);

    // 验证 secret
    require(keccak256(abi.encodePacked(secret)) == commitHash);

    // 结合区块哈希
    revealSeed = uint256(keccak256(abi.encodePacked(
        secret,
        blockhash(commitBlock + 1),
        blockhash(commitBlock + 5),
        blockhash(commitBlock + 10)
    )));

    revealed = true;
}
```

**为什么安全**：
- Owner 提交 commit 时，还不知道未来区块哈希
- 即使 owner 计算好 secret，未来区块哈希也会影响结果
- Owner 无法同时控制两者

---

## 5. VRF 可验证性原理

### 5.1 自建 VRF 的问题

```javascript
// 你的 VRF 服务
const seed = Math.random() * 1000000;
const signature = sign(seed, privateKey);

// ❌ 问题：你可以生成很多次，选择有利的结果
for (let i = 0; i < 10000; i++) {
    const seed = generateRandom();
    const myRarity = calculateRarity(seed, myTokenId);

    if (myRarity === Legendary) {
        submitSeed(seed, sign(seed, privateKey));
        break;
    }
}
```

**用户只能看到**：
- ✅ 签名有效（确实是你发的）
- ❌ 无法验证 seed 的生成过程
- ❌ 无法证明你没有"刷随机数"

---

### 5.2 Chainlink VRF 的解决方案

**核心：VRF = Verifiable Random Function（可验证随机函数）**

```javascript
// VRF 的工作原理

// 1. 用户请求
const requestId = contract.requestRandomWords();

// 2. Chainlink 节点计算
const proof = VRF_Prove(secretKey, requestId);
const randomOutput = VRF_Hash(proof);

// 3. 链上验证
function verify(publicKey, proof, output, requestId) {
    // 验证 1: proof 确实是用 secretKey 对 requestId 的签名
    require(verifySignature(publicKey, proof, requestId));

    // 验证 2: output 确实是从 proof 哈希得到的
    require(hash(proof) == output);

    // ⭐ 关键：给定 requestId，只能生成唯一的 proof
    // 节点无法"重新 roll"
}
```

**为什么安全**：
1. **确定性**：给定 requestId，只能生成唯一的 proof
2. **不可预测**：请求前，节点无法知道 requestId
3. **可验证**：任何人都可以用公钥验证 proof
4. **无法选择**：节点不能生成多个 proof 然后挑选

---

### 5.3 对比总结

| 方案 | 信任模型 | 证明方式 | 成本 |
|------|---------|---------|------|
| **自建签名服务** | 需要信任 | ❌ 无法证明没作弊 | 低 |
| **Chainlink VRF** | 无需信任 | ✅ 密码学可验证 | $5-20/次 |
| **链上随机** | 需要信任矿工 | ⚠️ 可被操纵 | 低 |

---

## 6. Merkle Tree 映射问题

### 6.1 错误实现：哈希映射

```solidity
// ❌ 问题：多个 tokenId 可能映射到同一位置
function getRarity(uint256 tokenId) public view returns (Rarity) {
    uint256 shuffledIndex = uint256(keccak256(abi.encodePacked(
        revealSeed,
        tokenId
    ))) % MAX_SUPPLY;

    return _rarityPool[shuffledIndex];
}
```

**问题演示**：
```
假设 MAX_SUPPLY = 1000

tokenId 5   → hash % 1000 = 237 → _rarityPool[237] = Common
tokenId 123 → hash % 1000 = 237 → _rarityPool[237] = Common ❌ 重复！
tokenId 888 → hash % 1000 = 237 → _rarityPool[237] = Common ❌ 又重复！

结果：
- 某些稀有度永远不会被分配
- 实际分配数量 ≠ 预期数量
- 无法精确控制稀有度分布
```

---

### 6.2 正确实现：Offset 偏移

```solidity
// ✅ 正确：使用 offset，确保一一对应
function getRarity(uint256 tokenId) public view returns (Rarity) {
    uint256 rarityIndex = (tokenId + startingIndex) % MAX_SUPPLY;
    return _rarityPool[rarityIndex];
}
```

**工作原理**：
```
假设 startingIndex = 523, MAX_SUPPLY = 1000

tokenId 0   → (0 + 523) % 1000 = 523 → _rarityPool[523]
tokenId 1   → (1 + 523) % 1000 = 524 → _rarityPool[524]
tokenId 2   → (2 + 523) % 1000 = 525 → _rarityPool[525]
...
tokenId 999 → (999 + 523) % 1000 = 522 → _rarityPool[522]

✅ 每个 tokenId 映射到不同的 _rarityPool 位置
✅ 所有 1000 个稀有度都会被使用
✅ 精确控制：刚好 10 个 Legendary, 100 个 Epic...
```

---

## 7. 批量铸造公平性问题

### 7.1 问题：顺序排列导致不公平

```solidity
// 构造函数中，_rarityPool 是顺序排列的
constructor() {
    // [L, L, L, ..., L, E, E, E, ..., R, R, R, ..., C, C, C, ...]
    //  0  1  2      9  10 11 12       110...        360...

    for (uint i = 0; i < 10; i++) {
        _rarityPool.push(Rarity.Legendary);
    }
    for (uint i = 0; i < 100; i++) {
        _rarityPool.push(Rarity.Epic);
    }
    // ...
}
```

**问题演示**：
```
假设 startingIndex = 5

用户 A 批量铸造 10 个（tokenId 0-9）：
- tokenId 0 → (0+5) % 1000 = 5  → _rarityPool[5]  = Legendary ⭐
- tokenId 1 → (1+5) % 1000 = 6  → _rarityPool[6]  = Legendary ⭐
- tokenId 2 → (2+5) % 1000 = 7  → _rarityPool[7]  = Legendary ⭐
- tokenId 3 → (3+5) % 1000 = 8  → _rarityPool[8]  = Legendary ⭐
- tokenId 4 → (4+5) % 1000 = 9  → _rarityPool[9]  = Legendary ⭐
- tokenId 5 → (5+5) % 1000 = 10 → _rarityPool[10] = Epic

结果：用户 A 拿走了 5 个 Legendary！（总共才 10 个）😱
```

---

### 7.2 解决方案：部署时洗牌

```solidity
constructor(Rarity[] memory shuffledRarities) {
    require(shuffledRarities.length == MAX_SUPPLY);

    // 验证稀有度分布
    uint256[4] memory counts;
    for (uint i = 0; i < shuffledRarities.length; i++) {
        _rarityPool.push(shuffledRarities[i]);
        counts[uint8(shuffledRarities[i])]++;
    }

    require(counts[0] == 640, "Invalid Common count");
    require(counts[1] == 250, "Invalid Rare count");
    require(counts[2] == 100, "Invalid Epic count");
    require(counts[3] == 10, "Invalid Legendary count");
}
```

**链下洗牌**：
```javascript
// Fisher-Yates 洗牌算法
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

const rarities = [...Array(10).fill(3), ...Array(100).fill(2), ...];
const shuffled = shuffle(rarities);

// 部署时传入
await contract.deploy(owner, shuffled);
```

---

## 8. Merkle Tree 完整方案

### 8.1 核心原理

```
传统方案（存储所有稀有度）：
Contract Storage:
  tokenId 0 → Common
  tokenId 1 → Rare
  tokenId 2 → Epic
  ...
  tokenId 999 → Common

Gas 成本：~500,000 Gas（部署）

Merkle Tree 方案：
Contract Storage:
  Root = 0x7f8a3b2c...  (32 字节)

Gas 成本：~25,000 Gas（部署）✅

验证时：
用户提供 (tokenId, rarity, proof)
合约验证：hash(proof) == root ?
验证通过 → 存储稀有度
```

---

### 8.2 工作流程

**阶段 1：链下准备（部署前）**

```javascript
// 1. 生成并洗牌稀有度
const rarities = shuffle([...Array(10).fill(3), ...Array(100).fill(2), ...]);

// 2. 生成叶子节点
const leaves = rarities.map((rarity, tokenId) =>
    ethers.solidityPackedKeccak256(["uint256", "uint8"], [tokenId, rarity])
);

// 3. 构建 Merkle Tree
const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });

// 4. 获取 Root
const root = tree.getHexRoot();
```

---

**阶段 2：合约部署**

```solidity
contract MerkleNFT {
    bytes32 public rarityMerkleRoot;

    function setRarityMerkleRoot(bytes32 root) external onlyOwner {
        rarityMerkleRoot = root;  // 只存储 32 字节！
    }
}
```

---

**阶段 3：用户铸造（盲盒状态）**

```solidity
function mint(uint256 quantity) external payable {
    for (uint i = 0; i < quantity; i++) {
        _safeMint(msg.sender, nextTokenId++);
    }
}
```

---

**阶段 4：开盒（领取稀有度）**

```javascript
// 前端：从 API 获取 Proof
const response = await fetch(`/api/proof/${tokenId}`);
const { rarity, proof } = await response.json();

// 调用合约
await contract.claimRarity(tokenId, rarity, proof);
```

```solidity
// 合约：验证 Proof
function claimRarity(
    uint256 tokenId,
    Rarity rarity,
    bytes32[] calldata merkleProof
) external {
    // 重新计算叶子节点
    bytes32 leaf = keccak256(abi.encodePacked(tokenId, uint8(rarity)));

    // 验证 Merkle Proof
    require(
        MerkleProof.verify(merkleProof, rarityMerkleRoot, leaf),
        "Invalid proof"
    );

    // 存储稀有度
    _tokenRarities[tokenId] = rarity;
}
```

---

## 9. 核心技术细节

### 9.1 solidityPackedKeccak256 详解

```typescript
const leaf = ethers.solidityPackedKeccak256(
  ["uint256", "uint8"],
  [tokenId, rarity]
);
```

**作用**：
1. 使用 Solidity 的编码规则计算哈希
2. 等价于 `keccak256(abi.encodePacked(tokenId, rarity))`

**为什么重要**：
- 必须和合约中的计算完全一致
- 不同类型编码长度不同
- 顺序必须匹配

---

**编码过程**：

```
步骤 1：编码（abi.encodePacked）

tokenId = 5 (uint256)
→ 32 字节：0x0000000000000000000000000000000000000000000000000000000000000005

rarity = 2 (uint8)
→ 1 字节：0x02

拼接：0x000000000000000000000000000000000000000000000000000000000000000502

步骤 2：哈希（keccak256）

输入：0x000000000000000000000000000000000000000000000000000000000000000502
      ↓ Keccak256 算法
输出：0x9a4c3e1f7b2d8c5a3e9f6d2b8a5e1f4c7b3d9a6e2f5c8b1a4e7d3c9f6b2a5e
      ↑ 这就是叶子节点！
```

---

**常见错误**：

```typescript
// ❌ 类型错误
ethers.solidityPackedKeccak256(
  ["uint256", "uint256"],  // 应该是 uint8
  [tokenId, rarity]
)

// ❌ 顺序错误
ethers.solidityPackedKeccak256(
  ["uint8", "uint256"],
  [rarity, tokenId]  // 顺序反了
)

// ❌ 使用了不同的编码
keccak256(JSON.stringify({ tokenId, rarity }))  // 错误！
```

---

### 9.2 sortPairs 详解

```typescript
const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
```

**作用**：构建 Merkle Tree 时，将兄弟节点按字典序排序后再哈希

---

**问题背景**：

```javascript
// 同样的节点，不同顺序产生不同哈希
hash(A + B) ≠ hash(B + A)

const A = "0xabc123..."
const B = "0xdef456..."

keccak256(A + B) = "0x111111..."
keccak256(B + A) = "0x222222..."  ❌ 完全不同！
```

---

**不排序的问题**：

```
构造 Tree 时按数组顺序：

              Root
             /    \
          H01      H23
          / \      / \
        L0  L1    L2  L3

H01 = hash(L0 + L1)
Root = hash(H01 + H23)

如果数组变成 [L1, L0, L2, L3]：

              Root'
             /    \
          H10      H23
          / \      / \
        L1  L0    L2  L3

H10 = hash(L1 + L0)  ❌ 和之前不同！
Root' ≠ Root
```

---

**排序的好处**：

```
sortPairs: true 时，总是按字典序哈希：

L0 = 0x5a7b...
L1 = 0x3c9d...

比较：0x5a7b... > 0x3c9d...

所以：hash(L1 + L0)  // 小的在前
     ↑     ↑
     小    大

无论传入顺序如何，都是 hash(L1 + L0) ✅
```

---

**与 OpenZeppelin 的关系**：

```solidity
// OpenZeppelin 的 MerkleProof.sol 也使用排序
function verify(...) internal pure returns (bool) {
    bytes32 computedHash = leaf;

    for (uint256 i = 0; i < proof.length; i++) {
        bytes32 proofElement = proof[i];

        // ⭐ 关键：按排序后的顺序哈希
        if (computedHash <= proofElement) {
            computedHash = keccak256(
                abi.encodePacked(computedHash, proofElement)
            );
        } else {
            computedHash = keccak256(
                abi.encodePacked(proofElement, computedHash)
            );
        }
    }

    return computedHash == root;
}
```

**结论**：
- 链下构建：`sortPairs: true`
- 链上验证：也使用排序
- 两边保持一致，验证才能通过！✅

---

## 10. Chainlink Automation 原理

### 10.1 为什么 checkUpkeep 是"免费"的？

**核心**：view 函数 + eth_call

```solidity
// ✅ checkUpkeep - view 函数（只读）
function checkUpkeep(bytes calldata checkData)
    external
    view          // ⭐ 关键
    returns (bool upkeepNeeded, bytes memory performData)
{
    // 只读操作
    upkeepNeeded = (block.timestamp >= lastTimeStamp + interval);
}

// ✅ performUpkeep - 普通函数（修改状态）
function performUpkeep(bytes calldata performData) external {
    lastTimeStamp = block.timestamp;  // 修改状态
}
```

---

### 10.2 eth_call vs 交易

#### eth_call（模拟调用，免费）

```javascript
// Chainlink 节点这样调用
const result = await provider.call({
    to: contractAddress,
    data: contract.interface.encodeFunctionData("checkUpkeep", [])
});

// eth_call：
// ✅ 本地节点模拟执行
// ✅ 不广播到网络
// ✅ 不消耗 Gas（不需要支付）
// ✅ 不修改链上状态
// ✅ 立即返回结果
```

**流程**：
```
Chainlink 节点
    ↓
本地 RPC 节点（Infura）
    ↓
模拟执行 checkUpkeep()
    ↓
返回结果（true/false）

整个过程：
❌ 不发送交易
❌ 不上链
❌ 不消耗 Gas（不支付）
```

---

#### 交易（修改状态，需要 Gas）

```javascript
// 当条件满足，发送真实交易
const tx = await contract.performUpkeep(performData, {
    gasLimit: 500000
});
await tx.wait();

// 交易：
// ❌ 需要签名
// ❌ 广播到网络
// ❌ 等待打包
// ❌ 消耗 Gas
// ✅ 修改链上状态
```

**流程**：
```
Chainlink 节点
    ↓
签名交易
    ↓
广播到以太坊网络
    ↓
矿工打包进区块
    ↓
执行 performUpkeep()
    ↓
状态改变，消耗 Gas 💰
```

---

### 10.3 完整工作流程

```
每个区块：

Chainlink 节点持续检查（免费）：
  eth_call → checkUpkeep() → false
  eth_call → checkUpkeep() → false
  eth_call → checkUpkeep() → false
  ...

某一时刻，条件满足：
  eth_call → checkUpkeep() → true ✅

  ↓ 发现需要执行！

  发送交易 → performUpkeep() → 消耗 Gas 💰

  ↓ 状态改变

  eth_call → checkUpkeep() → false（又回到循环）
```

---

### 10.4 成本对比

| 操作 | 方式 | 频率 | Gas 成本 |
|------|------|------|---------|
| checkUpkeep | eth_call | 每 5 秒 | 0 ✅ |
| performUpkeep | 交易 | 条件满足时 | ~100,000 Gas 💰 |

**示例**：
```
一天：
- checkUpkeep：17,280 次（免费）
- performUpkeep：1 次（~$6）

总成本：$6/天

如果 checkUpkeep 也需要交易：
- 17,280 × 50,000 Gas × 30 gwei = 25.92 ETH
- 约 $51,840/天 😱

这就是为什么必须用 view 函数！
```

---

## 11. Gas 消耗的本质

### 11.1 核心真相

```
❌ 误解：view/pure 函数不消耗 Gas
✅ 正确：view/pure 函数消耗 Gas，但不需要你支付
```

**关键区分**：Gas 消耗 ≠ Gas 支付

---

### 11.2 四种场景

#### 场景 1：外部 eth_call 调用 view

```javascript
// 前端或 Chainlink 节点
const result = await contract.checkUpkeep("0x");

// 实际发生：
// ✅ EVM 确实执行了代码
// ✅ 读取了 storage（SLOAD 指令，2100 Gas）
// ✅ Gas 被"消耗"了
// ❌ 但不上链，所以不支付

// 谁承担成本？RPC 节点提供商（Infura、Alchemy）
```

---

#### 场景 2：合约内部调用 view

```solidity
contract Example {
    uint256 public data = 100;

    function getData() public view returns (uint256) {
        return data;  // SLOAD: 2100 Gas
    }

    function updateAndGet() public returns (uint256) {
        data = 200;  // SSTORE: 20,000 Gas

        uint256 current = getData();  // ⭐ 消耗 Gas！

        return current;
    }
}
```

**Gas 消耗**：
```javascript
const tx = await contract.updateAndGet();
const receipt = await tx.wait();

console.log("Gas used:", receipt.gasUsed);
// ~45,000 Gas

// 分解：
// - SSTORE (data = 200): ~20,000 Gas
// - getData() 调用: ~2,400 Gas ⭐
// - 其他: ~22,600 Gas

结论：内部调用 view 确实消耗 Gas，需要支付！
```

---

#### 场景 3：合约内部调用 pure

```solidity
contract Math {
    function add(uint256 a, uint256 b) public pure returns (uint256) {
        return a + b;  // ADD 指令: 3 Gas
    }

    function calculate() public returns (uint256) {
        uint256 result = add(10, 20);  // ⭐ 消耗 Gas
        return result;
    }
}
```

**Gas 消耗**：
```javascript
const tx = await contract.calculate();
console.log("Gas:", receipt.gasUsed);
// ~21,500 Gas

// 分解：
// - 基础: 21,000 Gas
// - add() 调用: ~500 Gas ⭐（包括 ADD 指令）
```

**结论**：pure 函数也消耗 Gas（CPU 指令有成本）

---

#### 场景 4：外部 eth_call 调用 pure

```javascript
// 不发交易，直接调用
const result = await contract.add(10, 20);
console.log(result);  // 30

// Gas 消耗：0 ETH（RPC 节点承担计算成本）
```

---

### 11.3 EVM 操作码成本表

| 操作 | 操作码 | Gas 成本 | 说明 |
|------|-------|---------|------|
| 读取 storage（冷） | SLOAD | 2,100 | 首次读取 |
| 读取 storage（热） | SLOAD | 100 | 缓存读取 |
| 写入 storage | SSTORE | 20,000 | 从 0 到非 0 |
| 加法 | ADD | 3 | 算术运算 |
| 乘法 | MUL | 5 | 算术运算 |
| 除法 | DIV | 5 | 算术运算 |
| 函数调用 | CALL | 100-700 | 取决于类型 |
| 循环一次 | - | ~50 | 估算值 |

---

### 11.4 优化建议

```solidity
// ❌ Gas 浪费
function bad() public returns (uint256) {
    uint256 a = getValue();  // 函数调用 + SLOAD
    uint256 b = getValue();  // 函数调用 + SLOAD（缓存）
    return a + b;
}

// ✅ Gas 优化
function good() public returns (uint256) {
    uint256 value = data;  // 只一次 SLOAD
    return value + value;  // 复用变量
}

// 节省：~500 Gas（一次函数调用开销）
```

---

### 11.5 RPC 节点的商业模式

**为什么 Infura/Alchemy 提供免费读取？**

1. **获取用户**：免费 eth_call → 吸引开发者
2. **追加销售**：免费用户 → 付费用户（更高限额）
3. **交易收入**：用户习惯后 → 发送交易（收费）

**实际成本**：
```
Infura 成本：
- 服务器：AWS/GCP
- 以太坊全节点：硬件 + 带宽
- eth_call 执行：CPU 时间

免费额度：
- 每天 100,000 次请求
- 超出后收费：$50/月（25 万次）

商业逻辑：
- 大部分用户不超额
- 超额用户带来收入
- 整体盈利 ✅
```

---

## 总结：关键要点

### 1. NFT 铸造设计

- **Owner-Only**：项目方控制，适合限量/空投
- **Public Mint**：用户自己铸造，需要防滥用机制
- **Role-Based**：灵活权限，适合多方合作

### 2. 随机数方案

- **链上伪随机**：简单但不安全（可被操纵）
- **Chainlink VRF**：最安全但成本高（$5-20/次）
- **Commit-Reveal**：平衡方案（安全性中等，成本低）
- **Merkle Tree**：部署时洗牌，链上验证（推荐）

### 3. Merkle Tree 核心

- **哈希映射**：❌ 会碰撞，无法精确控制
- **Offset 偏移**：✅ 一一对应，精确控制
- **部署时洗牌**：✅ 避免批量铸造不公平
- **sortPairs**：✅ 确保验证成功

### 4. 可验证性

- **普通签名**：只能证明"谁发的"，无法证明"没作弊"
- **VRF**：密码学可验证，确定性输出，无法选择
- **Merkle Proof**：任何人都可以验证，去信任化

### 5. Gas 消耗

- **view/pure 消耗 Gas**：EVM 确实执行了代码
- **eth_call 不支付**：RPC 节点承担成本
- **内部调用支付**：计入交易总 Gas
- **优化方向**：减少 SLOAD、避免重复调用

---

## 参考资源

- OpenZeppelin Contracts: https://docs.openzeppelin.com/contracts
- Chainlink VRF: https://docs.chain.link/vrf
- Chainlink Automation: https://docs.chain.link/chainlink-automation
- Merkle Tree (merkletreejs): https://github.com/merkletreejs/merkletreejs
- EVM Opcodes: https://www.evm.codes/

---

**完成日期**：2025-11-03
**版本**：v1.0
