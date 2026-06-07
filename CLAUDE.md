# CLAUDE.md

このファイルは [Claude Code](https://claude.com/claude-code) エージェントがこのリポジトリで一貫した作業をするためのガイドです。

## Claude Codeの口調への要項
- **敬語なし、ラフな口調でOKです。**

## プロジェクト概要

C++ 製のブログサイト。記事の投稿・閲覧・コメント表示・タグ付け・管理者ログインを備えた、
サーバーサイドレンダリング型の Web アプリケーション。

公開側（記事一覧・記事詳細）と管理側（ログイン・ダッシュボード・記事 CRUD・公開トグル）が
動作する状態。DB アクセスは現状 ORM ではなく `PostService` / `AuthService` 内の生 SQL
（`execSqlSync`）で実装している。

### 技術スタック

| 項目 | 採用技術 | 備考 |
| --- | --- | --- |
| 言語 | C++17 | Drogon の要求に合わせる |
| Web フレームワーク | [Drogon](https://github.com/drogonframework/drogon) | 非同期 HTTP、ORM、CSP テンプレート、セッション、JWT を内蔵 |
| データベース | SQLite3 | ファイルベース（`blog.db`）。DB アクセスは現状 ORM 未使用で生 SQL（`execSqlSync`） |
| ビュー | Drogon CSP テンプレート (`.csp`) | サーバーサイドで HTML を生成 |
| ビルド | CMake (>= 3.16) | |
| テスト | drogon_test / Google Test | |
| コンテナ | Docker / docker-compose | 任意 |

## ディレクトリ構成

凡例: ✅=実装済み / 🔲=未作成（今後の予定）

```
C++project/
├── CLAUDE.md                # このファイル
├── README.md                # セットアップ手順
├── CMakeLists.txt           # ビルド定義（ルート）
├── config.json              # Drogon 実行時設定（ポート/DB/ログ/スレッド）
├── .gitignore
├── cmake/                   # CMake 補助モジュール（現状空）
├── src/
│   ├── main.cc              # ✅ エントリポイント（config 読込→既定admin保証→run）
│   ├── controllers/         # HTTP ルーティング層（リクエスト処理）
│   │   ├── BlogController.{h,cc}    # ✅ 記事一覧（GET /）
│   │   ├── PostController.{h,cc}    # ✅ 記事詳細＋コメント表示（GET /posts/{slug}）
│   │   ├── AuthController.{h,cc}    # ✅ ログイン/ログアウト（/login, /logout）
│   │   └── AdminController.{h,cc}   # ✅ 管理ダッシュボード＋記事CRUD（/admin/*）
│   ├── services/           # ビジネスロジック層（生SQL / execSqlSync）
│   │   ├── PostService.{h,cc}       # ✅ 記事の取得/作成/更新/削除/公開トグル, コメント取得
│   │   └── AuthService.{h,cc}       # ✅ パスワードハッシュ/認証/既定admin生成
│   ├── filters/
│   │   └── LoginFilter.{h,cc}       # ✅ 管理ページの認証ガード（filter::LoginFilter）
│   ├── models/             # 🔲 ORM モデル（drogon_ctl 生成）— 現状は生SQLのため未使用
│   └── utils/              # 🔲 Markdown 変換 / Slug 生成 — 未作成
├── views/                  # CSP テンプレート（ビルド時に C++ へ変換）
│   ├── layout.csp          # ✅ 共通レイアウト（ヘッダ/フッタ）
│   ├── index.csp           # ✅ 記事一覧
│   ├── post_detail.csp     # ✅ 記事詳細＋コメント
│   ├── post_form.csp       # ✅ 記事作成/編集フォーム
│   ├── login.csp           # ✅ ログイン
│   └── admin.csp           # ✅ 管理ダッシュボード
├── static/                 # 静的ファイル（Drogon が直接配信）
│   ├── css/style.css       # ✅ Minimal デザイン
│   ├── js/app.js           # ✅ ダーク切替/コードハイライト/読了バー
│   └── index.html          # ✅ 暫定トップ（/index.html でアクセス）
├── dist/                   # 参考: 移植元のデザイン雛形（views/*.html）
├── migrations/             # DB スキーマとシード
│   ├── 001_init.sql        # ✅ テーブル定義
│   └── seed.sql            # ✅ 初期データ（タグ等。admin はアプリ側で生成）
├── tests/                  # 🔲 単体/統合テスト（CMakeLists のみ。中身はプレースホルダ）
│   └── CMakeLists.txt
├── scripts/                # 補助スクリプト
│   ├── build.sh            # ✅ cmake 設定→ビルド
│   ├── init_db.sh          # ✅ SQLite DB 初期化（migrations 適用）
│   └── gen_model.sh        # drogon_ctl によるモデル生成（ORM 採用時に使用）
└── docker/                 # 🔲 Dockerfile / docker-compose.yml — 未作成
```

## アーキテクチャ（レイヤ）

```
HTTP リクエスト
    ↓
Filters (認証など)  ← src/filters/
    ↓
Controllers (ルーティング/入出力)  ← src/controllers/
    ↓
Services (ビジネスロジック / DB アクセス)  ← src/services/
    ↓
SQLite（現状 生SQL execSqlSync。ORM モデルは未導入）
```

- **Controller** はリクエストの受付・バリデーション・レスポンス生成に専念し、ロジックは **Service** に委譲する。
- **Service** が DB を操作し、ドメインロジックを実装する。現状は ORM モデルを使わず
  `drogon::app().getDbClient()->execSqlSync(...)` で生 SQL を実行する（将来 ORM 化する場合は
  `src/models/` を `gen_model.sh` で生成して差し替える）。
- **View (.csp)** は Service/Controller から渡されたデータを描画するだけにする（ロジックを持たせない）。

## データモデル

- `users` — 管理者ユーザ（id, username, password_hash, created_at）
- `posts` — 記事（id, title, slug, body, author_id, published, created_at, updated_at）
- `comments` — コメント（id, post_id, author_name, body, created_at）※表示のみ実装。投稿は未実装
- `tags` — タグ（id, name, slug）※テーブル/シードのみ。記事への紐付け UI は未実装
- `post_tags` — 記事とタグの中間テーブル（post_id, tag_id）※未使用

詳細な DDL は `migrations/001_init.sql` を参照。

## よく使うコマンド

```bash
# 依存（macOS / Homebrew）
brew install drogon sqlite

# DB 初期化（migrations を適用）
./scripts/init_db.sh

# ビルド
./scripts/build.sh          # 内部で cmake -S . -B build && cmake --build build

# 実行（config.json を読み込む。admin パスワードと pepper は環境変数で）
CBLOG_ADMIN_PASSWORD='...' CBLOG_PEPPER='...' ./build/blog_app

# 再起動前に古いプロセスを終了（8080 を掴んだままだとバインド失敗する）
pkill -f 'build/blog_app'

# ORM モデル生成（将来 ORM 化する場合のみ）
./scripts/gen_model.sh      # drogon_ctl create model <out_dir>
```

開発サーバはデフォルトで http://localhost:8080 で起動する（`config.json` で変更）。
既定の管理者 `admin` は初回起動時に自動生成される（パスワードは `CBLOG_ADMIN_PASSWORD`、未指定なら `admin`）。

## 作業の進め方

ただし3体のモデルに分割し、それぞれにタスクを割り当てて。終わり次第一つの知能に統合して。

## 規約・方針

- **C++17** を使用。例外より Drogon のコールバック/`Task<>` を優先。
- ファイル名は Drogon の慣習に合わせ、コントローラ/モデルは `PascalCase`、その他は用途に応じて統一。
- DB スキーマ変更は必ず `migrations/` に SQL を追加する。ORM を導入する場合はモデルを
  `gen_model.sh` で再生成する（モデルは手書きしない）。現状は ORM 未使用で `services/` の生 SQL。
- 機密情報（ハッシュ用 pepper、admin パスワード）は `config.json` ではなく環境変数で渡す
  （`CBLOG_PEPPER` / `CBLOG_ADMIN_PASSWORD`）。`config.json`・`seed.sql` にはプレースホルダのみ置く。
- パスワードは平文保存せず、`salt$sha256(salt:password:pepper)` 形式で `password_hash` に格納する
  （`AuthService::hashPassword` / `checkPassword`）。
- `views/*.csp` にビジネスロジックを書かない。

## ハマりどころ / 運用メモ

実装中に踏んだ問題と対処（再発防止）:

- **ビュークラス名 `index` が POSIX `index()`(`<strings.h>`) と衝突**してビルド失敗
  （`DrTemplate<index>` が型ではなく関数と解決される）。対処: `CMakeLists.txt` の
  `drogon_create_views(... TRUE)` で path-to-namespace を有効にし、`views/` から
  名前空間 `views` を導出（クラスは `views::index`）。コントローラ側は
  `newHttpViewResponse("views::index", data)` と名前空間付きで参照する。
- **コントローラ vs 静的ファイルの優先順位**: 登録済みコントローラは静的ファイル
  （implicit index.html を含む）より優先される。よって `/` は BlogController が処理し、
  静的トップは `/index.html` で別途アクセス可能。`setImplicitPageEnable(false)` は不要。
- **古い `blog_app` プロセスが 8080 を掴んだまま**だと、再ビルドした新バイナリは
  バインド失敗で即終了し、リクエストは古いプロセスに当たって「ルート未登録のように
  見える 404」が出る。再起動前に必ず終了させること:
  `pkill -f 'build/blog_app'`（または `lsof -i :8080`）。
- **セッションはコードで有効化する**: `config.json` の `session` ブロックだけでは
  有効にならず `req->session()` が null になりクラッシュした。`main.cc` で
  `drogon::app().enableSession(秒)` を呼ぶこと。Filter は `session &&` でガード済。
- **新規ファイル追加後は CMake 再構成が必要**: `file(GLOB_RECURSE)` は configure 時評価のため、
  `.cc`/`.csp` を追加したら `cmake -S . -B build` を実行してから `cmake --build build`。

## 進捗

実装済み:
- [x] `migrations/001_init.sql` の DDL（users/posts/comments/tags/post_tags）＋ `seed.sql`（タグ）
- [x] `services/PostService.{h,cc}`（記事の一覧/詳細/作成/更新/削除/公開トグル、コメント取得。生SQL）
- [x] `services/AuthService.{h,cc}`（パスワードハッシュ・認証・既定 admin 自動生成）
- [x] `controllers/BlogController` + `views/index.csp`（`GET /` 記事一覧）
- [x] `controllers/PostController` + `views/post_detail.csp`（`GET /posts/{slug}` 記事詳細＋コメント表示）
- [x] `controllers/CommentController`（`POST /posts/{slug}/comments` コメント投稿＋バリデーション＋保存）
- [x] `utils/Html.h`（`escapeHtml`）＋コメント出力のエスケープ（保存型 XSS 対策）
- [x] `controllers/AuthController` + `views/login.csp`（`/login`・`/logout`、セッション認証）
- [x] `controllers/AdminController` + `views/admin.csp` / `post_form.csp`（`/admin/*` ダッシュボード＋記事 CRUD＋公開トグル）
- [x] `filters/LoginFilter`（`/admin/*` の認証ガード）
- [x] **UI**: Minimal デザイン（`static/css/style.css` + `static/js/app.js`）。`app.js` が
      クライアント側でダーク切替・コードハイライト・読了バーを担当。デザイン原本は `dist/`（参考）。

今後の実装対象:
- [ ] `{% %}` 出力の HTML エスケープ全面化（コメントは対応済。title/excerpt/body 等は未対応）
- [ ] タグの記事への紐付け UI（`tags`/`post_tags` はテーブルのみ）
- [ ] 記事本文の Markdown→HTML 変換（`utils/Markdown`）
- [ ] ORM モデル生成（drogon_ctl。現状 services は生 SQL）
- [ ] テスト整備（`tests/` は現状プレースホルダ）
- [ ] Docker 化（`docker/` は現状空）
