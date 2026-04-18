# NFT 质押挖矿与动态成就系统 - 功能需求文档

**项目代号**：NFT-Staking-Achievement
**版本**：v1.0
**创建日期**：2025-10-27
**作者**：snome
**状态**：待开发

---

## 📋 文档修订历史

| 版本 | 日期 | 修订内容 | 修订人 |
|------|------|---------|--------|
| v1.0 | 2025-10-27 | 初始版本，完整需求定义 | snome |

---

## 🎯 项目概述

### 1.1 项目背景

随着 NFT 与 DeFi 的深度融合（NFTFi），用户对 NFT 资产的流动性和收益需求日益增长。本项目旨在构建一个完整的 NFT 质押挖矿平台，并通过动态成就 NFT 系统增强用户参与度和社区治理能力。

### 1.2 项目目标

1. **核心目标**
   - 为 NFT 持有者提供被动收益渠道
   - 通过成就系统激励长期质押行为
   - 建立基于成就的社区治理机制

2. **技术目标**
   - 基于 OpenZeppelin Contracts v5 构建安全合约
   - 复用现有 ERC20 质押系统的奖励分配逻辑
   - 实现 Gas 优化的批量操作
   - 支持动态 NFT 元数据

3. **用户体验目标**
   - 单次交易成本 < 150k gas
   - 支持批量质押/取回（节省 gas）
   - 实时显示待领取奖励
   - 成就 NFT 可视化展示

### 1.3 项目范围

#### 包含功能
- ✅ NFT 质押挖矿系统（核心）
- ✅ 动态成就 NFT 系统
- ✅ 稀有度加成机制
- ✅ 批量操作功能
- ✅ 锁定期机制
- ✅ 治理投票功能

#### 不包含功能
- ❌ NFT 交易市场（本项目不涉及二级市场）
- ❌ NFT 租赁功能（未来版本考虑）
- ❌ 跨链功能（首个版本聚焦单链）
- ❌ 前端开发（本文档仅涉及合约）

---

## 🏗️ 系统架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         用户层（User Layer）                      │
├─────────────────────────────────────────────────────────────────┤
│  用户操作：质押 NFT、领取奖励、解锁成就、参与投票                   │
└────────────┬────────────────────────────────────┬────────────────┘
             │                                    │
             ▼                                    ▼
┌─────────────────────────┐        ┌───────────────────────────┐
│    NFT 质押层（Core）     │        │   成就激励层（Gamification）│
├─────────────────────────┤        ├───────────────────────────┤
│ • StakableNFT.sol       │        │ • AchievementNFT.sol      │
│ • NFTStakingPool.sol    │◄──────►│ • AchievementTrigger.sol  │
│ • RewardCalculator.sol  │        │ • DynamicMetadata.sol     │
└────────────┬────────────┘        └───────────┬───────────────┘
             │                                  │
             ▼                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      治理层（Governance Layer）                   │
├─────────────────────────────────────────────────────────────────┤
│  • AchievementGovernor.sol（基于成就 NFT 的投票治理）              │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      代币层（Token Layer）                        │
├─────────────────────────────────────────────────────────────────┤
│  • RewardToken.sol（ERC20 奖励代币）                              │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 合约模块划分

#### 模块 1：NFT 质押核心（Phase 1）
| 合约名称 | 主要功能 | 优先级 |
|---------|---------|--------|
| `StakableNFT.sol` | 可质押的 NFT 合约，包含稀有度属性 | P0 |
| `NFTStakingPool.sol` | 质押池核心逻辑，管理质押状态和奖励 | P0 |
| `RewardCalculator.sol` | 奖励计算库，处理稀有度加成 | P0 |

#### 模块 2：动态成就系统（Phase 2）
| 合约名称 | 主要功能 | 优先级 |
|---------|---------|--------|
| `AchievementNFT.sol` | 成就 NFT 合约，支持动态元数据 | P1 |
| `AchievementTrigger.sol` | 成就解锁逻辑，监听质押事件 | P1 |
| `DynamicMetadata.sol` | 动态生成 NFT 元数据 | P1 |

#### 模块 3：治理功能（Phase 3）
| 合约名称 | 主要功能 | 优先级 |
|---------|---------|--------|
| `AchievementGovernor.sol` | 治理合约，基于成就 NFT 投票 | P2 |

---

## 📐 详细功能需求

### 3.1 模块 1：NFT 质押核心

#### 3.1.1 StakableNFT 合约

**功能描述**：可质押的 ERC721 NFT，每个 NFT 有不同的稀有度属性。

**继承关系**：
```solidity
contract StakableNFT is
    ERC721,
    ERC721URIStorage,
    ERC721Enumerable,
    ERC721Burnable,
    Ownable
```

