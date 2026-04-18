# NFT Staking Pool 设计文档

## 1. 概述

本文档描述 NFT 质押池（NFTStakingPool）的完整设计方案。这是质押系统的核心合约，负责管理 NFT 质押、奖励计算和代币分发。

### 1.1 核心定位

```
用户质押 StakableNFT → NFTStakingPool 计算奖励 → 铸造 RWRD 代币发放
```

**NFTStakingPool 的职责：**
- ✅ 接收和托管用户质押的 NFT
- ✅ 根据质押时间和稀有度计算奖励
- ✅ 铸造 RWRD 代币作为奖励发放给用户
- ✅ 支持随时领取奖励和解除质押
- ❌ 不涉及代币供应量管理（由 RewardToken 控制）
- ❌ 不处理 NFT 稀有度逻辑（由 StakableNFT 提供）

### 1.2 系统架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                       NFT 质押系统完整架构                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐         ┌─────────────────┐                   │
│  │  StakableNFT    │         │  RewardToken    │                   │
│  │  (已实现)        │         │  (已实现)        │                   │
│  │                 │         │                 │                   │
│  │ • 4级稀有度     │         │ • ERC20 奖励币   │                   │
│  │ • 倍率系统      │         │ • 铸造权限控制   │                   │
│  │ • VRF 揭示     │         │ • 可销毁机制     │                   │
│  └────────┬────────┘         └────────┬────────┘                   │
│           │                           │                            │
│           │  getTokenRewardMultiplier │  mint(address, uint256)   │
│           │                           │                            │
│           │    ┌──────────────────┐   │                            │
│           └───►│ NFTStakingPool   │◄──┘                            │
│                │  (本文档)         │                                │
│                │                  │                                │
│                │ • stake(tokenId) │                                │
│                │ • unstake(...)   │                                │
│                │ • claimReward    │                                │
│                │ • 奖励计算引擎    │                                │
│                └──────────────────┘                                │
│                                                                     │
│                         ▲                                           │
│                         │ 用户操作                                  │
│                         │                                           │
│                    ┌────┴─────┐                                     │
│                    │   User   │                                     │
│                    └──────────┘                                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.3 合约交互流程

```
质押流程：
用户 approve NFT → 调用 stake(tokenId) → NFT 转入池子 → 记录质押信息

领取奖励流程：
用户调用 claimReward(tokenId) → 计算待领取奖励 → 调用 RewardToken.mint() → 更新领取时间

解押流程：
用户调用 unstake(tokenId) → 计算并发放奖励 → NFT 归还用户 → 清除质押记录
```

---

## 2. 核心功能设计

### 2.1 功能列表

| 功能 | 函数名 | 说明 |
|------|--------|------|
| 质押 NFT | `stake(uint256 tokenId)` | 质押单个 NFT |
| 解押 NFT | `unstake(uint256 tokenId)` | 解押并自动领取奖励 |
| 领取奖励 | `claimReward(uint256 tokenId)` | 仅领取奖励，不解押 |
| 批量质押 | `batchStake(uint256[] tokenIds)` | 批量质押多个 NFT |
| 批量领取 | `batchClaimReward(uint256[] tokenIds)` | 批量领取多个 NFT 的奖励 |
| 查询奖励 | `calculatePendingReward(uint256 tokenId)` | 查询待领取奖励 |
| 查询质押信息 | `getStakeInfo(uint256 tokenId)` | 查询 NFT 质押详情 |

### 2.2 stake - 质押 NFT

**函数签名：**
```solidity
function stake(uint256 tokenId) external nonReentrant whenNotPaused
```

**操作流程：**
1. 验证用户是 NFT 的所有者
2. 验证 NFT 未被质押
3. 将 NFT 转入合约（使用 `transferFrom`）
4. 记录质押信息（质押者、质押时间、最后领取时间）
5. 触发 `Staked` 事件

**安全检查：**
- 调用者必须是 NFT owner
- NFT 必须未被质押（`stakeInfo[tokenId].owner == address(0)`）
- 用户必须已 approve 该 NFT 给合约
- 合约未暂停

**示例代码：**
```solidity
function stake(uint256 tokenId) external nonReentrant whenNotPaused {
    // 1. 验证 NFT 所有权
    require(stakableNFT.ownerOf(tokenId) == msg.sender, "Not NFT owner");

    // 2. 验证未被质押
    require(stakeInfo[tokenId].owner == address(0), "Already staked");

    // 3. 转移 NFT 到合约
    stakableNFT.transferFrom(msg.sender, address(this), tokenId);

    // 4. 记录质押信息
    stakeInfo[tokenId] = StakeInfo({
        owner: msg.sender,
        stakedAt: block.timestamp,
        lastClaimTime: block.timestamp
    });

    // 5. 触发事件
    emit Staked(msg.sender, tokenId, block.timestamp);
}
```

### 2.3 unstake - 解押 NFT

**函数签名：**
```solidity
function unstake(uint256 tokenId) external nonReentrant
```

**操作流程：**
1. 验证调用者是质押者
2. 计算待领取奖励
3. 如果有奖励，铸造 RWRD 代币给用户
4. 将 NFT 归还用户
5. 清除质押记录
6. 触发 `Unstaked` 事件

**安全检查：**
- 调用者必须是质押者（`stakeInfo[tokenId].owner == msg.sender`）
- NFT 必须处于质押状态

**示例代码：**
```solidity
function unstake(uint256 tokenId) external nonReentrant {
    StakeInfo storage info = stakeInfo[tokenId];

    // 1. 验证质押者
    require(info.owner == msg.sender, "Not staker");

    // 2. 计算奖励
    uint256 reward = calculatePendingReward(tokenId);

    // 3. 发放奖励（如果有）
    if (reward > 0) {
        rewardToken.mint(msg.sender, reward);
    }

    // 4. 归还 NFT
    stakableNFT.transferFrom(address(this), msg.sender, tokenId);

    // 5. 清除质押记录
    delete stakeInfo[tokenId];

    // 6. 触发事件
    emit Unstaked(msg.sender, tokenId, block.timestamp, reward);
}
```

### 2.4 claimReward - 领取奖励

**函数签名：**
```solidity
function claimReward(uint256 tokenId) external nonReentrant
```

**操作流程：**
1. 验证调用者是质押者
2. 计算待领取奖励
3. 如果有奖励，铸造 RWRD 代币给用户
4. 更新最后领取时间为当前时间
5. 触发 `RewardClaimed` 事件

**关键点：**
- NFT 仍保持质押状态
- 只重置 `lastClaimTime`，不影响 `stakedAt`

