// apps/user/app/how-it-works/page.tsx
// AmanahHub — How It Works (Sprint 10)

import Link from 'next/link';

export const metadata = {
  title: 'How It Works',
  description: 'Learn how AmanahHub verifies charities, computes the Amanah Index™, and ensures your Sadaqah reaches the right hands.',
};

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen">

      {/* Hero */}
      <section className="bg-emerald-900 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-emerald-400 text-[11px] uppercase tracking-widest font-medium mb-3">
            Transparent by design
          </p>
          <h1 className="font-display text-4xl font-bold mb-4">How AmanahHub works</h1>
          <p className="text-emerald-100 text-[15px] leading-relaxed">
            Every charity on this platform has been evaluated against a rigorous framework grounded in Islamic governance principles and modern transparency standards.
          </p>
        </div>
      </section>

      {/* Donor journey */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <SectionHead label="For donors" title="Your giving journey" />
          <div className="grid md:grid-cols-4 gap-6 mt-8">
            {[
              { n:'01', icon:'🔍', title:'Discover', text:'Browse our directory. Filter by state, org type, Amanah tier, or fund type (Sadaqah, Waqf, Zakat).' },
              { n:'02', icon:'📋', title:'Evaluate', text:"Read each charity's verified reports, financial statements, scholar notes, and Amanah score breakdown." },
              { n:'03', icon:'💚', title:'Donate', text:'Click Donate. Your payment goes directly to the charity via ToyyibPay. AmanahHub never holds your funds.' },
              { n:'04', icon:'📊', title:'Track', text:'Create a free account to view your donation history, receipts, and follow the impact of organizations you support.' },
            ].map(s => (
              <div key={s.n}>
                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center
                                justify-center text-xl mb-3">{s.icon}</div>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Step {s.n}</p>
                <h3 className="font-display text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-[13px] text-gray-500 leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTCF */}
      <section id="ctcf" className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <SectionHead label="Certification framework" title="Charity Transparency Certification Framework (CTCF)" />
          <p className="text-gray-500 text-[14px] max-w-2xl mt-3 mb-8 leading-relaxed">
            CTCF is our five-layer evaluation framework. A charity must pass all five layers to receive certification. Failing Layer 1 is a disqualifying gate — no score is awarded without governance foundations.
          </p>

          <div className="space-y-4">
            {[
              {
                n: 1, pct: 'Gate', color: 'bg-red-50 border-red-100 text-red-700',
                title: 'Layer 1 — Governance Gate (Required)',
                items: [
                  'Legal registration with ROS, JAKIM, SIRC, or relevant authority',
                  'Governing document (constitution, trust deed, or bylaws)',
                  'Named board or committee with at least 3 members',
                  'Conflict of interest policy in place',
                  'Separate organizational bank account',
                  'Accessible contact details and registered address',
                ],
              },
              {
                n: 2, pct: '25%', color: 'bg-blue-50 border-blue-100 text-blue-700',
                title: 'Layer 2 — Financial Transparency',
                items: [
                  'Annual financial statement (income & expenditure)',
                  'External audit or independent review conducted',
                  'Program vs. administrative expense ratio disclosed',
                  'Zakat fund segregation (if applicable)',
                ],
              },
              {
                n: 3, pct: '20%', color: 'bg-emerald-50 border-emerald-100 text-emerald-700',
                title: 'Layer 3 — Project Transparency',
                items: [
                  'Budget vs. actual spending reported per project',
                  'Geo-verified evidence (photos with location)',
                  'Before/after documentation',
                  'Beneficiary count and demographics',
                  'Timely reporting (within 90 days of period end)',
                ],
              },
              {
                n: 4, pct: '15%', color: 'bg-violet-50 border-violet-100 text-violet-700',
                title: 'Layer 4 — Impact',
                items: [
                  'KPIs defined and tracked across reporting periods',
                  'Sustainability plan or long-term programme design',
                  'Continuity tracking (beneficiaries over time)',
                  'Cost-per-beneficiary metric available',
                ],
              },
              {
                n: 5, pct: '15%', color: 'bg-amber-50 border-amber-100 text-amber-700',
                title: 'Layer 5 — Shariah Governance',
                items: [
                  'Named Shariah advisor or Shariah Supervisory Board',
                  'Written Shariah compliance policy',
                  'Zakat eligibility governance (if zakat-handling)',
                  'Waqf asset protection covenant (if waqf assets held)',
                ],
              },
            ].map(layer => (
              <div key={layer.n}
                className={`rounded-xl border p-5 ${layer.color.split(' ').slice(0,2).join(' ')}`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className={`font-semibold text-[14px] ${layer.color.split(' ')[2]}`}>
                    {layer.title}
                  </h3>
                  <span className={`badge flex-shrink-0 ${layer.color.split(' ')[2]} bg-white/60`}>
                    {layer.pct}
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 gap-1.5">
                  {layer.items.map(item => (
                    <div key={item} className="flex items-start gap-2 text-[12px] text-gray-700">
                      <span className="mt-0.5 flex-shrink-0 text-emerald-500">✓</span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 bg-white rounded-xl border border-gray-200 p-4 text-[12px] text-gray-500">
            <span className="font-medium text-gray-700">Certification tiers: </span>
            Platinum Amanah (85+) · Gold Amanah (70–84) · Silver Amanah (55–69) · Basic (below 55)
          </div>
        </div>
      </section>

      {/* Amanah Index */}
      <section id="amanah" className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <SectionHead label="Trust score" title="The Amanah Index™" />
          <p className="text-gray-500 text-[14px] max-w-2xl mt-3 mb-8 leading-relaxed">
            The Amanah Index is a living score updated every time an organization has a report verified, certification renewed, or a trust event recorded. It is not self-reported — it is computed from verified data only.
          </p>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="space-y-3">
              {[
                { dim:'Governance',  w:30, desc:'Board structure, legal docs, conflict of interest policy' },
                { dim:'Financial',   w:25, desc:'Audited accounts, program expense ratio, fund segregation' },
                { dim:'Project',     w:20, desc:'Geo-verified evidence, beneficiary metrics, timely reporting' },
                { dim:'Impact',      w:15, desc:'KPIs, sustainability, cost-effectiveness tracking' },
                { dim:'Shariah',     w:15, desc:'Named Shariah advisor, written policy, Zakat/Waqf governance' },
              ].map(d => (
                <div key={d.dim} className="flex items-center gap-4">
                  <div className="w-24 text-[12px] font-medium text-gray-700 flex-shrink-0">{d.dim}</div>
                  <div className="flex-1">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-600 rounded-full"
                        style={{ width: `${d.w * 3}%` }} />
                    </div>
                  </div>
                  <div className="w-8 text-[11px] text-gray-400 text-right">{d.w}%</div>
                </div>
              ))}
            </div>
            <div className="space-y-4 text-[13px] text-gray-600 leading-relaxed">
              <p>The score is calculated using a weighted formula. Higher weights are placed on governance and financial transparency because these form the foundational trust layer — a reflection of the Quranic principle of <em>Amanah</em>.</p>
              <p>The Shariah dimension draws directly from AAOIFI standards (Auditing Standard No. 6 and FAS 9), requiring organizations to have a named Shariah supervisor whose rulings are documented and traceable.</p>
              <p>Scores are history-preserved. Every score version is stored with its timestamp, trigger event, and breakdown — so donors can see how an organization has improved over time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Donations */}
      <section id="donations" className="py-16 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <SectionHead label="Your money" title="How donations work" />
          <div className="mt-8 space-y-4">
            {[
              { icon:'1', title:'You choose a charity and amount',   text:'Select any verified organization and an amount. Guest donation is supported — no account required.' },
              { icon:'2', title:'Payment goes directly to the charity', text:'AmanahHub connects to ToyyibPay. Your payment is processed by the charity\'s own payment account. We never receive your funds.' },
              { icon:'3', title:'We record and verify',              text:'The donation transaction is recorded. When the webhook confirms payment, your receipt is generated immediately.' },
              { icon:'4', title:'The charity deploys the funds',     text:'Organizations are required to report on how funds were used. Verified reports are publicly visible on each charity\'s profile.' },
            ].map(step => (
              <div key={step.icon} className="flex gap-4 bg-white rounded-xl border border-gray-200 p-4">
                <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center
                                justify-center text-[12px] font-bold flex-shrink-0">{step.icon}</div>
                <div>
                  <p className="text-[13px] font-semibold text-gray-900 mb-1">{step.title}</p>
                  <p className="text-[12px] text-gray-500 leading-relaxed">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 bg-amber-50 border border-amber-100 rounded-xl p-4
                          text-[12px] text-amber-800 leading-relaxed">
            <strong>Non-custodial guarantee:</strong> The Prophet ﷺ rebuked any Zakah collector who kept even a legitimate personal gift, establishing that funds entrusted for distribution must be kept strictly separate. AmanahHub is built on this same principle — we are a transparency layer, not a payment intermediary.
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 px-4 bg-emerald-900 text-white text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="font-display text-2xl font-bold mb-3">Ready to give with confidence?</h2>
          <p className="text-emerald-200 text-[14px] mb-6">
            Browse our directory of verified organizations and find a cause that resonates with you.
          </p>
          <Link href="/charities"
            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-emerald-800
                       rounded-lg font-semibold text-[14px] hover:bg-emerald-50 transition-colors">
            Browse charities →
          </Link>
        </div>
      </section>

    </div>
  );
}

function SectionHead({ label, title }: { label: string; title: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-emerald-700 uppercase tracking-widest mb-1">{label}</p>
      <h2 className="font-display text-3xl font-bold text-gray-900">{title}</h2>
    </div>
  );
}
