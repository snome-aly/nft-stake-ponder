"use client";

export function BlindBoxShowcase() {
  return (
    <section className="py-12 bg-black relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-10 animate-slide-in-up">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 text-gradient-purple">
            🎁 How Blind Boxes Work
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Experience the thrill of mystery. All NFTs start as blind boxes with hidden rarities, revealed only after
            complete sellout.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Unrevealed State Card */}
          <div className="glass-card rounded-2xl p-5 border-neon-gold animate-slide-in tilt-3d">
            <div className="text-center mb-6">
              <span className="inline-flex items-center space-x-2 glass-medium text-yellow-400 px-4 py-2 rounded-full border-neon-gold mb-4">
                <span>🔒</span>
                <span className="font-semibold">Unrevealed State</span>
              </span>
              <h3 className="text-2xl font-bold text-white">Before Reveal</h3>
            </div>

            {/* Blind Box Visual */}
            <div className="mb-6 flex justify-center">
              <div className="w-48 h-48 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl flex items-center justify-center border-4 border-gray-600 relative overflow-hidden group tilt-3d animate-scale-pulse">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 animate-pulse"></div>
                <span className="text-6xl relative z-10 group-hover:scale-125 transition-transform duration-300">
                  🎁
                </span>
              </div>
            </div>

            {/* Terminal-styled Metadata */}
            <div className="terminal-glow rounded-lg p-4 font-mono text-sm mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-green-400 text-xs ml-2">metadata.json</span>
              </div>
              <pre className="text-green-300 overflow-x-auto text-xs leading-relaxed">
                {`{
  "name": "Stakable NFT #42",
  "description": "A mysterious blind box...",
  "image": "ipfs://Qmd2S...S1cKk",
  "attributes": [
    { "trait_type": "Rarity",           "value": "???" },
    { "trait_type": "Reward Multiplier","value": "???" },
    { "trait_type": "Multiplier Value", "value": "???" },
    { "trait_type": "Status",           "value": "Unrevealed" }
  ]
}`}
              </pre>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-gray-400">
                <span>❌</span>
                <span>Rarity Hidden</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-400">
                <span>❌</span>
                <span>Multiplier Unknown</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-400">
                <span>❌</span>
                <span>Cannot Query getRarity()</span>
              </div>
            </div>
          </div>

          {/* Revealed State Card */}
          <div
            className="glass-card rounded-2xl p-5 border-neon-blue animate-slide-in tilt-3d"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="text-center mb-6">
              <span className="inline-flex items-center space-x-2 glass-medium text-green-400 px-4 py-2 rounded-full border-neon-blue mb-4 animate-glow-blue">
                <span>✅</span>
                <span className="font-semibold">Revealed State</span>
              </span>
              <h3 className="text-2xl font-bold text-white">After Reveal</h3>
            </div>

            {/* Revealed NFT Visual */}
            <div className="mb-6 flex justify-center">
              <div className="w-48 h-48 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center border-4 border-yellow-400 relative overflow-hidden group tilt-3d animate-glow-gold">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/30 to-orange-500/30 animate-pulse"></div>
                <span className="text-6xl relative z-10 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300">
                  🌟
                </span>
              </div>
            </div>

            {/* Terminal-styled Metadata */}
            <div className="terminal-glow rounded-lg p-4 font-mono text-sm mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-green-400 text-xs ml-2">metadata.json</span>
              </div>
              <pre className="text-green-300 overflow-x-auto text-xs leading-relaxed">
                {`{
  "name": "Stakable NFT #42",
  "description": "A Legendary stakable NFT!",
  "image": "ipfs://QmZH...sjtf",
  "attributes": [
    { "trait_type": "Rarity",           "value": "Legendary" },
    { "trait_type": "Reward Multiplier","value": "3x" },
    { "trait_type": "Multiplier Value", "value": 30000 },
    { "trait_type": "Status",           "value": "Revealed" }
  ]
}`}
              </pre>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-green-400">
                <span>✅</span>
                <span>Rarity Visible</span>
              </div>
              <div className="flex items-center space-x-2 text-green-400">
                <span>✅</span>
                <span>Multiplier Known</span>
              </div>
              <div className="flex items-center space-x-2 text-green-400">
                <span>✅</span>
                <span>Ready to Stake</span>
              </div>
            </div>
          </div>
        </div>

        {/* VRF Explanation */}
        <div className="mt-10 max-w-3xl mx-auto animate-slide-in-up" style={{ animationDelay: "0.4s" }}>
          <div className="glass-card rounded-2xl p-6 border-neon-purple">
            <h3 className="text-2xl font-bold text-white mb-4 text-center text-gradient-purple">
              🎲 VRF-Based Fair Reveal
            </h3>
            <div className="space-y-3 text-gray-300">
              <div className="grid grid-cols-[5rem_1fr] gap-x-4 items-baseline">
                <div className="text-purple-400 font-bold">When?</div>
                <p>Only after all 100 NFTs are minted (sellout)</p>
              </div>
              <div className="grid grid-cols-[5rem_1fr] gap-x-4 items-baseline">
                <div className="text-purple-400 font-bold">Who?</div>
                <p>
                  Admin triggers reveal using <code className="terminal-glow px-2 py-1 rounded text-xs">reveal()</code>{" "}
                  function
                </p>
              </div>
              <div className="grid grid-cols-[5rem_1fr] gap-x-4 items-baseline">
                <div className="text-purple-400 font-bold">How?</div>
                <p>Random offset calculated via VRF (Verifiable Random Function)</p>
              </div>
              <div className="grid grid-cols-[5rem_1fr] gap-x-4 items-baseline">
                <div className="text-purple-400 font-bold">Result?</div>
                <p>All 100 NFTs reveal simultaneously with fair rarity distribution</p>
              </div>
            </div>

            <div className="mt-6 p-4 glass-dark rounded-lg border border-yellow-500/30">
              <p className="text-sm text-gray-300 leading-relaxed">
                <span className="text-yellow-400 font-semibold">⚠️ Note:</span> Current implementation uses{" "}
                <code className="terminal-glow px-1 rounded text-xs">blockhash</code> for randomness. Production
                deployment will integrate <strong className="text-green-400">Chainlink VRF</strong> for
                cryptographically secure randomness.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
