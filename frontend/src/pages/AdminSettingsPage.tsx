import { useEffect, useState } from "react";
import type { AdminSettings, AdminSettingsErrors } from "../types/kudos";
import { useAdminSettings } from "../hooks/useAdminSettings";

// ── Validation ────────────────────────────────────────────────────────────────

function validate(values: AdminSettings): AdminSettingsErrors {
  const errors: AdminSettingsErrors = {};

  if (!values.emoji.trim())
    errors.emoji = "Emoji is required.";

  if (!values.currencySingular.trim())
    errors.currencySingular = "Singular name is required.";

  if (!values.currencyPlural.trim())
    errors.currencyPlural = "Plural name is required.";

  if (!Number.isInteger(values.dailyAllowance) || values.dailyAllowance < 1)
    errors.dailyAllowance = "Daily allowance must be a whole number greater than 0.";

  return errors;
}

// ── Field ─────────────────────────────────────────────────────────────────────

interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

function Field({ id, label, hint, error, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
      {children}
      {error && (
        <p role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

// ── Input class helper ────────────────────────────────────────────────────────

function inputCls(hasError: boolean) {
  return [
    "block w-full rounded-lg border px-3 py-2 text-sm shadow-sm outline-none",
    "transition focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1",
    hasError
      ? "border-red-400 bg-red-50 focus:border-red-400"
      : "border-slate-300 bg-white focus:border-indigo-400",
  ].join(" ");
}

// ── Preview badge ─────────────────────────────────────────────────────────────

function PreviewBadge({ settings }: { settings: AdminSettings }) {
  const { emoji, currencyPlural, dailyAllowance } = settings;
  if (!emoji || !currencyPlural) return null;
  return (
    <p className="rounded-lg bg-indigo-50 px-4 py-2.5 text-sm text-indigo-700 ring-1 ring-indigo-100">
      Members will receive{" "}
      <strong>
        {dailyAllowance} {currencyPlural}
      </strong>{" "}
      per day — e.g. <span className="font-mono">{emoji} @alice great work!</span>
    </p>
  );
}

// ── AdminSettingsForm (pure presentational) ───────────────────────────────────

interface AdminSettingsFormProps {
  initialValues: AdminSettings;
  saveState: { status: string; message?: string };
  onSubmit: (values: AdminSettings) => Promise<void>;
}

function AdminSettingsForm({
  initialValues,
  saveState,
  onSubmit,
}: AdminSettingsFormProps) {
  const [values, setValues] = useState<AdminSettings>(initialValues);
  const [errors, setErrors] = useState<AdminSettingsErrors>({});
  const [dirty, setDirty] = useState(false);

  // Sync form when server reloads (e.g. after a successful save).
  useEffect(() => {
    setValues(initialValues);
    setDirty(false);
  }, [initialValues]);

  function set<K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    // Clear field error on change.
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setDirty(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const found = validate(values);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }
    void onSubmit(values);
  }

  const isSaving = saveState.status === "saving";

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Live preview */}
      <PreviewBadge settings={values} />

      {/* Currency emoji */}
      <Field
        id="emoji"
        label="Currency emoji"
        hint="The emoji members type to give a kudo (e.g. ⚡ or 🌮)."
        error={errors.emoji}
      >
        <input
          id="emoji"
          type="text"
          value={values.emoji}
          onChange={(e) => set("emoji", e.target.value)}
          placeholder="⚡"
          className={inputCls(!!errors.emoji)}
          aria-invalid={!!errors.emoji}
          aria-describedby={errors.emoji ? "emoji-error" : undefined}
        />
      </Field>

      {/* Singular name */}
      <Field
        id="currencySingular"
        label="Currency name (singular)"
        hint='Displayed in notifications — e.g. "lightning bolt".'
        error={errors.currencySingular}
      >
        <input
          id="currencySingular"
          type="text"
          value={values.currencySingular}
          onChange={(e) => set("currencySingular", e.target.value)}
          placeholder="lightning bolt"
          className={inputCls(!!errors.currencySingular)}
          aria-invalid={!!errors.currencySingular}
        />
      </Field>

      {/* Plural name */}
      <Field
        id="currencyPlural"
        label="Currency name (plural)"
        hint='Displayed in the leaderboard — e.g. "lightning bolts".'
        error={errors.currencyPlural}
      >
        <input
          id="currencyPlural"
          type="text"
          value={values.currencyPlural}
          onChange={(e) => set("currencyPlural", e.target.value)}
          placeholder="lightning bolts"
          className={inputCls(!!errors.currencyPlural)}
          aria-invalid={!!errors.currencyPlural}
        />
      </Field>

      {/* Daily allowance */}
      <Field
        id="dailyAllowance"
        label="Daily allowance"
        hint="Maximum kudos each member may give per day."
        error={errors.dailyAllowance}
      >
        <input
          id="dailyAllowance"
          type="number"
          min={1}
          step={1}
          value={values.dailyAllowance}
          onChange={(e) => set("dailyAllowance", Number(e.target.value))}
          className={`${inputCls(!!errors.dailyAllowance)} w-32`}
          aria-invalid={!!errors.dailyAllowance}
        />
      </Field>

      {/* Save feedback */}
      {saveState.status === "saved" && (
        <p role="status" className="text-sm font-medium text-emerald-600">
          ✓ Settings saved successfully.
        </p>
      )}
      {saveState.status === "error" && (
        <p role="alert" className="text-sm font-medium text-red-600">
          Failed to save: {saveState.message}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isSaving || !dirty}
          className={[
            "rounded-lg px-5 py-2 text-sm font-semibold text-white shadow-sm transition",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500",
            isSaving || !dirty
              ? "cursor-not-allowed bg-indigo-300"
              : "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800",
          ].join(" ")}
        >
          {isSaving ? "Saving…" : "Save settings"}
        </button>

        {dirty && (
          <button
            type="button"
            onClick={() => {
              setValues(initialValues);
              setErrors({});
              setDirty(false);
            }}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Discard changes
          </button>
        )}
      </div>
    </form>
  );
}

// ── AdminSettingsPage ─────────────────────────────────────────────────────────

export function AdminSettingsPage() {
  const { load, save, submit } = useAdminSettings();

  return (
    <>
      {/* Topbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
          <span>Kudi</span><span style={{ margin: '0 6px' }}>›</span>
          <span>Admin</span><span style={{ margin: '0 6px' }}>›</span>
          <span style={{ color: 'var(--ink)', fontWeight: 500 }}>Workspace settings</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 999, padding: '5px 12px', fontSize: 12, color: 'var(--muted)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--good)', display: 'inline-block' }} />
            Synced with Slack · 2 min ago
          </span>
          <button style={{ background: 'var(--surface)', border: '1px solid var(--line)', padding: '7px 12px', borderRadius: 10, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans)', color: 'var(--ink)' }}>
            View audit log
          </button>
        </div>
      </div>

      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 44, fontWeight: 800, lineHeight: 1.06, margin: '0 0 8px', color: 'var(--ink)', letterSpacing: '-0.8px' }}>Workspace settings</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>Configure how recognition works for everyone at <strong style={{ color: 'var(--ink)' }}>Northwind Labs</strong> · 128 members</p>
      </div>

      {/* Settings card */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '28px 32px', maxWidth: 640, boxShadow: 'var(--shadow-sm)' }}>
        {load.status === "loading" && (
          <div aria-label="Loading settings" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[0,1,2,3].map((i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ height: 14, width: '33%', background: 'var(--surface-2)', borderRadius: 6, animation: 'pulse 1.5s ease-in-out infinite' }} />
                <div style={{ height: 36, background: 'var(--surface-2)', borderRadius: 10, animation: 'pulse 1.5s ease-in-out infinite' }} />
              </div>
            ))}
          </div>
        )}

        {load.status === "error" && (
          <div role="alert" style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 'var(--radius-sm)', padding: '14px 18px', fontSize: 14, color: '#DC2626' }}>
            Failed to load settings: {load.message}
          </div>
        )}

        {load.status === "ready" && (
          <AdminSettingsForm
            initialValues={load.settings}
            saveState={save}
            onSubmit={submit}
          />
        )}
      </div>
    </>
  );
}

// ── Mock data ─────────────────────────────────────────────────────────────────

export const MOCK_SETTINGS: AdminSettings = {
  emoji: "⚡",
  currencySingular: "lightning bolt",
  currencyPlural: "lightning bolts",
  dailyAllowance: 5,
};

// Export form for isolated testing without the hook.
export { AdminSettingsForm };
