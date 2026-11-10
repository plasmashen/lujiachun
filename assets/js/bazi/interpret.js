/* 八字解读引擎 —— 把命盘翻译成人能读懂的中文
 * 依赖 interpret-data.js 的词典，不调用任何外部接口。
 */

var BZ_KE = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };
var BZ_SHENG = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
var BZ_BEI_SHENG = { '火': '木', '土': '火', '金': '土', '水': '金', '木': '水' };

var BZ_CHONG = { '子': '午', '丑': '未', '寅': '申', '卯': '酉', '辰': '戌', '巳': '亥',
  '午': '子', '未': '丑', '申': '寅', '酉': '卯', '戌': '辰', '亥': '巳' };
var BZ_HE = { '子': '丑', '丑': '子', '寅': '亥', '亥': '寅', '卯': '戌', '戌': '卯',
  '辰': '酉', '酉': '辰', '巳': '申', '申': '巳', '午': '未', '未': '午' };

function bzWxMeaning(wx) {
  return { '木': '仁爱·成长·计划', '火': '热情·表达·名声',
    '土': '信用·稳定·包容', '金': '果断·条理·决断',
    '水': '智慧·流动·应变' }[wx] || wx;
}

/** 主解读：返回 [{title, icon, items:[{k,v}], text}] */
function bzAnalyze(c) {
  var out = [];
  var p = c.pillarList;
  var dg = c.dayMaster, dmWx = c.dayMasterWuxing;
  var monthZhi = p[1][1];
  var score = c.wuxingScore, count = c.wuxingCount;

  // ── 1. 日主强弱 ──
  var state = (BZ_WANG_SHUAI[monthZhi] || {})[dmWx] || '平';
  var helpers = [dmWx, BZ_BEI_SHENG[dmWx]];
  var helpScore = 0, totalScore = 0;
  for (var k in score) { totalScore += score[k]; }
  helpers.forEach(function (h) { helpScore += (score[h] || 0); });
  var ratio = totalScore > 0 ? helpScore / totalScore : 0;

  var strength, advice;
  if (ratio >= 0.55) {
    strength = '偏旺';
    advice = '日主气足，宜泄不宜再助。走食伤、财、官杀运更能发挥。';
  } else if (ratio >= 0.42) {
    strength = '中和';
    advice = '日主力量适中，五行流通较好，多数运势都能承接。';
  } else if (ratio >= 0.30) {
    strength = '偏弱';
    advice = '日主偏弱，宜印星、比劫帮身。忌再被财官过度耗泄。';
  } else {
    strength = '偏弱（身弱）';
    advice = '日主明显不足，最忌财官过重。宜先固本，再图进取。';
  }

  out.push({
    title: '日主与强弱', icon: 'core',
    items: [
      { k: '日主', v: dg + '（' + dmWx + '·' + c.dayMasterYinyang + '）' },
      { k: '生于', v: monthZhi + '月（' + state + '）' },
      { k: '生扶力量', v: helpScore.toFixed(1) + ' / ' + totalScore.toFixed(1) +
          '（' + Math.round(ratio * 100) + '%）' },
      { k: '强弱判断', v: strength }
    ],
    text: advice + '　（"日主"就是你自己，用出生那天的天干代表。'
      + '"旺"指这股力量偏强、"弱"指偏不足，没有好坏之分，只是取用不同。）'
  });

  // ── 2. 五行分布 ──
  var WXS = ['木', '火', '土', '金', '水'];
  var missing = WXS.filter(function (k) { return count[k] === 0; });
  var strongest = WXS[0], weakest = WXS[0];
  WXS.forEach(function (k) {
    if (score[k] > score[strongest]) strongest = k;
    if (score[k] < score[weakest]) weakest = k;
  });
  var wxText = '';
  if (missing.length) {
    wxText += '命局不见' + missing.join('、') + '。' +
      missing.map(function (m) { return m + '主' + bzWxMeaning(m); }).join('；') +
      ' ——这些方面容易成为短板，可在现实中主动补足。';
  }
  wxText += strongest + '最旺（' + Number(score[strongest]).toFixed(1) + '），' +
    weakest + '最弱（' + Number(score[weakest]).toFixed(1) + '）。';
  if (score[weakest] > 0 && score[strongest] / score[weakest] > 4) {
    wxText += '五行明显偏枯，行运补上弱项时人生变化最剧烈。';
  }
  out.push({
    title: '五行分布', icon: 'wuxing',
    items: WXS.map(function (k) {
      return { k: k + '（' + bzWxMeaning(k) + '）',
        v: count[k] + ' 字 / ' + Number(score[k]).toFixed(1) };
    }),
    text: wxText
  });

  // ── 3. 十神格局 ──
  var godCount = {};
  c.tenGods.forEach(function (g) {
    if (g !== '日主') godCount[g] = (godCount[g] || 0) + 1;
  });
  c.cangganGods.forEach(function (arr) {
    arr.forEach(function (g) { godCount[g] = (godCount[g] || 0) + 0.5; });
  });
  var top = Object.keys(godCount).map(function (g) { return [g, godCount[g]]; })
    .sort(function (a, b) { return b[1] - a[1]; }).slice(0, 4);

  var godItems = top.map(function (it) {
    var info = BZ_TEN_GOD_INFO[it[0]] || {};
    return { k: it[0] + '（' + (info.cat || '') + '）×' + it[1],
      v: info.topic || '' };
  });

  var gset = {};
  top.forEach(function (it) { gset[it[0]] = true; });
  var focus = [];
  if (gset['正官'] || gset['七杀']) focus.push('官杀有力，适合有规则、有压力的环境，能担责任');
  if (gset['正财'] || gset['偏财']) focus.push('财星显，理财与经营意识强，宜做与钱打交道的事');
  if (gset['食神'] || gset['伤官']) focus.push('食伤旺，表达与创造力是强项，适合技术、创作、教学');
  if (gset['正印'] || gset['偏印']) focus.push('印星重，学习与思考能力强，宜走专业化路线');
  if (gset['比肩'] || gset['劫财']) focus.push('比劫多，自主性强、朋友多，但要注意与人分利');

  out.push({
    title: '十神格局', icon: 'god', items: godItems,
    text: (focus.length ? focus.join('；') + '。' : '') +
      '十神是指其他五行与日主的关系：同我为比劫（自我与竞争），我生为食伤（才华与表达），'
      + '我克为财（收入与经营），克我为官杀（责任与压力），生我为印（学习与庇护）。'
  });

  // ── 4. 四柱所主 ──
  var ROLES = ['年柱', '月柱', '日柱', '时柱'];
  out.push({
    title: '四柱所主', icon: 'pillar',
    items: ROLES.map(function (r, i) {
      var g = c.tenGods[i];
      return { k: r + ' ' + p[i],
        v: (g === '日主' ? '' : g + '・') + (BZ_PILLAR_ROLE[r] || '') };
    }),
    text: '四柱就是把出生的年、月、日、时各用一个天干一个地支表示，共八个字，所以叫"八字"。'
      + '年柱看根基与长辈，月柱看青年与父母兄弟，日柱看自己与配偶，时柱看子女与晚年。'
  });

  // ── 5. 神煞解说 ──
  var POS = ['年', '月', '日', '时'];
  var shaItems = [], good = 0, bad = 0;
  for (var i = 0; i < 4; i++) {
    c.shensha[i].forEach(function (s) {
      var info = BZ_SHENSHA_INFO[s];
      if (!info) return;
      if (info.lvl === '凶') bad++; else if (info.lvl === '吉' || info.lvl === '大吉') good++;
      shaItems.push({ k: s + '（' + POS[i] + '柱·' + info.lvl + '）', v: info.desc });
    });
  }
  out.push({
    title: '神煞解说', icon: 'sha', items: shaItems,
    text: shaItems.length
      ? ('吉神 ' + good + ' 个、凶煞 ' + bad + ' 个。神煞是古人对某些干支组合的标签，'
         + '吉神主助力与机遇，凶煞提示需要留意的地方。'
         + '注意：煞不是"坏事一定会发生"，而是"这类情境你可能更容易遇到"，'
         + '而且要看有没有其他字来制化它。')
      : '本命盘无显著神煞。'
  });

  // ── 6. 起运节奏 ──
  var q = c.qiyun;
  out.push({
    title: '起运与人生节奏', icon: 'yun',
    items: [
      { k: '起运', v: q.age + '岁' + q.months + '个月' + q.days + '天' },
      { k: '交运', v: q.jiaoyunText || '' },
      { k: '大运方向', v: q.forward ? '顺行（阳男阴女）' : '逆行（阴男阳女）' },
      { k: '第一步大运', v: c.dayun[0] + '（' + q.age + '岁起）' }
    ],
    text: '"起运"指从几岁开始进入大运节奏，"交运"是具体换运的年份。'
      + '大运每十年一步，相当于人生的大背景；流年是每年的具体天气。'
      + '你的第一步大运从 ' + q.age + ' 岁开始，此后按' + (q.forward ? '顺' : '逆') + '行排列。'
  });

  return out;
}

