# NFT 质押与成就系统 - Web3 全栈学习项目

**项目代号**：NFT-Staking-Learning-Project
**版本**：v2.0（学习导向版）
**创建日期**：2025-10-30
**作者**：snome
**状态**：规划中
**项目类型**：学习项目（完整全栈实现）

---

## 📚 学习目标

### 核心学习成果

通过完成本项目，你将掌握：

#### 1. 智能合约开发（Hardhat）
- ✅ ERC721 NFT 标准及扩展（Enumerable, URIStorage, Votes）
- ✅ ERC20 代币标准与奖励分配机制
- ✅ 质押（Staking）核心逻辑设计
- ✅ 动态 NFT 元数据生成
- ✅ DAO 治理合约（Governor 模式）
- ✅ OpenZeppelin v5 合约库使用
- ✅ Gas 优化技巧
- ✅ 安全最佳实践（ReentrancyGuard, Pausable）

#### 2. 前端开发（Next.js + RainbowKit）
- ✅ Next.js App Router 架构
- ✅ Scaffold-ETH 专用 Hooks（useScaffoldReadContract, useScaffoldWriteContract）
- ✅ 钱包连接与账户管理（RainbowKit）
- ✅ 实时数据订阅（useScaffoldEventHistory, watch）
- ✅ 批量操作 UI 设计
- ✅ NFT 可视化展示
- ✅ 交易状态管理与错误处理

#### 3. 事件索引（Ponder）
- ✅ 区块链事件监听与索引
- ✅ GraphQL Schema 设计
- ✅ 实时数据聚合与统计
- ✅ 前端 GraphQL 查询（graphql-request + TanStack Query）
- ✅ 历史数据分析

####   4. Web3 周边生态
- ✅ IPFS 文件上传与 CID 生成
- ✅ NFT 元数据标准（JSON Metadata）
- ✅ 动态元数据更新策略
- ✅ 去中心化存储实践

#### 5. 开发工具链
- ✅ Yarn Workspaces 单体仓库管理
- ✅ TypeScript 类型安全
- ✅ Hardhat 测试与调试
- ✅ 本地链开发（Hardhat Network）
- ✅ 合约验证与部署（Etherscan）
- ✅ 环境变量管理

---

## 🎯 项目概述

### 1.1 项目简介

本项目构建一个 **NFT 质押挖矿平台**，用户质押不同稀有度的 NFT 获得 ERC20 代币奖励，并通过完成质押目标解锁**动态成就 NFT**，成就 NFT 可用于 **DAO 治理投票**。

**核心特色**：
- 🎨 动态 NFT 元数据（成就等级可视化）
- 📊 实时数据统计（Ponder 索引）
- 🗳️ 成就驱动的治理系统
- 💾 IPFS 去中心化存储

### 1.2 技术栈（Scaffold-ETH 2）

```
┌─────────────────────────────────────────────────────┐
│               Frontend Layer (Next.js)               │
│  Next.js 15 + RainbowKit + Wagmi + Viem + TailwindCSS│
└─────────────┬───────────────────────────┬───────────┘
              │                           │
              ▼                           ▼
┌──────────────────────┐      ┌─────────────────────┐
│  Blockchain Layer    │      │  Indexing Layer     │
│     (Hardhat)        │◄────►│     (Ponder)        │
│ - Smart Contracts    │      │ - Event Indexing    │
│ - Deploy Scripts     │      │ - GraphQL API       │
│ - Tests              │      │ - Aggregation       │
└──────────┬───────────┘      └─────────────────────┘
           │
           ▼
┌──────────────────────┐
│  Storage Layer       │
│      (IPFS)          │
│ - NFT Metadata       │
│ - Achievement Icons  │
└──────────────────────┘
```

### 1.3 功能范围

#### 包含功能（MVP）
- ✅ **Phase 1（Week 1-2）**：NFT 质押核心
  - 可质押的 ERC721 NFT（含稀有度属性）
  - 质押池合约（质押/取回/领取奖励）
  - 奖励计算（稀有度加成）
  - ERC20 奖励代币

- ✅ **Phase 2（Week 3-4）**：前端开发
  - NFT 铸造与展示
  - 质押/取回操作界面
  - 实时奖励显示
  - 用户质押历史

- ✅ **Phase 3（Week 5）**：成就系统
  - 动态成就 NFT
  - 成就触发器（监听质押事件）
  - 成就元数据生成（IPFS）

- ✅ **Phase 4（Week 6）**：Ponder 索引
  - 质押事件索引
  - 用户统计数据
  - 排行榜功能

- ✅ **Phase 5（Week 7）**：治理功能
  - 简化版 Governor 合约
  - 投票界面

#### 简化项（相比 v1.0）
- 🔻 批量操作（保留单个操作，简化学习曲线）
- 🔻 锁定期机制（可选实现）
- 🔻 复杂的 Gas 优化（专注功能实现）
- 🔻 应急模式（首版可省略）

#### 不包含功能
- ❌ 生产级安全审计
- ❌ 跨链功能
- ❌ NFT 二级市场

---

## 🏗️ 系统架构设计

### 2.1 合约架构

