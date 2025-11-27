import { QRCodeSVG } from "qrcode.react";
import { Address as AddressType } from "viem";
import { Address } from "~~/components/scaffold-eth";

/**
 * AddressQRCodeModal 组件的 Props 类型定义
 */
type AddressQRCodeModalProps = {
  address: AddressType; // 要生成二维码的以太坊地址
  modalId: string; // 弹窗的唯一标识符（用于 label 关联）
};

/**
 * AddressQRCodeModal - 地址二维码弹窗组件
 *
 * 核心功能：
 * 1. 将以太坊地址生成二维码（用于移动端扫码接收转账）
 * 2. 显示完整地址或 ENS 名称
 * 3. 使用原生 checkbox + label 实现模态框（无需 JavaScript 控制）
 * 4. 点击外部灰色遮罩或右上角 ✕ 关闭弹窗
 *
 * 实现原理：
 * - 使用 checkbox 的 checked 状态控制弹窗显示/隐藏
 * - label[for] 关联到 checkbox，点击任意 label 切换 checkbox 状态
 * - .modal-toggle 类配合 DaisyUI 自动处理显示逻辑
 *
 * @example
 * <AddressQRCodeModal address="0x1234..." modalId="qrcode-modal" />
 * // 在其他地方触发：<label htmlFor="qrcode-modal">打开二维码</label>
 */
export const AddressQRCodeModal = ({ address, modalId }: AddressQRCodeModalProps) => {
  return (
    <>
      <div>
        {/* 隐藏的 checkbox，控制弹窗开关状态 */}
        <input type="checkbox" id={`${modalId}`} className="modal-toggle" />

        {/* 弹窗背景遮罩（点击可关闭） */}
        <label htmlFor={`${modalId}`} className="modal cursor-pointer">
          {/* 弹窗内容区域 */}
          <label className="modal-box relative">
            {/* ==================== 防止点击穿透 ==================== */}
            {/* 哑输入框：捕获点击事件，防止点击内容区域时关闭弹窗 */}
            <input className="h-0 w-0 absolute top-0 left-0" />

            {/* 右上角关闭按钮 */}
            <label htmlFor={`${modalId}`} className="btn btn-ghost btn-sm btn-circle absolute right-3 top-3">
              ✕
            </label>

            {/* ==================== 弹窗主体内容 ==================== */}
            <div className="space-y-3 py-6">
              <div className="flex flex-col items-center gap-6">
                {/* 二维码图片（256x256 像素） */}
                <QRCodeSVG value={address} size={256} />

                {/* 显示完整地址或 ENS 名称 */}
                <Address
                  address={address}
                  format="long" // 显示完整地址
                  disableAddressLink // 禁用地址链接
                  onlyEnsOrAddress // 仅显示 ENS 或地址（不重复显示）
                />
              </div>
            </div>
          </label>
        </label>
      </div>
    </>
  );
};
