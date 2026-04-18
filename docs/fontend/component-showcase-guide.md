# Scaffold-ETH 组件展示页面

## 📍 访问地址

```
http://localhost:3000/component-showcase
```

## 📦 包含的组件

### 基础显示组件
1. **RainbowKitCustomConnectButton** - 钱包连接按钮
2. **Address** - 地址显示组件
3. **Balance** - 余额显示组件
4. **BlockieAvatar** - 像素头像组件
5. **FaucetButton** - 水龙头按钮（仅本地网络）

### 输入组件系列
6. **AddressInput** - 地址输入框（支持 ENS）
7. **EtherInput** - ETH 数量输入框
8. **IntegerInput** - 整数输入框（bigint）
9. **Bytes32Input** - Bytes32 输入框
10. **BytesInput** - Bytes 输入框
11. **InputBase** - 基础输入框组件

## 🎨 页面特点

- ✅ 按顺序展示所有组件
- ✅ 每个组件都有说明和 Props 列表
- ✅ 可交互的示例（输入组件可以实际输入）
- ✅ 显示当前输入值
- ✅ 响应式布局
- ✅ 简洁清晰的 UI

## 🚀 使用方法

1. 启动项目：
```bash
yarn start
```

2. 访问组件展示页：
```
http://localhost:3000/component-showcase
```

3. 在页面上查看和测试每个组件

## 📝 代码位置

- **页面文件：** `packages/nextjs/app/component-showcase/page.tsx`
- **组件源码：** `packages/nextjs/components/scaffold-eth/`

## 💡 如何使用组件

### 示例 1：显示地址

```typescript
import { Address } from "~~/components/scaffold-eth";

<Address address="0x..." />
```

### 示例 2：地址输入

```typescript
import { AddressInput } from "~~/components/scaffold-eth";

const [address, setAddress] = useState("");

<AddressInput
  value={address}
  onChange={setAddress}
  placeholder="输入地址"
/>
```

### 示例 3：ETH 输入

```typescript
import { EtherInput } from "~~/components/scaffold-eth";

const [amount, setAmount] = useState("");

<EtherInput
  value={amount}
  onChange={setAmount}
  placeholder="输入 ETH 数量"
/>
```

## 🎯 快速参考

| 组件 | 用途 | 主要 Props |
|------|------|-----------|
| Address | 显示地址 | `address`, `format`, `disableAddressLink` |
| Balance | 显示余额 | `address`, `usdMode` |
| BlockieAvatar | 像素头像 | `address`, `size` |
| AddressInput | 地址输入 | `value`, `onChange`, `placeholder` |
| EtherInput | ETH 输入 | `value`, `onChange`, `usdMode` |
| IntegerInput | 整数输入 | `value`, `onChange` (bigint) |

## 📚 扩展阅读

- [Scaffold-ETH 2 文档](https://docs.scaffoldeth.io/)
- [RainbowKit 文档](https://www.rainbowkit.com/)
- [Wagmi 文档](https://wagmi.sh/)

---

**提示：** 所有组件都已经过优化和测试，可以直接在你的 dApp 中使用！
