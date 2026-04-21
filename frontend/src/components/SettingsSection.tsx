interface SettingsSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function SettingsSection({ title, description, children }: SettingsSectionProps) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-stone-900">{title}</h2>
        {description && <p className="text-sm text-stone-500 mt-1">{description}</p>}
      </div>
      <div className="border-t border-stone-100 pt-5">{children}</div>
    </div>
  );
}
