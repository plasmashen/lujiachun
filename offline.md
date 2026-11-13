---
layout: default
title: 离线了
description: 当前处于离线状态，这个页面还没有缓存到本地
indexing: false
sitemap: false
permalink: /offline/
---

<style>
  .off-wrap{max-width:600px;margin:70px auto;padding:0 24px;text-align:center}
  .off-mark{font-family:var(--serif,serif);font-size:3rem;color:var(--zhu,#a8352a);
    opacity:.85;letter-spacing:.1em;margin-bottom:10px}
  .off-t{font-family:var(--serif,serif);font-size:1.4rem;margin:0 0 12px}
  .off-p{color:var(--ink-3,#797367);line-height:1.95;font-size:.92rem;margin:0 0 8px}
  .off-nav{margin:34px 0 20px;display:flex;flex-wrap:wrap;gap:10px;justify-content:center}
  .off-nav a{display:inline-block;padding:9px 20px;border:1px solid var(--rule,#ded7c8);
    border-radius:6px;color:var(--ink,#1c1a17);text-decoration:none;font-size:.9rem;
    background:var(--paper-2,#fdfcf8);transition:.18s}
  .off-nav a:hover{border-color:var(--zhu,#a8352a);color:var(--zhu,#a8352a)}
  .off-tip{margin-top:30px;padding:14px 18px;background:var(--rule-soft,#f0ece2);
    border-radius:6px;font-size:.82rem;color:var(--ink-3,#797367);line-height:1.85;text-align:left}
  .off-tip b{color:var(--ink-2,#544f47)}
</style>

<div class="off-wrap">
  <div class="off-mark">离线</div>
  <h1 class="off-t">这个页面还没存到本机</h1>
  <p class="off-p">你当前没有网络，而这一页不在离线缓存里。</p>
  <p class="off-p">下面这些页面已经完整缓存，断网也能正常排盘：</p>

  <div class="off-nav">
    <a href="/bazi/">八字排盘</a>
    <a href="/ziwei/">紫微斗数</a>
    <a href="/huangli/">黄历择日</a>
    <a href="/hepan/">八字合盘</a>
    <a href="/books/">古籍库</a>
  </div>

  <div class="off-tip">
    <b>关于离线</b><br>
    排盘所需的历法、节气、神煞数据都已存在本机，断网照常用。<br>
    只有「古籍库」的完整正文需要联网，索引可以离线查。<br>
    已保存的命盘案例不受影响。
  </div>
</div>
