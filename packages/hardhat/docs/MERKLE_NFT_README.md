# Merkle Tree 盲盒 NFT 完整实现

这是一个使用 **Merkle Tree** 技术实现的盲盒 NFT 项目，包含完整的智能合约、部署脚本、API 服务、测试用例和前端集成示例。

## 📚 目录

- [项目结构](#项目结构)
- [核心原理](#核心原理)
- [快速开始](#快速开始)
- [详细说明](#详细说明)
- [测试](#测试)
- [常见问题](#常见问题)

---

## 📁 项目结构

```
packages/hardhat/
├── contracts/
│   └── MerkleStakableNFT.sol          # 主合约（带详细注释）
├── scripts/
│   ├── deployMerkleNFT.ts             # 部署脚本
│   └── merkleProofAPI.ts              # Merkle Proof API 服务
├── test/
│   └── MerkleStakableNFT.test.ts      # 完整测试用例
├── docs/
│   ├── useMerkleNFT.tsx               # React Hook 示例
│   ├── MerkleNFTPage.tsx              # 前端页面组件示例
│   └── README.md                      # 本文件
└── merkle-data/
    └── merkle-tree-data.json          # 部署后生成的数据
```

---

## 🧠 核心原理

### 什么是 Merkle Tree？

Merkle Tree（默克尔树）是一种哈希树数据结构，可以用**少量数据（根哈希）**来验证**大量数据**的完整性。

### 工作流程

```
┌─────────────────────────────────────────────────────────────┐
│ 1. 链下准备（部署前）                                        │
├─────────────────────────────────────────────────────────────┤
│   • 生成 1000 个稀有度并洗牌                                  │
│     [3,0,1,2,0,0,3,1,...]                                    │
│   • 构建 Merkle Tree                                         │
│   • 计算 Root Hash（32字节）                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. 合约部署                                                  │
├─────────────────────────────────────────────────────────────┤
│   • 部署 MerkleStakableNFT 合约                              │
│   • 调用 setRarityMerkleRoot(root)                           │
│   • 合约只存储 32 字节的 Root                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. 用户铸造（盲盒状态）                                       │
├─────────────────────────────────────────────────────────────┤
│   • 用户调用 mint(quantity)                                  │
│   • 支付 0.01 ETH/个                                         │
│   • 此时不知道稀有度                                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. 开盒（领取稀有度）                                         │
├─────────────────────────────────────────────────────────────┤
│   • 前端从 API 获取 (tokenId, rarity, proof)                 │
│   • 用户调用 claimRarity(tokenId, rarity, proof)             │
│   • 合约验证 Merkle Proof                                    │
│   • 验证通过，存储稀有度                                      │
└─────────────────────────────────────────────────────────────┘
```

### Merkle Proof 验证原理

```
假设有 8 个 NFT，要验证 tokenId 2 的稀有度是 Epic (2)

                Root (存储在合约中)
               /    \
            H0123   H4567
            /  \     /  \
          H01  H23  H45  H67
          / \  / \  / \  / \
         L0 L1 L2 L3 L4 L5 L6 L7
                ↑
                要验证的节点

Proof = [L3, H01, H4567]  # 只需要3个哈希！

验证步骤：
1. 计算 leaf = hash(tokenId=2, rarity=2)
2. 计算 H23 = hash(leaf + L3)
3. 计算 H0123 = hash(H01 + H23)
4. 计算 Root' = hash(H0123 + H4567)
5. 比较 Root' == Root ？
   ✅ 相同 → 验证通过，稀有度真实
   ❌ 不同 → 数据被篡改
```

### 为什么需要 API 服务？

- **问题**：合约只存储 32 字节的 Root，不存储每个 NFT 的稀有度
- **解决**：链下保存完整的稀有度数组，通过 API 提供 Merkle Proof
- **优点**：
  - 部署 Gas 成本极低（只存储 32 字节）
  - 用户可以验证 Proof 的正确性（去信任化）
  - 精确控制稀有度分布（链下洗牌）

---

## 🚀 快速开始

### 前置要求

```bash
# Node.js 版本
node --version  # >= 20.18.3

# 安装依赖
yarn install

# 确保已安装 Merkle Tree 库
yarn add merkletreejs keccak256
```

### 步骤 1: 部署合约

```bash
# 启动本地区块链
yarn chain

# 在新终端中部署合约
yarn hardhat run scripts/deployMerkleNFT.ts --network localhost
```

**输出示例**：
```
🚀 开始部署 MerkleStakableNFT 合约...

📝 步骤1：生成稀有度数组
  总数量: 1000

🔀 步骤2：洗牌稀有度数组
  洗牌完成！

📊 稀有度分布验证：
  Common (0):    640 / 640 ✅
  Rare (1):      250 / 250 ✅
  Epic (2):      100 / 100 ✅
  Legendary (3): 10 / 10  ✅

🌳 步骤3：构建 Merkle Tree
  生成了 1000 个叶子节点
  Merkle Root: 0x7f8a3b2c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1

📦 步骤4：部署合约
  部署者地址: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
  ✅ 合约已部署: 0x5FbDB2315678afecb367f032d93F642f64180aa3

🔑 步骤5：设置 Merkle Root
  ✅ Merkle Root 已设置

💾 步骤6：保存数据到文件
  ✅ 数据已保存: /path/to/merkle-data/merkle-tree-data.json

🎉 部署完成！
```

### 步骤 2: 启动 API 服务

```bash
# 在新终端中启动 API
yarn ts-node scripts/merkleProofAPI.ts
```

**输出示例**：
```
📂 加载 Merkle Tree 数据...
  ✅ 数据加载成功
  合约地址: 0x5FbDB2315678afecb367f032d93F642f64180aa3
  Merkle Root: 0x7f8a3b2c...

🌳 重建 Merkle Tree...
  ✅ Merkle Tree 重建成功
  Root 验证通过: 0x7f8a3b2c...

🚀 Merkle Proof API 服务已启动!

📡 监听端口: http://localhost:3001

📋 可用端点:
  GET  http://localhost:3001/
  GET  http://localhost:3001/proof/:tokenId
  POST http://localhost:3001/proof/batch
  GET  http://localhost:3001/stats
  GET  http://localhost:3001/verify/:tokenId/:rarity

✅ API 服务运行中...
```

### 步骤 3: 测试 API

```bash
# 获取 tokenId 0 的 Proof
curl http://localhost:3001/proof/0

# 输出：
# {
#   "tokenId": 0,
#   "rarity": 0,
#   "rarityName": "Common",
#   "multiplier": 100,
#   "proof": [
#     "0x1234...",
#     "0x5678...",
#     "0x9abc..."
#   ]
# }
```

### 步骤 4: 运行测试

```bash
# 运行所有测试
yarn hardhat test test/MerkleStakableNFT.test.ts

# 带 Gas 报告
yarn hardhat test --gas-report
```

---

## 📖 详细说明

### 合约接口

#### 管理员函数

```solidity
// 设置 Merkle Root（只能设置一次）
function setRarityMerkleRoot(bytes32 root) external onlyOwner

// 设置盲盒占位图
function setPlaceholderURI(string memory uri) external onlyOwner

// 设置基础 URI
function setBaseURI(string memory baseURI) external onlyOwner

// 提取合约中的 ETH
function withdraw() external onlyOwner
```

#### 用户函数

```solidity
// 铸造 NFT
function mint(uint256 quantity) external payable

// 领取单个 NFT 的稀有度
function claimRarity(
    uint256 tokenId,
    Rarity rarity,
    bytes32[] calldata merkleProof
) external

// 批量领取多个 NFT 的稀有度
function claimRarityBatch(
    uint256[] calldata tokenIds,
    Rarity[] calldata rarities,
    bytes32[][] calldata merkleProofs
) external
```

#### 查询函数

```solidity
// 查询稀有度
function getRarity(uint256 tokenId) public view returns (Rarity)

// 查询奖励倍率
function getRewardMultiplier(uint256 tokenId) public view returns (uint256)

// 查询是否已领取
function rarityClaimed(uint256 tokenId) public view returns (bool)

// 查询用户拥有的所有 tokenId
function tokensOfOwner(address owner) external view returns (uint256[])
```

### API 端点

#### GET /proof/:tokenId

获取单个 tokenId 的 Merkle Proof

**请求**：
```bash
curl http://localhost:3001/proof/42
```

**响应**：
```json
{
  "tokenId": 42,
  "rarity": 2,
  "rarityName": "Epic",
  "multiplier": 200,
  "proof": [
    "0xabc123...",
    "0xdef456...",
    "0x789abc..."
  ]
}
```

#### POST /proof/batch

批量获取多个 tokenId 的 Proof

**请求**：
```bash
curl -X POST http://localhost:3001/proof/batch \
  -H "Content-Type: application/json" \
  -d '{"tokenIds": [0, 1, 2]}'
```

**响应**：
```json
{
  "count": 3,
  "proofs": [
    {
      "tokenId": 0,
      "rarity": 0,
      "rarityName": "Common",
      "multiplier": 100,
      "proof": ["0x..."]
    },
    ...
  ]
}
```

#### GET /stats

获取统计信息

```bash
curl http://localhost:3001/stats
```

### 前端集成

#### 1. 复制 Hook 到项目

```bash
cp packages/hardhat/docs/useMerkleNFT.tsx packages/nextjs/hooks/
```

#### 2. 复制页面组件

```bash
cp packages/hardhat/docs/MerkleNFTPage.tsx packages/nextjs/app/merkle-nft/page.tsx
```

#### 3. 配置环境变量

```bash
# packages/nextjs/.env.local
NEXT_PUBLIC_MERKLE_API_URL=http://localhost:3001
```

#### 4. 使用示例

```tsx
import { useMerkleNFT } from "~~/hooks/useMerkleNFT";

function MyComponent() {
  const { userNFTs, mint, claimRarity } = useMerkleNFT();

  return (
    <div>
      {/* 铸造 */}
      <button onClick={() => mint(1)}>
        铸造 1 个 NFT
      </button>

      {/* 显示 NFT */}
      {userNFTs.map(nft => (
        <div key={nft.tokenId}>
          <p>NFT #{nft.tokenId}</p>
          {!nft.hasClaimed && (
            <button onClick={() => claimRarity(nft.tokenId)}>
              开盒
            </button>
          )}
          {nft.hasClaimed && (
            <p>{nft.rarityName} ({nft.multiplier/100}x)</p>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## 🧪 测试

### 运行测试

```bash
# 运行所有测试
yarn hardhat test

# 运行特定测试文件
yarn hardhat test test/MerkleStakableNFT.test.ts

# 查看详细输出
yarn hardhat test --verbose

# 生成 Gas 报告
yarn hardhat test --gas-reporter
```

### 测试覆盖

- ✅ 合约部署
- ✅ Merkle Root 设置
- ✅ NFT 铸造（单个和批量）
- ✅ 稀有度领取（单个和批量）
- ✅ Merkle Proof 验证
- ✅ 权限控制
- ✅ 边界情况
- ✅ 错误处理

---

## ❓ 常见问题

### Q1: 为什么使用 Merkle Tree？

**A**: Merkle Tree 的优势：

1. **Gas 成本低**：合约只存储 32 字节的 Root，而不是 1000 个稀有度
2. **精确控制**：链下洗牌保证精确的稀有度分布（恰好 10 个传奇）
3. **可验证**：任何人都可以验证 Merkle Proof 的正确性

**对比其他方案**：

| 方案 | 部署成本 | 精确控制 | 可验证性 |
|------|---------|---------|---------|
| 存储所有稀有度 | ~500,000 Gas | ✅ | ✅ |
| Merkle Tree | ~25,000 Gas | ✅ | ✅ |
| 链上随机 | ~10,000 Gas | ❌ | ⚠️ |

### Q2: API 服务宕机了怎么办？

**A**: 有几种解决方案：

1. **本地运行 API**：用户可以自己运行 API 服务（开源）
2. **多个镜像**：部署多个 API 服务镜像
3. **链上备份**（高级）：允许 owner 在紧急情况下直接设置稀有度

### Q3: 如何验证合约的公平性？

**A**: 用户可以自己验证：

1. **查看源代码**：合约开源，可以审计
2. **验证 Merkle Root**：
   ```bash
   # 下载稀有度数据
   curl http://localhost:3001/stats

   # 自己重建 Merkle Tree 并验证 Root
   ```
3. **验证 Proof**：可以独立验证 Merkle Proof 的正确性

### Q4: 为什么不用 Chainlink VRF？

**A**: Chainlink VRF 是最安全的方案，但：

- **成本高**：每次请求需要 $5-20
- **需要 LINK**：需要持有 LINK 代币
- **学习成本**：本项目是教学项目，Merkle Tree 更容易理解

对于生产环境，推荐使用 Chainlink VRF。

### Q5: 可以修改稀有度吗？

**A**: 不可以！

一旦 Merkle Root 设置后，就无法修改：
- Root 只能设置一次（`merkleRootSet` 检查）
- 任何修改都会导致 Proof 验证失败
- 保证了公平性和不可篡改性

---

## 📊 Gas 成本分析

| 操作 | Gas 成本 | ETH (30 gwei) | USD ($2000/ETH) |
|------|---------|---------------|-----------------|
| 部署合约 | ~1,500,000 | 0.045 ETH | $90 |
| 设置 Merkle Root | ~25,000 | 0.00075 ETH | $1.50 |
| 铸造 1 个 NFT | ~80,000 | 0.0024 ETH | $4.80 |
| 领取稀有度 | ~60,000 | 0.0018 ETH | $3.60 |
| 批量领取 5 个 | ~200,000 | 0.006 ETH | $12 |

---

## 🎓 学习要点

### 核心概念

1. **Merkle Tree 数据结构**
   - 哈希树的构建
   - 从叶子到根的路径
   - Proof 的生成和验证

2. **Solidity 密码学**
   - `keccak256()` 哈希函数
   - `abi.encodePacked()` 编码
   - `MerkleProof.verify()` 库的使用

3. **链上链下协作**
   - 链下计算 + 链上验证
   - API 服务的作用
   - 去信任化（Trustless）

### 代码注释重点

所有代码都包含**详细的中文注释**，特别解释了：

- 为什么这样设计
- 每个步骤的作用
- 可能的坑和解决方案
- 与其他方案的对比

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 许可证

MIT License

---

## 📞 联系方式

如有疑问，请提交 Issue 或联系项目维护者。

---

**祝你学习愉快！🎉**
