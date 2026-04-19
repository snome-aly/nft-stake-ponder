"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

const rarityData = [
  {
    name: "Common",
    image: "https://gateway.pinata.cloud/ipfs/QmY7A1WYkzBxgvYXwDwbY35bntWEeYi6kmph52UcpQTHFp",
    percentage: "50%",
    multiplier: "1.0×",
    count: 50,
    color: "common",
  },
  {
    name: "Rare",
    image: "https://gateway.pinata.cloud/ipfs/QmYbvQvfFrKbxLwr3ZX4pigAZJbTB7zCpykGmuoWoZTf9p",
    percentage: "30%",
    multiplier: "1.5×",
    count: 30,
    color: "rare",
  },
  {
    name: "Epic",
    image: "https://gateway.pinata.cloud/ipfs/Qmdg4TcyiPpuxUJpDTsnJSGfEsjLzASekNrtCyWQZqWDW6",
    percentage: "15%",
    multiplier: "2.0×",
    count: 15,
    color: "epic",
  },
  {
    name: "Legendary",
    image: "https://gateway.pinata.cloud/ipfs/QmZHdmbPR711ujJWi1UL6te2H5QsicuvPPuUcbJNnesjtf",
    percentage: "5%",
    multiplier: "3.0×",
    count: 5,
    color: "legendary",
  },
];

const getRarityColors = (color: string) => {
  switch (color) {
    case "rare":
      return { text: "var(--rarity-rare)", bg: "var(--rarity-rare-bg)", border: "rgba(96,165,250,0.3)" };
    case "epic":
      return { text: "var(--rarity-epic)", bg: "var(--rarity-epic-bg)", border: "rgba(167,139,250,0.3)" };
    case "legendary":
      return { text: "var(--rarity-legendary)", bg: "var(--rarity-legendary-bg)", border: "rgba(251,191,36,0.3)" };
    default:
      return { text: "var(--rarity-common)", bg: "var(--rarity-common-bg)", border: "rgba(113,113,122,0.3)" };
  }
};

export function NFTCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % rarityData.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const currentRarity = rarityData[currentIndex];
  const colors = getRarityColors(currentRarity.color);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="card h-full p-5"
      style={{ backgroundColor: "var(--bg-elevated)" }}
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Header */}
      <div className="text-center mb-4">
        <h2
          className="text-base font-semibold mb-1"
          style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
        >
          Possible Rarities
        </h2>
        <p className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
          Preview what you might get
        </p>
      </div>

      {/* Main Image */}
      <div
        className="relative aspect-square rounded-xl overflow-hidden mb-4"
        style={{ border: `2px solid ${colors.border}` }}
      >
        <Image
          src={currentRarity.image}
          alt={`${currentRarity.name} NFT`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority={true}
        />

        {/* Rarity Badge */}
        <div
          className="absolute top-3 right-3 px-2.5 py-1 rounded-full"
          style={{
            backgroundColor: colors.bg,
            border: `1px solid ${colors.border}`,
          }}
        >
          <span className="text-xs font-semibold" style={{ fontFamily: "var(--font-body)", color: colors.text }}>
            {currentRarity.name}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: "Chance", value: currentRarity.percentage },
          { label: "Count", value: currentRarity.count },
          { label: "Multiplier", value: currentRarity.multiplier },
        ].map(stat => (
          <div key={stat.label} className="text-center p-2 rounded-lg" style={{ backgroundColor: "var(--bg-card)" }}>
            <p className="text-xs mb-0.5" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
              {stat.label}
            </p>
            <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-body)", color: colors.text }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Indicators */}
      <div className="flex justify-center gap-2">
        {rarityData.map((rarity, index) => {
          const dotColors = getRarityColors(rarity.color);
          return (
            <button
              key={rarity.name}
              onClick={() => setCurrentIndex(index)}
              className="w-2.5 h-2.5 rounded-full transition-all duration-300"
              style={{
                backgroundColor: index === currentIndex ? dotColors.text : "var(--text-muted)",
                opacity: index === currentIndex ? 1 : 0.4,
              }}
              title={rarity.name}
            />
          );
        })}
      </div>

      <p className="text-center text-xs mt-3" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
        Click to preview · Hover to pause
      </p>
    </motion.div>
  );
}
