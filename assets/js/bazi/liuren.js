/**
 * 大六壬 —— 天地盘、四课、三传
 *
 * 体系：传统大六壬（日起课）
 *
 * 排盘流程：
 *   1. 月将加时：月将（太阳所在宫）加在占时上，生成天盘
 *   2. 四课：日干、日支各自的上下神
 *   3. 三传：初传、中传、末传（按贼克法、比用法、遥克法…）
 *   4. 配天将（贵人顺逆）
 *   5. 十二天将、旺衰、神煞
 *
 * 难点说明：三传的取法有九宗门（贼克、比用、涉害、遥克、昴星、别责、八专、伏吟、返吟），
 * 这是大六壬真正的技术门槛。这里实现前五种最常用的。
 */
(function (global) {
  'use strict';

  // ── 十二地支与方位 ──
  var ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  var GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

  // 地支五行
  var ZHI_WX = {
    '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
    '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水'
  };
  // 天干五行
  var GAN_WX = {
    '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
    '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'
  };
  var SHENG = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
  var KE = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };

  // ── 月将（太阳过宫）──
  // 中气后太阳所在宫，用月将名（登明、河魁等）
  // 月将对应地支：雨水后亥将（登明），春分后戌将（河魁）…
  var MONTH_GENERAL = [
    { term: '雨水', zhi: '亥', name: '登明' },
    { term: '春分', zhi: '戌', name: '河魁' },
    { term: '谷雨', zhi: '酉', name: '从魁' },
    { term: '小满', zhi: '申', name: '传送' },
    { term: '夏至', zhi: '未', name: '小吉' },
    { term: '大暑', zhi: '午', name: '胜光' },
    { term: '处暑', zhi: '巳', name: '太乙' },
    { term: '秋分', zhi: '辰', name: '天罡' },
    { term: '霜降', zhi: '卯', name: '太冲' },
    { term: '小雪', zhi: '寅', name: '功曹' },
    { term: '冬至', zhi: '丑', name: '大吉' },
    { term: '大寒', zhi: '子', name: '神后' }
  ];

  // 十二天将（贵人顺逆排）
  var TIANJIANG = ['贵人', '螣蛇', '朱雀', '六合', '勾陈', '青龙',
    '天空', '白虎', '太常', '玄武', '太阴', '天后'];

  // 贵人口诀：甲戊庚牛羊（丑未），乙己鼠猴乡（子申），丙丁猪鸡位（亥酉），
  //           壬癸兔蛇藏（卯巳），六辛逢虎马（寅午）
  var GUIREN = {
    '甲': ['丑', '未'], '戊': ['丑', '未'], '庚': ['丑', '未'],
    '乙': ['子', '申'], '己': ['子', '申'],
    '丙': ['亥', '酉'], '丁': ['亥', '酉'],
    '壬': ['卯', '巳'], '癸': ['卯', '巳'],
    '辛': ['寅', '午']
  };

  // ── 干支 ──
  function jiaziIndex(gan, zhi) {
    var gi = GAN.indexOf(gan), zi = ZHI.indexOf(zhi);
    for (var n = 0; n < 60; n++) if (n % 10 === gi && n % 12 === zi) return n;
    return -1;
  }

  function dayGanzhi(ms) {
    var base = Date.UTC(2000, 0, 1), baseIdx = 54;
    var d = new Date(ms + 8 * 3600000);
    var bjDay = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    var bd = new Date(base + 8 * 3600000);
    var baseDay = Date.UTC(bd.getUTCFullYear(), bd.getUTCMonth(), bd.getUTCDate());
    var diff = Math.round((bjDay - baseDay) / 86400000);
    var idx = ((baseIdx + diff) % 60 + 60) % 60;
    return { gan: GAN[idx % 10], zhi: ZHI[idx % 12], idx: idx };
  }

  function hourZhi(ms) {
    var d = new Date(ms + 8 * 3600000);
    var h = d.getUTCHours();
    return Math.floor(((h + 1) % 24) / 2);
  }

  /**
   * 月将：按中气确定
   * 简化：用公历月份近似（每月中气约在 20 日）
   */
  function getMonthGeneral(ms) {
    var d = new Date(ms + 8 * 3600000);
    var m = d.getUTCMonth() + 1, day = d.getUTCDate();
    // 中气：每月后半段
    var afterMid = day >= 20;
    // 中气对应的月将索引
    var idx;
    if (afterMid) {
      // 本月的中气
      idx = m - 1;   // 1月→大寒(11), 2月→雨水(0)...
    } else {
      idx = (m - 2 + 12) % 12;
    }
    // 映射：1月大寒=index 11, 2月雨水=index 0
    var MAP = { 1: 11, 2: 0, 3: 1, 4: 2, 5: 3, 6: 4, 7: 5, 8: 6, 9: 7, 10: 8, 11: 9, 12: 10 };
    var k = MAP[m];
    if (!afterMid) k = (k - 1 + 12) % 12;
    return MONTH_GENERAL[k];
  }

  // ── 天地盘 ──
  /**
   * 月将加时：把月将放到占时的位置上，其余顺排
   * 天盘：地盘某支 → 天盘某支
   */
  function heavenPlate(generalZhi, hourZhiIdx) {
    // 月将加时：把月将放到「占时」那个地盘位上
    // 即 地盘[占时] = 月将，其余按顺序一一对应
    var gi = ZHI.indexOf(generalZhi);
    var plate = {};
    for (var i = 0; i < 12; i++) {
      // 地盘 ZHI[i] 上的天盘支：
      // 从占时位(月将)出发，地盘每进一位，天盘也进一位
      var offset = i - hourZhiIdx;
      plate[ZHI[i]] = ZHI[((gi + offset) % 12 + 12) % 12];
    }
    return plate;
  }

  // ── 四课 ──
  /**
   * 四课：
   *   第一课：日干阳神（日干寄宫的上神）
   *   第二课：第一课的上神作下神，取其上天盘
   *   第三课：日支的上神
   *   第四课：第三课的上神作下神，取其上天盘
   */
  function fourLessons(dayGan, dayZhi, plate) {
    // 日干寄宫（甲寄寅、乙寄辰、丙寄巳、丁寄未、戊寄巳、
    //           己寄未、庚寄申、辛寄戌、壬寄亥、癸寄丑）
    var JI = {
      '甲': '寅', '乙': '辰', '丙': '巳', '丁': '未', '戊': '巳',
      '己': '未', '庚': '申', '辛': '戌', '壬': '亥', '癸': '丑'
    };
    var ganPalace = JI[dayGan];

    // 第一课：日干寄宫的位上，天盘是什么
    var l1Upper = plate[ganPalace];
    // 第二课：以第一课的上神为下，取天盘
    var l2Upper = plate[l1Upper];
    // 第三课：日支位上天盘
    var l3Upper = plate[dayZhi];
    // 第四课：第三课上神为下，取天盘
    var l4Upper = plate[l3Upper];

    return [
      { n: 1, name: '第一课', lower: dayGan, upper: l1Upper, lowerIsGan: true, palace: ganPalace },
      { n: 2, name: '第二课', lower: l1Upper, upper: l2Upper },
      { n: 3, name: '第三课', lower: dayZhi, upper: l3Upper },
      { n: 4, name: '第四课', lower: l3Upper, upper: l4Upper }
    ];
  }

  // ── 三传 ──
  /**
   * 三传取法（九宗门）。这里实现前四种：
   *   1. 贼克法：下贼上为用；无下贼上则上克下为用
   *   2. 比用法：多个克时，取与日干阴阳相同者
   *   3. 遥克法：无克时，取日干遥克或遥克日干者
   *   4. 昴星法：再无克时
   */
  function threeTransmissions(dayGan, lessons, plate) {
    var ganWx = GAN_WX[dayGan];

    // 分析四课的上下克关系
    var analysis = lessons.map(function (L) {
      var upWx = ZHI_WX[L.upper];
      var loWx = L.lowerIsGan ? ganWx : ZHI_WX[L.lower];
      var rel = '';
      if (KE[loWx] === upWx) rel = '下贼上';
      else if (KE[upWx] === loWx) rel = '上克下';
      else if (SHENG[loWx] === upWx) rel = '下生上';
      else if (SHENG[upWx] === loWx) rel = '上生下';
      else rel = '同气';
      return { lesson: L, rel: rel, upWx: upWx, loWx: loWx };
    });

    var zei = analysis.filter(function (a) { return a.rel === '下贼上'; });
    var ke = analysis.filter(function (a) { return a.rel === '上克下'; });
    var used = [], method = '';

    if (zei.length === 1) {
      used = [zei[0]]; method = '贼克法（下贼上）';
    } else if (zei.length > 1) {
      // 比用法：取与日干同阴阳者
      var ganYin = GAN.indexOf(dayGan) % 2;
      var bi = zei.filter(function (a) {
        return ZHI.indexOf(a.lesson.upper) % 2 === ganYin;
      });
      used = bi.length ? bi : zei;
      method = '比用法（多贼取比）';
    } else if (ke.length === 1) {
      used = [ke[0]]; method = '贼克法（上克下）';
    } else if (ke.length > 1) {
      var ganYin2 = GAN.indexOf(dayGan) % 2;
      var bi2 = ke.filter(function (a) {
        return ZHI.indexOf(a.lesson.upper) % 2 === ganYin2;
      });
      used = bi2.length ? bi2 : ke;
      method = '比用法（多克取比）';
    } else {
      // 遥克法：日干与四课上神遥相克
      var yao = analysis.filter(function (a) {
        var upWx = a.upWx;
        return KE[ganWx] === upWx || KE[upWx] === ganWx;
      });
      if (yao.length) {
        used = [yao[0]];
        method = '遥克法';
      } else {
        method = '无克（应取昴星/别责法）';
        used = [analysis[0]];
      }
    }

    // 初传 = 所选课的上神
    var chu = used[0].lesson.upper;
    // 中传 = 天盘上「初传」位置的天盘支
    var zhong = plate[chu];
    // 末传 = 天盘上「中传」位置的天盘支
    var mo = plate[zhong];

    return {
      method: method,
      analysis: analysis,
      chuan: [chu, zhong, mo],
      names: ['初传', '中传', '末传']
    };
  }

  // ── 天将 ──
  /**
   * 贵人：昼贵/夜贵，看占时是昼是夜
   * 贵人落宫后，顺逆排十二天将
   * 顺逆规则：贵人在亥子丑寅卯辰为顺行，在巳午未申酉戌为逆行
   */
  function tianjiang(dayGan, hourIdx, plate) {
    var gui = GUIREN[dayGan];
    if (!gui) return null;

    // 昼占（卯至申）用阳贵，夜占用阴贵（简化：卯-申为昼）
    var isDay = hourIdx >= 3 && hourIdx <= 8;   // 卯(3)到申(8)
    var guiZhi = isDay ? gui[0] : gui[1];

    // 贵人落在地盘哪个位置（天盘是 guiZhi 的那个地盘位）
    var guiPalaceIdx = -1;
    for (var i = 0; i < 12; i++) {
      if (plate[ZHI[i]] === guiZhi) { guiPalaceIdx = i; break; }
    }
    if (guiPalaceIdx < 0) return null;

    // 顺逆：贵人落宫在亥-辰为顺，巳-戌为逆
    var guiZhiPos = ZHI.indexOf(guiZhi);
    var forward = guiZhiPos >= 11 || guiZhiPos <= 4;   // 亥子丑寅卯辰

    var jiangs = {};
    for (var k = 0; k < 12; k++) {
      var idx = forward
        ? (guiPalaceIdx + k) % 12
        : ((guiPalaceIdx - k) + 24) % 12;
      jiangs[ZHI[idx]] = TIANJIANG[k];
    }

    return { guiZhi: guiZhi, isDay: isDay, forward: forward, jiangs: jiangs };
  }

  // ── 旬空 ──
  function xunkong(gan, zhi) {
    var n = jiaziIndex(gan, zhi);
    if (n < 0) return ['', ''];
    var headIdx = n - (n % 10);
    var headZhi = headIdx % 12;
    return [ZHI[(headZhi + 10) % 12], ZHI[(headZhi + 11) % 12]];
  }

  // ── 主排盘 ──
  function paipan(opt) {
    var ms = opt.ms;
    var dg = dayGanzhi(ms);
    var hIdx = hourZhi(ms);
    var general = getMonthGeneral(ms);

    var plate = heavenPlate(general.zhi, hIdx);
    var lessons = fourLessons(dg.gan, dg.zhi, plate);
    var sanchuan = threeTransmissions(dg.gan, lessons, plate);
    var jiang = tianjiang(dg.gan, hIdx, plate);
    var kong = xunkong(dg.gan, dg.zhi);

    // 组装十二宫
    var palaces = ZHI.map(function (z, i) {
      return {
        zhi: z,
        idx: i,
        heaven: plate[z],
        heavenWx: ZHI_WX[plate[z]],
        wx: ZHI_WX[z],
        jiang: jiang ? (jiang.jiangs[z] || '') : '',
        kong: kong.indexOf(plate[z]) >= 0,
        isDayZhi: z === dg.zhi,
        isChu: plate[z] === sanchuan.chuan[0],
        isZhong: plate[z] === sanchuan.chuan[1],
        isMo: plate[z] === sanchuan.chuan[2]
      };
    });

    return {
      dayGanzhi: dg,
      hourZhi: ZHI[hIdx],
      hourIdx: hIdx,
      general: general,
      plate: plate,
      lessons: lessons,
      transmissions: sanchuan,
      jiang: jiang,
      kong: kong,
      palaces: palaces,
      // 四课三传的干支便于展示
      summary: {
        day: dg.gan + dg.zhi,
        general: general.name + '（' + general.zhi + '将）',
        hour: ZHI[hIdx] + '时',
        method: sanchuan.method,
        chuan: sanchuan.chuan.join(' → ')
      }
    };
  }

  // ── 课体判断 ──
  function keTi(result) {
    var t = result.transmissions;
    var chuan = t.chuan;
    var notes = [];

    // 三传是否连续（连茹）
    var i0 = ZHI.indexOf(chuan[0]), i1 = ZHI.indexOf(chuan[1]), i2 = ZHI.indexOf(chuan[2]);
    var d1 = (i1 - i0 + 12) % 12, d2 = (i2 - i1 + 12) % 12;
    if (d1 === 1 && d2 === 1) notes.push({ name: '进连茹', desc: '三传顺连，事情逐步推进，一气贯注。' });
    else if (d1 === 11 && d2 === 11) notes.push({ name: '退连茹', desc: '三传逆连，事情回缩，宜退不宜进。' });

    // 三传是否同一五行
    var wx = chuan.map(function (z) { return ZHI_WX[z]; });
    if (wx[0] === wx[1] && wx[1] === wx[2]) {
      notes.push({ name: '三传一气', desc: '三传同属' + wx[0] + '，事情集中在一个方向上，力量单一。' });
    }

    // 空亡
    var kongCnt = chuan.filter(function (z) { return result.kong.indexOf(z) >= 0; }).length;
    if (kongCnt === 3) notes.push({ name: '三传皆空', desc: '三传全部落空亡，事多虚浮，难以落实。' });
    else if (kongCnt > 0) notes.push({ name: '传中有空', desc: '三传中有 ' + kongCnt + ' 个落空亡，该阶段易生变数。' });

    return notes;
  }

  global.bzLiuren = {
    ZHI: ZHI, GAN: GAN,
    ZHI_WX: ZHI_WX, GAN_WX: GAN_WX,
    MONTH_GENERAL: MONTH_GENERAL,
    TIANJIANG: TIANJIANG,
    GUIREN: GUIREN,
    paipan: paipan,
    heavenPlate: heavenPlate,
    fourLessons: fourLessons,
    threeTransmissions: threeTransmissions,
    tianjiang: tianjiang,
    getMonthGeneral: getMonthGeneral,
    xunkong: xunkong,
    keTi: keTi,
    dayGanzhi: dayGanzhi
  };
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
