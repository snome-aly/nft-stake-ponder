/**
 * Bytes32Input - 固定 32 字节输入组件（支持 Hex/String 格式转换）
 *
 * 核心功能：
 * 1. 固定长度约束
 *    - 强制转换为 32 字节（bytes32）
 *    - 不足 32 字节：自动右填充零（右对齐）
 *    - 超过 32 字节：截断或报错（取决于 viem 实现）
 * 2. 双格式转换
 *    - Hex → String: 0x... → 解码为文本（去除填充零）
 *    - String → Hex: "text" → 编码为 32 字节 hex（右填充零）
 * 3. 一键转换
 *    - 点击 "#" 按钮在两种格式间切换
 *    - 自动识别当前格式（通过 0x 前缀）
 *
 * 技术实现：
 * - 使用 viem 的 hexToString 和 stringToHex
 * - { size: 32 } 参数强制 32 字节长度
 *
 * 使用场景：
 * - Solidity bytes32 类型参数输入
 * - 哈希值输入（如 Merkle root、transaction hash）
 * - 固定长度标识符（如 role、domain separator）
 * - IPFS CID（v0 格式，46 字符）
 *
 * 与 BytesInput 的区别：
 * - BytesInput: 任意长度（bytes）
 * - Bytes32Input: 固定 32 字节（bytes32）
 *
 * 转换示例：
 * - String → Hex:
 *   输入 "Hello"
 *   → 0x48656c6c6f000000000000000000000000000000000000000000000000000000
 *   （"Hello" 的 UTF-8 编码 + 零填充到 32 字节）
 *
 * - Hex → String:
 *   输入 0x48656c6c6f000000000000000000000000000000000000000000000000000000
 *   → "Hello"
 *   （去除末尾的零字节，解码为文本）
 *
 * @example
 * ```tsx
 * <Bytes32Input
 *   value={roleHash}
 *   onChange={setRoleHash}
 *   placeholder="输入角色名称或 bytes32 哈希"
 * />
 * // 用户输入 "ADMIN" → 点击 # → 变成 "0x41444d494e00...00"（32字节）
 * ```
 */
import { useCallback } from "react";
import { hexToString, isHex, stringToHex } from "viem";
import { CommonInputProps, InputBase } from "~~/components/scaffold-eth";

export const Bytes32Input = ({ value, onChange, name, placeholder, disabled }: CommonInputProps) => {
  /**
   * Bytes32 格式转换函数
   *
   * 转换逻辑：
   * 1. 检测当前格式（isHex 判断是否为 0x 开头）
   * 2. Hex → String: 使用 hexToString(value, { size: 32 })
   *    - 将 32 字节 hex 解码为 UTF-8 字符串
   *    - 自动去除末尾的零字节填充
   * 3. String → Hex: 使用 stringToHex(value, { size: 32 })
   *    - 将字符串编码为 UTF-8
   *    - 右填充零字节到 32 字节
   *
   * 转换示例：
   * - "0x41444d494e00...00" → "ADMIN"
   * - "ADMIN" → "0x41444d494e00...00"（32 字节）
   *
   * 注意：
   * - { size: 32 } 参数确保结果始终是 32 字节
   * - hexToString 会自动去除尾部的零字节
   * - stringToHex 会自动填充零字节到指定长度
   */
  const convertStringToBytes32 = useCallback(() => {
    if (!value) {
      return; // 空值不处理
    }
    onChange(isHex(value) ? hexToString(value, { size: 32 }) : stringToHex(value, { size: 32 }));
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
          onClick={convertStringToBytes32}
          type="button"
        >
          # {/* 井号符号：表示十六进制（hex）转换 */}
        </button>
      }
    />
  );
};
