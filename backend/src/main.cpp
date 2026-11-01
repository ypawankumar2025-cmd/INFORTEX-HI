#include "crow.h"
#include "hi/service.hpp"
#include <curl/curl.h>
#include <filesystem>
#include <sstream>
using namespace hi;
namespace {
std::string sessionToken(const crow::request &req) {
  std::istringstream stream(req.get_header_value("Cookie"));
  std::string part;
  while (std::getline(stream, part, ';')) {
    auto start = part.find_first_not_of(' ');
    if (start != std::string::npos &&
        part.substr(start).starts_with("hi_session="))
      return part.substr(start + 11);
  }
  return {};
}
class RateLimiter {
  struct Entry {
    long long start = 0;
    int count = 0;
  };
  std::mutex mutex_;
  std::map<std::string, Entry> entries_;

public:
  bool allow(const std::string &key, int limit) {
    std::lock_guard guard(mutex_);
    auto time = now();
    if (entries_.size() > 10000)
      for (auto i = entries_.begin(); i != entries_.end();)
        if (time - i->second.start >= 60)
          i = entries_.erase(i);
        else
          ++i;
    if (entries_.size() > 10000)
      return false;
    auto &e = entries_[key];
    if (time - e.start >= 60)
      e = {time, 0};
    return ++e.count <= limit;
  }
};
crow::response response(const Json &j, int code = 200) {
  crow::response r(code, j.dump());
  r.set_header("Content-Type", "application/json; charset=utf-8");
  r.set_header("Cache-Control", "no-store");
  r.set_header("X-Content-Type-Options", "nosniff");
  return r;
}
} // namespace
int main() {
  try {
    curl_global_init(CURL_GLOBAL_DEFAULT);
    std::ifstream file(env("SCHEMA_PATH", "database/schema.sql"));
    require(file.good(),
            "Cannot read schema; run from the HI directory or set SCHEMA_PATH");
    Database db(env("DATABASE_URL", "hi.db"));
    db.script(std::string(std::istreambuf_iterator<char>(file), {}));
    auto provider = makeProvider();
    Service service(db, *provider);
    RateLimiter limiter;
    crow::SimpleApp app;
    CROW_ROUTE(app, "/api/<path>")
        .methods(crow::HTTPMethod::GET, crow::HTTPMethod::POST,
                 crow::HTTPMethod::PATCH,
                 crow::HTTPMethod::DELETE)([&](const crow::request &req,
                                               std::string path) {
          try {
            bool read = req.method == crow::HTTPMethod::GET;
            require(req.body.size() <= 3000000, "Request too large", 413);
            bool auth = path == "auth/login" || path == "auth/register";
            require(
                limiter.allow(req.remote_ip_address + (auth ? ":auth" : ":api"),
                              auth ? 12 : 240),
                "Too many requests; retry in a minute", 429);
            if (!read)
              require(req.get_header_value("X-HI-Request") == "1",
                      "Missing request validation header", 403);
            auto origin = req.get_header_value("Origin");
            if (!origin.empty())
              require(origin == env("APP_ORIGIN", "http://localhost:8080"),
                      "Origin not permitted", 403);
            if (path == "health" && read)
              return response(service.health());
            Json in = req.body.empty() ? Json::object() : parse(req.body);
            require(in.is_object(), "Expected JSON object");
            auto method = crow::method_name(req.method);
            if (path == "auth/register" && req.method == crow::HTTPMethod::POST)
              return response(service.registerUser(in), 201);
            if (path == "auth/login" && req.method == crow::HTTPMethod::POST) {
              std::string token;
              auto r = response(service.login(in, token));
              r.set_header(
                  "Set-Cookie",
                  "hi_session=" + token +
                      "; HttpOnly; SameSite=Strict; Path=/api; Max-Age=86400" +
                      (env("COOKIE_SECURE", "false") == "true" ? "; Secure"
                                                               : ""));
              return r;
            }
            auto token = sessionToken(req);
            auto user = service.authenticate(token);
            if (path == "auth/logout" && req.method == crow::HTTPMethod::POST) {
              service.logout(token);
              auto r = response({{"ok", true}});
              r.set_header("Set-Cookie",
                           "hi_session=; HttpOnly; SameSite=Strict; Path=/api; "
                           "Max-Age=0");
              return r;
            }
            std::vector<std::string> parts;
            std::istringstream stream(path);
            std::string part;
            while (std::getline(stream, part, '/'))
              if (!part.empty())
                parts.push_back(part);
            return response(service.handle(user, method, parts, in));
          } catch (const Error &e) {
            return response({{"error", e.what()}}, e.status);
          } catch (const nlohmann::json::exception &) {
            return response(
                {{"error", "Invalid field type or malformed input"}}, 400);
          } catch (const std::exception &e) {
            std::cerr << "Request failed: " << e.what() << '\n';
            return response({{"error", "Operation failed; check server logs"}},
                            500);
          }
        });
    app.loglevel(crow::LogLevel::Warning);
    app.bindaddr(env("BIND_ADDRESS", "127.0.0.1"))
        .port(std::stoi(env("PORT", "8081")))
        .concurrency(4)
        .run();
    return 0;
  } catch (const std::exception &e) {
    std::cerr << "Startup failed: " << e.what() << '\n';
    return 1;
  }
}
