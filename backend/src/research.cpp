#include "hi/research.hpp"
#include <curl/curl.h>
#include <memory>
#include <sstream>
namespace hi {
namespace {
size_t receiveSearch(char* data,size_t size,size_t count,void* target){
 auto& out=*static_cast<std::string*>(target);
 if(out.size()+size*count>2000000)return 0;
 out.append(data,size*count);return size*count;
}
}
Json WebResearchService::normalize(const Json& response){
 Json results=Json::array();
 auto web=response.value("web",Json::object());
 for(auto& item:web.value("results",Json::array())){
  if(results.size()>=5)break;
  if(!item.is_object()||!item.contains("url")||!item["url"].is_string())continue;
  auto url=item["url"].get<std::string>();
  if(!(url.starts_with("https://")||url.starts_with("http://"))||url.size()>2048)continue;
  results.push_back({{"title",utf8Prefix(item.value("title",std::string{}),300)},
    {"url",url},{"snippet",utf8Prefix(item.value("description",std::string{}),2000)}});
 }
 return results;
}
Json WebResearchService::search(const std::string& query)const{
 require(configured(),"Web research is not configured",409);
 require(!query.empty()&&query.size()<=600,"Search query must be 1–600 bytes");
 std::istringstream words(query);std::string word;size_t count=0;while(words>>word)++count;
 require(count<=75,"Search query must contain at most 75 words");
 auto h=std::unique_ptr<CURL,decltype(&curl_easy_cleanup)>(curl_easy_init(),curl_easy_cleanup);
 require(bool(h),"Cannot initialize research request",503);
 auto escaped=std::unique_ptr<char,decltype(&curl_free)>(curl_easy_escape(h.get(),query.c_str(),query.size()),curl_free);
 require(bool(escaped),"Cannot encode search query",503);
 std::string url="https://api.search.brave.com/res/v1/web/search?q="+std::string(escaped.get())+"&count=5&text_decorations=false",out;
 curl_slist* list=nullptr;list=curl_slist_append(list,"Accept: application/json");
 list=curl_slist_append(list,("X-Subscription-Token: "+env("BRAVE_SEARCH_API_KEY")).c_str());
 auto headers=std::unique_ptr<curl_slist,decltype(&curl_slist_free_all)>(list,curl_slist_free_all);
 curl_easy_setopt(h.get(),CURLOPT_URL,url.c_str());curl_easy_setopt(h.get(),CURLOPT_HTTPHEADER,list);
 curl_easy_setopt(h.get(),CURLOPT_TIMEOUT,20L);curl_easy_setopt(h.get(),CURLOPT_CONNECTTIMEOUT,8L);
 curl_easy_setopt(h.get(),CURLOPT_NOSIGNAL,1L);curl_easy_setopt(h.get(),CURLOPT_FOLLOWLOCATION,0L);
 curl_easy_setopt(h.get(),CURLOPT_WRITEFUNCTION,receiveSearch);curl_easy_setopt(h.get(),CURLOPT_WRITEDATA,&out);
 auto code=curl_easy_perform(h.get());long status=0;curl_easy_getinfo(h.get(),CURLINFO_RESPONSE_CODE,&status);
 require(code==CURLE_OK&&status>=200&&status<300,"Web research provider failed; check key and quota",502);
 return normalize(Json::parse(out));
}
}
