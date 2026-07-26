import { useEffect, useState } from 'react';
import type { FinancePartnerDto } from '@machinebazaar/shared';
import { FinancePartnerType } from '@machinebazaar/shared';
import { api, apiErrorMessage } from '../../lib/api';
import { Button, Card, EmptyState, ErrorBanner, Field, Input, LoadingBlock, PageHeading, Select, SuccessBanner } from '../../components/ui';
import { BankIcon, PlusIcon } from '../../components/icons';

function NewPartnerForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState('');
  const [type, setType] = useState<string>(FinancePartnerType.BANK);
  const [referralRate, setReferralRate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/finance-partners', { name, type, referralRate: Number(referralRate), active: true });
      setName('');
      setReferralRate('');
      setType(FinancePartnerType.BANK);
      onCreated();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not add this finance partner.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <h2 className="font-display text-lg text-navy">Add a finance partner</h2>
      <p className="mt-1 text-sm text-navy/55">Only active partners are offered to buyers when they apply for financing.</p>

      {error && (
        <div className="mt-4">
          <ErrorBanner message={error} />
        </div>
      )}

      <form onSubmit={submit} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Partner name">
          <Input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} placeholder="e.g. Sundaram Finance" />
        </Field>
        <Field label="Type">
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            <option value={FinancePartnerType.BANK}>Bank</option>
            <option value={FinancePartnerType.NBFC}>NBFC</option>
          </Select>
        </Field>
        <Field label="Referral rate (%)" hint="Commission earned on approved loan amounts">
          <Input
            type="number"
            min={0}
            step="0.01"
            value={referralRate}
            onChange={(e) => setReferralRate(e.target.value)}
            required
            placeholder="e.g. 1.5"
          />
        </Field>
        <div className="sm:col-span-3">
          <Button type="submit" disabled={submitting}>
            <PlusIcon className="h-4 w-4" />
            {submitting ? 'Adding...' : 'Add partner'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function AdminFinancePartners() {
  const [partners, setPartners] = useState<FinancePartnerDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [justCreated, setJustCreated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get<FinancePartnerDto[]>('/finance-partners/admin')
      .then(({ data }) => {
        if (!cancelled) setPartners(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setPartners([]);
          setError(apiErrorMessage(err, 'Could not load finance partners.'));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  const toggleActive = async (partner: FinancePartnerDto) => {
    setActingId(partner.id);
    setError(null);
    try {
      await api.patch(`/finance-partners/${partner.id}`, { active: !partner.active });
      setReload((n) => n + 1);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not update this partner.'));
    } finally {
      setActingId(null);
    }
  };

  return (
    <div>
      <PageHeading
        eyebrow="Admin console"
        title="Finance partners"
        description="Manage the banks and NBFCs buyers can apply to for financing, and the referral commission BIM earns on each approved loan."
      />

      {error && (
        <div className="mb-5">
          <ErrorBanner message={error} />
        </div>
      )}
      {justCreated && (
        <div className="mb-5">
          <SuccessBanner message="Finance partner added." />
        </div>
      )}

      <div className="mb-8">
        <NewPartnerForm
          onCreated={() => {
            setJustCreated(true);
            setReload((n) => n + 1);
            setTimeout(() => setJustCreated(false), 4000);
          }}
        />
      </div>

      {partners === null ? (
        <LoadingBlock />
      ) : partners.length === 0 ? (
        <EmptyState title="No finance partners yet" description="Add a bank or NBFC above to start offering buyer financing." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-navy/10 bg-navy/[0.02] text-left text-xs font-semibold uppercase tracking-wide text-navy/40">
              <tr>
                <th className="px-5 py-3">Partner</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Referral rate</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/10">
              {partners.map((partner) => (
                <tr key={partner.id} className="transition hover:bg-navy/[0.02]">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy/[0.06] text-navy">
                        <BankIcon className="h-4.5 w-4.5" />
                      </span>
                      <span className="font-semibold text-navy">{partner.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-navy/65">{partner.type === 'BANK' ? 'Bank' : 'NBFC'}</td>
                  <td className="px-5 py-4 text-navy/65">{Number(partner.referralRate).toFixed(2)}%</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                        partner.active ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 'bg-slate-100 text-slate-600 ring-slate-500/20'
                      }`}
                    >
                      {partner.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Button variant="ghost" disabled={actingId === partner.id} onClick={() => toggleActive(partner)}>
                      {partner.active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
