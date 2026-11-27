# 参考与实测

用户指定 https://lruihao.cn/ 作为视觉与布局参考。实际访问页面并读取其公开仓库 https://github.com/Lruihao/hugo-blog 的配置和自定义样式后确认：

- 首页为完整个人首屏、低饱和渐变、真实发文热力图；1440px 视口下内容区宽 1124px，首屏主体高 944px。
- 首页文章采用 FixIt 原生双栏，1440px 视口下单卡宽 554px。
- 文章列表为原生的最近更新区及年份分组列表。
- 标志、书法字、头像、口号与插画不属于本站素材。

访问统计参考用户截图 https://geekswg.js.cool/：读取其脚本和服务公开接入文档 https://busuanzi.cc/，确认六个指标的 DOM 标识为 `busuanzi_page_pv`、`busuanzi_page_uv`、`busuanzi_today_pv`、`busuanzi_today_uv`、`busuanzi_site_pv`、`busuanzi_site_uv`。

统计服务脚本为 https://cdn.busuanzi.cc/busuanzi/3.6.9/busuanzi.min.js。服务文档不接受 localhost 或 IP 地址，因此本地不请求服务，集成测试使用模拟响应。
