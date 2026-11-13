/**
 * 奇门遁甲 —— 时家奇门（转盘奇门）
 *
 * 体系选择：时家奇门 · 转盘 · 拆补法
 *   —— 这是流传最广、资料最全的一路。飞盘、置闰、阴盘另有流派。
 *
 * 排盘流程：
 *   1. 定局：节气 → 上中下元 → 阴阳遁 + 局数（阳遁一至九 / 阴遁一至九）
 *   2. 排地盘：戊己庚辛壬癸丁丙乙 按局数落九宫
 *   3. 定值符值使：时辰旬首（甲子戊…）所在宫
 *   4. 排天盘：值符随时干转动
 *   5. 排八门：值使随时支转动
 *   6. 排九星、八神
 *   7. 出四柱、旬空、马星
 */
(function (global) {
  'use strict';

  // ── 九宫 ──
  // 洛书数：坎1 坤2 震3 巽4 中5 乾6 兑7 艮8 离9
  var PALACES = {
    1: { name: '坎', gua: '坎', wx: '水', dir: '正北', zhi: ['子'] },
    2: { name: '坤', gua: '坤', wx: '土', dir: '西南', zhi: ['未', '申'] },
    3: { name: '震', gua: '震', wx: '木', dir: '正东', zhi: ['卯'] },
    4: { name: '巽', gua: '巽', wx: '木', dir: '东南', zhi: ['辰', '巳'] },
    5: { name: '中', gua: '中', wx: '土', dir: '中央', zhi: [] },
    6: { name: '乾', gua: '乾', wx: '金', dir: '西北', zhi: ['戌', '亥'] },
    7: { name: '兑', gua: '兑', wx: '金', dir: '正西', zhi: ['酉'] },
    8: { name: '艮', gua: '艮', wx: '土', dir: '东北', zhi: ['丑', '寅'] },
    9: { name: '离', gua: '离', wx: '火', dir: '正南', zhi: ['午'] }
  };

  // 后天八卦方位 → 九宫数
  var GUA_TO_PALACE = { '坎': 1, '坤': 2, '震': 3, '巽': 4, '中': 5, '乾': 6, '兑': 7, '艮': 8, '离': 9 };

  // 三奇六仪顺序（地盘排布顺序）
  var QIYI = ['戊', '己', '庚', '辛', '壬', '癸', '丁', '丙', '乙'];

  // 九星（原宫）
  var STARS = {
    1: '天蓬', 2: '天芮', 3: '天冲', 4: '天辅', 5: '天禽',
    6: '天心', 7: '天柱', 8: '天任', 9: '天英'
  };

  // 八门（原宫）
  var DOORS = {
    1: '休门', 2: '死门', 3: '伤门', 4: '杜门',
    6: '开门', 7: '惊门', 8: '生门', 9: '景门'
  };

  // 八神（阴阳遁顺序不同）
  var GODS_YANG = ['值符', '螣蛇', '太阴', '六合', '白虎', '玄武', '九地', '九天'];
  var GODS_YIN = ['值符', '九天', '九地', '玄武', '白虎', '六合', '太阴', '螣蛇'];

  // ── 节气与局数 ──
  // 每个节气的上中下元局数（阳遁/阴遁分开）
  // 格式：[上元, 中元, 下元]
  var JU_TABLE = {
    // 阳遁（冬至→芒种）
    '冬至': { yin: false, ju: [1, 7, 4] },
    '小寒': { yin: false, ju: [2, 8, 5] },
    '大寒': { yin: false, ju: [3, 9, 6] },
    '立春': { yin: false, ju: [8, 5, 2] },
    '雨水': { yin: false, ju: [9, 6, 3] },
    '惊蛰': { yin: false, ju: [1, 7, 4] },
    '春分': { yin: false, ju: [3, 9, 6] },
    '清明': { yin: false, ju: [4, 1, 7] },
    '谷雨': { yin: false, ju: [5, 2, 8] },
    '立夏': { yin: false, ju: [4, 1, 7] },
    '小满': { yin: false, ju: [5, 2, 8] },
    '芒种': { yin: false, ju: [6, 3, 9] },
    // 阴遁（夏至→大雪）
    '夏至': { yin: true, ju: [9, 3, 6] },
    '小暑': { yin: true, ju: [8, 2, 5] },
    '大暑': { yin: true, ju: [7, 1, 4] },
    '立秋': { yin: true, ju: [2, 5, 8] },
    '处暑': { yin: true, ju: [1, 4, 7] },
    '白露': { yin: true, ju: [9, 3, 6] },
    '秋分': { yin: true, ju: [7, 1, 4] },
    '寒露': { yin: true, ju: [6, 9, 3] },
    '霜降': { yin: true, ju: [5, 8, 2] },
    '立冬': { yin: true, ju: [6, 9, 3] },
    '小雪': { yin: true, ju: [5, 8, 2] },
    '大雪': { yin: true, ju: [4, 7, 1] }
  };

  // 节气顺序（用于定位当前节气）
  var TERM_ORDER = [
    '冬至', '小寒', '大寒', '立春', '雨水', '惊蛰',
    '春分', '清明', '谷雨', '立夏', '小满', '芒种',
    '夏至', '小暑', '大暑', '立秋', '处暑', '白露',
    '秋分', '寒露', '霜降', '立冬', '小雪', '大雪'
  ];

  var GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  var ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

  // 旬首（六甲）对应六仪
  var XUN_SHOU = {
    '甲子': '戊', '甲戌': '己', '甲申': '庚',
    '甲午': '辛', '甲辰': '壬', '甲寅': '癸'
  };
  // 旬首 → 遁藏的六甲
  var XUN_TO_JIA = {
    '戊': '甲子', '己': '甲戌', '庚': '甲申',
    '辛': '甲午', '壬': '甲辰', '癸': '甲寅'
  };

  // ── 干支计算 ──
  function jiaziIndex(gan, zhi) {
    var gi = GAN.indexOf(gan), zi = ZHI.indexOf(zhi);
    for (var n = 0; n < 60; n++) {
      if (n % 10 === gi && n % 12 === zi) return n;
    }
    return -1;
  }

  /** 由 UTC 毫秒算日柱 */
  function dayGanzhi(ms) {
    var base = Date.UTC(2000, 0, 1);
    var baseIdx = 54;   // 2000-01-01 = 戊午
    var d = new Date(ms + 8 * 3600000);
    var bjDay = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    var bd = new Date(base + 8 * 3600000);
    var baseDay = Date.UTC(bd.getUTCFullYear(), bd.getUTCMonth(), bd.getUTCDate());
    var diff = Math.round((bjDay - baseDay) / 86400000);
    var idx = ((baseIdx + diff) % 60 + 60) % 60;
    return { gan: GAN[idx % 10], zhi: ZHI[idx % 12], idx: idx };
  }

  /** 时柱（五鼠遁） */
  function hourGanzhi(ms, dayGan) {
    var d = new Date(ms + 8 * 3600000);
    var h = d.getUTCHours();
    var zi = Math.floor(((h + 1) % 24) / 2);
    // 五鼠遁：甲己还加甲，乙庚丙作初，丙辛从戊起，丁壬庚子居，戊癸何方发，壬子是真途
    var startGan = {
      '甲': 0, '己': 0, '乙': 2, '庚': 2, '丙': 4, '辛': 4,
      '丁': 6, '壬': 6, '戊': 8, '癸': 8
    }[dayGan];
    var gi = (startGan + zi) % 10;
    return { gan: GAN[gi], zhi: ZHI[zi], zhiIdx: zi };
  }

  /** 年柱 */
  function yearGanzhi(ms) {
    // 以立春为界（简化：用公历年，2/4 前算上一年）
    var d = new Date(ms + 8 * 3600000);
    var y = d.getUTCFullYear();
    var m = d.getUTCMonth() + 1, day = d.getUTCDate();
    if (m < 2 || (m === 2 && day < 4)) y -= 1;
    var idx = ((y - 1984) % 60 + 60) % 60;   // 1984 甲子年
    return { gan: GAN[idx % 10], zhi: ZHI[idx % 12], idx: idx };
  }

  // ── 节气定位与定局 ──
  /**
   * 找当前时刻所属节气，并算上中下元
   * @param ms UTC 毫秒
   * @param termTimes {节气名: 该年该节气的时间戳}（由调用方提供，或内部用简化历）
   */
  function currentTerm(ms) {
    // 简化实现：用公历日期近似节气（每月两个，约在 6 日与 21 日）
    // 精确版需要调 astro.solarTermTime，页面里会传入
    var d = new Date(ms + 8 * 3600000);
    var m = d.getUTCMonth() + 1;
    var day = d.getUTCDate();

    // 每月两个节气，前一个约 6 日，后一个约 21 日
    // 节气与月份对应（从冬至起）
    var TERM_BY_MONTH = {
      1: ['小寒', '大寒'], 2: ['立春', '雨水'], 3: ['惊蛰', '春分'],
      4: ['清明', '谷雨'], 5: ['立夏', '小满'], 6: ['芒种', '夏至'],
      7: ['小暑', '大暑'], 8: ['立秋', '处暑'], 9: ['白露', '秋分'],
      10: ['寒露', '霜降'], 11: ['立冬', '小雪'], 12: ['大雪', '冬至']
    };
    var pair = TERM_BY_MONTH[m];
    var term = day < 21 ? pair[0] : pair[1];
    var termDay = day < 21 ? 6 : 21;
    return { term: term, dayInTerm: day - termDay };
  }

  /**
   * 定局：节气 + 上中下元
   * 拆补法：每节气约 15 天，分上元(1-5)、中元(6-10)、下元(11-15)
   */
  function determineJu(term, dayInTerm) {
    var cfg = JU_TABLE[term];
    if (!cfg) return null;
    var yuan = dayInTerm <= 5 ? 0 : dayInTerm <= 10 ? 1 : 2;
    return {
      term: term,
      yin: cfg.yin,
      ju: cfg.ju[yuan],
      yuan: ['上元', '中元', '下元'][yuan],
      dun: cfg.yin ? '阴遁' : '阳遁'
    };
  }

  // ── 排地盘 ──
  /**
   * 阳遁：局数宫起戊，顺布己庚辛壬癸丁丙乙
   * 阴遁：局数宫起戊，逆布
   */
  function earthPlate(ju, yin) {
    var plate = {};
    var start = ju;
    for (var i = 0; i < 9; i++) {
      var palace = yin
        ? ((start - i - 1 + 9) % 9) + 1
        : ((start + i - 1) % 9) + 1;
      plate[palace] = QIYI[i];
    }
    return plate;
  }

  /** 找某天干（六仪）落在地盘哪一宫 */
  function findInEarth(plate, gan) {
    for (var p in plate) if (plate[p] === gan) return +p;
    return null;
  }

  // ── 排盘主函数 ──
  /**
   * @param opt {ms, termTimes}  termTimes 可选：{节气名: ms} 精确节气时刻
   */
  function paipan(opt) {
    var ms = opt.ms;
    var yg = yearGanzhi(ms);
    var dg = dayGanzhi(ms);
    var hg = hourGanzhi(ms, dg.gan);

    // 定局
    var ct = currentTerm(ms);
    var juInfo = determineJu(ct.term, ct.dayInTerm);
    if (!juInfo) return null;

    // 地盘
    var earth = earthPlate(juInfo.ju, juInfo.yin);

    // 时辰旬首：找时柱所属旬
    var hourIdx = jiaziIndex(hg.gan, hg.zhi);
    var xunHeadIdx = hourIdx - (hourIdx % 10);
    var xunHeadGan = GAN[xunHeadIdx % 10];
    var xunHeadZhi = ZHI[xunHeadIdx % 12];
    var xunName = '甲' + xunHeadZhi;
    var xunQi = XUN_SHOU[xunName];        // 该旬对应的六仪
    var xunPalace = findInEarth(earth, xunQi);
    // 旬首落中五宫时寄坤二宫（奇门通则：中五无门无神，寄坤二）
    if (xunPalace === 5) xunPalace = 2;

    // 值符：旬首所在宫的原九星
    var zhifuStar = STARS[xunPalace] || STARS[5];
    // 值使：旬首所在宫的原八门
    var zhishiDoor = DOORS[xunPalace] || '死门';

    // 值符落宫：时干（甲则用旬首六仪）在地盘的宫位
    var hourGanPalace;
    if (hg.gan === '甲') {
      hourGanPalace = findInEarth(earth, xunQi);
    } else {
      hourGanPalace = findInEarth(earth, hg.gan);
    }
    if (!hourGanPalace) hourGanPalace = xunPalace;
    if (hourGanPalace === 5) hourGanPalace = 2;

    // ── 外八宫环（顺时针，不含中五）──
    // 洛书九宫的顺时针外环：坎1→艮8→震3→巽4→离9→坤2→兑7→乾6→回坎1
    var RING = [1, 8, 3, 4, 9, 2, 7, 6];

    // 值符星的原宫
    var zhifuOriginPalace = null;
    for (var sp in STARS) {
      if (STARS[sp] === zhifuStar) { zhifuOriginPalace = +sp; break; }
    }
    if (!zhifuOriginPalace) zhifuOriginPalace = xunPalace;

    // 位移在「八宫环」上算，不在九宫编号上算
    var oi = RING.indexOf(zhifuOriginPalace);
    var ti = RING.indexOf(hourGanPalace);
    if (oi < 0) oi = RING.indexOf(xunPalace);
    if (ti < 0) ti = oi;
    var ringShift = ((ti - oi) + 8) % 8;
    // 阴遁逆时针
    if (juInfo.yin) ringShift = (8 - ringShift) % 8;

    // 天盘干：地盘干按八宫环位移转动（中五的干寄坤二）
    var heaven = {};
    RING.forEach(function (p, idx) {
      var np = RING[(idx + ringShift) % 8];
      heaven[np] = earth[p];
    });
    heaven[5] = earth[5];      // 中五地盘干不动（寄宫另算）

    // 九星：按八宫环转动
    var starAt = {};
    RING.forEach(function (p, idx) {
      var np = RING[(idx + ringShift) % 8];
      starAt[np] = STARS[p];
    });
    // 天禽（中五）永远寄坤二宫，与天芮同处
    var extra = ['天禽'];

    // 八门：值使随时支转动（同样按八宫环）
    var xunHeadZhiIdx = ZHI.indexOf(xunHeadZhi);
    var doorShift = ((hg.zhiIdx - xunHeadZhiIdx) + 12) % 12;
    // 门的位移按八宫环走：每 1 个时辰走 1 宫
    var doorRingShift = doorShift % 8;
    if (juInfo.yin) doorRingShift = (8 - doorRingShift) % 8;

    var DOOR_OF_PALACE = {
      1: '休门', 8: '生门', 3: '伤门', 4: '杜门',
      9: '景门', 2: '死门', 7: '惊门', 6: '开门'
    };
    var doorAt = {};
    RING.forEach(function (p, idx) {
      var np = RING[(idx + doorRingShift) % 8];
      doorAt[np] = DOOR_OF_PALACE[p];
    });

    // 值使门：值使原宫在环上转动后落到的宫
    var zhishiOriginRing = RING.indexOf(xunPalace);
    if (zhishiOriginRing < 0) zhishiOriginRing = 0;
    var zhishiNowPalace = RING[(zhishiOriginRing + doorRingShift) % 8];

    // 八神：值符神必须与值符星同宫（这是通则），其余按顺序排
    // 阳遁顺行、阴遁逆行，值符宫起
    var gods = juInfo.yin ? GODS_YIN : GODS_YANG;
    var godAt = {};
    // 起点 = 值符星当前所在宫（保证值符神与值符星同宫）
    var zhifuStarPalace = null;
    for (var zp in starAt) if (starAt[zp] === zhifuStar) { zhifuStarPalace = +zp; break; }
    var startIdx = RING.indexOf(zhifuStarPalace != null ? zhifuStarPalace : hourGanPalace);
    if (startIdx < 0) startIdx = 0;
    for (var g2 = 0; g2 < 8; g2++) {
      var idx2 = juInfo.yin
        ? ((startIdx - g2) + 16) % 8
        : (startIdx + g2) % 8;
      godAt[RING[idx2]] = gods[g2];
    }

    // 组装九宫
    var cells = {};
    for (var p3 = 1; p3 <= 9; p3++) {
      cells[p3] = {
        palace: p3,
        name: PALACES[p3].name,
        dir: PALACES[p3].dir,
        wx: PALACES[p3].wx,
        earthGan: earth[p3] || '',
        heavenGan: heaven[p3] || '',
        star: (starAt[p3] || '') + (p3 === 2 ? '·禽' : ''),
        door: p3 === 5 ? '' : (doorAt[p3] || ''),
        god: p3 === 5 ? '' : (godAt[p3] || ''),
        isZhifu: starAt[p3] === zhifuStar,
        isZhishi: p3 === zhishiNowPalace,
        isXunHead: p3 === xunPalace
      };
    }

    // 旬空
    var kong = [ZHI[(xunHeadZhiIdx + 10) % 12], ZHI[(xunHeadZhiIdx + 11) % 12]];

    // 马星（驿马）：按日支三合局
    var MA_MAP = {
      '申': '寅', '子': '寅', '辰': '寅',
      '寅': '申', '午': '申', '戌': '申',
      '巳': '亥', '酉': '亥', '丑': '亥',
      '亥': '巳', '卯': '巳', '未': '巳'
    };
    var maZhi = MA_MAP[dg.zhi] || '';

    return {
      fourPillars: {
        year: yg.gan + yg.zhi, month: '', day: dg.gan + dg.zhi,
        hour: hg.gan + hg.zhi
      },
      dayGanzhi: dg, hourGanzhi: hg,
      ju: juInfo,
      xun: { name: xunName, qi: xunQi, palace: xunPalace },
      zhifu: { star: zhifuStar, palace: xunPalace },
      zhishi: { door: zhishiDoor, palace: xunPalace },
      cells: cells,
      kong: kong,
      ma: maZhi,
      shift: ringShift, zhifuPalace: hourGanPalace, zhishiPalace: zhishiNowPalace
    };
  }

  // ── 格局判断（常用吉凶格）──
  var PATTERNS = [
    { name: '青龙返首', cond: function (c) { return c.heavenGan === '戊' && c.earthGan === '丙'; },
      luck: '大吉', desc: '天盘戊加地盘丙。谋事可成，求财得利，宜进取。' },
    { name: '飞鸟跌穴', cond: function (c) { return c.heavenGan === '丙' && c.earthGan === '戊'; },
      luck: '大吉', desc: '天盘丙加地盘戊。事情有转机，旧事重提反成。' },
    { name: '青龙逃走', cond: function (c) { return c.heavenGan === '乙' && c.earthGan === '辛'; },
      luck: '凶', desc: '天盘乙加地盘辛。人走财散，主逃避、破财。' },
    { name: '白虎猖狂', cond: function (c) { return c.heavenGan === '辛' && c.earthGan === '乙'; },
      luck: '凶', desc: '天盘辛加地盘乙。主伤灾、争斗、远行不利。' },
    { name: '朱雀投江', cond: function (c) { return c.heavenGan === '丁' && c.earthGan === '癸'; },
      luck: '凶', desc: '天盘丁加地盘癸。文书有失，口舌是非，消息不通。' },
    { name: '螣蛇夭矫', cond: function (c) { return c.heavenGan === '癸' && c.earthGan === '丁'; },
      luck: '凶', desc: '天盘癸加地盘丁。文书官司，虚惊怪异。' },
    { name: '太白入荧', cond: function (c) { return c.heavenGan === '庚' && c.earthGan === '丙'; },
      luck: '凶', desc: '天盘庚加地盘丙。主客相争，宜守不宜攻。' },
    { name: '荧入太白', cond: function (c) { return c.heavenGan === '丙' && c.earthGan === '庚'; },
      luck: '凶', desc: '天盘丙加地盘庚。事情有阻，退守为上。' }
  ];

  function findPatterns(result) {
    var out = [];
    for (var p in result.cells) {
      var c = result.cells[p];
      PATTERNS.forEach(function (pt) {
        if (pt.cond(c)) {
          out.push({
            palace: +p, palaceName: c.name,
            name: pt.name, luck: pt.luck, desc: pt.desc
          });
        }
      });
    }
    return out;
  }

  // ── 九星/八门/八神吉凶 ──
  var STAR_LUCK = {
    '天蓬': '凶', '天芮': '凶', '天冲': '吉', '天辅': '吉', '天禽': '吉',
    '天心': '吉', '天柱': '凶', '天任': '吉', '天英': '平'
  };
  var DOOR_LUCK = {
    '休门': '吉', '生门': '大吉', '伤门': '凶', '杜门': '平',
    '景门': '平', '死门': '凶', '惊门': '凶', '开门': '大吉'
  };
  var GOD_LUCK = {
    '值符': '吉', '螣蛇': '凶', '太阴': '吉', '六合': '吉',
    '白虎': '凶', '玄武': '凶', '九地': '吉', '九天': '吉'
  };

  global.bzQimen = {
    PALACES: PALACES, QIYI: QIYI, STARS: STARS, DOORS: DOORS,
    GODS_YANG: GODS_YANG, GODS_YIN: GODS_YIN,
    JU_TABLE: JU_TABLE, PATTERNS: PATTERNS,
    STAR_LUCK: STAR_LUCK, DOOR_LUCK: DOOR_LUCK, GOD_LUCK: GOD_LUCK,
    paipan: paipan, determineJu: determineJu, currentTerm: currentTerm,
    earthPlate: earthPlate, findPatterns: findPatterns,
    dayGanzhi: dayGanzhi, hourGanzhi: hourGanzhi, yearGanzhi: yearGanzhi
  };
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
