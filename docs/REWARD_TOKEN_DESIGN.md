# REWARD Token 设计文档

## 1. 概述

本文档描述 NFT 质押系统的 ERC20 奖励代币（REWARD Token）设计方案。这是一个**纯奖励代币**，用于激励用户质押 NFT。

### 1.1 核心定位

```
用户质押 NFT → 系统产出 REWARD Token → 用户领取奖励
```

**REWARD Token 的角色：**
- ✅ 质押 NFT 的产出奖励
- ✅ 未来可用于 NFT 升级、治理等消耗场景
- ❌ 不是用来质押的代币
- ❌ 不涉及复利机制

### 1.2 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                     NFT 质押系统架构                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐         ┌─────────────────┐           │
│  │  StakableNFT    │         │  RewardToken    │           │
│  │  (已实现)        │         │  (本文档)        │           │
│  │                 │         │                 │           │
│  │ • 4级稀有度系统  │         │ • ERC20 代币    │           │
│  │ • 奖励倍率接口   │         │ • 可铸造/可销毁  │           │
│  └────────┬────────┘         └────────┬────────┘           │
│           │                           │                     │
│           │    ┌─────────────────┐    │                     │
│           │    │  NFTStakingPool │    │                     │
│           └───►│  (待实现)        │◄───┘                     │
│                │                 │                          │
│                │ • 质押/解押 NFT  │                          │
│                │ • 计算奖励      │                          │
│                │ • 铸造 REWARD   │                          │
│                └─────────────────┘                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 代币基本信息

### 2.1 代币参数

| 参数 | 值 | 说明 |
|------|-----|------|
| 名称 | Reward Token | 代币全名 |
| 符号 | RWRD | 代币符号 |
| 精度 | 18 | 标准 ERC20 精度 |
| 初始供应量 | 0 | 全部通过质押产出 |

### 2.2 设计原理

**为什么零初始供应？**

1. **公平分配** - 所有代币都通过质押行为产出，无预挖
2. **价值锚定** - 每个代币都代表真实的质押贡献
3. **简化模型** - 无需设计复杂的初始分配方案

---

## 3. 奖励产出机制

### 3.1 基础排放

采用**固定排放 + 稀有度加成**模式：

```
每个 NFT 的每秒奖励 = 基础排放率 × 稀有度倍率
```

**参数设置：**

| 参数 | 值 | 说明 |
|------|-----|------|
| 基础排放率 | 1 RWRD / 天 / NFT | 每个 Common NFT 每天产出 |
| 计算精度 | 每秒累积 | 1 / 86400 RWRD/秒 |

### 3.2 稀有度倍率

与 StakableNFT 合约已定义的倍率一致：

| 稀有度 | 数量占比 | 奖励倍率 | 每日产出 |
|--------|---------|---------|---------|
| Common | 50% | 1.0x | 1 RWRD |
| Rare | 30% | 1.5x | 1.5 RWRD |
| Epic | 15% | 2.0x | 2 RWRD |
| Legendary | 5% | 3.0x | 3 RWRD |

### 3.3 奖励计算公式

```solidity
// StakingPool 中的奖励计算
function calculatePendingReward(uint256 tokenId) public view returns (uint256) {
    StakeInfo storage info = stakeInfo[tokenId];

    uint256 timeStaked = block.timestamp - info.lastClaimTime;
    uint256 multiplier = stakableNFT.getTokenRewardMultiplier(tokenId);

    // multiplier 基于 10000: Common=10000, Rare=15000, Epic=20000, Legendary=30000
    // BASE_REWARD_PER_SECOND = 1e18 / 86400 (1 RWRD/天)

    return timeStaked * BASE_REWARD_PER_SECOND * multiplier / 10000;
}
```

### 3.4 设计原理

**为什么选择固定排放而非衰减排放？**

1. **简单直观** - 用户容易理解收益预期
2. **公平性** - 后来者与早期参与者获得相同的基础收益率
3. **可预测** - 便于计算质押回报
4. **学习友好** - 作为学习项目，降低复杂度

**为什么按 NFT 数量而非总池子分配？**

1. **独立计算** - 每个 NFT 独立产出，不受他人影响
2. **无竞争** - 新用户加入不会稀释现有用户收益
3. **简化逻辑** - 无需追踪总质押权重

---

## 4. 代币用途设计

### 4.1 当前用途

| 用途 | 描述 |
|------|------|
| 质押奖励 | NFT 质押的唯一产出 |
| 自由交易 | 用户可自由转移、交易 |

