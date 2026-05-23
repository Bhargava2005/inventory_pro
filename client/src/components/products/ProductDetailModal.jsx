import { X, Download, Package, Tag, Info, AlertTriangle, ShieldCheck, History, Calendar, User, ShoppingCart, DollarSign, Layers, Weight, ShieldAlert, Boxes, Scale } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import useAuthStore from '../../store/authStore.js';
import useSettingsStore from '../../store/settingsStore.js';
import toast from 'react-hot-toast';

export default function ProductDetailModal({ product, onClose }) {
  const { user } = useAuthStore();
  const { settings } = useSettingsStore();
  
  if (!product) return null;

  const isStaff = user?.role === 'staff';
  const hidePrice = isStaff && settings?.privacy?.hideStaffPriceDetails;

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFillColor(79, 70, 229); // Indigo-600
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text('Product Specification', 15, 20);
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 15, 30);
      
      // Product Name & SKU
      doc.setTextColor(31, 41, 55);
      doc.setFontSize(16);
      doc.text(product.name, 15, 55);
      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128);
      doc.text(`SKU: ${product.sku || 'N/A'}`, 15, 62);

      // Details Table
      autoTable(doc, {
        startY: 70,
        head: [['Attribute', 'Details']],
        body: [
          ['Category', product.category?.name || 'Uncategorized'],
          ...(!hidePrice ? [
            ['Price', `Rs. ${product.price?.toLocaleString('en-IN')}`],
            ['Cost Price', `Rs. ${product.costPrice?.toLocaleString('en-IN')}`]
          ] : []),
          ['Stock Level', `${product.quantity} ${product.unit}`],
          ...(product.unit?.toLowerCase() !== 'bag' ? [
            ['Pieces/Box', product.pieces_per_box || 1],
            ['Loose Pieces', product.ava_pieces || 0],
          ] : []),
          ['Unit Weight', `${product.weight_of_unit || 0} KG`],
          ['Measurements', product.measurements || 'N/A'],
          ['Stock Status', product.stockStatus?.toUpperCase()],
          ['Damaged Stock', product.damagedStock || 0],
          ['Sample Stock', product.sampleStock || 0],
          ['Supplier', product.supplier || 'N/A'],
          ['Created By', product.createdBy?.fullName || 'N/A'],
          ['Created Date', new Date(product.createdAt).toLocaleDateString('en-IN')],
        ],
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229], fontStyle: 'bold' },
        columnStyles: { 0: { cellWidth: 50, fontStyle: 'bold' } },
        margin: { left: 15, right: 15 }
      });

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text(`Inventory Pro - Page ${i} of ${pageCount}`, 15, 285);
      }

      doc.save(`${product.name.replace(/\s+/g, '_')}_details.pdf`);
      toast.success('Product details downloaded');
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate PDF');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div 
          className="px-6 py-8 flex items-center justify-between text-white relative overflow-hidden"
          style={{ 
            background: `linear-gradient(135deg, ${product.color || '#4f46e5'} 0%, ${product.color ? product.color + 'dd' : '#4338ca'} 100%)` 
          }}
        >
          {/* Decorative Background Pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          <div className="flex items-center gap-4 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg">
              {product.image ? (
                <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <Package className="w-8 h-8" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-black leading-tight tracking-tight">{product.name}</h2>
              <p className="text-white/80 text-xs font-mono uppercase tracking-[0.2em]">{product.sku || 'No SKU'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleDownloadPDF}
              className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 transition-colors text-white"
              title="Download PDF"
            >
              <Download className="w-5 h-5" />
            </button>
            <button 
              onClick={onClose}
              className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 transition-colors text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Main Visual Section */}
          {product.image && (
            <div className="mb-8 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-xl group relative">
              <img src={product.image} alt={product.name} className="w-full h-64 object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                <p className="text-white text-sm font-medium">Product Visual Identification</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Basic Info */}
            <div className="space-y-6">
              <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary-500" /> Basic Information
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                      <Tag className="w-4 h-4" /> <span className="text-sm font-bold uppercase tracking-tight">Category</span>
                    </div>
                    <span className="text-sm font-black text-primary-600 bg-primary-50 dark:bg-primary-900/20 px-3 py-1 rounded-lg border border-primary-100 dark:border-primary-900/30">
                      {product.category?.name || 'Uncategorized'}
                    </span>
                  </div>
                  {!hidePrice && (
                    <>
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50/30 dark:bg-emerald-900/10 border border-emerald-100/50 dark:border-emerald-900/20">
                        <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                          <DollarSign className="w-4 h-4" /> <span className="text-sm font-bold uppercase tracking-tight">Selling Price</span>
                        </div>
                        <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                          ₹{product.price?.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                          <Scale className="w-4 h-4" /> <span className="text-sm font-bold uppercase tracking-tight">Cost Price</span>
                        </div>
                        <span className="text-sm font-black text-gray-900 dark:text-white">
                          ₹{product.costPrice?.toLocaleString('en-IN') || '0'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </section>
              
              <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4" /> Packaging & Measurements
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {product.unit?.toLowerCase() !== 'bag' && (
                    <div className="p-3 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20">
                      <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase mb-1">Pieces / Box</p>
                      <p className="text-lg font-black text-blue-900 dark:text-blue-100">{product.pieces_per_box || 1}</p>
                    </div>
                  )}
                  <div className="p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase mb-1">Unit Weight</p>
                    <p className="text-lg font-black text-amber-900 dark:text-amber-100">{product.weight_of_unit || 0} <span className="text-xs font-bold">KG</span></p>
                  </div>
                  <div className={`p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:indigo-900/20 ${product.unit?.toLowerCase() === 'bag' ? 'col-span-2' : ''}`}>
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase mb-1">Measurements</p>
                    <p className="text-sm font-black text-indigo-900 dark:text-indigo-100">{product.measurements || 'N/A'}</p>
                  </div>
                  {product.unit?.toLowerCase() !== 'bag' && (
                    <div className="p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-900/10 border border-slate-100 dark:border-slate-900/20">
                      <p className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase mb-1">Loose Pieces</p>
                      <p className="text-sm font-black text-slate-900 dark:text-slate-100">{product.ava_pieces || 0} PCS</p>
                    </div>
                  )}
                </div>
              </section>

              <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" /> Tracking
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Supplier</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{product.supplier || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Added By</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{product.createdBy?.fullName || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Added On</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{new Date(product.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: Inventory Info */}
            <div className="space-y-6">
              <section className="p-5 rounded-3xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
                   <ShoppingCart className="w-16 h-16" />
                </div>
                
                <div className="mb-4">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Brand</p>
                  <p className="font-bold text-gray-900 dark:text-white">{product.brand || '—'}</p>
                </div>
                
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Inventory Status
                </h3>
                <div className="space-y-5">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-black text-gray-900 dark:text-white">{product.quantity}</p>
                      <p className="text-xs font-bold text-gray-400 uppercase">{product.unit}</p>
                    </div>
                    <div className="text-right">
                       <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                         product.stockStatus === 'ok' ? 'bg-emerald-100 text-emerald-700' : 
                         product.stockStatus === 'low' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                       }`}>
                         {product.stockStatus === 'ok' ? 'In Stock' : product.stockStatus === 'low' ? 'Low Stock' : 'Out of Stock'}
                       </span>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-500" /> Threshold
                      </p>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">{product.minStockLevel} {product.unit}</p>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                       <div 
                         className={`h-full transition-all duration-1000 ${
                           product.quantity <= product.minStockLevel ? 'bg-amber-500' : 'bg-primary-500'
                         }`}
                         style={{ width: `${Math.min(100, (product.quantity / (product.minStockLevel * 2)) * 100)}%` }}
                       />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2 italic">Low stock alert triggers at {product.minStockLevel} {product.unit}</p>
                  </div>
                </div>
              </section>
              
              <section className="p-5 rounded-3xl bg-red-50/30 dark:bg-red-900/10 border border-red-100/50 dark:border-red-900/20">
                <h3 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" /> Stock Quality Breakdown
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Damaged</p>
                    <p className={`text-sm font-bold ${product.damagedStock > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                      {product.damagedStock || 0} {product.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Sample</p>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                      {product.sampleStock || 0} {product.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Exchanged</p>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                      {product.exchangedStock || 0} {product.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Wrong Item</p>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                      {product.wrongProductStock || 0} {product.unit}
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <History className="w-4 h-4" /> Description
                </h3>
                <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 leading-relaxed shadow-sm">
                  {product.description || 'No detailed description provided for this product.'}
                </div>
              </section>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
