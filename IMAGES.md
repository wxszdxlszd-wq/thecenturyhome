# IMAGES.md — 图片资产与图源登记（The Old House Playbook）

## 图源（2026-08-25 采集）

全部图片来自 Pinterest 搜索页：
`https://www.pinterest.com/search/pins/?q=centuryhome%20renovation%20compare&rs=typed`
（用户指定图源）。以 `i.pinimg.com/originals/` 原图地址下载，映射清单见
`assets/img/pinterest-manifest.json`（file ↔ source URL 一一对应）。

| 文件 | 来源（originals 原图） | 用途 |
|---|---|---|
| `img-02.jpg` | `.../86/4d/24/864d2498b4a97cd5a83417f8f01abb46.jpg` | 走廊照片流 / 共享卡 |
| `img-03.jpg` | `.../c7/76/58/c776580f0589c569817566f4b63031d9.jpg` | 走廊照片流 |
| `img-04.jpg` | `.../b1/66/43/b16643395ffbedd5f59d86706cde18af.jpg` | 走廊照片流 / 共享卡 |
| `img-06.jpg` | `.../09/78/96/097896f8ce75b02233e6852bfa5cdbe2.jpg` | 走廊照片流 / 共享卡 |
| `img-08.jpg` | `.../e5/30/e8/e530e80529302ba7cdb756fc1caad44b.jpg` | 免费清单区块配图（首页） |
| `img-09.jpg` | `.../90/fa/eb/90faeb83aaf5a25d22733075b6809888.jpg` | 走廊照片流 / 共享卡 |
| `img-10.jpg` | `.../83/33/9f/83339fd0bec330ea94e2cb29a553e8ad.jpg` | 走廊照片流 |
| `img-11.jpg` | `.../cb/5b/78/cb5b783c3e12d5c10bbef2a907526316.jpg` | 走廊照片流 / 共享卡 |
| `img-13.jpg` | `.../f1/46/03/f1460362953dfb6b0451266e227bb425.jpg` | 走廊照片流 |

另有 4 个 Pin 的原图被平台保护（403），未采用：`36d9838d`、`7ceb3033`、`9287b62b`、`1e164eda`。

## ⚠️ 版权红线（必读）

Pinterest 图片为站内用户发布、原始许可不明。**本站目前仅用于开发/演示**；
正式上线前必须：逐张确认给图人授权，或替换为授权图源（Unsplash / Pexels /
Wikimedia Commons CC0 / 用户自有拍摄）。本清单保留来源 URL 以便署名与追溯。
不扒带水印/付费图。

## 页面引用规范（U8 断言）

- 所有 `<img>`：`src` 指向本地 `assets/img/`、`alt` 非空且描述性、首屏外 `loading="lazy"`。
- 走廊卡（`.color-card`）与共享卡（`.shared-card`）由 `assets/js/corridor.js` 以 CSS
  `background-image` 引用（装饰性、`aria-hidden`，无需 alt）。
- 新增图片按 `img-<n>.jpg` 命名并同步更新本表与 `pinterest-manifest.json`。

## 上线前 To-Do

1. 逐张确认上表图片授权，或替换为授权图源并更新本表与 manifest。
2. 若换图：更新 `corridor.js` 中的 `corridorImages` / `sharedCardImages` 数组与
   `index.html` 的 `<img>` 引用即可，无需改动样式。