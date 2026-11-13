/**
 * 极简二维码生成器（QR Code Model 2, 字节模式, 纠错等级 M）
 *
 * 为什么自己写：分享卡片要二维码，但不能依赖外部图片服务
 * （离线可用、无隐私外泄、无第三方挂掉风险）。
 *
 * 实现范围（够用即止）：
 *   - 版本 1–10（最多约 213 字节，足够放一个网址）
 *   - 字节模式（Byte mode）
 *   - 纠错等级 M（15% 冗余，最常用的折中）
 *   - 自动选择掩码（8 种全试，取惩罚分最低）
 *
 * 参考：ISO/IEC 18004
 */
(function (global) {
  'use strict';

  // ── 纠错等级 M 的每块参数 [每块总码字, 每块数据码字] 与块数 ──
  // 索引 = 版本号（1..10）
  var ECC_M = {
    1:  { total: 26,  data: 16, blocks: 1 },
    2:  { total: 44,  data: 28, blocks: 1 },
    3:  { total: 70,  data: 44, blocks: 1 },
    4:  { total: 100, data: 64, blocks: 2 },
    5:  { total: 134, data: 86, blocks: 2 },
    6:  { total: 172, data: 108, blocks: 4 },
    7:  { total: 196, data: 124, blocks: 4 },
    8:  { total: 242, data: 154, blocks: 4 },
    9:  { total: 292, data: 182, blocks: 5 },
    10: { total: 346, data: 216, blocks: 5 }
  };

  // 每块的 EC 码字数（M 级）
  var ECC_M_PER_BLOCK = {
    1: 10, 2: 16, 3: 26, 4: 18, 5: 24,
    6: 16, 7: 18, 8: 22, 9: 22, 10: 26
  };

  // 版本容量（字节模式, 纠错 M）：数据码字总数
  function dataCodewords(v) {
    return ECC_M[v].data;
  }

  // ── 对齐图案中心坐标 ──
  var ALIGN = {
    1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30],
    6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46],
    10: [6, 28, 50]
  };

  // ── GF(256) 算术 ──
  var EXP = new Uint8Array(512), LOG = new Uint8Array(256);
  (function initGF() {
    var x = 1;
    for (var i = 0; i < 255; i++) {
      EXP[i] = x;
      LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11d;
    }
    for (var j = 255; j < 512; j++) EXP[j] = EXP[j - 255];
  })();

  function gfMul(a, b) {
    if (a === 0 || b === 0) return 0;
    return EXP[LOG[a] + LOG[b]];
  }

  /** Reed-Solomon 生成多项式 */
  function rsGenPoly(n) {
    var poly = [1];
    for (var i = 0; i < n; i++) {
      var next = new Array(poly.length + 1).fill(0);
      for (var j = 0; j < poly.length; j++) {
        next[j] ^= poly[j];
        next[j + 1] ^= gfMul(poly[j], EXP[i]);
      }
      poly = next;
    }
    return poly;
  }

  /** 计算 EC 码字 */
  function rsEncode(data, ecLen) {
    var gen = rsGenPoly(ecLen);
    var res = new Array(ecLen).fill(0);
    for (var i = 0; i < data.length; i++) {
      var factor = data[i] ^ res[0];
      res.shift();
      res.push(0);
      for (var j = 0; j < ecLen; j++) {
        res[j] ^= gfMul(gen[j + 1], factor);
      }
    }
    return res;
  }

  /** 选择最小可用版本 */
  function pickVersion(byteLen) {
    for (var v = 1; v <= 10; v++) {
      // 模式指示符 4 bit + 字符计数(8 bit for v1-9, 16 bit for v10+) + 数据 + 终止
      var countBits = v <= 9 ? 8 : 16;
      var needBits = 4 + countBits + byteLen * 8;
      var capBits = dataCodewords(v) * 8;
      if (needBits <= capBits) return v;
    }
    return 0;
  }

  /** 文本 → UTF-8 字节 */
  function toBytes(str) {
    var out = [];
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      if (c < 0x80) out.push(c);
      else if (c < 0x800) {
        out.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
      } else if (c < 0xd800 || c >= 0xe000) {
        out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
      } else {
        // 代理对
        i++;
        var c2 = str.charCodeAt(i);
        var cp = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
        out.push(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3f),
                 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f));
      }
    }
    return out;
  }

  /** 组装数据位流 */
  function buildBitStream(bytes, version) {
    var bits = [];
    function push(val, len) {
      for (var i = len - 1; i >= 0; i--) bits.push((val >> i) & 1);
    }
    push(0b0100, 4);                                  // 字节模式
    var countBits = version <= 9 ? 8 : 16;
    push(bytes.length, countBits);
    for (var i = 0; i < bytes.length; i++) push(bytes[i], 8);

    var capBits = dataCodewords(version) * 8;
    // 终止符（最多 4 个 0）
    var term = Math.min(4, capBits - bits.length);
    push(0, term);
    // 补齐到字节边界
    while (bits.length % 8 !== 0) bits.push(0);
    // 填充码字
    var pads = [0xec, 0x11], pi = 0;
    while (bits.length < capBits) {
      push(pads[pi % 2], 8);
      pi++;
    }
    // 转字节
    var out = [];
    for (var b = 0; b < bits.length; b += 8) {
      var v = 0;
      for (var k = 0; k < 8; k++) v = (v << 1) | bits[b + k];
      out.push(v);
    }
    return out;
  }

  /** 分块 + 交织（支持不等长块：短块在前，长块在后） */
  function interleave(data, version) {
    var cfg = ECC_M[version];
    var ecLen = ECC_M_PER_BLOCK[version];
    var nBlocks = cfg.blocks;

    // 不等长块：data 总数不能被块数整除时，前 shortCount 块少 1 字节
    var shortLen = Math.floor(cfg.data / nBlocks);
    var shortCount = nBlocks - (cfg.data % nBlocks);

    var blocks = [], ecBlocks = [], offset = 0;
    for (var i = 0; i < nBlocks; i++) {
      var len = (i < shortCount) ? shortLen : shortLen + 1;
      var d = data.slice(offset, offset + len);
      offset += len;
      blocks.push(d);
      ecBlocks.push(rsEncode(d, ecLen));
    }

    var out = [];
    // 数据码字交织（按列取，块短则跳过，自然形成阶梯）
    var maxDataLen = shortCount === nBlocks ? shortLen : shortLen + 1;
    for (var c = 0; c < maxDataLen; c++) {
      for (var b = 0; b < nBlocks; b++) {
        if (c < blocks[b].length) out.push(blocks[b][c]);
      }
    }
    // EC 码字交织（每块 EC 长度相同）
    for (var c2 = 0; c2 < ecLen; c2++) {
      for (var b2 = 0; b2 < nBlocks; b2++) {
        out.push(ecBlocks[b2][c2]);
      }
    }
    return out;
  }

  // ── 矩阵构建 ──
  function makeMatrix(version) {
    var size = version * 4 + 17;
    var m = [], reserved = [];
    for (var i = 0; i < size; i++) {
      m.push(new Array(size).fill(0));
      reserved.push(new Array(size).fill(false));
    }
    return { m: m, r: reserved, size: size };
  }

  function placeFinder(m, r, row, col) {
    for (var i = -1; i <= 7; i++) {
      for (var j = -1; j <= 7; j++) {
        var rr = row + i, cc = col + j;
        if (rr < 0 || rr >= m.length || cc < 0 || cc >= m.length) continue;
        var on = (i >= 0 && i <= 6 && (j === 0 || j === 6)) ||
                 (j >= 0 && j <= 6 && (i === 0 || i === 6)) ||
                 (i >= 2 && i <= 4 && j >= 2 && j <= 4);
        m[rr][cc] = on ? 1 : 0;
        r[rr][cc] = true;
      }
    }
  }

  function placeAlignment(m, r, cy, cx) {
    for (var i = -2; i <= 2; i++) {
      for (var j = -2; j <= 2; j++) {
        var on = Math.max(Math.abs(i), Math.abs(j)) !== 1;
        m[cy + i][cx + j] = on ? 1 : 0;
        r[cy + i][cx + j] = true;
      }
    }
  }

  function placeTiming(m, r) {
    var size = m.length;
    for (var i = 8; i < size - 8; i++) {
      var v = (i % 2 === 0) ? 1 : 0;
      m[6][i] = v; r[6][i] = true;
      m[i][6] = v; r[i][6] = true;
    }
  }

  function reserveFormat(m, r, size) {
    // 格式信息区（实际值稍后填）
    for (var i = 0; i < 9; i++) {
      if (!r[8][i]) { r[8][i] = true; }
      if (!r[i][8]) { r[i][8] = true; }
    }
    for (var j = 0; j < 8; j++) {
      r[8][size - 1 - j] = true;
      r[size - 1 - j][8] = true;
    }
    // 暗模块
    m[size - 8][8] = 1;
    r[size - 8][8] = true;
  }

  /** 版本信息（v7+）：18 位 BCH 码，写在右上与左下两块 3x6 区域 */
  function placeVersion(m, r, version, size) {
    if (version < 7) return;

    // 版本号 6 位 + BCH(18,6) 校验，生成多项式 0x1f25
    var vbits = version << 12;
    for (var i = 17; i >= 12; i--) {
      if ((vbits >> i) & 1) vbits ^= 0x1f25 << (i - 12);
    }
    var vinfo = (version << 12) | vbits;

    for (var k = 0; k < 18; k++) {
      var bit = (vinfo >> k) & 1;
      var a = Math.floor(k / 3);      // 0..5
      var b = k % 3;                  // 0..2
      // 左下块：行 = size-11+b，列 = a
      m[size - 11 + b][a] = bit;
      r[size - 11 + b][a] = true;
      // 右上块：行 = a，列 = size-11+b
      m[a][size - 11 + b] = bit;
      r[a][size - 11 + b] = true;
    }
  }

  function placeData(m, r, bits, size) {
    var idx = 0, up = true;
    for (var col = size - 1; col > 0; col -= 2) {
      if (col === 6) col--;                 // 跳过竖直定时线
      for (var k = 0; k < size; k++) {
        var row = up ? size - 1 - k : k;
        for (var c = 0; c < 2; c++) {
          var cc = col - c;
          if (r[row][cc]) continue;
          m[row][cc] = idx < bits.length ? bits[idx] : 0;
          idx++;
        }
      }
      up = !up;
    }
  }

  // ── 掩码 ──
  var MASK_FN = [
    function (i, j) { return (i + j) % 2 === 0; },
    function (i, j) { return i % 2 === 0; },
    function (i, j) { return j % 3 === 0; },
    function (i, j) { return (i + j) % 3 === 0; },
    function (i, j) { return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0; },
    function (i, j) { return ((i * j) % 2) + ((i * j) % 3) === 0; },
    function (i, j) { return (((i * j) % 2) + ((i * j) % 3)) % 2 === 0; },
    function (i, j) { return (((i + j) % 2) + ((i * j) % 3)) % 2 === 0; }
  ];

  function applyMask(m, r, maskId, size) {
    for (var i = 0; i < size; i++) {
      for (var j = 0; j < size; j++) {
        if (r[i][j]) continue;
        if (MASK_FN[maskId](i, j)) m[i][j] ^= 1;
      }
    }
  }

  /** 放格式信息 */
  function placeFormat(m, r, maskId, size) {
    // 纠错等级 M 的编码是 0b00
    var data = (0b00 << 3) | maskId;
    var bch = data << 10;
    for (var i = 14; i >= 10; i--) {
      if ((bch >> i) & 1) bch ^= 0x537 << (i - 10);
    }
    var fmt = ((data << 10) | bch) ^ 0x5412;

    // 副本 1（左上）：b14 在 m[8][0]，向高位递减至 m[0][8]=b0
    for (var k = 0; k <= 5; k++) m[8][k] = (fmt >> (14 - k)) & 1;
    m[8][7] = (fmt >> 8) & 1;
    m[8][8] = (fmt >> 7) & 1;
    m[7][8] = (fmt >> 6) & 1;
    for (var k2 = 0; k2 <= 5; k2++) m[k2][8] = (fmt >> (5 - k2)) & 1;

    // 副本 2（右上 + 左下）：b0-b7 在行 8 右端，b8-b14 在列 8 底端
    for (var k3 = 0; k3 <= 7; k3++) m[8][size - 1 - k3] = (fmt >> k3) & 1;
    for (var k4 = 8; k4 <= 14; k4++) m[size - 15 + k4][8] = (fmt >> k4) & 1;
    m[size - 8][8] = 1;
  }

  /** 惩罚分（简化实现，只需相对比较） */
  function penalty(m, size) {
    var score = 0;
    // 连续同色
    for (var i = 0; i < size; i++) {
      var runR = 1, runC = 1;
      for (var j = 1; j < size; j++) {
        if (m[i][j] === m[i][j - 1]) { runR++; }
        else { if (runR >= 5) score += runR - 2; runR = 1; }
        if (m[j][i] === m[j - 1][i]) { runC++; }
        else { if (runC >= 5) score += runC - 2; runC = 1; }
      }
      if (runR >= 5) score += runR - 2;
      if (runC >= 5) score += runC - 2;
    }
    // 2x2 同色块
    for (var a = 0; a < size - 1; a++) {
      for (var b = 0; b < size - 1; b++) {
        var v = m[a][b];
        if (v === m[a][b + 1] && v === m[a + 1][b] && v === m[a + 1][b + 1]) score += 3;
      }
    }
    return score;
  }

  /**
   * 生成二维码矩阵
   * @returns {size, modules:[[0|1]]} 或 null（内容过长）
   */
  function encode(text) {
    var bytes = toBytes(text);
    var version = pickVersion(bytes.length);
    if (!version) return null;

    var data = buildBitStream(bytes, version);
    var codewords = interleave(data, version);

    // 位流
    var bits = [];
    for (var i = 0; i < codewords.length; i++) {
      for (var b = 7; b >= 0; b--) bits.push((codewords[i] >> b) & 1);
    }

    var size = version * 4 + 17;
    var best = null, bestScore = Infinity;

    // 试 8 种掩码
    for (var mask = 0; mask < 8; mask++) {
      var g = makeMatrix(version);
      placeFinder(g.m, g.r, 0, 0);
      placeFinder(g.m, g.r, 0, size - 7);
      placeFinder(g.m, g.r, size - 7, 0);
      var al = ALIGN[version] || [];
      for (var p = 0; p < al.length; p++) {
        for (var q = 0; q < al.length; q++) {
          var cy = al[p], cx = al[q];
          // 跳过与定位图案重叠的位置
          if ((cy <= 8 && cx <= 8) || (cy <= 8 && cx >= size - 8) ||
              (cy >= size - 8 && cx <= 8)) continue;
          placeAlignment(g.m, g.r, cy, cx);
        }
      }
      placeTiming(g.m, g.r);
      reserveFormat(g.m, g.r, size);
      placeVersion(g.m, g.r, version, size);
      placeData(g.m, g.r, bits, size);
      applyMask(g.m, g.r, mask, size);
      placeFormat(g.m, g.r, mask, size);

      var s = penalty(g.m, size);
      if (s < bestScore) { bestScore = s; best = { m: g.m, mask: mask }; }
    }

    return { size: size, modules: best.m, version: version, mask: best.mask };
  }

  /**
   * 画到 canvas
   * @param text 内容
   * @param opt {size, margin, dark, light}
   */
  function toCanvas(text, opt) {
    opt = opt || {};
    var qr = encode(text);
    if (!qr) return null;

    var margin = opt.margin == null ? 4 : opt.margin;
    var px = opt.size || 160;
    var total = qr.size + margin * 2;
    var cell = px / total;

    var cv = document.createElement('canvas');
    cv.width = px;
    cv.height = px;
    var ctx = cv.getContext('2d');
    ctx.fillStyle = opt.light || '#ffffff';
    ctx.fillRect(0, 0, px, px);
    ctx.fillStyle = opt.dark || '#1c1a17';

    for (var i = 0; i < qr.size; i++) {
      for (var j = 0; j < qr.size; j++) {
        if (qr.modules[i][j]) {
          ctx.fillRect(
            Math.floor((margin + j) * cell),
            Math.floor((margin + i) * cell),
            Math.ceil(cell), Math.ceil(cell)
          );
        }
      }
    }
    return cv;
  }

  global.bzQR = {
    encode: encode,
    toCanvas: toCanvas
  };
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
