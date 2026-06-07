#include <drogon/drogon.h>

#include "services/AuthService.h"

int main()
{
    // config.json からリスナー/DB/ログ等を読み込む。
    drogon::app().loadConfigFile("./config.json");

    // セッションを有効化（管理ログインで使用）。timeout 秒、0 で無期限。
    drogon::app().enableSession(static_cast<size_t>(1209600));

    // 起動完了後（DB クライアント準備後）に既定 admin を保証する。
    drogon::app().registerBeginningAdvice([]() {
        service::AuthService::ensureDefaultAdmin();
    });

    LOG_INFO << "Blog app starting on http://localhost:8080";

    // コントローラ/ビューは drogon の自動登録機構で読み込まれる。
    // "/" は BlogController が記事一覧を返す（静的 static/index.html は /index.html）。
    drogon::app().run();

    return 0;
}
