"use client";

interface StakingLoadingProps {
  size?: "sm" | "md" | "lg";
  message?: string;
}

export function StakingLoading({ size = "md", message = "Staking..." }: StakingLoadingProps) {
  const sizeClasses = {
    sm: { container: "h-12 w-12", core: "h-6 w-6" },
    md: { container: "h-16 w-16", core: "h-8 w-8" },
    lg: { container: "h-20 w-20", core: "h-10 w-10" },
  };

  const currentSize = sizeClasses[size];

  return (
    <div className="flex flex-col items-center">
      <div className={`relative ${currentSize.container}`}>
        {/* Rotating ring */}
        <div
          className="absolute inset-0 rounded-full animate-spin"
          style={{
            border: "2px solid var(--accent-muted)",
            borderTopColor: "var(--accent)",
            borderRightColor: "transparent",
          }}
        />

        {/* Core */}
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${currentSize.core} rounded-full flex items-center justify-center`}
          style={{ backgroundColor: "var(--accent-muted)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[var(--accent)]">
            <path
              d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {message && (
        <p className="mt-3 text-sm" style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}>
          {message}
        </p>
      )}
    </div>
  );
}
