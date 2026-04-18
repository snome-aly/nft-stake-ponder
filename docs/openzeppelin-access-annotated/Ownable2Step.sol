// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (access/Ownable2Step.sol)

pragma solidity ^0.8.20;

import {Ownable} from "./Ownable.sol";

/**
 * @dev 两步所有权转移模式的合约模块
 *
 * 【核心改进】
 * 在 Ownable 基础上增加了两步确认机制,防止将所有权转移到错误地址
 *
 * 【工作流程】
 * 1. 当前所有者调用 transferOwnership(newOwner) - 发起转移
 * 2. 新所有者被设置为"待定所有者"(pending owner)
 * 3. 新所有者调用 acceptOwnership() - 确认接受
 * 4. 所有权正式转移完成
 *
 * 【相比 Ownable 的优势】
 * ✅ 防止打错地址导致永久失去控制权
 * ✅ 新所有者必须主动确认,证明其能控制该地址
 * ✅ 转移前可以取消(再次调用 transferOwnership)
 *
 * 【使用场景】
 * - 高价值合约的所有权转移 (DeFi 协议、NFT 项目)
 * - 转移给智能合约钱包前验证其配置正确
 * - 多签钱包或 DAO 接管前的确认步骤
 *
 * 【示例】
 * ```solidity
 * contract SecureToken is Ownable2Step {
 *     constructor() Ownable(msg.sender) {}
 * }
 *
 * // 转移流程:
 * // 1. 当前所有者: token.transferOwnership(newOwnerAddress);
 * // 2. 新所有者: token.acceptOwnership();
 * ```
 *
 * 【继承关系】
 * Ownable2Step
 *   └── Ownable
 *         └── Context
 */
abstract contract Ownable2Step is Ownable {
    // ============ 状态变量 ============

    /**
     * @dev 待定所有者地址
     *
     * 【状态说明】
     * - address(0): 无待定转移
     * - 其他地址: 有待定转移,等待该地址确认
     *
     * 【生命周期】
     * 1. transferOwnership() 时设置为新所有者
     * 2. acceptOwnership() 时清空(完成转移)
     * 3. renounceOwnership() 时清空(取消转移)
     * 4. 再次 transferOwnership() 时覆盖(更换新所有者)
     */
    address private _pendingOwner;

    // ============ 事件定义 ============

    /**
     * @dev 事件:所有权转移已启动(第一步)
     * @param previousOwner 当前所有者地址 (indexed,可用于过滤)
     * @param newOwner 待定所有者地址 (indexed,可用于过滤)
     *
     * 【触发时机】
     * 当前所有者调用 transferOwnership() 时触发
     *
     * 【与 OwnershipTransferred 的区别】
     * - OwnershipTransferStarted: 转移已提议,但未完成
     * - OwnershipTransferred: 转移已完成(acceptOwnership 后触发)
     *
     * 【应用场景】
     * - 前端显示"待定转移"状态
     * - 通知新所有者需要确认
     * - 链下监控和告警系统
     *
     * 【示例监听】
     * contract.on("OwnershipTransferStarted", (prev, newOwner) => {
     *     alert(`请新所有者 ${newOwner} 调用 acceptOwnership()`);
     * });
     */
    event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);

    // ============ 查询函数 ============

    /**
     * @dev 返回待定所有者地址
     * @return 待定所有者的地址,如果没有待定转移则返回 address(0)
     *
     * 【可见性】public view - 任何人都可以查询当前是否有待定转移
     * 【virtual】允许子合约覆盖,添加自定义逻辑
     *
     * 【应用场景】
     * - 前端显示待定转移状态
     * - 新所有者确认自己的待定状态
     * - 审计工具检查转移流程
     *
     * 【示例】
     * address pending = ownable.pendingOwner();
     * if (pending != address(0)) {
     *     console.log("待定所有者:", pending);
     * }
     */
    function pendingOwner() public view virtual returns (address) {
        return _pendingOwner;
    }

    // ============ 覆盖父合约函数 ============

    /**
     * @dev 发起所有权转移(第一步)
     * @param newOwner 待定所有者地址
     *
     * 【访问控制】只有当前所有者可以调用 (继承自 Ownable 的 onlyOwner 修饰器)
     *
     * 【与父合约 Ownable 的区别】
     * - Ownable.transferOwnership: 立即完成转移
     * - Ownable2Step.transferOwnership: 仅设置待定状态,需要新所有者确认
     *
     * 【执行流程】
     * 1. 检查调用者是否为当前所有者 (onlyOwner)
     * 2. 设置 _pendingOwner = newOwner
     * 3. 触发 OwnershipTransferStarted 事件
     * 4. 不触发 OwnershipTransferred (所有权尚未转移)
     *
     * 【重要特性】
     * ✅ 可以多次调用以更换待定所有者
     * ✅ 不验证 newOwner 是否为 address(0),允许通过此方式取消待定转移
     * ✅ 如果有旧的待定转移,会被新的覆盖
     *
     * 【示例】
     * // 发起转移
     * ownable.transferOwnership(0x123...);
     *
     * // 发现地址错误,立即更正
     * ownable.transferOwnership(0x456...);
     *
     * // 取消转移(可选,也可以等待过期)
     * ownable.transferOwnership(address(0));
     */
    function transferOwnership(address newOwner) public virtual override onlyOwner {
        _pendingOwner = newOwner;
        emit OwnershipTransferStarted(owner(), newOwner);
    }

    /**
     * @dev 内部函数:执行实际的所有权转移
     * @param newOwner 新所有者地址
     *
     * 【覆盖说明】
     * 覆盖父合约 Ownable._transferOwnership,增加清空待定所有者的逻辑
     *
     * 【执行流程】
     * 1. 清空 _pendingOwner (delete _pendingOwner)
     * 2. 调用父合约 super._transferOwnership(newOwner)
     *    - 更新 _owner = newOwner
     *    - 触发 OwnershipTransferred 事件
     *
     * 【调用场景】
     * - acceptOwnership() 时: 完成两步转移
     * - renounceOwnership() 时: 放弃所有权并清空待定状态
     *
     * 【为什么使用 delete】
     * delete _pendingOwner 等同于 _pendingOwner = address(0),但更省 gas
     *
     * 【设计要点】
     * ✅ internal virtual: 允许子合约进一步扩展
     * ✅ 先清空待定状态,再调用父合约,符合 Checks-Effects-Interactions 模式
     */
    function _transferOwnership(address newOwner) internal virtual override {
        delete _pendingOwner;
        super._transferOwnership(newOwner);
    }

    // ============ 新增函数 ============

    /**
     * @dev 新所有者接受所有权转移(第二步)
     *
     * 【访问控制】只有待定所有者可以调用
     *
     * 【执行流程】
     * 1. 获取调用者地址 (使用 _msgSender() 支持元交易)
     * 2. 验证调用者是否为待定所有者
     * 3. 如果不是,revert OwnableUnauthorizedAccount
     * 4. 调用 _transferOwnership(sender) 完成转移
     *    - 清空 _pendingOwner
     *    - 更新 _owner = sender
     *    - 触发 OwnershipTransferred 事件
     *
     * 【安全检查】
     * ✅ 只有正确的待定所有者可以调用
     * ✅ 必须主动调用,证明能控制该地址
     * ✅ 支持智能合约作为新所有者(需实现调用逻辑)
     *
     * 【使用示例】
     * // 当前所有者发起转移
     * ownable.transferOwnership(newOwnerAddress);
     *
     * // 新所有者确认接受(使用 newOwnerAddress 的私钥签名)
     * ownable.acceptOwnership();
     *
     * 【智能合约作为新所有者】
     * contract MultiSig {
     *     function acceptTokenOwnership(Ownable2Step token) external onlyMultiSig {
     *         token.acceptOwnership();
     *     }
     * }
     *
     * 【常见错误】
     * ❌ 错误 1: 当前所有者调用 acceptOwnership
     *    → 会 revert,因为 pendingOwner != owner
     *
     * ❌ 错误 2: 第三方调用 acceptOwnership
     *    → 会 revert,因为 pendingOwner != 第三方地址
     *
     * ❌ 错误 3: 没有待定转移时调用
     *    → 会 revert,因为 pendingOwner == address(0)
     */
    function acceptOwnership() public virtual {
        address sender = _msgSender();
        if (pendingOwner() != sender) {
            revert OwnableUnauthorizedAccount(sender);
        }
        _transferOwnership(sender);
    }
}

