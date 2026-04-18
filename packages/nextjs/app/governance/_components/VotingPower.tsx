"use client";

import { useState } from "react";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export function VotingPower() {
  const { address } = useAccount();
  const [delegatee, setDelegatee] = useState("");

  const { data: votes } = useScaffoldReadContract({
    contractName: "RewardToken",
    functionName: "getVotes",
    args: [address],
  });

  const { data: currentDelegate } = useScaffoldReadContract({
    contractName: "RewardToken",
    functionName: "delegates",
    args: [address],
  });

  const { writeContractAsync: delegateAsync } = useScaffoldWriteContract({
    contractName: "RewardToken",
  });

  const handleDelegate = async () => {
    try {
      await delegateAsync({
        functionName: "delegate",
        args: [delegatee || address],
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="card p-5" style={{ backgroundColor: "var(--bg-elevated)" }}>
      <h2
        className="text-base font-semibold mb-4"
        style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
      >
        Voting Power
      </h2>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div
          className="p-4 rounded-lg"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
        >
          <p className="text-xs mb-1" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
            Current Votes
          </p>
          <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--accent)" }}>
            {votes ? formatEther(votes) : "0"}
          </p>
          <p className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
            RWRD
          </p>
        </div>

        <div
          className="p-4 rounded-lg"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
        >
          <p className="text-xs mb-1" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
            Delegated To
          </p>
          <p className="text-sm font-mono" style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
            {currentDelegate === address ? "Self" : <Address address={currentDelegate} />}
          </p>
        </div>
      </div>

      <div className="flex gap-2 items-center">
        <input
          type="text"
          placeholder="Delegate to address (blank for self)"
          className="input flex-grow"
          style={{
            fontFamily: "var(--font-mono)",
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-primary)",
          }}
          value={delegatee}
          onChange={e => setDelegatee(e.target.value)}
        />
        <button onClick={handleDelegate} className="btn btn-primary">
          Delegate
        </button>
      </div>
    </div>
  );
}
