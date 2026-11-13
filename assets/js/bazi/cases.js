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

  global.bzCases = {
    load: load, add: add, update: update, remove: remove, get: get,
    list: list, clear: clear, exists: exists, fmtTime: fmtTime,
    MAX: MAX
  };
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
