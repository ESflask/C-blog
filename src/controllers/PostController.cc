#include "PostController.h"

#include "services/PostService.h"

using namespace controller;

void PostController::detail(
    const drogon::HttpRequestPtr &req,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback,
    std::string slug) {
    auto post = service::PostService::getBySlug(slug);
    if (!post.found) {
        callback(drogon::HttpResponse::newNotFoundResponse());
        return;
    }

    auto comments = service::PostService::listComments(post.id);

    drogon::HttpViewData data;
    data.insert("title", post.title + " — C-blog");
    data.insert("post", post);
    data.insert("comments", comments);

    // ビューは views 名前空間に生成される（views/post_detail.csp）。
    auto resp = drogon::HttpResponse::newHttpViewResponse("views::post_detail", data);
    callback(resp);
}
