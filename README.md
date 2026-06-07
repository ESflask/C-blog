# My C++ Blog


このプロジェクトは、**C++ (フレームワークは Drogon) + SQLite を用いた** サーバーサイドレンダリング型のブログサイトです。
記事の一覧・詳細表示、管理画面からの記事 CRUD（作成 / 編集 / 削除 / 公開トグル）、
管理者ログイン（セッション）を備えています。

## 必要環境

- C++17 対応コンパイラ（clang / gcc）
- CMake >= 3.16
- [Drogon](https://github.com/drogonframework/drogon)
- SQLite3

### macOS (Homebrew)

```bash
brew install drogon sqlite cmake
```

> `brew install drogon` で jsoncpp など必要な依存も一緒に入ります。

## セットアップ

```bash
# 1. DB を初期化（migrations を適用）
./scripts/init_db.sh

# 2. ビルド
./scripts/build.sh

# 3. 実行
./build/blog_app
```

起動後、http://localhost:8080 にアクセス（ポートは `config.json` で変更可）。

### 管理者ログイン

管理者ユーザ（`admin`）は**初回起動時に自動生成**されます（`registerBeginningAdvice`）。
パスワードは環境変数で指定し、未指定なら `admin` になります。

```bash
# パスワードとハッシュ用 pepper（秘密鍵）を環境変数で渡して起動
CBLOG_ADMIN_PASSWORD='your-strong-password' \
CBLOG_PEPPER='your-secret-pepper' \
./build/blog_app
```

- ログイン: http://localhost:8080/login （`admin` / 上記パスワード）
- 管理ダッシュボード: http://localhost:8080/admin

> パスワードは平文保存せず、`salt$sha256(salt:password:pepper)` 形式で `users.password_hash`
> に格納されます。本番では必ず `CBLOG_PEPPER` を設定してください。

## 主なルート

| メソッド | パス | 説明 |
| --- | --- | --- |
| GET | `/` | 公開記事の一覧 |
| GET | `/posts/{slug}` | 記事詳細＋コメント表示 |
| GET / POST | `/login` | ログインフォーム / 認証 |
| POST | `/logout` | ログアウト |
| GET | `/admin` | 管理ダッシュボード（要ログイン） |
| GET | `/admin/posts/new` | 記事作成フォーム |
| POST | `/admin/posts` | 記事作成 |
| GET | `/admin/posts/{id}/edit` | 記事編集フォーム |
| POST | `/admin/posts/{id}` | 記事更新 |
| POST | `/admin/posts/{id}/delete` | 記事削除 |
| POST | `/admin/posts/{id}/toggle` | 公開 / 非公開トグル |

`/admin/*` は `LoginFilter` で認証ガードされています。

## ディレクトリ構成 / 設計

詳細は [CLAUDE.md](./CLAUDE.md) を参照。

## 開発の流れ

1. `migrations/` に SQL を追加してスキーマを変更
2. `./scripts/init_db.sh` で DB を更新
3. `src/services/`・`src/controllers/`・`views/` を実装
   （現状 DB アクセスは ORM ではなく `PostService` 内の生 SQL `execSqlSync`）
4. `./scripts/build.sh` でビルドして確認

> CSP ビュー（`views/*.csp`）はビルド時に `drogon_create_views` で C++ へ変換されます。
> 古いプロセスが 8080 を掴んでいると再起動に失敗するため、`pkill -f 'build/blog_app'` で
> 終了させてからビルド / 起動してください。
