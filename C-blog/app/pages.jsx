/* ============================================================
   C-blog — pages + App shell
   depends on window globals from components.jsx
   ============================================================ */
const { useState: useS, useEffect: useE } = React;

/* ── Per-article body content (prose + code) ────────── */
function ArticleBody({ article }) {
  // Drogon coroutine handler は記事1のサンプル。他記事は共通の構成で描画。
  if (article.id === 1) {
    return (
      <div className="article-body">
        <p>Drogon はコールバックベースの非同期 I/O を基本としますが、C++20 の coroutine を使うと <code>co_await</code> で DB アクセスや HTTP 呼び出しを<strong>直列に書きながら非同期を保つ</strong>ことができます。ネストの深いコールバックを排除でき、可読性が大きく向上します。</p>
        <p>まず、コントローラのハンドラを <code>Task&lt;HttpResponsePtr&gt;</code> として宣言します。戻り値が <code>Task</code> であれば、Drogon がコルーチンとして適切にスケジューリングします。</p>
        <CodeBlock file="BlogController.cc" lang="C++" code={`Task<HttpResponsePtr> BlogController::show(HttpRequestPtr req,
                                          std::string slug) {
  auto db = drogon::app().getDbClient();
  Mapper<Posts> mapper(db);

  // co_await で結果が返るまで中断、スレッドはブロックしない
  auto post = co_await mapper.findOne(
      Criteria(Posts::Cols::_slug, slug));

  auto resp = HttpResponse::newHttpViewResponse(
      "post_detail", toJson(post));
  co_return resp;
}`} />
        <h2>コールバック版との比較</h2>
        <p>従来のコールバック版では、DB 結果を受け取るたびにラムダがネストし、エラー処理が分散します。coroutine 版なら例外で一括処理でき、制御フローが素直になります。</p>
        <blockquote>非同期の「速さ」を保ったまま、同期コードの「読みやすさ」を得られるのが coroutine の本質的な利点です。</blockquote>
        <h2>例外とエラーハンドリング</h2>
        <p><code>co_await</code> が投げる例外は通常の <code>try / catch</code> で捕捉できます。レコードが存在しない場合の <code>orm::UnexpectedRows</code> をハンドリングして 404 を返しましょう。</p>
        <CodeBlock file="BlogController.cc" lang="C++" code={`try {
  auto post = co_await mapper.findOne(
      Criteria(Posts::Cols::_slug, slug));
  co_return render(post);
} catch (const orm::UnexpectedRows &) {
  co_return HttpResponse::newNotFoundResponse();
}`} />
        <p>このパターンを Service 層に切り出せば、Controller は入出力だけに専念できます。次回はその分離設計を掘り下げます。</p>
      </div>
    );
  }
  // 汎用本文（コード付き）
  return (
    <div className="article-body">
      <p>{article.excerpt}</p>
      <p>本記事では <code>{article.category}</code> に関する実装上の勘所を、最小のコード例とともに整理します。まずは依存関係を最小限に保ち、変更に強い構造を作ることが目標です。</p>
      <h2>基本の実装</h2>
      <p>下記は典型的なセットアップの一例です。設定は <code>config.json</code> から読み込み、明示的な初期化を心がけます。</p>
      <CodeBlock file="main.cc" lang="C++" code={`#include <drogon/drogon.h>

int main() {
  // config.json からポート/DB/ログ設定を読み込む
  drogon::app().loadConfigFile("config.json");
  drogon::app().run();
  return 0;
}`} />
      <h2>設計上の注意</h2>
      <p>ロジックは Service 層へ寄せ、ビュー（<code>.csp</code>）には渡されたデータの描画だけを任せます。こうすることでテスト容易性と再利用性が両立します。</p>
      <blockquote>小さく作り、必要になってから拡張する。スキャフォールド段階では「壊れにくい最小構成」を優先しましょう。</blockquote>
      <ul>
        <li>マイグレーションは必ず <code>migrations/</code> に SQL として残す</li>
        <li>モデルは手書きせず <code>gen_model.sh</code> で再生成する</li>
        <li>機密情報は環境変数で渡し、設定にはプレースホルダのみ置く</li>
      </ul>
    </div>
  );
}

