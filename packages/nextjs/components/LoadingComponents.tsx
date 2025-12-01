/**
 * 加载指示器组件
 */

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({ size = "md" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-2",
    lg: "h-16 w-16 border-4",
  };

  return (
    <div className={`relative ${sizeClasses[size]}`}>
      <div className="absolute inset-0 rounded-full border-cyan-500/30 border-t-cyan-500 animate-spin" />
    </div>
  );
}

/**
 * 骨架NFT卡片加载
 */
export function SkeletonNFTCard() {
  return (
    <div className="glass-card rounded-2xl overflow-hidden animate-pulse border border-cyan-500/30">
      {/* Image Placeholder */}
      <div className="aspect-square bg-gray-800" />

      {/* Info Placeholder */}
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-700 rounded w-2/3" />
        <div className="h-4 bg-gray-700 rounded w-1/2" />
        <div className="h-10 bg-gray-700 rounded" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonNFTCard key={index} />
      ))}
    </div>
  );
}

/**
 * 完整页面加载（用于初次加载时）
 */
export function FullPageLoading({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      {/* 主加载动画 */}
      <div className="relative mb-6">
        {/* 外圈光晕效果 */}
        <div className="absolute inset-0 h-16 w-16 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 opacity-20 blur-xl animate-pulse" />
        {/* 中圈旋转动画 */}
        <div className="relative h-16 w-16 rounded-full border-2 border-cyan-500/30 border-t-cyan-500 border-r-purple-500 animate-spin" />
        {/* 内圈小圆点 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-3 w-3 rounded-full bg-gradient-to-r from-cyan-400 to-purple-400 animate-ping" />
        </div>
      </div>

      {/* 加载文字 */}
      <div className="text-center">
        <p className="text-cyan-400 font-semibold text-lg animate-pulse">{message}</p>
        <p className="text-gray-500 text-sm mt-1">Please wait a moment</p>
      </div>

      {/* 装饰性元素 */}
      <div className="flex space-x-2 mt-6">
        <div className="h-2 w-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: "0ms" }} />
        <div className="h-2 w-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "150ms" }} />
        <div className="h-2 w-2 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}

