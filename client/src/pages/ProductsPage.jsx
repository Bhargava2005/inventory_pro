import { useEffect, useState } from 'react';
import {
  Plus, Search, Filter, Pencil, Trash2, Package,
  ChevronLeft, ChevronRight, Loader2, AlertTriangle,
  MinusCircle, PlusCircle, X, Download,
} from 'lucide-react';
import toast from 'react-hot-toast';
import useProductStore from '../store/productStore.js';
import useAuthStore from '../store/authStore.js';
import ProductModal from '../components/products/ProductModal.jsx';

const statusColors = {
  ok: 'badge-green',
  low: 'badge-yellow',
  out: 'badge-red',
};
const statusLabels = { ok: 'In Stock', low: 'Low Stock', out: 'Out of Stock' };

function StockAdjustModal({ product, onClose }) {
  const [value, setValue] = useState('');
  const [type, setType] = useState('set');
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
          <h2 className="font-semibold text-gray-900 dark:text-white">Adjust Stock</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Product: <span className="font-medium text-gray-800 dark:text-gray-200">{product.name}</span></p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Current stock: <span className="font-bold text-gray-900 dark:text-white">{product.quantity} {product.unit}</span></p>
          </div>
          <div>
            <label className="label">Operation</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="input">
              <option value="set">Set to exact value</option>
              <option value="add">Add to current stock</option>
              <option value="subtract">Subtract from current stock</option>
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

function DeleteConfirm({ product, onClose }) {
  const { deleteProduct } = useProductStore();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    const result = await deleteProduct(product._id);
    setLoading(false);
    if (result.success) {
      toast.success('Product deleted');
      onClose();
    } else {
      toast.error(result.message || 'Failed to delete');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm animate-slide-up p-6">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 mx-auto mb-4">
          <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-center font-semibold text-gray-900 dark:text-white mb-1">Delete Product</h2>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-5">
          Are you sure you want to delete <span className="font-medium text-gray-800 dark:text-gray-200">"{product.name}"</span>? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleDelete} disabled={loading} className="btn-danger flex-1">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const {
    products, total, totalPages, page, isLoading, filters,
    fetchProducts, fetchCategories, setFilters, setPage, categories,
  } = useProductStore();
  const { user } = useAuthStore();

  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [stockProduct, setStockProduct] = useState(null);
  const [deleteProduct, setDeleteProductState] = useState(null);

  const canEdit = ['admin', 'manager'].includes(user?.role);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [filters, page]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{total} products total</p>
        </div>
        <div className="flex gap-2">
          <a 
            href="http://localhost:5000/api/reports/inventory/export" 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            <Download className="w-4 h-4" /> Export Excel
          </a>
          {canEdit && (
            <button onClick={() => { setEditProduct(null); setShowModal(true); }} className="btn-primary">
              <Plus className="w-4 h-4" /> Add Product
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, SKU, supplier..."
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            className="input pl-9"
          />
        </div>
        <select value={filters.category} onChange={(e) => setFilters({ category: e.target.value })} className="input sm:w-44">
          <option value="all">All Categories</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <select value={filters.sort} onChange={(e) => setFilters({ sort: e.target.value })} className="input sm:w-44">
          <option value="-createdAt">Newest First</option>
          <option value="createdAt">Oldest First</option>
          <option value="name">Name A-Z</option>
          <option value="-name">Name Z-A</option>
          <option value="quantity">Qty Low-High</option>
          <option value="-quantity">Qty High-Low</option>
          <option value="-price">Price High-Low</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Package className="w-12 h-12 text-gray-300 dark:text-gray-700 mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No products found</p>
            <p className="text-sm text-gray-400 dark:text-gray-600 mt-1">Try adjusting your search or add a new product.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">SKU</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Category</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Stock</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {products.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white">{p.name}</p>
                      {p.supplier && <p className="text-xs text-gray-400">{p.supplier}</p>}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-gray-500 dark:text-gray-400 font-mono text-xs">{p.sku}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {p.category ? (
                        <span className="badge badge-blue">{p.category.name}</span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">₹{p.price.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">{p.quantity} <span className="text-xs text-gray-400">{p.unit}</span></td>
                    <td className="px-4 py-3 text-center">
                      <span className={`badge ${statusColors[p.stockStatus]}`}>{statusLabels[p.stockStatus]}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setStockProduct(p)}
                          title="Adjust stock"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                        >
                          <PlusCircle className="w-4 h-4" />
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => { setEditProduct(p); setShowModal(true); }}
                            title="Edit"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => setDeleteProductState(p)}
                            title="Delete"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(page - 1)} disabled={page === 1} className="btn-secondary py-2 px-3 disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className="btn-secondary py-2 px-3 disabled:opacity-40">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <ProductModal
          product={editProduct}
          onClose={() => { setShowModal(false); setEditProduct(null); }}
          onSaved={() => toast.success(editProduct ? 'Product updated!' : 'Product created!')}
        />
      )}
      {stockProduct && <StockAdjustModal product={stockProduct} onClose={() => setStockProduct(null)} />}
      {deleteProduct && <DeleteConfirm product={deleteProduct} onClose={() => setDeleteProductState(null)} />}
    </div>
  );
}
