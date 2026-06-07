#include "AdminController.h"

#include "services/PostService.h"

#include <cctype>

using namespace controller;

namespace {

// 入力 slug が空のときのフォールバック生成（ASCII 英数を基本に簡易化）。
std::string slugify(const std::string& title) {
    std::string out;
    bool prevDash = false;
    for (unsigned char ch : title) {
        if (std::isalnum(ch)) {
            out += static_cast<char>(std::tolower(ch));
            prevDash = false;
        } else if (!prevDash && !out.empty()) {
            out += '-';
            prevDash = true;
        }
    }
    while (!out.empty() && out.back() == '-') out.pop_back();
    if (out.empty()) out = "post";
    return out;
}

bool paramTrue(const drogon::HttpRequestPtr& req, const std::string& key) {
    return req->getParameter(key) == "1";
}

}  // namespace

void AdminController::dashboard(
    const drogon::HttpRequestPtr &req,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback) {
    drogon::HttpViewData data;
    data.insert("title", std::string("記事管理 — C-blog"));
    data.insert("posts", service::PostService::listAll());
    data.insert("stats", service::PostService::stats());
    callback(drogon::HttpResponse::newHttpViewResponse("views::admin", data));
}

void AdminController::newForm(
    const drogon::HttpRequestPtr &req,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback) {
    service::PostDetail blank;
    blank.published = true;  // 新規は既定で公開
    drogon::HttpViewData data;
    data.insert("title", std::string("新規記事作成 — C-blog"));
    data.insert("isEdit", false);
    data.insert("post", blank);  // 空フォーム
    callback(drogon::HttpResponse::newHttpViewResponse("views::post_form", data));
}

void AdminController::create(
    const drogon::HttpRequestPtr &req,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback) {
    auto title = req->getParameter("title");
    auto slug = req->getParameter("slug");
    auto body = req->getParameter("body");
    bool published = paramTrue(req, "published");
    if (slug.empty()) slug = slugify(title);

    int64_t authorId = 1;
    auto session = req->session();
    if (session && session->find("userId")) {
        authorId = session->get<int64_t>("userId");
    }

    service::PostService::create(title, slug, body, authorId, published);
    callback(drogon::HttpResponse::newRedirectionResponse("/admin"));
}

void AdminController::editForm(
    const drogon::HttpRequestPtr &req,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback,
    int64_t id) {
    auto post = service::PostService::getById(id);
    if (!post.found) {
        callback(drogon::HttpResponse::newNotFoundResponse());
        return;
    }
    drogon::HttpViewData data;
    data.insert("title", std::string("記事編集 — C-blog"));
    data.insert("isEdit", true);
    data.insert("post", post);
    callback(drogon::HttpResponse::newHttpViewResponse("views::post_form", data));
}

void AdminController::update(
    const drogon::HttpRequestPtr &req,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback,
    int64_t id) {
    auto title = req->getParameter("title");
    auto slug = req->getParameter("slug");
    auto body = req->getParameter("body");
    bool published = paramTrue(req, "published");
    if (slug.empty()) slug = slugify(title);

    service::PostService::update(id, title, slug, body, published);
    callback(drogon::HttpResponse::newRedirectionResponse("/admin"));
}

void AdminController::remove(
    const drogon::HttpRequestPtr &req,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback,
    int64_t id) {
    service::PostService::remove(id);
    callback(drogon::HttpResponse::newRedirectionResponse("/admin"));
}

void AdminController::toggle(
    const drogon::HttpRequestPtr &req,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback,
    int64_t id) {
    service::PostService::togglePublished(id);
    callback(drogon::HttpResponse::newRedirectionResponse("/admin"));
}
