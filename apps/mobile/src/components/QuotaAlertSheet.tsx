import { useNavigate } from 'react-router-dom';

interface Props {
  open: boolean;
  quotaUsed: number;
  quotaTotal: number;
  onClose: () => void;
}

export function QuotaAlertSheet({ open, quotaUsed, quotaTotal, onClose }: Props) {
  const navigate = useNavigate();
  if (!open) return null;

  const quotaRemaining = Math.max(0, quotaTotal - quotaUsed);

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/40" />
      <div
        className="fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-[24px] px-6 pt-5"
        style={{ paddingBottom: `calc(env(safe-area-inset-bottom) + 24px)` }}
      >
        <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-5" />
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-[18px] font-extrabold text-ink tracking-[-0.3px]">
            Your contact views remaining
          </h2>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 text-[20px] leading-none px-1">
            ×
          </button>
        </div>

        <div className="bg-forest-bg border border-forest-bdr rounded-[16px] px-5 py-6 text-center mb-4">
          <p className="font-mono text-[32px] font-bold text-forest tracking-tight">
            {quotaUsed}/{quotaTotal}
          </p>
          <p className="text-[12.5px] text-forest/80 mt-1">
            You have viewed {quotaUsed} of {quotaTotal} contacts
          </p>
          <div className="mt-3 h-2 rounded-full bg-white overflow-hidden">
            <div
              className="h-full bg-forest rounded-full transition-all"
              style={{ width: `${quotaTotal > 0 ? Math.min(100, (quotaUsed / quotaTotal) * 100) : 0}%` }}
            />
          </div>
        </div>

        <div className="space-y-2.5">
          <button
            onClick={() => { onClose(); navigate('/buyer/subscription'); }}
            className={`w-full h-[50px] rounded-[13px] text-[14.5px] font-bold ${
              quotaRemaining === 0 ? 'bg-copper text-white' : 'bg-forest text-white'
            }`}
          >
            View more contacts
          </button>
          <button
            onClick={onClose}
            className="w-full h-[46px] bg-gray-100 text-gray-700 rounded-[13px] text-[14px] font-semibold"
          >
            Continue
          </button>
        </div>
      </div>
    </>
  );
}
