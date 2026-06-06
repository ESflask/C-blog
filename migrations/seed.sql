-- 初期データ
-- NOTE: password_hash はアプリ側でハッシュ化した値に置き換えること（平文を入れない）。
--       下記はプレースホルダ。scripts/init_db.sh では投入しない想定。
INSERT OR IGNORE INTO users (username, password_hash)
VALUES ('admin', 'REPLACE_WITH_HASHED_PASSWORD');

INSERT OR IGNORE INTO tags (name, slug) VALUES
  ('お知らせ', 'news'),
  ('技術',     'tech'),
  ('日記',     'diary');
