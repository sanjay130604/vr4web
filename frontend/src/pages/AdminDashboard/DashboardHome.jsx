import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import { getImageUrl } from '../../utils/imageUrl';
import {
  Briefcase,
  FileText,
  Newspaper,
  Image as GalleryIcon,
  Mail,
  ClipboardList,
  Plus,
  RefreshCw,
  ChevronRight,
  TrendingUp,
  Calendar,
  Eye,
  Users,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Static config (full class strings so Tailwind can detect them)      */
/* ------------------------------------------------------------------ */
const CARD_THEMES = {
  blue: {
    border: 'hover:border-blue-500',
    shadow:
      'hover:shadow-[0_25px_50px_-12px_rgba(37,99,235,0.22),0_12px_24px_-8px_rgba(15,23,42,0.08)]',
    iconIdle: 'bg-blue-50 border-blue-100 text-blue-600',
    iconHover:
      'group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:shadow-blue-500/35',
    label: 'group-hover:text-blue-900',
    value: 'group-hover:text-blue-950',
    divider: 'group-hover:border-blue-100',
    link: 'group-hover:text-blue-600',
    badge:
      'bg-blue-50 border-blue-200/90 text-blue-700 group-hover:bg-blue-100 group-hover:border-blue-300',
    dot: 'bg-blue-600',
  },
  indigo: {
    border: 'hover:border-indigo-500',
    shadow:
      'hover:shadow-[0_25px_50px_-12px_rgba(99,102,241,0.22),0_12px_24px_-8px_rgba(15,23,42,0.08)]',
    iconIdle: 'bg-indigo-50 border-indigo-100 text-indigo-600',
    iconHover:
      'group-hover:bg-indigo-600 group-hover:border-indigo-600 group-hover:shadow-indigo-500/35',
    label: 'group-hover:text-indigo-900',
    value: 'group-hover:text-indigo-950',
    divider: 'group-hover:border-indigo-100',
    link: 'group-hover:text-indigo-600',
    badge:
      'bg-indigo-50 border-indigo-200/90 text-indigo-700 group-hover:bg-indigo-100 group-hover:border-indigo-300',
    dot: 'bg-indigo-600',
  },
  emerald: {
    border: 'hover:border-emerald-500',
    shadow:
      'hover:shadow-[0_25px_50px_-12px_rgba(16,185,129,0.22),0_12px_24px_-8px_rgba(15,23,42,0.08)]',
    iconIdle: 'bg-emerald-50 border-emerald-100 text-emerald-600',
    iconHover:
      'group-hover:bg-emerald-600 group-hover:border-emerald-600 group-hover:shadow-emerald-500/35',
    label: 'group-hover:text-emerald-900',
    value: 'group-hover:text-emerald-950',
    divider: 'group-hover:border-emerald-100',
    link: 'group-hover:text-emerald-600',
    badge: 'bg-emerald-50 border-emerald-200/80 text-emerald-800',
    dot: 'bg-emerald-600',
  },
};

const STATIC_BADGE_TONES = {
  slate: 'bg-slate-100 border-slate-200/80 text-black font-bold',
  emerald: 'bg-emerald-50 border-emerald-200/80 text-emerald-800 font-semibold',
};

const ACTIVITY_TABS = [
  { id: 'all', label: 'All Activity' },
  { id: 'contact', label: 'Contact Leads', countKey: 'contactLeads' },
  { id: 'enquiry', label: 'Enquiries', countKey: 'enquiryLeads' },
  { id: 'casestudy', label: 'Case Studies', countKey: 'caseStudies' },
  { id: 'blog', label: 'Blogs', countKey: 'blogs' },
];

const QUICK_ACTIONS = [
  { to: '/admin/case-studies?action=new', label: 'Add Case Study', Icon: Plus },
  { to: '/admin/blogs?action=new', label: 'Create Blog', Icon: Plus },
  { to: '/admin/newspaper?action=new', label: 'Upload Press', Icon: Newspaper },
  { to: '/admin/gallery?action=new', label: 'Upload Photo', Icon: GalleryIcon },
  { to: '/admin/contact-leads', label: 'Contact Leads', Icon: Mail },
  { to: '/admin/enquiry-leads', label: 'Enquiry Leads', Icon: ClipboardList },
];

/* ------------------------------------------------------------------ */
/* Stat card                                                           */
/* ------------------------------------------------------------------ */
function StatCard({
  theme,
  neutralIcon = false,
  Icon,
  label,
  value,
  caption,
  linkText,
  to,
  badge,
}) {
  const t = CARD_THEMES[theme];

  let badgeNode = null;
  if (badge?.type === 'new') {
    badgeNode =
      badge.count > 0 ? (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-semibold font-sans whitespace-nowrap shrink-0 transition-colors shadow-2xs ${t.badge}`}
        >
          {badge.trend ? (
            <TrendingUp className="w-3.5 h-3.5 shrink-0 text-blue-600 group-hover:scale-110 transition-transform" />
          ) : (
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.dot}`} />
          )}
          {badge.count} New
        </span>
      ) : (
        <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200/80 text-black text-[11px] font-bold font-sans whitespace-nowrap shrink-0 shadow-2xs">
          {badge.fallback}
        </span>
      );
  } else if (badge?.type === 'static') {
    badgeNode = (
      <span
        className={`px-2.5 py-1 rounded-md border text-[11px] font-sans whitespace-nowrap shrink-0 shadow-2xs ${STATIC_BADGE_TONES[badge.tone]}`}
      >
        {badge.text}
      </span>
    );
  }

  return (
    <div
      className={`bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] ${t.border} ${t.shadow} hover:-translate-y-2.5 hover:scale-[1.04] transition-all duration-300 ease-out flex flex-col justify-between group cursor-pointer relative hover:z-30 min-w-0`}
    >
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div
          className={`w-11 h-11 shrink-0 rounded-2xl border flex items-center justify-center shadow-xs transition-all duration-300 group-hover:scale-125 group-hover:text-white group-hover:shadow-lg group-hover:-translate-y-0.5 ${
            neutralIcon ? 'bg-slate-100 border-slate-200 text-black' : t.iconIdle
          } ${t.iconHover}`}
        >
          <Icon className="w-5 h-5 transition-all duration-300 group-hover:scale-110" />
        </div>
        {badgeNode}
      </div>

      <div className="mt-4 min-w-0">
        <span
          className={`text-xs font-bold text-black block leading-snug break-words transition-colors ${t.label}`}
        >
          {label}
        </span>
        <div
          className={`text-2xl sm:text-3xl font-black text-black mt-1 tracking-tight transition-colors ${t.value}`}
        >
          {value}
        </div>
        <p className="text-[11px] text-black font-medium mt-1 truncate">{caption}</p>
      </div>

      <div
        className={`mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs transition-colors ${t.divider}`}
      >
        <Link
          to={to}
          className={`text-black font-bold flex items-center justify-between gap-2 w-full transition-colors ${t.link}`}
        >
          <span className="truncate">{linkText}</span>
          <ChevronRight className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-1.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function DashboardHome() {
  const { admin } = useAuth();

  const [stats, setStats] = useState({
    caseStudies: 0,
    blogs: 0,
    publishedBlogs: 0,
    newspapers: 0,
    galleryImages: 0,
    contactLeads: 0,
    enquiryLeads: 0,
    newContactLeads: 0,
    newEnquiryLeads: 0,
  });

  const [recentCaseStudies, setRecentCaseStudies] = useState([]);
  const [recentBlogs, setRecentBlogs] = useState([]);
  const [recentContactLeads, setRecentContactLeads] = useState([]);
  const [recentEnquiryLeads, setRecentEnquiryLeads] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const fetchDashboardData = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const res = await authService.getDashboardStats();
      if (res && res.success) {
        setStats({
          caseStudies: res.caseStudies ?? res.stats?.totalCaseStudies ?? 0,
          blogs: res.blogs ?? res.stats?.totalBlogs ?? 0,
          publishedBlogs: res.publishedBlogs ?? res.stats?.publishedBlogs ?? res.blogs ?? 0,
          newspapers: res.newspapers ?? res.stats?.totalNewspaper ?? 0,
          galleryImages: res.galleryImages ?? res.stats?.totalGallery ?? 0,
          contactLeads: res.contactLeads ?? res.stats?.totalContactLeads ?? 0,
          enquiryLeads: res.enquiryLeads ?? res.stats?.totalEnquiryLeads ?? 0,
          newContactLeads: res.newContactLeads ?? res.stats?.newContactLeads ?? 0,
          newEnquiryLeads: res.newEnquiryLeads ?? res.stats?.newEnquiryLeads ?? 0,
        });

        setRecentCaseStudies(res.recentCaseStudies || []);
        setRecentBlogs(res.recentBlogs || []);
        setRecentContactLeads(res.recentContactLeads || []);
        setRecentEnquiryLeads(res.recentEnquiryLeads || []);
        setRecentActivity(res.recentActivity || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const filteredActivity = recentActivity.filter((item) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'contact') return item.type === 'Contact Lead';
    if (activeTab === 'enquiry') return item.type === 'Enquiry Lead';
    if (activeTab === 'casestudy') return item.type === 'Case Study';
    if (activeTab === 'blog') return item.type === 'Blog';
    return true;
  });

  const totalAllLeads = stats.contactLeads + stats.enquiryLeads;
  const totalNewLeads = stats.newContactLeads + stats.newEnquiryLeads;
  const adminName = admin?.name
    ? admin.name.replace(/VR4Web SuperAdmin/gi, 'Admin').replace(/SuperAdmin/gi, 'Admin')
    : 'Admin';

  // 1 column on phones, 2 columns from sm and up
  const getDynamicGridCols = (count) => {
    if (count <= 1) return 'grid grid-cols-1 gap-4 sm:gap-6 w-full min-w-0';
    return 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full min-w-0';
  };

  // Shared card-image height: ratio based, never a fixed tall height
  const IMAGE_CARD_SIZE = 'w-full min-w-0 aspect-[4/3] min-h-[220px]';

  const renderStatusBadge = (status) => {
    if (!status) return null;
    const s = String(status).toLowerCase();
    const base =
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] border font-sans shadow-2xs whitespace-nowrap shrink-0';
    if (s.includes('new')) {
      return (
        <span className={`${base} font-semibold bg-amber-50 text-amber-800 border-amber-200/90`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          {status}
        </span>
      );
    }
    if (s.includes('contacted')) {
      return (
        <span className={`${base} font-semibold bg-blue-50 text-blue-800 border-blue-200/90`}>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
          {status}
        </span>
      );
    }
    return (
      <span className={`${base} font-bold bg-slate-100 text-black border-slate-300`}>
        <span className="w-1.5 h-1.5 rounded-full bg-black" />
        {status}
      </span>
    );
  };

  const sectionCard =
    'bg-white p-4 sm:p-6 lg:p-7 rounded-3xl border border-slate-200/80 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] min-w-0';

  return (
    <div className="space-y-6 sm:space-y-8 w-full max-w-full min-w-0 pb-12">
      {/* 1. HEADER AREA */}
      <div
        className={`${sectionCard} flex flex-col lg:flex-row lg:items-center justify-between gap-4`}
      >
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-blue-600 tracking-tight break-words">
            Dashboard Overview
          </h1>
          <p className="text-xs sm:text-sm text-black font-medium mt-1">
            Welcome back, <span className="font-bold text-black">{adminName}</span>. Here is your
            platform summary and incoming leads.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative inline-flex items-center bg-white border border-slate-200 rounded-2xl px-3.5 py-2 text-xs font-bold text-black shadow-2xs hover:border-blue-400 transition-colors">
            <Calendar className="w-3.5 h-3.5 text-blue-600 mr-2 shrink-0" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-black focus:outline-hidden cursor-pointer pr-1"
            >
              <option value="all">All Time Records</option>
              <option value="month">This Month</option>
              <option value="30days">Last 30 Days</option>
            </select>
          </div>

          <button
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-black hover:text-blue-700 text-xs font-bold shadow-2xs hover:shadow-xs transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
            title="Refresh Real-time Database Counts"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-blue-600 ${refreshing ? 'animate-spin' : ''}`}
            />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* 2. STATISTIC CARDS
          1 col (phone) -> 2 cols (>=480px) -> 3 cols (lg) -> 6 cols (2xl) */}
      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4">
        <StatCard
          theme="blue"
          Icon={Users}
          label="Total Client Leads"
          value={loading ? '...' : totalAllLeads}
          caption="Public form & project inquiries"
          linkText="Manage leads"
          to="/admin/contact-leads"
          badge={{ type: 'new', count: totalNewLeads, trend: true, fallback: 'Live' }}
        />
        <StatCard
          theme="blue"
          Icon={Mail}
          label="Contact Leads"
          value={loading ? '...' : stats.contactLeads}
          caption="General messages & requests"
          linkText="View Inquiries"
          to="/admin/contact-leads"
          badge={{ type: 'new', count: stats.newContactLeads, fallback: 'Handled' }}
        />
        <StatCard
          theme="indigo"
          Icon={ClipboardList}
          label="Project Enquiries"
          value={loading ? '...' : stats.enquiryLeads}
          caption="Client budgets & scopes"
          linkText="View Proposals"
          to="/admin/enquiry-leads"
          badge={{ type: 'new', count: stats.newEnquiryLeads, fallback: 'Handled' }}
        />
        <StatCard
          theme="blue"
          neutralIcon
          Icon={Briefcase}
          label="Total Case Studies"
          value={loading ? '...' : stats.caseStudies}
          caption="Client deliverables & solutions"
          linkText="Manage Studies"
          to="/admin/case-studies"
          badge={{ type: 'static', text: 'Portfolio', tone: 'slate' }}
        />
        <StatCard
          theme="emerald"
          neutralIcon
          Icon={FileText}
          label="Published Blogs"
          value={loading ? '...' : stats.publishedBlogs}
          caption="Tech guides & marketing insights"
          linkText="Manage Blogs"
          to="/admin/blogs"
          badge={{ type: 'static', text: 'Articles', tone: 'emerald' }}
        />
        <StatCard
          theme="blue"
          neutralIcon
          Icon={GalleryIcon}
          label="Newspaper & Gallery"
          value={loading ? '...' : stats.newspapers + stats.galleryImages}
          caption={`${stats.newspapers} Press • ${stats.galleryImages} Photos`}
          linkText="Explore Assets"
          to="/admin/gallery"
          badge={{ type: 'static', text: 'Assets', tone: 'slate' }}
        />
      </div>

      {/* 3. QUICK ACTIONS */}
      <div className={`${sectionCard} space-y-4`}>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <div className="min-w-0">
            <h3 className="text-base font-black text-blue-600">Quick Actions</h3>
            <p className="text-xs text-black font-medium mt-0.5">
              Instant one-click shortcuts to add or manage content
            </p>
          </div>
          <span className="hidden sm:inline text-xs font-sans font-bold text-black whitespace-nowrap">
            1-Click Admin Operations
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          {QUICK_ACTIONS.map(({ to, label, Icon }) => (
            <Link
              key={label}
              to={to}
              className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-slate-50 hover:bg-white border border-slate-200/80 hover:border-blue-500 hover:shadow-[0_20px_35px_-10px_rgba(37,99,235,0.2)] hover:-translate-y-2 hover:scale-[1.03] text-center transition-all duration-300 group shadow-2xs relative hover:z-20 cursor-pointer min-w-0"
            >
              <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 text-black group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 group-hover:scale-110 group-hover:shadow-md group-hover:shadow-blue-500/30 flex items-center justify-center mb-2 shadow-2xs transition-all duration-300">
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-black group-hover:text-blue-900 leading-tight transition-colors">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* 4. ACTIVITY FEED */}
      <div className={`${sectionCard} space-y-5`}>
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-black text-blue-600">Interactive Activity Stream</h3>
            <p className="text-xs text-black font-medium mt-0.5">
              Real-time feed across client enquiries, contacts, and published media
            </p>
          </div>

          {/* Tabs scroll horizontally instead of wrapping/overflowing */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-bold overflow-x-auto max-w-full [scrollbar-width:thin]">
            {ACTIVITY_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 font-bold ${
                  activeTab === tab.id
                    ? 'bg-black text-white shadow-xs'
                    : 'text-black hover:text-blue-600 hover:bg-white'
                }`}
              >
                {tab.label}
                {tab.countKey ? ` (${stats[tab.countKey]})` : ''}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : filteredActivity.length === 0 ? (
          <div className="py-12 text-center text-black font-medium text-xs">
            No activity found for this category filter.
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredActivity.slice(0, 7).map((item, index) => {
              const isContact = item.type === 'Contact Lead';
              const isEnquiry = item.type === 'Enquiry Lead';
              const isCaseStudy = item.type === 'Case Study';
              const isBlog = item.type === 'Blog';

              let linkTo = '/admin';
              if (isContact) linkTo = '/admin/contact-leads';
              if (isEnquiry) linkTo = '/admin/enquiry-leads';
              if (isCaseStudy) linkTo = '/admin/case-studies';
              if (isBlog) linkTo = '/admin/blogs';

              return (
                <div
                  key={index}
                  className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3 sm:p-4 rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-200/80 hover:border-blue-400 hover:shadow-[0_12px_28px_-6px_rgba(37,99,235,0.15)] hover:-translate-y-1 hover:scale-[1.01] transition-all duration-300 shadow-2xs group relative hover:z-10 cursor-pointer"
                >
                  {/* Left: icon + titles (takes all free space, truncates) */}
                  <div className="flex items-center gap-3 min-w-0 flex-1 basis-[200px]">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-black flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 group-hover:shadow-md group-hover:shadow-blue-500/30 transition-all duration-300">
                      {isContact ? (
                        <Mail className="w-4 h-4" />
                      ) : isEnquiry ? (
                        <ClipboardList className="w-4 h-4" />
                      ) : isCaseStudy ? (
                        <Briefcase className="w-4 h-4" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-bold text-black text-xs sm:text-sm truncate min-w-0 group-hover:text-blue-700 transition-colors font-sans">
                          {item.name || item.title || 'Untitled Record'}
                        </span>
                        <span className="hidden sm:inline-block shrink-0 whitespace-nowrap px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-black border border-slate-300 font-sans shadow-2xs">
                          {item.type}
                        </span>
                      </div>
                      <p className="text-xs text-black font-medium truncate mt-0.5 font-sans">
                        {item.email
                          ? item.email
                          : item.category
                          ? `Category: ${item.category}`
                          : item.subject
                          ? `Subject: ${item.subject}`
                          : 'Platform record'}
                      </p>
                    </div>
                  </div>

                  {/* Right: status, date, action (wraps below on tight widths) */}
                  <div className="flex items-center gap-3 shrink-0 ml-auto">
                    {item.status && renderStatusBadge(item.status)}

                    <span className="hidden lg:inline-block whitespace-nowrap text-xs text-black font-sans font-semibold">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}
                    </span>

                    <Link
                      to={linkTo}
                      className="shrink-0 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white hover:bg-black text-black hover:text-white border border-slate-300 hover:border-black text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
                      title="Inspect Record"
                      aria-label="View record"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">View</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. RECENT LEADS (stacked until xl so rows have room) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Contact Leads */}
        <div className={`${sectionCard} flex flex-col justify-between`}>
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 shrink-0 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-blue-600 text-base">Recent Contact Leads</h3>
                  <p className="text-xs text-black font-medium">
                    Messages from website contact form
                  </p>
                </div>
              </div>
              <Link
                to="/admin/contact-leads"
                className="shrink-0 whitespace-nowrap px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-blue-50 text-black hover:text-blue-700 border border-slate-200 hover:border-blue-200 text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 rounded-2xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : recentContactLeads.length === 0 ? (
              <div className="py-8 text-center text-xs text-black font-medium">
                No contact form submissions recorded yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentContactLeads.slice(0, 4).map((lead) => (
                  <div
                    key={lead._id}
                    className="p-3 sm:p-3.5 rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-200/80 hover:border-blue-500 hover:shadow-[0_12px_25px_-6px_rgba(37,99,235,0.15)] hover:-translate-y-1 transition-all duration-300 flex items-center justify-between gap-3 relative hover:z-10 group cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-bold text-xs sm:text-sm text-black group-hover:text-blue-700 truncate max-w-full transition-colors font-sans">
                          {lead.name}
                        </span>
                        {renderStatusBadge(lead.status)}
                      </div>
                      <p className="text-xs text-black truncate mt-0.5 font-sans font-medium">
                        {lead.email} • {lead.phone}
                      </p>
                      <p className="text-xs text-black font-medium truncate mt-0.5 font-sans">
                        Subject:{' '}
                        <span className="font-bold text-black">{lead.subject || 'Inquiry'}</span>
                      </p>
                    </div>

                    <Link
                      to="/admin/contact-leads"
                      className="p-2 rounded-xl bg-white border border-slate-200 group-hover:border-blue-600 group-hover:bg-blue-600 group-hover:text-white text-black text-xs font-bold shrink-0 shadow-2xs transition-all duration-300"
                      title="Inspect & Reply"
                      aria-label="Inspect and reply"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Enquiry Leads */}
        <div className={`${sectionCard} flex flex-col justify-between`}>
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 shrink-0 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-blue-600 text-base">Recent Enquiry Leads</h3>
                  <p className="text-xs text-black font-medium">
                    Client proposals with budgets & scope
                  </p>
                </div>
              </div>
              <Link
                to="/admin/enquiry-leads"
                className="shrink-0 whitespace-nowrap px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-indigo-50 text-black hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 rounded-2xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : recentEnquiryLeads.length === 0 ? (
              <div className="py-8 text-center text-xs text-black font-medium">
                No project enquiries recorded yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentEnquiryLeads.slice(0, 4).map((enquiry) => (
                  <div
                    key={enquiry._id}
                    className="p-3 sm:p-3.5 rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-200/80 hover:border-indigo-500 hover:shadow-[0_12px_25px_-6px_rgba(99,102,241,0.15)] hover:-translate-y-1 transition-all duration-300 flex items-center justify-between gap-3 relative hover:z-10 group cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-bold text-xs sm:text-sm text-black group-hover:text-indigo-700 truncate max-w-full transition-colors font-sans">
                          {enquiry.name}
                        </span>
                        {enquiry.company && (
                          <span className="text-xs text-black font-sans font-bold truncate max-w-full">
                            ({enquiry.company})
                          </span>
                        )}
                        {renderStatusBadge(enquiry.status)}
                      </div>
                      {/* Allow up to 2 lines so the budget is never cut off */}
                      <p className="text-xs text-black mt-0.5 font-sans font-medium line-clamp-2 break-words">
                        {enquiry.projectType || 'General Project'} • Budget:{' '}
                        <span className="text-black font-black font-sans">
                          {enquiry.projectBudget || 'Discuss'}
                        </span>
                      </p>
                    </div>

                    <Link
                      to="/admin/enquiry-leads"
                      className="p-2 rounded-xl bg-white border border-slate-200 group-hover:border-indigo-600 group-hover:bg-indigo-600 group-hover:text-white text-black text-xs font-bold shrink-0 shadow-2xs transition-all duration-300"
                      title="Inspect & Respond"
                      aria-label="Inspect and respond"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6. LATEST CASE STUDIES */}
      <div className={`${sectionCard} space-y-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 shrink-0 rounded-xl bg-slate-100 border border-slate-200 text-black flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-blue-600 text-base">Latest Case Studies</h3>
              <p className="text-xs text-black font-medium">
                Enterprise client showcases & project architecture
              </p>
            </div>
          </div>
          <Link
            to="/admin/case-studies"
            className="shrink-0 whitespace-nowrap px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-blue-50 text-black hover:text-blue-700 border border-slate-200 hover:border-blue-200 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <span>Manage All ({stats.caseStudies})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className={getDynamicGridCols(recentCaseStudies.length || 2)}>
            {[1, 2].map((i) => (
              <div
                key={i}
                className={`${IMAGE_CARD_SIZE} rounded-2xl sm:rounded-3xl bg-slate-100 animate-pulse`}
              />
            ))}
          </div>
        ) : recentCaseStudies.length === 0 ? (
          <div className="py-8 text-center text-xs text-black font-medium">
            No case studies found. Click &quot;Add Case Study&quot; in Quick Actions to publish.
          </div>
        ) : (
          <div className={getDynamicGridCols(recentCaseStudies.length)}>
            {recentCaseStudies.map((study) => (
              <div
                key={study._id}
                className={`${IMAGE_CARD_SIZE} relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/80 hover:border-blue-500 hover:shadow-[0_20px_40px_-10px_rgba(37,99,235,0.28)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-end group shadow-2xs cursor-pointer bg-slate-900`}
              >
                <img
                  src={getImageUrl(study.featuredImage, '/case-study/property.png')}
                  alt={study.title}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/case-study/property.png';
                  }}
                  className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 pointer-events-none select-none"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent pointer-events-none" />

                {/* Title above button; side by side only on very wide cards */}
                <div className="relative z-10 p-4 sm:p-5 flex flex-col 2xl:flex-row 2xl:items-end justify-between gap-3 w-full min-w-0">
                  <h4 className="min-w-0 font-black text-white text-sm sm:text-base lg:text-lg line-clamp-2 leading-snug drop-shadow-md group-hover:text-blue-300 transition-colors font-sans">
                    {study.title}
                  </h4>
                  <Link
                    to="/admin/case-studies"
                    className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-600/30 transition-all shrink-0 group/btn whitespace-nowrap self-start 2xl:self-auto max-w-full"
                  >
                    <span className="truncate">Edit Case Study</span>
                    <ChevronRight className="w-3.5 h-3.5 shrink-0 transition-transform group-hover/btn:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 7. LATEST BLOGS */}
      <div className={`${sectionCard} space-y-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 shrink-0 rounded-xl bg-slate-100 border border-slate-200 text-black flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-blue-600 text-base">Latest Blog Articles</h3>
              <p className="text-xs text-black font-medium">
                Industry insights, web engineering & visibility
              </p>
            </div>
          </div>
          <Link
            to="/admin/blogs"
            className="shrink-0 whitespace-nowrap px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-blue-50 text-black hover:text-blue-700 border border-slate-200 hover:border-blue-200 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <span>Manage All ({stats.blogs})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className={getDynamicGridCols(recentBlogs.length || 2)}>
            {[1, 2].map((i) => (
              <div
                key={i}
                className={`${IMAGE_CARD_SIZE} rounded-2xl sm:rounded-3xl bg-slate-100 animate-pulse`}
              />
            ))}
          </div>
        ) : recentBlogs.length === 0 ? (
          <div className="py-8 text-center text-xs text-black font-medium">
            No blog posts published yet. Use &quot;Create Blog&quot; in Quick Actions to start.
          </div>
        ) : (
          <div className={getDynamicGridCols(recentBlogs.length)}>
            {recentBlogs.map((blog) => (
              <div
                key={blog._id}
                className={`${IMAGE_CARD_SIZE} relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/80 hover:border-blue-500 hover:shadow-[0_20px_40px_-10px_rgba(37,99,235,0.28)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-end group shadow-2xs cursor-pointer bg-slate-900`}
              >
                <img
                  src={getImageUrl(blog.featuredImage?.url || blog.imageUrl, '/blogs/blogs-banner.png')}
                  alt={blog.title}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/blogs/blogs-banner.png';
                  }}
                  className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 pointer-events-none select-none"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent pointer-events-none" />

                <div className="relative z-10 p-4 sm:p-5 flex flex-col 2xl:flex-row 2xl:items-end justify-between gap-3 w-full min-w-0">
                  <h4 className="min-w-0 font-black text-white text-sm sm:text-base lg:text-lg line-clamp-2 leading-snug drop-shadow-md group-hover:text-blue-300 transition-colors font-sans">
                    {blog.title}
                  </h4>
                  <Link
                    to="/admin/blogs"
                    className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-600/30 transition-all shrink-0 group/btn whitespace-nowrap self-start 2xl:self-auto max-w-full"
                  >
                    <span className="truncate">Edit Article</span>
                    <ChevronRight className="w-3.5 h-3.5 shrink-0 transition-transform group-hover/btn:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}