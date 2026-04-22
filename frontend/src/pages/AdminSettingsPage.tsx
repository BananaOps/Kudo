import { useEffect, useState } from "react";
import type { AdminSettings, AdminSettingsErrors, Challenge, ChallengeCompletion } from "../types/kudos";
import { useAdminSettings } from "../hooks/useAdminSettings";
import { useAdminChallenges } from "../hooks/useChallenges";
import { useUsers } from "../hooks/useUsers";
import { applyTheme, useTheme } from "../context/ThemeContext";
import { getFAIcon } from "../utils/faIconMap";

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

// ── Emoji picker ─────────────────────────────────────────────────────────────

const EMOJI_OPTIONS = ['⚡', '🌟', '🔥', '💫', '🎉', '🚀', '💎', '🌈', '🏆', '❤️', '👏', '🤝'];

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
  hasError?: boolean;
}

function EmojiPicker({ value, onChange, hasError }: EmojiPickerProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Grid of preset options */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {EMOJI_OPTIONS.map((emoji) => {
          const active = value === emoji;
          return (
            <button
              key={emoji}
              type="button"
              onClick={() => onChange(emoji)}
              title={emoji}
              style={{
                width: 40, height: 40, fontSize: 20,
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${active ? 'var(--coral)' : 'var(--line)'}`,
                background: active ? 'var(--coral-light)' : 'var(--surface)',
                cursor: 'pointer',
                boxShadow: active ? '0 0 0 3px var(--coral-border)' : 'none',
                transition: 'all 0.1s',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)'; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface)'; }}
            >
              {emoji}
            </button>
          );
        })}
      </div>

      {/* Input — toujours lié à la valeur courante, permet aussi un emoji custom */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          id="emoji"
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="⚡"
          style={{
            width: 80, padding: '7px 10px', textAlign: 'center', fontSize: 18,
            border: `1px solid ${hasError ? 'var(--danger)' : 'var(--line)'}`,
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'var(--font-sans)', color: 'var(--ink)',
            background: 'var(--surface)', outline: 'none',
            boxSizing: 'border-box' as const,
          }}
        />
        <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>
          or type any emoji
        </span>
      </div>
    </div>
  );
}

// ── Color field ───────────────────────────────────────────────────────────────

function ColorField({ id, label, value, onChange }: {
  id: string; label: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label htmlFor={id} style={{
        fontSize: 11, fontWeight: 700, color: 'var(--muted)',
        textTransform: 'uppercase', letterSpacing: '.07em',
        fontFamily: 'var(--font-sans)',
      }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          id={id}
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width: 44, height: 44, padding: 2, border: '1px solid var(--line)',
            borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: 'var(--surface)',
          }}
        />
        <span style={{
          fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--ink)',
          background: 'var(--surface-2)', padding: '5px 10px',
          borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)',
        }}>{value}</span>
      </div>
    </div>
  );
}

// ── App icon preview ──────────────────────────────────────────────────────────

function AppIconPreview({ coral, teal, emoji }: { coral: string; teal: string; emoji: string }) {
  const icon = getFAIcon(emoji);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <svg viewBox="0 0 100 100" width="64" height="64"
        style={{ display: 'block', borderRadius: 14, flexShrink: 0 }}>
        <rect width="100" height="100" rx="22" fill={teal} />
        <rect x="4.5" y="4.5" width="91" height="91" rx="20" fill={coral} />
        <svg x="23" y="23" width="54" height="54" viewBox={icon.viewBox}>
          <path d={icon.path} fill={teal} />
        </svg>
      </svg>
      <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-sans)', lineHeight: 1.6 }}>
        Preview — changes apply live across the interface.<br />
        Save to persist for all users.
      </div>
    </div>
  );
}

// ── AdminSettingsForm ─────────────────────────────────────────────────────────

interface AdminSettingsFormProps {
  initialValues: AdminSettings;
  saveState: { status: string; message?: string };
  onSubmit: (values: AdminSettings) => Promise<void>;
  onSaved?: (values: AdminSettings) => void;
}

function AdminSettingsForm({ initialValues, saveState, onSubmit, onSaved = () => {} }: AdminSettingsFormProps) {
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
    void onSubmit(values).then(() => onSaved(values));
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
        <Field id="emoji" label="Currency emoji" hint="Click to choose the emoji members type to give a kudo." error={errors.emoji}>
          <EmojiPicker
            value={values.emoji}
            onChange={(v) => { set("emoji", v); applyTheme(values.colorCoral || '#FF7B6B', values.colorTeal || '#4ECDC4', v); }}
            hasError={!!errors.emoji}
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

      {/* Section 3 — Appearance */}
      <Section
        icon="fa-solid fa-palette"
        title="Appearance"
        description="Customize the two brand colours used across the interface and app icon."
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <ColorField
            id="colorCoral"
            label="Primary colour (coral)"
            value={values.colorCoral || '#FF7B6B'}
            onChange={(v) => { set('colorCoral', v); applyTheme(v, values.colorTeal || '#4ECDC4', values.emoji); }}
          />
          <ColorField
            id="colorTeal"
            label="Accent colour (teal)"
            value={values.colorTeal || '#4ECDC4'}
            onChange={(v) => { set('colorTeal', v); applyTheme(values.colorCoral || '#FF7B6B', v, values.emoji); }}
          />
        </div>
        <AppIconPreview coral={values.colorCoral || '#FF7B6B'} teal={values.colorTeal || '#4ECDC4'} emoji={values.emoji || '⚡'} />
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

// ── Challenges admin section ──────────────────────────────────────────────────

function CreateChallengeForm({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reward, setReward] = useState(5);
  const [expiresAt, setExpiresAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || reward <= 0) { setError('Title and a positive reward are required.'); return; }
    setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/admin/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, kudoReward: reward, expiresAt: expiresAt || undefined }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error ?? `Error ${res.status}`); }
      setTitle(''); setDescription(''); setReward(5); setExpiresAt('');
      onCreated();
    } catch (e) { setError((e as Error).message); }
    finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em', display: 'block', marginBottom: 5 }}>Title *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Ship a feature to production" style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontSize: 14, fontFamily: 'var(--font-sans)', color: 'var(--ink)', background: 'var(--bg)', outline: 'none', boxSizing: 'border-box' as const }} />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em', display: 'block', marginBottom: 5 }}>Reward ⚡ *</label>
          <input type="number" min={1} max={100} value={reward} onChange={e => setReward(Number(e.target.value))} style={{ width: 90, padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontSize: 14, fontFamily: 'var(--font-sans)', color: 'var(--ink)', background: 'var(--bg)', outline: 'none', boxSizing: 'border-box' as const }} />
        </div>
      </div>
      <div>
        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em', display: 'block', marginBottom: 5 }}>Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What does completing this challenge look like?" rows={2} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontSize: 14, fontFamily: 'var(--font-sans)', color: 'var(--ink)', background: 'var(--bg)', outline: 'none', resize: 'vertical', boxSizing: 'border-box' as const }} />
      </div>
      <div>
        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em', display: 'block', marginBottom: 5 }}>Expires at <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
        <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} style={{ padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontSize: 14, fontFamily: 'var(--font-sans)', color: 'var(--ink)', background: 'var(--bg)', outline: 'none' }} />
      </div>
      {error && <p role="alert" style={{ margin: 0, fontSize: 13, color: '#DC2626' }}>{error}</p>}
      <div>
        <button type="submit" disabled={submitting} style={{ background: 'var(--coral)', color: '#fff', border: '1px solid var(--coral-dark)', borderRadius: 'var(--radius-sm)', padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)', opacity: submitting ? 0.7 : 1, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {submitting && <i className="fa-solid fa-spinner fa-spin" />}
          <i className="fa-solid fa-plus" /> Create challenge
        </button>
      </div>
    </form>
  );
}

function ChallengeRow({ challenge, onToggle }: { challenge: Challenge; onToggle: () => void }) {
  const [saving, setSaving] = useState(false);
  const toggle = async () => {
    setSaving(true);
    await fetch(`/api/admin/challenges/${challenge.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !challenge.isActive }),
    });
    setSaving(false);
    onToggle();
  };
  const expiresAt = challenge.expiresAt ? new Date(challenge.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{challenge.title}</span>
          <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 10, background: challenge.isActive ? 'var(--teal-light)' : 'var(--surface-2)', border: `1px solid ${challenge.isActive ? 'var(--teal-border)' : 'var(--line)'}`, color: challenge.isActive ? 'var(--teal)' : 'var(--muted)', fontWeight: 600 }}>
            {challenge.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 3 }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>⚡ {challenge.kudoReward} sparks</span>
          {expiresAt && <span style={{ fontSize: 12, color: 'var(--muted)' }}>· Expires {expiresAt}</span>}
        </div>
      </div>
      <button onClick={toggle} disabled={saving} style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)', background: 'var(--surface)', fontSize: 12, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)', color: 'var(--ink)' }}>
        {saving ? <i className="fa-solid fa-spinner fa-spin" /> : challenge.isActive ? 'Deactivate' : 'Activate'}
      </button>
    </div>
  );
}

