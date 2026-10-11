// 每个 demo 页面角落里的小导航：回到「AI 探索笔记」首页，旁边一个 GitHub 图标（链到仓库首页）。
// 由 tools/publish.mjs 发布时自动注入：<script src="../assets/nav.js" async data-pos="top-right"></script>
// data-pos：top-right（默认）/ top-left / bottom-right / bottom-left。用 Shadow DOM，样式和 demo 页面互不影响。
// 语言跟首页同一套规则：网址参数 ?lang=zh / ?lang=en > 首页切换过的选择（localStorage 的 aie-lang）> 浏览器语言；回首页的链接带上 ?lang=。
(() => {
  const REPO = 'https://github.com/eternityspring/ai-explorations';
  const me = document.currentScript;
  if (!me || document.querySelector('[data-ai-explorations-nav]')) return;
  const [v, h] = (me.dataset.pos || 'top-right').split('-');
  const home = new URL('../', me.src);   // assets/ 的上一级就是首页
  const norm = (x) => { x = String(x || '').toLowerCase(); return x.startsWith('zh') || x === 'cn' ? 'zh' : x.startsWith('en') ? 'en' : null; };
  let lang = norm(new URLSearchParams(location.search).get('lang'));
  if (!lang) try { lang = norm(localStorage.getItem('aie-lang')); } catch {}
  if (!lang) lang = norm(navigator.languages?.[0] || navigator.language) || 'en';
  home.searchParams.set('lang', lang);
  const T = lang === 'zh'
    ? { home: 'AI 探索笔记', homeTip: '回到 AI 探索笔记首页', gh: '在 GitHub 上查看仓库' }
    : { home: 'AI Explorations', homeTip: 'Back to all demos', gh: 'View the repository on GitHub' };

  const ICON_HOME = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM9 9h5v5H9z" fill="currentColor"/></svg>';
  const ICON_GH = '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>';

  const host = document.createElement('div');
  host.setAttribute('data-ai-explorations-nav', '');
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>
    nav { position:fixed; ${v === 'top' ? 'top' : 'bottom'}:12px; ${h === 'right' ? 'right' : 'left'}:12px; z-index:2147483000;
      display:flex; gap:2px; padding:4px; border-radius:999px; background:rgba(18,16,14,.74); color:#fff;
      -webkit-backdrop-filter:blur(8px); backdrop-filter:blur(8px); box-shadow:0 6px 20px rgba(0,0,0,.3);
      font:500 12.5px/1.2 "PingFang SC","Hiragino Sans GB","Noto Sans SC",-apple-system,"Segoe UI",sans-serif; }
    a { display:flex; align-items:center; gap:7px; padding:6px 12px; border-radius:999px; color:inherit; text-decoration:none; white-space:nowrap; }
    a:hover { background:rgba(255,255,255,.14); }
    a.gh { padding:6px 9px; }
    a.gh svg { width:16px; height:16px; }
    a:focus-visible { outline:2px solid #ff6a4d; outline-offset:1px; }
    svg { width:14px; height:14px; flex:none; opacity:.9; }
    @media (max-width: 640px) { a { padding:8px; } span { display:none; } }
    @media print { nav { display:none; } }
  </style>
  <nav aria-label="${T.home}" lang="${lang === 'zh' ? 'zh-CN' : 'en'}">
    <a href="${home.href}" title="${T.homeTip}">${ICON_HOME}<span>${T.home}</span></a>
    <a class="gh" href="${REPO}" target="_blank" rel="noopener" title="${T.gh}" aria-label="GitHub">${ICON_GH}</a>
  </nav>`;
  (document.body || document.documentElement).append(host);
})();
