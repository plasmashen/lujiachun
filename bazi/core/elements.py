"""
命理要素：十神 / 地支藏干 / 纳音 / 十二长生 / 空亡 / 神煞。

所有规则遵循传统子平术标准，并与问真 API 输出逐项校验。
"""
from __future__ import annotations

from .astro import DIZHI, TIANGAN

# ── 地支藏干（本气、中气、余气）─────────────────────────────
ZHI_CANGGAN: dict[str, list[str]] = {
    "子": ["癸"],
    "丑": ["己", "癸", "辛"],
    "寅": ["甲", "丙", "戊"],
    "卯": ["乙"],
    "辰": ["戊", "乙", "癸"],
    "巳": ["丙", "庚", "戊"],
    "午": ["丁", "己"],
    "未": ["己", "丁", "乙"],
    "申": ["庚", "壬", "戊"],
    "酉": ["辛"],
    "戌": ["戊", "辛", "丁"],
    "亥": ["壬", "甲"],
}

# ── 十神 ────────────────────────────────────────────────────
# 以日干为我；五行生克 + 阴阳同异
_WX_SHENG = {"木": "火", "火": "土", "土": "金", "金": "水", "水": "木"}
_WX_KE = {"木": "土", "土": "水", "水": "火", "火": "金", "金": "木"}


def _wuxing(gan_or_zhi: str) -> str:
    from .astro import GAN_WUXING, ZHI_WUXING
    if gan_or_zhi in GAN_WUXING:
        return GAN_WUXING[gan_or_zhi]
    return ZHI_WUXING[gan_or_zhi]


def _yinyang(gan: str) -> str:
    return "阳" if TIANGAN.index(gan) % 2 == 0 else "阴"


def ten_god(day_gan: str, other: str) -> str:
    """
    十神。other 为天干（判断藏干十神时也传天干）。
    """
    me_wx, it_wx = _wuxing(day_gan), _wuxing(other)
    same_yy = _yinyang(day_gan) == _yinyang(other)

    if it_wx == me_wx:
        return "比肩" if same_yy else "劫财"
    if _WX_SHENG[me_wx] == it_wx:          # 我生者
        return "食神" if same_yy else "伤官"
    if _WX_KE[me_wx] == it_wx:             # 我克者
        return "偏财" if same_yy else "正财"
    if _WX_KE[it_wx] == me_wx:             # 克我者
        return "七杀" if same_yy else "正官"
    if _WX_SHENG[it_wx] == me_wx:          # 生我者
        return "偏印" if same_yy else "正印"
    return "?"


# ── 纳音（60 甲子 → 30 纳音）────────────────────────────────
_NAYIN_PAIRS = [
    ("甲子", "乙丑", "海中金"), ("丙寅", "丁卯", "炉中火"), ("戊辰", "己巳", "大林木"),
    ("庚午", "辛未", "路旁土"), ("壬申", "癸酉", "剑锋金"), ("甲戌", "乙亥", "山头火"),
    ("丙子", "丁丑", "涧下水"), ("戊寅", "己卯", "城头土"), ("庚辰", "辛巳", "白蜡金"),
    ("壬午", "癸未", "杨柳木"), ("甲申", "乙酉", "泉中水"), ("丙戌", "丁亥", "屋上土"),
    ("戊子", "己丑", "霹雳火"), ("庚寅", "辛卯", "松柏木"), ("壬辰", "癸巳", "长流水"),
    ("甲午", "乙未", "沙中金"), ("丙申", "丁酉", "山下火"), ("戊戌", "己亥", "平地木"),
    ("庚子", "辛丑", "壁上土"), ("壬寅", "癸卯", "金箔金"), ("甲辰", "乙巳", "覆灯火"),
    ("丙午", "丁未", "天河水"), ("戊申", "己酉", "大驿土"), ("庚戌", "辛亥", "钗钏金"),
    ("壬子", "癸丑", "桑柘木"), ("甲寅", "乙卯", "大溪水"), ("丙辰", "丁巳", "沙中土"),
    ("戊午", "己未", "天上火"), ("庚申", "辛酉", "石榴木"), ("壬戌", "癸亥", "大海水"),
]
NAYIN = {}
for a, b, name in _NAYIN_PAIRS:
    NAYIN[a] = name
    NAYIN[b] = name


def nayin(ganzhi: str) -> str:
    return NAYIN.get(ganzhi, "")


# ── 十二长生 ────────────────────────────────────────────────
CHANGSHENG_NAMES = ["长生", "沐浴", "冠带", "临官", "帝旺", "衰",
                    "病", "死", "墓", "绝", "胎", "养"]

# 各天干长生起点地支
_CHANGSHENG_START = {
    "甲": "亥", "乙": "午", "丙": "寅", "丁": "酉",
    "戊": "寅", "己": "酉", "庚": "巳", "辛": "子",
    "壬": "申", "癸": "卯",
}
# 阳干顺行，阴干逆行
_YANG_GAN = set("甲丙戊庚壬")


def changsheng(gan: str, zhi: str) -> str:
    """某天干在某地支的十二长生状态。"""
    start = _CHANGSHENG_START[gan]
    si = DIZHI.index(start)
    zi = DIZHI.index(zhi)
    if gan in _YANG_GAN:
        step = (zi - si) % 12
    else:
        step = (si - zi) % 12
    return CHANGSHENG_NAMES[step]


def zhi_changsheng(day_gan: str, zhi: str) -> str:
    """日干在各柱地支上的长生状态（问真的「星运」）。"""
    return changsheng(day_gan, zhi)


