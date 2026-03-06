# 多主题动态切换系统设计文档

## 项目概述

为 Hugo 博客实现用户端动态切换主题功能，支持在 3 个成熟的技术博客主题间切换：
- hugo-theme-bootstrap（当前主题）
- FixIt
- hugo-theme-next

## 设计目标

1. 用户可以在浏览器中实时切换主题
2. 主题选择保存在浏览器本地存储
3. 每个主题保持其原生特性和完整功能
4. 内容在所有主题间保持兼容
5. 构建和部署流程自动化

## 技术方案

### 方案选择：多站点构建 + 前端切换

**核心思路：**
- 构建时为每个主题生成独立的完整站点
- 输出到不同子目录（public/bootstrap/、public/fixit/、public/next/）
- 前端 JavaScript 实现主题切换（通过 URL 跳转）
- 使用 localStorage 记住用户选择

**优势：**
- 每个主题完全独立，互不干扰
- 可以充分利用每个主题的所有特性
- 构建过程清晰，易于调试和维护
- 主题切换逻辑简单可靠

**权衡：**
- 构建时间约为单主题的 3 倍
- 部署体积约 210MB（71MB × 3）
- 需要标准化 front matter 确保兼容性

## 架构设计

### 目录结构

```
blog/
├── config/
│   ├── _default/           # 共享的基础配置
│   │   ├── hugo.yaml       # 基础 Hugo 配置
│   │   ├── params.yaml     # 共享参数
│   │   ├── languages.yaml  # 语言配置
│   │   └── menu.yaml       # 菜单配置（模板）
│   ├── bootstrap/          # hugo-theme-bootstrap 配置
│   │   ├── hugo.yaml       # 主题特定配置
│   │   ├── params.yaml     # 主题参数
│   │   └── menu.yaml       # 主题菜单
│   ├── fixit/              # FixIt 配置
│   │   ├── hugo.yaml
│   │   ├── params.yaml
│   │   └── menu.yaml
│   └── next/               # hugo-theme-next 配置
│       ├── hugo.yaml
│       ├── params.yaml
│       └── menu.yaml
├── content/                # 统一的内容目录（所有主题共享）
├── layouts/
│   └── partials/
│       └── theme-switcher.html  # 主题切换器组件
├── static/
│   └── js/
│       └── theme-switcher.js    # 主题切换逻辑
├── public/                 # 构建输出
│   ├── bootstrap/          # hugo-theme-bootstrap 完整站点
│   ├── fixit/              # FixIt 完整站点
│   ├── next/               # hugo-theme-next 完整站点
│   └── index.html          # 入口页面（重定向到默认主题）
├── scripts/
│   ├── build-all-themes.sh           # 构建所有主题
│   ├── standardize-frontmatter.sh    # 标准化 front matter（可选）
│   └── test-theme-compat.sh          # 测试主题兼容性（可选）
└── go.mod                  # Hugo modules 配置
```

### Front Matter 标准化

建立兼容所有主题的标准 front matter 格式：

```yaml
---
# 核心字段（所有主题都支持）
title: "文章标题"
date: 2024-01-01T10:00:00+08:00
lastmod: 2024-01-02T10:00:00+08:00
draft: false

# 分类和标签
categories: [category1, category2]
tags: [tag1, tag2, tag3]
series: [series-name]

# 描述和摘要
description: "文章描述"
summary: "文章摘要"

# 图片（多格式支持）
image: "featured.jpg"
images: ["featured.jpg"]
featuredImage: "featured.jpg"
cover:
  image: "featured.jpg"
  alt: "封面图片"

# 功能开关
toc: true
math: false
comment: true
reward: true

# 其他
slug: "url-slug"
author: "phenix3443"
---
```

### 主题切换器设计

**UI 组件：**
- 悬浮按钮或顶部栏中的下拉菜单
- 显示当前主题和可选主题列表
- 提供主题预览缩略图（可选）

**切换逻辑：**
```javascript
// theme-switcher.js
const THEMES = {
  bootstrap: { name: 'Bootstrap', path: '/bootstrap/' },
  fixit: { name: 'FixIt', path: '/fixit/' },
  next: { name: 'Next', path: '/next/' }
};

function switchTheme(themeName) {
  const currentPath = window.location.pathname;
  const currentTheme = getCurrentTheme();

  // 移除当前主题路径前缀
  let contentPath = currentPath.replace(THEMES[currentTheme].path, '/');

  // 添加新主题路径前缀
  const newPath = THEMES[themeName].path + contentPath.substring(1);

  // 保存选择
  localStorage.setItem('preferred-theme', themeName);

  // 跳转
  window.location.href = newPath;
}
```

### 构建流程

