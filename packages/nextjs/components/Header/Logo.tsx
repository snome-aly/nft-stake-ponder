import Link from "next/link";

/**
 * Logo - Premium NFT Gallery
 * Clean geometric mark, no emoji
 */
export const Logo = () => {
  return (
    <Link href="/" className="flex items-center gap-3 group">
      {/* Logo Mark */}
      <div
        className="relative w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:opacity-80"
        style={{
          backgroundColor: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
        }}
      >
        {/* Geometric blind box mark */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-[var(--accent)]">
          <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>

        {/* Status indicator */}
        <div
          className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
          style={{ backgroundColor: "var(--success)" }}
        />
      </div>

      {/* Brand */}
      <div className="flex flex-col">
        <span
          className="text-sm font-semibold leading-tight"
          style={{
            fontFamily: "var(--font-display)",
            letterSpacing: "-0.01em",
            color: "var(--text-primary)",
          }}
        >
          BlindBox NFT
        </span>
        <span
          className="text-xs leading-tight"
          style={{
            fontFamily: "var(--font-body)",
            color: "var(--text-tertiary)",
            letterSpacing: "0.02em",
          }}
        >
          Mint · Stake · Earn
        </span>
      </div>
    </Link>
  );
};
