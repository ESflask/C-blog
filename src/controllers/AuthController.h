#pragma once

#include <drogon/HttpController.h>

namespace controller {

class AuthController : public drogon::HttpController<AuthController> {
public:
    METHOD_LIST_BEGIN
    ADD_METHOD_TO(AuthController::loginPage, "/login", drogon::Get);
    ADD_METHOD_TO(AuthController::loginSubmit, "/login", drogon::Post);
    ADD_METHOD_TO(AuthController::logout, "/logout", drogon::Post);
    METHOD_LIST_END

    void loginPage(const drogon::HttpRequestPtr &req,
                   std::function<void(const drogon::HttpResponsePtr &)> &&callback);
    void loginSubmit(const drogon::HttpRequestPtr &req,
                     std::function<void(const drogon::HttpResponsePtr &)> &&callback);
    void logout(const drogon::HttpRequestPtr &req,
                std::function<void(const drogon::HttpResponsePtr &)> &&callback);
};

} // namespace controller
