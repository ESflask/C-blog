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

PostDetail PostService::getBySlug(const std::string& slug) {
    PostDetail detail;
    try {
        auto dbClient = drogon::app().getDbClient();
        auto result = dbClient->execSqlSync(
            "SELECT id, title, slug, body, created_at "
            "FROM posts WHERE slug = ? AND published = 1 LIMIT 1",
            slug);
        if (result.empty()) {
            return detail;  // found = false
        }
        const auto& row = result[0];
        detail.found = true;
        detail.id = row["id"].as<int64_t>();
        detail.title = row["title"].as<std::string>();
        detail.slug = row["slug"].as<std::string>();
        detail.body = row["body"].as<std::string>();
        detail.createdAt = row["created_at"].as<std::string>();
        detail.published = true;  // 公開記事のみ取得
    } catch (const std::exception& e) {
        LOG_ERROR << "PostService::getBySlug failed: " << e.what();
        return PostDetail{};
    }
    return detail;
}

std::vector<AdminPost> PostService::listAll() {
    std::vector<AdminPost> posts;
    try {
        auto dbClient = drogon::app().getDbClient();
        auto result = dbClient->execSqlSync(
            "SELECT id, title, slug, published, created_at "
            "FROM posts ORDER BY created_at DESC");
        posts.reserve(result.size());
        for (const auto& row : result) {
            AdminPost p;
            p.id = row["id"].as<int64_t>();
            p.title = row["title"].as<std::string>();
            p.slug = row["slug"].as<std::string>();
            p.published = row["published"].as<int>() != 0;
            p.createdAt = row["created_at"].as<std::string>();
            posts.push_back(std::move(p));
        }
    } catch (const std::exception& e) {
        LOG_ERROR << "PostService::listAll failed: " << e.what();
        return {};
    }
    return posts;
}

PostStats PostService::stats() {
    PostStats s;
    try {
        auto dbClient = drogon::app().getDbClient();
        auto result = dbClient->execSqlSync(
            "SELECT COUNT(*) AS total, "
            "COALESCE(SUM(published), 0) AS pub FROM posts");
        if (!result.empty()) {
            s.total = result[0]["total"].as<int>();
            s.published = result[0]["pub"].as<int>();
            s.draft = s.total - s.published;
        }
    } catch (const std::exception& e) {
        LOG_ERROR << "PostService::stats failed: " << e.what();
    }
    return s;
}

PostDetail PostService::getById(int64_t id) {
    PostDetail detail;
    try {
        auto dbClient = drogon::app().getDbClient();
        auto result = dbClient->execSqlSync(
            "SELECT id, title, slug, body, published, created_at "
            "FROM posts WHERE id = ? LIMIT 1",
            id);
        if (result.empty()) {
            return detail;
        }
        const auto& row = result[0];
        detail.found = true;
        detail.id = row["id"].as<int64_t>();
        detail.title = row["title"].as<std::string>();
        detail.slug = row["slug"].as<std::string>();
        detail.body = row["body"].as<std::string>();
        detail.published = row["published"].as<int>() != 0;
        detail.createdAt = row["created_at"].as<std::string>();
    } catch (const std::exception& e) {
        LOG_ERROR << "PostService::getById failed: " << e.what();
        return PostDetail{};
    }
    return detail;
}

bool PostService::create(const std::string& title, const std::string& slug,
                         const std::string& body, int64_t authorId, bool published) {
    try {
        auto dbClient = drogon::app().getDbClient();
        dbClient->execSqlSync(
            "INSERT INTO posts(title, slug, body, author_id, published) "
            "VALUES(?, ?, ?, ?, ?)",
            title, slug, body, authorId, published ? 1 : 0);
        return true;
    } catch (const std::exception& e) {
        LOG_ERROR << "PostService::create failed: " << e.what();
        return false;
    }
}

bool PostService::update(int64_t id, const std::string& title, const std::string& slug,
                         const std::string& body, bool published) {
    try {
        auto dbClient = drogon::app().getDbClient();
        dbClient->execSqlSync(
            "UPDATE posts SET title = ?, slug = ?, body = ?, published = ?, "
            "updated_at = datetime('now') WHERE id = ?",
            title, slug, body, published ? 1 : 0, id);
        return true;
    } catch (const std::exception& e) {
        LOG_ERROR << "PostService::update failed: " << e.what();
        return false;
    }
}

bool PostService::remove(int64_t id) {
    try {
        auto dbClient = drogon::app().getDbClient();
        dbClient->execSqlSync("DELETE FROM posts WHERE id = ?", id);
        return true;
    } catch (const std::exception& e) {
        LOG_ERROR << "PostService::remove failed: " << e.what();
        return false;
    }
}

bool PostService::setPublished(int64_t id, bool published) {
    try {
        auto dbClient = drogon::app().getDbClient();
        dbClient->execSqlSync(
            "UPDATE posts SET published = ?, updated_at = datetime('now') WHERE id = ?",
            published ? 1 : 0, id);
        return true;
    } catch (const std::exception& e) {
        LOG_ERROR << "PostService::setPublished failed: " << e.what();
        return false;
    }
}

bool PostService::togglePublished(int64_t id) {
    try {
        auto dbClient = drogon::app().getDbClient();
        dbClient->execSqlSync(
            "UPDATE posts SET published = CASE WHEN published = 1 THEN 0 ELSE 1 END, "
            "updated_at = datetime('now') WHERE id = ?",
            id);
        return true;
    } catch (const std::exception& e) {
        LOG_ERROR << "PostService::togglePublished failed: " << e.what();
        return false;
    }
}

std::vector<CommentItem> PostService::listComments(int64_t postId) {
    std::vector<CommentItem> comments;
    try {
        auto dbClient = drogon::app().getDbClient();
        auto result = dbClient->execSqlSync(
            "SELECT author_name, body, created_at FROM comments "
            "WHERE post_id = ? ORDER BY created_at ASC",
            postId);
        comments.reserve(result.size());
        for (const auto& row : result) {
            CommentItem c;
            c.authorName = row["author_name"].as<std::string>();
            c.body = row["body"].as<std::string>();
            c.createdAt = row["created_at"].as<std::string>();
            comments.push_back(std::move(c));
        }
    } catch (const std::exception& e) {
        LOG_ERROR << "PostService::listComments failed: " << e.what();
        return {};
    }
    return comments;
}

} // namespace service
