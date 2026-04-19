import { EmptyState } from "~~/components/EmptyState";

export function NoStakedNFTs() {
  return (
    <EmptyState
      title="No Staked NFTs"
      message="Staking opens after the mint phase ends and the collection is revealed. Once revealed, stake your NFTs to earn RWRD rewards."
      actionLabel="View Collection"
      actionHref="/my-nfts"
    />
  );
}
