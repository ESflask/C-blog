#include "BlogController.h"

#include "services/PostService.h"

using namespace controller;

void BlogController::index(
    const drogon::HttpRequestPtr &req,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback) {
    auto posts = service::PostService::listPublished();

    drogon::HttpViewData data;
    data.insert("title", std::string("My C++ Blog"));
    data.insert("posts", posts);

    // ビューは名前空間 views に生成されるため "views::index" で参照する。
    auto resp = drogon::HttpResponse::newHttpViewResponse("views::index", data);
    callback(resp);
}
