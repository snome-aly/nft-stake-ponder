// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (access/IAccessControl.sol)

pragma solidity ^0.8.20;

/**
 * @dev AccessControl 的外部接口定义
 *
 * 【设计目的】
 * - 提供标准化的基于角色的访问控制 (RBAC) 接口
 * - 支持 ERC165 接口检测,其他合约可以查询是否支持 AccessControl
 * - 定义了角色管理的标准方法和事件
 *
 * 【核心概念】
 * - **角色 (Role)**: 用 bytes32 标识的权限组 (如 MINTER_ROLE, PAUSER_ROLE)
 * - **账户 (Account)**: 可以被授予或撤销角色的地址
 * - **管理员角色 (Admin Role)**: 每个角色都有一个管理员角色,负责授予/撤销该角色
 * - **默认管理员**: DEFAULT_ADMIN_ROLE (bytes32(0)) 是所有角色的初始管理员
 *
 * 【角色层级结构】
 * DEFAULT_ADMIN_ROLE
 *   ├─> PAUSER_ROLE (可以暂停合约)
 *   └─> MINTER_ROLE (可以铸造代币)
 *         └─> SUB_MINTER_ROLE (子铸造角色,由 MINTER_ROLE 管理)
 *
 * 【为什么使用接口?】
 * ✅ 合约可以通过接口与 AccessControl 交互,无需了解实现细节
 * ✅ 支持 ERC165 接口检测: supportsInterface(type(IAccessControl).interfaceId)
 * ✅ 便于测试和 mock
 * ✅ 定义标准事件和错误,确保不同实现的一致性
 *
 * 【使用场景】
 * ```solidity
 * // 检查合约是否支持 AccessControl
 * if (target.supportsInterface(type(IAccessControl).interfaceId)) {
 *     IAccessControl(target).grantRole(MINTER_ROLE, minter);
 * }
 * ```
 */
interface IAccessControl {
    // ============ 错误定义 ============

    /**
     * @dev 错误:账户缺少所需的角色
     * @param account 尝试执行操作的账户地址
     * @param neededRole 执行操作所需的角色 (bytes32)
     *
     * 【触发场景】
     * - 账户调用 onlyRole(MINTER_ROLE) 修饰的函数,但该账户没有 MINTER_ROLE
     * - 账户尝试授予角色,但没有该角色的管理员权限
     *
     * 【示例】
     * // 用户 0x123 尝试铸造,但没有 MINTER_ROLE
     * error AccessControlUnauthorizedAccount(0x123, MINTER_ROLE)
     *
     * 【前端处理】
     * ```javascript
     * try {
     *   await contract.mint(to, amount);
     * } catch (error) {
     *   if (error.name === "AccessControlUnauthorizedAccount") {
     *     alert(`你缺少角色: ${error.args.neededRole}`);
     *   }
     * }
     * ```
     */
    error AccessControlUnauthorizedAccount(address account, bytes32 neededRole);

    /**
     * @dev 错误:调用者身份确认失败
     *
     * 【触发场景】
     * 主要用于 renounceRole() 函数,要求调用者必须传入自己的地址作为确认
     * 防止误操作或被欺骗放弃角色
     *
     * 【与 AccessControlUnauthorizedAccount 的区别】
     * - AccessControlUnauthorizedAccount: 缺少角色权限
     * - AccessControlBadConfirmation: 身份确认参数错误
     *
     * 【示例】
     * // ❌ 错误:传入的确认地址不是自己
     * contract.renounceRole(MINTER_ROLE, 0xOtherAddress);
     * // 触发 AccessControlBadConfirmation
     *
     * // ✅ 正确:传入自己的地址
     * contract.renounceRole(MINTER_ROLE, msg.sender);
     *
     * 【设计意图】
     * 这是一个安全机制,防止:
     * 1. 调用错误的函数
     * 2. 被钓鱼网站欺骗调用 renounceRole
     * 3. 前端 bug 导致误调用
     */
    error AccessControlBadConfirmation();

    // ============ 事件定义 ============

