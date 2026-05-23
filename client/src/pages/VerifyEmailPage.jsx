import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Mail, Loader2, AlertCircle, CheckCircle2, ShieldCheck, ArrowLeft, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore.js';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  
  const { verifyEmail, resendVerification, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const inputRefs = useRef([]);

  // Countdown timer for Resend code
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1); // Get last typed character
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Backspace to focus previous input
    if (e.key === 'Backspace' && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(pasteData)) {
      toast.error('Please paste a valid 6-digit code');
      return;
    }

    const digits = pasteData.split('');
    setOtp(digits);
    setError('');
    // Focus last input
    if (inputRefs.current[5]) {
      inputRefs.current[5].focus();
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setIsResending(true);
    setError('');
    const result = await resendVerification(email);
    setIsResending(false);
    if (result.success) {
      toast.success('A new verification code has been sent!');
      setResendTimer(60);
      // Reset OTP fields
      setOtp(['', '', '', '', '', '']);
      if (inputRefs.current[0]) inputRefs.current[0].focus();
    } else {
      setError(result.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length < 6) {
      setError('Please enter all 6 digits of the verification code');
      return;
    }

    const result = await verifyEmail(email, fullOtp);
    if (result.success) {
      toast.success('Email verified successfully! Welcome to Inventory Pro.');
      navigate('/dashboard', { replace: true });
    } else {
      setError(result.message || 'Verification failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-up">
        
        {/* Logo and Icon Banner */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white dark:bg-gray-900 shadow-xl shadow-primary-200/50 dark:shadow-none mb-6 border border-primary-50 dark:border-primary-900/30 text-primary-600 dark:text-primary-400">
            <Mail className="w-10 h-10 animate-bounce" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Security Verification</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm font-medium">
            Please verify your email address to activate your store.
          </p>
        </div>

        {/* Card */}
        <div className="card p-8 shadow-xl shadow-gray-100 dark:shadow-none border border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-3xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Context Info */}
            <div className="text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-3 py-1 rounded-full">
                Verification Required
              </span>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-4 leading-relaxed">
                We've sent a 6-digit verification code to:<br/>
                <strong className="text-gray-900 dark:text-white font-semibold break-all">{email}</strong>
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="flex items-start gap-2.5 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 animate-shake">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
              </div>
            )}

            {/* OTP Grid */}
            <div className="flex justify-between gap-2.5" onPaste={handlePaste}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-12 h-14 text-center text-xl font-bold bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-primary-500 focus:bg-white dark:focus:bg-gray-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 transition-all outline-none"
                  autoComplete="off"
                  disabled={isLoading}
                />
              ))}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-4 text-base font-bold shadow-lg shadow-primary-500/20 rounded-2xl flex items-center justify-center gap-2 group transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Activating Enterprise...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Verify & Activate
                </>
              )}
            </button>
          </form>

          {/* Resend Action */}
          <div className="text-center mt-8 pt-6 border-t border-gray-100 dark:border-gray-800/80">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Didn't receive the verification email?
            </p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendTimer > 0 || isResending}
              className={`mt-2 inline-flex items-center gap-2 text-sm font-bold transition-all ${
                resendTimer > 0 
                  ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                  : 'text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300'
              }`}
            >
              {isResending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {resendTimer > 0 ? `Resend Code in ${resendTimer}s` : 'Resend Code Now'}
            </button>
          </div>

        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </Link>
        </div>

      </div>
    </div>
  );
}
