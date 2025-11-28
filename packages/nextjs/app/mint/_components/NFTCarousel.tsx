"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const rarityData = [
  {
    name: "Common",
    image: "https://gateway.pinata.cloud/ipfs/QmY7A1WYkzBxgvYXwDwbY35bntWEeYi6kmph52UcpQTHFp",
    percentage: "50%",
    multiplier: "1.0x",
    count: 50,
    color: "gray",
    borderClass: "border-gray-400/50",
    textClass: "text-gray-300",
    bgClass: "bg-gray-500/20",
  },
  {
    name: "Rare",
    image: "https://gateway.pinata.cloud/ipfs/QmYbvQvfFrKbxLwr3ZX4pigAZJbTB7zCpykGmuoWoZTf9p",
    percentage: "30%",
    multiplier: "1.5x",
    count: 30,
    color: "blue",
    borderClass: "border-blue-500/50",
    textClass: "text-blue-400",
    bgClass: "bg-blue-500/20",
  },
  {
    name: "Epic",
    image: "https://gateway.pinata.cloud/ipfs/Qmdg4TcyiPpuxUJpDTsnJSGfEsjLzASekNrtCyWQZqWDW6",
    percentage: "15%",
    multiplier: "2.0x",
    count: 15,
    color: "purple",
    borderClass: "border-purple-500/50",
    textClass: "text-purple-400",
    bgClass: "bg-purple-500/20",
  },
  {
    name: "Legendary",
    image: "https://gateway.pinata.cloud/ipfs/QmZHdmbPR711ujJWi1UL6te2H5QsicuvPPuUcbJNnesjtf",
    percentage: "5%",
    multiplier: "3.0x",
    count: 5,
    color: "yellow",
    borderClass: "border-yellow-500/50",
    textClass: "text-yellow-400",
    bgClass: "bg-yellow-500/20",
  },
];

export function NFTCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // 自动轮播
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % rarityData.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const currentRarity = rarityData[currentIndex];

  return (
    <div
      className="glass-card rounded-2xl p-3 border-2 border-cyan-500/50 hover:border-cyan-400 transition-all duration-300 animate-slide-in-up"
      style={{ animationDelay: "0.1s" }}
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Header */}
      <div className="text-center mb-2">
        <h2 className="text-lg font-bold text-white">Possible Rarities</h2>
        <p className="text-gray-400 text-xs">Preview what you might get!</p>
      </div>

      {/* Main Image */}
      <div
        className={`relative aspect-square rounded-xl overflow-hidden mb-2 border-4 ${currentRarity.borderClass} transition-all duration-500`}
      >
        <div className={`absolute inset-0 ${currentRarity.bgClass} animate-pulse`}></div>
        <Image
          src={currentRarity.image}
          alt={`${currentRarity.name} NFT`}
          fill
          className="object-cover transition-all duration-500"
          sizes="(max-width: 768px) 100vw, 50vw"
        />

        {/* Rarity Badge */}
        <div
          className={`absolute top-2 right-2 px-2 py-0.5 rounded-full ${currentRarity.bgClass} border ${currentRarity.borderClass}`}
        >
          <span className={`font-bold text-xs ${currentRarity.textClass}`}>{currentRarity.name}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-1.5 mb-2">
        <div className="text-center p-1 glass-dark rounded-lg">
          <p className="text-gray-400 text-xs">Chance</p>
          <p className={`font-bold text-sm ${currentRarity.textClass}`}>{currentRarity.percentage}</p>
        </div>
        <div className="text-center p-1 glass-dark rounded-lg">
          <p className="text-gray-400 text-xs">Count</p>
          <p className={`font-bold text-sm ${currentRarity.textClass}`}>{currentRarity.count}</p>
        </div>
        <div className="text-center p-1 glass-dark rounded-lg">
          <p className="text-gray-400 text-xs">Multiplier</p>
          <p className={`font-bold text-sm ${currentRarity.textClass}`}>{currentRarity.multiplier}</p>
        </div>
      </div>

      {/* Indicators */}
      <div className="flex justify-center space-x-1.5">
        {rarityData.map((rarity, index) => (
          <button
            key={rarity.name}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? `${rarity.bgClass} scale-125 border ${rarity.borderClass}`
                : "bg-gray-600 hover:bg-gray-500"
            }`}
            title={rarity.name}
          />
        ))}
      </div>

      {/* Hint */}
      <p className="text-center text-gray-500 text-xs mt-1.5">Click dots to preview • Hover to pause</p>
    </div>
  );
}
