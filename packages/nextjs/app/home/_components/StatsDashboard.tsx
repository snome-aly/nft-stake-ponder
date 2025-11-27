"use client";

import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

export function StatsDashboard() {
  // Read on-chain data
  const { data: totalMinted } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "totalMinted",
  });

  const { data: isRevealed } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "isRevealed",
  });

  const { data: rarityPoolSet } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "rarityPoolSet",
  });

  // // const MAX_SUPPLY = 100;

  const stats = [
    {
      label: "Total Minted",
      value: `${totalMinted?.toString() || "0"} / 100`,
      change: totalMinted ? `${Number((totalMinted * 100n) / 100n)}%` : "0%",
      icon: "🎨",
      color: "purple",
    },
    {
      label: "Rarity Pool",
      value: rarityPoolSet ? "Active" : "Not Set",
      change: rarityPoolSet ? "ready" : "pending",
      icon: "🎲",
      color: "blue",
    },
    {
      label: "Reveal Status",
      value: isRevealed ? "Revealed" : "Unrevealed",
      change: isRevealed ? "complete" : "pending",
      icon: "✨",
      color: "green",
    },
    {
      label: "Mint Price",
      value: "1 ETH",
      change: "fixed",
      icon: "💰",
      color: "yellow",
    },
    {
      label: "Max Per Wallet",
      value: "20 NFTs",
      change: "limit",
      icon: "🔒",
      color: "red",
    },
    {
      label: "Total Supply",
      value: "100",
      change: "fixed",
      icon: "📦",
      color: "orange",
    },
  ];

  return (
    <section className="py-20 bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">📊 Collection Statistics</h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Real-time on-chain data. All numbers are verifiable and transparent.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {stats.map(stat => (
            <div
              key={stat.label}
              className="bg-gray-800/50 backdrop-blur rounded-2xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-300 group"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl group-hover:scale-110 transition-transform">{stat.icon}</span>
                <div
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    stat.change.startsWith("+") || stat.change.endsWith("%")
                      ? "bg-green-500/20 text-green-400"
                      : stat.change === "complete" || stat.change === "ready"
                        ? "bg-green-500/20 text-green-400"
                        : stat.change === "pending"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {stat.change}
                </div>
              </div>

              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Link to Detailed Stats Page */}
        <div className="text-center mt-12">
          <a
            href="/stats"
            className="inline-block px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors"
          >
            📈 View Detailed Statistics
          </a>
        </div>
      </div>
    </section>
  );
}