```
contracts/
├── tokens/
│   ├── StakableNFT.sol          # 可质押 NFT（稀有度属性）
│   ├── RewardToken.sol          # ERC20 奖励代币
│   └── AchievementNFT.sol       # 动态成就 NFT
├── staking/
│   ├── NFTStakingPool.sol       # 质押池核心
│   └── libraries/
│       └── RewardCalculator.sol # 奖励计算库
├── achievements/
│   └── AchievementTrigger.sol   # 成就解锁逻辑
└── governance/
    └── AchievementGovernor.sol  # DAO 治理（简化版）
```

### 2.2 前端架构

```
packages/nextjs/
├── app/
│   ├── page.tsx                    # 首页（项目介绍）
│   ├── mint/
│   │   └── page.tsx                # NFT 铸造页面
│   ├── stake/
│   │   └── page.tsx                # 质押管理页面
│   ├── achievements/
│   │   └── page.tsx                # 成就展示页面
│   ├── governance/
│   │   └── page.tsx                # 治理投票页面
│   └── stats/
│       └── page.tsx                # 数据统计页面（Ponder）
├── components/
│   ├── nft/
│   │   ├── NFTCard.tsx             # NFT 卡片组件
│   │   ├── RarityBadge.tsx         # 稀有度标签
│   │   └── StakeActions.tsx        # 质押操作按钮
│   ├── achievements/
│   │   ├── AchievementCard.tsx     # 成就卡片
│   │   └── ProgressBar.tsx         # 进度条
│   └── stats/
│       ├── StakingStats.tsx        # 质押统计
│       └── Leaderboard.tsx         # 排行榜
└── hooks/
    └── useGraphQL.ts               # GraphQL 查询 Hook
```

### 2.3 Ponder 索引架构

```
packages/ponder/
├── ponder.config.ts               # 配置（自动读取 deployedContracts）
├── ponder.schema.ts               # 数据库 Schema
└── src/
    ├── StakableNFT.ts             # 监听 NFT Minted 事件
    ├── NFTStakingPool.ts          # 监听 Staked/Unstaked/Claimed 事件
    └── AchievementNFT.ts          # 监听成就解锁事件
```

---

## 📐 详细功能设计

### 3.1 Phase 1：智能合约核心（Week 1-2）

#### 3.1.1 StakableNFT 合约

**学习要点**：
- ERC721 标准及扩展使用
- 自定义属性存储（稀有度）
- 枚举类型（Rarity enum）

**核心代码**：
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract StakableNFT is ERC721, ERC721URIStorage, ERC721Enumerable, Ownable {
    enum Rarity { Common, Rare, Epic, Legendary }

    struct NFTMetadata {
        Rarity rarity;
        uint256 mintedAt;
    }

    mapping(uint256 => NFTMetadata) public nftMetadata;
    uint256 private _nextTokenId;

    // 稀有度倍率映射
    mapping(Rarity => uint256) public rarityMultipliers;

    constructor() ERC721("StakableNFT", "SNFT") Ownable(msg.sender) {
        rarityMultipliers[Rarity.Common] = 100;      // 1.0x
        rarityMultipliers[Rarity.Rare] = 150;        // 1.5x
        rarityMultipliers[Rarity.Epic] = 200;        // 2.0x
        rarityMultipliers[Rarity.Legendary] = 300;   // 3.0x
    }

    function mint(address to, Rarity rarity, string memory uri) external onlyOwner {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        nftMetadata[tokenId] = NFTMetadata({
            rarity: rarity,
            mintedAt: block.timestamp
        });

        emit NFTMinted(to, tokenId, rarity, block.timestamp);
    }

    function getRarity(uint256 tokenId) external view returns (Rarity) {
        return nftMetadata[tokenId].rarity;
    }

    function getRewardMultiplier(uint256 tokenId) external view returns (uint256) {
        return rarityMultipliers[nftMetadata[tokenId].rarity];
    }

    // 必需的重写函数（处理多重继承）
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    event NFTMinted(address indexed to, uint256 indexed tokenId, Rarity rarity, uint256 timestamp);
}
```

**测试要点**：
- [ ] 铸造不同稀有度的 NFT
- [ ] 查询稀有度和倍率
- [ ] tokenURI 正确返回
- [ ] 权限控制（非 owner 无法铸造）

---

#### 3.1.2 NFTStakingPool 合约

**学习要点**：
- ERC721Holder 使用（接收 NFT）
- ReentrancyGuard 防重入
- 时间基础的奖励计算

**核心代码**：
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IStakableNFT {
    function getRewardMultiplier(uint256 tokenId) external view returns (uint256);
}

contract NFTStakingPool is ERC721Holder, ReentrancyGuard, Ownable {
    struct StakeInfo {
        address owner;
        uint256 stakedAt;
        uint256 lastClaimAt;
        uint256 rewardMultiplier;
    }

    IERC721 public stakableNFT;
    IERC20 public rewardToken;

    uint256 public baseRewardPerSecond = 1e15; // 0.001 token/秒（示例值）

    mapping(uint256 => StakeInfo) public stakes;
    mapping(address => uint256[]) public userStakedTokens;

    constructor(address _nft, address _rewardToken) Ownable(msg.sender) {
        stakableNFT = IERC721(_nft);
        rewardToken = IERC20(_rewardToken);
    }

    function stake(uint256 tokenId) external nonReentrant {
        require(stakes[tokenId].owner == address(0), "Already staked");

        // 转入 NFT
        stakableNFT.safeTransferFrom(msg.sender, address(this), tokenId);

        // 获取稀有度倍率
        uint256 multiplier = IStakableNFT(address(stakableNFT)).getRewardMultiplier(tokenId);

        // 记录质押信息
        stakes[tokenId] = StakeInfo({
            owner: msg.sender,
            stakedAt: block.timestamp,
            lastClaimAt: block.timestamp,
            rewardMultiplier: multiplier
        });

        userStakedTokens[msg.sender].push(tokenId);

        emit Staked(msg.sender, tokenId, multiplier, block.timestamp);
    }

    function unstake(uint256 tokenId) external nonReentrant {
        StakeInfo memory info = stakes[tokenId];
        require(info.owner == msg.sender, "Not owner");

        // 计算并发放奖励
        uint256 rewards = calculateRewards(tokenId);
        if (rewards > 0) {
            rewardToken.transfer(msg.sender, rewards);
        }

        // 返还 NFT
        stakableNFT.safeTransferFrom(address(this), msg.sender, tokenId);

        // 清理状态
        delete stakes[tokenId];
        _removeFromUserStakes(msg.sender, tokenId);

        emit Unstaked(msg.sender, tokenId, rewards, block.timestamp);
    }

    function claimRewards(uint256 tokenId) external nonReentrant {
        StakeInfo storage info = stakes[tokenId];
        require(info.owner == msg.sender, "Not owner");

        uint256 rewards = calculateRewards(tokenId);
        require(rewards > 0, "No rewards");

        info.lastClaimAt = block.timestamp;
        rewardToken.transfer(msg.sender, rewards);

        emit RewardsClaimed(msg.sender, tokenId, rewards);
    }

    function calculateRewards(uint256 tokenId) public view returns (uint256) {
        StakeInfo memory info = stakes[tokenId];
        if (info.owner == address(0)) return 0;

        uint256 duration = block.timestamp - info.lastClaimAt;
        uint256 baseReward = baseRewardPerSecond * duration;

        return (baseReward * info.rewardMultiplier) / 100;
    }

    function getUserStakes(address user) external view returns (uint256[] memory) {
        return userStakedTokens[user];
    }

    function _removeFromUserStakes(address user, uint256 tokenId) private {
        uint256[] storage tokens = userStakedTokens[user];
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i] == tokenId) {
                tokens[i] = tokens[tokens.length - 1];
                tokens.pop();
                break;
            }
        }
    }

    // 管理员函数：设置奖励速率
    function setBaseRewardPerSecond(uint256 _rate) external onlyOwner {
        baseRewardPerSecond = _rate;
    }

    event Staked(address indexed user, uint256 indexed tokenId, uint256 multiplier, uint256 timestamp);
    event Unstaked(address indexed user, uint256 indexed tokenId, uint256 rewards, uint256 timestamp);
    event RewardsClaimed(address indexed user, uint256 indexed tokenId, uint256 amount);
}
```

