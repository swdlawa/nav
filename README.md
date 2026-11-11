# 拾页导航

一个中文网址导航站：纯 **HTML + CSS + 原生 JavaScript**，没有框架、没有构建步骤、没有后端。
搜索和筛选全部在浏览器里完成，关键词不会发给任何服务器。

> 线上地址：https://swdlawa.github.io/nav/

---

## 1. 页面

```
nav-site/
├── index.html              首页：搜索、精选 6 个、分类入口、最新收录
├── directory.html          全部网址：26 个站点 + 搜索 + 分类筛选 + 随机逛逛
├── about.html              关于：为什么做、收录标准、技术细节、更新日志
├── submit.html             推荐网址：表单校验后调起邮件客户端
├── 404.html                找不到页面
├── manifest.webmanifest    Web App Manifest
├── favicon.ico             16/32/48 多尺寸图标
├── css/styles.css          全部样式（含深色模式与响应式）
├── js/main.js              主题、菜单、搜索筛选、表单校验、滚动动画
├── assets/
│   ├── favicon.svg / favicon.png / apple-touch-icon.png
│   ├── icon-192.png / icon-512.png
│   └── og-image.png        1200×630 分享图
└── scripts/
    ├── generate-images.ps1 重新生成全部图标与分享图
    └── serve.mjs           零依赖本地服务器
```

---

## 2. 功能

- **站内搜索**：匹配站名、描述、标签和域名，边输边筛；按 `/` 聚焦，`Esc` 清空。
- **分类筛选**：全部 / 搜索引擎 / 影视视频 / AI 工具。
- **状态可分享**：筛选条件写进地址栏（`?cat=ai&q=pdf`），复制链接即可还原。
- **随机逛逛**：从当前筛选结果里随机开一个。
- **深色模式**：跟随系统，也可手动切换，选择保存在 `localStorage`。
- **推荐表单**：浏览器端校验（名称、完整网址、理由 ≥ 8 字），再拼成邮件。
- **响应式**：390px 手机宽度下导航折叠、卡片单列、搜索框换行。

无障碍：跳转链接、可见焦点、`aria-live` 结果计数、`aria-pressed` 筛选状态、`aria-expanded` 菜单、
`prefers-reduced-motion` 降级。

---

## 3. 本地预览

```bash
# 直接打开 index.html，或者
node scripts/serve.mjs 8080
# 访问 http://localhost:8080
```

---

## 4. 增加一个站点

1. 在 `directory.html` 的 `<ul data-directory>` 里复制一张卡片，改这五处：
   - `data-cat`：`ai` / `dev` / `study` / `design` / `tools`
   - `data-name`：搜索用的完整名称（中英文都写上）
   - `data-tags`：别名、同义词，用空格分隔
   - 链接、图标缩写与颜色（`style="--mark:#4c6ef5"`）
2. 更新页面上的统计数字（`26 个站点`、分类角标、`data-result-count` 的初始值）。
3. `index.html` 的“最新收录”加一行，并把日期写成当月。

图标缩写建议 1–3 个字符；颜色选饱和一点，深色模式下会自动降低亮度。

---

## 5. 图标与分享图

```powershell
powershell -ExecutionPolicy Bypass -File scripts/generate-images.ps1
```

会生成 `og-image.png`、`favicon.png`、`favicon.ico`、`apple-touch-icon.png`、`icon-192.png`、`icon-512.png`。
改脚本顶部的 `$SiteName`、`$Tagline` 等参数即可换品牌。注意：脚本含中文，需保存为 **UTF-8 with BOM**，否则 Windows PowerShell 5.1 会乱码。

---

## 6. 部署

```bash
git init
git add .
git commit -m "feat: 拾页导航第一版"
git branch -M main
git remote add origin https://github.com/<用户名>/nav.git
git push -u origin main
```

仓库 **Settings → Pages → Deploy from a branch → `main` / `(root)`**。
`og:image` 必须是绝对地址，所以每页 `<head>` 里已经写成 `https://swdlawa.github.io/nav/...`；换域名时全局替换。

`.nojekyll` 已包含，避免 Jekyll 忽略下划线开头的文件。

---

## 7. 内容说明

- 收录的 26 个站点均为各自官方网站，链接在新标签页打开并带 `rel="noopener"`。
- 站内图标是用首字母/缩写绘制的色块，不抓取第三方 favicon，因此不产生额外请求。
- 描述为本人撰写，没有复制各站点官方文案。
