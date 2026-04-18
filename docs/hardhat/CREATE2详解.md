# CREATE2 详解：确定性合约部署

## 📚 概述

CREATE2 是以太坊在 [EIP-1014](https://eips.ethereum.org/EIPS/eip-1014) 中引入的新操作码，允许在部署合约之前就知道合约地址。

## 🔍 CREATE vs CREATE2 对比

### CREATE（传统方式）

```javascript
// 合约地址计算公式
contractAddress = keccak256(rlp([deployer_address, nonce]))[12:]

// 示例
const address = ethers.getCreateAddress({
  from: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  nonce: 5
});
// 结果：0x5FbDB2315678afecb367f032d93F642f64180aa3

// ❌ 问题：
// 1. 地址依赖于 nonce（交易序号）
// 2. nonce 会随着交易增加而变化
// 3. 无法在部署前确定地址
// 4. 同一个合约在不同链上地址不同
```

### CREATE2（确定性方式）

```javascript
// 合约地址计算公式
contractAddress = keccak256(0xff + deployer_address + salt + keccak256(bytecode))[12:]

// 示例
const address = ethers.getCreate2Address(
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",  // deployer
  "0x0000000000000000000000000000000000000000000000000000000000000001",  // salt
  ethers.keccak256(bytecode)  // bytecode hash
);
// 结果：0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0

// ✅ 优势：
// 1. 地址不依赖于 nonce
// 2. 可以在部署前预测地址
// 3. 相同参数在不同链上地址相同
// 4. 支持反事实实例化（Counterfactual Instantiation）
```

## 🎯 CREATE2 参数详解

### 参数 1：factoryAddress（工厂合约地址）

**这是什么？**
- 部署合约的"工厂合约"地址
- 通常是一个专门用于部署的合约

**从何而来？**

```solidity
// 1. 首先部署一个工厂合约
contract ContractFactory {
    event ContractDeployed(address contractAddress, bytes32 salt);

    // 使用 CREATE2 部署合约
    function deploy(bytes32 salt, bytes memory bytecode) public returns (address) {
        address addr;

        assembly {
            // CREATE2 操作码
            // stack: [value, offset, size, salt]
            addr := create2(
                0,                  // value: 发送的 ETH 数量（0）
                add(bytecode, 32),  // offset: 字节码起始位置
                mload(bytecode),    // size: 字节码长度
                salt                // salt: 盐值
            )
        }

        require(addr != address(0), "Deployment failed");
        emit ContractDeployed(addr, salt);
        return addr;
    }

    // 预计算地址（不实际部署）
    function computeAddress(bytes32 salt, bytes memory bytecode) public view returns (address) {
        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff),           // 固定前缀
                address(this),          // 工厂合约地址
                salt,                   // 盐值
                keccak256(bytecode)     // 字节码哈希
            )
        );
        return address(uint160(uint256(hash)));
    }
}

// 部署工厂合约
const factory = await deploy("ContractFactory");
// 工厂地址：0x5FbDB2315678afecb367f032d93F642f64180aa3

// 这个地址就是 factoryAddress 参数的来源
```

**TypeScript 中使用：**

```typescript
// 1. 部署工厂合约
const factory = await ethers.deployContract("ContractFactory");
await factory.waitForDeployment();

const factoryAddress = await factory.getAddress();
// "0x5FbDB2315678afecb367f032d93F642f64180aa3"

// 2. 使用工厂地址计算目标合约地址
const targetAddress = ethers.getCreate2Address(
  factoryAddress,  // ← 工厂合约地址
  salt,
  bytecodeHash
);
```

### 参数 2：salt（盐值）

**这是什么？**
- 一个 32 字节（bytes32）的任意值
- 用于生成不同的合约地址
- 你可以自由选择

**从何而来？**

```typescript
// 方式 1：简单的数字
const salt = ethers.zeroPadValue(ethers.toBeHex(1), 32);
// "0x0000000000000000000000000000000000000000000000000000000000000001"

// 方式 2：使用字符串生成
const salt = ethers.id("my-unique-salt");
// "0x9c22ff5f21f0b81b113e63f7db6da94fedef11b2119b4088b89664fb9a3cb658"

// 方式 3：使用地址作为 salt
const salt = ethers.zeroPadValue(userAddress, 32);
// "0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266"

// 方式 4：随机生成
const salt = ethers.hexlify(ethers.randomBytes(32));
// "0x7f8a93b2c4d5e6f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7"

// 方式 5：根据参数生成（常用）
const salt = ethers.keccak256(
  ethers.AbiCoder.defaultAbiCoder().encode(
    ["address", "uint256"],
    [owner, tokenId]
  )
);
// 确保不同的参数组合产生不同的地址
```

**实际示例：**

```solidity
contract ContractFactory {
    // 为每个用户部署独立的钱包
    function deployWallet(address user) public returns (address) {
        // 使用用户地址作为 salt
        bytes32 salt = bytes32(uint256(uint160(user)));

        bytes memory bytecode = type(Wallet).creationCode;

        address walletAddress;
        assembly {
            walletAddress := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }

        return walletAddress;
    }
}
```

### 参数 3：bytecodeHash（字节码哈希）

**这是什么？**
- 合约字节码的 keccak256 哈希值
- 包含合约代码和构造函数参数

**从何而来？**

```typescript
// 1. 获取合约编译产物
const artifact = await hre.artifacts.readArtifact("MyContract");

// 2. 获取字节码
let bytecode = artifact.bytecode;

// 3. 如果有构造函数参数，需要编码并拼接
const constructorArgs = ethers.AbiCoder.defaultAbiCoder().encode(
  ["address", "uint256"],  // 构造函数参数类型
  [owner, initialValue]    // 构造函数参数值
);

// 拼接字节码和参数
bytecode = bytecode + constructorArgs.slice(2);

// 4. 计算哈希
const bytecodeHash = ethers.keccak256(bytecode);
// "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"

// 5. 计算 CREATE2 地址
const predictedAddress = ethers.getCreate2Address(
  factoryAddress,
  salt,
  bytecodeHash  // ← 字节码哈希
);
```

**完整示例：**

```typescript
// MyContract.sol
// constructor(address _owner, uint256 _value)

// 1. 获取字节码
const MyContract = await ethers.getContractFactory("MyContract");
const bytecode = MyContract.bytecode;

// 2. 编码构造函数参数
const encodedArgs = ethers.AbiCoder.defaultAbiCoder().encode(
  ["address", "uint256"],
  ["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", 1000]
);

// 3. 拼接
const fullBytecode = bytecode + encodedArgs.slice(2);

// 4. 计算哈希
const bytecodeHash = ethers.keccak256(fullBytecode);

// 5. 预测地址
const predictedAddress = ethers.getCreate2Address(
  factoryAddress,
  salt,
  bytecodeHash
);

console.log("合约将部署到:", predictedAddress);
// "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
```

## 💡 CREATE2 使用场景

### 场景 1：跨链确定性部署

**需求：** 在多个链上部署相同地址的合约

```typescript
// 问题：使用 CREATE，不同链上地址不同
// Ethereum Mainnet: 0x5FbDB...（nonce=5）
// Polygon:          0x9fE46...（nonce=3）
// Arbitrum:         0x1234A...（nonce=7）

// 解决：使用 CREATE2，所有链上地址相同
const salt = ethers.id("my-protocol-v1");
const bytecodeHash = ethers.keccak256(contractBytecode);

// 在所有链上使用相同的工厂合约和参数
const address = ethers.getCreate2Address(factoryAddress, salt, bytecodeHash);

// Ethereum Mainnet: 0xABCD...
// Polygon:          0xABCD...（相同）
// Arbitrum:         0xABCD...（相同）
```

**实际应用：** Uniswap V3 池子

```solidity
// Uniswap V3 Factory 使用 CREATE2 部署池子
contract UniswapV3Factory {
    function createPool(
        address tokenA,
        address tokenB,
        uint24 fee
    ) external returns (address pool) {
        // 使用 token 地址和费率作为 salt
        bytes32 salt = keccak256(abi.encodePacked(tokenA, tokenB, fee));

        // 部署池子合约
        pool = address(new UniswapV3Pool{salt: salt}(tokenA, tokenB, fee));

        // 所有链上相同的 tokenA + tokenB + fee = 相同的池子地址
    }
}

// 结果：
// USDC/WETH 0.05% 费率的池子在所有链上地址都是：
// 0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640
```

### 场景 2：反事实实例化（Counterfactual Instantiation）

**需求：** 先使用合约地址，后部署合约

```typescript
// 1. 预计算地址（不部署）
const walletAddress = ethers.getCreate2Address(
  factoryAddress,
  salt,
  bytecodeHash
);

// 2. 向这个地址发送 ETH（合约还不存在！）
await deployer.sendTransaction({
  to: walletAddress,  // 目标地址尚未部署
  value: ethers.parseEther("1.0")
});

// 3. 用户可以一直使用这个地址

// 4. 只有在需要时才实际部署合约
await factory.deploy(salt, bytecode);

// 5. 现在合约存在了，可以执行操作
const wallet = await ethers.getContractAt("Wallet", walletAddress);
await wallet.withdraw();
```

**实际应用：** 智能合约钱包（如 Gnosis Safe）

```solidity
// 用户可以在创建钱包前就知道地址
// 1. 计算钱包地址
address walletAddress = factory.computeAddress(userAddress);

// 2. 用户向这个地址充值（钱包还不存在）
payable(walletAddress).transfer(1 ether);

// 3. 只有在需要提取资金时才创建钱包
factory.createWallet(userAddress);

// 4. 节省 gas：如果不需要提取，永远不部署
```

### 场景 3：最小代理合约（EIP-1167）

**需求：** 低成本部署大量相同逻辑的合约

```solidity
// 实现合约（只部署一次）
contract Implementation {
    address public owner;
    uint256 public value;

    function initialize(address _owner, uint256 _value) public {
        owner = _owner;
        value = _value;
    }
}

// 工厂合约（使用 CREATE2 部署代理）
contract ProxyFactory {
    address public implementation;

    constructor(address _implementation) {
        implementation = _implementation;
    }

    // 使用 CREATE2 部署最小代理
    function createProxy(bytes32 salt) public returns (address proxy) {
        // 最小代理字节码（只有 45 字节）
        bytes memory code = abi.encodePacked(
            hex"3d602d80600a3d3981f3363d3d373d3d3d363d73",
            implementation,
            hex"5af43d82803e903d91602b57fd5bf3"
        );

        assembly {
            proxy := create2(0, add(code, 32), mload(code), salt)
        }

        // 初始化代理
        Implementation(proxy).initialize(msg.sender, 100);
    }

    // 预测代理地址
    function computeProxyAddress(bytes32 salt) public view returns (address) {
        bytes memory code = abi.encodePacked(
            hex"3d602d80600a3d3981f3363d3d373d3d3d363d73",
            implementation,
            hex"5af43d82803e903d91602b57fd5bf3"
        );

        return address(uint160(uint256(keccak256(abi.encodePacked(
            bytes1(0xff),
            address(this),
            salt,
            keccak256(code)
        )))));
    }
}
```

**实际应用：** OpenZeppelin Clones

```typescript
import "@openzeppelin/contracts/proxy/Clones.sol";

contract NFTFactory {
    address public nftImplementation;

    // 为每个用户创建 NFT 合约
    function createNFT(string memory name, string memory symbol) public {
        // 使用 CREATE2 部署最小代理
        bytes32 salt = keccak256(abi.encodePacked(msg.sender, name));
        address clone = Clones.cloneDeterministic(nftImplementation, salt);

        // 初始化
        NFT(clone).initialize(name, symbol, msg.sender);
    }

    // 预测 NFT 地址
    function predictNFTAddress(address creator, string memory name) public view returns (address) {
        bytes32 salt = keccak256(abi.encodePacked(creator, name));
        return Clones.predictDeterministicAddress(nftImplementation, salt);
    }
}
```

### 场景 4：状态通道和 Layer 2

**需求：** 链下计算地址，链上按需部署

```solidity
// 状态通道合约
contract StateChannel {
    address public participant1;
    address public participant2;

    constructor(address _p1, address _p2) {
        participant1 = _p1;
        participant2 = _p2;
    }

    function settle(/* 签名和状态 */) public {
        // 结算逻辑
    }
}

// 工厂合约
contract ChannelFactory {
    // 打开通道（链下计算地址，不部署）
    function openChannel(address p1, address p2) public pure returns (address) {
        bytes32 salt = keccak256(abi.encodePacked(p1, p2));
        bytes memory bytecode = type(StateChannel).creationCode;
        bytecode = abi.encodePacked(bytecode, abi.encode(p1, p2));

        // 只计算地址，不部署
        return address(uint160(uint256(keccak256(abi.encodePacked(
            bytes1(0xff),
            address(this),
            salt,
            keccak256(bytecode)
        )))));
    }

    // 只有在需要链上结算时才部署
    function deployAndSettle(address p1, address p2, /* 状态 */) public {
        bytes32 salt = keccak256(abi.encodePacked(p1, p2));

        StateChannel channel = new StateChannel{salt: salt}(p1, p2);
        channel.settle(/* 状态 */);
    }
}

// 使用流程：
// 1. Alice 和 Bob 打开通道（链下）
//    channelAddress = factory.openChannel(alice, bob)
//    → 不消耗 gas
//
// 2. Alice 和 Bob 在链下交易（使用 channelAddress）
//    → 不消耗 gas
//
// 3. 需要结算时才部署合约
//    factory.deployAndSettle(alice, bob, finalState)
//    → 只在需要时消耗 gas
```

### 场景 5：升级机制

**需求：** 预先知道新版本合约地址

```solidity
contract UpgradeableFactory {
    mapping(bytes32 => address) public implementations;

    // 部署新版本（使用版本号作为 salt）
    function deployVersion(uint256 version, bytes memory bytecode) public {
        bytes32 salt = bytes32(version);

        address impl;
        assembly {
            impl := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }

        implementations[salt] = impl;
    }

    // 预测未来版本的地址
    function predictVersion(uint256 version, bytes memory bytecode) public view returns (address) {
        bytes32 salt = bytes32(version);
        return address(uint160(uint256(keccak256(abi.encodePacked(
            bytes1(0xff),
            address(this),
            salt,
            keccak256(bytecode)
        )))));
    }
}

// 使用：
// 1. 部署 v1
factory.deployVersion(1, v1Bytecode);
// → 0x1111...

// 2. 在 v1 中硬编码 v2 地址（v2 还不存在）
address v2Address = factory.predictVersion(2, v2Bytecode);
// → 0x2222...

// 3. v1 可以安全地引用 v2
contract V1 {
    address public nextVersion = 0x2222...; // 预先知道
}

// 4. 稍后部署 v2
factory.deployVersion(2, v2Bytecode);
// → 地址确实是 0x2222...
```

### 场景 6：游戏和 NFT

**需求：** 为每个 NFT 部署独立的合约

```solidity
contract PetFactory {
    // 为每个 tokenId 创建独立的宠物合约
    function createPet(uint256 tokenId, string memory name) public {
        bytes32 salt = bytes32(tokenId);

        Pet pet = new Pet{salt: salt}(name, msg.sender);

        // 地址是确定的：相同的 tokenId = 相同的地址
    }

    // 查询宠物地址（不需要存储）
    function getPetAddress(uint256 tokenId) public view returns (address) {
        bytes32 salt = bytes32(tokenId);
        bytes memory bytecode = type(Pet).creationCode;
        // 注意：这里简化了，实际需要包含构造函数参数

        return address(uint160(uint256(keccak256(abi.encodePacked(
            bytes1(0xff),
            address(this),
            salt,
            keccak256(bytecode)
        )))));
    }
}

// 优势：
// 1. 不需要 mapping 存储 tokenId → address
// 2. 节省存储成本
// 3. 地址可以离线计算
```

## 📊 CREATE vs CREATE2 对比表

| 特性 | CREATE | CREATE2 |
|------|--------|---------|
| **操作码** | `CREATE` | `CREATE2` |
| **地址依赖** | deployer + nonce | deployer + salt + bytecode |
| **nonce 影响** | ✅ 依赖 | ❌ 不依赖 |
| **地址可预测性** | ❌ 部署前无法准确预测 | ✅ 部署前可准确预测 |
| **跨链地址** | ❌ 不同 | ✅ 相同 |
| **Gas 成本** | 较低 | 略高（+200 gas） |
| **安全性** | 常规 | 需要注意 salt 碰撞 |
| **使用复杂度** | 简单 | 中等 |
| **主要用途** | 普通部署 | 确定性部署、跨链、Layer2 |

## 🔧 完整实现示例

### Solidity 完整示例

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// 要部署的目标合约
contract Wallet {
    address public owner;

    constructor(address _owner) {
        owner = _owner;
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    receive() external payable {}
}

// CREATE2 工厂合约
contract WalletFactory {
    event WalletCreated(address indexed wallet, address indexed owner, bytes32 salt);

    // 使用 CREATE2 部署钱包
    function createWallet(bytes32 salt) public returns (address) {
        // 获取创建字节码
        bytes memory bytecode = type(Wallet).creationCode;

        // 编码构造函数参数
        bytes memory constructorArgs = abi.encode(msg.sender);

        // 拼接字节码和参数
        bytes memory fullBytecode = abi.encodePacked(bytecode, constructorArgs);

        // 使用 CREATE2 部署
        address wallet;
        assembly {
            wallet := create2(
                0,                          // value: 不发送 ETH
                add(fullBytecode, 0x20),   // offset: 跳过长度字段
                mload(fullBytecode),        // size: 字节码长度
                salt                        // salt
            )
        }

        require(wallet != address(0), "Deployment failed");

        emit WalletCreated(wallet, msg.sender, salt);
        return wallet;
    }

    // 预测钱包地址
    function computeWalletAddress(address owner, bytes32 salt) public view returns (address) {
        // 获取字节码
        bytes memory bytecode = type(Wallet).creationCode;
        bytes memory constructorArgs = abi.encode(owner);
        bytes memory fullBytecode = abi.encodePacked(bytecode, constructorArgs);

        // 计算地址
        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff),           // 固定前缀
                address(this),          // 工厂地址
                salt,                   // 盐值
                keccak256(fullBytecode) // 字节码哈希
            )
        );

        return address(uint160(uint256(hash)));
    }

    // 检查钱包是否已部署
    function isDeployed(address wallet) public view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(wallet)
        }
        return size > 0;
    }
}
```

### TypeScript 完整示例

```typescript
import { ethers } from "hardhat";

