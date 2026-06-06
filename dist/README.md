# C-blog フロントエンド（Minimal / Claude オレンジ）

このフォルダは C-blog（Drogon + SQLite）に組み込むためのフロントエンド一式です。
デザインは **Minimal**（セリフ細字・余白多め・角丸なし）、**ライト/ダーク両対応**、アクセントは **Claude 系のオレンジ**。

## 中身

```
dist/
├── static/
│   ├── css/style.css     ← /css/style.css として配信（リポジトリの static/css/ に置換）
│   └── js/app.js         ← /js/app.js として配信（static/js/ に置換）
└── views/
    ├── layout.csp        ← そのまま views/layout.csp に置換可（[[title]] / <%view content%> 形式）
    ├── index.html        ← 記事一覧（content 部分を index.csp へ）
    ├── post_detail.html  ← 記事詳細＋コメント（post_detail.csp へ）
    ├── post_form.html    ← 記事作成/編集（post_form.csp へ）
    ├── login.html        ← ログイン（login.csp へ）
    └── admin.html        ← 管理ダッシュボード（admin.csp へ）
```

`views/*.html` はブラウザでそのまま開いて確認できます（相対パスで css/js を読み込み）。
各ファイルは `<!-- ▼▼ ... ▼▼ -->` コメントで **layout 部分（共通ヘッダ/フッタ）** と
**content 部分（個別 .csp に入れる中身）** を区切ってあります。

## Drogon CSP への組み込み手順

1. `static/css/style.css` と `static/js/app.js` をリポジトリの `static/` に上書き。
2. `views/layout.csp` を置換（または既存にヘッダ/フッタ/フォント/JS 読み込みをマージ）。
3. 各 `*.html` の **content 部分だけ** を対応する `views/*.csp` に貼り、
   デモのベタ書きデータを実データのループに置換：

   ```cpp
   <%c++ auto posts = @@.get<std::vector<HttpViewData>>("posts"); %>
   <%c++ for (auto &p : posts) { %>
     <a class="article-card" href="/posts/[[ p.slug ]]"> ... </a>
   <%c++ } %>
   ```

   ※ 変数出力はプロジェクトの作法（`[[ ]]`）に合わせてください。HTML エスケープに注意。

## 仕組みのポイント

- **テーマ切替不要のサーバー実装**：色・フォントは CSS 変数。`<body>` の `data-theme="minimal"`
  と `data-mode`（light/dark）だけで決まります。サーバーは固定で出力すれば OK。
- **ダークモード**：`app.js` が `localStorage` を読んで `<body data-mode>` を切替（右上アイコン）。
- **コードハイライト**：サーバーは素の `<pre><code>…</code></pre>` を返すだけ。
  `app.js` が読み込み時に C++ ハイライト＋行番号＋ファイル名バー＋コピーボタンへ自動昇格します。
  ファイル名/言語を出したい場合は `<code data-file="BlogController.cc" data-lang="C++">` を付与。
  （Markdown→HTML 変換のコードブロックにそのまま効きます）
- **公開トグル/削除**：`app.js` の `initAdmin()` は見た目だけ切替。実際は
  `fetch('/admin/posts/<id>/toggle', {method:'POST'})` 等に置き換えてください。

## カスタマイズ

- オレンジの濃さ：`style.css` の `:root` の `--c-blue`（主役色）/ `--c-gold`（補助）と、
  ダークは `body[data-mode="dark"]` ブロックを調整。
- 別スタイルに戻したい場合：`data-theme` を `editorial` / `modern` にすると、
  既存の override ルールで見出しフォントやカード枠の出方が変わります（Minimal 前提で調整済み）。
