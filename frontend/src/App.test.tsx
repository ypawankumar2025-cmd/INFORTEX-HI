// @vitest-environment jsdom
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import App from "./App";
import { api } from "./services/api";
vi.mock("./services/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./services/api")>()),
  api: vi.fn(),
}));
const mock = vi.mocked(api);
let role: string;
let projects: Record<string, unknown>[];
let run: Record<string, any>;
const agentIds = [
  "orchestrator",
  "planning",
  "research",
  "knowledge",
  "finance",
  "execution",
  "critic",
  "memory",
];
beforeEach(() => {
  role = "owner";
  projects = [
    {
      id: "p1",
      workspace_id: "w1",
      name: "Campus Summit",
      description: "A test project",
      created_at: "1793330000",
    },
  ];
  run = {
    id: "r1",
    project_id: "p1",
    conversation_id: "c1",
    status: "awaiting_review",
    prompt: "Plan an event",
    executions: [],
    messages: [],
    approval: [],
    proposal: {
      summary: "Reviewable test proposal",
      tasks: ["Confirm venue"],
      risks: ["Verify availability"],
      sources: [],
      agents: {},
      mode: "demo",
    },
  };
  mock.mockReset();
  mock.mockImplementation(async (path, method = "GET", body?: any) => {
    if (path === "health")
      return {
        status: "ok",
        mode: "demo",
        embedding_model: "demo-lexical-hash-v1",
      };
    if (path === "me")
      return {
        id: "u1",
        name: "Nikhil",
        email: "test@example.test",
        admin: true,
      };
    if (path === "workspaces")
      return [{ id: "w1", name: "Test workspace", role }];
    if (path === "workspaces/w1/projects") {
      if (method === "POST") {
        projects = [
          ...projects,
          { id: "p2", ...body, created_at: "1793330000" },
        ];
        return { id: "p2" };
      }
      return projects;
    }
    if (path === "workspaces/w1/agents")
      return agentIds.map((id) => ({
        id,
        enabled: "1",
        instructions: "",
        responsibility: "Test responsibility",
      }));
    if (path === "workspaces/w1/members")
      return [{ id: "u1", name: "Nikhil", email: "test@example.test", role }];
    if (path === "workspaces/w1/analytics")
      return { tasks: [], runs: [], agents: [], project_count: { count: "1" } };
    if (path === "notifications")
      return [
        {
          id: "n1",
          content: "Welcome to HI",
          is_read: "0",
          created_at: "1793330000",
        },
      ];
    if (path === "admin")
      return {
        users: [],
        counts: { workspaces: "1", projects: "1", runs: "0" },
      };
    if (path === "projects/p1/runs" && method === "POST")
      return { id: "r1", conversation_id: "c1", mode: "demo" };
    if (path === "runs/r1") return { ...run };
    if (path === "runs/r1/review") {
      run.status = body.status;
      return { status: body.status, task_ids: ["t1"] };
    }
    return [];
  });
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
async function ready() {
  render(<App />);
  await screen.findByText("Good to see you, Nikhil.");
  await waitFor(() =>
    expect(
      (screen.getByLabelText("Active project") as HTMLSelectElement).value,
    ).toBe("p1"),
  );
}
describe("workspace UI with an explicit mocked API boundary", () => {
  it("renders all 13 signed-in navigation views without crashing", async () => {
    await ready();
    const routes = [
      ["Workspace", "Your workspace."],
      ["Project details", "Campus Summit"],
      ["Intelligence studio", "Intelligence studio."],
      ["Agent control", "Agent control center."],
      ["Knowledge hub", "Knowledge hub."],
      ["Tasks & milestones", "Tasks & milestones."],
      ["Team collaboration", "Better, together."],
      ["Analytics", "Intelligence analytics."],
      ["Notifications", "Your notifications."],
      ["My profile", "Make yourself at home."],
      ["Settings", "Set the right foundations."],
      ["Administration", "System overview."],
      ["Overview", "Good to see you, Nikhil."],
    ];
    for (const [button, title] of routes) {
      fireEvent.click(
        screen.getByRole("button", { name: button }),
      );
      expect(
        await screen.findByRole("heading", { name: title }),
      ).toBeTruthy();
    }
  });
  it("creates a project from the modal and selects the returned project", async () => {
    await ready();
    fireEvent.click(
      screen.getByRole("button", { name: "Workspace" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "New project" }));
    fireEvent.change(screen.getByLabelText("Project name"), {
      target: { value: "Robotics Lab" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Create project" }),
    );
    await waitFor(() =>
      expect(mock).toHaveBeenCalledWith("workspaces/w1/projects", "POST", {
        name: "Robotics Lab",
        description: "",
      }),
    );
    expect(
      await screen.findByRole("heading", { name: "Robotics Lab" }),
    ).toBeTruthy();
  });
  it("submits explicit event constraints and renders a reviewable proposal", async () => {
    await ready();
    fireEvent.click(
      screen.getByRole("button", { name: "Intelligence studio" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Try a technical event/ }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Start thinking" }));
    await waitFor(() =>
      expect(mock).toHaveBeenCalledWith(
        "projects/p1/runs",
        "POST",
        expect.objectContaining({
          agent: "multi",
          event: true,
          budget: 50000,
          people: 300,
        }),
      ),
    );
    expect(await screen.findByText("Reviewable test proposal")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Approve proposal" }));
    await waitFor(() =>
      expect(mock).toHaveBeenCalledWith("runs/r1/review", "POST", {
        status: "approved",
        feedback: "",
      }),
    );
  });
  it("does not enable approvals for a member", async () => {
    role = "member";
    await ready();
    fireEvent.click(
      screen.getByRole("button", { name: "Intelligence studio" }),
    );
    fireEvent.change(screen.getByLabelText("Your request"), {
      target: { value: "Plan a test event" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Start thinking" }));
    const approve = await screen.findByRole("button", {
      name: "Approve proposal",
    });
    expect((approve as HTMLButtonElement).disabled).toBe(true);
  });
  it("shows backend errors and keeps the request available for correction", async () => {
    await ready();
    fireEvent.click(
      screen.getByRole("button", { name: "Intelligence studio" }),
    );
    fireEvent.change(screen.getByLabelText("Your request"), {
      target: { value: "A test request" },
    });
    mock.mockImplementationOnce(async () => {
      throw new Error("Required agent is disabled: planning");
    });
    fireEvent.click(screen.getByRole("button", { name: "Start thinking" }));
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(
      (screen.getByLabelText("Your request") as HTMLTextAreaElement).value,
    ).toBe("A test request");
  });
});
