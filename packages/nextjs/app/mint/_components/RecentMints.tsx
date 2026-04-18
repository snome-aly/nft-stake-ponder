"use client";

import { FadeInUp } from "~~/components/ui/AnimatedCard";

export function RecentMints() {
  return (
    <FadeInUp delay={0.2}>
      <div className="card p-5" style={{ backgroundColor: "var(--bg-elevated)" }}>
        <h3
          className="text-sm font-semibold mb-4"
          style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
        >
          Recent Mints
        </h3>

        <div className="text-center py-8">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[var(--text-muted)]">
              <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
              <path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-sm mb-2" style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}>
            No mints yet
          </p>
          <p className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
            Be the first to mint a mystery blind box.
          </p>
        </div>
      </div>
    </FadeInUp>
  );
}
