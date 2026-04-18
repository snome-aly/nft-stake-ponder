"use client";

import { Address } from "~~/components/scaffold-eth";

export type Proposal = {
  id: string;
  proposer: string;
  description: string;
  state: number;
  startBlock: string;
  endBlock: string;
  canceled: boolean;
  executed: boolean;
  createdAt: string;
  targets: string[];
  values: string[];
  calldatas: string[];
  status?: string;
};

const StatusBadge = ({ status }: { status: string }) => {
  let bg = "var(--bg-card)";
  let text = "var(--text-muted)";
  let border = "var(--border-subtle)";

  switch (status) {
    case "Active":
      bg = "var(--accent-muted)";
      text = "var(--accent)";
      border = "var(--accent-border)";
      break;
    case "Succeeded":
      bg = "var(--success-muted)";
      text = "var(--success)";
      border = "rgba(16,185,129,0.3)";
      break;
    case "Queued":
      bg = "var(--warning-muted)";
      text = "var(--warning)";
      border = "rgba(251,191,36,0.3)";
      break;
    case "Executed":
      bg = "rgba(139,92,246,0.15)";
      text = "var(--accent)";
      border = "rgba(139,92,246,0.3)";
      break;
    case "Defeated":
      bg = "rgba(239,68,68,0.15)";
      text = "#ef4444";
      border = "rgba(239,68,68,0.3)";
      break;
    case "Canceled":
      bg = "var(--bg-card)";
      text = "var(--text-muted)";
      border = "var(--border-subtle)";
      break;
  }

  return (
    <span
      className="px-2 py-0.5 rounded text-xs font-medium"
      style={{ backgroundColor: bg, color: text, border: `1px solid ${border}` }}
    >
      {status}
    </span>
  );
};

export type ProposalAction = { type: "vote"; support: 0 | 1 | 2 } | { type: "queue" } | { type: "execute" };

export function ProposalCard({
  proposal,
  onAction,
}: {
  proposal: Proposal;
  onAction: (action: ProposalAction) => void;
}) {
  const stateMap = ["Pending", "Active", "Canceled", "Defeated", "Succeeded", "Queued", "Expired", "Executed"];
  const realStatus = proposal.status || stateMap[proposal.state] || "Unknown";

  return (
    <div
      className="card p-5"
      style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
    >
      {/* Header: Status & ID */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col">
          <span
            className="text-xs font-mono mb-1"
            style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}
          >
            ID: {proposal.id.slice(0, 6)}...{proposal.id.slice(-4)}
          </span>
          <h3
            className="font-semibold text-base"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
          >
            {proposal.description}
          </h3>
        </div>
        <StatusBadge status={realStatus} />
      </div>

      {/* Meta Info */}
      <div
        className="flex flex-wrap gap-4 text-xs p-3 rounded-lg mb-4"
        style={{ backgroundColor: "var(--bg-card)", fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}
      >
        <div className="flex items-center gap-1">
          <span className="font-medium">Proposer:</span>
          <Address address={proposal.proposer} size="xs" />
        </div>
        <div className="flex items-center gap-1">
          <span>
            Block {proposal.startBlock} - {proposal.endBlock}
          </span>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex justify-end gap-2 pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        {realStatus === "Active" && (
          <>
            <button
              className="btn btn-sm"
              style={{
                backgroundColor: "var(--success-muted)",
                color: "var(--success)",
                border: "1px solid rgba(16,185,129,0.3)",
              }}
              onClick={() => onAction({ type: "vote", support: 1 })}
            >
              Support
            </button>
            <button
              className="btn btn-sm"
              style={{
                backgroundColor: "rgba(239,68,68,0.15)",
                color: "#ef4444",
                border: "1px solid rgba(239,68,68,0.3)",
              }}
              onClick={() => onAction({ type: "vote", support: 0 })}
            >
              Against
            </button>
          </>
        )}

        {realStatus === "Succeeded" && (
          <button className="btn btn-sm btn-primary" onClick={() => onAction({ type: "queue" })}>
            Queue
          </button>
        )}

        {realStatus === "Queued" && (
          <button className="btn btn-sm btn-primary" onClick={() => onAction({ type: "execute" })}>
            Execute
          </button>
        )}

        {realStatus === "Pending" && (
          <span className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
            Voting starts at block {proposal.startBlock}
          </span>
        )}
      </div>
    </div>
  );
}
