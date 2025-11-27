/**
 * ============================================
 * Next.js 元数据生成工具
 * ============================================
 *
 * 📌 核心功能：
 * 为 Next.js 页面生成统一的 SEO 元数据
 * 支持 Open Graph、Twitter Cards 和 Favicon
 *
 * 🎯 主要用途：
 * - 提供一致的页面标题、描述和社交分享图片
 * - 改善 SEO 和社交媒体分享效果
 * - 简化元数据配置流程
 *
 * 🔧 支持的平台：
 * - Google（基础 meta 标签）
 * - Facebook/LinkedIn（Open Graph）
 * - Twitter（Twitter Cards）
 */
import type { Metadata } from "next";

/**
 * 基础 URL
 * - 生产环境：使用 Vercel 提供的生产环境 URL
 * - 开发环境：使用本地 localhost（默认端口 3000）
 */
const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : `http://localhost:${process.env.PORT || 3000}`;

/**
 * 标题模板
 * %s 会被替换为实际的页面标题
 *
 * 示例：
 * - 输入："Home" => 输出："Home | Scaffold-ETH 2"
 * - 输入："About" => 输出："About | Scaffold-ETH 2"
 */
const titleTemplate = "%s | Scaffold-ETH 2";

/**
 * 生成页面元数据
 *
 * @param title - 页面标题
 * @param description - 页面描述
 * @param imageRelativePath - 社交分享图片的相对路径（可选，默认 /thumbnail.jpg）
 * @returns Next.js Metadata 对象
 *
 * 📌 生成的元数据包含：
 * 1. 基础元数据
 *    - metadataBase: 网站基础 URL
 *    - title: 页面标题（带模板）
 *    - description: 页面描述
 *
 * 2. Open Graph 元数据（用于 Facebook、LinkedIn 等）
 *    - og:title: 标题
 *    - og:description: 描述
 *    - og:image: 分享图片 URL
 *
 * 3. Twitter Card 元数据
 *    - twitter:title: 标题
 *    - twitter:description: 描述
 *    - twitter:image: 分享图片 URL
 *
 * 4. Favicon 配置
 *    - 32x32 PNG 图标
 *
 * 💡 使用方法：
 * ```typescript
 * // app/about/page.tsx
 * import { getMetadata } from "~~/utils/scaffold-eth";
 *
 * export const metadata = getMetadata({
 *   title: "About Us",
 *   description: "Learn more about our project",
 *   imageRelativePath: "/images/about-og.jpg", // 可选
 * });
 * ```
 *
 * 🔗 参考文档：
 * - Next.js Metadata API: https://nextjs.org/docs/app/api-reference/functions/generate-metadata
 * - Open Graph Protocol: https://ogp.me/
 * - Twitter Cards: https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards
 */
export const getMetadata = ({
  title,
  description,
  imageRelativePath = "/thumbnail.jpg",
}: {
  title: string;
  description: string;
  imageRelativePath?: string;
}): Metadata => {
  // 拼接完整的图片 URL
  const imageUrl = `${baseUrl}${imageRelativePath}`;

  return {
    // 网站基础 URL（用于解析相对路径）
    metadataBase: new URL(baseUrl),

    // 页面标题
    title: {
      default: title, // 默认标题
      template: titleTemplate, // 标题模板
    },

    // 页面描述
    description: description,

    // Open Graph 元数据（Facebook、LinkedIn 等社交平台）
    openGraph: {
      title: {
        default: title,
        template: titleTemplate,
      },
      description: description,
      images: [
        {
          url: imageUrl, // 分享图片 URL
        },
      ],
    },

    // Twitter Card 元数据
    twitter: {
      title: {
        default: title,
        template: titleTemplate,
      },
      description: description,
      images: [imageUrl], // 分享图片 URL
    },

    // Favicon 配置
    icons: {
      icon: [
        {
          url: "/favicon.png", // 图标路径
          sizes: "32x32", // 图标尺寸
          type: "image/png", // 图标类型
        },
      ],
    },
  };
};
