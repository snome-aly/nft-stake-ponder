import { CheckCircleIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import { useCopyToClipboard } from "~~/hooks/scaffold-eth/useCopyToClipboard";

/**
 * 地址复制图标按钮组件
 *
 * 功能：
 * - 点击图标将地址复制到剪贴板
 * - 复制成功后短暂显示对勾图标作为反馈
 * - 阻止事件冒泡，避免触发父元素的点击事件
 *
 * @param className - 自定义 CSS 类名，用于控制图标大小和样式
 * @param address - 要复制的以太坊地址
 */
export const AddressCopyIcon = ({ className, address }: { className?: string; address: string }) => {
  // 使用自定义 hook 获取复制功能和状态
  const { copyToClipboard: copyAddressToClipboard, isCopiedToClipboard: isAddressCopiedToClipboard } =
    useCopyToClipboard();

  return (
    <button
      onClick={e => {
        // 阻止事件冒泡，防止触发父元素（如链接）的点击事件
        e.stopPropagation();
        // 复制地址到剪贴板
        copyAddressToClipboard(address);
      }}
      type="button"
    >
      {/* 根据复制状态显示不同图标 */}
      {isAddressCopiedToClipboard ? (
        // 复制成功：显示对勾图标
        <CheckCircleIcon className={className} aria-hidden="true" />
      ) : (
        // 未复制或复制状态已重置：显示文档复制图标
        <DocumentDuplicateIcon className={className} aria-hidden="true" />
      )}
    </button>
  );
};
