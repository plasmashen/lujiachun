/* 农历转换（真朔望月天文算法）
 *
 * 问真 bz["8"] 返回「1990年四月廿一 巳时」这类农历串。
 * 移植自 core/lunar.py，全量 7651 样本验证 99.97%。
 *
 * 关键规则：
 *   - 朔在当日即为初一（不问时刻）
 *   - 含冬至之月必为十一月
 *   - 无中气之月为闰月
 *   - 23:00 起算次日（问真早子时口径）
 */
var bzLunar = (function () {
  var MONTH_NAMES = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
  var DAY_NAMES = [
    '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
    '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '廿十',
    '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '卅十'
  ];
  var ZHI = '子丑寅卯辰巳午未申酉戌亥';
  var CST_MS = 8 * 3600 * 1000;

  function newMoonJD(k) {
    var T = k / 1236.85;
    var jde = 2451550.09766 + 29.530588861 * k
      + 0.00015437 * T * T - 0.000000150 * T * T * T
      + 0.00000000073 * T * T * T * T;
    var E = 1 - 0.002516 * T - 0.0000074 * T * T;
    function rad(d) { return d * Math.PI / 180; }
    var M = rad(2.5534 + 29.10535670 * k - 0.0000014 * T * T - 0.00000011 * T * T * T);
    var Mp = rad(201.5643 + 385.81693528 * k + 0.0107582 * T * T
      + 0.00001238 * T * T * T - 0.000000058 * T * T * T * T);
    var F = rad(160.7108 + 390.67050284 * k - 0.0016118 * T * T
      - 0.00000227 * T * T * T + 0.000000011 * T * T * T * T);
    var Om = rad(124.7746 - 1.56375588 * k + 0.0020672 * T * T + 0.00000215 * T * T * T);

    var corr = -0.40720 * Math.sin(Mp)
      + 0.17241 * E * Math.sin(M)
      + 0.01608 * Math.sin(2 * Mp)
      + 0.01039 * Math.sin(2 * F)
      + 0.00739 * E * Math.sin(Mp - M)
      - 0.00514 * E * Math.sin(Mp + M)
      + 0.00208 * E * E * Math.sin(2 * M)
      - 0.00111 * Math.sin(Mp - 2 * F)
      - 0.00057 * Math.sin(Mp + 2 * F)
      + 0.00056 * E * Math.sin(2 * Mp + M)
      - 0.00042 * Math.sin(3 * Mp)
      + 0.00042 * E * Math.sin(M + 2 * F)
      + 0.00038 * E * Math.sin(M - 2 * F)
      - 0.00024 * E * Math.sin(2 * Mp - M)
      - 0.00017 * Math.sin(Om)
      - 0.00007 * Math.sin(Mp + 2 * M)
      + 0.00004 * Math.sin(2 * Mp - 2 * F)
      + 0.00004 * Math.sin(3 * M)
      + 0.00003 * Math.sin(Mp + M - 2 * F)
      + 0.00003 * Math.sin(2 * Mp + 2 * F)
      - 0.00003 * Math.sin(Mp + M + 2 * F)
      + 0.00003 * Math.sin(Mp - M + 2 * F)
      - 0.00002 * Math.sin(Mp - M - 2 * F)
      - 0.00002 * Math.sin(3 * Mp + M)
      + 0.00002 * Math.sin(4 * Mp);

    var A1 = rad(299.77 + 0.107408 * k - 0.009173 * T * T);
    var A2 = rad(251.88 + 0.016321 * k);
    var A3 = rad(251.83 + 26.651886 * k);
    var A4 = rad(349.42 + 36.412478 * k);
    var A5 = rad(84.66 + 18.206239 * k);
    var A6 = rad(141.74 + 53.303771 * k);
    var A7 = rad(207.14 + 2.453732 * k);
    var A8 = rad(154.84 + 7.306860 * k);
    var A9 = rad(34.52 + 27.261239 * k);
    var A10 = rad(207.19 + 0.121824 * k);
    var A11 = rad(291.34 + 1.844379 * k);
    var A12 = rad(161.72 + 24.198154 * k);
    var A13 = rad(239.56 + 25.513099 * k);
    var A14 = rad(331.55 + 3.592518 * k);
    corr += 0.000325 * Math.sin(A1) + 0.000165 * Math.sin(A2)
      + 0.000164 * Math.sin(A3) + 0.000126 * Math.sin(A4)
      + 0.000110 * Math.sin(A5) + 0.000062 * Math.sin(A6)
      + 0.000060 * Math.sin(A7) + 0.000056 * Math.sin(A8)
      + 0.000047 * Math.sin(A9) + 0.000042 * Math.sin(A10)
      + 0.000040 * Math.sin(A11) + 0.000037 * Math.sin(A12)
      + 0.000035 * Math.sin(A13) + 0.000023 * Math.sin(A14);
    return jde + corr;
  }

  function sunLongitude(jd) {
    var T = (jd - 2451545.0) / 36525;
    var L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
    var M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * Math.PI / 180;
    var C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M)
      + (0.019993 - 0.000101 * T) * Math.sin(2 * M)
      + 0.000289 * Math.sin(3 * M);
    var omega = (125.04 - 1934.136 * T) * Math.PI / 180;
    return ((L0 + C - 0.00569 - 0.00478 * Math.sin(omega)) % 360 + 360) % 360;
  }

  /* 北京日期（Y*10000+M*100+D）→ 便于比较 */
  function bjDateNum(ms) {
    var d = new Date(ms + CST_MS);
    return d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
  }

  /* 儒略日 → 毫秒时间戳 */
  function jdToMs(jd) {
    return (jd - 2440587.5) * 86400000;
  }

  /* 毫秒时间戳 → 儒略日 */
  function msToJD(ms) {
    return ms / 86400000 + 2440587.5;
  }

  /* 某年冬至的儒略日 */
  function dongzhiJD(year) {
    var base = msToJD(Date.UTC(year, 0, 1));
    var lo = base, hi = base + 400;
    var target = 270;
    for (var i = 0; i < 60; i++) {
      var mid = (lo + hi) / 2;
      var d = ((sunLongitude(mid) - target + 180) % 360 + 360) % 360 - 180;
      if (d < 0) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  function nmDateNum(k) { return bjDateNum(jdToMs(newMoonJD(k))); }

  function dzMonthK(year) {
    var dzJD = dongzhiJD(year);
    var dzNum = bjDateNum(jdToMs(dzJD));
    var kk = Math.floor((dzJD - 2451550.09766) / 29.530588861);
    while (nmDateNum(kk + 1) <= dzNum) kk++;
    while (nmDateNum(kk) > dzNum) kk--;
    return kk;
  }

  function hasZhongqi(kk) {
    var nm = newMoonJD(kk);
    var nm2 = newMoonJD(kk + 1);
    var d1 = bjDateNum(jdToMs(nm));
    var d2 = bjDateNum(jdToMs(nm2));
    var lon1 = sunLongitude(nm);
    var span = ((sunLongitude(nm2) - lon1) % 360 + 360) % 360;
    for (var deg = 0; deg < 360; deg += 30) {
      var off = ((deg - lon1) % 360 + 360) % 360;
      if (off >= span) continue;
      var lo = nm, hi = nm2;
      for (var i = 0; i < 60; i++) {
        var mid = (lo + hi) / 2;
        var d = ((sunLongitude(mid) - deg + 180) % 360 + 360) % 360 - 180;
        if (d < 0) lo = mid; else hi = mid;
      }
      var td = bjDateNum(jdToMs((lo + hi) / 2));
      if (td >= d1 && td < d2) return true;
    }
    return false;
  }

  /* 主函数：毫秒时间戳 → {year, month, isLeap, day} */
  function solarToLunar(ms) {
    var bj = new Date(ms + CST_MS);
    var curNum = bj.getUTCFullYear() * 10000 + (bj.getUTCMonth() + 1) * 100 + bj.getUTCDate();
    var hour = bj.getUTCHours();
    if (hour >= 23) {
      var nxt = new Date(ms + CST_MS + 86400000);
      curNum = nxt.getUTCFullYear() * 10000 + (nxt.getUTCMonth() + 1) * 100 + nxt.getUTCDate();
    }

    var k = Math.floor((msToJD(ms) - 2451550.09766) / 29.530588861);
    while (nmDateNum(k + 1) <= curNum) k++;
    while (nmDateNum(k) > curNum) k--;

    /* 找包含 curNum 的冬至区间 */
    var y0 = Math.floor(curNum / 10000);
    var cands = [];
    for (var yy = y0 - 1; yy <= y0 + 1; yy++) {
      cands.push({ y: yy, k: dzMonthK(yy), d: bjDateNum(jdToMs(dongzhiJD(yy))) });
    }
    cands.sort(function (a, b) { return a.d - b.d; });

    var seg = null;
    for (var i = 0; i < cands.length - 1; i++) {
      if (cands[i].d <= curNum && curNum < cands[i + 1].d) {
        seg = [cands[i], cands[i + 1]];
        break;
      }
    }
    if (!seg) seg = [cands[cands.length - 2], cands[cands.length - 1]];

    var k11 = seg[0].k, kNext = seg[1].k;
    var nMonths = kNext - k11;
    var leapK = null;
    if (nMonths === 13) {
      for (var kk = k11; kk < kNext; kk++) {
        if (!hasZhongqi(kk)) { leapK = kk; break; }
      }
      if (leapK === null) leapK = k11 + 12;
    } else {
      kNext = k11 + 12;
    }

    var offset = k - k11;
    if (leapK !== null && k >= leapK) offset -= 1;
    var month = ((11 + offset - 1) % 12 + 12) % 12 + 1;
    var isLeap = (k === leapK);

    /* 日：朔在当日即为初一 */
    var d1 = nmDateNum(k);
    var day = 1;
    var curY = Math.floor(curNum / 10000);
    var curMD = curNum % 10000;
    var curM = Math.floor(curMD / 100);
    var curD = curMD % 100;
    var nmMs = jdToMs(newMoonJD(k)) + CST_MS;
    var nmBj = new Date(nmMs);
    var t1 = Date.UTC(nmBj.getUTCFullYear(), nmBj.getUTCMonth(), nmBj.getUTCDate());
    var t2 = Date.UTC(curY, curM - 1, curD);
    day = Math.round((t2 - t1) / 86400000) + 1;

    /* 农历年 */
    var lunarYear = y0;
    if (month >= 11 && bj.getUTCMonth() + 1 <= 2) lunarYear -= 1;

    return { year: lunarYear, month: month, isLeap: isLeap, day: day };
  }

  function text(ms) {
    var bj = new Date(ms + CST_MS);
    var r = solarToLunar(ms);
    var ms2 = (r.isLeap ? '闰' : '') + MONTH_NAMES[r.month - 1] + '月';
    var ds = DAY_NAMES[r.day - 1] || String(r.day);
    var h = bj.getUTCHours();
    var zi = Math.floor((h + 1) / 2) % 12;
    return r.year + '年' + ms2 + ds + ' ' + ZHI.charAt(zi) + '时';
  }

  return { text: text, solarToLunar: solarToLunar };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = bzLunar;
}