    /**
     * @dev 事件:角色的管理员角色已更改
     * @param role 被更改的角色 (indexed,可用于过滤)
     * @param previousAdminRole 之前的管理员角色 (indexed)
     * @param newAdminRole 新的管理员角色 (indexed)
     *
     * 【触发场景】
     * 调用 _setRoleAdmin(role, newAdminRole) 时触发
     *
     * 【重要说明】
     * DEFAULT_ADMIN_ROLE (bytes32(0)) 是所有角色的默认管理员,
     * 但初始化时不会触发此事件
     *
     * 【角色管理层级示例】
     * ```solidity
     * // 设置 MINTER_ROLE 的管理员为 ADMIN_ROLE
     * _setRoleAdmin(MINTER_ROLE, ADMIN_ROLE);
     * // 触发: RoleAdminChanged(MINTER_ROLE, DEFAULT_ADMIN_ROLE, ADMIN_ROLE)
     *
     * // 现在只有 ADMIN_ROLE 可以授予/撤销 MINTER_ROLE
     * ```
     *
     * 【应用场景】
     * - 建立复杂的权限层级结构
     * - 委托角色管理权限
     * - 审计权限结构变更
     *
     * 【链下监听】
     * ```javascript
     * contract.on("RoleAdminChanged", (role, prevAdmin, newAdmin) => {
     *     console.log(`角色 ${role} 的管理员从 ${prevAdmin} 变更为 ${newAdmin}`);
     * });
     * ```
     */
    event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole);

    /**
     * @dev 事件:账户被授予角色
     * @param role 被授予的角色 (indexed,可用于过滤)
     * @param account 被授予角色的账户 (indexed,可用于过滤)
     * @param sender 执行授予操作的账户 (indexed,通常是管理员)
     *
     * 【触发场景】
     * - 调用 grantRole(role, account) 且账户之前没有该角色
     * - 调用 _grantRole(role, account) (内部函数)
     *
     * 【不触发场景】
     * - 账户已经拥有该角色(重复授予不会触发事件)
     *
     * 【sender 说明】
     * - 通过 grantRole() 授予: sender 是拥有管理员角色的调用者
     * - 通过 _setupRole() 授予 (已弃用): sender 可能是合约自身
     *
     * 【示例】
     * // 管理员授予铸造权限
     * contract.grantRole(MINTER_ROLE, 0xMinter);
     * // 触发: RoleGranted(MINTER_ROLE, 0xMinter, msg.sender)
     *
     * 【应用场景】
     * - 实时通知用户权限变更
     * - 审计和合规记录
     * - 前端更新用户权限状态
     *
     * 【链下监听】
     * ```javascript
     * // 监听特定角色的授予
     * contract.on(contract.filters.RoleGranted(MINTER_ROLE), (role, account, sender) => {
     *     console.log(`${account} 被授予铸造权限,授予者: ${sender}`);
     * });
     * ```
     */
    event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);

    /**
     * @dev 事件:账户被撤销角色
     * @param role 被撤销的角色 (indexed,可用于过滤)
     * @param account 被撤销角色的账户 (indexed,可用于过滤)
     * @param sender 执行撤销操作的账户 (indexed)
     *
     * 【触发场景】
     * - 调用 revokeRole(role, account) 且账户之前拥有该角色
     * - 调用 renounceRole(role, callerConfirmation) 且调用者拥有该角色
     *
     * 【不触发场景】
     * - 账户本来就没有该角色(重复撤销不会触发事件)
     *
     * 【sender 区分】
     * - revokeRole: sender 是拥有管理员角色的调用者 (强制撤销)
     * - renounceRole: sender 是角色持有者自己 (主动放弃)
     *
     * 【示例 1: 管理员撤销】
     * // 管理员撤销铸造权限
     * contract.revokeRole(MINTER_ROLE, 0xMinter);
     * // 触发: RoleRevoked(MINTER_ROLE, 0xMinter, 管理员地址)
     *
     * 【示例 2: 主动放弃】
     * // 用户主动放弃角色 (例如私钥泄露时)
     * contract.renounceRole(MINTER_ROLE, msg.sender);
     * // 触发: RoleRevoked(MINTER_ROLE, msg.sender, msg.sender)
     *
     * 【应用场景】
     * - 员工离职撤销权限
     * - 私钥泄露紧急撤销
     * - 审计权限变更历史
     *
     * 【链下监听】
     * ```javascript
     * contract.on("RoleRevoked", (role, account, sender) => {
     *     if (account === sender) {
     *         console.log(`${account} 主动放弃角色 ${role}`);
     *     } else {
     *         console.log(`${sender} 撤销了 ${account} 的角色 ${role}`);
     *     }
     * });
     * ```
     */
    event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);

    // ============ 查询函数 ============

    /**
     * @dev 检查账户是否拥有指定角色
     * @param role 角色标识符 (bytes32)
     * @param account 要检查的账户地址
     * @return 如果账户拥有该角色返回 true,否则返回 false
     *
     * 【可见性】external view - 链下调用免费,链上调用需 gas
     *
     * 【使用场景】
     * 1. 前端查询用户权限,显示可用功能
     * 2. 其他合约验证地址权限
     * 3. 审计工具检查权限分配
     *
     * 【示例】
     * // 前端检查用户是否可以铸造
     * const canMint = await contract.hasRole(MINTER_ROLE, userAddress);
     * if (canMint) {
     *     showMintButton();
     * }
     *
     * // 合约内检查
     * function safeMint(address to) external {
     *     require(hasRole(MINTER_ROLE, msg.sender), "Not a minter");
     *     _mint(to);
     * }
     *
     * 【推荐做法】
     * ✅ 在合约内使用修饰器 onlyRole(MINTER_ROLE) 更简洁
     * ✅ hasRole 主要用于查询和条件判断
     */
    function hasRole(bytes32 role, address account) external view returns (bool);

    /**
     * @dev 获取角色的管理员角色
     * @param role 要查询的角色
     * @return 管理该角色的管理员角色标识符
     *
     * 【返回值说明】
     * - 默认情况下,所有角色的管理员都是 DEFAULT_ADMIN_ROLE (bytes32(0))
     * - 可以通过 _setRoleAdmin() 更改角色的管理员
     *
     * 【使用场景】
     * 1. 查询权限层级结构
     * 2. 验证是否有权授予某个角色
     * 3. 构建权限管理 UI
     *
     * 【示例】
     * // 查询谁可以管理 MINTER_ROLE
     * bytes32 adminRole = contract.getRoleAdmin(MINTER_ROLE);
     * // 默认返回 DEFAULT_ADMIN_ROLE
     *
     * // 检查自己是否可以授予 MINTER_ROLE
     * bytes32 adminRole = contract.getRoleAdmin(MINTER_ROLE);
     * bool canGrant = contract.hasRole(adminRole, msg.sender);
     *
     * 【权限层级示例】
     * DEFAULT_ADMIN_ROLE (管理所有角色)
     *   ├─> OPERATOR_ROLE (管理操作员)
     *   └─> MINTER_ROLE (管理铸造者)
     *
     * getRoleAdmin(MINTER_ROLE) → DEFAULT_ADMIN_ROLE
     * getRoleAdmin(OPERATOR_ROLE) → DEFAULT_ADMIN_ROLE
     */
    function getRoleAdmin(bytes32 role) external view returns (bytes32);

    // ============ 管理函数 ============

    /**
     * @dev 授予账户指定角色
     * @param role 要授予的角色
     * @param account 接收角色的账户
     *
     * 【访问控制】
     * 只有拥有该角色管理员权限的账户可以调用
     * 例如: 要授予 MINTER_ROLE,调用者必须拥有 getRoleAdmin(MINTER_ROLE)
     *
     * 【幂等性】
     * - 如果账户已经拥有该角色,不会重复授予,也不会触发事件
     * - 多次调用是安全的
     *
     * 【事件】
     * 首次授予时触发 RoleGranted 事件
     *
     * 【示例】
     * // 管理员授予铸造权限
     * contract.grantRole(MINTER_ROLE, 0xMinter);
     *
     * // 批量授予
     * for (address minter of minters) {
     *     contract.grantRole(MINTER_ROLE, minter);
     * }
     *
     * 【安全注意事项】
     * ⚠️ 确保 DEFAULT_ADMIN_ROLE 只授予给可信地址
     * ⚠️ 考虑使用多签钱包持有管理员角色
     * ⚠️ 定期审计角色分配
     *
     * 【常见错误】
     * ❌ 调用者没有管理员权限
     *    → AccessControlUnauthorizedAccount(caller, adminRole)
     */
    function grantRole(bytes32 role, address account) external;

    /**
     * @dev 撤销账户的指定角色
     * @param role 要撤销的角色
     * @param account 被撤销角色的账户
     *
     * 【访问控制】
     * 只有拥有该角色管理员权限的账户可以调用
     *
     * 【幂等性】
     * - 如果账户本来就没有该角色,不会执行操作,也不会触发事件
     * - 多次调用是安全的
     *
     * 【事件】
     * 成功撤销时触发 RoleRevoked 事件
     *
     * 【与 renounceRole 的区别】
     * - revokeRole: 管理员强制撤销他人角色
     * - renounceRole: 用户主动放弃自己的角色
     *
     * 【示例】
     * // 管理员撤销铸造权限
     * contract.revokeRole(MINTER_ROLE, 0xMinter);
     *
     * // 紧急情况:撤销所有铸造者
     * for (address minter of getAllMintersFromEvent()) {
     *     contract.revokeRole(MINTER_ROLE, minter);
     * }
     *
     * 【使用场景】
     * - 员工离职
     * - 账户被黑客攻击
     * - 合约升级前回收权限
     * - 定期权限审查
     *
     * 【安全建议】
     * 💡 建立撤销流程和审批机制
     * 💡 记录撤销原因(链下数据库)
     * 💡 通知被撤销用户
     */
    function revokeRole(bytes32 role, address account) external;

    /**
     * @dev 调用者主动放弃自己的角色
     * @param role 要放弃的角色
     * @param callerConfirmation 调用者地址,用于确认操作
     *
     * 【访问控制】
     * 任何人都可以调用,但只能放弃自己的角色
     *
     * 【安全机制】
     * 要求传入的 callerConfirmation 必须等于 msg.sender,防止:
     * 1. 调用错误的函数
     * 2. 被钓鱼攻击欺骗
     * 3. 前端 bug 导致误操作
     *
     * 【事件】
     * 成功放弃时触发 RoleRevoked 事件,sender 和 account 都是调用者
     *
     * 【使用场景】
     * - 私钥泄露,紧急放弃权限
     * - 职责变更,主动交出权限
     * - 合约测试后清理权限
     * - 去中心化项目中团队成员主动退出
     *
     * 【示例】
     * // ✅ 正确用法:放弃自己的铸造权限
     * contract.renounceRole(MINTER_ROLE, msg.sender);
     *
     * // ❌ 错误用法:传入其他地址
     * contract.renounceRole(MINTER_ROLE, otherAddress);
     * // 会 revert AccessControlBadConfirmation
     *
     * // ❌ 错误用法:尝试放弃他人的角色
     * contract.renounceRole(MINTER_ROLE, victimAddress);
     * // 会 revert AccessControlBadConfirmation
     *
     * 【与 revokeRole 的对比】
     *
     * | 特性 | renounceRole | revokeRole |
     * |------|--------------|------------|
     * | 调用者 | 角色持有者 | 角色管理员 |
     * | 目标 | 只能是自己 | 可以是任何人 |
     * | 用途 | 主动放弃 | 强制撤销 |
     * | 确认参数 | 需要 | 不需要 |
     *
     * 【最佳实践】
     * ✅ 在智能合约钱包中实现此功能,方便紧急响应
     * ✅ 提供清晰的前端 UI,避免用户误操作
     * ✅ 放弃前弹出二次确认
     *
     * 【安全警告】
     * ⚠️ 放弃 DEFAULT_ADMIN_ROLE 可能导致合约失去管理能力
     * ⚠️ 确保有其他管理员或恢复机制
     */
    function renounceRole(bytes32 role, address callerConfirmation) external;
}

