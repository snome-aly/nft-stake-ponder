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
  const collectionStats = [
    { label: "Total", value: nfts.length, color: "var(--text-primary)" },
    { label: "Available", value: availableCount, color: "var(--accent)" },
    { label: "Staked", value: stakedCount, color: "var(--success)" },
  ];
  const rarityStats = Object.entries(RARITY_CONFIG).map(([rarity, config]) => ({
    label: config.name,
    value: rarityCount[Number(rarity)] || 0,
    color: config.color,
  }));

  const renderStat = (stat: { label: string; value: number; color: string }) => (
    <div key={stat.label} className="rounded-lg p-3" style={{ backgroundColor: "var(--bg-card)" }}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="truncate text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
          {stat.label}
        </span>
        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: stat.color }} />
      </div>
      <div className="text-2xl font-bold leading-none" style={{ fontFamily: "var(--font-display)", color: stat.color }}>
        {stat.value}
      </div>
    </div>
  );

  return (
    <div className="mb-8 grid gap-3 lg:grid-cols-[3fr_4fr]">
      <div className="card p-3" style={{ backgroundColor: "var(--bg-elevated)" }}>
        <div className="mb-2 px-1 text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
          Collection
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">{collectionStats.map(renderStat)}</div>
      </div>

      <div className="card p-3" style={{ backgroundColor: "var(--bg-elevated)" }}>
        <div className="mb-2 px-1 text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
          Rarity Distribution
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{rarityStats.map(renderStat)}</div>
      </div>
    </div>
  );
}
