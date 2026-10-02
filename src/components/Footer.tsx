import React from 'react';
import { Mail, Linkedin, MapPin } from 'lucide-react';

interface FooterProps {
  onNavigate: (path: string) => void;
  onOpenConnect?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-[#171A18] text-[#F7F4ED] border-t border-[#2A2E2C]">
      {/* Main Footer Details */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          <div className="space-y-3">
            <span className="font-serif text-lg font-bold tracking-wider text-[#F7F4ED] uppercase">
              RAJ PANDYA
            </span>
            <p className="text-xs text-[#77736B] leading-relaxed">
              Product Management & Growth Trainee with a focus on data-informed decision-making, user onboarding funnels, and autonomous AI systems.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#77736B]">
              <MapPin className="w-3.5 h-3.5 text-[#B08D57]" />
              <span>Mumbai, India</span>
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
                  href="mailto:rajpandya1131@gmail.com"
                  className="flex items-center gap-2 text-[#EFE9DC] hover:text-[#B08D57] transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-[#B08D57]" />
                  <span>rajpandya1131@gmail.com</span>
                </a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/in/raj-pandya-pm"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-[#EFE9DC] hover:text-[#B08D57] transition-colors"
                >
                  <Linkedin className="w-3.5 h-3.5 text-[#B08D57]" />
                  <span>linkedin.com/in/raj-pandya-pm</span>
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
            © {new Date().getFullYear()} Raj Pandya. Built for Product Leadership.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-[11px] text-[#77736B]">Mumbai • India</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