**示例代码：**
```solidity
function claimReward(uint256 tokenId) external nonReentrant {
    StakeInfo storage info = stakeInfo[tokenId];

    // 1. 验证质押者
    require(info.owner == msg.sender, "Not staker");

    // 2. 计算奖励
    uint256 reward = calculatePendingReward(tokenId);
    require(reward > 0, "No reward to claim");

    // 3. 更新领取时间
    info.lastClaimTime = block.timestamp;

    // 4. 铸造奖励
    rewardToken.mint(msg.sender, reward);

    // 5. 触发事件
    emit RewardClaimed(msg.sender, tokenId, reward);
}
```

### 2.5 批量操作

**batchStake：**
```solidity
function batchStake(uint256[] calldata tokenIds) external nonReentrant whenNotPaused {
    for (uint256 i = 0; i < tokenIds.length; i++) {
        // 内部调用 _stake 逻辑，避免重复 nonReentrant 检查
        _stakeInternal(tokenIds[i]);
    }
}
```

**batchClaimReward：**
```solidity
function batchClaimReward(uint256[] calldata tokenIds) external nonReentrant {
    uint256 totalReward = 0;

    for (uint256 i = 0; i < tokenIds.length; i++) {
        StakeInfo storage info = stakeInfo[tokenIds[i]];
        require(info.owner == msg.sender, "Not staker");

        uint256 reward = calculatePendingReward(tokenIds[i]);
        if (reward > 0) {
            info.lastClaimTime = block.timestamp;
            totalReward += reward;
            emit RewardClaimed(msg.sender, tokenIds[i], reward);
        }
    }

    if (totalReward > 0) {
        rewardToken.mint(msg.sender, totalReward);
    }
}
```

---

## 3. 状态管理

### 3.1 StakeInfo 结构体

```solidity
/**
 * @notice NFT 质押信息
 * @param owner 质押者地址（address(0) 表示未质押）
 * @param stakedAt 质押时间戳（用于统计质押时长）
 * @param lastClaimTime 最后领取奖励时间（用于计算待领取奖励）
 */
struct StakeInfo {
    address owner;
    uint256 stakedAt;
    uint256 lastClaimTime;
}
```

### 3.2 状态变量

```solidity
/// @notice NFT → 质押信息映射
mapping(uint256 => StakeInfo) public stakeInfo;

/// @notice StakableNFT 合约实例
IStakableNFT public immutable stakableNFT;

/// @notice RewardToken 合约实例
IRewardToken public immutable rewardToken;

/// @notice 基础奖励速率：1 RWRD/天 = 1e18 / 86400
uint256 public constant BASE_REWARD_PER_SECOND = 1e18 / 86400;
```

### 3.3 状态转换图

```
NFT 状态流转：

  [未质押]
     │
     │ stake()
     ▼
  [质押中] ◄─────┐
     │           │
     │ claimReward()
     │           │
     └───────────┘
     │
     │ unstake()
     ▼
  [未质押]
```

---

## 4. 奖励计算机制

### 4.1 核心计算公式

```solidity
pending_reward = time_staked × BASE_REWARD_PER_SECOND × multiplier / 10000

其中：
- time_staked = block.timestamp - lastClaimTime  (秒)
- BASE_REWARD_PER_SECOND = 1e18 / 86400 (wei/秒)
- multiplier = getTokenRewardMultiplier(tokenId)  (基于 10000)
```

### 4.2 calculatePendingReward 实现

```solidity
/**
 * @notice 计算待领取奖励
 * @param tokenId NFT ID
 * @return 待领取的 RWRD 数量（wei 单位）
 */
function calculatePendingReward(uint256 tokenId) public view returns (uint256) {
    StakeInfo storage info = stakeInfo[tokenId];

    // 未质押返回 0
    if (info.owner == address(0)) {
        return 0;
    }

    // 计算质押时长（秒）
    uint256 timeStaked = block.timestamp - info.lastClaimTime;

    // 获取稀有度倍率
    uint256 multiplier = stakableNFT.getTokenRewardMultiplier(tokenId);

    // 公式：时长 × 基础速率 × 倍率 / 10000
    return timeStaked * BASE_REWARD_PER_SECOND * multiplier / 10000;
}
```

### 4.3 稀有度倍率对照表

| 稀有度 | multiplier | 每日奖励 (RWRD) |
|--------|-----------|----------------|
| Common | 10000 | 1.0 |
| Rare | 15000 | 1.5 |
| Epic | 20000 | 2.0 |
| Legendary | 30000 | 3.0 |

**计算示例：**

```
示例 1: Common NFT 质押 1 天
- time_staked = 86400 秒
- multiplier = 10000
- reward = 86400 × (1e18/86400) × 10000 / 10000 = 1e18 wei = 1 RWRD

示例 2: Legendary NFT 质押 12 小时
- time_staked = 43200 秒
- multiplier = 30000
- reward = 43200 × (1e18/86400) × 30000 / 10000 = 1.5e18 wei = 1.5 RWRD

示例 3: Rare NFT 质押 1 小时
- time_staked = 3600 秒
- multiplier = 15000
- reward = 3600 × (1e18/86400) × 15000 / 10000 ≈ 0.0625 RWRD
```

### 4.4 边界情况处理

| 场景 | multiplier 值 | 处理方式 |
|------|--------------|---------|
| NFT 未揭示 | 0 | 返回 0 奖励 |
| 刚质押 | - | `lastClaimTime = block.timestamp`，奖励为 0 |
| 刚领取过 | - | `lastClaimTime` 被重置，奖励为 0 |
| multiplier 为 0 | 0 | 公式自然返回 0 |

---

## 5. 权限与安全设计

### 5.1 角色定义

```solidity
/// @notice 使用 Ownable 进行简单权限管理
import "@openzeppelin/contracts/access/Ownable.sol";
```

**角色职责：**

| 角色 | 持有者 | 权限 |
|------|--------|------|
| Owner | 部署者/多签 | 紧急暂停、恢复合约 |
| 普通用户 | 所有人 | 质押、解押、领取自己的 NFT |

**为什么不用 AccessControl？**
- 本合约功能简单，只需要 pause/unpause 权限
- Ownable 更轻量，节省 gas
- 避免过度工程

### 5.2 安全机制

**1. ReentrancyGuard - 防重入攻击**
```solidity
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract NFTStakingPool is ReentrancyGuard {
    function stake(uint256 tokenId) external nonReentrant { ... }
    function unstake(uint256 tokenId) external nonReentrant { ... }
    function claimReward(uint256 tokenId) external nonReentrant { ... }
}
```

**2. Pausable - 紧急暂停**
```solidity
import "@openzeppelin/contracts/security/Pausable.sol";

contract NFTStakingPool is Pausable {
    function stake(uint256 tokenId) external whenNotPaused { ... }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
```

