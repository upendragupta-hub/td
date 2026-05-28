import { useEffect, useState } from 'react';
import axios from 'axios';
import { Loader2, Mail, Phone, Stethoscope } from 'lucide-react';

export default function PublicDoctorsGrid() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await axios.get('/api/doctors');
        if (response.data?.success) {
          setDoctors(response.data.data || []);
        } else {
          setError('Doctors could not be loaded right now.');
        }
      } catch (err) {
        setError('Doctors could not be loaded right now.');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  if (loading) {
    return (
      <div className="surface-panel-strong mx-auto max-w-5xl rounded-[2.2rem] px-8 py-16 text-center">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-cyan-700" />
        <p className="mt-5 font-bold text-cyan-700">Loading doctors...</p>
      </div>
    );
  }

  return (
    <section className="px-4 pb-20 pt-32 sm:px-6 lg:px-8">
      <div className="page-shell">
        <div className="surface-panel-strong p-8 sm:p-10 lg:p-12">
          <span className="eyebrow">Specialist Network</span>
          <h1 className="mt-6 text-4xl font-extrabold text-slate-900 sm:text-5xl">
            Meet the doctors leading patient care at WeCare.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
            Browse key specialties, schedules, and direct contact details before you book your appointment.
          </p>

          {error && (
            <div className="mt-6 rounded-[1.4rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
              {error}
            </div>
          )}

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {doctors.map((doctor) => (
              <article key={doctor._id || doctor.email || doctor.name} className="surface-panel rounded-[2rem] p-6">
                {doctor.image ? (
                  <img
                    src={doctor.image}
                    alt={doctor.name}
                    className="h-20 w-20 rounded-[1.4rem] object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-[1.4rem] bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-600 text-2xl font-extrabold text-white">
                    {doctor.name?.[0] || 'D'}
                  </div>
                )}

                <h2 className="mt-5 text-2xl font-extrabold text-slate-900">{doctor.name}</h2>
                <p className="mt-2 text-sm font-bold text-cyan-700">{doctor.specialty}</p>

                <div className="mt-6 space-y-3 text-sm text-slate-600">
                  <div className="flex items-center gap-3">
                    <Stethoscope className="h-4 w-4 text-cyan-700" />
                    <span>{doctor.experience ? `${doctor.experience} years experience` : 'Experienced specialist'}</span>
                  </div>
                  {doctor.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-cyan-700" />
                      <span className="break-all">{doctor.email}</span>
                    </div>
                  )}
                  {doctor.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-cyan-700" />
                      <span>{doctor.phone}</span>
                    </div>
                  )}
                </div>

                <div className="mt-6 rounded-[1.4rem] border border-slate-100 bg-slate-50 px-4 py-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Schedule</p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">
                    {doctor.schedule || 'Schedule will be shared at booking time'}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
