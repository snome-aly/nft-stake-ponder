"use client";

import { FadeInUp } from "~~/components/ui/AnimatedCard";

const rarityItems = [
  { name: "Common", count: 50, percentage: "50%", multiplier: "1.0×", color: "common" },
  { name: "Rare", count: 30, percentage: "30%", multiplier: "1.5×", color: "rare" },
  { name: "Epic", count: 15, percentage: "15%", multiplier: "2.0×", color: "epic" },
  { name: "Legendary", count: 5, percentage: "5%", multiplier: "3.0×", color: "legendary" },
];

const getRarityColors = (color: string) => {
  switch (color) {
    case "rare":
      return { text: "var(--rarity-rare)", bg: "var(--rarity-rare-bg)", border: "rgba(96,165,250,0.2)" };
    case "epic":
      return { text: "var(--rarity-epic)", bg: "var(--rarity-epic-bg)", border: "rgba(167,139,250,0.2)" };
    case "legendary":
      return { text: "var(--rarity-legendary)", bg: "var(--rarity-legendary-bg)", border: "rgba(251,191,36,0.2)" };
    default:
      return { text: "var(--rarity-common)", bg: "var(--rarity-common-bg)", border: "rgba(113,113,122,0.2)" };
  }
};

export function RarityInfo() {
  return (
    <FadeInUp>
      <div className="card p-5" style={{ backgroundColor: "var(--bg-elevated)" }}>
        <h3
          className="text-sm font-semibold mb-4 text-center"
          style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
        >
          Rarity Distribution
        </h3>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {rarityItems.map(rarity => {
            const colors = getRarityColors(rarity.color);
            return (
              <div
                key={rarity.name}
                className="p-3 rounded-lg text-center"
                style={{
                  backgroundColor: colors.bg,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <div
                  className="text-sm font-semibold mb-1"
                  style={{ fontFamily: "var(--font-body)", color: colors.text }}
                >
                  {rarity.name}
                </div>
                <div className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}>
                  {rarity.count} · {rarity.percentage} · {rarity.multiplier}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
          Higher rarity = Higher staking rewards
        </p>
      </div>
    </FadeInUp>
  );
}
