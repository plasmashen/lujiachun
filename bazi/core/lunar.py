"""
农历转换（真朔望月天文算法，非查表）

问真 API 在 bz["8"] 返回「1990年四月廿一 巳时」这类农历串。
本模块用天文算法算真实朔日，而不是用 1900-2100 的查表法。

原理：
  农历月初一 = 含「朔」的那一天（北京时间）
  月序：以冬至所在月为十一月，两冬至之间有 13 个月则置闰
        （无中气之月为闰月）

天文依赖 core.astro 的太阳黄经函数。
"""
import math
from datetime import datetime, timedelta, timezone

CST = timezone(timedelta(hours=8))

# 农历月名
MONTH_NAMES = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊']
DAY_NAMES = [
    '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
    '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '廿十',
    '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '卅十',
]
ZHI = '子丑寅卯辰巳午未申酉戌亥'


def _julian_day_to_dt(jd):
    """儒略日 → UTC datetime"""
    jd += 0.5
    z = int(jd)
    f = jd - z
    if z < 2299161:
        a = z
    else:
        alpha = int((z - 1867216.25) / 36524.25)
        a = z + 1 + alpha - int(alpha / 4)
    b = a + 1524
    c = int((b - 122.1) / 365.25)
    d = int(365.25 * c)
    e = int((b - d) / 30.6001)
    day = b - d - int(30.6001 * e) + f
    month = e - 1 if e < 14 else e - 13
    year = c - 4716 if month > 2 else c - 4715
    dd = int(day)
    frac = day - dd
    return datetime(year, month, dd, tzinfo=timezone.utc) + timedelta(days=frac)


def _dt_to_jd(dt):
    """datetime → 儒略日"""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=CST)
    dt = dt.astimezone(timezone.utc)
    y, m = dt.year, dt.month
    d = dt.day + (dt.hour + dt.minute / 60 + dt.second / 3600) / 24
    if m <= 2:
        y -= 1
        m += 12
    a = y // 100
    b = 2 - a + a // 4
    return int(365.25 * (y + 4716)) + int(30.6001 * (m + 1)) + d + b - 1524.5


def new_moon_jd(k):
    """
    第 k 个朔的儒略日（k=0 对应 2000-01-06 附近）
    用 Meeus《Astronomical Algorithms》第 49 章的低精度公式，
    精度约 ±0.02 天（约 30 分钟），对「确定朔在哪一天」足够。
    """
    T = k / 1236.85
    jde = (2451550.09766 + 29.530588861 * k
           + 0.00015437 * T ** 2 - 0.000000150 * T ** 3
           + 0.00000000073 * T ** 4)
    E = 1 - 0.002516 * T - 0.0000074 * T ** 2
    M = math.radians(2.5534 + 29.10535670 * k
                     - 0.0000014 * T ** 2 - 0.00000011 * T ** 3)
    Mp = math.radians(201.5643 + 385.81693528 * k
                      + 0.0107582 * T ** 2 + 0.00001238 * T ** 3
                      - 0.000000058 * T ** 4)
    F = math.radians(160.7108 + 390.67050284 * k
                     - 0.0016118 * T ** 2 - 0.00000227 * T ** 3
                     + 0.000000011 * T ** 4)
    Om = math.radians(124.7746 - 1.56375588 * k
                      + 0.0020672 * T ** 2 + 0.00000215 * T ** 3)

    corr = (-0.40720 * math.sin(Mp)
            + 0.17241 * E * math.sin(M)
            + 0.01608 * math.sin(2 * Mp)
            + 0.01039 * math.sin(2 * F)
            + 0.00739 * E * math.sin(Mp - M)
            - 0.00514 * E * math.sin(Mp + M)
            + 0.00208 * E * E * math.sin(2 * M)
            - 0.00111 * math.sin(Mp - 2 * F)
            - 0.00057 * math.sin(Mp + 2 * F)
            + 0.00056 * E * math.sin(2 * Mp + M)
            - 0.00042 * math.sin(3 * Mp)
            + 0.00042 * E * math.sin(M + 2 * F)
            + 0.00038 * E * math.sin(M - 2 * F)
            - 0.00024 * E * math.sin(2 * Mp - M)
            - 0.00017 * math.sin(Om)
            - 0.00007 * math.sin(Mp + 2 * M)
            + 0.00004 * math.sin(2 * Mp - 2 * F)
            + 0.00004 * math.sin(3 * M)
            + 0.00003 * math.sin(Mp + M - 2 * F)
            + 0.00003 * math.sin(2 * Mp + 2 * F)
            - 0.00003 * math.sin(Mp + M + 2 * F)
            + 0.00003 * math.sin(Mp - M + 2 * F)
            - 0.00002 * math.sin(Mp - M - 2 * F)
            - 0.00002 * math.sin(3 * Mp + M)
            + 0.00002 * math.sin(4 * Mp))

    # 附加修正（Meeus 49.1 后半部分）
    A1 = math.radians(299.77 + 0.107408 * k - 0.009173 * T ** 2)
    A2 = math.radians(251.88 + 0.016321 * k)
    A3 = math.radians(251.83 + 26.651886 * k)
    A4 = math.radians(349.42 + 36.412478 * k)
    A5 = math.radians(84.66 + 18.206239 * k)
    A6 = math.radians(141.74 + 53.303771 * k)
    A7 = math.radians(207.14 + 2.453732 * k)
    A8 = math.radians(154.84 + 7.306860 * k)
    A9 = math.radians(34.52 + 27.261239 * k)
    A10 = math.radians(207.19 + 0.121824 * k)
    A11 = math.radians(291.34 + 1.844379 * k)
    A12 = math.radians(161.72 + 24.198154 * k)
    A13 = math.radians(239.56 + 25.513099 * k)
    A14 = math.radians(331.55 + 3.592518 * k)
    corr += (0.000325 * math.sin(A1) + 0.000165 * math.sin(A2)
             + 0.000164 * math.sin(A3) + 0.000126 * math.sin(A4)
             + 0.000110 * math.sin(A5) + 0.000062 * math.sin(A6)
             + 0.000060 * math.sin(A7) + 0.000056 * math.sin(A8)
             + 0.000047 * math.sin(A9) + 0.000042 * math.sin(A10)
             + 0.000040 * math.sin(A11) + 0.000037 * math.sin(A12)
             + 0.000035 * math.sin(A13) + 0.000023 * math.sin(A14))
    return jde + corr


