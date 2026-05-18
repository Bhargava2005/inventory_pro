import { useEffect } from 'react';
import { 
  Package, ShoppingCart, BarChart3, Clock, 
  User as UserIcon, ArrowRight, ShieldCheck, 
  Store, AlertTriangle, TrendingDown, LayoutDashboard
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore.js';
import useDashboardStore from '../store/dashboardStore.js';
import useSettingsStore from '../store/settingsStore.js';
import BannerDisplay from '../components/dashboard/BannerDisplay.jsx';

export default function StaffHomePage() {
  const { user } = useAuthStore();
  const { summary, fetchSummary, isLoading } = useDashboardStore();
  const { settings } = useSettingsStore();
  const navigate = useNavigate();

  const hidePrice = settings?.privacy?.hideStaffPriceDetails;

  useEffect(() => {
    fetchSummary();
  }, []);

  if (isLoading || !summary) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { stats, recentSales, lowStockProducts } = summary;

  return (
    <div className="space-y-6 pb-10">
      {/* Welcome Section */}
      <div className="bg-gradient-to-br from-primary-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <LayoutDashboard size={160} />
        </div>
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider border border-white/20">
            <ShieldCheck size={14} /> Staff Portal
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Hello, {user?.fullName?.split(' ')[0]}! 👋
          </h1>
          <p className="text-primary-100 max-w-md opacity-80 font-medium">
            Ready for a productive day? Manage your sales and track inventory right here.
          </p>
        </div>
      </div>

      {/* Global Announcement Banner */}
      <BannerDisplay />

      {/* Main Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Primary Action: POS */}
        <Link 
          to="/pos" 
          className="group relative p-8 rounded-[2rem] bg-white dark:bg-gray-900 border-2 border-primary-100 dark:border-primary-900/30 hover:border-primary-500 transition-all overflow-hidden"
        >
          <div className="absolute -right-4 -bottom-4 p-8 text-primary-500/10 group-hover:scale-110 transition-transform">
            <ShoppingCart size={120} />
          </div>
          <div className="relative z-10 flex flex-col h-full">
            <div className="w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 mb-6">
              <ShoppingCart className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">New Voucher (POS)</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-6">
              Start a new transaction and process payments quickly.
            </p>
            <div className="mt-auto flex items-center gap-2 text-primary-600 font-bold text-sm">
              Open POS System <ArrowRight size={16} />
            </div>
          </div>
        </Link>

        {/* Secondary Action: Analytics */}
        <Link 
          to="/analytics" 
          className="group relative p-8 rounded-[2rem] bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 hover:border-indigo-500 transition-all overflow-hidden"
        >
          <div className="absolute -right-4 -bottom-4 p-8 text-indigo-500/10 group-hover:scale-110 transition-transform">
            <BarChart3 size={120} />
          </div>
          <div className="relative z-10 flex flex-col h-full">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 mb-6">
              <BarChart3 className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">My Performance</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-6">
              Track your sales performance and contribution today.
            </p>
            <div className="mt-auto flex items-center gap-2 text-indigo-600 font-bold text-sm">
              View My Stats <ArrowRight size={16} />
            </div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions for this staff */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-500" /> Recent Activity
            </h3>
            <Link to="/sales" className="text-sm font-bold text-primary-600 hover:underline">
              View History
            </Link>
          </div>
          
          <div className="card p-0 rounded-3xl overflow-hidden border-0 shadow-sm">
            {recentSales.length === 0 ? (
              <div className="p-10 text-center text-gray-400 italic">No sales recorded today.</div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {recentSales.slice(0, 5).map(sale => (
                  <div key={sale._id} className="p-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                        <Package size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-gray-900 dark:text-white">{sale.invoiceNumber}</p>
                        <p className="text-xs text-gray-500">{new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {sale.customer?.name || 'Walk-in'}</p>
                      </div>
                    </div>
                    {!hidePrice && (
                      <div className="text-right">
                        <p className="font-black text-primary-600">₹{sale.totalAmount.toLocaleString('en-IN')}</p>
                        <p className="text-[10px] text-gray-400 uppercase font-bold">{sale.paymentMethod}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Inventory Status (Low Stock only) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> Stock Alerts
            </h3>
          </div>
          
          <div className="card p-4 rounded-3xl space-y-4 bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30">
            {lowStockProducts.length === 0 ? (
              <div className="py-6 text-center text-gray-400 italic text-sm">All products are well stocked.</div>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.slice(0, 4).map(product => (
                  <div key={product._id} className="p-3 bg-white dark:bg-gray-900 rounded-2xl shadow-sm flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{product.name}</p>
                      <p className="text-[10px] text-gray-400 uppercase font-mono">{product.sku}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-black">
                        {product.quantity} LEFT
                      </span>
                    </div>
                  </div>
                ))}
                {lowStockProducts.length > 4 && (
                  <p className="text-center text-[10px] text-gray-400 font-bold uppercase py-2">
                    + {lowStockProducts.length - 4} more items low on stock
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Store Info */}
          <div className="card p-6 rounded-3xl bg-gray-900 text-white border-0 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
              <Store size={80} />
            </div>
            <p className="text-[10px] font-black text-primary-400 uppercase tracking-[0.2em] mb-4">Assigned Location</p>
            <div className="space-y-1">
              <h4 className="text-xl font-bold">{user?.storeId?.name || 'Main Branch'}</h4>
              <p className="text-sm text-gray-400">{user?.storeId?.location || 'General Address'}</p>
            </div>
            <div className="mt-6 flex items-center justify-between pt-6 border-t border-white/10">
              <div>
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Store Code</p>
                <p className="text-sm font-black">{user?.storeId?.code || '—'}</p>
              </div>
              <UserIcon size={20} className="text-gray-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
