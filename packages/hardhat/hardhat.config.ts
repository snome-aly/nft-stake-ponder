// 导入环境变量配置
import * as dotenv from "dotenv";
dotenv.config();
import { HardhatUserConfig } from "hardhat/config";

// Hardhat 插件导入
import "@nomicfoundation/hardhat-ethers"; // ethers.js v6 集成
import "@nomicfoundation/hardhat-chai-matchers"; // Chai 断言匹配器（用于测试）
import "@typechain/hardhat"; // TypeChain：自动生成合约 TypeScript 类型
import "hardhat-gas-reporter"; // Gas 使用报告
import "solidity-coverage"; // 代码覆盖率测试
import "@nomicfoundation/hardhat-verify"; // 合约验证（Etherscan 等）
import "hardhat-deploy"; // 增强的合约部署系统
import "hardhat-deploy-ethers"; // hardhat-deploy 与 ethers 的集成
import "hardhat-contract-sizer"; // 合约大小检查

import { task } from "hardhat/config";
import generateTsAbis from "./scripts/generateTsAbis";

// ========== 环境变量配置 ==========

// Alchemy API Key（用于连接区块链节点）
// 获取地址: https://dashboard.alchemyapi.io
const providerApiKey = process.env.ALCHEMY_API_KEY || "oKxs-03sij-U_N0iOlrSsZFr29-IqbuF";

// 部署者私钥
// - 本地开发：使用 Hardhat 默认账户 0 的私钥
// - 生产环境：使用 `yarn generate` 生成新账户或 `yarn account:import` 导入现有私钥
const deployerPrivateKey =
  process.env.__RUNTIME_DEPLOYER_PRIVATE_KEY ?? "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

// Etherscan API Key（用于合约验证）
const etherscanApiKey = process.env.ETHERSCAN_V2_API_KEY || "DNXJA8RX2Q3VZ4URQIWP7Z68CJXQZSC6AW";