### 4.2 未来扩展用途（可选）

| 用途 | 描述 | 消耗方式 |
|------|------|---------|
| NFT 升级 | 消耗 RWRD 提升 NFT 稀有度 | 销毁 |
| 成就解锁 | 解锁特殊成就徽章 | 销毁 |
| 治理投票 | 参与系统参数决策 | 锁定（不销毁） |
| 抽奖/盲盒 | 消耗 RWRD 参与活动 | 销毁 |

### 4.3 设计原理

**为什么需要消耗场景？**

1. **价值支撑** - 有用途才有需求，有需求才有价值
2. **通缩机制** - 销毁减少供应，平衡持续产出
3. **生态循环** - 奖励→消耗→再质押→再奖励

---

## 5. 权限与安全设计

### 5.1 角色定义

```solidity
bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
```

| 角色 | 持有者 | 权限 |
|------|--------|------|
| DEFAULT_ADMIN_ROLE | 部署者/多签 | 管理角色授予 |
| MINTER_ROLE | NFTStakingPool 合约 | 铸造代币 |

### 5.2 安全约束

```solidity
// 仅 StakingPool 可铸造
function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
    _mint(to, amount);
}

// 任何人可销毁自己的代币（用于未来消耗场景）
function burn(uint256 amount) public {
    _burn(msg.sender, amount);
}
```

### 5.3 设计原理

**为什么使用 AccessControl？**

1. **最小权限** - StakingPool 只能铸造，无法执行其他操作
2. **可扩展** - 未来可添加其他角色（如升级合约的铸造权限）
3. **可审计** - 角色变更都有事件记录

**为什么不设铸造上限？**

对于本项目，铸造完全由 StakingPool 合约逻辑控制：
- 奖励计算公式固定
- 无法凭空铸造，必须有对应的质押时间
- 简化合约逻辑

---

## 6. 合约接口设计

### 6.1 完整合约

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title RewardToken
 * @notice NFT 质押系统的奖励代币
 * @dev 仅 MINTER_ROLE (StakingPool) 可铸造，任何人可销毁自己的代币
 */
contract RewardToken is ERC20, ERC20Burnable, ERC20Permit, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /// @notice 代币铸造事件
    event TokensMinted(address indexed to, uint256 amount);

    constructor() ERC20("Reward Token", "RWRD") ERC20Permit("Reward Token") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice 铸造代币
     * @dev 仅 MINTER_ROLE 可调用（应授予 StakingPool 合约）
     * @param to 接收地址
     * @param amount 铸造数量
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }
}
```

### 6.2 接口定义

```solidity
interface IRewardToken {
    /// @notice 铸造代币（仅 MINTER_ROLE）
    function mint(address to, uint256 amount) external;

    /// @notice 销毁自己的代币
    function burn(uint256 amount) external;

    /// @notice 授权后销毁他人代币
    function burnFrom(address account, uint256 amount) external;
}
```

---

## 7. 与 StakingPool 的集成

### 7.1 StakingPool 调用流程

```
用户调用 claimReward()
    │
    ▼
StakingPool.calculatePendingReward(tokenId)
    │
    ▼
RewardToken.mint(user, amount)
    │
    ▼
