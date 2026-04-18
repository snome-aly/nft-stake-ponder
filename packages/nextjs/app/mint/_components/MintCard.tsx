"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { formatEther, parseEther } from "viem";
import { useAccount, useWaitForTransactionReceipt } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export function MintCard() {
  const { address, isConnected } = useAccount();
  const [quantity, setQuantity] = useState(1);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [isMintSuccess, setIsMintSuccess] = useState(false);
  const queryClient = useQueryClient();

  const { data: totalMinted } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "totalMinted",
  });

  const { data: userMinted } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "mintedCount",
    args: [address],
  });

  const { data: isRevealed } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "isRevealed",
  });

  const { writeContractAsync, isPending } = useScaffoldWriteContract({
    contractName: "StakableNFT",
  });

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!txHash },
  });

  useEffect(() => {
    if (isConfirmed && txHash) {
      queryClient.invalidateQueries({ queryKey: ["balance", { address }] });
      setTxHash(undefined);
      setIsMintSuccess(true);
      setTimeout(() => setIsMintSuccess(false), 3000);
    }
  }, [isConfirmed, txHash, queryClient, address]);

  const maxSupply = 100;
  const maxPerAddress = 20;
  const mintPriceEth = "0.001";
  const mintPriceWei = parseEther(mintPriceEth);

  const currentMinted = totalMinted !== undefined ? Number(totalMinted) : 0;
  const userCurrentMinted = userMinted !== undefined ? Number(userMinted) : 0;
  const remaining = maxSupply - currentMinted;
  const userRemaining = maxPerAddress - userCurrentMinted;
  const maxCanMint = Math.min(remaining, userRemaining);
  const isSoldOut = remaining <= 0;
  const isMaxReached = userRemaining <= 0;
  const totalPriceWei = mintPriceWei * BigInt(quantity);
  const totalPriceEth = formatEther(totalPriceWei);

  const handleDecrease = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const handleIncrease = () => {
    if (quantity < maxCanMint) setQuantity(quantity + 1);
  };

  const handleQuantityChange = (value: string) => {
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 1) {
      setQuantity(1);
    } else if (numValue > maxCanMint) {
      setQuantity(maxCanMint);
    } else {
      setQuantity(numValue);
    }
  };

  const handleMint = async () => {
    if (!isConnected || isPending || isSoldOut || isMaxReached) return;

    try {
      const hash = await writeContractAsync({
        functionName: "mint",
        args: [BigInt(quantity)],
        value: totalPriceWei,
      });
      setTxHash(hash);
      setQuantity(1);
    } catch (error) {
      console.error("Mint failed:", error);
    }
  };

  const getButtonContent = () => {
    if (!isConnected) return { text: "Connect Wallet", disabled: true };
    if (isPending) return { text: "Sending...", disabled: true };
    if (isConfirming) return { text: "Confirming...", disabled: true };
    if (isSoldOut) return { text: "Sold Out", disabled: true };
    if (isMaxReached) return { text: "Max Reached", disabled: true };
    return { text: `Mint ${quantity} NFT${quantity > 1 ? "s" : ""}`, disabled: false };
  };

  const buttonState = getButtonContent();

  const rarityItems = [
    { name: "Common", count: 50, percentage: "50%", multiplier: "1.0×", color: "common" },
    { name: "Rare", count: 30, percentage: "30%", multiplier: "1.5×", color: "rare" },
    { name: "Epic", count: 15, percentage: "15%", multiplier: "2.0×", color: "epic" },
    { name: "Legendary", count: 5, percentage: "5%", multiplier: "3.0×", color: "legendary" },
  ];

  const getRarityColors = (color: string) => {
    switch (color) {
      case "rare":
        return { text: "var(--rarity-rare)", bg: "var(--rarity-rare-bg)", border: "rgba(96,165,250,0.2)" };
      case "epic":
        return { text: "var(--rarity-epic)", bg: "var(--rarity-epic-bg)", border: "rgba(167,139,250,0.2)" };
      case "legendary":
        return { text: "var(--rarity-legendary)", bg: "var(--rarity-legendary-bg)", border: "rgba(251,191,36,0.2)" };
      default:
        return { text: "var(--rarity-common)", bg: "var(--rarity-common-bg)", border: "rgba(113,113,122,0.2)" };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-md mx-auto"
    >
      <AnimatePresence>
        {isMintSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-50 rounded-2xl"
            style={{ backgroundColor: "var(--bg-elevated)" }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--accent-muted)" }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-[var(--accent)]">
                <path
                  d="M5 12l5 5L20 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="card p-6" style={{ backgroundColor: "var(--bg-elevated)" }}>
        {/* Header */}
        <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-6">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
            style={{ backgroundColor: "var(--accent-muted)", border: "1px solid var(--accent-border)" }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-[var(--accent)]">
              <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <h2
            className="text-lg font-semibold"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
          >
            Mint Blind Box NFT
          </h2>
        </motion.div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-xs mb-2">
            <span style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>Minted</span>
            <span className="font-medium" style={{ fontFamily: "var(--font-body)", color: "var(--accent)" }}>
              {currentMinted}/{maxSupply}
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-card)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: "var(--accent)" }}
              initial={{ width: 0 }}
              animate={{ width: `${(currentMinted / maxSupply) * 100}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-2 mb-6">
          {[
            { label: "Price", value: `${mintPriceEth} ETH`, highlight: false },
            { label: "Remaining", value: remaining.toString(), highlight: remaining <= 10 },
            {
              label: "Your Minted",
              value: `${userCurrentMinted}/${maxPerAddress}`,
              highlight: userCurrentMinted >= maxPerAddress,
            },
          ].map(stat => (
            <div
              key={stat.label}
              className="flex justify-between items-center p-3 rounded-lg"
              style={{ backgroundColor: "var(--bg-card)" }}
            >
              <span style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>{stat.label}</span>
              <span
                className="font-medium text-sm"
                style={{
                  fontFamily: "var(--font-body)",
                  color: stat.highlight ? "var(--warning)" : "var(--text-primary)",
                }}
              >
                {stat.value}
              </span>
            </div>
          ))}
        </div>

        {/* Quantity Selector */}
        {!isSoldOut && !isMaxReached && isConnected && (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <label
              className="block text-center text-xs mb-3"
              style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}
            >
              Quantity
            </label>
            <div className="flex items-center justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDecrease}
                disabled={quantity <= 1}
                className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-medium transition-all duration-150"
                style={{
                  backgroundColor: quantity <= 1 ? "var(--bg-card)" : "var(--accent-muted)",
                  color: quantity <= 1 ? "var(--text-muted)" : "var(--accent)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                −
              </motion.button>
              <input
                type="text"
                value={quantity}
                onChange={e => handleQuantityChange(e.target.value)}
                className="w-14 text-center text-xl font-medium rounded-lg outline-none"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--text-primary)",
                  backgroundColor: "transparent",
                  border: "1px solid var(--border-subtle)",
                }}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleIncrease}
                disabled={quantity >= maxCanMint}
                className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-medium transition-all duration-150"
                style={{
                  backgroundColor: quantity >= maxCanMint ? "var(--bg-card)" : "var(--accent-muted)",
                  color: quantity >= maxCanMint ? "var(--text-muted)" : "var(--accent)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                +
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Total Price */}
        {!isSoldOut && !isMaxReached && isConnected && (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="flex justify-between items-center p-4 rounded-xl mb-6"
            style={{
              backgroundColor: "var(--accent-muted)",
              border: "1px solid var(--accent-border)",
            }}
          >
            <span style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>Total</span>
            <span
              className="text-xl font-semibold"
              style={{ fontFamily: "var(--font-display)", color: "var(--accent)" }}
            >
              {totalPriceEth} ETH
            </span>
          </motion.div>
        )}

        {/* Mint Button */}
        <motion.button
          onClick={handleMint}
          disabled={buttonState.disabled}
          whileHover={!buttonState.disabled ? { y: -2 } : {}}
          whileTap={!buttonState.disabled ? { scale: 0.98 } : {}}
          className={`w-full py-3.5 rounded-xl text-sm font-medium transition-all duration-200 ${
            buttonState.disabled ? "" : "btn btn-primary"
          }`}
          style={buttonState.disabled ? { backgroundColor: "var(--bg-card)", color: "var(--text-muted)" } : {}}
        >
          {buttonState.text}
        </motion.button>

        {/* Info */}
        <p className="text-center text-xs mt-4" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
          Max 20 NFTs per wallet · Rarity revealed after sellout
        </p>

        {/* Revealed Notice */}
        <AnimatePresence>
          {isRevealed && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-6 p-4 rounded-xl"
              style={{
                backgroundColor: "var(--success-muted)",
                border: "1px solid rgba(16, 185, 129, 0.2)",
              }}
            >
              <p className="text-sm text-center" style={{ fontFamily: "var(--font-body)", color: "var(--success)" }}>
                NFTs have been revealed! Check your rarity in the NFT details.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rarity Distribution */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 pt-5"
          style={{ borderTop: "1px solid var(--border-subtle)" }}
        >
          <h3
            className="text-center mb-4 text-sm font-medium"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
          >
            Rarity Distribution
          </h3>

          <div className="grid grid-cols-2 gap-2">
            {rarityItems.map(rarity => {
              const colors = getRarityColors(rarity.color);
              return (
                <motion.div
                  key={rarity.name}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3 rounded-lg text-center"
                  style={{
                    backgroundColor: colors.bg,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <div
                    className="text-sm font-medium mb-1"
                    style={{ fontFamily: "var(--font-body)", color: colors.text }}
                  >
                    {rarity.name}
                  </div>
                  <div className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}>
                    {rarity.count} · {rarity.percentage} · {rarity.multiplier}
                  </div>
                </motion.div>
              );
            })}
          </div>

          <p
            className="text-center text-xs mt-4"
            style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}
          >
            Higher rarity = Higher staking rewards
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
