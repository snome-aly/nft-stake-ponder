import { useState } from "react";

/**
 * 复制到剪贴板 Hook
 *
 * 该 Hook 提供将文本复制到系统剪贴板的功能
 * 并在复制后短暂显示复制成功的状态（800ms）
 *
 * @returns {Object} 返回包含复制函数和状态的对象
 * @returns {Function} copyToClipboard - 复制文本到剪贴板的异步函数
 * @returns {boolean} isCopiedToClipboard - 是否刚刚复制成功，用于显示复制成功的提示
 *
 * @example
 * ```tsx
 * const { copyToClipboard, isCopiedToClipboard } = useCopyToClipboard();
 *
 * return (
 *   <button onClick={() => copyToClipboard("0x1234...5678")}>
 *     {isCopiedToClipboard ? "已复制!" : "复制地址"}
 *   </button>
 * );
 * ```
 */
export const useCopyToClipboard = () => {
  // 跟踪复制状态，用于显示"已复制"提示
  const [isCopiedToClipboard, setIsCopiedToClipboard] = useState(false);

  /**
   * 复制文本到剪贴板
   *
   * @param text - 要复制的文本内容
   */
  const copyToClipboard = async (text: string) => {
    try {
      // 使用浏览器原生 Clipboard API 复制文本
      await navigator.clipboard.writeText(text);
      // 设置复制成功状态
      setIsCopiedToClipboard(true);
      // 800ms 后自动重置状态，隐藏"已复制"提示
      setTimeout(() => {
        setIsCopiedToClipboard(false);
      }, 800);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  return { copyToClipboard, isCopiedToClipboard };
};
