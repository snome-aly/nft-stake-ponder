"use client";

import { FadeInUp } from "~~/components/ui/AnimatedCard";

/**
 * BlindBoxShowcase - Tightened spacing, reduced vertical gaps
 */
export function BlindBoxShowcase() {
  return (
    <section
      style={{ backgroundColor: "var(--bg-surface)", paddingTop: "var(--space-12)", paddingBottom: "var(--space-12)" }}
    >
      <div className="container-premium">
        <FadeInUp className="text-center mb-8">
          <h2
            className="text-2xl font-bold mb-3"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em", color: "var(--text-primary)" }}
          >
            How Blind Boxes Work
          </h2>
          <p
            className="text-sm max-w-xl mx-auto"
            style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)", lineHeight: 1.6 }}
          >
            All NFTs start as blind boxes with hidden rarities. Rarity is revealed only after all 100 NFTs are minted.
          </p>
        </FadeInUp>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-4xl mx-auto mb-8">
          {/* Unrevealed */}
          <FadeInUp delay={0.1}>
            <div className="card p-6 h-full" style={{ backgroundColor: "var(--bg-elevated)" }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--warning)" }} />
                <span
                  className="text-xs font-medium uppercase tracking-wider"
                  style={{ fontFamily: "var(--font-body)", color: "var(--warning)" }}
                >
                  Unrevealed State
                </span>
              </div>
              <h3
                className="text-lg font-semibold mb-4"
                style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
              >
                Before Reveal
              </h3>

              <div className="mb-4 flex justify-center">
                <div
                  className="w-24 h-24 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-default)" }}
                >
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="text-[var(--text-muted)]">
                    <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
              </div>

              <div
                className="rounded-lg p-3 mb-4"
                style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
              >
                <pre
                  className="text-xs overflow-x-auto"
                  style={{ fontFamily: "var(--font-mono)", lineHeight: 1.6, color: "var(--text-tertiary)" }}
                >
                  {`{ "rarity": "???", "multiplier": "???" }`}
                </pre>
              </div>

              <div className="space-y-1.5">
                {[{ text: "Rarity Hidden" }, { text: "Multiplier Unknown" }, { text: "Cannot Stake" }].map(item => (
                  <div key={item.text} className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded flex items-center justify-center"
                      style={{ backgroundColor: "var(--bg-card)" }}
                    >
                      <span style={{ color: "var(--text-muted)", fontSize: "10px" }}>—</span>
                    </div>
                    <span className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </FadeInUp>

          {/* Revealed */}
          <FadeInUp delay={0.15}>
            <div
              className="card p-6 h-full"
              style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--accent-border)" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--success)" }} />
                <span
                  className="text-xs font-medium uppercase tracking-wider"
                  style={{ fontFamily: "var(--font-body)", color: "var(--success)" }}
                >
                  Revealed State
                </span>
              </div>
              <h3
                className="text-lg font-semibold mb-4"
                style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
              >
                After Reveal
              </h3>

              <div className="mb-4 flex justify-center">
                <div
                  className="w-24 h-24 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "var(--accent-muted)", border: "1px solid var(--accent-border)" }}
                >
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="text-[var(--accent)]">
                    <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
                    <path
                      d="M9 12l2 2 4-4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              <div
                className="rounded-lg p-3 mb-4"
                style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
              >
                <pre
                  className="text-xs overflow-x-auto"
                  style={{ fontFamily: "var(--font-mono)", lineHeight: 1.6, color: "var(--text-tertiary)" }}
                >
                  {`{ "rarity": "Legendary", "multiplier": "3x" }`}
                </pre>
              </div>

              <div className="space-y-1.5">
                {[{ text: "Rarity Visible" }, { text: "Multiplier Known" }, { text: "Ready to Stake" }].map(item => (
                  <div key={item.text} className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded flex items-center justify-center"
                      style={{ backgroundColor: "var(--success-muted)" }}
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path
                          d="M2 5l2 2 4-4"
                          stroke="var(--success)"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <span className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--success)" }}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </FadeInUp>
        </div>

        {/* VRF Note - tight */}
        <FadeInUp delay={0.2}>
          <div
            className="max-w-2xl mx-auto rounded-xl p-4"
            style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "var(--accent-muted)" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[var(--accent)]">
                  <path
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <h4
                  className="text-sm font-semibold mb-0.5"
                  style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
                >
                  VRF-Based Fair Reveal
                </h4>
                <p
                  className="text-xs"
                  style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)", lineHeight: 1.6 }}
                >
                  After all 100 NFTs are minted, the admin triggers reveal via Chainlink VRF. All rarities assigned
                  simultaneously — no mint-order advantage.
                </p>
              </div>
            </div>
          </div>
        </FadeInUp>
      </div>
    </section>
  );
}
