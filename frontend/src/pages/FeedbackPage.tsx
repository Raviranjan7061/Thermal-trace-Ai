import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { FeedbackItem } from '../types';
import { MessageSquare, Paperclip, Send, Clock, CheckCircle2, AlertCircle, Image as ImageIcon, X, RefreshCw } from 'lucide-react';

export const FeedbackPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'submit' | 'history'>('submit');
  
  // Form State
  const [category, setCategory] = useState('Bug Report');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [screenshotData, setScreenshotData] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState<string>('');
  
  // UI State
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // History State
  const [myFeedback, setMyFeedback] = useState<FeedbackItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const items = await apiService.getMyFeedback();
      setMyFeedback(items);
    } catch (err: any) {
      console.error('Failed to fetch user feedback history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setSubmitError('Screenshot image must be smaller than 5MB.');
      return;
    }

    setScreenshotName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshotData(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeScreenshot = () => {
    setScreenshotData(null);
    setScreenshotName('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!title.trim()) {
      setSubmitError('Please provide a title for your feedback.');
      return;
    }
    if (!description.trim()) {
      setSubmitError('Please provide a description of the issue or feedback.');
      return;
    }

    setSubmitting(true);
    try {
      await apiService.submitFeedback({
        category,
        title: title.trim(),
        description: description.trim(),
        priority,
        screenshot_data: screenshotData || undefined,
      });

      setSubmitSuccess('Thank you! Your feedback has been submitted successfully.');
      setTitle('');
      setDescription('');
      setPriority('Medium');
      setScreenshotData(null);
      setScreenshotName('');
      
      // Refresh history in background
      fetchHistory();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to submit feedback. Please try again.';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
          </span>
        );
      case 'IN_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" /> In Review
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <MessageSquare className="w-3.5 h-3.5" /> New
          </span>
        );
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto custom-scrollbar overflow-y-auto h-full text-slate-900 dark:text-slate-100 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-orange-500" />
            Feedback & Issue Reporting
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Submit bug reports, feature requests, or UI issues directly to the ThermalTrace AI engineering team.
          </p>
        </div>

        {/* Current Submitter Badge */}
        {user && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Submitter:</span>
            <span className="font-semibold text-slate-900 dark:text-slate-200">{user.email}</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-orange-500/10 text-orange-500 border border-orange-500/20">
              {user.role}
            </span>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('submit')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'submit'
              ? 'border-orange-500 text-orange-500'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Submit Feedback / Report Issue
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'history'
              ? 'border-orange-500 text-orange-500'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          My Submissions History
          {myFeedback.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              {myFeedback.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Submit Form */}
      {activeTab === 'submit' && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5 shadow-sm">
          {submitSuccess && (
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{submitSuccess}</span>
            </div>
          )}

          {submitError && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category Dropdown */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Feedback Category <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-orange-500 focus:outline-none"
              >
                <option value="Bug Report">Bug Report</option>
                <option value="UI/UX Issue">UI/UX Issue</option>
                <option value="Data Accuracy Issue">Data Accuracy Issue</option>
                <option value="Feature Suggestion">Feature Suggestion</option>
                <option value="Performance Issue">Performance Issue</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Priority Selection */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Priority Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Low', 'Medium', 'High'].map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`py-2 text-xs font-medium rounded-lg border transition-all text-center ${
                      priority === p
                        ? 'border-orange-500 bg-orange-500/10 text-orange-500 font-semibold'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Title / Summary <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Export CSV button unresponsive on Analyst Dashboard"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-orange-500 focus:outline-none"
              maxLength={200}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Detailed Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what happened, steps to reproduce, or details of your suggestion..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-orange-500 focus:outline-none resize-none"
            />
          </div>

          {/* Optional Screenshot Attachment */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Optional Screenshot Attachment
            </label>
            
            {screenshotData ? (
              <div className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <img
                    src={screenshotData}
                    alt="Screenshot preview"
                    className="w-12 h-12 object-cover rounded border border-slate-300 dark:border-slate-600"
                  />
                  <div>
                    <p className="text-xs font-medium text-slate-900 dark:text-white truncate max-w-xs">{screenshotName}</p>
                    <p className="text-[10px] text-slate-500">Image attached</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeScreenshot}
                  className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-orange-500 dark:hover:border-orange-500 rounded-lg cursor-pointer bg-slate-50 dark:bg-slate-800/30 transition-colors">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
                  <Paperclip className="w-4 h-4" />
                  <span>Click to attach a screenshot (PNG, JPG, max 5MB)</span>
                </div>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 disabled:opacity-50 transition-colors shadow-sm"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Submit Feedback
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: My Submissions History */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Your Submitted Feedback Items</h2>
            <button
              onClick={fetchHistory}
              disabled={loadingHistory}
              className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>

          {loadingHistory ? (
            <div className="p-12 text-center text-slate-400 text-xs">Loading feedback history...</div>
          ) : myFeedback.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center">
              <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No feedback submitted yet</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Any issues or feature requests you submit will appear here along with their review status from admins.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {myFeedback.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">{item.title}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {item.category}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getPriorityBadgeClass(item.priority)}`}>
                          {item.priority} Priority
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Submitted on {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div>{getStatusBadge(item.status)}</div>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{item.description}</p>

                  {item.screenshot_data && (
                    <div>
                      <button
                        onClick={() => setSelectedImage(item.screenshot_data || null)}
                        className="inline-flex items-center gap-1.5 text-xs text-orange-500 hover:text-orange-400 font-medium"
                      >
                        <ImageIcon className="w-3.5 h-3.5" /> View Attached Screenshot
                      </button>
                    </div>
                  )}

                  {item.admin_notes && (
                    <div className="p-3 bg-orange-500/5 border border-orange-500/20 rounded-lg text-xs space-y-1">
                      <span className="font-semibold text-orange-500 block">Admin Note:</span>
                      <p className="text-slate-700 dark:text-slate-300">{item.admin_notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Image Preview Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-3xl max-h-[90vh] bg-slate-900 rounded-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-3 right-3 p-2 text-white bg-slate-800/80 hover:bg-slate-700 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={selectedImage} alt="Feedback Screenshot Full" className="max-w-full max-h-[85vh] object-contain" />
          </div>
        </div>
      )}
    </div>
  );
};
