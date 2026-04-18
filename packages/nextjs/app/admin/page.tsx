"use client";

import { formatEther } from "viem";
import { useAccount, useBalance } from "wagmi";
import { ConnectWalletPrompt } from "~~/components/ConnectWalletPrompt";
import { FadeInUp } from "~~/components/ui/AnimatedCard";
import { ADMIN_ROLE, OPERATOR_ROLE } from "~~/constants/roles";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";

export default function AdminPage() {
  const { address, isConnected } = useAccount();

  const { data: deployedContractData } = useDeployedContractInfo({ contractName: "StakableNFT" });

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

  const { data: contractBalanceData } = useBalance({
    address: deployedContractData?.address,
  });

  const { data: isPaused } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "paused",
  });

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

  const { writeContractAsync: writeReveal, isPending: isRevealPending } = useScaffoldWriteContract({
    contractName: "StakableNFT",
  });

  const { writeContractAsync: writeWithdraw, isPending: isWithdrawPending } = useScaffoldWriteContract({
    contractName: "StakableNFT",
  });

  const { writeContractAsync: writePause, isPending: isPausePending } = useScaffoldWriteContract({
    contractName: "StakableNFT",
  });

  const MAX_SUPPLY = 100;
  const currentMinted = totalMinted !== undefined ? Number(totalMinted) : 0;
  const canReveal = currentMinted >= MAX_SUPPLY && !isRevealed && isAdmin;
  const balance = contractBalanceData ? formatEther(contractBalanceData.value) : "0";

  const handleReveal = async () => {
    if (!canReveal) return;
    try {
      await writeReveal({ functionName: "reveal" });
    } catch (error) {
      console.error("Reveal failed:", error);
    }
  };

  const handleWithdraw = async () => {
    if (!isAdmin) return;
    try {
      await writeWithdraw({ functionName: "withdraw" });
    } catch (error) {
      console.error("Withdraw failed:", error);
    }
  };

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

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-base)" }}>
        <ConnectWalletPrompt title="Admin Panel" message="Please connect your wallet to access admin functions" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-base)" }}>
        <div className="text-center">
          <div
            className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{ backgroundColor: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ color: "#ef4444" }}>
              <path
                d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2
            className="text-2xl font-bold mb-4"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
          >
            Access Denied
          </h2>
          <p className="text-sm mb-6" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
            You don&apos;t have admin permissions
          </p>
          <p className="text-xs font-mono" style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
            Connected: {address}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-base)" }}>
      <section className="py-12">
        <div className="container-premium">
          <FadeInUp className="text-center mb-12">
            <h1
              className="text-4xl font-bold mb-4"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em", color: "var(--text-primary)" }}
            >
              Admin Panel
            </h1>
            <p className="text-base" style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}>
              Manage your StakableNFT contract
            </p>
            <div
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full"
              style={{
                backgroundColor: "var(--success-muted)",
                border: "1px solid rgba(16,185,129,0.3)",
                color: "var(--success)",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--success)" }} />
              <span className="text-sm font-medium" style={{ fontFamily: "var(--font-body)" }}>
                Admin Access Granted
              </span>
            </div>
          </FadeInUp>

          {/* Status Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="card p-5" style={{ backgroundColor: "var(--bg-elevated)" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
                  Total Minted
                </span>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: "var(--bg-card)" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[var(--text-muted)]">
                    <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </div>
              </div>
              <div
                className="text-2xl font-bold"
                style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
              >
                {currentMinted}/{MAX_SUPPLY}
              </div>
            </div>

            <div className="card p-5" style={{ backgroundColor: "var(--bg-elevated)" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
                  Contract Balance
                </span>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: "var(--success-muted)" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: "var(--success)" }}>
                    <path
                      d="M12 2v4m0 12v4m-6-10H2m20 0h-4M6.34 6.34L4.93 4.93m14.14 14.14l-1.41-1.41M6.34 17.66l-1.41 1.41"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
              <div
                className="text-2xl font-bold"
                style={{ fontFamily: "var(--font-display)", color: "var(--success)" }}
              >
                {Number(balance).toFixed(4)} ETH
              </div>
            </div>

            <div className="card p-5" style={{ backgroundColor: "var(--bg-elevated)" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
                  Reveal Status
                </span>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: isRevealed ? "var(--success-muted)" : "var(--warning-muted)" }}
                >
                  {isRevealed ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: "var(--success)" }}>
                      <path
                        d="M5 12l5 5L20 7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: "var(--warning)" }}>
                      <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  )}
                </div>
              </div>
              <div
                className="text-xl font-bold"
                style={{ fontFamily: "var(--font-display)", color: isRevealed ? "var(--success)" : "var(--warning)" }}
              >
                {isRevealed ? "Revealed" : "Not Revealed"}
              </div>
            </div>

            <div className="card p-5" style={{ backgroundColor: "var(--bg-elevated)" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
                  Contract Status
                </span>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: isPaused ? "rgba(239,68,68,0.15)" : "var(--success-muted)" }}
                >
                  {isPaused ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: "#ef4444" }}>
                      <rect
                        x="6"
                        y="4"
                        width="4"
                        height="16"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <rect
                        x="14"
                        y="4"
                        width="4"
                        height="16"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: "var(--success)" }}>
                      <path
                        d="M5 12l5 5L20 7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
              </div>
              <div
                className="text-xl font-bold"
                style={{ fontFamily: "var(--font-display)", color: isPaused ? "#ef4444" : "var(--success)" }}
              >
                {isPaused ? "Paused" : "Active"}
              </div>
            </div>
          </div>

          {/* Main Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Reveal Card */}
            <div className="card p-6" style={{ backgroundColor: "var(--bg-elevated)" }}>
              <h2
                className="text-lg font-semibold mb-2"
                style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
              >
                Reveal NFTs
              </h2>
              <p className="text-sm mb-4" style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}>
                Trigger VRF-based reveal to assign rarities to all minted NFTs
              </p>

              <div className="space-y-3 mb-4 p-4 rounded-lg" style={{ backgroundColor: "var(--bg-card)" }}>
                <div className="flex justify-between text-sm">
                  <span style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>Rarity Pool Set:</span>
                  <span style={{ fontFamily: "var(--font-body)", color: rarityPoolSet ? "var(--success)" : "#ef4444" }}>
                    {rarityPoolSet ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>All Minted:</span>
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      color: currentMinted >= MAX_SUPPLY ? "var(--success)" : "var(--warning)",
                    }}
                  >
                    {currentMinted >= MAX_SUPPLY ? "Yes" : `${currentMinted}/${MAX_SUPPLY}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>Already Revealed:</span>
                  <span
                    style={{ fontFamily: "var(--font-body)", color: isRevealed ? "var(--warning)" : "var(--success)" }}
                  >
                    {isRevealed ? "Yes" : "No"}
                  </span>
                </div>
              </div>

              <button
                onClick={handleReveal}
                disabled={!canReveal || isRevealPending}
                className={`w-full py-3 rounded-xl text-sm font-medium transition-all ${canReveal && !isRevealPending ? "btn btn-primary" : "btn"}`}
                style={
                  !canReveal || isRevealPending ? { backgroundColor: "var(--bg-card)", color: "var(--text-muted)" } : {}
                }
              >
                {isRevealPending ? "Revealing..." : canReveal ? "Trigger Reveal" : "Cannot Reveal Yet"}
              </button>

              {!canReveal && currentMinted < MAX_SUPPLY && (
                <p
                  className="text-sm text-center mt-2"
                  style={{ fontFamily: "var(--font-body)", color: "var(--warning)" }}
                >
                  Wait for all {MAX_SUPPLY} NFTs to be minted
                </p>
              )}
              {!canReveal && isRevealed && (
                <p
                  className="text-sm text-center mt-2"
                  style={{ fontFamily: "var(--font-body)", color: "var(--warning)" }}
                >
                  Already revealed
                </p>
              )}
            </div>

            {/* Withdraw Card */}
            <div className="card p-6" style={{ backgroundColor: "var(--bg-elevated)" }}>
              <h2
                className="text-lg font-semibold mb-2"
                style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
              >
                Withdraw Funds
              </h2>
              <p className="text-sm mb-4" style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}>
                Withdraw all ETH from contract to your wallet
              </p>

              <div className="space-y-3 mb-4 p-4 rounded-lg" style={{ backgroundColor: "var(--bg-card)" }}>
                <div className="flex justify-between text-sm">
                  <span style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>Contract Balance:</span>
                  <span className="font-bold" style={{ fontFamily: "var(--font-body)", color: "var(--success)" }}>
                    {Number(balance).toFixed(4)} ETH
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>Recipient:</span>
                  <span
                    className="text-xs font-mono"
                    style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}
                  >
                    Your Wallet ({address?.slice(0, 6)}...{address?.slice(-4)})
                  </span>
                </div>
              </div>

              <div
                className="p-3 rounded-lg mb-4"
                style={{ backgroundColor: "var(--warning-muted)", border: "1px solid rgba(251,191,36,0.3)" }}
              >
                <p className="text-sm" style={{ fontFamily: "var(--font-body)", color: "var(--warning)" }}>
                  This will withdraw all {balance} ETH to your wallet
                </p>
              </div>

              <button
                onClick={handleWithdraw}
                disabled={Number(balance) === 0 || isWithdrawPending}
                className={`w-full py-3 rounded-xl text-sm font-medium transition-all ${Number(balance) > 0 && !isWithdrawPending ? "btn btn-primary" : "btn"}`}
                style={
                  Number(balance) === 0 || isWithdrawPending
                    ? { backgroundColor: "var(--bg-card)", color: "var(--text-muted)" }
                    : {}
                }
              >
                {isWithdrawPending
                  ? "Withdrawing..."
                  : Number(balance) > 0
                    ? `Withdraw All (${balance} ETH)`
                    : "No Balance"}
              </button>
            </div>

            {/* Pause Contract Card */}
            <div className="card p-6" style={{ backgroundColor: "var(--bg-elevated)" }}>
              <h2
                className="text-lg font-semibold mb-2"
                style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
              >
                {isPaused ? "Unpause Contract" : "Pause Contract"}
              </h2>
              <p className="text-sm mb-4" style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}>
                {isPaused ? "Resume minting and transfers" : "Emergency stop - disable minting and transfers"}
              </p>

              <div
                className="p-4 rounded-lg mb-4"
                style={{
                  backgroundColor: isPaused ? "rgba(239,68,68,0.15)" : "var(--success-muted)",
                  border: `1px solid ${isPaused ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`,
                }}
              >
                <p
                  className="text-center font-medium"
                  style={{ fontFamily: "var(--font-body)", color: isPaused ? "#ef4444" : "var(--success)" }}
                >
                  {isPaused ? "Contract is Paused" : "Contract is Active"}
                </p>
              </div>

              <button
                onClick={handleTogglePause}
                disabled={isPausePending}
                className="w-full py-3 rounded-xl text-sm font-medium btn btn-primary"
              >
                {isPausePending ? "Processing..." : isPaused ? "Unpause" : "Pause"}
              </button>
            </div>

            {/* Roles Card */}
            <div className="card p-6" style={{ backgroundColor: "var(--bg-elevated)" }}>
              <h2
                className="text-lg font-semibold mb-4"
                style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
              >
                Your Roles
              </h2>

              <div className="space-y-3">
                <div
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{
                    backgroundColor: isAdmin ? "var(--success-muted)" : "var(--bg-card)",
                    border: `1px solid ${isAdmin ? "rgba(16,185,129,0.3)" : "var(--border-subtle)"}`,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: "var(--bg-elevated)" }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        style={{ color: isAdmin ? "var(--success)" : "var(--text-muted)" }}
                      >
                        <path
                          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <span
                      className="font-medium text-sm"
                      style={{
                        fontFamily: "var(--font-body)",
                        color: isAdmin ? "var(--success)" : "var(--text-muted)",
                      }}
                    >
                      Admin
                    </span>
                  </div>
                  <span
                    className="text-xs"
                    style={{ fontFamily: "var(--font-body)", color: isAdmin ? "var(--success)" : "var(--text-muted)" }}
                  >
                    {isAdmin ? "Active" : "No"}
                  </span>
                </div>

                <div
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{
                    backgroundColor: isOperator ? "var(--accent-muted)" : "var(--bg-card)",
                    border: `1px solid ${isOperator ? "var(--accent-border)" : "var(--border-subtle)"}`,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: "var(--bg-elevated)" }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        style={{ color: isOperator ? "var(--accent)" : "var(--text-muted)" }}
                      >
                        <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="1.5" />
                        <path
                          d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                      </svg>
                    </div>
                    <span
                      className="font-medium text-sm"
                      style={{
                        fontFamily: "var(--font-body)",
                        color: isOperator ? "var(--accent)" : "var(--text-muted)",
                      }}
                    >
                      Operator
                    </span>
                  </div>
                  <span
                    className="text-xs"
                    style={{
                      fontFamily: "var(--font-body)",
                      color: isOperator ? "var(--accent)" : "var(--text-muted)",
                    }}
                  >
                    {isOperator ? "Active" : "No"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
