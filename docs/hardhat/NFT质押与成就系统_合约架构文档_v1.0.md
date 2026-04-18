# NFT 质押与成就系统 - 合约架构文档

**项目代号**：NFT-Staking-Achievement
**版本**：v1.0
**创建日期**：2025-10-27
**技术架构师**：snome

---

## 📋 文档说明

本文档为技术架构文档，面向智能合约开发者。内容包括：
- 合约详细设计
- 继承关系与依赖
- 数据流与调用链
- 存储布局与优化
- 安全机制实现
- 升级与扩展策略

**相关文档**：
- 功能需求文档：`NFT质押与成就系统_需求文档_v1.0.md`
- 测试文档：待编写
- 部署文档：待编写

---

## 🏗️ 整体架构

### 1.1 系统分层架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                          应用层（Application Layer）                  │
│                                                                       │
│  前端 DApp / Web3 SDK / Subgraph                                      │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 │ ABI 调用
                                 │
┌────────────────────────────────▼────────────────────────────────────┐
│                         合约层（Contract Layer）                       │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  业务逻辑层（Business Logic Layer）                            │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │                                                              │   │
│  │  ┌─────────────────┐    ┌─────────────────┐                │   │
│  │  │ NFTStakingPool  │───►│AchievementTrigger│                │   │
│  │  │   (核心逻辑)     │    │  (事件触发)      │                │   │
│  │  └────────┬────────┘    └────────┬────────┘                │   │
│  │           │                      │                          │   │
│  │           │                      │                          │   │
│  │           ▼                      ▼                          │   │
│  │  ┌─────────────────┐    ┌─────────────────┐                │   │
│  │  │  StakableNFT    │    │ AchievementNFT  │                │   │
│  │  │  (质押资产)      │    │  (成就凭证)      │                │   │
│  │  └─────────────────┘    └────────┬────────┘                │   │
│  │                                   │                          │   │
│  │                                   ▼                          │   │
│  │                          ┌─────────────────┐                │   │
│  │                          │AchievementGovernor│               │   │
│  │                          │    (治理)        │                │   │
│  │                          └─────────────────┘                │   │
│  │                                                              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  工具库层（Library Layer）                                     │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │                                                              │   │
│  │  ┌─────────────────┐    ┌─────────────────┐                │   │
│  │  │RewardCalculator │    │DynamicMetadata  │                │   │
│  │  │  (奖励计算)      │    │  (元数据生成)    │                │   │
│  │  └─────────────────┘    └─────────────────┘                │   │
│  │                                                              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  基础设施层（Infrastructure Layer）                            │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │                                                              │   │
│  │  OpenZeppelin Contracts v5:                                  │   │
│  │  • ERC721, ERC721Enumerable, ERC721Votes                     │   │
│  │  • ReentrancyGuard, Pausable, Ownable                        │   │
│  │  • Governor, EIP712                                          │   │
│  │                                                              │   │
│  └──────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────┘
```

### 1.2 合约依赖关系图

```
                    RewardToken (ERC20)
                         ▲
                         │ 发放奖励
                         │
         ┌───────────────┴───────────────┐
         │                               │
    StakableNFT                  NFTStakingPool ◄──────────┐
    (ERC721)                     (核心逻辑)                  │
         │                               │                  │
         │ 读取稀有度                     │ 触发事件          │
         │                               │                  │
         └───────────────┬───────────────┘                  │
                         │                                  │
                         ▼                                  │
                 AchievementTrigger ─────────►  读取质押状态  │
                 (事件监听器)                                 │
                         │                                  │
                         │ 铸造成就                          │
                         │                                  │
                         ▼                                  │
                  AchievementNFT ──────────────────────────┘
                  (ERC721Votes)           读取质押数据
                         │
                         │ 投票权重
                         │
                         ▼
                AchievementGovernor
                (DAO 治理)
```

**依赖说明**：
- **实线箭头**：直接合约调用（强依赖）
- **虚线箭头**：读取状态（弱依赖）
- **双向箭头**：相互调用

---

## 📦 合约模块详细设计

### 2.1 Phase 1：NFT 质押核心

---

#### 2.1.1 StakableNFT.sol

**功能定位**：可质押的 NFT 资产合约，包含稀有度属性。

**继承关系图**：
```
         ERC721 (OpenZeppelin)
              │
              ├─► ERC721URIStorage
              │
              ├─► ERC721Enumerable
              │
              ├─► ERC721Burnable
              │
              └─► Ownable
                    │
                    ▼
              StakableNFT (本项目)