def _sun_longitude(jd):
    """太阳视黄经（度）"""
    T = (jd - 2451545.0) / 36525
    L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T ** 2
    M = math.radians(357.52911 + 35999.05029 * T - 0.0001537 * T ** 2)
    C = ((1.914602 - 0.004817 * T - 0.000014 * T ** 2) * math.sin(M)
         + (0.019993 - 0.000101 * T) * math.sin(2 * M)
         + 0.000289 * math.sin(3 * M))
    true_long = L0 + C
    omega = math.radians(125.04 - 1934.136 * T)
    return (true_long - 0.00569 - 0.00478 * math.sin(omega)) % 360


def _sun_term_jd(year, term_index):
    """
    第 term_index 个中气（0=冬至附近的 270°）儒略日，粗略即可。
    用二分法找黄经等于目标度数的时刻。
    """
    # term_index: 0 → 270°(冬至), 1 → 300°, 2 → 330°, 3 → 0°(春分) ...
    target = (270 + 30 * term_index) % 360
    # 估算起点
    base = _dt_to_jd(datetime(year, 1, 1, tzinfo=CST))
    lo, hi = base, base + 400
    for _ in range(60):
        mid = (lo + hi) / 2
        lon = _sun_longitude(mid)
        # 处理跨越 0°
        diff = (lon - target + 180) % 360 - 180
        if diff < 0:
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2


