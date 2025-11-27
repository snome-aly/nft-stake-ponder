import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * 稀有度枚举（与合约保持一致）
 */
enum Rarity {
  Common = 0,
  Rare = 1,
  Epic = 2,
  Legendary = 3,
}

/**
 * Fisher-Yates 洗牌算法
 */
function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * 生成稀有度池
 */
function generateRarityPool(): number[] {
  const pool: number[] = [];

  // Common: 50个
  for (let i = 0; i < 50; i++) {
    pool.push(Rarity.Common);
  }

  // Rare: 30个
  for (let i = 0; i < 30; i++) {
    pool.push(Rarity.Rare);
  }

  // Epic: 15个
  for (let i = 0; i < 15; i++) {
    pool.push(Rarity.Epic);
  }

  // Legendary: 5个
  for (let i = 0; i < 5; i++) {
    pool.push(Rarity.Legendary);
  }

  return shuffle(pool);
}

/**
 * 验证稀有度分布
 */
function validateRarityPool(pool: number[]): boolean {
  const counts = [0, 0, 0, 0];
  pool.forEach(rarity => counts[rarity]++);

  return (
    pool.length === 100 &&
    counts[Rarity.Common] === 50 &&
    counts[Rarity.Rare] === 30 &&
    counts[Rarity.Epic] === 15 &&
    counts[Rarity.Legendary] === 5
  );
}

/**
 * 初始化 StakableNFT 合约配置
 * 设置稀有度池（如果尚未设置）
 *
 * @param hre HardhatRuntimeEnvironment 对象
 */
const setupInitialConfig: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { operator } = await hre.getNamedAccounts();

  console.log("\n⚙️  开始初始化 StakableNFT 配置...");

  // 获取已部署的合约（使用 operator 账户签名）
  const stakableNFT = await hre.ethers.getContract<Contract>("StakableNFT", operator);
  const contractAddress = await stakableNFT.getAddress();
  console.log(`📍 合约地址: ${contractAddress}`);
  console.log(`👤 操作员地址: ${operator}`);

  // 检查稀有度池是否已设置
  const rarityPoolSet = await stakableNFT.rarityPoolSet();
  console.log(`📊 稀有度池是否已设置: ${rarityPoolSet}`);

  if (rarityPoolSet) {
    console.log("✅ 稀有度池已设置，跳过初始化");
    return;
  }

  // 检查 operator 是否有 OPERATOR_ROLE
  const OPERATOR_ROLE = await stakableNFT.OPERATOR_ROLE();
  const hasOperatorRole = await stakableNFT.hasRole(OPERATOR_ROLE, operator);

  if (!hasOperatorRole) {
    console.log("❌ 错误: operator 账户没有 OPERATOR_ROLE，无法设置稀有度池");
    console.log("💡 请确保在 01_deploy_stakable_nft.ts 中已授予 operator 该角色");
    return;
  }

  // 生成稀有度池
  console.log("\n🎲 生成稀有度池...");
  const rarityPool = generateRarityPool();

  // 验证稀有度池
  if (!validateRarityPool(rarityPool)) {
    console.log("❌ 错误: 稀有度池验证失败！");
    return;
  }

  // 统计稀有度分布
  const counts = [0, 0, 0, 0];
  rarityPool.forEach(r => counts[r]++);
  console.log("📊 稀有度分布:");
  console.log(`   Common:    ${counts[Rarity.Common]} (预期: 50)`);
  console.log(`   Rare:      ${counts[Rarity.Rare]} (预期: 30)`);
  console.log(`   Epic:      ${counts[Rarity.Epic]} (预期: 15)`);
  console.log(`   Legendary: ${counts[Rarity.Legendary]} (预期: 5)`);

  // 设置稀有度池
  console.log("\n📤 提交稀有度池到合约...");
  try {
    const tx = await stakableNFT.setRarityPool(rarityPool);
    console.log(`⏳ 交易哈希: ${tx.hash}`);
    console.log("⏳ 等待交易确认...");
    await tx.wait();
    console.log("✅ 稀有度池设置成功！");

    // 验证设置结果
    const poolSetAfter = await stakableNFT.rarityPoolSet();
    console.log(`\n🔍 验证: rarityPoolSet = ${poolSetAfter}`);

    // 读取第一个稀有度作为示例验证
    const firstRarity = await stakableNFT.rarityPool(0);
    const rarityName = Rarity[Number(firstRarity)];
    console.log(`🔍 验证: rarityPool[0] = ${firstRarity} (${rarityName})`);

    // 显示奖励倍率配置
    console.log("\n💰 奖励倍率配置:");
    for (let i = 0; i < 4; i++) {
      const multiplier = await stakableNFT.rewardMultiplier(i);
      const multiplierFormatted = (Number(multiplier) / 10000).toFixed(2);
      console.log(`   ${Rarity[i]}: ${multiplierFormatted}x (${multiplier})`);
    }

    console.log("\n🎉 初始化配置完成！");
    console.log("💡 下一步:");
    console.log("   1. 用户可以开始铸造 NFT (调用 mint 函数)");
    console.log("   2. 等待所有 NFT 铸造完成后，管理员调用 reveal() 揭示稀有度");
  } catch (error: any) {
    console.log("❌ 设置稀有度池失败:");
    console.log(error.message);
  }
};

export default setupInitialConfig;

// 设置依赖关系：必须在 StakableNFT 部署后运行
setupInitialConfig.dependencies = ["StakableNFT"];
setupInitialConfig.tags = ["StakableNFTConfig"];