```

**完整合约定义**：

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title StakableNFT
 * @notice 可质押的 NFT 合约，每个 NFT 具有不同的稀有度属性
 * @dev 稀有度决定质押奖励倍率，在铸造时设定且不可更改
 */
contract StakableNFT is
    ERC721,
    ERC721URIStorage,
    ERC721Enumerable,
    ERC721Burnable,
    Ownable
{
    using Strings for uint256;

    // ============================================
    // 类型定义
    // ============================================

    /**
     * @notice NFT 稀有度枚举
     * @dev 数值越大，奖励倍率越高
     */
    enum Rarity {
        Common,      // 0: 普通 (1.0x)
        Rare,        // 1: 稀有 (1.5x)
        Epic,        // 2: 史诗 (2.0x)
        Legendary    // 3: 传说 (3.0x)
    }

    /**
     * @notice NFT 元数据结构
     */
    struct NFTMetadata {
        Rarity rarity;          // 稀有度
        uint256 mintedAt;       // 铸造时间戳
    }

    // ============================================
    // 状态变量
    // ============================================

    /// @notice tokenId 计数器
    uint256 private _tokenIdCounter;

    /// @notice tokenId => NFTMetadata 映射
    mapping(uint256 => NFTMetadata) public nftMetadata;

    /// @notice 稀有度 => 奖励倍率映射 (精度 100 = 1.0x)
    mapping(Rarity => uint256) public rarityMultipliers;

    /// @notice 基础 URI（用于拼接 tokenURI）
    string private _baseTokenURI;

    // ============================================
    // 常量
    // ============================================

    /// @notice 合约版本
    string public constant VERSION = "1.0.0";

    // ============================================
    // 事件
    // ============================================

    /**
     * @notice NFT 铸造事件
     * @param to 接收地址
     * @param tokenId Token ID
     * @param rarity 稀有度
     * @param timestamp 铸造时间戳
     */
    event NFTMinted(
        address indexed to,
        uint256 indexed tokenId,
        Rarity rarity,
        uint256 timestamp
    );

    /**
     * @notice 批量铸造事件
     * @param to 接收地址
     * @param startTokenId 起始 Token ID
     * @param count 铸造数量
     * @param timestamp 铸造时间戳
     */
    event BatchMinted(
        address indexed to,
        uint256 startTokenId,
        uint256 count,
        uint256 timestamp
    );

    /**
     * @notice 基础 URI 更新事件
     * @param newBaseURI 新的基础 URI
     */
    event BaseURIUpdated(string newBaseURI);

    // ============================================
    // 错误定义
    // ============================================

    /// @notice 无效的稀有度
    error InvalidRarity();

    /// @notice 批量铸造数量不匹配
    error MismatchedArrayLengths();

    /// @notice 批量铸造数量超限
    error ExceedsMaxBatchSize();

    // ============================================
    // 构造函数
    // ============================================

    /**
     * @notice 构造函数
     * @param name_ NFT 名称
     * @param symbol_ NFT 符号
     * @param baseURI_ 基础 URI
     */
    constructor(
        string memory name_,
        string memory symbol_,
        string memory baseURI_
    ) ERC721(name_, symbol_) Ownable(msg.sender) {
        _baseTokenURI = baseURI_;

        // 初始化稀有度倍率
        rarityMultipliers[Rarity.Common] = 100;      // 1.0x
        rarityMultipliers[Rarity.Rare] = 150;        // 1.5x
        rarityMultipliers[Rarity.Epic] = 200;        // 2.0x
        rarityMultipliers[Rarity.Legendary] = 300;   // 3.0x
    }

    // ============================================
    // 外部函数（Owner Only）
    // ============================================

    /**
     * @notice 铸造单个 NFT
     * @param to 接收地址
     * @param rarity 稀有度
     * @return tokenId 新铸造的 Token ID
     */
    function mint(address to, Rarity rarity)
        external
        onlyOwner
        returns (uint256)
    {
        if (uint8(rarity) > uint8(Rarity.Legendary)) {
            revert InvalidRarity();
        }

        uint256 tokenId = _tokenIdCounter++;
        _safeMint(to, tokenId);

        // 存储元数据
        nftMetadata[tokenId] = NFTMetadata({
            rarity: rarity,
            mintedAt: block.timestamp
        });

        emit NFTMinted(to, tokenId, rarity, block.timestamp);
        return tokenId;
    }

    /**
     * @notice 批量铸造 NFT
     * @param to 接收地址
     * @param rarities 稀有度数组
     * @return tokenIds 新铸造的 Token ID 数组
     */
    function batchMint(address to, Rarity[] calldata rarities)
        external
        onlyOwner
        returns (uint256[] memory tokenIds)
    {
        uint256 count = rarities.length;
        if (count == 0 || count > 100) {
            revert ExceedsMaxBatchSize();
        }

        tokenIds = new uint256[](count);
        uint256 startTokenId = _tokenIdCounter;

        for (uint256 i = 0; i < count; i++) {
            if (uint8(rarities[i]) > uint8(Rarity.Legendary)) {
                revert InvalidRarity();
            }

            uint256 tokenId = _tokenIdCounter++;
            _safeMint(to, tokenId);

            nftMetadata[tokenId] = NFTMetadata({
                rarity: rarities[i],
                mintedAt: block.timestamp
            });

            tokenIds[i] = tokenId;
        }

        emit BatchMinted(to, startTokenId, count, block.timestamp);
        return tokenIds;
    }

    /**
     * @notice 设置基础 URI
     * @param baseURI_ 新的基础 URI
     */
    function setBaseURI(string memory baseURI_) external onlyOwner {
        _baseTokenURI = baseURI_;
        emit BaseURIUpdated(baseURI_);
    }

    // ============================================
    // 外部函数（Public View）
    // ============================================

    /**
     * @notice 查询 NFT 稀有度
     * @param tokenId Token ID
     * @return rarity 稀有度
     */
    function getRarity(uint256 tokenId)
        external
        view
        returns (Rarity)
    {
        _requireOwned(tokenId);
        return nftMetadata[tokenId].rarity;
    }

    /**
     * @notice 查询奖励倍率
     * @param tokenId Token ID
     * @return multiplier 倍率（100 = 1.0x）
     */
    function getRewardMultiplier(uint256 tokenId)
        external
        view
        returns (uint256)
    {
        _requireOwned(tokenId);
        Rarity rarity = nftMetadata[tokenId].rarity;
        return rarityMultipliers[rarity];
    }

    /**
     * @notice 批量查询稀有度
     * @param tokenIds Token ID 数组
     * @return rarities 稀有度数组
     */
    function batchGetRarity(uint256[] calldata tokenIds)
        external
        view
        returns (Rarity[] memory rarities)
    {
        rarities = new Rarity[](tokenIds.length);
        for (uint256 i = 0; i < tokenIds.length; i++) {
            rarities[i] = nftMetadata[tokenIds[i]].rarity;
        }
        return rarities;
    }

    // ============================================
    // 内部函数（重写）
    // ============================================

    /**
     * @dev 重写 _baseURI
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @dev 重写 tokenURI，生成动态元数据 URI
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        _requireOwned(tokenId);

        NFTMetadata memory metadata = nftMetadata[tokenId];
        string memory base = _baseURI();

        // 格式：baseURI/rarity/tokenId
        return string(abi.encodePacked(
            base,
            _rarityToString(metadata.rarity),
            "/",
            tokenId.toString()
        ));
    }

    /**
     * @dev 重写 _update（多继承冲突解决）
     */
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    /**
     * @dev 重写 _increaseBalance（多继承冲突解决）
     */
    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    /**
     * @dev 重写 supportsInterface（多继承冲突解决）
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // ============================================
    // 私有辅助函数
    // ============================================

    /**
     * @dev 稀有度枚举转字符串
     */
    function _rarityToString(Rarity rarity)
        private
        pure
        returns (string memory)
    {
        if (rarity == Rarity.Common) return "common";
        if (rarity == Rarity.Rare) return "rare";
        if (rarity == Rarity.Epic) return "epic";
        return "legendary";
    }
}
```

**关键设计点**：

1. **状态变量布局**：
   ```solidity
   // Slot 0: _tokenIdCounter (uint256)
   // Slot 1-N: nftMetadata mapping
   // Slot N+1: rarityMultipliers mapping
   ```

2. **Gas 优化**：
   - 使用 `_tokenIdCounter` 避免昂贵的 `totalSupply()` 调用
   - 批量操作减少外部调用
   - 缓存稀有度倍率在 mapping 中

3. **安全考虑**：
   - 使用 `_requireOwned` 检查 token 存在性
   - 稀有度验证防止无效输入
   - 批量铸造限制最大数量（100）

---

#### 2.1.2 NFTStakingPool.sol

**功能定位**：质押池核心合约，管理 NFT 质押状态和奖励分发。

**继承关系图**：
```
    ERC721Holder (OpenZeppelin)
           │
           ├─► ReentrancyGuard
           │
           ├─► Pausable
           │
           └─► Ownable
                 │
                 ▼
           NFTStakingPool (本项目)
```

**完整合约定义**：

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IStakableNFT.sol";
import "./IAchievementTrigger.sol";
import "../libraries/RewardCalculator.sol";

/**
 * @title NFTStakingPool
 * @notice NFT 质押池，用户质押 NFT 获得 ERC20 奖励
 * @dev 支持批量操作、锁定期机制、应急模式
 */
