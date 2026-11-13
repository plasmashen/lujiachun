/**
 * 七政四余 —— 中国古占星
 *
 * 七政：日、月、水、火、木、金、土（七曜）
 * 四余：紫气、月孛、罗睺、计都（虚星，非实体天体）
 *
 * 体系选择（重要）：
 *   罗睺/计都 —— 采用「星命家旧法」：罗睺为降交点、计都为升交点
 *                （清初汤若望新法反过来，但星命家至今沿用旧法）
 *   交点 —— 用平交点（不是真交点），这与传统历法一致
 *   宿度 —— 用《礼记要义》引《律历志》古度，非现代等分
 *   十二宫 —— 恒星黄道（以二十八宿为基准）
 *
 * 这是七政四余最容易做错的地方：流派选择必须在界面上讲清楚，
 * 否则「算法对但没人认」。
 */
(function (global) {
  'use strict';

  var A = global.Astronomy;

  // ── 二十八宿（古度，出自《礼记要义》引《律历志》）──
  // 总 365 古度，换算到 360°
  var XIU_DU = [
    ['角', 12], ['亢', 9], ['氐', 15], ['房', 5], ['心', 5], ['尾', 18], ['箕', 11],
    ['斗', 26], ['牛', 8], ['女', 12], ['虚', 10], ['危', 17], ['室', 16], ['壁', 9],
    ['奎', 16], ['娄', 12], ['胃', 14], ['昴', 11], ['毕', 16], ['觜', 2], ['参', 9],
    ['井', 33], ['鬼', 4], ['柳', 15], ['星', 7], ['张', 18], ['翼', 18], ['轸', 17]
  ];

  var XIU_TOTAL = XIU_DU.reduce(function (s, x) { return s + x[1]; }, 0);

  // 累积起点（360° 制）
  //
  // 关键：古籍宿度是从「角宿」起算的累积值，但角宿的距星是角宿一（Spica），
  // 它在恒星黄道上的位置约为 180°（天秤 0°），不是 0°。
  // 所以整张宿界表必须整体平移 180°，才能与真实黄经对应。
  //
  // 验证：Spica J2000 赤道坐标 (13h25m11.6s, -11°09'41") 转黄道得回归黄经 203.841°，
  //       减 ayanamsa 23.8531° = 179.988° ≈ 180°。
  var XIU_OFFSET = 180;

  var XIU_BOUNDS = (function () {
    var acc = 0, out = [];
    XIU_DU.forEach(function (x) {
      var start = acc / XIU_TOTAL * 360 + XIU_OFFSET;
      acc += x[1];
      var end = acc / XIU_TOTAL * 360 + XIU_OFFSET;
      if (start >= 360) start -= 360;
      if (end >= 360) end -= 360;
      var width = x[1] / XIU_TOTAL * 360;
      out.push({
        name: x[0], du: x[1],
        start: start, end: end, width: width,
        // 保留未平移的原始值，便于校验
        rawStart: start - XIU_OFFSET
      });
    });
    return out;
  })();

  // 二十八宿对应四象
  var XIU_GROUP = {
    '角': '东方青龙', '亢': '东方青龙', '氐': '东方青龙', '房': '东方青龙',
    '心': '东方青龙', '尾': '东方青龙', '箕': '东方青龙',
    '斗': '北方玄武', '牛': '北方玄武', '女': '北方玄武', '虚': '北方玄武',
    '危': '北方玄武', '室': '北方玄武', '壁': '北方玄武',
    '奎': '西方白虎', '娄': '西方白虎', '胃': '西方白虎', '昴': '西方白虎',
    '毕': '西方白虎', '觜': '西方白虎', '参': '西方白虎',
    '井': '南方朱雀', '鬼': '南方朱雀', '柳': '南方朱雀', '星': '南方朱雀',
    '张': '南方朱雀', '翼': '南方朱雀', '轸': '南方朱雀'
  };

  // 十二宫（恒星黄道，从戌宫起为白羊）
  var SIGNS = [
    { name: '戌', west: '白羊', ruler: '火星' },
    { name: '酉', west: '金牛', ruler: '金星' },
    { name: '申', west: '双子', ruler: '水星' },
    { name: '未', west: '巨蟹', ruler: '月亮' },
    { name: '午', west: '狮子', ruler: '太阳' },
    { name: '巳', west: '处女', ruler: '水星' },
    { name: '辰', west: '天秤', ruler: '金星' },
    { name: '卯', west: '天蝎', ruler: '火星' },
    { name: '寅', west: '射手', ruler: '木星' },
    { name: '丑', west: '摩羯', ruler: '土星' },
    { name: '子', west: '水瓶', ruler: '土星' },
    { name: '亥', west: '双鱼', ruler: '木星' }
  ];

  // 七政
  var PLANETS = [
    { key: 'Sun', zh: '日', full: '太阳', wx: '火', day: '日' },
    { key: 'Moon', zh: '月', full: '太阴', wx: '水', day: '月' },
    { key: 'Mercury', zh: '水', full: '水星', wx: '水', day: '水' },
    { key: 'Venus', zh: '金', full: '金星', wx: '金', day: '金' },
    { key: 'Mars', zh: '火', full: '火星', wx: '火', day: '火' },
    { key: 'Jupiter', zh: '木', full: '木星', wx: '木', day: '木' },
    { key: 'Saturn', zh: '土', full: '土星', wx: '土', day: '土' }
  ];

  // 四余
  var SIYU = [
    { key: 'ziqi', zh: '紫气', wx: '木', note: '木之余' },
    { key: 'yuebo', zh: '月孛', wx: '水', note: '水之余' },
    { key: 'luohou', zh: '罗睺', wx: '火', note: '火之余（降交点）' },
    { key: 'jidu', zh: '计都', wx: '土', note: '土之余（升交点）' }
  ];

  var RAD = Math.PI / 180;
  var norm = function (x) { return ((x % 360) + 360) % 360; };

  // ── 恒星黄道修正（岁差/Lahiri 近似）──
  // 七政四余用恒星黄道，需减 ayanamsa
  function ayanamsa(ms) {
    var jd = ms / 86400000 + 2440587.5;
    var T = (jd - 2451545.0) / 36525;
    return 23.8531 + 1.39634 * T + 0.0003086 * T * T;
  }

  // ── 四余计算 ──
  /**
   * 平交点 Ω：月球轨道升交点黄经，18.6 年退行一周
   * 月孛：月球轨道远地点，8.85 年顺行一周
   * 紫气：28 年一周（古法「二十八年十闰，气行一周天」）
   */
  function meanNode(ms) {
    var jd = ms / 86400000 + 2440587.5;
    var T = (jd - 2451545.0) / 36525;
    return norm(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T
      + T * T * T / 467441 - T * T * T * T / 60616000);
  }

  function meanApogee(ms) {
    var jd = ms / 86400000 + 2440587.5;
    var T = (jd - 2451545.0) / 36525;
    return norm(83.3532430 + 4069.0137287 * T - 0.0103200 * T * T
      - T * T * T / 80053 + T * T * T * T / 18999000);
  }

  /** 紫气：28 年一周天。历元取 1900-01-01 紫气在 0°（简化，需按具体历法校准） */
  function ziqi(ms) {
    // 1900-01-01 00:00 UT 为历元
    var epoch = Date.UTC(1900, 0, 1) - 8 * 3600000;
    var days = (ms - epoch) / 86400000;
    var period = 28 * 365.2422;   // 28 年
    return norm(days / period * 360);
  }

  // ── 入宿度 ──
  /** 返回某黄经落在哪一宿，以及入宿度 */
  function xiuOf(lon) {
    lon = norm(lon);
    for (var i = 0; i < XIU_BOUNDS.length; i++) {
      var b = XIU_BOUNDS[i];
      var span = norm(b.end - b.start) || 360;
      var off = norm(lon - b.start);
      if (off < span) {
        return {
          name: b.name,
          group: XIU_GROUP[b.name],
          ruDu: off / b.width * b.du,   // 入宿度（古度）
          totalDu: b.du,
          start: b.start, end: b.end
        };
      }
    }
    var last = XIU_BOUNDS[XIU_BOUNDS.length - 1];
    return { name: last.name, group: XIU_GROUP[last.name], ruDu: 0, totalDu: last.du,
      start: last.start, end: last.end };
  }

  /**
   * 返回某黄经落在十二宫哪一宫
   *
   * 关键：十二宫的划分基准是「回归黄道」（春分点起），
   * 所以判断宫位必须用回归黄经，不能用恒星黄经。
   * 二十八宿则相反——宿固定在恒星上，必须用恒星黄经。
   *
   * 这也是七政四余最容易搞错的地方：宫用回归、宿用恒星。
   *
   * @param lon 回归黄经
   */
  function signOf(lon) {
    var idx = Math.floor(norm(lon) / 30);
    return { index: idx, sign: SIGNS[idx], deg: norm(lon) % 30 };
  }

  // ── 主排盘 ──
  /**
   * @param opt {ms, lat, lon}
   *   ms  UTC 毫秒
   */
  function paipan(opt) {
    var ms = opt.ms;
    var d = new Date(ms);
    var ayan = ayanamsa(ms);

    var bodies = [];

    // 七政：地心黄经 - ayanamsa = 恒星黄经
    PLANETS.forEach(function (p) {
      var e;
      try {
        e = A.Ecliptic(A.GeoVector(p.key, d, true));
      } catch (err) { return; }
      if (!e) return;
      var tropical = e.elon;
      var sidereal = norm(tropical - ayan);
      bodies.push({
        key: p.key, zh: p.zh, full: p.full, wx: p.wx,
        tropical: tropical,
        lon: sidereal,               // 恒星黄经（用于入宿）
        sign: signOf(tropical),      // 宫位用回归黄经
        xiu: xiuOf(sidereal),        // 入宿用恒星黄经
        kind: 'planet'
      });
    });

    // 四余
    var nodeLon = norm(meanNode(ms) - ayan);       // 升交点（恒星）
    var aposLon = norm(meanApogee(ms) - ayan);
    var ziqiLon = norm(ziqi(ms) - ayan);

    // 星命家旧法：罗睺=降交点，计都=升交点
    bodies.push({
      key: 'luohou', zh: '罗睺', full: '罗睺', wx: '火',
      lon: norm(nodeLon + 180),
      sign: signOf(norm(nodeLon + 180 + ayan)),   // 宫位：转回归
      xiu: xiuOf(norm(nodeLon + 180)),
      kind: 'siyu',
      note: '降交点（旧法）'
    });
    bodies.push({
      key: 'jidu', zh: '计都', full: '计都', wx: '土',
      lon: nodeLon,
      sign: signOf(norm(nodeLon + ayan)),
      xiu: xiuOf(nodeLon),
      kind: 'siyu',
      note: '升交点（旧法）'
    });
    bodies.push({
      key: 'yuebo', zh: '月孛', full: '月孛', wx: '水',
      lon: aposLon,
      sign: signOf(norm(aposLon + ayan)),
      xiu: xiuOf(aposLon),
      kind: 'siyu',
      note: '月球远地点'
    });
    bodies.push({
      key: 'ziqi', zh: '紫气', full: '紫气', wx: '木',
      lon: ziqiLon,
      sign: signOf(norm(ziqiLon + ayan)),
      xiu: xiuOf(ziqiLon),
      kind: 'siyu',
      note: '28 年一周（历元近似）'
    });

    // 命宫：以太阳所在宫与出生时刻推算（简化：用上升点）
    // 七政四余的命宫有多种定法，这里用「卯时太阳所在宫为命宫」的通行简法
    var sun = bodies.filter(function (b) { return b.key === 'Sun'; })[0];
    var birthHour = d.getUTCHours() + 8;   // 北京时间小时
    if (birthHour >= 24) birthHour -= 24;
    // 命宫 = 太阳宫 - (时支数)  （卯时=0）
    var hourZhi = Math.floor(((birthHour + 1) % 24) / 2);
    var mingIdx = ((sun.sign.index - (hourZhi - 3)) % 12 + 12) % 12;
    var ming = SIGNS[mingIdx];

    // 身宫
    var shenIdx = (mingIdx + hourZhi) % 12;
    var shen = SIGNS[shenIdx];

    return {
      ms: ms,
      ayanamsa: ayan,
      bodies: bodies,
      sun: sun,
      ming: { sign: ming, index: mingIdx },
      shen: { sign: shen, index: shenIdx },
      hourZhi: hourZhi,
      xiuBounds: XIU_BOUNDS
    };
  }

  // ── 宫主 / 度主 ──
  /** 二十八宿的度主（各宿分属七政）*/
  var XIU_RULER = {
    '角': '木', '亢': '金', '氐': '土', '房': '日', '心': '月', '尾': '火', '箕': '水',
    '斗': '木', '牛': '金', '女': '土', '虚': '日', '危': '月', '室': '火', '壁': '水',
    '奎': '木', '娄': '金', '胃': '土', '昴': '日', '毕': '月', '觜': '火', '参': '水',
    '井': '木', '鬼': '金', '柳': '土', '星': '日', '张': '月', '翼': '火', '轸': '水'
  };

  // ── 庙旺落陷（简化）──
  var DIGNITY = {
    '日': { '午': '庙', '卯': '旺', '子': '陷' },
    '月': { '未': '庙', '酉': '旺', '丑': '陷' },
    '水': { '巳': '庙', '申': '旺', '寅': '陷' },
    '金': { '酉': '庙', '辰': '旺', '卯': '陷' },
    '火': { '卯': '庙', '戌': '旺', '申': '陷' },
    '木': { '寅': '庙', '亥': '旺', '巳': '陷' },
    '土': { '丑': '庙', '子': '旺', '未': '陷' }
  };

  function dignity(body) {
    var d = DIGNITY[body.zh];
    if (!d) return null;
    return d[body.sign.sign.name] || null;
  }

  global.bzQizheng = {
    XIU_BOUNDS: XIU_BOUNDS,
    XIU_DU: XIU_DU,
    XIU_RULER: XIU_RULER,
    XIU_GROUP: XIU_GROUP,
    SIGNS: SIGNS,
    PLANETS: PLANETS,
    SIYU: SIYU,
    DIGNITY: DIGNITY,
    paipan: paipan,
    xiuOf: xiuOf,
    signOf: signOf,
    ayanamsa: ayanamsa,
    meanNode: meanNode,
    meanApogee: meanApogee,
    ziqi: ziqi,
    dignity: dignity
  };
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
