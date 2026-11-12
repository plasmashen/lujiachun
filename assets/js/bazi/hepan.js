/**
 * 八字合盘 —— 双人命盘对照
 *
 * 按问真的「合盘五行图」（权益说明 explain_vip_12）结构实现：
 *   ① 双方四柱对照
 *   ② 重要参数表：生肖 / 日主 / 夫妻宫 / 旺衰 / 格局
 *   ③ 五行能量雷达图（双方叠加 + 合盘）
 *   ④ 关系分析：日支（夫妻宫）互动、日干五合、地支合冲
 *
 * 关系类型（问真提供 6 种）：婚恋、朋友、闺蜜、同事、领导、合伙
 */
(function (global) {
  'use strict';

  var SHENGXIAO = ['鼠', '牛', '虎', '兔', '龙', '蛇',
                   '马', '羊', '猴', '鸡', '狗', '猪'];

  // 地支六冲
  var CHONG = { 子: '午', 丑: '未', 寅: '申', 卯: '酉', 辰: '戌', 巳: '亥',
                午: '子', 未: '丑', 申: '寅', 酉: '卯', 戌: '辰', 亥: '巳' };
  // 地支六合
  var LIUHE = { 子: '丑', 丑: '子', 寅: '亥', 亥: '寅', 卯: '戌', 戌: '卯',
                辰: '酉', 酉: '辰', 巳: '申', 申: '巳', 午: '未', 未: '午' };
  // 天干五合
  var GANHE = { 甲: '己', 己: '甲', 乙: '庚', 庚: '乙', 丙: '辛', 辛: '丙',
                丁: '壬', 壬: '丁', 戊: '癸', 癸: '戊' };
  // 地支三合局
  var SANHE = [
    { zhi: ['申', '子', '辰'], wx: '水' },
    { zhi: ['亥', '卯', '未'], wx: '木' },
    { zhi: ['寅', '午', '戌'], wx: '火' },
    { zhi: ['巳', '酉', '丑'], wx: '金' }
  ];

  var WX_ORDER = ['木', '火', '土', '金', '水'];

  /**
   * 生肖：以立春为界（年柱地支决定）
   * @returns {string}
   */
  function shengxiao(c) {
    var y = (c.pillars || {}).year || '';
    if (y.length < 2) return '';
    var zhi = y[1];
    var idx = '子丑寅卯辰巳午未申酉戌亥'.indexOf(zhi);
    return idx >= 0 ? SHENGXIAO[idx] : '';
  }

  /** 旺衰：用五行得分判断（简化版，同问真「同党异党」思路） */
  function wangshuai(c) {
    var sc = c.wuxingScore || {};
    var dmWx = c.dayMasterWuxing || '';
    if (!dmWx) return '';
    var SHENG = { 木: '水', 火: '木', 土: '火', 金: '土', 水: '金' };
    var same = (sc[dmWx] || 0) + (sc[SHENG[dmWx]] || 0);
    var total = WX_ORDER.reduce(function (s, w) { return s + (sc[w] || 0); }, 0);
    if (!total) return '';
    var ratio = same / total;
    if (ratio >= 0.62) return '身旺';
    if (ratio >= 0.52) return '偏旺';
    if (ratio >= 0.42) return '偏弱';
    return '身弱';
  }

  /** 夫妻宫：日支 */
  function fuqigong(c) {
    var d = (c.pillars || {}).day || '';
    return d.length >= 2 ? d[1] : '';
  }

  /** 五行能量（按 wuxingScore 归一到 0-100） */
  function wuxingEnergy(c) {
    var sc = c.wuxingScore || {};
    var total = WX_ORDER.reduce(function (s, w) { return s + (sc[w] || 0); }, 0) || 1;
    var out = {};
    WX_ORDER.forEach(function (w) {
      out[w] = Math.round((sc[w] || 0) / total * 100);
    });
    return out;
  }

  /** 双盘五行叠加 */
  function mergeEnergy(a, b) {
    var out = {};
    WX_ORDER.forEach(function (w) {
      out[w] = Math.round((a[w] + b[w]) / 2);
    });
    return out;
  }

  /**
   * 关系分析：日支互动优先（夫妻宫），再看日干五合、地支合冲
   * @returns {Array} [{level:'good'|'warn'|'info', text}]
   */
  function analyze(a, b) {
    var out = [];
    var aDay = (a.pillars || {}).day || '';
    var bDay = (b.pillars || {}).day || '';
    if (aDay.length < 2 || bDay.length < 2) return out;

    var aGan = aDay[0], aZhi = aDay[1];
    var bGan = bDay[0], bZhi = bDay[1];

    // ① 夫妻宫（日支）互动
    if (LIUHE[aZhi] === bZhi) {
      out.push({ level: 'good', text: '夫妻宫' + aZhi + '与' + bZhi + '六合，日支相合，相处融洽、彼此吸引' });
    } else if (CHONG[aZhi] === bZhi) {
      out.push({ level: 'warn', text: '夫妻宫' + aZhi + '与' + bZhi + '相冲，观念差异较大，需多沟通磨合' });
    } else if (aZhi === bZhi) {
      out.push({ level: 'info', text: '夫妻宫同为' + aZhi + '，性情相近，但缺少互补' });
    }

    // ② 日干五合
    if (GANHE[aGan] === bGan) {
      out.push({ level: 'good', text: '双方日干' + aGan + bGan + '相合（' + aGan + bGan + '合），天然默契' });
    } else if (aGan === bGan) {
      out.push({ level: 'info', text: '双方日干同为' + aGan + '，同气相求，易共鸣也易同执' });
    }

    // ③ 年支（生肖）合冲
    var aY = ((a.pillars || {}).year || '')[1];
    var bY = ((b.pillars || {}).year || '')[1];
    if (aY && bY) {
      if (LIUHE[aY] === bY) out.push({ level: 'good', text: '年支' + aY + bY + '六合，根基相投' });
      else if (CHONG[aY] === bY) out.push({ level: 'warn', text: '年支' + aY + bY + '相冲，家庭背景或成长节奏差异大' });
    }

    // ④ 三合局
    var allZhi = [aZhi, bZhi, aY, bY];
    SANHE.forEach(function (g) {
      var hit = g.zhi.filter(function (z) { return allZhi.indexOf(z) >= 0; });
      if (hit.length >= 2 && aZhi !== bZhi) {
        out.push({ level: 'good', text: '日支年支见' + hit.join('') + '，半合' + g.wx + '局，有共同目标' });
      }
    });

    // ⑤ 日主五行关系
    var WX = { 甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',
               庚:'金',辛:'金',壬:'水',癸:'水' };
    var SHENG = { 木:'火', 火:'土', 土:'金', 金:'水', 水:'木' };
    var KE = { 木:'土', 土:'水', 水:'火', 火:'金', 金:'木' };
    var wa = WX[aGan], wb = WX[bGan];
    if (wa && wb && wa !== wb) {
      if (SHENG[wa] === wb) out.push({ level: 'info', text: '甲方' + wa + '生乙方' + wb + '，主动付出型' });
      else if (SHENG[wb] === wa) out.push({ level: 'info', text: '乙方' + wb + '生甲方' + wa + '，受助型' });
      else if (KE[wa] === wb) out.push({ level: 'warn', text: '甲方' + wa + '克乙方' + wb + '，需注意主导权' });
      else if (KE[wb] === wa) out.push({ level: 'warn', text: '乙方' + wb + '克甲方' + wa + '，易受压' });
    }

    return out;
  }

  /**
   * 完整合盘
   * @param a 甲方 paipan 结果
   * @param b 乙方 paipan 结果
   * @param rel 关系类型：'love'|'friend'|'bestie'|'colleague'|'leader'|'partner'
   */
  function hepan(a, b, rel) {
    var ea = wuxingEnergy(a), eb = wuxingEnergy(b);
    var relLabel = {
      love: '婚恋关系', friend: '朋友关系', bestie: '闺蜜关系',
      colleague: '同事关系', leader: '领导关系', partner: '合伙关系'
    }[rel] || '关系';

    return {
      rel: rel, relLabel: relLabel,
      a: {
        sex: a.sex, pillars: a.pillars,
        shengxiao: shengxiao(a),
        dayMaster: a.dayMaster, dayMasterWuxing: a.dayMasterWuxing,
        fuqigong: fuqigong(a), wangshuai: wangshuai(a),
        energy: ea
      },
      b: {
        sex: b.sex, pillars: b.pillars,
        shengxiao: shengxiao(b),
        dayMaster: b.dayMaster, dayMasterWuxing: b.dayMasterWuxing,
        fuqigong: fuqigong(b), wangshuai: wangshuai(b),
        energy: eb
      },
      merged: mergeEnergy(ea, eb),
      points: analyze(a, b)
    };
  }

  global.bzHepan = {
    compute: hepan,
    WX_ORDER: WX_ORDER,
    REL_TYPES: [
      { k: 'love', n: '婚恋' }, { k: 'friend', n: '朋友' },
      { k: 'bestie', n: '闺蜜' }, { k: 'colleague', n: '同事' },
      { k: 'leader', n: '领导' }, { k: 'partner', n: '合伙' }
    ]
  };
})(window);
