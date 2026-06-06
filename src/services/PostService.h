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

class PostService {
public:
    // 公開済み(published=1)の記事を created_at 降順で返す。
    // DBエラー時は空ベクタを返す（例外を投げない）。
    static std::vector<PostSummary> listPublished();
};

} // namespace service
