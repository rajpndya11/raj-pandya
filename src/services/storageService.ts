import { Project, ProfileContent, ExperienceItem, EducationItem, MediaAsset, SkillCategory } from '../types';
import { INITIAL_PROJECTS } from '../data/initialProjects';
import { INITIAL_PROFILE } from '../data/initialProfile';
import { INITIAL_EXPERIENCE, INITIAL_EDUCATION } from '../data/initialExperience';
import { SKILL_CATEGORIES } from '../data/skillsData';
import { db, OperationType, handleFirestoreError } from './firebase';
import { collection, doc, setDoc, deleteDoc, getDocs, getDoc } from 'firebase/firestore';

const PROJECTS_KEY = 'rp_portfolio_projects';
const PROFILE_KEY = 'rp_portfolio_profile';
const EXPERIENCE_KEY = 'rp_portfolio_experience';
const EDUCATION_KEY = 'rp_portfolio_education';
const SKILLS_KEY = 'rp_portfolio_skills';
const MEDIA_KEY = 'rp_portfolio_media';
const STORAGE_EVENT = 'rp_portfolio_storage_updated';

// In-memory fallback map if localStorage is restricted
const memoryStore = new Map<string, string>();

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const val = window.localStorage.getItem(key);
        if (val !== null) return val;
      }
    } catch {
      // Storage blocked
    }
    return memoryStore.get(key) || null;
  },

  setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // Storage blocked or quota exceeded
    }
    memoryStore.set(key, value);
  },

  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Ignore
    }
    memoryStore.delete(key);
  }
};

