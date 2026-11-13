---
permalink: "/sw.js"
layout: null
sitemap: false
---
/**
 * Service Worker —— 让命理页面离线可用
 *
 * 设计原则（易踩的坑都在这里）：
 *
 *  1. HTML 用「网络优先」。因为 GitHub Pages 每次构建都改文件名不变，
 *     缓存优先会让用户永远看到旧版。离线时才回退缓存。
 *
 *  2. 静态资源（JS/CSS/字体/图标）用「缓存优先」，但版本号变化时整体换新。
 *     这些文件名不带 hash，所以只能靠 cacheName 版本控制。
 *
 *  3. 命理页面的 JS 必须一起缓存 —— 只缓存 HTML 的话，离线能打开页面
 *     但一点排盘就报错，等于没做。
 *
 *  4. 大文件（古籍索引 569KB）单独一个 cache，预缓存失败不影响核心功能。
 *
 *  5. 永远不缓存跨域请求（模型接口、统计等），避免污染。
 */

const VERSION = '{{ site.time | date: "%Y%m%d%H%M%S" }}';
const CORE_CACHE = `bz-core-${VERSION}`;
const ASSET_CACHE = `bz-asset-${VERSION}`;
const HEAVY_CACHE = `bz-heavy-${VERSION}`;

const OFFLINE_PAGE = '/offline/';

// ── 页面骨架：四个命理页 + 首页 + 离线页 ──
const CORE_PAGES = [
  {%- for p in site.pages -%}
    {%- if p.url == '/bazi/' or p.url == '/ziwei/' or p.url == '/huangli/'
        or p.url == '/hepan/' or p.url == '/books/' or p.url == '/offline/' or p.url == '/' -%}
      "{{ p.url | relative_url }}",
    {%- endif -%}
  {%- endfor -%}
  "{{ '/assets/styles.css' | relative_url }}",
  "{{ '/manifest.json' | relative_url }}"
];

// ── 命理核心 JS：缺一个排盘就废，必须预缓存 ──
const CORE_SCRIPTS = [
  {%- for f in site.pwa_core -%}
    "{{ f | relative_url }}",
  {%- endfor -%}
];

// ── 大文件：异步缓存，失败不影响使用 ──
const HEAVY_ASSETS = [
  {%- for f in site.pwa_heavy -%}
    "{{ f | relative_url }}",
  {%- endfor -%}
];

// ── 安装：预缓存核心，大文件尽力而为 ──
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const core = await caches.open(CORE_CACHE);
    const asset = await caches.open(ASSET_CACHE);

    // 核心页面：逐个加，单个失败不拖垮整体
    await Promise.all(CORE_PAGES.map(async url => {
      try { await core.add(new Request(url, { cache: 'reload' })); }
      catch (e) { /* 某页抓不到就跳过，不影响其它 */ }
    }));

    // 核心脚本：同样逐个加
    await Promise.all(CORE_SCRIPTS.map(async url => {
      try { await asset.add(new Request(url, { cache: 'reload' })); }
      catch (e) { /* 忽略 */ }
    }));

    // 大文件：不阻塞 install，后台慢慢来
    const heavy = await caches.open(HEAVY_CACHE);
    await Promise.all(HEAVY_ASSETS.map(async url => {
      try { await heavy.add(new Request(url, { cache: 'reload' })); }
      catch (e) { /* 忽略 */ }
    }));

    self.skipWaiting();
  })());
});

// ── 激活：清掉旧版本缓存 ──
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(k => k.startsWith('bz-') &&
          k !== CORE_CACHE && k !== ASSET_CACHE && k !== HEAVY_CACHE)
        .map(k => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

/** 判断是否本站资源 */
function sameOrigin(url) {
  return url.origin === self.location.origin;
}

/** 静态资源判定 */
function isStatic(pathname) {
  return /\.(js|css|woff2?|ttf|otf|eot|png|jpe?g|gif|svg|webp|ico|json)$/i.test(pathname);
}

self.addEventListener('fetch', event => {
  const req = event.request;

  // 只处理 GET
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (e) { return; }

  // 跨域一律直接走网络，不介入
  if (!sameOrigin(url)) return;

  // 不缓存 sw 自身与 Jekyll 构建产物
  if (url.pathname === '/sw.js') return;

  // ── 静态资源：缓存优先 ──
  if (isStatic(url.pathname)) {
    event.respondWith((async () => {
      const cached = await caches.match(req);
      if (cached) {
        // 命中后静默更新（stale-while-revalidate）
        fetch(req).then(res => {
          if (res && res.ok) {
            caches.open(ASSET_CACHE).then(c => c.put(req, res.clone())).catch(() => {});
          }
        }).catch(() => {});
        return cached;
      }
      try {
        const res = await fetch(req);
        if (res && res.ok) {
          const c = await caches.open(ASSET_CACHE);
          c.put(req, res.clone()).catch(() => {});
        }
        return res;
      } catch (e) {
        // 图片兜底
        if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(url.pathname)) {
          const fb = await caches.match('/assets/default-offline-image.png');
          if (fb) return fb;
        }
        return new Response('', { status: 504, statusText: 'Offline' });
      }
    })());
    return;
  }

  // ── HTML 导航：网络优先，离线回退缓存 ──
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        // 注意：404/500 不会抛异常，必须显式判断。
        // 离线时服务器可能返回 404，此时应回退到缓存/离线页，而不是把 404 给用户。
        if (res && res.ok) {
          const c = await caches.open(CORE_CACHE);
          c.put(req, res.clone()).catch(() => {});
          return res;
        }
        throw new Error('non-ok: ' + (res && res.status));
      } catch (e) {
        // 精确命中
        const cached = await caches.match(req);
        if (cached) return cached;

        // 目录形式：/bazi/ 可能以 /bazi/index.html 存
        const alt = await caches.match(url.pathname.replace(/\/$/, '/index.html'));
        if (alt) return alt;

        // 兜底离线页（三种形式都试，兼容不同存储形式）
        const off = (await caches.match(OFFLINE_PAGE))
          || (await caches.match('/offline/index.html'));
        if (off) return off;

        return new Response(
          '<!DOCTYPE html><html lang="zh-CN"><meta charset="utf-8">' +
          '<title>离线</title><body style="font:16px/1.8 system-ui;padding:40px;max-width:560px;margin:auto">' +
          '<h2>当前处于离线状态</h2><p>这个页面还没有缓存到本地。</p>' +
          '<p><a href="/bazi/">八字排盘</a> · <a href="/ziwei/">紫微</a> · ' +
          '<a href="/huangli/">黄历</a> · <a href="/hepan/">合盘</a></p></body></html>',
          { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      }
    })());
  }
});

// ── 支持页面主动触发更新 ──
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
  if (event.data === 'CLEAR_CACHE') {
    event.waitUntil(caches.keys().then(keys =>
      Promise.all(keys.filter(k => k.startsWith('bz-')).map(k => caches.delete(k)))
    ));
  }
});
