/**
 * AddressInput - 以太坊地址输入组件（支持 ENS 域名解析）
 *
 * 核心功能：
 * 1. ENS 域名双向解析
 *    - 输入 vitalik.eth → 自动解析为 0x地址
 *    - 输入 0x地址 → 自动反向解析为 ENS 域名（如果有）
 * 2. 头像显示
 *    - ENS 头像：从 ENS 记录加载用户设置的头像
 *    - Blockie 头像：为任何地址生成唯一的像素艺术头像（使用 blo 库）
 * 3. 防抖优化：减少 RPC 调用频率，提升性能
 * 4. 加载状态：显示骨架屏（skeleton）反馈查询进度
 *
 * 使用场景：
 * - 智能合约地址参数输入
 * - 转账收款地址输入
 * - 白名单地址管理
 *
 * @example
 * ```tsx
 * <AddressInput
 *   value={recipientAddress}
 *   onChange={setRecipientAddress}
 *   placeholder="输入以太坊地址或 ENS 域名"
 * />
 * ```
 */
import { useEffect, useState } from "react";
import { blo } from "blo";
import { useDebounceValue } from "usehooks-ts";
import { Address, isAddress } from "viem";
import { normalize } from "viem/ens";
import { useEnsAddress, useEnsAvatar, useEnsName } from "wagmi";
import { CommonInputProps, InputBase, isENS } from "~~/components/scaffold-eth";

