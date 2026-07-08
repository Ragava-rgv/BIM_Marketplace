import { Link } from 'react-router-dom';
import { ChatIcon, CheckCircleIcon, RupeeIcon, ShieldCheckIcon } from '../../components/icons';
import { PageHeading } from '../../components/ui';

const VALUES = [
  {
    icon: ShieldCheckIcon,
    title: 'Verification first',
    body: 'Every seller on BIM is GST-verified before they can publish a listing. We believe trust on a B2B marketplace starts with knowing exactly who you are dealing with.',
  },
  {
    icon: CheckCircleIcon,
    title: 'Proof, not promises',
    body: "Listings require timestamped photos and a running video showing the machine in operation — so buyers can judge condition for themselves, not just take a seller's word.",
  },
  {
    icon: ChatIcon,
    title: 'Privacy until it counts',
    body: 'We keep both sides anonymous through admin-mediated chat until a deal is real and commission is settled — protecting the marketplace and everyone in it.',
  },
  {
    icon: RupeeIcon,
    title: 'Fair, simple economics',
    body: 'A flat 1% + 1% commission on the agreed sale price. No hidden listing fees, no surprises — just a transparent cost shared between buyer and seller.',
  },
];

export function About() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-14">
      <PageHeading
        eyebrow="About BIM"
        title="Built for India's used industrial machinery trade"
        description="BIM is a B2B marketplace connecting verified sellers of used industrial machinery with serious buyers across India — backed by proof-based listings, anonymised communication and optional certification and financing."
      />

      <div className="prose-none space-y-5 text-[15px] leading-relaxed text-navy/65">
        <p>
          The market for used industrial machinery in India has long run on word-of-mouth,
          unverifiable listings and direct deals that leave both sides exposed. BIM
          was built to change that — bringing GST verification, proof-backed listings and
          transparent commission economics to a trade that deserves better infrastructure.
        </p>
        <p>
          Whether you are a manufacturer looking to liquidate equipment, a trader sourcing
          machines for resale, or a growing business buying your first CNC lathe or
          compressor, BIM gives you the tools to transact with confidence:
          verified counterparties, certified machines when financing is involved, and a
          chat system that keeps you safe until a deal is genuinely ready to close.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {VALUES.map((value) => (
          <div key={value.title} className="rounded-2xl border border-navy/10 bg-white p-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy/[0.06] text-navy">
              <value.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-display text-lg text-navy">{value.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-navy/60">{value.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-14 rounded-2xl border border-navy/10 bg-navy p-8 text-white">
        <h3 className="font-display text-2xl">Have a machine to sell, or one to find?</h3>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/60">
          Create a free account, verify your details, and start trading on a marketplace
          built around trust and transparency.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/signup" className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-navy transition hover:bg-white/90">
            Create your account
          </Link>
          <Link to="/how-it-works" className="rounded-lg border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
            See how it works
          </Link>
        </div>
      </div>
    </div>
  );
}
