---
title: 关于我
feature_text: |
  # 鹿佳莼 
  一个小李和小沈和 jo 宝的故事
feature_image: "https://picsum.photos/1300/400?image=989"
---


爱小李，爱 jo 宝，爱生活。

<style>
section.bz-hub {
  --paper: #f7f4ed;
  --paper-2: #fdfcf8;
  --ink: #1c1a17;
  --ink-2: #544f47;
  --ink-3: #797367;
  --ink-4: #a39c8f;
  --rule: #ded7c8;
  --rule-soft: #f0ece2;
  --zhu: #a8352a;
  --qing: #3f5d52;
  --jin: #9a7b3f;

  margin: 2.6rem 0 3rem;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB",
    "Microsoft YaHei", "Source Han Sans SC", "Noto Sans CJK SC", sans-serif;
  color: var(--ink);
}

/* ── 标题区 ── */
.bz-hub-head {
  display: flex;
  align-items: baseline;
  gap: .8rem;
  margin-bottom: .3rem;
  flex-wrap: wrap;
}
.bz-hub-head h2 {
  font-family: "Songti SC", "STSong", "SimSun", "Source Han Serif SC", serif;
  font-size: 1.32rem;
  margin: 0;
  letter-spacing: .04em;
  color: var(--ink);
}
.bz-hub-head .tag {
  font-size: .68rem;
  color: var(--zhu);
  border: 1px solid currentColor;
  border-radius: 3px;
  padding: 1px 6px;
  letter-spacing: .06em;
  opacity: .85;
}
.bz-hub-sub {
  color: var(--ink-3);
  font-size: .82rem;
  line-height: 1.8;
  margin: 0 0 1.5rem;
}

/* ── 卡片网格 ── */
.bz-hub-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(232px, 1fr));
  gap: 12px;
  row-gap: 13px;
}

.bz-card {
  display: flex;
  flex-direction: column;
  position: relative;
  padding: 18px 18px 16px;
  background: var(--paper-2);
  border: 1px solid var(--rule);
  border-radius: 7px;
  text-decoration: none;
  color: inherit;
  transition: border-color .18s, box-shadow .18s, transform .18s;
}
.bz-card:hover {
  border-color: var(--zhu);
  box-shadow: 0 4px 18px rgba(28, 26, 23, .07);
  transform: translateY(-2px);
}

