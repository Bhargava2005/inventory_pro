import { useState } from 'react';
import { X, Download, User, Calendar, MapPin, CreditCard, ShoppingBag, AlertTriangle, RefreshCw, Box, Gift, FileText, Smartphone, Loader2, Edit3, Check, MessageSquare, History, Package } from 'lucide-react';
import { generateInvoicePDF } from '../../utils/pdfGenerator.js';
import useSaleStore from '../../store/saleStore.js';
import useAuthStore from '../../store/authStore.js';
import toast from 'react-hot-toast';

export default function SaleDetailsModal({ sale: initialSale, onClose }) {
  const { updateSaleItem, isSubmitting } = useSaleStore();
  const { user } = useAuthStore();
  const [sale, setSale] = useState(initialSale);
  const [isDownloading, setIsDownloading] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // { id, ...data }
  const [viewingHistory, setViewingHistory] = useState(null); // itemId

  const isPrivileged = ['admin', 'manager'].includes(user?.role);
  const soldById = typeof sale.soldBy === 'string' ? sale.soldBy : sale.soldBy?._id;
  const isOwner = soldById === user?.id;
  
  if (!sale) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleUpdateStatus = async (itemId) => {
    const res = await updateSaleItem(sale._id, itemId, editingItem.data);
    if (res.success) {
      setSale(res.data);
      setEditingItem(null);
      toast.success('Item status updated');
    } else {
      toast.error(res.message);
    }
  };
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative border border-gray-100 dark:border-gray-800">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-2xl flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{sale.invoiceNumber}</h2>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Transaction Details</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={async () => {
                try {
                  setIsDownloading(true);
                  await generateInvoicePDF(sale);
                } catch (error) {
                  console.error('Download failed:', error);
                  toast.error('Failed to generate PDF');
                } finally {
                  setIsDownloading(false);
                }
              }}
              disabled={isDownloading}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 dark:shadow-none disabled:opacity-50"
            >
              {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {isDownloading ? 'Downloading...' : 'Download'}
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
          
          {/* Top Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <User className="w-3 h-3 text-primary-500" /> Customer Information
              </h3>
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700">
                <p className="font-bold text-gray-900 dark:text-white">{sale.customer?.name || 'Walk-in Customer'}</p>
                {sale.customer?.phone ? (
                  <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                    <Smartphone className="w-3.5 h-3.5" /> {sale.customer.phone}
                  </p>
                ) : (
                  <p className="text-xs italic text-gray-400 mt-1">No phone provided</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <MapPin className="w-3 h-3 text-red-500" /> Store & Staff
              </h3>
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700">
                <p className="text-sm font-bold text-gray-900 dark:text-white">{sale.storeId?.name || 'Main Branch'}</p>
                <p className="text-xs text-gray-500 mt-1">Sold by: <span className="font-semibold text-primary-600">{sale.soldBy?.fullName || 'System Admin'}</span></p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Calendar className="w-3 h-3 text-amber-500" /> Date & Payment
              </h3>
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700">
                <p className="text-sm font-bold text-gray-900 dark:text-white">{formatDate(sale.createdAt)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs font-bold uppercase text-gray-500">{sale.paymentMethod}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <ShoppingBag className="w-3 h-3 text-indigo-500" /> Order Summary
            </h3>
            <div className="overflow-x-auto border border-gray-100 dark:border-gray-800 rounded-2xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-800">
                    <th className="text-left px-6 py-4 font-bold text-gray-600 dark:text-gray-400 uppercase text-[10px]">Product Details</th>
                    <th className="text-center px-4 py-4 font-bold text-gray-600 dark:text-gray-400 uppercase text-[10px]">Status</th>
                    <th className="text-center px-4 py-4 font-bold text-gray-600 dark:text-gray-400 uppercase text-[10px]">Qty</th>
                    <th className="text-right px-4 py-4 font-bold text-gray-600 dark:text-gray-400 uppercase text-[10px]">Price</th>
                    <th className="text-right px-6 py-4 font-bold text-gray-600 dark:text-gray-400 uppercase text-[10px]">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {sale.items.map((item, idx) => (
                    <tr key={idx} className="bg-white dark:bg-transparent">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 overflow-hidden flex-shrink-0 relative">
                            {item.product?.image ? (
                              <img src={item.product.image} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <Package className="w-6 h-6" />
                              </div>
                            )}
                            <div className="absolute top-1 left-1 w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: item.product?.color || '#3b82f6' }} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 dark:text-white truncate">{item.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-gray-400 font-mono">
                                SKU: {item.product?.sku || (typeof item.product === 'string' ? item.product.slice(-6) : 'N/A')}
                              </span>
                              {(item.product?.category?.name || item.product?.category) && (
                                <span className="text-[10px] text-primary-500 font-medium px-1.5 py-0.5 bg-primary-50 dark:bg-primary-900/20 rounded" style={{ color: item.product?.color, backgroundColor: (item.product?.color || '#3b82f6') + '15' }}>
                                  {item.product?.category?.name || 'General'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {editingItem?.id === item._id ? (
                          <div className="flex flex-col gap-2 p-2 bg-primary-50 dark:bg-primary-900/10 rounded-xl border border-primary-100">
                            <div className="flex flex-wrap justify-center gap-2">
                              {[
                                { id: 'isSample', label: 'Sample', Icon: Gift, color: 'text-green-600' },
                                { id: 'isDamaged', label: 'Damaged', Icon: AlertTriangle, color: 'text-red-600' },
                                { id: 'isWrongProduct', label: 'Wrong', Icon: Box, color: 'text-purple-600' },
                                { id: 'isExchange', label: 'Exchange', Icon: RefreshCw, color: 'text-blue-600' },
                              ].map(flag => (
                                <button
                                  key={flag.id}
                                  onClick={() => setEditingItem({
                                    ...editingItem,
                                    data: {
                                      ...editingItem.data,
                                      isDamaged: flag.id === 'isDamaged' ? !editingItem.data.isDamaged : false,
                                      isSample: flag.id === 'isSample' ? !editingItem.data.isSample : false,
                                      isWrongProduct: flag.id === 'isWrongProduct' ? !editingItem.data.isWrongProduct : false,
                                      isExchange: flag.id === 'isExchange' ? !editingItem.data.isExchange : false,
                                    }
                                  })}
                                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border transition-all ${editingItem.data[flag.id] ? 'bg-white border-primary-300 shadow-sm' : 'border-transparent text-gray-400 opacity-60'}`}
                                >
                                  <flag.Icon className={`w-3 h-3 ${editingItem.data[flag.id] ? flag.color : ''}`} /> {flag.label}
                                </button>
                              ))}
                            </div>
                            <div className="relative">
                              <MessageSquare className="absolute left-2 top-2.5 w-3 h-3 text-gray-400" />
                              <input 
                                type="text" 
                                placeholder="Reason for change..." 
                                className="w-full text-[10px] pl-6 pr-2 py-2 rounded-lg border-gray-200 dark:bg-gray-800"
                                value={editingItem.data.statusReason || ''}
                                onChange={(e) => setEditingItem({...editingItem, data: { ...editingItem.data, statusReason: e.target.value }})}
                              />
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleUpdateStatus(item._id)}
                                disabled={isSubmitting}
                                className="flex-1 bg-primary-600 text-white py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1"
                              >
                                {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Save
                              </button>
                              <button 
                                onClick={() => setEditingItem(null)}
                                className="flex-1 bg-white border border-gray-200 py-1.5 rounded-lg text-[10px] font-bold"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <div className="flex flex-wrap justify-center gap-1">
                              {item.isDamaged && (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
                                  <AlertTriangle className="w-2.5 h-2.5" /> Damaged
                                </span>
                              )}
                              {item.isExchange && (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                                  <RefreshCw className="w-2.5 h-2.5" /> Exchange
                                </span>
                              )}
                              {item.isWrongProduct && (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold">
                                  <Box className="w-2.5 h-2.5" /> Wrong Item
                                </span>
                              )}
                              {item.isSample && (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">
                                  <Gift className="w-2.5 h-2.5" /> Sample
                                </span>
                              )}
                              {!item.isDamaged && !item.isExchange && !item.isWrongProduct && !item.isSample && (
                                <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 text-[10px] font-bold">
                                  Standard
                                </span>
                              )}
                            </div>
                            {item.statusReason && (
                              <p className="text-[10px] text-gray-400 italic px-2">"{item.statusReason}"</p>
                            )}
                            {(isPrivileged || isOwner) && (
                              <button 
                                onClick={() => setEditingItem({ 
                                  id: item._id, 
                                  data: { 
                                    isDamaged: item.isDamaged, 
                                    isExchange: item.isExchange, 
                                    isSample: item.isSample, 
                                    isWrongProduct: item.isWrongProduct,
                                    statusReason: item.statusReason
                                  } 
                                })}
                                className="text-[10px] font-bold text-primary-600 hover:underline flex items-center gap-1"
                              >
                                <Edit3 className="w-2.5 h-2.5" /> Update Status
                              </button>
                            )}
                            
                            {/* History Timeline */}
                            {item.statusHistory && item.statusHistory.length > 0 && (
                              <div className="mt-2 w-full">
                                <button 
                                  onClick={() => setViewingHistory(viewingHistory === item._id ? null : item._id)}
                                  className={`w-full py-1.5 rounded-lg text-[9px] font-bold flex items-center justify-center gap-1.5 transition-all ${viewingHistory === item._id ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20' : 'text-gray-400 hover:text-primary-600'}`}
                                >
                                  <History className={`w-3 h-3 ${viewingHistory === item._id ? 'animate-spin-slow' : ''}`} /> 
                                  {viewingHistory === item._id ? 'Hide Timeline' : 'View Timeline'}
                                </button>
                                
                                {viewingHistory === item._id && (
                                  <div className="mt-3 p-4 bg-gray-50/50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-700 text-left space-y-4 animate-in slide-in-from-top-2 duration-300">
                                    <div className="flex items-center justify-between mb-1">
                                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status History</p>
                                      <span className="text-[10px] font-bold text-primary-500 bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded-full">{item.statusHistory.length} Steps</span>
                                    </div>
                                    <div className="space-y-4 relative">
                                      {/* Vertical Line */}
                                      <div className="absolute left-[5px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary-200 via-primary-100 to-transparent dark:from-primary-900/40 dark:via-primary-900/20" />
                                      
                                      {item.statusHistory.slice().reverse().map((h, i) => (
                                        <div key={i} className="relative pl-6 group">
                                          <div className={`absolute left-0 top-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-900 shadow-sm transition-all group-hover:scale-125 ${i === 0 ? 'bg-primary-600 ring-4 ring-primary-500/10' : 'bg-gray-300 dark:bg-gray-600'}`} />
                                          <div className="flex flex-col">
                                            <div className="flex items-center justify-between gap-2">
                                              <p className={`text-[10px] font-bold ${i === 0 ? 'text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                                {h.status}
                                              </p>
                                              <p className="text-[8px] font-medium text-gray-400">{formatDate(h.updatedAt)}</p>
                                            </div>
                                            {h.reason && (
                                              <p className="text-[9px] text-gray-500 dark:text-gray-400 italic mt-0.5 line-clamp-2">
                                                "{h.reason}"
                                              </p>
                                            )}
                                            <div className="flex items-center gap-1.5 mt-1">
                                              <div className="w-3.5 h-3.5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[7px] font-bold text-gray-500">
                                                {h.updatedBy?.fullName?.charAt(0) || 'S'}
                                              </div>
                                              <p className="text-[8px] font-bold text-gray-400">
                                                {h.updatedBy?.fullName || 'System'}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center font-bold text-gray-700 dark:text-gray-300">{item.quantity}</td>
                      <td className="px-4 py-4 text-right text-gray-600 dark:text-gray-400">₹{item.price.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">₹{item.subtotal.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex flex-col md:flex-row justify-between gap-8 pt-4">
            <div className="max-w-md">
              <p className="text-xs text-gray-400 italic">
                * This document serves as an official proof of purchase. Product status flags indicate reported issues or promotional distribution at the time of sale.
              </p>
            </div>
            <div className="w-full md:w-72 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-bold text-gray-900 dark:text-white">₹{(sale.totalAmount - (sale.tax || 0) + (sale.discount || 0)).toLocaleString('en-IN')}</span>
              </div>
              {sale.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax</span>
                  <span className="font-bold text-green-600">+ ₹{sale.tax.toLocaleString('en-IN')}</span>
                </div>
              )}
              {sale.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Discount</span>
                  <span className="font-bold text-red-600">- ₹{sale.discount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="h-px bg-gray-100 dark:bg-gray-800 my-2" />
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900 dark:text-white">Total</span>
                <span className="text-2xl font-black text-primary-600">₹{sale.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800 text-center">
          <p className="text-xs text-gray-400 font-medium">Generated by Inventory Pro • Thank you for your business!</p>
        </div>
      </div>
    </div>
  );
}