def solar_to_lunar(dt):
    """
    公历 datetime → (农历年, 月序, 是否闰月, 日)
    返回 (year, month, is_leap, day)
    """
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=CST)
    jd = _dt_to_jd(dt)

    # 找当前日期之前的最后一个朔
    # 取「北京日期 <= 当日」的最后一个朔（朔在当日即为初一，不问时刻）
    cur_d = (dt.astimezone(CST)).date()
    if dt.astimezone(CST).hour >= 23:
        cur_d = cur_d + timedelta(days=1)
    k = int((jd - 2451550.09766) / 29.530588861)
    def _nm_date(kk):
        return _julian_day_to_dt(new_moon_jd(kk)).astimezone(CST).date()
    while _nm_date(k + 1) <= cur_d:
        k += 1
    while _nm_date(k) > cur_d:
        k -= 1
    nm_jd = new_moon_jd(k)
    # 日界按北京时间：两边都取北京日期再相减
    d_bj = (dt.astimezone(CST)).date()
    if dt.astimezone(CST).hour >= 23:      # 23:00 起算次日（问真早子时口径）
        d_bj = d_bj + timedelta(days=1)
    nm_bj = _julian_day_to_dt(nm_jd).astimezone(CST).date()
    day = (d_bj - nm_bj).days + 1
    # 朔日若落在当日 12:00 之后，公历当天仍算上月末日
    # （问真口径：朔日按「日」算，朔在当日即当日为初一）
    if day <= 0:
        day = 1

    # 找冬至（决定月序基准）
    def _nm_date(kk):
        return _julian_day_to_dt(new_moon_jd(kk)).astimezone(CST).date()

    def _dz_date(year):
        return _julian_day_to_dt(_sun_term_jd(year, 0)).astimezone(CST).date()

    def _dz_month_k(year):
        """year 年冬至所在朔月（必须含冬至的月 = 十一月）"""
        dz_d = _dz_date(year)
        kk = int((_sun_term_jd(year, 0) - 2451550.09766) / 29.530588861)
        while _nm_date(kk + 1) <= dz_d:
            kk += 1
        while _nm_date(kk) > dz_d:
            kk -= 1
        return kk

    # 定位 jd 所在农历年：找「含 jd 的冬至区间」
    # 用连续三个冬至，取包含 jd 的那一段
    y0 = dt.year
    cands = []
    for yy in (y0 - 1, y0, y0 + 1):
        cands.append((yy, _dz_month_k(yy), _dz_date(yy)))
    cands.sort(key=lambda x: x[2])

    seg = None
    for i in range(len(cands) - 1):
        if cands[i][2] <= (dt.astimezone(CST).date()) < cands[i + 1][2]:
            seg = (cands[i], cands[i + 1])
            break
    if seg is None:
        seg = (cands[-2], cands[-1])

    (y_start, k11, _), (y_end, k_next, _) = seg
    n_months = k_next - k11

    # 中气判定：以冬至（270°）为锚点，每 30° 一个中气
    # 关键规则：含冬至之月恒为十一月，冬至月必定含中气
    def _has_zhongqi(kk):
        """本月是否含中气：按「北京日期」落在 [初一日, 下月初一日) 内"""
        nm = new_moon_jd(kk)
        nm2 = new_moon_jd(kk + 1)
        d1 = _julian_day_to_dt(nm).astimezone(CST).date()
        d2 = _julian_day_to_dt(nm2).astimezone(CST).date()
        lon1 = _sun_longitude(nm)
        span = (_sun_longitude(nm2) - lon1) % 360
        for deg in range(0, 360, 30):
            off = (deg - lon1) % 360
            if off >= span:
                continue
            # 二分求该中气精确时刻
            lo, hi = nm, nm2
            for _ in range(60):
                mid = (lo + hi) / 2
                d = (_sun_longitude(mid) - deg + 180) % 360 - 180
                if d < 0:
                    lo = mid
                else:
                    hi = mid
            t = (lo + hi) / 2
            td = _julian_day_to_dt(t).astimezone(CST).date()
            if d1 <= td < d2:
                return True
        return False

    leap_k = None
    if n_months == 13:
        for kk in range(k11, k_next):
            if not _has_zhongqi(kk):
                leap_k = kk
                break
        if leap_k is None:
            leap_k = k11 + 12
    else:
        k_next = k11 + 12

    offset = k - k11
    if leap_k is not None and k >= leap_k:
        offset -= 1
    month = (11 + offset - 1) % 12 + 1
    is_leap = (k == leap_k)

    # 农历年：如果月份 >= 11 且公历在年初 → 上一年
    lunar_year = dt.year
    if month >= 11 and dt.month <= 2:
        lunar_year -= 1

    return lunar_year, month, is_leap, day


def lunar_text(dt):
    """「1990年四月廿一 巳时」格式"""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=CST)
    ly, lm, leap, ld = solar_to_lunar(dt)
    ms = ('闰' if leap else '') + MONTH_NAMES[lm - 1] + '月'
    ds = DAY_NAMES[ld - 1] if 1 <= ld <= 30 else str(ld)
    # 时辰
    h = dt.hour
    zi = ((h + 1) // 2) % 12
    return f"{ly}年{ms}{ds} {ZHI[zi]}时"


if __name__ == '__main__':
    tests = [
        datetime(1990, 5, 15, 10, 30, tzinfo=CST),   # API: 1990年四月廿一 巳时
        datetime(2026, 11, 11, 0, 0, tzinfo=CST),    # API: 2026年十月初三 子时
        datetime(2000, 1, 1, 12, 0, tzinfo=CST),
        datetime(1984, 2, 2, 12, 0, tzinfo=CST),
        datetime(2024, 2, 10, 12, 0, tzinfo=CST),    # 春节
    ]
    for t in tests:
        print(f"{t.strftime('%Y-%m-%d %H:%M')} → {lunar_text(t)}")