**核心数据结构**：
```solidity
enum Rarity {
    Common,      // 普通（1x 奖励倍率）
    Rare,        // 稀有（1.5x 奖励倍率）
    Epic,        // 史诗（2x 奖励倍率）
    Legendary    // 传说（3x 奖励倍率）
}

struct NFTMetadata {
    Rarity rarity;          // 稀有度
    uint256 mintedAt;       // 铸造时间
    string tokenURI;        // 元数据 URI
}

mapping(uint256 => NFTMetadata) public nftMetadata;
```

**功能列表**：

| 功能 | 函数签名 | 权限 | 说明 |
|------|---------|------|------|
| 铸造 NFT | `mint(address to, Rarity rarity, string uri)` | onlyOwner | 铸造指定稀有度的 NFT |
| 批量铸造 | `batchMint(address to, Rarity[] rarities, string[] uris)` | onlyOwner | 批量铸造，节省 gas |
| 查询稀有度 | `getRarity(uint256 tokenId) returns (Rarity)` | public | 查询 NFT 稀有度 |
| 查询奖励倍率 | `getRewardMultiplier(uint256 tokenId) returns (uint256)` | public | 根据稀有度返回倍率 |

**业务规则**：
1. 稀有度在铸造时设定，后续不可更改
2. 奖励倍率映射：
   - Common: 100（1.0x）
   - Rare: 150（1.5x）
   - Epic: 200（2.0x）
   - Legendary: 300（3.0x）
3. tokenId 从 0 开始递增
4. 每个 NFT 有唯一的 tokenURI

**事件定义**：
```solidity
event NFTMinted(address indexed to, uint256 indexed tokenId, Rarity rarity, uint256 timestamp);
event NFTBurned(uint256 indexed tokenId, address indexed owner);
```

---

#### 3.1.2 NFTStakingPool 合约

**功能描述**：NFT 质押池，用户质押 NFT 获得 ERC20 奖励代币。

**继承关系**：
```solidity
contract NFTStakingPool is
    ERC721Holder,
    ReentrancyGuard,
    Pausable,
    Ownable
```

**核心数据结构**：
```solidity
struct StakeInfo {
    address owner;              // 质押者地址
    uint256 stakedAt;           // 质押时间戳
    uint256 lastClaimAt;        // 上次领取奖励时间
    uint256 rewardMultiplier;   // 奖励倍率（缓存，避免重复读取）
    uint256 lockEndTime;        // 锁定期结束时间
    bool isLocked;              // 是否处于锁定状态
}

struct PoolConfig {
    uint256 baseRewardPerSecond;   // 基础每秒奖励（100 = 1 token/s）
    uint256 minLockDuration;       // 最短锁定时间（如 7 天）
    uint256 earlyWithdrawFee;      // 提前取回手续费（100 = 1%）
    uint256 totalStaked;           // 总质押数量
    bool emergencyMode;            // 紧急模式（仅退还 NFT，不发奖励）
}

mapping(address => mapping(uint256 => StakeInfo)) public stakes; // nftContract => tokenId => StakeInfo
mapping(address => uint256[]) public userStakedTokens;           // user => tokenId[]
PoolConfig public poolConfig;
```

**功能列表**：

| 功能 | 函数签名 | 权限 | Gas 估算 | 说明 |
|------|---------|------|---------|------|
| 质押 NFT | `stake(address nft, uint256 tokenId)` | public | ~120k | 质押单个 NFT |
| 批量质押 | `batchStake(address nft, uint256[] tokenIds)` | public | ~80k/个 | 批量质押，节省 gas |
| 取回 NFT | `unstake(address nft, uint256 tokenId)` | public | ~100k | 取回 NFT 并领取奖励 |
| 批量取回 | `batchUnstake(address nft, uint256[] tokenIds)` | public | ~70k/个 | 批量取回 |
| 领取奖励 | `claimRewards(address nft, uint256 tokenId)` | public | ~60k | 仅领取奖励，不取回 NFT |
| 批量领取 | `batchClaimRewards(address nft, uint256[] tokenIds)` | public | ~45k/个 | 批量领取奖励 |
| 计算待领奖励 | `calculateRewards(address nft, uint256 tokenId) returns (uint256)` | view | - | 查询可领取奖励 |
| 查询用户质押 | `getUserStakes(address user) returns (uint256[])` | view | - | 查询用户所有质押 |
| 应急取回 | `emergencyWithdraw(address nft, uint256 tokenId)` | public | ~80k | 紧急取回，不发奖励 |
| 设置池参数 | `setPoolConfig(PoolConfig config)` | onlyOwner | ~50k | 更新池配置 |
| 暂停/恢复 | `pause() / unpause()` | onlyOwner | ~30k | 紧急暂停功能 |

