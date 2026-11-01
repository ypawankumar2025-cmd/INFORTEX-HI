import { useEffect, useRef, useState } from "react";
import { MessageCircle, Plus, Send, Trash2, Bot, User } from "lucide-react";
import MarkdownMessage, { CopyText } from "../components/MarkdownMessage";
import { api } from "../services/api";

type Thread = { id: string; title: string; updated_at: string };
type ChatMessage = { id: string; role: "user" | "assistant"; content: string };

export default function AIChat({ mode }: { mode: string }) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const tail = useRef<HTMLDivElement>(null);
  const listThreads = async () => setThreads(await api<Thread[]>("chats"));

  useEffect(() => {
    listThreads().catch(e => setError((e as Error).message));
  }, []);
  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    api<ChatMessage[]>(`chats/${activeId}/messages`)
      .then(rows => { if (!cancelled) setMessages(rows); })
      .catch(e => { if (!cancelled) setError((e as Error).message); });
    return () => { cancelled = true; };
  }, [activeId]);
  useEffect(() => { tail.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, busy]);

  const sendMessage = async () => {
    const content = draft.trim();
    if (!content || busy || mode !== "live") return;
    if (new TextEncoder().encode(content).length > 4000) {
      setError("Message too long. Use 4,000 UTF-8 bytes or fewer."); return;
    }
    setError("");
    setDraft("");
    setBusy(true);
    const previous = messages;
    setMessages([...previous, { id: "pending", role: "user", content }]);
    try {
      let id = activeId;
      if (!id) {
        const created = await api<{ id: string }>("chats", "POST", {
          title: Array.from(content).slice(0, 28).join(""),
        });
        id = created.id;
        setActiveId(id);
      }
      await api(`chats/${id}/messages`, "POST", { content });
      setMessages(await api<ChatMessage[]>(`chats/${id}/messages`));
      await listThreads();
    } catch (e) {
      setMessages(previous);
      setDraft(content);
      setError((e as Error).message);
    } finally { setBusy(false); }
  };
  const removeThread = async (id: string) => {
    if (busy || !confirm("Delete this conversation permanently?")) return;
    setBusy(true); setError("");
    try {
      await api(`chats/${id}`, "DELETE");
      if (id === activeId) { setActiveId(null); setMessages([]); }
      await listThreads();
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };
  return (
    <div className="hi-chat-page">
      <div className="hi-chat-heading">
        <span className="hi-chat-eyebrow">HUMAN INTELLIGENCE · CONVERSATIONS</span>
        <h1><MessageCircle size={28}/> HI AI Chat</h1>
        <p>Ask questions, learn coding, brainstorm ideas, or just talk. Your conversations stay in your account.</p>
      </div>
      {mode !== "live" && <div className="hi-chat-alert">AI Chat needs live mode. Set AI_MODE=live on the C++ backend to enable real responses.</div>}
      {error && <div className="hi-chat-alert" role="alert">{error}</div>}
      <div className="hi-chat-shell">
        <aside className="hi-chat-history" aria-label="Chat history">
          <button className="hi-chat-new" onClick={() => { if (!busy) { setActiveId(null); setMessages([]); setError(""); } }} disabled={busy}>
            <Plus size={16}/> New chat
          </button>
          <div className="hi-chat-history-list">
            {threads.map(t => (
              <div className={"hi-chat-thread " + (activeId === t.id ? "selected" : "")} key={t.id}>
                <button disabled={busy} onClick={() => { setActiveId(t.id); setMessages([]); setError(""); }} title={t.title}>{t.title}</button>
                <button className="hi-chat-delete" disabled={busy} onClick={() => removeThread(t.id)} aria-label={`Delete ${t.title}`} title="Delete conversation"><Trash2 size={15}/></button>
              </div>
            ))}
            {!threads.length && <p className="hi-chat-empty-history">No saved conversations yet.</p>}
          </div>
        </aside>
        <section className="hi-chat-main" aria-label="AI conversation">
          <div className="hi-chat-transcript" aria-live="polite">
            {!messages.length && !busy ? (
              <div className="hi-chat-welcome">
                <Bot size={34}/>
                <h2>What's on your mind?</h2>
                <p>Ask in English, Telugu-English, or another language. I'll reply naturally.</p>
                <p className="hi-chat-caption">Powered by the AI provider you configured. Free models have daily rate limits and variable quality.</p>
              </div>
            ) : messages.map((m, i) => (
              <div className={"hi-chat-message " + (m.role === "user" ? "from-user" : "from-ai")} key={m.id + "-" + i}>
                <div className="hi-chat-avatar">{m.role === "user" ? <User size={16}/> : <Bot size={16}/>}</div>
                <div className="hi-chat-bubble">
                  {m.role === "assistant" ? <>
                    <MarkdownMessage content={m.content}/>
                    <div className="hi-chat-response-actions"><CopyText text={m.content} label="Copy AI response" /></div>
                  </> : m.content}
                </div>
              </div>
            ))}
            {busy && <div className="hi-chat-thinking"><Bot size={16}/> AI is thinking…</div>}
            <div ref={tail}/>
          </div>
          <form className="hi-chat-composer" onSubmit={e => { e.preventDefault(); void sendMessage(); }}>
            <label htmlFor="hi-chat-draft">Message HI</label>
            <div className="hi-chat-compose-row">
              <textarea id="hi-chat-draft" rows={2} value={draft} disabled={busy || mode !== "live"}
                onChange={e => setDraft(e.target.value)} placeholder="Ask anything… e.g. Explain Java OOP simply in Telugu-English"
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendMessage(); } }}/>
              <button className="hi-chat-send" type="submit" disabled={!draft.trim() || busy || mode !== "live"} aria-label="Send message"><Send size={19}/></button>
            </div>
            <p className="hi-chat-caption">Enter to send · Shift+Enter for newline · AI can make mistakes. Avoid sharing secrets.</p>
          </form>
        </section>
      </div>
    </div>
  );
}
