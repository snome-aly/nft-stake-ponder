/**
 * 空状态提示组件
 */

import Link from "next/link";

interface EmptyStateProps {
  icon?: string;
  title: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({ icon = "📭", title, message, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="glass-card rounded-2xl p-12 text-center border border-cyan-500/30">
      <div className="text-8xl mb-6">{icon}</div>
      <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
      <p className="text-gray-400 text-lg mb-6 max-w-md mx-auto">{message}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold rounded-xl hover:opacity-90 transition-all"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

/**
 * 错误状态提示组件
 */
interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ title = "Oops! Something went wrong", message, onRetry }: ErrorMessageProps) {
  return (
    <div className="glass-card rounded-2xl p-12 text-center border border-red-500/30">
      <div className="text-8xl mb-6">⚠️</div>
      <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
      <p className="text-red-400 text-lg mb-6 max-w-md mx-auto">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
