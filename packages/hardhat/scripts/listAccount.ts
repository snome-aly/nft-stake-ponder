/**
 * listAccount.ts - 查看账户信息脚本
 *
 * 功能：
 * 1. 解密并获取部署账户地址
 * 2. 生成地址的二维码
 * 3. 查询所有已配置网络上的余额和 nonce
 *
 * 使用：yarn account 或 yarn hardhat account
 */

import * as dotenv from "dotenv";
dotenv.config(); // 加载 .env 文件中的环境变量

import { ethers, Wallet } from "ethers";
import QRCode from "qrcode"; // 用于生成二维码
import { config } from "hardhat"; // 获取 Hardhat 配置
import password from "@inquirer/password"; // 用于安全输入密码

/**
 * 主函数
 * 显示账户地址、二维码、以及在所有网络上的余额和 nonce
 */
async function main() {
  // 从环境变量中读取加密的私钥
  const encryptedKey = process.env.DEPLOYER_PRIVATE_KEY_ENCRYPTED;

  // 检查是否有加密的私钥
  if (!encryptedKey) {
    console.log("🚫️ You don't have a deployer account. Run `yarn generate` or `yarn account:import` first");
    return;
  }

  // 提示用户输入密码
  const pass = await password({ message: "Enter your password to decrypt the private key:" });

  let wallet: Wallet;
  try {
    // 使用密码解密私钥，恢复钱包
    // fromEncryptedJson 是异步操作，会验证密码并解密
    wallet = (await Wallet.fromEncryptedJson(encryptedKey, pass)) as Wallet;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // 密码错误或解密失败
    console.log("❌ Failed to decrypt private key. Wrong password?");
    return;
  }

  // 获取钱包地址
  const address = wallet.address;

  // 生成并显示地址的二维码（在终端中显示）
  // type: "terminal" 表示在终端显示 ASCII 艺术风格的二维码
  // small: true 表示使用较小的尺寸
  console.log(await QRCode.toString(address, { type: "terminal", small: true }));
  console.log("Public address:", address, "\n");

  // 遍历 Hardhat 配置中的所有网络
  // Balance on each network
  const availableNetworks = config.networks;
  for (const networkName in availableNetworks) {
    try {
      const network = availableNetworks[networkName];

      // 检查网络是否有 URL 配置（hardhat 网络没有 url）
      if (!("url" in network)) continue;

      // 创建该网络的 Provider（JSON-RPC 连接）
      const provider = new ethers.JsonRpcProvider(network.url);

      // 检测网络连接是否正常
      await provider._detectNetwork();

      // 查询该网络上的余额（单位：wei）
      const balance = await provider.getBalance(address);

      // 显示网络名称
      console.log("--", networkName, "-- 📡");

      // 显示余额（转换为 ETH）
      // + 操作符将 BigInt 转换为 Number
      console.log("   balance:", +ethers.formatEther(balance));

      // 显示 nonce（已发送的交易数量）
      console.log("   nonce:", +(await provider.getTransactionCount(address)));

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      // 连接失败（网络不可达、RPC 错误等）
      console.log("Can't connect to network", networkName);
    }
  }
}

// 运行主函数，捕获错误
main().catch(error => {
  console.error(error);
  process.exitCode = 1; // 设置非零退出码表示失败
});
