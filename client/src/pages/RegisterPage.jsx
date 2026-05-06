import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Package, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore.js';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(50),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || /^[+]?[\d\s\-()]{7,15}$/.test(val), 'Enter a valid phone number'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/, 'Letters, numbers and underscores only'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[a-z]/, 'Must contain a lowercase letter')
    .regex(/\d/, 'Must contain a number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const PasswordStrength = ({ password }) => {
  if (!password) return null;
  const checks = [
    { test: password.length >= 8, label: '8+ characters' },
    { test: /[A-Z]/.test(password), label: 'Uppercase' },
    { test: /[a-z]/.test(password), label: 'Lowercase' },
    { test: /\d/.test(password), label: 'Number' },
  ];
  const score = checks.filter((c) => c.test).length;
  const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'];

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i < score ? colors[score - 1] : 'bg-gray-200 dark:bg-gray-700'}`} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {checks.map((c) => (
          <span key={c.label} className={`text-xs flex items-center gap-1 ${c.test ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
            <CheckCircle2 className="w-3 h-3" />
            {c.label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { register: registerUser, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError,
  } = useForm({ resolver: zodResolver(registerSchema) });

  const password = watch('password');

  const onSubmit = async (data) => {
    const { confirmPassword, ...userData } = data;
    const result = await registerUser(userData);
    if (result.success) {
      toast.success('Account created! Welcome to Inventory Pro.');
      navigate('/dashboard');
    } else {
      setError('root', { message: result.message });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 shadow-lg mb-4">
            <Package className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create your account</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Get started with Inventory Pro</p>
        </div>

        <div className="card p-8 shadow-xl shadow-gray-100 dark:shadow-none">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

            {errors.root && (
              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">{errors.root.message}</p>
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="label">Full Name <span className="text-red-400">*</span></label>
              <input {...register('fullName')} type="text" placeholder="John Doe" className={`input ${errors.fullName ? 'input-error' : ''}`} />
              {errors.fullName && <p className="error-text"><AlertCircle className="w-3 h-3" />{errors.fullName.message}</p>}
            </div>

            {/* Email + Phone in a row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Email <span className="text-red-400">*</span></label>
                <input {...register('email')} type="email" placeholder="you@email.com" className={`input ${errors.email ? 'input-error' : ''}`} />
                {errors.email && <p className="error-text"><AlertCircle className="w-3 h-3" />{errors.email.message}</p>}
              </div>
              <div>
                <label className="label">Phone</label>
                <input {...register('phone')} type="tel" placeholder="+91 98765 43210" className={`input ${errors.phone ? 'input-error' : ''}`} />
                {errors.phone && <p className="error-text"><AlertCircle className="w-3 h-3" />{errors.phone.message}</p>}
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="label">Username <span className="text-red-400">*</span></label>
              <input {...register('username')} type="text" placeholder="john_doe" className={`input ${errors.username ? 'input-error' : ''}`} autoComplete="username" />
              {errors.username && <p className="error-text"><AlertCircle className="w-3 h-3" />{errors.username.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="label">Password <span className="text-red-400">*</span></label>
              <div className="relative">
                <input {...register('password')} type={showPassword ? 'text' : 'password'} placeholder="Min. 8 characters" className={`input pr-11 ${errors.password ? 'input-error' : ''}`} autoComplete="new-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="error-text"><AlertCircle className="w-3 h-3" />{errors.password.message}</p>}
              <PasswordStrength password={password} />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="label">Confirm Password <span className="text-red-400">*</span></label>
              <div className="relative">
                <input {...register('confirmPassword')} type={showConfirm ? 'text' : 'password'} placeholder="Repeat your password" className={`input pr-11 ${errors.confirmPassword ? 'input-error' : ''}`} autoComplete="new-password" />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="error-text"><AlertCircle className="w-3 h-3" />{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full py-3 text-base mt-2">
              {isLoading ? (<><Loader2 className="w-4 h-4 animate-spin" />Creating account...</>) : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 dark:text-primary-400 font-medium hover:text-primary-700 dark:hover:text-primary-300">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-6">
          © 2026 Inventory Pro · Powered by WinWin
        </p>
      </div>
    </div>
  );
}
