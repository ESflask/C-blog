/* ============================================================
   C-blog — client enhancement (framework-free, CSP対応)
   - ライト/ダーク切替（localStorage 永続）
   - <pre><code> を C++ ハイライト＋ツールバー＋コピーへ昇格
   - 読了プログレスバー（記事詳細）
   サーバー(Drogon)は素の HTML を返すだけでよい。
   ============================================================ */
(function () {
  'use strict';

  /* ── ライト/ダークモード ───────────────────────────── */
  function applyMode(mode) {
    document.body.setAttribute('data-mode', mode);
    var btns = document.querySelectorAll('[data-mode-toggle]');
    btns.forEach(function (b) {
      b.innerHTML = mode === 'dark'
        ? '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'
        : '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';
    });
  }
  function initMode() {
    var mode = localStorage.getItem('cblog-mode') || 'light';
    applyMode(mode);
    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-mode-toggle]');
      if (!t) return;
      var next = document.body.getAttribute('data-mode') === 'dark' ? 'light' : 'dark';
      localStorage.setItem('cblog-mode', next);
      applyMode(next);
    });
  }

  /* ── C++ シンタックスハイライト ─────────────────────── */
  var KW = ('alignas alignof asm auto bool break case catch char class co_await co_return co_yield const constexpr continue ' +
    'decltype default delete do double else enum explicit export extern false float for friend goto if inline int long ' +
    'mutable namespace new noexcept nullptr operator override private protected public register return short signed sizeof ' +
    'static struct switch template this throw true try typedef typename union unsigned using virtual void volatile while').split(' ');
  var TYPE = ('std string string_view vector map unordered_map optional size_t uint64_t int64_t int32_t uint32_t shared_ptr ' +
    'unique_ptr Task HttpController HttpRequestPtr HttpResponsePtr HttpResponse Json Mapper Posts Comments drogon orm DbClient Criteria').split(' ');
  var KWSET = {}, TYPESET = {};
  KW.forEach(function (k) { KWSET[k] = 1; });
  TYPE.forEach(function (k) { TYPESET[k] = 1; });

  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function highlight(code) {
    var rules = [
      ['t-com', /\/\/[^\n]*|\/\*[\s\S]*?\*\//y],
      ['t-pre', /#[^\n]*/y],
      ['t-str', /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/y],
      ['t-num', /\b\d[\d.'eExXa-fA-F+-]*\b/y],
      ['__id', /[A-Za-z_]\w*/y],
      ['__ws', /\s+/y],
      ['__pn', /[^\sA-Za-z0-9_]/y]
    ];
    var i = 0, out = '';
    while (i < code.length) {
      var matched = false;
      for (var r = 0; r < rules.length; r++) {
        var cls = rules[r][0], re = rules[r][1];
        re.lastIndex = i;
        var m = re.exec(code);
        if (m && m.index === i) {
          var text = m[0];
          if (cls === '__id') {
            var after = i + text.length;
            while (after < code.length && code[after] === ' ') after++;
            if (KWSET[text]) out += '<span class="t-kw">' + esc(text) + '</span>';
            else if (TYPESET[text]) out += '<span class="t-type">' + esc(text) + '</span>';
            else if (code[after] === '(') out += '<span class="t-fn">' + esc(text) + '</span>';
            else out += esc(text);
          } else if (cls.indexOf('__') === 0) {
            out += esc(text);
          } else {
            out += '<span class="' + cls + '">' + esc(text) + '</span>';
          }
          i += text.length;
          matched = true;
          break;
        }
      }
      if (!matched) { out += esc(code[i]); i++; }
    }
    return out;
  }

  /* ── <pre><code> をコードブロックへ昇格 ─────────────── */
  function upgradeCodeBlocks() {
    var pres = document.querySelectorAll('pre > code');
    pres.forEach(function (code) {
      var pre = code.parentNode;
      if (pre.closest('.code-block')) return; // 既に処理済み
      var raw = code.textContent.replace(/\n$/, '');
      var file = code.getAttribute('data-file') || '';
      var lang = code.getAttribute('data-lang') || 'C++';
      var lines = raw.split('\n');
      var html = lines.map(function (ln, idx) {
        return '<span class="ln">' + (idx + 1) + '</span>' + highlight(ln);
      }).join('\n');

      var wrap = document.createElement('div');
      wrap.className = 'code-block';
      wrap.innerHTML =
        '<div class="code-block__bar">' +
          '<div class="code-dots"><span></span><span></span><span></span></div>' +
          (file ? '<span class="code-file">' + esc(file) + '</span>' : '') +
          '<span class="code-lang">' + esc(lang) + '</span>' +
          '<button class="code-copy" type="button">' +
            '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>コピー</button>' +
        '</div>' +
        '<pre><code></code></pre>';
      wrap.querySelector('pre code').innerHTML = html;
      pre.parentNode.replaceChild(wrap, pre);

      wrap.querySelector('.code-copy').addEventListener('click', function () {
        var btn = this;
        var done = function () {
          btn.classList.add('copied');
          btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>コピー済み';
          setTimeout(function () {
            btn.classList.remove('copied');
            btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>コピー';
          }, 1600);
        };
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(raw).then(done).catch(function () {});
        } else {
          var ta = document.createElement('textarea');
          ta.value = raw; ta.style.position = 'fixed'; ta.style.opacity = '0';
          document.body.appendChild(ta); ta.select();
          try { document.execCommand('copy'); done(); } catch (e) {}
          document.body.removeChild(ta);
        }
      });
    });
  }

  /* ── 読了プログレスバー ─────────────────────────────── */
  function initProgress() {
    var bar = document.querySelector('.progress-bar');
    if (!bar) return;
    function onScroll() {
      var de = document.documentElement;
      var max = de.scrollHeight - de.clientHeight;
      bar.style.width = (max > 0 ? (de.scrollTop / max) * 100 : 0) + '%';
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── 公開トグル / 削除確認（管理画面） ───────────────── */
  function initAdmin() {
    document.querySelectorAll('.toggle[data-toggle-pub]').forEach(function (t) {
      t.addEventListener('click', function () {
        var on = t.getAttribute('data-on') === '1';
        t.setAttribute('data-on', on ? '0' : '1');
        var track = t.querySelector('.toggle-track');
        var thumb = t.querySelector('.toggle-thumb');
        track.style.background = on ? 'var(--c-border)' : 'var(--c-blue)';
        thumb.style.transform = on ? 'none' : 'translateX(16px)';
        var lbl = t.parentNode.querySelector('.toggle-lbl');
        if (lbl) lbl.textContent = on ? '下書き' : '公開';
        // 本番では fetch('/admin/posts/'+id+'/toggle', {method:'POST'}) などに置換
      });
    });
  }

  function init() {
    initMode();
    upgradeCodeBlocks();
    initProgress();
    initAdmin();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
