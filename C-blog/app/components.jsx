/* ============================================================
   C-blog — shared data, themes, syntax highlighter, components
   exported to window for the pages script.
   ============================================================ */
const { useState, useEffect, useRef } = React;

/* ── Categories ─────────────────────────────────────── */
const CATEGORIES = ["すべて","C++","Drogon","SQLite","CMake","アーキテクチャ","パフォーマンス","テスト"];

/* ── Sample articles (C++ / Drogon blog) ────────────── */
const ALL_ARTICLES = [
  { id:1, title:"Drogon の非同期ハンドラを coroutine で書く", category:"Drogon", lang:"C++",
    excerpt:"コールバック地獄を避けて Task<> ベースで HTTP ハンドラを記述する方法。co_await で DB アクセスを直列に書きつつ非同期を保つ実装パターンを解説します。",
    date:"2026年6月2日", readTime:"8分", published:true },
  { id:2, title:"CSP テンプレートでサーバーサイドレンダリング", category:"Drogon", lang:"CSP",
    excerpt:"Drogon の .csp テンプレートで HTML を生成する仕組みと、レイアウト継承・部分ビュー・エスケープの実務的な使い方をまとめます。",
    date:"2026年5月26日", readTime:"6分", published:true },
  { id:3, title:"SQLite と Drogon ORM でモデルを自動生成する", category:"SQLite", lang:"SQL",
    excerpt:"migrations の DDL から drogon_ctl でモデルを生成し、型安全に CRUD を書く流れ。マイグレーション運用のコツも添えて解説します。",
    date:"2026年5月19日", readTime:"7分", published:true },
  { id:4, title:"CMake で C++17 プロジェクトを整える", category:"CMake", lang:"CMake",
    excerpt:"find_package / target_link_libraries の基本から、ビルドキャッシュとサブディレクトリ構成まで。最小で破綻しない CMakeLists の書き方。",
    date:"2026年5月12日", readTime:"9分", published:false },
  { id:5, title:"Controller / Service / Model のレイヤ分離", category:"アーキテクチャ", lang:"C++",
    excerpt:"ビジネスロジックを Service に寄せ、Controller を入出力に専念させる設計。テスト容易性と変更耐性が両立する理由を実例で示します。",
    date:"2026年5月5日", readTime:"5分", published:true },
  { id:6, title:"std::string_view で無駄なコピーを減らす", category:"パフォーマンス", lang:"C++",
    excerpt:"所有権を持たないビューで部分文字列を扱い、ヒープ確保を避ける。落とし穴（ダングリング）と安全な使いどころを整理します。",
    date:"2026年4月28日", readTime:"6分", published:true },
  { id:7, title:"drogon_test で統合テストを書く", category:"テスト", lang:"C++",
    excerpt:"HTTP クライアントを使ったエンドツーエンドのテストを CTest に組み込む。フィクスチャと DB ロールバックの定石を紹介します。",
    date:"2026年4月21日", readTime:"8分", published:true },
  { id:8, title:"Markdown→HTML 変換ユーティリティを自作する", category:"C++", lang:"C++",
    excerpt:"記事本文を安全に描画するための最小 Markdown パーサ。エスケープとサニタイズを軸に、拡張しやすい構造へ。",
    date:"2026年4月14日", readTime:"7分", published:true },
];

