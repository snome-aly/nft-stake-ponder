"use client";

const rarityData = [
  {
    name: "Common",
    icon: "⚪",
    quantity: 50,
    percentage: 50,
    multiplier: "1.0x",
    multiplierValue: 10000,
    textClass: "text-gray-300",
    description: "50% chance - Standard rewards",
    cardClass: "metallic",
    borderClass: "border-gray-400/50",
    glowClass: "",
    delay: "0s",
  },
  {
    name: "Rare",
    icon: "🔵",
    quantity: 30,
    percentage: 30,
    multiplier: "1.5x",
    multiplierValue: 15000,
    textClass: "text-blue-400",
    description: "30% chance - Enhanced rewards",
    cardClass: "bg-blue-900/20",
    borderClass: "border-neon-blue",
    glowClass: "animate-glow-blue",
    delay: "0.1s",
  },
  {
    name: "Epic",
    icon: "🟣",
    quantity: 15,
    percentage: 15,
    multiplier: "2.0x",
    multiplierValue: 20000,
    textClass: "text-purple-400",
    description: "15% chance - Double rewards",
    cardClass: "bg-purple-900/20",
    borderClass: "border-neon-purple",
    glowClass: "animate-glow",
    delay: "0.2s",
  },
  {
    name: "Legendary",
    icon: "🌟",
    quantity: 5,
    percentage: 5,
    multiplier: "3.0x",
    multiplierValue: 30000,
    textClass: "text-yellow-400",
    description: "5% chance - Triple rewards!",
    cardClass: "bg-gradient-to-br from-yellow-900/30 to-orange-900/30",
    borderClass: "border-neon-gold",
    glowClass: "animate-glow-gold",
    delay: "0.3s",
  },
];

export function RarityShowcase() {
  return (
    <section className="py-20 bg-gray-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16 animate-slide-in-up">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 text-gradient-purple">
            💎 Rarity Distribution & Rewards
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Each NFT has a unique rarity that determines staking rewards. Higher rarity = Higher multiplier!
          </p>
        </div>

        {/* Rarity Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-16">
          {rarityData.map(rarity => (
            <RarityCard key={rarity.name} rarity={rarity} />
          ))}
        </div>

        {/* Enhanced Comparison Table */}
        <div className="max-w-5xl mx-auto animate-slide-in-up" style={{ animationDelay: "0.4s" }}>
          <div className="glass-card rounded-2xl p-6 sm:p-8 border border-purple-500/30">
            <h3 className="text-2xl font-bold text-white mb-8 text-center text-gradient-blue">Rarity Comparison</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="py-4 px-4 text-gray-400 font-semibold">Rarity</th>
                    <th className="py-4 px-4 text-gray-400 font-semibold">Quantity</th>
                    <th className="py-4 px-4 text-gray-400 font-semibold">Distribution</th>
                    <th className="py-4 px-4 text-gray-400 font-semibold">Multiplier</th>
                    <th className="py-4 px-4 text-gray-400 font-semibold">Base Value</th>
                  </tr>
                </thead>
                <tbody>
                  {rarityData.map((rarity, index) => (
                    <tr
                      key={rarity.name}
                      className="border-b border-gray-700/50 last:border-b-0 hover:bg-white/5 transition-all duration-300 group"
                      style={{ animationDelay: `${0.5 + index * 0.1}s` }}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-3xl group-hover:scale-110 transition-transform">{rarity.icon}</span>
                          <span className={`font-bold text-lg ${rarity.textClass}`}>{rarity.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-white font-semibold">{rarity.quantity} NFTs</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex-1 bg-gray-700 rounded-full h-3 max-w-[120px] overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                rarity.name === "Common"
                                  ? "bg-gray-500"
                                  : rarity.name === "Rare"
                                    ? "bg-blue-500 animate-energy-flow"
                                    : rarity.name === "Epic"
                                      ? "bg-purple-500 animate-energy-flow"
                                      : "bg-gradient-to-r from-yellow-500 to-orange-500 animate-energy-flow"
                              }`}
                              style={{ width: `${rarity.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-white font-medium min-w-[3rem]">{rarity.percentage}%</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`font-bold text-xl ${rarity.textClass}`}>{rarity.multiplier}</span>
                      </td>
                      <td className="py-4 px-4">
                        <code className="terminal-glow px-3 py-1.5 rounded text-sm text-green-400 font-mono">
                          {rarity.multiplierValue}
                        </code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8 p-4 glass-dark rounded-lg border border-purple-500/30">
              <p className="text-sm text-gray-300 leading-relaxed">
                <span className="text-purple-400 font-semibold">ℹ️ Multiplier Base:</span> All values use base 10000
                (e.g., 15000 = 1.5x). This precision allows for accurate reward calculations in the staking pool
                contract.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RarityCard({ rarity }: { rarity: (typeof rarityData)[0] }) {
  return (
    <div
      className={`group relative ${rarity.cardClass} glass-medium rounded-2xl p-6 border-2 ${rarity.borderClass} ${rarity.glowClass} hover:scale-105 hover:-translate-y-2 transition-all duration-500 tilt-3d animate-slide-in-up overflow-hidden`}
      style={{ animationDelay: rarity.delay }}
    >
      {/* Animated Background */}
      {rarity.name === "Legendary" && (
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      )}

      {/* Rarity Icon */}
      <div className="text-center mb-4 relative z-10">
        <span
          className={`text-6xl group-hover:scale-125 ${
            rarity.name === "Legendary" ? "group-hover:rotate-180" : ""
          } transition-all duration-500 inline-block`}
        >
          {rarity.icon}
        </span>
      </div>

      {/* Rarity Name */}
      <h3 className={`text-2xl font-bold ${rarity.textClass} text-center mb-6 relative z-10`}>{rarity.name}</h3>

      {/* Stats Grid */}
      <div className="space-y-4 relative z-10">
        <div className="flex justify-between items-center p-2 rounded-lg glass-dark">
          <span className="text-gray-400 text-sm">Quantity</span>
          <span className="text-white font-bold">{rarity.quantity} NFTs</span>
        </div>

        <div className="flex justify-between items-center p-2 rounded-lg glass-dark">
          <span className="text-gray-400 text-sm">Drop Rate</span>
          <span className={`font-bold ${rarity.textClass}`}>{rarity.percentage}%</span>
        </div>

        <div className="flex justify-between items-center p-2 rounded-lg glass-dark">
          <span className="text-gray-400 text-sm">Multiplier</span>
          <span className={`font-bold text-xl ${rarity.textClass}`}>{rarity.multiplier}</span>
        </div>

        <div className="flex justify-between items-center p-2 rounded-lg glass-dark">
          <span className="text-gray-400 text-sm">Base Value</span>
          <code className="terminal-glow px-2 py-1 rounded text-xs text-green-400">{rarity.multiplierValue}</code>
        </div>
      </div>

      {/* Description */}
      <p className="mt-6 text-center text-sm text-gray-300 leading-relaxed relative z-10">{rarity.description}</p>

      {/* Hover Shine Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -translate-x-full group-hover:translate-x-full"></div>
    </div>
  );
}
