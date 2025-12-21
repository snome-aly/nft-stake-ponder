import { ethers, deployments, getNamedAccounts } from "hardhat";

async function main() {
  const { deployer } = await getNamedAccounts();

  console.log("🚀 Starting Bulk Proposal Generation...");
  console.log("📝 Operator:", deployer);

  // Get Contracts
  const governorDeploy = await deployments.get("MyGovernor");
  const governor = await ethers.getContractAt("MyGovernor", governorDeploy.address);

  const poolDeploy = await deployments.get("NFTStakingPool");
  const nftStakingPool = await ethers.getContractAt("NFTStakingPool", poolDeploy.address);
  const rewardTokenDeploy = await deployments.get("RewardToken");
  const rewardToken = await ethers.getContractAt("RewardToken", rewardTokenDeploy.address);

  // Check Deployment and Voting Power
  const votes = await rewardToken.getVotes(deployer);
  console.log(`🗳️ Current Voting Power: ${ethers.formatEther(votes)} RWRD`);

  const proposalThreshold = await governor.proposalThreshold();
  console.log(`⚖️ Proposal Threshold: ${ethers.formatEther(proposalThreshold)} RWRD`);

  if (votes <= proposalThreshold) {
    console.log("❌ Insufficient votes. Minting/Delegating...");
    // Mint and Delegate if needed (similar to deploy script)
    const mintAmount = ethers.parseEther("100000");
    await rewardToken.mint(deployer, mintAmount).then(tx => tx.wait());
    await rewardToken.delegate(deployer).then(tx => tx.wait());
    console.log("✅ Voting power boosted.");
  }

  // --- Generation Config ---
  const TOTAL_PROPOSALS = 100; // Let's do 100 first, 1000 might take too long to wait
  const BATCH_SIZE = 10;

  console.log(`\n🏭 Generating ${TOTAL_PROPOSALS} proposals in batches of ${BATCH_SIZE}...`);

  for (let i = 0; i < TOTAL_PROPOSALS; i += BATCH_SIZE) {
    const currentBatchSize = Math.min(BATCH_SIZE, TOTAL_PROPOSALS - i);

    console.log(`   Processing batch ${i / BATCH_SIZE + 1}... (${currentBatchSize} items)`);

    for (let j = 0; j < currentBatchSize; j++) {
      const proposalIndex = i + j + 1;
      const description = `# Load Test Proposal ${proposalIndex}\n\nThis is a **simulated proposal** generated for pagination testing.\n\n- Index: ${proposalIndex}\n- Timestamp: ${Date.now()}`;

      // Encode Function Call (e.g., setBaseReward)
      // We vary the reward value slightly so proposals are unique
      const newReward = BigInt(100 + proposalIndex);
      const calldata = nftStakingPool.interface.encodeFunctionData("setBaseReward", [newReward]);

      // Create Proposal Promise (Don't await yet)
      // Use a manual nonce management or just rely on hardhat's auto-management (might be flaky in parallel)
      // Ideally sequentially to avoid nonce errors, but let's try parallel for speed if local node supports it.
      // SAFEST: Sequential if nonce issues occur. Let's do sequential for safety first.

      /* Parallel attempt:
          batchPromises.push(
              governor.propose(
                  [poolDeploy.address],
                  [0],
                  [calldata],
                  description
              )
          );
          */

      // Sequential is safer for hardhat scripts often
      try {
        await governor.propose([poolDeploy.address], [0], [calldata], description);
        // We don't necessarily need to wait for full confirmation for every single one if autoMine is on
        // but tx.wait() keeps nonce in order.
        process.stdout.write(".");
      } catch (e) {
        console.log(`\n❌ Failed at ${proposalIndex}:`, e);
      }
    }
  }

  console.log("\n\n✅ Done! Generated proposals.");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
