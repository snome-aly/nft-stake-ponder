"use client";

interface BatchClaimControlsProps {
  totalStaked: number;
  selectedCount: number;
  isAllSelected: boolean;
  onSelectAll: () => void;
  onBatchClaim: () => void;
  isProcessing: boolean;
}

export function BatchClaimControls({
  totalStaked,
  selectedCount,
  isAllSelected,
  onSelectAll,
  onBatchClaim,
  isProcessing,
}: BatchClaimControlsProps) {
  if (totalStaked <= 1) return null;

  return (
    <div className="card p-4 mb-6" style={{ backgroundColor: "var(--bg-elevated)" }}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onSelectAll}
            className="w-5 h-5 rounded flex items-center justify-center transition-all"
            style={{
              backgroundColor: isAllSelected ? "var(--accent)" : "var(--bg-card)",
              border: `1px solid ${isAllSelected ? "var(--accent)" : "var(--border-subtle)"}`,
            }}
          >
            {isAllSelected && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="text-white">
                <path
                  d="M5 12l5 5L20 7"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
          <span
            className="text-sm font-medium"
            style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}
          >
            {selectedCount > 0 ? `${selectedCount} NFTs selected` : "Select all"}
          </span>
        </div>

        {selectedCount > 0 && (
          <button onClick={onBatchClaim} disabled={isProcessing} className="btn btn-primary">
            {isProcessing ? "Claiming..." : `Claim Selected (${selectedCount})`}
          </button>
        )}
      </div>
    </div>
  );
}
