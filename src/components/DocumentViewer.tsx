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
  CheckCircle2,
  Copy,
  AlertCircle,
  Loader2,
  MonitorPlay,
  FileCode
} from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { ProjectFile, ProjectLink, SlideItem } from '../types';
import { analyzeUploadedDocument, ParsedDocumentResult } from '../utils/documentAnalyzer';

// Configure standard local PDF worker for high performance and zero CORS latency
if (typeof window !== 'undefined') {
  try {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url,
    ).toString();
  } catch {
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  }
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

// Helper to extract embeddable URLs for Google Drive, Google Slides, Google Docs, or Office
function getEmbedUrl(url: string | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  // Google Drive preview embed
  const driveFileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveFileMatch) {
    return `https://drive.google.com/file/d/${driveFileMatch[1]}/preview`;
  }
  const driveIdParam = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (trimmed.includes('drive.google.com') && driveIdParam) {
    return `https://drive.google.com/file/d/${driveIdParam[1]}/preview`;
  }

  // Google Slides embed
  if (trimmed.includes('docs.google.com/presentation')) {
    const slideMatch = trimmed.match(/\/presentation\/d\/([a-zA-Z0-9_-]+)/);
    if (slideMatch) {
      return `https://docs.google.com/presentation/d/${slideMatch[1]}/embed?start=false&loop=false&delayms=3000`;
    }
  }

  // Google Docs embed
  if (trimmed.includes('docs.google.com/document')) {
    const docMatch = trimmed.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
    if (docMatch) {
      return `https://docs.google.com/document/d/${docMatch[1]}/preview`;
    }
  }

  return null;
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
          pageCount: 5,
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
  const [viewMode, setViewMode] = useState<'carousel' | 'scroll'>('carousel'); // Slide Mode vs Scroll All Pages
  const [renderMode, setRenderMode] = useState<'slides' | 'embed'>('slides'); // Slide mode vs Cloud Embed
  const [numPdfPages, setNumPdfPages] = useState<number | null>(null);
  const [pdfLoadError, setPdfLoadError] = useState<string | null>(null);
  const [isPdfLoading, setIsPdfLoading] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [dynamicAnalysis, setDynamicAnalysis] = useState<ParsedDocumentResult | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(750);

  const activeDoc = allDocuments[selectedIndex] || allDocuments[0] || null;

  // Dynamically analyze uploaded source file in background to determine actual slide/page count
  // Core rule: Source file count = generated page/slide count. NEVER cap or truncate.
  useEffect(() => {
    setDynamicAnalysis(null);
    if (!activeDoc?.fileUrl) return;

    let isMounted = true;
    async function runSourceAnalysis() {
      try {
        let blob: Blob | null = null;
        if (activeDoc.fileUrl.startsWith('data:')) {
          const res = await fetch(activeDoc.fileUrl);
          blob = await res.blob();
        } else if (activeDoc.fileUrl.startsWith('blob:') || activeDoc.fileUrl.startsWith('/') || activeDoc.fileUrl.startsWith('http')) {
          try {
            const res = await fetch(activeDoc.fileUrl);
            if (res.ok) {
              blob = await res.blob();
            }
          } catch {
            // Remote CORS or protected URL
          }
        }

        if (blob && isMounted) {
          const fileObj = new File([blob], activeDoc.fileName || 'source_file', { type: blob.type });
          const result = await analyzeUploadedDocument(fileObj);
          if (isMounted && result.pageCount > 0) {
            setDynamicAnalysis(result);
          }
        }
      } catch (err) {
        console.warn('Dynamic document analysis note:', err);
      }
    }

    runSourceAnalysis();
    return () => { isMounted = false; };
  }, [activeDoc?.id, activeDoc?.fileUrl, activeDoc?.fileName]);

  // Cloud Embed URL (e.g. Google Drive, Google Slides, Google Docs)
  const embedUrl = useMemo(() => {
    return activeDoc ? getEmbedUrl(activeDoc.fileUrl) : null;
  }, [activeDoc]);

  // Determine if active document is an actual embeddable PDF for react-pdf
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

  // Reset slide, zoom, and state when active document changes
  useEffect(() => {
    setCurrentSlide(0);
    setZoomLevel(1);
    setNumPdfPages(null);
    setPdfLoadError(null);
    setRenderMode('slides');
    if (isPdf && activeDoc?.fileUrl) {
      setIsPdfLoading(true);
    } else {
      setIsPdfLoading(false);
    }
  }, [selectedIndex, isPdf, activeDoc?.fileUrl]);

  // Safe timeout to dismiss PDF loading spinner if stuck
  useEffect(() => {
    if (isPdfLoading) {
      const timer = setTimeout(() => {
        setIsPdfLoading(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isPdfLoading]);

  // Generate dynamic, comprehensive presentation slides matching the document's actual page count
  // Core rule: Source file count = generated page/slide count. NEVER cap, truncate, or assume a fixed limit.
  const generatePresentationSlides = (doc: ProjectFile) => {
    // 1. If dynamic analysis has extracted slides from the source file, use them directly
    if (dynamicAnalysis?.slides && dynamicAnalysis.slides.length > 0) {
      return dynamicAnalysis.slides;
    }

    // 2. If the document has explicitly specified slides, use them directly
    if (doc.slides && doc.slides.length > 0) {
      return doc.slides.map((s, idx) => {
        if (typeof s === 'string') {
          return {
            page: idx + 1,
            title: `${doc.title || 'Slide'} — Page ${idx + 1}`,
            subtitle: `Slide ${idx + 1} of ${doc.slides!.length}`,
            eyebrow: `${(doc.fileType || 'PPT').toUpperCase()} PRESENTATION · SLIDE ${idx + 1}`,
            imageUrl: s,
            gradient: 'from-[#171A18] to-[#2A2E2C]'
          };
        }
        return s;
      });
    }

    // 3. Dynamic generation matching the exact source file count
    // Source file count = generated page/slide count.
    // 28-slide PPT → 28 slides. 17-slide PPT → 17 slides. 50-slide PPT → 50 slides.
    const targetCount = Math.max(
      dynamicAnalysis?.pageCount || 0,
      doc.pageCount || 0,
      numPdfPages || 0,
      1
    );

    const typeUpper = (doc.fileType || 'PPT').toUpperCase();
    const docTitle = doc.title || `${projectTitle} Strategy Deck`;

    const standardThemes = [
      {
        title: docTitle,
        eyebrow: `${typeUpper} PRESENTATION · SLIDE 1`,
        subtitle: 'Executive Summary & Product Opportunity',
        body: doc.description || `Comprehensive strategic breakdown and executive case study analysis for ${projectTitle}.`,
        tags: ['Product Vision', 'Executive Summary', 'Problem Validation'],
        gradient: 'from-[#171A18] to-[#2A2E2C]'
      },
      {
        title: 'Problem Framing & User Behavioral Friction',
        eyebrow: `${typeUpper} PRESENTATION · SLIDE 2`,
        subtitle: 'Critical Funnel Drop-off & Qualitative Bottlenecks',
        body: 'Synthesized telemetry data and user session recordings to identify premature cognitive gating and high friction points across target cohort segments.',
        tags: ['Drop-off Telemetry', 'Heuristic Audit', 'User Friction'],
        gradient: 'from-[#1E2522] to-[#171A18]'
      },
      {
        title: 'Field Research, Interviews & User Archetypes',
        eyebrow: `${typeUpper} PRESENTATION · SLIDE 3`,
        subtitle: 'Primary Discovery Insights Across Key Stakeholders',
        body: 'Synthesized deep-dive qualitative interviews with target users to uncover underlying mental models, anxieties, and implicit job-to-be-done motivators.',
        tags: ['User Archetypes', 'Field Discovery', 'JTBD Framework'],
        gradient: 'from-[#231F1B] to-[#171A18]'
      },
      {
        title: 'Market Opportunity (TAM / SAM / SOM) & Benchmark',
        eyebrow: `${typeUpper} PRESENTATION · SLIDE 4`,
        subtitle: 'Addressable Industry Headroom & Competitive Gaps',
        body: 'Quantified total addressable market potential, service addressable segment base, and near-term serviceable obtainable market capture trajectory.',
        tags: ['Market Sizing', 'TAM / SAM / SOM', 'Competitive Teardown'],
        gradient: 'from-[#182126] to-[#171A18]'
      },
      {
        title: 'Strategic Hypothesis & Prioritization Matrix',
        eyebrow: `${typeUpper} PRESENTATION · SLIDE 5`,
        subtitle: 'Value Exchange Model Prior to High-Commitment Gates',
        body: 'Hypothesis: Providing users with immediate contextual value and transparent previews prior to high friction gates reduces risk perception and surges qualified conversions.',
        tags: ['ICE Matrix', 'Strategic Hypothesis', 'Value Exchange'],
        gradient: 'from-[#171A18] to-[#251E1C]'
      },
      {
        title: 'Solution Architecture, User Flow & UX Wireframes',
        eyebrow: `${typeUpper} PRESENTATION · SLIDE 6`,
        subtitle: 'Modular End-to-End User Experience Blueprint',
        body: 'Engineered modular mobile-first interfaces with progressive disclosure, real-time feedback loops, and frictionless transition into high-intent actions.',
        tags: ['Information Architecture', 'Wireframes', 'Progressive Disclosure'],
        gradient: 'from-[#1A2226] to-[#171A18]'
      },
      {
        title: 'A/B Experimentation & Live Telemetry Loops',
        eyebrow: `${typeUpper} PRESENTATION · SLIDE 7`,
        subtitle: 'Multi-variant Testing Across High-Velocity Cohorts',
        body: 'Designed and deployed iterative experiment variants evaluating copy framing, entry micro-incentives, and streamlined multi-step verification.',
        tags: ['A/B Testing', 'Multivariate CRO', 'Statistical Significance'],
        gradient: 'from-[#1E231D] to-[#171A18]'
      },
      {
        title: 'Measured Business Impact & Conversion Telemetry',
        eyebrow: `${typeUpper} PRESENTATION · SLIDE 8`,
        subtitle: 'Verified Quantitative Lift Across Key Funnel KPIs',
        body: 'Demonstrated statistically significant lift in qualified completion rates, sharp drop in acquisition costs, and permanent improvement in pipeline velocity.',
        tags: ['KPI Uplift', 'CPL Reduction', 'Pipeline Attribution'],
        gradient: 'from-[#171A18] to-[#1F2E23]'
      },
      {
        title: 'Unit Economics, CAC/LTV & Operational Scale',
        eyebrow: `${typeUpper} PRESENTATION · SLIDE 9`,
        subtitle: 'Sustainable Unit Economics & Downstream Efficiency',
        body: 'Substantially compressed payback periods while scaling qualified lead throughput and eliminating downstream sales review bottlenecks.',
        tags: ['Unit Economics', 'Payback Period', 'Scalable Operations'],
        gradient: 'from-[#241F1A] to-[#171A18]'
      },
      {
        title: 'Key Learnings, Roadmap & Next Phase Iterations',
        eyebrow: `${typeUpper} PRESENTATION · SLIDE 10`,
        subtitle: 'Long-term Product Vision & Scaled Expansion Strategy',
        body: 'Key strategic takeaways, operational guardrails established, and prioritized phase-two features for continued ecosystem expansion.',
        tags: ['Strategic Takeaways', 'Phased Roadmap', 'Product Vision'],
        gradient: 'from-[#171A18] to-[#2A2B23]'
      }
    ];

    // Build array for ALL slides up to targetCount (1 ... targetCount) without skipping any slide
    const generated: any[] = [];
    for (let i = 0; i < targetCount; i++) {
      const slideNum = i + 1;
      if (i < standardThemes.length) {
        generated.push({
          page: slideNum,
          ...standardThemes[i],
          eyebrow: `${typeUpper} PRESENTATION · SLIDE ${slideNum} OF ${targetCount}`,
          subtitle: `Slide ${slideNum} of ${targetCount}`
        });
      } else {
        generated.push({
          page: slideNum,
          title: `${docTitle} — Section ${slideNum}`,
          eyebrow: `${typeUpper} PRESENTATION · SLIDE ${slideNum} OF ${targetCount}`,
          subtitle: `Slide ${slideNum} of ${targetCount}`,
          body: `Detailed analytical deep dive, architectural schemas, and operational considerations corresponding to slide ${slideNum} of this deliverable.`,
          tags: ['Technical Deep Dive', 'Deliverable', `Slide ${slideNum}`],
          gradient: 'from-[#171A18] to-[#202522]'
        });
      }
    }

    return generated;
  };

  const slides = useMemo(() => {
    return activeDoc ? generatePresentationSlides(activeDoc) : [];
  }, [activeDoc, projectTitle, dynamicAnalysis, numPdfPages]);

  // Total pages: Accurately computed according to the document type and source
  // Source file count = generated page/slide count
  const totalDisplayPages = useMemo(() => {
    if (dynamicAnalysis?.pageCount && dynamicAnalysis.pageCount > 0) {
      return dynamicAnalysis.pageCount;
    }
    if (isPdf && numPdfPages && numPdfPages > 0) {
      return numPdfPages;
    }
    if (activeDoc?.pageCount && activeDoc.pageCount > 0) {
      return activeDoc.pageCount;
    }
    if (activeDoc?.slides && activeDoc.slides.length > 0) {
      return activeDoc.slides.length;
    }
    return slides.length || 1;
  }, [dynamicAnalysis?.pageCount, isPdf, numPdfPages, activeDoc?.pageCount, activeDoc?.slides, slides.length]);

  // Keep current slide within valid bounds if totalDisplayPages updates
  useEffect(() => {
    if (currentSlide >= totalDisplayPages && totalDisplayPages > 0) {
      setCurrentSlide(totalDisplayPages - 1);
    }
  }, [totalDisplayPages, currentSlide]);

  // Global Keyboard navigation for slide flipping and fullscreen toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
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

  const getDocIcon = (type: string | undefined) => {
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
  const onPdfDocumentLoadSuccess = (pdf: any) => {
    const count = pdf?.numPages || 1;
    setNumPdfPages(count);
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
      
      {/* 1. Document Selection Tabs & Mode Switchers */}
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
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs ${
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

        {/* View Mode Switcher: Slide Mode (Flipbook) vs Scroll All Pages */}
        <div className="flex items-center gap-2">
          {embedUrl && (
            <div className="inline-flex items-center p-0.5 rounded-xl bg-[#EFE9DC] border border-[#DED8CC] text-xs">
              <button
                type="button"
                onClick={() => setRenderMode('slides')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  renderMode === 'slides'
                    ? 'bg-[#171A18] text-[#F7F4ED] shadow-xs'
                    : 'text-[#77736B] hover:text-[#171A18]'
                }`}
                title="Interactive Slide Reader"
              >
                Reader
              </button>
              <button
                type="button"
                onClick={() => setRenderMode('embed')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  renderMode === 'embed'
                    ? 'bg-[#171A18] text-[#F7F4ED] shadow-xs'
                    : 'text-[#77736B] hover:text-[#171A18]'
                }`}
                title="Live Cloud Document Embed"
              >
                <MonitorPlay className="w-3 h-3" />
                <span>Live Embed</span>
              </button>
            </div>
          )}

          {renderMode === 'slides' && (
            <div className="inline-flex items-center p-0.5 rounded-xl bg-[#EFE9DC] border border-[#DED8CC] text-xs">
              <button
                type="button"
                onClick={() => setViewMode('carousel')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  viewMode === 'carousel'
                    ? 'bg-[#171A18] text-[#F7F4ED] shadow-xs'
                    : 'text-[#77736B] hover:text-[#171A18]'
                }`}
                title="Slide-by-Slide LinkedIn Style Carousel"
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
                      ? 'PDF Document Viewer' 
                      : (activeDoc.fileType?.toUpperCase() || 'PPT') + ' Presentation Deck'}
                  </span>
                  <span>•</span>
                  <span className="text-[#B08D57] font-medium">
                    {viewMode === 'scroll'
                      ? `All ${totalDisplayPages} Pages Scrollable`
                      : `Page / Slide ${currentSlide + 1} of ${totalDisplayPages}`}
                  </span>
                  {isPdfLoading && (
                    <span className="inline-flex items-center gap-1 text-amber-400 font-mono text-[10px]">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Loading...</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Direct Page Jump Selector */}
              {totalDisplayPages > 1 && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px]">
                  <span className="text-[#A6A095] hidden sm:inline">Page:</span>
                  <select
                    value={currentSlide}
                    onChange={(e) => setCurrentSlide(parseInt(e.target.value) || 0)}
                    className="bg-transparent text-[#F7F4ED] font-mono outline-none cursor-pointer"
                  >
                    {Array.from(new Array(totalDisplayPages), (_, i) => (
                      <option key={i} value={i} className="bg-[#171A18] text-[#F7F4ED]">
                        {i + 1} of {totalDisplayPages}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Zoom Controls (for PDF or slides) */}
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
            
            {/* OPTION 1: LIVE CLOUD EMBED (Google Drive, Google Docs, Slides) */}
            {renderMode === 'embed' && embedUrl ? (
              <div className="w-full h-[580px] rounded-xl overflow-hidden border border-[#3A403C] shadow-2xl bg-black">
                <iframe
                  src={embedUrl}
                  title={activeDoc.title || activeDoc.fileName}
                  className="w-full h-full border-0"
                  allow="autoplay"
                />
              </div>
            ) : isPdf && activeDoc.fileUrl && !pdfLoadError ? (
              /* OPTION 2: REAL PDF VIEWER WITH REACT-PDF */
              <SafePdfBoundary
                fallback={
                  <div className="w-full flex flex-col items-center justify-center space-y-4">
                    <div className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>Direct PDF canvas preview restricted. Displaying presentation breakdown below.</span>
                    </div>
                    {/* Render slide canvas fallback */}
                    <div className="relative w-full flex items-center justify-center select-none">
                      <button
                        type="button"
                        disabled={currentSlide <= 0}
                        onClick={() => setCurrentSlide(prev => Math.max(prev - 1, 0))}
                        className="absolute left-2 sm:left-4 z-20 w-10 h-10 rounded-full bg-black/80 hover:bg-[#B08D57] hover:text-[#171A18] border border-white/20 flex items-center justify-center text-white transition-all backdrop-blur-md cursor-pointer disabled:opacity-20 disabled:pointer-events-none shadow-xl"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        disabled={currentSlide >= totalDisplayPages - 1}
                        onClick={() => setCurrentSlide(prev => Math.min(prev + 1, totalDisplayPages - 1))}
                        className="absolute right-2 sm:right-4 z-20 w-10 h-10 rounded-full bg-black/80 hover:bg-[#B08D57] hover:text-[#171A18] border border-white/20 flex items-center justify-center text-white transition-all backdrop-blur-md cursor-pointer disabled:opacity-20 disabled:pointer-events-none shadow-xl"
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
                                <span>Product Case Study</span>
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
                  <Document
                    file={activeDoc.fileUrl}
                    onLoadSuccess={onPdfDocumentLoadSuccess}
                    onLoadError={onPdfDocumentLoadError}
                    loading={
                      <div className="py-12 flex flex-col items-center gap-3 text-[#A6A095]">
                        <Loader2 className="w-8 h-8 animate-spin text-[#B08D57]" />
                        <span className="text-xs font-mono">Loading PDF document pages...</span>
                      </div>
                    }
                    className="flex flex-col items-center"
                  >
                    {/* MODE A: CONTINUOUS SCROLL OF ALL PAGES */}
                    {viewMode === 'scroll' ? (
                      <div className="w-full max-h-[680px] overflow-y-auto px-2 sm:px-6 py-4 space-y-6 scrollbar-thin">
                        {Array.from(new Array(totalDisplayPages), (_, index) => (
                          <div 
                            key={`pdf_page_${index + 1}`}
                            className="flex flex-col items-center relative group"
                          >
                            <div className="relative rounded-xl overflow-hidden shadow-2xl border border-[#3A403C] bg-white">
                              <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-md bg-[#171A18]/85 text-[#F7F4ED] text-[10px] font-mono border border-white/20 backdrop-blur-xs">
                                Page {index + 1} of {totalDisplayPages}
                              </div>
                              <Page
                                pageNumber={index + 1}
                                width={calculatedPdfWidth}
                                renderTextLayer={true}
                                renderAnnotationLayer={true}
                                onRenderSuccess={() => setIsPdfLoading(false)}
                                onLoadSuccess={() => setIsPdfLoading(false)}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* MODE B: SLIDE-BY-SLIDE FLIPBOOK (CAROUSEL) */
                      <div className="relative w-full flex items-center justify-center">
                        {/* Prev Slide Arrow */}
                        <button
                          type="button"
                          disabled={currentSlide <= 0}
                          onClick={() => setCurrentSlide(prev => Math.max(prev - 1, 0))}
                          className="absolute left-2 sm:left-4 z-20 w-10 h-10 rounded-full bg-black/80 hover:bg-[#B08D57] hover:text-[#171A18] border border-white/20 flex items-center justify-center text-white transition-all backdrop-blur-md cursor-pointer disabled:opacity-20 disabled:pointer-events-none shadow-xl"
                          title="Previous Page (←)"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>

                        {/* Next Slide Arrow */}
                        <button
                          type="button"
                          disabled={currentSlide >= totalDisplayPages - 1}
                          onClick={() => setCurrentSlide(prev => Math.min(prev + 1, totalDisplayPages - 1))}
                          className="absolute right-2 sm:right-4 z-20 w-10 h-10 rounded-full bg-black/80 hover:bg-[#B08D57] hover:text-[#171A18] border border-white/20 flex items-center justify-center text-white transition-all backdrop-blur-md cursor-pointer disabled:opacity-20 disabled:pointer-events-none shadow-xl"
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
                            onRenderSuccess={() => setIsPdfLoading(false)}
                            onLoadSuccess={() => setIsPdfLoading(false)}
                          />
                        </div>
                      </div>
                    )}
                  </Document>

                </div>
              </SafePdfBoundary>
            ) : activeDoc.textContent ? (
              /* OPTION 3: TEXT / MARKDOWN READER MODE */
              <div className="w-full max-w-3xl p-6 sm:p-8 bg-[#171A18] border border-[#2A2E2C] rounded-xl shadow-xl text-left space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-xs uppercase tracking-wider text-[#B08D57] font-semibold flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Specification & Requirements Document</span>
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
                <div className="max-h-[480px] overflow-y-auto font-mono text-xs text-[#D5CEBF] whitespace-pre-wrap leading-relaxed pr-2">
                  {activeDoc.textContent}
                </div>
              </div>
            ) : viewMode === 'scroll' ? (
              /* OPTION 4A: PPT / DOC SCROLL ALL PAGES VERTICALLY */
              <div className="w-full max-h-[680px] overflow-y-auto px-2 sm:px-6 py-4 space-y-6 scrollbar-thin">
                {slides.map((sItem: any, idx: number) => (
                  <div key={`slide_scroll_${idx}`} className="flex flex-col items-center">
                    <div 
                      style={{ transform: `scale(${zoomLevel})` }}
                      className="w-full max-w-3xl aspect-[16/10] rounded-xl shadow-2xl overflow-hidden border border-[#3A403C] bg-[#171A18] flex flex-col justify-between p-6 sm:p-10 relative"
                    >
                      {typeof sItem === 'string' ? (
                        <img 
                          src={sItem} 
                          alt={`Slide ${idx + 1}`}
                          className="w-full h-full object-contain rounded-lg"
                        />
                      ) : (
                        <>
                          <div className="absolute inset-0 bg-[radial-gradient(#B08D57_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
                          <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B08D57]/20 border border-[#B08D57]/40 text-[#B08D57] text-[10px] font-bold uppercase tracking-wider">
                              <span>{sItem.eyebrow}</span>
                            </div>
                            <div className="text-[11px] text-[#A6A095] font-mono">{projectTitle}</div>
                          </div>
                          <div className="relative z-10 space-y-4 my-auto">
                            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#F7F4ED] font-bold leading-tight">
                              {sItem.title}
                            </h2>
                            <div className="text-sm sm:text-base text-[#B08D57] font-semibold">
                              {sItem.subtitle}
                            </div>
                            <p className="text-xs sm:text-sm text-[#D5CEBF] leading-relaxed max-w-2xl font-sans">
                              {sItem.body}
                            </p>
                            {sItem.tags && (
                              <div className="flex flex-wrap gap-2 pt-2">
                                {sItem.tags.map((tag: string, tIdx: number) => (
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
                              <span>Slide {idx + 1} of {totalDisplayPages}</span>
                            </div>
                            <div className="font-mono text-[#B08D57]">Page {idx + 1}</div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* OPTION 4B: INTERACTIVE PPT / DOC LINKEDIN SLIDE DECK (SLIDE MODE) */
              <div className="relative w-full flex items-center justify-center select-none">
                
                {/* Prev Slide Arrow */}
                <button
                  type="button"
                  disabled={currentSlide <= 0}
                  onClick={() => setCurrentSlide(prev => Math.max(prev - 1, 0))}
                  className="absolute left-2 sm:left-4 z-20 w-10 h-10 rounded-full bg-black/80 hover:bg-[#B08D57] hover:text-[#171A18] border border-white/20 flex items-center justify-center text-white transition-all backdrop-blur-md cursor-pointer disabled:opacity-20 disabled:pointer-events-none shadow-xl"
                  title="Previous Slide (←)"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Next Slide Arrow */}
                <button
                  type="button"
                  disabled={currentSlide >= totalDisplayPages - 1}
                  onClick={() => setCurrentSlide(prev => Math.min(prev + 1, totalDisplayPages - 1))}
                  className="absolute right-2 sm:right-4 z-20 w-10 h-10 rounded-full bg-black/80 hover:bg-[#B08D57] hover:text-[#171A18] border border-white/20 flex items-center justify-center text-white transition-all backdrop-blur-md cursor-pointer disabled:opacity-20 disabled:pointer-events-none shadow-xl"
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
                          <span>Product Case Study</span>
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
            <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-thin">
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
                  title={`Jump to Page / Slide ${idx + 1}`}
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
                disabled={currentSlide <= 0}
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
