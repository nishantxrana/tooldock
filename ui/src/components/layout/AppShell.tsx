import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';

/** Main authenticated layout: sidebar rail + content panel. */
export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-full overflow-hidden bg-sidebar">
      <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}
      <div className="flex flex-1 flex-col overflow-hidden bg-background lg:border-l lg:border-sidebar-border">
        <Header onToggleSidebar={() => setSidebarOpen((o) => !o)} />
        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <Outlet />
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
