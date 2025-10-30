/**
 * runHardhatDeployWithPK.ts - 安全部署脚本
 *
 * 这是 `yarn deploy` 命令的底层实现
 *
 * 功能：
 * 1. 判断目标网络（本地 vs 远程）
 * 2. 对于远程网络：解密私钥并设置到环境变量
 * 3. 调用 hardhat deploy 命令
 * 4. 部署完成后自动清理临时私钥
 *
 * 使用：
 * - yarn deploy（本地，无需密码）
 * - yarn deploy --network sepolia（测试网，需要密码）
 * - yarn deploy --network mainnet（主网，需要密码）
 *
 * 安全机制：
 * - 私钥仅在部署期间临时解密
 * - 存储在进程环境变量中（不写入文件）
 * - 进程退出时自动清理
 */

import * as dotenv from "dotenv";
dotenv.config(); // 加载 .env 文件中的环境变量

import { Wallet } from "ethers";
import password from "@inquirer/password"; // 用于安全输入密码
import { spawn } from "child_process"; // 用于启动子进程
import { config } from "hardhat"; // 获取 Hardhat 配置

/**
 * 主函数
 * 根据目标网络决定是否需要解密私钥，然后执行部署
 */
async function main() {
  // 解析命令行参数，获取目标网络名称
  // 例如：yarn deploy --network sepolia
  // networkIndex 会是 --network 的索引位置
  const networkIndex = process.argv.indexOf("--network");

  // 获取网络名称，如果没有指定则使用默认网络（通常是 localhost）
  const networkName = networkIndex !== -1 ? process.argv[networkIndex + 1] : config.defaultNetwork;

  // 判断是否是本地网络
  if (networkName === "localhost" || networkName === "hardhat") {
    // 本地网络部署：无需解密私钥，直接使用 Hardhat 默认账户
    console.log("📍 Deploying to local network...");

    // 使用 spawn 启动 hardhat deploy 子进程
    const hardhat = spawn("hardhat", ["deploy", ...process.argv.slice(2)], {
      stdio: "inherit", // 继承父进程的标准输入/输出/错误
      env: process.env, // 传递环境变量
      shell: process.platform === "win32", // Windows 需要 shell
    });

    // 监听子进程退出事件
    hardhat.on("exit", code => {
      process.exit(code || 0); // 使用子进程的退出码
    });
    return;
  }

  // 远程网络部署：需要解密私钥
  console.log(`📍 Deploying to ${networkName} network...`);

  // 从环境变量中读取加密的私钥
  const encryptedKey = process.env.DEPLOYER_PRIVATE_KEY_ENCRYPTED;

  // 检查是否有加密的私钥
  if (!encryptedKey) {
    console.log("🚫️ You don't have a deployer account. Run `yarn generate` or `yarn account:import` first");
    return;
  }

  // 提示用户输入密码
  const pass = await password({ message: "Enter password to decrypt private key:" });

  try {
    // 使用密码解密私钥，恢复钱包
    const wallet = await Wallet.fromEncryptedJson(encryptedKey, pass);

    // ⚠️ 关键步骤：将解密后的私钥设置到环境变量
    // 这个环境变量会被 hardhat.config.ts 读取
    // 变量名：__RUNTIME_DEPLOYER_PRIVATE_KEY（运行时部署者私钥）
    process.env.__RUNTIME_DEPLOYER_PRIVATE_KEY = wallet.privateKey;

    console.log("🔓 Private key decrypted successfully");
    console.log("👛 Deploying with account:", wallet.address);

    // 启动 hardhat deploy 子进程
    const hardhat = spawn("hardhat", ["deploy", ...process.argv.slice(2)], {
      stdio: "inherit", // 继承父进程的标准输入/输出/错误
      env: process.env, // 传递环境变量（包含解密后的私钥）
      shell: process.platform === "win32", // Windows 需要 shell
    });

    // 监听子进程退出事件
    hardhat.on("exit", code => {
      // 注意：进程退出时，环境变量会自动清理
      // 不需要手动删除 __RUNTIME_DEPLOYER_PRIVATE_KEY
      console.log(code === 0 ? "✅ Deployment completed" : "❌ Deployment failed");
      process.exit(code || 0); // 使用子进程的退出码
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // 密码错误或解密失败
    console.error("❌ Failed to decrypt private key. Wrong password?");
    process.exit(1); // 退出码 1 表示失败
  }
}

// 运行主函数，捕获错误
main().catch(console.error);