/*
 * ============================================================
 *                      学习总结
 * ============================================================
 *
 * 【RBAC 核心概念】
 * 1. 角色 (Role): 权限的集合,用 bytes32 标识
 * 2. 账户 (Account): 可以被分配角色的地址
 * 3. 管理员角色 (Admin Role): 管理其他角色的角色
 * 4. 默认管理员: DEFAULT_ADMIN_ROLE,管理所有角色
 *
 * 【角色生命周期】
 * 定义 → 授予 → 使用 → 撤销/放弃
 *   ↓      ↓      ↓       ↓
 * bytes32  grant  check   revoke/renounce
 *
 * 【权限检查流程】
 * 1. 调用者执行操作
 * 2. onlyRole(ROLE) 修饰器检查
 * 3. hasRole(ROLE, caller) 验证
 * 4. 通过则执行,否则 revert
 *
 * 【角色管理层级】
 * DEFAULT_ADMIN_ROLE (超级管理员)
 *   ├─> 可以授予/撤销所有角色
 *   ├─> 可以设置角色的管理员
 *   └─> 通常只授予给多签钱包或 DAO
 *
 * CUSTOM_ADMIN_ROLE (自定义管理员)
 *   ├─> 只能管理特定角色
 *   └─> 通过 _setRoleAdmin 设置
 *
 * OPERATOR_ROLE (操作员)
 *   ├─> 执行特定操作
 *   └─> 不能管理其他角色
 *
 * 【事件驱动架构】
 * RoleGranted → 链下监听 → 更新权限缓存 → UI 更新
 * RoleRevoked → 链下监听 → 通知用户 → 审计记录
 * RoleAdminChanged → 链下监听 → 更新权限树 → 告警
 *
 * 【安全最佳实践】
 * ✅ DEFAULT_ADMIN_ROLE 必须由多签钱包持有
 * ✅ 定期审计角色分配
 * ✅ 使用 renounceRole 需二次确认
 * ✅ 关键角色变更应有时间锁
 * ✅ 记录所有权限变更原因(链下)
 *
 * 【常见错误】
 * ❌ 忘记授予 DEFAULT_ADMIN_ROLE
 * ❌ 将敏感角色授予 EOA 而非多签
 * ❌ 没有角色恢复机制
 * ❌ renounceRole 时传错地址
 *
 * 【进阶阅读】
 * - AccessControl.sol - 接口的完整实现
 * - AccessControlEnumerable.sol - 可枚举的角色成员
 * - AccessControlDefaultAdminRules.sol - 增强的管理员规则
 * - AccessManager.sol - 企业级权限管理系统
 */
