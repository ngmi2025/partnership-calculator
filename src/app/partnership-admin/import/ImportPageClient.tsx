'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Menu,
  UserPlus,
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  Check,
  Loader2,
  X,
  ChevronDown,
} from 'lucide-react';
import { Sidebar } from '@/components/admin';

interface ImportPageClientProps {
  userName: string;
}

type ImportMode = 'single' | 'bulk' | null;
type Sequence = 'cold_outreach' | 'calculator_nurture';

interface SingleLeadForm {
  email: string;
  name: string;
  channel_name: string;
  website_url: string;
  platform: string;
  subscriber_count: string;
  notes: string;
  sequence: Sequence;
}

interface ParsedLead {
  email: string;
  name?: string;
  channel_name?: string;
  website_url?: string;
  platform?: string;
  subscriber_count?: string;
  notes?: string;
}

interface ColumnMapping {
  [csvColumn: string]: string;
}

const PLATFORMS = ['youtube', 'instagram', 'tiktok', 'blog', 'twitter', 'other'];
const FIELD_OPTIONS = ['email', 'name', 'channel_name', 'website_url', 'platform', 'subscriber_count', 'notes', '-- skip --'];

const TEMPLATE_CSV = `email,name,channel_name,website_url,platform,subscriber_count,notes
alex@example.com,Alex Smith,Travel Points Pro,https://travelpoints.com,youtube,125K,High engagement creator
jane@example.com,Jane Doe,Miles & Points Daily,,instagram,45K,Great content quality`;

