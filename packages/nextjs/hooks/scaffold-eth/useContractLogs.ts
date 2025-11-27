import { useEffect, useState } from "react";
import { useTargetNetwork } from "./useTargetNetwork";
import { Address, Log } from "viem";
import { usePublicClient } from "wagmi";

/**
 * 合约日志获取 Hook
 *
 * 该 Hook 用于获取指定合约地址的所有历史日志，并实时监听新的日志
 * 会在组件挂载时获取从区块 0 到最新区块的所有日志
 * 同时会监听新区块的产生，自动获取新的日志
 *
 * @param address - 要监听的合约地址
 * @returns {Log[]} logs - 合约的所有日志数组，包括历史日志和实时日志
 *
 * @example
 * ```tsx
 * const logs = useContractLogs("0x1234...5678");
 *
 * return (
 *   <div>
 *     <h3>合约日志总数: {logs.length}</h3>
 *     {logs.map((log, index) => (
 *       <div key={index}>
 *         区块: {log.blockNumber}, 交易: {log.transactionHash}
 *       </div>
 *     ))}
 *   </div>
 * );
 * ```
 */
export const useContractLogs = (address: Address) => {
  // 存储所有日志的状态
  const [logs, setLogs] = useState<Log[]>([]);
  // 获取目标网络配置
  const { targetNetwork } = useTargetNetwork();
  // 获取公共客户端，用于读取区块链数据
  const client = usePublicClient({ chainId: targetNetwork.id });

  useEffect(() => {
    /**
     * 获取历史日志
     * 从区块 0 开始获取到最新区块的所有日志
     */
    const fetchLogs = async () => {
      if (!client) return console.error("Client not found");
      try {
        // 获取从创世区块到最新区块的所有日志
        const existingLogs = await client.getLogs({
          address: address,
          fromBlock: 0n, // 从区块 0 开始
          toBlock: "latest", // 到最新区块
        });
        setLogs(existingLogs);
      } catch (error) {
        console.error("Failed to fetch logs:", error);
      }
    };
    fetchLogs();

    // 监听新区块的产生
    // 当有新区块产生时，获取该区块范围内的新日志并添加到列表中
    return client?.watchBlockNumber({
      onBlockNumber: async (_blockNumber, prevBlockNumber) => {
        // 获取从上一个区块到最新区块的新日志
        const newLogs = await client.getLogs({
          address: address,
          fromBlock: prevBlockNumber,
          toBlock: "latest",
        });
        // 将新日志追加到现有日志列表中
        setLogs(prevLogs => [...prevLogs, ...newLogs]);
      },
    });
  }, [address, client]);

  return logs;
};
