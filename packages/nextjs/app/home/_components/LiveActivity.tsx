"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FadeInUp, StaggerContainer } from "~~/components/ui/AnimatedCard";
import { useScaffoldWatchContractEvent } from "~~/hooks/scaffold-eth";

interface MintEvent {
  transactionHash: string;
  owner: string;
  startTokenId: bigint;
  quantity: bigint;
  timestamp: number;
}

/**
 * LiveActivity - Tightened spacing, reduced container size
 */
export function LiveActivity() {
  const [recentMints, setRecentMints] = useState<MintEvent[]>([]);

  useScaffoldWatchContractEvent({
    contractName: "StakableNFT",
    eventName: "NFTMinted",
    onLogs: logs => {
      const newMints = logs.map(log => ({
        transactionHash: log.transactionHash || "",
        owner: log.args.to as string,
        startTokenId: log.args.startTokenId as bigint,
        quantity: log.args.quantity as bigint,
        timestamp: Date.now(),
      }));
      setRecentMints(prev => [...newMints, ...prev].slice(0, 12));
    },
  });

  return (
    <section
      style={{ backgroundColor: "var(--bg-surface)", paddingTop: "var(--space-12)", paddingBottom: "var(--space-12)" }}
    >
      <div className="container-premium">
        <FadeInUp className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h2
              className="text-xl font-bold"
              style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
            >
              Live Mint Activity
            </h2>
            <div
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "var(--success-muted)", border: "1px solid rgba(16,185,129,0.2)" }}
            >
              <motion.div
                className="w-1 h-1 rounded-full"
                style={{ backgroundColor: "var(--success)" }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--success)" }}>
                LIVE
              </span>
            </div>
          </div>
          <p className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}>
            Watch as collectors mint their blind boxes in real-time.
          </p>
        </FadeInUp>

        <div
          className="max-w-xl mx-auto rounded-xl overflow-hidden"
          style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
        >
          {recentMints.length > 0 ? (
            <div className="max-h-64 overflow-y-auto">
              <StaggerContainer staggerDelay={0.02}>
                {recentMints.map((mint, index) => (
                  <MintFeedItem key={`${mint.transactionHash}-${index}`} mint={mint} index={index} />
                ))}
              </StaggerContainer>
            </div>
          ) : (
            <div className="text-center py-10 px-6">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
                style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[var(--text-muted)]">
                  <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-sm mb-1" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
                Waiting for First Mint
              </p>
              <p className="text-xs mb-4" style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}>
                Be the first to mint a mystery blind box.
              </p>
              <a href="/mint" className="btn btn-primary btn-sm">
                Mint Now
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function MintFeedItem({ mint, index }: { mint: MintEvent; index: number }) {
  const [timeAgo, setTimeAgo] = useState("");
  const quantity = Number(mint.quantity);
  const tokenIds = Array.from({ length: quantity }, (_, i) => Number(mint.startTokenId) + i);

  useEffect(() => {
    const update = () => {
      const seconds = Math.floor((Date.now() - mint.timestamp) / 1000);
      if (seconds < 60) setTimeAgo(`${seconds}s ago`);
      else if (seconds < 3600) setTimeAgo(`${Math.floor(seconds / 60)}m ago`);
      else if (seconds < 86400) setTimeAgo(`${Math.floor(seconds / 3600)}h ago`);
      else setTimeAgo(`${Math.floor(seconds / 86400)}d ago`);
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [mint.timestamp]);

  return (
    <motion.div
      className="flex items-center justify-between px-4 py-3"
      style={{ backgroundColor: "var(--bg-elevated)", borderBottom: "1px solid var(--border-subtle)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: index * 0.02 }}
    >
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "var(--accent-muted)", border: "1px solid var(--accent-border)" }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-[var(--accent)]">
            <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className="text-xs font-mono truncate"
              style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}
            >
              {mint.owner.slice(0, 6)}...{mint.owner.slice(-4)}
            </span>
            <span className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}>
              minted
            </span>
            <span className="text-xs font-medium" style={{ fontFamily: "var(--font-body)", color: "var(--accent)" }}>
              {quantity} NFT{quantity > 1 ? "s" : ""}
            </span>
          </div>
          <div className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
            #{tokenIds.join(", #")} · {timeAgo}
          </div>
        </div>
      </div>

      {mint.transactionHash && (
        <a
          href={`https://etherscan.io/tx/${mint.transactionHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 flex-shrink-0 p-1 rounded"
          style={{ color: "var(--text-muted)" }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      )}
    </motion.div>
  );
}
