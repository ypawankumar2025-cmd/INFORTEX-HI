
 // @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import MarkdownMessage from "./MarkdownMessage";

afterEach(() => cleanup());

describe("INFOTEX HI Markdown rendering", () => {
  it("renders a normal AI response", () => {
    render(
      <MarkdownMessage content="Hello from INFOTEX HI" />
    );

    expect(
      screen.getByText("Hello from INFOTEX HI")
    ).toBeTruthy();
  });

  it("renders Markdown bullet lists", () => {
    render(
      <MarkdownMessage
        content={"- Research Agent\n- Planning Agent"}
      />
    );

    expect(screen.getByRole("list").tagName).toBe("UL");
    expect(screen.getByText("Research Agent")).toBeTruthy();
    expect(screen.getByText("Planning Agent")).toBeTruthy();
  });

  it("renders Markdown tables", () => {
    const content = [
      "| Task | Status |",
      "| --- | --- |",
      "| Frontend | Done |",
    ].join("\n");

    render(<MarkdownMessage content={content} />);

    expect(screen.getByRole("table")).toBeTruthy();
    expect(screen.getByText("Frontend")).toBeTruthy();
    expect(screen.getByText("Done")).toBeTruthy();
  });
});

it("does not turn unsafe JavaScript URLs into clickable links", () => {
  render(
    <MarkdownMessage content="[Unsafe](javascript:alert(1))" />
  );

  expect(screen.queryByRole("link")).toBeNull();
});

it("renders HTTPS links with secure attributes", () => {
  render(
    <MarkdownMessage content="[Docs](https://example.com/docs)" />
  );

  const link = screen.getByRole("link", { name: "Docs" });

  expect(link.getAttribute("href")).toBe(
    "https://example.com/docs"
  );
  expect(link.getAttribute("target")).toBe("_blank");
  expect(link.getAttribute("rel")).toContain("noopener");
  expect(link.getAttribute("rel")).toContain("noreferrer");
});

it("renders script injection as harmless text", () => {
  const payload = '<script>alert("Hacked")</script>';

  const { container } = render(
    <MarkdownMessage content={payload} />
  );

  expect(container.querySelector("script")).toBeNull();
  expect(container.textContent).toContain(payload);
});

it("does not create an image with an unsafe event handler", () => {
  const payload = '<img src="x" onerror="alert(1)">';

  const { container } = render(
    <MarkdownMessage content={payload} />
  );

  expect(container.querySelector("img")).toBeNull();
  expect(container.textContent).toContain(payload);
});

it("renders Java code with its language and Copy Code button", () => {
  const content = [
    "```java",
    'System.out.println("Hello, HI!");',
    "```",
  ].join("\n");

  const { container } = render(
    <MarkdownMessage content={content} />
  );

  expect(container.querySelector(".hi-md-codeblock")).not.toBeNull();

  expect(container.querySelector("pre code")?.textContent).toContain(
    'System.out.println("Hello, HI!");'
  );

  expect(screen.getByText("java")).toBeTruthy();

  expect(
    screen.getByRole("button", { name: "Copy code" })
  ).toBeTruthy();
});

it("renders HTML characters inside code without creating HTML elements", () => {
  const content = [
    "```html",
    '<img src="x" onerror="alert(1)">',
    "```",
  ].join("\n");

  const { container } = render(
    <MarkdownMessage content={content} />
  );

  expect(container.querySelector("pre code")?.textContent).toContain(
    '<img src="x" onerror="alert(1)">'
  );

  expect(container.querySelector("img")).toBeNull();
});
