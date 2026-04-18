# hardhat-deploy 部署流程层次分析

## ✅ 你的理解完全正确

让我确认并详细解释这个调用链：

## 🔄 完整调用链

### 层次 1：用户命令

```bash
yarn deploy --network sepolia
```

### 层次 2：package.json 脚本

```json
{
  "scripts": {
    "deploy": "tsx scripts/runHardhatDeployWithPK.ts"
  }
}
```

### 层次 3：runHardhatDeployWithPK.ts（父进程）

```typescript
// scripts/runHardhatDeployWithPK.ts

// 1. 解密私钥
const wallet = await Wallet.fromEncryptedJson(encryptedKey, password);

// 2. 设置到环境变量
process.env.__RUNTIME_DEPLOYER_PRIVATE_KEY = wallet.privateKey;

// 3. 启动子进程
const hardhat = spawn("hardhat", ["deploy", "--network", "sepolia"], {
  stdio: "inherit",
  env: process.env  // 包含私钥
});
```

**作用：**
- ✅ 处理私钥解密
- ✅ 设置环境变量
- ✅ 启动子进程
- ❌ 不构造部署交易
- ❌ 不签名
- ❌ 不发送交易

### 层次 4：hardhat deploy 命令（子进程）

```bash
# 实际执行的命令
hardhat deploy --network sepolia
```

**由 hardhat-deploy 插件提供**

这个命令会：
1. 扫描 `deploy/` 目录
2. 按文件名顺序加载部署脚本
3. 执行每个脚本的导出函数

### 层次 5：部署脚本（deploy/00_deploy_your_contract.ts）

```typescript
// deploy/00_deploy_your_contract.ts

const deployYourContract: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // 这里只是调用 deploy 函数，传递参数
  await deploy("YourContract", {
    from: deployer,           // ← 只是传递部署者地址
    args: [deployer],         // ← 只是传递构造函数参数
    log: true,                // ← 只是传递配置选项
    autoMine: true,
  });
};
```

**作用：**
- ✅ 指定要部署的合约名称
- ✅ 传递部署者地址
- ✅ 传递构造函数参数
- ✅ 传递部署选项
- ❌ 不构造部署交易
- ❌ 不签名
- ❌ 不发送交易

**这里就像在"填表单"，告诉 hardhat-deploy：**
- 我要部署什么合约：`"YourContract"`
- 谁来部署：`from: deployer`
- 构造函数参数是什么：`args: [deployer]`
- 其他选项：`log: true, autoMine: true`

### 层次 6：hardhat-deploy 插件内部（黑盒操作）

```typescript
// hardhat-deploy 插件内部（简化版）

async function deploy(name: string, options: DeployOptions) {
  // 1. 读取编译产物
  const artifact = await readArtifact(name);
  const { bytecode, abi } = artifact;

  // 2. 编码构造函数参数
  const encodedArgs = ethers.AbiCoder.defaultAbiCoder().encode(
    getConstructorTypes(abi),
    options.args
  );

  // 3. 拼接字节码和参数
  const deployData = bytecode + encodedArgs.slice(2);

  // 4. 获取签名器（从 hardhat.config.ts 配置）
  const signer = await ethers.getSigner(options.from);
  // ↑ 这里会使用 process.env.__RUNTIME_DEPLOYER_PRIVATE_KEY

  // 5. 构造部署交易
  const tx = {
    from: options.from,
    data: deployData,
    gasLimit: await estimateGas(),
    gasPrice: await getGasPrice(),
    nonce: await getNonce(options.from),
  };

  // 6. 签名交易
  const signedTx = await signer.signTransaction(tx);

  // 7. 发送交易
  const txResponse = await signer.sendTransaction(tx);

  // 8. 等待确认
  const receipt = await txResponse.wait();

  // 9. 保存部署信息
  await saveDeployment(name, {
    address: receipt.contractAddress,
    abi,
    receipt,
    args: options.args,
  });

  return receipt;
}
```

**作用：**
- ✅ 读取编译产物
- ✅ 编码参数
- ✅ 构造部署交易
- ✅ 签名交易
- ✅ 发送交易
- ✅ 等待确认
- ✅ 保存部署信息

### 层次 7：ethers.js

```typescript
// ethers.js 内部

class Wallet {
  async signTransaction(tx: TransactionRequest) {
    // 1. 序列化交易
    const serialized = serializeTransaction(tx);

    // 2. 计算交易哈希
    const hash = keccak256(serialized);

    // 3. 使用私钥签名
    const signature = sign(hash, this.privateKey);

    // 4. 返回签名后的交易
    return {
      ...tx,
      v: signature.v,
      r: signature.r,
      s: signature.s,
    };
  }

  async sendTransaction(tx: TransactionRequest) {
    // 1. 签名交易
    const signedTx = await this.signTransaction(tx);

    // 2. 发送到 RPC 节点
    const txHash = await this.provider.send("eth_sendRawTransaction", [signedTx]);

    // 3. 返回交易响应
    return new TransactionResponse(txHash, this.provider);
  }
}
```

