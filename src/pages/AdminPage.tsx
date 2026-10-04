import React, { useState, useEffect, useRef } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { 
  Lock, 
  Unlock, 
  Plus, 
  Trash2, 
  Copy, 
  Eye, 
  Check, 
  X, 
  Download, 
  Upload, 
  Sparkles, 
  Layers, 
  User, 
  Briefcase, 
  Key, 
  RefreshCw, 
  ExternalLink, 
  Star, 
  FolderKanban, 
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  FileText,
  Search,
  CheckCircle2,
  Database,
  Globe,
  Share2,
  Video,
  Figma,
  Maximize2,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  Menu,
  GraduationCap,
  Mail,
  Presentation
} from 'lucide-react';
import { authService, BOOTSTRAP_ADMIN_EMAIL } from '../services/authService';
import { storageService } from '../services/storageService';
import { compressImage, normalizeImageUrl } from '../utils/imageCompressor';
import { DocumentViewer } from '../components/DocumentViewer';
import { RpMonogram, BrandLogo } from '../components/BrandLogo';
import { 
  Project, 
  ProfileContent, 
  ExperienceItem, 
  EducationItem,
  SkillCategory,
  PillarItem,
  ProjectLink, 
  ProjectFile,
  LinkType, 
  ProjectCategory,
  WireframeAsset,
  CustomBlock,
  BlockType,
  MediaAsset
} from '../types';

interface AdminPageProps {
  onNavigate: (path: string) => void;
}