**核心业务逻辑**：

##### 1. 质押流程（stake）
```solidity
function stake(address nft, uint256 tokenId) external nonReentrant whenNotPaused {
    // 1. 验证
    require(nft == address(stakableNFT), "Invalid NFT contract");
    require(stakes[nft][tokenId].owner == address(0), "Already staked");

    // 2. 转入 NFT
    IERC721(nft).safeTransferFrom(msg.sender, address(this), tokenId);

    // 3. 读取稀有度倍率
    uint256 multiplier = IStakableNFT(nft).getRewardMultiplier(tokenId);

    // 4. 记录质押信息
    stakes[nft][tokenId] = StakeInfo({
        owner: msg.sender,
        stakedAt: block.timestamp,
        lastClaimAt: block.timestamp,
        rewardMultiplier: multiplier,
        lockEndTime: block.timestamp + poolConfig.minLockDuration,
        isLocked: true
    });

    // 5. 更新用户质押列表
    userStakedTokens[msg.sender].push(tokenId);
    poolConfig.totalStaked++;

    // 6. 触发成就检查（如果成就模块已部署）
    if (address(achievementTrigger) != address(0)) {
        achievementTrigger.onStake(msg.sender, tokenId);
    }

    emit Staked(msg.sender, nft, tokenId, multiplier, block.timestamp);
}
```

##### 2. 奖励计算（calculateRewards）
```solidity
function calculateRewards(address nft, uint256 tokenId) public view returns (uint256) {
    StakeInfo memory info = stakes[nft][tokenId];
    if (info.owner == address(0)) return 0;

    // 计算时间差（秒）
    uint256 duration = block.timestamp - info.lastClaimAt;

    // 基础奖励 = 基础速率 * 时间 * 稀有度倍率 / 100
    uint256 baseReward = poolConfig.baseRewardPerSecond * duration;
    uint256 finalReward = (baseReward * info.rewardMultiplier) / 100;

    return finalReward;
}
```

##### 3. 取回流程（unstake）
```solidity
function unstake(address nft, uint256 tokenId) external nonReentrant {
    StakeInfo storage info = stakes[nft][tokenId];
    require(info.owner == msg.sender, "Not owner");

    // 1. 计算奖励
    uint256 rewards = calculateRewards(nft, tokenId);

    // 2. 检查锁定期
    if (info.isLocked && block.timestamp < info.lockEndTime) {
        // 提前取回，扣除手续费
        uint256 fee = (rewards * poolConfig.earlyWithdrawFee) / 10000;
        rewards -= fee;
        emit EarlyWithdrawFee(msg.sender, tokenId, fee);
    }

    // 3. 发放奖励
    if (rewards > 0) {
        rewardToken.transfer(msg.sender, rewards);
    }

    // 4. 返还 NFT
    IERC721(nft).safeTransferFrom(address(this), msg.sender, tokenId);

    // 5. 清理状态
    delete stakes[nft][tokenId];
    _removeFromUserStakes(msg.sender, tokenId);
    poolConfig.totalStaked--;

    emit Unstaked(msg.sender, nft, tokenId, rewards, block.timestamp);
}
```

**业务规则**：
1. **锁定期机制**
   - 最短锁定期：7 天（可配置）
   - 锁定期内取回：扣除 5% 手续费（可配置）
   - 锁定期外取回：无手续费

2. **奖励分配**
   - 基础奖励速率：100 token/天（可配置）
   - 最终奖励 = 基础奖励 × 稀有度倍率 × 质押时长
   - 奖励实时计算，不占用额外存储

3. **批量操作优化**
   - 批量质押：循环外只进行一次授权检查
   - 批量领取：合并 token 转账，减少外部调用

4. **安全限制**
   - 使用 ReentrancyGuard 防止重入攻击
   - 使用 Pausable 实现紧急暂停
   - 应急模式：只退 NFT，不发奖励（防止奖励池耗尽）

**事件定义**：
```solidity
event Staked(address indexed user, address indexed nft, uint256 indexed tokenId, uint256 multiplier, uint256 timestamp);
event Unstaked(address indexed user, address indexed nft, uint256 indexed tokenId, uint256 rewards, uint256 timestamp);
event RewardsClaimed(address indexed user, address indexed nft, uint256 indexed tokenId, uint256 amount);
event EarlyWithdrawFee(address indexed user, uint256 indexed tokenId, uint256 feeAmount);
event PoolConfigUpdated(uint256 baseRewardPerSecond, uint256 minLockDuration, uint256 earlyWithdrawFee);
event EmergencyWithdraw(address indexed user, address indexed nft, uint256 indexed tokenId);
```

