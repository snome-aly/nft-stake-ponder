import Link from "next/link";

/**
 * Logo 组件
 *
 * 显示项目的品牌标识，包括：
 * - 渐变色图标（礼物盒）
 * - 在线状态指示器（绿色脉冲点）
 * - 品牌名称（桌面端：完整版 "BlindBox NFT"，移动端：简化版 "BB NFT"）
 * - 标语 "Mint. Stake. Earn."（仅桌面端显示）
 *
 * 交互效果：
 * - 悬停时图标轻微旋转
 * - 品牌名称颜色从白色变为紫色
 */
export const Logo = () => {
  return (
    <Link href="/" className="flex items-center space-x-3 group">
      <div className="relative flex-shrink-0">
        {/* Logo 图标 */}
        <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center transform group-hover:rotate-6 transition-transform duration-200 shadow-lg">
          <span className="text-white text-2xl">🎁</span>
        </div>
        {/* 在线状态指示器 */}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
      </div>

      {/* 品牌名称 - 桌面端 */}
      <div className="hidden sm:flex flex-col justify-center">
        <h1 className="mt-4 text-xl font-bold text-white group-hover:text-purple-400 transition-colors leading-none">
          BlindBox NFT
        </h1>
        <p className="text-xs text-gray-400 leading-none -mt-1">Mint. Stake. Earn.</p>
      </div>

      {/* 移动端简化品牌名 */}
      <div className="sm:hidden flex items-center">
        <h1 className=" mt-3 text-lg font-bold text-white group-hover:text-purple-400 transition-colors">BB NFT</h1>
      </div>
    </Link>
  );
};
