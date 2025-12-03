"use client";

import { StakedNFTCard } from "./StakedNFTCard";

type StakedNFT = {
  tokenId: number;
  owner: `0x${string}`;
  stakedAt: bigint;
  lastClaimTime: bigint;
  pendingReward: bigint;
  rarity: number | null;
  rewardMultiplier: number;
};

interface StakedNFTGridProps {
  stakedNFTs: StakedNFT[];
  selectedNFTs: number[];
  onSelectNFT: (tokenId: number) => void;
  onClaim: (tokenId: number) => Promise<void>;
  onUnstake: (tokenId: number) => Promise<void>;
  isProcessing: boolean;
}

export function StakedNFTGrid({
  stakedNFTs,
  selectedNFTs,
  onSelectNFT,
  onClaim,
  onUnstake,
  isProcessing,
}: StakedNFTGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {stakedNFTs.map(nft => (
        <StakedNFTCard
          key={nft.tokenId}
          nft={nft}
          isSelected={selectedNFTs.includes(nft.tokenId)}
          onSelect={() => onSelectNFT(nft.tokenId)}
          onClaim={() => onClaim(nft.tokenId)}
          onUnstake={() => onUnstake(nft.tokenId)}
          isProcessing={isProcessing}
        />
      ))}
    </div>
  );
}
