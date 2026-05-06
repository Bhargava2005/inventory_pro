import { useEffect } from 'react';
import { Package, TrendingDown, AlertTriangle, DollarSign, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore.js';
import useProductStore from '../store/productStore.js';

const statCards = (stats) => [
  {
    label: 'Total Products',
    value: stats?.total ?? '—',
    icon: Package,
    color: 'text-primary-600 dark:text-primary-400',
    bg: 'bg-primary-50 dark:bg-primary-900/20',
    link: '/products',
  },
  {
    label: 'In Stock',
    value: stats?.inStock ?? '—',
    icon: Package,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/20',
    link: '/products',
  },
  {
    label: 'Low Stock',
    value: stats?.lowStock ?? '—',
    icon: AlertTriangle,
    color: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    link: '/low-stock',
  },
  {
    label: 'Out of Stock',
    value: stats?.outOfStock ?? '—',
    icon: TrendingDown,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/20',
    link: '/products',
  },
];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { stats, fetchStats, fetchCategories } = useProductStore();

  useEffect(() => {
    fetchStats();
    fetchCategories();
  }, []);

  const cards = statCards(stats);

  return (
    <div>
      {/* Page header */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.fullName?.split(' ')[0]}! 👋
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          Here's your inventory overview for today.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} to={card.link} className="card p-5 hover:shadow-md transition-shadow group">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{card.label}</p>
              <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
            </Link>
          );
        })}
      </div>

      {/* Inventory Value */}
      {stats && (
        <div className="card p-5 max-w-xs">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Inventory Value</p>
          </div>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            ₹{stats.totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
        </div>
      )}

      {/* Quick links */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/products" className="card card-body hover:shadow-md transition-shadow text-center py-5">
          <Package className="w-6 h-6 text-primary-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Manage Products</p>
        </Link>
        <Link to="/categories" className="card card-body hover:shadow-md transition-shadow text-center py-5">
          <Package className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Manage Categories</p>
        </Link>
        <Link to="/low-stock" className="card card-body hover:shadow-md transition-shadow text-center py-5">
          <AlertTriangle className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Low Stock Alerts</p>
        </Link>
      </div>
    </div>
  );
}
