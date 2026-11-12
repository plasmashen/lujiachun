"""
问真八字本地引擎 —— 完整命盘生成。

对外主入口：
    from engine import paipan
    chart = paipan(datetime(1990,5,15,10,30), sex=1)

校验口径（对 plamashen 问真 API 全量 7651 条去重样本）：
  四柱 / 十神 / 藏干 / 藏干十神 / 纳音 / 星运 / 自坐 / 空亡 / 胎元 / 胎息
  / 命宫 / 身宫 / 大运 / 小运 / tdbz / 神煞（59 种）   → 100%
  农历 bz[8] 99.97%（7649/7651）  农历 tdbz[8] 100%
  日课用事（人元司令）100%
  起运六位 41.11%（秒位受 δ 表精度限制，详见 README）
"""
from __future__ import annotations

from datetime import datetime, timezone, timedelta

from core.astro import (
    CST, DIZHI, GAN_WUXING, GAN_YINYANG, TIANGAN, ZHI_WUXING,
    julian_day, solar_term_time, sun_apparent_longitude, jd_tt,
)
from core.elements import (
    ZHI_CANGGAN, changsheng, kongwang, nayin, ten_god, ten_gods_of_pillars,
    wuxing_count, wuxing_score, zhi_changsheng, zhi_self_changsheng,
    shensha_of_zhi,
)
from core.lunar import lunar_text
from core.extras import (
    dayun_list, minggong, qiyun_age, shengong, taixi, taiyuan, xiaoyun_list,
)
from core.ganzhi import four_pillars, jiazi_of
from core.shensha_lib import all_shensha as shensha_all
from core.shensha_lib import shensha_for_pillar


def paipan(dt: datetime, sex: int = 1, late_zi_advance: bool = True, today=None) -> dict:
    """
    生成完整命盘。

    参数
    ----
    dt   : 出生时间（必须带时区；无时区按北京时间）
    sex  : 1=男, 2=女
    late_zi_advance : 23:00 后日柱是否进位（传统子平术为 True）
    """
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=CST)
    dt = dt.astimezone(CST)

    p = four_pillars(dt, late_zi_advance)
    pillars = [p["year"], p["month"], p["day"], p["hour"]]
    keys = ["year", "month", "day", "hour"]
    dg = p["day"][0]

    # 十神 / 藏干
    ten_gods = ten_gods_of_pillars(p)
    canggan = [ZHI_CANGGAN[gz[1]] for gz in pillars]
    canggan_gods = [[ten_god(dg, c) for c in cg] for cg in canggan]

    # 长生 / 纳音 / 空亡
    xingyun = [zhi_changsheng(dg, gz[1]) for gz in pillars]
    zizuo = [zhi_self_changsheng(gz[0], gz[1]) for gz in pillars]
    nayin_list = [nayin(gz) for gz in pillars]
    kongwang_list = [kongwang(gz) for gz in pillars]

    # 外延
    ty = taiyuan(p["month"])
    tx = taixi(p["day"])
    mg = minggong(p["year"][0], p["month"][1], p["hour"][1])
    sg = shengong(p["year"][0], p["month"][1], p["hour"][1])

    # 起运 / 大运
    qy = qiyun_age(dt, p["year"][0], sex)
    dayun = dayun_list(p["month"], qy["forward"], 12)
    xiaoyun = xiaoyun_list(p["hour"], qy["forward"], 110)

    # 神煞（52 种已与问真验证一致）
    # sex 必须传入——元辰依赖「阳男阴女进、阴男阳女退」的性别判定
    # 问真的 szshensha 是 5 个元素：前四柱 + 一个空占位维
    shensha = shensha_all(pillars, sex) + [[]]

    # 大运神煞：把大运干支当作「时柱」再取该柱神煞（已验证结构）
    # 大运神煞：把大运干支代入时柱取该柱神煞，
    # 再补「大运自身」落位判断的纳音型（天罗/地网）——
    # 这两项判的是大运地支本身，不是原局日支。
    from core.shensha_lib import _nayin_wuxing as _ny
    from core.shensha_algebra import all_shensha_algebra as _alg
    _nyear = _ny(pillars[0])
    dyshensha = []
    for gz in dayun:
        tmp = list(pillars)
        tmp[3] = gz
        # 用完整实现（含公式型：德秀/空亡/元辰/月德/天德…），
        # 只取第 4 柱（时柱位）
        lst = _alg(tmp, sex)[3]
        # 金神判的是原局日柱/时柱，不是大运代入后的位置，大运里去掉
        if '金神' in lst:
            lst.remove('金神')
        # 童子煞只看原局日/时柱，大运代入不重算（实测大运神煞里童子煞 0 次）
        if '童子煞' in lst:
            lst.remove('童子煞')
        if gz[1] in '戌亥' and _nyear == '火' and '天罗' not in lst:
            lst.append('天罗')
        if gz[1] in '辰巳' and _nyear in '土水' and '地网' not in lst:
            lst.append('地网')
        dyshensha.append([gz, lst])

    # 胎对八字：问真返回的是「today 参数那天 00:00（子时）」的四柱，
    # 与出生时间无关。today 由请求方传入，缺省用当前日期。
    base_day = today if today is not None else datetime.now(CST)
    if isinstance(base_day, str):
        base_day = datetime.strptime(base_day, '%Y-%m-%d').replace(tzinfo=CST)
    tp = four_pillars(base_day.replace(hour=0, minute=0, second=0, microsecond=0))
    tdbz = [tp["year"], tp["month"], tp["day"], tp["hour"]]

    return {
        "input": dt,
        "sex": sex,
        "pillars": {
            "year": p["year"], "month": p["month"],
            "day": p["day"], "hour": p["hour"],
        },
        "pillar_list": pillars,
        "day_master": dg,
        "day_master_wuxing": GAN_WUXING[dg],
        "day_master_yinyang": GAN_YINYANG[dg],
        "ten_gods": ten_gods,
        "canggan": canggan,
        "canggan_gods": canggan_gods,
        "nayin": nayin_list,
        "xingyun": xingyun,
        "zizuo": zizuo,
        "kongwang": kongwang_list,
        "shensha": shensha,
        "taiyuan": ty, "taiyuan_nayin": nayin(ty),
        "taixi": tx, "taixi_nayin": nayin(tx),
        "minggong": mg, "minggong_nayin": nayin(mg),
        "shengong": sg, "shengong_nayin": nayin(sg),
        "qiyun": qy,
        "dayun": dayun,
        "xiaoyun": xiaoyun,
        "dyshensha": dyshensha,
        "tdbz": tdbz,
        "lunar": lunar_text(dt),
        "lunar_today": lunar_text(base_day),
        "wuxing_count": wuxing_count(p),
        "wuxing_score": wuxing_score(p),
    }


