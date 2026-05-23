import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Eye, EyeOff, Package, Loader2, AlertCircle, CheckCircle2, 
  User, Mail, Phone, Lock, Building2, MapPin, Hash, ArrowRight, ArrowLeft, Wand2
} from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore.js';
import axios from 'axios';
import { useEffect } from 'react';

const registerSchema = z.object({
  // Step 1: Personal
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(50),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  phone: z.string().min(10, 'Enter a valid phone number'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(20),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  
  // Step 2: Business
  businessName: z.string().min(3, 'Business name is required'),
  storeCode: z.string().min(2, 'Store code is required (e.g. SHOP-01)'),
  address: z.string().min(5, 'Business address is required'),
  gstNumber: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const StepIndicator = ({ step }) => (
  <div className="flex items-center justify-center gap-4 mb-8">
    <div className={`flex items-center gap-2 ${step === 1 ? 'text-primary-600' : 'text-gray-400'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step === 1 ? 'bg-primary-600 text-white shadow-lg' : 'bg-gray-200'}`}>1</div>
      <span className="font-medium">Account</span>
    </div>
    <div className="w-12 h-px bg-gray-200" />
    <div className={`flex items-center gap-2 ${step === 2 ? 'text-primary-600' : 'text-gray-400'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step === 2 ? 'bg-primary-600 text-white shadow-lg' : 'bg-gray-200'}`}>2</div>
      <span className="font-medium">Business</span>
    </div>
  </div>
);

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const { register: registerUser, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors },
    setError,
  } = useForm({ 
    resolver: zodResolver(registerSchema),
    mode: 'onBlur'
  });

  const fullName = watch('fullName');
  const currentUsername = watch('username');

  const handleSuggestUsername = async () => {
    if (!fullName || fullName.length < 2) return;
    try {
      const { data } = await axios.get(`/api/auth/suggest-username?name=${encodeURIComponent(fullName)}`);
      if (data.success) {
        setValue('username', data.username, { shouldValidate: true });
        toast.success('Username suggested!', { id: 'suggest-username', duration: 1500 });
      }
    } catch (error) {
      console.error('Failed to suggest username');
    }
  };

  // Auto-suggest when name is typed for the first time
  useEffect(() => {
    const timer = setTimeout(() => {
      if (fullName && !currentUsername) {
        handleSuggestUsername();
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [fullName]);

  const nextStep = async () => {
    const fieldsToValidate = ['fullName', 'email', 'phone', 'username', 'password', 'confirmPassword'];
    const isValid = await trigger(fieldsToValidate);
    if (isValid) setStep(2);
  };

  const onSubmit = async (data) => {
    const { confirmPassword, ...userData } = data;
    const result = await registerUser(userData);
    if (result.success) {
      if (result.needsVerification) {
        toast.success('Registration successful! Please verify your email.');
        navigate(`/verify-email?email=${encodeURIComponent(result.email)}`);
      } else {
        toast.success('Business Setup Complete! Welcome to Inventory Pro.');
        navigate('/dashboard');
      }
    } else {
      setError('root', { message: result.message });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-lg animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white dark:bg-gray-900 shadow-xl shadow-primary-200/50 dark:shadow-none mb-6 overflow-hidden border border-primary-50 dark:border-primary-900/30">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover scale-110" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Business Setup Wizard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm font-medium uppercase tracking-[0.2em] opacity-70">Register your enterprise in 2 easy steps</p>
        </div>

        <div className="card p-8 shadow-xl shadow-gray-100 dark:shadow-none">
          <StepIndicator step={step} />

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {errors.root && (
              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">{errors.root.message}</p>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                {/* Step 1 Fields */}
                <div>
                  <label className="label">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input {...register('fullName')} type="text" placeholder="Owner Name" className={`input pl-10 ${errors.fullName ? 'input-error' : ''}`} />
                  </div>
                  {errors.fullName && <p className="error-text">{errors.fullName.message}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input {...register('email')} type="email" placeholder="you@business.com" className={`input pl-10 ${errors.email ? 'input-error' : ''}`} />
                    </div>
                    {errors.email && <p className="error-text">{errors.email.message}</p>}
                  </div>
                  <div>
                    <label className="label">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input {...register('phone')} type="text" placeholder="+91..." className={`input pl-10 ${errors.phone ? 'input-error' : ''}`} />
                    </div>
                    {errors.phone && <p className="error-text">{errors.phone.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                  <label className="label">Choose Username</label>
                  <div className="relative">
                    <input {...register('username')} type="text" placeholder="admin_user" className={`input pr-10 ${errors.username ? 'input-error' : ''}`} />
                    <button 
                      type="button" 
                      onClick={handleSuggestUsername}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-500 hover:text-primary-600 transition-colors"
                      title="Generate unique username"
                    >
                      <Wand2 className="w-4 h-4" />
                    </button>
                  </div>
                  {errors.username && <p className="error-text">{errors.username.message}</p>}
                </div>
                  <div>
                    <label className="label">Create Password</label>
                    <div className="relative">
                      <input {...register('password')} type={showPassword ? 'text' : 'password'} placeholder="••••••••" className={`input ${errors.password ? 'input-error' : ''}`} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="error-text">{errors.password.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="label">Confirm Password</label>
                  <input {...register('confirmPassword')} type="password" placeholder="••••••••" className={`input ${errors.confirmPassword ? 'input-error' : ''}`} />
                  {errors.confirmPassword && <p className="error-text">{errors.confirmPassword.message}</p>}
                </div>

                <button type="button" onClick={nextStep} className="btn-primary w-full py-3 mt-4">
                  Next: Business Details <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                {/* Step 2 Fields */}
                <div>
                  <label className="label">Business / Company Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input {...register('businessName')} type="text" placeholder="e.g. WinWin Tiles & Ceramics" className={`input pl-10 ${errors.businessName ? 'input-error' : ''}`} />
                  </div>
                  {errors.businessName && <p className="error-text">{errors.businessName.message}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Store Code / Shop ID</label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input {...register('storeCode')} type="text" placeholder="e.g. MAIN-01" className={`input pl-10 uppercase ${errors.storeCode ? 'input-error' : ''}`} />
                    </div>
                    {errors.storeCode && <p className="error-text">{errors.storeCode.message}</p>}
                  </div>
                  <div>
                    <label className="label">GST Number (Optional)</label>
                    <input {...register('gstNumber')} type="text" placeholder="22AAAAA0000A1Z5" className={`input uppercase ${errors.gstNumber ? 'input-error' : ''}`} />
                  </div>
                </div>

                <div>
                  <label className="label">Business Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-4 w-4 h-4 text-gray-400" />
                    <textarea {...register('address')} rows="3" placeholder="Full business address..." className={`input pl-10 pt-3 resize-none ${errors.address ? 'input-error' : ''}`} />
                  </div>
                  {errors.address && <p className="error-text">{errors.address.message}</p>}
                </div>

                <div className="flex gap-3 mt-6">
                  <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1 py-3">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button type="submit" disabled={isLoading} className="btn-primary flex-[2] py-3 text-base">
                    {isLoading ? (<><Loader2 className="w-4 h-4 animate-spin" /> Setting up...</>) : 'Finish Setup & Launch'}
                  </button>
                </div>
              </div>
            )}
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 dark:text-primary-400 font-medium hover:text-primary-700 dark:hover:text-primary-300">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-6">
          © 2026 Inventory Pro · Secure Enterprise Registration
        </p>
      </div>
    </div>
  );
}
