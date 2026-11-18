import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, Eye, EyeOff, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If already authenticated, redirect to /admin/
  useEffect(() => {
    if (!loading && isAuthenticated) {
      const from = location.state?.from?.pathname || '/admin';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, loading, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const result = await login(email.trim(), password);
      if (result.success) {
        const from = location.state?.from?.pathname || '/admin';
        navigate(from, { replace: true });
      } else {
        setErrorMessage(result.message || 'Invalid email address or password.');
      }
    } catch {
      setErrorMessage('Network connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen w-full bg-[#F8FAFC] text-black flex flex-col justify-center items-center px-4 sm:px-6 py-4 overflow-y-auto sm:overflow-hidden select-none antialiased font-sans">
      {/* Suppress public click-to-call widget on admin login */}
      <style>{`
        .widgetcraft-container,
        [class*="widgetcraft"],
        div[id*="click-to-call"] {
          display: none !important;
        }
      `}</style>

      {/* Soft Blue Radial Accents */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-[460px] relative z-10 my-auto">
        {/* Brand Header */}
        <div className="text-center mb-5 sm:mb-6">
          <div className="flex justify-center mb-3">
            <img
              src="/vr4web.png"
              alt="VR4WEB Logo"
              className="h-10 sm:h-12 w-auto object-contain drop-shadow-xs"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-black">
            Admin <span className="text-[#2563EB]">Portal</span>
          </h1>
          <p className="text-black text-xs sm:text-sm mt-1.5 font-semibold">
            Secure administrative access for VR4Web Australia
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-[#DBEAFE] rounded-3xl p-6 sm:p-8 shadow-[0_10px_40px_-15px_rgba(37,99,235,0.08)]">
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-[#EF4444] text-xs sm:text-sm font-medium flex items-start gap-2">
              <span className="font-bold text-[#EF4444] mt-0.5">●</span>
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-black uppercase tracking-wider mb-2">
                EMAIL ADDRESS
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-black">
                  <Mail className="w-4 h-4 text-black" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@vr4web.com"
                  autoComplete="email"
                  disabled={isSubmitting}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-[#EFF6FF]/60 border border-[#DBEAFE] rounded-2xl text-black placeholder-slate-400 font-semibold focus:bg-white focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 text-sm transition-all duration-200"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-black uppercase tracking-wider mb-2">
                PASSWORD
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-black">
                  <Lock className="w-4 h-4 text-black" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  required
                  className="w-full pl-10 pr-11 py-3 bg-[#EFF6FF]/60 border border-[#DBEAFE] rounded-2xl text-black placeholder-slate-400 font-semibold focus:bg-white focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 text-sm transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-black hover:text-[#2563EB] transition-colors cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4 text-black" /> : <Eye className="w-4 h-4 text-black" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="group w-full h-[50px] sm:h-[52px] mt-2 bg-[#2563EB] hover:bg-[#1E40AF] text-white font-bold text-sm sm:text-[15px] rounded-2xl shadow-md shadow-blue-600/25 hover:shadow-lg hover:shadow-blue-600/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Login to Dashboard</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* Security Information */}
          <div className="mt-5 pt-4 border-t border-[#DBEAFE] text-center">
            <p className="text-xs text-black flex items-center justify-center gap-1.5 font-semibold">
              <ShieldCheck className="w-4 h-4 text-[#16A34A] shrink-0" />
              <span className="text-black">Encrypted Session · Single Sign-On Access</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-5 text-black text-xs font-semibold leading-relaxed">
          © {new Date().getFullYear()} VR4Web Australia Pty Ltd. All rights reserved.
        </div>
      </div>
    </div>
  );
}