contract NFTStakingPool is
    ERC721Holder,
    ReentrancyGuard,
    Pausable,
    Ownable
{
    using SafeERC20 for IERC20;
    using RewardCalculator for RewardCalculator.CalculationParams;

    // ============================================
    // 类型定义
    // ============================================

    /**
     * @notice 质押信息结构体（Gas 优化版）
     * @dev 总共占用 3 个 storage slot
     */
    struct StakeInfo {
        address owner;              // slot 0: 20 bytes
        uint96 rewardMultiplier;    // slot 0: 12 bytes (合并到 slot 0)

        uint128 stakedAt;           // slot 1: 16 bytes
        uint128 lastClaimAt;        // slot 1: 16 bytes

        uint128 lockEndTime;        // slot 2: 16 bytes
        bool isLocked;              // slot 2: 1 byte
        // 剩余 15 bytes padding
    }

    /**
     * @notice 池配置结构体
     */
    struct PoolConfig {
        uint256 baseRewardPerSecond;   // 基础每秒奖励 (wei)
        uint256 minLockDuration;       // 最短锁定时间（秒）
        uint256 earlyWithdrawFee;      // 提前取回手续费 (basis points, 100 = 1%)
        uint256 totalStaked;           // 总质押数量
        bool emergencyMode;            // 应急模式（仅退 NFT，不发奖励）
    }

    // ============================================
    // 状态变量
    // ============================================

    /// @notice 质押的 NFT 合约地址
    IStakableNFT public immutable stakableNFT;

    /// @notice 奖励代币合约地址
    IERC20 public immutable rewardToken;

    /// @notice 成就触发器合约（可选）
    IAchievementTrigger public achievementTrigger;

    /// @notice 池配置
    PoolConfig public poolConfig;

    /// @notice NFT 合约地址 => tokenId => 质押信息
    mapping(address => mapping(uint256 => StakeInfo)) public stakes;

    /// @notice 用户地址 => 质押的 tokenId 列表
    mapping(address => uint256[]) private userStakedTokens;

    /// @notice 用户地址 => tokenId => 在数组中的索引
    mapping(address => mapping(uint256 => uint256)) private tokenIdToIndex;

    // ============================================
    // 常量
    // ============================================

    /// @notice 合约版本
    string public constant VERSION = "1.0.0";

    /// @notice 最大批量操作数量
    uint256 public constant MAX_BATCH_SIZE = 50;

    /// @notice Basis points 精度（10000 = 100%）
    uint256 public constant BASIS_POINTS = 10000;

    // ============================================
    // 事件
    // ============================================

    event Staked(
        address indexed user,
        address indexed nft,
        uint256 indexed tokenId,
        uint256 multiplier,
        uint256 timestamp
    );

    event Unstaked(
        address indexed user,
        address indexed nft,
        uint256 indexed tokenId,
        uint256 rewards,
        uint256 timestamp
    );

    event RewardsClaimed(
        address indexed user,
        address indexed nft,
        uint256 indexed tokenId,
        uint256 amount
    );

    event BatchStaked(
        address indexed user,
        address indexed nft,
        uint256[] tokenIds,
        uint256 timestamp
    );

    event BatchUnstaked(
        address indexed user,
        address indexed nft,
        uint256[] tokenIds,
        uint256 totalRewards,
        uint256 timestamp
    );

    event EarlyWithdrawFee(
        address indexed user,
        uint256 indexed tokenId,
        uint256 feeAmount
    );

    event PoolConfigUpdated(
        uint256 baseRewardPerSecond,
        uint256 minLockDuration,
        uint256 earlyWithdrawFee
    );

    event EmergencyWithdraw(
        address indexed user,
        address indexed nft,
        uint256 indexed tokenId
    );

    event EmergencyModeEnabled(bool enabled);

    event AchievementTriggerSet(address indexed trigger);

    // ============================================
    // 错误定义
    // ============================================

    error InvalidNFTContract();
    error NotStaked();
    error NotOwner();
    error AlreadyStaked();
    error ExceedsMaxBatchSize();
    error InsufficientRewardBalance();
    error InvalidConfiguration();
    error EmergencyModeActive();

    // ============================================
    // Modifiers
    // ============================================

    /**
     * @notice 检查是否为有效的 NFT 合约
     */
    modifier onlyValidNFT(address nft) {
        if (nft != address(stakableNFT)) {
            revert InvalidNFTContract();
        }
        _;
    }

    /**
     * @notice 检查是否在应急模式
     */
    modifier notInEmergencyMode() {
        if (poolConfig.emergencyMode) {
            revert EmergencyModeActive();
        }
        _;
    }

    // ============================================
    // 构造函数
    // ============================================

    /**
     * @notice 构造函数
     * @param stakableNFT_ 质押 NFT 合约地址
     * @param rewardToken_ 奖励代币合约地址
     * @param baseRewardPerSecond_ 基础每秒奖励
     * @param minLockDuration_ 最短锁定时间（秒）
     * @param earlyWithdrawFee_ 提前取回手续费（basis points）
     */
    constructor(
        address stakableNFT_,
        address rewardToken_,
        uint256 baseRewardPerSecond_,
        uint256 minLockDuration_,
        uint256 earlyWithdrawFee_
    ) Ownable(msg.sender) {
        if (stakableNFT_ == address(0) || rewardToken_ == address(0)) {
            revert InvalidConfiguration();
        }
        if (earlyWithdrawFee_ > BASIS_POINTS) {
            revert InvalidConfiguration();
        }

        stakableNFT = IStakableNFT(stakableNFT_);
        rewardToken = IERC20(rewardToken_);

        poolConfig = PoolConfig({
            baseRewardPerSecond: baseRewardPerSecond_,
            minLockDuration: minLockDuration_,
            earlyWithdrawFee: earlyWithdrawFee_,
            totalStaked: 0,
            emergencyMode: false
        });
    }

    // ============================================
    // 外部函数（质押操作）
    // ============================================

    /**
     * @notice 质押单个 NFT
     * @param nft NFT 合约地址
     * @param tokenId Token ID
     */
    function stake(address nft, uint256 tokenId)
        external
        nonReentrant
        whenNotPaused
        notInEmergencyMode
        onlyValidNFT(nft)
    {
        _stake(msg.sender, nft, tokenId);
    }

    /**
     * @notice 批量质押 NFT
     * @param nft NFT 合约地址
     * @param tokenIds Token ID 数组
     */
    function batchStake(address nft, uint256[] calldata tokenIds)
        external
        nonReentrant
        whenNotPaused
        notInEmergencyMode
        onlyValidNFT(nft)
    {
        uint256 length = tokenIds.length;
        if (length == 0 || length > MAX_BATCH_SIZE) {
            revert ExceedsMaxBatchSize();
        }

        for (uint256 i = 0; i < length; i++) {
            _stake(msg.sender, nft, tokenIds[i]);
        }

        emit BatchStaked(msg.sender, nft, tokenIds, block.timestamp);
    }

    /**
     * @notice 取回 NFT（领取奖励 + 退还 NFT）
     * @param nft NFT 合约地址
     * @param tokenId Token ID
     */
    function unstake(address nft, uint256 tokenId)
        external
        nonReentrant
        onlyValidNFT(nft)
    {
        uint256 rewards = _unstake(msg.sender, nft, tokenId);
        emit Unstaked(msg.sender, nft, tokenId, rewards, block.timestamp);
    }

    /**
     * @notice 批量取回 NFT
     * @param nft NFT 合约地址
     * @param tokenIds Token ID 数组
     */
    function batchUnstake(address nft, uint256[] calldata tokenIds)
        external
        nonReentrant
        onlyValidNFT(nft)
    {
        uint256 length = tokenIds.length;
        if (length == 0 || length > MAX_BATCH_SIZE) {
            revert ExceedsMaxBatchSize();
        }

        uint256 totalRewards = 0;
        for (uint256 i = 0; i < length; i++) {
            totalRewards += _unstake(msg.sender, nft, tokenIds[i]);
        }

        emit BatchUnstaked(msg.sender, nft, tokenIds, totalRewards, block.timestamp);
    }

    /**
     * @notice 领取奖励（不取回 NFT）
     * @param nft NFT 合约地址
     * @param tokenId Token ID
     */
    function claimRewards(address nft, uint256 tokenId)
        external
        nonReentrant
        whenNotPaused
        notInEmergencyMode
        onlyValidNFT(nft)
    {
        uint256 rewards = _claimRewards(msg.sender, nft, tokenId);
        emit RewardsClaimed(msg.sender, nft, tokenId, rewards);
    }

    /**
     * @notice 批量领取奖励
     * @param nft NFT 合约地址
     * @param tokenIds Token ID 数组
     */
    function batchClaimRewards(address nft, uint256[] calldata tokenIds)
        external
        nonReentrant
        whenNotPaused
        notInEmergencyMode
        onlyValidNFT(nft)
    {
        uint256 length = tokenIds.length;
        if (length == 0 || length > MAX_BATCH_SIZE) {
            revert ExceedsMaxBatchSize();
        }

        uint256 totalRewards = 0;
        for (uint256 i = 0; i < length; i++) {
            totalRewards += _claimRewards(msg.sender, nft, tokenIds[i]);
            emit RewardsClaimed(msg.sender, nft, tokenIds[i], totalRewards);
        }

        // 批量转账（节省 gas）
        if (totalRewards > 0) {
            _safeTransferReward(msg.sender, totalRewards);
        }
    }

    /**
     * @notice 应急取回（仅退 NFT，不发奖励）
     * @param nft NFT 合约地址
     * @param tokenId Token ID
     */
    function emergencyWithdraw(address nft, uint256 tokenId)
        external
        nonReentrant
        onlyValidNFT(nft)
    {
        StakeInfo storage info = stakes[nft][tokenId];
        if (info.owner != msg.sender) {
            revert NotOwner();
        }

        // 返还 NFT
        IERC721(nft).safeTransferFrom(address(this), msg.sender, tokenId);

        // 清理状态
        delete stakes[nft][tokenId];
        _removeFromUserStakes(msg.sender, tokenId);
        poolConfig.totalStaked--;

        emit EmergencyWithdraw(msg.sender, nft, tokenId);
    }

    // ============================================
    // 外部函数（查询）
    // ============================================

    /**
     * @notice 计算待领取奖励
     * @param nft NFT 合约地址
     * @param tokenId Token ID
     * @return rewards 待领取奖励数量
     */
    function calculateRewards(address nft, uint256 tokenId)
        external
        view
        returns (uint256 rewards)
    {
        StakeInfo memory info = stakes[nft][tokenId];
        if (info.owner == address(0)) return 0;

        RewardCalculator.CalculationParams memory params = RewardCalculator.CalculationParams({
            baseRewardPerSecond: poolConfig.baseRewardPerSecond,
            stakeDuration: block.timestamp - uint256(info.lastClaimAt),
            rewardMultiplier: uint256(info.rewardMultiplier)
        });

        bool isEarlyWithdraw = info.isLocked && block.timestamp < uint256(info.lockEndTime);
        (rewards, ) = params.calculateFinalReward(isEarlyWithdraw, poolConfig.earlyWithdrawFee);

        return rewards;
    }

    /**
     * @notice 查询用户质押的所有 tokenId
     * @param user 用户地址
     * @return tokenIds Token ID 数组
     */
    function getUserStakes(address user)
        external
        view
        returns (uint256[] memory)
    {
        return userStakedTokens[user];
    }

    /**
     * @notice 查询质押信息
     * @param nft NFT 合约地址
     * @param tokenId Token ID
     * @return info 质押信息
     */
    function getStakeInfo(address nft, uint256 tokenId)
        external
        view
        returns (StakeInfo memory)
    {
        return stakes[nft][tokenId];
    }

    // ============================================
    // 外部函数（Owner Only）
    // ============================================

    /**
     * @notice 设置池配置
     * @param baseRewardPerSecond 基础每秒奖励
     * @param minLockDuration 最短锁定时间
     * @param earlyWithdrawFee 提前取回手续费
     */
    function setPoolConfig(
        uint256 baseRewardPerSecond,
        uint256 minLockDuration,
        uint256 earlyWithdrawFee
    ) external onlyOwner {
        if (earlyWithdrawFee > BASIS_POINTS) {
            revert InvalidConfiguration();
        }

        poolConfig.baseRewardPerSecond = baseRewardPerSecond;
        poolConfig.minLockDuration = minLockDuration;
        poolConfig.earlyWithdrawFee = earlyWithdrawFee;

        emit PoolConfigUpdated(baseRewardPerSecond, minLockDuration, earlyWithdrawFee);
    }

    /**
     * @notice 设置成就触发器
     * @param trigger 触发器合约地址
     */
    function setAchievementTrigger(address trigger) external onlyOwner {
        achievementTrigger = IAchievementTrigger(trigger);
        emit AchievementTriggerSet(trigger);
    }

    /**
     * @notice 启用/禁用应急模式
     * @param enabled 是否启用
     */
    function setEmergencyMode(bool enabled) external onlyOwner {
        poolConfig.emergencyMode = enabled;
        emit EmergencyModeEnabled(enabled);
    }

    /**
     * @notice 暂停合约
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice 恢复合约
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice 提取奖励代币（用于补充奖励池）
     * @param amount 提取数量
     */
    function withdrawRewardTokens(uint256 amount) external onlyOwner {
        rewardToken.safeTransfer(msg.sender, amount);
    }

    // ============================================
    // 内部函数
    // ============================================

    /**
     * @dev 内部质押逻辑
     */
    function _stake(address user, address nft, uint256 tokenId) private {
        // 1. 验证
        if (stakes[nft][tokenId].owner != address(0)) {
            revert AlreadyStaked();
        }

        // 2. 转入 NFT
        IERC721(nft).safeTransferFrom(user, address(this), tokenId);

        // 3. 读取稀有度倍率
        uint256 multiplier = stakableNFT.getRewardMultiplier(tokenId);

        // 4. 记录质押信息（优化：使用 uint128 节省 gas）
        stakes[nft][tokenId] = StakeInfo({
            owner: user,
            rewardMultiplier: uint96(multiplier),
            stakedAt: uint128(block.timestamp),
            lastClaimAt: uint128(block.timestamp),
            lockEndTime: uint128(block.timestamp + poolConfig.minLockDuration),
            isLocked: true
        });

        // 5. 更新用户质押列表
        uint256 index = userStakedTokens[user].length;
        userStakedTokens[user].push(tokenId);
        tokenIdToIndex[user][tokenId] = index;

        // 6. 更新总质押数
        poolConfig.totalStaked++;

        // 7. 触发成就检查
        if (address(achievementTrigger) != address(0)) {
            try achievementTrigger.onStake(user, tokenId) {} catch {}
        }

        emit Staked(user, nft, tokenId, multiplier, block.timestamp);
    }

    /**
     * @dev 内部取回逻辑
     */
    function _unstake(address user, address nft, uint256 tokenId)
        private
        returns (uint256 rewards)
    {
        StakeInfo storage info = stakes[nft][tokenId];
        if (info.owner != user) {
            revert NotOwner();
        }

        // 1. 计算奖励
        RewardCalculator.CalculationParams memory params = RewardCalculator.CalculationParams({
            baseRewardPerSecond: poolConfig.baseRewardPerSecond,
            stakeDuration: block.timestamp - uint256(info.lastClaimAt),
            rewardMultiplier: uint256(info.rewardMultiplier)
        });

        bool isEarlyWithdraw = info.isLocked && block.timestamp < uint256(info.lockEndTime);
        uint256 fee;
        (rewards, fee) = params.calculateFinalReward(isEarlyWithdraw, poolConfig.earlyWithdrawFee);

        if (isEarlyWithdraw && fee > 0) {
            emit EarlyWithdrawFee(user, tokenId, fee);
        }

        // 2. 发放奖励
        if (rewards > 0 && !poolConfig.emergencyMode) {
            _safeTransferReward(user, rewards);
        }

        // 3. 返还 NFT
        IERC721(nft).safeTransferFrom(address(this), user, tokenId);

        // 4. 清理状态
        delete stakes[nft][tokenId];
        _removeFromUserStakes(user, tokenId);
        poolConfig.totalStaked--;

        // 5. 触发成就检查
        if (address(achievementTrigger) != address(0)) {
            try achievementTrigger.onUnstake(user, tokenId) {} catch {}
        }

        return rewards;
    }

    /**
     * @dev 内部领取奖励逻辑
     */
    function _claimRewards(address user, address nft, uint256 tokenId)
        private
        returns (uint256 rewards)
    {
        StakeInfo storage info = stakes[nft][tokenId];
        if (info.owner != user) {
            revert NotOwner();
        }

        // 计算奖励
        RewardCalculator.CalculationParams memory params = RewardCalculator.CalculationParams({
            baseRewardPerSecond: poolConfig.baseRewardPerSecond,
            stakeDuration: block.timestamp - uint256(info.lastClaimAt),
            rewardMultiplier: uint256(info.rewardMultiplier)
        });

        (rewards, ) = params.calculateFinalReward(false, 0);

        // 更新上次领取时间
        info.lastClaimAt = uint128(block.timestamp);

        // 发放奖励
        if (rewards > 0) {
            _safeTransferReward(user, rewards);
        }

        return rewards;
    }

    /**
     * @dev 安全转账奖励代币
     */
    function _safeTransferReward(address to, uint256 amount) private {
        uint256 balance = rewardToken.balanceOf(address(this));
        if (balance < amount) {
            revert InsufficientRewardBalance();
        }
        rewardToken.safeTransfer(to, amount);
    }

    /**
     * @dev 从用户质押列表中移除 tokenId
     */
    function _removeFromUserStakes(address user, uint256 tokenId) private {
        uint256[] storage tokens = userStakedTokens[user];
        uint256 index = tokenIdToIndex[user][tokenId];
        uint256 lastIndex = tokens.length - 1;

        // 如果不是最后一个，用最后一个元素替换
        if (index != lastIndex) {
            uint256 lastTokenId = tokens[lastIndex];
            tokens[index] = lastTokenId;
            tokenIdToIndex[user][lastTokenId] = index;
        }

        // 删除最后一个元素
        tokens.pop();
        delete tokenIdToIndex[user][tokenId];
    }
}
```

**关键设计点**：

1. **状态变量优化**：
   ```solidity
   // StakeInfo 从 6 个 slot 优化为 3 个 slot
   // 节省：~40,000 gas/次写入
   ```

2. **批量操作优化**：
   - 批量质押：减少外部调用
   - 批量领取：合并 token 转账

3. **安全机制**：
   - ReentrancyGuard：防重入
   - Pausable：可暂停
   - 应急模式：防止奖励池耗尽

4. **可扩展性**：
   - 成就触发器接口（可选集成）
   - 配置参数可调整

---

#### 2.1.3 RewardCalculator.sol（库合约）

**功能定位**：奖励计算工具库，提供可复用的纯函数。

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title RewardCalculator
 * @notice 奖励计算工具库
 * @dev 使用 library 模式提供纯函数计算，节省 gas
 */
library RewardCalculator {
    // ============================================
    // 类型定义
    // ============================================

    struct CalculationParams {
        uint256 baseRewardPerSecond;   // 基础每秒奖励
        uint256 stakeDuration;         // 质押时长（秒）
        uint256 rewardMultiplier;      // 稀有度倍率（100 = 1.0x）
    }

    // ============================================
    // 常量
    // ============================================

    uint256 private constant MULTIPLIER_PRECISION = 100;
    uint256 private constant BASIS_POINTS = 10000;

    // ============================================
    // 公共函数
    // ============================================

    /**
     * @notice 计算基础奖励
     * @param params 计算参数
     * @return baseReward 基础奖励
     */
    function calculateBaseReward(CalculationParams memory params)
        internal
        pure
        returns (uint256)
    {
        return params.baseRewardPerSecond * params.stakeDuration;
    }

    /**
     * @notice 应用稀有度倍率
     * @param baseReward 基础奖励
     * @param multiplier 倍率（100 = 1.0x）
     * @return finalReward 应用倍率后的奖励
     */
    function applyMultiplier(uint256 baseReward, uint256 multiplier)
        internal
        pure
        returns (uint256)
    {
        return (baseReward * multiplier) / MULTIPLIER_PRECISION;
    }

    /**
     * @notice 应用手续费扣除
     * @param amount 原始金额
     * @param feeRate 手续费率（basis points）
     * @return netAmount 扣除手续费后的金额
     * @return fee 手续费金额
     */
    function applyFee(uint256 amount, uint256 feeRate)
        internal
        pure
        returns (uint256 netAmount, uint256 fee)
    {
        fee = (amount * feeRate) / BASIS_POINTS;
        netAmount = amount - fee;
        return (netAmount, fee);
    }

    /**
     * @notice 计算最终奖励（完整流程）
     * @param params 计算参数
     * @param isEarlyWithdraw 是否提前取回
     * @param earlyWithdrawFee 提前取回手续费率
     * @return finalReward 最终奖励
     * @return fee 手续费（如果有）
     */
    function calculateFinalReward(
        CalculationParams memory params,
        bool isEarlyWithdraw,
        uint256 earlyWithdrawFee
    ) internal pure returns (uint256 finalReward, uint256 fee) {
        // 1. 计算基础奖励
        uint256 baseReward = calculateBaseReward(params);

        // 2. 应用稀有度倍率
        uint256 rewardWithMultiplier = applyMultiplier(baseReward, params.rewardMultiplier);

        // 3. 如果提前取回，扣除手续费
        if (isEarlyWithdraw) {
            return applyFee(rewardWithMultiplier, earlyWithdrawFee);
        } else {
            return (rewardWithMultiplier, 0);
        }
    }
}
```

