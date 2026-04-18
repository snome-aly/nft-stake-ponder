# Web3 钱包技术实现对比指南

> 完整解析 7 种主流 Web3 钱包的技术原理、连接方式和使用场景

## 📚 目录

- [概述](#概述)
- [1. MetaMask - 浏览器扩展钱包](#1-metamask---浏览器扩展钱包)
- [2. WalletConnect - 桥接协议](#2-walletconnect---桥接协议)
- [3. Ledger - 硬件钱包](#3-ledger---硬件钱包)
- [4. Coinbase Wallet - 混合钱包](#4-coinbase-wallet---混合钱包)
- [5. Rainbow - 移动端优先钱包](#5-rainbow---移动端优先钱包)
- [6. Safe (Gnosis Safe) - 多签智能合约钱包](#6-safe-gnosis-safe---多签智能合约钱包)
- [7. Burner Wallet - 临时开发钱包](#7-burner-wallet---临时开发钱包)
- [技术架构对比](#技术架构对比)
- [选择建议](#选择建议)

---

## 概述

在 Web3 应用开发中，钱包连接是用户与区块链交互的第一步。不同的钱包有不同的技术实现、安全模型和使用场景。本文将深入分析 7 种主流钱包的技术原理。

### 钱包分类

```
Web3 钱包
├── 浏览器扩展钱包
│   ├── MetaMask
│   └── Coinbase Wallet Extension
├── 移动端钱包
│   ├── Rainbow
│   ├── Trust Wallet
│   └── Argent
├── 硬件钱包
│   ├── Ledger
│   └── Trezor
├── 智能合约钱包
│   └── Safe (Gnosis Safe)
├── 桥接协议
│   └── WalletConnect
└── 开发工具
    └── Burner Wallet
```

---

## 1. MetaMask - 浏览器扩展钱包

### 基本信息

| 属性 | 值 |
|------|----|
| **类型** | 浏览器扩展钱包 |
| **市场占有率** | #1 (最流行) |
| **支持平台** | Chrome、Firefox、Brave、Edge + 移动端 App |
| **用户数** | 3000万+ |
| **开源** | 是 |

### 技术原理

#### 1. 注入机制

MetaMask 通过浏览器扩展注入 `window.ethereum` 对象到每个网页：

```javascript
// MetaMask 扩展在页面加载时执行
// content-script.js
const provider = {
  isMetaMask: true,
  request: async ({ method, params }) => {
    // 将请求发送到 background script
    return chrome.runtime.sendMessage({
      method,
      params,
    });
  },
  on: (event, callback) => {
    // 事件监听
    eventEmitter.on(event, callback);
  },
};

// 注入到页面
window.ethereum = provider;
```

#### 2. 连接流程

```javascript
class MetaMaskConnector {
  async connect() {
    // 步骤 1: 检测 MetaMask 是否安装
    if (!window.ethereum?.isMetaMask) {
      throw new Error('Please install MetaMask!');
    }

    // 步骤 2: 请求用户授权
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });

    // 步骤 3: 设置事件监听
    window.ethereum.on('accountsChanged', (accounts) => {
      console.log('Account changed:', accounts[0]);
      this.handleAccountChange(accounts);
    });

    window.ethereum.on('chainChanged', (chainId) => {
      console.log('Chain changed:', chainId);
      // 刷新页面（MetaMask 推荐）
      window.location.reload();
    });

    // 步骤 4: 返回第一个账户地址
    return accounts[0];
  }

  // 签名消息
  async signMessage(message) {
    const accounts = await window.ethereum.request({
      method: 'eth_accounts'
    });

    return window.ethereum.request({
      method: 'personal_sign',
      params: [message, accounts[0]]
    });
  }

  // 发送交易
  async sendTransaction(tx) {
    return window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [tx]
    });
  }
}
```

#### 3. 数据流图

```
┌─────────────────────────────────────────────────────────┐
│ Web Page (dApp)                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ window.ethereum.request({ method: 'eth_...' })     │ │
│ └──────────────────────┬──────────────────────────────┘ │
└────────────────────────┼────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ MetaMask Extension (Content Script)                     │
│ - 接收请求                                               │
│ - 验证来源                                               │
│ - 转发到 Background Script                              │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│ MetaMask Background Script                              │
│ - 检查权限                                               │
│ - 显示确认弹窗                                           │
│ - 用加密的私钥签名                                        │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│ User Confirmation Popup                                 │
│ - 用户查看交易详情                                        │
│ - 批准/拒绝                                              │
└──────────────────────┬──────────────────────────────────┘
                       ↓
                    Result
                       ↓
                 返回给 dApp
```

### 私钥管理

```javascript
// 私钥加密存储在浏览器扩展的 storage 中
// 伪代码示例
class KeyringController {
  async createNewVault(password) {
    // 1. 生成助记词
    const mnemonic = bip39.generateMnemonic();

    // 2. 从助记词派生私钥
    const seed = await bip39.mnemonicToSeed(mnemonic);
    const hdWallet = hdkey.fromMasterSeed(seed);
    const wallet = hdWallet.derivePath("m/44'/60'/0'/0/0");
    const privateKey = wallet.privateKey;

    // 3. 使用密码加密私钥
    const encryptedVault = await this.encryptor.encrypt(
      password,
      { mnemonic, privateKey }
    );

    // 4. 存储加密后的数据
    await chrome.storage.local.set({ vault: encryptedVault });
  }

  async unlockVault(password) {
    // 1. 读取加密的 vault
    const { vault } = await chrome.storage.local.get('vault');

    // 2. 使用密码解密
    const decryptedVault = await this.encryptor.decrypt(
      password,
      vault
    );

    // 3. 在内存中保存解密后的私钥
    this.privateKey = decryptedVault.privateKey;

    // 4. 设置自动锁定计时器
    this.startAutoLockTimer();
  }
}
```

### 安全特性

1. **密码保护**
   - 私钥用用户密码加密
   - 关闭浏览器后自动锁定

2. **权限系统**
   - 每个网站需要单独授权
   - 可以撤销已授权的网站

3. **交易确认**
   - 每笔交易都需要用户确认
   - 显示 Gas 费估算

4. **网络隔离**
   - 主网和测试网分离
   - 防止误操作

### 使用场景

✅ **适合：**
- 日常 DeFi 交易
- NFT 购买和交易
- 桌面端 Web 应用
- 新手用户（最熟悉）

❌ **不适合：**
- 移动端浏览器（体验差）
- 高价值资产长期存储（建议用硬件钱包）
- 需要离线签名的场景

### 优缺点

| 优点 | 缺点 |
|------|------|
| ✅ 用户基数最大（3000万+）| ❌ 需要安装浏览器扩展 |
| ✅ 集成简单，开发友好 | ❌ 移动端体验较差 |
| ✅ 社区支持完善 | ❌ 单点故障（扩展被封禁）|
| ✅ 功能丰富（Swap、Bridge 等）| ❌ 安全性依赖浏览器环境 |
| ✅ 支持多链（Ethereum、Polygon 等）| ❌ 浏览器漏洞可能影响安全 |

---

## 2. WalletConnect - 桥接协议

### 基本信息

| 属性 | 值 |
|------|----|
| **类型** | 开放协议（不是钱包本身）|
| **版本** | WalletConnect v2 |
| **支持钱包** | 300+ (Trust、Rainbow、Argent 等) |
| **开源** | 是 |

### 核心概念

> **WalletConnect 不是一个钱包，而是一个连接协议。**
> 它允许桌面端 dApp 与移动端钱包安全通信。

### 技术原理

#### 1. 架构设计

```
┌──────────────────┐                    ┌──────────────────┐
│  Desktop dApp    │                    │  Mobile Wallet   │
│  (浏览器)         │                    │  (Trust/Rainbow) │
└────────┬─────────┘                    └────────┬─────────┘
         │                                       │
         │ 1. 生成配对 URI                        │
         │    wc:abc123...                       │
         │                                       │
         │ 2. 显示 QR Code                       │
         │    ████████                           │
         │    ████████                           │
         │                                       │
         │                                       │ 3. 扫描 QR
         │                                       │
         ↓                                       ↓
┌───────────────────────────────────────────────────────────┐
│           Relay Server (wss://relay.walletconnect.com)   │
│  - WebSocket 连接                                          │
│  - 端到端加密（ChaCha20-Poly1305）                         │
│  - 消息中转（不存储私钥）                                   │
└───────────────────────────────────────────────────────────┘
         ↕                                       ↕
     所有后续通信通过 Relay Server 中转
     - eth_sendTransaction
     - personal_sign
     - eth_signTypedData
     - 等等...
```

#### 2. 连接流程代码

```javascript
import { SignClient } from '@walletconnect/sign-client';

class WalletConnectConnector {
  async connect() {
    // 步骤 1: 初始化 SignClient
    this.client = await SignClient.init({
      projectId: 'YOUR_PROJECT_ID', // 从 cloud.walletconnect.com 获取
      relayUrl: 'wss://relay.walletconnect.com',
      metadata: {
        name: 'My dApp',
        description: 'My dApp description',
        url: 'https://mydapp.com',
        icons: ['https://mydapp.com/icon.png']
      }
    });

    // 步骤 2: 创建配对请求
    const { uri, approval } = await this.client.connect({
      // 必需的命名空间（EIP-155 = Ethereum）
      requiredNamespaces: {
        eip155: {
          methods: [
            'eth_sendTransaction',
            'eth_signTransaction',
            'eth_sign',
            'personal_sign',
            'eth_signTypedData',
          ],
          chains: ['eip155:1'], // Ethereum mainnet
          events: ['chainChanged', 'accountsChanged']
        }
      }
    });

    // 步骤 3: 显示 QR Code
    if (uri) {
      this.showQRCodeModal(uri);
      console.log('Scan this URI:', uri);
    }

    // 步骤 4: 等待移动端钱包批准
    const session = await approval();
    console.log('Connected!', session);

    // 步骤 5: 提取账户地址
    const accounts = session.namespaces.eip155.accounts;
    // 格式: "eip155:1:0xABC..." -> "0xABC..."
    const address = accounts[0].split(':')[2];

    // 步骤 6: 监听断开连接
    this.client.on('session_delete', () => {
      console.log('Session disconnected');
      this.handleDisconnect();
    });

    return address;
  }

  // 发送交易
  async sendTransaction(tx) {
    const result = await this.client.request({
      topic: this.session.topic, // 会话 ID
      chainId: 'eip155:1',
      request: {
        method: 'eth_sendTransaction',
        params: [tx]
      }
    });

    return result; // 返回交易哈希
  }

  // 签名消息
  async signMessage(message) {
    const result = await this.client.request({
      topic: this.session.topic,
      chainId: 'eip155:1',
      request: {
        method: 'personal_sign',
        params: [message, this.address]
      }
    });

    return result;
  }

  // 断开连接
  async disconnect() {
    await this.client.disconnect({
      topic: this.session.topic,
      reason: {
        code: 6000,
        message: 'User disconnected'
      }
    });
  }
}
```

#### 3. 配对过程详解

```
时间线:

T0: dApp 生成配对 URI
    ├─ 包含会话提案
    ├─ 公钥（用于加密）
    └─ 中继服务器地址

T1: dApp 显示 QR Code
    URI: wc:abc123@2?relay-protocol=irn&symKey=xyz789

T2: 用户扫描 QR Code
    ├─ 移动端钱包解析 URI
    ├─ 连接到中继服务器
    └─ 获取会话提案

T3: 移动端钱包显示批准界面
    ├─ dApp 名称: "My dApp"
    ├─ 请求权限: [eth_sendTransaction, personal_sign, ...]
    └─ 链: Ethereum Mainnet

T4: 用户批准
    ├─ 钱包发送批准消息（加密）
    ├─ 通过中继服务器发送给 dApp
    └─ 会话建立

T5: 后续所有请求
    dApp → Relay Server → Wallet
    Wallet → Relay Server → dApp
```

#### 4. 端到端加密

```javascript
// WalletConnect 使用对称密钥加密
class Crypto {
  // 生成共享密钥
  generateKeyPair() {
    const keyPair = crypto.generateKeyPairSync('x25519');
    return keyPair;
  }

  // 加密消息
  encrypt(message, sharedKey) {
    const iv = crypto.randomBytes(12); // 初始化向量
    const cipher = crypto.createCipheriv(
      'chacha20-poly1305',
      sharedKey,
      iv
    );

    const encrypted = Buffer.concat([
      cipher.update(message, 'utf8'),
      cipher.final()
    ]);

    const tag = cipher.getAuthTag();

    return {
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      data: encrypted.toString('hex')
    };
  }

  // 解密消息
  decrypt(encrypted, sharedKey) {
    const decipher = crypto.createDecipheriv(
      'chacha20-poly1305',
      sharedKey,
      Buffer.from(encrypted.iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(encrypted.tag, 'hex'));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encrypted.data, 'hex')),
      decipher.final()
    ]);

    return decrypted.toString('utf8');
  }
}
```

**重要：中继服务器看不到消息内容！**
```
┌──────────────────────────────────────────────────────────┐
│ Relay Server 只能看到:                                    │
│ - 加密的消息 (无法解密)                                    │
│ - 会话 ID (topic)                                        │
│ - 消息大小                                                │
│ - 时间戳                                                  │
│                                                          │
│ Relay Server 看不到:                                      │
│ - 私钥 ❌                                                 │
│ - 明文消息 ❌                                             │
│ - 交易内容 ❌                                             │
│ - 签名 ❌                                                 │
└──────────────────────────────────────────────────────────┘
```

### WebSocket 通信：完整的交互时间线

以下是从连接建立到交易执行的完整过程，包含 WebSocket 通信和 `await approval()` 的实现原理：

```
T0: dApp 初始化
    ├─ 建立 WebSocket 连接: wss://relay.walletconnect.com
    ├─ 连接状态: CONNECTED ✓
    ├─ 生成 topic: 'abc123' (32 字节随机数)
    ├─ 生成 symKey: 'xyz789' (对称加密密钥)
    └─ 发送订阅请求:
        {
          type: 'subscribe',
          topic: 'abc123'
        }

T1: dApp 显示 QR Code
    ├─ 构建 URI: wc:abc123@2?relay-protocol=irn&symKey=xyz789
    ├─ 生成 QR Code 图像
    ├─ 创建 approvalPromise = new Promise((resolve) => {...})
    │   └─ Promise 状态: PENDING (等待 resolve)
    ├─ 在界面显示: "请用钱包扫描 QR Code"
    └─ 代码执行到: const session = await approval();
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        在这里阻塞等待！

T2: 钱包扫码
    ├─ 用户打开 Trust Wallet / Rainbow
    ├─ 点击 "扫描 QR Code"
    ├─ 摄像头扫描 QR Code
    ├─ 解析 URI:
    │   ├─ topic: 'abc123'
    │   ├─ symKey: 'xyz789'
    │   └─ relay: 'wss://relay.walletconnect.com'
    ├─ 钱包建立 WebSocket 连接 (同一个 Relay Server)
    └─ 钱包发送订阅请求:
        {
          type: 'subscribe',
          topic: 'abc123'  // ← 与 dApp 相同的 topic
        }

T3: Relay Server 状态
    ├─ topic 'abc123' 现在有 2 个订阅者:
    │   ├─ dApp (WebSocket 连接 #1)
    │   └─ 钱包 (WebSocket 连接 #2)
    └─ 准备双向转发消息

T4: 钱包显示批准界面
    ├─ 钱包向 Relay 请求会话提案
    ├─ Relay 转发 dApp 的提案给钱包
    ├─ 钱包解密并显示:
    │   ┌────────────────────────────┐
    │   │ 连接请求                    │
    │   │ dApp: My dApp              │
    │   │ 网站: https://mydapp.com   │
    │   │ 权限:                       │
    │   │  • 查看账户地址              │
    │   │  • 请求交易批准              │
    │   │  • 签名消息                 │
    │   │                            │
    │   │ [拒绝]  [批准]             │
    │   └────────────────────────────┘
    └─ 等待用户操作...

T5: 用户点击 "批准"
    ├─ 钱包构建批准消息:
    │   {
    │     method: 'wc_sessionSettle',
    │     params: {
    │       accounts: ['eip155:1:0xUSER_ADDRESS'],
    │       methods: ['eth_sendTransaction', 'personal_sign'],
    │       events: ['chainChanged', 'accountsChanged']
    │     }
    │   }
    ├─ 用 symKey 加密消息:
    │   encrypted = encrypt(message, 'xyz789')
    ├─ 钱包发送到 Relay Server:
    │   {
    │     type: 'publish',
    │     topic: 'abc123',
    │     payload: {
    │       iv: 'random12bytes',
    │       tag: 'authTag16bytes',
    │       data: '<encrypted_binary_data>'
    │     }
    │   }
    └─ WebSocket.send() 发送完成

T6: Relay Server 转发消息
    ├─ 接收到钱包的 publish 请求
    ├─ 查找 topic 'abc123' 的订阅者
    ├─ 找到 dApp 的 WebSocket 连接 #1
    ├─ 转发加密消息给 dApp:
    │   {
    │     topic: 'abc123',
    │     payload: {
    │       iv: '...',
    │       tag: '...',
    │       data: '<encrypted_binary_data>'
    │     }
    │   }
    └─ 注意: Relay Server 看不到明文内容！

T7: dApp 收到批准消息
    ├─ WebSocket.onmessage 事件触发
    ├─ 接收到加密的 payload
    ├─ 用 symKey 解密:
    │   message = decrypt(payload, 'xyz789')
    ├─ 解析消息:
    │   {
    │     method: 'wc_sessionSettle',
    │     params: {
    │       accounts: ['eip155:1:0xUSER_ADDRESS'],
    │       ...
    │     }
    │   }
    ├─ 识别到批准消息！
    ├─ 查找 topic 'abc123' 对应的 pending approval
    ├─ 调用 Promise 的 resolve:
    │   pending.resolve(message.params)
    │   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    │   这里触发 Promise 完成！
    └─ 清理 pending approval

T8: dApp 代码继续执行
    ├─ await approval() 返回 ✓
    ├─ 获得 session 数据:
    │   {
    │     accounts: ['eip155:1:0xUSER_ADDRESS'],
    │     methods: [...],
    │     events: [...]
    │   }
    ├─ 提取账户地址: 0xUSER_ADDRESS
    ├─ 保存会话信息
    ├─ 在界面显示: "已连接: 0xUSER_ADDRESS"
    └─ console.log('✅ Connected to wallet!');

T9: 后续交易请求（以发送交易为例）
    ├─ dApp 代码:
    │   await walletConnect.sendTransaction({
    │     to: '0xRECIPIENT',
    │     value: '1000000000000000000' // 1 ETH
    │   });
    ├─ 构建请求消息:
    │   {
    │     method: 'eth_sendTransaction',
    │     params: [{
    │       from: '0xUSER_ADDRESS',
    │       to: '0xRECIPIENT',
    │       value: '0xde0b6b3a7640000'
    │     }]
    │   }
    ├─ 加密并发送到 Relay
    └─ Relay 转发给钱包

T10: 钱包处理交易请求
    ├─ WebSocket.onmessage 触发
    ├─ 解密消息
    ├─ 识别为交易请求
    ├─ 显示交易确认界面:
    │   ┌────────────────────────────┐
    │   │ 交易请求                    │
    │   │ 发送到: 0xRECI...          │
    │   │ 金额: 1.0 ETH              │
    │   │ Gas 费: ~0.002 ETH         │
    │   │                            │
    │   │ [拒绝]  [确认]             │
    │   └────────────────────────────┘
    └─ 等待用户确认...

T11: 用户确认交易
    ├─ 钱包用私钥签名交易
    ├─ 发送签名后的交易到区块链
    ├─ 获得交易哈希: 0xTX_HASH
    ├─ 构建响应消息:
    │   {
    │     result: '0xTX_HASH'
    │   }
    ├─ 加密并通过 Relay 发送给 dApp
    └─ dApp 收到交易哈希

T12: 会话持续
    ├─ WebSocket 连接保持活跃
    ├─ 双方可以继续交互
    ├─ 如果断开连接:
    │   ├─ 自动重连
    │   └─ 或显示 "连接已断开"
    └─ 用户可以随时断开会话
```

### 关键技术点

#### 1. `await approval()` 的实现

```javascript
// dApp 内部实现
class WalletConnectClient {
  private pendingApprovals = new Map();

  async connect() {
    const topic = generateTopic();
    const symKey = generateSymKey();

    // 创建 Promise
    const approvalPromise = new Promise((resolve, reject) => {
      // 保存 resolve/reject 函数
      this.pendingApprovals.set(topic, { resolve, reject });

      // 5 分钟超时
      setTimeout(() => {
        if (this.pendingApprovals.has(topic)) {
          this.pendingApprovals.delete(topic);
          reject(new Error('Connection timeout'));
        }
      }, 300000);
    });

    // 显示 QR Code
    const uri = `wc:${topic}@2?relay=${relayUrl}&symKey=${symKey}`;
    this.showQRCode(uri);

    // 等待批准（这里会阻塞）
    return {
      uri,
      approval: () => approvalPromise
    };
  }

  // WebSocket 消息处理
  private onRelayMessage(data) {
    const { topic, payload } = data;
    const message = this.decrypt(payload);

    if (message.method === 'wc_sessionSettle') {
      const pending = this.pendingApprovals.get(topic);
      if (pending) {
        // ✅ 调用 resolve，Promise 完成
        pending.resolve(message.params);
        this.pendingApprovals.delete(topic);
      }
    }
  }
}
```

#### 2. WebSocket 双向通信

```javascript
// 连接到 Relay Server
const ws = new WebSocket('wss://relay.walletconnect.com');

// 发送消息
ws.send(JSON.stringify({
  type: 'publish',
  topic: 'abc123',
  payload: encryptedData
}));

// 接收消息
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  handleMessage(data.topic, data.payload);
};
```

#### 3. 端到端加密保证

```
加密流程:
dApp 明文 → encrypt(symKey) → Relay (密文) → Wallet → decrypt(symKey) → 明文

Relay Server 只能看到:
├─ topic: 'abc123'
├─ payload: { iv, tag, data }  ← 密文
└─ 无法解密（没有 symKey）

symKey 只存在于:
├─ dApp (通过 QR Code URI 生成)
└─ 钱包 (通过扫描 QR Code 获取)
```

### 总结

**核心机制：**
1. ✅ WebSocket 实时双向通信
2. ✅ Promise + 事件驱动实现 `await approval()`
3. ✅ Topic 订阅机制路由消息
4. ✅ 端到端加密保护隐私
5. ✅ Relay Server 只转发，不存储

**`await approval()` 不是轮询，而是：**
- Promise 在创建时进入 pending 状态
- WebSocket.onmessage 收到批准消息时调用 resolve
- Promise 完成，await 返回
- 优雅的异步等待机制！



通过 WalletConnect 可以连接到以下钱包：

| 钱包 | 类别 | 特点 |
|------|------|------|
| **Trust Wallet** | 通用钱包 | 支持多链，用户量大 |
| **Rainbow** | NFT 优先 | UI 最好，NFT 展示优秀 |
| **Argent** | 智能合约钱包 | 社交恢复，Gas 代付 |
| **MetaMask Mobile** | 通用钱包 | 桌面端同步 |
| **Coinbase Wallet** | 交易所钱包 | 与交易所集成 |
| **1inch Wallet** | DeFi 优先 | 内置 DEX 聚合 |
| **Ledger Live** | 硬件钱包 | 配合 Ledger 设备 |

### 使用场景

✅ **适合：**
- 桌面 dApp + 移动钱包连接（核心场景）
- 用户已有移动端钱包
- 跨设备操作（手机控制电脑）
- 支持多种钱包的应用

❌ **不适合：**
- 纯移动端应用（直接用钱包浏览器）
- 需要极低延迟的场景（有网络往返）
- 离线环境

### 优缺点

| 优点 | 缺点 |
|------|------|
| ✅ 支持 300+ 钱包 | ❌ 依赖中继服务器（单点故障）|
| ✅ 移动端体验好 | ❌ 连接速度比注入式慢 |
| ✅ 无需安装扩展 | ❌ 需要扫码（多一步操作）|
| ✅ 端到端加密 | ❌ 网络不稳定时可能失败 |
| ✅ 跨平台 | ❌ 中继服务器宕机会影响所有用户 |

---

## 3. Ledger - 硬件钱包

### 基本信息

| 属性 | 值 |
|------|----|
| **类型** | 硬件钱包（冷钱包）|
| **设备** | Ledger Nano S Plus ($79) / Nano X ($149) |
| **安全芯片** | CC EAL5+ 认证 |
| **开源** | 部分开源 |

### 核心原理

> **私钥永远不离开设备！**
> 所有签名操作都在硬件内完成。

### 技术架构

```
┌─────────────────────────────────────────────────────────┐
│ Computer / Phone                                        │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ dApp / Ledger Live                                  │ │
│ │ - 构建交易                                           │ │
│ │ - 显示交易详情                                        │ │
│ └──────────────────┬──────────────────────────────────┘ │
│                    │                                     │
│                    ↓ (通过 USB/蓝牙)                     │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Transport Layer (WebUSB / WebBLE / HID)             │ │
│ │ - 设备通信                                           │ │
│ │ - APDU 协议                                          │ │
│ └──────────────────┬──────────────────────────────────┘ │
└────────────────────┼─────────────────────────────────────┘
                     │
                     ↓ APDU Commands
┌─────────────────────────────────────────────────────────┐
│ Ledger Device                                           │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Display (屏幕)                                       │ │
│ │ - 显示交易信息                                        │ │
│ │ - 等待用户确认                                        │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Ethereum App                                        │ │
│ │ - 解析交易                                           │ │
│ │ - 调用签名                                           │ │
│ └──────────────────┬──────────────────────────────────┘ │
│                    ↓                                     │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Secure Element (安全芯片)                            │ │
│ │ ┌───────────────────────────────────────────────┐   │ │
│ │ │ Private Key (私钥)                            │   │ │
│ │ │ - 永远不离开芯片                               │   │ │
│ │ │ - 签名在芯片内完成                             │   │ │
│ │ └───────────────────────────────────────────────┘   │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                     │
                     ↓ 返回签名
                  回到电脑
```

### 连接代码实现

```javascript
import TransportWebUSB from '@ledgerhq/hw-transport-webusb';
import Eth from '@ledgerhq/hw-app-eth';

class LedgerConnector {
  async connect() {
    try {
      // 步骤 1: 请求访问 USB 设备
      // 浏览器会显示设备选择器
      this.transport = await TransportWebUSB.create();
      console.log('USB device connected');

      // 步骤 2: 创建 Ethereum App 实例
      this.eth = new Eth(this.transport);

      // 步骤 3: 获取第一个账户地址
      // BIP44 路径: m/44'/60'/0'/0/0
      const { address } = await this.eth.getAddress(
        "44'/60'/0'/0/0",
        true // 在设备上显示地址（用户确认）
      );

      console.log('Ledger address:', address);
      return address;

    } catch (error) {
      if (error.message.includes('No device selected')) {
        throw new Error('Please select your Ledger device');
      }
      throw error;
    }
  }

  // 获取多个账户
  async getMultipleAccounts(count = 5) {
    const accounts = [];

    for (let i = 0; i < count; i++) {
      const path = `44'/60'/0'/0/${i}`;
      const { address } = await this.eth.getAddress(path, false);
      accounts.push({ path, address });
    }

    return accounts;
  }

  // 签名交易
  async signTransaction(tx) {
    // 步骤 1: 序列化交易
    const serializedTx = this.serializeTransaction(tx);

    // 步骤 2: 发送到 Ledger 设备
    // 用户需要在设备上查看并确认
    const signature = await this.eth.signTransaction(
      "44'/60'/0'/0/0",
      serializedTx
    );

    // 步骤 3: 组装签名后的交易
    const signedTx = this.combineSignature(tx, signature);
    return signedTx;
  }

  // 签名消息
  async signMessage(message) {
    // EIP-191 个人签名
    const signature = await this.eth.signPersonalMessage(
      "44'/60'/0'/0/0",
      Buffer.from(message).toString('hex')
    );

    return signature;
  }

  // EIP-712 类型化数据签名
  async signTypedData(domain, types, value) {
    // Ledger 支持 EIP-712
    const signature = await this.eth.signEIP712HashedMessage(
      "44'/60'/0'/0/0",
      this.hashTypedData(domain, types, value)
    );

    return signature;
  }

  // 断开连接
  async disconnect() {
    await this.transport.close();
  }
}
```

### APDU 协议

Ledger 使用 APDU（Application Protocol Data Unit）与设备通信：

```javascript
// APDU 命令结构
class APDUCommand {
  constructor(cla, ins, p1, p2, data) {
    this.cla = cla; // 类字节 (0xE0 for Ethereum)
    this.ins = ins; // 指令字节
    this.p1 = p1;   // 参数 1
    this.p2 = p2;   // 参数 2
    this.data = data; // 数据
  }

  serialize() {
    return Buffer.concat([
      Buffer.from([this.cla, this.ins, this.p1, this.p2]),
      Buffer.from([this.data.length]),
      this.data
    ]);
  }
}

// 获取地址的 APDU 命令
const getAddressCommand = new APDUCommand(
  0xE0,        // CLA: Ethereum
  0x02,        // INS: Get Address
  0x00,        // P1: 不在设备上显示
  0x01,        // P2: 返回链码
  pathBuffer   // DATA: BIP44 路径
);

// 签名交易的 APDU 命令
const signTxCommand = new APDUCommand(
  0xE0,        // CLA: Ethereum
  0x04,        // INS: Sign Transaction
  0x00,        // P1: 第一个数据块
  0x00,        // P2: 保留
  txData       // DATA: 交易数据
);
```

### 用户交互流程

```
1. 用户在 dApp 点击 "Connect Ledger"
   ↓
2. 浏览器显示 USB 设备选择器
   ┌────────────────────────────────┐
   │ 选择 USB 设备                   │
   │ ○ Ledger Nano S Plus          │
   │ ○ Ledger Nano X               │
   │                               │
   │ [取消]  [连接]                 │
   └────────────────────────────────┘
   ↓
3. 用户选择设备并点击 "连接"
   ↓
4. dApp 向设备发送 "获取地址" 命令
   ↓
5. Ledger 屏幕显示:
   ┌────────────────┐
   │ Provide        │
   │ address #0?    │
   │                │
   │ [✓] [✗]        │
   └────────────────┘
   ↓
6. 用户按右键确认 ✓
   ↓
7. 设备返回地址给 dApp
   ↓
8. 连接完成

───────────────────────────────────

发送交易时:

1. dApp 发送交易数据到设备
   ↓
2. Ledger 解析并显示:
   ┌────────────────┐
   │ Review         │
   │ transaction    │
   │ [→] Continue   │
   └────────────────┘
   ↓
3. 显示详情（用户可以滚动查看）:
   ┌────────────────┐
   │ Amount         │
   │ 1.5 ETH        │
   │ [→] Continue   │
   └────────────────┘
   ↓
   ┌────────────────┐
   │ Address        │
   │ 0x1234...5678  │
   │ [→] Continue   │
   └────────────────┘
   ↓
   ┌────────────────┐
   │ Max Fees       │
   │ 0.002 ETH      │
   │ [→] Continue   │
   └────────────────┘
   ↓
4. 最后确认:
   ┌────────────────┐
   │ Accept and     │
   │ send?          │
   │ [✓] [✗]        │
   └────────────────┘
   ↓
5. 用户按右键确认 ✓
   ↓
6. 设备内部签名（安全芯片）
   ↓
7. 返回签名给 dApp
   ↓
8. dApp 广播交易到网络
```

### 安全特性

1. **物理隔离**
   ```
   私钥存储在安全芯片中
   ↓
   签名在芯片内完成
   ↓
   私钥永远不会暴露给电脑
   ```

2. **屏幕确认**
   - 每笔交易都在设备屏幕上显示
   - 防止恶意软件篡改交易
   - 用户物理按键确认

3. **PIN 码保护**
   - 设备启动需要 PIN 码
   - 多次输错自动清除数据

4. **助记词备份**
   - 24 个助记词
   - 可恢复到新设备
   - 纸质备份（离线）

### 使用场景

✅ **适合：**
- 长期持有大额资产（HODLers）
- 机构投资者
- 高净值个人
- 需要最高安全级别的场景
- 冷存储

❌ **不适合：**
- 频繁交易（每次都要设备确认）
- DeFi 高频操作
- 移动端场景（需要带设备）
- 新手（学习曲线陡峭）

### 优缺点

| 优点 | 缺点 |
|------|------|
| ✅ 最安全（私钥在硬件中）| ❌ 需要购买设备（$79-$149）|
| ✅ 防远程攻击 | ❌ 操作繁琐（每次都要确认）|
| ✅ 支持多链 | ❌ 设备丢失风险 |
| ✅ 可恢复（助记词）| ❌ 不便于移动 |
| ✅ 开源固件 | ❌ 供应链攻击风险 |

---

## 4. Coinbase Wallet - 混合钱包

### 基本信息

| 属性 | 值 |
|------|----|
| **类型** | 混合钱包（扩展 + App + 托管）|
| **背景** | Coinbase 交易所官方钱包 |
| **用户数** | 数百万 |
| **KYC** | 部分功能需要 |

### 技术特点

Coinbase Wallet 支持三种模式：

1. **浏览器扩展模式**（类似 MetaMask）
2. **WalletLink 模式**（类似 WalletConnect）
3. **托管模式**（Coinbase 保管私钥）

### 连接实现

```javascript
import CoinbaseWalletSDK from '@coinbase/wallet-sdk';

class CoinbaseWalletConnector {
  async connect() {
    // 步骤 1: 检测扩展
    if (window.coinbaseWalletExtension) {
      return this.connectExtension();
    }

    // 步骤 2: 使用 WalletLink（移动端/没有扩展）
    return this.connectWalletLink();
  }

  // 方式 1: 浏览器扩展
  async connectExtension() {
    const accounts = await window.coinbaseWalletExtension.request({
      method: 'eth_requestAccounts'
    });
    return accounts[0];
  }

  // 方式 2: WalletLink
  async connectWalletLink() {
    // 初始化 SDK
    this.sdk = new CoinbaseWalletSDK({
      appName: 'My dApp',
      appLogoUrl: 'https://mydapp.com/logo.png',
      darkMode: false
    });

    // 创建 Provider
    this.provider = this.sdk.makeWeb3Provider(
      'https://mainnet.infura.io/v3/YOUR_KEY',
      1 // chainId
    );

    // 请求账户
    const accounts = await this.provider.request({
      method: 'eth_requestAccounts'
    });

    return accounts[0];
  }
}
```

### 与 Coinbase 生态集成

```javascript
// Coinbase Wallet 特有功能
class CoinbaseFeatures {
  // 直接购买加密货币
  async buyCrypto(amount, currency) {
    await this.provider.request({
      method: 'coinbaseWallet_requestBuyflow',
      params: {
        asset: currency,
        amount: amount,
        fiatCurrency: 'USD'
      }
    });
  }

  // 查看 Coinbase 账户余额
  async getCoinbaseBalance() {
    return this.provider.request({
      method: 'coinbaseWallet_getCoinbaseBalance'
    });
  }
}
```

### 使用场景

✅ **适合：**
- Coinbase 交易所用户
- 需要直接购买加密货币
- 美国用户（合规性）
- 需要法币出入金

❌ **不适合：**
- 追求去中心化的用户
- 非 Coinbase 生态用户

---

## 5. Rainbow - 移动端优先钱包

### 基本信息

| 属性 | 值 |
|------|----|
| **类型** | 移动端钱包 |
| **特点** | UI/UX 最佳 |
| **目标** | NFT 爱好者、年轻用户 |
| **开源** | 是 |

### 核心特性

1. **NFT 展示优秀**
   - 自动识别 NFT
   - 精美的 Gallery 界面
   - 支持 ENS Profiles

2. **代币自动发现**
   - 自动检测新代币
   - 显示代币价格和历史

3. **社交功能**
   - ENS 个人资料
   - 交易历史可视化

### 连接方式

Rainbow 通过 WalletConnect 连接桌面 dApp：

```javascript
// Rainbow 使用标准的 WalletConnect 协议
const connector = new WalletConnectConnector({
  bridge: 'https://bridge.walletconnect.org',
  qrcodeModal: QRCodeModal,
});

await connector.connect();
```

---

## 6. Safe (Gnosis Safe) - 多签智能合约钱包

### 基本信息

| 属性 | 值 |
|------|----|
| **类型** | 智能合约钱包（多签）|
| **链上** | 是（合约地址）|
| **使用** | DAO、团队、企业 |

### 核心概念

> **Safe 不是传统钱包，是部署在链上的智能合约。**
> 需要多个签名者批准才能执行交易。

### 技术架构

```solidity
// Safe 智能合约简化版
contract GnosisSafe {
    // 所有者列表
    address[] public owners;

    // 需要的签名数量（例如 2/3）
    uint256 public threshold;

    // 交易提案
    mapping(bytes32 => Transaction) public transactions;
    mapping(bytes32 => mapping(address => bool)) public confirmations;

    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 confirmationCount;
    }

    // 提交交易
    function submitTransaction(
        address to,
        uint256 value,
        bytes memory data
    ) public onlyOwner returns (bytes32 txHash) {
        txHash = keccak256(abi.encode(to, value, data, nonce));
        transactions[txHash] = Transaction({
            to: to,
            value: value,
            data: data,
            executed: false,
            confirmationCount: 0
        });

        // 提交者自动确认
        confirmTransaction(txHash);
    }

    // 确认交易
    function confirmTransaction(bytes32 txHash) public onlyOwner {
        require(!confirmations[txHash][msg.sender], "Already confirmed");

        confirmations[txHash][msg.sender] = true;
        transactions[txHash].confirmationCount++;

        // 达到阈值，自动执行
        if (transactions[txHash].confirmationCount >= threshold) {
            executeTransaction(txHash);
        }
    }

    // 执行交易
    function executeTransaction(bytes32 txHash) internal {
        Transaction storage txn = transactions[txHash];
        require(!txn.executed, "Already executed");
        require(txn.confirmationCount >= threshold, "Not enough confirmations");

        txn.executed = true;

        (bool success, ) = txn.to.call{value: txn.value}(txn.data);
        require(success, "Transaction failed");
    }
}
```

### 多签流程

```
┌─────────────────────────────────────────────────────────┐
│ Safe 合约: 0xSAFE123                                    │
│ 所有者: [Alice, Bob, Charlie]                           │
│ 阈值: 2/3 (需要 2 个签名)                               │
└─────────────────────────────────────────────────────────┘

T1: Alice 提出交易
    ├─ 发送 10 ETH 到 0xDEAD
    ├─ 创建交易提案
    └─ 自动确认 (1/2) ✓

T2: Bob 查看待处理交易
    ├─ 通过 Safe UI 查看
    ├─ 检查交易详情
    └─ 确认交易 (2/2) ✓✓

T3: 达到阈值
    ├─ 2/3 签名已收集
    ├─ 交易可执行
    └─ 任何人都可以调用 executeTransaction

T4: Charlie (或任何人) 执行
    ├─ 调用 Safe 合约的 executeTransaction
    ├─ Safe 合约发送 10 ETH
    └─ 交易完成 ✅
```

### 使用场景

✅ **适合：**
- DAO 金库管理
- 团队共同管理资金
- 企业加密资产
- 需要多重审批

❌ **不适合：**
- 个人日常使用
- 快速交易
- 单人控制场景

---

## 7. Burner Wallet - 临时开发钱包

### 基本信息

| 属性 | 值 |
|------|----|
| **类型** | 临时钱包 |
| **用途** | 开发测试 |
| **安全性** | ⚠️ 极低 |

### 实现原理

```javascript
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

class BurnerWallet {
  constructor() {
    this.storageKey = 'burnerWallet_pk';
  }

  async connect() {
    // 从 localStorage 读取私钥
    let privateKey = localStorage.getItem(this.storageKey);

    if (!privateKey) {
      // 生成新私钥
      privateKey = generatePrivateKey();

      // ⚠️ 存储到 localStorage（不安全！）
      localStorage.setItem(this.storageKey, privateKey);

      console.warn('⚠️ Burner wallet created. DO NOT use for real funds!');
    }

    // 创建账户
    this.account = privateKeyToAccount(privateKey);
    return this.account.address;
  }

  // 自动签名（无需用户确认！）
  async signTransaction(tx) {
    return this.account.signTransaction(tx);
  }

  // 清除钱包
  clearWallet() {
    localStorage.removeItem(this.storageKey);
    console.log('🔥 Burner wallet cleared!');
  }
}
```

### ⚠️ 安全警告

```javascript
// Burner Wallet 的风险
┌──────────────────────────────────────────────────────────┐
│ ⚠️ 危险：私钥存储在 localStorage                          │
│                                                          │
│ 攻击向量:                                                 │
│ 1. XSS 攻击可以读取 localStorage                         │
│ 2. 浏览器扩展可以访问                                      │
│ 3. 清除浏览器数据 = 永久丢失                              │
│ 4. 共享电脑 = 任何人都能访问                              │
│ 5. 无备份 = 无法恢复                                      │
│                                                          │
│ 🚫 绝对不要用于真实资金！                                  │
└──────────────────────────────────────────────────────────┘
```

### 使用场景

✅ **仅适合：**
- 本地 Hardhat 测试
- 开发演示
- 会议展示
- 教学目的

❌ **绝不能用于：**
- 真实资金
- 测试网（有价值的测试币）
- 生产环境
- 任何有价值的场景

---

## 技术架构对比

### 1. 注入式钱包 (MetaMask, Coinbase Extension)

```javascript
// 架构
Browser Extension → window.ethereum → dApp

// 优点
✅ 连接快速
✅ 用户体验好
✅ 开发简单

// 缺点
❌ 需要安装扩展
❌ 浏览器依赖
❌ 不支持移动端
```

### 2. 桥接协议 (WalletConnect)

```javascript
// 架构
dApp → Relay Server ← Mobile Wallet

// 优点
✅ 跨设备
✅ 支持多钱包
✅ 移动端体验好

// 缺点
❌ 依赖中继服务器
❌ 需要扫码
❌ 网络延迟
```

### 3. 硬件连接 (Ledger)

```javascript
// 架构
dApp → WebUSB/WebBLE → Hardware Device

// 优点
✅ 最安全
✅ 物理隔离
✅ 屏幕确认

// 缺点
❌ 需要设备
❌ 操作繁琐
❌ 成本高
```

### 4. 智能合约钱包 (Safe)

```javascript
// 架构
dApp → EOA Wallet → Safe Contract (on-chain)

// 优点
✅ 多签安全
✅ 可编程
✅ 社交恢复

// 缺点
❌ Gas 费高
❌ 操作复杂
❌ 需要多人协调
```

### 5. 本地签名器 (Burner)

```javascript
// 架构
dApp → localStorage (Private Key)

// 优点
✅ 即时连接
✅ 无摩擦
✅ 开发友好

// 缺点
❌ 极不安全
❌ 无法恢复
❌ 仅限测试
```

---

## 完整对比表

| 特性 | MetaMask | WalletConnect | Ledger | Coinbase | Rainbow | Safe | Burner |
|------|----------|---------------|--------|----------|---------|------|--------|
| **类型** | 扩展 | 协议 | 硬件 | 混合 | 移动端 | 智能合约 | 临时 |
| **安全性** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐ |
| **易用性** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **移动端** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐ |
| **成本** | 免费 | 免费 | $79-149 | 免费 | 免费 | Gas费 | 免费 |
| **私钥位置** | 浏览器 | 移动端 | 硬件 | 服务器 | 移动端 | 链上 | localStorage |

---

## 选择建议

### 场景 1: 消费者 dApp (DEX, NFT Marketplace)

```typescript
推荐配置:
[
  metaMaskWallet,       // 覆盖率最高
  walletConnectWallet,  // 移动端用户
  coinbaseWallet,       // Coinbase 用户
  rainbowWallet,        // NFT 爱好者
]
```

### 场景 2: DAO / 企业应用

```typescript
推荐配置:
[
  safeWallet,           // 主要钱包（多签）
  ledgerWallet,         // 高价值资产
  metaMaskWallet,       // 日常操作
]
```

### 场景 3: 开发测试

```typescript
推荐配置:
[
  burnerWallet,         // 快速测试
  metaMaskWallet,       // 功能测试
]
```

### 场景 4: NFT 应用

```typescript
推荐配置:
[
  rainbowWallet,        // NFT 展示最佳
  metaMaskWallet,       // 普及率高
  walletConnectWallet,  // 移动端
]
```

---

## 总结

### 核心差异

各钱包的本质区别在于：

1. **私钥存储位置** → 决定安全性
   - 浏览器 (MetaMask)
   - 移动端 (Rainbow)
   - 硬件设备 (Ledger)
   - 智能合约 (Safe)
   - localStorage (Burner) ⚠️

2. **连接方式** → 决定用户体验
   - 注入式 (MetaMask)
   - 桥接式 (WalletConnect)
   - USB/蓝牙 (Ledger)
   - 多签流程 (Safe)

3. **目标用户** → 决定功能特性
   - 消费者 (MetaMask, Rainbow)
   - 企业/DAO (Safe)
   - 机构/鲸鱼 (Ledger)
   - 开发者 (Burner)

### 实现建议

在 Scaffold-ETH 2 项目中，推荐支持：

```typescript
const wallets = [
  metaMaskWallet,          // 必须（最大用户群）
  walletConnectWallet,     // 必须（移动端）
  ledgerWallet,            // 推荐（机构用户）
  coinbaseWallet,          // 推荐（Coinbase 生态）
  rainbowWallet,           // 可选（NFT 应用）
  safeWallet,              // 可选（DAO 应用）
  burnerWallet,            // 仅开发环境
];
```

### 安全提醒

⚠️ **重要：**
- 生产环境禁用 Burner Wallet
- 高价值资产使用 Ledger
- DAO 资金使用 Safe
- 日常使用 MetaMask 或 Rainbow

---

## 参考资源

- [MetaMask 开发文档](https://docs.metamask.io/)
- [WalletConnect 规范](https://docs.walletconnect.com/)
- [Ledger 开发者文档](https://developers.ledger.com/)
- [Safe 开发文档](https://docs.safe.global/)
- [EIP-1193 标准](https://eips.ethereum.org/EIPS/eip-1193)
- [BIP-44 规范](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki)

---

**最后更新：** 2024年

**作者：** Claude Code AI

**许可：** MIT
