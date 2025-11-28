"use client";

import { useState } from "react";
import { parseEther } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export function MintCard() {
  const { address, isConnected } = useAccount();
  const [quantity, setQuantity] = useState(1);

  // 读取合约状态
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

  // 写入合约
  const { writeContractAsync, isPending } = useScaffoldWriteContract("StakableNFT");

  // 常量
  const maxSupply = 100;
  const maxPerAddress = 20;
  const mintPrice = 1; // ETH

  // 计算状态
  const currentMinted = totalMinted !== undefined ? Number(totalMinted) : 0;
  const userCurrentMinted = userMinted !== undefined ? Number(userMinted) : 0;
  const remaining = maxSupply - currentMinted;
  const userRemaining = maxPerAddress - userCurrentMinted;
  const maxCanMint = Math.min(remaining, userRemaining);
  const isSoldOut = remaining <= 0;
  const isMaxReached = userRemaining <= 0;
  const totalPrice = quantity * mintPrice;

  // 数量调整
  const handleDecrease = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const handleIncrease = () => {
    if (quantity < maxCanMint) setQuantity(quantity + 1);
  };

  // Mint 操作
  const handleMint = async () => {
    if (!isConnected || isPending || isSoldOut || isMaxReached) return;

    try {
      await writeContractAsync({
        functionName: "mint",
        args: [BigInt(quantity)],
        value: parseEther(String(totalPrice)),
      });
      setQuantity(1);
    } catch (error) {
      console.error("Mint failed:", error);
    }
  };

  // 按钮状态
  const getButtonContent = () => {
    if (!isConnected) {
      return { text: "Connect Wallet", disabled: true, className: "bg-gray-600 cursor-not-allowed" };
    }
    if (isPending) {
      return {
        text: (
          <span className="flex items-center justify-center space-x-2">
            <span className="animate-spin">⏳</span>
            <span>Minting...</span>
          </span>
        ),
        disabled: true,
        className: "bg-purple-600 cursor-wait",
      };
    }
    if (isSoldOut) {
      return { text: "Sold Out", disabled: true, className: "bg-gray-600 cursor-not-allowed" };
    }
    if (isMaxReached) {
      return { text: "Max Reached (20/20)", disabled: true, className: "bg-yellow-600 cursor-not-allowed" };
    }
    return {
      text: `🚀 Mint ${quantity} NFT${quantity > 1 ? "s" : ""}`,
      disabled: false,
      className:
        "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transform hover:scale-105",
    };
  };

  const buttonState = getButtonContent();

  return (
    <div className="glass-card rounded-2xl p-4 border-2 border-purple-500/50 hover:border-purple-400 transition-all duration-300 animate-slide-in-up">
      {/* Header */}
      <div className="text-center mb-3">
        <span className="text-2xl mb-0.5 block">🎁</span>
        <h2 className="text-lg font-bold text-white">Mint Blind Box NFT</h2>
      </div>

      {/* Stats */}
      <div className="space-y-1.5 mb-3">
        <div className="flex justify-between items-center p-2 glass-dark rounded-lg">
          <span className="text-gray-400 text-sm">Price</span>
          <span className="text-white font-bold">{mintPrice} ETH</span>
        </div>

        <div className="flex justify-between items-center p-2 glass-dark rounded-lg">
          <span className="text-gray-400 text-sm">Remaining</span>
          <span className={`font-bold ${remaining <= 10 ? "text-red-400" : "text-green-400"}`}>
            {remaining} / {maxSupply}
          </span>
        </div>

        <div className="flex justify-between items-center p-2 glass-dark rounded-lg">
          <span className="text-gray-400 text-sm">Your Minted</span>
          <span className={`font-bold ${userCurrentMinted >= maxPerAddress ? "text-yellow-400" : "text-cyan-400"}`}>
            {userCurrentMinted} / {maxPerAddress}
          </span>
        </div>
      </div>

      {/* Quantity Selector */}
      {!isSoldOut && !isMaxReached && isConnected && (
        <div className="mb-3">
          <label className="block text-gray-400 text-xs mb-1">Quantity</label>
          <div className="flex items-center justify-center space-x-3">
            <button
              onClick={handleDecrease}
              disabled={quantity <= 1}
              className="w-9 h-9 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              -
            </button>
            <span className="text-xl font-bold text-white w-10 text-center">{quantity}</span>
            <button
              onClick={handleIncrease}
              disabled={quantity >= maxCanMint}
              className="w-9 h-9 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Total Price */}
      {!isSoldOut && !isMaxReached && isConnected && (
        <div className="flex justify-between items-center p-2.5 glass-dark rounded-lg mb-3 border border-purple-500/30">
          <span className="text-gray-300 font-medium text-sm">Total</span>
          <span className="text-lg font-bold text-gradient-purple">{totalPrice} ETH</span>
        </div>
      )}

      {/* Mint Button */}
      <button
        onClick={handleMint}
        disabled={buttonState.disabled}
        className={`w-full py-2.5 rounded-xl text-white font-bold transition-all duration-300 shadow-lg ${buttonState.className}`}
      >
        {buttonState.text}
      </button>

      {/* Info */}
      <div className="mt-2 text-center">
        <p className="text-gray-500 text-xs">⚠️ Max 20 NFTs per wallet • Rarity revealed after sellout</p>
      </div>

      {/* Revealed Notice */}
      {isRevealed && (
        <div className="mt-2 p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
          <p className="text-green-400 text-xs text-center">
            ✅ NFTs have been revealed! Check your rarity in the NFT details.
          </p>
        </div>
      )}
    </div>
  );
}
