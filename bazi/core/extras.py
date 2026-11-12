"""
四柱外延要素：胎元 / 胎息 / 命宫 / 身宫 / 起运 / 大运 / 小运。

全部公式均已用 103 条问真 API 样本反推验证至 100% 一致：
  • 胎元   = 月干+1，月支+3
  • 胎息   = 日干五合（甲↔己、乙↔庚…）+ 日支六合
  • 命宫支 = (17 − 月支序 − 时支序) mod 12
  • 身宫支 = (月支序 + 时支序 + 1) mod 12
  • 命宫/身宫干 = 五虎遁（由年干推）
"""
from __future__ import annotations

import math

from datetime import datetime, timedelta

from .astro import CST, DIZHI, JIE, TIANGAN, solar_term_time

# 五虎遁：年干 → 寅月天干序号
_WUHU = {"甲": 2, "己": 2, "乙": 4, "庚": 4, "丙": 6, "辛": 6,
         "丁": 8, "壬": 8, "戊": 0, "癸": 0}

# 天干五合
_GAN_HE = {"甲": "己", "己": "甲", "乙": "庚", "庚": "乙", "丙": "辛",
           "辛": "丙", "丁": "壬", "壬": "丁", "戊": "癸", "癸": "戊"}

# 地支六合
_ZHI_HE = {"子": "丑", "丑": "子", "寅": "亥", "亥": "寅", "卯": "戌",
           "戌": "卯", "辰": "酉", "酉": "辰", "巳": "申", "申": "巳",
           "午": "未", "未": "午"}


def gz_with_year_gan(year_gan: str, zhi: str) -> str:
    """五虎遁：由年干推某地支的天干，拼成干支。"""
    first = _WUHU[year_gan] % 10
    zi = (DIZHI.index(zhi) - 2) % 12   # 寅=0
    return TIANGAN[(first + zi) % 10] + zhi


def taiyuan(month_pillar: str) -> str:
    """胎元：月干进一位，月支进三位。"""
    g = TIANGAN.index(month_pillar[0])
    z = DIZHI.index(month_pillar[1])
    return TIANGAN[(g + 1) % 10] + DIZHI[(z + 3) % 12]


def taixi(day_pillar: str) -> str:
    """胎息：日干取五合，日支取六合。"""
    return _GAN_HE[day_pillar[0]] + _ZHI_HE[day_pillar[1]]


def minggong(year_gan: str, month_zhi: str, hour_zhi: str) -> str:
    """命宫：支序 (17 − 月 − 时) mod 12，天干五虎遁。"""
    mi = DIZHI.index(month_zhi)
    hi = DIZHI.index(hour_zhi)
    zhi = DIZHI[(17 - mi - hi) % 12]
    return gz_with_year_gan(year_gan, zhi)


def shengong(year_gan: str, month_zhi: str, hour_zhi: str) -> str:
    """身宫：支序 (月 + 时 + 1) mod 12，天干五虎遁。"""
    mi = DIZHI.index(month_zhi)
    hi = DIZHI.index(hour_zhi)
    zhi = DIZHI[(mi + hi + 1) % 12]
    return gz_with_year_gan(year_gan, zhi)


def jiaoyun_rule(qiyun: dict, birth: datetime, year_gan: str) -> str:
    """
    交运规则描述。问真的格式：「逢X、Y年 <节气>后N天 交大运」

    X = 实际交运日期的年柱天干（以立春为界）
    Y = X 的合化干（甲→己，乙→庚…）
    <节气>与 N = 交运时刻落在哪个节之后几天

    已用 407 条样本验证 100% 吻合。
    """
    # 交运时刻 = 出生时刻 + 起运年/月/日，再加上 qiyunarr 的时分数
    jt = qiyun["jiaoyun"]

    # 交运日期的年柱天干（以立春为界）
    from .ganzhi import year_pillar
    jy_gan, _ = year_pillar(jt)
    first = jy_gan[0]

    GAN_HE = {"甲": "己", "己": "甲", "乙": "庚", "庚": "乙", "丙": "辛",
              "辛": "丙", "丁": "壬", "壬": "丁", "戊": "癸", "癸": "戊"}
    second = GAN_HE[first]

    # 找交运时刻之前最近的「节」
    bounds = []
    for y in (jt.year - 1, jt.year, jt.year + 1):
        for name in JIE:
            bounds.append((solar_term_time(y, name), name))
    bounds.sort()
    prev = [b for b in bounds if b[0] <= jt]
    if not prev:
        return ""
    pj, pn = prev[-1]
    days = int((jt - pj).total_seconds() // 86400)

    return f"逢{first}、{second}年 {pn}后{days}天 交大运"


# ── 大运 / 起运 ─────────────────────────────────────────────
def _load_jieqi_delta() -> dict:
    """
    加载节气时刻校准表（问真 vs 本地算法，单位秒）。

    表由 shensha 样本反推得到：同一节气内「名义秒/120 - 本地距节秒」恒定，
    因此可认为差异全部来自节气时刻本身。缺省返回空字典（不修正）。
    """
    global _DELTA_CACHE
    if _DELTA_CACHE is not None:
        return _DELTA_CACHE
    import json
    import os
    path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                        "data", "jieqi_delta.json")
    try:
        with open(path, encoding="utf-8") as f:
            _DELTA_CACHE = json.load(f)
    except (FileNotFoundError, ValueError):
        _DELTA_CACHE = {}
    return _DELTA_CACHE


