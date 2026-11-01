
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
