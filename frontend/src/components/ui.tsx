import { useState, type ReactNode } from "react";
import { X, ArrowUpRight, LoaderCircle, Inbox } from "lucide-react";
import { statusLabel } from "../services/api";
export function Badge({
  children,
  tone = "",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={"badge " + tone}>{children}</span>;
}
export function Status({ value }: { value: string }) {
  return (
    <Badge
      tone={
        ["completed", "approved", "done"].includes(value)
          ? "green"
          : ["failed", "rejected"].includes(value)
            ? "red"
            : ["running", "in_progress"].includes(value)
              ? "blue"
              : "muted"
      }
    >
      {statusLabel(value)}
    </Badge>
  );
}
export function Empty({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <Inbox size={27} />
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}
export function Panel({
  title,
  children,
  action,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section className={"panel " + className}>
      {title && (
        <div className="panel-head">
          <h3>{title}</h3>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
export function Stat({
  label,
  value,
  detail,
}: {
  label: string;
  value: ReactNode;
  detail: string;
}) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}
export function PageHead({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-head">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {action}
    </header>
  );
}
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="modal-shade" onClick={onClose}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <header>
          <h2>{title}</h2>
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
export function Form({
  onSubmit,
  children,
  label = "Save changes",
}: {
  onSubmit: (data: Record<string, string>) => Promise<void>;
  children: ReactNode;
  label?: string;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(
          new FormData(e.currentTarget),
        ) as Record<string, string>;
        setBusy(true);
        setError("");
        try {
          await onSubmit(data);
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      {children}
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      <button className="button primary" disabled={busy}>
        {busy ? (
          <LoaderCircle className="spin" size={17} />
        ) : (
          <ArrowUpRight size={17} />
        )}{" "}
        {busy ? "Working…" : label}
      </button>
    </form>
  );
}
export function Input({
  name,
  label,
  value = "",
  type = "text",
  required = true,
  placeholder = "",
  minLength,
}: {
  name: string;
  label: string;
  value?: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  minLength?: number;
}) {
  return (
    <label className="field">
      {label}
      <input
        name={name}
        type={type}
        defaultValue={value}
        required={required}
        placeholder={placeholder}
        minLength={minLength}
      />
    </label>
  );
}
export function Textarea({
  name,
  label,
  value = "",
  required = false,
  placeholder = "",
}: {
  name: string;
  label: string;
  value?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="field">
      {label}
      <textarea
        name={name}
        defaultValue={value}
        required={required}
        placeholder={placeholder}
      />
    </label>
  );
}
