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

  const { data: poolInfo } = useDeployedContractInfo({ contractName: "NFTStakingPool" });
  const { writeContractAsync: proposeAsync, isMining } = useScaffoldWriteContract({ contractName: "MyGovernor" });

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
    <div
      className="rounded-xl shadow-lg"
      style={{
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
        borderTop: "2px solid var(--accent)",
      }}
    >
      <div className="card-body p-5 gap-4">
        <div className="flex items-center gap-2.5">
          <PlusCircleIcon className="w-6 h-6 shrink-0" style={{ color: "var(--accent)" }} />
          <h2
            className="text-base font-semibold tracking-wide"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
          >
            Create Proposal
          </h2>
        </div>

        <p
          className="text-sm leading-relaxed px-1"
          style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}
        >
          Submit a new proposal to update the Staking Pool configuration. Supports updating the base reward rate.
        </p>

        {/* Target Information */}
        {poolInfo && (
          <div
            className="rounded-lg p-3"
            style={{
              border: "1px solid rgba(139, 92, 246, 0.2)",
              backgroundColor: "rgba(139, 92, 246, 0.08)",
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <CodeBracketIcon className="h-4 w-4 shrink-0" style={{ color: "var(--accent)" }} />
              <span
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: "var(--accent)", fontFamily: "var(--font-body)" }}
              >
                Target
              </span>
            </div>
            <div
              className="font-mono text-xs break-words leading-relaxed rounded px-2.5 py-2"
              style={{
                backgroundColor: "rgba(0,0,0,0.3)",
                color: "var(--text-secondary)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {poolInfo.address}
            </div>
          </div>
        )}

        <div className="form-control gap-1.5">
          <label className="label px-1 py-0">
            <div
              className="label-text flex items-center gap-1.5 text-sm font-semibold"
              style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}
            >
              <CurrencyDollarIcon className="w-3.5 h-3.5" style={{ color: "var(--success)" }} />
              New Base Reward
            </div>
            <span
              className="label-text-alt text-[11px]"
              style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}
            >
              Tokens per second
            </span>
          </label>
          <input
            type="number"
            placeholder="e.g. 500"
            className="input input-bordered input-sm w-full governance-input transition-all rounded-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none]"
            style={{
              backgroundColor: "var(--bg-elevated)",
              borderColor: "var(--border-default)",
              color: "var(--text-primary)",
              fontFamily: "var(--font-body)",
            }}
            value={rewardValue}
            onChange={e => setRewardValue(e.target.value)}
          />
        </div>

        <div className="form-control gap-1.5">
          <label className="label px-1 py-0">
            <div
              className="label-text flex items-center gap-1.5 text-sm font-semibold"
              style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}
            >
              <DocumentTextIcon className="w-3.5 h-3.5" style={{ color: "var(--rarity-epic)" }} />
              Description
            </div>
            <span
              className="badge badge-ghost badge-xs font-mono"
              style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
            >
              Markdown
            </span>
          </label>
          <textarea
            className="textarea textarea-bordered w-full governance-input transition-all text-sm leading-relaxed p-3 rounded-lg min-h-[8rem] max-h-48 resize-y"
            style={{
              backgroundColor: "var(--bg-elevated)",
              borderColor: "var(--border-default)",
              color: "var(--text-primary)",
              fontFamily: "var(--font-body)",
            }}
            placeholder={
              "# Proposal Title\n\n**Summary**\nDescribe the reason for this update...\n\n**Motivation**\nWhy now?"
            }
            value={description}
            onChange={e => setDescription(e.target.value)}
          ></textarea>
          <label className="label px-1 py-0">
            <span
              className="label-text-alt text-[11px] flex items-center gap-1"
              style={{ color: "var(--warning)", fontFamily: "var(--font-body)" }}
            >
              <span>*</span> Be specific about the changes.
            </span>
            <span
              className="label-text-alt text-[11px] font-mono"
              style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
            >
              {description.length} chars
            </span>
          </label>
        </div>

        <div className="card-actions justify-end pt-2">
          <button
            className="btn btn-sm gap-2 px-5 text-white"
            style={{
              background: "linear-gradient(135deg, var(--accent), var(--cyan))",
              border: "none",
              fontFamily: "var(--font-body)",
            }}
            onClick={handlePropose}
            disabled={!poolInfo || !rewardValue || !description || isMining}
          >
            {isMining ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                <span>Proposing...</span>
              </>
            ) : (
              <>
                <PaperAirplaneIcon className="w-4 h-4" />
                <span>Submit Proposal</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
