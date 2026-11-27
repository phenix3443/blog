import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright';

const server = spawn('python3', ['-u', '-m', 'http.server', '0', '--bind', '127.0.0.1', '--directory', 'public'], {
  stdio: ['ignore', 'pipe', 'ignore'],
});
let browser;
try {
  const base = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('测试服务器启动超时')), 10000);
    server.once('error', reject);
    server.once('exit', code => reject(new Error(`测试服务器退出：${code}`)));
    server.stdout.on('data', data => {
      const port = String(data).match(/port (\d+)/)?.[1];
      if (port) {
        clearTimeout(timeout);
        resolve(`http://127.0.0.1:${port}`);
      }
    });
  });
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.url().startsWith(base) && response.status() >= 400) {
      errors.push(`${response.status()} ${response.url()}`);
    }
  });
  const screenshots = join(tmpdir(), 'blog-fixit-validation');
  await mkdir(screenshots, { recursive: true });
  await page.goto(base, { waitUntil: 'networkidle' });
  assert.equal(await page.title(), "phenix3443's blog");
  assert.equal(await page.locator('html').getAttribute('lang'), 'zh-CN');
  assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), 'https://blog.panghuli.cn/');
  assert.equal(await page.locator('.summary').count(), 10);
  assert.ok(await page.locator('.contribution-graph').count() > 0);
  assert.equal(await page.locator('.home-profile').getAttribute('data-fullscreen') !== null, true);
  const statisticIds = ['page_pv', 'page_uv', 'today_pv', 'today_uv', 'site_pv', 'site_uv'];
  for (const id of statisticIds) {
    assert.equal(await page.locator(`#busuanzi_${id}`).count(), 1);
    assert.equal(await page.locator(`#busuanzi_${id}`).innerText(), '—');
  }
  assert.equal(await page.locator('script[src*="cdn.busuanzi.cc"]').count(), 0, '本地预览不加载线上计数服务');
  assert.equal(await page.getByRole('button', { name: /blog 子菜单/ }).count(), 0);
  await page.screenshot({ path: join(screenshots, 'home-desktop.png') });

  await page.getByRole('button', { name: '搜索', exact: true }).first().click();
  await page.getByRole('searchbox').fill('Chezmoi');
  await page.locator('.aa-Item').first().waitFor();
  assert.match(await page.locator('.aa-Item').first().innerText(), /Chezmoi/i);
  await page.getByRole('button', { name: 'Close Search Dialog' }).click();

  await page.getByRole('button', { name: '切换主题', exact: true }).first().click();
  await page.getByRole('button', { name: '切换主题', exact: true }).first().click();
  assert.equal(await page.locator('html').getAttribute('data-theme-mode'), 'dark');
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.locator('html').getAttribute('data-theme-mode'), 'dark');
  await page.screenshot({ path: join(screenshots, 'home-dark.png') });

  for (const path of ['/archives/', '/categories/', '/tags/', '/about/', '/posts/cryptography-in-blockchain/']) {
    const response = await page.goto(base + path, { waitUntil: 'networkidle' });
    assert.equal(response.status(), 200, path);
    if (path.includes('cryptography')) {
      assert.ok(await page.locator('.katex').count() > 0, '公式应由 KaTeX 渲染');
      await page.screenshot({ path: join(screenshots, 'article.png') });
    }
    if (path === '/about/') assert.match(await page.locator('main').innerText(), /I['’]m phenix3443/);
    if (path === '/archives/') {
      assert.ok(await page.locator('main a[href*="/posts/"]').count() > 0);
      assert.ok(await page.locator('main a[href="/archives/page/2/"]').count() > 0);
    }
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base, { waitUntil: 'networkidle' });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '手机页面不应横向溢出');
  await page.locator('#menu-toggle-mobile').click();
  await page.locator('#header-mobile').getByRole('link', { name: '关于', exact: true }).click();
  await page.waitForURL('**/about/');
  await page.screenshot({ path: join(screenshots, 'about-mobile.png') });
  const statsContext = await browser.newContext();
  await statsContext.route('https://blog.panghuli.cn/**', async route => {
    const url = new URL(route.request().url());
    const response = await statsContext.request.get(base + url.pathname + url.search);
    await route.fulfill({ response });
  });
  const fixtureCounts = { page_pv: 11, page_uv: 7, today_pv: 30, today_uv: 19, site_pv: 1000, site_uv: 300 };
  let counterLoads = 0;
  await statsContext.route('https://cdn.busuanzi.cc/busuanzi/3.6.9/busuanzi.min.js', route => {
    counterLoads += 1;
    return route.fulfill({ contentType: 'application/javascript', body:
      `for (const [id, value] of Object.entries(${JSON.stringify(fixtureCounts)})) {
         document.querySelectorAll('#busuanzi_' + id).forEach(node => { node.textContent = value; });
       }` });
  });
  const statsPage = await statsContext.newPage();
  for (const path of ['/', '/posts/cryptography-in-blockchain/']) {
    await statsPage.goto('https://blog.panghuli.cn' + path, { waitUntil: 'networkidle' });
    for (const [id, value] of Object.entries(fixtureCounts)) {
      assert.equal(await statsPage.locator(`#busuanzi_${id}`).count(), 1);
      assert.equal(await statsPage.locator(`#busuanzi_${id}`).innerText(), String(value));
    }
  }
  assert.equal(counterLoads, 2, '每页只加载一次计数服务');
  await statsContext.close();
  assert.deepEqual(errors, []);
  console.log(`首页、搜索、主题切换、归档、分类、标签、关于、公式、手机导航及六项访问统计集成检查通过。截图：${screenshots}`);
} finally {
  await browser?.close();
  server.kill();
}
