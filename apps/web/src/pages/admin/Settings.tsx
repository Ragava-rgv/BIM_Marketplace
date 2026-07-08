import { useEffect, useState } from 'react';
import { api, apiErrorMessage } from '../../lib/api';
import { Button, Card, ErrorBanner, Field, Input, PageHeading } from '../../components/ui';

interface AppSetting {
  key: string;
  label: string;
  value: string;
  updatedAt: string;
}

function SettingRow({ setting, onSaved }: { setting: AppSetting; onSaved: () => void }) {
  const [value, setValue] = useState(setting.value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setValue(setting.value);
  }, [setting.value]);

  const save = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await api.patch(`/admin/settings/${setting.key}`, { value });
      setSuccess(true);
      onSaved();
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save setting.'));
    } finally {
      setSaving(false);
    }
  };

  const dirty = value !== setting.value;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-navy/10 bg-white p-5 sm:flex-row sm:items-end">
      <div className="flex-1">
        <Field label={setting.label} hint={`Key: ${setting.key}`}>
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter value"
          />
        </Field>
        {error && <p className="mt-1.5 text-xs text-rose-600">{error}</p>}
        {success && <p className="mt-1.5 text-xs text-forest font-semibold">Saved</p>}
      </div>
      <Button disabled={!dirty || saving} onClick={save} className="shrink-0">
        {saving ? 'Saving…' : 'Save'}
      </Button>
    </div>
  );
}

export function AdminSettings() {
  const [settings, setSettings] = useState<AppSetting[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api
      .get<AppSetting[]>('/admin/settings')
      .then(({ data }) => {
        if (!cancelled) setSettings(data);
      })
      .catch((err) => {
        if (!cancelled) setError(apiErrorMessage(err, 'Could not load settings.'));
      });
    return () => { cancelled = true; };
  }, [reload]);

  return (
    <div>
      <PageHeading
        eyebrow="Admin console"
        title="Platform settings"
        description="Configure platform-wide values. Changes take effect immediately — no redeploy needed."
      />

      {error && (
        <div className="mb-5">
          <ErrorBanner message={error} />
        </div>
      )}

      {settings === null ? (
        <Card>
          <div className="h-12 animate-pulse rounded-lg bg-navy/[0.06]" />
        </Card>
      ) : settings.length === 0 ? (
        <p className="text-sm text-muted">No configurable settings found.</p>
      ) : (
        <div className="space-y-3">
          {settings.map((s) => (
            <SettingRow key={s.key} setting={s} onSaved={() => setReload((n) => n + 1)} />
          ))}
        </div>
      )}
    </div>
  );
}