export const AddressInput = ({ value, name, placeholder, onChange, disabled }: CommonInputProps<Address | string>) => {
  /**
   * 防抖处理：延迟 500ms 后才触发 ENS 解析
   * 目的：避免用户每输入一个字符就调用一次 RPC，浪费资源
   *
   * 特殊优化：如果输入已经是有效的 0x 地址，则跳过防抖
   * 原因：地址格式的输入（如复制粘贴）不需要等待
   */
  const [_debouncedValue] = useDebounceValue(value, 500);
  const debouncedValue = isAddress(value) ? value : _debouncedValue;
  // 判断防抖值是否与当前输入一致（防抖是否完成）
  const isDebouncedValueLive = debouncedValue === value;

  /**
   * 只在防抖完成后使用值进行查询
   * 目的：防止在用户快速输入时使用过时的中间值查询
   * 示例：用户输入 "vitalik.eth"
   *   - 输入 "v" 时：settledValue = undefined（防抖未完成）
   *   - 输入 "vitalik.eth" 停止 500ms 后：settledValue = "vitalik.eth"
   */
  const settledValue = isDebouncedValueLive ? debouncedValue : undefined;

  /**
   * ENS 域名 → 地址解析
   * 功能：将 vitalik.eth 解析为 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
   *
   * 查询条件：
   * - 防抖完成（isDebouncedValueLive）
   * - 输入符合 ENS 格式（包含点号，如 .eth）
   *
   * 缓存时间：30 秒（避免重复查询相同域名）
   */
  const {
    data: ensAddress,
    isLoading: isEnsAddressLoading,
    isError: isEnsAddressError,
  } = useEnsAddress({
    name: settledValue,
    chainId: 1, // ENS 只在以太坊主网（chainId: 1）
    query: {
      gcTime: 30_000,
      enabled: isDebouncedValueLive && isENS(debouncedValue),
    },
  });

  /**
   * 记录用户手动输入的 ENS 域名
   * 用途：在解析成功后，仍显示用户输入的原始域名
   * 示例：用户输入 vitalik.eth → 地址显示为 "vitalik.eth | 0xd8dA..."
   */
  const [enteredEnsName, setEnteredEnsName] = useState<string>();

  /**
   * 地址 → ENS 域名反向解析
   * 功能：将 0xd8dA... 反向查询为 vitalik.eth（如果该地址设置了主域名）
   *
   * 查询条件：输入是有效的以太坊地址格式
   * 结果：
   * - ensName: "vitalik.eth" | null（地址未设置 ENS）| undefined（查询中）
   */
  const {
    data: ensName,
    isLoading: isEnsNameLoading,
    isError: isEnsNameError,
  } = useEnsName({
    address: settledValue as Address,
    chainId: 1,
    query: {
      enabled: isAddress(debouncedValue),
      gcTime: 30_000,
    },
  });

  /**
   * 查询 ENS 域名的头像
   * 功能：从 ENS 记录中读取用户设置的头像 URL
   *
   * 查询条件：已成功解析出 ENS 域名
   * 注意：需要使用 normalize() 规范化域名（处理大小写、特殊字符等）
   */
  const { data: ensAvatar, isLoading: isEnsAvatarLoading } = useEnsAvatar({
    name: ensName ? normalize(ensName) : undefined,
    chainId: 1,
    query: {
      enabled: Boolean(ensName),
      gcTime: 30_000,
    },
  });

  /**
   * ENS 域名解析成功后的副作用
   *
   * 执行逻辑：
   * 1. 保存用户输入的原始 ENS 域名（用于前缀显示）
   * 2. 将解析出的地址通过 onChange 回调传递给父组件
   *
   * 示例流程：
   * - 用户输入 "vitalik.eth"
   * - 解析成功：ensAddress = "0xd8dA..."
   * - 执行：setEnteredEnsName("vitalik.eth")
   * - 执行：onChange("0xd8dA...")  ← 父组件获得实际地址
   */
  useEffect(() => {
    if (!ensAddress) return;

    // ENS 解析成功
    setEnteredEnsName(debouncedValue);
    onChange(ensAddress);
  }, [ensAddress, onChange, debouncedValue]);

  /**
   * 清除输入的 ENS 域名记录
   * 触发时机：用户修改输入值时
   * 目的：避免显示过时的 ENS 域名
   */
  useEffect(() => {
    setEnteredEnsName(undefined);
  }, [value]);

  /**
   * 判断是否需要重新聚焦输入框
   *
   * 重新聚焦的情况：
   * - ENS 解析失败（域名不存在）
   * - 反向解析失败
   * - 解析结果为 null（明确的无结果，非查询中）
   *
   * 目的：让用户可以立即修正输入错误
   */
  const reFocus = isEnsAddressError || isEnsNameError || ensName === null || ensAddress === null;

  return (
    <InputBase<Address>
      name={name}
      placeholder={placeholder}
      error={ensAddress === null} // ENS 解析失败时显示红色边框
      value={value as Address}
      onChange={onChange}
      disabled={isEnsAddressLoading || isEnsNameLoading || disabled} // 查询过程中禁用输入
      reFocus={reFocus}
      prefix={
        // 前缀插槽：显示 ENS 信息（头像 + 域名）
        ensName ? (
          // 已解析出 ENS 域名
          <div className="flex bg-base-300 rounded-l-full items-center">
            {/* ENS 头像加载中：显示圆形骨架屏 */}
            {isEnsAvatarLoading && <div className="skeleton bg-base-200 w-[35px] h-[35px] rounded-full shrink-0"></div>}
            {/* ENS 头像加载成功：显示实际头像 */}
            {ensAvatar ? (
              <span className="w-[35px]">
                {
                  // 不使用 Next.js Image 组件，避免需要配置 remote patterns
                  // eslint-disable-next-line
                  <img className="w-full rounded-full" src={ensAvatar} alt={`${ensAddress} avatar`} />
                }
              </span>
            ) : null}
            {/* 显示 ENS 域名：优先显示用户输入的原始域名，否则显示反向解析的域名 */}
            <span className="text-accent px-2">{enteredEnsName ?? ensName}</span>
          </div>
        ) : (
          // ENS 查询中：显示骨架屏（头像 + 文字占位）
          (isEnsNameLoading || isEnsAddressLoading) && (
            <div className="flex bg-base-300 rounded-l-full items-center gap-2 pr-2">
              <div className="skeleton bg-base-200 w-[35px] h-[35px] rounded-full shrink-0"></div>
              <div className="skeleton bg-base-200 h-3 w-20"></div>
            </div>
          )
        )
      }
      suffix={
        /**
         * 后缀插槽：显示 Blockie 头像
         * Blockie：根据地址生成的唯一像素艺术图案（类似 GitHub 默认头像）
         * 使用 blo 库生成（比传统 blockies 库性能更好）
         *
         * 注意：不使用 Next.js Image 组件，因为：
         * 1. blo 生成的是 data URL，不是远程 URL
         * 2. 避免需要在 next.config.js 中配置 remotePatterns
         */
        // eslint-disable-next-line @next/next/no-img-element
        value && <img alt="" className="rounded-full!" src={blo(value as `0x${string}`)} width="35" height="35" />
      }
    />
  );
};
