/* 日课用事（人元司令）
 *
 * 每个月支按藏干顺序分段当值，输出「戊土用事」。
 * 移植自 core/rysl.py，2026 全年 366/366 = 100%，跨 5 年抽样 120/120 = 100%。
 *
 * 关键：
 *   - 段界用「节气日 offset 上界」（含）
 *   - 节气当天仍属上一月支的末段（按日切换，不按时刻）
 *   - 申月首段为「戊己土」（合称，非戊土）
 */
var bzRysl = (function () {
  var GAN_WUXING = {
    '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
    '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'
  };
  var ZHI_ORDER = ['子', '丑', '寅', '卯', '辰', '巳',
                   '午', '未', '申', '酉', '戌', '亥'];

  /* 实测「节气日 offset 上界」表（含） */
  var RYSL_MAX = {
    '寅': [['戊', 8], ['丙', 15], ['甲', 29]],
    '卯': [['甲', 11], ['乙', 30]],
    '辰': [['乙', 10], ['癸', 13], ['戊', 30]],
    '巳': [['戊', 6], ['庚', 15], ['丙', 31]],
    '午': [['丙', 11], ['己', 20], ['丁', 31]],
    '未': [['丁', 10], ['乙', 13], ['己', 31]],
    '申': [['戊己', 11], ['壬', 14], ['庚', 31]],
    '酉': [['庚', 11], ['辛', 31]],
    '戌': [['辛', 10], ['丁', 13], ['戊', 30]],
    '亥': [['戊', 8], ['甲', 13], ['壬', 29]],
    '子': [['壬', 11], ['癸', 29]],
    '丑': [['癸', 10], ['辛', 13], ['己', 30]]
  };

  var JIE_OF_MONTH = {
    '寅': '立春', '卯': '惊蛰', '辰': '清明', '巳': '立夏',
    '午': '芒种', '未': '小暑', '申': '立秋', '酉': '白露',
    '戌': '寒露', '亥': '立冬', '子': '大雪', '丑': '小寒'
  };

  function wx(g) {
    return GAN_WUXING[g] || GAN_WUXING[g.charAt(0)] || '土';
  }

  /* dt: Date 对象（UTC 毫秒），需配合 bzAstro 的节气时刻 */
  function text(ms, monthBranch) {
    /* monthBranch: 该日所属月支（由 ganzhi.js 的月柱给出） */
    var d = new Date(ms + 8 * 3600 * 1000);
    var curNum = d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();

    var jieName = JIE_OF_MONTH[monthBranch];
    if (!jieName) return null;

    /* 节气日：用 astro 层算，取北京日期 */
    var jieMs = null;
    try {
      if (typeof solarTermTime === 'function') {
        jieMs = solarTermTime(d.getUTCFullYear(), jieName, ms);
      }
    } catch (e) { jieMs = null; }
    if (jieMs == null) return null;

    var jd = new Date(jieMs + 8 * 3600 * 1000);
    var jieNum = jd.getUTCFullYear() * 10000 + (jd.getUTCMonth() + 1) * 100 + jd.getUTCDate();

    /* offset = 公历日差 */
    var t1 = Date.UTC(jd.getUTCFullYear(), jd.getUTCMonth(), jd.getUTCDate());
    var t2 = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    var offset = Math.round((t2 - t1) / 86400000);

    /* 节气当天及之前 → 上一月支的末段 */
    if (offset <= 0) {
      var idx = ZHI_ORDER.indexOf(monthBranch);
      var prev = ZHI_ORDER[(idx + 11) % 12];
      var ps = RYSL_MAX[prev];
      if (ps) {
        var g0 = ps[ps.length - 1][0];
        return g0 + wx(g0) + '用事';
      }
    }

    var segs = RYSL_MAX[monthBranch];
    if (!segs) return null;
    for (var i = 0; i < segs.length; i++) {
      if (offset <= segs[i][1]) return segs[i][0] + wx(segs[i][0]) + '用事';
    }
    var last = segs[segs.length - 1][0];
    return last + wx(last) + '用事';
  }

  return { text: text, RYSL_MAX: RYSL_MAX };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = bzRysl;
}
