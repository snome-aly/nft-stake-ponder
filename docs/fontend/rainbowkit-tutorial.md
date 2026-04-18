# RainbowKit 使用教程

## 什么是 RainbowKit？

RainbowKit 是以太坊钱包连接的最佳库，提供：
- 🎨 美观的钱包连接 UI
- 🔐 多钱包支持（MetaMask、WalletConnect 等）
- 📱 响应式设计
- ⚡️ 优秀的开发者体验

## 快速开始

### 1. 安装依赖

```bash
npm install @rainbow-me/rainbowkit wagmi viem
```

### 2. 基本配置

```typescript
// 在 app/providers.tsx 中
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

### 3. 添加连接按钮

```tsx
// 在你的组件中
import { ConnectButton } from '@rainbow-me/rainbowkit';

export function WalletConnect() {
  return <ConnectButton />;
}
```

## 高级配置

### 自定义钱包

```typescript
import {
  metaMaskWallet,
  walletConnectWallet,
  coinbaseWallet,
} from '@rainbow-me/rainbowkit/wallets';

const wallets = [
  metaMaskWallet,
  walletConnectWallet({
    projectId: 'YOUR_WALLETCONNECT_PROJECT_ID'
  }),
  coinbaseWallet,
];
```

### 自定义主题

```typescript
import { darkTheme, lightTheme } from '@rainbow-me/rainbowkit';

<RainbowKitProvider
  theme={darkTheme({
    accentColor: '#7c3aed',  // 自定义强调色
    accentColorForeground: 'white',
  })}
>
  {/* ... */}
</RainbowKitProvider>
```

### 自定义连接按钮

```tsx
import { ConnectButton } from '@rainbow-me/rainbowkit';

export function CustomConnectButton() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        // 根据状态渲染不同的 UI
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus ||
            authenticationStatus === 'authenticated');

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              'style': {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button onClick={openConnectModal} type="button">
                    Connect Wallet
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button onClick={openChainModal} type="button">
                    Wrong network
                  </button>
                );
              }

              return (
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={openChainModal}
                    style={{ display: 'flex', alignItems: 'center' }}
                    type="button"
                  >
                    {chain.hasIcon && (
                      <div
                        style={{
                          background: chain.iconBackground,
                          width: 12,
                          height: 12,
                          borderRadius: 999,
                          overflow: 'hidden',
                          marginRight: 4,
                        }}
                      >
                        {chain.iconUrl && (
                          <img
                            alt={chain.name ?? 'Chain icon'}
                            src={chain.iconUrl}
                            style={{ width: 12, height: 12 }}
                          />
                        )}
                      </div>
                    )}
                    {chain.name}
                  </button>

                  <button onClick={openAccountModal} type="button">
                    {account.displayName}
                    {account.displayBalance
                      ? ` (${account.displayBalance})`
                      : ''}
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
```

## 常用 Hooks

### 获取钱包信息

```tsx
import { useAccount, useNetwork } from 'wagmi';

function WalletInfo() {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();

  if (!isConnected) return <p>请连接钱包</p>;

  return (
    <div>
      <p>地址: {address}</p>
      <p>网络: {chain?.name}</p>
    </div>
  );
}
```

### 监听账户变化

```tsx
import { useAccount } from 'wagmi';
import { useEffect } from 'react';

function AccountWatcher() {
  const { address } = useAccount();

  useEffect(() => {
    console.log('账户地址变化:', address);
  }, [address]);

  return null;
}
```

## 网络配置

### 添加多个网络

```typescript
import { mainnet, polygon, arbitrum } from 'wagmi/chains';

const wagmiConfig = createConfig({
  chains: [mainnet, polygon, arbitrum],
  connectors: [
    injected(),
    walletConnect({ projectId: 'YOUR_PROJECT_ID' }),
  ],
  publicClient,
  webSocketPublicClient,
});
```

### 网络切换

```tsx
import { useSwitchNetwork } from 'wagmi';

function NetworkSwitcher() {
  const { switchNetwork } = useSwitchNetwork();

  return (
    <div>
      <button onClick={() => switchNetwork?.(1)}>
        切换到以太坊
      </button>
      <button onClick={() => switchNetwork?.(137)}>
        切换到 Polygon
      </button>
    </div>
  );
}
```

## 最佳实践

### 1. 错误处理

```tsx
import { useConnect } from 'wagmi';

function SafeConnect() {
  const { connect, error, isPending } = useConnect();

  if (error) {
    return <p>连接失败: {error.message}</p>;
  }

  return (
    <button
      onClick={() => connect({ connector: injected() })}
      disabled={isPending}
    >
      {isPending ? '连接中...' : '连接钱包'}
    </button>
  );
}
```

### 2. TypeScript 支持

```typescript
import type { Chain } from 'wagmi';

interface CustomChain extends Chain {
  customProperty?: string;
}

const customChain: CustomChain = {
  // ... 链配置
};
```

### 3. 性能优化

```tsx
import { memo } from 'react';

const OptimizedConnectButton = memo(CustomConnectButton);
```

## 常见问题

### Q: 如何获取 WalletConnect Project ID？
A: 访问 [WalletConnect Cloud](https://cloud.walletconnect.com/) 注册项目

### Q: 如何添加自定义网络？
A: 使用 `defineChain` 函数创建自定义链配置

### Q: 如何处理网络切换？
A: 使用 `useSwitchNetwork` hook 和 RainbowKit 的网络切换 UI

## 参考资源

- [RainbowKit 官方文档](https://www.rainbowkit.com/docs)
- [Wagmi 文档](https://wagmi.sh)
- [示例项目](https://github.com/rainbow-me/rainbowkit/tree/main/examples)

---

*这个教程涵盖了 RainbowKit 的主要功能。更多详细信息请参考官方文档。*