import { ReactNode } from 'react';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  hideNav?: boolean;
  showBack?: boolean;
}

export function AppLayout({ children, title, hideNav = false, showBack = false }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header - Hidden on Desktop */}
      <div className="lg:hidden">
        <Header title={title} showBack={showBack} />
      </div>

      {/* Desktop Sidebar */}
      {!hideNav && <Sidebar />}

      {/* Main Content Area */}
      {/* Mobile: Top padding for header, Bottom padding for nav, max-w-lg centered */}
      {/* Desktop: Left margin for sidebar, no top padding (nav handled), full width */}
      <main className="
        pb-24 pt-4 px-4 max-w-lg mx-auto 
        lg:ml-64 lg:pb-8 lg:pt-0 lg:px-8 lg:max-w-none lg:mx-0
      ">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      {!hideNav && (
        <div className="lg:hidden">
          <BottomNav />
        </div>
      )}
    </div>
  );
}