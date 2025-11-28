"use client";

const rarityData = [
  {
    name: "Common",
    icon: "⚪",
    count: 50,
    percentage: "50%",
    multiplier: "1.0x",
    textClass: "text-gray-300",
    borderClass: "border-gray-400/50",
    bgClass: "bg-gray-500/10",
  },
  {
    name: "Rare",
    icon: "🔵",
    count: 30,
    percentage: "30%",
    multiplier: "1.5x",
    textClass: "text-blue-400",
    borderClass: "border-blue-500/50",
    bgClass: "bg-blue-500/10",
  },
  {
    name: "Epic",
    icon: "🟣",
    count: 15,
    percentage: "15%",
    multiplier: "2.0x",
    textClass: "text-purple-400",
    borderClass: "border-purple-500/50",
    bgClass: "bg-purple-500/10",
  },
  {
    name: "Legendary",
    icon: "🌟",
    count: 5,
    percentage: "5%",
    multiplier: "3.0x",
    textClass: "text-yellow-400",
    borderClass: "border-yellow-500/50",
    bgClass: "bg-yellow-500/10",
  },
];

export function RarityInfo() {
  return (
    <div className="animate-slide-in-up" style={{ animationDelay: "0.3s" }}>
      <h3 className="text-lg font-bold text-white text-center mb-4">💎 Rarity Distribution</h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {rarityData.map(rarity => (
          <div
            key={rarity.name}
            className={`glass-card rounded-xl p-3 border ${rarity.borderClass} ${rarity.bgClass} hover:scale-105 transition-all duration-300`}
          >
            {/* Icon & Name */}
            <div className="text-center mb-2">
              <span className="text-2xl block mb-0.5">{rarity.icon}</span>
              <span className={`font-bold text-sm ${rarity.textClass}`}>{rarity.name}</span>
            </div>

            {/* Stats */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Count</span>
                <span className="text-white font-medium">{rarity.count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Chance</span>
                <span className={rarity.textClass}>{rarity.percentage}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Multiplier</span>
                <span className={`font-bold ${rarity.textClass}`}>{rarity.multiplier}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Note */}
      <p className="text-center text-gray-500 text-xs mt-3">
        Higher rarity = Higher staking rewards. Rarity is randomly assigned after all 100 NFTs are minted.
      </p>
    </div>
  );
}
