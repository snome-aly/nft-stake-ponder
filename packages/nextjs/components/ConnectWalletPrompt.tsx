/**
 * 全局连接钱包提示组件
 * 用于需要用户连接钱包才能访问的页面
 */

interface ConnectWalletPromptProps {
  title?: string;
  message?: string;
}

export function ConnectWalletPrompt({
  title = "Connect Your Wallet",
  message = "Please connect your wallet to continue.",
}: ConnectWalletPromptProps) {
  return (
    <div className="text-center py-16">
      <div className="text-8xl mb-6">🔐</div>
      <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
      <p className="text-gray-400 mb-6 max-w-md mx-auto">{message}</p>
    </div>
  );
}
