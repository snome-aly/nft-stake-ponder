# Governance Learning Phase 1: Core Concepts

## 1. 提案 (Proposal)
**提案**是治理系统的核心单元。在 OpenZeppelin Governance 中，一个提案本质上是**"一组计划在未来执行的链上交易"**。

*   **组成部分**:
    *   **Targets**: 目标合约地址列表。
    *   **Values**: 发送给目标合约的 ETH 数量 (Wei)。
    *   **Calldatas**: 调用的函数编码数据 (例如：调用 `setFee(100)` 的编码)。
    *   **Description**: 提案的描述文本 (通常只存储 Hash 在链上)。
*   **ID**: 提案 ID 通常由上述参数的 Hash 值生成，唯一标识一个提案。

## 2. 投票 (Vote)
**投票**是社区成员表达意愿的方式。

*   **权重 (Voting Power)**: 只有通过 `delegate` (委托) 激活的代币才拥有投票权。
    *   **为什么需要委托？**: 为了节省 Gas 和提高治理效率，只有显式委托 (可以是委托给自己) 的用户才会被跟踪票数。
*   **快照 (Snapshot)**: 投票权重是基于**提案创建时的区块** (Block Number) 确定的。
    *   **目的**: 防止有人看到提案后临时买币投票 (Flash Loan 攻击)，投票结束后立即卖出。
*   **类型**: 虽然最常见的是 `For` (赞成), `Against` (反对), `Abstain` (弃权)，但也可以扩展为更复杂的投票机制。

## 3. 法定人数 (Quorum) 与 阈值 (Thumbnail)
这两个参数决定了提案是否能"通过"。

*   **提案阈值 (Proposal Threshold)**:
    *   **定义**: 发起一个新提案所需的最小投票权 (Voting Power)。
    *   **目的**: 防止垃圾提案充满系统。
*   **法定人数 (Quorum)**:
    *   **定义**: 提案通过所需的**最小参与度**。通常指投"赞成 + 反对 + 弃权"的总票数必须超过总供应量的一定百分比 (例如 4%)。
    *   **目的**: 确保提案有足够的社区关注度，防止少数人偷偷通过恶意提案。

## 4. 时间锁 (Timelock)
**Timelock** 是治理模块的安全阀。

*   **是什么**: 一个智能合约，所有治理决策的最终执行者。
*   **流程**: 提案投票通过后，不会立即执行，而是进入 `Queued` 状态，放入 Timelock。
*   **冷静期 (Delay)**: 必须等待一段强制的时间 (如 2 天) 才能执行。
*   **作用**:
    1.  **安全缓冲**: 如果发现提案有 Bug 或恶意代码，Guardians (多签或其他治理者) 有机会在执行前取消它。
    2.  **退出权**: 如果社区通过了一个你不喜欢的提案 (比如没收所有资产)，你有 2 天时间在代码执行前卖出代币退出。

## 5. 生命周期 (Lifecycle)
一个标准治理提案的完整流程：

1.  **Pending**: 提案已创建，正在等待 `Voting Delay` (投票延迟期) 结束。
2.  **Active**: 投票期开始，用户可以调用 `castVote` 投票。
3.  **Succeeded**: 投票期结束。条件：赞成票 > 反对票，且 总票数 >= Quorum。
    *   *如果失败，则进入 Defeated 状态。*
4.  **Queued**: 任何人可以调用 `queue` 将提案放入 Timelock。
5.  **Executed**: 在等待了 Timelock 的 `MinDelay` 之后，任何人可以调用 `execute` 执行交易。

> **图示**: Proposal Created -> (Voting Delay) -> Voting Starts -> (Voting Period) -> Voting Ends -> (Succeeded?) -> Queue -> (Timelock Delay) -> Execute
