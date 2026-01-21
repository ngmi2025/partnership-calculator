'use client';

import { useState, useEffect, useRef, Fragment } from 'react';
import {
  X,
  Send,
  Eye,
  EyeOff,
  Save,
  Loader2,
  Check,
  AlertCircle,
  ChevronDown,
  Trash2,
} from 'lucide-react';

interface Lead {
  id: string;
  email: string;
  name: string | null;
  channel_name: string | null;
  projected_monthly_earnings: number | null;
  projected_annual_earnings: number | null;
  monthly_visitors: number | null;
  click_rate: number | null;
}

interface ComposeEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  onSent: () => void;
}

interface Snippet {
  id: string;
  name: string;
  content: string;
}

// Default snippets stored in localStorage
const DEFAULT_SNIPPETS: Snippet[] = [
  {
    id: 'calendar',
    name: '📅 Calendar Link',
    content: 'Happy to jump on a quick call to chat through the details: https://calendly.com/upgradedpoints/partner-chat',
  },
  {
    id: 'signup',
    name: '✍️ Signup Link',
    content: 'Ready to get started? Sign up here: https://partnership-calculator.vercel.app',
  },
  {
    id: 'followup-call',
    name: '📞 Post-Call Follow-up',
    content: `Great chatting with you earlier! As discussed:

1. [Key point 1]
2. [Key point 2]
3. [Next steps]

Let me know if you have any questions.`,
  },
  {
    id: 'commission-rates',
    name: '💰 Commission Rates',
    content: `Our commission structure:
- 65-70% commission share (industry standard is ~50%)
- Direct relationships with Chase, Amex, Capital One, Citi
- Net-30 payments, no minimum threshold`,
  },
];

const VARIABLE_CHIPS = [
  { key: '{{name}}', label: 'Name', value: (lead: Lead) => lead.name || 'there' },
  { key: '{{first_name}}', label: 'First Name', value: (lead: Lead) => lead.name?.split(' ')[0] || 'there' },
  { key: '{{channel_name}}', label: 'Channel', value: (lead: Lead) => lead.channel_name || 'your channel' },
  { key: '{{projected_monthly_earnings}}', label: 'Monthly $', value: (lead: Lead) => lead.projected_monthly_earnings ? `$${lead.projected_monthly_earnings.toLocaleString()}` : '$X,XXX' },
  { key: '{{projected_annual_earnings}}', label: 'Annual $', value: (lead: Lead) => lead.projected_annual_earnings ? `$${lead.projected_annual_earnings.toLocaleString()}` : '$XX,XXX' },
];

const SIGNATURE = `
--
Luke R
Partner Manager @ Upgraded Points
https://upgradedpoints.com`;

function replaceVariables(text: string, lead: Lead): string {
  let result = text;
  VARIABLE_CHIPS.forEach((chip) => {
    result = result.replace(new RegExp(chip.key.replace(/[{}]/g, '\\$&'), 'g'), chip.value(lead));
  });
  return result;
}

