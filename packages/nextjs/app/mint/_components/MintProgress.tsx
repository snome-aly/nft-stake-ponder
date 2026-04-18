"use client";

import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

export function MintProgress() {
  const { data: totalMinted } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "totalMinted",
  });

  const maxSupply = 100;
  const currentMinted = totalMinted !== undefined ? Number(totalMinted) : 0;
  const percentage = (currentMinted / maxSupply) * 100;

  const milestones = [
    { value: 25, label: "25%" },
    { value: 50, label: "50%" },
    { value: 75, label: "75%" },
    { value: 100, label: "Reveal!" },
  ];

  const getMilestoneColor = (value: number) => {
    if (percentage >= value) return "var(--success)";
    if (percentage >= value - 25) return "var(--accent)";
    return "var(--text-muted)";
  };

  return (
    <div className="card p-5" style={{ backgroundColor: "var(--bg-elevated)" }}>
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-sm font-semibold"
          style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
        >
          Mint Progress
        </h3>
        <span className="text-lg font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--accent)" }}>
          {currentMinted} / {maxSupply}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative mb-4">
        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-card)" }}>
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${percentage}%`, backgroundColor: "var(--accent)" }}
          />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-xs font-semibold"
            style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}
          >
            {percentage.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Milestones */}
      <div className="flex justify-between mb-3">
        {milestones.map(milestone => (
          <div key={milestone.value} className="flex flex-col items-center">
            <div
              className="w-2.5 h-2.5 rounded-full mb-1.5"
              style={{ backgroundColor: getMilestoneColor(milestone.value) }}
            />
            <span
              className="text-xs"
              style={{ fontFamily: "var(--font-body)", color: getMilestoneColor(milestone.value) }}
            >
              {milestone.label}
            </span>
          </div>
        ))}
      </div>

      {/* Status Message */}
      <div className="text-center pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        {percentage >= 100 ? (
          <p className="text-sm" style={{ fontFamily: "var(--font-body)", color: "var(--success)" }}>
            Sold out! Reveal can be triggered by admin.
          </p>
        ) : percentage >= 75 ? (
          <p className="text-sm" style={{ fontFamily: "var(--font-body)", color: "var(--warning)" }}>
            Almost sold out! Only {maxSupply - currentMinted} left.
          </p>
        ) : percentage >= 50 ? (
          <p className="text-sm" style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}>
            Halfway there! {maxSupply - currentMinted} remaining.
          </p>
        ) : (
          <p className="text-sm" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
            Mint to participate. All 100 must be minted before reveal.
          </p>
        )}
      </div>
    </div>
  );
}
