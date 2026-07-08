import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GstStatus } from '@machinebazaar/shared';
import { api, apiErrorMessage } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { AppLayout } from '../../components/AppLayout';
import { CheckIcon, ChevronRightIcon, ShieldIcon } from '../../components/icons';

export function BuyerSwitchToSeller() {
  const { user, authenticate } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const isGstActive = user.gstStatus === GstStatus.ACTIVE;

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
      setError(apiErrorMessage(err, 'Could not switch account. Please try again.'));
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
          <p className="font-mono text-[9.5px] font-semibold text-gray-500 tracking-[0.08em]">ACCOUNT</p>
          <h1 className="text-[17px] font-extrabold text-ink tracking-[-0.3px]">Switch to Seller</h1>
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
                  <p className="text-[13px] font-bold text-copper mb-1">GST verification required</p>
                  <p className="text-[11.5px] text-copper/80 leading-relaxed">
                    Sellers on BIM must have an ACTIVE GST registration. Complete GST
                    verification before switching your account.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-[13px] px-4 py-4">
              <p className="text-[13px] font-bold text-ink mb-3">Current GST status</p>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  user.gstStatus === GstStatus.INACTIVE ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    user.gstStatus === GstStatus.INACTIVE ? 'bg-red-500' : 'bg-gray-400'
                  }`} />
                  {user.gstStatus}
                </span>
              </div>
              <p className="text-[11.5px] text-gray-500 mt-2">
                Verify your GSTIN to unlock seller access. Once verified, you can switch
                your account and start listing machines immediately.
              </p>
            </div>

            <button
              onClick={() => navigate('/buyer/gst-verification')}
              className="w-full h-[50px] bg-copper text-white rounded-[13px] text-[14.5px] font-bold"
            >
              Verify GST now <-’
            </button>
            <button
              onClick={() => navigate(-1)}
              className="w-full h-[44px] bg-gray-100 text-gray-700 rounded-[13px] text-[13.5px] font-semibold"
            >
              Back to dashboard
            </button>
          </>
        ) : (
          /* GST active "” show confirm flow */
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
                    GST ACTIVE
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
              <p className="text-[13px] font-bold text-ink mb-3">What happens when you switch</p>
              {[
                'Your account becomes a seller account',
                'You can create listings immediately',
                'Your GST, profile and history are kept',
                'Buyers can enquire about your listings',
                'This action cannot be reversed from the app',
              ].map((item) => (
                <div key={item} className="flex items-start gap-2.5 mb-2.5 last:mb-0">
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
              {loading ? 'Switching account...' : 'Yes, switch to seller <-’'}
            </button>
            <button
              onClick={() => navigate(-1)}
              disabled={loading}
              className="w-full h-[44px] bg-gray-100 text-gray-700 rounded-[13px] text-[13.5px] font-semibold disabled:opacity-50"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </AppLayout>
  );
}


