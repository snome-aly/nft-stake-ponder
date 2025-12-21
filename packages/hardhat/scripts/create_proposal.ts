import { ethers, deployments } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Creating proposal with account:", deployer.address);

  // Get deployed contracts
  const governorDep = await deployments.get("MyGovernor");
  const poolDep = await deployments.get("NFTStakingPool");

  const governor = await ethers.getContractAt("MyGovernor", governorDep.address);
  const pool = await ethers.getContractAt("NFTStakingPool", poolDep.address);

  // Proposal Details
  const NEW_REWARD_RATE = 501n;
  const proposalDescription = "Proposal #3: Update Base Reward to 501";

  // Encode Function Call
  // setBaseReward(uint256)
  const encodedFunctionCall = pool.interface.encodeFunctionData("setBaseReward", [NEW_REWARD_RATE]);

  console.log(`Proposing to set baseReward to ${NEW_REWARD_RATE}...`);
  console.log(`Target: ${await pool.getAddress()}`);
  console.log(`Calldata: ${encodedFunctionCall}`);

  // Create Proposal
  const tx = await governor.propose([await pool.getAddress()], [0], [encodedFunctionCall], proposalDescription);

  console.log("Transaction sent:", tx.hash);
  const receipt = await tx.wait();

  // Find ProposalCreated event
  const log = receipt?.logs.find((l: any) => l.fragment && l.fragment.name === "ProposalCreated");
  // @ts-expect-error: args is potentially undefined in the type definition but present in runtime
  const proposalId = log?.args?.[0];

  console.log("✅ Proposal Created!");
  console.log("Proposal ID:", proposalId.toString());
  console.log("Description:", proposalDescription);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
