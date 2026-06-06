#!/usr/bin/env bash
# drogon_ctl を使って config.json の DB 定義から ORM モデルを生成する。
# 生成先は src/models/。テーブル変更後に実行すること。
set -euo pipefail

cd "$(dirname "$0")/.."

# drogon_ctl は同じディレクトリの model.json (もしくは config.json) を参照する。
# 詳細: https://drogon.docsforge.com/master/orm/
drogon_ctl create model src/models

echo "Models generated under src/models/"
