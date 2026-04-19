"use client";

import { useState } from "react";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const formatTokenAmount = (amount?: bigint, compact = false) => {
  if (amount === undefined) return "0";

  const value = Number(formatUnits(amount, 18));
  if (value === 0) return "0";
  if (compact && value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (compact && value >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
  if (value < 1) return value.toFixed(4);
  if (value < 10) return value.toFixed(3);
  return value.toFixed(2);
};

const formatExactTokenAmount = (amount?: bigint) => {
  if (amount === undefined) return "0";
  return formatUnits(amount, 18);
};

const zeroAddress = "0x0000000000000000000000000000000000000000";

export const VotingPower = () => {
  const { address } = useAccount();
  const [delegatee, setDelegatee] = useState("");

  const { data: votes } = useScaffoldReadContract({
    contractName: "RewardToken",
    functionName: "getVotes",
    args: [address],
  });

  const { data: balance } = useScaffoldReadContract({
    contractName: "RewardToken",
    functionName: "balanceOf",
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

  const isSelfDelegated = !!address && currentDelegate?.toLowerCase() === address.toLowerCase();
  const hasDelegate = !!currentDelegate && currentDelegate.toLowerCase() !== zeroAddress;

  return (
    <div
      className="rounded-xl shadow-lg"
      style={{
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
      }}
    >
      <div className="p-5">
        <h2
          className="text-base font-semibold tracking-wide mb-4"
          style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
        >
          Voting Power
        </h2>

        <div
          className="overflow-hidden rounded-xl"
          style={{ border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-elevated)" }}
        >
          <div className="grid grid-cols-2" style={{ borderLeft: "3px solid var(--accent)" }}>
            <div className="min-w-0 p-4" style={{ borderRight: "1px solid var(--border-subtle)" }}>
              <div
                className="text-[11px] font-semibold uppercase tracking-wider mb-2"
                style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}
              >
                Delegated votes
              </div>
              <div className="flex min-w-0 items-baseline gap-1.5" title={`${formatExactTokenAmount(votes)} RWRD`}>
                <span
                  className="text-xl font-bold leading-none truncate"
                  style={{ color: "var(--accent)", fontFamily: "var(--font-display)" }}
                >
                  {formatTokenAmount(votes, true)}
                </span>
                <span
                  className="text-[9px] font-semibold uppercase tracking-wider shrink-0"
                  style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}
                >
                  RWRD
                </span>
              </div>
              <div
                className="mt-1.5 text-[11px] font-medium"
                style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}
              >
                Voting power
              </div>
            </div>

            <div className="min-w-0 p-4">
              <div
                className="text-[11px] font-semibold uppercase tracking-wider mb-2"
                style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}
              >
                Token balance
              </div>
              <div className="flex min-w-0 items-baseline gap-1.5" title={`${formatExactTokenAmount(balance)} RWRD`}>
                <span
                  className="text-xl font-bold leading-none truncate"
                  style={{ color: "var(--success)", fontFamily: "var(--font-display)" }}
                >
                  {formatTokenAmount(balance, true)}
                </span>
                <span
                  className="text-[9px] font-semibold uppercase tracking-wider shrink-0"
                  style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}
                >
                  RWRD
                </span>
              </div>
              <div
                className="mt-1.5 text-[11px] font-medium"
                style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}
              >
                In wallet
              </div>
            </div>
          </div>

          <div className="p-4 space-y-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
            <div
              className="flex min-w-0 flex-col gap-1.5 rounded-lg px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
              style={{
                border: "1px solid var(--border-subtle)",
                backgroundColor: "var(--bg-surface)",
              }}
            >
              <div
                className="shrink-0 text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}
              >
                Delegated To
              </div>
              <div
                className="flex min-h-6 min-w-0 items-center overflow-hidden font-mono text-sm font-semibold"
                style={{ color: "var(--text-secondary)" }}
              >
                {isSelfDelegated ? (
                  <span style={{ color: "var(--text-primary)" }}>Self</span>
                ) : hasDelegate ? (
                  <Address address={currentDelegate} size="xs" />
                ) : (
                  <span style={{ color: "var(--text-muted)" }}>Not delegated</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[1fr_auto]">
              <input
                type="text"
                placeholder="Delegate to address (blank for self)"
                className="input input-bordered input-sm min-h-10 w-full rounded-lg font-mono text-sm governance-input"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-default)",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-mono)",
                }}
                value={delegatee}
                onChange={e => setDelegatee(e.target.value)}
              />
              <button
                className="btn btn-sm h-10 min-w-[5rem] rounded-lg text-white shadow-md transition-all hover:scale-[1.02]"
                style={{
                  background: "linear-gradient(135deg, var(--accent), var(--cyan))",
                  border: "none",
                  fontFamily: "var(--font-body)",
                }}
                onClick={handleDelegate}
              >
                Delegate
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
