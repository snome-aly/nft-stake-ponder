# Governance DAO 分步执行指南 (Minimum Safe Execution Path)

为了保证执行可控，我们将整个实施过程拆解为 7 个独立的"最小可执行单元 (MVU)"。
**规则**：必须完成前一个单元的验证 (Verification)，才能开始下一个单元。

## Unit 1: 治理代币升级 (The Vote-Ready Token)
*   **目标**: 让 RewardToken 具备投票和委托功能。
*   **代码变更**:
    *   修改 [RewardToken.sol](file:///Users/snome/defi/stake-projetc/nft-stake-ponder/packages/hardhat/contracts/RewardToken.sol): 继承 `ERC20Votes`。
    *   解决 `ERC20Votes` 与 `ERC20Permit` 的 override 冲突。
*   **验证标准 (Verification)**:
    *   编写脚本 `scripts/verify_unit1.js`:
        1.  部署 RewardToken。
        2.  给自己 Mint 1000 代币。
        3.  打印当前 `getVotes(me)` -> 预期为 0。
        4.  执行 `delegate(me)`。
        5.  打印当前 `getVotes(me)` -> 预期为 1000。
    *   **成功标志**: 看到票数从 0 变为 1000。

## Unit 2: 目标合约改造 (The Governable Target)
*   **目标**: 让 NFTStakingPool 拥有一个可以被治理修改的参数。
*   **代码变更**:
    *   修改 [NFTStakingPool.sol](file:///Users/snome/defi/stake-projetc/nft-stake-ponder/packages/hardhat/contracts/NFTStakingPool.sol): 移除 `BASE_REWARD` 的 `constant` 修饰符。
    *   添加 `function setBaseReward(uint256)` (修饰符 `onlyOwner`)。
*   **验证标准 (Verification)**:
    *   编写脚本 `scripts/verify_unit2.js`:
        1.  部署 Pool (Owner 是 Deployer)。
        2.  调用 `setBaseReward(200)` -> 成功。
        3.  切换账号 (Alice) 调用 `setBaseReward(300)` -> 失败 (Revert "Ownable unauthorized").
    *   **成功标志**: 能够在本地验证 Owner 权限控制生效。

## Unit 3: 治理核心部署 (The Governance Engine)
*   **目标**: 部署 TimeLock 和 Governor 合约。
*   **代码变更**:
    *   创建 `contracts/Timelock.sol` (最小延迟设为 0，方便测试)。
    *   创建 `contracts/MyGovernor.sol` (设定 VotingDelay=1 block, VotingPeriod=50 blocks)。
*   **验证标准 (Verification)**:
    *   编写脚本 `scripts/verify_unit3.js`:
        1.  部署 Timelock & Governor。
        2.  读取 `Governor.votingPeriod()` -> 预期 50。
        3.  读取 `Governor.token()` -> 预期为 RewardToken 地址。
    *   **成功标志**: 合约成功部署且参数正确。

## Unit 4: 权限组装 (Wiring & Permissions)
*   **目标**: 移交权限，构建完整的 "Token -> Gov -> Timelock -> Pool" 链条。
*   **代码变更**:
    *   编写部署脚本 `deploy/01_deploy_governance.ts`:
        1.  部署所有合约。
        2.  **Grant Role**: 给 Governor 授予 Timelock 的 `PROPOSER_ROLE`。
        3.  **Grant Role**: 给 Timelock 授予 Timelock 的 `EXECUTOR_ROLE` (通常给 address(0) 表示任何人可执行)。
        4.  **Transfer Owner**: 将 Pool 的 Owner 转移给 Timelock。
        5.  **Bootstrap**: 给 Deployer 铸造 100k RWRD + `delegate(self)`。
*   **验证标准 (Verification)**:
    *   运行部署脚本。
    *   在 Hardhat Console 验证: `Pool.owner() == Timelock.address`。
    *   验证 `RewardToken.getVotes(Deployer) >= 100000`。
    *   验证 `Deployer` **不再是** Pool 的 Owner (无法直接调用 setBaseReward)。
    *   **成功标志**: 权限转移完成，Deployer 拥有票数但失去了直接控制权。

## Unit 5: 全流程冒烟测试 (The Smoke Test)
*   **目标**: 在链下跑通 "提案-执行" 全流程。
*   **代码变更**:
    *   编写 Hardhat Test `test/GovernanceFlow.test.ts`。
*   **验证标准 (Verification)**:
    *   测试步骤自动化：
        1.  `governor.propose(target=Pool, data=setBaseReward(500))`.
        2.  `vm.mine()` 跳过 VotingDelay。
        3.  `governor.castVote(For)`.
        4.  `vm.mine()` 跳过 VotingPeriod。
        5.  `governor.queue()`.
        6.  `vm.warp()` 跳过 TimelockDelay。
        7.  `governor.execute()`.
        8.  断言 `Pool.baseReward() == 500`.
    *   **成功标志**: 测试绿灯通过 (✅ Passed)。

## Unit 6: 数据索引层 (Ponder Indexer)
*   **目标**: 让后端能看到提案数据。
*   **代码变更**:
    *   修改 `ponder.schema.ts` (Proposal, Vote)。
    *   修改 `ponder.config.ts` (添加新合约)。
    *   编写 `src/MyGovernor.ts` (Handle ProposalCreated, VoteCast)。
*   **验证标准 (Verification)**:
    *   运行 Unit 5 的测试脚本（产生链上数据）。
    *   启动 Ponder (`npm run dev`)。
    *   打开 GraphQL Playground 查询 `{ proposals { id status } }`。
    *   **成功标志**: 能查到刚才测试产生的提案数据。

## Unit 7: 前端接入 (Frontend Integration)
*   **目标**: 用户界面。
*   **代码变更**:
    *   页面 `/governance`.
    *   组件 `DelegateButton`, `ProposalList`, `CastVote`.
*   **验证标准 (Verification)**:
    *   浏览器手动操作：点击 Delegate -> 签名 -> 看到票数变化。
    *   点击 Create Proposal -> 看到列表更新。
    *   **成功标志**: UI 流程顺畅。

---
建议我们从 **Unit 1** 开始。确认准备好了吗？
