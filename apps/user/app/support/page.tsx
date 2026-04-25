// apps/user/app/support/page.tsx
// AmanahHub — Support & FAQ (Sprint 10)

import Link from 'next/link';

export const metadata = {
  title: 'Support & FAQ',
  description: 'Frequently asked questions about donating through AmanahHub, how our charity verification works, and how to get help.',
};

const DONOR_FAQS = [
  {
    q: 'Is my donation going directly to the charity?',
    a: 'Yes. AmanahHub is non-custodial — your payment is processed directly by the charity\'s own ToyyibPay account. AmanahHub never receives or holds your funds. We only record the transaction and generate your receipt once the payment is confirmed.',
  },
  {
    q: 'Do I need to create an account to donate?',
    a: 'No. Guest donation is fully supported. You can donate without registering. However, creating a free account allows you to view your full donation history, download receipts, and track the organizations you support.',
  },
  {
    q: 'What does the Amanah score mean?',
    a: 'The Amanah Index™ is a 0–100 Amanah Index computed from verified data across five dimensions: governance (30%), financial transparency (25%), project reporting (20%), impact tracking (15%), and Shariah governance (15%). A higher score reflects stronger, independently verified transparency practices. The score is not self-reported — it is calculated from documentation reviewed by our platform reviewers.',
  },
  {
    q: 'What is the difference between Platinum, Gold, Silver, and Basic Amanah?',
    a: 'These tiers reflect the Amanah score: Platinum (85 and above), Gold (70–84), Silver (55–69), and Basic (below 55). Organizations at Platinum and Gold tiers have demonstrated strong governance, audited financials, geo-verified project evidence, and Shariah compliance. All listed organizations have passed the mandatory governance gate (Layer 1) regardless of tier.',
  },
  {
    q: 'Can I give Zakat through AmanahHub?',
    a: 'AmanahHub does not calculate or certify Zakat eligibility independently. You should consult your state Zakat authority or a qualified scholar for Zakat obligations. Some organizations on AmanahHub are authorized zakat-handling bodies — their fund types are clearly displayed on their profile. We recommend confirming with the organization directly before designating a payment as Zakat.',
  },
  {
    q: 'Is Sadaqah Jariah applicable for donations through AmanahHub?',
    a: 'Sadaqah Jariah (ongoing charity) applies based on the nature of the project, not the platform. Projects such as waqf infrastructure, educational facilities, clean water access, or mosque construction are typically regarded as Sadaqah Jariah. Each organization\'s project descriptions will indicate the type of work being funded.',
  },
  {
    q: 'What happens if I donate but do not receive a receipt?',
    a: 'If your payment was processed but you did not receive a receipt, please check your email spam folder first. If you created an account, log in to My Account → Donations to view your transaction status. If the status shows "initiated" but not "confirmed," the webhook from the payment gateway may be delayed. Contact us at support@amanahhub.my with your transaction reference and we will investigate.',
  },
  {
    q: 'Can I donate on behalf of someone who has passed away?',
    a: 'Yes. Giving Sadaqah on behalf of a deceased person is a well-established Islamic practice supported by hadith. Simply proceed with your donation as normal. The spiritual intention (niyyah) is yours to hold.',
  },
];

const ORG_FAQS = [
  {
    q: 'How does my organization get listed on AmanahHub?',
    a: 'Register on AmanahHub Console (console.amanahhub.my), complete your organization profile and Malaysia governance classification, and submit for review. Our team will evaluate your submission against CTCF Layer 1 requirements. Approval typically takes 5–10 business days. Once approved and listed, your organization becomes discoverable to donors.',
  },
  {
    q: 'What documents do we need to pass Layer 1?',
    a: 'The Layer 1 governance gate requires: proof of legal registration (with ROS, JAKIM, SIRC, or equivalent), your governing document (constitution, trust deed, or bylaws), a named board or committee of at least 3 persons, a conflict of interest policy, proof of a separate organizational bank account, and accessible contact details.',
  },
  {
    q: 'How is our Amanah score calculated?',
    a: 'Your score is computed by our reviewers using the CTCF framework across five layers. Each layer has a maximum score and weighted contribution to the total. The score is updated whenever a project report is verified, a certification decision is made, or a manual recalculation is triggered by a reviewer. All score versions are preserved — donors can see your history.',
  },
  {
    q: 'Is registration free?',
    a: 'Yes. Registration and listing on AmanahHub is free for pilot organizations during Phase 1. A voluntary platform contribution model may be introduced in future phases, but any fee structure will be transparent and Shariah-compliant.',
  },
  {
    q: 'What are the reporting obligations after approval?',
    a: 'Approved organizations are expected to submit project reports within 90 days of each reporting period. Reports should include narrative, beneficiary counts, spend-to-date, and where possible, geo-verified photographic evidence. Failure to report will affect your Amanah score. There is no penalty for late submission, but your score will reflect the gap.',
  },
];

