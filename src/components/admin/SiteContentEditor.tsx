import React, { useState } from 'react';
import { 
  User, 
  Sparkles, 
  Briefcase, 
  FolderKanban, 
  Globe, 
  Upload, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  ArrowRight,
  GraduationCap,
  Layers,
  TrendingUp,
  Database,
  Cpu,
  Loader2,
  Download,
  ExternalLink,
  Linkedin,
  FileText,
  Check
} from 'lucide-react';
import { ProfileContent, ExperienceItem, EducationItem, SkillCategory, PillarItem } from '../../types';
import { apiService } from '../../services/apiService';

export interface SiteContentEditorProps {
  profile: ProfileContent;
  setProfile: (profile: ProfileContent) => void;
  profileSaved: boolean;
  handleSaveProfile: (e: React.FormEvent) => void;
  experiences: ExperienceItem[];
  setExperiences: (experiences: ExperienceItem[]) => void;
  expSaved: boolean;
  handleSaveExperience: () => void;
  educationList: EducationItem[];
  setEducationList: (education: EducationItem[]) => void;
  eduSaved: boolean;
  handleSaveEducation: () => void;
  skillsList: SkillCategory[];
  setSkillsList: (skills: SkillCategory[]) => void;
  skillsSaved: boolean;
  handleSaveSkills: () => void;
  isOptimizingPhoto: boolean;
  photoStatusMessage: string;
  handleProfilePhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  contentSubTab: 'home' | 'skills' | 'experience' | 'projects-page' | 'contact';
  setContentSubTab: (tab: 'home' | 'skills' | 'experience' | 'projects-page' | 'contact') => void;
  onOpenProjectsTab: () => void;
}

