#!/usr/bin/env python3
"""
神煞代数化：把「查表」还原成「公式」。

核心发现：
  1. 十二长生 是从「日干五行 + 阴阳」推出的单一函数
  2. 禄神 = 长生 ±3，羊刃 = 禄 ±1，飞刃 = 羊刃+6
     文昌 = 禄+3，国印 = 禄+8，金舆 = 禄+2，天厨 = 禄(食神)
  3. 三合七煞全部是「将星」的固定偏移：
     桃花 = 将星-3，亡神 = 将星-1，劫煞 = 将星+5
     灾煞 = 将星+6，华盖 = 将星+4
     将星 = (-3 × (支 mod 4)) mod 12
  4. 孤辰 = 2+3×((支+1)//3 mod 4)，寡宿 = 孤辰-4
  5. 红鸾 = 3-支，天喜 = 红鸾+6，天医 = 月支-1
     披麻 = 年支-3，丧门 = 年支+2，吊客 = 年支-2，勾绞 = 年支+3
"""
import json
import sys


GAN = '甲乙丙丁戊己庚辛壬癸'
ZHI = '子丑寅卯辰巳午未申酉戌亥'

# 五行 → 长生地支（阳干）
WX_CHANGSHENG = {'木': 11, '火': 2, '土': 2, '金': 5, '水': 8}
GAN_WX = {'甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
          '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'}


def is_yang(gan):
    return GAN.index(gan) % 2 == 0


def changsheng(gan):
    """十二长生起点：阳干用本五行，阴干 = 阳干起点 + 7"""
    base = WX_CHANGSHENG[GAN_WX[gan]]
    return base if is_yang(gan) else (base + 7) % 12


def stage(gan, step):
    """长生第 step 位（0=长生，1=沐浴 … 5=帝旺 … 11=养）
    阳干顺行，阴干逆行"""
    base = changsheng(gan)
    return (base + step) % 12 if is_yang(gan) else (base - step) % 12


def lu(gan):
    """禄神 = 临官 = 长生第 3 位（阳顺阴逆自动处理）"""
    return stage(gan, 3)          # 阳 +3 / 阴 -3


def yangren(gan):
    """羊刃 = 帝旺 = 长生第 4 位（阳干禄+1，阴干禄-1）"""
    return stage(gan, 4)


def feiren(gan):
    """飞刃 = 羊刃对冲"""
    return (yangren(gan) + 6) % 12


def wenchang(gan):
    """文昌 = 禄 +3（不分阴阳，一律顺行）"""
    return (lu(gan) + 3) % 12


def guoyin(gan):
    """国印 = 禄 +8"""
    return (lu(gan) + 8) % 12


def jinyu(gan):
    """金舆 = 禄 +2"""
    return (lu(gan) + 2) % 12


def shishen(gan, offset=2):
    """食神 = 日干 +2（顺数）"""
    return GAN[(GAN.index(gan) + offset) % 10]


def tianchu(gan):
    """天厨 = 食神的禄"""
    return lu(shishen(gan))


def _jx(i):
    """将星（收地支索引）"""
    return (-3 * (i % 4)) % 12


