"use client";

import { formatEther } from "viem";
import { useAccount, useBalance } from "wagmi";
import { ConnectWalletPrompt } from "~~/components/ConnectWalletPrompt";
import { ADMIN_ROLE, OPERATOR_ROLE } from "~~/constants/roles";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";

export default function AdminPage() {
  const { address, isConnected } = useAccount();

  // 获取合约信息
  const { data: deployedContractData } = useDeployedContractInfo({ contractName: "StakableNFT" });

  // 读取合约状态
  const { data: totalMinted } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "totalMinted",
  });

  const { data: isRevealed } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "isRevealed",
  });

  const { data: rarityPoolSet } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "rarityPoolSet",
  });

  // ✅ 正确获取合约余额：直接读取合约地址的余额
  const { data: contractBalanceData } = useBalance({
    address: deployedContractData?.address,
  });

  const { data: isPaused } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "paused",
  });

  // 检查权限
  const { data: isAdmin } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "hasRole",
    args: [ADMIN_ROLE, address],
  });

  const { data: isOperator } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "hasRole",
    args: [OPERATOR_ROLE, address],
  });

  // 写入合约
  const { writeContractAsync: writeReveal, isPending: isRevealPending } = useScaffoldWriteContract({
    contractName: "StakableNFT",
  });

  const { writeContractAsync: writeWithdraw, isPending: isWithdrawPending } = useScaffoldWriteContract({
    contractName: "StakableNFT",
  });

  const { writeContractAsync: writePause, isPending: isPausePending } = useScaffoldWriteContract({
    contractName: "StakableNFT",
  });

  // 计算状态
  const MAX_SUPPLY = 100;
  const currentMinted = totalMinted !== undefined ? Number(totalMinted) : 0;
  const canReveal = currentMinted >= MAX_SUPPLY && !isRevealed && isAdmin;
  const balance = contractBalanceData ? formatEther(contractBalanceData.value) : "0";

  // Reveal 操作
  const handleReveal = async () => {
    if (!canReveal) return;

    try {
      await writeReveal({
        functionName: "reveal",
      });
    } catch (error) {
      console.error("Reveal failed:", error);
    }
  };

  // Withdraw 操作（提取全部余额到调用者地址）
  const handleWithdraw = async () => {
    if (!isAdmin) return;

    try {
      await writeWithdraw({
        functionName: "withdraw",
        // 合约的 withdraw() 没有参数，会把所有余额发给 msg.sender
      });
    } catch (error) {
      console.error("Withdraw failed:", error);
    }
  };

  // Pause/Unpause 操作
  const handleTogglePause = async () => {
    if (!isAdmin) return;

    try {
      await writePause({
        functionName: isPaused ? "unpause" : "pause",
      });
    } catch (error) {
      console.error("Pause toggle failed:", error);
    }
  };

  // 权限检查
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <ConnectWalletPrompt title="Admin Panel" message="Please connect your wallet to access admin functions" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-8xl mb-6">⛔</div>
          <h2 className="text-3xl font-bold text-white mb-4">Access Denied</h2>
          <p className="text-gray-400 mb-6">You don&apos;t have admin permissions</p>
          <p className="text-sm text-gray-500">Connected: {address}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-4">
                🛠️ Admin Panel
              </h1>
              <p className="text-gray-400">Manage your StakableNFT contract</p>
              <div className="mt-4 inline-flex items-center space-x-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-full border border-green-500/50">
                <span>✅</span>
                <span className="font-semibold">Admin Access Granted</span>
              </div>
            </div>

            {/* Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <StatCard icon="🎁" label="Total Minted" value={`${currentMinted}/${MAX_SUPPLY}`} color="cyan" />
              <StatCard icon="💰" label="Contract Balance" value={`${Number(balance).toFixed(4)} ETH`} color="green" />
              <StatCard
                icon={isRevealed ? "✅" : "🔒"}
                label="Reveal Status"
                value={isRevealed ? "Revealed" : "Not Revealed"}
                color={isRevealed ? "green" : "yellow"}
              />
              <StatCard
                icon={isPaused ? "⏸️" : "▶️"}
                label="Contract Status"
                value={isPaused ? "Paused" : "Active"}
                color={isPaused ? "red" : "green"}
              />
            </div>

            {/* Main Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Reveal Card */}
              <ActionCard
                title="🎲 Reveal NFTs"
                description="Trigger VRF-based reveal to assign rarities to all minted NFTs"
              >
                <div className="space-y-4">
                  <div className="p-4 bg-gray-800/50 rounded-lg">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-400">Rarity Pool Set:</span>
                      <span className={rarityPoolSet ? "text-green-400" : "text-red-400"}>
                        {rarityPoolSet ? "✅ Yes" : "❌ No"}
                      </span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-400">All Minted:</span>
                      <span className={currentMinted >= MAX_SUPPLY ? "text-green-400" : "text-yellow-400"}>
                        {currentMinted >= MAX_SUPPLY ? "✅ Yes" : `❌ ${currentMinted}/${MAX_SUPPLY}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Already Revealed:</span>
                      <span className={isRevealed ? "text-yellow-400" : "text-green-400"}>
                        {isRevealed ? "⚠️ Yes" : "✅ No"}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleReveal}
                    disabled={!canReveal || isRevealPending}
                    className={`w-full py-3 rounded-xl font-bold transition-all ${
                      canReveal && !isRevealPending
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
                        : "bg-gray-600 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {isRevealPending ? "⏳ Revealing..." : canReveal ? "🚀 Trigger Reveal" : "❌ Cannot Reveal Yet"}
                  </button>

                  {!canReveal && currentMinted < MAX_SUPPLY && (
                    <p className="text-sm text-yellow-400 text-center">
                      ⚠️ Wait for all {MAX_SUPPLY} NFTs to be minted
                    </p>
                  )}
                  {!canReveal && isRevealed && (
                    <p className="text-sm text-yellow-400 text-center">⚠️ Already revealed</p>
                  )}
                </div>
              </ActionCard>

              {/* Withdraw Card */}
              <ActionCard
                title="💸 Withdraw Funds"
                description="Withdraw all ETH from contract to your wallet (admin address)"
              >
                <div className="space-y-4">
                  <div className="p-4 bg-gray-800/50 rounded-lg">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-400">Contract Balance:</span>
                      <span className="text-green-400 font-bold">{Number(balance).toFixed(4)} ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Recipient:</span>
                      <span className="text-white text-sm">
                        Your Wallet ({address?.slice(0, 6)}...{address?.slice(-4)})
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p className="text-yellow-400 text-sm">
                      ⚠️ This will withdraw <strong>all {balance} ETH</strong> to your wallet
                    </p>
                  </div>

                  <button
                    onClick={handleWithdraw}
                    disabled={Number(balance) === 0 || isWithdrawPending}
                    className={`w-full py-3 rounded-xl font-bold transition-all ${
                      Number(balance) > 0 && !isWithdrawPending
                        ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white"
                        : "bg-gray-600 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {isWithdrawPending
                      ? "⏳ Withdrawing..."
                      : Number(balance) > 0
                        ? `💸 Withdraw All (${balance} ETH)`
                        : "❌ No Balance"}
                  </button>
                </div>
              </ActionCard>

              {/* Pause Contract Card */}
              <ActionCard
                title={isPaused ? "▶️ Unpause Contract" : "⏸️ Pause Contract"}
                description={
                  isPaused ? "Resume minting and transfers" : "Emergency stop - disable minting and transfers"
                }
              >
                <div className="space-y-4">
                  <div
                    className={`p-4 rounded-lg ${isPaused ? "bg-red-500/20 border border-red-500/50" : "bg-green-500/20 border border-green-500/50"}`}
                  >
                    <p className={`text-center font-bold ${isPaused ? "text-red-400" : "text-green-400"}`}>
                      {isPaused ? "⚠️ Contract is Paused" : "✅ Contract is Active"}
                    </p>
                  </div>

                  <button
                    onClick={handleTogglePause}
                    disabled={isPausePending}
                    className={`w-full py-3 rounded-xl font-bold transition-all ${
                      isPaused
                        ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
                        : "bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500"
                    } text-white`}
                  >
                    {isPausePending ? "⏳ Processing..." : isPaused ? "▶️ Unpause" : "⏸️ Pause"}
                  </button>
                </div>
              </ActionCard>

              {/* Roles Card */}
              <ActionCard title="👥 Your Roles" description="Your granted permissions">
                <div className="space-y-3">
                  <RoleBadge icon="👑" label="Admin" active={isAdmin || false} />
                  <RoleBadge icon="⚙️" label="Operator" active={isOperator || false} />
                </div>
              </ActionCard>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  const colorClasses = {
    cyan: "from-cyan-500 to-blue-500",
    green: "from-green-500 to-emerald-500",
    yellow: "from-yellow-500 to-orange-500",
    red: "from-red-500 to-pink-500",
  };

  return (
    <div className="glass-card rounded-2xl p-6 border border-gray-700">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="text-gray-400 text-sm mb-2">{label}</p>
      <p
        className={`text-2xl font-bold bg-gradient-to-r ${colorClasses[color as keyof typeof colorClasses]} bg-clip-text text-transparent`}
      >
        {value}
      </p>
    </div>
  );
}

function ActionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-card rounded-2xl p-6 border border-cyan-500/30">
      <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
      <p className="text-gray-400 text-sm mb-6">{description}</p>
      {children}
    </div>
  );
}

function RoleBadge({ icon, label, active }: { icon: string; label: string; active: boolean }) {
  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg ${active ? "bg-green-500/20 border border-green-500/50" : "bg-gray-800/50 border border-gray-700"}`}
    >
      <div className="flex items-center space-x-2">
        <span className="text-2xl">{icon}</span>
        <span className={`font-semibold ${active ? "text-green-400" : "text-gray-500"}`}>{label}</span>
      </div>
      <span className={`text-sm ${active ? "text-green-400" : "text-gray-500"}`}>{active ? "✅ Active" : "❌ No"}</span>
    </div>
  );
}
