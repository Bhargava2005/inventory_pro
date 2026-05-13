import { useState, useEffect } from 'react';
import { X, Check, AlertCircle, Loader2 } from 'lucide-react';

const SYSTEM_FIELDS = [
  { key: 'name', label: 'Product Name', required: true },
  { key: 'sku', label: 'SKU / ID', required: false },
  { key: 'brand', label: 'Brand / Manufacturer', required: false },
  { key: 'categoryName', label: 'Category', required: false },
  { key: 'price', label: 'Selling Price', required: true },
  { key: 'costPrice', label: 'Cost Price', required: false },
  { key: 'quantity', label: 'Initial Stock (Main)', required: false },
  { key: 'unit', label: 'Unit (pcs, box, etc.)', required: false },
  { key: 'minStockLevel', label: 'Low Stock Alert Level', required: false },
  { key: 'supplier', label: 'Supplier Name', required: false },
  { key: 'color', label: 'Hex Color (#...)', required: false },
  { key: 'image', label: 'Image URL', required: false },
  { key: 'description', label: 'Description', required: false },
  // Stock-state fields
  { key: 'damagedStock', label: 'Damaged Units', required: false, group: 'stock-state' },
  { key: 'sampleStock', label: 'Sample Units', required: false, group: 'stock-state' },
  { key: 'exchangedStock', label: 'Exchanged Units', required: false, group: 'stock-state' },
  { key: 'wrongProductStock', label: 'Wrong Product Units', required: false, group: 'stock-state' },
];

export default function ImportMappingModal({ headers, onConfirm, onClose, isSubmitting }) {
  const [mapping, setMapping] = useState({});

  // Smart matching logic
  useEffect(() => {
    const initialMapping = {};
    const headerNames = headers.map(h => h.name.toLowerCase());

    SYSTEM_FIELDS.forEach(field => {
      const fieldKey = field.key.toLowerCase();
      const fieldLabel = field.label.toLowerCase();

      // Look for direct or partial matches
      const match = headers.find(h => {
        const hName = h.name.toLowerCase();
        return (
          hName === fieldKey ||
          hName === fieldLabel ||
          hName.includes(fieldKey) ||
          fieldLabel.includes(hName)
        );
      });

      if (match) {
        initialMapping[field.key] = match.name;
      } else {
        initialMapping[field.key] = '';
      }
    });

    setMapping(initialMapping);
  }, [headers]);

  const handleSelect = (fieldKey, headerName) => {
    setMapping(prev => ({ ...prev, [fieldKey]: headerName }));
  };

  const isValid = SYSTEM_FIELDS.every(f => !f.required || mapping[f.key]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-xl animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Map Your Columns</h2>
            <p className="text-xs text-gray-500 mt-0.5">Tell us which column in your file matches our fields.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
          <div className="space-y-3">
            {SYSTEM_FIELDS.map((field, idx) => {
              // Show a section header before the first stock-state field
              const isFirstStockState = field.group === 'stock-state' && SYSTEM_FIELDS[idx - 1]?.group !== 'stock-state';
              return (
                <div key={field.key}>
                  {isFirstStockState && (
                    <div className="flex items-center gap-2 pt-2 pb-1">
                      <hr className="flex-1 border-gray-200 dark:border-gray-700" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Stock-State Fields (Optional)</span>
                      <hr className="flex-1 border-gray-200 dark:border-gray-700" />
                    </div>
                  )}
                  <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border ${field.group === 'stock-state' ? 'border-amber-100 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-900/10' : 'border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30'}`}>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </p>
                      <p className="text-xs text-gray-400">{field.group === 'stock-state' ? 'Stock-state field' : 'System field'}</p>
                    </div>

                    <div className="flex-1 w-full sm:max-w-xs">
                      <select
                        value={mapping[field.key]}
                        onChange={(e) => handleSelect(field.key, e.target.value)}
                        className={`input text-sm h-10 ${field.required && !mapping[field.key] ? 'border-red-300 bg-red-50/30' : ''}`}
                      >
                        <option value="">-- Select Column --</option>
                        {headers.map((h) => (
                          <option key={h.index} value={h.name}>{h.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-3">
          {SYSTEM_FIELDS.some(f => !mapping[f.key]) && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Unmapped Fields Detected</span>
              </div>
              <p className="text-[10px] text-amber-500 dark:text-amber-500/70 leading-relaxed">
                The following fields will be set to defaults: {' '}
                {SYSTEM_FIELDS.filter(f => !mapping[f.key]).map(f => f.label).join(', ')}
              </p>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3">
            {!isValid && (
              <div className="flex items-center gap-2 text-xs text-red-500 mr-auto py-2 font-bold">
                <AlertCircle className="w-4 h-4" />
                <span>Map required fields (*) to continue</span>
              </div>
            )}
            <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={() => onConfirm(mapping)}
              disabled={!isValid || isSubmitting}
              className="btn-primary flex-1 h-11"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
              ) : (
                <><Check className="w-4 h-4" /> Start Import</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
