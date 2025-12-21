"use client";

import { useEffect, useMemo, useState } from "react";
import { CreateProposal } from "./_components/CreateProposal";
import { ProposalAction, ProposalCard } from "./_components/ProposalCard";
import { VotingPower } from "./_components/VotingPower";
import { useQuery } from "@tanstack/react-query";
import { gql, request } from "graphql-request";
import type { NextPage } from "next";
import { keccak256, toBytes } from "viem";
import { useBlockNumber } from "wagmi";
import { ChevronLeftIcon, ChevronRightIcon, FunnelIcon } from "@heroicons/react/24/outline";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

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
    switch (action.type) {
      case "vote":
        await writeContractAsync({
          functionName: "castVote",
          args: [BigInt(proposal.id), action.support],
        });
        break;
      case "queue":
        await writeContractAsync({
          functionName: "queue",
          args: getProposalArgs(proposal),
        });
        break;
      case "execute":
        await writeContractAsync({
          functionName: "execute",
          args: getProposalArgs(proposal),
        });
        break;
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
    <div className="min-h-screen bg-base-300 bg-grid-pattern relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float-slow"></div>
      <div className="absolute top-1/2 -right-32 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>

      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="text-center mb-12 animate-slide-in-up">
          <h1 className="text-5xl font-black mb-4 tracking-tight">
            DAO <span className="text-gradient-purple">Governance</span>
          </h1>
          <p className="text-lg opacity-60 max-w-4xl mx-auto font-light">
            Participate in the decision-making process. Vote on proposals and shape the future of the protocol.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Dashboard */}
          <div className="lg:col-span-4 space-y-8 animate-slide-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 bg-purple-500 rounded-full"></div>
              <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
            </div>
            <div className="glass-light rounded-2xl p-1 shadow-lg ring-1 ring-white/10">
              <VotingPower />
            </div>
            <div className="glass-light rounded-2xl p-1 shadow-lg ring-1 ring-white/10">
              <CreateProposal />
            </div>
          </div>

          {/* Right Column: Proposals */}
          <div className="lg:col-span-8 animate-slide-in" style={{ animationDelay: "0.1s" }}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-blue-500 rounded-full"></div>
                <h2 className="text-2xl font-bold tracking-tight">Proposals</h2>
              </div>

              {/* Filter Dropdown */}
              <div className="flex items-center gap-2">
                <FunnelIcon className="w-5 h-5 text-base-content/50" />
                <select
                  className="select select-sm select-bordered glass-medium w-full max-w-xs text-xs font-semibold focus:ring-2 focus:ring-purple-500"
                  value={statusFilter}
                  onChange={e => handleFilterChange(e.target.value)}
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {isPonderLoading && !proposals.length ? (
              <div className="flex justify-center py-20 min-h-[600px]">
                <div className="loading loading-ring loading-lg text-primary"></div>
              </div>
            ) : (
              <div className="space-y-6 min-h-[600px]">
                {processedProposals.map((p: any) => (
                  <div key={p.id} className="transform transition-all duration-300 hover:-translate-y-1">
                    <ProposalCard proposal={p} onAction={action => handleProposalAction(p, action)} />
                  </div>
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
