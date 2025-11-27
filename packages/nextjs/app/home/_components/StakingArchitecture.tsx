"use client";

export function StakingArchitecture() {
  return (
    <section className="py-20 bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">🏗️ Multi-Contract Architecture</h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Our system uses separate contracts for NFTs, staking, and rewards. This modular design ensures security and
            upgradeability.
          </p>
        </div>

        {/* Architecture Diagram */}
        <div className="max-w-5xl mx-auto mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Contract 1: StakableNFT */}
            <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/50 backdrop-blur rounded-2xl p-6 border-2 border-purple-500/50">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-3xl">🎨</span>
                </div>
                <h3 className="text-xl font-bold text-white">StakableNFT</h3>
                <p className="text-purple-300 text-sm mt-1">ERC721 Contract</p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-start space-x-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span className="text-gray-300">Mint blind box NFTs</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span className="text-gray-300">Store rarity metadata</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span className="text-gray-300">Provide reward multipliers</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span className="text-gray-300">Trigger VRF reveal</span>
                </div>
                <div className="flex items-start space-x-2">
                  <p className="text-gray-400 text-sm">
                    Users stake their NFTs to earn points. The contract calculates points based on the NFT&apos;s rarity
                    and staking duration.
                  </p>
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="hidden md:flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl text-purple-400 mb-2">→</div>
                <p className="text-xs text-gray-500">Transfer NFT</p>
              </div>
            </div>

            {/* Contract 2: NFTStakingPool */}
            <div className="bg-gradient-to-br from-pink-900/50 to-pink-800/50 backdrop-blur rounded-2xl p-6 border-2 border-pink-500/50">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-pink-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-3xl">🔒</span>
                </div>
                <h3 className="text-xl font-bold text-white">NFTStakingPool</h3>
                <p className="text-pink-300 text-sm mt-1">Staking Contract</p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-start space-x-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span className="text-gray-300">Accept NFT deposits</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span className="text-gray-300">Calculate time-based rewards</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span className="text-gray-300">Apply rarity multipliers</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span className="text-gray-300">Distribute RWRD tokens</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span className="text-gray-300">Handle withdrawals</span>
                </div>
              </div>
            </div>
          </div>

          {/* Arrow Down */}
          <div className="flex justify-center my-6">
            <div className="text-center">
              <div className="text-4xl text-pink-400">↓</div>
              <p className="text-xs text-gray-500 mt-1">Earn Rewards</p>
            </div>
          </div>

          {/* Contract 3: RewardToken */}
          <div className="max-w-md mx-auto">
            <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/50 backdrop-blur rounded-2xl p-6 border-2 border-blue-500/50">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-3xl">💰</span>
                </div>
                <h3 className="text-xl font-bold text-white">RewardToken (RWRD)</h3>
                <p className="text-blue-300 text-sm mt-1">ERC20 Contract</p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-start space-x-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span className="text-gray-300">Standard ERC20 token</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span className="text-gray-300">Minted to staking pool</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span className="text-gray-300">Distributed to stakers</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span className="text-gray-300">Tradeable on DEXs</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Explanations */}
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
          <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700">
            <h3 className="text-white font-bold mb-4 flex items-center space-x-2">
              <span>💡</span>
              <span>Why Separate Contracts?</span>
            </h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start space-x-2">
                <span className="text-purple-400 mt-0.5">•</span>
                <span>
                  <strong>Security:</strong> Isolated risk - exploit in one doesn&apos;t affect others
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-purple-400 mt-0.5">•</span>
                <span>
                  <strong>Upgradability:</strong> Can deploy new staking logic without touching NFTs
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-purple-400 mt-0.5">•</span>
                <span>
                  <strong>Flexibility:</strong> Same NFT can work with multiple staking pools
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-purple-400 mt-0.5">•</span>
                <span>
                  <strong>Gas Efficiency:</strong> Smaller contracts = cheaper deployments
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700">
            <h3 className="text-white font-bold mb-4 flex items-center space-x-2">
              <span>⚙️</span>
              <span>How They Interact</span>
            </h3>
            <ol className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start space-x-2">
                <span className="text-pink-400 font-semibold">1.</span>
                <span>
                  User mints NFT from <code className="bg-black/50 px-1 rounded text-xs">StakableNFT</code>
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-pink-400 font-semibold">2.</span>
                <span>
                  User approves <code className="bg-black/50 px-1 rounded text-xs">NFTStakingPool</code> to transfer NFT
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-pink-400 font-semibold">3.</span>
                <span>
                  Pool contract calls{" "}
                  <code className="bg-black/50 px-1 rounded text-xs">getRewardMultiplier(tokenId)</code>
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-pink-400 font-semibold">4.</span>
                <span>
                  Pool transfers NFT to itself via{" "}
                  <code className="bg-black/50 px-1 rounded text-xs">safeTransferFrom()</code>
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-pink-400 font-semibold">5.</span>
                <span>Pool calculates rewards using multiplier</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-pink-400 font-semibold">6.</span>
                <span>Pool transfers RWRD tokens to user</span>
              </li>
            </ol>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <a
            href="/stake"
            className="inline-block px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-bold text-lg rounded-xl transform hover:scale-105 transition-all duration-300 shadow-xl"
          >
            🔒 Explore Staking Pool
          </a>
        </div>
      </div>
    </section>
  );
}
