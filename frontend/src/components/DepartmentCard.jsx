import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

export default function DepartmentCard({ title, description, icon: Icon, color, onLearnMore }) {
  return (
    <motion.article
      whileHover={{ y: -8 }}
      className="surface-panel-strong group relative overflow-hidden p-7 text-left"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 opacity-80" />
      <div className="absolute -right-14 -top-10 h-28 w-28 rounded-full bg-cyan-100/70 blur-2xl transition-transform duration-500 group-hover:scale-125" />

      <div className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg ${color}`}>
        <Icon className="h-6 w-6 text-white" strokeWidth={2.1} />
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-display font-bold text-slate-900 transition-colors group-hover:text-cyan-700">
          {title}
        </h3>
        <p className="text-sm leading-7 text-slate-600">
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={onLearnMore}
        className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-cyan-700 hover:gap-3"
      >
        Explore care
        <ArrowRight className="h-4 w-4" />
      </button>
    </motion.article>
  );
}
