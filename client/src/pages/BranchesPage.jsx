import { useEffect, useState } from 'react';
import { Plus, MapPin, Phone, Mail, Store, Pencil, Trash2, Loader2, X, Users, UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import useBranchStore from '../store/branchStore.js';
import useUserStore from '../store/userStore.js';
import useAuthStore from '../store/authStore.js';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  code: z.string().min(2, 'Code must be at least 2 characters'),
  location: z.string().min(2, 'Location is required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
});

function BranchModal({ branch, onClose }) {
  const { createBranch, updateBranch } = useBranchStore();
  const isEdit = !!branch;

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: branch || {},
  });

  const onSubmit = async (data) => {
    const result = isEdit 
      ? await updateBranch(branch._id, data)
      : await createBranch(data);
    
    if (result.success) {
      toast.success(isEdit ? 'Branch updated' : 'Branch created');
      onClose();
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Branch' : 'Add New Branch'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="label">Branch Name</label>
            <input {...register('name')} className={`input ${errors.name ? 'border-red-500' : ''}`} placeholder="Main Branch" />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="label">Branch Code</label>
            <input {...register('code')} className={`input ${errors.code ? 'border-red-500' : ''}`} placeholder="BR-01" />
            {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code.message}</p>}
          </div>
          <div>
            <label className="label">Location</label>
            <input {...register('location')} className="input" placeholder="City, Area" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Phone</label>
              <input {...register('phone')} className="input" placeholder="+1..." />
            </div>
            <div>
              <label className="label">Email</label>
              <input {...register('email')} className="input" placeholder="branch@example.com" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">
              {isEdit ? 'Save Changes' : 'Create Branch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function BranchesPage({ hideHeader }) {
  const { branches, fetchBranches, isLoading, deactivateBranch } = useBranchStore();
  const { users, fetchUsers } = useUserStore();
  const { user } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [editBranch, setEditBranch] = useState(null);
  const [viewStaff, setViewStaff] = useState(null);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchBranches();
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to deactivate this branch?')) {
      const result = await deactivateBranch(id);
      if (result.success) toast.success('Branch deactivated');
    }
  };

  return (
    <div>
      {!hideHeader && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Branches & Stores</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage your business locations</p>
          </div>
          {isAdmin && (
            <button onClick={() => { setEditBranch(null); setShowModal(true); }} className="btn-primary">
              <Plus className="w-4 h-4" /> Add Branch
            </button>
          )}
        </div>
      )}

      {hideHeader && isAdmin && (
        <div className="flex justify-end mb-4">
          <button onClick={() => { setEditBranch(null); setShowModal(true); }} className="btn-primary text-xs py-2">
            <Plus className="w-3.5 h-3.5" /> Add Branch
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches.map((branch) => (
            <div key={branch._id} className="card p-5 group hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400">
                  <Store className="w-6 h-6" />
                </div>
                {isAdmin && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditBranch(branch); setShowModal(true); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(branch._id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-900 dark:text-white">{branch.name}</h3>
                  <span className="text-[10px] font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-500 uppercase">{branch.code}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <MapPin className="w-3.5 h-3.5" />
                    {branch.location}
                  </div>
                  {branch.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Phone className="w-3.5 h-3.5" />
                      {branch.phone}
                    </div>
                  )}
                </div>
              </div>

              {/* Staff Count Mini Info */}
              <button 
                onClick={() => setViewStaff(branch)}
                className="w-full flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 mb-4 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors group/staff"
              >
                <div className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                  <Users className="w-3.5 h-3.5 group-hover/staff:text-primary-500" />
                  <span>Branch Staff</span>
                </div>
                <span className="text-xs font-bold text-primary-600">
                  {users.filter(u => u.branchId?._id === branch._id).length} Active
                </span>
              </button>
              <div className="pt-4 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold uppercase">
                    {branch.manager?.fullName?.charAt(0) || '?'}
                  </div>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    {branch.manager?.fullName || 'No Manager Assigned'}
                  </span>
                </div>
                {!branch.isActive && <span className="badge badge-red">Inactive</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <BranchModal branch={editBranch} onClose={() => setShowModal(false)} />}

      {/* View Staff Modal */}
      {viewStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{viewStaff.name} Staff</h2>
                <p className="text-xs text-gray-500">Managing staff for branch {viewStaff.code}</p>
              </div>
              <button onClick={() => setViewStaff(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {users.filter(u => u.branchId?._id === viewStaff._id).length === 0 ? (
                <div className="text-center py-10">
                  <UserPlus className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400 italic">No staff assigned to this branch yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                  {users.filter(u => u.branchId?._id === viewStaff._id).map(staff => (
                    <div key={staff._id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-[10px] font-bold text-primary-600 uppercase">
                          {staff.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{staff.fullName}</p>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider">{staff.role}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${staff.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {staff.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl border-t border-gray-100 dark:border-gray-800 text-center">
              <p className="text-xs text-gray-500">To manage or move staff, please use the <a href="/users" className="text-primary-600 font-bold hover:underline">User Management</a> page.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
