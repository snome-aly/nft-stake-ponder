import { useEffect, useState } from "react";
import { useIsMounted } from "usehooks-ts";
import { usePublicClient } from "wagmi";
import { useSelectedNetwork } from "~~/hooks/scaffold-eth";
import {
  Contract,
  ContractCodeStatus,
  ContractName,
  UseDeployedContractConfig,
  contracts,
} from "~~/utils/scaffold-eth/contract";

/**
 * 已部署合约数据类型
 * @template TContractName - 合约名称类型
 */
type DeployedContractData<TContractName extends ContractName> = {
  data: Contract<TContractName> | undefined; // 合约数据，包括地址和 ABI
  isLoading: boolean; // 是否正在加载
};

/**
 * 已部署合约信息 Hook
 *
 * 该 Hook 用于获取已部署合约的完整信息（地址、ABI 等）
 * 会自动从 deployedContracts.ts 和 externalContracts.ts 中匹配合约
 * 并验证合约是否真正部署在链上（通过检查字节码）
 *
 * @param config - 配置对象
 * @param config.contractName - 合约名称
 * @param config.chainId - 可选的链 ID，用于多链交互
 * @returns {Object} 返回合约数据和加载状态
 * @returns {Contract | undefined} data - 合约信息，包括地址和 ABI
 * @returns {boolean} isLoading - 是否正在加载
 *
 * @example
 * ```tsx
 * const { data: contract, isLoading } = useDeployedContractInfo({
 *   contractName: "YourContract"
 * });
 *
 * if (isLoading) return <div>加载中...</div>;
 * if (!contract) return <div>合约未部署</div>;
 *
 * return <div>合约地址: {contract.address}</div>;
 * ```
 */
export function useDeployedContractInfo<TContractName extends ContractName>(
  config: UseDeployedContractConfig<TContractName>,
): DeployedContractData<TContractName>;

/**
 * @deprecated 使用对象参数版本代替: useDeployedContractInfo({ contractName: "YourContract" })
 */
export function useDeployedContractInfo<TContractName extends ContractName>(
  contractName: TContractName,
): DeployedContractData<TContractName>;

export function useDeployedContractInfo<TContractName extends ContractName>(
  configOrName: UseDeployedContractConfig<TContractName> | TContractName,
): DeployedContractData<TContractName> {
  // 检查组件是否已挂载
  const isMounted = useIsMounted();

  // 兼容旧版字符串参数和新版对象参数
  const finalConfig: UseDeployedContractConfig<TContractName> =
    typeof configOrName === "string" ? { contractName: configOrName } : (configOrName as any);

  // 显示弃用警告
  useEffect(() => {
    if (typeof configOrName === "string") {
      console.warn("使用字符串参数的 `useDeployedContractInfo` 已弃用，请使用对象参数版本。");
    }
  }, [configOrName]);

  const { contractName, chainId } = finalConfig;
  // 获取选定的网络
  const selectedNetwork = useSelectedNetwork(chainId);
  // 从配置文件中获取部署的合约信息
  const deployedContract = contracts?.[selectedNetwork.id]?.[contractName as ContractName] as Contract<TContractName>;
  // 合约状态：加载中、已部署、未找到
  const [status, setStatus] = useState<ContractCodeStatus>(ContractCodeStatus.LOADING);
  // 获取公共客户端，用于验证合约部署状态
  const publicClient = usePublicClient({ chainId: selectedNetwork.id });

  useEffect(() => {
    /**
     * 检查合约是否真正部署在链上
     * 通过获取合约地址的字节码来验证
     */
    const checkContractDeployment = async () => {
      try {
        if (!isMounted() || !publicClient) return;

        // 如果配置文件中没有该合约，标记为未找到
        if (!deployedContract) {
          setStatus(ContractCodeStatus.NOT_FOUND);
          return;
        }

        // 获取合约地址的字节码
        const code = await publicClient.getBytecode({
          address: deployedContract.address,
        });

        // 如果字节码是 `0x`，说明该地址没有部署合约
        if (code === "0x") {
          setStatus(ContractCodeStatus.NOT_FOUND);
          return;
        }
        // 合约已成功部署
        setStatus(ContractCodeStatus.DEPLOYED);
      } catch (e) {
        console.error(e);
        setStatus(ContractCodeStatus.NOT_FOUND);
      }
    };

    checkContractDeployment();
  }, [isMounted, contractName, deployedContract, publicClient]);

  return {
    // 只有在合约已部署时才返回合约数据
    data: status === ContractCodeStatus.DEPLOYED ? deployedContract : undefined,
    isLoading: status === ContractCodeStatus.LOADING,
  };
}
