import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("RewardToken", function () {
  // ============ Fixtures ============

  /**
   * 基础部署 fixture
   * - 部署 RewardToken 合约
   * - 获取多个测试账户
   */
  async function deployRewardTokenFixture() {
    const [deployer, minter, user1, user2, unauthorized] = await ethers.getSigners();

    const RewardToken = await ethers.getContractFactory("RewardToken");
    const rewardToken = await RewardToken.deploy();

    return { rewardToken, deployer, minter, user1, user2, unauthorized };
  }

  /**
   * 完整设置 fixture
   * - 部署合约
   * - 授予 minter MINTER_ROLE
   */
  async function deployWithMinterFixture() {
    const { rewardToken, deployer, minter, user1, user2, unauthorized } =
      await loadFixture(deployRewardTokenFixture);

    const MINTER_ROLE = await rewardToken.MINTER_ROLE();
    await rewardToken.connect(deployer).grantRole(MINTER_ROLE, minter.address);

    return { rewardToken, deployer, minter, user1, user2, unauthorized, MINTER_ROLE };
  }

  // ============ 部署测试 ============

  describe("部署", function () {
    it("名称应为 Reward Token", async function () {
      const { rewardToken } = await loadFixture(deployRewardTokenFixture);
      expect(await rewardToken.name()).to.equal("Reward Token");
    });

    it("符号应为 RWRD", async function () {
      const { rewardToken } = await loadFixture(deployRewardTokenFixture);
      expect(await rewardToken.symbol()).to.equal("RWRD");
    });

    it("精度应为 18", async function () {
      const { rewardToken } = await loadFixture(deployRewardTokenFixture);
      expect(await rewardToken.decimals()).to.equal(18);
    });

    it("初始供应量应为 0", async function () {
      const { rewardToken } = await loadFixture(deployRewardTokenFixture);
      expect(await rewardToken.totalSupply()).to.equal(0);
    });

    it("部署者应拥有 DEFAULT_ADMIN_ROLE", async function () {
      const { rewardToken, deployer } = await loadFixture(deployRewardTokenFixture);
      const DEFAULT_ADMIN_ROLE = await rewardToken.DEFAULT_ADMIN_ROLE();
      expect(await rewardToken.hasRole(DEFAULT_ADMIN_ROLE, deployer.address)).to.be.true;
    });

    it("isAdmin 应正确识别管理员", async function () {
      const { rewardToken, deployer, user1 } = await loadFixture(deployRewardTokenFixture);
      expect(await rewardToken.isAdmin(deployer.address)).to.be.true;
      expect(await rewardToken.isAdmin(user1.address)).to.be.false;
    });

    it("部署者初始不应有 MINTER_ROLE", async function () {
      const { rewardToken, deployer } = await loadFixture(deployRewardTokenFixture);
      const MINTER_ROLE = await rewardToken.MINTER_ROLE();
      expect(await rewardToken.hasRole(MINTER_ROLE, deployer.address)).to.be.false;
    });
  });

  // ============ 铸造测试 ============

  describe("铸造", function () {
    it("MINTER_ROLE 可以铸造代币", async function () {
      const { rewardToken, minter, user1 } = await loadFixture(deployWithMinterFixture);

      const mintAmount = ethers.parseEther("100");
      await rewardToken.connect(minter).mint(user1.address, mintAmount);

      expect(await rewardToken.balanceOf(user1.address)).to.equal(mintAmount);
      expect(await rewardToken.totalSupply()).to.equal(mintAmount);
    });

    it("非 MINTER_ROLE 无法铸造", async function () {
      const { rewardToken, unauthorized, user1 } = await loadFixture(deployWithMinterFixture);

      const mintAmount = ethers.parseEther("100");

      await expect(rewardToken.connect(unauthorized).mint(user1.address, mintAmount))
        .to.be.revertedWithCustomError(rewardToken, "AccessControlUnauthorizedAccount")
        .withArgs(unauthorized.address, await rewardToken.MINTER_ROLE());
    });

    it("铸造应触发 TokensMinted 事件", async function () {
      const { rewardToken, minter, user1 } = await loadFixture(deployWithMinterFixture);

      const mintAmount = ethers.parseEther("100");

      await expect(rewardToken.connect(minter).mint(user1.address, mintAmount))
        .to.emit(rewardToken, "TokensMinted")
        .withArgs(user1.address, mintAmount);
    });

    it("铸造应增加接收者余额", async function () {
      const { rewardToken, minter, user1 } = await loadFixture(deployWithMinterFixture);

      const initialBalance = await rewardToken.balanceOf(user1.address);
      const mintAmount = ethers.parseEther("50");

      await rewardToken.connect(minter).mint(user1.address, mintAmount);

      expect(await rewardToken.balanceOf(user1.address)).to.equal(initialBalance + mintAmount);
    });

    it("铸造应增加总供应量", async function () {
      const { rewardToken, minter, user1 } = await loadFixture(deployWithMinterFixture);

      const initialSupply = await rewardToken.totalSupply();
      const mintAmount = ethers.parseEther("200");

      await rewardToken.connect(minter).mint(user1.address, mintAmount);

      expect(await rewardToken.totalSupply()).to.equal(initialSupply + mintAmount);
    });

    it("应支持多次铸造给同一地址", async function () {
      const { rewardToken, minter, user1 } = await loadFixture(deployWithMinterFixture);

      await rewardToken.connect(minter).mint(user1.address, ethers.parseEther("100"));
      await rewardToken.connect(minter).mint(user1.address, ethers.parseEther("50"));

      expect(await rewardToken.balanceOf(user1.address)).to.equal(ethers.parseEther("150"));
    });

    it("应支持铸造给多个地址", async function () {
      const { rewardToken, minter, user1, user2 } = await loadFixture(deployWithMinterFixture);

      await rewardToken.connect(minter).mint(user1.address, ethers.parseEther("100"));
      await rewardToken.connect(minter).mint(user2.address, ethers.parseEther("200"));

      expect(await rewardToken.balanceOf(user1.address)).to.equal(ethers.parseEther("100"));
      expect(await rewardToken.balanceOf(user2.address)).to.equal(ethers.parseEther("200"));
      expect(await rewardToken.totalSupply()).to.equal(ethers.parseEther("300"));
    });

    it("铸造 0 数量应成功", async function () {
      const { rewardToken, minter, user1 } = await loadFixture(deployWithMinterFixture);

      await expect(rewardToken.connect(minter).mint(user1.address, 0)).to.not.be.reverted;
    });

    it("isMinter 应正确识别铸造者", async function () {
      const { rewardToken, minter, user1 } = await loadFixture(deployWithMinterFixture);

      expect(await rewardToken.isMinter(minter.address)).to.be.true;
      expect(await rewardToken.isMinter(user1.address)).to.be.false;
    });
  });

  // ============ 销毁测试 ============

  describe("销毁", function () {
    it("任何人可以销毁自己的代币", async function () {
      const { rewardToken, minter, user1 } = await loadFixture(deployWithMinterFixture);

      // 先铸造一些代币
      const mintAmount = ethers.parseEther("100");
      await rewardToken.connect(minter).mint(user1.address, mintAmount);

      // 销毁部分代币
      const burnAmount = ethers.parseEther("30");
      await rewardToken.connect(user1).burn(burnAmount);

      expect(await rewardToken.balanceOf(user1.address)).to.equal(mintAmount - burnAmount);
    });

    it("销毁应减少总供应量", async function () {
      const { rewardToken, minter, user1 } = await loadFixture(deployWithMinterFixture);

      await rewardToken.connect(minter).mint(user1.address, ethers.parseEther("100"));

      const supplyBefore = await rewardToken.totalSupply();
      const burnAmount = ethers.parseEther("40");

      await rewardToken.connect(user1).burn(burnAmount);

      expect(await rewardToken.totalSupply()).to.equal(supplyBefore - burnAmount);
    });

    it("销毁应触发 TokensBurned 事件", async function () {
      const { rewardToken, minter, user1 } = await loadFixture(deployWithMinterFixture);

      await rewardToken.connect(minter).mint(user1.address, ethers.parseEther("100"));

      const burnAmount = ethers.parseEther("50");

      await expect(rewardToken.connect(user1).burn(burnAmount))
        .to.emit(rewardToken, "TokensBurned")
        .withArgs(user1.address, burnAmount);
    });

    it("销毁超过余额应失败", async function () {
      const { rewardToken, minter, user1 } = await loadFixture(deployWithMinterFixture);

      await rewardToken.connect(minter).mint(user1.address, ethers.parseEther("50"));

      await expect(rewardToken.connect(user1).burn(ethers.parseEther("100"))).to.be.revertedWithCustomError(
        rewardToken,
        "ERC20InsufficientBalance",
      );
    });

    it("销毁全部余额应成功", async function () {
      const { rewardToken, minter, user1 } = await loadFixture(deployWithMinterFixture);

      const mintAmount = ethers.parseEther("100");
      await rewardToken.connect(minter).mint(user1.address, mintAmount);

      await rewardToken.connect(user1).burn(mintAmount);

      expect(await rewardToken.balanceOf(user1.address)).to.equal(0);
    });
  });

  // ============ burnFrom 测试 ============

  describe("burnFrom", function () {
    it("授权后可以 burnFrom", async function () {
      const { rewardToken, minter, user1, user2 } = await loadFixture(deployWithMinterFixture);

      // 铸造代币给 user1
      const mintAmount = ethers.parseEther("100");
      await rewardToken.connect(minter).mint(user1.address, mintAmount);

      // user1 授权给 user2
      const approveAmount = ethers.parseEther("50");
      await rewardToken.connect(user1).approve(user2.address, approveAmount);

      // user2 销毁 user1 的代币
      const burnAmount = ethers.parseEther("30");
      await rewardToken.connect(user2).burnFrom(user1.address, burnAmount);

      expect(await rewardToken.balanceOf(user1.address)).to.equal(mintAmount - burnAmount);
    });

    it("burnFrom 应减少 allowance", async function () {
      const { rewardToken, minter, user1, user2 } = await loadFixture(deployWithMinterFixture);

      await rewardToken.connect(minter).mint(user1.address, ethers.parseEther("100"));

      const approveAmount = ethers.parseEther("50");
      await rewardToken.connect(user1).approve(user2.address, approveAmount);

      const burnAmount = ethers.parseEther("30");
      await rewardToken.connect(user2).burnFrom(user1.address, burnAmount);

      expect(await rewardToken.allowance(user1.address, user2.address)).to.equal(approveAmount - burnAmount);
    });

    it("burnFrom 应触发 TokensBurned 事件", async function () {
      const { rewardToken, minter, user1, user2 } = await loadFixture(deployWithMinterFixture);

      await rewardToken.connect(minter).mint(user1.address, ethers.parseEther("100"));
      await rewardToken.connect(user1).approve(user2.address, ethers.parseEther("50"));

      const burnAmount = ethers.parseEther("30");

      await expect(rewardToken.connect(user2).burnFrom(user1.address, burnAmount))
        .to.emit(rewardToken, "TokensBurned")
        .withArgs(user1.address, burnAmount);
    });

    it("未授权无法 burnFrom", async function () {
      const { rewardToken, minter, user1, unauthorized } = await loadFixture(deployWithMinterFixture);

      await rewardToken.connect(minter).mint(user1.address, ethers.parseEther("100"));

      await expect(
        rewardToken.connect(unauthorized).burnFrom(user1.address, ethers.parseEther("30")),
      ).to.be.revertedWithCustomError(rewardToken, "ERC20InsufficientAllowance");
    });
  });

  // ============ 权限管理测试 ============

  describe("权限管理", function () {
    it("管理员可以授予 MINTER_ROLE", async function () {
      const { rewardToken, deployer, user1 } = await loadFixture(deployRewardTokenFixture);

      const MINTER_ROLE = await rewardToken.MINTER_ROLE();
      await rewardToken.connect(deployer).grantRole(MINTER_ROLE, user1.address);

      expect(await rewardToken.hasRole(MINTER_ROLE, user1.address)).to.be.true;
    });

    it("管理员可以撤销 MINTER_ROLE", async function () {
      const { rewardToken, deployer, minter, MINTER_ROLE } = await loadFixture(deployWithMinterFixture);

      await rewardToken.connect(deployer).revokeRole(MINTER_ROLE, minter.address);

      expect(await rewardToken.hasRole(MINTER_ROLE, minter.address)).to.be.false;
    });

    it("非管理员无法授予角色", async function () {
      const { rewardToken, unauthorized, user1, MINTER_ROLE } = await loadFixture(deployWithMinterFixture);

      await expect(rewardToken.connect(unauthorized).grantRole(MINTER_ROLE, user1.address))
        .to.be.revertedWithCustomError(rewardToken, "AccessControlUnauthorizedAccount")
        .withArgs(unauthorized.address, await rewardToken.DEFAULT_ADMIN_ROLE());
    });

    it("被撤销权限后无法铸造", async function () {
      const { rewardToken, deployer, minter, user1, MINTER_ROLE } = await loadFixture(deployWithMinterFixture);

      // 撤销铸造权限
      await rewardToken.connect(deployer).revokeRole(MINTER_ROLE, minter.address);

      // 尝试铸造应失败
      await expect(rewardToken.connect(minter).mint(user1.address, ethers.parseEther("100")))
        .to.be.revertedWithCustomError(rewardToken, "AccessControlUnauthorizedAccount")
        .withArgs(minter.address, MINTER_ROLE);
    });

    it("可以授予多个 MINTER_ROLE", async function () {
      const { rewardToken, deployer, user1, user2 } = await loadFixture(deployRewardTokenFixture);

      const MINTER_ROLE = await rewardToken.MINTER_ROLE();
      await rewardToken.connect(deployer).grantRole(MINTER_ROLE, user1.address);
      await rewardToken.connect(deployer).grantRole(MINTER_ROLE, user2.address);

      expect(await rewardToken.hasRole(MINTER_ROLE, user1.address)).to.be.true;
      expect(await rewardToken.hasRole(MINTER_ROLE, user2.address)).to.be.true;
    });
  });

  // ============ ERC20 标准功能测试 ============

  describe("ERC20 标准功能", function () {
    it("应支持 transfer", async function () {
      const { rewardToken, minter, user1, user2 } = await loadFixture(deployWithMinterFixture);

      await rewardToken.connect(minter).mint(user1.address, ethers.parseEther("100"));

      const transferAmount = ethers.parseEther("30");
      await rewardToken.connect(user1).transfer(user2.address, transferAmount);

      expect(await rewardToken.balanceOf(user2.address)).to.equal(transferAmount);
    });

    it("应支持 approve 和 transferFrom", async function () {
      const { rewardToken, minter, user1, user2 } = await loadFixture(deployWithMinterFixture);

      await rewardToken.connect(minter).mint(user1.address, ethers.parseEther("100"));

      const approveAmount = ethers.parseEther("50");
      await rewardToken.connect(user1).approve(user2.address, approveAmount);

      const transferAmount = ethers.parseEther("30");
      await rewardToken.connect(user2).transferFrom(user1.address, user2.address, transferAmount);

      expect(await rewardToken.balanceOf(user2.address)).to.equal(transferAmount);
    });

    it("应正确处理 allowance", async function () {
      const { rewardToken, user1, user2 } = await loadFixture(deployRewardTokenFixture);

      const approveAmount = ethers.parseEther("100");
      await rewardToken.connect(user1).approve(user2.address, approveAmount);

      expect(await rewardToken.allowance(user1.address, user2.address)).to.equal(approveAmount);
    });
  });

  // ============ 工具函数测试 ============

  describe("工具函数", function () {
    it("toWei 应正确转换", async function () {
      const { rewardToken } = await loadFixture(deployRewardTokenFixture);

      expect(await rewardToken.toWei(100)).to.equal(ethers.parseEther("100"));
      expect(await rewardToken.toWei(1)).to.equal(ethers.parseEther("1"));
      expect(await rewardToken.toWei(0)).to.equal(0);
    });

    it("fromWei 应正确转换", async function () {
      const { rewardToken } = await loadFixture(deployRewardTokenFixture);

      expect(await rewardToken.fromWei(ethers.parseEther("100"))).to.equal(100);
      expect(await rewardToken.fromWei(ethers.parseEther("1"))).to.equal(1);
      expect(await rewardToken.fromWei(0)).to.equal(0);
    });

    it("toWei 和 fromWei 应互为逆运算", async function () {
      const { rewardToken } = await loadFixture(deployRewardTokenFixture);

      const amount = 100n;
      const wei = await rewardToken.toWei(amount);
      const back = await rewardToken.fromWei(wei);

      expect(back).to.equal(amount);
    });
  });

  // ============ 集成场景测试 ============

  describe("集成场景", function () {
    it("模拟质押奖励发放场景", async function () {
      const { rewardToken, deployer, minter, user1 } = await loadFixture(deployRewardTokenFixture);

      // 1. 部署者授予 minter (模拟 StakingPool) MINTER_ROLE
      const MINTER_ROLE = await rewardToken.MINTER_ROLE();
      await rewardToken.connect(deployer).grantRole(MINTER_ROLE, minter.address);

      // 2. StakingPool 计算用户质押奖励并铸造
      const dailyReward = ethers.parseEther("1"); // 1 RWRD/天
      await rewardToken.connect(minter).mint(user1.address, dailyReward);

      // 3. 验证用户收到奖励
      expect(await rewardToken.balanceOf(user1.address)).to.equal(dailyReward);
    });

    it("模拟多用户质押场景", async function () {
      const { rewardToken, minter, user1, user2 } = await loadFixture(deployWithMinterFixture);

      // User1 质押 Common NFT 1 天 -> 1 RWRD
      await rewardToken.connect(minter).mint(user1.address, ethers.parseEther("1"));

      // User2 质押 Legendary NFT 1 天 -> 3 RWRD
      await rewardToken.connect(minter).mint(user2.address, ethers.parseEther("3"));

      expect(await rewardToken.balanceOf(user1.address)).to.equal(ethers.parseEther("1"));
      expect(await rewardToken.balanceOf(user2.address)).to.equal(ethers.parseEther("3"));
      expect(await rewardToken.totalSupply()).to.equal(ethers.parseEther("4"));
    });

    it("模拟代币消耗场景 (未来 NFT 升级)", async function () {
      const { rewardToken, minter, user1 } = await loadFixture(deployWithMinterFixture);

      // 用户获得奖励
      await rewardToken.connect(minter).mint(user1.address, ethers.parseEther("100"));

      // 用户消耗 50 RWRD 升级 NFT
      const upgradeCost = ethers.parseEther("50");
      await rewardToken.connect(user1).burn(upgradeCost);

      expect(await rewardToken.balanceOf(user1.address)).to.equal(ethers.parseEther("50"));
      expect(await rewardToken.totalSupply()).to.equal(ethers.parseEther("50"));
    });
  });

  // ============ 边界情况测试 ============

  describe("边界情况", function () {
    it("铸造非常大的数量应成功", async function () {
      const { rewardToken, minter, user1 } = await loadFixture(deployWithMinterFixture);

      const largeAmount = ethers.parseEther("1000000"); // 100万 RWRD
      await rewardToken.connect(minter).mint(user1.address, largeAmount);

      expect(await rewardToken.balanceOf(user1.address)).to.equal(largeAmount);
    });

    it("铸造给零地址应失败", async function () {
      const { rewardToken, minter } = await loadFixture(deployWithMinterFixture);

      await expect(
        rewardToken.connect(minter).mint(ethers.ZeroAddress, ethers.parseEther("100")),
      ).to.be.revertedWithCustomError(rewardToken, "ERC20InvalidReceiver");
    });

    it("零余额账户销毁应失败", async function () {
      const { rewardToken, user1 } = await loadFixture(deployRewardTokenFixture);

      await expect(rewardToken.connect(user1).burn(ethers.parseEther("1"))).to.be.revertedWithCustomError(
        rewardToken,
        "ERC20InsufficientBalance",
      );
    });
  });
});
