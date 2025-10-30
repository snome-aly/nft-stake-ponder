/**
 * importAccount.ts - 导入已有钱包脚本
 *
 * 功能：导入用户已有的私钥（如 MetaMask 导出的），加密后保存到 .env 文件
 * 使用：yarn account:import 或 yarn hardhat account:import
 */

import { ethers } from "ethers";
import { parse, stringify } from "envfile";
import * as fs from "fs";
import password from "@inquirer/password";

// .env 文件路径
const envFilePath = "./.env";

/**
 * 获取并验证密码
 * 要求用户输入两次密码，确保密码一致
 *
 * @returns {Promise<string>} 验证通过的密码
 */
const getValidatedPassword = async () => {
  while (true) {
    // 第一次输入密码
    const pass = await password({ message: "Enter a password to encrypt your private key:" });
    // 第二次确认密码
    const confirmation = await password({ message: "Confirm password:" });

    // 检查两次输入是否一致
    if (pass === confirmation) {
      return pass;
    }
    console.log("❌ Passwords don't match. Please try again.");
  }
};

/**
 * 从私钥创建钱包
 * 提示用户粘贴私钥，并验证格式是否正确
 *
 * @returns {Promise<ethers.Wallet>} 创建的钱包对象
 */
const getWalletFromPrivateKey = async () => {
  while (true) {
    // 提示用户粘贴私钥（输入会被隐藏）
    const privateKey = await password({ message: "Paste your private key:" });

    try {
      // 尝试用私钥创建钱包
      // 如果私钥格式不正确，会抛出异常
      const wallet = new ethers.Wallet(privateKey);
      return wallet;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      // 私钥格式错误，提示用户重新输入
      console.log("❌ Invalid private key format. Please try again.");
    }
  }
};

/**
 * 导入钱包并保存加密后的私钥
 *
 * @param {object} existingEnvConfig - 现有的环境变量配置（如果有）
 */
const setNewEnvConfig = async (existingEnvConfig = {}) => {
  console.log("👛 Importing Wallet\n");

  // 获取用户输入的私钥，并创建钱包
  const wallet = await getWalletFromPrivateKey();

  // 获取用户设置的密码
  const pass = await getValidatedPassword();

  // 使用密码加密私钥
  // 原始私钥不会保存，只保存加密后的 JSON
  const encryptedJson = await wallet.encrypt(pass);

  // 合并现有配置和新的加密私钥
  const newEnvConfig = {
    ...existingEnvConfig, // 保留其他环境变量
    DEPLOYER_PRIVATE_KEY_ENCRYPTED: encryptedJson, // 添加加密的私钥
  };

  // 将配置写入 .env 文件
  fs.writeFileSync(envFilePath, stringify(newEnvConfig));

  // 显示成功信息
  console.log("\n📄 Encrypted Private Key saved to packages/hardhat/.env file");
  console.log("🪄 Imported wallet address:", wallet.address, "\n");
  console.log("⚠️ Make sure to remember your password! You'll need it to decrypt the private key.");
};

/**
 * 主函数
 * 检查是否已有部署账户，如果没有则导入新账户
 */
async function main() {
  // 检查 .env 文件是否存在
  if (!fs.existsSync(envFilePath)) {
    // .env 文件不存在，直接导入账户
    await setNewEnvConfig();
    return;
  }

  // .env 文件存在，读取并解析现有配置
  const existingEnvConfig = parse(fs.readFileSync(envFilePath).toString());

  // 检查是否已经有加密的私钥
  if (existingEnvConfig.DEPLOYER_PRIVATE_KEY_ENCRYPTED) {
    console.log("⚠️ You already have a deployer account. Check the packages/hardhat/.env file");
    return;
  }

  // 有 .env 文件但没有私钥，添加导入的私钥到现有配置
  await setNewEnvConfig(existingEnvConfig);
}

// 运行主函数，捕获错误
main().catch(error => {
  console.error(error);
  process.exitCode = 1; // 设置非零退出码表示失败
});
