// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (access/Ownable.sol)

pragma solidity ^0.8.20;

import {Context} from "../utils/Context.sol";

/**
 * @dev 合约模块,提供基本的访问控制机制
 *
 * 【核心概念】
 * - 提供单一所有者(owner)的访问控制模式
 * - 只有所有者可以调用被 `onlyOwner` 修饰的函数
 * - 初始所有者在部署时通过构造函数设置
 * - 所有权可以通过 {transferOwnership} 转移
 * - 所有权可以通过 {renounceOwnership} 放弃
 *
 * 【使用方式】
 * 通过继承使用此模块,它会提供 `onlyOwner` 修饰器,可应用于需要限制访问的函数
 *
 * 【适用场景】
 * - 简单的单一管理员权限控制
 * - DeFi 协议的紧急暂停功能
 * - 合约参数的管理权限
 * - NFT 项目的铸造权限
 *
 * 【示例】
 * ```solidity
 * contract MyContract is Ownable {
 *     constructor() Ownable(msg.sender) {}
 *
 *     function sensitiveFunction() external onlyOwner {
 *         // 只有所有者可以调用
 *     }
 * }
 * ```
 */
abstract contract Ownable is Context {
    // ============ 状态变量 ============

    /**
     * @dev 私有变量,存储合约所有者地址
     * 【设计思路】使用 private 可见性确保只能通过公共函数访问,便于子类覆盖逻辑
     */
    address private _owner;

    // ============ 错误定义 ============

    /**
     * @dev 自定义错误:调用者未被授权执行操作
     * @param account 尝试调用的账户地址
     *
     * 【优势】相比 require 字符串,自定义错误节省 gas 并提供类型安全
     * 【触发场景】非所有者调用 onlyOwner 函数时
     */
    error OwnableUnauthorizedAccount(address account);

    /**
     * @dev 自定义错误:所有者地址无效
     * @param owner 无效的所有者地址
     *
     * 【触发场景】
     * - 构造函数传入 address(0) 作为初始所有者
     * - transferOwnership 传入 address(0) 作为新所有者
     */
    error OwnableInvalidOwner(address owner);

    // ============ 事件定义 ============

    /**
     * @dev 事件:所有权转移
     * @param previousOwner 前任所有者地址 (indexed,可用于过滤)
     * @param newOwner 新所有者地址 (indexed,可用于过滤)
     *
     * 【触发时机】
     * - 构造函数初始化所有权
     * - transferOwnership() 转移所有权
     * - renounceOwnership() 放弃所有权(newOwner 为 address(0))
     *
     * 【应用场景】
     * - 链下监控所有权变更
     * - 前端实时更新所有者信息
     * - 审计和合规追踪
     */
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // ============ 构造函数 ============

    /**
     * @dev 构造函数,初始化合约并设置初始所有者
     * @param initialOwner 初始所有者地址
     *
     * 【安全检查】
     * - 拒绝 address(0) 作为初始所有者,防止合约部署后立即失去控制
     *
     * 【设计变更】
     * OpenZeppelin v5.0 开始要求显式传入 initialOwner,之前版本默认使用 msg.sender
     * 这样设计更灵活,支持工厂模式部署
     *
     * 【示例】
     * constructor() Ownable(msg.sender) {}  // 部署者为所有者
     * constructor(address admin) Ownable(admin) {}  // 指定所有者
     */
    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(initialOwner);
    }

    // ============ 修饰器 ============

    /**
     * @dev 修饰器:限制函数只能由所有者调用
     *
     * 【工作原理】
     * 1. 执行 _checkOwner() 验证调用者身份
     * 2. 如果验证通过,执行被修饰的函数体 (_; 的位置)
     * 3. 如果验证失败,revert 并抛出 OwnableUnauthorizedAccount 错误
     *
     * 【使用示例】
     * function pause() external onlyOwner {
     *     _pause();
     * }
     *
     * 【注意事项】
     * - 每次调用都会产生额外的 gas 开销(约 2300 gas)
     * - 确保关键函数都添加此修饰器
     */
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    // ============ 公共函数 ============

    /**
     * @dev 返回当前所有者地址
     * @return 当前所有者的地址
     *
     * 【可见性】public view - 任何人都可以查询,不消耗 gas(链下调用)
     * 【virtual】允许子合约覆盖此函数,实现自定义所有权逻辑
     *
     * 【应用场景】
     * - 前端显示当前管理员
     * - 其他合约验证所有者身份
     * - 审计和安全检查
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev 放弃合约所有权
     *
     * 【效果】
     * - 将所有者设置为 address(0)
     * - 永久禁用所有 onlyOwner 函数
     * - 合约进入"无主"状态,无法再恢复控制
     *
     * 【使用场景】
     * - 项目完全去中心化后移除特权
     * - 确保合约参数不可再更改
     *
     * 【安全警告】
     * ⚠️ 这是不可逆操作!
     * ⚠️ 确保合约逻辑完善后再调用
     * ⚠️ 建议使用 Ownable2Step 进行两步确认
     *
     * 【示例】
     * // 放弃所有权前确保:
     * // 1. 所有参数已正确配置
     * // 2. 没有需要管理员干预的紧急功能
     * // 3. 已通过审计
     * ownable.renounceOwnership();
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @dev 将合约所有权转移给新账户
     * @param newOwner 新所有者地址
     *
     * 【访问控制】只有当前所有者可以调用
     *
     * 【安全检查】
     * - 拒绝转移给 address(0),防止意外丢失控制权
     *   (如需放弃所有权,应使用 renounceOwnership)
     *
     * 【使用场景】
     * - 多签钱包接管合约
     * - 转移给 DAO 治理合约
     * - 团队成员变更
     *
     * 【安全建议】
     * ⚠️ 转移前务必确认新地址正确,转移后立即失去控制
     * 💡 推荐使用 Ownable2Step,需要新所有者确认接受
     *
     * 【示例】
     * // 转移给多签钱包
     * ownable.transferOwnership(0x123...);
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        if (newOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(newOwner);
    }

    // ============ 内部函数 ============

    /**
     * @dev 内部函数:验证调用者是否为所有者
     *
     * 【工作原理】
     * 1. 获取当前所有者地址 (调用 owner())
     * 2. 获取消息发送者 (调用 _msgSender() 而非 msg.sender,支持元交易)
     * 3. 比较两者是否一致
     * 4. 不一致则 revert
     *
     * 【virtual】允许子合约自定义权限检查逻辑
     * 例如:添加紧急管理员、临时授权等
     *
     * 【为什么使用 _msgSender() 而非 msg.sender?】
     * - _msgSender() 来自 Context 合约
     * - 支持 ERC-2771 元交易(用户签名,第三方代付 gas)
     * - 如果不使用元交易,_msgSender() 等同于 msg.sender
     */
    function _checkOwner() internal view virtual {
        if (owner() != _msgSender()) {
            revert OwnableUnauthorizedAccount(_msgSender());
        }
    }

    /**
     * @dev 内部函数:执行所有权转移
     * @param newOwner 新所有者地址
     *
     * 【设计要点】
     * - internal 可见性:只能在合约内部调用,不对外暴露
     * - virtual:允许子合约覆盖,添加自定义逻辑(如转移费用、冷却期等)
     * - 无访问控制:调用者需自行确保安全性
     *
     * 【执行流程】
     * 1. 保存旧所有者地址
     * 2. 更新 _owner 为新地址
     * 3. 触发 OwnershipTransferred 事件
     *
     * 【为什么分离 public 和 internal 函数?】
     * - public transferOwnership: 包含权限检查和参数验证
     * - internal _transferOwnership: 纯粹的状态变更逻辑
     * - 便于构造函数和子合约复用核心逻辑
     *
     * 【子合约覆盖示例】
     * function _transferOwnership(address newOwner) internal virtual override {
     *     require(transferFee == 0 || msg.value >= transferFee, "Fee required");
     *     super._transferOwnership(newOwner);
     * }
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

/*
 * ============================================================
 *                      学习总结
 * ============================================================
 *
 * 【核心设计模式】
 * 1. 单一所有者模式 (Single Owner Pattern)
 * 2. 访问控制修饰器 (Access Control Modifier)
 * 3. 事件驱动通知 (Event-Driven Notification)
 *
 * 【安全机制】
 * ✅ 拒绝 address(0) 作为所有者,防止失控
 * ✅ 使用自定义错误节省 gas
 * ✅ 事件记录所有权变更,便于审计
 * ✅ 支持元交易 (通过 _msgSender())
 *
 * 【使用建议】
 * 📌 简单项目:直接使用 Ownable
 * 📌 关键项目:使用 Ownable2Step 增加安全性
 * 📌 复杂权限:考虑 AccessControl 多角色管理
 *
 * 【常见陷阱】
 * ❌ 忘记添加 onlyOwner 修饰器
 * ❌ 转移所有权到错误地址(使用 Ownable2Step 避免)
 * ❌ 过早放弃所有权(确保所有功能测试完成)
 *
 * 【进阶阅读】
 * - Ownable2Step.sol - 两步所有权转移
 * - AccessControl.sol - 基于角色的访问控制
 * - AccessManager.sol - 企业级权限管理
 */