def zhi_self_changsheng(gan: str, zhi: str) -> str:
    """
    自坐：用「该柱自身的天干」查其坐支的十二长生状态。
    与「星运」不同 —— 星运用日干，自坐用本柱天干。
    例：甲寅 → 甲在寅为临官；丙子 → 丙在子为胎。
    """
    return changsheng(gan, zhi)


# ── 空亡（旬空）──────────────────────────────────────────────
def kongwang(ganzhi: str) -> str:
    """
    旬空。以该干支所在旬的首干支推算：旬空 = 该旬缺的两个地支。
    """
    g = TIANGAN.index(ganzhi[0])
    z = DIZHI.index(ganzhi[1])
    # 该干支在本旬内的序号
    xun_start_zhi = (z - g) % 12
    k1 = (xun_start_zhi + 10) % 12
    k2 = (xun_start_zhi + 11) % 12
    return DIZHI[k1] + DIZHI[k2]


# ── 神煞（常用项）───────────────────────────────────────────
# 天乙贵人：日干 → 地支
_TIANYI = {
    "甲": ["丑", "未"], "戊": ["丑", "未"], "庚": ["丑", "未"],
    "乙": ["子", "申"], "己": ["子", "申"],
    "丙": ["亥", "酉"], "丁": ["亥", "酉"],
    "壬": ["卯", "巳"], "癸": ["卯", "巳"],
    "辛": ["午", "寅"],
}
# 文昌贵人
_WENCHANG = {"甲": "巳", "乙": "午", "丙": "申", "丁": "酉", "戊": "申",
             "己": "酉", "庚": "亥", "辛": "子", "壬": "寅", "癸": "卯"}
# 禄神
_LUSHEN = {"甲": "寅", "乙": "卯", "丙": "巳", "丁": "午", "戊": "巳",
           "己": "午", "庚": "申", "辛": "酉", "壬": "亥", "癸": "子"}
# 羊刃（阳干）
_YANGREN = {"甲": "卯", "丙": "午", "戊": "午", "庚": "酉", "壬": "子"}
# 桃花（咸池）：年/日支三合局 → 桃花
_TAOHUA = {"申": "酉", "子": "酉", "辰": "酉", "寅": "卯", "午": "卯", "戌": "卯",
           "巳": "午", "酉": "午", "丑": "午", "亥": "子", "卯": "子", "未": "子"}
# 驿马
_YIMA = {"申": "寅", "子": "寅", "辰": "寅", "寅": "申", "午": "申", "戌": "申",
         "巳": "亥", "酉": "亥", "丑": "亥", "亥": "巳", "卯": "巳", "未": "巳"}
# 华盖
_HUAGAI = {"申": "辰", "子": "辰", "辰": "辰", "寅": "戌", "午": "戌", "戌": "戌",
           "巳": "丑", "酉": "丑", "丑": "丑", "亥": "未", "卯": "未", "未": "未"}
# 将星
_JIANGXING = {"申": "子", "子": "子", "辰": "子", "寅": "午", "午": "午", "戌": "午",
              "巳": "酉", "酉": "酉", "丑": "酉", "亥": "卯", "卯": "卯", "未": "卯"}


def shensha_of_zhi(day_gan: str, ref_zhi: str, zhi: str) -> list[str]:
    """
    某地支上的神煞。ref_zhi 为年支或日支（三合类神煞的参照）。
    """
    out = []
    if zhi in _TIANYI.get(day_gan, []):
        out.append("天乙贵人")
    if _WENCHANG.get(day_gan) == zhi:
        out.append("文昌贵人")
    if _LUSHEN.get(day_gan) == zhi:
        out.append("禄神")
    if _YANGREN.get(day_gan) == zhi:
        out.append("羊刃")
    if _TAOHUA.get(ref_zhi) == zhi:
        out.append("桃花")
    if _YIMA.get(ref_zhi) == zhi:
        out.append("驿马")
    if _HUAGAI.get(ref_zhi) == zhi:
        out.append("华盖")
    if _JIANGXING.get(ref_zhi) == zhi:
        out.append("将星")
    # 空亡
    return out


# ── 五行统计 ────────────────────────────────────────────────
def ten_gods_of_pillars(pillars: dict) -> list[str]:
    """
    四柱天干对日干的十神。日柱位置返回「日主」（传统标注，不是十神）。
    """
    dg = pillars["day"][0]
    out = []
    for key in ("year", "month", "day", "hour"):
        if key == "day":
            out.append("日主")
        else:
            out.append(ten_god(dg, pillars[key][0]))
    return out


def wuxing_count(pillars: dict) -> dict[str, int]:
    """四柱八字（不含藏干）的五行个数。"""
    from .astro import GAN_WUXING, ZHI_WUXING
    cnt = {k: 0 for k in "木火土金水"}
    for key in ("year", "month", "day", "hour"):
        gz = pillars[key]
        cnt[GAN_WUXING[gz[0]]] += 1
        cnt[ZHI_WUXING[gz[1]]] += 1
    return cnt


def wuxing_score(pillars: dict) -> dict[str, float]:
    """
    五行能量（含藏干加权）。本气 1.0，中气 0.5，余气 0.3。
    """
    from .astro import GAN_WUXING
    score = {k: 0.0 for k in "木火土金水"}
    weights = [1.0, 0.5, 0.3]
    for key in ("year", "month", "day", "hour"):
        gz = pillars[key]
        score[GAN_WUXING[gz[0]]] += 1.0
        for i, cg in enumerate(ZHI_CANGGAN[gz[1]]):
            score[GAN_WUXING[cg]] += weights[min(i, 2)]
    return {k: round(v, 2) for k, v in score.items()}
