
 // @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import ThemeStudio from "./ThemeStudio";
afterEach(() => cleanup());
describe("INFOTEX HI Theme Studio", () => {
  it("shows the active theme and handles selection", () => {
    const onSelect = vi.fn();

    render(
      <ThemeStudio selected="blue" onSelect={onSelect} />
    );

    const blueButton = screen.getByRole("button", {
      name: "Apply Original Blue Glass theme",
    });

    const noirButton = screen.getByRole("button", {
      name: "Apply Cobalt Noir theme",
    });

    expect(blueButton.getAttribute("aria-pressed")).toBe("true");
    expect(noirButton.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(noirButton);

    expect(onSelect).toHaveBeenCalledWith("noir");
  });

  it("restores the default Blue Glass theme", () => {
    const onSelect = vi.fn();

    const { rerender } = render(
      <ThemeStudio selected="noir" onSelect={onSelect} />
    );

    const resetButton = screen.getByRole("button", {
      name: /Restore original blue/i,
    });

    expect((resetButton as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(resetButton);

    expect(onSelect).toHaveBeenCalledWith("blue");

    rerender(
      <ThemeStudio selected="blue" onSelect={onSelect} />
    );

    expect((resetButton as HTMLButtonElement).disabled).toBe(true);
  });
});
