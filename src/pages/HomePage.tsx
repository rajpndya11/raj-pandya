import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowRight, 
  ArrowUpRight, 
  Layers, 
  TrendingUp, 
  Database, 
  Cpu, 
  Sparkles, 
  Compass, 
  BarChart3, 
  Briefcase,
  Quote 
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { BlurImage } from '../components/BlurImage';
import { triggerResumeDownload } from '../utils/resumeGenerator';
import { RpMonogram } from '../components/BrandLogo';

interface HomePageProps {
  onNavigate: (path: string) => void;
  onOpenConnect: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onOpenConnect }) => {
  const [profile, setProfile] = useState(() => storageService.getProfile());
  const [featuredProjects, setFeaturedProjects] = useState(() => storageService.getFeaturedProjects());
  const [experiences, setExperiences] = useState(() => storageService.getExperience());
  const [skillsList, setSkillsList] = useState(() => storageService.getSkills());
  const primaryExp = experiences[0] || null;

  useEffect(() => {
    // Automatically subscribe to updates from Firestore or CMS edits
    const unsubscribe = storageService.onUpdate(() => {
      setProfile(storageService.getProfile());
      setFeaturedProjects(storageService.getFeaturedProjects());
      setExperiences(storageService.getExperience());
      setSkillsList(storageService.getSkills());
    });
    return unsubscribe;
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F4ED] text-[#171A18]">
      
      {/* 4. HERO SECTION */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 border-b border-[#DED8CC] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column (Hero Content) */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7 space-y-6"
            >
              {/* Eyebrow badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#DED8CC] bg-[#EFE9DC] text-xs font-semibold uppercase tracking-widest text-[#B08D57]">
                <RpMonogram className="w-3.5 h-3.5 text-[#B08D57]" />
                <span>{profile.eyebrow}</span>
              </div>

              {/* Large Name Heading */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif text-[#171A18] tracking-tight leading-none">
                {profile.name}
              </h1>

              {/* Primary Headline */}
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-serif text-[#77736B] font-normal leading-snug">
                {profile.headline}
              </h2>

              {/* CV-grounded short summary */}
              <p className="text-sm sm:text-base text-[#77736B] max-w-2xl leading-relaxed font-sans">
                {profile.bio}
              </p>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => onNavigate(profile.primaryCtaLink || '/projects')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-semibold tracking-wider uppercase bg-[#171A18] text-[#F7F4ED] hover:bg-[#B08D57] hover:text-[#171A18] transition-all cursor-pointer shadow-sm"
                >
                  <span>{profile.primaryCtaText || 'View Projects'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (profile.resumeUrl) {
                      window.open(profile.resumeUrl, '_blank');
                    } else {
                      triggerResumeDownload(profile, experiences);
                    }
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-semibold tracking-wider uppercase border border-[#DED8CC] text-[#171A18] hover:bg-[#EFE9DC] transition-all cursor-pointer shadow-sm"
                >
                  <span>{profile.secondaryCtaText || 'Download Resume ↓'}</span>
                </button>
              </div>
            </motion.div>

            {/* Right Column (Editorial Portrait) */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5 flex justify-center lg:justify-end"
            >
              <div className="relative max-w-sm w-full">
                
                {/* Decorative hairline frame */}
                <div className="absolute -inset-3 rounded-2xl border border-[#DED8CC]/70 pointer-events-none" />

                {/* Studio Portrait Container */}
                <div className="relative rounded-xl overflow-hidden bg-[#171A18] shadow-xl border border-[#DED8CC]">
                  <BlurImage
                    src={profile.photoUrl || '/raj_pandya_headshot.jpg'}
                    alt={profile.name}
                    aspectRatio="aspect-[4/5]"
                    priority
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#171A18]/90 via-transparent to-transparent pointer-events-none" />
                  
                  {/* Floating Editorial Statement Tagline */}
                  <div className="absolute bottom-5 left-5 right-5 p-4 rounded-lg bg-[#171A18]/85 backdrop-blur-md border border-[#B08D57]/40 text-[#F7F4ED] z-10">
                    <div className="flex items-center justify-between">
                      <div className="font-serif italic text-base sm:text-lg text-[#F7F4ED] whitespace-pre-line leading-tight">
                        {profile.photoTagline}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-[#B08D57]/20 border border-[#B08D57] flex items-center justify-center p-1.5 text-[#B08D57]">
                        <RpMonogram className="w-full h-full text-[#B08D57]" />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 5. PRODUCT & AI PHILOSOPHY QUOTE BANNER */}
      <section className="py-14 sm:py-16 bg-[#EFE9DC] border-b border-[#DED8CC] relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 sm:gap-8">
            
            {/* Quote glyph mark */}
            <div className="w-12 h-12 rounded-2xl bg-[#171A18] text-[#B08D57] flex items-center justify-center flex-shrink-0 shadow-sm border border-[#B08D57]/30">
              <Quote className="w-5 h-5" />
            </div>

            {/* Quote statement & attribution */}
            <div className="space-y-3 flex-1">
              <blockquote className="font-serif text-xl sm:text-2xl lg:text-[1.65rem] text-[#171A18] leading-snug font-normal tracking-tight">
                {profile.quote || "“A great product manager has the brain of an engineer, the heart of a designer, and the speech of a diplomat.”"}
              </blockquote>
              
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#77736B]">
                <span className="font-semibold text-[#171A18] uppercase tracking-wider font-sans">
                  {profile.quoteAuthor ? profile.quoteAuthor.split('·')[0].trim() : "Deep Nishar"}
                </span>
                {profile.quoteAuthor && profile.quoteAuthor.includes('·') && (
                  <>
                    <span aria-hidden="true" className="text-[#DED8CC]">·</span>
                    <span className="text-[#B08D57] font-medium">
                      {profile.quoteAuthor.split('·').slice(1).join('·').trim()}
                    </span>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 6. ABOUT ME PREVIEW & WHAT I WORK ON */}
      <section className="py-20 md:py-24 border-b border-[#DED8CC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Left 40%: Editorial statement */}
            <div className="lg:col-span-5 space-y-6">
              <span className="text-xs uppercase tracking-widest text-[#B08D57] font-semibold">
                {profile.aboutEyebrow || 'About Me'}
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif text-[#171A18] leading-tight">
                {profile.aboutHeading ? (
                  profile.aboutHeading
                ) : (
                  <>
                    Turning Ideas into <br />
                    <span className="italic font-light">Meaningful Products</span>
                  </>
                )}
              </h2>
              <p className="text-sm text-[#77736B] leading-relaxed">
                {profile.aboutParagraph1 || 'I believe high-performing products sit at the exact intersection of deep customer empathy, rigorous unit economics, and relentless experimentation.'}
              </p>
              <p className="text-sm text-[#77736B] leading-relaxed">
                {profile.aboutParagraph2 || 'Whether diagnosing user churn across luxury commerce journeys or re-engineering lead acquisition funnels for 50+ real estate launches, my focus is always quantitative: measurable growth, verified user adoption, and compounding business value.'}
              </p>
              <div className="pt-2">
                <button
                  onClick={() => onNavigate('/experience')}
                  className="inline-flex items-center gap-2 text-xs uppercase font-semibold tracking-wider text-[#171A18] hover:text-[#B08D57] transition-colors group cursor-pointer"
                >
                  <span>View Full About / Experience</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Right 60%: What I Work On (Core Disciplines / Pillars) */}
            <div className="lg:col-span-7">
              <div className="mb-6">
                <h3 className="text-xs uppercase tracking-widest text-[#77736B] font-semibold">
                  Core Disciplines
                </h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(profile.pillars && profile.pillars.length > 0 ? profile.pillars : [
                  {
                    id: 'p1',
                    title: 'Product Management',
                    category: 'Product Lifecycle',
                    description: 'Strategy, customer discovery, roadmaps, PRD authoring, and cross-functional engineering execution.',
                    tag: '0 to 1 & Scale'
                  },
                  {
                    id: 'p2',
                    title: 'Growth & Experimentation',
                    category: 'Conversion Optimization',
                    description: 'Acquisition funnels, CRO, systematic A/B testing loops, and customer onboarding optimization.',
                    tag: 'CRO & Funnels'
                  },
                  {
                    id: 'p3',
                    title: 'Data & Analytics',
                    category: 'Quantitative Strategy',
                    description: 'Telemetry, SQL querying, cohort retention analysis, and translating metrics into product bets.',
                    tag: 'SQL & Telemetry'
                  },
                  {
                    id: 'p4',
                    title: 'AI & Automation',
                    category: 'Engineering & Workflow',
                    description: 'GenAI systems, prompt engineering, agentic architecture, Claude Code, and n8n autonomous pipelines.',
                    tag: 'AI Workflows'
                  }
                ]).map((pillar, pIdx) => (
                  <div key={pillar.id || pIdx} className="p-6 rounded-xl bg-white border border-[#DED8CC] space-y-3 hover:border-[#B08D57] transition-colors shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-lg bg-[#EFE9DC] text-[#B08D57] flex items-center justify-center">
                        {pIdx === 0 && <Layers className="w-4 h-4" />}
                        {pIdx === 1 && <TrendingUp className="w-4 h-4" />}
                        {pIdx === 2 && <Database className="w-4 h-4" />}
                        {pIdx === 3 && <Cpu className="w-4 h-4" />}
                        {pIdx > 3 && <Sparkles className="w-4 h-4" />}
                      </div>
                      {pillar.tag && (
                        <span className="text-[10px] font-semibold tracking-wider text-[#B08D57] bg-[#EFE9DC] px-2 py-0.5 rounded-full">
                          {pillar.tag}
                        </span>
                      )}
                    </div>
                    <h4 className="font-serif text-lg text-[#171A18] font-bold">
                      {pillar.title}
                    </h4>
                    <p className="text-xs text-[#77736B] leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 7. SKILLS PREVIEW */}
      <section className="py-20 md:py-24 bg-[#EFE9DC]/60 border-b border-[#DED8CC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#B08D57] font-semibold">
                Skills & Capabilities
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif text-[#171A18] mt-1">
                Frameworks, Tooling & Craft
              </h2>
              <p className="text-xs sm:text-sm text-[#77736B] mt-1">
                The tools, frameworks and mindset I use to build and scale products.
              </p>
            </div>
            <button
              onClick={() => onNavigate('/skills')}
              className="inline-flex items-center gap-2 text-xs uppercase font-semibold tracking-wider text-[#171A18] hover:text-[#B08D57] transition-colors group cursor-pointer"
            >
              <span>View All Skills</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(skillsList.length > 0 ? skillsList.slice(0, 4) : [
              {
                id: 'default-1',
                name: 'Product Strategy & Design',
                description: 'Product vision, roadmaps, research, JTBD, personas, wireframing, usability testing and prototyping.',
                skills: []
              },
              {
                id: 'default-2',
                name: 'Growth & Business Strategy',
                description: 'Funnel optimization, CRO, retention, pricing, monetization, GTM planning and A/B experimentation.',
                skills: []
              },
              {
                id: 'default-3',
                name: 'Data & Technical',
                description: 'SQL, data querying, analytics, metrics interpretation, API integrations, architecture and GitHub.',
                skills: []
              },
              {
                id: 'default-4',
                name: 'AI & Workflow Automation',
                description: 'Prompt engineering, AI agents, Claude Code, vibe coding, workflow automation and n8n pipelines.',
                skills: []
              }
            ]).map((cat) => (
              <div key={cat.id} className="p-6 rounded-xl bg-white border border-[#DED8CC] space-y-3 hover:border-[#B08D57] transition-colors shadow-xs">
                <h3 className="font-serif text-base font-bold text-[#171A18]">
                  {cat.name}
                </h3>
                <p className="text-xs text-[#77736B] leading-relaxed line-clamp-3">
                  {cat.description}
                </p>
                {cat.skills && cat.skills.length > 0 && (
                  <div className="pt-2 flex flex-wrap gap-1.5">
                    {cat.skills.slice(0, 3).map((skill, sIdx) => (
                      <span key={sIdx} className="text-[10px] px-2 py-0.5 rounded-md bg-[#EFE9DC] text-[#171A18] font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. EXPERIENCE PREVIEW */}
      <section className="py-20 md:py-24 border-b border-[#DED8CC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#B08D57] font-semibold">
                Experience
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif text-[#171A18] mt-1">
                Career Trajectory & Impact
              </h2>
              <p className="text-xs sm:text-sm text-[#77736B] mt-1">
                My product, growth and digital journey across multiple industries.
              </p>
            </div>
            <button
              onClick={() => onNavigate('/experience')}
              className="inline-flex items-center gap-2 text-xs uppercase font-semibold tracking-wider text-[#171A18] hover:text-[#B08D57] transition-colors group cursor-pointer"
            >
              <span>View Full Experience</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Primary Current Experience Card Only */}
          {primaryExp && (
            <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#B08D57]/40 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 px-4 py-1 bg-[#171A18] text-[#F7F4ED] text-[10px] uppercase font-bold tracking-widest rounded-bl-lg">
                Current Role
              </div>
              
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#DED8CC]">
                <div>
                  <div className="text-xs text-[#B08D57] font-semibold tracking-wider uppercase mb-1">
                    {primaryExp.company}
                  </div>
                  <h3 className="font-serif text-2xl text-[#171A18] font-bold">
                    {primaryExp.role}
                  </h3>
                  <div className="text-xs text-[#77736B] mt-1">
                    {primaryExp.period} • {primaryExp.location}
                  </div>
                </div>

                {/* Primary Metric Scorecard */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                  {(primaryExp.impactMetrics && primaryExp.impactMetrics.length > 0 ? primaryExp.impactMetrics : [
                    { value: '₹9K → ₹3K', label: 'CPL Reduction' },
                    { value: '8% → 24%', label: 'Lead Conversion' },
                    { value: '50+', label: 'Projects' }
                  ]).map((metric, mIdx) => (
                    <div key={mIdx} className="p-3 bg-[#EFE9DC] rounded-xl text-center min-w-[100px] border border-[#DED8CC]">
                      <div className="font-serif text-lg sm:text-xl font-bold text-[#171A18]">{metric.value}</div>
                      <div className="text-[10px] uppercase tracking-wider text-[#B08D57] font-semibold">{metric.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <p className="text-xs text-[#77736B] max-w-2xl leading-relaxed">
                  {primaryExp.responsibilities?.[0] || 'Owned end-to-end acquisition-to-conversion funnel across luxury real estate projects, reducing customer acquisition costs by 66% through systematic experimentation.'}
                </p>
                {primaryExp.caseStudySlug && (
                  <button
                    onClick={() => onNavigate(`/projects/${primaryExp.caseStudySlug}`)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#B08D57] hover:text-[#171A18] transition-colors cursor-pointer shrink-0"
                  >
                    <span>View Case Study</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      </section>

      {/* 9. SELECTED WORK */}
      <section className="py-20 md:py-28 border-b border-[#DED8CC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#B08D57] font-semibold">
                Selected Work
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif text-[#171A18] mt-1">
                Product Case Studies
              </h2>
              <p className="text-xs sm:text-sm text-[#77736B] mt-1">
                Real product problems, experiments and solutions.
              </p>
            </div>
            <button
              onClick={() => onNavigate('/projects')}
              className="inline-flex items-center gap-2 text-xs uppercase font-semibold tracking-wider text-[#171A18] hover:text-[#B08D57] transition-colors group cursor-pointer"
            >
              <span>View All Projects</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Project Grid: Showing only top 2 on homepage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {featuredProjects.slice(0, 2).map((project, idx) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="group rounded-2xl bg-white border border-[#DED8CC] overflow-hidden flex flex-col hover:border-[#B08D57] transition-all duration-300 shadow-sm"
              >
                {/* Image Cover with Blur-Up Loading */}
                <div 
                  onClick={() => onNavigate(`/projects/${project.slug}`)}
                  className="w-full overflow-hidden bg-[#171A18] relative cursor-pointer"
                >
                  <BlurImage
                    src={project.coverImage}
                    alt={project.title}
                    aspectRatio="aspect-[16/9]"
                    hoverZoom
                  />
                  <div className="absolute top-4 left-4 z-10 pointer-events-none">
                    <span className="px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#171A18]/80 backdrop-blur-md text-[#F7F4ED] border border-[#B08D57]/40">
                      {project.category}
                    </span>
                  </div>
                </div>

                {/* Project Details */}
                <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 
                      onClick={() => onNavigate(`/projects/${project.slug}`)}
                      className="font-serif text-xl sm:text-2xl text-[#171A18] font-bold group-hover:text-[#B08D57] transition-colors cursor-pointer"
                    >
                      {project.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#77736B] mt-2 line-clamp-2 leading-relaxed">
                      {project.shortDescription}
                    </p>
                  </div>

                  {/* Metrics Badge */}
                  {project.metrics && project.metrics.length > 0 && (
                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      {project.metrics.slice(0, 2).map((m, mIdx) => (
                        <div key={mIdx} className="px-3 py-1.5 rounded-lg bg-[#EFE9DC] text-[11px] text-[#171A18] font-medium border border-[#DED8CC]">
                          <span className="font-bold text-[#B08D57] mr-1">{m.value}</span>
                          <span>{m.label}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-4 border-t border-[#DED8CC] flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5">
                      {project.tags.slice(0, 3).map((tag, tIdx) => (
                        <span key={tIdx} className="text-[10px] text-[#77736B] uppercase tracking-wider">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => onNavigate(`/projects/${project.slug}`)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#171A18] group-hover:text-[#B08D57] transition-colors cursor-pointer"
                    >
                      <span>View Case Study</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. CONTACT CTA SECTION */}
      <section className="py-24 bg-[#171A18] text-[#F7F4ED]">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-[#B08D57]/40 bg-white/5 text-xs font-semibold uppercase tracking-widest text-[#B08D57]">
            <span>Open for Product Roles</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-serif text-[#F7F4ED] leading-tight">
            Have a product problem in mind? <br />
            <span className="italic font-light text-[#EFE9DC]">I'd love to hear about it.</span>
          </h2>

          <p className="text-[#77736B] text-sm sm:text-base font-sans max-w-lg mx-auto leading-relaxed">
            Let's build something meaningful together. Reach out for full-time product opportunities, growth experiments, or technical collaboration.
          </p>

          <div className="pt-4 flex justify-center">
            <button
              onClick={onOpenConnect}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-xs font-semibold tracking-wider uppercase bg-[#B08D57] text-[#171A18] hover:bg-[#C6A66B] transition-colors shadow-lg cursor-pointer"
            >
              <span>Let's Connect</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
