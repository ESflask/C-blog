# CLAUDE.md

このファイルは [Claude Code](https://claude.com/claude-code) がこのリポジトリで作業する際のガイドです。

## プロジェクト概要

C++ 製のブログサイト。記事の投稿・閲覧・コメント・タグ付け・管理者ログインを備えた、
サーバーサイドレンダリング型の Web アプリケーション。

### 技術スタック

| 項目 | 採用技術 | 備考 |
| --- | --- | --- |
| 言語 | C++17 | Drogon の要求に合わせる |
| Web フレームワーク | [Drogon](https://github.com/drogonframework/drogon) | 非同期 HTTP、ORM、CSP テンプレート、セッション、JWT を内蔵 |
| データベース | SQLite3 | ファイルベース。将来 PostgreSQL へ移行可能（Drogon の ORM が吸収） |
| ビュー | Drogon CSP テンプレート (`.csp`) | サーバーサイドで HTML を生成 |
| ビルド | CMake (>= 3.16) | |
| テスト | drogon_test / Google Test | |
| コンテナ | Docker / docker-compose | 任意 |

## ディレクトリ構成

```
C++project/
├── CLAUDE.md                # このファイル
├── README.md                # セットアップ手順
├── CMakeLists.txt           # ビルド定義（ルート）
├── config.json              # Drogon 実行時設定（ポート/DB/ログ/スレッド）
├── .gitignore
├── cmake/                   # CMake 補助モジュール（FindXxx 等）
├── src/
│   ├── main.cc              # エントリポイント（config.json 読み込み→run）
│   ├── controllers/         # HTTP ルーティング層（リクエスト処理）
│   │   ├── BlogController.{h,cc}    # 記事一覧・詳細（公開ページ）
│   │   ├── PostController.{h,cc}    # 記事の作成/編集/削除
│   │   ├── CommentController.{h,cc} # コメント投稿
│   │   ├── AuthController.{h,cc}    # ログイン/ログアウト
│   │   └── AdminController.{h,cc}   # 管理ダッシュボード
│   ├── models/             # ORM モデル（drogon_ctl が自動生成）
│   │   ├── Posts.{h,cc}
│   │   ├── Users.{h,cc}
│   │   ├── Comments.{h,cc}
│   │   └── Tags.{h,cc}
│   ├── services/           # ビジネスロジック層（コントローラから分離）
│   │   ├── PostService.{h,cc}
│   │   └── AuthService.{h,cc}
│   ├── filters/            # ミドルウェア（認証チェック等）
│   │   └── LoginFilter.{h,cc}      # 管理ページの認証ガード
│   └── utils/
│       ├── Markdown.{h,cc}         # 記事本文の Markdown→HTML 変換
│       └── Slug.{h,cc}             # URL スラッグ生成
├── views/                  # CSP テンプレート（HTML 生成）
│   ├── layout.csp          # 共通レイアウト（ヘッダ/フッタ）
│   ├── index.csp           # 記事一覧
│   ├── post_detail.csp     # 記事詳細＋コメント
│   ├── post_form.csp       # 記事作成/編集フォーム
│   ├── login.csp           # ログイン
│   └── admin.csp           # 管理ダッシュボード
├── static/                 # 静的ファイル（Drogon が直接配信）
│   ├── css/style.css
│   ├── js/app.js
│   └── images/
├── migrations/             # DB スキーマとシード
│   ├── 001_init.sql        # テーブル定義
│   └── seed.sql            # 初期データ（管理者ユーザ等）
├── tests/                  # 単体/統合テスト
│   └── CMakeLists.txt
├── scripts/                # 補助スクリプト
│   ├── build.sh            # cmake 設定→ビルド
│   ├── init_db.sh          # SQLite DB 初期化（migrations 適用）
│   └── gen_model.sh        # drogon_ctl によるモデル生成
└── docker/
    ├── Dockerfile
    └── docker-compose.yml
```

## アーキテクチャ（レイヤ）

```
HTTP リクエスト
    ↓
Filters (認証など)  ← src/filters/
    ↓
Controllers (ルーティング/入出力)  ← src/controllers/
    ↓
Services (ビジネスロジック)  ← src/services/
    ↓
Models (ORM / DB アクセス)  ← src/models/
    ↓
SQLite
```

- **Controller** はリクエストの受付・バリデーション・レスポンス生成に専念し、ロジックは **Service** に委譲する。
- **Service** は ORM モデルを使って DB を操作し、ドメインロジックを実装する。
- **View (.csp)** は Service/Controller から渡されたデータを描画するだけにする（ロジックを持たせない）。

## データモデル（初期案）

- `users` — 管理者ユーザ（id, username, password_hash, created_at）
- `posts` — 記事（id, title, slug, body, author_id, published, created_at, updated_at）
- `comments` — コメント（id, post_id, author_name, body, created_at）
- `tags` — タグ（id, name, slug）
- `post_tags` — 記事とタグの中間テーブル（post_id, tag_id）

詳細な DDL は `migrations/001_init.sql` を参照。

## よく使うコマンド

```bash
# 依存（macOS / Homebrew）
brew install drogon sqlite

# DB 初期化（migrations を適用）
./scripts/init_db.sh

# ビルド
./scripts/build.sh          # 内部で cmake -S . -B build && cmake --build build

# 実行（config.json を読み込む）
./build/blog_app

# ORM モデル生成（テーブル変更後）
./scripts/gen_model.sh      # drogon_ctl create model <out_dir>
```

開発サーバはデフォルトで http://localhost:8080 で起動する（`config.json` で変更）。

## 規約・方針

- **C++17** を使用。例外より Drogon のコールバック/`Task<>` を優先。
- ファイル名は Drogon の慣習に合わせ、コントローラ/モデルは `PascalCase`、その他は用途に応じて統一。
- DB スキーマ変更は必ず `migrations/` に SQL を追加し、`Posts.{h,cc}` 等のモデルを `gen_model.sh` で再生成する（モデルは手書きしない）。
- 機密情報（パスワードハッシュのソルト、JWT 秘密鍵）は `config.json` ではなく環境変数で渡し、`config.json` にはプレースホルダのみ置く。
- パスワードは平文保存せず、ハッシュ化（bcrypt 等）して `password_hash` に格納する。
- `views/*.csp` にビジネスロジックを書かない。

## まだ未実装（このリポジトリは初期スキャフォールド段階）

現時点ではディレクトリ構成と設定ファイルの骨格のみ。以下は今後の実装対象：
- [ ] `migrations/001_init.sql` の DDL 確定
- [ ] ORM モデル生成
- [ ] 各 Controller / Service の実装
- [ ] CSP テンプレートの実装
- [ ] 認証（ログイン/セッション or JWT）
- [ ] テスト整備
