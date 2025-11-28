"use client";

import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

export function MintHero() {
  const { data: totalMinted } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "totalMinted",
  });

  const { data: isRevealed } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "isRevealed",
  });

  const maxSupply = 100;
  const isSoldOut = totalMinted !== undefined && Number(totalMinted) >= maxSupply;

  const getStatusBadge = () => {
    if (isRevealed) {
      return (
        <span className="inline-flex items-center space-x-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-full border border-green-500/50">
          <span>✅</span>
          <span className="font-semibold">Revealed</span>
        </span>
      );
    }
    if (isSoldOut) {
      return (
        <span className="inline-flex items-center space-x-2 bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-full border border-yellow-500/50">
          <span>🎉</span>
          <span className="font-semibold">Sold Out - Awaiting Reveal</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-2 bg-purple-500/20 text-purple-400 px-4 py-2 rounded-full border border-purple-500/50 animate-pulse">
        <span>🎁</span>
        <span className="font-semibold">Minting Live</span>
      </span>
    );
  };

  return (
    <section className="py-8 bg-gradient-to-b from-purple-900/30 via-black to-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      <div className="absolute top-10 left-10 text-5xl animate-float opacity-30">🎁</div>
      <div className="absolute top-20 right-20 text-4xl animate-float-slow opacity-30">💎</div>
      <div className="absolute bottom-10 left-1/4 text-3xl animate-float opacity-20">✨</div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center animate-slide-in-up">
          {/* Status Badge */}
          <div className="mb-4">{getStatusBadge()}</div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3">
            <span className="text-gradient-purple">Mint Your</span>
            <span className="text-white"> Blind Box NFT</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base text-gray-300 mx-auto mb-4 whitespace-nowrap">
            Each NFT starts as a mysterious blind box. Rarity is revealed only after all 100 NFTs are minted.
          </p>

          {/* Quick Stats */}
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="glass-card px-4 py-2 rounded-lg border border-purple-500/30">
              <span className="text-gray-400">Price:</span>
              <span className="text-white font-bold ml-2">1 ETH</span>
            </div>
            <div className="glass-card px-4 py-2 rounded-lg border border-purple-500/30">
              <span className="text-gray-400">Supply:</span>
              <span className="text-white font-bold ml-2">100 NFTs</span>
            </div>
            <div className="glass-card px-4 py-2 rounded-lg border border-purple-500/30">
              <span className="text-gray-400">Max per wallet:</span>
              <span className="text-white font-bold ml-2">20 NFTs</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
