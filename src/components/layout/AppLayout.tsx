import { ReactNode } from 'react';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  hideNav?: boolean;
  showBack?: boolean;
}

export function AppLayout({ children, title, hideNav = false, showBack = false }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header title={title} showBack={showBack} />
      <main className="pb-24 pt-4 px-4 max-w-lg mx-auto">
        {children}
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
}