/**
 * revealPK.ts - 显示私钥脚本
 *
 * ⚠️ 危险操作！此脚本会在控制台明文显示私钥
 *
 * 功能：解密并在终端显示账户的原始私钥
 * 使用：yarn account:reveal-pk 或 yarn hardhat account:reveal-pk
 *
 * 使用场景：
 * - 需要导出私钥到其他工具
 * - 备份私钥（应离线保存）
 * - 迁移到其他开发环境
 *
 * 安全警告：
 * - 私钥一旦泄露，资产可能被盗
 * - 不要在公共场所使用
 * - 不要截图或录屏
 * - 使用后应清空终端历史
 */

import * as dotenv from "dotenv";
dotenv.config(); // 加载 .env 文件中的环境变量

import { Wallet } from "ethers";
import password from "@inquirer/password"; // 用于安全输入密码

/**
 * 主函数
 * 解密并显示私钥（明文）
 */
async function main() {
  // 从环境变量中读取加密的私钥
  const encryptedKey = process.env.DEPLOYER_PRIVATE_KEY_ENCRYPTED;

  // 检查是否有加密的私钥
  if (!encryptedKey) {
    console.log("🚫️ You don't have a deployer account. Run `yarn generate` or `yarn account:import` first");
    return;
  }

  // 显示警告信息
  console.log("👀 This will reveal your private key on the console.\n");

  // 提示用户输入密码
  const pass = await password({ message: "Enter your password to decrypt the private key:" });

  let wallet: Wallet;
  try {
    // 使用密码解密私钥，恢复钱包
    wallet = (await Wallet.fromEncryptedJson(encryptedKey, pass)) as Wallet;
  } catch {
    // 密码错误或解密失败
    console.log("❌ Failed to decrypt private key. Wrong password?");
    return;
  }

  // ⚠️ 危险：在控制台明文显示私钥
  // privateKey 格式：0x 开头的 64 位十六进制字符串
  console.log("\n🔑 Private key:", wallet.privateKey);

  // 安全提示（可选添加）
  console.log("\n⚠️ 安全提示：");
  console.log("   - 请勿分享此私钥给任何人");
  console.log("   - 建议使用后运行 'clear' 清空终端");
  console.log("   - 如需备份，请离线保存到安全位置");
}

// 运行主函数，捕获错误
main().catch(error => {
  console.error(error);
  process.exitCode = 1; // 设置非零退出码表示失败
});
