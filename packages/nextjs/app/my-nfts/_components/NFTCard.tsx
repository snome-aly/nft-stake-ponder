"use client";

import Image from "next/image";
import Link from "next/link";
import { StakingLoading } from "./StakingLoading";
import { LoadingSpinner } from "~~/components/LoadingComponents";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { useNFTMetadata } from "~~/hooks/useNFTMetadata";
import { type NFTWithStakeStatus } from "~~/hooks/usePonder";
import { useStakeNFT } from "~~/hooks/useStaking";
import { convertIpfsToHttp } from "~~/utils/staking";

interface NFTCardProps {
  nft: NFTWithStakeStatus;
  priority?: boolean;
  isSelectable?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  onStakeSuccess?: (tokenId: number) => void;
}

const RARITY_CONFIG = {
  0: { name: "Common", color: "from-gray-400 to-gray-600", textColor: "text-gray-400", bg: "bg-gray-500/20" },
  1: { name: "Rare", color: "from-blue-400 to-blue-600", textColor: "text-blue-400", bg: "bg-blue-500/20" },
  2: { name: "Epic", color: "from-purple-400 to-purple-600", textColor: "text-purple-400", bg: "bg-purple-500/20" },
  3: {
    name: "Legendary",
    color: "from-yellow-400 to-orange-500",
    textColor: "text-yellow-400",
    bg: "bg-yellow-500/20",
  },
} as const;

export function NFTCard({
  nft,
  priority = false,
  isSelectable = false,
  isSelected = false,
  onSelect,
  onStakeSuccess,
}: NFTCardProps) {
  const rarityConfig =
    nft.isRevealed && nft.rarity !== null ? RARITY_CONFIG[nft.rarity as keyof typeof RARITY_CONFIG] : null;

  const { data: rewardMultiplier } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "getTokenRewardMultiplier",
    args: [BigInt(nft.tokenId)],
    watch: false, // 倍率不会改变，禁用监听
  });

  const { data: tokenURI } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "tokenURI",
    args: [BigInt(nft.tokenId)],
    watch: false, // URI 不会改变，禁用监听
  });

  const { imageUrl } = useNFTMetadata(tokenURI);
  const { handleStake, isProcessing } = useStakeNFT();

  const handleStakeClick = async () => {
    try {
      await handleStake(nft.tokenId);
      onStakeSuccess?.(nft.tokenId);
    } catch (error) {
      console.error("Stake failed:", error);
    }
  };

  return (
    <div
      className={`glass-card rounded-2xl overflow-hidden border transition-all duration-300 group ${
        isSelected
          ? "ring-2 ring-cyan-500 shadow-cyan-500/50 border-cyan-500"
          : "border-cyan-500/30 hover:border-cyan-400/50"
      }`}
    >
      {/* Image Section */}
      <div
        className={`aspect-square bg-gradient-to-br ${rarityConfig?.color || "from-gray-700 to-gray-900"} relative overflow-hidden`}
      >
        {imageUrl ? (
          <>
            <Image
              src={convertIpfsToHttp(imageUrl)}
              alt={`StakableNFT #${nft.tokenId}`}
              fill
              priority={priority}
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            {nft.isRevealed ? (
              <div className="text-center">
                <span className="text-6xl block mb-2">
                  {nft.rarity === 3 ? "👑" : nft.rarity === 2 ? "💎" : nft.rarity === 1 ? "⭐" : "🎴"}
                </span>
                <span className={`text-sm font-bold ${rarityConfig?.textColor || "text-gray-400"}`}>
                  {rarityConfig?.name || "Unknown"}
                </span>
              </div>
            ) : (
              <div className="text-center">
                <span className="text-6xl block mb-2 animate-pulse">❓</span>
                <span className="text-gray-400 text-sm">Not Revealed</span>
              </div>
            )}
          </div>
        )}

        {/* Token ID Badge */}
        <div className="absolute top-3 left-3 px-2 py-1 glass-dark rounded-lg backdrop-blur-md">
          <span className="text-white text-sm font-bold">#{nft.tokenId}</span>
        </div>

        {/* Top Right Badge - Staked or Rarity */}
        {nft.isStaked ? (
          <div className="absolute top-3 right-3 px-3 py-1.5 glass-dark rounded-full backdrop-blur-md">
            <span className="text-green-400 text-xs font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span>Staked</span>
            </span>
          </div>
        ) : (
          nft.isRevealed &&
          rarityConfig && (
            <div className={`absolute top-3 right-3 px-2 py-1 ${rarityConfig.bg} rounded-lg whitespace-nowrap`}>
              <span className={`text-xs font-bold ${rarityConfig.textColor}`}>{rarityConfig.name}</span>
            </div>
          )
        )}

        {/* Batch Selection Checkbox */}
        {isSelectable && !nft.isStaked && nft.isRevealed && (
          <div className="absolute bottom-3 right-3 z-10">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              onClick={e => e.stopPropagation()}
              className="w-5 h-5 cursor-pointer accent-cyan-500"
            />
          </div>
        )}

        {/* Loading Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm z-20">
            <StakingLoading size="md" message="Staking your NFT..." />
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-bold">StakableNFT #{nft.tokenId}</h3>
          {rewardMultiplier && (
            <span className="text-cyan-400 text-sm font-medium">{Number(rewardMultiplier) / 100}x Reward</span>
          )}
        </div>

        {/* Minted Info */}
        <div className="space-y-2 text-sm mb-3">
          <div className="flex justify-between">
            <span className="text-gray-400">Minted by</span>
            <Address address={nft.mintedBy} format="short" />
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Minted</span>
            <span className="text-gray-300">{new Date(nft.mintedAt * 1000).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-3">
          {nft.isStaked ? (
            <Link
              href="/stake"
              className="btn-secondary w-full text-center block py-2.5 rounded-lg font-medium transition-all hover:bg-purple-600"
            >
              View Detail →
            </Link>
          ) : nft.isRevealed ? (
            <button
              onClick={handleStakeClick}
              disabled={isProcessing}
              className="btn-primary w-full py-2.5 rounded-lg font-medium transition-all hover:bg-cyan-600 hover:shadow-lg hover:shadow-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:shadow-none"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  Staking...
                </span>
              ) : (
                "Stake NFT"
              )}
            </button>
          ) : (
            <div className="w-full py-2.5 text-center rounded-lg bg-gray-800 text-gray-500 font-medium">
              Not Revealed
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
