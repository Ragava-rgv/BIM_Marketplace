import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GstStatus } from '../../shared';
import { api, apiErrorMessage } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { AppLayout } from '../../components/AppLayout';
import { CheckIcon, ChevronRightIcon, ShieldIcon } from '../../components/icons';

export function BuyerSwitchToSeller() {
  const { t } = useTranslation();
  const { user, authenticate } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const isGstActive = user.gstStatus === GstStatus.ACTIVE;
  const whatChangesItems = t('buyer.switchToSeller.whatChangesItems', { returnObjects: true }) as string[];

  const handleSwitch = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post<{ accessToken: string; refreshToken: string }>(
        '/auth/switch-to-seller',
      );
      await authenticate(data);
      navigate('/seller/dashboard', { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, t('buyer.switchToSeller.switchError')));
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="bg-white border-b border-gray-200 px-4 pt-4 pb-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center">
          <ChevronRightIcon className="w-4 h-4 text-gray-500 rotate-180" />
        </button>
        <div>
          <p className="font-mono text-[9.5px] font-semibold text-gray-500 tracking-[0.08em]">{t('buyer.switchToSeller.badge')}</p>
          <h1 className="text-[17px] font-extrabold text-ink tracking-[-0.3px]">{t('buyer.switchToSeller.title')}</h1>
        </div>
      </div>

      <div className="px-4 pt-4 pb-6 space-y-4">
        {!isGstActive ? (
          /* GST gate */
          <>
            <div className="bg-copper-bg border border-copper-bdr rounded-[13px] px-4 py-4">
              <div className="flex items-start gap-3">
                <ShieldIcon className="w-5 h-5 text-copper mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[13px] font-bold text-copper mb-1">{t('buyer.switchToSeller.gstGate.title')}</p>
                  <p className="text-[11.5px] text-copper/80 leading-relaxed">
                    {t('buyer.switchToSeller.gstGate.description')}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-[13px] px-4 py-4">
              <p className="text-[13px] font-bold text-ink mb-3">{t('buyer.switchToSeller.currentStatusTitle')}</p>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  user.gstStatus === GstStatus.INACTIVE ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    user.gstStatus === GstStatus.INACTIVE ? 'bg-red-500' : 'bg-gray-400'
                  }`} />
                  {t(`common:status.gst.${user.gstStatus}`)}
                </span>
              </div>
              <p className="text-[11.5px] text-gray-500 mt-2">
                {t('buyer.switchToSeller.verifyHint')}
              </p>
            </div>

            <button
              onClick={() => navigate('/buyer/gst-verification')}
              className="w-full h-[50px] bg-copper text-white rounded-[13px] text-[14.5px] font-bold"
            >
              {t('buyer.switchToSeller.verifyNowButton')}
            </button>
            <button
              onClick={() => navigate(-1)}
              className="w-full h-[44px] bg-gray-100 text-gray-700 rounded-[13px] text-[13.5px] font-semibold"
            >
              {t('buyer.switchToSeller.backToDashboard')}
            </button>
          </>
        ) : (
          /* GST active — show confirm flow */
          <>
            {/* GST verified badge */}
            <div className="bg-green-bg border border-green-bdr rounded-[13px] px-4 py-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-[10px] bg-forest flex items-center justify-center flex-shrink-0">
                <ShieldIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-green-txt">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-txt" />
                    {t('buyer.switchToSeller.gstActiveBadge')}
                  </span>
                </div>
                <p className="font-mono text-[10.5px] text-gray-500 tracking-widest">{user.gstNumber}</p>
                {user.businessName && (
                  <p className="text-[12px] font-semibold text-ink">{user.businessName}</p>
                )}
              </div>
            </div>

            {/* What changes checklist */}
            <div className="bg-white border border-gray-200 rounded-[13px] px-4 py-4">
              <p className="text-[13px] font-bold text-ink mb-3">{t('buyer.switchToSeller.whatChangesTitle')}</p>
              {whatChangesItems.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5 mb-2.5 last:mb-0">
                  <CheckIcon className="w-3.5 h-3.5 text-forest mt-0.5 flex-shrink-0" />
                  <p className="text-[12px] text-gray-600">{item}</p>
                </div>
              ))}
            </div>

            {error && (
              <p className="text-[12px] text-red-600 font-medium bg-red-50 border border-red-200 rounded-[10px] px-3 py-2.5">
                {error}
              </p>
            )}

            <button
              onClick={handleSwitch}
              disabled={loading}
              className="w-full h-[52px] bg-forest text-white rounded-[13px] text-[15px] font-bold disabled:opacity-50"
            >
              {loading ? t('buyer.switchToSeller.switching') : t('buyer.switchToSeller.confirmButton')}
            </button>
            <button
              onClick={() => navigate(-1)}
              disabled={loading}
              className="w-full h-[44px] bg-gray-100 text-gray-700 rounded-[13px] text-[13.5px] font-semibold disabled:opacity-50"
            >
              {t('common:common.button.cancel')}
            </button>
          </>
        )}
      </div>
    </AppLayout>
  );
}
