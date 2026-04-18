# Pinata IPFS 上传完整操作指南

> 本指南将带你一步步完成 NFT 图片上传到 IPFS 的全过程，通过亲手操作学习整个流程。

## 📋 目录

- [前置准备](#前置准备)
- [步骤1：注册 Pinata 账号](#步骤1注册-pinata-账号)
- [步骤2：获取 API Keys](#步骤2获取-api-keys)
- [步骤3：安装依赖包](#步骤3安装依赖包)
- [步骤4：编写上传脚本](#步骤4编写上传脚本)
- [步骤5：配置环境变量](#步骤5配置环境变量)
- [步骤6：运行脚本上传](#步骤6运行脚本上传)
- [步骤7：验证上传结果](#步骤7验证上传结果)
- [步骤8：更新合约代码](#步骤8更新合约代码)
- [常见问题排查](#常见问题排查)

---

## 前置准备

### ✅ 确认你已准备好的文件

检查 `packages/hardhat/assets/images/` 目录：

```bash
# 执行命令查看文件
ls -lh packages/hardhat/assets/images/

# 应该看到 5 个文件：
# blindbox.png
# common.png
# rare.png
# epic.png
# legendary.png
```

### 📊 你的资源情况

- 图片数量：5 张
- 总大小：约 1.2MB
- Pinata 免费额度：1GB
- 使用率：**0.12%** ✅ 完全够用

---

## 步骤1：注册 Pinata 账号

### 1.1 访问官网

打开浏览器，访问：
```
https://pinata.cloud
```

### 1.2 注册流程

1. 点击页面右上角的 **"Sign Up"** 按钮
2. 选择注册方式：
   - **推荐**：Use GitHub（使用 GitHub 账号，最快）
   - 或：Use Email（使用邮箱注册）

#### 使用 GitHub 注册（推荐）

1. 点击 "Sign up with GitHub"
2. 授权 Pinata 访问你的 GitHub 账号
3. 完成注册，自动跳转到仪表板

#### 使用邮箱注册

1. 输入邮箱地址
2. 设置密码（至少 8 位，包含大小写字母和数字）
3. 勾选同意条款
4. 点击 "Create Account"
5. 去邮箱查收验证邮件
6. 点击邮件中的验证链接
7. 完成注册

### 1.3 选择计划

1. 注册后会让你选择计划
2. **选择 "Free Plan"**（免费计划）
3. 点击 "Get Started"

### ✅ 验证成功

你应该看到 Pinata 的仪表板（Dashboard），包含：
- Files（文件管理）
- Gateways（网关设置）
- API Keys（API 密钥）
- Billing（账单，显示免费计划）

---

## 步骤2：获取 API Keys

### 2.1 进入 API Keys 页面

1. 登录 Pinata 后，点击左侧菜单的 **"API Keys"**
2. 或访问：`https://app.pinata.cloud/developers/api-keys`

### 2.2 创建新的 API Key

1. 点击页面右上角的 **"+ New Key"** 按钮
2. 配置权限（Permissions）：

   **必须勾选的权限**：
   ```
   ✅ pinFileToIPFS      (上传文件到 IPFS)
   ✅ pinJSONToIPFS      (上传 JSON 到 IPFS)
   ```

   **可选权限**（建议不勾选，安全起见）：
   ```
   ☐ unpinContent        (删除文件)
   ☐ pinList             (列出所有文件)
   ☐ userPinnedDataTotal (查看统计)
   ```

3. 给 Key 起个名字：
   ```
   Key Name: StakableNFT Project
   ```

4. 点击 **"Create Key"** 按钮

### 2.3 保存 API Keys

创建后会弹出窗口显示：

```
API Key:        4d8e9f1a2b3c4d5e6f7g8h9i
API Secret:     a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
JWT:            eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3Jt...
```

**⚠️ 非常重要**：
1. **这些信息只显示一次**，关闭后无法再查看
2. **立即复制并保存**到安全的地方
3. 你需要保存的内容：
   - `API Key`（公钥）
   - `API Secret`（私钥）

### 2.4 保存到临时文件

创建一个临时文本文件保存（稍后会配置到 .env）：

```bash
# 在你的电脑上创建临时文件
touch ~/pinata-keys-temp.txt

# 或者用记事本/文本编辑器创建文件，保存以下内容：
```

```text
=== Pinata API Keys ===
创建时间: 2025-11-02

API Key:    你的API_Key
API Secret: 你的API_Secret

注意：这些是机密信息，不要分享给他人！
```

### ✅ 验证成功

在 API Keys 页面应该看到：
- 你刚创建的 Key 名称：**StakableNFT Project**
- 状态：**Active**（绿色）
- 权限：**pinFileToIPFS, pinJSONToIPFS**

---

## 步骤3：安装依赖包

### 3.1 进入项目目录

```bash
# 打开终端，进入 hardhat 目录
cd packages/hardhat

# 验证当前目录
pwd
# 应该显示：.../nft-stake-ponder/packages/hardhat
```

### 3.2 安装 Pinata SDK（两种方式选一种）

#### 方式1：使用 Pinata SDK（推荐，更简单）

```bash
yarn add @pinata/sdk
```

#### 方式2：使用基础 HTTP 请求（更灵活）

```bash
yarn add axios form-data
```

**💡 建议**：选择**方式1**（Pinata SDK），因为：
- ✅ 官方提供，更稳定
- ✅ API 更简单易用
- ✅ 自动处理很多细节

### 3.3 验证安装

```bash
# 检查是否安装成功
yarn list @pinata/sdk

# 应该看到类似输出：
# └─ @pinata/sdk@2.x.x
```

### 3.4 安装类型定义（TypeScript 项目）

```bash
# 如果使用 TypeScript，还需要安装类型定义
yarn add -D @types/node
```

### ✅ 验证成功

- `package.json` 中应该有 `@pinata/sdk` 依赖
- `node_modules/` 中有 `@pinata` 文件夹

---

## 步骤4：编写上传脚本

### 4.1 创建脚本文件

```bash
# 在 scripts 目录下创建新文件
touch packages/hardhat/scripts/


# 或者在 VSCode 中手动创建文件
```

文件路径：
```
packages/hardhat/scripts/uploadToPinata.ts
```

### 4.2 脚本结构说明

你需要编写的脚本包含以下部分：

#### 📦 导入依赖

```typescript
// 需要导入的模块：
// 1. Pinata SDK
// 2. Node.js 文件系统模块 (fs)
// 3. Node.js 路径模块 (path)
```

#### 🔑 读取 API Keys

```typescript
// 从环境变量读取：
// - PINATA_API_KEY
// - PINATA_SECRET_KEY
//
// 如果没有配置，抛出错误提示
```

#### 🚀 主函数逻辑

```typescript
async function uploadImages() {
  // 1. 创建 Pinata 客户端实例

  // 2. 测试 API 连接是否正常

  // 3. 定义要上传的图片文件列表
  //    ['blindbox.png', 'common.png', 'rare.png', 'epic.png', 'legendary.png']

  // 4. 创建结果对象，用于保存 CID

  // 5. 循环上传每张图片：
  //    a. 读取文件路径
  //    b. 创建可读流
  //    c. 配置上传选项（文件名等）
  //    d. 调用 Pinata API 上传
  //    e. 获取返回的 CID
  //    f. 保存到结果对象
  //    g. 打印上传进度

  // 6. 保存所有 CID 到 JSON 文件

  // 7. 打印汇总信息
}
```

#### 📝 保存结果

```typescript
// 将结果保存到：
// packages/hardhat/assets/ipfs-cids.json
//
// JSON 格式：
// {
//   "blindbox.png": "ipfs://QmXxx...",
//   "common.png": "ipfs://QmYyy...",
//   ...
// }
```

### 4.3 编码提示

#### Pinata SDK 主要 API

```typescript
// 创建客户端
const pinata = new pinataSDK(apiKey, secretKey);

// 测试连接
const auth = await pinata.testAuthentication();
// 返回: { authenticated: true }

// 上传文件
const result = await pinata.pinFileToIPFS(readableStream, options);
// 返回: { IpfsHash: 'QmXxx...', PinSize: 1234, Timestamp: '...' }
```

#### 文件操作 API

```typescript
// 创建可读流
const stream = fs.createReadStream(filePath);

// 拼接路径
const fullPath = path.join(__dirname, '../assets/images', fileName);

// 写入文件
fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
```

### 4.4 预期输出格式

你的脚本运行时应该输出：

```
🚀 开始上传图片到 Pinata...

✅ Pinata 连接成功: true

📤 正在上传: blindbox.png...
✅ blindbox.png 上传成功！
   CID: QmXxx...
   IPFS URL: ipfs://QmXxx...
   网关访问: https://gateway.pinata.cloud/ipfs/QmXxx...

📤 正在上传: common.png...
✅ common.png 上传成功！
   ...

📝 所有 CID 已保存到: assets/ipfs-cids.json

============================================================
📋 上传结果汇总:

blindbox.png        → ipfs://QmXxx...
common.png          → ipfs://QmYyy...
rare.png            → ipfs://QmZzz...
epic.png            → ipfs://QmAaa...
legendary.png       → ipfs://QmBbb...
============================================================

🎉 上传完成！
```

### 4.5 错误处理

你的脚本需要处理以下错误：

1. **环境变量未设置**
   ```
   Error: 请设置 PINATA_API_KEY 和 PINATA_SECRET_KEY 环境变量
   ```

2. **文件不存在**
   ```
   Error: ENOENT: no such file or directory, open '...'
   ```

3. **API 认证失败**
   ```
   Error: Invalid API credentials
   ```

4. **网络错误**
   ```
   Error: Network error, please check your connection
   ```

### 💡 编码建议

1. **使用 try-catch 包裹上传逻辑**
   - 单个文件失败不应中断整个流程
   - 记录失败的文件

2. **添加详细的日志输出**
   - 便于调试和学习过程
   - 使用 emoji 让输出更友好

3. **保存结果到 JSON 文件**
   - 方便后续使用
   - 可以重复查看而不必重新上传

### 📚 参考资源

- [Pinata SDK 文档](https://docs.pinata.cloud/sdks/pinata-sdk)
- [Node.js fs 模块](https://nodejs.org/api/fs.html)
- [Node.js path 模块](https://nodejs.org/api/path.html)

### ✅ 完成检查

编写完成后，检查：
- [ ] 导入了所有必需的模块
- [ ] 读取环境变量并验证
- [ ] 创建 Pinata 客户端
- [ ] 循环上传所有图片
- [ ] 错误处理完善
- [ ] 保存结果到 JSON 文件
- [ ] 输出清晰的日志信息

---

## 步骤5：配置环境变量

### 5.1 查找 .env 文件

```bash
# 检查 .env 文件是否存在
ls -la packages/hardhat/.env

# 如果不存在，创建它
touch packages/hardhat/.env
```

### 5.2 编辑 .env 文件

使用文本编辑器打开 `packages/hardhat/.env`：

```bash
# 使用 VSCode
code packages/hardhat/.env

# 或使用 nano
nano packages/hardhat/.env

# 或使用 vim
vim packages/hardhat/.env
```

### 5.3 添加 Pinata API Keys

在 `.env` 文件中添加：

```env
# ========================================
# Pinata API Keys
# ========================================
PINATA_API_KEY=你的API_Key
PINATA_SECRET_KEY=你的API_Secret

# ========================================
# 其他已有的环境变量...
# ========================================
```

**⚠️ 注意事项**：
1. **不要有空格**：`PINATA_API_KEY=xxx`（不是 `PINATA_API_KEY = xxx`）
2. **不要用引号**：直接粘贴 Key 值
3. **保持换行**：每个变量占一行

### 5.4 示例（替换为你的真实值）

```env
# 示例（这不是真实的 Key）
PINATA_API_KEY=4d8e9f1a2b3c4d5e6f7g8h9i
PINATA_SECRET_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

### 5.5 验证 .env 文件

```bash
# 查看 .env 文件内容（确认配置正确）
cat packages/hardhat/.env | grep PINATA

# 应该看到：
# PINATA_API_KEY=你的Key
# PINATA_SECRET_KEY=你的Secret
```

### 5.6 安全检查

#### ✅ 确认 .env 在 .gitignore 中

```bash
# 查看 .gitignore 文件
cat packages/hardhat/.gitignore | grep .env

# 应该看到：
# .env
# 或
# *.env
```

如果没有，手动添加：

```bash
# 编辑 .gitignore
echo ".env" >> packages/hardhat/.gitignore
```

#### ⚠️ 避免泄露 API Keys

**永远不要**：
- ❌ 提交 `.env` 文件到 Git
- ❌ 分享 `.env` 文件给他人
- ❌ 在代码中硬编码 API Keys
- ❌ 截图包含 API Keys 的内容

**如果不小心泄露**：
1. 立即到 Pinata 删除旧的 API Key
2. 生成新的 API Key
3. 更新 `.env` 文件

### ✅ 验证成功

- `.env` 文件存在
- 包含正确的 `PINATA_API_KEY` 和 `PINATA_SECRET_KEY`
- `.gitignore` 包含 `.env`

---

## 步骤6：运行脚本上传

### 6.1 最后检查

在运行前确认：

```bash
# 1. 确认在正确的目录
pwd
# 应显示：.../packages/hardhat

# 2. 确认脚本文件存在
ls scripts/uploadToPinata.ts

# 3. 确认图片文件存在
ls assets/images/
# 应显示 5 个 .png 文件

# 4. 确认环境变量已配置
cat .env | grep PINATA
# 应显示两个 Key
```

### 6.2 运行脚本

```bash
# 执行上传脚本
yarn hardhat run scripts/uploadToPinata.ts
```

### 6.3 预期输出

你应该看到类似的输出：

```
🚀 开始上传图片到 Pinata...

✅ Pinata 连接成功: true

📤 正在上传: blindbox.png...
✅ blindbox.png 上传成功！
   CID: QmRBx5YPBK3htbr1pHQ8xKbZXQs6m2QD3ydXwH8RZ4h8Nr
   IPFS URL: ipfs://QmRBx5YPBK3htbr1pHQ8xKbZXQs6m2QD3ydXwH8RZ4h8Nr
   网关访问: https://gateway.pinata.cloud/ipfs/QmRBx5YPBK3htbr1pHQ8xKbZXQs6m2QD3ydXwH8RZ4h8Nr

📤 正在上传: common.png...
✅ common.png 上传成功！
   CID: QmYH8m7uQM5GhxeYVZ5kHx3xKYr8s9D2nB4vX9tA6e3Wqa
   ...

（继续上传其他 3 张图片）

📝 所有 CID 已保存到: assets/ipfs-cids.json

============================================================
📋 上传结果汇总:

blindbox.png        → ipfs://QmRBx5YPBK3htbr1pHQ8xKbZXQs6m2QD3ydXwH8RZ4h8Nr
common.png          → ipfs://QmYH8m7uQM5GhxeYVZ5kHx3xKYr8s9D2nB4vX9tA6e3Wqa
rare.png            → ipfs://QmPzK9tV3xWr7nY4pA8xD2mE6hB5vC9sF1gT4rJ2wL3oNq
epic.png            → ipfs://QmXcB2mN8vT5yR4pE9zD3qW7sA1xC6nF8gV4hK2rJ9oLmP
legendary.png       → ipfs://QmZfG7pQ2wV8xR3nA5yB4zC9mE1tS6rD3hJ8vK7lN4oWqT
============================================================

🎉 上传完成！

📌 下一步：
   1. 查看 assets/ipfs-cids.json 文件
   2. 在浏览器验证图片可访问
   3. 将这些 IPFS URL 更新到智能合约中
```

### 6.4 上传时间

- 每张图片：约 3-10 秒
- 5 张图片总计：约 15-50 秒
- 取决于网络速度

### 6.5 查看生成的结果文件

```bash
# 查看 CID 记录
cat assets/ipfs-cids.json

# 应该看到类似内容：
# {
#   "blindbox.png": "ipfs://QmXxx...",
#   "common.png": "ipfs://QmYyy...",
#   ...
# }
```

### ✅ 验证成功

- 所有 5 张图片上传成功
- 获得 5 个 IPFS CID
- `ipfs-cids.json` 文件已生成
- 没有错误提示

---

## 步骤7：验证上传结果

### 7.1 在 Pinata 仪表板验证

1. 登录 Pinata：https://app.pinata.cloud
2. 点击左侧菜单 **"Files"**
3. 你应该看到 5 个文件：
   - `blindbox.png`
   - `common.png`
   - `rare.png`
   - `epic.png`
   - `legendary.png`

每个文件显示：
- ✅ 文件名
- ✅ CID
- ✅ 大小
- ✅ 上传时间
- ✅ 状态：Pinned（已固定）

### 7.2 在浏览器中查看图片

#### 方式1：使用 Pinata 网关

从 `ipfs-cids.json` 复制 CID，访问：

```
https://gateway.pinata.cloud/ipfs/你的CID

例如：
https://gateway.pinata.cloud/ipfs/QmRBx5YPBK3htbr1pHQ8xKbZXQs6m2QD3ydXwH8RZ4h8Nr
```

#### 方式2：使用公共 IPFS 网关

```
https://ipfs.io/ipfs/你的CID
https://cloudflare-ipfs.com/ipfs/你的CID
https://dweb.link/ipfs/你的CID
```

#### 方式3：批量测试（脚本）

创建一个 HTML 文件测试：

```bash
# 创建测试文件
touch test-ipfs.html
```

```html
<!DOCTYPE html>
<html>
<head>
    <title>IPFS 图片测试</title>
</head>
<body>
    <h1>NFT 图片验证</h1>

    <h2>Blindbox</h2>
    <img src="https://gateway.pinata.cloud/ipfs/你的blindbox_CID" width="300">

    <h2>Common</h2>
    <img src="https://gateway.pinata.cloud/ipfs/你的common_CID" width="300">

    <h2>Rare</h2>
    <img src="https://gateway.pinata.cloud/ipfs/你的rare_CID" width="300">

    <h2>Epic</h2>
    <img src="https://gateway.pinata.cloud/ipfs/你的epic_CID" width="300">

    <h2>Legendary</h2>
    <img src="https://gateway.pinata.cloud/ipfs/你的legendary_CID" width="300">
</body>
</html>
```

在浏览器打开这个 HTML 文件，所有图片都应该正常显示。

### 7.3 验证 IPFS 协议格式

确认你的 CID 格式正确：

```
✅ 正确格式：
ipfs://QmRBx5YPBK3htbr1pHQ8xKbZXQs6m2QD3ydXwH8RZ4h8Nr

❌ 错误格式：
QmRBx5YPBK3htbr1pHQ8xKbZXQs6m2QD3ydXwH8RZ4h8Nr  （缺少协议）
ipfs:/QmRBx...  （少了一个斜杠）
https://gateway.pinata.cloud/ipfs/QmXxx  （这是网关 URL，不是 IPFS URI）
```

### 7.4 测试不同网关的访问速度

对比不同网关的加载速度：

| 网关 | URL | 速度 |
|------|-----|------|
| Pinata | `https://gateway.pinata.cloud/ipfs/CID` | 快 🚀 |
| IPFS.io | `https://ipfs.io/ipfs/CID` | 中等 |
| Cloudflare | `https://cloudflare-ipfs.com/ipfs/CID` | 快 🚀 |
| Dweb.link | `https://dweb.link/ipfs/CID` | 中等 |

**💡 提示**：不同地区访问不同网关的速度可能不同

### ✅ 验证成功标准

- [ ] Pinata 仪表板显示 5 个文件
- [ ] 所有文件状态为 "Pinned"
- [ ] 通过网关能访问所有图片
- [ ] 图片显示正确（与本地文件一致）
- [ ] `ipfs-cids.json` 包含正确的 CID

---

## 步骤8：更新合约代码

### 8.1 打开合约文件

```bash
# 用编辑器打开合约
code packages/hardhat/contracts/StakableNFT.sol

# 或
vim packages/hardhat/contracts/StakableNFT.sol
```

### 8.2 找到需要更新的位置

在合约中找到图片 URI 的定义位置，通常在：
- 构造函数（`constructor`）
- 状态变量定义

### 8.3 更新图片 IPFS URI

#### 示例：如果使用映射（mapping）

```solidity
contract StakableNFT is ERC721 {
    // 盲盒图片
    string constant BLINDBOX_IMAGE = "ipfs://你的blindbox_CID";

    // 稀有度图片映射
    mapping(Rarity => string) public rarityImages;

    enum Rarity { Common, Rare, Epic, Legendary }

    constructor() ERC721("StakableNFT", "SNFT") {
        // 从 ipfs-cids.json 复制对应的 CID
        rarityImages[Rarity.Common] = "ipfs://你的common_CID";
        rarityImages[Rarity.Rare] = "ipfs://你的rare_CID";
        rarityImages[Rarity.Epic] = "ipfs://你的epic_CID";
        rarityImages[Rarity.Legendary] = "ipfs://你的legendary_CID";
    }
}
```

### 8.4 复制 CID 的正确方式

打开 `assets/ipfs-cids.json`：

```json
{
  "blindbox.png": "ipfs://QmRBx5YPBK3htbr1pHQ8xKbZXQs6m2QD3ydXwH8RZ4h8Nr",
  "common.png": "ipfs://QmYH8m7uQM5GhxeYVZ5kHx3xKYr8s9D2nB4vX9tA6e3Wqa",
  ...
}
```

**逐个复制到合约中**：

```solidity
string constant BLINDBOX_IMAGE = "ipfs://QmRBx5YPBK3htbr1pHQ8xKbZXQs6m2QD3ydXwH8RZ4h8Nr";

rarityImages[Rarity.Common] = "ipfs://QmYH8m7uQM5GhxeYVZ5kHx3xKYr8s9D2nB4vX9tA6e3Wqa";
rarityImages[Rarity.Rare] = "ipfs://QmPzK9tV3xWr7nY4pA8xD2mE6hB5vC9sF1gT4rJ2wL3oNq";
rarityImages[Rarity.Epic] = "ipfs://QmXcB2mN8vT5yR4pE9zD3qW7sA1xC6nF8gV4hK2rJ9oLmP";
rarityImages[Rarity.Legendary] = "ipfs://QmZfG7pQ2wV8xR3nA5yB4zC9mE1tS6rD3hJ8vK7lN4oWqT";
```

### 8.5 验证更新

#### 1. 检查格式

确保：
- ✅ 使用双引号 `"`
- ✅ 包含 `ipfs://` 协议
- ✅ CID 完整（以 `Qm` 或 `baf` 开头）
- ✅ 每行以分号结尾 `;`

#### 2. 编译合约

```bash
cd packages/hardhat
yarn hardhat compile
```

如果有语法错误，编译会失败并提示错误位置。

### 8.6 创建备份

更新合约前建议备份：

```bash
# 备份当前合约
cp contracts/StakableNFT.sol contracts/StakableNFT.sol.backup

# 如果出错，可以恢复：
# cp contracts/StakableNFT.sol.backup contracts/StakableNFT.sol
```

### ✅ 验证成功

- [ ] 所有 IPFS URI 已更新到合约
- [ ] 合约编译成功，无错误
- [ ] CID 格式正确
- [ ] 已创建备份

### 🎯 下一步

现在你可以：
1. 部署合约到测试网
2. 测试 `tokenURI()` 函数
3. 验证 metadata 生成是否正确
4. 在 OpenSea Testnet 查看 NFT

---

## 常见问题排查

### ❌ 问题1：运行脚本时提示 "请设置环境变量"

**原因**：`.env` 文件未配置或配置错误

**解决**：
```bash
# 1. 检查 .env 文件是否存在
ls packages/hardhat/.env

# 2. 检查内容
cat packages/hardhat/.env | grep PINATA

# 3. 确保格式正确（没有空格，没有引号）
PINATA_API_KEY=xxx  ✅
PINATA_API_KEY = xxx  ❌（有空格）
PINATA_API_KEY="xxx"  ❌（有引号）
```

### ❌ 问题2：上传时提示 "Invalid API credentials"

**原因**：API Key 错误或已失效

**解决**：
1. 登录 Pinata，检查 API Key 状态
2. 如果 Key 被删除，重新创建
3. 复制新的 Key 到 `.env`
4. 重新运行脚本

### ❌ 问题3：提示 "ENOENT: no such file or directory"

**原因**：图片文件路径错误

**解决**：
```bash
# 检查图片是否存在
ls packages/hardhat/assets/images/

# 检查脚本中的路径拼接
# 应该是：
const imagePath = path.join(__dirname, '../assets/images', fileName);
```

### ❌ 问题4：上传成功但图片无法访问

**原因**：网关未同步或网络问题

**解决**：
1. 等待 1-2 分钟（IPFS 需要传播时间）
2. 尝试不同的网关：
   - Pinata: `https://gateway.pinata.cloud/ipfs/CID`
   - IPFS.io: `https://ipfs.io/ipfs/CID`
3. 检查 CID 是否正确复制

### ❌ 问题5：脚本运行很慢或超时

**原因**：网络问题或 Pinata 服务器繁忙

**解决**：
1. 检查网络连接
2. 稍后重试
3. 如果使用代理，可能需要配置：
```bash
# 设置代理（如果需要）
export HTTP_PROXY=http://127.0.0.1:7890
export HTTPS_PROXY=http://127.0.0.1:7890
```

### ❌ 问题6：TypeScript 编译错误

**原因**：类型定义缺失

**解决**：
```bash
# 安装类型定义
yarn add -D @types/node

# 如果还有错误，检查 tsconfig.json
```

---

## 🎓 学习总结

通过这个过程，你学到了：

### 技术知识

1. **IPFS 基础**
   - 内容寻址（CID）
   - Pinning 机制
   - 网关系统

2. **Pinata 平台**
   - API Keys 管理
   - 文件上传
   - 仪表板使用

3. **Node.js 开发**
   - 环境变量配置
   - 文件系统操作
   - 异步编程（async/await）
   - 错误处理

4. **智能合约集成**
   - IPFS URI 格式
   - 合约中的图片引用
   - Metadata 生成

### 最佳实践

1. **安全**
   - API Keys 保护
   - `.env` 文件管理
   - `.gitignore` 配置

2. **代码质量**
   - 错误处理
   - 日志输出
   - 结果保存

3. **工作流程**
   - 步骤化操作
   - 验证机制
   - 备份策略

---

## 📚 参考资源

### 官方文档

- [Pinata 文档](https://docs.pinata.cloud/)
- [Pinata SDK](https://docs.pinata.cloud/sdks/pinata-sdk)
- [IPFS 文档](https://docs.ipfs.tech/)
- [OpenSea Metadata 标准](https://docs.opensea.io/docs/metadata-standards)

### 工具链接

- [Pinata 仪表板](https://app.pinata.cloud/)
- [IPFS 公共网关](https://ipfs.github.io/public-gateway-checker/)
- [CID 检查器](https://cid.ipfs.tech/)

### 社区支持

- [Pinata Discord](https://discord.gg/pinata)
- [IPFS Forum](https://discuss.ipfs.tech/)

---

## ✅ 完成检查清单

最后，确认你完成了所有步骤：

- [ ] 注册 Pinata 账号（Free Plan）
- [ ] 创建并保存 API Keys
- [ ] 安装 `@pinata/sdk` 依赖
- [ ] 编写 `uploadToPinata.ts` 脚本
- [ ] 配置 `.env` 文件
- [ ] 运行脚本上传 5 张图片
- [ ] 获得 5 个 IPFS CID
- [ ] `ipfs-cids.json` 文件已生成
- [ ] 在 Pinata 仪表板验证文件
- [ ] 在浏览器验证图片可访问
- [ ] 更新智能合约的 IPFS URI
- [ ] 合约编译成功

---

**🎉 恭喜！你已经完成了整个 IPFS 上传流程！**

现在你可以继续开发智能合约的其他功能了。

如果遇到任何问题，参考本文档的"常见问题排查"部分，或者查阅官方文档。

---

**创建日期**: 2025-11-02
**最后更新**: 2025-11-02
**作者**: Claude Code Learning Guide
