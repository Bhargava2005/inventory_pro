import { useEffect, useState, useMemo } from 'react';
import { 
  Search, ShoppingCart, Trash2, Plus, Minus, 
  CreditCard, Banknote, User, Phone, X, Loader2, AlertCircle, Scan,
  Package, Filter, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Html5QrcodeScanner } from 'html5-qrcode';
import useProductStore from '../store/productStore.js';
import useSaleStore from '../store/saleStore.js';
import useSettingsStore from '../store/settingsStore.js';
import { generateInvoicePDF } from '../utils/pdfGenerator.js';
import { fuzzyMatch } from '../utils/searchUtils.js';

export default function NewSalePage() {
  const { products, fetchProducts, isLoading } = useProductStore();
  const { processSale, isSubmitting } = useSaleStore();
  const { settings, fetchSettings } = useSettingsStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({ name: '', phone: '', companyName: '', addressLine: '' });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showScanner, setShowScanner] = useState(false);
  // Mobile tab state: 'products' | 'cart'
  const [activeTab, setActiveTab] = useState('products');
  
  // Filter States
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });

  // Extract unique categories and brands dynamically
  const { categories, brands } = useMemo(() => {
    const cats = new Set();
    const brnds = new Set();
    products.forEach(p => {
      if (p.category?.name) cats.add(p.category.name);
      if (p.brand) brnds.add(p.brand);
    });
    return { categories: Array.from(cats).sort(), brands: Array.from(brnds).sort() };
  }, [products]);

  useEffect(() => {
    fetchProducts();
    if (!settings) fetchSettings();
  }, []);

  useEffect(() => {
    if (showScanner) {
      const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
      scanner.render((decodedText) => {
        const product = products.find(p => p.sku === decodedText);
        if (product) {
          addToCart(product);
          toast.success(`Added ${product.name}`);
          setShowScanner(false);
          scanner.clear();
        } else {
          toast.error("Product not found");
        }
      }, () => {});

      return () => scanner.clear();
    }
  }, [showScanner, products]);

  const filteredProducts = useMemo(() => {
    // Fuzzy matching for illiterate users or typos: 
    // Uses subsequence matching and Levenshtein distance
    const tokens = searchTerm.trim().toLowerCase().split(/\s+/).filter(Boolean);
    
    return products.filter(p => {
      const matchesSearch = tokens.length === 0 || tokens.every(token =>
        fuzzyMatch(p.name, token) ||
        fuzzyMatch(p.sku, token) ||
        fuzzyMatch(p.brand, token) ||
        fuzzyMatch(p.supplier, token) ||
        fuzzyMatch(p.category?.name, token)
      );
      const matchesCategory = selectedCategory === 'all' || p.category?.name === selectedCategory;
      const matchesBrand = selectedBrand === 'all' || p.brand === selectedBrand;
      const price = p.price || 0;
      const matchesMinPrice = priceRange.min === '' || price >= Number(priceRange.min);
      const matchesMaxPrice = priceRange.max === '' || price <= Number(priceRange.max);
      return matchesSearch && matchesCategory && matchesBrand && matchesMinPrice && matchesMaxPrice;
    });
  }, [products, searchTerm, selectedCategory, selectedBrand, priceRange]);

  const addToCart = (product) => {
    if (product.quantity <= 0) { toast.error('Product out of stock'); return; }
    const existing = cart.find(item => item.product === product._id);
    if (existing) {
      if (existing.quantity >= product.quantity) { toast.error('Insufficient stock available'); return; }
      setCart(cart.map(item => item.product === product._id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { 
        product: product._id, 
        name: product.name, 
        brand: product.brand,
        price: product.price, 
        image: product.image,
        color: product.color,
        quantity: 1, 
        maxQty: product.quantity,
        isSelling: true,  // default — explicit selling selection
        isDamaged: false,
        isSample: false,
        isWrongProduct: false
      }]);
    }
  };

  // Mutually exclusive flag toggle across all 4 states (selling/sample/damaged/wrongProduct)
  const toggleItemFlag = (id, flag) => {
    setCart(cart.map(item => {
      if (item.product === id) {
        return { 
          ...item, 
          isSelling: flag === 'isSelling',
          isDamaged: flag === 'isDamaged',
          isSample: flag === 'isSample',
          isWrongProduct: flag === 'isWrongProduct',
        };
      }
      return item;
    }));
  };

  const updateQty = (id, delta) => {
    setCart(cart.map(item => {
      if (item.product === id) {
        const newQty = Math.max(1, Math.min(item.maxQty, item.quantity + delta));
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id) => setCart(cart.filter(item => item.product !== id));

  const subtotal = cart.reduce((acc, item) => {
    // Damaged and WrongProduct are free/reporting-only; Selling and Sample are charged
    if (item.isDamaged || item.isWrongProduct) return acc;
    return acc + (item.price * item.quantity);
  }, 0);

  const defaultTaxRate = settings?.sales?.defaultTax || 0;
  const taxAmount = (subtotal * defaultTaxRate) / 100;
  const finalTotal = subtotal + taxAmount;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    // Strip isSelling before sending — backend doesn't need it (it's the default state)
    const itemsForBackend = cart.map(({ isSelling, ...rest }) => rest);
    const result = await processSale({ items: itemsForBackend, customer, paymentMethod, tax: taxAmount });
    if (result.success) {
      toast.success('Sale completed! Invoice: ' + result.data.invoiceNumber);
      generateInvoicePDF(result.data);
      setCart([]);
      setCustomer({ name: '', phone: '', companyName: '', addressLine: '' });
      setActiveTab('products');
      fetchProducts();
    } else {
      toast.error(result.message);
    }
  };

  // ─── Product Grid ─────────────────────────────────────────────────────────
  // ─── Product Grid ─────────────────────────────────────────────────────────
  const productGrid = (
    <div className="card flex-1 flex flex-col min-h-0 overflow-hidden p-4">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input 
          type="text" 
          placeholder="Search by name or SKU..." 
          className="input pl-10 pr-24"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
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
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 animate-slide-down grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Category</label>
            <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="w-full text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Brand</label>
            <select value={selectedBrand} onChange={e => setSelectedBrand(e.target.value)} className="w-full text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
              <option value="all">All Brands</option>
              {brands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="md:col-span-2 flex items-end gap-2">
            <div className="flex-1 flex gap-2">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Min Price</label>
                <input type="number" min="0" placeholder="₹ Min" value={priceRange.min} onChange={e => setPriceRange(prev => ({...prev, min: e.target.value}))} className="w-full text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Max Price</label>
                <input type="number" min="0" placeholder="₹ Max" value={priceRange.max} onChange={e => setPriceRange(prev => ({...prev, max: e.target.value}))} className="w-full text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
              </div>
            </div>
            <button 
              onClick={() => { setSelectedCategory('all'); setSelectedBrand('all'); setPriceRange({min: '', max: ''}); }}
              className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center"
              title="Reset Filters"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 pr-1">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>
        ) : filteredProducts.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
            <Package className="w-10 h-10 mb-2 opacity-30" />
            <p className="italic text-sm">No products found</p>
          </div>
        ) : (
          filteredProducts.map(p => (
            <button 
              key={p._id}
              onClick={() => { addToCart(p); setActiveTab('cart'); }}
              disabled={p.quantity <= 0}
              className={`group flex flex-col rounded-2xl border text-left transition-all hover:shadow-xl active:scale-95 overflow-hidden ${
                p.quantity <= 0 
                  ? 'bg-gray-50 dark:bg-gray-800/30 border-gray-100 dark:border-gray-700 opacity-50 cursor-not-allowed' 
                  : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-primary-400'
              }`}
            >
              {/* Product Image */}
              <div className="relative h-28 w-full bg-gray-100 dark:bg-gray-900 overflow-hidden">
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

              <div className="p-3 flex-1 flex flex-col border-t-4" style={{ borderTopColor: p.color || '#3b82f6' }}>
                <p className="text-[9px] text-gray-400 font-mono mb-0.5 truncate uppercase tracking-tighter">{p.sku} • {p.brand || 'General'}</p>
                <p className="text-xs font-bold text-gray-800 dark:text-gray-100 line-clamp-1 mb-2 leading-tight">{p.name}</p>
                
                <div className="flex items-center justify-between mt-auto">
                  <p className="text-primary-600 dark:text-primary-400 font-black text-sm">₹{p.price.toLocaleString('en-IN')}</p>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-lg font-bold ${p.quantity <= 5 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                    {p.quantity} {p.unit}
                  </span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );

  // ─── Cart Panel ───────────────────────────────────────────────────────────
  const cartPanel = (
    <div className="card flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <h2 className="font-bold flex items-center gap-2 text-gray-900 dark:text-white">
          <ShoppingCart className="w-5 h-5 text-primary-600" />
          Cart ({cart.length} items)
        </h2>
        {cart.length > 0 && (
          <button onClick={() => setCart([])} className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors">Clear all</button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10">
            <ShoppingCart className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm italic">Cart is empty</p>
            <p className="text-xs text-gray-300 mt-1">Tap a product to add it</p>
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
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{item.name}</p>
                  {(item.isDamaged || item.isWrongProduct) ? (
                    <p className="text-xs font-bold text-red-500 uppercase tracking-tight">Free / Reporting Only</p>
                  ) : (
                    <p className="text-xs text-gray-500">
                      ₹{item.price.toLocaleString('en-IN')} × {item.quantity} = <span className="font-semibold text-primary-600">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                      {item.isSample && <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold uppercase">Sample</span>}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-0.5">
                  <button onClick={() => updateQty(item.product, -1)} className="p-1.5 hover:text-primary-600 transition-colors rounded touch-target"><Minus className="w-3.5 h-3.5" /></button>
                  <span className="text-xs w-6 text-center font-bold">{item.quantity}</span>
                  <button onClick={() => updateQty(item.product, 1)} className="p-1.5 hover:text-primary-600 transition-colors rounded touch-target"><Plus className="w-3.5 h-3.5" /></button>
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
      <div className="p-4 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-700 space-y-3">
        {/* Customer inputs */}
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input type="text" placeholder="Customer name" className="input pl-9 text-xs py-2" value={customer.name} onChange={(e) => setCustomer({...customer, name: e.target.value})} />
          </div>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input type="text" placeholder="Phone" className="input pl-9 text-xs py-2" value={customer.phone} onChange={(e) => setCustomer({...customer, phone: e.target.value})} />
          </div>
          <div className="relative col-span-2">
            <input type="text" placeholder="Company name (optional)" className="input text-xs py-2" value={customer.companyName} onChange={(e) => setCustomer({...customer, companyName: e.target.value})} />
          </div>
          <div className="relative col-span-2">
            <input type="text" placeholder="Address line (optional)" className="input text-xs py-2" value={customer.addressLine} onChange={(e) => setCustomer({...customer, addressLine: e.target.value})} />
          </div>
        </div>

        {/* Payment method */}
        <div className="flex gap-2">
          {[
            { id: 'cash', label: 'Cash', Icon: Banknote },
            { id: 'card', label: 'Card', Icon: CreditCard },
            { id: 'upi', label: 'UPI', Icon: AlertCircle },
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setPaymentMethod(id)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border-2 transition-all ${paymentMethod === id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-500'}`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* Totals & checkout button */}
        <div className="pt-1">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-500">Subtotal</span>
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">₹{subtotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
          </div>
          {taxAmount > 0 && (
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-500">Tax ({defaultTaxRate}%)</span>
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">+ ₹{taxAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
          )}
          <div className="flex justify-between items-center mb-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <span className="text-base font-bold text-gray-900 dark:text-white">Total</span>
            <span className="text-xl font-bold text-primary-600">₹{finalTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
          </div>
          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0 || isSubmitting}
            className="btn-primary w-full py-4 rounded-2xl text-base font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckIcon className="w-5 h-5" /> Complete Sale</>}
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
      <div className="hidden lg:flex gap-6 h-[calc(100vh-120px)]">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Sale</h1>
            <p className="text-sm text-gray-500">Select products to add to cart</p>
          </div>
          {productGrid}
        </div>
        <div className="w-96 flex flex-col min-h-0">
          <div className="mb-4 invisible"><h1 className="text-2xl font-bold">placeholder</h1></div>
          {cartPanel}
        </div>
      </div>

      {/* ── MOBILE LAYOUT (tab-based) ───────────────────────────────────────── */}
      <div className="lg:hidden flex flex-col h-[calc(100dvh-8rem)]">
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
        <div className="flex-1 min-h-0 flex flex-col">
          {activeTab === 'products' ? productGrid : cartPanel}
        </div>
      </div>
    </>
  );
}

function CheckIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
  );
}
