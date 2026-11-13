/**
 * PWA 安装引导 + 更新提示
 *
 * 为什么需要：浏览器的「添加到主屏幕」入口藏得深，用户不会主动找。
 * 这里做一个温和的底部条，只在合适的时候出现，不打扰。
 *
 * 出现条件（全部满足）：
 *   - 浏览器触发了 beforeinstallprompt（支持安装且未安装）
 *   - 用户没有明确拒绝过（localStorage 记录 30 天）
 *   - 不是已经在 standalone 模式运行
 *
 * 更新提示：检测到新的 service worker 就绪时，问是否刷新。
 */
(function (global) {
  'use strict';

  var DISMISS_KEY = 'bz_pwa_dismiss';
  var DISMISS_DAYS = 30;

  var deferredPrompt = null;
  var barEl = null;

  function daysSince(ts) {
    return (Date.now() - ts) / 86400000;
  }

  function dismissedRecently() {
    try {
      var v = localStorage.getItem(DISMISS_KEY);
      if (!v) return false;
      return daysSince(parseInt(v, 10)) < DISMISS_DAYS;
    } catch (e) { return false; }
  }

  function markDismissed() {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch (e) {}
  }

  function isStandalone() {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      window.navigator.standalone === true;
  }

  /** 是否 iOS（没有 beforeinstallprompt，需要手动指引） */
  function isIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  }

  function buildBar(opts) {
    if (barEl) return barEl;

    var bar = document.createElement('div');
    bar.id = 'pwaBar';
    bar.style.cssText = [
      'position:fixed', 'left:0', 'right:0', 'bottom:0', 'z-index:9998',
      'background:#1c1a17', 'color:#f7f4ed',
      'padding:12px 16px', 'display:flex', 'align-items:center', 'gap:12px',
      'font:13px/1.5 -apple-system,"PingFang SC","Microsoft YaHei",sans-serif',
      'box-shadow:0 -2px 16px rgba(0,0,0,.18)',
      'transform:translateY(100%)', 'transition:transform .3s ease'
    ].join(';');

    var txt = document.createElement('div');
    txt.style.cssText = 'flex:1;min-width:0';
    txt.innerHTML = '<div style="font-weight:600;margin-bottom:2px">' + opts.title + '</div>' +
      '<div style="color:#a39c8f;font-size:12px">' + opts.desc + '</div>';

    var act = document.createElement('button');
    act.textContent = opts.action || '安装';
    act.style.cssText = 'border:none;border-radius:5px;padding:8px 16px;' +
      'background:#a8352a;color:#fff;font-size:13px;cursor:pointer;flex-shrink:0';
    act.onclick = opts.onAction;

    var x = document.createElement('button');
    x.textContent = '×';
    x.setAttribute('aria-label', '关闭');
    x.style.cssText = 'border:none;background:none;color:#797367;font-size:20px;' +
      'cursor:pointer;padding:0 2px;line-height:1;flex-shrink:0';
    x.onclick = function () {
      markDismissed();
      hide();
    };

    bar.appendChild(txt);
    bar.appendChild(act);
    bar.appendChild(x);
    document.body.appendChild(bar);
    barEl = bar;

    requestAnimationFrame(function () {
      bar.style.transform = 'translateY(0)';
    });
    return bar;
  }

  function hide() {
    if (!barEl) return;
    barEl.style.transform = 'translateY(100%)';
    setTimeout(function () {
      if (barEl && barEl.parentNode) barEl.parentNode.removeChild(barEl);
      barEl = null;
    }, 320);
  }

  // ── 安装流程 ──
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;

    if (isStandalone() || dismissedRecently()) return;

    // 延迟出现，避免一进页面就弹
    setTimeout(function () {
      if (!deferredPrompt || isStandalone()) return;
      buildBar({
        title: '装到桌面，离线也能用',
        desc: '排盘、黄历、古籍都不用联网',
        action: '安装',
        onAction: function () {
          if (!deferredPrompt) return;
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then(function (c) {
            if (c.outcome === 'accepted') {
              hide();
            } else {
              markDismissed();
              hide();
            }
            deferredPrompt = null;
          });
        }
      });
    }, 6000);
  });

  // 已安装
  window.addEventListener('appinstalled', function () {
    hide();
    deferredPrompt = null;
    try { localStorage.removeItem(DISMISS_KEY); } catch (e) {}
  });

  // ── iOS 手动指引（Safari 无 beforeinstallprompt）──
  function maybeShowIOS() {
    if (!isIOS() || isStandalone() || dismissedRecently()) return;
    setTimeout(function () {
      buildBar({
        title: '添加到主屏幕',
        desc: '点底部「分享」→「添加到主屏幕」，离线可用',
        action: '知道了',
        onAction: function () { markDismissed(); hide(); }
      });
    }, 8000);
  }

  // ── Service Worker 注册 + 更新提示 ──
  function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' &&
        location.hostname !== '127.0.0.1') return;

    // 记录首次接管：controllerchange 在「首次安装」和「版本更新」时都会触发，
    // 需要区分开，只在更新时提示。
    var hadController = !!navigator.serviceWorker.controller;

    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (!hadController) {
        // 首次安装，不算更新
        hadController = true;
        return;
      }
      showUpdate();
    });

    navigator.serviceWorker.register('/sw.js').then(function (reg) {
      // 兜底：新 SW 已进入 waiting（未 skipWaiting 的情况）
      reg.addEventListener('updatefound', function () {
        var nw = reg.installing;
        if (!nw) return;
        nw.addEventListener('statechange', function () {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdate();
          }
        });
      });

      // 每 30 分钟检查一次更新（页面可见时才检查，省电）
      setInterval(function () {
        if (document.visibilityState === 'visible') {
          reg.update().catch(function () {});
        }
      }, 30 * 60 * 1000);
    }).catch(function (e) {
      console.log('SW 注册失败：', e && e.message);
    });
  }

  var updateShown = false;
  function showUpdate() {
    if (updateShown) return;
    updateShown = true;
    buildBar({
      title: '有新版本',
      desc: '刷新后用最新版本',
      action: '刷新',
      onAction: function () {
        // 新版本已通过 skipWaiting 激活，直接刷新即可
        location.reload();
      }
    });
  }

  function init() {
    // 等页面加载完再动，不抢首屏
    if (document.readyState === 'complete') {
      registerSW();
      maybeShowIOS();
    } else {
      window.addEventListener('load', function () {
        registerSW();
        maybeShowIOS();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  global.bzPWA = {
    hide: hide,
    isStandalone: isStandalone,
    clearDismiss: function () { try { localStorage.removeItem(DISMISS_KEY); } catch (e) {} }
  };
})(typeof window !== 'undefined' ? window : this);
