// apps/user/app/about/page.tsx
// AmanahHub — About (Sprint 10)

import Link from 'next/link';

export const metadata = {
  title: 'About AmanahHub',
  description: 'AmanahHub is a Malaysian Islamic charity transparency platform built on principles of Amanah, Shafafiyyah, and Mas\'uliyyah.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen">

      {/* Hero */}
      <section className="bg-emerald-900 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-emerald-400 text-[11px] uppercase tracking-widest font-medium mb-3">
            Our mission
          </p>
          <h1 className="font-display text-4xl font-bold mb-4 leading-tight">
            Rebuilding donor trust<br/>in Islamic charity
          </h1>
          <p className="text-emerald-100 text-[16px] leading-relaxed max-w-xl">
            AmanahHub exists because trust is the foundation of giving. When donors cannot see where their Sadaqah goes, or whether governance is sound, they give less — and those who need help receive less.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-[11px] font-medium text-emerald-700 uppercase tracking-widest mb-2">What we do</p>
            <h2 className="font-display text-3xl font-bold text-gray-900 mb-4">
              A transparency infrastructure for Malaysian Islamic charities
            </h2>
            <div className="space-y-4 text-[14px] text-gray-600 leading-relaxed">
              <p>
                AmanahHub is part of the Amanah Governance Platform — a digital infrastructure purpose-built to bring accountability and measurable trust to Islamic charitable organizations in Malaysia.
              </p>
              <p>
                We work with NGOs, mosques, waqf institutions, and foundations to help them meet structured transparency standards, earn certification, and publish verified impact data for donors.
              </p>
              <p>
                Donors use AmanahHub to discover, evaluate, and give to organizations that have been independently assessed — not just self-declared.
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { title:'Malaysia-first', text:'Built for the Malaysian Islamic charity ecosystem — supporting ROS, JAKIM, SIRC, and state-level regulatory contexts.' },
              { title:'Non-custodial', text:'We never hold donor funds. All donations flow directly from donor to charity via the organization\'s own payment account.' },
              { title:'Evidence-based scoring', text:'Our Amanah Index™ is computed from verified documentation — governance records, audited financials, and field evidence.' },
              { title:'Open to all org types', text:'NGOs, mosques, waqf institutions, foundations — our framework is designed to fairly evaluate all categories of Malaysian Islamic charities.' },
            ].map(v => (
              <div key={v.title} className="flex gap-3">
                <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-100 text-emerald-700
                                flex items-center justify-center text-xs flex-shrink-0">✓</div>
                <div>
                  <p className="text-[13px] font-semibold text-gray-900">{v.title}</p>
                  <p className="text-[12px] text-gray-500 mt-0.5 leading-relaxed">{v.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Islamic foundations */}
      <section className="py-16 px-4 bg-amber-50 border-y border-amber-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[11px] font-medium text-amber-700 uppercase tracking-widest mb-2">
              Theological foundation
            </p>
            <h2 className="font-display text-3xl font-bold text-gray-900 mb-3">
              Built on Quran and Sunnah
            </h2>
            <p className="text-gray-600 text-[14px] max-w-2xl mx-auto leading-relaxed">
              AmanahHub is not simply a technology platform. It is a response to the Islamic obligation to manage charity with integrity, accountability, and transparency.
            </p>
          </div>

          <div className="space-y-5">
            {[
              {
                ref: 'Surah At-Tawbah 9:60',
                arabic: 'إِنَّمَا الصَّدَقَاتُ لِلْفُقَرَاءِ...',
                text: 'This verse establishes the eight rightful categories of Zakat recipients and explicitly recognizes <em>Al-\'Amilina \'Alayha</em> — those appointed to collect and distribute — as entitled to a portion for their administrative work. AmanahHub operationalises this by verifying that organizations have proper governance structures before any certification is granted.',
                platform: 'Platform response: CTCF Layer 1 governance gate',
              },
              {
                ref: 'Surah Al-Baqarah 2:188',
                arabic: 'وَلَا تَأْكُلُوا أَمْوَالَكُم بَيْنَكُم بِالْبَاطِلِ',
                text: '"And do not consume one another\'s wealth unjustly..." Managers of charitable funds are trustees (Amin) — they hold others\' property in trust. Any misuse, even through negligence, constitutes a violation of this Quranic principle. Our financial transparency layer directly targets this concern.',
                platform: 'Platform response: CTCF Layer 2 financial transparency',
              },
              {
                ref: 'Surah Al-Baqarah 2:263',
                arabic: 'قَوْلٌ مَّعْرُوفٌ وَمَغْفِرَةٌ خَيْرٌ مِّن صَدَقَةٍ يَتْبَعُهَا أَذًى',
                text: '"Kind speech and forgiveness are better than charity followed by injury." Recipients of charity carry dignity. AmanahHub\'s evidence framework requires organizations to report on how beneficiaries were reached and treated — not just that money was spent.',
                platform: 'Platform response: CTCF Layer 3 & 4 project and impact reporting',
              },
              {
                ref: 'Hadith — Strict accountability (Sahih Bukhari)',
                arabic: '',
                text: 'The Prophet ﷺ rebuked a Zakah collector who claimed that personal gifts received during his collection duties belonged to him personally — establishing that administrative entitlements belong to the organization (Baitulmal), not individuals. AmanahHub\'s audit log records every action taken by every role on the platform, creating a verifiable trail.',
                platform: 'Platform response: Append-only audit logs, CTCF administrative fee verification',
              },
              {
                ref: 'AAOIFI Auditing Standard No. 6',
                arabic: '',
                text: 'The Accounting and Auditing Organization for Islamic Financial Institutions (AAOIFI) provides the global benchmark for Shariah-compliant auditing. Our CTCF Layer 5 is directly aligned with AAOIFI\'s Shariah Supervisory Board requirements, FAS 9 Zakat standard, and GSIFI No. 2 internal oversight guidelines.',
                platform: 'Platform response: CTCF Layer 5 Shariah governance scoring',
              },
            ].map(item => (
              <div key={item.ref}
                className="bg-white rounded-xl border border-amber-100 p-5">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <p className="text-[12px] font-semibold text-amber-800">{item.ref}</p>
                  <span className="badge badge-green text-[10px]">{item.platform}</span>
                </div>
                {item.arabic && (
                  <p className="font-display text-xl text-amber-700 mb-2 text-right"
                    dir="rtl">{item.arabic}</p>
                )}
                <p className="text-[13px] text-gray-600 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: item.text }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[11px] font-medium text-emerald-700 uppercase tracking-widest mb-2">Our principles</p>
            <h2 className="font-display text-3xl font-bold text-gray-900">Three pillars of Amanah</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                arabic: 'أمانة', title: 'Amanah — Trust',
                text: 'Charity managers are trustees of donor funds. This is not a metaphor — it is a legal and spiritual designation with consequences. Our entire platform is built to make that trusteeship visible and verifiable.',
              },
              {
                arabic: 'شفافية', title: 'Shafafiyyah — Transparency',
                text: 'Moving beyond basic financials to detailed Shariah compliance reports — as the AAOIFI framework requires — is not optional for organizations that wish to maintain public trust. We make this accessible for small organizations, not just large ones.',
              },
              {
                arabic: 'مساءلة', title: "Mas'uliyyah — Accountability",
                text: 'Every significant action on AmanahHub is logged, timestamped, and preserved. Reports cannot be altered once submitted. Certification decisions are permanent. Scores are history-tracked. This is accountability by architecture.',
              },
            ].map(p => (
              <div key={p.title}
                className="bg-emerald-900 rounded-2xl p-6 text-white">
                <p className="font-display text-4xl text-emerald-300 mb-3">{p.arabic}</p>
                <h3 className="font-semibold text-[14px] mb-3">{p.title}</h3>
                <p className="text-[13px] text-emerald-100 leading-relaxed">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For organizations CTA */}
      <section id="privacy" className="py-12 px-4 bg-gray-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-display text-xl font-bold text-gray-900 mb-2">For donors</h3>
            <p className="text-[13px] text-gray-500 leading-relaxed mb-4">
              AmanahHub is free for donors. Browse, evaluate, and give with confidence. No account required to donate.
            </p>
            <Link href="/charities" className="btn-primary text-sm">Browse charities →</Link>
          </div>
          <div className="bg-emerald-900 rounded-2xl p-6 text-white">
            <h3 className="font-display text-xl font-bold mb-2">For organizations</h3>
            <p className="text-[13px] text-emerald-100 leading-relaxed mb-4">
              Register your charity on AmanahHub Console to begin the transparency and certification journey. Free for Phase 1 pilot organizations.
            </p>
            <a href="https://console.amanahhub.my"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-emerald-800
                         rounded-lg text-sm font-medium hover:bg-emerald-50 transition-colors">
              Go to Console →
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
