/**
 * 梅花易数 —— 起卦与断卦
 *
 * 依据：《梅花易数》（邵雍）通行法
 *
 * 起卦三法：
 *   时间卦 —— 年+月+日 之和为上卦，加时 为下卦，总数取动爻
 *   数字卦 —— 报两数，分别起上下卦
 *   字数卦 —— 按字数分上下卦
 *
 * 断卦核心：分体用
 *   动爻所在之卦为「用」，另一卦为「体」
 *   体用生克定吉凶：用生体吉、体生用泄、体克用小吉、用克体凶、比和吉
 */
(function (global) {
  'use strict';

  // 先天八卦数：乾一 兑二 离三 震四 巽五 坎六 艮七 坤八
  var XIANTIAN = [
    { num: 1, name: '乾', sym: '☰', wx: '金', nature: '天', yao: [1, 1, 1] },
    { num: 2, name: '兑', sym: '☱', wx: '金', nature: '泽', yao: [1, 1, 0] },
    { num: 3, name: '离', sym: '☲', wx: '火', nature: '火', yao: [1, 0, 1] },
    { num: 4, name: '震', sym: '☳', wx: '木', nature: '雷', yao: [1, 0, 0] },
    { num: 5, name: '巽', sym: '☴', wx: '木', nature: '风', yao: [0, 1, 1] },
    { num: 6, name: '坎', sym: '☵', wx: '水', nature: '水', yao: [0, 1, 0] },
    { num: 7, name: '艮', sym: '☶', wx: '土', nature: '山', yao: [0, 0, 1] },
    { num: 8, name: '坤', sym: '☷', wx: '土', nature: '地', yao: [0, 0, 0] }
  ];

  var GUA_TABLE = null;   // 复用六爻的表（运行时取）

  function byNum(n) {
    // 先天卦数 1~8，超出取余（余 0 作 8）
    var i = ((n - 1) % 8 + 8) % 8;
    return XIANTIAN[i];
  }

  /** 六十四卦名（自建，避免依赖 liuyao 的加载顺序） */
  var NAMES = [
    ['乾为天', '天泽履', '天火同人', '天雷无妄', '天风姤', '天水讼', '天山遁', '天地否'],
    ['泽天夬', '兑为泽', '泽火革', '泽雷随', '泽风大过', '泽水困', '泽山咸', '泽地萃'],
    ['火天大有', '火泽睽', '离为火', '火雷噬嗑', '火风鼎', '火水未济', '火山旅', '火地晋'],
    ['雷天大壮', '雷泽归妹', '雷火丰', '震为雷', '雷风恒', '雷水解', '雷山小过', '雷地豫'],
    ['风天小畜', '风泽中孚', '风火家人', '风雷益', '巽为风', '风水涣', '风山渐', '风地观'],
    ['水天需', '水泽节', '水火既济', '水雷屯', '水风井', '坎为水', '水山蹇', '水地比'],
    ['山天大畜', '山泽损', '山火贲', '山雷颐', '山风蛊', '山水蒙', '艮为山', '山地剥'],
    ['地天泰', '地泽临', '地火明夷', '地雷复', '地风升', '地水师', '地山谦', '坤为地']
  ];
  var ORDER = ['乾', '兑', '离', '震', '巽', '坎', '艮', '坤'];

  function guaName(upper, lower) {
    var ui = ORDER.indexOf(upper.name);
    var li = ORDER.indexOf(lower.name);
    return NAMES[ui][li];
  }

  var SHENG = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
  var KE = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };

  /**
   * 时间卦
   * 上卦 = (年支序 + 月 + 日) % 8
   * 下卦 = (年支序 + 月 + 日 + 时支序) % 8
   * 动爻 = (年支序 + 月 + 日 + 时支序) % 6
   *
   * @param y 年支序（子=1…亥=12）
   * @param m 农历月
   * @param d 农历日
   * @param h 时支序（子=1…亥=12）
   */
  function byTime(y, m, d, h) {
    var up = byNum((y + m + d) % 8 || 8);
    var sum = y + m + d + h;
    var low = byNum(sum % 8 || 8);
    var moving = sum % 6 || 6;
    return build(up, low, moving, '时间卦');
  }

  /** 数字卦 */
  function byNumbers(a, b) {
    var up = byNum(a % 8 || 8);
    var low = byNum(b % 8 || 8);
    var moving = (a + b) % 6 || 6;
    return build(up, low, moving, '数字卦');
  }

  /** 字数卦：字数分上下 */
  function byText(text) {
    var n = String(text || '').replace(/\s/g, '').length;
    if (n === 0) return null;
    var half = Math.ceil(n / 2);
    var up = byNum(half % 8 || 8);
    var low = byNum((n - half) % 8 || 8);
    var moving = n % 6 || 6;
    return build(up, low, moving, '字数卦');
  }

  /**
   * 组装卦：上下卦 + 动爻 → 本卦、互卦、变卦、体用
   */
  function build(up, low, moving, method) {
    // 六爻阴阳（自下而上）：下卦三爻 + 上卦三爻
    var yao = low.yao.concat(up.yao);

    // 变卦：动爻变
    var changed = yao.slice();
    var mi = moving - 1;
    changed[mi] = changed[mi] ? 0 : 1;

    var lowerC = triFrom(changed.slice(0, 3));
    var upperC = triFrom(changed.slice(3, 6));

    // 互卦：2-3-4 爻为下卦，3-4-5 爻为上卦
    var huLow = triFrom([yao[1], yao[2], yao[3]]);
    var huUp = triFrom([yao[2], yao[3], yao[4]]);

    // 体用：动爻在下卦 → 下为用、上为体；反之
    var dongInLower = mi < 3;
    var ti = dongInLower ? up : low;
    var yong = dongInLower ? low : up;

    var rel = relation(ti.wx, yong.wx);

    return {
      method: method,
      upper: up, lower: low,
      name: guaName(up, low),
      yao: yao,
      moving: moving,
      changed: {
        upper: upperC, lower: lowerC,
        name: guaName(upperC, lowerC),
        yao: changed
      },
      hu: {
        upper: huUp, lower: huLow,
        name: guaName(huUp, huLow)
      },
      ti: ti, yong: yong,
      tiIsUpper: dongInLower,
      relation: rel
    };
  }

  /** 由三爻（自下而上）反查卦 */
  function triFrom(three) {
    for (var i = 0; i < XIANTIAN.length; i++) {
      var t = XIANTIAN[i];
      if (t.yao[0] === three[0] && t.yao[1] === three[1] && t.yao[2] === three[2]) return t;
    }
    return XIANTIAN[0];
  }

  /** 体用生克 */
  function relation(tiWx, yongWx) {
    if (tiWx === yongWx) {
      return { key: '比和', level: '吉', desc: '体用同气，事情顺遂，彼此相当，多主成。' };
    }
    if (SHENG[yongWx] === tiWx) {
      return { key: '用生体', level: '大吉', desc: '外部力量来助你，所求易得，往往还有意外之喜。' };
    }
    if (SHENG[tiWx] === yongWx) {
      return { key: '体生用', level: '泄', desc: '你在往外付出，耗神费力，事情能成但不易得利。' };
    }
    if (KE[tiWx] === yongWx) {
      return { key: '体克用', level: '小吉', desc: '你能掌控局面，但要费一番力，属"求而得之"。' };
    }
    if (KE[yongWx] === tiWx) {
      return { key: '用克体', level: '凶', desc: '外部压力克制你，阻力大，强行推进多半吃亏，宜守。' };
    }
    return { key: '', level: '', desc: '' };
  }

  /** 卦象含义（简，用于断卦提示） */
  var GUA_MEAN = {
    '乾': '刚健、主动、果断、领导。事情偏硬、快。',
    '兑': '喜悦、口舌、交际、少女。事多与说话、约定有关。',
    '离': '光明、文书、显露、离散。事易被人知道，或涉及文件。',
    '震': '动、惊、起动、长子。事情会有突然的动作。',
    '巽': '入、顺、风、来往。事情在慢慢渗透，宜柔不宜刚。',
    '坎': '险、陷、水、智。过程有风险或反复，需谨慎。',
    '艮': '止、阻、山、少男。事情会停下来，或有人阻止。',
    '坤': '顺、柔、承载、母。事情靠积累，急不得。'
  };

  /** 体卦旺衰参考（简易，按时令） */
  var SEASON_WX = {
    '春': '木', '夏': '火', '秋': '金', '冬': '水',
    '四季': '土'
  };

  global.bzMeihua = {
    XIANTIAN: XIANTIAN, GUA_MEAN: GUA_MEAN,
    byTime: byTime, byNumbers: byNumbers, byText: byText,
    build: build, relation: relation, guaName: guaName,
    byNum: byNum
  };
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
