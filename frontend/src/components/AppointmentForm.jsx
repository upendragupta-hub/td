import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  Mail,
  MessageSquare,
  Stethoscope,
  User,
} from 'lucide-react';
import { useUserAuth } from '../context/UserAuthContext';

export default function AppointmentForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user, isUserAuthenticated, userLoading } = useUserAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: 'Cardiology',
    date: '',
    message: '',
  });

  useEffect(() => {
    if (isUserAuthenticated && user) {
      setFormData((prev) => ({
        ...prev,
        name: user.username || '',
        email: user.email || '',
      }));
    }
  }, [isUserAuthenticated, user]);

  const handleChange = (event) => {
    setFormData((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const submissionData = {
        ...formData,
        userId: isUserAuthenticated ? user.id : null,
      };

      const response = await axios.post('/api/appointments', submissionData);
      if (response.status === 201 || response.status === 200) {
        setIsSubmitted(true);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Network error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isUserAuthenticated && !userLoading) {
    return (
      <div className="surface-panel-strong mx-auto max-w-3xl rounded-[2.2rem] p-8 text-center sm:p-10">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
          <User className="h-10 w-10 text-amber-600" />
        </div>
        <span className="eyebrow">Patient Access Required</span>
        <h2 className="mt-6 text-3xl font-extrabold text-slate-900">Please sign in before booking.</h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600">
          We use your patient account to track appointment history, share updates, and connect your visit to digital health records.
        </p>
        <div className="mt-8 rounded-[1.8rem] border border-slate-200 bg-slate-50/80 px-6 py-5 text-sm font-semibold text-slate-600">
          Use the Patient Login option in the top navigation to continue.
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="mx-auto max-w-xl py-12">
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="surface-panel-strong rounded-[2.2rem] p-8 text-center sm:p-10"
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>
          <span className="eyebrow">Appointment Requested</span>
          <h2 className="mt-6 text-3xl font-extrabold text-slate-900">Your request is on the way.</h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Thank you for choosing WeCare. Our team will review your preferred department and confirm your slot shortly.
          </p>
          <button type="button" onClick={() => setIsSubmitted(false)} className="primary-button mt-8 w-full justify-center">
            Book another appointment
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="surface-panel-strong mx-auto max-w-5xl overflow-hidden rounded-[2.5rem]">
      <div className="grid lg:grid-cols-[0.92fr_1.08fr]">
        <div className="surface-dark relative flex flex-col justify-between overflow-hidden p-8 sm:p-10 lg:p-12">
          <div className="absolute -right-14 top-0 h-44 w-44 rounded-full bg-cyan-400/12 blur-3xl" />
          <div>
            <span className="eyebrow bg-white/10 text-cyan-100">Fast Booking</span>
            <h2 className="mt-6 text-4xl font-extrabold text-white sm:text-5xl">
              Confirm specialist care without the usual friction.
            </h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-slate-200">
              Choose a department, share your preferred date, and we will connect you with the right team while keeping your patient profile updated.
            </p>
          </div>

          <div className="mt-10 space-y-4">
            <div className="rounded-[1.6rem] border border-white/10 bg-white/8 p-4 text-sm text-slate-100">
              Verified departments and cleaner follow-up through your patient dashboard.
            </div>
            <div className="rounded-[1.6rem] border border-white/10 bg-white/8 p-4 text-sm text-slate-100">
              Appointment history, profile data, and billing stay connected in one place.
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 sm:p-10 lg:p-12">
          <span className="eyebrow">Appointment Request</span>
          <h3 className="mt-6 text-3xl font-extrabold text-slate-900">Personal information</h3>
          <p className="mt-3 text-sm text-slate-500">Share the essentials and we will handle the coordination from there.</p>

          {error && (
            <div className="mt-6 rounded-[1.4rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
              {error}
            </div>
          )}

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Full Name</label>
              <div className="field-shell">
                <User className="h-5 w-5 text-slate-400" />
                <input
                  required
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Email Address</label>
              <div className="field-shell">
                <Mail className="h-5 w-5 text-slate-400" />
                <input
                  required
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                />
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Select Department</label>
              <div className="field-shell relative">
                <Stethoscope className="h-5 w-5 text-slate-400" />
                <select name="department" value={formData.department} onChange={handleChange} className="appearance-none">
                  <option>Cardiology</option>
                  <option>Pediatrics</option>
                  <option>Neurology</option>
                  <option>Emergency Care</option>
                  <option>General Medicine</option>
                </select>
                <ChevronDown className="pointer-events-none h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Preferred Date</label>
              <div className="field-shell">
                <Calendar className="h-5 w-5 text-slate-400" />
                <input required type="date" name="date" value={formData.date} onChange={handleChange} />
              </div>
            </div>
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-bold text-slate-700">Message</label>
            <div className="field-shell items-start">
              <MessageSquare className="mt-4 h-5 w-5 text-slate-400" />
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Describe your symptoms or reason for visit..."
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="primary-button mt-8 w-full justify-center py-4 text-base disabled:opacity-70"
          >
            {isLoading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white"
                />
                Processing...
              </>
            ) : (
              'Confirm Appointment'
            )}
          </button>

          <p className="mt-4 text-center text-xs leading-6 text-slate-400">
            By booking, you agree to our privacy policy and secure handling of patient information.
          </p>
        </form>
      </div>
    </div>
  );
}
