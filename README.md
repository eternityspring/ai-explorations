# AI Explorations

**English** · [中文](README.zh-CN.md)

Hands-on tests of AI models, with interactive demos you can play with right in the browser. Every demo is a static web page.

**Browse: <https://eternityspring.github.io/ai-explorations/>** (English: [`?lang=en`](https://eternityspring.github.io/ai-explorations/?lang=en) · Chinese: [`?lang=zh`](https://eternityspring.github.io/ai-explorations/?lang=zh); without the parameter the gallery follows your browser language)

## Demos

<!-- evals:start -->
| Demo | Models |
|---|---|
| [The Feed — a comic page you can spin](https://eternityspring.github.io/ai-explorations/the-feed-comic/) | Qwen Image 2.1, MiniMax-H3 Ref2VA, ORB360 LoRA (step 1500), three.js |
| [Lost Cat — a comic page you can spin](https://eternityspring.github.io/ai-explorations/lost-cat-comic/) | Qwen Image 2.1, MiniMax-H3 Ref2VA, ORB360 LoRA (step 1500), three.js |
<!-- evals:end -->

## Layout

```
index.html              Gallery page (generated, don't edit by hand)
assets/nav.js           Corner nav injected into every demo: back to the gallery + a GitHub icon
<short-name>/           One folder per demo, e.g. lost-cat-comic
  index.html            The demo page
  meta.json             Card info: title, date, tags, models, summary, notes
  cover.jpg  demo.mp4   Cover image and demo video (optional)
tools/publish.mjs       Publish a demo
tools/build_index.mjs   Rebuild the gallery and the demo lists in both READMEs
```

## Publishing a demo

1. In the demo's own folder, prepare a manifest (JSON) listing the files to publish and the gallery card info. The format is documented at the top of `tools/publish.mjs`.
2. Run:

   ```bash
   node tools/publish.mjs /path/to/manifest.json          # copy files, write meta.json, rebuild the gallery
   node tools/publish.mjs /path/to/manifest.json --push   # same, then commit and push
   ```

3. GitHub Pages updates a minute or two after the push.

Notes

- Only include files the page actually uses: no `.env`, raw videos or intermediate files.
- GitHub rejects files over 100 MB, and a Pages site should stay under 1 GB. Pages doesn't serve Git LFS files, so commit large files directly.
- Pages must work from any subfolder with relative paths (no absolute `/...` paths).
- Every HTML page in a demo gets `assets/nav.js` injected: a link back to the gallery and a GitHub icon (linking to this repository) in the top-right corner. Set `meta.nav` to `top-left`, `bottom-right` or `bottom-left` to move it, or `false` to leave it out.
- Commit messages are written in English.
