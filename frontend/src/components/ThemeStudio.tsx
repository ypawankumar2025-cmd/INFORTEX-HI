import type { CSSProperties } from "react";
import { CheckCircle2, Palette, RotateCcw, Sparkles } from "lucide-react";
import type { ThemeId } from "../theme-system";

const THEMES: {
  id: ThemeId;
  title: string;
  subtitle: string;
  mood: string;
  colors: readonly [string, string, string];
}[] = [
  {
    id: "blue", title: "Original Blue Glass", subtitle: "Your first favorite · Default",
    mood: "Cinematic navy, cobalt-blue glass, red neon accents, human × AI handshake",
    colors: ["#021861", "#255DCE", "#DE1110"],
  },
  {
    id: "chocolate", title: "Chocolate Atelier", subtitle: "Warm editorial luxury",
    mood: "Chocolate brown, burnt orange and cream · elegant serif typography",
    colors: ["#4E342E", "#CC5500", "#F8F4E7"],
  },
  {
    id: "noir", title: "Cobalt Noir", subtitle: "Minimal modern luxury",
    mood: "Black, deep cobalt and white · sharp contrast and architectural panels",
    colors: ["#000000", "#2C3480", "#FFFFFF"],
  },
  {
    id: "sunshine", title: "Sunshine Scrapbook", subtitle: "Bright, playful creativity",
    mood: "Baby blue, vivid red and sunshine yellow · stickers and polaroids",
    colors: ["#B7D8F5", "#E10600", "#FFD700"],
  },
  {
    id: "sage", title: "Sage & Amber", subtitle: "Calm nature-inspired design",
    mood: "Sage green, concrete grey and burnt amber · organic editorial feel",
    colors: ["#9CAF88", "#A7A7A7", "#CC5500"],
  },
];

export default function ThemeStudio({ selected, onSelect }: {
  selected: ThemeId;
  onSelect: (value: ThemeId) => void;
}) {
  return (
    <section className="hi-theme-studio">
      <div className="hi-theme-intro">
        <span className="hi-theme-eyebrow"><Palette size={16} /> YOUR WORKSPACE, YOUR STYLE</span>
        <h1>Make HI feel like yours.</h1>
        <p>Pick a look for the entire workspace. Your projects, chats, and AI configuration stay exactly as they are.</p>
        <div className="hi-theme-current"><Sparkles size={16} /> Active theme: <strong>{THEMES.find(t => t.id === selected)?.title}</strong></div>
      </div>
      <div className="hi-theme-grid">
        {THEMES.map(t => {
          const active = t.id === selected;
          const vars = {
            "--preview-base": t.colors[0],
            "--preview-accent": t.colors[1],
            "--preview-highlight": t.colors[2],
          } as CSSProperties;
          return (
            <button key={t.id} type="button"
              aria-pressed={active}
              aria-label={`Apply ${t.title} theme`}
              className={`hi-theme-choice hi-theme-choice-${t.id} ${active ? "is-active" : ""}`}
              style={vars}
              onClick={() => onSelect(t.id)}>
              <div className="hi-theme-preview" aria-hidden="true">
                <div className="hi-mini-sidebar"><span /><span /><span /><span /></div>
                <div className="hi-mini-canvas">
                  <div className="hi-mini-header"><i /><i /></div>
                  <div className="hi-mini-hero"><b>HI</b><span /><em /></div>
                  <div className="hi-mini-stats"><span /><span /><span /></div>
                </div>
                {active && <span className="hi-preview-check"><CheckCircle2 size={18} /></span>}
              </div>
              <span className="hi-theme-choice-meta">
                <strong>{t.title}</strong>
                <small>{t.subtitle}</small>
              </span>
              <span className="hi-theme-swatches" aria-hidden="true">
                {t.colors.map((color, i) => <i key={i} style={{ background: color }} />)}
              </span>
              <span className="hi-theme-description">{t.mood}</span>
              <span className="hi-theme-apply">{active ? "✓ Currently applied" : "Apply theme"}</span>
            </button>
          );
        })}
      </div>
      <div className="hi-theme-bottom">
        <div><strong>No rebuild needed to switch.</strong><p>Selection is remembered in this browser, including after refresh.</p></div>
        <button className="hi-theme-reset" type="button" onClick={() => onSelect("blue")} disabled={selected === "blue"}>
          <RotateCcw size={16} /> Restore original blue
        </button>
      </div>
    </section>
  );
}
