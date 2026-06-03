import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, FileText, Calendar, Loader2, Filter,
  Download, FileDown, FileUp, ChevronLeft, ChevronRight, ArrowLeft, Store,
} from 'lucide-react';
import useSaleStore from '../store/saleStore.js';
import useBranchStore from '../store/branchStore.js';
import useAuthStore from '../store/authStore.js';
import useSettingsStore from '../store/settingsStore.js';
import { generateInvoicePDF } from '../utils/pdfGenerator.js';
import api from '../api/client.js';
import toast from 'react-hot-toast';
import SalesImportModal from '../components/sales/SalesImportModal.jsx';
import SaleDetailsModal from '../components/sales/SaleDetailsModal.jsx';

const paymentBadge = {
  cash:   'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  card:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  upi:    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

export default function SalesPage() {
  const { sales, fetchSales, isLoading, page, totalPages, total, setPage } = useSaleStore();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm]   = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [startDate, setStartDate]     = useState('');
  const [endDate, setEndDate]         = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Import states
  const [isImporting, setIsImporting]     = useState(false);
  const [importFile, setImportFile]       = useState(null);
  const [importHeaders, setImportHeaders] = useState(null);
  const [isScanning, setIsScanning]       = useState(false);
  const [selectedSale, setSelectedSale]   = useState(null);
  const [selectedBranch, setSelectedBranch] = useState('');

  const { branches, fetchBranches } = useBranchStore();
  const { user } = useAuthStore();
  const { settings, fetchSettings } = useSettingsStore();
  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff';
  const hidePrice = (isStaff && settings?.privacy?.hideStaffPriceDetails !== false) || settings?.privacy?.hideAllFinancialDetails;
  const hideTax = (isStaff && settings?.privacy?.hideStaffTaxDetails !== false) || settings?.privacy?.hideAllFinancialDetails;
  const hidePayment = (isStaff && settings?.privacy?.hideStaffPaymentMethod !== false) || settings?.privacy?.hideAllFinancialDetails;

  // Debounce the search input (500 ms) so we don't fire on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Reset to page 1 whenever filters / search change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, startDate, endDate, selectedBranch]);

  useEffect(() => {
    if (isAdmin) fetchBranches();
    if (!settings) fetchSettings();
  }, [isAdmin, settings]);

  // Fetch whenever page or filters change
  useEffect(() => {
    fetchSales({ search: debouncedSearch, startDate, endDate, branchId: selectedBranch });
  }, [page, debouncedSearch, startDate, endDate, selectedBranch]);

  /* ── import handlers ─────────────────────────────────────────────────── */
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportFile(file);
    const formData = new FormData();
    formData.append('file', file);
    setIsScanning(true);
    try {
      const { data } = await api.post('/products/import/scan', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportHeaders(data.data.headers);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to scan file');
      setImportFile(null);
    } finally { setIsScanning(false); e.target.value = null; }
  };

  const handleConfirmMapping = async (mapping) => {
    if (!importFile) return;
    const formData = new FormData();
    formData.append('file', importFile);
    formData.append('mapping', JSON.stringify(mapping));
    setIsImporting(true);
    try {
      const { data } = await api.post('/sales/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (data.success) {
        toast.success(data.message);
        fetchSales({ search: debouncedSearch, startDate, endDate });
        setImportHeaders(null);
        setImportFile(null);
      }
      if (data.errors?.length > 0) toast('Some rows were skipped.', { icon: '⚠️' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Import failed');
    } finally { setIsImporting(false); }
  };

  const handleExportSales = async () => {
    try {
      toast.loading('Generating Excel report...', { id: 'export' });
      const response = await api.get('/reports/sales/export', {
        params: { startDate, endDate },
        responseType: 'blob',
      });
      const url  = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sales_report_${startDate || 'all'}_to_${endDate || 'all'}.xlsx`);
      document.body.appendChild(link); link.click(); link.remove();
      toast.success('Report downloaded!', { id: 'export' });
    } catch { toast.error('Failed to export sales', { id: 'export' }); }
  };

  const handleClearFilters = () => {
    setStartDate(''); setEndDate(''); setSearchTerm(''); setDebouncedSearch('');
    setSelectedBranch('');
  };

  const hasActiveFilters = searchTerm || startDate || endDate || selectedBranch;

  /* ── render ──────────────────────────────────────────────────────────── */
  return (
    <div>
      {/* Mobile back button — returns to New Sale page */}
      <div className="md:hidden flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate('/pos')}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 transition-all text-sm font-semibold"
        >
          <ArrowLeft size={16} />
          New Voucher
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Sales History</h1>
      </div>

      {/* Header (desktop only) */}
      <div className="hidden md:flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sales History</h1>
          <p className="text-sm text-gray-500">
            {total > 0 ? `${total} total transactions` : 'View and manage past transactions'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportSales} className="btn-secondary flex-1 sm:flex-none">
            <Download className="w-4 h-4" /> <span className="hidden sm:inline">Export</span>
          </button>
          <input
            type="file" id="sales-import" className="hidden"
            accept=".xlsx, .xls, .csv" onChange={handleFileSelect}
          />
          <button
            onClick={() => document.getElementById('sales-import').click()}
            disabled={isScanning || isImporting}
            className="btn-secondary flex-1 sm:flex-none"
          >
            {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
            <span className="hidden sm:inline">Import</span>
          </button>
        </div>
      </div>

      {/* Search + Filter bar */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by invoice or customer..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {/* Clear search */}
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
              >×</button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary px-3 ${showFilters || startDate || endDate ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 text-primary-600' : ''}`}
          >
            <Filter className="w-4 h-4" />
            {(startDate || endDate) && <span className="w-2 h-2 rounded-full bg-primary-500 ml-1" />}
          </button>
        </div>

        {showFilters && (
          <div className="card p-4 bg-gray-50 dark:bg-gray-800/40 border-dashed animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <label className="label">Start Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="date" className="input pl-10" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">End Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="date" className="input pl-10" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
              {isAdmin && (
                <div>
                  <label className="label">Branch</label>
                  <div className="relative">
                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select 
                      className="input pl-10" 
                      value={selectedBranch} 
                      onChange={(e) => setSelectedBranch(e.target.value)}
                    >
                      <option value="">All Branches</option>
                      {branches.map(b => (
                        <option key={b._id} value={b._id}>{b.name} ({b.code})</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              <div className={isAdmin ? 'sm:col-span-3 flex justify-end' : ''}>
                <button onClick={handleClearFilters} className="btn-secondary h-10">Reset All</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          <p className="text-sm text-gray-400">Loading sales...</p>
        </div>
      ) : sales.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <FileText className="w-10 h-10 text-gray-300 dark:text-gray-700 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No sales found</p>
          <p className="text-sm text-gray-400 dark:text-gray-600 mt-1">
            {hasActiveFilters ? 'Try adjusting your search or date range.' : 'No transactions recorded yet.'}
          </p>
          {hasActiveFilters && (
            <button onClick={handleClearFilters} className="btn-secondary mt-4 text-sm">Clear filters</button>
          )}
        </div>
      ) : (
        <>
          {/* ── MOBILE CARD LIST ───────────────────────────────────────── */}
          <div className="md:hidden space-y-3">
            {sales.map((s) => (
              <div 
                key={s._id} 
                onClick={() => setSelectedSale(s)}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 active:scale-[0.98] transition-transform cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <span className="font-bold text-gray-900 dark:text-white text-sm">{s.invoiceNumber}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      generateInvoicePDF(s, { hidePrice, hideTax, hidePaymentMethod: hidePayment });
                    }}
                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all touch-target"
                    title="Download Invoice"
                  >
                    <FileDown className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{s.customer?.name || 'Walk-in Customer'}</p>
                    {s.customer?.phone && <p className="text-xs text-gray-400">{s.customer.phone}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(s.createdAt).toLocaleDateString()} · {new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-right">
                    {!hidePrice && <p className="text-lg font-bold text-primary-600">₹{s.totalAmount.toLocaleString('en-IN')}</p>}
                    {!hidePayment && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${paymentBadge[s.paymentMethod] || 'bg-gray-100 text-gray-500'}`}>
                        {s.paymentMethod}
                      </span>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{s.items.length} items</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── DESKTOP TABLE ──────────────────────────────────────────── */}
          <div className="card overflow-hidden hidden md:block">
            <div className="table-container">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                    <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider text-xs">Invoice</th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider text-xs">Date</th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider text-xs">Customer</th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider text-xs">Items</th>
                    {!hidePrice && <th className="text-right px-6 py-4 font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider text-xs">Total</th>}
                    <th className="text-center px-6 py-4 font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider text-xs">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {sales.map((s) => (
                    <tr 
                      key={s._id} 
                      onClick={() => setSelectedSale(s)}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary-500" />
                          <span className="font-bold text-gray-900 dark:text-white">{s.invoiceNumber}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                        {new Date(s.createdAt).toLocaleDateString()}{' '}
                        {new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900 dark:text-white">{s.customer?.name || 'Walk-in Customer'}</p>
                        {s.customer?.phone && <p className="text-xs text-gray-400">{s.customer.phone}</p>}
                      </td>
                      <td className="px-6 py-4 text-gray-500">{s.items.length} items</td>
                      {!hidePrice && (
                        <td className="px-6 py-4 text-right">
                          <span className="font-bold text-primary-600">₹{s.totalAmount.toLocaleString('en-IN')}</span>
                          {!hidePayment && <p className="text-[10px] uppercase text-gray-400">{s.paymentMethod}</p>}
                        </td>
                      )}
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            generateInvoicePDF(s, { hidePrice, hideTax, hidePaymentMethod: hidePayment });
                          }}
                          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all"
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
          </div>

          {/* ── PAGINATION ─────────────────────────────────────────────── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-5">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Page <span className="font-semibold text-gray-800 dark:text-gray-200">{page}</span> of{' '}
                <span className="font-semibold text-gray-800 dark:text-gray-200">{totalPages}</span>
                <span className="hidden sm:inline"> &nbsp;·&nbsp; {total} records</span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1 || isLoading}
                  className="btn-secondary py-2 px-3 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Page number buttons (show up to 5) */}
                <div className="hidden sm:flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let p;
                    if (totalPages <= 5) p = i + 1;
                    else if (page <= 3) p = i + 1;
                    else if (page >= totalPages - 2) p = totalPages - 4 + i;
                    else p = page - 2 + i;
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                          p === page
                            ? 'bg-primary-600 text-white'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages || isLoading}
                  className="btn-secondary py-2 px-3 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {importHeaders && (
        <SalesImportModal
          headers={importHeaders}
          isSubmitting={isImporting}
          onClose={() => { setImportHeaders(null); setImportFile(null); }}
          onConfirm={handleConfirmMapping}
        />
      )}

      {selectedSale && (
        <SaleDetailsModal
          sale={selectedSale}
          onClose={() => setSelectedSale(null)}
        />
      )}
    </div>
  );
}