---

#### 3.1.3 RewardCalculator 库

**功能描述**：奖励计算工具库，提供可复用的计算逻辑。

**库定义**：
```solidity
library RewardCalculator {
    struct CalculationParams {
        uint256 baseRewardPerSecond;
        uint256 stakeDuration;        // 秒
        uint256 rewardMultiplier;     // 稀有度倍率（100 = 1.0x）
    }

    // 计算基础奖励
    function calculateBaseReward(CalculationParams memory params) internal pure returns (uint256) {
        return params.baseRewardPerSecond * params.stakeDuration;
    }

    // 应用稀有度倍率
    function applyMultiplier(uint256 baseReward, uint256 multiplier) internal pure returns (uint256) {
        return (baseReward * multiplier) / 100;
    }

    // 应用手续费扣除
    function applyFee(uint256 amount, uint256 feeRate) internal pure returns (uint256, uint256) {
        uint256 fee = (amount * feeRate) / 10000;  // feeRate 精度为 0.01%
        return (amount - fee, fee);
    }

    // 完整计算流程
    function calculateFinalReward(
        CalculationParams memory params,
        bool isEarlyWithdraw,
        uint256 earlyWithdrawFee
    ) internal pure returns (uint256 finalReward, uint256 fee) {
        uint256 baseReward = calculateBaseReward(params);
        uint256 rewardWithMultiplier = applyMultiplier(baseReward, params.rewardMultiplier);

        if (isEarlyWithdraw) {
            return applyFee(rewardWithMultiplier, earlyWithdrawFee);
        } else {
            return (rewardWithMultiplier, 0);
        }
    }
}
```

---

### 3.2 模块 2：动态成就系统

#### 3.2.1 AchievementNFT 合约

**功能描述**：动态成就 NFT，元数据根据用户质押数据实时变化。

**继承关系**：
```solidity
contract AchievementNFT is
    ERC721,
    ERC721URIStorage,
    ERC721Enumerable,
    ERC721Votes,
    EIP712,
    Ownable
```

**核心数据结构**：
```solidity
enum AchievementType {
    FirstStake,       // 首次质押
    Whale,            // 巨鲸（质押 10+ NFT）
    Diamond,          // 钻石手（持续质押 30 天）
    Legendary,        // 传说收集者（质押 1 个传说级 NFT）
    Master            // 大师（完成所有成就）
}

struct Achievement {
    AchievementType achievementType;
    uint256 level;              // 成就等级（1-5）
    uint256 unlockedAt;         // 解锁时间
    uint256 votingPower;        // 投票权重（等级越高权重越大）
}

mapping(uint256 => Achievement) public achievements;
mapping(address => mapping(AchievementType => bool)) public hasAchievement;
```

**功能列表**：

| 功能 | 函数签名 | 权限 | 说明 |
|------|---------|------|------|
| 铸造成就 | `mint(address to, AchievementType type)` | onlyTrigger | 由触发器调用 |
| 升级成就 | `upgradeAchievement(uint256 tokenId)` | internal | 根据质押数据升级 |
| 动态 URI | `tokenURI(uint256 tokenId) returns (string)` | public | 根据等级返回不同元数据 |
| 查询投票权 | `getVotingPower(address user) returns (uint256)` | view | 计算用户总投票权 |

**成就定义表**：

| 成就类型 | 解锁条件 | 初始等级 | 升级条件 | 最大等级 | 投票权 |
|---------|---------|---------|---------|---------|--------|
| FirstStake | 首次质押任意 NFT | 1 | - | 1 | 10 |
| Whale | 累计质押 10 个 NFT | 1 | 每增加 10 个升 1 级 | 5 | 50-250 |
| Diamond | 连续质押 30 天不取回 | 1 | 30/60/90/180/365 天 | 5 | 100-500 |
| Legendary | 质押 1 个传说级 NFT | 1 | 每增加 1 个升 1 级 | 5 | 150-750 |
| Master | 完成所有其他成就 | 1 | 所有成就达到 5 级 | 1 | 1000 |

**动态元数据生成逻辑**：
```solidity
function tokenURI(uint256 tokenId) public view override returns (string memory) {
    Achievement memory achievement = achievements[tokenId];
    address owner = ownerOf(tokenId);

    // 读取用户当前质押数据（跨合约调用）
    uint256 currentStakedCount = stakingPool.getUserStakes(owner).length;

    // 根据成就类型和等级生成不同的 URI
    string memory baseURI = "https://api.example.com/achievement/";
    string memory metadata = string(abi.encodePacked(
        baseURI,
        Strings.toString(uint256(achievement.achievementType)),
        "/level-",
        Strings.toString(achievement.level),
        "/staked-",
        Strings.toString(currentStakedCount)
    ));

    return metadata;
}
```

