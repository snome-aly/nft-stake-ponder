"use client";

import { useEffect, useMemo, useState } from "react";
import { CreateProposal } from "./_components/CreateProposal";
import { ProposalAction, ProposalCard } from "./_components/ProposalCard";
import { VotingPower } from "./_components/VotingPower";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { gql, request } from "graphql-request";
import type { NextPage } from "next";
import { keccak256, toBytes } from "viem";
import { useBlockNumber } from "wagmi";
import { ChevronLeftIcon, ChevronRightIcon, FunnelIcon } from "@heroicons/react/24/outline";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

const STATUS_OPTIONS = ["All", "Pending", "Active", "Succeeded", "Defeated", "Queued", "Executed", "Canceled"];

const PROPOSALS_QUERY = gql`
  query GetProposals($where: proposalFilter, $limit: Int, $after: String) {
    proposals(orderBy: "createdAt", orderDirection: "desc", where: $where, limit: $limit, after: $after) {
      items {
        id
        proposer
        description
        state
        startBlock
        endBlock
        canceled
        executed
        createdAt
        targets
        values
        calldatas
        forVotes
        againstVotes
        abstainVotes
        quorumVotes
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`;

const GovernancePage: NextPage = () => {
  // Cursor Pagination State
  // Cursor Pagination State
  const [cursorHistory, setCursorHistory] = useState<(string | null)[]>([null]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const afterCursor = cursorHistory[currentPageIndex];

  const pageSize = 6;

  // Filters & Block Snapshot
  const [statusFilter, setStatusFilter] = useState("All");
  const { data: currentBlock } = useBlockNumber({ watch: true });
  const [filterBlock, setFilterBlock] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (currentBlock && !filterBlock) setFilterBlock(currentBlock.toString());
  }, [currentBlock]);

  // Reset page when filter changes
  const handleFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    if (currentBlock) setFilterBlock(currentBlock.toString());
    setCursorHistory([null]);
    setCurrentPageIndex(0);
  };

  // Construct Where Clause
  const whereClause = useMemo(() => {
    if (!filterBlock && !currentBlock) return {};
    const block = filterBlock || currentBlock?.toString() || "0";

    switch (statusFilter) {
      case "Pending":
        return { startBlock_gt: block, canceled: false };
      case "Active":
        return { startBlock_lte: block, endBlock_gt: block, canceled: false, executed: false };
      case "Canceled":
        return { canceled: true };
      case "Executed":
        return { executed: true };
      case "Queued":
        return { state: 5 };
      case "Succeeded":
      case "Defeated":
        return { endBlock_lte: block, canceled: false, executed: false, state_not: 5 };
      default:
        return {}; // All
    }
  }, [statusFilter, filterBlock]);

  // Query: Fetch Paginated Data
  const { data: ponderData, isLoading: isPonderLoading } = useQuery({
    queryKey: ["proposals", statusFilter, afterCursor, filterBlock],
    queryFn: async () => {
      return request(process.env.NEXT_PUBLIC_PONDER_URL || "http://localhost:42069", PROPOSALS_QUERY, {
        where: whereClause,
        limit: pageSize,
        after: afterCursor,
      });
    },
    enabled: !!filterBlock || !!currentBlock,
    refetchInterval: 10000,
    placeholderData: previousData => previousData,
  });

  const proposals = (ponderData as any)?.proposals?.items || [];
  const pageInfo = (ponderData as any)?.proposals?.pageInfo;

  // Pure Client-Side Status Derivation
  const processedProposals = useMemo(() => {
    // We still use REAL currentBlock for display status (e.g. badge colors)
    // But the list content is stable based on filterBlock
    if (!proposals.length || !currentBlock) return [];
    return proposals.map((p: any) => {
      let status = "Unknown";
      const block = currentBlock; // Keep display live!
      const start = BigInt(p.startBlock);
      const end = BigInt(p.endBlock);

      if (p.canceled) {
        status = "Canceled";
      } else if (p.executed) {
        status = "Executed";
      } else if (p.state === 5) {
        status = "Queued";
      } else if (block < start) {
        status = "Pending";
      } else if (block <= end) {
        status = "Active";
      } else {
        // Finished: Calculate Outcome
        const forVotes = BigInt(p.forVotes || 0);
        const againstVotes = BigInt(p.againstVotes || 0);
        const abstainVotes = BigInt(p.abstainVotes || 0);
        const quorum = BigInt(p.quorumVotes || 0);

        const totalVotes = forVotes + againstVotes + abstainVotes;
        const quorumReached = totalVotes >= quorum;
        const voteSucceeded = forVotes > againstVotes;

        if (quorumReached && voteSucceeded) {
          status = "Succeeded";
        } else {
          status = "Defeated";
        }
      }
      return { ...p, status };
    });
  }, [proposals, currentBlock]);

  const handleNextPage = () => {
    if (pageInfo?.hasNextPage && pageInfo.endCursor) {
      const nextCursor = pageInfo.endCursor;
      if (currentPageIndex === cursorHistory.length - 1) {
        setCursorHistory(prev => [...prev, nextCursor]);
      }
      setCurrentPageIndex(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(prev => prev - 1);
    }
  };

  // Centralized Write Hook (Checks deployment ONLY ONCE per page) 🏆
  const { writeContractAsync } = useScaffoldWriteContract({ contractName: "MyGovernor" });

  const handleProposalAction = async (proposal: any, action: ProposalAction) => {
    try {
      switch (action.type) {
        case "vote": {
          await writeContractAsync({
            functionName: "castVote",
            args: [BigInt(proposal.id), action.support],
          });
          queryClient.invalidateQueries({ queryKey: ["proposals"] });
          break;
        }
        case "queue": {
          await writeContractAsync({
            functionName: "queue",
            args: getProposalArgs(proposal),
          });
          queryClient.invalidateQueries({ queryKey: ["proposals"] });
          break;
        }
        case "execute": {
          await writeContractAsync({
            functionName: "execute",
            args: getProposalArgs(proposal),
          });
          queryClient.invalidateQueries({ queryKey: ["proposals"] });
          break;
        }
      }
    } catch (err: any) {
      // Parse error message for user-friendly feedback
      const errMsg = err?.reason || err?.message || "";
      if (errMsg.includes("GovernorAlreadyCastVote")) {
        notification.error("You have already voted on this proposal.");
      } else if (errMsg.includes("GovernorNotActive")) {
        notification.error("This proposal is not currently active for voting.");
      } else if (errMsg.includes("Queueable")) {
        notification.error("This proposal has already been queued.");
      } else if (errMsg.includes("AlreadyExecuted")) {
        notification.error("This proposal has already been executed.");
      } else if (errMsg.includes("BelowProposalThreshold")) {
        notification.error("You do not have enough voting power to perform this action.");
      } else {
        notification.error("Transaction failed. Please try again.");
      }
    }
  };

  // Helper to reconstruct arguments for Queue/Execute
  const getProposalArgs = (proposal: any) => {
    const { targets, values, calldatas, description } = proposal;
    const descriptionHash = keccak256(toBytes(description));
    const valuesBigInt = values.map((v: string) => BigInt(v));
    return [targets as `0x${string}`[], valuesBigInt, calldatas as `0x${string}`[], descriptionHash] as const;
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundColor: "var(--bg-base)",
        backgroundImage: `radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.06) 0%, transparent 50%), radial-gradient(ellipse at 20% 80%, rgba(34,211,238,0.03) 0%, transparent 50%)`,
      }}
    >
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="container mx-auto px-4 pt-8 pb-10 relative z-10">
        <div className="mb-8 animate-slide-in-up text-center">
          <h1 className="mb-3" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
            <span className="block text-4xl font-bold mb-1" style={{ color: "var(--text-primary)", lineHeight: 1.1 }}>
              DAO Governance
            </span>
          </h1>
          <p
            className="mx-auto max-w-3xl text-center text-sm"
            style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)", lineHeight: 1.7 }}
          >
            Participate in the decision-making process. Vote on proposals and shape the future of the protocol.
          </p>
        </div>

        {/* Section Headers */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mb-6">
          <div className="lg:col-span-4 flex items-center gap-3">
            <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
            <h2
              className="text-lg font-semibold tracking-tight"
              style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
            >
              Dashboard
            </h2>
          </div>
          <div className="lg:col-span-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: "var(--cyan)" }} />
              <h2
                className="text-lg font-semibold tracking-tight"
                style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
              >
                Proposals
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <FunnelIcon className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
              <select
                className="select select-sm select-bordered text-xs font-semibold governance-select"
                style={{
                  fontFamily: "var(--font-body)",
                  backgroundColor: "var(--bg-elevated)",
                  borderColor: "var(--border-default)",
                  color: "var(--text-secondary)",
                }}
                value={statusFilter}
                onChange={e => handleFilterChange(e.target.value)}
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s} style={{ backgroundColor: "var(--bg-elevated)" }}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Content Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left Column: Dashboard Cards */}
          <div className="lg:col-span-4 space-y-6 animate-slide-in">
            <VotingPower />
            <CreateProposal />
          </div>

          {/* Right Column: Proposal List */}
          <div className="lg:col-span-8 animate-slide-in" style={{ animationDelay: "0.1s" }}>
            {isPonderLoading && !proposals.length ? (
              <div className="flex justify-center py-20 min-h-[400px]">
                <div className="loading loading-ring loading-lg text-primary"></div>
              </div>
            ) : (
              <div className="space-y-4 min-h-[400px]">
                {processedProposals.map((p: any) => (
                  <ProposalCard key={p.id} proposal={p} onAction={action => handleProposalAction(p, action)} />
                ))}

                {!processedProposals.length && !isPonderLoading && (
                  <div className="glass-light rounded-2xl p-12 text-center opacity-60 flex flex-col items-center justify-center h-full">
                    <span className="text-4xl mb-4">🔍</span>
                    <p className="text-xl font-semibold">No proposals found</p>
                    <p className="text-sm mt-2 opacity-60 max-w-xs">
                      No proposals match the &quot;{statusFilter}&quot; filter.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Pagination Controls */}
            <div className="flex justify-center items-center gap-4 mt-8">
              <button
                className="btn btn-circle btn-sm glass-medium border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                onClick={handlePrevPage}
                disabled={currentPageIndex === 0 || isPonderLoading}
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <span className="font-mono text-xs opacity-50 bg-base-100/20 px-3 py-1 rounded-full">
                Page {currentPageIndex + 1}
              </span>
              <button
                className="btn btn-circle btn-sm glass-medium border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                onClick={handleNextPage}
                disabled={!pageInfo?.hasNextPage || isPonderLoading}
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GovernancePage;
