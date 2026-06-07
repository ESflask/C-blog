#include "CommentController.h"

#include "services/PostService.h"

using namespace controller;

namespace {
std::string trim(const std::string& s) {
    auto begin = s.find_first_not_of(" \t\r\n");
    if (begin == std::string::npos) return "";
    auto end = s.find_last_not_of(" \t\r\n");
    return s.substr(begin, end - begin + 1);
}
}  // namespace

void CommentController::create(
    const drogon::HttpRequestPtr &req,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback,
    std::string slug) {
    // 公開記事のみコメント可。存在しなければ 404。
    auto post = service::PostService::getBySlug(slug);
    if (!post.found) {
        callback(drogon::HttpResponse::newNotFoundResponse());
        return;
    }

    auto author = trim(req->getParameter("author_name"));
    auto body = trim(req->getParameter("body"));

    // 簡易バリデーション（空・過長を弾く）。本文は raw 保存し、表示側でエスケープする。
    if (!author.empty() && !body.empty() &&
        author.size() <= 60 && body.size() <= 2000) {
        service::PostService::addComment(post.id, author, body);
    }

    callback(drogon::HttpResponse::newRedirectionResponse("/posts/" + slug + "#comments"));
}
