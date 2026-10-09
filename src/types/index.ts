export type ProjectCategory = 
  | 'Product' 
  | 'Growth' 
  | 'AI' 
  | 'Analytics' 
  | 'CRM' 
  | 'Experimentation';

export type LinkType = 
  | 'PPT' 
  | 'PDF' 
  | 'Figma' 
  | 'Prototype' 
  | 'PRD' 
  | 'Research' 
  | 'GitHub' 
  | 'Live Website' 
  | 'Notion' 
  | 'YouTube' 
  | 'Loom'
  | 'Other';

export interface ProjectLink {
  id: string;
  type: LinkType;
  label: string;
  url: string;
  sortOrder?: number;
  notes?: string;
}

export interface SlideItem {
  page: number;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  body?: string;
  bullets?: string[];
  tags?: string[];
  gradient?: string;
  imageUrl?: string;
}

export interface ProjectFile {
  id: string;
  title?: string;
  fileName: string;
  fileType: 'pdf' | 'ppt' | 'pptx' | 'doc' | 'docx' | 'txt' | 'slides' | 'link' | string;
  fileUrl: string;
  description?: string;
  pageCount?: number;
  slides?: (string | SlideItem)[]; // For LinkedIn carousel / multi-slide flipbook (all slides preserved)
  textContent?: string; // For text / markdown reading
  sortOrder?: number;
}

export interface MetricItem {
  label: string;
  value: string;
  detail?: string;
}

export interface WireframeAsset {
  id: string;
  title: string;
  url: string;
  caption?: string;
  category?: 'wireframe' | 'high_fidelity' | 'user_flow' | 'architecture' | 'mockup';
  sortOrder?: number;
}

export type BlockType = 
  | 'rich_text'
  | 'wireframe_gallery'
  | 'prototype_embed'
  | 'kpi_grid'
  | 'comparison'
  | 'persona'
  | 'problem_solution'
  | 'video_walkthrough';

export interface CustomBlock {
  id: string;
  type: BlockType;
  title: string;
  subtitle?: string;
  content?: string;
  data?: any; // Structured payload depending on block type
  sortOrder: number;
}

export interface SeoMetadata {
  metaTitle?: string;
  metaDescription?: string;
  canonicalSlug?: string;
  ogImage?: string;
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  shortDescription: string;
  category: ProjectCategory;
  tags: string[];
  role: string;
  timeline: string;
  industry: string;
  team?: string;
  coverImage: string;
  featured: boolean;
  status: 'Draft' | 'Published';
  order?: number;
  videoUrl?: string;

  // Case study foundational sections
  overview?: string;
  problem?: string;
  objectives?: string;
  research?: string;
  userResearch?: string;
  insights?: string;
  opportunity?: string;
  targetAudience?: string;
  painPoints?: string;
  strategy?: string;
  solution?: string;
  userFlow?: string;
  experimentation?: string;
  outcome?: string;
  learnings?: string;
  
  // Structured blocks & assets
  metrics?: MetricItem[];
  links: ProjectLink[];
  wireframes?: WireframeAsset[];
  customBlocks?: CustomBlock[];
  files?: ProjectFile[];
  seo?: SeoMetadata;

  createdAt: string;
  updatedAt: string;
}

export interface PillarItem {
  id: string;
  title: string;
  category: string;
  description: string;
  tag: string;
}

export interface ProfileContent {
  name: string;
  eyebrow: string;
  headline: string;
  bio: string;
  photoUrl: string;
  photoTagline: string;
  quote?: string;
  quoteAuthor?: string;
  quoteAuthorRole?: string;
  resumeUrl?: string;
  primaryCtaText?: string;
  primaryCtaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  // About Me section
  aboutEyebrow?: string;
  aboutHeading?: string;
  aboutParagraph1?: string;
  aboutParagraph2?: string;
  // Key Metrics
  metrics: {
    value: string;
    label: string;
    sub?: string;
  }[];
  // 4 Core Disciplines / Pillars
  pillars?: PillarItem[];
  // Contact & Meta
  email: string;
  linkedin: string;
  linkedinName?: string;
  location: string;
  availabilityStatus?: string;
  // Page Headers
  skillsPageEyebrow?: string;
  skillsPageTitle?: string;
  skillsPageDescription?: string;
  experiencePageEyebrow?: string;
  experiencePageTitle?: string;
  experiencePageDescription?: string;
  projectsPageEyebrow?: string;
  projectsPageTitle?: string;
  projectsPageDescription?: string;
  skillsOverview?: string[];
  updatedAt?: string;
}

export interface SkillCategory {
  id: string;
  name: string;
  description: string;
  skills: string[];
}

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  period: string;
  location: string;
  featured?: boolean;
  impactMetrics?: {
    value: string;
    label: string;
  }[];
  responsibilities: string[];
  caseStudySlug?: string;
  logo?: string;
  order?: number;
}

export interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  score: string;
  status: string;
  period?: string;
  details?: string;
}

export interface MediaAsset {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  caption?: string;
  projectId?: string;
  createdAt: string;
}
