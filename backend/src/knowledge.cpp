#include "hi/knowledge.hpp"
#include <archive.h>
#include <archive_entry.h>
#include <cmath>
#include <filesystem>
#include <fstream>
#include <signal.h>
#include <sys/resource.h>
#include <sys/wait.h>
#include <thread>
#include <unistd.h>
namespace hi {
namespace {
std::string decode64(const std::string &s) {
  require(!s.empty() && s.size() % 4 == 0 && s.size() <= 2800000,
          "Invalid upload size");
  size_t padding = s.ends_with("==") ? 2 : (s.ends_with('=') ? 1 : 0);
  for (size_t i = 0; i < s.size() - padding; ++i) {
    unsigned char c = s[i];
    require((c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') ||
                (c >= '0' && c <= '9') || c == '+' || c == '/',
            "Invalid base64 upload");
  }
  std::string b(s.size() * 3 / 4, '\0');
  int n = EVP_DecodeBlock(reinterpret_cast<unsigned char *>(b.data()),
                          reinterpret_cast<const unsigned char *>(s.data()),
                          s.size());
  require(n >= 0, "Invalid base64");
  if (s.ends_with("=="))
    n -= 2;
  else if (s.ends_with('='))
    --n;
  b.resize(n);
  return b;
}
std::string docx(const std::string &bytes) {
  auto a = std::unique_ptr<archive, decltype(&archive_read_free)>(
      archive_read_new(), archive_read_free);
  archive_read_support_format_zip(a.get());
  require(archive_read_open_memory(a.get(), bytes.data(), bytes.size()) ==
              ARCHIVE_OK,
          "Invalid DOCX");
  archive_entry *entry;
  std::string xml;
  int entries = 0;
  while (archive_read_next_header(a.get(), &entry) == ARCHIVE_OK) {
    require(++entries <= 2000, "DOCX has too many entries");
    if (std::string(archive_entry_pathname(entry)) != "word/document.xml") {
      archive_read_data_skip(a.get());
      continue;
    }
    char b[8192];
    la_ssize_t n;
    while ((n = archive_read_data(a.get(), b, sizeof b)) > 0) {
      xml.append(b, n);
      require(xml.size() <= 2000000, "Expanded document too large");
    }
    require(n >= 0, "Invalid document archive");
    break;
  }
  require(!xml.empty(), "DOCX has no document content");
  std::string out;
  bool inTag = false;
  for (char c : xml) {
    if (c == '<') {
      inTag = true;
      out += ' ';
    } else if (c == '>')
      inTag = false;
    else if (!inTag)
      out += c;
  }
  for (auto [a, b] :
       std::vector<std::pair<std::string, std::string>>{{"&amp;", "&"},
                                                        {"&lt;", "<"},
                                                        {"&gt;", ">"},
                                                        {"&quot;", "\""},
                                                        {"&apos;", "'"}}) {
    size_t p = 0;
    while ((p = out.find(a, p)) != std::string::npos) {
      out.replace(p, a.size(), b);
      p += b.size();
    }
  }
  return out;
}
struct TempDirectory {
  std::filesystem::path path;
  TempDirectory() {
    path = std::filesystem::temp_directory_path() / ("hi-" + id());
    std::filesystem::create_directory(path);
    std::filesystem::permissions(path, std::filesystem::perms::owner_all);
  }
  ~TempDirectory() {
    std::error_code ec;
    std::filesystem::remove_all(path, ec);
  }
};
std::string pdf(const std::string &bytes) {
  require(bytes.starts_with("%PDF-"), "Invalid PDF signature");
  TempDirectory dir;
  auto in = dir.path / "input.pdf", out = dir.path / "output.txt";
  std::ofstream(in, std::ios::binary).write(bytes.data(), bytes.size());
  pid_t child = fork();
  require(child >= 0, "Document worker could not start", 503);
  if (child == 0) {
    rlimit cpu{8, 8}, file{2000000, 2000000},
        memory{512 * 1024 * 1024, 512 * 1024 * 1024};
    setrlimit(RLIMIT_CPU, &cpu);
    setrlimit(RLIMIT_FSIZE, &file);
    setrlimit(RLIMIT_AS, &memory);
    execlp("pdftotext", "pdftotext", "-q", "-layout", in.c_str(), out.c_str(),
           static_cast<char *>(nullptr));
    _exit(127);
  }
  int status = 0;
  bool done = false;
  for (int i = 0; i < 100; ++i) {
    if (waitpid(child, &status, WNOHANG) == child) {
      done = true;
      break;
    }
    std::this_thread::sleep_for(std::chrono::milliseconds(100));
  }
  if (!done) {
    kill(child, SIGKILL);
    waitpid(child, &status, 0);
    throw Error(400, "PDF extraction timed out");
  }
  require(WIFEXITED(status) && WEXITSTATUS(status) == 0,
          "Cannot extract PDF; use an unencrypted text PDF");
  std::ifstream f(out);
  return std::string(std::istreambuf_iterator<char>(f), {});
}
} // namespace
std::string KnowledgeService::extract(const std::string &name,
                                      const std::string &bytes) {
  auto ext = lower(std::filesystem::path(name).extension().string());
  require(bytes.size() <= 2000000, "Maximum upload size is 2 MB");
  std::string content;
  if (ext == ".txt" || ext == ".md") {
    require(bytes.find('\0') == std::string::npos,
            "Text file contains binary data");
    content = bytes;
  } else if (ext == ".pdf")
    content = pdf(bytes);
  else if (ext == ".docx") {
    require(bytes.starts_with("PK"), "Invalid DOCX signature");
    content = docx(bytes);
  } else
    throw Error(400, "Supported files: TXT, MD, PDF and DOCX");
  require(!content.empty() && content.size() <= 2000000,
          "Document is empty or too large; scanned PDFs require OCR first");
  try {
    Json j = content;
    j.dump();
  } catch (...) {
    throw Error(400, "Document must contain UTF-8 text");
  }
  return content;
}
Json KnowledgeService::upload(const std::string &project,
                              const std::string &user, const Json &input) {
  std::string name = field(input, "name", 180);
  require(name.find('/') == std::string::npos &&
              name.find('\\') == std::string::npos,
          "Use a filename without a path");
  auto content = extract(name, decode64(field(input, "base64", 2800000)));
  require(content.size() <= 120000,
          "Extracted text limited to 120,000 bytes per document");
  auto count = db_.query(
      "SELECT COUNT(*) AS n FROM documents WHERE project_id=?", {project});
  require(number(count[0], "n") < 50, "Project document limit reached", 409);
  std::vector<Json> chunks;
  for (size_t offset = 0; offset < content.size();) {
    size_t end = std::min(offset + 1800, content.size());
    while (end < content.size() &&
           (static_cast<unsigned char>(content[end]) & 0xC0) == 0x80)
      ++end;
    auto chunk = content.substr(offset, end - offset);
    chunks.push_back({{"content", chunk}, {"vector", provider_.embed(chunk)}});
    if (end == content.size())
      break;
    offset = end - 200;
    while (offset < end &&
           (static_cast<unsigned char>(content[offset]) & 0xC0) == 0x80)
      ++offset;
  }
  Transaction tx(db_);
  auto document = id();
  db_.query("INSERT INTO "
            "documents(id,project_id,name,mime,content,created_by,created_at) "
            "VALUES(?,?,?,?,?,?,?)",
            {document, project, name,
             std::filesystem::path(name).extension().string(), content, user,
             std::to_string(now())});
  int index = 0;
  for (auto &c : chunks)
    db_.query("INSERT INTO "
              "document_embeddings(id,document_id,chunk_index,content,vector,"
              "model) VALUES(?,?,?,?,?,?)",
              {id(), document, std::to_string(index++),
               c["content"].get<std::string>(), c["vector"].dump(),
               provider_.embeddingModel()});
  tx.commit();
  return {{"id", document},
          {"name", name},
          {"chunks", chunks.size()},
          {"model", provider_.embeddingModel()}};
}
Json KnowledgeService::search(const std::string &project,
                              const std::string &query) {
  auto q = provider_.embed(query);
  auto model=provider_.embeddingModel();
  auto manifest=db_.query("SELECT e.id FROM document_embeddings e JOIN documents d ON d.id=e.document_id WHERE d.project_id=? AND e.model=? ORDER BY e.id",{project,model});
  auto signature=manifest.dump();
  auto key=project+":"+model;
  std::shared_ptr<CachedIndex> cached;
  {
    std::lock_guard lock(indexMutex_);
    auto found=indexes_.find(key);
    if(found!=indexes_.end() && found->second->signature==signature)cached=found->second;
    else {
      auto chunks=db_.query("SELECT e.*,d.name FROM document_embeddings e JOIN documents d ON d.id=e.document_id WHERE d.project_id=? AND e.model=? ORDER BY e.id",{project,model});
      std::vector<std::vector<double>> vectors;
      for(const auto& c:chunks)vectors.push_back(Json::parse(text(c,"vector")).get<std::vector<double>>());
      cached=std::make_shared<CachedIndex>(signature,std::move(chunks),vectors);
      if(indexes_.size()>=8)indexes_.erase(indexes_.begin());
      indexes_[key]=cached;
    }
  }
  Json out=Json::array();
  for(auto [row,score]:cached->index.search(q)) {
    if(score<=0.01)continue;
    const auto& c=cached->chunks[row];
    out.push_back({{"document_id",c["document_id"]},{"name",c["name"]},
      {"chunk_index",number(c,"chunk_index")},{"content",c["content"]},{"score",score}});
  }
  return out;
}
} // namespace hi
