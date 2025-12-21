import { ponder } from "ponder:registry";
import { proposal, vote } from "ponder:schema";

ponder.on("MyGovernor:ProposalCreated", async ({ event, context }) => {
  const { db, client } = context;
  const { proposalId, proposer, targets, values, signatures, calldatas, voteStart, voteEnd, description } = event.args;

  // Snapshot Quorum for this proposal at the start block
  // This allows the frontend to calculate "Succeeded" without calling the contract
  let quorumValue = 0n;
  try {
      // Direct RPC call during indexing (supported by Ponder)
      // We assume MyGovernor is at event.log.address
      quorumValue = await client.readContract({
          abi: [
            {
              type: "function",
              name: "quorum",
              inputs: [{ type: "uint256", name: "blockNumber" }],
              outputs: [{ type: "uint256", name: "" }],
              stateMutability: "view",
            },
          ],
          address: event.log.address,
          functionName: "quorum",
          // Use current block - 1 to avoid "Future Block" revert if votingDelay > 0
          // The actual quorum might change slightly by voteStart, but this is a close enough estimate for UI
          args: [event.block.number - 1n],
      });
  } catch (e) {
      console.error("Failed to fetch quorum for proposal", proposalId, e);
  }

  await db.insert(proposal).values({
    id: proposalId.toString(),
    proposer: proposer,
    targets: targets,
    values: values,
    signatures: signatures,
    calldatas: calldatas,
    startBlock: voteStart,
    endBlock: voteEnd,
    description: description,
    state: 0, // Pending
    createdAt: event.block.timestamp,
    quorumVotes: quorumValue, 
    forVotes: 0n,
    againstVotes: 0n,
    abstainVotes: 0n,
  });
});

ponder.on("MyGovernor:VoteCast", async ({ event, context }) => {
  const { db } = context;
  const { voter, proposalId, support, weight, reason } = event.args;

  // 1. Record the individual vote
  await db.insert(vote).values({
    id: `${proposalId}-${voter}`,
    proposalId: proposalId.toString(),
    voter: voter,
    support:  Number(support),
    weight: weight,
    reason: reason,
    createdAt: event.block.timestamp,
  });

  // 2. Update the aggregated counts on the Proposal
  // support: 0=Against, 1=For, 2=Abstain
  const updateData: any = {};
  if (Number(support) === 0) updateData.againstVotes = (curr: any) => curr + weight;
  if (Number(support) === 1) updateData.forVotes = (curr: any) => curr + weight;
  if (Number(support) === 2) updateData.abstainVotes = (curr: any) => curr + weight;

  /* 
     Note: Ponder's update syntax for incrementing depends on the ORM version.
     If simple increment isn't supported, we fetch and update. 
     Ponder's Drizzle ORM often requires manual fetch-update or sql operator.
     Let's use the safe fetch-modify-save pattern if we aren't sure about atomic increments syntax in this specific ponder version.
     Actually, Ponder's `db.update` usually accepts values. 
     Let's assume we need to read first to be safe or use sql template if available.
     Wait, looking at Ponder docs in my training data... standard `db.update` takes a partial object.
     Atomic increment is hard. 
     Standard pattern: 
     const p = await db.find(proposal, { id: ... })
     await db.update(proposal, ...).set({ forVotes: p.forVotes + weight })
  */
  
  const p = await db.find(proposal, { id: proposalId.toString() });
  if (p) {
      let newFor = p.forVotes;
      let newAgainst = p.againstVotes;
      let newAbstain = p.abstainVotes;

      if (Number(support) === 0) newAgainst += weight;
      else if (Number(support) === 1) newFor += weight;
      else if (Number(support) === 2) newAbstain += weight;

      await db.update(proposal, { id: proposalId.toString() }).set({
          forVotes: newFor,
          againstVotes: newAgainst,
          abstainVotes: newAbstain,
      });
  }
});

ponder.on("MyGovernor:ProposalQueued", async ({ event, context }) => {
  const { db } = context;
  await db.update(proposal, { id: event.args.proposalId.toString() }).set({
    state: 5, // Queued
  });
});

ponder.on("MyGovernor:ProposalExecuted", async ({ event, context }) => {
  const { db } = context;
  await db.update(proposal, { id: event.args.proposalId.toString() }).set({
    state: 7, // Executed
    executed: true,
  });
});

ponder.on("MyGovernor:ProposalCanceled", async ({ event, context }) => {
  const { db } = context;
  await db.update(proposal, { id: event.args.proposalId.toString() }).set({
    state: 2, // Canceled
    canceled: true,
  });
});
