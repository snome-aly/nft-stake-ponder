import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * 使用部署者账户部署名为 "YourContract" 的合约，
 * 构造函数参数设置为部署者地址
 *
 * @param hre HardhatRuntimeEnvironment 对象。
 */
const deployYourContract: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  /*
    在本地环境，部署者账户是 Hardhat 自带的账户，已经预先充值。

    当部署到真实网络（例如 `yarn deploy --network sepolia`）时，部署者账户
    应该有足够余额支付合约创建的燃气费用。

    你可以使用 `yarn generate` 生成一个随机账户，或者使用 `yarn account:import` 导入你的
    已有私钥，这会填充 .env 文件中的 DEPLOYER_PRIVATE_KEY_ENCRYPTED（然后在 hardhat.config.ts 中使用）
    你可以运行 `yarn account` 命令查看你在每个网络的余额。
  */
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("YourContract", {
    from: deployer,
    // 合约构造函数参数
    args: [deployer],
    log: true,
    // autoMine: 可以传递给 deploy 函数以加快本地网络上的部署过程，
    // 通过自动挖矿合约部署交易。对真实网络无效。
    autoMine: true,
  });

  // 获取已部署的合约以便在部署后进行交互。
  const yourContract = await hre.ethers.getContract<Contract>("YourContract", deployer);
  console.log("👋 初始问候语:", await yourContract.greeting());
};

export default deployYourContract;

// 标签在有多个部署文件时非常有用，可以只运行其中一个。
// 例如：yarn deploy --tags YourContract
deployYourContract.tags = ["YourContract"];
