import { useRef, useState } from "react";
import { NetworkOptions } from "./NetworkOptions";
import { getAddress } from "viem";
import { Address } from "viem";
import { useAccount, useDisconnect } from "wagmi";
import {
  ArrowLeftOnRectangleIcon,
  ArrowTopRightOnSquareIcon,
  ArrowsRightLeftIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  DocumentDuplicateIcon,
  EyeIcon,
  QrCodeIcon,
} from "@heroicons/react/24/outline";
import { BlockieAvatar, isENS } from "~~/components/scaffold-eth";
import { useCopyToClipboard, useOutsideClick } from "~~/hooks/scaffold-eth";
import { getTargetNetworks } from "~~/utils/scaffold-eth";

// Burner 钱包的连接器 ID（用于识别开发模式的临时钱包）
const BURNER_WALLET_ID = "burnerWallet";

// 获取所有允许的目标网络列表
const allowedNetworks = getTargetNetworks();

/**
 * AddressInfoDropdown 组件的 Props 类型定义
 */
type AddressInfoDropdownProps = {
  address: Address; // 当前连接的地址
  blockExplorerAddressLink: string | undefined; // 区块浏览器链接
  displayName: string; // 显示名称（ENS 或短地址）
  ensAvatar?: string; // ENS 头像 URL（可选）
};

/**
 * AddressInfoDropdown - 地址信息下拉菜单组件
 *
 * 核心功能：
 * 1. 显示用户地址和头像
 * 2. 提供以下操作菜单：
 *    - 复制地址到剪贴板
 *    - 查看地址二维码
 *    - 在区块浏览器中查看地址
 *    - 切换网络（如果配置了多个网络）
 *    - 查看 Burner 钱包私钥（仅开发模式）
 *    - 断开钱包连接
 * 3. 点击外部自动关闭下拉菜单
 *
 * 菜单状态：
 * - 正常菜单：显示所有操作选项
 * - 网络选择模式：仅显示网络切换选项
 */
