# 将域名 DNS 迁移到 Cloudflare 指南

## 步骤 1: 在 Cloudflare 添加域名

1. 访问 [Cloudflare](https://dash.cloudflare.com/) 并注册/登录
2. 点击 "Add a Site" 或 "添加站点"
3. 输入域名：`panghuli.cn`
4. 选择免费计划（Free plan）
5. Cloudflare 会自动扫描现有 DNS 记录

## 步骤 2: 更新域名服务器（Nameservers）⚠️ **必须操作**

1. Cloudflare 会提供两个 Nameservers，例如：
   - `bjorn.ns.cloudflare.com`
   - `desi.ns.cloudflare.com`

2. 在阿里云域名控制台：
   - 进入 **域名注册控制台**（不是云解析 DNS）
   - 找到域名 `panghuli.cn`
   - 点击 "DNS 修改" 或 "修改 DNS 服务器"
   - 将 Nameservers 改为 Cloudflare 提供的两个
   - 保存并等待生效（通常几分钟到几小时）

3. 验证 Nameservers 是否生效：

   ```bash
   # 方法 1: 查询 NS 记录（推荐）
   dig NS panghuli.cn @8.8.8.8 +short
   # 应该显示类似：bjorn.ns.cloudflare.com. 和 desi.ns.cloudflare.com.

   # 方法 2: 完整输出
   dig NS panghuli.cn @8.8.8.8 +noall +answer
   # 应该看到 ANSWER SECTION 中有 Cloudflare 的 Nameservers

   # 方法 3: 使用 whois 查询（最准确）
   whois panghuli.cn | grep -i "name server"
   # 应该显示 Cloudflare 的 Nameservers
   ```

   **判断标准：**
   - ✅ **成功**：显示 `*.ns.cloudflare.com` 的 Nameservers
   - ❌ **失败**：显示 `dns*.hichina.com` 或其他阿里云的 Nameservers
   - ⚠️ **异常**：返回 A 记录而不是 NS 记录（说明 DNS 传播未完成，但 whois 可能已正确）

   **如果 whois 显示 Cloudflare Nameservers，但 dig 仍返回 A 记录：**
   - 这是正常的！说明 Nameservers 已正确设置，但 DNS 传播还在进行中
   - 继续下一步：在 Cloudflare 配置 DNS 记录
   - 等待 10-30 分钟后，再次测试 `dig blog.panghuli.cn` 应该能正常解析

## 步骤 3: 在 Cloudflare 配置 DNS 记录

### 必须保留的记录

1. **blog 记录（CNAME）**
   - Type: `CNAME`
   - Name: `blog`
   - Target: `phenix3443.github.io`
   - Proxy status: ✅ Proxied （橙色云朵）
   - TTL: Auto

2. **GitHub Pages 验证记录（TXT）** - 根据情况决定

   **情况 1：GitHub Pages 已显示 "✓ DNS check successful"（你的情况）**
   - ✅ **不需要重新配置！** GitHub 已经验证通过
   - 可能的原因：
     - Cloudflare 上已经有正确的 TXT 记录
     - 或者 GitHub 通过 CNAME 文件自动验证通过
     - 或者验证结果已缓存
   - **建议**：检查 Cloudflare 上是否有对应的 TXT 记录，如果没有可以添加（但不是必须的）

   **情况 2：GitHub Pages 显示验证失败或需要重新验证**
   - 如果之前阿里云有 TXT 记录，迁移到 Cloudflare 后需要重新添加
   - 操作步骤：
     1. 访问 GitHub 仓库：`https://github.com/phenix3443/blog/settings/pages`
     2. 在 "Custom domain" 输入框中，先删除域名，点击 "Save"
     3. 重新输入：`blog.panghuli.cn`，点击 "Save"
     4. GitHub 会显示新的验证 TXT 记录
     5. 在 Cloudflare 添加 TXT 记录：
        - Type: `TXT`
        - Name: `_github-pages-challenge-phenix3443` （或 GitHub 显示的确切名称）
        - Content: （粘贴 GitHub 提供的完整值）
        - Proxy status: ❌ DNS only （灰色云朵，必须关闭代理）
        - TTL: Auto
     6. 等待 1-5 分钟，GitHub 会自动验证并显示 ✅

   **验证命令：**

   ```bash
   # 检查 TXT 记录是否存在
   dig TXT _github-pages-challenge-phenix3443.blog.panghuli.cn @1.1.1.1 +short
   dig TXT _github-pages-challenge-phenix3443.panghuli.cn @1.1.1.1 +short
   ```

3. **其他现有记录**
   - 复制所有其他记录（charts, resume, www 等）

## 步骤 4: 配置 SSL/TLS

1. 在 Cloudflare 控制台，进入 SSL/TLS 设置
2. 加密模式选择：**Full (strict)**
3. 自动 HTTPS 重定向：开启
4. 始终使用 HTTPS：开启

## 步骤 5: 配置页面规则（可选但推荐）

创建规则优化性能：

- URL: `blog.panghuli.cn/*`
- 设置：
  - Cache Level: Standard
  - Browser Cache TTL: 4 hours
  - Edge Cache TTL: 2 hours

## 步骤 6: 验证配置

等待 Nameservers 生效后（通常几小时），验证：

```bash
# 检查 DNS 解析
dig blog.panghuli.cn @8.8.8.8

# 应该解析到 Cloudflare 的 IP（不是 198.18.x.x）
# 然后 Cloudflare 会代理到 GitHub Pages
```

## 优势对比

### Cloudflare vs 阿里云 DNS

| 功能      | Cloudflare      | 阿里云 DNS               |
| --------- | --------------- | ------------------------ |
| 价格      | 免费            | 基础版免费，高级功能付费 |
| CDN 加速  | ✅ 免费         | ❌ 需付费                |
| SSL 证书  | ✅ 免费自动续期 | ❌ 需付费                |
| 健康检查  | ✅ 免费         | ❌ 需付费                |
| 全球解析  | ✅ 优秀         | ⚠️ 一般                  |
| DDoS 防护 | ✅ 免费基础防护 | ❌ 需付费                |
| 缓存优化  | ✅ 免费         | ❌ 需付费                |
| 页面规则  | ✅ 免费 3 条    | ❌ 需付费                |

## 注意事项

1. **Nameservers 更改后**，旧的 DNS 记录会在阿里云失效，所有记录需要在 Cloudflare 重新配置
2. **GitHub Pages 验证**：确保 `_github-pages-challenge-phenix3443` TXT 记录正确
3. **SSL 证书**：Cloudflare 会自动为你的域名生成 SSL 证书
4. **缓存**：Cloudflare 会缓存静态内容，更新后可能需要清除缓存

## 迁移后的好处

- ✅ 更快的全球访问速度（CDN 加速）
- ✅ 免费 SSL 证书
- ✅ 免费健康检查和监控
- ✅ 更好的安全防护
- ✅ 详细的访问分析（免费版提供基础统计）
