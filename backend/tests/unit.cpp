#include "hi/service.hpp"
#include "hi/research.hpp"
#include "hi/routing.hpp"
#include <cassert>
#include <iostream>
using namespace hi;
int main(int argc, char **argv) {
  assert(argc == 2);
  std::vector<std::vector<double>> vectors;
  for(int i=0;i<80;++i){std::vector<double> v;for(int j=0;j<7;++j)v.push_back(std::sin((i+1)*(j+2)*0.37));vectors.push_back(v);}
  VectorIndex index(vectors);
  for(int t=0;t<20;++t){
    std::vector<double> query;for(int j=0;j<7;++j)query.push_back(std::cos((t+2)*(j+1)*0.23));
    std::vector<std::pair<size_t,double>> expected;
    for(size_t i=0;i<vectors.size();++i)expected.push_back({i,cosine(query,vectors[i])});
    std::sort(expected.begin(),expected.end(),[](auto a,auto b){return a.second>b.second;});
    auto actual=index.search(query);
    assert(actual.size()==5);
    for(size_t i=0;i<5;++i){assert(actual[i].first==expected[i].first);assert(std::abs(actual[i].second-expected[i].second)<1e-10);}
  }
  assert(index.search(std::vector<double>(7,0)).empty());
  assert(index.search({1,2}).empty());
  VectorIndex ties({{1,0},{1,0},{0,0}});
  assert(ties.search({1,0},1)[0].first==0);

  // Regression test: very large embedding values.
  VectorIndex largeIndex({{1e200, 0.0}, {0.0, 1e200}});
  auto largeResult = largeIndex.search({1e200, 0.0}, 1);
  assert(largeResult.size() == 1);
  assert(largeResult[0].first == 0);
  assert(std::abs(largeResult[0].second - 1.0) < 1e-12);

  // Regression test: very small embedding values.
  VectorIndex tinyIndex({{1e-200, 0.0}, {0.0, 1e-200}});
  auto tinyResult = tinyIndex.search({1e-200, 0.0}, 1);
  assert(tinyResult.size() == 1);
  assert(tinyResult[0].first == 0);
  assert(std::abs(tinyResult[0].second - 1.0) < 1e-12);

  auto route=AgentRouter::validate({{"tasks",{"research"}},{"summary","Evidence request"}},Json::object());
  assert((route.order==std::vector<std::string>{"memory","research","critic","orchestrator"}));
  auto constrained=AgentRouter::validate({{"tasks",Json::array()}},{{"event",true}});
  assert(std::find(constrained.order.begin(),constrained.order.end(),"finance")!=constrained.order.end());
  bool unsafeRoute=false;
  try{AgentRouter::validate({{"tasks",{"execution"}}},Json::object());}catch(const Error&){unsafeRoute=true;}
  assert(unsafeRoute);

  std::string draft;
  CompletionStream stream([&](const std::string& s){draft=s;});
  std::string wire="data: "+Json{{"choices",Json::array({{{"delta",{{"content","Hello ₹"}}}}})}}.dump()+"\r\n\r\ndata: [DONE]\n\n";
  for(char c:wire)stream.feed(std::string(1,c));
  assert(stream.finish()=="Hello ₹" && draft=="Hello ₹");
  bool incomplete=false;
  try { CompletionStream{}.finish(); } catch(const Error&){incomplete=true;}
  assert(incomplete);
  bool rejected=false;
  try { CompletionStream bad;bad.feed("data: {\"error\":{}}\n"); } catch(const Error&){rejected=true;}
  assert(rejected);
  bool malformedEventIs502=false;
  try { CompletionStream bad; bad.feed("data: {oops}\n\n"); }
  catch(const Error &e) { malformedEventIs502=(e.status==502); }
  assert(malformedEventIs502);
  for(const std::string &line : {
        std::string("data: []\n\n"),
        std::string("data: {\"choices\":{}}\n\n"),
        std::string("data: {\"choices\":[{\"delta\":4}]}\n\n")}) {
    bool badShapeIs502=false;
    try { CompletionStream malformed; malformed.feed(line); }
    catch(const Error &e) { badShapeIs502=(e.status==502); }
    assert(badShapeIs502);
  }
  bool duplicateDoneRejected=false;
  try {
    CompletionStream repeated;
    repeated.feed("data: {\"choices\":[{\"delta\":{\"content\":\"ok\"}}]}\n\n"
                  "data: [DONE]\n\ndata: [DONE]\n\n");
  } catch(const Error &e) { duplicateDoneRejected=e.status==502; }
  assert(duplicateDoneRejected);
  auto results=WebResearchService::normalize({{"web",{{"results",Json::array({
    {{"url","javascript:alert(1)"}},{{"url","https://example.com"},{"title","Example"},{"description","Excerpt"}}
  })}}}});
  assert(results.size()==1 && results[0]["snippet"]=="Excerpt");

  assert(utf8Prefix("₹event", 2).empty());
  assert(utf8Prefix("₹event", 3) == "₹");
  assert(utf8Prefix("A₹event", 3) == "A");
  assert(validDate("2028-02-29"));
  assert(!validDate("2026-02-29"));
  assert(!validDate("2026-13-01"));
  assert(!validDate("2026-04-31"));
  Json planned={{"summary","Plan"},{"findings",Json::array()},{"risks",Json::array()},{"tasks",{"First","Second"}},
    {"milestones",{"Ready"}},{"task_plan",Json::array({{{"priority","high"},{"depends_on",Json::array()}},{{"priority","medium"},{"depends_on",{0}}}})}};
  AgentResultEvaluator::validate(planned);
  planned["task_plan"][0]["depends_on"]={1};
  bool invalidPlan=false;
  try { AgentResultEvaluator::validate(planned); } catch(const Error&){invalidPlan=true;}
  assert(invalidPlan);
  auto b = budgetPlan(50000, 300);
  assert(b["budget_paise"] == 5000000);
  assert(b["reserve_paise"] == 500000);
  assert(b["allocated_paise"] == 4500000);
  assert(b["per_person_paise"] == 16666);
  long long sum = 0;
  for (auto &l : b["lines"])
    sum += l["paise"].get<long long>();
  assert(sum == 4500000);
  bool failed = false;
  try {
    budgetPlan(-1, 300);
  } catch (const Error &) {
    failed = true;
  }
  assert(failed);
  DemoProvider p;
  auto v = p.embed("technical event registration");
  assert(cosine(v, v) > 0.999);
  assert(cosine(v, p.embed("")) == 0);
  for (auto &a : AgentRegistry::ids())
    assert(AgentFactory::create(a)->name() == a);
  assert(AgentRegistry::ids().size() == 8);
  assert(KnowledgeService::extract("notes.txt", "hello") == "hello");
  failed = false;
  try {
    KnowledgeService::extract("bad.exe", "hello");
  } catch (const Error &) {
    failed = true;
  }
  assert(failed);
  AgentContext ctx;
  ctx.data = {{"prompt", "Plan an event"}, {"event", true},
              {"sources", Json::array()},  {"memories", Json::array()},
              {"outputs", Json::object()}, {"budget", budgetPlan(50000, 300)}};
  for (auto &name : AgentRegistry::ids()) {
    auto r = AgentFactory::create(name)->execute(ctx, p);
    AgentResultEvaluator::validate(r);
    ctx.data["outputs"][name] = r;
  }
  Database db(":memory:");
  std::ifstream f(argv[1]);
  db.script(std::string(std::istreambuf_iterator<char>(f), {}));
  db.query("INSERT INTO users(id,email,name,salt,password_hash,created_at) "
           "VALUES(?,?,?,?,?,?)",
           {"u", "u@example.test", "O'Reilly", "s", "h", "1"});
  {
    Transaction t(db);
    db.query("UPDATE users SET name=? WHERE id=?", {"Changed", "u"});
  }
  assert(db.query("SELECT name FROM users WHERE id=?", {"u"})[0]["name"] ==
         "O'Reilly");
  assert(
      db.query("SELECT name FROM users WHERE id=?", {"' OR 1=1 --"}).empty());
  // Chat tables are independent from project workflows and account-scoped.
  Service service(db,p);
  db.query("INSERT INTO users(id,email,name,salt,password_hash,created_at) "
           "VALUES(?,?,?,?,?,?)",
           {"other","other@example.test","Other","s","h","1"});
  Identity owner{"u","O'Reilly","u@example.test"};
  Identity outsider{"other","Other","other@example.test"};
  auto chat=service.handle(owner,"POST",{"chats"},{{"title","Java practice"}});
  auto chatId=chat["id"].get<std::string>();
  assert(service.handle(owner,"GET",{"chats"},Json::object()).size()==1);
  assert(service.handle(owner,"GET",{"chats",chatId,"messages"},Json::object()).empty());
  bool denied=false;
  try { service.handle(outsider,"GET",{"chats",chatId,"messages"},Json::object()); }
  catch(const Error& e) { denied=(e.status==404); }
  assert(denied);
  denied=false;
  try { service.handle(owner,"POST",{"chats",chatId,"messages"},{{"content","hello"}}); }
  catch(const Error& e) { denied=(e.status==409); }
  assert(denied);  // Demo mode must not pretend to be real AI.
  service.handle(owner,"DELETE",{"chats",chatId},Json::object());
  assert(service.handle(owner,"GET",{"chats"},Json::object()).empty());
  // Project AI: live contextual answers, strict project and user isolation.
  class TestChatProvider : public IntelligenceProvider {
  public:
    Json captured=Json::array();
    Json complete(const std::string &,const Json &,ProgressCallback = {}) override {
      return Json::object();
    }
    std::vector<double> embed(const std::string &) override { return {1.0,0.0}; }
    std::string chat(const Json &messages) override {
      captured=messages;
      return "This project is currently in progress.";
    }
    std::string mode() const override {return "live";}
    std::string embeddingModel() const override {return "test";}
  } live;
  Service projectService(db,live);
  db.query("INSERT INTO workspaces(id,name,owner_id,created_at) VALUES(?,?,?,?)",
           {"test-workspace","Work","u","1"});
  db.query("INSERT INTO workspace_members(workspace_id,user_id,role) VALUES(?,?,?)",
           {"test-workspace","u","owner"});
  db.query("INSERT INTO projects(id,workspace_id,name,description,created_by,created_at) "
           "VALUES(?,?,?,?,?,?)",{"test-project","test-workspace","Alpha project", "Welcome","u","1"});
  db.query("INSERT INTO tasks(id,project_id,title,status,priority,deadline,created_by,created_at) "
           "VALUES(?,?,?,?,?,?,?,?)",{"test-task","test-project","Prepare venue","backlog","high","","u","1"});
  db.query("INSERT INTO workspaces(id,name,owner_id,created_at) VALUES(?,?,?,?)",
           {"other-workspace","Other","other","1"});
  db.query("INSERT INTO workspace_members(workspace_id,user_id,role) VALUES(?,?,?)",
           {"other-workspace","other","owner"});
  db.query("INSERT INTO projects(id,workspace_id,name,description,created_by,created_at) "
           "VALUES(?,?,?,?,?,?)",{"other-project","other-workspace","SECRET OTHER PROJECT","Private","other","1"});
  auto projectChat=projectService.handle(owner,"POST",{"project-chats","test-project"},
                                          {{"title","Project status"}});
  auto projectChatId=projectChat["id"].get<std::string>();
  assert(projectService.handle(owner,"GET",{"project-chats","test-project"},Json::object()).size()==1);
  assert(projectService.handle(owner,"GET",{"project-chats","test-project",projectChatId,"messages"},Json::object()).empty());
  denied=false;
  try { projectService.handle(outsider,"GET",{"project-chats","test-project"},Json::object()); }
  catch(const Error &e) { denied=(e.status==403||e.status==404); }
  assert(denied);
  denied=false;
  try { projectService.handle(outsider,"GET",{"project-chats","other-project",projectChatId,"messages"},Json::object()); }
  catch(const Error &e) { denied=(e.status==404); }
  assert(denied);
  auto projectAnswer=projectService.handle(owner,"POST",{"project-chats","test-project",projectChatId,"messages"},
                                           {{"content","What is pending?"}});
  assert(projectAnswer["reply"]=="This project is currently in progress.");
  const auto captured=live.captured.dump();
  assert(captured.find("Alpha project")!=std::string::npos);
  assert(captured.find("Prepare venue")!=std::string::npos);
  assert(captured.find("SECRET OTHER PROJECT")==std::string::npos);
  assert(projectService.handle(owner,"GET",{"project-chats","test-project",projectChatId,"messages"},Json::object()).size()==2);
  assert(projectService.handle(owner,"GET",{"chats"},Json::object()).empty());
  projectService.handle(owner,"DELETE",{"project-chats","test-project",projectChatId},Json::object());
  assert(db.query("SELECT id FROM project_chat_messages WHERE thread_id=?",{projectChatId}).empty());
  // Authentication 2.0 tests use an injected mailer: no real emails or keys.
  ::setenv("OTP_PEPPER", "local-unit-test-pepper-not-for-production-0123456789", 1);
  Database authDb(":memory:");
  std::ifstream authSchema(argv[1]);
  authDb.script(std::string(std::istreambuf_iterator<char>(authSchema), {}));
  std::string sentCode, sentMail, sentPurpose;
  Service authService(authDb, p, [&](const std::string& mail,
                                       const std::string& code,
                                       const std::string& purpose) {
    sentMail=mail; sentCode=code; sentPurpose=purpose;
  });
  auto pending=authService.registerUser({{"name","Test User"},
                                         {"email","otp@example.test"},
                                         {"password","abc123"}});
  assert(pending["verification_required"] == true);
  assert(sentPurpose=="register" && sentMail=="otp@example.test");
  assert(sentCode.size()==6);
  assert(authDb.query("SELECT id FROM users WHERE email=?",{"otp@example.test"}).empty());
  const auto wrongCode = sentCode == "000000" ? "999999" : "000000";
  bool badCode=false;
  try { authService.verifyRegistration({{"email","otp@example.test"},{"code",wrongCode}}); }
  catch(const Error& e) {badCode=(e.status==400);}
  assert(badCode);
  assert(authDb.query("SELECT attempts FROM auth_challenges WHERE email=?",
                      {"otp@example.test"})[0]["attempts"]=="1");
  assert(authService.verifyRegistration({{"email","otp@example.test"},{"code",sentCode}})["ok"]==true);
  assert(!authDb.query("SELECT id FROM users WHERE email=?",{"otp@example.test"}).empty());
  badCode=false;
  try { authService.verifyRegistration({{"email","otp@example.test"},{"code",sentCode}}); }
  catch(const Error& e) {badCode=(e.status==400);}
  assert(badCode); // One-time code cannot be replayed.
  std::string authToken;
  auto identity=authService.login({{"email","otp@example.test"},{"password","abc123"}},authToken);
  assert(identity["email"]=="otp@example.test");
  assert(authService.authenticate(authToken).email=="otp@example.test");
  sentCode.clear();
  authService.forgotPassword({{"email","unknown@example.test"}});
  assert(sentCode.empty()); // No user enumeration, no mail for nonexistent user.
  authService.forgotPassword({{"email","otp@example.test"}});
  assert(sentPurpose=="reset" && sentCode.size()==6);
  assert(authService.verifyResetCode({{"email","otp@example.test"},{"code",sentCode}})["ok"]==true);
  authService.resetPassword({{"email","otp@example.test"},{"code",sentCode},
                             {"new_password","new123"}});
  bool invalidOldSession=false;
  try {authService.authenticate(authToken);} catch(const Error& e) {invalidOldSession=e.status==401;}
  assert(invalidOldSession);
  bool oldPasswordFails=false;
  try {authService.login({{"email","otp@example.test"},{"password","abc123"}},authToken);}
  catch(const Error& e) {oldPasswordFails=e.status==401;}
  assert(oldPasswordFails);
  authService.login({{"email","otp@example.test"},{"password","new123"}},authToken);
  bool reused=false;
  try {authService.resetPassword({{"email","otp@example.test"},{"code",sentCode},
                                {"new_password","again12"}});}
  catch(const Error& e) {reused=e.status==400;}
  assert(reused);
  authService.forgotPassword({{"email","otp@example.test"}});
  const auto previousCode = sentCode;
  assert(authService.forgotPassword({{"email","otp@example.test"}})["ok"]==true);
  assert(sentCode==previousCode); // Cooldown sends no second email, no enumeration.
  // Verify expiry and lockout are enforced by durable DB state.
  authDb.query("UPDATE auth_challenges SET expires_at=? WHERE email=?",
               {std::to_string(now()-1),"otp@example.test"});
  bool expired=false;
  try {authService.verifyResetCode({{"email","otp@example.test"},{"code",sentCode}});}
  catch(const Error& e) {expired=e.status==400;}
  assert(expired);
  // Zero downstream runtime requirements for a new email provider in unit tests.
  std::cout << "Core tests passed: budget, vectors, agents, extraction, "
               "parameterization, transaction rollback\n";
}
