#pragma once
#include "common.hpp"
#include "stream.hpp"
#include <memory>
namespace hi {
class IntelligenceProvider {
public:
  virtual ~IntelligenceProvider() = default;
  virtual Json complete(const std::string &instructions,
                        const Json &context, ProgressCallback progress = {}) = 0;
  virtual std::vector<double> embed(const std::string &content) = 0;
  virtual std::string chat(const Json &messages) = 0;
  virtual std::string mode() const = 0;
  virtual std::string embeddingModel() const = 0;
};
class OpenAICompatibleProvider final : public IntelligenceProvider {
  std::string key_, base_, model_, embedding_;
  Json post(const std::string &path, const Json &payload, ProgressCallback progress = {});

public:
  OpenAICompatibleProvider();
  Json complete(const std::string &, const Json &, ProgressCallback progress = {}) override;
  std::vector<double> embed(const std::string &) override;
  std::string chat(const Json &messages) override;
  std::string mode() const override { return "live"; }
  std::string embeddingModel() const override { return embedding_; }
};
class DemoProvider final : public IntelligenceProvider {
public:
  Json complete(const std::string &, const Json &, ProgressCallback progress = {}) override;
  std::vector<double> embed(const std::string &) override;
  std::string chat(const Json &) override;
  std::string mode() const override { return "demo"; }
  std::string embeddingModel() const override { return "demo-lexical-hash-v1"; }
};
std::unique_ptr<IntelligenceProvider> makeProvider();
double cosine(const std::vector<double> &, const std::vector<double> &);
} // namespace hi
