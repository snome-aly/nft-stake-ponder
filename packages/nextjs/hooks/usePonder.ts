/**
 * Ponder Data Hooks
 *
 * 统一封装所有 Ponder GraphQL 查询，使用 react-query 进行缓存优化
 * 提供类型安全的数据获取接口
 */
import { useEffect, useRef } from "react";
import { UseQueryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { gql, request } from "graphql-request";

// ============================================
// 类型定义
// ============================================

export type NFT = {
  id: string;
  tokenId: number;
  owner: `0x${string}`;
  rarity: number | null;
  isRevealed: boolean;
  mintedAt: number;
  mintedBy: `0x${string}`;
};

export type ActiveStake = {
  tokenId: number;
  stakedAt: number;
  transactionHash: string;
};

export type StakingEvent = {
  id: string;
  type: "STAKE" | "UNSTAKE" | "CLAIM";
  user: `0x${string}`;
  tokenId: number;
  amount: string | null;
  timestamp: number;
  blockNumber: number;
  transactionHash: string;
};

export type StakingStats = {
  id: `0x${string}`;
  totalStaked: number;
  totalClaimed: string;
  totalEarned: string;
  lastUpdated: number;
};

type NFTsData = { nfts: { items: NFT[] } };
type ActiveStakesData = { activeStakes: { items: ActiveStake[] } };
type StakingEventsData = { stakingEvents: { items: StakingEvent[] } };
type StakingStatsData = { stakingStats: StakingStats | null };

// ============================================
// 配置
// ============================================

const PONDER_URL = process.env.NEXT_PUBLIC_PONDER_URL || "http://localhost:42069";

// 查询键工厂 - 集中管理所有查询键
export const ponderKeys = {
  all: ["ponder"] as const,
  nfts: (address?: string) => [...ponderKeys.all, "nfts", address] as const,
  activeStakes: (address?: string) => [...ponderKeys.all, "activeStakes", address] as const,
  stakingEvents: (address?: string, type?: string) => [...ponderKeys.all, "stakingEvents", address, type] as const,
  stakingStats: (address?: string) => [...ponderKeys.all, "stakingStats", address] as const,
  userAllNFTs: (address?: string) => [...ponderKeys.all, "userAllNFTs", address] as const,
};

// ============================================
// GraphQL 查询函数
// ============================================

/**
 * 查询用户拥有的 NFTs（在钱包中）
 */
export const fetchOwnedNFTs = async (address: string): Promise<NFT[]> => {
  const query = gql`
    query UserOwnedNFTs($owner: String!) {
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
      }
    }
  `;
  const data = await request<NFTsData>(PONDER_URL, query, {
    owner: address.toLowerCase(),
  });
  return data.nfts.items;
};

/**
 * 查询用户质押的 NFTs（含质押时间）
 */
export const fetchActiveStakes = async (address: string): Promise<ActiveStake[]> => {
  const query = gql`
    query UserActiveStakes($user: String!) {
      activeStakes(where: { user: $user }, orderBy: "stakedAt", orderDirection: "desc") {
        items {
          tokenId
          stakedAt
          transactionHash
        }
      }
    }
  `;
  const data = await request<ActiveStakesData>(PONDER_URL, query, {
    user: address.toLowerCase(),
  });
  return data.activeStakes?.items || [];
};

/**
 * 查询质押 NFT 的详细信息（NFT 元数据 + 质押信息）
 */
export const fetchStakedNFTsWithDetails = async (address: string): Promise<(NFT & { stakedAt: number })[]> => {
  const stakes = await fetchActiveStakes(address);
  if (stakes.length === 0) return [];

  const tokenIds = stakes.map(stake => stake.tokenId);
  const nftsQuery = gql`
    query NFTsByTokenIds($tokenIds: [Int!]!) {
      nfts(where: { tokenId_in: $tokenIds }, orderBy: "tokenId", orderDirection: "asc") {
        items {
          id
          tokenId
          owner
          rarity
          isRevealed
          mintedAt
          mintedBy
        }
      }
    }
  `;
  const nftsData = await request<NFTsData>(PONDER_URL, nftsQuery, { tokenIds });

  return nftsData.nfts.items.map(nft => ({
    ...nft,
    stakedAt: stakes.find(s => s.tokenId === nft.tokenId)?.stakedAt || 0,
  }));
};

/**
 * 查询质押事件历史
 */
export const fetchStakingEvents = async (
  address: string,
  options?: { type?: "STAKE" | "UNSTAKE" | "CLAIM"; limit?: number },
): Promise<StakingEvent[]> => {
  const whereClause = options?.type ? `where: { user: $user, type: $type }` : `where: { user: $user }`;

  const query = gql`
    query StakingHistory($user: String!, $type: String) {
      stakingEvents(
        ${whereClause}
        orderBy: "timestamp"
        orderDirection: "desc"
        ${options?.limit ? `limit: ${options.limit}` : ""}
      ) {
        items {
          id
          type
          user
          tokenId
          amount
          timestamp
          blockNumber
          transactionHash
        }
      }
    }
  `;
  const data = await request<StakingEventsData>(PONDER_URL, query, {
    user: address.toLowerCase(),
    type: options?.type,
  });
  return data.stakingEvents?.items || [];
};

/**
 * 查询用户质押统计
 */
export const fetchStakingStats = async (address: string): Promise<StakingStats | null> => {
  const query = gql`
    query StakingStats($user: String!) {
      stakingStats(id: $user) {
        id
        totalStaked
        totalClaimed
        totalEarned
        lastUpdated
      }
    }
  `;
  const data = await request<StakingStatsData>(PONDER_URL, query, {
    user: address.toLowerCase(),
  });
  return data.stakingStats;
};

// ============================================
// React Query Hooks
// ============================================

/**
 * Hook: 获取用户拥有的 NFTs（在钱包中）
 *
 * @param address - 用户地址
 * @param options - react-query 配置选项
 */
export function usePonderOwnedNFTs(
  address?: string,
  options?: Omit<UseQueryOptions<NFT[], Error>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: ponderKeys.nfts(address),
    queryFn: () => fetchOwnedNFTs(address!),
    enabled: !!address,
    staleTime: 30000, // 30秒内数据视为新鲜
    gcTime: 300000, // 5分钟后清理缓存
    ...options,
  });
}

