#pragma once
#include "agents.hpp"
#include <set>
namespace hi {
struct RoutingDecision {
  std::vector<std::string> order;
  std::string reason;
};
class AgentRouter {
public:
  static RoutingDecision validate(const Json& decision,const Json& context) {
    require(decision.is_object() && decision.contains("tasks") && decision["tasks"].is_array() && decision["tasks"].size()<=4,"Invalid routing decision",502);
    const std::set<std::string> allowed={"planning","research","knowledge","finance"};
    std::set<std::string> selected;
    for(const auto& entry:decision["tasks"]){
      require(entry.is_string(),"Invalid routed agent",502);
      auto name=entry.get<std::string>();
      require(allowed.contains(name) && selected.insert(name).second,"Unknown or duplicate routed agent",502);
    }
    if(context.value("event",false)){selected.insert("planning");selected.insert("finance");}
    if(context.contains("budget"))selected.insert("finance");
    if(!context.value("sources",Json::array()).empty())selected.insert("knowledge");
    if(!context.value("web_sources",Json::array()).empty())selected.insert("research");
    if(selected.empty())selected.insert("planning");
    RoutingDecision result{{"memory"},utf8Prefix(decision.value("summary",std::string{}),2000)};
    for(const auto& name:{"planning","research","knowledge","finance"})if(selected.contains(name))result.order.push_back(name);
    result.order.push_back("critic");result.order.push_back("orchestrator");return result;
  }
  static RoutingDecision choose(IntelligenceProvider& provider,const Json& context) {
    if(provider.mode()=="live") {
      auto result=provider.complete(
        "ROUTE_AGENTS: Select relevant specialist agents for this request. "
        "Return only their identifiers in the tasks array, chosen from planning, research, knowledge, finance. "
        "No duplicates. Do not include memory, critic, orchestrator or execution; the application adds mandatory review stages. "
        "Explain selection briefly in summary; findings and risks may be empty. Do not propose application task titles or milestones in this routing response.",context);
      return validate(result,context);
    }
    auto prompt=context.value("prompt",std::string{});
    std::transform(prompt.begin(),prompt.end(),prompt.begin(),[](unsigned char c){return std::tolower(c);});
    Json selected={"planning"};
    if(context.value("event",false))selected={"planning","research","knowledge","finance"};
    else {
      if(prompt.find("research")!=std::string::npos || prompt.find("compare")!=std::string::npos)selected.push_back("research");
      if(prompt.find("budget")!=std::string::npos || prompt.find("cost")!=std::string::npos)selected.push_back("finance");
    }
    return validate({{"tasks",selected},{"summary","Deterministic demo routing from request keywords and supplied constraints; no AI routing call."}},context);
  }
};
} // namespace hi
