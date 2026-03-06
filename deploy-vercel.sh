#!/bin/bash
set -e

echo "=== Vercel 多主题部署脚本 ==="
echo ""

# 检查是否已登录 Vercel
if ! vercel whoami > /dev/null 2>&1; then
  echo "请先登录 Vercel："
  vercel login
fi

echo "开始部署两个主题项目..."
echo ""

# 部署 Bootstrap 主题
echo "1. 部署 Bootstrap 主题..."
rm -rf .vercel
vercel --prod --yes

# 添加域名
echo "   添加域名: blog.panghuli.cn"
vercel domains add blog.panghuli.cn --yes 2>/dev/null || echo "   域名可能已存在"

echo ""

# 部署 FixIt 主题
echo "2. 部署 FixIt 主题..."
# 临时切换配置文件
mv vercel.json vercel.json.bak
cp vercel.fixit.json vercel.json
rm -rf .vercel
vercel --prod --yes
# 恢复配置文件
mv vercel.json.bak vercel.json

# 添加域名
echo "   添加域名: fixit.blog.panghuli.cn"
vercel domains add fixit.blog.panghuli.cn --yes 2>/dev/null || echo "   域名可能已存在"

echo ""
echo "=== 部署完成！ ==="
echo ""
echo "请在 DNS 提供商配置以下记录："
echo "  blog.panghuli.cn        → A 记录或 CNAME"
echo "  fixit.blog.panghuli.cn  → CNAME cname.vercel-dns.com"