// ========== Hardhat 主配置 ==========
const config: HardhatUserConfig = {
  // ========== Solidity 编译器配置 ==========
  solidity: {
    compilers: [
      {
        version: "0.8.20", // Solidity 版本
        settings: {
          optimizer: {
            enabled: true, // 启用优化器（减少 gas 消耗和字节码大小）
            runs: 200, // 优化运行次数：200 适合部署后频繁调用的合约
            // 详细说明: https://docs.soliditylang.org/en/latest/using-the-compiler.html#optimizer-options
          },
          viaIR: process.env.COVERAGE !== "true", // 通过 Yul IR 编译，解决 "Stack too deep" 问题 (coverage 时禁用)
          // 其他可选的编译器设置（已注释）
          // viaIR: false, // 通过 Yul IR 编译（实验性，可能减少字节码大小）
          // evmVersion: "paris", // EVM 版本: homestead, tangerineWhistle, spuriousDragon, byzantium, constantinople, petersburg, istanbul, berlin, london, paris, shanghai
          // metadata: {
          //   bytecodeHash: "ipfs", // 字节码哈希方法: "ipfs" 或 "bzzr1"
          //   useLiteralContent: true, // 在元数据中使用源码内容而非哈希
          // },
          // outputSelection: { // 自定义输出内容
          //   "*": {
          //     "*": ["evm.bytecode", "evm.deployedBytecode", "abi"]
          //   }
          // },
        },
      },
      // 可以添加多个编译器版本以支持不同版本的合约
      // {
      //   version: "0.8.17",
      //   settings: {
      //     optimizer: { enabled: true, runs: 200 }
      //   }
      // },
    ],
    // overrides: { // 为特定合约指定不同的编译器设置
    //   "contracts/SpecialContract.sol": {
    //     version: "0.8.17",
    //     settings: {
    //       optimizer: { enabled: false }
    //     }
    //   }
    // }
  },

  // 默认网络（yarn deploy 不指定 --network 时使用）
  defaultNetwork: "localhost",

  // ========== 命名账户配置（用于 hardhat-deploy）==========
  namedAccounts: {
    deployer: {
      default: 0, // 默认使用账户索引 0 作为部署者
      // 可以为不同网络指定不同的账户
      // 1: 0, // mainnet 使用账户 0
      // 4: 0, // rinkeby 使用账户 0
      // 或者使用具体地址
      // mainnet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    },
    operator: {
      default: 1, // 默认使用账户索引 1 作为操作员
      // 生产环境使用具体地址
      // mainnet: "0x...",
      // sepolia: "0x...",
    },
    pauser: {
      default: 2, // 默认使用账户索引 2 作为安全员
      // 生产环境使用具体地址
      // mainnet: "0x...",
      // sepolia: "0x...",
    },
  },

  // ========== 自定义路径配置 ==========
  // paths: {
  //   sources: "./contracts", // 合约源码目录
  //   tests: "./test", // 测试文件目录
  //   cache: "./cache", // 编译缓存目录
  //   artifacts: "./artifacts", // 编译产物目录
  //   deploy: "./deploy", // hardhat-deploy 部署脚本目录
  //   deployments: "./deployments", // 部署信息存储目录
  //   imports: "./imports", // 导入文件目录
  // },

  // ========== Mocha 测试框架配置 ==========
  // mocha: {
  //   timeout: 40000, // 测试超时时间（毫秒）
  //   bail: false, // 遇到第一个失败的测试时是否停止
  //   allowUncaught: false, // 是否允许未捕获的异常
  //   grep: "", // 只运行匹配此模式的测试
  //   reporter: "spec", // 测试报告格式: spec, dot, nyan, tap, landing, list, progress, json, min, doc
  //   slow: 75, // "慢"测试的阈值（毫秒）
  // },

  // ========== Gas Reporter 配置 ==========
  // gasReporter: {
  //   enabled: process.env.REPORT_GAS === "true", // 通过环境变量启用
  //   currency: "USD", // 显示的货币单位
  //   coinmarketcap: process.env.COINMARKETCAP_API_KEY, // CoinMarketCap API Key（获取价格）
  //   token: "ETH", // 报告哪个代币的 gas 成本: ETH, BNB, MATIC 等
  //   gasPriceApi: "https://api.etherscan.io/api?module=proxy&action=eth_gasPrice", // Gas 价格 API
  //   outputFile: "gas-report.txt", // 输出到文件
  //   noColors: false, // 禁用颜色输出
  //   showTimeSpent: true, // 显示测试耗时
  //   showMethodSig: true, // 显示方法签名
  //   excludeContracts: ["Migrations"], // 排除某些合约
  // },

  // ========== TypeChain 配置 ==========
  // typechain: {
  //   outDir: "typechain-types", // 类型文件输出目录
  //   target: "ethers-v6", // 目标库: ethers-v5, ethers-v6, web3-v1, truffle-v5
  //   alwaysGenerateOverloads: false, // 总是生成重载函数
  //   externalArtifacts: ["externalArtifacts/*.json"], // 外部合约的 artifacts
  //   dontOverrideCompile: false, // 不覆盖编译任务
  // },

  // ========== 合约大小检查 ==========
  contractSizer: {
    alphaSort: true, // 按字母顺序排序
    disambiguatePaths: false, // 消除路径歧义
    runOnCompile: false, // 编译时自动运行 (设为 false 避免每次都显示)
    strict: true, // 超过大小限制时抛出错误
    only: [], // 仅检查特定合约
    except: [], // 排除特定合约
  },

  // ========== Dodoc 文档生成 ==========
  // dodoc: {
  //   runOnCompile: false, // 编译时自动生成文档
  //   debugMode: false, // 调试模式
  //   outputDir: "./docs", // 文档输出目录
  //   include: [], // 包含的合约
  //   exclude: [], // 排除的合约
  // },
  // ========== 网络配置 ==========
  // 使用方法: yarn deploy --network <networkName>
  networks: {
    // Hardhat 本地网络（内存中的临时链）
    hardhat: {
      forking: {
        // 主网分叉：可以在本地复制主网状态进行测试
        url: `https://eth-mainnet.alchemyapi.io/v2/${providerApiKey}`,
        enabled: process.env.MAINNET_FORKING_ENABLED === "true", // 通过环境变量启用
        // blockNumber: 14390000, // 可选：从特定区块开始分叉
      },
      // 其他可选的 Hardhat 网络配置
      // chainId: 31337, // 链 ID（默认 31337）
      gas: process.env.COVERAGE === "true" ? 0xfffffffffff : 30000000, // coverage 时使用超大 gas 限制
      // gasPrice: "auto", // gas 价格
      // initialBaseFeePerGas: 0, // 初始 base fee（EIP-1559）
      // accounts: { // 账户配置
      //   mnemonic: "test test test test test test test test test test test junk", // 助记词
      //   count: 20, // 生成账户数量
      //   accountsBalance: "10000000000000000000000", // 每个账户的余额（wei）
      // },
      // mining: { // 挖矿配置
      //   auto: true, // 自动挖矿（每笔交易自动打包）
      //   interval: 0, // 手动挖矿时的区块间隔（毫秒）
      // },
      allowUnlimitedContractSize: true, // 允许超过 24KB 的合约（用于 coverage 测试）
      blockGasLimit: process.env.COVERAGE === "true" ? 0xfffffffffff : 30000000, // coverage 时使用超大区块 gas 限制
      // blockGasLimit: 30000000, // 区块 gas 限制
      // throwOnTransactionFailures: true, // 交易失败时抛出异常
      // throwOnCallFailures: true, // 调用失败时抛出异常
      // loggingEnabled: false, // 启用日志
    },

    // Localhost 网络（连接到运行中的 Hardhat 节点）
    // localhost: {
    //   url: "http://127.0.0.1:8545", // RPC URL
    //   timeout: 60000, // 请求超时（毫秒）
    //   accounts: "remote", // 使用远程节点提供的账户
    //   // 或指定具体账户
    //   // accounts: [deployerPrivateKey],
    // },

    // ========== Ethereum 主网和测试网 ==========
    mainnet: {
      url: "https://mainnet.rpc.buidlguidl.com",
      accounts: [deployerPrivateKey],
      // 可选的网络配置（适用于所有网络）
      // chainId: 1, // 链 ID（通常会自动检测）
      // gas: "auto", // gas 限制
      // gasPrice: "auto", // gas 价格（非 EIP-1559）
      // gasMultiplier: 1, // gas 价格乘数
      // timeout: 20000, // 请求超时（毫秒）
      // httpHeaders: {}, // 自定义 HTTP 请求头
    },
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
      // 测试网通常可以使用更激进的 gas 设置
      // gasPrice: 10000000000, // 10 gwei
      // gasMultiplier: 1.2, // gas 价格提高 20%
    },

    // ========== Arbitrum (Layer 2) ==========
    arbitrum: {
      url: `https://arb-mainnet.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
    },
    arbitrumSepolia: {
      url: `https://arb-sepolia.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
    },

    // ========== Optimism (Layer 2) ==========
    optimism: {
      url: `https://opt-mainnet.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
    },
    optimismSepolia: {
      url: `https://opt-sepolia.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
    },

    // ========== Polygon ==========
    polygon: {
      url: `https://polygon-mainnet.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
    },
    polygonAmoy: {
      // Polygon 测试网（Amoy 替代了旧的 Mumbai）
      url: `https://polygon-amoy.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
    },
    polygonZkEvm: {
      url: `https://polygonzkevm-mainnet.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
    },
    polygonZkEvmCardona: {
      url: `https://polygonzkevm-cardona.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
    },

    // ========== Gnosis Chain ==========
    gnosis: {
      url: "https://rpc.gnosischain.com",
      accounts: [deployerPrivateKey],
    },
    chiado: {
      // Gnosis 测试网
      url: "https://rpc.chiadochain.net",
      accounts: [deployerPrivateKey],
    },

    // ========== Base (Coinbase Layer 2) ==========
    base: {
      url: "https://mainnet.base.org",
      accounts: [deployerPrivateKey],
    },
    baseSepolia: {
      url: "https://sepolia.base.org",
      accounts: [deployerPrivateKey],
    },

    // ========== Scroll (Layer 2) ==========
    scrollSepolia: {
      url: "https://sepolia-rpc.scroll.io",
      accounts: [deployerPrivateKey],
    },
    scroll: {
      url: "https://rpc.scroll.io",
      accounts: [deployerPrivateKey],
    },

    // ========== Celo ==========
    celo: {
      url: "https://forno.celo.org",
      accounts: [deployerPrivateKey],
    },
    celoSepolia: {
      url: "https://forno.celo-sepolia.celo-testnet.org/",
      accounts: [deployerPrivateKey],
    },
  },
  // ========== 合约验证配置 ==========
  // hardhat-verify 插件配置（用于 Etherscan 等浏览器）
  etherscan: {
    apiKey: etherscanApiKey,
  },

  // hardhat-deploy 插件的验证配置
  verify: {
    etherscan: {
      apiKey: etherscanApiKey,
    },
  },

  // Sourcify 验证（去中心化合约验证）
  sourcify: {
    enabled: false, // 默认禁用
  },

  // ========== 其他高级配置 ==========

  // ========== 外部合约配置 ==========
  // external: {
  //   contracts: [ // 导入外部合约的 artifacts
  //     {
  //       artifacts: "node_modules/@openzeppelin/contracts/build/contracts",
  //     },
  //   ],
  //   deployments: { // 导入外部部署信息
  //     sepolia: ["node_modules/@project/deployments/sepolia"],
  //   },
  // },

  // ========== Hardhat Deploy 配置 ==========
  // 这些选项特定于 hardhat-deploy 插件
  // deploy: {
  //   autoExport: true, // 自动导出部署信息
  //   exportAll: "./deployments/export.json", // 导出所有部署到单个文件
  // },

  // ========== 警告和错误配置 ==========
  // warnings: {
  //   "*": {
  //     "unused-param": "off", // 关闭未使用参数警告
  //     "code-size": "warn", // 代码大小警告
  //   },
  // },

  // ========== Defender 配置（OpenZeppelin Defender）==========
  // defender: {
  //   apiKey: process.env.DEFENDER_API_KEY,
  //   apiSecret: process.env.DEFENDER_API_SECRET,
  // },

  // ========== 自定义链配置示例 ==========
  // 如果要连接到自定义/私有链：
  // networks: {
  //   customChain: {
  //     url: "http://localhost:8545",
  //     chainId: 1337,
  //     accounts: [deployerPrivateKey],
  //     // 对于私有链，可能需要禁用某些功能
  //     // gasPrice: 0, // 零 gas 价格
  //     // timeout: 1800000, // 30 分钟超时
  //     // allowUnlimitedContractSize: true, // 允许大合约
  //   },
  // },

  // ========== Watch 模式配置 ==========
  // watchPaths: ["./contracts"], // 监听这些路径的变化

  // ========== 多编译器配置示例 ==========
  // 如果项目中有多个 Solidity 版本的合约：
  // solidity: {
  //   compilers: [
  //     { version: "0.8.20", settings: { optimizer: { enabled: true, runs: 200 } } },
  //     { version: "0.8.17", settings: { optimizer: { enabled: true, runs: 200 } } },
  //     { version: "0.7.6", settings: { optimizer: { enabled: true, runs: 200 } } },
  //   ],
  //   overrides: {
  //     "contracts/OldContract.sol": {
  //       version: "0.7.6",
  //       settings: { optimizer: { enabled: false } }
  //     }
  //   }
  // },
};

