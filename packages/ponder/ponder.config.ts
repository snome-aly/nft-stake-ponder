/**
 * Ponder 配置文件
 *
 * Ponder 是一个区块链数据索引框架，用于监听和索引智能合约事件
 * 该配置文件定义了要索引的网络和合约
 *
 * 官方文档：https://ponder.sh
 *
 * 工作流程：
 * 1. 从 Scaffold-ETH 配置中读取目标网络
 * 2. 从 deployedContracts.ts 自动读取已部署的合约
 * 3. 为每个合约创建索引配置
 * 4. Ponder 会自动监听这些合约的事件并存储到数据库
 */

import { createConfig } from "ponder";
import { http } from "viem";
import deployedContracts from "../nextjs/contracts/deployedContracts";
import scaffoldConfig from "../nextjs/scaffold.config";

/**
 * 目标网络配置
 *
 * 从 Scaffold-ETH 配置中获取第一个目标网络
 * 这确保了 Ponder 与前端使用相同的网络
 *
 * 例如：如果 scaffold.config.ts 中配置了 [hardhat, sepolia]
 * 那么 targetNetwork 将是 hardhat
 */
const targetNetwork = scaffoldConfig.targetNetworks[0];

/**
 * 网络配置对象
 *
 * 定义 Ponder 要连接的区块链网络
 * Ponder 需要 RPC 端点来读取区块链数据和监听事件
 *
 * 网络配置结构：
 * {
 *   [网络名称]: {
 *     chainId: 网络 ID（例如：1 = 以太坊主网，31337 = Hardhat 本地链）
 *     transport: RPC 传输层配置
 *   }
 * }
 *
 * RPC URL 配置：
 * - 从环境变量读取：PONDER_RPC_URL_{CHAIN_ID}
 * - 例如：PONDER_RPC_URL_1=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
 * - 例如：PONDER_RPC_URL_31337=http://127.0.0.1:8545
 *
 * 注意：
 * - 生产环境必须配置 RPC URL 环境变量
 * - 建议使用 Alchemy、Infura 等可靠的 RPC 服务
 * - 本地开发可以使用 Hardhat 节点
 */
const networks = {
  [targetNetwork.name]: {
    chainId: targetNetwork.id,
    transport: http(process.env[`PONDER_RPC_URL_${targetNetwork.id}`]),

    // 💡 可选配置（未使用但可配置）：
    // maxRequestsPerSecond: 50,           // 每秒最大 RPC 请求数，防止达到限制
    // pollingInterval: 1000,              // 轮询新区块的间隔（毫秒）
    // disableCache: false,                // 是否禁用 RPC 缓存
  },
};

/**
 * 获取当前目标网络的部署信息
 *
 * Ponder 需要从 ABI 字面量推导事件类型，所以这里保留本地部署产物里的 ABI 类型，
 * 运行时地址和部署区块仍然来自 scaffold.config.ts 中的当前目标网络。
 */
type LocalContracts = (typeof deployedContracts)[31337];

const localContracts = deployedContracts[31337];
const deployedContractsByChain = deployedContracts as typeof deployedContracts & Partial<Record<number, LocalContracts>>;
const targetContracts = deployedContractsByChain[targetNetwork.id];

if (!targetContracts) {
  throw new Error(
    `[Ponder] No deployed contracts found for ${targetNetwork.name} (${targetNetwork.id}). ` +
      "Run yarn deploy --network sepolia before starting Ponder on Sepolia, " +
      "or put chains.hardhat first in scaffold.config.ts for local indexing.",
  );
}

/**
 * 合约配置对象
 *
 * 为每个已部署的合约创建 Ponder 索引配置
 * Ponder 会监听这些合约的所有事件并索引到数据库
 *
 * 合约配置结构：
 * {
 *   [合约名称]: {
 *     network: 合约部署的网络名称
 *     abi: 合约 ABI（包含所有事件定义）
 *     address: 合约地址（或地址对象/工厂配置）
 *     startBlock: 开始索引的区块号（默认从部署区块开始）
 *   }
 * }
 *
 * 合约名称需要静态保留，方便 Ponder 从 key 和 ABI 中推导事件类型。
 */
