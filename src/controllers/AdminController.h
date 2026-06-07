#pragma once

#include <drogon/HttpController.h>

namespace controller {

// すべて LoginFilter で保護（未認証は /login へ）。
class AdminController : public drogon::HttpController<AdminController> {
public:
    METHOD_LIST_BEGIN
    ADD_METHOD_TO(AdminController::dashboard, "/admin", drogon::Get, "filter::LoginFilter");
    ADD_METHOD_TO(AdminController::newForm, "/admin/posts/new", drogon::Get, "filter::LoginFilter");
    ADD_METHOD_TO(AdminController::create, "/admin/posts", drogon::Post, "filter::LoginFilter");
    ADD_METHOD_TO(AdminController::editForm, "/admin/posts/{id}/edit", drogon::Get, "filter::LoginFilter");
    ADD_METHOD_TO(AdminController::update, "/admin/posts/{id}", drogon::Post, "filter::LoginFilter");
    ADD_METHOD_TO(AdminController::remove, "/admin/posts/{id}/delete", drogon::Post, "filter::LoginFilter");
    ADD_METHOD_TO(AdminController::toggle, "/admin/posts/{id}/toggle", drogon::Post, "filter::LoginFilter");
    METHOD_LIST_END

    void dashboard(const drogon::HttpRequestPtr &req,
                   std::function<void(const drogon::HttpResponsePtr &)> &&callback);
    void newForm(const drogon::HttpRequestPtr &req,
                 std::function<void(const drogon::HttpResponsePtr &)> &&callback);
    void create(const drogon::HttpRequestPtr &req,
                std::function<void(const drogon::HttpResponsePtr &)> &&callback);
    void editForm(const drogon::HttpRequestPtr &req,
                  std::function<void(const drogon::HttpResponsePtr &)> &&callback,
                  int64_t id);
    void update(const drogon::HttpRequestPtr &req,
                std::function<void(const drogon::HttpResponsePtr &)> &&callback,
                int64_t id);
    void remove(const drogon::HttpRequestPtr &req,
                std::function<void(const drogon::HttpResponsePtr &)> &&callback,
                int64_t id);
    void toggle(const drogon::HttpRequestPtr &req,
                std::function<void(const drogon::HttpResponsePtr &)> &&callback,
                int64_t id);
};

} // namespace controller