/** 流年详情 */
function bzLiunianDetail(c, year) {
  var dg = c.dayMaster;
  var idx = ((year - 1984) % 60 + 60) % 60;
  var gz = JIAZI[idx];
  var lnGan = gz[0], lnZhi = gz[1];
  var lnGod = tenGod(dg, lnGan);

  var birthYear = new Date(c.ms + 8 * 3600000).getUTCFullYear();
  var birthMonth = new Date(c.ms + 8 * 3600000).getUTCMonth() + 1;
  var age = year - birthYear + 1;

  var q = c.qiyun, step = null;
  for (var i = 0; i < c.dayun.length; i++) {
    var lo = q.age + i * 10, hi = lo + 10;
    if (lo <= age && age < hi) {
      step = { gz: c.dayun[i], from: lo, to: hi, idx: i };
      break;
    }
  }

  var info = BZ_TEN_GOD_INFO[lnGod] || {};
  var parts = [year + '年 ' + gz + '（' + lnGod + '年）'];
  if (step) {
    var dyGod = tenGod(dg, step.gz[0]);
    parts.push('正行 ' + step.gz + ' 大运（' + step.from + '-' + step.to + '岁，' + dyGod + '运）');
  } else if (age < q.age) {
    parts.push(age + '岁，尚未交运（' + q.age + '岁起运）');
  }

  var NAMES = ['年支', '月支', '日支', '时支'];
  var relations = [];
  for (var j = 0; j < 4; j++) {
    var z = c.pillarList[j][1];
    if (BZ_CHONG[lnZhi] === z) relations.push('流年' + lnZhi + '冲' + NAMES[j] + z);
    else if (BZ_HE[lnZhi] === z) relations.push('流年' + lnZhi + '合' + NAMES[j] + z);
  }

  return {
    year: year, gz: gz, age: age, god: lnGod,
    godTopic: info.topic || '',
    godGood: info.good || '', godBad: info.bad || '',
    step: step, relations: relations,
    summary: parts.join('；'),
    advice: bzLiunianAdvice(lnGod, relations)
  };
}

