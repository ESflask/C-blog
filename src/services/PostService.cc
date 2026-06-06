#include "PostService.h"
#include <drogon/drogon.h>

namespace service {

std::vector<PostSummary> PostService::listPublished() {
    std::vector<PostSummary> posts;
    try {
        auto dbClient = drogon::app().getDbClient();
        auto result = dbClient->execSqlSync(
            "SELECT id, title, slug, substr(body, 1, 140) AS excerpt, created_at "
            "FROM posts WHERE published = 1 ORDER BY created_at DESC");
        posts.reserve(result.size());
        for (const auto& row : result) {
            PostSummary summary;
            summary.id = row["id"].as<int64_t>();
            summary.title = row["title"].as<std::string>();
            summary.slug = row["slug"].as<std::string>();
            summary.excerpt = row["excerpt"].as<std::string>();
            summary.createdAt = row["created_at"].as<std::string>();
            posts.push_back(std::move(summary));
        }
    } catch (const std::exception& e) {
        LOG_ERROR << "PostService::listPublished failed: " << e.what();
        return {};
    }
    return posts;
}

} // namespace service