**3. Checks-Effects-Interactions 模式**
```solidity
function unstake(uint256 tokenId) external nonReentrant {
    // ✅ Checks - 检查条件
    StakeInfo storage info = stakeInfo[tokenId];
    require(info.owner == msg.sender, "Not staker");

    // ✅ Effects - 修改状态
    uint256 reward = calculatePendingReward(tokenId);
    delete stakeInfo[tokenId];  // 先清除状态！

    // ✅ Interactions - 外部调用
    if (reward > 0) {
        rewardToken.mint(msg.sender, reward);  // 后调用外部合约
    }
    stakableNFT.transferFrom(address(this), msg.sender, tokenId);
}
```

### 5.3 关键安全验证

| 验证点 | 代码 | 防护内容 |
|--------|------|---------|
| 所有权验证 | `require(stakableNFT.ownerOf(tokenId) == msg.sender)` | 防止质押他人 NFT |
| 质押状态验证 | `require(stakeInfo[tokenId].owner == address(0))` | 防止重复质押 |
| 质押者验证 | `require(info.owner == msg.sender)` | 防止领取他人奖励 |
| 非零地址 | `info.owner != address(0)` | 防止操作未质押 NFT |
| 重入保护 | `nonReentrant` | 防止重入攻击 |
| 暂停检查 | `whenNotPaused` | 支持紧急停机 |

---

## 6. 与现有合约的集成

### 6.1 与 StakableNFT 的交互

**接口依赖：**
```solidity
interface IStakableNFT {
    /// @notice 获取 NFT 奖励倍率
    /// @return 倍率值（基于 10000）：未揭示=0, Common=10000, Rare=15000, Epic=20000, Legendary=30000
    function getTokenRewardMultiplier(uint256 tokenId) external view returns (uint256);

    /// @notice 标准 ERC721 接口
    function ownerOf(uint256 tokenId) external view returns (address);
    function transferFrom(address from, address to, uint256 tokenId) external;
}
```

**调用场景：**
1. **质押时：** `stakableNFT.transferFrom(user, address(this), tokenId)`
2. **解押时：** `stakableNFT.transferFrom(address(this), user, tokenId)`
3. **计算奖励时：** `stakableNFT.getTokenRewardMultiplier(tokenId)`

### 6.2 与 RewardToken 的交互

**接口依赖：**
```solidity
interface IRewardToken {
    /// @notice 铸造奖励代币
    /// @dev 调用前需要 StakingPool 已获得 MINTER_ROLE
    function mint(address to, uint256 amount) external;
}
```

**调用场景：**
1. **领取奖励时：** `rewardToken.mint(user, reward)`
2. **解押时：** `rewardToken.mint(user, reward)`

**权限配置：**
```solidity
// 部署后执行（由 RewardToken 的 owner 调用）
const MINTER_ROLE = await rewardToken.MINTER_ROLE();
await rewardToken.grantRole(MINTER_ROLE, stakingPool.address);
```

### 6.3 合约地址注入

**构造函数设计：**
```solidity
constructor(
    address _stakableNFT,
    address _rewardToken
) {
    require(_stakableNFT != address(0), "Invalid StakableNFT");
    require(_rewardToken != address(0), "Invalid RewardToken");

    stakableNFT = IStakableNFT(_stakableNFT);
    rewardToken = IRewardToken(_rewardToken);
}
```

**部署顺序：**
```
1. 部署 StakableNFT
2. 部署 RewardToken
3. 部署 NFTStakingPool(stakableNFT.address, rewardToken.address)
4. 授予 StakingPool MINTER_ROLE
```

---

## 7. 事件设计

### 7.1 事件定义

```solidity
/**
 * @notice NFT 质押事件
 * @param user 质押者地址
 * @param tokenId NFT ID
 * @param timestamp 质押时间戳
 */
event Staked(
    address indexed user,
    uint256 indexed tokenId,
    uint256 timestamp
);

/**
 * @notice NFT 解押事件
 * @param user 质押者地址
 * @param tokenId NFT ID
 * @param timestamp 解押时间戳
 * @param reward 本次获得的奖励数量
 */
event Unstaked(
    address indexed user,
    uint256 indexed tokenId,
    uint256 timestamp,
    uint256 reward
);

/**
 * @notice 奖励领取事件
 * @param user 领取者地址
 * @param tokenId NFT ID
 * @param amount 领取的奖励数量
 */
event RewardClaimed(
    address indexed user,
    uint256 indexed tokenId,
    uint256 amount
);
```

### 7.2 事件索引策略

- `user` 使用 `indexed` - 前端可按用户地址筛选
- `tokenId` 使用 `indexed` - 前端可按 NFT ID 筛选
- `timestamp` / `amount` 不索引 - 节省 gas，数据可从事件 data 读取

### 7.3 Ponder 索引示例

```typescript
// packages/ponder/src/NFTStakingPool.ts

import { ponder } from "@/generated";

ponder.on("NFTStakingPool:Staked", async ({ event, context }) => {
  await context.db.StakeRecord.create({
    id: `${event.args.tokenId}-${event.block.timestamp}`,
    data: {
      tokenId: event.args.tokenId,
      user: event.args.user,
      stakedAt: event.args.timestamp,
      status: "STAKED",
    },
  });
});

ponder.on("NFTStakingPool:Unstaked", async ({ event, context }) => {
  await context.db.StakeRecord.update({
    id: `${event.args.tokenId}`,
    data: {
      unstakedAt: event.args.timestamp,
      totalReward: event.args.reward,
      status: "UNSTAKED",
    },
  });
});
```

---

## 8. 完整合约伪代码

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

interface IStakableNFT {
    function ownerOf(uint256 tokenId) external view returns (address);
    function transferFrom(address from, address to, uint256 tokenId) external;
    function getTokenRewardMultiplier(uint256 tokenId) external view returns (uint256);
}

interface IRewardToken {
    function mint(address to, uint256 amount) external;
}

/**
 * @title NFTStakingPool
 * @notice NFT 质押池合约，管理质押、解押和奖励分发
 * @dev 安全机制：ReentrancyGuard、Pausable、Checks-Effects-Interactions
 */
