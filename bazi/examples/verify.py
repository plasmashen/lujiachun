"""批量对拍问真 API：把 samples.jsonl 格式的样本逐条比对。

样本格式（每行一个 JSON）：
    {"input": "1990-05-15 10:30:00", "sex": 1, "result": { ... 问真 API 原始返回 ... }}

用法：
    python3 examples/verify.py path/to/samples.jsonl [--limit 500]

若无样本文件，可先用 demo.py 看单例输出。
"""
import json
import sys
import os
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from engine import paipan
from core.lunar import lunar_text

CST = timezone(timedelta(hours=8))


def pillars_of(b):
    """API 的 bz 字典 → 四柱列表"""
    return [str(b[str(i)]) + str(b[str(i + 1)]) for i in (0, 2, 4, 6)]


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return 1
    path = sys.argv[1]
    limit = None
    if '--limit' in sys.argv:
        limit = int(sys.argv[sys.argv.index('--limit') + 1])

    seen, rows = set(), []
    with open(path, encoding='utf-8') as f:
        for line in f:
            if not line.strip():
                continue
            r = json.loads(line)
            k = (r['input'], r.get('sex', 1))
            if k in seen:
                continue
            seen.add(k)
            rows.append(r)

    stats = {}
    skipped = 0
    n = 0

    def hit(name, got, exp):
        if exp is None:
            return
        s = stats.setdefault(name, [0, 0])
        s[1] += 1
        if got == exp:
            s[0] += 1

    for r in rows:
        if limit and n >= limit:
            break
        # 剔除非法时间（小时 >= 24）的脏样本
        try:
            if int(r['input'].split(' ')[1].split(':')[0]) >= 24:
                skipped += 1
                continue
            dt = datetime.strptime(r['input'], '%Y-%m-%d %H:%M:%S').replace(tzinfo=CST)
        except Exception:
            skipped += 1
            continue

        res = r['result']
        if len(res.get('szshensha') or []) < 4:
            skipped += 1
            continue

        m = paipan(dt, r.get('sex', 1), today='2026-11-11')
        n += 1
        b = res.get('bz') or {}

        hit('四柱', m['pillar_list'], pillars_of(b))
        hit('十神', m['ten_gods'], res.get('ss'))
        hit('藏干', m['canggan'], res.get('cg'))
        hit('藏干十神', m['canggan_gods'], res.get('cgss'))
        hit('纳音', m['nayin'], res.get('ny'))
        hit('星运', m['xingyun'], res.get('xy'))
        hit('自坐', m['zizuo'], res.get('zz'))
        hit('空亡', m['kongwang'], res.get('kw'))
        hit('大运', m['dayun'], res.get('dayun'))
        hit('小运', m['xiaoyun'], res.get('xiaoyun'))
        hit('胎元', m['taiyuan'], res.get('taiyuan'))
        hit('胎息', m['taixi'], res.get('taixi'))
        hit('命宫', m['minggong'], res.get('minggong'))
        hit('身宫', m['shengong'], res.get('shenggong'))
        hit('农历', m['lunar'], b.get('8'))

        q = m['qiyun']
        arr = [q.get('age'), q.get('months'), q.get('days'),
               q.get('hours'), q.get('minutes'), q.get('seconds')]
        hit('起运六位', arr, res.get('qiyunarr'))
        hit('交运文案', q.get('jiaoyun_text'), res.get('jiaoyun'))

        # 神煞：整柱完全一致才算
        # 注意 engine 的 shensha 返回 5 元素（前 4 柱 + 问真 szshensha 的空占位维）
        api_sz = res.get('szshensha') or []
        hit('神煞整柱', [sorted(x) for x in m['shensha'][:4]],
            [sorted(x) for x in api_sz[:4]])

        # 大运神煞：内容一致（忽略顺序）
        api_dy = res.get('dyshensha') or []
        if api_dy and len(api_dy) == len(m['dyshensha']):
            ok = all(a[0] == b2[0] and set(a[1] or []) == set(b2[1] or [])
                     for a, b2 in zip(api_dy, m['dyshensha']))
            hit('大运神煞内容', ok, True)

    print(f"有效样本 {n}　跳过 {skipped}\n")
    print(f"{'字段':<14}{'一致':>8}{'总数':>8}{'正确率':>9}")
    for k in ('四柱', '十神', '藏干', '藏干十神', '纳音', '星运', '自坐', '空亡',
              '大运', '小运', '胎元', '胎息', '命宫', '身宫', '农历',
              '起运六位', '交运文案', '神煞整柱', '大运神煞内容'):
        if k not in stats:
            continue
        ok, tot = stats[k]
        pct = ok / tot * 100 if tot else 0
        mark = ' ✓' if pct == 100 else ''
        print(f"{k:<14}{ok:>8}{tot:>8}{pct:>8.2f}%{mark}")
    return 0


if __name__ == '__main__':
    sys.exit(main())
