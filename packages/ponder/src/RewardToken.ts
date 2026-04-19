import { ponder } from "ponder:registry";
import { delegate } from "ponder:schema";

ponder.on("RewardToken:DelegateChanged", async ({ event, context }) => {
  const { db } = context;
  const { delegator, fromDelegate, toDelegate } = event.args;

  // Update delegator record
  await db.insert(delegate).values({
    id: delegator,
    delegatedTo: toDelegate,
    votes: 0n, // Initialize if not exists, but we update votes via DelegateVotesChanged
  }).onConflictDoUpdate((row) => ({
    delegatedTo: toDelegate 
  }));
});

ponder.on("RewardToken:DelegateVotesChanged", async ({ event, context }) => {
  const { db } = context;
  const { delegate: delegateAddress, newVotes } = event.args;

  /* 
     Fix "No values to set" persistence by using Delete-Insert.
     This bypasses Update/Upsert generator bugs for specific bigints/nulls.
  */
  const existingDelegate = await db.find(delegate, { id: delegateAddress });
  
  // Preserve existing delegation if any
  const currentDelegatedTo = existingDelegate?.delegatedTo;

  // Clear old record
  if (existingDelegate) {
    await db.delete(delegate, { id: delegateAddress });
  }

  // Construct pure values object
  const insertValues: any = {
      id: delegateAddress,
      votes: newVotes,
  };
  // Only add delegatedTo if it exists (avoid null/undefined issues)
  if (currentDelegatedTo) {
      insertValues.delegatedTo = currentDelegatedTo;
  }

  await db.insert(delegate).values(insertValues);
});
