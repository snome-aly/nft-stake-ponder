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

  // 里程碑
  const milestones = [
    { value: 25, label: "25%" },
    { value: 50, label: "50%" },
    { value: 75, label: "75%" },
    { value: 100, label: "Reveal!" },
  ];

  return (
    <div
      className="glass-card rounded-2xl p-4 border border-purple-500/30 animate-slide-in-up"
      style={{ animationDelay: "0.2s" }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-white">📊 Mint Progress</h3>
        <span className="text-xl font-bold text-gradient-purple">
          {currentMinted} / {maxSupply}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        {/* Track */}
        <div className="h-5 bg-gray-800 rounded-full overflow-hidden relative">
          {/* Fill */}
          <div
            className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full transition-all duration-1000 relative"
            style={{ width: `${percentage}%` }}
          >
            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
          </div>

          {/* Percentage Text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white font-bold text-xs drop-shadow-lg">{percentage.toFixed(0)}%</span>
          </div>
        </div>

        {/* Milestones */}
        <div className="flex justify-between mt-1.5">
          {milestones.map(milestone => (
            <div key={milestone.value} className="relative">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  percentage >= milestone.value ? "bg-green-500 shadow-lg shadow-green-500/50" : "bg-gray-600"
                }`}
              ></div>
              <span
                className={`absolute -bottom-4 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap ${
                  percentage >= milestone.value ? "text-green-400" : "text-gray-500"
                }`}
              >
                {milestone.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Status Message */}
      <div className="mt-6 text-center">
        {percentage >= 100 ? (
          <p className="text-green-400 font-medium text-sm">🎉 Sold out! Reveal can be triggered by admin.</p>
        ) : percentage >= 75 ? (
          <p className="text-yellow-400 font-medium text-sm">
            🔥 Almost sold out! Only {maxSupply - currentMinted} left!
          </p>
        ) : percentage >= 50 ? (
          <p className="text-purple-400 font-medium text-sm">
            ⚡ Halfway there! {maxSupply - currentMinted} remaining.
          </p>
        ) : (
          <p className="text-gray-400 text-sm">Mint to participate. All 100 must be minted before reveal.</p>
        )}
      </div>
    </div>
  );
}