export const SiteContentEditor: React.FC<SiteContentEditorProps> = ({
  profile,
  setProfile,
  profileSaved,
  handleSaveProfile,
  experiences,
  setExperiences,
  expSaved,
  handleSaveExperience,
  educationList,
  setEducationList,
  eduSaved,
  handleSaveEducation,
  skillsList,
  setSkillsList,
  skillsSaved,
  handleSaveSkills,
  isOptimizingPhoto,
  photoStatusMessage,
  handleProfilePhotoUpload,
  contentSubTab,
  setContentSubTab,
  onOpenProjectsTab
}) => {
  const [newSkillText, setNewSkillText] = useState<{ [catId: string]: string }>({});
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeMsg, setResumeMsg] = useState('');

  const handleDirectResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingResume(true);
    setResumeMsg(`Uploading ${file.name}...`);
    try {
      const res = await apiService.uploadResume(file);
      if (res.success && res.url) {
        setProfile({ ...profile, resumeUrl: res.url });
        setResumeMsg(`✓ "${file.name}" uploaded to backend successfully!`);
        setTimeout(() => setResumeMsg(''), 5000);
      } else {
        setResumeMsg(`Upload failed: ${res.error || 'Server error'}`);
      }
    } catch (err: any) {
      setResumeMsg(`Upload error: ${err.message || 'Failed'}`);
    } finally {
      setUploadingResume(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Content Sub Navigation Bar */}
      <div className="flex flex-wrap border-b border-[#DED8CC] gap-1 sm:gap-4 bg-white px-4 sm:px-6 pt-4 rounded-t-2xl border-t border-l border-r shadow-xs">
        <button
          type="button"
          onClick={() => setContentSubTab('home')}
          className={`pb-3 px-3 font-semibold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            contentSubTab === 'home'
              ? 'border-[#B08D57] text-[#171A18] font-bold'
              : 'border-transparent text-[#77736B] hover:text-[#171A18]'
          }`}
        >
          <User className="w-4 h-4 text-[#B08D57]" />
          <span>Home Page</span>
        </button>

        <button
          type="button"
          onClick={() => setContentSubTab('skills')}
          className={`pb-3 px-3 font-semibold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            contentSubTab === 'skills'
              ? 'border-[#B08D57] text-[#171A18] font-bold'
              : 'border-transparent text-[#77736B] hover:text-[#171A18]'
          }`}
        >
          <Sparkles className="w-4 h-4 text-[#B08D57]" />
          <span>Skills & Stack Page</span>
        </button>

        <button
          type="button"
          onClick={() => setContentSubTab('experience')}
          className={`pb-3 px-3 font-semibold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            contentSubTab === 'experience'
              ? 'border-[#B08D57] text-[#171A18] font-bold'
              : 'border-transparent text-[#77736B] hover:text-[#171A18]'
          }`}
        >
          <Briefcase className="w-4 h-4 text-[#B08D57]" />
          <span>Experience & Education Page</span>
        </button>

        <button
          type="button"
          onClick={() => setContentSubTab('projects-page')}
          className={`pb-3 px-3 font-semibold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            contentSubTab === 'projects-page'
              ? 'border-[#B08D57] text-[#171A18] font-bold'
              : 'border-transparent text-[#77736B] hover:text-[#171A18]'
          }`}
        >
          <FolderKanban className="w-4 h-4 text-[#B08D57]" />
          <span>Projects Page Header</span>
        </button>

        <button
          type="button"
          onClick={() => setContentSubTab('contact')}
          className={`pb-3 px-3 font-semibold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            contentSubTab === 'contact'
              ? 'border-[#B08D57] text-[#171A18] font-bold'
              : 'border-transparent text-[#77736B] hover:text-[#171A18]'
          }`}
        >
          <Globe className="w-4 h-4 text-[#B08D57]" />
          <span>Contact & Meta</span>
        </button>
      </div>

      {/* 1. HOME PAGE SUB-TAB */}
      {contentSubTab === 'home' && (
        <form onSubmit={handleSaveProfile} className="space-y-8 bg-white p-6 sm:p-8 rounded-b-2xl border border-[#DED8CC] shadow-sm">
          <div className="flex items-center justify-between border-b border-[#DED8CC] pb-4">
            <div>
              <h3 className="font-serif text-lg font-bold">Home Page Content & Layout</h3>
              <p className="text-xs text-[#77736B]">
                Manage hero copy, portrait image, quote, 4 impact metric cards, About Me section, and core disciplines.
              </p>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#171A18] hover:bg-[#B08D57] text-[#F7F4ED] hover:text-[#171A18] font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
            >
              {profileSaved ? 'Saved & Synced!' : 'Save Home Page'}
            </button>
          </div>

          {/* Section 1: Hero & Identity */}
          <div className="space-y-4">
            <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-[#B08D57] border-b border-[#EFE9DC] pb-2">
              1. Hero Section & Identity
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full p-3 rounded-xl border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                  Eyebrow Badge
                </label>
                <input
                  type="text"
                  value={profile.eyebrow}
                  onChange={(e) => setProfile({ ...profile, eyebrow: e.target.value })}
                  className="w-full p-3 rounded-xl border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                Main Primary Headline
              </label>
              <input
                type="text"
                value={profile.headline}
                onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
                className="w-full p-3 rounded-xl border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                Short Bio / Hero Summary
              </label>
              <textarea
                rows={3}
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                className="w-full p-3 rounded-xl border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
              />
            </div>
          </div>

          {/* Section 2: Hero Portrait Photo */}
          <div className="space-y-4 pt-4 border-t border-[#DED8CC]">
            <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-[#B08D57] border-b border-[#EFE9DC] pb-2">
              2. Hero Portrait Photo & Badge
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B]">
                      Portrait Photo File or URL
                    </label>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-medium">
                      Auto-synced to Cloud
                    </span>
                  </div>

                  <p className="text-[11px] text-[#77736B] mb-2 leading-relaxed">
                    Upload your headshot or paste any image URL. Camera & phone uploads are automatically optimized so they never fail Firestore cloud limits and load instantly.
                  </p>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Paste image URL (https://...)"
                      value={profile.photoUrl}
                      onChange={(e) => setProfile({ ...profile, photoUrl: e.target.value })}
                      className="flex-1 p-3 rounded-xl border border-[#DED8CC] text-xs focus:border-[#B08D57] outline-none"
                    />
                    <label className="px-4 py-2 rounded-xl bg-[#171A18] hover:bg-[#B08D57] text-[#F7F4ED] hover:text-[#171A18] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm whitespace-nowrap">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isOptimizingPhoto ? 'Optimizing...' : 'Upload Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isOptimizingPhoto}
                        className="hidden"
                        onChange={handleProfilePhotoUpload}
                      />
                    </label>
                  </div>

                  {photoStatusMessage && (
                    <div className="mt-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>{photoStatusMessage}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                    Portrait Tagline Badge (Floating over Photo)
                  </label>
                  <input
                    type="text"
                    value={profile.photoTagline}
                    onChange={(e) => setProfile({ ...profile, photoTagline: e.target.value })}
                    className="w-full p-3 rounded-xl border border-[#DED8CC] text-xs focus:border-[#B08D57] outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col items-center justify-center p-6 bg-[#171A18] rounded-xl border border-[#2A2E2C]">
                <div className="relative">
                  <img
                    src={profile.photoUrl}
                    alt={profile.name}
                    className="w-44 aspect-[4/5] object-cover rounded-lg shadow-xl border border-[#B08D57]/60"
                  />
                  <div className="absolute bottom-2 left-2 right-2 p-2 rounded bg-black/75 backdrop-blur-xs text-[10px] text-white font-medium text-center truncate">
                    Live Portrait Preview
                  </div>
                </div>
                <span className="text-[11px] text-[#77736B] mt-3">
                  Visible on public portfolio hero section
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Action Buttons & Resume */}
          <div className="space-y-4 pt-4 border-t border-[#DED8CC]">
            <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-[#B08D57] border-b border-[#EFE9DC] pb-2">
              3. Action Buttons & Resume Links
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                  Primary CTA Button Text
                </label>
                <input
                  type="text"
                  value={profile.primaryCtaText || 'View Projects'}
                  onChange={(e) => setProfile({ ...profile, primaryCtaText: e.target.value })}
                  className="w-full p-3 rounded-xl border border-[#DED8CC] text-xs focus:border-[#B08D57] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                  Secondary CTA Button Text
                </label>
                <input
                  type="text"
                  value={profile.secondaryCtaText || 'DOWNLOAD RESUME'}
                  onChange={(e) => setProfile({ ...profile, secondaryCtaText: e.target.value })}
                  className="w-full p-3 rounded-xl border border-[#DED8CC] text-xs focus:border-[#B08D57] outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B]">
                Direct Resume PDF & Backend Upload
              </label>

              {resumeMsg && (
                <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                  resumeMsg.startsWith('✓') 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                    : resumeMsg.startsWith('Uploading')
                    ? 'bg-blue-50 text-blue-800 border border-blue-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {uploadingResume ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 flex-shrink-0" />
                  ) : resumeMsg.startsWith('✓') ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  ) : null}
                  <span>{resumeMsg}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  placeholder="Paste URL or upload to backend (/uploads/...)"
                  value={profile.resumeUrl || ''}
                  onChange={(e) => setProfile({ ...profile, resumeUrl: e.target.value })}
                  className="flex-1 p-3 rounded-xl border border-[#DED8CC] text-xs focus:border-[#B08D57] outline-none"
                />

                <label className={`px-4 py-2.5 rounded-xl ${
                  uploadingResume
                    ? 'bg-[#383C39] text-[#A39D91] cursor-not-allowed'
                    : 'bg-[#171A18] hover:bg-[#B08D57] text-[#F7F4ED] hover:text-[#171A18] cursor-pointer'
                } text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-xs whitespace-nowrap`}>
                  {uploadingResume ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Resume</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="application/pdf,.doc,.docx"
                    disabled={uploadingResume}
                    className="hidden"
                    onChange={handleDirectResumeUpload}
                  />
                </label>
              </div>

              {profile.resumeUrl && (
                <div className="flex items-center gap-2 pt-1 text-xs">
                  <span className="text-emerald-700 font-medium">Active File:</span>
                  <span className="font-mono text-[11px] text-[#555] truncate max-w-xs">{profile.resumeUrl}</span>
                  <a
                    href={profile.resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-auto text-[#B08D57] hover:underline font-semibold flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>Test Download</span>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Philosophy Quote */}
          <div className="space-y-4 pt-4 border-t border-[#DED8CC]">
            <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-[#B08D57] border-b border-[#EFE9DC] pb-2">
              4. Product Philosophy Quote Banner
            </h4>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                Quote Statement
              </label>
              <textarea
                rows={2}
                value={profile.quote || ''}
                onChange={(e) => setProfile({ ...profile, quote: e.target.value })}
                className="w-full p-3 rounded-xl border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                  Quote Author
                </label>
                <input
                  type="text"
                  value={profile.quoteAuthor || ''}
                  onChange={(e) => setProfile({ ...profile, quoteAuthor: e.target.value })}
                  className="w-full p-3 rounded-xl border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                  Author Role / Attribution Note
                </label>
                <input
                  type="text"
                  value={profile.quoteAuthorRole || ''}
                  onChange={(e) => setProfile({ ...profile, quoteAuthorRole: e.target.value })}
                  className="w-full p-3 rounded-xl border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 5: 4 Key Impact Metrics */}
          <div className="space-y-4 pt-4 border-t border-[#DED8CC]">
            <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-[#B08D57] border-b border-[#EFE9DC] pb-2">
              5. Key Impact Metric Cards (4 Cards)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {profile.metrics.map((metric, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-[#DED8CC] bg-[#F7F4ED] space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#B08D57]">
                    Card #{idx + 1}
                  </span>
                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-[#77736B]">
                      Metric Value
                    </label>
                    <input
                      type="text"
                      value={metric.value}
                      onChange={(e) => {
                        const updated = [...profile.metrics];
                        updated[idx] = { ...updated[idx], value: e.target.value };
                        setProfile({ ...profile, metrics: updated });
                      }}
                      className="w-full p-2 rounded-lg border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-[#77736B]">
                      Metric Label
                    </label>
                    <input
                      type="text"
                      value={metric.label}
                      onChange={(e) => {
                        const updated = [...profile.metrics];
                        updated[idx] = { ...updated[idx], label: e.target.value };
                        setProfile({ ...profile, metrics: updated });
                      }}
                      className="w-full p-2 rounded-lg border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-[#77736B]">
                      Subtitle Note
                    </label>
                    <input
                      type="text"
                      value={metric.sub || ''}
                      onChange={(e) => {
                        const updated = [...profile.metrics];
                        updated[idx] = { ...updated[idx], sub: e.target.value };
                        setProfile({ ...profile, metrics: updated });
                      }}
                      className="w-full p-2 rounded-lg border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 6: About Me Section */}
          <div className="space-y-4 pt-4 border-t border-[#DED8CC]">
            <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-[#B08D57] border-b border-[#EFE9DC] pb-2">
              6. About Me Section Copy
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                  Eyebrow Label
                </label>
                <input
                  type="text"
                  value={profile.aboutEyebrow || 'About Me'}
                  onChange={(e) => setProfile({ ...profile, aboutEyebrow: e.target.value })}
                  className="w-full p-3 rounded-xl border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                  Main Section Heading
                </label>
                <input
                  type="text"
                  value={profile.aboutHeading || 'Turning Ideas into Meaningful Products'}
                  onChange={(e) => setProfile({ ...profile, aboutHeading: e.target.value })}
                  className="w-full p-3 rounded-xl border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                Paragraph 1
              </label>
              <textarea
                rows={2}
                value={profile.aboutParagraph1 || ''}
                onChange={(e) => setProfile({ ...profile, aboutParagraph1: e.target.value })}
                className="w-full p-3 rounded-xl border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                Paragraph 2
              </label>
              <textarea
                rows={2}
                value={profile.aboutParagraph2 || ''}
                onChange={(e) => setProfile({ ...profile, aboutParagraph2: e.target.value })}
                className="w-full p-3 rounded-xl border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
              />
            </div>
          </div>

          {/* Section 7: Core Disciplines / Pillars */}
          <div className="space-y-4 pt-4 border-t border-[#DED8CC]">
            <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-[#B08D57] border-b border-[#EFE9DC] pb-2">
              7. Core Disciplines / Product Pillars (4 Cards)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(profile.pillars || [
                { id: 'p1', title: 'Product Management', category: 'Lifecycle', description: '', tag: '0 to 1' },
                { id: 'p2', title: 'Growth & Experimentation', category: 'Growth', description: '', tag: 'CRO' },
                { id: 'p3', title: 'Data & Analytics', category: 'Data', description: '', tag: 'SQL' },
                { id: 'p4', title: 'AI & Automation', category: 'AI', description: '', tag: 'AI' }
              ]).map((pillar, pIdx) => (
                <div key={pillar.id || pIdx} className="p-4 rounded-xl border border-[#DED8CC] bg-[#F7F4ED] space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#B08D57]">
                    Pillar #{pIdx + 1}
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] uppercase font-semibold text-[#77736B]">Title</label>
                      <input
                        type="text"
                        value={pillar.title}
                        onChange={(e) => {
                          const updated = [...(profile.pillars || [])];
                          updated[pIdx] = { ...updated[pIdx], title: e.target.value };
                          setProfile({ ...profile, pillars: updated });
                        }}
                        className="w-full p-2 rounded-lg border border-[#DED8CC] text-xs bg-white font-bold focus:border-[#B08D57] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-semibold text-[#77736B]">Tag Badge</label>
                      <input
                        type="text"
                        value={pillar.tag || ''}
                        onChange={(e) => {
                          const updated = [...(profile.pillars || [])];
                          updated[pIdx] = { ...updated[pIdx], tag: e.target.value };
                          setProfile({ ...profile, pillars: updated });
                        }}
                        className="w-full p-2 rounded-lg border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-[#77736B]">Description</label>
                    <textarea
                      rows={2}
                      value={pillar.description}
                      onChange={(e) => {
                        const updated = [...(profile.pillars || [])];
                        updated[pIdx] = { ...updated[pIdx], description: e.target.value };
                        setProfile({ ...profile, pillars: updated });
                      }}
                      className="w-full p-2 rounded-lg border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-right pt-6 border-t border-[#DED8CC]">
            <button
              type="submit"
              className="px-8 py-3 rounded-xl bg-[#171A18] hover:bg-[#B08D57] text-[#F7F4ED] hover:text-[#171A18] font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
            >
              {profileSaved ? 'Saved Successfully!' : 'Save All Home Page Changes'}
            </button>
          </div>
        </form>
      )}

      {/* 2. SKILLS & STACK PAGE SUB-TAB */}
      {contentSubTab === 'skills' && (
        <div className="space-y-6 bg-white p-6 sm:p-8 rounded-b-2xl border border-[#DED8CC] shadow-sm">
          <div className="flex items-center justify-between border-b border-[#DED8CC] pb-4">
            <div>
              <h3 className="font-serif text-lg font-bold">Skills & Competencies Page Content</h3>
              <p className="text-xs text-[#77736B]">
                Manage page header copy and add, remove, or customize skill categories and skill tags.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const newCat: SkillCategory = {
                    id: `cat-${Date.now()}`,
                    name: 'New Skill Category',
                    description: 'Description of frameworks and capabilities.',
                    skills: ['Skill 1', 'Skill 2']
                  };
                  setSkillsList([...skillsList, newCat]);
                }}
                className="px-4 py-2 rounded-xl bg-[#EFE9DC] hover:bg-[#DED8CC] text-xs font-semibold cursor-pointer"
              >
                + Add Category
              </button>

              <button
                type="button"
                onClick={() => {
                  handleSaveSkills();
                  handleSaveProfile({ preventDefault: () => {} } as React.FormEvent);
                }}
                className="px-6 py-2 rounded-xl bg-[#171A18] hover:bg-[#B08D57] text-[#F7F4ED] hover:text-[#171A18] font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
              >
                {skillsSaved ? 'Saved & Synced!' : 'Save All Skills'}
              </button>
            </div>
          </div>

          {/* Page Header Copy */}
          <div className="space-y-4 p-5 rounded-xl border border-[#DED8CC] bg-[#F7F4ED]">
            <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-[#B08D57]">
              Page Header Copy
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-semibold text-[#77736B] mb-1">
                  Header Eyebrow
                </label>
                <input
                  type="text"
                  value={profile.skillsPageEyebrow || 'Competencies & Stack'}
                  onChange={(e) => setProfile({ ...profile, skillsPageEyebrow: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-[#77736B] mb-1">
                  Page Title
                </label>
                <input
                  type="text"
                  value={profile.skillsPageTitle || 'Skills & Capabilities'}
                  onChange={(e) => setProfile({ ...profile, skillsPageTitle: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-semibold text-[#77736B] mb-1">
                Page Description
              </label>
              <textarea
                rows={2}
                value={profile.skillsPageDescription || ''}
                onChange={(e) => setProfile({ ...profile, skillsPageDescription: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
              />
            </div>
          </div>

          {/* Categories & Skills Pills */}
          <div className="space-y-6 pt-2">
            <h4 className="font-serif text-sm font-bold text-[#171A18]">
              Skill Categories & Tags ({skillsList.length} Categories)
            </h4>

            {skillsList.map((cat, catIdx) => (
              <div key={cat.id} className="p-5 rounded-xl border border-[#DED8CC] bg-[#F7F4ED] space-y-4">
                <div className="flex items-center justify-between border-b border-[#DED8CC] pb-3">
                  <div className="flex-1 mr-4">
                    <label className="block text-[10px] uppercase font-semibold text-[#77736B] mb-1">
                      Category Name
                    </label>
                    <input
                      type="text"
                      value={cat.name}
                      onChange={(e) => {
                        const updated = [...skillsList];
                        updated[catIdx] = { ...updated[catIdx], name: e.target.value };
                        setSkillsList(updated);
                      }}
                      className="w-full p-2.5 rounded-lg border border-[#DED8CC] text-xs bg-white font-bold focus:border-[#B08D57] outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setSkillsList(skillsList.filter(c => c.id !== cat.id))}
                    className="text-rose-600 hover:text-rose-800 text-xs font-semibold mt-4 cursor-pointer"
                  >
                    Delete Category
                  </button>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-semibold text-[#77736B] mb-1">
                    Category Description
                  </label>
                  <textarea
                    rows={2}
                    value={cat.description}
                    onChange={(e) => {
                      const updated = [...skillsList];
                      updated[catIdx] = { ...updated[catIdx], description: e.target.value };
                      setSkillsList(updated);
                    }}
                    className="w-full p-2.5 rounded-lg border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                  />
                </div>

                {/* Skills Tags List */}
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-[#77736B] mb-2">
                    Skill Pills ({cat.skills.length})
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {cat.skills.map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#DED8CC] text-xs font-medium text-[#171A18] shadow-2xs"
                      >
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...skillsList];
                            const newSkills = cat.skills.filter((_, idx) => idx !== sIdx);
                            updated[catIdx] = { ...updated[catIdx], skills: newSkills };
                            setSkillsList(updated);
                          }}
                          className="w-3.5 h-3.5 rounded-full hover:bg-rose-100 text-rose-600 flex items-center justify-center cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* Add Skill Input */}
                  <div className="flex gap-2 max-w-md">
                    <input
                      type="text"
                      placeholder="Type new skill tag and click Add..."
                      value={newSkillText[cat.id] || ''}
                      onChange={(e) => setNewSkillText({ ...newSkillText, [cat.id]: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = (newSkillText[cat.id] || '').trim();
                          if (val) {
                            const updated = [...skillsList];
                            updated[catIdx] = { ...updated[catIdx], skills: [...cat.skills, val] };
                            setSkillsList(updated);
                            setNewSkillText({ ...newSkillText, [cat.id]: '' });
                          }
                        }
                      }}
                      className="flex-1 p-2 rounded-lg border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = (newSkillText[cat.id] || '').trim();
                        if (val) {
                          const updated = [...skillsList];
                          updated[catIdx] = { ...updated[catIdx], skills: [...cat.skills, val] };
                          setSkillsList(updated);
                          setNewSkillText({ ...newSkillText, [cat.id]: '' });
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#171A18] text-[#F7F4ED] hover:bg-[#B08D57] text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-right pt-4 border-t border-[#DED8CC]">
            <button
              type="button"
              onClick={() => {
                handleSaveSkills();
                handleSaveProfile({ preventDefault: () => {} } as React.FormEvent);
              }}
              className="px-8 py-3 rounded-xl bg-[#171A18] hover:bg-[#B08D57] text-[#F7F4ED] hover:text-[#171A18] font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
            >
              {skillsSaved ? 'Saved Successfully!' : 'Save All Skills & Headers'}
            </button>
          </div>
        </div>
      )}

      {/* 3. EXPERIENCE & EDUCATION PAGE SUB-TAB */}
      {contentSubTab === 'experience' && (
        <div className="space-y-8 bg-white p-6 sm:p-8 rounded-b-2xl border border-[#DED8CC] shadow-sm">
          <div className="flex items-center justify-between border-b border-[#DED8CC] pb-4">
            <div>
              <h3 className="font-serif text-lg font-bold">Experience & Education Page Content</h3>
              <p className="text-xs text-[#77736B]">
                Manage career timeline, positions, responsibilities, and education degrees.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                handleSaveExperience();
                handleSaveEducation();
                handleSaveProfile({ preventDefault: () => {} } as React.FormEvent);
              }}
              className="px-6 py-2 rounded-xl bg-[#171A18] hover:bg-[#B08D57] text-[#F7F4ED] hover:text-[#171A18] font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
            >
              {expSaved ? 'Saved & Synced!' : 'Save Experience & Edu'}
            </button>
          </div>

          {/* Experience Page Header */}
          <div className="space-y-4 p-5 rounded-xl border border-[#DED8CC] bg-[#F7F4ED]">
            <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-[#B08D57]">
              Page Header Copy
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-semibold text-[#77736B] mb-1">
                  Header Eyebrow
                </label>
                <input
                  type="text"
                  value={profile.experiencePageEyebrow || 'Career Record'}
                  onChange={(e) => setProfile({ ...profile, experiencePageEyebrow: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-[#77736B] mb-1">
                  Page Title
                </label>
                <input
                  type="text"
                  value={profile.experiencePageTitle || 'Experience & Journey'}
                  onChange={(e) => setProfile({ ...profile, experiencePageTitle: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-semibold text-[#77736B] mb-1">
                Page Description
              </label>
              <textarea
                rows={2}
                value={profile.experiencePageDescription || ''}
                onChange={(e) => setProfile({ ...profile, experiencePageDescription: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
              />
            </div>
          </div>

          {/* Work Experience Timeline */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="font-serif text-sm font-bold text-[#171A18]">
                Career Timeline ({experiences.length} Positions)
              </h4>

              <button
                type="button"
                onClick={() => {
                  const newExp: ExperienceItem = {
                    id: `exp-${Date.now()}`,
                    company: 'New Company',
                    role: 'Product Manager',
                    period: '2026 – Present',
                    location: 'Mumbai, India',
                    responsibilities: ['Led product roadmap and sprint execution.']
                  };
                  setExperiences([newExp, ...experiences]);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-[#EFE9DC] hover:bg-[#DED8CC] text-xs font-semibold cursor-pointer"
              >
                + Add Position
              </button>
            </div>

            <div className="space-y-4">
              {experiences.map((exp, idx) => (
                <div key={exp.id} className="p-5 rounded-xl border border-[#DED8CC] bg-[#F7F4ED] space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#171A18]">Position #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => setExperiences(experiences.filter(e => e.id !== exp.id))}
                      className="text-rose-600 hover:text-rose-800 text-xs font-semibold cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#77736B]">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) => {
                          const updated = [...experiences];
                          updated[idx] = { ...updated[idx], company: e.target.value };
                          setExperiences(updated);
                        }}
                        className="w-full p-2.5 rounded-lg border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#77736B]">
                        Role Title
                      </label>
                      <input
                        type="text"
                        value={exp.role}
                        onChange={(e) => {
                          const updated = [...experiences];
                          updated[idx] = { ...updated[idx], role: e.target.value };
                          setExperiences(updated);
                        }}
                        className="w-full p-2.5 rounded-lg border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#77736B]">
                        Period
                      </label>
                      <input
                        type="text"
                        value={exp.period}
                        onChange={(e) => {
                          const updated = [...experiences];
                          updated[idx] = { ...updated[idx], period: e.target.value };
                          setExperiences(updated);
                        }}
                        className="w-full p-2.5 rounded-lg border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#77736B]">
                        Location
                      </label>
                      <input
                        type="text"
                        value={exp.location}
                        onChange={(e) => {
                          const updated = [...experiences];
                          updated[idx] = { ...updated[idx], location: e.target.value };
                          setExperiences(updated);
                        }}
                        className="w-full p-2.5 rounded-lg border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#77736B] mb-1">
                      Key Responsibilities & Impact (1 per line)
                    </label>
                    <textarea
                      rows={3}
                      value={exp.responsibilities.join('\n')}
                      onChange={(e) => {
                        const updated = [...experiences];
                        updated[idx] = { ...updated[idx], responsibilities: e.target.value.split('\n').filter(Boolean) };
                        setExperiences(updated);
                      }}
                      className="w-full p-2.5 rounded-lg border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Education Records */}
          <div className="space-y-4 pt-4 border-t border-[#DED8CC]">
            <div className="flex items-center justify-between">
              <h4 className="font-serif text-sm font-bold text-[#171A18]">
                Education Records ({educationList.length} Degrees)
              </h4>

              <button
                type="button"
                onClick={() => {
                  const newEdu: EducationItem = {
                    id: `edu-${Date.now()}`,
                    degree: 'Degree or Certification',
                    institution: 'University / Institute',
                    period: '2020 – 2024',
                    score: '',
                    status: 'Completed'
                  };
                  setEducationList([...educationList, newEdu]);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-[#EFE9DC] hover:bg-[#DED8CC] text-xs font-semibold cursor-pointer"
              >
                + Add Education
              </button>
            </div>

            <div className="space-y-4">
              {educationList.map((edu, eduIdx) => (
                <div key={edu.id} className="p-5 rounded-xl border border-[#DED8CC] bg-[#F7F4ED] space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#171A18]">Education #{eduIdx + 1}</span>
                    <button
                      type="button"
                      onClick={() => setEducationList(educationList.filter(e => e.id !== edu.id))}
                      className="text-rose-600 hover:text-rose-800 text-xs font-semibold cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#77736B]">Degree</label>
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => {
                          const updated = [...educationList];
                          updated[eduIdx] = { ...updated[eduIdx], degree: e.target.value };
                          setEducationList(updated);
                        }}
                        className="w-full p-2.5 rounded-lg border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#77736B]">Institution</label>
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) => {
                          const updated = [...educationList];
                          updated[eduIdx] = { ...updated[eduIdx], institution: e.target.value };
                          setEducationList(updated);
                        }}
                        className="w-full p-2.5 rounded-lg border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#77736B]">Period</label>
                      <input
                        type="text"
                        value={edu.period || ''}
                        onChange={(e) => {
                          const updated = [...educationList];
                          updated[eduIdx] = { ...updated[eduIdx], period: e.target.value };
                          setEducationList(updated);
                        }}
                        className="w-full p-2.5 rounded-lg border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#77736B]">Score / Honors</label>
                      <input
                        type="text"
                        value={edu.score}
                        onChange={(e) => {
                          const updated = [...educationList];
                          updated[eduIdx] = { ...updated[eduIdx], score: e.target.value };
                          setEducationList(updated);
                        }}
                        className="w-full p-2.5 rounded-lg border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-right pt-4 border-t border-[#DED8CC]">
            <button
              type="button"
              onClick={() => {
                handleSaveExperience();
                handleSaveEducation();
                handleSaveProfile({ preventDefault: () => {} } as React.FormEvent);
              }}
              className="px-8 py-3 rounded-xl bg-[#171A18] hover:bg-[#B08D57] text-[#F7F4ED] hover:text-[#171A18] font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
            >
              {expSaved ? 'Saved Successfully!' : 'Save Experience & Education'}
            </button>
          </div>
        </div>
      )}

      {/* 4. PROJECTS PAGE HEADER SUB-TAB */}
      {contentSubTab === 'projects-page' && (
        <div className="space-y-6 bg-white p-6 sm:p-8 rounded-b-2xl border border-[#DED8CC] shadow-sm">
          <div className="flex items-center justify-between border-b border-[#DED8CC] pb-4">
            <div>
              <h3 className="font-serif text-lg font-bold">Projects Page Header & Introductory Copy</h3>
              <p className="text-xs text-[#77736B]">
                Customize the top header of the public `/projects` case study directory.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleSaveProfile({ preventDefault: () => {} } as React.FormEvent)}
              className="px-6 py-2.5 rounded-xl bg-[#171A18] hover:bg-[#B08D57] text-[#F7F4ED] hover:text-[#171A18] font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
            >
              {profileSaved ? 'Saved!' : 'Save Header Copy'}
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                  Header Eyebrow Label
                </label>
                <input
                  type="text"
                  value={profile.projectsPageEyebrow || 'Portfolio Case Studies'}
                  onChange={(e) => setProfile({ ...profile, projectsPageEyebrow: e.target.value })}
                  className="w-full p-3 rounded-xl border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                  Page Title
                </label>
                <input
                  type="text"
                  value={profile.projectsPageTitle || 'Featured Work & Case Studies'}
                  onChange={(e) => setProfile({ ...profile, projectsPageTitle: e.target.value })}
                  className="w-full p-3 rounded-xl border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                Introductory Summary / Description
              </label>
              <textarea
                rows={3}
                value={profile.projectsPageDescription || ''}
                onChange={(e) => setProfile({ ...profile, projectsPageDescription: e.target.value })}
                className="w-full p-3 rounded-xl border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
              />
            </div>
          </div>

          {/* Banner linking to the full Projects Manager */}
          <div className="p-6 rounded-2xl bg-[#171A18] text-[#F7F4ED] border border-[#2A2E2C] flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <div>
              <h4 className="font-serif text-base font-bold text-[#F7F4ED]">
                Ready to manage individual case studies?
              </h4>
              <p className="text-xs text-[#77736B] mt-1">
                Edit case study text, upload cover images, add wireframes, metrics, and manage drafts.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenProjectsTab}
              className="px-6 py-2.5 rounded-xl bg-[#B08D57] hover:bg-[#C6A66B] text-[#171A18] font-bold text-xs uppercase tracking-wider transition-colors shadow-md whitespace-nowrap cursor-pointer"
            >
              Open Projects Manager →
            </button>
          </div>
        </div>
      )}

      {/* 5. CONTACT & GLOBAL META SUB-TAB */}
      {contentSubTab === 'contact' && (
        <form onSubmit={handleSaveProfile} className="space-y-6 bg-white p-6 sm:p-8 rounded-b-2xl border border-[#DED8CC] shadow-sm">
          <div className="flex items-center justify-between border-b border-[#DED8CC] pb-4">
            <div>
              <h3 className="font-serif text-lg font-bold">Contact Details & Global Information</h3>
              <p className="text-xs text-[#77736B]">
                Update contact emails, LinkedIn profile URL, location, and role availability status across the site.
              </p>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#171A18] hover:bg-[#B08D57] text-[#F7F4ED] hover:text-[#171A18] font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
            >
              {profileSaved ? 'Saved!' : 'Save Contact Info'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                Contact Email
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full p-3 rounded-xl border border-[#DED8CC] text-xs focus:border-[#B08D57] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                LinkedIn Display Name (Footer & Bottom)
              </label>
              <input
                type="text"
                placeholder="e.g. linkedin.com/in/raj-pandya-pm or Raj Pandya"
                value={profile.linkedinName || ''}
                onChange={(e) => setProfile({ ...profile, linkedinName: e.target.value })}
                className="w-full p-3 rounded-xl border border-[#DED8CC] text-xs focus:border-[#B08D57] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                LinkedIn Profile URL
              </label>
              <input
                type="text"
                placeholder="https://www.linkedin.com/in/..."
                value={profile.linkedin}
                onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                className="w-full p-3 rounded-xl border border-[#DED8CC] text-xs focus:border-[#B08D57] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                Location / Base
              </label>
              <input
                type="text"
                value={profile.location}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                className="w-full p-3 rounded-xl border border-[#DED8CC] text-xs focus:border-[#B08D57] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                Role Availability Status Badge
              </label>
              <input
                type="text"
                value={profile.availabilityStatus || 'Open to Principal & Lead PM roles'}
                onChange={(e) => setProfile({ ...profile, availabilityStatus: e.target.value })}
                className="w-full p-3 rounded-xl border border-[#DED8CC] text-xs focus:border-[#B08D57] outline-none"
              />
            </div>
          </div>

          <div className="text-right pt-4 border-t border-[#DED8CC]">
            <button
              type="submit"
              className="px-8 py-3 rounded-xl bg-[#171A18] hover:bg-[#B08D57] text-[#F7F4ED] hover:text-[#171A18] font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
            >
              {profileSaved ? 'Saved Successfully!' : 'Save Contact Details'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
