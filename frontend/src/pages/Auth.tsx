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
  Eye,
  EyeOff,
} from "lucide-react";
import { Form, Input } from "../components/ui";
import { api, type Row } from "../services/api";
import "./hi-auth-cinema.css";
import "./hi-auth-robot-layout.css";
import "./hi-auth-otp.css";

type AuthView = "login" | "register" | "verify-register" | "forgot" | "verify-reset" | "reset";

function PasswordField({ name, label, minLength, createNew }: {
  name: string; label: string; minLength?: number; createNew?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="field hi-auth2-password">
      {label}
      <span className="hi-auth2-password-input">
        <input name={name} type={visible ? "text" : "password"}
          autoComplete={createNew || name === "new_password" ? "new-password" : "current-password"}
          required minLength={minLength} />
        <button type="button" className="hi-auth2-show" aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={17}/> : <Eye size={17}/>}</button>
      </span>
    </label>
  );
}


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
  const [pendingEmail, setPendingEmail] = useState("");
  const [verifiedCode, setVerifiedCode] = useState("");
  const [notice, setNotice] = useState("");

  function changeView(next: AuthView) {
    setView(next);
    setNotice("");
    // Keep refresh and the browser URL consistent without opening a tab.
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("auth", next === "register" ? "register" : "login");
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

        <section className="hi-cinema-auth-card" aria-label="Account access">
          <div className="hi-cinema-auth-card-top">
            <span className="hi-cinema-auth-card-icon"><LockKeyhole size={22} /></span>
            <span className="hi-cinema-auth-card-number">01 / YOUR WORKSPACE</span>
          </div>
          <div className="hi-cinema-auth-tabs" aria-label="Account action">
            <button type="button" className={view === "login" ? "active" : ""} aria-pressed={view === "login"} onClick={() => changeView("login")}>Sign in</button>
            <button type="button" className={view === "register" ? "active" : ""} aria-pressed={view === "register"} onClick={() => changeView("register")}>Create account</button>
          </div>
          <h2>{({login:"WELCOME BACK.",register:"CREATE YOUR SPACE.","verify-register":"VERIFY EMAIL.",forgot:"RESET ACCESS.","verify-reset":"CHECK YOUR INBOX.",reset:"NEW PASSWORD."} as Record<AuthView,string>)[view]}</h2>
          <p className="hi-cinema-auth-subtitle">{({
            login:"Sign in to continue your work.",
            register:"Use a real email — we'll send a 6-digit verification code.",
            "verify-register":`Enter the code sent to ${pendingEmail}. Expires in 5 minutes.`,
            forgot:"Enter your email to request a password reset code.",
            "verify-reset":`If an account exists, a code was sent to ${pendingEmail}.`,
            reset:"Choose a new password with at least 6 characters."
          } as Record<AuthView,string>)[view]}</p>
          {notice && <div className="hi-auth2-notice" role="status">{notice}</div>}
          <Form
            key={view}
            label={({login:"Sign in to HI",register:"Send verification code","verify-register":"Verify and create account",forgot:"Send reset code","verify-reset":"Verify reset code",reset:"Reset password"} as Record<AuthView,string>)[view]}
            onSubmit={async data => {
              if (view === "login") {
                const user = await api<Row>("auth/login", "POST", data);
                onLogin(user);
              } else if (view === "register") {
                await api("auth/register", "POST", data);
                setPendingEmail(data.email.trim().toLowerCase());
                changeView("verify-register");
              } else if (view === "verify-register") {
                await api("auth/verify-registration", "POST", {email:pendingEmail,code:data.code});
                changeView("login");
                setNotice("Email verified! Sign in with your email and password.");
              } else if (view === "forgot") {
                await api("auth/forgot-password", "POST", data);
                setPendingEmail(data.email.trim().toLowerCase());
                changeView("verify-reset");
              } else if (view === "verify-reset") {
                await api("auth/verify-reset-code", "POST", {email:pendingEmail,code:data.code});
                setVerifiedCode(data.code);
                changeView("reset");
              } else {
                await api("auth/reset-password", "POST", {email:pendingEmail,code:verifiedCode,new_password:data.new_password});
                setVerifiedCode("");
                changeView("login");
                setNotice("Password updated. Please sign in again.");
              }
            }}
          >
            {view === "register" && <Input name="name" label="Your name" placeholder="Your full name" />}
            {(view === "register" || view === "login" || view === "forgot") &&
              <Input name="email" label="Email address" type="email" placeholder="you@example.com" />}
            {(view === "register" || view === "login") &&
              <PasswordField name="password" label={view === "register" ? "Password · minimum 6 characters" : "Password"} minLength={view === "register" ? 6 : undefined} createNew={view === "register"} />}
            {(view === "verify-register" || view === "verify-reset") &&
              <Input name="code" label="6-digit email code" placeholder="123456" minLength={6} />}
            {view === "reset" && <PasswordField name="new_password" label="New password · minimum 6 characters" minLength={6} />}
          </Form>
          {(view === "verify-register" || view === "verify-reset") &&
            <p className="hi-auth2-help">No email? Check Spam or request a new code after 60 seconds.
              <button type="button" onClick={() => changeView(view === "verify-register" ? "register" : "forgot")}> Request another code</button>
            </p>}
          {view === "login" && <p className="hi-auth2-help"><button type="button" onClick={() => changeView("forgot")}>Forgot password?</button></p>}
          <p className="hi-cinema-auth-switch">
            {view === "login" ? "New to INFORTEX HI?" : "Already have an account?"}{" "}
            <button type="button" onClick={() => changeView(view === "login" ? "register" : "login")}>
              {view === "login" ? "Create an account" : "Back to sign in"} <ArrowRight size={14} />
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
