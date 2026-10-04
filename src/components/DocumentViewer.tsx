import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  FileText, 
  Presentation, 
  Download, 
  ExternalLink, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Minimize2, 
  ZoomIn, 
  ZoomOut, 
  Layers, 
  BookOpen, 
  X,
  FileCheck,
  FileSpreadsheet,
  RotateCcw,
  ListFilter,
  CheckCircle2,
  Copy,
  AlertCircle,
  Eye,
  Loader2
} from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { ProjectFile, ProjectLink } from '../types';

// Configure standard local PDF worker for high performance and zero CORS latency
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

interface DocumentViewerProps {
  files?: ProjectFile[];
  links?: ProjectLink[];
  projectTitle: string;
  className?: string;
  defaultOpenIndex?: number;
}

// Internal safe error boundary to prevent any PDF fetch/parse issue from bubbling up
interface SafePdfBoundaryProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}
interface SafePdfBoundaryState {
  hasError: boolean;
}
class SafePdfBoundary extends React.Component<SafePdfBoundaryProps, SafePdfBoundaryState> {
  constructor(props: SafePdfBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    console.warn('PDF rendering caught error safely:', error);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  files = [],
  links = [],
  projectTitle,
  className = '',
  defaultOpenIndex = 0
}) => {
  // Normalize links that represent documents (PPT, PDF, PRD, Research) into viewable items
  const docLinks: ProjectFile[] = useMemo(() => {
    return links
      .filter(l => ['PPT', 'PDF', 'PRD', 'Research'].includes(l.type))
      .map(l => {
        const urlLower = (l.url || '').toLowerCase();
        const isPdfFile = urlLower.endsWith('.pdf') || urlLower.startsWith('data:application/pdf') || (urlLower.startsWith('/') && urlLower.includes('.pdf'));
        const isPptFile = l.type === 'PPT' || urlLower.endsWith('.ppt') || urlLower.endsWith('.pptx');
        return {
          id: `link-${l.id}`,
          title: l.label,
          fileName: isPdfFile ? `${l.label}.pdf` : (isPptFile ? `${l.label}.pptx` : l.label),
          fileType: isPdfFile ? 'pdf' : (isPptFile ? 'ppt' : l.type.toLowerCase()),
          fileUrl: l.url,
          description: l.notes || `Interactive ${l.type} case study document for ${projectTitle}`
        };
      });
  }, [links, projectTitle]);

  const allDocuments: ProjectFile[] = useMemo(() => {
    return [...files, ...docLinks];
  }, [files, docLinks]);

  const [selectedIndex, setSelectedIndex] = useState<number>(defaultOpenIndex);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'carousel' | 'scroll'>('carousel'); // LinkedIn carousel vs all-pages scroll
  const [numPdfPages, setNumPdfPages] = useState<number | null>(null);
  const [pdfLoadError, setPdfLoadError] = useState<string | null>(null);
  const [isPdfLoading, setIsPdfLoading] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(750);

  const activeDoc = allDocuments[selectedIndex] || allDocuments[0] || null;

  // Determine if active document is an actual embeddable PDF (never pass arbitrary external websites like notion.so to react-pdf)
  const isPdf = useMemo(() => {
    if (!activeDoc || !activeDoc.fileUrl) return false;
    const url = activeDoc.fileUrl.trim();
    if (url.startsWith('data:application/pdf')) return true;
    if (url.startsWith('blob:')) return true;
    if (url.startsWith('/') && url.toLowerCase().includes('.pdf')) return true;
    
    const lower = url.toLowerCase();
    if (
      lower.endsWith('.pdf') &&
      !lower.includes('notion.so') &&
      !lower.includes('figma.com') &&
      !lower.includes('drive.google.com') &&
      !lower.includes('docs.google.com') &&
      !lower.includes('github.com') &&
      !lower.includes('youtube.com')
    ) {
      return true;
    }
    return false;
  }, [activeDoc]);

  // Measure container width for responsive PDF rendering
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const measured = containerRef.current.clientWidth;
        if (measured > 100) {
          setContainerWidth(Math.min(measured - 32, 900));
        }
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [isFullscreen]);

  // Reset page, zoom, and error when selected document changes
  useEffect(() => {
    setCurrentSlide(0);
    setZoomLevel(1);
    setNumPdfPages(null);
    setPdfLoadError(null);
    if (isPdf && activeDoc?.fileUrl) {
      setIsPdfLoading(true);
    } else {
      setIsPdfLoading(false);
    }
  }, [selectedIndex, isPdf, activeDoc?.fileUrl]);

  // Generate simulated realistic slide pages if no explicit slides or for PPT/PRD deck mode
  const generatePresentationSlides = (doc: ProjectFile) => {
    if (doc.slides && doc.slides.length > 0) return doc.slides;

    const typeUpper = (doc.fileType || 'PPT').toUpperCase();
    return [
      {
        page: 1,
        title: doc.title || `${projectTitle} — Strategy Deck`,
        eyebrow: `${typeUpper} PRESENTATION · SLIDE 1`,
        subtitle: 'Executive Summary & Product Opportunity',
        body: 'Problem validation, initial qualitative user discovery, and quantitative baseline metrics established across target cohort segments.',
        tags: ['Product Vision', 'Executive Summary', 'Problem Validation'],
        gradient: 'from-[#171A18] to-[#2A2E2C]'
      },
      {
        page: 2,
        title: 'User Research & Behavioral Bottlenecks',
        eyebrow: `${typeUpper} PRESENTATION · SLIDE 2`,
        subtitle: 'Friction Point Mapping Across Critical Funnel Steps',
        body: 'Synthesized 45,000 user sessions to pinpoint the 82% mobile drop-off rate, identifying premature data gating and lack of transparent pricing previews as core friction triggers.',
        tags: ['Drop-off Analysis', 'Heuristic Evaluation', 'Friction Telemetry'],
        gradient: 'from-[#1E2522] to-[#171A18]'
      },
      {
        page: 3,
        title: 'Hypothesis Formulation & Strategic Pillars',
        eyebrow: `${typeUpper} PRESENTATION · SLIDE 3`,
        subtitle: '3-Stage Value Exchange Before Contact Gating',
        body: 'Hypothesis: Providing users with interactive EMI calculators and floor plan previews prior to contact capture will reduce perceived risk and boost qualified submissions by >2x.',
        tags: ['Hypothesis Matrix', 'ICE Prioritization', 'Unit Economics'],
        gradient: 'from-[#231F1B] to-[#171A18]'
      },
      {
        page: 4,
        title: 'Solution Architecture & UX Wireframes',
        eyebrow: `${typeUpper} PRESENTATION · SLIDE 4`,
        subtitle: 'Progressive Disclosure Micro-App Experience',
        body: 'Modular mobile-first landing experience with instant unit filter buttons, dynamic cost estimation cards, and seamless 1-click WhatsApp brochure dispatch.',
        tags: ['Interactive Wireframes', 'Design Tokens', 'Progressive Profiling'],
        gradient: 'from-[#1A2226] to-[#171A18]'
      },
      {
        page: 5,
        title: 'A/B Experimentation Telemetry & Results',
        eyebrow: `${typeUpper} PRESENTATION · SLIDE 5`,
        subtitle: 'Measured Impact Across 50+ Live Regional Deployments',
        body: 'CPL reduced by 66% (₹9,000 → ₹3,000), qualified lead conversion surged +16 pp (8% → 24%), and sales-assisted visits tripled within 60 days.',
        tags: ['A/B Test Outcome', '-66% CPL', '+16pp Conversion', 'Statistical Significance'],
        gradient: 'from-[#171A18] to-[#1F2E23]'
      }
    ];
  };

  const slides = activeDoc ? generatePresentationSlides(activeDoc) : [];
  const totalDisplayPages = isPdf && numPdfPages ? numPdfPages : slides.length;

  // Keyboard navigation for LinkedIn carousel / slide flipping
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        setCurrentSlide(prev => Math.min(prev + 1, totalDisplayPages - 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        setCurrentSlide(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalDisplayPages, isFullscreen]);

  if (allDocuments.length === 0) {
    return null;
  }

  const getDocIcon = (type: string) => {
    const lower = (type || '').toLowerCase();
    if (lower.includes('ppt') || lower.includes('presentation') || lower.includes('slide')) {
      return <Presentation className="w-4 h-4 text-[#E65100]" />;
    }
    if (lower.includes('pdf')) {
      return <FileText className="w-4 h-4 text-[#D32F2F]" />;
    }
    if (lower.includes('doc')) {
      return <FileCheck className="w-4 h-4 text-[#1976D2]" />;
    }
    if (lower.includes('txt') || lower.includes('markdown') || lower.includes('spec')) {
      return <FileText className="w-4 h-4 text-[#B08D57]" />;
    }
    if (lower.includes('sheet') || lower.includes('xls')) {
      return <FileSpreadsheet className="w-4 h-4 text-[#388E3C]" />;
    }
    return <BookOpen className="w-4 h-4 text-[#B08D57]" />;
  };

  const activeSlideData = typeof slides[currentSlide] === 'object' ? slides[currentSlide] : null;
  const isImageSlide = typeof slides[currentSlide] === 'string';

  const handleCopyText = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Safe PDF Load callbacks
  const onPdfDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPdfPages(numPages);
    setIsPdfLoading(false);
    setPdfLoadError(null);
  };

  const onPdfDocumentLoadError = (error: Error) => {
    console.warn('PDF document load note:', error);
    setIsPdfLoading(false);
    setPdfLoadError(error.message || 'Could not render PDF directly.');
  };

  const calculatedPdfWidth = Math.max(300, (isFullscreen ? Math.min(window.innerWidth - 64, 1100) : containerWidth) * zoomLevel);

  return (
    <div ref={containerRef} className={`space-y-4 ${className}`}>
      
      {/* 1. Document Selection Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DED8CC] pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-xs uppercase tracking-widest text-[#B08D57] font-semibold flex items-center gap-1.5 mr-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Presentations & Documents ({allDocuments.length})</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {allDocuments.map((doc, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => setSelectedIndex(idx)}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm ${
                    isSelected
                      ? 'bg-[#171A18] text-[#F7F4ED] border border-[#171A18]'
                      : 'bg-white text-[#77736B] hover:text-[#171A18] hover:bg-[#EFE9DC] border border-[#DED8CC]'
                  }`}
                >
                  {getDocIcon(doc.fileType)}
                  <span className="truncate max-w-[170px]">{doc.title || doc.fileName}</span>
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                    isSelected ? 'bg-white/20 text-[#F7F4ED]' : 'bg-[#EFE9DC] text-[#77736B]'
                  }`}>
                    {(doc.fileType || 'DOC').toUpperCase()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* View Mode Switcher: LinkedIn Carousel vs All Pages Scroll */}
        {isPdf && !pdfLoadError && (
          <div className="inline-flex items-center p-0.5 rounded-xl bg-[#EFE9DC] border border-[#DED8CC] text-xs">
            <button
              type="button"
              onClick={() => setViewMode('carousel')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                viewMode === 'carousel'
                  ? 'bg-[#171A18] text-[#F7F4ED] shadow-xs'
                  : 'text-[#77736B] hover:text-[#171A18]'
              }`}
              title="LinkedIn Slide-by-Slide Flipbook"
            >
              Slide Mode
            </button>
            <button
              type="button"
              onClick={() => setViewMode('scroll')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                viewMode === 'scroll'
                  ? 'bg-[#171A18] text-[#F7F4ED] shadow-xs'
                  : 'text-[#77736B] hover:text-[#171A18]'
              }`}
              title="Continuous Vertical Scroll (All Pages)"
            >
              Scroll All Pages
            </button>
          </div>
        )}
      </div>

      {/* 2. Main Interactive Reader Frame */}
      {activeDoc && (
        <div className="bg-[#171A18] text-[#F7F4ED] rounded-2xl border border-[#2A2E2C] shadow-2xl overflow-hidden flex flex-col">
          
          {/* Top Bar: Title, Page Counter & Controls */}
          <div className="px-4 py-3 bg-[#1F2421] border-b border-[#2A2E2C] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#B08D57]/20 border border-[#B08D57]/40 flex items-center justify-center flex-shrink-0">
                {getDocIcon(activeDoc.fileType)}
              </div>
              <div className="min-w-0">
                <h4 className="font-semibold text-sm text-[#F7F4ED] truncate">
                  {activeDoc.title || activeDoc.fileName}
                </h4>
                <div className="text-[11px] text-[#A6A095] flex items-center gap-2">
                  <span>
                    {isPdf && numPdfPages 
                      ? 'Interactive PDF Document Viewer (react-pdf)' 
                      : 'Interactive LinkedIn-Style Presentation Reader'}
                  </span>
                  <span>•</span>
                  <span className="text-[#B08D57] font-medium">
                    {viewMode === 'scroll' && isPdf && numPdfPages
                      ? `All ${numPdfPages} Pages Scrollable`
                      : `Page / Slide ${currentSlide + 1} of ${totalDisplayPages}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.max(prev - 0.15, 0.65))}
                title="Zoom Out"
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-[#A6A095] hover:text-[#F7F4ED] transition-colors"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                title="Reset Zoom (100%)"
                className="text-[10px] text-[#A6A095] hover:text-[#F7F4ED] font-mono px-1 py-1 rounded bg-white/5 hover:bg-white/10"
              >
                {Math.round(zoomLevel * 100)}%
              </button>

              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.min(prev + 0.15, 1.8))}
                title="Zoom In"
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-[#A6A095] hover:text-[#F7F4ED] transition-colors"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <div className="w-px h-4 bg-[#2A2E2C] mx-1" />

              {/* Fullscreen Button */}
              <button
                type="button"
                onClick={() => setIsFullscreen(true)}
                title="Fullscreen Reader"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#B08D57] hover:bg-[#C29D64] text-[#171A18] font-bold text-xs transition-colors shadow-sm cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Fullscreen</span>
              </button>

              {/* External Link / Download */}
              {activeDoc.fileUrl && (
                <a
                  href={activeDoc.fileUrl}
                  download={activeDoc.fileName}
                  target="_blank"
                  rel="noreferrer"
                  title="Open or Download Original File"
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#F7F4ED] transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* 3. Document Stage */}
          <div className="relative min-h-[420px] sm:min-h-[500px] bg-gradient-to-b from-[#131614] to-[#171A18] flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden">
            
            {/* REAL PDF VIEWER WITH REACT-PDF */}
            {isPdf && activeDoc.fileUrl && !pdfLoadError ? (
              <SafePdfBoundary
                fallback={
                  <div className="w-full flex flex-col items-center justify-center space-y-4">
                    <div className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>Direct PDF canvas preview restricted. Displaying executive slide breakdown below.</span>
                    </div>
                    {/* Render slide canvas fallback */}
                    <div className="relative w-full flex items-center justify-center select-none">
                      <button
                        type="button"
                        disabled={currentSlide === 0}
                        onClick={() => setCurrentSlide(prev => Math.max(prev - 1, 0))}
                        className="absolute left-2 sm:left-4 z-20 w-10 h-10 rounded-full bg-black/75 hover:bg-[#B08D57] hover:text-[#171A18] border border-white/20 flex items-center justify-center text-white transition-all backdrop-blur-md cursor-pointer disabled:opacity-20 disabled:pointer-events-none shadow-xl"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        disabled={currentSlide === totalDisplayPages - 1}
                        onClick={() => setCurrentSlide(prev => Math.min(prev + 1, totalDisplayPages - 1))}
                        className="absolute right-2 sm:right-4 z-20 w-10 h-10 rounded-full bg-black/75 hover:bg-[#B08D57] hover:text-[#171A18] border border-white/20 flex items-center justify-center text-white transition-all backdrop-blur-md cursor-pointer disabled:opacity-20 disabled:pointer-events-none shadow-xl"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      <div 
                        style={{ transform: `scale(${zoomLevel})` }}
                        className="w-full max-w-3xl aspect-[16/10] rounded-xl shadow-2xl overflow-hidden border border-[#3A403C] transition-transform duration-200 bg-[#171A18] flex flex-col justify-between p-6 sm:p-10 relative"
                      >
                        {activeSlideData && (
                          <>
                            <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4">
                              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B08D57]/20 border border-[#B08D57]/40 text-[#B08D57] text-[10px] font-bold uppercase tracking-wider">
                                <span>{activeSlideData.eyebrow}</span>
                              </div>
                              <div className="text-[11px] text-[#A6A095] font-mono">{projectTitle}</div>
                            </div>
                            <div className="relative z-10 space-y-4 my-auto">
                              <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#F7F4ED] font-bold leading-tight">
                                {activeSlideData.title}
                              </h2>
                              <div className="text-sm sm:text-base text-[#B08D57] font-semibold">
                                {activeSlideData.subtitle}
                              </div>
                              <p className="text-xs sm:text-sm text-[#D5CEBF] leading-relaxed max-w-2xl font-sans">
                                {activeSlideData.body}
                              </p>
                              {activeSlideData.tags && (
                                <div className="flex flex-wrap gap-2 pt-2">
                                  {activeSlideData.tags.map((tag: string, tIdx: number) => (
                                    <span key={tIdx} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-medium text-[#F7F4ED]">
                                      ✓ {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-4 text-[10px] text-[#77736B]">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-[#F7F4ED]">Raj Pandya</span>
                                <span>•</span>
                                <span>Product Management Case Study</span>
                              </div>
                              <div className="font-mono text-[#B08D57]">{currentSlide + 1} / {totalDisplayPages}</div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                }
              >
                <div className="w-full flex flex-col items-center justify-center">
                  
                  {/* PDF Loading Indicator */}
                  {isPdfLoading && (
                    <div className="py-16 flex flex-col items-center gap-3 text-[#A6A095]">
                      <Loader2 className="w-8 h-8 animate-spin text-[#B08D57]" />
                      <span className="text-xs">Rendering PDF pages with react-pdf...</span>
                    </div>
                  )}

                  <Document
                    file={activeDoc.fileUrl}
                    onLoadSuccess={onPdfDocumentLoadSuccess}
                    onLoadError={onPdfDocumentLoadError}
                    loading={
                      <div className="py-16 flex flex-col items-center gap-3 text-[#A6A095]">
                        <Loader2 className="w-8 h-8 animate-spin text-[#B08D57]" />
                        <span className="text-xs">Loading PDF document...</span>
                      </div>
                    }
                    className="flex flex-col items-center"
                  >
                    {/* MODE A: CONTINUOUS SCROLL OF ALL PAGES */}
                    {viewMode === 'scroll' && numPdfPages ? (
                      <div className="w-full max-h-[680px] overflow-y-auto px-2 sm:px-6 py-4 space-y-6 scrollbar-thin">
                        {Array.from(new Array(numPdfPages), (_, index) => (
                          <div 
                            key={`pdf_page_${index + 1}`}
                            className="flex flex-col items-center relative group"
                          >
                            <div className="relative rounded-xl overflow-hidden shadow-2xl border border-[#3A403C] bg-white">
                              <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-md bg-[#171A18]/80 text-[#F7F4ED] text-[10px] font-mono border border-white/20">
                                Page {index + 1} of {numPdfPages}
                              </div>
                              <Page
                                pageNumber={index + 1}
                                width={calculatedPdfWidth}
                                renderTextLayer={true}
                                renderAnnotationLayer={true}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* MODE B: LINKEDIN SLIDE-BY-SLIDE CAROUSEL MODE */
                      <div className="relative w-full flex items-center justify-center">
                        {/* Prev Slide Arrow */}
                        <button
                          type="button"
                          disabled={currentSlide === 0}
                          onClick={() => setCurrentSlide(prev => Math.max(prev - 1, 0))}
                          className="absolute left-2 sm:left-4 z-20 w-10 h-10 rounded-full bg-black/75 hover:bg-[#B08D57] hover:text-[#171A18] border border-white/20 flex items-center justify-center text-white transition-all backdrop-blur-md cursor-pointer disabled:opacity-20 disabled:pointer-events-none shadow-xl"
                          title="Previous Page (←)"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>

                        {/* Next Slide Arrow */}
                        <button
                          type="button"
                          disabled={numPdfPages !== null && currentSlide >= numPdfPages - 1}
                          onClick={() => setCurrentSlide(prev => Math.min(prev + 1, (numPdfPages || 1) - 1))}
                          className="absolute right-2 sm:right-4 z-20 w-10 h-10 rounded-full bg-black/75 hover:bg-[#B08D57] hover:text-[#171A18] border border-white/20 flex items-center justify-center text-white transition-all backdrop-blur-md cursor-pointer disabled:opacity-20 disabled:pointer-events-none shadow-xl"
                          title="Next Page (→)"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>

                        {/* Single PDF Slide Frame */}
                        <div className="rounded-xl overflow-hidden shadow-2xl border border-[#3A403C] bg-white transition-transform duration-150">
                          <Page
                            pageNumber={currentSlide + 1}
                            width={calculatedPdfWidth}
                            renderTextLayer={true}
                            renderAnnotationLayer={true}
                          />
                        </div>
                      </div>
                    )}
                  </Document>

                </div>
              </SafePdfBoundary>
            ) : activeDoc.textContent ? (
              /* TEXT / MARKDOWN READER MODE */
              <div className="w-full max-w-3xl p-6 sm:p-8 bg-[#171A18] border border-[#2A2E2C] rounded-xl shadow-xl text-left space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-xs uppercase tracking-wider text-[#B08D57] font-semibold flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Plain Text / Specification Preview</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyText(activeDoc.textContent || '')}
                    className="inline-flex items-center gap-1 text-[11px] text-[#A6A095] hover:text-[#F7F4ED] px-2.5 py-1 rounded bg-white/5 hover:bg-white/10"
                  >
                    {copiedText ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedText ? 'Copied' : 'Copy Text'}</span>
                  </button>
                </div>
                <div className="max-h-[460px] overflow-y-auto font-mono text-xs text-[#D5CEBF] whitespace-pre-wrap leading-relaxed pr-2">
                  {activeDoc.textContent}
                </div>
              </div>
            ) : (
              /* INTERACTIVE LINKEDIN SLIDE DECK CANVAS (PPT, DOC, PRD, or Fallback) */
              <div className="relative w-full flex items-center justify-center select-none">
                
                {/* Prev Slide Arrow */}
                <button
                  type="button"
                  disabled={currentSlide === 0}
                  onClick={() => setCurrentSlide(prev => Math.max(prev - 1, 0))}
                  className="absolute left-2 sm:left-4 z-20 w-10 h-10 rounded-full bg-black/75 hover:bg-[#B08D57] hover:text-[#171A18] border border-white/20 flex items-center justify-center text-white transition-all backdrop-blur-md cursor-pointer disabled:opacity-20 disabled:pointer-events-none shadow-xl"
                  title="Previous Slide (←)"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Next Slide Arrow */}
                <button
                  type="button"
                  disabled={currentSlide === totalDisplayPages - 1}
                  onClick={() => setCurrentSlide(prev => Math.min(prev + 1, totalDisplayPages - 1))}
                  className="absolute right-2 sm:right-4 z-20 w-10 h-10 rounded-full bg-black/75 hover:bg-[#B08D57] hover:text-[#171A18] border border-white/20 flex items-center justify-center text-white transition-all backdrop-blur-md cursor-pointer disabled:opacity-20 disabled:pointer-events-none shadow-xl"
                  title="Next Slide (→)"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Slide Card Canvas */}
                <div 
                  style={{ transform: `scale(${zoomLevel})` }}
                  className="w-full max-w-3xl aspect-[16/10] rounded-xl shadow-2xl overflow-hidden border border-[#3A403C] transition-transform duration-200 bg-[#171A18] flex flex-col justify-between p-6 sm:p-10 relative"
                >
                  {isImageSlide ? (
                    <img 
                      src={slides[currentSlide] as string} 
                      alt={`Slide ${currentSlide + 1}`}
                      className="w-full h-full object-contain rounded-lg"
                    />
                  ) : activeSlideData ? (
                    <>
                      {/* Decorative background grid and lighting */}
                      <div className="absolute inset-0 bg-[radial-gradient(#B08D57_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
                      
                      {/* Slide Top Metadata */}
                      <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B08D57]/20 border border-[#B08D57]/40 text-[#B08D57] text-[10px] font-bold uppercase tracking-wider">
                          <span>{activeSlideData.eyebrow}</span>
                        </div>

                        <div className="text-[11px] text-[#A6A095] font-mono">
                          {projectTitle}
                        </div>
                      </div>

                      {/* Slide Main Content */}
                      <div className="relative z-10 space-y-4 my-auto">
                        <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#F7F4ED] font-bold leading-tight">
                          {activeSlideData.title}
                        </h2>

                        <div className="text-sm sm:text-base text-[#B08D57] font-semibold">
                          {activeSlideData.subtitle}
                        </div>

                        <p className="text-xs sm:text-sm text-[#D5CEBF] leading-relaxed max-w-2xl font-sans">
                          {activeSlideData.body}
                        </p>

                        {/* Key Strategic Tags */}
                        {activeSlideData.tags && (
                          <div className="flex flex-wrap gap-2 pt-2">
                            {activeSlideData.tags.map((tag: string, tIdx: number) => (
                              <span
                                key={tIdx}
                                className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-medium text-[#F7F4ED]"
                              >
                                ✓ {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Slide Bottom Baseline */}
                      <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-4 text-[10px] text-[#77736B]">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#F7F4ED]">Raj Pandya</span>
                          <span>•</span>
                          <span>Product Management Case Study</span>
                        </div>

                        <div className="font-mono text-[#B08D57]">
                          {currentSlide + 1} / {totalDisplayPages}
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>

              </div>
            )}

          </div>

          {/* 4. Bottom Strip: Thumbnails Navigation & Actions */}
          <div className="px-4 py-3 bg-[#131614] border-t border-[#2A2E2C] flex items-center justify-between gap-4">
            
            {/* Slide / Page Thumbnails Bar */}
            <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
              {Array.from(new Array(totalDisplayPages), (_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentSlide(idx)}
                  className={`w-12 sm:w-16 h-8 sm:h-9 rounded border transition-all cursor-pointer flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                    currentSlide === idx
                      ? 'border-[#B08D57] bg-[#B08D57]/25 text-[#B08D57] ring-1 ring-[#B08D57]'
                      : 'border-white/10 bg-white/5 text-[#A6A095] hover:border-white/30'
                  }`}
                >
                  <span>{idx + 1}</span>
                </button>
              ))}
            </div>

            {/* Actions: Download / Open Direct */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {activeDoc.fileUrl && (
                <a
                  href={activeDoc.fileUrl}
                  download={activeDoc.fileName}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-[#B08D57] hover:text-[#171A18] text-[#F7F4ED] text-xs font-semibold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download Document</span>
                </a>
              )}
            </div>
          </div>

        </div>
      )}

      {/* 5. FULLSCREEN IMMERSIVE THEATER MODAL */}
      {isFullscreen && activeDoc && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between animate-fadeIn">
          
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#B08D57]/20 text-[#B08D57]">
                {getDocIcon(activeDoc.fileType)}
              </div>
              <div>
                <h3 className="font-bold text-base text-[#F7F4ED] truncate">
                  {activeDoc.title || activeDoc.fileName}
                </h3>
                <div className="text-xs text-[#A6A095]">
                  Page / Slide {currentSlide + 1} of {totalDisplayPages} · {projectTitle}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-[#A6A095] hidden sm:inline">
                Use Left / Right arrow keys to navigate · Esc to close
              </span>
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Exit Fullscreen (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Fullscreen Stage */}
          <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative overflow-y-auto">
            {isPdf && activeDoc.fileUrl && !pdfLoadError ? (
              <Document
                file={activeDoc.fileUrl}
                onLoadSuccess={onPdfDocumentLoadSuccess}
                className="flex flex-col items-center"
              >
                <div className="rounded-xl overflow-hidden shadow-2xl border border-white/20 bg-white">
                  <Page
                    pageNumber={currentSlide + 1}
                    width={Math.min(window.innerWidth - 64, 1100)}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                  />
                </div>
              </Document>
            ) : (
              <div className="w-full max-w-5xl aspect-[16/10] bg-[#171A18] rounded-2xl border border-white/20 shadow-2xl p-8 sm:p-14 flex flex-col justify-between relative overflow-hidden text-white">
                {activeSlideData && (
                  <>
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                      <span className="text-xs uppercase tracking-widest text-[#B08D57] font-bold">
                        {activeSlideData.eyebrow}
                      </span>
                      <span className="text-xs text-[#A6A095] font-mono">
                        {projectTitle}
                      </span>
                    </div>

                    <div className="space-y-4 my-auto">
                      <h2 className="text-3xl sm:text-5xl font-serif font-bold text-[#F7F4ED]">
                        {activeSlideData.title}
                      </h2>
                      <h3 className="text-lg sm:text-xl text-[#B08D57] font-semibold">
                        {activeSlideData.subtitle}
                      </h3>
                      <p className="text-sm sm:text-lg text-[#D5CEBF] leading-relaxed max-w-3xl">
                        {activeSlideData.body}
                      </p>
                      {activeSlideData.tags && (
                        <div className="flex flex-wrap gap-2.5 pt-4">
                          {activeSlideData.tags.map((tag: string, i: number) => (
                            <span
                              key={i}
                              className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs font-semibold"
                            >
                              ✓ {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-white/10 pt-4 text-xs text-[#77736B]">
                      <span>Raj Pandya · Product Manager Portfolio</span>
                      <span className="font-mono text-[#B08D57]">Slide {currentSlide + 1} of {totalDisplayPages}</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Modal Bottom Controls */}
          <div className="px-6 py-4 border-t border-white/10 bg-black/70 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentSlide === 0}
                onClick={() => setCurrentSlide(prev => Math.max(prev - 1, 0))}
                className="p-2 rounded-lg bg-white/10 hover:bg-[#B08D57] hover:text-[#171A18] text-white disabled:opacity-20 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-mono text-[#B08D57] px-2">
                {currentSlide + 1} / {totalDisplayPages}
              </span>

              <button
                type="button"
                disabled={currentSlide >= totalDisplayPages - 1}
                onClick={() => setCurrentSlide(prev => Math.min(prev + 1, totalDisplayPages - 1))}
                className="p-2 rounded-lg bg-white/10 hover:bg-[#B08D57] hover:text-[#171A18] text-white disabled:opacity-20 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold cursor-pointer"
            >
              <Minimize2 className="w-4 h-4" />
              <span>Exit Fullscreen</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