function bzLiunianAdvice(god, relations) {
  var base = {
    '比肩': '同辈助力多，适合合作与团队推进，但注意利益分配。',
    '劫财': '竞争与开销同时增加，忌合伙投资、忌为人担保。',
    '食神': '心态舒展之年，适合创作、学习、享受生活，利健康调理。',
    '伤官': '表达欲强、想法多，宜创新突破；但须收敛言辞，勿与上级冲突。',
    '偏财': '有意外机会与进财渠道，适合拓展人脉，但不宜压重注。',
    '正财': '收入稳定，适合积累与长期规划，宜勤俭持家。',
    '七杀': '压力与挑战集中，扛得住就是进阶，忌冒险与争执。',
    '正官': '事业与名分之事多，适合求升迁、办证件、端正行事。',
    '偏印': '灵感多但心易散，适合钻研冷门技术，须防思虑过度。',
    '正印': '有长辈与贵人扶持，适合读书进修、调养身体。'
  }[god] || '';
  var extra = '';
  var hasChong = relations.some(function (r) { return r.indexOf('冲') > 0; });
  var hasHe = relations.some(function (r) { return r.indexOf('合') > 0; });
  if (hasChong) extra = '本年有冲，动象明显——可能涉及搬迁、换工作、关系变动，宜提前规划。';
  else if (hasHe) extra = '本年有合，人事易成，适合谈合作、办婚事、增进关系。';
  return base + extra;
}
