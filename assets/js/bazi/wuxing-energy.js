/**
 * 五行能量专业版 + 同党异党
 *
 * 按问真「同党异党能量」权益说明（explain_vip_5）的五个因素计算：
 *   ① 五行个数    —— 天干地支的基础计数
 *   ② 干支比重    —— 天干与地支的权重比（地支藏干比天干重）
 *   ③ 藏干深浅    —— 本气 / 中气 / 余气 的深浅差异
 *   ④ 宫位力量    —— 月令最重，日支次之，年时较轻
 *   ⑤ 刑冲破害合  —— 地支互动对五行力量的修正
 *
 * 同党 = 印星（生我）+ 比劫（同我）
 * 异党 = 官杀（克我）+ 食伤（我生）+ 财星（我克）
 *
 * 说明：问真未公开具体权重，这里的系数依据《子平真诠》「月令为重」与
 * 通行旺衰法标定，输出的是同党/异党占比，与问真的整数百分比同构。
 */
(function (global) {
  'use strict';

  var WX_ORDER = ['木', '火', '土', '金', '水'];

  // 天干五行
  var GAN_WX = { 甲:'木', 乙:'木', 丙:'火', 丁:'火', 戊:'土', 己:'土',
                 庚:'金', 辛:'金', 壬:'水', 癸:'水' };
  // 地支本气（用于地支五行归属）
  var ZHI_WX = { 子:'水', 丑:'土', 寅:'木', 卯:'木', 辰:'土', 巳:'火',
                 午:'火', 未:'土', 申:'金', 酉:'金', 戌:'土', 亥:'水' };
  // 地支藏干（本气, 中气, 余气）
  var CANG = {
    子: ['癸'], 丑: ['己','癸','辛'], 寅: ['甲','丙','戊'], 卯: ['乙'],
    辰: ['戊','乙','癸'], 巳: ['丙','庚','戊'], 午: ['丁','己'],
    未: ['己','丁','乙'], 申: ['庚','壬','戊'], 酉: ['辛'],
    戌: ['戊','辛','丁'], 亥: ['壬','甲']
  };

  var SHENG = { 木:'火', 火:'土', 土:'金', 金:'水', 水:'木' };
  var BEI_SHENG = { 火:'木', 土:'火', 金:'土', 水:'金', 木:'水' };
  var KE = { 木:'土', 土:'水', 水:'火', 火:'金', 金:'木' };
  var BEI_KE = { 土:'木', 水:'土', 火:'水', 金:'火', 木:'金' };

  // 地支六冲
  var CHONG = { 子:'午', 丑:'未', 寅:'申', 卯:'酉', 辰:'戌', 巳:'亥',
                午:'子', 未:'丑', 申:'寅', 酉:'卯', 戌:'辰', 亥:'巳' };
  // 地支六合
  var LIUHE = { 子:'丑', 丑:'子', 寅:'亥', 亥:'寅', 卯:'戌', 戌:'卯',
                辰:'酉', 酉:'辰', 巳:'申', 申:'巳', 午:'未', 未:'午' };
  // 地支相害
  var HAI = { 子:'未', 未:'子', 丑:'午', 午:'丑', 寅:'巳', 巳:'寅',
              卯:'辰', 辰:'卯', 申:'亥', 亥:'申', 酉:'戌', 戌:'酉' };
  // 三合局
  var SANHE = [
    { zhi: ['申','子','辰'], wx: '水' },
    { zhi: ['亥','卯','未'], wx: '木' },
    { zhi: ['寅','午','戌'], wx: '火' },
    { zhi: ['巳','酉','丑'], wx: '金' }
  ];
  // 三会方局（力量比三合更强）
  var SANHUI = [
    { zhi: ['寅','卯','辰'], wx: '木' },
    { zhi: ['巳','午','未'], wx: '火' },
    { zhi: ['申','酉','戌'], wx: '金' },
    { zhi: ['亥','子','丑'], wx: '水' }
  ];

  // ── 权重系数 ──
  var W_GAN = 1.0;                 // 天干基准
  var W_CANG = [1.2, 0.6, 0.3];    // 藏干：本气 / 中气 / 余气（地支重于天干）
  var W_GONG = [0.8, 1.6, 1.2, 0.9];  // 年 / 月 / 日 / 时 宫位（月令最重）
  var PILLARS = ['year', 'month', 'day', 'hour'];

  /**
   * 计算五行能量明细
   * @param c paipan 结果
   * @returns {{raw:Object, detail:Object, relations:Array}}
   */
  function computeEnergy(c) {
    var p = c.pillars || c.pillarList;
    // 兼容 {year, month, day, hour} 与 [[干,支],...]
    var gz = {};
    if (p && p.year) {
      PILLARS.forEach(function (k) { gz[k] = p[k]; });
    } else if (Array.isArray(c.pillarList)) {
      PILLARS.forEach(function (k, i) { gz[k] = c.pillarList[i]; });
    }

    var raw = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
    var detail = { gan: 0, cang: 0, gong: 0, relation: 0 };

    // ① ② ③ ④ 天干 + 藏干，按宫位加权
    PILLARS.forEach(function (k, i) {
      var g = (gz[k] || '')[0];
      var z = (gz[k] || '')[1];
      if (!g || !z) return;
      var gw = W_GONG[i];

      // 天干
      var gg = GAN_WX[g];
      if (gg) {
        raw[gg] += W_GAN * gw;
        detail.gan += W_GAN * gw;
      }
      // 藏干（本气/中气/余气深度递减）
      var cg = CANG[z] || [];
      cg.forEach(function (c2, j) {
        var wx = GAN_WX[c2];
        if (!wx) return;
        var v = W_CANG[Math.min(j, 2)] * gw;
        raw[wx] += v;
        detail.cang += v;
      });
    });

    // ⑤ 刑冲破害合修正
    var relations = [];
    var zhis = PILLARS.map(function (k) { return (gz[k] || '')[1]; }).filter(Boolean);

    // 同一种关系只记一次（四柱里可能多处相同的地支对）
    var seenRel = {};
    for (var a = 0; a < zhis.length; a++) {
      for (var b = a + 1; b < zhis.length; b++) {
        // 方向无关：子午 与 午子 视为同一对
        var rk = [zhis[a], zhis[b]].sort().join('');
        if (seenRel[rk]) continue;
        seenRel[rk] = 1;
        if (CHONG[zhis[a]] === zhis[b]) {
          var wa = ZHI_WX[zhis[a]], wb = ZHI_WX[zhis[b]];
          raw[wa] -= raw[wa] * 0.10;  // 冲主动摇，减力
          raw[wb] -= raw[wb] * 0.10;
          relations.push({ type: '冲', pair: zhis[a] + zhis[b],
            text: zhis[a] + zhis[b] + '相冲，双方力量各减一成' });
        }
        if (LIUHE[zhis[a]] === zhis[b]) {
          var wc = ZHI_WX[zhis[a]];
          raw[wc] += raw[wc] * 0.05;
          relations.push({ type: '合', pair: zhis[a] + zhis[b],
            text: zhis[a] + zhis[b] + '六合，' + wc + '气增旺' });
        }
        if (HAI[zhis[a]] === zhis[b]) {
          relations.push({ type: '害', pair: zhis[a] + zhis[b],
            text: zhis[a] + zhis[b] + '相害，暗中消耗' });
        }
      }
    }

    // 三合 / 三会成局
    SANHE.forEach(function (g2) {
      var hit = g2.zhi.filter(function (z) { return zhis.indexOf(z) >= 0; });
      if (hit.length === 3) {
        raw[g2.wx] += 1.5;
        relations.push({ type: '三合', pair: g2.zhi.join(''),
          text: g2.zhi.join('') + '三合' + g2.wx + '局，' + g2.wx + '势大增' });
      } else if (hit.length === 2) {
        raw[g2.wx] += 0.5;
        relations.push({ type: '半合', pair: hit.join(''),
          text: hit.join('') + '半合' + g2.wx + '局' });
      }
    });
    SANHUI.forEach(function (g2) {
      var hit = g2.zhi.filter(function (z) { return zhis.indexOf(z) >= 0; });
      if (hit.length === 3) {
        raw[g2.wx] += 2.0;
        relations.push({ type: '三会', pair: g2.zhi.join(''),
          text: g2.zhi.join('') + '三会' + g2.wx + '方，' + g2.wx + '势极旺' });
      }
    });

    // 归零处理（冲减后可能为负）
    WX_ORDER.forEach(function (w) {
      if (raw[w] < 0) raw[w] = 0;
      raw[w] = Math.round(raw[w] * 1000) / 1000;
    });

    return { raw: raw, detail: detail, relations: relations };
  }

  /**
   * 同党 / 异党
   * @returns {{tong:number, yi:number, tongPct:number, yiPct:number, level:string,
   *            breakdown:Object}}
   */
  function partyEnergy(c) {
    var e = computeEnergy(c);
    var raw = e.raw;
    var dm = c.dayMasterWuxing || GAN_WX[c.dayMaster] || '';
    if (!dm) return null;

    var tong = {}, yi = {};
    WX_ORDER.forEach(function (w) {
      tong[w] = 0; yi[w] = 0;
    });

    // 同党：比劫（同我）= 本五行；印星（生我）= 生我之五行
    tong[dm] = raw[dm];
    var yin = BEI_SHENG[dm];
    tong[yin] = raw[yin];

    // 异党：食伤（我生）、财星（我克）、官杀（克我）
    var shi = SHENG[dm];      // 我生
    var cai = KE[dm];         // 我克
    var guan = BEI_KE[dm];    // 克我
    yi[shi] = raw[shi];
    yi[cai] = raw[cai];
    yi[guan] = raw[guan];

    var tSum = WX_ORDER.reduce(function (s, w) { return s + tong[w]; }, 0);
    var ySum = WX_ORDER.reduce(function (s, w) { return s + yi[w]; }, 0);
    var total = tSum + ySum || 1;

    var tongPct = Math.round(tSum / total * 100);
    var yiPct = 100 - tongPct;

    // 旺衰分级（按同党占比）
    var level;
    if (tongPct >= 70) level = '极旺';
    else if (tongPct >= 55) level = '身旺';
    else if (tongPct >= 45) level = '中和';
    else if (tongPct >= 30) level = '身弱';
    else level = '极弱';

    return {
      tong: tong, yi: yi,
      tongSum: Math.round(tSum * 100) / 100,
      yiSum: Math.round(ySum * 100) / 100,
      tongPct: tongPct, yiPct: yiPct,
      level: level,
      dayMaster: c.dayMaster, dayMasterWuxing: dm,
      roles: { biJie: dm, yin: yin, shiShang: shi, cai: cai, guanSha: guan },
      raw: raw, relations: e.relations, detail: e.detail
    };
  }

  global.bzEnergy = {
    compute: computeEnergy,
    party: partyEnergy,
    WX_ORDER: WX_ORDER,
    GAN_WX: GAN_WX,
    ZHI_WX: ZHI_WX
  };
})(window);
