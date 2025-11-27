"use client";

import { AddressCopyIcon } from "./AddressCopyIcon";
import { AddressLinkWrapper } from "./AddressLinkWrapper";
import { Address as AddressType, getAddress, isAddress } from "viem";
import { normalize } from "viem/ens";
import { useEnsAvatar, useEnsName } from "wagmi";
import { BlockieAvatar } from "~~/components/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { getBlockExplorerAddressLink } from "~~/utils/scaffold-eth";

/**
 * 文本大小映射表
 * 将尺寸名称映射到 Tailwind CSS 类名
 */
const textSizeMap = {
  "3xs": "text-[10px]",
  "2xs": "text-[11px]",
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
  "3xl": "text-3xl",
  "4xl": "text-4xl",
} as const;

/**
 * Blockie 头像大小映射表
 * 定义不同尺寸下头像的像素大小（相对于 base 尺寸的倍数）
 */
const blockieSizeMap = {
  "3xs": 4,
  "2xs": 5,
  xs: 6,
  sm: 7,
  base: 8,
  lg: 9,
  xl: 10,
  "2xl": 12,
  "3xl": 15,
  "4xl": 17,
  "5xl": 19,
  "6xl": 21,
  "7xl": 23,
} as const;

/**
 * 复制图标大小映射表
 * 定义不同尺寸下复制按钮图标的 Tailwind CSS 类名
 */
const copyIconSizeMap = {
  "3xs": "h-2.5 w-2.5",
  "2xs": "h-3 w-3",
  xs: "h-3.5 w-3.5",
  sm: "h-4 w-4",
  base: "h-[18px] w-[18px]",
  lg: "h-5 w-5",
  xl: "h-[22px] w-[22px]",
  "2xl": "h-6 w-6",
  "3xl": "h-[26px] w-[26px]",
  "4xl": "h-7 w-7",
} as const;

// 尺寸映射表的联合类型
type SizeMap = typeof textSizeMap | typeof blockieSizeMap;

/**
 * 获取下一个更大的尺寸
 *
 * @param sizeMap - 尺寸映射表（文本或 Blockie）
 * @param currentSize - 当前尺寸
 * @param step - 跳跃步数（默认为 1）
 * @returns 更大的尺寸键名（不会超出最大值）
 */
const getNextSize = <T extends SizeMap>(sizeMap: T, currentSize: keyof T, step = 1): keyof T => {
  const sizes = Object.keys(sizeMap) as Array<keyof T>;
  const currentIndex = sizes.indexOf(currentSize);
  const nextIndex = Math.min(currentIndex + step, sizes.length - 1);
  return sizes[nextIndex];
};

/**
 * 获取上一个更小的尺寸
 *
 * @param sizeMap - 尺寸映射表（文本或 Blockie）
 * @param currentSize - 当前尺寸
 * @param step - 跳跃步数（默认为 1）
 * @returns 更小的尺寸键名（不会小于最小值）
 */
const getPrevSize = <T extends SizeMap>(sizeMap: T, currentSize: keyof T, step = 1): keyof T => {
  const sizes = Object.keys(sizeMap) as Array<keyof T>;
  const currentIndex = sizes.indexOf(currentSize);
  const prevIndex = Math.max(currentIndex - step, 0);
  return sizes[prevIndex];
};

/**
 * Address 组件的 Props 类型定义
 */
type AddressProps = {
  address?: AddressType; // 以太坊地址（可选）
  disableAddressLink?: boolean; // 是否禁用地址链接
  format?: "short" | "long"; // 地址显示格式：短格式（0x1234...5678）或长格式（完整地址）
  size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl"; // 组件整体尺寸
  onlyEnsOrAddress?: boolean; // 是否仅显示 ENS 或地址（不同时显示两者）
};

/**
 * Address 组件 - 以太坊地址显示组件
 *
 * 核心功能：
 * 1. 显示以太坊地址（支持短格式/长格式）
 * 2. 自动解析并显示 ENS 域名（如果有）
 * 3. 显示 Blockie 头像或 ENS 头像
 * 4. 提供地址复制功能
 * 5. 支持点击跳转到区块浏览器
 * 6. 加载过程中显示骨架屏
 *
 * 显示模式：
 * - onlyEnsOrAddress=false: ENS 名称在上方，地址在下方
 * - onlyEnsOrAddress=true: 仅显示 ENS（如果有）或地址
 *
 * @example
 * <Address address="0x1234..." size="lg" format="short" />
 */
