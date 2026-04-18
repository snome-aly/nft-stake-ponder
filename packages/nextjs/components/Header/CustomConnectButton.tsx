"use client";

import Image from "next/image";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useBalance } from "wagmi";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

/**
 * Format balance to avoid scientific notation
 */
const formatBalance = (balance: string | undefined): string => {
  if (!balance) return "0";
  const num = parseFloat(balance);
  if (num === 0) return "0";
  if (num < 0.0001) return "< 0.0001";
  if (num < 1) return num.toFixed(4);
  if (num < 10) return num.toFixed(3);
  return num.toFixed(2);
};

/**
 * Custom wallet connection button
 * Graphite + muted violet aesthetic
 */
export const CustomConnectButton = () => {
  const { address } = useAccount();

  const { data: balanceData } = useBalance({
    address: address,
    query: {
      enabled: !!address,
    },
  });

  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {(() => {
              // Not connected
              if (!connected) {
                return (
                  <button onClick={openConnectModal} type="button" className="btn btn-primary">
                    Connect Wallet
                  </button>
                );
              }

              // Unsupported network
              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="btn btn-sm"
                    style={{
                      backgroundColor: "var(--error-muted)",
                      color: "var(--error)",
                      borderColor: "rgba(239, 68, 68, 0.25)",
                    }}
                  >
                    Wrong network
                  </button>
                );
              }

              // Connected
              return (
                <div className="flex items-center gap-2">
                  {/* Network selector */}
                  <button onClick={openChainModal} type="button" className="btn btn-sm btn-secondary">
                    {chain.hasIcon && (
                      <div className="w-4 h-4 mr-1.5">
                        {chain.iconUrl && (
                          <Image
                            alt={chain.name ?? "Chain icon"}
                            src={chain.iconUrl}
                            width={16}
                            height={16}
                            className="rounded-full"
                            unoptimized
                            priority
                          />
                        )}
                      </div>
                    )}
                    <span className="hidden sm:inline">{chain.name}</span>
                    <ChevronDownIcon className="w-3.5 h-3.5 opacity-60" />
                  </button>

                  {/* Balance */}
                  <div
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm"
                    style={{
                      backgroundColor: "var(--bg-elevated)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                      {balanceData
                        ? formatBalance((Number(balanceData.value) / Math.pow(10, balanceData.decimals)).toString())
                        : "0"}
                    </span>
                    <span style={{ color: "var(--text-tertiary)" }}>{balanceData?.symbol || "ETH"}</span>
                  </div>

                  {/* Account */}
                  <button onClick={openAccountModal} type="button" className="btn btn-sm btn-secondary">
                    <span style={{ color: "var(--text-secondary)" }}>{account.displayName}</span>
                    <ChevronDownIcon className="w-3.5 h-3.5 opacity-60" />
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};
