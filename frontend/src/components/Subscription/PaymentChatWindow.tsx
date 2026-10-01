import React, { useState, useEffect, useRef } from 'react';
import { Send, ShieldAlert, Lock, User, Shield, Sparkles, RefreshCw, ArrowLeft } from 'lucide-react';
import { apiService } from '../../services/api';
import { SubscriptionMessage } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface Props {
  subscriptionId: string;
  onPaidClick?: () => void;
  showPaidButton?: boolean;
  onBack?: () => void;
}

export const PaymentChatWindow: React.FC<Props> = ({
  subscriptionId,
  onPaidClick,
  showPaidButton = false,
  onBack
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<SubscriptionMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const fetchMessages = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await apiService.getSubscriptionMessages(subscriptionId);
      setMessages(data);
      setError(null);
    } catch (err: any) {
      if (!silent) {
        setError(err.response?.data?.detail || 'Failed to load conversation messages.');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(() => {
      fetchMessages(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [subscriptionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      await apiService.sendSubscriptionMessage(subscriptionId, inputText.trim());
      setInputText('');
      await fetchMessages(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="flex flex-col h-[420px] bg-slate-900/90 dark:bg-slate-950/90 border border-slate-700/60 dark:border-amber-500/30 rounded-2xl overflow-hidden shadow-xl">
      {/* HEADER WITH BACK BUTTON IF ONBACK PASSED */}
      {onBack && (
        <div className="bg-slate-900 border-b border-slate-800 p-2.5 px-4 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center space-x-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← Back to Overview</span>
          </button>
          <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
            Payment Conversation
          </span>
        </div>
      )}

      {/* SECURITY WARNING HEADER */}
      <div className="bg-amber-500/15 border-b border-amber-500/30 p-2.5 px-4 flex items-center space-x-2 text-[11px] text-amber-300 font-semibold shrink-0">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
        <span className="leading-tight">
          Never share OTP, UPI PIN, CVV, card PIN, banking password, or authentication credentials.
        </span>
      </div>

      {/* MESSAGES LIST */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400 text-xs space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
            <span>Loading conversation...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs space-y-1">
            <Lock className="w-6 h-6 text-slate-600 mb-1" />
            <span>Private Payment Conversation Started</span>
            <span className="text-[10px] text-slate-500">Communicate directly regarding external payment details.</span>
          </div>
        ) : (
          messages.map((msg) => {
            const isSystem = msg.sender_role === 'system';
            const isMe = user && msg.sender_id === user.id;

            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <div className="bg-slate-800/80 text-slate-300 text-[10px] font-semibold px-3 py-1 rounded-full border border-slate-700/80 shadow-xs flex items-center space-x-1.5">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>{msg.message_text}</span>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center space-x-1 text-[10px] text-slate-400 font-medium mb-0.5 px-1">
                  {msg.sender_role === 'admin' ? (
                    <span className="text-amber-400 font-bold flex items-center space-x-1">
                      <Shield className="w-3 h-3 inline" />
                      <span>Admin ({msg.sender_email})</span>
                    </span>
                  ) : (
                    <span className="text-slate-300 font-medium flex items-center space-x-1">
                      <User className="w-3 h-3 inline" />
                      <span>{msg.sender_email || 'User'}</span>
                    </span>
                  )}
                  <span>•</span>
                  <span>{formatTime(msg.created_at)}</span>
                </div>

                <div
                  className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed font-sans shadow-sm ${
                    isMe
                      ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none'
                      : msg.sender_role === 'admin'
                      ? 'bg-slate-800 border border-amber-500/40 text-slate-100 rounded-tl-none'
                      : 'bg-slate-800 border border-slate-700 text-slate-100 rounded-tl-none'
                  }`}
                >
                  {msg.message_text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="px-4 py-1.5 bg-red-500/20 text-red-300 text-[11px] font-semibold shrink-0">
          {error}
        </div>
      )}

      {/* BOTTOM INPUT & ACTION CONTROLS */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 flex flex-col space-y-2 shrink-0">
        {showPaidButton && onPaidClick && (
          <button
            type="button"
            onClick={onPaidClick}
            className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs transition shadow-md flex items-center justify-center space-x-1.5 uppercase tracking-wider cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>I Have Paid — Submit UTR & Proof</span>
          </button>
        )}

        <form onSubmit={handleSend} className="flex items-center space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message regarding payment..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-medium"
          />
          <button
            type="submit"
            disabled={sending || !inputText.trim()}
            className="p-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition cursor-pointer disabled:opacity-40"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
