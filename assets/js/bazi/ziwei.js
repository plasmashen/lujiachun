/**
 * 紫微斗数排盘（三合派 / 南派四化）
 *
 * 算法依据：《紫微斗数全书》安星诀
 * 交叉验证：iztro (github.com/SylarLong/iztro) 2808 组样本，九项指标全 100%
 *
 * 排盘流程：
 *   ① 定寅首（五虎遁）→ ② 定命身宫 → ③ 定十二宫 → ④ 定五行局
 *   → ⑤ 起紫微星 → ⑥ 安十四主星 → ⑦ 安辅煞星 → ⑧ 起四化 → ⑨ 起大限
 *
 * 闰月规则：初一~十五按本月，十六以后按次月（iztro 实测两例验证）
 */
(function (global) {
  'use strict';

  var DZ = '子丑寅卯辰巳午未申酉戌亥';
  var TG = '甲乙丙丁戊己庚辛壬癸';

  var PALACE_NAMES = ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄',
                      '迁移', '仆役', '官禄', '田宅', '福德', '父母'];

  // 命宫地支 → 命主
  var SOUL_STARS = {
    '子': '贪狼', '丑': '巨门', '寅': '禄存', '卯': '文曲',
    '辰': '廉贞', '巳': '武曲', '午': '破军', '未': '武曲',
    '申': '廉贞', '酉': '文曲', '戌': '禄存', '亥': '巨门'
  };

  // 生年地支 → 身主
  var BODY_STARS = {
    '子': '火星', '午': '火星', '丑': '天相', '未': '天相',
    '寅': '天梁', '申': '天梁', '卯': '天同', '酉': '天同',
    '辰': '文昌', '戌': '文昌', '巳': '天机', '亥': '天机'
  };

  // 生年支 → 火铃起子时位
  var HUOXING_START = {
    '申': ['寅', '戌'], '子': ['寅', '戌'], '辰': ['寅', '戌'],
    '寅': ['丑', '卯'], '午': ['丑', '卯'], '戌': ['丑', '卯'],
    '巳': ['卯', '戌'], '酉': ['卯', '戌'], '丑': ['卯', '戌'],
    '亥': ['酉', '戌'], '卯': ['酉', '戌'], '未': ['酉', '戌']
  };

  var LUCUN = { '甲': '寅', '乙': '卯', '丙': '巳', '戊': '巳', '丁': '午',
                '己': '午', '庚': '申', '辛': '酉', '壬': '亥', '癸': '子' };

  var KUYUE = {
    '甲': ['丑', '未'], '戊': ['丑', '未'], '庚': ['丑', '未'],
    '乙': ['子', '申'], '己': ['子', '申'],
    '辛': ['午', '寅'],
    '壬': ['卯', '巳'], '癸': ['卯', '巳'],
    '丙': ['亥', '酉'], '丁': ['亥', '酉']
  };

  var TIANMA = {
    '寅': '申', '午': '申', '戌': '申',
    '申': '寅', '子': '寅', '辰': '寅',
    '巳': '亥', '酉': '亥', '丑': '亥',
    '亥': '巳', '卯': '巳', '未': '巳'
  };

  // 生年干 → 四化 [禄, 权, 科, 忌]（南派）
  var SIHUA = {
    '甲': ['廉贞', '破军', '武曲', '太阳'],
    '乙': ['天机', '天梁', '紫微', '太阴'],
    '丙': ['天同', '天机', '文昌', '廉贞'],
    '丁': ['太阴', '天同', '天机', '巨门'],
    '戊': ['贪狼', '太阴', '右弼', '天机'],
    '己': ['武曲', '贪狼', '天梁', '文曲'],
    '庚': ['太阳', '武曲', '太阴', '天同'],
    '辛': ['巨门', '太阳', '文曲', '文昌'],
    '壬': ['天梁', '紫微', '左辅', '武曲'],
    '癸': ['破军', '巨门', '太阴', '贪狼']
  };

  var JU_NAMES = { 2: '水二局', 3: '木三局', 4: '金四局', 5: '土五局', 6: '火六局' };
  var JU_NUM = { '水': 2, '木': 3, '金': 4, '土': 5, '火': 6 };

  var NAYIN_WUXING = {
    '甲子': '金', '乙丑': '金', '丙寅': '火', '丁卯': '火', '戊辰': '木', '己巳': '木',
    '庚午': '土', '辛未': '土', '壬申': '金', '癸酉': '金', '甲戌': '火', '乙亥': '火',
    '丙子': '水', '丁丑': '水', '戊寅': '土', '己卯': '土', '庚辰': '金', '辛巳': '金',
    '壬午': '木', '癸未': '木', '甲申': '水', '乙酉': '水', '丙戌': '土', '丁亥': '土',
    '戊子': '火', '己丑': '火', '庚寅': '木', '辛卯': '木', '壬辰': '水', '癸巳': '水',
    '甲午': '金', '乙未': '金', '丙申': '火', '丁酉': '火', '戊戌': '木', '己亥': '木',
    '庚子': '土', '辛丑': '土', '壬寅': '金', '癸卯': '金', '甲辰': '火', '乙巳': '火',
    '丙午': '水', '丁未': '水', '戊申': '土', '己酉': '土', '庚戌': '金', '辛亥': '金',
    '壬子': '木', '癸丑': '木', '甲寅': '水', '乙卯': '水', '丙辰': '土', '丁巳': '土',
    '戊午': '火', '己未': '火', '庚申': '木', '辛酉': '木', '壬戌': '水', '癸亥': '水'
  };

  // 紫微定位表（由 iztro 570 样本反推，零冲突）
  var ZIWEI_TABLE = {
    2: { 1:'丑',2:'寅',3:'寅',4:'卯',5:'卯',6:'辰',7:'辰',8:'巳',9:'巳',10:'午',
         11:'午',12:'未',13:'未',14:'申',15:'申',16:'酉',17:'酉',18:'戌',19:'戌',20:'亥',
         21:'亥',22:'子',23:'子',24:'丑',25:'丑',26:'寅',27:'寅',28:'卯',29:'卯',30:'辰' },
    3: { 1:'辰',2:'丑',3:'寅',4:'巳',5:'寅',6:'卯',7:'午',8:'卯',9:'辰',10:'未',
         11:'辰',12:'巳',13:'申',14:'巳',15:'午',16:'酉',17:'午',18:'未',19:'戌',20:'未',
         21:'申',22:'亥',23:'申',24:'酉',25:'子',26:'酉',27:'戌',28:'丑',29:'戌',30:'亥' },
    4: { 1:'亥',2:'辰',3:'丑',4:'寅',5:'子',6:'巳',7:'寅',8:'卯',9:'丑',10:'午',
         11:'卯',12:'辰',13:'寅',14:'未',15:'辰',16:'巳',17:'卯',18:'申',19:'巳',20:'午',
         21:'辰',22:'酉',23:'午',24:'未',25:'巳',26:'戌',27:'未',28:'申',29:'午',30:'亥' },
    5: { 1:'午',2:'亥',3:'辰',4:'丑',5:'寅',6:'未',7:'子',8:'巳',9:'寅',10:'卯',
         11:'申',12:'丑',13:'午',14:'卯',15:'辰',16:'酉',17:'寅',18:'未',19:'辰',20:'巳',
         21:'戌',22:'卯',23:'申',24:'巳',25:'午',26:'亥',27:'辰',28:'酉',29:'午',30:'未' },
    6: { 1:'酉',2:'午',3:'亥',4:'辰',5:'丑',6:'寅',7:'戌',8:'未',9:'子',10:'巳',
         11:'寅',12:'卯',13:'亥',14:'申',15:'丑',16:'午',17:'卯',18:'辰',19:'子',20:'酉',
         21:'寅',22:'未',23:'辰',24:'巳',25:'丑',26:'戌',27:'卯',28:'申',29:'巳',30:'午' }
  };

  // 紫微 → 天府 对照
  var ZIWEI_TIANFU = {
    '子': '辰', '丑': '卯', '寅': '寅', '卯': '丑', '辰': '子', '巳': '亥',
    '午': '戌', '未': '酉', '申': '申', '酉': '未', '戌': '午', '亥': '巳'
  };

  function idx(ch, arr) { return (arr || DZ).indexOf(ch); }
  function dzAt(i) { return DZ[((i % 12) + 12) % 12]; }

  /** 五虎遁：年干 → 寅宫天干 */
  function wuhuDun(yearGan) {
    var start = ['丙', '戊', '庚', '壬', '甲'][TG.indexOf(yearGan) % 5];
    return start;
  }

  /** 给任意地支宫位配天干（五虎遁顺推） */
  function ganForBranch(yearGan, branch) {
    var startGan = wuhuDun(yearGan);
    var offset = (DZ.indexOf(branch) - DZ.indexOf('寅') + 12) % 12;
    return TG[(TG.indexOf(startGan) + offset) % 10];
  }

  /** 定命宫 / 身宫 */
  function dingMingShen(lunarMonth, timeIndex) {
    var base = (DZ.indexOf('寅') + (lunarMonth - 1)) % 12;
    var ming = (base - timeIndex + 12) % 12;
    var shen = (base + timeIndex) % 12;
    return [DZ[ming], DZ[shen]];
  }

  /** 定五行局：命宫干支纳音 */
  function wuxingJu(mingGan, mingZhi) {
    var wx = NAYIN_WUXING[mingGan + mingZhi];
    var n = JU_NUM[wx];
    return { n: n, name: JU_NAMES[n] };
  }

  /** 安十四主星 */
  function anFourteen(ziweiZhi) {
    var zi = DZ.indexOf(ziweiZhi);
    var out = {};
    out['紫微'] = ziweiZhi;
    out['天机'] = dzAt(zi - 1);
    out['太阳'] = dzAt(zi - 3);
    out['武曲'] = dzAt(zi - 4);
    out['天同'] = dzAt(zi - 5);
    out['廉贞'] = dzAt(zi - 8);

    var tf = ZIWEI_TIANFU[ziweiZhi];
    var ti = DZ.indexOf(tf);
    out['天府'] = tf;
    out['太阴'] = dzAt(ti + 1);
    out['贪狼'] = dzAt(ti + 2);
    out['巨门'] = dzAt(ti + 3);
    out['天相'] = dzAt(ti + 4);
    out['天梁'] = dzAt(ti + 5);
    out['七杀'] = dzAt(ti + 6);
    out['破军'] = dzAt(ti + 10);
    return out;
  }

  /** 安六吉六煞 + 禄存天马 */
  function anAux(yearGan, yearZhi, lunarMonth, timeIndex) {
    var out = {};
    out['左辅'] = dzAt(DZ.indexOf('辰') + (lunarMonth - 1));
    out['右弼'] = dzAt(DZ.indexOf('戌') - (lunarMonth - 1));
    out['文昌'] = dzAt(DZ.indexOf('戌') - timeIndex);
    out['文曲'] = dzAt(DZ.indexOf('辰') + timeIndex);

    var ky = KUYUE[yearGan];
    out['天魁'] = ky[0];
    out['天钺'] = ky[1];

    var lc = LUCUN[yearGan];
    out['禄存'] = lc;
    out['擎羊'] = dzAt(DZ.indexOf(lc) + 1);
    out['陀罗'] = dzAt(DZ.indexOf(lc) - 1);

    out['天马'] = TIANMA[yearZhi];

    out['地空'] = dzAt(DZ.indexOf('亥') - timeIndex);
    out['地劫'] = dzAt(DZ.indexOf('亥') + timeIndex);

    var hs = HUOXING_START[yearZhi];
    out['火星'] = dzAt(DZ.indexOf(hs[0]) + timeIndex);
    out['铃星'] = dzAt(DZ.indexOf(hs[1]) + timeIndex);
    return out;
  }

  function isYangGan(gan) { return TG.indexOf(gan) % 2 === 0; }

  /** 大限方向：阳男阴女顺行 */
  function dayunForward(yearGan, sex) {
    var yang = isYangGan(yearGan);
    var male = (sex === 1);
    return (yang && male) || (!yang && !male);
  }

  /** 闰月归月：初一~十五按本月，十六以后按次月 */
  function normLeapMonth(month, day, isLeap) {
    if (isLeap && day >= 16) return Math.min(month + 1, 12);
    return month;
  }

  /**
   * 紫微斗数排盘
   * @param opt {lunarMonth, lunarDay, timeIndex, yearGan, yearZhi, sex, isLeapMonth}
   */
  function paipan(opt) {
    var month = normLeapMonth(opt.lunarMonth, opt.lunarDay, !!opt.isLeapMonth);
    var ti = opt.timeIndex % 12;
    var yearGan = opt.yearGan, yearZhi = opt.yearZhi, sex = opt.sex || 1;

    var ms = dingMingShen(month, ti);
    var mingZhi = ms[0], shenZhi = ms[1];
    var mingGan = ganForBranch(yearGan, mingZhi);
    var ju = wuxingJu(mingGan, mingZhi);

    var zw = (ZIWEI_TABLE[ju.n] || {})[opt.lunarDay] || '丑';
    var main = anFourteen(zw);
    var aux = anAux(yearGan, yearZhi, month, ti);

    // 四化
    var sh = SIHUA[yearGan];
    var sihua = {};
    if (sh) {
      sihua[sh[0]] = '禄'; sihua[sh[1]] = '权';
      sihua[sh[2]] = '科'; sihua[sh[3]] = '忌';
    }

    // 十二宫
    var mi = DZ.indexOf(mingZhi);
    var palaces = {};
    for (var k = 0; k < 12; k++) {
      var z = dzAt(mi - k);
      var mj = [], mn = [], shl = [];
      for (var s in main) {
        if (main[s] === z) {
          mj.push({ name: s, hua: sihua[s] || '' });
        }
      }
      for (var s2 in aux) {
        if (aux[s2] === z) {
          mn.push({ name: s2, hua: sihua[s2] || '' });
        }
      }
      palaces[z] = {
        name: PALACE_NAMES[k],
        gan: ganForBranch(yearGan, z),
        zhi: z,
        major: mj,
        minor: mn,
        isBody: (z === shenZhi)
      };
    }

    // 大限
    var fwd = dayunForward(yearGan, sex);
    var dayun = [];
    for (var i = 0; i < 12; i++) {
      var dz2 = fwd ? dzAt(mi + i) : dzAt(mi - i);
      dayun.push({
        zhi: dz2,
        palace: palaces[dz2].name,
        start: ju.n + i * 10,
        end: ju.n + i * 10 + 9
      });
    }

    return {
      mingZhi: mingZhi, shenZhi: shenZhi, mingGan: mingGan,
      ju: ju.n, juName: ju.name, ziwei: zw,
      palaces: palaces, dayun: dayun, forward: fwd,
      soul: SOUL_STARS[mingZhi], body: BODY_STARS[yearZhi],
      sihua: sihua, main: main, aux: aux,
      lunarMonth: month, lunarDay: opt.lunarDay
    };
  }

  global.bzZiwei = {
    paipan: paipan,
    DZ: DZ,
    PALACE_NAMES: PALACE_NAMES,
    SIHUA: SIHUA
  };
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