async function main() {
  // 1. 部署工厂合约
  const WalletFactory = await ethers.getContractFactory("WalletFactory");
  const factory = await WalletFactory.deploy();
  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();
  console.log("Factory deployed to:", factoryAddress);

  // 2. 生成 salt
  const [owner] = await ethers.getSigners();
  const salt = ethers.id("my-wallet-v1"); // 或使用其他方式生成

  // 3. 获取字节码和哈希
  const Wallet = await ethers.getContractFactory("Wallet");
  const bytecode = Wallet.bytecode;

  // 编码构造函数参数
  const constructorArgs = ethers.AbiCoder.defaultAbiCoder().encode(
    ["address"],
    [owner.address]
  );

  const fullBytecode = bytecode + constructorArgs.slice(2);
  const bytecodeHash = ethers.keccak256(fullBytecode);

  // 4. 预测地址（部署前）
  const predictedAddress = ethers.getCreate2Address(
    factoryAddress,
    salt,
    bytecodeHash
  );
  console.log("Wallet will be deployed to:", predictedAddress);

  // 5. 也可以使用合约的方法预测
  const computedAddress = await factory.computeWalletAddress(owner.address, salt);
  console.log("Computed address:", computedAddress);
  console.log("Addresses match:", predictedAddress === computedAddress);

  // 6. 向预测的地址发送 ETH（合约还不存在）
  await owner.sendTransaction({
    to: predictedAddress,
    value: ethers.parseEther("1.0")
  });
  console.log("Sent 1 ETH to predicted address");

  // 7. 检查余额（即使合约不存在，地址也能接收 ETH）
  const balanceBefore = await ethers.provider.getBalance(predictedAddress);
  console.log("Balance before deployment:", ethers.formatEther(balanceBefore), "ETH");

  // 8. 实际部署合约
  const tx = await factory.createWallet(salt);
  const receipt = await tx.wait();

  // 9. 验证地址
  const event = receipt.logs.find((log: any) => {
    try {
      return factory.interface.parseLog(log)?.name === "WalletCreated";
    } catch {
      return false;
    }
  });

  const deployedAddress = factory.interface.parseLog(event!).args.wallet;
  console.log("Wallet deployed to:", deployedAddress);
  console.log("Prediction was correct:", deployedAddress === predictedAddress);

  // 10. 使用已部署的钱包
  const wallet = await ethers.getContractAt("Wallet", deployedAddress);
  const balance = await wallet.getBalance();
  console.log("Wallet balance:", ethers.formatEther(balance), "ETH");
}

