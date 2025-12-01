/**
 * Enhanced Stats Bar Component
 *
 * Shows:
 * - Total NFTs count
 * - Staked NFTs count
 * - Available (unstaked) NFTs count
 * - Rarity distribution
 */

"use client";

type NFT = {
  rarity: number | null;
  isRevealed: boolean;
  isStaked?: boolean;
};

interface EnhancedStatsBarProps {
  nfts: NFT[];
}

const RARITY_CONFIG = {
  0: { name: "Common", textColor: "text-gray-400" },
  1: { name: "Rare", textColor: "text-blue-400" },
  2: { name: "Epic", textColor: "text-purple-400" },
  3: { name: "Legendary", textColor: "text-yellow-400" },
} as const;

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
    <div className="flex flex-col md:flex-row gap-4 mb-8">
      {/* Left: NFT Counts */}
      <div className="glass-card rounded-2xl p-6 border border-cyan-500/30 flex items-center justify-around min-w-[350px] gap-6">
        <div className="text-center">
          <div className="text-4xl font-bold text-white mb-1">{nfts.length}</div>
          <div className="text-gray-400 text-sm font-medium">Total</div>
        </div>

        <div className="h-12 w-px bg-gray-700/50" />

        <div className="text-center">
          <div className="text-4xl font-bold text-green-400 mb-1">{stakedCount}</div>
          <div className="text-gray-400 text-sm font-medium">Staked</div>
        </div>

        <div className="h-12 w-px bg-gray-700/50" />

        <div className="text-center">
          <div className="text-4xl font-bold text-cyan-400 mb-1">{availableCount}</div>
          <div className="text-gray-400 text-sm font-medium">Available</div>
        </div>
      </div>

      {/* Right: Rarity Distribution */}
      <div className="glass-card rounded-2xl p-6 border border-cyan-500/30 flex-grow flex items-center justify-around overflow-x-auto">
        <div className="flex items-center justify-between w-full px-4 min-w-[400px]">
          {Object.entries(RARITY_CONFIG).map(([rarity, config]) => (
            <div key={rarity} className="text-center">
              <div className={`text-3xl font-bold ${config.textColor}`}>{rarityCount[Number(rarity)] || 0}</div>
              <div className="text-gray-400 text-sm">{config.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
