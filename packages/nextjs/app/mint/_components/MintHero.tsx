"use client";

import { FadeInUp } from "~~/components/ui/AnimatedCard";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

export function MintHero() {
  const { data: totalMinted } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "totalMinted",
  });

  const { data: isRevealed } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "isRevealed",
  });

  const maxSupply = 100;
  const isSoldOut = totalMinted !== undefined && Number(totalMinted) >= maxSupply;

  const getStatusBadge = () => {
    if (isRevealed) {
      return (
        <span
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
          style={{
            backgroundColor: "var(--success-muted)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            color: "var(--success)",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--success)" }} />
          <span className="text-sm font-medium" style={{ fontFamily: "var(--font-body)" }}>
            Revealed
          </span>
        </span>
      );
    }
    if (isSoldOut) {
      return (
        <span
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
          style={{
            backgroundColor: "var(--warning-muted)",
            border: "1px solid rgba(251, 191, 36, 0.3)",
            color: "var(--warning)",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--warning)" }} />
          <span className="text-sm font-medium" style={{ fontFamily: "var(--font-body)" }}>
            Sold Out — Awaiting Reveal
          </span>
        </span>
      );
    }
    return (
      <span
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full animate-pulse"
        style={{
          backgroundColor: "var(--accent-muted)",
          border: "1px solid rgba(139, 92, 246, 0.3)",
          color: "var(--accent)",
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
        <span className="text-sm font-medium" style={{ fontFamily: "var(--font-body)" }}>
          Minting Live
        </span>
      </span>
    );
  };

  return (
    <section className="py-12" style={{ backgroundColor: "var(--bg-base)" }}>
      <div className="container-premium">
        <FadeInUp className="text-center">
          {/* Status Badge */}
          <div className="mb-6">{getStatusBadge()}</div>

          {/* Main Title */}
          <h1
            className="text-4xl font-bold mb-4"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em", color: "var(--text-primary)" }}
          >
            Mint Your Blind Box NFT
          </h1>

          {/* Subtitle */}
          <p
            className="text-base max-w-xl mx-auto mb-8"
            style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)", lineHeight: 1.7 }}
          >
            Each NFT starts as a mysterious blind box. Rarity is revealed only after all 100 NFTs are minted.
          </p>

          {/* Quick Stats */}
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { label: "Price", value: "0.001 ETH" },
              { label: "Supply", value: "100 NFTs" },
              { label: "Max per wallet", value: "20 NFTs" },
            ].map(stat => (
              <div key={stat.label} className="card px-4 py-3" style={{ backgroundColor: "var(--bg-elevated)" }}>
                <span className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
                  {stat.label}:
                </span>
                <span
                  className="text-sm font-semibold ml-2"
                  style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}
                >
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        </FadeInUp>
      </div>
    </section>
  );
}
