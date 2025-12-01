// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title IStakableNFT
 * @notice StakableNFT 合约接口
 */
interface IStakableNFT {
    /**
     * @notice 获取 NFT 所有者
     * @param tokenId NFT ID
     * @return NFT 所有者地址
     */
    function ownerOf(uint256 tokenId) external view returns (address);

    /**
     * @notice 转移 NFT
     * @param from 发送者地址
     * @param to 接收者地址
     * @param tokenId NFT ID
     */
    function transferFrom(address from, address to, uint256 tokenId) external;

    /**
     * @notice 获取 NFT 奖励倍率
     * @param tokenId NFT ID
     * @return 奖励倍率（基数 10000）
     * @dev 未揭示前返回 0
     */
    function getTokenRewardMultiplier(uint256 tokenId) external view returns (uint256);

    /**
     * @notice ERC721 Permit - gasless approval
     * @param spender 被授权者地址
     * @param tokenId NFT ID
     * @param deadline 签名过期时间
     * @param v 签名参数 v
     * @param r 签名参数 r
     * @param s 签名参数 s
     */
    function permit(
        address spender,
        uint256 tokenId,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;
}

/**
 * @title IRewardToken
 * @notice RewardToken 合约接口
 */
interface IRewardToken {
    /**
     * @notice 铸造奖励代币
     * @param to 接收地址
     * @param amount 铸造数量
     * @dev 调用前需要 StakingPool 已获得 MINTER_ROLE
     */
    function mint(address to, uint256 amount) external;
}

/**
 * @title NFTStakingPool
 * @notice NFT 质押池合约，管理质押、解押和奖励分发
 * @dev
 * - 用户质押 StakableNFT 可获得 RWRD 代币奖励
 * - 奖励根据质押时间和 NFT 稀有度计算
 * - 支持随时领取奖励和解除质押
 *
 * 安全机制：
 * - ReentrancyGuard：防重入攻击
 * - Pausable：紧急暂停功能
 * - Checks-Effects-Interactions 模式
 *
 * 经济模型：
 * - 基础排放：1 RWRD/天/NFT
 * - 稀有度加成：Common 1x, Rare 1.5x, Epic 2x, Legendary 3x
 */
contract NFTStakingPool is Ownable, ReentrancyGuard, Pausable {
    // ============ 结构体 ============

    /**
     * @notice NFT 质押信息
     * @param owner 质押者地址（address(0) 表示未质押）
     * @param stakedAt 质押时间戳（用于统计质押时长）
     * @param lastClaimTime 最后领取奖励时间（用于计算待领取奖励）
     */
    struct StakeInfo {
        address owner;
        uint256 stakedAt;
        uint256 lastClaimTime;
    }

    // ============ 状态变量 ============

    /// @notice 质押信息映射 tokenId => StakeInfo
    mapping(uint256 => StakeInfo) public stakeInfo;

    /// @notice StakableNFT 合约实例
    IStakableNFT public immutable stakableNFT;

    /// @notice RewardToken 合约实例
    IRewardToken public immutable rewardToken;

    /// @notice 基础奖励速率：1 RWRD/天 = 1e18 / 86400 wei/秒
    /// @dev 预计算值：1000000000000000000 / 86400 ≈ 11574074074074
    uint256 public constant BASE_REWARD_PER_SECOND = 11574074074074;

    // ============ 事件 ============

    /**
     * @notice NFT 质押事件
     * @param user 质押者地址
     * @param tokenId NFT ID
     * @param timestamp 质押时间戳
     */
    event Staked(address indexed user, uint256 indexed tokenId, uint256 timestamp);

    /**
     * @notice NFT 解押事件
     * @param user 质押者地址
     * @param tokenId NFT ID
     * @param timestamp 解押时间戳
     * @param reward 本次获得的奖励数量
     */
    event Unstaked(address indexed user, uint256 indexed tokenId, uint256 timestamp, uint256 reward);

    /**
     * @notice 奖励领取事件
     * @param user 领取者地址
     * @param tokenId NFT ID
     * @param amount 领取的奖励数量
     */
    event RewardClaimed(address indexed user, uint256 indexed tokenId, uint256 amount);

    // ============ 构造函数 ============

    /**
     * @notice 部署 NFTStakingPool 合约
     * @param _stakableNFT StakableNFT 合约地址
     * @param _rewardToken RewardToken 合约地址
     * @dev 部署后需要由 RewardToken 的 owner 授予本合约 MINTER_ROLE
     */
    constructor(address _stakableNFT, address _rewardToken) Ownable(msg.sender) {
        require(_stakableNFT != address(0), "Invalid StakableNFT address");
        require(_rewardToken != address(0), "Invalid RewardToken address");

        stakableNFT = IStakableNFT(_stakableNFT);
        rewardToken = IRewardToken(_rewardToken);
    }

    // ============ 外部函数 ============

    /**
     * @notice 质押 NFT
     * @param tokenId NFT ID
     * @dev
     * - 用户必须是 NFT 的所有者
     * - NFT 必须未被质押
     * - 用户必须已 approve 本合约
     * - 合约未暂停
     *
     * 操作流程：
     * 1. 验证 NFT 所有权
     * 2. 验证未被质押
     * 3. 转移 NFT 到合约
     * 4. 记录质押信息
     * 5. 触发 Staked 事件
     */
    function stake(uint256 tokenId) external nonReentrant whenNotPaused {
        // 普通质押：必须是 NFT 所有者
        require(stakableNFT.ownerOf(tokenId) == msg.sender, "Not NFT owner");
        _stake(tokenId);
    }

    /**
     * @notice 内部质押逻辑
     * @param tokenId NFT ID
     * @dev
     * - 获取 NFT 当前所有者
     * - 支持 Relayer 代付 gas（通过 Permit）
     * - transferFrom 会自动检查授权
     */
    function _stake(uint256 tokenId) internal {
        // 获取 NFT 当前所有者（支持 Relayer 场景）
        address nftOwner = stakableNFT.ownerOf(tokenId);

        // Checks
        require(nftOwner != address(0), "Invalid token");
        require(stakeInfo[tokenId].owner == address(0), "Already staked");

        // 检查 NFT 是否已揭示（未揭示的 NFT multiplier 为 0）
        uint256 multiplier = stakableNFT.getTokenRewardMultiplier(tokenId);
        require(multiplier > 0, "NFT not revealed yet");

        // Effects
        stakeInfo[tokenId] = StakeInfo({
            owner: nftOwner,
            stakedAt: block.timestamp,
            lastClaimTime: block.timestamp
        });

        // Interactions
        // transferFrom 会自动验证授权（普通 approve 或 Permit）
        stakableNFT.transferFrom(nftOwner, address(this), tokenId);

        emit Staked(nftOwner, tokenId, block.timestamp);
    }

    /**
     * @notice 解押 NFT
     * @param tokenId NFT ID
     * @dev
     * - 调用者必须是质押者
     * - 自动计算并发放奖励
     * - NFT 归还用户
     * - 清除质押记录
     *
     * 操作流程：
     * 1. 验证质押者身份
     * 2. 计算待领取奖励
     * 3. 清除质押记录
     * 4. 发放奖励（如果有）
     * 5. 归还 NFT
     * 6. 触发 Unstaked 事件
     */
    function unstake(uint256 tokenId) external nonReentrant {
        StakeInfo storage info = stakeInfo[tokenId];

        // Checks
        require(info.owner == msg.sender, "Not staker");

        // Effects
        uint256 reward = calculatePendingReward(tokenId);
        delete stakeInfo[tokenId];

        // Interactions
        if (reward > 0) {
            rewardToken.mint(msg.sender, reward);
        }
        stakableNFT.transferFrom(address(this), msg.sender, tokenId);

        emit Unstaked(msg.sender, tokenId, block.timestamp, reward);
    }

    /**
     * @notice 领取奖励
     * @param tokenId NFT ID
     * @dev
     * - 调用者必须是质押者
     * - 仅领取奖励，不解押 NFT
     * - 更新最后领取时间
     *
     * 操作流程：
     * 1. 验证质押者身份
     * 2. 计算待领取奖励
     * 3. 更新最后领取时间
     * 4. 铸造奖励代币
     * 5. 触发 RewardClaimed 事件
     */
    function claimReward(uint256 tokenId) external nonReentrant {
        uint256 reward = _claimReward(tokenId);

        // Interactions
        if (reward > 0) {
            rewardToken.mint(msg.sender, reward);
        }
    }

    /**
     * @notice 内部领取奖励逻辑
     * @param tokenId NFT ID
     * @return reward 领取的奖励数量
     */
    function _claimReward(uint256 tokenId) internal returns (uint256 reward) {
        StakeInfo storage info = stakeInfo[tokenId];

        // Checks
        require(info.owner == msg.sender, "Not staker");

        reward = calculatePendingReward(tokenId);
        require(reward > 0, "No reward to claim");

        // Effects
        info.lastClaimTime = block.timestamp;

        emit RewardClaimed(msg.sender, tokenId, reward);
    }

    /**
     * @notice 批量质押 NFT
     * @param tokenIds NFT ID 数组
     * @dev
     * - 所有 NFT 必须属于调用者
     * - 所有 NFT 必须未被质押
     * - 用户必须已 approve 本合约
     * - 合约未暂停
     * - 复用 _stake 内部函数，避免代码重复
     */
    function batchStake(uint256[] calldata tokenIds) external nonReentrant whenNotPaused {
        uint256 length = tokenIds.length;
        require(length > 0, "Empty array");

        // 批量质押：所有 NFT 必须属于调用者
        for (uint256 i = 0; i < length; ) {
            require(stakableNFT.ownerOf(tokenIds[i]) == msg.sender, "Not NFT owner");
            unchecked {
                ++i;
            }
        }

        // 执行质押
        for (uint256 i = 0; i < length; ) {
            _stake(tokenIds[i]);
            unchecked {
                ++i;
            }
        }
    }

    /**
     * @notice 批量领取奖励
     * @param tokenIds NFT ID 数组
     * @dev
     * - 所有 NFT 必须属于调用者
     * - 只铸造一次代币（累加所有奖励）
     * - 更新所有 NFT 的最后领取时间
     * - 复用 _claimReward 内部函数，避免代码重复
     */
    function batchClaimReward(uint256[] calldata tokenIds) external nonReentrant {
        uint256 length = tokenIds.length;
        require(length > 0, "Empty array");

        uint256 totalReward = 0;

        for (uint256 i = 0; i < length; ) {
            uint256 reward = _claimReward(tokenIds[i]);
            totalReward += reward;
            unchecked {
                ++i;
            }
        }

        // Interactions
        if (totalReward > 0) {
            rewardToken.mint(msg.sender, totalReward);
        }
    }

    /**
     * @notice 使用 Permit 质押 NFT (Gasless 质押)
     * @param tokenId NFT ID
     * @param deadline 签名过期时间
     * @param v 签名参数 v
     * @param r 签名参数 r
     * @param s 签名参数 s
     * @dev
     * - 用户离线签名 Permit，无需预先 approve
     * - 合约自动调用 permit 完成授权
     * - 然后执行质押
     * - 用户只需一笔交易，且可以由他人代付 gas
     *
     * 使用流程：
     * 1. 用户离线签名 Permit（无需 gas）
     * 2. 用户或 Relayer 调用此函数（需要 gas）
     * 3. 合约自动完成：permit → stake
     *
     * 前端示例：
     * ```typescript
     * // 用户离线签名（无 gas）
     * const domain = {
     *   name: 'Stakable NFT',
     *   version: '1',
     *   chainId: await signer.getChainId(),
     *   verifyingContract: stakableNFT.address
     * };
     * const types = {
     *   Permit: [
     *     { name: 'spender', type: 'address' },
     *     { name: 'tokenId', type: 'uint256' },
     *     { name: 'nonce', type: 'uint256' },
     *     { name: 'deadline', type: 'uint256' }
     *   ]
     * };
     * const value = {
     *   spender: stakingPool.address,
     *   tokenId: tokenId,
     *   nonce: await stakableNFT.nonces(userAddress),
     *   deadline: deadline
     * };
     * const signature = await signer._signTypedData(domain, types, value);
     * const { v, r, s } = ethers.utils.splitSignature(signature);
     *
     * // 提交质押（可以由 Relayer 代付 gas）
     * await stakingPool.stakeWithPermit(tokenId, deadline, v, r, s);
     * ```
     */
    function stakeWithPermit(
        uint256 tokenId,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external nonReentrant whenNotPaused {
        // 1. 先执行 permit（自动授权）
        stakableNFT.permit(address(this), tokenId, deadline, v, r, s);

        // 2. 然后质押
        _stake(tokenId);
    }

    /**
     * @notice 批量使用 Permit 质押 NFT (Gasless 批量质押)
     * @param tokenIds NFT ID 数组
     * @param deadline 签名过期时间
     * @param vs 签名参数 v 数组
     * @param rs 签名参数 r 数组
     * @param ss 签名参数 s 数组
     * @dev
     * - 批量质押的 gasless 版本
     * - 每个 NFT 需要独立的签名
     * - 所有签名使用相同的 deadline
     */
    function batchStakeWithPermit(
        uint256[] calldata tokenIds,
        uint256 deadline,
        uint8[] calldata vs,
        bytes32[] calldata rs,
        bytes32[] calldata ss
    ) external nonReentrant whenNotPaused {
        uint256 length = tokenIds.length;
        require(length > 0, "Empty array");
        require(length == vs.length && length == rs.length && length == ss.length, "Array length mismatch");

        for (uint256 i = 0; i < length; ) {
            // 1. 执行 permit
            stakableNFT.permit(address(this), tokenIds[i], deadline, vs[i], rs[i], ss[i]);

            // 2. 质押
            _stake(tokenIds[i]);

            unchecked {
                ++i;
            }
        }
    }

    // ============ 视图函数 ============

    /**
     * @notice 计算待领取奖励
     * @param tokenId NFT ID
     * @return 待领取奖励数量（wei 单位）
     * @dev
     * - 公式：reward = timeStaked × BASE_REWARD_PER_SECOND × multiplier / 10000
     * - 未质押返回 0
     * - 未揭示的 NFT multiplier 为 0，奖励为 0
     */
    function calculatePendingReward(uint256 tokenId) public view returns (uint256) {
        StakeInfo storage info = stakeInfo[tokenId];

        // 未质押返回 0
        if (info.owner == address(0)) {
            return 0;
        }

        // 计算质押时长（秒）
        uint256 timeStaked = block.timestamp - info.lastClaimTime;

        // 获取稀有度倍率
        uint256 multiplier = stakableNFT.getTokenRewardMultiplier(tokenId);

        // 公式：时长 × 基础速率 × 倍率 / 10000
        return (timeStaked * BASE_REWARD_PER_SECOND * multiplier) / 10000;
    }

    /**
     * @notice 获取质押信息
     * @param tokenId NFT ID
     * @return 质押信息结构体
     */
    function getStakeInfo(uint256 tokenId) external view returns (StakeInfo memory) {
        return stakeInfo[tokenId];
    }

    /**
     * @notice 批量查询待领取奖励
     * @param tokenIds NFT ID 数组
     * @return rewards 奖励数组
     */
    function batchCalculatePendingReward(uint256[] calldata tokenIds) external view returns (uint256[] memory rewards) {
        uint256 length = tokenIds.length;
        rewards = new uint256[](length);

        for (uint256 i = 0; i < length; ) {
            rewards[i] = calculatePendingReward(tokenIds[i]);
            unchecked {
                ++i;
            }
        }

        return rewards;
    }

    /**
     * @notice 检查 NFT 是否已质押
     * @param tokenId NFT ID
     * @return 是否已质押
     */
    function isStaked(uint256 tokenId) external view returns (bool) {
        return stakeInfo[tokenId].owner != address(0);
    }

    /**
     * @notice 获取质押者地址
     * @param tokenId NFT ID
     * @return 质押者地址（未质押返回 address(0)）
     */
    function getStaker(uint256 tokenId) external view returns (address) {
        return stakeInfo[tokenId].owner;
    }

    // ============ 管理函数 ============

    /**
     * @notice 暂停合约
     * @dev 仅 owner 可调用，暂停后无法质押
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice 恢复合约
     * @dev 仅 owner 可调用
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