export function ComposeEmailModal({ isOpen, onClose, lead, onSent }: ComposeEmailModalProps) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [showSnippetMenu, setShowSnippetMenu] = useState(false);
  const [draftKey, setDraftKey] = useState('');

  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const snippetMenuRef = useRef<HTMLDivElement>(null);

  // Load snippets and draft on mount
  useEffect(() => {
    // Load snippets
    const savedSnippets = localStorage.getItem('email_snippets');
    if (savedSnippets) {
      setSnippets(JSON.parse(savedSnippets));
    } else {
      setSnippets(DEFAULT_SNIPPETS);
      localStorage.setItem('email_snippets', JSON.stringify(DEFAULT_SNIPPETS));
    }

    // Set draft key
    setDraftKey(`email_draft_${lead.id}`);
  }, [lead.id]);

  // Load draft when key is set
  useEffect(() => {
    if (draftKey) {
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        setSubject(draft.subject || '');
        setBody(draft.body || '');
      }
    }
  }, [draftKey]);

  // Close snippet menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (snippetMenuRef.current && !snippetMenuRef.current.contains(event.target as Node)) {
        setShowSnippetMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const insertAtCursor = (text: string) => {
    const textarea = bodyRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newBody = body.substring(0, start) + text + body.substring(end);
      setBody(newBody);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + text.length;
        textarea.focus();
      }, 0);
    } else {
      setBody(body + text);
    }
  };

  const handleSaveDraft = () => {
    localStorage.setItem(draftKey, JSON.stringify({ subject, body }));
    setStatus({ type: 'success', message: 'Draft saved!' });
    setTimeout(() => setStatus(null), 2000);
  };

  const handleClearDraft = () => {
    localStorage.removeItem(draftKey);
    setSubject('');
    setBody('');
    setStatus({ type: 'success', message: 'Draft cleared' });
    setTimeout(() => setStatus(null), 2000);
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      setStatus({ type: 'error', message: 'Subject and body are required' });
      return;
    }

    setIsSending(true);
    setStatus(null);

    try {
      const response = await fetch(`/api/admin/leads/${lead.id}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, body }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({ type: 'success', message: 'Email sent successfully!' });
        localStorage.removeItem(draftKey); // Clear draft on successful send
        setTimeout(() => {
          onSent();
          onClose();
        }, 1500);
      } else {
        setStatus({ type: 'error', message: data.error || 'Failed to send email' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to send email' });
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  const previewSubject = replaceVariables(subject, lead);
  const previewBody = replaceVariables(body, lead) + SIGNATURE;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Compose Email</h2>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* To Field */}
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-lg">
              <span className="text-sm font-medium text-slate-500">To:</span>
              <span className="text-sm text-slate-900">{lead.email}</span>
              {lead.name && (
                <span className="text-sm text-slate-500">({lead.name})</span>
              )}
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject..."
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0F75BD] focus:border-transparent outline-none"
              />
            </div>

            {/* Variable Chips & Snippets */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500">Insert:</span>
              {VARIABLE_CHIPS.map((chip) => (
                <button
                  key={chip.key}
                  onClick={() => insertAtCursor(chip.key)}
                  className="px-2.5 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full transition-colors font-medium"
                >
                  {chip.label}
                </button>
              ))}

              {/* Snippets Dropdown */}
              <div className="relative ml-2" ref={snippetMenuRef}>
                <button
                  onClick={() => setShowSnippetMenu(!showSnippetMenu)}
                  className="flex items-center gap-1 px-3 py-1 text-xs bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-full transition-colors font-medium"
                >
                  Snippets
                  <ChevronDown className="w-3 h-3" />
                </button>

                {showSnippetMenu && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10">
                    {snippets.map((snippet) => (
                      <button
                        key={snippet.id}
                        onClick={() => {
                          insertAtCursor(snippet.content);
                          setShowSnippetMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        {snippet.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Body / Preview Toggle */}
            {showPreview ? (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                  <p className="text-xs text-slate-500">From: Luke R &lt;partnerships@upgradedpoints.com&gt;</p>
                  <p className="text-xs text-slate-500">To: {lead.email}</p>
                  <p className="text-sm font-medium text-slate-900 mt-1">{previewSubject}</p>
                </div>
                <div className="p-4 whitespace-pre-wrap text-sm text-slate-700 min-h-[200px] max-h-[300px] overflow-y-auto">
                  {previewBody}
                </div>
                <div className="bg-slate-50 px-4 py-2 border-t border-slate-200">
                  <p className="text-xs text-slate-500">
                    Unsubscribe link will be added automatically
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                <textarea
                  ref={bodyRef}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your email..."
                  rows={10}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0F75BD] focus:border-transparent outline-none resize-none font-mono text-sm"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Signature will be added automatically
                </p>
              </div>
            )}

            {/* Status Message */}
            {status && (
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
                  status.type === 'success'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {status.type === 'success' ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                {status.message}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-white border border-slate-200 rounded-lg transition-colors"
              >
                {showPreview ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    Edit
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    Preview
                  </>
                )}
              </button>
              <button
                onClick={handleSaveDraft}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-white border border-slate-200 rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Draft
              </button>
              {(subject || body) && (
                <button
                  onClick={handleClearDraft}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Clear draft"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              onClick={handleSend}
              disabled={isSending || !subject.trim() || !body.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#0F75BD] text-white rounded-lg hover:bg-[#0a5a94] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Email
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
