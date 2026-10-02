import { ProfileContent, ExperienceItem } from '../types';

export const triggerResumeDownload = (profile: ProfileContent, experiences: ExperienceItem[]) => {
  // If user provided a custom PDF or Drive URL, trigger direct download
  if (profile.resumeUrl && profile.resumeUrl.trim().length > 0) {
    const a = document.createElement('a');
    a.href = profile.resumeUrl;
    a.download = `${profile.name.replace(/\s+/g, '_')}_Product_Manager_Resume.pdf`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  // Otherwise, generate a clean, executive print/PDF-ready HTML resume
  const experienceRows = experiences.map(exp => `
    <div style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #E5E7EB;">
      <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
        <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: #111827;">${exp.role}</h3>
        <span style="font-size: 13px; color: #6B7280; font-weight: 500;">${exp.period}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="font-size: 14px; font-weight: 600; color: #92400E;">${exp.company}</span>
        <span style="font-size: 13px; color: #6B7280;">${exp.location}</span>
      </div>
      ${exp.responsibilities && exp.responsibilities.length > 0 ? `
        <ul style="margin: 6px 0 8px 18px; padding: 0; font-size: 13px; color: #374151; line-height: 1.5;">
          ${exp.responsibilities.map(r => `<li style="margin-bottom: 3px;">${r}</li>`).join('')}
        </ul>
      ` : ''}
      ${exp.impactMetrics && exp.impactMetrics.length > 0 ? `
        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;">
          ${exp.impactMetrics.map(m => `
            <span style="display: inline-block; background-color: #FEF3C7; color: #92400E; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">
              ${m.value} ${m.label}
            </span>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `).join('');

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${profile.name} — Product Manager Resume</title>
  <style>
    @media print {
      body { margin: 0; padding: 20px; }
      .no-print { display: none !important; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1F2937;
      background: #FFFFFF;
      margin: 0;
      padding: 40px;
      line-height: 1.6;
      max-width: 800px;
      margin-left: auto;
      margin-right: auto;
    }
    .header {
      border-bottom: 2px solid #111827;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .name {
      font-size: 28px;
      font-weight: 800;
      color: #111827;
      margin: 0 0 4px 0;
      letter-spacing: -0.5px;
    }
    .title {
      font-size: 16px;
      color: #92400E;
      font-weight: 600;
      margin: 0 0 12px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .contact-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      font-size: 13px;
      color: #4B5563;
    }
    .section-title {
      font-size: 14px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #111827;
      border-bottom: 1.5px solid #E5E7EB;
      padding-bottom: 6px;
      margin-top: 24px;
      margin-bottom: 16px;
    }
    .bio-text {
      font-size: 14px;
      color: #374151;
      line-height: 1.6;
      margin-bottom: 20px;
    }
    .skills-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      font-size: 13px;
    }
    .skill-item {
      color: #374151;
    }
    .skill-item strong {
      color: #111827;
    }
    .btn-print {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 10px 18px;
      background: #111827;
      color: #FFFFFF;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
  </style>
</head>
<body>
  <button class="btn-print no-print" onclick="window.print()">Print / Save as PDF</button>

  <header class="header">
    <h1 class="name">${profile.name}</h1>
    <div class="title">${profile.eyebrow || 'Product Manager | Growth & Experimentation'}</div>
    <div class="contact-bar">
      <span>📍 ${profile.location}</span>
      <span>✉️ ${profile.email}</span>
      <span>🔗 ${profile.linkedin}</span>
    </div>
  </header>

  <section>
    <div class="section-title">Executive Summary</div>
    <p class="bio-text">${profile.bio}</p>
  </section>

  <section>
    <div class="section-title">Core Competencies & Impact</div>
    <div class="skills-grid">
      <div class="skill-item"><strong>Product Strategy:</strong> Funnel Optimization, Experimentation, Roadmapping</div>
      <div class="skill-item"><strong>Data & Analytics:</strong> SQL, A/B Testing, GA4, Mixpanel, Cohort Analysis</div>
      <div class="skill-item"><strong>Execution:</strong> PRD Creation, Cross-functional Leadership, Agile Sprints</div>
      <div class="skill-item"><strong>AI & Systems:</strong> LLM Integrations, Agentic Workflows, Prompt Architecture</div>
    </div>
  </section>

  <section>
    <div class="section-title">Professional Experience</div>
    ${experienceRows}
  </section>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${profile.name.replace(/\s+/g, '_')}_Product_Manager_Resume.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
