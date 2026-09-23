import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';
import {
  Users,
  Search,
  UserPlus,
  Shield,
  Filter,
  CheckCircle2,
  XCircle,
  X,
  Lock,
  Clock
} from 'lucide-react';

export const UserManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Selected User Drawer/Modal
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Provision User Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [roleInput, setRoleInput] = useState('analyst');
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await apiService.getAdminUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load admin users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (user: User) => {
    try {
      const updated = await apiService.updateAdminUser(user.id, { is_active: !user.is_active });
      if (selectedUser?.id === user.id) {
        setSelectedUser(updated);
      }
      await fetchUsers();
    } catch (err: any) {
      alert('Failed to update user status: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleChangeRole = async (user: User, newRole: string) => {
    try {
      const updated = await apiService.updateAdminUser(user.id, { role: newRole });
      if (selectedUser?.id === user.id) {
        setSelectedUser(updated);
      }
      await fetchUsers();
    } catch (err: any) {
      alert('Failed to update user role: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);

    try {
      await apiService.createAdminUser({
        full_name: nameInput,
        email: emailInput,
        password: passwordInput,
        role: roleInput
      });
      setIsCreateOpen(false);
      setNameInput('');
      setEmailInput('');
      setPasswordInput('');
      setRoleInput('analyst');
      await fetchUsers();
    } catch (err: any) {
      setCreateError(err.response?.data?.detail || 'Failed to provision user.');
    } finally {
      setCreating(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'ALL' && u.role.toLowerCase() !== roleFilter.toLowerCase()) return false;
    if (statusFilter === 'active' && !u.is_active) return false;
    if (statusFilter === 'inactive' && u.is_active) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (u.full_name || '').toLowerCase().includes(q);
      const matchEmail = u.email.toLowerCase().includes(q);
      const matchId = u.id.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchId) return false;
    }
    return true;
  });

  const totalUsers = users.length;
  const activeCount = users.filter((u) => u.is_active).length;
  const inactiveCount = totalUsers - activeCount;
  const userCount = users.filter((u) => u.role.toLowerCase() === 'user').length;
  const analystCount = users.filter((u) => u.role.toLowerCase() === 'analyst').length;
  const authorityCount = users.filter((u) => u.role.toLowerCase() === 'authority').length;
  const adminCount = users.filter((u) => u.role.toLowerCase() === 'admin').length;

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100 overflow-y-auto custom-scrollbar p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
              <Users className="w-5 h-5 text-cyan-400" />
              <span>User & Role Management</span>
            </h1>
            <span className="bg-cyan-500/10 text-cyan-400 text-[10px] font-semibold px-2 py-0.5 rounded border border-cyan-500/30">
              Account Provisioning & Governance
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage platform accounts, authorization roles, and account status across ThermalTrace AI.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="self-start md:self-auto flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>Provision Authorized User</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center space-y-1">
          <div className="text-[10px] text-slate-500 uppercase font-bold">Total Accounts</div>
          <div className="text-lg font-bold text-slate-100">{loading ? '...' : totalUsers}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center space-y-1">
          <div className="text-[10px] text-emerald-400 uppercase font-bold">Active</div>
          <div className="text-lg font-bold text-emerald-400">{loading ? '...' : activeCount}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center space-y-1">
          <div className="text-[10px] text-red-400 uppercase font-bold">Deactivated</div>
          <div className="text-lg font-bold text-red-400">{loading ? '...' : inactiveCount}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center space-y-1">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Public User</div>
          <div className="text-lg font-bold text-slate-200">{loading ? '...' : userCount}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center space-y-1">
          <div className="text-[10px] text-amber-400 uppercase font-bold">Analyst</div>
          <div className="text-lg font-bold text-amber-400">{loading ? '...' : analystCount}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center space-y-1">
          <div className="text-[10px] text-cyan-400 uppercase font-bold">Authority</div>
          <div className="text-lg font-bold text-cyan-400">{loading ? '...' : authorityCount}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center space-y-1">
          <div className="text-[10px] text-indigo-400 uppercase font-bold">Admin</div>
          <div className="text-lg font-bold text-indigo-400">{loading ? '...' : adminCount}</div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search accounts by Full Name, Email Address, or User ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-transparent text-slate-300 focus:outline-none text-xs uppercase"
            >
              <option value="ALL" className="bg-slate-900">All System Roles</option>
              <option value="user" className="bg-slate-900">USER</option>
              <option value="analyst" className="bg-slate-900">ANALYST</option>
              <option value="authority" className="bg-slate-900">AUTHORITY</option>
              <option value="admin" className="bg-slate-900">ADMIN</option>
            </select>
          </div>

          <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-300 focus:outline-none text-xs"
            >
              <option value="ALL" className="bg-slate-900">All Statuses</option>
              <option value="active" className="bg-slate-900">Active Accounts</option>
              <option value="inactive" className="bg-slate-900">Deactivated Accounts</option>
            </select>
          </div>
        </div>
      </div>

      {/* Account Management Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex-1">
        <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>Showing {filteredUsers.length} user accounts</span>
          <span>Role updates and activation changes take effect immediately</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/60 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-4">User ID</th>
                <th className="py-2.5 px-4">Full Name & Email</th>
                <th className="py-2.5 px-4">Role</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Created At</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Loading account management directory...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No accounts found matching filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrent = u.id === currentUser?.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">{u.id.substring(0, 12)}...</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-200 flex items-center space-x-1">
                          <span>{u.full_name || 'N/A'}</span>
                          {isCurrent && (
                            <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.2 rounded border border-amber-500/30">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={u.role.toLowerCase()}
                          onChange={(e) => handleChangeRole(u, e.target.value)}
                          className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] font-bold uppercase text-amber-400"
                        >
                          <option value="admin">ADMIN</option>
                          <option value="analyst">ANALYST</option>
                          <option value="authority">AUTHORITY</option>
                          <option value="user">USER</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            u.is_active
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-red-500/10 text-red-400 border-red-500/30'
                          }`}
                        >
                          {u.is_active ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => setSelectedUser(u)}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-2.5 py-1 rounded transition font-semibold"
                        >
                          Manage
                        </button>
                        <button
                          onClick={() => handleToggleStatus(u)}
                          disabled={isCurrent && u.is_active}
                          title={isCurrent && u.is_active ? 'You cannot deactivate your active account' : undefined}
                          className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                            u.is_active
                              ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 disabled:opacity-30 disabled:cursor-not-allowed'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Account Detail Drawer */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[600] flex justify-end">
          <div className="bg-slate-900 border-l border-slate-800 w-full sm:w-[450px] h-full p-6 space-y-6 overflow-y-auto custom-scrollbar flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Account Management</div>
                  <h3 className="text-base font-bold text-white">{selectedUser.full_name || 'N/A'}</h3>
                </div>
                <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">User ID:</span>
                  <span className="text-slate-200">{selectedUser.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email Address:</span>
                  <span className="text-slate-200">{selectedUser.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">System Role:</span>
                  <select
                    value={selectedUser.role.toLowerCase()}
                    onChange={(e) => handleChangeRole(selectedUser, e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-xs font-bold uppercase text-amber-400"
                  >
                    <option value="admin">ADMIN</option>
                    <option value="analyst">ANALYST</option>
                    <option value="authority">AUTHORITY</option>
                    <option value="user">USER</option>
                  </select>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Account Status:</span>
                  <span className={selectedUser.is_active ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                    {selectedUser.is_active ? 'ACTIVE' : 'DEACTIVATED'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Created At:</span>
                  <span className="text-slate-300">{new Date(selectedUser.created_at).toUTCString()}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-between space-x-2">
              <button
                onClick={() => handleToggleStatus(selectedUser)}
                disabled={selectedUser.id === currentUser?.id && selectedUser.is_active}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition ${
                  selectedUser.is_active
                    ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 disabled:opacity-30'
                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {selectedUser.is_active ? 'Deactivate Account' : 'Activate Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Provision User Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[650] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                <UserPlus className="w-4 h-4 text-amber-500" />
                <span>Provision Authorized User Account</span>
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {createError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="ramesh@thermaltrace.ai"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Assigned System Role</label>
                <select
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 font-bold uppercase text-amber-400"
                >
                  <option value="analyst">ANALYST — Operational Thermal Analyst</option>
                  <option value="authority">AUTHORITY — Regulatory Oversight Briefings</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Provision User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
