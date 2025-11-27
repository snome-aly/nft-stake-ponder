/**
 * Scaffold-ETH 自定义 Hooks 统一导出文件
 *
 * 该文件统一导出所有 Scaffold-ETH 项目的自定义 React Hooks
 * 这些 Hooks 提供了与智能合约交互、UI 动画、网络配置等功能
 */

// 导出动画配置 Hook - 用于在数据变化时触发动画效果
export * from "./useAnimationConfig";

// 导出合约日志 Hook - 用于获取和监听合约的所有日志事件
export * from "./useContractLogs";

// 导出复制到剪贴板 Hook - 用于复制文本到系统剪贴板
export * from "./useCopyToClipboard";

// 导出已部署合约信息 Hook - 用于获取已部署合约的地址、ABI 等信息
export * from "./useDeployedContractInfo";

// 导出区块获取 Hook - 用于从本地链获取区块和交易数据
export * from "./useFetchBlocks";

// 导出原生币价格初始化 Hook - 用于从 Uniswap 获取 ETH/代币价格
export * from "./useInitializeNativeCurrencyPrice";

// 导出网络颜色 Hook - 用于获取不同网络的主题颜色
export * from "./useNetworkColor";

// 导出外部点击 Hook - 用于检测元素外部的点击事件
export * from "./useOutsideClick";

// 导出 Scaffold 合约实例 Hook - 用于获取 viem 合约实例
export * from "./useScaffoldContract";

// 导出 Scaffold 事件历史 Hook - 用于读取合约的历史事件
export * from "./useScaffoldEventHistory";

// 导出 Scaffold 读取合约 Hook - 用于调用合约的只读函数
export * from "./useScaffoldReadContract";

// 导出 Scaffold 监听合约事件 Hook - 用于实时监听合约事件
export * from "./useScaffoldWatchContractEvent";

// 导出 Scaffold 写入合约 Hook - 用于调用合约的写入函数（交易）
export * from "./useScaffoldWriteContract";

// 导出目标网络 Hook - 用于获取当前连接的目标网络
export * from "./useTargetNetwork";

// 导出交易处理器 Hook - 用于执行交易并显示 UI 反馈
export * from "./useTransactor";

// 导出监听余额 Hook - 用于监听地址余额变化
export * from "./useWatchBalance";

// 导出选定网络 Hook - 用于根据 chainId 获取网络配置
export * from "./useSelectedNetwork";
