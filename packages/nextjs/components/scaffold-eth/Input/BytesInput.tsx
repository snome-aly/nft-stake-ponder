/**
 * BytesInput - 字节数组输入组件（支持 Hex/String 格式转换）
 *
 * 核心功能：
 * 1. 双格式支持
 *    - Hex 格式：0x 开头的十六进制字符串（如 0x48656c6c6f）
 *    - String 格式：普通文本字符串（如 "Hello"）
 * 2. 一键转换
 *    - 点击 "#" 按钮在两种格式间切换
 *    - Hex → String: 0x48656c6c6f → "Hello"
 *    - String → Hex: "Hello" → 0x48656c6c6f
 * 3. 自动识别
 *    - 自动检测当前格式（通过 0x 前缀判断）
 *    - 智能选择转换方向
 *
 * 技术实现：
 * - 使用 viem 的 toBytes、bytesToString、toHex 进行转换
 * - isHex 函数检测当前格式
 *
 * 使用场景：
 * - 智能合约 bytes 类型参数输入
 * - 任意长度的字节数据输入
 * - 消息哈希、签名数据输入
 * - 自定义数据编码/解码
 *
 * 与 Bytes32Input 的区别：
 * - BytesInput: 任意长度（bytes）
 * - Bytes32Input: 固定 32 字节（bytes32）
 *
 * @example
 * ```tsx
 * <BytesInput
 *   value={data}
 *   onChange={setData}
 *   placeholder="输入字节数据或文本"
 * />
 * // 用户输入 "Hello" → 点击 # → 变成 "0x48656c6c6f"
 * // 用户输入 "0x1234" → 点击 # → 变成对应的文本
 * ```
 */
import { useCallback } from "react";
import { bytesToString, isHex, toBytes, toHex } from "viem";
import { CommonInputProps, InputBase } from "~~/components/scaffold-eth";

export const BytesInput = ({ value, onChange, name, placeholder, disabled }: CommonInputProps) => {
  /**
   * 字节格式转换函数
   *
   * 转换逻辑：
   * 1. 检测当前格式（isHex 判断是否为 0x 开头）
   * 2. Hex → String: 使用 bytesToString(toBytes(hex))
   * 3. String → Hex: 使用 toHex(toBytes(string))
   *
   * 转换示例：
   * - "0x48656c6c6f" → "Hello"
   * - "Hello" → "0x48656c6c6f"
   * - "0x1234" → 解码为对应字符
   *
   * 注意：
   * - toBytes: 将 hex 或 string 转换为字节数组
   * - bytesToString: 将字节数组转换为 UTF-8 字符串
   * - toHex: 将字节数组转换为十六进制字符串
   */
  const convertStringToBytes = useCallback(() => {
    onChange(isHex(value) ? bytesToString(toBytes(value)) : toHex(toBytes(value)));
  }, [onChange, value]);

  return (
    <InputBase
      name={name}
      value={value}
      placeholder={placeholder}
      onChange={onChange}
      disabled={disabled}
      suffix={
        // 后缀插槽：格式转换按钮
        <button
          className="self-center cursor-pointer text-xl font-semibold px-4 text-accent"
          onClick={convertStringToBytes}
          type="button"
        >
          # {/* 井号符号：表示十六进制（hex）转换 */}
        </button>
      }
    />
  );
};
