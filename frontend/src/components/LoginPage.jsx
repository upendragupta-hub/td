import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  HeartPulse,
  Lock,
  Mail,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleChange = (event) => {
    setFormData((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = isLogin
        ? await login(formData.email, formData.password)
        : await register(formData.username, formData.email, formData.password);

      if (result.success) {
        setSuccess(isLogin ? 'Login successful. Redirecting...' : 'Account created. Redirecting...');
        setTimeout(() => onLoginSuccess(result.admin), 900);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err?.message || 'Unable to continue right now.');
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
          <div className="absolute -right-14 top-0 h-40 w-40 rounded-full bg-cyan-400/14 blur-3xl" />
          <div>
            <div className="inline-flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-3">
                <HeartPulse className="h-7 w-7 text-cyan-300" />
              </div>
              <div>
                <p className="text-lg font-extrabold text-white">WeCare Admin</p>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Secure operations access</p>
              </div>
            </div>

            <h1 className="mt-8 text-4xl font-extrabold text-white sm:text-5xl">
              {isLogin ? 'Access the hospital control center.' : 'Create an admin account with confidence.'}
            </h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-slate-200">
              Manage appointments, staff workflows, inventory, and billing inside a single connected dashboard built for fast hospital operations.
            </p>
          </div>

          <div className="mt-10 space-y-4">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/8 p-4">
              <div className="flex items-center gap-3 text-sm text-slate-100">
                <ShieldCheck className="h-5 w-5 text-cyan-300" />
                Encrypted authentication with controlled admin-only access
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/8 p-4">
              <div className="flex items-center gap-3 text-sm text-slate-100">
                <HeartPulse className="h-5 w-5 text-cyan-300" />
                Designed for appointment flow, staffing, and hospital management
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 sm:p-10 lg:p-12">
          <span className="eyebrow">{isLogin ? 'Admin Sign In' : 'Create Admin'}</span>
          <h2 className="mt-6 text-3xl font-extrabold text-slate-900">
            {isLogin ? 'Welcome back.' : 'Set up your access.'}
          </h2>
          <p className="mt-3 text-sm text-slate-500">
            {isLogin ? 'Use your credentials to open the admin dashboard.' : 'Create your account to start managing hospital operations.'}
          </p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 flex items-center gap-3 rounded-[1.4rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600"
            >
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 flex items-center gap-3 rounded-[1.4rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-600"
            >
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span>{success}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {!isLogin && (
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Username</label>
                <div className="field-shell">
                  <User className="h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Enter your username"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Email Address</label>
              <div className="field-shell">
                <Mail className="h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@wecare.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Password</label>
              <div className="field-shell">
                <Lock className="h-5 w-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {!isLogin && <p className="mt-2 text-xs text-slate-500">Password must be at least 6 characters.</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="primary-button mt-2 w-full py-4 text-base disabled:opacity-70"
            >
              {loading ? 'Processing...' : isLogin ? 'Enter Admin Dashboard' : 'Create Admin Account'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-600">
            {isLogin ? "Don't have an account?" : 'Already registered?'}
            <button
              type="button"
              onClick={() => {
                setIsLogin((prev) => !prev);
                setError('');
                setSuccess('');
                setFormData({ username: '', email: '', password: '' });
              }}
              className="ml-2 font-extrabold text-cyan-700 hover:text-cyan-800"
            >
              {isLogin ? 'Create one' : 'Sign in'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