export const storageService = {
  // Listen for storage updates across components
  onUpdate(callback: () => void): () => void {
    if (typeof window === 'undefined') return () => {};
    const handler = () => callback();
    window.addEventListener(STORAGE_EVENT, handler);
    return () => window.removeEventListener(STORAGE_EVENT, handler);
  },

  notify() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(STORAGE_EVENT));
    }
  },

  // Sync state with Firestore in background without blocking local responsiveness
  async syncToFirestore(collectionName: string, id: string, data: any) {
    try {
      if (!db) return;
      const ref = doc(db, collectionName, id);
      await setDoc(ref, data, { merge: true });
    } catch (err) {
      // Log context using standardized handler
      console.warn(`Firestore sync note for ${collectionName}/${id}:`, err);
    }
  },

  async deleteFromFirestore(collectionName: string, id: string) {
    try {
      if (!db) return;
      const ref = doc(db, collectionName, id);
      await deleteDoc(ref);
    } catch (err) {
      console.warn(`Firestore delete note for ${collectionName}/${id}:`, err);
    }
  },

  // Pull initial cloud state if available (Profile, Projects, Experience, Media)
  async loadFromCloud(): Promise<boolean> {
    try {
      if (!db) return false;
      let hasLoadedAny = false;

      // 1. Fetch Profile & Photo
      try {
        const profileSnap = await getDoc(doc(db, 'site_content', 'main_profile'));
        if (profileSnap.exists()) {
          const cloudProfile = profileSnap.data() as ProfileContent;
          if (cloudProfile && cloudProfile.name) {
            safeStorage.setItem(PROFILE_KEY, JSON.stringify(cloudProfile));
            hasLoadedAny = true;
          }
        }
      } catch (profileErr) {
        console.warn('Note: Could not fetch cloud profile', profileErr);
      }

      // 2. Fetch Projects
      try {
        const snapshot = await getDocs(collection(db, 'projects'));
        if (!snapshot.empty) {
          const cloudProjects: Project[] = [];
          snapshot.forEach(docSnap => {
            cloudProjects.push(docSnap.data() as Project);
          });
          if (cloudProjects.length > 0) {
            safeStorage.setItem(PROJECTS_KEY, JSON.stringify(cloudProjects));
            hasLoadedAny = true;
          }
        }
      } catch (projErr) {
        console.warn('Note: Could not fetch cloud projects', projErr);
      }

      // 3. Fetch Experiences
      try {
        const expSnap = await getDocs(collection(db, 'experiences'));
        if (!expSnap.empty) {
          const cloudExp: ExperienceItem[] = [];
          expSnap.forEach(docSnap => {
            cloudExp.push(docSnap.data() as ExperienceItem);
          });
          if (cloudExp.length > 0) {
            safeStorage.setItem(EXPERIENCE_KEY, JSON.stringify(cloudExp));
            hasLoadedAny = true;
          }
        }
      } catch (expErr) {
        console.warn('Note: Could not fetch cloud experiences', expErr);
      }

      // 4. Fetch Skills
      try {
        const skillsSnap = await getDocs(collection(db, 'skills'));
        if (!skillsSnap.empty) {
          const cloudSkills: SkillCategory[] = [];
          skillsSnap.forEach(docSnap => {
            cloudSkills.push(docSnap.data() as SkillCategory);
          });
          if (cloudSkills.length > 0) {
            safeStorage.setItem(SKILLS_KEY, JSON.stringify(cloudSkills));
            hasLoadedAny = true;
          }
        }
      } catch (skillsErr) {
        console.warn('Note: Could not fetch cloud skills', skillsErr);
      }

      // 5. Fetch Education
      try {
        const eduSnap = await getDocs(collection(db, 'education'));
        if (!eduSnap.empty) {
          const cloudEdu: EducationItem[] = [];
          eduSnap.forEach(docSnap => {
            cloudEdu.push(docSnap.data() as EducationItem);
          });
          if (cloudEdu.length > 0) {
            safeStorage.setItem(EDUCATION_KEY, JSON.stringify(cloudEdu));
            hasLoadedAny = true;
          }
        }
      } catch (eduErr) {
        console.warn('Note: Could not fetch cloud education', eduErr);
      }

      // 6. Fetch Media Assets
      try {
        const mediaSnap = await getDocs(collection(db, 'media_assets'));
        if (!mediaSnap.empty) {
          const cloudMedia: MediaAsset[] = [];
          mediaSnap.forEach(docSnap => {
            cloudMedia.push(docSnap.data() as MediaAsset);
          });
          if (cloudMedia.length > 0) {
            safeStorage.setItem(MEDIA_KEY, JSON.stringify(cloudMedia));
            hasLoadedAny = true;
          }
        }
      } catch (mediaErr) {
        console.warn('Note: Could not fetch cloud media', mediaErr);
      }

      if (hasLoadedAny) {
        this.notify();
        return true;
      }
    } catch (e) {
      // Offline or network error
    }
    return false;
  },

  // --- PROJECTS ---
  getProjects(): Project[] {
    try {
      const data = safeStorage.getItem(PROJECTS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        }
      }
    } catch (e) {
      console.warn('Error reading projects from storage, using defaults', e);
    }
    // initialize if empty
    this.saveProjects(INITIAL_PROJECTS);
    return INITIAL_PROJECTS;
  },

  getPublishedProjects(): Project[] {
    const list = this.getProjects();
    const published = list.filter(p => p.status === 'Published');
    return published.length > 0 ? published : list;
  },

  getFeaturedProjects(): Project[] {
    const published = this.getPublishedProjects();
    const featured = published.filter(p => p.featured);
    return featured.length > 0 ? featured : published.slice(0, 4);
  },

  getProjectBySlug(slug: string): Project | undefined {
    return this.getProjects().find(p => p.slug === slug);
  },

  getProjectById(id: string): Project | undefined {
    return this.getProjects().find(p => p.id === id);
  },

  saveProjects(projects: Project[]): void {
    try {
      safeStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    } catch (e) {
      console.warn('Could not persist projects locally', e);
    }
  },

  saveProject(project: Project): Project {
    const projects = this.getProjects();
    const existingIndex = projects.findIndex(p => p.id === project.id);
    const updatedProject: Project = {
      ...project,
      order: project.order ?? existingIndex >= 0 ? existingIndex : projects.length,
      updatedAt: new Date().toISOString().split('T')[0]
    };

    if (existingIndex >= 0) {
      projects[existingIndex] = updatedProject;
    } else {
      updatedProject.createdAt = updatedProject.createdAt || new Date().toISOString().split('T')[0];
      projects.unshift(updatedProject);
    }

    this.saveProjects(projects);
    // Background cloud sync
    this.syncToFirestore('projects', updatedProject.id, updatedProject);
    return updatedProject;
  },

  deleteProject(id: string): void {
    const projects = this.getProjects().filter(p => p.id !== id);
    this.saveProjects(projects);
    this.deleteFromFirestore('projects', id);
  },

  duplicateProject(id: string): Project | null {
    const project = this.getProjectById(id);
    if (!project) return null;

    const newSlug = `${project.slug}-copy-${Date.now().toString().slice(-4)}`;
    const newProject: Project = {
      ...project,
      id: `proj-${Date.now()}`,
      slug: newSlug,
      title: `${project.title} (Copy)`,
      status: 'Draft',
      featured: false,
      order: (project.order ?? 0) + 1,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };

    const projects = this.getProjects();
    projects.unshift(newProject);
    this.saveProjects(projects);
    this.syncToFirestore('projects', newProject.id, newProject);
    return newProject;
  },

  togglePublish(id: string): Project | null {
    const projects = this.getProjects();
    const project = projects.find(p => p.id === id);
    if (!project) return null;

    project.status = project.status === 'Published' ? 'Draft' : 'Published';
    project.updatedAt = new Date().toISOString().split('T')[0];
    this.saveProjects(projects);
    this.syncToFirestore('projects', project.id, project);
    return project;
  },

  toggleFeatured(id: string): Project | null {
    const projects = this.getProjects();
    const project = projects.find(p => p.id === id);
    if (!project) return null;

    project.featured = !project.featured;
    project.updatedAt = new Date().toISOString().split('T')[0];
    this.saveProjects(projects);
    this.syncToFirestore('projects', project.id, project);
    return project;
  },

  reorderProjects(sourceId: string, direction: 'up' | 'down'): Project[] {
    const list = [...this.getProjects()];
    const index = list.findIndex(p => p.id === sourceId);
    if (index < 0) return list;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return list;

    // Swap elements
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    // Update order indexes
    const updated = list.map((p, idx) => ({ ...p, order: idx }));
    this.saveProjects(updated);
    updated.forEach(p => this.syncToFirestore('projects', p.id, p));
    return updated;
  },

  // --- MEDIA ASSETS LIBRARY ---
  getMediaAssets(): MediaAsset[] {
    try {
      const data = safeStorage.getItem(MEDIA_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error reading media assets', e);
    }
    return [];
  },

  saveMediaAsset(asset: MediaAsset): MediaAsset {
    const list = this.getMediaAssets();
    const existingIndex = list.findIndex(a => a.id === asset.id);
    if (existingIndex >= 0) {
      list[existingIndex] = asset;
    } else {
      list.unshift(asset);
    }
    safeStorage.setItem(MEDIA_KEY, JSON.stringify(list));
    this.syncToFirestore('media_assets', asset.id, asset);
    return asset;
  },

  deleteMediaAsset(id: string): void {
    const list = this.getMediaAssets().filter(a => a.id !== id);
    safeStorage.setItem(MEDIA_KEY, JSON.stringify(list));
    this.deleteFromFirestore('media_assets', id);
  },

  // --- PROFILE ---
  getProfile(): ProfileContent {
    try {
      const data = safeStorage.getItem(PROFILE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && parsed.name) {
          // If stored profile still contains the previous Steve Jobs quote, update to new Deep Nishar quote
          if (parsed.quote && (parsed.quote.includes('customer experience and work backwards') || parsed.quote.includes('era of AI'))) {
            parsed.quote = INITIAL_PROFILE.quote;
            parsed.quoteAuthor = INITIAL_PROFILE.quoteAuthor;
            this.saveProfile(parsed);
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading profile from storage, using default', e);
    }
    this.saveProfile(INITIAL_PROFILE);
    return INITIAL_PROFILE;
  },

  saveProfile(profile: ProfileContent): void {
    const updated: ProfileContent = {
      ...profile,
      updatedAt: new Date().toISOString()
    };
    try {
      safeStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not persist profile', e);
    }
    this.syncToFirestore('site_content', 'main_profile', updated);
    this.notify();
  },

  // --- EXPERIENCE ---
  getExperience(): ExperienceItem[] {
    try {
      const data = safeStorage.getItem(EXPERIENCE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading experience from storage, using defaults', e);
    }
    this.saveExperience(INITIAL_EXPERIENCE);
    return INITIAL_EXPERIENCE;
  },

  saveExperience(items: ExperienceItem[]): void {
    try {
      safeStorage.setItem(EXPERIENCE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Could not persist experience', e);
    }
    items.forEach(item => this.syncToFirestore('experiences', item.id, item));
    this.notify();
  },

  // --- EDUCATION ---
  getEducation(): EducationItem[] {
    try {
      const data = safeStorage.getItem(EDUCATION_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading education from storage, using defaults', e);
    }
    this.saveEducation(INITIAL_EDUCATION);
    return INITIAL_EDUCATION;
  },

  saveEducation(items: EducationItem[]): void {
    try {
      safeStorage.setItem(EDUCATION_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Could not persist education', e);
    }
    items.forEach(item => this.syncToFirestore('education', item.id, item));
    this.notify();
  },

  // --- SKILLS & COMPETENCIES ---
  getSkills(): SkillCategory[] {
    try {
      const data = safeStorage.getItem(SKILLS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading skills from storage, using defaults', e);
    }
    this.saveSkills(SKILL_CATEGORIES);
    return SKILL_CATEGORIES;
  },

  saveSkills(categories: SkillCategory[]): void {
    try {
      safeStorage.setItem(SKILLS_KEY, JSON.stringify(categories));
    } catch (e) {
      console.warn('Could not persist skills locally', e);
    }
    categories.forEach(cat => this.syncToFirestore('skills', cat.id, cat));
    this.notify();
  },

  // --- FULL BACKUP & RESTORE ---
  exportBackup(): string {
    const backup = {
      projects: this.getProjects(),
      profile: this.getProfile(),
      experience: this.getExperience(),
      education: this.getEducation(),
      skills: this.getSkills(),
      media: this.getMediaAssets(),
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(backup, null, 2);
  },

  importBackup(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.projects && Array.isArray(parsed.projects)) {
        this.saveProjects(parsed.projects);
      }
      if (parsed.profile) {
        this.saveProfile(parsed.profile);
      }
      if (parsed.experience && Array.isArray(parsed.experience)) {
        this.saveExperience(parsed.experience);
      }
      if (parsed.education && Array.isArray(parsed.education)) {
        this.saveEducation(parsed.education);
      }
      if (parsed.skills && Array.isArray(parsed.skills)) {
        this.saveSkills(parsed.skills);
      }
      if (parsed.media && Array.isArray(parsed.media)) {
        safeStorage.setItem(MEDIA_KEY, JSON.stringify(parsed.media));
      }
      this.notify();
      return true;
    } catch (e) {
      console.error('Invalid backup file', e);
      return false;
    }
  },

  resetAllDefaults(): void {
    safeStorage.removeItem(PROJECTS_KEY);
    safeStorage.removeItem(PROFILE_KEY);
    safeStorage.removeItem(EXPERIENCE_KEY);
    safeStorage.removeItem(EDUCATION_KEY);
    safeStorage.removeItem(SKILLS_KEY);
    safeStorage.removeItem(MEDIA_KEY);
    this.saveProjects(INITIAL_PROJECTS);
    this.saveProfile(INITIAL_PROFILE);
    this.saveExperience(INITIAL_EXPERIENCE);
    this.saveEducation(INITIAL_EDUCATION);
    this.saveSkills(SKILL_CATEGORIES);
    this.notify();
  }
};
