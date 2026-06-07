#pragma once

#include <cstdint>
#include <optional>
#include <string>

namespace service {

struct AuthUser {
    int64_t id = 0;
    std::string username;
};

// 認証・パスワードハッシュ。
// パスワードは "salt$sha256(salt:password:pepper)" 形式で保存する（平文保存しない）。
// pepper は環境変数 CBLOG_PEPPER（任意）。
class AuthService {
public:
    // username/password を検証。成功でユーザ、失敗で nullopt。
    static std::optional<AuthUser> authenticate(const std::string& username,
                                                const std::string& password);

    // 保存用ハッシュ文字列を生成（ランダムソルト付き）。
    static std::string hashPassword(const std::string& password);

    // 平文と保存ハッシュを照合（タイミング安全寄りの比較）。
    static bool checkPassword(const std::string& password, const std::string& stored);

    // 既定の admin ユーザを保証する（開発用）。
    // 未存在なら作成、平文(古い)なら再ハッシュ。初期PWは CBLOG_ADMIN_PASSWORD（既定 "admin"）。
    static void ensureDefaultAdmin();
};

} // namespace service
