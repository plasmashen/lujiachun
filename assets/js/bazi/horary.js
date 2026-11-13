/**
 * 卜卦占星（Horary）+ 择时占星（Electional）
 *
 * 与西占本命盘共用同一套星历与宫位算法（western.js），
 * 区别只在「时间源」：
 *   本命盘 —— 出生时刻
 *   卜卦   —— 提问时刻（心中起疑的那一刻）
 *   择时   —— 计划行事的时刻（要挑一个好时间）
 *
 * 卜卦占星判断要点（Lilly 传统）：
 *   1. 求问者 = 1 宫主星（有时也用月亮）
 *   2. 所问之事 = 相应宫的主星（如问财看 2 宫、问事业看 10 宫）
 *   3. 两主星成相（合/三合/六合）= 事可成；无相/离相 = 不成
 *   4. 月亮的状态很重要，代表事情的发展趋势
 */
(function (global) {
  'use strict';

  var A = global.Astronomy;

  // 问题类型 → 对应宫位
  var QUESTION_HOUSES = {
    '财运': { house: 2, label: '财帛宫', desc: '收入、金钱、可动用的资源' },
    '事业': { house: 10, label: '官禄宫', desc: '职业、地位、上司' },
    '感情': { house: 7, label: '夫妻宫', desc: '伴侣、婚恋对象' },
    '婚姻': { house: 7, label: '夫妻宫', desc: '伴侣、婚恋对象' },
    '考试': { house: 9, label: '迁移宫', desc: '高等教育、资格、远方' },
    '学业': { house: 9, label: '迁移宫', desc: '高等教育、资格、远方' },
    '健康': { house: 6, label: '疾厄宫', desc: '疾病、日常作息' },
    '疾病': { house: 6, label: '疾厄宫', desc: '疾病、日常作息' },
    '房产': { house: 4, label: '田宅宫', desc: '房子、家庭、根基' },
    '房子': { house: 4, label: '田宅宫', desc: '房子、家庭、根基' },
    '出行': { house: 3, label: '兄弟宫', desc: '短途、交通、沟通' },
    '旅行': { house: 9, label: '迁移宫', desc: '长途旅行、远方' },
    '诉讼': { house: 7, label: '夫妻宫', desc: '对手、公开的争讼' },
    '合作': { house: 7, label: '夫妻宫', desc: '合伙人、合约方' },
    '子女': { house: 5, label: '子女宫', desc: '孩子、创作、恋爱' },
    '工作': { house: 6, label: '疾厄宫', desc: '日常工作、下属' },
    '朋友': { house: 11, label: '福德宫', desc: '朋友、社群、支持者' },
    '寻物': { house: 2, label: '财帛宫', desc: '失物、财物' }
  };

  // 宫位主星（传统七曜）
  var SIGN_RULER = [
    'Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', // 白羊..处女
    'Venus', 'Pluto', 'Jupiter', 'Saturn', 'Uranus', 'Neptune' // 天秤..双鱼
  ];

  // 传统主星（只用七曜，避免三王星带来的流派争议）
  var TRAD_RULER = [
    'Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury',
    'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'
  ];

  function rulerOf(lon) {
    var idx = Math.floor(((lon % 360) + 360) % 360 / 30);
    return TRAD_RULER[idx];
  }

  // ── 择时占星的「吉时」判据 ──
  var KNOWN_GOOD = {
    '签约': { goodSigns: ['土', '风'], badAspects: ['刑相', '对分相'], prefer: '月相盈' },
    '开业': { goodSigns: ['火', '土'], badAspects: ['刑相', '对分相'], prefer: '月相盈' },
    '结婚': { goodSigns: ['水', '风', '土'], badAspects: ['刑相', '对分相'], prefer: '月相盈' },
    '搬家': { goodSigns: ['土'], badAspects: ['刑相', '对分相'], prefer: '月相盈' },
    '手术': { goodSigns: ['风', '土'], badAspects: ['刑相', '对分相'], prefer: '月相亏' },
    '出行': { goodSigns: ['火', '风'], badAspects: ['刑相'], prefer: '月相盈' },
    '开业典礼': { goodSigns: ['火', '土'], badAspects: ['刑相', '对分相'], prefer: '月相盈' }
  };

  var ACTIVITY_KEYS = Object.keys(KNOWN_GOOD);

  /**
   * 卜卦占星：以提问时刻起盘
   * @param opt {ms, lat, lon, question}
   */
  function horary(opt) {
    var chart = global.bzAstro.natal({
      ms: opt.ms, lat: opt.lat || 39.9, lon: opt.lon || 116.4,
      houseSystem: 'whole'
    });

    var q = String(opt.question || '').trim();
    var target = null;
    for (var k in QUESTION_HOUSES) {
      if (q.indexOf(k) >= 0) { target = QUESTION_HOUSES[k]; target.key = k; break; }
    }

    // 求问者：1 宫主星 + 月亮
    var ascLon = chart.asc.lon;
    var querentRuler = rulerOf(ascLon);
    var querentPos = chart.points.filter(function (p) { return p.key === querentRuler; })[0];
    var moon = chart.moon;

    var quesitedRuler = null, quesitedPos = null, houseCusp = null;
    if (target) {
      houseCusp = chart.cusps[target.house - 1];
      quesitedRuler = rulerOf(houseCusp);
      quesitedPos = chart.points.filter(function (p) { return p.key === quesitedRuler; })[0];
    }

    // 两主星之间的相位
    var answer = null;
    if (querentPos && quesitedPos && querentRuler !== quesitedRuler) {
      answer = judge(chart, querentPos, quesitedPos, moon, querentRuler, quesitedRuler);
    } else if (querentPos && quesitedPos) {
      answer = {
        verdict: '同主',
        text: '求问者与所问之事同由 ' + querentPos.zh + ' 主事，' +
          '说明你与这件事本是一体，答案更多取决于你自己的选择而非外部条件。',
        aspects: []
      };
    }

    // 月亮状态
    var moonNote = moonState(chart, moon);

    return {
      chart: chart,
      question: q,
      target: target,
      querent: { ruler: querentRuler, pos: querentPos },
      quesited: { ruler: quesitedRuler, pos: quesitedPos, cusp: houseCusp },
      moon: moon, moonNote: moonNote,
      answer: answer
    };
  }

  /** 判断两主星关系 */
  function judge(chart, p1, p2, moon, r1, r2) {
    var aspects = chart.aspects.filter(function (a) {
      var pair = [a.a, a.b].sort().join('|');
      var want = [p1.key, p2.key].sort().join('|');
      return pair === want;
    });

    if (!aspects.length) {
      return {
        verdict: '无相',
        text: p1.zh + '（你）与 ' + p2.zh + '（所问之事）之间没有主要相位，' +
          '两者互不相顾。传统判为「事情难成」或「你与这事目前没有交集」。' +
          '但也可能是时机未到——等两者行度接近后再看。',
        aspects: []
      };
    }

    var a = aspects[0];
    var good = (a.name === '三分相' || a.name === '六分相' || a.name === '合相');
    var bad = (a.name === '刑相' || a.name === '对分相');

    var verdict, text;
    if (a.name === '合相') {
      verdict = '合相 · 可成';
      text = p1.zh + ' 与 ' + p2.zh + ' 合相（orb ' + a.orb.toFixed(1) + '°），' +
        '两者紧密结合，所求之事与你直接相关，事情可成。' +
        '合相强度高，成败都明显。';
    } else if (good) {
      verdict = a.name + ' · 吉';
      text = p1.zh + ' 与 ' + p2.zh + ' 成' + a.name + '（orb ' + a.orb.toFixed(1) + '°），' +
        '属顺畅之相，事情的阻力小，可成且过程顺利。';
    } else if (bad) {
      verdict = a.name + ' · 阻';
      text = p1.zh + ' 与 ' + p2.zh + ' 成' + a.name + '（orb ' + a.orb.toFixed(1) + '°），' +
        '属紧张之相，事有阻碍。刑相多为内部矛盾或反复，' +
        '对分相多为外部对立或两难。';
    } else {
      verdict = a.name;
      text = p1.zh + ' 与 ' + p2.zh + ' 成' + a.name + '。';
    }

    // 月亮是否参与
    if (moon && (moon.key === p1.key || moon.key === p2.key)) {
      text += '　月亮正在其中，说明这件事对你情绪牵扯很深。';
    }

    return { verdict: verdict, text: text, aspects: aspects };
  }

  /** 月亮状态 */
  function moonState(chart, moon) {
    if (!moon) return null;
    var notes = [];
    // 月亮空亡（无相位）
    var moonAsp = chart.aspects.filter(function (a) {
      return a.a === 'Moon' || a.b === 'Moon';
    });
    if (!moonAsp.length) {
      notes.push({ k: '月亮空亡', v: '月亮与任何行星都没有主要相位。传统认为此时问卦多「无果」，' +
        '事情可能不了了之，或问了也不会照预期发展。' });
    }
    // 月亮所在宫
    notes.push({ k: '月亮落宫', v: '月亮在第 ' + moon.house + ' 宫' +
      '（' + (global.bzAstro.HOUSES[moon.house - 1] || {}).topic + '），' +
      '说明这件事的推进重心在这个领域。' });
    // 月亮星座
    notes.push({ k: '月亮星座', v: '月亮在' + moon.sign.sign.zh + '座，' +
      '在这件事上你的情绪基调偏「' + (moon.sign.sign.el === '火' ? '急切、想马上行动'
        : moon.sign.sign.el === '土' ? '务实、怕风险'
        : moon.sign.sign.el === '风' ? '理性、想先谈清楚'
        : '敏感、跟着感觉走') + '」。' });
    return notes;
  }

  /**
   * 择时占星：为一个活动挑当天最好的时间
   * @param opt {dateStr, lat, lon, activity}
   * @returns {candidates:[{hour, score, chart, reasons}]}
   */
  function elective(opt) {
    var lat = opt.lat || 39.9, lon = opt.lon || 116.4;
    var act = KNOWN_GOOD[opt.activity] || KNOWN_GOOD['签约'];
    var parts = opt.dateStr.split('-').map(Number);
    var results = [];

    // 逐小时评分（0-23）
    for (var h = 0; h < 24; h++) {
      var ms = Date.UTC(parts[0], parts[1] - 1, parts[2], h - 8, 0, 0);
      var ch = global.bzAstro.natal({ ms: ms, lat: lat, lon: lon, houseSystem: 'whole' });

      var score = 50;
      var reasons = [];

      // ① 月亮相位（月相）
      var sunLon = ch.sun.lon, moonLon = ch.moon.lon;
      var phaseAngle = ((moonLon - sunLon) % 360 + 360) % 360;
      var waxing = phaseAngle < 180;
      if (act.prefer === '月相盈' && waxing) { score += 12; reasons.push('月相渐盈，宜生长/开启类事务'); }
      if (act.prefer === '月相盈' && !waxing) { score -= 8; reasons.push('月相渐亏，传统上不宜开启'); }
      if (act.prefer === '月相亏' && !waxing) { score += 12; reasons.push('月相渐亏，宜收束/削减类事务'); }

      // ② 月亮所在星座元素
      var moonEl = ch.moon.sign.sign.el;
      if (act.goodSigns.indexOf(moonEl) >= 0) {
        score += 10; reasons.push('月亮在' + moonEl + '象，合此事的性质');
      } else {
        score -= 5;
      }

      // ③ 上升星座元素
      var ascEl = ch.asc.sign.sign.el;
      if (act.goodSigns.indexOf(ascEl) >= 0) {
        score += 8; reasons.push('上升在' + ascEl + '象，起手气场合');
      }

      // ④ 凶相位扣分
      var badCount = ch.aspects.filter(function (a) {
        return act.badAspects.indexOf(a.name) >= 0 && a.orb < 3 &&
          (a.a === 'Moon' || a.b === 'Moon');
      }).length;
      if (badCount) { score -= badCount * 10; reasons.push('月亮有 ' + badCount + ' 个紧凶相'); }

      // ⑤ 月亮是否空亡
      var moonHasAsp = ch.aspects.some(function (a) {
        return a.a === 'Moon' || a.b === 'Moon';
      });
      if (!moonHasAsp) { score -= 15; reasons.push('月亮空亡，事易无果'); }

      // ⑥ 月亮落宫（避开 6/8/12 宫）
      var badHouses = [6, 8, 12];
      if (badHouses.indexOf(ch.moon.house) >= 0) {
        score -= 10; reasons.push('月亮落第 ' + ch.moon.house + ' 宫（传统不吉之宫）');
      } else {
        score += 4;
      }

      // ⑦ 木星/金星是否有吉相（加分项）
      var benefic = ch.aspects.filter(function (a) {
        return (a.a === 'Jupiter' || a.b === 'Jupiter' ||
                a.a === 'Venus' || a.b === 'Venus') &&
          (a.name === '三分相' || a.name === '六分相') && a.orb < 4;
      }).length;
      if (benefic) { score += benefic * 3; }

      results.push({
        hour: h,
        score: Math.max(0, Math.min(100, Math.round(score))),
        chart: ch,
        reasons: reasons
      });
    }

    results.sort(function (a, b) { return b.score - a.score; });

    return {
      activity: opt.activity,
      date: opt.dateStr,
      best: results.slice(0, 3),
      all: results,
      act: act
    };
  }

  global.bzHorary = {
    QUESTION_HOUSES: QUESTION_HOUSES,
    KNOWN_GOOD: KNOWN_GOOD,
    ACTIVITY_KEYS: ACTIVITY_KEYS,
    horary: horary,
    elective: elective,
    rulerOf: rulerOf
  };
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
