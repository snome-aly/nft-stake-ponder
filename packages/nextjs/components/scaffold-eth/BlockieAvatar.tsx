"use client";

import { AvatarComponent } from "@rainbow-me/rainbowkit";
import { blo } from "blo";

/**
 * BlockieAvatar - 自定义头像组件
 *
 * 功能：
 * - 为 RainbowKit 提供自定义头像渲染
 * - 优先显示 ENS 头像（如果有）
 * - 否则使用 Blockie 算法生成几何图案头像
 *
 * Blockie 算法：
 * - 根据以太坊地址生成独特的几何图案
 * - 确保相同地址始终生成相同的头像
 * - 使用 'blo' 库实现（轻量级、快速）
 *
 * 为什么不用 Next.js Image 组件：
 * - ENS 头像 URL 可能来自任意域名（IPFS、Arweave 等）
 * - 避免配置大量 remotePatterns
 * - 保持简单性和灵活性
 *
 * @param address - 以太坊地址
 * @param ensImage - ENS 头像 URL（可选）
 * @param size - 头像尺寸（像素）
 *
 * @example
 * <BlockieAvatar
 *   address="0x1234..."
 *   ensImage="https://..."
 *   size={24}
 * />
 */
export const BlockieAvatar: AvatarComponent = ({ address, ensImage, size }) => (
  // 不使用 Next.js Image 组件（避免需要配置 remote patterns）
  // eslint-disable-next-line @next/next/no-img-element
  <img
    className="rounded-full"
    // 优先使用 ENS 头像，否则使用 Blockie 生成头像
    src={ensImage || blo(address as `0x${string}`)}
    width={size}
    height={size}
    alt={`${address} avatar`}
  />
);
