"use client";

import { FadeInUp } from "~~/components/ui/AnimatedCard";
import { MintEvent, usePonderRecentMints } from "~~/hooks/usePonder";
import scaffoldConfig from "~~/scaffold.config";
import { getBlockExplorerTxLink } from "~~/utils/scaffold-eth";

const shortenAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

const formatTokenRange = ({ startTokenId, quantity }: MintEvent) => {
  if (quantity <= 1) return `#${startTokenId}`;
  return `#${startTokenId}-${startTokenId + quantity - 1}`;
};

const formatMintTime = (timestamp: number) => {
  const mintDate = new Date(timestamp * 1000);
  const now = new Date();
  const isSameDay = mintDate.toDateString() === now.toDateString();

  if (isSameDay) {
    return mintDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return mintDate.toLocaleDateString([], { month: "short", day: "numeric" });
};

const EmptyRecentMints = () => (
  <div className="text-center py-8">
    <div
      className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[var(--text-muted)]">
        <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
    <p className="text-sm mb-2" style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}>
      No mints yet
    </p>
    <p className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
      Be the first to mint a mystery blind box.
    </p>
  </div>
);

const RecentMintsSkeleton = () => (
  <div className="space-y-3">
    {[0, 1, 2].map(item => (
      <div
        key={item}
        className="h-16 rounded-xl animate-pulse"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
      />
    ))}
  </div>
);

export function RecentMints() {
  const { data: recentMints = [], isLoading, isError } = usePonderRecentMints(5);
  const chainId = scaffoldConfig.targetNetworks[0].id;

  return (
    <FadeInUp delay={0.2}>
      <div className="card p-5" style={{ backgroundColor: "var(--bg-elevated)" }}>
        <div className="flex items-center justify-between gap-4 mb-4">
          <h3
            className="text-sm font-semibold"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
          >
            Recent Mints
          </h3>
          <span
            className="rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.16em]"
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-muted)",
              fontFamily: "var(--font-body)",
            }}
          >
            Live
          </span>
        </div>

        {isLoading ? (
          <RecentMintsSkeleton />
        ) : isError ? (
          <div
            className="rounded-xl p-4 text-sm"
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-muted)",
              fontFamily: "var(--font-body)",
            }}
          >
            Ponder data unavailable. Recent mints will appear after the indexer is reachable.
          </div>
        ) : recentMints.length === 0 ? (
          <EmptyRecentMints />
        ) : (
          <div className="space-y-3">
            {recentMints.map(mint => {
              const txLink = getBlockExplorerTxLink(chainId, mint.transactionHash);

              return (
                <div
                  key={mint.id}
                  className="flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between"
                  style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="text-sm font-semibold"
                        style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
                      >
                        Minted {formatTokenRange(mint)}
                      </span>
                      {mint.quantity > 1 && (
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                          style={{
                            backgroundColor: "var(--accent-muted)",
                            border: "1px solid var(--accent-border)",
                            color: "var(--accent)",
                          }}
                        >
                          x{mint.quantity}
                        </span>
                      )}
                    </div>
                    <div
                      className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs"
                      style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}
                    >
                      <span>{shortenAddress(mint.to)}</span>
                      <span>Block {mint.blockNumber}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3 text-xs">
                    <span style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
                      {formatMintTime(mint.timestamp)}
                    </span>
                    {txLink && (
                      <a
                        href={txLink}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg px-3 py-2 font-medium transition-colors hover:border-[var(--accent-border)] hover:text-[var(--accent)]"
                        style={{
                          border: "1px solid var(--border-subtle)",
                          color: "var(--text-secondary)",
                          fontFamily: "var(--font-body)",
                        }}
                      >
                        Tx
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </FadeInUp>
  );
}