export function ImportPageClient({ userName }: ImportPageClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mode, setMode] = useState<ImportMode>(null);
  
  // Single lead form state
  const [singleForm, setSingleForm] = useState<SingleLeadForm>({
    email: '',
    name: '',
    channel_name: '',
    website_url: '',
    platform: '',
    subscriber_count: '',
    notes: '',
    sequence: 'cold_outreach',
  });
  const [singleLoading, setSingleLoading] = useState(false);
  const [singleError, setSingleError] = useState<string | null>(null);
  const [singleSuccess, setSingleSuccess] = useState(false);

  // Bulk import state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [bulkSequence, setBulkSequence] = useState<Sequence>('cold_outreach');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [duplicateCheck, setDuplicateCheck] = useState<{ total: number; duplicates: string[]; newCount: number } | null>(null);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: any[] } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse CSV content
  const parseCSV = (content: string): { headers: string[]; data: string[][] } => {
    const lines = content.split('\n').filter((line) => line.trim());
    if (lines.length < 2) return { headers: [], data: [] };

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const data = lines.slice(1).map((line) => {
      // Handle quoted values with commas
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      
      return values;
    });

    return { headers, data };
  };

  // Auto-map columns
  const autoMapColumns = (headers: string[]): ColumnMapping => {
    const mapping: ColumnMapping = {};
    const lowercaseHeaders = headers.map((h) => h.toLowerCase());

    headers.forEach((header, idx) => {
      const lower = lowercaseHeaders[idx];
      
      if (lower.includes('email')) mapping[header] = 'email';
      else if (lower.includes('name') && !lower.includes('channel')) mapping[header] = 'name';
      else if (lower.includes('channel') || lower.includes('handle')) mapping[header] = 'channel_name';
      else if (lower.includes('website') || lower.includes('url') || lower.includes('site')) mapping[header] = 'website_url';
      else if (lower.includes('platform')) mapping[header] = 'platform';
      else if (lower.includes('subscriber') || lower.includes('follower') || lower.includes('subs')) mapping[header] = 'subscriber_count';
      else if (lower.includes('note')) mapping[header] = 'notes';
      else mapping[header] = '-- skip --';
    });

    return mapping;
  };

  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    setBulkError(null);
    setImportResult(null);
    setDuplicateCheck(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const { headers, data } = parseCSV(content);

      if (headers.length === 0) {
        setBulkError('Could not parse CSV file. Make sure it has headers.');
        return;
      }

      setCsvHeaders(headers);
      setCsvData(data);
      setColumnMapping(autoMapColumns(headers));

      // Check for duplicates
      const emailIdx = headers.findIndex((h) => h.toLowerCase().includes('email'));
      if (emailIdx >= 0) {
        const emails = data.map((row) => row[emailIdx]).filter(Boolean);
        await checkDuplicates(emails);
      }
    };

    reader.readAsText(file);
  };

  // Check for duplicate emails
  const checkDuplicates = async (emails: string[]) => {
    try {
      const response = await fetch('/api/admin/import/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails }),
      });

      if (response.ok) {
        const data = await response.json();
        setDuplicateCheck(data);
      }
    } catch (error) {
      console.error('Failed to check duplicates:', error);
    }
  };

  // Handle single lead submission
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSingleLoading(true);
    setSingleError(null);
    setSingleSuccess(false);

    try {
      const response = await fetch('/api/admin/import/single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(singleForm),
      });

      const data = await response.json();

      if (response.ok) {
        setSingleSuccess(true);
        setSingleForm({
          email: '',
          name: '',
          channel_name: '',
          website_url: '',
          platform: '',
          subscriber_count: '',
          notes: '',
          sequence: 'cold_outreach',
        });
        setTimeout(() => setSingleSuccess(false), 3000);
      } else {
        setSingleError(data.error || 'Failed to import lead');
      }
    } catch (error) {
      setSingleError('Failed to import lead');
    } finally {
      setSingleLoading(false);
    }
  };

  // Handle bulk import
  const handleBulkImport = async () => {
    setBulkLoading(true);
    setBulkError(null);
    setImportResult(null);

    try {
      // Map CSV data to leads
      const leads: ParsedLead[] = csvData.map((row) => {
        const lead: ParsedLead = { email: '' };

        csvHeaders.forEach((header, idx) => {
          const field = columnMapping[header];
          if (field && field !== '-- skip --' && row[idx]) {
            (lead as any)[field] = row[idx];
          }
        });

        return lead;
      }).filter((lead) => lead.email);

      const response = await fetch('/api/admin/import/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads, sequence: bulkSequence }),
      });

      const data = await response.json();

      if (response.ok) {
        setImportResult(data);
        if (data.imported > 0) {
          // Clear file after successful import
          setCsvFile(null);
          setCsvHeaders([]);
          setCsvData([]);
          setColumnMapping({});
          setDuplicateCheck(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      } else {
        setBulkError(data.error || 'Failed to import leads');
      }
    } catch (error) {
      setBulkError('Failed to import leads');
    } finally {
      setBulkLoading(false);
    }
  };

  // Download template CSV
  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prospect-import-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar userName={userName} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Import Prospects</h1>
              <p className="text-sm text-slate-500">Add leads for cold outreach campaigns</p>
            </div>
          </div>
        </header>

        <main className="p-6 max-w-4xl mx-auto">
          {/* Import Method Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <button
              onClick={() => setMode(mode === 'single' ? null : 'single')}
              className={`p-6 bg-white rounded-xl border-2 transition-all text-left ${
                mode === 'single'
                  ? 'border-[#0F75BD] ring-2 ring-[#0F75BD]/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${mode === 'single' ? 'bg-[#0F75BD] text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Add Single Lead</h3>
                  <p className="text-sm text-slate-500">Enter prospect details manually</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setMode(mode === 'bulk' ? null : 'bulk')}
              className={`p-6 bg-white rounded-xl border-2 transition-all text-left ${
                mode === 'bulk'
                  ? 'border-[#0F75BD] ring-2 ring-[#0F75BD]/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${mode === 'bulk' ? 'bg-[#0F75BD] text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Bulk CSV Import</h3>
                  <p className="text-sm text-slate-500">Upload spreadsheet of prospects</p>
                </div>
              </div>
            </button>
          </div>

          {/* Single Lead Form */}
          {mode === 'single' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-6">Add Single Prospect</h2>

              <form onSubmit={handleSingleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={singleForm.name}
                      onChange={(e) => setSingleForm({ ...singleForm, name: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0F75BD] focus:border-transparent outline-none"
                      placeholder="Alex Smith"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={singleForm.email}
                      onChange={(e) => setSingleForm({ ...singleForm, email: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0F75BD] focus:border-transparent outline-none"
                      placeholder="alex@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Channel Name</label>
                    <input
                      type="text"
                      value={singleForm.channel_name}
                      onChange={(e) => setSingleForm({ ...singleForm, channel_name: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0F75BD] focus:border-transparent outline-none"
                      placeholder="Travel Points Pro"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Website URL</label>
                    <input
                      type="url"
                      value={singleForm.website_url}
                      onChange={(e) => setSingleForm({ ...singleForm, website_url: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0F75BD] focus:border-transparent outline-none"
                      placeholder="https://example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Platform</label>
                    <select
                      value={singleForm.platform}
                      onChange={(e) => setSingleForm({ ...singleForm, platform: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0F75BD] focus:border-transparent outline-none"
                    >
                      <option value="">Select platform...</option>
                      {PLATFORMS.map((p) => (
                        <option key={p} value={p}>
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Subscribers/Followers</label>
                    <input
                      type="text"
                      value={singleForm.subscriber_count}
                      onChange={(e) => setSingleForm({ ...singleForm, subscriber_count: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0F75BD] focus:border-transparent outline-none"
                      placeholder="125K"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                  <textarea
                    value={singleForm.notes}
                    onChange={(e) => setSingleForm({ ...singleForm, notes: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0F75BD] focus:border-transparent outline-none resize-none"
                    placeholder="Any relevant notes about this prospect..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email Sequence</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="sequence"
                        checked={singleForm.sequence === 'cold_outreach'}
                        onChange={() => setSingleForm({ ...singleForm, sequence: 'cold_outreach' })}
                        className="w-4 h-4 text-[#0F75BD]"
                      />
                      <span className="text-sm text-slate-700">Cold Outreach</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="sequence"
                        checked={singleForm.sequence === 'calculator_nurture'}
                        onChange={() => setSingleForm({ ...singleForm, sequence: 'calculator_nurture' })}
                        className="w-4 h-4 text-[#0F75BD]"
                      />
                      <span className="text-sm text-slate-700">Calculator Nurture</span>
                    </label>
                  </div>
                </div>

                {singleError && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    {singleError}
                  </div>
                )}

                {singleSuccess && (
                  <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-lg">
                    <Check className="w-4 h-4" />
                    Lead imported successfully!
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setMode(null)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={singleLoading}
                    className="flex items-center gap-2 px-6 py-2 bg-[#0F75BD] text-white rounded-lg hover:bg-[#0a5a94] disabled:opacity-50 transition-colors"
                  >
                    {singleLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Add Lead
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Bulk Import */}
          {mode === 'bulk' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-900">Bulk CSV Import</h2>
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 text-sm text-[#0F75BD] hover:underline"
                >
                  <Download className="w-4 h-4" />
                  Download Template
                </button>
              </div>

              {/* File Upload Area */}
              {!csvFile && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center cursor-pointer hover:border-[#0F75BD] hover:bg-slate-50 transition-colors"
                >
                  <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600 mb-2">Drag & drop CSV file here</p>
                  <p className="text-sm text-slate-500">or click to browse</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              )}

              {/* Column Mapping */}
              {csvFile && csvHeaders.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="w-5 h-5 text-slate-600" />
                      <span className="font-medium text-slate-900">{csvFile.name}</span>
                      <span className="text-sm text-slate-500">({csvData.length} rows)</span>
                    </div>
                    <button
                      onClick={() => {
                        setCsvFile(null);
                        setCsvHeaders([]);
                        setCsvData([]);
                        setColumnMapping({});
                        setDuplicateCheck(null);
                        setImportResult(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="p-1 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Column Mapping Table */}
                  <div>
                    <h3 className="text-sm font-medium text-slate-700 mb-3">Column Mapping</h3>
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-2">CSV Column</th>
                            <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-2">Maps To</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {csvHeaders.map((header) => (
                            <tr key={header}>
                              <td className="px-4 py-2 text-sm text-slate-900">{header}</td>
                              <td className="px-4 py-2">
                                <select
                                  value={columnMapping[header] || '-- skip --'}
                                  onChange={(e) => setColumnMapping({ ...columnMapping, [header]: e.target.value })}
                                  className="w-full px-2 py-1 text-sm border border-slate-200 rounded focus:ring-2 focus:ring-[#0F75BD] focus:border-transparent outline-none"
                                >
                                  {FIELD_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Preview */}
                  <div>
                    <h3 className="text-sm font-medium text-slate-700 mb-3">Preview (first 5 rows)</h3>
                    <div className="border border-slate-200 rounded-lg overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            {csvHeaders.map((header) => (
                              <th key={header} className="text-left text-xs font-medium text-slate-500 px-3 py-2 whitespace-nowrap">
                                {columnMapping[header] !== '-- skip --' ? columnMapping[header] : <span className="text-slate-300">{header}</span>}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {csvData.slice(0, 5).map((row, idx) => (
                            <tr key={idx}>
                              {row.map((cell, cellIdx) => (
                                <td
                                  key={cellIdx}
                                  className={`px-3 py-2 whitespace-nowrap ${
                                    columnMapping[csvHeaders[cellIdx]] === '-- skip --' ? 'text-slate-300' : 'text-slate-900'
                                  }`}
                                >
                                  {cell || '-'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Sequence Selection */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email Sequence</label>
                    <select
                      value={bulkSequence}
                      onChange={(e) => setBulkSequence(e.target.value as Sequence)}
                      className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0F75BD] focus:border-transparent outline-none"
                    >
                      <option value="cold_outreach">Cold Outreach</option>
                      <option value="calculator_nurture">Calculator Nurture</option>
                    </select>
                  </div>

                  {/* Duplicate Check Info */}
                  {duplicateCheck && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-amber-800">
                        Found <strong>{csvData.length}</strong> leads
                        {duplicateCheck.duplicates.length > 0 && (
                          <> — <strong>{duplicateCheck.duplicates.length}</strong> already exist and will be skipped</>
                        )}
                      </p>
                    </div>
                  )}

                  {bulkError && (
                    <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                      <AlertCircle className="w-4 h-4" />
                      {bulkError}
                    </div>
                  )}

                  {importResult && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
                        <Check className="w-5 h-5" />
                        Import Complete
                      </div>
                      <p className="text-green-800">
                        Imported: <strong>{importResult.imported}</strong>
                        {importResult.skipped > 0 && <> • Skipped: <strong>{importResult.skipped}</strong></>}
                        {importResult.errors.length > 0 && <> • Errors: <strong>{importResult.errors.length}</strong></>}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setMode(null)}
                      className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBulkImport}
                      disabled={bulkLoading || !columnMapping.email || Object.values(columnMapping).filter((v) => v === 'email').length === 0}
                      className="flex items-center gap-2 px-6 py-2 bg-[#0F75BD] text-white rounded-lg hover:bg-[#0a5a94] disabled:opacity-50 transition-colors"
                    >
                      {bulkLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Import {duplicateCheck ? duplicateCheck.newCount : csvData.length} Leads
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Compliance Notice */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">📋 B2B Cold Email Compliance</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Cold email to businesses is permitted under CAN-SPAM</li>
              <li>• All emails include an unsubscribe link</li>
              <li>• Physical address is included in footer</li>
              <li>• Emails are relevant business opportunities (not spam)</li>
              <li>• If they unsubscribe, they&apos;re immediately removed from sequences</li>
            </ul>
          </div>
        </main>
      </div>
    </div>
  );
}