/* ── Themes (light + dark token sets per style) ─────── */
const FONTS = {
  editorial: { '--font-heading':"'Cormorant Garamond', Georgia, serif", '--font-body':"'Noto Sans JP', sans-serif", '--font-ui':"'DM Sans', sans-serif", '--h-weight':'600', '--radius':'2px' },
  modern:    { '--font-heading':"'DM Sans', sans-serif",                '--font-body':"'Noto Sans JP', sans-serif", '--font-ui':"'DM Sans', sans-serif", '--h-weight':'700', '--radius':'6px' },
  minimal:   { '--font-heading':"'Cormorant Garamond', Georgia, serif", '--font-body':"'DM Sans', sans-serif",       '--font-ui':"'DM Sans', sans-serif", '--h-weight':'300', '--radius':'0px' },
};
// Claude 寄せ: 主役はクレイ系オレンジ (≈ #D97757)。gold は控えめなアンバー。
const ACCENT = {
  editorial: { light:{ blue:'oklch(58% 0.145 42)', gold:'oklch(74% 0.10 68)' }, dark:{ blue:'oklch(70% 0.15 47)', gold:'oklch(78% 0.10 72)' } },
  modern:    { light:{ blue:'oklch(60% 0.165 42)', gold:'oklch(75% 0.11 70)' }, dark:{ blue:'oklch(72% 0.17 47)', gold:'oklch(80% 0.11 72)' } },
  minimal:   { light:{ blue:'oklch(56% 0.13 42)',  gold:'oklch(72% 0.09 68)' }, dark:{ blue:'oklch(72% 0.13 47)', gold:'oklch(78% 0.09 72)' } },
};
const SURFACES = {
  light: {
    '--c-bg':'oklch(99% 0.004 75)', '--c-surface':'oklch(100% 0 0)', '--c-surface-2':'oklch(97.5% 0.006 70)',
    '--c-text':'oklch(22% 0.012 50)', '--c-text-2':'oklch(46% 0.012 50)', '--c-text-3':'oklch(62% 0.010 50)',
    '--c-border':'oklch(91% 0.008 68)',
  },
  dark: {
    '--c-bg':'oklch(15% 0.006 60)', '--c-surface':'oklch(19% 0.007 60)', '--c-surface-2':'oklch(23% 0.008 60)',
    '--c-text':'oklch(94% 0.006 80)', '--c-text-2':'oklch(74% 0.010 70)', '--c-text-3':'oklch(60% 0.010 60)',
    '--c-border':'oklch(30% 0.009 60)',
  },
};
const THEME_LABELS = { editorial:'Editorial', modern:'Modern', minimal:'Minimal' };

function buildTokens(theme, mode) {
  const acc = ACCENT[theme][mode];
  return {
    ...SURFACES[mode],
    ...FONTS[theme],
    '--c-blue': acc.blue,
    '--c-blue-h': acc.blue,
    '--c-gold': acc.gold,
    '--c-gold-l': acc.gold,
  };
}

/* ── C++ syntax highlighter ─────────────────────────── */
const CPP_KW = new Set(['alignas','alignof','asm','auto','bool','break','case','catch','char','class','co_await','co_return','co_yield','const','constexpr','continue','decltype','default','delete','do','double','else','enum','explicit','export','extern','false','float','for','friend','goto','if','inline','int','long','mutable','namespace','new','noexcept','nullptr','operator','override','private','protected','public','register','return','short','signed','sizeof','static','struct','switch','template','this','throw','true','try','typedef','typename','union','unsigned','using','virtual','void','volatile','while']);
const CPP_TYPE = new Set(['std','string','string_view','vector','map','unordered_map','optional','size_t','uint64_t','int64_t','int32_t','uint32_t','shared_ptr','unique_ptr','Task','HttpController','HttpRequestPtr','HttpResponsePtr','HttpResponse','Json','Mapper','Posts','Comments','drogon','orm','DbClient']);

