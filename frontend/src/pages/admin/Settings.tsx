import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api, apiErrorMessage } from '../../lib/api';
import { Button, Card, ErrorBanner, Field, Input, PageHeading } from '../../components/ui';

interface AppSetting {
  key: string;
  label: string;
  value: string;
  updatedAt: string;
}

function SettingRow({ setting, onSaved }: { setting: AppSetting; onSaved: () => void }) {
  const { t } = useTranslation();
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
      setError(apiErrorMessage(err, t('admin.settings.saveError')));
    } finally {
      setSaving(false);
    }
  };

  const dirty = value !== setting.value;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-navy/10 bg-white p-5 sm:flex-row sm:items-end">
      <div className="flex-1">
        <Field label={setting.label} hint={t('admin.settings.keyHint', { key: setting.key })}>
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t('admin.settings.valuePlaceholder')}
          />
        </Field>
        {error && <p className="mt-1.5 text-xs text-rose-600">{error}</p>}
        {success && <p className="mt-1.5 text-xs text-forest font-semibold">{t('admin.settings.saved')}</p>}
      </div>
      <Button disabled={!dirty || saving} onClick={save} className="shrink-0">
        {saving ? t('admin.settings.saving') : t('common:common.button.save')}
      </Button>
    </div>
  );
}

export function AdminSettings() {
  const { t } = useTranslation();
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
        if (!cancelled) setError(apiErrorMessage(err, t('admin.settings.loadError')));
      });
    return () => { cancelled = true; };
  }, [reload]);

  return (
    <div>
      <PageHeading
        eyebrow={t('admin.settings.eyebrow')}
        title={t('admin.settings.title')}
        description={t('admin.settings.description')}
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
        <p className="text-sm text-muted">{t('admin.settings.empty')}</p>
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
