#include "hi/provider.hpp"
#include <curl/curl.h>
#include <iostream>
using namespace hi;
int main(int argc, char** argv) {
  if(argc!=2)return 2;
  curl_global_init(CURL_GLOBAL_DEFAULT);
  const bool expectFailure=std::string(argv[1])=="reject";
  try {
    OpenAICompatibleProvider provider;
    auto vector=provider.embed("Transport test");
    require(vector==std::vector<double>({0.6,0.8}),"Embedding payload mismatch");
    std::string draft;
    auto result=provider.complete("Return structured test output",Json::object(),[&](const std::string& text){draft=text;});
    require(result.at("summary")=="Hello ₹","Completion payload mismatch");
    if(env("LLM_STREAMING")=="true")require(!draft.empty(),"No stream progress callback");
    if(expectFailure){std::cerr<<"Invalid upstream response was accepted\n";return 1;}
  }catch(const std::exception&){
    if(!expectFailure){std::cerr<<"Expected successful provider request\n";return 1;}
  }
  curl_global_cleanup();
  return 0;
}