export const AddressInfoDropdown = ({
  address,
  ensAvatar,
  displayName,
  blockExplorerAddressLink,
}: AddressInfoDropdownProps) => {
  // ==================== Hooks ====================
  const { disconnect } = useDisconnect(); // 断开钱包连接
  const { connector } = useAccount(); // 获取当前连接器信息

  // 将地址转换为校验和格式（EIP-55 标准）
  const checkSumAddress = getAddress(address);

  // 复制地址功能
  const { copyToClipboard: copyAddressToClipboard, isCopiedToClipboard: isAddressCopiedToClipboard } =
    useCopyToClipboard();

  // 是否处于网络选择模式
  const [selectingNetwork, setSelectingNetwork] = useState(false);

  // 下拉菜单的 DOM 引用
  const dropdownRef = useRef<HTMLDetailsElement>(null);

  // ==================== 关闭下拉菜单 ====================
  const closeDropdown = () => {
    setSelectingNetwork(false); // 退出网络选择模式
    dropdownRef.current?.removeAttribute("open"); // 关闭下拉菜单
  };

  // 点击菜单外部时自动关闭
  useOutsideClick(dropdownRef, closeDropdown);

  return (
    <>
      {/* 使用 details/summary 实现原生下拉菜单 */}
      <details ref={dropdownRef} className="dropdown dropdown-end leading-3">
        {/* ==================== 菜单触发按钮 ==================== */}
        <summary className="btn btn-secondary btn-sm pl-0 pr-2 shadow-md dropdown-toggle gap-0 h-auto!">
          {/* 左侧：Blockie 头像 */}
          <BlockieAvatar address={checkSumAddress} size={30} ensImage={ensAvatar} />
          {/* 中间：显示 ENS 名称或短地址 */}
          <span className="ml-2 mr-1">
            {isENS(displayName) ? displayName : checkSumAddress?.slice(0, 6) + "..." + checkSumAddress?.slice(-4)}
          </span>
          {/* 右侧：下拉箭头 */}
          <ChevronDownIcon className="h-6 w-4 ml-2 sm:ml-0" />
        </summary>

        {/* ==================== 下拉菜单内容 ==================== */}
        <ul className="dropdown-content menu z-2 p-2 mt-2 shadow-center shadow-accent bg-base-200 rounded-box gap-1">
          {/* 网络切换选项（仅在 selectingNetwork=true 时显示） */}
          <NetworkOptions hidden={!selectingNetwork} />

          {/* ==================== 菜单项一：复制地址 ==================== */}
          <li className={selectingNetwork ? "hidden" : ""}>
            <div
              className="h-8 btn-sm rounded-xl! flex gap-3 py-3 cursor-pointer"
              onClick={() => copyAddressToClipboard(checkSumAddress)}
            >
              {isAddressCopiedToClipboard ? (
                <>
                  {/* 已复制状态 */}
                  <CheckCircleIcon className="text-xl font-normal h-6 w-4 ml-2 sm:ml-0" aria-hidden="true" />
                  <span className="whitespace-nowrap">Copied!</span>
                </>
              ) : (
                <>
                  {/* 未复制状态 */}
                  <DocumentDuplicateIcon className="text-xl font-normal h-6 w-4 ml-2 sm:ml-0" aria-hidden="true" />
                  <span className="whitespace-nowrap">Copy address</span>
                </>
              )}
            </div>
          </li>

          {/* ==================== 菜单项二：查看二维码 ==================== */}
          <li className={selectingNetwork ? "hidden" : ""}>
            {/* 点击后触发 id="qrcode-modal" 的弹窗 */}
            <label htmlFor="qrcode-modal" className="h-8 btn-sm rounded-xl! flex gap-3 py-3">
              <QrCodeIcon className="h-6 w-4 ml-2 sm:ml-0" />
              <span className="whitespace-nowrap">View QR Code</span>
            </label>
          </li>

          {/* ==================== 菜单项三：在区块浏览器中查看 ==================== */}
          <li className={selectingNetwork ? "hidden" : ""}>
            <button className="h-8 btn-sm rounded-xl! flex gap-3 py-3" type="button">
              <ArrowTopRightOnSquareIcon className="h-6 w-4 ml-2 sm:ml-0" />
              <a
                target="_blank"
                href={blockExplorerAddressLink}
                rel="noopener noreferrer"
                className="whitespace-nowrap"
              >
                View on Block Explorer
              </a>
            </button>
          </li>

          {/* ==================== 菜单项四：切换网络（仅多网络时显示） ==================== */}
          {allowedNetworks.length > 1 ? (
            <li className={selectingNetwork ? "hidden" : ""}>
              <button
                className="h-8 btn-sm rounded-xl! flex gap-3 py-3"
                type="button"
                onClick={() => {
                  setSelectingNetwork(true); // 进入网络选择模式
                }}
              >
                <ArrowsRightLeftIcon className="h-6 w-4 ml-2 sm:ml-0" /> <span>Switch Network</span>
              </button>
            </li>
          ) : null}

          {/* ==================== 菜单项五：查看 Burner 钱包私钥（仅开发模式） ==================== */}
          {connector?.id === BURNER_WALLET_ID ? (
            <li>
              {/* 点击后触发 id="reveal-burner-pk-modal" 的弹窗 */}
              <label htmlFor="reveal-burner-pk-modal" className="h-8 btn-sm rounded-xl! flex gap-3 py-3 text-error">
                <EyeIcon className="h-6 w-4 ml-2 sm:ml-0" />
                <span>Reveal Private Key</span>
              </label>
            </li>
          ) : null}

          {/* ==================== 菜单项六：断开连接 ==================== */}
          <li className={selectingNetwork ? "hidden" : ""}>
            <button
              className="menu-item text-error h-8 btn-sm rounded-xl! flex gap-3 py-3"
              type="button"
              onClick={() => disconnect()}
            >
              <ArrowLeftOnRectangleIcon className="h-6 w-4 ml-2 sm:ml-0" /> <span>Disconnect</span>
            </button>
          </li>
        </ul>
      </details>
    </>
  );
};
