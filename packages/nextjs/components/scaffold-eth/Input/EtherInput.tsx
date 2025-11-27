/**
 * EtherInput - 以太币金额输入组件（支持 ETH/USD 双币种切换）
 *
 * 核心功能：
 * 1. 双币种显示
 *    - ETH 模式：显示 "Ξ" 符号，输入以太币数量
 *    - USD 模式：显示 "$" 符号，输入美元金额
 * 2. 实时汇率转换
 *    - 根据实时价格自动转换 ETH ↔ USD
 *    - 从全局状态获取价格数据
 * 3. 一键切换按钮
 *    - 点击右侧箭头图标切换显示模式
 *    - 切换时自动转换金额
 * 4. 精度控制
 *    - USD 模式：限制 2 位小数
 *    - ETH 模式：支持 18 位小数（wei 精度）
 *
 * 设计要点：
 * - onChange 回调始终传递 ETH 值（无论当前显示模式）
 * - 使用派生状态避免浮点数转换误差
 * - 处理小数点输入的临时状态（允许输入 "0."）
 *
 * 使用场景：
 * - 智能合约支付金额输入
 * - 转账金额输入
 * - NFT 铸造/购买价格输入
 *
 * @example
 * ```tsx
 * <EtherInput
 *   value={amount}
 *   onChange={setAmount}
 *   placeholder="输入金额"
 *   usdMode={true}  // 默认显示 USD
 * />
 * ```
 */
import { useMemo, useState } from "react";
import { ArrowsRightLeftIcon } from "@heroicons/react/24/outline";
import { CommonInputProps, InputBase, SIGNED_NUMBER_REGEX } from "~~/components/scaffold-eth";
import { useDisplayUsdMode } from "~~/hooks/scaffold-eth/useDisplayUsdMode";
import { useGlobalState } from "~~/services/store/store";

// USD 模式的最大小数位数（美元通常只显示分，即 2 位小数）
const MAX_DECIMALS_USD = 2;

/**
 * 将 ETH 值转换为显示值
 *
 * 转换逻辑：
 * - ETH 模式：直接返回原值（不转换）
 * - USD 模式：ETH 值 × 价格 = USD 值
 *
 * 精度处理：
 * - 使用 Math.round() 而非 toFixed()
 * - 目的：允许用户编辑小数部分（toFixed 会返回字符串，阻止编辑）
 *
 * @param usdMode - 是否为 USD 模式
 * @param etherValue - ETH 值（字符串格式）
 * @param nativeCurrencyPrice - ETH/USD 汇率
 * @returns 显示值（字符串）
 *
 * @example
 * etherValueToDisplayValue(true, "1.5", 2000)
 * // 返回 "3000" (1.5 ETH × 2000 USD/ETH)
 */
function etherValueToDisplayValue(usdMode: boolean, etherValue: string, nativeCurrencyPrice: number) {
  if (usdMode && nativeCurrencyPrice) {
    const parsedEthValue = parseFloat(etherValue);
    if (Number.isNaN(parsedEthValue)) {
      // 无效数字：返回原值（允许中间输入状态，如 "-"）
      return etherValue;
    } else {
      // 转换为 USD：先乘以汇率和精度，再取整，最后除以精度
      // 例如：1.5 ETH × 2000 USD/ETH → 3000.00 → 保留 2 位小数
      return (
        Math.round(parsedEthValue * nativeCurrencyPrice * 10 ** MAX_DECIMALS_USD) /
        10 ** MAX_DECIMALS_USD
      ).toString();
    }
  } else {
    // ETH 模式：不转换
    return etherValue;
  }
}

/**
 * 将显示值转换为 ETH 值
 *
 * 转换逻辑：
 * - ETH 模式：直接返回原值（不转换）
 * - USD 模式：USD 值 ÷ 价格 = ETH 值
 *
 * @param usdMode - 是否为 USD 模式
 * @param displayValue - 显示值（字符串格式）
 * @param nativeCurrencyPrice - ETH/USD 汇率
 * @returns ETH 值（字符串）
 *
 * @example
 * displayValueToEtherValue(true, "3000", 2000)
 * // 返回 "1.5" (3000 USD ÷ 2000 USD/ETH)
 */
function displayValueToEtherValue(usdMode: boolean, displayValue: string, nativeCurrencyPrice: number) {
  if (usdMode && nativeCurrencyPrice) {
    const parsedDisplayValue = parseFloat(displayValue);
    if (Number.isNaN(parsedDisplayValue)) {
      // 无效数字：返回原值（允许中间输入状态）
      return displayValue;
    } else {
      // 转换为 ETH：USD 值除以汇率
      return (parsedDisplayValue / nativeCurrencyPrice).toString();
    }
  } else {
    // ETH 模式：不转换
    return displayValue;
  }
}
/**
 * EtherInput 组件的 Props 类型
 * 扩展自 CommonInputProps，添加 usdMode 选项
 */
type EtherInputProps = CommonInputProps & {
  usdMode?: boolean; // 是否默认使用 USD 模式显示
};

