import { Account, Address, Chain, Client, Transport, getContract } from "viem";
import { usePublicClient } from "wagmi";
import { GetWalletClientReturnType } from "wagmi/actions";
import { useSelectedNetwork } from "~~/hooks/scaffold-eth";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { AllowedChainIds } from "~~/utils/scaffold-eth";
import { Contract, ContractName } from "~~/utils/scaffold-eth/contract";

/**
 * Scaffold 合约实例 Hook
 *
 * 该 Hook 用于获取 viem 格式的合约实例
 * 自动加载 deployedContracts.ts 或 externalContracts.ts 中的合约配置
 * 可选地传入 walletClient 用于执行写入操作
 *
 * 返回的合约实例可用于直接调用 viem 的底层方法
 * 对于大多数场景，推荐使用 useScaffoldReadContract 和 useScaffoldWriteContract
 *
 * @param config - 配置对象
 * @param config.contractName - 合约名称
 * @param config.walletClient - 可选的钱包客户端，用于执行写入交易
 * @param config.chainId - 可选的链 ID，用于多链交互
 * @returns {Object} 返回合约实例和加载状态
 * @returns {Contract} data - viem 合约实例，可调用 read、write、simulate 等方法
 * @returns {boolean} isLoading - 是否正在加载合约信息
 *
 * @example
 * ```tsx
 * import { useWalletClient } from "wagmi";
 * import { useScaffoldContract } from "~~/hooks/scaffold-eth";
 *
 * function ContractInteraction() {
 *   const { data: walletClient } = useWalletClient();
 *
 *   // 获取只读合约实例
 *   const { data: contract } = useScaffoldContract({
 *     contractName: "YourContract",
 *   });
 *
 *   // 获取可写合约实例
 *   const { data: writeContract } = useScaffoldContract({
 *     contractName: "YourContract",
 *     walletClient,
 *   });
 *
 *   const handleRead = async () => {
 *     if (contract) {
 *       // 调用只读函数
 *       const result = await contract.read.getValue();
 *       console.log("值:", result);
 *     }
 *   };
 *
 *   const handleWrite = async () => {
 *     if (writeContract) {
 *       // 调用写入函数
 *       const hash = await writeContract.write.setValue([123n]);
 *       console.log("交易哈希:", hash);
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleRead}>读取</button>
 *       <button onClick={handleWrite}>写入</button>
 *     </div>
 *   );
 * }
 * ```
 */
export const useScaffoldContract = <
  TContractName extends ContractName,
  TWalletClient extends Exclude<GetWalletClientReturnType, null> | undefined,
>({
  contractName,
  walletClient,
  chainId,
}: {
  contractName: TContractName;
  walletClient?: TWalletClient | null;
  chainId?: AllowedChainIds;
}) => {
  // 获取选定的网络
  const selectedNetwork = useSelectedNetwork(chainId);
  // 获取已部署的合约信息（地址和 ABI）
  const { data: deployedContractData, isLoading: deployedContractLoading } = useDeployedContractInfo({
    contractName,
    chainId: selectedNetwork?.id as AllowedChainIds,
  });

  // 获取公共客户端，用于读取区块链数据
  const publicClient = usePublicClient({ chainId: selectedNetwork?.id });

  // 创建 viem 合约实例
  let contract = undefined;
  if (deployedContractData && publicClient) {
    contract = getContract<
      Transport,
      Address,
      Contract<TContractName>["abi"],
      // 如果提供了 walletClient，返回的合约实例包含 read 和 write 方法
      // 否则只包含 read 方法
      TWalletClient extends Exclude<GetWalletClientReturnType, null>
        ? {
            public: Client<Transport, Chain>;
            wallet: TWalletClient;
          }
        : { public: Client<Transport, Chain> },
      Chain,
      Account
    >({
      address: deployedContractData.address,
      abi: deployedContractData.abi as Contract<TContractName>["abi"],
      client: {
        public: publicClient,
        wallet: walletClient ? walletClient : undefined,
      } as any,
    });
  }

  return {
    data: contract,
    isLoading: deployedContractLoading,
  };
};
