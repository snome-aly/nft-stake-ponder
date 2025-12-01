import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * 部署 RewardToken 合约
 * 这是 NFT 质押系统的 ERC20 奖励代币
 *
 * @param hre HardhatRuntimeEnvironment 对象
 */
const deployRewardToken: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("\n🪙 开始部署 RewardToken 合约...");
  console.log(`📝 部署者地址: ${deployer}`);

  // 部署合约（构造函数会自动设置 deployer 为 DEFAULT_ADMIN_ROLE）
  const deployResult = await deploy("RewardToken", {
    from: deployer,
    // 合约构造函数无参数
    args: [],
    log: true,
    autoMine: true,
  });

  // 获取已部署的合约
  const rewardToken = await hre.ethers.getContract<Contract>("RewardToken", deployer);
  const contractAddress = await rewardToken.getAddress();

  if (deployResult.newlyDeployed) {
    console.log(`✅ RewardToken 新部署成功！`);
    console.log(`📍 合约地址: ${contractAddress}`);
    console.log(`⛽ Gas 使用: ${deployResult.receipt?.gasUsed?.toString() || "N/A"}`);
  } else {
    console.log(`✅ RewardToken 已存在！`);
    console.log(`📍 合约地址: ${contractAddress}`);
  }

  // 显示合约状态
  console.log("\n📊 合约状态:");
  console.log(`   代币名称: ${await rewardToken.name()}`);
  console.log(`   代币符号: ${await rewardToken.symbol()}`);
  console.log(`   代币精度: ${await rewardToken.decimals()}`);
  console.log(`   总供应量: ${hre.ethers.formatEther(await rewardToken.totalSupply())} RWRD`);

  const DEFAULT_ADMIN_ROLE = await rewardToken.DEFAULT_ADMIN_ROLE();
  const hasAdminRole = await rewardToken.hasRole(DEFAULT_ADMIN_ROLE, deployer);
  console.log(`   部署者是否为管理员: ${hasAdminRole}`);

  console.log("\n🎉 部署完成！");
  console.log("💡 下一步: 部署 NFTStakingPool 合约并授予 MINTER_ROLE");
};

export default deployRewardToken;

// 标签在有多个部署文件时非常有用
// 例如：yarn deploy --tags RewardToken
deployRewardToken.tags = ["RewardToken"];
