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
    <div className="glass-card rounded-xl p-4 mb-6 border border-cyan-500/30">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isAllSelected}
            onChange={onSelectAll}
            className="w-5 h-5 cursor-pointer accent-cyan-500"
          />
          <span className="text-white font-medium">
            {selectedCount > 0 ? `${selectedCount} NFTs selected` : "Select all"}
          </span>
        </div>

        {selectedCount > 0 && (
          <button
            onClick={onBatchClaim}
            disabled={isProcessing}
            className="btn-primary flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
          >
            <span>💰</span>
            <span>{isProcessing ? "Claiming..." : `Claim Selected (${selectedCount})`}</span>
          </button>
        )}
      </div>
    </div>
  );
}
