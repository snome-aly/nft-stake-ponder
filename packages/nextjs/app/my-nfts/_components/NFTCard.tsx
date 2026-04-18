"use client";

import { motion } from "framer-motion";
import { type NFTWithStakeStatus } from "~~/hooks/usePonder";

const RARITY_CONFIG = {
  0: { name: "Common", color: "common", textColor: "var(--rarity-common)", bg: "var(--rarity-common-bg)" },
  1: { name: "Rare", color: "rare", textColor: "var(--rarity-rare)", bg: "var(--rarity-rare-bg)" },
  2: { name: "Epic", color: "epic", textColor: "var(--rarity-epic)", bg: "var(--rarity-epic-bg)" },
  3: { name: "Legendary", color: "legendary", textColor: "var(--rarity-legendary)", bg: "var(--rarity-legendary-bg)" },
} as const;

interface NFTCardProps {
  nft: NFTWithStakeStatus;
  priority?: boolean;
  isSelectable?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
}

export function NFTCard({ nft, isSelectable = false, isSelected = false, onSelect }: NFTCardProps) {
  const rarityConfig =
    nft.isRevealed && nft.rarity !== null ? RARITY_CONFIG[nft.rarity as keyof typeof RARITY_CONFIG] : null;

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
      <div className="aspect-square relative overflow-hidden" style={{ backgroundColor: "var(--bg-card)" }}>
        {nft.isRevealed && rarityConfig ? (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: rarityConfig.bg }}
          >
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center"
                style={{ backgroundColor: "var(--bg-elevated)" }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ color: rarityConfig.textColor }}>
                  <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <span
                className="text-sm font-semibold"
                style={{ fontFamily: "var(--font-display)", color: rarityConfig.textColor }}
              >
                {rarityConfig.name}
              </span>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center animate-pulse"
                style={{ backgroundColor: "var(--bg-card)" }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[var(--text-muted)]">
                  <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <span className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
                Not Revealed
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

        {/* Top Right Badge - Staked or Rarity */}
        {nft.isStaked ? (
          <div
            className="absolute top-3 right-3 px-2.5 py-1 rounded-full"
            style={{ backgroundColor: "var(--success-muted)", border: "1px solid rgba(16,185,129,0.3)" }}
          >
            <span className="text-xs font-medium" style={{ fontFamily: "var(--font-body)", color: "var(--success)" }}>
              Staked
            </span>
          </div>
        ) : (
          nft.isRevealed &&
          rarityConfig && (
            <div
              className="absolute top-3 right-3 px-2 py-1 rounded-lg"
              style={{ backgroundColor: rarityConfig.bg, border: `1px solid ${rarityConfig.textColor}30` }}
            >
              <span
                className="text-xs font-semibold"
                style={{ fontFamily: "var(--font-body)", color: rarityConfig.textColor }}
              >
                {rarityConfig.name}
              </span>
            </div>
          )
        )}

        {/* Batch Selection Checkbox */}
        {isSelectable && !nft.isStaked && nft.isRevealed && (
          <div className="absolute bottom-3 right-3 z-10">
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
        )}
      </div>

      {/* Info Section */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3
            className="text-sm font-semibold"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
          >
            StakableNFT #{nft.tokenId}
          </h3>
          {rarityConfig && (
            <span className="text-xs" style={{ fontFamily: "var(--font-body)", color: rarityConfig.textColor }}>
              {Number(nft.rarity) === 0
                ? "1.0×"
                : Number(nft.rarity) === 1
                  ? "1.5×"
                  : Number(nft.rarity) === 2
                    ? "2.0×"
                    : "3.0×"}
            </span>
          )}
        </div>

        {/* Minted Info */}
        <div className="space-y-1 text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
          <div className="flex justify-between">
            <span>Minted</span>
            <span>{new Date(nft.mintedAt * 1000).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
