import { Link } from 'react-router-dom';
import { 
  Package, LayoutDashboard, ShoppingCart, BarChart3, 
  ShieldCheck, ArrowRight, Zap, Globe, Clock, 
  Smartphone, Github, Twitter, Linkedin, Menu, X,
  Sun, Moon, CheckCircle2
} from 'lucide-react';
import { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore.js';
import useThemeStore from '../store/themeStore.js';

export default function LandingPage() {
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Removed top navigation links as per user request

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${scrolled ? 'py-3 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800' : 'py-6 bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-200 dark:shadow-none group-hover:scale-110 transition-transform">
              <Package className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">Inventory <span className="text-primary-600">Pro</span></span>
          </div>

          {/* Navigation links removed */}

          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            {user ? (
              <Link to="/dashboard" className="btn-primary rounded-xl px-6">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-bold text-gray-700 dark:text-gray-300 hover:text-primary-600 transition-colors">Login</Link>
                <Link to="/register" className="btn-primary rounded-xl px-6">Get Started</Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden p-2 text-gray-600 dark:text-gray-400" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Nav Drawer */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 p-4 space-y-4 animate-slide-up shadow-xl">
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-3">
              {user ? (
                <Link to="/dashboard" className="btn-primary w-full py-3 rounded-xl" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
              ) : (
                <>
                  <Link to="/login" className="btn-secondary w-full py-3 rounded-xl" onClick={() => setIsMenuOpen(false)}>Login</Link>
                  <Link to="/register" className="btn-primary w-full py-3 rounded-xl" onClick={() => setIsMenuOpen(false)}>Register Now</Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="hero-glow top-0 left-1/4 animate-blob" />
        <div className="hero-glow bottom-0 right-1/4 animate-blob animation-delay-2000" />
        <div className="hero-glow -bottom-1/2 left-1/2 animate-blob animation-delay-4000" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="text-center lg:text-left space-y-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-800/50">
                <Zap size={14} className="fill-current" />
                <span className="text-xs font-bold uppercase tracking-widest">Industry Leading Solution</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-gray-900 dark:text-white leading-[1.1] tracking-tight">
                Master Your <span className="text-gradient">Inventory</span> <br />
                with Intelligence.
              </h1>
              
              <p className="text-xl text-gray-500 dark:text-gray-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Streamline operations, optimize stock levels, and boost sales with the world's most advanced inventory management platform designed for modern enterprises.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link to="/register" className="btn-primary animate-shimmer text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-4 rounded-2xl shadow-xl shadow-primary-200 dark:shadow-none hover:scale-105 transition-all">
                  Get Started Free <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
                <Link to="/login" className="btn-secondary text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-4 rounded-2xl hover:bg-gray-50 transition-all border-2">
                  View Live Demo
                </Link>
              </div>
              
              <div className="pt-6 flex items-center justify-center lg:justify-start gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                <div className="flex items-center gap-2"><Globe size={20} /> <span className="font-bold text-sm">Global Sync</span></div>
                <div className="flex items-center gap-2"><Smartphone size={20} /> <span className="font-bold text-sm">Mobile First</span></div>
                <div className="flex items-center gap-2"><ShieldCheck size={20} /> <span className="font-bold text-sm">Bank Security</span></div>
              </div>
            </div>

            <div className="relative animate-float pt-10 lg:pt-0">
              <div className="absolute -inset-10 bg-gradient-to-tr from-primary-600/30 to-indigo-600/30 rounded-[40px] blur-[100px] animate-pulse" />
              
              <div className="relative rounded-[32px] border border-white/20 dark:border-gray-800 shadow-2xl overflow-hidden bg-white dark:bg-gray-900 aspect-video group">
                {/* CSS Mockup of a Dashboard */}
                <div className="w-full h-full p-4 sm:p-6 flex flex-col gap-3 sm:gap-4">
                  <div className="h-6 sm:h-8 w-1/3 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
                  <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-16 sm:h-24 bg-gray-50 dark:bg-gray-800/50 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-800 p-2 sm:p-4 flex flex-col justify-between">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-primary-100 dark:bg-primary-900/30" />
                        <div className="h-2 sm:h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded-md" />
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 bg-gray-50 dark:bg-gray-800/30 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-800 p-3 sm:p-4">
                    <div className="h-full w-full bg-gradient-to-t from-transparent to-primary-500/5 rounded-lg sm:rounded-xl border border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center">
                      <BarChart3 className="w-8 h-8 sm:w-12 sm:h-12 text-primary-500/20" />
                    </div>
                  </div>
                </div>

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-primary-600/10 to-transparent pointer-events-none" />
                
                {/* Floating Glass Cards — hidden on small screens to avoid overlap */}
                <div className="hidden sm:flex absolute top-8 right-8 p-4 rounded-2xl bg-glass border-white/20 shadow-xl animate-float" style={{ animationDelay: '1s' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                      <ShoppingCart className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-500 font-bold uppercase">Recent Sale</p>
                      <p className="font-bold text-gray-900 dark:text-white text-xs">₹12,450</p>
                    </div>
                  </div>
                </div>

                <div className="hidden sm:flex absolute bottom-8 left-8 p-4 rounded-2xl bg-glass border-white/20 shadow-xl animate-float" style={{ animationDelay: '2s' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-500 font-bold uppercase">Growth</p>
                      <p className="font-bold text-gray-900 dark:text-white text-xs">+24% Today</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-20 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:flex md:flex-wrap justify-center gap-8 sm:gap-12 lg:gap-32 text-center">
          {[
            { label: 'Active Users', value: '10K+', icon: Globe },
            { label: 'Transactions', value: '1M+', icon: Zap },
            { label: 'Customer Rating', value: '4.9/5', icon: CheckCircle2 },
            { label: 'Uptime', value: '99.9%', icon: Clock },
          ].map((stat, i) => (
            <div key={i} className="space-y-2">
              <p className="text-4xl font-black text-gray-900 dark:text-white">{stat.value}</p>
              <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
                <stat.icon size={16} />
                <span className="text-sm font-bold uppercase tracking-wider">{stat.label}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section - Moved up for immediate visibility */}
      <section id="features" className="landing-section relative z-10">
        <div className="text-center space-y-6 mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50 text-[10px] font-black uppercase tracking-[0.2em]">
            Core Ecosystem
          </div>
          <h2 className="text-4xl lg:text-6xl font-black text-gray-900 dark:text-white tracking-tight">
            Master Every Aspect of <br />
            Your <span className="text-gradient">Business</span>
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-lg font-medium leading-relaxed">
            A comprehensive suite of tools engineered for precision, speed, and absolute control over your operations.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { title: 'POS System', desc: 'Lightning-fast checkout with barcode scanning and multi-payment support.', icon: ShoppingCart, color: 'bg-blue-500' },
            { title: 'Real-time Analytics', desc: 'Deep insights into your sales, revenue, and employee performance.', icon: BarChart3, color: 'bg-purple-500' },
            { title: 'Smart Inventory', desc: 'Automatic low-stock alerts, category management, and physical audit tools.', icon: Package, color: 'bg-indigo-500' },
            { title: 'Staff Management', desc: 'Track employee behavior, login activity, and sales contributions.', icon: LayoutDashboard, color: 'bg-rose-500' },
            { title: 'Branch Control', desc: 'Manage multiple store locations from a single unified dashboard.', icon: Globe, color: 'bg-amber-500' },
            { title: 'Secure Access', desc: 'Role-based permissions and enterprise-grade data encryption.', icon: ShieldCheck, color: 'bg-emerald-500' },
          ].map((feature, i) => (
            <div key={i} className="group p-8 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-primary-400 transition-all hover:shadow-2xl hover:-translate-y-2">
              <div className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-gray-200 dark:shadow-none group-hover:rotate-12 transition-transform`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{feature.title}</h4>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-sm font-medium">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Solutions Section - Added as per user request */}
      <section id="solutions" className="landing-section bg-gray-50 dark:bg-gray-900/30">
        <div className="text-center space-y-6 mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 text-[10px] font-black uppercase tracking-[0.2em]">
            Industry Focus
          </div>
          <h2 className="text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
            Tailored for Your <span className="text-gradient">Industry</span>
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-lg font-medium leading-relaxed">
            Whether you run a single boutique or a nationwide retail chain, our solution adapts to your unique workflow.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
          <div className="p-6 sm:p-10 rounded-[32px] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl group hover:-translate-y-1 transition-all">
            <h4 className="text-2xl font-black text-gray-900 dark:text-white mb-4">Retail & Commerce</h4>
            <ul className="space-y-4">
              {['Inventory synchronization across branches', 'Multi-channel sales tracking', 'Customer loyalty management'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-600 dark:text-gray-400 font-medium">
                  <CheckCircle2 className="text-emerald-500 w-5 h-5 flex-shrink-0" /> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-6 sm:p-10 rounded-[32px] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl group hover:-translate-y-1 transition-all">
            <h4 className="text-2xl font-black text-gray-900 dark:text-white mb-4">Warehouse &amp; Logistics</h4>
            <ul className="space-y-4">
              {['Batch tracking and expiration alerts', 'Optimized pick and pack workflows', 'Real-time stock level monitoring'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-600 dark:text-gray-400 font-medium">
                  <CheckCircle2 className="text-indigo-500 w-5 h-5 flex-shrink-0" /> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Pricing Section - Added as per user request */}
      <section id="pricing" className="landing-section">
        <div className="text-center space-y-6 mb-20">
          <h2 className="text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
            Simple, Transparent <span className="text-gradient">Pricing</span>
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-lg font-medium">
            Start free and scale as your business grows. No hidden fees, ever.
          </p>
        </div>

        <div className="max-w-md mx-auto p-10 rounded-[40px] bg-gradient-to-br from-primary-600 to-indigo-700 text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
            <Zap size={120} />
          </div>
          <div className="relative z-10 space-y-8">
            <div>
              <p className="text-sm font-black uppercase tracking-widest opacity-80 mb-2">Pro Plan</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl font-black">₹4,999</span>
                <span className="text-lg sm:text-xl opacity-70">/month</span>
              </div>
            </div>
            <ul className="space-y-4 font-bold">
              {['Unlimited Products', 'All Locations', 'Advanced Analytics', 'Priority 24/7 Support'].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <CheckCircle2 size={20} className="text-primary-200" /> {item}
                </li>
              ))}
            </ul>
            <Link to="/register" className="block w-full py-4 bg-white text-primary-600 rounded-2xl text-center font-black text-lg hover:bg-gray-100 transition-colors shadow-xl animate-shimmer">
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="relative p-10 lg:p-20 rounded-[40px] bg-primary-600 overflow-hidden text-center text-white">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
            <div className="relative space-y-8 z-10">
              <h2 className="text-4xl lg:text-6xl font-black tracking-tight">Ready to transform <br /> your business?</h2>
              <p className="text-primary-100 text-lg max-w-xl mx-auto opacity-80">
                Join thousands of businesses worldwide that trust Inventory Pro for their daily operations. Start your free trial today.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/register" className="bg-white text-primary-600 px-6 sm:px-10 py-4 sm:py-5 rounded-2xl font-black text-base sm:text-lg hover:bg-gray-100 transition-colors shadow-2xl animate-shimmer">
                  Get Started for Free
                </Link>
                <Link to="/login" className="border-2 border-white/30 text-white px-6 sm:px-10 py-4 sm:py-5 rounded-2xl font-black text-base sm:text-lg hover:bg-white/10 transition-colors">
                  Contact Sales
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-gray-900/80 pt-20 pb-10 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-8 mb-16">
          <div className="col-span-2 lg:col-span-1 space-y-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-black text-gray-900 dark:text-white tracking-tight uppercase">Inventory Pro</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Leading the way in modern inventory management. Empowering businesses with data-driven insights and automated workflows.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="p-2 bg-white dark:bg-gray-800 rounded-lg text-gray-500 hover:text-primary-600 transition-colors"><Twitter size={18} /></a>
              <a href="#" className="p-2 bg-white dark:bg-gray-800 rounded-lg text-gray-500 hover:text-primary-600 transition-colors"><Linkedin size={18} /></a>
              <a href="#" className="p-2 bg-white dark:bg-gray-800 rounded-lg text-gray-500 hover:text-primary-600 transition-colors"><Github size={18} /></a>
            </div>
          </div>
          
          <div>
            <h5 className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-xs mb-6">Product</h5>
            <ul className="space-y-4 text-sm text-gray-500 dark:text-gray-400 font-bold">
              <li><a href="#" className="hover:text-primary-600 transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-primary-600 transition-colors">POS System</a></li>
              <li><a href="#" className="hover:text-primary-600 transition-colors">Analytics</a></li>
              <li><a href="#" className="hover:text-primary-600 transition-colors">Security</a></li>
            </ul>
          </div>

          <div>
            <h5 className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-xs mb-6">Company</h5>
            <ul className="space-y-4 text-sm text-gray-500 dark:text-gray-400 font-bold">
              <li><a href="#" className="hover:text-primary-600 transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-primary-600 transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-primary-600 transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-primary-600 transition-colors">Privacy</a></li>
            </ul>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <h5 className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-xs mb-6">Newsletter</h5>
            <p className="text-xs text-gray-500 mb-4">Stay updated with our latest news and features.</p>
            <div className="flex gap-2">
              <input type="email" placeholder="Email" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-xs flex-1 outline-none focus:ring-2 focus:ring-primary-500/20" />
              <button className="btn-primary px-4 py-2 rounded-xl"><ArrowRight size={16} /></button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 pt-8 border-t border-gray-100 dark:border-gray-800 text-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            © 2024 Inventory Pro. All rights reserved. Designed for Excellence.
          </p>
        </div>
      </footer>
    </div>
  );
}