contract NFTStakingPool is Ownable, ReentrancyGuard, Pausable {
    // ============ 结构体 ============

    struct StakeInfo {
        address owner;           // 质押者地址
        uint256 stakedAt;        // 质押时间
        uint256 lastClaimTime;   // 最后领取时间
    }

    // ============ 状态变量 ============

    /// @notice 质押信息映射
    mapping(uint256 => StakeInfo) public stakeInfo;

    /// @notice StakableNFT 合约
    IStakableNFT public immutable stakableNFT;

    /// @notice RewardToken 合约
    IRewardToken public immutable rewardToken;

    /// @notice 基础奖励速率：1 RWRD/天
    uint256 public constant BASE_REWARD_PER_SECOND = 1e18 / 86400;

    // ============ 事件 ============

    event Staked(address indexed user, uint256 indexed tokenId, uint256 timestamp);
    event Unstaked(address indexed user, uint256 indexed tokenId, uint256 timestamp, uint256 reward);
    event RewardClaimed(address indexed user, uint256 indexed tokenId, uint256 amount);

    // ============ 构造函数 ============

    constructor(address _stakableNFT, address _rewardToken) {
        require(_stakableNFT != address(0), "Invalid StakableNFT");
        require(_rewardToken != address(0), "Invalid RewardToken");

        stakableNFT = IStakableNFT(_stakableNFT);
        rewardToken = IRewardToken(_rewardToken);
    }

    // ============ 外部函数 ============

    /**
     * @notice 质押 NFT
     * @param tokenId NFT ID
     */
    function stake(uint256 tokenId) external nonReentrant whenNotPaused {
        require(stakableNFT.ownerOf(tokenId) == msg.sender, "Not NFT owner");
        require(stakeInfo[tokenId].owner == address(0), "Already staked");

        stakableNFT.transferFrom(msg.sender, address(this), tokenId);

        stakeInfo[tokenId] = StakeInfo({
            owner: msg.sender,
            stakedAt: block.timestamp,
            lastClaimTime: block.timestamp
        });

        emit Staked(msg.sender, tokenId, block.timestamp);
    }

    /**
     * @notice 解押 NFT
     * @param tokenId NFT ID
     */
    function unstake(uint256 tokenId) external nonReentrant {
        StakeInfo storage info = stakeInfo[tokenId];
        require(info.owner == msg.sender, "Not staker");

        uint256 reward = calculatePendingReward(tokenId);

        delete stakeInfo[tokenId];

        if (reward > 0) {
            rewardToken.mint(msg.sender, reward);
        }
        stakableNFT.transferFrom(address(this), msg.sender, tokenId);

        emit Unstaked(msg.sender, tokenId, block.timestamp, reward);
    }

    /**
     * @notice 领取奖励
     * @param tokenId NFT ID
     */
    function claimReward(uint256 tokenId) external nonReentrant {
        StakeInfo storage info = stakeInfo[tokenId];
        require(info.owner == msg.sender, "Not staker");

        uint256 reward = calculatePendingReward(tokenId);
        require(reward > 0, "No reward to claim");

        info.lastClaimTime = block.timestamp;
        rewardToken.mint(msg.sender, reward);

        emit RewardClaimed(msg.sender, tokenId, reward);
    }

    /**
     * @notice 批量质押
     * @param tokenIds NFT ID 数组
     */
    function batchStake(uint256[] calldata tokenIds) external nonReentrant whenNotPaused {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            require(stakableNFT.ownerOf(tokenId) == msg.sender, "Not NFT owner");
            require(stakeInfo[tokenId].owner == address(0), "Already staked");

            stakableNFT.transferFrom(msg.sender, address(this), tokenId);

            stakeInfo[tokenId] = StakeInfo({
                owner: msg.sender,
                stakedAt: block.timestamp,
                lastClaimTime: block.timestamp
            });

            emit Staked(msg.sender, tokenId, block.timestamp);
        }
    }

    /**
     * @notice 批量领取奖励
     * @param tokenIds NFT ID 数组
     */
    function batchClaimReward(uint256[] calldata tokenIds) external nonReentrant {
        uint256 totalReward = 0;

        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            StakeInfo storage info = stakeInfo[tokenId];
            require(info.owner == msg.sender, "Not staker");

            uint256 reward = calculatePendingReward(tokenId);
            if (reward > 0) {
                info.lastClaimTime = block.timestamp;
                totalReward += reward;
                emit RewardClaimed(msg.sender, tokenId, reward);
            }
        }

        if (totalReward > 0) {
            rewardToken.mint(msg.sender, totalReward);
        }
    }

    // ============ 视图函数 ============

    /**
     * @notice 计算待领取奖励
     * @param tokenId NFT ID
     * @return 待领取奖励数量（wei）
     */
    function calculatePendingReward(uint256 tokenId) public view returns (uint256) {
        StakeInfo storage info = stakeInfo[tokenId];
        if (info.owner == address(0)) return 0;

        uint256 timeStaked = block.timestamp - info.lastClaimTime;
        uint256 multiplier = stakableNFT.getTokenRewardMultiplier(tokenId);

        return timeStaked * BASE_REWARD_PER_SECOND * multiplier / 10000;
    }

    /**
     * @notice 获取质押信息
     * @param tokenId NFT ID
     * @return 质押信息结构体
     */
    function getStakeInfo(uint256 tokenId) external view returns (StakeInfo memory) {
        return stakeInfo[tokenId];
    }

    /**
     * @notice 批量查询待领取奖励
     * @param tokenIds NFT ID 数组
     * @return 奖励数组
     */
    function batchCalculatePendingReward(uint256[] calldata tokenIds)
        external
        view
        returns (uint256[] memory)
    {
        uint256[] memory rewards = new uint256[](tokenIds.length);
        for (uint256 i = 0; i < tokenIds.length; i++) {
            rewards[i] = calculatePendingReward(tokenIds[i]);
        }
        return rewards;
    }

    // ============ 管理函数 ============

    /**
     * @notice 暂停合约（仅 owner）
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice 恢复合约（仅 owner）
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
```

---

## 9. 前端集成指南

### 9.1 用户操作流程

```
┌────────────────────────────────────────────────────────────┐
│                      用户质押流程                           │
└────────────────────────────────────────────────────────────┘

1. approve NFT
   └─► stakableNFT.setApprovalForAll(stakingPool.address, true)

2. stake NFT
   └─► stakingPool.stake(tokenId)

3. 实时查看奖励
   └─► stakingPool.calculatePendingReward(tokenId)  (view 函数，无 gas)

4. 领取奖励（可选）
   └─► stakingPool.claimReward(tokenId)

5. 解押 NFT
   └─► stakingPool.unstake(tokenId)  (自动领取奖励)
```

### 9.2 前端展示数据

**质押页面需要展示：**

```typescript
interface StakePageData {
  // 用户拥有的 NFT 列表
  ownedNFTs: {
    tokenId: number;
    rarity: string;
    multiplier: number;
    isStaked: boolean;
  }[];

  // 已质押的 NFT 列表
  stakedNFTs: {
    tokenId: number;
    rarity: string;
    stakedAt: number;
    pendingReward: bigint;  // 实时计算
    estimatedDailyReward: number;  // 根据稀有度展示
  }[];

  // 统计数据
  stats: {
    totalStaked: number;        // 已质押数量
    totalPendingReward: bigint; // 总待领取奖励
    totalClaimedReward: bigint; // 累计已领取（从 Ponder 查询）
  };
}
```

### 9.3 Scaffold-ETH Hooks 使用

**读取质押信息：**
```typescript
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

// 查询单个 NFT 的质押信息
const { data: stakeInfo } = useScaffoldReadContract({
  contractName: "NFTStakingPool",
  functionName: "getStakeInfo",
  args: [BigInt(tokenId)],
});

// 查询待领取奖励
const { data: pendingReward } = useScaffoldReadContract({
  contractName: "NFTStakingPool",
  functionName: "calculatePendingReward",
  args: [BigInt(tokenId)],
  watch: true,  // 实时更新
});
```

**执行质押操作：**
```typescript
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const { writeContractAsync: stakeAsync } = useScaffoldWriteContract("NFTStakingPool");

// 质押 NFT
const handleStake = async (tokenId: number) => {
  try {
    await stakeAsync({
      functionName: "stake",
      args: [BigInt(tokenId)],
    });
  } catch (error) {
    console.error("Stake failed:", error);
  }
};
```

**批量操作：**
```typescript
// 批量质押
const handleBatchStake = async (tokenIds: number[]) => {
  await stakeAsync({
    functionName: "batchStake",
    args: [tokenIds.map(id => BigInt(id))],
  });
};
```

### 9.4 实时奖励更新

**使用 watch 模式：**
```typescript
// 每秒自动刷新奖励
const { data: reward } = useScaffoldReadContract({
  contractName: "NFTStakingPool",
  functionName: "calculatePendingReward",
  args: [BigInt(tokenId)],
  watch: true,
  cacheTime: 0,  // 禁用缓存
});

// 前端展示
<div>
  Pending Reward: {formatEther(reward || 0n)} RWRD
</div>
```

### 9.5 事件监听

```typescript
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth";

// 监听质押事件
const { data: stakeEvents } = useScaffoldEventHistory({
  contractName: "NFTStakingPool",
  eventName: "Staked",
  fromBlock: 0n,
  watch: true,
  filters: { user: address },  // 只监听当前用户
});

// 监听奖励领取事件
const { data: claimEvents } = useScaffoldEventHistory({
  contractName: "NFTStakingPool",
  eventName: "RewardClaimed",
  fromBlock: 0n,
  filters: { user: address },
});
```

---

## 10. 测试用例设计

### 10.1 单元测试场景

```typescript
describe("NFTStakingPool", () => {
  describe("部署", () => {
    it("应正确设置 stakableNFT 地址");
    it("应正确设置 rewardToken 地址");
    it("应设置正确的 BASE_REWARD_PER_SECOND");
    it("部署者应是 owner");
  });

  describe("质押", () => {
    it("用户可以质押自己的 NFT");
    it("质押应转移 NFT 到合约");
    it("质押应记录正确的 stakeInfo");
    it("质押应触发 Staked 事件");
    it("不能质押他人的 NFT");
    it("不能重复质押同一个 NFT");
    it("未 approve 时质押应失败");
    it("合约暂停时不能质押");
  });

  describe("解押", () => {
    it("用户可以解押自己的 NFT");
    it("解押应归还 NFT 给用户");
    it("解押应清除 stakeInfo");
    it("解押应自动发放奖励");
    it("解押应触发 Unstaked 事件");
    it("非质押者不能解押");
    it("未质押的 NFT 不能解押");
  });

  describe("领取奖励", () => {
    it("可以领取待领取的奖励");
    it("领取应更新 lastClaimTime");
    it("领取应触发 RewardClaimed 事件");
    it("领取不应改变 NFT 质押状态");
    it("无奖励时领取应失败");
    it("非质押者不能领取");
  });

  describe("奖励计算", () => {
    it("Common NFT 质押 1 天应得 1 RWRD");
    it("Legendary NFT 质押 1 天应得 3 RWRD");
    it("质押 12 小时应得半天奖励");
    it("未揭示 NFT 奖励应为 0");
    it("刚质押时奖励应为 0");
    it("领取后立即查询奖励应为 0");
  });

  describe("批量操作", () => {
    it("可以批量质押多个 NFT");
    it("可以批量领取多个 NFT 的奖励");
    it("批量操作应触发多个事件");
    it("批量操作中包含无效 NFT 应失败");
  });

  describe("紧急控制", () => {
    it("owner 可以暂停合约");
    it("owner 可以恢复合约");
    it("暂停后不能质押");
    it("暂停后仍可以解押和领取");
    it("非 owner 不能暂停");
  });
});
```

### 10.2 集成测试场景

| 场景 | 操作步骤 | 预期结果 |
|------|---------|---------|
| 完整质押流程 | mint NFT → approve → stake → claim → unstake | 用户获得正确奖励，NFT 归还 |
| 多 NFT 质押 | 质押 3 个不同稀有度的 NFT → 分别领取 | 每个 NFT 独立计算奖励 |
| 部分领取 | 质押 → 领取 → 等待 → 再领取 | 第二次领取从第一次领取时间开始计算 |
| 未揭示 NFT | 质押未揭示的 NFT → 尝试领取 | 奖励为 0 |
| 批量操作 | 批量质押 5 个 NFT → 批量领取 | Gas 优化，一次性完成 |

### 10.3 边界情况测试

| 测试点 | 输入 | 预期行为 |
|--------|------|---------|
| 质押不存在的 NFT | tokenId = 999 | 交易失败（ownerOf revert） |
| 质押后立即领取 | stake() → claimReward() | 交易失败（No reward to claim） |
| 质押后立即解押 | stake() → unstake() | 成功，但奖励为 0 |
| 重复领取 | claimReward() → claimReward() | 第二次交易失败 |
| 极长时间质押 | 质押 365 天 | 正确计算大额奖励 |
| multiplier = 0 | 质押未揭示 NFT | 奖励始终为 0 |

### 10.4 安全测试

```typescript
describe("安全测试", () => {
  it("重入攻击测试 - unstake 中无法重入");
  it("权限测试 - 不能领取他人奖励");
  it("权限测试 - 不能解押他人 NFT");
  it("溢出测试 - 极大 multiplier 不会溢出");
  it("紧急暂停测试 - 暂停后无法质押");
});
```

---

## 11. 部署流程

### 11.1 部署顺序

```
Step 1: 部署 StakableNFT  (已完成)
Step 2: 部署 RewardToken   (已完成)
Step 3: 部署 NFTStakingPool
Step 4: 授予 StakingPool MINTER_ROLE
Step 5: 验证合约（可选）
```

### 11.2 部署脚本

```typescript
// deploy/02_deploy_staking_pool.ts
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";

const deployStakingPool: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // 获取已部署的合约地址
  const stakableNFT = await hre.deployments.get("StakableNFT");
  const rewardToken = await hre.deployments.get("RewardToken");

  console.log("Deploying NFTStakingPool...");
  console.log("  StakableNFT:", stakableNFT.address);
  console.log("  RewardToken:", rewardToken.address);

  // 部署 StakingPool
  const stakingPool = await deploy("NFTStakingPool", {
    from: deployer,
    args: [stakableNFT.address, rewardToken.address],
    log: true,
    autoMine: true,
  });

  console.log("NFTStakingPool deployed to:", stakingPool.address);

  // 自动授予 MINTER_ROLE
  if (stakingPool.newlyDeployed) {
    console.log("Granting MINTER_ROLE to StakingPool...");

    const rewardTokenContract = await ethers.getContractAt("RewardToken", rewardToken.address);
    const MINTER_ROLE = await rewardTokenContract.MINTER_ROLE();

    const tx = await rewardTokenContract.grantRole(MINTER_ROLE, stakingPool.address);
    await tx.wait();

    console.log("MINTER_ROLE granted successfully");
  }
};

export default deployStakingPool;
deployStakingPool.tags = ["NFTStakingPool"];
deployStakingPool.dependencies = ["StakableNFT", "RewardToken"];
```

### 11.3 权限授予验证脚本

```typescript
// scripts/verify-staking-setup.ts
import { ethers } from "hardhat";

async function main() {
  const stakableNFT = await ethers.getContract("StakableNFT");
  const rewardToken = await ethers.getContract("RewardToken");
  const stakingPool = await ethers.getContract("NFTStakingPool");

  console.log("Contract Addresses:");
  console.log("  StakableNFT:", await stakableNFT.getAddress());
  console.log("  RewardToken:", await rewardToken.getAddress());
  console.log("  StakingPool:", await stakingPool.getAddress());

  // 验证 StakingPool 配置
  const poolStakableNFT = await stakingPool.stakableNFT();
  const poolRewardToken = await stakingPool.rewardToken();
  console.log("\nStakingPool Configuration:");
  console.log("  stakableNFT:", poolStakableNFT);
  console.log("  rewardToken:", poolRewardToken);

  // 验证 MINTER_ROLE
  const MINTER_ROLE = await rewardToken.MINTER_ROLE();
  const hasMinterRole = await rewardToken.hasRole(MINTER_ROLE, await stakingPool.getAddress());
  console.log("\nPermissions:");
  console.log("  StakingPool has MINTER_ROLE:", hasMinterRole);

  if (!hasMinterRole) {
    console.error("❌ ERROR: StakingPool does not have MINTER_ROLE!");
    process.exit(1);
  }

  console.log("\n✅ All checks passed!");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
```

### 11.4 部署检查清单

```
部署前检查：
□ StakableNFT 已部署并验证
□ RewardToken 已部署并验证
□ 部署账户有足够 ETH（估计 0.05 ETH）
□ hardhat.config.ts 配置正确网络

部署后验证：
□ NFTStakingPool 地址正确
□ stakableNFT 地址指向正确
□ rewardToken 地址指向正确
□ BASE_REWARD_PER_SECOND = 1e18/86400
□ StakingPool 拥有 MINTER_ROLE
□ owner 设置正确

功能测试：
□ 可以质押 NFT
□ 可以计算奖励
□ 可以领取奖励
□ 可以解押 NFT
□ pause/unpause 功能正常
```

---

## 12. 未来扩展考虑

### 12.1 ERC20 Permit 支持（Gasless 操作）

**问题：** 用户质押前需要先 `approve` NFT，两步操作体验不佳

**解决方案：** 使用 EIP-712 签名实现一步质押

```solidity
// 添加 Permit 函数（参考 RewardToken 的 Permit 设计）
function stakeWithPermit(
    uint256 tokenId,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
) external nonReentrant whenNotPaused {
    // 1. 验证签名并完成 approve
    stakableNFT.permit(msg.sender, address(this), tokenId, deadline, v, r, s);

    // 2. 执行质押
    _stakeInternal(tokenId);
}
```

**前端集成：**
```typescript
// 用户签名（无 gas）
const signature = await signNFTPermit(tokenId, deadline);

// 一步完成质押（仅一次交易）
await stakeWithPermit(tokenId, deadline, signature.v, signature.r, signature.s);
```

### 12.2 紧急取回机制

**问题：** 合约出现 bug 时，用户 NFT 可能被锁定

**解决方案：** 添加紧急取回函数

```solidity
/**
 * @notice 紧急取回 NFT（仅暂停状态下可用）
 * @dev 不发放奖励，仅归还 NFT
 */
