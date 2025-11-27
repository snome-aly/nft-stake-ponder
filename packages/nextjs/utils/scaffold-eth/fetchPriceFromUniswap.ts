/**
 * ============================================
 * Uniswap 价格获取工具
 * ============================================
 *
 * 📌 核心功能：
 * 从 Uniswap V2 DEX 获取代币的实时价格（相对于 DAI 稳定币）
 *
 * 🎯 主要用途：
 * - 获取 ETH、SEP 或其他原生代币的 USD 价格
 * - 用于显示钱包余额的法币价值
 * - 在 UI 中展示实时价格信息
 *
 * 🔧 工作原理：
 * 1. 连接到以太坊主网
 * 2. 从 Uniswap V2 池子读取储备金数据
 * 3. 使用 Uniswap SDK 计算价格
 * 4. 返回相对于 DAI 的中间价格
 */
import { ChainWithAttributes, getAlchemyHttpUrl } from "./networks";
import { CurrencyAmount, Token } from "@uniswap/sdk-core";
import { Pair, Route } from "@uniswap/v2-sdk";
import { Address, createPublicClient, fallback, http, parseAbi } from "viem";
import { mainnet } from "viem/chains";

// 获取 Alchemy RPC URL（用于访问以太坊主网）
const alchemyHttpUrl = getAlchemyHttpUrl(mainnet.id);

// 配置 RPC fallback 列表
// 如果 Alchemy URL 可用，优先使用；否则使用公共 RPC
const rpcFallbacks = alchemyHttpUrl ? [http(alchemyHttpUrl), http()] : [http()];

// 创建公共客户端（用于读取区块链数据）
const publicClient = createPublicClient({
  chain: mainnet, // 连接到以太坊主网
  transport: fallback(rpcFallbacks), // 使用 fallback 传输（多个 RPC 端点）
});

/**
 * Uniswap V2 Pair 合约 ABI
 * 只包含我们需要的函数
 */
const ABI = parseAbi([
  // 获取流动性池储备金
  // 返回 token0 和 token1 的数量以及最后更新时间
  "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",

  // 获取池子中的 token0 地址
  "function token0() external view returns (address)",

  // 获取池子中的 token1 地址
  "function token1() external view returns (address)",
]);

/**
 * 从 Uniswap 获取代币价格
 *
 * @param targetNetwork - 目标网络配置对象
 * @returns 代币价格（相对于 DAI，单位为 USD）
 *
 * 📌 支持的代币：
 * - ETH（以太坊原生代币）
 * - SEP（Sepolia 测试网代币）
 * - 其他在 targetNetwork.nativeCurrencyTokenAddress 中指定的代币
 *
 * 🔍 工作流程：
 * 1. 检查代币是否支持价格查询
 * 2. 创建 DAI 和目标代币的 Token 实例
 * 3. 计算 Uniswap V2 配对地址
 * 4. 从链上读取储备金数据
 * 5. 确定哪个是 token0，哪个是 token1
 * 6. 使用 Uniswap SDK 计算路由和中间价格
 * 7. 返回格式化的价格（保留 6 位有效数字）
 *
 * 💡 错误处理：
 * - 不支持的代币返回 0
 * - 查询失败返回 0 并记录错误日志
 */
export const fetchPriceFromUniswap = async (targetNetwork: ChainWithAttributes): Promise<number> => {
  // 检查是否支持价格查询
  // 只支持 ETH、SEP 或配置了 nativeCurrencyTokenAddress 的代币
  if (
    targetNetwork.nativeCurrency.symbol !== "ETH" &&
    targetNetwork.nativeCurrency.symbol !== "SEP" &&
    !targetNetwork.nativeCurrencyTokenAddress
  ) {
    return 0;
  }

  try {
    // DAI 稳定币（以太坊主网）
    // 地址：0x6B17...
    // 小数位：18
    const DAI = new Token(1, "0x6B175474E89094C44Da98b954EedeAC495271d0F", 18);

    // 目标代币（默认使用 WETH）
    // 如果配置了 nativeCurrencyTokenAddress，使用配置的地址
    // 否则使用 WETH 地址：0xC02a...
    const TOKEN = new Token(
      1, // 主网 chainId
      targetNetwork.nativeCurrencyTokenAddress || "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      18, // 小数位
    );

    // 计算 TOKEN-DAI 配对合约地址
    // Uniswap V2 使用确定性地址生成
    const pairAddress = Pair.getAddress(TOKEN, DAI) as Address;

    // 合约配置
    const wagmiConfig = {
      address: pairAddress,
      abi: ABI,
    };

    // 1. 读取储备金数据
    // reserves[0]: token0 的数量
    // reserves[1]: token1 的数量
    // reserves[2]: 最后更新的区块时间戳
    const reserves = await publicClient.readContract({
      ...wagmiConfig,
      functionName: "getReserves",
    });

    // 2. 读取 token0 地址
    const token0Address = await publicClient.readContract({
      ...wagmiConfig,
      functionName: "token0",
    });

    // 3. 读取 token1 地址
    const token1Address = await publicClient.readContract({
      ...wagmiConfig,
      functionName: "token1",
    });

    // 4. 确定哪个 token 是 TOKEN，哪个是 DAI
    // Uniswap 按地址排序，所以需要匹配
    const token0 = [TOKEN, DAI].find(token => token.address === token0Address) as Token;
    const token1 = [TOKEN, DAI].find(token => token.address === token1Address) as Token;

    // 5. 创建 Pair 实例（包含储备金信息）
    const pair = new Pair(
      CurrencyAmount.fromRawAmount(token0, reserves[0].toString()), // token0 数量
      CurrencyAmount.fromRawAmount(token1, reserves[1].toString()), // token1 数量
    );

    // 6. 创建交易路由（TOKEN -> DAI）
    const route = new Route([pair], TOKEN, DAI);

    // 7. 获取中间价格（midPrice = 买入价和卖出价的平均值）
    // toSignificant(6) 返回 6 位有效数字
    const price = parseFloat(route.midPrice.toSignificant(6));

    return price;
  } catch (error) {
    // 错误处理：记录日志并返回 0
    console.error(
      `useNativeCurrencyPrice - Error fetching ${targetNetwork.nativeCurrency.symbol} price from Uniswap: `,
      error,
    );
    return 0;
  }
};
