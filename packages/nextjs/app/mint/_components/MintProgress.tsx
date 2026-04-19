"use client";

import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

export function MintProgress() {
  const { data: totalMinted } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "totalMinted",
  });

  const maxSupply = 100;
  const currentMinted = totalMinted !== undefined ? Number(totalMinted) : 0;
  const percentage = Math.min(Math.max((currentMinted / maxSupply) * 100, 0), 100);
  const remaining = Math.max(maxSupply - currentMinted, 0);

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

  const status =
    percentage >= 100
      ? { message: "Sold out. Admin can trigger reveal.", color: "var(--success)" }
      : percentage >= 75
        ? { message: `Almost sold out. ${remaining} left.`, color: "var(--warning)" }
        : percentage >= 50
          ? { message: `Halfway there. ${remaining} remaining.`, color: "var(--text-tertiary)" }
          : { message: "Mint to participate. Reveal unlocks after sellout.", color: "var(--text-muted)" };

  return (
    <div className="card p-3 sm:p-4" style={{ backgroundColor: "var(--bg-elevated)" }}>
      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3
            className="text-sm font-semibold"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
          >
            Mint Progress
          </h3>
          <p className="text-xs" style={{ fontFamily: "var(--font-body)", color: status.color }}>
            {status.message}
          </p>
        </div>
        <span className="text-lg font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--accent)" }}>
          {currentMinted} / {maxSupply}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative mb-2">
        <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: "var(--bg-card)" }}>
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${percentage}%`, backgroundColor: "var(--accent)" }}
          />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-[11px] font-semibold leading-none"
            style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}
          >
            {percentage.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Milestones */}
      <div className="grid grid-cols-4 gap-2">
        {milestones.map((milestone, index) => (
          <div
            key={milestone.value}
            className={`flex items-center gap-1 ${
              index === 0 ? "justify-start" : index === milestones.length - 1 ? "justify-end" : "justify-center"
            }`}
          >
            <div
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: getMilestoneColor(milestone.value) }}
            />
            <span
              className="whitespace-nowrap text-[11px] leading-none"
              style={{ fontFamily: "var(--font-body)", color: getMilestoneColor(milestone.value) }}
            >
              {milestone.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
