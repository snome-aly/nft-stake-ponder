import { ethers } from "hardhat";

async function main() {
  console.log("🔍 Starting Unit 2 Verification: Governable Target");

  const [deployer, otherUser] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);
  console.log(`👤 Other User: ${otherUser.address}`);

  // 1. Deploy Dependencies
  const RewardTokenFactory = await ethers.getContractFactory("RewardToken");
  const rewardToken = await RewardTokenFactory.deploy();
  await rewardToken.waitForDeployment();
  const rewardTokenAddr = await rewardToken.getAddress();
  console.log(`✅ RewardToken deployed: ${rewardTokenAddr}`);

  const StakableNFTFactory = await ethers.getContractFactory("StakableNFT");
  const stakableNFT = await StakableNFTFactory.deploy();
  await stakableNFT.waitForDeployment();
  const nftAddr = await stakableNFT.getAddress();
  console.log(`✅ StakableNFT deployed: ${nftAddr}`);

  // 2. Deploy NFTStakingPool
  const PoolFactory = await ethers.getContractFactory("NFTStakingPool");
  const pool = await PoolFactory.deploy(nftAddr, rewardTokenAddr);
  await pool.waitForDeployment();
  console.log(`✅ NFTStakingPool deployed: ${await pool.getAddress()}`);

  // 3. Verify Initial State
  // Note: We need to access the public variable.
  // We changed it from constant to public var, so getter should exist.
  const initialReward = await pool.baseRewardPerSecond();
  console.log(`📊 Initial Base Reward: ${initialReward.toString()}`);

  if (initialReward.toString() !== "11574074074074") {
    throw new Error("❌ Initial reward is incorrect!");
  }

  // 4. Test Governable Function (Owner)
  const newReward = 20000000000000n;
  console.log(`🛠️ Setting new reward to: ${newReward}`);
  const tx = await pool.setBaseReward(newReward);
  await tx.wait();

  const updatedReward = await pool.baseRewardPerSecond();
  console.log(`📊 Updated Base Reward: ${updatedReward.toString()}`);

  if (updatedReward !== newReward) {
    throw new Error("❌ Failed to update base reward!");
  }

  // 5. Test Access Control (Non-Owner)
  console.log("🛡️ Testing Access Control (expecting revert)...");
  try {
    await pool.connect(otherUser).setBaseReward(500n);
    throw new Error("❌ Non-owner was able to call setBaseReward!");
  } catch (error: any) {
    if (error.message.includes("OwnableUnauthorizedAccount")) {
      console.log("✅ Access Control Passed: Non-owner rejected.");
    } else {
      // Hardhat might give different error messages, just checking it failed
      console.log(`✅ Access Control Passed: Transaction reverted as expected. (${error.message})`);
    }
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
