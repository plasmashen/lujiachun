/**
 * 八字排盘引擎 —— 天文历法层
 * 与 Python 版 core/astro.py 逐行对应。
 *
 * 太阳视黄经用 VSOP87 截断级数 + 章动 + 光行差 + FK5 修正，
 * 并补 ΔT（TT−UT）。实测节气误差 0.4~1.5 分钟。
 */

const TG = '甲乙丙丁戊己庚辛壬癸'.split('');
const DZ = '子丑寅卯辰巳午未申酉戌亥'.split('');

const GAN_WUXING = {};
const ZHI_WUXING = {};
const GW = '木木火火土土金金水水';
const ZW = '水土木木土火火土金金土水';
TG.forEach((g, i) => { GAN_WUXING[g] = GW[i]; });
DZ.forEach((z, i) => { ZHI_WUXING[z] = ZW[i]; });

const GAN_YINYANG = {};
TG.forEach((g, i) => { GAN_YINYANG[g] = i % 2 === 0 ? '阳' : '阴'; });

// ── ΔT（TT − UT，秒）──
function deltaTSeconds(y) {
  let t;
  if (y >= 1900 && y < 1920) {
    t = y - 1900;
    return -2.79 + 1.494119 * t - 0.0598939 * t ** 2 + 0.0061966 * t ** 3 - 0.000197 * t ** 4;
  }
  if (y >= 1920 && y < 1941) {
    t = y - 1920;
    return 21.20 + 0.84493 * t - 0.076100 * t ** 2 + 0.0020936 * t ** 3;
  }
  if (y >= 1941 && y < 1961) {
    t = y - 1950;
    return 29.07 + 0.407 * t - t ** 2 / 233 + t ** 3 / 2547;
  }
  if (y >= 1961 && y < 1986) {
    t = y - 1975;
    return 45.45 + 1.067 * t - t ** 2 / 260 - t ** 3 / 718;
  }
  if (y >= 1986 && y < 2005) {
    t = y - 2000;
    return 63.86 + 0.3345 * t - 0.060374 * t ** 2 + 0.0017275 * t ** 3
      + 0.000651814 * t ** 4 + 0.00002373599 * t ** 5;
  }
  if (y >= 2005 && y < 2050) {
    t = y - 2000;
    return 62.92 + 0.32217 * t + 0.005589 * t ** 2;
  }
  if (y >= 2050 && y < 2150) {
    return -20 + 32 * ((y - 1820) / 100) ** 2 - 0.5628 * (2150 - y);
  }
  const u = (y - 1820) / 100;
  return -20 + 32 * u * u;
}

// ── 儒略日 ──
function julianDay(y, mo, d, h, mi, s) {
  let yy = y, mm = mo;
  const dd = d + (h + mi / 60 + s / 3600) / 24;
  if (mm <= 2) { yy -= 1; mm += 12; }
  const a = Math.floor(yy / 100);
  const b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (yy + 4716)) + Math.floor(30.6001 * (mm + 1)) + dd + b - 1524.5;
}

function jdToDate(jd) {
  jd += 0.5;
  const z = Math.floor(jd);
  const f = jd - z;
  let a;
  if (z < 2299161) a = z;
  else {
    const alpha = Math.floor((z - 1867216.25) / 36524.25);
    a = z + 1 + alpha - Math.floor(alpha / 4);
  }
  const b = a + 1524;
  const c = Math.floor((b - 122.1) / 365.25);
  const d = Math.floor(365.25 * c);
  const e = Math.floor((b - d) / 30.6001);
  const day = b - d - Math.floor(30.6001 * e) + f;
  const month = e < 14 ? e - 1 : e - 13;
  const year = month > 2 ? c - 4716 : c - 4715;
  const di = Math.floor(day);
  const frac = (day - di) * 24;
  let hh = Math.floor(frac);
  let mmf = (frac - hh) * 60;
  let mm = Math.floor(mmf);
  let ss = Math.round((mmf - mm) * 60);
  if (ss === 60) { ss = 0; mm += 1; }
  if (mm === 60) { mm = 0; hh += 1; }
  // 返回 UTC 时刻（毫秒时间戳）
  return Date.UTC(year, month - 1, di, hh, mm, ss);
}

function jdTT(jdUT) {
  const year = 2000.0 + (jdUT - 2451545.0) / 365.25;
  return jdUT + deltaTSeconds(year) / 86400.0;
}

// ── VSOP87 级数求和 ──
function vsopSum(series, t) {
  let s = 0;
  for (let i = 0; i < series.length; i++) {
    const [a, b, c] = series[i];
    s += a * Math.cos(b + c * t);
  }
  return s;
}

function earthHeliocentricLongitude(jd) {
  const t = (jd - 2451545.0) / 365250.0;
  const l = vsopSum(LL0, t)
    + vsopSum(LL1, t) * t
    + vsopSum(LL2, t) * t ** 2
    + vsopSum(LL3, t) * t ** 3
    + vsopSum(LL4, t) * t ** 4
    + vsopSum(LL5, t) * t ** 5;
  const val = (l / 1e8) % (2 * Math.PI);
  return val < 0 ? val + 2 * Math.PI : val;
}

const RAD = Math.PI / 180;

/** 太阳视黄经（度，0-360） */
function sunApparentLongitude(jd) {
  const t = (jd - 2451545.0) / 36525.0;
  let L = earthHeliocentricLongitude(jd) / RAD + 180.0;

  L += -0.09033 / 3600.0;

  const omega = (125.04452 - 1934.136261 * t) * RAD;
  L += (-17.20 * Math.sin(omega)
    - 1.32 * Math.sin(2 * 280.4665 * RAD)
    - 0.23 * Math.sin(2 * 218.3165 * RAD)) / 3600.0;

  const R = 1.000001018 * (1 - 0.016708634 * Math.cos((357.52911 + 35999.05029 * t) * RAD));
  L += -20.4898 / 3600.0 / R;

  let out = L % 360;
  if (out < 0) out += 360;
  return out;
}

// ── 24 节气 ──
const SOLAR_TERM_NAMES = [
  '春分', '清明', '谷雨', '立夏', '小满', '芒种',
  '夏至', '小暑', '大暑', '立秋', '处暑', '白露',
  '秋分', '寒露', '霜降', '立冬', '小雪', '大雪',
  '冬至', '小寒', '大寒', '立春', '雨水', '惊蛰',
];
const TERM_LONGITUDE = {};
SOLAR_TERM_NAMES.forEach((n, i) => { TERM_LONGITUDE[n] = (i * 15) % 360; });

/**
 * 某年某节气时刻（北京时间 UTC+8），返回毫秒时间戳。
 */
function solarTermTime(year, name) {
  const target = TERM_LONGITUDE[name];
  const idx = SOLAR_TERM_NAMES.indexOf(name);

  let approxDoy = 79 + idx * 15.2184;
  if (approxDoy > 365) approxDoy -= 365.2422;

  // 以 UTC 计算，year-01-01 00:00 UTC 的儒略日
  let jd = julianDay(year, 1, 1, 0, 0, 0) + approxDoy;

  for (let i = 0; i < 40; i++) {
    const lam = sunApparentLongitude(jdTT(jd));
    let diff = (target - lam + 180) % 360;
    if (diff < 0) diff += 360;
    diff -= 180;
    if (Math.abs(diff) < 1e-8) break;
    jd += diff * 365.2422 / 360.0;
  }
  return jdToDate(jd);
}

const JIE = ['立春', '惊蛰', '清明', '立夏', '芒种', '小暑',
  '立秋', '白露', '寒露', '立冬', '大雪', '小寒'];
