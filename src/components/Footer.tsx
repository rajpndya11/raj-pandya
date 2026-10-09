import React, { useState, useEffect } from 'react';
import { Mail, Linkedin, MapPin, Lock, Edit3, X, Check, ExternalLink } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { usePortfolio } from '../context/PortfolioContext';
import { storageService } from '../services/storageService';

interface FooterProps {
  onNavigate: (path: string) => void;
  onOpenConnect?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { profile } = usePortfolio();
  const [isEditingLinkedIn, setIsEditingLinkedIn] = useState(false);
  const [customName, setCustomName] = useState(profile?.linkedinName || '');
  const [customUrl, setCustomUrl] = useState(profile?.linkedin || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (profile?.linkedinName) setCustomName(profile.linkedinName);
    if (profile?.linkedin) setCustomUrl(profile.linkedin);
  }, [profile?.linkedinName, profile?.linkedin]);

  const linkedinUrl = profile?.linkedin || 'https://www.linkedin.com/in/raj-pandya-pm';
  const linkedinDisplayName = profile?.linkedinName || (profile?.linkedin ? profile.linkedin.replace(/^https?:\/\/(www\.)?/, '') : 'linkedin.com/in/raj-pandya-pm');
  const emailAddress = profile?.email || 'rajpandya1131@gmail.com';
  const location = profile?.location || 'Mumbai, India';

  const handleSaveLinkedIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setIsSaving(true);
    try {
      const updated = {
        ...profile,
        linkedinName: customName.trim(),
        linkedin: customUrl.trim()
      };
      await storageService.saveProfile(updated);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsEditingLinkedIn(false);
      }, 1500);
    } catch (err) {
      console.error('Failed to save LinkedIn in footer:', err);
    } finally {
      setIsSaving(false);
    }
  };

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
              <li className="flex items-center justify-between group gap-2">
                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-[#EFE9DC] hover:text-[#B08D57] transition-colors truncate flex-1"
                >
                  <Linkedin className="w-3.5 h-3.5 text-[#B08D57] flex-shrink-0" />
                  <span className="truncate">{linkedinDisplayName}</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setCustomName(profile?.linkedinName || linkedinDisplayName);
                    setCustomUrl(profile?.linkedin || linkedinUrl);
                    setIsEditingLinkedIn(true);
                  }}
                  className="opacity-70 group-hover:opacity-100 hover:text-[#B08D57] text-[#77736B] p-1 transition-opacity text-[11px] flex items-center gap-1 cursor-pointer bg-[#232724] hover:bg-[#2A2E2C] rounded-md px-1.5 py-0.5"
                  title="Rename LinkedIn Name and update URL"
                  aria-label="Rename LinkedIn Name and update URL"
                >
                  <Edit3 className="w-2.5 h-2.5" />
                  <span className="text-[10px]">Rename</span>
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Quick Edit LinkedIn Modal */}
        {isEditingLinkedIn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
            <div 
              className="relative w-full max-w-md bg-[#1D211F] border border-[#383C39] rounded-2xl shadow-2xl p-6 text-[#F7F4ED]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#2A2E2C]">
                <div className="flex items-center gap-2">
                  <Linkedin className="w-4 h-4 text-[#B08D57]" />
                  <h3 className="font-serif font-bold text-sm tracking-wide">
                    Rename LinkedIn Name & URL
                  </h3>
                </div>
                <button
                  onClick={() => setIsEditingLinkedIn(false)}
                  className="p-1 rounded-lg text-[#77736B] hover:text-[#F7F4ED] hover:bg-[#2A2E2C] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-[#A39D91] mt-2 mb-4 leading-relaxed">
                Update how your LinkedIn profile appears in the bottom footer and where it links across the portfolio.
              </p>

              <form onSubmit={handleSaveLinkedIn} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#B08D57] mb-1">
                    LinkedIn Display Name (in bottom footer)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. linkedin.com/in/rajpandya-product-management"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#171A18] border border-[#383C39] text-xs text-[#F7F4ED] focus:border-[#B08D57] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#B08D57] mb-1">
                    LinkedIn Profile URL
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://www.linkedin.com/in/..."
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#171A18] border border-[#383C39] text-xs text-[#F7F4ED] focus:border-[#B08D57] outline-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <a
                    href={customUrl || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-[#A39D91] hover:text-[#B08D57] flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Test Link</span>
                  </a>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingLinkedIn(false)}
                      className="px-3 py-1.5 rounded-lg border border-[#383C39] text-xs text-[#A39D91] hover:text-[#F7F4ED] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-4 py-1.5 rounded-lg bg-[#B08D57] text-[#171A18] hover:bg-[#C4A066] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {saveSuccess ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-950" />
                          <span>Saved Live!</span>
                        </>
                      ) : isSaving ? (
                        <span>Saving...</span>
                      ) : (
                        <span>Save & Apply</span>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

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
