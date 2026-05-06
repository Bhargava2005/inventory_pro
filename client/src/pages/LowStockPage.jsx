import { useEffect, useState } from 'react';
import { AlertTriangle, Package, Loader2, ArrowUpRight, PlusCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import useProductStore from '../store/productStore.js';

function StockAdjustModal({ product, onClose }) {
  const [value, setValue] = useState('');
  const [type, setType] = useState('add');
  const { adjustStock } = useProductStore();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!value || isNaN(value)) return;
    setLoading(true);
    const result = await adjustStock(product._id, Number(value), type);
    setLoading(false);
    if (result.success) {
      toast.success('Stock updated');
      onClose();
    } else {
      toast.error(result.message || 'Failed to update stock');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm animate-slide-up">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">Restock Product</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Product: <span className="font-medium text-gray-800 dark:text-gray-200">{product.name}</span>
            <br />Current: <span className="font-bold text-gray-900 dark:text-white">{product.quantity} {product.unit}</span>
            {' / '} Min: <span className="font-bold text-yellow-600">{product.minStockLevel} {product.unit}</span>
          </p>
          <div>
            <label className="label">Operation</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="input">
              <option value="add">Add stock</option>
              <option value="set">Set exact value</option>
            </select>
          </div>
          <div>
            <label className="label">Quantity</label>
            <input type="number" value={value} onChange={(e) => setValue(e.target.value)} className="input" placeholder="Enter quantity" min="0" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LowStockPage() {
  const { products, isLoading, fetchProducts, setFilters, filters } = useProductStore();
  const [stockProduct, setStockProduct] = useState(null);

  useEffect(() => {
    setFilters({ status: 'low', search: '', category: 'all' });
  }, []);

  useEffect(() => {
    if (filters.status === 'low') fetchProducts();
  }, [filters]);

  const outOfStock = products.filter((p) => p.quantity === 0);
  const lowStock = products.filter((p) => p.quantity > 0 && p.quantity <= p.minStockLevel);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Low Stock Alerts</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{products.length} product{products.length !== 1 ? 's' : ''} need attention</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : products.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
            <Package className="w-7 h-7 text-green-500" />
          </div>
          <p className="font-semibold text-gray-800 dark:text-gray-200">All stock levels are healthy!</p>
          <p className="text-sm text-gray-400 mt-1">No products are below their minimum stock level.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {outOfStock.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                Out of Stock ({outOfStock.length})
              </h2>
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-red-50 dark:bg-red-900/10 border-b border-red-100 dark:border-red-900/30">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-red-500 uppercase tracking-wider">Product</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-red-500 uppercase tracking-wider hidden sm:table-cell">Category</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-red-500 uppercase tracking-wider">Qty</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-red-500 uppercase tracking-wider">Min Level</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-red-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                      {outOfStock.map((p) => (
                        <tr key={p._id} className="hover:bg-red-50/50 dark:hover:bg-red-900/10 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900 dark:text-white">{p.name}</p>
                            <p className="text-xs text-gray-400 font-mono">{p.sku}</p>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            {p.category ? <span className="badge badge-blue">{p.category.name}</span> : <span className="text-gray-400 text-xs">—</span>}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-red-600 dark:text-red-400">{p.quantity}</td>
                          <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">{p.minStockLevel}</td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => setStockProduct(p)} className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline">
                              <PlusCircle className="w-3.5 h-3.5" /> Restock
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {lowStock.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />
                Low Stock ({lowStock.length})
              </h2>
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-yellow-50 dark:bg-yellow-900/10 border-b border-yellow-100 dark:border-yellow-900/30">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-yellow-600 uppercase tracking-wider">Product</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-yellow-600 uppercase tracking-wider hidden sm:table-cell">Category</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-yellow-600 uppercase tracking-wider">Qty</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-yellow-600 uppercase tracking-wider">Min Level</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-yellow-600 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                      {lowStock.map((p) => (
                        <tr key={p._id} className="hover:bg-yellow-50/50 dark:hover:bg-yellow-900/10 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900 dark:text-white">{p.name}</p>
                            <p className="text-xs text-gray-400 font-mono">{p.sku}</p>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            {p.category ? <span className="badge badge-blue">{p.category.name}</span> : <span className="text-gray-400 text-xs">—</span>}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-yellow-600 dark:text-yellow-400">{p.quantity}</td>
                          <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">{p.minStockLevel}</td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => setStockProduct(p)} className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline">
                              <PlusCircle className="w-3.5 h-3.5" /> Restock
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {stockProduct && <StockAdjustModal product={stockProduct} onClose={() => setStockProduct(null)} />}
    </div>
  );
}
