# AI Explorations · AI 探索笔记

一些 AI 模型的实测，和可以直接上手玩的 demo。每个 demo 都是静态网页，在浏览器里点开就能玩。
Hands-on tests of AI models, with interactive demos you can play with right in the browser.

**在线浏览 Browse：<https://eternityspring.github.io/ai-explorations/>**

## Demo 列表 · Demos

<!-- evals:start -->
| 日期 Date | Demo | 模型 Models |
|---|---|---|
| 2026-10-11 | [寻猫：一页可以转的漫画](https://eternityspring.github.io/ai-explorations/lost-cat-comic/)<br>Lost Cat — a comic page you can spin | Qwen Image 2.1, MiniMax-H3 Ref2VA, ORB360 LoRA (step 1500), three.js |
<!-- evals:end -->

## 结构 · Layout

```
index.html              首页（自动生成，别手改）· generated gallery
<英文短名>/              每个评测一个文件夹，如 lost-cat-comic · one folder per demo
  index.html            demo 页面
  meta.json             首页卡片信息：标题、日期、标签、模型、简介、要点
  cover.jpg  demo.mp4   封面和演示视频（可选）
assets/nav.js           每个 demo 右上角的小导航（回首页 / 看源码），发布时自动注入
tools/publish.mjs       发布一个评测
tools/build_index.mjs   重建首页和本文件里的列表
```

## 发布新的评测 · Publishing a demo

1. 在评测自己的目录里准备一份清单（JSON），写明要发布哪些文件、首页卡片信息，格式见 `tools/publish.mjs` 开头的注释。
2. 运行：

   ```bash
   node tools/publish.mjs /path/to/清单.json          # 复制文件、写 meta.json、重建首页
   node tools/publish.mjs /path/to/清单.json --push   # 同上，再提交并推送
   ```

3. 推送后一两分钟，GitHub Pages 自动更新。

注意 · Notes

- 只放页面真正用到的文件，不要带 `.env`、原始大视频、中间文件。
- GitHub 单个文件上限 100MB，Pages 整站建议不超过 1GB；Pages 不支持 Git LFS，大文件要直接提交。
- 页面要能用相对路径在任意子目录下打开（不要写死 `/` 开头的路径）。
- 发布时会给 demo 的每个 HTML 注入 `assets/nav.js`，右上角出现「AI 探索笔记 / 源码」两个链接；位置用 `meta.nav` 指定（`top-right` 默认、`top-left`、`bottom-right`、`bottom-left`），`false` 不加。
