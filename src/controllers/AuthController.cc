#include "AuthController.h"

#include "services/AuthService.h"

using namespace controller;

namespace {
drogon::HttpResponsePtr renderLogin(bool showError) {
    drogon::HttpViewData data;
    data.insert("title", std::string("ログイン — C-blog"));
    data.insert("error", showError);
    auto resp = drogon::HttpResponse::newHttpViewResponse("views::login", data);
    if (showError) {
        resp->setStatusCode(drogon::k401Unauthorized);
    }
    return resp;
}
}  // namespace

void AuthController::loginPage(
    const drogon::HttpRequestPtr &req,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback) {
    auto session = req->session();
    if (session && session->find("userId")) {
        callback(drogon::HttpResponse::newRedirectionResponse("/admin"));
        return;
    }
    callback(renderLogin(false));
}

void AuthController::loginSubmit(
    const drogon::HttpRequestPtr &req,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback) {
    auto username = req->getParameter("username");
    auto password = req->getParameter("password");

    auto user = service::AuthService::authenticate(username, password);
    if (!user) {
        callback(renderLogin(true));
        return;
    }

    auto session = req->session();
    if (!session) {
        LOG_ERROR << "Session is not enabled";
        callback(renderLogin(true));
        return;
    }
    session->insert("userId", user->id);
    session->insert("username", user->username);
    callback(drogon::HttpResponse::newRedirectionResponse("/admin"));
}

void AuthController::logout(
    const drogon::HttpRequestPtr &req,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback) {
    auto session = req->session();
    if (session) {
        session->erase("userId");
        session->erase("username");
    }
    callback(drogon::HttpResponse::newRedirectionResponse("/"));
}
