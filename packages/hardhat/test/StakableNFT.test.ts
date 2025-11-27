import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("StakableNFT", function () {
  // ============ 常量定义 ============
  const MAX_SUPPLY = 100;
  const MAX_PER_ADDRESS = 20;
  const MINT_PRICE = ethers.parseEther("1");

  const COMMON_COUNT = 50;
  const RARE_COUNT = 30;
  const EPIC_COUNT = 15;
  const LEGENDARY_COUNT = 5;

  // Rarity enum
  enum Rarity {
    Common = 0,
    Rare = 1,
    Epic = 2,
    Legendary = 3,
  }

  // ============ 辅助函数 ============

  /**
   * 生成洗牌后的稀有度数组
   */
  function generateShuffledRarities(): number[] {
    const rarities: number[] = [];

    // 添加稀有度
    for (let i = 0; i < COMMON_COUNT; i++) rarities.push(Rarity.Common);
    for (let i = 0; i < RARE_COUNT; i++) rarities.push(Rarity.Rare);
    for (let i = 0; i < EPIC_COUNT; i++) rarities.push(Rarity.Epic);
    for (let i = 0; i < LEGENDARY_COUNT; i++) rarities.push(Rarity.Legendary);

    // Fisher-Yates 洗牌算法
    for (let i = rarities.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rarities[i], rarities[j]] = [rarities[j], rarities[i]];
    }

    return rarities;
  }

  /**
   * 生成错误的稀有度数组(用于测试验证)
   */
  function generateInvalidRarities(): number[] {
    const rarities: number[] = [];
    // 错误的分布: Common 60, Rare 20, Epic 15, Legendary 5
    for (let i = 0; i < 60; i++) rarities.push(Rarity.Common);
    for (let i = 0; i < 20; i++) rarities.push(Rarity.Rare);
    for (let i = 0; i < 15; i++) rarities.push(Rarity.Epic);
    for (let i = 0; i < 5; i++) rarities.push(Rarity.Legendary);
    return rarities;
  }

  // ============ Fixtures ============

  /**
   * 基础部署 fixture
   */
  async function deployContractFixture() {
    const [owner, user1, user2, operator, pauser] = await ethers.getSigners();

    const StakableNFT = await ethers.getContractFactory("StakableNFT");
    const nft = await StakableNFT.deploy();

    // 获取角色常量
    const OPERATOR_ROLE = await nft.OPERATOR_ROLE();
    const PAUSER_ROLE = await nft.PAUSER_ROLE();
    const DEFAULT_ADMIN_ROLE = await nft.DEFAULT_ADMIN_ROLE();

    return {
      nft,
      owner,
      user1,
      user2,
      operator,
      pauser,
      OPERATOR_ROLE,
      PAUSER_ROLE,
      DEFAULT_ADMIN_ROLE,
    };
  }

  /**
   * 已设置稀有度池的 fixture
   */
  async function deployWithRarityPoolFixture() {
    const fixture = await deployContractFixture();
    const { nft, owner, OPERATOR_ROLE } = fixture;

    // 授予 operator 角色
    await nft.grantRoleTo(OPERATOR_ROLE, owner.address);

    // 设置稀有度池
    const shuffledRarities = generateShuffledRarities();
    await nft.setRarityPool(shuffledRarities);

    return { ...fixture, shuffledRarities };
  }

  /**
   * 已铸造部分 NFT 的 fixture
   */
  async function deployWithMintedNFTsFixture() {
    const fixture = await deployWithRarityPoolFixture();
    const { nft, user1 } = fixture;

    // user1 铸造 5 个 NFT
    await nft.connect(user1).mint(5, { value: MINT_PRICE * 5n });

    return fixture;
  }

  /**
   * 已铸造完成并揭示的 fixture
   */
  async function deployWithRevealedFixture() {
    const fixture = await deployWithRarityPoolFixture();
    const { nft, owner, user1, user2, operator, pauser } = fixture;

    // 铸造所有 NFT (需要 5 个账户,每人 20 个)
    await nft.connect(user1).mint(MAX_PER_ADDRESS, { value: MINT_PRICE * BigInt(MAX_PER_ADDRESS) }); // 20
    await nft.connect(user2).mint(MAX_PER_ADDRESS, { value: MINT_PRICE * BigInt(MAX_PER_ADDRESS) }); // 20
    await nft.connect(owner).mint(MAX_PER_ADDRESS, { value: MINT_PRICE * BigInt(MAX_PER_ADDRESS) }); // 20
    await nft.connect(operator).mint(MAX_PER_ADDRESS, { value: MINT_PRICE * BigInt(MAX_PER_ADDRESS) }); // 20
    await nft.connect(pauser).mint(MAX_PER_ADDRESS, { value: MINT_PRICE * BigInt(MAX_PER_ADDRESS) }); // 20
    // 总计: 100 个

    // 揭示
    await nft.reveal();

    return fixture;
  }

  // ============ 测试开始 ============

  describe("1. 部署和初始化", function () {
    it("应该正确部署合约", async function () {
      const { nft } = await loadFixture(deployContractFixture);

      const address = await nft.getAddress();
      expect(address).to.be.properAddress;
    });

    it("应该正确设置常量", async function () {
      const { nft } = await loadFixture(deployContractFixture);

      expect(await nft.MAX_SUPPLY()).to.equal(MAX_SUPPLY);
      expect(await nft.MAX_PER_ADDRESS()).to.equal(MAX_PER_ADDRESS);
      expect(await nft.MINT_PRICE()).to.equal(MINT_PRICE);
      expect(await nft.MAX_MULTIPLIER()).to.equal(100000);
    });

    it("应该正确初始化状态变量", async function () {
      const { nft } = await loadFixture(deployContractFixture);

      expect(await nft.totalMinted()).to.equal(0);
      expect(await nft.isRevealed()).to.equal(false);
      expect(await nft.rarityPoolSet()).to.equal(false);
    });

    it("应该正确分配角色", async function () {
      const { nft, owner, DEFAULT_ADMIN_ROLE } = await loadFixture(deployContractFixture);

      const hasRole = await nft.checkRole(DEFAULT_ADMIN_ROLE, owner.address);
      expect(hasRole).to.be.true;
    });

    it("应该正确设置默认奖励倍率", async function () {
      const { nft } = await loadFixture(deployContractFixture);

      expect(await nft.rewardMultiplier(Rarity.Common)).to.equal(10000); // 1x
      expect(await nft.rewardMultiplier(Rarity.Rare)).to.equal(15000); // 1.5x
      expect(await nft.rewardMultiplier(Rarity.Epic)).to.equal(20000); // 2x
      expect(await nft.rewardMultiplier(Rarity.Legendary)).to.equal(30000); // 3x
    });

    it("应该正确设置 NFT 名称和符号", async function () {
      const { nft } = await loadFixture(deployContractFixture);

      expect(await nft.name()).to.equal("Stakable NFT");
      expect(await nft.symbol()).to.equal("SNFT");
    });
  });

  describe("2. 稀有度池设置 (setRarityPool)", function () {
    describe("✅ 正常情况", function () {
      it("OPERATOR 应该可以设置稀有度池", async function () {
        const { nft, owner, OPERATOR_ROLE } = await loadFixture(deployContractFixture);

        await nft.grantRoleTo(OPERATOR_ROLE, owner.address);

        const shuffledRarities = generateShuffledRarities();
        await nft.setRarityPool(shuffledRarities);

        const isSet = await nft.rarityPoolSet();
        expect(isSet).to.be.true;
      });

      it("应该触发 RarityPoolSet 事件", async function () {
        const { nft, owner, OPERATOR_ROLE } = await loadFixture(deployContractFixture);

        await nft.grantRoleTo(OPERATOR_ROLE, owner.address);

        const shuffledRarities = generateShuffledRarities();
        await expect(nft.setRarityPool(shuffledRarities)).to.emit(nft, "RarityPoolSet").withArgs(MAX_SUPPLY);
      });

      it("应该正确存储稀有度池", async function () {
        const { nft, owner, OPERATOR_ROLE } = await loadFixture(deployContractFixture);

        await nft.grantRoleTo(OPERATOR_ROLE, owner.address);

        const shuffledRarities = generateShuffledRarities();
        await nft.setRarityPool(shuffledRarities);

        // 验证存储的稀有度
        for (let i = 0; i < MAX_SUPPLY; i++) {
          expect(await nft.rarityPool(i)).to.equal(shuffledRarities[i]);
        }
      });
    });

    describe("❌ 错误情况", function () {
      it("非 OPERATOR 不能设置稀有度池", async function () {
        const { nft, user1 } = await loadFixture(deployContractFixture);

        const shuffledRarities = generateShuffledRarities();
        await expect(nft.connect(user1).setRarityPool(shuffledRarities)).to.be.reverted;
      });

      it("不能重复设置稀有度池", async function () {
        const { nft } = await loadFixture(deployWithRarityPoolFixture);

        const shuffledRarities = generateShuffledRarities();
        await expect(nft.setRarityPool(shuffledRarities)).to.be.revertedWith("Rarity pool already set");
      });

      it("数组长度不等于 MAX_SUPPLY 时应该拒绝", async function () {
        const { nft, owner, OPERATOR_ROLE } = await loadFixture(deployContractFixture);

        await nft.grantRoleTo(OPERATOR_ROLE, owner.address);

        const invalidRarities = generateShuffledRarities().slice(0, 50); // 只有 50 个
        await expect(nft.setRarityPool(invalidRarities)).to.be.revertedWith("Invalid array length");
      });

      it("稀有度分布不正确时应该拒绝", async function () {
        const { nft, owner, OPERATOR_ROLE } = await loadFixture(deployContractFixture);

        await nft.grantRoleTo(OPERATOR_ROLE, owner.address);

        const invalidRarities = generateInvalidRarities();
        await expect(nft.setRarityPool(invalidRarities)).to.be.revertedWithCustomError(
          nft,
          "InvalidRarityDistribution",
        );
      });
    });
  });

  describe("3. 铸造功能 (mint)", function () {
    describe("✅ 正常情况", function () {
      it("应该允许铸造单个 NFT", async function () {
        const { nft, user1 } = await loadFixture(deployWithRarityPoolFixture);

        await nft.connect(user1).mint(1, { value: MINT_PRICE });

        expect(await nft.balanceOf(user1.address)).to.equal(1);
        expect(await nft.totalMinted()).to.equal(1);
        expect(await nft.mintedCount(user1.address)).to.equal(1);
        expect(await nft.ownerOf(1)).to.equal(user1.address);
      });

      it("应该允许批量铸造多个 NFT", async function () {
        const { nft, user1 } = await loadFixture(deployWithRarityPoolFixture);

        const quantity = 5;
        await nft.connect(user1).mint(quantity, { value: MINT_PRICE * BigInt(quantity) });

        expect(await nft.balanceOf(user1.address)).to.equal(quantity);
        expect(await nft.totalMinted()).to.equal(quantity);
        expect(await nft.mintedCount(user1.address)).to.equal(quantity);
      });

      it("应该正确分配连续的 tokenId", async function () {
        const { nft, user1 } = await loadFixture(deployWithRarityPoolFixture);

        await nft.connect(user1).mint(3, { value: MINT_PRICE * 3n });

        // 验证 tokenId 从 1 开始连续分配
        expect(await nft.ownerOf(1)).to.equal(user1.address);
        expect(await nft.ownerOf(2)).to.equal(user1.address);
        expect(await nft.ownerOf(3)).to.equal(user1.address);
      });

      it("应该触发 NFTMinted 事件", async function () {
        const { nft, user1 } = await loadFixture(deployWithRarityPoolFixture);

        await expect(nft.connect(user1).mint(3, { value: MINT_PRICE * 3n }))
          .to.emit(nft, "NFTMinted")
          .withArgs(user1.address, 1, 3);
      });

      it("应该正确处理多个用户的铸造", async function () {
        const { nft, user1, user2 } = await loadFixture(deployWithRarityPoolFixture);

        await nft.connect(user1).mint(5, { value: MINT_PRICE * 5n });
        await nft.connect(user2).mint(3, { value: MINT_PRICE * 3n });

        expect(await nft.balanceOf(user1.address)).to.equal(5);
        expect(await nft.balanceOf(user2.address)).to.equal(3);
        expect(await nft.totalMinted()).to.equal(8);
        expect(await nft.mintedCount(user1.address)).to.equal(5);
        expect(await nft.mintedCount(user2.address)).to.equal(3);
      });

      it("应该允许同一用户多次铸造", async function () {
        const { nft, user1 } = await loadFixture(deployWithRarityPoolFixture);

        await nft.connect(user1).mint(5, { value: MINT_PRICE * 5n });
        await nft.connect(user1).mint(3, { value: MINT_PRICE * 3n });

        expect(await nft.balanceOf(user1.address)).to.equal(8);
        expect(await nft.mintedCount(user1.address)).to.equal(8);
      });

      it("应该正确接收 ETH", async function () {
        const { nft, user1 } = await loadFixture(deployWithRarityPoolFixture);

        await expect(nft.connect(user1).mint(2, { value: MINT_PRICE * 2n })).to.changeEtherBalances(
          [user1, nft],
          [-MINT_PRICE * 2n, MINT_PRICE * 2n],
        );
      });
    });

    describe("🔢 边界条件", function () {
      it("应该允许铸造到达每地址上限", async function () {
        const { nft, user1 } = await loadFixture(deployWithRarityPoolFixture);

        await nft.connect(user1).mint(MAX_PER_ADDRESS, { value: MINT_PRICE * BigInt(MAX_PER_ADDRESS) });

        expect(await nft.mintedCount(user1.address)).to.equal(MAX_PER_ADDRESS);
      });

      it("应该允许铸造到达供应上限", async function () {
        const { nft, owner, user1, user2, operator, pauser } = await loadFixture(deployWithRarityPoolFixture);

        // 5 个账户各铸造 20 个
        await nft.connect(user1).mint(MAX_PER_ADDRESS, { value: MINT_PRICE * BigInt(MAX_PER_ADDRESS) });
        await nft.connect(user2).mint(MAX_PER_ADDRESS, { value: MINT_PRICE * BigInt(MAX_PER_ADDRESS) });
        await nft.connect(owner).mint(MAX_PER_ADDRESS, { value: MINT_PRICE * BigInt(MAX_PER_ADDRESS) });
        await nft.connect(operator).mint(MAX_PER_ADDRESS, { value: MINT_PRICE * BigInt(MAX_PER_ADDRESS) });
        await nft.connect(pauser).mint(MAX_PER_ADDRESS, { value: MINT_PRICE * BigInt(MAX_PER_ADDRESS) });

        expect(await nft.totalMinted()).to.equal(MAX_SUPPLY);
      });

      it("应该允许逐个铸造达到每地址上限", async function () {
        const { nft, user1 } = await loadFixture(deployWithRarityPoolFixture);

        // 逐个铸造 20 次
        for (let i = 0; i < MAX_PER_ADDRESS; i++) {
          await nft.connect(user1).mint(1, { value: MINT_PRICE });
        }

        expect(await nft.mintedCount(user1.address)).to.equal(MAX_PER_ADDRESS);
      });
    });

    describe("❌ 错误情况", function () {
      it("稀有度池未设置时应该拒绝", async function () {
        const { nft, user1 } = await loadFixture(deployContractFixture);

        await expect(nft.connect(user1).mint(1, { value: MINT_PRICE })).to.be.revertedWith("Rarity pool not set");
      });

      it("数量为 0 时应该拒绝", async function () {
        const { nft, user1 } = await loadFixture(deployWithRarityPoolFixture);

        await expect(nft.connect(user1).mint(0, { value: 0 })).to.be.revertedWith("Quantity must be greater than 0");
      });

      it("超过每地址上限时应该拒绝", async function () {
        const { nft, user1 } = await loadFixture(deployWithRarityPoolFixture);

        await nft.connect(user1).mint(MAX_PER_ADDRESS, { value: MINT_PRICE * BigInt(MAX_PER_ADDRESS) });

        await expect(nft.connect(user1).mint(1, { value: MINT_PRICE })).to.be.revertedWith("Exceeds max per address");
      });

      it("超过供应上限时应该拒绝", async function () {
        const { nft, owner, user1, user2, operator, pauser } = await loadFixture(deployWithRarityPoolFixture);

        // 铸造 100 个
        await nft.connect(user1).mint(MAX_PER_ADDRESS, { value: MINT_PRICE * BigInt(MAX_PER_ADDRESS) });
        await nft.connect(user2).mint(MAX_PER_ADDRESS, { value: MINT_PRICE * BigInt(MAX_PER_ADDRESS) });
        await nft.connect(owner).mint(MAX_PER_ADDRESS, { value: MINT_PRICE * BigInt(MAX_PER_ADDRESS) });
        await nft.connect(operator).mint(MAX_PER_ADDRESS, { value: MINT_PRICE * BigInt(MAX_PER_ADDRESS) });
        await nft.connect(pauser).mint(MAX_PER_ADDRESS, { value: MINT_PRICE * BigInt(MAX_PER_ADDRESS) });

        // 尝试再铸造
        const [, , , , , extraUser] = await ethers.getSigners();
        await expect(nft.connect(extraUser).mint(1, { value: MINT_PRICE })).to.be.revertedWith("Exceeds max supply");
      });

      it("支付金额不足时应该拒绝", async function () {
        const { nft, user1 } = await loadFixture(deployWithRarityPoolFixture);

        await expect(nft.connect(user1).mint(2, { value: MINT_PRICE })).to.be.revertedWith("Incorrect payment amount");
      });

      it("支付金额过多时应该拒绝", async function () {
        const { nft, user1 } = await loadFixture(deployWithRarityPoolFixture);

        await expect(nft.connect(user1).mint(2, { value: MINT_PRICE * 3n })).to.be.revertedWith(
          "Incorrect payment amount",
        );
      });

      it("合约暂停时应该拒绝铸造", async function () {
        const { nft, user1, pauser, PAUSER_ROLE } = await loadFixture(deployWithRarityPoolFixture);

        // 授予暂停权限并暂停
        await nft.grantRoleTo(PAUSER_ROLE, pauser.address);
        await nft.connect(pauser).pause();

        await expect(nft.connect(user1).mint(1, { value: MINT_PRICE })).to.be.reverted;
      });
    });
  });

  describe("4. 揭示功能 (reveal)", function () {
    describe("✅ 正常情况", function () {
      it("管理员应该可以揭示稀有度", async function () {
        const { nft, owner, user1, user2, operator, pauser } = await loadFixture(deployWithRarityPoolFixture);

        // 铸造所有 NFT
        await nft.connect(user1).mint(MAX_PER_ADDRESS, { value: MINT_PRICE * BigInt(MAX_PER_ADDRESS) });
        await nft.connect(user2).mint(MAX_PER_ADDRESS, { value: MINT_PRICE * BigInt(MAX_PER_ADDRESS) });
        await nft.connect(owner).mint(MAX_PER_ADDRESS, { value: MINT_PRICE * BigInt(MAX_PER_ADDRESS) });
        await nft.connect(operator).mint(MAX_PER_ADDRESS, { value: MINT_PRICE * BigInt(MAX_PER_ADDRESS) });
        await nft.connect(pauser).mint(MAX_PER_ADDRESS, { value: MINT_PRICE * BigInt(MAX_PER_ADDRESS) });

        await nft.reveal();

        const revealed = await nft.isRevealed();
        expect(revealed).to.be.true;
      });

      it("应该生成有效的随机偏移", async function () {
        const { nft } = await loadFixture(deployWithRevealedFixture);

        const offset = await nft.revealOffset();
        expect(offset).to.be.within(0, MAX_SUPPLY - 1);
      });

      it("应该为所有 NFT 分配稀有度", async function () {
        const { nft } = await loadFixture(deployWithRevealedFixture);

        // 验证所有 tokenId 都有稀有度
        for (let tokenId = 1; tokenId <= MAX_SUPPLY; tokenId++) {
          const rarity = await nft.getRarity(tokenId);
          expect(Number(rarity)).to.be.oneOf([0, 1, 2, 3]); // Common, Rare, Epic, Legendary
        }
      });

      it("应该正确分配稀有度数量", async function () {
        const { nft } = await loadFixture(deployWithRevealedFixture);

        // 统计各稀有度数量
        const counts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };

        for (let tokenId = 1; tokenId <= MAX_SUPPLY; tokenId++) {
          const rarity = await nft.getRarity(tokenId);
          counts[Number(rarity)]++;
        }

        // 验证分布
        expect(counts[0]).to.equal(COMMON_COUNT); // Common: 50
        expect(counts[1]).to.equal(RARE_COUNT); // Rare: 30
        expect(counts[2]).to.equal(EPIC_COUNT); // Epic: 15
        expect(counts[3]).to.equal(LEGENDARY_COUNT); // Legendary: 5
      });

      it("应该触发 RevealCompleted 事件", async function () {
        const { nft, owner, user1, user2, operator, pauser } = await loadFixture(deployWithRarityPoolFixture);

        // 铸造所有 NFT
        await nft.connect(user1).mint(MAX_PER_ADDRESS, { value: MINT_PRICE * BigInt(MAX_PER_ADDRESS) });
        await nft.connect(user2).mint(MAX_PER_ADDRESS, { value: MINT_PRICE * BigInt(MAX_PER_ADDRESS) });
        await nft.connect(owner).mint(MAX_PER_ADDRESS, { value: MINT_PRICE * BigInt(MAX_PER_ADDRESS) });
        await nft.connect(operator).mint(MAX_PER_ADDRESS, { value: MINT_PRICE * BigInt(MAX_PER_ADDRESS) });
        await nft.connect(pauser).mint(MAX_PER_ADDRESS, { value: MINT_PRICE * BigInt(MAX_PER_ADDRESS) });

        const tx = await nft.reveal();

        // 获取 revealOffset
        const revealOffset = await nft.revealOffset();

        // 验证事件
        await expect(tx).to.emit(nft, "RevealCompleted").withArgs(revealOffset);
      });
    });

    describe("❌ 错误情况", function () {
      it("非管理员不能揭示", async function () {
        const { nft, user1, user2, owner, operator, pauser } = await loadFixture(deployWithRarityPoolFixture);

        // 铸造所有 NFT
        await nft.connect(user1).mint(MAX_PER_ADDRESS, { value: MINT_PRICE * BigInt(MAX_PER_ADDRESS) });
        await nft.connect(user2).mint(MAX_PER_ADDRESS, { value: MINT_PRICE * BigInt(MAX_PER_ADDRESS) });
        await nft.connect(owner).mint(MAX_PER_ADDRESS, { value: MINT_PRICE * BigInt(MAX_PER_ADDRESS) });
        await nft.connect(operator).mint(MAX_PER_ADDRESS, { value: MINT_PRICE * BigInt(MAX_PER_ADDRESS) });
        await nft.connect(pauser).mint(MAX_PER_ADDRESS, { value: MINT_PRICE * BigInt(MAX_PER_ADDRESS) });

        await expect(nft.connect(user1).reveal()).to.be.reverted;
      });

      it("稀有度池未设置时不能揭示", async function () {
        const { nft } = await loadFixture(deployContractFixture);

        await expect(nft.reveal()).to.be.revertedWith("Rarity pool not set");
      });

      it("未铸造完成时不能揭示", async function () {
        const { nft, user1 } = await loadFixture(deployWithRarityPoolFixture);

        // 只铸造部分
        await nft.connect(user1).mint(10, { value: MINT_PRICE * 10n });

        await expect(nft.reveal()).to.be.revertedWith("All NFTs must be minted before reveal");
      });

      it("不能重复揭示", async function () {
        const { nft } = await loadFixture(deployWithRevealedFixture);

        await expect(nft.reveal()).to.be.revertedWith("Already revealed");
      });
    });

    describe("🔍 揭示后状态", function () {
      it("揭示后应该可以查询稀有度", async function () {
        const { nft } = await loadFixture(deployWithRevealedFixture);

        const rarity = await nft.getRarity(1);
        expect(Number(rarity)).to.be.oneOf([0, 1, 2, 3]);
      });

      it("揭示后 tokenURI 应该返回完整信息", async function () {
        const { nft } = await loadFixture(deployWithRevealedFixture);

        const uri = await nft.tokenURI(1);

        expect(uri).to.include("data:application/json;base64");
        // URI 应该包含完整的 metadata (不是盲盒)
        const json = JSON.parse(Buffer.from(uri.split(",")[1], "base64").toString());
        expect(json).to.have.property("name");
        expect(json).to.have.property("image");
        expect(json).to.have.property("attributes");
        expect(json.attributes).to.be.an("array");

        // 应该包含稀有度信息
        const rarityAttr = json.attributes.find((attr: any) => attr.trait_type === "Rarity");
        expect(rarityAttr).to.exist;
        expect(rarityAttr.value).to.be.oneOf(["Common", "Rare", "Epic", "Legendary"]);
      });
    });
  });

  describe("5. 查询功能", function () {
    describe("getRarity", function () {
      it("未揭示时应该 revert", async function () {
        const { nft } = await loadFixture(deployWithMintedNFTsFixture);

        await expect(nft.getRarity(1)).to.be.revertedWithCustomError(nft, "NotRevealedYet");
      });

      it("揭示后应该返回正确的稀有度", async function () {
        const { nft } = await loadFixture(deployWithRevealedFixture);

        const rarity = await nft.getRarity(1);
        expect(Number(rarity)).to.be.oneOf([0, 1, 2, 3]);
      });

      it("查询不存在的 token 应该 revert", async function () {
        const { nft } = await loadFixture(deployWithRevealedFixture);

        await expect(nft.getRarity(999)).to.be.revertedWith("Token does not exist");
      });
    });

    describe("tokenURI", function () {
      it("未揭示时应该返回盲盒 metadata", async function () {
        const { nft } = await loadFixture(deployWithMintedNFTsFixture);

        const uri = await nft.tokenURI(1);

        expect(uri).to.include("data:application/json;base64");

        // 解析 base64
        const json = JSON.parse(Buffer.from(uri.split(",")[1], "base64").toString());

        expect(json.name).to.include("Stakable NFT #1");
        expect(json.description).to.include("mysterious blind box");
        expect(json.image).to.equal("ipfs://Qmd2SzbuXHQnc5jcL7c2ohTpNsKcU2NJVwcPr2bG7S1cKk");

        // 应该有 Status = Unrevealed 属性
        const statusAttr = json.attributes.find((attr: any) => attr.trait_type === "Status");
        expect(statusAttr).to.exist;
        expect(statusAttr.value).to.equal("Unrevealed");
      });

      it("揭示后应该返回完整 metadata", async function () {
        const { nft } = await loadFixture(deployWithRevealedFixture);

        const uri = await nft.tokenURI(1);
        const json = JSON.parse(Buffer.from(uri.split(",")[1], "base64").toString());

        expect(json.name).to.include("Stakable NFT #1");
        expect(json.description).to.include("stakable NFT");
        expect(json).to.have.property("image");
        expect(json.image).to.include("ipfs://");

        // 应该有稀有度属性
        const rarityAttr = json.attributes.find((attr: any) => attr.trait_type === "Rarity");
        expect(rarityAttr).to.exist;
        expect(rarityAttr.value).to.be.oneOf(["Common", "Rare", "Epic", "Legendary"]);

        // 应该有奖励倍率属性
        const multiplierAttr = json.attributes.find((attr: any) => attr.trait_type === "Reward Multiplier");
        expect(multiplierAttr).to.exist;

        // 应该有 Status = Revealed 属性
        const statusAttr = json.attributes.find((attr: any) => attr.trait_type === "Status");
        expect(statusAttr).to.exist;
        expect(statusAttr.value).to.equal("Revealed");
      });

      it("查询不存在的 token 应该 revert", async function () {
        const { nft } = await loadFixture(deployWithRevealedFixture);

        await expect(nft.tokenURI(999)).to.be.revertedWith("Token does not exist");
      });

      it("应该正确格式化个位数的小数倍率（如 1.05x）", async function () {
        const { nft, owner, OPERATOR_ROLE } = await loadFixture(deployWithRevealedFixture);

        // 设置一个小数部分为个位数的倍率（例如 10500 = 1.05x）
        await nft.grantRoleTo(OPERATOR_ROLE, owner.address);
        await nft.setRewardMultiplier(0, 10500); // Common: 1.05x

        // 找到一个 Common 稀有度的 token
        let commonTokenId = 0;
        for (let i = 1; i <= 10; i++) {
          const rarity = await nft.getRarity(i);
          if (rarity === 0n) {
            // Common
            commonTokenId = i;
            break;
          }
        }

        expect(commonTokenId).to.be.greaterThan(0);

        const uri = await nft.tokenURI(commonTokenId);
        const json = JSON.parse(Buffer.from(uri.split(",")[1], "base64").toString());

        // 检查 description 和 attributes 中的倍率格式
        expect(json.description).to.include("1.05x");
        const multiplierAttr = json.attributes.find((attr: any) => attr.trait_type === "Reward Multiplier");
        expect(multiplierAttr.value).to.equal("1.05x");
      });

      it("应该正确格式化双位数的小数倍率（如 1.15x）", async function () {
        const { nft, owner, OPERATOR_ROLE } = await loadFixture(deployWithRevealedFixture);

        // 设置一个小数部分为双位数的倍率（例如 11500 = 1.15x）
        await nft.grantRoleTo(OPERATOR_ROLE, owner.address);
        await nft.setRewardMultiplier(1, 11500); // Rare: 1.15x

        // 找到一个 Rare 稀有度的 token
        let rareTokenId = 0;
        for (let i = 1; i <= 10; i++) {
          const rarity = await nft.getRarity(i);
          if (rarity === 1n) {
            // Rare
            rareTokenId = i;
            break;
          }
        }

        expect(rareTokenId).to.be.greaterThan(0);

        const uri = await nft.tokenURI(rareTokenId);
        const json = JSON.parse(Buffer.from(uri.split(",")[1], "base64").toString());

        // 检查 description 和 attributes 中的倍率格式
        expect(json.description).to.include("1.15x");
        const multiplierAttr = json.attributes.find((attr: any) => attr.trait_type === "Reward Multiplier");
        expect(multiplierAttr.value).to.equal("1.15x");
      });
    });

    describe("getTokenRewardMultiplier", function () {
      it("未揭示时应该返回 0", async function () {
        const { nft } = await loadFixture(deployWithMintedNFTsFixture);

        const multiplier = await nft.getTokenRewardMultiplier(1);
        expect(multiplier).to.equal(0);
      });

      it("揭示后应该返回正确的倍率", async function () {
        const { nft } = await loadFixture(deployWithRevealedFixture);

        const multiplier = await nft.getTokenRewardMultiplier(1);
        // 应该是某个稀有度的倍率
        expect(multiplier).to.be.oneOf([10000n, 15000n, 20000n, 30000n]);
      });

      it("查询不存在的 token 应该 revert", async function () {
        const { nft } = await loadFixture(deployWithRevealedFixture);

        await expect(nft.getTokenRewardMultiplier(999)).to.be.revertedWith("Token does not exist");
      });
    });

    describe("其他查询", function () {
      it("应该正确返回稀有度对应的图片", async function () {
        const { nft } = await loadFixture(deployContractFixture);

        expect(await nft.rarityImages(0)).to.include("ipfs://"); // Common
        expect(await nft.rarityImages(1)).to.include("ipfs://"); // Rare
        expect(await nft.rarityImages(2)).to.include("ipfs://"); // Epic
        expect(await nft.rarityImages(3)).to.include("ipfs://"); // Legendary
      });

      it("应该正确返回奖励倍率", async function () {
        const { nft } = await loadFixture(deployContractFixture);

        expect(await nft.rewardMultiplier(0)).to.equal(10000); // Common: 1x
        expect(await nft.rewardMultiplier(1)).to.equal(15000); // Rare: 1.5x
        expect(await nft.rewardMultiplier(2)).to.equal(20000); // Epic: 2x
        expect(await nft.rewardMultiplier(3)).to.equal(30000); // Legendary: 3x
      });
    });
  });

  describe("6. 权限管理", function () {
    describe("角色授予和撤销", function () {
      it("管理员应该可以授予 OPERATOR 角色", async function () {
        const { nft, user1, OPERATOR_ROLE } = await loadFixture(deployContractFixture);

        await nft.grantRoleTo(OPERATOR_ROLE, user1.address);

        const hasRole = await nft.checkRole(OPERATOR_ROLE, user1.address);
        expect(hasRole).to.be.true;
      });

      it("管理员应该可以撤销角色", async function () {
        const { nft, user1, OPERATOR_ROLE } = await loadFixture(deployContractFixture);

        await nft.grantRoleTo(OPERATOR_ROLE, user1.address);
        expect(await nft.checkRole(OPERATOR_ROLE, user1.address)).to.be.true;

        await nft.revokeRoleFrom(OPERATOR_ROLE, user1.address);
        expect(await nft.checkRole(OPERATOR_ROLE, user1.address)).to.be.false;
      });

      it("非管理员不能授予角色", async function () {
        const { nft, user1, user2, OPERATOR_ROLE } = await loadFixture(deployContractFixture);

        await expect(nft.connect(user1).grantRoleTo(OPERATOR_ROLE, user2.address)).to.be.reverted;
      });

      it("非管理员不能撤销角色", async function () {
        const { nft, user1, OPERATOR_ROLE } = await loadFixture(deployContractFixture);

        await nft.grantRoleTo(OPERATOR_ROLE, user1.address);

        await expect(nft.connect(user1).revokeRoleFrom(OPERATOR_ROLE, user1.address)).to.be.reverted;
      });
    });

    describe("setRewardMultiplier", function () {
      it("OPERATOR 应该可以设置单个稀有度的倍率", async function () {
        const { nft, owner, OPERATOR_ROLE } = await loadFixture(deployContractFixture);

        await nft.grantRoleTo(OPERATOR_ROLE, owner.address);

        await nft.setRewardMultiplier(Rarity.Common, 20000); // 2x

        expect(await nft.rewardMultiplier(Rarity.Common)).to.equal(20000);
      });

      it("应该触发 RewardMultiplierUpdated 事件", async function () {
        const { nft, owner, OPERATOR_ROLE } = await loadFixture(deployContractFixture);

        await nft.grantRoleTo(OPERATOR_ROLE, owner.address);

        await expect(nft.setRewardMultiplier(Rarity.Common, 20000))
          .to.emit(nft, "RewardMultiplierUpdated")
          .withArgs(Rarity.Common, 10000, 20000);
      });

      it("非 OPERATOR 不能设置倍率", async function () {
        const { nft, user1 } = await loadFixture(deployContractFixture);

        await expect(nft.connect(user1).setRewardMultiplier(Rarity.Common, 20000)).to.be.reverted;
      });

      it("倍率为 0 时应该拒绝", async function () {
        const { nft, owner, OPERATOR_ROLE } = await loadFixture(deployContractFixture);

        await nft.grantRoleTo(OPERATOR_ROLE, owner.address);

        await expect(nft.setRewardMultiplier(Rarity.Common, 0)).to.be.revertedWith("Multiplier must be greater than 0");
      });

      it("倍率超过最大值时应该拒绝", async function () {
        const { nft, owner, OPERATOR_ROLE } = await loadFixture(deployContractFixture);

        await nft.grantRoleTo(OPERATOR_ROLE, owner.address);

        await expect(nft.setRewardMultiplier(Rarity.Common, 100001)).to.be.revertedWith("Multiplier too high");
      });
    });

    describe("setRewardMultipliers (批量)", function () {
      it("OPERATOR 应该可以批量设置倍率", async function () {
        const { nft, owner, OPERATOR_ROLE } = await loadFixture(deployContractFixture);

        await nft.grantRoleTo(OPERATOR_ROLE, owner.address);

        const newMultipliers: [number, number, number, number] = [12000, 18000, 25000, 35000];
        await nft.setRewardMultipliers(newMultipliers);

        expect(await nft.rewardMultiplier(0)).to.equal(12000);
        expect(await nft.rewardMultiplier(1)).to.equal(18000);
        expect(await nft.rewardMultiplier(2)).to.equal(25000);
        expect(await nft.rewardMultiplier(3)).to.equal(35000);
      });

      it("应该触发多个 RewardMultiplierUpdated 事件", async function () {
        const { nft, owner, OPERATOR_ROLE } = await loadFixture(deployContractFixture);

        await nft.grantRoleTo(OPERATOR_ROLE, owner.address);

        const newMultipliers: [number, number, number, number] = [12000, 18000, 25000, 35000];
        const tx = await nft.setRewardMultipliers(newMultipliers);

        await expect(tx).to.emit(nft, "RewardMultiplierUpdated").withArgs(0, 10000, 12000);
        await expect(tx).to.emit(nft, "RewardMultiplierUpdated").withArgs(1, 15000, 18000);
        await expect(tx).to.emit(nft, "RewardMultiplierUpdated").withArgs(2, 20000, 25000);
        await expect(tx).to.emit(nft, "RewardMultiplierUpdated").withArgs(3, 30000, 35000);
      });

      it("非 OPERATOR 不能批量设置", async function () {
        const { nft, user1 } = await loadFixture(deployContractFixture);

        const newMultipliers: [number, number, number, number] = [12000, 18000, 25000, 35000];
        await expect(nft.connect(user1).setRewardMultipliers(newMultipliers)).to.be.reverted;
      });

      it("批量设置时，倍率为 0 应该拒绝", async function () {
        const { nft, owner, OPERATOR_ROLE } = await loadFixture(deployContractFixture);

        await nft.grantRoleTo(OPERATOR_ROLE, owner.address);

        const invalidMultipliers: [number, number, number, number] = [12000, 0, 25000, 35000];
        await expect(nft.setRewardMultipliers(invalidMultipliers)).to.be.revertedWith(
          "Multiplier must be greater than 0",
        );
      });

      it("批量设置时，倍率超过最大值应该拒绝", async function () {
        const { nft, owner, OPERATOR_ROLE } = await loadFixture(deployContractFixture);

        await nft.grantRoleTo(OPERATOR_ROLE, owner.address);

        const invalidMultipliers: [number, number, number, number] = [12000, 18000, 999999, 35000];
        await expect(nft.setRewardMultipliers(invalidMultipliers)).to.be.revertedWith("Multiplier too high");
      });
    });

    describe("暂停功能", function () {
      it("PAUSER 应该可以暂停合约", async function () {
        const { nft, pauser, PAUSER_ROLE } = await loadFixture(deployContractFixture);

        await nft.grantRoleTo(PAUSER_ROLE, pauser.address);

        await nft.connect(pauser).pause();

        const paused = await nft.paused();
        expect(paused).to.be.true;
      });

      it("PAUSER 应该可以恢复合约", async function () {
        const { nft, pauser, PAUSER_ROLE } = await loadFixture(deployContractFixture);

        await nft.grantRoleTo(PAUSER_ROLE, pauser.address);

        await nft.connect(pauser).pause();
        expect(await nft.paused()).to.be.true;

        await nft.connect(pauser).unpause();
        expect(await nft.paused()).to.be.false;
      });

      it("非 PAUSER 不能暂停", async function () {
        const { nft, user1 } = await loadFixture(deployContractFixture);

        await expect(nft.connect(user1).pause()).to.be.reverted;
      });

      it("非 PAUSER 不能恢复", async function () {
        const { nft, pauser, user1, PAUSER_ROLE } = await loadFixture(deployContractFixture);

        await nft.grantRoleTo(PAUSER_ROLE, pauser.address);
        await nft.connect(pauser).pause();

        await expect(nft.connect(user1).unpause()).to.be.reverted;
      });
    });
  });

  describe("7. 资金管理 (withdraw)", function () {
    it("管理员应该可以提现", async function () {
      const { nft, owner, user1 } = await loadFixture(deployWithRarityPoolFixture);

      // 先铸造一些 NFT
      await nft.connect(user1).mint(5, { value: MINT_PRICE * 5n });

      const contractBalance = await ethers.provider.getBalance(await nft.getAddress());
      expect(contractBalance).to.equal(MINT_PRICE * 5n);

      await expect(nft.withdraw()).to.changeEtherBalances([nft, owner], [-MINT_PRICE * 5n, MINT_PRICE * 5n]);
    });

    it("应该触发 Withdrawn 事件", async function () {
      const { nft, owner, user1 } = await loadFixture(deployWithRarityPoolFixture);

      await nft.connect(user1).mint(5, { value: MINT_PRICE * 5n });

      await expect(nft.withdraw())
        .to.emit(nft, "Withdrawn")
        .withArgs(owner.address, MINT_PRICE * 5n);
    });

    it("非管理员不能提现", async function () {
      const { nft, user1, user2 } = await loadFixture(deployWithRarityPoolFixture);

      await nft.connect(user1).mint(5, { value: MINT_PRICE * 5n });

      await expect(nft.connect(user2).withdraw()).to.be.reverted;
    });

    it("余额为 0 时应该拒绝", async function () {
      const { nft } = await loadFixture(deployContractFixture);

      await expect(nft.withdraw()).to.be.revertedWith("No balance to withdraw");
    });

    it("应该能提现所有 mint 收入", async function () {
      const { nft, owner, user1, user2 } = await loadFixture(deployWithRarityPoolFixture);

      // 多个用户铸造
      await nft.connect(user1).mint(10, { value: MINT_PRICE * 10n });
      await nft.connect(user2).mint(5, { value: MINT_PRICE * 5n });

      const expectedBalance = MINT_PRICE * 15n;
      const contractBalance = await ethers.provider.getBalance(await nft.getAddress());
      expect(contractBalance).to.equal(expectedBalance);

      await expect(nft.withdraw()).to.changeEtherBalance(owner, expectedBalance);
    });

    it("提现后合约余额应该为 0", async function () {
      const { nft, user1 } = await loadFixture(deployWithRarityPoolFixture);

      await nft.connect(user1).mint(5, { value: MINT_PRICE * 5n });
      await nft.withdraw();

      const balance = await ethers.provider.getBalance(await nft.getAddress());
      expect(balance).to.equal(0);
    });

    it("转账失败时应该 revert", async function () {
      const { nft, user1, DEFAULT_ADMIN_ROLE } = await loadFixture(deployWithRarityPoolFixture);

      // 部署 RejectEther 合约
      const RejectEther = await ethers.getContractFactory("RejectEther");
      const rejectEther = await RejectEther.deploy();
      await rejectEther.waitForDeployment();

      // 授予 RejectEther 合约管理员权限
      await nft.grantRoleTo(DEFAULT_ADMIN_ROLE, await rejectEther.getAddress());

      // 先铸造一些 NFT
      await nft.connect(user1).mint(5, { value: MINT_PRICE * 5n });

      // RejectEther 合约尝试提现，应该失败
      await expect(rejectEther.callWithdraw(await nft.getAddress())).to.be.revertedWith("Withdraw failed");
    });
  });
});
