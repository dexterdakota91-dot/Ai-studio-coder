import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

export function Layout({ children, mobileHeader }: { children: ReactNode, mobileHeader?: ReactNode }) {
  return (
    <div className="flex h-[100dvh] w-full bg-background text-foreground overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <main className="flex-1 flex flex-col min-w-0 bg-card md:rounded-tl-3xl shadow-sm md:border-l md:border-t md:border-border md:mt-4 mb-0 ml-0 mr-0 transition-all duration-300 relative overflow-hidden">
        {mobileHeader}
        {children}
      </main>
    </div>
  );
}
