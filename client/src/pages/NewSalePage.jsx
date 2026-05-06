import { useEffect, useState } from 'react';
import { 
  Search, ShoppingCart, Trash2, Plus, Minus, 
  CreditCard, Banknote, User, Phone, X, Loader2, AlertCircle, Scan 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Html5QrcodeScanner } from 'html5-qrcode';
import useProductStore from '../store/productStore.js';
import useSaleStore from '../store/saleStore.js';
import { generateInvoicePDF } from '../utils/pdfGenerator.js';

export default function NewSalePage() {
  const { products, fetchProducts, isLoading } = useProductStore();
  const { processSale, isSubmitting } = useSaleStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({ name: '', phone: '' });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    fetchProducts();
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
      }, (error) => {
        // console.warn(error);
      });

      return () => scanner.clear();
    }
  }, [showScanner, products]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product) => {
    if (product.quantity <= 0) {
      toast.error('Product out of stock');
      return;
    }
    
    const existing = cart.find(item => item.product === product._id);
    if (existing) {
      if (existing.quantity >= product.quantity) {
        toast.error('Insufficient stock available');
        return;
      }
      setCart(cart.map(item => 
        item.product === product._id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      setCart([...cart, { 
        product: product._id, 
        name: product.name, 
        price: product.price, 
        quantity: 1,
        maxQty: product.quantity
      }]);
    }
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

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.product !== id));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    const result = await processSale({
      items: cart,
      customer,
      paymentMethod,
    });

    if (result.success) {
      toast.success('Sale completed! Invoice: ' + result.data.invoiceNumber);
      generateInvoicePDF(result.data); // Auto-download PDF
      setCart([]);
      setCustomer({ name: '', phone: '' });
      fetchProducts(); // Refresh stock
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-120px)]">
      {/* Product Selection Section */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Sale</h1>
          <p className="text-sm text-gray-500">Select products to add to cart</p>
        </div>

        <div className="card flex-1 flex flex-col min-h-0 overflow-hidden p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search product by name or SKU..." 
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button 
              onClick={() => setShowScanner(true)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-primary-100 text-primary-600 rounded-lg hover:bg-primary-200"
              title="Scan Barcode"
            >
              <Scan className="w-4 h-4" />
            </button>
          </div>

          {showScanner && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md relative">
                <button onClick={() => setShowScanner(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
                <h3 className="text-lg font-bold mb-4">Scan Barcode</h3>
                <div id="reader" className="overflow-hidden rounded-xl"></div>
                <p className="mt-4 text-center text-sm text-gray-500">Position the barcode within the box to scan</p>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 pr-1">
            {isLoading ? (
              <div className="col-span-full flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>
            ) : filteredProducts.length === 0 ? (
              <div className="col-span-full text-center py-20 text-gray-400 italic">No products found</div>
            ) : (
              filteredProducts.map(p => (
                <button 
                  key={p._id}
                  onClick={() => addToCart(p)}
                  disabled={p.quantity <= 0}
                  className={`p-3 rounded-xl border text-left transition-all hover:shadow-md ${
                    p.quantity <= 0 
                      ? 'bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed' 
                      : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-primary-500'
                  }`}
                >
                  <p className="text-xs text-gray-400 font-mono mb-1">{p.sku}</p>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-100 line-clamp-1 mb-1">{p.name}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <p className="text-primary-600 font-bold">₹{p.price}</p>
                    <p className={`text-[10px] px-1.5 py-0.5 rounded-full ${p.quantity <= 5 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                      {p.quantity} {p.unit}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Cart & Checkout Section */}
      <div className="w-full lg:w-96 flex flex-col min-h-0">
        <div className="card flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="p-4 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
            <h2 className="font-bold flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary-600" />
              Cart ({cart.length})
            </h2>
            <button onClick={() => setCart([])} className="text-xs text-red-500 hover:underline">Clear all</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <ShoppingCart className="w-12 h-12 mb-2 opacity-20" />
                <p className="text-sm italic">Cart is empty</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.product} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">₹{item.price} x {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700 p-0.5">
                    <button onClick={() => updateQty(item.product, -1)} className="p-1 hover:text-primary-600"><Minus className="w-3.5 h-3.5" /></button>
                    <span className="text-xs w-6 text-center font-bold">{item.quantity}</span>
                    <button onClick={() => updateQty(item.product, 1)} className="p-1 hover:text-primary-600"><Plus className="w-3.5 h-3.5" /></button>
                  </div>
                  <button onClick={() => removeFromCart(item.product)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-700 space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Customer Name" 
                  className="input input-sm pl-9"
                  value={customer.name}
                  onChange={(e) => setCustomer({...customer, name: e.target.value})}
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Phone Number" 
                  className="input input-sm pl-9"
                  value={customer.phone}
                  onChange={(e) => setCustomer({...customer, phone: e.target.value})}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => setPaymentMethod('cash')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition-all ${paymentMethod === 'cash' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 bg-white'}`}
              >
                <Banknote className="w-4 h-4" /> Cash
              </button>
              <button 
                onClick={() => setPaymentMethod('card')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition-all ${paymentMethod === 'card' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 bg-white'}`}
              >
                <CreditCard className="w-4 h-4" /> Card
              </button>
              <button 
                onClick={() => setPaymentMethod('upi')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition-all ${paymentMethod === 'upi' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 bg-white'}`}
              >
                <AlertCircle className="w-4 h-4" /> UPI
              </button>
            </div>

            <div className="pt-2">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-500">Subtotal</span>
                <span className="text-sm font-medium">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-4">
                <span className="text-lg font-bold">Total</span>
                <span className="text-lg font-bold text-primary-600">₹{subtotal.toFixed(2)}</span>
              </div>
              <button 
                onClick={handleCheckout}
                disabled={cart.length === 0 || isSubmitting}
                className="btn-primary w-full py-4 rounded-2xl flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Complete Sale <Check className="w-5 h-5" /></>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Check(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
  )
}
