//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// 这是一个盲盒NFT 总供应量有100个  每人最多mint 20个 每mint一个需要1个ETH费用  一次可批量mint
// NFT 具有稀有度（Common 50个 / Rare 30个 / Epic 15个 / Legendary 5个），稀有度在铸造完成后揭示
// 为了稀有度数量分配精确  使用洗牌算法分配稀有度 稀有度数组再部署的时候传入
// 揭示稀有度需要随机公平  所以采用chainlink的VRF获得一个随机数 配合tokenId 在稀有度数组上偏移获得稀有度
// NFT可以支持质押 质押根据稀有度分配奖励倍率
// 角色有管理员(赋予角色) 运营者(操作稀有度奖励倍率)  安全员(启停合约)
// NFT metaData存储在IPFS
// 需要记录的日志 mint VRF请求 VRF返回

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract StakableNFT is ERC721, ERC721Pausable, AccessControl, ReentrancyGuard, EIP712 {
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    string constant BLINDBOX_IMAGE = "ipfs://Qmd2SzbuXHQnc5jcL7c2ohTpNsKcU2NJVwcPr2bG7S1cKk";

    enum Rarity {
        Common,
        Rare,
        Epic,
        Legendary
    }

    // ============ 错误定义 ============
    error InvalidRarityDistribution(uint256 common, uint256 rare, uint256 epic, uint256 legendary);
    error NotRevealedYet();

    // ============ 状态变量 ============
    uint256 public constant MAX_SUPPLY = 100; // 总供应量
    uint256 public constant MAX_PER_ADDRESS = 20; // 每地址最大铸造数
    uint256 public constant MINT_PRICE = 1 ether; // 铸造价格
    uint256 public constant MAX_MULTIPLIER = 100000;

    uint256 public totalMinted; // 已铸造数量
    uint256 private _nextTokenId = 1; // 下一个 tokenId（从1开始）

    mapping(Rarity => string) public rarityImages; // 稀有度对应的图片
    mapping(address => uint256) public mintedCount; // 每个地址已铸造数量
    mapping(uint256 => Rarity) public tokenRarity; // tokenId 对应的稀有度

    Rarity[] public rarityPool; // 稀有度池（链下洗牌后传入）
    uint256 public revealOffset; // VRF 返回的随机偏移量
    bool public isRevealed; // 是否已揭示
    bool public rarityPoolSet; // 稀有度池是否已设置

    // 稀有度奖励倍率 (基数 10000，例如 10000 = 1x, 20000 = 2x)
    mapping(Rarity => uint256) public rewardMultiplier;

    // ============ EIP-4494 (ERC721 Permit) ============

    // Permit nonces
    mapping(address => uint256) private _nonces;

    // Permit type hash
    bytes32 private constant PERMIT_TYPEHASH =
        keccak256("Permit(address spender,uint256 tokenId,uint256 nonce,uint256 deadline)");

    // ============ 事件 ============
    event NFTMinted(address indexed to, uint256 startTokenId, uint256 quantity);
    event RarityPoolSet(uint256 poolSize);
    event RevealRequested(uint256 requestId);
    event RevealCompleted(uint256 offset);
    event RewardMultiplierUpdated(Rarity indexed rarity, uint256 oldMultiplier, uint256 newMultiplier);
    event Withdrawn(address indexed recipient, uint256 amount);

    constructor() ERC721("Stakable NFT", "SNFT") EIP712("Stakable NFT", "1") {
        rarityImages[Rarity.Common] = "ipfs://QmY7A1WYkzBxgvYXwDwbY35bntWEeYi6kmph52UcpQTHFp";
        rarityImages[Rarity.Rare] = "ipfs://QmYbvQvfFrKbxLwr3ZX4pigAZJbTB7zCpykGmuoWoZTf9p";
        rarityImages[Rarity.Epic] = "ipfs://Qmdg4TcyiPpuxUJpDTsnJSGfEsjLzASekNrtCyWQZqWDW6";
        rarityImages[Rarity.Legendary] = "ipfs://QmZHdmbPR711ujJWi1UL6te2H5QsicuvPPuUcbJNnesjtf";

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setRoleAdmin(OPERATOR_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(PAUSER_ROLE, DEFAULT_ADMIN_ROLE);

        // 初始化默认奖励倍率 (基数 10000)
        rewardMultiplier[Rarity.Common] = 10000; // 1x
        rewardMultiplier[Rarity.Rare] = 15000; // 1.5x
        rewardMultiplier[Rarity.Epic] = 20000; // 2x
        rewardMultiplier[Rarity.Legendary] = 30000; // 3x
    }

    /**
     * @notice 设置稀有度池（链下洗牌后传入）
     * @param shuffledRarities 洗牌后的稀有度数组
     * @dev 只能由操作员调用，且只能设置一次
     * @dev 数组长度必须等于 MAX_SUPPLY，且必须包含正确数量的各稀有度
     */
    function setRarityPool(Rarity[] calldata shuffledRarities) external onlyRole(OPERATOR_ROLE) {
        require(!rarityPoolSet, "Rarity pool already set");
        require(shuffledRarities.length == MAX_SUPPLY, "Invalid array length");

        // 一次循环：同时验证分布和写入数组
        uint256[4] memory counts; // [Common, Rare, Epic, Legendary]
        for (uint256 i = 0; i < shuffledRarities.length; ) {
            Rarity rarity = shuffledRarities[i];
            rarityPool.push(rarity);
            unchecked {
                counts[uint256(rarity)]++;
                ++i;
            }
        }

        // 一次性验证所有稀有度分布
        if (counts[0] != 50 || counts[1] != 30 || counts[2] != 15 || counts[3] != 5) {
            revert InvalidRarityDistribution(counts[0], counts[1], counts[2], counts[3]);
        }

        rarityPoolSet = true;
        emit RarityPoolSet(shuffledRarities.length);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Pausable) returns (address) {
        return super._update(to, tokenId, auth);
    }

    // ============ 铸造功能 ============

    /**
     * @notice 批量铸造 NFT
     * @param quantity 铸造数量
     * @dev 支付金额必须匹配，遵守供应量和每地址限制
     */
    function mint(uint256 quantity) external payable nonReentrant whenNotPaused {
        require(rarityPoolSet, "Rarity pool not set");
        require(quantity > 0, "Quantity must be greater than 0");
        require(totalMinted + quantity <= MAX_SUPPLY, "Exceeds max supply");
        require(mintedCount[msg.sender] + quantity <= MAX_PER_ADDRESS, "Exceeds max per address");
        require(msg.value == MINT_PRICE * quantity, "Incorrect payment amount");

        uint256 startTokenId = _nextTokenId;

        for (uint256 i = 0; i < quantity; ) {
            _safeMint(msg.sender, _nextTokenId);
            unchecked {
                ++_nextTokenId;
                ++i;
            }
        }

        mintedCount[msg.sender] += quantity;
        totalMinted += quantity;

        emit NFTMinted(msg.sender, startTokenId, quantity);
    }

    /**
     * @notice 获取 NFT 的稀有度
     * @param tokenId NFT ID
     * @return 稀有度枚举值
     * @dev 未揭示前调用会 revert
     */
    function getRarity(uint256 tokenId) public view returns (Rarity) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");

        if (!isRevealed) {
            revert NotRevealedYet();
        }

        return tokenRarity[tokenId]; // 直接读取存储的稀有度
    }

    /**
     * @notice 返回 tokenURI (完整的 JSON metadata)
     * @param tokenId NFT ID
     * @dev 未揭示时返回盲盒 metadata，揭示后返回完整 metadata
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");

        if (!isRevealed) {
            // 未揭示：返回盲盒 metadata
            return _buildBlindBoxMetadata(tokenId);
        }

        // 已揭示：返回完整 metadata
        Rarity rarity = tokenRarity[tokenId];
        return _buildRevealedMetadata(tokenId, rarity);
    }

    /**
     * @notice 构建盲盒 metadata
     */
    // prettier-ignore
    function _buildBlindBoxMetadata(uint256 tokenId) private pure returns (string memory) {
        string memory json = string(abi.encodePacked(
            '{',
                '"name": "Stakable NFT #', Strings.toString(tokenId), '",',
                '"description": "A mysterious blind box NFT waiting to be revealed. Stake to earn rewards based on rarity!",',
                '"image": "', BLINDBOX_IMAGE, '",',
                '"attributes": [',
                    '{',
                        '"trait_type": "Status",',
                        '"value": "Unrevealed"',
                    '}',
                ']',
            '}'
        ));

        return string(abi.encodePacked(
            'data:application/json;base64,',
            Base64.encode(bytes(json))
        ));
    }

    /**
     * @notice 构建已揭示的 metadata
     */
    // prettier-ignore
    function _buildRevealedMetadata(uint256 tokenId, Rarity rarity) private view returns (string memory) {
        string memory rarityName = _getRarityName(rarity);
        uint256 multiplier = rewardMultiplier[rarity];

        string memory json = string(abi.encodePacked(
            '{',
                '"name": "Stakable NFT #', Strings.toString(tokenId), '",',
                '"description": "A stakable NFT with ', rarityName, ' rarity. Earn ', _formatMultiplier(multiplier), ' rewards when staking!",',
                '"image": "', rarityImages[rarity], '",',
                '"attributes": [',
                    '{',
                        '"trait_type": "Rarity",',
                        '"value": "', rarityName, '"',
                    '},',
                    '{',
                        '"trait_type": "Reward Multiplier",',
                        '"value": "', _formatMultiplier(multiplier), '"',
                    '},',
                    '{',
                        '"trait_type": "Multiplier Value",',
                        '"value": ', Strings.toString(multiplier),
                    '},',
                    '{',
                        '"trait_type": "Status",',
                        '"value": "Revealed"',
                    '}',
                ']',
            '}'
        ));

        return string(abi.encodePacked(
            'data:application/json;base64,',
            Base64.encode(bytes(json))
        ));
    }

    /**
     * @notice 获取稀有度名称
     */
    function _getRarityName(Rarity rarity) private pure returns (string memory) {
        if (rarity == Rarity.Common) return "Common";
        if (rarity == Rarity.Rare) return "Rare";
        if (rarity == Rarity.Epic) return "Epic";
        if (rarity == Rarity.Legendary) return "Legendary";
        return "Unknown";
    }

    /**
     * @notice 格式化倍率为字符串（例如 "1.5x", "2x"）
     */
    function _formatMultiplier(uint256 multiplier) private pure returns (string memory) {
        uint256 integerPart = multiplier / 10000;
        uint256 decimalPart = (multiplier % 10000) / 100;

        if (decimalPart == 0) {
            return string(abi.encodePacked(Strings.toString(integerPart), "x"));
        } else {
            return string(abi.encodePacked(Strings.toString(integerPart), ".", _twoDigits(decimalPart), "x"));
        }
    }

    /**
     * @notice 将数字格式化为两位数字符串
     */
    function _twoDigits(uint256 num) private pure returns (string memory) {
        if (num < 10) {
            return string(abi.encodePacked("0", Strings.toString(num)));
        }
        return Strings.toString(num);
    }

    // ============ 揭示功能（暂时使用伪随机，后续集成 Chainlink VRF）============

    /**
     * @notice 揭示所有 NFT 的稀有度
     * @dev 只能由管理员调用，且只能揭示一次
     * @dev 必须等待所有 NFT 铸造完成后才能揭示
     * @dev 一次性为所有已铸造的 NFT 分配稀有度并写入 mapping
     * @dev 临时使用 blockhash 作为随机源，生产环境应使用 Chainlink VRF
     */
    function reveal() external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(!isRevealed, "Already revealed");
        require(rarityPoolSet, "Rarity pool not set");
        require(totalMinted == MAX_SUPPLY, "All NFTs must be minted before reveal");

        // 临时使用 blockhash 生成随机偏移（生产环境应使用 Chainlink VRF）
        uint256 randomNumber = uint256(
            keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender, totalMinted))
        );

        revealOffset = randomNumber % MAX_SUPPLY;

        // 一次性为所有已铸造的 NFT 分配稀有度
        for (uint256 tokenId = 1; tokenId <= totalMinted; ) {
            uint256 rarityIndex = (tokenId - 1 + revealOffset) % MAX_SUPPLY;
            tokenRarity[tokenId] = rarityPool[rarityIndex];
            unchecked {
                ++tokenId;
            }
        }

        isRevealed = true;

        emit RevealCompleted(revealOffset);
    }

    // ============ 合约管理 ============

    /**
     * @notice 设置指定稀有度的奖励倍率
     * @param rarity 稀有度
     * @param multiplier 奖励倍率 (基数 10000，例如 10000 = 1x, 20000 = 2x)
     * @dev 只能由操作员调用
     */
    function setRewardMultiplier(Rarity rarity, uint256 multiplier) external onlyRole(OPERATOR_ROLE) {
        require(multiplier > 0, "Multiplier must be greater than 0");
        require(multiplier <= MAX_MULTIPLIER, "Multiplier too high"); // 最大 10x

        uint256 oldMultiplier = rewardMultiplier[rarity];
        rewardMultiplier[rarity] = multiplier;

        emit RewardMultiplierUpdated(rarity, oldMultiplier, multiplier);
    }

    /**
     * @notice 批量设置所有稀有度的奖励倍率
     * @param multipliers 奖励倍率数组 [Common, Rare, Epic, Legendary]
     * @dev 只能由操作员调用
     */
    function setRewardMultipliers(uint256[4] calldata multipliers) external onlyRole(OPERATOR_ROLE) {
        for (uint256 i = 0; i < 4; i++) {
            require(multipliers[i] > 0, "Multiplier must be greater than 0");
            require(multipliers[i] <= MAX_MULTIPLIER, "Multiplier too high");

            Rarity rarity = Rarity(i);
            uint256 oldMultiplier = rewardMultiplier[rarity];
            rewardMultiplier[rarity] = multipliers[i];

            emit RewardMultiplierUpdated(rarity, oldMultiplier, multipliers[i]);
        }
    }

    /**
     * @notice 获取指定 tokenId 的奖励倍率
     * @param tokenId NFT ID
     * @return 奖励倍率 (基数 10000)
     * @dev 未揭示前返回 0
     */
    function getTokenRewardMultiplier(uint256 tokenId) external view returns (uint256) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");

        if (!isRevealed) {
            return 0; // 未揭示前返回 0
        }

        Rarity rarity = tokenRarity[tokenId];
        return rewardMultiplier[rarity];
    }

    function withdraw() external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");

        (bool success, ) = msg.sender.call{ value: balance }("");
        require(success, "Withdraw failed");

        emit Withdrawn(msg.sender, balance);
    }

    function grantRoleTo(bytes32 role, address account) external onlyRole(getRoleAdmin(role)) {
        grantRole(role, account);
    }

    function revokeRoleFrom(bytes32 role, address account) external onlyRole(getRoleAdmin(role)) {
        revokeRole(role, account);
    }

    function checkRole(bytes32 role, address account) external view returns (bool) {
        return hasRole(role, account);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // ============ EIP-4494 (ERC721 Permit) 实现 ============

    /**
     * @notice 获取账户的当前 nonce
     * @param owner 账户地址
     * @return 当前 nonce
     */
    function nonces(address owner) public view returns (uint256) {
        return _nonces[owner];
    }

    /**
     * @notice 获取 EIP-712 域分隔符
     * @return 域分隔符
     */
    function DOMAIN_SEPARATOR() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    /**
     * @notice ERC721 Permit 函数 - 支持 gasless approval
     * @param spender 被授权者地址
     * @param tokenId NFT ID
     * @param deadline 签名过期时间
     * @param v 签名参数 v
     * @param r 签名参数 r
     * @param s 签名参数 s
     * @dev
     * - 用户离线签名授权信息
     * - 任何人可以提交签名完成授权（用户无需支付 gas）
     * - 签名必须在 deadline 之前有效
     * - 每个签名只能使用一次（通过 nonce 防止重放攻击）
     *
     * 使用示例（前端）：
     * ```typescript
     * const signature = await signer._signTypedData(domain, types, value);
     * const { v, r, s } = ethers.utils.splitSignature(signature);
     * await stakingPool.stakeWithPermit(tokenId, deadline, v, r, s);
     * ```
     */
    function permit(
        address spender,
        uint256 tokenId,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        require(block.timestamp <= deadline, "Permit expired");

        address owner = ownerOf(tokenId);
        require(spender != owner, "Approval to current owner");

        // 构建 EIP-712 结构化数据哈希
        bytes32 structHash = keccak256(
            abi.encode(PERMIT_TYPEHASH, spender, tokenId, _nonces[owner], deadline)
        );

        bytes32 hash = _hashTypedDataV4(structHash);

        // 恢复签名者地址
        address signer = ECDSA.recover(hash, v, r, s);
        require(signer == owner, "Invalid signature");

        // 增加 nonce（防止重放攻击）
        _nonces[owner]++;

        // 执行授权
        _approve(spender, tokenId, owner);
    }
}
