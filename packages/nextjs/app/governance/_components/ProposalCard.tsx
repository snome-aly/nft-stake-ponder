"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { decodeFunctionData, formatUnits } from "viem";
import {
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
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
  status?: string;
  forVotes?: string;
  againstVotes?: string;
  abstainVotes?: string;
  quorumVotes?: string;
};

const StatusBadge = ({ status }: { status: string }) => {
  let style: React.CSSProperties = {
    backgroundColor: "rgba(113, 113, 122, 0.2)",
    color: "#a1a1aa",
    borderColor: "rgba(113, 113, 122, 0.3)",
  };

  switch (status) {
    case "Active":
      style = {
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        color: "#93c5fd",
        borderColor: "rgba(59, 130, 246, 0.4)",
        boxShadow: "0 0 12px rgba(59, 130, 246, 0.3)",
      };
      break;
    case "Succeeded":
      style = {
        backgroundColor: "rgba(16, 185, 129, 0.2)",
        color: "#6ee7b7",
        borderColor: "rgba(16, 185, 129, 0.4)",
        boxShadow: "0 0 8px rgba(16, 185, 129, 0.15)",
      };
      break;
    case "Queued":
      style = {
        backgroundColor: "rgba(251, 146, 60, 0.2)",
        color: "#fdba74",
        borderColor: "rgba(251, 146, 60, 0.4)",
        boxShadow: "0 0 8px rgba(251, 146, 60, 0.15)",
      };
      break;
    case "Executed":
      style = {
        backgroundColor: "rgba(139, 92, 246, 0.2)",
        color: "#c4b5fd",
        borderColor: "rgba(139, 92, 246, 0.4)",
        boxShadow: "0 0 8px rgba(139, 92, 246, 0.15)",
      };
      break;
    case "Defeated":
      style = {
        backgroundColor: "rgba(239, 68, 68, 0.2)",
        color: "#fca5a5",
        borderColor: "rgba(239, 68, 68, 0.4)",
      };
      break;
    case "Canceled":
      style = {
        backgroundColor: "rgba(113, 113, 122, 0.2)",
        color: "#a1a1aa",
        borderColor: "rgba(113, 113, 122, 0.4)",
      };
      break;
  }

  return (
    <div className="px-2 py-0.5 rounded border text-[10px] font-black tracking-wider uppercase shrink-0" style={style}>
      {status}
    </div>
  );
};

export type ProposalAction = { type: "vote"; support: 0 | 1 | 2 } | { type: "queue" } | { type: "execute" };

