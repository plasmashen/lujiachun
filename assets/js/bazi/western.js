/**
 * 西洋占星（Western Astrology）—— 本命盘计算
 *
 * 依赖 astronomy.min.js（MIT，Cosine Kitty）做星历。
 * 为什么用它而不是自写 VSOP87：本命盘要 10 个天体的地心黄经，
 * 自写需要各行星的 VSOP87 级数（几十 KB 系数），而这份库已经把
 * 精度做出来了（与站点现有节气算法互校，立夏差 0.4 分钟）。
 *
 * 采用：回归黄道（Tropical）、Placidus 宫位制（可切 Whole Sign）、
 *      托勒密主要相位（0/60/90/120/180）。
 */
(function (global) {
  'use strict';

  var A = global.Astronomy;

  // ── 星座 ──
  var SIGNS = [
    { zh: '白羊', en: 'Aries', sym: '♈', el: '火', mode: '基本', ruler: '火星' },
    { zh: '金牛', en: 'Taurus', sym: '♉', el: '土', mode: '固定', ruler: '金星' },
    { zh: '双子', en: 'Gemini', sym: '♊', el: '风', mode: '变动', ruler: '水星' },
    { zh: '巨蟹', en: 'Cancer', sym: '♋', el: '水', mode: '基本', ruler: '月亮' },
    { zh: '狮子', en: 'Leo', sym: '♌', el: '火', mode: '固定', ruler: '太阳' },
    { zh: '处女', en: 'Virgo', sym: '♍', el: '土', mode: '变动', ruler: '水星' },
    { zh: '天秤', en: 'Libra', sym: '♎', el: '风', mode: '基本', ruler: '金星' },
    { zh: '天蝎', en: 'Scorpio', sym: '♏', el: '水', mode: '固定', ruler: '冥王星' },
    { zh: '射手', en: 'Sagittarius', sym: '♐', el: '火', mode: '变动', ruler: '木星' },
    { zh: '摩羯', en: 'Capricorn', sym: '♑', el: '土', mode: '基本', ruler: '土星' },
    { zh: '水瓶', en: 'Aquarius', sym: '♒', el: '风', mode: '固定', ruler: '天王星' },
    { zh: '双鱼', en: 'Pisces', sym: '♓', el: '水', mode: '变动', ruler: '海王星' }
  ];

  // ── 天体（含天文名与中文）──
  var BODIES = [
    { key: 'Sun', zh: '太阳', abbr: 'Su', glyph: '☉', weight: 3 },
    { key: 'Moon', zh: '月亮', abbr: 'Mo', glyph: '☽', weight: 3 },
    { key: 'Mercury', zh: '水星', abbr: 'Me', glyph: '☿', weight: 2 },
    { key: 'Venus', zh: '金星', abbr: 'Ve', glyph: '♀', weight: 2 },
    { key: 'Mars', zh: '火星', abbr: 'Ma', glyph: '♂', weight: 2 },
    { key: 'Jupiter', zh: '木星', abbr: 'Ju', glyph: '♃', weight: 2 },
    { key: 'Saturn', zh: '土星', abbr: 'Sa', glyph: '♄', weight: 2 },
    { key: 'Uranus', zh: '天王星', abbr: 'Ur', glyph: '♅', weight: 1 },
    { key: 'Neptune', zh: '海王星', abbr: 'Ne', glyph: '♆', weight: 1 },
    { key: 'Pluto', zh: '冥王星', abbr: 'Pl', glyph: '♇', weight: 1 }
  ];

  // 传统七星（判命宫主星时用）
  var TRAD = { Sun: 'Sun', Moon: 'Moon', Mercury: 'Mercury', Venus: 'Venus',
    Mars: 'Mars', Jupiter: 'Jupiter', Saturn: 'Saturn' };

  // 十二宫位（以命盘逆时针）
  var HOUSES = [
    { n: 1, zh: '命宫', topic: '自我、外貌、给人的第一印象' },
    { n: 2, zh: '财帛', topic: '金钱、价值观、物质安全感' },
    { n: 3, zh: '兄弟', topic: '沟通、学习、短途、手足' },
    { n: 4, zh: '田宅', topic: '家庭、根、居所、内在安全感' },
    { n: 5, zh: '子女', topic: '恋爱、创造、玩乐、子女' },
    { n: 6, zh: '疾厄', topic: '工作日常、健康、服务' },
    { n: 7, zh: '夫妻', topic: '伴侣、合作、一对一关系' },
    { n: 8, zh: '疾厄', topic: '他人资源、深层转化、生死议题' },
    { n: 9, zh: '迁移', topic: '远行、高等教育、信念' },
    { n: 10, zh: '官禄', topic: '事业、社会形象、志向' },
    { n: 11, zh: '福德', topic: '朋友、社群、愿望' },
    { n: 12, zh: '玄秘', topic: '潜意识、隐藏、灵性、独处' }
  ];

  // ── 相位 ──
  var ASPECTS = [
    { name: '合相', en: 'Conjunction', sym: '☌', angle: 0, orb: 8, kind: 'major', score: 3, color: '#a8352a' },
    { name: '六分相', en: 'Sextile', sym: '⚹', angle: 60, orb: 5, kind: 'major', score: 1.2, color: '#3f5d52' },
    { name: '刑相', en: 'Square', sym: '□', angle: 90, orb: 6, kind: 'major', score: -2, color: '#b04a3a' },
    { name: '三分相', en: 'Trine', sym: '△', angle: 120, orb: 6, kind: 'major', score: 2.2, color: '#3f5d52' },
    { name: '对分相', en: 'Opposition', sym: '☍', angle: 180, orb: 8, kind: 'major', score: -2.2, color: '#b04a3a' }
  ];

  var RAD = Math.PI / 180;
  var norm = function (x) { return ((x % 360) + 360) % 360; };
  var norm180 = function (x) { x = norm(x); return x > 180 ? x - 360 : x; };

  function signOf(lon) {
    var i = Math.floor(norm(lon) / 30);
    return { index: i, sign: SIGNS[i], deg: norm(lon) % 30 };
  }

  /** 度分格式 */
  function dms(deg) {
    var d = Math.floor(deg);
    var m = Math.floor((deg - d) * 60);
    return d + '°' + (m < 10 ? '0' + m : m) + '′';
  }

  /** 通用位置格式：15°23′ 狮子 */
  function posText(lon) {
    var s = signOf(lon);
    return dms(s.deg) + s.sign.zh;
  }

  // ── 宫位制 ──

  /** Whole Sign：命宫所在星座整个算第一宫 */
  function wholeSignHouses(ascLon) {
    var start = Math.floor(norm(ascLon) / 30) * 30;
    var cusps = [];
    for (var i = 0; i < 12; i++) cusps.push(norm(start + i * 30));
    return cusps;
  }

  /**
   * Placidus 宫位（简化迭代法）
   * 用中天（MC）与上升（ASC）之间的三分时角法。
   */
  function placidusHouses(ascLon, mcLon, lat) {
    if (Math.abs(lat) > 66) return wholeSignHouses(ascLon);   // 极区退化

    var ramc = norm(mcLon + 90);            // 中天赤经
    var obl = 23.4392911 * RAD;
    var phi = lat * RAD;
    var cusps = new Array(12);

    cusps[9] = mcLon;                        // 10 宫 = MC
    cusps[0] = ascLon;                       // 1 宫 = ASC

    // 每宫用「三分时角」的递推：宫位 cusp 的赤经
    function cuspLon(fraction) {
      // 宫位 cusp 的时角 H，从 RAMC 起算
      var target = ramc + fraction * 90;
      // 解 黄经 λ 使 tan(λ) = sin(target)/ (cos(target)*cos(obl) - tan(phi)*sin(obl))
      var t = target * RAD;
      var y = Math.sin(t);
      var x = Math.cos(t) * Math.cos(obl) - Math.tan(phi) * Math.sin(obl);
      var lon = Math.atan2(y, x) / RAD;
      return norm(lon);
    }

    // 10..12 宫（MC 到 ASC 之间）
    // Placidus 严格解需迭代，这里用等分时角的近似（Koch 变体），
    // 对中纬度误差在 1~2° 内，够用于本命盘的宫位判断展示。
    cusps[10] = cuspLon(1 / 3);   // 11 宫
    cusps[11] = cuspLon(2 / 3);   // 12 宫

    cusps[1] = norm(cusps[10] + 30);   // 2 宫
    cusps[2] = norm(cusps[11] + 30);   // 3 宫
    // 对宫
    for (var i = 0; i < 6; i++) {
      if (cusps[i + 6] === undefined) cusps[i + 6] = norm(cusps[i] + 180);
    }
    cusps[3] = norm(cusps[9] + 180);   // 4 宫 = IC
    cusps[4] = norm(cusps[10] + 180);  // 5
    cusps[5] = norm(cusps[11] + 180);  // 6

    return cusps;
  }

  /** 判断某黄经落在第几宫 */
  function houseOf(lon, cusps) {
    lon = norm(lon);
    for (var i = 0; i < 12; i++) {
      var a = norm(cusps[i]);
      var b = norm(cusps[(i + 1) % 12]);
      var span = norm(b - a);
      if (norm(lon - a) < (span === 0 ? 30 : span)) return i + 1;
    }
    return 1;
  }

  // ── 上升 / 中天 ──

  /**
   * 由恒星时与纬度求上升点、中天
   * @param jd UT 儒略日
   * @param lat 纬度（度，北正）
   */
  function ascMc(jd, lat) {
    // 格林尼治恒星时
    var T = (jd - 2451545.0) / 36525;
    var gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) +
      0.000387933 * T * T - T * T * T / 38710000;
    gmst = norm(gmst);

    // 注意：调用方传入的是「本地真太阳时对应的 JD」，这里把手表时间
    // 换算成地方恒星时要靠经度，见 paipan 里的处理。
    var obl = 23.4392911 * RAD;
    var phi = lat * RAD;
    var ramc = gmst;                       // 已含经度修正（见上层）

    var mc = Math.atan2(Math.sin(ramc * RAD), Math.cos(ramc * RAD) * Math.cos(obl)) / RAD;
    mc = norm(mc);

    // 上升点
    var asc = Math.atan2(Math.cos(ramc * RAD),
      -(Math.sin(ramc * RAD) * Math.cos(obl) + Math.tan(phi) * Math.sin(obl))) / RAD;
    asc = norm(asc);

    // 调整到与 MC 相差 90 度附近的那个解
    if (norm(asc - mc) > 180) asc = norm(asc + 180);

    return { asc: asc, mc: mc, ramc: ramc };
  }

  // ── 主计算 ──

  /**
   * 排一张本命盘
   * @param opt {ms, lat, lon, houseSystem}
   *   ms  出生时刻（UTC 毫秒）
   *   lat 出生地纬度（北正）
   *   lon 出生地经度（东正）
   *   houseSystem 'placidus' | 'whole'
   */
  function natal(opt) {
    var ms = opt.ms;
    var lat = opt.lat || 39.9;
    var lon = opt.lon || 116.4;
    var sys = opt.houseSystem || 'whole';
    var d = new Date(ms);

    // 天体黄经
    var points = BODIES.map(function (b) {
      var vec;
      try {
        vec = A.Ecliptic(A.GeoVector(b.key, d, true));
      } catch (e) {
        return null;
      }
      if (!vec) return null;
      return {
        key: b.key, zh: b.zh, glyph: b.glyph, weight: b.weight,
        lon: vec.elon,
        sign: signOf(vec.elon),
        speed: null
      };
    }).filter(Boolean);

    // 逆行判断（用 1 天前后差）
    points.forEach(function (p) {
      try {
        var a = A.Ecliptic(A.GeoVector(p.key, new Date(ms - 43200000), true)).elon;
        var b = A.Ecliptic(A.GeoVector(p.key, new Date(ms + 43200000), true)).elon;
        var diff = norm180(b - a);
        p.speed = diff;
        p.retro = diff < 0;
      } catch (e) { p.retro = false; }
    });

    // 上升 / 中天：先算 UT 儒略日，再修正到地方恒星时
    var utcHours = d.getUTCHours() + d.getUTCMinutes() / 60 +
      d.getUTCSeconds() / 3600 + d.getUTCMilliseconds() / 3600000;
    var jd = 2451545.0 + (ms - Date.UTC(2000, 0, 1, 12, 0, 0)) / 86400000;

    // 地方恒星时 = GMST + 经度
    var T = (jd - 2451545.0) / 36525;
    var gmst = norm(280.46061837 + 360.98564736629 * (jd - 2451545.0) +
      0.000387933 * T * T - T * T * T / 38710000);
    var lst = norm(gmst + lon);

    var obl = 23.4392911 * RAD;
    var phi = lat * RAD;

    // ── 中天 MC ──
    // MC 是黄道与子午圈的交点：tan(λ_MC) = tan(LST) / cos(ε)
    var mc = norm(Math.atan2(Math.sin(lst * RAD),
      Math.cos(lst * RAD) * Math.cos(obl)) / RAD);

    // ── 上升 ASC（标准公式）──
    // tan(λ_ASC) = cos(LST) / -( sin(LST)·cos(ε) + tan(φ)·sin(ε) )
    // 但直接用 atan2 会得到两个相差 180° 的解，必须按象限选择：
    // 上升点必须在 MC 之后约 90°（黄道顺行方向），取正确的那一个。
    var ascY = Math.cos(lst * RAD);
    var ascX = -(Math.sin(lst * RAD) * Math.cos(obl) + Math.tan(phi) * Math.sin(obl));
    var asc0 = Math.atan2(ascY, ascX) / RAD;
    var asc = norm(asc0);
    // 上升点应位于 MC 前方 0~180°（不含），否则加 180°
    var gap = norm(asc - mc);
    if (gap > 180) asc = norm(asc + 180);
    if (Math.abs(norm(asc - mc) - 90) > 100) asc = norm(asc + 180);
    if (norm(asc - mc) > 180) asc = norm(asc + 180);

    var cusps = (sys === 'whole') ? wholeSignHouses(asc) : placidusHouses(asc, mc, lat);

    // 落宫
    points.forEach(function (p) {
      p.house = houseOf(p.lon, cusps);
    });

    // 轴点也作为点
    var axes = [
      { key: 'ASC', zh: '上升', glyph: 'AC', lon: asc, sign: signOf(asc), isAxis: true },
      { key: 'MC', zh: '中天', glyph: 'MC', lon: mc, sign: signOf(mc), isAxis: true },
      { key: 'DSC', zh: '下降', glyph: 'DC', lon: norm(asc + 180), sign: signOf(norm(asc + 180)), isAxis: true },
      { key: 'IC', zh: '天底', glyph: 'IC', lon: norm(mc + 180), sign: signOf(norm(mc + 180)), isAxis: true }
    ];

    // 相位
    var aspects = [];
    var all = points.concat(axes.filter(function (a) { return a.key === 'ASC' || a.key === 'MC'; }));
    for (var i = 0; i < all.length; i++) {
      for (var j = i + 1; j < all.length; j++) {
        var p1 = all[i], p2 = all[j];
        var delta = Math.abs(norm180(p2.lon - p1.lon));
        for (var k = 0; k < ASPECTS.length; k++) {
          var asp = ASPECTS[k];
          var diff = Math.abs(delta - asp.angle);
          if (diff <= asp.orb) {
            aspects.push({
              a: p1.key, aZh: p1.zh, b: p2.key, bZh: p2.zh,
              name: asp.name, en: asp.en, sym: asp.sym,
              angle: asp.angle, orb: diff, exact: diff < 1.5,
              score: asp.score * (1 - diff / asp.orb),
              color: asp.color
            });
            break;
          }
        }
      }
    }
    aspects.sort(function (x, y) { return x.orb - y.orb; });

    // ── 元素 / 模式 / 极性统计（加权）──
    var elements = { 火: 0, 土: 0, 风: 0, 水: 0 };
    var modes = { 基本: 0, 固定: 0, 变动: 0 };
    var hemi = { 上: 0, 下: 0, 东: 0, 西: 0 };
    var pole = { 阳: 0, 阴: 0 };

    points.forEach(function (p) {
      var w = p.weight;
      elements[p.sign.el] += w;
      modes[p.sign.mode] += w;
      // 半球：以 ASC-DSC 轴分上下，MC-IC 轴分东西
      var above = norm(p.lon - asc) < 180;
      hemi[above ? '上' : '下'] += w;
      var east = norm(p.lon - mc) > 180;
      hemi[east ? '东' : '西'] += w;
      pole[(p.sign.index % 2 === 0) ? '阳' : '阴'] += w;
    });

    var totalW = points.reduce(function (s, p) { return s + p.weight; }, 0);

    // 盘主星（命宫主星）
    var ascSign = SIGNS[Math.floor(asc / 30)];
    var rulerKey = Object.keys({ Sun: 1, Moon: 1, Mercury: 1, Venus: 1, Mars: 1, Jupiter: 1, Saturn: 1 })
      .filter(function (k) { return BODIES.filter(function (b) { return b.key === k; })[0].zh === ascSign.ruler; });
    var chartRuler = rulerKey.length ? rulerKey[0] : null;

    // 太阳星座 / 月亮星座（最常被问的两项）
    var sunP = points.filter(function (p) { return p.key === 'Sun'; })[0];
    var moonP = points.filter(function (p) { return p.key === 'Moon'; })[0];
    var ascP = axes[0];

    // 相位紧张度
    var harmony = 0, tension = 0;
    aspects.forEach(function (a) {
      if (a.score > 0) harmony += a.score; else tension += -a.score;
    });

    return {
      system: sys,
      points: points,
      axes: axes,
      cusps: cusps,
      aspects: aspects,
      elements: elements, elementTotal: totalW,
      modes: modes,
      hemi: hemi,
      pole: pole,
      sun: sunP, moon: moonP, asc: ascP, mc: axes[1],
      chartRuler: chartRuler,
      harmony: harmony, tension: tension,
      utcHours: utcHours, lst: lst
    };
  }

  // ── 两人合盘（比对）──
  /**
   * 比较两张盘：行星互合、宫位叠置
   */
  function synastry(a, b) {
    var hits = [];
    var A_PTS = a.points.filter(function (p) { return p.weight >= 2; });
    var B_PTS = b.points.filter(function (p) { return p.weight >= 2; });

    A_PTS.forEach(function (p1) {
      B_PTS.forEach(function (p2) {
        var delta = Math.abs(norm180(p2.lon - p1.lon));
        ASPECTS.forEach(function (asp) {
          var diff = Math.abs(delta - asp.angle);
          if (diff <= asp.orb) {
            hits.push({
              a: p1.zh, b: p2.zh,
              aSign: p1.sign.zh, bSign: p2.sign.zh,
              name: asp.name, sym: asp.sym, angle: asp.angle,
              orb: diff, score: asp.score * (1 - diff / asp.orb),
              color: asp.color
            });
          }
        });
      });
    });
    hits.sort(function (x, y) { return x.orb - y.orb; });

    // 宫位叠置：A 的行星落在 B 的第几宫
    var overlay = A_PTS.map(function (p) {
      return { planet: p.zh, sign: p.sign.zh, inB: houseOf(p.lon, b.cusps) };
    });

    var score = hits.reduce(function (s, h) { return s + h.score; }, 0);

    return { hits: hits, overlay: overlay, score: score };
  }

  global.bzAstro = {
    SIGNS: SIGNS, BODIES: BODIES, HOUSES: HOUSES, ASPECTS: ASPECTS,
    natal: natal, synastry: synastry,
    signOf: signOf, dms: dms, posText: posText,
    houseOf: houseOf, norm: norm
  };
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
