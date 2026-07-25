import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GstStatus } from '@machinebazaar/shared';
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
          eyebrow="Account"
          title="Seller mode enabled"
          description="You already have seller access. Use the dashboard toggle or header menu to switch between buyer and seller views."
        />
        <Card>
          <div className="flex items-center gap-3 mb-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[9px] bg-forest text-white">
              <ShieldCheckIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-forest">Seller access is active</p>
              {user?.gstNumber && (
                <p className="font-mono text-xs text-forest/70 mt-0.5">{user.gstNumber}</p>
              )}
            </div>
          </div>
          <p className="text-sm text-muted mb-4">
            You can freely switch between buyer and seller mode at any time — your listings stay live regardless of which mode you're in.
          </p>
          <div className="flex gap-3">
            <Button
              onClick={async () => {
                await switchMode('SELLER');
                navigate('/seller/dashboard', { replace: true });
              }}
            >
              Go to seller dashboard
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
            <Link to="/buyer/dashboard">
              <Button variant="secondary">Stay in buyer mode</Button>
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
      setError(apiErrorMessage(err, 'Could not enable seller mode. Please try again.'));
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeading
        eyebrow="Account"
        title="Enable seller mode"
        description="Verify your GST to start listing machines. You can switch back to buyer mode any time — your listings stay live either way."
      />

      {/* GST gate */}
      {!isGstActive && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-amber-100 text-amber-600">
              <ShieldCheckIcon className="h-5 w-5" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-amber-800">GST verification required to sell</p>
              <p className="mt-1 text-sm text-amber-700 leading-relaxed">
                GST verification is mandatory before enabling seller mode. It ensures buyers deal
                only with verified businesses and enables commission-tracked transactions.
              </p>
              <p className="mt-2 text-sm font-semibold text-amber-800">
                Current status:{' '}
                <span className="uppercase tracking-wide">{user?.gstStatus ?? 'UNVERIFIED'}</span>
              </p>
            </div>
          </div>
          <div className="mt-5 flex gap-3">
            <Link to="/buyer/gst-verification">
              <Button>
                Verify GST now
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/buyer/dashboard">
              <Button variant="secondary">Back to dashboard</Button>
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
                <p className="font-semibold text-forest">GST verified — you can enable seller mode</p>
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
                <p className="font-semibold text-navy">What you get with seller mode</p>
                <p className="mt-1 text-sm text-muted">
                  Seller mode is freely switchable — you can go back to buyer view any time.
                </p>
              </div>
            </div>

            <ul className="space-y-3 border-t border-line pt-4">
              {[
                'List machines and receive admin-vetted buyer enquiries',
                'Access the seller dashboard, listings manager, and subscription plan',
                'Switch back to buyer mode at any time — your listings stay live',
                'Your buyer history (saved listings, loan applications) is unaffected',
              ].map((text) => (
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
                {loading ? 'Enabling...' : 'Enable seller mode'}
                {!loading && <ChevronRightIcon className="h-4 w-4" />}
              </Button>
              <Link to="/buyer/dashboard">
                <Button variant="secondary" disabled={loading}>Cancel</Button>
              </Link>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
