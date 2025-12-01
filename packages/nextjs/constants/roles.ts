/**
 * 智能合约角色常量定义
 *
 * 这些角色哈希必须与智能合约中的定义保持一致。
 * 合约路径：packages/hardhat/contracts/StakableNFT.sol
 *
 * @see https://docs.openzeppelin.com/contracts/5.x/access-control
 */

/**
 * OpenZeppelin 默认管理员角色
 *
 * 对应合约中的 DEFAULT_ADMIN_ROLE
 * 拥有所有权限，包括授予/撤销其他角色
 */
export const ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000" as const;

/**
 * 自定义操作员角色
 *
 * 对应合约中的 OPERATOR_ROLE = keccak256("OPERATOR_ROLE")
 * 拥有特定操作权限（如批量操作、紧急暂停等）
 */
export const OPERATOR_ROLE = "0x97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b929" as const;

/**
 * 角色名称映射（用于 UI 显示）
 */
export const ROLE_NAMES = {
  [ADMIN_ROLE]: "Admin",
  [OPERATOR_ROLE]: "Operator",
} as const;

/**
 * 角色描述（用于工具提示）
 */
export const ROLE_DESCRIPTIONS = {
  [ADMIN_ROLE]: "Full access to all contract functions including role management",
  [OPERATOR_ROLE]: "Can perform operational tasks like batch operations and emergency pause",
} as const;
