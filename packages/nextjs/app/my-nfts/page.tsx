"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { gql, request } from "graphql-request";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { useNFTMetadata } from "~~/hooks/useNFTMetadata";

type NFT = {
  id: string;
  tokenId: number;
  owner: `0x${string}`;
  rarity: number | null;
  isRevealed: boolean;
  mintedAt: number;
  mintedBy: `0x${string}`;
};

type NFTsData = { nfts: { items: NFT[]; totalCount: number } };
type NFTCountData = { nfts: { totalCount: number } };

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

const PONDER_URL = process.env.NEXT_PUBLIC_PONDER_URL || "http://localhost:42069";

// 轻量查询：只获取数量
const fetchUserNFTCount = async (address: string) => {
  const query = gql`
    query UserNFTCount($owner: String!) {
      nfts(where: { owner: $owner }) {
        totalCount
      }
    }
  `;
  const data = await request<NFTCountData>(PONDER_URL, query, {
    owner: address.toLowerCase(),
  });
  return data.nfts.totalCount;
};

// 完整查询：获取所有 NFT 详情
const fetchUserNFTs = async (address: string) => {
  const query = gql`
    query UserNFTs($owner: String!) {
      nfts(where: { owner: $owner }, orderBy: "tokenId", orderDirection: "asc") {
        items {
          id
          tokenId
          owner
          rarity
          isRevealed
          mintedAt
          mintedBy
        }
        totalCount
      }
    }
  `;
  const data = await request<NFTsData>(PONDER_URL, query, {
    owner: address.toLowerCase(),
  });
  return data;
};

