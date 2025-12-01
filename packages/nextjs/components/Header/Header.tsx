"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { useAccount } from "wagmi";
import { CustomConnectButton } from "./CustomConnectButton";
import { Logo } from "./Logo";
import { MobileNavLink, NavLink } from "./NavLink";
import {
  Bars3Icon,
  ChartBarIcon,
  CubeTransparentIcon,
  HomeIcon,
  LockClosedIcon,
  PhotoIcon,
  XMarkIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { ADMIN_ROLE } from "~~/constants/roles";

/**
 * Header 导航链接配置
 */
type NavLink = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

export const Header = () => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { address } = useAccount();

  // 检查是否为管理员
  const { data: isAdmin } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "hasRole",
    args: [ADMIN_ROLE, address],
  });

  // 基础导航链接
  const baseNavLinks: NavLink[] = [
    {
      label: "Home",
      href: "/home",
      icon: <HomeIcon className="w-5 h-5" />,
    },
    {
      label: "Mint",
      href: "/mint",
      icon: <CubeTransparentIcon className="w-5 h-5" />,
    },
    {
      label: "My NFTs",
      href: "/my-nfts",
      icon: <PhotoIcon className="w-5 h-5" />,
    },
    {
      label: "Stake",
      href: "/stake",
      icon: <LockClosedIcon className="w-5 h-5" />,
    },
    {
      label: "Stats",
      href: "/stats",
      icon: <ChartBarIcon className="w-5 h-5" />,
    },
  ];

  // 管理员链接
  const adminLink: NavLink = {
    label: "Admin",
    href: "/admin",
    icon: <WrenchScrewdriverIcon className="w-5 h-5" />,
  };

  // 根据权限动态添加管理员链接
  const navLinks = isAdmin ? [...baseNavLinks, adminLink] : baseNavLinks;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-white/10 shadow-lg transition-all duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-4 sm:gap-8">
          {/* Logo 区域 - 靠左 */}
          <div className="flex-shrink-0">
            <Logo />
          </div>

          {/* 桌面端导航菜单 - 靠左跟随 Logo */}
          <nav className="hidden md:flex items-center space-x-2">
            {navLinks.map(link => (
              <NavLink
                key={link.href}
                href={link.href}
                active={pathname === link.href}
                icon={link.icon}
                iconOnly={link.href === "/admin"}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* 右侧操作区 - 靠右 */}
          <div className="flex items-center space-x-4 flex-shrink-0 ml-auto">
            {/* 钱包连接按钮 - 桌面端显示（包含网络选择功能） */}
            <div className="hidden sm:block">
              <CustomConnectButton />
            </div>

            {/* 移动端菜单按钮 */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* 移动端导航菜单 */}
        {isMenuOpen && (
          <div className="md:hidden py-4 animate-in slide-in-from-top duration-200">
            <nav className="flex flex-col space-y-2 px-2">
              {navLinks.map(link => (
                <MobileNavLink key={link.href} href={link.href} active={pathname === link.href} icon={link.icon}>
                  {link.label}
                </MobileNavLink>
              ))}

              {/* 移动端钱包连接区域 */}
              <div className="pt-4 mt-2 border-t border-white/10">
                <div className="px-2">
                  <CustomConnectButton />
                </div>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
