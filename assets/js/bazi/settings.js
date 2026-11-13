/**
 * 命理设置 —— 六项可配置项
 *
 * 对应问真的六个会员设置功能：
 *   ① 神煞设置        自定义显示/隐藏、新增神煞
 *   ② 地支藏干设置    自定义藏干元素与顺序（不同流派）
 *   ③ 人元司令分野    按不同古籍切换司令表
 *   ④ 格局取法        月令主气 / 月令透干
 *   ⑤ 刑冲破害显示    开关
 *   ⑥ 命宫身宫中气    按本月 / 过中气换月
 *
 * 设置存在 localStorage，key = bz_set_v1
 */
(function (global) {
  'use strict';

  var KEY = 'bz_set_v1';

  // ── 默认设置 ──
  var DEFAULTS = {
    // ① 神煞：隐藏的神煞名列表
    shenshaHidden: [],
    // ② 藏干流派：'standard' 标准 / 'zhongqi' 中气优先 / custom 自定义表
    cangganMode: 'standard',
    cangganCustom: {},
    // ③ 人元司令：'ziping' 子平真诠 / 'sanming' 三命通会 / 'yuanhai' 渊海子平 / 'shenfeng' 神峰通考
    silingMode: 'ziping',
    // ④ 格局取法：'mainqi' 月令主气直接取格 / 'tougan' 月令透干取格
    gejuMode: 'tougan',
    // ⑤ 刑冲破害：开关 + 自定义生效规则
    showXingchong: true,
    xcRules: { chong: true, liuhe: true, sanhe: true, sanhui: true, hai: true, xing: true },
    xcWeight: { chong: -0.10, liuhe: 0.05, sanhe: 1.5, sanhui: 2.0 },
    // ⑥ 命宫身宫：'benyue' 按本月 / 'zhongqi' 过中气换月
    gongMode: 'benyue',
    // ⑦ 自定义神煞（新增）
    customShensha: []
  };

  var S = null;

  function load() {
    if (S) return S;
    S = {};
    for (var k in DEFAULTS) S[k] = DEFAULTS[k];
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var o = JSON.parse(raw);
        for (var k2 in o) {
          if (o.hasOwnProperty(k2)) S[k2] = o[k2];
        }
      }
    } catch (e) { /* 忽略 */ }
    return S;
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(load()));
    } catch (e) { /* 忽略 */ }
  }

  function get(k) { return load()[k]; }
  function set(k, v) { load()[k] = v; save(); }
  function reset() {
    try { localStorage.removeItem(KEY); } catch (e) {}
    S = null;
  }

  // ── ① 神煞过滤 ──
  function filterShensha(list) {
    var hid = load().shenshaHidden || [];
    if (!hid.length) return list;
    return (list || []).filter(function (n) { return hid.indexOf(n) < 0; });
  }

  // ── ② 藏干表（按流派）──
  var CANG_STD = {
    子: ['癸'], 丑: ['己', '癸', '辛'], 寅: ['甲', '丙', '戊'], 卯: ['乙'],
    辰: ['戊', '乙', '癸'], 巳: ['丙', '庚', '戊'], 午: ['丁', '己'],
    未: ['己', '丁', '乙'], 申: ['庚', '壬', '戊'], 酉: ['辛'],
    戌: ['戊', '辛', '丁'], 亥: ['壬', '甲']
  };
  // 中气优先流派（部分流派把中气排前）
  var CANG_ZHONGQI = {
    子: ['癸'], 丑: ['癸', '己', '辛'], 寅: ['丙', '甲', '戊'], 卯: ['乙'],
    辰: ['乙', '戊', '癸'], 巳: ['庚', '丙', '戊'], 午: ['己', '丁'],
    未: ['丁', '己', '乙'], 申: ['壬', '庚', '戊'], 酉: ['辛'],
    戌: ['辛', '戊', '丁'], 亥: ['甲', '壬']
  };

  function canggan(zhi) {
    var s = load();
    if (s.cangganMode === 'custom' && s.cangganCustom && s.cangganCustom[zhi]) {
      return s.cangganCustom[zhi];
    }
    if (s.cangganMode === 'zhongqi') return CANG_ZHONGQI[zhi] || CANG_STD[zhi] || [];
    return CANG_STD[zhi] || [];
  }

  // ── ③ 人元司令分野 ──
  // 问真提供多套：子平真诠 / 三命通会 / 渊海子平 / 神峰通考 / 星平海会
  // 段界为「节气后第 N 天」（0 起）
  var SILING = {
    // 子平真诠（问真默认，与 rysl.js 实测表一致）
    ziping: {
      寅: [['戊', 8], ['丙', 15], ['甲', 29]],
      卯: [['甲', 11], ['乙', 30]],
      辰: [['乙', 10], ['癸', 13], ['戊', 30]],
      巳: [['戊', 6], ['庚', 15], ['丙', 31]],
      午: [['丙', 11], ['己', 20], ['丁', 31]],
      未: [['丁', 10], ['乙', 13], ['己', 31]],
      申: [['戊己', 11], ['壬', 14], ['庚', 31]],
      酉: [['庚', 11], ['辛', 31]],
      戌: [['辛', 10], ['丁', 13], ['戊', 30]],
      亥: [['戊', 8], ['甲', 13], ['壬', 29]],
      子: [['壬', 11], ['癸', 29]],
      丑: [['癸', 10], ['辛', 13], ['己', 30]],
    },
    // 三命通会
    sanming: {
      寅: [['己', 8], ['丙', 13], ['甲', 29]],
      卯: [['甲', 10], ['癸', 13], ['乙', 30]],
      辰: [['乙', 10], ['癸', 13], ['戊', 30]],
      巳: [['戊', 8], ['庚', 13], ['丙', 31]],
      午: [['丙', 10], ['己', 13], ['丁', 31]],
      未: [['丁', 8], ['乙', 13], ['己', 31]],
      申: [['己', 8], ['戊', 11], ['壬', 14], ['庚', 31]],
      酉: [['庚', 8], ['丁', 11], ['辛', 31]],
      戌: [['辛', 8], ['丁', 13], ['戊', 30]],
      亥: [['戊', 8], ['甲', 13], ['壬', 29]],
      子: [['壬', 10], ['辛', 13], ['癸', 29]],
      丑: [['癸', 8], ['辛', 13], ['己', 30]],
    },
    // 渊海子平
    yuanhai: {
      寅: [['戊', 8], ['丙', 15], ['甲', 29]],
      卯: [['甲', 11], ['乙', 30]],
      辰: [['乙', 10], ['癸', 13], ['戊', 30]],
      巳: [['戊', 6], ['庚', 15], ['丙', 31]],
      午: [['丙', 11], ['己', 21], ['丁', 31]],
      未: [['丁', 10], ['乙', 13], ['己', 31]],
      申: [['己', 8], ['戊', 11], ['壬', 14], ['庚', 31]],
      酉: [['庚', 11], ['辛', 31]],
      戌: [['辛', 10], ['丁', 13], ['戊', 30]],
      亥: [['戊', 8], ['甲', 13], ['壬', 29]],
      子: [['壬', 11], ['癸', 29]],
      丑: [['癸', 10], ['辛', 13], ['己', 30]],
    },
    // 神峰通考
    shenfeng: {
      寅: [['戊', 8], ['丙', 15], ['甲', 29]],
      卯: [['甲', 11], ['乙', 30]],
      辰: [['乙', 10], ['癸', 13], ['戊', 30]],
      巳: [['戊', 8], ['庚', 15], ['丙', 31]],
      午: [['丙', 11], ['己', 18], ['丁', 31]],
      未: [['丁', 10], ['乙', 13], ['己', 31]],
      申: [['戊', 8], ['壬', 15], ['庚', 31]],
      酉: [['庚', 11], ['辛', 31]],
      戌: [['辛', 10], ['丁', 13], ['戊', 30]],
      亥: [['戊', 8], ['甲', 15], ['壬', 29]],
      子: [['壬', 11], ['癸', 29]],
      丑: [['癸', 10], ['辛', 13], ['己', 30]],
    },
    // 星平会海
    xingping: {
      寅: [['戊', 8], ['丙', 15], ['甲', 29]],
      卯: [['甲', 11], ['乙', 30]],
      辰: [['乙', 10], ['癸', 13], ['戊', 30]],
      巳: [['戊', 6], ['庚', 15], ['丙', 31]],
      午: [['丙', 11], ['己', 20], ['丁', 31]],
      未: [['丁', 10], ['乙', 12], ['己', 30]],
      申: [['己', 8], ['戊', 11], ['壬', 14], ['庚', 31]],
      酉: [['庚', 11], ['辛', 31]],
      戌: [['辛', 10], ['丁', 13], ['戊', 30]],
      亥: [['戊', 8], ['甲', 13], ['壬', 29]],
      子: [['壬', 11], ['癸', 29]],
      丑: [['癸', 10], ['辛', 13], ['己', 30]],
    },
    // 万育吾之法诀
    wanyuwu: {
      寅: [['己', 6], ['丙', 11], ['甲', 29]],
      卯: [['甲', 8], ['乙', 30]],
      辰: [['乙', 8], ['壬', 13], ['戊', 30]],
      巳: [['戊', 8], ['庚', 13], ['丙', 31]],
      午: [['丙', 8], ['丁', 31]],
      未: [['丁', 8], ['甲', 13], ['己', 31]],
      申: [['己', 6], ['壬', 11], ['庚', 31]],
      酉: [['庚', 8], ['辛', 31]],
      戌: [['辛', 8], ['丙', 13], ['戊', 30]],
      亥: [['戊', 6], ['甲', 11], ['壬', 29]],
      子: [['壬', 8], ['癸', 29]],
      丑: [['癸', 8], ['庚', 13], ['己', 30]],
    },
  };

  /**
   * 取某月支、距节天数 → 司令天干
   * @param mz 月支
   * @param days 距节天数（0 起）
   */
  function siling(mz, days) {
    var mode = load().silingMode || 'ziping';
    var tab = SILING[mode] || SILING.ziping;
    var segs = tab[mz];
    if (!segs) return '';
    for (var i = 0; i < segs.length; i++) {
      if (days <= segs[i][1]) return segs[i][0];
    }
    return segs.length ? segs[segs.length - 1][0] : '';
  }

  // ── ④ 格局取法 ──
  var GE_MAP = {
    '正官': '正官格', '七杀': '七杀格', '偏官': '七杀格',
    '正财': '正财格', '偏财': '偏财格',
    '正印': '正印格', '偏印': '偏印格',
    '食神': '食神格', '伤官': '伤官格',
    '比肩': '建禄格', '劫财': '月劫格'
  };

  /**
   * 判格局
   * @param pillars {year, month, day, hour}
   * @param tenGodFn 十神判定函数
   */
  function geju(pillars, tenGodFn) {
    var dg = (pillars.day || '')[0];
    var mz = (pillars.month || '')[1];
    if (!dg || !mz) return '';
    var cang = canggan(mz);
    if (!cang.length) return '';

    var mode = load().gejuMode || 'tougan';
    if (mode === 'mainqi') {
      // 月令主气直接取格
      return GE_MAP[tenGodFn(dg, cang[0])] || '';
    }
    // 月令透干取格：本气→中气→余气，第一个透干者
    var stems = [(pillars.year || '')[0], (pillars.month || '')[0],
                 (pillars.hour || '')[0]].filter(Boolean);
    for (var i = 0; i < cang.length; i++) {
      if (stems.indexOf(cang[i]) >= 0) {
        return GE_MAP[tenGodFn(dg, cang[i])] || '';
      }
    }
    return GE_MAP[tenGodFn(dg, cang[0])] || '';
  }

  // ── ⑤ 刑冲破害：开关 + 自定义规则 ──
  function showXingchong() { return load().showXingchong !== false; }

  function xcEnabled(type) {
    var r = load().xcRules || {};
    return r[type] !== false;
  }

  function xcWeight(type) {
    var w = load().xcWeight || {};
    return typeof w[type] === 'number' ? w[type] : 0;
  }

  // 三刑：子刑卯、卯刑子、寅刑巳、巳刑申、申刑寅、丑刑戌、戌刑未、未刑丑、辰辰/午午/酉酉/亥亥自刑
  var XING = {
    子: ['卯'], 卯: ['子'], 寅: ['巳', '申'], 巳: ['寅', '申'],
    申: ['寅', '巳'], 丑: ['戌', '未'], 戌: ['丑', '未'],
    未: ['丑', '戌'], 辰: ['辰'], 午: ['午'], 酉: ['酉'], 亥: ['亥']
  };

  function isXing(a, b) {
    var t = XING[a] || [];
    return t.indexOf(b) >= 0;
  }

  // ── ⑦ 自定义神煞 ──
  /** 新增一条自定义神煞
   * cfg = {name, from, to, note}
   *   from: 'dayGan' | 'yearGan' | 'monthZhi' | 'dayZhi' | 'hourZhi' | 'yearZhi'
   *   to:   'year' | 'month' | 'day' | 'hour' | 'all'   标注到哪柱
   *   note: 说明
   * 规则为「某干/支 → 目标柱地支等于某支时标注」
   */
  function addCustomShensha(cfg) {
    var list = (load().customShensha || []).slice();
    list.push(cfg);
    set('customShensha', list);
    return list;
  }

  function removeCustomShensha(name) {
    var list = (load().customShensha || []).filter(function (x) {
      return x.name !== name;
    });
    set('customShensha', list);
    return list;
  }

  /**
   * 应用自定义神煞
   * @param pillars {year,month,day,hour}
   * @returns {Array<Array<string>>} 四柱各自的神煞名
   */
  function applyCustomShensha(pillars) {
    var list = load().customShensha || [];
    var out = [[], [], [], []];
    if (!list.length) return out;
    var keys = ['year', 'month', 'day', 'hour'];
    list.forEach(function (cfg) {
      if (!cfg || !cfg.name) return;
      var src = cfg.from || 'dayGan';
      var srcChar = '';
      if (src === 'dayGan') srcChar = (pillars.day || '')[0];
      else if (src === 'yearGan') srcChar = (pillars.year || '')[0];
      else if (src === 'monthGan') srcChar = (pillars.month || '')[0];
      else if (src === 'hourGan') srcChar = (pillars.hour || '')[0];
      else if (src === 'monthZhi') srcChar = (pillars.month || '')[1];
      else if (src === 'dayZhi') srcChar = (pillars.day || '')[1];
      else if (src === 'yearZhi') srcChar = (pillars.year || '')[1];
      else if (src === 'hourZhi') srcChar = (pillars.hour || '')[1];
      if (!srcChar) return;
      // cfg.map: { '甲': ['丑','未'], '乙': ['子','申'], ... }
      var want = (cfg.map && cfg.map[srcChar]) || [];
      if (!want.length) return;
      var targets = cfg.to === 'all' ? keys : [cfg.to || 'day'];
      targets.forEach(function (tk) {
        var i = keys.indexOf(tk);
        if (i < 0) return;
        var tg = (pillars[tk] || '');
        var zhi = tg[1] || '';
        if (want.indexOf(zhi) >= 0 && out[i].indexOf(cfg.name) < 0) {
          out[i].push(cfg.name);
        }
        // 也支持匹配天干
        if (want.indexOf(tg[0]) >= 0 && out[i].indexOf(cfg.name) < 0) {
          out[i].push(cfg.name);
        }
      });
    });
    return out;
  }

  // ── ⑥ 命宫身宫：过中气换月 ──
  /**
   * 计算命宫 / 身宫实际使用的月支
   * @param monthZhi 原月支（按节）
   * @param passedZhongqi 是否已过本月的中气
   */
  function gongMonthZhi(monthZhi, passedZhongqi) {
    if (load().gongMode !== 'zhongqi') return monthZhi;
    if (!passedZhongqi) return monthZhi;
    var DZ = '子丑寅卯辰巳午未申酉戌亥';
    var i = DZ.indexOf(monthZhi);
    return i < 0 ? monthZhi : DZ[(i + 1) % 12];
  }

  // ── 说明文案 ──
  var DESC = {
    shenshaHidden: '隐藏神煞',
    cangganMode: '藏干流派',
    silingMode: '人元司令',
    gejuMode: '格局取法',
    showXingchong: '刑冲破害',
    gongMode: '命宫身宫'
  };

  global.bzSettings = {
    get: get, set: set, reset: reset, load: load, DEFAULTS: DEFAULTS,
    filterShensha: filterShensha,
    canggan: canggan,
    siling: siling,
    geju: geju,
    showXingchong: showXingchong,
    xcEnabled: xcEnabled,
    xcWeight: xcWeight,
    isXing: isXing,
    addCustomShensha: addCustomShensha,
    removeCustomShensha: removeCustomShensha,
    applyCustomShensha: applyCustomShensha,
    gongMonthZhi: gongMonthZhi,
    CANG_STD: CANG_STD,
    DESC: DESC,
    SILING_MODES: [
      { k: 'ziping', n: '子平真诠' }, { k: 'sanming', n: '三命通会' },
      { k: 'yuanhai', n: '渊海子平' }, { k: 'shenfeng', n: '神峰通考' },
      { k: 'xingping', n: '星平会海' }, { k: 'wanyuwu', n: '万育吾诀' }
    ],
    GEJU_MODES: [
      { k: 'tougan', n: '月令透干取格' }, { k: 'mainqi', n: '月令主气直接取格' }
    ],
    CANG_MODES: [
      { k: 'standard', n: '标准（本气优先）' }, { k: 'zhongqi', n: '中气优先' }
    ],
    GONG_MODES: [
      { k: 'benyue', n: '按本月' }, { k: 'zhongqi', n: '过中气换月' }
    ]
  };
})(window);
