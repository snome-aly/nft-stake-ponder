import { useRef } from "react";
import { rainbowkitBurnerWallet } from "burner-connector";
import { ShieldExclamationIcon } from "@heroicons/react/24/outline";
import { useCopyToClipboard } from "~~/hooks/scaffold-eth";
import { getParsedError, notification } from "~~/utils/scaffold-eth";

// Burner 钱包私钥在浏览器存储中的键名
const BURNER_WALLET_PK_KEY = "burnerWallet.pk";

/**
 * RevealBurnerPKModal - 查看 Burner 钱包私钥弹窗组件
 *
 * 核心功能：
 * 1. 显示 Burner 钱包私钥（仅限开发环境使用的临时钱包）
 * 2. 提供一键复制私钥到剪贴板功能
 * 3. 显示安全警告：Burner 钱包不应存储真实资金
 * 4. 从浏览器存储（localStorage 或 sessionStorage）读取私钥
 *
 * Burner 钱包说明：
 * - 用于本地开发和测试，无需安装 MetaMask
 * - 私钥临时存储在浏览器中，清除缓存后丢失
 * - 不应在生产环境或存储真实资金
 *
 * 安全提示：
 * - 私钥提供对钱包的完全访问权限
 * - 切勿将 Burner 钱包私钥用于主网或真实资金
 * - 仅用于开发测试
 */
export const RevealBurnerPKModal = () => {
  // ==================== Hooks ====================
  const { copyToClipboard, isCopiedToClipboard } = useCopyToClipboard();
  const modalCheckboxRef = useRef<HTMLInputElement>(null); // 弹窗 checkbox 引用

  /**
   * 处理复制私钥操作
   * 从浏览器存储中读取私钥并复制到剪贴板
   */
  const handleCopyPK = async () => {
    try {
      // 根据配置选择 sessionStorage 或 localStorage
      const storage = rainbowkitBurnerWallet.useSessionStorage ? sessionStorage : localStorage;
      // 读取私钥
      const burnerPK = storage?.getItem(BURNER_WALLET_PK_KEY);

      // 检查私钥是否存在
      if (!burnerPK) throw new Error("Burner wallet private key not found");

      // 复制到剪贴板
      await copyToClipboard(burnerPK);
      notification.success("Burner wallet private key copied to clipboard");
    } catch (e) {
      // 捕获错误并显示通知
      const parsedError = getParsedError(e);
      notification.error(parsedError);
      // 出错时关闭弹窗
      if (modalCheckboxRef.current) modalCheckboxRef.current.checked = false;
    }
  };

  return (
    <>
      <div>
        {/* 隐藏的 checkbox，控制弹窗开关状态 */}
        <input type="checkbox" id="reveal-burner-pk-modal" className="modal-toggle" ref={modalCheckboxRef} />

        {/* 弹窗背景遮罩（点击可关闭） */}
        <label htmlFor="reveal-burner-pk-modal" className="modal cursor-pointer">
          {/* 弹窗内容区域 */}
          <label className="modal-box relative">
            {/* 哑输入框：捕获点击事件，防止点击内容区域时关闭弹窗 */}
            <input className="h-0 w-0 absolute top-0 left-0" />

            {/* 右上角关闭按钮 */}
            <label htmlFor="reveal-burner-pk-modal" className="btn btn-ghost btn-sm btn-circle absolute right-3 top-3">
              ✕
            </label>

            {/* ==================== 弹窗主体内容 ==================== */}
            <div>
              {/* 标题 */}
              <p className="text-lg font-semibold m-0 p-0">Copy Burner Wallet Private Key</p>

              {/* 警告提示框 */}
              <div role="alert" className="alert alert-warning mt-4">
                <ShieldExclamationIcon className="h-6 w-6" />
                <span className="font-semibold">
                  Burner wallets are intended for local development only and are not safe for storing real funds.
                </span>
              </div>

              {/* 私钥说明文本 */}
              <p>
                Your Private Key provides <strong>full access</strong> to your entire wallet and funds. This is
                currently stored <strong>temporarily</strong> in your browser.
              </p>

              {/* 复制私钥按钮 */}
              <button
                className="btn btn-outline btn-error"
                onClick={handleCopyPK}
                disabled={isCopiedToClipboard} // 已复制时禁用按钮
              >
                Copy Private Key To Clipboard
              </button>
            </div>
          </label>
        </label>
      </div>
    </>
  );
};
