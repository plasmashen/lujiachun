"""
缓存预处理结果，让后续 δ 实验从 6 分钟降到秒级。

缓存内容（每条样本）：
  birth_ms, bias, api6, raw_jie_ms, jname, jy, forward, delta_req

之后所有 δ 相关实验都读这个缓存。
"""
import json
import sys
import os
from datetime import datetime, timedelta, timezone

sys.path.insert(0, '/opt/data/bazi')
import engine
from core.extras import TIANGAN
from core.astro import solar_term_time

CST = timezone(timedelta(hours=8))
JIE = ['立春', '惊蛰', '清明', '立夏', '芒种', '小暑',
       '立秋', '白露', '寒露', '立冬', '大雪', '小寒']
OUT = '/opt/data/bazi/data/qiyun_cache.json'


def load_targets():
    rows = []
    for f in ('samples.jsonl', 'full.jsonl', 'balanced.jsonl', 'jieqi_dense.jsonl'):
        try:
            rows += [json.loads(l) for l in open(f'/opt/data/bazi/data/{f}',
                                                encoding='utf-8') if l.strip()]
        except FileNotFoundError:
            pass
    seen, out = set(), []
    for r in rows:
        k = (r['input'], r.get('sex', 1))
        if k in seen:
            continue
        seen.add(k)
        try:
            if int(r['input'].split(' ')[1].split(':')[0]) >= 24:
                continue
            dt = datetime.strptime(r['input'], '%Y-%m-%d %H:%M:%S').replace(tzinfo=CST)
        except Exception:
            continue
        a = r['result'].get('qiyunarr') or []
        if len(a) != 6:
            continue
        out.append((dt, r.get('sex', 1), a))
    return out


_CACHE = {}


def jie_bounds(year):
    if year in _CACHE:
        return _CACHE[year]
    out = []
    for name in JIE:
        for y in (year - 1, year, year + 1):
            try:
                t = solar_term_time(y, name)
                if t.tzinfo is None:
                    t = t.replace(tzinfo=CST)
                out.append((t, name, y))
            except Exception:
                pass
    out.sort(key=lambda x: x[0])
    _CACHE[year] = out
    return out


def build():
    targets = load_targets()
    recs = []
    for dt, sex, api in targets:
        try:
            m = engine.paipan(dt, sex, today='2026-11-10')
        except Exception:
            continue
        q = m.get('qiyun') or {}
        fwd = q.get('forward')
        if fwd is None:
            continue
        yang = TIANGAN.index(m['pillars']['year'][0]) % 2 == 0
        bias = 30 if (yang == fwd) else -30
        bounds = jie_bounds(dt.year)
        nb = (min((b for b in bounds if b[0] > dt), key=lambda x: x[0]) if fwd
              else max((b for b in bounds if b[0] <= dt), key=lambda x: x[0]))
        raw, jname, jy = nb
        nom = (api[0] * 31104000 + api[1] * 2592000 + api[2] * 86400
               + api[3] * 3600 + api[4] * 60 + api[5])
        api_sec = (nom + bias) / 120.0
        base = (raw - dt).total_seconds() if fwd else (dt - raw).total_seconds()
        d = (api_sec - base) if fwd else (base - api_sec)
        recs.append({
            'ms': int(dt.timestamp() * 1000),
            'bias': bias,
            'api': api,
            'raw': raw.timestamp(),          # 浮点秒，保留精度
            'tss': q.get('total_seconds_raw'),  # 引擎实际用的距节秒
            'jname': jname,
            'jy': jy,
            'fwd': fwd,
            'dreq': d,
        })
    return recs


def load():
    if not os.path.exists(OUT):
        recs = build()
        json.dump(recs, open(OUT, 'w'), ensure_ascii=False)
        return recs
    return json.load(open(OUT, encoding='utf-8'))


if __name__ == '__main__':
    recs = build()
    json.dump(recs, open(OUT, 'w'), ensure_ascii=False)
    print(f"已写 {OUT}：{len(recs)} 条")
    print(f"文件大小 {os.path.getsize(OUT)/1024:.0f} KB")
