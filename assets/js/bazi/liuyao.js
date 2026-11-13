/**
 * 六爻（纳甲筮法）—— 起卦、装卦、断卦
 *
 * 规则依据：京房纳甲 + 《卜筮正宗》通行法
 *
 * 核心流程：
 *   摇卦（6 次）→ 本卦 / 变卦 → 纳甲（装干支）→ 安世应 → 定六亲
 *   → 配六神 → 找旬空 → 判旺衰 → 按用神断吉凶
 *
 * 说明：六爻的「断卦」没有唯一答案，各家取舍不同。
 * 这里实现的是最通行的一路：以世爻代表自己、动爻为变、
 * 用神按所问之事取（父母/兄弟/子孙/妻财/官鬼）。
 */
(function (global) {
  'use strict';

  // ── 八卦 ──
  // 三爻自下而上，1=阳 0=阴
  var TRIGRAMS = {
    '111': { name: '乾', sym: '☰', nature: '天', wx: '金', num: 1, gua: '乾' },
    '110': { name: '兑', sym: '☱', nature: '泽', wx: '金', num: 2, gua: '兑' },
    '101': { name: '离', sym: '☲', nature: '火', wx: '火', num: 3, gua: '离' },
    '100': { name: '震', sym: '☳', nature: '雷', wx: '木', num: 4, gua: '震' },
    '011': { name: '巽', sym: '☴', nature: '风', wx: '木', num: 5, gua: '巽' },
    '010': { name: '坎', sym: '☵', nature: '水', wx: '水', num: 6, gua: '坎' },
    '001': { name: '艮', sym: '☶', nature: '山', wx: '土', num: 7, gua: '艮' },
    '000': { name: '坤', sym: '☷', nature: '地', wx: '土', num: 8, gua: '坤' }
  };

  // 先天八卦序（用于梅花易数）：乾一 兑二 离三 震四 巽五 坎六 艮七 坤八
  var XIANTIAN = ['乾', '兑', '离', '震', '巽', '坎', '艮', '坤'];

  // ── 六十四卦名 ──
  // key = 下卦名 + 上卦名
  var GUA64 = {
    '乾乾': '乾为天', '坤坤': '坤为地', '坎震': '水雷屯', '艮坎': '山水蒙',
    '坎乾': '水天需', '乾坎': '天水讼', '坤坎': '地水师', '坎坤': '水地比',
    '巽乾': '风天小畜', '乾兑': '天泽履', '坤乾': '地天泰', '乾坤': '天地否',
    '乾离': '天火同人', '离乾': '火天大有', '坤艮': '地山谦', '震坤': '雷地豫',
    '兑震': '泽雷随', '艮巽': '山风蛊', '坤兑': '地泽临', '巽坤': '风地观',
    '离震': '火雷噬嗑', '艮离': '山火贲', '艮坤': '山地剥', '坤震': '地雷复',
    '震乾': '天雷无妄', '艮乾': '山天大畜', '艮震': '山雷颐', '兑巽': '泽风大过',
    '坎坎': '坎为水', '离离': '离为火', '兑艮': '泽山咸', '震巽': '雷风恒',
    '乾艮': '天山遁', '震乾2': '雷天大壮', '离坤': '火地晋', '坤离': '地火明夷',
    '离巽': '风火家人', '震兑': '雷泽归妹', '离艮': '火水未济' /* placeholder */,
    '坎离': '水火既济'
  };

  // 更可靠：用上下卦索引查表（京房八宫卦序）
  // 上卦 order: 乾兑离震巽坎艮坤, 下卦同
  var GUA_TABLE = [
    // 下卦乾（8 个，上卦从乾到坤）
    ['乾为天', '天泽履', '天火同人', '天雷无妄', '天风姤', '天水讼', '天山遁', '天地否'],
    // 下卦兑
    ['泽天夬', '兑为泽', '泽火革', '泽雷随', '泽风大过', '泽水困', '泽山咸', '泽地萃'],
    // 下卦离
    ['火天大有', '火泽睽', '离为火', '火雷噬嗑', '火风鼎', '火水未济', '火山旅', '火地晋'],
    // 下卦震
    ['雷天大壮', '雷泽归妹', '雷火丰', '震为雷', '雷风恒', '雷水解', '雷山小过', '雷地豫'],
    // 下卦巽
    ['风天小畜', '风泽中孚', '风火家人', '风雷益', '巽为风', '风水涣', '风山渐', '风地观'],
    // 下卦坎
    ['水天需', '水泽节', '水火既济', '水雷屯', '水风井', '坎为水', '水山蹇', '水地比'],
    // 下卦艮
    ['山天大畜', '山泽损', '山火贲', '山雷颐', '山风蛊', '山水蒙', '艮为山', '山地剥'],
    // 下卦坤
    ['地天泰', '地泽临', '地火明夷', '地雷复', '地风升', '地水师', '地山谦', '坤为地']
  ];
  var TRIGRAM_ORDER = ['乾', '兑', '离', '震', '巽', '坎', '艮', '坤'];

  // ── 京房纳甲 ──
  // 内卦（下三爻）与外卦（上三爻）各配干支
  // [内卦起点干, 内卦起点支] / [外卦起点干, 外卦起点支]
  var NAJIA = {
    '乾': { inner: ['甲', '子'], outer: ['壬', '午'] },
    '坤': { inner: ['乙', '未'], outer: ['癸', '丑'] },
    '震': { inner: ['庚', '子'], outer: ['庚', '午'] },
    '巽': { inner: ['辛', '丑'], outer: ['辛', '未'] },
    '坎': { inner: ['戊', '寅'], outer: ['戊', '申'] },
    '离': { inner: ['己', '卯'], outer: ['己', '酉'] },
    '艮': { inner: ['丙', '辰'], outer: ['丙', '戌'] },
    '兑': { inner: ['丁', '巳'], outer: ['丁', '亥'] }
  };

  // 天干顺行 / 地支顺行（阳卦顺、阴卦逆）
  var GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  var ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

  // 阳卦：乾震坎艮；阴卦：坤巽离兑
  function isYangTrigram(name) {
    return ['乾', '震', '坎', '艮'].indexOf(name) >= 0;
  }

  /**
   * 装纳甲：给六爻配干支
   *
   * 规则（京房纳甲，阳卦顺行隔位、阴卦逆行隔位）：
   *   乾：内 甲子 甲寅 甲辰 / 外 壬午 壬申 壬戌
   *   坤：内 乙未 乙巳 乙卯 / 外 癸丑 癸亥 癸酉   （逆行隔位）
   *   震：庚子 庚寅 庚辰 / 庚午 庚申 庚戌
   *   巽：辛丑 辛亥 辛酉 / 辛未 辛巳 辛卯       （逆行隔位）
   *   坎：戊寅 戊辰 戊午 / 戊申 戊戌 戊子
   *   离：己卯 己丑 己亥 / 己酉 己未 己巳       （逆行隔位）
   *   艮：丙辰 丙午 丙申 / 丙戌 丙子 丙寅
   *   兑：丁巳 丁卯 丁丑 / 丁亥 丁酉 丁未       （逆行隔位）
   *
   * 注意：乾震坎艮阳卦，天干不变、地支顺行隔一位；
   *       坤巽离兑阴卦，天干不变、地支逆行隔一位。
   */
  var NAJIA_TABLE = {
    '乾': { gan: ['甲', '壬'], zhi: [0, 2, 4, 6, 8, 10], dir: 1 },      // 子寅辰午申戌
    '坤': { gan: ['乙', '癸'], zhi: [7, 5, 3, 1, 11, 9], dir: -1 },     // 未巳卯丑亥酉
    '震': { gan: ['庚', '庚'], zhi: [0, 2, 4, 6, 8, 10], dir: 1 },
    '巽': { gan: ['辛', '辛'], zhi: [1, 11, 9, 7, 5, 3], dir: -1 },     // 丑亥酉未巳卯
    '坎': { gan: ['戊', '戊'], zhi: [2, 4, 6, 8, 10, 0], dir: 1 },      // 寅辰午申戌子
    '离': { gan: ['己', '己'], zhi: [3, 1, 11, 9, 7, 5], dir: -1 },     // 卯丑亥酉未巳
    '艮': { gan: ['丙', '丙'], zhi: [4, 6, 8, 10, 0, 2], dir: 1 },      // 辰午申戌子寅
    '兑': { gan: ['丁', '丁'], zhi: [5, 3, 1, 11, 9, 7], dir: -1 }      // 巳卯丑亥酉未
  };

  function najia(lower, upper) {
    var out = [];
    // 下卦三爻取表的前 3 位，上卦取后 3 位
    var t = NAJIA_TABLE[lower];
    for (var i = 0; i < 3; i++) {
      out.push({ gan: t.gan[0], zhi: ZHI[t.zhi[i]] });
    }
    var u = NAJIA_TABLE[upper];
    for (var k = 3; k < 6; k++) {
      out.push({ gan: u.gan[1], zhi: ZHI[u.zhi[k]] });
    }
    return out;
  }

  // ── 五行 ──
  var GAN_WX = { '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水' };
  var ZHI_WX = { '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火', '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水' };

  var SHENG = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
  var KE = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };

  /** 地支五行 */
  function zhiWx(z) { return ZHI_WX[z] || ''; }
  function ganWx(g) { return GAN_WX[g] || ''; }

  /**
   * 六亲：以卦宫五行为「我」，判断各爻与我的关系
   * @param palaceWx 卦宫五行
   * @param yaoWx 该爻地支五行
   */
  function liuqin(palaceWx, yaoWx) {
    if (palaceWx === yaoWx) return '兄弟';
    if (SHENG[yaoWx] === palaceWx) return '父母';   // 生我者父母
    if (SHENG[palaceWx] === yaoWx) return '子孙';   // 我生者子孙
    if (KE[yaoWx] === palaceWx) return '官鬼';      // 克我者官鬼
    if (KE[palaceWx] === yaoWx) return '妻财';      // 我克者妻财
    return '';
  }

  // ── 八宫卦序（定卦宫与世应）──
  // 每个宫 8 卦：本宫、一世、二世、三世、四世、五世、游魂、归魂
  // 世爻位置：本宫=6, 一世=1, 二世=2, 三世=3, 四世=4, 五世=5, 游魂=4, 归魂=3
  var GONG_ORDER = {
    '乾': ['乾为天', '天风姤', '天山遁', '天地否', '风地观', '山地剥', '火地晋', '火天大有'],
    '坎': ['坎为水', '水泽节', '水雷屯', '水火既济', '泽火革', '雷火丰', '地火明夷', '地水师'],
    '艮': ['艮为山', '山火贲', '山天大畜', '山泽损', '火泽睽', '天泽履', '风泽中孚', '风山渐'],
    '震': ['震为雷', '雷地豫', '雷水解', '雷风恒', '地风升', '水风井', '泽风大过', '泽雷随'],
    '巽': ['巽为风', '风天小畜', '风火家人', '风雷益', '天雷无妄', '火雷噬嗑', '山雷颐', '山风蛊'],
    '离': ['离为火', '火山旅', '火风鼎', '火水未济', '山水蒙', '风水涣', '天水讼', '天火同人'],
    '坤': ['坤为地', '地雷复', '地泽临', '地天泰', '雷天大壮', '泽天夬', '水天需', '水地比'],
    '兑': ['兑为泽', '泽水困', '泽地萃', '泽山咸', '水山蹇', '地山谦', '雷山小过', '雷泽归妹']
  };

  var GONG_WX = { '乾': '金', '坎': '水', '艮': '土', '震': '木', '巽': '木', '离': '火', '坤': '土', '兑': '金' };

  // 世爻位置（第 1~8 位对应）
  var SHI_POS = [6, 1, 2, 3, 4, 5, 4, 3];

  /** 查卦所属宫、世爻位、应爻位 */
  function findPalace(guaName) {
    for (var gong in GONG_ORDER) {
      var idx = GONG_ORDER[gong].indexOf(guaName);
      if (idx >= 0) {
        var shi = SHI_POS[idx];
        var ying = shi <= 3 ? shi + 3 : shi - 3;
        return {
          palace: gong, palaceWx: GONG_WX[gong],
          shi: shi, ying: ying,
          type: ['本宫', '一世', '二世', '三世', '四世', '五世', '游魂', '归魂'][idx]
        };
      }
    }
    return null;
  }

  // ── 六神（按日干起）──
  var LIUSHEN = ['青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武'];
  var LIUSHEN_START = {
    '甲': 0, '乙': 0, '丙': 1, '丁': 1, '戊': 2,
    '己': 3, '庚': 4, '辛': 4, '壬': 5, '癸': 5
  };

  function liushen(dayGan) {
    var s = LIUSHEN_START[dayGan] || 0;
    var out = [];
    // 自下而上配六神
    for (var i = 0; i < 6; i++) out.push(LIUSHEN[(s + i) % 6]);
    return out;
  }

  // ── 旬空 ──
  /**
   * 旬空：六十甲子分六旬，每旬 10 天配 12 地支，余下 2 支为空亡。
   * 求法：找到该日所属旬的首日（甲x），从首日地支数到第 11、12 位。
   */
  /**
   * 六十甲子序号：解 n ≡ gi (mod 10) 且 n ≡ zi (mod 12)
   * 必须先得到序号，才能知道落在哪一旬。
   */
  function jiaziIndex(gan, zhi) {
    var gi = GAN.indexOf(gan), zi = ZHI.indexOf(zhi);
    if (gi < 0 || zi < 0) return -1;
    for (var n = 0; n < 60; n++) {
      if (n % 10 === gi && n % 12 === zi) return n;
    }
    return -1;
  }

  function xunkong(gan, zhi) {
    var n = jiaziIndex(gan, zhi);
    if (n < 0) return ['', ''];
    // 旬首 = 序号向下取整到 10 的倍数（甲子/甲戌/甲申/甲午/甲辰/甲寅）
    var headIdx = n - (n % 10);
    var headZhi = headIdx % 12;
    // 该旬未配到的两支 = 旬首地支 +10、+11
    var k1 = ZHI[(headZhi + 10) % 12];
    var k2 = ZHI[(headZhi + 11) % 12];
    return [k1, k2];
  }

  // ── 卦象 ──
  /**
   * 由六爻阴阳数组求上下卦
   * @param yao [0|1] × 6，自下而上
   */
  function splitTrigrams(yao) {
    // TRIGRAMS 的键按「上爻在上」书写，如乾=111、巽=011、震=100
    // yao[0] 是初爻（最下），所以键要从上往下拼
    // TRIGRAMS 的键是「自下而上」书写：乾=111、巽=011、震=100
    var lowerKey = '' + yao[0] + yao[1] + yao[2];
    var upperKey = '' + yao[3] + yao[4] + yao[5];
    var lower = TRIGRAMS[lowerKey];
    var upper = TRIGRAMS[upperKey];
    if (!lower || !upper) return null;
    // 表结构：GUA_TABLE[上卦索引][下卦索引]
    // 验证：GUA_TABLE[0] 全以「天」开头 = 上卦恒为乾，下卦从乾到坤
    var ln = TRIGRAM_ORDER.indexOf(lower.name);
    var un = TRIGRAM_ORDER.indexOf(upper.name);
    return {
      lower: lower, upper: upper,
      name: GUA_TABLE[un][ln]
    };
  }

  // ── 摇卦 ──
  /**
   * 模拟摇三枚钱：3 正=老阳(9)，2正=少阴(8)，1正=少阳(7)，0正=老阴(6)
   * 传统记法：背为阳
   * @returns {num, yao, changing, label}
   */
  function toss() {
    var backs = 0;
    for (var i = 0; i < 3; i++) if (Math.random() < 0.5) backs++;
    // 3 背=老阳（动），2 背=少阴，1 背=少阳，0 背=老阴（动）
    var map = {
      0: { num: 6, yao: 0, changing: true, label: '老阴 ⚏' },
      1: { num: 7, yao: 1, changing: false, label: '少阳 ⚊' },
      2: { num: 8, yao: 0, changing: false, label: '少阴 ⚋' },
      3: { num: 9, yao: 1, changing: true, label: '老阳 ⚌' }
    };
    var r = map[backs];
    return { num: r.num, yao: r.yao, changing: r.changing, label: r.label, backs: backs };
  }

  /**
   * 完整起卦 + 装卦
   * @param opt {yaos:[6 个数], dayGan, dayZhi, question}
   *   yaos 可选，不传则随机摇
   */
  function divinate(opt) {
    opt = opt || {};
    var yaos = opt.yaos || [];
    var tosses = [];
    if (yaos.length === 6) {
      // 用户传入数值
      yaos.forEach(function (n) {
        var map = {
          6: { num: 6, yao: 0, changing: true, label: '老阴' },
          7: { num: 7, yao: 1, changing: false, label: '少阳' },
          8: { num: 8, yao: 0, changing: false, label: '少阴' },
          9: { num: 9, yao: 1, changing: true, label: '老阳' }
        };
        tosses.push(map[n] || map[7]);
      });
    } else {
      for (var i = 0; i < 6; i++) tosses.push(toss());
    }

    var benYao = tosses.map(function (t) { return t.yao; });
    var changed = tosses.map(function (t) { return t.changing ? (t.yao ? 0 : 1) : t.yao; });
    var hasChange = tosses.some(function (t) { return t.changing; });

    var ben = splitTrigrams(benYao);
    var bian = hasChange ? splitTrigrams(changed) : null;

    if (!ben) return null;

    // 装纳甲
    var benNajia = najia(ben.lower.name, ben.upper.name);
    var bianNajia = bian ? najia(bian.lower.name, bian.upper.name) : null;

    var palace = findPalace(ben.name);
    if (!palace) return null;

    var dayGan = opt.dayGan || '甲';
    var dayZhi = opt.dayZhi || '子';
    var shen = liushen(dayGan);
    var kong = xunkong(dayGan, dayZhi);

    // 组装六爻详情（自下而上）
    var lines = tosses.map(function (t, i) {
      var nj = benNajia[i];
      var wx = zhiWx(nj.zhi);
      var bianLine = null;
      if (bian && bianNajia) {
        var bw = zhiWx(bianNajia[i].zhi);
        bianLine = {
          gan: bianNajia[i].gan, zhi: bianNajia[i].zhi, wx: bw,
          liuqin: liuqin(palace.palaceWx, bw),
          kong: kong.indexOf(bianNajia[i].zhi) >= 0
        };
      }
      return {
        pos: i + 1,
        yao: t.yao, num: t.num, changing: t.changing, label: t.label,
        gan: nj.gan, zhi: nj.zhi, wx: wx,
        liuqin: liuqin(palace.palaceWx, wx),
        liushen: shen[i],
        shi: palace.shi === i + 1,
        ying: palace.ying === i + 1,
        kong: kong.indexOf(nj.zhi) >= 0,
        bian: bianLine
      };
    });

    // 变卦的六爻（六亲按变卦所属宫重算）
    var bianLines = null;
    if (bian && bianNajia) {
      var bpalace = findPalace(bian.name) || palace;
      bianLines = bianNajia.map(function (nj, i) {
        var wx = zhiWx(nj.zhi);
        return {
          pos: i + 1,
          yao: changed[i],
          gan: nj.gan, zhi: nj.zhi, wx: wx,
          liuqin: liuqin(bpalace.palaceWx, wx),
          liushen: shen[i],
          shi: bpalace.shi === i + 1,
          ying: bpalace.ying === i + 1,
          kong: kong.indexOf(nj.zhi) >= 0
        };
      });
    }

    // 动爻
    var moving = lines.filter(function (l) { return l.changing; }).map(function (l) { return l.pos; });

    return {
      tosses: tosses,
      ben: { name: ben.name, lower: ben.lower, upper: ben.upper, yao: benYao },
      bian: bian ? { name: bian.name, lower: bian.lower, upper: bian.upper, yao: changed } : null,
      hasChange: hasChange,
      palace: palace,
      lines: lines,
      bianLines: bianLines,
      bianPalace: bian ? (findPalace(bian.name) || palace) : null,
      moving: moving,
      kong: kong,
      dayGan: dayGan, dayZhi: dayZhi,
      question: opt.question || ''
    };
  }

  // ── 用神 ──
  // 按所问之事取用神
  var YONGSHEN_MAP = {
    '财运': '妻财', '事业': '官鬼', '感情': '妻财', '婚姻': '官鬼',
    '考试': '父母', '文书': '父母', '房子': '父母', '长辈': '父母',
    '健康': '子孙', '子女': '子孙', '平安': '子孙', '宠物': '子孙',
    '兄弟': '兄弟', '朋友': '兄弟', '竞争': '兄弟',
    '出行': '世爻', '寻物': '妻财', '诉讼': '官鬼', '求职': '官鬼'
  };

  function pickYongshen(question) {
    if (!question) return null;
    for (var k in YONGSHEN_MAP) {
      if (question.indexOf(k) >= 0) return YONGSHEN_MAP[k];
    }
    return null;
  }

  // ── 旺衰 ──
  // 以月建、日辰判断各爻旺衰（简化通行法）
  function strength(line, monthZhi, dayZhi) {
    var wx = line.wx;
    var mWx = zhiWx(monthZhi);
    var dWx = zhiWx(dayZhi);
    var score = 0;
    var notes = [];

    // 月建
    if (wx === mWx) { score += 3; notes.push('临月建'); }
    else if (SHENG[mWx] === wx) { score += 2; notes.push('月生'); }
    else if (KE[mWx] === wx) { score -= 2; notes.push('月克'); }
    else if (SHENG[wx] === mWx) { score -= 1; notes.push('月泄'); }
    else if (KE[wx] === mWx) { score += 1; notes.push('月耗我力'); }

    // 日辰
    if (wx === dWx) { score += 2; notes.push('临日辰'); }
    else if (SHENG[dWx] === wx) { score += 1; notes.push('日生'); }
    else if (KE[dWx] === wx) { score -= 1; notes.push('日克'); }

    if (line.kong) { score -= 2; notes.push('旬空'); }
    if (line.changing) { score += 1; notes.push('发动'); }

    var level = score >= 4 ? '旺' : score >= 2 ? '偏旺' : score >= -1 ? '平' : score >= -3 ? '偏弱' : '弱';
    return { score: score, level: level, notes: notes };
  }

  global.bzLiuyao = {
    TRIGRAMS: TRIGRAMS, GUA_TABLE: GUA_TABLE, LIUSHEN: LIUSHEN,
    najia: najia, liuqin: liuqin, findPalace: findPalace,
    liushen: liushen, xunkong: xunkong, toss: toss,
    divinate: divinate, splitTrigrams: splitTrigrams,
    pickYongshen: pickYongshen, strength: strength,
    zhiWx: zhiWx, ganWx: ganWx, kong: xunkong, jiaziIndex: jiaziIndex
  };
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
