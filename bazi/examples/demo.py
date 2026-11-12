"""最小可运行示例：生成一张完整命盘并与问真 API 基准对拍。

运行：
    cd bazi
    python3 examples/demo.py
"""
import sys
import os
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from engine import paipan
from core.lunar import lunar_text
from core.rysl import rysl

# ── 基准：问真 getbasebz8.php?d=1990-05-15 10:30:00&s=1&today=2026-11-11 ──
BIRTH = datetime(1990, 5, 15, 10, 30)
SEX = 1                     # 1=男 2=女
TODAY = '2026-11-11'        # 影响 tdbz（胎对八字）

chart = paipan(BIRTH, SEX, today=TODAY)

print('=' * 52)
print(f"出生：{BIRTH:%Y-%m-%d %H:%M}  {'男' if SEX == 1 else '女'}")
print(f"农历：{chart['lunar']}")
print(f"日课：{rysl(BIRTH)}")
print('=' * 52)

# 四柱表
P = chart['pillars']
print(f"\n{'':6}{'年柱':^8}{'月柱':^8}{'日柱':^8}{'时柱':^8}")
rows = [
    ('干支', chart['pillar_list']),
    ('十神', chart['ten_gods']),
    ('藏干', [' '.join(x) for x in chart['canggan']]),
    ('纳音', chart['nayin']),
    ('星运', chart['xingyun']),
    ('自坐', chart['zizuo']),
    ('空亡', chart['kongwang']),
]
for label, vals in rows:
    print(f"{label:6}" + ''.join(f"{v:^8}" for v in vals))

# 神煞
print("\n【神煞】")
for i, name in enumerate(['年柱', '月柱', '日柱', '时柱']):
    print(f"  {name}：{'、'.join(chart['shensha'][i]) or '—'}")

# 起运 / 大运
q = chart['qiyun']
print(f"\n【起运】{q['age']}岁{q['months']}月{q['days']}天 "
      f"{q['hours']}时{q['minutes']}分{q['seconds']}秒"
      f"（{'顺行' if q['forward'] else '逆行'}）")
print(f"  交运：{q['jiaoyun_text']}")
print(f"\n【大运】{' '.join(chart['dayun'])}")
print(f"\n【胎元】{chart['taiyuan']}　【胎息】{chart['taixi']}"
      f"　【命宫】{chart['minggong']}　【身宫】{chart['shengong']}")
print(f"\n【五行】{chart['wuxing_count']}")

# 对拍
EXPECT = {
    '四柱': (chart['pillar_list'], ['庚午', '辛巳', '庚辰', '辛巳']),
    '十神': (chart['ten_gods'], ['比肩', '劫财', '日主', '劫财']),
    '纳音': (chart['nayin'], ['路旁土', '白蜡金', '白蜡金', '白蜡金']),
    '农历': (chart['lunar'], '1990年四月廿一 巳时'),
}
print('\n' + '=' * 52)
for k, (got, exp) in EXPECT.items():
    print(f"{'✓' if got == exp else '✗'} {k} 对拍 API")
