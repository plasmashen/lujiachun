"""
日课用事（人元司令）

实测规律（2026 全年 366 天采集验证）：
  每个月支按其藏干顺序分段当值，段内天干由该月藏干决定。

  实际段长（含边界日归属）：
    寅：戊8  丙7  甲14     卯：甲11 乙19
    辰：乙11 癸3  戊17     巳：戊6  庚9  丙16
    午：丙11 己9  丁11     未：丁11 乙3  己18
    申：戊11 壬3  庚17     酉：庚11 辛20
    戌：辛10 丁3  戊17     亥：戊8  甲5  壬16
    子：壬12 癸19          丑：癸10 辛3  己16

  与通行「人元司令」表的差别：
    通行表按节气后整数天（寅：戊7 丙7 甲16）
    问真按「日」边界含端点，故各段普遍 +1

输出格式：「戊土用事」——天干 + 五行 + 「用事」
  （申月出现「戊己土用事」，因戊己皆土，合称）
"""
import sys
from datetime import datetime, timedelta, timezone

from core.astro import solar_term_time
from core.extras import _load_jieqi_delta, _delta_at

CST = timezone(timedelta(hours=8))

GAN_WUXING = {
    '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
    '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
}

# 每个月的节（决定月支起点）
JIE_OF_MONTH = {
    '寅': '立春', '卯': '惊蛰', '辰': '清明', '巳': '立夏',
    '午': '芒种', '未': '小暑', '申': '立秋', '酉': '白露',
    '戌': '寒露', '亥': '立冬', '子': '大雪', '丑': '小寒',
}

ZHI_ORDER = ['子', '丑', '寅', '卯', '辰', '巳',
             '午', '未', '申', '酉', '戌', '亥']

# 实测「节气日 offset 上界」表（含）
# 格式：月支 → [(天干, 该段最大 offset)]，实测 2026 全年 366 天无重叠无空洞
SILING_MAX = {
    '寅': [('戊', 8), ('丙', 15), ('甲', 29)],
    '卯': [('甲', 11), ('乙', 30)],
    '辰': [('乙', 10), ('癸', 13), ('戊', 30)],
    '巳': [('戊', 6), ('庚', 15), ('丙', 31)],
    '午': [('丙', 11), ('己', 20), ('丁', 31)],
    '未': [('丁', 10), ('乙', 13), ('己', 31)],
    '申': [('戊己', 11), ('壬', 14), ('庚', 31)],
    '酉': [('庚', 11), ('辛', 31)],
    '戌': [('辛', 10), ('丁', 13), ('戊', 30)],
    '亥': [('戊', 8), ('甲', 13), ('壬', 29)],
    '子': [('壬', 11), ('癸', 29)],
    '丑': [('癸', 10), ('辛', 13), ('己', 30)],
}

_D = None


def _delta():
    global _D
    if _D is None:
        _D = _load_jieqi_delta()
    return _D


def _jie_day(year, zhi):
    """该月支对应节气的「日期」（北京时区，00:00 归日）"""
    name = JIE_OF_MONTH[zhi]
    y = year
    # 小寒在 1 月，属丑月（上一年大雪起）；这里按实际年份取
    t = solar_term_time(y, name)
    if t.tzinfo is None:
        t = t.replace(tzinfo=CST)
    t = t + timedelta(seconds=_delta_at(_delta(), y, name, t, t))
    d = t.astimezone(CST).date()
    return datetime(d.year, d.month, d.day, tzinfo=CST)


def rysl(dt):
    """返回「X用事」"""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=CST)
    dt = dt.astimezone(CST)

    # 先定月支（用节为界）
    from core.ganzhi import four_pillars
    p = four_pillars(dt)
    mz = p['month'][1]

    # 该月节的日期
    jd = _jie_day(dt.year, mz)
    # 若当前日期早于该节（跨年小寒情形），退回上一年
    if dt.date() < jd.date():
        jd = _jie_day(dt.year - 1, mz)

    # 用事按「日」切换：节气当天仍属上一月支的末段
    offset = (dt.date() - jd.date()).days
    if offset <= 0:
        # 节气当天及之前：归上一月支的末段
        idx = ZHI_ORDER.index(mz)
        prev_mz = ZHI_ORDER[(idx - 1) % 12]
        psegs = SILING_MAX.get(prev_mz)
        if psegs:
            gan = psegs[-1][0]
            wx = GAN_WUXING.get(gan, GAN_WUXING.get(gan[0], '土'))
            return f"{gan}{wx}用事"

    segs = SILING_MAX.get(mz)
    if not segs:
        return None

    for gan, maxoff in segs:
        if offset <= maxoff:
            wx = GAN_WUXING.get(gan, GAN_WUXING.get(gan[0], '土'))
            return f"{gan}{wx}用事"
    gan = segs[-1][0]
    wx = GAN_WUXING.get(gan, GAN_WUXING.get(gan[0], '土'))
    return f"{gan}{wx}用事"


if __name__ == '__main__':
    import json
    data = json.load(open('examples/rysl_2026_sample.json', encoding='utf-8'))
    ok = tot = 0
    bad = []
    for ds, exp in data:
        dt = datetime.strptime(ds, '%Y-%m-%d').replace(hour=12, tzinfo=CST)
        got = rysl(dt)
        tot += 1
        if got == exp:
            ok += 1
        elif len(bad) < 12:
            bad.append((ds, exp, got))
    print(f"日课用事一致 {ok}/{tot} = {ok/tot*100:.2f}%")
    for ds, e, g in bad:
        print(f"  {ds}  API={e}  本地={g}")
