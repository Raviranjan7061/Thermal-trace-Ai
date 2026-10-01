import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { FeedbackItem, FeedbackSummary } from '../types';
import {
  Inbox,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  RefreshCw,
  Image as ImageIcon,
  MessageSquare,
  X,
  ChevronRight,
  ShieldAlert,
  Send
} from 'lucide-react';

export const AdminFeedbackPage: React.FC = () => {
  const [summary, setSummary] = useState<FeedbackSummary | null>(null);
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Detail Modal & Status Edit State
  const [selectedItem, setSelectedItem] = useState<FeedbackItem | null>(null);
  const [newStatus, setNewStatus] = useState<string>('NEW');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);

  // Image Modal
  const [viewImage, setViewImage] = useState<string | null>(null);

  const fetchFeedbackData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, itemsRes] = await Promise.all([
        apiService.getAdminFeedbackSummary(),
        apiService.getAdminFeedbackInbox()
      ]);
      setSummary(sumRes);
      setItems(itemsRes);
    } catch (err: any) {
      console.error('Failed to fetch admin feedback inbox:', err);
      setError('Failed to load feedback inbox data. Make sure you are signed in as an Admin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbackData();
  }, []);

  const openDetailModal = (item: FeedbackItem) => {
    setSelectedItem(item);
    setNewStatus(item.status);
    setAdminNotes(item.admin_notes || '');
    setUpdateMsg(null);
  };

  const handleUpdateStatus = async () => {
    if (!selectedItem) return;
    setUpdating(true);
    setUpdateMsg(null);
    try {
      const updated = await apiService.updateFeedbackStatus(selectedItem.id, {
        status: newStatus,
        admin_notes: adminNotes.trim() || undefined,
      });

      setSelectedItem(updated);
      setUpdateMsg('Status updated successfully.');
      
      // Refresh inbox list & summary
      fetchFeedbackData();
    } catch (err: any) {
      console.error('Failed to update feedback status:', err);
      setUpdateMsg('Error updating status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const filteredItems = items.filter((item) => {
    if (statusFilter !== 'ALL' && item.status.toUpperCase() !== statusFilter) return false;
    if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
    return true;
  });

  const getPriorityBadgeClass = (p: string) => {
    switch (p.toLowerCase()) {
      case 'high':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'medium':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default:
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Resolved
          </span>
        );
      case 'IN_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Clock className="w-3 h-3" /> In Review
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <MessageSquare className="w-3 h-3" /> New
          </span>
        );
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto custom-scrollbar overflow-y-auto h-full text-slate-900 dark:text-slate-100 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Inbox className="w-5 h-5 text-orange-500" />
            Admin Feedback & Issue Inbox
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Review user-submitted bug reports, data accuracy issues, and feature requests.
          </p>
        </div>
        <button
          onClick={fetchFeedbackData}
          disabled={loading}
          className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Inbox
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Total Submissions</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{summary?.total ?? 0}</h3>
          </div>
          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300">
            <Inbox className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">New Items</p>
            <h3 className="text-2xl font-bold text-blue-500 mt-1">{summary?.new_count ?? 0}</h3>
          </div>
          <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">In Review</p>
            <h3 className="text-2xl font-bold text-amber-500 mt-1">{summary?.in_review_count ?? 0}</h3>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-lg text-amber-500">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Resolved</p>
            <h3 className="text-2xl font-bold text-emerald-500 mt-1">{summary?.resolved_count ?? 0}</h3>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-500">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <Filter className="w-4 h-4 text-orange-500" /> Filter Inbox:
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">New</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="Bug Report">Bug Report</option>
              <option value="UI/UX Issue">UI/UX Issue</option>
              <option value="Data Accuracy Issue">Data Accuracy Issue</option>
              <option value="Feature Suggestion">Feature Suggestion</option>
              <option value="Performance Issue">Performance Issue</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inbox Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Loading feedback inbox items...</div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center">
          <Inbox className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            {items.length === 0 ? 'No feedback has been submitted yet.' : 'No feedback matches the selected filters.'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {items.length === 0
              ? 'When authenticated users submit issues or feature requests, they will populate this real-time inbox.'
              : 'Try clearing your category or status filters to view all entries.'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="p-3">Submitter</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Title & Summary</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Submitted At</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => openDetailModal(item)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="p-3 font-medium text-slate-900 dark:text-white">
                      <div className="flex flex-col">
                        <span>{item.submitter_email}</span>
                        <span className="text-[10px] uppercase text-orange-500 font-semibold">{item.submitter_role}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-3 font-medium max-w-xs truncate">
                      <div className="flex items-center gap-1.5">
                        {item.screenshot_data && <ImageIcon className="w-3.5 h-3.5 text-orange-500 shrink-0" />}
                        <span className="truncate">{item.title}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getPriorityBadgeClass(item.priority)}`}>
                        {item.priority}
                      </span>
                    </td>
                    <td className="p-3">{getStatusBadge(item.status)}</td>
                    <td className="p-3 text-slate-400 text-[11px]">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right">
                      <button className="text-orange-500 hover:text-orange-400 font-semibold flex items-center gap-1 justify-end ml-auto">
                        Review <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail & Status Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setSelectedItem(null)}>
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                    {selectedItem.category}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getPriorityBadgeClass(selectedItem.priority)}`}>
                    {selectedItem.priority} Priority
                  </span>
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white mt-1">{selectedItem.title}</h2>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Submitter Info */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Submitter Email:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{selectedItem.submitter_email}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Submitter Role:</span>
                <span className="font-semibold text-orange-500 uppercase">{selectedItem.submitter_role}</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-xs font-semibold text-slate-900 dark:text-white mb-1">Issue Description</h4>
              <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap bg-slate-50 dark:bg-slate-800/30 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                {selectedItem.description}
              </p>
            </div>

            {/* Screenshot */}
            {selectedItem.screenshot_data && (
              <div>
                <h4 className="text-xs font-semibold text-slate-900 dark:text-white mb-2">Attached Screenshot</h4>
                <div
                  className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 max-h-60 flex items-center justify-center cursor-pointer"
                  onClick={() => setViewImage(selectedItem.screenshot_data || null)}
                >
                  <img
                    src={selectedItem.screenshot_data}
                    alt="Attached Screenshot"
                    className="max-h-60 object-contain"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-semibold gap-1.5">
                    <ImageIcon className="w-4 h-4" /> Click to enlarge
                  </div>
                </div>
              </div>
            )}

            {/* Admin Workflow Status Controls */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
              <h4 className="text-xs font-semibold text-slate-900 dark:text-white">Admin Workflow Action</h4>

              {updateMsg && (
                <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  updateMsg.includes('Error') ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                }`}>
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{updateMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Update Workflow Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-orange-500 focus:outline-none font-semibold"
                  >
                    <option value="NEW">NEW (Unreviewed)</option>
                    <option value="IN_REVIEW">IN_REVIEW (Under Investigation)</option>
                    <option value="RESOLVED">RESOLVED (Completed / Addressed)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Admin Response Notes
                  </label>
                  <textarea
                    rows={2}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Enter notes visible to the submitter regarding resolution or progress..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-orange-500 focus:outline-none resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleUpdateStatus}
                  disabled={updating}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 disabled:opacity-50 transition-colors"
                >
                  {updating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" /> Save Workflow Update
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enlarge Image Modal */}
      {viewImage && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setViewImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setViewImage(null)}
              className="absolute top-3 right-3 p-2 text-white bg-slate-800/80 hover:bg-slate-700 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={viewImage} alt="Feedback Screenshot Full" className="max-w-full max-h-[85vh] object-contain" />
          </div>
        </div>
      )}
    </div>
  );
};
