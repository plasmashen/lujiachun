/**
 * 八字合盘 —— 七维深度分析
 *
 * 传统合婚不是「看看生肖合不合」，而是一套有层次的判断体系。
 * 按《三命通会》《渊海子平》《子平真诠》的通行看法，权重从高到低：
 *
 *   ① 夫妻宫（日支）互动   权重最高 —— 日支是配偶的座位，合冲决定相处底色
 *   ② 日主（日干）关系     次高   —— 两人核心性格的五行关系
 *   ③ 五行互补             高     —— 一方缺的，另一方能不能补
 *   ④ 十神互看             中     —— 对方在我盘里是什么角色
 *   ⑤ 跨盘地支互动         加减项 —— 四柱八支两两之间的合冲刑害
 *   ⑥ 年柱根基             轻     —— 家庭背景与成长节奏
 *   ⑦ 配偶星状态           参考   —— 男看财星，女看官杀
 *
 * 每一步都给出「为什么」——只说合或不合没有意义，
 * 要说清是哪个字跟哪个字、形成了什么关系、会带来什么倾向。
 */
(function (global) {
  'use strict';

  var WX_ORDER = ['木', '火', '土', '金', '水'];

  var GAN_WX = {
    甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土',
    庚: '金', 辛: '金', 壬: '水', 癸: '水'
  };
  var ZHI_WX = {
    子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火',
    午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水'
  };

  // ── 地支关系表 ──
  var CHONG = {
    子: '午', 丑: '未', 寅: '申', 卯: '酉', 辰: '戌', 巳: '亥',
    午: '子', 未: '丑', 申: '寅', 酉: '卯', 戌: '辰', 亥: '巳'
  };
  var LIUHE = {
    子: '丑', 丑: '子', 寅: '亥', 亥: '寅', 卯: '戌', 戌: '卯',
    辰: '酉', 酉: '辰', 巳: '申', 申: '巳', 午: '未', 未: '午'
  };
  var HAI = {
    子: '未', 未: '子', 丑: '午', 午: '丑', 寅: '巳', 巳: '寅',
    卯: '辰', 辰: '卯', 申: '亥', 亥: '申', 酉: '戌', 戌: '酉'
  };

  // 六合化气
  var LIUHE_HUA = {
    '子丑': '土', '寅亥': '木', '卯戌': '火',
    '辰酉': '金', '巳申': '水', '午未': '土'
  };

  // 三合局
  var SANHE = [
    { zhi: ['申', '子', '辰'], wx: '水', name: '申子辰' },
    { zhi: ['亥', '卯', '未'], wx: '木', name: '亥卯未' },
    { zhi: ['寅', '午', '戌'], wx: '火', name: '寅午戌' },
    { zhi: ['巳', '酉', '丑'], wx: '金', name: '巳酉丑' }
  ];

  // 三会方局
  var SANHUI = [
    { zhi: ['寅', '卯', '辰'], wx: '木', name: '寅卯辰', dir: '东方' },
    { zhi: ['巳', '午', '未'], wx: '火', name: '巳午未', dir: '南方' },
    { zhi: ['申', '酉', '戌'], wx: '金', name: '申酉戌', dir: '西方' },
    { zhi: ['亥', '子', '丑'], wx: '水', name: '亥子丑', dir: '北方' }
  ];

  // 三刑（《三命通会·论三刑》）
  var XING_SETS = [
    { zhi: ['寅', '巳', '申'], name: '寅巳申', type: '无恩之刑',
      desc: '恃强凌弱、忘恩负义之象，三人以上易生牵连' },
    { zhi: ['丑', '戌', '未'], name: '丑戌未', type: '恃势之刑',
      desc: '仗势欺人之象，多因利益与立场起争执' },
    { zhi: ['子', '卯'], name: '子卯', type: '无礼之刑',
      desc: '礼数不周、界限不清之象，多因越界生嫌隙' }
  ];
  // 自刑
  var ZIXING = ['辰', '午', '酉', '亥'];

  // 天干五合（合化）
  var GANHE = {
    甲: '己', 己: '甲', 乙: '庚', 庚: '乙', 丙: '辛', 辛: '丙',
    丁: '壬', 壬: '丁', 戊: '癸', 癸: '戊'
  };
  var GANHE_HUA = {
    '甲己': '土', '乙庚': '金', '丙辛': '水', '丁壬': '木', '戊癸': '火'
  };
  // 天干相冲
  var GANCHONG = { 甲: '庚', 庚: '甲', 乙: '辛', 辛: '乙', 丙: '壬', 壬: '丙', 丁: '癸', 癸: '丁' };

  var SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
  var KE = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };

  function wxOfGan(g) { return GAN_WX[g] || ''; }
  function wxOfZhi(z) { return ZHI_WX[z] || ''; }
  function yinYang(gan) { return '甲丙戊庚壬'.indexOf(gan) >= 0 ? '阳' : '阴'; }

  /** 以 me 为日主，看 other 是什么十神 */
  function tenGod(me, other) {
    var mw = wxOfGan(me), ow = wxOfGan(other);
    if (!mw || !ow) return '';
    var same = yinYang(me) === yinYang(other);
    if (ow === mw) return same ? '比肩' : '劫财';
    if (SHENG[mw] === ow) return same ? '食神' : '伤官';
    if (KE[mw] === ow) return same ? '偏财' : '正财';
    if (KE[ow] === mw) return same ? '七杀' : '正官';
    if (SHENG[ow] === mw) return same ? '偏印' : '正印';
    return '';
  }

  /** 十神归类 */
  function godGroup(g) {
    if (!g) return '';
    if (g === '比肩' || g === '劫财') return '比劫';
    if (g === '食神' || g === '伤官') return '食伤';
    if (g === '正财' || g === '偏财') return '财星';
    if (g === '正官' || g === '七杀') return '官杀';
    return '印星';
  }

  // ── 地支成对关系判定 ──
  /**
   * 返回 a、b 两个地支之间的所有关系
   * @returns {Array} [{type, level, name, note}]
   */
  function zhiRelation(a, b) {
    var out = [];
    if (!a || !b) return out;

    // 六合
    if (LIUHE[a] === b) {
      var key = [a, b].sort().join('');
      var hua = LIUHE_HUA[[a, b].join('')] || LIUHE_HUA[key] || '';
      out.push({
        type: 'liuhe', level: 'good',
        name: a + b + '六合',
        note: hua ? '六合化' + hua + '，两气相吸，天然亲近' : '六合，两气相吸'
      });
    }

    // 三合（半合 / 拱合）
    SANHE.forEach(function (g) {
      var hasA = g.zhi.indexOf(a) >= 0, hasB = g.zhi.indexOf(b) >= 0;
      if (hasA && hasB && a !== b) {
        var third = g.zhi.filter(function (z) { return z !== a && z !== b; })[0];
        out.push({
          type: 'sanhe', level: 'good',
          name: a + b + '半合' + g.wx,
          note: '三合' + g.name + '缺' + third + '，半合成' + g.wx + '局，有共同目标与默契'
        });
      }
    });

    // 三会（只算两字相邻的半会）
    SANHUI.forEach(function (g) {
      var ia = g.zhi.indexOf(a), ib = g.zhi.indexOf(b);
      if (ia >= 0 && ib >= 0 && Math.abs(ia - ib) === 1) {
        out.push({
          type: 'sanhui', level: 'good',
          name: a + b + '半会' + g.wx,
          note: '三会' + g.dir + g.wx + '局的一部分，同方位之气，立场与节奏相近'
        });
      }
    });

    // 冲
    if (CHONG[a] === b) {
      out.push({
        type: 'chong', level: 'warn',
        name: a + b + '相冲',
        note: '正面对冲，观念与节奏差异明显，需主动磨合'
      });
    }

    // 害
    if (HAI[a] === b) {
      out.push({
        type: 'hai', level: 'warn',
        name: a + b + '相害',
        note: '暗损之象，表面无事但心里易积怨，宜把话说明'
      });
    }

    // 刑
    XING_SETS.forEach(function (s) {
      if (s.zhi.indexOf(a) >= 0 && s.zhi.indexOf(b) >= 0 && a !== b) {
        out.push({
          type: 'xing', level: 'warn',
          name: a + b + '相刑（' + s.type + '）',
          note: s.desc
        });
      }
    });
    if (a === b && ZIXING.indexOf(a) >= 0) {
      out.push({
        type: 'zixing', level: 'info',
        name: a + a + '自刑',
        note: '同气过盛而自伤，两人同类易互相消耗，宜留出各自空间'
      });
    }

    // 同支
    if (a === b && ZIXING.indexOf(a) < 0) {
      out.push({
        type: 'same', level: 'info',
        name: '同为' + a,
        note: '性情相近、容易共鸣，但缺少互补的张力'
      });
    }

    return out;
  }

  // ── 五行能量（复用主引擎）──
  function energyOf(p) {
    if (typeof bzEnergy !== 'undefined' && bzEnergy.compute) {
      try { return bzEnergy.compute(p); } catch (e) {}
    }
    return null;
  }

  /** 从命盘取出五行百分比 */
  function wuxingPct(p, e) {
    var out = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };

    // ① 优先用 paipan 输出的 wuxingScore（与八字页雷达图同一套数据）
    var sc = p && p.wuxingScore;
    if (sc) {
      var t0 = 0;
      WX_ORDER.forEach(function (w) { t0 += (sc[w] || 0); });
      if (t0 > 0) {
        WX_ORDER.forEach(function (w) {
          out[w] = Math.round((sc[w] || 0) / t0 * 100);
        });
        return out;
      }
    }

    // ② 其次用能量引擎的 raw
    if (e && e.raw) {
      var tot = 0;
      WX_ORDER.forEach(function (w) { tot += (e.raw[w] || 0); });
      if (tot > 0) {
        WX_ORDER.forEach(function (w) {
          out[w] = Math.round((e.raw[w] || 0) / tot * 100);
        });
        return out;
      }
    }

    // ③ 兜底：按干支计数
    var gz = (p && p.pillars) || {};
    var cnt = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 }, n = 0;
    ['year', 'month', 'day', 'hour'].forEach(function (k) {
      var s = gz[k] || '';
      if (s.length < 2) return;
      var a = wxOfGan(s[0]), b = wxOfZhi(s[1]);
      if (a) { cnt[a]++; n++; }
      if (b) { cnt[b]++; n++; }
    });
    if (n) WX_ORDER.forEach(function (w) { out[w] = Math.round(cnt[w] / n * 100); });
    return out;
  }

  /** 日主强弱 → 喜用方向（简化：身弱喜印比，身旺喜食伤财官） */
  function xiYong(e) {
    if (!e || typeof e.tongPct !== 'number') return null;
    var strong = e.tongPct >= 55;
    var weak = e.tongPct < 45;
    var dm = e.dayMasterWuxing;
    if (!dm) return null;

    var yin = null;
    WX_ORDER.forEach(function (w) { if (SHENG[w] === dm) yin = w; });
    var bi = dm;
    var shi = SHENG[dm];
    var cai = KE[dm];
    var guan = null;
    WX_ORDER.forEach(function (w) { if (KE[w] === dm) guan = w; });

    if (weak) {
      return {
        strong: false,
        level: e.level,
        favor: [yin, bi],
        favorNames: ['印（' + yin + '）', '比劫（' + bi + '）'],
        avoid: [cai, guan, shi],
        note: '身弱，喜印比生扶，忌财官食伤耗泄'
      };
    }
    if (strong) {
      return {
        strong: true,
        level: e.level,
        favor: [shi, cai, guan],
        favorNames: ['食伤（' + shi + '）', '财（' + cai + '）', '官杀（' + guan + '）'],
        avoid: [yin, bi],
        note: '身旺，喜食伤财官泄耗，忌印比再来帮身'
      };
    }
    return {
      strong: null,
      level: e.level,
      favor: [],
      favorNames: [],
      avoid: [],
      note: '中和之局，喜忌不明显，行运引动才见偏向'
    };
  }

  // ── 维度一：夫妻宫（日支）──
  function dimFuqi(a, b) {
    var az = (a.pillars.day || '')[1];
    var bz = (b.pillars.day || '')[1];
    var rels = zhiRelation(az, bz);
    var score = 15, lines = [], level = 'info';

    var good = rels.filter(function (r) { return r.level === 'good'; });
    var warn = rels.filter(function (r) { return r.level === 'warn'; });

    if (rels.length === 0) {
      // 无直接关系，看五行
      var wa = wxOfZhi(az), wb = wxOfZhi(bz);
      if (wa === wb) {
        score = 15;
        lines.push(az + '与' + bz + '同属' + wa + '，夫妻宫同气——性情接近、节奏一致，但少了互补的推力');
        lines.push('这类组合相处省心，长期容易变成「搭子」式关系，需要刻意制造新鲜感');
      } else if (SHENG[wa] === wb) {
        score = 20;
        lines.push('夫妻宫' + az + '(' + wa + ')生' + bz + '(' + wb + ')，气顺——一方自然滋养另一方');
        lines.push('付出较多的一方容易长期做「照顾者」，注意别累积成委屈');
      } else if (SHENG[wb] === wa) {
        score = 20;
        lines.push('夫妻宫' + bz + '(' + wb + ')生' + az + '(' + wa + ')，气顺——对方自然滋养你');
      } else if (KE[wa] === wb) {
        score = 12;
        lines.push('夫妻宫' + az + '(' + wa + ')克' + bz + '(' + wb + ')，有压制感——一方习惯主导');
        lines.push('克不是坏事，但要有意识地轮换决策权，否则容易一方长期压抑');
      } else if (KE[wb] === wa) {
        score = 12;
        lines.push('夫妻宫' + bz + '(' + wb + ')克' + az + '(' + wa + ')，对方主导性强，需留意边界');
      }
      level = score >= 18 ? 'good' : 'info';
    } else {
      rels.forEach(function (r) {
        lines.push(r.name + '：' + r.note);
        if (r.type === 'liuhe') { score += 18; level = 'good'; }
        else if (r.type === 'sanhe') { score += 14; if (level !== 'good') level = 'good'; }
        else if (r.type === 'sanhui') { score += 12; if (level !== 'good') level = 'good'; }
        else if (r.type === 'chong') { score -= 14; level = 'warn'; }
        else if (r.type === 'xing') { score -= 10; if (level !== 'warn') level = 'warn'; }
        else if (r.type === 'hai') { score -= 7; if (level !== 'warn') level = 'warn'; }
        else if (r.type === 'same') { score += 2; }
        else if (r.type === 'zixing') { score -= 5; }
      });
    }

    score = Math.max(0, Math.min(30, score));
    return {
      key: 'fuqi', name: '夫妻宫', weight: 30, score: score, full: 30,
      level: level, abbr: az + '·' + bz,
      lines: lines,
      role: '日支是配偶的位置。两人日支的关系，是合盘里权重最高的一项。'
    };
  }

  // ── 维度二：日主（日干）关系 ──
  function dimRizhu(a, b) {
    var ag = (a.pillars.day || '')[0];
    var bg = (b.pillars.day || '')[0];
    var wa = wxOfGan(ag), wb = wxOfGan(bg);
    var lines = [], score = 15, level = 'info';

    // 天干五合（最高优先）
    if (GANHE[ag] === bg) {
      var k = [ag, bg].sort().join('');
      var hua = GANHE_HUA[k] || GANHE_HUA[ag + bg] || '';
      score = 28; level = 'good';
      lines.push('日干' + ag + '与' + bg + '天干五合' + (hua ? '化' + hua : ''));
      lines.push('这是日主层面的直接吸引——不用解释就觉得合拍，价值观容易自动对齐');
      // 天地鸳鸯合
      var az = (a.pillars.day || '')[1], bz = (b.pillars.day || '')[1];
      if (LIUHE[az] === bz) {
        score = 30;
        lines.push('日支' + az + '与' + bz + '又六合——天合地合，古称「鸳鸯合」，两层都咬得上');
        lines.push('这种组合很少见，吸引力强、默契度高，但也容易因为太顺而缺少必要的摩擦与成长');
      }
      lines.push('注意：五合不等于没问题，合而化什么，决定两人在一起会朝哪个方向走');
    } else if (GANCHONG[ag] === bg) {
      score = 8; level = 'warn';
      lines.push('日干' + ag + '与' + bg + '相冲（' + ag + bg + '冲）');
      lines.push('核心性格的正面冲突——不是观念不同，是反应的底层方式不同，容易话赶话');
      lines.push('冲也代表强烈吸引，很多「一见就火花四溅」的关系属于这一类，关键在能不能收住');
    } else if (wa === wb) {
      score = 16; level = 'info';
      lines.push('两人日主同属' + wa + '（' + ag + '、' + bg + '），比和之象');
      lines.push('同类相处像照镜子——理解快、共鸣强，但盲区也一样，容易一起犯同一个错');
      if (ag !== bg) lines.push('阴阳不同（' + yinYang(ag) + 'vs' + yinYang(bg) + '），恰好互补了刚柔');
    } else if (SHENG[wa] === wb) {
      score = 22; level = 'good';
      lines.push('甲方日主' + wa + '生乙方日主' + wb + '，相生之象');
      lines.push('甲方在这段关系里偏「给予方」——提供资源、情绪与推动力');
      lines.push('长期单向输出会累，乙方需要有意识地回馈，否则关系会失衡');
    } else if (SHENG[wb] === wa) {
      score = 22; level = 'good';
      lines.push('乙方日主' + wb + '生甲方日主' + wa + '，相生之象');
      lines.push('乙方在这段关系里偏「给予方」，甲方容易习惯被照顾');
    } else if (KE[wa] === wb) {
      score = 10; level = 'warn';
      lines.push('甲方日主' + wa + '克乙方日主' + wb + '，相克之象');
      lines.push('甲方在关系中容易处于主导位，说话更有分量——不是故意的，是气场使然');
      lines.push('要警惕「我是为你好」变成压制，乙方也要敢于表达不同意见');
    } else if (KE[wb] === wa) {
      score = 10; level = 'warn';
      lines.push('乙方日主' + wb + '克甲方日主' + wa + '，相克之象');
      lines.push('乙方气场更强，甲方容易在不知不觉中让步');
    }

    return {
      key: 'rizhu', name: '日主关系', weight: 30, score: score, full: 30,
      level: level, abbr: ag + '·' + bg,
      lines: lines,
      role: '日干代表本人。两人日干的五行关系，是性格与沟通底色的根本。'
    };
  }

  // ── 维度三：五行互补 ──
  function dimWuxing(a, b) {
    var ea = energyOf(a), eb = energyOf(b);
    var pa = wuxingPct(a, ea), pb = wuxingPct(b, eb);
    var lines = [], score = 0;

    var DEF = 8;    // 低于此算缺
    var RICH = 25;  // 高于此算旺

    var lackA = [], lackB = [], richA = [], richB = [];
    WX_ORDER.forEach(function (w) {
      if (pa[w] <= DEF) lackA.push(w);
      if (pb[w] <= DEF) lackB.push(w);
      if (pa[w] >= RICH) richA.push(w);
      if (pb[w] >= RICH) richB.push(w);
    });

    // 情形一：都不缺
    if (!lackA.length && !lackB.length) {
      lines.push('两人五行分布都算均衡，没有明显缺口');
      lines.push('这种情况互补的空间不大，但「不互补」不等于不好——各自完整的关系依赖更少、更平等');
      score = 14;
    } else {
      // ① 甲缺的，乙能不能补
      var fillA = lackA.filter(function (w) { return pb[w] >= 18; });
      // ② 乙缺的，甲能不能补
      var fillB = lackB.filter(function (w) { return pa[w] >= 18; });
      // ③ 双方同缺
      var bothLack = lackA.filter(function (w) { return lackB.indexOf(w) >= 0; });

      if (lackA.length) {
        lines.push('甲方缺 ' + lackA.map(function (w) { return w + ' ' + pa[w] + '%'; }).join('、'));
      }
      if (lackB.length) {
        lines.push('乙方缺 ' + lackB.map(function (w) { return w + ' ' + pb[w] + '%'; }).join('、'));
      }

      if (bothLack.length) {
        lines.push('　双方同缺 ' + bothLack.join('、') +
          ' —— 这一块谁都补不了谁，反而容易在同一件事上同时失衡');
        lines.push('　同缺不是坏事：你们对这方面的敏感度一致，能理解对方的窘迫，但也缺少一个能兜底的人');
        score -= bothLack.length * 2;
      }

      var onlyA = lackA.filter(function (w) { return bothLack.indexOf(w) < 0; });
      var onlyB = lackB.filter(function (w) { return bothLack.indexOf(w) < 0; });

      if (onlyA.length) {
        if (fillA.length) {
          score += fillA.length * 6;
          lines.push('　→ 甲方缺的 ' + fillA.join('、') + '，乙方充足（' +
            fillA.map(function (w) { return pb[w] + '%'; }).join('/') + '）—— 补得上');
          lines.push('　甲在乙身边会感觉「顺」，这种感觉通常体现在具体的事上，不一定是性格');
        }
        var restA = onlyA.filter(function (w) { return fillA.indexOf(w) < 0; });
        if (restA.length) {
          lines.push('　→ 甲方还缺 ' + restA.join('、') + '，乙方补不足（' +
            restA.map(function (w) { return pb[w] + '%'; }).join('/') + '），需靠自身或外部环境');
        }
      }
      if (onlyB.length) {
        if (fillB.length) {
          score += fillB.length * 6;
          lines.push('　→ 乙方缺的 ' + fillB.join('、') + '，甲方充足（' +
            fillB.map(function (w) { return pa[w] + '%'; }).join('/') + '）—— 补得上');
          lines.push('　乙在甲身边会感觉「顺」');
        }
        var restB = onlyB.filter(function (w) { return fillB.indexOf(w) < 0; });
        if (restB.length) {
          lines.push('　→ 乙方还缺 ' + restB.join('、') + '，甲方补不足（' +
            restB.map(function (w) { return pa[w] + '%'; }).join('/') + '）');
        }
      }

      if (fillA.length && fillB.length) {
        lines.push('　双向互补 —— 各补各的缺口，这是合盘里最实际的一种助力');
        score += 4;
      } else if (!fillA.length && !fillB.length && (onlyA.length || onlyB.length)) {
        lines.push('　单向或零向互补 —— 缺口对不上，两人更像「并肩」而不是「互补」');
        score += 3;
      }
    }

    // 过旺相撞
    var clash = richA.filter(function (w) { return richB.indexOf(w) >= 0; });
    if (clash.length) {
      score -= clash.length * 3;
      lines.push('两人都' + clash.map(function (w) {
        return w + '（甲 ' + pa[w] + '% / 乙 ' + pb[w] + '%）';
      }).join('、') + ' 过旺 —— 同一股力量叠加');
      lines.push('这类组合在顺境里势不可挡，在逆境里容易一起失控，需要一个外部视角拉住');
    }

    // 用神互补（更精准）
    var xa = xiYong(ea), xb = xiYong(eb);
    if (xa && xb && xa.favor && xb.favor) {
      var aNeed = xa.favor.filter(function (w) { return pb[w] >= 18; });
      var bNeed = xb.favor.filter(function (w) { return pa[w] >= 18; });
      if (aNeed.length && bNeed.length) {
        score += 8;
        lines.push('用神层面：甲' + xa.level + '，喜 ' + xa.favorNames.join('、') +
          '，乙正好提供 ' + aNeed.join('、'));
        lines.push('　　　　　乙' + xb.level + '，喜 ' + xb.favorNames.join('、') +
          '，甲正好提供 ' + bNeed.join('、'));
        lines.push('互为用神 —— 这是比单纯五行互补更深一层的加持，双向都受益');
      } else if (aNeed.length || bNeed.length) {
        score += 3;
        if (aNeed.length) {
          lines.push('乙提供的 ' + aNeed.join('、') + ' 正是甲的用神（甲' + xa.level + '）—— 甲得助');
        } else {
          lines.push('甲提供的 ' + bNeed.join('、') + ' 正是乙的用神（乙' + xb.level + '）—— 乙得助');
        }
        lines.push('单向加持 —— 受助方舒服，付出方要留意长期消耗');
      } else {
        lines.push('两人的用神在对方盘里都不突出（甲' + xa.level + '、乙' + xb.level + '）');
        lines.push('彼此的短板对不上对方的用神，需各自在本命与行运里找补');
      }
    }

    score = Math.max(0, Math.min(25, score));
    return {
      key: 'wuxing', name: '五行互补', weight: 25, score: score, full: 25,
      level: score >= 17 ? 'good' : score >= 9 ? 'info' : 'warn',
      abbr: '甲缺' + (lackA.join('') || '—') + ' 乙缺' + (lackB.join('') || '—'),
      lines: lines,
      role: '一方缺的五行，另一方能不能补。这是合盘里最实际的一项。',
      pct: { a: pa, b: pb },
      lack: { a: lackA, b: lackB }
    };
  }

  // ── 维度四：十神互看 ──
  function dimShishen(a, b) {
    var ag = (a.pillars.day || '')[0];
    var bg = (b.pillars.day || '')[0];
    var lines = [], score = 8;

    // 甲看乙是什么，乙看甲是什么
    var aSeeB = tenGod(ag, bg);
    var bSeeA = tenGod(bg, ag);
    var aGroup = godGroup(aSeeB), bGroup = godGroup(bSeeA);

    lines.push('以甲方日主' + ag + '看乙方日主' + bg + '，是「' + aSeeB + '」（' + aGroup + '）');
    lines.push('以乙方日主' + bg + '看甲方日主' + ag + '，是「' + bSeeA + '」（' + bGroup + '）');

    var GOD_NOTE = {
      '正财': '正财是「我克而阴阳相异」——对方在你眼里是值得珍惜、愿意经营的对象；男命妻星正是此位',
      '偏财': '偏财是「我克而同性」——吸引强烈但偏向激情与新鲜感，稳定性弱于正财',
      '正官': '正官是「克我而阴阳相异」——对方在你眼里有约束力与引导感，女命夫星正是此位',
      '七杀': '七杀是「克我而同性」——压力感强，也会激发斗志，关系里权力味道较重',
      '正印': '正印是「生我而阴阳相异」——对方给你安全感与包容，像长辈或靠山',
      '偏印': '偏印是「生我而同性」——关心但方式有点别扭，理解需要时间',
      '食神': '食神是「我生而阴阳相异」——对方带来的是一种放松、享受与表达',
      '伤官': '伤官是「我生而同性」——对方让你想表现、想征服，也容易起口角',
      '比肩': '比肩是「同我同性」——平辈感强，像战友或兄弟，缺少暧昧张力',
      '劫财': '劫财是「同我异性」——亲近但带竞争，容易在资源与注意力上较劲'
    };
    if (GOD_NOTE[aSeeB]) lines.push('甲方视角：' + GOD_NOTE[aSeeB]);
    if (GOD_NOTE[bSeeA]) lines.push('乙方视角：' + GOD_NOTE[bSeeA]);

    // 打分
    var GOOD = { 正财: 6, 正官: 6, 正印: 5, 食神: 4 };
    var MID = { 偏财: 3, 七杀: 2, 偏印: 2, 伤官: 1, 比肩: 1 };
    var BAD = { 劫财: -2 };
    score += (GOOD[aSeeB] || MID[aSeeB] || BAD[aSeeB] || 0);
    score += (GOOD[bSeeA] || MID[bSeeA] || BAD[bSeeA] || 0);

    // 互为正财/正官（最典型的好配置）
    if ((aSeeB === '正财' && bSeeA === '正官') || (aSeeB === '正官' && bSeeA === '正财')) {
      score += 4;
      lines.push('一方见正财、一方见正官——互为「配偶星」，传统合婚里最被认可的一对组合');
    }
    // 互为用神星
    if (aSeeB === '正印' || bSeeA === '正印') {
      lines.push('印星互见，安全感足，但也要小心一方过度依赖');
    }

    score = Math.max(0, Math.min(15, score));
    return {
      key: 'shishen', name: '十神互看', weight: 15, score: score, full: 15,
      level: score >= 12 ? 'good' : score >= 7 ? 'info' : 'warn',
      abbr: aSeeB + '／' + bSeeA,
      lines: lines,
      role: '把对方的日干放到你的日主下面看，是什么十神——决定你下意识怎么定位对方。'
    };
  }

  // ── 维度五：跨盘地支互动 ──
  function dimCross(a, b) {
    var KA = ['year', 'month', 'day', 'hour'], NM = ['年', '月', '日', '时'];
    var gzA = a.pillars || {}, gzB = b.pillars || {};
    var raw = [], score = 0;

    for (var i = 0; i < 4; i++) {
      var za = (gzA[KA[i]] || '')[1];
      if (!za) continue;
      for (var j = 0; j < 4; j++) {
        var zb = (gzB[KA[j]] || '')[1];
        if (!zb) continue;
        // 夫妻宫单独算过，这里跳过避免重复计分
        if (i === 2 && j === 2) continue;

        var rels = zhiRelation(za, zb);
        rels.forEach(function (r) {
          if (r.type === 'same') return;
          raw.push({
            pos: '甲' + NM[i] + za + '·乙' + NM[j] + zb,
            pair: za + zb,
            name: r.name, note: r.note, level: r.level, type: r.type
          });
        });
      }
    }

    // 聚合：同一对地支（如 午未）多处出现，合并成一条并标注次数
    // 相刑是无向关系（子卯 = 卯子），需按无向键合并
    var grouped = {}, order = [];
    raw.forEach(function (h) {
      var pairKey = (h.type === 'xing' || h.type === 'chong' || h.type === 'hai' ||
                     h.type === 'liuhe' || h.type === 'same')
        ? [h.pair[0], h.pair[1]].sort().join('')
        : h.pair;   // 半合/半会有方向（缺哪一字不同），保留原样
      var k = h.type + '|' + pairKey;
      if (!grouped[k]) {
        grouped[k] = { name: h.name, note: h.note, level: h.level, type: h.type,
                       pair: pairKey, count: 0, poss: [] };
        order.push(k);
      }
      grouped[k].count++;
      if (grouped[k].poss.length < 3) grouped[k].poss.push(h.pos);
    });

    var hits = order.map(function (k) { return grouped[k]; });

    // 计分：同一对地支只算一次
    hits.forEach(function (h) {
      if (h.type === 'liuhe') score += 3;
      else if (h.type === 'sanhe' || h.type === 'sanhui') score += 2;
      else if (h.type === 'chong') score -= 3;
      else if (h.type === 'xing') score -= 2;
      else if (h.type === 'hai') score -= 1;
    });

    var lines = [];
    if (!hits.length) {
      lines.push('两张盘除夫妻宫外没有明显的地支互动——关系相对独立，各自空间大');
      lines.push('这类组合不容易被对方拖累，但也需要主动创造共同议题');
      score = 0;
    } else {
      var good = hits.filter(function (h) { return h.level === 'good'; });
      var warn = hits.filter(function (h) { return h.level === 'warn'; });

      function fmt(h) {
        var cn = h.count > 1 ? '（' + h.count + ' 处）' : '';
        return h.name + cn + '　' + h.poss.join('、');
      }

      if (good.length) {
        lines.push('相合 ' + good.length + ' 组：');
        good.slice(0, 6).forEach(function (h) { lines.push('　' + fmt(h)); });
        if (good.length > 6) lines.push('　……另有 ' + (good.length - 6) + ' 组');
      }
      if (warn.length) {
        lines.push('相冲刑害 ' + warn.length + ' 组：');
        warn.slice(0, 6).forEach(function (h) { lines.push('　' + fmt(h)); });
        if (warn.length > 6) lines.push('　……另有 ' + (warn.length - 6) + ' 组');
      }
      lines.push('四柱八支里没有一张盘是纯合或纯冲的——合多则容易靠近，冲刑多则摩擦点密');
    }

    score = Math.max(-15, Math.min(15, score));
    return {
      key: 'cross', name: '跨盘地支', weight: 15, score: score, full: 15,
      level: score > 3 ? 'good' : score < -3 ? 'warn' : 'info',
      abbr: (hits.filter(function(h){return h.level==='good';}).length) + '合 ' +
            (hits.filter(function(h){return h.level==='warn';}).length) + '冲刑',
      lines: lines,
      role: '两盘四柱八支两两之间全部的合冲刑害。加分项也是扣分项，用来微调。',
      hits: hits
    };
  }

  // ── 维度六：年柱根基 ──
  function dimYear(a, b) {
    var ay = (a.pillars.year || '')[1], by = (b.pillars.year || '')[1];
    var lines = [], score = 5;
    if (!ay || !by) return null;

    var SHENGXIAO = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
    var ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    var sxA = SHENGXIAO[ZHI.indexOf(ay)], sxB = SHENGXIAO[ZHI.indexOf(by)];

    var rels = zhiRelation(ay, by);
    lines.push('甲方属' + sxA + '（' + ay + '），乙方属' + sxB + '（' + by + '）');

    if (!rels.length) {
      lines.push('年支无直接关系——生肖配对本就不是合婚的主要依据，这一层只影响初印象');
      score = 5;
    } else {
      // 只取最强的一种关系计分，避免「六合 + 半会」同一股气重复加分
      var W = { liuhe: 4, sanhe: 3, sanhui: 2, same: 1, hai: -1, xing: -2, chong: -3, zixing: -1 };
      var strongest = null, bestAbs = 0;
      rels.forEach(function (r) {
        lines.push(r.name + '：' + r.note);
        var w = W[r.type] || 0;
        if (Math.abs(w) > Math.abs(bestAbs)) { bestAbs = w; strongest = r; }
      });
      if (strongest) {
        score += bestAbs;
        if (rels.length > 1) {
          lines.push('（年支同时见' + rels.length + '重关系，按最强的一项计分，避免同一股气重复加分）');
        }
      }
      if (rels.some(function (r) { return r.type === 'chong'; })) {
        lines.push('生肖相冲在民间被讲得很重，但年支只占八个字里的一个，单项不足以定论');
      }
    }

    score = Math.max(0, Math.min(10, score));
    return {
      key: 'year', name: '年柱根基', weight: 10, score: score, full: 10,
      level: score >= 8 ? 'good' : score <= 3 ? 'warn' : 'info',
      abbr: sxA + '·' + sxB,
      lines: lines,
      role: '年柱看家庭背景与成长节奏。生肖配对只是这一层的一个符号，权重最轻。'
    };
  }

  // ── 维度七：配偶星状态 ──
  function dimSpouseStar(a, b) {
    var lines = [];
    var data = [];

    [['甲', a, '甲方'], ['乙', b, '乙方']].forEach(function (item) {
      var label = item[2], p = item[1];
      var dm = (p.pillars.day || '')[0];
      var sex = p.sex; // 1=男 2=女
      if (!dm) return;

      // 男看财星，女看官杀
      var target = sex == 1 ? ['正财', '偏财'] : ['正官', '七杀'];
      var targetName = sex == 1 ? '财星（妻星）' : '官杀（夫星）';

      // 扫描四柱天干与地支藏干
      var found = [];
      var KA = ['year', 'month', 'day', 'hour'], NM = ['年', '月', '日', '时'];
      var CANG = {
        子: ['癸'], 丑: ['己', '癸', '辛'], 寅: ['甲', '丙', '戊'], 卯: ['乙'],
        辰: ['戊', '乙', '癸'], 巳: ['丙', '庚', '戊'], 午: ['丁', '己'],
        未: ['己', '丁', '乙'], 申: ['庚', '壬', '戊'], 酉: ['辛'],
        戌: ['戊', '辛', '丁'], 亥: ['壬', '甲']
      };

      for (var i = 0; i < 4; i++) {
        var gz = (p.pillars[KA[i]] || '');
        if (gz.length < 2) continue;
        var tg = tenGod(dm, gz[0]);
        if (target.indexOf(tg) >= 0) {
          found.push({ pos: NM[i] + '干', gan: gz[0], god: tg });
        }
        (CANG[gz[1]] || []).forEach(function (c, ci) {
          var t2 = tenGod(dm, c);
          if (target.indexOf(t2) >= 0) {
            found.push({
              pos: NM[i] + '支' + (ci === 0 ? '本气' : ci === 1 ? '中气' : '余气'),
              gan: c, god: t2
            });
          }
        });
      }

      if (found.length === 0) {
        lines.push(label + '（日主' + dm + '）盘中不见' + targetName + '——配偶星不显');
        lines.push('　不是没有姻缘，而是这个角色不突出，感情上更依赖后天选择而非命定牵引');
      } else {
        var posList = found.map(function (f) { return f.pos + f.gan + '（' + f.god + '）'; });
        lines.push(label + '（日主' + dm + '）' + targetName + '见 ' + found.length + ' 处：' +
          posList.slice(0, 5).join('、') + (posList.length > 5 ? ' 等' : ''));
        var inDay = found.filter(function (f) { return f.pos.indexOf('日') === 0; });
        if (inDay.length) {
          lines.push('　落在日柱——配偶星与夫妻宫同位，星宫同宫，对婚姻的定位很明确');
        }
        var mixed = found.some(function (f) { return f.god === '正财' || f.god === '正官'; }) &&
                    found.some(function (f) { return f.god === '偏财' || f.god === '七杀'; });
        if (mixed) {
          lines.push('　正偏混杂——对伴侣的想象与现实容易拉扯，择偶标准需要自己先想清楚');
        }
      }
      data.push({ label: label, dm: dm, sex: sex, found: found });
    });

    return {
      key: 'star', name: '配偶星', weight: 0, score: 0, full: 0,
      level: 'info',
      abbr: data.map(function (d) { return d.found.length + '处'; }).join('·'),
      lines: lines,
      role: '男看财星、女看官杀。这一项不参与打分，只用来说明各自「会遇到什么样的人」。'
    };
  }

  // ── 维度八：阴阳配置 ──
  // 阴阳失衡是合盘里被忽略但很实际的一项：一方纯阳、另一方纯阴，
  // 或双方都偏阳，相处模式会明显不同。
  function dimYinYang(a, b) {
    var GAN_YANG = '甲丙戊庚壬', ZHI_YANG = '子寅辰午申戌';

    function count(p) {
      var gz = p.pillars || {}, yang = 0, yin = 0;
      ['year', 'month', 'day', 'hour'].forEach(function (k) {
        var s = gz[k] || '';
        if (s.length < 2) return;
        if (GAN_YANG.indexOf(s[0]) >= 0) yang++; else yin++;
        if (ZHI_YANG.indexOf(s[1]) >= 0) yang++; else yin++;
      });
      return { yang: yang, yin: yin, total: yang + yin };
    }

    var ca = count(a), cb = count(b);
    if (!ca.total || !cb.total) return null;

    var lines = [];
    var pctA = Math.round(ca.yang / ca.total * 100);
    var pctB = Math.round(cb.yang / cb.total * 100);
    lines.push('甲方阳干支 ' + ca.yang + '／阴干支 ' + ca.yin + '（阳气 ' + pctA + '%）');
    lines.push('乙方阳干支 ' + cb.yang + '／阴干支 ' + cb.yin + '（阳气 ' + pctB + '%）');

    function label(p) {
      if (p >= 75) return '纯阳偏重';
      if (p >= 60) return '偏阳';
      if (p >= 40) return '阴阳均衡';
      if (p >= 25) return '偏阴';
      return '纯阴偏重';
    }
    var la = label(pctA), lb = label(pctB);
    lines.push('甲' + la + '，乙' + lb);

    var score = 8;
    var diff = Math.abs(pctA - pctB);

    if (diff <= 15) {
      score = 12;
      lines.push('两人阴阳比例接近——对「节奏快慢」「主动被动」的默认设定一致，不易互相误判');
      if (pctA >= 60 && pctB >= 60) {
        lines.push('但双方都偏阳：都倾向主动出击、都不太愿意先低头，冲突时容易僵住');
        lines.push('建议约定一个「谁先停」的机制，比讲道理有效');
      } else if (pctA <= 40 && pctB <= 40) {
        lines.push('双方都偏阴：都倾向回避和等待，问题容易被搁置而不是解决');
        lines.push('需要有人主动开口，否则不满会一层层累积');
      }
    } else if (diff <= 35) {
      score = 9;
      lines.push('阴阳有落差（' + diff + ' 个百分点）——一方更主动、一方更随和');
      lines.push('这种搭配本身很常见也很好用，前提是双方都认这个分工、不觉得委屈');
    } else {
      score = 6;
      lines.push('阴阳落差大（' + diff + ' 个百分点）——' +
        (pctA > pctB ? '甲明显偏阳、乙明显偏阴' : '乙明显偏阳、甲明显偏阴'));
      lines.push('一方习惯快速决断，一方习惯先观察，节奏差容易被认为是「不在乎」或「太急躁」');
      lines.push('这类组合最需要的是把「我需要多久想清楚」讲明白，而不是互相催');
    }

    return {
      key: 'yinyang', name: '阴阳配置', weight: 12, score: score, full: 12,
      level: score >= 11 ? 'good' : score >= 8 ? 'info' : 'warn',
      abbr: pctA + '% · ' + pctB + '%',
      lines: lines,
      role: '四柱八字里阳干支与阴干支的比例，反映主动性与节奏感的底层设定。'
    };
  }

  // ── 维度九：命理三垣（胎元 / 命宫 / 身宫）──
  // 《三命通会》论胎元：胎是受形之始，月是成气之时。三垣与四柱合称「七柱」。
  function dimSantai(a, b) {
    var lines = [];
    var items = [];

    function getSan(p, label) {
      var out = {};
      if (p.taiyuan) out.taiyuan = p.taiyuan;
      if (p.minggong) out.minggong = p.minggong;
      if (p.shengong) out.shengong = p.shengong;
      return out;
    }

    var sa = getSan(a), sb = getSan(b);
    if (!sa.taiyuan && !sa.minggong && !sa.shengong) return null;

    var NAMES = { taiyuan: '胎元', minggong: '命宫', shengong: '身宫' };
    var KEYS = ['taiyuan', 'minggong', 'shengong'];

    KEYS.forEach(function (k) {
      var va = sa[k], vb = sb[k];
      if (!va || !vb) return;
      var za = va[1], zb = vb[1];
      var rels = zhiRelation(za, zb);
      var txt = NAMES[k] + '：甲' + va + ' · 乙' + vb;
      items.push({ k: k, va: va, vb: vb, rels: rels, txt: txt });
    });

    if (!items.length) return null;

    var score = 6;
    items.forEach(function (it) {
      var desc = it.txt;
      if (it.rels.length) {
        desc += ' → ' + it.rels.map(function (r) { return r.name; }).join('、');
        it.rels.forEach(function (r) {
          if (r.type === 'liuhe') score += 3;
          else if (r.type === 'sanhe') score += 2;
          else if (r.type === 'chong') score -= 2;
          else if (r.type === 'xing') score -= 1;
          else if (r.type === 'hai') score -= 1;
          else if (r.type === 'same') score += 1;
        });
      } else if (wxOfZhi(it.va[1]) === wxOfZhi(it.vb[1])) {
        desc += ' → 同属' + wxOfZhi(it.va[1]);
        score += 1;
      }
      lines.push(desc);
    });

    // 命宫的解释只在双方都有时才说
    var mg = items.filter(function (i) { return i.k === 'minggong'; })[0];
    if (mg) {
      var rel = mg.rels.filter(function (r) { return r.level === 'good'; })[0];
      var bad = mg.rels.filter(function (r) { return r.level === 'warn'; })[0];
      if (rel) {
        lines.push('命宫相合（' + rel.name + '）—— 两人对「人生该往哪走」的直觉比较接近，长期目标容易谈得拢');
      } else if (bad) {
        lines.push('命宫见' + bad.name + '—— 人生取向的底层设定不同，短期看是互补，长期需要各自留出空间');
      }
    }
    var ty = items.filter(function (i) { return i.k === 'taiyuan'; })[0];
    if (ty && ty.rels.length === 0 && wxOfZhi(ty.va[1]) !== wxOfZhi(ty.vb[1])) {
      lines.push('胎元无直接关系——胎元看的是先天禀赋与身体底子，这一项对关系影响较轻');
    }

    score = Math.max(0, Math.min(15, score));
    return {
      key: 'santai', name: '命理三垣', weight: 15, score: score, full: 15,
      level: score >= 13 ? 'good' : score >= 9 ? 'info' : 'warn',
      abbr: (items[0] ? items[0].va[1] + '·' + items[0].vb[1] : '—'),
      lines: lines,
      role: '胎元、命宫、身宫合称三垣，与四柱并称「七柱」。这一层看先天禀赋与人生取向。'
    };
  }

  // ── 维度十：婚恋神煞 ──
  function dimShensha(a, b) {
    var lines = [];

    // 常用婚恋神煞的查法
    // 红鸾：从年支起，子年卯、丑年寅…（逆数）
    // 天喜：红鸾对冲
    // 孤辰寡宿：按年支三会查
    var HONGLUAN = {
      子: '卯', 丑: '寅', 寅: '丑', 卯: '子', 辰: '亥', 巳: '戌',
      午: '酉', 未: '申', 申: '未', 酉: '午', 戌: '巳', 亥: '辰'
    };
    var CHONG = {
      子: '午', 丑: '未', 寅: '申', 卯: '酉', 辰: '戌', 巳: '亥',
      午: '子', 未: '丑', 申: '寅', 酉: '卯', 戌: '辰', 亥: '巳'
    };
    // 孤辰寡宿：寅卯辰年 → 孤巳 寡丑；巳午未 → 孤申 寡辰；
    //            申酉戌 → 孤亥 寡未；亥子丑 → 孤寅 寡戌
    var GU_GUA = {
      寅: ['巳', '丑'], 卯: ['巳', '丑'], 辰: ['巳', '丑'],
      巳: ['申', '辰'], 午: ['申', '辰'], 未: ['申', '辰'],
      申: ['亥', '未'], 酉: ['亥', '未'], 戌: ['亥', '未'],
      亥: ['寅', '戌'], 子: ['寅', '戌'], 丑: ['寅', '戌']
    };

    function scan(p, label) {
      var gz = p.pillars || {};
      var zhis = ['year', 'month', 'day', 'hour'].map(function (k) { return (gz[k] || '')[1]; });
      var yz = zhis[0];
      if (!yz) return null;

      var hl = HONGLUAN[yz];
      var tx = hl ? CHONG[hl] : null;
      var gg = GU_GUA[yz] || [];

      var hasHL = zhis.indexOf(hl) >= 0;
      var hasTX = tx && zhis.indexOf(tx) >= 0;
      var hasGu = zhis.indexOf(gg[0]) >= 0;
      var hasGua = zhis.indexOf(gg[1]) >= 0;

      // 阴差阳错日（12 个日柱）
      var YINCHA = ['丙子', '丁丑', '戊寅', '辛卯', '壬辰', '癸巳',
                    '丙午', '丁未', '戊申', '辛酉', '壬戌', '癸亥'];
      var day = gz.day || '';
      var hasYC = YINCHA.indexOf(day) >= 0;

      return {
        label: label, yz: yz, zhis: zhis,
        hongluan: hasHL ? hl : null,
        tianxi: hasTX ? tx : null,
        gu: hasGu ? gg[0] : null,
        gua: hasGua ? gg[1] : null,
        yincha: hasYC
      };
    }

    var sa = scan(a, '甲方'), sb = scan(b, '乙方');
    if (!sa || !sb) return null;

    var score = 8;
    var found = 0;

    [sa, sb].forEach(function (s) {
      var bits = [];
      if (s.hongluan) { bits.push('红鸾在' + s.hongluan); score += 2; found++; }
      if (s.tianxi) { bits.push('天喜在' + s.tianxi); score += 1; found++; }
      if (s.gu) { bits.push('孤辰在' + s.gu); score -= 1; found++; }
      if (s.gua) { bits.push('寡宿在' + s.gua); score -= 1; found++; }
      if (s.yincha) { bits.push('阴差阳错日'); score -= 1; found++; }
      if (bits.length) {
        lines.push(s.label + '（年支' + s.yz + '）：' + bits.join('、'));
      } else {
        lines.push(s.label + '（年支' + s.yz + '）：无婚恋类神煞');
      }
    });

    // 双方都有红鸾/天喜
    if (sa.hongluan && sb.hongluan) {
      lines.push('双方都带红鸾——两人都属于「感情机会不少」的类型，吸引力是双向的');
      score += 2;
    }
    if (sa.yincha && sb.yincha) {
      lines.push('双方都是阴差阳错日——传统上认为婚姻多波折，但也意味着两人对「不顺」有共同经验，反而容易互相理解');
    }
    if (score >= 12) {
      lines.push('神煞层面整体偏吉：姻缘信号明显，相处中的「缘分感」会比较强');
    } else if (score <= 4) {
      lines.push('神煞层面偏弱：孤辰寡宿或阴差阳错会带来「明明在一起却各想各的」的疏离感');
      lines.push('神煞是加分项而非判决项——它描述的是倾向，不是结果');
    } else {
      lines.push('神煞层面中性：没有特别强的姻缘信号，也没有明显的阻碍');
    }
    lines.push('这一项权重最低。神煞在传统合婚里常被单独拿出来吓人，实际上它只是众多参考之一');

    score = Math.max(0, Math.min(15, score));
    return {
      key: 'shensha', name: '婚恋神煞', weight: 15, score: score, full: 15,
      level: score >= 11 ? 'good' : score >= 6 ? 'info' : 'warn',
      abbr: found ? found + ' 项' : '无',
      lines: lines,
      role: '红鸾、天喜、孤辰、寡宿、阴差阳错。传统上最被滥用的一层，这里只作参考。'
    };
  }

  // ── 维度十一：大运节奏 ──
  function dimDayun(a, b) {
    var lines = [];
    var da = a.dayun || [], db = b.dayun || [];
    if (!da.length || !db.length) return null;

    var ageA = a.qiyun && a.qiyun.age != null ? a.qiyun.age : null;
    var ageB = b.qiyun && b.qiyun.age != null ? b.qiyun.age : null;

    if (ageA != null && ageB != null) {
      lines.push('起运年龄：甲 ' + ageA.toFixed(1) + ' 岁，乙 ' + ageB.toFixed(1) + ' 岁');
      var dq = Math.abs(ageA - ageB);
      if (dq < 1) {
        lines.push('起运几乎同步——两人的人生节奏天生对齐，重要转折容易落在同一时段');
        lines.push('好处是能互相理解「怎么突然变了」，坏处是低谷期可能同时来');
      } else if (dq < 4) {
        lines.push('起运相差 ' + dq.toFixed(1) + ' 年——节奏接近，大致能同步');
      } else {
        lines.push('起运相差 ' + dq.toFixed(1) + ' 年——人生阶段错开，一方在换轨时另一方可能正稳定');
        lines.push('这种错位不一定是坏事：一方动荡时另一方正好能托底');
      }
    }

    // 找出两人大运里天干相合 / 地支相合的步
    var GOOD = [], BAD = [];
    var n = Math.min(da.length, db.length, 8);
    for (var i = 0; i < n; i++) {
      var ga = da[i] && (da[i].gz || da[i].ganzhi || '');
      var gb = db[i] && (db[i].gz || db[i].ganzhi || '');
      if (!ga || !gb || ga.length < 2 || gb.length < 2) continue;
      var rels = zhiRelation(ga[1], gb[1]);
      var ganHe = GANHE[ga[0]] === gb[0];
      var idx = (i + 1) + ' 步';
      if (ganHe) GOOD.push(idx + '（' + ga[0] + gb[0] + '合）');
      rels.forEach(function (r) {
        if (r.type === 'liuhe' || r.type === 'sanhe') GOOD.push(idx + '（' + r.name + '）');
        else if (r.type === 'chong') BAD.push(idx + '（' + r.name + '）');
        else if (r.type === 'xing') BAD.push(idx + '（' + r.name + '）');
      });
    }

    if (GOOD.length) lines.push('同步大运见合：' + GOOD.slice(0, 5).join('、') +
      (GOOD.length > 5 ? ' 等 ' + GOOD.length + ' 处' : ''));
    if (BAD.length) lines.push('同步大运见冲刑：' + BAD.slice(0, 5).join('、') +
      (BAD.length > 5 ? ' 等 ' + BAD.length + ' 处' : ''));

    if (!GOOD.length && !BAD.length) {
      lines.push('两人前八步大运之间没有明显的合冲——各自走各自的路，互相干扰小');
    } else if (GOOD.length > BAD.length) {
      lines.push('整体节奏偏顺：多数阶段能互相借力，适合一起推进长期目标');
    } else if (BAD.length > GOOD.length) {
      lines.push('冲刑多于相合：某些阶段会同时感到压力，需要有意识地错开重大决定');
    }

    lines.push('大运同步是「时间维度」的合盘——八字的静态互动说明你们是什么样的人，大运说明什么时候会碰上什么');

    var score = 7;
    score += Math.min(4, GOOD.length) - Math.min(4, BAD.length);
    score = Math.max(0, Math.min(15, score));

    return {
      key: 'dayun', name: '大运节奏', weight: 15, score: score, full: 15,
      level: score >= 11 ? 'good' : score >= 6 ? 'info' : 'warn',
      abbr: GOOD.length + '合 ' + BAD.length + '冲',
      lines: lines,
      role: '两人大运的时间轴对不对得上。这一层回答「什么时候」，不是「合不合」。'
    };
  }


  function conclude(dims, total) {
    var pct = Math.round(total / 100 * 100);
    var tier, head, tail;

    if (pct >= 78) {
      tier = 'A'; head = '契合度很高';
      tail = '两张盘的互动点大多是相生相合，性格与需求天然对得上。这类组合的功课不在「怎么合」，而在「别把顺当成理所当然」——顺境里的关系最怕停止经营。';
    } else if (pct >= 62) {
      tier = 'B'; head = '整体契合';
      tail = '有几处明显的助力，也有几处需要留意的地方。多数真实的长久关系都在这个区间——不是没有摩擦，是摩擦点在可沟通的范围内。';
    } else if (pct >= 45) {
      tier = 'C'; head = '需要磨合';
      tail = '合的地方不足以自动化解冲的地方，需要双方都愿意调整节奏。这类组合的特点是：好的时候极好，卡的时候很卡，中间地带不多。';
    } else {
      tier = 'D'; head = '差异明显';
      tail = '冲刑多于相合，性格底层与相处习惯的落差较大。这不是「不能在一起」——很多这样的组合靠明确的分工与边界过得很好，但需要比常人更多的沟通成本。';
    }

    // 找最强与最弱的两项
    var scored = dims.filter(function (d) { return d.weight > 0; });
    var sorted = scored.slice().sort(function (x, y) {
      return (y.score / y.full) - (x.score / x.full);
    });
    var best = sorted[0], worst = sorted[sorted.length - 1];

    return {
      pct: pct, tier: tier, head: head, tail: tail,
      best: best, worst: worst,
      text: head + '（' + pct + ' 分）。' +
        '最强的是' + best.name + '，最需要留意的是' + worst.name + '。' + tail
    };
  }

  // ── 主函数 ──
  /**
   * @param a 甲方 paipan 结果
   * @param b 乙方 paipan 结果
   * @param rel 关系类型
   */
  function hepanDeep(a, b, rel) {
    var dims = [
      dimFuqi(a, b),        // 30  夫妻宫
      dimRizhu(a, b),       // 30  日主关系
      dimWuxing(a, b),      // 25  五行互补
      dimShishen(a, b),     // 15  十神互看
      dimCross(a, b),       // 15  跨盘地支
      dimSantai(a, b),      // 15  命理三垣
      dimDayun(a, b),       // 15  大运节奏
      dimShensha(a, b),     // 15  婚恋神煞
      dimYinYang(a, b),     // 12  阴阳配置
      dimYear(a, b),        // 10  年柱根基
      dimSpouseStar(a, b)   // 参考，不计分
    ].filter(Boolean);

    // 计分：夫妻宫 30 + 日主 30 + 五行 25 + 十神 15 = 100，跨盘 ±15，年柱 10
    var scored = dims.filter(function (d) { return d.weight > 0; });
    var raw = 0, maxRaw = 0;
    scored.forEach(function (d) { raw += d.score; maxRaw += d.full; });

    // 归一化到百分制
    var total = maxRaw > 0 ? Math.round(raw / maxRaw * 100) : 0;
    total = Math.max(0, Math.min(100, total));

    // 扁平化兼容旧接口
    var points = [];
    dims.forEach(function (d) {
      d.lines.forEach(function (ln, i) {
        points.push({
          level: i === 0 ? (d.level === 'good' ? 'good' : d.level === 'warn' ? 'warn' : 'info') : 'info',
          text: ln
        });
      });
    });

    return {
      rel: rel,
      dims: dims,
      total: total,
      raw: raw, maxRaw: maxRaw,
      verdict: conclude(dims, total),
      points: points
    };
  }

  // ── 兼容旧接口 ──
  function analyze(a, b) {
    var r = hepanDeep(a, b, 'love');
    return r.points;
  }

  global.bzHepanDeep = {
    hepan: hepanDeep,
    analyze: analyze,
    zhiRelation: zhiRelation,
    tenGod: tenGod,
    godGroup: godGroup,
    xiYong: xiYong,
    wuxingPct: wuxingPct,
    WX_ORDER: WX_ORDER,
    GAN_WX: GAN_WX,
    ZHI_WX: ZHI_WX,
    CHONG: CHONG, LIUHE: LIUHE, HAI: HAI,
    SANHE: SANHE, SANHUI: SANHUI,
    XING_SETS: XING_SETS, ZIXING: ZIXING,
    GANHE: GANHE, GANCHONG: GANCHONG
  };
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
