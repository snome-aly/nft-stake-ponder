"use client";

import Link from "next/link";

interface EmptyStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
}

/**
 * EmptyState - Premium NFT Gallery
 * Clean empty state with icon and CTA
 */
export function EmptyState({ title, message, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="card p-12 text-center max-w-md mx-auto" style={{ backgroundColor: "var(--bg-surface)" }}>
      {/* Icon */}
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-6"
        style={{
          backgroundColor: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-[var(--text-tertiary)]">
          <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
          <path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      <h3
        className="text-lg font-semibold mb-2"
        style={{
          fontFamily: "var(--font-display)",
          color: "var(--text-primary)",
        }}
      >
        {title}
      </h3>
      <p
        className="text-sm mb-6"
        style={{
          fontFamily: "var(--font-body)",
          color: "var(--text-tertiary)",
          lineHeight: 1.6,
        }}
      >
        {message}
      </p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn btn-primary">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ title = "Something went wrong", message, onRetry }: ErrorMessageProps) {
  return (
    <div className="card p-12 text-center max-w-md mx-auto" style={{ backgroundColor: "var(--bg-surface)" }}>
      {/* Icon */}
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-6"
        style={{
          backgroundColor: "var(--error-muted)",
          border: "1px solid rgba(239, 68, 68, 0.2)",
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[var(--error)]">
          <path
            d="M12 9v4M12 17h.01M12 3l9.5 16.5H2.5L12 3z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h3
        className="text-lg font-semibold mb-2"
        style={{
          fontFamily: "var(--font-display)",
          color: "var(--text-primary)",
        }}
      >
        {title}
      </h3>
      <p
        className="text-sm mb-6"
        style={{
          fontFamily: "var(--font-body)",
          color: "var(--text-tertiary)",
          lineHeight: 1.6,
        }}
      >
        {message}
      </p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-secondary">
          Try Again
        </button>
      )}
    </div>
  );
}
