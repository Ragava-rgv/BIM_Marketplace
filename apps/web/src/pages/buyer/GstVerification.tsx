import { GstVerificationPanel } from '../../components/GstVerificationPanel';
import { PageHeading } from '../../components/ui';

export function BuyerGstVerification() {
  return (
    <div>
      <PageHeading
        eyebrow="Buyer requirement"
        title="GST verification"
        description="An ACTIVE GST registration is required before you can submit a finance application through BIM's lending partners. Browsing and messaging sellers does not require GST."
      />
      <GstVerificationPanel
        intro={
          <p>
            You can browse listings and message sellers right away — GST verification is only a
            gating step before you submit a <span className="font-semibold text-navy">loan application</span>.
            Enter your GSTIN below — we&apos;ll validate it, confirm it isn&apos;t cancelled or
            suspended, and pull your registered business name automatically.
          </p>
        }
      />
    </div>
  );
}
