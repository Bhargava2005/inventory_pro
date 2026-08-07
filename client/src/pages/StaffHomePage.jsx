import { useEffect, useState, useCallback } from 'react';
import {
  Search, ShoppingCart, Package, ShieldCheck,
  LayoutDashboard, ArrowRight, Loader2, Box,
  Scale, Maximize, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore.js';
import useProductStore from '../store/productStore.js';
import useSettingsStore from '../store/settingsStore.js';

export default function StaffHomePage() {
  const { user } = useAuthStore();
  const {
    products,
    isLoading,
    fetchProducts,
    fetchCategories,
    fetchBrands,
    categories: storeCategories,
    brands,
    page,
    totalPages
  } = useProductStore();
  const { settings } = useSettingsStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);

  const isStaff = user?.role === 'staff';
  const hidePrice = isStaff && settings?.privacy?.hideStaffPriceDetails;

  // Initial category/brand fetch
  useEffect(() => {
    fetchCategories();
    fetchBrands();
    fetchProducts({ limit: 20, page: 1, search: '', category: 'all', brand: 'all' });
  }, []);

  // Handle filter changes with debounce for search
  const [isFirstRender, setIsFirstRender] = useState(true);
  useEffect(() => {
    if (isFirstRender) {
      setIsFirstRender(false);
      return;
    }

    const timer = setTimeout(() => {
      fetchProducts({
        search: searchQuery,
        category: selectedCategory,
        brand: selectedBrand,
        limit: 20,
        page: 1
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, selectedBrand]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    fetchProducts({
      search: searchQuery,
      category: selectedCategory,
      brand: selectedBrand,
      limit: 20,
      page: newPage
    });
    // Scroll to filters top for better UX
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6 pb-20">
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
            Search products to view details, or start a new voucher.
          </p>
        </div>
      </div>

      {/* New Voucher Button */}
      <Link
        to="/pos"
        className="group relative flex items-center gap-4 p-6 rounded-[2rem] bg-white dark:bg-gray-900 border-2 border-primary-100 dark:border-primary-900/30 hover:border-primary-500 transition-all overflow-hidden shadow-sm hover:shadow-xl"
      >
        <div className="absolute -right-4 -bottom-4 p-8 text-primary-500/10 group-hover:scale-110 transition-transform">
          <ShoppingCart size={100} />
        </div>
        <div className="w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 flex-shrink-0">
          <ShoppingCart className="w-7 h-7" />
        </div>
        <div className="relative z-10 flex-1">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Harshitha Voucher</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
            Start a new transaction and process payments quickly.
          </p>
        </div>
        <div className="flex items-center gap-2 text-primary-600 font-bold text-sm relative z-10">
          Open POS <ArrowRight size={16} />
        </div>
      </Link>

      {/* Product Search Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Package className="w-5 h-5 text-primary-500" /> Search Products
        </h2>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by product name or SKU…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full input pl-12 py-3.5 text-sm rounded-2xl shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category & Brand Filters */}
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-300 outline-none focus:ring-2 focus:ring-primary-500/20 appearance-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {storeCategories.map(cat => (
                <option key={cat._id} value={cat._id || cat.name}>{cat.name}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
            </div>
          </div>

          <div className="relative">
            <select
              value={selectedBrand}
              onChange={e => setSelectedBrand(e.target.value)}
              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-300 outline-none focus:ring-2 focus:ring-primary-500/20 appearance-none cursor-pointer"
            >
              <option value="all">All Brands</option>
              {brands.map(brand => {
                const name = typeof brand === 'string' ? brand : brand?.name || brand;
                return <option key={name} value={name}>{name}</option>;
              })}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
            </div>
          </div>
        </div>

        {/* Product Results */}
        <div className="space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
                <p className="text-sm font-medium text-gray-400">Loading products...</p>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="card flex flex-col items-center justify-center py-20 text-center animate-fade-in">
              <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
                <Package className="w-10 h-10 text-gray-300 dark:text-gray-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No products found</h3>
              <p className="text-gray-400 font-medium text-sm max-w-[250px] mx-auto">
                {searchQuery || selectedCategory !== 'all' || selectedBrand !== 'all'
                  ? "We couldn't find any products matching your filters."
                  : "It looks like there are no products in this branch yet."}
              </p>
              {(searchQuery || selectedCategory !== 'all' || selectedBrand !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedBrand('all');
                  }}
                  className="mt-6 text-sm font-bold text-primary-600 hover:text-primary-700 underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-2">
                {products.map(p => (
                  <button
                    key={p._id}
                    onClick={() => setSelectedProduct(selectedProduct?._id === p._id ? null : p)}
                    className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${selectedProduct?._id === p._id
                        ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20 shadow-md'
                        : 'border-transparent bg-white dark:bg-gray-900 hover:border-primary-200 shadow-sm'
                      }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : <Package className="w-5 h-5 text-gray-300" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{p.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-gray-400 font-mono">{p.sku}</span>
                        <span className="text-[10px] text-gray-400">·</span>
                        <span className={`text-[10px] font-bold ${p.quantity > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {p.quantity} in stock
                        </span>
                      </div>
                    </div>
                    {!hidePrice && <span className="text-sm font-black text-primary-600 flex-shrink-0">₹{p.price?.toLocaleString('en-IN')}</span>}
                  </button>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between gap-4 py-8">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-gray-700 dark:text-gray-300 transition-all hover:border-primary-200 active:scale-95"
                  >
                    <ChevronLeft size={20} /> Previous
                  </button>
                  <div className="px-4 py-2 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 font-bold text-sm">
                    {page} / {totalPages}
                  </div>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    className="flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-gray-700 dark:text-gray-300 transition-all hover:border-primary-200 active:scale-95"
                  >
                    Next <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Product Detail Card */}
      {selectedProduct && (
        <div className="card p-6 rounded-3xl space-y-4 bg-white dark:bg-gray-900 border border-primary-200 dark:border-primary-800 shadow-xl animate-fade-in mb-8">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Product Details</h3>
            <button onClick={() => setSelectedProduct(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
              {selectedProduct.image ? <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" /> : <Package className="w-8 h-8 text-gray-300" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-gray-900 dark:text-white">{selectedProduct.name}</p>
              <p className="text-xs text-gray-400 font-mono mt-0.5">{selectedProduct.sku} • {selectedProduct.brand || 'General'}</p>
              {!hidePrice && <p className="text-lg font-black text-primary-600 mt-1">₹{selectedProduct.price?.toLocaleString('en-IN')}</p>}
            </div>
          </div>

          {selectedProduct.description && (
            <p className="text-xs text-gray-500">{selectedProduct.description}</p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-semibold text-gray-500">
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center gap-2">
              <Box className="w-4 h-4 text-primary-500" />
              <span>Stock: {selectedProduct.quantity} {selectedProduct.unit === 'bag' ? 'Bags' : selectedProduct.unit === 'box' ? 'Boxes' : selectedProduct.unit}</span>
            </div>
            {selectedProduct.pieces_per_box > 1 && (
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center gap-2">
                <Package className="w-4 h-4 text-green-500" />
                <span>{selectedProduct.ava_pieces} Loose Pcs</span>
              </div>
            )}
            {selectedProduct.measurements && (
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center gap-2">
                <Maximize className="w-4 h-4 text-blue-500" />
                <span className="truncate">{selectedProduct.measurements}</span>
              </div>
            )}
            {selectedProduct.weight_of_unit > 0 && (
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center gap-2">
                <Scale className="w-4 h-4 text-orange-500" />
                <span>{selectedProduct.weight_of_unit} KG / Unit</span>
              </div>
            )}
          </div>

          {selectedProduct.pieces_per_box > 1 && !hidePrice && (
            <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
              <span className="font-bold text-gray-700 dark:text-gray-300">Price per piece:</span> ₹{(selectedProduct.price / selectedProduct.pieces_per_box).toFixed(2)}
              <span className="text-gray-400 ml-2">({selectedProduct.pieces_per_box} pieces/box)</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
