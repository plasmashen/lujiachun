/**
 * 命盘案例库 —— 四个页面共用的本地存储层
 *
 * 数据结构：
 *   bz_cases_v1 = [
 *     { id, name, date, time, sex, kind, note, created, updated }
 *   ]
 *
 * kind: 'bazi' | 'ziwei' | 'hepan'(双人) | 'huangli'
 * date: 'YYYY-MM-DD'   time: 'HH:MM'
 * 双人盘用 person2: {date, time, sex}
 *
 * 不上传、不同步，纯 localStorage。清浏览器数据即消失（已在 UI 提示）。
 */
(function (global) {
  'use strict';

  var KEY = 'bz_cases_v1';
  var MAX = 200;

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }

  function save(list) {
    try {
      if (list.length > MAX) list = list.slice(0, MAX);
      localStorage.setItem(KEY, JSON.stringify(list));
      return true;
    } catch (e) {
      // 配额满
      return false;
    }
  }

  function uid() {
    return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  /**
   * 新增案例
   * @param o {name, date, time, sex, kind, note, person2}
   */
  function add(o) {
    var list = load();
    var now = Date.now();
    var item = {
      id: uid(),
      name: (o.name || '').trim() || defaultName(o),
      date: o.date, time: o.time || '00:00',
      sex: o.sex || 1,
      kind: o.kind || 'bazi',
      note: o.note || '',
      created: now, updated: now
    };
    if (o.person2) item.person2 = o.person2;
    list.unshift(item);
    if (!save(list)) return null;
    return item;
  }

  function defaultName(o) {
    var s = (o.date || '').replace(/-/g, '/');
    return s + ' ' + (o.sex == 2 ? '女' : '男');
  }

  function update(id, patch) {
    var list = load();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        for (var k in patch) {
          if (patch.hasOwnProperty(k)) list[i][k] = patch[k];
        }
        list[i].updated = Date.now();
        save(list);
        return list[i];
      }
    }
    return null;
  }

  function remove(id) {
    save(load().filter(function (x) { return x.id !== id; }));
  }

  function get(id) {
    var list = load();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function list(kind) {
    var all = load();
    if (!kind) return all;
    return all.filter(function (x) { return x.kind === kind; });
  }

  function clear(kind) {
    if (!kind) { save([]); return; }
    save(load().filter(function (x) { return x.kind !== kind; }));
  }

  /** 是否已保存过同一组参数（避免重复保存） */
  function exists(o) {
    var all = load();
    for (var i = 0; i < all.length; i++) {
      var x = all[i];
      if (x.kind === (o.kind || 'bazi') && x.date === o.date &&
          x.time === (o.time || '00:00') && x.sex == o.sex) {
        return x;
      }
    }
    return null;
  }

  /** 格式化时间戳 */
  function fmtTime(ts) {
    var d = new Date(ts);
    var p = function (n) { return n < 10 ? '0' + n : n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
      ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  // ───────────── 导出 / 导入 ─────────────

  var EXPORT_VER = 1;

  /**
   * 导出为 JSON 字符串
   * @param kinds 可选，只导出指定类型（不传=全部）
   */
  function exportJSON(kinds) {
    var all = load();
    if (kinds && kinds.length) {
      all = all.filter(function (x) { return kinds.indexOf(x.kind) >= 0; });
    }
    var payload = {
      app: 'lujiachun-bazi',
      version: EXPORT_VER,
      exported: Date.now(),
      exportedText: fmtTime(Date.now()),
      count: all.length,
      cases: all
    };
    return JSON.stringify(payload, null, 2);
  }

  /** 校验单条记录是否像我们的数据 */
  function validItem(x) {
    return x && typeof x === 'object' &&
      typeof x.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x.date) &&
      ['bazi', 'ziwei', 'hepan', 'huangli'].indexOf(x.kind) >= 0;
  }

  /**
   * 从 JSON 字符串导入
   * @param text JSON 文本
   * @param opt {merge:true 合并 / false 覆盖, kinds:[...]}
   * @returns {ok, added, skipped, replaced, error}
   */
  function importJSON(text, opt) {
    opt = opt || {};
    var data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return { ok: false, error: '不是合法的 JSON 文件' };
    }

    // 兼容两种格式：{cases:[...]} 或直接数组
    var arr = null;
    if (Array.isArray(data)) arr = data;
    else if (data && Array.isArray(data.cases)) arr = data.cases;

    if (!arr) return { ok: false, error: '文件里没有找到案例数据（缺 cases 字段）' };

    var valid = arr.filter(validItem);
    if (!valid.length) {
      return { ok: false, error: '没有可导入的有效记录（共 ' + arr.length + ' 条都不符合格式）' };
    }

    if (opt.kinds && opt.kinds.length) {
      valid = valid.filter(function (x) { return opt.kinds.indexOf(x.kind) >= 0; });
    }

    var incoming = valid.map(function (x) {
      var o = {
        id: x.id || uid(),
        name: String(x.name || defaultName(x)).slice(0, 60),
        date: x.date,
        time: x.time || '00:00',
        sex: x.sex == 2 ? 2 : 1,
        kind: x.kind,
        note: String(x.note || '').slice(0, 500),
        created: x.created || Date.now(),
        updated: x.updated || Date.now()
      };
      if (x.person2 && x.person2.date) {
        o.person2 = {
          date: x.person2.date,
          time: x.person2.time || '00:00',
          sex: x.person2.sex == 2 ? 2 : 1
        };
      }
      return o;
    });

    var base = opt.merge === false ? [] : load();
    var stats = { added: 0, skipped: 0, replaced: opt.merge === false ? load().length : 0 };

    // 以 id 去重；没有 id 的按 (kind+date+time+sex) 去重
    var byId = {}, byKey = {};
    base.forEach(function (x) {
      byId[x.id] = true;
      byKey[x.kind + '|' + x.date + '|' + x.time + '|' + x.sex] = true;
    });

    var out = base.slice();
    incoming.forEach(function (x) {
      var k = x.kind + '|' + x.date + '|' + x.time + '|' + x.sex;
      if (byId[x.id] || byKey[k]) { stats.skipped++; return; }
      byId[x.id] = true;
      byKey[k] = true;
      out.push(x);
      stats.added++;
    });

    // 按 created 倒序，保持与 add() 一致的展示顺序
    out.sort(function (a, b) { return (b.created || 0) - (a.created || 0); });
    if (out.length > MAX) out = out.slice(0, MAX);

    if (!save(out)) {
      return { ok: false, error: '浏览器存储空间不足，导入失败' };
    }
    stats.ok = true;
    stats.total = out.length;
    return stats;
  }

  /** 触发下载 JSON 文件 */
  function downloadJSON(kinds, filename) {
    var text = exportJSON(kinds);
    var blob = new Blob([text], { type: 'application/json;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    var d = new Date();
    var p = function (n) { return n < 10 ? '0' + n : n; };
    a.download = filename || ('命理案例_' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '.json');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 3000);
    return true;
  }

  /** 弹出文件选择框，读取后导入 */
  function pickAndImport(opt, cb) {
    var inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.json,application/json';
    inp.style.display = 'none';
    inp.onchange = function () {
      var f = inp.files && inp.files[0];
      if (!f) { cb && cb({ ok: false, error: '未选择文件' }); return; }
      var fr = new FileReader();
      fr.onload = function () {
        var r = importJSON(String(fr.result), opt);
        cb && cb(r);
      };
      fr.onerror = function () { cb && cb({ ok: false, error: '读取文件失败' }); };
      fr.readAsText(f, 'utf-8');
      document.body.removeChild(inp);
    };
    document.body.appendChild(inp);
    inp.click();
  }

  global.bzCases = {
    load: load, add: add, update: update, remove: remove, get: get,
    list: list, clear: clear, exists: exists, fmtTime: fmtTime,
    exportJSON: exportJSON, importJSON: importJSON,
    downloadJSON: downloadJSON, pickAndImport: pickAndImport,
    MAX: MAX
  };
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
