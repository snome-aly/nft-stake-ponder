"use client";

import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { FadeInUp, StaggerContainer } from "~~/components/ui/AnimatedCard";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

const steps = [
  { number: 1, title: "Connect Wallet", description: "Connect your Web3 wallet to begin", status: "User" },
  { number: 2, title: "Mint Blind Box", description: "Pay 0.001 ETH to mint your mystery NFT", status: "User" },
  {
    number: 3,
    title: "Wait for Sellout",
    description: "All 100 NFTs must be minted before reveal",
    status: "Community",
  },
  {
    number: 4,
    title: "Admin Triggers Reveal",
    description: "Project admin calls reveal() with VRF randomness",
    status: "Admin",
  },
  { number: 5, title: "Batch Reveal", description: "All 100 NFTs reveal with assigned rarities", status: "Auto" },
  { number: 6, title: "Stake & Earn", description: "Transfer NFT to staking pool to earn rewards", status: "User" },
];

/**
 * RevealProcess - Premium NFT Gallery
 */
export function RevealProcess() {
  const { address, isConnected } = useAccount();

  const { data: totalMinted } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "totalMinted",
  });

  const { data: userMinted } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "mintedCount",
    args: [address],
  });

  const currentMinted = totalMinted !== undefined ? Number(totalMinted) : 0;
  const userCurrentMinted = userMinted !== undefined ? Number(userMinted) : 0;
  const isSoldOut = currentMinted >= 100;
  const isUserMaxReached = userCurrentMinted >= 20;

  const getButtonState = () => {
    if (!isConnected) return { text: "Connect Wallet", disabled: false };
    if (isSoldOut) return { text: "Sold Out", disabled: true };
    if (isUserMaxReached) return { text: `Max Reached (${userCurrentMinted}/20)`, disabled: true };
    return { text: "Start Minting", disabled: false };
  };

  const buttonState = getButtonState();

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
            User Journey
          </h2>
          <p
            className="text-sm max-w-xl mx-auto"
            style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)", lineHeight: 1.7 }}
          >
            From minting to staking in 6 transparent steps.
          </p>
        </FadeInUp>

        {/* Timeline - Desktop */}
        <div className="hidden lg:block max-w-4xl mx-auto mb-8">
          <div className="relative">
            {/* Line */}
            <div className="absolute top-5 left-0 right-0 h-px" style={{ backgroundColor: "var(--border-default)" }} />

            <StaggerContainer className="grid grid-cols-6 gap-3 relative z-10">
              {steps.map((step, index) => (
                <motion.div
                  key={step.number}
                  className="text-center"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.06 }}
                >
                  {/* Step number */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center mx-auto mb-2"
                    style={{
                      backgroundColor: "var(--bg-elevated)",
                      border: "1px solid var(--accent-border)",
                    }}
                  >
                    <span
                      className="text-sm font-semibold"
                      style={{ fontFamily: "var(--font-display)", color: "var(--accent)" }}
                    >
                      {step.number}
                    </span>
                  </div>

                  {/* Card */}
                  <div className="card p-3 text-left" style={{ backgroundColor: "var(--bg-elevated)" }}>
                    <h3
                      className="text-xs font-semibold mb-1"
                      style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
                    >
                      {step.title}
                    </h3>
                    <p
                      className="text-xs mb-2"
                      style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)", lineHeight: 1.5 }}
                    >
                      {step.description}
                    </p>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: "var(--bg-card)",
                        color: "var(--text-muted)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      {step.status}
                    </span>
                  </div>
                </motion.div>
              ))}
            </StaggerContainer>
          </div>
        </div>

        {/* Timeline - Mobile */}
        <div className="lg:hidden max-w-sm mx-auto mb-8 space-y-3">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              className="flex items-start gap-3 card p-4"
              style={{ backgroundColor: "var(--bg-elevated)" }}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "var(--accent-muted)", border: "1px solid var(--accent-border)" }}
              >
                <span
                  className="text-xs font-semibold"
                  style={{ fontFamily: "var(--font-display)", color: "var(--accent)" }}
                >
                  {step.number}
                </span>
              </div>
              <div>
                <h3
                  className="text-sm font-semibold mb-0.5"
                  style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
                >
                  {step.title}
                </h3>
                <p className="text-xs mb-1.5" style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}>
                  {step.description}
                </p>
                <span
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: "var(--bg-card)",
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {step.status}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* VRF Explanation */}
        <FadeInUp>
          <div className="max-w-2xl mx-auto card p-5" style={{ backgroundColor: "var(--bg-elevated)" }}>
            <h3
              className="text-sm font-semibold mb-4 text-center"
              style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
            >
              Provably Fair Reveal
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div
                className="p-4 rounded-lg"
                style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
              >
                <h4
                  className="text-xs font-semibold mb-3"
                  style={{ fontFamily: "var(--font-body)", color: "var(--accent)" }}
                >
                  How It Works
                </h4>
                <ol className="space-y-1.5">
                  {[
                    "Admin calls reveal() after sellout",
                    "Random offset via VRF oracle",
                    "Each tokenId maps to rarity",
                    "All 100 NFTs revealed at once",
                  ].map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-xs"
                      style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}
                    >
                      <span className="font-medium text-[var(--text-muted)]">{i + 1}.</span>
                      {item}
                    </li>
                  ))}
                </ol>
              </div>

              <div
                className="p-4 rounded-lg"
                style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
              >
                <h4
                  className="text-xs font-semibold mb-3"
                  style={{ fontFamily: "var(--font-body)", color: "var(--success)" }}
                >
                  Why It Is Fair
                </h4>
                <ul className="space-y-1.5">
                  {[
                    "Rarity pool shuffled off-chain",
                    "Random offset prevents prediction",
                    "All 100 revealed simultaneously",
                    "No mint-order advantage",
                  ].map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-xs"
                      style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}
                    >
                      <span style={{ color: "var(--success)" }}>—</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </FadeInUp>

        {/* CTA */}
        <FadeInUp>
          <div className="text-center mt-8">
            <a href="/mint" className={`btn btn-lg ${buttonState.disabled ? "btn-secondary" : "btn-primary"}`}>
              {buttonState.text}
            </a>
          </div>
        </FadeInUp>
      </div>
    </section>
  );
}
