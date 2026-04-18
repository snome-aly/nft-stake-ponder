"use client";

interface StakingStatsBarProps {
  totalStaked: number;
  totalPendingReward: bigint;
  totalClaimed: bigint;
  totalEarned: bigint;
}

export function StakingStatsBar({ totalStaked, totalPendingReward, totalClaimed, totalEarned }: StakingStatsBarProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Total Staked */}
      <div className="card p-5" style={{ backgroundColor: "var(--bg-elevated)" }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
            Total Staked
          </h3>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "var(--bg-card)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[var(--text-muted)]">
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
        <p className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
          Currently earning rewards
        </p>
      </div>

      {/* Pending Rewards */}
      <div
        className="card p-5"
        style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--accent-border)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
            Pending Rewards
          </h3>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "var(--accent-muted)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[var(--accent)]">
              <path
                d="M12 2v4m0 12v4m-6-10H2m20 0h-4M6.34 6.34L4.93 4.93m14.14 14.14l-1.41-1.41M6.34 17.66l-1.41 1.41"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
        <div className="text-2xl font-bold mb-1" style={{ fontFamily: "var(--font-display)", color: "var(--accent)" }}>
          {(Number(totalPendingReward) / 1e18).toFixed(4)} RWRD
        </div>
        <p className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
          Updating in real-time
        </p>
      </div>

      {/* Total Claimed */}
      <div className="card p-5" style={{ backgroundColor: "var(--bg-elevated)" }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
            Total Claimed
          </h3>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "var(--success-muted)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[var(--success)]">
              <path
                d="M5 12l5 5L20 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        <div className="text-2xl font-bold mb-1" style={{ fontFamily: "var(--font-display)", color: "var(--success)" }}>
          {(Number(totalClaimed) / 1e18).toFixed(4)} RWRD
        </div>
        <p className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
          Already in your wallet
        </p>
      </div>

      {/* Total Earned */}
      <div className="card p-5" style={{ backgroundColor: "var(--bg-elevated)" }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
            Total Earned
          </h3>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "var(--warning-muted)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[var(--warning)]">
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        <div className="text-2xl font-bold mb-1" style={{ fontFamily: "var(--font-display)", color: "var(--warning)" }}>
          {(Number(totalEarned) / 1e18).toFixed(4)} RWRD
        </div>
        <p className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
          Lifetime earnings
        </p>
      </div>
    </div>
  );
}
