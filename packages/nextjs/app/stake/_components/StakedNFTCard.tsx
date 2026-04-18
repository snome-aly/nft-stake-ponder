"use client";

import { motion } from "framer-motion";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { useNFTMetadata } from "~~/hooks/useNFTMetadata";

type StakedNFT = {
  tokenId: number;
  owner: `0x${string}`;
  stakedAt: bigint;
  lastClaimTime: bigint;
  pendingReward: bigint;
  rarity: number | null;
  rewardMultiplier: number;
};

interface StakedNFTCardProps {
  nft: StakedNFT;
  isSelected: boolean;
  onSelect: () => void;
  onClaim: () => Promise<void>;
  onUnstake: () => Promise<void>;
  isProcessing: boolean;
}

const RARITY_CONFIG = {
  0: { name: "Common", color: "var(--rarity-common)", bg: "var(--rarity-common-bg)" },
  1: { name: "Rare", color: "var(--rarity-rare)", bg: "var(--rarity-rare-bg)" },
  2: { name: "Epic", color: "var(--rarity-epic)", bg: "var(--rarity-epic-bg)" },
  3: { name: "Legendary", color: "var(--rarity-legendary)", bg: "var(--rarity-legendary-bg)" },
};

export function StakedNFTCard({ nft, isSelected, onSelect, onClaim, onUnstake, isProcessing }: StakedNFTCardProps) {
  const { data: tokenURI } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "tokenURI",
    args: [BigInt(nft.tokenId)],
  });

  const { imageUrl } = useNFTMetadata(tokenURI);
  const rarityIndex = nft.rarity ?? 0;
  const rarityConfig = RARITY_CONFIG[rarityIndex as keyof typeof RARITY_CONFIG];

  return (
    <motion.div
      className="card overflow-hidden"
      style={{
        backgroundColor: "var(--bg-elevated)",
        border: isSelected ? "2px solid var(--accent)" : "1px solid var(--border-subtle)",
      }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      {/* Image Section */}
      <div className="aspect-square relative overflow-hidden" style={{ backgroundColor: rarityConfig.bg }}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`StakableNFT #${nft.tokenId}`}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center"
                style={{ backgroundColor: "var(--bg-elevated)" }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ color: rarityConfig.color }}>
                  <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <span
                className="text-sm font-semibold"
                style={{ fontFamily: "var(--font-display)", color: rarityConfig.color }}
              >
                {rarityConfig.name}
              </span>
            </div>
          </div>
        )}

        {/* Token ID Badge */}
        <div className="absolute top-3 left-3 px-2 py-1 rounded-lg" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
          <span
            className="text-sm font-mono font-semibold"
            style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}
          >
            #{nft.tokenId}
          </span>
        </div>

        {/* Selection Checkbox */}
        <div className="absolute top-3 right-3 z-10">
          <button
            onClick={onSelect}
            className="w-6 h-6 rounded flex items-center justify-center transition-all"
            style={{
              backgroundColor: isSelected ? "var(--accent)" : "var(--bg-elevated)",
              border: `2px solid ${isSelected ? "var(--accent)" : "var(--border-subtle)"}`,
            }}
          >
            {isSelected && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-white">
                <path
                  d="M5 12l5 5L20 7"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-4">
        <div
          className="p-3 rounded-lg mb-3"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
        >
          <p className="text-xs mb-1" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
            Pending Reward
          </p>
          <p className="text-lg font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--accent)" }}>
            {(Number(nft.pendingReward) / 1e18).toFixed(4)} RWRD
          </p>
          <p className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
            ~{(nft.rewardMultiplier / 10000).toFixed(1)} RWRD/day
          </p>
        </div>

        <div className="flex gap-2">
          <button onClick={onClaim} disabled={isProcessing} className="btn btn-primary flex-1 py-2 text-sm">
            Claim
          </button>
          <button onClick={onUnstake} disabled={isProcessing} className="btn btn-secondary flex-1 py-2 text-sm">
            Unstake
          </button>
        </div>
      </div>
    </motion.div>
  );
}
