// 扫描每个评测文件夹的 meta.json，生成首页 index.html（卡片墙，按日期倒序，可按标签筛选），并更新两份 README 里的列表。
// 首页一次只显示一种语言，优先级：网址参数 ?lang=zh / ?lang=en > 右上角「中文 / EN」切换过（记在 localStorage 的 aie-lang）> 浏览器语言（zh 开头用中文，其余英文）。
// 切换时地址栏同步改成 ?lang=…，方便带着语言分享；点进 demo 的链接也带上 ?lang=，demo 页右上角的 assets/nav.js 用同样的规则。
// 用法：node tools/build_index.mjs（publish.mjs 会自动调用）
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://eternityspring.github.io/ai-explorations/';
const GITHUB = 'https://github.com/eternityspring/ai-explorations';

const evals = readdirSync(REPO, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(REPO, d.name, 'meta.json')))
  .map((d) => ({ slug: d.name, ...JSON.parse(readFileSync(join(REPO, d.name, 'meta.json'), 'utf8')) }))
  .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || a.slug.localeCompare(b.slug));

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// 一段中英文：两种都写进页面，按 <html data-lang> 只显示一种
const t = (zh, en, tag = 'span', cls = '') => `<${tag} class="zh ${cls}">${esc(zh)}</${tag}><${tag} class="en ${cls}" lang="en">${esc(en || zh)}</${tag}>`;
const tagPairs = new Map();   // 中文标签 → 英文标签
for (const e of evals) (e.tags ?? []).forEach((x, i) => tagPairs.has(x) || tagPairs.set(x, e.tagsEn?.[i] ?? x));

const ICON_GH = '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>';

const card = (e) => {
  const href = (f) => `${e.slug}/${f}`;
  const demo = href(e.demo ?? 'index.html');
  return `
  <article class="card" data-tags="${(e.tags ?? []).map(esc).join('|')}">
    <a class="cover" href="${demo}" data-demo aria-label="${esc(e.titleEn || e.title)}">
      ${e.cover ? `<img src="${href(e.cover)}" alt="" loading="lazy">` : ''}
      ${e.video ? `<video muted loop playsinline preload="none" data-src="${href(e.video)}"></video>` : ''}
      <span class="play">${t('打开 demo', 'Open demo')}</span>
    </a>
    <div class="body">
      <p class="meta"><time datetime="${esc(e.date)}">${esc(e.date)}</time>${(e.tags ?? []).map((x, i) => `<span class="tag">${t(x, e.tagsEn?.[i])}</span>`).join('')}</p>
      <h2>${t(e.title, e.titleEn)}</h2>
      ${t(e.summary, e.summaryEn, 'p', 'sum')}
      ${e.models?.length ? `<p class="models">${e.models.map((x) => `<code>${esc(x)}</code>`).join('')}</p>` : ''}
      ${e.notes?.length ? `<details><summary>${t('要点', 'Notes')}</summary><ul>${e.notes.map(([zh, en]) => `<li>${t(zh, en)}</li>`).join('')}</ul></details>` : ''}
      <p class="links"><a class="btn primary" href="${demo}" data-demo>${t('打开 demo', 'Open demo')} ↗</a>${e.video ? `<a class="btn" href="${href(e.video)}">${t('演示视频', 'Video')}</a>` : ''}</p>
    </div>
  </article>`;
};

