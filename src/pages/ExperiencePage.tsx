import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Building2, 
  MapPin, 
  Calendar, 
  ArrowRight, 
  GraduationCap, 
  Award, 
  CheckCircle2, 
  Briefcase 
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { BlurImage } from '../components/BlurImage';

interface ExperiencePageProps {
  onNavigate: (path: string) => void;
}

export const ExperiencePage: React.FC<ExperiencePageProps> = ({ onNavigate }) => {
  const [experiences, setExperiences] = useState(() => storageService.getExperience());
  const [education, setEducation] = useState(() => storageService.getEducation());
  const [profile, setProfile] = useState(() => storageService.getProfile());

  useEffect(() => {
    const unsubscribe = storageService.onUpdate(() => {
      setExperiences(storageService.getExperience());
      setEducation(storageService.getEducation());
      setProfile(storageService.getProfile());
    });
    return unsubscribe;
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F4ED] text-[#171A18] py-16 md:py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-3xl mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#DED8CC] bg-[#EFE9DC] text-xs font-semibold uppercase tracking-widest text-[#B08D57]">
            <Briefcase className="w-3.5 h-3.5" />
            <span>{profile.experiencePageEyebrow || 'Career Record'}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-[#171A18]">
            {profile.experiencePageTitle || 'Experience & Journey'}
          </h1>
          <p className="text-sm sm:text-base text-[#77736B] leading-relaxed font-sans">
            {profile.experiencePageDescription || 'A chronological timeline of product leadership, conversion rate optimization, lifecycle CRM engineering, and quantitative experimentation across high-growth domains.'}
          </p>
        </div>

        {/* Timeline Container */}
        <div className="relative border-l-2 border-[#DED8CC] ml-4 sm:ml-8 pl-6 sm:pl-10 space-y-14">
          
          {experiences.map((exp, idx) => {
            const isFeatured = exp.featured;
            const linkedProject = exp.caseStudySlug 
              ? storageService.getProjectBySlug(exp.caseStudySlug) 
              : null;

            return (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="relative"
              >
                {/* Timeline node */}
                <div className={`absolute -left-[31px] sm:-left-[47px] top-1.5 w-6 h-6 rounded-full border-2 ${
                  isFeatured 
                    ? 'border-[#B08D57] bg-[#171A18]' 
                    : 'border-[#DED8CC] bg-white'
                } flex items-center justify-center`}>
                  <div className={`w-2 h-2 rounded-full ${isFeatured ? 'bg-[#B08D57]' : 'bg-[#77736B]'}`} />
                </div>

                {/* Main Card */}
                <div className={`p-6 sm:p-8 rounded-2xl bg-white border ${
                  isFeatured ? 'border-[#B08D57]/50 shadow-md' : 'border-[#DED8CC] shadow-sm'
                } space-y-6 transition-all hover:border-[#B08D57]`}>
                  
                  {/* Top Bar: Company & Role */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#DED8CC] pb-5">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-serif text-xl sm:text-2xl font-bold text-[#171A18]">
                          {exp.company}
                        </span>
                        {isFeatured && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#171A18] text-[#F7F4ED]">
                            Featured
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-semibold text-[#B08D57]">
                        {exp.role}
                      </div>
                    </div>

                    <div className="flex flex-wrap sm:flex-col sm:items-end gap-2 text-xs text-[#77736B]">
                      <div className="inline-flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#B08D57]" />
                        <span>{exp.period}</span>
                      </div>
                      <div className="inline-flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#B08D57]" />
                        <span>{exp.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Impact Metrics Strip */}
                  {exp.impactMetrics && exp.impactMetrics.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {exp.impactMetrics.map((metric, mIdx) => (
                        <div key={mIdx} className="p-3 rounded-xl bg-[#F7F4ED] border border-[#DED8CC] text-center">
                          <div className="font-serif text-lg font-bold text-[#171A18]">
                            {metric.value}
                          </div>
                          <div className="text-[10px] uppercase font-semibold text-[#B08D57] tracking-wider mt-0.5">
                            {metric.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Project Visual Preview Thumbnail with Blur-up Loading */}
                  {linkedProject && (
                    <div 
                      onClick={() => onNavigate(`/projects/${exp.caseStudySlug}`)}
                      className="group/img rounded-xl overflow-hidden border border-[#DED8CC] cursor-pointer hover:border-[#B08D57] transition-all relative"
                    >
                      <BlurImage
                        src={linkedProject.coverImage}
                        alt={linkedProject.title}
                        aspectRatio={isFeatured ? "aspect-[21/9]" : "aspect-[24/7]"}
                        hoverZoom
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#171A18]/85 via-transparent to-transparent flex items-end p-4">
                        <div className="flex items-center justify-between w-full">
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-[#B08D57]">
                              Delivered Case Study
                            </span>
                            <div className="font-serif text-xs sm:text-sm font-bold text-[#F7F4ED] group-hover/img:text-[#B08D57] transition-colors line-clamp-1">
                              {linkedProject.title}
                            </div>
                          </div>
                          <span className="text-xs text-[#F7F4ED] flex items-center gap-1 group-hover/img:translate-x-1 transition-transform flex-shrink-0 ml-3">
                            <span>Read Study</span>
                            <ArrowRight className="w-3.5 h-3.5 text-[#B08D57]" />
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Responsibilities list */}
                  <div className="space-y-2.5">
                    <h3 className="text-xs uppercase tracking-widest text-[#77736B] font-semibold">
                      Key Scope & Execution
                    </h3>
                    <ul className="space-y-2 text-xs sm:text-sm text-[#171A18] leading-relaxed">
                      {exp.responsibilities.map((resp, rIdx) => (
                        <li key={rIdx} className="flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-[#B08D57] flex-shrink-0 mt-0.5" />
                          <span>{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* View Full Case Study CTA Button (FOR ALL EXPERIENCES) */}
                  {exp.caseStudySlug && (
                    <div className="pt-4 border-t border-[#DED8CC] flex justify-end">
                      <button
                        onClick={() => onNavigate(`/projects/${exp.caseStudySlug}`)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase bg-[#171A18] text-[#F7F4ED] hover:bg-[#B08D57] hover:text-[#171A18] transition-colors cursor-pointer shadow-sm"
                      >
                        <span>View Full Case Study</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                </div>
              </motion.div>
            );
          })}

        </div>

        {/* 13. EDUCATION SECTION */}
        <div className="mt-24 pt-16 border-t border-[#DED8CC]">
          <div className="mb-10 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#DED8CC] bg-[#EFE9DC] text-xs font-semibold uppercase tracking-widest text-[#B08D57]">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Academic Credentials</span>
            </div>
            <h2 className="text-3xl font-serif text-[#171A18]">
              Education & Certifications
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {education.map((edu) => (
              <div 
                key={edu.id}
                className="p-6 rounded-2xl bg-white border border-[#DED8CC] space-y-4 hover:border-[#B08D57] transition-all shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-md bg-[#EFE9DC] text-[#171A18]">
                      {edu.score}
                    </span>
                    <span className="text-[11px] text-[#B08D57] font-semibold uppercase tracking-wider">
                      {edu.status}
                    </span>
                  </div>
                  <h3 className="font-serif text-lg font-bold text-[#171A18] leading-snug">
                    {edu.degree}
                  </h3>
                  <p className="text-xs text-[#77736B]">
                    {edu.institution}
                  </p>
                </div>

                {edu.details && (
                  <p className="text-xs text-[#77736B] pt-3 border-t border-[#DED8CC] leading-relaxed">
                    {edu.details}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
