import { useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend 
} from 'recharts';
import { TrendingUp, DollarSign, ShoppingBag, Package, Loader2 } from 'lucide-react';
import useSaleStore from '../store/saleStore.js';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b'];

export default function AnalyticsPage() {
  const { stats, fetchStats, isLoading } = useSaleStore();

  useEffect(() => {
    fetchStats();
  }, []);

  if (isLoading || !stats) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const { dailyRevenue, topProducts, paymentStats } = stats;

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Business Analytics</h1>
        <p className="text-sm text-gray-500">Insights into your sales and product performance</p>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Revenue Trend */}
        <div className="card p-6">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-500" /> Revenue Trend (Last 7 Days)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="_id" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(v) => [`₹${v}`, 'Revenue']}
                />
                <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="card p-6">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-indigo-500" /> Top Selling Products
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="_id" type="category" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} width={100} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px' }} />
                <Bar dataKey="totalSold" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20}>
                  {topProducts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="card p-6">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-500" /> Payment Distribution
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="_id"
                >
                  {paymentStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px' }} />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Stats Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-5 bg-primary-600 text-white">
            <TrendingUp className="w-6 h-6 mb-2 opacity-80" />
            <p className="text-xs opacity-80 uppercase font-bold tracking-wider">Avg Order Value</p>
            <p className="text-2xl font-bold mt-1">₹{(dailyRevenue.reduce((acc, d) => acc + d.revenue, 0) / dailyRevenue.reduce((acc, d) => acc + d.salesCount, 1)).toFixed(0)}</p>
          </div>
          <div className="card p-5 bg-indigo-600 text-white">
            <ShoppingBag className="w-6 h-6 mb-2 opacity-80" />
            <p className="text-xs opacity-80 uppercase font-bold tracking-wider">Total Sales</p>
            <p className="text-2xl font-bold mt-1">{dailyRevenue.reduce((acc, d) => acc + d.salesCount, 0)}</p>
          </div>
          <div className="card p-5 bg-white dark:bg-gray-800 border-none shadow-sm">
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Best Seller</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1 truncate">{topProducts[0]?._id || 'N/A'}</p>
          </div>
          <div className="card p-5 bg-white dark:bg-gray-800 border-none shadow-sm">
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Growth</p>
            <p className="text-xl font-bold text-green-500 mt-1">+12.5%</p>
          </div>
        </div>

      </div>
    </div>
  );
}
