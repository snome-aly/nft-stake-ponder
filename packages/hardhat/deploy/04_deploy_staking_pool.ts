import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * 部署 NFTStakingPool 合约
 * 这是 NFT 质押系统的核心合约，负责管理质押、解押和奖励分发
 *
 * @param hre HardhatRuntimeEnvironment 对象
 */
const deployNFTStakingPool: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("\n🏦 开始部署 NFTStakingPool 合约...");
  console.log(`📝 部署者地址: ${deployer}`);

  // 获取已部署的合约地址
  const stakableNFT = await hre.deployments.get("StakableNFT");
  const rewardToken = await hre.deployments.get("RewardToken");

  console.log(`📍 StakableNFT 地址: ${stakableNFT.address}`);
  console.log(`📍 RewardToken 地址: ${rewardToken.address}`);

  // 部署合约
  const deployResult = await deploy("NFTStakingPool", {
    from: deployer,
    args: [stakableNFT.address, rewardToken.address],
    log: true,
    autoMine: true,
  });

  // 获取已部署的合约
  const stakingPool = await hre.ethers.getContract<Contract>("NFTStakingPool", deployer);
  const contractAddress = await stakingPool.getAddress();

  if (deployResult.newlyDeployed) {
    console.log(`✅ NFTStakingPool 新部署成功！`);
    console.log(`📍 合约地址: ${contractAddress}`);
    console.log(`⛽ Gas 使用: ${deployResult.receipt?.gasUsed?.toString() || "N/A"}`);

    // 授予 MINTER_ROLE
    console.log("\n🔑 授予 MINTER_ROLE...");
    const rewardTokenContract = await hre.ethers.getContract<Contract>("RewardToken", deployer);
    const MINTER_ROLE = await rewardTokenContract.MINTER_ROLE();

    // 检查是否已有 MINTER_ROLE
    const hasMinterRole = await rewardTokenContract.hasRole(MINTER_ROLE, contractAddress);

    if (!hasMinterRole) {
      console.log(`🔑 授予 MINTER_ROLE 给 NFTStakingPool (${contractAddress})...`);
      const tx = await rewardTokenContract.grantRole(MINTER_ROLE, contractAddress);
      await tx.wait();
      console.log("✅ MINTER_ROLE 已授予");
    } else {
      console.log(`✅ NFTStakingPool 已拥有 MINTER_ROLE`);
    }
  } else {
    console.log(`✅ NFTStakingPool 已存在！`);
    console.log(`📍 合约地址: ${contractAddress}`);
  }

  // 验证配置
  console.log("\n📊 合约状态:");
  const stakableNFTAddress = await stakingPool.stakableNFT();
  const rewardTokenAddress = await stakingPool.rewardToken();
  const baseRewardPerSecond = await stakingPool.baseRewardPerSecond();
  const isPaused = await stakingPool.paused();
  const owner = await stakingPool.owner();

  console.log(`   StakableNFT: ${stakableNFTAddress}`);
  console.log(`   RewardToken: ${rewardTokenAddress}`);
  console.log(`   基础奖励速率: ${baseRewardPerSecond.toString()} wei/秒`);
  console.log(`   是否暂停: ${isPaused}`);
  console.log(`   Owner: ${owner}`);

  // 验证 MINTER_ROLE
  const rewardTokenContract = await hre.ethers.getContract<Contract>("RewardToken", deployer);
  const MINTER_ROLE = await rewardTokenContract.MINTER_ROLE();
  const hasMinterRole = await rewardTokenContract.hasRole(MINTER_ROLE, contractAddress);
  console.log(`   拥有 MINTER_ROLE: ${hasMinterRole}`);

  // 计算预期日奖励（1 RWRD/天）
  const expectedDailyReward = BigInt(86400) * baseRewardPerSecond;
  console.log(`   预期日奖励（1x倍率）: ${hre.ethers.formatEther(expectedDailyReward)} RWRD`);

  console.log("\n🎉 部署完成！");
  console.log("💡 提示: 用户需要先 approve NFT 给 StakingPool 才能质押");
};

export default deployNFTStakingPool;

// 标签和依赖
deployNFTStakingPool.tags = ["NFTStakingPool"];
deployNFTStakingPool.dependencies = ["StakableNFT", "RewardToken"];
