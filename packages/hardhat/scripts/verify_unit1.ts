import { ethers } from "hardhat";

async function main() {
  console.log("🔍 Starting Unit 1 Verification: Vote-Ready Token");

  // 1. Deploy
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);

  const RewardTokenFactory = await ethers.getContractFactory("RewardToken");
  const rewardToken = await RewardTokenFactory.deploy();
  await rewardToken.waitForDeployment();
  const rewardTokenAddress = await rewardToken.getAddress();
  console.log(`✅ RewardToken deployed to: ${rewardTokenAddress}`);

  // 2. Grant Minter Role & Mint
  const MINTER_ROLE = await rewardToken.MINTER_ROLE();
  await rewardToken.grantRole(MINTER_ROLE, deployer.address);
  console.log("🛠️ Granted MINTER_ROLE to deployer");

  const mintAmount = ethers.parseEther("1000");
  await rewardToken.mint(deployer.address, mintAmount);
  console.log(`💰 Minted 1000 RWRD to deployer`);

  // 3. Check Initial Votes (Should be 0)
  const initialVotes = await rewardToken.getVotes(deployer.address);
  console.log(`📊 Initial Votes: ${ethers.formatEther(initialVotes)} (Expected: 0.0)`);

  if (initialVotes !== 0n) {
    throw new Error("❌ Initial votes should be 0 before delegation!");
  }

  // 4. Delegate to Self
  console.log("🗳️ Delegating to self...");
  const tx = await rewardToken.delegate(deployer.address);
  await tx.wait();

  // 5. Check Votes After Delegation (Should be 1000)
  const finalVotes = await rewardToken.getVotes(deployer.address);
  console.log(`📊 Final Votes: ${ethers.formatEther(finalVotes)} (Expected: 1000.0)`);

  if (finalVotes === mintAmount) {
    console.log("✅ SUCCESS: Voting power correctly activated!");
  } else {
    console.error("❌ FAILURE: Voting power mismatch.");
    process.exit(1);
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
