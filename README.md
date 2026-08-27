# The Old House Playbook — static knowledge-product site

A zero-build static site implementing the「AI 知识出海」model:
**free content layer → landing page → PPT 预览滑页 → Gumroad checkout → password unlock → 付费滑页全文**.

Product: **The Century Home Renovation Kit · $9.90**（一次性付费，收款链接在 `config.js → gumroadUrl`，当前配置为 Ko-fi）。
视觉：**轻欧式×怀俄明**（heritage-ranch editorial）——象牙米白纸感 + 松绿/陶土/黄铜/皮革棕，
**Bodoni Moda**（编辑感衬线标题）+ **Geist / Geist Mono**（正文/标签，Google Fonts）。图片全部来自
用户指定的 Pinterest 搜索页（高清原图，清单见 `assets/img/IMAGES.md` 与 `pinterest-manifest.json`）。

## 设计与动效来源（本地化参考，KTD5/KTD6）

- **PPT 滑页交付**：`member/kit.html` 按 [frontend-slides](https://github.com/zarazhangrui/frontend-slides)（MIT）规范实现——
  固定 **1920×1080 舞台整体缩放**（`viewport-base.css` 全量内联）、`.active/.visible` 切页（不用 display:none）、
  单文件内联控制器与渲染器、Bodoni Moda/Geist 字体（无系统字体）、`.reveal` 级联动画、
  `prefers-reduced-motion` 支持、打印每页一张 1920×1080。参考仓库在 `work/vendor/frontend-slides/`。
- **首页叙事**：**创意图像走廊**（用户提供原型，`Desktop/style.css|index.html|script.js` 的本地化实现）
  ——透视走廊照片流 + 共享卡片在 4 屏叙事间编排（`assets/js/corridor.js` + `assets/css/corridor.css`），
  滚动滚轮在叙事结束后自然进入下方漏斗区；`prefers-reduced-motion` 渲染最终帧。

## 站点结构

| Path | Purpose |
|---|---|
| `/` (index.html) | Landing / product funnel（$9.90，含 3D 旋转画廊） |
| `/member/kit.html` | **PPT 滑页交付**：前 6 页预览公开可索引，后 13 页付费（标题骨架可见，正文解锁后渲染） |
| `/member/content/kit.json` | 付费滑页正文数据（解锁后由内联渲染器注入） |
| `/unlock.html` | 密码解锁页 |
| `/blog/*.html` | Free SEO content ×3 |
| `/tools/budget-calculator.html` | Free budget calculator（纯函数） |
| `/compare/contractor-vs-diy.html` | Free comparison |
| `/free/audit-checklist.html` | Free lead magnet |

## Local preview

```bash
# Python（本机无 Node 时首选）
cd outputs/dist && python -m http.server 8000
# 或 Node ≥18（存在时）
node preview-server.js
```

## Go-live checklist（上线门禁，全部完成后发布）

1. **确认收款链接** — `assets/js/config.js` → `gumroadUrl`（当前已配置为 **Ko-fi** 产品链接；如改回 Gumroad 直接替换即可，价格 $9.90 与站点一致）。
2. **先在 Gumroad 邮件模板里设定买家将收到的明文密码**。
3. **哈希同一个密码** → `config.js` → `unlockHash`（两处必须一致，否则买家无法解锁）。
   - PowerShell: `[System.BitConverter]::ToString([System.Security.Cryptography.SHA256]::Create().ComputeHash([System.Text.Encoding]::UTF8.GetBytes("YOUR_PASSWORD"))).Replace("-","").ToLower()`
   - bash/macOS: `echo -n "YOUR_PASSWORD" | shasum -a 256`
4. **图片授权确认** — `assets/img/IMAGES.md`：现有实拍图（含 ranch/ 组图）为开发期从公开网站（Pinterest 方向）采集、许可待确认；上线前逐张确认或替换为授权图源（Unsplash/Pexels/Wikimedia CC）。
5. **表单端点（可选）** — `config.js` → `formEndpoint`（Formspree 等）；留空显示「暂未开放」降级态。
6. **域名** — `sitemap.xml` 已使用 **https://thecenturyhome.com/**；若更换域名，同步替换其中全部 URL。robots.txt 已配置：`/member/content/` 与 `/unlock.html` 禁索引，**`/member/kit.html` 预览页允许收录**。
7. **部署** — Netlify / Vercel / Cloudflare Pages / GitHub Pages 零配置。注意 KTD2 弱安全边界：`kit.json` 与哈希在源码里，公共仓库可见；介意就保持私有仓库。

## 更换解锁密码

1. 新密码 → 重新生成哈希 → 更新 `config.js?unlockHash`。
2. 同步更新 Gumroad 邮件模板明文密码。
3. 老买家旧邮件失效——轮换前先通知。

## Security model（KTD2，by design）

- 付费内容 = 前端 SHA-256 校验 + `localStorage` 标记；`member/content/kit.json` 是公开静态资源，
  密码只是「防顺手查看」的门槛（验证需求优先、不怕盗版是刻意取舍）。
- 付费滑页正文**不在静态 HTML 中**：未解锁时仅显示标题骨架；正文在解锁后由页内渲染器从 JSON 注入。

## Editing content

- **Kit 滑页正文** — `member/content/kit.json`（13 个付费滑页：`bullets` / `table` / `notes`）；骨架标题在 `member/kit.html`，两者保持同步。
- **预览滑页** — `member/kit.html` 中前 6 个 `data-slide="preview-*"` 区块（1920×1080 固定尺寸排版）。
- **Blog** — `/blog/*.html` 直接编辑。
- **计算器** — `assets/js/calculator.js`（`SCOPE_RATES` / `RESERVE_RATES` / `ERA_MULT`）。
- **定价** — `config.js` → `saleNote` 与 `index.html` pricing 段。

## Verification

本机无 Node 时用 Python 版验证套件：

```bash
python work/verify/verify.py            # 静态断言 + HTTP 200 抓取（需先起本地服务）
python work/verify/verify.py --no-serve # 仅静态断言
```

覆盖：公开页标记、滑页结构（6 预览 + 13 锁定骨架、.active/.visible 契约、正文隔离）、解锁哈希、
robots/sitemap、链接完整性、图片/alt/IMAGES.md、README，以及 HTTP 200 全站抓取。