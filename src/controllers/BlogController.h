#pragma once

#include <drogon/HttpController.h>

namespace controller {

class BlogController : public drogon::HttpController<BlogController> {
public:
    METHOD_LIST_BEGIN
    ADD_METHOD_TO(BlogController::index, "/", drogon::Get);
    METHOD_LIST_END

    void index(const drogon::HttpRequestPtr &req,
               std::function<void(const drogon::HttpResponsePtr &)> &&callback);
};

} // namespace controller