**事件定义**：
```solidity
event AchievementUnlocked(address indexed user, uint256 indexed tokenId, AchievementType achievementType, uint256 timestamp);
event AchievementUpgraded(uint256 indexed tokenId, uint256 oldLevel, uint256 newLevel);
event VotingPowerChanged(address indexed user, uint256 oldPower, uint256 newPower);
```

---

#### 3.2.2 AchievementTrigger 合约

**功能描述**：监听质押事件，自动触发成就解锁。

**核心数据结构**：
```solidity
struct UserProgress {
    uint256 totalStakedCount;      // 累计质押数量
    uint256 currentStakedCount;    // 当前质押数量
    uint256 longestStakeDuration;  // 最长连续质押时长
    uint256 legendaryCount;        // 传说级 NFT 质押数量
    uint256 firstStakeTime;        // 首次质押时间
}

mapping(address => UserProgress) public userProgress;
```

**功能列表**：

| 功能 | 函数签名 | 权限 | 说明 |
|------|---------|------|------|
| 质押回调 | `onStake(address user, uint256 tokenId)` | onlyStakingPool | 质押时触发 |
| 取回回调 | `onUnstake(address user, uint256 tokenId)` | onlyStakingPool | 取回时触发 |
| 检查成就 | `checkAchievements(address user)` | internal | 检查并解锁成就 |
| 手动检查 | `manualCheckAchievements(address user)` | public | 用户手动触发检查 |

**触发逻辑**：
```solidity
function onStake(address user, uint256 tokenId) external onlyStakingPool {
    UserProgress storage progress = userProgress[user];

    // 更新进度
    progress.totalStakedCount++;
    progress.currentStakedCount++;
    if (progress.firstStakeTime == 0) {
        progress.firstStakeTime = block.timestamp;
    }

    // 如果是传说级 NFT
    Rarity rarity = stakableNFT.getRarity(tokenId);
    if (rarity == Rarity.Legendary) {
        progress.legendaryCount++;
    }

    // 检查成就解锁
    checkAchievements(user);
}

function checkAchievements(address user) internal {
    UserProgress memory progress = userProgress[user];

    // 检查首次质押
    if (!achievementNFT.hasAchievement(user, AchievementType.FirstStake)) {
        achievementNFT.mint(user, AchievementType.FirstStake);
    }

    // 检查巨鲸成就
    if (progress.currentStakedCount >= 10 &&
        !achievementNFT.hasAchievement(user, AchievementType.Whale)) {
        achievementNFT.mint(user, AchievementType.Whale);
    }

    // 检查传说收集者
    if (progress.legendaryCount >= 1 &&
        !achievementNFT.hasAchievement(user, AchievementType.Legendary)) {
        achievementNFT.mint(user, AchievementType.Legendary);
    }

    // ... 其他成就检查
}
```

---

### 3.3 模块 3：治理功能

#### 3.3.1 AchievementGovernor 合约

**功能描述**：基于成就 NFT 的 DAO 治理合约。

**继承关系**：
```solidity
contract AchievementGovernor is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction
```

**核心功能**：

| 功能 | 函数签名 | 说明 |
|------|---------|------|
| 创建提案 | `propose(...)` | 需要持有成就 NFT |
| 投票 | `castVote(uint256 proposalId, uint8 support)` | 投票权重 = 成就等级之和 |
| 执行提案 | `execute(uint256 proposalId)` | 提案通过后执行 |

**投票权重计算**：
```solidity
function getVotes(address account, uint256 blockNumber) public view override returns (uint256) {
    // 累加该用户所有成就 NFT 的投票权
    uint256 totalVotes = 0;
    uint256 balance = achievementNFT.balanceOf(account);

    for (uint256 i = 0; i < balance; i++) {
        uint256 tokenId = achievementNFT.tokenOfOwnerByIndex(account, i);
        Achievement memory achievement = achievementNFT.achievements(tokenId);
        totalVotes += achievement.votingPower;
    }

    return totalVotes;
}
```

**治理参数**：
- 提案门槛：至少持有 1 个成就 NFT
- 投票期：3 天
- 延迟期：1 天
- 通过阈值：50% + 1 票
- 法定人数：总投票权的 10%

---

## 🔒 安全设计

### 4.1 安全机制

