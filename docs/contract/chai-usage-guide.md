# Chai 断言库使用指南

Chai 是一个用于 Node.js 和浏览器的 BDD/TDD 断言库,常用于智能合约测试。

---

## 📚 目录

1. [基础断言](#基础断言)
2. [相等性断言](#相等性断言)
3. [布尔值断言](#布尔值断言)
4. [数值比较](#数值比较)
5. [字符串断言](#字符串断言)
6. [数组和对象](#数组和对象)
7. [异常和错误](#异常和错误)
8. [智能合约专用](#智能合约专用)
9. [链式断言](#链式断言)
10. [常见模式](#常见模式)

---

## 1. 基础断言

### ✅ exist / not.exist

检查值是否存在(不为 null 或 undefined)。

```typescript
expect(value).to.exist;           // value 不是 null 或 undefined
expect(value).to.not.exist;       // value 是 null 或 undefined

// 示例
const nft = await deployContract();
expect(nft).to.exist;             // 合约部署成功
```

### ✅ equal / not.equal

严格相等比较 (===)。

```typescript
expect(value).to.equal(expected);
expect(value).to.not.equal(unexpected);

// 示例
expect(await nft.totalMinted()).to.equal(5);
expect(await nft.name()).to.equal("Stakable NFT");
```

---

## 2. 相等性断言

### ✅ deep.equal

深度比较对象或数组。

```typescript
expect(obj1).to.deep.equal(obj2);

// 示例
const result = { name: "NFT", id: 1 };
expect(result).to.deep.equal({ name: "NFT", id: 1 });
```

### ✅ eql

`deep.equal` 的别名。

```typescript
expect([1, 2, 3]).to.eql([1, 2, 3]);
```

---

## 3. 布尔值断言

### ✅ true / false

```typescript
expect(value).to.be.true;         // value === true
expect(value).to.be.false;        // value === false

// 示例
expect(await nft.isRevealed()).to.be.true;
expect(await nft.rarityPoolSet()).to.be.false;
```

### ✅ ok

Truthy 值检查。

```typescript
expect(value).to.be.ok;           // value 是 truthy (不是 0, "", false, null, undefined, NaN)
expect(value).to.not.be.ok;       // value 是 falsy

// 示例
expect(await nft.totalMinted()).to.be.ok;  // totalMinted > 0
```

---

## 4. 数值比较

### ✅ above / below / least / most

```typescript
expect(value).to.be.above(min);           // value > min
expect(value).to.be.at.least(min);        // value >= min
expect(value).to.be.below(max);           // value < max
expect(value).to.be.at.most(max);         // value <= max

// 示例
const balance = await ethers.provider.getBalance(user.address);
expect(balance).to.be.above(ethers.parseEther("1"));    // > 1 ETH
expect(balance).to.be.at.least(ethers.parseEther("1")); // >= 1 ETH
```

### ✅ within

在范围内。

```typescript
expect(value).to.be.within(min, max);     // min <= value <= max

// 示例
const randomOffset = await nft.revealOffset();
expect(randomOffset).to.be.within(0, 99); // 0 到 99 之间
```

### ✅ closeTo

接近某个值(带误差)。

```typescript
expect(value).to.be.closeTo(expected, delta);

// 示例
const gasUsed = receipt.gasUsed;
expect(gasUsed).to.be.closeTo(200000n, 10000n); // 在 190000-210000 之间
```

---

## 5. 字符串断言

### ✅ include / contain

包含子字符串。

```typescript
expect(string).to.include(substring);
expect(string).to.contain(substring);     // 别名

// 示例
const uri = await nft.tokenURI(1);
expect(uri).to.include("data:application/json");
expect(uri).to.contain("Stakable NFT");
```

### ✅ match

正则表达式匹配。

```typescript
expect(string).to.match(/regex/);

// 示例
expect(address).to.match(/^0x[a-fA-F0-9]{40}$/); // 以太坊地址格式
```

### ✅ lengthOf

字符串长度。

```typescript
expect(string).to.have.lengthOf(length);

// 示例
expect(await nft.symbol()).to.have.lengthOf(4); // "SNFT"
```

---

## 6. 数组和对象

### ✅ lengthOf

数组长度。

```typescript
expect(array).to.have.lengthOf(length);

// 示例
const tokens = await nft.tokensOfOwner(user.address);
expect(tokens).to.have.lengthOf(5);
```

### ✅ include / contain

数组包含元素。

```typescript
expect(array).to.include(item);
expect(array).to.include.members([item1, item2]);

// 示例
const rarities = [0, 1, 2, 3]; // Common, Rare, Epic, Legendary
expect(rarities).to.include(1);
expect(rarities).to.include.members([0, 1]);
```

### ✅ property

对象包含属性。

```typescript
expect(obj).to.have.property("key");
expect(obj).to.have.property("key", value);

// 示例
const event = receipt.logs[0];
expect(event).to.have.property("eventName", "NFTMinted");
```

### ✅ keys

对象包含指定的键。

```typescript
expect(obj).to.have.keys(["key1", "key2"]);
expect(obj).to.have.all.keys(["key1", "key2"]);  // 必须完全匹配
expect(obj).to.have.any.keys(["key1", "key2"]);  // 至少有一个

// 示例
const config = { maxSupply: 100, mintPrice: "1" };
expect(config).to.have.keys(["maxSupply", "mintPrice"]);
```

### ✅ oneOf

值是数组中的一个。

```typescript
expect(value).to.be.oneOf([val1, val2, val3]);

// 示例
const rarity = await nft.getRarity(1);
expect(rarity).to.be.oneOf([0, 1, 2, 3]); // Common, Rare, Epic, Legendary
```

---

## 7. 异常和错误

### ✅ throw / revert

检查函数是否抛出错误。

```typescript
expect(() => func()).to.throw();
expect(() => func()).to.throw(Error);
expect(() => func()).to.throw("error message");

// 示例 (同步函数)
expect(() => JSON.parse("invalid")).to.throw();
```

### ✅ async/await 版本

对于异步函数,使用 chai-as-promised 或 hardhat-chai-matchers。

```typescript
// ❌ 错误写法
expect(async () => await nft.mint(0)).to.throw();

// ✅ 正确写法 (使用 hardhat-chai-matchers)
await expect(nft.mint(0, { value: 0 })).to.be.reverted;
```

---

## 8. 智能合约专用

这些断言来自 `@nomicfoundation/hardhat-chai-matchers`。

### ✅ reverted

交易被 revert。

```typescript
await expect(nft.mint(0)).to.be.reverted;

// 示例
await expect(
  nft.connect(user).setRarityPool(rarities)
).to.be.reverted;
```

### ✅ revertedWith

带有指定错误消息的 revert。

```typescript
await expect(tx).to.be.revertedWith("error message");

// 示例
await expect(
  nft.mint(0, { value: 0 })
).to.be.revertedWith("Quantity must be greater than 0");
```

### ✅ revertedWithCustomError

自定义错误 revert。

```typescript
await expect(tx).to.be.revertedWithCustomError(contract, "ErrorName");

// 示例
await expect(
  nft.getRarity(1)
).to.be.revertedWithCustomError(nft, "NotRevealedYet");
```

### ✅ revertedWithPanic

Panic 错误 (如数组越界、除零)。

```typescript
await expect(tx).to.be.revertedWithPanic(0x11); // 算术溢出
await expect(tx).to.be.revertedWithPanic(0x12); // 除零
await expect(tx).to.be.revertedWithPanic(0x32); // 数组越界
```

### ✅ emit

事件触发。

```typescript
await expect(tx).to.emit(contract, "EventName");
await expect(tx).to.emit(contract, "EventName").withArgs(arg1, arg2);

// 示例
await expect(nft.mint(1, { value: MINT_PRICE }))
  .to.emit(nft, "NFTMinted")
  .withArgs(owner.address, 1, 1);

// 多个事件
await expect(tx)
  .to.emit(contract, "Event1")
  .to.emit(contract, "Event2");
```

### ✅ not.emit

不触发事件。

```typescript
await expect(tx).to.not.emit(contract, "EventName");
```

### ✅ changeEtherBalance / changeEtherBalances

ETH 余额变化。

```typescript
// 单个地址
await expect(tx).to.changeEtherBalance(account, delta);

// 多个地址
await expect(tx).to.changeEtherBalances([account1, account2], [delta1, delta2]);

// 示例
await expect(
  nft.mint(1, { value: MINT_PRICE })
).to.changeEtherBalances(
  [user, nft],
  [-MINT_PRICE, MINT_PRICE]
);
```

### ✅ changeTokenBalance / changeTokenBalances

ERC20 代币余额变化。

```typescript
await expect(tx).to.changeTokenBalance(token, account, delta);
await expect(tx).to.changeTokenBalances(token, [acc1, acc2], [delta1, delta2]);

// 示例
await expect(
  token.transfer(recipient, amount)
).to.changeTokenBalance(token, recipient, amount);
```

### ✅ properAddress

有效的以太坊地址。

```typescript
expect(address).to.be.properAddress;

// 示例
const contractAddress = await nft.getAddress();
expect(contractAddress).to.be.properAddress;
```

### ✅ properPrivateKey

有效的私钥。

```typescript
expect(privateKey).to.be.properPrivateKey;
```

### ✅ properHex

有效的十六进制字符串。

```typescript
expect(hex).to.be.properHex(length);

// 示例
expect(txHash).to.be.properHex(64); // 交易哈希 32 字节 = 64 个十六进制字符
```

---

## 9. 链式断言

Chai 支持链式语法,使断言更易读。

### ✅ 连接词

这些词不影响断言,只是让语句更自然:

- `to`
- `be`
- `been`
- `is`
- `that`
- `which`
- `and`
- `has`
- `have`
- `with`
- `at`
- `of`
- `same`
- `but`
- `does`

```typescript
// 这些是等价的
expect(value).to.equal(5);
expect(value).to.be.equal(5);
expect(value).is.equal(5);

// 链式断言
expect(array)
  .to.be.an("array")
  .that.has.lengthOf(5)
  .and.includes(1);

// 示例
expect(await nft.totalMinted())
  .to.be.a("bigint")
  .and.to.equal(100n);
```

### ✅ not

否定断言。

```typescript
expect(value).to.not.equal(5);
expect(value).to.not.be.null;

// 示例
expect(await nft.isRevealed()).to.not.be.true;
```

---

## 10. 常见模式

### 🔹 测试结构 (AAA 模式)

```typescript
it("应该正确铸造 NFT", async function () {
  // Arrange (准备)
  const { nft, user } = await loadFixture(deployFixture);
  await nft.setRarityPool(rarities);

  // Act (执行)
  await nft.connect(user).mint(1, { value: MINT_PRICE });

  // Assert (断言)
  expect(await nft.balanceOf(user.address)).to.equal(1);
  expect(await nft.totalMinted()).to.equal(1);
});
```

### 🔹 测试多个条件

```typescript
it("应该正确初始化合约", async function () {
  const { nft } = await loadFixture(deployFixture);

  // 多个独立断言
  expect(await nft.totalMinted()).to.equal(0);
  expect(await nft.isRevealed()).to.be.false;
  expect(await nft.MAX_SUPPLY()).to.equal(100);
});
```

### 🔹 测试事件和状态变化

```typescript
it("mint 应该触发事件并更新状态", async function () {
  const { nft, user } = await loadFixture(deployFixture);
  await nft.setRarityPool(rarities);

  // 测试事件
  await expect(nft.connect(user).mint(3, { value: MINT_PRICE * 3n }))
    .to.emit(nft, "NFTMinted")
    .withArgs(user.address, 1, 3);

  // 测试状态
  expect(await nft.balanceOf(user.address)).to.equal(3);
  expect(await nft.totalMinted()).to.equal(3);
  expect(await nft.mintedCount(user.address)).to.equal(3);
});
```

### 🔹 测试错误情况

```typescript
it("应该拒绝无效的铸造", async function () {
  const { nft, user } = await loadFixture(deployFixture);
  await nft.setRarityPool(rarities);

  // 数量为 0
  await expect(
    nft.connect(user).mint(0, { value: 0 })
  ).to.be.revertedWith("Quantity must be greater than 0");

  // 支付不足
  await expect(
    nft.connect(user).mint(1, { value: ethers.parseEther("0.5") })
  ).to.be.revertedWith("Incorrect payment amount");

  // 超过供应量
  await nft.connect(user).mint(100, { value: MINT_PRICE * 100n });
  await expect(
    nft.connect(user).mint(1, { value: MINT_PRICE })
  ).to.be.revertedWith("Exceeds max supply");
});
```

### 🔹 测试权限控制

```typescript
it("应该只允许 OPERATOR 设置稀有度池", async function () {
  const { nft, owner, user, OPERATOR_ROLE } = await loadFixture(deployFixture);

  const rarities = generateRarities();

  // 非 OPERATOR 拒绝
  await expect(
    nft.connect(user).setRarityPool(rarities)
  ).to.be.reverted;

  // 授予角色
  await nft.grantRoleTo(OPERATOR_ROLE, owner.address);

  // OPERATOR 成功
  await expect(
    nft.setRarityPool(rarities)
  ).to.not.be.reverted;

  expect(await nft.rarityPoolSet()).to.be.true;
});
```

### 🔹 测试 ETH 转账

```typescript
it("应该正确处理 ETH 支付", async function () {
  const { nft, user } = await loadFixture(deployWithRarityPoolFixture);

  const mintPrice = await nft.MINT_PRICE();

  await expect(
    nft.connect(user).mint(2, { value: mintPrice * 2n })
  ).to.changeEtherBalances(
    [user, nft],
    [-mintPrice * 2n, mintPrice * 2n]
  );
});
```

### 🔹 测试随机性和范围

```typescript
it("随机偏移应该在有效范围内", async function () {
  const { nft } = await loadFixture(deployWithAllMintedFixture);

  await nft.reveal();

  const offset = await nft.revealOffset();
  expect(offset).to.be.within(0, 99);
});
```

### 🔹 测试数组和批量操作

```typescript
it("应该正确分配所有稀有度", async function () {
  const { nft } = await loadFixture(deployWithRevealedFixture);

  // 统计各稀有度数量
  const counts = { 0: 0, 1: 0, 2: 0, 3: 0 };

  for (let tokenId = 1; tokenId <= 100; tokenId++) {
    const rarity = await nft.getRarity(tokenId);
    counts[rarity]++;
  }

  // 验证分布
  expect(counts[0]).to.equal(50);  // Common
  expect(counts[1]).to.equal(30);  // Rare
  expect(counts[2]).to.equal(15);  // Epic
  expect(counts[3]).to.equal(5);   // Legendary
});
```

---

## 📝 快速参考表

| 断言 | 说明 | 示例 |
|------|------|------|
| `equal` | 严格相等 | `expect(a).to.equal(b)` |
| `deep.equal` | 深度相等 | `expect(obj1).to.deep.equal(obj2)` |
| `true/false` | 布尔值 | `expect(flag).to.be.true` |
| `above/below` | 数值比较 | `expect(num).to.be.above(10)` |
| `include` | 包含 | `expect(str).to.include("test")` |
| `lengthOf` | 长度 | `expect(arr).to.have.lengthOf(5)` |
| `property` | 对象属性 | `expect(obj).to.have.property("key")` |
| `reverted` | 交易 revert | `await expect(tx).to.be.reverted` |
| `revertedWith` | 带消息 revert | `await expect(tx).to.be.revertedWith("msg")` |
| `emit` | 事件触发 | `await expect(tx).to.emit(contract, "Event")` |
| `changeEtherBalance` | ETH 余额变化 | `await expect(tx).to.changeEtherBalance(acc, delta)` |

---

## 🎯 最佳实践

1. **每个测试只测一件事** - 让测试失败时容易定位问题
2. **使用描述性的测试名称** - 说明测试的目的和预期结果
3. **遵循 AAA 模式** - Arrange, Act, Assert
4. **测试正常和异常情况** - 包括边界条件和错误处理
5. **使用 fixtures** - 避免重复的设置代码
6. **测试事件** - 验证重要操作触发了正确的事件
7. **独立的测试** - 测试之间不应该有依赖关系

---

## 📚 参考资源

- [Chai 官方文档](https://www.chaijs.com/)
- [Hardhat Chai Matchers](https://hardhat.org/hardhat-chai-matchers/docs/overview)
- [Chai BDD API](https://www.chaijs.com/api/bdd/)
- [Chai Assertions](https://www.chaijs.com/guide/styles/#assert)

---

## 💡 提示

- 在 VSCode 中,Chai 的断言会有智能提示
- 使用 `.not` 可以否定任何断言
- 链式调用让断言更易读,但不影响功能
- 对于异步函数,记得使用 `await expect(...)`
- 智能合约测试应该优先使用 `hardhat-chai-matchers` 提供的专用断言
