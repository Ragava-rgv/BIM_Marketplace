import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { GstStatus } from '../shared';
import { api, apiErrorMessage } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { Button, Card, ErrorBanner, Field, Input, StatusBadge, SuccessBanner } from './ui';
import { CheckCircleIcon, ShieldCheckIcon } from './icons';

const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

/**
 * Shared GST verification UI for both seller and buyer flows. The 7-step
 * Masters India lookup happens server-side (gst.service.ts); this panel just
 * submits the GSTIN and reflects the resulting gst_status / business_name.
 */
export function GstVerificationPanel({ intro, requireAddress = false }: { intro: ReactNode; requireAddress?: boolean }) {
  const { t } = useTranslation();
  const { user, refreshProfile } = useAuth();
  const [gstNumber, setGstNumber] = useState(user?.gstNumber ?? '');
  const [address, setAddress] = useState(user?.address ?? '');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!user) return null;

  const isActive = user.gstStatus === GstStatus.ACTIVE;
  const valid = GSTIN_PATTERN.test(gstNumber.toUpperCase()) && (!requireAddress || address.trim().length >= 10);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await api.post('/gst/verify', {
        gstNumber: gstNumber.toUpperCase(),
        ...(requireAddress ? { address: address.trim() } : {}),
      });
      await refreshProfile();
      setSuccess(t('components.gstVerificationPanel.verifySuccess'));
    } catch (err) {
      setError(apiErrorMessage(err, t('components.gstVerificationPanel.verifyError')));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-navy/[0.06] text-navy'}`}>
            <ShieldCheckIcon className="h-6 w-6" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-navy/40">{t('components.gstVerificationPanel.currentStatus')}</p>
            <div className="mt-1 flex items-center gap-2">
              <StatusBadge status={user.gstStatus} />
              {user.businessName && <span className="text-sm font-medium text-navy">{user.businessName}</span>}
            </div>
          </div>
        </div>
        {user.gstNumber && <p className="font-mono text-sm tracking-wide text-navy/55">{user.gstNumber}</p>}
      </Card>

      <Card>
        <div className="mb-5 text-sm leading-relaxed text-navy/60">{intro}</div>

        {isActive ? (
          <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
            <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0" />
            <p>
              {t('components.gstVerificationPanel.verifiedPrefix')} <span className="font-semibold">{user.gstNumber}</span> {t('components.gstVerificationPanel.verifiedMiddle')}
              {user.businessName && (
                <>
                  {' '}{t('components.gstVerificationPanel.verifiedFor')} <span className="font-semibold">{user.businessName}</span>
                </>
              )}
              . {t('components.gstVerificationPanel.verifiedSuffix')}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <ErrorBanner message={error} />}
            {success && <SuccessBanner message={success} />}
            <Field label={t('components.gstVerificationPanel.gstinLabel')} hint={t('components.gstVerificationPanel.gstinHint')}>
              <Input
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value.toUpperCase().slice(0, 15))}
                placeholder="27AAACU9603R1ZM"
                className="font-mono uppercase tracking-wide"
                required
              />
            </Field>
            {requireAddress && (
              <Field label={t('components.gstVerificationPanel.businessAddressLabel')} hint={t('components.gstVerificationPanel.businessAddressHint')}>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={t('components.gstVerificationPanel.businessAddressPlaceholder')}
                  required
                  minLength={10}
                />
              </Field>
            )}
            <Button type="submit" disabled={!valid || submitting}>
              {submitting ? t('components.gstVerificationPanel.verifying') : t('components.gstVerificationPanel.verifyButton')}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