function CompletionRow({ completion, onReview }: { completion: ChallengeCompletion; onReview: () => void }) {
  const [loading, setLoading] = useState(false);

  const review = async (action: 'approve' | 'reject') => {
    setLoading(true);
    await fetch(`/api/admin/challenges/completions/${completion.id}/${action}`, { method: 'POST' });
    setLoading(false);
    onReview();
  };

  return (
    <div style={{ padding: '14px 0', borderBottom: '1px solid var(--line)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
            {completion.userName}
            <span style={{ fontWeight: 400, color: 'var(--muted)' }}> · {completion.challengeTitle}</span>
          </div>
          {completion.note && (
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--muted)', fontStyle: 'italic', lineHeight: 1.5 }}>"{completion.note}"</p>
          )}
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
            Submitted {new Date(completion.requestedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button onClick={() => review('approve')} disabled={loading} style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--teal-border)', background: 'var(--teal-light)', fontSize: 12, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', color: 'var(--teal)', fontFamily: 'var(--font-sans)' }}>
            <i className="fa-solid fa-check" style={{ marginRight: 4 }} /> Approve
          </button>
          <button onClick={() => review('reject')} disabled={loading} style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid #FCA5A5', background: '#FEF2F2', fontSize: 12, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', color: '#DC2626', fontFamily: 'var(--font-sans)' }}>
            <i className="fa-solid fa-times" style={{ marginRight: 4 }} /> Reject
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminChallengesSection() {
  const { status, reload, ...rest } = useAdminChallenges();
  const challenges   = status === 'success' ? (rest as { challenges: Challenge[]; completions: ChallengeCompletion[] }).challenges   : [];
  const completions  = status === 'success' ? (rest as { challenges: Challenge[]; completions: ChallengeCompletion[] }).completions  : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 760 }}>
      {/* Create form */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '24px 28px', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <i className="fa-solid fa-plus-circle" style={{ color: 'var(--coral)', fontSize: 15 }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-sans)' }}>New challenge</span>
        </div>
        <CreateChallengeForm onCreated={reload} />
      </div>

      {/* Pending completions */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '24px 28px', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <i className="fa-solid fa-clock" style={{ color: 'var(--coral)', fontSize: 15 }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-sans)' }}>Pending validations</span>
          {completions.length > 0 && (
            <span style={{ fontSize: 11, fontWeight: 700, background: 'var(--coral)', color: '#fff', borderRadius: 10, padding: '2px 7px' }}>{completions.length}</span>
          )}
        </div>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--muted)' }}>Review completion requests and award sparks.</p>
        {status === 'loading' && <div style={{ color: 'var(--muted)', fontSize: 13 }}>Loading…</div>}
        {completions.length === 0 && status !== 'loading' && (
          <div style={{ color: 'var(--muted)', fontSize: 13, padding: '8px 0' }}>No pending requests.</div>
        )}
        {completions.map(c => <CompletionRow key={c.id} completion={c} onReview={reload} />)}
      </div>

      {/* Challenge list */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '24px 28px', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <i className="fa-solid fa-list" style={{ color: 'var(--coral)', fontSize: 15 }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-sans)' }}>All challenges</span>
        </div>
        {status === 'loading' && <div style={{ color: 'var(--muted)', fontSize: 13 }}>Loading…</div>}
        {challenges.length === 0 && status !== 'loading' && (
          <div style={{ color: 'var(--muted)', fontSize: 13, padding: '8px 0' }}>No challenges created yet.</div>
        )}
        {challenges.map(c => <ChallengeRow key={c.id} challenge={c} onToggle={reload} />)}
      </div>
    </div>
  );
}

// ── Admins section ────────────────────────────────────────────────────────────

interface AdminUser { id: string; name: string; }

function AdminsSection() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [devMode, setDevMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const { users } = useUsers();

  const load = () => {
    setLoading(true);
    fetch('/api/admin/admins')
      .then(r => r.json())
      .then((d: { admins: AdminUser[]; devMode: boolean }) => {
        setAdmins(d.admins ?? []);
        setDevMode(d.devMode ?? false);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!selectedId) return;
    const user = users.find(u => u.userId === selectedId);
    if (!user) return;
    setAdding(true); setError('');
    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.userId, name: user.name }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setSelectedId('');
      load();
    } catch (e) { setError((e as Error).message); }
    finally { setAdding(false); }
  };

  const remove = async (id: string) => {
    await fetch(`/api/admin/admins/${id}`, { method: 'DELETE' });
    load();
  };

  const available = users.filter(u => !admins.some(a => a.id === u.userId));

  return (
    <div style={{ maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {devMode && (
        <div style={{
          background: '#FFF8E8', border: '1px solid #FFE4A0',
          borderRadius: 'var(--radius-sm)', padding: '12px 16px',
          fontSize: 13, color: '#92600A', fontFamily: 'var(--font-sans)',
          display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <i className="fa-solid fa-triangle-exclamation" style={{ marginTop: 1, flexShrink: 0 }} />
          <span>
            <strong>Dev mode</strong> — no admins are defined, so everyone has admin access.
            Add at least one admin below to restrict access.
          </span>
        </div>
      )}

      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '24px 28px', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <i className="fa-solid fa-shield-halved" style={{ color: 'var(--coral)', fontSize: 15 }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-sans)' }}>
            Admins
          </span>
          {admins.length > 0 && (
            <span style={{ fontSize: 11, fontWeight: 700, background: 'var(--coral)', color: '#fff', borderRadius: 10, padding: '2px 7px' }}>
              {admins.length}
            </span>
          )}
        </div>

        {loading ? (
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>Loading…</div>
        ) : admins.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontSize: 13, padding: '4px 0 12px' }}>No admins defined yet.</div>
        ) : (
          <div style={{ marginBottom: 16 }}>
            {admins.map(a => (
              <div key={a.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 0', borderBottom: '1px solid var(--line)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 6,
                    background: 'var(--coral-light)', border: '1px solid var(--coral-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: 'var(--coral-dark)',
                    fontFamily: 'var(--font-sans)',
                  }}>
                    {a.name.split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)', fontFamily: 'var(--font-sans)' }}>
                    {a.name}
                  </span>
                </div>
                <button
                  onClick={() => remove(a.id)}
                  style={{
                    padding: '5px 10px', borderRadius: 'var(--radius-sm)',
                    border: '1px solid #FCA5A5', background: '#FEF2F2',
                    fontSize: 12, cursor: 'pointer', color: '#DC2626',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  <i className="fa-solid fa-times" style={{ marginRight: 4 }} />Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add admin */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8 }}>
          <select
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            style={{
              flex: 1, padding: '9px 12px', border: '1px solid var(--line)',
              borderRadius: 'var(--radius-sm)', fontSize: 14,
              fontFamily: 'var(--font-sans)', color: 'var(--ink)',
              background: 'var(--surface)', outline: 'none',
            }}
          >
            <option value="">— Select a member —</option>
            {available.map(u => (
              <option key={u.userId} value={u.userId}>{u.name}</option>
            ))}
          </select>
          <button
            onClick={add}
            disabled={!selectedId || adding}
            style={{
              background: selectedId && !adding ? 'var(--coral)' : 'var(--surface-2)',
              color: selectedId && !adding ? '#fff' : 'var(--muted-2)',
              border: `1px solid ${selectedId && !adding ? 'var(--coral-dark)' : 'var(--line)'}`,
              borderRadius: 'var(--radius-sm)', padding: '9px 16px',
              fontSize: 13, fontWeight: 600,
              cursor: selectedId && !adding ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font-sans)',
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'background 0.12s',
            }}
          >
            {adding
              ? <i className="fa-solid fa-spinner fa-spin" />
              : <i className="fa-solid fa-user-plus" />
            }
            Add admin
          </button>
        </div>
        {error && <p style={{ margin: '8px 0 0', fontSize: 13, color: '#DC2626' }}>{error}</p>}
      </div>
    </div>
  );
}

// ── AdminSettingsPage ─────────────────────────────────────────────────────────

export function AdminSettingsPage() {
  const { load, save, submit } = useAdminSettings();
  const { setTheme } = useTheme();
  const [adminTab, setAdminTab] = useState<'settings' | 'challenges' | 'admins'>('settings');

  const segStyle = (active: boolean): React.CSSProperties => ({
    padding: '5px 14px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
    fontSize: 13, fontFamily: 'var(--font-sans)', fontWeight: active ? 600 : 400,
    background: active ? 'var(--coral)' : 'transparent',
    color: active ? '#fff' : 'var(--muted)',
    transition: 'all 0.15s',
  });

  return (
    <>
      {/* Topbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>
          <span>Kudo</span><span style={{ margin: '0 6px' }}>›</span>
          <span>Admin</span><span style={{ margin: '0 6px' }}>›</span>
          <span style={{ color: 'var(--ink)', fontWeight: 500 }}>
            {adminTab === 'settings' ? 'Settings' : adminTab === 'challenges' ? 'Challenges' : 'Admins'}
          </span>
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
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontFamily: 'var(--font-sans)', fontSize: 44, fontWeight: 800,
          lineHeight: 1.06, margin: '0 0 8px', color: 'var(--ink)', letterSpacing: '-0.8px',
        }}>
          {adminTab === 'settings'
            ? <>Workspace <em style={{ fontStyle: 'italic', color: 'var(--coral)' }}>settings</em></>
            : adminTab === 'challenges'
            ? <>Manage <em style={{ fontStyle: 'italic', color: 'var(--coral)' }}>challenges</em></>
            : <>Manage <em style={{ fontStyle: 'italic', color: 'var(--coral)' }}>admins</em></>
          }
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0, fontFamily: 'var(--font-sans)' }}>
          {adminTab === 'settings'
            ? 'Configure how recognition works for your workspace.'
            : adminTab === 'challenges'
            ? 'Create challenges and validate completion requests to award sparks.'
            : 'Control who can access the admin panel.'}
        </p>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, padding: 3, gap: 2, width: 'fit-content', marginBottom: 28 }}>
        <button style={segStyle(adminTab === 'settings')} onClick={() => setAdminTab('settings')}>
          <i className="fa-solid fa-gear" style={{ marginRight: 6 }} />Settings
        </button>
        <button style={segStyle(adminTab === 'challenges')} onClick={() => setAdminTab('challenges')}>
          <i className="fa-solid fa-trophy" style={{ marginRight: 6 }} />Challenges
        </button>
        <button style={segStyle(adminTab === 'admins')} onClick={() => setAdminTab('admins')}>
          <i className="fa-solid fa-shield-halved" style={{ marginRight: 6 }} />Admins
        </button>
      </div>

      {adminTab === 'challenges' && <AdminChallengesSection />}
      {adminTab === 'admins' && <AdminsSection />}

      {adminTab === 'settings' && (
      <>
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
            onSaved={(v) => setTheme({ coral: v.colorCoral, teal: v.colorTeal, emoji: v.emoji })}
          />
        )}
      </div>
      </>
      )}
    </>
  );
}

// ── Mock data ─────────────────────────────────────────────────────────────────

export const MOCK_SETTINGS: AdminSettings = {
  emoji: "⚡",
  currencySingular: "Spark",
  currencyPlural: "Sparks",
  dailyAllowance: 5,
  colorCoral: "#FF7B6B",
  colorTeal: "#4ECDC4",
};

export { AdminSettingsForm };
