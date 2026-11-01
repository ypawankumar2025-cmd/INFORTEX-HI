#include "hi/database.hpp"
namespace hi {
Database::Database(const std::string &url) {
#ifdef HI_POSTGRES
  if (url.starts_with("postgres")) {
    pg_ = PQconnectdb(url.c_str());
    if (PQstatus(pg_) != CONNECTION_OK) {
      PQfinish(pg_);
      pg_ = nullptr;
      throw std::runtime_error("PostgreSQL connection failed");
    }
    return;
  }
#endif
  if (url.starts_with("postgres"))
    throw std::runtime_error("Build with PostgreSQL support");
  if (sqlite3_open(url.c_str(), &sqlite_) != SQLITE_OK)
    throw std::runtime_error("SQLite open failed");
  sqlite3_busy_timeout(sqlite_, 5000);
  script("PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;");
}
Database::~Database() {
  if (sqlite_)
    sqlite3_close(sqlite_);
#ifdef HI_POSTGRES
  if (pg_)
    PQfinish(pg_);
#endif
}
bool Database::postgres() const {
#ifdef HI_POSTGRES
  return pg_ != nullptr;
#else
  return false;
#endif
}
Json Database::query(const std::string &sql,
                     const std::vector<std::string> &args) {
  std::lock_guard guard(mutex);
  Json rows = Json::array();
#ifdef HI_POSTGRES
  if (pg_) {
    std::string s;
    int i = 0;
    for (char c : sql) {
      if (c == '?')
        s += "$" + std::to_string(++i);
      else
        s += c;
    }
    std::vector<const char *> p;
    for (auto &a : args)
      p.push_back(a.c_str());
    auto *r = PQexecParams(pg_, s.c_str(), p.size(), nullptr, p.data(), nullptr,
                           nullptr, 0);
    auto status = PQresultStatus(r);
    if (status != PGRES_TUPLES_OK && status != PGRES_COMMAND_OK) {
      PQclear(r);
      throw std::runtime_error("Database operation failed");
    }
    for (int n = 0; n < PQntuples(r); ++n) {
      Json row = Json::object();
      for (int k = 0; k < PQnfields(r); ++k)
        row[PQfname(r, k)] = PQgetisnull(r, n, k) ? "" : PQgetvalue(r, n, k);
      rows.push_back(row);
    }
    PQclear(r);
    return rows;
  }
#endif
  sqlite3_stmt *raw = nullptr;
  if (sqlite3_prepare_v2(sqlite_, sql.c_str(), -1, &raw, nullptr) != SQLITE_OK)
    throw std::runtime_error("Database prepare failed: " +
                             std::string(sqlite3_errmsg(sqlite_)));
  auto stmt = std::unique_ptr<sqlite3_stmt, decltype(&sqlite3_finalize)>(
      raw, sqlite3_finalize);
  for (size_t n = 0; n < args.size(); ++n)
    sqlite3_bind_text(raw, n + 1, args[n].c_str(), args[n].size(),
                      SQLITE_TRANSIENT);
  int rc;
  while ((rc = sqlite3_step(raw)) == SQLITE_ROW) {
    Json row = Json::object();
    for (int k = 0; k < sqlite3_column_count(raw); ++k) {
      auto v = sqlite3_column_text(raw, k);
      row[sqlite3_column_name(raw, k)] =
          v ? reinterpret_cast<const char *>(v) : "";
    }
    rows.push_back(row);
  }
  if (rc != SQLITE_DONE)
    throw std::runtime_error("Database operation failed: " +
                             std::string(sqlite3_errmsg(sqlite_)));
  return rows;
}
void Database::script(const std::string &sql) {
  std::lock_guard guard(mutex);
#ifdef HI_POSTGRES
  if (pg_) {
    auto *r = PQexec(pg_, sql.c_str());
    if (PQresultStatus(r) != PGRES_COMMAND_OK) {
      PQclear(r);
      throw std::runtime_error("Schema migration failed");
    }
    PQclear(r);
    return;
  }
#endif
  char *e = nullptr;
  if (sqlite3_exec(sqlite_, sql.c_str(), nullptr, nullptr, &e) != SQLITE_OK) {
    std::string err = e ? e : "Schema migration failed";
    sqlite3_free(e);
    throw std::runtime_error(err);
  }
}
} // namespace hi
