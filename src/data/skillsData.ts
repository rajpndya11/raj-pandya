export interface SkillCategory {
  id: string;
  name: string;
  description: string;
  skills: string[];
}

export const SKILL_CATEGORIES: SkillCategory[] = [
  {
    id: 'product-strategy',
    name: 'Product Strategy & Design',
    description: 'Frameworks and discovery methods to identify real customer pain, define vision, and design intuitive experiences.',
    skills: [
      'Product Vision',
      'Roadmap Planning',
      'Market Research',
      'Competitive Analysis',
      'RICE',
      'MoSCoW',
      'Kano',
      'ICE',
      'JTBD (Jobs-to-be-Done)',
      'Persona Development',
      'Wireframing',
      'User Flow Design',
      'Prototyping',
      'Usability Testing',
      'UI/UX Execution',
      'User Interviews'
    ]
  },
  {
    id: 'growth-strategy',
    name: 'Growth & Business Strategy',
    description: 'Systematic approaches to optimize funnels, run rigorous A/B experiments, and drive sustained user acquisition and retention.',
    skills: [
      'Funnel Analysis & Optimization',
      'CRO (Conversion Rate Optimization)',
      'Lifecycle Marketing',
      'User Retention',
      'Revenue Modeling',
      'Pricing Strategy',
      'Monetization',
      'GTM Planning',
      'A/B Testing',
      'Experimentation'
    ]
  },
  {
    id: 'data-technical',
    name: 'Data & Technical',
    description: 'Translating complex user behavior into queryable telemetry, database schemas, and robust API contracts.',
    skills: [
      'SQL',
      'Data Querying',
      'Data-Driven Analysis',
      'Metrics Interpretation',
      'API Integrations',
      'System Architecture',
      'Salesforce',
      'GitHub',
      'Postman'
    ]
  },
  {
    id: 'ai-automation',
    name: 'AI & Workflow Automation',
    description: 'Deploying generative models, multi-agent frameworks, and autonomous automation pipelines into real product workflows.',
    skills: [
      'Prompt Engineering',
      'Context Engineering',
      'AI Agents',
      'Claude Code',
      'Vibe Coding',
      'Workflow Automation',
      'n8n'
    ]
  },
  {
    id: 'execution-leadership',
    name: 'Product Execution & Leadership',
    description: 'Aligning high-output cross-functional squads across design, engineering, marketing, and commercial stakeholders.',
    skills: [
      'Agile / Scrum',
      'Sprint Planning',
      'PRD Writing',
      'Stakeholder Management',
      'Cross-Functional Team Alignment',
      'Engineering Partnerships'
    ]
  },
  {
    id: 'product-analytics',
    name: 'Product Analytics',
    description: 'Quantitative instrumentation, user session replay, event telemetry, and cohort tracking.',
    skills: [
      'Mixpanel',
      'Amplitude',
      'Google Analytics',
      'Microsoft Clarity',
      'Hotjar'
    ]
  },
  {
    id: 'tools',
    name: 'Tools & Platforms',
    description: 'Day-to-day stack for product delivery, design collaboration, documentation, and telemetry.',
    skills: [
      'Jira',
      'Linear',
      'Notion',
      'Figma',
      'GitHub',
      'Postman',
      'Salesforce',
      'Claude Code',
      'n8n',
      'Mixpanel',
      'Amplitude',
      'Google Analytics',
      'Microsoft Clarity'
    ]
  },
  {
    id: 'soft-skills',
    name: 'Soft Skills & Leadership Mindset',
    description: 'Interpersonal acumen, strategic narrative building, problem decomposition, and high-agency execution.',
    skills: [
      'Product Sense & Problem Solving',
      'Ownership & Accountability',
      'Stakeholder Management',
      'AI & Innovation Mindset',
      'Communication',
      'Teamwork & Collaboration',
      'Time Management',
      'Multi-tasking'
    ]
  }
];
