// 扫描每个评测文件夹的 meta.json，生成首页 index.html（卡片墙，按日期倒序，可按标签筛选），并更新 README.md 里的列表。
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
const tagPairs = new Map();   // 中文标签 → 英文标签
for (const e of evals) (e.tags ?? []).forEach((t, i) => tagPairs.has(t) || tagPairs.set(t, e.tagsEn?.[i] ?? ''));

const card = (e) => {
  const href = (f) => `${e.slug}/${f}`;
  const tags = (e.tags ?? []).map((t) => esc(t)).join('|');
  return `
  <article class="card" data-tags="${tags}">
    <a class="cover" href="${href(e.demo ?? 'index.html')}" aria-label="打开 demo：${esc(e.title)}">
      ${e.cover ? `<img src="${href(e.cover)}" alt="" loading="lazy">` : ''}
      ${e.video ? `<video muted loop playsinline preload="none" data-src="${href(e.video)}"></video>` : ''}
      <span class="play">打开 demo<small>Open demo</small></span>
    </a>
    <div class="body">
      <p class="meta"><time datetime="${esc(e.date)}">${esc(e.date)}</time>${(e.tags ?? []).map((t, i) => `<span class="tag">${esc(t)}<small>${esc(e.tagsEn?.[i] ?? '')}</small></span>`).join('')}</p>
      <h2>${esc(e.title)}<span lang="en">${esc(e.titleEn)}</span></h2>
      <p class="sum">${esc(e.summary)}</p>
      <p class="sum en" lang="en">${esc(e.summaryEn)}</p>
      ${e.models?.length ? `<p class="models">${e.models.map((x) => `<code>${esc(x)}</code>`).join('')}</p>` : ''}
      ${e.notes?.length ? `<details><summary>要点 <span lang="en">Notes</span></summary><ul>${e.notes.map(([zh, en]) => `<li>${esc(zh)}<span lang="en">${esc(en)}</span></li>`).join('')}</ul></details>` : ''}
      <p class="links"><a class="btn primary" href="${href(e.demo ?? 'index.html')}">打开 demo <span lang="en">Open</span> ↗</a>${e.video ? `<a class="btn" href="${href(e.video)}">演示视频 <span lang="en">Video</span></a>` : ''}<a class="btn ghost" href="${GITHUB}/tree/main/${e.slug}">源文件 <span lang="en">Files</span></a></p>
    </div>
  </article>`;
};

