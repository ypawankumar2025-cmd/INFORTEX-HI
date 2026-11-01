#pragma once
#include "database.hpp"
#include "provider.hpp"
#include "vector_index.hpp"
#include <map>
#include <mutex>
namespace hi {
class KnowledgeService {
  Database &db_;
  IntelligenceProvider &provider_;
  struct CachedIndex {
    std::string signature;
    Json chunks;
    VectorIndex index;
    CachedIndex(std::string s, Json c, const std::vector<std::vector<double>>& v)
        : signature(std::move(s)), chunks(std::move(c)), index(v) {}
  };
  std::mutex indexMutex_;
  std::map<std::string,std::shared_ptr<CachedIndex>> indexes_;

public:
  KnowledgeService(Database &db, IntelligenceProvider &p)
      : db_(db), provider_(p) {}
  Json upload(const std::string &project, const std::string &user,
              const Json &input);
  Json search(const std::string &project, const std::string &query);
  static std::string extract(const std::string &filename,
                             const std::string &bytes);
};
} // namespace hi
