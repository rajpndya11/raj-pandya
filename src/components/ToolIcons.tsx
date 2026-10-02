import React from 'react';

interface ToolIconProps {
  name: string;
  className?: string;
}

export const ToolIcon: React.FC<ToolIconProps> = ({ name, className = "w-5 h-5" }) => {
  const normalized = name.toLowerCase().trim();

  switch (normalized) {
    case 'jira':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path d="M11.53 2c0 2.4-1.95 4.35-4.35 4.35H2.82c-.45 0-.82.37-.82.82v4.35c0 2.4-1.95 4.35-4.35 4.35H.82C.37 15.87 0 16.24 0 16.69V22h5.45c2.4 0 4.35-1.95 4.35-4.35v-4.35c0-2.4 1.95-4.35 4.35-4.35h4.35c.45 0 .82-.37.82-.82V2h-7.8z" fill="#0052CC"/>
          <path d="M12.18 2h6.05c2.4 0 4.35 1.95 4.35 4.35v4.35c0 2.4-1.95 4.35-4.35 4.35h-4.35c-.45 0-.82.37-.82.82V22h-5.45c-2.4 0-4.35-1.95-4.35-4.35v-4.35c0-2.4 1.95-4.35 4.35-4.35h4.35c.45 0 .82-.37.82-.82V2h-.8z" fill="#2684FF" opacity="0.8"/>
        </svg>
      );
    case 'linear':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M3.18 13.08a9.96 9.96 0 0 1-.18-1.9c0-5.5 4.46-9.96 9.96-9.96.65 0 1.28.06 1.9.18l-11.68 11.68zm-1.07 3.3c.3 1.27.87 2.44 1.66 3.44L19.82 3.77A9.91 9.91 0 0 0 16.38 2.1L2.11 16.38zm3.3 5.51c1 .79 2.17 1.36 3.44 1.66L21.9 9.47A9.91 9.91 0 0 0 20.23 6.03L5.41 21.89zm6.05 1.83c1.76.19 3.55-.17 5.14-.99l-8.6-8.6-1.68 1.68 5.14 7.91z" fill="#5E6AD2"/>
        </svg>
      );
    case 'notion':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l11.458-.84c1.12-.093 1.307-.466.933-1.026L17.79 1.13c-.373-.56-.933-.84-1.866-.746L3.992 1.316c-.933.093-1.12.56-.746 1.213zm.746 3.733v13.53c0 .933.56 1.307 1.493 1.213l13.138-.933c.933-.093 1.12-.653 1.12-1.4v-13.437c0-.746-.373-1.12-1.12-1.026l-13.325.933c-.746.093-1.306.467-1.306 1.12zm11.85 1.773c.093.467 0 .933-.467.933l-.746.093v7.931l1.586.373c.466.093.56.467.466.933l-3.359.28c-.093-.467 0-.933.467-.933l.84-.093v-7.371l-3.732 8.305c-.187.373-.56.467-.933.467l-.467-.093-2.986-7.838v6.998l1.306.187c.373.093.467.466.373.933l-2.706.187c-.093-.467 0-.933.467-.933l.84-.187V9.714l-.933-.093c-.467 0-.56-.373-.467-.84l2.8-.28 3.545 8.118 3.08-7.931-1.027-.093c-.466 0-.56-.373-.466-.84l3.172-.187z" fill="#000000"/>
        </svg>
      );
    case 'figma':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path d="M8 24c2.208 0 4-1.792 4-4v-4H8c-2.208 0-4 1.792-4 4s1.792 4 4 4z" fill="#0ACF83"/>
          <path d="M4 12c0-2.208 1.792-4 4-4h4v8H8c-2.208 0-4-1.792-4-4z" fill="#A259FF"/>
          <path d="M4 4c0-2.208 1.792-4 4-4h4v8H8C5.792 8 4 6.208 4 4z" fill="#F24E1E"/>
          <path d="M12 0h4c2.208 0 4 1.792 4 4s-1.792 4-4 4h-4V0z" fill="#FF7262"/>
          <path d="M20 12c0 2.208-1.792 4-4 4s-4-1.792-4-4 1.792-4 4-4 4 1.792 4 4z" fill="#1ABCFE"/>
        </svg>
      );
    case 'github':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" fill="#24292F"/>
        </svg>
      );
    case 'postman':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#FF6C37"/>
          <path d="M16.5 13.5l-3.2-3.2c-.3-.3-.7-.3-1 0L10 12.6l-2-2c-.3-.3-.7-.3-1 0l-1.5 1.5c-.3.3-.3.7 0 1l3.5 3.5c.3.3.7.3 1 0l2.3-2.3 2.2 2.2c.3.3.7.3 1 0l1-1c.3-.3.3-.7 0-1z" fill="#FFFFFF"/>
        </svg>
      );
    case 'salesforce':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path d="M10 5.5a5.5 5.5 0 0 1 5.37 4.23A4.5 4.5 0 0 1 19 14a4.5 4.5 0 0 1-4.5 4.5h-9A5.5 5.5 0 0 1 0 13a5.5 5.5 0 0 1 5.09-5.48A5.5 5.5 0 0 1 10 5.5z" fill="#00A1E0"/>
        </svg>
      );
    case 'claude code':
    case 'claude':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" fill="#D97706"/>
          <circle cx="12" cy="12" r="3" fill="#B45309"/>
        </svg>
      );
    case 'n8n':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="4" fill="#EA4B71"/>
          <path d="M6 12h4m4 0h4M10 8l4 8M14 8l-4 8" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round"/>
        </svg>
      );
    case 'mixpanel':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="5" fill="#7856FF"/>
          <path d="M6 16V14h3v2H6zm4.5 0V8h3v8h-3zm4.5 0v-4h3v4h-3z" fill="#FFFFFF"/>
        </svg>
      );
    case 'amplitude':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path d="M12 3L3 18h4.5l4.5-8.5L16.5 18H21L12 3z" fill="#1E61F2"/>
        </svg>
      );
    case 'google analytics':
    case 'ga':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="5" fill="#F9AB00"/>
          <path d="M7 16h2v-4H7v4zm4 0h2V8h-2v8zm4 0h2v-8h-2v8z" fill="#FFFFFF"/>
          <circle cx="17" cy="6" r="1.5" fill="#E37400"/>
        </svg>
      );
    case 'microsoft clarity':
    case 'clarity':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z" fill="#0078D4"/>
          <path d="M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm-1 9l-3-3 1.41-1.41L11 12.17l4.59-4.59L17 9l-6 6z" fill="#FFFFFF"/>
        </svg>
      );
    case 'hotjar':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="#FD3A5C"/>
          <path d="M9 8c0 2 2 3 3 5 1-2 3-3 3-5a3 3 0 0 0-6 0z" fill="#FFFFFF"/>
        </svg>
      );
    default:
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
          <polyline points="2 17 12 22 22 17"></polyline>
          <polyline points="2 12 12 17 22 12"></polyline>
        </svg>
      );
  }
};
