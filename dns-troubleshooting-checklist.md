# DNS 配置检查清单

## 🔍 问题诊断：blog.panghuli.cn 无法访问

### 错误信息

- `DNS_PROBE_FINISHED_NXDOMAIN` - 域名无法解析

---

## ✅ 检查步骤

### 1. 检查 Cloudflare DNS 记录配置

**登录 Cloudflare 控制台：**

- 访问：https://dash.cloudflare.com/
- 选择域名：`panghuli.cn`
- 进入 "DNS" → "Records"

**必须存在的记录：**

#### 记录 1：blog CNAME（最重要）

```
Type:     CNAME
Name:     blog
Target:   phenix3443.github.io
Proxy:    ✅ Proxied (橙色云朵) ← 必须开启！
TTL:      Auto
Status:   ✅ Active
```

**检查点：**

- [ ] 记录是否存在？
- [ ] Proxy 是否开启（橙色云朵）？
- [ ] Target 是否正确指向 `phenix3443.github.io`？
- [ ] 记录状态是否为 Active？

**如果不存在或配置错误：**

1. 点击 "Add record"
2. 选择 Type: `CNAME`
3. Name: `blog`
4. Target: `phenix3443.github.io`
5. **重要：** 点击云朵图标，确保是橙色（Proxied）
6. 点击 "Save"

---

### 2. 验证 DNS 解析

**使用命令行测试：**

```bash
# 测试 1: 使用 Cloudflare DNS
dig blog.panghuli.cn @1.1.1.1 +short
# 应该返回 Cloudflare 的 IP（如 104.x.x.x 或 172.x.x.x）
# ❌ 不应该返回：198.18.x.x（测试地址）

# 测试 2: 使用 Google DNS
dig blog.panghuli.cn @8.8.8.8 +short
# 应该返回 Cloudflare 的 IP

# 测试 3: 完整查询
dig blog.panghuli.cn @1.1.1.1 +noall +answer
# 应该显示 A 记录指向 Cloudflare IP

# 测试 4: 检查 CNAME 链
dig blog.panghuli.cn @1.1.1.1 +trace
# 应该看到解析链：blog.panghuli.cn → phenix3443.github.io
```

**预期结果：**

- ✅ 返回 Cloudflare 的 IP 地址（104.x.x.x 或 172.x.x.x）
- ❌ 不应该返回：198.18.x.x、空结果、或 NXDOMAIN

---

### 3. 检查 Cloudflare SSL/TLS 设置

**位置：** Cloudflare 控制台 → SSL/TLS

**配置检查：**

- [ ] 加密模式：**Full (strict)** ← 推荐
- [ ] 自动 HTTPS 重定向：✅ 开启
- [ ] 始终使用 HTTPS：✅ 开启
- [ ] SSL/TLS 加密模式：**Full (strict)**

**如果未配置：**

1. 进入 SSL/TLS 设置
2. 加密模式选择：**Full (strict)**
3. 开启 "Always Use HTTPS"
4. 开启 "Automatic HTTPS Rewrites"

---

### 4. 检查 GitHub Pages 配置

**访问：** https://github.com/phenix3443/blog/settings/pages

**检查点：**

- [ ] Custom domain 是否设置为：`blog.panghuli.cn`
- [ ] 是否显示 "✓ DNS check successful"
- [ ] "Enforce HTTPS" 是否开启
- [ ] 最近部署是否成功（查看 "Last deployed"）

**如果显示验证失败：**

1. 检查 Cloudflare 上是否有 TXT 验证记录
2. 如果没有，按照迁移指南添加验证记录

---

### 5. 清除本地 DNS 缓存

**macOS：**

```bash
# 方法 1: 清除 DNS 缓存
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder

# 方法 2: 重启网络服务
sudo ifconfig en0 down && sudo ifconfig en0 up

# 方法 3: 重启系统（最彻底）
```

**Windows：**

```cmd
ipconfig /flushdns
```

**Linux：**

```bash
sudo systemd-resolve --flush-caches
# 或
sudo service network-manager restart
```

---

### 6. 测试网站访问

**使用不同方式测试：**

```bash
# 测试 1: 直接访问
curl -I https://blog.panghuli.cn
# 应该返回 HTTP 200 或 301

# 测试 2: 使用不同 DNS
curl -I --resolve blog.panghuli.cn:443:104.21.0.0 https://blog.panghuli.cn
# 替换 IP 为 Cloudflare 的实际 IP

# 测试 3: 检查 SSL 证书
openssl s_client -connect blog.panghuli.cn:443 -servername blog.panghuli.cn
# 应该显示有效的 SSL 证书
```

**浏览器测试：**

