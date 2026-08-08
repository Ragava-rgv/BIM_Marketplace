import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GstStatus } from '@machinebazaar/shared';
import { api, apiErrorMessage } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { AppLayout } from '../../components/AppLayout';
import { CheckIcon, ChevronRightIcon, ShieldIcon } from '../../components/icons';

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const inputCls =
  'w-full h-[50px] bg-gray-50 border border-gray-200 rounded-[12px] px-4 text-[14px] text-ink font-mono font-medium placeholder-gray-400 outline-none focus:border-forest focus:bg-white transition uppercase tracking-widest';

export function BuyerGstVerification() {
  const { t } = useTranslation();
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [gstNumber, setGstNumber] = useState(user?.gstNumber ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!user) return null;

  const isActive = user.gstStatus === GstStatus.ACTIVE;
  const valid = GSTIN_RE.test(gstNumber.toUpperCase());

  const whyItems = t('buyer.gstVerification.whyItems', { returnObjects: true }) as string[];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await api.post('/gst/verify', { gstNumber: gstNumber.toUpperCase() });
      await refreshProfile();
      setSuccess(t('buyer.gstVerification.success'));
    } catch (err) {
      setError(apiErrorMessage(err, t('buyer.gstVerification.error')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 pt-4 pb-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center">
          <ChevronRightIcon className="w-4 h-4 text-gray-500 rotate-180" />
        </button>
        <div>
          <p className="font-mono text-[9.5px] font-semibold text-copper tracking-[0.08em]">{t('buyer.gstVerification.badge')}</p>
          <h1 className="text-[17px] font-extrabold text-ink tracking-[-0.3px]">{t('buyer.gstVerification.title')}</h1>
        </div>
      </div>

      <div className="px-4 pt-4 pb-6 space-y-4">
        {/* Current status card */}
        <div className={`rounded-[13px] border px-4 py-4 flex items-center gap-3 ${
          isActive ? 'bg-green-bg border-green-bdr' : 'bg-white border-gray-200'
        }`}>
          <div className={`w-11 h-11 rounded-[11px] flex items-center justify-center flex-shrink-0 ${
            isActive ? 'bg-green-txt/10' : 'bg-gray-100'
          }`}>
            <ShieldIcon className={`w-5 h-5 ${isActive ? 'text-green-txt' : 'text-gray-500'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-gray-500 mb-0.5">{t('buyer.gstVerification.statusLabel')}</p>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                isActive ? 'bg-green-txt/10 text-green-txt' :
                user.gstStatus === GstStatus.INACTIVE ? 'bg-red-50 text-red-600' :
                'bg-gray-100 text-gray-600'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  isActive ? 'bg-green-txt' :
                  user.gstStatus === GstStatus.INACTIVE ? 'bg-red-500' : 'bg-gray-400'
                }`} />
                {t(`common:status.gst.${user.gstStatus}`)}
              </span>
              {user.businessName && (
                <span className="text-[12px] font-semibold text-ink truncate">{user.businessName}</span>
              )}
            </div>
            {user.gstNumber && (
              <p className="font-mono text-[10.5px] text-gray-400 mt-0.5 tracking-widest">{user.gstNumber}</p>
            )}
          </div>
        </div>

        {isActive ? (
          /* Already verified */
          <div className="bg-green-bg border border-green-bdr rounded-[13px] px-4 py-4 flex items-start gap-3">
            <CheckIcon className="w-5 h-5 text-green-txt mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[13px] font-bold text-green-txt mb-1">{t('buyer.gstVerification.verified.title')}</p>
              <p className="text-[12px] text-green-txt/80 leading-relaxed">
                {t('buyer.gstVerification.verified.prefix')} <span className="font-mono font-semibold">{user.gstNumber}</span> {t('buyer.gstVerification.verified.suffix')}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Why it matters */}
            <div className="bg-white border border-gray-200 rounded-[13px] px-4 py-4">
              <p className="text-[13px] font-bold text-ink mb-3">{t('buyer.gstVerification.whyTitle')}</p>
              {whyItems.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5 mb-2 last:mb-0">
                  <CheckIcon className="w-3.5 h-3.5 text-forest mt-0.5 flex-shrink-0" />
                  <p className="text-[12px] text-gray-600">{item}</p>
                </div>
              ))}
            </div>

            {/* Verification form */}
            <div className="bg-white border border-gray-200 rounded-[13px] px-4 py-4">
              <p className="text-[13px] font-bold text-ink mb-1">{t('buyer.gstVerification.formTitle')}</p>
              <p className="text-[11.5px] text-gray-500 mb-4 leading-relaxed">
                {t('buyer.gstVerification.formDescription')}
              </p>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    {t('buyer.gstVerification.gstinLabel')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value.toUpperCase().slice(0, 15))}
                    placeholder="27AAACU9603R1ZM"
                    className={inputCls}
                    maxLength={15}
                  />
                  <p className="mt-1 text-[10.5px] text-gray-400">
                    {t('buyer.gstVerification.gstinHint')}
                  </p>
                </div>

                {error && (
                  <p className="text-[12px] text-red-600 font-medium bg-red-50 border border-red-200 rounded-[10px] px-3 py-2.5">
                    {error}
                  </p>
                )}
                {success && (
                  <p className="text-[12px] text-green-txt font-medium bg-green-bg border border-green-bdr rounded-[10px] px-3 py-2.5">
                    {success}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={!valid || loading}
                  className="w-full h-[50px] bg-forest text-white rounded-[13px] text-[14.5px] font-bold disabled:opacity-50"
                >
                  {loading ? t('buyer.gstVerification.verifying') : t('buyer.gstVerification.verifyButton')}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
