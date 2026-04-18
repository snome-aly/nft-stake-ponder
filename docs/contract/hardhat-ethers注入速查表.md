# Hardhat 扩展 ethers 方法速查表

本文档总结 Hardhat 在 ethers.js 上的主要扩展功能，方便在编写测试与脚本时快速查阅。

## 一、账户与签名者

### `ethers.getSigners()`
返回 Hardhat 本地网络的 20 个测试账户（Signer 对象）。
```ts
const [owner, user1, user2] = await ethers.getSigners();
console.log(await owner.getAddress());
```

### `ethers.getImpersonatedSigner(address)`
在 fork 主网或测试环境中模拟任意地址。
```ts
const whale = await ethers.getImpersonatedSigner("0xabc123...");
await token.connect(whale).transfer(user.address, 1000);
```

---

## 二、合约部署与交互

### `ethers.getContractFactory(name)`
获取已编译合约的工厂对象，可用于部署。
```ts
const NFT = await ethers.getContractFactory("StakableNFT");
const nft = await NFT.deploy();
```

### `ethers.deployContract(name, args?, overrides?)`
（ethers v6 支持）快速部署合约。
```ts
const nft = await ethers.deployContract("StakableNFT", ["My NFT", "MNFT"]);
```

### `ethers.getContractAt(nameOrAbi, address, signer?)`
连接到已部署的合约实例。
```ts
const nft = await ethers.getContractAt("StakableNFT", "0x1234...");
await nft.mint(1);
```

---

## 三、Provider 相关

### `ethers.provider`
Hardhat 内置的本地网络 Provider。
```ts
const block = await ethers.provider.getBlockNumber();
console.log("当前区块号:", block);
```

---

## 四、测试工具辅助

- 所有 `getContractFactory`、`getContractAt` 方法会自动读取 `artifacts` 编译产物。
- 所有 Signer 都内置 10000 ETH 余额。
- `ethers.getImpersonatedSigner()` 可与 `hardhat_reset`、`hardhat_impersonateAccount` 配合，用于主网 fork 测试。

---

## 五、与原生 ethers.js 的区别总结

| 功能 | 原生 ethers.js | Hardhat ethers |
|------|----------------|----------------|
| 获取账户 | ❌ 需手动导入私钥 | ✅ `getSigners()` |
| 快速部署 | ❌ 手动构造 factory | ✅ `getContractFactory()` / `deployContract()` |
| 模拟账户 | ❌ 不支持 | ✅ `getImpersonatedSigner()` |
| Provider | 需手动配置 | 自动连接 Hardhat 网络 |
| ABI / Bytecode | 需手动导入 | 自动从编译结果读取 |

---

**推荐实践：**
- 测试环境中始终使用 `import { ethers } from "hardhat";`
- 脚本中若需连接真实网络，可用原生 `ethers` 并手动配置 Provider。

---