/*
 * ============================================================
 *                      学习总结
 * ============================================================
 *
 * 【两步转移流程图】
 *
 *  当前所有者                待定所有者
 *      |                        |
 *      | transferOwnership()    |
 *      |----------------------->|
 *      |  (设置 _pendingOwner)  |
 *      |                        |
 *      |     acceptOwnership()  |
 *      |<-----------------------|
 *      |   (完成所有权转移)      |
 *      ✓                        ✓
 *                          新所有者
 *
 * 【状态转换图】
 *
 * [无待定转移]
 *   _pendingOwner = address(0)
 *         |
 *         | transferOwnership(addr)
 *         ↓
 * [有待定转移]
 *   _pendingOwner = addr
 *         |
 *         |-- acceptOwnership() → [转移完成] _pendingOwner = address(0)
 *         |
 *         |-- transferOwnership(addr2) → [更换待定所有者] _pendingOwner = addr2
 *         |
 *         └-- renounceOwnership() → [放弃所有权] _pendingOwner = address(0)
 *
 * 【安全对比】
 *
 * | 场景 | Ownable | Ownable2Step |
 * |------|---------|--------------|
 * | 转移到错误地址 | ❌ 永久失去控制 | ✅ 可以重新发起 |
 * | 转移到合约地址 | ❌ 可能无法调用 | ✅ 必须能调用 acceptOwnership |
 * | 误操作风险 | 高 | 低 |
 * | Gas 成本 | 低 (1 次交易) | 中 (2 次交易) |
 *
 * 【最佳实践】
 * ✅ 高价值合约必须使用 Ownable2Step
 * ✅ 转移前通知新所有者,确保其了解流程
 * ✅ 设置合理的超时机制(可在子合约中实现)
 * ✅ 记录转移事件,便于审计
 *
 * 【常见扩展】
 * 1. 添加转移超时机制
 * 2. 添加取消转移的显式函数
 * 3. 记录转移历史
 * 4. 限制新所有者必须是 EOA 或特定合约
 *
 * 【进阶阅读】
 * - Ownable.sol - 基础所有权模式
 * - AccessControl.sol - 多角色权限管理
 * - TimelockController.sol - 时间锁控制器
 */
