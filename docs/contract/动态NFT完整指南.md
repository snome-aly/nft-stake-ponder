# 动态NFT (dNFT) 完整指南

> 本文档详细介绍动态NFT的概念、实现方式、应用场景和最佳实践。

## 📚 目录

- [什么是动态NFT](#什么是动态nft)
- [动态NFT vs 静态NFT](#动态nft-vs-静态nft)
- [实现方式对比](#实现方式对比)
- [应用场景](#应用场景)
- [技术实现](#技术实现)
- [真实案例分析](#真实案例分析)
- [最佳实践](#最佳实践)

---

## 什么是动态NFT

### 定义

**动态NFT (Dynamic NFT / dNFT)** 是指其metadata或属性可以根据特定条件**改变**的NFT。

```
静态NFT:  Metadata永不改变 ❌
动态NFT:  Metadata可以变化 ✅
```

### 核心特征

**可变性** - NFT的属性会随着时间、事件、行为等因素变化

```solidity
// 静态NFT
tokenURI(1) → "ipfs://QmABC.../1.json"  // 永远返回相同内容

// 动态NFT
tokenURI(1) at T0 → {"level": 1, "exp": 0}
tokenURI(1) at T1 → {"level": 5, "exp": 2500}  // 内容变化
```

### 为什么需要动态NFT？

| 场景 | 静态NFT的问题 | 动态NFT的解决方案 |
|------|--------------|------------------|
| **游戏角色** | 无法升级、无法装备 | 随玩家游戏进度升级 |
| **盲盒揭示** | 无法从未揭示→已揭示 | 揭示后改变metadata |
| **成就系统** | 无法记录成就 | 达成成就后更新属性 |
| **时间驱动** | 无法随时间变化 | 植物成长、角色老化 |
| **外部数据** | 无法反映现实数据 | 体育数据、天气等 |

---

## 动态NFT vs 静态NFT

### 静态NFT

**代表项目**：
- Bored Ape Yacht Club (BAYC)
- CryptoPunks
- Azuki
- 大部分PFP (Profile Picture) 项目

**特点**：
```json
// Metadata永远不变
{
  "name": "Bored Ape #1234",
  "image": "ipfs://QmXxx.../1234.png",
  "attributes": [
    {"trait_type": "Background", "value": "Orange"},
    {"trait_type": "Fur", "value": "Robot"}
  ]
}
```

**优势**：
- ✅ 简单可靠
- ✅ 完全去中心化（IPFS）
- ✅ 永久不变（收藏品特性）

**劣势**：
- ❌ 无法互动
- ❌ 无法升级
- ❌ 缺乏游戏性

### 动态NFT

**代表项目**：
- Aavegotchi（游戏NFT）
- LaMelo Ball NFTs（体育数据驱动）
- Async Art（时间变化艺术）
- Chainlink动态NFT示例

**特点**：
```solidity
// Metadata随条件变化
function tokenURI(uint256 tokenId) public view returns (string memory) {
    uint256 level = getLevel(tokenId);  // 读取当前等级

    if (level >= 50) {
        return generateLegendaryMetadata(tokenId);
    } else {
        return generateCommonMetadata(tokenId);
    }
}
```

**优势**：
- ✅ 高互动性
- ✅ 游戏化体验
- ✅ 实时反映状态

**劣势**：
- ⚠️ 实现复杂
- ⚠️ 可能依赖外部服务
- ⚠️ Gas成本较高

---

## 实现方式对比

### 架构图

```
                    ┌─────────────────────────┐
                    │     动态NFT (dNFT)      │
                    │   (Metadata会变化)      │
                    └───────────┬─────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
       ┌────────▼────────┐ ┌───▼────────┐ ┌────▼──────────┐
       │  链上动态生成    │ │ 链上更新   │ │ Automation    │
       │  (实时计算)     │ │ (写入状态) │ │  (自动执行)   │
       └─────────────────┘ └────────────┘ └───────────────┘
```

### 1. 链上动态生成（推荐）⭐⭐⭐⭐⭐

**原理**：每次调用`tokenURI()`都重新计算metadata

```solidity
contract DynamicNFT is ERC721 {
    mapping(uint256 => uint256) public experience;
    mapping(uint256 => uint256) public level;

    // 每次调用都实时计算
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        uint256 currentLevel = level[tokenId];
        uint256 currentExp = experience[tokenId];

        // 动态生成metadata
        return string(abi.encodePacked(
            'data:application/json;base64,',
            Base64.encode(bytes(abi.encodePacked(
                '{"name":"Character #', tokenId.toString(), '",',
                '"attributes":[',
                '{"trait_type":"Level","value":', currentLevel.toString(), '},',
                '{"trait_type":"Experience","value":', currentExp.toString(), '}',
                ']}'
            )))
        ));
    }

    // 玩家游戏时更新状态
    function gainExp(uint256 tokenId, uint256 amount) public {
        experience[tokenId] += amount;

        // 自动升级
        if (experience[tokenId] >= 100) {
            level[tokenId]++;
            experience[tokenId] = 0;
        }

        // tokenURI()下次调用时自动反映新数据
    }
}
```

**特点**：
- ✅ 完全去中心化
- ✅ 自动反映最新状态
- ✅ 不需要手动"更新"metadata
- ⚠️ 依赖链上数据
- ⚠️ 生成逻辑固定

**适用场景**：
- 游戏NFT（等级、经验值）
- 盲盒揭示
- 实时状态显示（质押、锁定）

---

### 2. 链上更新状态

**原理**：主动调用函数修改状态，切换metadata

```solidity
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract EvolvableNFT is ERC721URIStorage {
    mapping(uint256 => uint256) public evolutionStage;

    // 初始mint
    function mint(uint256 tokenId) public {
        _mint(msg.sender, tokenId);
        _setTokenURI(tokenId, "ipfs://QmStage1.../metadata.json");
        evolutionStage[tokenId] = 1;
    }

    // 主动调用进化
    function evolve(uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender);
        require(canEvolve(tokenId), "Not ready to evolve");

        evolutionStage[tokenId]++;

        // 切换到新的IPFS metadata
        if (evolutionStage[tokenId] == 2) {
            _setTokenURI(tokenId, "ipfs://QmStage2.../metadata.json");
        } else if (evolutionStage[tokenId] == 3) {
            _setTokenURI(tokenId, "ipfs://QmStage3.../metadata.json");
        }

        emit Evolved(tokenId, evolutionStage[tokenId]);
    }

    function canEvolve(uint256 tokenId) public view returns (bool) {
        // 检查进化条件（如持有时间、达成成就等）
        return block.timestamp - mintTime[tokenId] > 30 days;
    }
}
```

**特点**：
- ✅ Metadata可以变化
- ✅ 可以指向不同IPFS文件
- ⚠️ 需要用户主动调用
- ⚠️ 消耗gas（写入操作）
- ⚠️ IPFS文件本身不变

**适用场景**：
- 进化系统（宝可梦式）
- 阶段性升级
- 一次性揭示

---

### 3. Chainlink Automation（自动化）

**原理**：Chainlink节点自动检查条件并触发更新

```solidity
import "@chainlink/contracts/src/v0.8/AutomationCompatible.sol";

contract AutoUpdateNFT is ERC721, AutomationCompatibleInterface {
    uint256 public lastUpdateTime;
    uint256 public interval = 24 hours;

    mapping(uint256 => string) public currentWeather;

    // Chainlink节点调用（链下，免费）
    function checkUpkeep(bytes calldata)
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory)
    {
        upkeepNeeded = (block.timestamp - lastUpdateTime) > interval;
    }

    // Chainlink节点调用（链上，消耗LINK）
    function performUpkeep(bytes calldata) external override {
        if ((block.timestamp - lastUpdateTime) > interval) {
            lastUpdateTime = block.timestamp;

            // 自动更新所有NFT的属性
            updateAllNFTs();
        }
    }

    function updateAllNFTs() private {
        // 获取新数据（如天气、价格等）
        string memory newWeather = fetchWeatherData();

        for (uint256 i = 1; i <= totalSupply(); i++) {
            currentWeather[i] = newWeather;
        }
    }
}
```

**特点**：
- ✅ 完全自动化
- ✅ 去中心化
- ✅ 可定时或条件触发
- ⚠️ 需要LINK代币费用
- ⚠️ 实现复杂度高

**适用场景**：
- 定时更新（每日刷新）
- 外部数据驱动（天气、体育）
- 自动恢复体力

---

### 4. 混合方案（最佳实践）⭐⭐⭐⭐⭐

**架构**：图片在IPFS + Metadata链上生成

```solidity
contract HybridNFT is ERC721 {
    // 图片存在IPFS（永久不变）
    mapping(Rarity => string) public rarityImages;

    // 状态存在链上（可变）
    mapping(uint256 => bool) public revealed;
    mapping(uint256 => Rarity) public tokenRarity;
    mapping(uint256 => bool) public isStaked;

    constructor() {
        rarityImages[Rarity.Common] = "ipfs://QmCommon.../common.png";
        rarityImages[Rarity.Rare] = "ipfs://QmRare.../rare.png";
        // ...
    }

    // Metadata链上动态生成
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        // 根据链上状态生成metadata
        string memory image = rarityImages[tokenRarity[tokenId]];
        string memory stakingStatus = isStaked[tokenId] ? "Staking" : "Not Staking";

        return generateMetadata(tokenId, image, stakingStatus);
    }
}
```

**优势**：
- ✅ 图片永久存储（IPFS）
- ✅ Metadata实时更新（链上）
- ✅ 完全去中心化
- ✅ 成本优化

---

### 对比表

| 方案 | 去中心化 | 实时性 | Gas成本 | 复杂度 | 推荐度 |
|------|----------|--------|---------|--------|--------|
| **链上动态生成** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 低（读取） | 中 | ⭐⭐⭐⭐⭐ |
| **链上更新状态** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 高（写入） | 低 | ⭐⭐⭐ |
| **Chainlink Automation** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 中（LINK） | 高 | ⭐⭐⭐⭐ |
| **中心化服务器** | ⭐ | ⭐⭐⭐⭐⭐ | 低 | 低 | ❌ |
| **混合方案** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 低 | 中 | ⭐⭐⭐⭐⭐ |

---

## 应用场景

### 1. 游戏NFT（玩家行为驱动）

#### 角色升级系统

```solidity
contract GameCharacterNFT is ERC721 {
    struct Character {
        uint256 level;
        uint256 exp;
        uint256 strength;
        uint256 intelligence;
        string class;
    }

    mapping(uint256 => Character) public characters;

    // 战斗获得经验
    function battle(uint256 tokenId, uint256 enemyId) public {
        require(ownerOf(tokenId) == msg.sender);

        // 战斗逻辑...
        uint256 expGained = calculateExpGain(tokenId, enemyId);

        characters[tokenId].exp += expGained;

        // 自动升级
        if (characters[tokenId].exp >= 100) {
            levelUp(tokenId);
        }
    }

    function levelUp(uint256 tokenId) private {
        characters[tokenId].level++;
        characters[tokenId].exp = 0;
        characters[tokenId].strength += 5;
        characters[tokenId].intelligence += 3;

        // tokenURI会自动反映新属性
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        Character memory char = characters[tokenId];

        // 根据等级返回不同稀有度
        string memory rarity = char.level >= 50 ? "Legendary" : "Common";

        return generateMetadata(tokenId, char, rarity);
    }
}
```

**真实案例**：
- **Axie Infinity** - 战斗升级
- **CryptoUnicorns** - 游戏进度改变NFT
- **Aavegotchi** - 质押和互动影响属性

---

### 2. 时间驱动（自动演化）

#### 植物成长系统

```solidity
contract GrowingPlantNFT is ERC721 {
    mapping(uint256 => uint256) public plantedTime;

    function mint(uint256 tokenId) public {
        _mint(msg.sender, tokenId);
        plantedTime[tokenId] = block.timestamp;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        uint256 age = block.timestamp - plantedTime[tokenId];

        string memory stage;
        string memory image;

        if (age < 7 days) {
            stage = "Seed";
            image = "ipfs://Qm.../seed.png";
        } else if (age < 30 days) {
            stage = "Sprout";
            image = "ipfs://Qm.../sprout.png";
        } else if (age < 90 days) {
            stage = "Young Tree";
            image = "ipfs://Qm.../young-tree.png";
        } else {
            stage = "Mature Tree";
            image = "ipfs://Qm.../mature-tree.png";
        }

        return generateMetadata(tokenId, stage, image, age);
    }

    function getStage(uint256 tokenId) public view returns (string memory) {
        uint256 age = block.timestamp - plantedTime[tokenId];

        if (age < 7 days) return "Seed";
        if (age < 30 days) return "Sprout";
        if (age < 90 days) return "Young Tree";
        return "Mature Tree";
    }
}
```

**真实案例**：
- **Async Art** - 艺术品随时间变化
- **Life NFT** - 根据区块高度改变

---

### 3. 外部数据驱动（预言机）

#### 体育数据NFT

```solidity
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract SportsNFT is ERC721, AutomationCompatibleInterface {
    mapping(uint256 => uint256) public playerScore;  // 球员ID -> 本赛季得分
    mapping(uint256 => string) public playerTier;

    AggregatorV3Interface internal scoreFeed;

    // Chainlink Automation每周更新
    function checkUpkeep(bytes calldata)
        external
        view
        override
        returns (bool, bytes memory)
    {
        return ((block.timestamp - lastUpdateTime) > 7 days, bytes(""));
    }

    function performUpkeep(bytes calldata) external override {
        if ((block.timestamp - lastUpdateTime) > 7 days) {
            lastUpdateTime = block.timestamp;

            // 从Chainlink预言机获取球员数据
            updateAllPlayerStats();
        }
    }

    function updateAllPlayerStats() private {
        for (uint256 i = 1; i <= totalSupply(); i++) {
            // 获取球员真实得分数据
            uint256 newScore = fetchPlayerScore(i);
            playerScore[i] = newScore;

            // 根据得分更新等级
            if (newScore > 30) {
                playerTier[i] = "MVP";
            } else if (newScore > 20) {
                playerTier[i] = "All-Star";
            } else {
                playerTier[i] = "Regular";
            }
        }
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        uint256 score = playerScore[tokenId];
        string memory tier = playerTier[tokenId];

        // 根据表现返回不同metadata
        return generateMetadata(tokenId, score, tier);
    }
}
```

**真实案例**：
- **LaMelo Ball NFTs** - NBA球员数据驱动
- **Sorare** - 足球球员卡牌

---

### 4. 社交/成就驱动

#### HODLer徽章系统

```solidity
contract LoyaltyBadgeNFT is ERC721 {
    mapping(uint256 => uint256) public firstOwnedTime;
    mapping(uint256 => address) public originalOwner;

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override {
        if (from != address(0)) {  // 非mint
            // 记录首次持有时间
            if (firstOwnedTime[tokenId] == 0) {
                firstOwnedTime[tokenId] = block.timestamp;
                originalOwner[tokenId] = from;
            }
        }

        super._beforeTokenTransfer(from, to, tokenId);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        address owner = ownerOf(tokenId);
        uint256 heldDuration = block.timestamp - firstOwnedTime[tokenId];

        string memory badge;
        string memory image;

        // 原始持有者获得特殊徽章
        if (owner == originalOwner[tokenId]) {
            if (heldDuration > 365 days) {
                badge = "Diamond Hands 💎";
                image = "ipfs://Qm.../diamond.png";
            } else if (heldDuration > 180 days) {
                badge = "Gold Hands 🏆";
                image = "ipfs://Qm.../gold.png";
            } else if (heldDuration > 30 days) {
                badge = "HODLer 🤝";
                image = "ipfs://Qm.../hodler.png";
            } else {
                badge = "Newcomer 👋";
                image = "ipfs://Qm.../newcomer.png";
            }
        } else {
            badge = "Trader 📊";
            image = "ipfs://Qm.../trader.png";
        }

        return generateMetadata(tokenId, badge, image, heldDuration);
    }
}
```

---

### 5. 盲盒揭示（你的项目）

```solidity
contract StakableNFT is ERC721, VRFConsumerBaseV2 {
    mapping(uint256 => bool) public revealed;
    mapping(uint256 => Rarity) public tokenRarity;

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (!revealed[tokenId]) {
            // 未揭示 - 盲盒
            return generateUnrevealedMetadata(tokenId);
        }

        // 已揭示 - 显示稀有度
        Rarity rarity = tokenRarity[tokenId];
        return generateRevealedMetadata(tokenId, rarity);
    }

    // 用户触发揭示
    function reveal(uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender);
        require(!revealed[tokenId]);

        // 请求Chainlink VRF随机数
        requestRandomWords();
    }

    // VRF回调
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords)
        internal
        override
    {
        uint256 tokenId = requestIdToTokenId[requestId];

        // 使用随机数确定稀有度
        revealed[tokenId] = true;
        tokenRarity[tokenId] = determineRarity(randomWords[0]);

        // tokenURI自动变化
    }
}
```

---

## 真实案例分析

### 1. Loot（完全链上）

```solidity
// Loot: metadata和图片都在链上生成
contract Loot is ERC721 {
    function tokenURI(uint256 tokenId) public pure override returns (string memory) {
        // 完全链上生成SVG和metadata
        string[8] memory parts;
        parts[0] = getWeapon(tokenId);
        parts[1] = getChest(tokenId);
        // ...

        string memory output = string(abi.encodePacked(parts[0], parts[1], ...));

        return string(abi.encodePacked(
            'data:application/json;base64,',
            Base64.encode(bytes(abi.encodePacked(
                '{"name":"Bag #', toString(tokenId), '",',
                '"image":"data:image/svg+xml;base64,', Base64.encode(bytes(output)), '"}'
            )))
        ));
    }

    function getWeapon(uint256 tokenId) internal pure returns (string memory) {
        // 基于tokenId生成确定性随机武器
        uint256 rand = random(string(abi.encodePacked("WEAPON", toString(tokenId))));

        string[18] memory weapons = [
            "Warhammer", "Quarterstaff", "Maul",
            // ...
        ];

        return weapons[rand % weapons.length];
    }
}
```

**特点**：
- ✅ 100%链上（无IPFS依赖）
- ✅ 永久存在
- ⚠️ Gas成本高

---

### 2. Aavegotchi（游戏驱动）

```solidity
// 简化版Aavegotchi概念
contract Aavegotchi is ERC721 {
    struct Gotchi {
        uint256 stakedAmount;  // 质押的AAVE数量
        uint256 kinship;       // 互动度
        uint256 experience;
        uint256 lastInteraction;
    }

    mapping(uint256 => Gotchi) public gotchis;

    // 质押影响稀有度
    function stake(uint256 tokenId, uint256 amount) public {
        gotchis[tokenId].stakedAmount += amount;
        // 质押越多，稀有度越高
    }

    // 互动增加kinship
    function interact(uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender);

        gotchis[tokenId].kinship += 1;
        gotchis[tokenId].lastInteraction = block.timestamp;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        Gotchi memory gotchi = gotchis[tokenId];

        // 根据质押金额和kinship计算稀有度
        uint256 rarityScore = calculateRarityScore(gotchi);

        return generateMetadata(tokenId, gotchi, rarityScore);
    }
}
```

**特点**：
- ✅ 高互动性
- ✅ DeFi + NFT结合
- ✅ 玩家行为直接影响NFT价值

---

### 3. LaMelo Ball NFTs（外部数据）

**工作流程**：

```
1. 部署NFT合约（记录球员ID）
   ↓
2. 注册Chainlink Automation
   - 每周检查球员数据
   ↓
3. Chainlink节点定期调用
   - checkUpkeep() → 检查是否需要更新
   - performUpkeep() → 从Sports Data API获取数据
   ↓
4. 更新链上状态
   - 球员得分、助攻、篮板等
   ↓
5. NFT自动进化
   - 达成成就：三双、50分等
   - metadata自动更新
   ↓
6. 用户看到最新NFT
   - OpenSea自动刷新
```

---

## 最佳实践

### ✅ 推荐做法

#### 1. 使用混合架构
```
图片 → IPFS（永久）
Metadata → 链上生成（可变）
```

#### 2. 优化Gas成本
```solidity
// ❌ 昂贵：在performUpkeep中遍历所有token
function performUpkeep(bytes calldata) external override {
    for (uint i = 1; i <= 10000; i++) {
        update(i);  // 太贵了
    }
}

// ✅ 优化：批量处理
uint256 public lastProcessedIndex;
uint256 public constant BATCH_SIZE = 50;

function performUpkeep(bytes calldata) external override {
    uint256 endIndex = min(lastProcessedIndex + BATCH_SIZE, totalSupply());

    for (uint i = lastProcessedIndex; i < endIndex; i++) {
        update(i);
    }

    lastProcessedIndex = endIndex % totalSupply();
}
```

#### 3. 提供状态查询函数
```solidity
// 方便前端查询NFT当前状态
function getNFTStatus(uint256 tokenId) public view returns (
    uint256 level,
    uint256 exp,
    string memory rarity,
    bool isStaked
) {
    level = levels[tokenId];
    exp = experience[tokenId];
    rarity = getRarityString(tokenRarity[tokenId]);
    isStaked = stakedTokens[tokenId];
}
```

#### 4. 触发metadata刷新事件
```solidity
// ERC4906: Metadata Update Extension
event MetadataUpdate(uint256 _tokenId);
event BatchMetadataUpdate(uint256 _fromTokenId, uint256 _toTokenId);

function reveal(uint256 tokenId) public {
    // ... 揭示逻辑

    // 通知市场刷新metadata
    emit MetadataUpdate(tokenId);
}
```

### ❌ 避免做法

1. **不要过度依赖中心化服务**
   ```solidity
   // ❌ 不推荐
   function tokenURI(uint256 tokenId) public view returns (string memory) {
       return string(abi.encodePacked("https://api.myserver.com/nft/", tokenId));
   }
   ```

2. **不要在链上存储大量数据**
   ```solidity
   // ❌ 太贵
   mapping(uint256 => string) public fullMetadataJSON;

   // ✅ 只存储必要数据
   mapping(uint256 => uint256) public level;
   mapping(uint256 => Rarity) public rarity;
   ```

3. **不要频繁更新导致高Gas费**
   ```solidity
   // ❌ 每次攻击都写入
   function attack() public {
       attackCount[tokenId]++;  // 每次都写入，太贵
   }

   // ✅ 批量结算
   function claimRewards() public {
       // 一次性结算所有攻击奖励
   }
   ```

---

## 实现检查清单

在实现动态NFT时，确保：

- [ ] **选择合适的动态方式**
  - [ ] 链上动态生成
  - [ ] 链上更新状态
  - [ ] Chainlink Automation
  - [ ] 混合方案

- [ ] **数据存储**
  - [ ] 图片存储在IPFS
  - [ ] 状态数据存储在链上
  - [ ] 实现`tokenURI()`函数

- [ ] **Gas优化**
  - [ ] 批量处理
  - [ ] 避免不必要的存储
  - [ ] 使用view函数读取

- [ ] **用户体验**
  - [ ] 提供状态查询函数
  - [ ] 触发MetadataUpdate事件
  - [ ] 前端实时刷新

- [ ] **测试**
  - [ ] 测试metadata生成逻辑
  - [ ] 测试状态变化
  - [ ] 测试OpenSea显示

---

## 相关资源

- [ERC721标准](https://eips.ethereum.org/EIPS/eip-721)
- [ERC4906: Metadata Update Extension](https://eips.ethereum.org/EIPS/eip-4906)
- [Chainlink Automation文档](https://docs.chain.link/chainlink-automation)
- [OpenSea Metadata标准](https://docs.opensea.io/docs/metadata-standards)
- [Loot源码](https://etherscan.io/address/0xff9c1b15b16263c61d017ee9f65c50e4ae0113d7#code)
- [Aavegotchi文档](https://docs.aavegotchi.com/)

---

**创建日期**: 2025-11-02
**最后更新**: 2025-11-02
