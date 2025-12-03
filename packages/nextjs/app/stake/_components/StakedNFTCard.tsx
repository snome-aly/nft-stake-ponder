"use client";

import Image from "next/image";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { useNFTMetadata } from "~~/hooks/useNFTMetadata";
import { convertIpfsToHttp } from "~~/utils/staking";

type StakedNFT = {
  tokenId: number;
  owner: `0x${string}`;
  stakedAt: bigint;
  lastClaimTime: bigint;
  pendingReward: bigint;
  rarity: number | null;
  rewardMultiplier: number;
};

interface StakedNFTCardProps {
  nft: StakedNFT;
  isSelected: boolean;
  onSelect: () => void;
  onClaim: () => Promise<void>;
  onUnstake: () => Promise<void>;
  isProcessing: boolean;
}

const RARITY_NAMES = ["Common", "Rare", "Epic", "Legendary"];
const RARITY_COLORS = ["text-gray-400", "text-blue-400", "text-purple-400", "text-yellow-400"];
const RARITY_GRADIENTS = [
  "from-gray-400 to-gray-600",
  "from-blue-400 to-blue-600",
  "from-purple-400 to-purple-600",
  "from-yellow-400 to-orange-500",
];

export function StakedNFTCard({ nft, isSelected, onSelect, onClaim, onUnstake, isProcessing }: StakedNFTCardProps) {
  // Get tokenURI from contract
  const { data: tokenURI } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "tokenURI",
    args: [BigInt(nft.tokenId)],
  });

  // Get image URL from metadata
  const { imageUrl } = useNFTMetadata(tokenURI);

  const rarityIndex = nft.rarity ?? 0;

  return (
    <div
      className={`glass-card rounded-2xl overflow-hidden border transition-all group ${
        isSelected ? "ring-2 ring-cyan-500 border-cyan-500" : "border-cyan-500/30"
      }`}
    >
      <div className={`aspect-square bg-gradient-to-br ${RARITY_GRADIENTS[rarityIndex]} relative overflow-hidden`}>
        {imageUrl ? (
          <>
            <Image
              src={convertIpfsToHttp(imageUrl)}
              alt={`StakableNFT #${nft.tokenId}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <span className="text-6xl block mb-2">
                {nft.rarity === 3 ? "👑" : nft.rarity === 2 ? "💎" : nft.rarity === 1 ? "⭐" : "🎴"}
              </span>
              <span className={`text-sm font-bold ${RARITY_COLORS[rarityIndex]}`}>{RARITY_NAMES[rarityIndex]}</span>
            </div>
          </div>
        )}

        <div className="absolute top-3 left-3 px-2 py-1 glass-dark rounded-lg backdrop-blur-md z-10">
          <span className="text-white text-sm font-bold">#{nft.tokenId}</span>
        </div>

        <div className="absolute top-3 right-3 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="w-5 h-5 cursor-pointer accent-cyan-500"
          />
        </div>
      </div>

      <div className="p-4">
        <div className="glass-dark rounded-lg p-3 mb-3 border border-cyan-500/20">
          <p className="text-xs text-gray-400 mb-1">Pending Reward</p>
          <p className="text-cyan-400 font-bold text-xl">{(Number(nft.pendingReward) / 1e18).toFixed(4)} RWRD</p>
          <p className="text-xs text-gray-500 mt-1">~{(nft.rewardMultiplier / 10000).toFixed(1)} RWRD/day</p>
        </div>

        <div className="flex gap-2">
          <button onClick={onClaim} disabled={isProcessing} className="btn-primary flex-1 py-2 text-sm rounded-lg">
            Claim
          </button>
          <button onClick={onUnstake} disabled={isProcessing} className="btn-secondary flex-1 py-2 text-sm rounded-lg">
            Unstake
          </button>
        </div>
      </div>
    </div>
  );
}
