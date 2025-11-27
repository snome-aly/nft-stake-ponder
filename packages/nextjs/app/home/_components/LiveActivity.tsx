"use client";

import { useState } from "react";
import { useScaffoldWatchContractEvent } from "~~/hooks/scaffold-eth";

interface MintEvent {
  transactionHash: string;
  owner: string;
  startTokenId: bigint;
  quantity: bigint;
  timestamp: number;
}

export function LiveActivity() {
  const [recentMints, setRecentMints] = useState<MintEvent[]>([]);

  // Listen to NFTMinted events
  useScaffoldWatchContractEvent({
    contractName: "StakableNFT",
    eventName: "NFTMinted",
    onLogs: logs => {
      const newMints = logs.map(log => ({
        transactionHash: log.transactionHash || "",
        owner: log.args.to as string,
        startTokenId: log.args.startTokenId as bigint,
        quantity: log.args.quantity as bigint,
        timestamp: Date.now(),
      }));

      setRecentMints(prev => [...newMints, ...prev].slice(0, 20));
    },
  });

  return (
    <section className="py-20 bg-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">🔥 Live Mint Activity</h2>
            <div className="flex items-center space-x-2 bg-green-500/20 rounded-full px-3 py-1 border border-green-500/50">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-sm font-medium">LIVE</span>
            </div>
          </div>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Watch as collectors mint their blind boxes in real-time. Who will be the lucky one to get Legendary?
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="bg-gray-900/50 backdrop-blur rounded-2xl p-6 sm:p-8 border border-gray-800">
            {/* Mint Activity List */}
            <div className="space-y-3 max-h-96 overflow-y-auto" id="mint-feed">
              {recentMints.length > 0 ? (
                recentMints.map((mint, index) => (
                  <MintFeedItem key={`${mint.transactionHash}-${index}`} mint={mint} index={index} />
                ))
              ) : (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">⏳</div>
                  <h3 className="text-xl font-semibold text-white mb-2">Waiting for First Mint</h3>
                  <p className="text-gray-400">Be the first to mint a mystery blind box!</p>
                  <button
                    onClick={() => (window.location.href = "/mint")}
                    className="mt-6 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:scale-105 transition-transform"
                  >
                    🎲 Be First to Mint
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MintFeedItem({ mint, index }: { mint: MintEvent; index: number }) {
  const timeAgo = useTimeAgo(mint.timestamp);
  const quantity = Number(mint.quantity);
  const tokenIds = Array.from({ length: quantity }, (_, i) => Number(mint.startTokenId) + i);

  return (
    <div
      className="flex items-center justify-between p-4 bg-gray-800/50 hover:bg-gray-800/70 rounded-xl border border-gray-700/50 transition-all animate-slide-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-center space-x-4 flex-1">
        {/* Blind Box Icon */}
        <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-2xl">🎁</span>
        </div>

        {/* Mint Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-white font-semibold truncate">
              {mint.owner.slice(0, 6)}...{mint.owner.slice(-4)}
            </span>
            <span className="text-gray-400 text-sm">minted</span>
            <span className="text-purple-400 font-bold">
              {quantity} Blind Box{quantity > 1 ? "es" : ""}
            </span>
          </div>

          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span>Token ID: {tokenIds.join(", ")}</span>
            <span>•</span>
            <span>{timeAgo}</span>
          </div>
        </div>
      </div>

      {/* Transaction Link */}
      <a
        href={`https://etherscan.io/tx/${mint.transactionHash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="ml-4 text-gray-400 hover:text-purple-400 transition-colors flex-shrink-0"
        title="View on Etherscan"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      </a>
    </div>
  );
}

function useTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
