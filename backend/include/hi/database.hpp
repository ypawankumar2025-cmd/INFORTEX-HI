#pragma once
#include "common.hpp"
#include <sqlite3.h>
#ifdef HI_POSTGRES
#include <libpq-fe.h>
#endif
#include <fstream>
#include <mutex>
namespace hi {
class Database {
  sqlite3 *sqlite_ = nullptr;
#ifdef HI_POSTGRES
  PGconn *pg_ = nullptr;
#endif
public:
  std::recursive_mutex mutex;
  explicit Database(const std::string &url);
  ~Database();
  Database(const Database &) = delete;
  Database &operator=(const Database &) = delete;
  Json query(const std::string &sql, const std::vector<std::string> &args = {});
  void script(const std::string &sql);
  bool postgres() const;
};
class Transaction {
  Database &db_;
  std::unique_lock<std::recursive_mutex> lock_;
  bool committed_ = false;

public:
  explicit Transaction(Database &db) : db_(db), lock_(db.mutex) {
    db_.query("BEGIN");
  }
  void commit() {
    db_.query("COMMIT");
    committed_ = true;
  }
  ~Transaction() {
    if (!committed_)
      try {
        db_.query("ROLLBACK");
      } catch (...) {
      }
  }
};
class Repository {
protected:
  Database &db_;

public:
  explicit Repository(Database &d) : db_(d) {}
  virtual ~Repository() = default;
  Json one(const std::string &sql, const std::vector<std::string> &p = {}) {
    auto r = db_.query(sql, p);
    require(!r.empty(), "Not found", 404);
    return r[0];
  }
};
} // namespace hi
