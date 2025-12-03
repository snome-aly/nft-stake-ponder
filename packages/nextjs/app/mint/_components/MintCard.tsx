"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { parseEther } from "viem";
import { useAccount, useWaitForTransactionReceipt } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export function MintCard() {
  const { address, isConnected } = useAccount();
  const [quantity, setQuantity] = useState(1);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const queryClient = useQueryClient();

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
  const { writeContractAsync, isPending } = useScaffoldWriteContract({
    contractName: "StakableNFT",
  });

  // ✅ 等待交易确认（只在有 txHash 时才监听）
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
    query: {
      enabled: !!txHash, // 显式控制：只在有 hash 时才启用
    },
  });

  // ✅ 交易确认后自动刷新余额
  useEffect(() => {
    if (isConfirmed && txHash) {
      queryClient.invalidateQueries({ queryKey: ["balance", { address }] });
      setTxHash(undefined); // 清除 hash，避免重复刷新
    }
  }, [isConfirmed, txHash, queryClient, address]);

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

  // 数量输入处理
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

  // Mint 操作
  const handleMint = async () => {
    if (!isConnected || isPending || isSoldOut || isMaxReached) return;

    try {
      // 发送交易，获取交易 hash
      const hash = await writeContractAsync({
        functionName: "mint",
        args: [BigInt(quantity)],
        value: parseEther(String(totalPrice)),
      });

      // ✅ 保存交易 hash，触发 useWaitForTransactionReceipt 监听
      setTxHash(hash);
      setQuantity(1);

      // 🔥 不再立即刷新余额！等待交易确认后自动刷新
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
            <span>Sending...</span>
          </span>
        ),
        disabled: true,
        className: "bg-purple-600 cursor-wait",
      };
    }
    if (isConfirming) {
      return {
        text: (
          <span className="flex items-center justify-center space-x-2">
            <span className="animate-spin">⏳</span>
            <span>Confirming...</span>
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
            <input
              type="text"
              min="1"
              max={maxCanMint}
              value={quantity}
              onChange={e => handleQuantityChange(e.target.value)}
              className="w-10 text-center bg-transparent text-white text-xl font-bold outline-none border-0 focus:ring-0"
            />
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

      {/* Rarity Distribution */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <h3 className="text-sm font-bold text-white text-center mb-3">💎 Rarity Distribution</h3>

        <div className="grid grid-cols-2 gap-2">
          {[
            {
              name: "Common",
              icon: "⚪",
              count: 50,
              percentage: "50%",
              multiplier: "1.0x",
              textClass: "text-gray-300",
              borderClass: "border-gray-400/50",
              bgClass: "bg-gray-500/10",
            },
            {
              name: "Rare",
              icon: "🔵",
              count: 30,
              percentage: "30%",
              multiplier: "1.5x",
              textClass: "text-blue-400",
              borderClass: "border-blue-500/50",
              bgClass: "bg-blue-500/10",
            },
            {
              name: "Epic",
              icon: "🟣",
              count: 15,
              percentage: "15%",
              multiplier: "2.0x",
              textClass: "text-purple-400",
              borderClass: "border-purple-500/50",
              bgClass: "bg-purple-500/10",
            },
            {
              name: "Legendary",
              icon: "🌟",
              count: 5,
              percentage: "5%",
              multiplier: "3.0x",
              textClass: "text-yellow-400",
              borderClass: "border-yellow-500/50",
              bgClass: "bg-yellow-500/10",
            },
          ].map(rarity => (
            <div
              key={rarity.name}
              className={`glass-dark rounded-lg p-2 border ${rarity.borderClass} ${rarity.bgClass}`}
            >
              {/* Icon & Name */}
              <div className="text-center mb-1.5">
                <span className="text-xl block mb-0.5">{rarity.icon}</span>
                <span className={`font-bold text-xs ${rarity.textClass}`}>{rarity.name}</span>
              </div>

              {/* Stats */}
              <div className="space-y-0.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Count</span>
                  <span className="text-white font-medium">{rarity.count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Chance</span>
                  <span className={rarity.textClass}>{rarity.percentage}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Multiplier</span>
                  <span className={`font-bold ${rarity.textClass}`}>{rarity.multiplier}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Note */}
        <p className="text-center text-gray-500 text-xs mt-2">
          Higher rarity = Higher staking rewards. Rarity is randomly assigned after all 100 NFTs are minted.
        </p>
      </div>
    </div>
  );
}
