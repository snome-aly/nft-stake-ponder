import Link from "next/link";
import { Logo } from "./Header/Logo";
import { ChatBubbleLeftRightIcon, CommandLineIcon, GlobeAltIcon, HeartIcon } from "@heroicons/react/24/outline";

/**
 * Footer 底部组件
 *
 * 包含：
 * - 品牌信息和描述
 * - 社交媒体链接
 * - 快速导航链接
 * - 项目信息
 * - 资源和文档
 * - 技术栈展示
 * - 版权信息
 */
export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 border-t border-white/10 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* 主要内容区域 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 mb-8">
          {/* 品牌信息 - 占 4 列 */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center space-x-3">
              <Logo />
            </div>

            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              Discover the mystery of blind box NFTs with transparent rarity distribution and sustainable staking
              rewards. Join the future of gamified DeFi.
            </p>

            {/* 社交媒体链接 */}
            <div className="flex space-x-3">
              <SocialLink href="https://twitter.com" label="Twitter" icon={<GlobeAltIcon className="w-5 h-5" />} />
              <SocialLink
                href="https://discord.com"
                label="Discord"
                icon={<ChatBubbleLeftRightIcon className="w-5 h-5" />}
              />
              <SocialLink href="https://github.com" label="GitHub" icon={<CommandLineIcon className="w-5 h-5" />} />
              <SocialLink href="https://t.me" label="Telegram" icon={<ChatBubbleLeftRightIcon className="w-5 h-5" />} />
            </div>
          </div>

          {/* 链接区域 - 占 8 列 */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-6">
            {/* 快速链接 */}
            <div>
              <h4 className="text-white font-semibold mb-4 flex items-center text-sm">
                <span className="w-1 h-3 bg-purple-500 rounded-full mr-2"></span>
                Quick Links
              </h4>
              <ul className="space-y-2">
                <FooterLink href="/mint">Mint NFT</FooterLink>
                <FooterLink href="/my-nfts">My Collection</FooterLink>
                <FooterLink href="/stake">Staking</FooterLink>
                <FooterLink href="/stats">Statistics</FooterLink>
              </ul>
            </div>

            {/* 项目信息 */}
            <div>
              <h4 className="text-white font-semibold mb-4 flex items-center text-sm">
                <span className="w-1 h-3 bg-pink-500 rounded-full mr-2"></span>
                Project
              </h4>
              <ul className="space-y-2">
                <FooterLink href="/about">About Us</FooterLink>
                <FooterLink href="/docs">Documentation</FooterLink>
                <FooterLink href="https://github.com" external>
                  GitHub
                </FooterLink>
                <FooterLink href="/faq">FAQ</FooterLink>
              </ul>
            </div>

            {/* 资源 */}
            <div>
              <h4 className="text-white font-semibold mb-4 flex items-center text-sm">
                <span className="w-1 h-3 bg-blue-500 rounded-full mr-2"></span>
                Resources
              </h4>
              <ul className="space-y-2">
                <FooterLink href="/guide">Beginner Guide</FooterLink>
                <FooterLink href="/terms">Terms of Service</FooterLink>
                <FooterLink href="/privacy">Privacy Policy</FooterLink>
                <FooterLink href="/support">Support</FooterLink>
              </ul>
            </div>
          </div>
        </div>

        {/* 技术栈展示 */}
        <div className="border-t border-white/5 pt-6 mb-6">
          <div className="flex flex-col items-center justify-center">
            <h4 className="text-gray-500 text-[10px] uppercase tracking-wider mb-3 font-medium">
              Built with Modern Tech
            </h4>
            <div className="flex flex-wrap justify-center items-center gap-2 opacity-70 hover:opacity-100 transition-opacity duration-300">
              <TechBadge name="Ethereum" />
              <TechBadge name="Solidity" />
              <TechBadge name="Hardhat" />
              <span className="text-gray-700 text-xs">|</span>
              <TechBadge name="Next.js" />
              <TechBadge name="TailwindCSS" />
              <TechBadge name="Daisyui" />
              <span className="text-gray-700 text-xs">|</span>
              <TechBadge name="RainbowKit" />
              <TechBadge name="Wagmi" />
              <span className="text-gray-700 text-xs">|</span>
              <TechBadge name="Ponder" />
            </div>
          </div>
        </div>

        {/* 底部版权信息 */}
        <div className="border-t border-white/5 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-gray-500 text-xs">© {currentYear} BlindBox NFT. All rights reserved.</div>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Made with</span>
              <HeartIcon className="w-3 h-3 text-red-500 animate-pulse" />
              <span>using</span>
              <a
                href="https://scaffoldeth.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 transition-colors font-medium"
              >
                Scaffold-ETH 2
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

/**
 * Footer 链接组件
 */
function FooterLink({
  href,
  children,
  external = false,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  const className = "text-gray-400 hover:text-white hover:translate-x-1 transition-all duration-200 text-sm block";

  if (external) {
    return (
      <li>
        <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
          {children}
        </a>
      </li>
    );
  }

  return (
    <li>
      <Link href={href} className={className}>
        {children}
      </Link>
    </li>
  );
}

/**
 * 社交媒体链接组件
 */
function SocialLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="w-10 h-10 bg-white/5 hover:bg-purple-600/20 hover:text-purple-400 text-gray-400 rounded-xl flex items-center justify-center transition-all duration-300 hover:-translate-y-1 border border-white/5 hover:border-purple-500/30"
      aria-label={label}
    >
      {icon}
    </a>
  );
}

/**
 * 技术栈徽章组件
 */
function TechBadge({ name }: { name: string }) {
  return (
    <span className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-200 text-xs rounded-md transition-colors duration-200 border border-white/5">
      {name}
    </span>
  );
}
