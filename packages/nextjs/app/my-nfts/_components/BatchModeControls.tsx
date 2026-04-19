"use client";

interface BatchModeControlsProps {
  isBatchMode: boolean;
  setIsBatchMode: (enabled: boolean) => void;
  selectedCount: number;
  availableCount: number;
  onBatchStake: () => void;
  isProcessing?: boolean;
}

export function BatchModeControls({
  isBatchMode,
  setIsBatchMode,
  selectedCount,
  availableCount,
  onBatchStake,
  isProcessing = false,
}: BatchModeControlsProps) {
  if (availableCount === 0) {
    return null;
  }

  return (
    <div className="card p-4 mb-6" style={{ backgroundColor: "var(--bg-elevated)" }}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left: Batch Mode Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsBatchMode(!isBatchMode)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium"
            style={{
              backgroundColor: isBatchMode ? "var(--accent)" : "var(--bg-card)",
              color: isBatchMode ? "white" : "var(--text-muted)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <input
              type="checkbox"
              checked={isBatchMode}
              onChange={() => {}}
              className="w-4 h-4 cursor-pointer accent-[var(--accent)]"
            />
            <span style={{ fontFamily: "var(--font-body)" }}>Batch Select Mode</span>
          </button>

          {isBatchMode && (
            <span className="text-sm" style={{ fontFamily: "var(--font-body)", color: "var(--accent)" }}>
              {selectedCount} of {availableCount} selected
            </span>
          )}
        </div>

        {/* Right: Batch Stake Button */}
        {isBatchMode && selectedCount > 0 && (
          <button onClick={onBatchStake} disabled={isProcessing} className="btn btn-primary btn-sm px-3">
            {isProcessing ? `Staking ${selectedCount}...` : `Stake (${selectedCount})`}
          </button>
        )}
      </div>

      {isBatchMode && selectedCount === 0 && (
        <p className="text-xs mt-3" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
          Select revealed and unstaked NFTs to batch stake them in a single transaction
        </p>
      )}
    </div>
  );
}
