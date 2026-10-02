import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ConnectModal } from './components/ConnectModal';
import { ScrollProgressBar } from './components/ScrollProgressBar';
import { HomePage } from './pages/HomePage';
import { SkillsPage } from './pages/SkillsPage';
import { ExperiencePage } from './pages/ExperiencePage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { AdminPage } from './pages/AdminPage';
import { storageService } from './services/storageService';

// Robust Error Boundary to guarantee the screen never stays blank
interface ErrorBoundaryProps {
  children: ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Portfolio ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F7F4ED] text-[#171A18] flex items-center justify-center p-6 text-center">
          <div className="max-w-md p-8 bg-white border border-[#DED8CC] rounded-2xl shadow-xl space-y-4">
            <h2 className="font-serif text-2xl font-bold">Something went wrong</h2>
            <p className="text-xs text-[#77736B]">
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/';
              }}
              className="px-6 py-2.5 rounded-full bg-[#171A18] text-[#F7F4ED] hover:bg-[#B08D57] text-xs font-semibold uppercase tracking-wider transition-colors"
            >
              Reload Portfolio
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const getInitialPath = (): string => {
    try {
      if (typeof window !== 'undefined') {
        const hash = window.location.hash;
        const pathname = window.location.pathname;
        const search = window.location.search;

        if (
          search && 
          (search.includes('admin') || search.includes('cms') || search.includes('page=admin'))
        ) {
          return '/admin';
        }
        if (hash && (hash.includes('admin') || hash === '#/admin' || hash === '#admin' || hash.includes('cms'))) {
          return '/admin';
        }
        if (pathname && (pathname.includes('/admin') || pathname.includes('admin.html'))) {
          return '/admin';
        }
        if (hash && hash.startsWith('#/')) {
          return hash.replace('#', '');
        }
        if (pathname && pathname !== '/index.html' && pathname !== '') {
          return pathname;
        }
      }
    } catch {
      // Ignore
    }
    return '/';
  };

  const [currentPath, setCurrentPath] = useState<string>(getInitialPath);
  const [isConnectOpen, setIsConnectOpen] = useState(false);

  useEffect(() => {
    // Sync cloud state (profile photo, copy, projects) from Firestore on load
    storageService.loadFromCloud();

    const handleLocationChange = () => {
      const hash = window.location.hash;
      const path = window.location.pathname;
      const search = window.location.search;

      if (
        search && 
        (search.includes('admin') || search.includes('cms') || search.includes('page=admin'))
      ) {
        setCurrentPath('/admin');
      } else if (hash && (hash.includes('admin') || hash === '#/admin' || hash === '#admin' || hash.includes('cms'))) {
        setCurrentPath('/admin');
      } else if (path && (path.includes('/admin') || path.includes('admin.html'))) {
        setCurrentPath('/admin');
      } else if (hash && hash.startsWith('#/')) {
        setCurrentPath(hash.replace('#', ''));
      } else {
        setCurrentPath(path && path !== '/index.html' ? path : '/');
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Secret owner shortcut: Ctrl+Shift+A or Cmd+Shift+A opens CMS admin
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        navigate('/admin');
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const navigate = (path: string) => {
    if (path !== currentPath) {
      try {
        window.history.pushState({}, '', path);
      } catch {
        // Fallback to hash if pushState fails in restricted context
        window.location.hash = path;
      }
      setCurrentPath(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Determine current route and params
  const renderCurrentView = () => {
    if (currentPath === '/' || currentPath === '' || currentPath === '/index.html') {
      return (
        <HomePage 
          onNavigate={navigate} 
          onOpenConnect={() => setIsConnectOpen(true)} 
        />
      );
    }

    if (currentPath === '/skills') {
      return <SkillsPage />;
    }

    if (currentPath === '/experience') {
      return <ExperiencePage onNavigate={navigate} />;
    }

    if (currentPath === '/projects') {
      return <ProjectsPage onNavigate={navigate} />;
    }

    if (currentPath.startsWith('/projects/')) {
      const slug = currentPath.replace('/projects/', '').split('/')[0].split('?')[0];
      return <ProjectDetailPage slug={slug} onNavigate={navigate} />;
    }

    if (currentPath.startsWith('/admin')) {
      return <AdminPage onNavigate={navigate} />;
    }

    // Default fallback to HomePage
    return (
      <HomePage 
        onNavigate={navigate} 
        onOpenConnect={() => setIsConnectOpen(true)} 
      />
    );
  };

  const isAdminRoute = currentPath.startsWith('/admin');

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-[#F7F4ED] text-[#171A18] selection:bg-[#B08D57]/30 selection:text-[#171A18]">
        
        {/* Subtle Gold Viewport Scroll Progress Bar */}
        <ScrollProgressBar />

        {/* Global Navbar (Only on public routes, hidden in admin) */}
        {!isAdminRoute && (
          <Navbar 
            currentPath={currentPath}
            onNavigate={navigate}
            onOpenConnect={() => setIsConnectOpen(true)}
          />
        )}

        {/* Main Page Canvas with Subtle Transition */}
        <main className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPath}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {renderCurrentView()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Global Classic Editorial Footer (Hidden in admin) */}
        {!isAdminRoute && (
          <Footer 
            onNavigate={navigate}
            onOpenConnect={() => setIsConnectOpen(true)}
          />
        )}

        {/* Connect Modal */}
        <ConnectModal 
          isOpen={isConnectOpen} 
          onClose={() => setIsConnectOpen(false)} 
        />

      </div>
    </ErrorBoundary>
  );
}
