"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { ConnectWalletPrompt } from "~~/components/ConnectWalletPrompt";
import { FullPageLoading } from "~~/components/LoadingComponents";
import { FadeInUp, StaggerContainer } from "~~/components/ui/AnimatedCard";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { usePonderGlobalStakingStats, usePonderGlobalStats } from "~~/hooks/usePonder";

function NFTStatsSection() {
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

  const { data: globalStats } = usePonderGlobalStats();

  const MAX_SUPPLY = 100;
  const MINT_PRICE = "0.001";
  const MAX_PER_WALLET = 20;
  const mintedPercent = totalMinted ? (Number(totalMinted) / MAX_SUPPLY) * 100 : 0;

  const rarityData = globalStats
    ? [
        { name: "Common", count: globalStats.commonCount, color: "var(--rarity-common)" },
        { name: "Rare", count: globalStats.rareCount, color: "var(--rarity-rare)" },
        { name: "Epic", count: globalStats.epicCount, color: "var(--rarity-epic)" },
        { name: "Legendary", count: globalStats.legendaryCount, color: "var(--rarity-legendary)" },
      ]
    : [];

  const totalRarityCount = rarityData.reduce((sum, r) => sum + r.count, 0);

  const statCards = [
    {
      label: "Total Minted",
      value: `${totalMinted?.toString() || "0"} / ${MAX_SUPPLY}`,
      subValue: `${mintedPercent.toFixed(1)}% minted`,
      color: "var(--accent)",
    },
    {
      label: "Rarity Pool",
      value: rarityPoolSet ? "Active" : "Not Set",
      subValue: rarityPoolSet ? "Ready" : "Pending",
      color: rarityPoolSet ? "var(--success)" : "var(--warning)",
    },
    {
      label: "Reveal Status",
      value: isRevealed ? "Revealed" : "Unrevealed",
      subValue: isRevealed ? "Complete" : "Pending",
      color: isRevealed ? "var(--success)" : "var(--warning)",
    },
    {
      label: "Mint Price",
      value: `${MINT_PRICE} ETH`,
      subValue: "Per NFT",
      color: "var(--accent)",
    },
    {
      label: "Max Per Wallet",
      value: `${MAX_PER_WALLET} NFTs`,
      subValue: "Limit",
      color: "var(--warning)",
    },
    {
      label: "Total Supply",
      value: MAX_SUPPLY.toString(),
      subValue: "Maximum",
      color: "var(--success)",
    },
  ];

  return (
    <section className="py-12">
      <FadeInUp delay={0.1}>
        <h2
          className="text-xl font-bold mb-6 flex items-center gap-3"
          style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
        >
          <div className="w-1 h-6 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
          NFT Collection Statistics
        </h2>
      </FadeInUp>

      <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            className="card p-5"
            style={{ backgroundColor: "var(--bg-elevated)" }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
                {stat.label}
              </span>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "var(--bg-card)" }}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stat.color }} />
              </div>
            </div>
            <div
              className="text-2xl font-bold mb-1"
              style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
            >
              {stat.value}
            </div>
            <div className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
              {stat.subValue}
            </div>
          </motion.div>
        ))}
      </StaggerContainer>

      {isRevealed && rarityData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="card p-6" style={{ backgroundColor: "var(--bg-elevated)" }}>
            <h3
              className="text-lg font-bold mb-6"
              style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
            >
              Rarity Distribution
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {rarityData.map((rarity, index) => (
                <motion.div
                  key={rarity.name}
                  className="p-4 rounded-lg text-center"
                  style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.08 }}
                >
                  <div className="h-1 rounded-full mb-3" style={{ backgroundColor: rarity.color }} />
                  <div
                    className="text-2xl font-bold mb-1"
                    style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
                  >
                    {rarity.count}
                  </div>
                  <div
                    className="text-sm font-medium mb-1"
                    style={{ fontFamily: "var(--font-body)", color: rarity.color }}
                  >
                    {rarity.name}
                  </div>
                  <div className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
                    {totalRarityCount > 0 ? ((rarity.count / totalRarityCount) * 100).toFixed(1) : 0}%
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </section>
  );
}

