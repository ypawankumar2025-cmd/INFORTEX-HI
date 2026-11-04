import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CircleCheck,
  LockKeyhole,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Form, Input } from "../components/ui";
import { api, type Row } from "../services/api";
import "./hi-auth-cinema.css";
import "./hi-auth-robot-layout.css";

type AuthView = "login" | "register";

function initialView(): AuthView {
  if (typeof window === "undefined") return "login";
  return new URLSearchParams(window.location.search).get("auth") === "register"
    ? "register"
    : "login";
}

export default function Auth({
  onLogin,
  health,
}: {
  onLogin: (u: Row) => void;
  health: Row;
}) {
  const [view, setView] = useState<AuthView>(initialView);

  function changeView(next: AuthView) {
    setView(next);
    // Keep refresh and the browser URL consistent without opening a tab.
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("auth", next);
      window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
    }
  }

  return (
    <div className="hi-cinema-auth">
      <div className="hi-cinema-auth-glow" aria-hidden="true" />
      <header className="hi-cinema-auth-header">
        <a className="hi-cinema-auth-brand" href="/" aria-label="Back to INFORTEX HI cinematic homepage">
          <span className="hi-cinema-auth-monogram">HI<span>.</span></span>
          <span className="hi-cinema-auth-brand-copy"><b>INFORTEX <em>HI</em></b><small>HUMAN × ARTIFICIAL INTELLIGENCE</small></span>
        </a>
        <a className="hi-cinema-auth-home" href="/"><ArrowLeft size={16} /> Back to cinematic homepage</a>
      </header>

      <main className="hi-cinema-auth-main">
        <img className="hi-cinema-auth-portrait" src="/hi-auth-robot-portrait.jpg" alt="" aria-hidden="true" />
        <section className="hi-cinema-auth-story" aria-label="About INFORTEX HI">
          <span className="hi-cinema-auth-kicker"><span /> HUMAN INTELLIGENCE × AI</span>
          <h1>YOUR IDEAS.<br /><em>AMPLIFIED.</em></h1>
          <p>From the first spark to the final result — one intelligent workspace for your projects, conversations, and team.</p>
          <div className="hi-cinema-auth-orbit" aria-hidden="true">
            <span className="hi-cinema-auth-ring ring-one" />
            <span className="hi-cinema-auth-ring ring-two" />
            <div className="hi-cinema-auth-orbit-center"><span>HI<span>.</span></span><small>HUMAN + AI</small></div>
            <div className="hi-cinema-auth-orbit-chip chip-one"><Bot size={17} /> AI AGENTS</div>
            <div className="hi-cinema-auth-orbit-chip chip-two"><MessageCircle size={17} /> AI CHAT</div>
            <div className="hi-cinema-auth-orbit-chip chip-three"><Sparkles size={17} /> BUILD TOGETHER</div>
          </div>
          <div className="hi-cinema-auth-trust"><ShieldCheck size={17} /> Your account. Your projects. You're in control.</div>
        </section>

        <section className="hi-cinema-auth-card" aria-label={view === "login" ? "Sign in" : "Create account"}>
          <div className="hi-cinema-auth-card-top">
            <span className="hi-cinema-auth-card-icon"><LockKeyhole size={22} /></span>
            <span className="hi-cinema-auth-card-number">01 / YOUR WORKSPACE</span>
          </div>
          <div className="hi-cinema-auth-tabs" aria-label="Account action">
            <button type="button" className={view === "login" ? "active" : ""} aria-pressed={view === "login"} onClick={() => changeView("login")}>Sign in</button>
            <button type="button" className={view === "register" ? "active" : ""} aria-pressed={view === "register"} onClick={() => changeView("register")}>Create account</button>
          </div>
          <h2>{view === "login" ? "WELCOME BACK." : "CREATE YOUR SPACE."}</h2>
          <p className="hi-cinema-auth-subtitle">{view === "login" ? "Sign in and pick up right where your ideas left off." : "Your next big idea starts with one workspace."}</p>

          <Form
            key={view}
            label={view === "login" ? "Sign in to HI" : "Create account"}
            onSubmit={async (data) => {
              // The existing backend registration/login flows are preserved.
              if (view === "register") await api("auth/register", "POST", data);
              const user = await api("auth/login", "POST", data);
              onLogin(user);
            }}
          >
            {view === "register" && <Input name="name" label="Your name" placeholder="Your full name" />}
            <Input name="email" label="Email address" type="email" placeholder="you@example.com" />
            <Input name="password" label={view === "register" ? "Password · 12+ characters" : "Password"} type="password" minLength={view === "register" ? 12 : undefined} />
          </Form>
          <p className="hi-cinema-auth-switch">
            {view === "login" ? "New to INFORTEX HI?" : "Already have an account?"}{" "}
            <button type="button" onClick={() => changeView(view === "login" ? "register" : "login")}>
              {view === "login" ? "Create an account" : "Sign in"} <ArrowRight size={14} />
            </button>
          </p>
          <div className="hi-cinema-auth-secure"><CircleCheck size={15} /> Secure account access <span>•</span> Human-first by design</div>
        </section>
      </main>

      <footer className="hi-cinema-auth-footer">
        <span>INFORTEX HI © {new Date().getFullYear()} · Think together. Build intelligently.</span>
        <span>{health.mode === "live" ? "Live AI provider configured" : health.status === "ok" ? "Workspace services online" : "Waiting for backend connection"}</span>
      </footer>
    </div>
  );
}
