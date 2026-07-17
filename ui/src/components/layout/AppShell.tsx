import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';

/** Main authenticated layout: header + sidebar + scrollable content + footer. */
export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-full flex-col">
      <Header onToggleSidebar={() => setSidebarOpen((o) => !o)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden
          />
        )}
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
