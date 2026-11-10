﻿/**
 * 八字排盘引擎 —— 干支历法与命理要素
 * 与 Python 版 core/ganzhi.py + core/elements.py + core/extras.py 对应。
 */

// ── 60 甲子 ──
const JIAZI = [];
for (let i = 0; i < 60; i++) JIAZI.push(TG[i % 10] + DZ[i % 12]);
const jiaziOf = i => JIAZI[((i % 60) + 60) % 60];

// ── 地支藏干 ──
const ZHI_CANGGAN = {
  '子': ['癸'], '丑': ['己', '癸', '辛'], '寅': ['甲', '丙', '戊'], '卯': ['乙'],
  '辰': ['戊', '乙', '癸'], '巳': ['丙', '庚', '戊'], '午': ['丁', '己'],
  '未': ['己', '丁', '乙'], '申': ['庚', '壬', '戊'], '酉': ['辛'],
  '戌': ['戊', '辛', '丁'], '亥': ['壬', '甲'],
};

// ── 十神 ──
const WX_SHENG = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
const WX_KE = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };

function wuxingOf(ch) { return GAN_WUXING[ch] || ZHI_WUXING[ch]; }
function yinyangOf(gan) { return TG.indexOf(gan) % 2 === 0 ? '阳' : '阴'; }

function tenGod(dayGan, other) {
  const meWx = wuxingOf(dayGan), itWx = wuxingOf(other);
  const sameYY = yinyangOf(dayGan) === yinyangOf(other);
  if (itWx === meWx) return sameYY ? '比肩' : '劫财';
  if (WX_SHENG[meWx] === itWx) return sameYY ? '食神' : '伤官';
  if (WX_KE[meWx] === itWx) return sameYY ? '偏财' : '正财';
  if (WX_KE[itWx] === meWx) return sameYY ? '七杀' : '正官';
  if (WX_SHENG[itWx] === meWx) return sameYY ? '偏印' : '正印';
  return '?';
}

// ── 纳音 ──
const NAYIN_PAIRS = [
  ['甲子', '乙丑', '海中金'], ['丙寅', '丁卯', '炉中火'], ['戊辰', '己巳', '大林木'],
  ['庚午', '辛未', '路旁土'], ['壬申', '癸酉', '剑锋金'], ['甲戌', '乙亥', '山头火'],
  ['丙子', '丁丑', '涧下水'], ['戊寅', '己卯', '城头土'], ['庚辰', '辛巳', '白蜡金'],
  ['壬午', '癸未', '杨柳木'], ['甲申', '乙酉', '泉中水'], ['丙戌', '丁亥', '屋上土'],
  ['戊子', '己丑', '霹雳火'], ['庚寅', '辛卯', '松柏木'], ['壬辰', '癸巳', '长流水'],
  ['甲午', '乙未', '沙中金'], ['丙申', '丁酉', '山下火'], ['戊戌', '己亥', '平地木'],
  ['庚子', '辛丑', '壁上土'], ['壬寅', '癸卯', '金箔金'], ['甲辰', '乙巳', '覆灯火'],
  ['丙午', '丁未', '天河水'], ['戊申', '己酉', '大驿土'], ['庚戌', '辛亥', '钗钏金'],
  ['壬子', '癸丑', '桑柘木'], ['甲寅', '乙卯', '大溪水'], ['丙辰', '丁巳', '沙中土'],
  ['戊午', '己未', '天上火'], ['庚申', '辛酉', '石榴木'], ['壬戌', '癸亥', '大海水'],
];
const NAYIN = {};
NAYIN_PAIRS.forEach(([a, b, n]) => { NAYIN[a] = n; NAYIN[b] = n; });
const nayin = gz => NAYIN[gz] || '';

// ── 十二长生 ──
const CHANGSHENG_NAMES = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰',
  '病', '死', '墓', '绝', '胎', '养'];
const CS_START = { '甲': '亥', '乙': '午', '丙': '寅', '丁': '酉', '戊': '寅',
  '己': '酉', '庚': '巳', '辛': '子', '壬': '申', '癸': '卯' };
const YANG_GAN = new Set(['甲', '丙', '戊', '庚', '壬']);

function changsheng(gan, zhi) {
  const si = DZ.indexOf(CS_START[gan]);
  const zi = DZ.indexOf(zhi);
  const step = YANG_GAN.has(gan) ? ((zi - si) % 12 + 12) % 12 : ((si - zi) % 12 + 12) % 12;
  return CHANGSHENG_NAMES[step];
}
// 星运：日干看各柱地支
const xingyunOf = (dayGan, zhi) => changsheng(dayGan, zhi);
// 自坐：本柱天干看本柱地支
const zizuoOf = (gan, zhi) => changsheng(gan, zhi);

