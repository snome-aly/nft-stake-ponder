"use client";

import { useState } from "react";
import { encodeFunctionData } from "viem";
import {
  CodeBracketIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  PaperAirplaneIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/outline";
import { useDeployedContractInfo, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export const CreateProposal = () => {
  const [rewardValue, setRewardValue] = useState("");
  const [description, setDescription] = useState("");

  const { data: poolInfo } = useDeployedContractInfo("NFTStakingPool");
  const { writeContractAsync: proposeAsync, isMining } = useScaffoldWriteContract("MyGovernor");

  const handlePropose = async () => {
    if (!poolInfo || !rewardValue || !description) return;

    try {
      // Encode setBaseReward(uint256)
      const calldata = encodeFunctionData({
        abi: poolInfo.abi,
        functionName: "setBaseReward",
        args: [BigInt(rewardValue)],
      });

      await proposeAsync({
        functionName: "propose",
        args: [
          [poolInfo.address], // targets
          [0n], // values
          [calldata], // calldatas
          description, // description
        ],
      });

      // Clear inputs
      setRewardValue("");
      setDescription("");
    } catch (e) {
      console.error("Error creating proposal:", e);
    }
  };

  return (
    <div className="card glass-medium shadow-xl mb-6 border-t-4 border-primary">
      <div className="card-body">
        <div className="flex items-center gap-2 mb-4">
          <PlusCircleIcon className="w-8 h-8 text-purple-500 -mt-1" />
          <h2 className="card-title text-2xl">Create Proposal</h2>
        </div>

        <p className="text-sm opacity-60 mb-6">
          Submit a new proposal to update the Staking Pool configuration. Currently supports updating the base reward
          rate.
        </p>

        {/* Target Information */}
        {poolInfo && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs font-mono text-blue-300 flex items-center gap-2">
            <CodeBracketIcon className="w-4 h-4 text-blue-400" />
            Target: <span className="opacity-90">{poolInfo.address}</span>
          </div>
        )}

        <div className="form-control w-full group">
          <label className="label">
            <div className="label-text flex items-center gap-2 font-semibold">
              <CurrencyDollarIcon className="w-4 h-4" />
              New Base Reward
            </div>
          </label>
          <input
            type="number"
            placeholder="e.g. 500"
            className="input input-bordered w-full transition-all rounded-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            value={rewardValue}
            onChange={e => setRewardValue(e.target.value)}
          />
          <label className="label">
            <span className="label-text-alt opacity-50">Units: Tokens per second (scaled)</span>
          </label>
        </div>

        <div className="form-control w-full mt-6">
          <label className="label">
            <div className="label-text flex items-center gap-2 font-semibold text-lg">
              <DocumentTextIcon className="w-5 h-5 text-pink-500" />
              Description
            </div>
            <span className="badge badge-ghost badge-sm font-mono opacity-60">Markdown Supported</span>
          </label>
          <textarea
            className="textarea textarea-bordered h-48 w-full transition-all text-base leading-relaxed p-4 shadow-sm rounded-lg"
            placeholder="# Proposal Title&#10;&#10;**Summary**&#10;Describe the reason for this update...&#10;&#10;**Motivation**&#10;Why now?"
            value={description}
            onChange={e => setDescription(e.target.value)}
          ></textarea>
          <label className="label">
            <span className="label-text-alt opacity-50 flex items-center gap-1">
              <span className="text-warning">*</span> Be specific about the changes.
            </span>
            <span className="label-text-alt opacity-40 font-mono">{description.length} chars</span>
          </label>
        </div>

        <div className="card-actions justify-end mt-8">
          <button
            className="btn btn-primary btn-wide gap-2"
            onClick={handlePropose}
            disabled={!poolInfo || !rewardValue || !description || isMining}
          >
            {isMining ? (
              <>
                <span className="loading loading-spinner"></span>
                <span>Proposing...</span>
              </>
            ) : (
              <>
                <PaperAirplaneIcon className="w-5 h-5" />
                <span>Submit Proposal</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
