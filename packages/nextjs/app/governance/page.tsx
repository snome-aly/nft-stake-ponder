"use client";

import { useEffect, useMemo, useState } from "react";
import { CreateProposal } from "./_components/CreateProposal";
import { type ProposalAction, ProposalCard } from "./_components/ProposalCard";
import { VotingPower } from "./_components/VotingPower";
import { useQuery } from "@tanstack/react-query";
import { gql, request } from "graphql-request";
import { keccak256, toBytes } from "viem";
import { useBlockNumber } from "wagmi";
import { FadeInUp } from "~~/components/ui/AnimatedCard";
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

const PONDER_URL = process.env.NEXT_PUBLIC_PONDER_URL || "http://localhost:42069";

export default function GovernancePage() {
  const [cursorHistory, setCursorHistory] = useState<(string | null)[]>([null]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const afterCursor = cursorHistory[currentPageIndex];

  const pageSize = 6;

  const [statusFilter, setStatusFilter] = useState("All");
  const { data: currentBlock } = useBlockNumber({ watch: true });
  const [filterBlock, setFilterBlock] = useState<string | null>(null);

  useEffect(() => {
    if (currentBlock && !filterBlock) setFilterBlock(currentBlock.toString());
  }, [currentBlock]);

  const handleFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    if (currentBlock) setFilterBlock(currentBlock.toString());
    setCursorHistory([null]);
    setCurrentPageIndex(0);
  };

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
        return {};
    }
  }, [statusFilter, filterBlock]);

  const { data: ponderData, isLoading: isPonderLoading } = useQuery({
    queryKey: ["proposals", statusFilter, afterCursor, filterBlock],
    queryFn: async () => {
      return request(PONDER_URL, PROPOSALS_QUERY, {
        where: whereClause,
        limit: pageSize,
        after: afterCursor,
      });
    },
    enabled: !!filterBlock || !!currentBlock,
    refetchInterval: 10000,
    placeholderData: (previousData: any) => previousData,
  });

  const proposals = (ponderData as any)?.proposals?.items || [];
  const pageInfo = (ponderData as any)?.proposals?.pageInfo;

  const processedProposals = useMemo(() => {
    if (!proposals.length || !currentBlock) return [];
    return proposals.map((p: any) => {
      let status = "Unknown";
      const block = currentBlock;
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

  const getProposalArgs = (proposal: any) => {
    const { targets, values, calldatas, description } = proposal;
    const descriptionHash = keccak256(toBytes(description));
    const valuesBigInt = values.map((v: string) => BigInt(v));
    return [targets as `0x${string}`[], valuesBigInt, calldatas as `0x${string}`[], descriptionHash] as const;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-base)" }}>
      <section className="py-12">
        <div className="container-premium">
          <FadeInUp className="text-center mb-12">
            <h1
              className="text-4xl font-bold mb-4"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em", color: "var(--text-primary)" }}
            >
              DAO Governance
            </h1>
            <p
              className="text-base max-w-xl mx-auto"
              style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)", lineHeight: 1.7 }}
            >
              Participate in the decision-making process. Vote on proposals and shape the future of the protocol.
            </p>
          </FadeInUp>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Dashboard */}
            <div className="lg:col-span-4 space-y-6">
              <VotingPower />
              <CreateProposal />
            </div>

            {/* Right Column: Proposals */}
            <div className="lg:col-span-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
                  <h2
                    className="text-xl font-semibold"
                    style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
                  >
                    Proposals
                  </h2>
                </div>

                <select
                  className="select"
                  style={{
                    backgroundColor: "var(--bg-card)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-primary)",
                  }}
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

              {isPonderLoading && !proposals.length ? (
                <div className="flex justify-center py-20">
                  <div
                    className="w-8 h-8 rounded-full animate-spin"
                    style={{
                      border: "2px solid var(--accent-muted)",
                      borderTopColor: "var(--accent)",
                    }}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {processedProposals.map((p: any) => (
                    <ProposalCard key={p.id} proposal={p} onAction={action => handleProposalAction(p, action)} />
                  ))}

                  {!processedProposals.length && !isPonderLoading && (
                    <div className="card p-12 text-center" style={{ backgroundColor: "var(--bg-elevated)" }}>
                      <p
                        className="text-base"
                        style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
                      >
                        No proposals found
                      </p>
                      <p
                        className="text-sm mt-2"
                        style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}
                      >
                        No proposals match the &quot;{statusFilter}&quot; filter.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Pagination Controls */}
              <div className="flex justify-center items-center gap-4 mt-8">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPageIndex === 0 || isPonderLoading}
                  className="btn btn-ghost btn-sm"
                >
                  ← Prev
                </button>
                <span
                  className="text-xs px-3 py-1 rounded-full"
                  style={{
                    fontFamily: "var(--font-mono)",
                    backgroundColor: "var(--bg-card)",
                    color: "var(--text-muted)",
                  }}
                >
                  Page {currentPageIndex + 1}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={!pageInfo?.hasNextPage || isPonderLoading}
                  className="btn btn-ghost btn-sm"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
