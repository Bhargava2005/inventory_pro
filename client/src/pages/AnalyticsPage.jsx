import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ShoppingBag, Loader2, Calendar, 
  Download, FileText, Package,
  FileSpreadsheet, Store, Search, RefreshCw, X, Check, Filter, Clock
} from 'lucide-react';
import useSaleStore from '../store/saleStore.js';
import useBranchStore from '../store/branchStore.js';
import useAuthStore from '../store/authStore.js';
import useProductStore from '../store/productStore.js';
import useAnalyticsStore from '../store/analyticsStore.js';
import useSettingsStore from '../store/settingsStore.js';
import AnalysisTable from '../components/analytics/AnalysisTable.jsx';
import { reportAPI } from '../api/reports.js';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const DATE_PRESETS = [
  { label: 'Today', key: 'today' },
  { label: 'This Week', key: 'week' },
  { label: 'This Month', key: 'month' },
  { label: 'This Year', key: 'year' },
  { label: 'Custom', key: 'custom' },
];

function getPresetDates(key) {
  const now = new Date();
  const fmt = (d) => d.toISOString().split('T')[0];
  if (key === 'today') return { startDate: fmt(now), endDate: fmt(now) };
  if (key === 'week') {
    const s = new Date(now); s.setDate(s.getDate() - s.getDay());
    return { startDate: fmt(s), endDate: fmt(now) };
  }
  if (key === 'month') {
    return { startDate: fmt(new Date(now.getFullYear(), now.getMonth(), 1)), endDate: fmt(now) };
  }
  if (key === 'year') {
    return { startDate: `${now.getFullYear()}-01-01`, endDate: fmt(now) };
  }
  return null;
}

