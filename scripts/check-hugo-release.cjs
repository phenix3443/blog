const semver = require('semver');

module.exports = async ({ github, context, core, currentVersion }) => {
  const current = semver.valid(currentVersion);
  if (!current) throw new Error(`项目 Hugo 版本无效：${currentVersion}`);

  const { data: release } = await github.rest.repos.getLatestRelease({
    owner: 'gohugoio',
    repo: 'hugo',
  });
  const latest = semver.valid(release.tag_name);
  if (!latest) throw new Error(`Hugo 发布版本无效：${release.tag_name}`);
  if (release.draft || release.prerelease || semver.prerelease(latest)) {
    core.info('跳过非稳定版本。');
    return;
  }
  if (!semver.gt(latest, current)) {
    core.info(`无需更新：当前 ${current}，最新稳定版 ${latest}。`);
    return;
  }

  const marker = `<!-- hugo-release:${latest} -->`;
  const issues = await github.paginate(github.rest.issues.listForRepo, {
    ...context.repo,
    state: 'all',
    per_page: 100,
  });
  const existing = issues.find(issue => !issue.pull_request && issue.body?.includes(marker));
  if (existing) {
    core.info(`版本 ${latest} 已有提醒：#${existing.number}，不重复创建。`);
    return;
  }

  const { data: issue } = await github.rest.issues.create({
    ...context.repo,
    title: `chore(deps): 更新 Hugo 至 v${latest}`,
    body: [
      marker,
      `Hugo 已发布新的稳定版本 **v${latest}**，本项目当前使用 **${current}**。`,
      '',
      `发布说明：[Hugo ${release.tag_name}](${release.html_url})`,
      '',
      '更新时请同步检查：',
      '',
      '- `.github/workflows/` 中的 `HUGO_VERSION`。',
      '- `vercel.json` 和 `vercel.fixit.json` 中的版本及下载地址。',
      '- `README.md`、`CLAUDE.md` 和 `VERCEL_DEPLOY.md` 中的版本说明。',
      '- `tests/test_project.py` 中的版本一致性检查。',
      '',
      '更新后运行 `make check` 和 `npm test`，确认 FixIt 主题兼容。',
    ].join('\n'),
  });
  core.info(`已创建 Hugo 更新提醒：#${issue.number}。`);
};