---

### 2.2 Phase 2：动态成就系统

（由于篇幅限制，这里提供精简版，完整版可以继续扩展）

#### 2.2.1 AchievementNFT.sol（框架）

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Votes.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AchievementNFT is
    ERC721,
    ERC721Enumerable,
    ERC721Votes,
    EIP712,
    Ownable
{
    // 成就类型枚举
    enum AchievementType {
        FirstStake,
        Whale,
        Diamond,
        Legendary,
        Master
    }

    // 成就结构体
    struct Achievement {
        AchievementType achievementType;
        uint256 level;              // 1-5
        uint256 unlockedAt;
        uint256 votingPower;
    }

    // 状态变量
    mapping(uint256 => Achievement) public achievements;
    mapping(address => mapping(AchievementType => bool)) public hasAchievement;
    mapping(address => bool) public isTrigger;

    uint256 private _tokenIdCounter;
    address public stakingPool;

    // 事件
    event AchievementUnlocked(address indexed user, uint256 indexed tokenId, AchievementType achievementType);
    event AchievementUpgraded(uint256 indexed tokenId, uint256 oldLevel, uint256 newLevel);

    // 构造函数
    constructor(address stakingPool_)
        ERC721("Achievement NFT", "ACHIEVE")
        EIP712("AchievementNFT", "1")
        Ownable(msg.sender)
    {
        stakingPool = stakingPool_;
    }

    // 铸造成就（仅触发器可调用）
    function mint(address to, AchievementType achievementType)
        external
        returns (uint256)
    {
        require(isTrigger[msg.sender], "Not authorized");
        require(!hasAchievement[to][achievementType], "Already has achievement");

        uint256 tokenId = _tokenIdCounter++;
        _safeMint(to, tokenId);

        uint256 votingPower = _getInitialVotingPower(achievementType);
        achievements[tokenId] = Achievement({
            achievementType: achievementType,
            level: 1,
            unlockedAt: block.timestamp,
            votingPower: votingPower
        });

        hasAchievement[to][achievementType] = true;
        emit AchievementUnlocked(to, tokenId, achievementType);

        return tokenId;
    }

    // 动态 tokenURI
    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        _requireOwned(tokenId);
        Achievement memory achievement = achievements[tokenId];

        // TODO: 根据当前质押数据动态生成 URI
        // 需要跨合约调用 stakingPool.getUserStakes(owner)

        return string(abi.encodePacked(
            "https://api.example.com/achievement/",
            _toString(uint256(achievement.achievementType)),
            "/level-",
            _toString(achievement.level)
        ));
    }

    // 重写必需函数（多继承冲突解决）
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

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // 辅助函数
    function _getInitialVotingPower(AchievementType achievementType)
        private
        pure
        returns (uint256)
    {
        if (achievementType == AchievementType.FirstStake) return 10;
        if (achievementType == AchievementType.Whale) return 50;
        if (achievementType == AchievementType.Diamond) return 100;
        if (achievementType == AchievementType.Legendary) return 150;
        return 1000; // Master
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
}
```

---

## 📊 数据流与调用关系

### 3.1 质押流程数据流

```
┌─────────┐
│  User   │
└────┬────┘
     │ 1. 调用 stake(tokenId)
     ▼
