// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_THEME,
  THEME_IDS,
  THEME_STORAGE_KEY,
  isThemeId,
  readSavedTheme,
  applyTheme,
  saveTheme,
} from "./theme-system";

describe("INFOTEX HI theme system", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-hi-theme");
    document.documentElement.style.colorScheme = "";
  });

  it("uses Blue Glass as the default theme", () => {
    expect(DEFAULT_THEME).toBe("blue");
    expect(readSavedTheme()).toBe("blue");
  });

  it("recognizes all five supported themes", () => {
    expect(THEME_IDS).toEqual([
      "blue",
      "chocolate",
      "noir",
      "sunshine",
      "sage",
    ]);

    for (const theme of THEME_IDS) {
      expect(isThemeId(theme)).toBe(true);
    }
  });

  it("rejects unknown themes", () => {
    expect(isThemeId("unknown")).toBe(false);

    window.localStorage.setItem(
      THEME_STORAGE_KEY,
      "invalid-theme"
    );

    expect(readSavedTheme()).toBe("blue");
  });

  it("saves and restores the selected theme", () => {
    saveTheme("sage");

    expect(
      window.localStorage.getItem(THEME_STORAGE_KEY)
    ).toBe("sage");

    expect(readSavedTheme()).toBe("sage");
  });

  it("applies the selected theme to the document", () => {
    applyTheme("noir");

    expect(
      document.documentElement.getAttribute("data-hi-theme")
    ).toBe("noir");

    expect(document.documentElement.style.colorScheme)
      .toBe("dark");
  });
});