function NFTCard({ nft }: { nft: NFT }) {
  const rarityConfig =
    nft.isRevealed && nft.rarity !== null ? RARITY_CONFIG[nft.rarity as keyof typeof RARITY_CONFIG] : null;

  const { data: rewardMultiplier } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "getTokenRewardMultiplier",
    args: [BigInt(nft.tokenId)],
  });

  const { data: tokenURI } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "tokenURI",
    args: [BigInt(nft.tokenId)],
  });

  const { imageUrl } = useNFTMetadata(tokenURI);

  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-cyan-500/30 hover:border-cyan-400/50 transition-all duration-300 group">
      <div
        className={`aspect-square bg-gradient-to-br ${rarityConfig?.color || "from-gray-700 to-gray-900"} relative overflow-hidden`}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`StakableNFT #${nft.tokenId}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
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

        <div className="absolute top-3 left-3 px-2 py-1 glass-dark rounded-lg">
          <span className="text-white text-sm font-bold">#{nft.tokenId}</span>
        </div>

        {nft.isRevealed && rarityConfig && (
          <div className={`absolute top-3 right-3 px-2 py-1 ${rarityConfig.bg} rounded-lg`}>
            <span className={`text-sm font-bold ${rarityConfig.textColor}`}>{rarityConfig.name}</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-bold">StakableNFT #{nft.tokenId}</h3>
          {rewardMultiplier && (
            <span className="text-cyan-400 text-sm font-medium">{Number(rewardMultiplier) / 100}x Reward</span>
          )}
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Minted by</span>
            <Address address={nft.mintedBy} format="short" />
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Minted</span>
            <span className="text-gray-300">{new Date(nft.mintedAt * 1000).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="text-8xl mb-6">🎴</div>
      <h3 className="text-2xl font-bold text-white mb-3">No NFTs Found</h3>
      <p className="text-gray-400 mb-6 max-w-md mx-auto">
        You don&apos;t own any StakableNFTs yet. Mint your first NFT to start your collection!
      </p>
      <Link
        href="/mint"
        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold rounded-xl hover:opacity-90 transition-all"
      >
        <span className="mr-2">🎁</span>
        Mint NFT
      </Link>
    </div>
  );
}

function ConnectWalletPrompt() {
  return (
    <div className="text-center py-16">
      <div className="text-8xl mb-6">🔐</div>
      <h3 className="text-2xl font-bold text-white mb-3">Connect Your Wallet</h3>
      <p className="text-gray-400 mb-6 max-w-md mx-auto">Please connect your wallet to view your NFT collection.</p>
    </div>
  );
}

// 简单加载指示器（获取数量时显示）
function SimpleLoading() {
  return (
    <div className="flex justify-center py-16">
      <div className="animate-spin h-10 w-10 border-4 border-cyan-500 border-t-transparent rounded-full" />
    </div>
  );
}

// 骨架卡片加载（获取详情时显示，数量与实际 NFT 数量一致）
function SkeletonCards({ count }: { count: number }) {
  // 限制最多显示 12 个骨架卡片
  const displayCount = Math.min(count, 12);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(displayCount)].map((_, i) => (
        <div key={i} className="glass-card rounded-2xl overflow-hidden border border-cyan-500/30 animate-pulse">
          <div className="aspect-square bg-gray-800" />
          <div className="p-4 space-y-3">
            <div className="h-5 bg-gray-700 rounded w-2/3" />
            <div className="h-4 bg-gray-700 rounded w-1/2" />
            <div className="h-4 bg-gray-700 rounded w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

function StatsBar({ nfts }: { nfts: NFT[] }) {
  const rarityCount = nfts.reduce(
    (acc, nft) => {
      if (nft.isRevealed && nft.rarity !== null) {
        acc[nft.rarity] = (acc[nft.rarity] || 0) + 1;
      }
      return acc;
    },
    {} as Record<number, number>,
  );

  const revealedCount = nfts.filter(nft => nft.isRevealed).length;

  return (
    <div className="glass-card rounded-2xl p-6 border border-cyan-500/30 mb-8">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-white">{nfts.length}</div>
          <div className="text-gray-400 text-sm">Total NFTs</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-cyan-400">{revealedCount}</div>
          <div className="text-gray-400 text-sm">Revealed</div>
        </div>
        {Object.entries(RARITY_CONFIG).map(([rarity, config]) => (
          <div key={rarity} className="text-center hidden md:block">
            <div className={`text-3xl font-bold ${config.textColor}`}>{rarityCount[Number(rarity)] || 0}</div>
            <div className="text-gray-400 text-sm">{config.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PageContent() {
  const { address, isConnected, status } = useAccount();

  // 第一步：获取 NFT 数量
  const {
    data: nftCount,
    isLoading: isCountLoading,
    error: countError,
  } = useQuery({
    queryKey: ["userNFTCount", address],
    queryFn: () => fetchUserNFTCount(address!),
    enabled: !!address && isConnected,
  });

  // 第二步：获取 NFT 详情（仅在数量 > 0 时触发）
  const {
    data: nftsData,
    isLoading: isNFTsLoading,
    error: nftsError,
  } = useQuery({
    queryKey: ["userNFTs", address],
    queryFn: () => fetchUserNFTs(address!),
    enabled: !!address && isConnected && (nftCount ?? 0) > 0,
    refetchInterval: 10000,
  });

  const nfts = nftsData?.nfts?.items || [];
  const error = countError || nftsError;

  // 1. wagmi 正在初始化/重连中
  if (status === "connecting" || status === "reconnecting") {
    return <SimpleLoading />;
  }

  // 2. 未连接钱包
  if (!isConnected) {
    return <ConnectWalletPrompt />;
  }

  // 3. 正在获取数量
  if (isCountLoading) {
    return <SimpleLoading />;
  }

  // 4. 错误状态
  if (error) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">⚠️</div>
        <p className="text-red-400">Failed to load NFTs. Please try again.</p>
      </div>
    );
  }

  // 5. 没有 NFT
  if (nftCount === 0) {
    return <EmptyState />;
  }

  // 6. 有 NFT，正在获取详情
  if (isNFTsLoading || nfts.length === 0) {
    return <SkeletonCards count={nftCount ?? 4} />;
  }

  // 7. 显示真实数据
  return (
    <>
      <StatsBar nfts={nfts} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {nfts.map(nft => (
          <NFTCard key={nft.id} nft={nft} />
        ))}
      </div>
    </>
  );
}

export default function MyNFTsPage() {
  return (
    <div className="min-h-screen bg-black">
      <section className="relative py-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-transparent" />
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-4">
              My NFT Collection
            </h1>
            <p className="text-gray-400">
              View and manage your StakableNFT collection. Each NFT has unique rarity and reward multipliers.
            </p>
          </div>

          <PageContent />
        </div>
      </section>
    </div>
  );
}
