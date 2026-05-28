import { motion } from 'motion/react';
import { Eye, FileText, Lock, Shield } from 'lucide-react';

const sections = [
  {
    icon: Eye,
    title: 'Information We Collect',
    content:
      'We collect the personal, medical, and billing details you intentionally share through appointments, patient records, and support interactions.',
    bullets: [
      'Name, address, and contact information',
      'Medical history, prescriptions, and treatment records',
      'Insurance details and billing information',
      'Relevant family medical history where needed for care',
    ],
  },
  {
    icon: Lock,
    title: 'How We Use Your Information',
    content:
      'Your information is used to coordinate care safely, improve communication, and support accurate treatment decisions across departments.',
    bullets: [
      'Schedule and manage consultations or procedures',
      'Support diagnosis, treatment planning, and follow-up care',
      'Process payments, claims, and receipts',
      'Share essential updates, reports, and reminders',
    ],
  },
  {
    icon: FileText,
    title: 'Data Security',
    content:
      'We use encryption, access controls, and operational safeguards to protect patient data and uphold modern healthcare privacy standards.',
    bullets: [
      'Restricted internal access to sensitive records',
      'Protected digital systems and encrypted data flows',
      'Audit-friendly storage and privacy-conscious workflows',
    ],
  },
];

export default function PrivacyPolicy() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 pb-20 pt-32 sm:px-6 lg:px-8"
    >
      <div className="page-shell max-w-5xl">
        <div className="surface-panel-strong p-8 sm:p-10 lg:p-12">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[1.8rem] bg-cyan-100 text-cyan-700">
              <Shield className="h-9 w-9" />
            </div>
            <span className="eyebrow">Data & Trust</span>
            <h1 className="section-title mt-6">Privacy Policy</h1>
            <p className="mt-4 text-sm text-slate-500">Effective Date: May 6, 2026</p>
            <p className="section-copy mx-auto mt-5 max-w-3xl">
              WeCare Hospitals treats patient privacy as part of patient care. This page outlines what we collect,
              how we use it, and the safeguards we apply across our digital systems.
            </p>
          </div>

          <div className="mt-12 space-y-6">
            {sections.map(({ icon: Icon, title, content, bullets }) => (
              <section key={title} className="surface-panel rounded-[1.8rem] p-6 sm:p-7">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-cyan-100 p-3 text-cyan-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-extrabold text-slate-900">{title}</h2>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{content}</p>
                    <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600">
                      {bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>
            ))}
          </div>

          <section className="surface-dark mt-10 rounded-[2rem] p-7 sm:p-8">
            <h2 className="text-2xl font-extrabold text-white">Contact Our Privacy Officer</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200">
              If you want to review, correct, or request deletion of your records, contact our privacy team and we will guide you through the next steps.
            </p>
            <p className="mt-5 text-base font-bold text-cyan-200">privacy@wecarehospitals.com</p>
          </section>
        </div>
      </div>
    </motion.section>
  );
}
