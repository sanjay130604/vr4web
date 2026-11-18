import { Menu, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdminHeader({
  pageTitle = 'Dashboard',
  setSidebarOpen,
}) {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  const adminDisplayName = admin?.name
    ? admin.name.replace(/VR4Web SuperAdmin/gi, 'Admin').replace(/SuperAdmin/gi, 'Admin')
    : 'Admin';

  return (
    <header className="min-h-16 lg:min-h-20 py-2.5 px-3.5 sm:px-5 lg:px-6 xl:px-8 bg-white border-b border-slate-200/80 flex items-center justify-between gap-3 sticky top-0 z-30 shadow-2xs transition-all duration-300">
      {/* Left: toggle + titles (min-w-0 lets it shrink so truncate works) */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
        {/* Mobile Sidebar Open Toggle */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden shrink-0 p-2 rounded-xl text-black hover:bg-blue-50 hover:text-blue-600 border border-slate-200 cursor-pointer transition-colors"
          title="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0 flex-1">
          {/* Breadcrumbs */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-black font-semibold whitespace-nowrap min-w-0 mb-0.5">
            <span className="text-black font-bold shrink-0">VR4WEB</span>
            <span className="text-black/50 font-bold shrink-0">/</span>
            <span className="text-blue-600 font-bold shrink-0">Admin</span>
            <span className="text-black/50 font-bold shrink-0">/</span>
            <span className="text-black font-bold truncate min-w-0">{pageTitle}</span>
          </div>
          <h1
            className="text-base sm:text-lg lg:text-xl xl:text-2xl font-black text-blue-600 tracking-tight leading-tight truncate"
            title={pageTitle}
          >
            {pageTitle}
          </h1>
        </div>
      </div>

      {/* Right: Admin Profile & Actions */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        {/* Name visible from sm; email only on xl+ */}
        <div className="hidden sm:flex flex-col text-right min-w-0 max-w-[140px] xl:max-w-[240px]">
          <span className="text-xs font-bold text-black flex items-center justify-end gap-1.5 min-w-0">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="truncate">{adminDisplayName}</span>
          </span>
          <span className="hidden xl:block text-[11px] text-black font-sans font-medium truncate">
            {admin?.email}
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="shrink-0 p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-black hover:text-rose-600 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer group"
          title="Sign out of admin session"
          aria-label="Logout"
        >
          <LogOut className="w-4 h-4 text-black group-hover:text-rose-600" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}