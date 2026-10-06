import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, ArrowRight, FolderKanban, Sparkles, Presentation, FileText, BookOpen } from 'lucide-react';
import { storageService } from '../services/storageService';
import { ProjectCategory } from '../types';
import { BlurImage } from '../components/BlurImage';

interface ProjectsPageProps {
  onNavigate: (path: string) => void;
}

const CATEGORIES: ('All' | ProjectCategory)[] = [
  'All',
  'Product',
  'Growth',
  'AI',
  'Analytics',
  'CRM',
  'Experimentation'
];

export const ProjectsPage: React.FC<ProjectsPageProps> = ({ onNavigate }) => {
  const [selectedCategory, setSelectedCategory] = useState<'All' | ProjectCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [projects, setProjects] = useState(() => storageService.getPublishedProjects());
  const [profile, setProfile] = useState(() => storageService.getProfile());
  const [cloudError, setCloudError] = useState<string | null>(() => storageService.getCloudError());

  useEffect(() => {
    const unsubscribe = storageService.onUpdate(() => {
      setProjects(storageService.getPublishedProjects());
      setProfile(storageService.getProfile());
      setCloudError(storageService.getCloudError());
    });
    return unsubscribe;
  }, []);

  if (cloudError && projects.length === 0) {
    return (
      <div className="min-h-screen bg-[#F7F4ED] text-[#171A18] flex items-center justify-center p-6 text-center">
        <div className="max-w-md p-8 bg-white border border-[#DED8CC] rounded-2xl shadow-xl space-y-4">
          <h2 className="font-serif text-2xl font-bold">Unable to load portfolio content</h2>
          <p className="text-xs text-[#77736B]">Please check your connection and try again.</p>
          <button
            onClick={() => storageService.loadFromCloud()}
            className="px-6 py-2.5 rounded-full bg-[#171A18] text-[#F7F4ED] hover:bg-[#B08D57] text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (projects.length === 0 && !storageService.isCloudLoaded()) {
    return (
      <div className="min-h-screen bg-[#F7F4ED] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 rounded-full border-2 border-[#B08D57] border-t-transparent animate-spin mb-4" />
        <p className="text-xs uppercase tracking-widest text-[#77736B] font-semibold">Loading portfolio data...</p>
      </div>
    );
  }

  const filteredProjects = projects.filter((project) => {
    const matchesCategory = 
      selectedCategory === 'All' 
        ? true 
        : project.category.toLowerCase() === selectedCategory.toLowerCase() ||
          project.tags.some(t => t.toLowerCase() === selectedCategory.toLowerCase());

    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      !query ||
      project.title.toLowerCase().includes(query) ||
      project.shortDescription.toLowerCase().includes(query) ||
      project.tags.some(t => t.toLowerCase().includes(query)) ||
      project.category.toLowerCase().includes(query);

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#F7F4ED] text-[#171A18] py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-3xl mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#DED8CC] bg-[#EFE9DC] text-xs font-semibold uppercase tracking-widest text-[#B08D57]">
            <FolderKanban className="w-3.5 h-3.5" />
            <span>{profile.projectsPageEyebrow || 'Case Studies'}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-[#171A18]">
            {profile.projectsPageTitle || 'Featured Projects'}
          </h1>
          <p className="text-sm sm:text-base text-[#77736B] leading-relaxed font-sans">
            {profile.projectsPageDescription || "Product problems I've explored, solved and studied. Spanning conversion funnels, GenAI intelligence engines, candidate search semantics, and enterprise telemetry."}
          </p>
        </div>

        {/* Filter Tabs & Search Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-[#DED8CC] pb-6">
          
          {/* Category Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer ${
                    active
                      ? 'bg-[#171A18] text-[#F7F4ED] shadow-sm'
                      : 'bg-white border border-[#DED8CC] text-[#77736B] hover:text-[#171A18] hover:border-[#B08D57]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#77736B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-[#DED8CC] text-xs text-[#171A18] focus:outline-none focus:border-[#B08D57] transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#77736B] hover:text-[#171A18]"
              >
                Clear
              </button>
            )}
          </div>

        </div>

        {/* Project Grid */}
        {filteredProjects.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-[#DED8CC] p-8">
            <div className="font-serif text-2xl text-[#171A18] mb-2">No projects matched your criteria</div>
            <p className="text-xs text-[#77736B] mb-6">
              Try adjusting your search query or selecting a different category filter.
            </p>
            <button
              onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
              className="px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#171A18] text-[#F7F4ED] hover:bg-[#B08D57]"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map((project, idx) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="group rounded-2xl bg-white border border-[#DED8CC] overflow-hidden flex flex-col hover:border-[#B08D57] transition-all duration-300 shadow-sm"
              >
                {/* Cover Image with Blur-Up Loading */}
                <div 
                  onClick={() => onNavigate(`/projects/${project.slug}`)}
                  className="w-full relative cursor-pointer overflow-hidden"
                >
                  <BlurImage
                    src={project.coverImage}
                    alt={project.title}
                    aspectRatio="aspect-[16/10]"
                    hoverZoom
                  />
                  <div className="absolute top-4 left-4 flex items-center gap-2 z-10 pointer-events-none">
                    <span className="px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#171A18]/85 backdrop-blur-md text-[#F7F4ED] border border-[#B08D57]/40">
                      {project.category}
                    </span>
                    {project.featured && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#B08D57] text-[#171A18]">
                        Featured
                      </span>
                    )}
                  </div>
                </div>

                {/* Content Box */}
                <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="text-[11px] uppercase tracking-wider font-semibold text-[#B08D57]">
                      {project.industry}
                    </div>
                    <h3 
                      onClick={() => onNavigate(`/projects/${project.slug}`)}
                      className="font-serif text-xl sm:text-2xl text-[#171A18] font-bold group-hover:text-[#B08D57] transition-colors cursor-pointer leading-tight"
                    >
                      {project.title}
                    </h3>
                    <p className="text-xs text-[#77736B] line-clamp-3 leading-relaxed">
                      {project.shortDescription}
                    </p>
                  </div>

                  {/* Highlight Metric */}
                  {project.metrics && project.metrics.length > 0 && (
                    <div className="p-3 rounded-xl bg-[#F7F4ED] border border-[#DED8CC] flex items-center justify-between">
                      <span className="text-[11px] text-[#77736B] uppercase font-semibold tracking-wider">
                        {project.metrics[0].label}
                      </span>
                      <span className="font-serif text-sm font-bold text-[#171A18]">
                        {project.metrics[0].value}
                      </span>
                    </div>
                  )}

                  {/* Attached Documents / Presentations Indicator */}
                  {((project.files && project.files.length > 0) || (project.links && project.links.some(l => ['PPT', 'PDF', 'PRD', 'Research'].includes(l.type)))) && (
                    <div 
                      onClick={() => onNavigate(`/projects/${project.slug}#presentation-deck`)}
                      className="p-2.5 rounded-xl bg-[#EFE9DC]/70 hover:bg-[#EFE9DC] border border-[#DED8CC] flex items-center justify-between transition-colors cursor-pointer group/doc"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#171A18]">
                        <Presentation className="w-3.5 h-3.5 text-[#E65100]" />
                        <span>Interactive PPT / PDF Deck</span>
                      </div>
                      <span className="text-[10px] text-[#B08D57] font-bold group-hover/doc:underline flex items-center gap-1">
                        <span>Read Deck</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  )}

                  {/* Footer & CTA */}
                  <div className="pt-4 border-t border-[#DED8CC] flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5 max-w-[60%]">
                      {project.tags.slice(0, 2).map((tag, tIdx) => (
                        <span key={tIdx} className="text-[10px] text-[#77736B] uppercase tracking-wider">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => onNavigate(`/projects/${project.slug}`)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#171A18] group-hover:text-[#B08D57] transition-colors cursor-pointer"
                    >
                      <span>Case Study</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
