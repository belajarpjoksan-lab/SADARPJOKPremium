import React from 'react';
import { FileJson, Bot, Sparkles } from 'lucide-react';

export interface ExportJsonPromptAiButtonsProps {
  onExportJson: () => void;
  onOpenPromptAi: () => void;
  jsonLabel?: string;
  aiLabel?: string;
  variant?: 'solid' | 'gradient' | 'compact' | 'light';
  className?: string;
}

export default function ExportJsonPromptAiButtons({
  onExportJson,
  onOpenPromptAi,
  jsonLabel = 'Ekspor JSON',
  aiLabel = 'Prompt AI (Gemini / ChatGPT)',
  variant = 'solid',
  className = ''
}: ExportJsonPromptAiButtonsProps) {
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <button
          type="button"
          onClick={onExportJson}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          title="Unduh data dalam format JSON"
        >
          <FileJson className="w-3.5 h-3.5 text-amber-600" />
          <span>{jsonLabel}</span>
        </button>
        <button
          type="button"
          onClick={onOpenPromptAi}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer"
          title="Dapatkan prompt rekayasa AI untuk Google Gemini / ChatGPT"
        >
          <Bot className="w-3.5 h-3.5 text-purple-200" />
          <span>{aiLabel}</span>
        </button>
      </div>
    );
  }

  if (variant === 'light') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          type="button"
          onClick={onExportJson}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200 hover:border-amber-300 rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          title="Unduh data dalam format JSON"
        >
          <FileJson className="w-3.5 h-3.5 text-amber-600" />
          <span>{jsonLabel}</span>
        </button>
        <button
          type="button"
          onClick={onOpenPromptAi}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer"
          title="Dapatkan prompt rekayasa AI untuk Google Gemini / ChatGPT"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          <span>{aiLabel}</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={onExportJson}
        className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-amber-50/80 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer hover:border-amber-400"
        title="Unduh data format JSON"
      >
        <FileJson className="w-4 h-4 text-amber-600" />
        <span>{jsonLabel}</span>
      </button>

      <button
        type="button"
        onClick={onOpenPromptAi}
        className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
        title="Buka dan salin prompt rekayasa AI untuk Google Gemini atau ChatGPT"
      >
        <Bot className="w-4 h-4 text-purple-200" />
        <span>{aiLabel}</span>
      </button>
    </div>
  );
}
