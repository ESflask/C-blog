#pragma once

#include <drogon/HttpFilter.h>

namespace filter {

// セッションに userId が無ければ /login へリダイレクトする認証ガード。
class LoginFilter : public drogon::HttpFilter<LoginFilter> {
public:
    void doFilter(const drogon::HttpRequestPtr &req,
                  drogon::FilterCallback &&fcb,
                  drogon::FilterChainCallback &&fccb) override;
};

} // namespace filter
