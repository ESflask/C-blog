# My C++ Blog

C++ (Drogon) + SQLite で作るサーバーサイドレンダリング型のブログサイト。

## 必要環境

- C++17 対応コンパイラ（clang / gcc）
- CMake >= 3.16
- [Drogon](https://github.com/drogonframework/drogon)
- SQLite3

### macOS (Homebrew)

```bash
brew install drogon sqlite cmake
```

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

## ディレクトリ構成 / 設計

詳細は [CLAUDE.md](./CLAUDE.md) を参照。

## 開発の流れ

1. `migrations/` に SQL を追加してスキーマを変更
2. `./scripts/init_db.sh` で DB を更新
3. `./scripts/gen_model.sh` で ORM モデルを再生成
4. `src/services/`・`src/controllers/`・`views/` を実装
5. `./scripts/build.sh` でビルドして確認