| 威胁类型 | 缓解措施 | 实现方式 |
|---------|---------|---------|
| 重入攻击 | ReentrancyGuard | 所有状态变更函数使用 `nonReentrant` |
| 权限滥用 | Ownable + AccessControl | 分离管理员和操作员权限 |
| 整数溢出 | Solidity 0.8+ | 内置溢出检查 |
| 闪电贷攻击 | 时间快照 | 投票权基于历史区块 |
| 前端运行攻击 | 无法完全避免 | 建议用户设置滑点保护（前端实现）|
| NFT 锁死 | ERC721Holder | 合约实现接收接口 |
| 奖励池耗尽 | 应急模式 | 管理员可启用应急取回（不发奖励）|

### 4.2 访问控制矩阵

| 角色 | 权限 | 受限函数 |
|------|------|---------|
| Owner（管理员） | 设置池参数、暂停/恢复、铸造 NFT | `setPoolConfig`, `pause`, `mint` |
| Trigger（触发器） | 铸造成就 NFT | `AchievementNFT.mint` |
| User（用户） | 质押、取回、领取、投票 | `stake`, `unstake`, `claimRewards`, `castVote` |

### 4.3 应急预案

1. **暂停机制**
   - 管理员可暂停质押和取回功能
   - 暂停期间用户仍可使用 `emergencyWithdraw`

2. **应急取回**
   - 用户可无条件取回 NFT
   - 不发放奖励（防止奖励池被恶意耗尽）

3. **合约升级**
   - 不使用 UUPS 升级（首个版本保持简单）
   - 如需修改，部署新合约并迁移数据

---

## 🛠️ 技术栈

### 5.1 开发环境

| 类别 | 技术选型 | 版本 |
|------|---------|------|
| 开发框架 | Hardhat | 2.26+ |
| 合约标准库 | OpenZeppelin Contracts | 5.4.0 |
| 编程语言 | Solidity | 0.8.28 |
| 类型系统 | TypeScript | 5.0+ |
| 以太坊客户端 | Viem | 2.38+ |
| 测试框架 | Mocha + Chai | - |
| 覆盖率工具 | Hardhat Coverage | - |

### 5.2 OpenZeppelin 依赖

```json
{
  "dependencies": {
    "@openzeppelin/contracts": "^5.4.0"
  },
  "imports": [
    "token/ERC721/ERC721.sol",
    "token/ERC721/extensions/ERC721URIStorage.sol",
    "token/ERC721/extensions/ERC721Enumerable.sol",
    "token/ERC721/extensions/ERC721Burnable.sol",
    "token/ERC721/extensions/ERC721Votes.sol",
    "token/ERC721/utils/ERC721Holder.sol",
    "access/Ownable.sol",
    "utils/ReentrancyGuard.sol",
    "utils/Pausable.sol",
    "governance/Governor.sol"
  ]
}
```

---

## 📊 数据存储设计

### 6.1 存储布局优化

**StakeInfo 结构体优化**：
```solidity
// ❌ 未优化（占用 6 个 slot）
struct StakeInfo {
    address owner;           // 20 bytes → slot 0
    uint256 stakedAt;        // 32 bytes → slot 1
    uint256 lastClaimAt;     // 32 bytes → slot 2
    uint256 rewardMultiplier;// 32 bytes → slot 3
    uint256 lockEndTime;     // 32 bytes → slot 4
    bool isLocked;           // 1 byte  → slot 5
}

// ✅ 优化后（占用 4 个 slot）
struct StakeInfo {
    address owner;           // 20 bytes ─┐
    uint96 rewardMultiplier; // 12 bytes  │ → slot 0 (32 bytes)
                             //           ┘
    uint128 stakedAt;        // 16 bytes ─┐
    uint128 lastClaimAt;     // 16 bytes  │ → slot 1 (32 bytes)
                             //           ┘
    uint128 lockEndTime;     // 16 bytes ─┐
    bool isLocked;           // 1 byte    │
    uint120 padding;         // 15 bytes  │ → slot 2 (32 bytes)
                             //           ┘
}
```

**Gas 节省**：
- 单次写入：节省 ~40,000 gas（2 个 SSTORE）
- 单次读取：节省 ~4,000 gas（2 个 SLOAD）

### 6.2 索引设计

**用户质押列表**：
```solidity
// 使用数组存储，方便枚举
mapping(address => uint256[]) public userStakedTokens;

// 辅助索引：快速查找 tokenId 在数组中的位置
mapping(address => mapping(uint256 => uint256)) private tokenIdToIndex;
```

---

## 🧪 测试要求

### 7.1 测试覆盖率目标

| 类型 | 目标覆盖率 |
|------|-----------|
| 语句覆盖率 | ≥ 95% |
| 分支覆盖率 | ≥ 90% |
| 函数覆盖率 | 100% |

### 7.2 测试用例清单