// ========== 自定义任务 ==========

// 扩展 deploy 任务：部署后自动生成前端所需的 ABI 类型文件
task("deploy").setAction(async (args, hre, runSuper) => {
  // 执行原始的 deploy 任务
  await runSuper(args);

  // 自动运行 generateTsAbis 脚本
  // 作用：将部署信息同步到 packages/nextjs/contracts/deployedContracts.ts
  await generateTsAbis(hre);
});

// ========== 更多自定义任务示例（已注释）==========

// 示例 1: 创建一个显示账户余额的任务
// task("balance", "Prints an account's balance")
//   .addParam("account", "The account's address")
//   .setAction(async (taskArgs, hre) => {
//     const balance = await hre.ethers.provider.getBalance(taskArgs.account);
//     console.log(hre.ethers.formatEther(balance), "ETH");
//   });

// 示例 2: 创建一个查询合约信息的任务
// task("contract-info", "Get contract information")
//   .addParam("address", "The contract address")
//   .setAction(async (taskArgs, hre) => {
//     const code = await hre.ethers.provider.getCode(taskArgs.address);
//     console.log("Contract bytecode length:", code.length);
//   });

// 示例 3: 扩展 compile 任务添加后置处理
// task("compile").setAction(async (args, hre, runSuper) => {
//   await runSuper(args);
//   console.log("✅ Compilation complete!");
//   // 可以在这里添加自定义的编译后处理逻辑
// });

// 示例 4: 创建一个批量部署任务
// task("deploy-all", "Deploy all contracts")
//   .addOptionalParam("reset", "Reset deployments", false, types.boolean)
//   .setAction(async (taskArgs, hre) => {
//     if (taskArgs.reset) {
//       console.log("Resetting deployments...");
//     }
//     await hre.run("deploy");
//   });

// 示例 5: 创建一个网络信息查询任务
// task("network-info", "Show network information")
//   .setAction(async (_, hre) => {
//     const network = await hre.ethers.provider.getNetwork();
//     const blockNumber = await hre.ethers.provider.getBlockNumber();
//     console.log("Network:", network.name);
//     console.log("Chain ID:", network.chainId);
//     console.log("Block Number:", blockNumber);
//   });

export default config;
