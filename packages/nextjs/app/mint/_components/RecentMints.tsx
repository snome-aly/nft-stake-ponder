"use client";

import { Address } from "~~/components/scaffold-eth";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth";

export function RecentMints() {
  const { data: mintEvents, isLoading } = useScaffoldEventHistory({
    contractName: "StakableNFT",
    eventName: "NFTMinted",
    fromBlock: 0n,
    watch: true,
  });

  // 获取最近的 8 条记录
  const recentMints = mintEvents?.slice(-8).reverse() || [];

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp * 1000;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  return (
    <div
      className="glass-card rounded-2xl p-4 border border-cyan-500/30 animate-slide-in-up"
      style={{ animationDelay: "0.4s" }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-white">🔥 Recent Mints</h3>
        {isLoading && <span className="text-gray-400 text-sm animate-pulse">Loading...</span>}
      </div>

      {recentMints.length === 0 ? (
        <div className="text-center py-6">
          <span className="text-3xl block mb-1">🎁</span>
          <p className="text-gray-400 text-sm">No mints yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {recentMints.map((event, index) => (
            <div
              key={`${event.transactionHash}-${index}`}
              className="flex items-center justify-between p-2.5 glass-dark rounded-lg hover:bg-white/5 transition-all animate-slide-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Left: Icon + Address */}
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-xs">🎁</span>
                </div>
                <div>
                  <Address address={event.args.to} format="short" />
                </div>
              </div>

              {/* Right: Quantity + Time */}
              <div className="text-right">
                <span className="text-white font-bold text-sm">
                  {Number(event.args.quantity)} NFT{Number(event.args.quantity) > 1 ? "s" : ""}
                </span>
                <p className="text-gray-500 text-xs">{event.blockNumber ? formatTime(Date.now() / 1000) : "Pending"}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View All Link */}
      {recentMints.length > 0 && (
        <div className="mt-3 text-center">
          <a href="/debug" className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors">
            View all transactions →
          </a>
        </div>
      )}
    </div>
  );
}
