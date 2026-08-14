import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../lib/auth';
import { errorMessage } from '../lib/toast';

export default function LoginPage() {
  const { admin, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: Location } };
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (admin) return <Navigate to="/" replace />;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-8">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-300/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-[28rem] w-[28rem] rounded-full bg-brand-200/25 blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #100f0a 1px, transparent 1px), linear-gradient(to bottom, #100f0a 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative w-full max-w-4xl animate-[fadeIn_0.3s_ease-out]">
        <div className="grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 md:grid-cols-2">
          <div className="relative hidden flex-col justify-between overflow-hidden bg-ink-900 p-10 text-white md:flex">
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-brand-500/20 blur-3xl" />

            <div className="relative flex items-center gap-2.5">
              <img src="/home.png" alt="Hajj &amp; Umrah Guide" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
              <span className="text-sm font-semibold">Hajj &amp; Umrah Guide</span>
            </div>

            <div className="relative">
              <h1 className="text-2xl font-semibold leading-snug">Admin panel for the pilgrim's companion app.</h1>
              <p className="mt-3 text-sm text-ink-200">
                Manage ritual steps, duas, guide topics and more from one place.
              </p>
            </div>

            <p className="relative text-xs text-ink-300">© {new Date().getFullYear()} Hajj &amp; Umrah Guide</p>
          </div>

          <div className="flex flex-col justify-center px-8 py-10 sm:px-12">
            <div className="mb-8 text-center md:text-left">
              <img src="/login.png" alt="Hajj &amp; Umrah Guide" className="mx-auto h-11 w-auto md:mx-0" />
              <h2 className="mt-5 text-xl font-semibold text-slate-900">Welcome back</h2>
              <p className="mt-1 text-sm text-slate-500">Sign in to continue to the admin panel</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              {error && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">{error}</div>
              )}

              <div>
                <label className="label" htmlFor="email">
                  Email
                </label>
                <div className="relative">
                  <FiMail
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    size={17}
                  />
                  <input
                    id="email"
                    type="email"
                    className="input py-2.5 pl-10 text-base"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="label" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <FiLock
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    size={17}
                  />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="input py-2.5 pl-10 pr-10 text-base"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-primary w-full py-2.5 text-base" disabled={submitting}>
                {submitting ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <p className="mt-8 text-center text-xs text-slate-400 md:hidden">
              © {new Date().getFullYear()} Hajj &amp; Umrah Guide
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
