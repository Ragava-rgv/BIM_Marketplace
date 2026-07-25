import { useNavigate } from 'react-router-dom';
import { QUOTA_ALERT_AFTER_USED, QUOTA_ALERT_REMAINING_THRESHOLD } from '@machinebazaar/shared';
import { Modal, Button } from './ui';

/** After the 4th+ reveal, and again on every reveal once remaining quota drops below the threshold. */
export function shouldShowQuotaAlert(quotaUsed: number, quotaTotal: number): boolean {
  const quotaRemaining = quotaTotal - quotaUsed;
  return quotaUsed >= QUOTA_ALERT_AFTER_USED || quotaRemaining < QUOTA_ALERT_REMAINING_THRESHOLD;
}

export function QuotaAlertModal({
  open,
  quotaUsed,
  quotaTotal,
  onClose,
}: {
  open: boolean;
  quotaUsed: number;
  quotaTotal: number;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const quotaRemaining = Math.max(0, quotaTotal - quotaUsed);

  return (
    <Modal open={open} onClose={onClose} title="Your contact views remaining">
      <div className="rounded-xl border border-forest-bdr bg-forest-bg p-6 text-center">
        <p className="font-mono text-4xl font-bold text-forest tracking-tight">
          {quotaUsed}/{quotaTotal}
        </p>
        <p className="mt-1.5 text-sm text-forest/80">
          You have viewed {quotaUsed} of {quotaTotal} contacts
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
          <div
            className="h-full rounded-full bg-forest transition-all"
            style={{ width: `${quotaTotal > 0 ? Math.min(100, (quotaUsed / quotaTotal) * 100) : 0}%` }}
          />
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          variant={quotaRemaining === 0 ? 'copper' : 'primary'}
          onClick={() => {
            onClose();
            navigate('/buyer/subscription');
          }}
        >
          View more contacts
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Continue
        </Button>
      </div>
    </Modal>
  );
}
