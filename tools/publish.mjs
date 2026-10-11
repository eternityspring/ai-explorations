// 把一个评测 demo 发布进这个仓库：按清单复制文件到 <slug>/，写 meta.json，重建首页；加 --push 就顺手提交并推送。
// 用法：node tools/publish.mjs <清单.json> [--push]
//
// 清单格式（由各评测自己的构建脚本生成，或手写）：
// {
//   "slug": "lost-cat-comic",                      // 文件夹名 = 网址路径：英文短名，小写字母、数字和 -（日期写在 meta.date 里）
//   "root": "/abs/path/to/eval/folder",             // files 里源路径的根目录
//   "files": { "index.html": "page.html", "orbit/frames/x": "orbit/frames/x", ... },   // 发布后的路径 → 源路径（文件或文件夹）
//   "meta": { "title", "titleEn", "date", "tags", "tagsEn", "models", "summary", "summaryEn", "notes": [[中, 英]...],
//             "demo": "index.html", "video": "demo.mp4", "cover": "cover.jpg",
//             "nav": "top-right" }        // 角落导航的位置：top-right（默认）/ top-left / bottom-right / bottom-left，false = 不加
// }
// 发布时会给 demo 里每个 .html 注入 assets/nav.js：页面角落一个小导航，能回到首页、打开这个 demo 在 GitHub 上的文件夹。
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [manifestPath, ...flags] = process.argv.slice(2);
if (!manifestPath) { console.error('用法：node tools/publish.mjs <清单.json> [--push]'); process.exit(1); }
const m = JSON.parse(readFileSync(manifestPath, 'utf8'));
if (!/^[a-z0-9][a-z0-9-]*$/.test(m.slug ?? '')) throw new Error(`slug 只能用小写字母、数字和 -：${m.slug}`);
const root = resolve(dirname(manifestPath), m.root ?? '.');
const dest = join(REPO, m.slug);

// 重新发布时整个文件夹换掉，免得留下旧文件
rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });
for (const [to, from] of Object.entries(m.files)) {
  const src = resolve(root, from);
  if (!existsSync(src)) throw new Error(`找不到：${src}`);
  mkdirSync(dirname(join(dest, to)), { recursive: true });
  cpSync(src, join(dest, to), { recursive: true });
}
writeFileSync(join(dest, 'meta.json'), JSON.stringify({ slug: m.slug, ...m.meta }, null, 2) + '\n');

// 注入角落导航（回首页 / 看源码）：路径按页面所在层级算，已经有的不重复加
const navPos = m.meta?.nav ?? 'top-right';
if (navPos !== false) {
  (function inject(d) {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      if (statSync(p).isDirectory()) { inject(p); continue; }
      if (!f.endsWith('.html')) continue;
      let html = readFileSync(p, 'utf8');
      if (html.includes('assets/nav.js')) continue;
      const depth = p.slice(REPO.length + 1).split('/').length - 1;
      const tag = `<script src="${'../'.repeat(depth)}assets/nav.js" async data-pos="${navPos}"></script>`;   // async：不等页面自己的脚本（比如从 CDN 下载 three.js），导航先出来
      html = /<\/body>/i.test(html) ? html.replace(/<\/body>(?![\s\S]*<\/body>)/i, `${tag}\n</body>`) : `${html}\n${tag}\n`;
      writeFileSync(p, html);
    }
  })(dest);
}

// 体积检查：GitHub 单个文件上限 100MB，Pages 整站建议不超过 1GB
let total = 0, n = 0;
const big = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f), st = statSync(p);
    if (st.isDirectory()) walk(p);
    else { total += st.size; n++; if (st.size > 50 * 2 ** 20) big.push(`${p.slice(REPO.length + 1)} ${(st.size / 2 ** 20).toFixed(1)}MB`); }
  }
})(dest);
console.log(`${m.slug}：${n} 个文件，${(total / 2 ** 20).toFixed(1)}MB`);
if (big.length) console.warn(`超过 50MB 的文件（GitHub 会警告，超过 100MB 推不上去）：\n  ${big.join('\n  ')}`);

execFileSync('node', [join(REPO, 'tools/build_index.mjs')], { stdio: 'inherit' });

if (flags.includes('--push')) {
  const git = (...a) => execFileSync('git', a, { cwd: REPO, stdio: 'inherit' });
  git('add', '-A', m.slug, 'index.html', 'README.md', 'assets');
  git('commit', '-m', `发布：${m.meta?.title ?? m.slug}`);
  git('push');
}
