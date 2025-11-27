/**
 * IntegerInput - 整数输入组件（支持 Solidity 整数类型验证）
 *
 * 核心功能：
 * 1. 类型范围验证
 *    - 支持所有 Solidity 整数类型（uint8 到 uint256，int8 到 int256）
 *    - 实时验证输入是否超出类型范围
 *    - 自动显示错误状态（红色边框）
 * 2. Wei 转换快捷按钮
 *    - 点击 "∗" 按钮一键乘以 1e18
 *    - 用于快速将 ETH 单位转换为 Wei
 *    - 可通过 disableMultiplyBy1e18 禁用
 * 3. 符号支持
 *    - 无符号类型（uint*）：只允许正数
 *    - 有符号类型（int*）：允许负数
 *
 * 验证原理：
 * - 使用 BigInt 进行精确计算（避免 Number 的精度问题）
 * - 通过十六进制位数判断是否超出范围
 * - 详见 utils.ts 中的 isValidInteger 函数
 *
 * 使用场景：
 * - 智能合约整数参数输入（如 tokenId、amount）
 * - 数量输入（如 NFT 数量、投票权重）
 * - 时间戳输入
 *
 * @example
 * ```tsx
 * // uint256 输入（默认）
 * <IntegerInput
 *   value={tokenId}
 *   onChange={setTokenId}
 *   placeholder="输入 Token ID"
 * />
 *
 * // uint8 输入（范围 0-255）
 * <IntegerInput
 *   value={level}
 *   onChange={setLevel}
 *   variant={IntegerVariant.UINT8}
 *   disableMultiplyBy1e18={true}  // 禁用 Wei 转换按钮
 * />
 *
 * // int256 输入（支持负数）
 * <IntegerInput
 *   value={delta}
 *   onChange={setDelta}
 *   variant={IntegerVariant.INT256}
 * />
 * ```
 */
import { useCallback, useEffect, useState } from "react";
import { parseEther } from "viem";
import { CommonInputProps, InputBase, IntegerVariant, isValidInteger } from "~~/components/scaffold-eth";

/**
 * IntegerInput 组件的 Props 类型
 */
type IntegerInputProps = CommonInputProps<string> & {
  variant?: IntegerVariant; // 整数类型（默认 uint256）
  disableMultiplyBy1e18?: boolean; // 是否禁用 Wei 转换按钮（默认启用）
};

export const IntegerInput = ({
  value,
  onChange,
  name,
  placeholder,
  disabled,
  variant = IntegerVariant.UINT256, // 默认使用 uint256（Solidity 最常用的类型）
  disableMultiplyBy1e18 = false,
}: IntegerInputProps) => {
  /**
   * 输入错误状态
   * true: 输入值超出当前整数类型的范围
   * false: 输入值有效
   */
  const [inputError, setInputError] = useState(false);

  /**
   * Wei 转换函数
   * 功能：将当前值乘以 1e18（1 ETH = 1e18 Wei）
   *
   * 使用场景：
   * - 输入 "1" → 点击按钮 → 变成 "1000000000000000000"
   * - 方便在 Solidity 中处理 ETH 金额（合约中通常使用 Wei）
   *
   * 注意：使用 parseEther（viem 提供）确保精确转换
   */
  const multiplyBy1e18 = useCallback(() => {
    if (!value) {
      return; // 空值不处理
    }
    return onChange(parseEther(value).toString());
  }, [onChange, value]);

  /**
   * 监听值变化，实时验证输入是否有效
   *
   * 验证逻辑：
   * 1. 调用 isValidInteger 检查值是否在类型范围内
   * 2. 更新错误状态（触发视觉反馈：红色边框）
   *
   * 验证示例（variant = UINT8）：
   * - "255" → 有效（uint8 最大值）
   * - "256" → 无效（超出范围）
   * - "-1"  → 无效（无符号数不能为负）
   *
   * 验证示例（variant = INT8）：
   * - "127"  → 有效（int8 最大值）
   * - "-128" → 有效（int8 最小值）
   * - "128"  → 无效（超出范围）
   */
  useEffect(() => {
    if (isValidInteger(variant, value)) {
      setInputError(false);
    } else {
      setInputError(true);
    }
  }, [value, variant]);

  return (
    <InputBase
      name={name}
      value={value}
      placeholder={placeholder}
      error={inputError} // 传递错误状态给 InputBase（显示红色边框）
      onChange={onChange}
      disabled={disabled}
      suffix={
        // 后缀插槽：Wei 转换按钮
        // 显示条件：输入有效 且 未禁用该功能
        !inputError &&
        !disableMultiplyBy1e18 && (
          <div
            className="space-x-4 flex tooltip tooltip-top tooltip-secondary before:content-[attr(data-tip)] before:right-[-10px] before:left-auto before:transform-none"
            data-tip="Multiply by 1e18 (wei)" // 提示文本
          >
            <button
              className={`${disabled ? "cursor-not-allowed" : "cursor-pointer"} font-semibold px-4 text-accent`}
              onClick={multiplyBy1e18}
              disabled={disabled}
              type="button"
            >
              ∗ {/* 乘号符号（Unicode U+2217） */}
            </button>
          </div>
        )
      }
    />
  );
};
