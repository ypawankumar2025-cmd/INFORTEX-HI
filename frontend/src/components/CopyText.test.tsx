
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

it("provides accessible clipboard status feedback", async () => {
  const writeText = vi.fn()
    .mockResolvedValueOnce(undefined)
    .mockRejectedValueOnce(new Error("Clipboard blocked"));

  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });

  render(<CopyText text="Hello HI" label="Copy code" />);

  const status = screen.getByRole("status");

  expect(status.getAttribute("aria-live")).toBe("polite");
  expect(status.getAttribute("aria-atomic")).toBe("true");
  expect(status.textContent).toBe("Copy");

  const button = screen.getByRole("button", {
    name: "Copy code",
  });

  fireEvent.click(button);
  await screen.findByText("Copied");

  expect(status.textContent).toBe("Copied");

  fireEvent.click(button);
  await screen.findByText("Copy unavailable");

  expect(status.textContent).toBe("Copy unavailable");
  expect(writeText).toHaveBeenCalledTimes(2);
});

it("resets copy feedback when the message text changes", async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);

  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });

  const { rerender } = render(
    <CopyText text="Old AI response" label="Copy code" />
  );

  fireEvent.click(
    screen.getByRole("button", { name: "Copy code" })
  );

  await screen.findByText("Copied");

  rerender(
    <CopyText text="Updated AI response" label="Copy code" />
  );

  expect(screen.getByRole("status").textContent).toBe("Copy");

  expect(
    screen
      .getByRole("button", { name: "Copy code" })
      .querySelector(".lucide-check")
  ).toBeNull();

  expect(writeText).toHaveBeenCalledTimes(1);
});