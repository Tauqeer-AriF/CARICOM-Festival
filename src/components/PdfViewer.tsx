import React, { useEffect, useRef, useState } from 'react';
import { 
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, 
  Download, ExternalLink, FileText, Loader2, AlertCircle 
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '4.10.38'}/build/pdf.worker.min.mjs`;
} catch (e) {
  console.warn('[PDF.js Worker Setup]', e);
}

interface PdfViewerProps {
  url: string;
  title?: string;
  className?: string;
  maxHeight?: string;
  onDownload?: () => void;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  url,
  title = 'Document.pdf',
  className = '',
  maxHeight = '70vh'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to open PDF in a new tab reliably even with data-URIs
  const handleOpenInNewTab = () => {
    try {
      if (url.startsWith('data:')) {
        const arr = url.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/pdf';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank', 'noopener,noreferrer');
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (e) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Helper to download PDF
  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = title.endsWith('.pdf') ? title : `${title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.open(url, '_blank');
    }
  };

  // Load PDF Document
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    setCurrentPage(1);

    if (!url) {
      setError('No PDF URL provided');
      setLoading(false);
      return;
    }

    const loadPdf = async () => {
      try {
        let loadingTask: any;

        if (url.startsWith('data:')) {
          // Convert base64 data URI to Uint8Array for fast, robust parsing
          const base64Data = url.split(',')[1] || url;
          const raw = atob(base64Data);
          const uint8Array = new Uint8Array(raw.length);
          for (let i = 0; i < raw.length; i++) {
            uint8Array[i] = raw.charCodeAt(i);
          }
          loadingTask = pdfjsLib.getDocument({ data: uint8Array });
        } else {
          loadingTask = pdfjsLib.getDocument({ url });
        }

        const doc = await loadingTask.promise;
        if (isMounted) {
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setLoading(false);
        }
      } catch (err: any) {
        console.error('[PDF Load Error]', err);
        if (isMounted) {
          setError(err?.message || 'Failed to load PDF document');
          setLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      isMounted = false;
    };
  }, [url]);

  // Render current page onto canvas
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let renderTask: any = null;
    let isCancelled = false;

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(currentPage);
        if (isCancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        if (!context) return;

        // Calculate responsive scale based on container width if available
        let effectiveScale = scale;
        if (containerRef.current) {
          const containerWidth = containerRef.current.clientWidth - 32;
          const unscaledViewport = page.getViewport({ scale: 1, rotation });
          if (containerWidth > 0 && unscaledViewport.width > 0) {
            const fitScale = containerWidth / unscaledViewport.width;
            effectiveScale = fitScale * scale;
          }
        }

        const viewport = page.getViewport({ scale: effectiveScale, rotation });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };

        renderTask = page.render(renderContext);
        await renderTask.promise;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.warn('[PDF Page Render Warning]', err);
        }
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfDoc, currentPage, scale, rotation]);

  return (
    <div className={`flex flex-col bg-[#0A0D18] border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl ${className}`}>
      {/* Top Controls Bar */}
      <div className="p-3 bg-neutral-950/90 border-b border-neutral-800/80 flex flex-wrap items-center justify-between gap-2.5 z-10">
        {/* Document Info */}
        <div className="flex items-center gap-2 min-w-0 max-w-full sm:max-w-xs">
          <div className="p-1.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-white truncate font-mono" title={title}>
            {title}
          </span>
        </div>

        {/* Page Nav & Controls */}
        <div className="flex items-center gap-1.5 flex-wrap justify-center">
          {numPages > 1 && (
            <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-1.5 text-neutral-300 hover:text-white disabled:text-neutral-600 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
                title="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono text-neutral-300 px-2 font-semibold">
                {currentPage} / {numPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
                disabled={currentPage >= numPages}
                className="p-1.5 text-neutral-300 hover:text-white disabled:text-neutral-600 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
                title="Next Page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Zoom controls */}
          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-0.5">
            <button
              type="button"
              onClick={() => setScale(s => Math.max(0.6, s - 0.2))}
              className="p-1.5 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono text-neutral-400 px-1.5">
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setScale(s => Math.min(2.5, s + 0.2))}
              className="p-1.5 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setRotation(r => (r + 90) % 360)}
              className="p-1.5 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer border-l border-neutral-800 ml-0.5"
              title="Rotate 90°"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleDownload}
            className="px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 hover:border-neutral-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Download PDF"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Download</span>
          </button>
          <button
            type="button"
            onClick={handleOpenInNewTab}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Open In New Window"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open In Tab</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Scroll Area */}
      <div 
        ref={containerRef}
        style={{ maxHeight }}
        className="flex-1 overflow-auto p-4 flex items-center justify-center bg-neutral-950/80 min-h-[300px]"
      >
        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-neutral-400">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            <p className="text-xs font-mono">Rendering PDF document...</p>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center text-center p-6 max-w-md bg-rose-500/10 border border-rose-500/20 rounded-2xl">
            <AlertCircle className="w-8 h-8 text-rose-400 mb-2" />
            <p className="text-sm font-bold text-white mb-1">Preview Notice</p>
            <p className="text-xs text-neutral-300 mb-4">{error}</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownload}
                className="px-4 py-2 bg-amber-500 text-neutral-950 font-bold text-xs rounded-xl flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
              <button
                type="button"
                onClick={handleOpenInNewTab}
                className="px-4 py-2 bg-neutral-800 text-white font-bold text-xs rounded-xl flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" /> Open In Tab
              </button>
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="shadow-2xl rounded-lg overflow-hidden border border-neutral-800 bg-white inline-block">
            <canvas ref={canvasRef} className="block max-w-full" />
          </div>
        )}
      </div>
    </div>
  );
};
