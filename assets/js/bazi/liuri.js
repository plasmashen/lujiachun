/**
 * 流日 / 流时 —— 在流月基础上细化到日、时
 *
 * 问真的「流日显示」「流时显示」就是这两层：
 *   流日：在流年、流月之下，列出当月每一天的日柱，标注与命盘的冲合
 *   流时：在选中的某一天里，列出十二时辰的时柱
 *
 * 干支推算复用 ganzhi.js 的 dayPillar / hourPillar（已与问真 100% 对齐）。
 */
(function (global) {
  'use strict';

  var ZHI_NAMES = ['子', '丑', '寅', '卯', '辰', '巳',
                   '午', '未', '申', '酉', '戌', '亥'];
  var HOUR_RANGE = ['23-01', '01-03', '03-05', '05-07', '07-09', '09-11',
                    '11-13', '13-15', '15-17', '17-19', '19-21', '21-23'];
  var MONTH_CN = ['', '正', '二', '三', '四', '五', '六',
                  '七', '八', '九', '十', '十一', '十二'];

  function cstDate(y, m, d) {
    // 北京时间当天 12:00，避开 23:00 换日边界
    return Date.UTC(y, m - 1, d, 4, 0, 0);
  }

  function daysInMonth(y, m) {
    return new Date(Date.UTC(y, m, 0)).getUTCDate();
  }

  /**
   * 某年某月的流日列表
   * @returns {Array} [{d, gz, gan, zhi, god, relations, isToday}]
   */
  function liuriList(c, year, month) {
    var n = daysInMonth(year, month);
    var dg = c.dayMaster;
    var out = [];
    var todayMs = Date.now();
    var td = new Date(todayMs + 8 * 3600000);
    var ty = td.getUTCFullYear(), tm = td.getUTCMonth() + 1, tday = td.getUTCDate();

    for (var d = 1; d <= n; d++) {
      var ms = cstDate(year, month, d);
      var p = dayPillar(ms);
      var gan = p[0], zhi = p[1];
      var god = tenGod(dg, gan);

      var rel = [];
      var NAMES = ['年支', '月支', '日支', '时支'];
      for (var j = 0; j < 4; j++) {
        var z = c.pillarList[j][1];
        if (BZ_CHONG[zhi] === z) rel.push('冲' + NAMES[j]);
        else if (BZ_HE[zhi] === z) rel.push('合' + NAMES[j]);
      }
      out.push({
        d: d, gz: p, gan: gan, zhi: zhi, god: god, relations: rel,
        isToday: (year === ty && month === tm && d === tday)
      });
    }
    return out;
  }

  /**
   * 某一天的十二时辰
   * @returns {Array} [{i, zhi, range, gz, god, relations}]
   */
  function liushiList(c, year, month, day) {
    var dg = c.dayMaster;
    var out = [];
    // 当天的日柱：固定取当天 12:00，避免 23:00 换日把子时算到次日
    var dayGz = dayPillar(cstDate(year, month, day));
    var dayGan = dayGz[0];
    for (var i = 0; i < 12; i++) {
      // 五鼠遁：时干 = (日干序 * 2 + 时支序) % 10
      var hg = TG[(TG.indexOf(dayGan) * 2 + i) % 10];
      var p = hg + ZHI_NAMES[i];
      var rel = [];
      var NAMES = ['年支', '月支', '日支', '时支'];
      for (var j = 0; j < 4; j++) {
        var z = c.pillarList[j][1];
        if (BZ_CHONG[p[1]] === z) rel.push('冲' + NAMES[j]);
      }
      out.push({
        i: i, zhi: ZHI_NAMES[i], range: HOUR_RANGE[i],
        gz: p, god: tenGod(dg, p[0]), relations: rel
      });
    }
    return out;
  }

  /**
   * 当月的月柱 —— 一个公历月可能跨两个节气月（如 12 月 7 日大雪换月）。
   * 返回该月内实际出现的月柱序列，按天数排序：
   *   [{gz, from, to, days}]   from/to 为公历日序（含）
   */
  function liuyueSegments(year, month) {
    var n = daysInMonth(year, month);
    var segs = [];
    for (var d = 1; d <= n; d++) {
      var p = monthPillar(cstDate(year, month, d));
      var gz = p && p.gz ? p.gz : '';
      var last = segs[segs.length - 1];
      if (last && last.gz === gz) { last.to = d; last.days++; }
      else segs.push({ gz: gz, from: d, to: d, days: 1 });
    }
    return segs;
  }

  /** 当月主月柱（天数最多的那个） */
  function liuyueGz(year, month) {
    var segs = liuyueSegments(year, month);
    var best = segs[0] || { gz: '' };
    segs.forEach(function (s) { if (s.days > best.days) best = s; });
    return best.gz;
  }

  global.bzLiuri = {
    list: liuriList,
    shi: liushiList,
    yue: liuyueGz,
    yueSegs: liuyueSegments,
    daysInMonth: daysInMonth,
    MONTH_CN: MONTH_CN
  };
})(window);
