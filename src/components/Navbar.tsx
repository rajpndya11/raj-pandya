import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowUpRight, Sun, Moon, Sparkles } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenConnect: () => void;
  onOpenChat?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate, onOpenConnect, onOpenChat }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Theme state: 'ivory' (default light) or 'midnight' (dark)
  const [theme, setTheme] = useState<'ivory' | 'midnight'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('rp_portfolio_theme');
      if (stored === 'midnight') return 'midnight';
    }
    return 'ivory';
  });

  useEffect(() => {
    // Keep DOM in sync on mount
    if (theme === 'midnight') {
      document.body.classList.add('theme-midnight');
      document.documentElement.classList.add('dark');
    } else {
      document.body.classList.remove('theme-midnight');
      document.documentElement.classList.remove('dark');
    }

    // Listen to external theme changes across tabs or windows
    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<'ivory' | 'midnight'>;
      if (customEvent.detail && customEvent.detail !== theme) {
        setTheme(customEvent.detail);
      }
    };

    window.addEventListener('rp_portfolio_theme_changed', handleThemeChange);
    return () => window.removeEventListener('rp_portfolio_theme_changed', handleThemeChange);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'ivory' ? 'midnight' : 'ivory';
    setTheme(nextTheme);
    try {
      localStorage.setItem('rp_portfolio_theme', nextTheme);
      if (nextTheme === 'midnight') {
        document.body.classList.add('theme-midnight');
        document.documentElement.classList.add('dark');
      } else {
        document.body.classList.remove('theme-midnight');
        document.documentElement.classList.remove('dark');
      }
      window.dispatchEvent(new CustomEvent('rp_portfolio_theme_changed', { detail: nextTheme }));
    } catch (e) {
      console.warn('Could not persist theme', e);
    }
  };

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Skills', path: '/skills' },
    { label: 'Experience', path: '/experience' },
    { label: 'Projects', path: '/projects' },
  ];

  const handleNavClick = (path: string) => {
    onNavigate(path);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isActive = (path: string) => {
    if (path === '/') return currentPath === '/';
    return currentPath.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#F7F4ED]/90 backdrop-blur-md border-b border-[#DED8CC] transition-colors duration-250">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 sm:h-24">
          
          {/* Brand Logo & Monogram */}
          <div 
            onClick={() => handleNavClick('/')}
            className="cursor-pointer py-2"
          >
            <BrandLogo size="lg" />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavClick(item.path)}
                  className={`relative py-2 text-sm tracking-wider uppercase font-medium transition-colors cursor-pointer ${
                    active ? 'text-[#171A18] font-semibold' : 'text-[#77736B] hover:text-[#171A18]'
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#B08D57] rounded-full animate-fade-in" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Desktop Action Buttons: Theme Toggle & Connect CTA */}
          <div className="hidden md:flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#DED8CC] bg-[#EFE9DC]/60 hover:bg-[#EFE9DC] text-xs font-semibold tracking-wider transition-all duration-200 cursor-pointer shadow-xs select-none"
              aria-label={`Switch to ${theme === 'ivory' ? 'Midnight' : 'Ivory'} theme`}
              title={`Switch to ${theme === 'ivory' ? 'Midnight (dark)' : 'Ivory (light)'} theme`}
            >
              {theme === 'ivory' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-[#B08D57]" />
                  <span className="text-[11px] font-medium text-[#171A18] uppercase tracking-wide">Ivory</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span className="text-[11px] font-medium text-[#F7F4ED] uppercase tracking-wide">Midnight</span>
                </>
              )}
            </button>

            {/* Let's Connect CTA */}
            <button
              onClick={onOpenConnect}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase bg-[#171A18] text-[#F7F4ED] hover:bg-[#B08D57] hover:text-[#171A18] border border-transparent hover:border-[#171A18] transition-all duration-200 shadow-sm cursor-pointer"
            >
              <span>Let's Connect</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile Actions: Theme Toggle & Hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-[#DED8CC] text-[#171A18] hover:bg-[#EFE9DC] transition-colors cursor-pointer"
              aria-label={`Switch to ${theme === 'ivory' ? 'Midnight' : 'Ivory'} theme`}
              title={`Switch to ${theme === 'ivory' ? 'Midnight' : 'Ivory'} theme`}
            >
              {theme === 'ivory' ? (
                <Sun className="w-5 h-5 text-[#B08D57]" />
              ) : (
                <Moon className="w-5 h-5 text-[#D4AF37]" />
              )}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#171A18] hover:bg-[#EFE9DC] transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#DED8CC] bg-[#F7F4ED] px-4 pt-3 pb-6 space-y-3 transition-colors duration-250">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              className={`block w-full text-left py-2 px-3 rounded-lg text-sm tracking-wider uppercase font-medium transition-colors cursor-pointer ${
                isActive(item.path)
                  ? 'bg-[#EFE9DC] text-[#171A18] font-semibold text-[#B08D57]'
                  : 'text-[#77736B] hover:bg-[#EFE9DC] hover:text-[#171A18]'
              }`}
            >
              {item.label}
            </button>
          ))}

          {/* Mobile Theme Switcher Row */}
          <div className="pt-2 border-t border-[#DED8CC] flex items-center justify-between py-2 px-3">
            <span className="text-xs uppercase font-semibold tracking-wider text-[#77736B]">
              Theme Mode
            </span>
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#DED8CC] bg-[#EFE9DC] text-xs font-semibold cursor-pointer"
            >
              {theme === 'ivory' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-[#B08D57]" />
                  <span>Ivory (Light)</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Midnight (Dark)</span>
                </>
              )}
            </button>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenConnect();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-xs font-semibold tracking-wider uppercase bg-[#171A18] text-[#F7F4ED] hover:bg-[#B08D57] transition-colors cursor-pointer"
            >
              <span>Let's Connect</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
