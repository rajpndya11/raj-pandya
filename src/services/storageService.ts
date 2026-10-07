import { Project, ProfileContent, ExperienceItem, EducationItem, MediaAsset, SkillCategory } from '../types';
import { INITIAL_PROJECTS } from '../data/initialProjects';
import { INITIAL_PROFILE } from '../data/initialProfile';
import { INITIAL_EXPERIENCE, INITIAL_EDUCATION } from '../data/initialExperience';
import { SKILL_CATEGORIES } from '../data/skillsData';
import { db, OperationType, handleFirestoreError } from './firebase';
import { collection, doc, setDoc, deleteDoc, getDocs, getDoc, onSnapshot } from 'firebase/firestore';
import { apiService } from './apiService';

const PROJECTS_KEY = 'rp_portfolio_projects';
const PROFILE_KEY = 'rp_portfolio_profile';
const EXPERIENCE_KEY = 'rp_portfolio_experience';
const EDUCATION_KEY = 'rp_portfolio_education';
const SKILLS_KEY = 'rp_portfolio_skills';
const MEDIA_KEY = 'rp_portfolio_media';
const STORAGE_EVENT = 'rp_portfolio_storage_updated';

// Cross-tab broadcast channel for instantaneous sync across all open tabs
const broadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('rp_portfolio_sync_channel')
  : null;

// In-memory fallback map if localStorage is restricted
const memoryFallbackMap = new Map<string, string>();

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
    return memoryFallbackMap.get(key) || null;
  },

  setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn('Storage setItem quota note:', e);
    }
    memoryFallbackMap.set(key, value);
  },

  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Ignore
    }
    memoryFallbackMap.delete(key);
  }
};

class StorageService {
  // Authoritative in-memory state loaded from Firestore
  private memoryProjects: Project[] | null = null;
  private memoryProfile: ProfileContent | null = null;
  private memoryExperience: ExperienceItem[] | null = null;
  private memoryEducation: EducationItem[] | null = null;
  private memorySkills: SkillCategory[] | null = null;
  private memoryMedia: MediaAsset[] | null = null;
  private cloudLoaded: boolean = false;
  private cloudError: string | null = null;
  private isSyncing: boolean = false;