// ── 空亡 ──
function kongwang(gz) {
  const g = TG.indexOf(gz[0]), z = DZ.indexOf(gz[1]);
  const xunStart = ((z - g) % 12 + 12) % 12;
  return DZ[(xunStart + 10) % 12] + DZ[(xunStart + 11) % 12];
}

// ── 神煞见 shensha.js（42 种已验证规则）──

// ── 四柱 ──
const CST_OFFSET_MS = 8 * 3600 * 1000;

/** 把「北京时间」的字段打包成 UTC 时间戳（便于统一计算天差） */
function cstMs(y, mo, d, h = 0, mi = 0, s = 0) {
  return Date.UTC(y, mo - 1, d, h, mi, s) - CST_OFFSET_MS;
}

function yearPillar(ms) {
  const dt = new Date(ms + CST_OFFSET_MS);
  let year = dt.getUTCFullYear();
  const lichun = solarTermTime(year, '立春');
  if (ms < lichun) year -= 1;
  return { gz: jiaziOf(year - 1984), year };
}

const JIE_MAP = { '立春': 0, '惊蛰': 1, '清明': 2, '立夏': 3, '芒种': 4, '小暑': 5,
  '立秋': 6, '白露': 7, '寒露': 8, '立冬': 9, '大雪': 10, '小寒': 11 };

function monthPillar(ms) {
  const { gz: yearGz } = yearPillar(ms);
  const yearGanIdx = TG.indexOf(yearGz[0]);
  const dt = new Date(ms + CST_OFFSET_MS);
  const y = dt.getUTCFullYear();

  const bounds = [];
  for (const yy of [y - 1, y, y + 1]) {
    for (const name of Object.keys(JIE_MAP)) {
      bounds.push([solarTermTime(yy, name), JIE_MAP[name]]);
    }
  }
  bounds.sort((a, b) => a[0] - b[0]);

  let zi = null;
  for (const [t, z] of bounds) {
    if (ms >= t) zi = z; else break;
  }
  if (zi === null) zi = bounds[bounds.length - 1][1];

  const firstGan = (yearGanIdx * 2 + 2) % 10;
  const gan = TG[(firstGan + zi) % 10];
  const zhi = DZ[(2 + zi) % 12];
  return { gz: gan + zhi, zi };
}