function emergencyWithdraw(uint256 tokenId) external nonReentrant whenPaused {
    StakeInfo storage info = stakeInfo[tokenId];
    require(info.owner == msg.sender, "Not staker");

    delete stakeInfo[tokenId];
    stakableNFT.transferFrom(address(this), msg.sender, tokenId);

    emit EmergencyWithdraw(msg.sender, tokenId);
}
```

**使用场景：**
- 合约发现严重漏洞
- Owner 执行 `pause()` 后，用户可无条件取回 NFT
- 放弃奖励，保障 NFT 安全

### 12.3 多池支持

**问题：** 未来可能需要不同奖励规则的质押池

**解决方案：** 使用工厂模式部署多个 StakingPool

```solidity
contract StakingPoolFactory {
    event PoolCreated(address indexed pool, uint256 rewardRate);

    function createPool(
        address _stakableNFT,
        address _rewardToken,
        uint256 _baseRewardPerSecond
    ) external returns (address) {
        NFTStakingPool pool = new NFTStakingPool(
            _stakableNFT,
            _rewardToken,
            _baseRewardPerSecond
        );

        pool.transferOwnership(msg.sender);
        emit PoolCreated(address(pool), _baseRewardPerSecond);
        return address(pool);
    }
}
```

**应用场景：**
- Pool A: 1 RWRD/天（普通池）
- Pool B: 2 RWRD/天（高奖励池，但有锁定期）
- Pool C: 0.5 RWRD/天（低风险池）

### 12.4 奖励加速机制

**问题：** 长期质押者缺乏额外激励

**解决方案：** 根据质押时长增加倍率

```solidity
function calculatePendingReward(uint256 tokenId) public view returns (uint256) {
    StakeInfo storage info = stakeInfo[tokenId];
    if (info.owner == address(0)) return 0;

    uint256 timeStaked = block.timestamp - info.lastClaimTime;
    uint256 multiplier = stakableNFT.getTokenRewardMultiplier(tokenId);

    // 基础奖励
    uint256 baseReward = timeStaked * BASE_REWARD_PER_SECOND * multiplier / 10000;

    // 质押时长加成
    uint256 stakeDuration = block.timestamp - info.stakedAt;
    uint256 bonus = calculateStakeDurationBonus(stakeDuration);

    return baseReward * (100 + bonus) / 100;
}

