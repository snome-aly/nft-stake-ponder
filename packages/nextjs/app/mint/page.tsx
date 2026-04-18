import { MintCard } from "./_components/MintCard";
import { MintHero } from "./_components/MintHero";
import { MintProgress } from "./_components/MintProgress";
import { NFTCarousel } from "./_components/NFTCarousel";
import { RarityInfo } from "./_components/RarityInfo";
import { RecentMints } from "./_components/RecentMints";

export default function MintPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-base)" }}>
      {/* Hero Section */}
      <MintHero />

      {/* Main Content */}
      <section className="py-8">
        <div className="container-premium">
          {/* Mint Card + NFT Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto mb-8">
            <MintCard />
            <NFTCarousel />
          </div>

          {/* Progress */}
          <div className="max-w-4xl mx-auto mb-6">
            <MintProgress />
          </div>

          {/* Rarity Info */}
          <div className="max-w-4xl mx-auto mb-6">
            <RarityInfo />
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
