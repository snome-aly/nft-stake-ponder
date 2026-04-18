# Hardhat Fixture 详解

Fixture 是 Hardhat 测试中的一个强大功能,用于创建可复用的测试环境设置。

---

## 📚 目录

1. [什么是 Fixture](#什么是-fixture)
2. [为什么需要 Fixture](#为什么需要-fixture)
3. [Fixture 的工作原理](#fixture-的工作原理)
4. [基础 Fixture 实现](#基础-fixture-实现)
5. [进阶 Fixture 模式](#进阶-fixture-模式)
6. [Fixture 最佳实践](#fixture-最佳实践)
7. [常见问题](#常见问题)

---

## 1. 什么是 Fixture

Fixture 是一个**异步函数**,用于设置测试环境的初始状态。它通常包括:

- 部署合约
- 创建测试账户
- 设置初始状态
- 返回测试所需的对象

```typescript
async function deployContractFixture() {
  // 1. 准备测试账户
  const [owner, user1, user2] = await ethers.getSigners();

  // 2. 部署合约
  const Contract = await ethers.getContractFactory("MyContract");
  const contract = await Contract.deploy();

  // 3. 返回测试所需的对象
  return { contract, owner, user1, user2 };
}
```

---

## 2. 为什么需要 Fixture

### ❌ 没有 Fixture 的问题

```typescript
describe("MyContract", function () {
  it("测试 1", async function () {
    // 每个测试都要重复部署
    const [owner, user1] = await ethers.getSigners();
    const Contract = await ethers.getContractFactory("MyContract");
    const contract = await Contract.deploy();

    // 测试逻辑...
  });

  it("测试 2", async function () {
    // 又要重复一遍
    const [owner, user1] = await ethers.getSigners();
    const Contract = await ethers.getContractFactory("MyContract");
    const contract = await Contract.deploy();

    // 测试逻辑...
  });
});
```

**问题:**
- 🐌 **慢** - 每个测试都要重新部署
- 📝 **重复代码** - 同样的设置代码写多次
- 🐛 **容易出错** - 设置不一致

### ✅ 使用 Fixture 的优势

```typescript
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("MyContract", function () {
  async function deployContractFixture() {
    const [owner, user1] = await ethers.getSigners();
    const Contract = await ethers.getContractFactory("MyContract");
    const contract = await Contract.deploy();
    return { contract, owner, user1 };
  }

  it("测试 1", async function () {
    const { contract, owner } = await loadFixture(deployContractFixture);
    // 测试逻辑...
  });

  it("测试 2", async function () {
    const { contract, user1 } = await loadFixture(deployContractFixture);
    // 测试逻辑...
  });
});
```

**优势:**
- ⚡ **快** - 使用快照机制,只部署一次
- 🎯 **清晰** - 设置代码集中管理
- 🔒 **隔离** - 每个测试都有独立的状态

---

## 3. Fixture 的工作原理

### 🔄 快照机制

`loadFixture` 使用 **EVM 快照** 实现高性能:

```
第一次调用 loadFixture:
  1. 执行 fixture 函数
  2. 部署合约,设置状态
  3. 创建 EVM 快照 📸
  4. 返回结果

第二次调用 loadFixture:
  1. 恢复快照 ⏪ (极快!)
  2. 返回结果

第三次调用...
  1. 再次恢复快照 ⏪
  2. 返回结果
```

**性能对比:**
- 首次部署: ~100-500ms
- 恢复快照: ~1-10ms (快 **10-100 倍**!)

### 🔬 示例代码

```typescript
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

async function deployFixture() {
  console.log("部署合约...");
  const contract = await deployContract();
  return { contract };
}

it("测试 1", async function () {
  console.log("测试 1 开始");
  const { contract } = await loadFixture(deployFixture);
  // 输出: "部署合约..."
  // 输出: "测试 1 开始"
});

it("测试 2", async function () {
  console.log("测试 2 开始");
  const { contract } = await loadFixture(deployFixture);
  // 输出: "测试 2 开始"
  // 注意: 不会输出 "部署合约..."，因为使用了快照!
});
```

---

## 4. 基础 Fixture 实现

### 📦 最简单的 Fixture

```typescript
async function deployContractFixture() {
  // 1. 获取测试账户
  const [owner] = await ethers.getSigners();

  // 2. 部署合约
  const Contract = await ethers.getContractFactory("MyContract");
  const contract = await Contract.deploy();

  // 3. 返回对象
  return { contract, owner };
}

// 使用
it("测试", async function () {
  const { contract, owner } = await loadFixture(deployContractFixture);
  expect(await contract.owner()).to.equal(owner.address);
});
```

### 📦 StakableNFT 的 Fixture

让我详细解释你的 `deployContractFixture`:

```typescript
async function deployContractFixture() {
  // ============ 步骤 1: 获取测试账户 ============
  // ethers.getSigners() 返回 Hardhat 提供的测试账户
  // 这些账户在本地测试网络中预先充值了 10,000 ETH
  const [owner, user1, user2, operator, pauser] = await ethers.getSigners();

  // owner:    通常是合约部署者,拥有管理员权限
  // user1/2:  普通用户,用于测试用户操作
  // operator: 用于测试 OPERATOR_ROLE 权限
  // pauser:   用于测试 PAUSER_ROLE 权限

  // ============ 步骤 2: 部署合约 ============
  // getContractFactory: 获取合约工厂(用于部署合约)
  const StakableNFT = await ethers.getContractFactory("StakableNFT");

  // deploy(): 部署合约到测试网络
  // 这会自动调用合约的 constructor()
  const nft = await StakableNFT.deploy();

  // 注意: deploy() 返回后,合约已经部署完成,可以直接调用

  // ============ 步骤 3: 获取角色常量 ============
  // 从合约中读取角色常量,用于后续的权限测试
  const OPERATOR_ROLE = await nft.OPERATOR_ROLE();
  const PAUSER_ROLE = await nft.PAUSER_ROLE();
  const DEFAULT_ADMIN_ROLE = await nft.DEFAULT_ADMIN_ROLE();

  // ============ 步骤 4: 返回测试所需的对象 ============
  return {
    nft,                    // 合约实例
    owner,                  // 部署者账户
    user1,                  // 用户 1
    user2,                  // 用户 2
    operator,               // 操作员账户
    pauser,                 // 暂停员账户
    OPERATOR_ROLE,          // OPERATOR 角色 ID
    PAUSER_ROLE,            // PAUSER 角色 ID
    DEFAULT_ADMIN_ROLE,     // ADMIN 角色 ID
  };
}
```

### 🎯 使用示例

```typescript
it("应该正确部署合约", async function () {
  // 解构获取需要的对象
  const { nft, owner } = await loadFixture(deployContractFixture);

  // 使用合约实例
  expect(await nft.totalMinted()).to.equal(0);

  // 使用账户
  console.log("部署者地址:", owner.address);
});

it("应该正确分配角色", async function () {
  // 可以只取需要的对象
  const { nft, owner, DEFAULT_ADMIN_ROLE } = await loadFixture(deployContractFixture);

  // 验证角色
  expect(await nft.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
});
```

---

## 5. 进阶 Fixture 模式

### 🔗 Fixture 组合

Fixture 可以调用其他 fixture,实现状态的层层构建:

```typescript
// ============ 基础 Fixture ============
async function deployContractFixture() {
  const [owner, user1] = await ethers.getSigners();
  const nft = await deployContract();
  const OPERATOR_ROLE = await nft.OPERATOR_ROLE();
  return { nft, owner, user1, OPERATOR_ROLE };
}

// ============ 扩展 Fixture 1: 已设置稀有度池 ============
async function deployWithRarityPoolFixture() {
  // 1. 调用基础 fixture
  const base = await deployContractFixture();
  const { nft, owner, OPERATOR_ROLE } = base;

  // 2. 添加额外设置
  await nft.grantRoleTo(OPERATOR_ROLE, owner.address);
  const rarities = generateShuffledRarities();
  await nft.setRarityPool(rarities);

  // 3. 返回基础对象 + 新增对象
  return { ...base, rarities };
}

// ============ 扩展 Fixture 2: 已铸造 NFT ============
async function deployWithMintedFixture() {
  // 1. 调用上一层 fixture
  const base = await deployWithRarityPoolFixture();
  const { nft, user1 } = base;

  // 2. 添加铸造操作
  const MINT_PRICE = await nft.MINT_PRICE();
  await nft.connect(user1).mint(5, { value: MINT_PRICE * 5n });

  // 3. 返回所有对象
  return { ...base };
}

// ============ 扩展 Fixture 3: 已揭示 ============
async function deployWithRevealedFixture() {
  const base = await deployWithRarityPoolFixture();
  const { nft, user1, user2, owner } = base;

  // 铸造所有 NFT
  const MINT_PRICE = await nft.MINT_PRICE();
  await nft.connect(user1).mint(20, { value: MINT_PRICE * 20n });
  await nft.connect(user2).mint(20, { value: MINT_PRICE * 20n });
  await nft.connect(owner).mint(60, { value: MINT_PRICE * 60n });

  // 揭示
  await nft.reveal();

  return { ...base };
}
```

**Fixture 层级:**
```
deployContractFixture           (基础: 只部署合约)
    ↓
deployWithRarityPoolFixture     (增加: 设置稀有度池)
    ↓
deployWithMintedFixture         (增加: 铸造部分 NFT)
    ↓
deployWithRevealedFixture       (增加: 铸造全部并揭示)
```

### 🎯 根据测试需求选择合适的 Fixture

```typescript
describe("稀有度池设置", function () {
  // 只需要基础合约
  it("应该允许设置稀有度池", async function () {
    const { nft } = await loadFixture(deployContractFixture);
    // ...
  });
});

describe("铸造功能", function () {
  // 需要已设置稀有度池的合约
  it("应该允许铸造 NFT", async function () {
    const { nft, user1 } = await loadFixture(deployWithRarityPoolFixture);
    // ...
  });
});

describe("揭示功能", function () {
  // 需要已铸造完成的合约
  it("应该正确揭示稀有度", async function () {
    const { nft } = await loadFixture(deployWithMintedFixture);
    // ...
  });
});

describe("查询功能", function () {
  // 需要已揭示的合约
  it("应该返回正确的稀有度", async function () {
    const { nft } = await loadFixture(deployWithRevealedFixture);
    // ...
  });
});
```

---

## 6. Fixture 最佳实践

### ✅ 1. 每个 Fixture 只做一件事

```typescript
// ❌ 不好: 一个 fixture 做太多事
async function deployEverythingFixture() {
  const nft = await deploy();
  await nft.setRarityPool(rarities);
  await nft.mint(100);
  await nft.reveal();
  return { nft };
}

// ✅ 好: 多个 fixture,按需组合
async function deployFixture() { /* 只部署 */ }
async function deployWithPoolFixture() { /* 部署 + 设置池 */ }
async function deployWithMintedFixture() { /* 部署 + 设置池 + 铸造 */ }
```

### ✅ 2. 返回所有可能需要的对象

```typescript
// ❌ 不好: 返回太少
async function deployFixture() {
  const [owner] = await ethers.getSigners();
  const nft = await deploy();
  return { nft }; // 缺少 owner!
}

// ✅ 好: 返回完整信息
async function deployFixture() {
  const [owner, user1, user2] = await ethers.getSigners();
  const nft = await deploy();
  const ROLE = await nft.OPERATOR_ROLE();
  return { nft, owner, user1, user2, ROLE };
}
```

### ✅ 3. 使用有意义的命名

```typescript
// ❌ 不好
async function fixture1() { }
async function fixture2() { }

// ✅ 好
async function deployContractFixture() { }
async function deployWithRarityPoolFixture() { }
async function deployWithRevealedFixture() { }
```

### ✅ 4. 在 describe 外部定义 Fixture

```typescript
// ✅ 好: 可以在所有测试中复用
async function deployFixture() {
  // ...
}

describe("测试组 1", function () {
  it("测试 1", async function () {
    const { nft } = await loadFixture(deployFixture);
  });
});

describe("测试组 2", function () {
  it("测试 2", async function () {
    const { nft } = await loadFixture(deployFixture);
  });
});
```

### ✅ 5. 不要在 Fixture 中做断言

```typescript
// ❌ 不好: fixture 中不应该有断言
async function deployFixture() {
  const nft = await deploy();
  expect(await nft.totalMinted()).to.equal(0); // ❌
  return { nft };
}

// ✅ 好: 断言放在测试中
async function deployFixture() {
  const nft = await deploy();
  return { nft };
}

it("测试", async function () {
  const { nft } = await loadFixture(deployFixture);
  expect(await nft.totalMinted()).to.equal(0); // ✅
});
```

### ✅ 6. 使用 TypeScript 类型

```typescript
// ✅ 定义返回类型
interface DeployFixtureResult {
  nft: StakableNFT;
  owner: SignerWithAddress;
  user1: SignerWithAddress;
  OPERATOR_ROLE: string;
}

async function deployFixture(): Promise<DeployFixtureResult> {
  // ...
  return { nft, owner, user1, OPERATOR_ROLE };
}

// 使用时有类型提示
it("测试", async function () {
  const { nft, owner } = await loadFixture(deployFixture);
  // nft 和 owner 都有类型提示!
});
```

---

## 7. 常见问题

### ❓ Q1: 为什么要用 loadFixture 而不是直接调用函数?

```typescript
// ❌ 直接调用 - 每次都重新部署 (慢!)
it("测试 1", async function () {
  const { nft } = await deployFixture();
});

it("测试 2", async function () {
  const { nft } = await deployFixture();
});

// ✅ 使用 loadFixture - 使用快照 (快!)
it("测试 1", async function () {
  const { nft } = await loadFixture(deployFixture);
});

it("测试 2", async function () {
  const { nft } = await loadFixture(deployFixture);
});
```

**答案:** `loadFixture` 使用 EVM 快照机制,第一次执行后会创建快照,后续调用直接恢复快照,速度快 **10-100 倍**!

### ❓ Q2: Fixture 之间会互相影响吗?

```typescript
it("测试 1", async function () {
  const { nft } = await loadFixture(deployFixture);
  await nft.mint(1); // 铸造 1 个
  expect(await nft.totalMinted()).to.equal(1);
});

it("测试 2", async function () {
  const { nft } = await loadFixture(deployFixture);
  // 测试 1 的铸造会影响这里吗?
  expect(await nft.totalMinted()).to.equal(0); // ✅ 不会! 仍然是 0
});
```

**答案:** 不会! 每次 `loadFixture` 都会恢复到 fixture 函数执行完后的状态。测试之间完全隔离。

### ❓ Q3: 可以在 Fixture 中调用其他 Fixture 吗?

```typescript
async function baseFixture() {
  const nft = await deploy();
  return { nft };
}

async function extendedFixture() {
  const base = await baseFixture(); // ❌ 不要这样!
  const { nft } = base;
  await nft.setup();
  return { ...base };
}
```

**答案:** 理论上可以,但**不推荐**直接调用。因为嵌套调用不会使用快照优化。

**推荐做法:**
```typescript
async function extendedFixture() {
  // 重新实现部署逻辑 (会被快照优化)
  const nft = await deploy();
  await nft.setup();
  return { nft };
}
```

或者使用 `loadFixture`:
```typescript
async function extendedFixture() {
  const base = await loadFixture(baseFixture); // ✅ 使用 loadFixture
  const { nft } = base;
  await nft.setup();
  return { ...base };
}
```

### ❓ Q4: Fixture 可以接受参数吗?

```typescript
// ❌ 不能直接传参
async function deployFixture(count: number) {
  const nft = await deploy();
  await nft.mint(count);
  return { nft };
}

// ❌ loadFixture 不支持传参
const { nft } = await loadFixture(() => deployFixture(5));
```

**答案:** `loadFixture` 不支持参数化的 fixture。

**解决方案:** 创建多个 fixture,或在测试中执行额外操作:
```typescript
// 方案 1: 多个 fixture
async function deployWithFiveFixture() {
  const nft = await deploy();
  await nft.mint(5);
  return { nft };
}

async function deployWithTenFixture() {
  const nft = await deploy();
  await nft.mint(10);
  return { nft };
}

// 方案 2: 在测试中处理
it("测试", async function () {
  const { nft } = await loadFixture(deployFixture);
  await nft.mint(5); // 在测试中铸造
});
```

### ❓ Q5: 什么时候不应该使用 Fixture?

**不需要 Fixture 的情况:**
1. 测试非常简单,只有 1-2 个
2. 每个测试需要完全不同的设置
3. 测试之间有依赖关系 (应该避免这种情况!)

```typescript
// 示例: 只有一个简单测试
describe("工具函数", function () {
  it("应该正确计算", function () {
    expect(calculateSum(1, 2)).to.equal(3);
    // 不需要 fixture
  });
});
```

---

## 🎯 总结

### Fixture 的核心要点:

1. **目的:** 创建可复用的测试环境设置
2. **原理:** 使用 EVM 快照实现高性能
3. **用法:** `await loadFixture(fixtureFunction)`
4. **优势:** 快速、清晰、隔离
5. **模式:** 可以层层组合,构建不同状态的环境

### Fixture 实现模板:

```typescript
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

async function deployContractFixture() {
  // 1. 获取测试账户
  const [owner, user1, user2] = await ethers.getSigners();

  // 2. 部署合约
  const Contract = await ethers.getContractFactory("MyContract");
  const contract = await Contract.deploy(/* constructor args */);

  // 3. 获取常量/角色等
  const ROLE = await contract.SOME_ROLE();

  // 4. 可选: 执行初始化操作
  await contract.initialize();

  // 5. 返回所有需要的对象
  return {
    contract,
    owner,
    user1,
    user2,
    ROLE,
  };
}

// 使用
it("测试", async function () {
  const { contract, owner } = await loadFixture(deployContractFixture);
  // 测试逻辑...
});
```

---

## 📚 参考资源

- [Hardhat Network Helpers 文档](https://hardhat.org/hardhat-network-helpers/docs/reference#fixtures)
- [Hardhat 测试最佳实践](https://hardhat.org/hardhat-runner/docs/guides/test-contracts)
- [loadFixture API](https://hardhat.org/hardhat-network-helpers/docs/reference#loadfixture)
