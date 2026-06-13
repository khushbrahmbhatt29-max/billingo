import React from 'react';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  activeView: string;
  setActiveView: (view: string) => void;
  children: React.ReactNode;
}

export function Layout({ activeView, setActiveView, children }: LayoutProps) {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <main className="flex-1 h-screen overflow-y-auto print:overflow-visible print:bg-white print:h-auto">
        {children}
      </main>
    </div>
  );
}
