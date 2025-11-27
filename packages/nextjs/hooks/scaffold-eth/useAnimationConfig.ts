import { useEffect, useState } from "react";

/**
 * 动画持续时间（毫秒）
 * 当数据变化时，动画会持续显示 2 秒
 */
const ANIMATION_TIME = 2000;

/**
 * 动画配置 Hook
 *
 * 该 Hook 用于在数据变化时触发动画效果
 * 主要用于 UI 元素在数据更新时提供视觉反馈
 *
 * @param data - 需要监听变化的数据，可以是任意类型
 * @returns {Object} 返回包含动画状态的对象
 * @returns {boolean} showAnimation - 是否显示动画，true 时显示动画效果
 *
 * @example
 * ```tsx
 * const { showAnimation } = useAnimationConfig(balance);
 *
 * return (
 *   <div className={showAnimation ? "animate-pulse" : ""}>
 *     余额: {balance}
 *   </div>
 * );
 * ```
 */
export function useAnimationConfig(data: any) {
  // 控制是否显示动画的状态
  const [showAnimation, setShowAnimation] = useState(false);
  // 保存上一次的数据，用于比较是否发生变化
  const [prevData, setPrevData] = useState();

  useEffect(() => {
    // 只有在数据已经初始化（prevData !== undefined）且数据发生变化时才触发动画
    if (prevData !== undefined && prevData !== data) {
      // 开启动画
      setShowAnimation(true);
      // 在指定时间后自动关闭动画
      setTimeout(() => setShowAnimation(false), ANIMATION_TIME);
    }
    // 更新保存的数据，用于下次比较
    setPrevData(data);
  }, [data, prevData]);

  return {
    showAnimation,
  };
}
