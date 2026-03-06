#!/bin/bash
set -e

echo "=== Vercel 多主题部署脚本 ==="
echo ""

# 检查是否已登录 Vercel
if ! vercel whoami > /dev/null 2>&1; then
  echo "请先登录 Vercel："
  vercel login
fi

echo "开始部署三个主题项目..."
echo ""

# 部署 Bootstrap 主题
echo "1. 部署 Bootstrap 主题..."
vercel --prod --name blog-bootstrap --yes

# 添加域名
echo "   添加域名: blog.panghuli.cn"
vercel domains add blog.panghuli.cn blog-bootstrap --yes 2>/dev/null || echo "   域名可能已存在"

echo ""

# 部署 FixIt 主题
echo "2. 部署 FixIt 主题..."
vercel --prod --name blog-fixit --yes

# 添加域名
echo "   添加域名: fixit.blog.panghuli.cn"
vercel domains add fixit.blog.panghuli.cn blog-fixit --yes 2>/dev/null || echo "   域名可能已存在"

echo ""

# 部署 Next 主题
echo "3. 部署 Next 主题..."
vercel --prod --name blog-next --yes

# 添加域名
echo "   添加域名: next.blog.panghuli.cn"
vercel domains add next.blog.panghuli.cn blog-next --yes 2>/dev/null || echo "   域名可能已存在"

echo ""
echo "=== 部署完成！ ==="
echo ""
echo "请在 DNS 提供商配置以下记录："
echo "  blog.panghuli.cn        → A 记录或 CNAME"
echo "  fixit.blog.panghuli.cn  → CNAME cname.vercel-dns.com"
echo "  next.blog.panghuli.cn   → CNAME cname.vercel-dns.com"
