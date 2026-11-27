#!/bin/bash

echo "=========================================="
echo "  blog.panghuli.cn DNS 检查脚本"
echo "=========================================="
echo ""

echo "1️⃣  检查 Cloudflare DNS 解析..."
CLOUDFLARE_RESULT=$(dig blog.panghuli.cn @1.1.1.1 +short 2>/dev/null)
if [ -z "$CLOUDFLARE_RESULT" ]; then
	echo "   ❌ 无法解析（NXDOMAIN 或空结果）"
else
	echo "   ✅ 解析结果: $CLOUDFLARE_RESULT"
	if [[ $CLOUDFLARE_RESULT =~ ^198\.18\. ]]; then
		echo "   ⚠️  警告: 返回测试地址，DNS 可能未正确配置"
	elif [[ $CLOUDFLARE_RESULT =~ ^104\.|^172\.|^108\. ]]; then
		echo "   ✅ 看起来是 Cloudflare 的 IP"
	fi
fi
echo ""

echo "2️⃣  检查 Google DNS 解析..."
GOOGLE_RESULT=$(dig blog.panghuli.cn @8.8.8.8 +short 2>/dev/null)
if [ -z "$GOOGLE_RESULT" ]; then
	echo "   ❌ 无法解析"
else
	echo "   ✅ 解析结果: $GOOGLE_RESULT"
fi
echo ""

echo "3️⃣  检查完整 DNS 记录..."
echo "   CNAME 记录:"
dig blog.panghuli.cn @1.1.1.1 +noall +answer 2>/dev/null | grep -E "CNAME|A"
echo ""

echo "4️⃣  检查 HTTPS 连接..."
HTTPS_RESULT=$(curl -I -s -m 5 https://blog.panghuli.cn 2>&1 | head -1)
if [[ $HTTPS_RESULT =~ "HTTP" ]]; then
	echo "   ✅ HTTPS 连接成功: $HTTPS_RESULT"
else
	echo "   ❌ HTTPS 连接失败: $HTTPS_RESULT"
fi
echo ""

echo "5️⃣  检查 GitHub Pages 默认地址..."
GITHUB_RESULT=$(curl -I -s -m 5 https://phenix3443.github.io/blog/ 2>&1 | head -1)
if [[ $GITHUB_RESULT =~ "HTTP" ]]; then
	echo "   ✅ GitHub Pages 可访问: $GITHUB_RESULT"
else
	echo "   ❌ GitHub Pages 无法访问"
fi
echo ""

echo "6️⃣  检查 Nameservers..."
NS_RESULT=$(dig NS panghuli.cn @8.8.8.8 +short 2>/dev/null | head -2)
if [ -z "$NS_RESULT" ]; then
	echo "   ⚠️  无法查询 Nameservers"
else
	echo "   Nameservers:"
	echo "$NS_RESULT" | while read -r ns; do
		if [[ ${ns} == *.cloudflare.com. ]]; then
			echo "   ✅ $ns (Cloudflare)"
		else
			echo "   ⚠️  $ns"
		fi
	done
fi
echo ""

echo "=========================================="
echo "  检查完成"
echo "=========================================="
echo ""
echo "💡 提示:"
echo "   - 如果所有 DNS 都返回相同 IP，说明传播完成"
echo "   - 如果返回 198.18.x.x，说明 DNS 未正确配置"
echo "   - 如果返回 NXDOMAIN，说明记录不存在"
echo ""
