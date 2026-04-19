"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CustomConnectButton } from "./CustomConnectButton";
import { Logo } from "./Logo";
import { AnimatePresence, motion } from "framer-motion";
import { useAccount } from "wagmi";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { ADMIN_ROLE } from "~~/constants/roles";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

/**
 * Header - Premium NFT Gallery Shell
 * Clean, restrained navigation
 */
export const Header = () => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { address } = useAccount();

  const { data: isAdmin } = useScaffoldReadContract({
    contractName: "StakableNFT",
    functionName: "hasRole",
    args: [ADMIN_ROLE, address],
  });

  // Navigation links
  const navLinks = [
    { href: "/home", label: "Home" },
    { href: "/mint", label: "Mint" },
    { href: "/my-nfts", label: "My NFTs" },
    { href: "/stake", label: "Stake" },
    { href: "/stats", label: "Stats" },
    { href: "/governance", label: "Governance" },
  ];

  if (isAdmin) {
    navLinks.push({ href: "/admin", label: "Admin" });
  }

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        backgroundColor: "rgba(24, 24, 27, 0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <div className="container-premium">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Logo />

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => {
              const isActive = pathname === link.href;
              return (
                <Link key={link.href} href={link.href}>
                  <span
                    className={`
                      inline-block px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150
                      ${
                        isActive
                          ? "text-[var(--accent)] bg-[var(--accent-muted)]"
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                      }
                    `}
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Wallet - Desktop */}
            <div className="hidden sm:block">
              <CustomConnectButton />
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg transition-colors duration-150 md:hidden"
              style={{ color: "var(--text-secondary)" }}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? <XMarkIcon className="w-5 h-5" /> : <Bars3Icon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="md:hidden overflow-hidden"
            style={{
              backgroundColor: "rgba(24, 24, 27, 0.95)",
              borderTop: "1px solid var(--border-subtle)",
            }}
          >
            <nav className="container-premium py-4 flex flex-col gap-1">
              {navLinks.map((link, index) => {
                const isActive = pathname === link.href;
                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Link href={link.href} onClick={() => setIsMenuOpen(false)}>
                      <span
                        className={`
                          block py-3 px-4 rounded-lg text-sm font-medium transition-colors duration-150
                          ${
                            isActive
                              ? "text-[var(--accent)] bg-[var(--accent-muted)]"
                              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                          }
                        `}
                        style={{ fontFamily: "var(--font-body)" }}
                      >
                        {link.label}
                      </span>
                    </Link>
                  </motion.div>
                );
              })}

              {/* Mobile Wallet */}
              <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                <div className="px-4">
                  <CustomConnectButton />
                </div>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
