# 💰 Solidity 合约接收 ETH 与 `payable` 函数总结

> 一份简明易查的文档，整理了 `writeContract` 调用失败、`nonpayable` 限制、`receive()` 与 `fallback()` 的行为差异等要点。

---

## 🧩 1. 为什么下面这个调用会失败？

```js
const hash = await walletClient.writeContract({
  address: "0xContractAddress",
  abi: [
    {
      name: "transfer",
      type: "function",
      inputs: [
        { name: "to", type: "address" },
        { name: "amount", type: "uint256" },
      ],
      outputs: [{ name: "", type: "bool" }],
      stateMutability: "nonpayable",
    },
  ],
  functionName: "transfer",
  args: ["0xRecipient", parseEther("100")],
  value: parseEther("0.01"), // ❌ 带了 ETH
})
```

**原因：**
- 该函数 `transfer(address,uint256)` 是 **ERC20 标准函数**；
- 标记为 `nonpayable`，**不能接收 ETH**；
- 调用时带了 `value`，EVM 会直接 revert；
- 即使合约中有 `receive()` 函数，也不会触发它。

**错误信息常见：**
```
Error: cannot send value to non-payable function
```

---

## ⚙️ 2. 为什么不会触发 `receive()`？

调用过程逻辑如下：

1. EVM 根据函数选择器（calldata 前 4 字节）寻找匹配函数；
2. 找到 `transfer(address,uint256)`；
3. 因为函数存在且是 `nonpayable`；
4. 同时传入了 `msg.value > 0`；
5. EVM 直接 `revert`；
6. 不会进入 `receive()` 或 `fallback()`。

> ✅ `receive()` / `fallback()` 只在「**没有匹配函数**」时才会被触发。

---

## 💡 3. Solidity 合约能否默认接收 ETH？

> ❌ 默认不行。  
> 只有符合以下条件之一，合约才能收 ETH。

| 能收 ETH 的情况 | 条件说明 |
|----------------|----------|
| ✅ 有 `receive()` | 当 calldata 为空时（纯转账）触发 |
| ✅ 有 `fallback()` 并且 `payable` | 当 calldata 不为空且无匹配函数时触发 |
| ✅ 调用的函数本身是 `payable` | 比如 `deposit()` 或 `mint()` |
| ✅ 被其他合约 `selfdestruct(payable(address(this)))` 强制转账 | 特例，不走函数逻辑 |
| ❌ 都没有 | 默认不能接收 ETH，转账会直接 revert |

---

## 🧠 4. 三种情况对比

| 场景 | 描述 | 是否成功 | 触发函数 |
|------|------|-----------|-----------|
| 调用 `nonpayable` 函数并带 value | ERC20 `transfer()` | ❌ | 无（revert） |
| 调用 `payable` 函数并带 value | `deposit()` | ✅ | deposit |
| 纯转账无 calldata | `sendTransaction()` | ✅ | receive |
| 调用不存在的函数且有 calldata | calldata 不匹配 | ✅（有 payable fallback） | fallback |
| 强制转账 | `selfdestruct` | ✅ | 无（直接改余额） |

---

## 🧩 5. 推荐写法

### ✅ ERC20 转账（不附带 ETH）
```js
await walletClient.writeContract({
  address: tokenAddress,
  abi: erc20Abi,
  functionName: "transfer",
  args: ["0xRecipient", parseEther("100")],
})
```

### ✅ 发送 ETH
```js
await walletClient.sendTransaction({
  to: "0xRecipient",
  value: parseEther("0.01"),
})
```

### ✅ 调用可收 ETH 的函数
```js
await walletClient.writeContract({
  address: contractAddress,
  abi: [{ name: "deposit", type: "function", stateMutability: "payable" }],
  functionName: "deposit",
  value: parseEther("0.01"),
})
```

---

## 🔒 6. 小结

| 要点 | 说明 |
|------|------|
| `nonpayable` 函数无法接收 ETH | 传 `value` 会直接 revert |
| `receive()` / `fallback()` 只在函数未匹配时触发 | 匹配成功的函数优先执行 |
| 合约默认不能接收 ETH | 除非定义了 payable 入口 |
| `selfdestruct` 是唯一绕过机制 | 强制修改目标地址余额 |
| 检查 `stateMutability` 前缀很关键 | 决定交易能否带 ETH |

---

**一句话记忆：**
> “EVM 调用有匹配 ⇒ 不进 receive；函数非 payable ⇒ 不收 ETH。”