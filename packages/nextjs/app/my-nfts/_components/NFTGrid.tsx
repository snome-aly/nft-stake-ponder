"use client";

import { NFTCard } from "./NFTCard";
import { type NFTWithStakeStatus } from "~~/hooks/usePonder";

interface NFTGridProps {
  nfts: NFTWithStakeStatus[];
  isBatchMode: boolean;
  selectedNFTs: number[];
  onSelectNFT: (tokenId: number) => void;
  onStakeSuccess: (tokenId: number) => void;
}

export function NFTGrid({ nfts, isBatchMode, selectedNFTs, onSelectNFT, onStakeSuccess }: NFTGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {nfts.map((nft, index) => (
        <NFTCard
          key={nft.id}
          nft={nft}
          priority={index < 4}
          isSelectable={isBatchMode && !nft.isStaked && nft.isRevealed}
          isSelected={selectedNFTs.includes(nft.tokenId)}
          onSelect={() => onSelectNFT(nft.tokenId)}
          onStakeSuccess={onStakeSuccess}
        />
      ))}
    </div>
  );
}
