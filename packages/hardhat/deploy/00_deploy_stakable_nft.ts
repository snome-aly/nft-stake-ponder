import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * 部署 StakableNFT 合约
 * 这是一个盲盒 NFT 合约，支持稀有度系统和质押功能
 *
 * @param hre HardhatRuntimeEnvironment 对象
 */
const deployStakableNFT: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  /*
    在本地环境，部署者账户是 Hardhat 自带的账户，已经预先充值。

    当部署到真实网络（例如 `yarn deploy --network sepolia`）时，部署者账户
    应该有足够余额支付合约创建的燃气费用。

    你可以使用 `yarn account:generate` 生成一个随机账户，或者使用 `yarn account:import` 导入你的
    已有私钥，这会填充 .env 文件中的 DEPLOYER_PRIVATE_KEY_ENCRYPTED（然后在 hardhat.config.ts 中使用）
    你可以运行 `yarn account` 命令查看你在每个网络的余额。
  */
  const { deployer, operator, pauser } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("\n🚀 开始部署 StakableNFT 合约...");
  console.log(`📝 部署者地址: ${deployer}`);
  console.log(`👤 操作员地址: ${operator}`);
  console.log(`🛡️  安全员地址: ${pauser}`);

  // 部署合约（构造函数会自动设置 deployer 为 DEFAULT_ADMIN_ROLE）
  const deployResult = await deploy("StakableNFT", {
    from: deployer,
    // 合约构造函数无参数
    args: [],
    log: true,
    // autoMine: 可以传递给 deploy 函数以加快本地网络上的部署过程，
    // 通过自动挖矿合约部署交易。对真实网络无效。
    autoMine: true,
  });

  // 获取已部署的合约以便在部署后进行交互
  const stakableNFT = await hre.ethers.getContract<Contract>("StakableNFT", deployer);
  const contractAddress = await stakableNFT.getAddress();

  if (deployResult.newlyDeployed) {
    console.log(`✅ StakableNFT 新部署成功！`);
    console.log(`📍 合约地址: ${contractAddress}`);
    console.log(`⛽ Gas 使用: ${deployResult.receipt?.gasUsed?.toString() || "N/A"}`);
  } else {
    console.log(`✅ StakableNFT 已存在！`);
    console.log(`📍 合约地址: ${contractAddress}`);
  }

  // 授予角色权限
  console.log("\n⚙️  设置角色权限...");

  const OPERATOR_ROLE = await stakableNFT.OPERATOR_ROLE();
  const PAUSER_ROLE = await stakableNFT.PAUSER_ROLE();

  // 检查各账户是否已有对应角色
  const hasOperatorRole = await stakableNFT.hasRole(OPERATOR_ROLE, operator);
  const hasPauserRole = await stakableNFT.hasRole(PAUSER_ROLE, pauser);

  if (!hasOperatorRole) {
    console.log(`🔑 授予 OPERATOR_ROLE 给 ${operator}...`);
    const tx1 = await stakableNFT.grantRole(OPERATOR_ROLE, operator);
    await tx1.wait();
    console.log("✅ OPERATOR_ROLE 已授予");
  } else {
    console.log(`✅ ${operator} 已拥有 OPERATOR_ROLE`);
  }

  if (!hasPauserRole) {
    console.log(`🔑 授予 PAUSER_ROLE 给 ${pauser}...`);
    const tx2 = await stakableNFT.grantRole(PAUSER_ROLE, pauser);
    await tx2.wait();
    console.log("✅ PAUSER_ROLE 已授予");
  } else {
    console.log(`✅ ${pauser} 已拥有 PAUSER_ROLE`);
  }

  // 显示合约状态
  console.log("\n📊 合约状态:");
  console.log(`   最大供应量: ${await stakableNFT.MAX_SUPPLY()}`);
  console.log(`   每地址最大铸造数: ${await stakableNFT.MAX_PER_ADDRESS()}`);
  console.log(`   铸造价格: ${hre.ethers.formatEther(await stakableNFT.MINT_PRICE())} ETH`);
  console.log(`   已铸造数量: ${await stakableNFT.totalMinted()}`);
  console.log(`   稀有度池是否已设置: ${await stakableNFT.rarityPoolSet()}`);
  console.log(`   是否已揭示: ${await stakableNFT.isRevealed()}`);

  console.log("\n🎉 部署完成！");
  console.log("💡 下一步: 运行初始化配置脚本设置稀有度池");
};

export default deployStakableNFT;

// 标签在有多个部署文件时非常有用，可以只运行其中一个。
// 例如：yarn deploy --tags StakableNFT
deployStakableNFT.tags = ["StakableNFT"];
