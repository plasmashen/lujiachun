/**
 * 数字命理（Numerology）+ 姓名学（五格剖象）
 *
 * 数字命理：毕达哥拉斯体系，把生日/姓名折算成 1-9 与主数 11/22/33
 * 姓名学：五格剖象法（天格/人格/地格/外格/总格），以繁体笔画为准
 */
(function (global) {
  'use strict';

  // ── 数字命理 ──

  /** 数字根：反复相加直到 1-9（保留主数 11/22/33） */
  function digitalRoot(n, keepMaster) {
    keepMaster = keepMaster !== false;
    while (n > 9) {
      if (keepMaster && (n === 11 || n === 22 || n === 33)) return n;
      var s = 0;
      while (n > 0) { s += n % 10; n = Math.floor(n / 10); }
      n = s;
    }
    return n;
  }

  /** 字母 → 数字（毕达哥拉斯表） */
  var LETTER = {
    A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9,
    J: 1, K: 2, L: 3, M: 4, N: 5, O: 6, P: 7, Q: 8, R: 9,
    S: 1, T: 2, U: 3, V: 4, W: 5, X: 6, Y: 7, Z: 8
  };
  var VOWELS = 'AEIOU';

  /**
   * 生命灵数（Life Path）——最核心的数字
   * @param y,m,d 生日
   */
  function lifePath(y, m, d) {
    var a = digitalRoot(y, false);
    var b = digitalRoot(m, false);
    var c = digitalRoot(d, false);
    var sum = a + b + c;
    return { value: digitalRoot(sum), parts: [a, b, c] };
  }

  /** 生日数（Birth Day Number） */
  function birthDay(d) {
    return digitalRoot(d);
  }

  /** 成熟数（Maturity）= 生命灵数 + 表达数 */
  function maturity(lp, expr) {
    return digitalRoot(lp + expr);
  }

  /** 姓名数字（表达数/灵魂数/人格数） */
  function nameNumbers(name) {
    var up = String(name || '').toUpperCase().replace(/[^A-Z]/g, '');
    if (!up) return null;
    var total = 0, vowels = 0, consonants = 0;
    for (var i = 0; i < up.length; i++) {
      var v = LETTER[up[i]] || 0;
      total += v;
      if (VOWELS.indexOf(up[i]) >= 0) vowels += v;
      else consonants += v;
    }
    return {
      expression: digitalRoot(total),      // 表达数（全部字母）
      soul: digitalRoot(vowels),           // 灵魂数（元音）
      personality: digitalRoot(consonants), // 人格数（辅音）
      total: total,
      letters: up.length
    };
  }

  /** 个人年（Personal Year） */
  function personalYear(y, m, d, currentYear) {
    var a = digitalRoot(currentYear, false);
    var b = digitalRoot(m, false);
    var c = digitalRoot(d, false);
    return digitalRoot(a + b + c);
  }

  // 数字含义
  var NUM_MEAN = {
    1: { kw: '开创 · 独立', desc: '你天生是起头的人。要的是自己做主、自己开路。弱点是不容易合作，也不容易承认需要别人。' },
    2: { kw: '协调 · 共处', desc: '你的力量在关系里。能感知别人的需要，善于让事情平顺。代价是容易委屈自己。' },
    3: { kw: '表达 · 创造', desc: '你靠表达活着——说、写、演、做。有感染力，但容易散，落不了地。' },
    4: { kw: '建构 · 踏实', desc: '你适合把事做扎实。可靠、有秩序，但容易固执，不喜欢计划被打乱。' },
    5: { kw: '自由 · 变化', desc: '你需要空间和新鲜感。适应力强，但也容易半途换方向。' },
    6: { kw: '承担 · 照顾', desc: '你天然会照顾人，责任感重。要注意的是别把别人的事都背在自己身上。' },
    7: { kw: '探究 · 独处', desc: '你要的是想明白。喜欢深挖，需要独处，不容易被表面说服。' },
    8: { kw: '实现 · 掌控', desc: '你对结果有强需求，擅长把资源变成成果。要小心的是把价值全押在成就上。' },
    9: { kw: '包容 · 完成', desc: '你看得见更大的图景，有慈悲心。功课是学会放下，而不是什么都扛。' },
    11: { kw: '直觉 · 启发', desc: '主数 11（2 的强化）。感受力极强，容易接收别人没说的东西，也容易被这些压到。', master: true },
    22: { kw: '建造 · 落地', desc: '主数 22（4 的强化）。能把宏大的想法真正盖起来，但要扛得住压力。', master: true },
    33: { kw: '奉献 · 疗愈', desc: '主数 33（6 的强化）。极少出现，指向为他人承担与治疗性的天赋。', master: true }
  };

  // ── 姓名学（五格剖象）──
  // 常用字笔画（简体→繁体笔画，取常用者）
  var STROKES = {
    '王':4,'李':7,'张':11,'刘':15,'陈':16,'杨':13,'黄':12,'赵':14,'周':8,'吴':7,
    '徐':10,'孙':10,'马':10,'朱':6,'胡':11,'郭':15,'何':7,'高':10,'林':8,'罗':20,
    '郑':19,'梁':11,'谢':17,'宋':7,'唐':10,'许':11,'韩':17,'冯':12,'邓':19,'曹':11,
    '彭':12,'曾':12,'萧':18,'田':5,'董':15,'袁':10,'潘':16,'于':3,'蒋':17,'蔡':17,
    '余':7,'杜':7,'叶':15,'程':12,'苏':22,'魏':18,'吕':7,'丁':2,'任':6,'沈':8,
    '姚':9,'卢':16,'姜':9,'崔':11,'钟':17,'谭':19,'陆':16,'汪':8,'范':11,'金':8,
    '石':5,'廖':14,'贾':13,'夏':10,'韦':9,'付':5,'方':4,'邹':17,'熊':14,'白':5,
    '孟':8,'秦':10,'邱':12,'侯':9,'江':7,'尹':4,'薛':19,'闫':12,'段':9,'雷':13,
    '黎':15,'史':5,'龙':16,'陶':16,'贺':12,'顾':21,'毛':4,'郝':14,'龚':22,'邵':12,
    '万':15,'钱':16,'严':20,'覃':18,'武':8,'戴':18,'莫':13,'孔':4,'向':6,'汤':13,
    '明':8,'文':4,'华':14,'建':9,'国':11,'志':7,'伟':11,'强':11,'磊':15,'军':9,
    '洋':10,'勇':9,'艳':24,'杰':12,'娟':10,'涛':18,'超':12,'霞':17,'平':5,'刚':10,
    '桂':10,'英':11,'红':9,'玲':10,'芳':10,'燕':16,'秀':7,'兰':23,'云':12,'梅':11,
    '娜':10,'静':16,'敏':11,'丽':19,'婷':12,'雪':11,'琳':13,'晶':12,'欣':8,'怡':9,
    '佳':8,'嘉':14,'宇':6,'浩':11,'轩':10,'睿':14,'哲':10,'晨':11,'阳':17,'天':4,
    '子':3,'一':1,'三':3,'小':3,'大':3,'中':4,'山':3,'水':4,'木':4,'火':4,
    '土':3,'日':4,'月':4,'风':9,'雨':8,'雷':13,'电':13,'春':9,'秋':9,'冬':5,
    '男':7,'女':3,'人':2,'心':4,'手':4,'口':3,'目':5,'耳':6,'足':7,'身':7,
    '生':5,'死':6,'老':6,'少':4,'长':8,'短':12,'高':10,'低':7,'多':6,'少':4,
    '冷':7,'热':15,'新':13,'旧':5,'美':9,'丑':4,'好':6,'坏':7,'真':10,'假':11,
    '善':12,'恶':12,'是':9,'非':8,'有':6,'无':12,'来':8,'去':5,'进':15,'退':13,
    '开':12,'关':19,'上':3,'下':3,'左':5,'右':5,'前':9,'后':6,'内':4,'外':5,
    '出':5,'入':2,'飞':9,'走':7,'跑':12,'站':10,'坐':7,'睡':13,'醒':16,'吃':6
  };

  /** 取笔画，未知字返回 null */
  function stroke(ch) {
    return STROKES[ch] || null;
  }

  /**
   * 五格计算
   * @param surname 姓（1-2 字）
   * @param given 名（1-2 字）
   */
  function fiveGrids(surname, given) {
    var s = String(surname || '').split('');
    var g = String(given || '').split('');
    if (!s.length || !g.length) return null;

    var ss = s.map(stroke);
    var gs = g.map(stroke);
    var unknown = [];
    s.forEach(function (ch, i) { if (ss[i] == null) unknown.push(ch); });
    g.forEach(function (ch, i) { if (gs[i] == null) unknown.push(ch); });

    // 未知字按 10 估算并记录
    ss = ss.map(function (v) { return v == null ? 10 : v; });
    gs = gs.map(function (v) { return v == null ? 10 : v; });

    var sum = function (a) { return a.reduce(function (x, y) { return x + y; }, 0); };

    var tian, ren, di, wai, zong;

    if (s.length === 1) {
      tian = ss[0] + 1;                    // 单姓：天格 = 姓笔画 + 1
    } else {
      tian = ss[0] + ss[1];
    }

    // 人格：姓的最后一字 + 名的第一字
    ren = ss[ss.length - 1] + gs[0];

    // 地格：名的笔画和（单名 +1）
    if (g.length === 1) {
      di = gs[0] + 1;
    } else {
      di = sum(gs);
    }

    // 外格：总格 - 人格
    zong = sum(ss) + sum(gs);
    wai = zong - ren;
    // 单姓单名时外格为 2（虚位），不为 0
    if (wai === 0) wai = 2;

    // 三才（天地人五行）
    var WX = ['', '木', '木', '火', '火', '土', '土', '金', '金', '水', '水'];
    function gridWx(n) {
      var r = n % 10;
      return WX[r === 0 ? 10 : r];
    }

    return {
      tian: tian, ren: ren, di: di, wai: wai, zong: zong,
      tianWx: gridWx(tian), renWx: gridWx(ren), diWx: gridWx(di),
      waiWx: gridWx(wai), zongWx: gridWx(zong),
      unknown: unknown,
      strokes: { surname: ss, given: gs }
    };
  }

  // 81 数理吉凶（常用简表）
  var GRID_LUCK = {
    1:'大吉', 2:'凶', 3:'大吉', 4:'凶', 5:'大吉', 6:'大吉', 7:'吉', 8:'吉',
    9:'凶', 10:'凶', 11:'大吉', 12:'凶', 13:'大吉', 14:'凶', 15:'大吉', 16:'大吉',
    17:'吉', 18:'吉', 19:'凶', 20:'凶', 21:'大吉', 22:'凶', 23:'大吉', 24:'大吉',
    25:'吉', 26:'凶', 27:'半吉', 28:'凶', 29:'吉', 30:'半吉', 31:'大吉', 32:'大吉',
    33:'大吉', 34:'凶', 35:'吉', 36:'凶', 37:'大吉', 38:'半吉', 39:'大吉', 40:'凶',
    41:'大吉', 42:'半吉', 43:'凶', 44:'凶', 45:'大吉', 46:'凶', 47:'大吉', 48:'大吉',
    49:'凶', 50:'凶', 51:'半吉', 52:'大吉', 53:'凶', 54:'凶', 55:'半吉', 56:'凶',
    57:'吉', 58:'半吉', 59:'凶', 60:'凶', 61:'吉', 62:'凶', 63:'大吉', 64:'凶',
    65:'大吉', 66:'凶', 67:'大吉', 68:'大吉', 69:'凶', 70:'凶', 71:'半吉', 72:'凶',
    73:'吉', 74:'凶', 75:'半吉', 76:'凶', 77:'半吉', 78:'半吉', 79:'凶', 80:'凶', 81:'大吉'
  };

  function gridLuck(n) {
    var r = ((n - 1) % 81) + 1;
    return GRID_LUCK[r] || '—';
  }

  global.bzNumerology = {
    digitalRoot: digitalRoot,
    lifePath: lifePath,
    birthDay: birthDay,
    maturity: maturity,
    nameNumbers: nameNumbers,
    personalYear: personalYear,
    NUM_MEAN: NUM_MEAN
  };

  global.bzNaming = {
    STROKES: STROKES,
    stroke: stroke,
    fiveGrids: fiveGrids,
    gridLuck: gridLuck,
    GRID_LUCK: GRID_LUCK
  };
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
