
 // @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { CopyText } from "./MarkdownMessage";

afterEach(() => cleanup());

describe("INFOTEX HI clipboard reliability", () => {
  it("clears the success state when a later copy fails", async () => {
    const writeText = vi.fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("Clipboard blocked"));

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(<CopyText text="Hello INFOTEX HI" label="Copy code" />);

    const button = screen.getByRole("button", {
      name: "Copy code",
    });

    fireEvent.click(button);

    await screen.findByText("Copied");
    expect(button.querySelector(".lucide-check")).not.toBeNull();

    fireEvent.click(button);

    await screen.findByText("Copy unavailable");

    expect(writeText).toHaveBeenCalledTimes(2);
    expect(button.querySelector(".lucide-check")).toBeNull();
    expect(button.getAttribute("title")).toBe(
      "Clipboard unavailable"
    );
  });
});
