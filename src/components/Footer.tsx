import React from 'react';
import { Mail, Linkedin, MapPin, Lock, ExternalLink } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { usePortfolio } from '../context/PortfolioContext';

interface FooterProps {
  onNavigate: (path: string) => void;
  onOpenConnect?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { profile } = usePortfolio();

  const linkedinUrl = profile?.linkedin || 'https://www.linkedin.com/in/rajpandya-product-management/';
  const linkedinDisplayName = profile?.linkedinName?.trim() && !profile.linkedinName.includes('http') && !profile.linkedinName.includes('linkedin.com')
    ? profile.linkedinName
    : 'Raj Pandya';
  const emailAddress = profile?.email || 'rajpandya1131@gmail.com';
  const location = profile?.location || 'Mumbai, India';

  return (
    <footer className="bg-[#171A18] text-[#F7F4ED] border-t border-[#2A2E2C]">
      {/* Main Footer Details */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          <div className="space-y-4">
            <div onClick={() => { onNavigate('/'); window.scrollTo({top:0, behavior:'smooth'}); }} className="cursor-pointer">
              <BrandLogo size="lg" variant="dark" />
            </div>
            <p className="text-xs text-[#A39D91] leading-relaxed">
              Product Management & Growth Trainee with a focus on data-informed decision-making, user onboarding funnels, and autonomous AI systems.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#77736B]">
              <MapPin className="w-3.5 h-3.5 text-[#B08D57]" />
              <span>{location}</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-widest text-[#B08D57] font-semibold">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => { onNavigate('/'); window.scrollTo({top:0, behavior:'smooth'}); }} className="text-[#EFE9DC] hover:text-[#B08D57] transition-colors">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => { onNavigate('/skills'); window.scrollTo({top:0, behavior:'smooth'}); }} className="text-[#EFE9DC] hover:text-[#B08D57] transition-colors">
                  Skills & Capabilities
                </button>
              </li>
              <li>
                <button onClick={() => { onNavigate('/experience'); window.scrollTo({top:0, behavior:'smooth'}); }} className="text-[#EFE9DC] hover:text-[#B08D57] transition-colors">
                  Experience & Timeline
                </button>
              </li>
              <li>
                <button onClick={() => { onNavigate('/projects'); window.scrollTo({top:0, behavior:'smooth'}); }} className="text-[#EFE9DC] hover:text-[#B08D57] transition-colors">
                  Featured Case Studies
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-widest text-[#B08D57] font-semibold">
              Featured Case Studies
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => { onNavigate('/projects/godrej-funnel-optimization'); window.scrollTo({top:0, behavior:'smooth'}); }} className="text-[#EFE9DC] hover:text-[#B08D57] transition-colors">
                  Godrej Properties (CPL ↓ 66%)
                </button>
              </li>
              <li>
                <button onClick={() => { onNavigate('/projects/pulsereel-ai-moderation'); window.scrollTo({top:0, behavior:'smooth'}); }} className="text-[#EFE9DC] hover:text-[#B08D57] transition-colors">
                  PulseReel Content AI
                </button>
              </li>
              <li>
                <button onClick={() => { onNavigate('/projects/naukri-find-my-job'); window.scrollTo({top:0, behavior:'smooth'}); }} className="text-[#EFE9DC] hover:text-[#B08D57] transition-colors">
                  Naukri Find My Job Matchmaker
                </button>
              </li>
              <li>
                <button onClick={() => { onNavigate('/projects/tatacliq-luxury-crm-retention'); window.scrollTo({top:0, behavior:'smooth'}); }} className="text-[#EFE9DC] hover:text-[#B08D57] transition-colors">
                  Tata CLiQ Luxury Retention
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-widest text-[#B08D57] font-semibold">
              Connect & Inquiries
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a
                  href={`mailto:${emailAddress}`}
                  className="flex items-center gap-2 text-[#EFE9DC] hover:text-[#B08D57] transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-[#B08D57]" />
                  <span>{emailAddress}</span>
                </a>
              </li>
              <li>
                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#232724] hover:bg-[#0A66C2] text-[#F7F4ED] hover:text-white border border-[#383C39] hover:border-[#0A66C2] transition-all truncate group/link"
                  title="Connect with Raj Pandya on LinkedIn"
                >
                  <Linkedin className="w-3.5 h-3.5 text-[#0A66C2] group-hover/link:text-white flex-shrink-0 transition-colors" />
                  <span className="font-semibold text-xs truncate">{linkedinDisplayName}</span>
                  <ExternalLink className="w-2.5 h-2.5 text-[#77736B] group-hover/link:text-white/80 opacity-70" />
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Baseline */}
        <div className="pt-8 border-t border-[#2A2E2C] flex flex-col sm:flex-row items-center justify-between text-xs text-[#77736B] gap-4">
          <p 
            onDoubleClick={() => onNavigate('/admin')} 
            className="cursor-default select-none"
            title=""
          >
            © {new Date().getFullYear()} {profile?.name || 'Raj Pandya'}. Built for Product Leadership.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-[11px] text-[#77736B]">{location}</span>
            <button
              onClick={() => onNavigate('/admin')}
              className="text-[#3A3F3C] hover:text-[#B08D57] transition-colors p-1 rounded-sm focus:outline-none"
              title="Admin Portal"
              aria-label="Admin Portal"
            >
              <Lock className="w-3 h-3 opacity-60 hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
