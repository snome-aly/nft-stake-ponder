"use client";

interface StakingStatsBarProps {
  totalStaked: number;
  totalPendingReward: bigint;
  totalClaimed: bigint;
  totalEarned: bigint;
}

export function StakingStatsBar({ totalStaked, totalPendingReward, totalClaimed, totalEarned }: StakingStatsBarProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total Staked */}
      <div className="glass-card rounded-2xl p-6 border border-cyan-500/30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-400 text-sm font-medium">Total Staked NFTs</h3>
          <span className="text-3xl">🔒</span>
        </div>
        <div className="text-4xl font-bold text-white">{totalStaked}</div>
        <p className="text-gray-500 text-sm mt-2">Currently earning rewards</p>
      </div>

      {/* Pending Rewards */}
      <div className="glass-card rounded-2xl p-6 border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-purple-500/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-400 text-sm font-medium">Pending Rewards</h3>
          <span className="text-3xl">💰</span>
        </div>
        <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
          {(Number(totalPendingReward) / 1e18).toFixed(4)} RWRD
        </div>
        <p className="text-gray-500 text-sm mt-2">Updating in real-time</p>
      </div>

      {/* Total Claimed */}
      <div className="glass-card rounded-2xl p-6 border border-cyan-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-400 text-sm font-medium">Total Claimed</h3>
          <span className="text-3xl">✅</span>
        </div>
        <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
          {(Number(totalClaimed) / 1e18).toFixed(4)} RWRD
        </div>
        <p className="text-gray-500 text-sm mt-2">Already in your wallet</p>
      </div>

      {/* Total Earned */}
      <div className="glass-card rounded-2xl p-6 border border-cyan-500/30 bg-gradient-to-br from-yellow-500/10 to-orange-500/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-400 text-sm font-medium">Total Earned</h3>
          <span className="text-3xl">🏆</span>
        </div>
        <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
          {(Number(totalEarned) / 1e18).toFixed(4)} RWRD
        </div>
        <p className="text-gray-500 text-sm mt-2">Lifetime earnings</p>
      </div>
    </div>
  );
}
