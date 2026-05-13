import { useState } from 'react';
import { X, FileSpreadsheet, Calendar, Store, Download, Loader2 } from 'lucide-react';
import { employeeAPI } from '../../api/employee';
import toast from 'react-hot-toast';

const DATE_PRESETS = [
  { label: 'Today', key: 'today' },
  { label: 'Yesterday', key: 'yesterday' },
  { label: 'This Week', key: 'week' },
  { label: 'This Month', key: 'month' },
  { label: 'This Year', key: 'year' },
  { label: 'Custom', key: 'custom' },
];

function getPresetDates(key) {
  const now = new Date();
  const fmt = (d) => d.toISOString().split('T')[0];
  if (key === 'today') return { startDate: fmt(now), endDate: fmt(now) };
  if (key === 'yesterday') {
    const y = new Date(now); y.setDate(y.getDate() - 1);
    return { startDate: fmt(y), endDate: fmt(y) };
  }
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
  return { startDate: '', endDate: '' };
}

export default function ExportModal({ branches, onClose }) {
  const [preset, setPreset] = useState('month');
  const [customDates, setCustomDates] = useState({ startDate: '', endDate: '' });
  const [selectedBranch, setSelectedBranch] = useState('');
  const [loading, setLoading] = useState(false);

  const getRange = () => {
    if (preset === 'custom') return customDates;
    return getPresetDates(preset);
  };

  const handleExport = async () => {
    const range = getRange();
    if (!range.startDate || !range.endDate) {
      toast.error('Please select a date range');
      return;
    }
    setLoading(true);
    try {
      const { data } = await employeeAPI.exportExcel({
        ...range,
        branchId: selectedBranch || undefined,
      });
      // Trigger download
      const url = URL.createObjectURL(new Blob([data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `employee-report-${range.startDate}_${range.endDate}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('Excel report downloaded!');
      onClose();
    } catch {
      toast.error('Failed to export report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-white">Export Employee Report</h2>
              <p className="text-emerald-100 text-xs">Multi-employee Excel with 3 sheets</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Branch filter */}
          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Store className="w-3.5 h-3.5" /> Branch
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="input w-full"
            >
              <option value="">All Branches</option>
              {(branches || []).map((b) => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Date preset */}
          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Calendar className="w-3.5 h-3.5" /> Date Range
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DATE_PRESETS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPreset(p.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    preset === p.key
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {preset === 'custom' && (
              <div className="flex items-center gap-2 mt-3">
                <input
                  type="date"
                  className="input flex-1 text-sm"
                  value={customDates.startDate}
                  onChange={(e) => setCustomDates((p) => ({ ...p, startDate: e.target.value }))}
                />
                <span className="text-gray-400">→</span>
                <input
                  type="date"
                  className="input flex-1 text-sm"
                  value={customDates.endDate}
                  onChange={(e) => setCustomDates((p) => ({ ...p, endDate: e.target.value }))}
                />
              </div>
            )}
            {preset !== 'custom' && (
              <p className="text-xs text-gray-400 mt-2">
                {(() => { const r = getPresetDates(preset); return `${r.startDate} → ${r.endDate}`; })()}
              </p>
            )}
          </div>

          {/* Info box */}
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-3">
            <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
              📊 Excel file will contain 3 sheets:
            </p>
            <ul className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 space-y-0.5 ml-4 list-disc">
              <li>Summary — KPIs per employee</li>
              <li>Sales Detail — All transactions with item flags</li>
              <li>Attendance Log — Login/logout sessions</li>
            </ul>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition disabled:opacity-60"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
              ) : (
                <><Download className="w-4 h-4" /> Download Excel</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
