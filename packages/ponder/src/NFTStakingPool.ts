/**
 * NFTStakingPool Event Indexer
 *
 * Handles indexing of staking-related events from the NFTStakingPool contract
 * Listens to: Staked, Unstaked, RewardClaimed events
 *
 * Purpose:
 * - Build transaction history for the stake page timeline
 * - Maintain aggregated user statistics for dashboard
 * - Track active stakes in real-time
 * - Enable historical data queries via GraphQL
 */

import { ponder } from "ponder:registry";
import { stakingEvent, stakingStats, activeStake, nft } from "ponder:schema";

/**
 * Staked Event Handler
 *
 * Triggered when: User stakes an NFT
 * Event signature: Staked(address indexed user, uint256 indexed tokenId, uint256 timestamp)
 *
 * Actions:
 * - Create StakingEvent record for history
 * - Insert into activeStake table
 * - Increment user's totalStaked counter
 */
ponder.on("NFTStakingPool:Staked", async ({ event, context }) => {
  const { db } = context;

  // 获取 NFT 的 rarity 信息
  const nftData = await db.find(nft, { id: event.args.tokenId.toString() });
  const rarityValue = nftData?.rarity ?? null;

  // Create event record for history timeline
  await db.insert(stakingEvent).values({
    id: `${event.transaction.hash}-${event.log.logIndex}`,
    type: "STAKE",
    user: event.args.user,
    tokenId: Number(event.args.tokenId),
    amount: null, // No reward amount for stake events
    timestamp: Number(event.block.timestamp),
    transactionHash: event.transaction.hash,
    blockNumber: Number(event.block.number),
  });

  // Insert into active stake table with lastClaimTime and rarity
  await db.insert(activeStake).values({
    id: `${event.args.user}-${event.args.tokenId}`,
    user: event.args.user,
    tokenId: Number(event.args.tokenId),
    stakedAt: Number(event.block.timestamp),
    lastClaimTime: Number(event.block.timestamp), // 初始时等于 stakedAt
    rarity: rarityValue,
    transactionHash: event.transaction.hash,
  });

  // Update user statistics
  await db
    .insert(stakingStats)
    .values({
      id: event.args.user,
      totalStaked: 1,
      totalClaimed: 0n,
      totalEarned: 0n,
      lastUpdated: Number(event.block.timestamp),
    })
    .onConflictDoUpdate((row) => ({
      // If user exists, increment totalStaked
      totalStaked: row.totalStaked + 1,
      lastUpdated: Number(event.block.timestamp),
    }));
});

/**
 * Unstaked Event Handler
 *
 * Triggered when: User unstakes an NFT (automatically claims pending rewards)
 * Event signature: Unstaked(address indexed user, uint256 indexed tokenId, uint256 timestamp, uint256 reward)
 *
 * Actions:
 * - Create StakingEvent record with reward amount
 * - Delete from activeStake table
 * - Decrement user's totalStaked counter
 * - Add reward to both totalClaimed and totalEarned (unstake rewards are claimed rewards)
 */
ponder.on("NFTStakingPool:Unstaked", async ({ event, context }) => {
  const { db } = context;

  // Create event record with reward amount
  await db.insert(stakingEvent).values({
    id: `${event.transaction.hash}-${event.log.logIndex}`,
    type: "UNSTAKE",
    user: event.args.user,
    tokenId: Number(event.args.tokenId),
    amount: event.args.reward,
    timestamp: Number(event.block.timestamp),
    transactionHash: event.transaction.hash,
    blockNumber: Number(event.block.number),
  });

  // Remove from active stake table
  await db.delete(activeStake, {
    id: `${event.args.user}-${event.args.tokenId}`,
  });

  // Update user statistics
  await db
    .insert(stakingStats)
    .values({
      id: event.args.user,
      totalStaked: 0, // Will be decremented below if user exists
      totalClaimed: event.args.reward,
      totalEarned: event.args.reward,
      lastUpdated: Number(event.block.timestamp),
    })
    .onConflictDoUpdate((row) => ({
      // Decrement totalStaked, add reward to both totalClaimed and totalEarned
      totalStaked: Math.max(0, row.totalStaked - 1), // Prevent negative values
      totalClaimed: row.totalClaimed + event.args.reward,
      totalEarned: row.totalEarned + event.args.reward,
      lastUpdated: Number(event.block.timestamp),
    }));
});

/**
 * RewardClaimed Event Handler
 *
 * Triggered when: User claims rewards without unstaking
 * Event signature: RewardClaimed(address indexed user, uint256 indexed tokenId, uint256 amount)
 *
 * Actions:
 * - Create StakingEvent record with reward amount
 * - Update lastClaimTime in activeStake table (重要：用于前端计算 pending reward)
 * - Add reward to both totalClaimed and totalEarned
 */
ponder.on("NFTStakingPool:RewardClaimed", async ({ event, context }) => {
  const { db } = context;

  // Create event record
  await db.insert(stakingEvent).values({
    id: `${event.transaction.hash}-${event.log.logIndex}`,
    type: "CLAIM",
    user: event.args.user,
    tokenId: Number(event.args.tokenId),
    amount: event.args.amount,
    timestamp: Number(event.block.timestamp),
    transactionHash: event.transaction.hash,
    blockNumber: Number(event.block.number),
  });

  // Update lastClaimTime in activeStake table
  await db.update(activeStake, {
    id: `${event.args.user}-${event.args.tokenId}`,
  }).set({
    lastClaimTime: Number(event.block.timestamp),
  });

  // Update user statistics
  await db
    .insert(stakingStats)
    .values({
      id: event.args.user,
      totalStaked: 0,
      totalClaimed: event.args.amount,
      totalEarned: event.args.amount,
      lastUpdated: Number(event.block.timestamp),
    })
    .onConflictDoUpdate((row) => ({
      // Add reward to totalClaimed and totalEarned
      totalClaimed: row.totalClaimed + event.args.amount,
      totalEarned: row.totalEarned + event.args.amount,
      lastUpdated: Number(event.block.timestamp),
    }));
});

/**
 * GraphQL Query Examples:
 *
 * 1. Get user's currently staked NFTs (RECOMMENDED - Most efficient):
 * query UserActiveStakes($user: String!) {
 *   activeStakes(
 *     where: { user: $user }
 *     orderBy: "stakedAt"
 *     orderDirection: "desc"
 *   ) {
 *     items {
 *       tokenId
 *       stakedAt
 *       transactionHash
 *     }
 *   }
 * }
 *
 * 2. Get user's staking history (most recent first):
 * query StakingHistory($user: String!) {
 *   stakingEvents(
 *     where: { user: $user }
 *     orderBy: "timestamp"
 *     orderDirection: "desc"
 *     limit: 20
 *   ) {
 *     items {
 *       id
 *       type
 *       tokenId
 *       amount
 *       timestamp
 *       transactionHash
 *     }
 *   }
 * }
 *
 * 3. Get user statistics:
 * query StakingStats($user: String!) {
 *   stakingStats(id: $user) {
 *     totalStaked
 *     totalClaimed
 *     totalEarned
 *     lastUpdated
 *   }
 * }
 *
 * 4. Filter by event type:
 * query ClaimsOnly($user: String!) {
 *   stakingEvents(
 *     where: { user: $user, type: "CLAIM" }
 *     orderBy: "timestamp"
 *     orderDirection: "desc"
 *   ) {
 *     items {
 *       tokenId
 *       amount
 *       timestamp
 *     }
 *   }
 * }
 */
