"use client";

import { motion } from "framer-motion";
import { FadeInUp, StaggerContainer } from "~~/components/ui/AnimatedCard";

const contracts = [
  {
    name: "StakableNFT",
    type: "ERC721",
    features: ["Mint blind box NFTs", "Store rarity metadata", "Provide reward multipliers", "Trigger VRF reveal"],
  },
  {
    name: "NFTStakingPool",
    type: "Staking",
    features: [
      "Accept NFT deposits",
      "Calculate time-based rewards",
      "Apply rarity multipliers",
      "Distribute RWRD tokens",
      "Handle withdrawals",
    ],
  },
  {
    name: "RewardToken",
    type: "ERC20",
    features: ["Standard ERC20 token", "Minted to staking pool", "Distributed to stakers"],
  },
];

/**
 * StakingArchitecture - Premium NFT Gallery
 */
export function StakingArchitecture() {
  return (
    <section
      style={{ backgroundColor: "var(--bg-surface)", paddingTop: "var(--space-12)", paddingBottom: "var(--space-12)" }}
    >
      <div className="container-premium">
        {/* Header */}
        <FadeInUp className="text-center mb-8">
          <h2
            className="text-xl font-bold mb-3"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em", color: "var(--text-primary)" }}
          >
            Architecture
          </h2>
          <p
            className="text-sm max-w-xl mx-auto"
            style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)", lineHeight: 1.7 }}
          >
            Separate contracts for NFTs, staking, and rewards. Modular design ensures security and upgradeability.
          </p>
        </FadeInUp>

        {/* Contract Cards */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {contracts.map(contract => (
            <motion.div
              key={contract.name}
              className="card p-6"
              style={{ backgroundColor: "var(--bg-elevated)" }}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-center mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: "var(--accent-muted)", border: "1px solid var(--accent-border)" }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-[var(--accent)]">
                    <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <h3
                  className="text-base font-semibold mb-1"
                  style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
                >
                  {contract.name}
                </h3>
                <span className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--accent)" }}>
                  {contract.type}
                </span>
              </div>

              <ul className="space-y-1.5">
                {contract.features.map((f, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs"
                    style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}
                  >
                    <span className="text-[var(--text-muted)] mt-0.5">—</span>
                    {f}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </StaggerContainer>

        {/* Flow indicator */}
        <motion.div
          className="flex items-center justify-center gap-3 py-3 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <span className="text-sm" style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}>
            Mint
          </span>
          <span style={{ color: "var(--text-muted)" }}>→</span>
          <span className="text-sm" style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}>
            Stake
          </span>
          <span style={{ color: "var(--text-muted)" }}>→</span>
          <span className="text-sm" style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}>
            Earn
          </span>
        </motion.div>

        {/* Info cards */}
        <div className="grid md:grid-cols-2 gap-5 max-w-3xl mx-auto">
          <FadeInUp delay={0.5}>
            <div className="card p-5" style={{ backgroundColor: "var(--bg-elevated)" }}>
              <h3
                className="text-sm font-semibold mb-3"
                style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
              >
                Why Separate Contracts?
              </h3>
              <ul className="space-y-2">
                {[
                  { label: "Security", desc: "Exploit in one doesn&apos;t affect others" },
                  { label: "Upgradability", desc: "New staking logic without touching NFTs" },
                  { label: "Flexibility", desc: "Same NFT can work with multiple pools" },
                ].map(item => (
                  <li key={item.label} className="flex items-start gap-2 text-xs">
                    <span className="text-[var(--text-muted)]">—</span>
                    <span>
                      <span style={{ fontFamily: "var(--font-body)", color: "var(--accent)" }}>{item.label}:</span>{" "}
                      <span style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}>{item.desc}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </FadeInUp>

          <FadeInUp delay={0.6}>
            <div className="card p-5" style={{ backgroundColor: "var(--bg-elevated)" }}>
              <h3
                className="text-sm font-semibold mb-3"
                style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
              >
                How They Interact
              </h3>
              <ol className="space-y-1.5">
                {[
                  "User mints NFT from StakableNFT",
                  "User approves NFTStakingPool",
                  "Pool calls getRewardMultiplier()",
                  "Pool transfers NFT via safeTransferFrom()",
                  "Pool distributes RWRD tokens",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    <span className="text-[var(--text-muted)] font-mono w-4">{i + 1}.</span>
                    <span style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}>{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          </FadeInUp>
        </div>

        {/* CTA */}
        <FadeInUp>
          <div className="text-center mt-6">
            <a href="/stake" className="btn btn-secondary btn-lg">
              View Staking Pool
            </a>
          </div>
        </FadeInUp>
      </div>
    </section>
  );
}
