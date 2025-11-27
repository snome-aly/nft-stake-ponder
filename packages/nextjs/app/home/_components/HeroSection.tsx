"use client";

import { useRouter } from "next/navigation";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

export function HeroSection() {
  const router = useRouter();

  // 读取关键状态
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

  const MAX_SUPPLY = 100;
  const MINT_PRICE = "1 ETH";
  // const progress = totalMinted ? Number((totalMinted * 100n) / BigInt(MAX_SUPPLY)) : 0;

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* 浮动装饰元素 */}
      <div className="absolute top-20 left-10 w-20 h-20 text-purple-400/20 animate-float text-6xl select-none">🎁</div>
      <div
        className="absolute bottom-20 right-10 w-16 h-16 text-pink-400/20 animate-float-slow text-5xl select-none"
        style={{ animationDelay: "2s" }}
      >
        💎
      </div>
      <div
        className="absolute top-40 right-20 w-24 h-24 text-blue-400/20 animate-float text-7xl select-none"
        style={{ animationDelay: "4s" }}
      >
        🌟
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-5xl mx-auto">
          {/* 主标题 */}
          <div className="mb-8">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
              <span className="block bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                🎁 Mystical
              </span>
              <span className="block bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Blind Box NFT
              </span>
            </h1>

            <p className="text-xl sm:text-2xl md:text-3xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Mint a mysterious blind box and await the grand reveal!
              <br className="hidden sm:block" />
              <span className="text-purple-400 font-semibold">Limited to 100 NFTs</span> — only unlocked after sellout
            </p>
          </div>

          {/* 揭示状态指示器 */}
          {!rarityPoolSet && (
            <div className="mb-8 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-xl">
              <p className="text-yellow-300 font-semibold">⚠️ Rarity Pool Setup Required — Minting Not Yet Active</p>
            </div>
          )}

          {totalMinted === BigInt(MAX_SUPPLY) && !isRevealed && (
            <div className="mb-8 p-6 bg-purple-500/20 border-2 border-purple-500/50 rounded-xl animate-pulse">
              <p className="text-purple-300 font-bold text-2xl">🎉 SOLD OUT! Awaiting Admin Reveal...</p>
              <p className="text-gray-300 mt-2">
                All 100 NFTs minted. Rarities will be revealed soon via VRF randomness!
              </p>
            </div>
          )}

          {isRevealed && (
            <div className="mb-8 p-6 bg-green-500/20 border-2 border-green-500/50 rounded-xl">
              <p className="text-green-300 font-bold text-2xl">✨ REVEALED! Check Your Rarity</p>
            </div>
          )}

          {/* CTA 按钮组 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={() => router.push("/mint")}
              disabled={!rarityPoolSet || totalMinted === BigInt(MAX_SUPPLY)}
              className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-lg rounded-xl transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                {totalMinted === BigInt(MAX_SUPPLY) ? "✅ Sold Out" : "🎲 Mint Blind Box"}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:animate-shimmer"></div>
            </button>

            <button
              onClick={() => router.push("/my-nfts")}
              className="px-8 py-4 border-2 border-purple-400/50 hover:border-purple-400 text-purple-400 hover:text-white hover:bg-purple-400/10 font-bold text-lg rounded-xl transform hover:scale-105 transition-all duration-300"
            >
              🖼️ My Collection
            </button>
          </div>

          {/* 铸造进度条 */}
          <CollectionProgress
            totalMinted={totalMinted}
            maxSupply={MAX_SUPPLY}
            mintPrice={MINT_PRICE}
            isRevealed={isRevealed}
          />

          {/* 核心特性展示 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mt-12">
            <FeatureCard icon="🎲" title="Blind Box Mystery" description="Every mint is unrevealed until sellout" />
            <FeatureCard icon="🔒" title="Batch Reveal" description="Fair VRF-based reveal after 100/100 minted" />
            <FeatureCard icon="💎" title="Rarity Rewards" description="Legendary NFTs earn 3x staking rewards" />
          </div>
        </div>
      </div>
    </section>
  );
}

function CollectionProgress({
  totalMinted,
  maxSupply,
  mintPrice,
  isRevealed,
}: {
  totalMinted: bigint | undefined;
  maxSupply: number;
  mintPrice: string;
  isRevealed: boolean | undefined;
}) {
  const progress = totalMinted ? Number((totalMinted * 100n) / BigInt(maxSupply)) : 0;
  const remaining = maxSupply - Number(totalMinted || 0);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-white mb-2">Collection Progress</h3>
        <p className="text-gray-400">Limited Edition • Only {remaining} Blind Boxes Remaining</p>
      </div>

      {/* 进度条 */}
      <div className="relative">
        <div className="w-full bg-gray-800 rounded-full h-6 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-1000 ease-out relative overflow-hidden"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-shimmer"></div>
          </div>
        </div>

        {/* 进度文字 */}
        <div className="flex justify-between items-center mt-4">
          <span className="text-lg font-semibold text-white">
            {totalMinted?.toString() || "0"} / {maxSupply} Minted
          </span>
          <span className="text-lg font-bold text-purple-400">{progress.toFixed(1)}%</span>
        </div>
      </div>

      {/* 铸造信息 */}
      <div className="text-center mt-6">
        <div className="inline-flex items-center space-x-4 bg-gray-800/50 rounded-lg px-6 py-3 backdrop-blur">
          <div className="flex items-center space-x-2">
            <span className="text-gray-400">Mint Price:</span>
            <span className="text-white font-bold">{mintPrice}</span>
          </div>
          <div className="text-gray-600">•</div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-400">Max Per Wallet:</span>
            <span className="text-white font-bold">20 NFTs</span>
          </div>
        </div>

        {/* 揭示状态徽章 */}
        <div className="mt-4">
          {isRevealed ? (
            <span className="inline-flex items-center space-x-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-full border border-green-500/50">
              <span>✅</span>
              <span className="font-semibold">Rarities Revealed</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-2 bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-full border border-yellow-500/50">
              <span>🔒</span>
              <span className="font-semibold">Blind Box State</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-gray-800/30 backdrop-blur rounded-xl p-6 border border-gray-700/50 hover:border-purple-500/50 hover:bg-gray-800/50 transition-all duration-300">
      <div className="text-4xl mb-4 text-center">{icon}</div>
      <h3 className="text-white font-bold text-lg mb-2 text-center">{title}</h3>
      <p className="text-gray-400 text-sm text-center leading-relaxed">{description}</p>
    </div>
  );
}
