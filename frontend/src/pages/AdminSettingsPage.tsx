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

// ── Controlled input with focus ring ─────────────────────────────────────────

interface FieldInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  narrow?: boolean;
}

function FieldInput({ hasError, narrow, ...props }: FieldInputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
      onBlur={(e)  => { setFocused(false); props.onBlur?.(e); }}
      style={{
        display: 'block',
        width: narrow ? 120 : '100%',
        padding: '9px 12px',
        border: `1px solid ${hasError ? 'var(--danger)' : focused ? 'var(--coral)' : 'var(--line)'}`,
        borderRadius: 'var(--radius-sm)',
        fontSize: 14,
        fontFamily: 'var(--font-sans)',
        color: 'var(--ink)',
        background: hasError ? '#FEF2F2' : 'var(--surface)',
        outline: 'none',
        boxShadow: focused
          ? `0 0 0 3px ${hasError ? 'rgba(220,38,38,0.12)' : 'var(--coral-border)'}`
          : 'none',
        transition: 'border-color 0.12s, box-shadow 0.12s',
        boxSizing: 'border-box' as const,
      }}
    />
  );
}

// ── Field wrapper ─────────────────────────────────────────────────────────────

interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

function Field({ id, label, hint, error, children }: FieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label htmlFor={id} style={{
        fontSize: 11, fontWeight: 700, color: 'var(--muted)',
        textTransform: 'uppercase', letterSpacing: '.07em',
        fontFamily: 'var(--font-sans)',
      }}>
        {label}
      </label>
      {hint && (
        <p style={{ fontSize: 12, color: 'var(--muted-2)', margin: 0, fontFamily: 'var(--font-sans)' }}>
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p role="alert" style={{ fontSize: 12, fontWeight: 500, color: 'var(--danger)', margin: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
          <i className="fa-solid fa-circle-exclamation" style={{ fontSize: 11 }} /> {error}
        </p>
      )}
    </div>
  );
}

// ── Preview badge ─────────────────────────────────────────────────────────────

function PreviewBadge({ settings }: { settings: AdminSettings }) {
  const { emoji, currencyPlural, dailyAllowance } = settings;
  if (!emoji || !currencyPlural) return null;
  return (
    <div style={{
      background: 'var(--coral-light)', border: '1px solid var(--coral-border)',
      borderRadius: 'var(--radius-sm)', padding: '12px 16px',
      fontSize: 13, color: 'var(--coral-dark)', fontFamily: 'var(--font-sans)',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <span style={{ fontSize: 18 }}>{emoji}</span>
      <span>
        Members get{' '}
        <strong style={{ fontWeight: 700 }}>{dailyAllowance} {currencyPlural}</strong>
        {' '}per day — e.g.{' '}
        <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, background: 'rgba(255,123,107,0.15)', padding: '1px 5px', borderRadius: 3 }}>
          {emoji} @alice great work!
        </code>
      </span>
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ icon, title, description, children }: {
  icon: string; title: string; description: string; children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 32 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <i className={icon} style={{ fontSize: 13, color: 'var(--coral)' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-sans)' }}>
            {title}
          </span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0, lineHeight: 1.5, fontFamily: 'var(--font-sans)' }}>
          {description}
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {children}
      </div>
    </div>
  );
}

// ── AdminSettingsForm ─────────────────────────────────────────────────────────

interface AdminSettingsFormProps {
  initialValues: AdminSettings;
  saveState: { status: string; message?: string };
  onSubmit: (values: AdminSettings) => Promise<void>;
}

