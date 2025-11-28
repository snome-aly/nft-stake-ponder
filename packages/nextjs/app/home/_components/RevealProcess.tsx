"use client";

const steps = [
  {
    number: 1,
    icon: "🔗",
    title: "Connect Wallet",
    description: "Connect your Web3 wallet (MetaMask, WalletConnect, etc.)",
    details: "Supports all major Ethereum wallets via RainbowKit",
    status: "User Action",
  },
  {
    number: 2,
    icon: "🎁",
    title: "Mint Blind Box",
    description: "Pay 1 ETH to mint your mystery NFT (max 20 per wallet)",
    details: "Receive unrevealed NFT with blind box metadata",
    status: "User Action",
  },
  {
    number: 3,
    icon: "⏳",
    title: "Wait for Sellout",
    description: "All 100 NFTs must be minted before reveal can trigger",
    details: "Track progress in real-time on homepage",
    status: "Community Progress",
  },
  {
    number: 4,
    icon: "🎲",
    title: "Admin Triggers Reveal",
    description: "Project admin calls reveal() function with VRF randomness",
    details: "Random offset ensures fair rarity distribution",
    status: "Admin Action",
  },
  {
    number: 5,
    icon: "✨",
    title: "Batch Reveal",
    description: "All 100 NFTs reveal simultaneously with assigned rarities",
    details: "Metadata updates instantly via on-chain generation",
    status: "Automated",
  },
  {
    number: 6,
    icon: "💎",
    title: "Stake & Earn",
    description: "Transfer revealed NFT to staking pool contract to earn RWRD tokens",
    details: "Rewards based on your rarity multiplier (1x-3x)",
    status: "User Action",
  },
];

export function RevealProcess() {
  return (
    <section className="py-20 bg-gradient-to-br from-purple-900/20 to-blue-900/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">🎯 Complete User Journey</h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto whitespace-nowrap">
            From minting to staking in 6 transparent steps. Understand the full process before you begin.
          </p>
        </div>

        {/* Desktop Timeline Layout */}
        <div className="hidden lg:block max-w-6xl mx-auto">
          <div className="relative">
            {/* Connection Line */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 -translate-y-1/2"></div>

            {/* Step Cards */}
            <div className="grid grid-cols-6 gap-4 relative z-10">
              {steps.map(step => (
                <StepCard key={step.number} step={step} layout="vertical" />
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Vertical Layout */}
        <div className="lg:hidden max-w-2xl mx-auto space-y-6">
          {steps.map(step => (
            <StepCard key={step.number} step={step} layout="horizontal" />
          ))}
        </div>

        {/* VRF Fairness Explanation */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 backdrop-blur rounded-2xl p-8 border border-indigo-500/50">
            <h3 className="text-2xl font-bold text-white mb-6 text-center flex items-center justify-center space-x-3">
              <span>🔐</span>
              <span>Provably Fair Randomness</span>
            </h3>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-black/30 rounded-xl p-6">
                <h4 className="text-purple-400 font-semibold mb-3">How VRF Works</h4>
                <ol className="space-y-2 text-sm text-gray-200">
                  <li>
                    1. Admin calls <code className="bg-black/50 px-1 rounded">reveal()</code> after sellout
                  </li>
                  <li>2. Random number generated via VRF oracle</li>
                  <li>
                    3. Offset calculated: <code className="bg-black/50 px-1 rounded">offset = randomNum % 100</code>
                  </li>
                  <li>
                    4. Each tokenId maps to:{" "}
                    <code className="bg-black/50 px-1 rounded">rarityPool[(tokenId + offset) % 100]</code>
                  </li>
                  <li>5. All rarities assigned in single transaction</li>
                </ol>
              </div>

              <div className="bg-black/30 rounded-xl p-6">
                <h4 className="text-pink-400 font-semibold mb-3">Why It&apos;s Fair</h4>
                <ul className="space-y-2 text-sm text-gray-200">
                  <li>✅ Rarity pool shuffled off-chain before deployment</li>
                  <li>✅ Random offset prevents prediction</li>
                  <li>✅ All 100 NFTs revealed simultaneously</li>
                  <li>✅ No individual advantage based on mint order</li>
                  <li>✅ Distribution locked to 50/30/15/5%</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-sm text-gray-200 leading-relaxed">
                <span className="text-yellow-400 font-semibold">⚠️ Current Implementation:</span> Using{" "}
                <code className="bg-black/50 px-1 rounded">
                  keccak256(block.timestamp, block.prevrandao, msg.sender, totalMinted)
                </code>{" "}
                for demo. Production will integrate <strong className="text-green-400">Chainlink VRF</strong> for
                cryptographic randomness.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <button
            onClick={() => (window.location.href = "/mint")}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-lg rounded-xl transform hover:scale-105 transition-all duration-300 shadow-xl"
          >
            🚀 Start Minting Now
          </button>
          <p className="text-gray-300 mt-4 text-sm">
            New to Web3?{" "}
            <a href="/guide" className="text-purple-400 hover:text-purple-300 underline">
              Read our beginner&apos;s guide
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

function StepCard({ step, layout }: { step: (typeof steps)[0]; layout: "vertical" | "horizontal" }) {
  if (layout === "vertical") {
    return (
      <div className="relative">
        {/* Step Circle */}
        <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-gray-900 relative z-20">
          <span className="text-white font-bold">{step.number}</span>
        </div>

        {/* Card Content */}
        <div className="bg-gray-800/50 backdrop-blur rounded-xl p-4 border border-gray-700 hover:border-purple-500/50 transition-all">
          <div className="text-center mb-2">
            <span className="text-3xl">{step.icon}</span>
          </div>
          <h3 className="text-white font-bold text-sm mb-2 text-center">{step.title}</h3>
          <p className="text-gray-200 text-xs leading-relaxed">{step.description}</p>
          <div className="mt-3 pt-3 border-t border-gray-700">
            <span className="text-xs text-purple-400 block text-center">{step.status}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start space-x-4 bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700">
      <div className="flex-shrink-0">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
          <span className="text-white font-bold">{step.number}</span>
        </div>
      </div>
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-2xl">{step.icon}</span>
          <h3 className="text-white font-bold">{step.title}</h3>
        </div>
        <p className="text-gray-200 text-sm mb-2">{step.description}</p>
        <p className="text-gray-400 text-xs mb-2">{step.details}</p>
        <span className="inline-block text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">{step.status}</span>
      </div>
    </div>
  );
}
