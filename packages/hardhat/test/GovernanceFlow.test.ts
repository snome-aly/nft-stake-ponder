import { expect } from "chai";
import { ethers, deployments, network } from "hardhat";
import { MyGovernor, NFTStakingPool } from "../typechain-types";
// import { moveBlocks } from "../utils/move-blocks";
// import { moveTime } from "../utils/move-time";

describe("Unit 5: Governance Flow Smoke Test", function () {
  let governor: MyGovernor;
  let pool: NFTStakingPool;

  // Constants
  const NEW_REWARD_RATE = 500n;
  const VOTING_DELAY = 1; // Blocks defined in MyGovernor
  const VOTING_PERIOD = 50; // Blocks defined in MyGovernor

  // Helper to move blocks (we will implement inline or expect utils to handle it,
  // but for reliability in this specific test file, let's define helpers here if utils don't exist yet)
  async function mineBlocks(count: number) {
    for (let i = 0; i < count; i++) {
      await network.provider.send("evm_mine");
    }
  }

  beforeEach(async function () {
    await deployments.fixture(["Governance"]);
    await ethers.getSigners();

    const governorDep = await deployments.get("MyGovernor");
    const poolDep = await deployments.get("NFTStakingPool");

    governor = await ethers.getContractAt("MyGovernor", governorDep.address);
    pool = await ethers.getContractAt("NFTStakingPool", poolDep.address);

    // Setup: Fund voters and delegate
    // Deployer already has tokens and delegation from deploy script
    // Let's ensure deployer has enough power
  });

  it("Full Lifecycle: Propose -> Vote -> Queue -> Execute", async function () {
    // 1. Check Initial State
    const initialReward = await pool.baseRewardPerSecond();
    console.log(`1️⃣  Initial Reward Rate: ${initialReward}`);
    expect(initialReward).to.not.equal(NEW_REWARD_RATE);

    // 2. Propose
    // We want to call pool.setBaseReward(NEW_REWARD_RATE)
    const encodedFunctionCall = pool.interface.encodeFunctionData("setBaseReward", [NEW_REWARD_RATE]);
    const proposalDescription = "Proposal #1: Update Base Reward to 500";

    console.log("2️⃣  Creating Proposal...");
    const tx = await governor.propose([await pool.getAddress()], [0], [encodedFunctionCall], proposalDescription);
    const receipt = await tx.wait();

    // Get Proposal ID from events
    const log = receipt?.logs.find((l: any) => l.fragment && l.fragment.name === "ProposalCreated");
    const proposalId = (log as any)?.args?.[0];

    console.log(`   Proposal ID: ${proposalId}`);
    expect(proposalId).to.not.be.undefined;

    // 3. Wait for Voting Delay
    // State should be Pending (0)
    expect(await governor.state(proposalId)).to.equal(0);

    console.log("3️⃣  Mining blocks for Voting Delay...");
    await mineBlocks(VOTING_DELAY + 1);

    // State should be Active (1)
    expect(await governor.state(proposalId)).to.equal(1);

    // 4. Vote
    console.log("4️⃣  Casting Vote...");
    // 0 = Against, 1 = For, 2 = Abstain
    const voteTx = await governor.castVote(proposalId, 1);
    await voteTx.wait();

    // 5. Wait for Voting Period
    console.log("5️⃣  Mining blocks for Voting Period...");
    await mineBlocks(VOTING_PERIOD + 1);

    // State should be Succeeded (4)
    expect(await governor.state(proposalId)).to.equal(4);

    // 6. Queue
    console.log("6️⃣  Queuing Proposal...");
    const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(proposalDescription));
    const queueTx = await governor.queue([await pool.getAddress()], [0], [encodedFunctionCall], descriptionHash);
    await queueTx.wait();

    // State should be Queued (5)
    expect(await governor.state(proposalId)).to.equal(5);

    // 7. Execute
    // If Timelock delay > 0, we would need to move time.
    // In our Unit 4 deploy, minDelay is 0, so we can execute immediately.
    console.log("7️⃣  Executing Proposal...");
    const executeTx = await governor.execute([await pool.getAddress()], [0], [encodedFunctionCall], descriptionHash);
    await executeTx.wait();

    // State should be Executed (7)
    expect(await governor.state(proposalId)).to.equal(7);

    // 8. Verify Result
    const newReward = await pool.baseRewardPerSecond();
    console.log(`8️⃣  New Reward Rate: ${newReward}`);
    expect(newReward).to.equal(NEW_REWARD_RATE);

    console.log("✅ Smoke Test Passed!");
  });
});
