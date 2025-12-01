/**
 * Batch Mode Controls Component
 *
 * Provides UI for:
 * - Toggling batch selection mode
 * - Showing selected count
 * - Batch staking action button
 */

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
    return null; // Don't show if no unstaked NFTs
  }

  return (
    <div className="glass-card rounded-xl p-4 mb-6 border border-cyan-500/30">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left: Batch Mode Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsBatchMode(!isBatchMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium ${
              isBatchMode
                ? "bg-purple-600 text-white hover:bg-purple-700"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300"
            }`}
          >
            <input
              type="checkbox"
              checked={isBatchMode}
              onChange={() => {}}
              className="w-4 h-4 cursor-pointer accent-cyan-500"
            />
            <span className="text-sm">Batch Select Mode</span>
          </button>

          {isBatchMode && (
            <span className="text-cyan-400 text-sm font-medium">
              {selectedCount} of {availableCount} selected
            </span>
          )}
        </div>

        {/* Right: Batch Stake Button */}
        {isBatchMode && selectedCount > 0 && (
          <button
            onClick={onBatchStake}
            disabled={isProcessing}
            className="btn-primary flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>🚀</span>
            <span>
              {isProcessing
                ? `Staking ${selectedCount} NFT${selectedCount > 1 ? "s" : ""}...`
                : `Stake Selected (${selectedCount})`}
            </span>
          </button>
        )}
      </div>

      {/* Help Text */}
      {isBatchMode && selectedCount === 0 && (
        <p className="text-gray-500 text-sm mt-3">
          Select revealed and unstaked NFTs to batch stake them in a single transaction
        </p>
      )}
    </div>
  );
}
