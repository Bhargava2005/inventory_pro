import { useState, useEffect } from 'react';
import { X, ArrowRight, Table, AlertCircle, Loader2, Check } from 'lucide-react';

const SALES_FIELDS = [
  { key: 'sku', label: 'Product SKU', required: true, description: 'Matches existing products' },
  { key: 'productName', label: 'Product Name', required: false, description: 'Alternative if SKU missing' },
  { key: 'quantity', label: 'Quantity Sold', required: true, description: 'Must be a number' },
  { key: 'price', label: 'Sale Price', required: false, description: 'Uses product price if empty' },
  { key: 'tax', label: 'Tax (GST)', required: false },
  { key: 'discount', label: 'Discount', required: false },
  { key: 'paymentMethod', label: 'Payment Method', required: false, description: 'Cash, Card, UPI, etc.' },
  { key: 'customerName', label: 'Customer Name', required: false },
  { key: 'date', label: 'Sale Date', required: false, description: 'YYYY-MM-DD format' },
];

export default function SalesImportModal({ headers, onClose, onConfirm, isSubmitting }) {
  const [mapping, setMapping] = useState({});

  // Auto-match headers based on name similarity
  useEffect(() => {
    const initialMapping = {};
    SALES_FIELDS.forEach(field => {
      const match = headers.find(h => 
        h.toLowerCase().includes(field.key.toLowerCase()) || 
        h.toLowerCase().includes(field.label.toLowerCase()) ||
        (field.key === 'sku' && h.toLowerCase().includes('item id')) ||
        (field.key === 'productName' && h.toLowerCase().includes('item name'))
      );
      if (match) initialMapping[field.key] = match;
    });
    setMapping(initialMapping);
  }, [headers]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(mapping);
  };

  const isReady = SALES_FIELDS.filter(f => f.required).every(f => mapping[f.key]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="px-8 py-6 bg-primary-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Table className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Import Sales Data</h2>
              <p className="text-sm text-primary-100 opacity-80">Map your Excel columns to system fields</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
            {SALES_FIELDS.map((field) => (
              <div key={field.key} className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {mapping[field.key] && (
                    <span className="text-[10px] text-green-500 font-bold uppercase flex items-center gap-1">
                      <Check className="w-3 h-3" /> Matched
                    </span>
                  )}
                </div>
                <select
                  value={mapping[field.key] || ''}
                  onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                  className={`input text-sm ${field.required && !mapping[field.key] ? 'border-red-200 dark:border-red-900/50' : ''}`}
                >
                  <option value="">-- Select Column --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                {field.description && (
                  <p className="text-[10px] text-gray-400 italic leading-tight">{field.description}</p>
                )}
              </div>
            ))}
          </div>

          {!isReady && (
            <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Please map all required fields (<strong>SKU</strong> and <strong>Quantity</strong>) to continue with the import.
              </p>
            </div>
          )}

          <div className="mt-8 flex gap-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-3">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isReady || isSubmitting}
              className="btn-primary flex-1 py-3 font-bold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Start Import <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
