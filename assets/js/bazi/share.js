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
    download: download,
    preview: preview
  };
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
