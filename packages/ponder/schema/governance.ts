import { onchainTable } from "ponder";

// Proposal Table
export const proposal = onchainTable("proposal", (t) => ({
  id: t.text().primaryKey(), // Proposal ID
  proposer: t.hex().notNull(),
  targets: t.text().array().notNull(),
  values: t.bigint().array().notNull(),
  signatures: t.text().array().notNull(),
  calldatas: t.hex().array().notNull(),
  startBlock: t.bigint().notNull(),
  endBlock: t.bigint().notNull(),
  description: t.text().notNull(),
  state: t.integer().notNull(), // Enum: Peer to ProposalState
  canceled: t.boolean().default(false),
  executed: t.boolean().default(false),
  createdAt: t.bigint().notNull(), // Timestamp
  // Aggregated Votes for Client-Side logic
  forVotes: t.bigint().default(0n),
  againstVotes: t.bigint().default(0n),
  abstainVotes: t.bigint().default(0n),
  quorumVotes: t.bigint().default(0n), 
}));

// Vote Table
export const vote = onchainTable("vote", (t) => ({
  id: t.text().primaryKey(), // proposalId + "-" + voterAddress
  proposalId: t.text().notNull(),
  voter: t.hex().notNull(),
  support: t.integer().notNull(), // 0=Against, 1=For, 2=Abstain
  weight: t.bigint().notNull(),
  reason: t.text(),
  createdAt: t.bigint().notNull(),
}));

// Voting Power Delegation (Optional, tracked by RewardToken)
export const delegate = onchainTable("delegate", (t) => ({
    id: t.hex().primaryKey(), // User Address
    delegatedTo: t.hex(),
    votes: t.bigint().default(0n),
}));
