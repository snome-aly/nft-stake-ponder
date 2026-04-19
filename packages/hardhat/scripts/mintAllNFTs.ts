import { ethers } from "hardhat";

/**
 * 脚本：用多个测试地址 mint 所有 NFT
 *
 * 使用方法:
 *   npx hardhat run scripts/mintAllNFTs.ts --network localhost
 *
 * 注意：每个地址最多 mint 20 个，需要 5 个地址 mint 完 100 个
 */
async function main() {
  console.log("🚀 开始批量 mint NFTs...\n");

  const MINT_PRICE = ethers.parseEther("0.001");
  const MAX_PER_ADDRESS = 20;

  // 获取合约
  const stakableNFT = await ethers.getContract("StakableNFT");
  const totalMinted = await stakableNFT.totalMinted();
  const maxSupply = await stakableNFT.MAX_SUPPLY();

  console.log(`📊 当前状态:`);
  console.log(`   - 已铸造: ${totalMinted} / ${maxSupply}\n`);

  const remaining = Number(maxSupply) - Number(totalMinted);
  if (remaining <= 0) {
    console.log("✅ 所有 NFTs 已经铸造完成!");
    return;
  }

  console.log(`📦 需要铸造: ${remaining} NFTs\n`);

  // 获取所有 signer
  const signers = await ethers.getSigners();

  // 计算每个地址需要mint的数量，从已铸造的地址开始
  let minted = Number(totalMinted);
  let addressIndex = Math.floor(minted / MAX_PER_ADDRESS) + 1; // 从哪个地址开始 (0是deployer)
  let addressMinted = minted % MAX_PER_ADDRESS; // 当前地址已mint数量

  console.log(`开始地址索引: ${addressIndex}, 该地址已mint: ${addressMinted}\n`);

  while (minted < Number(maxSupply)) {
    // 如果当前地址已经mint了20个，切换到下一个地址
    if (addressMinted >= MAX_PER_ADDRESS) {
      addressIndex++;
      addressMinted = 0;
    }

    if (addressIndex >= signers.length) {
      console.log(`❌ 所有地址都用完了，但还有 ${Number(maxSupply) - minted} NFTs 未铸造`);
      break;
    }

    const signer = signers[addressIndex];
    const currentAddress = await signer.getAddress();

    // 计算当前地址还能mint多少
    const canMintThisAddress = MAX_PER_ADDRESS - addressMinted;
    const remainingToMint = Number(maxSupply) - minted;
    const quantity = Math.min(canMintThisAddress, remainingToMint, MAX_PER_ADDRESS); // 每次最多20个
    const cost = MINT_PRICE * BigInt(quantity);

    console.log(
      `📝 地址 ${addressIndex}/${signers.length - 1} (${currentAddress.slice(0, 10)}...): Minting ${quantity} NFTs (cost: ${ethers.formatEther(cost)} ETH)...`,
    );

    try {
      const tx = await stakableNFT.connect(signer).mint(quantity, { value: cost });
      const receipt = await tx.wait();
      console.log(`   ✅ 成功! Gas used: ${receipt.gasUsed}`);
      minted += quantity;
      addressMinted += quantity;
    } catch (error: any) {
      console.error(`   ❌ 失败: ${error.message}`);
      addressIndex++;
      addressMinted = 0;
    }
  }

  console.log(`\n🎉 铸造完成! 总共铸造了 ${minted} / ${maxSupply} NFTs`);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