用户收到 RWRD 代币
```

### 7.2 StakingPool 中的相关代码

```solidity
contract NFTStakingPool {
    IRewardToken public rewardToken;
    IStakableNFT public stakableNFT;

    uint256 public constant BASE_REWARD_PER_SECOND = 1e18 / 86400; // 1 RWRD/天

    struct StakeInfo {
        address owner;
        uint256 stakedAt;
        uint256 lastClaimTime;
    }

    mapping(uint256 => StakeInfo) public stakeInfo;

    function claimReward(uint256 tokenId) external {
        StakeInfo storage info = stakeInfo[tokenId];
        require(info.owner == msg.sender, "Not owner");

        uint256 reward = calculatePendingReward(tokenId);
        info.lastClaimTime = block.timestamp;

        rewardToken.mint(msg.sender, reward);
    }

    function calculatePendingReward(uint256 tokenId) public view returns (uint256) {
        StakeInfo storage info = stakeInfo[tokenId];
        if (info.owner == address(0)) return 0;

        uint256 timeStaked = block.timestamp - info.lastClaimTime;
        uint256 multiplier = stakableNFT.getTokenRewardMultiplier(tokenId);

        return timeStaked * BASE_REWARD_PER_SECOND * multiplier / 10000;
    }
}
```

---

## 8. 测试用例

### 8.1 单元测试

```typescript
describe("RewardToken", () => {
    describe("部署", () => {
        it("名称应为 Reward Token");
        it("符号应为 RWRD");
        it("初始供应量应为 0");
        it("部署者应有 DEFAULT_ADMIN_ROLE");
    });

    describe("铸造", () => {
        it("MINTER_ROLE 可以铸造");
        it("非 MINTER_ROLE 无法铸造");
        it("铸造应触发 TokensMinted 事件");
        it("铸造应增加接收者余额");
        it("铸造应增加总供应量");
    });

    describe("销毁", () => {
        it("任何人可以销毁自己的代币");
        it("销毁应减少总供应量");
        it("授权后可以 burnFrom");
    });

    describe("权限", () => {
        it("管理员可以授予 MINTER_ROLE");
        it("管理员可以撤销 MINTER_ROLE");
        it("非管理员无法授予角色");
    });
});
```

### 8.2 集成测试

| 场景 | 操作 | 预期结果 |
|------|------|---------|
| 质押 Common NFT 1 天 | claimReward | 获得 1 RWRD |
| 质押 Legendary NFT 1 天 | claimReward | 获得 3 RWRD |
| 质押 2 个 NFT 各 1 天 | claimReward x2 | 分别获得对应奖励 |
| 未质押时领取 | claimReward | 交易失败 |

---

## 9. 部署流程

### 9.1 部署顺序

```
1. 部署 RewardToken
2. 部署 NFTStakingPool（传入 RewardToken 地址）
3. 授予 StakingPool MINTER_ROLE
4. 验证合约
```

### 9.2 部署脚本

```typescript
// deploy/01_deploy_reward_token.ts
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployRewardToken: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployer } = await hre.getNamedAccounts();
    const { deploy } = hre.deployments;

    await deploy("RewardToken", {
        from: deployer,
        args: [],
        log: true,
        autoMine: true,
    });
};

export default deployRewardToken;
deployRewardToken.tags = ["RewardToken"];
```

### 9.3 授权脚本

```typescript
// scripts/setup-minter-role.ts
import { ethers } from "hardhat";

async function main() {
    const rewardToken = await ethers.getContract("RewardToken");
    const stakingPool = await ethers.getContract("NFTStakingPool");

    const MINTER_ROLE = await rewardToken.MINTER_ROLE();
    await rewardToken.grantRole(MINTER_ROLE, stakingPool.address);

    console.log("Granted MINTER_ROLE to StakingPool");
}

main();
```

---

## 10. 总结

### 10.1 设计要点

| 方面 | 设计 | 原理 |
|------|------|------|
| 代币类型 | 纯奖励代币 | 简单明确的定位 |
| 初始供应 | 0 | 公平分配 |
| 排放模式 | 固定排放 × 稀有度 | 简单可预测 |
| 铸造权限 | 仅 StakingPool | 最小权限原则 |
| 可销毁 | 是 | 支持未来消耗场景 |

### 10.2 关键接口

- `mint(address to, uint256 amount)` - StakingPool 调用铸造奖励
- `burn(uint256 amount)` - 用户销毁代币（未来消耗用）
- `getTokenRewardMultiplier(tokenId)` - 从 StakableNFT 获取倍率

### 10.3 下一步

1. ✅ RewardToken 设计（本文档）
2. ⬜ 实现 RewardToken 合约
3. ⬜ 实现 NFTStakingPool 合约
4. ⬜ 编写测试
5. ⬜ 部署和集成

---

## 附录：与原 STAKE Token 设计的区别

| 方面 | 原设计 (STAKE) | 新设计 (REWARD) |
|------|---------------|-----------------|
| 定位 | 质押+奖励混合 | 纯奖励代币 |
| 复利机制 | 有（但逻辑矛盾） | 无（不适用） |
| 排放模式 | 衰减排放 | 固定排放 |
| 冷却期 | 3天 | 无（由 StakingPool 控制） |
| 惩罚机制 | 10% 提前领取惩罚 | 无（由 StakingPool 控制） |
| 每日限制 | 有 | 无（由公式自然限制） |
| 复杂度 | 较高 | 简单 |

新设计将**抗抛压机制（冷却期、惩罚）移至 StakingPool 合约**，RewardToken 只负责作为奖励媒介，职责更清晰。