export const Address = ({
  address,
  disableAddressLink,
  format,
  size = "base",
  onlyEnsOrAddress = false,
}: AddressProps) => {
  // ==================== Hooks 必须在所有早期返回之前调用 ====================
  // 这是 React Hooks 规则：必须在组件顶层调用，不能在条件语句后

  // 获取当前目标网络（用于区块浏览器链接）
  const { targetNetwork } = useTargetNetwork();

  // ==================== 地址验证与格式化 ====================

  // 校验和地址（Checksum Address）：符合 EIP-55 标准的地址格式
  let checkSumAddress: AddressType | undefined;
  let isInvalidAddress = false;

  try {
    if (address) {
      // 检查地址格式是否有效
      if (isAddress(address)) {
        // 转换为校验和格式（大小写混合，用于验证地址正确性）
        checkSumAddress = getAddress(address);
      } else {
        // 地址格式无效
        isInvalidAddress = true;
      }
    }
  } catch {
    // 捕获任何意外错误，标记为无效地址
    isInvalidAddress = true;
  }

  // ==================== ENS 域名解析 ====================

  // 从以太坊主网（chainId: 1）查询地址对应的 ENS 域名
  const { data: ens, isLoading: isEnsNameLoading } = useEnsName({
    address: checkSumAddress,
    chainId: 1, // ENS 仅在以太坊主网上可用
    query: {
      enabled: isAddress(checkSumAddress ?? ""), // 仅在地址有效时启用查询
    },
  });

  // 如果有 ENS 域名，查询其头像（NFT 或图片 URL）
  const { data: ensAvatar } = useEnsAvatar({
    name: ens ? normalize(ens) : undefined, // 规范化 ENS 名称（处理特殊字符）
    chainId: 1,
    query: {
      enabled: Boolean(ens), // 仅在 ENS 存在时启用查询
      gcTime: 30_000, // 缓存时间 30 秒
    },
  });

  // ==================== 处理无效地址 ====================
  // 所有 Hooks 调用完毕后，才能进行条件返回

  if (isInvalidAddress) {
    return <span className="text-error text-sm">Invalid address</span>;
  }

  // ==================== 地址格式化 ====================

  // 短格式：0x1234...5678
  const shortAddress = checkSumAddress?.slice(0, 6) + "..." + checkSumAddress?.slice(-4);
  // 根据 format 属性决定显示长地址还是短地址
  const displayAddress = format === "long" ? checkSumAddress : shortAddress;
  // 优先显示 ENS，如果没有则显示地址
  const displayEnsOrAddress = ens || displayAddress;

  // ==================== 骨架屏与尺寸计算 ====================

  // 是否显示骨架屏加载效果
  // 条件：地址不存在 或 （非仅显示模式 且 有 ENS 或正在加载 ENS）
  const showSkeleton = !checkSumAddress || (!onlyEnsOrAddress && (ens || isEnsNameLoading));

  // 动态计算各元素尺寸
  const addressSize = showSkeleton && !onlyEnsOrAddress ? getPrevSize(textSizeMap, size, 2) : size;
  const ensSize = getNextSize(textSizeMap, addressSize); // ENS 字体比地址稍大
  const blockieSize = showSkeleton && !onlyEnsOrAddress ? getNextSize(blockieSizeMap, addressSize, 4) : addressSize;

  // ==================== 骨架屏渲染 ====================
  // 地址为空时显示加载占位符

  if (!checkSumAddress) {
    return (
      <div className="flex items-center">
        {/* 头像骨架屏 - 圆形占位符 */}
        <div
          className="shrink-0 skeleton rounded-full"
          style={{
            // 根据 blockieSize 计算实际像素大小
            width: (blockieSizeMap[blockieSize] * 24) / blockieSizeMap["base"],
            height: (blockieSizeMap[blockieSize] * 24) / blockieSizeMap["base"],
          }}
        ></div>
        <div className="flex flex-col space-y-1">
          {/* ENS 名称骨架屏（仅在非仅显示模式下） */}
          {!onlyEnsOrAddress && (
            <div className={`ml-1.5 skeleton rounded-lg font-bold ${textSizeMap[ensSize]}`}>
              {/* 不可见的占位文本，用于撑开宽度 */}
              <span className="invisible">0x1234...56789</span>
            </div>
          )}
          {/* 地址骨架屏 */}
          <div className={`ml-1.5 skeleton rounded-lg ${textSizeMap[addressSize]}`}>
            <span className="invisible">0x1234...56789</span>
          </div>
        </div>
      </div>
    );
  }

  // ==================== 正常渲染 ====================

  // 生成区块浏览器链接
  const blockExplorerAddressLink = getBlockExplorerAddressLink(targetNetwork, checkSumAddress);

  return (
    <div className="flex items-center shrink-0">
      {/* 左侧：Blockie 头像或 ENS 头像 */}
      <div className="shrink-0">
        <BlockieAvatar
          address={checkSumAddress}
          ensImage={ensAvatar} // 如果有 ENS 头像，优先显示
          size={(blockieSizeMap[blockieSize] * 24) / blockieSizeMap["base"]}
        />
      </div>

      {/* 右侧：文本信息 */}
      <div className="flex flex-col">
        {/* ENS 名称行（如果显示骨架屏状态） */}
        {showSkeleton &&
          (isEnsNameLoading ? (
            // 正在加载 ENS：显示骨架屏
            <div className={`ml-1.5 skeleton rounded-lg font-bold ${textSizeMap[ensSize]}`}>
              <span className="invisible">{shortAddress}</span>
            </div>
          ) : (
            // ENS 加载完成：显示 ENS 名称
            <span className={`ml-1.5 ${textSizeMap[ensSize]} font-bold`}>
              <AddressLinkWrapper
                disableAddressLink={disableAddressLink}
                blockExplorerAddressLink={blockExplorerAddressLink}
              >
                {ens}
              </AddressLinkWrapper>
            </span>
          ))}

        {/* 地址行（始终显示） */}
        <div className="flex">
          <span className={`ml-1.5 ${textSizeMap[addressSize]} font-normal`}>
            <AddressLinkWrapper
              disableAddressLink={disableAddressLink}
              blockExplorerAddressLink={blockExplorerAddressLink}
            >
              {/* 根据 onlyEnsOrAddress 决定显示内容 */}
              {onlyEnsOrAddress ? displayEnsOrAddress : displayAddress}
            </AddressLinkWrapper>
          </span>
          {/* 复制按钮 */}
          <AddressCopyIcon
            className={`ml-1 ${copyIconSizeMap[addressSize]} cursor-pointer`}
            address={checkSumAddress}
          />
        </div>
      </div>
    </div>
  );
};
