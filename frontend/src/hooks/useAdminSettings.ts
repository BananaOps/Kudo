import { useCallback, useEffect, useState } from "react";
import type { AdminSettings } from "../types/kudos";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; settings: AdminSettings };

type SaveState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "saved" }
  | { status: "error"; message: string };

export interface UseAdminSettingsReturn {
  load: LoadState;
  save: SaveState;
  submit: (settings: AdminSettings) => Promise<void>;
}

/**
 * Loads admin settings from GET /api/admin/settings and exposes a `submit`
 * function that PUTs updated settings back to the same endpoint.
 */
export function useAdminSettings(
  url = "/api/admin/settings",
): UseAdminSettingsReturn {
  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const [save, setSave] = useState<SaveState>({ status: "idle" });

  // ── Initial load ────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoad({ status: "loading" });

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Server responded with ${res.status}`);
        return res.json() as Promise<AdminSettings>;
      })
      .then((settings) => {
        if (!cancelled) setLoad({ status: "ready", settings });
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setLoad({
            status: "error",
            message: err instanceof Error ? err.message : "Unknown error",
          });
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  // ── Save ────────────────────────────────────────────────────────────────────
  const submit = useCallback(
    async (settings: AdminSettings) => {
      setSave({ status: "saving" });
      try {
        const res = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settings),
        });
        if (!res.ok) throw new Error(`Server responded with ${res.status}`);
        // Reflect saved values back into load state so form re-renders with
        // the authoritative data returned by the server.
        const updated = (await res.json()) as AdminSettings;
        setLoad({ status: "ready", settings: updated });
        setSave({ status: "saved" });
      } catch (err: unknown) {
        setSave({
          status: "error",
          message: err instanceof Error ? err.message : "Unknown error",
        });
      }
    },
    [url],
  );

  return { load, save, submit };
}
