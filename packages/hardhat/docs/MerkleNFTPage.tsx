/**
 * MerkleNFT 页面组件示例
 *
 * 这个组件展示了如何使用 useMerkleNFT Hook
 *
 * 功能：
 * 1. 铸造 NFT
 * 2. 查看用户的 NFT
 * 3. 领取单个/批量稀有度
 * 4. 显示稀有度和倍率
 *
 * 使用方式：
 * 将此文件放到 packages/nextjs/app/merkle-nft/page.tsx
 */

"use client";

import { useState } from "react";
import { useMerkleNFT } from "~~/hooks/useMerkleNFT";

export default function MerkleNFTPage() {
  const { userNFTs, loading, claiming, mint, claimRarity, claimRarityBatch } = useMerkleNFT();

  const [mintQuantity, setMintQuantity] = useState(1);

  // 获取未领取的 NFT
  const unclaimedNFTs = userNFTs.filter(nft => !nft.hasClaimed);
  const claimedNFTs = userNFTs.filter(nft => nft.hasClaimed);

  // 稀有度颜色
  const getRarityColor = (rarityName: string) => {
    switch (rarityName) {
      case "Legendary":
        return "text-orange-500";
      case "Epic":
        return "text-purple-500";
      case "Rare":
        return "text-blue-500";
      default:
        return "text-gray-500";
    }
  };

  // 稀有度图标
  const getRarityIcon = (rarityName: string) => {
    switch (rarityName) {
      case "Legendary":
        return "👑";
      case "Epic":
        return "💎";
      case "Rare":
        return "⭐";
      default:
        return "⚪";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 标题 */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">🎁 Merkle 盲盒 NFT</h1>
        <p className="text-gray-600">铸造 NFT 后，领取稀有度开盲盒！不同稀有度有不同的奖励倍率</p>
      </div>

      {/* 铸造区域 */}
      <div className="card bg-base-100 shadow-xl mb-8">
        <div className="card-body">
          <h2 className="card-title">🎨 铸造 NFT</h2>

          <div className="flex gap-4 items-end">
            <div className="form-control w-full max-w-xs">
              <label className="label">
                <span className="label-text">数量</span>
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={mintQuantity}
                onChange={e => setMintQuantity(Number(e.target.value))}
                className="input input-bordered w-full max-w-xs"
              />
            </div>

            <button className="btn btn-primary" onClick={() => mint(mintQuantity)} disabled={loading || claiming}>
              {loading ? (
                <span className="loading loading-spinner"></span>
              ) : (
                `铸造 ${mintQuantity} 个 (${0.01 * mintQuantity} ETH)`
              )}
            </button>
          </div>

          <div className="text-sm text-gray-600 mt-2">💡 铸造价格: 0.01 ETH/个</div>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="stats shadow mb-8 w-full">
        <div className="stat">
          <div className="stat-title">总计</div>
          <div className="stat-value">{userNFTs.length}</div>
          <div className="stat-desc">拥有的 NFT 数量</div>
        </div>

        <div className="stat">
          <div className="stat-title">未开盒</div>
          <div className="stat-value text-warning">{unclaimedNFTs.length}</div>
          <div className="stat-desc">等待领取稀有度</div>
        </div>

        <div className="stat">
          <div className="stat-title">已开盒</div>
          <div className="stat-value text-success">{claimedNFTs.length}</div>
          <div className="stat-desc">已领取稀有度</div>
        </div>
      </div>

      {/* 未领取的 NFT */}
      {unclaimedNFTs.length > 0 && (
        <div className="card bg-base-100 shadow-xl mb-8">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <h2 className="card-title">📦 未开盒的 NFT ({unclaimedNFTs.length})</h2>

              <button
                className="btn btn-secondary btn-sm"
                onClick={() => claimRarityBatch(unclaimedNFTs.map(nft => nft.tokenId))}
                disabled={claiming}
              >
                {claiming ? <span className="loading loading-spinner"></span> : "批量开盒"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unclaimedNFTs.map(nft => (
                <div key={nft.tokenId} className="card bg-base-200">
                  <div className="card-body">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold">NFT #{nft.tokenId}</h3>
                        <p className="text-sm text-gray-600">未开盒</p>
                      </div>
                      <div className="text-4xl">📦</div>
                    </div>

                    <button
                      className="btn btn-primary btn-sm mt-2"
                      onClick={() => claimRarity(nft.tokenId)}
                      disabled={claiming}
                    >
                      {claiming ? "开盒中..." : "🎁 开盒"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 已领取的 NFT */}
      {claimedNFTs.length > 0 && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title mb-4">✨ 已开盒的 NFT ({claimedNFTs.length})</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {claimedNFTs.map(nft => (
                <div key={nft.tokenId} className="card bg-base-200">
                  <div className="card-body">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold">NFT #{nft.tokenId}</h3>
                        <p className={`text-sm font-semibold ${getRarityColor(nft.rarityName)}`}>
                          {getRarityIcon(nft.rarityName)} {nft.rarityName}
                        </p>
                      </div>
                      <div className="text-4xl">{getRarityIcon(nft.rarityName)}</div>
                    </div>

                    <div className="divider my-2"></div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">奖励倍率:</span>
                      <span className="font-bold">{(nft.multiplier || 100) / 100}x</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">稀有度:</span>
                      <span className="font-bold">{nft.rarity}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 空状态 */}
      {userNFTs.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎁</div>
          <h3 className="text-2xl font-bold mb-2">还没有 NFT</h3>
          <p className="text-gray-600 mb-4">铸造你的第一个盲盒 NFT 吧！</p>
        </div>
      )}

      {/* 加载状态 */}
      {loading && (
        <div className="text-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-4">加载中...</p>
        </div>
      )}

      {/* 说明 */}
      <div className="card bg-base-100 shadow-xl mt-8">
        <div className="card-body">
          <h2 className="card-title">📚 使用说明</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-bold mb-2">1️⃣ 铸造 NFT</h3>
              <p className="text-sm text-gray-600">输入数量并支付 0.01 ETH/个，即可铸造盲盒 NFT</p>
            </div>

            <div>
              <h3 className="font-bold mb-2">2️⃣ 开盲盒</h3>
              <p className="text-sm text-gray-600">
                点击"开盒"按钮，从 Merkle Tree 中领取你的稀有度。支持单个开盒或批量开盒。
              </p>
            </div>

            <div>
              <h3 className="font-bold mb-2">3️⃣ 稀有度和倍率</h3>
              <ul className="text-sm text-gray-600 list-disc list-inside">
                <li>⚪ Common (64%): 1.0x 倍率</li>
                <li>⭐ Rare (25%): 1.5x 倍率</li>
                <li>💎 Epic (10%): 2.0x 倍率</li>
                <li>👑 Legendary (1%): 3.0x 倍率</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-2">🔐 Merkle Tree 技术</h3>
              <p className="text-sm text-gray-600">
                本项目使用 Merkle Tree 技术实现盲盒。稀有度在链下随机生成并洗牌， 合约只存储32字节的 Merkle
                Root。开盒时需要提供 Merkle Proof 来验证稀有度的真实性。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
