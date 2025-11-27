# NFT Assets 目录

本目录用于存放 StakableNFT 项目的所有资产文件，包括图片和 metadata。

## 📁 目录结构

```
assets/
├── README.md                 # 本文件
├── images/                   # NFT 图片资源
│   ├── mystery-box.png      # 盲盒图片（未揭示状态）
│   ├── common.png           # Common 稀有度图片
│   ├── rare.png             # Rare 稀有度图片
│   ├── epic.png             # Epic 稀有度图片
│   └── legendary.png        # Legendary 稀有度图片
├── metadata/                 # Metadata JSON 文件（参考/备份用）
│   ├── unrevealed.json      # 未揭示 metadata 模板
│   ├── common.json          # Common metadata 模板
│   ├── rare.json            # Rare metadata 模板
│   ├── epic.json            # Epic metadata 模板
│   └── legendary.json       # Legendary metadata 模板
└── scripts/                  # 上传脚本
    └── uploadToIPFS.ts      # 上传到 NFT.Storage 的脚本
```

## 🎨 图片要求

### 尺寸规格
- **推荐尺寸**: 1000x1000 像素（1:1 正方形）
- **最小尺寸**: 500x500 像素
- **文件格式**: PNG（推荐）或 JPG
- **文件大小**: 每张图片 < 5MB

### 设计建议
1. **mystery-box.png**: 设计神秘感的盲盒图片，不要透露稀有度信息
2. **common.png**: 基础款设计，50个（50%）
3. **rare.png**: 增加一些特殊效果，30个（30%）
4. **epic.png**: 更炫酷的设计，15个（15%）
5. **legendary.png**: 最豪华的设计，5个（5%）

### 视觉差异化
确保不同稀有度的图片有明显的视觉区分：
- 颜色方案不同
- 特效强度不同
- 背景复杂度不同

## 📝 Metadata 说明

### 注意事项
本项目使用**链上动态生成 metadata**，`metadata/` 目录下的 JSON 文件仅作为：
- 📋 **参考模板** - 了解 metadata 结构
- 💾 **备份** - 万一需要切换到 IPFS 静态 metadata
- 🧪 **测试** - 本地测试时使用

实际部署时，metadata 会由智能合约的 `tokenURI()` 函数动态生成。

## 🚀 使用流程

### 1. 准备图片
将设计好的 5 张图片放入 `images/` 目录：
```bash
images/
├── mystery-box.png      # 已准备 ✓
├── common.png           # 已准备 ✓
├── rare.png             # 已准备 ✓
├── epic.png             # 已准备 ✓
└── legendary.png        # 已准备 ✓
```

### 2. 上传到 IPFS
```bash
# 安装依赖
yarn add nft.storage

# 运行上传脚本
yarn hardhat run scripts/uploadToIPFS.ts --network localhost

# 脚本会输出每张图片的 IPFS CID
```

### 3. 更新合约
将获得的 IPFS CID 更新到合约的构造函数中：
```solidity
constructor() {
    rarityImages[Rarity.Common] = "ipfs://QmXxx.../common.png";
    rarityImages[Rarity.Rare] = "ipfs://QmYyy.../rare.png";
    // ...
}
```

### 4. 部署合约
```bash
yarn deploy
```

## 📊 稀有度分配

| 稀有度 | 数量 | 百分比 | 质押倍率 | 图片文件 |
|--------|------|--------|----------|----------|
| Common | 50 | 50% | 1x | common.png |
| Rare | 30 | 30% | 2x | rare.png |
| Epic | 15 | 15% | 3x | epic.png |
| Legendary | 5 | 5% | 5x | legendary.png |
| Mystery Box | - | - | - | mystery-box.png |

## 🔗 相关资源

- [OpenSea Metadata 标准](https://docs.opensea.io/docs/metadata-standards)
- [NFT.Storage 文档](https://nft.storage/docs/)
- [ERC721 标准](https://eips.ethereum.org/EIPS/eip-721)

## 💡 临时占位图片

如果暂时没有设计好的图片，可以使用：
- [placeholder.com](https://placeholder.com/) - 在线生成占位图
- [Lorem Picsum](https://picsum.photos/) - 随机图片
- AI 生成工具（Midjourney、DALL-E）

示例：
```bash
# 下载占位图片
curl -o images/mystery-box.png "https://via.placeholder.com/1000/FF6B6B/FFFFFF?text=Mystery+Box"
curl -o images/common.png "https://via.placeholder.com/1000/95E1D3/FFFFFF?text=Common"
curl -o images/rare.png "https://via.placeholder.com/1000/38B6FF/FFFFFF?text=Rare"
curl -o images/epic.png "https://via.placeholder.com/1000/C44569/FFFFFF?text=Epic"
curl -o images/legendary.png "https://via.placeholder.com/1000/F8B500/FFFFFF?text=Legendary"
```

---

**创建日期**: 2025-11-02
**最后更新**: 2025-11-02
