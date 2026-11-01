import { useEffect, useRef, useState } from "react";
import { Bot, BriefcaseBusiness, Plus, Send, Trash2, User } from "lucide-react";
import MarkdownMessage, { CopyText } from "../components/MarkdownMessage";
import { api, type Row } from "../services/api";

type Thread = { id: string; title: string };
type Message = { id: string; role: "user" | "assistant"; content: string };

type Props = {
  mode: string;
  projects: Row[];
  projectId: string;
  onSelectProject: (id: string) => void;
};

/** Project-scoped conversations; general AI Chat is intentionally untouched. */
export default function ProjectAI({ mode, projects, projectId, onSelectProject }: Props) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const tail = useRef<HTMLDivElement>(null);
  const base = `project-chats/${projectId}`;
  const project = projects.find(p => p.id === projectId);

  const list = async () => setThreads(await api<Thread[]>(base));
  useEffect(() => {
    setActiveId(null); setMessages([]); setThreads([]); setDraft(""); setError("");
    if (!projectId) return;
    let canceled = false;
    api<Thread[]>(`project-chats/${projectId}`).then(result => {
      if (!canceled) setThreads(result);
    }).catch(e => { if (!canceled) setError((e as Error).message); });
    return () => { canceled = true; };
  }, [projectId]);
  useEffect(() => {
    if (!activeId || !projectId) return;
    let canceled = false;
    api<Message[]>(`project-chats/${projectId}/${activeId}/messages`).then(result => {
      if (!canceled) setMessages(result);
    }).catch(e => { if (!canceled) setError((e as Error).message); });
    return () => { canceled = true; };
  }, [activeId, projectId]);
  useEffect(() => { tail.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, busy]);

  const send = async () => {
    const content = draft.trim();
    if (!content || busy || !projectId || mode !== "live") return;
    if (new TextEncoder().encode(content).length > 4000) {
      setError("Please use 4,000 UTF-8 bytes or fewer per message."); return;
    }
    setBusy(true); setError(""); setDraft("");
    const old = messages;
    setMessages([...old, { id: "pending", role: "user", content }]);
    try {
      let id = activeId;
      if (!id) {
        const created = await api<{ id: string }>(base, "POST", { title: Array.from(content).slice(0, 45).join("") });
        id = created.id;
        setActiveId(id);
      }
      await api(`${base}/${id}/messages`, "POST", { content });
      setMessages(await api<Message[]>(`${base}/${id}/messages`));
      await list();
    } catch (e) {
      setMessages(old); setDraft(content); setError((e as Error).message);
    } finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    if (busy || !window.confirm("Delete this project's private conversation?")) return;
    setBusy(true); setError("");
    try {
      await api(`${base}/${id}`, "DELETE");
      if (id === activeId) { setActiveId(null); setMessages([]); }
      await list();
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };


  return (
    <div className="hi-chat-page project-ai-page">
      <div className="hi-chat-heading">
        <span className="hi-chat-eyebrow">HUMAN INTELLIGENCE · PROJECT CONTEXT</span>
        <h1><BriefcaseBusiness size={28}/> HI Project AI</h1>
        <p>Ask about your project status, tasks, deadlines, team, and uploaded documents. General AI Chat stays separate.</p>
      </div>
      <div className="project-ai-toolbar">
        <label htmlFor="project-ai-picker">Current project</label>
        <select id="project-ai-picker" value={projectId} disabled={busy}
          onChange={e => onSelectProject(e.target.value)}>
          {!projects.length && <option value="">No projects yet</option>}
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <span className="project-ai-context-pill">Read-only project insight · {project?.name || "Choose a project"}</span>
      </div>
      {mode !== "live" && <div className="hi-chat-alert">Project AI needs AI_MODE=live in your C++ backend.</div>}
      {!projectId && <div className="hi-chat-alert">Create or choose a project first. Normal AI Chat works without one.</div>}
      {error && <div className="hi-chat-alert" role="alert">{error}</div>}
      <div className="hi-chat-shell">
        <aside className="hi-chat-history" aria-label="Project chat history">
          <button className="hi-chat-new" disabled={busy || !projectId} onClick={() => {
            setActiveId(null); setMessages([]); setDraft(""); setError("");
          }}><Plus size={16}/> New project chat</button>
          <div className="hi-chat-history-list">
            {threads.map(t => <div className={"hi-chat-thread " + (activeId === t.id ? "selected" : "")} key={t.id}>
              <button disabled={busy} title={t.title} onClick={() => { setActiveId(t.id); setMessages([]); setError(""); }}>{t.title}</button>
              <button className="hi-chat-delete" aria-label={`Delete ${t.title}`} disabled={busy} onClick={() => void remove(t.id)}><Trash2 size={15}/></button>
            </div>)}
            {!threads.length && <p className="hi-chat-empty-history">No project conversations yet.</p>}
          </div>
          <div className="project-ai-info">🔒 This chat uses only the selected project's data. Other projects and personal AI chats are not included.</div>
        </aside>
        <section className="hi-chat-main" aria-label="Project AI conversation">
          <div className="hi-chat-transcript" aria-live="polite">
            {!messages.length && !busy ? <div className="hi-chat-welcome">
              <BriefcaseBusiness size={34}/>
              <h2>Let's understand your project.</h2>
              <p>Try: “What's pending?”, “Explain my project in detail”, or “Which risks should I handle first?”</p>
              <p className="hi-chat-caption">Answers use a limited, current snapshot of your authorized project. Uploaded document excerpts and project data are sent to your configured AI provider.</p>
            </div> : messages.map((m, i) => <div key={`${m.id}-${i}`} className={"hi-chat-message " + (m.role === "user" ? "from-user" : "from-ai")}>
              <div className="hi-chat-avatar">{m.role === "user" ? <User size={16}/> : <Bot size={16}/>}</div>
              <div className="hi-chat-bubble">
                  {m.role === "assistant" ? <>
                    <MarkdownMessage content={m.content}/>
                    <div className="hi-chat-response-actions"><CopyText text={m.content} label="Copy AI response" /></div>
                  </> : m.content}
                </div>
            </div>)}
            {busy && <div className="hi-chat-thinking"><Bot size={16}/> Working with project context…</div>}
            <div ref={tail}/>
          </div>
          <form className="hi-chat-composer" onSubmit={e => { e.preventDefault(); void send(); }}>
            <label htmlFor="project-ai-draft">Ask HI about {project?.name || "your project"}</label>
            <div className="hi-chat-compose-row">
              <textarea id="project-ai-draft" rows={2} value={draft} disabled={busy || mode !== "live" || !projectId}
                onChange={e => setDraft(e.target.value)}
                placeholder="Explain my project status and pending tasks in Telugu-English…"
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}/>
              <button type="submit" className="hi-chat-send" aria-label="Ask Project AI" disabled={!draft.trim() || busy || mode !== "live" || !projectId}><Send size={19}/></button>
            </div>
            <p className="hi-chat-caption">Project AI answers questions using your selected project context. No Agent Team workflow starts from this page, and AI suggestions do not change tasks automatically.</p>
          </form>
        </section>
      </div>
    </div>
  );
}
