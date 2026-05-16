import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, ShoppingCart, Trash2, Plus, Minus, 
  CreditCard, Banknote, User, Phone, X, Loader2, AlertCircle, Scan,
  Package, Filter, RefreshCw, History, ChevronLeft, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Html5QrcodeScanner } from 'html5-qrcode';
import useProductStore from '../store/productStore.js';
import useSaleStore from '../store/saleStore.js';
import useSettingsStore from '../store/settingsStore.js';
import useCartStore from '../store/cartStore.js';
import useAuthStore from '../store/authStore.js';
import { generateInvoicePDF } from '../utils/pdfGenerator.js';
import { fuzzyMatch } from '../utils/searchUtils.js';

export default function NewSalePage() {
  const { 
    products, total, totalPages, page, isLoading, filters,
    fetchProducts, fetchCategories, fetchBrands, setFilters, setPage, 
    categories: storeCategories, brands
  } = useProductStore();
  const { processSale, isSubmitting } = useSaleStore();
  const { settings, fetchSettings } = useSettingsStore();
  const { user } = useAuthStore();
  const { 
    cart, setCart, removeFromCart, updateQty, setQty,
    customer, setCustomer,
    taxRate, setTaxRate,
    discountRate, setDiscountRate,
    paymentMethod, setPaymentMethod,
    clearCart, toggleItemFlag
  } = useCartStore();
  
  const [localSearch, setLocalSearch] = useState(filters.search);
  const [showScanner, setShowScanner] = useState(false);
  const [activeTab, setActiveTab] = useState('products');
  const navigate = useNavigate();
  
  // Modal States
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showAddConfirm, setShowAddConfirm] = useState(false);
  const [productToConfirm, setProductToConfirm] = useState(null);
  const [confirmQty, setConfirmQty] = useState(1);
  const [confirmPieces, setConfirmPieces] = useState(0); // Loose pieces
  const [confirmPool, setConfirmPool] = useState('isSelling');
  
  // Transporter State
  const { transporter, setTransporter } = useCartStore();
  
  // Filter States
  const [showFilters, setShowFilters] = useState(false);
  
  // Tax & Discount Calculated Amounts
  const [taxAmount, setTaxAmount] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Fetch categories and initial products
  useEffect(() => {
    fetchCategories();
    fetchBrands();
    fetchProducts({ limit: 16 });
    if (!settings) {
      fetchSettings();
    } else if (cart.length === 0) {
      setTaxRate(settings?.sales?.defaultTax || 0);
    }
  }, []);

  // Fetch whenever filters or page change
  useEffect(() => {
    fetchProducts({ limit: 16 });
  }, [filters, page]);

  // Debounced Search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== filters.search) {
        setFilters({ search: localSearch });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearch]);

  // Update default tax when settings are fetched (only if cart is new)
  useEffect(() => {
    if (settings?.sales?.defaultTax && cart.length === 0) {
      setTaxRate(settings.sales.defaultTax);
    }
  }, [settings]);

  const subtotal = cart.reduce((acc, item) => {
    // Damaged and WrongProduct are free/reporting-only; Selling and Sample are charged
    if (item.isDamaged || item.isWrongProduct) return acc;
    const ppb = item.pieces_per_box || 1;
    const pricePerPiece = item.pricePerPiece || (item.price / ppb);
    return acc + (item.price * item.quantity) + (item.pieces * pricePerPiece);
  }, 0);

  const finalTotal = subtotal + taxAmount - discountAmount;

  const isStaff = user?.role === 'staff';
  const hidePrice = isStaff && settings?.privacy?.hideStaffPriceDetails;
  const hideTax = isStaff && settings?.privacy?.hideStaffTaxDetails;

  // Recalculate amounts when subtotal or rates change
  useEffect(() => {
    setTaxAmount((subtotal * taxRate) / 100);
    setDiscountAmount((subtotal * discountRate) / 100);
  }, [subtotal, taxRate, discountRate]);

  const handleTaxRateChange = (rate) => {
    const val = parseFloat(rate) || 0;
    setTaxRate(val);
  };

  const handleTaxAmountChange = (amount) => {
    const val = parseFloat(amount) || 0;
    setTaxAmount(val);
    setTaxRate(subtotal > 0 ? (val / subtotal) * 100 : 0);
  };

  const handleDiscountRateChange = (rate) => {
    const val = parseFloat(rate) || 0;
    setDiscountRate(val);
  };

  const handleDiscountAmountChange = (amount) => {
    const val = parseFloat(amount) || 0;
    setDiscountAmount(val);
    setDiscountRate(subtotal > 0 ? (val / subtotal) * 100 : 0);
  };

  useEffect(() => {
    if (showScanner) {
      const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
      scanner.render((decodedText) => {
        // For barcode, we still need to look in the current batch or fetch specifically
        // But for simplicity, we'll check current products first
        const product = products.find(p => p.sku === decodedText);
        if (product) {
          addToCart(product);
          toast.success(`Added ${product.name}`);
          setShowScanner(false);
          scanner.clear();
        } else {
          toast.error("Product not found in current view");
        }
      }, () => {});

      return () => scanner.clear();
    }
  }, [showScanner, products]);



  const addToCart = (product) => {
    if (product.quantity <= 0 && product.ava_pieces <= 0) { 
      toast.error('Product completely out of stock'); 
      return; 
    }
    setProductToConfirm(product);
    if (product.quantity > 0) {
      setConfirmQty(1);
      setConfirmPieces(0);
    } else {
      setConfirmQty(0);
      setConfirmPieces(1);
    }
    setConfirmPool('isSelling');
    setShowAddConfirm(true);
  };

  const handleConfirmAdd = () => {
    if (!productToConfirm) return;
    
    const qty = parseInt(confirmQty) || 0;
    const pces = parseInt(confirmPieces) || 0;

    if (qty === 0 && pces === 0) {
      toast.error('Please enter a quantity');
      return;
    }

    const existing = cart.find(item => item.product === productToConfirm._id);
    
    // Pieces overflow logic (moved to store, but handled here for immediate validation)
    let finalQty = qty;
    let finalPieces = pces;
    const ppb = productToConfirm.pieces_per_box || 1;
    
    if (finalPieces >= ppb) {
      finalQty += Math.floor(finalPieces / ppb);
      finalPieces = finalPieces % ppb;
    }

    if (existing) {
      if (existing.quantity + finalQty > productToConfirm.quantity) {
        toast.error(`Insufficient box stock.`);
        return;
      }
      if (existing.pieces + finalPieces > productToConfirm.ava_pieces && productToConfirm.quantity <= existing.quantity + finalQty) {
        toast.error(`Insufficient piece stock.`);
        return;
      }

      setCart(prev => prev.map(item => item.product === productToConfirm._id ? { 
        ...item, 
        quantity: item.quantity + finalQty,
        pieces: item.pieces + finalPieces,
        [confirmPool]: true,
        isSelling: confirmPool === 'isSelling',
        isDamaged: confirmPool === 'isDamaged',
        isSample: confirmPool === 'isSample',
        isWrongProduct: confirmPool === 'isWrongProduct',
      } : item));
    } else {
      setCart(prev => [...prev, { 
        product: productToConfirm._id, 
        name: productToConfirm.name, 
        brand: productToConfirm.brand,
        price: productToConfirm.price, 
        image: productToConfirm.image,
        color: productToConfirm.color,
        quantity: finalQty, 
        pieces: finalPieces,
        pieces_per_box: ppb,
        maxQty: productToConfirm.quantity,
        maxPieces: productToConfirm.ava_pieces,
        isSelling: confirmPool === 'isSelling',
        isDamaged: confirmPool === 'isDamaged',
        isSample: confirmPool === 'isSample',
        isWrongProduct: confirmPool === 'isWrongProduct'
      }]);
    }
    toast.success(`Added ${productToConfirm.name} to cart`);
    setShowAddConfirm(false);
    setProductToConfirm(null);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    const itemsForBackend = cart.map(({ isSelling, ...rest }) => rest);
    const result = await processSale({ 
      items: itemsForBackend, 
      customer, 
      transporter,
      paymentMethod, 
      tax: taxAmount,
      discount: discountAmount 
    });
    if (result.success) {
      toast.success('Sale completed! Invoice: ' + result.data.invoiceNumber);
      generateInvoicePDF(result.data);
      clearCart();
      setActiveTab('products');
      setShowCheckoutModal(false);
      fetchProducts();
    } else {
      toast.error(result.message);
    }
  };

  const renderTaxDiscountFields = (isSidebar = false) => {
    if (hideTax) return null;
    return (
      <div className={`grid grid-cols-1 ${isSidebar ? 'gap-6' : 'md:grid-cols-2 gap-10'} p-4 ${isSidebar ? 'bg-transparent p-0' : 'bg-gray-50 dark:bg-gray-800/40 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-inner'}`}>
        <div className="space-y-3">
          <label className={`text-[11px] font-black text-gray-400 uppercase tracking-widest ${isSidebar ? 'ml-0' : 'ml-1'}`}>
            Taxation
          </label>
          <div className={`flex ${isSidebar ? 'flex-col' : 'items-center'} gap-3`}>
            <div className="relative flex-1">
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">%</span>
              <input 
                type="number" 
                className={`w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-3 py-2.5 text-sm text-center focus:ring-2 focus:ring-primary-500/20 outline-none transition-all shadow-sm`} 
                value={taxRate === 0 ? '' : taxRate} 
                onChange={(e) => handleTaxRateChange(e.target.value)}
                placeholder="Tax Rate %"
              />
            </div>
            <div className="relative flex-[1.5]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">₹</span>
              <input 
                type="number" 
                className={`w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl pl-8 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500/20 outline-none transition-all shadow-sm`} 
                value={taxAmount === 0 ? '' : taxAmount.toFixed(0)} 
                onChange={(e) => handleTaxAmountChange(e.target.value)}
                placeholder="Tax Amount ₹"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className={`text-[11px] font-black text-gray-400 uppercase tracking-widest ${isSidebar ? 'ml-0' : 'ml-1'}`}>
            Discount
          </label>
          <div className={`flex ${isSidebar ? 'flex-col' : 'items-center'} gap-3`}>
            <div className="relative flex-1">
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">%</span>
              <input 
                type="number" 
                className={`w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-3 py-2.5 text-sm text-center focus:ring-2 focus:ring-primary-500/20 outline-none transition-all shadow-sm`} 
                value={discountRate === 0 ? '' : discountRate} 
                onChange={(e) => handleDiscountRateChange(e.target.value)}
                placeholder="Discount Rate %"
              />
            </div>
            <div className="relative flex-[1.5]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">₹</span>
              <input 
                type="number" 
                className={`w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl pl-8 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500/20 outline-none transition-all shadow-sm`} 
                value={discountAmount === 0 ? '' : discountAmount.toFixed(0)} 
                onChange={(e) => handleDiscountAmountChange(e.target.value)}
                placeholder="Discount Amount ₹"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─── Product Grid ─────────────────────────────────────────────────────────
  const productGrid = (
    <div className="card flex-1 flex flex-col min-h-0 overflow-hidden p-4">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input 
          type="text" 
          placeholder="Search by name or SKU..." 
          className="input pl-10 pr-24"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
        />
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`absolute right-12 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${showFilters ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
          title="Filters"
        >
          <Filter className="w-4 h-4" />
        </button>
        <button 
          onClick={() => setShowScanner(true)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-primary-100 text-primary-600 rounded-lg hover:bg-primary-200 transition-colors"
          title="Scan Barcode"
        >
          <Scan className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="relative mb-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 animate-slide-down grid grid-cols-1 md:grid-cols-4 gap-4">
          <button 
            onClick={() => setShowFilters(false)}
            className="absolute -top-2 -right-2 p-1.5 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-red-500 shadow-sm transition-colors z-10"
            title="Close Filters"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Category</label>
            <select 
              value={filters.category} 
              onChange={e => setFilters({ category: e.target.value })} 
              className="w-full text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            >
              <option value="all">All Categories</option>
              {storeCategories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Brand</label>
            <select 
              value={filters.brand || 'all'} 
              onChange={e => setFilters({ brand: e.target.value === 'all' ? '' : e.target.value })} 
              className="w-full text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            >
              <option value="all">All Brands</option>
              {brands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="md:col-span-2 flex items-end gap-2">
            <button 
              onClick={() => { setFilters({ category: 'all', brand: '', search: '' }); setLocalSearch(''); }}
              className="w-full px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 font-bold text-xs"
            >
              <RefreshCw className="w-4 h-4" /> Reset All Filters
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-3 px-1">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
          {filters.search || filters.category !== 'all' ? (
            <span className="text-primary-600">Filtered Results</span>
          ) : (
            <span>All Products</span>
          )}
          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-300">
            {total}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 pr-1">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>
        ) : products.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
            <Package className="w-10 h-10 mb-2 opacity-30" />
            <p className="italic text-sm">No products found</p>
          </div>
        ) : (
          products.map(p => (
            <button 
              key={p._id}
              onClick={() => { addToCart(p); }}
              disabled={p.quantity <= 0}
              className={`group flex flex-col rounded-2xl border text-left transition-all hover:shadow-xl active:scale-95 overflow-hidden min-h-[280px] sm:min-h-[320px] ${
                p.quantity <= 0 
                  ? 'bg-gray-50 dark:bg-gray-800/30 border-gray-100 dark:border-gray-700 opacity-50 cursor-not-allowed' 
                  : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-primary-400'
              }`}
            >
              {/* Product Image */}
              <div className="relative h-32 sm:h-44 w-full bg-gray-100 dark:bg-gray-900 overflow-hidden flex-shrink-0">
                {p.image ? (
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Package className="w-8 h-8" />
                  </div>
                )}
                <div 
                  className="absolute top-2 left-2 w-2 h-2 rounded-full shadow-sm" 
                  style={{ backgroundColor: p.color || '#3b82f6' }} 
                />
              </div>

              <div className="p-3 flex-1 flex flex-col border-t-[3px] gap-1.5" style={{ borderTopColor: p.color || '#3b82f6' }}>
                <div className="flex flex-col gap-0.5">
                  <p className="text-[9px] text-gray-400 font-mono truncate uppercase tracking-tighter">
                    {p.sku} • {p.brand || 'General'} {p.dimensions ? `• ${p.dimensions}` : ''}
                  </p>
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-100 line-clamp-2 leading-tight h-8 mb-1">{p.name}</p>
                </div>
                
                <div className="flex items-center justify-between mt-auto pt-1">
                  {!hidePrice && <p className="text-primary-600 dark:text-primary-400 font-black text-sm">₹{p.price.toLocaleString('en-IN')}</p>}
                  <div className={`flex flex-col items-end ${hidePrice ? 'w-full' : ''}`}>
                    <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold ${p.quantity <= 5 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                      {p.quantity} {p.unit} (Boxes)
                    </span>
                    {p.pieces_per_box > 1 && (
                      <span className="text-[9px] text-gray-400 font-medium">
                        {p.ava_pieces} Separate Pcs
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 px-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button 
              onClick={() => setPage(page - 1)} 
              disabled={page === 1}
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 disabled:opacity-30 transition-all active:scale-95"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={() => setPage(page + 1)} 
              disabled={page === totalPages}
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 disabled:opacity-30 transition-all active:scale-95"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // ─── Cart Panel ───────────────────────────────────────────────────────────
  const cartPanel = (
    <div className="card flex-1 flex flex-col min-h-0 overflow-hidden relative">
      <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="font-bold flex items-center gap-2 text-gray-900 dark:text-white">
            <ShoppingCart className="w-5 h-5 text-primary-600" />
            Cart ({cart.length})
          </h2>
        </div>
        {cart.length > 0 && (
          <button onClick={() => clearCart()} className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors">Clear all</button>
        )}
      </div>

      <div className="p-4 space-y-2">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10">
            <ShoppingCart className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm italic">Cart is empty</p>
            <p className="text-xs text-gray-300 mt-1 mb-4">Tap a product to add it</p>
            <button 
              onClick={() => setActiveTab('products')}
              className="px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-primary-500/20 active:scale-95 transition-all md:hidden"
            >
              Add Products
            </button>
          </div>
        ) : (
          cart.map(item => (
            <div key={item.product} className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl space-y-2 border-l-4" style={{ borderLeftColor: item.color || '#3b82f6' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 overflow-hidden flex-shrink-0">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <Package size={16} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{item.name}</p>
                    {item.product?.dimensions && (
                      <span className="text-[9px] font-mono text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                        {item.product.dimensions}
                      </span>
                    )}
                  </div>
                  {(item.isDamaged || item.isWrongProduct) ? (
                    <p className="text-xs font-bold text-red-500 uppercase tracking-tight">Free / Reporting Only</p>
                  ) : (
                    <div className="text-xs text-gray-500">
                      {!hidePrice && (
                        <>
                          <p>Boxes: ₹{item.price.toLocaleString('en-IN')} × {item.quantity}</p>
                          {item.pieces > 0 && (
                            <p>Pieces: ₹{(item.price / (item.pieces_per_box || 1)).toFixed(2)} × {item.pieces}</p>
                          )}
                          <p className="font-semibold text-primary-600 mt-0.5">
                            Total: ₹{( (item.price * item.quantity) + (item.pieces * (item.price / (item.pieces_per_box || 1))) ).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            {item.isSample && <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold uppercase">Sample</span>}
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <div className="flex items-center gap-1 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-0.5">
                    <button onClick={() => updateQty(item.product, -1)} className="p-1 hover:text-primary-600 transition-colors rounded"><Minus className="w-3 h-3" /></button>
                    <span className="text-[10px] w-6 text-center font-bold">{item.quantity} B</span>
                    <button onClick={() => updateQty(item.product, 1)} className="p-1 hover:text-primary-600 transition-colors rounded"><Plus className="w-3 h-3" /></button>
                  </div>
                  {item.pieces_per_box > 1 && (
                    <div className="flex items-center gap-1 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-0.5">
                      <button 
                        onClick={() => {
                          const { setPieces } = useCartStore.getState();
                          setPieces(item.product, item.pieces - 1);
                        }} 
                        className="p-1 hover:text-primary-600 transition-colors rounded"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-[10px] w-6 text-center font-bold">{item.pieces} P</span>
                      <button 
                        onClick={() => {
                          const { setPieces } = useCartStore.getState();
                          setPieces(item.product, item.pieces + 1);
                        }} 
                        className="p-1 hover:text-primary-600 transition-colors rounded"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
                <button onClick={() => removeFromCart(item.product)} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors rounded touch-target">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              {/* Status flags — 4 mutually exclusive options */}
              <div className="grid grid-cols-4 gap-1.5">
                <button 
                  onClick={() => toggleItemFlag(item.product, 'isSelling')}
                  className={`py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                    item.isSelling ? 'bg-primary-50 border-primary-200 text-primary-700 shadow-sm' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-400'
                  }`}
                >
                  Selling
                </button>
                <button 
                  onClick={() => toggleItemFlag(item.product, 'isSample')}
                  className={`py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                    item.isSample ? 'bg-green-50 border-green-200 text-green-600 shadow-sm' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-400'
                  }`}
                >
                  Sample
                </button>
                <button 
                  onClick={() => toggleItemFlag(item.product, 'isDamaged')}
                  className={`py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                    item.isDamaged ? 'bg-red-50 border-red-200 text-red-600 shadow-sm' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-400'
                  }`}
                >
                  Damaged
                </button>
                <button 
                  onClick={() => toggleItemFlag(item.product, 'isWrongProduct')}
                  className={`py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                    item.isWrongProduct ? 'bg-purple-50 border-purple-200 text-purple-600 shadow-sm' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-400'
                  }`}
                >
                  Wrong
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Checkout section */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-700 space-y-4">
        {/* Totals & next button */}
        <div className="pt-1">
          {!hidePrice && (
            <>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-500">Subtotal</span>
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">₹{subtotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
              {!hideTax && taxAmount > 0 && (
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-500">Tax ({taxRate.toFixed(1)}%)</span>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">+ ₹{taxAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-500">Discount ({discountRate.toFixed(1)}%)</span>
                  <span className="text-sm font-medium text-red-600">- ₹{discountAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between items-center mb-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-base font-bold text-gray-900 dark:text-white">Total</span>
                <span className="text-xl font-bold text-primary-600">₹{finalTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
            </>
          )}
          <button 
            onClick={() => setShowCheckoutModal(true)}
            disabled={cart.length === 0}
            className="btn-primary w-full py-4 rounded-2xl text-base font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            Next <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Barcode Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md relative shadow-2xl">
            <button onClick={() => setShowScanner(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Scan Barcode</h3>
            <div id="reader" className="overflow-hidden rounded-xl" />
            <p className="mt-4 text-center text-sm text-gray-500">Position the barcode within the frame to scan</p>
          </div>
        </div>
      )}

      {/* ── DESKTOP LAYOUT (side by side) ──────────────────────────────────── */}
      <div className="hidden lg:flex gap-6">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Sale</h1>
            <p className="text-sm text-gray-500">Select products to add to cart</p>
          </div>
          {productGrid}
        </div>
        <div className="w-[440px] flex flex-col min-h-0">
          <div className="mb-4 invisible"><h1 className="text-2xl font-bold">placeholder</h1></div>
          {cartPanel}
        </div>
      </div>

      {/* ── MOBILE LAYOUT (tab-based) ───────────────────────────────────────── */}
      <div className="lg:hidden flex flex-col">
        {/* Mobile Header: Title + History button */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">New Sale</h1>
            <p className="text-xs text-gray-400">Select products to add to cart</p>
          </div>
          <button
            onClick={() => navigate('/sales')}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-bold transition-all border border-transparent hover:border-primary-200 dark:hover:border-primary-800"
          >
            <History size={14} />
            History
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-4 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${activeTab === 'products' ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
          >
            <Package size={16} /> Products
          </button>
          <button
            onClick={() => setActiveTab('cart')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all relative ${activeTab === 'cart' ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
          >
            <ShoppingCart size={16} /> Cart
            {cart.length > 0 && (
              <span className="absolute top-1.5 right-6 w-5 h-5 bg-primary-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-h-0 flex flex-col relative">
          {activeTab === 'products' ? productGrid : cartPanel}
          
          {/* Fixed FAB for Mobile Cart - Redirects to Products */}
          {activeTab === 'cart' && (
            <button 
              onClick={() => setActiveTab('products')}
              className="fixed bottom-28 right-6 w-14 h-14 bg-primary-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-primary-700 active:scale-90 transition-all z-[100] border-4 border-white dark:border-gray-900 shadow-primary-500/40"
              title="Add more products"
            >
              <Plus className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      {/* Add Product Confirmation Modal */}
      {showAddConfirm && productToConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-slide-up border border-gray-100 dark:border-gray-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Add to Cart</h3>
              <button onClick={() => setShowAddConfirm(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex items-center gap-4 mb-6 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
              <div className="w-16 h-16 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 overflow-hidden flex-shrink-0">
                {productToConfirm.image ? (
                  <img src={productToConfirm.image} alt={productToConfirm.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Package size={24} />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{productToConfirm.name}</p>
                {!hidePrice && <p className="text-xs text-primary-600 font-semibold">₹{productToConfirm.price.toLocaleString('en-IN')}</p>}
                <p className="text-[10px] text-gray-400 mt-0.5">Stock: {productToConfirm.quantity} {productToConfirm.unit}</p>
              </div>
            </div>

            <div className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Boxes ({productToConfirm.unit})</label>
                  <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 rounded-2xl p-1">
                    <button 
                      onClick={() => setConfirmQty(Math.max(0, confirmQty - 1))}
                      className="w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-900 rounded-xl shadow-sm active:scale-95 transition-all text-gray-600"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input 
                      type="number" 
                      className="w-12 bg-transparent text-center text-lg font-bold text-gray-900 dark:text-white outline-none border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      value={confirmQty}
                      onChange={(e) => setConfirmQty(Math.max(0, parseInt(e.target.value) || 0))}
                    />
                    <button 
                      onClick={() => setConfirmQty(confirmQty + 1)}
                      className="w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-900 rounded-xl shadow-sm active:scale-95 transition-all text-gray-600"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Loose Pieces</label>
                  <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 rounded-2xl p-1">
                    <button 
                      onClick={() => setConfirmPieces(Math.max(0, confirmPieces - 1))}
                      className="w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-900 rounded-xl shadow-sm active:scale-95 transition-all text-gray-600"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input 
                      type="number" 
                      className="w-12 bg-transparent text-center text-lg font-bold text-gray-900 dark:text-white outline-none border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      value={confirmPieces}
                      onChange={(e) => setConfirmPieces(Math.max(0, parseInt(e.target.value) || 0))}
                    />
                    <button 
                      onClick={() => setConfirmPieces(confirmPieces + 1)}
                      className="w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-900 rounded-xl shadow-sm active:scale-95 transition-all text-gray-600"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Inventory Pool</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'isSelling', label: 'Selling', color: 'primary' },
                    { id: 'isSample', label: 'Sample', color: 'green' },
                    { id: 'isDamaged', label: 'Damaged', color: 'red' },
                    { id: 'isWrongProduct', label: 'Wrong', color: 'purple' },
                  ].map(({ id, label, color }) => (
                    <button
                      key={id}
                      onClick={() => setConfirmPool(id)}
                      className={`py-3 rounded-xl text-xs font-bold border-2 transition-all ${
                        confirmPool === id 
                          ? `border-${color}-500 bg-${color}-50 dark:bg-${color}-900/20 text-${color}-700` 
                          : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-400'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleConfirmAdd}
                disabled={(confirmQty <= 0 && confirmPieces <= 0)}
                className="btn-primary w-full py-4 rounded-2xl text-base font-bold shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Addition
              </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Big Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-900 w-full h-full md:h-auto md:max-h-[90vh] md:max-w-5xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900 sticky top-0 z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Complete Sale</h2>
                <p className="text-sm text-gray-500">Review items and enter customer details</p>
              </div>
              <button onClick={() => setShowCheckoutModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"><X className="w-6 h-6" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 lg:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Left Side: Cart Summary */}
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Order Summary</h3>
                  <div className="space-y-3">
                    {cart.map(item => (
                      <div key={item.product} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <div className="w-12 h-12 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 overflow-hidden flex-shrink-0">
                          {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><Package size={20} /></div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{item.name}</p>
                          <div className="flex flex-col">
                            <p className="text-xs text-gray-500">
                              {item.quantity} Boxes × ₹{item.price.toLocaleString('en-IN')}
                            </p>
                            {item.pieces > 0 && (
                              <p className="text-[10px] text-gray-400">
                                {item.pieces} Pieces × ₹{(item.price / (item.pieces_per_box || 1)).toFixed(2)}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs font-black text-primary-600">
                                Total: ₹{( (item.price * item.quantity) + (item.pieces * (item.price / (item.pieces_per_box || 1))) ).toLocaleString('en-IN')}
                              </span>
                              {item.isSample && <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold uppercase">Sample</span>}
                              {(item.isDamaged || item.isWrongProduct) && <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold uppercase">Reporting</span>}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-gray-900 dark:text-white">
                            ₹{( (item.isDamaged || item.isWrongProduct) ? 0 : ((item.price * item.quantity) + (item.pieces * (item.price / (item.pieces_per_box || 1)))) ).toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-6 bg-primary-50 dark:bg-primary-900/10 rounded-2xl space-y-3">
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>Subtotal</span>
                      <span className="font-bold">₹{subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    {taxAmount > 0 && (
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>Tax ({taxRate.toFixed(1)}%)</span>
                        <span className="font-bold">+ ₹{taxAmount.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>Discount ({discountRate.toFixed(1)}%)</span>
                        <span className="font-bold text-red-600">- ₹{discountAmount.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="pt-3 border-t border-primary-200/50 dark:border-primary-800/50 flex justify-between items-center">
                      <span className="text-base font-bold text-primary-700 dark:text-primary-400">Total Amount</span>
                      <span className="text-2xl font-black text-primary-700 dark:text-primary-400">₹{finalTotal.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Taxes & Discounts</h3>
                    {renderTaxDiscountFields()}
                  </div>
                </div>

                {/* Right Side: Customer Details */}
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Customer Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 ml-1">Full Name</label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input type="text" placeholder="e.g. John Doe" className="input pl-11" value={customer.name} onChange={(e) => setCustomer({...customer, name: e.target.value})} />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 ml-1">Phone Number</label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input type="text" placeholder="e.g. 9876543210" className="input pl-11" value={customer.phone} onChange={(e) => setCustomer({...customer, phone: e.target.value})} />
                        </div>
                      </div>
                      <div className="md:col-span-2 space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 ml-1">Company Name (Optional)</label>
                        <input type="text" placeholder="e.g. Acme Corp" className="input" value={customer.companyName} onChange={(e) => setCustomer({...customer, companyName: e.target.value})} />
                      </div>
                      <div className="md:col-span-2 space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 ml-1">Address</label>
                        <textarea placeholder="Full delivery address..." className="input min-h-[80px] py-3 resize-none" value={customer.addressLine} onChange={(e) => setCustomer({...customer, addressLine: e.target.value})} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Driver / Transporter Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 ml-1">Driver Name</label>
                        <input type="text" placeholder="Driver name" className="input" value={transporter.name} onChange={(e) => setTransporter({...transporter, name: e.target.value})} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 ml-1">Driver Mobile</label>
                        <input type="text" placeholder="Mobile number" className="input" value={transporter.mobile} onChange={(e) => setTransporter({...transporter, mobile: e.target.value})} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 ml-1">Vehicle Type</label>
                        <input type="text" placeholder="e.g. Truck, Van" className="input" value={transporter.vehicleType} onChange={(e) => setTransporter({...transporter, vehicleType: e.target.value})} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 ml-1">Vehicle Number</label>
                        <input type="text" placeholder="e.g. AP 01 AB 1234" className="input" value={transporter.vehicleNumber} onChange={(e) => setTransporter({...transporter, vehicleNumber: e.target.value})} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Payment Method</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'cash', label: 'Cash', Icon: Banknote },
                        { id: 'card', label: 'Card', Icon: CreditCard },
                        { id: 'upi', label: 'UPI', Icon: AlertCircle },
                      ].map(({ id, label, Icon }) => (
                        <button
                          key={id}
                          onClick={() => setPaymentMethod(id)}
                          className={`py-4 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all ${
                            paymentMethod === id 
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' 
                              : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-400'
                          }`}
                        >
                          <Icon className="w-6 h-6" />
                          <span className="text-xs font-bold">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 sticky bottom-0">
              <div className="max-w-4xl mx-auto flex gap-4">
                <button 
                  onClick={() => setShowCheckoutModal(false)}
                  className="flex-1 py-4 rounded-2xl text-sm font-bold border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCheckout}
                  disabled={isSubmitting}
                  className="flex-[2] btn-primary py-4 rounded-2xl text-lg font-bold shadow-xl shadow-primary-500/30"
                >
                  {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <><CheckIcon className="w-6 h-6" /> Confirm & Complete Sale</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CheckIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
  );
}