function AdminSettingsForm({ initialValues, saveState, onSubmit }: AdminSettingsFormProps) {
  const [values, setValues] = useState<AdminSettings>(initialValues);
  const [errors, setErrors] = useState<AdminSettingsErrors>({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setValues(initialValues);
    setDirty(false);
  }, [initialValues]);

  function set<K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setDirty(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const found = validate(values);
    if (Object.keys(found).length > 0) { setErrors(found); return; }
    void onSubmit(values);
  }

  const isSaving = saveState.status === "saving";

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* Preview */}
      <div style={{ marginBottom: 28 }}>
        <PreviewBadge settings={values} />
      </div>

      {/* Section 1 — Currency */}
      <Section
        icon="fa-solid fa-bolt"
        title="Kudo currency"
        description="Customize the emoji and name members use when giving recognition."
      >
        <Field id="emoji" label="Currency emoji" hint='The emoji that triggers a kudo — e.g. ⚡ or 🌟.' error={errors.emoji}>
          <FieldInput
            id="emoji"
            type="text"
            value={values.emoji}
            onChange={(e) => set("emoji", e.target.value)}
            placeholder="⚡"
            hasError={!!errors.emoji}
            aria-invalid={!!errors.emoji}
            narrow
          />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field id="currencySingular" label="Currency name (singular)" hint='e.g. "Spark"' error={errors.currencySingular}>
            <FieldInput
              id="currencySingular"
              type="text"
              value={values.currencySingular}
              onChange={(e) => set("currencySingular", e.target.value)}
              placeholder="Spark"
              hasError={!!errors.currencySingular}
              aria-invalid={!!errors.currencySingular}
            />
          </Field>
          <Field id="currencyPlural" label="Currency name (plural)" hint='e.g. "Sparks"' error={errors.currencyPlural}>
            <FieldInput
              id="currencyPlural"
              type="text"
              value={values.currencyPlural}
              onChange={(e) => set("currencyPlural", e.target.value)}
              placeholder="Sparks"
              hasError={!!errors.currencyPlural}
              aria-invalid={!!errors.currencyPlural}
            />
          </Field>
        </div>
      </Section>

      <div style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '28px 0' }} />

      {/* Section 2 — Daily quota */}
      <Section
        icon="fa-solid fa-gauge-high"
        title="Daily quota"
        description="Limit how many kudos each member can give per day."
      >
        <Field
          id="dailyAllowance"
          label="Daily allowance"
          hint="Between 1 and 20. Resets at midnight UTC."
          error={errors.dailyAllowance}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <FieldInput
              id="dailyAllowance"
              type="number"
              min={1}
              max={20}
              step={1}
              value={values.dailyAllowance}
              onChange={(e) => set("dailyAllowance", Number(e.target.value))}
              hasError={!!errors.dailyAllowance}
              aria-invalid={!!errors.dailyAllowance}
              narrow
            />
            {/* Visual dots preview */}
            <div style={{ display: 'flex', gap: 4 }}>
              {Array.from({ length: Math.min(values.dailyAllowance || 0, 10) }).map((_, i) => (
                <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--coral)', opacity: 0.7 + i * 0.03 }} />
              ))}
              {(values.dailyAllowance || 0) > 10 && (
                <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>+{values.dailyAllowance - 10}</span>
              )}
            </div>
          </div>
        </Field>
      </Section>

      <div style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '28px 0' }} />

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="submit"
            disabled={isSaving || !dirty}
            style={{
              background: isSaving || !dirty ? 'var(--surface-2)' : 'var(--coral)',
              color: isSaving || !dirty ? 'var(--muted-2)' : '#fff',
              border: `1px solid ${isSaving || !dirty ? 'var(--line)' : 'var(--coral-dark)'}`,
              borderRadius: 'var(--radius-sm)',
              padding: '9px 18px',
              fontSize: 13, fontWeight: 600,
              cursor: isSaving || !dirty ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-sans)',
              display: 'flex', alignItems: 'center', gap: 7,
              transition: 'background 0.12s, color 0.12s',
            }}
          >
            {isSaving
              ? <><i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 12 }} /> Saving…</>
              : <><i className="fa-solid fa-floppy-disk" style={{ fontSize: 12 }} /> Save settings</>
            }
          </button>
          {dirty && (
            <button
              type="button"
              onClick={() => { setValues(initialValues); setErrors({}); setDirty(false); }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, color: 'var(--muted)', fontFamily: 'var(--font-sans)',
              }}
            >
              Discard changes
            </button>
          )}
        </div>

        {/* Feedback inline */}
        {saveState.status === "saved" && (
          <p role="status" style={{ fontSize: 13, fontWeight: 500, color: 'var(--good)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="fa-solid fa-circle-check" /> Settings saved successfully.
          </p>
        )}
        {saveState.status === "error" && (
          <p role="alert" style={{ fontSize: 13, fontWeight: 500, color: 'var(--danger)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="fa-solid fa-circle-exclamation" /> Failed to save: {saveState.message}
          </p>
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
        <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>
          <span>Kudo</span><span style={{ margin: '0 6px' }}>›</span>
          <span>Admin</span><span style={{ margin: '0 6px' }}>›</span>
          <span style={{ color: 'var(--ink)', fontWeight: 500 }}>Settings</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'var(--surface)', border: '1px solid var(--line)',
            borderRadius: 'var(--radius-pill)', padding: '5px 12px',
            fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-sans)',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--good)', display: 'inline-block' }} />
            Synced · 2 min ago
          </span>
          <button style={{
            background: 'var(--surface)', border: '1px solid var(--line)',
            padding: '7px 12px', borderRadius: 'var(--radius-sm)',
            fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans)', color: 'var(--ink)',
          }}>
            <i className="fa-solid fa-clock-rotate-left" style={{ marginRight: 6, fontSize: 11 }} />
            Audit log
          </button>
        </div>
      </div>

      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontFamily: 'var(--font-sans)', fontSize: 44, fontWeight: 800,
          lineHeight: 1.06, margin: '0 0 8px', color: 'var(--ink)', letterSpacing: '-0.8px',
        }}>
          Workspace <em style={{ fontStyle: 'italic', color: 'var(--coral)' }}>settings</em>
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0, fontFamily: 'var(--font-sans)' }}>
          Configure how recognition works for <strong style={{ color: 'var(--ink)' }}>Northwind Labs</strong> · 128 members
        </p>
      </div>

      {/* Settings card */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--line)',
        borderRadius: 'var(--radius)', padding: '32px 36px',
        maxWidth: 760, boxShadow: 'var(--shadow-sm)',
      }}>
        {load.status === "loading" && (
          <div aria-label="Loading settings" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[0,1,2,3].map((i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ height: 12, width: '25%', background: 'var(--surface-2)', borderRadius: 4, animation: 'pulse 1.5s ease-in-out infinite' }} />
                <div style={{ height: 36, background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', animation: 'pulse 1.5s ease-in-out infinite' }} />
              </div>
            ))}
          </div>
        )}

        {load.status === "error" && (
          <div role="alert" style={{
            background: '#FEF2F2', border: '1px solid #FCA5A5',
            borderRadius: 'var(--radius-sm)', padding: '14px 18px',
            fontSize: 14, color: 'var(--danger)',
          }}>
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
  currencySingular: "Spark",
  currencyPlural: "Sparks",
  dailyAllowance: 5,
};

export { AdminSettingsForm };
