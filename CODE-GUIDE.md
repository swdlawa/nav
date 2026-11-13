# 代码导读（VS Code 版）

这份文件告诉你 **每个文件里哪些注释值得先看**。代码本身已经加了中文注释，按下面的顺序读，20 分钟能过一遍。

> 打开方式：在 VS Code 里打开 `nav-site` 文件夹，按 `Ctrl+P` 输入文件名跳转。
> 建议一边读一边用 Live Server 打开页面，对照“代码 → 效果”。

---

## 0. 先记住一句话

**HTML 是内容，CSS 是外观，JS 是行为。** 三者通过 `class`、`id`、`data-*` 属性连接，没有框架、没有构建、没有后端。

```
index.html      首页：搜索 + 三组入口
directory.html  全部网址：26 个按钮 + 搜索 + 分组
submit.html     推荐表单（校验后 mailto）
404.html        找不到页面
css/styles.css  所有样式（变量、布局、深色模式、响应式）
js/main.js      所有交互（主题、菜单、搜索、表单、动画）
assets/         图标与分享图
```

---

## 1. 读 HTML：先看“骨架”，再看“一张卡片”

### index.html

| 行 | 看什么 |
| --- | --- |
| [5](index.html#L5) | `<head>` 里的元信息：SEO、分享图、图标、缓存版本号 |
| [58](index.html#L58) | 页头：品牌、导航、主题按钮、移动菜单 |
| [95](index.html#L95) | 首屏：搜索表单 + 统计（标题已按要求删除） |
| [115](index.html#L115) | 三组入口，每组 5 个按钮 |
| [170](index.html#L170) | 页脚：链接 + 版权 |

### directory.html

| 行 | 看什么 |
| --- | --- |
| [108](directory.html#L108) | `data-directory`：JS 的搜索范围 |
| [112](directory.html#L112) | `data-group`：分组容器，空组会被隐藏 |
| [121](directory.html#L121) | **一张卡片的完整注释**：`data-name`/`data-tags` 是搜索索引，`href` 是真实官网 |

一张卡片的结构可以背下来：

```html
<li>
  <a class="link-card" data-site
     data-name="百度 Baidu" data-tags="搜索 百科 贴吧 中文"
     href="https://www.baidu.com/" target="_blank" rel="noopener">
    <span class="link-text"><span class="link-name">百度</span></span>
  </a>
</li>
```

- `data-*`：给 JS 用的数据，用户看不见；
- `target="_blank"` + `rel="noopener"`：新标签打开 + 安全；
- 只放站名：减少视觉噪音，扫一眼就能点。

### submit.html

| 行 | 看什么 |
| --- | --- |
| [91](submit.html#L91) | 表单不提交到服务器，校验后拼 `mailto:` |
| [102](submit.html#L102) | 网址必须以 `http(s)://` 开头 |

---

## 2. 读 CSS：只看“变量 → 布局 → 按钮 → 响应式”

CSS 有 1700 多行，但真正要理解的是四块：

| 行 | 看什么 |
| --- | --- |
| [10](css/styles.css#L10) | **设计变量**：`--bg`/`--ink`/`--accent`，改这里全站换色 |
| [45](css/styles.css#L45) | **深色模式**：只换变量值，不重写样式 |
| [1609](css/styles.css#L1609) | **按钮网格**：固定 240px，一行 5 个 |
| [1759](css/styles.css#L1759) | **最终按钮**：纯黑背景 + 2px 黑边 + 无阴影 |

> 重要：文件里能看到 `6b` 到 `6i` 多段重复的 `.link-card`，那是根据反馈反复迭代留下的历史层。
> **最终生效的是文件末尾的规则**（后写的覆盖先写的）。回答“为什么代码里有重复”时，就说是迭代痕迹，重做会合并。

响应式看三处：

- `@media (max-width: 780px)`：导航折叠成汉堡菜单；
- `@media (max-width: 560px)`：按钮从 5 列变单列；
- `@media (prefers-reduced-motion: reduce)`：关闭动画。

---

## 3. 读 JS：五个独立模块

`js/main.js` 是一个立即执行函数，按注释分块：

| 行 | 模块 | 一句话 |
| --- | --- | --- |
| [15](js/main.js#L15) | 主题 | 改 `data-theme` + 存 `localStorage` |
| 57 | 移动菜单 | 切换 `.is-open`，同步 `aria-expanded` |
| 93 | 滚动状态 | 页头阴影、回到顶部 |
| [131](js/main.js#L131) | 搜索匹配 | 站名 + 标签 + 文本，转小写后包含匹配 |
| [145](js/main.js#L145) | 执行过滤 | 隐藏卡片、隐藏空组、更新计数、写 `?q=` |
| [187](js/main.js#L187) | 读取 URL | 从分享链接还原搜索 |
| 216 | 表单校验 | 阻止默认提交、逐项报错、拼邮件 |
| 308 | 滚动出现 | IntersectionObserver 淡入 |

### 最值得讲的一段：`apply()`

```js
function apply(pushUrl) {
  var shown = 0;

  cards.forEach(function (card) {        // 1. 每张卡片：命中就显示，否则 hidden
    var ok = matches(card);
    card.hidden = !ok;
    card.parentNode.hidden = !ok;
    if (ok) shown += 1;
  });

  groups.forEach(function (group) {      // 2. 整组没有可见卡片就隐藏
    var visible = group.querySelectorAll("[data-site]:not([hidden])").length;
    group.hidden = visible === 0;
```

它代表：**搜索完全在浏览器里完成，没有一次网络请求**；同时更新计数、空状态、地址栏。

---

## 4. 三条“答辩主线”

1. **内容与表现分离**  
   HTML 写死 26 个真实链接；`data-*` 提供搜索索引；CSS 只认 class；JS 只读 DOM。

2. **渐进增强**  
   JS 关掉，链接仍然可点；搜索表单本身是 `<form action="directory.html">`，没有 JS 也能带 `?q=` 跳转。

3. **可访问性不是装饰**  
   `skip-link`、`aria-current`、`aria-expanded`、`aria-live`、`aria-invalid`、键盘 `/` 与 `Esc`、`prefers-reduced-motion`。

---

## 5. 可能被追问的代码细节

**Q：为什么按钮是 `<a>` 不是 `<button>`？**  
A：动作是“跳转”，不是“提交”。`<a>` 支持右键新标签、复制链接、键盘回车，语义正确。

**Q：为什么用 `var` 不用 `const`？**  
A：写法偏保守，保证老浏览器也能跑；现代浏览器完全可以换成 `const/let`。

**Q：为什么没有用框架？**  
A：交互只有搜索、主题、表单校验三类，框架的构建与依赖成本大于收益，手写也方便现场解释每一行。

**Q：`?v=15` 是什么？**  
A：缓存版本号，不是构建工具。改完 CSS 把数字加一，浏览器就会取新文件。

**Q：CSS 里为什么有重复的 `.link-card`？**  
A：迭代遗留（6b–6i），后写覆盖先写。最终样式是 6h/6i 的纯黑 + 黑边 + 无阴影；重做会合并成一段。

---

## 6. 对照练习（10 分钟）

1. 打开 `directory.html`，在搜索框输入「爱奇艺」，看计数从 26 变 1；
2. 在 VS Code 里找到 `data-name`，把「爱奇艺 iQIYI」改成「爱奇艺 iqiyi」，刷新，搜索仍然命中；
3. 打开 `styles.css` 第 1759 行，把 `border: 2px solid #000` 改成 `#ff0000`，看边框变化，再改回来；
4. 打开 `main.js` 第 145 行，把 `history.replaceState` 那行注释掉，观察地址栏不再变化。

> 这些改动只用于理解，演示前记得还原（或用 `git checkout -- .`）。
