import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ============================================
  // React 配置
  // ============================================

  // 启用 React 严格模式
  // 用于检测潜在问题：副作用、过时 API、意外的副作用等
  // 仅在开发环境生效，不影响生产构建
  reactStrictMode: true,

  // ============================================
  // 开发环境配置
  // ============================================

  // 关闭开发环境指示器（右下角的编译指示器）
  // 设为 false 可隐藏所有开发指示器
  devIndicators: false,
  // 可选的细粒度控制：
  // devIndicators: {
  //   buildActivity: true,        // 显示构建活动指示器
  //   buildActivityPosition: 'bottom-right',  // 位置：bottom-right | bottom-left | top-right | top-left
  // },

  // ============================================
  // TypeScript 配置
  // ============================================

  typescript: {
    // 构建时是否忽略 TypeScript 类型错误
    // 通过环境变量 NEXT_PUBLIC_IGNORE_BUILD_ERROR 控制
    // ⚠️ 生产环境不建议开启
    ignoreBuildErrors: process.env.NEXT_PUBLIC_IGNORE_BUILD_ERROR === "true",

    // TypeScript 插件配置（可选）
    // tsconfigPath: './tsconfig.custom.json',  // 自定义 tsconfig 路径
  },

  // ============================================
  // ESLint 配置
  // ============================================

  eslint: {
    // 构建时是否忽略 ESLint 错误
    // 通过环境变量控制，与 TypeScript 配置保持一致
    // ⚠️ 生产环境不建议开启
    ignoreDuringBuilds: process.env.NEXT_PUBLIC_IGNORE_BUILD_ERROR === "true",

    // 指定需要检查的目录（可选）
    // dirs: ['pages', 'utils', 'components', 'lib'],
  },

  // ============================================
  // Webpack 配置
  // ============================================

  webpack: config => {
    // 配置 fallback 模块
    // 在浏览器环境中禁用 Node.js 模块（fs, net, tls）
    // 防止打包 Node.js 专用模块到客户端代码
    config.resolve.fallback = { fs: false, net: false, tls: false };

    // 外部依赖排除
    // 这些包不会被打包到客户端 bundle 中
    // - pino-pretty: 日志美化库（仅服务端）
    // - lokijs: 内存数据库（通常仅服务端）
    // - encoding: 字符编码库（Node.js 内置）
    config.externals.push("pino-pretty", "lokijs", "encoding");

    return config;
  },

  // ============================================
  // 路径和路由配置（可选，已注释）
  // ============================================

  // 基础路径：部署到子路径时使用
  // basePath: '/my-app',

  // 自定义 URL 前缀（通常用于 CDN）
  // assetPrefix: 'https://cdn.example.com',

  // URL 是否添加尾部斜杠
  // true: /about/ | false: /about
  // trailingSlash: false,

  // ============================================
  // 图片优化配置
  // ============================================

  images: {
    // 允许的外部图片域名
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gateway.pinata.cloud",
        pathname: "/ipfs/**",
      },
      {
        protocol: "https",
        hostname: "ipfs.io",
        pathname: "/ipfs/**",
      },
    ],
  },

  // ============================================
  // 环境变量配置（可选，已注释）
  // ============================================

  // env: {
  //   CUSTOM_KEY: 'custom-value',
  // },

  // ============================================
  // 页面扩展名配置（可选，已注释）
  // ============================================

  // pageExtensions: ['tsx', 'ts', 'jsx', 'js', 'mdx'],

  // ============================================
  // 重定向和重写（可选，已注释）
  // ============================================

  // async redirects() {
  //   return [
  //     {
  //       source: '/old-path',
  //       destination: '/new-path',
  //       permanent: true,  // 301 重定向
  //     },
  //   ];
  // },

  // async rewrites() {
  //   return [
  //     {
  //       source: '/api/:path*',
  //       destination: 'https://api.example.com/:path*',
  //     },
  //   ];
  // },

  // async headers() {
  //   return [
  //     {
  //       source: '/:path*',
  //       headers: [
  //         {
  //           key: 'X-Custom-Header',
  //           value: 'my-custom-header-value',
  //         },
  //       ],
  //     },
  //   ];
  // },

  // ============================================
  // 编译和构建配置（可选，已注释）
  // ============================================

  // 压缩选项
  // compress: true,  // 启用 gzip 压缩

  // 生成构建 ID
  // generateBuildId: async () => {
  //   return 'my-build-id';
  // },

  // 输出模式
  // output: 'standalone',  // standalone | export

  // 禁用 X-Powered-By 响应头
  // poweredByHeader: false,

  // ============================================
  // 实验性功能（可选，已注释）
  // ============================================

  // experimental: {
  //   // 服务端组件外部包
  //   serverComponentsExternalPackages: ['@prisma/client'],
  //   // 优化字体加载
  //   optimizeFonts: true,
  //   // 优化包导入
  //   optimizePackageImports: ['lodash', 'date-fns'],
  //   // Turbopack 配置
  //   turbo: {
  //     rules: {},
  //   },
  // },

  // ============================================
  // 国际化配置（可选，已注释）
  // ============================================

  // i18n: {
  //   locales: ['en', 'zh', 'ja'],
  //   defaultLocale: 'en',
  //   localeDetection: true,
  // },
};

// ============================================
// IPFS 部署配置
// ============================================

// 检测是否为 IPFS 构建模式
const isIpfs = process.env.NEXT_PUBLIC_IPFS_BUILD === "true";

if (isIpfs) {
  // 静态导出模式（生成纯静态 HTML）
  // 适用于 IPFS、GitHub Pages 等静态托管
  nextConfig.output = "export";

  // URL 添加尾部斜杠
  // IPFS 要求路径以斜杠结尾
  nextConfig.trailingSlash = true;

  // 图片配置
  nextConfig.images = {
    // 禁用图片优化
    // IPFS 不支持 Next.js 的图片优化 API
    unoptimized: true,
  };
}

module.exports = nextConfig;