- [ ] 使用 Chrome/Edge 访问：https://blog.panghuli.cn
- [ ] 使用 Firefox 访问：https://blog.panghuli.cn
- [ ] 使用无痕模式访问（排除扩展干扰）
- [ ] 检查浏览器控制台是否有错误

---

### 7. 检查 Cloudflare 代理状态

**在 Cloudflare DNS 记录页面：**

**重要：** `blog` CNAME 记录的云朵图标必须是：

- ✅ **橙色**（Proxied）- 正确！会通过 Cloudflare CDN
- ❌ **灰色**（DNS only）- 错误！不会通过 Cloudflare

**如果云朵是灰色的：**

1. 点击 `blog` 记录
2. 点击云朵图标，切换为橙色
3. 保存

---

### 8. 等待 DNS 传播

**DNS 更改需要时间传播：**

- 通常：5-30 分钟
- 最长：24-48 小时（罕见）

**检查传播状态：**

```bash
# 使用多个 DNS 服务器测试
dig blog.panghuli.cn @1.1.1.1 +short      # Cloudflare
dig blog.panghuli.cn @8.8.8.8 +short      # Google
dig blog.panghuli.cn @223.5.5.5 +short    # 阿里云
dig blog.panghuli.cn @114.114.114.114 +short  # 114 DNS

# 如果所有 DNS 都返回相同结果，说明传播完成
```

---

## 🚨 常见问题排查

### 问题 1: DNS 返回 198.18.x.x（测试地址）

**原因：** DNS 记录未正确配置或未传播

**解决：**

1. 检查 Cloudflare 上 `blog` CNAME 记录是否存在
2. 确保 Proxy 开启（橙色云朵）
3. 等待 DNS 传播

---

### 问题 2: 返回 NXDOMAIN

**原因：** 域名记录不存在

**解决：**

1. 确认 Cloudflare 上有 `blog` CNAME 记录
2. 确认记录状态为 Active
3. 清除本地 DNS 缓存
4. 等待 DNS 传播

---

### 问题 3: SSL 证书错误

**原因：** Cloudflare SSL 模式配置错误

**解决：**

1. Cloudflare → SSL/TLS → 加密模式选择 "Full (strict)"
2. 等待 SSL 证书自动生成（通常几分钟）

---

### 问题 4: 网站显示 Cloudflare 错误页面

**原因：** Cloudflare 无法连接到 GitHub Pages

**解决：**

1. 检查 GitHub Pages 是否正常运行
2. 访问：https://phenix3443.github.io/blog/ 测试
3. 检查 Cloudflare SSL 模式是否为 "Full (strict)"

---

## 📋 快速检查清单

**完成以下所有检查：**

- [ ] Cloudflare 上有 `blog` CNAME 记录
- [ ] CNAME 记录 Proxy 开启（橙色云朵）
- [ ] Target 指向 `phenix3443.github.io`
- [ ] Cloudflare SSL 模式为 "Full (strict)"
- [ ] GitHub Pages 显示 "✓ DNS check successful"
- [ ] `dig blog.panghuli.cn @1.1.1.1` 返回 Cloudflare IP
- [ ] 已清除本地 DNS 缓存
- [ ] 浏览器可以访问网站

---

## 🔧 快速修复命令

**一键检查脚本：**

```bash
#!/bin/bash
echo "=== DNS 检查 ==="
echo "1. Cloudflare DNS:"
dig blog.panghuli.cn @1.1.1.1 +short
echo ""
echo "2. Google DNS:"
dig blog.panghuli.cn @8.8.8.8 +short
echo ""
echo "3. 完整查询:"
dig blog.panghuli.cn @1.1.1.1 +noall +answer
echo ""
echo "4. HTTPS 测试:"
curl -I https://blog.panghuli.cn 2>&1 | head -5
```

**保存为 `check-dns.sh`，运行：**

```bash
chmod +x check-dns.sh
./check-dns.sh
```

---

## 📞 如果问题仍然存在

1. **检查 Cloudflare 状态页面：** https://www.cloudflarestatus.com/
2. **检查 GitHub Pages 状态：** https://www.githubstatus.com/
3. **查看 Cloudflare 分析：** Cloudflare 控制台 → Analytics
4. **查看 GitHub Actions：** https://github.com/phenix3443/blog/actions

---

## ✅ 成功标志

当以下所有条件满足时，网站应该可以正常访问：

1. ✅ `dig blog.panghuli.cn @1.1.1.1` 返回 Cloudflare IP
2. ✅ `curl -I https://blog.panghuli.cn` 返回 HTTP 200/301
3. ✅ 浏览器可以正常访问网站
4. ✅ SSL 证书有效（浏览器显示锁图标）
5. ✅ GitHub Pages 显示 "✓ DNS check successful"

---

**最后更新：** 2026-01-11
