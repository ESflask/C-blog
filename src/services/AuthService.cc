#include "AuthService.h"

#include <drogon/drogon.h>
#include <drogon/utils/Utilities.h>

#include <cstdlib>

namespace service {

namespace {
std::string pepper() {
    const char* p = std::getenv("CBLOG_PEPPER");
    return p ? std::string(p) : std::string();
}

std::string computeHash(const std::string& salt, const std::string& password) {
    return drogon::utils::getSha256(salt + ":" + password + ":" + pepper());
}
}  // namespace

std::string AuthService::hashPassword(const std::string& password) {
    // UUID をソルトに利用（推測困難なランダム値）。
    std::string salt = drogon::utils::getUuid();
    return salt + "$" + computeHash(salt, password);
}

bool AuthService::checkPassword(const std::string& password, const std::string& stored) {
    auto pos = stored.find('$');
    if (pos == std::string::npos) {
        return false;  // 形式不正（平文など）は不一致扱い
    }
    std::string salt = stored.substr(0, pos);
    std::string expected = stored.substr(pos + 1);
    std::string actual = computeHash(salt, password);
    if (actual.size() != expected.size()) {
        return false;
    }
    unsigned char diff = 0;
    for (size_t i = 0; i < actual.size(); ++i) {
        diff |= static_cast<unsigned char>(actual[i] ^ expected[i]);
    }
    return diff == 0;
}

std::optional<AuthUser> AuthService::authenticate(const std::string& username,
                                                  const std::string& password) {
    try {
        auto db = drogon::app().getDbClient();
        auto r = db->execSqlSync(
            "SELECT id, username, password_hash FROM users WHERE username = ? LIMIT 1",
            username);
        if (r.empty()) {
            return std::nullopt;
        }
        if (!checkPassword(password, r[0]["password_hash"].as<std::string>())) {
            return std::nullopt;
        }
        return AuthUser{r[0]["id"].as<int64_t>(), r[0]["username"].as<std::string>()};
    } catch (const std::exception& e) {
        LOG_ERROR << "AuthService::authenticate failed: " << e.what();
        return std::nullopt;
    }
}

void AuthService::ensureDefaultAdmin() {
    try {
        auto db = drogon::app().getDbClient();
        const char* envPw = std::getenv("CBLOG_ADMIN_PASSWORD");
        std::string password = envPw ? std::string(envPw) : std::string("admin");

        auto r = db->execSqlSync(
            "SELECT id, password_hash FROM users WHERE username = 'admin' LIMIT 1");
        if (r.empty()) {
            db->execSqlSync(
                "INSERT INTO users(username, password_hash) VALUES('admin', ?)",
                hashPassword(password));
            LOG_INFO << "AuthService: created default admin user";
        } else if (r[0]["password_hash"].as<std::string>().find('$') == std::string::npos) {
            db->execSqlSync("UPDATE users SET password_hash = ? WHERE id = ?",
                            hashPassword(password), r[0]["id"].as<int64_t>());
            LOG_INFO << "AuthService: upgraded admin password to hashed form";
        }
    } catch (const std::exception& e) {
        LOG_ERROR << "AuthService::ensureDefaultAdmin failed: " << e.what();
    }
}

} // namespace service
