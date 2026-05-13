import { useState, useEffect } from 'react';
import { Megaphone, Image as ImageIcon, Clock, Save, Trash2, Loader2, AlertCircle, Calendar } from 'lucide-react';
import useAnnouncementStore from '../../store/announcementStore.js';
import toast from 'react-hot-toast';

export default function AnnouncementManager() {
  const { announcements, fetchAnnouncements, createAnnouncement, deleteAnnouncement, isLoading } = useAnnouncementStore();
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    bannerImage: '',
    durationMinutes: '1440', // 1 day
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, bannerImage: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await createAnnouncement(formData);
    if (res.success) {
      toast.success(res.message);
      setFormData({ title: '', message: '', bannerImage: '', durationMinutes: '1440' });
    } else {
      toast.error(res.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      const res = await deleteAnnouncement(id);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Create New Announcement Form */}
      <div className="card p-6 border-2 border-primary-100 dark:border-primary-900/30">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-primary-600" /> Publish New Banner
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-4">
              <div>
                <label className="label">Announcement Title</label>
                <input 
                  type="text" 
                  placeholder="e.g., Prize for Top Seller!" 
                  className="input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Display Message</label>
                <textarea 
                  rows="3" 
                  placeholder="Describe the task or news..." 
                  className="input"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Banner Image (Optional)</label>
                <div 
                  className="mt-1 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-center hover:border-primary-400 transition-colors cursor-pointer relative group h-[115px] flex flex-col items-center justify-center overflow-hidden"
                  onClick={() => document.getElementById('banner-upload').click()}
                >
                  {formData.bannerImage ? (
                    <>
                      <img src={formData.bannerImage} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                      <div className="relative z-10 flex flex-col items-center">
                        <ImageIcon className="w-6 h-6 text-primary-600 mb-1" />
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-200">Change Image</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 text-gray-400 mb-2 group-hover:text-primary-500 transition-colors" />
                      <p className="text-xs text-gray-500 font-medium">Click to upload banner image (max 2MB)</p>
                    </>
                  )}
                  <input id="banner-upload" type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </div>
              </div>
              <div>
                <label className="label">Display Duration</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <select 
                    className="select pl-10"
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                  >
                    <option value="60">1 Hour</option>
                    <option value="180">3 Hours</option>
                    <option value="360">6 Hours</option>
                    <option value="720">12 Hours</option>
                    <option value="1440">1 Day</option>
                    <option value="2880">2 Days</option>
                    <option value="4320">3 Days</option>
                    <option value="10080">1 Week</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="btn-primary w-full py-4 rounded-2xl flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Publish Banner
          </button>
        </form>
      </div>

      {/* Announcements History */}
      <div className="space-y-4">
        <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
          <Calendar className="w-4 h-4" /> Announcement History
        </h3>
        
        {announcements.length === 0 ? (
          <div className="card p-10 text-center text-gray-400 italic text-sm">
            No history found. Create your first banner above.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {announcements.map((item) => (
              <div key={item._id} className="card p-5 flex items-center justify-between group">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${item.isActive && new Date(item.endTime) > new Date() ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                    <Megaphone className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-gray-900 dark:text-white truncate">{item.title}</h4>
                    <div className="flex items-center gap-3 text-[10px] text-gray-500 uppercase font-bold mt-1">
                      <span className={item.isActive && new Date(item.endTime) > new Date() ? 'text-green-600' : ''}>
                        {item.isActive && new Date(item.endTime) > new Date() ? 'Active' : 'Expired'}
                      </span>
                      <span>•</span>
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>By {item.createdBy?.fullName || 'Admin'}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(item._id)}
                  className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
