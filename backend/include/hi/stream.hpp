#pragma once
#include "common.hpp"
#include <functional>
namespace hi {
using ProgressCallback = std::function<void(const std::string&)>;
// Incremental OpenAI-compatible SSE decoder. HTTP transport may split anywhere.
class CompletionStream {
  std::string pending_,content_;
  bool done_=false;
  size_t received_=0;
  ProgressCallback progress_;
public:
  explicit CompletionStream(ProgressCallback progress={}):progress_(std::move(progress)){}
  void feed(const std::string& bytes) {
    received_+=bytes.size();require(received_<=2000000,"Model stream exceeds limit",502);
    pending_+=bytes;
    size_t end;
    while((end=pending_.find('\n'))!=std::string::npos){
      auto line=pending_.substr(0,end);pending_.erase(0,end+1);
      if(!line.empty()&&line.back()=='\r')line.pop_back();
      if(!line.starts_with("data:"))continue;
      auto data=line.substr(5);if(data.starts_with(' '))data.erase(0,1);
      if(data=="[DONE]"){done_=true;continue;}
      require(!done_,"Unexpected data after completed stream",502);
      auto item=Json::parse(data);
      require(!item.contains("error"),"Provider reported a stream error",502);
      if(!item.contains("choices")||item["choices"].empty())continue;
      auto delta=item["choices"][0].value("delta",Json::object());
      if(delta.contains("content")&&!delta["content"].is_null()){
        require(delta["content"].is_string(),"Invalid model stream content",502);
        content_+=delta["content"].get<std::string>();
        require(content_.size()<=200000,"Model output exceeds limit",502);
        if(progress_)progress_(content_);
      }
    }
  }
  std::string finish(){require(done_&&!content_.empty(),"Incomplete model stream",502);return content_;}
};
}
