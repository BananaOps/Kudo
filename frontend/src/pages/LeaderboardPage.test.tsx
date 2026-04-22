import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LeaderboardPage, MOCK_ENTRIES } from "./LeaderboardPage";

function renderPage(entries = MOCK_ENTRIES, search = '') {
  return render(
    <MemoryRouter initialEntries={[`/leaderboard${search}`]}>
      <LeaderboardPage entries={entries} />
    </MemoryRouter>
  );
}

describe("LeaderboardPage", () => {
  it("renders the page title", () => {
    renderPage();
    expect(screen.getByText(/leaderboard/i)).toBeInTheDocument();
  });

  it("renders all entries", () => {
    renderPage();
    for (const entry of MOCK_ENTRIES) {
      expect(screen.getByText(entry.name)).toBeInTheDocument();
    }
  });

  it("renders kudos counts", () => {
    renderPage();
    expect(screen.getByText(/42/)).toBeInTheDocument();
  });

  it("shows empty state when no entries", () => {
    renderPage([]);
    expect(screen.getByText(/no kudos given yet/i)).toBeInTheDocument();
  });

  it("renders medal emojis for top 3", () => {
    renderPage();
    expect(screen.getByLabelText("Rank 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Rank 2")).toBeInTheDocument();
    expect(screen.getByLabelText("Rank 3")).toBeInTheDocument();
  });

  it("pre-selects given tab from query param", () => {
    renderPage(MOCK_ENTRIES, '?tab=given&period=week');
    expect(screen.getByText(/généreuses/i)).toBeInTheDocument();
  });
});
