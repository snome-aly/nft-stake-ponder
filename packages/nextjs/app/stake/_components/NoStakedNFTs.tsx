import { EmptyState } from "~~/components/EmptyState";

export function NoStakedNFTs() {
  return (
    <EmptyState
      icon="🎴"
      title="No Staked NFTs"
      message="You don't have any staked NFTs yet. Stake your NFTs to start earning rewards!"
      actionLabel="Go to My NFTs"
      actionHref="/my-nfts"
    />
  );
}
