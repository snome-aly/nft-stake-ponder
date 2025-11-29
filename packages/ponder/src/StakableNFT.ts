import { ponder } from "ponder:registry";
import { nft, userStats, globalStats, mintEvent, revealEvent, roleEvent } from "ponder:schema";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const MAX_SUPPLY = 100;

// ============================================
// NFTMinted 事件处理
// ============================================
ponder.on("StakableNFT:NFTMinted", async ({ event, context }) => {
  const { to, startTokenId, quantity } = event.args;
  const qty = Number(quantity);
  const start = Number(startTokenId);

  // 1. 创建每个 NFT 记录
  for (let i = 0; i < qty; i++) {
    const tokenId = start + i;

    await context.db.insert(nft).values({
      id: tokenId.toString(),
      owner: to,
      tokenId: tokenId,
      rarity: null,
      isRevealed: false,
      mintedAt: Number(event.block.timestamp),
      mintedBy: to,
    });
  }

  // 2. 记录铸造事件
  await context.db.insert(mintEvent).values({
    id: `${event.transaction.hash}-${event.log.logIndex}`,
    to: to,
    startTokenId: start,
    quantity: qty,
    timestamp: Number(event.block.timestamp),
    blockNumber: Number(event.block.number),
    transactionHash: event.transaction.hash,
  });

  // 3. 更新用户统计
  await context.db
    .insert(userStats)
    .values({
      id: to,
      totalMinted: qty,
      currentBalance: qty,
      totalTransferred: 0,
    })
    .onConflictDoUpdate((row) => ({
      totalMinted: row.totalMinted + qty,
      currentBalance: row.currentBalance + qty,
    }));

  // 4. 更新全局统计
  await context.db
    .insert(globalStats)
    .values({
      id: "global",
      totalMinted: qty,
      totalRevealed: false,
      revealOffset: 0,
      rarityPoolSet: false,
      commonCount: 0,
      rareCount: 0,
      epicCount: 0,
      legendaryCount: 0,
    })
    .onConflictDoUpdate((row) => ({
      totalMinted: row.totalMinted + qty,
    }));
});

// ============================================
// Transfer 事件处理（追踪 NFT 所有权变化）
// ============================================
ponder.on("StakableNFT:Transfer", async ({ event, context }) => {
  const { from, to, tokenId } = event.args;
  const tokenIdStr = tokenId.toString();

  // 跳过铸造事件（from 是零地址，已由 NFTMinted 处理）
  if (from === ZERO_ADDRESS) return;

  // 1. 更新 NFT 所有者
  await context.db.update(nft, { id: tokenIdStr }).set({ owner: to });

  // 2. 更新转出方统计
  await context.db.update(userStats, { id: from }).set((row) => ({
    currentBalance: row.currentBalance - 1,
    totalTransferred: row.totalTransferred + 1,
  }));

  // 3. 更新接收方统计
  await context.db
    .insert(userStats)
    .values({
      id: to,
      totalMinted: 0,
      currentBalance: 1,
      totalTransferred: 0,
    })
    .onConflictDoUpdate((row) => ({
      currentBalance: row.currentBalance + 1,
    }));
});

// ============================================
// RarityPoolSet 事件处理
// ============================================
ponder.on("StakableNFT:RarityPoolSet", async ({ event, context }) => {
  await context.db
    .insert(globalStats)
    .values({
      id: "global",
      totalMinted: 0,
      totalRevealed: false,
      revealOffset: 0,
      rarityPoolSet: true,
      commonCount: 0,
      rareCount: 0,
      epicCount: 0,
      legendaryCount: 0,
    })
    .onConflictDoUpdate(() => ({
      rarityPoolSet: true,
    }));
});

// ============================================
// RevealCompleted 事件处理（揭示稀有度）
// ============================================
ponder.on("StakableNFT:RevealCompleted", async ({ event, context }) => {
  const { offset } = event.args;
  const offsetNum = Number(offset);

  // 1. 记录揭示事件
  await context.db.insert(revealEvent).values({
    id: event.transaction.hash,
    offset: offsetNum,
    timestamp: Number(event.block.timestamp),
    blockNumber: Number(event.block.number),
    transactionHash: event.transaction.hash,
  });

  // 2. 读取合约的 rarityPool 数组来计算每个 NFT 的稀有度
  const rarityCounts = { common: 0, rare: 0, epic: 0, legendary: 0 };

  // 获取当前已铸造的总数
  const currentGlobalStats = await context.db.find(globalStats, { id: "global" });
  const totalMinted = currentGlobalStats?.totalMinted ?? MAX_SUPPLY;

  // 批量读取 rarityPool 并更新每个 NFT
  for (let tokenId = 1; tokenId <= totalMinted; tokenId++) {
    const rarityIndex = (tokenId - 1 + offsetNum) % MAX_SUPPLY;

    // 从合约读取该索引的稀有度
    const rarity = await context.client.readContract({
      abi: context.contracts.StakableNFT!.abi,
      address: context.contracts.StakableNFT!.address,
      functionName: "rarityPool",
      args: [BigInt(rarityIndex)],
    });

    const rarityNum = Number(rarity);

    // 更新 NFT 的稀有度
    await context.db.update(nft, { id: tokenId.toString() }).set({
      rarity: rarityNum,
      isRevealed: true,
    });

    // 统计各稀有度数量
    if (rarityNum === 0) rarityCounts.common++;
    else if (rarityNum === 1) rarityCounts.rare++;
    else if (rarityNum === 2) rarityCounts.epic++;
    else if (rarityNum === 3) rarityCounts.legendary++;
  }

  // 3. 更新全局统计
  await context.db.update(globalStats, { id: "global" }).set({
    totalRevealed: true,
    revealOffset: offsetNum,
    commonCount: rarityCounts.common,
    rareCount: rarityCounts.rare,
    epicCount: rarityCounts.epic,
    legendaryCount: rarityCounts.legendary,
  });
});

// ============================================
// RoleGranted 事件处理
// ============================================
ponder.on("StakableNFT:RoleGranted", async ({ event, context }) => {
  const { role, account, sender } = event.args;

  await context.db.insert(roleEvent).values({
    id: `${event.transaction.hash}-${event.log.logIndex}`,
    eventType: "GRANTED",
    role: role,
    account: account,
    sender: sender,
    timestamp: Number(event.block.timestamp),
    blockNumber: Number(event.block.number),
    transactionHash: event.transaction.hash,
  });
});

// ============================================
// RoleRevoked 事件处理
// ============================================
ponder.on("StakableNFT:RoleRevoked", async ({ event, context }) => {
  const { role, account, sender } = event.args;

  await context.db.insert(roleEvent).values({
    id: `${event.transaction.hash}-${event.log.logIndex}`,
    eventType: "REVOKED",
    role: role,
    account: account,
    sender: sender,
    timestamp: Number(event.block.timestamp),
    blockNumber: Number(event.block.number),
    transactionHash: event.transaction.hash,
  });
});
