// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (access/AccessControl.sol)

pragma solidity ^0.8.20;

import {IAccessControl} from "./IAccessControl.sol";
import {Context} from "../utils/Context.sol";
import {ERC165} from "../utils/introspection/ERC165.sol";

/**
 * @dev 基于角色的访问控制 (RBAC) 合约模块
 *
 * 【核心功能】
 * 允许子合约实现基于角色的访问控制机制
 * 这是一个轻量级版本,不支持链上枚举角色成员(只能通过事件日志查询)
 * 如需链上枚举,请使用 {AccessControlEnumerable}
 *
 * 【角色定义方式】
 * 角色用 bytes32 标识符表示,应该在外部 API 中公开且保持唯一
 * 最佳实践是使用 `public constant` 哈希摘要:
 *
 * ```solidity
 * bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
 * bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
 * bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
 * ```
 *
 * 【使用角色限制函数访问】
 * ```solidity
 * function mint(address to, uint256 amount) public {
 *     require(hasRole(MINTER_ROLE, msg.sender), "Must have minter role");
 *     _mint(to, amount);
 * }
 *
 * // 或使用修饰器(推荐)
 * function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
 *     _mint(to, amount);
 * }
 * ```
 *
 * 【角色管理】
 * - 角色可以通过 {grantRole} 动态授予
 * - 角色可以通过 {revokeRole} 动态撤销
 * - 每个角色都有一个关联的管理员角色
 * - 只有拥有管理员角色的账户可以调用 {grantRole} 和 {revokeRole}
 *
 * 【默认管理员】
 * 默认情况下,所有角色的管理员都是 `DEFAULT_ADMIN_ROLE`
 * 这意味着只有拥有此角色的账户才能授予或撤销其他角色
 * 可以使用 {_setRoleAdmin} 创建更复杂的角色关系
 *
 * 【安全警告】
 * ⚠️ `DEFAULT_ADMIN_ROLE` 也是它自己的管理员:它有权授予和撤销此角色
 * ⚠️ 应对被授予此角色的账户采取额外的安全预防措施
 * 💡 推荐使用 {AccessControlDefaultAdminRules} 为此角色强制执行额外的安全措施
 *
 * 【继承关系】
 * AccessControl
 *   ├── Context (提供 _msgSender() 和 _msgData())
 *   ├── IAccessControl (接口定义)
 *   └── ERC165 (接口检测)
 *
 * 【完整示例】
 * ```solidity
 * contract MyToken is ERC20, AccessControl {
 *     bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
 *     bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
 *
 *     constructor() ERC20("MyToken", "MTK") {
 *         // 授予部署者默认管理员角色
 *         _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
 *         // 同时授予铸造权限
 *         _grantRole(MINTER_ROLE, msg.sender);
 *     }
 *
 *     function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
 *         _mint(to, amount);
 *     }
 *
 *     function burn(address from, uint256 amount) public onlyRole(BURNER_ROLE) {
 *         _burn(from, amount);
 *     }
 * }
 * ```
 */
