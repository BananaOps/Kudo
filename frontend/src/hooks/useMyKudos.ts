import { useEffect, useState } from "react";
import type { MyKudosResponse } from "../types/kudos";

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: MyKudosResponse };

/**
 * Fetches a user's kudos and stats from /api/me/kudos.
 * Pass userId to fetch for a specific user; omit to use the server default.
 */
export function useMyKudos(userId = ''): State {
  const url = userId
    ? `/api/me/kudos?userId=${encodeURIComponent(userId)}`
    : '/api/me/kudos';

  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    setState({ status: "loading" });

    fetch(url)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Server responded with ${res.status}`);
        }
        return res.json() as Promise<MyKudosResponse>;
      })
      .then((data) => {
        if (!cancelled) setState({ status: "success", data });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : "Unknown error";
          setState({ status: "error", message });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return state;
}