┌──────────────────────┐
│  NFTStakingPool      │
├──────────────────────┤
│ 2. 验证权限           │
│ 3. transferFrom      │─────► StakableNFT
│    (NFT → Pool)      │         │
│ 4. 读取稀有度倍率     │◄────────┘
│ 5. 创建 StakeInfo    │
│ 6. 更新用户列表       │
│ 7. 触发成就检查       │
└──────────┬───────────┘
           │ 8. onStake(user, tokenId)
           ▼
     ┌───────────────────┐
     │AchievementTrigger │
     ├───────────────────┤
     │ 9. 更新用户进度    │
     │ 10. 检查成就条件   │
     └───────┬───────────┘
             │ 11. mint(user, achievementType)
             ▼
       ┌───────────────┐
       │AchievementNFT │
       ├───────────────┤
       │ 12. 铸造成就   │
       │ 13. Emit Event│
       └───────────────┘
```

### 3.2 领取奖励流程

```
┌─────────┐
│  User   │
└────┬────┘
     │ 1. 调用 claimRewards(tokenId)
     ▼
┌──────────────────────┐
│  NFTStakingPool      │
├──────────────────────┤
│ 2. 读取 StakeInfo    │
│ 3. 计算质押时长       │
│ 4. 调用 Calculator   │─────► RewardCalculator (library)
│ 5. 计算最终奖励       │         │
│    (含稀有度加成)     │◄────────┘
│ 6. 更新 lastClaimAt  │
│ 7. transfer(reward)  │─────► RewardToken
└──────────────────────┘
```

### 3.3 投票流程

```
┌─────────┐
│  User   │
└────┬────┘
     │ 1. 创建提案
     ▼
