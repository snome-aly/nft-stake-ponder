# StakableNFT 前端开发 & Ponder 索引指南

本文档提供 **前端 Mint 页面开发** 和 **Ponder 事件索引设置** 的完整操作指南。

---

## 📋 目录

- [前端开发（Mint 页面）](#前端开发mint-页面)
  - [1. 项目结构概览](#1-项目结构概览)
  - [2. 创建 Mint 页面](#2-创建-mint-页面)
  - [3. 创建合约交互 Hooks](#3-创建合约交互-hooks)
  - [4. 创建 NFT 展示组件](#4-创建-nft-展示组件)
  - [5. 测试前端功能](#5-测试前端功能)
- [Ponder 事件索引设置](#ponder-事件索引设置)
  - [1. Ponder 工作原理](#1-ponder-工作原理)
  - [2. 定义数据 Schema](#2-定义数据-schema)
  - [3. 编写事件处理器](#3-编写事件处理器)
  - [4. 配置 Ponder](#4-配置-ponder)
  - [5. 启动 Ponder 并查询数据](#5-启动-ponder-并查询数据)
- [完整工作流程](#完整工作流程)
- [常见问题](#常见问题)

---

## 前端开发（Mint 页面）

### 1. 项目结构概览

前端项目位于 `packages/nextjs/`，使用 **Next.js 15 App Router**：

```
packages/nextjs/
├── app/                          # Next.js App Router 页面
│   ├── page.tsx                  # 首页
│   ├── mint/                     # Mint 页面（我们要创建）
│   │   └── page.tsx
│   └── my-nfts/                  # My NFTs 页面（我们要创建）
│       └── page.tsx
├── components/
│   └── scaffold-eth/             # SE-2 提供的 Web3 组件
│       ├── Address.tsx           # 显示地址
│       ├── Balance.tsx           # 显示余额
│       ├── EtherInput.tsx        # ETH 输入框
│       └── ...
├── hooks/
│   └── scaffold-eth/             # SE-2 提供的合约交互 Hooks
│       ├── useScaffoldReadContract.ts
│       ├── useScaffoldWriteContract.ts
│       └── useScaffoldEventHistory.ts
├── contracts/
│   ├── deployedContracts.ts      # 自动生成的已部署合约信息
│   └── externalContracts.ts      # 手动添加的外部合约
└── scaffold.config.ts            # 脚手架配置文件
```

---

### 2. 创建 Mint 页面

#### 步骤 2.1：创建基础页面结构

创建文件：`packages/nextjs/app/mint/page.tsx`

```typescript
"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { EtherInput } from "~~/components/scaffold-eth";

export default function MintPage() {
  const { address: connectedAddress } = useAccount();
  const [quantity, setQuantity] = useState<number>(1);

  // 读取合约状态
  const { data: totalMinted } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "totalMinted",
  });

  const { data: maxSupply } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "MAX_SUPPLY",
  });

  const { data: mintPrice } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "MINT_PRICE",
  });

  const { data: userMintedCount } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "mintedCount",
    args: [connectedAddress],
  });

  const { data: maxPerAddress } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "MAX_PER_ADDRESS",
  });

  const { data: isRevealed } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "isRevealed",
  });

  // 写入合约
  const { writeContractAsync: mint, isPending } = useScaffoldWriteContract("StakableNFT");

  const handleMint = async () => {
    if (!connectedAddress) {
      alert("请先连接钱包！");
      return;
    }

    if (!mintPrice) {
      alert("无法获取铸造价格");
      return;
    }

    try {
      await mint({
        functionName: "mint",
        args: [BigInt(quantity)],
        value: mintPrice * BigInt(quantity),
      });

      alert("铸造成功！");
    } catch (error) {
      console.error("铸造失败:", error);
      alert("铸造失败，请查看控制台");
    }
  };

  const remainingSupply = maxSupply && totalMinted
    ? Number(maxSupply) - Number(totalMinted)
    : 0;

  const userRemaining = maxPerAddress && userMintedCount
    ? Number(maxPerAddress) - Number(userMintedCount)
    : 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="card w-full max-w-2xl bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-3xl mb-4">🎁 铸造盲盒 NFT</h2>

          {/* 合约状态 */}
          <div className="stats stats-vertical lg:stats-horizontal shadow mb-6">
            <div className="stat">
              <div className="stat-title">已铸造</div>
              <div className="stat-value text-primary">
                {totalMinted?.toString() || "0"} / {maxSupply?.toString() || "100"}
              </div>
              <div className="stat-desc">剩余 {remainingSupply} 个</div>
            </div>

            <div className="stat">
              <div className="stat-title">你已铸造</div>
              <div className="stat-value text-secondary">
                {userMintedCount?.toString() || "0"} / {maxPerAddress?.toString() || "20"}
              </div>
              <div className="stat-desc">还可铸造 {userRemaining} 个</div>
            </div>

            <div className="stat">
              <div className="stat-title">稀有度状态</div>
              <div className="stat-value text-accent">
                {isRevealed ? "已揭示" : "未揭示"}
              </div>
              <div className="stat-desc">
                {isRevealed ? "可查看稀有度" : "等待揭示"}
              </div>
            </div>
          </div>

          {/* 铸造控制 */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">铸造数量</span>
              <span className="label-text-alt">
                单价: {mintPrice ? `${Number(mintPrice) / 1e18} ETH` : "..."}
              </span>
            </label>
            <input
              type="number"
              min="1"
              max={Math.min(remainingSupply, userRemaining)}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="input input-bordered"
              disabled={remainingSupply === 0 || userRemaining === 0}
            />
            <label className="label">
              <span className="label-text-alt">
                总价: {mintPrice ? `${(Number(mintPrice) * quantity) / 1e18} ETH` : "..."}
              </span>
            </label>
          </div>

          {/* 铸造按钮 */}
          <div className="card-actions justify-end mt-4">
            <button
              className="btn btn-primary w-full"
              onClick={handleMint}
              disabled={isPending || remainingSupply === 0 || userRemaining === 0 || !connectedAddress}
            >
              {!connectedAddress
                ? "请先连接钱包"
                : isPending
                ? "铸造中..."
                : remainingSupply === 0
                ? "已售罄"
                : userRemaining === 0
                ? "已达到个人上限"
                : `铸造 ${quantity} 个 NFT`}
            </button>
          </div>

          {/* 提示信息 */}
          <div className="alert alert-info mt-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>
              铸造后你将获得盲盒 NFT，稀有度将在所有 NFT 铸造完成后由管理员揭示。
              <br />
              稀有度：Common (50%) / Rare (30%) / Epic (15%) / Legendary (5%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

#### 步骤 2.2：更新导航栏

编辑 `packages/nextjs/components/Header.tsx`，添加 Mint 链接（如果需要）。

---

### 3. 创建合约交互 Hooks

Scaffold-ETH 已经提供了核心 Hooks，我们直接使用即可。

#### 关键 Hooks 说明

**1. useScaffoldReadContract - 读取合约数据**
```typescript
const { data, isLoading, error } = useScaffoldReadContract({
  contractName: "StakableNFT",
  functionName: "totalMinted",
  // args: [...], // 可选参数
  // watch: true, // 实时监听变化
});
```

**2. useScaffoldWriteContract - 写入合约**
```typescript
const { writeContractAsync, isPending } = useScaffoldWriteContract("StakableNFT");

await writeContractAsync({
  functionName: "mint",
  args: [BigInt(quantity)],
  value: parseEther("1"), // 支付的 ETH
});
```

**3. useScaffoldEventHistory - 读取事件历史**
```typescript
const { data: events } = useScaffoldEventHistory({
  contractName: "StakableNFT",
  eventName: "NFTMinted",
  fromBlock: 0n,
  watch: true, // 实时监听新事件
});
```

---

### 4. 创建 NFT 展示组件

#### 步骤 4.1：创建 My NFTs 页面

创建文件：`packages/nextjs/app/my-nfts/page.tsx`

```typescript
"use client";

import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldEventHistory } from "~~/hooks/scaffold-eth";
import { Address } from "~~/components/scaffold-eth";
import { useState, useEffect } from "react";

export default function MyNFTsPage() {
  const { address: connectedAddress } = useAccount();
  const [myTokenIds, setMyTokenIds] = useState<bigint[]>([]);

  // 读取总铸造数
  const { data: totalMinted } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "totalMinted",
  });

  const { data: isRevealed } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "isRevealed",
  });

  // 监听 NFTMinted 事件，找到用户铸造的 NFT
  const { data: mintEvents } = useScaffoldEventHistory({
    contractName: "StakableNFT",
    eventName: "NFTMinted",
    fromBlock: 0n,
    watch: true,
  });

  // 从事件中提取用户的 tokenIds
  useEffect(() => {
    if (!mintEvents || !connectedAddress) return;

    const userTokenIds: bigint[] = [];
    mintEvents.forEach(event => {
      if (event.args.to?.toLowerCase() === connectedAddress.toLowerCase()) {
        const startId = event.args.startTokenId;
        const quantity = event.args.quantity;

        for (let i = 0; i < Number(quantity); i++) {
          userTokenIds.push(BigInt(Number(startId) + i));
        }
      }
    });

    setMyTokenIds(userTokenIds);
  }, [mintEvents, connectedAddress]);

  if (!connectedAddress) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="alert alert-warning">
          <span>请先连接钱包查看你的 NFT</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">我的 NFT</h1>

      <div className="stats shadow mb-8">
        <div className="stat">
          <div className="stat-title">我拥有的 NFT</div>
          <div className="stat-value">{myTokenIds.length}</div>
        </div>
        <div className="stat">
          <div className="stat-title">稀有度状态</div>
          <div className="stat-value text-primary">
            {isRevealed ? "已揭示" : "未揭示"}
          </div>
        </div>
      </div>

      {myTokenIds.length === 0 ? (
        <div className="alert alert-info">
          <span>你还没有铸造任何 NFT，去 Mint 页面铸造吧！</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {myTokenIds.map(tokenId => (
            <NFTCard key={tokenId.toString()} tokenId={tokenId} isRevealed={isRevealed || false} />
          ))}
        </div>
      )}
    </div>
  );
}

// NFT 卡片组件
function NFTCard({ tokenId, isRevealed }: { tokenId: bigint; isRevealed: boolean }) {
  const { data: tokenURI } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "tokenURI",
    args: [tokenId],
  });

  const { data: rarity } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "getRarity",
    args: [tokenId],
    query: {
      enabled: isRevealed, // 只在揭示后查询
    },
  });

  const { data: multiplier } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "getTokenRewardMultiplier",
    args: [tokenId],
  });

  // 解析 tokenURI（data:application/json;base64,... 格式）
  const metadata = tokenURI ? parseTokenURI(tokenURI) : null;

  const rarityNames = ["Common", "Rare", "Epic", "Legendary"];
  const rarityColors = ["badge-secondary", "badge-info", "badge-accent", "badge-warning"];

  return (
    <div className="card bg-base-100 shadow-xl">
      <figure className="px-4 pt-4">
        {metadata?.image ? (
          <img
            src={metadata.image}
            alt={metadata.name}
            className="rounded-xl w-full h-64 object-cover"
          />
        ) : (
          <div className="w-full h-64 bg-base-300 rounded-xl flex items-center justify-center">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        )}
      </figure>
      <div className="card-body">
        <h2 className="card-title">
          {metadata?.name || `NFT #${tokenId}`}
          {isRevealed && rarity !== undefined && (
            <div className={`badge ${rarityColors[Number(rarity)]}`}>
              {rarityNames[Number(rarity)]}
            </div>
          )}
        </h2>
        <p className="text-sm">{metadata?.description || "Loading..."}</p>

        {isRevealed && multiplier && (
          <div className="stat-desc mt-2">
            奖励倍率: {(Number(multiplier) / 10000).toFixed(2)}x
          </div>
        )}
      </div>
    </div>
  );
}

// 解析 base64 编码的 tokenURI
function parseTokenURI(uri: string) {
  try {
    if (uri.startsWith("data:application/json;base64,")) {
      const base64Data = uri.replace("data:application/json;base64,", "");
      const jsonString = atob(base64Data);
      return JSON.parse(jsonString);
    }
    return null;
  } catch (error) {
    console.error("解析 tokenURI 失败:", error);
    return null;
  }
}
```

---

### 5. 测试前端功能

#### 步骤 5.1：启动前端

```bash
# 启动开发服务器
yarn start

# 或
yarn next:dev
```

#### 步骤 5.2：测试流程

1. 访问 `http://localhost:3000/mint`
2. 连接钱包（使用本地 Hardhat 账户）
3. 选择铸造数量
4. 点击"铸造"按钮
5. 确认交易
6. 访问 `http://localhost:3000/my-nfts` 查看你的 NFT

#### 步骤 5.3：调试工具

- **Debug Contracts 页面**: `http://localhost:3000/debug`
  - 可以直接调用合约的所有函数
  - 查看合约状态
  - 测试管理员功能（reveal、setRewardMultiplier 等）

---

## Ponder 事件索引设置

### 1. Ponder 工作原理

Ponder 是一个区块链数据索引框架，它：
- 监听智能合约事件
- 将事件数据存储到数据库
- 提供 GraphQL API 查询数据

**工作流程：**
```
区块链事件 → Ponder 监听 → 数据处理 → 存储到数据库 → GraphQL API
```

---

### 2. 定义数据 Schema

#### 步骤 2.1：编辑 Schema 文件

编辑 `packages/ponder/ponder.schema.ts`：

```typescript
import { onchainTable, index, primaryKey } from "ponder";

/**
 * NFT 铸造记录表
 */
export const mintEvents = onchainTable("mint_events", (t) => ({
  id: t.text().primaryKey(), // 事件唯一 ID (txHash-logIndex)
  to: t.hex().notNull(), // 铸造者地址
  startTokenId: t.bigint().notNull(), // 起始 tokenId
  quantity: t.bigint().notNull(), // 铸造数量
  blockNumber: t.bigint().notNull(), // 区块号
  timestamp: t.bigint().notNull(), // 时间戳
  transactionHash: t.hex().notNull(), // 交易哈希
}));

export const mintEventsToIndex = index("mint_events_to_index").on(mintEvents.to);
export const mintEventsBlockIndex = index("mint_events_block_index").on(mintEvents.blockNumber);

/**
 * NFT 表（每个 NFT 一条记录）
 */
export const nfts = onchainTable("nfts", (t) => ({
  tokenId: t.bigint().primaryKey(), // tokenId
  owner: t.hex().notNull(), // 当前持有者
  rarity: t.integer(), // 稀有度 (0=Common, 1=Rare, 2=Epic, 3=Legendary)
  rewardMultiplier: t.bigint(), // 奖励倍率
  isRevealed: t.boolean().notNull().default(false), // 是否已揭示
  mintedAt: t.bigint().notNull(), // 铸造时间
  mintedBy: t.hex().notNull(), // 铸造者地址
}));

export const nftsOwnerIndex = index("nfts_owner_index").on(nfts.owner);
export const nftsRarityIndex = index("nfts_rarity_index").on(nfts.rarity);

/**
 * 揭示记录表
 */
export const revealEvents = onchainTable("reveal_events", (t) => ({
  id: t.text().primaryKey(),
  offset: t.bigint().notNull(), // 随机偏移量
  blockNumber: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
  transactionHash: t.hex().notNull(),
}));

/**
 * 稀有度统计表
 */
export const rarityStats = onchainTable("rarity_stats", (t) => ({
  rarity: t.integer().primaryKey(), // 0-3
  count: t.bigint().notNull().default(0n), // 该稀有度的 NFT 数量
  totalMinted: t.bigint().notNull().default(0n), // 总铸造数
}));

/**
 * 用户统计表
 */
export const userStats = onchainTable("user_stats", (t) => ({
  address: t.hex().primaryKey(), // 用户地址
  totalMinted: t.bigint().notNull().default(0n), // 总铸造数
  totalOwned: t.bigint().notNull().default(0n), // 当前拥有数
  commonCount: t.bigint().notNull().default(0n), // Common 数量
  rareCount: t.bigint().notNull().default(0n), // Rare 数量
  epicCount: t.bigint().notNull().default(0n), // Epic 数量
  legendaryCount: t.bigint().notNull().default(0n), // Legendary 数量
}));
```

#### 步骤 2.2：生成类型定义

```bash
cd packages/ponder
yarn ponder:codegen
```

---

### 3. 编写事件处理器

#### 步骤 3.1：创建事件处理文件

创建文件：`packages/ponder/src/StakableNFT.ts`

```typescript
import { ponder } from "ponder:registry";
import schema from "ponder:schema";

/**
 * NFTMinted 事件处理器
 * 当用户铸造 NFT 时触发
 */
ponder.on("StakableNFT:NFTMinted", async ({ event, context }) => {
  const { to, startTokenId, quantity } = event.args;
  const { block, transaction } = event;

  // 1. 记录铸造事件
  await context.db.insert(schema.mintEvents).values({
    id: `${transaction.hash}-${event.log.logIndex}`,
    to: to,
    startTokenId: startTokenId,
    quantity: quantity,
    blockNumber: block.number,
    timestamp: block.timestamp,
    transactionHash: transaction.hash,
  });

  // 2. 为每个铸造的 NFT 创建记录
  for (let i = 0; i < Number(quantity); i++) {
    const tokenId = BigInt(Number(startTokenId) + i);

    await context.db.insert(schema.nfts).values({
      tokenId: tokenId,
      owner: to,
      rarity: null, // 未揭示时为 null
      rewardMultiplier: null,
      isRevealed: false,
      mintedAt: block.timestamp,
      mintedBy: to,
    });
  }

  // 3. 更新用户统计
  await context.db
    .insert(schema.userStats)
    .values({
      address: to,
      totalMinted: quantity,
      totalOwned: quantity,
      commonCount: 0n,
      rareCount: 0n,
      epicCount: 0n,
      legendaryCount: 0n,
    })
    .onConflictDoUpdate((row) => ({
      totalMinted: row.totalMinted + quantity,
      totalOwned: row.totalOwned + quantity,
    }));
});

/**
 * RevealCompleted 事件处理器
 * 当管理员揭示所有 NFT 的稀有度时触发
 */
ponder.on("StakableNFT:RevealCompleted", async ({ event, context }) => {
  const { offset } = event.args;
  const { block, transaction } = event;

  // 1. 记录揭示事件
  await context.db.insert(schema.revealEvents).values({
    id: `${transaction.hash}-${event.log.logIndex}`,
    offset: offset,
    blockNumber: block.number,
    timestamp: block.timestamp,
    transactionHash: transaction.hash,
  });

  // 2. 读取合约获取所有 NFT 的稀有度
  const { client } = context;
  const totalMinted = await client.readContract({
    address: event.log.address,
    abi: context.contracts.StakableNFT.abi,
    functionName: "totalMinted",
  });

  // 3. 更新所有 NFT 的稀有度
  for (let tokenId = 1; tokenId <= Number(totalMinted); tokenId++) {
    const rarity = await client.readContract({
      address: event.log.address,
      abi: context.contracts.StakableNFT.abi,
      functionName: "getRarity",
      args: [BigInt(tokenId)],
    });

    const multiplier = await client.readContract({
      address: event.log.address,
      abi: context.contracts.StakableNFT.abi,
      functionName: "getTokenRewardMultiplier",
      args: [BigInt(tokenId)],
    });

    await context.db
      .update(schema.nfts, { tokenId: BigInt(tokenId) })
      .set({
        rarity: Number(rarity),
        rewardMultiplier: multiplier,
        isRevealed: true,
      });

    // 更新用户统计的稀有度计数
    const nft = await context.db
      .select()
      .from(schema.nfts)
      .where((row) => row.tokenId === BigInt(tokenId))
      .limit(1);

    if (nft.length > 0) {
      const rarityField =
        Number(rarity) === 0 ? "commonCount" :
        Number(rarity) === 1 ? "rareCount" :
        Number(rarity) === 2 ? "epicCount" :
        "legendaryCount";

      await context.db
        .update(schema.userStats, { address: nft[0].owner })
        .set((row) => ({
          [rarityField]: row[rarityField] + 1n,
        }));
    }
  }

  // 4. 更新稀有度统计
  const rarityCounts = { 0: 0n, 1: 0n, 2: 0n, 3: 0n };
  for (let tokenId = 1; tokenId <= Number(totalMinted); tokenId++) {
    const nft = await context.db
      .select()
      .from(schema.nfts)
      .where((row) => row.tokenId === BigInt(tokenId))
      .limit(1);

    if (nft.length > 0 && nft[0].rarity !== null) {
      rarityCounts[nft[0].rarity as 0 | 1 | 2 | 3]++;
    }
  }

  for (let rarity = 0; rarity < 4; rarity++) {
    await context.db
      .insert(schema.rarityStats)
      .values({
        rarity: rarity,
        count: rarityCounts[rarity as 0 | 1 | 2 | 3],
        totalMinted: BigInt(totalMinted),
      })
      .onConflictDoUpdate({
        count: rarityCounts[rarity as 0 | 1 | 2 | 3],
        totalMinted: BigInt(totalMinted),
      });
  }
});

/**
 * Transfer 事件处理器（ERC721 标准事件）
 * 当 NFT 转移时更新所有者
 */
ponder.on("StakableNFT:Transfer", async ({ event, context }) => {
  const { from, to, tokenId } = event.args;

  // 排除铸造事件（from = 0x0）
  if (from === "0x0000000000000000000000000000000000000000") {
    return;
  }

  // 更新 NFT 所有者
  await context.db
    .update(schema.nfts, { tokenId: tokenId })
    .set({ owner: to });

  // 更新旧主人统计
  await context.db
    .update(schema.userStats, { address: from })
    .set((row) => ({
      totalOwned: row.totalOwned - 1n,
    }));

  // 更新新主人统计
  await context.db
    .insert(schema.userStats)
    .values({
      address: to,
      totalMinted: 0n,
      totalOwned: 1n,
      commonCount: 0n,
      rareCount: 0n,
      epicCount: 0n,
      legendaryCount: 0n,
    })
    .onConflictDoUpdate((row) => ({
      totalOwned: row.totalOwned + 1n,
    }));
});

/**
 * RewardMultiplierUpdated 事件处理器
 * 当管理员更新奖励倍率时触发
 */
ponder.on("StakableNFT:RewardMultiplierUpdated", async ({ event, context }) => {
  const { rarity, newMultiplier } = event.args;

  // 更新所有该稀有度的 NFT 的奖励倍率
  await context.db
    .update(schema.nfts, { rarity: Number(rarity) })
    .set({ rewardMultiplier: newMultiplier });
});
```

---

### 4. 配置 Ponder

Ponder 配置已经自动同步 `deployedContracts.ts`，但你需要确认：

#### 步骤 4.1：检查配置

查看 `packages/ponder/ponder.config.ts`：

```typescript
import { createConfig } from "ponder";
import { http } from "viem";
import { contracts } from "../nextjs/contracts/deployedContracts";
import scaffoldConfig from "../nextjs/scaffold.config";

const targetNetwork = scaffoldConfig.targetNetworks[0];

export default createConfig({
  networks: {
    [targetNetwork.name]: {
      chainId: targetNetwork.id,
      transport: http(process.env[`PONDER_RPC_URL_${targetNetwork.id}`] || targetNetwork.rpcUrls.default.http[0]),
    },
  },
  contracts: {
    StakableNFT: {
      abi: contracts[targetNetwork.id]?.StakableNFT?.abi || [],
      address: contracts[targetNetwork.id]?.StakableNFT?.address as `0x${string}`,
      network: targetNetwork.name,
      startBlock: 0, // 从第 0 个区块开始索引
    },
  },
});
```

如果配置不正确，手动编辑这个文件。

---

### 5. 启动 Ponder 并查询数据

#### 步骤 5.1：启动 Ponder

```bash
# 开发模式（带热重载）
yarn ponder:dev

# 生产模式
yarn ponder:start
```

启动后，Ponder 会：
1. 连接到区块链
2. 索引历史事件
3. 启动 GraphQL API 服务器（`http://localhost:42069`）

#### 步骤 5.2：使用 GraphQL 查询数据

访问 `http://localhost:42069`，你会看到 GraphQL Playground。

**示例查询 1：获取所有铸造事件**
```graphql
query {
  mintEvents {
    items {
      id
      to
      startTokenId
      quantity
      timestamp
    }
  }
}
```

**示例查询 2：获取用户的 NFT**
```graphql
query GetUserNFTs($owner: String!) {
  nfts(where: { owner: $owner }) {
    items {
      tokenId
      owner
      rarity
      rewardMultiplier
      isRevealed
      mintedAt
    }
  }
}

# Variables:
{
  "owner": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
}
```

**示例查询 3：获取稀有度统计**
```graphql
query {
  rarityStats {
    items {
      rarity
      count
      totalMinted
    }
  }
}
```

**示例查询 4：获取用户统计**
```graphql
query GetUserStats($address: String!) {
  userStats(where: { address: $address }) {
    items {
      address
      totalMinted
      totalOwned
      commonCount
      rareCount
      epicCount
      legendaryCount
    }
  }
}
```

#### 步骤 5.3：在前端集成 GraphQL

安装依赖（应该已经安装）：
```bash
cd packages/nextjs
yarn add graphql-request @tanstack/react-query
```

创建 GraphQL 客户端：`packages/nextjs/lib/graphql.ts`

```typescript
import { GraphQLClient } from "graphql-request";

const PONDER_URL = process.env.NEXT_PUBLIC_PONDER_URL || "http://localhost:42069";

export const graphqlClient = new GraphQLClient(PONDER_URL);

// 查询用户的 NFT
export async function getUserNFTs(owner: string) {
  const query = `
    query GetUserNFTs($owner: String!) {
      nfts(where: { owner: $owner }) {
        items {
          tokenId
          owner
          rarity
          rewardMultiplier
          isRevealed
          mintedAt
        }
      }
    }
  `;

  const data = await graphqlClient.request(query, { owner: owner.toLowerCase() });
  return data;
}

// 查询稀有度统计
export async function getRarityStats() {
  const query = `
    query {
      rarityStats {
        items {
          rarity
          count
          totalMinted
        }
      }
    }
  `;

  const data = await graphqlClient.request(query);
  return data;
}
```

在前端使用：

```typescript
import { useQuery } from "@tanstack/react-query";
import { getUserNFTs } from "~~/lib/graphql";

function MyNFTsPage() {
  const { address } = useAccount();

  const { data, isLoading } = useQuery({
    queryKey: ["userNFTs", address],
    queryFn: () => getUserNFTs(address!),
    enabled: !!address,
  });

  // 使用 data...
}
```

---

## 完整工作流程

### 开发环境设置

1. **启动本地区块链**
   ```bash
   yarn chain
   ```

2. **部署合约**
   ```bash
   yarn deploy
   ```

3. **启动 Ponder 索引器**
   ```bash
   yarn ponder:dev
   ```

4. **启动前端**
   ```bash
   yarn start
   ```

### 测试流程

1. **铸造 NFT**
   - 访问 `http://localhost:3000/mint`
   - 连接钱包，铸造 NFT
   - 查看 Ponder GraphQL（`http://localhost:42069`）确认事件被索引

2. **查看 NFT**
   - 访问 `http://localhost:3000/my-nfts`
   - 查看你铸造的 NFT（显示为盲盒）

3. **揭示稀有度**
   - 等待所有 100 个 NFT 被铸造（或在测试环境手动调整）
   - 访问 `http://localhost:3000/debug`
   - 使用管理员账户调用 `reveal()` 函数
   - 刷新 My NFTs 页面，查看稀有度

4. **查询统计数据**
   - 在 GraphQL Playground 查询稀有度分布
   - 查询用户统计信息

---

## 常见问题

### Q1: 前端无法读取合约数据

**可能原因：**
- 合约未部署或地址不正确
- RPC 连接失败
- 钱包未连接

**解决方法：**
1. 检查 `packages/nextjs/contracts/deployedContracts.ts` 是否包含正确的合约地址
2. 确认 `scaffold.config.ts` 中的 `targetNetworks` 配置正确
3. 重新部署：`yarn deploy`

### Q2: Ponder 索引失败

**可能原因：**
- RPC URL 配置错误
- 合约地址不正确
- Schema 定义与代码不匹配

**解决方法：**
1. 检查 `ponder.config.ts` 中的合约地址
2. 运行 `yarn ponder:codegen` 重新生成类型
3. 清除 Ponder 数据：删除 `packages/ponder/.ponder` 目录
4. 重启 Ponder：`yarn ponder:dev`

### Q3: GraphQL 查询返回空数据

**可能原因：**
- Ponder 还在索引历史事件
- 没有触发过相应的事件
- 查询条件不正确

**解决方法：**
1. 检查 Ponder 日志，确认索引进度
2. 在链上触发一些事件（mint NFT）
3. 检查 GraphQL 查询语法

### Q4: 前端显示 "Loading..." 或错误

**可能原因：**
- Hook 使用不正确
- 合约函数调用失败
- 网络延迟

**解决方法：**
1. 打开浏览器控制台查看错误信息
2. 使用 Debug Contracts 页面测试合约调用
3. 检查钱包是否在正确的网络上

### Q5: 无法调用需要权限的函数

**可能原因：**
- 当前账户没有相应的角色权限
- 使用了错误的账户

**解决方法：**
1. 检查部署脚本，确认角色已正确授予
2. 在 Debug Contracts 页面检查账户角色
3. 切换到有权限的账户（deployer, operator, pauser）

---

## 下一步

完成前端和 Ponder 设置后，你可以：

1. **优化 UI/UX** - 改进页面设计，添加动画效果
2. **添加更多功能** - 实现质押功能（如果需要）
3. **编写管理后台** - 创建管理员专用的控制面板
4. **准备测试网部署** - 部署到 Sepolia 等测试网
5. **编写文档** - 为用户编写使用指南

---

## 资源链接

- **Scaffold-ETH 2 文档**: https://docs.scaffoldeth.io
- **Ponder 文档**: https://ponder.sh
- **Next.js App Router 文档**: https://nextjs.org/docs/app
- **Wagmi 文档**: https://wagmi.sh
- **RainbowKit 文档**: https://www.rainbowkit.com

---

**祝开发顺利！如有问题，随时咨询。** 🚀