function calculateStakeDurationBonus(uint256 duration) internal pure returns (uint256) {
    // 30 天以上: +10%
    if (duration >= 30 days) return 10;
    // 7 天以上: +5%
    if (duration >= 7 days) return 5;
    // 否则无加成
    return 0;
}
```

### 12.5 锁定期和惩罚机制

**问题：** 需要抑制抛压，鼓励长期持有

**解决方案：** 添加最小质押期和提前解押惩罚

```solidity
uint256 public constant MIN_STAKE_DURATION = 3 days;
uint256 public constant EARLY_UNSTAKE_PENALTY = 1000;  // 10%

function unstake(uint256 tokenId) external nonReentrant {
    StakeInfo storage info = stakeInfo[tokenId];
    require(info.owner == msg.sender, "Not staker");

    uint256 reward = calculatePendingReward(tokenId);
    uint256 stakeDuration = block.timestamp - info.stakedAt;

    // 提前解押扣除 10% 奖励
    if (stakeDuration < MIN_STAKE_DURATION && reward > 0) {
        uint256 penalty = reward * EARLY_UNSTAKE_PENALTY / 10000;
        reward -= penalty;
        // 惩罚的代币可以销毁或进入国库
    }

    delete stakeInfo[tokenId];

    if (reward > 0) {
        rewardToken.mint(msg.sender, reward);
    }
    stakableNFT.transferFrom(address(this), msg.sender, tokenId);

    emit Unstaked(msg.sender, tokenId, block.timestamp, reward);
}
```

---

## 13. Gas 优化建议

### 13.1 存储优化

**当前设计：**
```solidity
struct StakeInfo {
    address owner;           // 20 bytes
    uint256 stakedAt;        // 32 bytes
    uint256 lastClaimTime;   // 32 bytes
}
// 总计: 84 bytes → 占用 3 个存储槽
```

**优化方案（可选）：**
```solidity
struct StakeInfo {
    address owner;           // 20 bytes
    uint88 stakedAt;         // 11 bytes (时间戳到 2^88 = 9e26 秒 = 3e19 年)
    uint88 lastClaimTime;    // 11 bytes
    uint40 reserved;         // 5 bytes (预留)
}
// 总计: 64 bytes → 占用 2 个存储槽，节省 1 槽
```

**注意：** 本项目作为学习项目，优先考虑代码可读性，暂不采用紧缩存储。

### 13.2 批量操作优化

**当前实现：**
```solidity
function batchStake(uint256[] calldata tokenIds) external {
    for (uint256 i = 0; i < tokenIds.length; i++) {
        // 每次循环都检查 nonReentrant
        _stakeInternal(tokenIds[i]);
    }
}
```

**优化建议：**
- 使用 `unchecked` 包裹循环计数器（`i++` → `unchecked { ++i }`）
- 预先验证所有权（批量失败优于部分成功）
- 合并事件触发（减少 LOG 操作）

### 13.3 常量使用

**优化：** 所有不变的值使用 `constant` 或 `immutable`

```solidity
// ✅ 节省 gas
uint256 public constant BASE_REWARD_PER_SECOND = 1e18 / 86400;
IStakableNFT public immutable stakableNFT;

