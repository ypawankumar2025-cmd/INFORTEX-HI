import {
  ArrowUpRight, BookOpen, Brain, CheckCircle2, FolderKanban,
  ListTodo, MessageCircle, Network, Search, Shield, Sparkles,
  Users, Wallet, Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type AgentState = { id: string; enabled: boolean };
type Props = {
  projectCount: number;
  completedTasks: number;
  agentExecutions: number;
  memberCount: number;
  agentStates: AgentState[];
  onNavigate: (page: string) => void;
};

type AgentCard = { id: string; title: string; subtitle: string; Icon: LucideIcon };
const agentCards: AgentCard[] = [
  { id: "orchestrator", title: "Orchestrator", subtitle: "Coordinates the AI team", Icon: Network },
  { id: "planning", title: "Planning", subtitle: "Turns goals into plans", Icon: ListTodo },
  { id: "research", title: "Research", subtitle: "Finds useful evidence", Icon: Search },
  { id: "knowledge", title: "Knowledge", subtitle: "Uses project context", Icon: BookOpen },
  { id: "finance", title: "Finance", subtitle: "Explores budget choices", Icon: Wallet },
  { id: "execution", title: "Execution", subtitle: "Acts after approval", Icon: Zap },
  { id: "critic", title: "Critic", subtitle: "Questions assumptions", Icon: Shield },
  { id: "memory", title: "Memory", subtitle: "Connects decisions", Icon: Brain },
];

export default function CinematicOverview({
  projectCount, completedTasks, agentExecutions, memberCount, agentStates, onNavigate,
}: Props) {
  const state = new Map(agentStates.map((agent) => [agent.id, agent.enabled]));
  const metrics = [
    { label: "Projects", value: projectCount, Icon: FolderKanban },
    { label: "Completed tasks", value: completedTasks, Icon: CheckCircle2 },
    { label: "Agent executions", value: agentExecutions, Icon: Sparkles },
    { label: "Team members", value: memberCount, Icon: Users },
  ];
  const quickLinks = [
    { title: "Normal AI Chat", desc: "Ask, explore ideas and get answers.", page: "chat", Icon: MessageCircle },
    { title: "Project AI", desc: "Discuss work with your project context.", page: "project-ai", Icon: Sparkles },
    { title: "Agent Controls", desc: "Manage your specialized AI team.", page: "agents", Icon: Network },
  ];

  return (
    <div className="hi-cinema-overview" aria-label="Cinematic Orange workspace overview">
      <section className="hi-cinema-hero" aria-label="INFORTEX HI overview">
        <div className="hi-cinema-hero-art" aria-hidden="true">
          <img src="/hi-overview-robot.jpg" alt="" loading="eager" />
        </div>
        <div className="hi-cinema-hero-glow" aria-hidden="true" />
        <div className="hi-cinema-hero-copy">
          <span className="hi-cinema-kicker"><i /> O V E R V I E W</span>
          <h2>INFORTEX <em>HI</em></h2>
          <p className="hi-cinema-tagline">Human Intelligence <span>×</span> Artificial Intelligence</p>
          <p className="hi-cinema-intro">One intelligent workspace where your ideas, projects, people and AI agents work together.</p>
          <div className="hi-cinema-metrics" aria-label="Live workspace statistics">
            {metrics.map(({ label, value, Icon }) => (
              <div className="hi-cinema-metric" key={label}>
                <Icon size={21} />
                <strong>{Number.isFinite(value) ? value.toLocaleString() : "0"}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="hi-cinema-quicklinks" aria-label="Workspace shortcuts">
        {quickLinks.map(({ title, desc, page, Icon }) => (
          <button className="hi-cinema-quicklink" type="button" key={page} onClick={() => onNavigate(page)}>
            <Icon size={31} aria-hidden="true" />
            <span className="hi-cinema-quicklink-copy"><strong>{title}</strong><small>{desc}</small></span>
            <ArrowUpRight size={20} className="hi-cinema-arrow" aria-hidden="true" />
          </button>
        ))}
      </div>

      <section className="hi-cinema-agent-section" aria-labelledby="hi-cinema-agents-heading">
        <div className="hi-cinema-agent-heading">
          <div><span className="hi-cinema-kicker"><i /> INTELLIGENCE TEAM</span>
            <h3 id="hi-cinema-agents-heading"><em>8</em> specialized agents</h3>
          </div>
          <button type="button" onClick={() => onNavigate("agents")}>Agent Controls <ArrowUpRight size={16} /></button>
        </div>
        <div className="hi-cinema-agent-grid">
          {agentCards.map(({ id, title, subtitle, Icon }) => (
            <button type="button" key={id} className="hi-cinema-agent" onClick={() => onNavigate("agents")}
              aria-label={`Open Agent Controls for ${title}`}>
              <Icon size={27} aria-hidden="true" />
              <strong>{title}</strong>
              <small>{subtitle}</small>
              <span className="hi-cinema-agent-status">{state.has(id) ? (state.get(id) ? "Enabled" : "Disabled") : "Not configured"}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
