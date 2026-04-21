import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LeaderboardPage, MOCK_ENTRIES } from "./LeaderboardPage";

describe("LeaderboardPage", () => {
  it("renders the page title", () => {
    render(<LeaderboardPage entries={MOCK_ENTRIES} />);
    expect(screen.getByText(/leaderboard/i)).toBeInTheDocument();
  });

  it("renders all entries", () => {
    render(<LeaderboardPage entries={MOCK_ENTRIES} />);
    for (const entry of MOCK_ENTRIES) {
      expect(screen.getByText(entry.name)).toBeInTheDocument();
    }
  });

  it("renders kudos counts", () => {
    render(<LeaderboardPage entries={MOCK_ENTRIES} />);
    expect(screen.getByText(/42/)).toBeInTheDocument();
  });

  it("shows empty state when no entries", () => {
    render(<LeaderboardPage entries={[]} />);
    expect(screen.getByText(/no kudos given yet/i)).toBeInTheDocument();
  });

  it("renders medal emojis for top 3", () => {
    render(<LeaderboardPage entries={MOCK_ENTRIES} />);
    expect(screen.getByLabelText("Rank 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Rank 2")).toBeInTheDocument();
    expect(screen.getByLabelText("Rank 3")).toBeInTheDocument();
  });
});
