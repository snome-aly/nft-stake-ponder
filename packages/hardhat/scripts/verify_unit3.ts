import { ethers } from "hardhat";

async function main() {
  console.log("🔍 Starting Unit 3 Verification: Governance Engine");

  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);

  // 1. Deploy Timelock
  // Min Delay = 0 (for testing)
  // Proposers = [] (empty for now, will set later)
  // Executors = [] (empty for now)
  // Admin = Deployer (temporarily, so we can set roles later)
  const TimelockFactory = await ethers.getContractFactory("Timelock");
  const timelock = await TimelockFactory.deploy(0, [], [], deployer.address);
  await timelock.waitForDeployment();
  const timelockAddress = await timelock.getAddress();
  console.log(`✅ Timelock deployed to: ${timelockAddress}`);

  // 2. Deploy RewardToken (Foundational dependency)
  const TokenFactory = await ethers.getContractFactory("RewardToken");
  const token = await TokenFactory.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log(`✅ RewardToken deployed to: ${tokenAddress}`);

  // 3. Deploy Governor
  const GovernorFactory = await ethers.getContractFactory("MyGovernor");
  const governor = await GovernorFactory.deploy(tokenAddress, timelockAddress);
  await governor.waitForDeployment();
  const governorAddress = await governor.getAddress();
  console.log(`✅ MyGovernor deployed to: ${governorAddress}`);

  // 4. Verify Parameters
  const votingPeriod = await governor.votingPeriod();
  const votingDelay = await governor.votingDelay();
  const name = await governor.name();

  console.log(`📊 Voting Period: ${votingPeriod} blocks (Expected: 50)`);
  console.log(`📊 Voting Delay: ${votingDelay} blocks (Expected: 1)`);
  console.log(`📊 Governor Name: ${name}`);

  if (votingPeriod !== 50n) throw new Error("❌ Voting Period mismatch!");
  if (votingDelay !== 1n) throw new Error("❌ Voting Delay mismatch!");

  // 5. Verify Timelock Connection
  // Note: We use the function `timelock()` if it exists, but in standard GovernorTimelockControl it might not be public
  // Wait, GovernorTimelockControl adds `timelock()` public view.
  const govTimelock = await governor.timelock();
  console.log(`🔗 Governor Timelock: ${govTimelock} (Expected: ${timelockAddress})`);

  if (govTimelock !== timelockAddress) throw new Error("❌ Timelock address mismatch!");

  console.log("✅ Unit 3 Verification Passed!");
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
