import { Project, ProfileContent, ExperienceItem, SkillCategory } from '../types';

/**
 * Full-Stack API Client:
 * Connects frontend directly to Express backend (/api/*), ensuring all backend and database
 * changes immediately reflect across the application.
 */
export const apiService = {
  async getHealth() {
    try {
      const res = await fetch('/api/health');
      return await res.json();
    } catch (err) {
      console.warn('API health check error:', err);
      return { status: 'offline' };
    }
  },

  async getProfile(): Promise<ProfileContent | null> {
    try {
      const res = await fetch('/api/profile');
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch (err) {
      console.warn('API getProfile error:', err);
      return null;
    }
  },

  async updateProfile(profile: ProfileContent): Promise<boolean> {
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      return res.ok;
    } catch (err) {
      console.warn('API updateProfile error:', err);
      return false;
    }
  },

  async getProjects(): Promise<Project[]> {
    try {
      const res = await fetch('/api/projects');
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    } catch (err) {
      console.warn('API getProjects error:', err);
      return [];
    }
  },

  async saveProject(project: Project): Promise<boolean> {
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(project.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project)
      });
      return res.ok;
    } catch (err) {
      console.warn('API saveProject error:', err);
      return false;
    }
  },

  async deleteProject(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      return res.ok;
    } catch (err) {
      console.warn('API deleteProject error:', err);
      return false;
    }
  },

  async getExperiences(): Promise<ExperienceItem[]> {
    try {
      const res = await fetch('/api/experiences');
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    } catch (err) {
      console.warn('API getExperiences error:', err);
      return [];
    }
  },

  async updateExperiences(experiences: ExperienceItem[]): Promise<boolean> {
    try {
      const res = await fetch('/api/experiences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(experiences)
      });
      return res.ok;
    } catch (err) {
      console.warn('API updateExperiences error:', err);
      return false;
    }
  },

  async getSkills(): Promise<SkillCategory[]> {
    try {
      const res = await fetch('/api/skills');
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    } catch (err) {
      console.warn('API getSkills error:', err);
      return [];
    }
  },

  async updateSkills(skills: SkillCategory[]): Promise<boolean> {
    try {
      const res = await fetch('/api/skills', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(skills)
      });
      return res.ok;
    } catch (err) {
      console.warn('API updateSkills error:', err);
      return false;
    }
  }
};
