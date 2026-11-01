import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import "./blue-bloom-cinema.css";
import "./blue-bloom-glass-motion.css";
import "./hi-cinematic-glass-everywhere.css";
import "./hi-handshake-glass-menu.css";
import "./hi-theme-studio.css";
import "./hi-project-details-polish.css";
import { applyTheme, readSavedTheme } from "./theme-system";
applyTheme(readSavedTheme());
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="loading-screen">
        <h1>Something went wrong.</h1>
        <p>Reload the workspace to reconnect.</p>
        <button className="button primary" onClick={() => location.reload()}>
          Reload
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
