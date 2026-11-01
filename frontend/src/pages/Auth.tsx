import { useState } from "react";
import {
  ArrowRight,
  Network,
  ShieldCheck,
  Layers3,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { Form, Input, Badge } from "../components/ui";
import { api, Row } from "../services/api";
export default function Auth({
  onLogin,
  health,
}: {
  onLogin: (u: Row) => void;
  health: Row;
}) {
  const [view, setView] = useState("landing");
  return (
    <div className="public-shell">
      <nav className="public-nav">
        <a className="brand" href="#">
          <span className="logo">
            hi<span>•</span>
          </span>
          <div>
            HUMAN INTELLIGENCE<small>BY INFOTEX</small>
          </div>
        </a>
        <div className="nav-actions">
          <Badge tone="blue">Human-first by design</Badge>
          <button className="button" onClick={() => setView("login")}>
            Sign in <ArrowUpRight size={15} />
          </button>
        </div>
      </nav>
      {view === "landing" ? (
        <>
          <main className="hero">
            <div>
              <div className="eyebrow">
                <span className="live-dot" /> ONE WORKSPACE. SHARED
                INTELLIGENCE.
              </div>
              <h1>
                Your next big idea.
                <br />
                <em>
                  A team to
                  <br />
                  think it through.
                </em>
              </h1>
              <p>
                Bring people, specialized AI agents, and project knowledge
                together. Turn complex goals into clear plans—with you in
                control.
              </p>
              <div className="hero-actions">
                <button
                  className="button primary large"
                  onClick={() => setView("register")}
                >
                  Create your workspace <ArrowRight size={18} />
                </button>
                <button
                  className="text-button"
                  onClick={() => setView("login")}
                >
                  Already a member? Sign in
                </button>
              </div>
              <div className="hero-note">
                <ShieldCheck size={16} /> Human approval before execution{" "}
                <span>•</span> Persistent project memory
              </div>
            </div>
            <div className="orbital">
              <div className="orbit o1" />
              <div className="orbit o2" />
              <div className="orbit-core">
                <span>
                  hi<span>•</span>
                </span>
                <small>HUMAN INTELLIGENCE</small>
              </div>
              {["Planning", "Research", "Knowledge", "Critic"].map((a, i) => (
                <div className={"orbit-agent a" + i} key={a}>
                  <span className="mini-node">
                    <Network size={17} />
                  </span>
                  <div>
                    {a}
                    <small>Specialized intelligence</small>
                  </div>
                  <span className="live-dot" />
                </div>
              ))}
              <div className="orbit-caption">
                <Layers3 size={15} /> One shared context. Better decisions.
              </div>
            </div>
          </main>
          <div className="value-grid">
            {[
              [
                "01",
                "Context that stays with you",
                "Ground conversations in your documents and project history.",
              ],
              [
                "02",
                "Agents that work together",
                "Plan, research, budget and review through a shared execution pipeline.",
              ],
              [
                "03",
                "Decisions that stay yours",
                "Review every proposal before it becomes work for your team.",
              ],
            ].map(([n, t, d]) => (
              <article key={n}>
                <span>{n}</span>
                <h3>{t}</h3>
                <p>{d}</p>
              </article>
            ))}
          </div>
        </>
      ) : (
        <main className="auth-layout">
          <div className="auth-story">
            <Badge tone="blue">
              <Sparkles size={13} /> Think together.
            </Badge>
            <h1>
              Human ambition.
              <br />
              <em>Amplified.</em>
            </h1>
            <p>
              Your knowledge. Your team. A new way to turn ideas into outcomes.
            </p>
            <button className="text-button" onClick={() => setView("landing")}>
              ← Back to overview
            </button>
          </div>
          <div className="auth-card">
            <div className="eyebrow">YOUR INTELLIGENCE WORKSPACE</div>
            <h2>
              {view === "login"
                ? "Welcome back."
                : "Start something meaningful."}
            </h2>
            <p>
              {view === "login"
                ? "Sign in to pick up where you left off."
                : "Create your account and your first workspace."}
            </p>
            <Form
              key={view}
              label={view === "login" ? "Sign in to HI" : "Create account"}
              onSubmit={async (data) => {
                if (view === "register")
                  await api("auth/register", "POST", data);
                const u = await api("auth/login", "POST", data);
                onLogin(u);
              }}
            >
              {view === "register" && (
                <Input name="name" label="Your name" placeholder="Nikhil" />
              )}
              <Input
                name="email"
                label="Email address"
                type="email"
                placeholder="you@example.com"
              />
              <Input
                name="password"
                label={
                  view === "register" ? "Password · 12+ characters" : "Password"
                }
                type="password"
                minLength={view === "register" ? 12 : undefined}
              />
            </Form>
            <p className="auth-switch">
              {view === "login" ? "New to HI?" : "Already have an account?"}{" "}
              <button
                className="text-button"
                onClick={() => setView(view === "login" ? "register" : "login")}
              >
                {view === "login" ? "Create account" : "Sign in"}
              </button>
            </p>
          </div>
        </main>
      )}
      <footer className="public-footer">
        <span>
          INFOTEX © {new Date().getFullYear()} · Think Together. Build
          Intelligently.
        </span>
        <Badge tone="muted">
          {health.mode === "live"
            ? "Live provider configured"
            : health.status === "ok"
              ? "Demo mode · deterministic agents"
              : "Backend connection required"}
        </Badge>
      </footer>
    </div>
  );
}
