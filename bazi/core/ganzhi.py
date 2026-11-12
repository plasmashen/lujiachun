"""
干支历法核心：年柱 / 月柱 / 日柱 / 时柱。

规则遵循传统子平术（与问真、万年历一致）：
  • 年柱以「立春」为界，不是元旦也不是春节
  • 月柱以 12 个「节」为界（立春→寅月，惊蛰→卯月，…）
  • 日柱按连续干支计数，以儒略日推算
  • 时柱按两小时一辰；23:00-23:59 为「晚子时」，日柱进位到次日
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from .astro import (
    CST, DIZHI, GAN_WUXING, JIE, TIANGAN, ZHI_WUXING,
    julian_day, solar_term_time,
)

# 60 甲子
JIAZI = [TIANGAN[i % 10] + DIZHI[i % 12] for i in range(60)]


def jiazi_of(index: int) -> str:
    return JIAZI[index % 60]


# ── 年柱 ────────────────────────────────────────────────────
def year_pillar(dt: datetime) -> tuple[str, int]:
    """
    年柱。以立春为界：dt 早于当年立春则属上一年。
    返回 (干支, 公历年)。
    """
    year = dt.year
    lichun = solar_term_time(year, "立春")
    if dt < lichun:
        year -= 1
    # 1984 为甲子年
    idx = (year - 1984) % 60
    return jiazi_of(idx), year


# ── 月柱 ────────────────────────────────────────────────────
def _jie_boundaries(year: int) -> list[tuple[datetime, int]]:
    """
    返回按时间排序的 (节时刻, 月支序号) 列表，覆盖 year-1 年小寒 ~ year+1 年立春。
    月支序号：寅=0（正月），卯=1，…，丑=11。
    """
    out = []
    # 小寒→丑月(11)，立春→寅月(0)，惊蛰→卯月(1)…
    mapping = {"立春": 0, "惊蛰": 1, "清明": 2, "立夏": 3, "芒种": 4, "小暑": 5,
               "立秋": 6, "白露": 7, "寒露": 8, "立冬": 9, "大雪": 10, "小寒": 11}
    for y in (year - 1, year, year + 1):
        for name, zi in mapping.items():
            out.append((solar_term_time(y, name), zi))
    out.sort(key=lambda x: x[0])
    return out


def month_pillar(dt: datetime) -> tuple[str, int]:
    """
    月柱。返回 (干支, 月支序号 寅=0…丑=11)。
    月干由年干推：甲己之年丙作首（寅月天干 = (年干序*2 + 2) % 10）
    """
    ygan, _ = year_pillar(dt)
    ygan_i = TIANGAN.index(ygan[0])

    bids = _jie_boundaries(dt.year)
    zi = None
    for t, z in bids:
        if dt >= t:
            zi = z
        else:
            break
    if zi is None:
        # dt 早于所有边界（极端情况），取最后一个
        zi = bids[-1][1]

    # 寅月天干：甲年/己年→丙寅
    first_gan = (ygan_i * 2 + 2) % 10
    gan = TIANGAN[(first_gan + zi) % 10]
    zhi = DIZHI[(2 + zi) % 12]  # 寅=索引2
    return gan + zhi, zi


# ── 日柱 ────────────────────────────────────────────────────
# 基准：1949-10-01 为甲子日（已验证与主流万年历一致）
_DAY_EPOCH = datetime(1949, 10, 1, tzinfo=CST)
_DAY_EPOCH_IDX = 0  # 甲子


def day_pillar(dt: datetime, late_zi_advance: bool = True) -> str:
    """
    日柱。
    late_zi_advance=True：23:00 之后视为次日（传统「晚子时换日」）。
    """
    d = dt
    if late_zi_advance and dt.hour >= 23:
        d = dt + timedelta(days=1)
    days = (datetime(d.year, d.month, d.day, tzinfo=CST) - _DAY_EPOCH).days
    return jiazi_of(_DAY_EPOCH_IDX + days)


# ── 时柱 ────────────────────────────────────────────────────
def hour_branch_index(dt: datetime) -> int:
    """时支序号：23:00-00:59 → 子(0)，01:00-02:59 → 丑(1) …"""
    h = dt.hour
    return ((h + 1) // 2) % 12


def hour_pillar(dt: datetime) -> str:
    """
    时柱。时干由日干推：甲己还加甲（子时天干 = (日干序*2) % 10）
    注意：23:00 之后日柱已进位，时干须用进位后的日干。
    """
    dgan = day_pillar(dt)[0]
    dgan_i = TIANGAN.index(dgan)
    zi = hour_branch_index(dt)
    gan = TIANGAN[(dgan_i * 2 + zi) % 10]
    return gan + DIZHI[zi]


# ── 四柱 ────────────────────────────────────────────────────
def four_pillars(dt: datetime, late_zi_advance: bool = True) -> dict:
    """
    返回完整四柱。

    晚子时（23:00-23:59）：日柱进位到次日（传统「晚子时换日」），
    但年柱、月柱仍按实际时刻所在的节气区间判定 —— 实测问真 API 即如此：
    2032-02-03 23:51（次日才立春）返回辛亥年辛丑月，而非进位的壬寅月。
    """
    y, ynum = year_pillar(dt)
    m, mzi = month_pillar(dt)
    d = day_pillar(dt, late_zi_advance)
    h = hour_pillar(dt)
    return {
        "year": y, "month": m, "day": d, "hour": h,
        "year_num": ynum, "month_zi": mzi,
    }


def pillars_str(dt: datetime) -> str:
    p = four_pillars(dt)
    return f"{p['year']} {p['month']} {p['day']} {p['hour']}"
