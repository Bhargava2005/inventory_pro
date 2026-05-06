import { useEffect, useState } from 'react';
import { User, Shield, Store, Loader2, Pencil, Trash2, X, Check, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import useUserStore from '../store/userStore.js';
import useStoreStore from '../store/storeStore.js';
import useAuthStore from '../store/authStore.js';

function UserEditModal({ user, onClose }) {
  const { stores, fetchStores } = useStoreStore();
  const { updateUser, createUser } = useUserStore();
  const [role, setRole] = useState(user?.role || 'staff');
  const [storeId, setStoreId] = useState(user?.storeId?._id || '');
  const [isActive, setIsActive] = useState(user ? user.isActive : true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchStores();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = user 
      ? await updateUser(user._id, { role, storeId, isActive })
      : await createUser({ fullName, email, username, password, role, storeId });
    
    setIsSubmitting(false);
    if (result.success) {
      toast.success(user ? 'User updated' : 'User created');
      onClose();
    } else {
      toast.error(result.message);
    }
  };

  const [email, setEmail] = useState(user?.email || '');
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [password, setPassword] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {user ? 'Edit User' : 'Add New Staff Member'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {!user && (
            <>
              <div>
                <label className="label">Full Name</label>
                <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" placeholder="John Doe" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Username</label>
                  <input required value={username} onChange={(e) => setUsername(e.target.value)} className="input" placeholder="johndoe" />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="john@example.com" />
                </div>
              </div>
              <div>
                <label className="label">Temporary Password</label>
                <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="••••••••" />
              </div>
            </>
          )}

          {user && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 mb-2">
              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 font-bold uppercase">
                {user.fullName.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{user.fullName}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Access Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="input">
                <option value="staff">Staff</option>
                <option value="manager">Manager</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div>
              <label className="label">Assigned Branch</label>
              <select value={storeId} onChange={(e) => setStoreId(e.target.value)} className="input">
                <option value="">No Store Assigned</option>
                {stores.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          {user && (
            <div className="flex items-center gap-2 py-2">
              <input type="checkbox" id="isActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 text-primary-600 rounded" />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Account</label>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (user ? 'Save Changes' : 'Create User')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const { users, fetchUsers, isLoading, deactivateUser } = useUserStore();
  const { user: currentUser } = useAuthStore();
  const [editUser, setEditUser] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to deactivate this account?')) {
      const result = await deactivateUser(id);
      if (result.success) toast.success('Account deactivated');
    }
  };

  const roleColors = {
    admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    staff: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Control staff access and store assignments</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowAddModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Staff
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">User</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Role</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Branch</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  {isAdmin && <th className="text-right px-6 py-4 font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold text-gray-600 dark:text-gray-400 uppercase">
                          {u.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{u.fullName} {u._id === currentUser.id && <span className="text-[10px] text-primary-600 font-normal ml-1">(You)</span>}</p>
                          <p className="text-xs text-gray-500 font-mono">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${roleColors[u.role]}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {u.storeId ? (
                        <div className="flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 opacity-50" />
                          {u.storeId.name}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {u.isActive ? (
                        <div className="flex items-center gap-1.5 text-green-600 text-xs font-medium">
                          <Check className="w-3.5 h-3.5" /> Active
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-red-500 text-xs font-medium">
                          <Shield className="w-3.5 h-3.5" /> Inactive
                        </div>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setEditUser(u)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500">
                            <Pencil className="w-4 h-4" />
                          </button>
                          {u._id !== currentUser.id && (
                            <button onClick={() => handleDelete(u._id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editUser && <UserEditModal user={editUser} onClose={() => setEditUser(null)} />}
      {showAddModal && <UserEditModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}
