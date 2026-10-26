import React, { useState } from 'react';
import { 
  RefreshCw, 
  Database, 
  Download, 
  Upload, 
  AlertTriangle, 
  CheckCircle2, 
  Wifi, 
  WifiOff, 
  Clock, 
  Layers, 
  ShieldCheck, 
  FileJson 
} from 'lucide-react';
import { SyncOutboxItem, StaffUser } from '../../types';
import { storage } from '../../services/storage';

interface SyncBackupViewProps {
  currentUser: StaffUser;
  isOnline: boolean;
  onRefresh: () => void;
}

export const SyncBackupView: React.FC<SyncBackupViewProps> = ({
  currentUser,
  isOnline,
  onRefresh,
}) => {
  const permissions = storage.getUserPermissions(currentUser.role);
  const outbox = storage.getOutbox();
  const lastSyncTime = storage.getLastSyncTime();

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [restoreNotice, setRestoreNotice] = useState<string | null>(null);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await storage.runSync();
      if (res.errors.length > 0) {
        setSyncFeedback(`Sync completed with issues: ${res.errors.join('; ')}`);
      } else {
        setSyncFeedback(`Synchronization complete! ${res.syncedCount} mutations pushed to cloud database.`);
      }
      onRefresh();
    } catch (e: any) {
      setSyncFeedback(`Sync failed: ${e.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResolveConflict = (outboxId: string, choice: 'KEEP_LOCAL' | 'OVERWRITE_WITH_SERVER') => {
    storage.resolveConflict(outboxId, choice);
    setSyncFeedback(`Conflict for item ${outboxId} resolved via ${choice}.`);
    onRefresh();
  };

  // Full Database Backup Export
  const handleExportBackup = () => {
    const jsonString = storage.createBackupJSON();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Manisha_Fashion_Backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    link.click();
  };

  // Full Database Restore Import
  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('CAUTION: Restoring a backup will overwrite current local database tables. Proceed?')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = storage.restoreFromJSON(content);
      if (res.success) {
        setRestoreNotice(res.message);
        onRefresh();
      } else {
        setRestoreNotice(`Restore failed: ${res.message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-4 rounded-lg border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-amber-600" />
            <h2 className="text-xl font-bold text-stone-900">Offline Synchronization & Data Backups</h2>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Reliable offline queue, conflict resolution rules, and complete zero-license database backup/restore.
          </p>
        </div>

        <button
          onClick={handleManualSync}
          disabled={!isOnline || isSyncing}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-bold flex items-center gap-2 shadow disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Synchronizing...' : 'Run Sync Now'}</span>
        </button>
      </div>

      {syncFeedback && (
        <div className="p-3 bg-stone-900 text-stone-100 rounded-md text-xs flex items-center justify-between">
          <span>{syncFeedback}</span>
          <button onClick={() => setSyncFeedback(null)} className="text-stone-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Sync Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-stone-500 uppercase">
            <span>Network Link</span>
            {isOnline ? <Wifi className="w-4 h-4 text-emerald-600" /> : <WifiOff className="w-4 h-4 text-rose-600" />}
          </div>
          <p className="text-lg font-bold text-stone-900 mt-2">
            {isOnline ? 'Online (Cloud Connected)' : 'Offline (Local Only)'}
          </p>
          <p className="text-xs text-stone-500 mt-1">
            {isOnline ? 'Mutations sync to PostgreSQL' : 'Mutations safely held in local Outbox'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-stone-500 uppercase">
            <span>Pending Outbox</span>
            <Layers className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-lg font-bold text-stone-900 mt-2">
            {outbox.length} <span className="text-xs font-normal text-stone-500">queued mutations</span>
          </p>
          <p className="text-xs text-stone-500 mt-1">
            {outbox.length === 0 ? 'All local records in sync' : 'Will sync immediately when online'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-stone-500 uppercase">
            <span>Last Successful Sync</span>
            <Clock className="w-4 h-4 text-stone-500" />
          </div>
          <p className="text-sm font-bold text-stone-900 mt-2">
            {new Date(lastSyncTime).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </p>
          <p className="text-xs text-stone-500 mt-1">
            {new Date(lastSyncTime).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Outbox Queue Table */}
      <div className="bg-white rounded-lg border border-stone-200 overflow-hidden shadow-xs">
        <div className="p-3 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <span className="font-bold text-xs text-stone-700 uppercase">
            Pending Outbox Queue ({outbox.length})
          </span>
          {outbox.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Clear local outbox queue?')) {
                  storage.clearOutbox();
                  onRefresh();
                }
              }}
              className="text-rose-600 hover:text-rose-800 text-[11px] font-semibold"
            >
              Clear Outbox
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase text-[10px]">
              <tr>
                <th className="px-4 py-3">Queued Time</th>
                <th className="px-3 py-3">Entity</th>
                <th className="px-3 py-3">Action</th>
                <th className="px-3 py-3">Details</th>
                <th className="px-3 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Conflict Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {outbox.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-stone-400">
                    No pending mutations in the outbox. Local state is clean and synchronized!
                  </td>
                </tr>
              ) : (
                outbox.map((item) => (
                  <tr key={item.id} className="hover:bg-stone-50/50">
                    <td className="px-4 py-3 font-mono text-[11px] text-stone-500">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-3 py-3 font-bold text-stone-800">{item.entity_type}</td>
                    <td className="px-3 py-3 font-semibold text-stone-600">{item.action}</td>
                    <td className="px-3 py-3 font-mono text-[11px] text-stone-600 max-w-xs truncate">
                      {JSON.stringify(item.payload)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          item.status === 'CONFLICT'
                            ? 'bg-rose-100 text-rose-800'
                            : item.status === 'QUEUED'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {item.status === 'CONFLICT' ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleResolveConflict(item.id, 'KEEP_LOCAL')}
                            className="px-2 py-0.5 bg-stone-800 text-white rounded text-[10px] font-semibold"
                          >
                            Keep Local
                          </button>
                          <button
                            onClick={() => handleResolveConflict(item.id, 'OVERWRITE_WITH_SERVER')}
                            className="px-2 py-0.5 bg-stone-200 text-stone-800 rounded text-[10px] font-semibold"
                          >
                            Use Server
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-stone-400">Pending Online Sync</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Database Backup & Restore Tool */}
      <div className="bg-white rounded-lg border border-stone-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-stone-700" />
            <h3 className="font-bold text-stone-900 text-xs uppercase tracking-wider">
              Zero-License Local Disaster Recovery & Backup
            </h3>
          </div>
          <span className="text-xs text-stone-500 font-mono">Format: JSON Snapshot</span>
        </div>

        <p className="text-xs text-stone-600 leading-relaxed">
          Regular backups protect Manisha Fashion against hard drive failure or accidental device damage. Backups include full products, variant inventory matrices, orders, staff, and stock audit ledgers.
        </p>

        {restoreNotice && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 font-medium">
            {restoreNotice}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          {permissions.can_export_backup && (
            <button
              onClick={handleExportBackup}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded text-xs font-bold flex items-center gap-2 shadow"
            >
              <Download className="w-4 h-4" />
              <span>Download Full Database Snapshot (.json)</span>
            </button>
          )}

          {permissions.can_export_backup && (
            <label className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded text-xs font-bold flex items-center gap-2 cursor-pointer border border-stone-300">
              <Upload className="w-4 h-4 text-stone-600" />
              <span>Restore from Backup File</span>
              <input type="file" accept=".json" onChange={handleRestoreFile} className="hidden" />
            </label>
          )}
        </div>
      </div>
    </div>
  );
};
