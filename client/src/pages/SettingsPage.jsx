import { useEffect, useState } from 'react';
import { 
  Building2, Receipt, Package, Bell, Shield, 
  Save, Loader2, Globe, MapPin, Phone, Mail, 
  CreditCard, Banknote, Smartphone, Percent, Hash,
  AlertTriangle, Fingerprint, Box
} from 'lucide-react';
import toast from 'react-hot-toast';
import useSettingsStore from '../store/settingsStore.js';
import useAuthStore from '../store/authStore.js';
import AnnouncementManager from '../components/settings/AnnouncementManager.jsx';
import { Megaphone } from 'lucide-react';

export default function SettingsPage({ hideHeader }) {
  const { user } = useAuthStore();
  const { settings, fetchSettings, updateSettings, isLoading, isUpdating } = useSettingsStore();
  const [activeTab, setActiveTab] = useState('branding');
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await updateSettings(formData);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  if (isLoading || !formData) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const tabs = [
    { id: 'branding', label: 'Business Profile', icon: Building2 },
    { id: 'sales', label: 'Sales & Invoicing', icon: Receipt },
    { id: 'inventory', label: 'Inventory Logic', icon: Package },
    { id: 'notifications', label: 'Alerts', icon: Bell },
  ];

  // Only admin can manage announcements
  if (user?.role === 'admin') {
    tabs.push({ id: 'announcements', label: 'Announcements', icon: Megaphone });
  }

  return (
    <div className="max-w-4xl mx-auto pb-10 overflow-x-hidden">
      {!hideHeader && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-sm text-gray-500">Configure your store's identity and operational rules.</p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs — Optimized for Mobile */}
        <div className="w-full lg:w-64 sticky top-[68px] z-10 lg:static bg-gray-50 dark:bg-gray-950 lg:bg-transparent -mx-4 px-4 py-2 mb-2 lg:m-0 lg:p-0">
          <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible no-scrollbar pb-2 lg:pb-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-200 dark:shadow-none' 
                    : 'bg-white dark:bg-gray-900 text-gray-500 border border-gray-100 dark:border-gray-800 lg:bg-transparent lg:border-none'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {activeTab !== 'announcements' ? (
            <form onSubmit={handleSubmit} className="card p-6 lg:p-8 space-y-8 animate-fade-in">
            
            {activeTab === 'branding' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="col-span-full">
                    <label className="label">Business Name</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input 
                        type="text" 
                        className="input pl-10" 
                        value={formData.business.name} 
                        onChange={(e) => handleInputChange('business', 'name', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label">Contact Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input 
                        type="email" 
                        className="input pl-10" 
                        value={formData.business.email} 
                        onChange={(e) => handleInputChange('business', 'email', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input 
                        type="text" 
                        className="input pl-10" 
                        value={formData.business.phone} 
                        onChange={(e) => handleInputChange('business', 'phone', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-span-full">
                    <label className="label">Registered Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <textarea 
                        rows="3" 
                        className="input pl-10 pt-2" 
                        value={formData.business.address} 
                        onChange={(e) => handleInputChange('business', 'address', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label">Default Currency</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <select 
                        className="select pl-10" 
                        value={formData.business.currency} 
                        onChange={(e) => handleInputChange('business', 'currency', e.target.value)}
                      >
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="label">Tax ID / GST Number</label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input 
                        type="text" 
                        className="input pl-10" 
                        value={formData.business.taxId} 
                        onChange={(e) => handleInputChange('business', 'taxId', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'sales' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Invoice Prefix</label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input 
                        type="text" 
                        className="input pl-10" 
                        value={formData.sales.invoicePrefix} 
                        onChange={(e) => handleInputChange('sales', 'invoicePrefix', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label">Default Tax Rate (%)</label>
                    <div className="relative">
                      <Percent className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input 
                        type="number" 
                        className="input pl-10" 
                        value={formData.sales.defaultTax} 
                        onChange={(e) => handleInputChange('sales', 'defaultTax', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-span-full">
                    <label className="label">Terms & Conditions (Invoice Footer)</label>
                    <textarea 
                      rows="4" 
                      className="input" 
                      value={formData.sales.terms} 
                      onChange={(e) => handleInputChange('sales', 'terms', e.target.value)}
                    />
                  </div>
                  <div className="col-span-full">
                    <label className="label mb-3">Enabled Payment Methods</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'cash', label: 'Cash', icon: Banknote },
                        { id: 'card', label: 'Card', icon: CreditCard },
                        { id: 'upi', label: 'UPI / Digital', icon: Smartphone },
                      ].map(method => (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => handleInputChange('sales', 'defaultPaymentMethod', method.id)}
                          className={`flex-1 p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                            formData.sales.defaultPaymentMethod === method.id
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                              : 'border-gray-100 dark:border-gray-800 text-gray-500'
                          }`}
                        >
                          <method.icon size={20} />
                          <span className="text-xs font-bold">{method.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'inventory' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Low Stock Threshold (Global)</label>
                    <div className="relative">
                      <AlertTriangle className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input 
                        type="number" 
                        className="input pl-10" 
                        value={formData.inventory.lowStockThreshold} 
                        onChange={(e) => handleInputChange('inventory', 'lowStockThreshold', e.target.value)}
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">Default level to trigger low stock warnings.</p>
                  </div>
                  <div>
                    <label className="label">Default Unit</label>
                    <div className="relative">
                      <Box className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input 
                        type="text" 
                        className="input pl-10" 
                        value={formData.inventory.defaultUnit} 
                        onChange={(e) => handleInputChange('inventory', 'defaultUnit', e.target.value)}
                        placeholder="pcs, kg, box..."
                      />
                    </div>
                  </div>
                  <div className="col-span-full">
                    <label className="label">SKU Generation Pattern</label>
                    <div className="relative">
                      <Fingerprint className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input 
                        type="text" 
                        className="input pl-10" 
                        value={formData.inventory.skuPattern} 
                        onChange={(e) => handleInputChange('inventory', 'skuPattern', e.target.value)}
                        placeholder="PROD-{RAND4}"
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">Example: PROD-1234. Use {'{RAND4}'} for random digits.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">Low Stock Email Alerts</p>
                      <p className="text-xs text-gray-500">Get notified when products hit critical levels.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={formData.notifications.lowStockEmail}
                        onChange={(e) => handleInputChange('notifications', 'lowStockEmail', e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">Daily Sales Report</p>
                      <p className="text-xs text-gray-500">Receive a summary of sales at the end of each day via email.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={formData.notifications.dailyReportEmail}
                        onChange={(e) => handleInputChange('notifications', 'dailyReportEmail', e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">In-App Alerts</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl">
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">Inventory Alerts</p>
                          <p className="text-xs text-gray-500">Get notified inside the app when stock is low or adjusted.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={formData.notifications.inAppInventoryAlerts ?? true}
                            onChange={(e) => handleInputChange('notifications', 'inAppInventoryAlerts', e.target.checked)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl">
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">Sale Alerts</p>
                          <p className="text-xs text-gray-500">Get notified inside the app for new sales and transactions.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={formData.notifications.inAppSaleAlerts ?? true}
                            onChange={(e) => handleInputChange('notifications', 'inAppSaleAlerts', e.target.checked)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl">
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">Staff Alerts</p>
                          <p className="text-xs text-gray-500">Get notified inside the app for staff actions and logins.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={formData.notifications.inAppStaffAlerts ?? true}
                            onChange={(e) => handleInputChange('notifications', 'inAppStaffAlerts', e.target.checked)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

              <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                <button 
                  type="submit" 
                  disabled={isUpdating}
                  className="btn-primary w-full py-4 rounded-2xl flex items-center justify-center gap-2"
                >
                  {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Save Settings
                </button>
              </div>
            </form>
          ) : (
            <div className="animate-fade-in">
              {user?.role === 'admin' && <AnnouncementManager />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
