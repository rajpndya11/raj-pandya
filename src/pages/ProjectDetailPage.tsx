import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, 
  ExternalLink, 
  Layers, 
  Calendar, 
  Briefcase, 
  FileText, 
  Figma, 
  Github, 
  Presentation, 
  Globe, 
  CheckCircle2, 
  TrendingUp, 
  Play, 
  Video, 
  Maximize2, 
  X,
  Target,
  Users,
  AlertTriangle,
  Lightbulb,
  Cpu
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { Project, ProjectLink, WireframeAsset, CustomBlock } from '../types';
import { BlurImage } from '../components/BlurImage';

interface ProjectDetailPageProps {
  slug: string;
  onNavigate: (path: string) => void;
}

export const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({ slug, onNavigate }) => {
  const [project, setProject] = useState<Project | null>(null);
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [selectedWireframe, setSelectedWireframe] = useState<WireframeAsset | null>(null);

  useEffect(() => {
    const found = storageService.getProjectBySlug(slug);
    if (found) {
      setProject(found);
      window.scrollTo(0, 0);
    }
  }, [slug]);

  if (!project) {
    return (
      <div className="min-h-screen bg-[#F7F4ED] text-[#171A18] py-24 px-4 text-center">
        <h1 className="font-serif text-3xl mb-4">Case Study Not Found</h1>
        <p className="text-xs text-[#77736B] mb-8">
          The requested project slug "{slug}" does not exist or may have been unlisted.
        </p>
        <button
          onClick={() => onNavigate('/projects')}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase bg-[#171A18] text-[#F7F4ED] hover:bg-[#B08D57]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Projects</span>
        </button>
      </div>
    );
  }

  // Build dynamic candidate sections based on filled fields
  const rawSections: { id: string; title: string; content?: string }[] = [
    { id: 'overview', title: 'Executive Overview', content: project.overview },
    { id: 'problem', title: 'Problem Statement', content: project.problem },
    { id: 'objectives', title: 'Objectives & Goals', content: project.objectives },
    { id: 'targetAudience', title: 'Target Audience & Personas', content: project.targetAudience },
    { id: 'painPoints', title: 'User Pain Points', content: project.painPoints },
    { id: 'research', title: 'Research & User Discovery', content: project.userResearch },
    { id: 'strategy', title: 'Product Strategy & Prioritization', content: project.strategy },
    { id: 'solution', title: 'Solution Architecture', content: project.solution },
    { id: 'experimentation', title: 'A/B Testing & Experiments', content: project.experimentation },
    { id: 'outcome', title: 'Business Outcome & KPIs', content: project.outcome },
    { id: 'learnings', title: 'Key Learnings & Takeaways', content: project.learnings },
  ];

  const availableSections = rawSections.filter(s => !!s.content && s.content.trim().length > 0);

  const getLinkIcon = (type: string) => {
    switch (type) {
      case 'Figma':
      case 'Prototype':
        return <Figma className="w-3.5 h-3.5 text-[#A259FF]" />;
      case 'PPT':
        return <Presentation className="w-3.5 h-3.5 text-[#E65100]" />;
      case 'PRD':
      case 'Research':
      case 'PDF':
      case 'Notion':
        return <FileText className="w-3.5 h-3.5 text-[#5E6AD2]" />;
      case 'GitHub':
        return <Github className="w-3.5 h-3.5 text-[#171A18]" />;
      case 'Live Website':
        return <Globe className="w-3.5 h-3.5 text-[#00A1E0]" />;
      case 'YouTube':
      case 'Loom':
        return <Video className="w-3.5 h-3.5 text-[#E50914]" />;
      default:
        return <ExternalLink className="w-3.5 h-3.5 text-[#B08D57]" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F4ED] text-[#171A18] py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Link */}
        <button
          onClick={() => onNavigate('/projects')}
          className="group inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#77736B] hover:text-[#171A18] mb-10 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to All Case Studies</span>
        </button>

        {/* Case Study Editorial Header */}
        <div className="max-w-4xl space-y-6 mb-12">
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-[#171A18] text-[#F7F4ED]">
              {project.category}
            </span>
            <span className="px-3 py-1 rounded-full text-[11px] font-medium tracking-wide bg-[#EFE9DC] text-[#77736B] border border-[#DED8CC]">
              {project.industry}
            </span>
            {project.status === 'Draft' && (
              <span className="px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide bg-amber-100 text-amber-800 border border-amber-300">
                Draft Preview
              </span>
            )}
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-[#171A18] tracking-tight leading-[1.1] font-bold">
            {project.title}
          </h1>

          <p className="font-serif italic text-lg sm:text-2xl text-[#77736B] font-light leading-relaxed">
            {project.subtitle}
          </p>

          <p className="text-sm sm:text-base text-[#171A18] leading-relaxed max-w-3xl">
            {project.shortDescription}
          </p>
        </div>

        {/* Project Meta Details Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 p-6 rounded-2xl bg-white border border-[#DED8CC] shadow-sm mb-12">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[#77736B] font-semibold">
              <Briefcase className="w-3.5 h-3.5 text-[#B08D57]" />
              <span>Role</span>
            </div>
            <div className="text-sm font-semibold text-[#171A18]">
              {project.role}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[#77736B] font-semibold">
              <Calendar className="w-3.5 h-3.5 text-[#B08D57]" />
              <span>Timeline</span>
            </div>
            <div className="text-sm font-semibold text-[#171A18]">
              {project.timeline}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[#77736B] font-semibold">
              <Layers className="w-3.5 h-3.5 text-[#B08D57]" />
              <span>Industry</span>
            </div>
            <div className="text-sm font-semibold text-[#171A18]">
              {project.industry}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[#77736B] font-semibold">
              <Users className="w-3.5 h-3.5 text-[#B08D57]" />
              <span>Team / Stakeholders</span>
            </div>
            <div className="text-sm font-semibold text-[#171A18]">
              {project.team || 'Cross-Functional PM'}
            </div>
          </div>
        </div>

        {/* Prototype & Artifact Links Hub */}
        {project.links && project.links.length > 0 && (
          <div className="mb-12 p-6 rounded-2xl bg-[#EFE9DC] border border-[#DED8CC]">
            <div className="text-xs uppercase tracking-widest text-[#B08D57] font-semibold mb-3">
              Interactive Prototypes, PRDs & Design Deliverables
            </div>
            <div className="flex flex-wrap gap-3">
              {project.links.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-[#171A18] hover:text-[#F7F4ED] text-[#171A18] border border-[#DED8CC] text-xs font-semibold transition-all shadow-sm group"
                >
                  {getLinkIcon(link.type)}
                  <span>{link.label}</span>
                  <ExternalLink className="w-3 h-3 text-[#77736B] group-hover:text-[#F7F4ED]" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Hero Cover Image */}
        <div className="rounded-2xl overflow-hidden shadow-xl border border-[#DED8CC] mb-16 bg-[#171A18]">
          <BlurImage
            src={project.coverImage}
            alt={project.title}
            aspectRatio="aspect-[21/9]"
            priority
          />
        </div>

        {/* Video Demo / Walkthrough if available */}
        {project.videoUrl && (
          <div className="mb-16 p-8 rounded-2xl bg-[#171A18] text-[#F7F4ED] border border-[#2A2E2C]">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#B08D57] font-semibold mb-4">
              <Video className="w-4 h-4" />
              <span>Product Walkthrough & Demonstration</span>
            </div>
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-black/60 flex items-center justify-center border border-[#2A2E2C]">
              {project.videoUrl.includes('youtube.com') || project.videoUrl.includes('youtu.be') ? (
                <iframe
                  src={project.videoUrl.replace('watch?v=', 'embed/')}
                  title="Product Walkthrough"
                  className="w-full h-full"
                  allowFullScreen
                />
              ) : project.videoUrl.includes('loom.com') ? (
                <iframe
                  src={project.videoUrl.replace('/share/', '/embed/')}
                  title="Loom Walkthrough"
                  className="w-full h-full"
                  allowFullScreen
                />
              ) : (
                <div className="text-center p-8 space-y-4">
                  <Play className="w-12 h-12 text-[#B08D57] mx-auto opacity-80" />
                  <p className="text-sm text-[#EFE9DC]">External Product Demonstration Link</p>
                  <a
                    href={project.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#B08D57] text-[#171A18] font-semibold text-xs tracking-wider uppercase hover:bg-[#C6A66B]"
                  >
                    <span>Watch Walkthrough</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Key Metrics Callout Strip */}
        {project.metrics && project.metrics.length > 0 && (
          <div className="mb-16 p-8 rounded-2xl bg-[#EFE9DC] border border-[#DED8CC]">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#B08D57] font-semibold">
                <TrendingUp className="w-4 h-4" />
                <span>Quantitative Impact Scorecard</span>
              </div>
              <span className="text-xs text-[#77736B]">Measured & Verified</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {project.metrics.map((m, mIdx) => (
                <div key={mIdx} className="p-4 rounded-xl bg-white border border-[#DED8CC]">
                  <div className="font-serif text-2xl sm:text-3xl font-bold text-[#171A18]">
                    {m.value}
                  </div>
                  <div className="text-xs uppercase font-semibold text-[#B08D57] tracking-wider mt-1">
                    {m.label}
                  </div>
                  {m.detail && (
                    <div className="text-[11px] text-[#77736B] mt-1.5 leading-snug">
                      {m.detail}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dedicated Wireframes & Visual Assets Gallery */}
        {project.wireframes && project.wireframes.length > 0 && (
          <div className="mb-16 p-8 rounded-2xl bg-white border border-[#DED8CC] shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-xs uppercase tracking-widest text-[#B08D57] font-semibold">
                  Visual Assets & Wireframe Gallery
                </div>
                <h2 className="font-serif text-2xl font-bold text-[#171A18] mt-1">
                  Design Architecture, Wireframes & UI Screens
                </h2>
              </div>
              <span className="text-xs text-[#77736B]">
                {project.wireframes.length} {project.wireframes.length === 1 ? 'Asset' : 'Assets'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {project.wireframes.map((wf) => (
                <div 
                  key={wf.id}
                  onClick={() => setSelectedWireframe(wf)}
                  className="group rounded-xl overflow-hidden border border-[#DED8CC] bg-[#F7F4ED] hover:shadow-lg transition-all cursor-pointer flex flex-col"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-[#171A18]">
                    <img
                      src={wf.url}
                      alt={wf.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="px-3 py-1.5 rounded-lg bg-white/90 text-[#171A18] text-xs font-semibold flex items-center gap-1.5">
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>View Full Screen</span>
                      </div>
                    </div>
                    {wf.category && (
                      <span className="absolute top-2 left-2 px-2.5 py-1 rounded bg-[#171A18]/80 text-[#F7F4ED] text-[10px] font-semibold uppercase tracking-wider">
                        {wf.category.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-serif font-bold text-sm text-[#171A18]">
                        {wf.title}
                      </h4>
                      {wf.caption && (
                        <p className="text-xs text-[#77736B] mt-1 line-clamp-2">
                          {wf.caption}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2-Column Editorial Case Study Reader */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Sticky Table of Contents (4 cols) */}
          <div className="lg:col-span-4">
            <div className="sticky top-28 p-6 rounded-2xl bg-white border border-[#DED8CC] shadow-sm space-y-4">
              <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-[#171A18] border-b border-[#DED8CC] pb-3">
                Contents
              </h3>
              <nav className="space-y-1">
                {availableSections.map((sec) => (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    onClick={() => setActiveSection(sec.id)}
                    className={`block py-1.5 px-3 rounded-lg text-xs font-medium transition-colors ${
                      activeSection === sec.id
                        ? 'bg-[#EFE9DC] text-[#171A18] font-semibold border-l-2 border-[#B08D57]'
                        : 'text-[#77736B] hover:text-[#171A18]'
                    }`}
                  >
                    {sec.title}
                  </a>
                ))}
                {project.customBlocks && project.customBlocks.map(block => (
                  <a
                    key={block.id}
                    href={`#block-${block.id}`}
                    className="block py-1.5 px-3 rounded-lg text-xs font-medium text-[#77736B] hover:text-[#171A18]"
                  >
                    {block.title}
                  </a>
                ))}
              </nav>

              <div className="pt-4 border-t border-[#DED8CC]">
                <div className="text-[11px] text-[#77736B] mb-2 font-medium">
                  Have questions about this case study?
                </div>
                <a
                  href={`mailto:rajpandya1131@gmail.com?subject=${encodeURIComponent(`Discussion on: ${project.title}`)}`}
                  className="block w-full py-2.5 px-4 text-center rounded-xl bg-[#171A18] text-[#F7F4ED] text-xs font-semibold uppercase tracking-wider hover:bg-[#B08D57] hover:text-[#171A18] transition-colors"
                >
                  Discuss with Raj
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Case Study Sections & Blocks (8 cols) */}
          <div className="lg:col-span-8 space-y-12">
            {availableSections.map((sec) => (
              <section
                key={sec.id}
                id={sec.id}
                className="scroll-mt-28 p-8 rounded-2xl bg-white border border-[#DED8CC] shadow-sm space-y-4"
              >
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#B08D57] font-semibold">
                  <span>Section</span>
                </div>
                
                <h2 className="text-2xl sm:text-3xl font-serif text-[#171A18] font-bold">
                  {sec.title}
                </h2>

                <div className="text-sm sm:text-base text-[#171A18] leading-relaxed font-sans whitespace-pre-line space-y-4">
                  {sec.content}
                </div>
              </section>
            ))}

            {/* Custom Reusable Content Blocks */}
            {project.customBlocks && project.customBlocks.map((block) => (
              <section
                key={block.id}
                id={`block-${block.id}`}
                className="scroll-mt-28 p-8 rounded-2xl bg-white border border-[#DED8CC] shadow-sm space-y-4"
              >
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#B08D57] font-semibold">
                  <span>Custom Module</span>
                </div>
                
                <h2 className="text-2xl sm:text-3xl font-serif text-[#171A18] font-bold">
                  {block.title}
                </h2>

                {block.subtitle && (
                  <p className="font-serif italic text-base text-[#77736B]">
                    {block.subtitle}
                  </p>
                )}

                {block.content && (
                  <div className="text-sm sm:text-base text-[#171A18] leading-relaxed font-sans whitespace-pre-line">
                    {block.content}
                  </div>
                )}
              </section>
            ))}

            {/* Bottom Navigation */}
            <div className="pt-8 border-t border-[#DED8CC] flex items-center justify-between">
              <button
                onClick={() => onNavigate('/projects')}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase border border-[#DED8CC] text-[#171A18] hover:bg-[#EFE9DC] transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>All Projects</span>
              </button>

              <a
                href="mailto:rajpandya1131@gmail.com"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase bg-[#B08D57] text-[#171A18] hover:bg-[#C6A66B] transition-all shadow-sm"
              >
                <span>Inquire About Solution</span>
              </a>
            </div>

          </div>

        </div>

      </div>

      {/* Wireframe Lightbox Modal */}
      {selectedWireframe && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
          onClick={() => setSelectedWireframe(null)}
        >
          <div 
            className="max-w-5xl w-full bg-[#171A18] rounded-2xl overflow-hidden border border-[#2A2E2C] shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-[#1F2421] border-b border-[#2A2E2C] flex items-center justify-between text-[#F7F4ED]">
              <div>
                <h3 className="font-serif font-bold text-lg">{selectedWireframe.title}</h3>
                {selectedWireframe.caption && (
                  <p className="text-xs text-[#77736B]">{selectedWireframe.caption}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedWireframe(null)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-[#F7F4ED]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 max-h-[80vh] overflow-auto flex items-center justify-center bg-black">
              <img
                src={selectedWireframe.url}
                alt={selectedWireframe.title}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
