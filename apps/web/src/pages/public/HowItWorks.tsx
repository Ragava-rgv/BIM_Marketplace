import { Link } from 'react-router-dom';
import {
  ChatIcon,
  CheckCircleIcon,
  DocumentIcon,
  RupeeIcon,
  ShieldCheckIcon,
  TrendDownIcon,
  UploadIcon,
  VideoIcon,
} from '../../components/icons';
import { PageHeading } from '../../components/ui';

const SELLER_STEPS = [
  {
    icon: ShieldCheckIcon,
    title: 'Verify your GST',
    body: 'Sellers must hold an ACTIVE GST registration, validated through the Masters India API. Your legal business name is auto-filled from the verification response.',
  },
  {
    icon: UploadIcon,
    title: 'Build your listing',
    body: 'Add machine details — category, make, model, year, asking price and location — and choose a complexity tier (this drives certification fees later).',
  },
  {
    icon: VideoIcon,
    title: 'Upload proof media',
    body: 'Every listing needs 5–10 timestamped photos (captured within the last 30 days) plus exactly one running video of at least 60 seconds showing the machine actively operating with a timestamp overlay. We recommend the Timestamp Camera app for this.',
  },
  {
    icon: DocumentIcon,
    title: 'Submit for review',
    body: 'Your listing moves to Pending review. Our admin team checks the media and details before approving it to go live as Active.',
  },
  {
    icon: ChatIcon,
    title: 'Receive buyer enquiries',
    body: 'Interested buyers submit an enquiry through BIM. You see their name and location — no direct contact details until commission is settled, keeping the deal inside the platform.',
  },
  {
    icon: RupeeIcon,
    title: 'Settle commission, get paid',
    body: 'When a sale is agreed, a transaction records the price with a 1% buyer commission and 1% seller commission. Once that commission is marked paid, contact details are released to both sides so the handover can proceed directly.',
  },
];

const BUYER_STEPS = [
  {
    icon: DocumentIcon,
    title: 'Browse without barriers',
    body: 'Search and filter listings by category, make, year, price and location — no account or GST required just to look.',
  },
  {
    icon: ChatIcon,
    title: 'Send an enquiry',
    body: "Sign up, verify your phone via OTP, and send an enquiry on any listing. The seller sees your name and location; BIM's admin team reviews every enquiry before connecting both parties.",
  },
  {
    icon: ShieldCheckIcon,
    title: 'Verify GST for financing',
    body: 'Browsing and enquiring never require GST. But if you want to apply for a loan against a purchase, your GST must first be verified as ACTIVE.',
  },
  {
    icon: RupeeIcon,
    title: 'Apply for financing',
    body: 'Submit a loan application against a listing. Our admin team reviews eligibility after certification completes and routes your application to the best-fit bank or NBFC.',
  },
  {
    icon: CheckCircleIcon,
    title: 'Certification for peace of mind',
    body: 'Our inspectors assess the machine—fees vary by complexity tier (Simple, Standard, Complex)—and produce a report you and the finance partner can rely on.',
  },
  {
    icon: RupeeIcon,
    title: 'Pay commission, get contact details',
    body: "Once you and the seller agree a price and the commission is settled, both parties receive each other's direct contact information to complete the deal.",
  },
];

export function HowItWorks() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-14">
      <PageHeading
        eyebrow="How BIM works"
        title="A transparent, proof-backed process for both sides of the trade"
        description="From GST verification to commission-gated contact release, every step is designed to protect buyers, sellers and the integrity of the marketplace."
      />

      <section>
        <h2 className="font-display text-2xl text-navy">For sellers</h2>
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {SELLER_STEPS.map((step, idx) => (
            <div key={step.title} className="flex gap-4 rounded-2xl border border-navy/10 bg-white p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy/[0.06] text-navy">
                <step.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-accent">Step {idx + 1}</p>
                <h3 className="mt-0.5 font-display text-lg text-navy">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-navy/60">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="font-display text-2xl text-navy">For buyers</h2>
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {BUYER_STEPS.map((step, idx) => (
            <div key={step.title} className="flex gap-4 rounded-2xl border border-navy/10 bg-white p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <step.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-accent">Step {idx + 1}</p>
                <h3 className="mt-0.5 font-display text-lg text-navy">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-navy/60">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 rounded-2xl border border-navy/10 bg-navy/[0.03] p-8">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy text-white">
            <TrendDownIcon className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-display text-xl text-navy">Buyback &amp; depreciation</h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-navy/60">
              Sellers can request a buyback quote at any time. We compute a depreciated value
              from our category-specific depreciation schedule based on the machine&apos;s age,
              then offer a buyback amount as a percentage of that depreciated value — a fast,
              transparent way to exit a machine without waiting for a buyer.
            </p>
          </div>
        </div>
      </section>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link to="/signup" className="rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-dark">
          Create your account
        </Link>
        <Link to="/listings" className="rounded-lg border border-navy/15 px-6 py-3 text-sm font-semibold text-navy transition hover:bg-navy/5">
          Browse listings
        </Link>
      </div>
    </div>
  );
}
