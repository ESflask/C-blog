#include "LoginFilter.h"

using namespace filter;

void LoginFilter::doFilter(const drogon::HttpRequestPtr &req,
                           drogon::FilterCallback &&fcb,
                           drogon::FilterChainCallback &&fccb) {
    auto session = req->session();
    if (session && session->find("userId")) {
        fccb();  // 認証済み → 後続のハンドラへ
        return;
    }
    // 未認証 → ログインへ
    fcb(drogon::HttpResponse::newRedirectionResponse("/login"));
}