┌────────────────────┐
│AchievementGovernor │
├────────────────────┤
│ 2. 检查提案权限     │
│ 3. 读取投票权       │─────► AchievementNFT
│    getVotes()      │         │
└──────────┬─────────┘         │
           │                   │ 4. 枚举用户成就 NFT
           │                   │    balanceOf()
           │                   │    tokenOfOwnerByIndex()
           │                   │
           │◄──────────────────┘ 5. 累加投票权
           │ 6. 记录提案
           │ 7. 进入投票期
           ▼
     [ 等待投票 ]
```

---

## 🔐 安全机制详解

### 4.1 重入攻击防护

**威胁场景**：
```solidity
// 恶意合约尝试在 onERC721Received 中重入
contract MaliciousReceiver is IERC721Receiver {
    function onERC721Received(...) external returns (bytes4) {
        // 尝试重入 unstake
        stakingPool.unstake(nft, tokenId);  // ❌ 会被 ReentrancyGuard 阻止
        return this.onERC721Received.selector;
    }
}
```

**防护措施**：
```solidity
contract NFTStakingPool is ReentrancyGuard {
    function unstake(...) external nonReentrant {  // ← 关键
        // 1. 检查状态
        // 2. 修改状态（CEI 模式）
        // 3. 外部调用（最后执行）
        IERC721(nft).safeTransferFrom(...);
    }
}
```

**原理**：
- `nonReentrant` 修饰符设置锁标志
- 外部调用前状态已修改
- 重入尝试会因锁标志失败

---

### 4.2 整数溢出防护

**Solidity 0.8+ 内置检查**：
```solidity
// 自动溢出检查（无需 SafeMath）
uint256 a = type(uint256).max;
uint256 b = a + 1;  // ❌ 自动 revert: Arithmetic overflow
```

**显式检查（关键计算）**：
```solidity
// 奖励计算使用 checked arithmetic
function calculateRewards(...) public view returns (uint256) {
    // ✅ 乘法顺序优化，避免溢出
    uint256 baseReward = baseRewardPerSecond * duration;
    uint256 finalReward = (baseReward * multiplier) / 100;
    return finalReward;
}
```

---

### 4.3 访问控制

**多层权限模型**：

```solidity
// 1. Owner 权限（最高）
function setPoolConfig(...) external onlyOwner {
    // 只有合约所有者可以调用
}

