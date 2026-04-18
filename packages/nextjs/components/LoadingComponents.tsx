/**
 * Loading Components - Premium NFT Gallery
 * Restrained, no garish gradients
 */

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({ size = "md" }: LoadingSpinnerProps) {
  const sizes = {
    sm: "w-4 h-4 border",
    md: "w-6 h-6 border-2",
    lg: "w-10 h-10 border-2",
  };

  return (
    <div
      className={`${sizes[size]} rounded-full`}
      style={{
        borderTopColor: "var(--accent)",
        borderRightColor: "transparent",
        borderBottomColor: "transparent",
        borderLeftColor: "transparent",
        animation: "spin 0.8s linear infinite",
      }}
    />
  );
}

export function SkeletonNFTCard() {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      {/* Image */}
      <div className="aspect-square" style={{ backgroundColor: "var(--bg-elevated)" }} />

      {/* Info */}
      <div className="p-4 space-y-3">
        <div className="h-4 rounded w-2/3" style={{ backgroundColor: "var(--bg-elevated)" }} />
        <div className="h-3 rounded w-1/2" style={{ backgroundColor: "var(--bg-elevated)" }} />
        <div className="h-9 rounded" style={{ backgroundColor: "var(--bg-elevated)" }} />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonNFTCard key={index} />
      ))}
    </div>
  );
}

/**
 * Full page loading state
 */
export function FullPageLoading({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20" style={{ minHeight: "400px" }}>
      {/* Spinner */}
      <div className="relative mb-6">
        <div
          className="w-12 h-12 rounded-full"
          style={{
            border: "2px solid var(--accent-muted)",
            borderTopColor: "var(--accent)",
            animation: "spin 0.8s linear infinite",
          }}
        />
      </div>

      {/* Message */}
      <div className="text-center">
        <p className="text-sm font-medium" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
          {message}
        </p>
      </div>
    </div>
  );
}