def _yima(i):     return (_jx(i) + 2) % 12
def _taohua(i):   return (_jx(i) - 3) % 12
def _wangshen(i): return (_jx(i) - 1) % 12
def _jiesha(i):   return (_jx(i) + 5) % 12
def _zaisha(i):   return (_jx(i) + 6) % 12
def _huagai(i):   return (_jx(i) + 4) % 12
def _guchen(i):   return (2 + 3 * ((i + 1) // 3 % 4)) % 12
def _guasu(i):    return (_guchen(i) - 4) % 12
def _hongluan(i): return (3 - i) % 12
def _tianxi(i):   return (_hongluan(i) + 6) % 12
def _sangmen(i):  return (i + 2) % 12
def _diaoke(i):   return (i - 2) % 12
def _pima(i):     return (i - 3) % 12
def _goujiao(i):  return (i + 3) % 12
def _tianyi_yue(i): return (i - 1) % 12


def tianyi_guiren(gan):
    """天乙贵人（5 组口诀）：甲戊庚→丑未，乙己→子申，丙丁→亥酉，辛→午寅，壬癸→卯巳"""
    g = GAN.index(gan)
    if g in (0, 4, 6):      # 甲戊庚
        return (1, 7)
    if g in (1, 5):         # 乙己
        return (0, 8)
    if g in (2, 3):         # 丙丁
        return (11, 9)
    if g == 7:              # 辛
        return (6, 2)
    return (3, 5)           # 壬癸


def taiji_guiren(gan):
    """太极贵人：只看 干//2，阴阳同组"""
    pair = GAN.index(gan) // 2
    return {0: (0, 6), 1: (3, 9), 2: (4, 10, 1, 7),
            3: (2, 11), 4: (5, 8)}[pair]


# ── 自检：与已破解的表逐项比对 ────────────────────────────
def selftest():
    ok = True

    def chk(name, fn, expect):
        nonlocal ok
        bad = []
        for k, v in expect.items():
            got = ZHI[fn(k)]
            if got != v:
                bad.append(f'{k}→{got}(期望{v})')
        if bad:
            ok = False
            print(f'  ❌ {name}: {" ".join(bad)}')
        else:
            print(f'  ✅ {name}: {len(expect)} 项全对')

    chk('禄神', lu, {'甲': '寅', '乙': '卯', '丙': '巳', '丁': '午', '戊': '巳',
                    '己': '午', '庚': '申', '辛': '酉', '壬': '亥', '癸': '子'})
    chk('羊刃', yangren, {'甲': '卯', '乙': '寅', '丙': '午', '丁': '巳', '戊': '午',
                         '己': '巳', '庚': '酉', '辛': '申', '壬': '子', '癸': '亥'})
    chk('飞刃', feiren, {'甲': '酉', '乙': '申', '丙': '子', '丁': '亥', '戊': '子',
                        '己': '亥', '庚': '卯', '辛': '寅', '壬': '午', '癸': '巳'})
    chk('文昌', wenchang, {'甲': '巳', '乙': '午', '丙': '申', '丁': '酉', '戊': '申',
                          '己': '酉', '庚': '亥', '辛': '子', '壬': '寅', '癸': '卯'})
    chk('国印', guoyin, {'甲': '戌', '乙': '亥', '丙': '丑', '丁': '寅', '戊': '丑',
                        '己': '寅', '庚': '辰', '辛': '巳', '壬': '未', '癸': '申'})
    chk('金舆', jinyu, {'甲': '辰', '乙': '巳', '丙': '未', '丁': '申', '戊': '未',
                       '己': '申', '庚': '戌', '辛': '亥', '壬': '丑', '癸': '寅'})
    chk('天厨', tianchu, {'甲': '巳', '乙': '午', '丙': '巳', '丁': '午', '戊': '申',
                         '己': '酉', '庚': '亥', '辛': '子', '壬': '寅', '癸': '卯'})

    chk('将星', jiangxing, {'子': '子', '丑': '酉', '寅': '午', '卯': '卯',
                           '辰': '子', '巳': '酉', '午': '午', '未': '卯',
                           '申': '子', '酉': '酉', '戌': '午', '亥': '卯'})
    chk('华盖', huagai, {'申': '辰', '子': '辰', '辰': '辰', '寅': '戌', '午': '戌',
                        '戌': '戌', '巳': '丑', '酉': '丑', '丑': '丑',
                        '亥': '未', '卯': '未', '未': '未'})
    chk('桃花', taohua, {'申': '酉', '子': '酉', '辰': '酉', '寅': '卯', '午': '卯',
                        '戌': '卯', '巳': '午', '酉': '午', '丑': '午',
                        '亥': '子', '卯': '子', '未': '子'})
    chk('驿马', yima, {'申': '寅', '子': '寅', '辰': '寅', '寅': '申', '午': '申',
                      '戌': '申', '巳': '亥', '酉': '亥', '丑': '亥',
                      '亥': '巳', '卯': '巳', '未': '巳'})
    chk('亡神', wangshen, {'申': '亥', '子': '亥', '辰': '亥', '寅': '巳', '午': '巳',
                          '戌': '巳', '巳': '申', '酉': '申', '丑': '申',
                          '亥': '寅', '卯': '寅', '未': '寅'})
    chk('劫煞', jiesha, {'申': '巳', '子': '巳', '辰': '巳', '寅': '亥', '午': '亥',
                        '戌': '亥', '巳': '寅', '酉': '寅', '丑': '寅',
                        '亥': '申', '卯': '申', '未': '申'})
    chk('灾煞', zaisha, {'申': '午', '子': '午', '辰': '午', '寅': '子', '午': '子',
                        '戌': '子', '巳': '卯', '酉': '卯', '丑': '卯',
                        '亥': '酉', '卯': '酉', '未': '酉'})
    chk('孤辰', guchen, {'丑': '寅', '亥': '寅', '午': '申', '卯': '巳', '子': '寅',
                        '寅': '巳', '巳': '申', '戌': '亥', '未': '申',
                        '申': '亥', '辰': '巳', '酉': '亥'})
    chk('寡宿', guasu, {'丑': '戌', '亥': '戌', '午': '辰', '卯': '丑', '子': '戌',
                       '寅': '丑', '巳': '辰', '戌': '未', '未': '辰',
                       '申': '未', '辰': '丑', '酉': '未'})
    chk('红鸾', hongluan, {'丑': '寅', '亥': '辰', '午': '酉', '卯': '子', '子': '卯',
                          '寅': '丑', '巳': '戌', '戌': '巳', '未': '申',
                          '申': '未', '辰': '亥', '酉': '午'})
    chk('天喜', tianxi, {'丑': '申', '亥': '戌', '午': '卯', '卯': '午', '子': '酉',
                        '寅': '未', '巳': '辰', '戌': '亥', '未': '寅',
                        '申': '丑', '辰': '巳', '酉': '子'})
    chk('天医', tianyi, {'丑': '子', '亥': '戌', '午': '巳', '卯': '寅', '子': '亥',
                        '寅': '丑', '巳': '辰', '戌': '酉', '未': '午',
                        '申': '未', '辰': '卯', '酉': '申'})
    chk('披麻', pima, {'丑': '戌', '亥': '申', '午': '卯', '卯': '子', '子': '酉',
                      '寅': '亥', '巳': '寅', '戌': '未', '未': '辰',
                      '申': '巳', '辰': '丑', '酉': '午'})
    chk('丧门', sangmen, {'丑': '卯', '亥': '丑', '午': '申', '卯': '巳', '子': '寅',
                         '寅': '辰', '巳': '未', '戌': '子', '未': '酉',
                         '申': '戌', '辰': '午', '酉': '亥'})
    chk('吊客', diaoke, {'丑': '亥', '亥': '酉', '午': '辰', '卯': '丑', '子': '戌',
                        '寅': '子', '巳': '卯', '戌': '申', '未': '巳',
                        '申': '午', '辰': '寅', '酉': '未'})
    chk('勾绞煞', goujiao, {'丑': '辰', '亥': '寅', '午': '酉', '卯': '午', '子': '卯',
                          '寅': '巳', '巳': '申', '戌': '丑', '未': '戌',
                          '申': '亥', '辰': '未', '酉': '子'})
    chk('天乙贵人', lambda g: tianyi_guiren(g)[0], {'甲': '丑', '戊': '丑', '庚': '丑',
                                                  '乙': '子', '己': '子', '丙': '亥',
                                                  '丁': '亥', '辛': '午', '壬': '卯', '癸': '卯'})

    return ok


def unk(z):
    return 0


if __name__ == '__main__':
    selftest()


# ══════════════════════════════════════════════════════════
# 完整版：直接产出四柱神煞（与 JS bzShenshaForPillar 同构）
# ══════════════════════════════════════════════════════════

SANHE = {'申': '申子辰', '子': '申子辰', '辰': '申子辰',
         '寅': '寅午戌', '午': '寅午戌', '戌': '寅午戌',
         '巳': '巳酉丑', '酉': '巳酉丑', '丑': '巳酉丑',
         '亥': '亥卯未', '卯': '亥卯未', '未': '亥卯未'}

YUE_DE_M = {'申子辰': '壬', '寅午戌': '丙', '巳酉丑': '庚', '亥卯未': '甲'}
TIAN_DE_M = {'寅': '丁', '卯': '申', '辰': '壬', '巳': '辛', '午': '亥', '未': '甲',
             '申': '癸', '酉': '寅', '戌': '丙', '亥': '乙', '子': '巳', '丑': '庚'}
DEXIU_M = {'申子辰': set('壬癸戊己丙辛甲己'), '寅午戌': set('丙丁戊癸'),
           '巳酉丑': set('庚辛乙'), '亥卯未': set('甲乙丁壬')}
HE_GAN_M = {'甲': '己', '乙': '庚', '丙': '辛', '丁': '壬', '戊': '癸',
            '己': '甲', '庚': '乙', '辛': '丙', '壬': '丁', '癸': '戊'}
HE_ZHI_M = {'子': '丑', '丑': '子', '寅': '亥', '亥': '寅', '卯': '戌', '戌': '卯',
            '辰': '酉', '酉': '辰', '巳': '申', '申': '巳', '午': '未', '未': '午'}
JIAZI_M = [GAN[i % 10] + ZHI[i % 12] for i in range(60)]
# ── 童子煞 ──────────────────────────────────────────────
# 口诀：春秋寅子贵 / 冬夏卯未辰 / 金木马卯合 / 水火鸡犬多 / 土命逢辰巳
# 只看月支季节（三合局）与年纳音五行，日柱、时柱各自独立判定。
# 丑、申、亥 不在任何一句中 —— 实测这三个支的标注率恰为 0.0%。
TONGZI_SEASON = {}
for _z in '寅卯辰':
    TONGZI_SEASON[_z] = '春'
for _z in '巳午未':
    TONGZI_SEASON[_z] = '夏'
for _z in '申酉戌':
    TONGZI_SEASON[_z] = '秋'
for _z in '亥子丑':
    TONGZI_SEASON[_z] = '冬'


def tongzi_allowed(month_zhi, nayin_wuxing):
    """返回童子煞允许的地支集合（日柱、时柱共用）"""
    s = set()
    season = TONGZI_SEASON.get(month_zhi, '')
    if season in ('春', '秋'):
        s |= {'寅', '子'}
    if season in ('冬', '夏'):
        s |= {'卯', '未', '辰'}
    if nayin_wuxing in '金木':
        s |= {'午', '卯'}
    if nayin_wuxing in '水火':
        s |= {'酉', '戌'}
    if nayin_wuxing == '土':
        s |= {'辰', '巳'}
    return s


GOLD_M = {'乙丑', '己巳', '癸酉'}
# 拱禄：日柱→时柱，夹拱禄位
GONG_LU = {('戊辰', '戊午'), ('丁巳', '丁未'), ('癸丑', '癸亥'),
           ('癸亥', '癸丑'), ('己未', '己巳')}
FUXING_M = {'甲': '寅子', '乙': '丑卯', '丙': '寅子', '丁': '亥', '戊': '申',
            '己': '未', '庚': '午', '辛': '巳', '壬': '辰', '癸': '丑卯'}
# 仅这三个保留小表：无代数式可还原
HONGYAN = {'甲': '午', '乙': '午', '丙': '寅', '丁': '未', '戊': '辰',
           '己': '辰', '庚': '戌', '辛': '酉', '壬': '子', '癸': '申'}
LIUXIA = {'甲': '酉', '乙': '戌', '丙': '未', '丁': '申', '戊': '巳',
          '己': '午', '庚': '辰', '辛': '卯', '壬': '亥', '癸': '寅'}
XUE = {'丑': '子', '亥': '亥', '午': '卯', '卯': '未', '子': '午', '寅': '丑',
       '巳': '申', '戌': '巳', '未': '酉', '申': '辰', '辰': '寅', '酉': '戌'}


def _xunkong_m(gz):
    i = JIAZI_M.index(gz)
    base = (i - i % 10) % 12
    return ZHI[(base + 10) % 12] + ZHI[(base + 11) % 12]


def tianyi_guiren_m(gan):
    g = GAN.index(gan)
    if g in (0, 4, 6):
        return [1, 7]
    if g in (1, 5):
        return [0, 8]
    if g in (2, 3):
        return [11, 9]
    if g == 7:
        return [6, 2]
    return [3, 5]


def taiji_guiren_m(gan):
    return {0: [0, 6], 1: [3, 9], 2: [4, 10, 1, 7], 3: [2, 11], 4: [5, 8]}[GAN.index(gan) // 2]


def pillar_shensha(p, idx, sex=1):
    out = []
    riGan, nianGan = p[2][0], p[0][0]
    nianI = ZHI.index(p[0][1])
    yueI = ZHI.index(p[1][1])
    riI = ZHI.index(p[2][1])
    z = ZHI.index(p[idx][1])
    g = p[idx][0]

    if z == lu(riGan):
        out.append('禄神')
    if z == yangren(riGan):
        out.append('羊刃')
    if z == feiren(riGan):
        out.append('飞刃')

    for nm, fn in (('文昌贵人', wenchang), ('国印贵人', guoyin),
                   ('金舆', jinyu), ('天厨贵人', tianchu)):
        if z in (fn(riGan), fn(nianGan)):
            out.append(nm)
    if z in tianyi_guiren_m(riGan) + tianyi_guiren_m(nianGan):
        out.append('天乙贵人')
    # 福星贵人：甲寅子 乙丑卯 丙寅子 丁亥 戊申 己未 庚午 辛巳 壬辰 癸丑卯
    if p[idx][1] in FUXING_M[riGan] + FUXING_M[nianGan]:
        out.append('福星贵人')
    if z in taiji_guiren_m(riGan) + taiji_guiren_m(nianGan):
        out.append('太极贵人')

    for nm, fn in (('桃花', _taohua), ('驿马', _yima),
                   ('亡神', _wangshen), ('劫煞', _jiesha)):
        if z in (fn(nianI), fn(riI)):
            out.append(nm)
    for nm, fn in (('将星', _jx), ('华盖', _huagai)):
        if idx == 0:
            hit = z == fn(riI)
        elif idx == 2:
            hit = z == fn(nianI)
        else:
            hit = z in (fn(nianI), fn(riI))
        if hit:
            out.append(nm)
    if idx == 0:
        if z == _zaisha(z):
            out.append('灾煞')
    elif idx == 2:
        if z in (_zaisha(nianI), _zaisha(riI)):
            out.append('灾煞')
    else:
        if z == _zaisha(nianI):
            out.append('灾煞')

    if z == _guchen(nianI):
        out.append('孤辰')
    if z == _guasu(nianI):
        out.append('寡宿')
    if idx != 0:
        for nm, tgt in (('红鸾', _hongluan(nianI)), ('天喜', _tianxi(nianI)),
                        ('丧门', _sangmen(nianI)), ('吊客', _diaoke(nianI)),
                        ('披麻', _pima(nianI)), ('勾绞煞', _goujiao(nianI))):
            if z == tgt:
                out.append(nm)

    if z == _tianyi_yue(yueI):
        out.append('天医')
    if HONGYAN[riGan] == p[idx][1]:
        out.append('红艳煞')
    if LIUXIA[riGan] == p[idx][1]:
        out.append('流霞')
    if XUE[p[1][1]] == p[idx][1]:
        out.append('血刃')

    yd = YUE_DE_M[SANHE[p[1][1]]]
    if g == yd:
        out.append('月德贵人')
    if g == HE_GAN_M[yd]:
        out.append('月德合')
    td = TIAN_DE_M[p[1][1]]
    if g == td or p[idx][1] == td:
        out.append('天德贵人')
    tdh = HE_GAN_M[td] if td in HE_GAN_M else HE_ZHI_M[td]
    if (g == tdh) if td in HE_GAN_M else (p[idx][1] == tdh):
        out.append('天德合')
    if g in DEXIU_M[SANHE[p[1][1]]]:
        out.append('德秀贵人')

    xk = set(_xunkong_m(p[0])) | set(_xunkong_m(p[2]))
    if p[idx][1] in xk:
        out.append('空亡')

    return out


# 自坐干支集合型（固定枚举，无代数式）
SELFGZ = {
    '魁罡日': (2, {'壬辰', '庚戌', '庚辰', '戊戌'}),
    '十恶大败': (2, {'丁亥', '丙申', '乙巳', '壬申', '己丑', '庚辰', '戊戌', '甲辰', '癸亥', '辛巳'}),
    '孤鸾煞': (2, {'丁巳', '丙午', '乙巳', '壬子', '戊午', '戊申', '甲寅', '辛亥'}),
    '八专日': (2, {'丁未', '乙卯', '己未', '庚申', '戊戌', '甲寅', '癸丑', '辛酉'}),
    '九丑日': (2, {'丁酉', '壬午', '壬子', '己卯', '己酉', '戊午', '戊子', '辛卯', '辛酉'}),
    '阴差阳错': (2, {'丁丑', '丁未', '丙午', '丙子', '壬戌', '壬辰', '戊寅', '戊申', '癸亥', '癸巳', '辛卯', '辛酉'}),
    '十灵日': (2, {'丁酉', '丙辰', '乙亥', '壬寅', '庚寅', '庚戌', '戊午', '甲辰', '癸未', '辛亥'}),
    '六秀日': (2, {'丁未', '丙午', '己丑', '己未', '戊午', '戊子'}),
}

# 日柱 + 另一柱条件型
GZCOND = {
    '四废日': (2, 1, {'丙午': '亥子丑', '丁巳': '亥子丑', '壬子': '巳午未', '癸亥': '巳午未',
                     '甲寅': '申酉戌', '乙卯': '申酉戌', '庚申': '寅卯辰', '辛酉': '寅卯辰'}),
    '天赦日': (2, 1, {'甲子': '丑亥子', '甲午': '午巳未', '戊寅': '卯寅辰', '戊申': '戌申酉'}),
    '天转日': (2, 1, {'壬子': '丑亥子', '辛酉': '戌申酉', '丙午': '午巳未', '乙卯': '卯寅辰'}),
    '地转日': (2, 1, {'丙子': '丑亥子', '辛卯': '卯寅辰', '戊午': '午巳未', '癸酉': '戌申酉'}),
}


def _nayin_wuxing(gz):
    from core.shensha_lib import _nayin_wuxing as f
    return f(gz)


def all_shensha_algebra(p, sex=1):
    out = [pillar_shensha(p, i, sex) for i in range(4)]
    # 元辰（不查年柱）
    yang_year = GAN.index(p[0][0]) % 2 == 0
    forward = (yang_year and sex == 1) or ((not yang_year) and sex == 2)
    z0 = ZHI.index(p[0][1])
    st = ZHI[(z0 + 1) % 12] if forward else ZHI[(z0 - 1) % 12]
    yc = ZHI[(ZHI.index(st) + 6) % 12]
    for i in (1, 2, 3):
        if p[i][1] == yc:
            out[i].append('元辰')
    # 金神
    for i in (2, 3):
        if p[i] in GOLD_M:
            out[i].append('金神')

    # 自坐干支集合型（这批无代数式，是固定枚举）
    for name, (pos, gzset) in SELFGZ.items():
        if out[pos] is not None and p[pos] in gzset:
            out[pos].append(name)

    # 日柱 + 另一柱条件型
    for name, (pos, condpos, spec) in GZCOND.items():
        cond = p[condpos][1]
        if cond in spec.get(p[pos], ''):
            out[pos].append(name)

    # 纳音型（天罗 / 地网）
    nn = _nayin_wuxing(p[0])
    if nn == '火' and p[2][1] in '戌亥':
        out[2].append('天罗')
    if nn in '土水' and p[2][1] in '辰巳':
        out[2].append('地网')

    # 拱禄：日柱与时柱夹拱「禄位」，只有 5 组固定组合
    #   戊辰/戊午（夹巳）  丁巳/丁未（夹午）  癸丑/癸亥（夹子）
    #   癸亥/癸丑（夹子）  己未/己巳（夹午）
    # 注意：不是任意「同干 + 支差 2」，实测 187 组此类候选里只有这 5 组算拱禄
    if (p[2], p[3]) in GONG_LU:
        out[2].append('拱禄')

    # 天罗地网（合并名）：两组配对各自独立判定后取并集
    # 完整 80 种模式穷尽，22497 样本 100%
    from .tl_table import TL_PATTERNS as _TLS
    _z4 = [x[1] for x in p]
    for (_a, _b), _tab in _TLS.items():
        if _a not in _z4 or _b not in _z4:
            continue
        _key = ''.join(_a if x == _a else _b if x == _b else 'x' for x in _z4)
        for _i in _tab.get(_key, set()):
            out[_i].append('天罗地网')

    # 三奇贵人：连续三柱的天干按固定顺序构成 甲戊庚 / 乙丙丁 / 壬癸辛
    # 只标日柱，4771 样本验证 100%
    _g4 = [x[0] for x in p]
    for _st in (0, 1):
        _seg = ''.join(_g4[_st:_st + 3])
        if _seg in ('甲戊庚', '乙丙丁', '壬癸辛'):
            out[2].append('三奇贵人')
            break

    # 学堂 / 正学堂 / 词馆 / 正词馆（只查月、日、时柱）
    # 年纳音 → 地支；该柱干支决定是「正」还是「非正」（25×2 组合零歧义）
    _xt_zhi = {'金': '巳', '木': '亥', '水': '申', '火': '寅', '土': '申'}
    _cg_zhi = {'金': '申', '木': '寅', '水': '亥', '火': '巳', '土': '亥'}
    _xt_zheng = {'金': {'辛巳'}, '木': {'己亥'}, '水': {'甲申'},
                 '火': {'丙寅'}, '土': {'戊申'}}
    _cg_zheng = {'金': {'壬申'}, '木': {'庚寅'}, '水': {'癸亥'},
                 '火': {'乙巳'}, '土': {'丁亥'}}
    for _i in (1, 2, 3):
        _z = p[_i][1]
        if _z == _xt_zhi.get(nn):
            out[_i].append('正学堂' if p[_i] in _xt_zheng[nn] else '学堂')
        if _z == _cg_zhi.get(nn):
            out[_i].append('正词馆' if p[_i] in _cg_zheng[nn] else '词馆')

    # 童子煞（日柱、时柱各自独立判定）
    _tz = tongzi_allowed(p[1][1], _nayin_wuxing(p[0]))
    if p[2][1] in _tz:
        out[2].append('童子煞')
    if p[3][1] in _tz:
        out[3].append('童子煞')

    return out