export default function AnalyticsPage() {
  const { analysisData, fetchAnalysis, isLoading } = useSaleStore();
  const { branches, fetchBranches } = useBranchStore();
  const { categories, fetchCategories, brands, fetchBrands } = useProductStore();
  const { user } = useAuthStore();
  const {
    activePreset, setActivePreset,
    activeResultTab, setActiveResultTab,
    dateRange, setDateRange,
    selectedBranch, setSelectedBranch,
    selectedCategory, setSelectedCategory,
    selectedBrand, setSelectedBrand,
    searchTerm, setSearchTerm,
    selectedProducts, setSelectedProducts,
    groupBy, setGroupBy,
    transactionType, setTransactionType,
    sortBy, setSortBy,
    page, setPage
  } = useAnalyticsStore();
  const { settings } = useSettingsStore();
  
  const isStaff = user?.role === 'staff';
  const hidePrice = isStaff && settings?.privacy?.hideStaffPriceDetails;
  
  const [isExporting, setIsExporting] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(null); 

  useEffect(() => {
    if (user?.role === 'admin') fetchBranches();
    fetchCategories();
    fetchBrands(selectedBranch ? { branchId: selectedBranch } : {});
  }, [selectedBranch]);

  const fetchData = (currentSelected = selectedProducts, currentPage = page) => {
    fetchAnalysis({ 
      ...dateRange, 
      branchId: selectedBranch, 
      categoryId: selectedCategory,
      brand: selectedBrand,
      search: searchTerm,
      productIds: currentSelected,
      groupBy: groupBy,
      transactionType: transactionType,
      sortByField: sortBy.field,
      sortByDir: sortBy.direction,
      page: currentPage,
      limit: 10,
      activeTab: activeResultTab
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchData(selectedProducts, 1);
    }, 400); 
    return () => clearTimeout(timer);
  }, [dateRange, selectedBranch, selectedCategory, selectedBrand, searchTerm, transactionType]);

  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) { isFirstMount.current = false; return; }
    const timer = setTimeout(() => {
      fetchData(selectedProducts, page);
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedProducts, groupBy, page, activeResultTab, sortBy]);

  const applyPreset = (key) => {
    setActivePreset(key);
    if (key !== 'custom') {
      const range = getPresetDates(key);
      setDateRange(range);
    }
  };

  const toggleProduct = (id) => {
    setSelectedProducts(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const toggleAllProducts = () => {
    const currentProducts = analysisData?.productAnalysis?.map(p => p._id) || [];
    const allCurrentSelected = currentProducts.every(p => selectedProducts.includes(p));
    
    if (allCurrentSelected) {
      setSelectedProducts(prev => prev.filter(p => !currentProducts.includes(p)));
    } else {
      setSelectedProducts(prev => [...new Set([...prev, ...currentProducts])]);
    }
  };

  const getFileName = (ext) => {
    const date = new Date().toISOString().split('T')[0];
    const time = new Date().toLocaleTimeString('en-IN', { hour12: false }).replace(/:/g, '-');
    if (selectedProducts.length === 1) {
      const pName = analysisData?.productAnalysis?.find(p => p._id === selectedProducts[0])?.name || 'Item';
      return `product_${pName.replace(/\s+/g, '_')}_${date}.${ext}`;
    } else if (selectedProducts.length > 1) {
      return `multi_product_audit_${date}.${ext}`;
    } else if (selectedBrand) {
      return `brand_${selectedBrand.replace(/\s+/g, '_')}_${date}.${ext}`;
    }
    return `report_${date}_${time}.${ext}`;
  };

  const handleExportClick = (type) => {
    if (selectedProducts.length === 0 && !searchTerm) {
      setShowDownloadModal(type);
    } else {
      if (type === 'excel') executeExcelExport(selectedProducts.length > 0 || !!searchTerm);
      else executePdfExport(selectedProducts.length > 0 || !!searchTerm);
    }
  };

  const executeExcelExport = async (includeProducts) => {
    setIsExporting(true);
    try {
      const params = { 
        ...dateRange, 
        branchId: selectedBranch, 
        categoryId: selectedCategory,
        brand: selectedBrand,
        search: searchTerm,
        productIds: selectedProducts,
        groupBy: groupBy,
        transactionType: transactionType,
        sortByField: sortBy.field,
        sortByDir: sortBy.direction
      };
      const response = await reportAPI.getAnalysisExport(params);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', getFileName('xlsx'));
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Excel report downloaded');
    } catch (error) {
      toast.error('Failed to export Excel');
    } finally {
      setIsExporting(false);
      setShowDownloadModal(null);
    }
  };

  const executePdfExport = (includeProducts) => {
    if (!analysisData) return;
    
    const doc = new jsPDF();
    const allProducts = analysisData.productAnalysis;
    const filteredProducts = selectedProducts.length > 0 
      ? allProducts.filter(p => selectedProducts.includes(p._id))
      : allProducts;
    const { timeAnalysis } = analysisData;
    
    const showSpecific = selectedProducts.length > 0 || !!searchTerm;

    const branchName = branches.find(b => b._id === selectedBranch)?.name || 'All Branches';
    const categoryName = categories.find(c => c._id === selectedCategory)?.name || 'All Categories';
    const brandName = selectedBrand || 'All Brands';
    const presetLabel = DATE_PRESETS.find(p => p.key === activePreset)?.label || 'Custom Range';
    const genTime = new Date().toLocaleString('en-IN');
    const groupLabel = groupBy === 'day' ? 'Daily' : groupBy === 'week' ? 'Weekly' : 'Monthly';

    // Header Helper
    const addHeader = (title) => {
      doc.setFillColor(79, 70, 229); 
      doc.rect(0, 0, 210, 50, 'F');
      doc.setTextColor(255, 255, 255);
      
      doc.setFontSize(22);
      doc.text(title, 15, 22);
      
      doc.setFontSize(10);
      doc.text(`Filter: ${presetLabel} (${groupLabel})`, 15, 30);
      doc.text(`Period: ${dateRange.startDate} to ${dateRange.endDate}`, 15, 36);
      
      doc.text(`Branch: ${branchName}`, 120, 25);
      doc.text(`Category: ${categoryName}`, 120, 31);
      doc.text(`Brand: ${brandName}`, 120, 37);
      
      doc.setFontSize(8);
      doc.text(`Generated: ${genTime}`, 15, 45);
    };

    const renderTimeTable = (y) => {
      doc.setTextColor(31, 41, 55);
      doc.setFontSize(14);
      doc.text(`Summary by ${groupLabel}`, 15, y);
      autoTable(doc, {
        startY: y + 5,
        head: [[groupLabel === 'Daily' ? 'Date' : 'Period', 'Sold', ...(!hidePrice ? ['Revenue'] : []), 'Samples', 'Damages', 'Exchanges', 'Wrong']],
        body: timeAnalysis.map(d => [
          d._id, d.salesCount, ...(!hidePrice ? [`Rs. ${d.totalSales.toLocaleString('en-IN')}`] : []),
          d.sampleCount, d.damagedCount, d.exchangeCount, d.wrongProductCount
        ]),
        headStyles: { fillColor: [99, 102, 241] },
        margin: { left: 15, right: 15 }
      });
      return doc.lastAutoTable.finalY;
    };

    const renderProductTable = (y) => {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setTextColor(31, 41, 55);
      doc.setFontSize(14);
      doc.text('Product Performance', 15, y);
      autoTable(doc, {
        startY: y + 5,
        head: [['SKU', 'Brand', 'Product Name', 'Sold', ...(!hidePrice ? ['Revenue'] : []), 'Samples', 'Damages', 'Exchanges', 'Wrong']],
        body: filteredProducts.map(d => [
          d.sku || 'N/A', d.brand || '—', d.name || d._id, d.salesCount, ...(!hidePrice ? [`Rs. ${d.totalSales.toLocaleString('en-IN')}`] : []),
          d.sampleCount, d.damagedStock || d.damagedCount || 0, d.exchangedStock || d.exchangeCount || 0, d.wrongProductStock || d.wrongProductCount || 0
        ]),
        headStyles: { fillColor: [79, 70, 229] },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        margin: { left: 15, right: 15 }
      });
      return doc.lastAutoTable.finalY;
    };

    // Ordering logic
    if (showSpecific) {
      const firstProductName = filteredProducts[0]?.name || selectedProducts[0];
      let title = selectedProducts.length === 1 ? `Audit: ${firstProductName}` : 'Specific Product Audit';
      addHeader(title);
      let nextY = renderProductTable(60);
      renderTimeTable(nextY + 15);
    } else {
      addHeader('Business Performance Report');
      let nextY = renderTimeTable(60);
      if (includeProducts) renderProductTable(nextY + 15);
    }
    
    doc.save(getFileName('pdf'));
    toast.success('PDF report downloaded');
    setShowDownloadModal(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4">
        {/* Row 1: Title and Export Buttons (Desktop) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Package className="w-7 h-7 text-primary-600" />
              {user?.role === 'staff' ? 'My Sales Performance' : 'Sales Analytics'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {user?.role === 'staff' ? 'View and track your personal sales achievements' : 'Analyze trends and audit product integrity'}
            </p>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <button onClick={() => handleExportClick('excel')} disabled={isExporting}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition shadow-sm disabled:opacity-50">
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
              Excel
            </button>
            <button onClick={() => handleExportClick('pdf')}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition shadow-sm">
              <FileText className="w-4 h-4" />
              PDF
            </button>
          </div>
        </div>

        {/* Row 2: Filters and Export Buttons (Mobile) */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-1.5 w-full sm:w-auto sm:min-w-[150px]">
            <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent border-none text-sm focus:ring-0 p-0 dark:text-white w-full outline-none cursor-pointer"
            >
              <option value="" className="dark:bg-gray-900">All Categories</option>
              {categories.map(c => <option key={c._id} value={c._id} className="dark:bg-gray-900">{c.name}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-1.5 w-full sm:w-auto sm:min-w-[150px]">
            <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <select 
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="bg-transparent border-none text-sm focus:ring-0 p-0 dark:text-white w-full outline-none cursor-pointer"
            >
              <option value="" className="dark:bg-gray-900">All Brands</option>
              {brands.map(b => <option key={b} value={b} className="dark:bg-gray-900">{b}</option>)}
            </select>
          </div>

          {user?.role === 'admin' && branches.length > 1 && (
            <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 transition-all">
              <Store className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <select 
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
              className="select bg-transparent border-none text-xs font-bold focus:ring-0 p-0 dark:text-white w-full outline-none pr-8 cursor-pointer"
            >
              <option value="" className="dark:bg-gray-900">All Branches</option>
              {branches.map(b => <option key={b._id} value={b._id} className="dark:bg-gray-900">{b.name}</option>)}
            </select>
            </div>
          )}

          {/* Transaction Pool Filter */}
          <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-1.5 w-full sm:w-auto sm:min-w-[150px]">
            <RefreshCw className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <select 
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value)}
              className="bg-transparent border-none text-sm focus:ring-0 p-0 dark:text-white w-full outline-none cursor-pointer font-bold"
            >
              <option value="all">All Transactions</option>
              <option value="sale">Regular Sales</option>
              <option value="damaged">Damaged Stock</option>
              <option value="exchange">Exchange Items</option>
              <option value="wrong">Wrong Deliveries</option>
              <option value="sample">Samples Given</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-1.5">
            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input type="date" className="bg-transparent border-none text-xs focus:ring-0 p-0 dark:text-white outline-none w-24"
              value={dateRange.startDate} onChange={(e) => { setDateRange(p => ({ ...p, startDate: e.target.value })); setActivePreset('custom'); }} />
            <span className="text-gray-400 text-xs">→</span>
            <input type="date" className="bg-transparent border-none text-xs focus:ring-0 p-0 dark:text-white outline-none w-24"
              value={dateRange.endDate} onChange={(e) => { setDateRange(p => ({ ...p, endDate: e.target.value })); setActivePreset('custom'); }} />
          </div>

          {/* Export Buttons (Mobile) */}
          <div className="flex md:hidden gap-2 w-full">
            <button onClick={() => handleExportClick('excel')} disabled={isExporting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition shadow-sm disabled:opacity-50">
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
              Excel
            </button>
            <button onClick={() => handleExportClick('pdf')}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition shadow-sm">
              <FileText className="w-4 h-4" />
              PDF
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-2xl shadow-sm">
        <div className="flex flex-wrap gap-2">
          {DATE_PRESETS.map((p) => (
            <button key={p.key} onClick={() => applyPreset(p.key)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                activePreset === p.key ? 'bg-primary-600 text-white shadow-md' : 'bg-gray-50 dark:bg-gray-800 text-gray-500'
              }`}>{p.label}</button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:max-w-xl">
           <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search product name or SKU..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 h-11 text-sm w-full bg-gray-50 border-transparent focus:bg-white focus:border-primary-500 transition-all" />
          </div>
          {selectedProducts.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-lg text-[10px] font-bold uppercase border border-primary-100 whitespace-nowrap">
               {selectedProducts.length} Selected
               <button onClick={() => setSelectedProducts([])}><X className="w-3 h-3" /></button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => { setActiveResultTab('product'); setPage(1); }}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${activeResultTab === 'product' ? 'bg-primary-600 text-white shadow-lg shadow-primary-200' : 'bg-white dark:bg-gray-800 text-gray-500'}`}>
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Product Performance</span>
              <span className="sm:hidden">Products</span>
            </button>
            <button onClick={() => { setActiveResultTab('time'); setPage(1); }}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${activeResultTab === 'time' ? 'bg-primary-600 text-white shadow-lg shadow-primary-200' : 'bg-white dark:bg-gray-800 text-gray-500'}`}>
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Summary by Date</span>
              <span className="sm:hidden">By Date</span>
            </button>
          </div>
          <button onClick={() => fetchData(selectedProducts, page)} className="p-2 text-gray-400 hover:text-primary-600 transition" title="Refresh">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <AnalysisTable 
          data={activeResultTab === 'product' ? (analysisData?.productAnalysis || []) : (analysisData?.timeAnalysis || [])} 
          type={activeResultTab}
          selectedItems={selectedProducts}
          onToggleItem={toggleProduct}
          onToggleAll={toggleAllProducts}
          groupBy={groupBy}
          onGroupByChange={setGroupBy}
          dateRange={dateRange}
          pagination={{ 
            page: page, 
            totalPages: analysisData?.totalPages || 1,
            totalRecords: activeResultTab === 'product' ? analysisData?.productTotal : analysisData?.timeTotal
          }}
          onPageChange={setPage}
          isUpdating={isLoading}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
      </div>

      {showDownloadModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-slide-up relative p-8 text-center">
              <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6"><Download className="w-8 h-8" /></div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Export Analysis</h3>
              <p className="text-gray-500 text-sm mb-8">Choose the detail level for your business report.</p>
              <div className="grid grid-cols-1 gap-3">
                <button onClick={() => { if (showDownloadModal === 'excel') executeExcelExport(true); else executePdfExport(true); }}
                  className="flex items-center justify-center gap-2 w-full py-4 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 transition shadow-lg">
                  <Check className="w-5 h-5" /> Full Audit (Products + Summary)
                </button>
                <button onClick={() => { if (showDownloadModal === 'excel') executeExcelExport(false); else executePdfExport(false); }}
                  className="w-full py-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl font-bold hover:bg-gray-200 transition">
                  {groupBy === 'day' ? 'Daily' : groupBy === 'week' ? 'Weekly' : 'Monthly'} Summary Only
                </button>
                <button onClick={() => { setShowDownloadModal(null); toast('Select products from the table', { icon: '🔍' }); }}
                  className="w-full py-3 text-gray-400 text-sm font-medium hover:text-gray-600 transition">Wait, I'll select items</button>
              </div>
              <button onClick={() => setShowDownloadModal(null)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
