/**
 * 质押专用加载动画组件
 */

interface StakingLoadingProps {
  size?: "sm" | "md" | "lg";
  message?: string;
}

export function StakingLoading({ size = "md", message = "Staking..." }: StakingLoadingProps) {
  const sizeClasses = {
    sm: { container: "h-12 w-12", core: "h-8 w-8", particles: "w-1 h-1" },
    md: { container: "h-16 w-16", core: "h-10 w-10", particles: "w-1.5 h-1.5" },
    lg: { container: "h-20 w-20", core: "h-12 w-12", particles: "w-2 h-2" },
  };

  const currentSize = sizeClasses[size];

  return (
    <div className="flex flex-col items-center">
      {/* 主容器 */}
      <div className={`relative ${currentSize.container}`}>
        {/* 外圈光晕效果 */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/20 to-cyan-500/20 blur-xl animate-pulse" />

        {/* 中圈旋转轨道 */}
        <div className="absolute inset-1 rounded-full border-2 border-purple-500/30 border-t-purple-500 border-r-cyan-500 animate-spin" />

        {/* 内圈核心 */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${currentSize.core} rounded-full bg-gradient-to-br from-purple-600 to-cyan-600 shadow-lg`}>
          {/* 中心闪电图标 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white text-xs sm:text-sm font-bold animate-pulse">⚡</span>
          </div>
        </div>

        {/* 轨道上的粒子动画 */}
        <div className="absolute inset-0">
          {/* 粒子1 */}
          <div
            className={`absolute ${currentSize.particles} rounded-full bg-cyan-400 animate-ping`}
            style={{
              top: '15%',
              left: '50%',
              transform: 'translateX(-50%)',
              animationDelay: '0ms'
            }}
          />
          {/* 粒子2 */}
          <div
            className={`absolute ${currentSize.particles} rounded-full bg-purple-400 animate-ping`}
            style={{
              bottom: '25%',
              right: '20%',
              animationDelay: '300ms'
            }}
          />
          {/* 粒子3 */}
          <div
            className={`absolute ${currentSize.particles} rounded-full bg-cyan-300 animate-ping`}
            style={{
              top: '30%',
              right: '15%',
              animationDelay: '600ms'
            }}
          />
          {/* 粒子4 */}
          <div
            className={`absolute ${currentSize.particles} rounded-full bg-purple-300 animate-ping`}
            style={{
              bottom: '20%',
              left: '25%',
              animationDelay: '900ms'
            }}
          />
        </div>

        {/* 能量波纹效果 */}
        <div className="absolute inset-0 rounded-full border-2 border-cyan-400/20 animate-ping" />
      </div>

      {/* 加载文字 */}
      {message && (
        <p className="mt-3 text-white text-sm font-medium animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
}