  // Listen for storage updates across components, tabs, and focus changes
  onUpdate(callback: () => void): () => void {
    if (typeof window === 'undefined') return () => {};
    const handler = () => callback();

    // 1. Same-tab custom event
    window.addEventListener(STORAGE_EVENT, handler);

    // 2. Native localStorage cross-tab change event
    window.addEventListener('storage', handler);

    // 3. Tab visibility & window focus
    const focusHandler = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        callback();
      }
    };
    window.addEventListener('focus', handler);
    document.addEventListener('visibilitychange', focusHandler);

    // 4. Cross-tab BroadcastChannel
    const bcHandler = () => callback();
    broadcastChannel?.addEventListener('message', bcHandler);

    return () => {
      window.removeEventListener(STORAGE_EVENT, handler);
      window.removeEventListener('storage', handler);
      window.removeEventListener('focus', handler);
      document.removeEventListener('visibilitychange', focusHandler);
      broadcastChannel?.removeEventListener('message', bcHandler);
    };
  }

  notify() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(STORAGE_EVENT));
      try {
        broadcastChannel?.postMessage({ type: 'SYNC_UPDATE', time: Date.now() });
      } catch {
        // BroadcastChannel notification ignored
      }
    }
  }

  isCloudLoaded(): boolean {
    return this.cloudLoaded;
  }

  getCloudError(): string | null {
    return this.cloudError;
  }

  // Sanitize data recursively to remove undefined values that Firestore rejects
  cleanPayload(data: any): any {
    if (data === null || data === undefined) return null;
    if (typeof data !== 'object') return data;
    if (Array.isArray(data)) {
      return data.map(item => this.cleanPayload(item)).filter(item => item !== undefined);
    }
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleaned[key] = this.cleanPayload(value);
      }
    }
    return cleaned;
  }

  // ========================================================
  // REAL-TIME FIRESTORE SUBSCRIPTIONS
  // Connects directly to Firestore collections and documents.
  // ========================================================
  initRealtimeCloudSync(): () => void {
    if (!db || typeof window === 'undefined') return () => {};

    const unsubs: (() => void)[] = [];

    try {
      console.log('[Firestore] Initializing real-time listeners');

      // 1. Profile real-time listener (site_content/main_profile)
      const unsubProfile = onSnapshot(doc(db, 'site_content', 'main_profile'), (docSnap) => {
        if (docSnap.exists()) {
          const cloudProfile = docSnap.data() as ProfileContent;
          if (cloudProfile && cloudProfile.name) {
            this.memoryProfile = cloudProfile;
            safeStorage.setItem(PROFILE_KEY, JSON.stringify(cloudProfile));
            this.cloudLoaded = true;
            this.cloudError = null;
            console.log('[Firestore] Listener updated: profile');
            this.notify();
          }
        }
      }, (err) => {
        console.warn('[Firestore] Profile listener error:', err);
        this.cloudError = 'Profile sync issue: ' + err.message;
      });
      unsubs.push(unsubProfile);

      // 2. Projects real-time listener (projects)
      const unsubProjects = onSnapshot(collection(db, 'projects'), (snap) => {
        const list: Project[] = [];
        snap.forEach(d => {
          const data = d.data() as Project;
          if (data && data.id) {
            list.push(data);
          }
        });
        const sorted = list.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
        this.memoryProjects = sorted;
        safeStorage.setItem(PROJECTS_KEY, JSON.stringify(sorted));
        this.cloudLoaded = true;
        this.cloudError = null;
        console.log(`[Firestore] Listener updated: projects (${sorted.length} projects)`);
        this.notify();
      }, (err) => {
        console.warn('[Firestore] Projects listener error:', err);
        this.cloudError = 'Projects sync issue: ' + err.message;
      });
      unsubs.push(unsubProjects);

      // 3. Experiences real-time listener (experiences)
      const unsubExp = onSnapshot(collection(db, 'experiences'), (snap) => {
        const list: ExperienceItem[] = [];
        snap.forEach(d => list.push(d.data() as ExperienceItem));
        this.memoryExperience = list;
        safeStorage.setItem(EXPERIENCE_KEY, JSON.stringify(list));
        this.cloudLoaded = true;
        console.log(`[Firestore] Listener updated: experiences (${list.length} items)`);
        this.notify();
      }, (err) => {
        console.warn('[Firestore] Experiences listener error:', err);
      });
      unsubs.push(unsubExp);

      // 4. Skills real-time listener (skills)
      const unsubSkills = onSnapshot(collection(db, 'skills'), (snap) => {
        const list: SkillCategory[] = [];
        snap.forEach(d => list.push(d.data() as SkillCategory));
        this.memorySkills = list;
        safeStorage.setItem(SKILLS_KEY, JSON.stringify(list));
        this.cloudLoaded = true;
        console.log(`[Firestore] Listener updated: skills (${list.length} categories)`);
        this.notify();
      }, (err) => {
        console.warn('[Firestore] Skills listener error:', err);
      });
      unsubs.push(unsubSkills);

      // 5. Education real-time listener (education)
      const unsubEducation = onSnapshot(collection(db, 'education'), (snap) => {
        const list: EducationItem[] = [];
        snap.forEach(d => list.push(d.data() as EducationItem));
        this.memoryEducation = list;
        safeStorage.setItem(EDUCATION_KEY, JSON.stringify(list));
        this.cloudLoaded = true;
        console.log(`[Firestore] Listener updated: education (${list.length} items)`);
        this.notify();
      }, (err) => {
        console.warn('[Firestore] Education listener error:', err);
      });
      unsubs.push(unsubEducation);

      // 6. Media Assets real-time listener (media_assets)
      const unsubMedia = onSnapshot(collection(db, 'media_assets'), (snap) => {
        const list: MediaAsset[] = [];
        snap.forEach(d => list.push(d.data() as MediaAsset));
        this.memoryMedia = list;
        safeStorage.setItem(MEDIA_KEY, JSON.stringify(list));
        this.cloudLoaded = true;
        console.log(`[Firestore] Listener updated: media (${list.length} assets)`);
        this.notify();
      }, (err) => {
        console.warn('[Firestore] Media listener error:', err);
      });
      unsubs.push(unsubMedia);

      return () => {
        unsubs.forEach(fn => fn());
      };
    } catch (e) {
      console.warn('Could not initialize real-time cloud listener:', e);
      return () => {};
    }
  }

  // Authoritative cloud fetch from Firestore and Backend REST API
  async loadFromCloud(): Promise<boolean> {
    if (this.isSyncing) return this.cloudLoaded;
    this.isSyncing = true;
    console.log('[Firestore] Loading portfolio');

    try {
      let hasLoadedAny = false;

      // 1. Direct Firestore Fetch
      if (db) {
        try {
          // Profile
          const profileSnap = await getDoc(doc(db, 'site_content', 'main_profile'));
          if (profileSnap.exists()) {
            const data = profileSnap.data() as ProfileContent;
            if (data && data.name) {
              this.memoryProfile = data;
              safeStorage.setItem(PROFILE_KEY, JSON.stringify(data));
              hasLoadedAny = true;
            }
          }

          // Projects
          const projSnap = await getDocs(collection(db, 'projects'));
          if (!projSnap.empty) {
            const list: Project[] = [];
            projSnap.forEach(d => list.push(d.data() as Project));
            if (list.length > 0) {
              const sorted = list.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
              this.memoryProjects = sorted;
              safeStorage.setItem(PROJECTS_KEY, JSON.stringify(sorted));
              hasLoadedAny = true;
            }
          }

          // Experiences
          const expSnap = await getDocs(collection(db, 'experiences'));
          if (!expSnap.empty) {
            const list: ExperienceItem[] = [];
            expSnap.forEach(d => list.push(d.data() as ExperienceItem));
            if (list.length > 0) {
              this.memoryExperience = list;
              safeStorage.setItem(EXPERIENCE_KEY, JSON.stringify(list));
              hasLoadedAny = true;
            }
          }

          // Education
          const eduSnap = await getDocs(collection(db, 'education'));
          if (!eduSnap.empty) {
            const list: EducationItem[] = [];
            eduSnap.forEach(d => list.push(d.data() as EducationItem));
            if (list.length > 0) {
              this.memoryEducation = list;
              safeStorage.setItem(EDUCATION_KEY, JSON.stringify(list));
              hasLoadedAny = true;
            }
          }

          // Skills
          const skillsSnap = await getDocs(collection(db, 'skills'));
          if (!skillsSnap.empty) {
            const list: SkillCategory[] = [];
            skillsSnap.forEach(d => list.push(d.data() as SkillCategory));
            if (list.length > 0) {
              this.memorySkills = list;
              safeStorage.setItem(SKILLS_KEY, JSON.stringify(list));
              hasLoadedAny = true;
            }
          }

          // Media
          const mediaSnap = await getDocs(collection(db, 'media_assets'));
          if (!mediaSnap.empty) {
            const list: MediaAsset[] = [];
            mediaSnap.forEach(d => list.push(d.data() as MediaAsset));
            if (list.length > 0) {
              this.memoryMedia = list;
              safeStorage.setItem(MEDIA_KEY, JSON.stringify(list));
              hasLoadedAny = true;
            }
          }
        } catch (fbErr: any) {
          console.warn('Direct Firestore fetch notice:', fbErr);
          this.cloudError = fbErr.message || 'Firestore connection issue';
        }
      }

      // 2. Express Backend REST API Fallback
      if (!hasLoadedAny) {
        try {
          const [apiProfile, apiProjects, apiExperiences, apiSkills, apiEdu, apiMedia] = await Promise.all([
            apiService.getProfile(),
            apiService.getProjects(),
            apiService.getExperiences(),
            apiService.getSkills(),
            apiService.getEducation(),
            apiService.getMedia()
          ]);

          if (apiProfile && apiProfile.name) {
            this.memoryProfile = apiProfile;
            safeStorage.setItem(PROFILE_KEY, JSON.stringify(apiProfile));
            hasLoadedAny = true;
          }
          if (apiProjects && apiProjects.length > 0) {
            const sorted = apiProjects.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
            this.memoryProjects = sorted;
            safeStorage.setItem(PROJECTS_KEY, JSON.stringify(sorted));
            hasLoadedAny = true;
          }
          if (apiExperiences && apiExperiences.length > 0) {
            this.memoryExperience = apiExperiences;
            safeStorage.setItem(EXPERIENCE_KEY, JSON.stringify(apiExperiences));
            hasLoadedAny = true;
          }
          if (apiSkills && apiSkills.length > 0) {
            this.memorySkills = apiSkills;
            safeStorage.setItem(SKILLS_KEY, JSON.stringify(apiSkills));
            hasLoadedAny = true;
          }
          if (apiEdu && apiEdu.length > 0) {
            this.memoryEducation = apiEdu;
            safeStorage.setItem(EDUCATION_KEY, JSON.stringify(apiEdu));
            hasLoadedAny = true;
          }
          if (apiMedia && apiMedia.length > 0) {
            this.memoryMedia = apiMedia;
            safeStorage.setItem(MEDIA_KEY, JSON.stringify(apiMedia));
            hasLoadedAny = true;
          }
        } catch (apiErr) {
          console.warn('Backend REST API sync notice:', apiErr);
        }
      }

      if (hasLoadedAny) {
        this.cloudLoaded = true;
        this.cloudError = null;
        console.log('[Firestore] Portfolio loaded');
        this.notify();
        return true;
      }
    } finally {
      this.isSyncing = false;
    }

    return this.cloudLoaded;
  }

  // ========================================================
  // PROJECTS OPERATIONS (FIRESTORE AUTHORITATIVE)
  // ========================================================
  getProjects(): Project[] {
    // 1. Authoritative in-memory state from Firestore
    if (this.memoryProjects && this.memoryProjects.length > 0) {
      return [...this.memoryProjects].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
    }

    // 2. Secondary local cache fallback
    try {
      const data = safeStorage.getItem(PROJECTS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const sorted = parsed.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
          this.memoryProjects = sorted;
          return sorted;
        }
      }
    } catch (e) {
      console.warn('Error reading projects cache:', e);
    }

    // 3. Fallback to initial seed projects
    return INITIAL_PROJECTS;
  }

  getPublishedProjects(): Project[] {
    const list = this.getProjects();
    const published = list.filter(p => p.status === 'Published');
    return published.length > 0 ? published : list;
  }

  getFeaturedProjects(): Project[] {
    const published = this.getPublishedProjects();
    const featured = published.filter(p => p.featured);
    return featured.length > 0 ? featured : published.slice(0, 4);
  }

  getProjectBySlug(slug: string): Project | undefined {
    if (!slug) return undefined;
    const clean = decodeURIComponent(slug).trim().toLowerCase();
    const projects = this.getProjects();
    return projects.find(p => {
      const pSlug = (p.slug || '').toLowerCase().trim();
      const pId = (p.id || '').toLowerCase().trim();
      return pSlug === clean || pId === clean || (clean.length > 5 && (pSlug.startsWith(clean) || clean.startsWith(pSlug)));
    });
  }

  getProjectById(id: string): Project | undefined {
    return this.getProjects().find(p => p.id === id);
  }

  // Authoritative Firestore save: awaits completion, throws if Firestore fails
  async saveProject(project: Project): Promise<Project> {
    if (!project.id) throw new Error('Missing project ID');
    if (!project.title?.trim()) throw new Error('Project title is required');

    console.log(`[Firestore] Saving project: ${project.id} ("${project.title}")`);

    const projects = [...this.getProjects()];
    const existingIndex = projects.findIndex(p => p.id === project.id);
    const updatedProject: Project = {
      ...project,
      order: typeof project.order === 'number' ? project.order : (existingIndex >= 0 ? existingIndex : projects.length),
      updatedAt: new Date().toISOString().split('T')[0]
    };

    if (existingIndex < 0) {
      updatedProject.createdAt = updatedProject.createdAt || new Date().toISOString().split('T')[0];
    }

    const cleaned = this.cleanPayload(updatedProject);

    // 1. Authoritative write to Firestore
    if (db) {
      try {
        const ref = doc(db, 'projects', updatedProject.id);
        await setDoc(ref, cleaned, { merge: true });
        console.log(`[Firestore] Project saved successfully: ${updatedProject.id}`);
      } catch (err: any) {
        console.error(`[Firestore] Save failed: ${err.message || 'Unknown error'}`);
        throw new Error(`Firestore save failed: ${err.message || 'Unknown error'}`);
      }
    }

    // 2. Mirror to Express Backend REST API
    try {
      await apiService.saveProject(updatedProject);
    } catch (apiErr) {
      console.warn('API saveProject mirror notice:', apiErr);
    }

    // 3. Update memory and local cache
    if (existingIndex >= 0) {
      projects[existingIndex] = updatedProject;
    } else {
      projects.unshift(updatedProject);
    }
    const sorted = projects.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
    this.memoryProjects = sorted;
    safeStorage.setItem(PROJECTS_KEY, JSON.stringify(sorted));
    this.notify();

    return updatedProject;
  }

  // Authoritative Firestore delete
  async deleteProject(id: string): Promise<void> {
    if (!id) throw new Error('Missing project ID for deletion');

    if (db) {
      try {
        const ref = doc(db, 'projects', id);
        await deleteDoc(ref);
      } catch (err: any) {
        console.error('Firestore deleteProject error:', err);
        throw new Error(`Firestore delete failed: ${err.message || 'Unknown error'}`);
      }
    }

    try {
      await apiService.deleteProject(id);
    } catch {}

    const remaining = this.getProjects().filter(p => p.id !== id);
    this.memoryProjects = remaining;
    safeStorage.setItem(PROJECTS_KEY, JSON.stringify(remaining));
    this.notify();
  }

  async duplicateProject(id: string): Promise<Project | null> {
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

    return await this.saveProject(newProject);
  }

  async togglePublish(id: string): Promise<Project | null> {
    const project = this.getProjectById(id);
    if (!project) return null;

    const updated: Project = {
      ...project,
      status: project.status === 'Published' ? 'Draft' : 'Published',
      updatedAt: new Date().toISOString().split('T')[0]
    };

    return await this.saveProject(updated);
  }

  async toggleFeatured(id: string): Promise<Project | null> {
    const project = this.getProjectById(id);
    if (!project) return null;

    const updated: Project = {
      ...project,
      featured: !project.featured,
      updatedAt: new Date().toISOString().split('T')[0]
    };

    return await this.saveProject(updated);
  }

  // Authoritative reorder in Firestore: writes updated orders to Firestore
  async reorderProjects(sourceId: string, direction: 'up' | 'down'): Promise<Project[]> {
    const list = [...this.getProjects()];
    const index = list.findIndex(p => p.id === sourceId);
    if (index < 0) return list;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return list;

    // Swap elements
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    // Reassign sequential order indices
    const updated = list.map((p, idx) => ({ ...p, order: idx }));
    this.memoryProjects = updated;
    safeStorage.setItem(PROJECTS_KEY, JSON.stringify(updated));
    this.notify();

    // Persist all updated orders to Firestore
    if (db) {
      try {
        await Promise.all(
          updated.map(p => setDoc(doc(db, 'projects', p.id), this.cleanPayload(p), { merge: true }))
        );
      } catch (err: any) {
        console.error('Firestore reorderProjects error:', err);
        throw new Error(`Firestore reorder failed: ${err.message || 'Unknown error'}`);
      }
    }

    return updated;
  }

  // ========================================================
  // PROFILE OPERATIONS (FIRESTORE AUTHORITATIVE)
  // ========================================================
  getProfile(): ProfileContent {
    if (this.memoryProfile && this.memoryProfile.name) {
      return this.memoryProfile;
    }

    try {
      const data = safeStorage.getItem(PROFILE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && parsed.name) {
          this.memoryProfile = parsed;
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading profile cache:', e);
    }

    return INITIAL_PROFILE;
  }

  async saveProfile(profile: ProfileContent): Promise<void> {
    if (!profile.name?.trim()) throw new Error('Profile name is required');

    const updated: ProfileContent = {
      ...profile,
      photoUrl: profile.photoUrl ? profile.photoUrl.trim() : INITIAL_PROFILE.photoUrl,
      updatedAt: new Date().toISOString()
    };

    const cleaned = this.cleanPayload(updated);

    // 1. Authoritative write to Firestore
    if (db) {
      try {
        const ref = doc(db, 'site_content', 'main_profile');
        await setDoc(ref, cleaned, { merge: true });
      } catch (err: any) {
        console.error('Firestore saveProfile error:', err);
        throw new Error(`Firestore profile save failed: ${err.message || 'Unknown error'}`);
      }
    }

    // 2. Mirror to Express REST API
    try {
      await apiService.updateProfile(updated);
    } catch (e) {
      console.warn('API updateProfile mirror notice:', e);
    }

    // 3. Update memory and local cache
    this.memoryProfile = updated;
    safeStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
    this.notify();
  }

  // ========================================================
  // EXPERIENCE OPERATIONS (FIRESTORE AUTHORITATIVE)
  // ========================================================
  getExperience(): ExperienceItem[] {
    if (this.memoryExperience && this.memoryExperience.length > 0) {
      return this.memoryExperience;
    }

    try {
      const data = safeStorage.getItem(EXPERIENCE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.memoryExperience = parsed;
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading experience cache:', e);
    }

    return INITIAL_EXPERIENCE;
  }

  async saveExperience(items: ExperienceItem[]): Promise<void> {
    if (db) {
      try {
        await Promise.all(
          items.map(item => setDoc(doc(db, 'experiences', item.id), this.cleanPayload(item), { merge: true }))
        );
      } catch (err: any) {
        console.error('Firestore saveExperience error:', err);
        throw new Error(`Firestore experience save failed: ${err.message || 'Unknown error'}`);
      }
    }

    try {
      await apiService.updateExperiences(items);
    } catch {}

    this.memoryExperience = items;
    safeStorage.setItem(EXPERIENCE_KEY, JSON.stringify(items));
    this.notify();
  }

  // ========================================================
  // EDUCATION OPERATIONS (FIRESTORE AUTHORITATIVE)
  // ========================================================
  getEducation(): EducationItem[] {
    if (this.memoryEducation && this.memoryEducation.length > 0) {
      return this.memoryEducation;
    }

    try {
      const data = safeStorage.getItem(EDUCATION_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.memoryEducation = parsed;
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading education cache:', e);
    }

    return INITIAL_EDUCATION;
  }

  async saveEducation(items: EducationItem[]): Promise<void> {
    if (db) {
      try {
        await Promise.all(
          items.map(item => setDoc(doc(db, 'education', item.id), this.cleanPayload(item), { merge: true }))
        );
      } catch (err: any) {
        console.error('Firestore saveEducation error:', err);
        throw new Error(`Firestore education save failed: ${err.message || 'Unknown error'}`);
      }
    }

    try {
      await apiService.updateEducation(items);
    } catch {}

    this.memoryEducation = items;
    safeStorage.setItem(EDUCATION_KEY, JSON.stringify(items));
    this.notify();
  }

  // ========================================================
  // SKILLS OPERATIONS (FIRESTORE AUTHORITATIVE)
  // ========================================================
  getSkills(): SkillCategory[] {
    if (this.memorySkills && this.memorySkills.length > 0) {
      return this.memorySkills;
    }

    try {
      const data = safeStorage.getItem(SKILLS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.memorySkills = parsed;
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading skills cache:', e);
    }

    return SKILL_CATEGORIES;
  }

  async saveSkills(categories: SkillCategory[]): Promise<void> {
    if (db) {
      try {
        await Promise.all(
          categories.map(cat => setDoc(doc(db, 'skills', cat.id), this.cleanPayload(cat), { merge: true }))
        );
      } catch (err: any) {
        console.error('Firestore saveSkills error:', err);
        throw new Error(`Firestore skills save failed: ${err.message || 'Unknown error'}`);
      }
    }

    try {
      await apiService.updateSkills(categories);
    } catch {}

    this.memorySkills = categories;
    safeStorage.setItem(SKILLS_KEY, JSON.stringify(categories));
    this.notify();
  }

  // ========================================================
  // MEDIA ASSETS (FIRESTORE AUTHORITATIVE)
  // ========================================================
  getMediaAssets(): MediaAsset[] {
    if (this.memoryMedia && this.memoryMedia.length > 0) {
      return this.memoryMedia;
    }

    try {
      const data = safeStorage.getItem(MEDIA_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          this.memoryMedia = parsed;
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading media assets cache:', e);
    }
    return [];
  }

  async saveMediaAsset(asset: MediaAsset): Promise<MediaAsset> {
    if (!asset.id) throw new Error('Missing media asset ID');

    if (db) {
      try {
        const ref = doc(db, 'media_assets', asset.id);
        await setDoc(ref, this.cleanPayload(asset), { merge: true });
      } catch (err: any) {
        console.error('Firestore saveMediaAsset error:', err);
        throw new Error(`Firestore media save failed: ${err.message || 'Unknown error'}`);
      }
    }

    try {
      await apiService.saveMedia(asset);
    } catch {}

    const list = [...this.getMediaAssets()];
    const existingIndex = list.findIndex(a => a.id === asset.id);
    if (existingIndex >= 0) {
      list[existingIndex] = asset;
    } else {
      list.unshift(asset);
    }

    this.memoryMedia = list;
    safeStorage.setItem(MEDIA_KEY, JSON.stringify(list));
    this.notify();
    return asset;
  }

  async deleteMediaAsset(id: string): Promise<void> {
    if (!id) throw new Error('Missing media asset ID for deletion');

    if (db) {
      try {
        const ref = doc(db, 'media_assets', id);
        await deleteDoc(ref);
      } catch (err: any) {
        console.error('Firestore deleteMediaAsset error:', err);
        throw new Error(`Firestore media delete failed: ${err.message || 'Unknown error'}`);
      }
    }

    try {
      await apiService.deleteMedia(id);
    } catch {}

    const list = this.getMediaAssets().filter(a => a.id !== id);
    this.memoryMedia = list;
    safeStorage.setItem(MEDIA_KEY, JSON.stringify(list));
    this.notify();
  }

  // Backup & Restore
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
  }

  async importBackup(jsonString: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.profile) {
        await this.saveProfile(parsed.profile);
      }
      if (parsed.projects && Array.isArray(parsed.projects)) {
        for (const proj of parsed.projects) {
          await this.saveProject(proj);
        }
      }
      if (parsed.experience && Array.isArray(parsed.experience)) {
        await this.saveExperience(parsed.experience);
      }
      if (parsed.education && Array.isArray(parsed.education)) {
        await this.saveEducation(parsed.education);
      }
      if (parsed.skills && Array.isArray(parsed.skills)) {
        await this.saveSkills(parsed.skills);
      }
      if (parsed.media && Array.isArray(parsed.media)) {
        for (const asset of parsed.media) {
          await this.saveMediaAsset(asset);
        }
      }
      this.notify();
      return true;
    } catch (e) {
      console.error('Invalid backup import:', e);
      return false;
    }
  }

  async resetAllDefaults(): Promise<void> {
    this.memoryProjects = null;
    this.memoryProfile = null;
    this.memoryExperience = null;
    this.memoryEducation = null;
    this.memorySkills = null;
    this.memoryMedia = null;

    safeStorage.removeItem(PROJECTS_KEY);
    safeStorage.removeItem(PROFILE_KEY);
    safeStorage.removeItem(EXPERIENCE_KEY);
    safeStorage.removeItem(EDUCATION_KEY);
    safeStorage.removeItem(SKILLS_KEY);
    safeStorage.removeItem(MEDIA_KEY);

    await this.saveProfile(INITIAL_PROFILE);
    for (const p of INITIAL_PROJECTS) {
      await this.saveProject(p);
    }
    await this.saveExperience(INITIAL_EXPERIENCE);
    await this.saveEducation(INITIAL_EDUCATION);
    await this.saveSkills(SKILL_CATEGORIES);
    this.notify();
  }
}

export const storageService = new StorageService();