#### Phase 1：NFT 质押核心

**StakableNFT 测试**：
- [ ] 正常铸造单个 NFT
- [ ] 批量铸造 NFT
- [ ] 查询稀有度和倍率
- [ ] 销毁 NFT
- [ ] 权限控制（非 owner 无法铸造）

**NFTStakingPool 测试**：
- [ ] 正常质押流程
- [ ] 批量质押（2/5/10 个）
- [ ] 奖励计算准确性
- [ ] 锁定期内取回（扣手续费）
- [ ] 锁定期后取回（无手续费）
- [ ] 领取奖励不取回 NFT
- [ ] 批量领取奖励
- [ ] 应急取回
- [ ] 暂停功能
- [ ] 重入攻击防护
- [ ] 边界条件：
  - [ ] 质押不存在的 tokenId
  - [ ] 重复质押同一个 tokenId
  - [ ] 非 owner 取回他人 NFT
  - [ ] 奖励池余额不足

#### Phase 2：成就系统

**AchievementNFT 测试**：
- [ ] 解锁各类成就
- [ ] 成就升级
- [ ] 动态 tokenURI 生成
- [ ] 投票权计算
- [ ] 事件触发

**AchievementTrigger 测试**：
- [ ] 首次质押触发 FirstStake
- [ ] 质押 10 个触发 Whale
- [ ] 质押传说级触发 Legendary
- [ ] 连续质押 30 天触发 Diamond
- [ ] 完成所有成就触发 Master

#### Phase 3：治理

**AchievementGovernor 测试**：
- [ ] 创建提案
- [ ] 投票流程
- [ ] 提案执行
- [ ] 投票权重计算
- [ ] 法定人数检查

### 7.3 Gas 基准测试

| 操作 | 目标 Gas | 实际 Gas | 状态 |
|------|---------|---------|------|
| 质押单个 NFT | < 150k | TBD | ⏳ |
| 批量质押（10 个） | < 800k | TBD | ⏳ |
| 领取奖励 | < 80k | TBD | ⏳ |
| 取回 NFT | < 120k | TBD | ⏳ |
| 解锁成就 | < 100k | TBD | ⏳ |

---

## 📅 开发计划

### 8.1 里程碑

| 阶段 | 时间 | 交付物 | 负责人 |
|------|------|--------|--------|
| **Phase 1** | Week 1-2 | NFT 质押核心 + 测试 | snome |
| **Phase 2** | Week 3-4 | 成就系统 + 测试 | snome |
| **Phase 3** | Week 5 | 治理功能 + 集成测试 | snome |
| **Phase 4** | Week 6 | 部署 + 文档 | snome |

### 8.2 详细任务分解

#### Week 1：基础合约开发
- [ ] Day 1-2：编写 `StakableNFT.sol`
- [ ] Day 3-4：编写 `NFTStakingPool.sol`
- [ ] Day 5：编写 `RewardCalculator.sol`
- [ ] Day 6-7：单元测试（覆盖率 > 90%）

#### Week 2：核心功能完善
- [ ] Day 1-2：实现批量操作
- [ ] Day 3：锁定期机制
- [ ] Day 4：应急功能
- [ ] Day 5：集成测试
- [ ] Day 6-7：Gas 优化

#### Week 3：成就系统开发
- [ ] Day 1-2：编写 `AchievementNFT.sol`
- [ ] Day 3-4：编写 `AchievementTrigger.sol`
- [ ] Day 5：动态元数据逻辑
- [ ] Day 6-7：单元测试

#### Week 4：成就系统完善
- [ ] Day 1-2：成就升级逻辑
- [ ] Day 3：集成质押合约
- [ ] Day 4-5：测试成就触发
- [ ] Day 6-7：优化和修复

#### Week 5：治理功能
- [ ] Day 1-3：编写 `AchievementGovernor.sol`
- [ ] Day 4-5：投票权重测试
- [ ] Day 6-7：完整集成测试

#### Week 6：部署与文档
- [ ] Day 1-2：部署脚本
- [ ] Day 3：测试网部署
- [ ] Day 4-5：用户文档
- [ ] Day 6-7：技术文档

---

## 📝 接口文档

### 9.1 核心接口

#### IStakableNFT
```solidity
interface IStakableNFT {
    function getRarity(uint256 tokenId) external view returns (Rarity);
    function getRewardMultiplier(uint256 tokenId) external view returns (uint256);
    function mint(address to, Rarity rarity, string memory uri) external;
}
```

#### INFTStakingPool
```solidity
interface INFTStakingPool {
    function stake(address nft, uint256 tokenId) external;
    function unstake(address nft, uint256 tokenId) external;
    function claimRewards(address nft, uint256 tokenId) external;
    function calculateRewards(address nft, uint256 tokenId) external view returns (uint256);
    function getUserStakes(address user) external view returns (uint256[] memory);
}
```

