import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Upload, 
  Download, 
  Crop, 
  Sliders, 
  Image as ImageIcon, 
  CheckCircle2, 
  RefreshCw, 
  Cpu, 
  ShieldCheck, 
  Layers, 
  SlidersHorizontal 
} from 'lucide-react';
import { ImageStudioEngine, ImageProcessingOptions } from '../../services/imageStudio';
import { Product } from '../../types';

interface AIImageStudioViewProps {
  products: Product[];
  initialImageUrl?: string;
  onApplyToProduct?: (productId: string, newImageUrl: string) => void;
}

export const AIImageStudioView: React.FC<AIImageStudioViewProps> = ({
  products,
  initialImageUrl,
  onApplyToProduct,
}) => {
  const [sourceUrl, setSourceUrl] = useState<string>(
    initialImageUrl ||
    (products[0]?.images[0] ?? 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80')
  );

  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewMode, setViewMode] = useState<'SIDE_BY_SIDE' | 'PROCESSED_ONLY'>('SIDE_BY_SIDE');

  // Studio Options
  const [bgMode, setBgMode] = useState<ImageProcessingOptions['bgMode']>('WHITE');
  const [brightness, setBrightness] = useState<number>(0);
  const [contrast, setContrast] = useState<number>(10);
  const [sharpness, setSharpness] = useState<number>(40);
  const [cropSquare, setCropSquare] = useState<boolean>(true);
  const [targetWidth, setTargetWidth] = useState<number>(1000);

  // Local Python Worker Status
  const [localWorkerStatus, setLocalWorkerStatus] = useState<{
    checked: boolean;
    available: boolean;
    engine: string;
  }>({
    checked: false,
    available: false,
    engine: 'In-Browser Zero-Cost Neural Canvas Engine',
  });

  // Check local rembg service on localhost:5050
  useEffect(() => {
    fetch('http://localhost:5050/status', { mode: 'cors' })
      .then((res) => res.json())
      .then((data) => {
        setLocalWorkerStatus({
          checked: true,
          available: true,
          engine: data.engine || 'Local Python rembg (U2-Net)',
        });
      })
      .catch(() => {
        setLocalWorkerStatus({
          checked: true,
          available: false,
          engine: 'In-Browser High-Performance Canvas Engine (Zero Install)',
        });
      });
  }, []);

  // Process the image
  const handleProcessImage = async () => {
    setIsProcessing(true);
    try {
      const options: ImageProcessingOptions = {
        bgMode,
        brightness,
        contrast,
        sharpness,
        cropSquare,
        outputWidth: targetWidth,
        quality: 0.92,
      };

      const result = await ImageStudioEngine.processImage(sourceUrl, options);
      setProcessedUrl(result.dataUrl);
    } catch (err: any) {
      console.error('Image processing failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Run on first load or when key options change
  useEffect(() => {
    handleProcessImage();
  }, [sourceUrl, bgMode, cropSquare]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setSourceUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = () => {
    if (!processedUrl) return;
    const link = document.createElement('a');
    link.href = processedUrl;
    link.download = `Manisha_Fashion_AI_Studio_${Date.now()}.${bgMode === 'TRANSPARENT' ? 'png' : 'jpg'}`;
    link.click();
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white p-4 rounded-lg border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600" />
            <h2 className="text-xl font-bold text-stone-900">AI Product Image Studio</h2>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Offline background removal, studio backdrops, Laplace edge sharpening, and e-commerce 1:1 square crop. Zero paid API cost.
          </p>
        </div>

        {/* Local AI Worker Badge */}
        <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 px-3 py-1.5 rounded-lg text-xs">
          <Cpu className="w-4 h-4 text-stone-600" />
          <div>
            <div className="font-semibold text-stone-800 flex items-center gap-1.5">
              <span>{localWorkerStatus.engine}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <span className="text-[10px] text-stone-500">
              {localWorkerStatus.available
                ? 'Connected to local Python worker (localhost:5050)'
                : '100% offline client-side processing (Privacy protected)'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Studio Work Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Sidebar (Left) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Image Input Options */}
          <div className="bg-white p-4 rounded-lg border border-stone-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center justify-between">
              <span>Source Product Photo</span>
              <span className="text-[10px] text-stone-500 font-normal">Original preserved</span>
            </h3>

            <label className="w-full py-2.5 px-3 border border-dashed border-stone-300 rounded-md text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer flex items-center justify-center gap-2 transition-colors">
              <Upload className="w-4 h-4 text-amber-600" />
              <span>Upload New Photo (PNG / JPEG)</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>

            {/* Quick Catalog Shirt Selector */}
            <div>
              <label className="block text-[11px] text-stone-500 mb-1">
                Or select from current catalog:
              </label>
              <select
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                className="w-full text-xs border border-stone-300 rounded p-1.5 bg-white focus:outline-none"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.images[0]}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Background Replacement Settings */}
          <div className="bg-white p-4 rounded-lg border border-stone-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
              Studio Background & Backdrops
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setBgMode('WHITE')}
                className={`p-2 rounded border text-xs font-medium text-left transition-colors flex items-center gap-2 ${
                  bgMode === 'WHITE'
                    ? 'border-amber-600 bg-amber-50/50 text-amber-900 font-bold'
                    : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-white border border-stone-300"></span>
                <span>Pure White (Catalog)</span>
              </button>

              <button
                onClick={() => setBgMode('STUDIO_GREY')}
                className={`p-2 rounded border text-xs font-medium text-left transition-colors flex items-center gap-2 ${
                  bgMode === 'STUDIO_GREY'
                    ? 'border-amber-600 bg-amber-50/50 text-amber-900 font-bold'
                    : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-slate-100 border border-slate-300"></span>
                <span>Studio Grey</span>
              </button>

              <button
                onClick={() => setBgMode('WOOD_SHOWROOM')}
                className={`p-2 rounded border text-xs font-medium text-left transition-colors flex items-center gap-2 ${
                  bgMode === 'WOOD_SHOWROOM'
                    ? 'border-amber-600 bg-amber-50/50 text-amber-900 font-bold'
                    : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-amber-100 border border-amber-300"></span>
                <span>Warm Boutique</span>
              </button>

              <button
                onClick={() => setBgMode('TRANSPARENT')}
                className={`p-2 rounded border text-xs font-medium text-left transition-colors flex items-center gap-2 ${
                  bgMode === 'TRANSPARENT'
                    ? 'border-amber-600 bg-amber-50/50 text-amber-900 font-bold'
                    : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-[linear-gradient(45deg,#ccc_25%,transparent_25%),linear-gradient(-45deg,#ccc_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#ccc_75%),linear-gradient(-45deg,transparent_75%,#ccc_75%)] bg-[size:6px_6px] border border-stone-300"></span>
                <span>Transparent (PNG)</span>
              </button>
            </div>
          </div>

          {/* Enhancement Sliders */}
          <div className="bg-white p-4 rounded-lg border border-stone-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-amber-600" />
              <span>Image Enhancement & Filters</span>
            </h3>

            {/* Square Crop Toggle */}
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <span className="text-xs font-medium text-stone-700">1:1 Square E-Commerce Crop</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={cropSquare}
                  onChange={(e) => setCropSquare(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>

            {/* Sharpness */}
            <div>
              <div className="flex justify-between text-xs text-stone-700 mb-1">
                <span>Laplace Sharpness:</span>
                <span className="font-mono font-bold">{sharpness}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={sharpness}
                onChange={(e) => setSharpness(Number(e.target.value))}
                className="w-full accent-amber-600"
              />
            </div>

            {/* Contrast */}
            <div>
              <div className="flex justify-between text-xs text-stone-700 mb-1">
                <span>Contrast:</span>
                <span className="font-mono font-bold">{contrast > 0 ? `+${contrast}` : contrast}</span>
              </div>
              <input
                type="range"
                min="-30"
                max="40"
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                className="w-full accent-amber-600"
              />
            </div>

            {/* Brightness */}
            <div>
              <div className="flex justify-between text-xs text-stone-700 mb-1">
                <span>Brightness:</span>
                <span className="font-mono font-bold">{brightness > 0 ? `+${brightness}` : brightness}</span>
              </div>
              <input
                type="range"
                min="-30"
                max="30"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full accent-amber-600"
              />
            </div>

            {/* Apply button */}
            <button
              onClick={handleProcessImage}
              disabled={isProcessing}
              className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-white rounded text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>{isProcessing ? 'Rendering...' : 'Re-render AI Adjustments'}</span>
            </button>
          </div>
        </div>

        {/* Preview Canvas Area (Right) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Top Bar for View Toggle & Download */}
          <div className="bg-white p-3 rounded-lg border border-stone-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('SIDE_BY_SIDE')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  viewMode === 'SIDE_BY_SIDE'
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-600 hover:text-stone-900 bg-stone-100'
                }`}
              >
                Before / After Comparison
              </button>
              <button
                onClick={() => setViewMode('PROCESSED_ONLY')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  viewMode === 'PROCESSED_ONLY'
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-600 hover:text-stone-900 bg-stone-100'
                }`}
              >
                Final Output Only
              </button>
            </div>

            <button
              onClick={handleDownload}
              disabled={!processedUrl}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-bold flex items-center gap-1.5 shadow transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Edited Image</span>
            </button>
          </div>

          {/* Interactive Preview Canvas */}
          <div className="bg-stone-100 rounded-lg border border-stone-200 p-6 min-h-[460px] flex items-center justify-center">
            {viewMode === 'SIDE_BY_SIDE' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {/* Original Photo */}
                <div className="bg-white p-3 rounded-lg border border-stone-200 shadow-xs flex flex-col items-center">
                  <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-2">
                    Original Source (Raw)
                  </span>
                  <div className="aspect-square w-full max-w-[320px] rounded overflow-hidden bg-stone-50 border border-stone-200 flex items-center justify-center">
                    <img src={sourceUrl} alt="Original" className="w-full h-full object-cover" />
                  </div>
                </div>

                {/* AI Studio Output */}
                <div className="bg-white p-3 rounded-lg border border-amber-300 shadow-xs flex flex-col items-center relative">
                  <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>AI Enhanced (Processed)</span>
                  </span>
                  <div className="aspect-square w-full max-w-[320px] rounded overflow-hidden bg-stone-50 border border-stone-200 flex items-center justify-center relative">
                    {processedUrl ? (
                      <img src={processedUrl} alt="Processed" className="w-full h-full object-contain" />
                    ) : (
                      <div className="text-stone-400 text-xs">Rendering preview...</div>
                    )}
                    {isProcessing && (
                      <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center">
                        <RefreshCw className="w-6 h-6 text-amber-600 animate-spin" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Single View */
              <div className="bg-white p-4 rounded-lg border border-stone-200 shadow-sm flex flex-col items-center max-w-[480px] w-full">
                <span className="text-xs font-bold text-stone-800 mb-2">
                  1000 × 1000 High-Res E-Commerce Ready Asset
                </span>
                <div className="aspect-square w-full rounded overflow-hidden bg-stone-50 border border-stone-200 flex items-center justify-center">
                  {processedUrl && (
                    <img src={processedUrl} alt="Processed Single" className="w-full h-full object-contain" />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Informational Footer on Model Verification */}
          <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-600 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              <strong>Zero License & Hardware Notice:</strong> AI Studio processing is performed entirely without paid cloud APIs. To use local U2-Net deep learning models on Windows, launch <code className="bg-stone-200 px-1 py-0.5 rounded text-[11px]">python scripts/local_rembg_service.py</code>. The application automatically falls back to client-side Canvas algorithms if the Python daemon is not active.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
