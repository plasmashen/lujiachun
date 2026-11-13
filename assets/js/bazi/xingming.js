/**
 * 姓名学 —— 五格剖象法（熊崎健翁，1928）
 *
 * 三个关键点，都是靠查表而非公式：
 *
 * 1. 笔画必须用「康熙笔画」，不是简体笔画。
 *    万 = 15 画（非 3），学 = 16 画（非 8），华 = 14 画（非 6）。
 *    数据见 kangxi.js（13,123 字，CC BY 4.0）。
 *
 * 2. 三才吉凶必须查 125 条配置表，不能按五行生克推导。
 *    反例：木金水按生克规则是「一克一生」应为半吉，实际各家均判大凶。
 *    这张表编码的是几百年积累的判断，不是可推导的规则。
 *
 * 3. 三运（基础/成功/社交）必须查 75 条表。
 *    反例：木木、火火、土土都判吉，金金、水水都判凶，五者关系完全相同（比和）。
 *    同一个关系落在不同五行上结果不同，这是五行本性，不是生克规则。
 *
 * 依赖：kangxi.js、sancai125.js、yunshi75.js、shuli81.js
 */
(function (global) {
  'use strict';

  var K = global.bzKangxi;
  var SANCAI_TABLE = global.bzSancai125;
  var YUNSHI_TABLE = global.bzYunshi75;
  var SHULI_TABLE = global.bzShuli81;

  // ── 五格定义（熊崎健翁原法）──
  //
  // 单姓单名：天=姓+1  人=姓+名  地=名+1  外=2      总=姓+名
  // 单姓双名：天=姓+1  人=姓+名1 地=名1+名2 外=名2+1  总=全和
  // 复姓单名：天=姓1+姓2 人=姓2+名 地=名+1  外=姓1+1  总=全和
  // 复姓双名：天=姓1+姓2 人=姓2+名1 地=名1+名2 外=姓1+名2 总=全和
  //
  // 注意外格：复姓时外格不是「总-人+1」。原法里复姓单名的外格是「姓首字+1」，
  // 复姓双名是「姓首字+名末字」——这一点很多实现都写错了。

  var FUXING = ['欧阳', '太史', '端木', '上官', '司马', '东方', '独孤', '南宫', '万俟', '闻人',
    '夏侯', '诸葛', '尉迟', '公羊', '赫连', '澹台', '皇甫', '宗政', '濮阳', '公冶',
    '太叔', '申屠', '公孙', '慕容', '仲孙', '钟离', '长孙', '宇文', '司徒', '鲜于',
    '司空', '呼延', '令狐', '羊舌', '第五', '梁丘', '左丘', '东郭', '西门', '南荣',
    '公仪', '公乘', '公皙', '端木', '拓跋', '夹谷', '谷梁', '东门', '乐正'];

  // 数理五行（按末位数字）
  function numWuxing(n) {
    var d = n % 10;
    if (d === 1 || d === 2) return '木';
    if (d === 3 || d === 4) return '火';
    if (d === 5 || d === 6) return '土';
    if (d === 7 || d === 8) return '金';
    return '水';
  }

  var SHENG = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
  var KE = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };

  /** a 对 b 的关系（从 a 的角度） */
  function relOf(a, b) {
    if (a === b) return '同';
    if (SHENG[a] === b) return '生';
    if (SHENG[b] === a) return '被生';
    if (KE[a] === b) return '克';
    if (KE[b] === a) return '被克';
    return '';
  }

  /** a 看 b 的关系（三运用语：比和/生我/我生/我克/克我） */
  function wxRelation(me, other) {
    if (me === other) return '比和';
    if (SHENG[other] === me) return '生我';
    if (SHENG[me] === other) return '我生';
    if (KE[me] === other) return '我克';
    return '克我';
  }

  /** 查某字康熙笔画 */
  function strokes(ch) {
    if (!K) return null;
    return K.strokes(ch);
  }

  /** 拆分姓名，返回姓与名的字数组 */
  function splitName(name) {
    var chars = String(name || '').replace(/\s+/g, '').split('');
    if (chars.length < 2) return null;

    var head2 = chars.slice(0, 2).join('');
    var isFu = FUXING.indexOf(head2) >= 0 && chars.length >= 3;
    var xingCount = isFu ? 2 : 1;

    return {
      chars: chars,
      xing: chars.slice(0, xingCount),
      ming: chars.slice(xingCount),
      isFu: isFu
    };
  }

  /** 计算五格 */
  function wuge(name) {
    var sp = splitName(name);
    if (!sp) return null;

    var xingN = sp.xing.map(strokes);
    var mingN = sp.ming.map(strokes);

    // 有字查不到笔画
    var unknown = [];
    sp.chars.forEach(function (c, i) {
      var n = i < sp.xing.length ? xingN[i] : mingN[i - sp.xing.length];
      if (!n) unknown.push(c);
    });
    if (unknown.length) return { error: 'unknown', unknown: unknown, name: name };

    var xingSum = xingN.reduce(function (a, b) { return a + b; }, 0);
    var mingSum = mingN.reduce(function (a, b) { return a + b; }, 0);

    var tian, ren, di, wai, zong;

    // 天格：单姓 +1；复姓取两字和
    tian = sp.isFu ? (xingN[0] + xingN[1]) : (xingN[0] + 1);

    // 人格：姓末字 + 名首字
    ren = xingN[xingN.length - 1] + mingN[0];

    // 地格：单名 +1；双名取和
    di = mingN.length === 1 ? (mingN[0] + 1) : (mingN[0] + mingN[1]);

    // 总格：全部相加
    zong = xingSum + mingSum;

    // 外格（熊崎原法）
    if (!sp.isFu && mingN.length === 1) {
      wai = 2;                                  // 单姓单名
    } else if (!sp.isFu && mingN.length >= 2) {
      wai = mingN[mingN.length - 1] + 1;        // 单姓双名
    } else if (sp.isFu && mingN.length === 1) {
      wai = xingN[0] + 1;                       // 复姓单名
    } else {
      wai = xingN[0] + mingN[mingN.length - 1]; // 复姓双名
    }

    return {
      name: name,
      chars: sp.chars,
      xing: sp.xing,
      ming: sp.ming,
      isFu: sp.isFu,
      nums: { xing: xingN, ming: mingN },
      tian: tian, ren: ren, di: di, wai: wai, zong: zong,
      sum: zong
    };
  }

  // ── 数理吉凶（查 81 表，超 81 减 80）──
  function shuliEntry(n) {
    var k = n > 81 ? n - 80 : n;
    if (!SHULI_TABLE) return null;
    return SHULI_TABLE[String(k)] || null;
  }

  // ── 三才（查 125 表）──
  function sancai(tian, ren, di) {
    var wx = [numWuxing(tian), numWuxing(ren), numWuxing(di)];
    var combo = wx.join('');
    var entry = SANCAI_TABLE ? SANCAI_TABLE[combo] : null;

    return {
      combo: combo,
      wx: wx,
      tian_ren: relOf(wx[0], wx[1]),
      ren_di: relOf(wx[1], wx[2]),
      level: entry ? entry.level : '',
      text: entry ? entry.text : ''
    };
  }

  // ── 三运（查 75 表）──
  var YUNSHI_DEFS = [
    ['基础运', 'di', '人格与地格 —— 根基是否安稳，住所、健康、下属助力'],
    ['成功运', 'tian', '人格与天格 —— 上进是否顺遂，长上、家世、时势的助力'],
    ['社交运', 'wai', '人格与外格 —— 人际是否融洽，外在环境与他人对待']
  ];
  var YUNSHI_KEY = { '基础运': 'base', '成功运': 'succ', '社交运': 'soc' };

  function yunshi(g) {
    var renWx = numWuxing(g.ren);
    var out = [];

    YUNSHI_DEFS.forEach(function (d) {
      var name = d[0], key = d[1], basis = d[2];
      var otherWx = numWuxing(g[key]);
      var tblKey = YUNSHI_KEY[name] + '|' + renWx + '|' + otherWx;
      var entry = YUNSHI_TABLE ? YUNSHI_TABLE[tblKey] : null;

      out.push({
        name: name,
        basis: basis,
        combo: renWx + '/' + otherWx,
        relation: wxRelation(renWx, otherWx),
        level: entry ? entry.level : '',
        text: entry ? entry.text : ''
      });
    });

    return out;
  }

  // ── 五格角色 ──
  var GE_ROLE = {
    tian: { name: '天格', role: '祖运', note: '先天遗传、祖辈余荫。天格由姓氏决定，改不了，故不论吉凶。' },
    ren:  { name: '人格', role: '主运', note: '最关键的一格，看性格、能力与一生总运。人格五行即「主运五行」。' },
    di:   { name: '地格', role: '前运', note: '中年之前（约 36 岁前）的运势，也看家庭缘分。' },
    wai:  { name: '外格', role: '副运', note: '社交缘、外部助力与朋友关系。' },
    zong: { name: '总格', role: '后运', note: '中年之后（约 36 岁后）的运势，也看一生总格局。' }
  };

  // ── 主排盘 ──
  function paipan(name) {
    var w = wuge(name);
    if (!w) return null;
    if (w.error) return w;

    var ge = {};
    ['tian', 'ren', 'di', 'wai', 'zong'].forEach(function (k) {
      var n = w[k];
      var e = shuliEntry(n);
      ge[k] = {
        n: n,
        wx: numWuxing(n),
        level: e ? e.level : '',
        poem: e ? e.poem : '',
        text: e ? e.text : '',
        keywords: e ? e.keywords : '',
        name: GE_ROLE[k].name,
        role: GE_ROLE[k].role,
        note: GE_ROLE[k].note
      };
    });

    var sc = sancai(w.tian, w.ren, w.di);
    var ys = yunshi(w);

    return {
      name: name,
      chars: w.chars,
      xing: w.xing,
      ming: w.ming,
      isFu: w.isFu,
      nums: w.nums,
      raw: { tian: w.tian, ren: w.ren, di: w.di, wai: w.wai, zong: w.zong },
      ge: ge,
      sancai: sc,
      yunshi: ys
    };
  }

  global.bzXingming = {
    paipan: paipan,
    wuge: wuge,
    sancai: sancai,
    yunshi: yunshi,
    shuliEntry: shuliEntry,
    numWuxing: numWuxing,
    relOf: relOf,
    wxRelation: wxRelation,
    strokes: strokes,
    splitName: splitName,
    GE_ROLE: GE_ROLE,
    FUXING: FUXING,
    ready: function () {
      return !!(K && SANCAI_TABLE && YUNSHI_TABLE && SHULI_TABLE);
    }
  };
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
