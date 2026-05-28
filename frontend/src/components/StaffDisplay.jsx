import { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { AlertCircle, Mail, Phone } from 'lucide-react';

export default function StaffDisplay() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/staff');
        setStaff(response.data.data || response.data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching staff:', err);
        setError('Failed to load staff information');
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, []);

  if (loading) {
    return (
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="page-shell">
          <div className="surface-panel-strong flex min-h-72 items-center justify-center rounded-[2rem]">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="h-12 w-12 rounded-full border-4 border-cyan-200 border-t-cyan-700"
            />
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="page-shell">
          <div className="surface-panel-strong flex items-center justify-center gap-3 rounded-[2rem] px-6 py-12 text-rose-600">
            <AlertCircle className="h-5 w-5" />
            <span className="font-semibold">{error}</span>
          </div>
        </div>
      </section>
    );
  }

  if (!staff?.length) return null;

  return (
    <section className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="page-shell">
        <div className="surface-panel-strong p-8 sm:p-10 lg:p-12">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <span className="eyebrow">Meet the Team</span>
            <h2 className="section-title mt-6">People who keep care moving with precision.</h2>
            <p className="section-copy mt-5">
              Our medical and support teams work across emergency care, specialty units, patient coordination,
              and records management to keep every visit connected.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {staff.map((member, index) => (
              <motion.article
                key={member._id || index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.04 }}
                className="surface-panel relative overflow-hidden rounded-[1.8rem] p-6"
              >
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cyan-100/90 blur-2xl" />

                <div className="relative">
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-600 text-xl font-extrabold text-white shadow-lg shadow-cyan-500/20">
                    {member.name?.charAt(0)?.toUpperCase() || 'S'}
                  </div>

                  <h3 className="text-lg font-extrabold text-slate-900">{member.name}</h3>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">{member.role}</p>

                  <div className="mt-5 space-y-3 text-sm text-slate-600">
                    <a href={`mailto:${member.email}`} className="flex items-center gap-3 hover:text-cyan-700">
                      <div className="rounded-xl bg-cyan-50 p-2 text-cyan-700">
                        <Mail className="h-4 w-4" />
                      </div>
                      <span className="truncate">{member.email}</span>
                    </a>
                    <a href={`tel:${member.phone}`} className="flex items-center gap-3 hover:text-cyan-700">
                      <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
                        <Phone className="h-4 w-4" />
                      </div>
                      <span className="truncate">{member.phone}</span>
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = `mailto:${member.email}`;
                    }}
                    className="secondary-button mt-6 w-full justify-center px-4 py-3 text-sm"
                  >
                    Contact staff member
                  </button>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