const html = `<!doctype html>
<html lang="en" data-lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AI Explorations</title>
<script>
// 渲染前就定好语言，免得先闪一下另一种：网址参数 ?lang= > 切换过的选择 > 浏览器语言
(() => {
  const norm = (v) => { v = String(v || '').toLowerCase(); return v.startsWith('zh') || v === 'cn' ? 'zh' : v.startsWith('en') ? 'en' : null; };
  let lang = norm(new URLSearchParams(location.search).get('lang'));
  if (!lang) try { lang = norm(localStorage.getItem('aie-lang')); } catch {}
  if (!lang) lang = norm(navigator.languages?.[0] || navigator.language) || 'en';
  const h = document.documentElement; h.dataset.lang = lang; h.lang = lang === 'zh' ? 'zh-CN' : 'en';
  if (lang === 'zh') document.title = 'AI 探索笔记';
})();
</script>
<meta name="description" content="Hands-on tests and interactive demos of AI models. 一些 AI 模型的实测和可以直接上手玩的 demo。">
<meta property="og:type" content="website">
<meta property="og:title" content="AI Explorations · AI 探索笔记">
<meta property="og:description" content="Hands-on tests and interactive demos of AI models. 一些 AI 模型的实测和可以直接上手玩的 demo。">
<meta property="og:url" content="${SITE}">
${evals[0]?.cover ? `<meta property="og:image" content="${SITE}${evals[0].slug}/${evals[0].cover}">\n<meta name="twitter:card" content="summary_large_image">` : ''}
<style>
:root { --bg:#f6f3ee; --card:#fffdf9; --ink:#1d1b18; --muted:#78716a; --line:#e4ddd2; --chip:#efe9df; --accent:#d6402a; --accent-ink:#fff; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg:#141312; --card:#1d1c1a; --ink:#efebe4; --muted:#a29a8f; --line:#2f2c29; --chip:#2a2724; --accent:#ff6a4d; --accent-ink:#1a0d0a; } }
:root[data-theme="dark"] { --bg:#141312; --card:#1d1c1a; --ink:#efebe4; --muted:#a29a8f; --line:#2f2c29; --chip:#2a2724; --accent:#ff6a4d; --accent-ink:#1a0d0a; }
html[data-lang="zh"] .en, html[data-lang="en"] .zh { display:none !important; }
* { box-sizing:border-box; }
html { -webkit-text-size-adjust:100%; }
body { margin:0; background:var(--bg); color:var(--ink); font:15px/1.65 "PingFang SC","Hiragino Sans GB","Noto Sans SC",-apple-system,"Segoe UI",sans-serif; -webkit-font-smoothing:antialiased; }
html[data-lang="en"] body { font-family:"Avenir Next","Helvetica Neue",-apple-system,"Segoe UI",Arial,sans-serif; }
main { max-width:1180px; margin:0 auto; padding:20px 16px 72px; }
.topbar { display:flex; justify-content:flex-end; align-items:center; gap:10px; margin-bottom:28px; }
.lang { display:inline-flex; gap:2px; padding:3px; border:1px solid var(--line); border-radius:999px; background:var(--card); }
.lang button { font:inherit; font-size:13px; line-height:1.2; border:0; background:none; color:var(--muted); padding:5px 12px; border-radius:999px; cursor:pointer; }
.lang button[aria-pressed="true"] { background:var(--ink); color:var(--bg); }
.gh { display:inline-flex; align-items:center; gap:7px; font-size:13px; color:var(--ink); text-decoration:none; border:1px solid var(--line); background:var(--card); padding:6px 13px; border-radius:999px; }
.gh svg { width:15px; height:15px; }
.gh:hover, .lang button:hover { border-color:var(--muted); color:var(--ink); }
header { margin-bottom:28px; }
h1 { margin:0; font:700 clamp(34px, 6vw, 56px)/1.08 "Iowan Old Style","Palatino","Georgia","Songti SC",serif; letter-spacing:-.01em; }
h1 small { display:block; margin-top:10px; font:500 clamp(16px, 2.2vw, 20px)/1.3 "Iowan Old Style","Palatino","Georgia",serif; color:var(--muted); letter-spacing:.02em; }
html[data-lang="zh"] h1 { font-family:"Songti SC","Noto Serif SC","Iowan Old Style",serif; letter-spacing:.02em; }
.intro { max-width:640px; margin:18px 0 0; color:var(--muted); }
.filters { display:flex; flex-wrap:wrap; gap:8px; margin:28px 0 22px; }
.filters button { font:inherit; font-size:13px; line-height:1.3; border:1px solid var(--line); background:var(--card); color:var(--ink); padding:6px 14px; border-radius:999px; cursor:pointer; }
.filters button[aria-pressed="true"] { background:var(--ink); color:var(--bg); border-color:var(--ink); }
.grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(min(100%, 340px), 1fr)); gap:22px; }
.card { background:var(--card); border:1px solid var(--line); border-radius:16px; overflow:hidden; display:flex; flex-direction:column; }
.card[hidden] { display:none; }
.cover { position:relative; display:block; aspect-ratio:16/9; background:var(--chip); overflow:hidden; }
.cover img, .cover video { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; transition:transform .5s, opacity .3s; }
.cover video { opacity:0; }
.cover.playing video { opacity:1; }
.cover:hover img { transform:scale(1.03); }
.play { position:absolute; right:12px; bottom:12px; background:rgba(0,0,0,.62); color:#fff; font-size:13px; line-height:1.25; padding:6px 12px; border-radius:10px; backdrop-filter:blur(6px); }
.body { padding:18px 20px 20px; display:flex; flex-direction:column; flex:1; }
.meta { margin:0 0 10px; display:flex; flex-wrap:wrap; gap:6px 8px; align-items:center; font-size:12px; color:var(--muted); }
.meta time { font-variant-numeric:tabular-nums; margin-right:4px; }
.tag { background:var(--chip); color:var(--ink); border-radius:6px; padding:2px 8px; }
h2 { margin:0 0 10px; font-size:20px; line-height:1.35; }
.sum { margin:0 0 8px; }
.models { display:flex; flex-wrap:wrap; gap:6px; margin:6px 0 10px; }
.models code { font:12px/1.4 ui-monospace,"SF Mono",Menlo,monospace; background:var(--chip); border-radius:6px; padding:3px 7px; }
details { margin:4px 0 12px; border-top:1px solid var(--line); padding-top:10px; }
summary { cursor:pointer; font-weight:600; font-size:14px; }
details ul { margin:8px 0 0; padding-left:18px; }
details li { margin:0 0 8px; font-size:14px; }
.links { margin:auto 0 0; padding-top:8px; display:flex; flex-wrap:wrap; gap:8px; }
.btn { font-size:13.5px; text-decoration:none; color:var(--ink); border:1px solid var(--line); border-radius:10px; padding:7px 14px; }
.btn.primary { background:var(--accent); border-color:var(--accent); color:var(--accent-ink); }
.btn.ghost { border-color:transparent; }
.btn:hover { border-color:var(--muted); }
.btn:focus-visible, .filters button:focus-visible, .cover:focus-visible, summary:focus-visible, .lang button:focus-visible, .gh:focus-visible { outline:2px solid var(--accent); outline-offset:2px; }
footer { margin-top:48px; color:var(--muted); font-size:13px; }
footer a { color:inherit; }
@media (prefers-reduced-motion: reduce) { .cover img, .cover video { transition:none; } }
</style>
</head>
<body>
<main>
  <div class="topbar">
    <div class="lang" role="group" aria-label="语言 Language">
      <button type="button" data-set-lang="zh" aria-pressed="false">中文</button>
      <button type="button" data-set-lang="en" aria-pressed="false">EN</button>
    </div>
    <a class="gh" href="${GITHUB}" target="_blank" rel="noopener">${ICON_GH}<span>GitHub</span></a>
  </div>
  <header>
    <h1><span class="zh">AI 探索笔记<small>AI Explorations</small></span><span class="en" lang="en">AI Explorations</span></h1>
    ${t('一些 AI 模型的实测，和可以直接上手玩的 demo。每一个都是静态网页，点开就能玩。', 'Hands-on tests of AI models, with interactive demos you can play with right in the browser.', 'p', 'intro')}
  </header>
  <nav class="filters" aria-label="Filter">
    <button type="button" aria-pressed="true" data-tag="">${t('全部', 'All')}</button>
    ${[...tagPairs].map(([zh, en]) => `<button type="button" aria-pressed="false" data-tag="${esc(zh)}">${t(zh, en)}</button>`).join('\n    ')}
  </nav>
  <section class="grid">${evals.map(card).join('')}
  </section>
  <footer>${t(`共 ${evals.length} 个 demo`, `${evals.length} demo${evals.length === 1 ? '' : 's'}`)} · <a href="${GITHUB}">GitHub</a></footer>
</main>
<script>
// 语言切换：记住选择、地址栏改成 ?lang=…；点进 demo 的链接带上当前语言
const langButtons = document.querySelectorAll('[data-set-lang]');
function setLang(lang, save) {
  const h = document.documentElement; h.dataset.lang = lang; h.lang = lang === 'zh' ? 'zh-CN' : 'en';
  document.title = lang === 'zh' ? 'AI 探索笔记' : 'AI Explorations';
  langButtons.forEach((b) => b.setAttribute('aria-pressed', b.dataset.setLang === lang));
  document.querySelectorAll('a[data-demo]').forEach((a) => { const u = new URL(a.href); u.searchParams.set('lang', lang); a.href = u.href; });
  if (save) {
    try { localStorage.setItem('aie-lang', lang); } catch {}
    const u = new URL(location.href); u.searchParams.set('lang', lang); history.replaceState(null, '', u);
  }
}
langButtons.forEach((b) => b.addEventListener('click', () => setLang(b.dataset.setLang, true)));
setLang(document.documentElement.dataset.lang, false);
// 按标签筛选
const buttons = document.querySelectorAll('.filters button'), cards = document.querySelectorAll('.card');
buttons.forEach((b) => b.addEventListener('click', () => {
  buttons.forEach((x) => x.setAttribute('aria-pressed', x === b));
  cards.forEach((c) => { c.hidden = !!b.dataset.tag && !c.dataset.tags.split('|').includes(b.dataset.tag); });
}));
// 鼠标移到封面上就播放演示视频（第一次才加载），移开暂停；触屏设备只显示封面
if (matchMedia('(hover: hover)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.querySelectorAll('.cover').forEach((a) => {
    const v = a.querySelector('video'); if (!v) return;
    a.addEventListener('mouseenter', () => { if (!v.src) v.src = v.dataset.src; v.play().then(() => a.classList.add('playing')).catch(() => {}); });
    a.addEventListener('mouseleave', () => { v.pause(); a.classList.remove('playing'); });
  });
}
</script>
</body>
</html>
`;
writeFileSync(join(REPO, 'index.html'), html);

// 两份 README 里的列表（英文版 README.md、中文版 README.zh-CN.md）
const lists = {
  'README.md': ['| Demo | Models |', (e) => `| [${e.titleEn || e.title}](${SITE}${e.slug}/) | ${(e.models ?? []).join(', ')} |`],
  'README.zh-CN.md': ['| Demo | 模型 |', (e) => `| [${e.title}](${SITE}${e.slug}/) | ${(e.models ?? []).join(', ')} |`],
};
for (const [file, [head, row]] of Object.entries(lists)) {
  const p = join(REPO, file);
  if (!existsSync(p)) continue;
  const body = readFileSync(p, 'utf8').replace(/<!-- evals:start -->[\s\S]*<!-- evals:end -->/,
    `<!-- evals:start -->\n${head}\n|---|---|\n${evals.map(row).join('\n')}\n<!-- evals:end -->`);
  writeFileSync(p, body);
}
console.log(`index.html：${evals.length} 个评测`);
