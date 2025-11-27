import Link from "next/link";
import { hardhat } from "viem/chains";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";

/**
 * 地址链接包装器组件的 Props 类型
 */
type AddressLinkWrapperProps = {
  children: React.ReactNode; // 要包裹的子元素（通常是地址文本）
  disableAddressLink?: boolean; // 是否禁用链接（禁用时仅显示文本）
  blockExplorerAddressLink: string; // 区块浏览器地址链接（如 Etherscan）
};

/**
 * 地址链接包装器组件
 *
 * 功能：
 * - 根据配置决定是否将地址渲染为可点击链接
 * - 点击链接跳转到区块浏览器查看地址详情
 * - 本地 Hardhat 网络在当前页面打开，其他网络在新标签页打开
 *
 * @param children - 子元素（地址文本或 ENS 名称）
 * @param disableAddressLink - 是否禁用链接功能
 * @param blockExplorerAddressLink - 区块浏览器完整 URL
 */
export const AddressLinkWrapper = ({
  children,
  disableAddressLink,
  blockExplorerAddressLink,
}: AddressLinkWrapperProps) => {
  // 获取当前目标网络信息
  const { targetNetwork } = useTargetNetwork();

  // 如果禁用链接，直接返回子元素（纯文本）
  return disableAddressLink ? (
    <>{children}</>
  ) : (
    // 渲染为可点击链接
    <Link
      href={blockExplorerAddressLink}
      // Hardhat 本地网络：在当前页面打开（undefined = 默认行为 _self）
      // 其他网络（测试网/主网）：在新标签页打开
      target={targetNetwork.id === hardhat.id ? undefined : "_blank"}
      // 安全性属性：仅在新标签页打开时添加，防止新页面访问原页面的 window 对象
      rel={targetNetwork.id === hardhat.id ? undefined : "noopener noreferrer"}
    >
      {children}
    </Link>
  );
};
