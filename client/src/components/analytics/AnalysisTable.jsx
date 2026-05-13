import { TrendingUp, ShoppingBag, AlertTriangle, RefreshCcw, Package, HelpCircle, ChevronDown, ChevronLeft, ChevronRight, Hash } from 'lucide-react';

export default function AnalysisTable({ 
  data, 
  type = 'product', 
  selectedItems = [], 
  onToggleItem, 
  onToggleAll,
  groupBy = 'day',
  onGroupByChange,
  dateRange,
  pagination = { page: 1, totalPages: 1 },
  onPageChange,
  isUpdating = false
}) {
  if (!data || (data.length === 0 && !isUpdating)) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-10 text-center">
        <p className="text-gray-500">No data found for the selected period.</p>
      </div>
    );
  }

  const isAllSelected = data.length > 0 && data.every(row => selectedItems.includes(row._id));
  const showCheckboxes = type === 'product';

  const getAllowedIntervals = () => {
    if (!dateRange?.startDate || !dateRange?.endDate) return [{ value: 'day', label: 'Daily' }];
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const intervals = [{ value: 'day', label: 'Daily' }];
    if (diffDays >= 7) intervals.push({ value: 'week', label: 'Weekly' });
    if (diffDays >= 28) intervals.push({ value: 'month', label: 'Monthly' });
    return intervals;
  };

  const allowedIntervals = getAllowedIntervals();

  return (
    <div className="space-y-4 animate-fade-in">
      <div className={`bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm transition-opacity duration-200 ${isUpdating ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50">
                {showCheckboxes && (
                  <th className="px-6 py-4 w-12">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4 cursor-pointer"
                      checked={isAllSelected}
                      onChange={onToggleAll}
                    />
                  </th>
                )}
                {type === 'product' && (
                  <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-32">SKU</th>
                )}
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    {type === 'product' ? 'Product Name' : 'Date / Period'}
                    {type === 'time' && allowedIntervals.length > 1 && (
                      <div className="relative group">
                        <select 
                          value={groupBy}
                          onChange={(e) => onGroupByChange(e.target.value)}
                          className="appearance-none bg-gray-100 dark:bg-gray-700 border-none rounded-lg py-0.5 pl-2 pr-6 text-[10px] font-bold cursor-pointer hover:bg-gray-200 transition focus:ring-0 outline-none"
                        >
                          {allowedIntervals.map(i => (
                            <option key={i.value} value={i.value}>{i.label}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                      </div>
                    )}
                  </div>
                </th>
                <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Items Sold</th>
                <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Revenue</th>
                <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Samples</th>
                <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Damages</th>
                <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Exchanges</th>
                <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Wrong Del.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {data.map((row, idx) => {
                const itemKey = row._id;
                return (
                  <tr 
                    key={idx} 
                    className={`transition-colors ${
                      showCheckboxes ? 'hover:bg-gray-50/50 dark:hover:bg-gray-800/30 cursor-pointer' : 'hover:bg-gray-50/30'
                    } ${
                      showCheckboxes && selectedItems.includes(itemKey) ? 'bg-primary-50/30 dark:bg-primary-900/10' : ''
                    }`}
                    onClick={() => showCheckboxes && onToggleItem(itemKey)}
                  >
                    {showCheckboxes && (
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4 cursor-pointer"
                          checked={selectedItems.includes(itemKey)}
                          onChange={() => onToggleItem(itemKey)}
                        />
                      </td>
                    )}
                    {type === 'product' && (
                      <td className="px-4 py-4">
                        <span className="text-xs font-mono font-bold text-primary-600 bg-primary-50 dark:bg-primary-900/20 px-2 py-1 rounded">
                          {row.sku || 'N/A'}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <span className={`text-sm font-semibold ${type === 'time' ? 'text-primary-600 font-mono' : 'text-gray-900 dark:text-white'}`}>
                        {row.name || row._id}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{row.salesCount}</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">₹{(row.totalSales || 0).toLocaleString('en-IN')}</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{row.sampleCount}</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-sm font-semibold text-red-600">{row.damagedCount}</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-sm font-semibold text-amber-600">{row.exchangeCount}</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-sm font-semibold text-purple-600">{row.wrongProductCount}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
            Page {pagination.page} of {pagination.totalPages} {pagination.totalRecords !== undefined && `— ${pagination.totalRecords} records`}
          </p>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1 || isUpdating}
              className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages || isUpdating}
              className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition shadow-sm"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
