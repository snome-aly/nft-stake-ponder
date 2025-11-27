import pinataSDK from "@pinata/sdk";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// 加载环境变量
dotenv.config();

// 从环境变量读取 API Keys
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;

// 验证环境变量
if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
  console.error("❌ 错误: 请设置 PINATA_API_KEY 和 PINATA_SECRET_KEY 环境变量");
  console.error("请检查 packages/hardhat/.env 文件");
  process.exit(1);
}

// 定义要上传的图片列表
const imageFiles = ["blindbox.png", "common.png", "rare.png", "epic.png", "legendary.png"];

// 主函数
async function uploadImages() {
  console.log("🚀 开始上传图片到 Pinata...\n");

  try {
    // 1. 创建 Pinata 客户端实例
    const pinata = new pinataSDK(PINATA_API_KEY, PINATA_SECRET_KEY);

    // 2. 测试 API 连接
    console.log("🔗 正在测试 Pinata 连接...");
    const auth = await pinata.testAuthentication();
    console.log(`✅ Pinata 连接成功: ${auth.authenticated}\n`);

    // 3. 创建结果对象，用于保存 CID
    const results: Record<string, string> = {};
    const uploadDetails: Array<{ fileName: string; cid: string; size: number; timestamp: string }> = [];

    // 4. 循环上传每张图片
    for (const fileName of imageFiles) {
      try {
        console.log(`📤 正在上传: ${fileName}...`);

        // a. 读取文件路径
        const imagePath = path.join(__dirname, "../assets/images", fileName);

        // 检查文件是否存在
        if (!fs.existsSync(imagePath)) {
          console.error(`❌ 文件不存在: ${imagePath}`);
          continue;
        }

        // b. 创建可读流
        const readableStream = fs.createReadStream(imagePath);

        // c. 配置上传选项
        const options = {
          pinataMetadata: {
            name: fileName,
          },
          pinataOptions: {
            cidVersion: 0 as const,
          },
        };

        // d. 调用 Pinata API 上传
        const result = await pinata.pinFileToIPFS(readableStream, options);

        // e. 获取返回的 CID
        const cid = result.IpfsHash;
        const ipfsUri = `ipfs://${cid}`;

        // f. 保存到结果对象
        results[fileName] = ipfsUri;

        // 保存详细信息
        uploadDetails.push({
          fileName,
          cid,
          size: result.PinSize,
          timestamp: result.Timestamp,
        });

        // g. 打印上传进度
        console.log(`✅ ${fileName} 上传成功！`);
        console.log(`   CID: ${cid}`);
        console.log(`   IPFS URL: ${ipfsUri}`);
        console.log(`   网关访问: https://gateway.pinata.cloud/ipfs/${cid}`);
        console.log(`   大小: ${(result.PinSize / 1024).toFixed(2)} KB\n`);
      } catch (error) {
        console.error(`❌ 上传 ${fileName} 失败:`, error);
      }
    }

    // 5. 保存所有 CID 到 JSON 文件
    const outputPath = path.join(__dirname, "../assets/ipfs-cids.json");
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`📝 所有 CID 已保存到: ${path.relative(process.cwd(), outputPath)}\n`);

    // 6. 保存详细信息
    const detailsPath = path.join(__dirname, "../assets/ipfs-upload-details.json");
    fs.writeFileSync(
      detailsPath,
      JSON.stringify(
        {
          uploadDate: new Date().toISOString(),
          totalFiles: uploadDetails.length,
          totalSize: uploadDetails.reduce((sum, item) => sum + item.size, 0),
          files: uploadDetails,
        },
        null,
        2,
      ),
    );

    // 7. 打印汇总信息
    console.log("============================================================");
    console.log("📋 上传结果汇总:\n");
    Object.entries(results).forEach(([fileName, ipfsUri]) => {
      console.log(`${fileName.padEnd(20)} → ${ipfsUri}`);
    });
    console.log("============================================================\n");

    console.log("🎉 上传完成！\n");
    console.log("📌 下一步:");
    console.log("   1. 查看 assets/ipfs-cids.json 文件");
    console.log("   2. 在浏览器验证图片可访问");
    console.log("   3. 将这些 IPFS URL 更新到智能合约中\n");

    // 打印验证链接
    console.log("🔍 验证链接（在浏览器中打开）:");
    Object.entries(results).forEach(([fileName, ipfsUri]) => {
      const cid = ipfsUri.replace("ipfs://", "");
      console.log(`   ${fileName}: https://gateway.pinata.cloud/ipfs/${cid}`);
    });
  } catch (error) {
    console.error("\n❌ 上传过程中发生错误:");
    if (error instanceof Error) {
      console.error(`   错误信息: ${error.message}`);
      if (error.message.includes("Invalid authentication")) {
        console.error("\n   💡 提示: 请检查 .env 文件中的 PINATA_API_KEY 和 PINATA_SECRET_KEY 是否正确");
      }
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

// 执行主函数
uploadImages()
  .then(() => {
    console.log("\n✨ 脚本执行成功！");
    process.exit(0);
  })
  .catch(error => {
    console.error("\n💥 脚本执行失败:", error);
    process.exit(1);
  });