**build-all-themes.sh 脚本：**
```bash
#!/bin/bash
set -e

THEMES=("bootstrap" "fixit" "next")
BASE_URL="https://blog.panghuli.cn"

# 清理旧构建
rm -rf public/*

# 为每个主题构建
for theme in "${THEMES[@]}"; do
  echo "Building theme: $theme"

  hugo \
    --config "config/_default,config/$theme" \
    --baseURL "$BASE_URL/$theme/" \
    --destination "public/$theme" \
    --gc \
    --minify
done

# 创建入口页面
cat > public/index.html <<EOF
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Redirecting...</title>
  <script>
    const theme = localStorage.getItem('preferred-theme') || 'bootstrap';
    window.location.href = '/' + theme + '/';
  </script>
</head>
<body>
  <p>Redirecting to your preferred theme...</p>
</body>
</html>
EOF

echo "All themes built successfully!"
```

### CI/CD 集成

修改 `.github/workflows/hugo.yml`：
- 替换单次 `hugo` 构建为 `./scripts/build-all-themes.sh`
- 调整缓存策略以支持多主题构建
- 增加构建超时时间（预计 5-10 分钟）

## 实施步骤

### 阶段 1：准备工作
1. 添加 FixIt 和 hugo-theme-next 作为 Hugo modules
2. 创建各主题的配置目录和基础配置
3. 测试每个主题的独立构建

### 阶段 2：配置适配
1. 为每个主题创建完整的配置文件
2. 调整 front matter 以兼容所有主题
3. 测试内容在各主题下的显示效果

### 阶段 3：切换器开发
1. 开发主题切换器 UI 组件
2. 实现切换逻辑和状态保存
3. 将切换器注入到各主题中

### 阶段 4：构建自动化
1. 编写 build-all-themes.sh 脚本
2. 创建入口页面和重定向逻辑
3. 更新 CI/CD 配置

### 阶段 5：测试和优化
1. 测试所有主题的构建和切换
2. 检查 203 篇文章在各主题下的兼容性
3. 优化构建时间和部署体积

## 潜在问题和解决方案

### 问题 1：Front Matter 不兼容
**解决方案：**
- 使用 Hugo 的 `cascade` 功能设置默认值
- 在主题配置中定义字段别名
- 必要时编写脚本批量更新 front matter

### 问题 2：主题特有功能
**解决方案：**
- 识别每个主题的独特功能
- 在其他主题中提供降级方案或隐藏该功能
- 在文档中说明各主题的功能差异

### 问题 3：构建时间过长
**解决方案：**
- 使用 GitHub Actions 缓存
- 考虑增量构建（仅在主题配置变更时重建该主题）
- 优化 Hugo 构建参数

### 问题 4：URL 结构变化影响 SEO
**解决方案：**
- 保持 bootstrap 主题为默认主题（/bootstrap/ 路径）
- 添加 canonical 标签指向主版本
- 在 robots.txt 中配置爬虫规则

## 成功标准

1. ✅ 用户可以在 3 个主题间无缝切换
2. ✅ 主题选择在浏览器中持久化
3. ✅ 所有 203 篇文章在各主题下正常显示
4. ✅ 构建时间在 10 分钟以内
5. ✅ 部署成功且所有主题可访问
6. ✅ 主题切换器在所有主题中正常工作

## 维护计划

- **主题更新：** 定期更新各主题到最新版本
- **兼容性测试：** 新文章发布前测试在所有主题下的显示
- **性能监控：** 监控构建时间和部署体积
- **用户反馈：** 收集用户对各主题的使用反馈

## 附录：Hugo 博客改进建议

作为 Hugo 专家，对当前项目的其他改进建议：

### 1. 性能优化
- 启用 Hugo 的图片处理功能（image processing）自动生成响应式图片
- 配置 PostCSS 的 PurgeCSS 移除未使用的 CSS
- 启用 Hugo 的资源指纹（fingerprinting）和 CDN 支持

### 2. 内容管理
- 使用 Hugo 的 Page Bundles（已部分使用）统一管理文章资源
- 配置 archetypes 为不同类型内容创建模板
- 使用 Hugo 的 Related Content 功能改进相关文章推荐

### 3. 开发体验
- 配置 Hugo 的 LiveReload 和 Fast Render 加速本地开发
- 使用 Hugo Modules 管理主题和依赖（即将实施）
- 添加 pre-commit hooks 验证 front matter 格式

### 4. SEO 和可访问性
- 添加结构化数据（JSON-LD）
- 配置 Open Graph 和 Twitter Cards
- 确保所有图片有 alt 文本
- 添加站点地图和 RSS feed 优化

### 5. 国际化
- 虽然主要是中文内容，但可以为关键页面添加英文版本
- 配置 Hugo 的多语言支持
- 使用 i18n 功能管理翻译

### 6. 监控和分析
- 集成 Google Analytics 或其他分析工具（配置中已有但未启用）
- 添加性能监控（Core Web Vitals）
- 配置错误追踪

这些改进可以在多主题系统实施后逐步进行。
