#pragma once
#include <cstdint>
#include <string>
#include <vector>

namespace service {

struct PostSummary {
    int64_t id;
    std::string title;
    std::string slug;
    std::string excerpt;    // 本文先頭の抜粋（カード表示用）
    std::string createdAt;
};

// 記事詳細。found=false の場合は該当記事なし。
struct PostDetail {
    bool found = false;
    int64_t id = 0;
    std::string title;
    std::string slug;
    std::string body;
    std::string createdAt;
    bool published = false;
};

struct CommentItem {
    std::string authorName;
    std::string body;
    std::string createdAt;
};

// 管理画面の一覧行（下書きも含む）。
struct AdminPost {
    int64_t id = 0;
    std::string title;
    std::string slug;
    std::string createdAt;
    bool published = false;
};

struct PostStats {
    int total = 0;
    int published = 0;
    int draft = 0;
};

class PostService {
public:
    // 公開済み(published=1)の記事を created_at 降順で返す。
    // DBエラー時は空ベクタを返す（例外を投げない）。
    static std::vector<PostSummary> listPublished();

    // slug で公開済み記事を1件取得。なければ found=false。
    static PostDetail getBySlug(const std::string& slug);

    // 指定記事のコメントを古い順で返す。
    static std::vector<CommentItem> listComments(int64_t postId);

    // コメントを追加する。
    static bool addComment(int64_t postId, const std::string& authorName,
                           const std::string& body);

    // ── 管理用（下書きも対象） ─────────────────────────
    static std::vector<AdminPost> listAll();
    static PostStats stats();
    static PostDetail getById(int64_t id);   // 公開状態に関わらず取得
    static bool create(const std::string& title, const std::string& slug,
                       const std::string& body, int64_t authorId, bool published);
    static bool update(int64_t id, const std::string& title, const std::string& slug,
                       const std::string& body, bool published);
    static bool remove(int64_t id);
    static bool setPublished(int64_t id, bool published);
    static bool togglePublished(int64_t id);  // published を反転
};

} // namespace service
