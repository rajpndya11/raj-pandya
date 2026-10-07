import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Project, ProfileContent, ExperienceItem, EducationItem, SkillCategory, MediaAsset } from '../types';
import { INITIAL_PROJECTS } from '../data/initialProjects';
import { INITIAL_PROFILE } from '../data/initialProfile';
import { INITIAL_EXPERIENCE, INITIAL_EDUCATION } from '../data/initialExperience';
import { SKILL_CATEGORIES } from '../data/skillsData';
import { storageService, safeStorage } from '../services/storageService';

interface PortfolioContextType {
  profile: ProfileContent;
  projects: Project[];
  publishedProjects: Project[];
  featuredProjects: Project[];
  experiences: ExperienceItem[];
  education: EducationItem[];
  skills: SkillCategory[];
  mediaAssets: MediaAsset[];
  isLoading: boolean;
  error: string | null;
  getProjectBySlug: (slug: string) => Project | undefined;
  getProjectById: (id: string) => Project | undefined;
}

const PortfolioContext = createContext<PortfolioContextType | null>(null);

interface PortfolioProviderProps {
  children: ReactNode;
}

export const PortfolioProvider: React.FC<PortfolioProviderProps> = ({ children }) => {
  const [profile, setProfile] = useState<ProfileContent>(() => storageService.getProfile());
  const [projects, setProjects] = useState<Project[]>(() => storageService.getProjects());
  const [experiences, setExperiences] = useState<ExperienceItem[]>(() => storageService.getExperience());
  const [education, setEducation] = useState<EducationItem[]>(() => storageService.getEducation());
  const [skills, setSkills] = useState<SkillCategory[]>(() => storageService.getSkills());
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>(() => storageService.getMediaAssets());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) {
      setIsLoading(false);
      return;
    }

    const unsubs: (() => void)[] = [];
    let initialLoadsRemaining = 6;

    const checkInitialLoaded = () => {
      initialLoadsRemaining--;
      if (initialLoadsRemaining <= 0) {
        setIsLoading(false);
      }
    };

    try {
      // 1. Real-time Profile Listener (site_content/main_profile)
      const unsubProfile = onSnapshot(
        doc(db, 'site_content', 'main_profile'),
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as ProfileContent;
            if (data && data.name) {
              setProfile(data);
              safeStorage.setItem('rp_portfolio_profile', JSON.stringify(data));
              setError(null);
            }
          }
          checkInitialLoaded();
        },
        (err) => {
          console.warn('Real-time profile listener notice:', err);
          checkInitialLoaded();
        }
      );
      unsubs.push(unsubProfile);

      // 2. Real-time Projects Listener (projects)
      const unsubProjects = onSnapshot(
        collection(db, 'projects'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: Project[] = [];
            snapshot.forEach((d) => {
              const data = d.data() as Project;
              if (data && data.id) {
                list.push(data);
              }
            });
            if (list.length > 0) {
              // Sort strictly by order index ascending
              const sorted = list.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
              setProjects(sorted);
              safeStorage.setItem('rp_portfolio_projects', JSON.stringify(sorted));
              setError(null);
            }
          }
          checkInitialLoaded();
        },
        (err) => {
          console.warn('Real-time projects listener notice:', err);
          checkInitialLoaded();
        }
      );
      unsubs.push(unsubProjects);

      // 3. Real-time Experiences Listener (experiences)
      const unsubExp = onSnapshot(
        collection(db, 'experiences'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: ExperienceItem[] = [];
            snapshot.forEach((d) => {
              const data = d.data() as ExperienceItem;
              if (data && data.id) {
                list.push(data);
              }
            });
            if (list.length > 0) {
              setExperiences(list);
              safeStorage.setItem('rp_portfolio_experience', JSON.stringify(list));
            }
          }
          checkInitialLoaded();
        },
        (err) => {
          console.warn('Real-time experiences listener notice:', err);
          checkInitialLoaded();
        }
      );
      unsubs.push(unsubExp);

      // 4. Real-time Skills Listener (skills)
      const unsubSkills = onSnapshot(
        collection(db, 'skills'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: SkillCategory[] = [];
            snapshot.forEach((d) => {
              const data = d.data() as SkillCategory;
              if (data && data.id) {
                list.push(data);
              }
            });
            if (list.length > 0) {
              setSkills(list);
              safeStorage.setItem('rp_portfolio_skills', JSON.stringify(list));
            }
          }
          checkInitialLoaded();
        },
        (err) => {
          console.warn('Real-time skills listener notice:', err);
          checkInitialLoaded();
        }
      );
      unsubs.push(unsubSkills);

      // 5. Real-time Education Listener (education)
      const unsubEdu = onSnapshot(
        collection(db, 'education'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: EducationItem[] = [];
            snapshot.forEach((d) => {
              const data = d.data() as EducationItem;
              if (data && data.id) {
                list.push(data);
              }
            });
            if (list.length > 0) {
              setEducation(list);
              safeStorage.setItem('rp_portfolio_education', JSON.stringify(list));
            }
          }
          checkInitialLoaded();
        },
        (err) => {
          console.warn('Real-time education listener notice:', err);
          checkInitialLoaded();
        }
      );
      unsubs.push(unsubEdu);

      // 6. Real-time Media Assets Listener (media_assets)
      const unsubMedia = onSnapshot(
        collection(db, 'media_assets'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: MediaAsset[] = [];
            snapshot.forEach((d) => {
              const data = d.data() as MediaAsset;
              if (data && data.id) {
                list.push(data);
              }
            });
            setMediaAssets(list);
            safeStorage.setItem('rp_portfolio_media', JSON.stringify(list));
          }
          checkInitialLoaded();
        },
        (err) => {
          console.warn('Real-time media listener notice:', err);
          checkInitialLoaded();
        }
      );
      unsubs.push(unsubMedia);

    } catch (e: any) {
      console.warn('Could not register onSnapshot listeners:', e);
      setError(e.message || 'Error subscribing to real-time Firestore updates');
      setIsLoading(false);
    }

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, []);

  const publishedProjects = projects.filter((p) => p.status === 'Published');
  const effectivePublished = publishedProjects.length > 0 ? publishedProjects : projects;
  const featured = effectivePublished.filter((p) => p.featured);
  const featuredProjects = featured.length > 0 ? featured : effectivePublished.slice(0, 4);

  const getProjectBySlug = (slug: string): Project | undefined => {
    if (!slug) return undefined;
    const clean = decodeURIComponent(slug).trim().toLowerCase();
    return projects.find((p) => {
      const pSlug = (p.slug || '').toLowerCase().trim();
      const pId = (p.id || '').toLowerCase().trim();
      return (
        pSlug === clean ||
        pId === clean ||
        (clean.length > 5 && (pSlug.startsWith(clean) || clean.startsWith(pSlug)))
      );
    });
  };

  const getProjectById = (id: string): Project | undefined => {
    return projects.find((p) => p.id === id);
  };

  return (
    <PortfolioContext.Provider
      value={{
        profile,
        projects,
        publishedProjects: effectivePublished,
        featuredProjects,
        experiences,
        education,
        skills,
        mediaAssets,
        isLoading,
        error,
        getProjectBySlug,
        getProjectById
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = (): PortfolioContextType => {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
};
