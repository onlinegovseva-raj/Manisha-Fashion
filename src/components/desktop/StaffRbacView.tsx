import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Users, 
  UserPlus, 
  Check, 
  X, 
  Lock, 
  ShieldAlert, 
  KeyRound 
} from 'lucide-react';
import { StaffUser, UserRole, UserPermission } from '../../types';
import { ROLE_PERMISSIONS } from '../../data/sampleData';
import { storage } from '../../services/storage';

interface StaffRbacViewProps {
  staffList: StaffUser[];
  currentUser: StaffUser;
  onRefresh: () => void;
}

export const StaffRbacView: React.FC<StaffRbacViewProps> = ({
  staffList,
  currentUser,
  onRefresh,
}) => {
  const isOwner = currentUser.role === 'OWNER';
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<UserRole>('CATALOG_STAFF');

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffEmail.trim()) return;

    const newStaff: StaffUser = {
      id: `usr_${Date.now()}`,
      name: newStaffName.trim(),
      email: newStaffEmail.trim(),
      phone: newStaffPhone.trim() || undefined,
      role: newStaffRole,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    storage.saveStaffUser(newStaff);
    setIsAddModalOpen(false);
    setNewStaffName('');
    setNewStaffEmail('');
    setNewStaffPhone('');
    onRefresh();
  };

  const permissionKeys: { key: keyof UserPermission; label: string; desc: string }[] = [
    { key: 'can_edit_products', label: 'Create & Edit Products', desc: 'Add new shirt styles, edit variants, change descriptions' },
    { key: 'can_view_cost_price', label: 'View Purchase Cost', desc: 'Confidential factory purchase prices & gross margins' },
    { key: 'can_edit_stock', label: 'Adjust Inventory', desc: 'Manual physical inventory audit and stock updates' },
    { key: 'can_manage_orders', label: 'Manage Orders', desc: 'Process customer orders and change statuses' },
    { key: 'can_dispatch', label: 'Courier Dispatch', desc: 'Generate AWB, assign BlueDart/Delhivery, and print slips' },
    { key: 'can_view_reports', label: 'Financial Reports', desc: 'P&L, gross profit margins, inventory valuation' },
    { key: 'can_manage_staff', label: 'Manage Staff Roles', desc: 'Create employee accounts and assign access roles' },
    { key: 'can_export_backup', label: 'Export Database Backups', desc: 'Full JSON / CSV database export and restore' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-4 rounded-lg border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-600" />
            <h2 className="text-xl font-bold text-stone-900">Staff Accounts & Role-Based Access Control (RBAC)</h2>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Strict least-privilege security matrix ensuring staff only access features required for their designated tasks.
          </p>
        </div>

        {isOwner && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-bold flex items-center gap-1.5 shadow"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Staff Account</span>
          </button>
        )}
      </div>

      {!isOwner && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 flex items-center gap-2">
          <Lock className="w-4 h-4 shrink-0" />
          <span>
            You are logged in as <strong>{currentUser.role}</strong>. Only the Owner can modify staff assignments or create new credentials.
          </span>
        </div>
      )}

      {/* Staff Directory Table */}
      <div className="bg-white rounded-lg border border-stone-200 overflow-hidden shadow-xs">
        <div className="p-3 border-b border-stone-200 bg-stone-50 font-bold text-xs text-stone-700 uppercase">
          Authorized Staff Users
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase text-[11px]">
              <tr>
                <th className="px-4 py-3">Employee Name</th>
                <th className="px-3 py-3">Email Address</th>
                <th className="px-3 py-3">Contact Phone</th>
                <th className="px-3 py-3">Assigned Role</th>
                <th className="px-3 py-3">Account Status</th>
                <th className="px-4 py-3 text-right">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {staffList.map((user) => (
                <tr key={user.id} className="hover:bg-stone-50/50">
                  <td className="px-4 py-3 font-bold text-stone-900 flex items-center gap-2">
                    <span>{user.name}</span>
                    {user.id === currentUser.id && (
                      <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded font-bold">
                        YOU
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-stone-600 font-mono">{user.email}</td>
                  <td className="px-3 py-3 text-stone-600">{user.phone || '—'}</td>
                  <td className="px-3 py-3">
                    <span className="font-semibold bg-stone-100 text-stone-800 px-2 py-0.5 rounded text-[11px]">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1">
                      <Check className="w-3 h-3" /> Active
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-stone-500 text-[11px]">
                    {new Date(user.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permissions Matrix */}
      <div className="bg-white rounded-lg border border-stone-200 overflow-hidden shadow-xs">
        <div className="p-3 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <span className="font-bold text-xs text-stone-700 uppercase">
            Role-Based Permissions Matrix
          </span>
          <span className="text-[11px] text-stone-500">
            Enforced across both desktop UI and backend API controllers
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase text-[10px]">
              <tr>
                <th className="px-4 py-3">Permission Capability</th>
                <th className="px-3 py-3 text-center">OWNER</th>
                <th className="px-3 py-3 text-center">MANAGER</th>
                <th className="px-3 py-3 text-center">CATALOG_STAFF</th>
                <th className="px-3 py-3 text-center">DISPATCHER</th>
                <th className="px-3 py-3 text-center">CASHIER</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {permissionKeys.map((p) => (
                <tr key={p.key} className="hover:bg-stone-50/50">
                  <td className="px-4 py-2.5">
                    <span className="font-bold text-stone-900 block">{p.label}</span>
                    <span className="text-[10px] text-stone-500">{p.desc}</span>
                  </td>
                  {(['OWNER', 'MANAGER', 'CATALOG_STAFF', 'DISPATCHER', 'CASHIER'] as UserRole[]).map(
                    (role) => {
                      const hasPerm = ROLE_PERMISSIONS[role][p.key];
                      return (
                        <td key={role} className="px-3 py-2.5 text-center">
                          {hasPerm ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-stone-100 text-stone-400">
                              <X className="w-3 h-3" />
                            </span>
                          )}
                        </td>
                      );
                    }
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <h3 className="text-base font-bold text-stone-900">Add New Staff Member</h3>
            <p className="text-xs text-stone-500 mt-1">
              Create credentials with least-privilege role assignment.
            </p>

            <form onSubmit={handleCreateStaff} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="e.g. Ramesh Joshi"
                  className="w-full border border-stone-300 rounded p-2 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 uppercase mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  placeholder="ramesh@manishafashion.com"
                  className="w-full border border-stone-300 rounded p-2 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 uppercase mb-1">Mobile Phone</label>
                <input
                  type="text"
                  value={newStaffPhone}
                  onChange={(e) => setNewStaffPhone(e.target.value)}
                  placeholder="+91 98200 12345"
                  className="w-full border border-stone-300 rounded p-2 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 uppercase mb-1">Role Designation</label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value as UserRole)}
                  className="w-full border border-stone-300 rounded p-2 focus:outline-none font-medium"
                >
                  <option value="CATALOG_STAFF">CATALOG_STAFF (Photos & Descriptions)</option>
                  <option value="DISPATCHER">DISPATCHER (Logistics & Labels)</option>
                  <option value="CASHIER">CASHIER (Orders & Invoicing)</option>
                  <option value="MANAGER">MANAGER (Operations & Inventory)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 border border-stone-300 rounded text-stone-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded shadow"
                >
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
