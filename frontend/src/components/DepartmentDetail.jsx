import { motion } from 'motion/react';
import { ArrowLeft, CheckCircle2, Clock, MapPin, Phone } from 'lucide-react';

export default function DepartmentDetail({ department, onBack, onBook }) {
  if (!department) return null;

  const { title, description, icon: Icon, color } = department;

  const services = [
    '24/7 specialist consultation',
    'Advanced diagnostics and imaging',
    'In-patient and out-patient support',
    'Recovery and rehabilitation planning',
    'Digital medical records access',
    'Rapid-response emergency coordination',
  ];

  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.97, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="px-4 pb-20 pt-32 sm:px-6 lg:px-8"
    >
      <div className="page-shell max-w-6xl">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-cyan-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to departments
        </button>

        <div className="surface-panel-strong grid overflow-hidden lg:grid-cols-[0.92fr_1.08fr]">
          <div className="surface-dark relative flex flex-col justify-between overflow-hidden p-10 sm:p-12">
            <div className="absolute -right-16 top-0 h-40 w-40 rounded-full bg-cyan-400/14 blur-3xl" />
            <div className="space-y-6">
              <div className={`inline-flex h-20 w-20 items-center justify-center rounded-[1.8rem] ${color} shadow-xl`}>
                <Icon className="h-10 w-10 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-200">Specialty Care Unit</p>
                <h1 className="mt-3 text-4xl font-extrabold text-white sm:text-5xl">{title}</h1>
                <p className="mt-5 text-sm leading-7 text-slate-200">{description}</p>
              </div>
              <div className="space-y-4 rounded-[1.6rem] border border-white/10 bg-white/8 p-5">
                <div className="flex items-center gap-3 text-sm text-slate-100">
                  <Clock className="h-4 w-4 text-cyan-300" />
                  Open 24/7 for urgent support
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-100">
                  <MapPin className="h-4 w-4 text-cyan-300" />
                  Floor 3, East Wing Medical Plaza
                </div>
              </div>
            </div>

            <div className="mt-10 rounded-[1.6rem] border border-white/10 bg-white/8 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-300">Urgent Support</p>
              <div className="mt-4 flex items-center gap-4">
                <div className="rounded-2xl bg-white/12 p-3">
                  <Phone className="h-5 w-5 text-cyan-300" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Emergency helpline</p>
                  <p className="text-sm text-cyan-200">+1 (555) 123-4567</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 sm:p-10 lg:p-12">
            <div className="space-y-6">
              <span className="eyebrow">What patients get</span>
              <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
                Services shaped around speed, confidence, and follow-through.
              </h2>
              <p className="text-sm leading-7 text-slate-600">
                Every department combines experienced clinicians, modern diagnostics, and coordinated
                care planning so patients move from concern to clarity with less friction.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {services.map((service) => (
                <div key={service} className="rounded-[1.5rem] border border-cyan-100 bg-cyan-50/60 p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-700" />
                    <p className="text-sm font-semibold text-slate-700">{service}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="surface-dark mt-10 rounded-[2rem] p-8">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-200">Priority scheduling</p>
              <h3 className="mt-3 text-2xl font-extrabold text-white">Book a specialist consultation online.</h3>
              <p className="mt-3 max-w-lg text-sm leading-7 text-slate-200">
                Reserve a visit, get confirmation, and keep your records in one place through the patient portal.
              </p>
              <button type="button" onClick={onBook} className="primary-button mt-6">
                Schedule now
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
