import { useEffect, useState, useCallback, type ReactNode } from "react";
import {
  LayoutDashboard,
  Layers3,
  FolderKanban,
  Sparkles,
  Network,
  BookOpen,
  CheckSquare,
  Users,
  BarChart3,
  Bell,
  Settings,
  Shield,
  LogOut,
  Plus,
  ArrowUpRight,
  ArrowRight,
  ChevronRight,
  Search,
  FileText,
  Send,
  RefreshCw,
  Check,
  X,
  Download,
  Upload,
  Menu,
  Clock,
  MoreHorizontal,
  User,
  Activity,
  Trash2,
  MessageCircle,
  Palette,
} from "lucide-react";
import Auth from "./pages/Auth";
import AIChat from "./pages/AIChat";
import ProjectAI from "./pages/ProjectAI";
import ThemeStudio from "./components/ThemeStudio";
import { type ThemeId, DEFAULT_THEME, readSavedTheme, applyTheme, saveTheme } from "./theme-system";
import {
  api,
  Row,
  statuses,
  statusLabel,
  date,
  rupees,
  progress,
  download,
  streamingSummary,
} from "./services/api";
import {
  Badge,
  Status,
  Empty,
  Panel,
  Stat,
  PageHead,
  Modal,
  Form,
  Input,
  Textarea,
} from "./components/ui";
const navigation = [
  ["dashboard", "Overview", LayoutDashboard],
  ["workspace", "Workspace", Layers3],
  ["project", "Project details", FolderKanban],
  ["studio", "Intelligence studio", Sparkles],
  ["chat", "AI Chat", MessageCircle],
  ["project-ai", "Project AI", Sparkles],
  ["agents", "Agent control", Network],
  ["knowledge", "Knowledge hub", BookOpen],
  ["tasks", "Tasks & milestones", CheckSquare],
  ["team", "Team collaboration", Users],
  ["analytics", "Analytics", BarChart3],
  ["themes", "Themes", Palette],
] as const;
const secondary = [
  ["notifications", "Notifications", Bell],
  ["profile", "My profile", User],
  ["settings", "Settings", Settings],
  ["admin", "Administration", Shield],
] as const;
const agentMeta: Record<string, { color: string; desc: string }> = {
  orchestrator: {
    color: "#6e8bff",
    desc: "Connects the dots. Coordinates the entire team.",
  },
  planning: {
    color: "#b996ff",
    desc: "Turns ambitious goals into actionable steps.",
  },
  research: {
    color: "#64c9ff",
    desc: "Examines evidence and surfaces information gaps.",
  },
  knowledge: {
    color: "#65d5c2",
    desc: "Finds the right context in your documents.",
  },
  finance: {
    color: "#efc67c",
    desc: "Makes constraints and budget trade-offs clear.",
  },
  execution: {
    color: "#fa9f85",
    desc: "Creates tasks after your explicit approval.",
  },
  critic: {
    color: "#e895c9",
    desc: "Challenges assumptions. Raises the standard.",
  },
  memory: {
    color: "#99b1ce",
    desc: "Keeps project decisions and context connected.",
  },
};
function AgentIcon({ name }: { name: string }) {
  return (
    <span
      className="agent-icon"
      style={
        {
          "--agent-color": agentMeta[name]?.color || "#879cff",
        } as React.CSSProperties
      }
    >
      <Network size={20} />
    </span>
  );
}
export default function App() {
  const [theme, setTheme] = useState<ThemeId>(() => readSavedTheme());
  useEffect(() => { applyTheme(theme); saveTheme(theme); }, [theme]);
  const [user, setUser] = useState<Row | null>(null),
    [loading, setLoading] = useState(true),
    [health, setHealth] = useState<Row>({});
  const [page, setPage] = useState("dashboard"),
    [mobile, setMobile] = useState(false),
    [workspaces, setWorkspaces] = useState<Row[]>([]),
    [wid, setWid] = useState(""),
    [projects, setProjects] = useState<Row[]>([]),
    [pid, setPid] = useState("");
  const [tasks, setTasks] = useState<Row[]>([]),
    [agents, setAgents] = useState<Row[]>([]),
    [members, setMembers] = useState<Row[]>([]),
    [runs, setRuns] = useState<Row[]>([]),
    [documents, setDocuments] = useState<Row[]>([]),
    [comments, setComments] = useState<Row[]>([]),
    [milestones, setMilestones] = useState<Row[]>([]),
    [memories, setMemories] = useState<Row[]>([]),
    [analytics, setAnalytics] = useState<Row>({}),
    [notifications, setNotifications] = useState<Row[]>([]),
    [activity, setActivity] = useState<Row[]>([]),
    [admin, setAdmin] = useState<Row>({});
  const [modal, setModal] = useState(""),
    [edit, setEdit] = useState<Row>({}),
    [error, setError] = useState(""),
    [toast, setToast] = useState(""),
    [busy, setBusy] = useState(false),
    [run, setRun] = useState<Row | null>(null),
    [webResearch, setWebResearch] = useState(false),
    [searchQuery, setSearchQuery] = useState(""),
    [prompt, setPrompt] = useState(""),
    [agent, setAgent] = useState("multi"),
    [event, setEvent] = useState(false),
    [budget, setBudget] = useState("50000"),
    [people, setPeople] = useState("300"),
    [feedback, setFeedback] = useState(""),
    [search, setSearch] = useState(""),
    [searchResults, setSearchResults] = useState<Row[] | null>(null),
    [invite, setInvite] = useState(""),
    [taskFilter, setTaskFilter] = useState("");
  const current = projects.find((p) => p.id === pid),
    workspace = workspaces.find((w) => w.id === wid),
    manage = ["owner", "admin"].includes(workspace?.role),
    canWrite = workspace?.role !== "viewer";
  const reloadWorkspace = useCallback(async () => {
    if (!wid) return;
    const [p, a, m, n, stats, logs] = await Promise.all([
      api(`workspaces/${wid}/projects`),
      api(`workspaces/${wid}/agents`),
      api(`workspaces/${wid}/members`),
      api("notifications"),
      api(`workspaces/${wid}/analytics`),
      api(`workspaces/${wid}/activity`),
    ]);
    setProjects(p);
    setAgents(a);
    setMembers(m);
    setNotifications(n);
    setAnalytics(stats);
    setActivity(logs);
    setPid((old) => (p.some((x: Row) => x.id === old) ? old : p[0]?.id || ""));
  }, [wid]);
  const reloadProject = useCallback(async () => {
    if (!pid) return;
    const [t, r, d, c, m, mem] = await Promise.all(
      ["tasks", "runs", "documents", "comments", "milestones", "memories"].map(
        (x) => api(`projects/${pid}/${x}`),
      ),
    );
    setTasks(t);
    setRuns(r);
    setDocuments(d);
    setComments(c);
    setMilestones(m);
    setMemories(mem);
  }, [pid]);
  const reloadAll = async () => {
    await Promise.all([reloadWorkspace(), reloadProject()]);
  };
  const act = async (
    fn: () => Promise<void>,
    message = "Saved successfully",
  ) => {
    setError("");
    setBusy(true);
    try {
      await fn();
      if (message) {
        setToast(message);
        setTimeout(() => setToast(""), 4000);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const open = (name: string, row: Row = {}) => {
    setEdit(row);
    setModal(name);
    setInvite("");
  };
  const navigate = (p: string) => {
    setPage(p);
    setMobile(false);
    setError("");
  };
  useEffect(() => {
    Promise.all([
      api("health").then(setHealth),
      api("me")
        .then(setUser)
        .catch(() => {}),
    ])
      .catch(() => setHealth({}))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (!user) return;
    api("workspaces")
      .then((w) => {
        setWorkspaces(w);
        setWid((old) =>
          w.some((x: Row) => x.id === old) ? old : w[0]?.id || "",
        );
      })
      .catch((e) => setError(e.message));
  }, [user]);
  useEffect(() => {
    setProjects([]);
    setPid("");
    reloadWorkspace().catch((e) => setError(e.message));
  }, [wid, reloadWorkspace]);
  useEffect(() => {
    setRun(null);
    setTasks([]);
    setRuns([]);
    setDocuments([]);
    setComments([]);
    setMilestones([]);
    setMemories([]);
    setSearchResults(null);
    reloadProject().catch((e) => setError(e.message));
  }, [pid, reloadProject]);
  useEffect(() => {
    if (!run || !["queued", "running"].includes(run.status)) return;
    const timer = setInterval(() => {
      api(`runs/${run.id}`)
        .then((r) => {
          setRun(r);
          if (!["queued", "running"].includes(r.status)) void reloadAll();
        })
        .catch((e) => setError(e.message));
    }, 1200);
    return () => clearInterval(timer);
  }, [run?.id, run?.status, pid, wid]);
  useEffect(() => {
    if (page === "admin" && user?.admin)
      api("admin")
        .then(setAdmin)
        .catch((e) => setError(e.message));
  }, [page, user]);
  if (loading)
    return (
      <div className="loading-screen">
        <span className="logo">
          hi<span>•</span>
        </span>
        <p>Connecting your workspace…</p>
      </div>
    );
  if (!user) return <Auth health={health} onLogin={setUser} />;
  const projectRequired =
    ["project", "studio", "knowledge", "tasks", "team"].includes(page) && !pid;
  const taskModal = (
    <Form
      label={edit.id ? "Save task" : "Create task"}
      onSubmit={async (data) => {
        const deps = data.depends_on ? [data.depends_on] : [];
        const payload = { ...data, dependencies: deps };
        await api(
          `projects/${pid}/tasks${edit.id ? "/" + edit.id : ""}`,
          edit.id ? "PATCH" : "POST",
          payload,
        );
        setModal("");
        await reloadAll();
      }}
    >
      <Input name="title" label="Task title" value={edit.title} />
      <Textarea
        name="description"
        label="Description"
        value={edit.description}
      />
      <div className="form-grid">
        <label className="field">
          Status
          <select name="status" defaultValue={edit.status || "backlog"}>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Priority
          <select name="priority" defaultValue={edit.priority || "medium"}>
            {["low", "medium", "high"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="field">
          Assignee
          <select name="assignee" defaultValue={edit.assignee || ""}>
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
        <Input
          name="deadline"
          label="Deadline"
          type="date"
          required={false}
          value={edit.deadline}
        />
      </div>
      <label className="field">
        Prerequisite task
        <select
          name="depends_on"
          defaultValue={edit.dependencies?.[0]?.depends_on || ""}
        >
          <option value="">No prerequisite</option>
          {tasks
            .filter((t) => t.id !== edit.id)
            .map((t) => (
              <option value={t.id} key={t.id}>
                {t.title}
              </option>
            ))}
        </select>
      </label>
      {edit.dependencies?.length > 1 && (
        <p className="muted">
          Saving this form replaces the existing prerequisite set with this
          selection. The API supports multiple prerequisites.
        </p>
      )}
    </Form>
  );
  const review = async (status: string) => {
    if (!run) return;
    await api(`runs/${run.id}/review`, "POST", { status, feedback });
    setRun(await api(`runs/${run.id}`));
    await reloadAll();
  };
  const start = async () => {
    const r = await api(`projects/${pid}/runs`, "POST", {
      prompt,
      ...(webResearch && health.web_research ? { web_research: true, search_query: searchQuery } : {}),
      agent,
      event,
      ...(event ? { budget: Number(budget), people: Number(people) } : {}),
      ...(run?.conversation_id ? { conversation_id: run.conversation_id } : {}),
    });
    setRun(await api(`runs/${r.id}`));
    await reloadProject();
  };
  let content: ReactNode;
  if (projectRequired)
    content = (
      <>
        <PageHead
          eyebrow="YOUR WORKSPACE"
          title="Every idea starts somewhere."
          subtitle="Create a project to give your team and agents a shared context."
        />
        <Empty
          title="Create your first project"
          action={
            <button className="button primary" onClick={() => open("project")}>
              Create project <Plus size={16} />
            </button>
          }
        >
          Projects keep conversations, documents, and tasks together.
        </Empty>
      </>
    );
  else if (page === "chat")
    content = <AIChat mode={health.mode || "demo"} />;
  else if (page === "project-ai")
    content = <ProjectAI
      mode={health.mode || "demo"}
      projects={projects}
      projectId={pid}
      onSelectProject={setPid}

    />;
  else if (page === "dashboard")
    content = (
      <>
        <PageHead
          eyebrow="YOUR WORKSPACE, IN FOCUS"
          title={`Good to see you, ${user.name.split(" ")[0]}.`}
          subtitle="A little human direction. A lot of collective possibility."
          action={
            <button
              className="button primary"
              onClick={() => {
                if (pid) navigate("studio");
                else open("project");
              }}
            >
              <Plus size={16} /> Start something new
            </button>
          }
        />
        <div className={`welcome-banner hi-theme-hero hi-hero-${theme}`}>
          <div className="hi-hero-copy">
            <Badge tone="blue"><Sparkles size={12} /> HUMAN + AI · BETTER TOGETHER</Badge>
            <h2>One idea.<span> Many perspectives.</span></h2>
            <p>Bring your next challenge to the intelligence studio. Your agents will plan, question, and connect the dots.</p>
            <button className="text-button light" onClick={() => navigate("studio")}>
              OPEN INTELLIGENCE STUDIO <ArrowRight size={16} />
            </button>
          </div>
          <div className="hi-hero-decoration" aria-hidden="true">
            {theme === "chocolate" && <><div className="hi-cocoa-orb"/><div className="hi-cocoa-card">THE ART OF<br/><b>GOOD IDEAS</b><small>crafted thoughtfully</small></div></>}
            {theme === "noir" && <><div className="hi-noir-ring"/><div className="hi-noir-tile"><Sparkles size={88}/></div></>}
            {theme === "sunshine" && <><div className="hi-photo-tape"/><div className="hi-polaroid"><div className="hi-polaroid-photo"/><span>Humans + AI, together ✦</span></div><div className="hi-sun-note">Dream big.<br/>Build better. ☀</div><span className="hi-doodle-star">✳</span></>}
            {theme === "sage" && <><div className="hi-terrarium"><div className="hi-terrarium-leaf leaf-one"/><div className="hi-terrarium-leaf leaf-two"/><div className="hi-terrarium-leaf leaf-three"/><div className="hi-terrarium-leaf leaf-four"/><div className="hi-terrarium-stem"/><div className="hi-terrarium-ground"/></div><span className="hi-sage-slogan">Grow ideas<br/>with intention.</span></>}
          </div>
        </div>
        <div className="stats-grid">
          <Stat
            label="Projects"
            value={projects.length}
            detail="In your current workspace"
          />
          <Stat
            label="Completed tasks"
            value={
              analytics.tasks?.find((x: Row) => x.status === "done")?.count || 0
            }
            detail="Across workspace projects"
          />
          <Stat
            label="Agent executions"
            value={
              analytics.agents?.reduce(
                (s: number, a: Row) => s + Number(a.executions),
                0,
              ) || 0
            }
            detail="Recorded backend activity"
          />
          <Stat
            label="Your team"
            value={members.length}
            detail="People thinking together"
          />
        </div>
        <div className="two-column">
          <Panel
            title="Your projects"
            action={
              <button
                className="text-button"
                onClick={() => navigate("workspace")}
              >
                View all <ArrowUpRight size={14} />
              </button>
            }
          >
            {projects.length ? (
              <div className="project-list">
                {projects.slice(0, 4).map((p, i) => (
                  <button
                    key={p.id}
                    className="project-row"
                    onClick={() => {
                      setPid(p.id);
                      navigate("project");
                    }}
                  >
                    <span className={"project-symbol color" + (i % 3)}>
                      <FolderKanban size={19} />
                    </span>
                    <div>
                      <strong>{p.name}</strong>
                      <small>
                        {p.description || "A space for your next idea"}
                      </small>
                    </div>
                    <ChevronRight size={16} />
                  </button>
                ))}
              </div>
            ) : (
              <Empty
                title="Make room for your next idea"
                action={
                  <button className="button" onClick={() => open("project")}>
                    Create a project <Plus size={14} />
                  </button>
                }
              >
                Your projects will appear here.
              </Empty>
            )}
          </Panel>
          <Panel title="Workspace activity">
            <div className="activity-list">
              {activity.slice(0, 5).map((a) => (
                <div className="activity-item" key={a.id}>
                  <span className="activity-dot" />
                  <div>
                    <p>
                      <strong>{a.name}</strong> ·{" "}
                      {a.action.replaceAll(".", " ")}
                    </p>
                    <small>{date(a.created_at)}</small>
                  </div>
                </div>
              ))}
              {!activity.length && (
                <Empty title="A fresh start">
                  Real activity appears as your team works.
                </Empty>
              )}
            </div>
          </Panel>
        </div>
        <Panel
          title="Meet your intelligence team"
          action={
            <button className="text-button" onClick={() => navigate("agents")}>
              Control center <ArrowUpRight size={14} />
            </button>
          }
        >
          <div className="agent-strip">
            {["orchestrator", "planning", "research", "critic"].map((a) => (
              <button
                className="mini-agent"
                key={a}
                onClick={() => {
                  setAgent(a);
                  navigate("studio");
                }}
              >
                <AgentIcon name={a} />
                <div>
                  <strong>{statusLabel(a)}</strong>
                  <small>
                    {a === "orchestrator"
                      ? "The coordinator"
                      : a === "planning"
                        ? "The strategist"
                        : a === "research"
                          ? "The explorer"
                          : "The challenger"}
                  </small>
                </div>
                <ArrowUpRight size={14} />
              </button>
            ))}
          </div>
        </Panel>
      </>
    );
  else if (page === "workspace")
    content = (
      <>
        <PageHead
          eyebrow="BUILD WITH CONTEXT"
          title="Your workspace."
          subtitle="Every project has its own knowledge, conversations, and decisions."
          action={
            <button
              className="button primary"
              disabled={!canWrite}
              onClick={() => open("project")}
            >
              <Plus size={16} /> New project
            </button>
          }
        />
        <div className="workspace-toolbar">
          <Badge tone="blue">{workspace?.name}</Badge>
          <span>{projects.length} projects</span>
          <button className="text-button" onClick={() => open("workspace")}>
            Create another workspace <Plus size={14} />
          </button>
        </div>
        <div className="project-grid">
          {projects.map((p, i) => (
            <button
              className="project-card"
              key={p.id}
              onClick={() => {
                setPid(p.id);
                navigate("project");
              }}
            >
              <div className="card-top">
                <span className={"project-symbol color" + (i % 3)}>
                  <FolderKanban size={23} />
                </span>
                <ArrowUpRight size={18} />
              </div>
              <h3>{p.name}</h3>
              <p>{p.description || "Add a description to align the team."}</p>
              <footer>
                Created {date(p.created_at)} <ChevronRight size={14} />
              </footer>
            </button>
          ))}
        </div>
        {!projects.length && (
          <Empty title="Your next project belongs here">
            Use New project to get started.
          </Empty>
        )}
      </>
    );
  else if (page === "project")
    content = (
      <>
        <PageHead
          eyebrow="PROJECT CONTEXT"
          title={current?.name || "Project"}
          subtitle={
            current?.description || "A shared space for your next outcome."
          }
          action={
            <button
              className="button"
              disabled={!canWrite}
              onClick={() => open("project", current)}
            >
              Edit project <MoreHorizontal size={16} />
            </button>
          }
        />
        <div className="stats-grid">
          <Stat
            label="Project progress"
            value={progress(tasks) + "%"}
            detail={`${tasks.filter((t) => t.status === "done").length} of ${tasks.length} tasks complete`}
          />
          <Stat
            label="Knowledge sources"
            value={documents.length}
            detail="Documents in this project"
          />
          <Stat
            label="Intelligence runs"
            value={runs.length}
            detail="Including pending and failed runs"
          />
          <Stat
            label="Milestones"
            value={milestones.length}
            detail="Defined delivery checkpoints"
          />
        </div>
        <div className="two-column">
          <Panel
            title="Delivery progress"
            action={
              <button className="text-button" onClick={() => navigate("tasks")}>
                Open task board <ArrowUpRight size={14} />
              </button>
            }
          >
            <div className="panel-body">
              <div className="progress-track">
                <span style={{ width: progress(tasks) + "%" }} />
              </div>
              {statuses.map((s) => (
                <div className="metric-row" key={s}>
                  <Status value={s} />
                  <strong>{tasks.filter((t) => t.status === s).length}</strong>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Project memory">
            <div className="panel-body memory-list">
              {memories.slice(0, 5).map((m) => (
                <div key={m.id}>
                  <p>{m.content}</p>
                  <small>{date(m.created_at)}</small>
                </div>
              ))}
              {!memories.length && (
                <p className="muted">
                  Agent proposals and human review decisions will be retained
                  here.
                </p>
              )}
            </div>
          </Panel>
        </div>
        <Panel title="Recent intelligence">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Request</th>
                  <th>Status</th>
                  <th>Mode</th>
                  <th>Started</th>
                </tr>
              </thead>
              <tbody>
                {runs.slice(0, 8).map((r) => (
                  <tr key={r.id}>
                    <td>
                      <button
                        className="text-button"
                        onClick={() =>
                          act(async () => {
                            setRun(await api(`runs/${r.id}`));
                            navigate("studio");
                          }, "")
                        }
                      >
                        {r.prompt}
                      </button>
                    </td>
                    <td>
                      <Status value={r.status} />
                    </td>
                    <td>{r.mode}</td>
                    <td>{date(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!runs.length && (
              <Empty
                title="Let’s think it through"
                action={
                  <button
                    className="button primary"
                    onClick={() => navigate("studio")}
                  >
                    Open studio
                  </button>
                }
              >
                Start an intelligence run for this project.
              </Empty>
            )}
          </div>
        </Panel>
      </>
    );
  else if (page === "studio")
    content = (
      <>
        <PageHead
          eyebrow="THINK TOGETHER. BUILD INTELLIGENTLY."
          title="Intelligence studio."
          subtitle="One conversation. A team of perspectives. Your final decision."
          action={
            <Badge tone={health.mode === "live" ? "green" : "amber"}>
              {health.mode === "live"
                ? "Live AI provider"
                : "Demo · deterministic agents"}
            </Badge>
          }
        />
        <div className="studio-layout">
          <div className="studio-main">
            <Panel className="composer">
              <div className="composer-head">
                <Sparkles size={19} />
                <strong>What are we working on?</strong>
                <select
                  aria-label="Agent selection"
                  value={agent}
                  onChange={(e) => setAgent(e.target.value)}
                >
                  <option value="multi">Multi-agent team</option>
                  {agents
                    .filter((a) => a.id !== "execution")
                    .map((a) => (
                      <option
                        value={a.id}
                        key={a.id}
                        disabled={a.enabled === "0"}
                      >
                        {statusLabel(a.id)}
                      </option>
                    ))}
                </select>
              </div>
              <textarea
                aria-label="Your request"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your goal, share constraints, and tell your agents what a great result looks like…"
                maxLength={6000}
              />
              <button
                className="example-prompt"
                onClick={() => {
                  setPrompt(
                    "I want to organize a technical event for 300 students with a budget of ₹50,000.",
                  );
                  setEvent(true);
                  setAgent("multi");
                  setPeople("300");
                  setBudget("50000");
                }}
              >
                <Sparkles size={14} /> Try a technical event for 300 students{" "}
                <ArrowUpRight size={14} />
              </button>
              <label className="check-field">
                <input
                  type="checkbox"
                  checked={event}
                  onChange={(e) => setEvent(e.target.checked)}
                />{" "}
                Include event budget & logistics
              </label>
              {event && (
                <div className="form-grid budget-fields">
                  <label className="field">
                    Budget (INR)
                    <input
                      type="number"
                      value={budget}
                      min="100"
                      max="100000000"
                      onChange={(e) => setBudget(e.target.value)}
                    />
                  </label>
                  <label className="field">
                    Participants
                    <input
                      type="number"
                      value={people}
                      min="1"
                      max="100000"
                      onChange={(e) => setPeople(e.target.value)}
                    />
                  </label>
                </div>
              )}
              <label className="field">
                <span><input type="checkbox" checked={webResearch} disabled={!health.web_research} onChange={e => setWebResearch(e.target.checked)} /> Include web search excerpts</span>
                {!health.web_research && <small>Requires live mode and a configured search provider.</small>}
              </label>
              {webResearch && health.web_research && <label className="field">Search query
                <input value={searchQuery} maxLength={600} onChange={e => setSearchQuery(e.target.value)} placeholder="Public information to search for" />
                <small>Only this search query is sent to Brave. Results are excerpts, not verified full pages.</small>
              </label>}
              <div className="composer-footer">
                <span>
                  <BookOpen size={14} /> {documents.length} project sources
                  available
                </span>
                <button
                  className="button primary"
                  disabled={
                    busy ||
                    !prompt.trim() ||
                    (webResearch && !!health.web_research && !searchQuery.trim()) ||
                    !canWrite ||
                    ["queued", "running"].includes(run?.status)
                  }
                  onClick={() => act(start, "Intelligence run started")}
                >
                  <Send size={15} />{" "}
                  {run && ["queued", "running"].includes(run.status)
                    ? "Agents are working…"
                    : "Start thinking"}
                </button>
              </div>
            </Panel>
            {!run ? (
              <div className="studio-empty">
                <div className="studio-mark">
                  <Network size={35} />
                </div>
                <h2>Great work starts with a question.</h2>
                <p>
                  Your agents share context, challenge assumptions,
                  <br />
                  and bring one proposal back to you.
                </p>
                <div className="workflow-pills">
                  <Badge>Plan</Badge>
                  <ChevronRight size={13} />
                  <Badge>Research</Badge>
                  <ChevronRight size={13} />
                  <Badge>Review</Badge>
                  <ChevronRight size={13} />
                  <Badge tone="blue">You decide</Badge>
                </div>
              </div>
            ) : (
              <Panel
                title="Shared intelligence"
                action={<Status value={run.status} />}
              >
                <div className="panel-body">
                  <p className="request-quote">{run.prompt}</p>
                  {run.status === "failed" && (
                    <div className="error">{run.error}</div>
                  )}
                  {["queued", "running"].includes(run.status) && (
                    <div className="thinking">
                      <span className="live-dot" /> Agents are sharing context.
                      Progress updates automatically.
                    </div>
                  )}
                  {run.status === "running" && run.executions?.filter((e: Row) => e.status === "running").map((e: Row) => {
                    const draft = streamingSummary(e.output);
                    return draft ? <div key={e.id} aria-live="polite"><small>Draft — still generating</small><p>{draft}</p></div> : null;
                  })}
                  {run.proposal?.summary && (
                    <>
                      <div className="proposal-heading">
                        <Badge tone="blue">CONSOLIDATED PROPOSAL</Badge>
                        <button
                          className="text-button"
                          onClick={() =>
                            download("HI-proposal.json", run.proposal)
                          }
                        >
                          <Download size={14} /> Export
                        </button>
                      </div>
                      <h3 className="proposal-summary">
                        {run.proposal.summary}
                      </h3>
                      {run.proposal.budget && (
                        <div className="budget-table">
                          <h4>
                            Budget allocation <Badge>INR · estimated</Badge>
                          </h4>
                          {run.proposal.budget.lines.map((l: Row) => (
                            <div className="metric-row" key={l.category}>
                              <span>{l.category}</span>
                              <strong>{rupees(l.paise)}</strong>
                            </div>
                          ))}
                          <div className="metric-row">
                            <span>Contingency reserve</span>
                            <strong>
                              {rupees(run.proposal.budget.reserve_paise)}
                            </strong>
                          </div>
                          <div className="metric-row total">
                            <strong>Total budget</strong>
                            <strong>
                              {rupees(run.proposal.budget.budget_paise)}
                            </strong>
                          </div>
                          <p className="muted">
                            {run.proposal.budget.basis}. Per participant:{" "}
                            {rupees(run.proposal.budget.per_person_paise)}.
                          </p>
                        </div>
                      )}
                      {run.proposal.routing && <details><summary>Agent selection</summary><p>{run.proposal.routing.reason}</p><p>{run.proposal.routing.agents.join(" → ")}</p></details>}
                      <h4>Proposed tasks</h4>
                      <ol className="proposal-tasks">
                        {run.proposal.tasks.map((t: string, i: number) => (
                          <li key={i}>{t}
                            {run.proposal.task_plan?.[i] && <small className="muted"> · {run.proposal.task_plan[i].priority || "medium"} priority
                              {run.proposal.task_plan[i].deadline && ` · Due ${run.proposal.task_plan[i].deadline}`}
                              {!!run.proposal.task_plan[i].depends_on?.length && ` · After tasks ${run.proposal.task_plan[i].depends_on.map((index: number) => index + 1).join(", ")}`}
                            </small>}
                          </li>
                        ))}
                      </ol>
                      {!!run.proposal.milestones?.length && <><h4>Proposed milestones</h4><ul>{run.proposal.milestones.map((title: string, index: number) => <li key={index}>{title}</li>)}</ul></>}
                      {!!run.proposal.risks.length && (
                        <div className="risk-box">
                          <h4>Human checks & assumptions</h4>
                          <ul>
                            {run.proposal.risks.map((r: string, i: number) => (
                              <li key={i}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="agent-findings">
                        {Object.entries(run.proposal.agents || {}).map(
                          ([name, r]: [string, any]) => (
                            <details key={name}>
                              <summary>
                                <AgentIcon name={name} />
                                {statusLabel(name)} <ChevronRight size={14} />
                              </summary>
                              <p>{r.summary}</p>
                              <ul>
                                {r.findings.map((f: string, i: number) => (
                                  <li key={i}>{f}</li>
                                ))}
                              </ul>
                            </details>
                          ),
                        )}
                      </div>
                      {!!run.proposal.web_sources?.length && <div className="source-list"><h4>Web search excerpts</h4>
                        {run.proposal.web_sources.map((source: Row, i: number) => <div key={i}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title || source.url}</a><p>{source.snippet}</p></div>)}
                      </div>}
                      {!!run.proposal.sources?.length && (
                        <div className="source-list">
                          <h4>Project sources</h4>
                          {run.proposal.sources.map((s: Row, i: number) => (
                            <details key={i}>
                              <summary>
                                <FileText size={14} /> {s.name} · chunk{" "}
                                {s.chunk_index}
                              </summary>
                              <p>{s.content}</p>
                            </details>
                          ))}
                        </div>
                      )}
                      {run.status === "awaiting_review" && (
                        <div className="review-box">
                          <div>
                            <Shield size={18} />
                            <strong>Human approval required</strong>
                          </div>
                          <p>
                            Approving creates these tasks, their listed dependencies, and proposed milestones in this project. No
                            purchases, bookings, or external messages will be
                            made.
                          </p>
                          <textarea
                            aria-label="Review feedback"
                            placeholder="Feedback or requested changes…"
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                          />
                          <div className="button-row">
                            <button
                              className="button primary"
                              disabled={!manage || busy}
                              onClick={() =>
                                act(
                                  () => review("approved"),
                                  "Proposal approved; tasks created",
                                )
                              }
                            >
                              <Check size={15} /> Approve proposal
                            </button>
                            <button
                              className="button"
                              disabled={!manage || busy || !feedback.trim()}
                              onClick={() =>
                                act(
                                  () => review("changes_requested"),
                                  "Changes requested",
                                )
                              }
                            >
                              Request changes
                            </button>
                            <button
                              className="text-button danger"
                              disabled={!manage || busy}
                              onClick={() =>
                                act(
                                  () => review("rejected"),
                                  "Proposal rejected",
                                )
                              }
                            >
                              Reject
                            </button>
                          </div>
                          {!manage && (
                            <p className="muted">
                              Only workspace owners and admins can review
                              proposals.
                            </p>
                          )}
                        </div>
                      )}
                      {run.approval?.[0]?.feedback && (
                        <div className="note">
                          Review feedback: {run.approval[0].feedback}
                        </div>
                      )}
                      <button
                        className="button"
                        disabled={busy}
                        onClick={() => {
                          setPrompt(
                            run.prompt +
                              (run.approval?.[0]?.feedback
                                ? "\nRequested changes: " +
                                  run.approval[0].feedback
                                : ""),
                          );
                          setEvent(!!run.proposal.budget);
                          if (run.proposal.budget) {
                            setBudget(
                              String(run.proposal.budget.budget_paise / 100),
                            );
                            setPeople(String(run.proposal.budget.people));
                          }
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        <RefreshCw size={14} /> Refine or regenerate this
                        request
                      </button>
                    </>
                  )}
                </div>
              </Panel>
            )}
          </div>
          <aside className="studio-side">
            <Panel title="Agent activity">
              <div className="pipeline-list">
                {[
                  "memory",
                  "planning",
                  "research",
                  "knowledge",
                  "finance",
                  "critic",
                  "orchestrator",
                  "execution",
                ].map((name) => {
                  const e = run?.executions?.find(
                    (e: Row) => e.agent_id === name,
                  );
                  return (
                    <div className="pipeline-agent" key={name}>
                      <AgentIcon name={name} />
                      <div>
                        <strong>{statusLabel(name)}</strong>
                        <small>
                          {e
                            ? statusLabel(e.status)
                            : name === "execution"
                              ? "Waits for approval"
                              : "Ready when needed"}
                        </small>
                      </div>
                      {e?.status === "completed" ? (
                        <Check className="green-text" size={15} />
                      ) : e?.status === "running" ? (
                        <span className="live-dot" />
                      ) : null}
                    </div>
                  );
                })}
              </div>
              <div className="side-note">
                <Shield size={15} /> You stay in control at every step.
              </div>
            </Panel>
            <Panel title="Conversation history">
              <div className="run-history">
                {runs.map((r) => (
                  <button
                    key={r.id}
                    className={run?.id === r.id ? "active" : ""}
                    onClick={() =>
                      act(async () => setRun(await api(`runs/${r.id}`)), "")
                    }
                  >
                    <span>{r.prompt}</span>
                    <small>
                      {statusLabel(r.status)} · {date(r.created_at)}
                    </small>
                  </button>
                ))}
                {!runs.length && <p className="muted">No conversations yet.</p>}
              </div>
            </Panel>
          </aside>
        </div>
      </>
    );
  else if (page === "agents")
    content = (
      <>
        <PageHead
          eyebrow="YOUR SPECIALIZED TEAM"
          title="Agent control center."
          subtitle="Eight distinct roles. One shared project context. Configure how your team thinks."
        />
        <div className="notice">
          <Shield size={16} />
          {health.mode === "live"
            ? "Live mode calls your configured model provider."
            : "Demo mode uses deterministic templates, not real AI. Custom instructions apply in live mode."}{" "}
          All status and execution counts are real.
        </div>
        <div className="agents-grid">
          {agents.map((a) => {
            const metrics = analytics.agents?.find(
              (m: Row) => m.agent_id === a.id,
            );
            return (
              <Panel key={a.id} className="agent-card">
                <div className="card-top">
                  <AgentIcon name={a.id} />
                  <Badge tone={a.enabled === "1" ? "green" : "muted"}>
                    {a.enabled === "1" ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <h3>{statusLabel(a.id)} agent</h3>
                <p>{agentMeta[a.id]?.desc}</p>
                <div className="agent-metrics">
                  <div>
                    <strong>{metrics?.executions || 0}</strong>
                    <small>Executions</small>
                  </div>
                  <div>
                    <strong>
                      {Math.round(Number(metrics?.average_ms || 0))} ms
                    </strong>
                    <small>Average duration</small>
                  </div>
                </div>
                <button
                  className="button full"
                  disabled={!manage}
                  onClick={() => open("agent", a)}
                >
                  Configure agent <Settings size={14} />
                </button>
              </Panel>
            );
          })}
        </div>
      </>
    );
  else if (page === "knowledge")
    content = (
      <>
        <PageHead
          eyebrow="GROUND YOUR THINKING"
          title="Knowledge hub."
          subtitle="Give your agents evidence to work with. Documents stay within this project."
          action={
            <label
              className={
                "button primary " + (!canWrite || busy ? "disabled" : "")
              }
            >
              <Upload size={16} /> {busy ? "Processing…" : "Upload document"}
              <input
                className="sr-only"
                type="file"
                accept=".txt,.md,.pdf,.docx"
                disabled={!canWrite || busy}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  void act(async () => {
                    if (file.size > 2000000)
                      throw new Error("Choose a file under 2 MB.");
                    const base64 = await new Promise<string>(
                      (resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () =>
                          resolve(String(reader.result).split(",")[1]);
                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                      },
                    );
                    await api(`projects/${pid}/documents`, "POST", {
                      name: file.name,
                      base64,
                    });
                    await reloadProject();
                  }, "Document indexed");
                  e.target.value = "";
                }}
              />
            </label>
          }
        />
        <div className="notice">
          <BookOpen size={16} />
          {health.mode === "live"
            ? "Semantic search using your configured embedding model."
            : "Demo search uses hashed keyword vectors; it is not semantic AI search."}{" "}
          TXT, MD, text-based PDF and DOCX · 2 MB file limit · 120 KB extracted
          text.
        </div>
        <Panel>
          <form
            className="search-bar"
            onSubmit={(e) => {
              e.preventDefault();
              void act(async () => {
                const r = await api(`projects/${pid}/search`, "POST", {
                  query: search,
                });
                setSearchResults(r.results);
              }, "");
            }}
          >
            <Search size={19} />
            <input
              aria-label="Search project knowledge"
              placeholder="Search your project knowledge…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="button" disabled={busy || !search.trim()}>
              Search
            </button>
          </form>
        </Panel>
        {searchResults !== null && (
          <Panel title="Search results">
            <div className="panel-body">
              {searchResults.map((r, i) => (
                <article className="search-result" key={i}>
                  <div>
                    <FileText size={17} />
                    <strong>{r.name}</strong>
                    <Badge>Chunk {r.chunk_index}</Badge>
                    <small>Similarity {Number(r.score).toFixed(3)}</small>
                  </div>
                  <p>{r.content}</p>
                </article>
              ))}
              {!searchResults.length && (
                <Empty title="No matching excerpts">
                  Try another query or upload relevant documents.
                </Empty>
              )}
            </div>
          </Panel>
        )}
        <Panel title="Project documents">
          <div className="document-list">
            {documents.map((d) => (
              <div className="document-row" key={d.id}>
                <span className="project-symbol">
                  <FileText size={22} />
                </span>
                <div>
                  <strong>{d.name}</strong>
                  <small>
                    {d.mime.slice(1).toUpperCase()} · {date(d.created_at)}
                  </small>
                </div>
                <Badge tone="green">Indexed</Badge>
                <button
                  className="icon-button danger"
                  disabled={!canWrite}
                  aria-label={"Delete " + d.name}
                  onClick={() => open("deleteDocument", d)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          {!documents.length && (
            <Empty title="Add the context that matters">
              Upload notes, requirements, quotations, or research to ground
              agent responses.
            </Empty>
          )}
        </Panel>
      </>
    );
  else if (page === "tasks")
    content = (
      <>
        <PageHead
          eyebrow="FROM THINKING TO DOING"
          title="Tasks & milestones."
          subtitle="Give every next step an owner, a priority, and a clear finish line."
          action={
            <button
              className="button primary"
              disabled={!canWrite}
              onClick={() => open("task")}
            >
              <Plus size={16} /> New task
            </button>
          }
        />
        <div className="task-toolbar">
          <div className="search-inline">
            <Search size={16} />
            <input
              aria-label="Filter tasks"
              placeholder="Filter tasks…"
              value={taskFilter}
              onChange={(e) => setTaskFilter(e.target.value)}
            />
          </div>
          <Badge>{tasks.length} total tasks</Badge>
          <button
            className="text-button"
            disabled={!canWrite}
            onClick={() => open("milestone")}
          >
            <Plus size={14} /> Add milestone
          </button>
        </div>
        <div className="kanban">
          {statuses.map((s) => (
            <section className="kanban-column" key={s}>
              <header>
                <span className={"status-dot " + s} />
                <h3>{statusLabel(s)}</h3>
                <Badge>{tasks.filter((t) => t.status === s).length}</Badge>
              </header>
              <div>
                {tasks
                  .filter(
                    (t) =>
                      t.status === s &&
                      t.title.toLowerCase().includes(taskFilter.toLowerCase()),
                  )
                  .map((t) => (
                    <article className="task-card" key={t.id}>
                      <div className="task-card-top">
                        <Badge tone={t.priority === "high" ? "amber" : "muted"}>
                          {t.priority}
                        </Badge>
                        <button
                          className="icon-button"
                          disabled={!canWrite}
                          aria-label={"Edit " + t.title}
                          onClick={() => open("task", t)}
                        >
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                      <h4>{t.title}</h4>
                      {t.description && <p>{t.description}</p>}
                      <div className="task-meta">
                        <span className="avatar tiny">
                          {members
                            .find((m) => m.id === t.assignee)
                            ?.name.slice(0, 1) || "–"}
                        </span>
                        <span>
                          {members.find((m) => m.id === t.assignee)?.name ||
                            "Unassigned"}
                        </span>
                        {t.deadline && (
                          <small>
                            <Clock size={11} />
                            {t.deadline}
                          </small>
                        )}
                      </div>
                      <div className="task-card-bottom">
                        <select
                          aria-label={"Status for " + t.title}
                          value={t.status}
                          disabled={!canWrite || busy}
                          onChange={(e) =>
                            act(async () => {
                              await api(
                                `projects/${pid}/tasks/${t.id}`,
                                "PATCH",
                                { status: e.target.value },
                              );
                              await reloadAll();
                            })
                          }
                        >
                          {statuses.map((s) => (
                            <option key={s} value={s}>
                              {statusLabel(s)}
                            </option>
                          ))}
                        </select>
                        <button
                          className="icon-button danger"
                          disabled={!canWrite}
                          aria-label={"Delete " + t.title}
                          onClick={() => open("deleteTask", t)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      {t.dependencies?.length > 0 && (
                        <small className="muted">
                          {t.dependencies.length} prerequisite task(s)
                        </small>
                      )}
                    </article>
                  ))}
                {!tasks.some((t) => t.status === s) && (
                  <div className="empty-column">No tasks here yet</div>
                )}
              </div>
            </section>
          ))}
        </div>
        <Panel title="Milestones">
          <div className="panel-body">
            {milestones.map((m) => (
              <div className="metric-row" key={m.id}>
                <div>
                  <strong>{m.title}</strong>
                  <small>Due {m.deadline}</small>
                </div>
                <button
                  className="button"
                  disabled={!canWrite || busy}
                  onClick={() =>
                    act(async () => {
                      await api(`projects/${pid}/milestones/${m.id}`, "PATCH", {
                        status: m.status === "done" ? "open" : "done",
                      });
                      await reloadProject();
                    })
                  }
                >
                  {m.status === "done" ? <Check size={15} /> : null}
                  {m.status === "done" ? "Completed" : "Mark complete"}
                </button>
              </div>
            ))}
            {!milestones.length && (
              <p className="muted">
                Add a milestone to define your next checkpoint.
              </p>
            )}
          </div>
        </Panel>
      </>
    );
  else if (page === "team")
    content = (
      <>
        <PageHead
          eyebrow="THE HUMAN PART OF HI"
          title="Better, together."
          subtitle="Align your team, discuss the work, and keep decisions visible."
          action={
            <button
              className="button primary"
              disabled={!manage}
              onClick={() => open("invite")}
            >
              <Plus size={16} /> Invite teammate
            </button>
          }
        />
        <div className="two-column">
          <Panel title="Workspace members">
            <div className="panel-body">
              {members.map((m) => (
                <div className="member-row" key={m.id}>
                  <span className="avatar">{m.name[0]}</span>
                  <div>
                    <strong>
                      {m.name}
                      {m.id === user.id ? " (you)" : ""}
                    </strong>
                    <small>{m.email}</small>
                  </div>
                  {manage && m.role !== "owner" && m.id !== user.id ? (
                    <select
                      aria-label={"Role for " + m.name}
                      value={m.role}
                      onChange={(e) =>
                        act(async () => {
                          await api(
                            `workspaces/${wid}/members/${m.id}`,
                            "PATCH",
                            { role: e.target.value },
                          );
                          await reloadWorkspace();
                        })
                      }
                    >
                      {["admin", "member", "viewer"].map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                  ) : (
                    <Badge>{m.role}</Badge>
                  )}
                </div>
              ))}
              <button className="text-button" onClick={() => open("accept")}>
                Have an invite code? Join a workspace <ArrowRight size={14} />
              </button>
            </div>
          </Panel>
          <Panel title="Project discussion">
            <div className="panel-body discussion">
              {comments.map((c) => (
                <article className="comment" key={c.id}>
                  <span className="avatar tiny">{c.name[0]}</span>
                  <div>
                    <strong>{c.name}</strong>
                    <small>{date(c.created_at)}</small>
                    <p>{c.content}</p>
                  </div>
                </article>
              ))}
              {!comments.length && (
                <Empty title="Start the conversation">
                  Share context, questions, and decisions with your team.
                </Empty>
              )}
              <Form
                label="Post comment"
                onSubmit={async (data) => {
                  await api(`projects/${pid}/comments`, "POST", data);
                  await reloadProject();
                }}
              >
                <Textarea
                  name="content"
                  label="Your comment"
                  required
                  placeholder="What should the team know?"
                />
              </Form>
            </div>
          </Panel>
        </div>
      </>
    );
  else if (page === "analytics")
    content = (
      <>
        <PageHead
          eyebrow="UNDERSTAND THE WORK"
          title="Intelligence analytics."
          subtitle="Measured from recorded task and agent activity in this workspace."
          action={
            <button
              className="button"
              onClick={() =>
                download("HI-workspace-report.json", {
                  workspace: workspace?.name,
                  generated_at: new Date().toISOString(),
                  ...analytics,
                })
              }
            >
              <Download size={16} /> Export report
            </button>
          }
        />
        <div className="stats-grid">
          <Stat
            label="Projects"
            value={analytics.project_count?.count || 0}
            detail="Current workspace"
          />
          <Stat
            label="Tasks"
            value={
              analytics.tasks?.reduce(
                (s: number, x: Row) => s + Number(x.count),
                0,
              ) || 0
            }
            detail="All project tasks"
          />
          <Stat
            label="Agent executions"
            value={
              analytics.agents?.reduce(
                (s: number, x: Row) => s + Number(x.executions),
                0,
              ) || 0
            }
            detail="Measured invocations"
          />
          <Stat
            label="Agent errors"
            value={
              analytics.agents?.reduce(
                (s: number, x: Row) => s + Number(x.errors),
                0,
              ) || 0
            }
            detail="Recorded failed executions"
          />
        </div>
        <div className="two-column">
          <Panel title="Task distribution">
            <div className="panel-body chart-bars">
              {statuses.map((s) => {
                const count = Number(
                    analytics.tasks?.find((x: Row) => x.status === s)?.count ||
                      0,
                  ),
                  total =
                    analytics.tasks?.reduce(
                      (n: number, x: Row) => n + Number(x.count),
                      0,
                    ) || 1;
                return (
                  <div key={s}>
                    <div>
                      <span>{statusLabel(s)}</span>
                      <strong>{count}</strong>
                    </div>
                    <div className="progress-track">
                      <span style={{ width: (count / total) * 100 + "%" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
          <Panel title="Run outcomes">
            <div className="panel-body">
              {analytics.runs?.map((r: Row) => (
                <div className="metric-row" key={r.status}>
                  <Status value={r.status} />
                  <strong>{r.count}</strong>
                </div>
              ))}
              {!analytics.runs?.length && (
                <Empty title="No runs recorded">
                  Start a studio request to generate measured activity.
                </Empty>
              )}
            </div>
          </Panel>
        </div>
        <Panel title="Agent performance">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Executions</th>
                  <th>Errors</th>
                  <th>Average time</th>
                </tr>
              </thead>
              <tbody>
                {analytics.agents?.map((a: Row) => (
                  <tr key={a.agent_id}>
                    <td>{statusLabel(a.agent_id)}</td>
                    <td>{a.executions}</td>
                    <td>{a.errors}</td>
                    <td>{Math.round(Number(a.average_ms))} ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </>
    );
  else if (page === "themes")
    content = <ThemeStudio selected={theme} onSelect={setTheme} />;
  else if (page === "notifications")
    content = (
      <>
        <PageHead
          eyebrow="STAY IN THE LOOP"
          title="Your notifications."
          subtitle="Updates from your team and intelligence workflows."
        />
        <Panel>
          {notifications.map((n) => (
            <div
              className={
                "notification-row " + (n.is_read === "0" ? "unread" : "")
              }
              key={n.id}
            >
              <Bell size={18} />
              <div>
                <p>{n.content}</p>
                <small>{date(n.created_at)}</small>
              </div>
              {n.is_read === "0" && (
                <button
                  className="text-button"
                  onClick={() =>
                    act(async () => {
                      await api(`notifications/${n.id}`, "PATCH");
                      await reloadWorkspace();
                    }, "")
                  }
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
          {!notifications.length && (
            <Empty title="You’re all caught up">
              Updates appear here as work progresses.
            </Empty>
          )}
        </Panel>
      </>
    );
  else if (page === "profile")
    content = (
      <>
        <PageHead
          eyebrow="YOUR ACCOUNT"
          title="Make yourself at home."
          subtitle="Manage your name and sign-in security."
        />
        <div className="two-column">
          <Panel title="Profile">
            <div className="panel-body">
              <Form
                onSubmit={async (data) => {
                  await api("me", "PATCH", data);
                  setUser(await api("me"));
                }}
              >
                <Input name="name" label="Your name" value={user.name} />
                <label className="field">
                  Email
                  <input value={user.email} disabled />
                </label>
              </Form>
            </div>
          </Panel>
          <Panel title="Change password">
            <div className="panel-body">
              <p className="muted">
                Changing your password signs out all sessions.
              </p>
              <Form
                label="Update password & sign out"
                onSubmit={async (data) => {
                  await api("password", "POST", data);
                  setUser(null);
                  setWid("");
                  setPid("");
                }}
              >
                <Input
                  name="current_password"
                  label="Current password"
                  type="password"
                />
                <Input
                  name="new_password"
                  label="New password · 12+ characters"
                  type="password"
                  minLength={12}
                />
              </Form>
            </div>
          </Panel>
        </div>
      </>
    );
  else if (page === "settings")
    content = (
      <>
        <PageHead
          eyebrow="WORKSPACE SETTINGS"
          title="Set the right foundations."
          subtitle="Manage your workspace and understand the current runtime configuration."
        />
        <div className="two-column">
          <Panel title="Workspace">
            <div className="panel-body">
              {manage ? (
                <Form
                  key={wid}
                  onSubmit={async (data) => {
                    await api(`workspaces/${wid}`, "PATCH", data);
                    setWorkspaces(await api("workspaces"));
                  }}
                >
                  <Input
                    name="name"
                    label="Workspace name"
                    value={workspace?.name}
                  />
                </Form>
              ) : (
                <p className="muted">
                  Only owners and admins can change workspace settings.
                </p>
              )}
              <button
                className="text-button spaced"
                onClick={() => open("accept")}
              >
                Join with an invitation code <ArrowRight size={14} />
              </button>
            </div>
          </Panel>
          <Panel title="Intelligence configuration">
            <div className="panel-body">
              <div className="metric-row">
                <span>Provider mode</span>
                <Badge tone="blue">{health.mode}</Badge>
              </div>
              <div className="metric-row">
                <span>Embedding model</span>
                <code>{health.embedding_model}</code>
              </div>
              <p className="muted">
                Provider credentials and model selection are configured through
                server environment variables. API keys are never stored in the
                browser.
              </p>
              <p className="muted">
                Research uses project documents and optional web search excerpts. Web search is {health.web_research ? "available when selected in the studio" : "not configured"}. Live response streaming is {health.streaming ? "enabled" : "disabled"}. External execution tools are not connected.
              </p>
            </div>
          </Panel>
        </div>
      </>
    );
  else if (page === "admin")
    content = (
      <>
        <PageHead
          eyebrow="PLATFORM ADMINISTRATION"
          title="System overview."
          subtitle="Account inventory and aggregate counts for authorized platform administrators."
        />
        {!user.admin ? (
          <Empty title="Administrator access required">
            Set ADMIN_EMAIL on the server before registering the designated
            administrator.
          </Empty>
        ) : (
          <>
            <div className="stats-grid">
              <Stat
                label="Users"
                value={admin.users?.length || 0}
                detail="Registered accounts"
              />
              <Stat
                label="Workspaces"
                value={admin.counts?.workspaces || 0}
                detail="Platform total"
              />
              <Stat
                label="Projects"
                value={admin.counts?.projects || 0}
                detail="Platform total"
              />
              <Stat
                label="Runs"
                value={admin.counts?.runs || 0}
                detail="Platform total"
              />
            </div>
            <Panel title="User directory">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admin.users?.map((u: Row) => (
                      <tr key={u.id}>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td>
                          {u.is_admin === "1" ? "Platform admin" : "User"}
                        </td>
                        <td>{date(u.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </>
        )}
      </>
    );
  return (
    <div className="app-shell">
      <aside className={"sidebar " + (mobile ? "open" : "")}>
        <a className="brand" href="#" onClick={() => navigate("dashboard")}>
          <span className="logo">
            hi<span>•</span>
          </span>
          <div>
            HUMAN INTELLIGENCE<small>BY INFOTEX</small>
          </div>
        </a>
        <label className="workspace-picker">
          <span className="workspace-avatar">
            {workspace?.name?.[0] || "W"}
          </span>
          <select
            aria-label="Select workspace"
            value={wid}
            onChange={(e) => setWid(e.target.value)}
          >
            {workspaces.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </label>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          {navigation.map(([id, label, Icon]) => (
            <button
              key={id}
              className={page === id ? "active" : ""}
              onClick={() => navigate(id)}
            >
              <Icon size={17} />
              <span>{label}</span>
              {id === "studio" && (
                <span className="nav-new" aria-hidden="true">
                  HI
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="nav-divider" />
        <nav>
          {secondary
            .filter(([id]) => id !== "admin" || user.admin)
            .map(([id, label, Icon]) => (
              <button
                key={id}
                className={page === id ? "active" : ""}
                onClick={() => navigate(id)}
              >
                <Icon size={17} />
                <span>{label}</span>
                {id === "notifications" &&
                  notifications.some((n) => n.is_read === "0") && (
                    <span className="notification-dot" />
                  )}
              </button>
            ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="mode-card">
            <span className="live-dot" />
            <div>
              {health.mode === "live" ? "Live intelligence" : "Demo workspace"}
              <small>
                {health.mode === "live"
                  ? "Provider integration enabled"
                  : "Deterministic agents · no AI calls"}
              </small>
            </div>
          </div>
          <div className="user-bar">
            <button onClick={() => navigate("profile")}>
              <span className="avatar">{user.name[0]}</span>
              <span>
                {user.name}
                <small>{workspace?.role || "Member"}</small>
              </span>
            </button>
            <button
              className="icon-button"
              aria-label="Sign out"
              onClick={() =>
                act(async () => {
                  await api("auth/logout", "POST");
                  setUser(null);
                  setWid("");
                  setPid("");
                }, "")
              }
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      {mobile && (
        <div className="sidebar-backdrop" onClick={() => setMobile(false)} />
      )}
      <div className="main-shell">
        <header className="topbar">
          <div>
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobile(!mobile)}
            >
              <Menu size={20} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>
              {[...navigation, ...secondary].find((n) => n[0] === page)?.[1]}
            </strong>
          </div>
          <div>
            <select
              aria-label="Active project"
              value={pid}
              onChange={(e) => setPid(e.target.value)}
            >
              <option value="" disabled>
                Select a project
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button
              className="icon-button"
              aria-label="Refresh workspace"
              disabled={busy}
              onClick={() => act(reloadAll, "Workspace refreshed")}
            >
              <RefreshCw size={16} />
            </button>
            <button
              className="icon-button"
              aria-label="View notifications"
              onClick={() => navigate("notifications")}
            >
              <Bell size={18} />
            </button>
          </div>
        </header>
        <main className={page === "project" ? "main-content hi-project-polish" : "main-content"}>
          {error && (
            <div className="error global-error" role="alert">
              {error}
              <button
                className="icon-button"
                aria-label="Dismiss error"
                onClick={() => setError("")}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {content}
        </main>
        <footer className="app-footer">
          INFOTEX · Human Intelligence{" "}
          <span>Think Together. Build Intelligently.</span>
        </footer>
      </div>
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          {toast}
        </div>
      )}
      {modal && (
        <Modal
          title={
            {
              project: edit.id ? "Edit project" : "Create a project",
              workspace: "Create workspace",
              task: edit.id ? "Edit task" : "Create task",
              milestone: "Add milestone",
              agent: "Configure " + statusLabel(edit.id || "") + " agent",
              invite: "Invite a teammate",
              accept: "Join a workspace",
              deleteTask: "Delete task?",
              deleteDocument: "Delete document?",
            }[modal] || ""
          }
          onClose={() => setModal("")}
        >
          {modal === "project" && (
            <Form
              label={edit.id ? "Save project" : "Create project"}
              onSubmit={async (data) => {
                const r = await api(
                  edit.id
                    ? `projects/${edit.id}`
                    : `workspaces/${wid}/projects`,
                  edit.id ? "PATCH" : "POST",
                  data,
                );
                setModal("");
                await reloadWorkspace();
                if (r.id) setPid(r.id);
                navigate("project");
              }}
            >
              <Input
                name="name"
                label="Project name"
                value={edit.name}
                placeholder="e.g. Campus Tech Summit"
              />
              <Textarea
                name="description"
                label="What are we building?"
                value={edit.description}
                placeholder="Goals, context, and what success looks like…"
              />
            </Form>
          )}
          {modal === "workspace" && (
            <Form
              label="Create workspace"
              onSubmit={async (data) => {
                const w = await api("workspaces", "POST", data);
                setWorkspaces(await api("workspaces"));
                setWid(w.id);
                setModal("");
              }}
            >
              <Input name="name" label="Workspace name" />
            </Form>
          )}
          {modal === "task" && taskModal}
          {modal === "milestone" && (
            <Form
              label="Create milestone"
              onSubmit={async (data) => {
                await api(`projects/${pid}/milestones`, "POST", data);
                setModal("");
                await reloadProject();
              }}
            >
              <Input name="title" label="Milestone title" />
              <Input name="deadline" label="Target date" type="date" />
            </Form>
          )}
          {modal === "agent" && (
            <Form
              onSubmit={async (data) => {
                await api(`workspaces/${wid}/agents/${edit.id}`, "PATCH", {
                  enabled: data.enabled === "on",
                  instructions: data.instructions,
                });
                setModal("");
                await reloadWorkspace();
              }}
            >
              <p className="muted">{edit.responsibility}</p>
              <label className="check-field">
                <input
                  type="checkbox"
                  name="enabled"
                  defaultChecked={edit.enabled === "1"}
                />{" "}
                Enable this agent
              </label>
              <Textarea
                name="instructions"
                label="Additional instructions · live mode"
                value={edit.instructions}
              />
            </Form>
          )}
          {modal === "invite" &&
            (invite ? (
              <div>
                <div className="note">
                  Share this code privately with the intended teammate. It
                  expires in 7 days. No email was sent.
                </div>
                <code className="invite-code">{invite}</code>
                <button
                  className="button"
                  onClick={() =>
                    act(async () => {
                      await navigator.clipboard.writeText(invite);
                    }, "Invitation code copied")
                  }
                >
                  Copy invitation code
                </button>
              </div>
            ) : (
              <Form
                label="Create invitation code"
                onSubmit={async (data) => {
                  const r = await api(
                    `workspaces/${wid}/invitations`,
                    "POST",
                    data,
                  );
                  setInvite(r.token);
                }}
              >
                <Input name="email" label="Teammate email" type="email" />
                <label className="field">
                  Access role
                  <select name="role">
                    <option>member</option>
                    <option>viewer</option>
                    <option>admin</option>
                  </select>
                </label>
              </Form>
            ))}
          {modal === "accept" && (
            <Form
              label="Join workspace"
              onSubmit={async (data) => {
                await api("invitations/accept", "POST", data);
                setWorkspaces(await api("workspaces"));
                setModal("");
              }}
            >
              <Input name="token" label="Invitation code" />
              <p className="muted">
                The invitation must match your signed-in email address.
              </p>
            </Form>
          )}
          {["deleteTask", "deleteDocument"].includes(modal) && (
            <Form
              label="Confirm deletion"
              onSubmit={async () => {
                await api(
                  `projects/${pid}/${modal === "deleteTask" ? "tasks" : "documents"}/${edit.id}`,
                  "DELETE",
                );
                setModal("");
                await reloadAll();
              }}
            >
              <p>
                Delete <strong>{edit.title || edit.name}</strong>?{" "}
                {modal === "deleteDocument"
                  ? "Its indexed chunks will also be removed."
                  : "This removes its dependency links."}
              </p>
            </Form>
          )}
        </Modal>
      )}
    </div>
  );
}