// 2. Trigger 权限（特定角色）
function mint(...) external {
    require(isTrigger[msg.sender], "Not authorized");
    // 只有授权的触发器可以铸造成就
}

// 3. 用户权限（所有权验证）
function unstake(...) external {
    require(stakes[nft][tokenId].owner == msg.sender, "Not owner");
    // 只有 NFT 质押者本人可以取回
}
```

**权限矩阵**：

| 角色 | setPoolConfig | mint Achievement | stake | unstake | pause |
|------|---------------|------------------|-------|---------|-------|
| Owner | ✅ | ✅ | ✅ | ✅ | ✅ |
| Trigger | ❌ | ✅ | ❌ | ❌ | ❌ |
| User | ❌ | ❌ | ✅ | ✅（自己的）| ❌ |

---

## 💾 存储布局与优化

### 5.1 StakeInfo 结构体优化

**优化前**（6 个 slot）：
```solidity
struct StakeInfo {
    address owner;              // slot 0: 20 bytes
    uint256 stakedAt;          // slot 1: 32 bytes
    uint256 lastClaimAt;       // slot 2: 32 bytes
    uint256 rewardMultiplier;  // slot 3: 32 bytes
    uint256 lockEndTime;       // slot 4: 32 bytes
    bool isLocked;             // slot 5: 1 byte
}
// 总共：6 * 20,000 gas = 120,000 gas（首次写入）
```

**优化后**（3 个 slot）：
```solidity
struct StakeInfo {
    address owner;              // slot 0: 20 bytes ─┐
    uint96 rewardMultiplier;    // slot 0: 12 bytes  ├─ 32 bytes
                                //                   ┘
    uint128 stakedAt;           // slot 1: 16 bytes ─┐
    uint128 lastClaimAt;        // slot 1: 16 bytes  ├─ 32 bytes
                                //                   ┘
    uint128 lockEndTime;        // slot 2: 16 bytes ─┐
    bool isLocked;              // slot 2: 1 byte    │
    // 剩余 15 bytes padding                        ├─ 32 bytes
}                               //                   ┘
// 总共：3 * 20,000 gas = 60,000 gas（首次写入）
// 节省：60,000 gas（50% 优化）
```

**时间范围验证**：
```solidity
// uint128 可表示的最大时间戳
uint128 maxTimestamp = type(uint128).max;
// = 340282366920938463463374607431768211455
// 转换为年份 ≈ 10^31 年
// ✅ 远超实际使用范围（地球寿命 ~50 亿年）
```

---

### 5.2 用户质押列表优化

**使用数组 + 索引映射**：

```solidity
// 数组存储（支持枚举）
mapping(address => uint256[]) private userStakedTokens;

// 索引映射（O(1) 删除）
mapping(address => mapping(uint256 => uint256)) private tokenIdToIndex;

// 删除操作（Swap & Pop）
function _removeFromUserStakes(address user, uint256 tokenId) private {
    uint256[] storage tokens = userStakedTokens[user];
    uint256 index = tokenIdToIndex[user][tokenId];
    uint256 lastIndex = tokens.length - 1;

    if (index != lastIndex) {
        uint256 lastTokenId = tokens[lastIndex];
        tokens[index] = lastTokenId;                  // 用最后一个替换
        tokenIdToIndex[user][lastTokenId] = index;   // 更新索引
    }

    tokens.pop();                                     // 删除最后一个
    delete tokenIdToIndex[user][tokenId];
}
```

**复杂度分析**：
- 添加：O(1)
- 查询：O(1)
- 删除：O(1)（Swap & Pop）
- 枚举：O(n)

---

## 🔄 合约升级策略

### 6.1 不可升级设计（v1.0）

**理由**：
1. **简化实现**：首个版本保持简单，降低复杂度
2. **降低风险**：避免代理合约引入的安全风险
3. **降低成本**：节省代理合约部署 gas

**应对方案**：
```solidity
// 通过迁移实现"升级"
contract NFTStakingPoolV2 {
    NFTStakingPool public immutable oldPool;

    function migrateStake(uint256 tokenId) external {
        // 1. 从旧合约取回
        oldPool.unstake(nft, tokenId);

        // 2. 质押到新合约
        _stake(msg.sender, nft, tokenId);
    }
}
```

---

### 6.2 未来升级方案（v2.0）

如果需要升级功能，可采用 UUPS 模式：

```solidity
// 升级版本
contract NFTStakingPoolUpgradeable is
    Initializable,
    UUPSUpgradeable,
    ERC721HolderUpgradeable,
    ReentrancyGuardUpgradeable,
    OwnableUpgradeable
{
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(...) public initializer {
        __ERC721Holder_init();
        __ReentrancyGuard_init();
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();

        // 初始化状态变量
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}
}
```

---

## 📈 Gas 优化策略

### 7.1 批量操作优化

**单次质押 vs 批量质押**：

```solidity
// 单次质押（重复外部调用）
for (uint256 i = 0; i < 10; i++) {
    stakingPool.stake(nft, tokenIds[i]);  // 每次 ~150k gas
}
// 总 gas：~1,500,000

// 批量质押（一次外部调用）
stakingPool.batchStake(nft, tokenIds);    // ~900k gas
// 总 gas：~900,000
// 节省：40%
```

**优化原因**：
- 减少外部调用（21,000 gas/次）
- 减少事件 emit 次数
- 复用验证逻辑

---

### 7.2 存储读取优化

**缓存存储变量**：

```solidity
// ❌ 未优化（多次 SLOAD）
function calculateRewards(...) external view returns (uint256) {
    uint256 duration = block.timestamp - stakes[nft][tokenId].lastClaimAt;
    uint256 baseReward = poolConfig.baseRewardPerSecond * duration;
    uint256 finalReward = (baseReward * stakes[nft][tokenId].rewardMultiplier) / 100;
    return finalReward;
}
// 3 次 SLOAD：~6000 gas

// ✅ 优化后（缓存到内存）
function calculateRewards(...) external view returns (uint256) {
    StakeInfo memory info = stakes[nft][tokenId];  // 1 次 SLOAD
    uint256 duration = block.timestamp - uint256(info.lastClaimAt);
    uint256 baseReward = poolConfig.baseRewardPerSecond * duration;
    uint256 finalReward = (baseReward * uint256(info.rewardMultiplier)) / 100;
    return finalReward;
}
// 1 次 SLOAD：~2000 gas
// 节省：~4000 gas
```

---

### 7.3 常量 vs 不可变变量

```solidity
// ✅ 使用 immutable（部署时赋值）
IStakableNFT public immutable stakableNFT;  // 直接嵌入字节码
IERC20 public immutable rewardToken;        // 读取 ~100 gas

