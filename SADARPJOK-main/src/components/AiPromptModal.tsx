import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  X, 
  Sparkles, 
  Copy, 
  Check, 
  ExternalLink, 
  Download, 
  FileJson, 
  Code2 
} from 'lucide-react';
import { downloadJsonFile } from '../lib/exportUtils';

export interface AiPromptTab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  prompt: string;
  description?: string;
}

export interface AiPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badge?: string;
  tabs: AiPromptTab[];
  defaultTabId?: string;
  defaultActiveTab?: string;
  jsonData?: any;
  jsonFilename?: string;
}

export default function AiPromptModal({
  isOpen,
  onClose,
  title,
  subtitle,
  badge = 'Kurikulum Merdeka',
  tabs,
  defaultTabId,
  defaultActiveTab,
  jsonData,
  jsonFilename = 'ekspor-data'
}: AiPromptModalProps) {
  const [activeTabId, setActiveTabId] = useState<string>(() => {
    return defaultActiveTab || defaultTabId || tabs[0]?.id || 'prompt-1';
  });
  const [isCopied, setIsCopied] = useState(false);

  // Sync activeTabId if defaultTabId or defaultActiveTab changes or tabs change
  useEffect(() => {
    const targetTab = defaultActiveTab || defaultTabId;
    if (tabs.length > 0 && (!tabs.some(t => t.id === activeTabId) || targetTab)) {
      setActiveTabId(targetTab || tabs[0].id);
    }
  }, [defaultTabId, defaultActiveTab, tabs]);

  // Handle escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentTab = tabs.find(t => t.id === activeTabId) || tabs[0];
  const activePromptText = currentTab ? currentTab.prompt : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activePromptText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (err) {
      console.error('Gagal menyalin:', err);
    }
  };

  const handleOpenGemini = () => {
    // Also copy to clipboard for convenience
    handleCopy();
    window.open('https://gemini.google.com/app', '_blank', 'noopener,noreferrer');
  };

  const handleOpenChatGPT = () => {
    // Also copy to clipboard for convenience
    handleCopy();
    window.open('https://chatgpt.com', '_blank', 'noopener,noreferrer');
  };

  const handleDownloadTxt = () => {
    const filename = `${jsonFilename}_prompt_${currentTab?.id || 'ai'}.txt`;
    const blob = new Blob([activePromptText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadJson = () => {
    if (jsonData) {
      downloadJsonFile(jsonFilename, jsonData);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 text-white p-4 sm:p-5 flex items-start justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/20">
              <Bot className="w-6 h-6 text-purple-200" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                  {title}
                </h3>
                {badge && (
                  <span className="bg-white/20 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-purple-100 mt-1 line-clamp-2">
                {subtitle || 'Gunakan prompt rekayasa terstruktur ini langsung di Google Gemini atau ChatGPT untuk hasil optimal berstandar PJOK Kurikulum Merdeka.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0 ml-2"
            title="Tutup dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons (if > 1 tab) */}
        {tabs.length > 1 && (
          <div className="bg-slate-50 border-b border-slate-200 px-4 pt-3 flex flex-wrap gap-2 text-xs font-bold shrink-0">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTabId;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTabId(tab.id);
                    setIsCopied(false);
                  }}
                  className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'border-purple-600 text-purple-700 bg-white rounded-t-lg shadow-2xs font-extrabold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.icon || <Sparkles className="w-3.5 h-3.5" />}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {currentTab?.description && (
            <p className="text-xs text-slate-600 bg-slate-100/80 px-3 py-2 rounded-lg border border-slate-200">
              {currentTab.description}
            </p>
          )}

          {/* Quick Launcher Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-purple-50/70 border border-purple-200/80 p-3 rounded-xl text-xs">
            <div className="flex items-center gap-2 text-purple-900 font-medium">
              <span className="w-5 h-5 rounded-full bg-purple-200 text-purple-800 font-bold flex items-center justify-center text-[11px] shrink-0">
                💡
              </span>
              <span>Salin prompt berikut, lalu buka AI pilihan Anda:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleOpenGemini}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg shadow-2xs transition-all cursor-pointer text-xs"
                title="Salin dan buka Google Gemini di tab baru"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka Google Gemini</span>
              </button>
              <button
                type="button"
                onClick={handleOpenChatGPT}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg shadow-2xs transition-all cursor-pointer text-xs"
                title="Salin dan buka ChatGPT di tab baru"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka ChatGPT</span>
              </button>
            </div>
          </div>

          {/* Prompt Code Block */}
          <div className="relative rounded-xl border border-slate-300 bg-slate-900 text-slate-100 overflow-hidden shadow-inner">
            <div className="flex items-center justify-between px-3.5 py-2 bg-slate-950 border-b border-slate-800 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <Code2 className="w-3.5 h-3.5 text-purple-400" />
                <span className="font-mono font-semibold text-slate-300">
                  Prompt AI Markdown ({currentTab?.label || 'Instruksi AI'})
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-slate-400">{activePromptText.length} karakter</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Prompt</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <textarea
              readOnly
              value={activePromptText}
              rows={12}
              className="w-full p-4 bg-transparent text-slate-200 font-mono text-xs leading-relaxed resize-none focus:outline-hidden"
            />
          </div>

          <p className="text-[11px] text-slate-500 leading-normal">
            * Prompt telah dirancang dengan instruksi terstruktur (System Persona, Konteks Kurikulum Merdeka, Batasan &amp; Format Output) untuk meminimalisasi halusinasi dan memberikan hasil siap pakai.
          </p>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadTxt}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Unduh Berkas .TXT</span>
            </button>
            {jsonData && (
              <button
                type="button"
                onClick={handleDownloadJson}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer transition-colors"
              >
                <FileJson className="w-3.5 h-3.5 text-amber-600" />
                <span>Unduh Data JSON</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{isCopied ? 'Prompt Berhasil Disalin!' : 'Salin Seluruh Prompt'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-slate-600 hover:text-slate-800 font-bold cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