**作用：**
- ✅ ECDSA 签名
- ✅ RPC 通信

### 层次 8：RPC 节点（Alchemy/Infura）

```
接收签名后的交易
    ↓
验证签名和余额
    ↓
广播到 P2P 网络
    ↓
返回交易哈希
```

### 层次 9：以太坊网络

```
矿工/验证者接收交易
    ↓
打包到区块
    ↓
EVM 执行（部署合约）
    ↓
生成交易回执
```

## 📊 完整流程图

```
用户
  ↓ yarn deploy --network sepolia
package.json
  ↓ tsx scripts/runHardhatDeployWithPK.ts
runHardhatDeployWithPK.ts（父进程）
  ├─ 1. 解密私钥
  ├─ 2. process.env.__RUNTIME_DEPLOYER_PRIVATE_KEY = privateKey
  └─ 3. spawn("hardhat", ["deploy", "--network", "sepolia"])
       ↓
hardhat deploy 命令（子进程）
  ├─ 读取 process.env.__RUNTIME_DEPLOYER_PRIVATE_KEY
  ├─ 扫描 deploy/ 目录
  └─ 执行 00_deploy_your_contract.ts
       ↓
部署脚本（你的代码）
  └─ await deploy("YourContract", {
       from: deployer,        ← 只传参数
       args: [deployer],      ← 只传参数
       log: true,             ← 只传配置
     })
       ↓
hardhat-deploy 插件（内部实现）
  ├─ 1. 读取编译产物（bytecode + ABI）
  ├─ 2. 编码构造函数参数
  ├─ 3. 拼接 bytecode + encodedArgs
  ├─ 4. 获取签名器（使用环境变量中的私钥）
  ├─ 5. 构造部署交易 {from, data, gas, gasPrice, nonce}
  ├─ 6. 调用 ethers.js
  │    ↓
  │  ethers.js（Wallet.signTransaction）
  │    ├─ 序列化交易
  │    ├─ keccak256(transaction)
  │    ├─ ECDSA 签名（使用私钥）
  │    └─ 返回签名后的交易 {v, r, s}
  │    ↓
  ├─ 7. 发送交易（ethers.js Wallet.sendTransaction）
  │    ↓
  │  RPC 节点（Alchemy/Infura）
  │    ├─ 验证签名
  │    ├─ 检查余额
  │    ├─ 广播到 P2P 网络
  │    └─ 返回交易哈希
  │    ↓
  ├─ 8. 等待交易确认
  │    ↓
  │  以太坊网络
  │    ├─ 矿工打包交易
  │    ├─ EVM 执行部署
  │    ├─ 生成合约地址
  │    └─ 返回交易回执
  │    ↓
  └─ 9. 保存部署信息到 deployments/sepolia/YourContract.json
       ↓
✅ 部署完成
```

## 🎯 各层职责划分

### 你编写的代码（部署脚本）

```typescript
// 你只需要写这些
await deploy("YourContract", {
  from: deployer,
  args: [deployer],
  log: true,
});

// 职责：
// - 指定合约名称
// - 指定部署者
// - 指定构造函数参数
// - 配置选项
```

**这就像填表单：**
- 姓名：YourContract
- 申请人：deployer
- 附加材料：[deployer]
- 选项：log, autoMine

### hardhat-deploy 插件完成的工作

```typescript
// hardhat-deploy 内部自动完成
async function deploy(name, options) {
  // 1. 读取编译产物
  const artifact = await readArtifact(name);

  // 2. 编码参数
  const encodedArgs = encode(options.args);

  // 3. 拼接字节码
  const deployData = bytecode + encodedArgs;

  // 4. 构造交易
  const tx = {
    from: options.from,
    data: deployData,
    // ... gas, nonce 等
  };

  // 5. 签名并发送（调用 ethers.js）
  const signer = await getSigner(options.from);
  const receipt = await signer.sendTransaction(tx);

  // 6. 保存部署信息
  await saveDeployment(name, receipt);

  return receipt;
}
```

**职责：**
- ✅ 读取编译产物
- ✅ ABI 编码
- ✅ 构造交易对象
- ✅ 调用签名器
- ✅ 发送交易
- ✅ 等待确认
- ✅ 保存部署数据

### ethers.js 完成的工作

```typescript
// ethers.js 负责
class Wallet {
  signTransaction(tx) {
    // ECDSA 签名
    const hash = keccak256(serialize(tx));
    const sig = sign(hash, this.privateKey);
    return { ...tx, ...sig };
  }

  sendTransaction(tx) {
    // 发送到 RPC
    const signedTx = this.signTransaction(tx);
    return this.provider.send("eth_sendRawTransaction", [signedTx]);
  }
}
```

**职责：**
- ✅ 交易序列化
- ✅ 加密签名
- ✅ RPC 通信

## 💡 为什么这样设计？

### 分层设计的好处

