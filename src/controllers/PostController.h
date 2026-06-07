#pragma once

#include <drogon/HttpController.h>

namespace controller {

class PostController : public drogon::HttpController<PostController> {
public:
    METHOD_LIST_BEGIN
    ADD_METHOD_TO(PostController::detail, "/posts/{slug}", drogon::Get);
    METHOD_LIST_END

    // GET /posts/{slug} — 記事詳細＋コメント
    void detail(const drogon::HttpRequestPtr &req,
                std::function<void(const drogon::HttpResponsePtr &)> &&callback,
                std::string slug);
};

} // namespace controller
