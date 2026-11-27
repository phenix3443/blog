const assert = require('node:assert/strict');
const { test } = require('node:test');
const checkRelease = require('../scripts/check-hugo-release.cjs');

function fixture({ latest = 'v0.171.0', current = '0.170.1', issues = [], ...release } = {}) {
  const created = [];
  const listed = [];
  const github = {
    rest: {
      repos: {
        getLatestRelease: async options => {
          assert.deepEqual(options, { owner: 'gohugoio', repo: 'hugo' });
          return { data: { tag_name: latest, html_url: `https://github.com/gohugoio/hugo/releases/tag/${latest}`, ...release } };
        },
      },
      issues: {
        listForRepo: Symbol('listForRepo'),
        create: async issue => {
          created.push(issue);
          return { data: { number: 123 } };
        },
      },
    },
    paginate: async (method, options) => {
      assert.equal(method, github.rest.issues.listForRepo);
      listed.push(options);
      return issues;
    },
  };
  const options = {
    github,
    context: { repo: { owner: 'phenix3443', repo: 'blog' } },
    core: { info() {} },
    currentVersion: current,
  };
  return { options, created, listed };
}

test('新稳定版创建包含版本、发布说明和更新文件的 Issue', async () => {
  const { options, created, listed } = fixture();
  await checkRelease(options);
  assert.deepEqual(listed, [{ owner: 'phenix3443', repo: 'blog', state: 'all', per_page: 100 }]);
  assert.equal(created.length, 1);
  assert.equal(created[0].title, 'chore(deps): 更新 Hugo 至 v0.171.0');
  assert.equal(created[0].owner, 'phenix3443');
  assert.equal(created[0].repo, 'blog');
  assert.match(created[0].body, /hugo-release:0\.171\.0/);
  assert.match(created[0].body, /0\.170\.1/);
  assert.match(created[0].body, /https:\/\/github.com\/gohugoio\/hugo\/releases\/tag\/v0\.171\.0/);
  assert.match(created[0].body, /vercel\.json/);
});

for (const latest of ['v0.170.1', 'v0.170.0', 'v0.99.9']) {
  test(`当前版本不落后于 ${latest} 时不创建 Issue`, async () => {
    const { options, created, listed } = fixture({ latest });
    await checkRelease(options);
    assert.equal(created.length, 0);
    assert.equal(listed.length, 0);
  });
}

for (const state of ['open', 'closed']) {
  test(`已有 ${state} 提醒即使标题被修改也不重复创建`, async () => {
    const { options, created } = fixture({
      issues: [{ number: 1, state, title: '修改后的标题', body: '<!-- hugo-release:0.171.0 -->' }],
    });
    await checkRelease(options);
    assert.equal(created.length, 0);
  });
}

test('旧版本提醒和包含相同标记的 PR 不阻止新提醒', async () => {
  const { options, created } = fixture({ issues: [
    { body: '<!-- hugo-release:0.170.0 -->' },
    { body: '<!-- hugo-release:0.171.0 -->', pull_request: {} },
  ] });
  await checkRelease(options);
  assert.equal(created.length, 1);
});

for (const release of [{ latest: 'v0.171.0-rc.1' }, { prerelease: true }, { draft: true }]) {
  test(`忽略非稳定发布 ${JSON.stringify(release)}`, async () => {
    const { options, created, listed } = fixture(release);
    await checkRelease(options);
    assert.equal(created.length, 0);
    assert.equal(listed.length, 0);
  });
}

for (const versions of [{ latest: 'invalid' }, { current: 'invalid' }]) {
  test(`无效版本使检查失败：${JSON.stringify(versions)}`, async () => {
    const { options, created } = fixture(versions);
    await assert.rejects(checkRelease(options), /版本无效/);
    assert.equal(created.length, 0);
  });
}

test('获取 Issue 失败时停止，不创建重复提醒', async () => {
  const { options, created } = fixture();
  options.github.paginate = async () => { throw new Error('API unavailable'); };
  await assert.rejects(checkRelease(options), /API unavailable/);
  assert.equal(created.length, 0);
});
