import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from '../../shared/components/admin/AdminSidebar';
import AdminHeader from '../../shared/components/admin/AdminHeader';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('vr4web_sidebar_collapsed');
      if (saved !== null) return saved === 'true';
      // Auto-collapse on tablet / smaller laptop screens (< 1024px) for clean responsive spacing
      return typeof window !== 'undefined' ? window.innerWidth < 1024 : false;
    } catch {
      return false;
    }
  });
  const location = useLocation();

  // Listen for screen resize to automatically collapse on tablet view if window is shrunk
  useEffect(() => {
    const handleResize = () => {
      const saved = localStorage.getItem('vr4web_sidebar_collapsed');
      if (saved === null && window.innerWidth < 1024) {
        setIsCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('vr4web_sidebar_collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/case-studies')) return 'Case Studies Management';
    if (path.includes('/blogs')) return 'Blog Articles';
    if (path.includes('/newspaper')) return 'Newspaper Articles';
    if (path.includes('/gallery')) return 'Gallery Assets';
    if (path.includes('/pricing')) return 'Pricing Management';
    if (path.includes('/contact-leads')) return 'Contact Leads';
    if (path.includes('/enquiry-leads')) return 'Enquiry Leads';
    if (path.includes('/stories')) return 'Stories';
    return 'Dashboard Overview';
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-[#F8FAFC] text-slate-800 antialiased selection:bg-blue-600 selection:text-white font-sans flex">
      {/* Suppress public widgets (call-to-action, social icons, orm widgets) on admin dashboard */}
      <style>{`
        .widgetcraft-container,
        [class*="widgetcraft"],
        [id*="widgetcraft"],
        [class*="orm-"],
        div[id*="click-to-call"],
        div[id*="social_icons"],
        div[data-widget-type="social_icons"] {
          display: none !important;
        }
      `}</style>

      {/* 1. Fixed Left Sidebar */}
      <AdminSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isCollapsed={isCollapsed}
        toggleCollapse={toggleCollapse}
      />

      {/* 2. Main Content Area with Dynamic Margin & Independent Vertical Scroll */}
      <div
        className={`flex-1 h-screen flex flex-col min-w-0 overflow-hidden transition-all duration-300 ease-in-out ${
          isCollapsed ? 'md:ml-20' : 'md:ml-64 lg:ml-72'
        }`}
      >
        {/* Sticky Top Header */}
        <AdminHeader
          pageTitle={getPageTitle()}
          setSidebarOpen={setSidebarOpen}
        />

        {/* Independent Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-5 xl:p-6 w-full min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