/**
 * Hook: 获取用户质押的 NFTs（含详细信息和质押时间）
 *
 * @param address - 用户地址
 * @param options - react-query 配置选项
 */
export function usePonderStakedNFTs(
  address?: string,
  options?: Omit<UseQueryOptions<(NFT & { stakedAt: number })[], Error>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: ponderKeys.activeStakes(address),
    queryFn: () => fetchStakedNFTsWithDetails(address!),
    enabled: !!address,
    staleTime: 30000,
    gcTime: 300000,
    ...options,
  });
}

/**
 * Hook: 获取用户所有 NFT（钱包 + 质押），带质押状态
 *
 * 优化版本：一次性获取所有数据，内部使用 Promise.all 并行查询
 *
 * @param address - 用户地址
 * @param options - react-query 配置选项
 */
export type NFTWithStakeStatus = NFT & {
  isStaked: boolean;
  stakedAt?: number;
};

export function usePonderUserAllNFTs(
  address?: string,
  options?: Omit<UseQueryOptions<NFTWithStakeStatus[], Error>, "queryKey" | "queryFn">,
) {
  const queryKey = ponderKeys.userAllNFTs(address);

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!address) return [];

      try {
        // 查询1: 获取用户质押记录
        const activeStakes = await fetchActiveStakes(address);
        const stakedTokenIds = activeStakes.map(stake => stake.tokenId);

        // 查询2: 一次性获取所有 NFT（钱包中的 + 质押的）
        const allNFTsQuery = gql`
          query UserAllNFTs($owner: String!, $tokenIds: [Int!]!) {
            nfts(
              where: { OR: [{ owner: $owner }, { tokenId_in: $tokenIds }] }
              orderBy: "tokenId"
              orderDirection: "asc"
            ) {
              items {
                id
                tokenId
                owner
                rarity
                isRevealed
                mintedAt
                mintedBy
              }
            }
          }
        `;

        const nftsData = await request<NFTsData>(PONDER_URL, allNFTsQuery, {
          owner: address.toLowerCase(),
          tokenIds: stakedTokenIds,
        });

        // 创建质押信息映射
        const stakeMap = new Map(activeStakes.map(stake => [stake.tokenId, stake.stakedAt]));

        // 标记质押状态并返回
        const result = nftsData.nfts.items
          .map(nft => ({
            ...nft,
            isStaked: stakeMap.has(nft.tokenId),
            stakedAt: stakeMap.get(nft.tokenId),
          }))
          .sort((a, b) => a.tokenId - b.tokenId);

        return result;
      } catch (error) {
        console.error("❌ [usePonderUserAllNFTs] Error:", error);
        throw error;
      }
    },
    enabled: !!address,
    staleTime: 30000, // 30秒内数据视为新鲜
    gcTime: 300000, // 5分钟后清理缓存
    ...options,
  });

  return {
    ...query,
    queryKey,
  };
}