.bz-card .glyph {
  font-family: "Songti SC", "STSong", "SimSun", serif;
  font-size: 1.6rem;
  line-height: 1;
  color: var(--zhu);
  margin-bottom: 10px;
  display: block;
}
.bz-card .name {
  font-family: "Songti SC", "STSong", "SimSun", serif;
  font-size: 1.02rem;
  font-weight: 600;
  letter-spacing: .04em;
  margin-bottom: 5px;
  display: block;
}
.bz-card .desc {
  font-size: .78rem;
  color: var(--ink-3);
  line-height: 1.72;
  display: block;
  flex: 1 1 auto;
}
.bz-card .meta {
  margin-top: auto;
  padding-top: 11px;
  font-size: .705rem;
  color: var(--ink-3);
  letter-spacing: .04em;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.bz-card .meta b {
  font-weight: 500;
  color: var(--qing);
}

.bz-card.accent {
  background: linear-gradient(160deg, #fdfcf8 0%, #faf3ee 100%);
  border-color: #e2cfc5;
}

/* ── 特性条 ── */
.bz-hub-feats {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin: 1.35rem 0 0;
}
.bz-feat {
  font-size: .745rem;
  color: var(--ink-2);
  background: var(--rule-soft);
  border-radius: 20px;
  padding: 4px 11px;
  letter-spacing: .03em;
}
.bz-feat b {
  color: var(--ink-2);
  font-weight: 600;
}

/* ── 窄屏 ── */
@media screen and (max-width: 620px) {
  .bz-hub-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .bz-card { padding: 15px 15px 13px; }
  .bz-card .glyph { font-size: 1.35rem; margin-bottom: 7px; }
  .bz-hub-head h2 { font-size: 1.16rem; }
  section.bz-hub { margin: 2rem 0 2.2rem; }
}

@media screen and (min-width: 621px) and (max-width: 900px) {
  .bz-hub-grid { grid-template-columns: repeat(2, 1fr); }
}

</style>


---

<section class="bz-hub">
  <div class="bz-hub-head">
    <h2>命理工具</h2>
    <span class="tag">离线可用</span>
  </div>
  <p class="bz-hub-sub">
    四套排盘工具共用同一套历法内核 —— 同一时刻算出来的四柱不会互相打架。
    断网也能排盘，可装到手机桌面；另外两部古籍与方法资料供查阅。
  </p>

  <div class="bz-hub-grid">

    <a class="bz-card accent" href="/bazi/">
      <span class="glyph">甲</span>
      <span class="name">八字排盘</span>
      <span class="desc">四柱十神 · 神煞 59 类 · 大运流年 · 流日流时 · 五行能量</span>
      <span class="meta"><span>问真 100% 神煞对齐</span></span>
    </a>

    <a class="bz-card" href="/ziwei/">
      <span class="glyph">紫</span>
      <span class="name">紫微斗数</span>
      <span class="desc">十二宫 · 十四主星 · 六吉六煞 · 生年四化 · 大限</span>
      <span class="meta"><span>iztro 2808 组<b>九项 100%</b></span></span>
    </a>

    <a class="bz-card" href="/huangli/">
      <span class="glyph">历</span>
      <span class="name">黄历择日</span>
      <span class="desc">宜忌 · 建除十二神 · 黄道黑道 · 二十八宿 · 胎神 · 时辰吉凶</span>
      <span class="meta"><span>支持按事由筛吉日</span></span>
    </a>

    <a class="bz-card" href="/hepan/">
      <span class="glyph">合</span>
      <span class="name">八字合盘</span>
      <span class="desc">双人四柱对照 · 五行能量雷达 · 夫妻宫与日主互动</span>
      <span class="meta"><span>六种关系视角</span></span>
    </a>

    <a class="bz-card" href="/books/">
      <span class="glyph">典</span>
      <span class="name">古籍库</span>
      <span class="desc">命理与中医典籍全文 · 可按书名、章节、正文检索</span>
      <span class="meta"><span>2792 章 · 566 万字</span></span>
    </a>

    <a class="bz-card" href="/bazi/methods/">
      <span class="glyph">考</span>
      <span class="name">方法盘点</span>
      <span class="desc">东方西方各家术数的体系对比、热度数据与选型建议</span>
      <span class="meta"><span>附 21 页研究 PDF</span></span>
    </a>

  </div>

  <div class="bz-hub-feats">
    <span class="bz-feat"><b>离线</b> 装到桌面断了网也能用</span>
    <span class="bz-feat"><b>本地</b> 命盘只存本机，不上传</span>
    <span class="bz-feat"><b>分享</b> 一键出图，带二维码回链</span>
    <span class="bz-feat"><b>无广告</b> 不登录、不追踪</span>
  </div>
</section>

---

![][image-1]
![][image-2]

[image-1]:	assets/img/portfolio.jpeg
[image-2]:	assets/img/index.jpg

---

## 🎮 我的游戏作品

### 🀄 49.9 麻将欧欧乐
**动态规划最优策略 · 50 元看 3 张 · 后续 +10 元/张**

- 🤖 实时 AI 策略建议
- 📊 动态期望值计算
- 🎯 自定义奖金设置
- 💡 透明的决策解释

[🎮 开始游戏](game/mahjong-ouou.html){: .btn .btn-primary}

**游戏特色：**
- 使用动态规划 (DP) 算法计算最优决策
- 实时显示继续翻牌 vs 领取奖金的期望收益对比
- 支持自定义各牌型奖金金额
- AI 自动播放功能

[📖 查看游戏说明](game/README_DP.md)
