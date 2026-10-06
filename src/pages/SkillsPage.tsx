import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Sparkles, CheckCircle2 } from 'lucide-react';
import { storageService } from '../services/storageService';
import { SkillCategory } from '../types';
import { ToolIcon } from '../components/ToolIcons';

export const SkillsPage: React.FC = () => {
  const [categories, setCategories] = useState<SkillCategory[]>(() => storageService.getSkills());
  const [profile, setProfile] = useState(() => storageService.getProfile());
  const [searchQuery, setSearchQuery] = useState('');
  const [cloudError, setCloudError] = useState<string | null>(() => storageService.getCloudError());

  useEffect(() => {
    const unsubscribe = storageService.onUpdate(() => {
      setCategories(storageService.getSkills());
      setProfile(storageService.getProfile());
      setCloudError(storageService.getCloudError());
    });
    return unsubscribe;
  }, []);

  if (cloudError && categories.length === 0) {
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

  if (categories.length === 0 && !storageService.isCloudLoaded()) {
    return (
      <div className="min-h-screen bg-[#F7F4ED] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 rounded-full border-2 border-[#B08D57] border-t-transparent animate-spin mb-4" />
        <p className="text-xs uppercase tracking-widest text-[#77736B] font-semibold">Loading portfolio data...</p>
      </div>
    );
  }

  const filteredCategories = categories.map(cat => {
    if (!searchQuery.trim()) return cat;
    const filtered = cat.skills.filter(s => 
      s.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return { ...cat, skills: filtered };
  }).filter(cat => cat.skills.length > 0);

  return (
    <div className="min-h-screen bg-[#F7F4ED] text-[#171A18] py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-3xl mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#DED8CC] bg-[#EFE9DC] text-xs font-semibold uppercase tracking-widest text-[#B08D57]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{profile.skillsPageEyebrow || 'Competencies & Stack'}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-[#171A18]">
            {profile.skillsPageTitle || 'Skills & Capabilities'}
          </h1>
          <p className="text-sm sm:text-base text-[#77736B] leading-relaxed font-sans">
            {profile.skillsPageDescription || 'A comprehensive overview of product management frameworks, quantitative experimentation methods, technical proficiencies, and AI engineering workflows accumulated across 4+ years of digital product leadership.'}
          </p>

          {/* Instant Search Bar */}
          <div className="pt-4 max-w-md">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#77736B]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search skills, tools, or frameworks (e.g. SQL, PRD, RICE)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#DED8CC] text-xs text-[#171A18] focus:outline-none focus:border-[#B08D57] transition-all shadow-sm"
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
        </div>

        {/* Skills Grid */}
        <div className="space-y-12">
          {filteredCategories.map((cat, idx) => {
            const isToolCategory = cat.id === 'tools';
            
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="p-6 sm:p-8 rounded-2xl bg-white border border-[#DED8CC] shadow-sm space-y-6"
              >
                <div className="border-b border-[#DED8CC] pb-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#171A18]">
                      {cat.name}
                    </h2>
                    <p className="text-xs text-[#77736B] mt-1 font-sans">
                      {cat.description}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[#B08D57] font-mono">
                    {cat.skills.length} items
                  </span>
                </div>

                {/* Badges / Chips */}
                {isToolCategory ? (
                  /* Tool Category with Authentic Logos */
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {cat.skills.map((tool) => (
                      <div
                        key={tool}
                        className="flex items-center gap-2.5 p-3 rounded-xl bg-[#F7F4ED] border border-[#DED8CC] hover:border-[#B08D57] hover:bg-[#EFE9DC] transition-all group"
                      >
                        <ToolIcon name={tool} className="w-5 h-5 flex-shrink-0" />
                        <span className="text-xs font-medium text-[#171A18] group-hover:text-[#B08D57] transition-colors truncate">
                          {tool}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Standard Framework Chips */
                  <div className="flex flex-wrap gap-2.5">
                    {cat.skills.map((skill) => (
                      <div
                        key={skill}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F7F4ED] border border-[#DED8CC] hover:border-[#B08D57] hover:bg-[#EFE9DC] transition-all text-xs text-[#171A18] font-medium"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#B08D57]" />
                        <span>{skill}</span>
                      </div>
                    ))}
                  </div>
                )}

              </motion.div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
