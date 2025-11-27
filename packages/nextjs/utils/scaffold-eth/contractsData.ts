/**
 * ============================================
 * 合约数据 Hook
 * ============================================
 *
 * 📌 核心功能：
 * 获取当前目标网络的所有已部署合约
 *
 * 🎯 主要用途：
 * - 在组件中访问当前网络的合约列表
 * - 避免直接导入和使用 contracts 对象
 * - 提供类型安全的合约访问
 *
 * 💡 使用场景：
 * - Debug 页面显示所有合约
 * - 合约选择器组件
 * - 动态生成合约交互 UI
 */
import { useTargetNetwork } from "~~/hooks/scaffold-eth";
import { GenericContractsDeclaration, contracts } from "~~/utils/scaffold-eth/contract";

/**
 * 默认空对象
 * 当目标网络没有部署任何合约时返回
 *
 * 📌 为什么使用常量：
 * - 避免每次调用时创建新对象
 * - 保持引用稳定性，防止不必要的重新渲染
 * - 符合 React Hooks 的最佳实践
 */
const DEFAULT_ALL_CONTRACTS: GenericContractsDeclaration[number] = {};

/**
 * 获取当前网络的所有合约
 *
 * @returns 当前目标网络的合约对象
 *
 * 📌 返回值：
 * - 如果当前网络有部署合约，返回合约对象
 * - 如果当前网络没有合约，返回空对象（DEFAULT_ALL_CONTRACTS）
 *
 * 💡 使用方法：
 * ```typescript
 * function ContractList() {
 *   const contractsData = useAllContracts();
 *
 *   return (
 *     <div>
 *       {Object.entries(contractsData).map(([name, contract]) => (
 *         <div key={name}>
 *           {name}: {contract.address}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 *
 * 🔧 工作原理：
 * 1. 获取当前目标网络（useTargetNetwork）
 * 2. 从 contracts 对象中提取当前网络的合约
 * 3. 如果不存在，返回默认空对象
 */
export function useAllContracts() {
  // 获取当前目标网络
  const { targetNetwork } = useTargetNetwork();

  // 根据 chainId 获取合约数据
  const contractsData = contracts?.[targetNetwork.id];

  // 返回合约数据或默认空对象
  // 使用常量避免创建新对象，保持引用稳定
  return contractsData || DEFAULT_ALL_CONTRACTS;
}
