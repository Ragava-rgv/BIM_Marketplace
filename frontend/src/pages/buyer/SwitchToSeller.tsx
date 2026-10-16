import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GstStatus } from '../../shared';
import { apiErrorMessage } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import {
  Button,
  Card,
  ErrorBanner,
  PageHeading,
} from '../../components/ui';
import {
  CheckCircleIcon,
  ChevronRightIcon,
  MachineIcon,
  ShieldCheckIcon,
} from '../../components/icons';

export function BuyerSwitchToSeller() {
  const { t } = useTranslation();
  const { user, switchMode, switchToSeller } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isGstActive = user?.gstStatus === GstStatus.ACTIVE;

  // Already has seller capability — just toggle the mode
  if (user?.canSell) {
    return (
      <div>
        <PageHeading
          eyebrow={t('buyer.switchToSeller.eyebrow')}
          title={t('buyer.switchToSeller.alreadySeller.title')}
          description={t('buyer.switchToSeller.alreadySeller.description')}
        />
        <Card>
          <div className="flex items-center gap-3 mb-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[9px] bg-forest text-white">
              <ShieldCheckIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-forest">{t('buyer.switchToSeller.alreadySeller.activeLabel')}</p>
              {user?.gstNumber && (
                <p className="font-mono text-xs text-forest/70 mt-0.5">{user.gstNumber}</p>
              )}
            </div>
          </div>
          <p className="text-sm text-muted mb-4">
            {t('buyer.switchToSeller.alreadySeller.switchInfo')}
          </p>
          <div className="flex gap-3">
            <Button
              onClick={async () => {
                await switchMode('SELLER');
                navigate('/seller/dashboard', { replace: true });
              }}
            >
              {t('buyer.switchToSeller.alreadySeller.goToDashboard')}
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
            <Link to="/buyer/dashboard">
              <Button variant="secondary">{t('buyer.switchToSeller.alreadySeller.stayBuyer')}</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const handleEnable = async () => {
    setLoading(true);
    setError(null);
    try {
      await switchToSeller();
      navigate('/seller/dashboard', { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, t('buyer.switchToSeller.errorEnable')));
      setLoading(false);
    }
  };

  const benefitItems = t('buyer.switchToSeller.benefits.items', { returnObjects: true }) as string[];

  return (
    <div>
      <PageHeading
        eyebrow={t('buyer.switchToSeller.eyebrow')}
        title={t('buyer.switchToSeller.title')}
        description={t('buyer.switchToSeller.description')}
      />

      {/* GST gate */}
      {!isGstActive && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-amber-100 text-amber-600">
              <ShieldCheckIcon className="h-5 w-5" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-amber-800">{t('buyer.switchToSeller.gstGate.title')}</p>
              <p className="mt-1 text-sm text-amber-700 leading-relaxed">
                {t('buyer.switchToSeller.gstGate.description')}
              </p>
              <p className="mt-2 text-sm font-semibold text-amber-800">
                {t('buyer.switchToSeller.gstGate.currentStatusLabel')}{' '}
                <span className="uppercase tracking-wide">
                  {t(`common:status.gst.${user?.gstStatus ?? GstStatus.UNVERIFIED}`)}
                </span>
              </p>
            </div>
          </div>
          <div className="mt-5 flex gap-3">
            <Link to="/buyer/gst-verification">
              <Button>
                {t('buyer.switchToSeller.gstGate.verifyButton')}
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/buyer/dashboard">
              <Button variant="secondary">{t('buyer.switchToSeller.gstGate.backButton')}</Button>
            </Link>
          </div>
        </Card>
      )}

      {/* GST active — confirm */}
      {isGstActive && (
        <div className="space-y-5">
          <Card className="border-forest/20 bg-[#f0faf4]">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[9px] bg-forest text-white">
                <ShieldCheckIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold text-forest">{t('buyer.switchToSeller.gstVerified.title')}</p>
                {user?.gstNumber && (
                  <p className="font-mono text-xs text-forest/70 mt-0.5">{user.gstNumber}</p>
                )}
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-start gap-3 mb-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-navy/[0.06]">
                <MachineIcon className="h-5 w-5 text-navy" />
              </span>
              <div>
                <p className="font-semibold text-navy">{t('buyer.switchToSeller.benefits.title')}</p>
                <p className="mt-1 text-sm text-muted">
                  {t('buyer.switchToSeller.benefits.description')}
                </p>
              </div>
            </div>

            <ul className="space-y-3 border-t border-line pt-4">
              {benefitItems.map((text) => (
                <li key={text} className="flex items-start gap-3">
                  <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
                  <span className="text-sm text-navy">{text}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            {error && <ErrorBanner message={error} />}
            <div className="flex gap-3 mt-1">
              <Button onClick={handleEnable} disabled={loading}>
                {loading ? t('buyer.switchToSeller.enabling') : t('buyer.switchToSeller.enableButton')}
                {!loading && <ChevronRightIcon className="h-4 w-4" />}
              </Button>
              <Link to="/buyer/dashboard">
                <Button variant="secondary" disabled={loading}>{t('common:common.button.cancel')}</Button>
              </Link>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
