"use client";

import {
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  PlayCircleIcon,
  QueueListIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
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
  status?: string; // Derived client-side status
};

const StatusBadge = ({ status }: { status: string }) => {
  let styleClass = "bg-gray-500/20 text-gray-400 border-gray-500/30";

  switch (status) {
    case "Active":
      styleClass = "bg-blue-500/20 text-blue-300 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)] animate-pulse";
      break;
    case "Succeeded":
      styleClass = "bg-green-500/20 text-green-400 border-green-500/50 shadow-[0_0_10px_rgba(74,222,128,0.2)]";
      break;
    case "Queued":
      styleClass = "bg-orange-500/20 text-orange-400 border-orange-500/50 shadow-[0_0_10px_rgba(251,146,60,0.2)]";
      break;
    case "Executed":
      styleClass = "bg-purple-500/20 text-purple-400 border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.2)]";
      break;
    case "Defeated":
      styleClass = "bg-red-500/20 text-red-500 border-red-500/50";
      break;
    case "Canceled":
      styleClass = "bg-gray-500/20 text-gray-500 border-gray-500/50";
      break;
  }

  return (
    <div className={`px-2 py-0.5 rounded border text-[10px] font-black tracking-widest uppercase ${styleClass}`}>
      {status}
    </div>
  );
};

// Define action types for type safety
export type ProposalAction = { type: "vote"; support: 0 | 1 | 2 } | { type: "queue" } | { type: "execute" };

export const ProposalCard = ({
  proposal,
  onAction,
}: {
  proposal: Proposal;
  onAction: (action: ProposalAction) => void;
}) => {
  // We now use the Derived Status calculated in page.tsx
  // This eliminates 1 RPC call per card! 🚀
  const stateMap = ["Pending", "Active", "Canceled", "Defeated", "Succeeded", "Queued", "Expired", "Executed"];
  const realStatus = proposal.status || stateMap[proposal.state] || "Unknown";

  // Args construction moved to page.tsx to keep Card pure UI

  return (
    <div className="card glass-medium shadow-md mb-6 border border-white/10 transition-all hover:shadow-xl hover:-translate-y-1">
      <div className="card-body p-6">
        {/* Header: Status & ID */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-col">
            <span className="text-xs font-mono opacity-50 mb-1">
              ID: {proposal.id.slice(0, 6)}...{proposal.id.slice(-4)}
            </span>
            <h3 className="font-bold text-xl leading-tight">{proposal.description}</h3>
          </div>
          <StatusBadge status={realStatus} />
        </div>

        {/* Meta Info */}
        <div className="flex flex-wrap gap-4 text-sm opacity-70 mb-6 bg-base-100/30 rounded-lg p-3 backdrop-blur-sm">
          <div className="flex items-center gap-1">
            <span className="font-semibold">Proposer:</span>
            <Address address={proposal.proposer} size="xs" />
          </div>
          <div className="flex items-center gap-1" title="Voting Period">
            <CalendarIcon className="w-4 h-4" />
            <span>
              Block {proposal.startBlock} - {proposal.endBlock}
            </span>
          </div>
        </div>

        {/* Action Bar */}
        <div className="card-actions justify-end border-t border-base-200 pt-4 gap-2">
          {realStatus === "Active" && (
            <>
              <button
                className="btn btn-success btn-sm text-white gap-2"
                onClick={() => onAction({ type: "vote", support: 1 })}
              >
                <CheckCircleIcon className="w-4 h-4" />
                Support
              </button>
              <button
                className="btn btn-error btn-sm text-white gap-2"
                onClick={() => onAction({ type: "vote", support: 0 })}
              >
                <XCircleIcon className="w-4 h-4" />
                Against
              </button>
            </>
          )}

          {realStatus === "Succeeded" && (
            <button className="btn btn-warning btn-sm gap-2" onClick={() => onAction({ type: "queue" })}>
              <QueueListIcon className="w-4 h-4" />
              Queue
            </button>
          )}

          {realStatus === "Queued" && (
            <button className="btn btn-primary btn-sm gap-2" onClick={() => onAction({ type: "execute" })}>
              <PlayCircleIcon className="w-4 h-4" />
              Execute
            </button>
          )}

          {/* Pending State or Others */}
          {realStatus === "Pending" && (
            <div className="flex items-center gap-2 text-warning text-sm">
              <ClockIcon className="w-4 h-4" />
              <span>Voting starts at block {proposal.startBlock}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