/**
 * Hook: 获取质押事件历史
 *
 * @param address - 用户地址
 * @param options - 查询选项（type, limit）
 * @param queryOptions - react-query 配置选项
 */
export function usePonderStakingEvents(
  address?: string,
  options?: { type?: "STAKE" | "UNSTAKE" | "CLAIM"; limit?: number },
  queryOptions?: Omit<UseQueryOptions<StakingEvent[], Error>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: ponderKeys.stakingEvents(address, options?.type),
    queryFn: () => fetchStakingEvents(address!, options),
    enabled: !!address,
    staleTime: 10000, // 历史数据可以稍微旧一点
    gcTime: 60000,
    ...queryOptions,
  });
}

/**
 * Hook: 获取用户质押统计
 *
 * @param address - 用户地址
 * @param options - react-query 配置选项
 */
export function usePonderStakingStats(
  address?: string,
  options?: Omit<UseQueryOptions<StakingStats | null, Error>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: ponderKeys.stakingStats(address),
    queryFn: () => fetchStakingStats(address!),
    enabled: !!address,
    staleTime: 30000,
    gcTime: 300000,
    ...options,
  });
}

// ============================================
// 智能刷新 Hook
// ============================================

/**
 * Hook: 监听 Ponder 数据变化并自动刷新
 *
 * 使用轮询机制检测 Ponder 最新数据的时间戳，
 * 当检测到新数据时自动失效相关缓存
 *
 * @param address - 用户地址
 * @param enabled - 是否启用
 */
export function usePonderAutoRefresh(address?: string, enabled = true) {
  const queryClient = useQueryClient();
  const lastUpdateRef = useRef<number>(0);

  // 轮询质押统计的 lastUpdated 字段来检测数据变化
  const { data: stats } = usePonderStakingStats(address, {
    enabled: enabled && !!address,
    refetchInterval: 3000, // 每3秒检查一次
  });

  useEffect(() => {
    if (!stats || !enabled) return;

    const currentUpdate = stats.lastUpdated;

    // 检测到新的更新
    if (lastUpdateRef.current > 0 && currentUpdate > lastUpdateRef.current) {
      // 失效所有相关缓存，触发重新获取
      queryClient.invalidateQueries({ queryKey: ponderKeys.nfts(address) });
      queryClient.invalidateQueries({ queryKey: ponderKeys.activeStakes(address) });
      queryClient.invalidateQueries({ queryKey: ponderKeys.stakingEvents(address) });
    }

    lastUpdateRef.current = currentUpdate;
  }, [stats, address, enabled, queryClient]);
}

/**
 * Hook: 手动刷新用户相关的所有 Ponder 数据
 *
 * 用于交易成功后手动触发刷新
 *
 * @param address - 用户地址
 */
export function useRefreshPonderData(address?: string) {
  const queryClient = useQueryClient();

  return () => {
    if (!address) return;

    // 失效所有用户相关的查询
    queryClient.invalidateQueries({ queryKey: ponderKeys.nfts(address) });
    queryClient.invalidateQueries({ queryKey: ponderKeys.activeStakes(address) });
    queryClient.invalidateQueries({ queryKey: ponderKeys.stakingEvents(address) });
    queryClient.invalidateQueries({ queryKey: ponderKeys.stakingStats(address) });
  };
}
