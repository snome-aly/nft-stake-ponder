# 如何验证 Chainlink VRF 随机数可靠性

## 方法 1: 使用 Etherscan 查看事件日志

### 步骤：

1. **找到你的合约地址**
   - 例如：`0x1234...abcd`

2. **在 Etherscan 上查看交易历史**
   - 找到 `closeMintingAndRequestRandomness()` 交易
   - 查看 **Logs** 标签页

3. **验证事件顺序**
   ```
   ✅ RandomnessRequested (你的合约)
       └─ requestId: 12345

   ✅ RandomWordsRequested (VRF协调器)
       ├─ requestId: 12345
       ├─ keyHash: 0xabc...
       ├─ preSeed: 67890
       └─ blockNumber: 1000

   ✅ RandomnessFulfilled (你的合约)
       ├─ requestId: 12345
       └─ randomness: 0x7f3e2...

   ✅ RandomWordsFulfilled (VRF协调器)
       ├─ requestId: 12345
       ├─ payment: 0.1 LINK
       └─ success: true
   ```

4. **验证关键点**
   - ✅ requestId 前后一致
   - ✅ 有 3+ 区块确认时间差
   - ✅ 回调交易来自 Chainlink 节点
   - ✅ 时间戳合理（通常几分钟内完成）

---

## 方法 2: 使用 Chainlink VRF 订阅页面

### 访问 Chainlink 官方界面

1. 访问 [vrf.chain.link](https://vrf.chain.link/)
2. 连接钱包
3. 查看你的订阅 ID
4. 查看**请求历史**

### 可以看到：
- 所有请求的 requestId
- 请求时间
- 完成时间
- 消耗的 LINK
- 交易哈希（可点击查看详情）

---

## 方法 3: 用代码验证（推荐）

### 前端验证代码

```typescript
import { ethers } from 'ethers';

async function verifyRandomness(
  contractAddress: string,
  tokenId: number,
  provider: ethers.Provider
) {
  // 1. 获取合约实例
  const contract = new ethers.Contract(
    contractAddress,
    ['event RandomnessRequested(uint256 requestId)',
     'event RandomnessFulfilled(uint256 randomness)',
     'function revealSeed() view returns (uint256)',
     'function getRarity(uint256) view returns (uint8)'],
    provider
  );

  // 2. 查询事件日志
  const requestedFilter = contract.filters.RandomnessRequested();
  const fulfilledFilter = contract.filters.RandomnessFulfilled();

  const requestedEvents = await contract.queryFilter(requestedFilter);
  const fulfilledEvents = await contract.queryFilter(fulfilledFilter);

  console.log('📝 请求事件:', requestedEvents);
  console.log('✅ 完成事件:', fulfilledEvents);

  // 3. 验证随机种子
  const revealSeed = await contract.revealSeed();
  console.log('🎲 随机种子:', revealSeed.toString());

  // 4. 重新计算稀有度（验证合约逻辑）
  const rarity = await contract.getRarity(tokenId);

  // 5. 本地计算验证
  const hash = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['uint256', 'uint256'],
      [revealSeed, tokenId]
    )
  );
  const rand = BigInt(hash) % 100n;

  let expectedRarity;
  if (rand < 1n) expectedRarity = 3; // Legendary
  else if (rand < 11n) expectedRarity = 2; // Epic
  else if (rand < 36n) expectedRarity = 1; // Rare
  else expectedRarity = 0; // Common

  // 6. 验证一致性
  if (rarity === expectedRarity) {
    console.log('✅ 验证通过：稀有度计算正确');
  } else {
    console.log('❌ 验证失败：稀有度不匹配');
  }

  return {
    revealSeed,
    rarity,
    expectedRarity,
    verified: rarity === expectedRarity
  };
}
```

### 使用示例

```typescript
// 在你的前端代码中
const result = await verifyRandomness(
  '0x你的合约地址',
  5, // tokenId
  provider
);

console.log('验证结果:', result);
```

---

## 方法 4: 验证 Chainlink 节点身份

### 检查回调交易的发送者

```javascript
// 使用 Etherscan API
const txHash = '0xabc...'; // RandomnessFulfilled 的交易哈希

const response = await fetch(
  `https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}`
);
const tx = await response.json();

console.log('交易发送者:', tx.result.from);
// 应该是 Chainlink VRF 协调器地址
```

### 已知的 Chainlink VRF 协调器地址

| 网络 | VRF Coordinator V2 地址 |
|------|------------------------|
| Ethereum Mainnet | `0x271682DEB8C4E0901D1a1550aD2e64D568E69909` |
| Sepolia Testnet | `0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625` |
| Polygon Mainnet | `0xAE975071Be8F8eE67addBC1A82488F1C24858067` |

如果回调交易来自这些地址，说明是真实的 Chainlink 服务。

---

## 方法 5: 数学验证（高级）

### 验证稀有度分布

如果有大量 NFT，可以统计分布：

```javascript
async function verifyDistribution(contract, totalSupply) {
  const rarities = { Common: 0, Rare: 0, Epic: 0, Legendary: 0 };

  for (let i = 0; i < totalSupply; i++) {
    const rarity = await contract.getRarity(i);
    rarities[['Common', 'Rare', 'Epic', 'Legendary'][rarity]]++;
  }

  const percentages = {
    Common: (rarities.Common / totalSupply * 100).toFixed(2),
    Rare: (rarities.Rare / totalSupply * 100).toFixed(2),
    Epic: (rarities.Epic / totalSupply * 100).toFixed(2),
    Legendary: (rarities.Legendary / totalSupply * 100).toFixed(2),
  };

  console.log('实际分布:', percentages);
  console.log('预期分布: Common 64%, Rare 25%, Epic 10%, Legendary 1%');

  // 应该接近预期概率
  return percentages;
}
```

---

## 验证清单 ✅

作为 NFT 铸造者，你应该验证：

- [ ] 事件日志存在且 requestId 匹配
- [ ] 随机数请求和完成之间有 3+ 区块间隔
- [ ] 回调交易来自官方 Chainlink 协调器地址
- [ ] 可以在 vrf.chain.link 看到请求历史
- [ ] 本地重新计算稀有度与合约返回值一致
- [ ] （可选）大规模统计分布接近理论概率

---

## 常见问题

### Q: 如果协调器作恶怎么办？

**A:** 协调器合约是开源的，由 Chainlink 官方部署和维护。任何作恶行为：
- 会被密码学证明检测到
- 会在链上留下证据
- 会损害 Chainlink 的声誉和整个生态

### Q: 节点能否操纵随机数？

**A:** 不能。因为：
1. 节点必须使用私钥签名（无法伪造）
2. 输入包含区块哈希（节点无法控制）
3. 协调器会验证密码学证明
4. 任何篡改都会导致验证失败

### Q: 如果我不相信 Chainlink 怎么办？

**A:** 可以考虑：
1. 使用多个随机源（Chainlink VRF + 其他）
2. 使用提交-揭示方案（commit-reveal）
3. 使用去中心化随机信标（如 drand）
4. 组合多个方案增强安全性

---

## 总结

虽然协调器会删除存储记录，但：

✅ **事件日志永久保存**在区块链上
✅ **任何人都可以验证**请求和响应的完整性
✅ **密码学证明**确保随机数未被篡改
✅ **公开透明**，所有历史可查询

作为 NFT 项目方，你应该：
1. 保存 requestId 用于审计
2. 提供验证工具给用户
3. 在网站上展示 Chainlink 请求历史链接
4. 开源合约代码供任何人验证

这就是 Web3 的美妙之处——**不需要信任，只需验证**！🔍
