/**
 * 分享卡片 —— 用 canvas 把命盘画成图片
 *
 * 不依赖任何外部库，也不上传。生成后可直接下载或调起系统分享。
 * 设计取向：宣纸底 + 墨色字 + 朱红强调，与站点风格一致。
 */
(function (global) {
  'use strict';

  var C = {
    paper: '#f7f4ed',
    paper2: '#fdfcf8',
    ink: '#1c1a17',
    ink2: '#544f47',
    ink3: '#797367',
    ink4: '#a39c8f',
    rule: '#ded7c8',
    zhu: '#a8352a',
    qing: '#3f5d52',
    jin: '#9a7b3f'
  };

  var SERIF = '"Songti SC","STSong","SimSun","Source Han Serif SC","Noto Serif CJK SC",serif';
  var SANS = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC",sans-serif';

  function dpr() {
    return Math.min(window.devicePixelRatio || 1, 2);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /** 绘制纸底与水印 */
  function baseCanvas(w, h) {
    var cv = document.createElement('canvas');
    var d = dpr();
    cv.width = w * d;
    cv.height = h * d;
    var ctx = cv.getContext('2d');
    ctx.scale(d, d);
    ctx.fillStyle = C.paper;
    ctx.fillRect(0, 0, w, h);
    return { cv: cv, ctx: ctx, w: w, h: h };
  }

  /** 在卡片右下角画二维码 + 标题 */
  function drawQR(ctx, url, x, y, size, label) {
    if (!global.bzQR) return false;
    var qcv = null;
    try { qcv = global.bzQR.toCanvas(url, { size: size, margin: 2, dark: C.ink }); } catch (e) { return false; }
    if (!qcv) return false;

    // 白底 + 细边
    ctx.fillStyle = '#fff';
    ctx.fillRect(x - 3, y - 3, size + 6, size + 6);
    ctx.strokeStyle = C.rule;
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 3, y - 3, size + 6, size + 6);
    ctx.drawImage(qcv, x, y);

    if (label) {
      ctx.fillStyle = C.ink4;
      ctx.font = '10px ' + SANS;
      ctx.textAlign = 'center';
      ctx.fillText(label, x + size / 2, y + size + 17);
      ctx.textAlign = 'left';
    }
    return true;
  }

  /** 页脚品牌 */
  function footer(ctx, w, h) {
    ctx.fillStyle = C.ink4;
    ctx.font = '11px ' + SANS;
    ctx.textAlign = 'center';
    ctx.fillText('lujiachun.top', w / 2, h - 18);
    ctx.textAlign = 'left';
  }

  /**
   * 八字分享卡
   * @param c paipan() 的结果
   * @param opt {lunarText}
   */
  function baziCard(c, opt) {
    var W = 640, H = 760;
    var b = baseCanvas(W, H);
    var ctx = b.ctx;
    var pad = 44;

    // 标题
    ctx.fillStyle = C.ink;
    ctx.font = 'bold 26px ' + SERIF;
    ctx.fillText('八字命盘', pad, 68);

    ctx.fillStyle = C.ink3;
    ctx.font = '12px ' + SANS;
    var sub = (opt && opt.lunarText ? opt.lunarText + '　' : '') +
      (c.sex == 2 ? '女' : '男');
    ctx.fillText(sub, pad, 90);

    // 分隔线
    ctx.strokeStyle = C.rule;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, 108);
    ctx.lineTo(W - pad, 108);
    ctx.stroke();

    // 四柱表格
    var labels = ['年柱', '月柱', '日柱', '时柱'];
    var keys = ['year', 'month', 'day', 'hour'];
    var colW = (W - pad * 2) / 4;
    var top = 130;

    labels.forEach(function (lb, i) {
      var x = pad + colW * i + colW / 2;
      ctx.fillStyle = C.ink4;
      ctx.font = '11px ' + SANS;
      ctx.textAlign = 'center';
      ctx.fillText(lb, x, top);

      var gz = (c.pillars || {})[keys[i]] || '';
      ctx.fillStyle = C.ink;
      ctx.font = 'bold 40px ' + SERIF;
      ctx.fillText(gz[0] || '', x, top + 52);
      ctx.fillText(gz[1] || '', x, top + 100);
    });
    ctx.textAlign = 'left';

    // 十神
    var gods = c.tenGods || [];
    for (var i = 0; i < 4; i++) {
      var x2 = pad + colW * i + colW / 2;
      ctx.fillStyle = i === 2 ? C.zhu : C.ink3;
      ctx.font = '12px ' + SANS;
      ctx.textAlign = 'center';
      ctx.fillText(gods[i] || '', x2, top + 126);
    }
    ctx.textAlign = 'left';

    // 主体信息
    var y = 300;
    ctx.strokeStyle = C.rule;
    ctx.beginPath();
    ctx.moveTo(pad, y - 26);
    ctx.lineTo(W - pad, y - 26);
    ctx.stroke();

    // 旺衰：用五行能量模块算
    var wsText = c.wangshuaiText || c.wangshuai || '';
    if (!wsText && global.bzEnergy) {
      try {
        var pr = global.bzEnergy.party(c);
        if (pr) wsText = pr.level + '（同党 ' + pr.tongPct + '%）';
      } catch (e) {}
    }
    if (!wsText) wsText = '—';

    var rows = [
      ['日主', (c.dayMaster || '') + '（' + (c.dayMasterWuxing || '') + '）'],
      ['旺衰', wsText],
      ['起运', c.qiyun ? (c.qiyun.age + '岁' + c.qiyun.months + '月' + c.qiyun.days + '天') : '—'],
      ['交运', c.qiyun && c.qiyun.jiaoyunText ? c.qiyun.jiaoyunText : '—']
    ];
    rows.forEach(function (r, i) {
      var yy = y + i * 34;
      ctx.fillStyle = C.ink4;
      ctx.font = '12px ' + SANS;
      ctx.fillText(r[0], pad, yy);
      ctx.fillStyle = C.ink2;
      ctx.font = '15px ' + SERIF;
      ctx.fillText(String(r[1]).slice(0, 34), pad + 60, yy);
    });

    // 五行能量条
    var y2 = y + 160;
    ctx.fillStyle = C.ink4;
    ctx.font = '12px ' + SANS;
    ctx.fillText('五行能量', pad, y2);

    var sc = c.wuxingScore || {};
    var order = ['木', '火', '土', '金', '水'];
    var colors = { '木': '#4a7c59', '火': '#b04a3a', '土': '#9a7b3f', '金': '#6b7078', '水': '#3a6b8a' };
    var maxv = 0;
    order.forEach(function (k) { if ((sc[k] || 0) > maxv) maxv = sc[k] || 0; });
    var bw = W - pad * 2;

    order.forEach(function (k, i) {
      var yy = y2 + 22 + i * 30;
      ctx.fillStyle = C.ink2;
      ctx.font = '14px ' + SERIF;
      ctx.fillText(k, pad, yy + 4);

      var v = sc[k] || 0;
      var w = maxv > 0 ? (v / maxv) * (bw - 130) : 0;
      ctx.fillStyle = C.rule;
      roundRect(ctx, pad + 30, yy - 8, bw - 130, 12, 6);
      ctx.fill();
      ctx.fillStyle = colors[k];
      if (w > 0) {
        roundRect(ctx, pad + 30, yy - 8, Math.max(w, 4), 12, 6);
        ctx.fill();
      }

      ctx.fillStyle = C.ink3;
      ctx.font = '11px ' + SANS;
      ctx.fillText(v.toFixed(2), pad + bw - 88, yy + 4);
    });

    // 神煞（前 6 项）
    var y3 = y2 + 196;
    var all = [];
    (c.shensha || []).forEach(function (arr, i) {
      (arr || []).forEach(function (n) {
        if (all.indexOf(n) < 0) all.push(n);
      });
    });
    if (all.length) {
      ctx.fillStyle = C.ink4;
      ctx.font = '12px ' + SANS;
      ctx.fillText('神煞', pad, y3);
      ctx.fillStyle = C.ink2;
      ctx.font = '13px ' + SERIF;
      var maxW = W - pad * 2;
      var ln = '', ly = y3 + 24;
      all.slice(0, 14).forEach(function (w) {
        var test = ln ? ln + '　' + w : w;
        if (ctx.measureText(test).width > maxW) {
          ctx.fillText(ln, pad, ly); ly += 22; ln = w;
        } else { ln = test; }
      });
      if (ln) ctx.fillText(ln, pad, ly);
    }

    // 二维码（右下角）
    drawQR(ctx, (opt && opt.url) || 'https://lujiachun.top/bazi/', W - 44 - 84, H - 130, 84, '扫码排自己的');

    footer(ctx, W, H);
    return b.cv;
  }

  /**
   * 紫微分享卡
   */
  function ziweiCard(zw, opt) {
    var W = 640, H = 900;
    var b = baseCanvas(W, H);
    var ctx = b.ctx;
    var pad = 40;

    ctx.fillStyle = C.ink;
    ctx.font = 'bold 26px ' + SERIF;
    ctx.fillText('紫微斗数', pad, 66);

    ctx.fillStyle = C.ink3;
    ctx.font = '12px ' + SANS;
    ctx.fillText((opt && opt.lunarText ? opt.lunarText + '　' : '') +
      '命宫 ' + zw.mingGan + zw.mingZhi + '　' + zw.juName, pad, 88);

    ctx.strokeStyle = C.rule;
    ctx.beginPath();
    ctx.moveTo(pad, 104);
    ctx.lineTo(W - pad, 104);
    ctx.stroke();

    // 十二宫 4x4 盘
    var DZ = '子丑寅卯辰巳午未申酉戌亥';
    var BOARD = [
      ['巳', '午', '未', '申'],
      ['辰', null, null, '酉'],
      ['卯', null, null, '戌'],
      ['寅', '丑', '子', '亥']
    ];
    var gx = pad, gy = 124;
    var cw = (W - pad * 2) / 4;
    var ch = cw * 0.92;

    BOARD.forEach(function (row, ri) {
      row.forEach(function (z, ci) {
        var x = gx + ci * cw, y = gy + ri * ch;
        if (z === null) {
          // 中宫跨 2x2，只在左上角（ri=1, ci=1）画一次
          if (ri !== 1 || ci !== 1) return;
          // 中宫
          ctx.fillStyle = C.paper2;
          ctx.fillRect(x, y, cw * 2, ch * 2);
          ctx.strokeStyle = C.rule;
          ctx.strokeRect(x, y, cw * 2, ch * 2);
          ctx.fillStyle = C.ink;
          ctx.font = 'bold 20px ' + SERIF;
          ctx.textAlign = 'center';
          ctx.fillText(zw.mingGan + zw.mingZhi, x + cw, y + ch * 0.75);
          ctx.font = '11px ' + SANS;
          ctx.fillStyle = C.ink3;
          ctx.fillText(zw.juName, x + cw, y + ch * 1.15);
          ctx.fillText('命主 ' + zw.soul + '　身主 ' + zw.body, x + cw, y + ch * 1.45);
          ctx.textAlign = 'left';
          return;
        }
        var p = zw.palaces[z];
        if (!p) return;

        ctx.fillStyle = p.name === '命宫' ? '#faf3ee' : C.paper2;
        ctx.fillRect(x, y, cw, ch);
        ctx.strokeStyle = p.name === '命宫' ? C.zhu : C.rule;
        ctx.lineWidth = p.name === '命宫' ? 2 : 1;
        ctx.strokeRect(x, y, cw, ch);
        ctx.lineWidth = 1;

        ctx.fillStyle = C.ink4;
        ctx.font = '10px ' + SANS;
        ctx.fillText(p.name, x + 5, y + 14);

        ctx.fillStyle = C.ink;
        ctx.font = 'bold 15px ' + SERIF;
        var my = y + 32;
        p.major.slice(0, 3).forEach(function (s) {
          ctx.fillStyle = s.hua === '忌' ? C.zhu : C.ink;
          ctx.fillText(s.name + (s.hua ? '·' + s.hua : ''), x + 5, my);
          my += 17;
        });
        ctx.fillStyle = C.ink3;
        ctx.font = '10px ' + SANS;
        p.minor.slice(0, 3).forEach(function (s) {
          ctx.fillText(s.name, x + 5, my);
          my += 13;
        });
      });
    });

    // 四化
    var y = gy + ch * 4 + 26;
    ctx.fillStyle = C.ink4;
    ctx.font = '12px ' + SANS;
    ctx.fillText('生年四化', pad, y);
    var hs = ['禄', '权', '科', '忌'];
    var hc = { '禄': C.qing, '权': C.jin, '科': '#3a5a80', '忌': C.zhu };
    hs.forEach(function (h, i) {
      var star = null;
      for (var s in zw.sihua) { if (zw.sihua[s] === h) star = s; }
      var xx = pad + i * 140;
      ctx.fillStyle = hc[h];
      ctx.font = '14px ' + SERIF;
      ctx.fillText((star || '—') + '化' + h, xx, y + 26);
    });

    // 二维码（右下角）
    drawQR(ctx, (opt && opt.url) || 'https://lujiachun.top/ziwei/',
           W - 40 - 84, H - 132, 84, '扫码排自己的');

    footer(ctx, W, H);
    return b.cv;
  }

  /** 估算黄历卡所需高度 */
  function measureHuangliH(info, W) {
    var pad = 44;
    var maxW = W - pad * 2;
    var cv = document.createElement('canvas');
    var ctx = cv.getContext('2d');
    ctx.font = '14px ' + SERIF;

    function lineCount(arr) {
      var n = 1, line = '';
      arr.forEach(function (w) {
        var test = line ? line + '　' + w : w;
        if (ctx.measureText(test).width > maxW) { n++; line = w; }
        else { line = test; }
      });
      return n;
    }

    var y = 210;                                    // 徽标下方起点
    y += 26 + lineCount(info.yi.slice(0, 16)) * 24 + 10;   // 宜
    y += 26 + lineCount(info.ji.slice(0, 10)) * 24 + 10;   // 忌
    y += 30;                                        // 间距
    y += 26 + 26;                                   // 胎神 + 彭祖
    y += 46;                                        // 页脚
    return Math.ceil(y);
  }

  /**
   * 黄历分享卡
   */
  function huangliCard(info, opt) {
    var W = 600;
    // 先量高度：按内容估算，最后定 H
    var H = measureHuangliH(info, W);
    var b = baseCanvas(W, H);
    var ctx = b.ctx;
    var pad = 44;

    var d = opt && opt.dateParts ? opt.dateParts : null;
    ctx.fillStyle = C.ink;
    ctx.font = 'bold 30px ' + SERIF;
    ctx.fillText(d ? (d.year + '.' + d.md) : '黄历', pad, 72);

    ctx.fillStyle = C.ink3;
    ctx.font = '13px ' + SANS;
    ctx.fillText((opt && opt.lunarText) || '', pad, 96);
    ctx.fillText((opt && opt.pillars) || '', pad, 118);

    ctx.strokeStyle = C.rule;
    ctx.beginPath();
    ctx.moveTo(pad, 134);
    ctx.lineTo(W - pad, 134);
    ctx.stroke();

    // 吉凶徽标
    var badges = [
      [info.tianshen, info.tianshenLuck, info.tianshenLuck === '黄道' ? C.qing : C.zhu],
      [info.zhixing + '日', info.zhixingLuck, info.zhixingLuck === '吉' ? C.qing : C.zhu],
      [info.xiu + '宿', info.xiuLuck, info.xiuLuck === '吉' ? C.qing : C.zhu],
      ['冲' + info.chong, '煞' + info.sha, C.ink3]
    ];
    var bx = pad;
    badges.forEach(function (bd) {
      var txt = bd[0] + ' ' + bd[1];
      ctx.font = '13px ' + SANS;
      var tw = ctx.measureText(txt).width + 22;
      ctx.fillStyle = bd[2];
      ctx.globalAlpha = 0.12;
      roundRect(ctx, bx, 152, tw, 28, 14);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = bd[2];
      ctx.fillText(txt, bx + 11, 171);
      bx += tw + 8;
    });

    // 宜
    var y = 210;
    function block(title, arr, color, bg) {
      ctx.fillStyle = color;
      ctx.font = 'bold 16px ' + SERIF;
      ctx.fillText(title, pad, y);
      y += 26;
      ctx.font = '14px ' + SERIF;
      var line = '', lines = [];
      arr.forEach(function (w) {
        var test = line ? line + '　' + w : w;
        if (ctx.measureText(test).width > W - pad * 2) {
          lines.push(line); line = w;
        } else { line = test; }
      });
      if (line) lines.push(line);
      lines.forEach(function (ln) {
        ctx.fillStyle = bg;
        ctx.fillText(ln, pad, y);
        y += 24;
      });
      y += 10;
    }
    block('宜', info.yi.slice(0, 16), C.qing, '#3f6b3f');
    block('忌', info.ji.slice(0, 10), C.zhu, C.zhu);

    // 底部信息（跟随内容）
    ctx.strokeStyle = C.rule;
    ctx.beginPath();
    ctx.moveTo(pad, y - 20);
    ctx.lineTo(W - pad, y - 20);
    ctx.stroke();

    ctx.fillStyle = C.ink4;
    ctx.font = '11px ' + SANS;
    ctx.fillText('胎神', pad, y);
    ctx.fillStyle = C.ink2;
    ctx.font = '13px ' + SERIF;
    ctx.fillText(info.taishen || '—', pad + 40, y);

    ctx.fillStyle = C.ink4;
    ctx.font = '11px ' + SANS;
    ctx.fillText('彭祖百忌', pad, y + 26);
    ctx.fillStyle = C.ink2;
    ctx.font = '12px ' + SERIF;
    ctx.fillText((info.pengzuGan || '') + '　' + (info.pengzuZhi || ''), pad + 62, y + 26);

    // 二维码（右下角）
    drawQR(ctx, (opt && opt.url) || 'https://lujiachun.top/huangli/', W - 44 - 78, y - 12, 78, '扫码查吉日');

    footer(ctx, W, H);
    return b.cv;
  }


  /**
   * 西洋占星本命盘分享卡
   */
  function astroCard(chart, meta) {
    var W = 640, H = 900;
    var b = baseCanvas(W, H);
    var ctx = b.ctx;
    var pad = 40;

    // 标题
    ctx.fillStyle = C.ink;
    ctx.font = 'bold 26px ' + SERIF;
    ctx.fillText('本命盘', pad, 66);

    ctx.fillStyle = C.ink3;
    ctx.font = '12px ' + SANS;
    var sub = (meta && meta.date ? meta.date + ' ' + meta.time + '　' : '') +
      (meta && meta.city ? meta.city : '');
    ctx.fillText(sub, pad, 88);

    ctx.strokeStyle = C.rule;
    ctx.beginPath();
    ctx.moveTo(pad, 104);
    ctx.lineTo(W - pad, 104);
    ctx.stroke();

    // 三巨头
    var trio = [
      ['太阳', chart.sun], ['月亮', chart.moon], ['上升', chart.asc]
    ];
    var tw = (W - pad * 2) / 3;
    trio.forEach(function (t, i) {
      var x = pad + i * tw + tw / 2;
      ctx.textAlign = 'center';
      ctx.fillStyle = C.ink4;
      ctx.font = '11px ' + SANS;
      ctx.fillText(t[0], x, 132);
      ctx.fillStyle = C.ink;
      ctx.font = 'bold 22px ' + SERIF;
      ctx.fillText(t[1].sign.sign.zh, x, 162);
      ctx.fillStyle = C.ink3;
      ctx.font = '11px ' + SANS;
      ctx.fillText(Math.floor(t[1].sign.deg) + '°', x, 180);
    });
    ctx.textAlign = 'left';

    // 星盘圆
    var C2 = W / 2, cy = 400, R = 168;
    ctx.strokeStyle = C.rule;
    ctx.lineWidth = 1;
    [R, R - 34, R - 80].forEach(function (r) {
      ctx.beginPath();
      ctx.arc(C2, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    var ASC = chart.asc.lon;
    function toXY(lon, r) {
      var a = (180 - (lon - ASC)) * Math.PI / 180;
      return [C2 + r * Math.cos(a), cy - r * Math.sin(a)];
    }

    // 星座符号
    var EL = { '火': '#b04a3a', '土': '#8a7440', '风': '#5b7a8c', '水': '#3f5d74' };
    for (var i = 0; i < 12; i++) {
      var sg = global.bzAstro ? global.bzAstro.SIGNS[i] : null;
      if (!sg) continue;
      var mid = i * 30 + 15;
      var pp = toXY(mid, R - 17);
      ctx.fillStyle = EL[sg.el] || C.ink3;
      ctx.font = '14px ' + SERIF;
      ctx.textAlign = 'center';
      ctx.fillText(sg.sym, pp[0], pp[1] + 5);
      // 分隔线
      var p1 = toXY(i * 30, R), p2 = toXY(i * 30, R - 34);
      ctx.strokeStyle = C.rule;
      ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke();
    }
    ctx.textAlign = 'left';

    // 宫位线
    chart.cusps.forEach(function (cusp, idx) {
      var p1 = toXY(cusp, R - 80), p2 = toXY(cusp, 26);
      var isAxis = (idx % 3 === 0);
      ctx.strokeStyle = isAxis ? C.zhu : '#e8e2d6';
      ctx.lineWidth = isAxis ? 1.2 : 0.8;
      ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke();
    });
    ctx.lineWidth = 1;

    // 行星
    var placed = [];
    chart.points.forEach(function (p) {
      var r = R - 52;
      var tries = 0;
      while (tries < 8) {
        var conflict = placed.some(function (q) {
          return Math.abs(((q.lon - p.lon + 540) % 360) - 180) < 11 && q.r === r;
        });
        if (!conflict) break;
        r -= 13; tries++;
      }
      placed.push({ lon: p.lon, r: r });
      var pt = toXY(p.lon, r);
      var outer = toXY(p.lon, R - 34);
      ctx.strokeStyle = '#d8d0c0';
      ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.moveTo(outer[0], outer[1]); ctx.lineTo(pt[0], pt[1]); ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = p.retro ? C.zhu : C.ink2;
      ctx.font = '13px ' + SERIF;
      ctx.textAlign = 'center';
      ctx.fillText(p.glyph, pt[0], pt[1] + 4);
    });

    // 相位线
    chart.aspects.forEach(function (a) {
      if (a.orb > 4) return;
      var pool = chart.points.concat(chart.axes.filter(function (x) {
        return x.key === 'ASC' || x.key === 'MC';
      }));
      var pa = pool.filter(function (p) { return p.key === a.a; })[0];
      var pb = pool.filter(function (p) { return p.key === a.b; })[0];
      if (!pa || !pb) return;
      var p1 = toXY(pa.lon, 80), p2 = toXY(pb.lon, 80);
      ctx.strokeStyle = a.color;
      ctx.globalAlpha = a.exact ? 0.7 : 0.35;
      ctx.lineWidth = a.exact ? 1.3 : 0.7;
      ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.lineWidth = 1;
    });

    // 中心
    ctx.fillStyle = C.paper;
    ctx.beginPath(); ctx.arc(C2, cy, 26, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = C.rule; ctx.stroke();

    // ASC/MC
    var ap = toXY(ASC, R + 8);
    ctx.fillStyle = C.zhu; ctx.font = '9px ' + SANS; ctx.textAlign = 'center';
    ctx.fillText('ASC', ap[0], ap[1] + 3);

    // 行星列表（两列，按实测文字宽度定列）
    var y = 610;
    var halfW = (W - pad * 2) / 2;

    // 量一次最大宽度，作为列间距基准
    ctx.font = '12px ' + SANS;
    var wName = 0;
    chart.points.forEach(function (p) {
      var n = p.zh.replace('星', '');
      var w = ctx.measureText(n).width;
      if (w > wName) wName = w;
    });
    ctx.font = '12px ' + SERIF;
    var wDeg = ctx.measureText('44°').width;
    var wSign = ctx.measureText('摩羯').width;

    var cGlyph = 0;
    var cName = 14;
    var cDeg = cName + wName + 6;              // 度数右对齐到这点
    var cSign = cDeg + 4;
    var cHouse = cSign + wSign + 7;

    chart.points.forEach(function (p, i) {
      var col = i % 2, row = Math.floor(i / 2);
      var x = pad + col * halfW;
      var yy = y + row * 24;

      ctx.textAlign = 'left';
      ctx.fillStyle = p.retro ? C.zhu : C.ink3;
      ctx.font = '11px ' + SANS;
      ctx.fillText(p.glyph, x + cGlyph, yy);

      ctx.fillStyle = C.ink2;
      ctx.font = '12px ' + SANS;
      ctx.fillText(p.zh.replace('星', ''), x + cName, yy);

      // 度数右对齐，保证小数点位置一致
      ctx.fillStyle = C.ink;
      ctx.font = '12px ' + SERIF;
      ctx.textAlign = 'right';
      ctx.fillText(Math.floor(p.sign.deg) + '°', x + cDeg, yy);
      ctx.textAlign = 'left';

      // 星座固定起点
      ctx.fillText(p.sign.sign.zh, x + cSign, yy);

      ctx.fillStyle = C.ink4;
      ctx.font = '10px ' + SANS;
      ctx.fillText(p.house + '宫', x + cHouse, yy);
    });

    // 二维码
    drawQR(ctx, (meta && meta.url) || 'https://lujiachun.top/astro/',
      W - 40 - 78, H - 128, 78, '扫码排自己的');

    footer(ctx, W, H);
    return b.cv;
  }


  /**
   * 六爻分享卡
   */
  function liuyaoCard(d, meta) {
    var W = 620;
    // 高度按内容算：标题区 152 + 六爻 6*34 + 用神/动爻 60 + 二维码区 110 + 页脚
    var H = 152 + 58 + 6 * 34 + 96 + 78;
    var b = baseCanvas(W, H);
    var ctx = b.ctx;
    var pad = 42;

    ctx.fillStyle = C.ink;
    ctx.font = 'bold 26px ' + SERIF;
    ctx.fillText('六爻', pad, 64);

    ctx.fillStyle = C.ink3;
    ctx.font = '12px ' + SANS;
    var sub = (meta && meta.date ? meta.date + ' ' + meta.time + '　' : '') +
      '日辰 ' + d.dayGan + d.dayZhi;
    ctx.fillText(sub, pad, 86);

    // 所问
    if (meta && meta.question) {
      ctx.fillStyle = C.ink2;
      ctx.font = '13px ' + SERIF;
      ctx.fillText('问：' + String(meta.question).slice(0, 24), pad, 108);
    }

    ctx.strokeStyle = C.rule;
    ctx.beginPath();
    ctx.moveTo(pad, 122);
    ctx.lineTo(W - pad, 122);
    ctx.stroke();

    // 卦名
    var y = 152;
    ctx.fillStyle = C.ink;
    ctx.font = 'bold 22px ' + SERIF;
    ctx.fillText(d.ben.name, pad, y);
    if (d.bian) {
      var w1 = ctx.measureText(d.ben.name).width;
      ctx.fillStyle = C.zhu;
      ctx.font = '14px ' + SERIF;
      ctx.fillText('→', pad + w1 + 10, y - 2);
      ctx.fillStyle = C.ink;
      ctx.font = 'bold 22px ' + SERIF;
      ctx.fillText(d.bian.name, pad + w1 + 36, y);
    }

    // 卦宫信息
    ctx.fillStyle = C.ink3;
    ctx.font = '11px ' + SANS;
    ctx.fillText(d.palace.palace + '宫 ' + d.palace.palaceWx + '　' +
      d.palace.type + '　世' + d.palace.shi + ' 应' + d.palace.ying +
      '　旬空 ' + d.kong.join(''), pad, y + 22);

    // 六爻
    var ly = y + 58;
    for (var i = 5; i >= 0; i--) {
      var l = d.lines[i];
      var yy = ly + (5 - i) * 34;

      // 爻位
      ctx.fillStyle = C.ink4;
      ctx.font = '10px ' + SANS;
      ctx.fillText(['初','二','三','四','五','上'][i], pad, yy);

      // 阴阳符号
      var yy2 = yy - 5;
      ctx.strokeStyle = l.changing ? C.zhu : C.ink2;
      ctx.lineWidth = l.changing ? 3 : 2;
      if (l.yao) {
        ctx.beginPath(); ctx.moveTo(pad + 20, yy2); ctx.lineTo(pad + 92, yy2); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.moveTo(pad + 20, yy2); ctx.lineTo(pad + 50, yy2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(pad + 62, yy2); ctx.lineTo(pad + 92, yy2); ctx.stroke();
      }
      ctx.lineWidth = 1;

      // 六亲 + 纳甲
      ctx.fillStyle = C.ink;
      ctx.font = '12px ' + SERIF;
      ctx.fillText(l.liuqin, pad + 104, yy);
      ctx.fillStyle = C.ink2;
      ctx.fillText(l.gan + l.zhi + ' ' + l.wx, pad + 150, yy);

      // 世应 / 空
      var mark = l.shi ? '世' : l.ying ? '应' : '';
      if (mark) {
        ctx.fillStyle = C.zhu;
        ctx.font = '11px ' + SANS;
        ctx.fillText(mark, pad + 202, yy);
      }
      if (l.kong) {
        ctx.fillStyle = C.ink4;
        ctx.font = '10px ' + SANS;
        ctx.fillText('空', pad + 220, yy);
      }

      // 六神
      ctx.fillStyle = C.ink4;
      ctx.font = '10px ' + SANS;
      ctx.fillText(l.liushen, pad + 246, yy);

      // 变爻
      if (l.bian) {
        ctx.fillStyle = C.ink3;
        ctx.font = '10px ' + SERIF;
        ctx.fillText('→ ' + l.bian.liuqin + l.bian.gan + l.bian.zhi, pad + 290, yy);
      }
    }

    // 用神提示
    var yq = global.bzLiuyao ? global.bzLiuyao.pickYongshen(meta && meta.question) : null;
    var by = ly + 6 * 34 + 20;
    if (yq) {
      var ys = d.lines.filter(function (l) { return l.liuqin === yq; });
      ctx.fillStyle = C.ink4;
      ctx.font = '11px ' + SANS;
      ctx.fillText('用神', pad, by);
      ctx.fillStyle = C.ink2;
      ctx.font = '13px ' + SERIF;
      ctx.fillText(yq + (ys.length ? '（第' + ys.map(function (l) { return l.pos; }).join('、') + '爻）' : '（不上卦）'), pad + 40, by);
    }

    // 动爻
    if (d.moving.length) {
      ctx.fillStyle = C.ink4;
      ctx.font = '11px ' + SANS;
      ctx.fillText('动爻', pad, by + 24);
      ctx.fillStyle = C.zhu;
      ctx.font = '13px ' + SERIF;
      ctx.fillText(d.moving.map(function (p) { return '第' + p + '爻'; }).join('　'), pad + 40, by + 24);
    }

    // 二维码
    drawQR(ctx, (meta && meta.url) || 'https://lujiachun.top/liuyao/',
      W - 40 - 78, H - 108, 78, '扫码起一卦');

    footer(ctx, W, H);
    return b.cv;
  }


  /**
   * 塔罗分享卡
   */
  function tarotCard(r, question) {
    var W = 640;
    var n = r.cards.length;
    var cols = n <= 1 ? 1 : n <= 3 ? 3 : n <= 5 ? 3 : 4;
    var rows = Math.ceil(n / cols);
    var cw = 130, chh = 208, gap = 14;
    var gridH = rows * (chh + 30) + (rows - 1) * gap;
    var H = 150 + gridH + 90 + 70;

    var b = baseCanvas(W, H);
    var ctx = b.ctx;
    var pad = 42;

    ctx.fillStyle = C.ink;
    ctx.font = 'bold 26px ' + SERIF;
    ctx.fillText('塔罗 · ' + r.spread.name, pad, 62);

    ctx.fillStyle = C.ink3;
    ctx.font = '12px ' + SANS;
    if (question) {
      ctx.fillText('问：' + String(question).slice(0, 26), pad, 86);
    }
    ctx.fillText(r.cards.map(function (c) {
      return (c.card.fullName || c.card.name) + (c.reversed ? '逆' : '正');
    }).join('　'), pad, question ? 106 : 86);

    ctx.strokeStyle = C.rule;
    ctx.beginPath();
    ctx.moveTo(pad, 124);
    ctx.lineTo(W - pad, 124);
    ctx.stroke();

    // 牌阵网格
    var totalW = cols * cw + (cols - 1) * gap;
    var sx = (W - totalW) / 2;
    var sy = 150;

    r.cards.forEach(function (c, i) {
      var col = i % cols, row = Math.floor(i / cols);
      var x = sx + col * (cw + gap);
      var y = sy + row * (chh + 30 + gap);

      // 位置名
      ctx.fillStyle = C.ink4;
      ctx.font = '10px ' + SANS;
      ctx.textAlign = 'center';
      ctx.fillText(String(c.posName).slice(0, 10), x + cw / 2, y - 6);

      // 卡面
      ctx.fillStyle = c.reversed ? '#faf3ee' : C.paper2;
      roundRect(ctx, x, y, cw, chh, 6);
      ctx.fill();
      ctx.strokeStyle = c.reversed ? C.zhu : C.rule;
      ctx.lineWidth = c.reversed ? 1.5 : 1;
      ctx.stroke();
      ctx.lineWidth = 1;

      // 符号
      ctx.fillStyle = C.zhu;
      ctx.font = '26px ' + SERIF;
      ctx.fillText(c.card.glyph, x + cw / 2, y + chh / 2 - 8);

      // 牌名
      ctx.fillStyle = C.ink;
      ctx.font = '12px ' + SERIF;
      var nm = c.card.fullName || c.card.name;
      if (nm.length > 6) nm = nm.slice(0, 6);
      ctx.fillText(nm, x + cw / 2, y + chh / 2 + 22);

      // 正逆
      ctx.fillStyle = c.reversed ? C.zhu : C.ink3;
      ctx.font = '10px ' + SANS;
      ctx.fillText(c.reversed ? '逆位' : '正位', x + cw / 2, y + chh / 2 + 40);
    });
    ctx.textAlign = 'left';

    // 底部：大牌/逆位统计
    var sm = global.bzTarot.summary(r);
    var by = sy + gridH + 18;
    ctx.fillStyle = C.ink4;
    ctx.font = '11px ' + SANS;
    ctx.fillText('大阿卡纳 ' + sm.stat.major + '/' + n +
      '　逆位 ' + sm.stat.reversed + '/' + n, pad, by);

    // 一句话提示
    if (sm.notes.length) {
      ctx.fillStyle = C.ink2;
      ctx.font = '11px ' + SERIF;
      var note = sm.notes[0];
      var line = '', ly2 = by + 22;
      for (var i = 0; i < note.length; i++) {
        var test = line + note[i];
        if (ctx.measureText(test).width > W - pad * 2 - 100) {
          ctx.fillText(line, pad, ly2); ly2 += 18; line = note[i];
        } else { line = test; }
      }
      if (line) ctx.fillText(line, pad, ly2);
    }

    // 二维码
    drawQR(ctx, 'https://lujiachun.top/tarot/', W - 40 - 78, H - 118, 78, '扫码抽一次');

    footer(ctx, W, H);
    return b.cv;
  }

  /** 下载 canvas 为 png */
  function download(cv, name) {
    try {
      var url = cv.toDataURL('image/png');
      var a = document.createElement('a');
      a.href = url;
      a.download = name || ('命盘_' + Date.now() + '.png');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * 预览弹窗：显示图片 + 下载按钮 + 长按提示
   */
  function preview(cv, title) {
    var mask = document.createElement('div');
    mask.style.cssText = 'position:fixed;inset:0;background:rgba(28,26,23,.6);' +
      'z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;' +
      'flex-direction:column;gap:12px';

    var img = new Image();
    img.src = cv.toDataURL('image/png');
    img.style.cssText = 'max-width:100%;max-height:74vh;border-radius:8px;' +
      'box-shadow:0 8px 40px rgba(0,0,0,.35)';

    var bar = document.createElement('div');
    bar.style.cssText = 'display:flex;gap:10px';

    var dl = document.createElement('button');
    dl.textContent = '下载图片';
    dl.style.cssText = 'padding:9px 22px;border:none;border-radius:6px;' +
      'background:#a8352a;color:#fff;font-size:.88rem;cursor:pointer';
    dl.onclick = function () { download(cv, (title || '命盘') + '.png'); };

    var close = document.createElement('button');
    close.textContent = '关闭';
    close.style.cssText = 'padding:9px 22px;border:1px solid #ded7c8;border-radius:6px;' +
      'background:#f7f4ed;color:#544f47;font-size:.88rem;cursor:pointer';
    close.onclick = function () { document.body.removeChild(mask); };

    var tip = document.createElement('div');
    tip.textContent = '手机上可长按图片保存到相册';
    tip.style.cssText = 'color:#ded7c8;font-size:.72rem';

    bar.appendChild(dl);
    bar.appendChild(close);
    mask.appendChild(img);
    mask.appendChild(bar);
    mask.appendChild(tip);
    mask.onclick = function (e) {
      if (e.target === mask) document.body.removeChild(mask);
    };
    document.body.appendChild(mask);
  }

  global.bzShare = {
    baziCard: baziCard,
    ziweiCard: ziweiCard,
    huangliCard: huangliCard,
    astroCard: astroCard,
    liuyaoCard: liuyaoCard,
    tarotCard: tarotCard,
    download: download,
    preview: preview
  };
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
