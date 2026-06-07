#pragma once

#include <drogon/HttpController.h>

namespace controller {

class CommentController : public drogon::HttpController<CommentController> {
public:
    METHOD_LIST_BEGIN
    ADD_METHOD_TO(CommentController::create, "/posts/{slug}/comments", drogon::Post);
    METHOD_LIST_END

    // POST /posts/{slug}/comments — コメント投稿
    void create(const drogon::HttpRequestPtr &req,
                std::function<void(const drogon::HttpResponsePtr &)> &&callback,
                std::string slug);
};

} // namespace controller
