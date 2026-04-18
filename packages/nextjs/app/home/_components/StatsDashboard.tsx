"use client";

import { motion } from "framer-motion";
import { FadeInUp, StaggerContainer } from "~~/components/ui/AnimatedCard";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

/**
 * StatsDashboard - Premium NFT Gallery
 */
export function StatsDashboard() {
  const { data: totalMinted } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "totalMinted",
  });

  const { data: isRevealed } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "isRevealed",
  });

  const { data: rarityPoolSet } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "rarityPoolSet",
  });

  const MAX_SUPPLY = 100;
  const mintedPercent = totalMinted ? (Number(totalMinted) / MAX_SUPPLY) * 100 : 0;

  const stats = [
    {
      label: "Total Minted",
      value: `${totalMinted?.toString() || "0"} / 100`,
      subValue: `${mintedPercent.toFixed(1)}%`,
      color: "accent",
    },
    {
      label: "Rarity Pool",
      value: rarityPoolSet ? "Active" : "Not Set",
      subValue: rarityPoolSet ? "Ready" : "Pending",
      color: "warning",
    },
    {
      label: "Reveal Status",
      value: isRevealed ? "Revealed" : "Unrevealed",
      subValue: isRevealed ? "Complete" : "Pending",
      color: "success",
    },
    { label: "Mint Price", value: "0.001 ETH", subValue: "Fixed", color: "accent" },
    { label: "Max Per Wallet", value: "20 NFTs", subValue: "Limit", color: "warning" },
    { label: "Total Supply", value: "100", subValue: "Maximum", color: "success" },
  ];

  const getColorStyles = (color: string, subValue: string) => {
    const isReady = subValue === "Ready" || subValue === "Complete" || subValue === "Fixed" || subValue === "Maximum";
    const isPending = subValue === "Pending" || subValue === "Limit";

    const colorMap: Record<string, string> = {
      accent: "var(--accent)",
      warning: "var(--warning)",
      success: "var(--success)",
    };

    const primary = colorMap[color] || "var(--accent)";

    return {
      primary,
      badgeStyle: {
        backgroundColor: isReady ? `${primary}15` : isPending ? "var(--bg-elevated)" : `${primary}10`,
        color: isReady ? primary : isPending ? "var(--text-muted)" : primary,
        borderColor: isReady ? `${primary}30` : "var(--border-subtle)",
      },
    };
  };

  return (
    <section
      style={{ backgroundColor: "var(--bg-base)", paddingTop: "var(--space-12)", paddingBottom: "var(--space-12)" }}
    >
      <div className="container-premium">
        {/* Header */}
        <FadeInUp className="text-center mb-8">
          <h2
            className="text-xl font-bold mb-3"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em", color: "var(--text-primary)" }}
          >
            Collection Statistics
          </h2>
          <p className="text-sm" style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}>
            Real-time on-chain data. All numbers are verifiable.
          </p>
        </FadeInUp>

        {/* Stats Grid */}
        <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {stats.map((stat, index) => {
            const colors = getColorStyles(stat.color, stat.subValue);
            return (
              <motion.div
                key={stat.label}
                className="card p-4"
                style={{ backgroundColor: "var(--bg-elevated)" }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.primary }} />
                  <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{
                      ...colors.badgeStyle,
                      fontFamily: "var(--font-body)",
                      borderWidth: "1px",
                      borderStyle: "solid",
                    }}
                  >
                    {stat.subValue}
                  </span>
                </div>

                <div
                  className="text-lg font-bold mb-1"
                  style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
                >
                  {stat.value}
                </div>
                <div className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}>
                  {stat.label}
                </div>
              </motion.div>
            );
          })}
        </StaggerContainer>

        {/* Link */}
        <FadeInUp delay={0.5}>
          <div className="text-center">
            <a href="/stats" className="btn btn-ghost">
              View Detailed Statistics
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="inline ml-1"
              >
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </FadeInUp>
      </div>
    </section>
  );
}
