"use client";

export function StakingArchitecture() {
  return (
    <section className="py-20 bg-black relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16 animate-slide-in-up">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 text-gradient-purple">
            🏗️ Multi-Contract Architecture
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Our system uses separate contracts for NFTs, staking, and rewards. This modular design ensures security and
            upgradeability.
          </p>
        </div>

        {/* Architecture Diagram */}
        <div className="max-w-5xl mx-auto mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Contract 1: StakableNFT */}
            <div className="group glass-card rounded-2xl p-6 border-2 border-purple-500/50 hover:border-purple-400 transition-all duration-500 hover:scale-105 hover:-translate-y-2 animate-slide-in-up">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-purple-500/30">
                  <span className="text-3xl">🎨</span>
                </div>
                <h3 className="text-xl font-bold text-white">StakableNFT</h3>
                <p className="text-purple-400 text-sm mt-1 font-medium">ERC721 Contract</p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-start space-x-2">
                  <span className="text-purple-400 mt-0.5">✓</span>
                  <span className="text-gray-100">Mint blind box NFTs</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-purple-400 mt-0.5">✓</span>
                  <span className="text-gray-100">Store rarity metadata</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-purple-400 mt-0.5">✓</span>
                  <span className="text-gray-100">Provide reward multipliers</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-purple-400 mt-0.5">✓</span>
                  <span className="text-gray-100">Trigger VRF reveal</span>
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div
              className="hidden md:flex items-center justify-center animate-slide-in-up"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="text-center">
                <div className="text-4xl text-cyan-400 animate-pulse">→</div>
                <p className="text-xs text-gray-400 mt-1">Transfer NFT</p>
              </div>
            </div>

            {/* Contract 2: NFTStakingPool */}
            <div
              className="group glass-card rounded-2xl p-6 border-2 border-cyan-500/50 hover:border-cyan-400 transition-all duration-500 hover:scale-105 hover:-translate-y-2 animate-slide-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-cyan-700 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-cyan-500/30">
                  <span className="text-3xl">🔒</span>
                </div>
                <h3 className="text-xl font-bold text-white">NFTStakingPool</h3>
                <p className="text-cyan-400 text-sm mt-1 font-medium">Staking Contract</p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-start space-x-2">
                  <span className="text-cyan-400 mt-0.5">✓</span>
                  <span className="text-gray-100">Accept NFT deposits</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-cyan-400 mt-0.5">✓</span>
                  <span className="text-gray-100">Calculate time-based rewards</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-cyan-400 mt-0.5">✓</span>
                  <span className="text-gray-100">Apply rarity multipliers</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-cyan-400 mt-0.5">✓</span>
                  <span className="text-gray-100">Distribute RWRD tokens</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-cyan-400 mt-0.5">✓</span>
                  <span className="text-gray-100">Handle withdrawals</span>
                </div>
              </div>
            </div>
          </div>

          {/* Arrow Down */}
          <div className="flex justify-center my-6 animate-slide-in-up" style={{ animationDelay: "0.3s" }}>
            <div className="text-center">
              <div className="text-4xl text-amber-400 animate-bounce">↓</div>
              <p className="text-xs text-gray-400 mt-1">Earn Rewards</p>
            </div>
          </div>

          {/* Contract 3: RewardToken */}
          <div className="max-w-md mx-auto animate-slide-in-up" style={{ animationDelay: "0.4s" }}>
            <div className="group glass-card rounded-2xl p-6 border-2 border-amber-500/50 hover:border-amber-400 transition-all duration-500 hover:scale-105">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-amber-500/30">
                  <span className="text-3xl">💰</span>
                </div>
                <h3 className="text-xl font-bold text-white">RewardToken (RWRD)</h3>
                <p className="text-amber-400 text-sm mt-1 font-medium">ERC20 Contract</p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-start space-x-2">
                  <span className="text-amber-400 mt-0.5">✓</span>
                  <span className="text-gray-100">Standard ERC20 token</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-amber-400 mt-0.5">✓</span>
                  <span className="text-gray-100">Minted to staking pool</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-amber-400 mt-0.5">✓</span>
                  <span className="text-gray-100">Distributed to stakers</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-amber-400 mt-0.5">✓</span>
                  <span className="text-gray-100">Tradeable on DEXs</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Explanations */}
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
          <div
            className="glass-card rounded-xl p-6 border border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 animate-slide-in-up"
            style={{ animationDelay: "0.5s" }}
          >
            <h3 className="text-white font-bold mb-4 flex items-center space-x-2">
              <span className="text-2xl">💡</span>
              <span className="text-gradient-purple">Why Separate Contracts?</span>
            </h3>
            <ul className="space-y-3 text-sm text-gray-200">
              <li className="flex items-start space-x-2">
                <span className="text-purple-400 mt-0.5">•</span>
                <span>
                  <strong className="text-purple-300">Security:</strong> Isolated risk - exploit in one doesn&apos;t
                  affect others
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-purple-400 mt-0.5">•</span>
                <span>
                  <strong className="text-purple-300">Upgradability:</strong> Can deploy new staking logic without
                  touching NFTs
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-purple-400 mt-0.5">•</span>
                <span>
                  <strong className="text-purple-300">Flexibility:</strong> Same NFT can work with multiple staking
                  pools
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-purple-400 mt-0.5">•</span>
                <span>
                  <strong className="text-purple-300">Gas Efficiency:</strong> Smaller contracts = cheaper deployments
                </span>
              </li>
            </ul>
          </div>

          <div
            className="glass-card rounded-xl p-6 border border-cyan-500/30 hover:border-cyan-500/50 transition-all duration-300 animate-slide-in-up"
            style={{ animationDelay: "0.6s" }}
          >
            <h3 className="text-white font-bold mb-4 flex items-center space-x-2">
              <span className="text-2xl">⚙️</span>
              <span className="text-gradient-blue">How They Interact</span>
            </h3>
            <ol className="space-y-2 text-sm text-gray-200">
              <li className="flex items-start space-x-2">
                <span className="text-cyan-400 font-bold w-5">1.</span>
                <span>
                  User mints NFT from <code className="terminal-glow px-1.5 py-0.5 rounded text-xs">StakableNFT</code>
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-cyan-400 font-bold w-5">2.</span>
                <span>
                  User approves <code className="terminal-glow px-1.5 py-0.5 rounded text-xs">NFTStakingPool</code> to
                  transfer
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-cyan-400 font-bold w-5">3.</span>
                <span>
                  Pool calls <code className="terminal-glow px-1.5 py-0.5 rounded text-xs">getRewardMultiplier()</code>
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-cyan-400 font-bold w-5">4.</span>
                <span>
                  Pool transfers NFT via{" "}
                  <code className="terminal-glow px-1.5 py-0.5 rounded text-xs">safeTransferFrom()</code>
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-cyan-400 font-bold w-5">5.</span>
                <span>Pool calculates rewards using multiplier</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-cyan-400 font-bold w-5">6.</span>
                <span>Pool transfers RWRD tokens to user</span>
              </li>
            </ol>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12 animate-slide-in-up" style={{ animationDelay: "0.7s" }}>
          <a
            href="/stake"
            className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold text-lg rounded-xl transform hover:scale-105 transition-all duration-300 shadow-xl shadow-purple-500/25 hover:shadow-cyan-500/25"
          >
            🔒 Explore Staking Pool
          </a>
        </div>
      </div>
    </section>
  );
}