function esc(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function highlightCpp(code) {
  const rules = [
    ['t-com', /\/\/[^\n]*|\/\*[\s\S]*?\*\//y],
    ['t-pre', /#[^\n]*/y],
    ['t-str', /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|R"\([\s\S]*?\)"/y],
    ['t-num', /\b\d[\d.'eExXa-fA-F+-]*\b/y],
    ['__id',  /[A-Za-z_]\w*/y],
    ['__ws',  /\s+/y],
    ['__pn',  /[^\sA-Za-z0-9_]/y],
  ];
  let i = 0, out = '';
  while (i < code.length) {
    let matched = false;
    for (const [cls, re] of rules) {
      re.lastIndex = i;
      const m = re.exec(code);
      if (m && m.index === i) {
        const text = m[0];
        if (cls === '__id') {
          // function call?
          let after = i + text.length;
          while (after < code.length && code[after] === ' ') after++;
          if (CPP_KW.has(text))        out += `<span class="t-kw">${esc(text)}</span>`;
          else if (CPP_TYPE.has(text)) out += `<span class="t-type">${esc(text)}</span>`;
          else if (code[after] === '(')out += `<span class="t-fn">${esc(text)}</span>`;
          else                          out += esc(text);
        } else if (cls.startsWith('__')) {
          out += esc(text);
        } else {
          out += `<span class="${cls}">${esc(text)}</span>`;
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

/* ── CodeBlock component ────────────────────────────── */
function CodeBlock({ file, lang, code }) {
  const [copied, setCopied] = useState(false);
  const lines = code.replace(/\n$/, '').split('\n');
  const html = lines
    .map((ln, idx) => `<span class="ln">${idx + 1}</span>${highlightCpp(ln)}`)
    .join('\n');

  const copy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(code);
      } else {
        const ta = document.createElement('textarea');
        ta.value = code; ta.style.position='fixed'; ta.style.opacity='0';
        document.body.appendChild(ta); ta.select();
        document.execCommand('copy'); document.body.removeChild(ta);
      }
      setCopied(true); setTimeout(() => setCopied(false), 1600);
    } catch (e) { /* ignore */ }
  };

  return (
    <div className="code-block">
      <div className="code-block__bar">
        <div className="code-dots"><span></span><span></span><span></span></div>
        {file && <span className="code-file">{file}</span>}
        {lang && <span className="code-lang">{lang}</span>}
        <button className={`code-copy${copied ? ' copied' : ''}`} onClick={copy}>
          {copied
            ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>コピー済み</>
            : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>コピー</>}
        </button>
      </div>
      <pre><code dangerouslySetInnerHTML={{ __html: html }} /></pre>
    </div>
  );
}

/* ── Brand mark ─────────────────────────────────────── */
function Brand({ onClick }) {
  return (
    <button className="brand" onClick={onClick} aria-label="C-blog ホーム">
      <span className="brand__mark">C</span>
      <span className="brand__text">
        <span className="brand__name">C-blog</span>
        <span className="brand__tag">C++ · Drogon · SQLite</span>
      </span>
    </button>
  );
}

/* ── Icons ──────────────────────────────────────────── */
const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
);
const IconSun = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
);
const IconMoon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
);
const IconArrowLeft = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M19 12H5m0 0 7 7m-7-7 7-7"/></svg>
);

/* ── Header ─────────────────────────────────────────── */
function Header({ page, setPage, loggedIn, searchQuery, onSearch, onLogout, mode, toggleMode }) {
  return (
    <header className="header">
      <div className="header__inner">
        <Brand onClick={() => setPage('list')} />
        <div className="header-search">
          <span className="header-search__icon"><IconSearch /></span>
          <input
            className="header-search__input" type="search"
            placeholder="記事をキーワードで検索"
            value={searchQuery}
            onChange={e => { onSearch(e.target.value); setPage('list'); }}
          />
        </div>
        <nav className="nav">
          <button className={`nav-btn${page === 'list' ? ' active' : ''}`} onClick={() => setPage('list')}>記事一覧</button>
          {loggedIn
            ? <>
                <button className={`nav-btn${page === 'dashboard' ? ' active' : ''}`} onClick={() => setPage('dashboard')}>管理</button>
                <button className="nav-btn cta" onClick={onLogout}>ログアウト</button>
              </>
            : <button className="nav-btn" onClick={() => setPage('login')}>管理</button>}
          <button className="mode-toggle" onClick={toggleMode} aria-label="ライト/ダーク切替">
            {mode === 'dark' ? <IconSun /> : <IconMoon />}
          </button>
        </nav>
      </div>
      <div className="gold-rule"></div>
    </header>
  );
}

/* ── Footer ─────────────────────────────────────────── */
function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="footer-brand">
          <span className="footer-mark">C</span>
          <span className="footer-copy">© 2026 C-blog</span>
        </div>
        <span className="footer-tech">Powered by <b>Drogon</b> (C++17) · <b>SQLite</b></span>
      </div>
    </footer>
  );
}

/* ── Article Card ───────────────────────────────────── */
function ArticleCard({ article, index, onClick }) {
  return (
    <article className="article-card" style={{ animationDelay: `${index * 72}ms` }}
      onClick={() => onClick(article)} role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick(article)}>
      <div className="card-top">
        <span className="card-cat">{article.category}</span>
        <span className="card-tag-lang">{article.lang}</span>
      </div>
      <h2 className="card-title">{article.title}</h2>
      <p className="card-excerpt">{article.excerpt}</p>
      <div className="card-meta">
        <span>{article.date}</span>
        <span className="meta-sep">—</span>
        <span>読了 {article.readTime}</span>
      </div>
    </article>
  );
}

Object.assign(window, {
  CATEGORIES, ALL_ARTICLES, THEME_LABELS, buildTokens,
  CodeBlock, Brand, Header, SiteFooter, ArticleCard,
  IconSearch, IconSun, IconMoon, IconArrowLeft,
});
