#include "hi/agents.hpp"
#include <set>
namespace hi {
namespace {
Json result(std::string summary, Json findings = Json::array(),
            Json tasks = Json::array(), Json risks = Json::array()) {
  return {{"summary", summary},
          {"findings", findings.is_null() ? Json::array() : findings},
          {"tasks", tasks.is_null() ? Json::array() : tasks},
          {"risks", risks.is_null() ? Json::array() : risks}};
}
} // namespace
Json budgetPlan(long long rupees, int people) {
  require(rupees >= 100 && rupees <= 100000000,
          "Budget must be ₹100–₹100,000,000");
  require(people >= 1 && people <= 100000, "Participants must be 1–100,000");
  Money total(rupees * 100), spent;
  Json lines = Json::array();
  std::vector<std::pair<std::string, int>> weights = {
      {"Venue & permissions", 20}, {"Refreshments", 30},
      {"AV & equipment", 16},      {"Materials & signage", 8},
      {"Speakers & travel", 10},   {"Prizes & recognition", 6}};
  for (auto &[name, percent] : weights) {
    Money amount(total.paise * percent / 100);
    spent = spent + amount;
    lines.push_back(
        {{"category", name},
         {"paise", amount},
         {"assumption", "Planning allocation; obtain a written quotation"}});
  }
  Money reserve(total.paise - spent.paise);
  return {{"currency", "INR"},
          {"budget_paise", total},
          {"allocated_paise", spent},
          {"reserve_paise", reserve},
          {"people", people},
          {"per_person_paise", total.paise / people},
          {"lines", lines},
          {"within_budget", spent <= total},
          {"basis",
           "Illustrative percentage allocations, not current market prices"}};
}
void AgentResultEvaluator::validate(const Json &r) {
  require(r.is_object() && r.contains("summary") && r["summary"].is_string() &&
              r["summary"].get<std::string>().size() <= 16000,
          "Invalid agent summary", 502);
  for (auto k : {"findings", "tasks", "risks"}) {
    require(r.contains(k) && r[k].is_array() && r[k].size() <= 40,
            "Invalid agent output", 502);
    for (auto &x : r[k])
      require(x.is_string() && x.get<std::string>().size() <= 4000,
              "Invalid agent item", 502);
  }
  if (r.contains("milestones")) {
    require(r["milestones"].is_array() && r["milestones"].size() <= 20, "Invalid milestones", 502);
    for (const auto& title : r["milestones"])
      require(title.is_string() && !title.get<std::string>().empty() && title.get<std::string>().size() <= 200, "Invalid milestone title", 502);
  }
  if (r.contains("task_plan")) {
    const auto& plan = r["task_plan"];
    require(plan.is_array() && plan.size() == r["tasks"].size(), "Task plan must match tasks", 502);
    for (size_t i=0; i<plan.size(); ++i) {
      const auto& item=plan[i];
      require(item.is_object(), "Invalid task plan", 502);
      auto priority=item.value("priority",std::string("medium"));
      auto deadline=item.value("deadline",std::string{});
      require(priority=="low" || priority=="medium" || priority=="high", "Invalid planned priority", 502);
      require(deadline.empty() || validDate(deadline), "Invalid planned deadline", 502);
      auto dependencies=item.value("depends_on",Json::array());
      require(dependencies.is_array() && dependencies.size()<=i, "Invalid planned dependencies", 502);
      std::set<int> seen;
      for (const auto& dep: dependencies) {
        require(dep.is_number_integer(), "Invalid prerequisite index", 502);
        int index=dep.get<int>();
        require(index>=0 && size_t(index)<i && seen.insert(index).second, "Prerequisites must be unique earlier task indices", 502);
      }
    }
  }
}
Json RoleAgent::execute(AgentContext &c, IntelligenceProvider &p) {
  Json r =
      p.mode() == "demo"
          ? demo(c)
          : p.complete(instructions() + " " +
                           c.data.value("agent_instructions", std::string{}),
                       c.data, c.onProgress);
  if (p.mode()=="demo" && (name()=="planning" || name()=="orchestrator") && !r["tasks"].empty()) {
    r["milestones"] = Json::array({"Scope and resources confirmed", "Deliverable reviewed and accepted"});
  }
  AgentResultEvaluator::validate(r);
  return r;
}
Json PlanningAgent::demo(AgentContext &c) {
  bool event = c.data.value("event", false);
  if (event)
    return result(
        "A technical event plan with approval gates and logistics ownership.",
        {"Choose a campus venue with sufficient capacity and accessible exits.",
         "Use registration, opening talk, technical sessions, practical "
         "challenge and closing segments.",
         "Confirm volunteers, AV testing, water, signage and contingency "
         "arrangements."},
        {"Confirm venue capacity and permissions",
         "Collect written vendor quotations",
         "Assign volunteer and logistics leads",
         "Publish registration and attendance plan",
         "Test AV and workshop equipment",
         "Review final budget and safety checklist"});
  return result(
      "Draft a delivery plan for: " + c.data.value("prompt", std::string{}),
      {"Define the desired outcome and success criteria.",
       "Validate dependencies and resources before committing dates."},
      {"Confirm scope and acceptance criteria",
       "Gather requirements and evidence", "Assign owners and milestone dates",
       "Build and review the first deliverable",
       "Validate outcomes with stakeholders"},
      {"Demo uses a general planning template; refine it for this project's "
       "domain."});
}
Json ResearchAgent::demo(AgentContext &) {
  return result(
      "Research checklist based on supplied context; no live web search was "
      "performed.",
      {"Check institutional policy, resource availability and stakeholder "
       "needs.",
       "Compare at least two options using documented requirements."},
      {},
      {"Venue availability and vendor rates remain unverified.",
       "Ask humans to supply quotations and authoritative documents."});
}
Json KnowledgeAgent::demo(AgentContext &c) {
  Json f = Json::array();
  for (auto &s : c.data["sources"])
    f.push_back(s["name"].get<std::string>() + " · chunk " +
                std::to_string(s["chunk_index"].get<int>()) + ": " +
                utf8Prefix(s["content"].get<std::string>(), 500));
  return result(
      f.empty() ? "No matching project evidence found."
                : "Relevant project excerpts retrieved.",
      f, {},
      f.empty()
          ? Json::array({"Upload evidence before relying on this proposal."})
          : Json::array());
}
Json FinanceAgent::demo(AgentContext &c) {
  if (!c.data.contains("budget"))
    return result("No budget constraint was supplied.", {}, {},
                  {"Add budget and participant counts for a deterministic cost "
                   "breakdown."});
  auto b = c.data["budget"];
  return result(
      "Budget arithmetic validated. Amounts are illustrative allocations.",
      {"Allocate 90% across delivery categories and retain 10% contingency.",
       "Per-person available amount is rounded down to the nearest paise."},
      {},
      {"Get vendor quotations; affordability is not established by allocations "
       "alone."});
}
Json CriticAgent::demo(AgentContext &c) {
  return result(
      "Review complete: human validation is required before execution.",
      {"Check source evidence, ownership, deadlines and feasibility.",
       "Only approved task creation is permitted; no external purchases or "
       "bookings occur."},
      {},
      c.data.value("event", false)
          ? Json::array(
                {"Confirm the venue actually accommodates all participants.",
                 "Validate refreshments, accessibility and emergency "
                 "arrangements."})
          : Json::array(
                {"General demo output is not a domain-expert assessment."}));
}
Json MemoryAgent::demo(AgentContext &c) {
  Json f = Json::array();
  for (auto &m : c.data["memories"])
    f.push_back(utf8Prefix(m["content"].get<std::string>(), 500));
  return result(f.empty() ? "No earlier project memory exists."
                          : "Earlier project context retrieved.",
                f);
}
Json OrchestratorAgent::demo(AgentContext &c) {
  auto p = c.data["outputs"].value("planning", Json::object());
  Json risks = Json::array();
  for (auto &[key, v] : c.data["outputs"].items())
    for (auto &risk : v.value("risks", Json::array()))
      risks.push_back(risk);
  return result(
      "Proposal ready for human review. " + p.value("summary", std::string{}),
      {"The agents shared project evidence, constraints and prior outputs.",
       "Approve to add the proposed tasks, reject, or request changes."},
      p.value("tasks", Json::array()), risks);
}
Json ExecutionAgent::demo(AgentContext &) {
  return result("Approved tasks can be created inside this application. "
                "External actions are not available.");
}
const std::vector<std::string> &AgentRegistry::ids() {
  static const std::vector<std::string> ids = {
      "orchestrator", "research",  "planning", "knowledge",
      "finance",      "execution", "critic",   "memory"};
  return ids;
}
std::unique_ptr<Agent> AgentFactory::create(const std::string &s) {
#define MAKE(ID, CLASS)                                                        \
  if (s == ID)                                                                 \
    return std::make_unique<CLASS>();
  MAKE("orchestrator", OrchestratorAgent)
  MAKE("research", ResearchAgent)
  MAKE("planning", PlanningAgent) MAKE("knowledge", KnowledgeAgent)
      MAKE("finance", FinanceAgent) MAKE("execution", ExecutionAgent)
          MAKE("critic", CriticAgent) MAKE("memory", MemoryAgent)
#undef MAKE
              throw Error(400, "Unknown agent");
}
} // namespace hi
