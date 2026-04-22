import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MyKudosPage, MOCK_MY_KUDOS_RESPONSE } from "./MyKudosPage";

// ── fetch mock helpers ────────────────────────────────────────────────────────

function mockFetchSuccess(data: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(data),
    }),
  );
}

function mockFetchError(status = 500) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      status,
    }),
  );
}

function mockFetchNetworkError() {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockRejectedValue(new Error("Network error")),
  );
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.unstubAllGlobals());

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("MyKudosPage", () => {
  it("renders loading skeletons initially", () => {
    // fetch never resolves — stays in loading state
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));
    render(<MyKudosPage />);

    // Skeletons are pulse divs with no text; verify the heading is visible.
    expect(screen.getByText("My Kudos")).toBeInTheDocument();
    expect(
      screen.getByText(/recognition you've received/i),
    ).toBeInTheDocument();
  });

  it("renders stats cards after successful fetch", async () => {
    mockFetchSuccess(MOCK_MY_KUDOS_RESPONSE);
    render(<MyKudosPage />);

    // Stats values from MOCK_MY_KUDOS_RESPONSE
    await waitFor(() => {
      expect(screen.getByText("7")).toBeInTheDocument();          // receivedThisWeek
      expect(screen.getByText("23")).toBeInTheDocument();         // receivedThisMonth
      expect(screen.getAllByText("3").length).toBeGreaterThan(0); // givenThisWeek (may also appear in heatmap stats)
    });
  });

  it("renders received kudo items after successful fetch", async () => {
    mockFetchSuccess(MOCK_MY_KUDOS_RESPONSE);
    render(<MyKudosPage />);

    await waitFor(() => {
      expect(screen.getByText("Bob Dupont")).toBeInTheDocument();
      expect(
        screen.getByText("Fantastic job on the release, you saved the day!"),
      ).toBeInTheDocument();
      expect(screen.getByText("Carol Petit")).toBeInTheDocument();
    });
  });

  it("shows empty-state message when received list is empty", async () => {
    mockFetchSuccess({ ...MOCK_MY_KUDOS_RESPONSE, received: [] });
    render(<MyKudosPage />);

    await waitFor(() => {
      expect(screen.getByText(/no kudos received yet/i)).toBeInTheDocument();
    });
  });

  it("shows error alert on non-OK HTTP response", async () => {
    mockFetchError(500);
    render(<MyKudosPage />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText(/server responded with 500/i)).toBeInTheDocument();
    });
  });

  it("shows error alert on network failure", async () => {
    mockFetchNetworkError();
    render(<MyKudosPage />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it("renders stat labels", async () => {
    mockFetchSuccess(MOCK_MY_KUDOS_RESPONSE);
    render(<MyKudosPage />);

    await waitFor(() => {
      expect(
        screen.getByText(/received this week/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/received this month/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/given this week/i),
      ).toBeInTheDocument();
    });
  });
});
