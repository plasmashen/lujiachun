/**
 * 黄历 / 择日
 *
 * 算法（与 lunar-javascript 1860 天全量对拍，10 项 100%）：
 *   建除十二神 = 日支 - 月支 偏移查表
 *   黄道黑道   = (4 - 2×月支索引 + 日支索引) mod 12
 *   二十八宿   = (JD + 11) % 28
 *   日冲       = 日支 + 6
 *   彭祖百忌   = 日干 / 日支查表
 *   胎神       = 日干支查表（60 组）
 *   宜忌       = (日干支, 月支) 查表（720 组，实测无冲突）
 */
(function (global) {
  'use strict';

  var DZ = '子丑寅卯辰巳午未申酉戌亥';
  var TG = '甲乙丙丁戊己庚辛壬癸';

  var ZHIXING = ['建', '除', '满', '平', '定', '执', '破', '危', '成', '收', '开', '闭'];
  var ZHIXING_LUCK = ['吉', '吉', '凶', '平', '吉', '平', '凶', '凶', '吉', '吉', '吉', '凶'];
  var ZHIXING_DESC = {
    '建': '万物生育、健壮之日。宜祈福、求嗣、出行、上任。',
    '除': '除旧布新之日。宜扫舍、疗病、除服。',
    '满': '丰收圆满之日。宜祭祀、祈福，忌上任、嫁娶。',
    '平': '平平顺顺之日。宜修饰垣墙，诸事平常。',
    '定': '安定守成之日。宜宴请、嫁娶、订盟，忌诉讼。',
    '执': '操守执持之日。宜捕捉、造屋，忌开市、出行。',
    '破': '刚旺破败之日。诸事不宜，惟宜破屋坏垣、疗病。',
    '危': '危险之日。宜安床、祭祀，忌登高、行船。',
    '成': '成功成就之日。宜嫁娶、开市、入学、动土。',
    '收': '收成收获之日。宜纳财、捕捉、进人口。',
    '开': '开始开通之日。宜开市、出行、求财、入学。',
    '闭': '闭塞收藏之日。宜筑堤、埋穴，忌开市、出行。'
  };

  var TIANSHEN = ['青龙', '明堂', '天刑', '朱雀', '金匮', '天德',
                  '白虎', '玉堂', '天牢', '玄武', '司命', '勾陈'];
  var TIANSHEN_LUCK = ['黄道', '黄道', '黑道', '黑道', '黄道', '黄道',
                       '黑道', '黄道', '黑道', '黑道', '黄道', '黑道'];
  var TIANSHEN_DESC = {
    '青龙': '天乙贵人，主吉庆喜事。宜嫁娶、开市、出行。',
    '明堂': '贵人星，主光明通达。宜上任、见贵、求财。',
    '天刑': '主刑伤刑罚。忌诉讼远行，宜守不宜动。',
    '朱雀': '主口舌是非。忌签合同、谈判。',
    '金匮': '财星，主财富积蓄。宜开市、纳财、嫁娶。',
    '天德': '福德之星，主慈祥庇佑。诸事皆宜，最吉。',
    '白虎': '主血光凶险。忌动土、远行、嫁娶。',
    '玉堂': '主高贵文雅。宜见贵、入学、安床。',
    '天牢': '主囚禁阻滞。忌出行诉讼，诸事宜守。',
    '玄武': '主盗贼暗昧。防盗防骗，忌签订契约。',
    '司命': '主寿命福禄。宜祈福、求嗣、安床、祭祀。',
    '勾陈': '主纠葛牵连。忌诉讼合作，防是非牵扯。'
  };

  var XIU = ['角', '亢', '氐', '房', '心', '尾', '箕',
             '斗', '牛', '女', '虚', '危', '室', '壁',
             '奎', '娄', '胃', '昴', '毕', '觜', '参',
             '井', '鬼', '柳', '星', '张', '翼', '轸'];
  var XIU_LUCK = ['吉', '凶', '凶', '吉', '凶', '吉', '吉',
                  '吉', '凶', '凶', '凶', '凶', '吉', '吉',
                  '凶', '吉', '吉', '凶', '吉', '凶', '吉',
                  '吉', '凶', '凶', '凶', '吉', '凶', '吉'];
  var XIU_ANIMAL = ['蛟', '龙', '貉', '兔', '狐', '虎', '豹',
                    '獬', '牛', '蝠', '鼠', '燕', '猪', '貐',
                    '狼', '狗', '雉', '鸡', '乌', '猴', '猿',
                    '犴', '羊', '獐', '马', '鹿', '蛇', '蚓'];

  var PENGZU_GAN = {
    '甲': '甲不开仓财物耗散', '乙': '乙不栽植千株不长',
    '丙': '丙不修灶必见灾殃', '丁': '丁不剃头头必生疮',
    '戊': '戊不受田田主不祥', '己': '己不破券二比并亡',
    '庚': '庚不经络织机虚张', '辛': '辛不合酱主人不尝',
    '壬': '壬不泱水更难提防', '癸': '癸不词讼理弱敌强'
  };
  var PENGZU_ZHI = {
    '子': '子不问卜自惹祸殃', '丑': '丑不冠带主不还乡',
    '寅': '寅不祭祀神鬼不尝', '卯': '卯不穿井水泉不香',
    '辰': '辰不哭泣必主重丧', '巳': '巳不远行财物伏藏',
    '午': '午不苫盖屋主更张', '未': '未不服药毒气入肠',
    '申': '申不安床鬼祟入房', '酉': '酉不会客醉坐颠狂',
    '戌': '戌不吃犬作怪上床', '亥': '亥不嫁娶不利新郎'
  };

  var TAISHEN = {};

  var SHA_DIR = { '申': '南', '子': '南', '辰': '南',
                  '寅': '北', '午': '北', '戌': '北',
                  '巳': '东', '酉': '东', '丑': '东',
                  '亥': '西', '卯': '西', '未': '西' };

  var DIR_CN = { '震': '东', '离': '南', '兑': '西', '坎': '北',
                 '乾': '西北', '坤': '西南', '艮': '东北', '巽': '东南' };

  // 择日事项 → 关键词映射
  var EVENT_KEYWORDS = {
    '嫁娶': ['嫁娶', '订盟', '纳采', '移徙', '入宅'],
    '开市': ['开市', '交易', '立券', '纳财', '挂匾'],
    '出行': ['出行', '移徙'],
    '动土': ['动土', '修造', '起基', '安机械'],
    '入宅': ['入宅', '移徙', '安床'],
    '安葬': ['安葬', '入殓', '除服', '成服'],
    '祭祀': ['祭祀', '祈福', '求嗣', '斋醮'],
    '签约': ['立券', '交易', '纳财'],
    '求学': ['入学', '祈福']
  };

  function zhixing(mz, dz) {
    return ZHIXING[(DZ.indexOf(dz) - DZ.indexOf(mz) + 12) % 12];
  }

  function tianshen(mz, dz) {
    var base = (4 - 2 * DZ.indexOf(mz)) % 12;
    if (base < 0) base += 12;
    var i = (base + DZ.indexOf(dz)) % 12;
    return [TIANSHEN[i], TIANSHEN_LUCK[i], i];
  }

  function xiuOfJd(jd) {
    var i = ((Math.floor(jd) + 11) % 28 + 28) % 28;
    return [XIU[i], XIU_LUCK[i], XIU_ANIMAL[i], i];
  }

  function chongSha(dz) {
    return [DZ[(DZ.indexOf(dz) + 6) % 12], SHA_DIR[dz]];
  }

  function setTables(taishen, yiji) {
    if (taishen) TAISHEN = taishen;
    if (yiji) YIJI = yiji;
  }

  var YIJI = {};

  /**
   * 查宜忌
   * @returns {yi, ji, jishen, xiongsha} 或 null
   */
  function yijiOf(dayGz, monthZhi) {
    var row = YIJI[dayGz];
    if (!row) return null;
    return row[monthZhi] || null;
  }

  /**
   * 时辰黄道神
   */
  function hourShen(dayZhi, hourZhi) {
    var base = (4 - 2 * DZ.indexOf(dayZhi)) % 12;
    if (base < 0) base += 12;
    var i = (base + DZ.indexOf(hourZhi)) % 12;
    return [TIANSHEN[i], TIANSHEN_LUCK[i]];
  }

  /**
   * 综合起一日本黄历数据
   * @param o {dayGanZhi, monthZhi, jd, dayGan, dayZhi}
   */
  function compute(o) {
    var mz = o.monthZhi, dgz = o.dayGanZhi;
    var dg = dgz[0], dz = dgz[1];

    var jx = zhixing(mz, dz);
    var ts = tianshen(mz, dz);
    var xiu = xiuOfJd(o.jd);
    var cs = chongSha(dz);
    var yi = yijiOf(dgz, mz);

    return {
      zhixing: jx,
      zhixingLuck: ZHIXING_LUCK[ZHIXING.indexOf(jx)],
      zhixingDesc: ZHIXING_DESC[jx] || '',
      tianshen: ts[0],
      tianshenLuck: ts[1],
      tianshenDesc: TIANSHEN_DESC[ts[0]] || '',
      xiu: xiu[0],
      xiuLuck: xiu[1],
      xiuAnimal: xiu[2],
      chong: cs[0],
      sha: cs[1],
      taishen: TAISHEN[dgz] || '',
      pengzuGan: PENGZU_GAN[dg] || '',
      pengzuZhi: PENGZU_ZHI[dz] || '',
      yi: yi ? yi.yi : [],
      ji: yi ? yi.ji : [],
      jishen: yi ? yi.js : [],
      xiongsha: yi ? yi.xs : [],
      dayGan: dg, dayZhi: dz, monthZhi: mz
    };
  }

  /** 是否适合某事项 */
  function fitEvent(day, event) {
    var kws = EVENT_KEYWORDS[event] || [event];
    var yi = day.yi || [], ji = day.ji || [];
    var hitYi = kws.some(function (k) { return yi.indexOf(k) >= 0; });
    var hitJi = kws.some(function (k) { return ji.indexOf(k) >= 0; });
    if (hitJi) return { ok: false, reason: '忌' + kws.filter(function (k) {
      return ji.indexOf(k) >= 0; }).join('、') };
    if (!hitYi) return { ok: false, reason: '不在宜项中' };
    // 综合评分（黄道 +4 / 建除吉 +2 / 宿吉 +2，黑道直接扣）
    var score = 0;
    if (day.tianshenLuck === '黄道') score += 4;
    else score -= 2;                       // 黑道扣分
    if (day.zhixingLuck === '吉') score += 2;
    else if (day.zhixingLuck === '凶') score -= 3;
    if (day.xiuLuck === '吉') score += 2;
    else score -= 1;
    // 宜项越多越专（该日多项宜办此事）
    var n = kws.filter(function (k) { return yi.indexOf(k) >= 0; }).length;
    score += Math.min(n, 3);
    return { ok: true, score: score, reason: '宜' + kws.filter(function (k) {
      return yi.indexOf(k) >= 0; }).join('、') };
  }

  global.bzHuangli = {
    compute: compute,
    setTables: setTables,
    zhixing: zhixing,
    tianshen: tianshen,
    xiuOfJd: xiuOfJd,
    chongSha: chongSha,
    hourShen: hourShen,
    fitEvent: fitEvent,
    yijiOf: yijiOf,
    DZ: DZ,
    ZHIXING: ZHIXING,
    TIANSHEN: TIANSHEN,
    XIU: XIU,
    EVENT_KEYWORDS: EVENT_KEYWORDS,
    DIR_CN: DIR_CN
  };
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