// ❌ 使用普通状态变量
IStakableNFT public stakableNFT;            // 读取 ~2100 gas
```

---

## 🧪 测试架构

### 8.1 测试金字塔

```
         ┌──────────────┐
         │  E2E 测试     │  ← 10%（完整用户流程）
         ├──────────────┤
         │ 集成测试      │  ← 30%（合约交互）
         ├──────────────┤
         │ 单元测试      │  ← 60%（单个函数）
         └──────────────┘
```

### 8.2 测试用例结构

```typescript
// test/NFTStakingPool.test.ts
describe("NFTStakingPool", function () {
  describe("Deployment", function () {
    it("Should set the correct NFT contract");
    it("Should set the correct reward token");
    it("Should initialize pool config");
  });

  describe("Staking", function () {
    describe("Single Stake", function () {
      it("Should stake NFT successfully");
      it("Should revert if not NFT owner");
      it("Should revert if already staked");
      it("Should emit Staked event");
    });

    describe("Batch Stake", function () {
      it("Should batch stake multiple NFTs");
      it("Should revert if exceeds max batch size");
    });
  });

  describe("Rewards", function () {
    it("Should calculate rewards correctly");
    it("Should apply rarity multiplier");
    it("Should apply early withdraw fee");
  });

  describe("Unstaking", function () {
    it("Should unstake and claim rewards");
    it("Should return NFT to owner");
    it("Should clear stake info");
  });

  describe("Emergency", function () {
    it("Should emergency withdraw without rewards");
    it("Should work when contract is paused");
  });

  describe("Gas Optimization", function () {
    it("Should use less gas for batch operations");
  });
});
```

---

## 📚 接口与 ABI

### 9.1 核心接口定义

```solidity
// IStakableNFT.sol
interface IStakableNFT {
    function getRarity(uint256 tokenId) external view returns (Rarity);
    function getRewardMultiplier(uint256 tokenId) external view returns (uint256);
}

// INFTStakingPool.sol
interface INFTStakingPool {
    function stake(address nft, uint256 tokenId) external;
    function unstake(address nft, uint256 tokenId) external;
    function calculateRewards(address nft, uint256 tokenId) external view returns (uint256);
    function getUserStakes(address user) external view returns (uint256[] memory);
}

// IAchievementTrigger.sol
interface IAchievementTrigger {
    function onStake(address user, uint256 tokenId) external;
    function onUnstake(address user, uint256 tokenId) external;
}

// IAchievementNFT.sol
interface IAchievementNFT {
    function mint(address to, AchievementType achievementType) external returns (uint256);
    function getVotingPower(address user) external view returns (uint256);
}
```

---

## 🚀 部署流程

### 10.1 部署脚本

```typescript
// scripts/deploy.ts
import hre from "hardhat";

async function main() {
  const [deployer] = await hre.viem.getWalletClients();
  console.log("Deploying with:", deployer.account.address);

  // 1. 部署 RewardToken（如果需要）
  const rewardToken = await hre.viem.deployContract("RewardToken", [
    "Reward Token",
    "REWARD",
    hre.ethers.parseEther("1000000") // 100万初始供应
  ]);
  console.log("RewardToken deployed:", rewardToken.address);

  // 2. 部署 StakableNFT
  const stakableNFT = await hre.viem.deployContract("StakableNFT", [
    "Stakable NFT",
    "SNFT",
    "https://api.example.com/nft/"
  ]);
  console.log("StakableNFT deployed:", stakableNFT.address);

  // 3. 部署 NFTStakingPool
  const stakingPool = await hre.viem.deployContract("NFTStakingPool", [
    stakableNFT.address,
    rewardToken.address,
    hre.ethers.parseEther("100") / 86400n, // 100 token/天 → per second
    7 * 24 * 60 * 60, // 7天锁定期
    500 // 5% 手续费
  ]);
  console.log("NFTStakingPool deployed:", stakingPool.address);

  // 4. 转移奖励代币到质押池
  await rewardToken.write.transfer([
    stakingPool.address,
    hre.ethers.parseEther("500000")
  ]);

  // 5. 部署 AchievementNFT
  const achievementNFT = await hre.viem.deployContract("AchievementNFT", [
    stakingPool.address
  ]);
  console.log("AchievementNFT deployed:", achievementNFT.address);

  // 6. 部署 AchievementTrigger
  const achievementTrigger = await hre.viem.deployContract("AchievementTrigger", [
    stakingPool.address,
    achievementNFT.address
  ]);
  console.log("AchievementTrigger deployed:", achievementTrigger.address);

  // 7. 配置权限
  await stakingPool.write.setAchievementTrigger([achievementTrigger.address]);
  await achievementNFT.write.setTrigger([achievementTrigger.address, true]);

  console.log("\n=== Deployment Complete ===");
  console.log({
    rewardToken: rewardToken.address,
    stakableNFT: stakableNFT.address,
    stakingPool: stakingPool.address,
    achievementNFT: achievementNFT.address,
    achievementTrigger: achievementTrigger.address
  });
}

main().catch(console.error);
```

---

## 📋 技术债务与未来优化

### 11.1 已知限制

1. **不可升级**：v1.0 不支持合约升级
2. **单一 NFT 支持**：只支持一个 NFT 合约质押
3. **链上元数据生成**：成就 NFT 元数据需要跨合约调用（gas 较高）

### 11.2 未来优化方向

1. **多 NFT 支持**：支持白名单内的多个 NFT 合约
2. **链下元数据**：使用 Chainlink Functions 生成元数据
3. **动态奖励池**：根据总质押量自动调整奖励速率
4. **质押衍生品**：铸造 stNFT 作为流动性凭证

---

## ✅ 检查清单

### 开发前
- [ ] 审阅需求文档
- [ ] 审阅架构文档
- [ ] 确认技术栈版本
- [ ] 配置开发环境

### 开发中
- [ ] 遵循 Solidity 风格指南
- [ ] 使用 NatSpec 注释
- [ ] 每完成一个合约立即编写测试
- [ ] 定期运行 Gas Reporter

### 开发后
- [ ] 测试覆盖率 > 95%
- [ ] 通过 Slither 静态分析
- [ ] Code Review
- [ ] 部署到测试网验证

---

**文档版本**：v1.0
**最后更新**：2025-10-27
**状态**：待开发

---

**附录 A：缩写表**

| 缩写 | 全称 |
|------|------|
| NFT | Non-Fungible Token |
| DAO | Decentralized Autonomous Organization |
| CEI | Checks-Effects-Interactions |
| SLOAD | Storage Load (EVM opcode) |
| SSTORE | Storage Store (EVM opcode) |
| UUPS | Universal Upgradeable Proxy Standard |
| EIP | Ethereum Improvement Proposal |

**附录 B：参考资源**

- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/5.x/)
- [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html)
- [Ethereum Gas Costs](https://github.com/wolflo/evm-opcodes)
- [Smart Contract Security Best Practices](https://consensys.github.io/smart-contract-best-practices/)
