# Chainlink VRF 集成指南

本文档指导如何将 Chainlink VRF (Verifiable Random Function) 集成到 StakableNFT 合约中，用于公平地揭示 NFT 稀有度。

## 📖 目录

1. [什么是 Chainlink VRF](#什么是-chainlink-vrf)
2. [VRF v2.5 vs v2](#vrf-v25-vs-v2)
3. [本地开发 vs 测试网/主网](#本地开发-vs-测试网主网)
4. [集成步骤](#集成步骤)
5. [合约修改](#合约修改)
6. [配置参数](#配置参数)
7. [部署流程](#部署流程)
8. [本地 Hardhat 测试](#本地-hardhat-测试)
9. [费用估算](#费用估算)

---

## 什么是 Chainlink VRF

Chainlink VRF 是一个**可验证的随机数生成器**，提供加密学上可证明的随机性。

### 为什么需要 VRF？

```solidity
// ❌ 不安全的伪随机数（可被矿工操纵）
uint256 random = uint256(keccak256(abi.encodePacked(
    block.timestamp,
    block.prevrandao,
    msg.sender
)));

// ✅ Chainlink VRF（链下生成，链上验证）
// 矿工/验证者无法操纵或预测结果
```

### VRF 工作原理

```
1. 合约请求随机数 → Chainlink VRF Coordinator
2. VRF 节点链下生成随机数 + 加密证明
3. VRF 节点提交随机数和证明到链上
4. Coordinator 验证证明
5. 回调你的合约 fulfillRandomWords()
```

---

## VRF v2.5 vs v2

| 特性 | VRF v2 | VRF v2.5 (推荐) |
|------|--------|-----------------|
| **支付方式** | Subscription (订阅) | Subscription + Direct Funding |
| **Gas 优化** | 标准 | 更优化 |
| **灵活性** | 基础 | 更灵活 |
| **推荐使用** | ⚠️ 旧版本 | ✅ 最新版本 |

**推荐使用 VRF v2.5！**

---

## 本地开发 vs 测试网/主网

### 三种开发环境对比

| 环境 | VRF 方案 | 优点 | 缺点 | 使用场景 |
|------|---------|------|------|---------|
| **本地 Hardhat** | VRF Mock 合约 | ✅ 免费<br>✅ 快速测试<br>✅ 完全控制 | ⚠️ 模拟环境 | 开发、单元测试 |
| **测试网 (Sepolia)** | 真实 VRF | ✅ 真实环境<br>✅ 免费 LINK<br>✅ 验证集成 | ⚠️ 网络延迟<br>⚠️ 需要测试 LINK | 集成测试、演示 |
| **主网 (Ethereum)** | 真实 VRF | ✅ 生产环境<br>✅ 真实随机性 | ❌ 需要真实 LINK<br>❌ 有成本 | 正式上线 |

### 推荐开发流程

```
1. 本地 Hardhat (VRF Mock) → 快速迭代开发
2. Sepolia 测试网 (真实 VRF) → 集成测试
3. Ethereum 主网 (真实 VRF) → 正式部署
```

---

## 集成步骤

### Step 1: 安装依赖

```bash
cd packages/hardhat
yarn add @chainlink/contracts
```

### Step 2: 创建 Subscription

访问 [Chainlink VRF Subscription Manager](https://vrf.chain.link/)

1. 连接钱包
2. 选择网络（Sepolia / Mainnet）
3. 点击 "Create Subscription"
4. 记录 **Subscription ID**
5. 充值 LINK（测试网可从 [Faucet](https://faucets.chain.link/) 获取）

### Step 3: 获取配置参数

访问 [Chainlink VRF 文档](https://docs.chain.link/vrf/v2-5/supported-networks)

#### Sepolia 测试网配置

```javascript
VRF_COORDINATOR: "0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B"
KEY_HASH: "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae"
CALLBACK_GAS_LIMIT: 2500000
REQUEST_CONFIRMATIONS: 3
NUM_WORDS: 1
```

#### Ethereum 主网配置

```javascript
VRF_COORDINATOR: "0x271682DEB8C4E0901D1a1550aD2e64D568E69909"
KEY_HASH: "0x9fe0eebf5e446e3c998ec9bb19951541aee00bb90ea201ae456421a2ded86805"
CALLBACK_GAS_LIMIT: 2500000
REQUEST_CONFIRMATIONS: 3
NUM_WORDS: 1
```

---

## 合约修改

### 1. 导入 VRF 合约

```solidity
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2Plus.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
```

### 2. 继承 VRFConsumerBaseV2Plus

```solidity
contract StakabaleNFT is
    ERC721,
    ERC721Pausable,
    AccessControl,
    ReentrancyGuard,
    VRFConsumerBaseV2Plus  // 👈 添加继承
{
    // ...
}
```

### 3. 添加 VRF 配置变量

```solidity
// ============ Chainlink VRF 配置 ============
uint256 public immutable s_subscriptionId;
bytes32 private immutable s_keyHash;
uint32 private constant CALLBACK_GAS_LIMIT = 2500000;
uint16 private constant REQUEST_CONFIRMATIONS = 3;
uint32 private constant NUM_WORDS = 1;

// VRF 请求状态
uint256 public s_requestId;
bool public vrfRequested;

// ============ 事件 ============
event RandomnessRequested(uint256 indexed requestId);
event RandomnessFulfilled(uint256 indexed requestId, uint256 randomNumber);
```

### 4. 修改构造函数

```solidity
constructor(
    uint256 subscriptionId,
    address vrfCoordinator,
    bytes32 keyHash
)
    ERC721("Stakable NFT", "SNFT")
    VRFConsumerBaseV2Plus(vrfCoordinator)  // 👈 初始化 VRF
{
    s_subscriptionId = subscriptionId;
    s_keyHash = keyHash;

    // 原有的初始化代码
    rarityImages[Rarity.Common] = "ipfs://...";
    // ...
}
```

### 5. 请求随机数函数

```solidity
/**
 * @notice 请求 Chainlink VRF 随机数以揭示 NFT
 * @dev 只能由管理员调用，且只能请求一次
 */
function requestReveal() external onlyRole(DEFAULT_ADMIN_ROLE) {
    require(!isRevealed, "Already revealed");
    require(!vrfRequested, "VRF already requested");
    require(rarityPoolSet, "Rarity pool not set");
    require(totalMinted == MAX_SUPPLY, "All NFTs must be minted");

    // 请求随机数
    s_requestId = s_vrfCoordinator.requestRandomWords(
        VRFV2PlusClient.RandomWordsRequest({
            keyHash: s_keyHash,
            subId: s_subscriptionId,
            requestConfirmations: REQUEST_CONFIRMATIONS,
            callbackGasLimit: CALLBACK_GAS_LIMIT,
            numWords: NUM_WORDS,
            extraArgs: VRFV2PlusClient._argsToBytes(
                VRFV2PlusClient.ExtraArgsV1({nativePayment: false})
            )
        })
    );

    vrfRequested = true;
    emit RandomnessRequested(s_requestId);
}
```

### 6. VRF 回调函数

```solidity
/**
 * @notice Chainlink VRF 回调函数
 * @dev 由 VRF Coordinator 自动调用
 */
function fulfillRandomWords(
    uint256 requestId,
    uint256[] calldata randomWords
) internal override {
    require(vrfRequested, "VRF not requested");
    require(!isRevealed, "Already revealed");

    uint256 randomNumber = randomWords[0];
    revealOffset = randomNumber % MAX_SUPPLY;

    // 一次性为所有已铸造的 NFT 分配稀有度
    for (uint256 tokenId = 1; tokenId <= totalMinted; tokenId++) {
        uint256 rarityIndex = (tokenId - 1 + revealOffset) % MAX_SUPPLY;
        tokenRarity[tokenId] = rarityPool[rarityIndex];
    }

    isRevealed = true;

    emit RandomnessFulfilled(requestId, randomNumber);
    emit RevealCompleted(revealOffset);
}
```

### 7. 紧急揭示函数（备用）

```solidity
/**
 * @notice 紧急揭示（如果 VRF 失败）
 * @dev 使用伪随机数，仅在 VRF 服务异常时使用
 */
function emergencyReveal() external onlyRole(DEFAULT_ADMIN_ROLE) {
    require(!isRevealed, "Already revealed");
    require(vrfRequested, "Must try VRF first");
    require(block.timestamp > lastVRFRequestTime + 1 days, "Wait 24h after VRF request");

    // 使用伪随机数
    uint256 randomNumber = uint256(keccak256(abi.encodePacked(
        block.timestamp,
        block.prevrandao,
        msg.sender,
        totalMinted
    )));

    revealOffset = randomNumber % MAX_SUPPLY;

    for (uint256 tokenId = 1; tokenId <= totalMinted; tokenId++) {
        uint256 rarityIndex = (tokenId - 1 + revealOffset) % MAX_SUPPLY;
        tokenRarity[tokenId] = rarityPool[rarityIndex];
    }

    isRevealed = true;
    emit RevealCompleted(revealOffset);
}
```

---

## 配置参数

### 创建配置文件

创建 `packages/hardhat/vrf-config.json`：

```json
{
  "sepolia": {
    "vrfCoordinator": "0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B",
    "keyHash": "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae",
    "subscriptionId": "YOUR_SUBSCRIPTION_ID",
    "callbackGasLimit": 2500000,
    "requestConfirmations": 3,
    "linkToken": "0x779877A7B0D9E8603169DdbD7836e478b4624789"
  },
  "mainnet": {
    "vrfCoordinator": "0x271682DEB8C4E0901D1a1550aD2e64D568E69909",
    "keyHash": "0x9fe0eebf5e446e3c998ec9bb19951541aee00bb90ea201ae456421a2ded86805",
    "subscriptionId": "YOUR_SUBSCRIPTION_ID",
    "callbackGasLimit": 2500000,
    "requestConfirmations": 3,
    "linkToken": "0x514910771AF9Ca656af840dff83E8264EcF986CA"
  }
}
```

### 环境变量

`.env` 文件添加：

```bash
VRF_SUBSCRIPTION_ID=YOUR_SUBSCRIPTION_ID
```

---

## 部署流程

### 1. 修改部署脚本

`packages/hardhat/deploy/00_deploy_stakable_nft.ts`：

```typescript
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import vrfConfig from "../vrf-config.json";

const deployStakableNFT: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const networkName = hre.network.name;
  const config = vrfConfig[networkName as keyof typeof vrfConfig];

  if (!config) {
    throw new Error(`VRF config not found for network: ${networkName}`);
  }

  await deploy("StakabaleNFT", {
    from: deployer,
    args: [
      config.subscriptionId,
      config.vrfCoordinator,
      config.keyHash,
    ],
    log: true,
    autoMine: true,
  });

  console.log("✅ StakableNFT deployed");
  console.log(`📝 Don't forget to add the contract as a consumer to Subscription ID: ${config.subscriptionId}`);
};

export default deployStakableNFT;
deployStakableNFT.tags = ["StakabaleNFT"];
```

### 2. 部署合约

```bash
# Sepolia 测试网
yarn deploy --network sepolia

# 本地测试（使用 mock）
yarn deploy
```

### 3. 添加合约到 Subscription

部署后，访问 [VRF Subscription Manager](https://vrf.chain.link/)：

1. 选择你的 Subscription
2. 点击 "Add consumer"
3. 输入合约地址
4. 确认交易

---

## 本地 Hardhat 测试

### ✅ 本地也可以使用 VRF！

你**不需要**部署到测试网或主网才能测试 VRF。Chainlink 提供了 **VRF Mock 合约**用于本地测试。

### VRF Mock 工作原理

```
本地 Hardhat:
  你的合约 → VRFCoordinatorV2_5Mock → 你的合约 (fulfillRandomWords)
              ↑ 你可以立即手动触发回调

真实网络:
  你的合约 → VRF Coordinator → Chainlink 节点 → 你的合约
              ↑ 需要等待几分钟
```

### Step 1: 创建 VRF Mock 部署脚本

`packages/hardhat/deploy/00_deploy_mocks.ts`：

```typescript
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployMocks: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // 仅在本地网络部署 Mock
  if (hre.network.name === "hardhat" || hre.network.name === "localhost") {
    console.log("🎭 部署 VRF Mock 合约...");

    await deploy("VRFCoordinatorV2_5Mock", {
      from: deployer,
      args: [
        "100000000000000000", // 0.1 LINK base fee
        "1000000000",         // 1 gwei gas price link
        "1000000000000000000" // 1 LINK wei per unit gas
      ],
      log: true,
      autoMine: true,
    });

    console.log("✅ VRF Mock 部署完成");
  }
};

export default deployMocks;
deployMocks.tags = ["mocks"];
```

### Step 2: 修改 NFT 部署脚本

`packages/hardhat/deploy/01_deploy_stakable_nft.ts`：

```typescript
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import vrfConfig from "../vrf-config.json";

const deployStakableNFT: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, get } = hre.deployments;

  let vrfCoordinator: string;
  let keyHash: string;
  let subscriptionId: bigint;

  // 本地网络：使用 Mock
  if (hre.network.name === "hardhat" || hre.network.name === "localhost") {
    console.log("📍 本地网络：使用 VRF Mock");

    const vrfCoordinatorMock = await get("VRFCoordinatorV2_5Mock");
    vrfCoordinator = vrfCoordinatorMock.address;

    // 创建 subscription
    const mockContract = await hre.ethers.getContractAt(
      "VRFCoordinatorV2_5Mock",
      vrfCoordinator
    );
    const tx = await mockContract.createSubscription();
    const receipt = await tx.wait();
    subscriptionId = receipt.logs[0].args.subId;

    // 充值 subscription (100 LINK)
    await mockContract.fundSubscription(subscriptionId, hre.ethers.parseEther("100"));

    // 使用任意 keyHash（Mock 不验证）
    keyHash = "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae";

    console.log(`✅ Mock Subscription ID: ${subscriptionId}`);
  }
  // 测试网/主网：使用真实配置
  else {
    const config = vrfConfig[hre.network.name as keyof typeof vrfConfig];
    if (!config) {
      throw new Error(`VRF config not found for network: ${hre.network.name}`);
    }

    vrfCoordinator = config.vrfCoordinator;
    keyHash = config.keyHash;
    subscriptionId = BigInt(config.subscriptionId);
  }

  // 部署 NFT 合约
  const nft = await deploy("StakabaleNFT", {
    from: deployer,
    args: [subscriptionId, vrfCoordinator, keyHash],
    log: true,
    autoMine: true,
  });

  // 本地网络：自动添加为 consumer
  if (hre.network.name === "hardhat" || hre.network.name === "localhost") {
    const mockContract = await hre.ethers.getContractAt(
      "VRFCoordinatorV2_5Mock",
      vrfCoordinator
    );
    await mockContract.addConsumer(subscriptionId, nft.address);
    console.log("✅ NFT 合约已添加为 Consumer");
  } else {
    console.log(`📝 记得手动添加合约到 Subscription: ${subscriptionId}`);
  }
};

export default deployStakableNFT;
deployStakableNFT.tags = ["StakabaleNFT"];
deployStakableNFT.dependencies = ["mocks"]; // 先部署 mocks
```

### Step 3: 本地测试脚本

`packages/hardhat/scripts/testReveal.ts`：

```typescript
import { ethers } from "hardhat";

async function main() {
  console.log("🎲 测试本地 VRF 揭示...\n");

  // 获取合约
  const nft = await ethers.getContract("StakabaleNFT");
  const vrfCoordinator = await ethers.getContract("VRFCoordinatorV2_5Mock");

  const [deployer, user1, user2] = await ethers.getSigners();

  // 1. 设置稀有度池
  console.log("1️⃣ 设置稀有度池...");
  const rarityPool = generateRarityPool();
  await nft.setRarityPool(rarityPool);
  console.log("✅ 稀有度池已设置\n");

  // 2. Mint NFT
  console.log("2️⃣ 铸造 100 个 NFT...");
  for (let i = 0; i < 10; i++) {
    await nft.connect(user1).mint(5, { value: ethers.parseEther("5") });
    await nft.connect(user2).mint(5, { value: ethers.parseEther("5") });
  }
  const totalMinted = await nft.totalMinted();
  console.log(`✅ 已铸造: ${totalMinted} 个 NFT\n`);

  // 3. 请求揭示
  console.log("3️⃣ 请求 VRF 随机数...");
  const tx = await nft.requestReveal();
  const receipt = await tx.wait();

  // 解析事件获取 requestId
  const event = receipt.logs.find((log: any) => log.fragment?.name === "RandomnessRequested");
  const requestId = event?.args?.requestId;
  console.log(`✅ VRF 请求 ID: ${requestId}\n`);

  // 4. 模拟 VRF 回调（本地可立即触发）
  console.log("4️⃣ 模拟 VRF 回调...");
  await vrfCoordinator.fulfillRandomWords(requestId, await nft.getAddress());
  console.log("✅ VRF 回调完成\n");

  // 5. 验证揭示结果
  console.log("5️⃣ 验证揭示结果...");
  const isRevealed = await nft.isRevealed();
  const revealOffset = await nft.revealOffset();

  console.log(`   揭示状态: ${isRevealed}`);
  console.log(`   随机偏移: ${revealOffset}\n`);

  // 6. 查看前 10 个 NFT 的稀有度
  console.log("6️⃣ 前 10 个 NFT 的稀有度:");
  const rarityNames = ["Common", "Rare", "Epic", "Legendary"];
  for (let tokenId = 1; tokenId <= 10; tokenId++) {
    const rarity = await nft.getRarity(tokenId);
    console.log(`   TokenId ${tokenId}: ${rarityNames[rarity]}`);
  }

  // 7. 统计稀有度分布
  console.log("\n7️⃣ 稀有度分布统计:");
  const counts = [0, 0, 0, 0];
  for (let tokenId = 1; tokenId <= 100; tokenId++) {
    const rarity = await nft.getRarity(tokenId);
    counts[rarity]++;
  }
  console.log(`   Common:    ${counts[0]}`);
  console.log(`   Rare:      ${counts[1]}`);
  console.log(`   Epic:      ${counts[2]}`);
  console.log(`   Legendary: ${counts[3]}`);

  console.log("\n🎉 测试完成！");
}

function generateRarityPool() {
  const pool = [
    ...Array(50).fill(0), // Common
    ...Array(30).fill(1), // Rare
    ...Array(15).fill(2), // Epic
    ...Array(5).fill(3),  // Legendary
  ];
  return shuffle(pool);
}

function shuffle(array: number[]) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
```

### Step 4: 运行本地测试

```bash
# 1. 启动本地 Hardhat 节点
yarn chain

# 2. 部署合约（新终端）
yarn deploy

# 3. 运行测试脚本
yarn hardhat run scripts/testReveal.ts --network localhost

# 或者直接运行单元测试
yarn hardhat test
```

### 预期输出

```
🎲 测试本地 VRF 揭示...

1️⃣ 设置稀有度池...
✅ 稀有度池已设置

2️⃣ 铸造 100 个 NFT...
✅ 已铸造: 100 个 NFT

3️⃣ 请求 VRF 随机数...
✅ VRF 请求 ID: 1

4️⃣ 模拟 VRF 回调...
✅ VRF 回调完成

5️⃣ 验证揭示结果...
   揭示状态: true
   随机偏移: 42

6️⃣ 前 10 个 NFT 的稀有度:
   TokenId 1: Rare
   TokenId 2: Common
   TokenId 3: Epic
   TokenId 4: Common
   TokenId 5: Legendary
   TokenId 6: Common
   TokenId 7: Rare
   TokenId 8: Common
   TokenId 9: Rare
   TokenId 10: Common

7️⃣ 稀有度分布统计:
   Common:    50
   Rare:      30
   Epic:      15
   Legendary: 5

🎉 测试完成！
```

### 本地测试的优势

| 优势 | 说明 |
|------|------|
| ✅ **即时反馈** | 无需等待，立即触发回调 |
| ✅ **完全免费** | 不需要真实 LINK 或 ETH |
| ✅ **快速迭代** | 修改代码后立即测试 |
| ✅ **完全控制** | 可以控制随机数、模拟失败等 |
| ✅ **离线开发** | 不依赖外部网络 |

### 本地测试 vs 真实网络

```
本地 Hardhat (推荐开发阶段):
  部署 → 设置 → 铸造 → 请求 → 立即回调 → 揭示 ✅
  耗时: ~10 秒

Sepolia 测试网:
  部署 → 设置 → 铸造 → 请求 → 等待... → 回调 → 揭示 ✅
  耗时: ~2-5 分钟

Ethereum 主网:
  部署 → 设置 → 铸造 → 请求 → 等待... → 回调 → 揭示 ✅
  耗时: ~2-5 分钟
  费用: ~20 LINK (~$300)
```

---

## 测试

### 单元测试示例

`packages/hardhat/test/StakableNFT.test.ts`：

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";
import { StakabaleNFT, VRFCoordinatorV2_5Mock } from "../typechain-types";

describe("StakableNFT VRF Integration", function () {
  let nft: StakabaleNFT;
  let vrfCoordinator: VRFCoordinatorV2_5Mock;
  let subscriptionId: bigint;

  beforeEach(async function () {
    // 部署 VRF Mock
    const VRFCoordinatorMock = await ethers.getContractFactory("VRFCoordinatorV2_5Mock");
    vrfCoordinator = await VRFCoordinatorMock.deploy(
      100000000000000000n, // 0.1 LINK base fee
      1000000000n,          // 1 gwei gas price
      1000000000000000000n  // 1 LINK wei per unit gas
    );

    // 创建 subscription
    const tx = await vrfCoordinator.createSubscription();
    const receipt = await tx.wait();
    subscriptionId = receipt.logs[0].args.subId;

    // 充值 subscription
    await vrfCoordinator.fundSubscription(subscriptionId, ethers.parseEther("100"));

    // 部署 NFT 合约
    const NFT = await ethers.getContractFactory("StakabaleNFT");
    nft = await NFT.deploy(
      subscriptionId,
      await vrfCoordinator.getAddress(),
      "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae"
    );

    // 添加 consumer
    await vrfCoordinator.addConsumer(subscriptionId, await nft.getAddress());
  });

  it("Should request and fulfill randomness", async function () {
    // 1. 设置稀有度池
    const rarityPool = generateRarityPool();
    await nft.setRarityPool(rarityPool);

    // 2. Mint 所有 NFT
    for (let i = 0; i < 10; i++) {
      await nft.mint(10, { value: ethers.parseEther("10") });
    }

    // 3. 请求揭示
    const tx = await nft.requestReveal();
    const receipt = await tx.wait();

    const requestId = receipt.logs[0].args.requestId;
    expect(await nft.vrfRequested()).to.be.true;

    // 4. 模拟 VRF 回调
    await vrfCoordinator.fulfillRandomWords(requestId, await nft.getAddress());

    // 5. 验证揭示成功
    expect(await nft.isRevealed()).to.be.true;

    const rarity = await nft.getRarity(1);
    expect(rarity).to.be.oneOf([0, 1, 2, 3]); // Common, Rare, Epic, Legendary
  });
});

function generateRarityPool() {
  const pool = [
    ...Array(50).fill(0), // Common
    ...Array(30).fill(1), // Rare
    ...Array(15).fill(2), // Epic
    ...Array(5).fill(3),  // Legendary
  ];
  return shuffle(pool);
}
```

### 运行测试

```bash
yarn hardhat test
```

---

## 费用估算

### LINK 消耗计算

```
总费用 = 基础费用 + (Gas Price × Callback Gas Limit) / LINK 价格
```

### 实际费用示例（Ethereum 主网）

| 参数 | 值 |
|------|---|
| 基础费用 | 0.25 LINK |
| Gas Limit | 2,500,000 |
| Gas Price | 30 gwei |
| 总 Gas 费 | 0.075 ETH (~$300 @ $4000 ETH) |
| LINK 价格 | $15 |
| LINK 费用 | 0.25 + (0.075 × 4000 / 15) = **20.25 LINK** |

**总成本：约 $303（20.25 LINK）**

### Sepolia 测试网

- **免费** - 从 [Faucet](https://faucets.chain.link/) 获取测试 LINK

---

## 最佳实践

### ✅ 推荐做法

1. **在 Subscription 中保持充足余额** - 至少 50 LINK
2. **使用合理的 Gas Limit** - 避免过高（浪费）或过低（失败）
3. **添加紧急揭示函数** - 防止 VRF 服务异常
4. **记录 VRF 请求 ID** - 便于追踪和调试
5. **测试网充分测试** - 主网费用昂贵

### ❌ 避免的错误

1. ❌ 忘记添加合约为 Consumer
2. ❌ Subscription 余额不足
3. ❌ Gas Limit 设置错误
4. ❌ 在回调中执行复杂逻辑（超出 Gas Limit）
5. ❌ 没有备用揭示方案

---

## 故障排查

### VRF 请求未返回？

1. **检查 Subscription 余额**
   ```bash
   # 访问 https://vrf.chain.link/
   # 查看 Subscription 余额是否充足
   ```

2. **检查合约是否为 Consumer**
   ```solidity
   // 确认合约地址已添加到 Subscription
   ```

3. **检查网络确认数**
   ```solidity
   // Sepolia: 3 confirmations (~1 分钟)
   // Mainnet: 3 confirmations (~1 分钟)
   ```

4. **查看 Chainlink 节点状态**
   - [Chainlink Status](https://status.chain.link/)

### Gas 估算错误？

```solidity
// 增加 Gas Limit
uint32 private constant CALLBACK_GAS_LIMIT = 3000000; // 提高到 3M
```

---

## 参考资源

- [Chainlink VRF 官方文档](https://docs.chain.link/vrf)
- [VRF v2.5 升级指南](https://docs.chain.link/vrf/v2-5/migration-from-v2)
- [支持的网络配置](https://docs.chain.link/vrf/v2-5/supported-networks)
- [VRF Subscription Manager](https://vrf.chain.link/)
- [Chainlink Faucet](https://faucets.chain.link/)

---

## 下一步

集成完成后，你可以：

1. ✅ 实现质押功能
2. ✅ 添加稀有度奖励倍率
3. ✅ 集成 Ponder 索引
4. ✅ 构建前端 UI

Happy coding! 🚀
