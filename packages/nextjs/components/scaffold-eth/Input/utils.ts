/**
 * 输入组件通用 Props 类型
 * 用于所有输入组件的基础属性定义
 */
export type CommonInputProps<T = string> = {
  value: T; // 输入值（可以是任意类型）
  onChange: (newValue: T) => void; // 值变化回调函数
  name?: string; // 输入框的 name 属性
  placeholder?: string; // 占位符文本
  disabled?: boolean; // 是否禁用
};

/**
 * 整数类型枚举
 * 涵盖 Solidity 中所有的整数类型（uint8 到 uint256，int8 到 int256）
 * 每种类型对应不同的位数和取值范围
 */
export enum IntegerVariant {
  UINT8 = "uint8",
  UINT16 = "uint16",
  UINT24 = "uint24",
  UINT32 = "uint32",
  UINT40 = "uint40",
  UINT48 = "uint48",
  UINT56 = "uint56",
  UINT64 = "uint64",
  UINT72 = "uint72",
  UINT80 = "uint80",
  UINT88 = "uint88",
  UINT96 = "uint96",
  UINT104 = "uint104",
  UINT112 = "uint112",
  UINT120 = "uint120",
  UINT128 = "uint128",
  UINT136 = "uint136",
  UINT144 = "uint144",
  UINT152 = "uint152",
  UINT160 = "uint160",
  UINT168 = "uint168",
  UINT176 = "uint176",
  UINT184 = "uint184",
  UINT192 = "uint192",
  UINT200 = "uint200",
  UINT208 = "uint208",
  UINT216 = "uint216",
  UINT224 = "uint224",
  UINT232 = "uint232",
  UINT240 = "uint240",
  UINT248 = "uint248",
  UINT256 = "uint256",
  INT8 = "int8",
  INT16 = "int16",
  INT24 = "int24",
  INT32 = "int32",
  INT40 = "int40",
  INT48 = "int48",
  INT56 = "int56",
  INT64 = "int64",
  INT72 = "int72",
  INT80 = "int80",
  INT88 = "int88",
  INT96 = "int96",
  INT104 = "int104",
  INT112 = "int112",
  INT120 = "int120",
  INT128 = "int128",
  INT136 = "int136",
  INT144 = "int144",
  INT152 = "int152",
  INT160 = "int160",
  INT168 = "int168",
  INT176 = "int176",
  INT184 = "int184",
  INT192 = "int192",
  INT200 = "int200",
  INT208 = "int208",
  INT216 = "int216",
  INT224 = "int224",
  INT232 = "int232",
  INT240 = "int240",
  INT248 = "int248",
  INT256 = "int256",
}

/**
 * 有符号数字正则表达式
 * 匹配格式：可选的负号 + 整数部分 + 可选的小数点和小数部分
 * 示例：-123, 123.45, -0.5
 */
export const SIGNED_NUMBER_REGEX = /^-?\d+\.?\d*$/;

/**
 * 无符号数字正则表达式
 * 匹配格式：可选的小数点开头 + 整数部分 + 可选的小数点和小数部分
 * 示例：123, 123.45, .5
 */
export const UNSIGNED_NUMBER_REGEX = /^\.?\d+\.?\d*$/;

/**
 * 验证整数值是否符合指定的 Solidity 整数类型
 *
 * 功能：
 * 1. 检查值是否为有效数字格式
 * 2. 检查值是否在指定类型的取值范围内
 * 3. 处理有符号和无符号整数的不同规则
 *
 * 算法：
 * - 将值转换为 BigInt 进行精确计算
 * - 通过十六进制位数判断是否超出类型范围
 * - 有符号数需要额外检查符号位
 *
 * @param dataType - 整数类型（如 uint256, int128）
 * @param value - 要验证的值（字符串格式）
 * @returns 是否有效
 *
 * @example
 * isValidInteger(IntegerVariant.UINT8, "255")   // true
 * isValidInteger(IntegerVariant.UINT8, "256")   // false（超出范围）
 * isValidInteger(IntegerVariant.INT8, "-128")   // true
 * isValidInteger(IntegerVariant.UINT8, "-1")    // false（无符号数不能为负）
 */
export const isValidInteger = (dataType: IntegerVariant, value: string) => {
  // 判断是否为有符号类型（以 'i' 开头）
  const isSigned = dataType.startsWith("i");
  // 提取位数：int8 -> 8, uint256 -> 256
  const bitcount = Number(dataType.substring(isSigned ? 3 : 4));

  // 尝试将值转换为 BigInt
  let valueAsBigInt;
  try {
    valueAsBigInt = BigInt(value);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {}

  // 如果无法转换为 BigInt
  if (typeof valueAsBigInt !== "bigint") {
    // 空值或非字符串：视为有效（允许中间输入状态）
    if (!value || typeof value !== "string") {
      return true;
    }
    // 检查格式是否符合正则表达式
    // 有符号数：允许 '-' 单独出现（输入中间状态）
    return isSigned ? SIGNED_NUMBER_REGEX.test(value) || value === "-" : UNSIGNED_NUMBER_REGEX.test(value);
  } else if (!isSigned && valueAsBigInt < 0) {
    // 无符号数不能为负
    return false;
  }

  // 转换为十六进制检查位数
  const hexString = valueAsBigInt.toString(16);
  // 移除前导零，获取有效的十六进制位
  const significantHexDigits = hexString.match(/.*x0*(.*)$/)?.[1] ?? "";

  // 检查是否超出位数范围
  // 每个十六进制位代表 4 个二进制位
  if (
    significantHexDigits.length * 4 > bitcount ||
    // 有符号数的特殊情况：最高位用于符号位
    // 如果占满所有位且最高位小于 8（二进制 1000），则最高位是 0，不会溢出
    (isSigned && significantHexDigits.length * 4 === bitcount && parseInt(significantHexDigits.slice(-1)?.[0], 16) < 8)
  ) {
    return false;
  }

  return true;
};

/**
 * ENS 域名正则表达式
 * 匹配包含至少一个点的字符串（如 vitalik.eth）
 */
const ensRegex = /.+\..+/;

/**
 * 判断字符串是否为 ENS 域名格式
 *
 * @param address - 要检查的字符串
 * @returns 是否为 ENS 格式
 *
 * @example
 * isENS("vitalik.eth")     // true
 * isENS("test.domain.eth") // true
 * isENS("0x1234...")       // false
 */
export const isENS = (address = "") => ensRegex.test(address);