// ❌ 浪费 gas
uint256 public BASE_REWARD_PER_SECOND = 1e18 / 86400;
IStakableNFT public stakableNFT;
```

### 13.4 函数可见性

**优化：** 仅在必要时使用 `public`，否则使用 `external`

```solidity
// ✅ 外部调用优化
function stake(uint256 tokenId) external { ... }

// ❌ 产生额外拷贝开销
function stake(uint256 tokenId) public { ... }
```

### 13.5 循环优化

```solidity
// ✅ 优化后
function batchCalculatePendingReward(uint256[] calldata tokenIds)
    external
    view
    returns (uint256[] memory)
{
    uint256 length = tokenIds.length;
    uint256[] memory rewards = new uint256[](length);

    for (uint256 i = 0; i < length;) {
        rewards[i] = calculatePendingReward(tokenIds[i]);
        unchecked { ++i; }  // 节省 gas
    }
    return rewards;
}
```

---

## 14. 安全审计要点

### 14.1 关键安全检查

| 检查项 | 风险等级 | 验证方法 |
|--------|---------|---------|
| 重入攻击 | 高 | 所有状态修改函数使用 `nonReentrant` |
| 权限控制 | 高 | 验证所有 `require(info.owner == msg.sender)` |
| 整数溢出 | 中 | 使用 Solidity 0.8+ 自动检查 |
| 外部调用顺序 | 中 | 遵循 Checks-Effects-Interactions 模式 |
| 紧急暂停 | 中 | 验证 `pause()` 正确阻止 `stake()` |
| NFT 转移失败 | 低 | ERC721 标准保证 `transferFrom` 安全性 |

### 14.2 常见漏洞检查

**1. 重入攻击：**
```solidity
// ❌ 不安全（先外部调用再修改状态）
function unstake(uint256 tokenId) external {
    uint256 reward = calculatePendingReward(tokenId);
    rewardToken.mint(msg.sender, reward);  // 外部调用
    delete stakeInfo[tokenId];              // 后修改状态
}

// ✅ 安全（先修改状态再外部调用）
function unstake(uint256 tokenId) external nonReentrant {
    uint256 reward = calculatePendingReward(tokenId);
    delete stakeInfo[tokenId];              // 先修改状态
    rewardToken.mint(msg.sender, reward);  // 后外部调用
}
```

**2. 权限检查遗漏：**
```solidity
// ❌ 危险（未检查调用者）
function claimReward(uint256 tokenId) external {
    uint256 reward = calculatePendingReward(tokenId);
    rewardToken.mint(msg.sender, reward);  // 任何人都能领取！
}

// ✅ 安全
function claimReward(uint256 tokenId) external {
    require(stakeInfo[tokenId].owner == msg.sender, "Not staker");
    ...
}
```

**3. 时间戳依赖：**
```solidity
// ⚠️ 轻微风险（矿工可操纵 ±15 秒）
uint256 timeStaked = block.timestamp - info.lastClaimTime;

// 风险评估：对于质押系统，15 秒误差可忽略
```

### 14.3 测试覆盖率要求

```
建议覆盖率目标：
□ 语句覆盖率: 100%
□ 分支覆盖率: 100%
□ 函数覆盖率: 100%
□ 行覆盖率: 100%