const contracts = {
  MyGovernor: {
    network: targetNetwork.name,
    abi: localContracts.MyGovernor.abi,
    address: targetContracts.MyGovernor.address,
    startBlock: targetContracts.MyGovernor.deployedOnBlock || 0,
  },
  NFTStakingPool: {
    network: targetNetwork.name,
    abi: localContracts.NFTStakingPool.abi,
    address: targetContracts.NFTStakingPool.address,
    startBlock: targetContracts.NFTStakingPool.deployedOnBlock || 0,
  },
  RewardToken: {
    network: targetNetwork.name,
    abi: localContracts.RewardToken.abi,
    address: targetContracts.RewardToken.address,
    startBlock: targetContracts.RewardToken.deployedOnBlock || 0,
  },
  StakableNFT: {
    network: targetNetwork.name,
    abi: localContracts.StakableNFT.abi,
    address: targetContracts.StakableNFT.address,
    startBlock: targetContracts.StakableNFT.deployedOnBlock || 0,
  },
  Timelock: {
    network: targetNetwork.name,
    abi: localContracts.Timelock.abi,
    address: targetContracts.Timelock.address,
    startBlock: targetContracts.Timelock.deployedOnBlock || 0,
  },
} as const;

/**
 * Ponder 主配置导出
 *
 * 使用 createConfig 创建 Ponder 配置对象
 * 这个配置会被 Ponder 框架自动加载
 *
 * 完整配置选项（官方文档）：
 */
export default createConfig({
  /**
   * 网络配置（必需）
   * 定义要连接的所有区块链网络
   */
  networks: networks,

  /**
   * 合约配置（必需）
   * 定义要索引的所有智能合约
   */
  contracts: contracts,

  // 💡 以下是其他可用的顶层配置选项（未使用但可配置）：

  /**
   * 数据库配置
   * 默认使用 SQLite，生产环境建议使用 PostgreSQL
   */
  // database: {
  //   kind: "postgres",                   // 数据库类型："sqlite" | "postgres"
  //   connectionString: process.env.DATABASE_URL, // 数据库连接字符串
  //   poolConfig: {                       // 连接池配置（仅 Postgres）
  //     max: 20,                          // 最大连接数
  //   },
  // },

  /**
   * 选项配置
   */
  // options: {
  //   maxHealthcheckDuration: 240,        // 健康检查最大持续时间（秒）
  //   telemetryEnabled: true,             // 是否启用遥测数据
  //   telemetryUrl: "...",                // 自定义遥测端点
  //   telemetryIsEnabled: () => true,     // 自定义遥测启用逻辑
  // },

  /**
   * 区块配置
   * 自定义区块获取和处理行为
   */
  // blocks: {
  //   [targetNetwork.name]: {
  //     interval: 1,                       // 索引间隔（区块数）
  //     startBlock: 0,                     // 全局开始区块
  //     endBlock: 1000000,                 // 全局结束区块
  //   },
  // },
});

/**
 * 使用说明：
 *
 * 1. 启动 Ponder 开发服务器：
 *    yarn ponder:dev
 *
 * 2. Ponder 会自动：
 *    - 连接到配置的 RPC 端点
 *    - 扫描合约的历史事件
 *    - 监听新的事件
 *    - 将数据存储到数据库
 *    - 提供 GraphQL API 查询接口
 *
 * 3. GraphQL API 端点（开发模式）：
 *    http://localhost:42069
 *
 * 4. 编写索引器：
 *    在 src/ 目录下创建与合约名称对应的文件
 *    例如：src/YourContract.ts
 *
 * 5. 定义数据 Schema：
 *    在 ponder.schema.ts 中定义数据表结构
 *
 * 6. 环境变量配置：
 *    - 复制 .env.example 到 .env
 *    - 设置 PONDER_RPC_URL_{CHAIN_ID}
 *
 * 示例环境变量：
 * PONDER_RPC_URL_1=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
 * PONDER_RPC_URL_11155111=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
 * PONDER_RPC_URL_31337=http://127.0.0.1:8545
 * DATABASE_URL=postgresql://user:password@localhost:5432/ponder
 */
