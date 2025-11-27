/**
 * ============================================
 * 通知系统组件
 * ============================================
 *
 * 📌 核心功能：
 * 基于 react-hot-toast 的自定义通知组件
 * 提供统一的 UI 样式和多种通知类型
 *
 * 🎯 主要用途：
 * - 显示成功、错误、警告、信息、加载状态
 * - 提供一致的用户反馈体验
 * - 支持自定义位置、持续时间和图标
 *
 * 💡 通知类型：
 * - success - 成功通知（绿色勾选图标）
 * - error - 错误通知（红色感叹号图标）
 * - warning - 警告通知（黄色三角图标）
 * - info - 信息通知（蓝色信息图标）
 * - loading - 加载通知（旋转图标，无限持续）
 */
import React from "react";
import { Toast, ToastPosition, toast } from "react-hot-toast";
import { XMarkIcon } from "@heroicons/react/20/solid";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/solid";

/**
 * 通知组件的 Props 类型
 */
type NotificationProps = {
  content: React.ReactNode; // 通知内容（支持 JSX）
  status: "success" | "info" | "loading" | "error" | "warning"; // 通知状态
  duration?: number; // 持续时间（毫秒）
  icon?: string; // 自定义图标（覆盖默认图标）
  position?: ToastPosition; // 显示位置
};

/**
 * 通知选项类型（用于简化 API 调用）
 */
type NotificationOptions = {
  duration?: number; // 持续时间（可选）
  icon?: string; // 自定义图标（可选）
  position?: ToastPosition; // 显示位置（可选）
};

/**
 * 通知状态图标映射
 * 为每种状态定义默认图标
 */
const ENUM_STATUSES = {
  success: <CheckCircleIcon className="w-7 text-success" />, // 成功：绿色勾选
  loading: <span className="w-6 loading loading-spinner"></span>, // 加载：旋转图标
  error: <ExclamationCircleIcon className="w-7 text-error" />, // 错误：红色感叹号
  info: <InformationCircleIcon className="w-7 text-info" />, // 信息：蓝色信息
  warning: <ExclamationTriangleIcon className="w-7 text-warning" />, // 警告：黄色三角
};

// 默认持续时间：3 秒
const DEFAULT_DURATION = 3000;

// 默认位置：顶部居中
const DEFAULT_POSITION: ToastPosition = "top-center";

/**
 * 自定义通知组件
 *
 * @param content - 通知内容
 * @param status - 通知状态
 * @param duration - 持续时间（默认 3000ms）
 * @param icon - 自定义图标（可选）
 * @param position - 显示位置（默认 top-center）
 * @returns toast ID（用于手动关闭通知）
 *
 * 📌 UI 特性：
 * 1. 渐入渐出动画
 * 2. 响应式布局（最大宽度 sm）
 * 3. 悬停效果（上下移动）
 * 4. 手动关闭按钮
 * 5. 自动换行和滚动
 *
 * 🎨 样式：
 * - 圆角卡片（rounded-xl）
 * - 阴影效果（shadow-center shadow-accent）
 * - 深色背景（bg-base-200）
 * - 响应式间距
 *
 * 🔧 动画逻辑：
 * - 顶部位置：从上滑入，悬停时下移
 * - 底部位置：从下滑入，悬停时上移
 */
const Notification = ({
  content,
  status,
  duration = DEFAULT_DURATION,
  icon,
  position = DEFAULT_POSITION,
}: NotificationProps) => {
  return toast.custom(
    (t: Toast) => (
      <div
        className={`flex flex-row items-start justify-between max-w-sm rounded-xl shadow-center shadow-accent bg-base-200 p-4 transform-gpu relative transition-all duration-500 ease-in-out space-x-2
        ${
          // 根据位置设置动画方向
          position.substring(0, 3) == "top"
            ? `hover:translate-y-1 ${t.visible ? "top-0" : "-top-96"}` // 顶部：向下移动
            : `hover:-translate-y-1 ${t.visible ? "bottom-0" : "-bottom-96"}` // 底部：向上移动
        }`}
      >
        {/* 图标区域 */}
        <div className="leading-[0] self-center">{icon ? icon : ENUM_STATUSES[status]}</div>

        {/* 内容区域 */}
        <div className={`overflow-x-hidden break-words whitespace-pre-line ${icon ? "mt-1" : ""}`}>{content}</div>

        {/* 关闭按钮 */}
        <div className={`cursor-pointer text-lg ${icon ? "mt-1" : ""}`} onClick={() => toast.dismiss(t.id)}>
          <XMarkIcon className="w-6 cursor-pointer" onClick={() => toast.remove(t.id)} />
        </div>
      </div>
    ),
    {
      // 加载状态：无限持续；其他状态：使用指定的持续时间
      duration: status === "loading" ? Infinity : duration,
      position,
    },
  );
};

/**
 * 通知 API 对象
 * 提供便捷的方法来显示不同类型的通知
 *
 * 💡 使用方法：
 * ```typescript
 * import { notification } from "~~/utils/scaffold-eth";
 *
 * // 成功通知
 * notification.success("交易成功！");
 *
 * // 错误通知（自定义持续时间）
 * notification.error("交易失败", { duration: 5000 });
 *
 * // 加载通知（保存 ID 用于后续关闭）
 * const toastId = notification.loading("处理中...");
 * // 稍后关闭
 * notification.remove(toastId);
 *
 * // 信息通知（自定义位置）
 * notification.info("新消息", { position: "bottom-right" });
 *
 * // 警告通知
 * notification.warning("请注意：余额不足");
 * ```
 *
 * 🔧 API 方法：
 * - success(content, options?) - 显示成功通知
 * - error(content, options?) - 显示错误通知
 * - warning(content, options?) - 显示警告通知
 * - info(content, options?) - 显示信息通知
 * - loading(content, options?) - 显示加载通知（无限持续）
 * - remove(toastId) - 手动关闭指定通知
 */
export const notification = {
  /**
   * 成功通知
   * @param content - 通知内容
   * @param options - 可选配置（duration, icon, position）
   * @returns toast ID
   */
  success: (content: React.ReactNode, options?: NotificationOptions) => {
    return Notification({ content, status: "success", ...options });
  },

  /**
   * 信息通知
   * @param content - 通知内容
   * @param options - 可选配置
   * @returns toast ID
   */
  info: (content: React.ReactNode, options?: NotificationOptions) => {
    return Notification({ content, status: "info", ...options });
  },

  /**
   * 警告通知
   * @param content - 通知内容
   * @param options - 可选配置
   * @returns toast ID
   */
  warning: (content: React.ReactNode, options?: NotificationOptions) => {
    return Notification({ content, status: "warning", ...options });
  },

  /**
   * 错误通知
   * @param content - 通知内容
   * @param options - 可选配置
   * @returns toast ID
   */
  error: (content: React.ReactNode, options?: NotificationOptions) => {
    return Notification({ content, status: "error", ...options });
  },

  /**
   * 加载通知（无限持续，直到手动关闭）
   * @param content - 通知内容
   * @param options - 可选配置
   * @returns toast ID（用于后续关闭）
   */
  loading: (content: React.ReactNode, options?: NotificationOptions) => {
    return Notification({ content, status: "loading", ...options });
  },

  /**
   * 手动关闭通知
   * @param toastId - 通知 ID（由 success/error/loading 等方法返回）
   */
  remove: (toastId: string) => {
    toast.remove(toastId);
  },
};