// 日柱基准：1949-10-01 = 甲子
const DAY_EPOCH = cstMs(1949, 10, 1);
function dayPillar(ms, lateZiAdvance = true) {
  let base = ms;
  if (lateZiAdvance) {
    const dt = new Date(ms + CST_OFFSET_MS);
    if (dt.getUTCHours() >= 23) base = ms + 86400000;
  }
  const d = new Date(base + CST_OFFSET_MS);
  const dayMs = cstMs(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  const days = Math.round((dayMs - DAY_EPOCH) / 86400000);
  return jiaziOf(days);
}

function hourBranchIndex(ms) {
  const h = new Date(ms + CST_OFFSET_MS).getUTCHours();
  return Math.floor((h + 1) / 2) % 12;
}

function hourPillar(ms, lateZiAdvance = true) {
  const dayGz = dayPillar(ms, lateZiAdvance);
  const dayGanIdx = TG.indexOf(dayGz[0]);
  const zi = hourBranchIndex(ms);
  const gan = TG[(dayGanIdx * 2 + zi) % 10];
  return gan + DZ[zi];
}

function fourPillars(ms, lateZiAdvance = true) {
  const y = yearPillar(ms);
  const m = monthPillar(ms);
  const d = dayPillar(ms, lateZiAdvance);
  const h = hourPillar(ms, lateZiAdvance);
  return { year: y.gz, month: m.gz, day: d, hour: h,
    yearNum: y.year, monthZi: m.zi };
}

// ── 外延要素 ──
const WUHU = { '甲': 2, '己': 2, '乙': 4, '庚': 4, '丙': 6, '辛': 6,
  '丁': 8, '壬': 8, '戊': 0, '癸': 0 };
const GAN_HE = { '甲': '己', '己': '甲', '乙': '庚', '庚': '乙', '丙': '辛',
  '辛': '丙', '丁': '壬', '壬': '丁', '戊': '癸', '癸': '戊' };
const ZHI_HE = { '子': '丑', '丑': '子', '寅': '亥', '亥': '寅', '卯': '戌',
  '戌': '卯', '辰': '酉', '酉': '辰', '巳': '申', '申': '巳',
  '午': '未', '未': '午' };

function gzWithYearGan(yearGan, zhi) {
  const first = WUHU[yearGan] % 10;
  const zi = ((DZ.indexOf(zhi) - 2) % 12 + 12) % 12;
  return TG[(first + zi) % 10] + zhi;
}

const taiyuan = monthGz => TG[(TG.indexOf(monthGz[0]) + 1) % 10]
  + DZ[(DZ.indexOf(monthGz[1]) + 3) % 12];

const taixi = dayGz => GAN_HE[dayGz[0]] + ZHI_HE[dayGz[1]];

function minggong(yearGan, monthZhi, hourZhi) {
  const mi = DZ.indexOf(monthZhi), hi = DZ.indexOf(hourZhi);
  return gzWithYearGan(yearGan, DZ[((17 - mi - hi) % 12 + 12) % 12]);
}

function shengong(yearGan, monthZhi, hourZhi) {
  const mi = DZ.indexOf(monthZhi), hi = DZ.indexOf(hourZhi);
  return gzWithYearGan(yearGan, DZ[(mi + hi + 1) % 12]);
}

// ── 起运 / 大运 ──
function qiyunAge(ms, yearGan, sex) {
  const yangYear = TG.indexOf(yearGan) % 2 === 0;
  const forward = (yangYear && sex === 1) || (!yangYear && sex === 2);

  const y = new Date(ms + CST_OFFSET_MS).getUTCFullYear();
  const bounds = [];
  for (const yy of [y - 1, y, y + 1]) {
    for (const name of JIE) bounds.push([solarTermTime(yy, name), name]);
  }
  bounds.sort((a, b) => a[0] - b[0]);

  let delta, jieMs, jieName;
  if (forward) {
    const nx = bounds.find(b => b[0] > ms);
    jieMs = nx[0]; jieName = nx[1]; delta = jieMs - ms;
  } else {
    const pv = bounds.filter(b => b[0] <= ms).pop();
    jieMs = pv[0]; jieName = pv[1]; delta = ms - jieMs;
  }

  // 问真换算（已用 2520 条样本逐位验证）：
  //   名义秒 = 距节真实秒 × 120
  //   1 年 = 360 天，1 月 = 30 天，1 天 = 24 时，1 时 = 60 分
  const totalNominal = Math.round(delta / 1000 * 120);
  const YEAR = 360 * 86400, MONTH = 30 * 86400;
  let rem = totalNominal;
  const yInt = Math.floor(rem / YEAR); rem -= yInt * YEAR;
  const mInt = Math.floor(rem / MONTH); rem -= mInt * MONTH;
  const dInt = Math.floor(rem / 86400); rem -= dInt * 86400;
  const hours = Math.floor(rem / 3600); rem -= hours * 3600;
  const minutes = Math.floor(rem / 60);
  const seconds = rem % 60;

  // 交运日期 = 出生 + 年/月/日（按公历年月推进，保留出生时分秒）
  const bd = new Date(ms + CST_OFFSET_MS);
  const totalMonths = bd.getUTCMonth() + 1 + mInt;
  const ty = bd.getUTCFullYear() + yInt + Math.floor((totalMonths - 1) / 12);
  const tm = ((totalMonths - 1) % 12 + 12) % 12 + 1;
  const jiaoyunMs = cstMs(ty, tm, bd.getUTCDate() + dInt,
    bd.getUTCHours(), bd.getUTCMinutes(), bd.getUTCSeconds());

  return { forward, age: yInt, months: mInt, days: dInt,
    hours, minutes, seconds,
    qiyunsui: yInt + 1,
    jiaoyun: jiaoyunMs, jieMs, jieName,
    totalDays: Math.round(delta / 86400000 * 10000) / 10000 };
}

// 交运描述串：逢X、Y年 <节>后N天 交大运
function jiaoyunText(qy) {
  const jyY = yearPillar(qy.jiaoyun).gz[0];
  const HE = { '甲': '己', '己': '甲', '乙': '庚', '庚': '乙', '丙': '辛',
    '辛': '丙', '丁': '壬', '壬': '丁', '戊': '癸', '癸': '戊' };
  const yy = new Date(qy.jiaoyun + CST_OFFSET_MS).getUTCFullYear();
  const b = [];
  for (const y0 of [yy - 1, yy, yy + 1]) {
    for (const nm of JIE) b.push([solarTermTime(y0, nm), nm]);
  }
  b.sort((a, c) => a[0] - c[0]);
  const prev = b.filter(x => x[0] <= qy.jiaoyun).pop();
  const days = Math.round((qy.jiaoyun - prev[0]) / 86400000);
  return '逢' + jyY + '、' + HE[jyY] + '年 ' + prev[1] + '后' + days + '天 交大运';
}

function dayunList(monthGz, forward, count = 12) {
  const idx = JIAZI.indexOf(monthGz);
  const step = forward ? 1 : -1;
  const out = [];
  for (let i = 0; i < count; i++) out.push(JIAZI[((idx + step * (i + 1)) % 60 + 60) % 60]);
  return out;
}

// 小运：xy[59] = 时柱，xy[59+k] = 时柱 + k·step（已验证 2384/2384）
function xiaoyunList(hourGz, forward, count = 110) {
  const idx = JIAZI.indexOf(hourGz);
  const step = forward ? 1 : -1;
  const ANCHOR = 59;
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push(JIAZI[((idx + step * (i - ANCHOR)) % 60 + 60) % 60]);
  }
  return out;
}