abstract contract AccessControl is Context, IAccessControl, ERC165 {
    // ============ 数据结构 ============

    /**
     * @dev 角色数据结构
     *
     * 【字段说明】
     * - hasRole: 地址到布尔值的映射,记录哪些地址拥有此角色
     * - adminRole: 此角色的管理员角色标识符
     *
     * 【存储优化】
     * 使用嵌套映射而非数组,节省 gas:
     * - 检查角色: O(1) 时间复杂度
     * - 授予角色: O(1) 时间复杂度
     * - 撤销角色: O(1) 时间复杂度
     *
     * 【取舍】
     * ✅ 高效的读写操作
     * ❌ 无法链上枚举角色成员(需通过事件查询)
     * 💡 如需枚举,使用 AccessControlEnumerable
     */
    struct RoleData {
        mapping(address account => bool) hasRole;  // 账户 → 是否拥有角色
        bytes32 adminRole;                          // 管理此角色的管理员角色
    }

    // ============ 状态变量 ============

    /**
     * @dev 角色数据存储
     *
     * 【映射结构】
     * bytes32 (角色ID) => RoleData (角色数据)
     *
     * 【示例】
     * _roles[MINTER_ROLE].hasRole[0xAlice] = true  // Alice 拥有铸造权限
     * _roles[MINTER_ROLE].adminRole = DEFAULT_ADMIN_ROLE  // 默认管理员管理铸造角色
     *
     * 【存储布局】
     * private 可见性:只能通过公共函数访问,便于子合约覆盖逻辑
     */
    mapping(bytes32 role => RoleData) private _roles;

    /**
     * @dev 默认管理员角色
     *
     * 【值】bytes32(0) = 0x0000000000000000000000000000000000000000000000000000000000000000
     *
     * 【特殊性质】
     * 1. 是所有角色的默认管理员(除非通过 _setRoleAdmin 修改)
     * 2. 也是它自己的管理员(可以授予/撤销自己)
     * 3. 拥有此角色的账户拥有最高权限
     *
     * 【安全建议】
     * ⚠️ 只授予给多签钱包或 DAO 治理合约
     * ⚠️ 定期审计拥有此角色的地址
     * ⚠️ 考虑使用 AccessControlDefaultAdminRules 增加转移限制
     *
     * 【使用示例】
     * constructor() {
     *     _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
     * }
     */
    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;

    // ============ 修饰器 ============

    /**
     * @dev 修饰器:检查调用者是否拥有指定角色
     * @param role 要求的角色
     *
     * 【工作原理】
     * 1. 调用 _checkRole(role) 验证 msg.sender
     * 2. 如果验证失败,revert AccessControlUnauthorizedAccount
     * 3. 如果验证通过,执行被修饰的函数 (_; 的位置)
     *
     * 【使用示例】
     * function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
     *     _mint(to, amount);
     * }
     *
     * function pause() external onlyRole(PAUSER_ROLE) {
     *     _pause();
     * }
     *
     * 【Gas 优化】
     * 每次调用约消耗 2500-3000 gas (角色检查 + 事件)
     * 如需极致优化,可在函数内手动调用 _checkRole
     *
     * 【错误处理】
     * 调用者没有角色时触发:
     * revert AccessControlUnauthorizedAccount(caller, role)
     */
    modifier onlyRole(bytes32 role) {
        _checkRole(role);
        _;
    }

    // ============ ERC165 接口检测 ============

    /**
     * @dev 检查合约是否支持指定接口
     * @param interfaceId 接口标识符 (bytes4)
     * @return 是否支持该接口
     *
     * 【支持的接口】
     * - IAccessControl: 0x7965db0b
     * - IERC165: 0x01ffc9a7
     *
     * 【使用场景】
     * 其他合约可以检测目标合约是否支持 AccessControl:
     *
     * ```solidity
     * if (target.supportsInterface(type(IAccessControl).interfaceId)) {
     *     IAccessControl(target).grantRole(MINTER_ROLE, newMinter);
     * }
     * ```
     *
     * 【ERC165 标准】
     * 允许合约声明它支持哪些接口,避免盲目调用不支持的函数
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IAccessControl).interfaceId || super.supportsInterface(interfaceId);
    }

    // ============ 查询函数 ============

    /**
     * @dev 检查账户是否拥有指定角色
     * @param role 角色标识符
     * @param account 要检查的账户地址
     * @return 账户是否拥有该角色
     *
     * 【实现细节】
     * 直接查询嵌套映射: _roles[role].hasRole[account]
     * O(1) 时间复杂度,非常高效
     *
     * 【使用场景】
     * 1. 前端查询用户权限状态
     * 2. 合约内条件判断
     * 3. 审计工具检查权限分配
     *
     * 【示例】
     * // 前端查询
     * const isMinter = await contract.hasRole(MINTER_ROLE, userAddress);
     *
     * // 合约内使用
     * if (hasRole(PAUSER_ROLE, operator)) {
     *     _pause();
     * }
     *
     * 【链下查询】
     * view 函数,链下调用免费
     */
    function hasRole(bytes32 role, address account) public view virtual returns (bool) {
        return _roles[role].hasRole[account];
    }

    /**
     * @dev 获取角色的管理员角色
     * @param role 要查询的角色
     * @return 管理该角色的管理员角色标识符
     *
     * 【默认值】
     * 如果没有通过 _setRoleAdmin 设置,返回 bytes32(0) (即 DEFAULT_ADMIN_ROLE)
     *
     * 【使用场景】
     * 1. 查询谁可以管理某个角色
     * 2. 验证授予权限
     * 3. 构建权限树
     *
     * 【示例】
     * bytes32 adminRole = getRoleAdmin(MINTER_ROLE);
     * // 返回 DEFAULT_ADMIN_ROLE 或自定义的管理员角色
     *
     * 【权限验证链】
     * grantRole(MINTER_ROLE, newMinter)
     *   → 检查 msg.sender 是否拥有 getRoleAdmin(MINTER_ROLE)
     *   → 如果是 DEFAULT_ADMIN_ROLE,检查是否拥有该角色
     */
    function getRoleAdmin(bytes32 role) public view virtual returns (bytes32) {
        return _roles[role].adminRole;
    }

    // ============ 公共管理函数 ============

    /**
     * @dev 授予账户指定角色
     * @param role 要授予的角色
     * @param account 接收角色的账户
     *
     * 【访问控制】
     * 只有拥有该角色管理员权限的账户可以调用
     * 修饰器: onlyRole(getRoleAdmin(role))
     *
     * 【执行流程】
     * 1. 验证调用者拥有管理员角色
     * 2. 调用 _grantRole(role, account)
     * 3. 如果账户之前没有该角色,触发 RoleGranted 事件
     *
     * 【示例】
     * // DEFAULT_ADMIN_ROLE 持有者授予铸造权限
     * contract.grantRole(MINTER_ROLE, 0xNewMinter);
     *
     * // 批量授予
     * for (address operator of operators) {
     *     contract.grantRole(OPERATOR_ROLE, operator);
     * }
     *
     * 【幂等性】
     * 重复授予不会报错,但不会触发事件
     *
     * 【Gas 消耗】
     * - 首次授予: ~50,000 gas (存储写入 + 事件)
     * - 重复授予: ~25,000 gas (只检查,无状态变更)
     */
    function grantRole(bytes32 role, address account) public virtual onlyRole(getRoleAdmin(role)) {
        _grantRole(role, account);
    }

    /**
     * @dev 撤销账户的指定角色
     * @param role 要撤销的角色
     * @param account 被撤销角色的账户
     *
     * 【访问控制】
     * 只有拥有该角色管理员权限的账户可以调用
     * 修饰器: onlyRole(getRoleAdmin(role))
     *
     * 【执行流程】
     * 1. 验证调用者拥有管理员角色
     * 2. 调用 _revokeRole(role, account)
     * 3. 如果账户之前拥有该角色,触发 RoleRevoked 事件
     *
     * 【示例】
     * // 管理员撤销铸造权限
     * contract.revokeRole(MINTER_ROLE, 0xOldMinter);
     *
     * // 紧急情况批量撤销
     * for (address compromised of compromisedAccounts) {
     *     contract.revokeRole(MINTER_ROLE, compromised);
     * }
     *
     * 【幂等性】
     * 重复撤销不会报错,但不会触发事件
     *
     * 【使用场景】
     * - 员工离职
     * - 账户被黑
     * - 权限调整
     * - 定期审计后清理
     */
    function revokeRole(bytes32 role, address account) public virtual onlyRole(getRoleAdmin(role)) {
        _revokeRole(role, account);
    }

    /**
     * @dev 调用者主动放弃自己的角色
     * @param role 要放弃的角色
     * @param callerConfirmation 调用者地址,用于确认操作
     *
     * 【访问控制】
     * 无限制,但只能放弃自己的角色
     *
     * 【安全机制】
     * 要求 callerConfirmation == _msgSender(),防止:
     * 1. 误调用
     * 2. 钓鱼攻击
     * 3. 前端 bug
     *
     * 【执行流程】
     * 1. 验证 callerConfirmation == _msgSender()
     * 2. 如果不匹配,revert AccessControlBadConfirmation
     * 3. 调用 _revokeRole(role, callerConfirmation)
     * 4. 触发 RoleRevoked 事件,sender 和 account 都是调用者
     *
     * 【使用场景】
     * - 私钥泄露,紧急放弃权限
     * - 职责变更
     * - 项目去中心化,团队成员退出
     *
     * 【示例】
     * // ✅ 正确:放弃自己的铸造权限
     * contract.renounceRole(MINTER_ROLE, msg.sender);
     *
     * // ❌ 错误:尝试放弃他人角色
     * contract.renounceRole(MINTER_ROLE, otherAddress);
     * // revert AccessControlBadConfirmation()
     *
     * 【危险警告】
     * ⚠️ 放弃 DEFAULT_ADMIN_ROLE 可能导致合约失去管理能力
     * ⚠️ 确保有其他管理员或恢复机制
     *
     * 【前端实现建议】
     * ```javascript
     * // 添加二次确认
     * if (confirm("确定要放弃此权限吗?此操作不可逆!")) {
     *     await contract.renounceRole(MINTER_ROLE, await signer.getAddress());
     * }
     * ```
     */
    function renounceRole(bytes32 role, address callerConfirmation) public virtual {
        if (callerConfirmation != _msgSender()) {
            revert AccessControlBadConfirmation();
        }

        _revokeRole(role, callerConfirmation);
    }

    // ============ 内部函数 ============

    /**
     * @dev 内部函数:验证调用者是否拥有指定角色
     * @param role 要验证的角色
     *
     * 【工作原理】
     * 调用 _checkRole(role, _msgSender())
     *
     * 【使用 _msgSender() 的原因】
     * - 支持元交易 (ERC-2771)
     * - 在普通交易中等同于 msg.sender
     * - 提供更好的扩展性
     *
     * 【virtual】
     * 允许子合约覆盖,实现自定义验证逻辑
     * 例如:添加临时权限、紧急模式等
     *
     * 【使用场景】
     * 主要由 onlyRole 修饰器调用
     */
    function _checkRole(bytes32 role) internal view virtual {
        _checkRole(role, _msgSender());
    }

    /**
     * @dev 内部函数:验证指定账户是否拥有角色
     * @param role 要验证的角色
     * @param account 要验证的账户
     *
     * 【工作原理】
     * 1. 调用 hasRole(role, account)
     * 2. 如果返回 false,revert AccessControlUnauthorizedAccount
     *
     * 【virtual】
     * 允许子合约自定义验证逻辑
     *
     * 【使用场景】
     * - onlyRole 修饰器
     * - 自定义权限检查
     * - 复杂的权限组合验证
     *
     * 【示例扩展】
     * ```solidity
     * function _checkRole(bytes32 role, address account) internal view virtual override {
     *     // 紧急模式:暂停期间只允许管理员
     *     if (paused() && role != DEFAULT_ADMIN_ROLE) {
     *         revert("Contract paused");
     *     }
     *     super._checkRole(role, account);
     * }
     * ```
     */
    function _checkRole(bytes32 role, address account) internal view virtual {
        if (!hasRole(role, account)) {
            revert AccessControlUnauthorizedAccount(account, role);
        }
    }

    /**
     * @dev 设置角色的管理员角色
     * @param role 要设置的角色
     * @param adminRole 新的管理员角色
     *
     * 【访问控制】
     * internal - 只能在合约内部或子合约中调用
     *
     * 【执行流程】
     * 1. 获取旧的管理员角色
     * 2. 更新 _roles[role].adminRole = adminRole
     * 3. 触发 RoleAdminChanged 事件
     *
     * 【使用场景】
     * 建立复杂的权限层级结构
     *
     * 【示例】
     * ```solidity
     * constructor() {
     *     // 创建操作员管理角色
     *     bytes32 OPERATOR_ADMIN = keccak256("OPERATOR_ADMIN");
     *
     *     // 设置 OPERATOR_ADMIN 管理 OPERATOR_ROLE
     *     _setRoleAdmin(OPERATOR_ROLE, OPERATOR_ADMIN);
     *
     *     // 授予自己操作员管理权限
     *     _grantRole(OPERATOR_ADMIN, msg.sender);
     *
     *     // 现在可以授予操作员角色
     *     _grantRole(OPERATOR_ROLE, operator1);
     * }
     * ```
     *
     * 【权限树示例】
     * DEFAULT_ADMIN_ROLE
     *   ├─> OPERATOR_ADMIN (管理 OPERATOR_ROLE)
     *   │     └─> OPERATOR_ROLE
     *   └─> MINTER_ADMIN (管理 MINTER_ROLE)
     *         └─> MINTER_ROLE
     *
     * 【注意事项】
     * ⚠️ 默认情况下所有角色的管理员都是 DEFAULT_ADMIN_ROLE
     * ⚠️ 只在需要委托管理权限时使用
     */
    function _setRoleAdmin(bytes32 role, bytes32 adminRole) internal virtual {
        bytes32 previousAdminRole = getRoleAdmin(role);
        _roles[role].adminRole = adminRole;
        emit RoleAdminChanged(role, previousAdminRole, adminRole);
    }

    /**
     * @dev 内部函数:尝试授予角色
     * @param role 要授予的角色
     * @param account 接收角色的账户
     * @return 是否成功授予(false 表示账户已有该角色)
     *
     * 【访问控制】
     * internal - 无访问限制,调用者需自行确保安全性
     *
     * 【执行流程】
     * 1. 检查账户是否已有该角色
     * 2. 如果没有:
     *    - 设置 _roles[role].hasRole[account] = true
     *    - 触发 RoleGranted 事件
     *    - 返回 true
     * 3. 如果已有:
     *    - 不做任何操作
     *    - 返回 false
     *
     * 【幂等性】
     * 重复调用是安全的,不会重复触发事件
     *
     * 【使用场景】
     * - grantRole() 调用此函数
     * - 构造函数初始化角色
     * - 自定义授予逻辑
     *
     * 【示例】
     * ```solidity
     * constructor() {
     *     // 初始化时授予管理员角色
     *     _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
     *     _grantRole(MINTER_ROLE, msg.sender);
     *     _grantRole(PAUSER_ROLE, msg.sender);
     * }
     *
     * function setupOperators(address[] calldata operators) external onlyRole(DEFAULT_ADMIN_ROLE) {
     *     for (uint256 i = 0; i < operators.length; i++) {
     *         _grantRole(OPERATOR_ROLE, operators[i]);
     *     }
     * }
     * ```
     *
     * 【virtual】
     * 允许子合约覆盖,添加自定义逻辑:
     * - 授予时收取费用
     * - 记录授予时间
     * - 限制最大成员数
     * - 添加审计日志
     */
    function _grantRole(bytes32 role, address account) internal virtual returns (bool) {
        if (!hasRole(role, account)) {
            _roles[role].hasRole[account] = true;
            emit RoleGranted(role, account, _msgSender());
            return true;
        } else {
            return false;
        }
    }

    /**
     * @dev 内部函数:尝试撤销角色
     * @param role 要撤销的角色
     * @param account 被撤销角色的账户
     * @return 是否成功撤销(false 表示账户本来就没有该角色)
     *
     * 【访问控制】
     * internal - 无访问限制,调用者需自行确保安全性
     *
     * 【执行流程】
     * 1. 检查账户是否拥有该角色
     * 2. 如果拥有:
     *    - 设置 _roles[role].hasRole[account] = false
     *    - 触发 RoleRevoked 事件
     *    - 返回 true
     * 3. 如果没有:
     *    - 不做任何操作
     *    - 返回 false
     *
     * 【幂等性】
     * 重复调用是安全的,不会重复触发事件
     *
     * 【使用场景】
     * - revokeRole() 调用此函数
     * - renounceRole() 调用此函数
     * - 自定义撤销逻辑
     *
     * 【示例】
     * ```solidity
     * // 紧急暂停:撤销所有操作员权限
     * function emergencyPause(address[] calldata operators) external onlyRole(DEFAULT_ADMIN_ROLE) {
     *     for (uint256 i = 0; i < operators.length; i++) {
     *         _revokeRole(OPERATOR_ROLE, operators[i]);
     *     }
     *     _pause();
     * }
     * ```
     *
     * 【virtual】
     * 允许子合约覆盖,添加自定义逻辑:
     * - 撤销前通知用户
     * - 记录撤销原因
     * - 防止撤销最后一个管理员
     * - 添加冷却期
     *
     * 【扩展示例】
     * ```solidity
     * function _revokeRole(bytes32 role, address account) internal virtual override returns (bool) {
     *     // 防止撤销最后一个管理员
     *     if (role == DEFAULT_ADMIN_ROLE && getRoleMemberCount(role) == 1) {
     *         revert("Cannot revoke last admin");
     *     }
     *     return super._revokeRole(role, account);
     * }
     * ```
     */
    function _revokeRole(bytes32 role, address account) internal virtual returns (bool) {
        if (hasRole(role, account)) {
            _roles[role].hasRole[account] = false;
            emit RoleRevoked(role, account, _msgSender());
            return true;
        } else {
            return false;
        }
    }
}

