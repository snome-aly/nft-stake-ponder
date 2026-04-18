# Chainlink Automation 详解

> 本文档详细介绍Chainlink Automation（原Chainlink Keepers）的工作原理、使用方法和最佳实践。

## 📚 目录

- [核心概念](#核心概念)
- [工作原理](#工作原理)
- [核心机制](#核心机制)
- [代码示例](#代码示例)
- [使用流程](#使用流程)
- [费用机制](#费用机制)
- [与其他方案对比](#与其他方案对比)
- [真实应用案例](#真实应用案例)

---

## 核心概念

### 什么是 Chainlink Automation？

**Chainlink Automation** (原名Chainlink Keepers) 是一个去中心化的**自动化执行服务**，可以让智能合约在特定条件下自动触发函数调用。

### 解决的问题

智能合约的根本限制：

```
问题：智能合约是"被动的"
- 合约不能自己运行
- 必须有人/交易触发才能执行
- 没有"定时任务"或"自动检查"机制

例子：
❌ 合约无法每天自动执行
❌ 合约无法在某个条件满足时自动触发
❌ 合约无法主动监控链上数据
```

### Chainlink Automation的解决方案

```
Chainlink Automation = 去中心化的"定时任务调度器"

就像Linux的cron job，但是：
✓ 去中心化（不依赖单个服务器）
✓ 可靠（多个节点竞争执行）
✓ 链上验证（条件检查透明）
```

---

## 工作原理

### 完整流程图

```
┌──────────────────────────────────────────────────────┐
│  1. 注册 Upkeep（你的智能合约）                        │
│     - 定义检查条件                                     │
│     - 存入LINK代币作为gas费                            │
└────────────────┬─────────────────────────────────────┘
                 │
┌────────────────▼─────────────────────────────────────┐
│  2. Chainlink节点网络持续监控                          │
│     - 多个去中心化节点                                 │
│     - 定期调用 checkUpkeep()                          │
│     - 链下模拟执行（不消耗gas）                        │
└────────────────┬─────────────────────────────────────┘
                 │
         ┌───────▼────────┐
         │ 检查条件是否满足 │
         └───┬────────┬───┘
             │        │
         条件=false  条件=true
             │        │
             ▼        ▼
          等待继续  ┌─────────────────────────────────┐
          监控      │ 3. 节点竞争提交交易              │
                    │    - 调用 performUpkeep()       │
                    │    - 第一个成功的节点获得奖励    │
                    └────────────┬────────────────────┘
                                 │
                    ┌────────────▼────────────────────┐
                    │ 4. 你的合约函数执行              │
                    │    - 更新NFT状态                 │
                    │    - 触发事件                    │
                    │    - LINK代币支付gas费           │
                    └──────────────────────────────────┘
```

---

## 核心机制

### 1. 双函数模式

每个使用Automation的合约必须实现两个函数：

```solidity
import "@chainlink/contracts/src/v0.8/AutomationCompatible.sol";

contract MyDynamicNFT is AutomationCompatibleInterface {

    // ===== 函数1: checkUpkeep =====
    // 作用：检查是否需要执行
    // 调用者：Chainlink节点（链下模拟）
    // Gas费：不消耗（链下执行）
    // 频率：节点持续轮询（几秒一次）

    function checkUpkeep(bytes calldata checkData)
        external
        view  // ← 重点：view函数，不修改状态，链下执行
        override
        returns (
            bool upkeepNeeded,  // 是否需要执行
            bytes memory performData  // 传递给performUpkeep的数据
        )
    {
        // 示例1：时间条件
        upkeepNeeded = (block.timestamp - lastUpdateTime) > interval;

        // 示例2：状态条件
        // upkeepNeeded = someValue > threshold;

        // 示例3：复杂逻辑
        // upkeepNeeded = checkComplexConditions();

        performData = checkData;  // 可以传递额外数据
    }


    // ===== 函数2: performUpkeep =====
    // 作用：实际执行逻辑
    // 调用者：Chainlink节点（链上交易）
    // Gas费：消耗（从LINK余额扣除）
    // 频率：只在checkUpkeep返回true时执行

    function performUpkeep(bytes calldata performData)
        external
        override
    {
        // 重新验证条件（防止抢跑）
        if ((block.timestamp - lastUpdateTime) > interval) {
            lastUpdateTime = block.timestamp;

            // 执行实际逻辑
            updateNFTMetadata();

            emit UpkeepPerformed(block.timestamp);
        }
    }
}
```

### 2. 执行触发类型

#### A. 时间触发（Time-based）

```solidity
contract TimeBasedNFT is AutomationCompatibleInterface {
    uint256 public lastUpdateTime;
    uint256 public interval = 24 hours;  // 每24小时执行一次

    function checkUpkeep(bytes calldata)
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory)
    {
        upkeepNeeded = (block.timestamp - lastUpdateTime) > interval;
    }

    function performUpkeep(bytes calldata) external override {
        if ((block.timestamp - lastUpdateTime) > interval) {
            lastUpdateTime = block.timestamp;

            // 每天更新NFT
            dailyUpdate();
        }
    }

    function dailyUpdate() private {
        // 更新所有NFT的每日属性
        // 例如：植物成长、角色恢复体力等
    }
}
```

**应用场景**：
- 每日签到奖励
- 植物/宠物成长系统
- 定期空投
- 时间限定活动

#### B. 条件触发（Conditional）

```solidity
contract ConditionalNFT is AutomationCompatibleInterface {
    uint256 public threshold = 100;

    function checkUpkeep(bytes calldata)
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory)
    {
        // 检查某个条件
        uint256 currentValue = getCurrentValue();
        upkeepNeeded = currentValue > threshold;
    }

    function performUpkeep(bytes calldata) external override {
        uint256 currentValue = getCurrentValue();

        if (currentValue > threshold) {
            // 触发NFT进化
            evolveNFTs();
        }
    }
}
```

**应用场景**：
- 达成成就自动升级
- 市场价格触发
- 投票结束自动执行

#### C. 自定义逻辑触发

```solidity
contract CustomLogicNFT is AutomationCompatibleInterface {

    function checkUpkeep(bytes calldata)
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        // 复杂的检查逻辑
        uint256[] memory tokensNeedingUpdate = new uint256[](0);

        for (uint i = 1; i <= totalSupply(); i++) {
            if (needsUpdate(i)) {
                // 记录需要更新的token
                tokensNeedingUpdate = append(tokensNeedingUpdate, i);
            }
        }

        upkeepNeeded = tokensNeedingUpdate.length > 0;
        performData = abi.encode(tokensNeedingUpdate);  // 传递需要更新的token列表
    }

    function performUpkeep(bytes calldata performData) external override {
        uint256[] memory tokenIds = abi.decode(performData, (uint256[]));

        for (uint i = 0; i < tokenIds.length; i++) {
            updateToken(tokenIds[i]);
        }
    }
}
```

### 3. 节点竞争机制

```
时刻: T0
│
│  ┌─────────────────────────────────────┐
├─▶│ 多个Chainlink节点同时监控            │
│  │ - Node A checkUpkeep() → true      │
│  │ - Node B checkUpkeep() → true      │
│  │ - Node C checkUpkeep() → true      │
│  └─────────────────────────────────────┘
│
时刻: T1
│  ┌─────────────────────────────────────┐
├─▶│ 节点竞争提交交易                      │
│  │ - Node A 提交 tx (gas price: 50)   │
│  │ - Node B 提交 tx (gas price: 55)   │
│  │ - Node C 提交 tx (gas price: 52)   │
│  └─────────────────────────────────────┘
│
时刻: T2
│  ┌─────────────────────────────────────┐
└─▶│ 第一个成功的交易被打包                │
   │ - Node B的交易被矿工打包 ✅          │
   │ - Node A和C的交易失败（revert）❌   │
   │ - Node B获得LINK奖励                │
   └─────────────────────────────────────┘
```

**好处**：
- ✅ 去中心化（多个节点竞争）
- ✅ 可靠性高（某个节点失败，其他节点继续）
- ✅ 防止单点故障

---

## 代码示例

### 示例1：天气NFT（每24小时更新）

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@chainlink/contracts/src/v0.8/AutomationCompatible.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract WeatherNFT is ERC721, AutomationCompatibleInterface {

    uint256 public lastUpdateTime;
    uint256 public interval = 24 hours;

    enum Weather { Sunny, Rainy, Cloudy, Snowy }
    mapping(uint256 => Weather) public tokenWeather;

    AggregatorV3Interface internal weatherFeed;  // Chainlink价格喂价（模拟天气数据）

    constructor(address weatherFeedAddress) ERC721("WeatherNFT", "WNFT") {
        weatherFeed = AggregatorV3Interface(weatherFeedAddress);
        lastUpdateTime = block.timestamp;
    }

    // Chainlink Automation调用 - 检查是否需要更新
    function checkUpkeep(bytes calldata)
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory)
    {
        upkeepNeeded = (block.timestamp - lastUpdateTime) > interval;
    }

    // Chainlink Automation调用 - 执行更新
    function performUpkeep(bytes calldata) external override {
        if ((block.timestamp - lastUpdateTime) > interval) {
            lastUpdateTime = block.timestamp;

            // 获取"天气数据"（这里简化为使用价格数据）
            (, int256 price,,,) = weatherFeed.latestRoundData();

            // 更新所有NFT的天气
            Weather newWeather = determineWeather(price);

            for (uint256 i = 1; i <= totalSupply(); i++) {
                tokenWeather[i] = newWeather;
            }

            emit WeatherUpdated(newWeather, block.timestamp);
        }
    }

    function determineWeather(int256 value) private pure returns (Weather) {
        uint256 mod = uint256(value) % 4;
        if (mod == 0) return Weather.Sunny;
        if (mod == 1) return Weather.Rainy;
        if (mod == 2) return Weather.Cloudy;
        return Weather.Snowy;
    }

    // 动态生成metadata
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        Weather weather = tokenWeather[tokenId];
        string memory weatherStr = getWeatherString(weather);
        string memory imageUri = getWeatherImage(weather);

        return string(abi.encodePacked(
            'data:application/json;base64,',
            Base64.encode(bytes(abi.encodePacked(
                '{"name":"Weather NFT #', Strings.toString(tokenId), '",',
                '"description":"An NFT that changes based on weather conditions.",',
                '"image":"', imageUri, '",',
                '"attributes":[',
                '{"trait_type":"Current Weather","value":"', weatherStr, '"},',
                '{"display_type":"date","trait_type":"Last Update","value":',
                Strings.toString(lastUpdateTime), '}',
                ']}'
            )))
        ));
    }

    function getWeatherString(Weather weather) private pure returns (string memory) {
        if (weather == Weather.Sunny) return "Sunny";
        if (weather == Weather.Rainy) return "Rainy";
        if (weather == Weather.Cloudy) return "Cloudy";
        return "Snowy";
    }

    function getWeatherImage(Weather weather) private pure returns (string memory) {
        if (weather == Weather.Sunny) return "ipfs://Qm.../sunny.png";
        if (weather == Weather.Rainy) return "ipfs://Qm.../rainy.png";
        if (weather == Weather.Cloudy) return "ipfs://Qm.../cloudy.png";
        return "ipfs://Qm.../snowy.png";
    }

    event WeatherUpdated(Weather newWeather, uint256 timestamp);
}
```

### 示例2：游戏角色自动恢复体力

```solidity
contract GameCharacterNFT is ERC721, AutomationCompatibleInterface {

    struct Character {
        uint256 stamina;      // 当前体力
        uint256 maxStamina;   // 最大体力
        uint256 lastRestTime; // 上次恢复时间
    }

    mapping(uint256 => Character) public characters;
    uint256 public restInterval = 1 hours;  // 每小时恢复一次
    uint256 public staminaRegenAmount = 10; // 每次恢复10点

    // 检查是否有角色需要恢复体力
    function checkUpkeep(bytes calldata)
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        uint256[] memory tokensToRestore = new uint256[](totalSupply());
        uint256 count = 0;

        for (uint256 i = 1; i <= totalSupply(); i++) {
            Character memory char = characters[i];

            // 检查是否需要恢复
            bool needsRest = (block.timestamp - char.lastRestTime) >= restInterval;
            bool notFull = char.stamina < char.maxStamina;

            if (needsRest && notFull) {
                tokensToRestore[count] = i;
                count++;
            }
        }

        upkeepNeeded = count > 0;

        // 只传递需要恢复的token ID
        uint256[] memory finalTokens = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            finalTokens[i] = tokensToRestore[i];
        }

        performData = abi.encode(finalTokens);
    }

    // 执行体力恢复
    function performUpkeep(bytes calldata performData) external override {
        uint256[] memory tokenIds = abi.decode(performData, (uint256[]));

        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            Character storage char = characters[tokenId];

            // 再次验证（防止状态变化）
            if ((block.timestamp - char.lastRestTime) >= restInterval) {
                // 恢复体力
                char.stamina = min(char.stamina + staminaRegenAmount, char.maxStamina);
                char.lastRestTime = block.timestamp;

                emit StaminaRestored(tokenId, char.stamina);
            }
        }
    }

    function min(uint256 a, uint256 b) private pure returns (uint256) {
        return a < b ? a : b;
    }

    event StaminaRestored(uint256 indexed tokenId, uint256 newStamina);
}
```

---

## 使用流程

### 步骤1：部署合约

```bash
# 部署你的AutomationCompatible合约
yarn hardhat deploy --network sepolia
```

### 步骤2：注册Upkeep

#### 方式A：通过UI注册（推荐）

1. 访问 https://automation.chain.link
2. 连接钱包
3. 点击"Register New Upkeep"
4. 填写信息：
   - **Upkeep name**: "My Dynamic NFT Auto Update"
   - **Target contract address**: 0x你的合约地址
   - **Gas limit**: 500000
   - **Starting balance**: 5 LINK
   - **Your email** (可选)
5. 确认并支付LINK代币

#### 方式B：通过合约注册

```solidity
import "@chainlink/contracts/src/v0.8/interfaces/AutomationRegistrarInterface.sol";

function registerUpkeep() public {
    AutomationRegistrarInterface registrar = AutomationRegistrarInterface(
        REGISTRAR_ADDRESS
    );

    AutomationRegistrarInterface.RegistrationParams memory params = AutomationRegistrarInterface.RegistrationParams({
        name: "My NFT Automation",
        encryptedEmail: bytes(""),
        upkeepContract: address(this),
        gasLimit: 500000,
        adminAddress: msg.sender,
        triggerType: 0,  // 0 = conditional, 1 = log trigger
        checkData: bytes(""),
        triggerConfig: bytes(""),
        offchainConfig: bytes(""),
        amount: 5 ether  // 5 LINK
    });

    registrar.registerUpkeep(params);
}
```

### 步骤3：充值LINK代币

```
你的Upkeep会消耗LINK代币支付gas费：
- 每次performUpkeep执行都会扣除LINK
- 余额不足时，Automation会暂停
- 可以随时充值
```

### 步骤4：监控和管理

在 https://automation.chain.link 仪表板：
- 查看执行历史
- 监控LINK余额
- 调整gas limit
- 暂停/恢复Upkeep

---

## 费用机制

### 成本构成

```
每次执行费用 = Gas费 + Premium费

Gas费 = (gas used) × (gas price) × (LINK/ETH价格)
Premium费 = 固定百分比（~10-20%），支付给Chainlink节点运营商

示例（Ethereum主网）:
- Gas used: 200,000
- Gas price: 30 gwei
- ETH price: $2000
- LINK price: $15

Gas费 = 200,000 × 30 × 10^-9 × 2000 / 15 ≈ 0.8 LINK
Premium = 0.8 × 0.2 = 0.16 LINK
总计 = 0.96 LINK per execution
```

### 成本优化

```solidity
// ❌ 昂贵：每次检查所有token
function checkUpkeep(bytes calldata) external view override returns (bool, bytes memory) {
    for (uint i = 1; i <= 10000; i++) {  // 遍历10000个NFT
        if (needsUpdate(i)) {
            return (true, "");
        }
    }
    return (false, "");
}

// ✅ 优化：批量处理 + 限制每次数量
uint256 public lastCheckedIndex = 0;
uint256 public constant BATCH_SIZE = 100;

function checkUpkeep(bytes calldata) external view override returns (bool, bytes memory) {
    uint256 startIndex = lastCheckedIndex;
    uint256 endIndex = min(startIndex + BATCH_SIZE, totalSupply());

    for (uint i = startIndex; i < endIndex; i++) {
        if (needsUpdate(i)) {
            return (true, abi.encode(i));
        }
    }

    return (false, "");
}

function performUpkeep(bytes calldata performData) external override {
    uint256 tokenId = abi.decode(performData, (uint256));
    updateToken(tokenId);

    // 更新索引
    lastCheckedIndex = (lastCheckedIndex + BATCH_SIZE) % totalSupply();
}
```

---

## 与其他方案对比

| 方案 | 去中心化 | 自动化 | 成本 | 灵活性 | 适用场景 |
|------|----------|--------|------|--------|----------|
| **Chainlink Automation** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 中-高 | ⭐⭐⭐⭐⭐ | 需要自动化的dNFT |
| **链上动态生成** | ⭐⭐⭐⭐⭐ | ⭐⭐ | 低 | ⭐⭐⭐ | 简单状态变化 |
| **手动调用更新** | ⭐⭐⭐⭐ | ⭐ | 低 | ⭐⭐⭐ | 用户触发更新 |
| **中心化Cron** | ⭐ | ⭐⭐⭐⭐⭐ | 低 | ⭐⭐⭐⭐⭐ | 测试/Demo |

---

## 真实应用案例

### 1. LaMelo Ball NFTs
- NBA球员的动态NFT
- 使用Chainlink Automation定期检查球员数据
- 达成成就自动进化
- 链接：https://edition.lameball.world/

### 2. Chainlink动态SVG NFT教程

```solidity
// 官方教程
// https://docs.chain.link/chainlink-automation/guides/compatible-contract-tutorial

contract DynamicSVG is ERC721URIStorage, AutomationCompatibleInterface {
    uint256 public counter;

    function checkUpkeep(bytes calldata) external view override returns (bool, bytes memory) {
        return ((block.timestamp % 60) == 0, bytes(""));  // 每分钟触发
    }

    function performUpkeep(bytes calldata) external override {
        counter++;
        // 更新SVG图像
    }
}
```

### 3. Aavegotchi
- 游戏NFT，属性随玩家操作变化
- 质押AAVE代币影响稀有度
- 互动增加经验值
- 装备可穿戴设备改变外观

---

## 针对StakableNFT项目的应用

### 你的项目是否需要Automation？

你的盲盒项目**不一定需要** Chainlink Automation，因为：

```solidity
// 你的揭示逻辑（用户主动触发）
function reveal(uint256 tokenId) public {
    require(msg.sender == ownerOf(tokenId));
    require(!revealed[tokenId]);

    // 使用Chainlink VRF获取随机数
    requestRandomWords();
}

// VRF回调（自动完成）
function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
    revealed[tokenId] = true;
    tokenRarity[tokenId] = determineRarity(randomWords[0]);
}
```

### 可选增强功能

如果想使用Automation增强功能：

#### 功能1：自动揭示（24小时后）

```solidity
function checkUpkeep(bytes calldata) external view override returns (bool, bytes memory) {
    for (uint i = 1; i <= totalSupply(); i++) {
        if (!revealed[i] && (block.timestamp - mintTime[i]) > 24 hours) {
            return (true, abi.encode(i));
        }
    }
    return (false, "");
}

function performUpkeep(bytes calldata performData) external override {
    uint256 tokenId = abi.decode(performData, (uint256));
    // 自动触发揭示
    reveal(tokenId);
}
```

#### 功能2：质押奖励自动分发

```solidity
function checkUpkeep(bytes calldata) external view override returns (bool, bytes memory) {
    return ((block.timestamp - lastRewardTime) > 1 days, bytes(""));
}

function performUpkeep(bytes calldata) external override {
    // 每天自动分发质押奖励
    distributeStakingRewards();
    lastRewardTime = block.timestamp;
}
```

---

## 总结

### Chainlink Automation原理

1. 你的合约实现 `checkUpkeep()` 和 `performUpkeep()`
2. Chainlink节点持续调用 `checkUpkeep()`（链下，免费）
3. 当条件满足时，节点竞争调用 `performUpkeep()`（链上，消耗LINK）
4. 你的合约逻辑自动执行

### 核心优势

- ✅ 完全去中心化
- ✅ 高可靠性（多节点竞争）
- ✅ 灵活的触发条件
- ✅ 不需要自己运行服务器

### 适合场景

- 需要定时执行的逻辑
- 基于外部数据触发
- 无法依赖用户主动调用
- 需要保证一定执行

---

## 相关资源

- [Chainlink Automation官方文档](https://docs.chain.link/chainlink-automation/introduction)
- [Automation仪表板](https://automation.chain.link)
- [示例代码库](https://github.com/smartcontractkit/chainlink/tree/develop/contracts/src/v0.8/automation)
- [成本计算器](https://automation.chain.link/calculator)

---

**创建日期**: 2025-11-02
**最后更新**: 2025-11-02
