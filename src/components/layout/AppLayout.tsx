import { ReactNode } from 'react';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';
import { DesktopHeader } from './DesktopHeader';
import { PWAPrompt } from '../pwa/PWAPrompt';
import { useSEO } from '@/hooks/useSEO';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  hideNav?: boolean;
  hideBottomNav?: boolean;
  showBack?: boolean;
  onBack?: () => void;
}

export function AppLayout({ children, title, hideNav = false, hideBottomNav = false, showBack = false, onBack }: AppLayoutProps) {
  const fullTitle = title ? `${title} | DHIC Staff Portal` : 'DHIC Staff Portal';
  
  useSEO({ 
    title: fullTitle,
    description: 'Official staff portal for DHIC (Darul Hasanath Islamic College) e-governance, managing attendance, tasks, reports, and student data.'
  });

  return (
    <div className="min-h-screen bg-background">
      <PWAPrompt />

      {/* Mobile Header - Hidden on Desktop */}
      <div className="lg:hidden">
        <Header title={title} showBack={showBack} onBack={onBack} />
      </div>

      {/* Desktop Sidebar — 240px (w-60) */}
      {!hideNav && <Sidebar />}

      {/* Desktop Top Header — offset by sidebar width */}
      {!hideNav && <DesktopHeader title={title} />}

      {/* Main Content Area */}
      {/* Mobile: top padding for header, bottom padding for nav, max-w-lg centered */}
      {/* Desktop: left margin for sidebar, top padding for header, constrained width */}
      <main className="
        pb-24 pt-4 px-4 max-w-lg mx-auto
        lg:ml-60 lg:pb-8 lg:pt-20 lg:px-0 lg:max-w-none lg:mx-0
      ">
        {/* Inner content wrapper — constrains max width on very wide screens */}
        <div className="lg:max-w-[1600px] lg:mx-auto lg:px-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      {!hideNav && !hideBottomNav && (
        <div className="lg:hidden">
          <BottomNav />
        </div>
      )}
    </div>
  );
}