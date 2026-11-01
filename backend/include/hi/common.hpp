#pragma once
#include <chrono>
#include <cstdlib>
#include <nlohmann/json.hpp>
#include <openssl/crypto.h>
#include <openssl/evp.h>
#include <openssl/rand.h>
#include <regex>
#include <stdexcept>
#include <string>
#include <vector>
namespace hi {
using Json = nlohmann::json;
inline long long now() {
  return std::chrono::duration_cast<std::chrono::seconds>(
             std::chrono::system_clock::now().time_since_epoch())
      .count();
}
inline std::string env(const char *k, const std::string &fallback = "") {
  auto v = std::getenv(k);
  return v ? v : fallback;
}
struct Error : std::runtime_error {
  int status;
  Error(int s, std::string m) : std::runtime_error(std::move(m)), status(s) {}
};
inline void require(bool b, const std::string &msg, int status = 400) {
  if (!b)
    throw Error(status, msg);
}
inline std::string hex(const unsigned char *b, size_t n) {
  const char *h = "0123456789abcdef";
  std::string s;
  for (size_t i = 0; i < n; ++i) {
    s += h[b[i] >> 4];
    s += h[b[i] & 15];
  }
  return s;
}
inline std::string id(size_t bytes = 16) {
  std::vector<unsigned char> b(bytes);
  if (RAND_bytes(b.data(), b.size()) != 1)
    throw std::runtime_error("Random generator failure");
  return hex(b.data(), b.size());
}
inline std::string digest(const std::string &s) {
  unsigned char d[32];
  unsigned n = 0;
  if (EVP_Digest(s.data(), s.size(), d, &n, EVP_sha256(), nullptr) != 1)
    throw std::runtime_error("Digest failure");
  return hex(d, n);
}
inline std::string passwordHash(const std::string &p, const std::string &salt) {
  unsigned char d[32];
  if (PKCS5_PBKDF2_HMAC(p.data(), p.size(),
                        reinterpret_cast<const unsigned char *>(salt.data()),
                        salt.size(), 600000, EVP_sha256(), 32, d) != 1)
    throw std::runtime_error("Password KDF failure");
  return hex(d, 32);
}
inline bool equalSecret(const std::string &a, const std::string &b) {
  return a.size() == b.size() &&
         CRYPTO_memcmp(a.data(), b.data(), a.size()) == 0;
}
inline std::string field(const Json &j, const std::string &key,
                         size_t max = 1000, bool required = true) {
  require(j.contains(key) ? j[key].is_string() : !required, "Invalid " + key);
  std::string s = j.value(key, std::string{});
  require(s.size() <= max && (!required || s.find_first_not_of(" \n\t\r") !=
                                               std::string::npos),
          "Invalid " + key);
  return s;
}
inline std::string utf8Prefix(const std::string &s, size_t limit) {
  size_t end = std::min(limit, s.size());
  while (end > 0 && end < s.size() &&
         (static_cast<unsigned char>(s[end]) & 0xC0) == 0x80)
    --end;
  return s.substr(0, end);
}
inline bool validDate(const std::string &s) {
  if (!std::regex_match(s, std::regex(R"(\d{4}-\d{2}-\d{2})")))
    return false;
  int y = std::stoi(s.substr(0, 4));
  unsigned m = std::stoul(s.substr(5, 2)), d = std::stoul(s.substr(8, 2));
  return y >= 1 &&
         std::chrono::year_month_day{std::chrono::year{y},
                                     std::chrono::month{m}, std::chrono::day{d}}
             .ok();
}
inline std::string lower(std::string s) {
  for (auto &c : s)
    c = static_cast<char>(std::tolower(static_cast<unsigned char>(c)));
  return s;
}
inline Json parse(const std::string &s) {
  try {
    return Json::parse(s);
  } catch (...) {
    throw Error(400, "Invalid JSON");
  }
}
inline std::string text(const Json &j, const std::string &k) {
  return j.value(k, std::string{});
}
inline long long number(const Json &j, const std::string &k) {
  try {
    return std::stoll(text(j, k));
  } catch (...) {
    return 0;
  }
}
inline std::string email(const Json &j) {
  auto s = lower(field(j, "email", 254));
  require(std::regex_match(s, std::regex(R"([^\s@]+@[^\s@]+\.[^\s@]+)")),
          "Enter a valid email");
  return s;
}
} // namespace hi
