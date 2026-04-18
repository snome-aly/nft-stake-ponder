"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

/**
 * HeroSection - Tightened for first-viewport density
 */
export function HeroSection() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => setIsMounted(true), []);

  const { data: totalMinted } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "totalMinted",
    watch: false,
  });
  const { data: isRevealed } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "isRevealed",
    watch: false,
  });
  const { data: rarityPoolSet } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "rarityPoolSet",
    watch: false,
  });
  const { data: userMinted } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "mintedCount",
    args: [address],
    watch: false,
  });

  const MAX_SUPPLY = 100;
  const userCurrentMinted = userMinted !== undefined ? Number(userMinted) : 0;
  const isSoldOut = totalMinted === BigInt(MAX_SUPPLY);
  const isUserMaxReached = isConnected && userCurrentMinted >= 20;
  const progress = totalMinted ? (Number(totalMinted) / MAX_SUPPLY) * 100 : 0;
  const remaining = MAX_SUPPLY - Number(totalMinted || 0);

  const getMintButtonState = () => {
    if (!rarityPoolSet) return { text: "Pool Not Active", disabled: true };
    if (isSoldOut) return { text: "Sold Out", disabled: true };
    if (isUserMaxReached) return { text: `Max ${userCurrentMinted}/20`, disabled: true };
    return { text: "Mint Blind Box", disabled: false };
  };

  const mintButtonState = getMintButtonState();

  return (
    <section
      className="relative overflow-hidden"
      style={{
        minHeight: "88vh",
        backgroundColor: "var(--bg-base)",
        backgroundImage: `radial-gradient(ellipse at 60% 30%, rgba(139,92,246,0.08) 0%, transparent 55%), radial-gradient(ellipse at 30% 70%, rgba(34,211,238,0.04) 0%, transparent 50%)`,
      }}
    >
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="container-premium relative z-10 flex flex-col justify-center min-h-[88vh] py-16">
        <div className="max-w-3xl mx-auto text-center">
          <motion.p
            className="mb-4 text-xs uppercase tracking-[0.2em]"
            style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            On-Chain Blind Box NFT Collection
          </motion.p>

          <motion.h1
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
          >
            <span
              className="block text-4xl sm:text-5xl md:text-6xl font-bold mb-2"
              style={{
                fontFamily: "var(--font-display)",
                letterSpacing: "-0.02em",
                color: "var(--text-primary)",
                lineHeight: 1.05,
              }}
            >
              Blind Box NFT
            </span>
            <span
              className="block text-2xl sm:text-3xl md:text-4xl font-normal"
              style={{ fontFamily: "var(--font-display)", color: "var(--text-secondary)", letterSpacing: "-0.01em" }}
            >
              Mint, Reveal, Stake
            </span>
          </motion.h1>

          <motion.p
            className="mb-8 text-sm max-w-lg mx-auto"
            style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)", lineHeight: 1.7 }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            100 NFTs. Hidden rarities revealed after sellout. Stake to earn rewards — Legendary earns 3× more.
          </motion.p>

          {/* Status banner */}
          {isMounted && (!rarityPoolSet || isSoldOut || isRevealed) && (
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
            >
              {!rarityPoolSet && (
                <div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
                  style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--warning)" }} />
                  <span style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
                    Rarity Pool Setup Required
                  </span>
                </div>
              )}
              {isSoldOut && !isRevealed && (
                <div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
                  style={{ backgroundColor: "var(--accent-muted)", border: "1px solid var(--accent-border)" }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
                  <span style={{ color: "var(--accent)", fontFamily: "var(--font-body)" }}>
                    All 100 minted — Rarities coming soon
                  </span>
                </div>
              )}
              {isRevealed && (
                <div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
                  style={{ backgroundColor: "var(--success-muted)", border: "1px solid rgba(16,185,129,0.2)" }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--success)" }} />
                  <span style={{ color: "var(--success)", fontFamily: "var(--font-body)" }}>
                    Rarities Revealed — Check Your Collection
                  </span>
                </div>
              )}
            </motion.div>
          )}

          {/* CTA */}
          <motion.div
            className="flex flex-col sm:flex-row gap-3 justify-center mb-8"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <button
              onClick={() => !mintButtonState.disabled && router.push("/mint")}
              disabled={mintButtonState.disabled}
              className="btn btn-primary btn-lg"
            >
              {mintButtonState.text}
            </button>
            <button onClick={() => router.push("/my-nfts")} className="btn btn-secondary btn-lg">
              My Collection
            </button>
          </motion.div>

          {/* Progress bar - compact */}
          <motion.div
            className="max-w-sm mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex justify-between items-baseline mb-1.5">
              <span className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}>
                {remaining} remaining
              </span>
              <span className="text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>
                {progress.toFixed(0)}%
              </span>
            </div>
            <div className="progress">
              <div className="progress-bar" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex justify-between items-baseline mt-1.5">
              <span className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
                {totalMinted?.toString() || "0"}/{MAX_SUPPLY} minted
              </span>
              <span className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
                0.001 ETH · Max 20
              </span>
            </div>
          </motion.div>

          {/* Feature pills */}
          <motion.div
            className="flex flex-wrap justify-center gap-2 mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            {["Blind Box Mystery", "VRF Fair Reveal", "3× Legendary Rewards"].map(feat => (
              <span
                key={feat}
                className="text-xs px-3 py-1.5 rounded-full"
                style={{
                  fontFamily: "var(--font-body)",
                  backgroundColor: "var(--bg-elevated)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-tertiary)",
                }}
              >
                {feat}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
