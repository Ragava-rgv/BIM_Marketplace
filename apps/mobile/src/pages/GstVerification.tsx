import { useNavigate } from 'react-router-dom';
import { GstStatus } from '@machinebazaar/shared';
import { useAuth } from '../lib/auth-context';
import { AppLayout } from '../components/AppLayout';
import { ChevronRightIcon } from '../components/icons';

export function GstVerification() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isActive = user?.gstStatus === GstStatus.ACTIVE;
  const isInactive = user?.gstStatus === GstStatus.INACTIVE;

  return (
    <AppLayout>
      <div className="bg-white border-b border-gray-200 px-4 pt-4 pb-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center">
          <ChevronRightIcon className="w-4 h-4 text-gray-500 rotate-180" />
        </button>
        <h1 className="text-[17px] font-extrabold text-ink tracking-[-0.3px]">GST Verification</h1>
      </div>

      <div className="px-4 pt-5 space-y-4">
        {/* Status card */}
        <div className={`rounded-[14px] px-4 py-4 border ${
          isActive ? 'bg-green-bg border-green-bdr' :
          isInactive ? 'bg-copper-bg border-copper-bdr' :
          'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-[#12B76A]' : isInactive ? 'bg-copper' : 'bg-gray-400'}`} />
            <p className={`text-[13px] font-bold ${isActive ? 'text-green-txt' : isInactive ? 'text-copper' : 'text-gray-700'}`}>
              GST Status: {user?.gstStatus ?? 'NOT VERIFIED'}
            </p>
          </div>
          {user?.gstNumber && (
            <p className="font-mono text-[11px] text-gray-600 ml-4">{user.gstNumber}</p>
          )}
        </div>

        {/* Why it matters */}
        <div className="bg-white border border-gray-200 rounded-[14px] p-4">
          <p className="text-[13px] font-bold text-ink mb-2">Why GST verification matters</p>
          <div className="space-y-2">
            {[
              'Required to publish listings (sellers)',
              'Required to apply for machine loans (buyers)',
              'Builds trust with counterparties',
              'Mandatory for commission-tracked transactions',
            ].map((item) => (
              <div key={item} className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-forest/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-2.5 h-2.5" fill="none" stroke="#E8820C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 10 10">
                    <polyline points="1.5 5 4 7.5 8.5 2.5" />
                  </svg>
                </span>
                <p className="text-[12px] text-gray-600">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {!isActive && (
          <div className="bg-forest rounded-[14px] px-4 py-4">
            <p className="text-[13px] font-bold text-white mb-1">Complete verification on desktop</p>
            <p className="text-[11.5px] text-white/70 mb-3">
              GST verification involves a multi-step document upload process. Use the desktop site for the best experience.
            </p>
            <p className="font-mono text-[11px] font-semibold text-[#9BD8B8] tracking-[0.05em]">
              machinebazaar.in/{'>'}{user?.role === 'SELLER' ? 'seller' : 'buyer'}/gst
            </p>
          </div>
        )}

        {isActive && (
          <div className="bg-green-bg border border-green-bdr rounded-[14px] px-4 py-3 flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="#067647" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 20 20">
              <path d="M10 2a8 8 0 1 0 0 16A8 8 0 0 0 10 2z" /><polyline points="6 10 9 13 14 7" />
            </svg>
            <p className="text-[12.5px] font-semibold text-green-txt">Your GST is verified. You're all set!</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

