"use client";

import { MintCard } from "./_components/MintCard";
import { MintHero } from "./_components/MintHero";
import { MintProgress } from "./_components/MintProgress";
import { NFTCarousel } from "./_components/NFTCarousel";
import { RecentMints } from "./_components/RecentMints";

export default function MintPage() {
  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <MintHero />

      {/* Main Content */}
      <section className="py-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Mint Card + NFT Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto mb-8">
            <MintCard />
            <NFTCarousel />
          </div>

          {/* Progress */}
          <div className="max-w-4xl mx-auto mb-8">
            <MintProgress />
          </div>

          {/* Recent Mints */}
          <div className="max-w-4xl mx-auto">
            <RecentMints />
          </div>
        </div>
      </section>
    </div>
  );
}