type AdminTab = 'projects' | 'content' | 'media' | 'settings';
type ContentSubTab = 'home' | 'skills' | 'experience' | 'projects-page' | 'contact';
type ProjectEditorTab = 'basic' | 'content' | 'wireframes' | 'links' | 'documents' | 'metrics' | 'blocks' | 'seo';

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigate }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [googleLoginError, setGoogleLoginError] = useState('');
  const [passcode, setPasscode] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showPasscodeFallback, setShowPasscodeFallback] = useState(false);
  
  // Dashboard navigation tab
  const [activeTab, setActiveTab] = useState<AdminTab>('projects');
  const [contentSubTab, setContentSubTab] = useState<ContentSubTab>('home');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Projects list state
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [projectEditorTab, setProjectEditorTab] = useState<ProjectEditorTab>('basic');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Published' | 'Draft'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Media Library state
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [copiedMediaId, setCopiedMediaId] = useState<string | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // Profile state
  const [profile, setProfile] = useState<ProfileContent>(storageService.getProfile());
  const [profileSaved, setProfileSaved] = useState(false);
  const [isOptimizingPhoto, setIsOptimizingPhoto] = useState(false);
  const [photoStatusMessage, setPhotoStatusMessage] = useState('');

  // Experience state
  const [experiences, setExperiences] = useState<ExperienceItem[]>(storageService.getExperience());
  const [expSaved, setExpSaved] = useState(false);

  // Education state
  const [educationList, setEducationList] = useState<EducationItem[]>(storageService.getEducation());
  const [eduSaved, setEduSaved] = useState(false);

  // Skills state
  const [skillsList, setSkillsList] = useState<SkillCategory[]>(storageService.getSkills());
  const [skillsSaved, setSkillsSaved] = useState(false);
  const [newSkillText, setNewSkillText] = useState<{ [catId: string]: string }>({});

  // Passcode settings state
  const [newPasscode, setNewPasscode] = useState('');
  const [passcodeSuccess, setPasscodeSuccess] = useState('');
  const [passcodeError, setPasscodeError] = useState('');

  // Backup & cloud state
  const [backupStatus, setBackupStatus] = useState('');
  const [cloudSyncing, setCloudSyncing] = useState(false);

  // Delete confirmation modal state
  const [itemToDelete, setItemToDelete] = useState<{ type: 'project' | 'media'; id: string; name: string } | null>(null);

  // Live preview drawer state inside admin
  const [previewProject, setPreviewProject] = useState<Project | null>(null);

  useEffect(() => {
    // 1. Check existing state
    const authStatus = authService.isAuthenticated();
    setIsAuthenticated(authStatus);
    if (authStatus) {
      loadData();
    }

    // 2. Subscribe to Firebase Auth state
    const unsubscribe = authService.onAuthStateSubscription((state) => {
      setCurrentUser(state.user);
      if (state.isAuthorized) {
        setIsAuthenticated(true);
        setGoogleLoginError('');
        loadData();
      } else {
        if (state.error) {
          setGoogleLoginError(state.error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const loadData = () => {
    setProjects(storageService.getProjects());
    setProfile(storageService.getProfile());
    setExperiences(storageService.getExperience());
    setEducationList(storageService.getEducation());
    setSkillsList(storageService.getSkills());
    setMediaAssets(storageService.getMediaAssets());
  };

  const handleGoogleLogin = async () => {
    setIsAuthLoading(true);
    setGoogleLoginError('');
    try {
      const { user, authorized } = await authService.loginWithGoogle();
      if (authorized) {
        setCurrentUser(user);
        setIsAuthenticated(true);
        loadData();
      }
    } catch (err: any) {
      console.warn('Google login failed:', err);
      setGoogleLoginError(err.message || 'Google authentication was cancelled or failed.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handlePasscodeLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (authService.loginWithPasscode(passcode)) {
      setIsAuthenticated(true);
      setLoginError('');
      loadData();
    } else {
      setLoginError('Invalid secret passcode. Default is "raj1131".');
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setPasscode('');
  };

  // --- PROJECT CRUD ---
  const handleStartNewProject = () => {
    const newProj: Project = {
      id: `proj-${Date.now()}`,
      slug: `new-case-study-${Date.now().toString().slice(-4)}`,
      title: 'New Case Study Title',
      subtitle: 'Compelling subtitle explaining the product context and verified outcome',
      shortDescription: 'Concise summary of the challenge, product hypothesis, and business impact.',
      category: 'Product',
      tags: ['Product', 'Strategy'],
      role: 'Lead Product Manager',
      timeline: '2026',
      industry: 'SaaS & Enterprise',
      team: 'Engineering, Design, Data, Sales',
      coverImage: 'https://drive.google.com/uc?export=view&id=1nYik8Fmh7gIGUGNbMb0kcXe5ysGQhpW7' ,
      featured: false,
      status: 'Published',
      overview: 'Provide high-level context about the business challenge and opportunity...',
      problem: 'Detailed breakdown of the user or business problem...',
      objectives: 'Specific targets and north star metrics...',
      userResearch: 'Key discoveries from customer discovery and qualitative interviews...',
      targetAudience: 'Primary personas, buyer personas, and underserved user segments...',
      painPoints: 'Critical points of friction identified in the existing flow...',
      strategy: 'Strategic pillars, trade-offs, and roadmap prioritization...',
      solution: 'Product specs, features delivered, and technical architecture...',
      experimentation: 'A/B testing, multivariate trials, and validation loops...',
      outcome: 'Measurable impact, revenue increase, or retention lift...',
      learnings: 'Retrospective insights, what worked, and what would be done differently...',
      metrics: [
        { label: 'Conversion Lift', value: '+24%', detail: 'Measured result' }
      ],
      links: [
        { id: `l-${Date.now()}`, type: 'PRD', label: 'View Product Requirements', url: 'https://notion.so' }
      ],
      wireframes: [],
      customBlocks: [],
      seo: {
        metaTitle: 'Product Case Study | Raj Pandya',
        metaDescription: 'Detailed case study on scaling product funnels and driving metric lift.'
      },
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };
    // Persist immediately so the slug route /projects/new-case-study-... is active without 404
    storageService.saveProject(newProj);
    setProjects(storageService.getProjects());
    setEditingProject(newProj);
    setIsCreatingNew(true);
    setProjectEditorTab('basic');
  };

  const handleSaveProject = () => {
    if (!editingProject) return;
    const saved = storageService.saveProject(editingProject);
    setProjects(storageService.getProjects());
    setEditingProject(null);
    setIsCreatingNew(false);
  };

  const handleDuplicateProject = (id: string) => {
    const dup = storageService.duplicateProject(id);
    if (dup) {
      setProjects(storageService.getProjects());
    }
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === 'project') {
      storageService.deleteProject(itemToDelete.id);
      setProjects(storageService.getProjects());
      if (editingProject?.id === itemToDelete.id) {
        setEditingProject(null);
      }
    } else if (itemToDelete.type === 'media') {
      storageService.deleteMediaAsset(itemToDelete.id);
      setMediaAssets(storageService.getMediaAssets());
    }
    setItemToDelete(null);
  };

  const handleTogglePublish = (id: string) => {
    storageService.togglePublish(id);
    setProjects(storageService.getProjects());
  };

  const handleToggleFeatured = (id: string) => {
    storageService.toggleFeatured(id);
    setProjects(storageService.getProjects());
  };

  const handleReorder = (id: string, direction: 'up' | 'down') => {
    const updated = storageService.reorderProjects(id, direction);
    setProjects(updated);
  };

  // Wireframe handling in editor
  const handleAddWireframe = () => {
    if (!editingProject) return;
    const newWf: WireframeAsset = {
      id: `wf-${Date.now()}`,
      title: 'New Screen Architecture',
      url: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=1000&q=80',
      category: 'wireframe',
      caption: 'Initial low-fidelity user flow wireframe mapping checkout friction points.'
    };
    const current = editingProject.wireframes || [];
    setEditingProject({ ...editingProject, wireframes: [...current, newWf] });
  };

  const handleUpdateWireframe = (id: string, field: keyof WireframeAsset, val: any) => {
    if (!editingProject || !editingProject.wireframes) return;
    const updated = editingProject.wireframes.map(w => w.id === id ? { ...w, [field]: val } : w);
    setEditingProject({ ...editingProject, wireframes: updated });
  };

  const handleDeleteWireframe = (id: string) => {
    if (!editingProject || !editingProject.wireframes) return;
    setEditingProject({
      ...editingProject,
      wireframes: editingProject.wireframes.filter(w => w.id !== id)
    });
  };

  // Prototype links handling
  const handleAddLink = () => {
    if (!editingProject) return;
    const newLink: ProjectLink = {
      id: `link-${Date.now()}`,
      type: 'Figma',
      label: 'Interactive Figma Prototype',
      url: 'https://figma.com'
    };
    setEditingProject({
      ...editingProject,
      links: [...editingProject.links, newLink]
    });
  };

  const handleDeleteLink = (linkId: string) => {
    if (!editingProject) return;
    setEditingProject({
      ...editingProject,
      links: editingProject.links.filter(l => l.id !== linkId)
    });
  };

  const handleUpdateLink = (linkId: string, field: keyof ProjectLink, value: any) => {
    if (!editingProject) return;
    setEditingProject({
      ...editingProject,
      links: editingProject.links.map(l => l.id === linkId ? { ...l, [field]: value } : l)
    });
  };

  // Document and Presentation files handling (PPT, PDF, DOC, TXT)
  const handleAddFile = () => {
    if (!editingProject) return;
    const newFile: ProjectFile = {
      id: `file-${Date.now()}`,
      title: 'Executive Presentation Deck',
      fileName: 'presentation-deck.pptx',
      fileType: 'ppt',
      fileUrl: 'https://docs.google.com/presentation',
      description: 'Multi-slide strategic deck covering product discovery and experimentation metrics.',
      pageCount: 8,
      sortOrder: (editingProject.files?.length || 0) + 1
    };
    setEditingProject({
      ...editingProject,
      files: [...(editingProject.files || []), newFile]
    });
  };

  const handleDeleteFile = (fileId: string) => {
    if (!editingProject || !editingProject.files) return;
    setEditingProject({
      ...editingProject,
      files: editingProject.files.filter(f => f.id !== fileId)
    });
  };

  const handleUpdateFile = (fileId: string, field: keyof ProjectFile, value: any) => {
    if (!editingProject || !editingProject.files) return;
    setEditingProject({
      ...editingProject,
      files: editingProject.files.map(f => f.id === fileId ? { ...f, [field]: value } : f)
    });
  };

  const handleUploadDocumentFile = (fileId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingProject || !editingProject.files) return;

    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    let fileType: ProjectFile['fileType'] = 'pdf';
    if (['ppt', 'pptx'].includes(extension)) fileType = 'ppt';
    else if (['doc', 'docx'].includes(extension)) fileType = 'doc';
    else if (['txt', 'md'].includes(extension)) fileType = 'txt';
    else if (['pdf'].includes(extension)) fileType = 'pdf';

    if (fileType === 'txt') {
      const textReader = new FileReader();
      textReader.onload = (ev) => {
        const textContent = ev.target?.result as string;
        setEditingProject(prev => {
          if (!prev || !prev.files) return prev;
          return {
            ...prev,
            files: prev.files.map(f => f.id === fileId ? {
              ...f,
              fileName: file.name,
              fileType,
              textContent,
              title: f.title || file.name.replace(/\.[^/.]+$/, "")
            } : f)
          };
        });
      };
      textReader.readAsText(file);
    } else {
      const dataReader = new FileReader();
      dataReader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        let detectedPages: number | undefined = undefined;
        if (fileType === 'pdf' && typeof dataUrl === 'string') {
          try {
            // Decode base64 to check PDF page markers
            const base64Data = dataUrl.split(',')[1];
            if (base64Data) {
              const binaryString = atob(base64Data.slice(0, 500000));
              const pageMatches = binaryString.match(/\/Type\s*\/Page(?=[\s\/>])/g);
              if (pageMatches && pageMatches.length > 0) {
                detectedPages = pageMatches.length;
              }
            }
          } catch {
            // Ignore decoding failure
          }
        }

        setEditingProject(prev => {
          if (!prev || !prev.files) return prev;
          return {
            ...prev,
            files: prev.files.map(f => f.id === fileId ? {
              ...f,
              fileName: file.name,
              fileType,
              fileUrl: dataUrl,
              title: f.title || file.name.replace(/\.[^/.]+$/, ""),
              pageCount: detectedPages || f.pageCount || 5
            } : f)
          };
        });
      };
      dataReader.readAsDataURL(file);
    }
  };

  // Metrics in project editor
  const handleAddMetric = () => {
    if (!editingProject) return;
    const newMetrics = [...(editingProject.metrics || []), { label: 'Metric Name', value: '+0%', detail: 'Notes' }];
    setEditingProject({ ...editingProject, metrics: newMetrics });
  };

  const handleDeleteMetric = (index: number) => {
    if (!editingProject || !editingProject.metrics) return;
    const newMetrics = editingProject.metrics.filter((_, idx) => idx !== index);
    setEditingProject({ ...editingProject, metrics: newMetrics });
  };

  const handleUpdateMetric = (index: number, field: string, val: string) => {
    if (!editingProject || !editingProject.metrics) return;
    const newMetrics = [...editingProject.metrics];
    newMetrics[index] = { ...newMetrics[index], [field]: val };
    setEditingProject({ ...editingProject, metrics: newMetrics });
  };

  // Custom Reusable Blocks
  const handleAddCustomBlock = (type: BlockType) => {
    if (!editingProject) return;
    const blockTypesMap: Record<BlockType, { title: string; subtitle: string; content: string }> = {
      rich_text: { title: 'Strategic Analysis', subtitle: 'Deep dive overview', content: 'Document your qualitative findings, methodology, and architectural decisions here...' },
      wireframe_gallery: { title: 'Screen Flow Gallery', subtitle: 'Visual UI architecture', content: 'Key user journey transitions designed to reduce friction.' },
      prototype_embed: { title: 'Interactive Prototype', subtitle: 'Live demonstration', content: 'Explore the full interactive click-through prototype below.' },
      kpi_grid: { title: 'Target Performance Indicators', subtitle: 'Core scorecard', content: 'Tracked over a 90-day testing window post rollout.' },
      comparison: { title: 'Before vs. After Optimization', subtitle: 'Comparative analysis', content: 'Original layout: 3-step checkout with 42% abandonment. Redesigned: 1-click accelerated checkout with 18% abandonment.' },
      persona: { title: 'Target User Profile', subtitle: 'Behavioral archetype', content: 'Mid-market PMs seeking real-time funnel visibility with zero engineering overhead.' },
      problem_solution: { title: 'Problem vs. Delivered Solution', subtitle: 'Core value unlock', content: 'Problem: High drop-off during credential setup.\nSolution: Passwordless magic-link onboarding.' },
      video_walkthrough: { title: 'Product Walkthrough', subtitle: 'Video demonstration', content: 'A complete 3-minute video overview of the end-to-end user workflow.' }
    };
    const defaultData = blockTypesMap[type] || { title: 'Custom Section', subtitle: '', content: '' };
    const newBlock: CustomBlock = {
      id: `block-${Date.now()}`,
      type,
      title: defaultData.title,
      subtitle: defaultData.subtitle,
      content: defaultData.content,
      sortOrder: (editingProject.customBlocks?.length || 0) + 1
    };
    const current = editingProject.customBlocks || [];
    setEditingProject({ ...editingProject, customBlocks: [...current, newBlock] });
  };

  const handleUpdateBlock = (id: string, field: keyof CustomBlock, value: any) => {
    if (!editingProject || !editingProject.customBlocks) return;
    const updated = editingProject.customBlocks.map(b => b.id === id ? { ...b, [field]: value } : b);
    setEditingProject({ ...editingProject, customBlocks: updated });
  };

  const handleDeleteBlock = (id: string) => {
    if (!editingProject || !editingProject.customBlocks) return;
    setEditingProject({
      ...editingProject,
      customBlocks: editingProject.customBlocks.filter(b => b.id !== id)
    });
  };

  // Media Library Upload handler
  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size exceeds 10MB. Please select a smaller file.');
        return;
      }
      setUploadingMedia(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          const newAsset: MediaAsset = {
            id: `media-${Date.now()}`,
            name: file.name,
            url: result,
            type: file.type,
            size: file.size,
            caption: 'Uploaded portfolio deliverable',
            createdAt: new Date().toISOString()
          };
          storageService.saveMediaAsset(newAsset);
          setMediaAssets(storageService.getMediaAssets());
          setUploadingMedia(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Direct cover image upload in project editor
  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingProject) {
      try {
        const compressed = await compressImage(file, 1400, 900, 0.85);
        setEditingProject({ ...editingProject, coverImage: compressed });
      } catch (err) {
        console.warn('Cover image optimization note:', err);
      }
    }
  };

  // Direct wireframe upload in project editor
  const handleWireframeFileUpload = async (wfId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingProject) {
      try {
        const compressed = await compressImage(file, 1200, 900, 0.85);
        handleUpdateWireframe(wfId, 'url', compressed);
      } catch (err) {
        console.warn('Wireframe image optimization note:', err);
      }
    }
  };

  // Direct profile photo upload with automated compression & Firestore sync
  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsOptimizingPhoto(true);
        setPhotoStatusMessage('Optimizing & compressing headshot for lightning-fast web delivery...');
        const optimized = await compressImage(file, 720, 960, 0.78);
        const updated = { ...profile, photoUrl: optimized };
        setProfile(updated);
        // Instantly save to local cache, broadcast across tabs, and sync to Firestore
        storageService.saveProfile(updated);
        setPhotoStatusMessage('✓ Headshot photo saved and updated on live website!');
        setTimeout(() => setPhotoStatusMessage(''), 5000);
      } catch (err: any) {
        setPhotoStatusMessage(`Upload error: ${err.message || 'Could not process photo'}`);
      } finally {
        setIsOptimizingPhoto(false);
      }
    }
  };

  // Save profile
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.saveProfile(profile);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  // Save experience
  const handleSaveExperience = () => {
    storageService.saveExperience(experiences);
    setExpSaved(true);
    setTimeout(() => setExpSaved(false), 3000);
  };

  // Save skills
  const handleSaveSkills = () => {
    storageService.saveSkills(skillsList);
    // Also save page headers in profile
    storageService.saveProfile(profile);
    setSkillsSaved(true);
    setTimeout(() => setSkillsSaved(false), 3000);
  };

  const handleAddSkillToCategory = (catId: string) => {
    const text = newSkillText[catId]?.trim();
    if (!text) return;
    const updated = skillsList.map(cat => {
      if (cat.id === catId) {
        if (cat.skills.includes(text)) return cat;
        return { ...cat, skills: [...cat.skills, text] };
      }
      return cat;
    });
    setSkillsList(updated);
    setNewSkillText({ ...newSkillText, [catId]: '' });
  };

  const handleRemoveSkillFromCategory = (catId: string, skillToRemove: string) => {
    const updated = skillsList.map(cat => {
      if (cat.id === catId) {
        return { ...cat, skills: cat.skills.filter(s => s !== skillToRemove) };
      }
      return cat;
    });
    setSkillsList(updated);
  };

  const handleAddSkillCategory = () => {
    const newCat: SkillCategory = {
      id: `skill-cat-${Date.now()}`,
      name: 'New Competency Category',
      description: 'Frameworks, discovery techniques, and technical methodologies.',
      skills: ['New Tool / Skill']
    };
    setSkillsList([...skillsList, newCat]);
  };

  const handleDeleteSkillCategory = (catId: string) => {
    setSkillsList(skillsList.filter(c => c.id !== catId));
  };

  // Save education
  const handleSaveEducation = () => {
    storageService.saveEducation(educationList);
    setEduSaved(true);
    setTimeout(() => setEduSaved(false), 3000);
  };

  const handleAddEducation = () => {
    const newEdu: EducationItem = {
      id: `edu-${Date.now()}`,
      degree: 'B.Tech / Specialization',
      institution: 'University / Institute Name',
      score: 'First Class / GPA',
      status: 'Completed',
      period: '2020 – 2024',
      details: 'Relevant coursework, product leadership initiatives & distinctions.'
    };
    setEducationList([...educationList, newEdu]);
  };

  const handleDeleteEducation = (id: string) => {
    setEducationList(educationList.filter(e => e.id !== id));
  };

  // Home Page Pillars & Metrics helpers
  const handleAddPillar = () => {
    const newPillar: PillarItem = {
      id: `pillar-${Date.now()}`,
      title: 'New Core Discipline',
      category: 'Product Area',
      description: 'Overview of execution strategy, customer discovery, and engineering delivery.',
      tag: 'Discipline'
    };
    const updatedPillars = [...(profile.pillars || []), newPillar];
    setProfile({ ...profile, pillars: updatedPillars });
  };

  const handleRemovePillar = (id: string) => {
    const updatedPillars = (profile.pillars || []).filter(p => p.id !== id);
    setProfile({ ...profile, pillars: updatedPillars });
  };

  const handleAddProfileMetric = () => {
    const newMetric = { value: '100%', label: 'Key Result', sub: 'Impact Detail' };
    setProfile({ ...profile, metrics: [...(profile.metrics || []), newMetric] });
  };

  const handleRemoveProfileMetric = (index: number) => {
    const updated = [...(profile.metrics || [])];
    updated.splice(index, 1);
    setProfile({ ...profile, metrics: updated });
  };

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const fileUrl = event.target?.result as string;
      const updated = { ...profile, resumeUrl: fileUrl };
      setProfile(updated);
      storageService.saveProfile(updated);
      storageService.saveMediaAsset({
        id: `media-resume-${Date.now()}`,
        name: file.name,
        url: fileUrl,
        type: file.type || 'application/pdf',
        size: file.size,
        createdAt: new Date().toISOString()
      });
      setPhotoStatusMessage('✓ Resume document uploaded & saved successfully!');
      setTimeout(() => setPhotoStatusMessage(''), 4000);
    };
    reader.readAsDataURL(file);
  };

  // Change master passcode
  const handleChangePasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasscode || newPasscode.trim().length < 4) {
      setPasscodeError('Passcode must be at least 4 characters');
      setPasscodeSuccess('');
      return;
    }
    authService.setPasscode(newPasscode.trim());
    setPasscodeSuccess('Passcode updated successfully!');
    setPasscodeError('');
    setNewPasscode('');
    setTimeout(() => setPasscodeSuccess(''), 4000);
  };

  // Export JSON backup
  const handleExportBackup = () => {
    const jsonStr = storageService.exportBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `raj-pandya-portfolio-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupStatus('Backup exported successfully.');
    setTimeout(() => setBackupStatus(''), 4000);
  };

  // Import JSON backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          const success = storageService.importBackup(content);
          if (success) {
            loadData();
            setBackupStatus('Backup restored successfully!');
          } else {
            setBackupStatus('Error: Invalid backup file structure.');
          }
          setTimeout(() => setBackupStatus(''), 4000);
        }
      };
      reader.readAsText(file);
    }
  };

  // Pull cloud sync
  const handleCloudSync = async () => {
    setCloudSyncing(true);
    await storageService.loadFromCloud();
    loadData();
    setCloudSyncing(false);
    alert('Synchronized latest state with Firebase Firestore.');
  };

  // Filtered projects
  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.subtitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // KPI calculations
  const totalProjects = projects.length;
  const publishedCount = projects.filter(p => p.status === 'Published').length;
  const draftCount = projects.filter(p => p.status === 'Draft').length;
  const mediaCount = mediaAssets.length;

  // LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#171A18] text-[#F7F4ED] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-[#1F2421] border border-[#2A2E2C] shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#B08D57]/20 border border-[#B08D57] flex items-center justify-center mx-auto text-[#B08D57]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="font-serif text-2xl font-bold tracking-tight">Portfolio Admin CMS</h1>
            <p className="text-xs text-[#77736B]">
              Secured by Firebase Authentication. Authorized access restricted to portfolio owner.
            </p>
          </div>

          {/* Primary Firebase Google Sign-In */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isAuthLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-[#F7F4ED] text-[#171A18] font-bold text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.87c2.26-2.09 3.675-5.17 3.675-9.15z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.05c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.28v3.15C3.26 21.36 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.28C.46 8.23 0 10.06 0 12s.46 3.77 1.28 5.39l3.99-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.28 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.73-4.96z"
                />
              </svg>
              <span>{isAuthLoading ? 'Authenticating...' : 'Sign In with Google'}</span>
            </button>

            <div className="p-3 rounded-xl bg-[#171A18] border border-[#2A2E2C] text-[11px] text-[#77736B] space-y-1">
              <div className="flex items-center gap-1.5 text-[#EFE9DC] font-semibold">
                <Database className="w-3.5 h-3.5 text-[#B08D57]" />
                <span>Authorized Admin Identity</span>
              </div>
              <p>
                Access clearance verified for: <strong className="text-[#F7F4ED] font-mono">{BOOTSTRAP_ADMIN_EMAIL}</strong>
              </p>
            </div>

            {googleLoginError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <span>{googleLoginError}</span>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-[#2A2E2C]"></div>
            <span className="flex-shrink mx-3 text-[10px] uppercase tracking-widest text-[#77736B]">
              Alternative Access
            </span>
            <div className="flex-grow border-t border-[#2A2E2C]"></div>
          </div>

          {/* Secondary Passcode Option */}
          {!showPasscodeFallback ? (
            <button
              type="button"
              onClick={() => setShowPasscodeFallback(true)}
              className="w-full py-2.5 rounded-xl border border-[#2A2E2C] hover:border-[#B08D57] text-xs text-[#77736B] hover:text-[#F7F4ED] transition-colors flex items-center justify-center gap-2"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Unlock with Admin Passcode</span>
            </button>
          ) : (
            <form onSubmit={handlePasscodeLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#EFE9DC] mb-1.5">
                  Master Passcode
                </label>
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter passcode (default: raj1131)"
                  className="w-full px-4 py-3 rounded-xl bg-[#171A18] border border-[#2A2E2C] text-sm text-[#F7F4ED] placeholder-[#77736B] focus:border-[#B08D57] outline-none transition-colors"
                  autoFocus
                />
                {loginError && (
                  <p className="text-xs text-rose-400 mt-2 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{loginError}</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#B08D57] hover:bg-[#C6A66B] text-[#171A18] font-bold text-xs uppercase tracking-wider transition-colors shadow-md cursor-pointer"
              >
                Authenticate with Passcode
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-[#2A2E2C] text-center">
            <button
              onClick={() => onNavigate('/')}
              className="text-xs text-[#77736B] hover:text-[#F7F4ED] transition-colors"
            >
              ← Return to Public Portfolio
            </button>
          </div>
        </div>
      </div>
    );
  }

  // RENDER DYNAMIC PROJECT EDITOR VIEW
  if (editingProject) {
    return (
      <div className="min-h-screen bg-[#F7F4ED] text-[#171A18]">
        {/* Editor Sticky Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-[#DED8CC] px-4 sm:px-8 py-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setEditingProject(null)}
              className="p-2 rounded-lg border border-[#DED8CC] hover:bg-[#EFE9DC] text-xs font-semibold transition-colors"
            >
              ← Back
            </button>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#B08D57]">
                {isCreatingNew ? 'Create New Project' : 'Editing Case Study'}
              </span>
              <h2 className="font-serif text-lg sm:text-xl font-bold line-clamp-1">
                {editingProject.title || 'Untitled Case Study'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setPreviewProject(editingProject)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#DED8CC] text-xs font-semibold hover:bg-[#EFE9DC] transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>

            <button
              onClick={() => {
                const nextStatus = editingProject.status === 'Published' ? 'Draft' : 'Published';
                setEditingProject({ ...editingProject, status: nextStatus });
              }}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border ${
                editingProject.status === 'Published'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-amber-50 border-amber-300 text-amber-800'
              }`}
            >
              Status: {editingProject.status}
            </button>

            <button
              onClick={handleSaveProject}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#171A18] hover:bg-[#B08D57] text-[#F7F4ED] hover:text-[#171A18] text-xs font-bold uppercase tracking-wider transition-all shadow-md"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save & Publish</span>
            </button>
          </div>
        </header>

        {/* Editor Sub-Navigation Tabs */}
        <div className="bg-[#EFE9DC] border-b border-[#DED8CC] px-4 sm:px-8">
          <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2">
            {[
              { id: 'basic', label: '1. Basic Info & Setup' },
              { id: 'content', label: '2. Case Study Deep-Dive' },
              { id: 'wireframes', label: `3. Wireframes & Visuals (${editingProject.wireframes?.length || 0})` },
              { id: 'documents', label: `4. Documents & Decks (PPT/PDF) (${editingProject.files?.length || 0})` },
              { id: 'links', label: `5. Prototype Links (${editingProject.links.length})` },
              { id: 'metrics', label: `6. KPIs & Impact (${editingProject.metrics?.length || 0})` },
              { id: 'blocks', label: `7. Modular Blocks (${editingProject.customBlocks?.length || 0})` },
              { id: 'seo', label: '8. SEO & Publishing' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setProjectEditorTab(tab.id as ProjectEditorTab)}
                className={`py-2 px-3 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                  projectEditorTab === tab.id
                    ? 'bg-white text-[#171A18] shadow-sm'
                    : 'text-[#77736B] hover:text-[#171A18]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Editor Body */}
        <main className="max-w-6xl mx-auto p-4 sm:p-8 space-y-8">
          
          {/* TAB 1: BASIC INFO */}
          {projectEditorTab === 'basic' && (
            <div className="space-y-6 bg-white p-6 sm:p-8 rounded-2xl border border-[#DED8CC] shadow-sm">
              <h3 className="font-serif text-lg font-bold border-b border-[#DED8CC] pb-3">
                Project Identity & Classification
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    value={editingProject.title}
                    onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                    className="w-full p-3 rounded-xl border border-[#DED8CC] text-sm focus:border-[#B08D57] outline-none"
                    placeholder="e.g. Scaling PropTech Acquisition Funnels"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                    URL Slug (Unique Link) *
                  </label>
                  <input
                    type="text"
                    value={editingProject.slug}
                    onChange={(e) => setEditingProject({ ...editingProject, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                    className="w-full p-3 rounded-xl border border-[#DED8CC] text-sm font-mono focus:border-[#B08D57] outline-none"
                    placeholder="e.g. proptech-growth-funnel"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                  Subtitle / Strategic Hook *
                </label>
                <input
                  type="text"
                  value={editingProject.subtitle}
                  onChange={(e) => setEditingProject({ ...editingProject, subtitle: e.target.value })}
                  className="w-full p-3 rounded-xl border border-[#DED8CC] text-sm focus:border-[#B08D57] outline-none"
                  placeholder="e.g. Reduced Customer Acquisition Cost by 66% through verified WhatsApp qualification"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                  Short Description (Portfolio Card Preview) *
                </label>
                <textarea
                  rows={2}
                  value={editingProject.shortDescription}
                  onChange={(e) => setEditingProject({ ...editingProject, shortDescription: e.target.value })}
                  className="w-full p-3 rounded-xl border border-[#DED8CC] text-sm focus:border-[#B08D57] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                    Category *
                  </label>
                  <select
                    value={editingProject.category}
                    onChange={(e) => setEditingProject({ ...editingProject, category: e.target.value as ProjectCategory })}
                    className="w-full p-3 rounded-xl border border-[#DED8CC] text-sm focus:border-[#B08D57] outline-none bg-white"
                  >
                    <option value="Product">Product</option>
                    <option value="Growth">Growth</option>
                    <option value="AI">AI</option>
                    <option value="Analytics">Analytics</option>
                    <option value="CRM">CRM</option>
                    <option value="Experimentation">Experimentation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                    Your Role
                  </label>
                  <input
                    type="text"
                    value={editingProject.role}
                    onChange={(e) => setEditingProject({ ...editingProject, role: e.target.value })}
                    className="w-full p-3 rounded-xl border border-[#DED8CC] text-sm focus:border-[#B08D57] outline-none"
                    placeholder="e.g. Lead Product Manager"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                    Timeline
                  </label>
                  <input
                    type="text"
                    value={editingProject.timeline}
                    onChange={(e) => setEditingProject({ ...editingProject, timeline: e.target.value })}
                    className="w-full p-3 rounded-xl border border-[#DED8CC] text-sm focus:border-[#B08D57] outline-none"
                    placeholder="e.g. 2025 – 2026"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                    Industry / Sector
                  </label>
                  <input
                    type="text"
                    value={editingProject.industry}
                    onChange={(e) => setEditingProject({ ...editingProject, industry: e.target.value })}
                    className="w-full p-3 rounded-xl border border-[#DED8CC] text-sm focus:border-[#B08D57] outline-none"
                    placeholder="e.g. PropTech & Real Estate"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                    Team & Stakeholders
                  </label>
                  <input
                    type="text"
                    value={editingProject.team || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, team: e.target.value })}
                    className="w-full p-3 rounded-xl border border-[#DED8CC] text-sm focus:border-[#B08D57] outline-none"
                    placeholder="e.g. 4 Engineers, 1 Product Designer, 2 Data Analysts"
                  />
                </div>
              </div>

              {/* Cover Image & Video */}
              <div className="border-t border-[#DED8CC] pt-6 space-y-4">
                <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-[#171A18]">
                  Cover Image & Video Walkthrough
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                      Hero Cover Image URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editingProject.coverImage}
                        onChange={(e) => setEditingProject({ ...editingProject, coverImage: e.target.value })}
                        className="flex-1 p-3 rounded-xl border border-[#DED8CC] text-xs focus:border-[#B08D57] outline-none"
                      />
                      <label className="px-4 py-2 rounded-xl bg-[#EFE9DC] hover:bg-[#DED8CC] border border-[#DED8CC] text-xs font-semibold flex items-center gap-1 cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleCoverImageUpload}
                        />
                      </label>
                    </div>

                    {editingProject.coverImage && (
                      <div className="mt-3 aspect-video rounded-xl overflow-hidden border border-[#DED8CC] bg-[#171A18]">
                        <img
                          src={editingProject.coverImage}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                      Demo Video / Walkthrough URL (YouTube, Loom, MP4)
                    </label>
                    <input
                      type="text"
                      value={editingProject.videoUrl || ''}
                      onChange={(e) => setEditingProject({ ...editingProject, videoUrl: e.target.value })}
                      className="w-full p-3 rounded-xl border border-[#DED8CC] text-xs focus:border-[#B08D57] outline-none"
                      placeholder="e.g. https://www.loom.com/share/xyz or YouTube embed"
                    />
                    <p className="text-[11px] text-[#77736B] mt-1.5">
                      Optional: Adds an interactive video player on the case study reader.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONTENT DEEP DIVE */}
          {projectEditorTab === 'content' && (
            <div className="space-y-6 bg-white p-6 sm:p-8 rounded-2xl border border-[#DED8CC] shadow-sm">
              <div>
                <h3 className="font-serif text-lg font-bold">Comprehensive Case Study Breakdown</h3>
                <p className="text-xs text-[#77736B]">
                  Fill out the structured product framework sections. Leave any optional sections blank if not applicable.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                    1. Executive Overview
                  </label>
                  <textarea
                    rows={4}
                    value={editingProject.overview || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, overview: e.target.value })}
                    className="w-full p-3 rounded-xl border border-[#DED8CC] text-sm focus:border-[#B08D57] outline-none"
                    placeholder="High-level background, business model, and operational context..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                      2. Problem Statement & User Pain Points
                    </label>
                    <textarea
                      rows={5}
                      value={editingProject.problem || ''}
                      onChange={(e) => setEditingProject({ ...editingProject, problem: e.target.value })}
                      className="w-full p-3 rounded-xl border border-[#DED8CC] text-sm focus:border-[#B08D57] outline-none"
                      placeholder="What friction, drop-offs, or revenue leakages were discovered?"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                      3. Objectives & Target KPIs
                    </label>
                    <textarea
                      rows={5}
                      value={editingProject.objectives || ''}
                      onChange={(e) => setEditingProject({ ...editingProject, objectives: e.target.value })}
                      className="w-full p-3 rounded-xl border border-[#DED8CC] text-sm focus:border-[#B08D57] outline-none"
                      placeholder="Specific OKRs, North Star targets, and hypothesis criteria..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                      4. User Research & Insights
                    </label>
                    <textarea
                      rows={5}
                      value={editingProject.userResearch || ''}
                      onChange={(e) => setEditingProject({ ...editingProject, userResearch: e.target.value })}
                      className="w-full p-3 rounded-xl border border-[#DED8CC] text-sm focus:border-[#B08D57] outline-none"
                      placeholder="User interviews, funnel drop-off analytics, survey feedback..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                      5. Target Audience & Personas
                    </label>
                    <textarea
                      rows={5}
                      value={editingProject.targetAudience || ''}
                      onChange={(e) => setEditingProject({ ...editingProject, targetAudience: e.target.value })}
                      className="w-full p-3 rounded-xl border border-[#DED8CC] text-sm focus:border-[#B08D57] outline-none"
                      placeholder="Core user archetypes, behaviors, motivations, and pain triggers..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                      6. Product Strategy & Feature Prioritization
                    </label>
                    <textarea
                      rows={5}
                      value={editingProject.strategy || ''}
                      onChange={(e) => setEditingProject({ ...editingProject, strategy: e.target.value })}
                      className="w-full p-3 rounded-xl border border-[#DED8CC] text-sm focus:border-[#B08D57] outline-none"
                      placeholder="RICE framework scoring, MVP scope vs Phase 2, trade-offs made..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                      7. Solution Architecture & Features
                    </label>
                    <textarea
                      rows={5}
                      value={editingProject.solution || ''}
                      onChange={(e) => setEditingProject({ ...editingProject, solution: e.target.value })}
                      className="w-full p-3 rounded-xl border border-[#DED8CC] text-sm focus:border-[#B08D57] outline-none"
                      placeholder="Detailed feature breakdown, workflows built, and automated pipelines..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                      8. A/B Testing & Experimentation
                    </label>
                    <textarea
                      rows={4}
                      value={editingProject.experimentation || ''}
                      onChange={(e) => setEditingProject({ ...editingProject, experimentation: e.target.value })}
                      className="w-full p-3 rounded-xl border border-[#DED8CC] text-sm focus:border-[#B08D57] outline-none"
                      placeholder="Variants tested, statistical significance, and iterative iterations..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                      9. Business Outcomes & Metric Lift
                    </label>
                    <textarea
                      rows={4}
                      value={editingProject.outcome || ''}
                      onChange={(e) => setEditingProject({ ...editingProject, outcome: e.target.value })}
                      className="w-full p-3 rounded-xl border border-[#DED8CC] text-sm focus:border-[#B08D57] outline-none"
                      placeholder="Revenue generated, CAC decrease, activation lift, or cost savings..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                    10. Key Retrospective Learnings
                  </label>
                  <textarea
                    rows={3}
                    value={editingProject.learnings || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, learnings: e.target.value })}
                    className="w-full p-3 rounded-xl border border-[#DED8CC] text-sm focus:border-[#B08D57] outline-none"
                    placeholder="What would you do differently? Cross-functional alignment takeaways..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: WIREFRAMES & DESIGN ASSETS */}
          {projectEditorTab === 'wireframes' && (
            <div className="space-y-6 bg-white p-6 sm:p-8 rounded-2xl border border-[#DED8CC] shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DED8CC] pb-4">
                <div>
                  <h3 className="font-serif text-lg font-bold">Wireframes, UI Screens & Architecture Diagrams</h3>
                  <p className="text-xs text-[#77736B]">
                    Upload and manage multiple visual deliverables per project. Supports captions and categorization.
                  </p>
                </div>
                <button
                  onClick={handleAddWireframe}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#171A18] text-[#F7F4ED] hover:bg-[#B08D57] text-xs font-semibold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Wireframe / Screen</span>
                </button>
              </div>

              {(!editingProject.wireframes || editingProject.wireframes.length === 0) ? (
                <div className="text-center py-12 border-2 border-dashed border-[#DED8CC] rounded-2xl space-y-3">
                  <ImageIcon className="w-8 h-8 text-[#B08D57] mx-auto opacity-70" />
                  <p className="text-sm font-serif font-bold text-[#171A18]">No Wireframes Attached Yet</p>
                  <p className="text-xs text-[#77736B] max-w-sm mx-auto">
                    Add user flow diagrams, low-fi wireframes, or high-fidelity UI mockups to illustrate your product process.
                  </p>
                  <button
                    onClick={handleAddWireframe}
                    className="px-4 py-2 rounded-xl bg-[#B08D57] text-[#171A18] text-xs font-semibold hover:bg-[#C6A66B]"
                  >
                    + Add First Wireframe
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {editingProject.wireframes.map((wf, idx) => (
                    <div 
                      key={wf.id}
                      className="p-5 rounded-xl border border-[#DED8CC] bg-[#F7F4ED] flex flex-col md:flex-row gap-6 items-start"
                    >
                      {/* Image preview / upload */}
                      <div className="w-full md:w-56 flex-shrink-0 space-y-2">
                        <div className="aspect-[16/10] rounded-lg overflow-hidden border border-[#DED8CC] bg-[#171A18]">
                          <img
                            src={wf.url}
                            alt={wf.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <label className="block w-full py-1.5 px-3 rounded-lg bg-white hover:bg-[#EFE9DC] border border-[#DED8CC] text-center text-xs font-semibold cursor-pointer">
                          <span>Replace File</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleWireframeFileUpload(wf.id, e)}
                          />
                        </label>
                      </div>

                      {/* Fields */}
                      <div className="flex-1 space-y-3 w-full">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#77736B]">
                              Asset Title
                            </label>
                            <input
                              type="text"
                              value={wf.title}
                              onChange={(e) => handleUpdateWireframe(wf.id, 'title', e.target.value)}
                              className="w-full p-2.5 rounded-lg border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#77736B]">
                              Category
                            </label>
                            <select
                              value={wf.category || 'wireframe'}
                              onChange={(e) => handleUpdateWireframe(wf.id, 'category', e.target.value)}
                              className="w-full p-2.5 rounded-lg border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                            >
                              <option value="wireframe">Wireframe</option>
                              <option value="high_fidelity">High-Fidelity UI</option>
                              <option value="user_flow">User Flow</option>
                              <option value="architecture">Architecture</option>
                              <option value="mockup">Product Mockup</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#77736B]">
                            Image URL (or use file upload)
                          </label>
                          <input
                            type="text"
                            value={wf.url}
                            onChange={(e) => handleUpdateWireframe(wf.id, 'url', e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#77736B]">
                            Caption / Context
                          </label>
                          <input
                            type="text"
                            value={wf.caption || ''}
                            onChange={(e) => handleUpdateWireframe(wf.id, 'caption', e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                            placeholder="Explain what user friction this wireframe addresses..."
                          />
                        </div>
                      </div>

                      {/* Remove button */}
                      <button
                        onClick={() => handleDeleteWireframe(wf.id)}
                        className="p-2 rounded-lg hover:bg-rose-100 text-rose-600 transition-colors self-end md:self-start"
                        title="Delete Wireframe"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DOCUMENTS, PRESENTATIONS & PRDS (LINKEDIN STYLE READER) */}
          {projectEditorTab === 'documents' && (
            <div className="space-y-6 bg-white p-6 sm:p-8 rounded-2xl border border-[#DED8CC] shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DED8CC] pb-4">
                <div>
                  <h3 className="font-serif text-lg font-bold">Documents, Slide Decks & PRDs (LinkedIn Style Reader)</h3>
                  <p className="text-xs text-[#77736B]">
                    Attach multi-page presentations (PPT/PPTX), PRD specifications (PDF/DOC), or text documents. Readers can flip through all pages like a LinkedIn carousel directly on the case study.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddFile}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#171A18] text-[#F7F4ED] hover:bg-[#B08D57] text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Document / PPT Deck</span>
                </button>
              </div>

              {(!editingProject.files || editingProject.files.length === 0) ? (
                <div className="p-12 text-center border-2 border-dashed border-[#DED8CC] rounded-xl bg-[#F7F4ED] space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#171A18]/5 text-[#B08D57] mx-auto flex items-center justify-center">
                    <Presentation className="w-6 h-6" />
                  </div>
                  <h4 className="font-serif text-base font-bold text-[#171A18]">
                    No Presentations or Documents Attached Yet
                  </h4>
                  <p className="text-xs text-[#77736B] max-w-md mx-auto">
                    Add your PowerPoint presentation (PPT/PPTX), product requirements document (PRD/PDF), Word doc, or slide deck link. Users will be able to flip through all pages interactively.
                  </p>
                  <button
                    type="button"
                    onClick={handleAddFile}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#171A18] text-[#F7F4ED] hover:bg-[#B08D57] text-xs font-semibold transition-colors cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add First Presentation Deck</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {editingProject.files.map((file, fIdx) => (
                    <div 
                      key={file.id}
                      className="p-5 rounded-2xl border border-[#DED8CC] bg-[#F7F4ED] space-y-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between border-b border-[#DED8CC] pb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#171A18] text-[#F7F4ED] text-[10px] font-bold flex items-center justify-center">
                            {fIdx + 1}
                          </span>
                          <span className="text-xs font-bold text-[#171A18]">
                            {file.title || `Document #${fIdx + 1}`}
                          </span>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#B08D57]/20 text-[#B08D57]">
                            {file.fileType.toUpperCase()}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteFile(file.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                          title="Remove Document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                        <div className="sm:col-span-4">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#77736B] mb-1">
                            Document / Deck Title
                          </label>
                          <input
                            type="text"
                            value={file.title || ''}
                            onChange={(e) => handleUpdateFile(file.id, 'title', e.target.value)}
                            placeholder="e.g. Executive Strategy Presentation Deck"
                            className="w-full p-2.5 rounded-lg border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#77736B] mb-1">
                            Format / Type
                          </label>
                          <select
                            value={file.fileType}
                            onChange={(e) => handleUpdateFile(file.id, 'fileType', e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                          >
                            <option value="ppt">PPT / PowerPoint Presentation</option>
                            <option value="pdf">PDF Slide Deck / Report</option>
                            <option value="doc">DOC / Word Document</option>
                            <option value="txt">TXT / Markdown Spec</option>
                            <option value="slides">Google Slides Embed</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#77736B] mb-1">
                            Slide / Page Count
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={file.pageCount || 5}
                            onChange={(e) => handleUpdateFile(file.id, 'pageCount', parseInt(e.target.value) || 1)}
                            className="w-full p-2.5 rounded-lg border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#77736B] mb-1">
                            Filename (for download)
                          </label>
                          <input
                            type="text"
                            value={file.fileName}
                            onChange={(e) => handleUpdateFile(file.id, 'fileName', e.target.value)}
                            placeholder="strategy_deck.pptx"
                            className="w-full p-2.5 rounded-lg border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                          />
                        </div>

                        <div className="sm:col-span-12 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#77736B]">
                              Document File Source (Upload File or Paste URL)
                            </label>
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Direct File Picker */}
                              <label className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#171A18] text-[#F7F4ED] hover:bg-[#B08D57] hover:text-[#171A18] text-[11px] font-semibold transition-colors cursor-pointer shadow-xs">
                                <Plus className="w-3 h-3" />
                                <span>Upload File (PDF / PPT / DOC / TXT)</span>
                                <input
                                  type="file"
                                  accept=".pdf,.ppt,.pptx,.doc,.docx,.txt,.md"
                                  className="hidden"
                                  onChange={(e) => handleUploadDocumentFile(file.id, e)}
                                />
                              </label>

                              {/* Quick Sample Templates */}
                              <button
                                type="button"
                                onClick={() => {
                                  handleUpdateFile(file.id, 'fileUrl', '/documents/Godrej_Case_Study_PRD.pdf');
                                  handleUpdateFile(file.id, 'fileType', 'pdf');
                                  handleUpdateFile(file.id, 'fileName', 'Godrej_Case_Study_PRD.pdf');
                                  handleUpdateFile(file.id, 'pageCount', 3);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#EFE9DC] border border-[#DED8CC] text-[10px] font-medium text-[#77736B] hover:text-[#171A18]"
                              >
                                Sample Godrej PRD (PDF)
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  handleUpdateFile(file.id, 'fileUrl', '/documents/PulseReel_Architecture_Spec.pdf');
                                  handleUpdateFile(file.id, 'fileType', 'pdf');
                                  handleUpdateFile(file.id, 'fileName', 'PulseReel_Architecture_Spec.pdf');
                                  handleUpdateFile(file.id, 'pageCount', 2);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#EFE9DC] border border-[#DED8CC] text-[10px] font-medium text-[#77736B] hover:text-[#171A18]"
                              >
                                Sample PulseReel Spec (PDF)
                              </button>
                            </div>
                          </div>

                          <input
                            type="text"
                            value={file.fileUrl}
                            onChange={(e) => handleUpdateFile(file.id, 'fileUrl', e.target.value)}
                            placeholder="Paste Google Slides, OneDrive, Google Drive, PDF or direct PPT link (https://...)"
                            className="w-full p-2.5 rounded-lg border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                          />
                          <span className="text-[10px] text-[#77736B] block">
                            Directly upload a local file above or paste a cloud document URL (Google Drive, Dropbox, OneDrive, PDF link).
                          </span>
                        </div>

                        <div className="sm:col-span-12">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#77736B] mb-1">
                            Summary Description
                          </label>
                          <textarea
                            rows={2}
                            value={file.description || ''}
                            onChange={(e) => handleUpdateFile(file.id, 'description', e.target.value)}
                            placeholder="Brief summary of what this presentation or document covers..."
                            className="w-full p-2.5 rounded-lg border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Live Interactive Viewer Preview in Admin */}
                  <div className="pt-4 border-t border-[#DED8CC] space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#171A18] uppercase tracking-wider">
                      <Presentation className="w-4 h-4 text-[#B08D57]" />
                      <span>Live LinkedIn-Style Reader Preview for this Project</span>
                    </div>
                    <DocumentViewer
                      files={editingProject.files}
                      links={editingProject.links}
                      projectTitle={editingProject.title}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: PROTOTYPE & EXTERNAL LINKS */}
          {projectEditorTab === 'links' && (
            <div className="space-y-6 bg-white p-6 sm:p-8 rounded-2xl border border-[#DED8CC] shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DED8CC] pb-4">
                <div>
                  <h3 className="font-serif text-lg font-bold">Interactive Prototype & Deliverable Links</h3>
                  <p className="text-xs text-[#77736B]">
                    Attach Figma prototypes, live websites, PRD documents, presentations, or Loom walkthroughs.
                  </p>
                </div>
                <button
                  onClick={handleAddLink}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#171A18] text-[#F7F4ED] hover:bg-[#B08D57] text-xs font-semibold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Prototype Link</span>
                </button>
              </div>

              <div className="space-y-3">
                {editingProject.links.map((link) => (
                  <div 
                    key={link.id}
                    className="p-4 rounded-xl border border-[#DED8CC] bg-[#F7F4ED] grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                  >
                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#77736B] mb-1">
                        Artifact Type
                      </label>
                      <select
                        value={link.type}
                        onChange={(e) => handleUpdateLink(link.id, 'type', e.target.value as LinkType)}
                        className="w-full p-2.5 rounded-lg border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                      >
                        <option value="Figma">Figma</option>
                        <option value="Prototype">Prototype</option>
                        <option value="Live Website">Live Website</option>
                        <option value="PRD">PRD</option>
                        <option value="PPT">PPT / Slides</option>
                        <option value="PDF">PDF Report</option>
                        <option value="Research">User Research</option>
                        <option value="Notion">Notion</option>
                        <option value="YouTube">YouTube</option>
                        <option value="Loom">Loom Video</option>
                        <option value="GitHub">GitHub</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="sm:col-span-4">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#77736B] mb-1">
                        Display Label
                      </label>
                      <input
                        type="text"
                        value={link.label}
                        onChange={(e) => handleUpdateLink(link.id, 'label', e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                        placeholder="e.g. View Clickable Prototype"
                      />
                    </div>

                    <div className="sm:col-span-4">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#77736B] mb-1">
                        Destination URL
                      </label>
                      <input
                        type="text"
                        value={link.url}
                        onChange={(e) => handleUpdateLink(link.id, 'url', e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                        placeholder="https://..."
                      />
                    </div>

                    <div className="sm:col-span-1 flex justify-end">
                      <button
                        onClick={() => handleDeleteLink(link.id)}
                        className="p-2 rounded-lg hover:bg-rose-100 text-rose-600 transition-colors"
                        title="Remove Link"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: KPIS & IMPACT SCORECARD */}
          {projectEditorTab === 'metrics' && (
            <div className="space-y-6 bg-white p-6 sm:p-8 rounded-2xl border border-[#DED8CC] shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DED8CC] pb-4">
                <div>
                  <h3 className="font-serif text-lg font-bold">Quantitative Impact Metrics</h3>
                  <p className="text-xs text-[#77736B]">
                    Highlighted metric callouts rendered at the top of the case study reader.
                  </p>
                </div>
                <button
                  onClick={handleAddMetric}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#171A18] text-[#F7F4ED] hover:bg-[#B08D57] text-xs font-semibold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add KPI Callout</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(editingProject.metrics || []).map((m, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-[#DED8CC] bg-[#F7F4ED] space-y-3 relative">
                    <button
                      onClick={() => handleDeleteMetric(idx)}
                      className="absolute top-2 right-2 p-1.5 text-rose-500 hover:bg-rose-100 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#77736B]">
                        Metric Lift / Stat
                      </label>
                      <input
                        type="text"
                        value={m.value}
                        onChange={(e) => handleUpdateMetric(idx, 'value', e.target.value)}
                        className="w-full p-2 rounded-lg border border-[#DED8CC] text-sm font-bold bg-white focus:border-[#B08D57] outline-none"
                        placeholder="e.g. +24%"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#77736B]">
                        Metric Label
                      </label>
                      <input
                        type="text"
                        value={m.label}
                        onChange={(e) => handleUpdateMetric(idx, 'label', e.target.value)}
                        className="w-full p-2 rounded-lg border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                        placeholder="e.g. Funnel Conversion"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#77736B]">
                        Verification Detail
                      </label>
                      <input
                        type="text"
                        value={m.detail || ''}
                        onChange={(e) => handleUpdateMetric(idx, 'detail', e.target.value)}
                        className="w-full p-2 rounded-lg border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                        placeholder="e.g. Measured A/B testing cohort"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: MODULAR CONTENT BLOCKS */}
          {projectEditorTab === 'blocks' && (
            <div className="space-y-6 bg-white p-6 sm:p-8 rounded-2xl border border-[#DED8CC] shadow-sm">
              <div className="border-b border-[#DED8CC] pb-4">
                <h3 className="font-serif text-lg font-bold">Reusable Dynamic Content Blocks</h3>
                <p className="text-xs text-[#77736B]">
                  Construct custom sections independently for this project. Rearrange, duplicate, or delete anytime.
                </p>
              </div>

              {/* Add Block Selector */}
              <div className="p-4 rounded-xl bg-[#EFE9DC] border border-[#DED8CC]">
                <span className="block text-xs font-bold uppercase tracking-wider text-[#171A18] mb-3">
                  + Add Content Block:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { type: 'rich_text' as BlockType, label: 'Rich Text / Callout' },
                    { type: 'comparison' as BlockType, label: 'Before & After' },
                    { type: 'persona' as BlockType, label: 'User Persona' },
                    { type: 'problem_solution' as BlockType, label: 'Problem vs Solution' },
                    { type: 'kpi_grid' as BlockType, label: 'KPI Grid' },
                    { type: 'video_walkthrough' as BlockType, label: 'Video Demo' }
                  ].map(b => (
                    <button
                      key={b.type}
                      onClick={() => handleAddCustomBlock(b.type)}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#171A18] hover:text-[#F7F4ED] text-xs font-semibold border border-[#DED8CC] transition-colors shadow-sm"
                    >
                      + {b.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Blocks list */}
              {(!editingProject.customBlocks || editingProject.customBlocks.length === 0) ? (
                <div className="text-center py-8 text-xs text-[#77736B]">
                  No custom modular blocks added yet. Click one of the buttons above to append a block.
                </div>
              ) : (
                <div className="space-y-4">
                  {editingProject.customBlocks.map((block) => (
                    <div 
                      key={block.id}
                      className="p-5 rounded-xl border border-[#DED8CC] bg-[#F7F4ED] space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#B08D57] px-2 py-0.5 rounded bg-[#171A18] text-[#F7F4ED]">
                          {block.type.replace('_', ' ')}
                        </span>
                        <button
                          onClick={() => handleDeleteBlock(block.id)}
                          className="p-1 text-rose-600 hover:bg-rose-100 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#77736B]">
                            Section Title
                          </label>
                          <input
                            type="text"
                            value={block.title}
                            onChange={(e) => handleUpdateBlock(block.id, 'title', e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#77736B]">
                            Section Subtitle
                          </label>
                          <input
                            type="text"
                            value={block.subtitle || ''}
                            onChange={(e) => handleUpdateBlock(block.id, 'subtitle', e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#77736B]">
                          Content Body
                        </label>
                        <textarea
                          rows={4}
                          value={block.content || ''}
                          onChange={(e) => handleUpdateBlock(block.id, 'content', e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 7: SEO & PUBLISHING */}
          {projectEditorTab === 'seo' && (
            <div className="space-y-6 bg-white p-6 sm:p-8 rounded-2xl border border-[#DED8CC] shadow-sm">
              <h3 className="font-serif text-lg font-bold border-b border-[#DED8CC] pb-3">
                SEO, Social Share & Visibility Controls
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                    Meta Page Title
                  </label>
                  <input
                    type="text"
                    value={editingProject.seo?.metaTitle || ''}
                    onChange={(e) => setEditingProject({
                      ...editingProject,
                      seo: { ...(editingProject.seo || {}), metaTitle: e.target.value }
                    })}
                    className="w-full p-3 rounded-xl border border-[#DED8CC] text-xs focus:border-[#B08D57] outline-none"
                    placeholder="e.g. PropTech Funnel Case Study | Raj Pandya"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                    Social Sharing Image (OG Image URL)
                  </label>
                  <input
                    type="text"
                    value={editingProject.seo?.ogImage || ''}
                    onChange={(e) => setEditingProject({
                      ...editingProject,
                      seo: { ...(editingProject.seo || {}), ogImage: e.target.value }
                    })}
                    className="w-full p-3 rounded-xl border border-[#DED8CC] text-xs focus:border-[#B08D57] outline-none"
                    placeholder="URL for LinkedIn & Twitter sharing cards"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                  Meta Description (Search Snippet)
                </label>
                <textarea
                  rows={3}
                  value={editingProject.seo?.metaDescription || ''}
                  onChange={(e) => setEditingProject({
                    ...editingProject,
                    seo: { ...(editingProject.seo || {}), metaDescription: e.target.value }
                  })}
                  className="w-full p-3 rounded-xl border border-[#DED8CC] text-xs focus:border-[#B08D57] outline-none"
                  placeholder="Appears on Google search results and LinkedIn preview cards..."
                />
              </div>

              <div className="pt-4 border-t border-[#DED8CC] flex items-center justify-between">
                <div>
                  <span className="font-serif font-bold text-sm text-[#171A18]">Feature on Homepage Hero</span>
                  <p className="text-xs text-[#77736B]">Display this case study prominently in the top featured grid.</p>
                </div>
                <input
                  type="checkbox"
                  checked={editingProject.featured}
                  onChange={(e) => setEditingProject({ ...editingProject, featured: e.target.checked })}
                  className="w-5 h-5 accent-[#B08D57] cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-6 border-t border-[#DED8CC]">
            <button
              onClick={() => setEditingProject(null)}
              className="px-6 py-2.5 rounded-xl border border-[#DED8CC] text-xs font-semibold hover:bg-[#EFE9DC]"
            >
              Cancel Changes
            </button>

            <button
              onClick={handleSaveProject}
              className="px-8 py-3 rounded-xl bg-[#171A18] hover:bg-[#B08D57] text-[#F7F4ED] hover:text-[#171A18] text-xs font-bold uppercase tracking-wider transition-all shadow-md"
            >
              Save Project Changes
            </button>
          </div>

        </main>
      </div>
    );
  }

  // MAIN ADMIN DASHBOARD
  return (
    <div className="min-h-screen bg-[#F7F4ED] text-[#171A18]">
      
      {/* Top Admin Bar */}
      <header className="bg-[#171A18] text-[#F7F4ED] px-4 sm:px-8 py-4 border-b border-[#2A2E2C]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#B08D57] text-[#171A18] flex items-center justify-center p-1.5 shadow-sm">
              <RpMonogram className="w-full h-full text-[#171A18]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-base tracking-wide">
                  Portfolio Administrator Console
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                  <Database className="w-2.5 h-2.5" />
                  <span>Firestore Cloud Active</span>
                </span>
              </div>
              <span className="text-[11px] text-[#77736B]">
                Raj Pandya Product Portfolio • Authenticated Session
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Authenticated user badge */}
            {currentUser && (
              <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/5 border border-[#2A2E2C]">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Admin'}
                    className="w-6 h-6 rounded-full border border-[#B08D57]"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[#B08D57] text-[#171A18] font-bold text-[10px] flex items-center justify-center">
                    {currentUser.email ? currentUser.email[0].toUpperCase() : 'A'}
                  </div>
                )}
                <div className="text-left">
                  <div className="text-[11px] font-semibold text-[#F7F4ED] leading-none flex items-center gap-1">
                    <span>{currentUser.displayName || currentUser.email}</span>
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  </div>
                  <span className="text-[9px] text-emerald-400 uppercase tracking-wider font-mono">
                    Firebase Verified
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={() => onNavigate('/')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">View Live Website</span>
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-800 text-xs font-semibold transition-colors"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>

            {/* Mobile Sidebar Toggle Button */}
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="lg:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 text-[#F7F4ED] transition-colors"
              title="Toggle sidebar navigation"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        
        {/* STATS SUMMARY SECTION AT THE TOP */}
        <section aria-label="Dashboard Statistics Overview" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Projects Card */}
          <div className="p-5 rounded-2xl bg-white border border-[#DED8CC] shadow-sm flex items-start justify-between transition-all hover:shadow-md">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-[#77736B] font-bold">Total Projects</span>
              <div className="font-serif text-3xl font-bold mt-1 text-[#171A18]">{totalProjects}</div>
              <span className="text-[11px] text-[#77736B]">All case studies in system</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#171A18] text-[#B08D57] flex items-center justify-center flex-shrink-0 shadow-inner">
              <FolderKanban className="w-5 h-5" />
            </div>
          </div>

          {/* Published Projects Total (Target Highlight) */}
          <div className="p-5 rounded-2xl bg-white border border-emerald-300 bg-gradient-to-br from-white via-white to-emerald-50/50 shadow-sm flex items-start justify-between transition-all hover:shadow-md">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] uppercase tracking-wider text-emerald-800 font-bold">Published</span>
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="font-serif text-3xl font-bold mt-1 text-emerald-800">{publishedCount}</div>
              <span className="text-[11px] text-emerald-700 font-medium">Live on public portfolio</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0 border border-emerald-200 shadow-sm">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          {/* Draft Projects Total (Target Highlight) */}
          <div className="p-5 rounded-2xl bg-white border border-amber-300 bg-gradient-to-br from-white via-white to-amber-50/50 shadow-sm flex items-start justify-between transition-all hover:shadow-md">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] uppercase tracking-wider text-amber-800 font-bold">Draft Projects</span>
                <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
              </div>
              <div className="font-serif text-3xl font-bold mt-1 text-amber-800">{draftCount}</div>
              <span className="text-[11px] text-amber-700 font-medium">Work in progress</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0 border border-amber-200 shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
          </div>

          {/* Media Assets Total */}
          <div className="p-5 rounded-2xl bg-white border border-[#DED8CC] shadow-sm flex items-start justify-between transition-all hover:shadow-md">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-[#B08D57] font-bold">Media Library</span>
              <div className="font-serif text-3xl font-bold mt-1 text-[#171A18]">{mediaCount}</div>
              <span className="text-[11px] text-[#77736B]">Mockups, diagrams & assets</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#B08D57]/15 text-[#B08D57] flex items-center justify-center flex-shrink-0 border border-[#B08D57]/30 shadow-sm">
              <ImageIcon className="w-5 h-5" />
            </div>
          </div>
        </section>

        {/* SIDEBAR NAVIGATION + WORKSPACE CONTAINER */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* SIDE NAVIGATION */}
          <aside className={`w-full lg:w-64 flex-shrink-0 space-y-4 ${mobileSidebarOpen ? 'block' : 'hidden lg:block'}`}>
            
            {/* Primary Nav Menu */}
            <div className="bg-white rounded-2xl border border-[#DED8CC] p-3 shadow-sm space-y-1">
              <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#77736B]">
                Dashboard Navigation
              </div>

              {/* 1. Projects */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('projects');
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'projects'
                    ? 'bg-[#171A18] text-[#F7F4ED] shadow-sm'
                    : 'text-[#171A18] hover:bg-[#F7F4ED]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FolderKanban className={`w-4 h-4 ${activeTab === 'projects' ? 'text-[#B08D57]' : 'text-[#77736B]'}`} />
                  <span>Projects</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'projects' ? 'bg-[#B08D57] text-[#171A18]' : 'bg-[#EFE9DC] text-[#77736B]'
                }`}>
                  {totalProjects}
                </span>
              </button>

              {/* 2. Content Sections */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('content');
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'content'
                    ? 'bg-[#171A18] text-[#F7F4ED] shadow-sm'
                    : 'text-[#171A18] hover:bg-[#F7F4ED]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileText className={`w-4 h-4 ${activeTab === 'content' ? 'text-[#B08D57]' : 'text-[#77736B]'}`} />
                  <span>Content Sections</span>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 ${activeTab === 'content' ? 'text-[#B08D57]' : 'text-[#DED8CC]'}`} />
              </button>

              {/* Nested Sub-nav when Content Sections is selected */}
              {activeTab === 'content' && (
                <div className="ml-7 pl-3 border-l-2 border-[#DED8CC] space-y-1 py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setContentSubTab('home');
                      setMobileSidebarOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors flex items-center gap-2 cursor-pointer ${
                      contentSubTab === 'home'
                        ? 'text-[#B08D57] font-bold bg-[#F7F4ED]'
                        : 'text-[#77736B] hover:text-[#171A18]'
                    }`}
                  >
                    <User className="w-3 h-3" />
                    <span>Home Page</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setContentSubTab('skills');
                      setMobileSidebarOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors flex items-center gap-2 cursor-pointer ${
                      contentSubTab === 'skills'
                        ? 'text-[#B08D57] font-bold bg-[#F7F4ED]'
                        : 'text-[#77736B] hover:text-[#171A18]'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Skills & Stack</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setContentSubTab('experience');
                      setMobileSidebarOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors flex items-center gap-2 cursor-pointer ${
                      contentSubTab === 'experience'
                        ? 'text-[#B08D57] font-bold bg-[#F7F4ED]'
                        : 'text-[#77736B] hover:text-[#171A18]'
                    }`}
                  >
                    <Briefcase className="w-3 h-3" />
                    <span>Experience & Edu</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setContentSubTab('projects-page');
                      setMobileSidebarOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors flex items-center gap-2 cursor-pointer ${
                      contentSubTab === 'projects-page'
                        ? 'text-[#B08D57] font-bold bg-[#F7F4ED]'
                        : 'text-[#77736B] hover:text-[#171A18]'
                    }`}
                  >
                    <FolderKanban className="w-3 h-3" />
                    <span>Projects Page Header</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setContentSubTab('contact');
                      setMobileSidebarOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors flex items-center gap-2 cursor-pointer ${
                      contentSubTab === 'contact'
                        ? 'text-[#B08D57] font-bold bg-[#F7F4ED]'
                        : 'text-[#77736B] hover:text-[#171A18]'
                    }`}
                  >
                    <Globe className="w-3 h-3" />
                    <span>Contact & Meta</span>
                  </button>
                </div>
              )}

              {/* 3. Media Library */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('media');
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'media'
                    ? 'bg-[#171A18] text-[#F7F4ED] shadow-sm'
                    : 'text-[#171A18] hover:bg-[#F7F4ED]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <ImageIcon className={`w-4 h-4 ${activeTab === 'media' ? 'text-[#B08D57]' : 'text-[#77736B]'}`} />
                  <span>Media Library</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'media' ? 'bg-[#B08D57] text-[#171A18]' : 'bg-[#EFE9DC] text-[#77736B]'
                }`}>
                  {mediaCount}
                </span>
              </button>

              {/* 4. Settings & Backups */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('settings');
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-[#171A18] text-[#F7F4ED] shadow-sm'
                    : 'text-[#171A18] hover:bg-[#F7F4ED]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Key className={`w-4 h-4 ${activeTab === 'settings' ? 'text-[#B08D57]' : 'text-[#77736B]'}`} />
                  <span>Settings & Cloud</span>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 ${activeTab === 'settings' ? 'text-[#B08D57]' : 'text-[#DED8CC]'}`} />
              </button>
            </div>

            {/* Quick Action Card */}
            <div className="bg-[#171A18] text-[#F7F4ED] rounded-2xl p-4 border border-[#2A2E2C] space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#B08D57]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Quick Actions</span>
              </div>
              <p className="text-[11px] text-[#77736B] leading-relaxed">
                Add a new comprehensive case study or synchronize Firestore state.
              </p>
              <button
                type="button"
                onClick={handleStartNewProject}
                className="w-full py-2.5 px-3 rounded-xl bg-[#B08D57] hover:bg-[#C6A66B] text-[#171A18] font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Case Study</span>
              </button>
              <button
                type="button"
                onClick={handleCloudSync}
                disabled={cloudSyncing}
                className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-[#F7F4ED] text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${cloudSyncing ? 'animate-spin' : ''}`} />
                <span>{cloudSyncing ? 'Syncing...' : 'Sync Firestore'}</span>
              </button>
            </div>

          </aside>

          {/* MAIN WORKSPACE AREA */}
          <main className="flex-1 min-w-0 w-full space-y-6">

        {/* TAB 1: PROJECTS & CASE STUDIES */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            {/* Quick Actions & Filters Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex flex-1 items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-[#77736B] absolute left-3 top-3.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search projects by title, category, tags..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#DED8CC] bg-white text-xs focus:border-[#B08D57] outline-none"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2.5 rounded-xl border border-[#DED8CC] bg-white text-xs font-medium focus:border-[#B08D57] outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="Published">Published Only</option>
                  <option value="Draft">Drafts Only</option>
                </select>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-[#DED8CC] bg-white text-xs font-medium focus:border-[#B08D57] outline-none"
                >
                  <option value="all">All Categories</option>
                  <option value="Product">Product</option>
                  <option value="Growth">Growth</option>
                  <option value="AI">AI</option>
                  <option value="Analytics">Analytics</option>
                </select>
              </div>

              <button
                onClick={handleStartNewProject}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#171A18] hover:bg-[#B08D57] text-[#F7F4ED] hover:text-[#171A18] font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Case Study</span>
              </button>
            </div>

            {/* Project Cards List */}
            <div className="space-y-4">
              {filteredProjects.map((project, index) => (
                <div
                  key={project.id}
                  className="p-5 rounded-2xl bg-white border border-[#DED8CC] shadow-sm hover:border-[#B08D57] transition-all flex flex-col md:flex-row gap-6 items-start md:items-center justify-between"
                >
                  {/* Thumbnail & Basic Info */}
                  <div className="flex items-start gap-4 flex-1">
                    {/* Order buttons */}
                    <div className="flex flex-col gap-1 pr-2 border-r border-[#DED8CC]">
                      <button
                        onClick={() => handleReorder(project.id, 'up')}
                        disabled={index === 0}
                        className="p-1 rounded hover:bg-[#EFE9DC] disabled:opacity-30"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleReorder(project.id, 'down')}
                        disabled={index === filteredProjects.length - 1}
                        className="p-1 rounded hover:bg-[#EFE9DC] disabled:opacity-30"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#171A18] flex-shrink-0 border border-[#DED8CC]">
                      <img
                        src={project.coverImage}
                        alt={project.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#EFE9DC] text-[#171A18] border border-[#DED8CC]">
                          {project.category}
                        </span>
                        
                        <button
                          onClick={() => handleTogglePublish(project.id)}
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded cursor-pointer ${
                            project.status === 'Published'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          {project.status}
                        </button>

                        {project.featured && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                            <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                            <span>Featured</span>
                          </span>
                        )}
                      </div>

                      <h3 className="font-serif font-bold text-base sm:text-lg text-[#171A18]">
                        {project.title}
                      </h3>

                      <p className="text-xs text-[#77736B] line-clamp-1 max-w-xl">
                        {project.subtitle}
                      </p>

                      <div className="flex items-center gap-4 text-[11px] text-[#77736B] pt-1">
                        <span>Slug: /{project.slug}</span>
                        <span>•</span>
                        <span>{project.wireframes?.length || 0} Wireframes</span>
                        <span>•</span>
                        <span>{project.links.length} Links</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Buttons */}
                  <div className="flex items-center gap-2 self-end md:self-center flex-wrap">
                    <button
                      onClick={() => handleToggleFeatured(project.id)}
                      className={`p-2 rounded-lg border transition-colors ${
                        project.featured 
                          ? 'border-amber-400 bg-amber-50 text-amber-600' 
                          : 'border-[#DED8CC] hover:bg-[#EFE9DC] text-[#77736B]'
                      }`}
                      title="Toggle Featured on Homepage"
                    >
                      <Star className={`w-4 h-4 ${project.featured ? 'fill-amber-500' : ''}`} />
                    </button>

                    <button
                      onClick={() => setPreviewProject(project)}
                      className="p-2 rounded-lg border border-[#DED8CC] hover:bg-[#EFE9DC] text-[#77736B] hover:text-[#171A18] transition-colors"
                      title="Preview Case Study"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDuplicateProject(project.id)}
                      className="p-2 rounded-lg border border-[#DED8CC] hover:bg-[#EFE9DC] text-[#77736B] hover:text-[#171A18] transition-colors"
                      title="Duplicate Project"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        setEditingProject(project);
                        setIsCreatingNew(false);
                        setProjectEditorTab('basic');
                      }}
                      className="px-4 py-2 rounded-lg bg-[#171A18] hover:bg-[#B08D57] text-[#F7F4ED] hover:text-[#171A18] text-xs font-semibold transition-colors"
                    >
                      Edit Case Study
                    </button>

                    <button
                      onClick={() => setItemToDelete({ type: 'project', id: project.id, name: project.title })}
                      className="p-2 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete Project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: MEDIA LIBRARY */}
        {activeTab === 'media' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-[#DED8CC] shadow-sm">
              <div>
                <h3 className="font-serif text-lg font-bold">Media Assets & File Vault</h3>
                <p className="text-xs text-[#77736B]">
                  Upload images, wireframe mockups, PDFs, and design docs. Copy URL anytime to use in case studies.
                </p>
              </div>

              <label className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#171A18] hover:bg-[#B08D57] text-[#F7F4ED] hover:text-[#171A18] font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Upload New File</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={handleMediaUpload}
                />
              </label>
            </div>

            {mediaAssets.length === 0 ? (
              <div className="text-center py-16 bg-white border-2 border-dashed border-[#DED8CC] rounded-2xl space-y-3">
                <ImageIcon className="w-10 h-10 text-[#B08D57] mx-auto opacity-70" />
                <h4 className="font-serif font-bold text-base">Media Library is Empty</h4>
                <p className="text-xs text-[#77736B] max-w-sm mx-auto">
                  Click "Upload New File" to add wireframes, case study screenshots, or PDF resumes.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {mediaAssets.map((asset) => (
                  <div 
                    key={asset.id}
                    className="p-4 rounded-xl bg-white border border-[#DED8CC] shadow-sm flex flex-col justify-between space-y-3"
                  >
                    <div className="aspect-[16/10] rounded-lg overflow-hidden bg-[#171A18] border border-[#DED8CC]">
                      {asset.type.includes('image') ? (
                        <img
                          src={asset.url}
                          alt={asset.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-[#B08D57] p-4 text-center">
                          <FileText className="w-8 h-8 mb-1" />
                          <span className="text-[10px] text-white line-clamp-1">{asset.name}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="font-bold text-xs text-[#171A18] line-clamp-1" title={asset.name}>
                        {asset.name}
                      </h4>
                      <span className="text-[10px] text-[#77736B]">
                        {(asset.size / 1024).toFixed(1)} KB • {new Date(asset.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-[#DED8CC]">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(asset.url);
                          setCopiedMediaId(asset.id);
                          setTimeout(() => setCopiedMediaId(null), 2000);
                        }}
                        className="flex-1 py-1.5 px-2 rounded-lg bg-[#EFE9DC] hover:bg-[#DED8CC] text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                      >
                        {copiedMediaId === asset.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy URL</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => setItemToDelete({ type: 'media', id: asset.id, name: asset.name })}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                        title="Delete asset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CONTENT SECTIONS (ALL PORTFOLIO PAGES) */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            {/* Content Sub Navigation */}
            <div className="flex flex-wrap border-b border-[#DED8CC] gap-2 sm:gap-4 bg-white px-4 sm:px-6 pt-4 rounded-t-2xl border-t border-l border-r shadow-xs">
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
                <span>Skills & Stack</span>
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
                <span>Experience & Education</span>
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
                <Mail className="w-4 h-4 text-[#B08D57]" />
                <span>Contact & Resume</span>
              </button>
            </div>

            {/* 1. HOME PAGE EDITOR */}
            {contentSubTab === 'home' && (
              <form onSubmit={handleSaveProfile} className="space-y-8 bg-white p-6 sm:p-8 rounded-b-2xl border border-[#DED8CC] shadow-sm">
                <div className="flex items-center justify-between border-b border-[#DED8CC] pb-4">
                  <div>
                    <h3 className="font-serif text-lg font-bold">Home Page Content & Visuals</h3>
                    <p className="text-xs text-[#77736B]">
                      Customize your hero section, photo, product philosophy quote, About Me narrative, and 4 core disciplines.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#171A18] hover:bg-[#B08D57] text-[#F7F4ED] hover:text-[#171A18] font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
                  >
                    {profileSaved ? 'Saved Live!' : 'Save Home Page'}
                  </button>
                </div>

                {/* Hero Section Copy */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#B08D57]">
                    1. Hero Section Copy
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                        Full Name / Brand Title
                      </label>
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        className="w-full p-3 rounded-xl border border-[#DED8CC] text-sm focus:border-[#B08D57] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                        Eyebrow Category Badge
                      </label>
                      <input
                        type="text"
                        value={profile.eyebrow}
                        onChange={(e) => setProfile({ ...profile, eyebrow: e.target.value })}
                        className="w-full p-3 rounded-xl border border-[#DED8CC] text-sm focus:border-[#B08D57] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                      Main Hero Headline
                    </label>
                    <input
                      type="text"
                      value={profile.headline}
                      onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
                      className="w-full p-3 rounded-xl border border-[#DED8CC] text-sm focus:border-[#B08D57] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                      Hero Subtitle / Short Bio Paragraph
                    </label>
                    <textarea
                      rows={3}
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      className="w-full p-3 rounded-xl border border-[#DED8CC] text-sm focus:border-[#B08D57] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                        Primary CTA Button Text
                      </label>
                      <input
                        type="text"
                        value={profile.primaryCtaText || 'View Projects'}
                        onChange={(e) => setProfile({ ...profile, primaryCtaText: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-[#DED8CC] text-xs focus:border-[#B08D57] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                        Secondary CTA Button Text
                      </label>
                      <input
                        type="text"
                        value={profile.secondaryCtaText || 'Download Resume ↓'}
                        onChange={(e) => setProfile({ ...profile, secondaryCtaText: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-[#DED8CC] text-xs focus:border-[#B08D57] outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Hero Portrait Photo */}
                <div className="space-y-4 pt-4 border-t border-[#DED8CC]">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#B08D57]">
                      2. Editorial Portrait Photo & Floating Tagline
                    </h4>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-medium">
                      Cloud Synced
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <div className="space-y-3">
                      <p className="text-xs text-[#77736B] leading-relaxed">
                        Upload your personal headshot photo. Photos from your phone/camera are automatically optimized and scaled so they never exceed browser storage limits and load in milliseconds on the live site.
                      </p>

                      <div className="space-y-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B]">
                          Photo Image Source (Upload or URL)
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            placeholder="Paste image URL (https://..., Google Drive, Unsplash, Dropbox)"
                            value={profile.photoUrl}
                            onChange={(e) => {
                              const normalized = normalizeImageUrl(e.target.value);
                              const updated = { ...profile, photoUrl: normalized };
                              setProfile(updated);
                              storageService.saveProfile(updated);
                              setPhotoStatusMessage('✓ Photo URL updated and synced live!');
                              setTimeout(() => setPhotoStatusMessage(''), 4000);
                            }}
                            className="flex-1 p-2.5 rounded-xl border border-[#DED8CC] text-xs focus:border-[#B08D57] outline-none"
                          />
                          <label className="px-4 py-2.5 rounded-xl bg-[#171A18] hover:bg-[#B08D57] text-[#F7F4ED] hover:text-[#171A18] text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-sm whitespace-nowrap">
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
                      </div>

                      {photoStatusMessage && (
                        <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span>{photoStatusMessage}</span>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                          Portrait Tagline Overlay Badge
                        </label>
                        <textarea
                          rows={2}
                          value={profile.photoTagline}
                          onChange={(e) => setProfile({ ...profile, photoTagline: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-[#DED8CC] text-xs focus:border-[#B08D57] outline-none"
                        />
                        <span className="text-[10px] text-[#77736B] mt-0.5 block">
                          Text floating over portrait corner (e.g. "Better Products.\nBigger Impact.")
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center p-4 bg-[#171A18] rounded-xl border border-[#2A2E2C]">
                      <div className="relative">
                        <img
                          src={normalizeImageUrl(profile.photoUrl) || '/raj_pandya_headshot.jpg'}
                          alt={profile.name}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/raj_pandya_headshot.jpg';
                          }}
                          className="w-40 aspect-[4/5] object-cover rounded-lg shadow-xl border border-[#B08D57]/60"
                        />
                        <div className="absolute bottom-2 left-2 right-2 p-1.5 rounded bg-black/80 backdrop-blur-xs text-[10px] text-[#F7F4ED] font-medium text-center truncate">
                          Live Homepage Preview
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onNavigate('/')}
                        className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#B08D57] hover:text-[#F7F4ED] transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View on Live Website →</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Product & AI Philosophy Quote */}
                <div className="space-y-4 pt-4 border-t border-[#DED8CC]">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#B08D57]">
                    3. Philosophy Quote Banner
                  </h4>
                  <div className="p-4 rounded-xl bg-[#EFE9DC] border border-[#DED8CC] space-y-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#171A18] mb-1">
                        Quote Statement
                      </label>
                      <textarea
                        rows={2}
                        value={profile.quote || ''}
                        onChange={(e) => setProfile({ ...profile, quote: e.target.value })}
                        className="w-full p-3 rounded-xl border border-[#DED8CC] text-sm bg-white focus:border-[#B08D57] outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                          Author Name
                        </label>
                        <input
                          type="text"
                          value={profile.quoteAuthor || ''}
                          onChange={(e) => setProfile({ ...profile, quoteAuthor: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                          Author Role / Context
                        </label>
                        <input
                          type="text"
                          value={profile.quoteAuthorRole || ''}
                          onChange={(e) => setProfile({ ...profile, quoteAuthorRole: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* About Me Section */}
                <div className="space-y-4 pt-4 border-t border-[#DED8CC]">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#B08D57]">
                    4. About Me Section Copy
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                        About Eyebrow Badge
                      </label>
                      <input
                        type="text"
                        value={profile.aboutEyebrow || 'About Me'}
                        onChange={(e) => setProfile({ ...profile, aboutEyebrow: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-[#DED8CC] text-xs focus:border-[#B08D57] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                        About Main Heading
                      </label>
                      <input
                        type="text"
                        value={profile.aboutHeading || 'Turning Ideas into Meaningful Products'}
                        onChange={(e) => setProfile({ ...profile, aboutHeading: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-[#DED8CC] text-xs focus:border-[#B08D57] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                      Paragraph 1
                    </label>
                    <textarea
                      rows={3}
                      value={profile.aboutParagraph1 || ''}
                      onChange={(e) => setProfile({ ...profile, aboutParagraph1: e.target.value })}
                      className="w-full p-3 rounded-xl border border-[#DED8CC] text-xs focus:border-[#B08D57] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                      Paragraph 2
                    </label>
                    <textarea
                      rows={3}
                      value={profile.aboutParagraph2 || ''}
                      onChange={(e) => setProfile({ ...profile, aboutParagraph2: e.target.value })}
                      className="w-full p-3 rounded-xl border border-[#DED8CC] text-xs focus:border-[#B08D57] outline-none"
                    />
                  </div>
                </div>

                {/* Core Disciplines (Pillars) */}
                <div className="space-y-4 pt-4 border-t border-[#DED8CC]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#B08D57]">
                        5. Core Disciplines / What I Work On
                      </h4>
                      <p className="text-xs text-[#77736B]">
                        These 4 cards appear on your homepage highlighting your primary methodologies.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddPillar}
                      className="px-3 py-1.5 rounded-lg bg-[#EFE9DC] hover:bg-[#DED8CC] text-xs font-semibold text-[#171A18] cursor-pointer"
                    >
                      + Add Discipline
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(profile.pillars || []).map((pillar, pIdx) => (
                      <div key={pillar.id || pIdx} className="p-4 rounded-xl border border-[#DED8CC] bg-[#F7F4ED] space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[#171A18]">Discipline #{pIdx + 1}</span>
                          <button
                            type="button"
                            onClick={() => handleRemovePillar(pillar.id)}
                            className="text-rose-600 hover:text-rose-800 text-xs font-medium cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#77736B] mb-1">
                              Title
                            </label>
                            <input
                              type="text"
                              value={pillar.title}
                              onChange={(e) => {
                                const updated = [...(profile.pillars || [])];
                                updated[pIdx] = { ...updated[pIdx], title: e.target.value };
                                setProfile({ ...profile, pillars: updated });
                              }}
                              className="w-full p-2 rounded-lg border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#77736B] mb-1">
                              Tag Badge
                            </label>
                            <input
                              type="text"
                              value={pillar.tag}
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
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#77736B] mb-1">
                            Description
                          </label>
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

                {/* Key Impact Metrics */}
                <div className="space-y-4 pt-4 border-t border-[#DED8CC]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#B08D57]">
                        6. Key Impact Metrics
                      </h4>
                      <p className="text-xs text-[#77736B]">
                        Highlight metrics shown across your portfolio (e.g., 50+ Projects, 66% CPL Reduction).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddProfileMetric}
                      className="px-3 py-1.5 rounded-lg bg-[#EFE9DC] hover:bg-[#DED8CC] text-xs font-semibold text-[#171A18] cursor-pointer"
                    >
                      + Add Metric
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {(profile.metrics || []).map((m, mIdx) => (
                      <div key={mIdx} className="p-3 rounded-xl border border-[#DED8CC] bg-[#F7F4ED] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-[#77736B]">Metric #{mIdx + 1}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveProfileMetric(mIdx)}
                            className="text-rose-600 hover:text-rose-800 text-[10px] font-medium cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="Value (e.g. 50+)"
                          value={m.value}
                          onChange={(e) => {
                            const updated = [...(profile.metrics || [])];
                            updated[mIdx] = { ...updated[mIdx], value: e.target.value };
                            setProfile({ ...profile, metrics: updated });
                          }}
                          className="w-full p-1.5 rounded border border-[#DED8CC] text-xs font-bold bg-white focus:border-[#B08D57] outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Label (e.g. Projects)"
                          value={m.label}
                          onChange={(e) => {
                            const updated = [...(profile.metrics || [])];
                            updated[mIdx] = { ...updated[mIdx], label: e.target.value };
                            setProfile({ ...profile, metrics: updated });
                          }}
                          className="w-full p-1.5 rounded border border-[#DED8CC] text-[11px] bg-white focus:border-[#B08D57] outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Subtext / Detail"
                          value={m.sub || ''}
                          onChange={(e) => {
                            const updated = [...(profile.metrics || [])];
                            updated[mIdx] = { ...updated[mIdx], sub: e.target.value };
                            setProfile({ ...profile, metrics: updated });
                          }}
                          className="w-full p-1.5 rounded border border-[#DED8CC] text-[10px] text-[#77736B] bg-white focus:border-[#B08D57] outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-right pt-4 border-t border-[#DED8CC]">
                  <button
                    type="submit"
                    className="px-8 py-3 rounded-xl bg-[#171A18] hover:bg-[#B08D57] text-[#F7F4ED] hover:text-[#171A18] font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
                  >
                    {profileSaved ? 'Saved Live!' : 'Save All Home Page Changes'}
                  </button>
                </div>
              </form>
            )}

            {/* 2. SKILLS PAGE EDITOR */}
            {contentSubTab === 'skills' && (
              <div className="space-y-6 bg-white p-6 sm:p-8 rounded-b-2xl border border-[#DED8CC] shadow-sm">
                <div className="flex items-center justify-between border-b border-[#DED8CC] pb-4">
                  <div>
                    <h3 className="font-serif text-lg font-bold">Skills Page Header & Competency Stack</h3>
                    <p className="text-xs text-[#77736B]">
                      Manage all skills, frameworks, tools, and technical categories displayed on the public /skills page.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleAddSkillCategory}
                      className="px-4 py-2.5 rounded-xl bg-[#EFE9DC] hover:bg-[#DED8CC] text-xs font-semibold text-[#171A18] cursor-pointer"
                    >
                      + Add Category
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveSkills}
                      className="px-6 py-2.5 rounded-xl bg-[#171A18] hover:bg-[#B08D57] text-[#F7F4ED] hover:text-[#171A18] font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
                    >
                      {skillsSaved ? 'Saved Live!' : 'Save All Skills'}
                    </button>
                  </div>
                </div>

                {/* Skills Page Header Copy */}
                <div className="p-5 rounded-xl bg-[#F7F4ED] border border-[#DED8CC] space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#B08D57]">
                    Skills Page Header Copy
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                        Eyebrow Badge
                      </label>
                      <input
                        type="text"
                        value={profile.skillsPageEyebrow || 'Competencies & Stack'}
                        onChange={(e) => setProfile({ ...profile, skillsPageEyebrow: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                        Page Title
                      </label>
                      <input
                        type="text"
                        value={profile.skillsPageTitle || 'Skills & Capabilities'}
                        onChange={(e) => setProfile({ ...profile, skillsPageTitle: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                      Header Description
                    </label>
                    <textarea
                      rows={2}
                      value={profile.skillsPageDescription || ''}
                      onChange={(e) => setProfile({ ...profile, skillsPageDescription: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                    />
                  </div>
                </div>

                {/* Skill Categories List */}
                <div className="space-y-6">
                  {skillsList.map((category, catIdx) => (
                    <div key={category.id} className="p-6 rounded-2xl border border-[#DED8CC] bg-[#F7F4ED] space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-[#171A18]">
                          Category #{catIdx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteSkillCategory(category.id)}
                          className="text-rose-600 hover:text-rose-800 text-xs font-semibold cursor-pointer"
                        >
                          Delete Category
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#77736B] mb-1">
                            Category Name
                          </label>
                          <input
                            type="text"
                            value={category.name}
                            onChange={(e) => {
                              const updated = [...skillsList];
                              updated[catIdx] = { ...updated[catIdx], name: e.target.value };
                              setSkillsList(updated);
                            }}
                            className="w-full p-2.5 rounded-xl border border-[#DED8CC] text-xs font-bold bg-white focus:border-[#B08D57] outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#77736B] mb-1">
                            Category Description
                          </label>
                          <input
                            type="text"
                            value={category.description}
                            onChange={(e) => {
                              const updated = [...skillsList];
                              updated[catIdx] = { ...updated[catIdx], description: e.target.value };
                              setSkillsList(updated);
                            }}
                            className="w-full p-2.5 rounded-xl border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                          />
                        </div>
                      </div>

                      {/* Current skills pills */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#77736B] mb-2">
                          Skills, Frameworks & Tools ({category.skills.length})
                        </label>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {category.skills.map((skill, sIdx) => (
                            <span 
                              key={sIdx}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-[#DED8CC] text-xs font-medium text-[#171A18] shadow-xs"
                            >
                              <span>{skill}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveSkillFromCategory(category.id, skill)}
                                className="text-[#77736B] hover:text-rose-600 transition-colors cursor-pointer"
                                title="Remove skill"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>

                        {/* Inline add skill */}
                        <div className="flex gap-2 max-w-md">
                          <input
                            type="text"
                            placeholder="Add a new skill or tool (e.g. Mixpanel, Claude Code)..."
                            value={newSkillText[category.id] || ''}
                            onChange={(e) => setNewSkillText({ ...newSkillText, [category.id]: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddSkillToCategory(category.id);
                              }
                            }}
                            className="flex-1 p-2 rounded-lg border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddSkillToCategory(category.id)}
                            className="px-4 py-2 rounded-lg bg-[#171A18] hover:bg-[#B08D57] text-[#F7F4ED] hover:text-[#171A18] text-xs font-semibold cursor-pointer transition-colors"
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
                    onClick={handleSaveSkills}
                    className="px-8 py-3 rounded-xl bg-[#171A18] hover:bg-[#B08D57] text-[#F7F4ED] hover:text-[#171A18] font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
                  >
                    {skillsSaved ? 'Saved Live!' : 'Save All Skills Changes'}
                  </button>
                </div>
              </div>
            )}

            {/* 3. EXPERIENCE & EDUCATION PAGE EDITOR */}
            {contentSubTab === 'experience' && (
              <div className="space-y-8 bg-white p-6 sm:p-8 rounded-b-2xl border border-[#DED8CC] shadow-sm">
                <div className="flex items-center justify-between border-b border-[#DED8CC] pb-4">
                  <div>
                    <h3 className="font-serif text-lg font-bold">Experience & Education Timeline</h3>
                    <p className="text-xs text-[#77736B]">
                      Manage career positions, impact metrics, linked case studies, and degrees/certifications on /experience.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        const newExp: ExperienceItem = {
                          id: `exp-${Date.now()}`,
                          company: 'New Company',
                          role: 'Product Manager',
                          period: '2026 – Present',
                          location: 'Mumbai, India',
                          responsibilities: ['Led product roadmap, user research, and cross-functional engineering execution.'],
                          impactMetrics: [{ value: '30%', label: 'Metric Lift' }]
                        };
                        setExperiences([newExp, ...experiences]);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-[#EFE9DC] hover:bg-[#DED8CC] text-xs font-semibold text-[#171A18] cursor-pointer"
                    >
                      + Add Position
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveExperience}
                      className="px-6 py-2.5 rounded-xl bg-[#171A18] hover:bg-[#B08D57] text-[#F7F4ED] hover:text-[#171A18] font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
                    >
                      {expSaved ? 'Saved Live!' : 'Save Experience'}
                    </button>
                  </div>
                </div>

                {/* Experience Page Header Copy */}
                <div className="p-5 rounded-xl bg-[#F7F4ED] border border-[#DED8CC] space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#B08D57]">
                    Experience Page Header Copy
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                        Eyebrow Badge
                      </label>
                      <input
                        type="text"
                        value={profile.experiencePageEyebrow || 'Career Record'}
                        onChange={(e) => setProfile({ ...profile, experiencePageEyebrow: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                        Page Title
                      </label>
                      <input
                        type="text"
                        value={profile.experiencePageTitle || 'Experience & Journey'}
                        onChange={(e) => setProfile({ ...profile, experiencePageTitle: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                      Header Description
                    </label>
                    <textarea
                      rows={2}
                      value={profile.experiencePageDescription || ''}
                      onChange={(e) => setProfile({ ...profile, experiencePageDescription: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                    />
                  </div>
                </div>

                {/* Career Positions */}
                <div className="space-y-6">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#B08D57]">
                    Career Positions Timeline ({experiences.length})
                  </h4>

                  {experiences.map((exp, idx) => (
                    <div key={exp.id} className="p-6 rounded-2xl border border-[#DED8CC] bg-[#F7F4ED] space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-[#171A18]">
                          Position #{idx + 1} {exp.company ? `— ${exp.company}` : ''}
                        </span>
                        <div className="flex items-center gap-3">
                          <label className="inline-flex items-center gap-1.5 text-xs text-[#77736B] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={exp.featured || false}
                              onChange={(e) => {
                                const updated = [...experiences];
                                updated[idx] = { ...updated[idx], featured: e.target.checked };
                                setExperiences(updated);
                              }}
                              className="rounded border-[#DED8CC] text-[#B08D57]"
                            />
                            <span>Featured on Homepage</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => setExperiences(experiences.filter(e => e.id !== exp.id))}
                            className="text-rose-600 hover:text-rose-800 text-xs font-semibold cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#77736B] mb-1">
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
                            className="w-full p-2.5 rounded-lg border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#77736B] mb-1">
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
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#77736B] mb-1">
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
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#77736B] mb-1">
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

                      {/* Linked case study slug */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#77736B] mb-1">
                            Linked Project Case Study
                          </label>
                          <select
                            value={exp.caseStudySlug || ''}
                            onChange={(e) => {
                              const updated = [...experiences];
                              updated[idx] = { ...updated[idx], caseStudySlug: e.target.value || undefined };
                              setExperiences(updated);
                            }}
                            className="w-full p-2.5 rounded-lg border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                          >
                            <option value="">None (No link)</option>
                            {projects.map(p => (
                              <option key={p.slug} value={p.slug}>
                                {p.title} (/projects/{p.slug})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#77736B] mb-1">
                            Impact Metrics (Label: Value, comma-separated)
                          </label>
                          <input
                            type="text"
                            placeholder="CPL Reduction: ₹9K → ₹3K, Lead Conversion: 8% → 24%"
                            value={(exp.impactMetrics || []).map(m => `${m.label}: ${m.value}`).join(', ')}
                            onChange={(e) => {
                              const raw = e.target.value;
                              const parsed = raw.split(',').map(s => {
                                const [label, val] = s.split(':').map(x => x?.trim());
                                return label && val ? { label, value: val } : null;
                              }).filter(Boolean) as { label: string; value: string }[];
                              const updated = [...experiences];
                              updated[idx] = { ...updated[idx], impactMetrics: parsed };
                              setExperiences(updated);
                            }}
                            className="w-full p-2.5 rounded-lg border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#77736B] mb-1">
                          Key Responsibilities & Achievements (1 per line)
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

                {/* Education & Certifications Section */}
                <div className="space-y-6 pt-6 border-t border-[#DED8CC]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#B08D57]">
                        Education & Academic Distinctions ({educationList.length})
                      </h4>
                      <p className="text-xs text-[#77736B]">
                        Degrees, universities, scores, and honors displayed in the Education section.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleAddEducation}
                        className="px-3 py-1.5 rounded-lg bg-[#EFE9DC] hover:bg-[#DED8CC] text-xs font-semibold text-[#171A18] cursor-pointer"
                      >
                        + Add Education
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveEducation}
                        className="px-5 py-2 rounded-xl bg-[#171A18] hover:bg-[#B08D57] text-[#F7F4ED] hover:text-[#171A18] font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
                      >
                        {eduSaved ? 'Saved Live!' : 'Save Education'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {educationList.map((edu, eduIdx) => (
                      <div key={edu.id} className="p-5 rounded-xl border border-[#DED8CC] bg-[#F7F4ED] space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[#171A18]">
                            Degree #{eduIdx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteEducation(edu.id)}
                            className="text-rose-600 hover:text-rose-800 text-xs font-medium cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#77736B] mb-1">
                              Degree / Program
                            </label>
                            <input
                              type="text"
                              value={edu.degree}
                              onChange={(e) => {
                                const updated = [...educationList];
                                updated[eduIdx] = { ...updated[eduIdx], degree: e.target.value };
                                setEducationList(updated);
                              }}
                              className="w-full p-2 rounded-lg border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#77736B] mb-1">
                              Institution
                            </label>
                            <input
                              type="text"
                              value={edu.institution}
                              onChange={(e) => {
                                const updated = [...educationList];
                                updated[eduIdx] = { ...updated[eduIdx], institution: e.target.value };
                                setEducationList(updated);
                              }}
                              className="w-full p-2 rounded-lg border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#77736B] mb-1">
                              Period
                            </label>
                            <input
                              type="text"
                              value={edu.period || ''}
                              onChange={(e) => {
                                const updated = [...educationList];
                                updated[eduIdx] = { ...updated[eduIdx], period: e.target.value };
                                setEducationList(updated);
                              }}
                              className="w-full p-2 rounded-lg border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#77736B] mb-1">
                              Score / Grade / Status
                            </label>
                            <input
                              type="text"
                              value={edu.score}
                              onChange={(e) => {
                                const updated = [...educationList];
                                updated[eduIdx] = { ...updated[eduIdx], score: e.target.value };
                                setEducationList(updated);
                              }}
                              className="w-full p-2 rounded-lg border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#77736B] mb-1">
                            Coursework, Distinctions & Specialization Details
                          </label>
                          <textarea
                            rows={2}
                            value={edu.details || ''}
                            onChange={(e) => {
                              const updated = [...educationList];
                              updated[eduIdx] = { ...updated[eduIdx], details: e.target.value };
                              setEducationList(updated);
                            }}
                            className="w-full p-2 rounded-lg border border-[#DED8CC] text-xs bg-white focus:border-[#B08D57] outline-none"
                          />
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
                      storageService.saveProfile(profile);
                    }}
                    className="px-8 py-3 rounded-xl bg-[#171A18] hover:bg-[#B08D57] text-[#F7F4ED] hover:text-[#171A18] font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
                  >
                    {expSaved && eduSaved ? 'Saved Live!' : 'Save Experience & Education'}
                  </button>
                </div>
              </div>
            )}

            {/* 4. PROJECTS PAGE HEADER EDITOR */}
            {contentSubTab === 'projects-page' && (
              <form onSubmit={handleSaveProfile} className="space-y-6 bg-white p-6 sm:p-8 rounded-b-2xl border border-[#DED8CC] shadow-sm">
                <div className="flex items-center justify-between border-b border-[#DED8CC] pb-4">
                  <div>
                    <h3 className="font-serif text-lg font-bold">Projects Page Header & Filter Copy</h3>
                    <p className="text-xs text-[#77736B]">
                      Edit the headline, eyebrow badge, and introductory narrative shown at the top of the /projects case studies directory.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#171A18] hover:bg-[#B08D57] text-[#F7F4ED] hover:text-[#171A18] font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
                  >
                    {profileSaved ? 'Saved Live!' : 'Save Projects Header'}
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                        Eyebrow Category Badge
                      </label>
                      <input
                        type="text"
                        value={profile.projectsPageEyebrow || 'Portfolio Case Studies'}
                        onChange={(e) => setProfile({ ...profile, projectsPageEyebrow: e.target.value })}
                        className="w-full p-3 rounded-xl border border-[#DED8CC] text-sm focus:border-[#B08D57] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                        Projects Page Main Title
                      </label>
                      <input
                        type="text"
                        value={profile.projectsPageTitle || 'Featured Work & Case Studies'}
                        onChange={(e) => setProfile({ ...profile, projectsPageTitle: e.target.value })}
                        className="w-full p-3 rounded-xl border border-[#DED8CC] text-sm focus:border-[#B08D57] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                      Projects Page Description Paragraph
                    </label>
                    <textarea
                      rows={3}
                      value={profile.projectsPageDescription || ''}
                      onChange={(e) => setProfile({ ...profile, projectsPageDescription: e.target.value })}
                      className="w-full p-3 rounded-xl border border-[#DED8CC] text-sm focus:border-[#B08D57] outline-none"
                    />
                  </div>
                </div>

                {/* Quick link banner to edit case study projects */}
                <div className="p-5 rounded-xl bg-[#EFE9DC] border border-[#DED8CC] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="font-bold text-xs text-[#171A18] uppercase tracking-wider">
                      Need to edit individual case studies, images, and wireframes?
                    </h4>
                    <p className="text-xs text-[#77736B]">
                      Switch to the "Projects" tab in the left sidebar to add, modify, or publish detailed product case studies.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('projects')}
                    className="px-4 py-2 rounded-xl bg-[#171A18] hover:bg-[#B08D57] text-[#F7F4ED] hover:text-[#171A18] text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors"
                  >
                    Open Projects Editor →
                  </button>
                </div>

                <div className="text-right pt-4 border-t border-[#DED8CC]">
                  <button
                    type="submit"
                    className="px-8 py-3 rounded-xl bg-[#171A18] hover:bg-[#B08D57] text-[#F7F4ED] hover:text-[#171A18] font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
                  >
                    {profileSaved ? 'Saved Live!' : 'Save Projects Header'}
                  </button>
                </div>
              </form>
            )}

            {/* 5. CONTACT & RESUME EDITOR */}
            {contentSubTab === 'contact' && (
              <form onSubmit={handleSaveProfile} className="space-y-6 bg-white p-6 sm:p-8 rounded-b-2xl border border-[#DED8CC] shadow-sm">
                <div className="flex items-center justify-between border-b border-[#DED8CC] pb-4">
                  <div>
                    <h3 className="font-serif text-lg font-bold">Contact Details, Resume & Availability</h3>
                    <p className="text-xs text-[#77736B]">
                      Update your direct email, LinkedIn profile, geographic location, current hiring availability, and resume download file.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#171A18] hover:bg-[#B08D57] text-[#F7F4ED] hover:text-[#171A18] font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
                  >
                    {profileSaved ? 'Saved Live!' : 'Save Contact'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                      Direct Email Address
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="w-full p-3 rounded-xl border border-[#DED8CC] text-sm focus:border-[#B08D57] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                      LinkedIn Profile URL
                    </label>
                    <input
                      type="text"
                      value={profile.linkedin}
                      onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                      className="w-full p-3 rounded-xl border border-[#DED8CC] text-sm focus:border-[#B08D57] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                      Current Location
                    </label>
                    <input
                      type="text"
                      value={profile.location}
                      onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                      className="w-full p-3 rounded-xl border border-[#DED8CC] text-sm focus:border-[#B08D57] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#77736B] mb-1">
                      Availability Status
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Open to Principal & Lead PM roles"
                      value={profile.availabilityStatus || ''}
                      onChange={(e) => setProfile({ ...profile, availabilityStatus: e.target.value })}
                      className="w-full p-3 rounded-xl border border-[#DED8CC] text-sm focus:border-[#B08D57] outline-none"
                    />
                  </div>
                </div>

                {/* Resume Download / Upload */}
                <div className="pt-4 border-t border-[#DED8CC] space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#B08D57]">
                    Resume PDF Document
                  </h4>
                  <p className="text-xs text-[#77736B]">
                    Upload your latest CV/Resume PDF or enter an external document link (Google Drive, Dropbox, Notion). When visitors click "Download Resume", this file will open.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      placeholder="Paste PDF link (https://...)"
                      value={profile.resumeUrl || ''}
                      onChange={(e) => setProfile({ ...profile, resumeUrl: e.target.value })}
                      className="flex-1 p-3 rounded-xl border border-[#DED8CC] text-xs focus:border-[#B08D57] outline-none"
                    />

                    <label className="px-5 py-3 rounded-xl bg-[#171A18] hover:bg-[#B08D57] text-[#F7F4ED] hover:text-[#171A18] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm whitespace-nowrap">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Resume PDF</span>
                      <input
                        type="file"
                        accept="application/pdf,.doc,.docx"
                        className="hidden"
                        onChange={handleResumeUpload}
                      />
                    </label>
                  </div>

                  {profile.resumeUrl && (
                    <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span className="truncate flex-1 font-medium">Active Resume: {profile.resumeUrl}</span>
                      <a 
                        href={profile.resumeUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-[#B08D57] underline hover:text-[#171A18] font-semibold"
                      >
                        Preview
                      </a>
                    </div>
                  )}
                </div>

                <div className="text-right pt-4 border-t border-[#DED8CC]">
                  <button
                    type="submit"
                    className="px-8 py-3 rounded-xl bg-[#171A18] hover:bg-[#B08D57] text-[#F7F4ED] hover:text-[#171A18] font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
                  >
                    {profileSaved ? 'Saved Live!' : 'Save All Contact Changes'}
                  </button>
                </div>
              </form>
            )}

          </div>
        )}

        {/* TAB 4: SETTINGS & BACKUPS */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Cloud Firestore Status */}
            <div className="p-6 rounded-2xl bg-white border border-[#DED8CC] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-lg font-bold flex items-center gap-2">
                    <Database className="w-5 h-5 text-[#B08D57]" />
                    <span>Firebase Firestore Database Persistence</span>
                  </h3>
                  <p className="text-xs text-[#77736B]">
                    All case studies, profile settings, and media changes are synced to your cloud database.
                  </p>
                </div>
                <button
                  onClick={handleCloudSync}
                  disabled={cloudSyncing}
                  className="px-4 py-2 rounded-xl bg-[#EFE9DC] hover:bg-[#DED8CC] text-xs font-semibold flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${cloudSyncing ? 'animate-spin' : ''}`} />
                  <span>Sync Cloud State</span>
                </button>
              </div>
            </div>

            {/* Change Passcode */}
            <form onSubmit={handleChangePasscode} className="p-6 rounded-2xl bg-white border border-[#DED8CC] shadow-sm space-y-4">
              <h3 className="font-serif text-lg font-bold">Administrator Passcode</h3>
              <p className="text-xs text-[#77736B]">
                Update the master passcode required to open this CMS portal.
              </p>

              <div className="flex gap-3 max-w-md">
                <input
                  type="password"
                  value={newPasscode}
                  onChange={(e) => setNewPasscode(e.target.value)}
                  placeholder="Enter new master passcode"
                  className="flex-1 p-3 rounded-xl border border-[#DED8CC] text-xs focus:border-[#B08D57] outline-none"
                />
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-[#171A18] hover:bg-[#B08D57] text-[#F7F4ED] hover:text-[#171A18] font-bold text-xs uppercase tracking-wider"
                >
                  Update
                </button>
              </div>

              {passcodeSuccess && <p className="text-xs text-emerald-600 font-semibold">{passcodeSuccess}</p>}
              {passcodeError && <p className="text-xs text-rose-600 font-semibold">{passcodeError}</p>}
            </form>

            {/* JSON Export & Restore */}
            <div className="p-6 rounded-2xl bg-white border border-[#DED8CC] shadow-sm space-y-4">
              <h3 className="font-serif text-lg font-bold">Full JSON Data Backup & Restore</h3>
              <p className="text-xs text-[#77736B]">
                Export a full JSON snapshot of your entire portfolio database or restore from a previously exported backup file.
              </p>

              <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleExportBackup}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#171A18] text-[#F7F4ED] hover:bg-[#B08D57] text-xs font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Backup JSON</span>
                </button>

                <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#DED8CC] hover:bg-[#EFE9DC] text-xs font-semibold cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Restore from Backup File</span>
                  <input
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={handleImportBackup}
                  />
                </label>
              </div>

              {backupStatus && <p className="text-xs text-[#B08D57] font-semibold">{backupStatus}</p>}
            </div>
          </div>
        )}

          </main>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-2xl bg-white border border-[#DED8CC] shadow-2xl space-y-4">
            <h3 className="font-serif text-lg font-bold text-rose-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>Confirm Deletion</span>
            </h3>
            <p className="text-xs text-[#77736B] leading-relaxed">
              Are you sure you want to delete <strong className="text-[#171A18]">"{itemToDelete.name}"</strong>? This will permanently remove it from your portfolio database.
            </p>
            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 rounded-xl border border-[#DED8CC] text-xs font-semibold hover:bg-[#EFE9DC]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Preview Modal */}
      {previewProject && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-4xl w-full max-h-[90vh] bg-white rounded-2xl overflow-hidden border border-[#DED8CC] shadow-2xl flex flex-col">
            <div className="p-4 bg-[#171A18] text-[#F7F4ED] flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#B08D57] uppercase font-bold tracking-wider">Preview Mode</span>
                <h3 className="font-serif font-bold text-base">{previewProject.title}</h3>
              </div>
              <button
                onClick={() => setPreviewProject(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#F7F4ED]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div className="aspect-[21/9] rounded-xl overflow-hidden bg-[#171A18]">
                <img
                  src={previewProject.coverImage}
                  alt={previewProject.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <span className="text-xs uppercase tracking-wider text-[#B08D57] font-semibold">
                  {previewProject.category} • {previewProject.industry}
                </span>
                <h2 className="font-serif text-3xl font-bold text-[#171A18] mt-1">
                  {previewProject.title}
                </h2>
                <p className="font-serif italic text-base text-[#77736B] mt-1">
                  {previewProject.subtitle}
                </p>
              </div>

              {previewProject.problem && (
                <div className="p-5 rounded-xl bg-[#F7F4ED] border border-[#DED8CC]">
                  <h4 className="font-serif font-bold text-sm text-[#171A18] mb-1">Problem Statement</h4>
                  <p className="text-xs text-[#77736B] whitespace-pre-line">{previewProject.problem}</p>
                </div>
              )}

              {previewProject.solution && (
                <div className="p-5 rounded-xl bg-[#F7F4ED] border border-[#DED8CC]">
                  <h4 className="font-serif font-bold text-sm text-[#171A18] mb-1">Solution Breakdown</h4>
                  <p className="text-xs text-[#77736B] whitespace-pre-line">{previewProject.solution}</p>
                </div>
              )}

              {previewProject.wireframes && previewProject.wireframes.length > 0 && (
                <div>
                  <h4 className="font-serif font-bold text-sm text-[#171A18] mb-3">Wireframe Gallery Preview</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {previewProject.wireframes.map(w => (
                      <div key={w.id} className="rounded-xl overflow-hidden border border-[#DED8CC]">
                        <img src={w.url} alt={w.title} className="w-full aspect-[16/10] object-cover" />
                        <div className="p-2 bg-[#F7F4ED] text-[11px] font-bold">{w.title}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
