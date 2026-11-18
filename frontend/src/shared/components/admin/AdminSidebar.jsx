import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Newspaper,
  Image as GalleryIcon,
  Tag,
  Mail,
  ClipboardList,
  LogOut,
  X,
  User,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import api from '../../../services/api';

export default function AdminSidebar({
  sidebarOpen,
  setSidebarOpen,
  isCollapsed: externalIsCollapsed,
  toggleCollapse: externalToggleCollapse,
}) {
  const { admin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [leadBadges, setLeadBadges] = useState({ contact: 0, enquiry: 0 });

  const [internalCollapsed, setInternalCollapsed] = useState(() => {
    try {
      return localStorage.getItem('vr4web_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const isCollapsed = externalIsCollapsed !== undefined ? externalIsCollapsed : internalCollapsed;

  const toggleCollapse = () => {
    if (externalToggleCollapse) {
      externalToggleCollapse();
    } else {
      setInternalCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem('vr4web_sidebar_collapsed', String(next));
        } catch {
          // ignore
        }
        return next;
      });
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchLeadCounts = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        if (res.data && res.data.success && isMounted) {
          setLeadBadges({
            contact: res.data.newContactLeads || res.data.stats?.newContactLeads || 0,
            enquiry: res.data.newEnquiryLeads || res.data.stats?.newEnquiryLeads || 0,
          });
        }
      } catch {
        // Silent fallback
      }
    };
    fetchLeadCounts();
    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
    { name: 'Case Studies', path: '/admin/case-studies', icon: Briefcase },
    { name: 'Blogs', path: '/admin/blogs', icon: FileText },
    { name: 'Newspaper', path: '/admin/newspaper', icon: Newspaper },
    { name: 'Gallery', path: '/admin/gallery', icon: GalleryIcon },
    { name: 'Pricing', path: '/admin/pricing', icon: Tag },
    {
      name: 'Contact Leads',
      path: '/admin/contact-leads',
      icon: Mail,
      badge: leadBadges.contact > 0 ? `${leadBadges.contact} New` : null,
    },
    {
      name: 'Enquiry Leads',
      path: '/admin/enquiry-leads',
      icon: ClipboardList,
      badge: leadBadges.enquiry > 0 ? `${leadBadges.enquiry} New` : null,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-screen overflow-hidden bg-white text-black border-r border-slate-200/80 shadow-[4px_0_25px_rgba(0,0,0,0.02)] flex flex-col [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden
          transition-[width,transform] duration-300 ease-in-out will-change-[width]
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${isCollapsed ? 'w-20' : 'w-64 lg:w-72'}`}
      >
        {/* ===== Header ===== */}
        <div className="relative h-20 shrink-0 border-b border-slate-100 bg-white">
          {/* Logo: visible only when expanded */}
          {!isCollapsed && (
            <div className="absolute left-5 top-1/2 -translate-y-1/2 transition-opacity duration-200">
              <img
                src="/vr4web.png"
                alt="VR4WEB Logo"
                className="h-9 w-auto object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Toggle button: centered at x=40px when collapsed, right-aligned when expanded */}
          <button
            onClick={toggleCollapse}
            className="hidden md:flex absolute right-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-2xl bg-slate-100 hover:bg-blue-50 text-black hover:text-blue-600 border border-slate-200/80 hover:border-blue-300 items-center justify-center cursor-pointer shadow-2xs transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-5 h-5" />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
          </button>

          {/* Mobile close */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden absolute right-4 top-1/2 -translate-y-1/2 text-black hover:text-blue-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            title="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ===== Navigation ===== */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-2 space-y-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {/* Section label */}
          <div className="relative h-5 mb-2 px-2 flex items-center">
            {!isCollapsed && (
              <span className="text-[10px] font-extrabold tracking-wider text-black uppercase font-mono">
                Core Modules
              </span>
            )}
            <span
              className={`absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-600 transition-all duration-300 ${
                isCollapsed ? 'left-1/2 -translate-x-1/2 animate-pulse' : 'right-2'
              }`}
            />
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? location.pathname === item.path || location.pathname === `${item.path}/`
              : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.exact}
                onClick={() => setSidebarOpen(false)}
                title={item.name}
                className={`relative flex items-center ${
                  isCollapsed ? 'justify-center px-0 py-1.5' : 'gap-3 px-3 py-2'
                } rounded-2xl transition-all duration-200 group ${
                  isActive
                    ? isCollapsed
                      ? 'bg-blue-50/80 text-blue-900'
                      : 'bg-blue-50/90 text-blue-900 font-bold'
                    : 'text-black hover:text-blue-900 hover:bg-slate-100/70'
                }`}
              >
                {/* Active indicator bar - when expanded */}
                {!isCollapsed && isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-blue-600" />
                )}

                {/* Icon box: centered and completely visible */}
                <div
                  className={`relative w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                      : 'bg-slate-100 text-black border border-slate-200/60 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600'
                  }`}
                >
                  <Icon className="w-5 h-5" />

                  {/* Dot badge on icon (visible when collapsed) */}
                  {item.badge && isCollapsed && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white ring-1 ring-blue-300" />
                  )}
                </div>

                {/* Label and badges: rendered ONLY when expanded */}
                {!isCollapsed && (
                  <>
                    <span className="flex-1 font-bold text-[13px] tracking-tight truncate text-black group-hover:text-blue-900">
                      {item.name}
                    </span>

                    {item.badge ? (
                      <span
                        className={`px-2 py-0.5 text-[11px] font-semibold rounded-md font-sans shrink-0 ${
                          isActive
                            ? 'bg-blue-200 text-blue-900'
                            : 'bg-blue-50 text-blue-700 border border-blue-200/80'
                        }`}
                      >
                        {item.badge}
                      </span>
                    ) : isActive ? (
                      <ChevronRight className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    ) : null}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* ===== Footer ===== */}
        <div className="shrink-0 px-3 py-2.5 border-t border-slate-100 bg-slate-50/70 space-y-1">
          {/* Profile row */}
          <div
            className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-2'} py-1 overflow-hidden`}
            title={isCollapsed ? `Admin (${admin?.email || 'sanjay@niftysoft.in'})` : undefined}
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-black truncate">Admin</p>
                <p className="text-[11px] text-black font-sans font-semibold truncate">
                  {admin?.email || 'sanjay@niftysoft.in'}
                </p>
              </div>
            )}
          </div>

          {/* Logout row */}
          <button
            onClick={handleLogout}
            title={isCollapsed ? 'Sign Out' : undefined}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-2'} py-1 rounded-xl overflow-hidden text-black hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer`}
          >
            <div className="w-10 h-10 rounded-xl border border-slate-200/60 flex items-center justify-center shrink-0">
              <LogOut className="w-4 h-4" />
            </div>
            {!isCollapsed && (
              <span className="text-[13px] font-bold">Sign Out</span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}