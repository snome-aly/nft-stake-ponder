// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title RewardToken
 * @notice NFT 质押系统的奖励代币
 * @dev
 * - 初始供应量为 0，全部通过质押 NFT 产出
 * - 仅 MINTER_ROLE (NFTStakingPool 合约) 可铸造
 * - 任何人可销毁自己的代币 (支持未来消耗场景)
 * - 支持 ERC20Permit (gasless approvals)
 *
 * 经济模型：
 * - 基础排放率：1 RWRD / 天 / NFT
 * - 稀有度加成：Common 1x, Rare 1.5x, Epic 2x, Legendary 3x
 * - 无铸造上限，由 StakingPool 逻辑控制排放
 *
 * 安全机制：
 * - AccessControl：最小权限原则
 * - 铸造权限完全由 StakingPool 控制
 * - 可销毁：支持未来代币消耗场景
 */
contract RewardToken is ERC20, ERC20Burnable, ERC20Permit, AccessControl {
    // ============ 角色定义 ============

    /**
     * @notice 铸造者角色
     * @dev 应授予 NFTStakingPool 合约，用于质押奖励的发放
     */
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // ============ 事件 ============

    /**
     * @notice 代币铸造事件
     * @param to 接收地址
     * @param amount 铸造数量
     */
    event TokensMinted(address indexed to, uint256 amount);

    /**
     * @notice 代币销毁事件
     * @param from 销毁地址
     * @param amount 销毁数量
     */
    event TokensBurned(address indexed from, uint256 amount);

    // ============ 构造函数 ============

    /**
     * @notice 部署 RewardToken 合约
     * @dev
     * - 名称："Reward Token"，符号："RWRD"
     * - 初始供应量为 0
     * - 部署者获得 DEFAULT_ADMIN_ROLE
     * - 部署者负责后续授予 MINTER_ROLE 给 StakingPool 合约
     */
    constructor() ERC20("Reward Token", "RWRD") ERC20Permit("Reward Token") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // ============ 外部函数 ============

    /**
     * @notice 铸造代币
     * @param to 接收地址
     * @param amount 铸造数量 (单位: wei，需乘以 10^18)
     * @dev
     * - 仅 MINTER_ROLE 可调用 (应授予 NFTStakingPool 合约)
     * - StakingPool 根据质押时间和稀有度计算奖励后调用此函数
     * - 触发 TokensMinted 事件
     *
     * 安全检查：
     * - onlyRole(MINTER_ROLE) 确保只有授权合约可铸造
     * - 无数量上限检查，因为 StakingPool 逻辑已限制排放
     *
     * 使用示例（StakingPool 中）：
     * ```solidity
     * uint256 reward = calculatePendingReward(tokenId);
     * rewardToken.mint(msg.sender, reward);
     * ```
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    /**
     * @notice 销毁自己的代币
     * @param amount 销毁数量
     * @dev
     * - 继承自 ERC20Burnable，任何人都可以销毁自己的代币
     * - 用于未来的消耗场景（如 NFT 升级、治理锁定等）
     * - 触发 Transfer(from, address(0), amount) 事件
     *
     * 使用示例（未来功能）：
     * ```solidity
     * // 用户销毁 100 RWRD 升级 NFT
     * rewardToken.burn(100 * 10**18);
     * nftContract.upgradeRarity(tokenId);
     * ```
     */
    function burn(uint256 amount) public override {
        super.burn(amount);
        emit TokensBurned(msg.sender, amount);
    }

    /**
     * @notice 销毁授权的代币
     * @param account 被销毁代币的地址
     * @param amount 销毁数量
     * @dev
     * - 继承自 ERC20Burnable
     * - 需要 account 事先 approve 给调用者
     * - 用于未来的合约消耗场景（如自动化质押合约）
     */
    function burnFrom(address account, uint256 amount) public override {
        super.burnFrom(account, amount);
        emit TokensBurned(account, amount);
    }

    // ============ 视图函数 ============

    /**
     * @notice 检查地址是否拥有铸造权限
     * @param account 待检查地址
     * @return 是否拥有 MINTER_ROLE
     * @dev 用于前端或其他合约验证权限
     */
    function isMinter(address account) external view returns (bool) {
        return hasRole(MINTER_ROLE, account);
    }

    /**
     * @notice 检查地址是否拥有管理员权限
     * @param account 待检查地址
     * @return 是否拥有 DEFAULT_ADMIN_ROLE
     */
    function isAdmin(address account) external view returns (bool) {
        return hasRole(DEFAULT_ADMIN_ROLE, account);
    }

    // ============ 辅助函数 ============

    /**
     * @notice 工具函数：将 RWRD 数量转换为 wei 单位
     * @param rwrdAmount RWRD 数量 (例如: 100)
     * @return wei 单位的数量 (例如: 100 * 10^18)
     * @dev 辅助前端计算，避免精度错误
     */
    function toWei(uint256 rwrdAmount) external pure returns (uint256) {
        return rwrdAmount * 10 ** 18;
    }

    /**
     * @notice 工具函数：将 wei 单位转换为 RWRD 数量
     * @param weiAmount wei 单位的数量
     * @return RWRD 数量
     * @dev 辅助前端显示，注意会丢失小数部分
     */
    function fromWei(uint256 weiAmount) external pure returns (uint256) {
        return weiAmount / 10 ** 18;
    }
}
