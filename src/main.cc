#include <drogon/drogon.h>

int main()
{
    // config.json からリスナー/DB/ログ等を読み込む。
    drogon::app().loadConfigFile("./config.json");

    LOG_INFO << "Blog app starting on http://localhost:8080";

    // コントローラは drogon の自動登録機構で読み込まれる。
    drogon::app().run();

    return 0;
}
