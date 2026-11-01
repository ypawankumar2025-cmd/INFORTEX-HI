#pragma once
#include "agents.hpp"
#include "knowledge.hpp"
namespace hi {
struct Identity {
  std::string id, name, email;
  bool admin = false;
};
class Service : public Repository {
  IntelligenceProvider &provider_;
  KnowledgeService knowledge_;
  AgentCommunicationManager communication_;
  ExecutionPipeline pipeline_;
  Json member(const Identity &, const std::string &workspace,
              bool write = false, bool manage = false);
  Json project(const Identity &, const std::string &project, bool write = false,
               bool manage = false);
  void audit(const Identity &, const std::string &, const std::string &,
             const std::string &);
  void notify(const std::string &user, const std::string &message);
  void executeRun(std::string run, Json input, std::string workspace);
  Json startRun(const Identity &, const std::string &project, const Json &);
  Json approve(const Identity &, const std::string &run, const Json &);
  void checkTask(const Json &input, const std::string &workspace,
                 const std::string &project, const std::string &task);

public:
  Service(Database &, IntelligenceProvider &);
  Identity authenticate(const std::string &token);
  Json registerUser(const Json &);
  Json login(const Json &, std::string &token);
  void logout(const std::string &token);
  Json handle(const Identity &, const std::string &method,
              const std::vector<std::string> &path, const Json &input);
  Json health() const {
    return {{"status", "ok"},
            {"web_research",provider_.mode()=="live"&&!env("BRAVE_SEARCH_API_KEY").empty()},
            {"streaming",provider_.mode()=="live"&&env("LLM_STREAMING","false")=="true"},
            {"mode", provider_.mode()},
            {"embedding_model", provider_.embeddingModel()}};
  }
};
} // namespace hi
