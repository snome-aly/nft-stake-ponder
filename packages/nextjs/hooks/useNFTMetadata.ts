import { useEffect, useState } from "react";

export type NFTMetadata = {
  name?: string;
  description?: string;
  image?: string;
  attributes?: Array<{ trait_type: string; value: string | number }>;
};

/**
 * 解析 tokenURI 获取 NFT 元数据
 * 支持格式：
 * - data:application/json;base64,xxx
 * - data:application/json,xxx
 * - http(s)://xxx
 * - ipfs://xxx
 */
export const parseTokenURI = async (tokenURI: string): Promise<NFTMetadata | null> => {
  try {
    // data:application/json;base64 格式
    if (tokenURI.startsWith("data:application/json;base64,")) {
      const json = JSON.parse(atob(tokenURI.split(",")[1]));
      return json;
    }

    // data:application/json 格式
    if (tokenURI.startsWith("data:application/json,")) {
      const json = JSON.parse(decodeURIComponent(tokenURI.split(",")[1]));
      return json;
    }

    // HTTP(S) URL
    if (tokenURI.startsWith("http")) {
      const res = await fetch(tokenURI);
      return await res.json();
    }

    // IPFS URL
    if (tokenURI.startsWith("ipfs://")) {
      const httpUrl = tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/");
      const res = await fetch(httpUrl);
      return await res.json();
    }

    return null;
  } catch {
    return null;
  }
};

/**
 * Hook: 解析 tokenURI 获取 NFT 元数据
 */
export function useNFTMetadata(tokenURI: string | undefined) {
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!tokenURI) {
      setMetadata(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    parseTokenURI(tokenURI)
      .then(data => {
        setMetadata(data);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err);
        setMetadata(null);
        setIsLoading(false);
      });
  }, [tokenURI]);

  return { metadata, isLoading, error, imageUrl: metadata?.image };
}