#### IAchievementNFT
```solidity
interface IAchievementNFT {
    function mint(address to, AchievementType achievementType) external;
    function getVotingPower(address user) external view returns (uint256);
    function hasAchievement(address user, AchievementType achievementType) external view returns (bool);
}
```

---

## 📈 性能指标

### 10.1 目标指标

| 指标 | 目标值 | 测量方法 |
|------|--------|---------|
| 单次质押 Gas | < 150k | Hardhat Gas Reporter |
| 批量质押（10 个）平均 Gas | < 80k/个 | 对比单次质押的 Gas 优化 |
| 奖励计算精度 | 误差 < 0.01% | 单元测试验证 |
| 合约大小 | < 24 KB/合约 | Hardhat 编译输出 |
| 测试覆盖率 | > 95% | Hardhat Coverage |

### 10.2 可扩展性

- **最大质押数量**：无硬性限制（受 gas limit 约束）
- **最大成就类型**：可扩展到 256 种（enum uint8）
- **支持 NFT 合约**：可配置白名单（未来版本）

---

## 🚀 部署计划

### 11.1 部署顺序

```
1. RewardToken（如果还未部署）
   ↓
2. StakableNFT
   ↓
3. NFTStakingPool（构造函数传入 StakableNFT 和 RewardToken 地址）
   ↓
4. AchievementNFT
   ↓
5. AchievementTrigger（构造函数传入 NFTStakingPool 和 AchievementNFT 地址）
   ↓
6. AchievementGovernor（构造函数传入 AchievementNFT 地址）
   ↓
7. 配置权限（设置 Trigger 为 AchievementNFT 的 minter）
```

### 11.2 部署网络

| 网络 | 用途 | RPC | 区块浏览器 |
|------|------|-----|-----------|
| Hardhat Local | 开发测试 | http://localhost:8545 | - |
| Sepolia | 测试网部署 | Infura/Alchemy | https://sepolia.etherscan.io |
| Mainnet | 生产部署（待定）| Infura/Alchemy | https://etherscan.io |

### 11.3 部署检查清单

**部署前**：
- [ ] 所有测试通过
- [ ] Gas 优化完成
- [ ] 安全审计（如有预算）
- [ ] 文档完善

**部署中**：
- [ ] 记录所有合约地址
- [ ] 验证合约源码（Etherscan）
- [ ] 测试基本功能

**部署后**：
- [ ] 转移 Ownership 到多签钱包
- [ ] 初始化池参数
- [ ] 铸造测试 NFT（测试网）

---

## 📚 参考资料

### 12.1 技术文档

- [OpenZeppelin Contracts v5.x](https://docs.openzeppelin.com/contracts/5.x/)
- [EIP-721: Non-Fungible Token Standard](https://eips.ethereum.org/EIPS/eip-721)
- [EIP-2981: NFT Royalty Standard](https://eips.ethereum.org/EIPS/eip-2981)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Viem Documentation](https://viem.sh/)

### 12.2 类似项目参考

- **Bored Ape Yacht Club** - NFT 项目参考
- **Axie Infinity Staking** - NFT 质押机制
- **ENS DAO** - 治理系统参考
- **Parallel Alpha** - 动态 NFT 案例

---

## 🔄 版本规划

### v1.0（当前版本）
- ✅ NFT 质押挖矿核心功能
- ✅ 动态成就系统
- ✅ 基础治理功能

### v1.1（规划中）
- ⏳ 支持多个 NFT 合约质押
- ⏳ 更丰富的成就类型
- ⏳ 成就交易市场

### v2.0（未来）
- ⏳ 跨链支持
- ⏳ NFT 租赁功能
- ⏳ 高级治理（委托投票）

---

## ✅ 验收标准

### 功能验收
- [ ] 所有核心功能正常运行
- [ ] 无 critical/high 级别 bug
- [ ] 测试覆盖率 > 95%

### 性能验收
- [ ] Gas 消耗符合目标
- [ ] 合约大小 < 24 KB

### 安全验收
- [ ] 通过 Slither 静态分析（0 high issue）
- [ ] 通过 MythX 扫描
- [ ] Code Review 完成

### 文档验收
- [ ] 用户文档完整
- [ ] 开发者文档完整
- [ ] 部署文档完整

---

## 📞 联系方式

**项目负责人**：snome
**邮箱**：TBD
**GitHub**：TBD

---

**文档结束**

*本文档将随着项目开发进度持续更新。如有疑问或建议，请联系项目负责人。*
