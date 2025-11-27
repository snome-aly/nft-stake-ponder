import { ChangeEvent, FocusEvent, ReactNode, useCallback, useEffect, useRef } from "react";
import { CommonInputProps } from "~~/components/scaffold-eth";

/**
 * InputBase 组件的 Props 类型
 * 继承 CommonInputProps 并添加额外的功能
 */
type InputBaseProps<T> = CommonInputProps<T> & {
  error?: boolean; // 是否显示错误状态（红色边框）
  prefix?: ReactNode; // 前缀内容（显示在输入框左侧）
  suffix?: ReactNode; // 后缀内容（显示在输入框右侧）
  reFocus?: boolean; // 是否重新获取焦点（用于将光标移到末尾）
};

/**
 * InputBase 基础输入组件
 *
 * 这是所有输入组件的基础组件，提供：
 * - 统一的样式（圆角边框、背景色）
 * - 错误和禁用状态的视觉反馈
 * - 前缀和后缀插槽（如图标、按钮）
 * - 自动聚焦功能（将光标移到输入末尾）
 *
 * 使用场景：
 * - AddressInput: 前缀显示 Blockie 头像
 * - EtherInput: 后缀显示 ETH/USD 切换按钮
 * - IntegerInput: 纯文本输入
 *
 * @example
 * <InputBase
 *   value="0x1234..."
 *   onChange={setValue}
 *   prefix={<Avatar />}
 *   suffix={<CopyButton />}
 * />
 */
export const InputBase = <T extends { toString: () => string } | undefined = string>({
  name,
  value,
  onChange,
  placeholder,
  error,
  disabled,
  prefix,
  suffix,
  reFocus,
}: InputBaseProps<T>) => {
  // 输入框 ref，用于程序化聚焦
  const inputReft = useRef<HTMLInputElement>(null);

  // 根据状态计算样式修饰符
  let modifier = "";
  if (error) {
    // 错误状态：红色边框
    modifier = "border-error";
  } else if (disabled) {
    // 禁用状态：灰色边框和背景
    modifier = "border-disabled bg-base-300";
  }

  // 处理输入变化
  // 使用 useCallback 避免不必要的重新渲染
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      // 将字符串转换为泛型类型 T（类型断言）
      onChange(e.target.value as unknown as T);
    },
    [onChange],
  );

  /**
   * 聚焦时的处理函数
   * 功能：将光标移动到输入框末尾
   * 用途：在 AddressInput 中，ENS 解析后自动将光标移到末尾，方便用户继续编辑
   */
  const onFocus = (e: FocusEvent<HTMLInputElement, Element>) => {
    if (reFocus !== undefined) {
      // setSelectionRange 设置文本选区：两个参数相同表示只是移动光标（不选中文本）
      e.currentTarget.setSelectionRange(e.currentTarget.value.length, e.currentTarget.value.length);
    }
  };

  // 监听 reFocus 属性变化，自动聚焦
  useEffect(() => {
    if (reFocus !== undefined && reFocus === true) inputReft.current?.focus();
  }, [reFocus]);

  return (
    // 外层容器：圆角边框、flex 布局
    <div className={`flex border-2 border-base-300 bg-base-200 rounded-full text-accent ${modifier}`}>
      {/* 前缀插槽 */}
      {prefix}

      {/* 主输入框 */}
      <input
        className="input input-ghost focus-within:border-transparent focus:outline-hidden focus:bg-transparent h-[2.2rem] min-h-[2.2rem] px-4 border w-full font-medium placeholder:text-accent/70 text-base-content/70 focus:text-base-content/70"
        placeholder={placeholder}
        name={name}
        value={value?.toString()} // 将任意类型转换为字符串显示
        onChange={handleChange}
        disabled={disabled}
        autoComplete="off" // 禁用浏览器自动完成（避免干扰地址输入）
        ref={inputReft}
        onFocus={onFocus}
      />

      {/* 后缀插槽 */}
      {suffix}
    </div>
  );
};