/* ── Article list page ──────────────────────────────── */
const PER_PAGE = 5;
function ArticleListPage({ setPage, setArticle, searchQuery, catFilter, setCatFilter }) {
  const [pageNum, setPageNum] = useS(1);
  const filtered = ALL_ARTICLES.filter(a =>
    a.published &&
    (catFilter === 'すべて' || a.category === catFilter) &&
    (searchQuery === '' || a.title.includes(searchQuery) || a.excerpt.includes(searchQuery))
  );
  useE(() => { setPageNum(1); }, [catFilter, searchQuery]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((pageNum - 1) * PER_PAGE, pageNum * PER_PAGE);

  return (
    <main className="page">
      <div className="container">
        <div className="page-section">
          <div className="chips">
            {CATEGORIES.map(c => (
              <button key={c} className={`chip${catFilter === c ? ' active' : ''}`} onClick={() => setCatFilter(c)}>{c}</button>
            ))}
          </div>
          <div className="section-hd">
            <h1>記事一覧</h1>
            <span className="section-count">{filtered.length}件</span>
          </div>
          <div className="articles-grid">
            {paged.length > 0
              ? paged.map((a, i) => (
                  <ArticleCard key={a.id} article={a} index={i}
                    onClick={art => { setArticle(art); setPage('detail'); window.scrollTo(0,0); }} />
                ))
              : <div className="empty-state">該当する記事が見つかりませんでした</div>}
          </div>
          {totalPages > 1 && (
            <div className="pagination">
              <button className="page-btn" disabled={pageNum === 1} onClick={() => setPageNum(p => p - 1)}>← 前へ</button>
              <span className="page-info">{pageNum} / {totalPages}</span>
              <button className="page-btn" disabled={pageNum === totalPages} onClick={() => setPageNum(p => p + 1)}>次へ →</button>
            </div>
          )}
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}

/* ── Article detail page ────────────────────────────── */
function ArticleDetailPage({ article, setPage, onCategoryClick }) {
  const [progress, setProgress] = useS(0);
  useE(() => {
    const onScroll = () => {
      const de = document.documentElement;
      const scrolled = de.scrollTop || document.body.scrollTop;
      const max = de.scrollHeight - de.clientHeight;
      setProgress(max > 0 ? (scrolled / max) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <main className="page">
      <div className="progress-bar" style={{ width: `${progress}%` }} />
      <div className="container">
        <button className="back-btn" onClick={() => setPage('list')}>
          <IconArrowLeft /> 記事一覧に戻る
        </button>
        <div className="layout-with-aside">
          <aside className="article-aside">
            <div className="article-aside__title">カテゴリ</div>
            <ul>
              <li><button className="aside-link" onClick={() => onCategoryClick('すべて')}>すべての記事</button></li>
              {CATEGORIES.slice(1).map(c => (
                <li key={c}><button className={`aside-link${article.category === c ? ' active' : ''}`} onClick={() => onCategoryClick(c)}>{c}</button></li>
              ))}
            </ul>
          </aside>
          <div>
            <div className="article-hd">
              <div className="article-cat">{article.category}</div>
              <h1 className="article-title">{article.title}</h1>
              <div className="article-meta">
                <span>{article.date}</span>
                <span style={{ color:'var(--c-gold)' }}>—</span>
                <span>読了時間 {article.readTime}</span>
                <span className="article-tags"><span className="article-tag-lang">{article.lang}</span></span>
              </div>
            </div>
            <ArticleBody article={article} />
          </div>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}

/* ── Login page ─────────────────────────────────────── */
function LoginPage({ setPage, setLoggedIn }) {
  const [user, setUser] = useS('');
  const [pass, setPass] = useS('');
  const [loading, setLoading] = useS(false);
  const [error, setError] = useS('');
  const handle = e => {
    e.preventDefault(); setError('');
    if (!user || !pass) { setError('ユーザー名とパスワードを入力してください。'); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); setLoggedIn(true); setPage('dashboard'); }, 900);
  };
  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-ornament"></div>
        <h1 className="login-title">管理者ログイン</h1>
        <p className="login-sub">セッション認証 · 管理ページ保護（LoginFilter）</p>
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={handle}>
          <div className="form-row">
            <label className="form-label">ユーザー名</label>
            <input className="form-input" type="text" placeholder="admin" value={user} onChange={e => setUser(e.target.value)} />
          </div>
          <div className="form-row">
            <label className="form-label">パスワード</label>
            <input className="form-input" type="password" placeholder="••••••••" value={pass} onChange={e => setPass(e.target.value)} />
          </div>
          <button className="btn-primary" type="submit">{loading ? 'ログイン中…' : 'ログイン'}</button>
        </form>
        <p className="login-hint">demo: 任意の値でログインできます</p>
      </div>
    </div>
  );
}

/* ── Dashboard page ─────────────────────────────────── */
function DashboardPage({ setPage, setLoggedIn, setEditArticle }) {
  const [arts, setArts] = useS(ALL_ARTICLES);
  const [query, setQuery] = useS('');
  const shown = arts.filter(a => query === '' || a.title.includes(query) || a.category.includes(query));
  const togglePub = id => setArts(prev => prev.map(a => a.id === id ? { ...a, published: !a.published } : a));
  const delArt = id => setArts(prev => prev.filter(a => a.id !== id));
  const pubCount = arts.filter(a => a.published).length;

  return (
    <main className="page">
      <div className="container">
        <div className="dash-hd">
          <div>
            <h1 className="dash-title">記事管理</h1>
            <p className="dash-sub">C-blog 管理ダッシュボード</p>
          </div>
          <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
            <button className="nav-btn" onClick={() => { setLoggedIn(false); setPage('list'); }}>ログアウト</button>
            <button className="nav-btn cta" onClick={() => { setEditArticle(null); setPage('form'); }}>＋ 新規記事</button>
          </div>
        </div>
        <div className="stats">
          {[
            { n: arts.length,            l: '総記事数', d: 0 },
            { n: pubCount,               l: '公開中',   d: 80 },
            { n: arts.length - pubCount, l: '下書き',   d: 160 },
          ].map(s => (
            <div key={s.l} className="stat" style={{ animationDelay: `${s.d}ms` }}>
              <div className="stat-num">{s.n}</div>
              <div className="stat-label">{s.l}</div>
            </div>
          ))}
        </div>
        <div className="dash-search search-wrap">
          <span className="search-icon"><IconSearch /></span>
          <input className="search-input" type="text" placeholder="記事を検索…" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <div className="table">
          <div className="table-head">
            <div className="th">タイトル</div>
            <div className="th">カテゴリ</div>
            <div className="th">公開状態</div>
            <div className="th">操作</div>
          </div>
          {shown.map((a, i) => (
            <div key={a.id} className="table-row" style={{ animationDelay: `${i * 55}ms` }}>
              <div className="td td-title-cell">
                <span className="td-title">{a.title}</span>
                <span className="td-date">{a.date}</span>
              </div>
              <div className="td" style={{ fontSize:'12px', color:'var(--c-text-2)' }}>{a.category}</div>
              <div className="td">
                <div className="toggle" onClick={() => togglePub(a.id)}>
                  <div className="toggle-track" style={{ background: a.published ? 'var(--c-blue)' : 'var(--c-border)' }}></div>
                  <div className="toggle-thumb" style={{ transform: a.published ? 'translateX(16px)' : 'none' }}></div>
                </div>
                <span className="toggle-lbl">{a.published ? '公開' : '下書き'}</span>
              </div>
              <div className="td td-actions">
                <button className="icon-btn" onClick={() => { setEditArticle(a); setPage('form'); }}>編集</button>
                <button className="icon-btn del" onClick={() => delArt(a.id)}>削除</button>
              </div>
            </div>
          ))}
          {shown.length === 0 && <div className="empty-state">検索条件に一致する記事はありません</div>}
        </div>
      </div>
    </main>
  );
}

/* ── Article form page ──────────────────────────────── */
function ArticleFormPage({ article, setPage }) {
  const isEdit = !!article;
  const [title, setTitle] = useS(article?.title || '');
  const [cat, setCat] = useS(article?.category || CATEGORIES[1]);
  const [body, setBody] = useS(article ? '' : '');
  const [pub, setPub] = useS(article?.published !== false);
  const handle = e => { e.preventDefault(); setPage('dashboard'); };
  return (
    <main className="page">
      <div className="container">
        <div className="article-form-wrap">
          <button className="back-btn" style={{ marginBottom:'16px' }} onClick={() => setPage('dashboard')}>
            <IconArrowLeft /> ダッシュボードに戻る
          </button>
          <h1 className="form-hd">{isEdit ? '記事編集' : '新規記事作成'}</h1>
          <p className="form-sub">{isEdit ? `「${article.title}」を編集中` : 'Markdown で本文を書き、公開設定を選びます'}</p>
          <form onSubmit={handle}>
            <div className="field-row">
              <label className="field-label">タイトル</label>
              <input className="field-input" type="text" placeholder="記事タイトルを入力…" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="field-row" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
              <div>
                <label className="field-label">カテゴリ</label>
                <select className="field-input" value={cat} onChange={e => setCat(e.target.value)}>
                  {CATEGORIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">スラッグ</label>
                <input className="field-input" type="text" placeholder="async-handler-coroutine" style={{ fontFamily:'var(--font-mono)', fontSize:'13.5px' }} />
              </div>
            </div>
            <div className="field-row">
              <label className="field-label">本文（Markdown）</label>
              <textarea className="field-input field-textarea" placeholder={"## 見出し\n\n本文をMarkdownで入力…\n\n```cpp\nco_return resp;\n```"} value={body} onChange={e => setBody(e.target.value)} />
              <p className="field-hint">保存時に utils/Markdown により HTML へ変換されます</p>
            </div>
            <div className="field-row">
              <label className="field-label">公開設定</label>
              <div className="field-toggle-row">
                <div className="toggle" onClick={() => setPub(p => !p)}>
                  <div className="toggle-track" style={{ background: pub ? 'var(--c-blue)' : 'var(--c-border)' }}></div>
                  <div className="toggle-thumb" style={{ transform: pub ? 'translateX(16px)' : 'none' }}></div>
                </div>
                <span className="field-toggle-lbl">{pub ? '公開' : '下書き'}</span>
              </div>
            </div>
            <div className="form-actions">
              <button className="btn-primary" type="submit" style={{ width:'auto', padding:'12px 36px' }}>保存</button>
              <button className="btn-secondary" type="button" onClick={() => setPage('dashboard')}>キャンセル</button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

/* ── Tweaks panel ───────────────────────────────────── */
function TweaksPanel({ theme, setTheme, mode, setMode, visible }) {
  if (!visible) return null;
  return (
    <div className="tweaks-wrap">
      <div className="tweaks-card">
        <div className="tweaks-hd">Tweaks</div>
        <div className="tweak-lbl">デザイン方向性</div>
        <div className="tweak-opts">
          {Object.entries(THEME_LABELS).map(([k, label]) => (
            <button key={k} className={`tweak-opt${theme === k ? ' active' : ''}`} onClick={() => setTheme(k)}>{label}</button>
          ))}
        </div>
        <div className="tweak-divider"></div>
        <div className="tweak-lbl">外観</div>
        <div className="tweak-opts">
          <button className={`tweak-opt${mode === 'light' ? ' active' : ''}`} onClick={() => setMode('light')}>ライト</button>
          <button className={`tweak-opt${mode === 'dark' ? ' active' : ''}`} onClick={() => setMode('dark')}>ダーク</button>
        </div>
        <div className="tweak-divider"></div>
        <p className="tweak-note">一覧・詳細・管理すべてに反映されます。ヘッダー右上のアイコンでも切替可。</p>
      </div>
    </div>
  );
}

/* ── App ────────────────────────────────────────────── */
function App() {
  const [page, setPage] = useS('list');
  const [article, setArticle] = useS(null);
  const [editArticle, setEditArticle] = useS(null);
  const [theme, setTheme] = useS(() => localStorage.getItem('cblog-theme') || 'editorial');
  const [mode, setMode] = useS(() => localStorage.getItem('cblog-mode') || 'light');
  const [loggedIn, setLoggedIn] = useS(false);
  const [showTweaks, setShowTweaks] = useS(true);
  const [searchQuery, setSearchQuery] = useS('');
  const [catFilter, setCatFilter] = useS('すべて');

  useE(() => {
    const tokens = buildTokens(theme, mode);
    Object.entries(tokens).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
    document.body.dataset.theme = theme;
    document.body.dataset.mode = mode;
    localStorage.setItem('cblog-theme', theme);
    localStorage.setItem('cblog-mode', mode);
  }, [theme, mode]);

  useE(() => {
    const fn = e => {
      if (e.data?.type === 'tweaks-panel:open') setShowTweaks(true);
      if (e.data?.type === 'tweaks-panel:close') setShowTweaks(false);
    };
    window.addEventListener('message', fn);
    return () => window.removeEventListener('message', fn);
  }, []);

  const handleTheme = newTheme => {
    document.body.style.transition = 'opacity 0.16s ease';
    document.body.style.opacity = '0';
    setTimeout(() => { setTheme(newTheme); document.body.style.opacity = '1'; }, 160);
  };
  const handleCategoryClick = cat => { setCatFilter(cat); setPage('list'); window.scrollTo(0, 0); };
  const toggleMode = () => setMode(m => m === 'dark' ? 'light' : 'dark');

  return (
    <>
      <Header page={page} setPage={setPage} loggedIn={loggedIn}
        searchQuery={searchQuery} onSearch={setSearchQuery}
        onLogout={() => { setLoggedIn(false); setPage('list'); }}
        mode={mode} toggleMode={toggleMode} />
      {page === 'list' && (
        <ArticleListPage key={`${theme}-list`} setPage={setPage} setArticle={setArticle}
          searchQuery={searchQuery} catFilter={catFilter} setCatFilter={setCatFilter} />
      )}
      {page === 'detail' && article && (
        <ArticleDetailPage article={article} setPage={setPage} onCategoryClick={handleCategoryClick} />
      )}
      {page === 'login' && <LoginPage setPage={setPage} setLoggedIn={setLoggedIn} />}
      {page === 'dashboard' && <DashboardPage setPage={setPage} setLoggedIn={setLoggedIn} setEditArticle={setEditArticle} />}
      {page === 'form' && <ArticleFormPage article={editArticle} setPage={setPage} />}
      <TweaksPanel theme={theme} setTheme={handleTheme} mode={mode} setMode={setMode} visible={showTweaks} />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
