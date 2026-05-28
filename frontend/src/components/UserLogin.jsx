import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  HeartPulse,
  Lock,
  LogIn,
  Mail,
  Phone,
  User,
} from 'lucide-react';
import { useUserAuth } from '../context/UserAuthContext';

export default function UserLogin({ onLoginSuccess, onNavigate }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { userLogin, userRegister } = useUserAuth();

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setUsername('');
    setPhone('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const result = isLogin
        ? await userLogin(email, password)
        : await userRegister(username, email, password, phone);

      if (result?.success) {
        onLoginSuccess();
      } else {
        setMessage(result?.error || 'Unable to continue right now.');
      }
    } catch (err) {
      setMessage(err?.message || 'Unable to continue right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="surface-panel-strong page-shell grid max-w-5xl overflow-hidden lg:grid-cols-[0.95fr_1.05fr]"
      >
        <div className="surface-dark relative flex flex-col justify-between overflow-hidden p-8 sm:p-10 lg:p-12">
          <div className="absolute -right-14 bottom-0 h-44 w-44 rounded-full bg-cyan-400/12 blur-3xl" />
          <div>
            <div className="inline-flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-3">
                <HeartPulse className="h-7 w-7 text-cyan-300" />
              </div>
              <div>
                <p className="text-lg font-extrabold text-white">WeCare Patient Portal</p>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Appointments, records, receipts</p>
              </div>
            </div>

            <h1 className="mt-8 text-4xl font-extrabold text-white sm:text-5xl">
              {isLogin ? 'Your care journey, organized in one place.' : 'Create your patient account in minutes.'}
            </h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-slate-200">
              Book appointments, track billing, manage your profile, and stay connected with hospital updates through a single secure dashboard.
            </p>
          </div>

          <div className="mt-10 space-y-4">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/8 p-4 text-sm leading-7 text-slate-100">
              Faster booking, cleaner records, and better visibility into your appointments and payments.
            </div>
            <button
              type="button"
              onClick={() => onNavigate?.('home')}
              className="secondary-button w-full justify-center bg-white text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </button>
          </div>
        </div>

        <div className="p-8 sm:p-10 lg:p-12">
          <span className="eyebrow">{isLogin ? 'Patient Sign In' : 'Create Account'}</span>
          <h2 className="mt-6 text-3xl font-extrabold text-slate-900">
            {isLogin ? 'Welcome back.' : 'Start your patient profile.'}
          </h2>
          <p className="mt-3 text-sm text-slate-500">
            {isLogin ? 'Sign in to access appointments and receipts.' : 'Register once to manage appointments and health activity.'}
          </p>

          {message && (
            <div className="mt-6 flex items-center gap-3 rounded-[1.4rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {!isLogin && (
              <>
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Username</label>
                  <div className="field-shell">
                    <User className="h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="johndoe"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">WhatsApp Number</label>
                  <div className="field-shell">
                    <Phone className="h-5 w-5 text-slate-400" />
                    <input
                      type="tel"
                      placeholder="+919876543210"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Optional, but useful for WhatsApp receipt delivery.</p>
                </div>
              </>
            )}

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Email Address</label>
              <div className="field-shell">
                <Mail className="h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Password</label>
              <div className="field-shell">
                <Lock className="h-5 w-5 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="primary-button w-full py-4 text-base disabled:opacity-70">
              {loading ? 'Processing...' : isLogin ? 'Open Patient Portal' : 'Create Patient Account'}
              {!loading && <ArrowRight className="h-5 w-5" />}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-600">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            <button
              type="button"
              onClick={() => {
                setIsLogin((prev) => !prev);
                setMessage('');
                resetForm();
              }}
              className="ml-2 font-extrabold text-cyan-700 hover:text-cyan-800"
            >
              {isLogin ? 'Create one' : 'Sign in'}
            </button>
          </p>

          <div className="mt-8 rounded-[1.6rem] border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <LogIn className="h-5 w-5 text-cyan-700" />
              Once signed in, you can book appointments and download billing receipts from your dashboard.
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
