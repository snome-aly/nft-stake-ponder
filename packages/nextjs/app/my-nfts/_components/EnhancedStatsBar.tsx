"use client";

import { type NFTWithStakeStatus } from "~~/hooks/usePonder";

const RARITY_CONFIG = {
  0: { name: "Common", color: "var(--rarity-common)" },
  1: { name: "Rare", color: "var(--rarity-rare)" },
  2: { name: "Epic", color: "var(--rarity-epic)" },
  3: { name: "Legendary", color: "var(--rarity-legendary)" },
} as const;

interface EnhancedStatsBarProps {
  nfts: NFTWithStakeStatus[];
}

export function EnhancedStatsBar({ nfts }: EnhancedStatsBarProps) {
  const rarityCount = nfts.reduce(
    (acc, nft) => {
      if (nft.isRevealed && nft.rarity !== null) {
        acc[nft.rarity] = (acc[nft.rarity] || 0) + 1;
      }
      return acc;
    },
    {} as Record<number, number>,
  );

  const stakedCount = nfts.filter(nft => nft.isStaked).length;
  const availableCount = nfts.length - stakedCount;

  return (
    <div className="flex flex-col lg:flex-row gap-4 mb-8">
      {/* Left: NFT Counts */}
      <div
        className="card p-5 flex items-center justify-around gap-6"
        style={{ backgroundColor: "var(--bg-elevated)" }}
      >
        <div className="text-center">
          <div
            className="text-3xl font-bold mb-1"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
          >
            {nfts.length}
          </div>
          <div className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
            Total
          </div>
        </div>

        <div className="h-10 w-px" style={{ backgroundColor: "var(--border-subtle)" }} />

        <div className="text-center">
          <div
            className="text-3xl font-bold mb-1"
            style={{ fontFamily: "var(--font-display)", color: "var(--success)" }}
          >
            {stakedCount}
          </div>
          <div className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
            Staked
          </div>
        </div>

        <div className="h-10 w-px" style={{ backgroundColor: "var(--border-subtle)" }} />

        <div className="text-center">
          <div
            className="text-3xl font-bold mb-1"
            style={{ fontFamily: "var(--font-display)", color: "var(--accent)" }}
          >
            {availableCount}
          </div>
          <div className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
            Available
          </div>
        </div>
      </div>

      {/* Right: Rarity Distribution */}
      <div
        className="card p-5 flex-grow flex items-center justify-around"
        style={{ backgroundColor: "var(--bg-elevated)" }}
      >
        <div className="flex items-center justify-between w-full px-4">
          {Object.entries(RARITY_CONFIG).map(([rarity, config]) => (
            <div key={rarity} className="text-center">
              <div
                className="text-2xl font-bold mb-1"
                style={{ fontFamily: "var(--font-display)", color: config.color }}
              >
                {rarityCount[Number(rarity)] || 0}
              </div>
              <div className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
                {config.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