_DELTA_CACHE = None

# 节气名级 δ 中位：仅在完全没有邻近年份数据时兜底。
# 注意：直接用 11.28 秒给「缺年份的大雪」兜底会引入 0.76 秒误差，
# 经名义秒 ×120 放大成 91 秒，足以让分位和秒位整位翻转。
# 优先用邻近年份同名节气的实测值。
_NAME_MEDIAN = {
    "立春": 3.53, "惊蛰": 3.61, "清明": 3.51, "立夏": 2.91,
    "芒种": 4.73, "小暑": 7.96, "立秋": 11.03, "白露": 14.94,
    "寒露": 10.71, "立冬": 9.93, "大雪": 11.28, "小寒": 6.45,
}


def _slope(table: dict) -> float:
    """从表中取出全局斜率 K（所有条目共用）"""
    for v in table.values():
        if isinstance(v, list) and len(v) >= 2:
            return float(v[1])
    return 0.0


def _neighbor_delta(table: dict, year: int, name: str) -> float:
    """用邻近年份同名节气的 δ0 做插值兜底（±6 年内最接近的两个）"""
    pts = []
    for dy in range(1, 8):
        for yy in (year - dy, year + dy):
            v = table.get(f"{yy}|{name}")
            if isinstance(v, list) and len(v) >= 2:
                pts.append((dy, float(v[0])))
            elif isinstance(v, (int, float)):
                pts.append((dy, float(v)))
        if len(pts) >= 2:
            break
    if not pts:
        return _NAME_MEDIAN.get(name, 0.0)
    # 距离加权：越近权重越大
    tot_w = sum(1.0 / d for d, _ in pts)
    return sum(v / d for d, v in pts) / tot_w



def _delta_at(table: dict, year: int, name: str, ref: datetime, jie_local: datetime) -> float:
    """
    取某节气相对本地算法的时刻修正（秒）。

    表中存 [a, b]，表示 δ = a + b·x，x 为距节天数（带符号，出生时刻侧）。
    早期表只存标量 δ，按常数处理。
    """
    v = table.get(f"{year}|{name}")
    if v is None:
        # 缺项：δ 的年际跳动是离散的（相邻年份可差 7 秒），插值必然失效，
        # 只能用同名节气中位数兜底。真正的解法是把该节气补采齐。
        a = _NAME_MEDIAN.get(name, 0.0)
        b = _slope(table)
        x = (ref - jie_local).total_seconds() / 86400.0
        return a + b * x
    if isinstance(v, (int, float)):
        return float(v)
    a, b = v[0], v[1]
    x = (ref - jie_local).total_seconds() / 86400.0
    return a + b * x


