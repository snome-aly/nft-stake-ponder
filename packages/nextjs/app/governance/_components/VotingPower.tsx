"use client";

import { useState } from "react";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export const VotingPower = () => {
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
    <div className="card glass-medium shadow-xl mb-6">
      <div className="card-body">
        <h2 className="card-title">Voting Power</h2>
        <div className="stats shadow bg-base-100/50 backdrop-blur-sm">
          <div className="stat">
            <div className="stat-title font-semibold text-base-content/70">Current Votes</div>
            <div className="stat-value text-4xl font-black text-gradient-purple tracking-tight">
              {votes ? formatEther(votes) : "0"}
            </div>
            <div className="stat-desc font-bold text-xs opacity-60">RWRD</div>
          </div>
          <div className="stat">
            <div className="stat-title font-semibold text-base-content/70">Delegated To</div>
            <div className="stat-value text-sm font-mono bg-base-100/30 p-2 rounded-lg border border-white/5">
              {currentDelegate === address ? "Self" : <Address address={currentDelegate} />}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4 items-center">
          <input
            type="text"
            placeholder="Delegate to address (blank for self)"
            className="input input-bordered flex-grow font-mono bg-base-100/50 focus:bg-base-100 transition-colors rounded-lg"
            value={delegatee}
            onChange={e => setDelegatee(e.target.value)}
          />
          <button
            className="btn border-0 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/30 transition-all hover:scale-105 rounded-lg"
            onClick={handleDelegate}
          >
            Delegate
          </button>
        </div>
      </div>
    </div>
  );
};
