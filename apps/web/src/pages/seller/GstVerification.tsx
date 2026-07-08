import { GstVerificationPanel } from '../../components/GstVerificationPanel';
import { PageHeading } from '../../components/ui';

export function SellerGstVerification() {
  return (
    <div>
      <PageHeading
        eyebrow="Seller requirement"
        title="GST verification"
        description="An ACTIVE GST registration is required before you can publish any listing. We verify your GSTIN through the Masters India API and auto-fill your business name from the response."
      />
      <GstVerificationPanel
        intro={
          <p>
            Sellers must have an <span className="font-semibold text-navy">ACTIVE</span> GST
            registration to create and publish listings on BIM. Enter your GSTIN below —
            we&apos;ll validate it, confirm it isn&apos;t cancelled or suspended, and pull your
            registered business name automatically.
          </p>
        }
      />
    </div>
  );
}
