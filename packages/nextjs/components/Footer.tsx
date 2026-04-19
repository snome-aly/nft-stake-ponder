import Link from "next/link";
import { Logo } from "./Header/Logo";
import { motion } from "framer-motion";
import { ChatBubbleLeftRightIcon, CommandLineIcon, GlobeAltIcon } from "@heroicons/react/24/outline";

/**
 * Footer - Premium NFT Gallery
 * Clean, restrained footer with minimal decoration
 */
const techStack = [
  { name: "Solidity", url: "https://soliditylang.org" },
  { name: "Hardhat", url: "https://hardhat.org" },
  { name: "OpenZeppelin", url: "https://openzeppelin.com" },
  { name: "Next.js", url: "https://nextjs.org" },
  { name: "Tailwind CSS", url: "https://tailwindcss.com" },
  { name: "TypeScript", url: "https://www.typescriptlang.org" },
  { name: "Wagmi", url: "https://wagmi.sh" },
  { name: "Viem", url: "https://viem.sh" },
  { name: "Ponder", url: "https://ponder.sh" },
  { name: "PostgreSQL", url: "https://postgresql.org" },
  { name: "GraphQL", url: "https://graphql.org" },
  { name: "Vercel", url: "https://vercel.com" },
  { name: "Alchemy", url: "https://alchemy.com" },
];

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      style={{
        backgroundColor: "var(--bg-base)",
        borderTop: "1px solid var(--border-subtle)",
      }}
    >
      <div className="container-premium pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 mb-10">
          {/* Brand */}
          <motion.div
            className="lg:col-span-4 pt-8"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <div>
              <Logo />
            </div>

            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.875rem",
                lineHeight: 1.7,
                color: "var(--text-tertiary)",
                maxWidth: "260px",
                marginBottom: "var(--space-5)",
              }}
            >
              On-chain blind box NFTs with transparent rarity and sustainable staking rewards.
            </p>

            {/* Social Links */}
            <div className="flex gap-2">
              <SocialLink href="https://twitter.com" label="Twitter" icon={<GlobeAltIcon className="w-4 h-4" />} />
              <SocialLink
                href="https://discord.com"
                label="Discord"
                icon={<ChatBubbleLeftRightIcon className="w-4 h-4" />}
              />
              <SocialLink href="https://github.com" label="GitHub" icon={<CommandLineIcon className="w-4 h-4" />} />
            </div>
          </motion.div>

          {/* Links */}
          <div className="lg:col-span-8 grid grid-cols-3 gap-8">
            {/* Quick Links */}
            <motion.div
              className="pt-8"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              viewport={{ once: true }}
            >
              <h4
                className="text-xs font-semibold uppercase tracking-wider mb-4"
                style={{
                  fontFamily: "var(--font-body)",
                  color: "var(--text-secondary)",
                  letterSpacing: "0.08em",
                }}
              >
                Explore
              </h4>
              <ul className="space-y-2.5">
                <FooterLink href="/mint">Mint</FooterLink>
                <FooterLink href="/my-nfts">My NFTs</FooterLink>
                <FooterLink href="/stake">Stake</FooterLink>
                <FooterLink href="/stats">Statistics</FooterLink>
              </ul>
            </motion.div>

            {/* Project */}
            <motion.div
              className="pt-8"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <h4
                className="text-xs font-semibold uppercase tracking-wider mb-4"
                style={{
                  fontFamily: "var(--font-body)",
                  color: "var(--text-secondary)",
                  letterSpacing: "0.08em",
                }}
              >
                Project
              </h4>
              <ul className="space-y-2.5">
                <FooterLink href="/governance">Governance</FooterLink>
                <FooterLink href="https://github.com" external>
                  GitHub
                </FooterLink>
                <FooterLink href="/docs">Documentation</FooterLink>
              </ul>
            </motion.div>

            {/* Resources */}
            <motion.div
              className="pt-8"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              viewport={{ once: true }}
            >
              <h4
                className="text-xs font-semibold uppercase tracking-wider mb-4"
                style={{
                  fontFamily: "var(--font-body)",
                  color: "var(--text-secondary)",
                  letterSpacing: "0.08em",
                }}
              >
                Resources
              </h4>
              <ul className="space-y-2.5">
                <FooterLink href="/guide">Guide</FooterLink>
                <FooterLink href="/terms">Terms</FooterLink>
                <FooterLink href="/privacy">Privacy</FooterLink>
              </ul>
            </motion.div>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="relative py-8" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <p
            className="absolute left-1/2 top-0 z-10 max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 px-4 py-1 text-center text-[12px]"
            style={{
              fontFamily: "var(--font-body)",
              color: "var(--text-muted)",
              backgroundColor: "var(--bg-base)",
              lineHeight: 1.4,
            }}
          >
            ⚠️ This project is for educational purposes only. Not financial advice. DYOR.
          </p>
          <div className="mx-auto flex max-w-6xl flex-col items-center text-center">
            <div className="flex w-full flex-col items-center gap-3">
              <span
                className="text-[10px] uppercase tracking-widest"
                style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}
              >
                Built with
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {techStack.map(tech => (
                  <a
                    key={tech.name}
                    href={tech.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 rounded text-[10px] font-semibold transition-all hover:scale-105"
                    style={{
                      fontFamily: "var(--font-body)",
                      backgroundColor: "var(--bg-elevated)",
                      border: "1px solid var(--border-default)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {tech.name}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div
          className="pt-6 flex flex-col md:flex-row justify-between items-center gap-4"
          style={{ borderTop: "1px solid var(--border-subtle)" }}
        >
          <p
            className="text-xs"
            style={{
              fontFamily: "var(--font-body)",
              color: "var(--text-muted)",
            }}
          >
            © {currentYear} BlindBox NFT. All rights reserved.
          </p>

          <p
            className="text-xs flex items-center gap-1.5"
            style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}
          >
            <span>Built on</span>
            <a
              href="https://scaffoldeth.io"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--accent)] transition-colors duration-150"
              style={{ color: "var(--text-tertiary)" }}
            >
              Scaffold-ETH 2
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

function FooterLink({
  href,
  children,
  external = false,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className="text-sm hover:text-[var(--text-primary)] transition-colors duration-150"
        style={{
          fontFamily: "var(--font-body)",
          color: "var(--text-tertiary)",
        }}
      >
        {children}
      </Link>
    </li>
  );
}

function SocialLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 hover:scale-110"
      style={{
        backgroundColor: "var(--bg-elevated)",
        color: "var(--text-tertiary)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      {icon}
    </a>
  );
}
