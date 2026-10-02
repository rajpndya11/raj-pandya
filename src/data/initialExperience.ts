import { ExperienceItem, EducationItem } from '../types';

export const INITIAL_EXPERIENCE: ExperienceItem[] = [
  {
    id: 'exp-1',
    company: 'Godrej Properties',
    role: 'Digital Product Management Trainee',
    period: 'Sep 2025 – Present',
    location: 'Mumbai, India',
    featured: true,
    impactMetrics: [
      { value: '₹9K → ₹3K', label: 'Cost Per Lead (CPL)' },
      { value: '-66%', label: 'CPL Reduction' },
      { value: '8% → 24%', label: 'Lead-to-Visit Conversion' },
      { value: '50+', label: 'Projects Scaled' }
    ],
    responsibilities: [
      'Owned the end-to-end digital acquisition and qualification funnel across 50+ tier-1 luxury real estate projects nationally.',
      'Formulated data-driven acquisition strategies by developing rich buyer personas, user research, and on-site behavioral session analytics.',
      'Diagnosed deep funnel bottlenecks from paid campaign landings to digital brochure downloads and site visit scheduling.',
      'Engineered progressive qualification forms and interactive virtual floorplan selectors, dramatically increasing high-intent lead submissions.',
      'Designed and executed multi-variant A/B landing page tests across copy, social proof, and mobile viewports.',
      'Partnered closely with engineering, UX design, marketing, and sales CRM teams to streamline lead routing and response SLAs.',
      'Conducted call-center audits and lead quality telemetry to eliminate false-positive submissions and boost verified buyer throughput.'
    ],
    caseStudySlug: 'godrej-funnel-optimization'
  },
  {
    id: 'exp-2',
    company: 'Moksh Consultants',
    role: 'Growth Product & Strategy',
    period: 'Apr 2025 – Sep 2025',
    location: 'Mumbai, India',
    featured: false,
    impactMetrics: [
      { value: '+42%', label: 'Ad-to-Lead Rate' },
      { value: '₹18L+', label: 'Budget Optimized' }
    ],
    responsibilities: [
      'Spearheaded user acquisition architecture across paid Google Search, Display, and Meta Ads channels for overseas education aspirants.',
      'Built and instrumented dynamic modular landing pages with personalized country and curriculum calculators.',
      'Executed systematic creative experimentation loops, validating 30+ value propositions and messaging hooks.',
      'Optimized conversion rate (CRO) through heatmapping, scroll-depth tracking, and streamlined WhatsApp instant advisory triggers.'
    ],
    caseStudySlug: 'moksh-growth-funnel-strategy'
  },
  {
    id: 'exp-3',
    company: 'Tata CLiQ Luxury',
    role: 'Product Intern — CRM & Retention',
    period: 'Jan 2025 – Mar 2025',
    location: 'Mumbai, India',
    featured: false,
    impactMetrics: [
      { value: '+18%', label: 'Repeat Purchase Rate' },
      { value: '2.4x', label: 'Push CTR Lift' }
    ],
    responsibilities: [
      'Mapped luxury customer lifecycle journeys across post-purchase onboarding, dormant re-engagement, and VIP tier loyalty.',
      'Orchestrated personalized omni-channel campaigns across automated email sequences, rich push notifications, and WhatsApp updates.',
      'Conducted RFM (Recency, Frequency, Monetary) cohort segmentation to identify high-LTV luxury fashion and watch buyers.',
      'Analyzed customer churn patterns and optimized friction points in the return and authentication assurance flows.'
    ],
    caseStudySlug: 'tatacliq-luxury-crm-retention'
  },
  {
    id: 'exp-4',
    company: 'WebEngage',
    role: 'Product Intern',
    period: 'Sep 2024 – Dec 2024',
    location: 'Mumbai, India',
    featured: false,
    impactMetrics: [
      { value: '14+', label: 'PRDs & Teardowns' },
      { value: '99.4%', label: 'Data Accuracy' }
    ],
    responsibilities: [
      'Researched retention marketing workflows, customer data platform (CDP) schemas, and event ingestion bottlenecks.',
      'Built product teardowns and competitive feature matrices comparing market leaders in customer engagement automation.',
      'Collaborated on retention telemetry dashboards, monitoring cohort health, journey drop-offs, and webhook trigger reliability.'
    ],
    caseStudySlug: 'webengage-saas-workflow-telemetry'
  },
  {
    id: 'exp-5',
    company: 'Mudrank Trading Institute',
    role: 'Product Executive — Digital Growth',
    period: 'Mar 2021 – Apr 2023',
    location: 'Mumbai, India',
    featured: false,
    impactMetrics: [
      { value: '3.1x', label: 'Webinar Registrations' },
      { value: '-35%', label: 'Drop-off at Checkout' }
    ],
    responsibilities: [
      'Architected end-to-end enrollment funnels for financial market educational programs and live masterclasses.',
      'Redesigned course discovery flows, curriculum previews, and checkout friction points with clear milestone progression.',
      'Ran rapid weekly A/B testing on landing page headlines, pricing tier tables, and live trading demo clips.'
    ],
    caseStudySlug: 'mudrank-digital-growth-funnel'
  }
];

export const INITIAL_EDUCATION: EducationItem[] = [
  {
    id: 'edu-1',
    degree: 'Post Graduate Diploma in Management (PGDM)',
    institution: 'IIDE — Indian Institute of Digital Education',
    score: '89%',
    status: 'Graduated with Distinction',
    details: 'Specialization in Digital Strategy, Growth Marketing, Product Analytics, and Leadership.'
  },
  {
    id: 'edu-2',
    degree: 'Bachelor of Mass Communication & Multimedia (BMCM)',
    institution: 'Thakur College of Science and Commerce, Mumbai University',
    score: '87%',
    status: 'Graduated First Class with Distinction',
    details: 'Focus on User Psychology, Visual Communications, Media Technologies, and Strategic Storytelling.'
  },
  {
    id: 'edu-3',
    degree: 'AI Product Management Certification',
    institution: 'Airtribe',
    score: 'Pursuing',
    status: 'In Progress',
    details: 'Advanced LLM Product Architecture, Agentic Workflows, Evaluation Metrics, and AI-first UX design.'
  }
];
