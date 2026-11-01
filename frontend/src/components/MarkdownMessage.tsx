import { useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import "../hi-markdown-chat.css";

/** Render AI Markdown as React text/elements — never as executable HTML. */
const INLINE = /(\*\*[^*\n]+\*\*|__[^_\n]+__|`[^`\n]+`|~~[^~\n]+~~|\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)|\*[^*\n]+\*|_[^_\n]+_)/g;

function inline(text: string, prefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let end = 0;
  for (const match of text.matchAll(INLINE)) {
    const start = match.index ?? 0;
    if (start > end) nodes.push(text.slice(end, start));
    const value = match[0];
    const key = `${prefix}-${start}`;
    if (value.startsWith("**") || value.startsWith("__")) {
      nodes.push(<strong key={key}>{inline(value.slice(2, -2), key)}</strong>);
    } else if (value.startsWith("`")) {
      nodes.push(<code className="hi-md-inline-code" key={key}>{value.slice(1, -1)}</code>);
    } else if (value.startsWith("~~")) {
      nodes.push(<del key={key}>{inline(value.slice(2, -2), key)}</del>);
    } else if (match[2]) {
      // URL syntax is constrained to http(s) and mailto by INLINE; never render model-supplied HTML.
      nodes.push(<a key={key} href={match[2]} target="_blank" rel="noopener noreferrer nofollow">{match[1]}</a>);
    } else {
      nodes.push(<em key={key}>{inline(value.slice(1, -1), key)}</em>);
    }
    end = start + value.length;
  }
  if (end < text.length) nodes.push(text.slice(end));
  return nodes;
}

function multiline(text: string, prefix: string): ReactNode[] {
  return text.split("\n").flatMap((line, i) => i
    ? [<br key={`${prefix}-break-${i}`} />, ...inline(line, `${prefix}-${i}`)]
    : inline(line, `${prefix}-${i}`));
}

const CODE_TOKENS = /(?:\/\/[^\n]*|#[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:abstract|async|await|boolean|break|case|catch|char|class|const|continue|def|delete|do|double|else|enum|extends|false|final|finally|float|for|from|function|if|implements|import|in|int|interface|let|long|new|null|nullptr|override|package|private|protected|public|return|static|std|super|switch|this|throw|throws|true|try|type|var|void|while)\b|\b\d+(?:\.\d+)?\b)/g;

function codeTokens(source: string): ReactNode[] {
  const tokens: ReactNode[] = [];
  let last = 0;
  for (const match of source.matchAll(CODE_TOKENS)) {
    const position = match.index ?? 0;
    if (position > last) tokens.push(source.slice(last, position));
    const part = match[0];
    const tokenClass = part.startsWith("//") || part.startsWith("#")
      ? "comment" : part.startsWith("\"") || part.startsWith("'")
        ? "string" : /^\d/.test(part) ? "number" : "keyword";
    tokens.push(<span className={`hi-code-${tokenClass}`} key={position}>{part}</span>);
    last = position + part.length;
  }
  if (last < source.length) tokens.push(source.slice(last));
  return tokens;
}

function CopyText({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true); setFailed(false);
    } catch {
      setFailed(true);
    }
  };
  return <button type="button" className="hi-md-copy" aria-label={label} title={failed ? "Clipboard unavailable" : label} onClick={() => void copy()}>
    {copied ? <Check size={14} /> : <Copy size={14} />}
    <span>{failed ? "Copy unavailable" : copied ? "Copied" : "Copy"}</span>
  </button>;
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  return <div className="hi-md-codeblock">
    <div className="hi-md-codebar"><span>{language || "Code"}</span><CopyText text={code} label="Copy code" /></div>
    <pre><code>{codeTokens(code)}</code></pre>
  </div>;
}

function isTableSeparator(line: string) {
  return /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}
function tableCells(line: string) {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split(/(?<!\\)\|/).map(cell => cell.replace(/\\\|/g, "|").trim());
}
function isList(line: string) { return /^\s{0,3}(?:[-+*]|\d+[.)])\s+/.test(line); }
function isBlockStart(lines: string[], i: number) {
  const line = lines[i];
  return /^\s{0,3}(?:```|~~~|#{1,6}\s|>\s?|[-+*]\s+|\d+[.)]\s+|(?:---+|\*\*\*+)\s*$)/.test(line)
    || (line.includes("|") && i + 1 < lines.length && isTableSeparator(lines[i + 1]));
}

function markdownBlocks(input: string): ReactNode[] {
  const lines = input.replace(/\r\n?/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const fenced = /^\s{0,3}(```+|~~~+)\s*([\w+#.-]*)/.exec(line);
    if (fenced) {
      const delimiter = fenced[1];
      const language = fenced[2];
      const start = i++;
      const content: string[] = [];
      while (i < lines.length && !lines[i].trimStart().startsWith(delimiter.slice(0, 3))) content.push(lines[i++]);
      if (i < lines.length) i++;
      blocks.push(<CodeBlock key={start} language={language} code={content.join("\n")} />);
      continue;
    }
    const title = /^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (title) {
      const level = title[1].length;
      blocks.push(level <= 2 ? <h3 key={i}>{inline(title[2], `h-${i}`)}</h3>
        : <h4 key={i}>{inline(title[2], `h-${i}`)}</h4>);
      i++; continue;
    }
    if (/^\s{0,3}(?:---+|\*\*\*+)\s*$/.test(line)) { blocks.push(<hr key={i} />); i++; continue; }
    if (line.includes("|") && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const start = i;
      const headers = tableCells(lines[i]);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim() && lines[i].includes("|")) rows.push(tableCells(lines[i++]));
      blocks.push(<div className="hi-md-table-scroll" key={start}><table><thead><tr>{headers.map((head, j) => <th key={j}>{inline(head, `t-${start}-${j}`)}</th>)}</tr></thead>
        <tbody>{rows.map((row, r) => <tr key={r}>{headers.map((_, c) => <td key={c}>{inline(row[c] || "", `cell-${start}-${r}-${c}`)}</td>)}</tr>)}</tbody></table></div>);
      continue;
    }
    if (/^\s{0,3}>/.test(line)) {
      const start = i;
      const content: string[] = [];
      while (i < lines.length && /^\s{0,3}>/.test(lines[i])) content.push(lines[i++].replace(/^\s{0,3}>\s?/, ""));
      blocks.push(<blockquote key={start}>{multiline(content.join("\n"), `q-${start}`)}</blockquote>);
      continue;
    }
    if (isList(line)) {
      const start = i;
      const numbered = /^\s{0,3}\d+[.)]\s+/.test(line);
      const content: string[] = [];
      while (i < lines.length && isList(lines[i]) && /^\s{0,3}\d+[.)]\s+/.test(lines[i]) === numbered) {
        content.push(lines[i++].replace(/^\s{0,3}(?:[-+*]|\d+[.)])\s+/, ""));
      }
      const children = content.map((item, j) => <li key={j}>{inline(item, `l-${start}-${j}`)}</li>);
      blocks.push(numbered ? <ol key={start}>{children}</ol> : <ul key={start}>{children}</ul>);
      continue;
    }
    const start = i;
    const paragraph = [line]; i++;
    while (i < lines.length && lines[i].trim() && !isBlockStart(lines, i)) paragraph.push(lines[i++]);
    blocks.push(<p key={start}>{multiline(paragraph.join("\n"), `p-${start}`)}</p>);
  }
  return blocks;
}

export default function MarkdownMessage({ content }: { content: string }) {
  return <div className="hi-markdown">{markdownBlocks(content)}</div>;
}

export { CopyText };
