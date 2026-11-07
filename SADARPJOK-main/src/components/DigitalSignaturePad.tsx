import React, { useRef, useState, useEffect } from 'react';
import { PenTool, RotateCcw, Check, Upload, Trash2, Image as ImageIcon, Sparkles, CheckCircle2 } from 'lucide-react';

interface DigitalSignaturePadProps {
  label: string;
  signatureData: string;
  onSaveSignature: (dataUrl: string) => void;
  onClearSignature: () => void;
  signatoryName: string;
  signatoryTitle: string;
  signatoryNip?: string;
}

export default function DigitalSignaturePad({
  label,
  signatureData,
  onSaveSignature,
  onClearSignature,
  signatoryName,
  signatoryTitle,
  signatoryNip
}: DigitalSignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState<string>('#1e3a8a'); // Default formal blue ink
  const [penWidth, setPenWidth] = useState<number>(2.5);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [mode, setMode] = useState<'canvas' | 'upload'>('canvas');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = 140 * 2;
    ctx.scale(2, 2);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Export transparent PNG
    const dataUrl = canvas.toDataURL('image/png');
    onSaveSignature(dataUrl);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    onClearSignature();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onSaveSignature(dataUrl);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3.5 shadow-2xs">
      
      {/* Header Pad */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div>
          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <PenTool className="w-3.5 h-3.5 text-emerald-600" />
            {label}
          </h4>
          <p className="text-[10px] text-slate-500">
            {signatoryTitle}: <strong className="text-slate-800">{signatoryName}</strong>
          </p>
        </div>

        {signatureData ? (
          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Ada TTD
          </span>
        ) : (
          <span className="text-[9px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            TTD Basah (Manual)
          </span>
        )}
      </div>

      {/* Mode Switcher */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10px] font-semibold">
          <button
            type="button"
            onClick={() => setMode('canvas')}
            className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
              mode === 'canvas' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Gores Langsung
          </button>
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
              mode === 'upload' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Upload File TTD
          </button>
        </div>

        {mode === 'canvas' && (
          <div className="flex items-center gap-1.5">
            {/* Ink color picker */}
            <button
              type="button"
              onClick={() => setPenColor('#1e3a8a')}
              className={`w-4 h-4 rounded-full bg-blue-900 cursor-pointer transition-all ${
                penColor === '#1e3a8a' ? 'ring-2 ring-blue-500 ring-offset-1 scale-110' : 'opacity-70'
              }`}
              title="Tinta Biru Formal"
            />
            <button
              type="button"
              onClick={() => setPenColor('#0f172a')}
              className={`w-4 h-4 rounded-full bg-slate-900 cursor-pointer transition-all ${
                penColor === '#0f172a' ? 'ring-2 ring-slate-700 ring-offset-1 scale-110' : 'opacity-70'
              }`}
              title="Tinta Hitam"
            />
          </div>
        )}
      </div>

      {/* Canvas Drawing Area or Upload Box */}
      {mode === 'canvas' ? (
        <div className="space-y-2">
          <div className="relative border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors overflow-hidden">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-[120px] touch-none cursor-crosshair block"
            />

            {!hasDrawn && !signatureData && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400 gap-1">
                <PenTool className="w-5 h-5 text-slate-300" />
                <span className="text-[10px]">Torehkan tanda tangan di sini</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-400">
              * Gunakan mouse atau jari/stylus
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={clearCanvas}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md font-bold flex items-center gap-1 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Bersihkan
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50/50 hover:bg-emerald-50/20 transition-all">
            <Upload className="w-5 h-5 text-slate-400 mb-1" />
            <span className="text-xs font-bold text-slate-700">Pilih Berkas Gambar TTD</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Format PNG (transparan disarankan), JPG, atau WEBP</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* Signature Preview Thumbnail */}
      {signatureData && (
        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-16 h-10 bg-white border border-slate-200 rounded-md flex items-center justify-center p-1 overflow-hidden">
              <img src={signatureData} alt="Preview TTD" className="max-h-full max-w-full object-contain" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-700 block">Tanda Tangan Aktif</span>
              <span className="text-[9px] text-slate-400">Siap dipasang pada dokumen CP</span>
            </div>
          </div>

          <button
            type="button"
            onClick={clearCanvas}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
            title="Hapus tanda tangan digital"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Signatory Footer Details */}
      <div className="pt-1 text-[10px] text-slate-500 border-t border-slate-100 flex justify-between">
        <span>NIP: <strong className="text-slate-700">{signatoryNip || '-'}</strong></span>
        <span className="text-emerald-700 font-semibold">{signatoryTitle}</span>
      </div>

    </div>
  );
}