/*
 * ============================================================
 *                      学习总结
 * ============================================================
 *
 * 【核心概念】
 * 1. 角色 (Role): bytes32 标识的权限组
 * 2. 账户 (Account): 拥有角色的地址
 * 3. 管理员角色 (Admin Role): 管理其他角色的角色
 * 4. 默认管理员: DEFAULT_ADMIN_ROLE,最高权限
 *
 * 【数据结构】
 * mapping(bytes32 => RoleData)
 *   └─> RoleData {
 *         mapping(address => bool) hasRole;
 *         bytes32 adminRole;
 *       }
 *
 * 【核心函数调用链】
 * grantRole(role, account)
 *   └─> onlyRole(getRoleAdmin(role))
 *         └─> _checkRole(adminRole, msg.sender)
 *               └─> hasRole(adminRole, msg.sender)
 *                     └─> _roles[adminRole].hasRole[msg.sender]
 *   └─> _grantRole(role, account)
 *         └─> _roles[role].hasRole[account] = true
 *         └─> emit RoleGranted(...)
 *
 * 【权限层级示例】
 * DEFAULT_ADMIN_ROLE (bytes32(0))
 *   ├─> OPERATOR_ADMIN (管理操作员)
 *   │     ├─> OPERATOR_ROLE
 *   │     └─> SUB_OPERATOR_ROLE
 *   └─> MINTER_ADMIN (管理铸造者)
 *         ├─> MINTER_ROLE
 *         └─> BURNER_ROLE
 *
 * 【完整使用示例】
 * ```solidity
 * contract MyNFT is ERC721, AccessControl {
 *     bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
 *     bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
 *     bytes32 public constant URI_SETTER_ROLE = keccak256("URI_SETTER_ROLE");
 *
 *     constructor() ERC721("MyNFT", "MNFT") {
 *         // 授予部署者所有权限
 *         _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
 *         _grantRole(MINTER_ROLE, msg.sender);
 *         _grantRole(PAUSER_ROLE, msg.sender);
 *     }
 *
 *     function mint(address to, uint256 tokenId) public onlyRole(MINTER_ROLE) {
 *         _safeMint(to, tokenId);
 *     }
 *
 *     function pause() public onlyRole(PAUSER_ROLE) {
 *         _pause();
 *     }
 *
 *     function setTokenURI(uint256 tokenId, string memory uri)
 *         public
 *         onlyRole(URI_SETTER_ROLE)
 *     {
 *         _setTokenURI(tokenId, uri);
 *     }
 *
 *     // ERC165: 声明支持的接口
 *     function supportsInterface(bytes4 interfaceId)
 *         public
 *         view
 *         override(ERC721, AccessControl)
 *         returns (bool)
 *     {
 *         return super.supportsInterface(interfaceId);
 *     }
 * }
 * ```
 *
 * 【Gas 优化】
 * - hasRole: ~2,600 gas (读取)
 * - grantRole (首次): ~50,000 gas (写入 + 事件)
 * - grantRole (重复): ~25,000 gas (只读)
 * - revokeRole: ~30,000 gas
 *
 * 【安全最佳实践】
 * ✅ DEFAULT_ADMIN_ROLE 只授予多签钱包
 * ✅ 使用 keccak256 生成唯一角色标识符
 * ✅ 定期审计角色分配
 * ✅ 建立角色文档和审批流程
 * ✅ 敏感操作添加时间锁
 * ✅ 使用事件监控权限变更
 *
 * 【常见陷阱】
 * ❌ 忘记在构造函数中授予 DEFAULT_ADMIN_ROLE
 * ❌ 将管理员角色授予 EOA 而非多签
 * ❌ 没有防止撤销最后一个管理员的机制
 * ❌ 角色命名冲突(使用相同的字符串)
 *
 * 【与 Ownable 对比】
 *
 * | 特性 | Ownable | AccessControl |
 * |------|---------|---------------|
 * | 权限模型 | 单一所有者 | 多角色 |
 * | 复杂度 | 简单 | 中等 |
 * | Gas 成本 | 低 | 中 |
 * | 灵活性 | 低 | 高 |
 * | 适用场景 | 简单合约 | 复杂系统 |
 *
 * 【进阶阅读】
 * - AccessControlEnumerable.sol - 可枚举角色成员
 * - AccessControlDefaultAdminRules.sol - 增强的管理员安全规则
 * - IAccessControlEnumerable.sol - 可枚举接口
 * - AccessManager.sol - 企业级权限管理
 */
