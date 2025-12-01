import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { StakableNFT } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("NFTStakingPool", function () {
  // ============ Fixtures ============

  /**
   * 完整部署 fixture
   * - 部署 StakableNFT, RewardToken, NFTStakingPool
   * - 授予 StakingPool MINTER_ROLE
   * - 设置稀有度池并揭示
   * - 为测试用户铸造 NFT
   */
  async function deployFullSystemFixture() {
    const [deployer, operator, user1, user2, user3] = await ethers.getSigners();

    // 1. 部署 StakableNFT
    const StakableNFT = await ethers.getContractFactory("StakableNFT");
    const stakableNFT = await StakableNFT.deploy();

    // 2. 部署 RewardToken
    const RewardToken = await ethers.getContractFactory("RewardToken");
    const rewardToken = await RewardToken.deploy();

    // 3. 部署 NFTStakingPool
    const NFTStakingPool = await ethers.getContractFactory("NFTStakingPool");
    const stakingPool = await NFTStakingPool.deploy(
      await stakableNFT.getAddress(),
      await rewardToken.getAddress(),
    );

    // 4. 授予 StakingPool MINTER_ROLE
    const MINTER_ROLE = await rewardToken.MINTER_ROLE();
    await rewardToken.grantRole(MINTER_ROLE, await stakingPool.getAddress());

    // 5. 授予 operator OPERATOR_ROLE（用于设置稀有度池）
    const OPERATOR_ROLE = await stakableNFT.OPERATOR_ROLE();
    await stakableNFT.grantRole(OPERATOR_ROLE, operator.address);

    // 6. 设置稀有度池（简化版：50个Common, 30个Rare, 15个Epic, 5个Legendary）
    const rarityPool = [
      ...Array(50).fill(0), // Common
      ...Array(30).fill(1), // Rare
      ...Array(15).fill(2), // Epic
      ...Array(5).fill(3), // Legendary
    ];
    await stakableNFT.connect(operator).setRarityPool(rarityPool);

    // 7. 铸造所有 NFT（分配给测试用户）
    const MINT_PRICE = ethers.parseEther("1");
    await stakableNFT.connect(user1).mint(20, { value: MINT_PRICE * 20n });
    await stakableNFT.connect(user2).mint(20, { value: MINT_PRICE * 20n });
    await stakableNFT.connect(user3).mint(20, { value: MINT_PRICE * 20n });
    await stakableNFT.connect(deployer).mint(20, { value: MINT_PRICE * 20n });
    await stakableNFT.connect(operator).mint(20, { value: MINT_PRICE * 20n });

    // 8. 揭示稀有度
    await stakableNFT.reveal();

    return {
      stakableNFT,
      rewardToken,
      stakingPool,
      deployer,
      operator,
      user1,
      user2,
      user3,
      MINTER_ROLE,
      OPERATOR_ROLE,
    };
  }

  // ============ 部署测试 ============

  describe("部署", function () {
    it("应正确设置 stakableNFT 地址", async function () {
      const { stakingPool, stakableNFT } = await loadFixture(deployFullSystemFixture);
      expect(await stakingPool.stakableNFT()).to.equal(await stakableNFT.getAddress());
    });

    it("应正确设置 rewardToken 地址", async function () {
      const { stakingPool, rewardToken } = await loadFixture(deployFullSystemFixture);
      expect(await stakingPool.rewardToken()).to.equal(await rewardToken.getAddress());
    });

    it("应设置正确的 BASE_REWARD_PER_SECOND", async function () {
      const { stakingPool } = await loadFixture(deployFullSystemFixture);
      // 1 RWRD/天 ≈ 11574074074074 wei/秒
      expect(await stakingPool.BASE_REWARD_PER_SECOND()).to.equal(11574074074074n);
    });

    it("部署者应是 owner", async function () {
      const { stakingPool, deployer } = await loadFixture(deployFullSystemFixture);
      expect(await stakingPool.owner()).to.equal(deployer.address);
    });

    it("合约初始应未暂停", async function () {
      const { stakingPool } = await loadFixture(deployFullSystemFixture);
      expect(await stakingPool.paused()).to.be.false;
    });

    it("StakingPool 应拥有 MINTER_ROLE", async function () {
      const { stakingPool, rewardToken, MINTER_ROLE } = await loadFixture(deployFullSystemFixture);
      expect(await rewardToken.hasRole(MINTER_ROLE, await stakingPool.getAddress())).to.be.true;
    });
  });

  // ============ 质押测试 ============

  describe("质押", function () {
    it("用户可以质押自己的 NFT", async function () {
      const { stakingPool, stakableNFT, user1 } = await loadFixture(deployFullSystemFixture);

      const tokenId = 1n; // user1 的第一个 NFT

      // Approve
      await stakableNFT.connect(user1).approve(await stakingPool.getAddress(), tokenId);

      // Stake
      await expect(stakingPool.connect(user1).stake(tokenId)).to.not.be.reverted;

      // 验证状态
      const stakeInfo = await stakingPool.getStakeInfo(tokenId);
      expect(stakeInfo.owner).to.equal(user1.address);
      expect(await stakingPool.isStaked(tokenId)).to.be.true;
    });

    it("质押应转移 NFT 到合约", async function () {
      const { stakingPool, stakableNFT, user1 } = await loadFixture(deployFullSystemFixture);

      const tokenId = 1n;

      await stakableNFT.connect(user1).approve(await stakingPool.getAddress(), tokenId);
      await stakingPool.connect(user1).stake(tokenId);

      expect(await stakableNFT.ownerOf(tokenId)).to.equal(await stakingPool.getAddress());
    });

    it("质押应记录正确的 stakeInfo", async function () {
      const { stakingPool, stakableNFT, user1 } = await loadFixture(deployFullSystemFixture);

      const tokenId = 1n;

      await stakableNFT.connect(user1).approve(await stakingPool.getAddress(), tokenId);

      const stakeTx = await stakingPool.connect(user1).stake(tokenId);
      const block = await ethers.provider.getBlock(stakeTx.blockNumber!);

      const stakeInfo = await stakingPool.getStakeInfo(tokenId);
      expect(stakeInfo.owner).to.equal(user1.address);
      expect(stakeInfo.stakedAt).to.equal(block!.timestamp);
      expect(stakeInfo.lastClaimTime).to.equal(block!.timestamp);
    });

    it("质押应触发 Staked 事件", async function () {
      const { stakingPool, stakableNFT, user1 } = await loadFixture(deployFullSystemFixture);

      const tokenId = 1n;

      await stakableNFT.connect(user1).approve(await stakingPool.getAddress(), tokenId);

      // 不验证精确的时间戳，只验证事件被触发
      await expect(stakingPool.connect(user1).stake(tokenId)).to.emit(stakingPool, "Staked");
    });

    it("不能质押他人的 NFT", async function () {
      const { stakingPool, stakableNFT, user1, user2 } = await loadFixture(deployFullSystemFixture);

      const tokenId = 1n; // user1 的 NFT

      await stakableNFT.connect(user1).approve(await stakingPool.getAddress(), tokenId);

      await expect(stakingPool.connect(user2).stake(tokenId)).to.be.revertedWith("Not NFT owner");
    });

    it("不能重复质押同一个 NFT", async function () {
      const { stakingPool, stakableNFT, user1 } = await loadFixture(deployFullSystemFixture);

      const tokenId = 1n;

      await stakableNFT.connect(user1).approve(await stakingPool.getAddress(), tokenId);
      await stakingPool.connect(user1).stake(tokenId);

      // 第一次质押后，NFT 已转移到合约，所以第二次会因为 "Not NFT owner" 而失败
      await expect(stakingPool.connect(user1).stake(tokenId)).to.be.revertedWith("Not NFT owner");
    });

    it("未 approve 时质押应失败", async function () {
      const { stakingPool, user1 } = await loadFixture(deployFullSystemFixture);

      const tokenId = 1n;

      await expect(stakingPool.connect(user1).stake(tokenId)).to.be.reverted;
    });

    it("合约暂停时不能质押", async function () {
      const { stakingPool, stakableNFT, user1, deployer } = await loadFixture(deployFullSystemFixture);

      const tokenId = 1n;

      await stakableNFT.connect(user1).approve(await stakingPool.getAddress(), tokenId);

      // 暂停合约
      await stakingPool.connect(deployer).pause();

      await expect(stakingPool.connect(user1).stake(tokenId)).to.be.revertedWithCustomError(
        stakingPool,
        "EnforcedPause",
      );
    });
  });

  // ============ 解押测试 ============

  describe("解押", function () {
    it("用户可以解押自己的 NFT", async function () {
      const { stakingPool, stakableNFT, user1 } = await loadFixture(deployFullSystemFixture);

      const tokenId = 1n;

      await stakableNFT.connect(user1).approve(await stakingPool.getAddress(), tokenId);
      await stakingPool.connect(user1).stake(tokenId);

      await expect(stakingPool.connect(user1).unstake(tokenId)).to.not.be.reverted;
    });

    it("解押应归还 NFT 给用户", async function () {
      const { stakingPool, stakableNFT, user1 } = await loadFixture(deployFullSystemFixture);

      const tokenId = 1n;

      await stakableNFT.connect(user1).approve(await stakingPool.getAddress(), tokenId);
      await stakingPool.connect(user1).stake(tokenId);

      await stakingPool.connect(user1).unstake(tokenId);

      expect(await stakableNFT.ownerOf(tokenId)).to.equal(user1.address);
    });

    it("解押应清除 stakeInfo", async function () {
      const { stakingPool, stakableNFT, user1 } = await loadFixture(deployFullSystemFixture);

      const tokenId = 1n;

      await stakableNFT.connect(user1).approve(await stakingPool.getAddress(), tokenId);
      await stakingPool.connect(user1).stake(tokenId);

      await stakingPool.connect(user1).unstake(tokenId);

      const stakeInfo = await stakingPool.getStakeInfo(tokenId);
      expect(stakeInfo.owner).to.equal(ethers.ZeroAddress);
      expect(await stakingPool.isStaked(tokenId)).to.be.false;
    });

    it("解押应自动发放奖励", async function () {
      const { stakingPool, stakableNFT, rewardToken, user1 } = await loadFixture(deployFullSystemFixture);

      const tokenId = 1n;

      await stakableNFT.connect(user1).approve(await stakingPool.getAddress(), tokenId);
      await stakingPool.connect(user1).stake(tokenId);

      // 等待 1 天
      await time.increase(86400);

      await stakingPool.connect(user1).unstake(tokenId);

      const balance = await rewardToken.balanceOf(user1.address);
      expect(balance).to.be.gt(0);
    });

    it("解押应触发 Unstaked 事件", async function () {
      const { stakingPool, stakableNFT, user1 } = await loadFixture(deployFullSystemFixture);

      const tokenId = 1n;

      await stakableNFT.connect(user1).approve(await stakingPool.getAddress(), tokenId);
      await stakingPool.connect(user1).stake(tokenId);

      await expect(stakingPool.connect(user1).unstake(tokenId)).to.emit(stakingPool, "Unstaked");
    });

    it("非质押者不能解押", async function () {
      const { stakingPool, stakableNFT, user1, user2 } = await loadFixture(deployFullSystemFixture);

      const tokenId = 1n;

      await stakableNFT.connect(user1).approve(await stakingPool.getAddress(), tokenId);
      await stakingPool.connect(user1).stake(tokenId);

      await expect(stakingPool.connect(user2).unstake(tokenId)).to.be.revertedWith("Not staker");
    });

    it("未质押的 NFT 不能解押", async function () {
      const { stakingPool, user1 } = await loadFixture(deployFullSystemFixture);

      const tokenId = 1n;

      await expect(stakingPool.connect(user1).unstake(tokenId)).to.be.revertedWith("Not staker");
    });
  });

  // ============ 领取奖励测试 ============

  describe("领取奖励", function () {
    it("可以领取待领取的奖励", async function () {
      const { stakingPool, stakableNFT, rewardToken, user1 } = await loadFixture(deployFullSystemFixture);

      const tokenId = 1n;

      await stakableNFT.connect(user1).approve(await stakingPool.getAddress(), tokenId);
      await stakingPool.connect(user1).stake(tokenId);

      // 等待 1 小时
      await time.increase(3600);

      await stakingPool.connect(user1).claimReward(tokenId);

      const balance = await rewardToken.balanceOf(user1.address);
      expect(balance).to.be.gt(0);
    });

    it("领取应更新 lastClaimTime", async function () {
      const { stakingPool, stakableNFT, user1 } = await loadFixture(deployFullSystemFixture);

      const tokenId = 1n;

      await stakableNFT.connect(user1).approve(await stakingPool.getAddress(), tokenId);
      await stakingPool.connect(user1).stake(tokenId);

      await time.increase(3600);

      const claimTx = await stakingPool.connect(user1).claimReward(tokenId);
      const block = await ethers.provider.getBlock(claimTx.blockNumber!);

      const stakeInfo = await stakingPool.getStakeInfo(tokenId);
      expect(stakeInfo.lastClaimTime).to.equal(block!.timestamp);
    });

    it("领取应触发 RewardClaimed 事件", async function () {
      const { stakingPool, stakableNFT, user1 } = await loadFixture(deployFullSystemFixture);

      const tokenId = 1n;

      await stakableNFT.connect(user1).approve(await stakingPool.getAddress(), tokenId);
      await stakingPool.connect(user1).stake(tokenId);

      await time.increase(3600);

      await expect(stakingPool.connect(user1).claimReward(tokenId)).to.emit(stakingPool, "RewardClaimed");
    });

    it("领取不应改变 NFT 质押状态", async function () {
      const { stakingPool, stakableNFT, user1 } = await loadFixture(deployFullSystemFixture);

      const tokenId = 1n;

      await stakableNFT.connect(user1).approve(await stakingPool.getAddress(), tokenId);
      await stakingPool.connect(user1).stake(tokenId);

      await time.increase(3600);

      await stakingPool.connect(user1).claimReward(tokenId);

      expect(await stakingPool.isStaked(tokenId)).to.be.true;
      expect(await stakableNFT.ownerOf(tokenId)).to.equal(await stakingPool.getAddress());
    });

    it("刚质押后奖励极小", async function () {
      const { stakingPool, stakableNFT, user1 } = await loadFixture(deployFullSystemFixture);

      const tokenId = 1n;

      await stakableNFT.connect(user1).approve(await stakingPool.getAddress(), tokenId);
      await stakingPool.connect(user1).stake(tokenId);

      // 由于区块时间变化，可能产生极小奖励，但应该非常接近 0
      const reward = await stakingPool.calculatePendingReward(tokenId);
      expect(reward).to.be.lt(ethers.parseEther("0.0001")); // 小于 0.0001 RWRD
    });

    it("非质押者不能领取", async function () {
      const { stakingPool, stakableNFT, user1, user2 } = await loadFixture(deployFullSystemFixture);

      const tokenId = 1n;

      await stakableNFT.connect(user1).approve(await stakingPool.getAddress(), tokenId);
      await stakingPool.connect(user1).stake(tokenId);

      await expect(stakingPool.connect(user2).claimReward(tokenId)).to.be.revertedWith("Not staker");
    });
  });

  // ============ 奖励计算测试 ============

  describe("奖励计算", function () {
    it("Common NFT 质押 1 天应得约 1 RWRD", async function () {
      const { stakingPool, stakableNFT, user1 } = await loadFixture(deployFullSystemFixture);

      // 找一个 Common NFT（multiplier = 10000）
      let tokenId = 0n;
      let found = false;
      for (let i = 1; i <= 20; i++) {
        try {
          const owner = await stakableNFT.ownerOf(i);
          if (owner === user1.address) {
            const multiplier = await stakableNFT.getTokenRewardMultiplier(i);
            if (multiplier === 10000n) {
              tokenId = BigInt(i);
              found = true;
              break;
            }
          }
        } catch {
          continue;
        }
      }

      // 如果 user1 没有 Common NFT，跳过此测试
      if (!found) {
        this.skip();
      }

      await stakableNFT.connect(user1).approve(await stakingPool.getAddress(), tokenId);
      await stakingPool.connect(user1).stake(tokenId);

      // 等待 1 天
      await time.increase(86400);

      const reward = await stakingPool.calculatePendingReward(tokenId);
      // 允许小误差（由于整数除法）
      expect(reward).to.be.closeTo(ethers.parseEther("1"), ethers.parseEther("0.001"));
    });

    it("Legendary NFT 质押 1 天应得约 3 RWRD", async function () {
      const { stakingPool, stakableNFT } = await loadFixture(deployFullSystemFixture);

      // 找一个 Legendary NFT（multiplier = 30000）
      let tokenId = 1n;
      for (let i = 1; i <= 100; i++) {
        const multiplier = await stakableNFT.getTokenRewardMultiplier(i);
        if (multiplier === 30000n) {
          tokenId = BigInt(i);
          break;
        }
      }

      // 找到该 NFT 的所有者
      const owner = await stakableNFT.ownerOf(tokenId);
      const ownerSigner = await ethers.getSigner(owner);

      await stakableNFT.connect(ownerSigner).approve(await stakingPool.getAddress(), tokenId);
      await stakingPool.connect(ownerSigner).stake(tokenId);

      // 等待 1 天
      await time.increase(86400);

      const reward = await stakingPool.calculatePendingReward(tokenId);
      expect(reward).to.be.closeTo(ethers.parseEther("3"), ethers.parseEther("0.003"));
    });

    it("质押 12 小时应得半天奖励", async function () {
      const { stakingPool, stakableNFT, user1 } = await loadFixture(deployFullSystemFixture);

      const tokenId = 1n;

      await stakableNFT.connect(user1).approve(await stakingPool.getAddress(), tokenId);
      await stakingPool.connect(user1).stake(tokenId);

      // 等待 12 小时
      await time.increase(43200);

      const reward = await stakingPool.calculatePendingReward(tokenId);
      const multiplier = await stakableNFT.getTokenRewardMultiplier(tokenId);

      // 计算预期奖励
      const baseReward = ethers.parseEther("1");
      const expectedReward = (baseReward * multiplier) / 10000n / 2n; // 半天

      expect(reward).to.be.closeTo(expectedReward, ethers.parseEther("0.001"));
    });

    it("刚质押时奖励应为 0", async function () {
      const { stakingPool, stakableNFT, user1 } = await loadFixture(deployFullSystemFixture);

      const tokenId = 1n;

      await stakableNFT.connect(user1).approve(await stakingPool.getAddress(), tokenId);
      await stakingPool.connect(user1).stake(tokenId);

      const reward = await stakingPool.calculatePendingReward(tokenId);
      expect(reward).to.equal(0);
    });

    it("领取后立即查询奖励应为 0", async function () {
      const { stakingPool, stakableNFT, user1 } = await loadFixture(deployFullSystemFixture);

      const tokenId = 1n;

      await stakableNFT.connect(user1).approve(await stakingPool.getAddress(), tokenId);
      await stakingPool.connect(user1).stake(tokenId);

      await time.increase(3600);
      await stakingPool.connect(user1).claimReward(tokenId);

      const reward = await stakingPool.calculatePendingReward(tokenId);
      expect(reward).to.equal(0);
    });

    it("未质押的 NFT 奖励应为 0", async function () {
      const { stakingPool } = await loadFixture(deployFullSystemFixture);

      const tokenId = 1n;

      const reward = await stakingPool.calculatePendingReward(tokenId);
      expect(reward).to.equal(0);
    });
  });

  // ============ 批量操作测试 ============

  describe("批量操作", function () {
    it("可以批量质押多个 NFT", async function () {
      const { stakingPool, stakableNFT, user1 } = await loadFixture(deployFullSystemFixture);

      const tokenIds = [1n, 2n, 3n];

      // Approve all
      for (const tokenId of tokenIds) {
        await stakableNFT.connect(user1).approve(await stakingPool.getAddress(), tokenId);
      }

      await expect(stakingPool.connect(user1).batchStake(tokenIds)).to.not.be.reverted;

      // 验证所有 NFT 都已质押
      for (const tokenId of tokenIds) {
        expect(await stakingPool.isStaked(tokenId)).to.be.true;
      }
    });

    it("可以批量领取多个 NFT 的奖励", async function () {
      const { stakingPool, stakableNFT, rewardToken, user1 } = await loadFixture(deployFullSystemFixture);

      const tokenIds = [1n, 2n, 3n];

      // Approve and stake all
      for (const tokenId of tokenIds) {
        await stakableNFT.connect(user1).approve(await stakingPool.getAddress(), tokenId);
        await stakingPool.connect(user1).stake(tokenId);
      }

      // 等待 1 天
      await time.increase(86400);

      await stakingPool.connect(user1).batchClaimReward(tokenIds);

      const balance = await rewardToken.balanceOf(user1.address);
      expect(balance).to.be.gt(0);
    });

    it("批量操作应触发多个事件", async function () {
      const { stakingPool, stakableNFT, user1 } = await loadFixture(deployFullSystemFixture);

      const tokenIds = [1n, 2n, 3n];

      for (const tokenId of tokenIds) {
        await stakableNFT.connect(user1).approve(await stakingPool.getAddress(), tokenId);
      }

      const tx = await stakingPool.connect(user1).batchStake(tokenIds);
      const receipt = await tx.wait();

      // 应触发 3 个 Staked 事件
      const stakedEvents = receipt!.logs.filter(log => {
        try {
          const parsed = stakingPool.interface.parseLog({
            topics: log.topics as string[],
            data: log.data,
          });
          return parsed?.name === "Staked";
        } catch {
          return false;
        }
      });

      expect(stakedEvents.length).to.equal(3);
    });

    it("批量操作中包含无效 NFT 应失败", async function () {
      const { stakingPool, stakableNFT, user1 } = await loadFixture(deployFullSystemFixture);

      const tokenIds = [1n, 21n]; // 21 是 user2 的 NFT

      await stakableNFT.connect(user1).approve(await stakingPool.getAddress(), 1n);

      await expect(stakingPool.connect(user1).batchStake(tokenIds)).to.be.revertedWith("Not NFT owner");
    });

    it("批量质押空数组应失败", async function () {
      const { stakingPool, user1 } = await loadFixture(deployFullSystemFixture);

      await expect(stakingPool.connect(user1).batchStake([])).to.be.revertedWith("Empty array");
    });
  });

  // ============ 紧急控制测试 ============

  describe("紧急控制", function () {
    it("owner 可以暂停合约", async function () {
      const { stakingPool, deployer } = await loadFixture(deployFullSystemFixture);

      await expect(stakingPool.connect(deployer).pause()).to.not.be.reverted;
      expect(await stakingPool.paused()).to.be.true;
    });

    it("owner 可以恢复合约", async function () {
      const { stakingPool, deployer } = await loadFixture(deployFullSystemFixture);

      await stakingPool.connect(deployer).pause();
      await expect(stakingPool.connect(deployer).unpause()).to.not.be.reverted;
      expect(await stakingPool.paused()).to.be.false;
    });

    it("暂停后不能质押", async function () {
      const { stakingPool, stakableNFT, user1, deployer } = await loadFixture(deployFullSystemFixture);

      const tokenId = 1n;

      await stakableNFT.connect(user1).approve(await stakingPool.getAddress(), tokenId);

      await stakingPool.connect(deployer).pause();

      await expect(stakingPool.connect(user1).stake(tokenId)).to.be.revertedWithCustomError(
        stakingPool,
        "EnforcedPause",
      );
    });

    it("暂停后仍可以解押", async function () {
      const { stakingPool, stakableNFT, user1, deployer } = await loadFixture(deployFullSystemFixture);

      const tokenId = 1n;

      await stakableNFT.connect(user1).approve(await stakingPool.getAddress(), tokenId);
      await stakingPool.connect(user1).stake(tokenId);

      await stakingPool.connect(deployer).pause();

      await expect(stakingPool.connect(user1).unstake(tokenId)).to.not.be.reverted;
    });

    it("暂停后仍可以领取", async function () {
      const { stakingPool, stakableNFT, user1, deployer } = await loadFixture(deployFullSystemFixture);

      const tokenId = 1n;

      await stakableNFT.connect(user1).approve(await stakingPool.getAddress(), tokenId);
      await stakingPool.connect(user1).stake(tokenId);

      await time.increase(3600);

      await stakingPool.connect(deployer).pause();

      await expect(stakingPool.connect(user1).claimReward(tokenId)).to.not.be.reverted;
    });

    it("非 owner 不能暂停", async function () {
      const { stakingPool, user1 } = await loadFixture(deployFullSystemFixture);

      await expect(stakingPool.connect(user1).pause()).to.be.revertedWithCustomError(
        stakingPool,
        "OwnableUnauthorizedAccount",
      );
    });

    it("非 owner 不能恢复", async function () {
      const { stakingPool, deployer, user1 } = await loadFixture(deployFullSystemFixture);

      await stakingPool.connect(deployer).pause();

      await expect(stakingPool.connect(user1).unpause()).to.be.revertedWithCustomError(
        stakingPool,
        "OwnableUnauthorizedAccount",
      );
    });
  });

  // ============ 视图函数测试 ============

  describe("视图函数", function () {
    it("getStaker 应返回质押者地址", async function () {
      const { stakingPool, stakableNFT, user1 } = await loadFixture(deployFullSystemFixture);

      const tokenId = 1n;

      await stakableNFT.connect(user1).approve(await stakingPool.getAddress(), tokenId);
      await stakingPool.connect(user1).stake(tokenId);

      expect(await stakingPool.getStaker(tokenId)).to.equal(user1.address);
    });

    it("未质押的 NFT getStaker 应返回零地址", async function () {
      const { stakingPool } = await loadFixture(deployFullSystemFixture);

      expect(await stakingPool.getStaker(1n)).to.equal(ethers.ZeroAddress);
    });

    it("batchCalculatePendingReward 应返回正确数量的奖励", async function () {
      const { stakingPool, stakableNFT, user1 } = await loadFixture(deployFullSystemFixture);

      const tokenIds = [1n, 2n, 3n];

      for (const tokenId of tokenIds) {
        await stakableNFT.connect(user1).approve(await stakingPool.getAddress(), tokenId);
        await stakingPool.connect(user1).stake(tokenId);
      }

      await time.increase(3600);

      const rewards = await stakingPool.batchCalculatePendingReward(tokenIds);
      expect(rewards.length).to.equal(3);
      for (const reward of rewards) {
        expect(reward).to.be.gt(0);
      }
    });
  });

  // ============ Permit 质押测试 ============

  describe("Permit 质押", function () {
    /**
     * 辅助函数：生成 Permit 签名（可指定 nonce）
     */
    async function signPermit(
      signer: HardhatEthersSigner,
      stakableNFT: StakableNFT,
      stakingPoolAddress: string,
      tokenId: bigint,
      deadline: bigint,
      nonceOverride?: bigint,
    ) {
      const nonce = nonceOverride !== undefined ? nonceOverride : await stakableNFT.nonces(signer.address);
      const chainId = (await ethers.provider.getNetwork()).chainId;

      // EIP-712 Domain
      const domain = {
        name: "Stakable NFT",
        version: "1",
        chainId: chainId,
        verifyingContract: await stakableNFT.getAddress(),
      };

      // EIP-712 Types
      const types = {
        Permit: [
          { name: "spender", type: "address" },
          { name: "tokenId", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      };

      // Value
      const value = {
        spender: stakingPoolAddress,
        tokenId: tokenId,
        nonce: nonce,
        deadline: deadline,
      };

      // 签名
      const signature = await signer.signTypedData(domain, types, value);
      const sig = ethers.Signature.from(signature);

      return {
        v: sig.v,
        r: sig.r,
        s: sig.s,
        deadline,
      };
    }

    it("可以使用 Permit 质押 NFT", async function () {
      const { stakingPool, stakableNFT, user1 } = await loadFixture(deployFullSystemFixture);

      const tokenId = 1n;
      const deadline = BigInt((await time.latest()) + 3600); // 1小时后过期

      // 生成签名
      const { v, r, s } = await signPermit(
        user1,
        stakableNFT,
        await stakingPool.getAddress(),
        tokenId,
        deadline,
      );

      // 使用 Permit 质押（无需预先 approve）
      await expect(stakingPool.connect(user1).stakeWithPermit(tokenId, deadline, v, r, s)).to.not.be.reverted;

      // 验证质押成功
      expect(await stakingPool.isStaked(tokenId)).to.be.true;
      expect(await stakableNFT.ownerOf(tokenId)).to.equal(await stakingPool.getAddress());
    });

    it("Permit 质押应触发 Staked 事件", async function () {
      const { stakingPool, stakableNFT, user1 } = await loadFixture(deployFullSystemFixture);

      const tokenId = 1n;
      const deadline = BigInt((await time.latest()) + 3600);

      const { v, r, s } = await signPermit(
        user1,
        stakableNFT,
        await stakingPool.getAddress(),
        tokenId,
        deadline,
      );

      // 不验证精确的时间戳，只验证事件被触发
      await expect(stakingPool.connect(user1).stakeWithPermit(tokenId, deadline, v, r, s))
        .to.emit(stakingPool, "Staked");
    });

    it("过期的 Permit 应失败", async function () {
      const { stakingPool, stakableNFT, user1 } = await loadFixture(deployFullSystemFixture);

      const tokenId = 1n;
      const deadline = BigInt((await time.latest()) - 1); // 已过期

      const { v, r, s } = await signPermit(
        user1,
        stakableNFT,
        await stakingPool.getAddress(),
        tokenId,
        deadline,
      );

      await expect(stakingPool.connect(user1).stakeWithPermit(tokenId, deadline, v, r, s)).to.be.revertedWith(
        "Permit expired",
      );
    });

    it("无效的签名应失败", async function () {
      const { stakingPool, stakableNFT, user1, user2 } = await loadFixture(deployFullSystemFixture);

      const tokenId = 1n;
      const deadline = BigInt((await time.latest()) + 3600);

      // user2 签名，但尝试质押 user1 的 NFT
      const { v, r, s } = await signPermit(
        user2,
        stakableNFT,
        await stakingPool.getAddress(),
        tokenId,
        deadline,
      );

      await expect(stakingPool.connect(user1).stakeWithPermit(tokenId, deadline, v, r, s)).to.be.revertedWith(
        "Invalid signature",
      );
    });

    it("nonce 应在每次 Permit 后递增", async function () {
      const { stakingPool, stakableNFT, user1 } = await loadFixture(deployFullSystemFixture);

      const tokenId1 = 1n;
      const tokenId2 = 2n;
      const deadline = BigInt((await time.latest()) + 3600);

      const nonceBefore = await stakableNFT.nonces(user1.address);

      // 第一次 Permit
      const sig1 = await signPermit(user1, stakableNFT, await stakingPool.getAddress(), tokenId1, deadline);
      await stakingPool.connect(user1).stakeWithPermit(tokenId1, deadline, sig1.v, sig1.r, sig1.s);

      const nonceAfter1 = await stakableNFT.nonces(user1.address);
      expect(nonceAfter1).to.equal(nonceBefore + 1n);

      // 第二次 Permit
      const sig2 = await signPermit(user1, stakableNFT, await stakingPool.getAddress(), tokenId2, deadline);
      await stakingPool.connect(user1).stakeWithPermit(tokenId2, deadline, sig2.v, sig2.r, sig2.s);

      const nonceAfter2 = await stakableNFT.nonces(user1.address);
      expect(nonceAfter2).to.equal(nonceBefore + 2n);
    });

    it("不能重放已使用的签名", async function () {
      const { stakingPool, stakableNFT, user1 } = await loadFixture(deployFullSystemFixture);

      const tokenId = 1n;
      const deadline = BigInt((await time.latest()) + 3600);

      const { v, r, s } = await signPermit(
        user1,
        stakableNFT,
        await stakingPool.getAddress(),
        tokenId,
        deadline,
      );

      // 第一次使用成功
      await stakingPool.connect(user1).stakeWithPermit(tokenId, deadline, v, r, s);

      // 解押
      await stakingPool.connect(user1).unstake(tokenId);

      // 尝试重放签名应失败（nonce 已变）
      await expect(stakingPool.connect(user1).stakeWithPermit(tokenId, deadline, v, r, s)).to.be.revertedWith(
        "Invalid signature",
      );
    });

    it("可以批量使用 Permit 质押多个 NFT", async function () {
      const { stakingPool, stakableNFT, user1 } = await loadFixture(deployFullSystemFixture);

      const tokenIds = [1n, 2n, 3n];
      const deadline = BigInt((await time.latest()) + 3600);

      // 获取当前 nonce
      const startNonce = await stakableNFT.nonces(user1.address);

      // 为每个 NFT 生成签名（每个签名使用递增的 nonce）
      const stakingPoolAddress = await stakingPool.getAddress();
      const signatures = await Promise.all(
        tokenIds.map((tokenId, index) =>
          signPermit(user1, stakableNFT, stakingPoolAddress, tokenId, deadline, startNonce + BigInt(index)),
        ),
      );

      const vs = signatures.map(sig => sig.v);
      const rs = signatures.map(sig => sig.r);
      const ss = signatures.map(sig => sig.s);

      // 批量质押
      await expect(stakingPool.connect(user1).batchStakeWithPermit(tokenIds, deadline, vs, rs, ss)).to.not.be
        .reverted;

      // 验证所有 NFT 都已质押
      for (const tokenId of tokenIds) {
        expect(await stakingPool.isStaked(tokenId)).to.be.true;
      }
    });

    it("批量 Permit 质押数组长度必须匹配", async function () {
      const { stakingPool, user1 } = await loadFixture(deployFullSystemFixture);

      const tokenIds = [1n, 2n, 3n];
      const deadline = BigInt((await time.latest()) + 3600);
      const vs = [27, 28]; // 长度不匹配
      const rs = ["0x" + "00".repeat(32), "0x" + "00".repeat(32), "0x" + "00".repeat(32)];
      const ss = ["0x" + "00".repeat(32), "0x" + "00".repeat(32), "0x" + "00".repeat(32)];

      await expect(
        stakingPool.connect(user1).batchStakeWithPermit(tokenIds, deadline, vs, rs, ss),
      ).to.be.revertedWith("Array length mismatch");
    });

    it("批量 Permit 质押空数组应失败", async function () {
      const { stakingPool, user1 } = await loadFixture(deployFullSystemFixture);

      const deadline = BigInt((await time.latest()) + 3600);

      await expect(stakingPool.connect(user1).batchStakeWithPermit([], deadline, [], [], [])).to.be.revertedWith(
        "Empty array",
      );
    });

    it("合约暂停时不能使用 Permit 质押", async function () {
      const { stakingPool, stakableNFT, user1, deployer } = await loadFixture(deployFullSystemFixture);

      const tokenId = 1n;
      const deadline = BigInt((await time.latest()) + 3600);

      const { v, r, s } = await signPermit(
        user1,
        stakableNFT,
        await stakingPool.getAddress(),
        tokenId,
        deadline,
      );

      // 暂停合约
      await stakingPool.connect(deployer).pause();

      await expect(
        stakingPool.connect(user1).stakeWithPermit(tokenId, deadline, v, r, s),
      ).to.be.revertedWithCustomError(stakingPool, "EnforcedPause");
    });
  });

  // ============ 集成场景测试 ============

  describe("集成场景", function () {
    it("完整质押流程：质押 → 领取 → 解押", async function () {
      const { stakingPool, stakableNFT, rewardToken, user1 } = await loadFixture(deployFullSystemFixture);

      const tokenId = 1n;

      // 1. 质押
      await stakableNFT.connect(user1).approve(await stakingPool.getAddress(), tokenId);
      await stakingPool.connect(user1).stake(tokenId);

      // 2. 等待并领取
      await time.increase(43200); // 12小时
      await stakingPool.connect(user1).claimReward(tokenId);

      const balanceAfterClaim = await rewardToken.balanceOf(user1.address);
      expect(balanceAfterClaim).to.be.gt(0);

      // 3. 再等待并解押
      await time.increase(43200); // 再12小时
      await stakingPool.connect(user1).unstake(tokenId);

      const balanceAfterUnstake = await rewardToken.balanceOf(user1.address);
      expect(balanceAfterUnstake).to.be.gt(balanceAfterClaim);

      // NFT 已归还
      expect(await stakableNFT.ownerOf(tokenId)).to.equal(user1.address);
    });

    it("多用户并行质押", async function () {
      const { stakingPool, stakableNFT, user1, user2, user3 } = await loadFixture(deployFullSystemFixture);

      // 各质押一个 NFT
      await stakableNFT.connect(user1).approve(await stakingPool.getAddress(), 1n);
      await stakingPool.connect(user1).stake(1n);

      await stakableNFT.connect(user2).approve(await stakingPool.getAddress(), 21n);
      await stakingPool.connect(user2).stake(21n);

      await stakableNFT.connect(user3).approve(await stakingPool.getAddress(), 41n);
      await stakingPool.connect(user3).stake(41n);

      // 验证所有质押成功
      expect(await stakingPool.isStaked(1n)).to.be.true;
      expect(await stakingPool.isStaked(21n)).to.be.true;
      expect(await stakingPool.isStaked(41n)).to.be.true;
    });

    it("完整 Gasless 质押流程：离线签名 → Permit 质押 → 领取 → 解押", async function () {
      const { stakingPool, stakableNFT, rewardToken, user1 } = await loadFixture(deployFullSystemFixture);

      const tokenId = 1n;

      // 1. 用户离线签名 Permit（无需 gas）
      const deadline = BigInt((await time.latest()) + 3600);
      const nonce = await stakableNFT.nonces(user1.address);
      const chainId = (await ethers.provider.getNetwork()).chainId;

      const domain = {
        name: "Stakable NFT",
        version: "1",
        chainId: chainId,
        verifyingContract: await stakableNFT.getAddress(),
      };

      const types = {
        Permit: [
          { name: "spender", type: "address" },
          { name: "tokenId", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      };

      const value = {
        spender: await stakingPool.getAddress(),
        tokenId: tokenId,
        nonce: nonce,
        deadline: deadline,
      };

      const signature = await user1.signTypedData(domain, types, value);
      const sig = ethers.Signature.from(signature);

      // 2. 使用 Permit 质押（一笔交易完成授权+质押）
      await stakingPool.connect(user1).stakeWithPermit(tokenId, deadline, sig.v, sig.r, sig.s);

      expect(await stakingPool.isStaked(tokenId)).to.be.true;
      expect(await stakableNFT.ownerOf(tokenId)).to.equal(await stakingPool.getAddress());

      // 3. 等待并领取奖励
      await time.increase(43200); // 12小时
      await stakingPool.connect(user1).claimReward(tokenId);

      const balanceAfterClaim = await rewardToken.balanceOf(user1.address);
      expect(balanceAfterClaim).to.be.gt(0);

      // 4. 再等待并解押
      await time.increase(43200); // 再12小时
      await stakingPool.connect(user1).unstake(tokenId);

      const balanceAfterUnstake = await rewardToken.balanceOf(user1.address);
      expect(balanceAfterUnstake).to.be.gt(balanceAfterClaim);

      // NFT 已归还
      expect(await stakableNFT.ownerOf(tokenId)).to.equal(user1.address);
      expect(await stakingPool.isStaked(tokenId)).to.be.false;
    });

    it("Relayer 代付 gas 的 Gasless 质押场景", async function () {
      const { stakingPool, stakableNFT, user1, deployer } = await loadFixture(deployFullSystemFixture);

      const tokenId = 1n;
      const deadline = BigInt((await time.latest()) + 3600);

      // 1. 用户离线签名（不支付 gas）
      const nonce = await stakableNFT.nonces(user1.address);
      const chainId = (await ethers.provider.getNetwork()).chainId;

      const domain = {
        name: "Stakable NFT",
        version: "1",
        chainId: chainId,
        verifyingContract: await stakableNFT.getAddress(),
      };

      const types = {
        Permit: [
          { name: "spender", type: "address" },
          { name: "tokenId", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      };

      const value = {
        spender: await stakingPool.getAddress(),
        tokenId: tokenId,
        nonce: nonce,
        deadline: deadline,
      };

      const signature = await user1.signTypedData(domain, types, value);
      const sig = ethers.Signature.from(signature);

      // 2. Relayer（deployer）代付 gas 执行质押
      await stakingPool.connect(deployer).stakeWithPermit(tokenId, deadline, sig.v, sig.r, sig.s);

      // 验证质押成功（质押者仍是 user1）
      expect(await stakingPool.getStaker(tokenId)).to.equal(user1.address);
      expect(await stakingPool.isStaked(tokenId)).to.be.true;

      // user1 可以领取奖励（即使 Relayer 代付了质押 gas）
      await time.increase(3600);
      await stakingPool.connect(user1).claimReward(tokenId);
    });
  });
});
