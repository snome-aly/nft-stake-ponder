/**
 * generateAccount.ts - 生成新的部署账户脚本
 *
 * 功能：生成一个随机的以太坊钱包，并将私钥加密后保存到 .env 文件
 * 使用：yarn generate 或 yarn hardhat account:generate
 */

import { ethers } from "ethers";
import { parse, stringify } from "envfile"; // 用于解析和生成 .env 文件格式
import * as fs from "fs";
import password from "@inquirer/password"; // 用于在命令行中安全地输入密码

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
 * 生成新钱包并保存加密后的私钥
 *
 * @param {object} existingEnvConfig - 现有的环境变量配置（如果有）
 */
const setNewEnvConfig = async (existingEnvConfig = {}) => {
  console.log("👛 Generating new Wallet\n");

  // 使用 ethers.js 生成一个随机钱包
  // 包含：私钥、公钥、地址
  const randomWallet = ethers.Wallet.createRandom();

  // 获取用户设置的密码
  const pass = await getValidatedPassword();

  // 使用密码加密私钥，生成加密的 JSON 字符串
  // 这是一个异步过程，使用 AES-128-CTR 加密算法
  const encryptedJson = await randomWallet.encrypt(pass);

  // 合并现有配置和新的加密私钥
  const newEnvConfig = {
    ...existingEnvConfig, // 保留其他环境变量（如 ALCHEMY_API_KEY）
    DEPLOYER_PRIVATE_KEY_ENCRYPTED: encryptedJson, // 添加加密的私钥
  };

  // 将配置写入 .env 文件
  // stringify 会将对象转换为 KEY=VALUE 格式
  fs.writeFileSync(envFilePath, stringify(newEnvConfig));

  // 显示成功信息
  console.log("\n📄 Encrypted Private Key saved to packages/hardhat/.env file");
  console.log("🪄 Generated wallet address:", randomWallet.address, "\n");
  console.log("⚠️ Make sure to remember your password! You'll need it to decrypt the private key.");
};

/**
 * 主函数
 * 检查是否已有部署账户，如果没有则生成新账户
 */
async function main() {
  // 检查 .env 文件是否存在
  if (!fs.existsSync(envFilePath)) {
    // .env 文件不存在，直接生成新账户
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

  // 有 .env 文件但没有私钥，添加新生成的私钥到现有配置
  await setNewEnvConfig(existingEnvConfig);
}

// 运行主函数，捕获错误
main().catch(error => {
  console.error(error);
  process.exitCode = 1; // 设置非零退出码表示失败
});