const stakingPoolGovernanceAbi = [
  {
    type: "function",
    name: "setBaseReward",
    inputs: [{ name: "newReward", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

const getBaseRewardChange = (proposal: Proposal) => {
  for (const calldata of proposal.calldatas) {
    try {
      const decoded = decodeFunctionData({
        abi: stakingPoolGovernanceAbi,
        data: calldata as `0x${string}`,
      });

      if (decoded.functionName === "setBaseReward") {
        return decoded.args[0];
      }
    } catch {
      // Ignore actions that are not setBaseReward.
    }
  }

  return undefined;
};

const formatRewardRate = (rewardPerSecond: bigint) => {
  const rwrdPerDay = formatUnits(rewardPerSecond * 86400n, 18);
  const [whole, fraction = ""] = rwrdPerDay.split(".");
  const trimmedFraction = fraction.slice(0, 4).replace(/0+$/, "");

  return trimmedFraction ? `${whole}.${trimmedFraction}` : whole;
};

const stripInlineMarkdown = (value: string) =>
  value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`~]/g, "")
    .trim();

const getProposalContent = (description: string) => {
  const trimmed = description.trim();
  if (!trimmed) return { title: "Untitled Proposal", body: "" };

  const lines = trimmed.split(/\r?\n/);
  const firstContentIndex = lines.findIndex(line => line.trim().length > 0);
  const firstContent = lines[firstContentIndex]?.trim() || "";
  const headingMatch = firstContent.match(/^#{1,6}\s+(.+)$/);

  if (headingMatch) {
    return {
      title: stripInlineMarkdown(headingMatch[1]),
      body: lines
        .filter((_, index) => index !== firstContentIndex)
        .join("\n")
        .trim(),
    };
  }

  return {
    title: stripInlineMarkdown(firstContent),
    body: lines
      .slice(firstContentIndex + 1)
      .join("\n")
      .trim(),
  };
};

export const ProposalCard = ({
  proposal,
  onAction,
}: {
  proposal: Proposal;
  onAction: (action: ProposalAction) => void;
}) => {
  const stateMap = ["Pending", "Active", "Canceled", "Defeated", "Succeeded", "Queued", "Expired", "Executed"];
  const realStatus = proposal.status || stateMap[proposal.state] || "Unknown";

  const forVotes = Number(BigInt(proposal.forVotes || 0));
  const againstVotes = Number(BigInt(proposal.againstVotes || 0));
  const abstainVotes = Number(BigInt(proposal.abstainVotes || 0));
  const totalVotes = forVotes + againstVotes + abstainVotes;
  const forPercent = totalVotes > 0 ? (forVotes / totalVotes) * 100 : 0;
  const againstPercent = totalVotes > 0 ? (againstVotes / totalVotes) * 100 : 0;
  const newBaseReward = getBaseRewardChange(proposal);
  const proposalContent = getProposalContent(proposal.description);

  const formatCompact = (n: number) => {
    if (n === 0) return "0";
    if (n >= 1e24) return `${(n / 1e24).toFixed(1)}Y`;
    if (n >= 1e21) return `${(n / 1e21).toFixed(1)}Z`;
    if (n >= 1e18) return `${(n / 1e18).toFixed(1)}E`;
    if (n >= 1e15) return `${(n / 1e15).toFixed(1)}P`;
    if (n >= 1e12) return `${(n / 1e12).toFixed(1)}T`;
    if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
    return n.toFixed(0);
  };

  const showVoteStats = ["Active", "Succeeded", "Defeated", "Queued", "Executed"].includes(realStatus);

  return (
    <div
      className="rounded-lg transition-all duration-300 hover:shadow-md"
      style={{
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
      }}
    >
      <div className="p-3 flex flex-col gap-2">
        {/* Header Row */}
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <StatusBadge status={realStatus} />
              <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                {proposal.id.slice(0, 6)}...{proposal.id.slice(-4)}
              </span>
            </div>
            <h3
              className="font-bold text-sm leading-snug break-words"
              style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
              title={proposalContent.title}
            >
              {proposalContent.title}
            </h3>
          </div>
        </div>

        {/* Meta Row */}
        <div
          className="flex items-center gap-3 text-[11px]"
          style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}
        >
          <div className="flex items-center gap-1">
            <Address address={proposal.proposer} size="xs" />
          </div>
          <div className="flex items-center gap-1">
            <CalendarIcon className="w-3 h-3" style={{ color: "var(--text-muted)" }} />
            <span>
              {Number(proposal.startBlock).toLocaleString()}-{Number(proposal.endBlock).toLocaleString()}
            </span>
          </div>
          {realStatus === "Pending" && (
            <div className="flex items-center gap-1" style={{ color: "var(--warning)" }}>
              <ClockIcon className="w-3 h-3" />
              <span>Starts block {Number(proposal.startBlock).toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Markdown Description */}
        {proposalContent.body && (
          <div
            className="rounded-md px-3 py-2.5 text-xs leading-relaxed"
            style={{
              backgroundColor: "rgba(255,255,255,0.025)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-tertiary)",
              fontFamily: "var(--font-body)",
            }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              skipHtml
              components={{
                h1: ({ children }) => (
                  <h4
                    className="mb-1.5 text-sm font-semibold"
                    style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}
                  >
                    {children}
                  </h4>
                ),
                h2: ({ children }) => (
                  <h4
                    className="mb-1.5 text-sm font-semibold"
                    style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}
                  >
                    {children}
                  </h4>
                ),
                h3: ({ children }) => (
                  <h5
                    className="mb-1 text-xs font-semibold uppercase tracking-[0.12em]"
                    style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}
                  >
                    {children}
                  </h5>
                ),
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                strong: ({ children }) => (
                  <strong className="font-semibold" style={{ color: "var(--text-secondary)" }}>
                    {children}
                  </strong>
                ),
                ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-4 last:mb-0">{children}</ul>,
                ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-4 last:mb-0">{children}</ol>,
                li: ({ children }) => <li className="pl-1">{children}</li>,
                code: ({ children }) => (
                  <code
                    className="rounded px-1 py-0.5 text-[11px]"
                    style={{
                      backgroundColor: "rgba(0,0,0,0.28)",
                      color: "var(--text-secondary)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {children}
                  </code>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2"
                    style={{ color: "var(--accent)" }}
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {proposalContent.body}
            </ReactMarkdown>
          </div>
        )}

        {/* Proposal Details */}
        {newBaseReward !== undefined && (
          <div
            className="grid gap-2 rounded-md px-3 py-2.5 sm:grid-cols-[minmax(0,1fr)_auto]"
            style={{
              backgroundColor: "rgba(139, 92, 246, 0.08)",
              border: "1px solid rgba(139, 92, 246, 0.18)",
            }}
          >
            <div className="flex min-w-0 items-center gap-2">
              <CurrencyDollarIcon className="h-4 w-4 shrink-0" style={{ color: "var(--accent)" }} />
              <div className="min-w-0">
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.16em]"
                  style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}
                >
                  New Base Reward
                </p>
                <p
                  className="truncate text-sm font-semibold"
                  style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
                  title={`${newBaseReward.toString()} wei/sec`}
                >
                  {newBaseReward.toString()} wei/sec
                </p>
              </div>
            </div>
            <div
              className="rounded-md px-2.5 py-1.5 text-left sm:text-right"
              style={{
                backgroundColor: "rgba(0,0,0,0.18)",
                color: "var(--text-secondary)",
                fontFamily: "var(--font-body)",
              }}
            >
              <div className="text-[10px] uppercase tracking-[0.14em]" style={{ color: "var(--text-muted)" }}>
                1x NFT Daily
              </div>
              <div className="text-xs font-semibold">{formatRewardRate(newBaseReward)} RWRD</div>
            </div>
          </div>
        )}

        {/* Vote Stats */}
        {showVoteStats && (
          <div className="flex items-center gap-3">
            <div
              className="flex-1 flex h-1.5 rounded-full overflow-hidden"
              style={{ backgroundColor: "var(--bg-base)" }}
            >
              {forPercent > 0 && <div style={{ width: `${forPercent}%`, backgroundColor: "var(--success)" }} />}
              {againstPercent > 0 && <div style={{ width: `${againstPercent}%`, backgroundColor: "var(--error)" }} />}
            </div>
            <div className="flex items-center gap-1.5 text-[10px]" style={{ fontFamily: "var(--font-body)" }}>
              <span style={{ color: "var(--success)" }}>✓</span>
              <span className="font-semibold" style={{ color: "var(--text-secondary)" }}>
                {formatCompact(forVotes)}
              </span>
              <span style={{ color: "var(--error)" }}>✗</span>
              <span className="font-semibold" style={{ color: "var(--text-secondary)" }}>
                {formatCompact(againstVotes)}
              </span>
            </div>
          </div>
        )}

        {/* Action Row */}
        {realStatus === "Active" && (
          <div className="flex items-center justify-end gap-1.5">
            <button
              className="btn btn-xs gap-1 text-white"
              style={{ backgroundColor: "var(--success)", border: "none", fontFamily: "var(--font-body)" }}
              onClick={() => onAction({ type: "vote", support: 1 })}
            >
              <CheckCircleIcon className="w-3 h-3" />
              For
            </button>
            <button
              className="btn btn-xs gap-1 text-white"
              style={{ backgroundColor: "var(--error)", border: "none", fontFamily: "var(--font-body)" }}
              onClick={() => onAction({ type: "vote", support: 0 })}
            >
              <XCircleIcon className="w-3 h-3" />
              Against
            </button>
          </div>
        )}
        {realStatus === "Succeeded" && (
          <div className="flex items-center justify-end">
            <button
              className="btn btn-xs gap-1 text-white"
              style={{ backgroundColor: "var(--warning)", border: "none", fontFamily: "var(--font-body)" }}
              onClick={() => onAction({ type: "queue" })}
            >
              <QueueListIcon className="w-3 h-3" />
              Queue
            </button>
          </div>
        )}
        {realStatus === "Queued" && (
          <div className="flex items-center justify-end">
            <button
              className="btn btn-xs gap-1 text-white"
              style={{
                background: "linear-gradient(135deg, var(--accent), var(--cyan))",
                border: "none",
                fontFamily: "var(--font-body)",
              }}
              onClick={() => onAction({ type: "execute" })}
            >
              <PlayCircleIcon className="w-3 h-3" />
              Execute
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
