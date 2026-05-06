import { useEffect, useState } from 'react';
import { Search, FileText, Calendar, User, Store, ArrowRight, Loader2, Filter, Download, FileDown } from 'lucide-react';
import useSaleStore from '../store/saleStore.js';
import { generateInvoicePDF } from '../utils/pdfGenerator.js';

export default function SalesPage() {
  const { sales, fetchSales, isLoading } = useSaleStore();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSales();
  }, []);

  const filteredSales = sales.filter(s => 
    s.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sales History</h1>
          <p className="text-sm text-gray-500">View and manage past transactions</p>
        </div>
        <a 
          href="http://localhost:5000/api/reports/sales/export" 
          target="_blank" 
          rel="noopener noreferrer"
          className="btn-secondary"
        >
          <Download className="w-4 h-4" /> Export All (Excel)
        </a>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by invoice or customer..." 
            className="input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn-secondary flex items-center gap-2">
          <Calendar className="w-4 h-4" /> Filter by Date
        </button>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>
        ) : filteredSales.length === 0 ? (
          <div className="text-center py-20 text-gray-400 italic">No sales found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Invoice</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Items</th>
                  <th className="text-right px-6 py-4 font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Total</th>
                  <th className="text-center px-6 py-4 font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {filteredSales.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary-500" />
                        <span className="font-bold text-gray-900 dark:text-white">{s.invoiceNumber}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(s.createdAt).toLocaleDateString()} {new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900 dark:text-white">{s.customer?.name || 'Walk-in Customer'}</p>
                      {s.customer?.phone && <p className="text-xs text-gray-400">{s.customer.phone}</p>}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {s.items.length} items
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-primary-600">₹{s.totalAmount.toLocaleString('en-IN')}</span>
                      <p className="text-[10px] uppercase text-gray-400">{s.paymentMethod}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => generateInvoicePDF(s)}
                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                        title="Download Invoice"
                      >
                        <FileDown className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
