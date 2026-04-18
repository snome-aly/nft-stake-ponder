"use client";

import { useState } from "react";
import { encodeFunctionData } from "viem";
import { useDeployedContractInfo, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export function CreateProposal() {
  const [rewardValue, setRewardValue] = useState("");
  const [description, setDescription] = useState("");

  const { data: poolInfo } = useDeployedContractInfo("NFTStakingPool");
  const { writeContractAsync: proposeAsync, isMining } = useScaffoldWriteContract("MyGovernor");

  const handlePropose = async () => {
    if (!poolInfo || !rewardValue || !description) return;

    try {
      const calldata = encodeFunctionData({
        abi: poolInfo.abi,
        functionName: "setBaseReward",
        args: [BigInt(rewardValue)],
      });

      await proposeAsync({
        functionName: "propose",
        args: [[poolInfo.address], [0n], [calldata], description],
      });

      setRewardValue("");
      setDescription("");
    } catch (e) {
      console.error("Error creating proposal:", e);
    }
  };

  return (
    <div className="card p-5" style={{ backgroundColor: "var(--bg-elevated)" }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-6 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
        <h2
          className="text-base font-semibold"
          style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
        >
          Create Proposal
        </h2>
      </div>

      <p className="text-sm mb-4" style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}>
        Submit a new proposal to update the Staking Pool configuration.
      </p>

      {poolInfo && (
        <div
          className="p-3 rounded-lg mb-4"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <p className="text-xs font-mono" style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
            Target: {poolInfo.address}
          </p>
        </div>
      )}

      <div className="mb-4">
        <label className="block text-xs mb-2" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
          New Base Reward
        </label>
        <input
          type="number"
          placeholder="e.g. 500"
          className="input w-full"
          style={{
            fontFamily: "var(--font-mono)",
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-primary)",
          }}
          value={rewardValue}
          onChange={e => setRewardValue(e.target.value)}
        />
        <p className="text-xs mt-1" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
          Units: Tokens per second (scaled)
        </p>
      </div>

      <div className="mb-4">
        <label className="block text-xs mb-2" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
          Description
        </label>
        <textarea
          className="textarea w-full h-32"
          style={{
            fontFamily: "var(--font-body)",
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-primary)",
          }}
          placeholder="# Proposal Title&#10;&#10;Describe the reason for this update..."
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={handlePropose}
          disabled={!poolInfo || !rewardValue || !description || isMining}
          className="btn btn-primary"
        >
          {isMining ? "Proposing..." : "Submit Proposal"}
        </button>
      </div>
    </div>
  );
}