export const EtherInput = ({ value, name, placeholder, onChange, disabled, usdMode }: EtherInputProps) => {
  /**
   * 临时显示值状态
   * 用途：处理小数点输入的中间状态
   * 示例：用户输入 "10." 时，虽然转换回来还是 "10"，但应该保留小数点
   */
  const [transitoryDisplayValue, setTransitoryDisplayValue] = useState<string>();

  /**
   * 从全局状态获取 ETH 价格和加载状态
   * nativeCurrencyPrice: ETH/USD 汇率（如 2000 表示 1 ETH = 2000 USD）
   * isNativeCurrencyPriceFetching: 是否正在获取价格数据
   */
  const nativeCurrencyPrice = useGlobalState(state => state.nativeCurrency.price);
  const isNativeCurrencyPriceFetching = useGlobalState(state => state.nativeCurrency.isFetching);

  /**
   * 显示模式状态管理
   * displayUsdMode: 当前是否为 USD 显示模式
   * toggleDisplayUsdMode: 切换显示模式的函数
   */
  const { displayUsdMode, toggleDisplayUsdMode } = useDisplayUsdMode({ defaultUsdMode: usdMode });

  /**
   * 计算显示值（派生状态）
   *
   * 派生逻辑：
   * 1. 从 ETH 值（外部控制）计算显示值
   * 2. USD 模式：ETH → USD 转换
   * 3. ETH 模式：保持原值
   *
   * 临时值处理：
   * - 如果转换后的值与临时值数值相等，保留临时值
   * - 目的：保留用户输入的格式（如 "10." 或 "10.0"）
   * - 避免：用户输入 "10." → 转换为 "10" → 小数点丢失
   *
   * 依赖项：
   * - nativeCurrencyPrice: 价格变化时重新计算
   * - transitoryDisplayValue: 临时值变化时重新计算
   * - displayUsdMode: 切换模式时重新计算
   * - value: ETH 值变化时重新计算
   */
  const displayValue = useMemo(() => {
    const newDisplayValue = etherValueToDisplayValue(displayUsdMode, value, nativeCurrencyPrice || 0);
    if (transitoryDisplayValue && parseFloat(newDisplayValue) === parseFloat(transitoryDisplayValue)) {
      // 数值相等，保留用户输入的格式
      return transitoryDisplayValue;
    }
    // 清除过时的临时值
    setTransitoryDisplayValue(undefined);
    return newDisplayValue;
  }, [nativeCurrencyPrice, transitoryDisplayValue, displayUsdMode, value]);

  /**
   * 处理输入变化
   *
   * 验证流程：
   * 1. 格式验证：必须符合数字正则（包括负数、小数）
   * 2. 精度验证：USD 模式限制 2 位小数
   * 3. 临时状态处理：保留末尾的小数点或 ".0"
   * 4. 转换并回调：将显示值转换为 ETH 值后调用 onChange
   *
   * 浮点数误差处理：
   * - 问题：USD → ETH → USD 转换可能产生微小误差
   * - 解决：限制 USD 模式的小数位数，避免显示值与输入不一致
   * - 示例：输入 "10.01" → 转换为 ETH → 转回 USD 可能变成 "10.009999"
   */
  const handleChangeNumber = (newValue: string) => {
    // 验证输入格式：必须是有效数字（包括负数、小数）
    if (newValue && !SIGNED_NUMBER_REGEX.test(newValue)) {
      return;
    }

    // USD 模式的小数位数限制
    // 目的：防止浮点数转换误差导致显示值与输入不一致
    if (displayUsdMode) {
      const decimals = newValue.split(".")[1];
      if (decimals && decimals.length > MAX_DECIMALS_USD) {
        return; // 超过 2 位小数，拒绝输入
      }
    }

    // 处理末尾小数点的临时状态
    // 由于 displayValue 是派生状态（从 ETH 值计算），直接输入 "10." 会被转换为 "10"
    // 这里保存临时值，让用户可以继续输入小数部分
    if (newValue.endsWith(".") || newValue.endsWith(".0")) {
      setTransitoryDisplayValue(newValue);
    } else {
      setTransitoryDisplayValue(undefined);
    }

    // 将显示值转换为 ETH 值，并通过回调传递给父组件
    const newEthValue = displayValueToEtherValue(displayUsdMode, newValue, nativeCurrencyPrice || 0);
    onChange(newEthValue);
  };

  return (
    <InputBase
      name={name}
      value={displayValue}
      placeholder={placeholder}
      onChange={handleChangeNumber}
      disabled={disabled}
      prefix={
        // 前缀插槽：显示货币符号
        <span className="pl-4 -mr-2 text-accent self-center">
          {displayUsdMode ? "$" : "Ξ"} {/* USD 模式显示 "$"，ETH 模式显示 "Ξ"（希腊字母 Xi） */}
        </span>
      }
      suffix={
        // 后缀插槽：显示切换按钮
        <div
          className={`${
            nativeCurrencyPrice > 0
              ? ""
              : "tooltip tooltip-secondary before:content-[attr(data-tip)] before:right-[-10px] before:left-auto before:transform-none"
          }`}
          data-tip={isNativeCurrencyPriceFetching ? "Fetching price" : "Unable to fetch price"}
        >
          <button
            className="btn btn-primary h-[2.2rem] min-h-[2.2rem]"
            onClick={toggleDisplayUsdMode}
            disabled={!displayUsdMode && !nativeCurrencyPrice} // ETH 模式且价格未获取时禁用（无法切换到 USD）
            type="button"
          >
            {/* 双向箭头图标：表示切换功能 */}
            <ArrowsRightLeftIcon className="h-3 w-3 cursor-pointer" aria-hidden="true" />
          </button>
        </div>
      }
    />
  );
};