// 胎对八字（tdbz）：问真返回的是「今天 00:00（子时）」的四柱，与出生时间无关
function tdbzOf(nowMs) {
  const nd = new Date(nowMs + CST_OFFSET_MS);
  const midnight = cstMs(nd.getUTCFullYear(), nd.getUTCMonth() + 1, nd.getUTCDate(), 0, 0, 0);
  const p = fourPillars(midnight);
  return [p.year, p.month, p.day, p.hour];
}

// ── 五行统计 ──
function wuxingCount(p) {
  const cnt = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 };
  for (const k of ['year', 'month', 'day', 'hour']) {
    cnt[GAN_WUXING[p[k][0]]]++;
    cnt[ZHI_WUXING[p[k][1]]]++;
  }
  return cnt;
}

function wuxingScore(p) {
  const score = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 };
  const weights = [1.0, 0.5, 0.3];
  for (const k of ['year', 'month', 'day', 'hour']) {
    score[GAN_WUXING[p[k][0]]] += 1.0;
    ZHI_CANGGAN[p[k][1]].forEach((cg, i) => {
      score[GAN_WUXING[cg]] += weights[Math.min(i, 2)];
    });
  }
  const out = {};
  for (const k in score) out[k] = Math.round(score[k] * 100) / 100;
  return out;
}

// ── 主入口 ──
function paipan(ms, sex = 1, lateZiAdvance = true) {
  const p = fourPillars(ms, lateZiAdvance);
  const pillars = [p.year, p.month, p.day, p.hour];
  const dg = p.day[0];

  const tenGods = [tenGod(dg, p.year[0]), tenGod(dg, p.month[0]), '日主', tenGod(dg, p.hour[0])];
  const canggan = pillars.map(gz => ZHI_CANGGAN[gz[1]]);
  const cangganGods = canggan.map(cg => cg.map(c => tenGod(dg, c)));
  const xingyun = pillars.map(gz => xingyunOf(dg, gz[1]));
  const zizuo = pillars.map(gz => zizuoOf(gz[0], gz[1]));
  const nayinList = pillars.map(nayin);
  const kongwangList = pillars.map(kongwang);

  const ty = taiyuan(p.month);
  const tx = taixi(p.day);
  const mg = minggong(p.year[0], p.month[1], p.hour[1]);
  const sg = shengong(p.year[0], p.month[1], p.hour[1]);

  const qy = qiyunAge(ms, p.year[0], sex);
  const dayun = dayunList(p.month, qy.forward, 12);
  const xiaoyun = xiaoyunList(p.hour, qy.forward, 110);
  qy.jiaoyunText = jiaoyunText(qy);

  // 神煞：42 种已验证规则（shensha.js）
  const shensha = bzAllShensha(pillars);

  // 大运神煞：把大运干支当作「时柱」再取该柱神煞
  const dyshensha = dayun.map(function (gz) {
    const tmp = pillars.slice();
    tmp[3] = gz;
    return [gz, bzShenshaForPillar(tmp, 3)];
  });

  // 胎对八字 = 今天的四柱
  const nowMs = Date.now();
  const tdbz = tdbzOf(nowMs);

  return {
    ms, sex,
    pillars: { year: p.year, month: p.month, day: p.day, hour: p.hour },
    pillarList: pillars,
    dayMaster: dg,
    dayMasterWuxing: GAN_WUXING[dg],
    dayMasterYinyang: GAN_YINYANG[dg],
    tenGods, canggan, cangganGods,
    nayin: nayinList, xingyun, zizuo, kongwang: kongwangList, shensha,
    taiyuan: ty, taiyuanNayin: nayin(ty),
    taixi: tx, taixiNayin: nayin(tx),
    minggong: mg, minggongNayin: nayin(mg),
    shengong: sg, shengongNayin: nayin(sg),
    qiyun: qy, dayun, xiaoyun, dyshensha, tdbz,
    wuxingCount: wuxingCount(p),
    wuxingScore: wuxingScore(p),
  };
}
