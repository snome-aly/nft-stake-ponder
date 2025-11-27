import Link from "next/link";

/**
 * 桌面端导航链接组件
 *
 * 用于桌面端的水平导航菜单。
 *
 * 特性：
 * - active 状态：紫色背景 + 底部边框
 * - 悬停效果：背景变暗，文字变白
 * - 平滑过渡动画
 */
export const NavLink = ({
  href,
  children,
  active = false,
  icon,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  icon?: React.ReactNode;
}) => {
  return (
    <Link
      href={href}
      className={`group flex items-center px-4 py-2 rounded-xl font-medium transition-all duration-300 ease-out ${
        active
          ? "bg-purple-600/20 text-purple-400 shadow-[0_0_20px_rgba(147,51,234,0.3)] border border-purple-500/30"
          : "text-gray-400 hover:text-white hover:bg-white/5 hover:scale-105"
      }`}
    >
      {icon && (
        <span
          className={`mr-0.5 transition-transform duration-300 group-hover:rotate-12 ${active ? "text-purple-400" : "text-gray-500 group-hover:text-purple-400"}`}
        >
          {icon}
        </span>
      )}
      {children}
    </Link>
  );
};

/**
 * 移动端导航链接组件
 *
 * 用于移动端的下拉导航菜单。
 *
 * 特性：
 * - active 状态：紫色背景 + 左侧边框
 * - flex 布局：支持图标和文字横向排列
 * - 更大的点击区域（padding）
 * - 悬停效果：背景变暗，文字变白
 */
export const MobileNavLink = ({
  href,
  children,
  active = false,
  icon,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  icon?: React.ReactNode;
}) => {
  return (
    <Link
      href={href}
      className={`px-4 py-3 rounded-xl font-medium flex items-center space-x-2 transition-all duration-200 ${
        active
          ? "bg-purple-600/20 text-purple-400 border border-purple-500/30"
          : "text-gray-400 hover:text-white hover:bg-white/5"
      }`}
    >
      {icon && <span className={`${active ? "text-purple-400" : "text-gray-500"}`}>{icon}</span>}
      <span>{children}</span>
    </Link>
  );
};