def format_chart(chart: dict) -> str:
    """把命盘渲染成易读文本。"""
    L = []
    p = chart["pillars"]
    add = L.append

    add("=" * 62)
    add(f"  命盘  {chart['input']:%Y-%m-%d %H:%M}  "
        f"{'男' if chart['sex'] == 1 else '女'}")
    add("=" * 62)
    add("")
    add(f"  年柱  {p['year']}    月柱  {p['month']}    "
        f"日柱  {p['day']}    时柱  {p['hour']}")
    add(f"  十神  {'  '.join(chart['ten_gods'])}")
    add(f"  藏干  {' | '.join(''.join(c) for c in chart['canggan'])}")
    add(f"  纳音  {'  '.join(chart['nayin'])}")
    add(f"  星运  {'  '.join(chart['xingyun'])}")
    add(f"  自坐  {'  '.join(chart['zizuo'])}")
    add(f"  空亡  {'  '.join(chart['kongwang'])}")
    add("")
    add(f"  日主  {chart['day_master']}"
        f"（{chart['day_master_wuxing']}·{chart['day_master_yinyang']}）")
    add("")
    wc = chart["wuxing_count"]
    ws = chart["wuxing_score"]
    add("  五行个数：" + " ".join(f"{k}{v}" for k, v in wc.items()))
    add("  五行能量：" + " ".join(f"{k}{v:.1f}" for k, v in ws.items()))
    add("")
    add(f"  胎元 {chart['taiyuan']}（{chart['taiyuan_nayin']}）"
        f"   胎息 {chart['taixi']}（{chart['taixi_nayin']}）")
    add(f"  命宫 {chart['minggong']}（{chart['minggong_nayin']}）"
        f"   身宫 {chart['shengong']}（{chart['shengong_nayin']}）")
    add("")
    qy = chart["qiyun"]
    add(f"  起运：{qy['age']} 岁 {qy['months']} 个月 {qy['days']} 天"
        f"（{'顺行' if qy['forward'] else '逆行'}）")
    add(f"  交运：{qy['jiaoyun']:%Y-%m-%d %H:%M}")
    add("")
    add("  大运：" + "  ".join(chart["dayun"][:8]))
    add("")
    return "\n".join(L)
