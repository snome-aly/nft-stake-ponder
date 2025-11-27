module.exports = {
  skipFiles: [
    "test/", // 跳过测试文件
  ],
  // 设置 mocha 超时
  mocha: {
    timeout: 100000, // 100 秒
  },
  // 配置覆盖率网络 - 增加区块 gas 限制
  providerOptions: {
    default_balance_ether: "10000000000",
    gas: 0xfffffffffff,
    gasLimit: 0xfffffffffff,
    allowUnlimitedContractSize: true,
  },
  // 配置覆盖率网络
  configureYulOptimizer: true,
  // 禁用 viaIR (必须禁用,否则 coverage 会失败)
  solcOptimizerDetails: {
    peephole: false,
    inliner: false,
    jumpdestRemover: false,
    orderLiterals: false,
    deduplicate: false,
    cse: false,
    constantOptimizer: false,
    yul: false,
  },
};