def qiyun_age(birth: datetime, year_gan: str, sex: int) -> dict:
    """
    起运岁数与交运时间。

    阳年男 / 阴年女 → 顺排，数到下一个「节」
    阴年男 / 阳年女 → 逆排，数到上一个「节」
    三天折一年，一天折四月，一时辰折十天。
    """
    yang_year = TIANGAN.index(year_gan) % 2 == 0
    forward = (yang_year and sex == 1) or (not yang_year and sex == 2)

    # 找出相邻的节
    mapping = {"立春": 0, "惊蛰": 1, "清明": 2, "立夏": 3, "芒种": 4, "小暑": 5,
               "立秋": 6, "白露": 7, "寒露": 8, "立冬": 9, "大雪": 10, "小寒": 11}
    tm = {z: (2 + z) % 12 for z in range(12)}
    _DELTA = _load_jieqi_delta()
    bounds = []
    for y in (birth.year - 1, birth.year, birth.year + 1):
        for name in JIE:
            t = solar_term_time(y, name)
            t = t + timedelta(seconds=_delta_at(_DELTA, y, name, birth, t))
            bounds.append((t, name))
    bounds.sort()

    if forward:
        nxt, jie_name = next(b for b in bounds if b[0] > birth)
        delta = nxt - birth
    else:
        prv, jie_name = max((b for b in bounds if b[0] <= birth), key=lambda b: b[0])
        delta = birth - prv

    total_seconds = delta.total_seconds()
    total_days = total_seconds / 86400.0

    # 问真换算（用 4389 条样本反推）：
    #   名义秒 = round(距节真实秒 × 120) - 30 × 阴阳(年干) × 顺逆
    #
    # 「-30 × 阴阳 × 顺逆」是四象限规律，实测均值：
    #   阳干·顺行  raw-api = +0.2275s  → 减 30
    #   阳干·逆行  raw-api = -0.2268s  → 加 30
    #   阴干·顺行  raw-api = -0.2663s  → 加 30
    #   阴干·逆行  raw-api = +0.2341s  → 减 30
    # 即修正量 = 30 × (阳干?+1:-1) × (顺行?+1:-1) 名义秒，
    # 换算成真实秒恰为 ±0.25s，四象限全部吻合。
    #
    # 分位正确率：恒定 -30 时 55.3% → 四象限 92.5%
    yang_year = TIANGAN.index(year_gan) % 2 == 0
    bias = 30 if (yang_year == forward) else -30
    # 注：曾试过按性别加残差（男 +0.5 / 女 +2），在 2428 条子集上
    # 六位全对 43.04% → 50.21%，但全量 9279 条上是 65.05% → 50.50%，
    # 属典型过拟合，已回滚。
    total_seconds_nominal = int(round(total_seconds * 120)) - bias
    _YEAR = 360 * 86400
    _MONTH = 30 * 86400
    y_int, rem = divmod(total_seconds_nominal, _YEAR)
    m_int, rem = divmod(rem, _MONTH)
    d_int, rem = divmod(rem, 86400)
    hours, rem = divmod(rem, 3600)
    minutes, rem = divmod(rem, 60)
    seconds = rem

    # 交运时刻 = 出生时刻 + 年/月/日
    total_months = birth.month + m_int
    ty = birth.year + y_int + (total_months - 1) // 12
    tm = (total_months - 1) % 12 + 1
    try:
        base = datetime(ty, tm, 1, birth.hour, birth.minute, tzinfo=CST)
    except ValueError:
        base = datetime(ty, tm, 1, 0, 0, tzinfo=CST)
    jiaoyun = base + timedelta(days=birth.day + d_int - 1)

    # 交运描述串：「逢X、Y年 <节>后N天 交大运」
    # 首干 = 交运日期的年柱天干（以立春为界）；次干 = 首干的合化干
    from .ganzhi import four_pillars
    jy_year_gan = four_pillars(jiaoyun)["year"][0]
    HE = {"甲": "己", "己": "甲", "乙": "庚", "庚": "乙", "丙": "辛",
          "辛": "丙", "丁": "壬", "壬": "丁", "戊": "癸", "癸": "戊"}
    second_gan = HE[jy_year_gan]
    # 交运日期之前最近的「节」
    jy_bounds = []
    for y in (jiaoyun.year - 1, jiaoyun.year, jiaoyun.year + 1):
        for name in JIE:
            t = solar_term_time(y, name)
            t = t + timedelta(seconds=_delta_at(_DELTA, y, name, jiaoyun, t))
            jy_bounds.append((t, name))
    jy_bounds.sort()
    prev_jie, prev_name = max((b for b in jy_bounds if b[0] <= jiaoyun), key=lambda b: b[0])
    offset_days = round((jiaoyun - prev_jie).total_seconds() / 86400.0)
    jiaoyun_text = f"逢{jy_year_gan}、{second_gan}年 {prev_name}后{offset_days}天 交大运"

    return {
        "forward": forward,
        "age": y_int,
        "months": m_int,
        "days": d_int,
        "hours": hours,
        "minutes": minutes,
        "seconds": seconds,
        "qiyunsui": y_int + 1,          # 问真的「起运岁数」= 起运年 + 1
        "jiaoyun": jiaoyun,
        "jiaoyun_text": jiaoyun_text,
        "total_days": round(total_days, 4),
        "total_seconds_raw": total_seconds,
        "nominal_raw": total_seconds_nominal,
    }


def dayun_list(month_pillar: str, forward: bool, count: int = 12) -> list[str]:
    """大运排列：从月柱起，顺行或逆行，各取 60 甲子中的下一个。"""
    from .ganzhi import JIAZI
    idx = JIAZI.index(month_pillar)
    step = 1 if forward else -1
    return [JIAZI[(idx + step * (i + 1)) % 60] for i in range(count)]


def xiaoyun_list(hour_pillar: str, forward: bool, count: int = 110) -> list[str]:
    """
    小运：以时柱为锚点，xy[59] = 时柱，xy[59+k] = 时柱 + k·step。

    已用 2384 条问真样本验证：xy[59] 恒等于时柱（100%），
    且整个序列严格按 step（顺 +1 / 逆 −1）展开。
    """
    from .ganzhi import JIAZI
    idx = JIAZI.index(hour_pillar)
    step = 1 if forward else -1
    ANCHOR = 59
    return [JIAZI[(idx + step * (i - ANCHOR)) % 60] for i in range(count)]
