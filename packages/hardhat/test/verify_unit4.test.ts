import { expect } from "chai";
import { ethers, deployments } from "hardhat";
import { MyGovernor, Timelock, NFTStakingPool, RewardToken } from "../typechain-types";

describe("Unit 4 Verification: Wiring & Permissions", function () {
  let governor: MyGovernor;
  let timelock: Timelock;
  let pool: NFTStakingPool;
  let token: RewardToken;
  let deployer: any;

  beforeEach(async function () {
    // 1. Run Deploy Scripts
    await deployments.fixture(["Governance"]);

    // 2. Get Accounts
    [deployer] = await ethers.getSigners();

    // 3. Get Contracts
    const governorDep = await deployments.get("MyGovernor");
    const timelockDep = await deployments.get("Timelock");
    const poolDep = await deployments.get("NFTStakingPool");
    const tokenDep = await deployments.get("RewardToken");

    governor = await ethers.getContractAt("MyGovernor", governorDep.address);
    timelock = await ethers.getContractAt("Timelock", timelockDep.address);
    pool = await ethers.getContractAt("NFTStakingPool", poolDep.address);
    token = await ethers.getContractAt("RewardToken", tokenDep.address);
  });

  it("Should have transferred Pool ownership to Timelock", async function () {
    expect(await pool.owner()).to.equal(await timelock.getAddress());
  });

  it("Should have granted PROPOSER_ROLE to Governor", async function () {
    const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
    expect(await timelock.hasRole(PROPOSER_ROLE, await governor.getAddress())).to.be.true;
  });

  it("Should have granted EXECUTOR_ROLE to Zero Address (Everyone)", async function () {
    const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();
    const zeroAddress = "0x0000000000000000000000000000000000000000";
    expect(await timelock.hasRole(EXECUTOR_ROLE, zeroAddress)).to.be.true;
  });

  it("Should have bootstrapped voting power for Deployer", async function () {
    const votes = await token.getVotes(deployer.address);
    console.log(`\tDeployer Votes: ${ethers.formatEther(votes)}`);
    expect(votes).to.be.gt(0);
  });

  it("Should preventing Deployer from calling setBaseReward directly", async function () {
    // Owner is Timelock, so Deployer (even if they were original owner) should be rejected
    await expect(pool.connect(deployer).setBaseReward(999))
      .to.be.revertedWithCustomError(pool, "OwnableUnauthorizedAccount")
      .withArgs(deployer.address);
  });
});