main().catch(console.error);
```

## ⚠️ 注意事项和最佳实践

### 1. Salt 碰撞攻击

```solidity
// ❌ 危险：使用可预测的 salt
function deploy(uint256 id) public {
    bytes32 salt = bytes32(id);
    // 攻击者可以提前部署恶意合约到同一地址
}

// ✅ 安全：使用包含 msg.sender 的 salt
function deploy(uint256 id) public {
    bytes32 salt = keccak256(abi.encodePacked(msg.sender, id));
    // 每个用户有独立的地址空间
}
```

### 2. 字节码必须完全相同

```typescript
// ❌ 错误：编译器版本不同导致字节码不同
// Solidity 0.8.19 编译的字节码 ≠ 0.8.20 编译的字节码

// ✅ 正确：保存完整的字节码（包括元数据）
const bytecode = artifact.bytecode; // 包含完整的编译信息
```

### 3. 构造函数参数的影响

```typescript
// 不同的构造函数参数 = 不同的字节码 = 不同的地址
const bytecode1 = bytecode + encode([owner1]);
const bytecode2 = bytecode + encode([owner2]);

ethers.keccak256(bytecode1) !== ethers.keccak256(bytecode2)
```

### 4. Gas 成本

```solidity
// CREATE:  ~32000 gas
// CREATE2: ~32200 gas (多 200 gas)

