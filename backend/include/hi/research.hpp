#pragma once
#include "common.hpp"
namespace hi {
class WebResearchService {
public:
  bool configured()const{return !env("BRAVE_SEARCH_API_KEY").empty();}
  Json search(const std::string& query)const;
  static Json normalize(const Json& response);
};
}