export default function SupportPage() {
  return (
    <div className="min-h-screen">

      {/* Hero */}
      <section className="bg-emerald-900 text-white py-14 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-emerald-400 text-[11px] uppercase tracking-widest font-medium mb-3">
            Help centre
          </p>
          <h1 className="font-display text-4xl font-bold mb-3">Support & FAQ</h1>
          <p className="text-emerald-100 text-[15px]">
            Answers to the most common questions from donors and organizations.
          </p>
        </div>
      </section>

      {/* Quick links */}
      <section className="bg-white border-b border-gray-100 py-5 px-4">
        <div className="max-w-4xl mx-auto flex flex-wrap gap-2 justify-center">
          {[
            ['#donors',   'Donor questions'],
            ['#orgs',     'Organization questions'],
            ['#contact',  'Contact us'],
          ].map(([href, label]) => (
            <a key={href} href={href}
              className="px-4 py-2 rounded-lg border border-gray-200 text-[12px] font-medium
                         text-gray-600 hover:border-emerald-300 hover:text-emerald-700
                         hover:bg-emerald-50 transition-colors">
              {label}
            </a>
          ))}
        </div>
      </section>

      {/* Donor FAQ */}
      <section id="donors" className="py-16 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <p className="text-[11px] font-medium text-emerald-700 uppercase tracking-widest mb-1">
              For donors
            </p>
            <h2 className="font-display text-2xl font-bold text-gray-900">Donor questions</h2>
          </div>
          <FaqList faqs={DONOR_FAQS} />
        </div>
      </section>

      {/* Org FAQ */}
      <section id="orgs" className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <p className="text-[11px] font-medium text-emerald-700 uppercase tracking-widest mb-1">
              For organizations
            </p>
            <h2 className="font-display text-2xl font-bold text-gray-900">Organization questions</h2>
          </div>
          <FaqList faqs={ORG_FAQS} />
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-16 px-4 bg-emerald-900 text-white">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-emerald-400 text-[11px] uppercase tracking-widest font-medium mb-3">
              Still need help?
            </p>
            <h2 className="font-display text-3xl font-bold mb-3">Contact us</h2>
            <p className="text-emerald-100 text-[14px] leading-relaxed mb-5">
              We aim to respond to all enquiries within 2 working days. For urgent donation issues, please include your transaction reference number.
            </p>
            <div className="space-y-3 text-[13px]">
              <div className="flex items-center gap-3">
                <span className="text-emerald-400">✉</span>
                <span className="text-emerald-100">support@amanahhub.my</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-emerald-400">✉</span>
                <span className="text-emerald-100">orgs@amanahhub.my (for organizations)</span>
              </div>
            </div>
          </div>
          <div className="bg-emerald-800/60 rounded-2xl p-6 border border-emerald-700/50">
            <p className="text-[12px] font-medium text-emerald-300 mb-4">Quick links</p>
            <div className="space-y-2">
              {[
                ['/charities',    'Browse charities'],
                ['/how-it-works', 'How our verification works'],
                ['/about',        'About AmanahHub'],
                ['https://console.amanahhub.my', 'Register your organization'],
              ].map(([href, label]) => (
                <a key={href} href={href}
                  className="flex items-center justify-between py-2 border-b
                             border-emerald-700/40 text-[13px] text-emerald-100
                             hover:text-white transition-colors">
                  {label}
                  <span className="text-emerald-500 text-[10px]">→</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

function FaqList({ faqs }: { faqs: { q: string; a: string }[] }) {
  return (
    <div className="space-y-3">
      {faqs.map((faq, i) => (
        <details key={i}
          className="bg-white rounded-xl border border-gray-200 group
                     open:border-emerald-200 open:shadow-sm transition-all">
          <summary
            className="flex items-start justify-between gap-3 px-5 py-4 cursor-pointer
                       list-none text-[13px] font-semibold text-gray-900
                       hover:text-emerald-800 transition-colors">
            <span>{faq.q}</span>
            <span className="text-gray-400 group-open:text-emerald-600 flex-shrink-0
                             text-[16px] leading-none mt-0.5 transition-colors
                             group-open:rotate-45 transition-transform">+</span>
          </summary>
          <div className="px-5 pb-4 text-[13px] text-gray-600 leading-relaxed border-t
                          border-gray-100 pt-3">
            {faq.a}
          </div>
        </details>
      ))}
    </div>
  );
}