// 但如果避免了链上存储，CREATE2 可能更便宜
```

## 🎯 总结

### CREATE2 的三个参数

| 参数 | 来源 | 作用 |
|------|------|------|
| **factoryAddress** | 工厂合约部署后的地址 | 确保不同工厂部署的合约地址不同 |
| **salt** | 自定义的 32 字节值 | 控制部署地址，避免碰撞 |
| **bytecodeHash** | keccak256(合约字节码 + 构造函数参数) | 确保相同代码生成相同地址 |

### 主要使用场景

1. **跨链部署**：相同参数在所有链上生成相同地址
2. **反事实实例化**：先使用地址，后部署合约
3. **最小代理**：低成本部署大量相同逻辑的合约
4. **Layer 2**：链下计算地址，链上按需部署
5. **升级机制**：预先知道未来版本地址
6. **NFT/游戏**：为每个资产部署独立合约

### 关键优势

✅ 地址确定性
✅ 跨链一致性
✅ 节省存储成本
✅ 支持链下计算
✅ 安全的预部署交互

### 相关资源

- [EIP-1014: CREATE2](https://eips.ethereum.org/EIPS/eip-1014)
- [EIP-1167: Minimal Proxy](https://eips.ethereum.org/EIPS/eip-1167)
- [OpenZeppelin Clones](https://docs.openzeppelin.com/contracts/4.x/api/proxy#Clones)
- [Uniswap V3 CREATE2 使用](https://github.com/Uniswap/v3-core)
