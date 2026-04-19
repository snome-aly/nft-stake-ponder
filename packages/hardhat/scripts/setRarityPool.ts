import { ethers } from "ethers";
import * as fs from "fs";

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
  for (let i = 0; i < 50; i++) pool.push(Rarity.Common);
  for (let i = 0; i < 30; i++) pool.push(Rarity.Rare);
  for (let i = 0; i < 15; i++) pool.push(Rarity.Epic);
  for (let i = 0; i < 5; i++) pool.push(Rarity.Legendary);
  return shuffle(pool);
}

async function main() {
  console.log("🔑 请输入 Operator 账户的私钥：");
  const privateKey = await new Promise<string>(resolve => {
    process.stdin.on("data", data => {
      process.stdin.pause();
      resolve(data.toString().trim());
    });
  });

  if (!privateKey || privateKey.length < 64) {
    console.error("❌ 无效的私钥");
    process.exit(1);
  }

  const wallet = new ethers.Wallet(privateKey);
  console.log(`\n✅ 钱包地址: ${wallet.address}`);

  const rpcUrl = process.env.SEPOLIA_RPC_URL || "https://eth-sepolia.g.alchemy.com/v2/jaaWQphfTYPw8Aj2Yxg0Z";
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = wallet.connect(provider);

  const network = await provider.getNetwork();
  console.log(`🔗 连接到 Sepolia (Chain ID: ${Number(network.chainId)})`);

  const deployedContractsPath = "../nextjs/contracts/deployedContracts.ts";
  if (!fs.existsSync(deployedContractsPath)) {
    console.error("❌ 未找到 deployedContracts.ts");
    process.exit(1);
  }

  const contractContent = fs.readFileSync(deployedContractsPath, "utf-8");
  const addressMatch = contractContent.match(/StakableNFT:\s*\{[^}]*address:\s*"([^"]+)"/);
  if (!addressMatch) {
    console.error("❌ 无法从 deployedContracts.ts 提取 StakableNFT 地址");
    process.exit(1);
  }
  const contractAddress = addressMatch[1];
  console.log(`📍 StakableNFT 合约地址: ${contractAddress}`);

  const contract = new ethers.Contract(
    contractAddress,
    [
      "function rarityPoolSet() view returns (bool)",
      "function setRarityPool(uint8[] memory _pool) external",
      "function hasRole(bytes32 role, address account) view returns (bool)",
      "function OPERATOR_ROLE() view returns (bytes32)",
      "function DEFAULT_ADMIN_ROLE() view returns (bytes32)",
    ],
    signer,
  );

  const [rarityPoolSet, operatorRole] = await Promise.all([contract.rarityPoolSet(), contract.OPERATOR_ROLE()]);

  console.log(`📊 稀有度池是否已设置: ${rarityPoolSet}`);

  const isOperator = await contract.hasRole(operatorRole, wallet.address);
  console.log(`🔑 当前账户是否有 Operator 权限: ${isOperator}`);

  if (!isOperator) {
    console.error("❌ 当前账户没有 Operator 权限，无法设置稀有度池");
    process.exit(1);
  }

  if (rarityPoolSet) {
    console.log("✅ 稀有度池已经设置过了，无需重复设置");
    process.exit(0);
  }

  console.log("\n🎲 生成稀有度池...");
  const rarityPool = generateRarityPool();
  const counts = [0, 0, 0, 0];
  rarityPool.forEach(r => counts[r]++);
  console.log("📊 稀有度分布:");
  console.log(`   Common:    ${counts[Rarity.Common]} (预期: 50)`);
  console.log(`   Rare:      ${counts[Rarity.Rare]} (预期: 30)`);
  console.log(`   Epic:      ${counts[Rarity.Epic]} (预期: 15)`);
  console.log(`   Legendary: ${counts[Rarity.Legendary]} (预期: 5)`);

  console.log("\n📤 提交稀有度池到合约...");
  try {
    const tx = await contract.setRarityPool(rarityPool);
    console.log(`⏳ 交易哈希: ${tx.hash}`);
    console.log("⏳ 等待交易确认...");
    const receipt = await tx.wait();
    console.log(`✅ 稀有度池设置成功！`);
    console.log(`   Gas 使用: ${receipt.gasUsed}`);

    const poolSetAfter = await contract.rarityPoolSet();
    console.log(`🔍 验证: rarityPoolSet = ${poolSetAfter}`);
  } catch (error: any) {
    console.error("❌ 设置稀有度池失败:", error.message || error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error("❌ 脚本执行失败:", error);
  process.exit(1);
});