关键测试场景：
□ 所有 revert 路径
□ 所有事件触发
□ 所有权限检查
□ 边界值测试（0、最大值）
□ 状态转换测试
```

---

## 15. 总结

### 15.1 设计要点

| 方面 | 设计选择 | 理由 |
|------|---------|------|
| 架构模式 | 三合约分离 | 职责清晰，易于测试和升级 |
| 权限管理 | Ownable | 简单够用，避免过度工程 |
| 安全机制 | ReentrancyGuard + Pausable | 行业标准，久经考验 |
| 奖励计算 | 固定排放 × 稀有度 | 简单透明，用户易理解 |
| 批量操作 | 支持 | 节省 gas，提升体验 |
| 紧急控制 | 支持 pause | 保护用户资产 |

### 15.2 关键接口

**用户接口：**
- `stake(uint256 tokenId)` - 质押 NFT
- `unstake(uint256 tokenId)` - 解押并领取奖励
- `claimReward(uint256 tokenId)` - 仅领取奖励
- `calculatePendingReward(uint256 tokenId)` - 查询待领取奖励

**合约交互：**
- `IStakableNFT.getTokenRewardMultiplier(tokenId)` - 获取稀有度倍率
- `IRewardToken.mint(address, uint256)` - 铸造奖励代币

### 15.3 部署清单

```
1. ✅ StakableNFT 部署（已完成）
2. ✅ RewardToken 部署（已完成）
3. ⬜ NFTStakingPool 部署
4. ⬜ 授予 StakingPool MINTER_ROLE
5. ⬜ 验证合约（可选）
6. ⬜ 前端集成
7. ⬜ Ponder 索引器配置
```

### 15.4 前端集成要点

**必须展示的数据：**
- 用户拥有的 NFT 列表（区分已质押/未质押）
- 每个已质押 NFT 的实时待领取奖励
- 累计已领取奖励（从 Ponder 查询）
- 预估日收益（根据稀有度）

**必须实现的操作：**
- NFT approve（仅首次）
- 单个/批量质押
- 单个/批量领取奖励
- 单个解押

**实时更新：**
- 使用 `watch: true` 监听 `calculatePendingReward`
- 使用 `useScaffoldEventHistory` 监听事件
- 质押/领取后自动刷新余额

### 15.5 测试要点

**单元测试：**
- 覆盖所有函数的正常路径
- 覆盖所有 `require` 的失败路径
- 验证所有事件触发
- 测试边界值（0、最大值、未揭示 NFT）

**集成测试：**
- 完整质押流程（mint → approve → stake → claim → unstake）
- 多用户并行质押
- 不同稀有度 NFT 的奖励差异
- 批量操作的正确性

**安全测试：**
- 重入攻击模拟
- 权限绕过尝试
- 时间操纵测试
- 极端数值测试

### 15.6 下一步工作

```
第一阶段：合约实现
1. 创建 NFTStakingPool.sol
2. 编写完整的单元测试
3. 部署到本地测试网
4. 验证所有功能正常

第二阶段：前端集成
1. 创建质押页面 UI
2. 集成 Scaffold-ETH hooks
3. 实现实时奖励更新
4. 配置 Ponder 索引器

第三阶段：优化与部署
1. Gas 优化
2. 安全审计
3. 部署到测试网
4. 用户测试和反馈

第四阶段：扩展功能（可选）
1. ERC20 Permit 支持
2. 紧急取回机制
3. 奖励加速机制
4. 锁定期和惩罚
```

---

## 附录 A：完整合约接口

```solidity
interface INFTStakingPool {
    // ============ 结构体 ============

    struct StakeInfo {
        address owner;
        uint256 stakedAt;
        uint256 lastClaimTime;
    }

    // ============ 事件 ============

    event Staked(address indexed user, uint256 indexed tokenId, uint256 timestamp);
    event Unstaked(address indexed user, uint256 indexed tokenId, uint256 timestamp, uint256 reward);
    event RewardClaimed(address indexed user, uint256 indexed tokenId, uint256 amount);

    // ============ 外部函数 ============

    /// @notice 质押 NFT
    function stake(uint256 tokenId) external;

    /// @notice 解押 NFT
    function unstake(uint256 tokenId) external;

    /// @notice 领取奖励
    function claimReward(uint256 tokenId) external;

    /// @notice 批量质押
    function batchStake(uint256[] calldata tokenIds) external;

    /// @notice 批量领取奖励
    function batchClaimReward(uint256[] calldata tokenIds) external;

    // ============ 视图函数 ============

    /// @notice 计算待领取奖励
    function calculatePendingReward(uint256 tokenId) external view returns (uint256);

    /// @notice 获取质押信息
    function getStakeInfo(uint256 tokenId) external view returns (StakeInfo memory);

    /// @notice 批量查询待领取奖励
    function batchCalculatePendingReward(uint256[] calldata tokenIds) external view returns (uint256[] memory);

    // ============ 管理函数 ============

    /// @notice 暂停合约
    function pause() external;

    /// @notice 恢复合约
    function unpause() external;
}
```

---

## 附录 B：前端组件示例

```typescript
// components/StakeNFTCard.tsx
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

interface StakeNFTCardProps {
  tokenId: number;
  rarity: string;
  isStaked: boolean;
}

export const StakeNFTCard = ({ tokenId, rarity, isStaked }: StakeNFTCardProps) => {
  const { writeContractAsync: stakeAsync } = useScaffoldWriteContract("NFTStakingPool");
  const { writeContractAsync: unstakeAsync } = useScaffoldWriteContract("NFTStakingPool");

  // 实时查询待领取奖励
  const { data: pendingReward } = useScaffoldReadContract({
    contractName: "NFTStakingPool",
    functionName: "calculatePendingReward",
    args: [BigInt(tokenId)],
    watch: true,
  });

  const handleStake = async () => {
    await stakeAsync({
      functionName: "stake",
      args: [BigInt(tokenId)],
    });
  };

  const handleUnstake = async () => {
    await unstakeAsync({
      functionName: "unstake",
      args: [BigInt(tokenId)],
    });
  };

  return (
    <div className="card">
      <img src={`/nft/${tokenId}.png`} alt={`NFT ${tokenId}`} />
      <div className="rarity">{rarity}</div>

      {isStaked && (
        <div className="reward">
          Pending: {formatEther(pendingReward || 0n)} RWRD
        </div>
      )}

      <button onClick={isStaked ? handleUnstake : handleStake}>
        {isStaked ? "Unstake" : "Stake"}
      </button>
    </div>
  );
};
```

---

**文档版本：** v1.0
**最后更新：** 2024-12-01
**作者：** Claude & 项目团队
**状态：** 设计完成，待实现