function StakingStatsSection() {
  const { data: baseRewardPerSecond } = useScaffoldReadContract({
    contractName: "NFTStakingPool",
    functionName: "baseRewardPerSecond",
  });

  const { data: globalStakingStats } = usePonderGlobalStakingStats();

  const totalStaked = globalStakingStats?.totalStaked || 0;
  const baseRewardPerDay = baseRewardPerSecond ? (Number(baseRewardPerSecond) * 86400) / 1e18 : 0;

  const multiplierData = [
    { name: "Common", multiplier: 1.0, color: "var(--rarity-common)" },
    { name: "Rare", multiplier: 1.5, color: "var(--rarity-rare)" },
    { name: "Epic", multiplier: 2.0, color: "var(--rarity-epic)" },
    { name: "Legendary", multiplier: 3.0, color: "var(--rarity-legendary)" },
  ];

  return (
    <section className="py-12">
      <FadeInUp delay={0.1}>
        <h2
          className="text-xl font-bold mb-6 flex items-center gap-3"
          style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
        >
          <div className="w-1 h-6 rounded-full" style={{ backgroundColor: "var(--cyan)" }} />
          Staking Statistics
        </h2>
      </FadeInUp>

      <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <motion.div
          className="card p-5"
          style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--accent-border)" }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
              Base Reward Rate
            </span>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "var(--accent-muted)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ color: "var(--accent)" }}>
                <path
                  d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <div
            className="text-2xl font-bold mb-1"
            style={{ fontFamily: "var(--font-display)", color: "var(--accent)" }}
          >
            {baseRewardPerDay.toFixed(2)}
          </div>
          <div className="text-sm mb-1" style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>
            RWRD
          </div>
          <div className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
            Per NFT per day
          </div>
        </motion.div>

        <motion.div
          className="card p-5 md:col-span-2"
          style={{ backgroundColor: "var(--bg-elevated)" }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
              Reward Multipliers
            </span>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "var(--bg-card)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[var(--text-muted)]">
                <path
                  d="M3 3v18h18M7 16l4-4 4 4 5-6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {multiplierData.map(item => (
              <div key={item.name} className="text-center">
                <div
                  className="text-lg font-bold mb-1"
                  style={{ fontFamily: "var(--font-display)", color: item.color }}
                >
                  {item.multiplier}×
                </div>
                <div className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
                  {item.name}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="card p-5"
          style={{ backgroundColor: "var(--bg-elevated)" }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
              Total Staked
            </span>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "var(--success-muted)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ color: "var(--success)" }}>
                <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
          </div>
          <div
            className="text-3xl font-bold mb-1"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
          >
            {totalStaked}
          </div>
          <div className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
            NFTs in staking pool
          </div>
        </motion.div>
      </StaggerContainer>

      <FadeInUp delay={0.3}>
        <div className="card p-6 mt-6" style={{ backgroundColor: "var(--bg-elevated)" }}>
          <h3
            className="text-base font-bold mb-4"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
          >
            Reward Calculation Examples
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {multiplierData.map((item, index) => (
              <motion.div
                key={item.name}
                className="p-3 rounded-lg"
                style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.05 }}
              >
                <div className="text-xs mb-1" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
                  {item.name} NFT (1 day)
                </div>
                <div className="text-lg font-bold" style={{ fontFamily: "var(--font-display)", color: item.color }}>
                  {(baseRewardPerDay * item.multiplier).toFixed(2)} RWRD
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </FadeInUp>
    </section>
  );
}

function PageContent() {
  return (
    <div className="container-premium">
      <NFTStatsSection />
      <StakingStatsSection />
    </div>
  );
}

export default function StatsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const { isConnected, status } = useAccount();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || status === "connecting" || status === "reconnecting") {
    return <FullPageLoading message="Loading statistics..." />;
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-base)" }}>
        <ConnectWalletPrompt message="Please connect your wallet to view statistics." />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-base)" }}>
      <section className="py-12">
        <div className="container-premium">
          <FadeInUp delay={0.1} className="text-center mb-12">
            <h1
              className="text-3xl font-bold mb-4"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em", color: "var(--text-primary)" }}
            >
              Collection Statistics
            </h1>
            <p
              className="text-base max-w-xl mx-auto"
              style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)", lineHeight: 1.7 }}
            >
              Real-time on-chain data and staking metrics. All numbers are verifiable and transparent.
            </p>
          </FadeInUp>

          <PageContent />
        </div>
      </section>
    </div>
  );
}