const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AI Explorations · AI 探索笔记</title>
<meta name="description" content="一些 AI 模型的实测和可以直接上手玩的 demo。Hands-on tests and interactive demos of AI models.">
<meta property="og:type" content="website">
<meta property="og:title" content="AI Explorations · AI 探索笔记">
<meta property="og:description" content="一些 AI 模型的实测和可以直接上手玩的 demo。Hands-on tests and interactive demos of AI models.">
<meta property="og:url" content="${SITE}">
${evals[0]?.cover ? `<meta property="og:image" content="${SITE}${evals[0].slug}/${evals[0].cover}">\n<meta name="twitter:card" content="summary_large_image">` : ''}
<style>
:root { --bg:#f6f3ee; --card:#fffdf9; --ink:#1d1b18; --muted:#78716a; --line:#e4ddd2; --chip:#efe9df; --accent:#d6402a; --accent-ink:#fff; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg:#141312; --card:#1d1c1a; --ink:#efebe4; --muted:#a29a8f; --line:#2f2c29; --chip:#2a2724; --accent:#ff6a4d; --accent-ink:#1a0d0a; } }
:root[data-theme="dark"] { --bg:#141312; --card:#1d1c1a; --ink:#efebe4; --muted:#a29a8f; --line:#2f2c29; --chip:#2a2724; --accent:#ff6a4d; --accent-ink:#1a0d0a; }
* { box-sizing:border-box; }
html { -webkit-text-size-adjust:100%; }
body { margin:0; background:var(--bg); color:var(--ink); font:15px/1.65 "PingFang SC","Hiragino Sans GB","Noto Sans SC",-apple-system,"Segoe UI",sans-serif; -webkit-font-smoothing:antialiased; }
[lang="en"] { font-family:"Avenir Next","Helvetica Neue",-apple-system,"Segoe UI",Arial,sans-serif; }
main { max-width:1180px; margin:0 auto; padding:56px 16px 72px; }
header { margin-bottom:28px; }
h1 { margin:0; font:700 clamp(34px, 6vw, 56px)/1.05 "Iowan Old Style","Palatino","Georgia","Songti SC",serif; letter-spacing:-.01em; }
h1 span { display:block; margin-top:8px; font:500 clamp(18px, 2.6vw, 24px)/1.3 "Songti SC","Noto Serif SC",serif; color:var(--muted); letter-spacing:.06em; }
.intro { max-width:640px; margin:18px 0 0; color:var(--muted); }
.intro span { display:block; font-size:14px; }
.filters { display:flex; flex-wrap:wrap; gap:8px; margin:28px 0 22px; }
.filters button { font:inherit; font-size:13px; line-height:1.3; border:1px solid var(--line); background:var(--card); color:var(--ink); padding:6px 14px; border-radius:999px; cursor:pointer; }
.filters button small { margin-left:6px; color:var(--muted); font-size:11px; }
.filters button[aria-pressed="true"] { background:var(--ink); color:var(--bg); border-color:var(--ink); }
.filters button[aria-pressed="true"] small { color:inherit; opacity:.7; }
.grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(min(100%, 340px), 1fr)); gap:22px; }
.card { background:var(--card); border:1px solid var(--line); border-radius:16px; overflow:hidden; display:flex; flex-direction:column; }
.card[hidden] { display:none; }
.cover { position:relative; display:block; aspect-ratio:16/9; background:var(--chip); overflow:hidden; }
.cover img, .cover video { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; transition:transform .5s, opacity .3s; }
.cover video { opacity:0; }
.cover.playing video { opacity:1; }
.cover:hover img { transform:scale(1.03); }
.play { position:absolute; right:12px; bottom:12px; background:rgba(0,0,0,.62); color:#fff; font-size:13px; line-height:1.25; padding:6px 12px; border-radius:10px; backdrop-filter:blur(6px); text-align:center; }
.play small { display:block; font-size:10px; opacity:.75; }
.body { padding:18px 20px 20px; display:flex; flex-direction:column; flex:1; }
.meta { margin:0 0 10px; display:flex; flex-wrap:wrap; gap:6px 8px; align-items:center; font-size:12px; color:var(--muted); }
.meta time { font-variant-numeric:tabular-nums; margin-right:4px; }
.tag { background:var(--chip); color:var(--ink); border-radius:6px; padding:2px 8px; }
.tag small { margin-left:5px; color:var(--muted); font-size:10.5px; }
h2 { margin:0 0 10px; font-size:20px; line-height:1.35; }
h2 span { display:block; font-size:14px; font-weight:500; color:var(--muted); margin-top:2px; }
.sum { margin:0 0 8px; }
.sum.en { color:var(--muted); font-size:13.5px; }
.models { display:flex; flex-wrap:wrap; gap:6px; margin:6px 0 10px; }
.models code { font:12px/1.4 ui-monospace,"SF Mono",Menlo,monospace; background:var(--chip); border-radius:6px; padding:3px 7px; }
details { margin:4px 0 12px; border-top:1px solid var(--line); padding-top:10px; }
summary { cursor:pointer; font-weight:600; font-size:14px; }
summary span { font-weight:500; color:var(--muted); margin-left:4px; }
details ul { margin:8px 0 0; padding-left:18px; }
details li { margin:0 0 8px; font-size:14px; }
details li span { display:block; color:var(--muted); font-size:12.5px; }
.links { margin:auto 0 0; padding-top:8px; display:flex; flex-wrap:wrap; gap:8px; }
.btn { font-size:13.5px; text-decoration:none; color:var(--ink); border:1px solid var(--line); border-radius:10px; padding:7px 14px; }
.btn span { color:var(--muted); font-size:12px; margin-left:2px; }
.btn.primary { background:var(--accent); border-color:var(--accent); color:var(--accent-ink); }
.btn.primary span { color:inherit; opacity:.8; }
.btn.ghost { border-color:transparent; }
.btn:hover { border-color:var(--muted); }
.btn:focus-visible, .filters button:focus-visible, .cover:focus-visible, summary:focus-visible { outline:2px solid var(--accent); outline-offset:2px; }
footer { margin-top:48px; color:var(--muted); font-size:13px; }
footer a { color:inherit; }
@media (prefers-reduced-motion: reduce) { .cover img, .cover video { transition:none; } }
</style>
</head>
<body>
<main>
  <header>
    <h1>AI Explorations<span>AI 探索笔记</span></h1>
    <p class="intro">一些 AI 模型的实测，和可以直接上手玩的 demo。每一个都是静态网页，点开就能玩。
      <span lang="en">Hands-on tests of AI models, with interactive demos you can play with right in the browser.</span></p>
  </header>
  <nav class="filters" aria-label="按标签筛选 Filter by tag">
    <button aria-pressed="true" data-tag="">全部<small>All</small></button>
    ${[...tagPairs].map(([zh, en]) => `<button aria-pressed="false" data-tag="${esc(zh)}">${esc(zh)}<small>${esc(en)}</small></button>`).join('\n    ')}
  </nav>
  <section class="grid">${evals.map(card).join('')}
  </section>
  <footer>共 ${evals.length} 个 · ${evals.length} demo${evals.length === 1 ? '' : 's'} · <a href="${GITHUB}">GitHub</a></footer>
</main>
<script>
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

// README 里的列表
const readme = join(REPO, 'README.md');
if (existsSync(readme)) {
  const list = evals.map((e) => `| ${e.date} | [${e.title}](${SITE}${e.slug}/)<br>${e.titleEn} | ${(e.models ?? []).join(', ')} |`).join('\n');
  const body = readFileSync(readme, 'utf8').replace(/<!-- evals:start -->[\s\S]*<!-- evals:end -->/,
    `<!-- evals:start -->\n| 日期 Date | Demo | 模型 Models |\n|---|---|---|\n${list}\n<!-- evals:end -->`);
  writeFileSync(readme, body);
}
console.log(`index.html：${evals.length} 个评测`);
