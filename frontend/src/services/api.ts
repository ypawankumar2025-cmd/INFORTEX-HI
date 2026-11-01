export type Row = Record<string, any>;
export async function api<T = any>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await fetch("/api/" + path, {
    method,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", "X-HI-Request": "1" },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(
      "Cannot reach the HI backend. Start the C++ service and retry.",
    );
  }
  if (!response.ok)
    throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}
export const statuses = ["backlog", "in_progress", "review", "done"];
export const statusLabel = (s: string) =>
  s
    .split("_")
    .map((x) => x[0]?.toUpperCase() + x.slice(1))
    .join(" ");
export const date = (s: string | number) =>
  new Date(Number(s) * 1000).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
export const rupees = (paise: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(paise / 100);
export function progress(tasks: Row[]) {
  return tasks.length
    ? Math.round(
        (tasks.filter((t) => t.status === "done").length / tasks.length) * 100,
      )
    : 0;
}
export function download(name: string, data: unknown) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Provider JSON may be incomplete while a response is streaming.
export function streamingSummary(output: unknown): string {
  try {
    const partial = typeof output === "string" ? JSON.parse(output).partial : (output as Row)?.partial;
    if (typeof partial !== "string") return "";
    const match = partial.match(/"summary"\s*:\s*"((?:\\.|[^"\\])*)/);
    if (!match) return "";
    let text = match[1];
    while (text.length) {
      try { return JSON.parse('"' + text + '"'); } catch { text = text.slice(0, -1); }
    }
  } catch { /* Invalid or final output is not a draft. */ }
  return "";
}
