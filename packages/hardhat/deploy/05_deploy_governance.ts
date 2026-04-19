import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * 部署 Governance 相关合约 (Timelock, Governor) 并配置权限
 * 这是 "Wiring" 的关键步骤，将所有组件连接起来
 */
const deployGovernance: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("\n🏛️ 开始部署 Governance 模块...");
  console.log(`📝 部署者地址: ${deployer}`);

  // 1. 获取基础合约 (已在之前的脚本中部署)
  const rewardTokenDeploy = await hre.deployments.get("RewardToken");
  const nftStakingPoolDeploy = await hre.deployments.get("NFTStakingPool");
  const rewardToken = await hre.ethers.getContractAt("RewardToken", rewardTokenDeploy.address);
  const nftStakingPool = await hre.ethers.getContractAt("NFTStakingPool", nftStakingPoolDeploy.address);

  // 2. 部署 TimelockController
  // Min Delay = 0 (方便测试)
  // Proposers = [] (稍后设为 Governor)
  // Executors = [] (稍后设为 Open/Zero Address)
  // Admin = Deployer (稍后移交)
  console.log("\n⏳ 部署 Timelock...");
  const timelockResult = await deploy("Timelock", {
    from: deployer,
    args: [0, [], [], deployer], // minDelay, proposers, executors, admin
    log: true,
    autoMine: true,
  });
  const timelock = await hre.ethers.getContractAt("Timelock", timelockResult.address);

  // 3. 部署 MyGovernor
  console.log("\n📜 部署 MyGovernor...");
  const governorResult = await deploy("MyGovernor", {
    from: deployer,
    args: [rewardTokenDeploy.address, timelockResult.address],
    log: true,
    autoMine: true,
  });
  await hre.ethers.getContractAt("MyGovernor", governorResult.address);

  // ============ 4. 权限组装 (The Wiring) ============
  console.log("\n🔌 开始组装权限...");

  // 4.1 设置 Timelock 角色
  // Timelock 角色常量
  const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
  const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();
  const CANCELLER_ROLE = await timelock.CANCELLER_ROLE();

  // (A) Proposer -> Governor
  if (!(await timelock.hasRole(PROPOSER_ROLE, governorResult.address))) {
    console.log("   + 授予 Governor PROPOSER_ROLE");
    await timelock.grantRole(PROPOSER_ROLE, governorResult.address).then(tx => tx.wait());
  }

  // (B) Executor -> Zero Address (任何人可执行)
  const zeroAddress = "0x0000000000000000000000000000000000000000";
  if (!(await timelock.hasRole(EXECUTOR_ROLE, zeroAddress))) {
    console.log("   + 授予 任何人 EXECUTOR_ROLE");
    await timelock.grantRole(EXECUTOR_ROLE, zeroAddress).then(tx => tx.wait());
  }

  // (C) Canceller -> Deployer (可选：用于紧急取消，生产环境应设为 Guardian Multisig)
  if (!(await timelock.hasRole(CANCELLER_ROLE, deployer))) {
    console.log("   + 授予 Deployer CANCELLER_ROLE (Dev Only)");
    await timelock.grantRole(CANCELLER_ROLE, deployer).then(tx => tx.wait());
  }

  // 4.2 移交 StakingPool 权限
  // Pool 的 Owner 变更为 Timelock
  const currentOwner = await nftStakingPool.owner();
  if (currentOwner.toLowerCase() !== timelockResult.address.toLowerCase()) {
    console.log(`   + 正在将 Pool Ownership 转移给 Timelock...`);
    await nftStakingPool.transferOwnership(timelockResult.address).then(tx => tx.wait());
    console.log("   ✅ Ownership 转移完成");
  } else {
    console.log("   ✅ Pool 已经属于 Timelock");
  }

  // 4.3 (可选) 放弃 Timelock 管理员权限 (为了去中心化，Timelock 应该管理自己)
  // 在测试阶段我们保留 deployer 作为 Timelock admin 方便调试
  console.log("   ! [Dev] 保留 Deployer 作为 Timelock Admin");

  // ============ 5. Bootstrap 投票权 ============
  console.log("\n🗳️ Bootstrap Initial Votes...");

  const shouldBootstrapVotes =
    hre.network.name === "hardhat" ||
    hre.network.name === "localhost" ||
    process.env.BOOTSTRAP_GOVERNANCE_VOTES === "true";

  if (shouldBootstrapVotes) {
    // 本地治理烟测需要初始票权；线上测试网默认不预铸假票，避免作品集展示数据失真。
    const mintAmount = hre.ethers.parseEther("100000"); // 100k
    const balance = await rewardToken.balanceOf(deployer);
    if (balance < mintAmount) {
      console.log("   + Minting 100k RWRD to deployer for local governance testing...");
      // 注意：deployer 需要有 MINTER_ROLE，这通常在 03_deploy_reward_token 中设置了
      await rewardToken.mint(deployer, mintAmount).then(tx => tx.wait());
    }

    // 委托给自己
    const currentVotes = await rewardToken.getVotes(deployer);
    if (currentVotes === 0n) {
      console.log("   + Delegating to self...");
      await rewardToken.delegate(deployer).then(tx => tx.wait());
      console.log("   ✅ Delegation complete");
    } else {
      console.log(`   ✅ 已有投票权: ${hre.ethers.formatEther(currentVotes)}`);
    }
  } else {
    console.log("   ↳ 跳过线上网络初始 100k RWRD 投票权预铸");
    console.log("   ↳ 如需演示治理，可设置 BOOTSTRAP_GOVERNANCE_VOTES=true 后重新部署");
    const currentVotes = await rewardToken.getVotes(deployer);
    if (currentVotes > 0n) {
      console.log(`   ✅ 当前已有投票权: ${hre.ethers.formatEther(currentVotes)}`);
    }
  }

  console.log("\n🎉 Governance 部署与组装完成！");
  console.log("----------------------------------------------------");
  console.log(`Governor: ${governorResult.address}`);
  console.log(`Timelock: ${timelockResult.address}`);
  console.log(`Token:    ${rewardTokenDeploy.address}`);
  console.log(`Pool:     ${nftStakingPoolDeploy.address}`);
  console.log("----------------------------------------------------");
};

export default deployGovernance;

deployGovernance.tags = ["Governance"];
deployGovernance.dependencies = ["RewardToken", "NFTStakingPool"];
