// @vitest-environment jsdom
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import Auth from "./Auth";
import { api } from "../services/api";
vi.mock("../services/api", async (orig) => ({
  ...(await orig<typeof import("../services/api")>()), api: vi.fn(),
}));
const mock = vi.mocked(api);
const health = {status:"ok",mode:"live"};
beforeEach(() => {
  window.history.replaceState(null,"","/workspace?auth=login");
  mock.mockReset();
  mock.mockResolvedValue({ok:true});
});
afterEach(() => cleanup());
describe("secure authentication flow", () => {
  it("requires email OTP before account activation and never auto logs in", async () => {
    const onLogin=vi.fn();
    render(<Auth onLogin={onLogin} health={health}/>);
    fireEvent.click(screen.getByRole("button",{name:"Create account"}));
    fireEvent.change(screen.getByLabelText("Your name"),{target:{value:"Sample"}});
    fireEvent.change(screen.getByLabelText("Email address"),{target:{value:"sample@example.test"}});
    fireEvent.change(screen.getByLabelText("Password · minimum 6 characters"),{target:{value:"abc123"}});
    fireEvent.click(screen.getByRole("button",{name:"Send verification code"}));
    await waitFor(() => expect(mock).toHaveBeenCalledWith("auth/register","POST",{
      name:"Sample", email:"sample@example.test",password:"abc123"
    }));
    expect(await screen.findByRole("heading",{name:"VERIFY EMAIL."})).toBeTruthy();
    expect(onLogin).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("6-digit email code"),{target:{value:"345678"}});
    fireEvent.click(screen.getByRole("button",{name:"Verify and create account"}));
    await waitFor(() => expect(mock).toHaveBeenCalledWith("auth/verify-registration","POST",{
      email:"sample@example.test",code:"345678"
    }));
    expect(await screen.findByRole("heading",{name:"WELCOME BACK."})).toBeTruthy();
    expect(onLogin).not.toHaveBeenCalled();
  });
  it("supports forgot password, code verification, and new password", async () => {
    render(<Auth onLogin={vi.fn()} health={health}/>);
    fireEvent.click(screen.getByRole("button",{name:"Forgot password?"}));
    fireEvent.change(screen.getByLabelText("Email address"),{target:{value:"user@example.test"}});
    fireEvent.click(screen.getByRole("button",{name:"Send reset code"}));
    expect(await screen.findByRole("heading",{name:"CHECK YOUR INBOX."})).toBeTruthy();
    fireEvent.change(screen.getByLabelText("6-digit email code"),{target:{value:"123456"}});
    fireEvent.click(screen.getByRole("button",{name:"Verify reset code"}));
    expect(await screen.findByRole("heading",{name:"NEW PASSWORD."})).toBeTruthy();
    fireEvent.change(screen.getByLabelText("New password · minimum 6 characters"),{target:{value:"abcdef"}});
    fireEvent.click(screen.getByRole("button",{name:"Reset password"}));
    await waitFor(() => expect(mock).toHaveBeenCalledWith("auth/reset-password","POST",{
      email:"user@example.test",code:"123456",new_password:"abcdef"
    }));
    expect(await screen.findByText("Password updated. Please sign in again.")).toBeTruthy();
  });
  it("keeps a failed login on sign in with an error message", async () => {
    mock.mockRejectedValueOnce(new Error("Invalid email or password"));
    render(<Auth onLogin={vi.fn()} health={health}/>);
    fireEvent.change(screen.getByLabelText("Email address"),{target:{value:"bad@example.test"}});
    fireEvent.change(screen.getByLabelText("Password"),{target:{value:"wrongpw"}});
    fireEvent.click(screen.getByRole("button",{name:"Sign in to HI"}));
    expect(await screen.findByRole("alert")).toHaveProperty("textContent","Invalid email or password");
    expect(screen.getByRole("heading",{name:"WELCOME BACK."})).toBeTruthy();
  });
});