```
用户层（你的代码）
├─ 简单易用
├─ 只关心业务逻辑
└─ 不需要了解底层细节

抽象层（hardhat-deploy）
├─ 提供高级 API
├─ 处理复杂逻辑
├─ 统一部署流程
└─ 管理部署状态

工具层（ethers.js）
├─ 加密操作
├─ RPC 通信
└─ 类型定义

协议层（以太坊）
├─ 交易验证
├─ 合约执行
└─ 状态存储
```

### 如果没有这些抽象

```typescript
// ❌ 没有 hardhat-deploy，你需要写这些
async function deployContract() {
  // 1. 手动读取编译产物
  const artifact = JSON.parse(fs.readFileSync("artifacts/.../YourContract.json"));

  // 2. 手动编码参数
  const iface = new ethers.Interface(artifact.abi);
  const constructorFragment = iface.fragments.find(f => f.type === "constructor");
  const encodedArgs = ethers.AbiCoder.defaultAbiCoder().encode(
    constructorFragment.inputs.map(i => i.type),
    [deployer]
  );

  // 3. 手动拼接字节码
  const deployData = artifact.bytecode + encodedArgs.slice(2);

  // 4. 手动构造交易
  const nonce = await provider.getTransactionCount(deployer);
  const gasPrice = await provider.getFeeData();
  const gasLimit = await provider.estimateGas({
    from: deployer,
    data: deployData,
  });

  const tx = {
    from: deployer,
    data: deployData,
    nonce,
    gasLimit,
    gasPrice: gasPrice.gasPrice,
    chainId: (await provider.getNetwork()).chainId,
  };

  // 5. 手动签名
  const wallet = new ethers.Wallet(privateKey, provider);
  const signedTx = await wallet.signTransaction(tx);

  // 6. 手动发送
  const txResponse = await provider.broadcastTransaction(signedTx);

  // 7. 手动等待
  const receipt = await txResponse.wait();

  // 8. 手动保存部署信息
  fs.writeFileSync(
    "deployments/sepolia/YourContract.json",
    JSON.stringify({
      address: receipt.contractAddress,
      abi: artifact.abi,
      transactionHash: receipt.transactionHash,
      // ...
    })
  );

  console.log("Deployed to:", receipt.contractAddress);
}

// ✅ 有了 hardhat-deploy，只需要
await deploy("YourContract", {
  from: deployer,
  args: [deployer],
  log: true,
});
```

## 📋 参数传递路径

### from 参数的传递

```
部署脚本
  ↓ deploy({ from: deployer })
hardhat-deploy
  ↓ await getSigner(deployer)
hardhat.config.ts
  ↓ accounts: [process.env.__RUNTIME_DEPLOYER_PRIVATE_KEY]
runHardhatDeployWithPK.ts
  ↓ process.env.__RUNTIME_DEPLOYER_PRIVATE_KEY = wallet.privateKey
.env 文件
  ↓ DEPLOYER_PRIVATE_KEY_ENCRYPTED
用户输入密码
```

### args 参数的传递

```
部署脚本
  ↓ deploy({ args: [deployer] })
hardhat-deploy
  ↓ ethers.AbiCoder.defaultAbiCoder().encode(types, args)
编码后的参数
  ↓ 拼接到字节码
部署交易的 data 字段
  ↓ 发送到以太坊
EVM 执行构造函数
```

## 🎓 总结

### 你的理解完全正确！

```
1. runHardhatDeployWithPK.ts 启动子进程
   ✅ 只负责私钥管理和启动进程

2. 部署脚本中的 deploy() 函数
   ✅ 只传递参数和配置

3. hardhat-deploy 插件内部
   ✅ 构造交易
   ✅ 签名交易
   ✅ 发送交易
   ✅ 保存部署信息

4. 你不需要关心底层细节
   ✅ 专注于业务逻辑
   ✅ 使用高级 API
```

### 关键点

| 层次 | 职责 | 你需要了解吗？ |
|------|------|----------------|
| **部署脚本** | 指定合约和参数 | ✅ 必须了解 |
| **hardhat-deploy** | 构造和发送交易 | ⚠️ 了解原理有帮助 |
| **ethers.js** | 签名和 RPC 通信 | 📚 可选了解 |
| **以太坊协议** | 执行和验证 | 📚 可选了解 |

### 类比

```
部署合约 = 寄快递

你（部署脚本）:
├─ 填写快递单
│  ├─ 收件人：Ethereum Network
│  ├─ 物品：YourContract
│  └─ 备注：args: [deployer]

快递公司（hardhat-deploy）:
├─ 称重计算运费（估算 gas）
├─ 打包物品（编码字节码）
├─ 贴条形码（签名交易）
└─ 运送（发送交易）

物流网络（以太坊网络）:
├─ 验证包裹（验证签名）
├─ 运输到目的地（区块确认）
└─ 签收（合约部署成功）
```

你只需要填写快递单（调用 deploy 函数），剩下的都由系统自动完成！
