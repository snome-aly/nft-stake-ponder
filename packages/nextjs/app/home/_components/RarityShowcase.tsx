"use client";

import { motion } from "framer-motion";
import { FadeInUp, StaggerContainer } from "~~/components/ui/AnimatedCard";

const rarityData = [
  { name: "Common", quantity: 50, percentage: 50, multiplier: "1.0×", multiplierValue: 10000, color: "common" },
  { name: "Rare", quantity: 30, percentage: 30, multiplier: "1.5×", multiplierValue: 15000, color: "rare" },
  { name: "Epic", quantity: 15, percentage: 15, multiplier: "2.0×", multiplierValue: 20000, color: "epic" },
  { name: "Legendary", quantity: 5, percentage: 5, multiplier: "3.0×", multiplierValue: 30000, color: "legendary" },
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

/**
 * RarityShowcase - Tighter grid and table, reduced padding
 */
export function RarityShowcase() {
  return (
    <section
      style={{ backgroundColor: "var(--bg-base)", paddingTop: "var(--space-12)", paddingBottom: "var(--space-12)" }}
    >
      <div className="container-premium">
        <FadeInUp className="text-center mb-8">
          <h2
            className="text-2xl font-bold mb-3"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em", color: "var(--text-primary)" }}
          >
            Rarity & Rewards
          </h2>
          <p
            className="text-sm max-w-xl mx-auto"
            style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)", lineHeight: 1.6 }}
          >
            Each NFT has a unique rarity that determines staking rewards. Higher rarity = higher multiplier.
          </p>
        </FadeInUp>

        <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {rarityData.map(rarity => {
            const colors = getRarityColors(rarity.color);
            return (
              <motion.div
                key={rarity.name}
                className="card p-4 text-center"
                style={{ backgroundColor: "var(--bg-elevated)" }}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.2 }}
              >
                <div
                  className="text-2xl font-bold mb-1"
                  style={{ fontFamily: "var(--font-display)", color: colors.text }}
                >
                  {rarity.multiplier}
                </div>
                <h3
                  className="text-sm font-semibold mb-0.5"
                  style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
                >
                  {rarity.name}
                </h3>
                <p className="text-xs mb-2" style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}>
                  {rarity.quantity} NFTs · {rarity.percentage}%
                </p>
                <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-card)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${rarity.percentage}%`, backgroundColor: colors.text }}
                  />
                </div>
              </motion.div>
            );
          })}
        </StaggerContainer>

        <FadeInUp delay={0.2}>
          <div
            className="rounded-xl overflow-hidden"
            style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
          >
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  {["Rarity", "Quantity", "Distribution", "Multiplier", "Base Value"].map(h => (
                    <th
                      key={h}
                      className="py-3 px-4 text-xs font-medium"
                      style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rarityData.map((rarity, index) => {
                  const colors = getRarityColors(rarity.color);
                  return (
                    <tr
                      key={rarity.name}
                      style={{
                        borderBottom: index < rarityData.length - 1 ? "1px solid var(--border-subtle)" : "none",
                      }}
                    >
                      <td className="py-3 px-4">
                        <span
                          className="text-sm font-medium"
                          style={{ fontFamily: "var(--font-body)", color: colors.text }}
                        >
                          {rarity.name}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className="text-sm"
                          style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}
                        >
                          {rarity.quantity} NFTs
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex-1 h-1 rounded-full max-w-[60px]"
                            style={{ backgroundColor: "var(--bg-card)" }}
                          >
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${rarity.percentage}%`, backgroundColor: colors.text }}
                            />
                          </div>
                          <span
                            className="text-xs"
                            style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}
                          >
                            {rarity.percentage}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className="text-sm font-semibold"
                          style={{ fontFamily: "var(--font-display)", color: colors.text }}
                        >
                          {rarity.multiplier}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <code
                          className="px-2 py-1 rounded text-xs"
                          style={{
                            fontFamily: "var(--font-mono)",
                            backgroundColor: "var(--bg-card)",
                            color: "var(--text-tertiary)",
                          }}
                        >
                          {rarity.multiplierValue}
                        </code>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-4 py-2.5" style={{ borderTop: "1px solid var(--border-subtle)" }}>
              <p className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
                Multiplier base is 10000 (e.g., 15000 = 1.5×). Rewards are calculated on-chain using rarity multipliers.
              </p>
            </div>
          </div>
        </FadeInUp>
      </div>
    </section>
  );
}