**测试要点**：
- [ ] 质押流程（转入 NFT + 记录状态）
- [ ] 奖励计算准确性（不同稀有度）
- [ ] 领取奖励（更新 lastClaimAt）
- [ ] 取回流程（奖励发放 + NFT 返还）
- [ ] 边界情况（重复质押、非 owner 取回）

---

#### 3.1.3 RewardToken 合约

**学习要点**：
- 标准 ERC20 代币
- 预铸造供应量

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RewardToken is ERC20, Ownable {
    constructor() ERC20("Reward Token", "RWRD") Ownable(msg.sender) {
        // 预铸造 1000万 代币到 owner
        _mint(msg.sender, 10_000_000 * 10**decimals());
    }

    // 管理员可增发（用于补充奖励池）
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
```

---

### 3.2 Phase 2：前端开发（Week 3-4）

#### 3.2.1 铸造页面（/mint）

**学习要点**：
- useScaffoldWriteContract 使用
- 表单状态管理
- 交易状态监听

**组件代码**：
```tsx
// app/mint/page.tsx
"use client";

import { useState } from "react";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { RarityBadge } from "~~/components/nft/RarityBadge";

const RARITIES = [
  { value: 0, label: "Common", multiplier: "1x" },
  { value: 1, label: "Rare", multiplier: "1.5x" },
  { value: 2, label: "Epic", multiplier: "2x" },
  { value: 3, label: "Legendary", multiplier: "3x" },
];

export default function MintPage() {
  const [selectedRarity, setSelectedRarity] = useState(0);
  const [tokenURI, setTokenURI] = useState("");

  const { writeContractAsync: mintNFT, isPending } = useScaffoldWriteContract("StakableNFT");

  const handleMint = async () => {
    try {
      await mintNFT({
        functionName: "mint",
        args: [address, selectedRarity, tokenURI], // address 来自 useAccount
      });
      // 成功后重置表单
      setTokenURI("");
    } catch (error) {
      console.error("Mint failed:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Mint Stakable NFT</h1>

      {/* 稀有度选择 */}
      <div className="mb-6">
        <label className="block mb-2 font-semibold">Select Rarity:</label>
        <div className="flex gap-4">
          {RARITIES.map((r) => (
            <button
              key={r.value}
              onClick={() => setSelectedRarity(r.value)}
              className={`btn ${selectedRarity === r.value ? "btn-primary" : "btn-outline"}`}
            >
              <RarityBadge rarity={r.value} />
              <span className="ml-2">{r.multiplier}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Token URI 输入 */}
      <div className="mb-6">
        <label className="block mb-2 font-semibold">Token URI (IPFS link):</label>
        <input
          type="text"
          value={tokenURI}
          onChange={(e) => setTokenURI(e.target.value)}
          placeholder="ipfs://..."
          className="input input-bordered w-full"
        />
      </div>

      {/* 铸造按钮 */}
      <button
        onClick={handleMint}
        disabled={isPending || !tokenURI}
        className="btn btn-primary w-full"
      >
        {isPending ? "Minting..." : "Mint NFT"}
      </button>
    </div>
  );
}
```

---

#### 3.2.2 质押页面（/stake）

**学习要点**：
- useScaffoldReadContract 读取链上数据
- 实时显示待领取奖励（useEffect + setInterval）
- 批量读取用户 NFT

**核心逻辑**：
```tsx
// app/stake/page.tsx
"use client";

import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { NFTCard } from "~~/components/nft/NFTCard";

export default function StakePage() {
  const { address } = useAccount();

  // 读取用户持有的 NFT 数量
  const { data: balance } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "balanceOf",
    args: [address],
    watch: true,
  });

  // 读取用户已质押的 NFT
  const { data: stakedTokens } = useScaffoldReadContract({
    contractName: "NFTStakingPool",
    functionName: "getUserStakes",
    args: [address],
    watch: true,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My NFTs</h1>

      <div className="grid grid-cols-3 gap-6">
        {/* 渲染 NFT 列表 */}
        {stakedTokens?.map((tokenId) => (
          <NFTCard key={tokenId.toString()} tokenId={tokenId} isStaked={true} />
        ))}
      </div>
    </div>
  );
}
```

```tsx
// components/nft/NFTCard.tsx
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useState, useEffect } from "react";

export function NFTCard({ tokenId, isStaked }: { tokenId: bigint; isStaked: boolean }) {
  const [pendingRewards, setPendingRewards] = useState("0");

  // 读取稀有度
  const { data: rarity } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "getRarity",
    args: [tokenId],
  });

  // 实时计算奖励
  useEffect(() => {
    if (!isStaked) return;

    const interval = setInterval(async () => {
      // 调用 calculateRewards 获取最新奖励
      const rewards = await calculateRewards(tokenId);
      setPendingRewards(rewards);
    }, 1000); // 每秒更新

    return () => clearInterval(interval);
  }, [tokenId, isStaked]);

  const { writeContractAsync: stake } = useScaffoldWriteContract("NFTStakingPool");
  const { writeContractAsync: unstake } = useScaffoldWriteContract("NFTStakingPool");

  return (
    <div className="card bg-base-200 shadow-xl">
      <figure>
        {/* TODO: 从 IPFS 加载图片 */}
        <img src={`/nft-placeholder.png`} alt={`NFT #${tokenId}`} />
      </figure>
      <div className="card-body">
        <h2 className="card-title">NFT #{tokenId.toString()}</h2>
        <RarityBadge rarity={rarity} />

        {isStaked && (
          <div className="mt-2">
            <p className="text-sm">Pending Rewards:</p>
            <p className="text-xl font-bold">{pendingRewards} RWRD</p>
          </div>
        )}

        <div className="card-actions mt-4">
          {!isStaked ? (
            <button
              onClick={() => stake({ functionName: "stake", args: [tokenId] })}
              className="btn btn-primary btn-block"
            >
              Stake
            </button>
          ) : (
            <>
              <button
                onClick={() => unstake({ functionName: "unstake", args: [tokenId] })}
                className="btn btn-secondary btn-block"
              >
                Unstake
              </button>
              <button
                onClick={() => stake({ functionName: "claimRewards", args: [tokenId] })}
                className="btn btn-accent btn-block"
              >
                Claim Rewards
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

### 3.3 Phase 3：成就系统（Week 5）

#### 3.3.1 AchievementNFT 合约

**学习要点**：
- ERC721Votes（用于治理）
- 动态 tokenURI 生成
- 跨合约调用

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Votes.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AchievementNFT is ERC721, ERC721Enumerable, ERC721URIStorage, ERC721Votes, EIP712, Ownable {
    enum AchievementType { FirstStake, Whale, Diamond, LegendaryCollector }

    struct Achievement {
        AchievementType achievementType;
        uint256 level;
        uint256 unlockedAt;
        uint256 votingPower;
    }

    mapping(uint256 => Achievement) public achievements;
    mapping(address => mapping(AchievementType => uint256)) public userAchievements; // user => type => tokenId

    uint256 private _nextTokenId;
    address public triggerContract;

    constructor()
        ERC721("Achievement NFT", "ACH")
        EIP712("AchievementNFT", "1")
        Ownable(msg.sender)
    {}

    function setTriggerContract(address _trigger) external onlyOwner {
        triggerContract = _trigger;
    }

    modifier onlyTrigger() {
        require(msg.sender == triggerContract, "Only trigger");
        _;
    }

    function mint(address to, AchievementType achievementType) external onlyTrigger {
        require(userAchievements[to][achievementType] == 0, "Already has achievement");

        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);

        uint256 votingPower = _getVotingPowerForType(achievementType);

        achievements[tokenId] = Achievement({
            achievementType: achievementType,
            level: 1,
            unlockedAt: block.timestamp,
            votingPower: votingPower
        });

        userAchievements[to][achievementType] = tokenId;

        // 生成元数据 URI（指向 IPFS）
        string memory uri = string(abi.encodePacked(
            "ipfs://QmExample/achievement-",
            _toString(uint256(achievementType)),
            "-level-1.json"
        ));
        _setTokenURI(tokenId, uri);

        emit AchievementUnlocked(to, tokenId, achievementType, block.timestamp);
    }

    function _getVotingPowerForType(AchievementType t) private pure returns (uint256) {
        if (t == AchievementType.FirstStake) return 10;
        if (t == AchievementType.Whale) return 50;
        if (t == AchievementType.Diamond) return 100;
        if (t == AchievementType.LegendaryCollector) return 150;
        return 0;
    }

    function getVotingPower(address user) external view returns (uint256) {
        uint256 total = 0;
        uint256 balance = balanceOf(user);

        for (uint256 i = 0; i < balance; i++) {
            uint256 tokenId = tokenOfOwnerByIndex(user, i);
            total += achievements[tokenId].votingPower;
        }

        return total;
    }

    // 必需的重写函数
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable, ERC721Votes)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable, ERC721Votes)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _toString(uint256 value) private pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    event AchievementUnlocked(address indexed user, uint256 indexed tokenId, AchievementType achievementType, uint256 timestamp);
}
```

---

#### 3.3.2 AchievementTrigger 合约

**学习要点**：
- 事件监听与自动触发
- 用户进度跟踪

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AchievementNFT.sol";

interface INFTStakingPool {
    function getUserStakes(address user) external view returns (uint256[] memory);
}

interface IStakableNFT {
    enum Rarity { Common, Rare, Epic, Legendary }
    function getRarity(uint256 tokenId) external view returns (Rarity);
}

contract AchievementTrigger {
    AchievementNFT public achievementNFT;
    INFTStakingPool public stakingPool;
    IStakableNFT public stakableNFT;

    struct UserProgress {
        uint256 totalStakedCount;
        uint256 firstStakeTime;
        uint256 legendaryCount;
    }

    mapping(address => UserProgress) public userProgress;

    constructor(address _achievementNFT, address _stakingPool, address _stakableNFT) {
        achievementNFT = AchievementNFT(_achievementNFT);
        stakingPool = INFTStakingPool(_stakingPool);
        stakableNFT = IStakableNFT(_stakableNFT);
    }

    function onStake(address user, uint256 tokenId) external {
        require(msg.sender == address(stakingPool), "Only staking pool");

        UserProgress storage progress = userProgress[user];
        progress.totalStakedCount++;

        if (progress.firstStakeTime == 0) {
            progress.firstStakeTime = block.timestamp;
        }

        // 检查是否是传说级 NFT
        if (stakableNFT.getRarity(tokenId) == IStakableNFT.Rarity.Legendary) {
            progress.legendaryCount++;
        }

        checkAchievements(user);
    }

    function checkAchievements(address user) public {
        UserProgress memory progress = userProgress[user];

        // 首次质押成就
        if (progress.firstStakeTime > 0 &&
            achievementNFT.userAchievements(user, AchievementNFT.AchievementType.FirstStake) == 0) {
            achievementNFT.mint(user, AchievementNFT.AchievementType.FirstStake);
        }

        // 巨鲸成就（质押 10 个）
        if (progress.totalStakedCount >= 10 &&
            achievementNFT.userAchievements(user, AchievementNFT.AchievementType.Whale) == 0) {
            achievementNFT.mint(user, AchievementNFT.AchievementType.Whale);
        }

        // 传说收集者成就
        if (progress.legendaryCount >= 1 &&
            achievementNFT.userAchievements(user, AchievementNFT.AchievementType.LegendaryCollector) == 0) {
            achievementNFT.mint(user, AchievementNFT.AchievementType.LegendaryCollector);
        }
    }
}
```

**注意**：需要修改 NFTStakingPool 的 `stake` 函数，添加：
```solidity
// 在 stake 函数末尾添加
if (address(achievementTrigger) != address(0)) {
    achievementTrigger.onStake(msg.sender, tokenId);
}
```

---

#### 3.3.3 IPFS 元数据上传

**学习要点**：
- IPFS 文件上传（使用 Pinata 或 Web3.Storage）
- NFT 元数据标准

**示例元数据文件**（`achievement-0-level-1.json`）：
```json
{
  "name": "First Stake Achievement",
  "description": "Awarded for completing your first NFT stake",
  "image": "ipfs://QmExampleImageCID/first-stake.png",
  "attributes": [
    {
      "trait_type": "Type",
      "value": "First Stake"
    },
    {
      "trait_type": "Level",
      "value": 1
    },
    {
      "trait_type": "Voting Power",
      "value": 10
    }
  ]
}
```

**上传脚本**（可以放在 `packages/hardhat/scripts/uploadToIPFS.ts`）：
```typescript
import { create } from 'ipfs-http-client';
import fs from 'fs';
import path from 'path';

// 使用 Infura IPFS（需要注册获取 API key）
const projectId = process.env.IPFS_PROJECT_ID;
const projectSecret = process.env.IPFS_PROJECT_SECRET;
const auth = 'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64');

const client = create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  headers: {
    authorization: auth,
  },
});

async function uploadMetadata() {
  const metadataPath = path.join(__dirname, '../metadata/achievement-0-level-1.json');
  const file = fs.readFileSync(metadataPath);

  const result = await client.add(file);
  console.log('IPFS CID:', result.cid.toString());
  console.log('Full URI: ipfs://' + result.cid.toString());
}

uploadMetadata().catch(console.error);
```

---

### 3.4 Phase 4：Ponder 索引（Week 6）

#### 3.4.1 Ponder Schema 设计

**学习要点**：
- onchainTable API
- 表关系设计

```typescript
// packages/ponder/ponder.schema.ts
import { onchainTable, relations } from "@ponder/core";

export const nftMints = onchainTable("nft_mints", (t) => ({
  id: t.text().primaryKey(), // tokenId
  owner: t.text().notNull(),
  rarity: t.integer().notNull(), // 0-3
  mintedAt: t.integer().notNull(),
}));

export const stakes = onchainTable("stakes", (t) => ({
  id: t.text().primaryKey(), // tokenId
  owner: t.text().notNull(),
  tokenId: t.text().notNull(),
  stakedAt: t.integer().notNull(),
  unstakedAt: t.integer(), // null 表示仍在质押
  rewardsEarned: t.text().notNull().default("0"),
  isActive: t.boolean().notNull().default(true),
}));

export const userStats = onchainTable("user_stats", (t) => ({
  id: t.text().primaryKey(), // user address
  totalStaked: t.integer().notNull().default(0),
  currentStaked: t.integer().notNull().default(0),
  totalRewardsEarned: t.text().notNull().default("0"),
  achievementsUnlocked: t.integer().notNull().default(0),
}));

export const achievements = onchainTable("achievements", (t) => ({
  id: t.text().primaryKey(), // tokenId
  owner: t.text().notNull(),
  achievementType: t.integer().notNull(),
  level: t.integer().notNull(),
  unlockedAt: t.integer().notNull(),
  votingPower: t.integer().notNull(),
}));

// 定义关系（可选）
export const userStatsRelations = relations(userStats, ({ many }) => ({
  stakes: many(stakes),
  achievements: many(achievements),
}));
```

---

#### 3.4.2 事件索引器

**学习要点**：
- 监听智能合约事件
- 数据聚合与更新

```typescript
// packages/ponder/src/NFTStakingPool.ts
import { ponder } from "@/generated";

ponder.on("NFTStakingPool:Staked", async ({ event, context }) => {
  const { user, tokenId, multiplier, timestamp } = event.args;
  const { stakes, userStats } = context.db;

  // 记录质押事件
  await stakes.create({
    id: tokenId.toString(),
    data: {
      owner: user,
      tokenId: tokenId.toString(),
      stakedAt: Number(timestamp),
      isActive: true,
      rewardsEarned: "0",
    },
  });

  // 更新用户统计
  const existingStats = await userStats.findUnique({ id: user });

  if (existingStats) {
    await userStats.update({
      id: user,
      data: {
        totalStaked: existingStats.totalStaked + 1,
        currentStaked: existingStats.currentStaked + 1,
      },
    });
  } else {
    await userStats.create({
      id: user,
      data: {
        totalStaked: 1,
        currentStaked: 1,
        totalRewardsEarned: "0",
        achievementsUnlocked: 0,
      },
    });
  }
});

ponder.on("NFTStakingPool:Unstaked", async ({ event, context }) => {
  const { user, tokenId, rewards, timestamp } = event.args;
  const { stakes, userStats } = context.db;

  // 更新质押记录
  await stakes.update({
    id: tokenId.toString(),
    data: {
      unstakedAt: Number(timestamp),
      isActive: false,
      rewardsEarned: rewards.toString(),
    },
  });

  // 更新用户统计
  const stats = await userStats.findUnique({ id: user });
  if (stats) {
    await userStats.update({
      id: user,
      data: {
        currentStaked: Math.max(0, stats.currentStaked - 1),
        totalRewardsEarned: (BigInt(stats.totalRewardsEarned) + rewards).toString(),
      },
    });
  }
});

ponder.on("NFTStakingPool:RewardsClaimed", async ({ event, context }) => {
  const { user, tokenId, amount } = event.args;
  const { stakes, userStats } = context.db;

  // 累计奖励
  const stake = await stakes.findUnique({ id: tokenId.toString() });
  if (stake) {
    await stakes.update({
      id: tokenId.toString(),
      data: {
        rewardsEarned: (BigInt(stake.rewardsEarned) + amount).toString(),
      },
    });
  }

  const stats = await userStats.findUnique({ id: user });
  if (stats) {
    await userStats.update({
      id: user,
      data: {
        totalRewardsEarned: (BigInt(stats.totalRewardsEarned) + amount).toString(),
      },
    });
  }
});
```

---

#### 3.4.3 前端 GraphQL 查询

**学习要点**：
- graphql-request 使用
- TanStack Query（React Query）集成

```typescript
// hooks/useGraphQL.ts
import { useQuery } from "@tanstack/react-query";
import { GraphQLClient, gql } from "graphql-request";

const PONDER_URL = process.env.NEXT_PUBLIC_PONDER_URL || "http://localhost:42069";
const client = new GraphQLClient(PONDER_URL);

export function useUserStats(address: string | undefined) {
  return useQuery({
    queryKey: ["userStats", address],
    queryFn: async () => {
      if (!address) return null;

      const query = gql`
        query GetUserStats($id: String!) {
          userStats(id: $id) {
            totalStaked
            currentStaked
            totalRewardsEarned
            achievementsUnlocked
          }
        }
      `;

      const data = await client.request(query, { id: address.toLowerCase() });
      return data.userStats;
    },
    enabled: !!address,
  });
}

export function useLeaderboard() {
  return useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const query = gql`
        query GetLeaderboard {
          userStats(orderBy: "totalRewardsEarned", orderDirection: "desc", limit: 10) {
            items {
              id
              totalStaked
              totalRewardsEarned
              achievementsUnlocked
            }
          }
        }
      `;

      const data = await client.request(query);
      return data.userStats.items;
    },
  });
}
```

**使用示例**：
```tsx
// app/stats/page.tsx
"use client";

import { useAccount } from "wagmi";
import { useUserStats, useLeaderboard } from "~~/hooks/useGraphQL";

export default function StatsPage() {
  const { address } = useAccount();
  const { data: userStats } = useUserStats(address);
  const { data: leaderboard } = useLeaderboard();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Statistics</h1>

      {/* 用户统计卡片 */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="stat bg-base-200">
          <div className="stat-title">Total Staked</div>
          <div className="stat-value">{userStats?.totalStaked || 0}</div>
        </div>
        <div className="stat bg-base-200">
          <div className="stat-title">Currently Staked</div>
          <div className="stat-value">{userStats?.currentStaked || 0}</div>
        </div>
        <div className="stat bg-base-200">
          <div className="stat-title">Total Rewards</div>
          <div className="stat-value">{userStats?.totalRewardsEarned || "0"}</div>
        </div>
        <div className="stat bg-base-200">
          <div className="stat-title">Achievements</div>
          <div className="stat-value">{userStats?.achievementsUnlocked || 0}</div>
        </div>
      </div>

      {/* 排行榜 */}
      <h2 className="text-2xl font-bold mb-4">Leaderboard</h2>
      <table className="table w-full">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Address</th>
            <th>Total Staked</th>
            <th>Total Rewards</th>
            <th>Achievements</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard?.map((user, index) => (
            <tr key={user.id}>
              <td>{index + 1}</td>
              <td>{user.id.slice(0, 6)}...{user.id.slice(-4)}</td>
              <td>{user.totalStaked}</td>
              <td>{user.totalRewardsEarned}</td>
              <td>{user.achievementsUnlocked}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

### 3.5 Phase 5：治理功能（Week 7）

#### 3.5.1 简化版 Governor 合约

**学习要点**：
- OpenZeppelin Governor 模式
- 投票权重计算

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";

contract AchievementGovernor is Governor, GovernorSettings, GovernorCountingSimple, GovernorVotes {
    constructor(IVotes _token)
        Governor("AchievementGovernor")
        GovernorSettings(1 /* 1 block */, 50400 /* 1 week */, 0)
        GovernorVotes(_token)
    {}

    function votingDelay() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingDelay();
    }

    function votingPeriod() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingPeriod();
    }

    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }
}
```

---

## 🧪 测试策略

### 4.1 合约测试（Hardhat）

**测试文件结构**：
```
packages/hardhat/test/
├── StakableNFT.test.ts
├── NFTStakingPool.test.ts
├── AchievementNFT.test.ts
├── AchievementTrigger.test.ts
└── AchievementGovernor.test.ts
```

**示例测试**（StakableNFT.test.ts）：
```typescript
import { expect } from "chai";
import { ethers } from "hardhat";
import { StakableNFT } from "../typechain-types";

describe("StakableNFT", function () {
  let stakableNFT: StakableNFT;
  let owner: any;
  let user1: any;

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();

    const StakableNFTFactory = await ethers.getContractFactory("StakableNFT");
    stakableNFT = await StakableNFTFactory.deploy();
  });

  describe("Minting", function () {
    it("Should mint NFT with correct rarity", async function () {
      const tokenURI = "ipfs://QmExample";
      const rarity = 0; // Common

      await stakableNFT.mint(user1.address, rarity, tokenURI);

      expect(await stakableNFT.ownerOf(0)).to.equal(user1.address);
      expect(await stakableNFT.getRarity(0)).to.equal(rarity);
      expect(await stakableNFT.tokenURI(0)).to.equal(tokenURI);
    });

    it("Should assign correct multiplier based on rarity", async function () {
      await stakableNFT.mint(user1.address, 0, "ipfs://common");    // Common
      await stakableNFT.mint(user1.address, 1, "ipfs://rare");      // Rare
      await stakableNFT.mint(user1.address, 2, "ipfs://epic");      // Epic
      await stakableNFT.mint(user1.address, 3, "ipfs://legendary"); // Legendary

      expect(await stakableNFT.getRewardMultiplier(0)).to.equal(100);
      expect(await stakableNFT.getRewardMultiplier(1)).to.equal(150);
      expect(await stakableNFT.getRewardMultiplier(2)).to.equal(200);
      expect(await stakableNFT.getRewardMultiplier(3)).to.equal(300);
    });

    it("Should revert if non-owner tries to mint", async function () {
      await expect(
        stakableNFT.connect(user1).mint(user1.address, 0, "ipfs://test")
      ).to.be.revertedWithCustomError(stakableNFT, "OwnableUnauthorizedAccount");
    });
  });
});
```

**运行测试**：
```bash
yarn hardhat:test
yarn hardhat:test --grep "Minting"  # 运行特定测试
```

---

### 4.2 前端测试（可选）

使用 Vitest + React Testing Library：
```typescript
// components/nft/NFTCard.test.tsx
import { render, screen } from "@testing-library/react";
import { NFTCard } from "./NFTCard";

describe("NFTCard", () => {
  it("should render NFT tokenId", () => {
    render(<NFTCard tokenId={1n} isStaked={false} />);
    expect(screen.getByText(/NFT #1/i)).toBeInTheDocument();
  });
});
```

---

## 📅 7 周开发计划

| Week | 重点任务 | 交付物 | 学习目标 |
|------|---------|--------|---------|
| **Week 1** | 合约开发（Part 1） | StakableNFT + RewardToken + 测试 | ERC721/ERC20 标准、Solidity 基础 |
| **Week 2** | 合约开发（Part 2） | NFTStakingPool + 测试 | 质押逻辑、奖励计算、安全机制 |
| **Week 3** | 前端开发（Part 1） | 铸造页面 + NFT 展示 | Next.js App Router、RainbowKit |
| **Week 4** | 前端开发（Part 2） | 质押界面 + 实时奖励 | Scaffold-ETH Hooks、状态管理 |
| **Week 5** | 成就系统 | AchievementNFT + Trigger + IPFS | 动态 NFT、跨合约调用、IPFS |
| **Week 6** | Ponder 索引 | Schema + 索引器 + GraphQL 查询 | 事件监听、数据聚合、GraphQL |
| **Week 7** | 治理 + 部署 | Governor 合约 + 测试网部署 | DAO 治理、合约验证、生产部署 |

---

## 🚀 部署流程

### 5.1 本地开发

```bash
# 1. 启动本地链
yarn chain

# 2. 部署合约（新终端）
yarn deploy

# 3. 启动前端（新终端）
yarn start

# 4. 启动 Ponder（新终端）
yarn ponder:dev
```

### 5.2 测试网部署（Sepolia）

**步骤**：
1. 配置环境变量（`.env`）：
```bash
DEPLOYER_PRIVATE_KEY=your_private_key
ALCHEMY_API_KEY=your_alchemy_key
ETHERSCAN_API_KEY=your_etherscan_key
```

2. 部署合约：
```bash
yarn deploy --network sepolia
```

3. 验证合约：
```bash
yarn hardhat:verify --network sepolia
```

4. 配置前端环境变量（`packages/nextjs/.env.local`）：
```bash
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_wc_project_id
NEXT_PUBLIC_PONDER_URL=https://your-ponder-instance.com
```

5. 部署 Ponder（Railway / Render）：
```bash
# 设置启动命令
yarn ponder:start

# 配置环境变量
PONDER_RPC_URL_11155111=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
```

6. 部署前端（Vercel）：
```bash
yarn vercel
```

---

## ✅ 学习检查清单

### 智能合约
- [ ] 理解 ERC721 标准及扩展
- [ ] 掌握质押（Staking）核心逻辑
- [ ] 实现时间基础的奖励计算
- [ ] 使用 ReentrancyGuard 防重入
- [ ] 编写完整的单元测试
- [ ] 使用 OpenZeppelin v5 合约库
- [ ] 实现动态 NFT 元数据
- [ ] 理解 ERC721Votes 与治理

### 前端开发
- [ ] 使用 Next.js App Router
- [ ] 集成 RainbowKit 钱包连接
- [ ] 使用 Scaffold-ETH Hooks 读写合约
- [ ] 实现实时数据订阅（watch）
- [ ] 处理交易状态与错误
- [ ] 设计响应式 UI（TailwindCSS）

### Ponder 索引
- [ ] 设计 GraphQL Schema
- [ ] 监听智能合约事件
- [ ] 实现数据聚合与统计
- [ ] 使用 graphql-request 查询数据
- [ ] 部署 Ponder 到生产环境

### Web3 周边
- [ ] 上传文件到 IPFS
- [ ] 生成符合标准的 NFT 元数据
- [ ] 理解 CID（Content Identifier）

### 工具链
- [ ] 使用 Yarn Workspaces 管理单体仓库
- [ ] 配置 TypeScript 类型
- [ ] 使用 Hardhat 测试与调试
- [ ] 在 Etherscan 上验证合约
- [ ] 管理多环境配置（local / testnet / mainnet）

---

## 📚 参考资源

### 官方文档
- [Scaffold-ETH 2 Docs](https://docs.scaffoldeth.io/)
- [OpenZeppelin Contracts v5](https://docs.openzeppelin.com/contracts/5.x/)
- [Ponder Documentation](https://ponder.sh/)
- [RainbowKit Docs](https://www.rainbowkit.com/)
- [Wagmi Docs](https://wagmi.sh/)
- [IPFS Docs](https://docs.ipfs.tech/)

### 学习资源
- [Solidity by Example](https://solidity-by-example.org/)
- [Smart Contract Programmer](https://www.youtube.com/channel/UCJWh7F3AFyQ_x01VKzr9eyA)
- [Scaffold-ETH 2 Examples](https://github.com/scaffold-eth/scaffold-eth-2/tree/main/packages)

---

## 🎓 项目总结

完成本项目后，你将获得：
1. **完整的全栈 dApp 开发经验**（合约 + 前端 + 索引）
2. **可展示的作品集项目**（包含代码 + 部署实例）
3. **Web3 开发最佳实践**（安全、测试、部署）
4. **生态工具熟练度**（Hardhat, Scaffold-ETH, Ponder, IPFS）

**下一步方向**：
- 添加更多成就类型
- 实现锁定期与加速机制
- 支持多 NFT 合约质押
- 开发移动端适配
- 进行安全审计

---

**文档结束**

*祝学习愉快！如有疑问，请查阅对应模块的官方文档或在社区提问。*
