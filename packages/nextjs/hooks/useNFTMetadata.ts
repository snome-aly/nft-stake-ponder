import { useEffect, useState } from "react";

export type NFTMetadata = {
  name?: string;
  description?: string;
  image?: string;
  attributes?: Array<{ trait_type: string; value: string | number }>;
};

/**
 * 转换 IPFS URL 为 HTTP Gateway URL
 */
const toGatewayUrl = (url: string): string => {
  if (url.startsWith("ipfs://")) {
    const cid = url.replace("ipfs://", "");
    return `https://gateway.pinata.cloud/ipfs/${cid}`;
  }
  return url;
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
      const base64 = tokenURI.split(",")[1];
      const jsonStr = atob(base64);
      const metadata = JSON.parse(jsonStr);
      // 转换 image URL 为 gateway URL
      if (metadata.image) {
        metadata.image = toGatewayUrl(metadata.image);
      }
      return metadata;
    }

    // data:application/json 格式
    if (tokenURI.startsWith("data:application/json,")) {
      const metadata = JSON.parse(decodeURIComponent(tokenURI.split(",")[1]));
      if (metadata.image) {
        metadata.image = toGatewayUrl(metadata.image);
      }
      return metadata;
    }

    // HTTP(S) URL
    if (tokenURI.startsWith("http")) {
      const res = await fetch(tokenURI);
      const metadata = await res.json();
      if (metadata.image) {
        metadata.image = toGatewayUrl(metadata.image);
      }
      return metadata;
    }

    // IPFS URL - 使用 Pinata gateway
    if (tokenURI.startsWith("ipfs://")) {
      const cid = tokenURI.replace("ipfs://", "");
      const httpUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;
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
